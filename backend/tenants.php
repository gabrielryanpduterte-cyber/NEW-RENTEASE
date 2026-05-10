<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET']);
ensure_seeker_feature_schema();
ensure_owner_feature_schema();

try {
    $actor = require_roles(['owner', 'admin']);
    $tenantId = parse_positive_int($_GET['user_id'] ?? ($_GET['tenant_id'] ?? null));

    if ($tenantId !== null) {
        handle_tenant_show($actor, $tenantId);
    }

    handle_tenant_index($actor);
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Tenants request failed', $user ? (int)$user['user_id'] : null);
}

function handle_tenant_index(array $actor): void
{
    $conditions = ["rv.status = 'approved'"];
    $params = [':billing_month' => date('Y-m')];

    if ($actor['role'] === 'owner') {
        $conditions[] = 'b.owner_id = :owner_id';
        $params[':owner_id'] = (int)$actor['user_id'];
    }

    $query = db()->prepare(
        'SELECT rv.reservation_id, rv.move_in_date,
                u.user_id, u.full_name, u.email, u.contact_number,
                u.profile_photo, u.school_or_workplace,
                u.emergency_contact_name, u.emergency_contact_number,
                r.room_id, r.room_number, r.room_type, r.monthly_rate,
                bc.billing_cycle_id, p.payment_status, p.amount_due, p.amount_paid,
                COUNT(DISTINCT gl.guardian_link_id) AS guardian_links_count
         FROM reservations rv
         INNER JOIN users u ON u.user_id = rv.user_id
         INNER JOIN rooms r ON r.room_id = rv.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         LEFT JOIN billing_cycles bc ON bc.reservation_id = rv.reservation_id
             AND bc.billing_month = :billing_month
         LEFT JOIN payments p ON p.billing_cycle_id = bc.billing_cycle_id
         LEFT JOIN guardian_links gl ON gl.tenant_user_id = u.user_id
             AND gl.status <> \'revoked\'
         WHERE ' . implode(' AND ', $conditions) . '
         GROUP BY rv.reservation_id, rv.move_in_date,
                  u.user_id, u.full_name, u.email, u.contact_number,
                  u.profile_photo, u.school_or_workplace,
                  u.emergency_contact_name, u.emergency_contact_number,
                  r.room_id, r.room_number, r.room_type, r.monthly_rate,
                  bc.billing_cycle_id, p.payment_status, p.amount_due, p.amount_paid
         ORDER BY r.room_number ASC, u.full_name ASC'
    );
    $query->execute($params);
    $items = array_map('normalize_tenant_summary', $query->fetchAll());

    json_response(true, 'Tenants fetched successfully.', $items, []);
}

function handle_tenant_show(array $actor, int $tenantId): void
{
    $conditions = ["rv.status = 'approved'", 'u.user_id = :tenant_id'];
    $params = [':tenant_id' => $tenantId];

    if ($actor['role'] === 'owner') {
        $conditions[] = 'b.owner_id = :owner_id';
        $params[':owner_id'] = (int)$actor['user_id'];
    }

    $query = db()->prepare(
        'SELECT rv.reservation_id, rv.move_in_date,
                u.user_id, u.full_name, u.email, u.contact_number,
                u.profile_photo, u.school_or_workplace,
                u.emergency_contact_name, u.emergency_contact_number,
                r.room_id, r.room_number, r.room_type, r.monthly_rate,
                b.boarding_house_id, b.house_name
         FROM reservations rv
         INNER JOIN users u ON u.user_id = rv.user_id
         INNER JOIN rooms r ON r.room_id = rv.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE ' . implode(' AND ', $conditions) . '
         ORDER BY rv.reservation_id DESC
         LIMIT 1'
    );
    $query->execute($params);
    $tenant = $query->fetch();

    if (!$tenant) {
        json_response(false, 'Tenant not found.', new stdClass(), [], 404);
    }

    $history = fetch_tenant_payment_history($actor, $tenantId);
    $guardians = fetch_tenant_guardians($tenantId);
    $profile = normalize_tenant_summary($tenant);
    $profile['payment_history'] = $history;
    $profile['guardians'] = $guardians;

    json_response(true, 'Tenant fetched successfully.', $profile, []);
}

