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
    $contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
    $rawBody = strpos($contentType, 'multipart/form-data') !== false ? '' : file_get_contents('php://input');
    if ($rawBody !== false && trim((string)$rawBody) !== '') {
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
    $profilePhoto = $user['profile_photo'] ?? null;

    return [
        'user_id' => isset($user['user_id']) ? (int)$user['user_id'] : null,
        'full_name' => $user['full_name'] ?? null,
        'email' => $user['email'] ?? null,
        'role' => $user['role'] ?? null,
        'contact_number' => $user['contact_number'] ?? null,
        'account_status' => $user['account_status'] ?? null,
        'profile_photo' => $profilePhoto,
        'profile_photo_url' => $profilePhoto ? backend_asset_url((string)$profilePhoto) : null,
        'emergency_contact_name' => $user['emergency_contact_name'] ?? null,
        'emergency_contact_number' => $user['emergency_contact_number'] ?? null,
        'school_or_workplace' => $user['school_or_workplace'] ?? null,
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
        $columns = ['user_id', 'action_performed', 'affected_module', '`timestamp`'];
        $placeholders = [':user_id', ':action_performed', ':affected_module', 'NOW()'];
        $params = [
            ':user_id' => $userId,
            ':action_performed' => $actionPerformed,
            ':affected_module' => $affectedModule,
        ];

        $query = db()->prepare(
            'INSERT INTO activity_logs (' . implode(', ', $columns) . ')
             VALUES (' . implode(', ', $placeholders) . ')'
        );
        $query->execute($params);
    } catch (Throwable $exception) {
        // Never interrupt business logic because activity logging failed.
    }
}

function log_activity_note(?int $userId, string $actionPerformed, string $affectedModule, ?string $notes = null, ?int $guardianLinkId = null): void
{
    if ($userId === null) {
        return;
    }

    try {
        $columns = ['user_id', 'action_performed', 'affected_module', '`timestamp`'];
        $placeholders = [':user_id', ':action_performed', ':affected_module', 'NOW()'];
        $params = [
            ':user_id' => $userId,
            ':action_performed' => $actionPerformed,
            ':affected_module' => $affectedModule,
        ];

        if ($notes !== null && db_column_exists('activity_logs', 'notes')) {
            $columns[] = 'notes';
            $placeholders[] = ':notes';
            $params[':notes'] = $notes;
        }

        if ($guardianLinkId !== null && db_column_exists('activity_logs', 'guardian_link_id')) {
            $columns[] = 'guardian_link_id';
            $placeholders[] = ':guardian_link_id';
            $params[':guardian_link_id'] = $guardianLinkId;
        }

        $query = db()->prepare(
            'INSERT INTO activity_logs (' . implode(', ', $columns) . ')
             VALUES (' . implode(', ', $placeholders) . ')'
        );
        $query->execute($params);
    } catch (Throwable $exception) {
        // Never interrupt business logic because activity logging failed.
    }
}

function db_table_exists(string $tableName): bool
{
    $query = db()->prepare(
        'SELECT COUNT(*)
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name'
    );
    $query->execute([':table_name' => $tableName]);

    return (int)$query->fetchColumn() > 0;
}

function db_column_exists(string $tableName, string $columnName): bool
{
    $query = db()->prepare(
        'SELECT COUNT(*)
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name
           AND COLUMN_NAME = :column_name'
    );
    $query->execute([
        ':table_name' => $tableName,
        ':column_name' => $columnName,
    ]);

    return (int)$query->fetchColumn() > 0;
}

function db_ensure_column(string $tableName, string $columnName, string $definition): void
{
    if (!db_column_exists($tableName, $columnName)) {
        db()->exec("ALTER TABLE {$tableName} ADD COLUMN {$columnName} {$definition}");
    }
}

function db_index_exists(string $tableName, string $indexName): bool
{
    $query = db()->prepare(
        'SELECT COUNT(*)
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name
           AND INDEX_NAME = :index_name'
    );
    $query->execute([
        ':table_name' => $tableName,
        ':index_name' => $indexName,
    ]);

    return (int)$query->fetchColumn() > 0;
}

function db_ensure_index(string $tableName, string $indexName, string $columnSql): void
{
    if (!db_index_exists($tableName, $indexName)) {
        db()->exec("CREATE INDEX {$indexName} ON {$tableName} ({$columnSql})");
    }
}

