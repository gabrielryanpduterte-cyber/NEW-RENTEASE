<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'PATCH', 'DELETE']);
ensure_seeker_feature_schema();
ensure_owner_feature_schema();

$method = request_method();
$payload = in_array($method, ['POST', 'PATCH', 'DELETE'], true) ? request_payload() : [];
$action = request_action($payload);

try {
    $actor = require_roles(['owner', 'admin']);

    if ($method === 'GET') {
        if ($action === 'preview') {
            handle_billing_preview($actor);
        }

        handle_billing_index($actor);
    }

    if ($method === 'POST') {
        if ($action === 'generate') {
            handle_billing_generate($actor, $payload);
        }
        if ($action === 'pay') {
            handle_billing_mark_paid($actor, $payload);
        }

        json_response(false, 'Unsupported billing action.', new stdClass(), ['Use action=generate or action=pay.'], 400);
    }

    if ($method === 'PATCH') {
        if ($action === 'pay') {
            handle_billing_mark_paid($actor, $payload);
        }
        if ($action === 'unpaid') {
            handle_billing_mark_unpaid($actor, $payload);
        }

        json_response(false, 'Unsupported billing action.', new stdClass(), ['Use action=pay or action=unpaid.'], 400);
    }

    if ($method === 'DELETE') {
        handle_billing_mark_unpaid($actor, $payload);
    }
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Billing request failed', $user ? (int)$user['user_id'] : null);
}

function handle_billing_index(array $actor): void
{
    $month = parse_billing_month($_GET['month'] ?? null) ?? date('Y-m');
    $cycles = fetch_owner_billing_cycles($actor, $month);
    $rows = array_map('normalize_billing_row', $cycles);
    $knownReservationIds = [];

    foreach ($rows as $row) {
        $knownReservationIds[(int)$row['reservation_id']] = true;
    }

    foreach (fetch_active_reservations_for_billing($actor) as $reservation) {
        if (isset($knownReservationIds[(int)$reservation['reservation_id']])) {
            continue;
        }

        $rows[] = [
            'billing_cycle_id' => null,
            'reservation_id' => (int)$reservation['reservation_id'],
            'user_id' => (int)$reservation['user_id'],
            'tenant_name' => $reservation['tenant_name'],
            'room_id' => (int)$reservation['room_id'],
            'room_number' => $reservation['room_number'],
            'billing_month' => $month,
            'amount_due' => (float)$reservation['monthly_rate'],
            'amount_paid' => 0.0,
            'due_date' => null,
            'payment_id' => null,
            'payment_status' => 'no_record',
            'payment_method' => null,
            'payment_date' => null,
            'proof_uploaded' => false,
            'proof_url' => null,
        ];
    }

    $summary = [
        'paid_count' => 0,
        'unpaid_count' => 0,
        'no_record_count' => 0,
        'total_billed' => 0.0,
        'total_collected' => 0.0,
    ];

    foreach ($rows as $row) {
        $status = strtolower((string)$row['payment_status']);
        if ($status === 'paid') {
            $summary['paid_count']++;
        } elseif ($status === 'no_record') {
            $summary['no_record_count']++;
        } else {
            $summary['unpaid_count']++;
        }
        $summary['total_billed'] += (float)$row['amount_due'];
        $summary['total_collected'] += (float)$row['amount_paid'];
    }

    json_response(
        true,
        'Billing records fetched successfully.',
        [
            'month' => $month,
            'items' => $rows,
            'summary' => $summary,
        ],
        []
    );
}

function handle_billing_preview(array $actor): void
{
    $month = parse_billing_month($_GET['month'] ?? null);
    if ($month === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['month must use YYYY-MM format.'], 400);
    }

    $willCreate = [];
    $alreadyExists = [];

    foreach (fetch_active_reservations_for_billing($actor) as $reservation) {
        $cycle = find_billing_cycle((int)$reservation['reservation_id'], $month);
        $row = [
            'reservation_id' => (int)$reservation['reservation_id'],
            'user_id' => (int)$reservation['user_id'],
            'tenant_name' => $reservation['tenant_name'],
            'room_id' => (int)$reservation['room_id'],
            'room_number' => $reservation['room_number'],
            'amount_due' => (float)$reservation['monthly_rate'],
        ];

        if ($cycle) {
            $row['billing_cycle_id'] = (int)$cycle['billing_cycle_id'];
            $alreadyExists[] = $row;
        } else {
            $willCreate[] = $row;
        }
    }

    json_response(
        true,
        'Billing preview generated successfully.',
        [
            'month' => $month,
            'will_create' => $willCreate,
            'already_exists' => $alreadyExists,
        ],
        []
    );
}

