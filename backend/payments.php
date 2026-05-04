<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
$method = request_method();

try {
    $actor = require_auth();

    if ($method === 'GET') {
        handle_payments_get($actor);
    }

    if ($method === 'POST') {
        handle_payments_create($actor, request_payload());
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        handle_payments_update($actor, request_payload());
    }

    if ($method === 'DELETE') {
        handle_payments_delete($actor);
    }
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Payments request failed', $user ? (int)$user['user_id'] : null);
}

function handle_payments_get(array $actor): void
{
    $paymentId = parse_positive_int($_GET['payment_id'] ?? null);
    if ($paymentId !== null) {
        $query = db()->prepare(
            'SELECT p.*, b.owner_id
             FROM payments p
             INNER JOIN rooms r ON r.room_id = p.room_id
             INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
             WHERE p.payment_id = :payment_id
             LIMIT 1'
        );
        $query->execute([':payment_id' => $paymentId]);
        $payment = $query->fetch();
        if (!$payment) {
            json_response(false, 'Payment not found.', new stdClass(), [], 404);
        }

        if (!can_access_payment($actor, $payment)) {
            json_response(false, 'Forbidden.', new stdClass(), ['You are not allowed to access this payment.'], 403);
        }

        json_response(true, 'Payment fetched successfully.', $payment, []);
    }

    $conditions = [];
    $params = [];
    $parentLinkedSeekerIds = [];

    if ($actor['role'] === 'owner') {
        $conditions[] = 'b.owner_id = :owner_id';
        $params[':owner_id'] = (int)$actor['user_id'];
    } elseif ($actor['role'] === 'seeker') {
        $conditions[] = 'p.user_id = :user_id';
        $params[':user_id'] = (int)$actor['user_id'];
    } elseif ($actor['role'] === 'parent') {
        $parentLinkedSeekerIds = linked_seeker_ids_for_parent((int)$actor['user_id']);
        if (empty($parentLinkedSeekerIds)) {
            json_response(true, 'Payments fetched successfully.', [], []);
        }

        $tokens = [];
        foreach ($parentLinkedSeekerIds as $index => $linkedUserId) {
            $token = ':linked_seeker_' . $index;
            $tokens[] = $token;
            $params[$token] = (int)$linkedUserId;
        }

        $conditions[] = 'p.user_id IN (' . implode(', ', $tokens) . ')';
    }

    $filterReservationId = parse_positive_int($_GET['reservation_id'] ?? null);
    if ($filterReservationId !== null) {
        $conditions[] = 'p.reservation_id = :reservation_id';
        $params[':reservation_id'] = $filterReservationId;
    }

    $filterUserId = parse_positive_int($_GET['user_id'] ?? null);
    if ($filterUserId !== null) {
        if ($actor['role'] === 'seeker' && $filterUserId !== (int)$actor['user_id']) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only filter your own payments.'], 403);
        }
        if ($actor['role'] === 'parent' && !in_array($filterUserId, $parentLinkedSeekerIds, true)) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only filter linked seeker payments.'], 403);
        }
        $conditions[] = 'p.user_id = :filter_user_id';
        $params[':filter_user_id'] = $filterUserId;
    }

    $status = strtolower(trim((string)($_GET['payment_status'] ?? '')));
    if ($status !== '') {
        $conditions[] = 'p.payment_status = :payment_status';
        $params[':payment_status'] = $status;
    }

    $sql = 'SELECT p.*, b.owner_id
            FROM payments p
            INNER JOIN rooms r ON r.room_id = p.room_id
            INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id';
    if (!empty($conditions)) {
        $sql .= ' WHERE ' . implode(' AND ', $conditions);
    }
    $sql .= ' ORDER BY p.payment_id DESC';

    $query = db()->prepare($sql);
    $query->execute($params);
    $payments = $query->fetchAll();

    json_response(true, 'Payments fetched successfully.', $payments, []);
}