function fetch_tenant_payment_history(array $actor, int $tenantId): array
{
    $conditions = ['bc.user_id = :tenant_id'];
    $params = [':tenant_id' => $tenantId];

    if ($actor['role'] === 'owner') {
        $conditions[] = 'b.owner_id = :owner_id';
        $params[':owner_id'] = (int)$actor['user_id'];
    }

    $query = db()->prepare(
        'SELECT bc.billing_month, bc.amount_due, bc.due_date,
                r.room_number, p.payment_id, p.amount_paid, p.payment_status,
                p.payment_method, p.payment_date
         FROM billing_cycles bc
         INNER JOIN rooms r ON r.room_id = bc.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         LEFT JOIN payments p ON p.billing_cycle_id = bc.billing_cycle_id
         WHERE ' . implode(' AND ', $conditions) . '
         ORDER BY bc.billing_month DESC
         LIMIT 36'
    );
    $query->execute($params);
    $rows = $query->fetchAll();

    if (empty($rows)) {
        $fallbackConditions = ['p.user_id = :tenant_id'];
        $fallbackParams = [':tenant_id' => $tenantId];
        if ($actor['role'] === 'owner') {
            $fallbackConditions[] = 'b.owner_id = :owner_id';
            $fallbackParams[':owner_id'] = (int)$actor['user_id'];
        }

        $fallback = db()->prepare(
            'SELECT p.billing_period AS billing_month, p.amount_due, p.payment_date AS due_date,
                    r.room_number, p.payment_id, p.amount_paid, p.payment_status,
                    p.payment_method, p.payment_date
             FROM payments p
             INNER JOIN rooms r ON r.room_id = p.room_id
             INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
             WHERE ' . implode(' AND ', $fallbackConditions) . '
             ORDER BY p.billing_period DESC, p.payment_id DESC
             LIMIT 36'
        );
        $fallback->execute($fallbackParams);
        $rows = $fallback->fetchAll();
    }

    return array_map(static function (array $row): array {
        $amountDue = (float)($row['amount_due'] ?? 0);
        $amountPaid = (float)($row['amount_paid'] ?? 0);
        $status = strtolower((string)($row['payment_status'] ?? ''));
        if ($status === '') {
            $status = $amountPaid >= $amountDue && $amountDue > 0 ? 'paid' : 'unpaid';
        }

        return [
            'billing_month' => $row['billing_month'],
            'room_number' => $row['room_number'],
            'amount_due' => $amountDue,
            'amount_paid' => $amountPaid,
            'payment_status' => $status,
            'payment_method' => $row['payment_method'] ?? null,
            'payment_date' => $row['payment_date'] ?? null,
        ];
    }, $rows);
}

function fetch_tenant_guardians(int $tenantId): array
{
    if (!db_table_exists('guardian_links')) {
        return [];
    }

    $query = db()->prepare(
        "SELECT guardian_name, guardian_email, status
         FROM guardian_links
         WHERE tenant_user_id = :tenant_id
           AND status <> 'revoked'
         ORDER BY created_at DESC"
    );
    $query->execute([':tenant_id' => $tenantId]);

    return array_map(static function (array $row): array {
        return [
            'guardian_name' => $row['guardian_name'],
            'guardian_email' => $row['guardian_email'],
            'status' => $row['status'],
        ];
    }, $query->fetchAll());
}

function normalize_tenant_summary(array $row): array
{
    $profilePhoto = trim((string)($row['profile_photo'] ?? ''));
    $amountDue = (float)($row['amount_due'] ?? 0);
    $amountPaid = (float)($row['amount_paid'] ?? 0);
    $paymentStatus = strtolower((string)($row['payment_status'] ?? ''));
    if ($paymentStatus === '') {
        $paymentStatus = isset($row['billing_cycle_id']) && $row['billing_cycle_id'] !== null
            ? ($amountPaid >= $amountDue && $amountDue > 0 ? 'paid' : 'unpaid')
            : 'no_record';
    }

    return [
        'user_id' => (int)$row['user_id'],
        'reservation_id' => isset($row['reservation_id']) ? (int)$row['reservation_id'] : null,
        'full_name' => $row['full_name'],
        'email' => $row['email'],
        'contact_number' => $row['contact_number'],
        'profile_photo_url' => $profilePhoto !== '' ? backend_asset_url($profilePhoto) : null,
        'school_or_workplace' => $row['school_or_workplace'] ?? null,
        'emergency_contact_name' => $row['emergency_contact_name'] ?? null,
        'emergency_contact_number' => $row['emergency_contact_number'] ?? null,
        'move_in_date' => $row['move_in_date'] ?? null,
        'room_id' => isset($row['room_id']) ? (int)$row['room_id'] : null,
        'room_number' => $row['room_number'] ?? null,
        'room_type' => $row['room_type'] ?? null,
        'monthly_rate' => isset($row['monthly_rate']) ? (float)$row['monthly_rate'] : 0.0,
        'rent_status_this_month' => $paymentStatus,
        'guardian_links_count' => isset($row['guardian_links_count']) ? (int)$row['guardian_links_count'] : 0,
    ];
}
