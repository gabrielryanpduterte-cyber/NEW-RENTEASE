<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST']);
ensure_seeker_feature_schema();

$method = request_method();
$payload = $method === 'POST' ? request_payload() : [];
$action = request_action($payload);

try {
    if ($method === 'POST' && $action === 'register') {
        handle_register($payload);
    }

    if ($method === 'POST' && $action === 'login') {
        handle_login($payload);
    }

    if ($method === 'POST' && $action === 'logout') {
        handle_logout();
    }

    if ($method === 'POST' && $action === 'update_profile') {
        handle_update_profile($payload);
    }

    if ($method === 'POST' && $action === 'change_password') {
        handle_change_password($payload);
    }

    if ($method === 'GET' && ($action === '' || $action === 'me')) {
        handle_me();
    }

    json_response(
        false,
        'Invalid auth action.',
        new stdClass(),
        ['Use ?action=register, ?action=login, ?action=logout, ?action=update_profile, ?action=change_password, or GET ?action=me.'],
        400
    );
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Auth request failed', $user ? (int)$user['user_id'] : null);
}

function handle_register(array $payload): void
{
    require_fields($payload, ['full_name', 'email', 'password', 'role', 'contact_number']);

    $fullName = trim((string)$payload['full_name']);
    $email = strtolower(trim((string)$payload['email']));
    $password = (string)$payload['password'];
    $role = strtolower(trim((string)$payload['role']));
    $contactNumber = trim((string)$payload['contact_number']);
    $emergencyContactName = trim((string)($payload['emergency_contact_name'] ?? ''));
    $emergencyContactNumber = trim((string)($payload['emergency_contact_number'] ?? ''));
    $schoolOrWorkplace = trim((string)($payload['school_or_workplace'] ?? ''));

    $errors = [];
    if ($fullName === '') {
        $errors[] = 'full_name is required.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'email must be a valid email address.';
    }
    if (strlen($password) < 8) {
        $errors[] = 'password must be at least 8 characters.';
    }
    if (!in_array($role, ['seeker', 'parent', 'owner'], true)) {
        $errors[] = 'role must be seeker, parent, or owner.';
    }
    if ($contactNumber === '') {
        $errors[] = 'contact_number is required.';
    }
    if ($emergencyContactName !== '' && strlen($emergencyContactName) > 100) {
        $errors[] = 'emergency_contact_name cannot exceed 100 characters.';
    }
    if ($emergencyContactNumber !== '' && strlen($emergencyContactNumber) > 20) {
        $errors[] = 'emergency_contact_number cannot exceed 20 characters.';
    }
    if ($schoolOrWorkplace !== '' && strlen($schoolOrWorkplace) > 150) {
        $errors[] = 'school_or_workplace cannot exceed 150 characters.';
    }

    if (!empty($errors)) {
        json_response(false, 'Validation failed.', new stdClass(), $errors, 400);
    }

    $existing = db()->prepare('SELECT user_id FROM users WHERE email = :email LIMIT 1');
    $existing->execute([':email' => $email]);
    if ($existing->fetch()) {
        json_response(false, 'Validation failed.', new stdClass(), ['email is already registered.'], 400);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    $insert = db()->prepare(
        'INSERT INTO users (
            full_name,
            email,
            password_hash,
            role,
            contact_number,
            account_status,
            email_verified,
            emergency_contact_name,
            emergency_contact_number,
            school_or_workplace,
            created_at
         ) VALUES (
            :full_name,
            :email,
            :password_hash,
            :role,
            :contact_number,
            :account_status,
            1,
            :emergency_contact_name,
            :emergency_contact_number,
            :school_or_workplace,
            NOW()
         )'
    );
    $insert->execute([
        ':full_name' => $fullName,
        ':email' => $email,
        ':password_hash' => $passwordHash,
        ':role' => $role,
        ':contact_number' => $contactNumber,
        ':account_status' => 'active',
        ':emergency_contact_name' => $emergencyContactName !== '' ? $emergencyContactName : null,
        ':emergency_contact_number' => $emergencyContactNumber !== '' ? $emergencyContactNumber : null,
        ':school_or_workplace' => $schoolOrWorkplace !== '' ? $schoolOrWorkplace : null,
    ]);

    $newUserId = (int)db()->lastInsertId();
    $user = find_user_by_id($newUserId);
    log_activity($newUserId, 'User registered', 'auth');

    json_response(true, 'User registered successfully.', sanitize_user($user ?? ['user_id' => $newUserId]), [], 201);
}