function handle_payments_create(array $actor, array $payload): void
{
    if (!in_array($actor['role'], ['owner', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only owner or admin can create payment records.'], 403);
    }

    require_fields($payload, ['reservation_id', 'user_id', 'room_id', 'amount_due', 'amount_paid', 'billing_period']);

    $reservationId = parse_positive_int($payload['reservation_id'] ?? null);
    $userId = parse_positive_int($payload['user_id'] ?? null);
    $roomId = parse_positive_int($payload['room_id'] ?? null);
    $amountDue = $payload['amount_due'] ?? null;
    $amountPaid = $payload['amount_paid'] ?? null;
    $billingPeriod = trim((string)$payload['billing_period']);
    $paymentDate = trim((string)($payload['payment_date'] ?? date('Y-m-d')));
    $paymentStatus = strtolower(trim((string)($payload['payment_status'] ?? '')));

    $errors = [];
    if ($reservationId === null) {
        $errors[] = 'reservation_id must be a positive integer.';
    }
    if ($userId === null) {
        $errors[] = 'user_id must be a positive integer.';
    }
    if ($roomId === null) {
        $errors[] = 'room_id must be a positive integer.';
    }
    if (!is_numeric((string)$amountDue) || (float)$amountDue < 0) {
        $errors[] = 'amount_due must be a valid non-negative number.';
    }
    if (!is_numeric((string)$amountPaid) || (float)$amountPaid < 0) {
        $errors[] = 'amount_paid must be a valid non-negative number.';
    }
    if ($billingPeriod === '') {
        $errors[] = 'billing_period is required.';
    }
    if (!is_valid_payment_date($paymentDate)) {
        $errors[] = 'payment_date must use YYYY-MM-DD format.';
    }
    if (!empty($errors)) {
        json_response(false, 'Validation failed.', new stdClass(), $errors, 400);
    }

    $reservationQuery = db()->prepare(
        'SELECT reservation_id, user_id, room_id
         FROM reservations
         WHERE reservation_id = :reservation_id
         LIMIT 1'
    );
    $reservationQuery->execute([':reservation_id' => $reservationId]);
    $reservation = $reservationQuery->fetch();
    if (!$reservation) {
        json_response(false, 'Validation failed.', new stdClass(), ['reservation_id does not exist.'], 400);
    }
    if ((int)$reservation['user_id'] !== $userId || (int)$reservation['room_id'] !== $roomId) {
        json_response(false, 'Validation failed.', new stdClass(), ['reservation_id does not match the provided user_id/room_id.'], 400);
    }

    if ($actor['role'] === 'owner' && !owner_owns_room((int)$actor['user_id'], $roomId)) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only record payments for your own rooms.'], 403);
    }

    $dueValue = (float)$amountDue;
    $paidValue = (float)$amountPaid;
    if ($paymentStatus === '') {
        $paymentStatus = $paidValue >= $dueValue ? 'paid' : 'unpaid';
    }
    if (!in_array($paymentStatus, ['paid', 'unpaid'], true)) {
        json_response(false, 'Validation failed.', new stdClass(), ['payment_status must be paid or unpaid.'], 400);
    }

    $insert = db()->prepare(
        'INSERT INTO payments (
            reservation_id, user_id, room_id, amount_due, amount_paid, payment_status, payment_date, billing_period, recorded_by
         ) VALUES (
            :reservation_id, :user_id, :room_id, :amount_due, :amount_paid, :payment_status, :payment_date, :billing_period, :recorded_by
         )'
    );
    $insert->execute([
        ':reservation_id' => $reservationId,
        ':user_id' => $userId,
        ':room_id' => $roomId,
        ':amount_due' => $dueValue,
        ':amount_paid' => $paidValue,
        ':payment_status' => $paymentStatus,
        ':payment_date' => $paymentDate,
        ':billing_period' => $billingPeriod,
        ':recorded_by' => (int)$actor['user_id'],
    ]);

    $newId = (int)db()->lastInsertId();
    log_activity((int)$actor['user_id'], "Created payment #{$newId}", 'payments');

    $fetch = db()->prepare('SELECT * FROM payments WHERE payment_id = :id LIMIT 1');
    $fetch->execute([':id' => $newId]);
    $row = $fetch->fetch();

    json_response(true, 'Payment recorded successfully.', $row ?: ['payment_id' => $newId], [], 201);
}