function handle_billing_generate(array $actor, array $payload): void
{
    $month = parse_billing_month($payload['month'] ?? ($_GET['month'] ?? null));
    if ($month === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['month must use YYYY-MM format.'], 400);
    }

    $activeReservations = fetch_active_reservations_for_billing($actor);
    $created = 0;
    $skipped = 0;
    $dueDate = date('Y-m-d', strtotime($month . '-01 +5 days'));

    db()->beginTransaction();
    try {
        $insert = db()->prepare(
            'INSERT INTO billing_cycles (
                reservation_id, user_id, room_id, billing_month, amount_due, due_date, created_by
             ) VALUES (
                :reservation_id, :user_id, :room_id, :billing_month, :amount_due, :due_date, :created_by
             )'
        );

        foreach ($activeReservations as $reservation) {
            if (find_billing_cycle((int)$reservation['reservation_id'], $month)) {
                $skipped++;
                continue;
            }

            $insert->execute([
                ':reservation_id' => (int)$reservation['reservation_id'],
                ':user_id' => (int)$reservation['user_id'],
                ':room_id' => (int)$reservation['room_id'],
                ':billing_month' => $month,
                ':amount_due' => (float)$reservation['monthly_rate'],
                ':due_date' => $dueDate,
                ':created_by' => (int)$actor['user_id'],
            ]);
            $created++;
        }

        db()->commit();
    } catch (Throwable $exception) {
        db()->rollBack();
        throw $exception;
    }

    log_activity((int)$actor['user_id'], "Generated billing for {$month} - {$created} tenants", 'billing');

    json_response(
        true,
        'Billing generated successfully.',
        [
            'month' => $month,
            'created_count' => $created,
            'skipped_count' => $skipped,
        ],
        []
    );
}

function handle_billing_mark_paid(array $actor, array $payload): void
{
    $cycleId = parse_positive_int($_GET['billing_cycle_id'] ?? ($payload['billing_cycle_id'] ?? ($payload['cycle_id'] ?? null)));
    if ($cycleId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['billing_cycle_id is required.'], 400);
    }

    $cycle = find_billing_cycle_by_id($cycleId);
    if ($cycle === null) {
        json_response(false, 'Billing cycle not found.', new stdClass(), [], 404);
    }
    enforce_billing_cycle_scope($actor, $cycle);

    $amountPaid = $payload['amount_paid'] ?? $cycle['amount_due'];
    $paymentMethod = strtolower(trim((string)($payload['payment_method'] ?? 'cash')));
    $paymentDate = trim((string)($payload['payment_date'] ?? date('Y-m-d')));
    $notes = trim((string)($payload['notes'] ?? ''));

    $errors = [];
    if (!is_numeric((string)$amountPaid) || (float)$amountPaid < 0) {
        $errors[] = 'amount_paid must be a non-negative number.';
    }
    if (!in_array($paymentMethod, ['cash', 'gcash', 'bank_transfer', 'other'], true)) {
        $errors[] = 'payment_method must be cash, gcash, bank_transfer, or other.';
    }
    if (!is_valid_billing_payment_date($paymentDate)) {
        $errors[] = 'payment_date must use YYYY-MM-DD format.';
    }
    if (strlen($notes) > 300) {
        $errors[] = 'notes cannot exceed 300 characters.';
    }
    if (!empty($errors)) {
        json_response(false, 'Validation failed.', new stdClass(), $errors, 400);
    }

    $paidValue = (float)$amountPaid;
    $status = $paidValue >= (float)$cycle['amount_due'] ? 'paid' : 'unpaid';
    $existingPayment = find_payment_by_cycle($cycleId);

    if ($existingPayment) {
        $update = db()->prepare(
            'UPDATE payments
             SET amount_due = :amount_due,
                 amount_paid = :amount_paid,
                 payment_status = :payment_status,
                 payment_date = :payment_date,
                 billing_period = :billing_period,
                 payment_method = :payment_method,
                 received_by = :received_by,
                 notes = :notes
             WHERE payment_id = :payment_id'
        );
        $update->execute([
            ':amount_due' => (float)$cycle['amount_due'],
            ':amount_paid' => $paidValue,
            ':payment_status' => $status,
            ':payment_date' => $paymentDate,
            ':billing_period' => $cycle['billing_month'],
            ':payment_method' => $paymentMethod,
            ':received_by' => (int)$actor['user_id'],
            ':notes' => $notes !== '' ? $notes : ($existingPayment['notes'] ?? null),
            ':payment_id' => (int)$existingPayment['payment_id'],
        ]);
        $paymentId = (int)$existingPayment['payment_id'];
    } else {
        $insert = db()->prepare(
            'INSERT INTO payments (
                reservation_id, user_id, room_id, amount_due, amount_paid, payment_status,
                payment_date, billing_period, recorded_by, billing_cycle_id, payment_method,
                received_by, notes
             ) VALUES (
                :reservation_id, :user_id, :room_id, :amount_due, :amount_paid, :payment_status,
                :payment_date, :billing_period, :recorded_by, :billing_cycle_id, :payment_method,
                :received_by, :notes
             )'
        );
        $insert->execute([
            ':reservation_id' => (int)$cycle['reservation_id'],
            ':user_id' => (int)$cycle['user_id'],
            ':room_id' => (int)$cycle['room_id'],
            ':amount_due' => (float)$cycle['amount_due'],
            ':amount_paid' => $paidValue,
            ':payment_status' => $status,
            ':payment_date' => $paymentDate,
            ':billing_period' => $cycle['billing_month'],
            ':recorded_by' => (int)$actor['user_id'],
            ':billing_cycle_id' => $cycleId,
            ':payment_method' => $paymentMethod,
            ':received_by' => (int)$actor['user_id'],
            ':notes' => $notes !== '' ? $notes : null,
        ]);
        $paymentId = (int)db()->lastInsertId();
    }

    log_activity(
        (int)$actor['user_id'],
        'Marked ' . (string)$cycle['tenant_name'] . ' rent as Paid for ' . (string)$cycle['billing_month'],
        'payments'
    );

    $updated = fetch_billing_cycle_for_response($cycleId);
    json_response(true, 'Payment recorded successfully.', $updated ? normalize_billing_row($updated) : ['payment_id' => $paymentId], []);
}

