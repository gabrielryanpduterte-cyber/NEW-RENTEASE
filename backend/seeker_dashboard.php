<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET']);
ensure_seeker_feature_schema();

$action = request_action();

try {
    $actor = require_roles(['seeker']);

    if ($action === '' || $action === 'dashboard') {
        handle_seeker_dashboard($actor);
    }

    if ($action === 'room') {
        handle_seeker_room($actor);
    }

    json_response(false, 'Invalid seeker dashboard action.', new stdClass(), ['Use ?action=dashboard or ?action=room.'], 400);
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Seeker dashboard request failed', $user ? (int)$user['user_id'] : null);
}

function handle_seeker_dashboard(array $actor): void
{
    $userId = (int)$actor['user_id'];
    $activeReservation = find_seeker_reservation($userId, ['approved']);
    $pendingReservation = find_seeker_reservation($userId, ['pending']);
    $currentPayment = find_seeker_current_month_payment($userId);
    $pendingCount = count_seeker_reservations($userId, 'pending');
    $recentActivity = find_seeker_recent_activity($userId);

    json_response(true, 'Seeker dashboard fetched successfully.', [
        'user' => sanitize_user($actor),
        'active_reservation' => $activeReservation ? normalize_seeker_reservation($activeReservation) : null,
        'pending_reservation' => $pendingReservation ? normalize_seeker_reservation($pendingReservation) : null,
        'current_payment' => $currentPayment ? normalize_seeker_payment($currentPayment) : null,
        'pending_reservations_count' => $pendingCount,
        'recent_activity' => $recentActivity,
    ], []);
}

function handle_seeker_room(array $actor): void
{
    $reservation = find_seeker_reservation((int)$actor['user_id'], ['approved']);
    if ($reservation === null) {
        json_response(true, 'No approved room assignment found.', null, []);
    }

    json_response(true, 'Seeker room fetched successfully.', normalize_seeker_room($reservation), []);
}

function find_seeker_reservation(int $userId, array $statuses): ?array
{
    $statusTokens = [];
    $params = [':user_id' => $userId];
    foreach ($statuses as $index => $status) {
        $token = ':status_' . $index;
        $statusTokens[] = $token;
        $params[$token] = $status;
    }

    $query = db()->prepare(
        'SELECT
            rv.*,
            r.room_id,
            r.room_number,
            r.room_type,
            r.capacity,
            r.monthly_rate,
            r.amenities,
            r.availability_status,
            b.boarding_house_id,
            b.house_name,
            b.address,
            b.description,
            b.house_rules,
            owner.full_name AS landlord_name,
            owner.contact_number AS landlord_contact_number
         FROM reservations rv
         INNER JOIN rooms r ON r.room_id = rv.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         INNER JOIN users owner ON owner.user_id = b.owner_id
         WHERE rv.user_id = :user_id
           AND rv.status IN (' . implode(', ', $statusTokens) . ')
         ORDER BY rv.move_in_date DESC, rv.reservation_id DESC
         LIMIT 1'
    );
    $query->execute($params);
    $row = $query->fetch();

    return $row ?: null;
}

function find_seeker_current_month_payment(int $userId): ?array
{
    $query = db()->prepare(
        'SELECT *
         FROM payments
         WHERE user_id = :user_id
           AND billing_period = :billing_period
         ORDER BY payment_id DESC
         LIMIT 1'
    );
    $query->execute([
        ':user_id' => $userId,
        ':billing_period' => date('Y-m'),
    ]);
    $row = $query->fetch();

    return $row ?: null;
}

function count_seeker_reservations(int $userId, string $status): int
{
    $query = db()->prepare(
        'SELECT COUNT(*)
         FROM reservations
         WHERE user_id = :user_id
           AND status = :status'
    );
    $query->execute([
        ':user_id' => $userId,
        ':status' => $status,
    ]);

    return (int)$query->fetchColumn();
}

function find_seeker_recent_activity(int $userId): array
{
    $query = db()->prepare(
        'SELECT log_id, action_performed, affected_module, `timestamp`
         FROM activity_logs
         WHERE user_id = :user_id
         ORDER BY `timestamp` DESC, log_id DESC
         LIMIT 3'
    );
    $query->execute([':user_id' => $userId]);

    return $query->fetchAll();
}

function normalize_seeker_reservation(array $row): array
{
    return [
        'reservation_id' => isset($row['reservation_id']) ? (int)$row['reservation_id'] : null,
        'room_id' => isset($row['room_id']) ? (int)$row['room_id'] : null,
        'room_number' => $row['room_number'] ?? null,
        'room_type' => $row['room_type'] ?? null,
        'monthly_rate' => isset($row['monthly_rate']) ? (float)$row['monthly_rate'] : 0,
        'move_in_date' => $row['move_in_date'] ?? null,
        'date_submitted' => $row['date_submitted'] ?? null,
        'status' => $row['status'] ?? null,
        'remarks' => $row['remarks'] ?? null,
        'boarding_house_id' => isset($row['boarding_house_id']) ? (int)$row['boarding_house_id'] : null,
        'house_name' => $row['house_name'] ?? null,
        'address' => $row['address'] ?? null,
    ];
}

function normalize_seeker_room(array $row): array
{
    $amenitiesRaw = trim((string)($row['amenities'] ?? ''));
    $rulesRaw = trim((string)($row['house_rules'] ?? ''));

    return [
        'reservation' => normalize_seeker_reservation($row),
        'room' => [
            'room_id' => isset($row['room_id']) ? (int)$row['room_id'] : null,
            'room_number' => $row['room_number'] ?? null,
            'room_type' => $row['room_type'] ?? null,
            'capacity' => isset($row['capacity']) ? (int)$row['capacity'] : null,
            'monthly_rate' => isset($row['monthly_rate']) ? (float)$row['monthly_rate'] : 0,
            'availability_status' => $row['availability_status'] ?? null,
            'amenities' => $amenitiesRaw === '' ? [] : array_values(array_filter(array_map('trim', explode(',', $amenitiesRaw)))),
            'photo_url' => null,
        ],
        'boarding_house' => [
            'boarding_house_id' => isset($row['boarding_house_id']) ? (int)$row['boarding_house_id'] : null,
            'house_name' => $row['house_name'] ?? null,
            'address' => $row['address'] ?? null,
            'description' => $row['description'] ?? null,
            'house_rules' => $rulesRaw === ''
                ? []
                : array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n|\./', $rulesRaw) ?: []))),
        ],
        'landlord' => [
            'name' => $row['landlord_name'] ?? null,
            'contact_number' => $row['landlord_contact_number'] ?? null,
        ],
    ];
}

function normalize_seeker_payment(array $row): array
{
    return [
        'payment_id' => isset($row['payment_id']) ? (int)$row['payment_id'] : null,
        'billing_period' => $row['billing_period'] ?? null,
        'amount_due' => isset($row['amount_due']) ? (float)$row['amount_due'] : 0,
        'amount_paid' => isset($row['amount_paid']) ? (float)$row['amount_paid'] : 0,
        'payment_status' => $row['payment_status'] ?? null,
        'payment_date' => $row['payment_date'] ?? null,
        'notes' => $row['notes'] ?? null,
        'proof_uploaded' => trim((string)($row['proof_of_payment_path'] ?? '')) !== '',
    ];
}
