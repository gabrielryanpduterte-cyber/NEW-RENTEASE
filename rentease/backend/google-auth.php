<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/config/google-oauth.php';

require_methods(['POST']);

$payload = request_payload();
$action = request_action($payload);

try {
    if ($action === 'google-auth') {
        handle_google_auth($payload);
    }

    json_response(
        false,
        'Invalid action.',
        new stdClass(),
        ['Use ?action=google-auth'],
        400
    );
} catch (Throwable $exception) {
    handle_exception($exception, 'Google auth request failed', null);
}

function handle_google_auth(array $payload): void
{
    if (!defined('GOOGLE_OAUTH_ENABLED') || !GOOGLE_OAUTH_ENABLED) {
        json_response(false, 'Google OAuth is disabled.', new stdClass(), [], 403);
    }

    require_fields($payload, ['google_token']);

    $googleToken = trim((string)$payload['google_token']);
    $role = isset($payload['role']) ? strtolower(trim((string)$payload['role'])) : null;
    $contactNumber = isset($payload['contact_number']) ? trim((string)$payload['contact_number']) : null;

    $googleUser = verify_google_token($googleToken);
    if (!$googleUser) {
        json_response(false, 'Invalid Google token.', new stdClass(), ['Could not verify Google authentication.'], 401);
    }

    $googleId = (string)$googleUser['sub'];
    $email = strtolower(trim((string)$googleUser['email']));
    $fullName = trim((string)$googleUser['name']);
    $profilePicture = isset($googleUser['picture']) ? trim((string)$googleUser['picture']) : null;

    $existingByGoogleId = db()->prepare('SELECT * FROM users WHERE google_id = :google_id LIMIT 1');
    $existingByGoogleId->execute([':google_id' => $googleId]);
    $userByGoogleId = $existingByGoogleId->fetch();

    if ($userByGoogleId) {
        if ($userByGoogleId['account_status'] !== 'active') {
            json_response(false, 'Account is inactive.', new stdClass(), ['Your account has been deactivated.'], 403);
        }

        if ($role && $userByGoogleId['role'] !== $role) {
            json_response(false, 'Role mismatch.', new stdClass(), ['This account is registered with a different role.'], 400);
        }

        login_user($userByGoogleId);
        log_activity((int)$userByGoogleId['user_id'], 'User login via Google OAuth', 'auth');
        json_response(true, 'Login successful.', sanitize_user($userByGoogleId), []);
    }

    $existingByEmail = db()->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
    $existingByEmail->execute([':email' => $email]);
    $userByEmail = $existingByEmail->fetch();

    if ($userByEmail) {
        $update = db()->prepare(
            'UPDATE users 
             SET google_id = :google_id, 
                 profile_picture = :profile_picture, 
                 auth_provider = :auth_provider,
                 email_verified = 1
             WHERE user_id = :user_id'
        );
        $update->execute([
            ':google_id' => $googleId,
            ':profile_picture' => $profilePicture,
            ':auth_provider' => 'google',
            ':user_id' => (int)$userByEmail['user_id'],
        ]);

        $refreshed = db()->prepare('SELECT * FROM users WHERE user_id = :user_id LIMIT 1');
        $refreshed->execute([':user_id' => (int)$userByEmail['user_id']]);
        $linkedUser = $refreshed->fetch();

        if ($linkedUser['account_status'] !== 'active') {
            json_response(false, 'Account is inactive.', new stdClass(), ['Your account has been deactivated.'], 403);
        }

        if ($role && $linkedUser['role'] !== $role) {
            json_response(false, 'Role mismatch.', new stdClass(), ['This account is registered with a different role.'], 400);
        }

        login_user($linkedUser);
        log_activity((int)$linkedUser['user_id'], 'Google account linked and logged in', 'auth');
        json_response(true, 'Google account linked successfully.', sanitize_user($linkedUser), []);
    }

    if (!$role || !$contactNumber) {
        json_response(false, 'Additional information required.', [
            'google_user' => [
                'name' => $fullName,
                'email' => $email,
                'picture' => $profilePicture,
            ],
        ], ['role and contact_number are required for new users.'], 400);
    }

    $errors = [];
    if (!in_array($role, ['seeker', 'parent', 'owner'], true)) {
        $errors[] = 'role must be seeker, parent, or owner.';
    }
    if (defined('GOOGLE_ALLOW_ADMIN_ROLE') && !GOOGLE_ALLOW_ADMIN_ROLE && $role === 'admin') {
        $errors[] = 'Admin accounts cannot be created via Google OAuth.';
    }
    if ($contactNumber === '') {
        $errors[] = 'contact_number is required.';
    }

    if (!empty($errors)) {
        json_response(false, 'Validation failed.', new stdClass(), $errors, 400);
    }

    $insert = db()->prepare(
        'INSERT INTO users (full_name, email, password_hash, role, contact_number, account_status, google_id, profile_picture, auth_provider, email_verified, created_at)
         VALUES (:full_name, :email, NULL, :role, :contact_number, :account_status, :google_id, :profile_picture, :auth_provider, 1, NOW())'
    );
    $insert->execute([
        ':full_name' => $fullName,
        ':email' => $email,
        ':role' => $role,
        ':contact_number' => $contactNumber,
        ':account_status' => 'active',
        ':google_id' => $googleId,
        ':profile_picture' => $profilePicture,
        ':auth_provider' => 'google',
    ]);

    $newUserId = (int)db()->lastInsertId();
    $newUser = find_user_by_id($newUserId);

    if (!$newUser) {
        json_response(false, 'User creation failed.', new stdClass(), [], 500);
    }

    login_user($newUser);
    log_activity($newUserId, 'User registered via Google OAuth', 'auth');

    json_response(true, 'Registration successful.', sanitize_user($newUser), [], 201);
}

function verify_google_token(string $token): ?array
{
    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($token);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return null;
    }

    $data = json_decode($response, true);
    if (!$data || !isset($data['sub'], $data['email'], $data['name'])) {
        return null;
    }

    if (defined('GOOGLE_CLIENT_ID') && $data['aud'] !== GOOGLE_CLIENT_ID) {
        return null;
    }

    return $data;
}
