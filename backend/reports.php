<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET']);
ensure_owner_feature_schema();

try {
    $actor = require_roles(['owner', 'admin']);
    $filters = parse_report_filters($actor);

    $monthlyIncome = report_monthly_income($actor, $filters);
    $paymentStatus = report_payment_status($actor, $filters);
    $occupancy = report_occupancy($actor, $filters);
    $reservationStats = report_reservation_stats($actor, $filters);

    log_activity((int)$actor['user_id'], 'Viewed reports dashboard', 'reports');

    json_response(
        true,
        'Reports fetched successfully.',
        [
            'filters' => [
                'date_from' => $filters['date_from'],
                'date_to' => $filters['date_to'],
                'boarding_house_id' => $filters['boarding_house_id'],
                'scope_role' => $actor['role'],
            ],
            'monthly_income' => $monthlyIncome,
            'payment_status' => $paymentStatus,
            'occupancy' => $occupancy,
            'reservation_stats' => $reservationStats,
        ],
        []
    );
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Reports request failed', $user ? (int)$user['user_id'] : null);
}

function parse_report_filters(array $actor): array
{
    $dateFromRaw = $_GET['date_from'] ?? null;
    $dateToRaw = $_GET['date_to'] ?? null;

    $dateFrom = parse_ymd_date($dateFromRaw);
    $dateTo = parse_ymd_date($dateToRaw);

    if ($dateFromRaw !== null && trim((string)$dateFromRaw) !== '' && $dateFrom === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['date_from must use YYYY-MM-DD format.'], 400);
    }
    if ($dateToRaw !== null && trim((string)$dateToRaw) !== '' && $dateTo === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['date_to must use YYYY-MM-DD format.'], 400);
    }
    if ($dateFrom !== null && $dateTo !== null && $dateFrom > $dateTo) {
        json_response(false, 'Validation failed.', new stdClass(), ['date_from cannot be later than date_to.'], 400);
    }

    $boardingHouseId = parse_positive_int($_GET['boarding_house_id'] ?? null);
    if ($boardingHouseId !== null) {
        enforce_report_scope_boarding_house($actor, $boardingHouseId);
    }

    return [
        'date_from' => $dateFrom,
        'date_to' => $dateTo,
        'boarding_house_id' => $boardingHouseId,
    ];
}

function enforce_report_scope_boarding_house(array $actor, int $boardingHouseId): void
{
    if ($actor['role'] === 'owner' && !owner_owns_boarding_house((int)$actor['user_id'], $boardingHouseId)) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only access reports for your own boarding house.'], 403);
    }

    $query = db()->prepare('SELECT boarding_house_id FROM boarding_house WHERE boarding_house_id = :id LIMIT 1');
    $query->execute([':id' => $boardingHouseId]);
    if (!$query->fetch()) {
        json_response(false, 'Validation failed.', new stdClass(), ['boarding_house_id does not exist.'], 400);
    }
}

function report_scope_conditions(array $actor, array $filters): array
{
    $conditions = [];
    $params = [];

    if ($actor['role'] === 'owner') {
        $conditions[] = 'b.owner_id = :owner_id';
        $params[':owner_id'] = (int)$actor['user_id'];
    }

    if ($filters['boarding_house_id'] !== null) {
        $conditions[] = 'b.boarding_house_id = :boarding_house_id';
        $params[':boarding_house_id'] = (int)$filters['boarding_house_id'];
    }

    return [
        'conditions' => $conditions,
        'params' => $params,
    ];
}

function apply_payment_date_conditions(array $conditions, array $params, array $filters): array
{
    if ($filters['date_from'] !== null) {
        $conditions[] = 'p.payment_date >= :date_from';
        $params[':date_from'] = $filters['date_from'];
    }
    if ($filters['date_to'] !== null) {
        $conditions[] = 'p.payment_date <= :date_to';
        $params[':date_to'] = $filters['date_to'];
    }

    return [
        'conditions' => $conditions,
        'params' => $params,
    ];
}

function apply_reservation_date_conditions(array $conditions, array $params, array $filters): array
{
    if ($filters['date_from'] !== null) {
        $conditions[] = 'DATE(rv.date_submitted) >= :date_from';
        $params[':date_from'] = $filters['date_from'];
    }
    if ($filters['date_to'] !== null) {
        $conditions[] = 'DATE(rv.date_submitted) <= :date_to';
        $params[':date_to'] = $filters['date_to'];
    }

    return [
        'conditions' => $conditions,
        'params' => $params,
    ];
}

function build_where_clause(array $conditions): string
{
    if (empty($conditions)) {
        return '';
    }

    return ' WHERE ' . implode(' AND ', $conditions);
}

