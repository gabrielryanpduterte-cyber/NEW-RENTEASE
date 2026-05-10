<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'DELETE']);
$method = request_method();

try {
    $actor = require_auth();
    ensure_uploads_table_exists();

    if ($method === 'GET') {
        handle_uploads_get($actor);
    }

    if ($method === 'POST') {
        handle_uploads_create($actor);
    }

    if ($method === 'DELETE') {
        handle_uploads_delete($actor);
    }
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Uploads request failed', $user ? (int)$user['user_id'] : null);
}

function ensure_uploads_table_exists(): void
{
    db()->exec(
        'CREATE TABLE IF NOT EXISTS uploads (
            upload_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id INT(10) UNSIGNED NOT NULL,
            reservation_id INT(10) UNSIGNED NULL,
            original_name VARCHAR(255) NOT NULL,
            stored_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(120) NOT NULL,
            file_size INT UNSIGNED NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            visibility ENUM(\'private\', \'owner\', \'admin\') NOT NULL DEFAULT \'owner\',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_uploads_user
                FOREIGN KEY (user_id)
                REFERENCES users (user_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            CONSTRAINT fk_uploads_reservation
                FOREIGN KEY (reservation_id)
                REFERENCES reservations (reservation_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL,
            INDEX idx_uploads_user (user_id),
            INDEX idx_uploads_reservation (reservation_id),
            INDEX idx_uploads_visibility (visibility)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    ensure_uploads_table_schema();
}

function uploads_column_exists(string $columnName): bool
{
    $query = db()->prepare(
        'SELECT COUNT(*)
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name
           AND COLUMN_NAME = :column_name'
    );
    $query->execute([
        ':table_name' => 'uploads',
        ':column_name' => $columnName,
    ]);

    return (int)$query->fetchColumn() > 0;
}

function ensure_uploads_column(string $columnName, string $definition): void
{
    if (!uploads_column_exists($columnName)) {
        db()->exec("ALTER TABLE uploads ADD COLUMN {$columnName} {$definition}");
    }
}

function ensure_uploads_table_schema(): void
{
    ensure_uploads_column('reservation_id', 'INT(10) UNSIGNED NULL AFTER user_id');
    ensure_uploads_column('original_name', 'VARCHAR(255) NULL AFTER reservation_id');
    ensure_uploads_column('stored_name', 'VARCHAR(255) NULL AFTER original_name');
    ensure_uploads_column('visibility', "ENUM('private', 'owner', 'admin') NOT NULL DEFAULT 'owner' AFTER file_path");
    ensure_uploads_column('created_at', 'DATETIME NULL AFTER visibility');

    $hasFileName = uploads_column_exists('file_name');
    $hasUploadedAt = uploads_column_exists('uploaded_at');
    $hasRelatedEntityType = uploads_column_exists('related_entity_type');
    $hasRelatedEntityId = uploads_column_exists('related_entity_id');

    if ($hasFileName) {
        db()->exec(
            "UPDATE uploads
             SET original_name = COALESCE(original_name, file_name),
                 stored_name = COALESCE(stored_name, SUBSTRING_INDEX(file_path, '/', -1))
             WHERE original_name IS NULL OR stored_name IS NULL"
        );

        db()->exec('ALTER TABLE uploads MODIFY file_name VARCHAR(255) NULL');
    } else {
        db()->exec(
            "UPDATE uploads
             SET original_name = COALESCE(original_name, stored_name, 'upload')
             WHERE original_name IS NULL"
        );
    }

    if ($hasUploadedAt) {
        db()->exec(
            'UPDATE uploads
             SET created_at = COALESCE(created_at, uploaded_at)
             WHERE created_at IS NULL'
        );
    }

    if ($hasRelatedEntityType && $hasRelatedEntityId) {
        db()->exec(
            "UPDATE uploads
             SET reservation_id = related_entity_id
             WHERE reservation_id IS NULL
               AND related_entity_type = 'reservation'
               AND related_entity_id IS NOT NULL"
        );
    }

    if ($hasRelatedEntityType) {
        db()->exec("ALTER TABLE uploads MODIFY related_entity_type ENUM('reservation','payment','profile','other') NOT NULL DEFAULT 'other'");
    }

    db()->exec(
        "UPDATE uploads
         SET stored_name = COALESCE(stored_name, SUBSTRING_INDEX(file_path, '/', -1), CONCAT('upload_', upload_id)),
             original_name = COALESCE(original_name, stored_name, CONCAT('upload_', upload_id)),
             created_at = COALESCE(created_at, CURRENT_TIMESTAMP)
         WHERE stored_name IS NULL OR original_name IS NULL OR created_at IS NULL"
    );

    db()->exec('ALTER TABLE uploads MODIFY original_name VARCHAR(255) NOT NULL');
    db()->exec('ALTER TABLE uploads MODIFY stored_name VARCHAR(255) NOT NULL');
    db()->exec('ALTER TABLE uploads MODIFY created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');

    ensure_uploads_index('idx_uploads_user', 'user_id');
    ensure_uploads_index('idx_uploads_reservation', 'reservation_id');
    ensure_uploads_index('idx_uploads_visibility', 'visibility');
}

function uploads_index_exists(string $indexName): bool
{
    $query = db()->prepare(
        'SELECT COUNT(*)
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name
           AND INDEX_NAME = :index_name'
    );
    $query->execute([
        ':table_name' => 'uploads',
        ':index_name' => $indexName,
    ]);

    return (int)$query->fetchColumn() > 0;
}

function ensure_uploads_index(string $indexName, string $columnName): void
{
    if (!uploads_index_exists($indexName)) {
        db()->exec("CREATE INDEX {$indexName} ON uploads ({$columnName})");
    }
}

function uploads_base_select(): string
{
    return 'SELECT
                u.*,
                usr.full_name AS uploader_name,
                rv.user_id AS reservation_user_id,
                rm.room_number,
                bh.owner_id AS reservation_owner_id
            FROM uploads u
            INNER JOIN users usr ON usr.user_id = u.user_id
            LEFT JOIN reservations rv ON rv.reservation_id = u.reservation_id
            LEFT JOIN rooms rm ON rm.room_id = rv.room_id
            LEFT JOIN boarding_house bh ON bh.boarding_house_id = rm.boarding_house_id';
}

function storage_directory_path(): string
{
    return __DIR__ . '/storage/uploads';
}

function upload_public_path(string $storedName): string
{
    $scriptName = (string)($_SERVER['SCRIPT_NAME'] ?? '/rentease/backend/uploads.php');
    $basePath = rtrim(dirname($scriptName), '/\\');
    if ($basePath === '') {
        $basePath = '/rentease/backend';
    }

    return $basePath . '/storage/uploads/' . rawurlencode($storedName);
}

function normalize_upload_row(array $row): array
{
    return [
        'upload_id' => isset($row['upload_id']) ? (int)$row['upload_id'] : null,
        'user_id' => isset($row['user_id']) ? (int)$row['user_id'] : null,
        'uploader_name' => $row['uploader_name'] ?? null,
        'reservation_id' => isset($row['reservation_id']) ? (int)$row['reservation_id'] : null,
        'room_number' => $row['room_number'] ?? null,
        'original_name' => $row['original_name'] ?? null,
        'mime_type' => $row['mime_type'] ?? null,
        'file_size' => isset($row['file_size']) ? (int)$row['file_size'] : 0,
        'visibility' => $row['visibility'] ?? 'owner',
        'created_at' => $row['created_at'] ?? null,
        'file_url' => upload_public_path((string)($row['stored_name'] ?? '')),
    ];
}

function find_upload_by_id(int $uploadId): ?array
{
    $query = db()->prepare(uploads_base_select() . ' WHERE u.upload_id = :upload_id LIMIT 1');
    $query->execute([':upload_id' => $uploadId]);
    $row = $query->fetch();
    return $row ?: null;
}

function can_access_upload(array $actor, array $upload): bool
{
    $actorId = (int)$actor['user_id'];
    $role = (string)$actor['role'];
    $ownerId = isset($upload['reservation_owner_id']) ? (int)$upload['reservation_owner_id'] : null;
    $uploaderId = isset($upload['user_id']) ? (int)$upload['user_id'] : null;
    $visibility = (string)($upload['visibility'] ?? 'owner');

    if ($role === 'admin') {
        return true;
    }
    if ($uploaderId === $actorId) {
        return true;
    }
    if ($visibility === 'private' || $visibility === 'admin') {
        return false;
    }
    if ($role === 'owner' && $visibility === 'owner' && $ownerId !== null && $ownerId === $actorId) {
        return true;
    }

    return false;
}

function validate_upload_visibility_for_actor(array $actor, string $visibility): void
{
    if (!in_array($visibility, ['private', 'owner', 'admin'], true)) {
        json_response(false, 'Validation failed.', new stdClass(), ['visibility must be private, owner, or admin.'], 400);
    }

    if ($visibility === 'admin' && $actor['role'] !== 'admin') {
        json_response(false, 'Forbidden.', new stdClass(), ['Only admin can set visibility=admin.'], 403);
    }
}

function handle_uploads_get(array $actor): void
{
    $uploadId = parse_positive_int($_GET['upload_id'] ?? null);
    if ($uploadId !== null) {
        $upload = find_upload_by_id($uploadId);
        if ($upload === null) {
            json_response(false, 'Upload not found.', new stdClass(), [], 404);
        }
        if (!can_access_upload($actor, $upload)) {
            json_response(false, 'Forbidden.', new stdClass(), ['You are not allowed to access this upload.'], 403);
        }

        json_response(true, 'Upload fetched successfully.', normalize_upload_row($upload), []);
    }

    $conditions = [];
    $params = [];

    if ($actor['role'] === 'owner') {
        $conditions[] = '(u.user_id = :owner_user_id OR (bh.owner_id = :owner_bh_owner_id AND u.visibility = :owner_visible_scope))';
        $params[':owner_user_id'] = (int)$actor['user_id'];
        $params[':owner_bh_owner_id'] = (int)$actor['user_id'];
        $params[':owner_visible_scope'] = 'owner';
    } elseif ($actor['role'] !== 'admin') {
        $conditions[] = 'u.user_id = :self_user_id';
        $params[':self_user_id'] = (int)$actor['user_id'];
    }

    $reservationId = parse_positive_int($_GET['reservation_id'] ?? null);
    if ($reservationId !== null) {
        $conditions[] = 'u.reservation_id = :reservation_id';
        $params[':reservation_id'] = $reservationId;
    }

    $userId = parse_positive_int($_GET['user_id'] ?? null);
    if ($userId !== null) {
        if ($actor['role'] !== 'admin' && $userId !== (int)$actor['user_id']) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only filter your own uploads.'], 403);
        }
        $conditions[] = 'u.user_id = :filter_user_id';
        $params[':filter_user_id'] = $userId;
    }

    $visibility = strtolower(trim((string)($_GET['visibility'] ?? '')));
    if ($visibility !== '') {
        if (!in_array($visibility, ['private', 'owner', 'admin'], true)) {
            json_response(false, 'Validation failed.', new stdClass(), ['visibility filter is invalid.'], 400);
        }
        $conditions[] = 'u.visibility = :visibility';
        $params[':visibility'] = $visibility;
    }

    $page = parse_page_param($_GET['page'] ?? null);
    $limit = parse_limit_param($_GET['limit'] ?? null, 20, 100);
    $offset = ($page - 1) * $limit;

    $whereClause = '';
    if (!empty($conditions)) {
        $whereClause = ' WHERE ' . implode(' AND ', $conditions);
    }

    $countQuery = db()->prepare('SELECT COUNT(*) AS total FROM uploads u LEFT JOIN reservations rv ON rv.reservation_id = u.reservation_id LEFT JOIN rooms rm ON rm.room_id = rv.room_id LEFT JOIN boarding_house bh ON bh.boarding_house_id = rm.boarding_house_id' . $whereClause);
    $countQuery->execute($params);
    $total = (int)($countQuery->fetch()['total'] ?? 0);
    $totalPages = $total > 0 ? (int)ceil($total / $limit) : 0;

    $sql = uploads_base_select() . $whereClause . ' ORDER BY u.upload_id DESC LIMIT :limit OFFSET :offset';
    $query = db()->prepare($sql);
    foreach ($params as $key => $value) {
        $query->bindValue($key, $value);
    }
    $query->bindValue(':limit', $limit, PDO::PARAM_INT);
    $query->bindValue(':offset', $offset, PDO::PARAM_INT);
    $query->execute();

    $rows = $query->fetchAll();
    $items = array_map('normalize_upload_row', $rows);

    json_response(true, 'Uploads fetched successfully.', [
        'items' => $items,
        'meta' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => $totalPages,
        ],
    ], []);
}

function handle_uploads_create(array $actor): void
{
    $file = $_FILES['file'] ?? null;
    if (!is_array($file)) {
        json_response(false, 'Validation failed.', new stdClass(), ['file is required as multipart form-data.'], 400);
    }

    $uploadError = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($uploadError !== UPLOAD_ERR_OK) {
        json_response(false, 'Upload failed.', new stdClass(), ['PHP upload error code: ' . $uploadError], 400);
    }

    $reservationId = parse_positive_int($_POST['reservation_id'] ?? null);
    $visibility = strtolower(trim((string)($_POST['visibility'] ?? 'owner')));
    validate_upload_visibility_for_actor($actor, $visibility);

    if ($reservationId !== null) {
        $reservationQuery = db()->prepare(
            'SELECT rv.reservation_id, rv.user_id, bh.owner_id
             FROM reservations rv
             INNER JOIN rooms rm ON rm.room_id = rv.room_id
             INNER JOIN boarding_house bh ON bh.boarding_house_id = rm.boarding_house_id
             WHERE rv.reservation_id = :reservation_id
             LIMIT 1'
        );
        $reservationQuery->execute([':reservation_id' => $reservationId]);
        $reservation = $reservationQuery->fetch();
        if (!$reservation) {
            json_response(false, 'Validation failed.', new stdClass(), ['reservation_id does not exist.'], 400);
        }

        if (in_array($actor['role'], ['seeker', 'parent'], true) && (int)$reservation['user_id'] !== (int)$actor['user_id']) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only upload files for your own reservations.'], 403);
        }
        if ($actor['role'] === 'owner' && (int)$reservation['owner_id'] !== (int)$actor['user_id']) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only upload files for your managed reservations.'], 403);
        }
    }

    $maxSize = 5 * 1024 * 1024;
    $fileSize = (int)($file['size'] ?? 0);
    if ($fileSize <= 0 || $fileSize > $maxSize) {
        json_response(false, 'Validation failed.', new stdClass(), ['file size must be between 1 byte and 5 MB.'], 400);
    }

    $tmpPath = (string)($file['tmp_name'] ?? '');
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = $finfo ? (string)finfo_file($finfo, $tmpPath) : 'application/octet-stream';
    if ($finfo) {
        finfo_close($finfo);
    }

    $allowedMimeMap = [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
    if (!array_key_exists($mimeType, $allowedMimeMap)) {
        json_response(false, 'Validation failed.', new stdClass(), ['Only PDF, JPG, PNG, and WEBP files are allowed.'], 400);
    }

    $originalName = basename((string)($file['name'] ?? 'upload'));
    $originalName = trim(preg_replace('/[^\w.\-\s]/', '_', $originalName) ?? 'upload');
    if ($originalName === '') {
        $originalName = 'upload';
    }

    $storedName = date('YmdHis') . '_' . bin2hex(random_bytes(8)) . '.' . $allowedMimeMap[$mimeType];
    $storageDir = storage_directory_path();
    if (!is_dir($storageDir) && !mkdir($storageDir, 0775, true) && !is_dir($storageDir)) {
        json_response(false, 'Server error.', new stdClass(), ['Unable to create upload directory.'], 500);
    }

    $destinationPath = $storageDir . '/' . $storedName;
    if (!move_uploaded_file($tmpPath, $destinationPath)) {
        json_response(false, 'Upload failed.', new stdClass(), ['Unable to move uploaded file.'], 500);
    }

    $insertColumns = [
        'user_id',
        'reservation_id',
        'original_name',
        'stored_name',
        'mime_type',
        'file_size',
        'file_path',
        'visibility',
    ];
    $insertParams = [
        ':user_id' => (int)$actor['user_id'],
        ':reservation_id' => $reservationId,
        ':original_name' => $originalName,
        ':stored_name' => $storedName,
        ':mime_type' => $mimeType,
        ':file_size' => $fileSize,
        ':file_path' => 'storage/uploads/' . $storedName,
        ':visibility' => $visibility,
    ];

    if (uploads_column_exists('file_name')) {
        $insertColumns[] = 'file_name';
        $insertParams[':file_name'] = $originalName;
    }
    if (uploads_column_exists('related_entity_type')) {
        $insertColumns[] = 'related_entity_type';
        $insertParams[':related_entity_type'] = $reservationId === null ? 'other' : 'reservation';
    }
    if (uploads_column_exists('related_entity_id')) {
        $insertColumns[] = 'related_entity_id';
        $insertParams[':related_entity_id'] = $reservationId;
    }

    $placeholders = array_map(static fn(string $column): string => ':' . $column, $insertColumns);
    $insert = db()->prepare(
        'INSERT INTO uploads (' . implode(', ', $insertColumns) . ')
         VALUES (' . implode(', ', $placeholders) . ')'
    );
    $insert->execute($insertParams);

    $uploadId = (int)db()->lastInsertId();
    log_activity((int)$actor['user_id'], "Uploaded file #{$uploadId}", 'uploads');

    $row = find_upload_by_id($uploadId);
    json_response(true, 'File uploaded successfully.', $row ? normalize_upload_row($row) : ['upload_id' => $uploadId], [], 201);
}

function handle_uploads_delete(array $actor): void
{
    $uploadId = parse_positive_int($_GET['upload_id'] ?? null);
    if ($uploadId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['upload_id is required.'], 400);
    }

    $upload = find_upload_by_id($uploadId);
    if ($upload === null) {
        json_response(false, 'Upload not found.', new stdClass(), [], 404);
    }

    if (!can_access_upload($actor, $upload)) {
        json_response(false, 'Forbidden.', new stdClass(), ['You are not allowed to delete this upload.'], 403);
    }

    $delete = db()->prepare('DELETE FROM uploads WHERE upload_id = :upload_id');
    $delete->execute([':upload_id' => $uploadId]);

    $storedName = (string)($upload['stored_name'] ?? '');
    if ($storedName !== '') {
        $path = storage_directory_path() . '/' . $storedName;
        if (is_file($path)) {
            @unlink($path);
        }
    }

    log_activity((int)$actor['user_id'], "Deleted upload #{$uploadId}", 'uploads');
    json_response(true, 'Upload deleted successfully.', new stdClass(), []);
}
