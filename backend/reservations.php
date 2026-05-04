<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
$method = request_method();

try {
    $actor = require_auth();

    if ($method === 'GET') {
        handle_reservations_get($actor);
    }

    if ($method === 'POST') {
        handle_reservations_create($actor, request_payload());
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        handle_reservations_update($actor, request_payload());
    }

    if ($method === 'DELETE') {
        handle_reservations_delete($actor);
    }
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Reservations request failed', $user ? (int)$user['user_id'] : null);
}

function handle_reservations_get(array $actor): void
{
    $reservationId = parse_positive_int($_GET['reservation_id'] ?? null);
    if ($reservationId !== null) {
        $query = db()->prepare(
            'SELECT rv.*, r.room_number, r.room_type, b.boarding_house_id, b.house_name, b.owner_id
             FROM reservations rv
             INNER JOIN rooms r ON r.room_id = rv.room_id
             INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
             WHERE rv.reservation_id = :reservation_id
             LIMIT 1'
        );
        $query->execute([':reservation_id' => $reservationId]);
        $row = $query->fetch();
        if (!$row) {
            json_response(false, 'Reservation not found.', new stdClass(), [], 404);
        }

        if (!can_access_reservation($actor, $row)) {
            json_response(false, 'Forbidden.', new stdClass(), ['You are not allowed to access this reservation.'], 403);
        }

        json_response(true, 'Reservation fetched successfully.', $row, []);
    }

    $conditions = [];
    $params = [];
    $parentLinkedSeekerIds = [];

    if ($actor['role'] === 'owner') {
        $conditions[] = 'b.owner_id = :owner_id';
        $params[':owner_id'] = (int)$actor['user_id'];
    } elseif ($actor['role'] === 'seeker') {
        $conditions[] = 'rv.user_id = :user_id';
        $params[':user_id'] = (int)$actor['user_id'];
    } elseif ($actor['role'] === 'parent') {
        $parentLinkedSeekerIds = linked_seeker_ids_for_parent((int)$actor['user_id']);
        if (empty($parentLinkedSeekerIds)) {
            json_response(true, 'Reservations fetched successfully.', [], []);
        }

        $tokens = [];
        foreach ($parentLinkedSeekerIds as $index => $linkedUserId) {
            $token = ':linked_seeker_' . $index;
            $tokens[] = $token;
            $params[$token] = (int)$linkedUserId;
        }

        $conditions[] = 'rv.user_id IN (' . implode(', ', $tokens) . ')';
    }

    $filterUserId = parse_positive_int($_GET['user_id'] ?? null);
    if ($filterUserId !== null) {
        if ($actor['role'] === 'seeker' && $filterUserId !== (int)$actor['user_id']) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only filter your own reservations.'], 403);
        }
        if ($actor['role'] === 'parent' && !in_array($filterUserId, $parentLinkedSeekerIds, true)) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only filter linked seeker reservations.'], 403);
        }
        $conditions[] = 'rv.user_id = :filter_user_id';
        $params[':filter_user_id'] = $filterUserId;
    }

    $filterRoomId = parse_positive_int($_GET['room_id'] ?? null);
    if ($filterRoomId !== null) {
        $conditions[] = 'rv.room_id = :filter_room_id';
        $params[':filter_room_id'] = $filterRoomId;
    }

    $status = strtolower(trim((string)($_GET['status'] ?? '')));
    if ($status !== '') {
        $conditions[] = 'rv.status = :status';
        $params[':status'] = $status;
    }

    $sql = 'SELECT rv.*, r.room_number, r.room_type, b.boarding_house_id, b.house_name, b.owner_id
            FROM reservations rv
            INNER JOIN rooms r ON r.room_id = rv.room_id
            INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id';
    if (!empty($conditions)) {
        $sql .= ' WHERE ' . implode(' AND ', $conditions);
    }
    $sql .= ' ORDER BY rv.reservation_id DESC';

    $query = db()->prepare($sql);
    $query->execute($params);
    $rows = $query->fetchAll();

    json_response(true, 'Reservations fetched successfully.', $rows, []);
}

