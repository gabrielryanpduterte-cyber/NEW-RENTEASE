<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET']);
ensure_seeker_feature_schema();
ensure_owner_feature_schema();

try {
    $actor = require_roles(['owner', 'admin']);
    $month = date('Y-m');
    $roomStats = owner_dashboard_room_stats($actor);
    $pendingReservations = owner_dashboard_pending_reservations($actor);
    $income = owner_dashboard_income($actor, $month);
    $recentActivity = owner_dashboard_recent_activity($actor);
    $unpaidTenants = owner_dashboard_unpaid_tenants($actor, $month);

    json_response(
        true,
        'Owner dashboard fetched successfully.',
        [
            'month' => $month,
            'total_rooms' => $roomStats['total_rooms'],
            'occupied_rooms' => $roomStats['occupied_rooms'],
            'available_rooms' => $roomStats['available_rooms'],
            'archived_rooms' => $roomStats['archived_rooms'],
            'pending_reservations_count' => $pendingReservations,
            'this_month_income' => $income['total_collected'],
            'this_month_billed' => $income['total_billed'],
            'collection_rate_this_month' => $income['collection_rate'],
            'recent_activity' => $recentActivity,
            'unpaid_tenants' => $unpaidTenants,
        ],
        []
    );
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Owner dashboard request failed', $user ? (int)$user['user_id'] : null);
}

function owner_scope_condition(array $actor, string $alias = 'b'): array
{
    if ($actor['role'] !== 'owner') {
        return ['conditions' => [], 'params' => []];
    }

    return [
        'conditions' => ["{$alias}.owner_id = :owner_id"],
        'params' => [':owner_id' => (int)$actor['user_id']],
    ];
}

function owner_dashboard_room_stats(array $actor): array
{
    $scope = owner_scope_condition($actor);
    $where = empty($scope['conditions']) ? '' : ' WHERE ' . implode(' AND ', $scope['conditions']);

    $query = db()->prepare(
        "SELECT
            COUNT(*) AS total_rooms,
            SUM(CASE WHEN r.is_archived = 1 OR r.availability_status = 'archived' THEN 1 ELSE 0 END) AS archived_rooms,
            SUM(CASE WHEN (r.is_archived = 0 OR r.is_archived IS NULL)
                AND (SELECT COUNT(*) FROM reservations approved_reservations WHERE approved_reservations.room_id = r.room_id AND approved_reservations.status = 'approved') >= r.capacity
                THEN 1 ELSE 0 END) AS occupied_rooms,
            SUM(CASE WHEN (r.is_archived = 0 OR r.is_archived IS NULL)
                AND r.availability_status <> 'unavailable'
                AND (SELECT COUNT(*) FROM reservations approved_reservations WHERE approved_reservations.room_id = r.room_id AND approved_reservations.status = 'approved') < r.capacity
                THEN 1 ELSE 0 END) AS available_rooms
         FROM rooms r
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id{$where}"
    );
    $query->execute($scope['params']);
    $row = $query->fetch() ?: [];

    return [
        'total_rooms' => (int)($row['total_rooms'] ?? 0),
        'occupied_rooms' => (int)($row['occupied_rooms'] ?? 0),
        'available_rooms' => (int)($row['available_rooms'] ?? 0),
        'archived_rooms' => (int)($row['archived_rooms'] ?? 0),
    ];
}

function owner_dashboard_pending_reservations(array $actor): int
{
    $scope = owner_scope_condition($actor);
    $conditions = array_merge(["rv.status = 'pending'"], $scope['conditions']);
    $query = db()->prepare(
        'SELECT COUNT(*) AS pending_count
         FROM reservations rv
         INNER JOIN rooms r ON r.room_id = rv.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE ' . implode(' AND ', $conditions)
    );
    $query->execute($scope['params']);

    return (int)($query->fetch()['pending_count'] ?? 0);
}

