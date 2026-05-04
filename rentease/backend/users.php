<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
$method = request_method();

try {
    $actor = require_auth();

    if ($method === 'GET') {
        handle_users_get($actor);
    }

    if ($method === 'POST') {
        handle_users_create($actor, request_payload());
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        handle_users_update($actor, request_payload());
    }

    if ($method === 'DELETE') {
        handle_users_delete($actor);
    }
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Users request failed', $user ? (int)$user['user_id'] : null);
}

function handle_users_get(array $actor): void
{
    $targetUserId = parse_positive_int($_GET['user_id'] ?? null);

    if ($actor['role'] !== 'admin') {
        $selfId = (int)$actor['user_id'];
        if ($targetUserId !== null && $targetUserId !== $selfId) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only access your own user profile.'], 403);
        }

        $user = find_user_by_id($selfId);
        if (!$user) {
            json_response(false, 'User not found.', new stdClass(), [], 404);
        }

        json_response(true, 'User profile fetched successfully.', sanitize_user($user), []);
    }

    if ($targetUserId !== null) {
        $user = find_user_by_id($targetUserId);
        if (!$user) {
            json_response(false, 'User not found.', new stdClass(), [], 404);
        }

        json_response(true, 'User fetched successfully.', sanitize_user($user), []);
    }

    $conditions = [];
    $params = [];

    $role = strtolower(trim((string)($_GET['role'] ?? '')));
    if ($role !== '') {
        $conditions[] = 'role = :role';
        $params[':role'] = $role;
    }

    $accountStatus = strtolower(trim((string)($_GET['account_status'] ?? '')));
    if ($accountStatus !== '') {
        $conditions[] = 'account_status = :account_status';
        $params[':account_status'] = $accountStatus;
    }

    $sql = 'SELECT * FROM users';
    if (!empty($conditions)) {
        $sql .= ' WHERE ' . implode(' AND ', $conditions);
    }
    $sql .= ' ORDER BY user_id DESC';

    $query = db()->prepare($sql);
    $query->execute($params);
    $rows = $query->fetchAll();

    $sanitized = array_map('sanitize_user', $rows);
    json_response(true, 'Users fetched successfully.', $sanitized, []);
}

function handle_users_create(array $actor, array $payload): void
{
    if ($actor['role'] !== 'admin') {
        json_response(false, 'Forbidden.', new stdClass(), ['Only admin can create user accounts from this endpoint.'], 403);
    }

    require_fields($payload, ['full_name', 'email', 'password', 'role', 'contact_number']);

    $fullName = trim((string)$payload['full_name']);
    $email = strtolower(trim((string)$payload['email']));
    $password = (string)$payload['password'];
    $role = strtolower(trim((string)$payload['role']));
    $contactNumber = trim((string)$payload['contact_number']);
    $accountStatus = strtolower(trim((string)($payload['account_status'] ?? 'active')));

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
    if (!in_array($role, ALL_ROLES, true)) {
        $errors[] = 'role must be seeker, parent, owner, or admin.';
    }
    if ($contactNumber === '') {
        $errors[] = 'contact_number is required.';
    }
    if (!in_array($accountStatus, ['active', 'inactive'], true)) {
        $errors[] = 'account_status must be active or inactive.';
    }
    if (!empty($errors)) {
        json_response(false, 'Validation failed.', new stdClass(), $errors, 400);
    }

    $existing = db()->prepare('SELECT user_id FROM users WHERE email = :email LIMIT 1');
    $existing->execute([':email' => $email]);
    if ($existing->fetch()) {
        json_response(false, 'Validation failed.', new stdClass(), ['email is already registered.'], 400);
    }

    $insert = db()->prepare(
        'INSERT INTO users (full_name, email, password_hash, role, contact_number, account_status, created_at)
         VALUES (:full_name, :email, :password_hash, :role, :contact_number, :account_status, NOW())'
    );
    $insert->execute([
        ':full_name' => $fullName,
        ':email' => $email,
        ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ':role' => $role,
        ':contact_number' => $contactNumber,
        ':account_status' => $accountStatus,
    ]);

    $newId = (int)db()->lastInsertId();
    log_activity((int)$actor['user_id'], "Created user #{$newId}", 'users');

    $user = find_user_by_id($newId);
    json_response(true, 'User created successfully.', sanitize_user($user ?? ['user_id' => $newId]), [], 201);
}

