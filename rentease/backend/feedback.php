<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'PATCH', 'DELETE']);
$method = request_method();

try {
    $actor = require_auth();
    ensure_feedback_table_exists();

    if ($method === 'GET') {
        handle_feedback_get($actor);
    }

    if ($method === 'POST') {
        handle_feedback_create($actor, request_payload());
    }

    if ($method === 'PATCH') {
        handle_feedback_update($actor, request_payload());
    }

    if ($method === 'DELETE') {
        handle_feedback_delete($actor);
    }
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Feedback request failed', $user ? (int)$user['user_id'] : null);
}

function ensure_feedback_table_exists(): void
{
    $query = db()->query("SHOW TABLES LIKE 'feedback'");
    $exists = $query ? $query->fetchColumn() : false;

    if (!$exists) {
        json_response(
            false,
            'Server misconfiguration.',
            new stdClass(),
            ['feedback table is missing. Apply the Phase 6 SQL migration first.'],
            500
        );
    }
}

function feedback_base_select(): string
{
    return ' FROM feedback f
             INNER JOIN users u ON u.user_id = f.user_id
             INNER JOIN reservations rv ON rv.reservation_id = f.reservation_id
             INNER JOIN rooms r ON r.room_id = rv.room_id
             INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id ';
}

function apply_feedback_scope(array $actor, array $conditions, array $params): array
{
    if ($actor['role'] === 'owner') {
        $conditions[] = 'b.owner_id = :owner_id';
        $params[':owner_id'] = (int)$actor['user_id'];
    } elseif ($actor['role'] === 'seeker') {
        $conditions[] = 'f.user_id = :actor_user_id';
        $params[':actor_user_id'] = (int)$actor['user_id'];
    } elseif ($actor['role'] === 'parent') {
        $linkedSeekerIds = linked_seeker_ids_for_parent((int)$actor['user_id']);
        if (empty($linkedSeekerIds)) {
            $conditions[] = '1 = 0';
        } else {
            $tokens = [];
            foreach ($linkedSeekerIds as $index => $linkedUserId) {
                $token = ':linked_seeker_' . $index;
                $tokens[] = $token;
                $params[$token] = (int)$linkedUserId;
            }
            $conditions[] = 'rv.user_id IN (' . implode(', ', $tokens) . ')';
        }
    }

    return [
        'conditions' => $conditions,
        'params' => $params,
    ];
}

function feedback_where_clause(array $conditions): string
{
    if (empty($conditions)) {
        return '';
    }

    return ' WHERE ' . implode(' AND ', $conditions);
}

function fetch_feedback_by_id(int $feedbackId): ?array
{
    $sql = 'SELECT f.*, u.full_name AS user_name, u.email AS user_email,
                   rv.user_id AS reservation_user_id, rv.status AS reservation_status, rv.move_in_date,
                   r.room_number, r.room_type, r.room_id,
                   b.boarding_house_id, b.house_name, b.owner_id'
        . feedback_base_select()
        . ' WHERE f.feedback_id = :feedback_id
            LIMIT 1';

    $query = db()->prepare($sql);
    $query->execute([':feedback_id' => $feedbackId]);
    $row = $query->fetch();

    return $row ?: null;
}

function validate_feedback_access(array $actor, array $feedback): bool
{
    if ($actor['role'] === 'admin') {
        return true;
    }
    if ($actor['role'] === 'owner') {
        return (int)$feedback['owner_id'] === (int)$actor['user_id'];
    }
    if ($actor['role'] === 'parent') {
        $reservationUserId = isset($feedback['reservation_user_id']) ? (int)$feedback['reservation_user_id'] : 0;
        if ($reservationUserId > 0 && parent_is_linked_to_seeker((int)$actor['user_id'], $reservationUserId)) {
            return true;
        }
    }
    return (int)$feedback['user_id'] === (int)$actor['user_id'];
}