function handle_billing_mark_unpaid(array $actor, array $payload): void
{
    $paymentId = parse_positive_int($_GET['payment_id'] ?? ($payload['payment_id'] ?? null));
    if ($paymentId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['payment_id is required.'], 400);
    }

    $payment = find_payment_for_billing_action($paymentId);
    if ($payment === null) {
        json_response(false, 'Payment not found.', new stdClass(), [], 404);
    }
    if ($actor['role'] === 'owner' && (int)$payment['owner_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only reverse payments for your own boarding house.'], 403);
    }
    if (substr((string)$payment['billing_period'], 0, 7) < date('Y-m')) {
        json_response(false, 'Historical payments cannot be reversed.', new stdClass(), ['Historical payments cannot be reversed. Contact administrator.'], 403);
    }

    $reason = trim((string)($payload['reason'] ?? ''));
    $notes = $reason !== '' ? 'Reversed: ' . substr($reason, 0, 200) : ($payment['notes'] ?? null);

    $update = db()->prepare(
        "UPDATE payments
         SET amount_paid = 0,
             payment_status = 'unpaid',
             payment_method = NULL,
             received_by = NULL,
             notes = :notes
         WHERE payment_id = :payment_id"
    );
    $update->execute([
        ':notes' => $notes,
        ':payment_id' => $paymentId,
    ]);

    log_activity(
        (int)$actor['user_id'],
        'Reversed payment for ' . (string)$payment['tenant_name'] . ' - ' . (string)$payment['billing_period'],
        'payments'
    );

    json_response(true, 'Payment reversed successfully.', new stdClass(), []);
}

function fetch_active_reservations_for_billing(array $actor): array
{
    $conditions = ["rv.status = 'approved'", "(r.is_archived = 0 OR r.is_archived IS NULL)"];
    $params = [];

    if ($actor['role'] === 'owner') {
        $conditions[] = 'b.owner_id = :owner_id';
        $params[':owner_id'] = (int)$actor['user_id'];
    }

    $query = db()->prepare(
        'SELECT rv.reservation_id, rv.user_id, rv.room_id, rv.move_in_date,
                u.full_name AS tenant_name,
                r.room_number, r.monthly_rate
         FROM reservations rv
         INNER JOIN users u ON u.user_id = rv.user_id
         INNER JOIN rooms r ON r.room_id = rv.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE ' . implode(' AND ', $conditions) . '
         ORDER BY r.room_number ASC, u.full_name ASC'
    );
    $query->execute($params);

    return $query->fetchAll();
}

function fetch_owner_billing_cycles(array $actor, string $month): array
{
    $conditions = ['bc.billing_month = :billing_month'];
    $params = [':billing_month' => $month];

    if ($actor['role'] === 'owner') {
        $conditions[] = 'b.owner_id = :owner_id';
        $params[':owner_id'] = (int)$actor['user_id'];
    }

    $query = db()->prepare(
        'SELECT bc.*, u.full_name AS tenant_name, r.room_number,
                p.payment_id, p.amount_paid, p.payment_status, p.payment_date,
                p.payment_method, p.proof_of_payment_path, p.notes
         FROM billing_cycles bc
         INNER JOIN users u ON u.user_id = bc.user_id
         INNER JOIN rooms r ON r.room_id = bc.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         LEFT JOIN payments p ON p.billing_cycle_id = bc.billing_cycle_id
         WHERE ' . implode(' AND ', $conditions) . '
         ORDER BY r.room_number ASC, u.full_name ASC'
    );
    $query->execute($params);

    return $query->fetchAll();
}