function handle_users_update(array $actor, array $payload): void
{
    $targetUserId = parse_positive_int($_GET['user_id'] ?? ($payload['user_id'] ?? null));
    if ($targetUserId === null) {
        $targetUserId = (int)$actor['user_id'];
    }

    $isAdmin = $actor['role'] === 'admin';
    if (!$isAdmin && $targetUserId !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only update your own account.'], 403);
    }

    $existing = find_user_by_id($targetUserId);
    if (!$existing) {
        json_response(false, 'User not found.', new stdClass(), [], 404);
    }

    $updates = [];
    $params = [':user_id' => $targetUserId];

    if (array_key_exists('full_name', $payload)) {
        $updates[] = 'full_name = :full_name';
        $params[':full_name'] = trim((string)$payload['full_name']);
    }
    if (array_key_exists('email', $payload)) {
        $email = strtolower(trim((string)$payload['email']));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(false, 'Validation failed.', new stdClass(), ['email must be a valid email address.'], 400);
        }

        $duplicateQuery = db()->prepare('SELECT user_id FROM users WHERE email = :email AND user_id <> :user_id LIMIT 1');
        $duplicateQuery->execute([':email' => $email, ':user_id' => $targetUserId]);
        if ($duplicateQuery->fetch()) {
            json_response(false, 'Validation failed.', new stdClass(), ['email is already in use by another account.'], 400);
        }

        $updates[] = 'email = :email';
        $params[':email'] = $email;
    }
    if (array_key_exists('password', $payload)) {
        $password = (string)$payload['password'];
        if (strlen($password) < 8) {
            json_response(false, 'Validation failed.', new stdClass(), ['password must be at least 8 characters.'], 400);
        }

        $updates[] = 'password_hash = :password_hash';
        $params[':password_hash'] = password_hash($password, PASSWORD_DEFAULT);
    }
    if (array_key_exists('contact_number', $payload)) {
        $updates[] = 'contact_number = :contact_number';
        $params[':contact_number'] = trim((string)$payload['contact_number']);
    }

    if ($isAdmin && array_key_exists('role', $payload)) {
        $role = strtolower(trim((string)$payload['role']));
        if (!in_array($role, ALL_ROLES, true)) {
            json_response(false, 'Validation failed.', new stdClass(), ['role must be seeker, parent, owner, or admin.'], 400);
        }
        $updates[] = 'role = :role';
        $params[':role'] = $role;
    } elseif (!$isAdmin && array_key_exists('role', $payload)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only admin can update user roles.'], 403);
    }

    if ($isAdmin && array_key_exists('account_status', $payload)) {
        $accountStatus = strtolower(trim((string)$payload['account_status']));
        if (!in_array($accountStatus, ['active', 'inactive'], true)) {
            json_response(false, 'Validation failed.', new stdClass(), ['account_status must be active or inactive.'], 400);
        }
        $updates[] = 'account_status = :account_status';
        $params[':account_status'] = $accountStatus;
    } elseif (!$isAdmin && array_key_exists('account_status', $payload)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only admin can update account_status.'], 403);
    }

    if (empty($updates)) {
        json_response(false, 'Validation failed.', new stdClass(), ['No updatable fields provided.'], 400);
    }

    $sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE user_id = :user_id';
    $update = db()->prepare($sql);
    $update->execute($params);

    log_activity((int)$actor['user_id'], "Updated user #{$targetUserId}", 'users');

    $user = find_user_by_id($targetUserId);
    if (!$user) {
        json_response(false, 'User not found after update.', new stdClass(), [], 404);
    }

    if ($targetUserId === (int)$actor['user_id']) {
        current_user(true);
    }

    json_response(true, 'User updated successfully.', sanitize_user($user), []);
}

function handle_users_delete(array $actor): void
{
    if ($actor['role'] !== 'admin') {
        json_response(false, 'Forbidden.', new stdClass(), ['Only admin can deactivate users.'], 403);
    }

    $targetUserId = parse_positive_int($_GET['user_id'] ?? null);
    if ($targetUserId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['user_id is required.'], 400);
    }

    if ($targetUserId === (int)$actor['user_id']) {
        json_response(false, 'Validation failed.', new stdClass(), ['Admin cannot deactivate their own account from this endpoint.'], 400);
    }

    $existing = find_user_by_id($targetUserId);
    if (!$existing) {
        json_response(false, 'User not found.', new stdClass(), [], 404);
    }

    $update = db()->prepare('UPDATE users SET account_status = :account_status WHERE user_id = :user_id');
    $update->execute([
        ':account_status' => 'inactive',
        ':user_id' => $targetUserId,
    ]);

    log_activity((int)$actor['user_id'], "Deactivated user #{$targetUserId}", 'users');
    json_response(true, 'User deactivated successfully.', new stdClass(), []);
}