function handle_feedback_get(array $actor): void
{
    $feedbackId = parse_positive_int($_GET['feedback_id'] ?? null);
    if ($feedbackId !== null) {
        $feedback = fetch_feedback_by_id($feedbackId);
        if ($feedback === null) {
            json_response(false, 'Feedback not found.', new stdClass(), [], 404);
        }
        if (!validate_feedback_access($actor, $feedback)) {
            json_response(false, 'Forbidden.', new stdClass(), ['You are not allowed to access this feedback entry.'], 403);
        }

        json_response(true, 'Feedback fetched successfully.', $feedback, []);
    }

    $conditions = [];
    $params = [];

    $scoped = apply_feedback_scope($actor, $conditions, $params);
    $conditions = $scoped['conditions'];
    $params = $scoped['params'];

    $filterUserId = parse_positive_int($_GET['user_id'] ?? null);
    if ($filterUserId !== null) {
        if ($actor['role'] === 'seeker' && $filterUserId !== (int)$actor['user_id']) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only filter your own feedback.'], 403);
        }
        if ($actor['role'] === 'parent'
            && !parent_is_linked_to_seeker((int)$actor['user_id'], $filterUserId)) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only filter linked seeker feedback.'], 403);
        }
        $conditions[] = 'f.user_id = :filter_user_id';
        $params[':filter_user_id'] = $filterUserId;
    }

    $reservationId = parse_positive_int($_GET['reservation_id'] ?? null);
    if ($reservationId !== null) {
        $conditions[] = 'f.reservation_id = :reservation_id';
        $params[':reservation_id'] = $reservationId;
    }

    $status = strtolower(trim((string)($_GET['status'] ?? '')));
    if ($status !== '') {
        if (!in_array($status, ['visible', 'hidden'], true)) {
            json_response(false, 'Validation failed.', new stdClass(), ['status must be visible or hidden.'], 400);
        }
        $conditions[] = 'f.status = :status';
        $params[':status'] = $status;
    }

    $rating = parse_positive_int($_GET['rating'] ?? null);
    if ($rating !== null) {
        if ($rating < 1 || $rating > 5) {
            json_response(false, 'Validation failed.', new stdClass(), ['rating filter must be between 1 and 5.'], 400);
        }
        $conditions[] = 'f.rating = :rating';
        $params[':rating'] = $rating;
    }

    $boardingHouseId = parse_positive_int($_GET['boarding_house_id'] ?? null);
    if ($boardingHouseId !== null) {
        if ($actor['role'] === 'owner' && !owner_owns_boarding_house((int)$actor['user_id'], $boardingHouseId)) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only filter your own boarding house.'], 403);
        }
        if (in_array($actor['role'], ['seeker', 'parent'], true)) {
            json_response(false, 'Forbidden.', new stdClass(), ['This role cannot filter by boarding_house_id.'], 403);
        }

        $conditions[] = 'b.boarding_house_id = :boarding_house_id';
        $params[':boarding_house_id'] = $boardingHouseId;
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
        $conditions[] = 'f.created_at >= :date_from';
        $params[':date_from'] = $dateFrom;
    }
    if ($dateTo !== null) {
        $conditions[] = 'f.created_at <= :date_to';
        $params[':date_to'] = $dateTo;
    }

    $search = trim((string)($_GET['search'] ?? ''));
    if ($search !== '') {
        $conditions[] = '(f.comment LIKE :search OR u.full_name LIKE :search OR u.email LIKE :search)';
        $params[':search'] = '%' . $search . '%';
    }

    $limit = parse_limit_param($_GET['limit'] ?? null, 25, 200);
    $page = parse_page_param($_GET['page'] ?? null);
    $offset = ($page - 1) * $limit;

    $countSql = 'SELECT COUNT(*) AS total'
        . feedback_base_select()
        . feedback_where_clause($conditions);
    $countQuery = db()->prepare($countSql);
    $countQuery->execute($params);
    $total = (int)$countQuery->fetchColumn();
    $totalPages = $total > 0 ? (int)ceil($total / $limit) : 0;

    $sql = 'SELECT f.*, u.full_name AS user_name, u.email AS user_email,
                   rv.user_id AS reservation_user_id, rv.status AS reservation_status, rv.move_in_date,
                   r.room_number, r.room_type, r.room_id,
                   b.boarding_house_id, b.house_name, b.owner_id'
        . feedback_base_select()
        . feedback_where_clause($conditions)
        . ' ORDER BY f.created_at DESC, f.feedback_id DESC
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
        'Feedback list fetched successfully.',
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