function find_billing_cycle(int $reservationId, string $month): ?array
{
    $query = db()->prepare(
        'SELECT *
         FROM billing_cycles
         WHERE reservation_id = :reservation_id
           AND billing_month = :billing_month
         LIMIT 1'
    );
    $query->execute([
        ':reservation_id' => $reservationId,
        ':billing_month' => $month,
    ]);
    $row = $query->fetch();

    return $row ?: null;
}

function find_billing_cycle_by_id(int $cycleId): ?array
{
    $query = db()->prepare(
        'SELECT bc.*, u.full_name AS tenant_name, r.room_number, b.owner_id
         FROM billing_cycles bc
         INNER JOIN users u ON u.user_id = bc.user_id
         INNER JOIN rooms r ON r.room_id = bc.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE bc.billing_cycle_id = :billing_cycle_id
         LIMIT 1'
    );
    $query->execute([':billing_cycle_id' => $cycleId]);
    $row = $query->fetch();

    return $row ?: null;
}

function fetch_billing_cycle_for_response(int $cycleId): ?array
{
    $query = db()->prepare(
        'SELECT bc.*, u.full_name AS tenant_name, r.room_number,
                p.payment_id, p.amount_paid, p.payment_status, p.payment_date,
                p.payment_method, p.proof_of_payment_path, p.notes
         FROM billing_cycles bc
         INNER JOIN users u ON u.user_id = bc.user_id
         INNER JOIN rooms r ON r.room_id = bc.room_id
         LEFT JOIN payments p ON p.billing_cycle_id = bc.billing_cycle_id
         WHERE bc.billing_cycle_id = :billing_cycle_id
         LIMIT 1'
    );
    $query->execute([':billing_cycle_id' => $cycleId]);
    $row = $query->fetch();

    return $row ?: null;
}

function enforce_billing_cycle_scope(array $actor, array $cycle): void
{
    if ($actor['role'] === 'owner' && (int)$cycle['owner_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only manage billing for your own boarding house.'], 403);
    }
}

function find_payment_by_cycle(int $cycleId): ?array
{
    $query = db()->prepare(
        'SELECT *
         FROM payments
         WHERE billing_cycle_id = :billing_cycle_id
         ORDER BY payment_id DESC
         LIMIT 1'
    );
    $query->execute([':billing_cycle_id' => $cycleId]);
    $row = $query->fetch();

    return $row ?: null;
}

function find_payment_for_billing_action(int $paymentId): ?array
{
    $query = db()->prepare(
        'SELECT p.*, u.full_name AS tenant_name, b.owner_id
         FROM payments p
         INNER JOIN users u ON u.user_id = p.user_id
         INNER JOIN rooms r ON r.room_id = p.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE p.payment_id = :payment_id
         LIMIT 1'
    );
    $query->execute([':payment_id' => $paymentId]);
    $row = $query->fetch();

    return $row ?: null;
}

function normalize_billing_row(array $row): array
{
    $paymentId = isset($row['payment_id']) && $row['payment_id'] !== null ? (int)$row['payment_id'] : null;
    $amountDue = (float)($row['amount_due'] ?? 0);
    $amountPaid = (float)($row['amount_paid'] ?? 0);
    $status = strtolower((string)($row['payment_status'] ?? ''));

    if ($status === '') {
        $status = $amountPaid >= $amountDue && $amountDue > 0 ? 'paid' : 'unpaid';
    }

    $proofPath = trim((string)($row['proof_of_payment_path'] ?? ''));

    return [
        'billing_cycle_id' => (int)$row['billing_cycle_id'],
        'reservation_id' => (int)$row['reservation_id'],
        'user_id' => (int)$row['user_id'],
        'tenant_name' => $row['tenant_name'],
        'room_id' => (int)$row['room_id'],
        'room_number' => $row['room_number'],
        'billing_month' => $row['billing_month'],
        'amount_due' => $amountDue,
        'amount_paid' => $amountPaid,
        'due_date' => $row['due_date'],
        'payment_id' => $paymentId,
        'payment_status' => $status,
        'payment_method' => $row['payment_method'] ?? null,
        'payment_date' => $row['payment_date'] ?? null,
        'notes' => $row['notes'] ?? null,
        'proof_uploaded' => $proofPath !== '',
        'proof_url' => ($paymentId !== null && $proofPath !== '')
            ? backend_endpoint_url('payments.php?action=proof&payment_id=' . $paymentId)
            : null,
    ];
}

function is_valid_billing_payment_date(string $date): bool
{
    $value = DateTime::createFromFormat('Y-m-d', $date);
    return $value instanceof DateTime && $value->format('Y-m-d') === $date;
}
