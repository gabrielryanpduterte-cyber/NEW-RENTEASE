<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

const ALL_ROLES = ['seeker', 'parent', 'owner', 'admin'];

function json_response(
    bool $success,
    string $message,
    $data = null,
    array $errors = [],
    int $statusCode = 200
): void {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data ?? new stdClass(),
        'errors' => $errors,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function request_method(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function request_payload(): array
{
    static $cachedPayload = null;
    if (is_array($cachedPayload)) {
        return $cachedPayload;
    }

    $cachedPayload = [];
    $rawBody = file_get_contents('php://input');
    if ($rawBody !== false && trim($rawBody) !== '') {
        $decoded = json_decode($rawBody, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            json_response(false, 'Invalid JSON payload.', new stdClass(), ['Request body must be valid JSON.'], 400);
        }
        $cachedPayload = $decoded;
    }

    if (!empty($_POST)) {
        $cachedPayload = array_merge($cachedPayload, $_POST);
    }

    return $cachedPayload;
}

function request_action(array $payload = []): string
{
    $action = $_GET['action'] ?? ($payload['action'] ?? '');
    return strtolower(trim((string)$action));
}

function require_methods(array $allowedMethods): void
{
    $method = request_method();
    $allowed = array_map('strtoupper', $allowedMethods);

    if (!in_array($method, $allowed, true)) {
        json_response(
            false,
            'Method not allowed.',
            new stdClass(),
            ["Allowed methods: " . implode(', ', $allowed)],
            405
        );
    }
}

function require_fields(array $payload, array $requiredFields): void
{
    $missing = [];
    foreach ($requiredFields as $field) {
        if (!array_key_exists($field, $payload) || $payload[$field] === '' || $payload[$field] === null) {
            $missing[] = $field;
        }
    }

    if (!empty($missing)) {
        json_response(false, 'Validation failed.', new stdClass(), ['Missing fields: ' . implode(', ', $missing)], 400);
    }
}

function parse_positive_int($value): ?int
{
    if ($value === null || $value === '') {
        return null;
    }

    if (!is_numeric($value)) {
        return null;
    }

    $intValue = (int)$value;
    return $intValue > 0 ? $intValue : null;
}

function parse_non_negative_int($value): ?int
{
    if ($value === null || $value === '') {
        return null;
    }

    if (!is_numeric($value)) {
        return null;
    }

    $intValue = (int)$value;
    return $intValue >= 0 ? $intValue : null;
}

function parse_limit_param($value, int $default = 25, int $max = 200): int
{
    $parsed = parse_positive_int($value);
    if ($parsed === null) {
        return $default;
    }

    return min($parsed, $max);
}

function parse_page_param($value): int
{
    return parse_positive_int($value) ?? 1;
}

function parse_ymd_date($value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    $raw = trim((string)$value);
    $parsed = DateTime::createFromFormat('Y-m-d', $raw);
    if (!$parsed instanceof DateTime || $parsed->format('Y-m-d') !== $raw) {
        return null;
    }

    return $raw;
}

function parse_datetime_filter($value, bool $endOfDay = false): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    $raw = trim((string)$value);
    $timestamp = strtotime($raw);
    if ($timestamp === false) {
        return null;
    }

    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw) === 1) {
        return date('Y-m-d', $timestamp) . ($endOfDay ? ' 23:59:59' : ' 00:00:00');
    }

    return date('Y-m-d H:i:s', $timestamp);
}

function sanitize_user(array $user): array
{
    return [
        'user_id' => isset($user['user_id']) ? (int)$user['user_id'] : null,
        'full_name' => $user['full_name'] ?? null,
        'email' => $user['email'] ?? null,
        'role' => $user['role'] ?? null,
        'contact_number' => $user['contact_number'] ?? null,
        'account_status' => $user['account_status'] ?? null,
        'created_at' => $user['created_at'] ?? null,
    ];
}

function find_user_by_id(int $userId): ?array
{
    $query = db()->prepare('SELECT * FROM users WHERE user_id = :user_id LIMIT 1');
    $query->execute([':user_id' => $userId]);
    $user = $query->fetch();

    return $user ?: null;
}

function current_user(bool $refresh = false): ?array
{
    static $loaded = false;
    static $cachedUser = null;

    if (!$loaded || $refresh) {
        $loaded = true;
        $cachedUser = null;

        $sessionUserId = parse_positive_int($_SESSION['user_id'] ?? null);
        if ($sessionUserId === null) {
            return null;
        }

        $user = find_user_by_id($sessionUserId);
        if ($user === null || ($user['account_status'] ?? 'inactive') !== 'active') {
            unset($_SESSION['user_id']);
            return null;
        }

        $cachedUser = $user;
    }

    return $cachedUser;
}

function require_auth(): array
{
    $user = current_user();
    if ($user === null) {
        json_response(false, 'Unauthorized.', new stdClass(), ['Authentication required.'], 401);
    }

    return $user;
}

function require_roles(array $roles): array
{
    $user = require_auth();
    if (!in_array($user['role'], $roles, true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Role is not allowed for this operation.'], 403);
    }

    return $user;
}

function login_user(array $user): void
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['user_id'];
    current_user(true);
}