function handle_feedback_create(array $actor, array $payload): void
{
    if (!in_array($actor['role'], ['seeker', 'parent'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only seeker or parent can submit feedback.'], 403);
    }

    require_fields($payload, ['reservation_id', 'rating', 'comment']);

    $reservationId = parse_positive_int($payload['reservation_id'] ?? null);
    $rating = parse_positive_int($payload['rating'] ?? null);
    $comment = trim((string)($payload['comment'] ?? ''));

    $errors = [];
    if ($reservationId === null) {
        $errors[] = 'reservation_id must be a positive integer.';
    }
    if ($rating === null || $rating < 1 || $rating > 5) {
        $errors[] = 'rating must be between 1 and 5.';
    }
    if ($comment === '') {
        $errors[] = 'comment is required.';
    } else {
        $length = strlen($comment);
        if ($length < 5) {
            $errors[] = 'comment must be at least 5 characters.';
        }
        if ($length > 1000) {
            $errors[] = 'comment cannot exceed 1000 characters.';
        }
    }
    if (!empty($errors)) {
        json_response(false, 'Validation failed.', new stdClass(), $errors, 400);
    }

    $reservationQuery = db()->prepare(
        'SELECT rv.reservation_id, rv.user_id, rv.status, rv.room_id
         FROM reservations rv
         WHERE rv.reservation_id = :reservation_id
         LIMIT 1'
    );
    $reservationQuery->execute([':reservation_id' => $reservationId]);
    $reservation = $reservationQuery->fetch();
    if (!$reservation) {
        json_response(false, 'Validation failed.', new stdClass(), ['reservation_id does not exist.'], 400);
    }
    if ($actor['role'] === 'seeker' && (int)$reservation['user_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only submit feedback for your own reservation.'], 403);
    }
    if ($actor['role'] === 'parent'
        && !parent_is_linked_to_seeker((int)$actor['user_id'], (int)$reservation['user_id'])) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only submit feedback for linked seeker reservations.'], 403);
    }

    $reservationStatus = strtolower((string)$reservation['status']);
    if (!in_array($reservationStatus, ['approved', 'completed'], true)) {
        json_response(false, 'Validation failed.', new stdClass(), ['Feedback is only allowed for approved or completed reservations.'], 400);
    }

    $duplicateQuery = db()->prepare(
        'SELECT feedback_id
         FROM feedback
         WHERE user_id = :user_id AND reservation_id = :reservation_id
         LIMIT 1'
    );
    $duplicateQuery->execute([
        ':user_id' => (int)$actor['user_id'],
        ':reservation_id' => $reservationId,
    ]);
    if ($duplicateQuery->fetch()) {
        json_response(false, 'Validation failed.', new stdClass(), ['Feedback already exists for this reservation.'], 400);
    }

    $insert = db()->prepare(
        'INSERT INTO feedback (user_id, reservation_id, rating, comment, status, created_at)
         VALUES (:user_id, :reservation_id, :rating, :comment, :status, NOW())'
    );
    $insert->execute([
        ':user_id' => (int)$actor['user_id'],
        ':reservation_id' => $reservationId,
        ':rating' => $rating,
        ':comment' => $comment,
        ':status' => 'visible',
    ]);

    $feedbackId = (int)db()->lastInsertId();
    log_activity((int)$actor['user_id'], "Submitted feedback #{$feedbackId}", 'feedback');

    $feedback = fetch_feedback_by_id($feedbackId);
    json_response(true, 'Feedback submitted successfully.', $feedback ?? ['feedback_id' => $feedbackId], [], 201);
}