function handle_login(array $payload): void
{
    require_fields($payload, ['email', 'password', 'role']);

    $email = strtolower(trim((string)$payload['email']));
    $password = (string)$payload['password'];
    $role = strtolower(trim((string)$payload['role']));

    if (!in_array($role, ALL_ROLES, true)) {
        json_response(false, 'Validation failed.', new stdClass(), ['role must be seeker, parent, owner, or admin.'], 400);
    }

    $query = db()->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
    $query->execute([':email' => $email]);
    $user = $query->fetch();

    $isValid = $user
        && password_verify($password, (string)$user['password_hash'])
        && ($user['account_status'] ?? 'inactive') === 'active'
        && ($user['role'] ?? '') === $role;

    if (!$isValid) {
        if ($user && isset($user['user_id'])) {
            log_activity((int)$user['user_id'], 'Failed login attempt', 'auth');
        } else {
            log_error('AUTH_LOGIN_FAILED', "Failed login for email {$email}", null);
        }

        json_response(false, 'Invalid credentials.', new stdClass(), ['Email or password is incorrect.'], 401);
    }

    login_user($user);
    log_activity((int)$user['user_id'], 'User login', 'auth');

    json_response(true, 'Login successful.', sanitize_user($user), []);
}

function handle_update_profile(array $payload): void
{
    $actor = require_auth();
    $userId = (int)$actor['user_id'];

    $updates = [];
    $params = [':user_id' => $userId];

    if (array_key_exists('full_name', $payload)) {
        $fullName = trim((string)$payload['full_name']);
        if ($fullName === '') {
            json_response(false, 'Validation failed.', new stdClass(), ['full_name must not be empty.'], 400);
        }

        $updates[] = 'full_name = :full_name';
        $params[':full_name'] = $fullName;
    }

    if (array_key_exists('email', $payload)) {
        $email = strtolower(trim((string)$payload['email']));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(false, 'Validation failed.', new stdClass(), ['email must be a valid email address.'], 400);
        }

        $duplicate = db()->prepare('SELECT user_id FROM users WHERE email = :email AND user_id <> :user_id LIMIT 1');
        $duplicate->execute([
            ':email' => $email,
            ':user_id' => $userId,
        ]);
        if ($duplicate->fetch()) {
            json_response(false, 'Validation failed.', new stdClass(), ['email is already in use by another account.'], 400);
        }

        $updates[] = 'email = :email';
        $params[':email'] = $email;
    }

    if (array_key_exists('contact_number', $payload)) {
        $contactNumber = trim((string)$payload['contact_number']);
        if ($contactNumber === '') {
            json_response(false, 'Validation failed.', new stdClass(), ['contact_number must not be empty.'], 400);
        }
        if (strlen($contactNumber) > 20) {
            json_response(false, 'Validation failed.', new stdClass(), ['contact_number cannot exceed 20 characters.'], 400);
        }

        $updates[] = 'contact_number = :contact_number';
        $params[':contact_number'] = $contactNumber;
    }

    if (array_key_exists('school_or_workplace', $payload)) {
        $schoolOrWorkplace = trim((string)$payload['school_or_workplace']);
        if (strlen($schoolOrWorkplace) > 150) {
            json_response(false, 'Validation failed.', new stdClass(), ['school_or_workplace cannot exceed 150 characters.'], 400);
        }

        $updates[] = 'school_or_workplace = :school_or_workplace';
        $params[':school_or_workplace'] = $schoolOrWorkplace !== '' ? $schoolOrWorkplace : null;
    }

    if (array_key_exists('emergency_contact_name', $payload)) {
        $emergencyName = trim((string)$payload['emergency_contact_name']);
        if (strlen($emergencyName) > 100) {
            json_response(false, 'Validation failed.', new stdClass(), ['emergency_contact_name cannot exceed 100 characters.'], 400);
        }

        $updates[] = 'emergency_contact_name = :emergency_contact_name';
        $params[':emergency_contact_name'] = $emergencyName !== '' ? $emergencyName : null;
    }

    if (array_key_exists('emergency_contact_number', $payload)) {
        $emergencyNumber = trim((string)$payload['emergency_contact_number']);
        if (strlen($emergencyNumber) > 20) {
            json_response(false, 'Validation failed.', new stdClass(), ['emergency_contact_number cannot exceed 20 characters.'], 400);
        }

        $updates[] = 'emergency_contact_number = :emergency_contact_number';
        $params[':emergency_contact_number'] = $emergencyNumber !== '' ? $emergencyNumber : null;
    }

    if (isset($_FILES['profile_photo']) && is_array($_FILES['profile_photo'])) {
        $profilePhotoPath = store_uploaded_file(
            $_FILES['profile_photo'],
            'storage/profiles/' . $userId,
            [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
            ],
            2 * 1024 * 1024,
            'profile_photo'
        );

        $updates[] = 'profile_photo = :profile_photo';
        $params[':profile_photo'] = $profilePhotoPath;
    }

    if (empty($updates)) {
        json_response(false, 'Validation failed.', new stdClass(), ['No updatable profile fields were provided.'], 400);
    }

    $query = db()->prepare('UPDATE users SET ' . implode(', ', $updates) . ' WHERE user_id = :user_id');
    $query->execute($params);

    current_user(true);
    $user = find_user_by_id($userId);
    if ($user === null) {
        json_response(false, 'User not found after update.', new stdClass(), [], 404);
    }

    log_activity($userId, 'Updated profile information', 'auth');
    json_response(true, 'Profile updated successfully.', sanitize_user($user), []);
}