function logout_user(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool)$params['secure'], (bool)$params['httponly']);
    }

    session_destroy();
}

function owner_owns_boarding_house(int $ownerId, int $boardingHouseId): bool
{
    $query = db()->prepare('SELECT boarding_house_id FROM boarding_house WHERE boarding_house_id = :id AND owner_id = :owner_id LIMIT 1');
    $query->execute([':id' => $boardingHouseId, ':owner_id' => $ownerId]);
    return (bool)$query->fetchColumn();
}

function owner_owns_room(int $ownerId, int $roomId): bool
{
    $query = db()->prepare(
        'SELECT r.room_id
         FROM rooms r
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE r.room_id = :room_id AND b.owner_id = :owner_id
         LIMIT 1'
    );
    $query->execute([':room_id' => $roomId, ':owner_id' => $ownerId]);
    return (bool)$query->fetchColumn();
}

function owner_owns_reservation(int $ownerId, int $reservationId): bool
{
    $query = db()->prepare(
        'SELECT rv.reservation_id
         FROM reservations rv
         INNER JOIN rooms r ON r.room_id = rv.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE rv.reservation_id = :reservation_id AND b.owner_id = :owner_id
         LIMIT 1'
    );
    $query->execute([':reservation_id' => $reservationId, ':owner_id' => $ownerId]);
    return (bool)$query->fetchColumn();
}

function owner_owns_payment(int $ownerId, int $paymentId): bool
{
    $query = db()->prepare(
        'SELECT p.payment_id
         FROM payments p
         INNER JOIN rooms r ON r.room_id = p.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE p.payment_id = :payment_id AND b.owner_id = :owner_id
         LIMIT 1'
    );
    $query->execute([':payment_id' => $paymentId, ':owner_id' => $ownerId]);
    return (bool)$query->fetchColumn();
}

function parent_seeker_links_table_exists(): bool
{
    static $checked = false;
    static $exists = false;

    if ($checked) {
        return $exists;
    }

    $checked = true;

    try {
        $query = db()->query("SHOW TABLES LIKE 'parent_seeker_links'");
        $exists = (bool)($query ? $query->fetchColumn() : false);
    } catch (Throwable $exception) {
        $exists = false;
    }

    return $exists;
}

function linked_seeker_ids_for_parent(int $parentUserId): array
{
    if (!parent_seeker_links_table_exists()) {
        return [];
    }

    $query = db()->prepare(
        'SELECT seeker_user_id
         FROM parent_seeker_links
         WHERE parent_user_id = :parent_user_id
           AND status = :status'
    );
    $query->execute([
        ':parent_user_id' => $parentUserId,
        ':status' => 'approved',
    ]);

    $rows = $query->fetchAll();
    $ids = [];

    foreach ($rows as $row) {
        $seekerId = isset($row['seeker_user_id']) ? (int)$row['seeker_user_id'] : 0;
        if ($seekerId > 0) {
            $ids[$seekerId] = $seekerId;
        }
    }

    return array_values($ids);
}

function parent_is_linked_to_seeker(int $parentUserId, int $seekerUserId): bool
{
    if (!parent_seeker_links_table_exists()) {
        return false;
    }

    $query = db()->prepare(
        'SELECT link_id
         FROM parent_seeker_links
         WHERE parent_user_id = :parent_user_id
           AND seeker_user_id = :seeker_user_id
           AND status = :status
         LIMIT 1'
    );
    $query->execute([
        ':parent_user_id' => $parentUserId,
        ':seeker_user_id' => $seekerUserId,
        ':status' => 'approved',
    ]);

    return (bool)$query->fetchColumn();
}

function log_activity(?int $userId, string $actionPerformed, string $affectedModule): void
{
    if ($userId === null) {
        return;
    }

    try {
        $query = db()->prepare(
            'INSERT INTO activity_logs (user_id, action_performed, affected_module, `timestamp`)
             VALUES (:user_id, :action_performed, :affected_module, NOW())'
        );
        $query->execute([
            ':user_id' => $userId,
            ':action_performed' => $actionPerformed,
            ':affected_module' => $affectedModule,
        ]);
    } catch (Throwable $exception) {
        // Never interrupt business logic because activity logging failed.
    }
}

function log_error(string $errorCode, string $errorMessage, ?int $affectedUserId = null): void
{
    try {
        $query = db()->prepare(
            'INSERT INTO error_logs (error_code, error_message, affected_user_id, `timestamp`)
             VALUES (:error_code, :error_message, :affected_user_id, NOW())'
        );
        $query->execute([
            ':error_code' => substr($errorCode, 0, 50),
            ':error_message' => substr($errorMessage, 0, 1000),
            ':affected_user_id' => $affectedUserId,
        ]);
    } catch (Throwable $exception) {
        // Avoid recursion if error logging itself fails.
    }
}

function handle_exception(Throwable $exception, string $contextMessage, ?int $affectedUserId = null): void
{
    $message = $contextMessage . ': ' . $exception->getMessage();
    log_error('SERVER_ERROR', $message, $affectedUserId);
    json_response(false, 'Server error.', new stdClass(), ['An unexpected error occurred.'], 500);
}