function handle_payments_update(array $actor, array $payload): void
{
    if (!in_array($actor['role'], ['owner', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only owner or admin can update payment records.'], 403);
    }

    $paymentId = parse_positive_int($_GET['payment_id'] ?? ($payload['payment_id'] ?? null));
    if ($paymentId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['payment_id is required.'], 400);
    }

    $existingQuery = db()->prepare(
        'SELECT p.*, b.owner_id
         FROM payments p
         INNER JOIN rooms r ON r.room_id = p.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE p.payment_id = :payment_id
         LIMIT 1'
    );
    $existingQuery->execute([':payment_id' => $paymentId]);
    $existing = $existingQuery->fetch();
    if (!$existing) {
        json_response(false, 'Payment not found.', new stdClass(), [], 404);
    }

    if ($actor['role'] === 'owner' && (int)$existing['owner_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only update payments for your own rooms.'], 403);
    }

    $updates = [];
    $params = [':payment_id' => $paymentId];
    $due = (float)$existing['amount_due'];
    $paid = (float)$existing['amount_paid'];
    $statusExplicit = false;

    if (array_key_exists('amount_due', $payload)) {
        if (!is_numeric((string)$payload['amount_due']) || (float)$payload['amount_due'] < 0) {
            json_response(false, 'Validation failed.', new stdClass(), ['amount_due must be a valid non-negative number.'], 400);
        }
        $due = (float)$payload['amount_due'];
        $updates[] = 'amount_due = :amount_due';
        $params[':amount_due'] = $due;
    }
    if (array_key_exists('amount_paid', $payload)) {
        if (!is_numeric((string)$payload['amount_paid']) || (float)$payload['amount_paid'] < 0) {
            json_response(false, 'Validation failed.', new stdClass(), ['amount_paid must be a valid non-negative number.'], 400);
        }
        $paid = (float)$payload['amount_paid'];
        $updates[] = 'amount_paid = :amount_paid';
        $params[':amount_paid'] = $paid;
    }
    if (array_key_exists('payment_status', $payload)) {
        $status = strtolower(trim((string)$payload['payment_status']));
        if (!in_array($status, ['paid', 'unpaid'], true)) {
            json_response(false, 'Validation failed.', new stdClass(), ['payment_status must be paid or unpaid.'], 400);
        }
        $updates[] = 'payment_status = :payment_status';
        $params[':payment_status'] = $status;
        $statusExplicit = true;
    }
    if (array_key_exists('payment_date', $payload)) {
        $paymentDate = trim((string)$payload['payment_date']);
        if (!is_valid_payment_date($paymentDate)) {
            json_response(false, 'Validation failed.', new stdClass(), ['payment_date must use YYYY-MM-DD format.'], 400);
        }
        $updates[] = 'payment_date = :payment_date';
        $params[':payment_date'] = $paymentDate;
    }
    if (array_key_exists('billing_period', $payload)) {
        $billingPeriod = trim((string)$payload['billing_period']);
        if ($billingPeriod === '') {
            json_response(false, 'Validation failed.', new stdClass(), ['billing_period cannot be empty.'], 400);
        }
        $updates[] = 'billing_period = :billing_period';
        $params[':billing_period'] = $billingPeriod;
    }

    if (!$statusExplicit && (array_key_exists('amount_due', $payload) || array_key_exists('amount_paid', $payload))) {
        $autoStatus = $paid >= $due ? 'paid' : 'unpaid';
        $updates[] = 'payment_status = :payment_status';
        $params[':payment_status'] = $autoStatus;
    }

    if (empty($updates)) {
        json_response(false, 'Validation failed.', new stdClass(), ['No updatable fields provided.'], 400);
    }

    $sql = 'UPDATE payments SET ' . implode(', ', $updates) . ' WHERE payment_id = :payment_id';
    $update = db()->prepare($sql);
    $update->execute($params);

    log_activity((int)$actor['user_id'], "Updated payment #{$paymentId}", 'payments');

    $fetch = db()->prepare('SELECT * FROM payments WHERE payment_id = :payment_id LIMIT 1');
    $fetch->execute([':payment_id' => $paymentId]);
    $row = $fetch->fetch();

    json_response(true, 'Payment updated successfully.', $row ?: new stdClass(), []);
}

function handle_payments_delete(array $actor): void
{
    if (!in_array($actor['role'], ['owner', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only owner or admin can delete payment records.'], 403);
    }

    $paymentId = parse_positive_int($_GET['payment_id'] ?? null);
    if ($paymentId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['payment_id is required.'], 400);
    }

    $query = db()->prepare(
        'SELECT p.payment_id, b.owner_id
         FROM payments p
         INNER JOIN rooms r ON r.room_id = p.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE p.payment_id = :payment_id
         LIMIT 1'
    );
    $query->execute([':payment_id' => $paymentId]);
    $payment = $query->fetch();
    if (!$payment) {
        json_response(false, 'Payment not found.', new stdClass(), [], 404);
    }

    if ($actor['role'] === 'owner' && (int)$payment['owner_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only delete payments for your own rooms.'], 403);
    }

    $delete = db()->prepare('DELETE FROM payments WHERE payment_id = :payment_id');
    $delete->execute([':payment_id' => $paymentId]);

    log_activity((int)$actor['user_id'], "Deleted payment #{$paymentId}", 'payments');
    json_response(true, 'Payment deleted successfully.', new stdClass(), []);
}

function can_access_payment(array $actor, array $paymentRow): bool
{
    if ($actor['role'] === 'admin') {
        return true;
    }
    if ($actor['role'] === 'owner') {
        return (int)$paymentRow['owner_id'] === (int)$actor['user_id'];
    }
    if ($actor['role'] === 'seeker') {
        return (int)$paymentRow['user_id'] === (int)$actor['user_id'];
    }
    if ($actor['role'] === 'parent') {
        return parent_is_linked_to_seeker((int)$actor['user_id'], (int)$paymentRow['user_id']);
    }

    return false;
}

function is_valid_payment_date(string $date): bool
{
    $value = DateTime::createFromFormat('Y-m-d', $date);
    return $value instanceof DateTime && $value->format('Y-m-d') === $date;
}