function owner_dashboard_income(array $actor, string $month): array
{
    $scope = owner_scope_condition($actor);
    $conditions = array_merge(['bc.billing_month = :billing_month'], $scope['conditions']);
    $params = array_merge([':billing_month' => $month], $scope['params']);

    $query = db()->prepare(
        "SELECT COALESCE(SUM(bc.amount_due), 0) AS total_billed,
                COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount_paid ELSE 0 END), 0) AS total_collected
         FROM billing_cycles bc
         INNER JOIN rooms r ON r.room_id = bc.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         LEFT JOIN payments p ON p.billing_cycle_id = bc.billing_cycle_id
         WHERE " . implode(' AND ', $conditions)
    );
    $query->execute($params);
    $row = $query->fetch() ?: [];

    $totalBilled = (float)($row['total_billed'] ?? 0);
    $totalCollected = (float)($row['total_collected'] ?? 0);

    if ($totalBilled <= 0) {
        $fallbackConditions = [];
        $fallbackParams = [':billing_period' => $month];
        if ($actor['role'] === 'owner') {
            $fallbackConditions[] = 'b.owner_id = :owner_id';
            $fallbackParams[':owner_id'] = (int)$actor['user_id'];
        }
        $fallbackConditions[] = 'p.billing_period = :billing_period';

        $fallback = db()->prepare(
            "SELECT COALESCE(SUM(p.amount_due), 0) AS total_billed,
                    COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount_paid ELSE 0 END), 0) AS total_collected
             FROM payments p
             INNER JOIN rooms r ON r.room_id = p.room_id
             INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
             WHERE " . implode(' AND ', $fallbackConditions)
        );
        $fallback->execute($fallbackParams);
        $fallbackRow = $fallback->fetch() ?: [];
        $totalBilled = (float)($fallbackRow['total_billed'] ?? 0);
        $totalCollected = (float)($fallbackRow['total_collected'] ?? 0);
    }

    return [
        'total_billed' => $totalBilled,
        'total_collected' => $totalCollected,
        'collection_rate' => $totalBilled > 0 ? round(($totalCollected / $totalBilled) * 100, 2) : 0.0,
    ];
}

function owner_dashboard_recent_activity(array $actor): array
{
    $conditions = [];
    $params = [];
    if ($actor['role'] === 'owner') {
        $conditions[] = 'user_id = :user_id';
        $params[':user_id'] = (int)$actor['user_id'];
    }

    $query = db()->prepare(
        'SELECT log_id, action_performed, affected_module, `timestamp`
         FROM activity_logs'
        . (empty($conditions) ? '' : ' WHERE ' . implode(' AND ', $conditions))
        . ' ORDER BY `timestamp` DESC, log_id DESC
         LIMIT 5'
    );
    $query->execute($params);

    return array_map(static function (array $row): array {
        return [
            'log_id' => (int)$row['log_id'],
            'action_performed' => $row['action_performed'],
            'affected_module' => $row['affected_module'],
            'timestamp' => $row['timestamp'],
        ];
    }, $query->fetchAll());
}

function owner_dashboard_unpaid_tenants(array $actor, string $month): array
{
    $scope = owner_scope_condition($actor);
    $conditions = array_merge(['bc.billing_month = :billing_month'], $scope['conditions']);
    $params = array_merge([':billing_month' => $month], $scope['params']);

    $query = db()->prepare(
        "SELECT u.full_name, r.room_number, bc.amount_due, bc.due_date,
                COALESCE(p.amount_paid, 0) AS amount_paid,
                p.payment_status
         FROM billing_cycles bc
         INNER JOIN users u ON u.user_id = bc.user_id
         INNER JOIN rooms r ON r.room_id = bc.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         LEFT JOIN payments p ON p.billing_cycle_id = bc.billing_cycle_id
         WHERE " . implode(' AND ', $conditions) . "
           AND (p.payment_id IS NULL OR p.payment_status <> 'paid')
         ORDER BY bc.due_date ASC, u.full_name ASC
         LIMIT 10"
    );
    $query->execute($params);

    return array_map(static function (array $row): array {
        $dueDate = $row['due_date'] ?: date('Y-m-d');
        $daysOverdue = max(0, (int)floor((time() - strtotime((string)$dueDate)) / 86400));

        return [
            'name' => $row['full_name'],
            'room' => $row['room_number'],
            'amount_due' => max((float)$row['amount_due'] - (float)$row['amount_paid'], 0.0),
            'days_overdue' => $daysOverdue,
        ];
    }, $query->fetchAll());
}