function report_monthly_income(array $actor, array $filters): array
{
    $billingReport = report_monthly_income_from_billing_cycles($actor, $filters);
    if (!empty($billingReport['rows'])) {
        return $billingReport;
    }

    $scope = report_scope_conditions($actor, $filters);
    $dateScoped = apply_payment_date_conditions($scope['conditions'], $scope['params'], $filters);

    $sql = 'SELECT DATE_FORMAT(p.payment_date, "%Y-%m") AS report_month,
                   COALESCE(SUM(p.amount_due), 0) AS total_due,
                   COALESCE(SUM(p.amount_paid), 0) AS total_collected,
                   COUNT(*) AS payments_count
            FROM payments p
            INNER JOIN rooms r ON r.room_id = p.room_id
            INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id'
        . build_where_clause($dateScoped['conditions'])
        . ' GROUP BY DATE_FORMAT(p.payment_date, "%Y-%m")
            ORDER BY report_month DESC';

    $query = db()->prepare($sql);
    $query->execute($dateScoped['params']);
    $rows = $query->fetchAll();

    $normalizedRows = array_map(static function (array $row): array {
        return [
            'month' => $row['report_month'],
            'total_due' => (float)$row['total_due'],
            'total_collected' => (float)$row['total_collected'],
            'payments_count' => (int)$row['payments_count'],
        ];
    }, $rows);

    $totalDue = 0.0;
    $totalCollected = 0.0;
    $totalPayments = 0;

    foreach ($normalizedRows as $row) {
        $totalDue += $row['total_due'];
        $totalCollected += $row['total_collected'];
        $totalPayments += $row['payments_count'];
    }

    return [
        'rows' => $normalizedRows,
        'summary' => [
            'total_due' => $totalDue,
            'total_collected' => $totalCollected,
            'total_payments' => $totalPayments,
            'total_outstanding' => max($totalDue - $totalCollected, 0.0),
            'collection_rate' => $totalDue > 0 ? round(($totalCollected / $totalDue) * 100, 2) : 0.0,
        ],
    ];
}

