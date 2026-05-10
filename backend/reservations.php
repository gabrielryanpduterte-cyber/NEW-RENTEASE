<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
ensure_seeker_feature_schema();
ensure_owner_feature_schema();

$method = request_method();
$payload = in_array($method, ['POST', 'PUT', 'PATCH'], true) ? request_payload() : [];
$action = request_action($payload);

try {
    $actor = require_auth();

    if ($method === 'GET') {
        if ($action === 'valid_id') {
            handle_reservation_valid_id_download($actor);
        }

        handle_reservations_get($actor);
    }

    if ($method === 'POST') {
        if ($action === 'approve') {
            handle_reservations_approve($actor, $payload);
        }
        if ($action === 'reject') {
            handle_reservations_reject($actor, $payload);
        }

        handle_reservations_create($actor, $payload);
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        if ($action === 'cancel') {
            handle_reservations_cancel($actor, $payload);
        }

        handle_reservations_update($actor, $payload);
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
            'SELECT rv.*, r.room_number, r.room_type, r.monthly_rate, r.capacity,
                    b.boarding_house_id, b.house_name, b.owner_id,
                    u.full_name AS user_name, u.email AS user_email,
                    u.contact_number AS user_contact_number,
                    u.school_or_workplace, u.emergency_contact_name, u.emergency_contact_number,
                    u.profile_photo
             FROM reservations rv
             INNER JOIN rooms r ON r.room_id = rv.room_id
             INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
             INNER JOIN users u ON u.user_id = rv.user_id
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

        json_response(true, 'Reservation fetched successfully.', normalize_reservation_row($row), []);
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

    $sql = 'SELECT rv.*, r.room_number, r.room_type, r.monthly_rate, r.capacity,
                   b.boarding_house_id, b.house_name, b.owner_id,
                   u.full_name AS user_name, u.email AS user_email,
                   u.contact_number AS user_contact_number,
                   u.school_or_workplace, u.emergency_contact_name, u.emergency_contact_number,
                   u.profile_photo
            FROM reservations rv
            INNER JOIN rooms r ON r.room_id = rv.room_id
            INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
            INNER JOIN users u ON u.user_id = rv.user_id';
    if (!empty($conditions)) {
        $sql .= ' WHERE ' . implode(' AND ', $conditions);
    }
    $sql .= ' ORDER BY rv.reservation_id DESC';

    $query = db()->prepare($sql);
    $query->execute($params);
    $rows = $query->fetchAll();

    json_response(true, 'Reservations fetched successfully.', array_map('normalize_reservation_row', $rows), []);
}

function handle_reservations_create(array $actor, array $payload): void
{
    if (!in_array($actor['role'], ['seeker', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only seeker or admin can create reservations.'], 403);
    }

    require_fields($payload, ['room_id', 'move_in_date']);

    $roomId = parse_positive_int($payload['room_id'] ?? null);
    $moveInDate = trim((string)$payload['move_in_date']);
    $remarks = trim((string)($payload['remarks'] ?? ($payload['message'] ?? '')));

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
    } elseif (strtotime($moveInDate) <= strtotime(date('Y-m-d'))) {
        $errors[] = 'move_in_date must be after today.';
    }
    if ($remarks !== '' && strlen($remarks) > 500) {
        $errors[] = 'remarks cannot exceed 500 characters.';
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
        "SELECT r.room_id, r.room_number, r.availability_status, r.capacity, r.is_archived,
                (SELECT COUNT(*)
                 FROM reservations approved_reservations
                 WHERE approved_reservations.room_id = r.room_id
                   AND approved_reservations.status = 'approved') AS approved_tenant_count
         FROM rooms r
         WHERE r.room_id = :room_id
         LIMIT 1"
    );
    $roomQuery->execute([':room_id' => $roomId]);
    $room = $roomQuery->fetch();
    if (!$room) {
        json_response(false, 'Validation failed.', new stdClass(), ['room_id does not exist.'], 400);
    }
    $roomAvailability = strtolower((string)($room['availability_status'] ?? ''));
    $approvedTenantCount = (int)($room['approved_tenant_count'] ?? 0);
    $roomCapacity = (int)($room['capacity'] ?? 1);
    if (in_array($roomAvailability, ['unavailable', 'archived'], true) || (int)($room['is_archived'] ?? 0) === 1) {
        json_response(false, 'Validation failed.', new stdClass(), ['Selected room is not available for reservation.'], 400);
    }
    if ($approvedTenantCount >= $roomCapacity) {
        json_response(false, 'Validation failed.', new stdClass(), ['Selected room is already full.'], 400);
    }

    if ($actor['role'] === 'seeker') {
        $activeReservationQuery = db()->prepare(
            'SELECT reservation_id
             FROM reservations
             WHERE user_id = :user_id
               AND status IN (\'pending\', \'approved\')
             LIMIT 1'
        );
        $activeReservationQuery->execute([':user_id' => $userId]);
        if ($activeReservationQuery->fetch()) {
            json_response(false, 'Validation failed.', new stdClass(), ['You already have an active or pending long-term room reservation. Cancel or finish it before requesting another property.'], 400);
        }
    }

    $validIdPath = null;
    if (isset($_FILES['valid_id']) && is_array($_FILES['valid_id'])) {
        $validIdPath = store_uploaded_file(
            $_FILES['valid_id'],
            'storage/private/ids/' . $userId,
            [
                'application/pdf' => 'pdf',
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
            ],
            5 * 1024 * 1024,
            'valid_id'
        );
    }

    $insert = db()->prepare(
        'INSERT INTO reservations (user_id, room_id, date_submitted, move_in_date, status, remarks, valid_id_path)
         VALUES (:user_id, :room_id, NOW(), :move_in_date, :status, :remarks, :valid_id_path)'
    );
    $insert->execute([
        ':user_id' => $userId,
        ':room_id' => $roomId,
        ':move_in_date' => $moveInDate,
        ':status' => 'pending',
        ':remarks' => $remarks,
        ':valid_id_path' => $validIdPath,
    ]);

    $reservationId = (int)db()->lastInsertId();
    log_activity((int)$actor['user_id'], 'Submitted reservation for Room ' . ($room['room_number'] ?? $roomId), 'reservations');

    $fetch = db()->prepare('SELECT * FROM reservations WHERE reservation_id = :id LIMIT 1');
    $fetch->execute([':id' => $reservationId]);
    $row = $fetch->fetch();

    json_response(true, 'Reservation created successfully.', $row ?: ['reservation_id' => $reservationId], [], 201);
}

function handle_reservations_cancel(array $actor, array $payload): void
{
    if ($actor['role'] !== 'seeker') {
        json_response(false, 'Forbidden.', new stdClass(), ['Only seekers can cancel their own pending reservations.'], 403);
    }

    $reservationId = parse_positive_int($_GET['reservation_id'] ?? ($payload['reservation_id'] ?? null));
    if ($reservationId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['reservation_id is required.'], 400);
    }

    $query = db()->prepare(
        'SELECT rv.*, r.room_number, b.owner_id
         FROM reservations rv
         INNER JOIN rooms r ON r.room_id = rv.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE rv.reservation_id = :reservation_id
         LIMIT 1'
    );
    $query->execute([':reservation_id' => $reservationId]);
    $reservation = $query->fetch();
    if (!$reservation) {
        json_response(false, 'Reservation not found.', new stdClass(), [], 404);
    }

    if ((int)$reservation['user_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only cancel your own reservations.'], 403);
    }

    $status = strtolower((string)($reservation['status'] ?? ''));
    if ($status === 'approved') {
        json_response(
            false,
            'Approved reservations cannot be cancelled here. Please contact your landlord.',
            new stdClass(),
            ['Approved reservations cannot be cancelled here. Please contact your landlord.'],
            403
        );
    }

    if (in_array($status, ['rejected', 'cancelled'], true)) {
        json_response(false, 'Reservation cannot be cancelled.', new stdClass(), ['Only pending reservations can be cancelled.'], 400);
    }

    if ($status !== 'pending') {
        json_response(false, 'Reservation cannot be cancelled.', new stdClass(), ['Only pending reservations can be cancelled.'], 400);
    }

    $reason = trim((string)($payload['cancellation_reason'] ?? ''));
    if (strlen($reason) > 300) {
        json_response(false, 'Validation failed.', new stdClass(), ['cancellation_reason cannot exceed 300 characters.'], 400);
    }

    $update = db()->prepare(
        'UPDATE reservations
         SET status = :status,
             cancellation_reason = :cancellation_reason,
             cancelled_at = NOW()
         WHERE reservation_id = :reservation_id'
    );
    $update->execute([
        ':status' => 'cancelled',
        ':cancellation_reason' => $reason !== '' ? $reason : null,
        ':reservation_id' => $reservationId,
    ]);

    log_activity((int)$actor['user_id'], 'Cancelled reservation for Room ' . ($reservation['room_number'] ?? $reservation['room_id']), 'reservations');

    $fetch = db()->prepare(
        'SELECT rv.*, r.room_number, r.room_type, b.boarding_house_id, b.house_name, b.owner_id
         FROM reservations rv
         INNER JOIN rooms r ON r.room_id = rv.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE rv.reservation_id = :reservation_id
         LIMIT 1'
    );
    $fetch->execute([':reservation_id' => $reservationId]);
    $row = $fetch->fetch();

    json_response(true, 'Reservation cancelled successfully.', $row ?: new stdClass(), []);
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

    if ($isOwnerOrAdmin && array_key_exists('status', $payload)) {
        $requestedStatus = strtolower(trim((string)$payload['status']));
        if ($requestedStatus === 'approved') {
            handle_reservations_approve($actor, $payload);
        }
        if ($requestedStatus === 'rejected') {
            handle_reservations_reject($actor, $payload);
        }
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

function handle_reservations_approve(array $actor, array $payload): void
{
    if (!in_array($actor['role'], ['owner', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only owner or admin can approve reservations.'], 403);
    }

    $reservationId = parse_positive_int($_GET['reservation_id'] ?? ($payload['reservation_id'] ?? ($payload['id'] ?? null)));
    if ($reservationId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['reservation_id is required.'], 400);
    }

    $reservation = find_reservation_for_owner_action($reservationId);
    if ($reservation === null) {
        json_response(false, 'Reservation not found.', new stdClass(), [], 404);
    }
    if ($actor['role'] === 'owner' && (int)$reservation['owner_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only approve reservations for your own boarding house.'], 403);
    }
    if (strtolower((string)$reservation['status']) !== 'pending') {
        json_response(false, 'Reservation cannot be approved.', new stdClass(), ['Only pending reservations can be approved.'], 400);
    }
    $approvedTenantCount = (int)($reservation['approved_tenant_count'] ?? 0);
    $roomCapacity = (int)($reservation['capacity'] ?? 1);
    if (in_array(strtolower((string)$reservation['availability_status']), ['unavailable', 'archived'], true)
        || (int)($reservation['is_archived'] ?? 0) === 1) {
        json_response(false, 'Room is not available.', new stdClass(), ['Room must be available before approval.'], 400);
    }
    if ($approvedTenantCount >= $roomCapacity) {
        json_response(false, 'Room is full.', new stdClass(), ['This room already reached its tenant capacity.'], 400);
    }

    $billingMonth = substr((string)$reservation['move_in_date'], 0, 7);
    $dueDate = date('Y-m-d', strtotime((string)$reservation['move_in_date'] . ' +30 days'));

    db()->beginTransaction();
    try {
        $updateReservation = db()->prepare(
            "UPDATE reservations
             SET status = 'approved'
             WHERE reservation_id = :reservation_id"
        );
        $updateReservation->execute([':reservation_id' => $reservationId]);

        $nextStatus = ($approvedTenantCount + 1) >= $roomCapacity ? 'occupied' : 'available';
        $updateRoom = db()->prepare(
            'UPDATE rooms
             SET availability_status = :availability_status,
                 is_archived = 0
             WHERE room_id = :room_id'
        );
        $updateRoom->execute([
            ':availability_status' => $nextStatus,
            ':room_id' => (int)$reservation['room_id'],
        ]);

        $cycleQuery = db()->prepare(
            'SELECT billing_cycle_id
             FROM billing_cycles
             WHERE reservation_id = :reservation_id
               AND billing_month = :billing_month
             LIMIT 1'
        );
        $cycleQuery->execute([
            ':reservation_id' => $reservationId,
            ':billing_month' => $billingMonth,
        ]);

        if (!$cycleQuery->fetchColumn()) {
            $insertCycle = db()->prepare(
                'INSERT INTO billing_cycles (
                    reservation_id, user_id, room_id, billing_month, amount_due, due_date, created_by
                 ) VALUES (
                    :reservation_id, :user_id, :room_id, :billing_month, :amount_due, :due_date, :created_by
                 )'
            );
            $insertCycle->execute([
                ':reservation_id' => $reservationId,
                ':user_id' => (int)$reservation['user_id'],
                ':room_id' => (int)$reservation['room_id'],
                ':billing_month' => $billingMonth,
                ':amount_due' => (float)$reservation['monthly_rate'],
                ':due_date' => $dueDate,
                ':created_by' => (int)$actor['user_id'],
            ]);
        }

        db()->commit();
    } catch (Throwable $exception) {
        db()->rollBack();
        throw $exception;
    }

    log_activity(
        (int)$actor['user_id'],
        'Approved reservation by ' . (string)$reservation['user_name'] . ' for Room ' . (string)$reservation['room_number'],
        'reservations'
    );

    $updated = find_reservation_for_owner_action($reservationId);
    json_response(true, 'Reservation approved successfully.', $updated ? normalize_reservation_row($updated) : new stdClass(), []);
}

function handle_reservations_reject(array $actor, array $payload): void
{
    if (!in_array($actor['role'], ['owner', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only owner or admin can reject reservations.'], 403);
    }

    $reservationId = parse_positive_int($_GET['reservation_id'] ?? ($payload['reservation_id'] ?? ($payload['id'] ?? null)));
    if ($reservationId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['reservation_id is required.'], 400);
    }

    $remarks = trim((string)($payload['rejection_remarks'] ?? ($payload['remarks'] ?? '')));
    if (strlen($remarks) < 10 || strlen($remarks) > 500) {
        json_response(false, 'Validation failed.', new stdClass(), ['rejection_remarks must be 10 to 500 characters.'], 400);
    }

    $reservation = find_reservation_for_owner_action($reservationId);
    if ($reservation === null) {
        json_response(false, 'Reservation not found.', new stdClass(), [], 404);
    }
    if ($actor['role'] === 'owner' && (int)$reservation['owner_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only reject reservations for your own boarding house.'], 403);
    }
    if (strtolower((string)$reservation['status']) !== 'pending') {
        json_response(false, 'Reservation cannot be rejected.', new stdClass(), ['Only pending reservations can be rejected.'], 400);
    }

    $update = db()->prepare(
        "UPDATE reservations
         SET status = 'rejected',
             rejection_remarks = :rejection_remarks
         WHERE reservation_id = :reservation_id"
    );
    $update->execute([
        ':rejection_remarks' => $remarks,
        ':reservation_id' => $reservationId,
    ]);

    log_activity(
        (int)$actor['user_id'],
        'Rejected reservation by ' . (string)$reservation['user_name'] . ' for Room ' . (string)$reservation['room_number'],
        'reservations'
    );

    $updated = find_reservation_for_owner_action($reservationId);
    json_response(true, 'Reservation rejected successfully.', $updated ? normalize_reservation_row($updated) : new stdClass(), []);
}

function find_reservation_for_owner_action(int $reservationId): ?array
{
    $query = db()->prepare(
        "SELECT rv.*, r.room_number, r.room_type, r.monthly_rate, r.capacity,
                r.availability_status, r.is_archived,
                (SELECT COUNT(*)
                 FROM reservations approved_reservations
                 WHERE approved_reservations.room_id = r.room_id
                   AND approved_reservations.status = 'approved') AS approved_tenant_count,
                b.boarding_house_id, b.house_name, b.owner_id,
                u.full_name AS user_name, u.email AS user_email,
                u.contact_number AS user_contact_number,
                u.school_or_workplace, u.emergency_contact_name, u.emergency_contact_number,
                u.profile_photo
         FROM reservations rv
         INNER JOIN rooms r ON r.room_id = rv.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         INNER JOIN users u ON u.user_id = rv.user_id
         WHERE rv.reservation_id = :reservation_id
         LIMIT 1"
    );
    $query->execute([':reservation_id' => $reservationId]);
    $row = $query->fetch();

    return $row ?: null;
}

function normalize_reservation_row(array $row): array
{
    $reservationId = isset($row['reservation_id']) ? (int)$row['reservation_id'] : null;
    $validIdPath = trim((string)($row['valid_id_path'] ?? ''));
    $profilePhoto = trim((string)($row['profile_photo'] ?? ''));

    $row['reservation_id'] = $reservationId;
    $row['user_id'] = isset($row['user_id']) ? (int)$row['user_id'] : null;
    $row['room_id'] = isset($row['room_id']) ? (int)$row['room_id'] : null;
    $row['boarding_house_id'] = isset($row['boarding_house_id']) ? (int)$row['boarding_house_id'] : null;
    $row['monthly_rate'] = isset($row['monthly_rate']) ? (float)$row['monthly_rate'] : 0.0;
    $row['valid_id_url'] = ($reservationId !== null && $validIdPath !== '')
        ? backend_endpoint_url('reservations.php?action=valid_id&reservation_id=' . $reservationId)
        : null;
    $row['profile_photo_url'] = $profilePhoto !== '' ? backend_asset_url($profilePhoto) : null;

    return $row;
}

function handle_reservation_valid_id_download(array $actor): void
{
    $reservationId = parse_positive_int($_GET['reservation_id'] ?? null);
    if ($reservationId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['reservation_id is required.'], 400);
    }

    $reservation = find_reservation_for_owner_action($reservationId);
    if ($reservation === null) {
        json_response(false, 'Reservation not found.', new stdClass(), [], 404);
    }
    if (!can_access_reservation($actor, $reservation)) {
        json_response(false, 'Forbidden.', new stdClass(), ['You are not allowed to access this valid ID.'], 403);
    }

    $relativePath = trim((string)($reservation['valid_id_path'] ?? ''));
    if ($relativePath === '') {
        json_response(false, 'Valid ID not found.', new stdClass(), [], 404);
    }

    $absolutePath = realpath(__DIR__ . '/' . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relativePath));
    $storageRoot = realpath(__DIR__ . '/storage/private/ids');
    if ($absolutePath === false || $storageRoot === false || strpos($absolutePath, $storageRoot) !== 0 || !is_file($absolutePath)) {
        json_response(false, 'Valid ID not found.', new stdClass(), [], 404);
    }

    $mimeType = 'application/octet-stream';
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
        $mimeType = (string)finfo_file($finfo, $absolutePath);
        finfo_close($finfo);
    }

    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . (string)filesize($absolutePath));
    header('Content-Disposition: inline; filename="' . basename($absolutePath) . '"');
    readfile($absolutePath);
    exit;
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