function handle_change_password(array $payload): void
{
    $actor = require_auth();
    require_fields($payload, ['current_password', 'new_password']);

    $currentPassword = (string)$payload['current_password'];
    $newPassword = (string)$payload['new_password'];

    if (strlen($newPassword) < 8) {
        json_response(false, 'Validation failed.', new stdClass(), ['new_password must be at least 8 characters.'], 400);
    }

    if (!password_verify($currentPassword, (string)$actor['password_hash'])) {
        log_activity((int)$actor['user_id'], 'Failed password change attempt', 'auth');
        json_response(false, 'Validation failed.', new stdClass(), ['current_password is incorrect.'], 400);
    }

    if (password_verify($newPassword, (string)$actor['password_hash'])) {
        json_response(false, 'Validation failed.', new stdClass(), ['new_password must be different from current_password.'], 400);
    }

    $query = db()->prepare('UPDATE users SET password_hash = :password_hash WHERE user_id = :user_id');
    $query->execute([
        ':password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        ':user_id' => (int)$actor['user_id'],
    ]);

    current_user(true);
    log_activity((int)$actor['user_id'], 'Changed password', 'auth');
    json_response(true, 'Password updated successfully.', new stdClass(), []);
}

function handle_me(): void
{
    $user = require_auth();
    json_response(true, 'Current user profile fetched.', sanitize_user($user), []);
}

function handle_logout(): void
{
    $user = require_auth();
    $userId = (int)$user['user_id'];
    logout_user();
    log_activity($userId, 'User logout', 'auth');

    json_response(true, 'Logout successful.', new stdClass(), []);
}