function handle_feedback_update(array $actor, array $payload): void
{
    $feedbackId = parse_positive_int($_GET['feedback_id'] ?? ($payload['feedback_id'] ?? null));
    if ($feedbackId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['feedback_id is required.'], 400);
    }

    $existing = fetch_feedback_by_id($feedbackId);
    if ($existing === null) {
        json_response(false, 'Feedback not found.', new stdClass(), [], 404);
    }

    $isAdmin = $actor['role'] === 'admin';
    $isOwner = $actor['role'] === 'owner';
    $isRequesterRole = in_array($actor['role'], ['seeker', 'parent'], true);
    $isOwnerOfFeedback = (int)$existing['user_id'] === (int)$actor['user_id'];

    if ($isOwner) {
        json_response(false, 'Forbidden.', new stdClass(), ['Owner role has read-only feedback access.'], 403);
    }
    if (!$isAdmin && (!$isRequesterRole || !$isOwnerOfFeedback)) {
        json_response(false, 'Forbidden.', new stdClass(), ['You are not allowed to update this feedback entry.'], 403);
    }

    $updates = [];
    $params = [':feedback_id' => $feedbackId];

    if (array_key_exists('rating', $payload)) {
        $rating = parse_positive_int($payload['rating']);
        if ($rating === null || $rating < 1 || $rating > 5) {
            json_response(false, 'Validation failed.', new stdClass(), ['rating must be between 1 and 5.'], 400);
        }
        $updates[] = 'rating = :rating';
        $params[':rating'] = $rating;
    }

    if (array_key_exists('comment', $payload)) {
        $comment = trim((string)$payload['comment']);
        if ($comment === '') {
            json_response(false, 'Validation failed.', new stdClass(), ['comment is required.'], 400);
        }
        $length = strlen($comment);
        if ($length < 5) {
            json_response(false, 'Validation failed.', new stdClass(), ['comment must be at least 5 characters.'], 400);
        }
        if ($length > 1000) {
            json_response(false, 'Validation failed.', new stdClass(), ['comment cannot exceed 1000 characters.'], 400);
        }
        $updates[] = 'comment = :comment';
        $params[':comment'] = $comment;
    }

    if (array_key_exists('status', $payload)) {
        if (!$isAdmin) {
            json_response(false, 'Forbidden.', new stdClass(), ['Only admin can update feedback status.'], 403);
        }

        $status = strtolower(trim((string)$payload['status']));
        if (!in_array($status, ['visible', 'hidden'], true)) {
            json_response(false, 'Validation failed.', new stdClass(), ['status must be visible or hidden.'], 400);
        }

        $updates[] = 'status = :status';
        $params[':status'] = $status;
    }

    if (empty($updates)) {
        json_response(false, 'Validation failed.', new stdClass(), ['No updatable fields provided.'], 400);
    }

    $updates[] = 'updated_at = NOW()';

    $sql = 'UPDATE feedback SET ' . implode(', ', $updates) . ' WHERE feedback_id = :feedback_id';
    $update = db()->prepare($sql);
    $update->execute($params);

    log_activity((int)$actor['user_id'], "Updated feedback #{$feedbackId}", 'feedback');

    $updated = fetch_feedback_by_id($feedbackId);
    json_response(true, 'Feedback updated successfully.', $updated ?? new stdClass(), []);
}

function handle_feedback_delete(array $actor): void
{
    if ($actor['role'] !== 'admin') {
        json_response(false, 'Forbidden.', new stdClass(), ['Only admin can delete feedback entries.'], 403);
    }

    $feedbackId = parse_positive_int($_GET['feedback_id'] ?? null);
    if ($feedbackId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['feedback_id is required.'], 400);
    }

    $existing = fetch_feedback_by_id($feedbackId);
    if ($existing === null) {
        json_response(false, 'Feedback not found.', new stdClass(), [], 404);
    }

    $delete = db()->prepare('DELETE FROM feedback WHERE feedback_id = :feedback_id');
    $delete->execute([':feedback_id' => $feedbackId]);

    log_activity((int)$actor['user_id'], "Deleted feedback #{$feedbackId}", 'feedback');
    json_response(true, 'Feedback deleted successfully.', new stdClass(), []);
}
