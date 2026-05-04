<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'DELETE']);
$method = request_method();

try {
    $actor = require_roles(['admin']);

    if ($method === 'GET') {
        handle_activity_logs_get($actor);
    }

    if ($method === 'POST') {
        handle_activity_logs_create($actor, request_payload());
    }

    if ($method === 'DELETE') {
        handle_activity_logs_delete($actor);
    }
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Activity logs request failed', $user ? (int)$user['user_id'] : null);
}

function handle_activity_logs_get(array $actor): void
{
    $logId = parse_positive_int($_GET['log_id'] ?? null);

    if ($logId !== null) {
        $query = db()->prepare(
            'SELECT a.*, u.full_name AS user_name, u.email AS user_email
             FROM activity_logs a
             LEFT JOIN users u ON u.user_id = a.user_id
             WHERE a.log_id = :log_id
             LIMIT 1'
        );
        $query->execute([':log_id' => $logId]);
        $row = $query->fetch();
        if (!$row) {
            json_response(false, 'Activity log not found.', new stdClass(), [], 404);
        }

        json_response(true, 'Activity log fetched successfully.', $row, []);
    }

    $conditions = [];
    $params = [];

    $userId = parse_positive_int($_GET['user_id'] ?? null);
    if ($userId !== null) {
        $conditions[] = 'a.user_id = :user_id';
        $params[':user_id'] = $userId;
    }

    $module = trim((string)($_GET['module'] ?? ($_GET['affected_module'] ?? '')));
    if ($module !== '') {
        $conditions[] = 'a.affected_module = :affected_module';
        $params[':affected_module'] = $module;
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
        $conditions[] = 'a.timestamp >= :date_from';
        $params[':date_from'] = $dateFrom;
    }
    if ($dateTo !== null) {
        $conditions[] = 'a.timestamp <= :date_to';
        $params[':date_to'] = $dateTo;
    }

    $search = trim((string)($_GET['search'] ?? ''));
    if ($search !== '') {
        $conditions[] = '(a.action_performed LIKE :search OR a.affected_module LIKE :search OR u.full_name LIKE :search OR u.email LIKE :search)';
        $params[':search'] = '%' . $search . '%';
    }

    $whereClause = !empty($conditions) ? ' WHERE ' . implode(' AND ', $conditions) : '';
    $limit = parse_limit_param($_GET['limit'] ?? null, 50, 200);
    $page = parse_page_param($_GET['page'] ?? null);
    $offset = ($page - 1) * $limit;

    $countSql = 'SELECT COUNT(*) AS total
                 FROM activity_logs a
                 LEFT JOIN users u ON u.user_id = a.user_id'
        . $whereClause;
    $countQuery = db()->prepare($countSql);
    $countQuery->execute($params);
    $total = (int)$countQuery->fetchColumn();
    $totalPages = $total > 0 ? (int)ceil($total / $limit) : 0;

    $sql = 'SELECT a.*, u.full_name AS user_name, u.email AS user_email
            FROM activity_logs a
            LEFT JOIN users u ON u.user_id = a.user_id'
        . $whereClause
        . ' ORDER BY a.timestamp DESC, a.log_id DESC
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
        'Activity logs fetched successfully.',
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

function handle_activity_logs_create(array $actor, array $payload): void
{
    require_fields($payload, ['user_id', 'action_performed', 'affected_module']);

    $userId = parse_positive_int($payload['user_id'] ?? null);
    $actionPerformed = trim((string)$payload['action_performed']);
    $affectedModule = trim((string)$payload['affected_module']);

    $errors = [];
    if ($userId === null) {
        $errors[] = 'user_id must be a positive integer.';
    }
    if ($actionPerformed === '') {
        $errors[] = 'action_performed is required.';
    }
    if ($affectedModule === '') {
        $errors[] = 'affected_module is required.';
    }
    if (!empty($errors)) {
        json_response(false, 'Validation failed.', new stdClass(), $errors, 400);
    }

    $userCheck = db()->prepare('SELECT user_id FROM users WHERE user_id = :user_id LIMIT 1');
    $userCheck->execute([':user_id' => $userId]);
    if (!$userCheck->fetch()) {
        json_response(false, 'Validation failed.', new stdClass(), ['user_id does not exist.'], 400);
    }

    $insert = db()->prepare(
        'INSERT INTO activity_logs (user_id, action_performed, affected_module, `timestamp`)
         VALUES (:user_id, :action_performed, :affected_module, NOW())'
    );
    $insert->execute([
        ':user_id' => $userId,
        ':action_performed' => $actionPerformed,
        ':affected_module' => $affectedModule,
    ]);

    $logId = (int)db()->lastInsertId();
    log_activity((int)$actor['user_id'], "Created activity log #{$logId}", 'activity_logs');

    $fetch = db()->prepare('SELECT * FROM activity_logs WHERE log_id = :log_id LIMIT 1');
    $fetch->execute([':log_id' => $logId]);
    $row = $fetch->fetch();

    json_response(true, 'Activity log created successfully.', $row ?: ['log_id' => $logId], [], 201);
}

function handle_activity_logs_delete(array $actor): void
{
    $logId = parse_positive_int($_GET['log_id'] ?? null);
    if ($logId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['log_id is required.'], 400);
    }

    $query = db()->prepare('SELECT log_id FROM activity_logs WHERE log_id = :log_id LIMIT 1');
    $query->execute([':log_id' => $logId]);
    if (!$query->fetch()) {
        json_response(false, 'Activity log not found.', new stdClass(), [], 404);
    }

    $delete = db()->prepare('DELETE FROM activity_logs WHERE log_id = :log_id');
    $delete->execute([':log_id' => $logId]);

    log_activity((int)$actor['user_id'], "Deleted activity log #{$logId}", 'activity_logs');
    json_response(true, 'Activity log deleted successfully.', new stdClass(), []);
}
