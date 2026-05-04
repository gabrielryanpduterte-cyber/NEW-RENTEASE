<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'DELETE']);
$method = request_method();

try {
    $actor = require_roles(['admin']);

    if ($method === 'GET') {
        handle_error_logs_get();
    }

    if ($method === 'POST') {
        handle_error_logs_create($actor, request_payload());
    }

    if ($method === 'DELETE') {
        handle_error_logs_delete($actor);
    }
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Error logs request failed', $user ? (int)$user['user_id'] : null);
}

function handle_error_logs_get(): void
{
    $errorId = parse_positive_int($_GET['error_id'] ?? null);
    if ($errorId !== null) {
        $query = db()->prepare(
            'SELECT e.*, u.full_name AS user_name, u.email AS user_email
             FROM error_logs e
             LEFT JOIN users u ON u.user_id = e.affected_user_id
             WHERE e.error_id = :error_id
             LIMIT 1'
        );
        $query->execute([':error_id' => $errorId]);
        $row = $query->fetch();
        if (!$row) {
            json_response(false, 'Error log not found.', new stdClass(), [], 404);
        }

        json_response(true, 'Error log fetched successfully.', $row, []);
    }

    $conditions = [];
    $params = [];

    $errorCode = trim((string)($_GET['error_code'] ?? ''));
    if ($errorCode !== '') {
        $conditions[] = 'e.error_code = :error_code';
        $params[':error_code'] = $errorCode;
    }

    $affectedUserId = parse_positive_int($_GET['affected_user_id'] ?? null);
    if ($affectedUserId !== null) {
        $conditions[] = 'e.affected_user_id = :affected_user_id';
        $params[':affected_user_id'] = $affectedUserId;
    }

    $module = trim((string)($_GET['module'] ?? ''));
    if ($module !== '') {
        $conditions[] = '(e.error_code LIKE :module OR e.error_message LIKE :module)';
        $params[':module'] = '%' . $module . '%';
    }

    $dateFromRaw = $_GET['date_from'] ?? null;
    $dateToRaw = $_GET['date_to'] ?? null;
    $dateFrom = parse_datetime_filter($dateFromRaw);
    $dateTo = parse_datetime_filter($dateToRaw, true);

    if ($dateFromRaw !== null && trim((string)$dateFromRaw) !== '' && $dateFrom === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['date_from must be a valid date or datetime.'], 400);
    }
    if ($dateToRaw !== null && trim((string)$dateToRaw) !== '' && $dateTo === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['date_to must be a valid date or datetime.'], 400);
    }
    if ($dateFrom !== null && $dateTo !== null && strtotime($dateFrom) > strtotime($dateTo)) {
        json_response(false, 'Validation failed.', new stdClass(), ['date_from cannot be later than date_to.'], 400);
    }

    if ($dateFrom !== null) {
        $conditions[] = 'e.timestamp >= :date_from';
        $params[':date_from'] = $dateFrom;
    }
    if ($dateTo !== null) {
        $conditions[] = 'e.timestamp <= :date_to';
        $params[':date_to'] = $dateTo;
    }

    $search = trim((string)($_GET['search'] ?? ''));
    if ($search !== '') {
        $conditions[] = '(e.error_code LIKE :search OR e.error_message LIKE :search OR u.full_name LIKE :search OR u.email LIKE :search)';
        $params[':search'] = '%' . $search . '%';
    }

    $whereClause = !empty($conditions) ? ' WHERE ' . implode(' AND ', $conditions) : '';
    $limit = parse_limit_param($_GET['limit'] ?? null, 50, 200);
    $page = parse_page_param($_GET['page'] ?? null);
    $offset = ($page - 1) * $limit;

    $countSql = 'SELECT COUNT(*) AS total
                 FROM error_logs e
                 LEFT JOIN users u ON u.user_id = e.affected_user_id'
        . $whereClause;
    $countQuery = db()->prepare($countSql);
    $countQuery->execute($params);
    $total = (int)$countQuery->fetchColumn();
    $totalPages = $total > 0 ? (int)ceil($total / $limit) : 0;

    $sql = 'SELECT e.*, u.full_name AS user_name, u.email AS user_email
            FROM error_logs e
            LEFT JOIN users u ON u.user_id = e.affected_user_id'
        . $whereClause
        . ' ORDER BY e.timestamp DESC, e.error_id DESC
            LIMIT :limit OFFSET :offset';

    $query = db()->prepare($sql);
    foreach ($params as $key => $value) {
        $query->bindValue($key, $value);
    }
    $query->bindValue(':limit', $limit, PDO::PARAM_INT);
    $query->bindValue(':offset', $offset, PDO::PARAM_INT);
    $query->execute();
    $rows = $query->fetchAll();

    json_response(
        true,
        'Error logs fetched successfully.',
        [
            'items' => $rows,
            'meta' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'total_pages' => $totalPages,
            ],
        ],
        []
    );
}

function handle_error_logs_create(array $actor, array $payload): void
{
    require_fields($payload, ['error_code', 'error_message']);

    $errorCode = trim((string)$payload['error_code']);
    $errorMessage = trim((string)$payload['error_message']);
    $affectedUserId = parse_positive_int($payload['affected_user_id'] ?? null);

    $errors = [];
    if ($errorCode === '') {
        $errors[] = 'error_code is required.';
    }
    if ($errorMessage === '') {
        $errors[] = 'error_message is required.';
    }
    if (!empty($errors)) {
        json_response(false, 'Validation failed.', new stdClass(), $errors, 400);
    }

    if ($affectedUserId !== null) {
        $userCheck = db()->prepare('SELECT user_id FROM users WHERE user_id = :user_id LIMIT 1');
        $userCheck->execute([':user_id' => $affectedUserId]);
        if (!$userCheck->fetch()) {
            json_response(false, 'Validation failed.', new stdClass(), ['affected_user_id does not exist.'], 400);
        }
    }

    $insert = db()->prepare(
        'INSERT INTO error_logs (error_code, error_message, affected_user_id, `timestamp`)
         VALUES (:error_code, :error_message, :affected_user_id, NOW())'
    );
    $insert->execute([
        ':error_code' => $errorCode,
        ':error_message' => $errorMessage,
        ':affected_user_id' => $affectedUserId,
    ]);

    $errorId = (int)db()->lastInsertId();
    log_activity((int)$actor['user_id'], "Created error log #{$errorId}", 'error_logs');

    $fetch = db()->prepare('SELECT * FROM error_logs WHERE error_id = :error_id LIMIT 1');
    $fetch->execute([':error_id' => $errorId]);
    $row = $fetch->fetch();

    json_response(true, 'Error log created successfully.', $row ?: ['error_id' => $errorId], [], 201);
}

function handle_error_logs_delete(array $actor): void
{
    $errorId = parse_positive_int($_GET['error_id'] ?? null);
    if ($errorId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['error_id is required.'], 400);
    }

    $query = db()->prepare('SELECT error_id FROM error_logs WHERE error_id = :error_id LIMIT 1');
    $query->execute([':error_id' => $errorId]);
    if (!$query->fetch()) {
        json_response(false, 'Error log not found.', new stdClass(), [], 404);
    }

    $delete = db()->prepare('DELETE FROM error_logs WHERE error_id = :error_id');
    $delete->execute([':error_id' => $errorId]);

    log_activity((int)$actor['user_id'], "Deleted error log #{$errorId}", 'error_logs');
    json_response(true, 'Error log deleted successfully.', new stdClass(), []);
}