function handle_reservations_create(array $actor, array $payload): void
{
    if (!in_array($actor['role'], ['seeker', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only seeker or admin can create reservations.'], 403);
    }

    require_fields($payload, ['room_id', 'move_in_date']);

    $roomId = parse_positive_int($payload['room_id'] ?? null);
    $moveInDate = trim((string)$payload['move_in_date']);
    $remarks = trim((string)($payload['remarks'] ?? ''));

    $userId = (int)$actor['user_id'];
    if ($actor['role'] === 'admin') {
        $userId = parse_positive_int($payload['user_id'] ?? null) ?? 0;
        if ($userId <= 0) {
            json_response(false, 'Validation failed.', new stdClass(), ['user_id is required when admin creates a reservation.'], 400);
        }
    }

    $errors = [];
    if ($roomId === null) {
        $errors[] = 'room_id must be a positive integer.';
    }
    if (!is_valid_date($moveInDate)) {
        $errors[] = 'move_in_date must use YYYY-MM-DD format.';
    }
    if (!empty($errors)) {
        json_response(false, 'Validation failed.', new stdClass(), $errors, 400);
    }

    $userQuery = db()->prepare('SELECT user_id FROM users WHERE user_id = :user_id LIMIT 1');
    $userQuery->execute([':user_id' => $userId]);
    if (!$userQuery->fetch()) {
        json_response(false, 'Validation failed.', new stdClass(), ['user_id does not exist.'], 400);
    }

    $roomQuery = db()->prepare(
        'SELECT r.room_id, r.availability_status
         FROM rooms r
         WHERE r.room_id = :room_id
         LIMIT 1'
    );
    $roomQuery->execute([':room_id' => $roomId]);
    $room = $roomQuery->fetch();
    if (!$room) {
        json_response(false, 'Validation failed.', new stdClass(), ['room_id does not exist.'], 400);
    }
    if (($room['availability_status'] ?? '') === 'occupied') {
        json_response(false, 'Validation failed.', new stdClass(), ['Selected room is not available for reservation.'], 400);
    }

    $insert = db()->prepare(
        'INSERT INTO reservations (user_id, room_id, date_submitted, move_in_date, status, remarks)
         VALUES (:user_id, :room_id, NOW(), :move_in_date, :status, :remarks)'
    );
    $insert->execute([
        ':user_id' => $userId,
        ':room_id' => $roomId,
        ':move_in_date' => $moveInDate,
        ':status' => 'pending',
        ':remarks' => $remarks,
    ]);

    $reservationId = (int)db()->lastInsertId();
    log_activity((int)$actor['user_id'], "Created reservation #{$reservationId}", 'reservations');

    $fetch = db()->prepare('SELECT * FROM reservations WHERE reservation_id = :id LIMIT 1');
    $fetch->execute([':id' => $reservationId]);
    $row = $fetch->fetch();

    json_response(true, 'Reservation created successfully.', $row ?: ['reservation_id' => $reservationId], [], 201);
}

function handle_reservations_update(array $actor, array $payload): void
{
    $reservationId = parse_positive_int($_GET['reservation_id'] ?? ($payload['reservation_id'] ?? null));
    if ($reservationId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['reservation_id is required.'], 400);
    }

    $existingQuery = db()->prepare(
        'SELECT rv.*, b.owner_id
         FROM reservations rv
         INNER JOIN rooms r ON r.room_id = rv.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE rv.reservation_id = :reservation_id
         LIMIT 1'
    );
    $existingQuery->execute([':reservation_id' => $reservationId]);
    $existing = $existingQuery->fetch();
    if (!$existing) {
        json_response(false, 'Reservation not found.', new stdClass(), [], 404);
    }

    if (!can_access_reservation($actor, $existing)) {
        json_response(false, 'Forbidden.', new stdClass(), ['You are not allowed to update this reservation.'], 403);
    }

    $isOwnerOrAdmin = in_array($actor['role'], ['owner', 'admin'], true);
    if (!$isOwnerOrAdmin && ($existing['status'] ?? '') !== 'pending') {
        json_response(false, 'Forbidden.', new stdClass(), ['Only pending reservations can be modified by requester roles.'], 403);
    }

    $updates = [];
    $params = [':reservation_id' => $reservationId];

    if (array_key_exists('move_in_date', $payload)) {
        $moveInDate = trim((string)$payload['move_in_date']);
        if (!is_valid_date($moveInDate)) {
            json_response(false, 'Validation failed.', new stdClass(), ['move_in_date must use YYYY-MM-DD format.'], 400);
        }
        $updates[] = 'move_in_date = :move_in_date';
        $params[':move_in_date'] = $moveInDate;
    }

    if (array_key_exists('remarks', $payload)) {
        $updates[] = 'remarks = :remarks';
        $params[':remarks'] = trim((string)$payload['remarks']);
    }

    if ($isOwnerOrAdmin && array_key_exists('status', $payload)) {
        $status = strtolower(trim((string)$payload['status']));
        if (!in_array($status, ['pending', 'approved', 'rejected'], true)) {
            json_response(false, 'Validation failed.', new stdClass(), ['status must be pending, approved, or rejected.'], 400);
        }
        $updates[] = 'status = :status';
        $params[':status'] = $status;
    } elseif (!$isOwnerOrAdmin && array_key_exists('status', $payload)) {
        json_response(false, 'Forbidden.', new stdClass(), ['You cannot update reservation status.'], 403);
    }

    if (empty($updates)) {
        json_response(false, 'Validation failed.', new stdClass(), ['No updatable fields provided.'], 400);
    }

    $sql = 'UPDATE reservations SET ' . implode(', ', $updates) . ' WHERE reservation_id = :reservation_id';
    $update = db()->prepare($sql);
    $update->execute($params);

    log_activity((int)$actor['user_id'], "Updated reservation #{$reservationId}", 'reservations');

    $fetch = db()->prepare('SELECT * FROM reservations WHERE reservation_id = :id LIMIT 1');
    $fetch->execute([':id' => $reservationId]);
    $row = $fetch->fetch();

    json_response(true, 'Reservation updated successfully.', $row ?: new stdClass(), []);
}

function handle_reservations_delete(array $actor): void
{
    $reservationId = parse_positive_int($_GET['reservation_id'] ?? null);
    if ($reservationId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['reservation_id is required.'], 400);
    }

    $query = db()->prepare(
        'SELECT rv.reservation_id, rv.user_id, rv.status, b.owner_id
         FROM reservations rv
         INNER JOIN rooms r ON r.room_id = rv.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE rv.reservation_id = :reservation_id
         LIMIT 1'
    );
    $query->execute([':reservation_id' => $reservationId]);
    $row = $query->fetch();
    if (!$row) {
        json_response(false, 'Reservation not found.', new stdClass(), [], 404);
    }

    $allowed = false;
    if ($actor['role'] === 'admin') {
        $allowed = true;
    } elseif ($actor['role'] === 'owner' && (int)$row['owner_id'] === (int)$actor['user_id']) {
        $allowed = true;
    } elseif (in_array($actor['role'], ['seeker', 'parent'], true)
        && (int)$row['user_id'] === (int)$actor['user_id']
        && $row['status'] === 'pending') {
        $allowed = true;
    } elseif ($actor['role'] === 'parent'
        && parent_is_linked_to_seeker((int)$actor['user_id'], (int)$row['user_id'])
        && $row['status'] === 'pending') {
        $allowed = true;
    }

    if (!$allowed) {
        json_response(false, 'Forbidden.', new stdClass(), ['You are not allowed to delete this reservation.'], 403);
    }

    $delete = db()->prepare('DELETE FROM reservations WHERE reservation_id = :reservation_id');
    $delete->execute([':reservation_id' => $reservationId]);

    log_activity((int)$actor['user_id'], "Deleted reservation #{$reservationId}", 'reservations');
    json_response(true, 'Reservation deleted successfully.', new stdClass(), []);
}

function can_access_reservation(array $actor, array $reservationRow): bool
{
    if ($actor['role'] === 'admin') {
        return true;
    }
    if ($actor['role'] === 'owner') {
        return (int)$reservationRow['owner_id'] === (int)$actor['user_id'];
    }
    if ($actor['role'] === 'seeker') {
        return (int)$reservationRow['user_id'] === (int)$actor['user_id'];
    }
    if ($actor['role'] === 'parent') {
        return parent_is_linked_to_seeker((int)$actor['user_id'], (int)$reservationRow['user_id']);
    }

    return false;
}

function is_valid_date(string $date): bool
{
    $value = DateTime::createFromFormat('Y-m-d', $date);
    return $value instanceof DateTime && $value->format('Y-m-d') === $date;
}