function report_monthly_income_from_billing_cycles(array $actor, array $filters): array
{
    if (!db_table_exists('billing_cycles')) {
        return ['rows' => [], 'summary' => ['total_due' => 0.0, 'total_collected' => 0.0, 'total_payments' => 0]];
    }

    $scope = report_scope_conditions($actor, $filters);
    $conditions = $scope['conditions'];
    $params = $scope['params'];

    if ($filters['date_from'] !== null) {
        $conditions[] = 'bc.billing_month >= :month_from';
        $params[':month_from'] = substr((string)$filters['date_from'], 0, 7);
    }
    if ($filters['date_to'] !== null) {
        $conditions[] = 'bc.billing_month <= :month_to';
        $params[':month_to'] = substr((string)$filters['date_to'], 0, 7);
    }

    $sql = 'SELECT bc.billing_month AS report_month,
                   COALESCE(SUM(bc.amount_due), 0) AS total_due,
                   COALESCE(SUM(CASE WHEN p.payment_status = \'paid\' THEN p.amount_paid ELSE 0 END), 0) AS total_collected,
                   COUNT(*) AS payments_count,
                   COUNT(DISTINCT bc.user_id) AS tenant_count
            FROM billing_cycles bc
            INNER JOIN rooms r ON r.room_id = bc.room_id
            INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
            LEFT JOIN payments p ON p.billing_cycle_id = bc.billing_cycle_id'
        . build_where_clause($conditions)
        . ' GROUP BY bc.billing_month
            ORDER BY report_month DESC';

    $query = db()->prepare($sql);
    $query->execute($params);
    $rows = $query->fetchAll();

    $normalizedRows = array_map(static function (array $row): array {
        $totalDue = (float)$row['total_due'];
        $totalCollected = (float)$row['total_collected'];
        $outstanding = max($totalDue - $totalCollected, 0.0);

        return [
            'month' => $row['report_month'],
            'total_due' => $totalDue,
            'total_collected' => $totalCollected,
            'total_outstanding' => $outstanding,
            'collection_rate' => $totalDue > 0 ? round(($totalCollected / $totalDue) * 100, 2) : 0.0,
            'payments_count' => (int)$row['payments_count'],
            'tenant_count' => (int)$row['tenant_count'],
        ];
    }, $rows);

    $totalDue = 0.0;
    $totalCollected = 0.0;
    $totalPayments = 0;
    $totalTenantRows = 0;

    foreach ($normalizedRows as $row) {
        $totalDue += $row['total_due'];
        $totalCollected += $row['total_collected'];
        $totalPayments += $row['payments_count'];
        $totalTenantRows += $row['tenant_count'];
    }

    return [
        'rows' => $normalizedRows,
        'summary' => [
            'total_due' => $totalDue,
            'total_collected' => $totalCollected,
            'total_payments' => $totalPayments,
            'tenant_count' => $totalTenantRows,
            'total_outstanding' => max($totalDue - $totalCollected, 0.0),
            'collection_rate' => $totalDue > 0 ? round(($totalCollected / $totalDue) * 100, 2) : 0.0,
        ],
    ];
}

function report_payment_status(array $actor, array $filters): array
{
    $scope = report_scope_conditions($actor, $filters);
    $dateScoped = apply_payment_date_conditions($scope['conditions'], $scope['params'], $filters);

    $sql = 'SELECT p.payment_status,
                   COUNT(*) AS record_count,
                   COALESCE(SUM(p.amount_due), 0) AS total_due,
                   COALESCE(SUM(p.amount_paid), 0) AS total_paid
            FROM payments p
            INNER JOIN rooms r ON r.room_id = p.room_id
            INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id'
        . build_where_clause($dateScoped['conditions'])
        . ' GROUP BY p.payment_status';

    $query = db()->prepare($sql);
    $query->execute($dateScoped['params']);
    $rows = $query->fetchAll();

    $statusMap = [
        'paid' => ['count' => 0, 'total_due' => 0.0, 'total_paid' => 0.0, 'outstanding' => 0.0],
        'unpaid' => ['count' => 0, 'total_due' => 0.0, 'total_paid' => 0.0, 'outstanding' => 0.0],
    ];

    foreach ($rows as $row) {
        $status = strtolower((string)$row['payment_status']);
        $count = (int)$row['record_count'];
        $due = (float)$row['total_due'];
        $paid = (float)$row['total_paid'];
        $outstanding = max($due - $paid, 0.0);

        if (!array_key_exists($status, $statusMap)) {
            $statusMap[$status] = ['count' => 0, 'total_due' => 0.0, 'total_paid' => 0.0, 'outstanding' => 0.0];
        }

        $statusMap[$status]['count'] = $count;
        $statusMap[$status]['total_due'] = $due;
        $statusMap[$status]['total_paid'] = $paid;
        $statusMap[$status]['outstanding'] = $outstanding;
    }

    return [
        'rows' => array_map(
            static function (string $status, array $metrics): array {
                return [
                    'payment_status' => $status,
                    'record_count' => $metrics['count'],
                    'total_due' => $metrics['total_due'],
                    'total_paid' => $metrics['total_paid'],
                    'outstanding' => $metrics['outstanding'],
                ];
            },
            array_keys($statusMap),
            $statusMap
        ),
        'summary' => [
            'paid_count' => (int)$statusMap['paid']['count'],
            'unpaid_count' => (int)$statusMap['unpaid']['count'],
            'total_outstanding' => (float)$statusMap['paid']['outstanding'] + (float)$statusMap['unpaid']['outstanding'],
        ],
    ];
}

function report_occupancy(array $actor, array $filters): array
{
    $scope = report_scope_conditions($actor, $filters);

    $sql = "SELECT
                   CASE
                       WHEN r.is_archived = 1 OR r.availability_status = 'archived' THEN 'archived'
                       ELSE r.availability_status
                   END AS availability_status,
                   COUNT(*) AS room_count
            FROM rooms r
            INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id"
        . build_where_clause($scope['conditions'])
        . " GROUP BY CASE
                       WHEN r.is_archived = 1 OR r.availability_status = 'archived' THEN 'archived'
                       ELSE r.availability_status
                   END";

    $query = db()->prepare($sql);
    $query->execute($scope['params']);
    $rows = $query->fetchAll();

    $counts = [
        'available' => 0,
        'unavailable' => 0,
        'occupied' => 0,
        'archived' => 0,
    ];

    foreach ($rows as $row) {
        $status = strtolower((string)$row['availability_status']);
        $counts[$status] = (int)$row['room_count'];
    }

    $totalRooms = $counts['available'] + $counts['unavailable'] + $counts['occupied'] + $counts['archived'];
    $activeRooms = max($totalRooms - $counts['archived'], 0);
    $occupancyRate = $totalRooms > 0
        ? round(($counts['occupied'] / max($activeRooms, 1)) * 100, 2)
        : 0.0;

    return [
        'total_rooms' => $totalRooms,
        'available_rooms' => $counts['available'],
        'unavailable_rooms' => $counts['unavailable'],
        'occupied_rooms' => $counts['occupied'],
        'archived_rooms' => $counts['archived'],
        'occupancy_rate_percent' => $occupancyRate,
    ];
}

function report_reservation_stats(array $actor, array $filters): array
{
    $scope = report_scope_conditions($actor, $filters);
    $dateScoped = apply_reservation_date_conditions($scope['conditions'], $scope['params'], $filters);

    $sql = 'SELECT rv.status, COUNT(*) AS record_count
            FROM reservations rv
            INNER JOIN rooms r ON r.room_id = rv.room_id
            INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id'
        . build_where_clause($dateScoped['conditions'])
        . ' GROUP BY rv.status';

    $query = db()->prepare($sql);
    $query->execute($dateScoped['params']);
    $rows = $query->fetchAll();

    $counts = [
        'pending' => 0,
        'approved' => 0,
        'rejected' => 0,
        'cancelled' => 0,
    ];

    foreach ($rows as $row) {
        $status = strtolower((string)$row['status']);
        if (!array_key_exists($status, $counts)) {
            continue;
        }
        $counts[$status] = (int)$row['record_count'];
    }

    return [
        'pending' => $counts['pending'],
        'approved' => $counts['approved'],
        'rejected' => $counts['rejected'],
        'cancelled' => $counts['cancelled'],
        'total' => $counts['pending'] + $counts['approved'] + $counts['rejected'] + $counts['cancelled'],
    ];
}