function ensure_seeker_feature_schema(): void
{
    db_ensure_column('users', 'profile_photo', 'VARCHAR(255) NULL');
    db_ensure_column('users', 'emergency_contact_name', 'VARCHAR(100) NULL');
    db_ensure_column('users', 'emergency_contact_number', 'VARCHAR(20) NULL');
    db_ensure_column('users', 'school_or_workplace', 'VARCHAR(150) NULL');

    db_ensure_column('reservations', 'valid_id_path', 'VARCHAR(255) NULL');
    db_ensure_column('reservations', 'cancellation_reason', 'TEXT NULL');
    db_ensure_column('reservations', 'cancelled_at', 'DATETIME NULL');

    db_ensure_column('payments', 'proof_of_payment_path', 'VARCHAR(255) NULL');
    db_ensure_column('payments', 'notes', 'TEXT NULL');

    db_ensure_column('activity_logs', 'notes', 'TEXT NULL');
    db_ensure_column('activity_logs', 'guardian_link_id', 'INT(10) UNSIGNED NULL');

    db()->exec(
        'CREATE TABLE IF NOT EXISTS guardian_links (
            guardian_link_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            tenant_user_id INT(10) UNSIGNED NOT NULL,
            guardian_name VARCHAR(100) NOT NULL,
            guardian_email VARCHAR(150) NOT NULL,
            access_token CHAR(36) NOT NULL,
            status ENUM(\'pending\', \'active\', \'revoked\') NOT NULL DEFAULT \'active\',
            last_accessed_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_guardian_links_tenant
                FOREIGN KEY (tenant_user_id)
                REFERENCES users (user_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            UNIQUE KEY uq_guardian_links_access_token (access_token),
            INDEX idx_guardian_links_tenant (tenant_user_id),
            INDEX idx_guardian_links_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

function ensure_owner_feature_schema(): void
{
    if (db_table_exists('boarding_house')) {
        db_ensure_column(
            'boarding_house',
            'property_type',
            "ENUM('boarding_house','apartment','dormitory','condominium','bedspace','other') NOT NULL DEFAULT 'boarding_house'"
        );
        db_ensure_column('boarding_house', 'cover_photo', 'VARCHAR(255) NULL');
        db_ensure_column('boarding_house', 'contact_number', 'VARCHAR(20) NULL');
        db_ensure_column('boarding_house', 'facebook_page', 'VARCHAR(255) NULL');
        db_ensure_column('boarding_house', 'amenities_list', 'JSON NULL');
    }

    if (db_table_exists('rooms')) {
        db_ensure_column('rooms', 'photos', 'JSON NULL');
        db_ensure_column('rooms', 'floor_number', 'TINYINT NULL');
        db_ensure_column('rooms', 'is_archived', 'TINYINT(1) NOT NULL DEFAULT 0');
        db_ensure_column('rooms', 'notes', 'TEXT NULL');

        try {
            db()->exec(
                "ALTER TABLE rooms
                 MODIFY availability_status ENUM('available','unavailable','occupied','archived')
                 NOT NULL DEFAULT 'available'"
            );
        } catch (Throwable $exception) {
            // Some existing databases may use VARCHAR here; the archive flag still works.
        }
    }

    if (db_table_exists('reservations')) {
        db_ensure_column('reservations', 'rejection_remarks', 'TEXT NULL');
    }

    db()->exec(
        'CREATE TABLE IF NOT EXISTS room_amenities (
            room_amenity_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            room_id INT(10) UNSIGNED NOT NULL,
            amenity_name VARCHAR(80) NOT NULL,
            amenity_icon VARCHAR(50) NULL,
            sort_order TINYINT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_room_amenities_room
                FOREIGN KEY (room_id)
                REFERENCES rooms (room_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            INDEX idx_room_amenities_room (room_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    db()->exec(
        'CREATE TABLE IF NOT EXISTS billing_cycles (
            billing_cycle_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            reservation_id INT(10) UNSIGNED NOT NULL,
            user_id INT(10) UNSIGNED NOT NULL,
            room_id INT(10) UNSIGNED NOT NULL,
            billing_month CHAR(7) NOT NULL,
            amount_due DECIMAL(10,2) NOT NULL,
            due_date DATE NULL,
            generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_by INT(10) UNSIGNED NOT NULL,
            CONSTRAINT fk_billing_cycles_reservation
                FOREIGN KEY (reservation_id)
                REFERENCES reservations (reservation_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            CONSTRAINT fk_billing_cycles_user
                FOREIGN KEY (user_id)
                REFERENCES users (user_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            CONSTRAINT fk_billing_cycles_room
                FOREIGN KEY (room_id)
                REFERENCES rooms (room_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            CONSTRAINT fk_billing_cycles_created_by
                FOREIGN KEY (created_by)
                REFERENCES users (user_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,
            UNIQUE KEY uq_billing_cycles_reservation_month (reservation_id, billing_month),
            INDEX idx_billing_cycles_month (billing_month),
            INDEX idx_billing_cycles_user (user_id),
            INDEX idx_billing_cycles_room (room_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    if (db_table_exists('payments')) {
        try {
            db()->exec(
                "ALTER TABLE payments
                 MODIFY payment_status ENUM('paid','unpaid','pending_verification')
                 NOT NULL DEFAULT 'unpaid'"
            );
        } catch (Throwable $exception) {
            // Existing databases may already use a compatible VARCHAR/ENUM definition.
        }
        db_ensure_column('payments', 'billing_cycle_id', 'INT(10) UNSIGNED NULL');
        db_ensure_column(
            'payments',
            'payment_method',
            "ENUM('cash','gcash','bank_transfer','other') NULL DEFAULT 'cash'"
        );
        db_ensure_column('payments', 'received_by', 'INT(10) UNSIGNED NULL');
    }
}

function parse_billing_month($value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    $raw = trim((string)$value);
    $parsed = DateTime::createFromFormat('Y-m', $raw);
    if (!$parsed instanceof DateTime || $parsed->format('Y-m') !== $raw) {
        return null;
    }

    return $raw;
}

function decode_json_array($value): array
{
    if (is_array($value)) {
        return $value;
    }

    if ($value === null || $value === '') {
        return [];
    }

    $decoded = json_decode((string)$value, true);
    return is_array($decoded) ? $decoded : [];
}

function backend_public_base_url(): string
{
    $configuredUrl = config_value('RENTEASE_APP_URL', '');
    if ($configuredUrl !== '') {
        return rtrim($configuredUrl, '/');
    }

    $scriptName = (string)($_SERVER['SCRIPT_NAME'] ?? '/rentease/backend/index.php');
    $basePath = rtrim(dirname($scriptName), '/\\');
    if ($basePath === '' || $basePath === '.') {
        return '';
    }

    return $basePath;
}

function backend_asset_url(string $relativePath): string
{
    $basePath = backend_public_base_url();
    $parts = array_map('rawurlencode', explode('/', str_replace('\\', '/', ltrim($relativePath, '/\\'))));
    return ($basePath !== '' ? $basePath : '') . '/' . implode('/', $parts);
}

function backend_endpoint_url(string $scriptWithQuery): string
{
    $basePath = backend_public_base_url();
    return ($basePath !== '' ? $basePath : '') . '/' . ltrim($scriptWithQuery, '/');
}

function generate_uuid_v4(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function ensure_storage_subdirectory(string $relativeDirectory): string
{
    $relativeDirectory = trim(str_replace('\\', '/', $relativeDirectory), '/');
    $absolutePath = __DIR__ . '/' . $relativeDirectory;

    if (!is_dir($absolutePath) && !mkdir($absolutePath, 0775, true) && !is_dir($absolutePath)) {
        json_response(false, 'Server error.', new stdClass(), ['Unable to create storage directory.'], 500);
    }

    return $absolutePath;
}

function validate_uploaded_file(array $file, array $allowedMimeMap, int $maxBytes, string $fieldLabel = 'file'): array
{
    $uploadError = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($uploadError !== UPLOAD_ERR_OK) {
        json_response(false, 'Upload failed.', new stdClass(), ["{$fieldLabel} upload error code: {$uploadError}"], 400);
    }

    $fileSize = (int)($file['size'] ?? 0);
    if ($fileSize <= 0 || $fileSize > $maxBytes) {
        $maxMb = (int)ceil($maxBytes / (1024 * 1024));
        json_response(false, 'Validation failed.', new stdClass(), ["{$fieldLabel} size must be between 1 byte and {$maxMb} MB."], 400);
    }

    $tmpPath = (string)($file['tmp_name'] ?? '');
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = $finfo ? (string)finfo_file($finfo, $tmpPath) : 'application/octet-stream';
    if ($finfo) {
        finfo_close($finfo);
    }

    if (!array_key_exists($mimeType, $allowedMimeMap)) {
        json_response(false, 'Validation failed.', new stdClass(), ["{$fieldLabel} type is not allowed."], 400);
    }

    return [
        'tmp_path' => $tmpPath,
        'mime_type' => $mimeType,
        'extension' => $allowedMimeMap[$mimeType],
        'file_size' => $fileSize,
        'original_name' => basename((string)($file['name'] ?? $fieldLabel)),
    ];
}

function store_uploaded_file(array $file, string $relativeDirectory, array $allowedMimeMap, int $maxBytes, string $fieldLabel = 'file'): string
{
    $validated = validate_uploaded_file($file, $allowedMimeMap, $maxBytes, $fieldLabel);
    $directoryPath = ensure_storage_subdirectory($relativeDirectory);
    $storedName = date('YmdHis') . '_' . bin2hex(random_bytes(8)) . '.' . $validated['extension'];
    $destinationPath = $directoryPath . '/' . $storedName;

    if (!move_uploaded_file($validated['tmp_path'], $destinationPath)) {
        json_response(false, 'Upload failed.', new stdClass(), ["Unable to store {$fieldLabel}."], 500);
    }

    return trim($relativeDirectory, '/') . '/' . $storedName;
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
