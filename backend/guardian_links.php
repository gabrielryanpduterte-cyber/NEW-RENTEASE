<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'DELETE']);
ensure_seeker_feature_schema();

$method = request_method();
$payload = $method === 'POST' ? request_payload() : [];
$action = request_action($payload);

try {
    if ($method === 'GET' && $action === 'public') {
        handle_guardian_public_view();
    }

    $actor = require_roles(['seeker']);

    if ($method === 'GET') {
        handle_guardian_links_get($actor);
    }

    if ($method === 'POST') {
        handle_guardian_links_create($actor, $payload);
    }

    if ($method === 'DELETE') {
        handle_guardian_links_revoke($actor);
    }

    json_response(false, 'Invalid guardian link action.', new stdClass(), [], 400);
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Guardian links request failed', $user ? (int)$user['user_id'] : null);
}

function guardian_links_base_select(): string
{
    return 'SELECT
                gl.*,
                u.full_name AS tenant_name,
                u.email AS tenant_email
            FROM guardian_links gl
            INNER JOIN users u ON u.user_id = gl.tenant_user_id';
}

function normalize_guardian_link(array $row): array
{
    $id = isset($row['guardian_link_id']) ? (int)$row['guardian_link_id'] : null;

    return [
        'id' => $id,
        'guardian_link_id' => $id,
        'tenant_user_id' => isset($row['tenant_user_id']) ? (int)$row['tenant_user_id'] : null,
        'guardian_name' => $row['guardian_name'] ?? null,
        'guardian_email' => $row['guardian_email'] ?? null,
        'access_token' => $row['access_token'] ?? null,
        'status' => $row['status'] ?? null,
        'last_accessed_at' => $row['last_accessed_at'] ?? null,
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

function handle_guardian_links_get(array $actor): void
{
    $query = db()->prepare(
        guardian_links_base_select() . '
         WHERE gl.tenant_user_id = :tenant_user_id
         ORDER BY gl.created_at DESC, gl.guardian_link_id DESC'
    );
    $query->execute([':tenant_user_id' => (int)$actor['user_id']]);

    json_response(true, 'Guardian links fetched successfully.', array_map('normalize_guardian_link', $query->fetchAll()), []);
}

function handle_guardian_links_create(array $actor, array $payload): void
{
    require_fields($payload, ['guardian_name', 'guardian_email']);

    $guardianName = trim((string)$payload['guardian_name']);
    $guardianEmail = strtolower(trim((string)$payload['guardian_email']));

    $errors = [];
    if ($guardianName === '' || strlen($guardianName) > 100) {
        $errors[] = 'guardian_name is required and must not exceed 100 characters.';
    }
    if (!filter_var($guardianEmail, FILTER_VALIDATE_EMAIL) || strlen($guardianEmail) > 150) {
        $errors[] = 'guardian_email must be a valid email address up to 150 characters.';
    }
    if (!empty($errors)) {
        json_response(false, 'Validation failed.', new stdClass(), $errors, 400);
    }

    $activeCountQuery = db()->prepare(
        'SELECT COUNT(*)
         FROM guardian_links
         WHERE tenant_user_id = :tenant_user_id
           AND status = :status'
    );
    $activeCountQuery->execute([
        ':tenant_user_id' => (int)$actor['user_id'],
        ':status' => 'active',
    ]);
    if ((int)$activeCountQuery->fetchColumn() >= 5) {
        json_response(false, 'Guardian limit reached.', new stdClass(), ['You can only keep 5 active guardian links.'], 400);
    }

    $insert = db()->prepare(
        'INSERT INTO guardian_links (
            tenant_user_id,
            guardian_name,
            guardian_email,
            access_token,
            status,
            created_at,
            updated_at
        ) VALUES (
            :tenant_user_id,
            :guardian_name,
            :guardian_email,
            :access_token,
            :status,
            NOW(),
            NOW()
        )'
    );
    $insert->execute([
        ':tenant_user_id' => (int)$actor['user_id'],
        ':guardian_name' => $guardianName,
        ':guardian_email' => $guardianEmail,
        ':access_token' => generate_uuid_v4(),
        ':status' => 'active',
    ]);

    $linkId = (int)db()->lastInsertId();
    log_activity((int)$actor['user_id'], "Created guardian link for {$guardianName}", 'guardian_links');

    $link = find_guardian_link_for_tenant($linkId, (int)$actor['user_id']);
    json_response(true, 'Guardian access link generated successfully.', $link ? normalize_guardian_link($link) : ['id' => $linkId], [], 201);
}

function handle_guardian_links_revoke(array $actor): void
{
    $linkId = parse_positive_int($_GET['guardian_link_id'] ?? ($_GET['id'] ?? null));
    if ($linkId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['guardian_link_id is required.'], 400);
    }

    $link = find_guardian_link_for_tenant($linkId, (int)$actor['user_id']);
    if ($link === null) {
        json_response(false, 'Guardian link not found.', new stdClass(), [], 404);
    }

    $update = db()->prepare(
        'UPDATE guardian_links
         SET status = :status
         WHERE guardian_link_id = :guardian_link_id
           AND tenant_user_id = :tenant_user_id'
    );
    $update->execute([
        ':status' => 'revoked',
        ':guardian_link_id' => $linkId,
        ':tenant_user_id' => (int)$actor['user_id'],
    ]);

    log_activity((int)$actor['user_id'], 'Revoked guardian link for ' . (string)$link['guardian_name'], 'guardian_links');

    $updated = find_guardian_link_for_tenant($linkId, (int)$actor['user_id']);
    json_response(true, 'Guardian access revoked successfully.', $updated ? normalize_guardian_link($updated) : new stdClass(), []);
}

function find_guardian_link_for_tenant(int $linkId, int $tenantUserId): ?array
{
    $query = db()->prepare(
        guardian_links_base_select() . '
         WHERE gl.guardian_link_id = :guardian_link_id
           AND gl.tenant_user_id = :tenant_user_id
         LIMIT 1'
    );
    $query->execute([
        ':guardian_link_id' => $linkId,
        ':tenant_user_id' => $tenantUserId,
    ]);
    $row = $query->fetch();

    return $row ?: null;
}

function handle_guardian_public_view(): void
{
    $token = trim((string)($_GET['token'] ?? ($_GET['access_token'] ?? '')));
    if ($token === '') {
        json_response(false, 'Guardian link not found.', new stdClass(), [], 404);
    }

    $query = db()->prepare(
        guardian_links_base_select() . '
         WHERE gl.access_token = :access_token
         LIMIT 1'
    );
    $query->execute([':access_token' => $token]);
    $link = $query->fetch();

    if (!$link || strtolower((string)$link['status']) !== 'active') {
        json_response(false, 'This link is no longer valid.', new stdClass(), [], 404);
    }

    $tenantUserId = (int)$link['tenant_user_id'];

    $update = db()->prepare(
        'UPDATE guardian_links
         SET last_accessed_at = NOW()
         WHERE guardian_link_id = :guardian_link_id'
    );
    $update->execute([':guardian_link_id' => (int)$link['guardian_link_id']]);

    log_activity_note(
        $tenantUserId,
        'Guardian viewed data',
        'guardian_links',
        'Guardian [' . (string)$link['guardian_name'] . '] viewed data',
        (int)$link['guardian_link_id']
    );

    $reservation = find_current_tenant_reservation($tenantUserId);
    $currentPayment = find_current_month_payment($tenantUserId);
    $history = find_recent_payments($tenantUserId, 3);

    $data = [
        'tenant_name' => $link['tenant_name'] ?? 'Tenant',
        'room' => $reservation ? normalize_guardian_room($reservation) : null,
        'boarding_house' => $reservation ? [
            'name' => $reservation['house_name'] ?? null,
            'address' => $reservation['address'] ?? null,
        ] : null,
        'landlord_contact' => $reservation ? [
            'name' => $reservation['landlord_name'] ?? null,
            'contact_number' => $reservation['landlord_contact_number'] ?? null,
        ] : null,
        'rent_current_month' => $currentPayment ? normalize_guardian_payment($currentPayment) : null,
        'rent_history' => array_map('normalize_guardian_payment', $history),
        'last_updated' => date('c'),
    ];

    json_response(true, 'Guardian view fetched successfully.', $data, []);
}

function find_current_tenant_reservation(int $tenantUserId): ?array
{
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
            b.house_rules,
            owner.full_name AS landlord_name,
            owner.contact_number AS landlord_contact_number
         FROM reservations rv
         INNER JOIN rooms r ON r.room_id = rv.room_id
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         INNER JOIN users owner ON owner.user_id = b.owner_id
         WHERE rv.user_id = :tenant_user_id
           AND rv.status = :status
         ORDER BY rv.move_in_date DESC, rv.reservation_id DESC
         LIMIT 1'
    );
    $query->execute([
        ':tenant_user_id' => $tenantUserId,
        ':status' => 'approved',
    ]);
    $row = $query->fetch();

    return $row ?: null;
}

function find_current_month_payment(int $tenantUserId): ?array
{
    $query = db()->prepare(
        'SELECT *
         FROM payments
         WHERE user_id = :tenant_user_id
           AND billing_period = :billing_period
         ORDER BY payment_id DESC
         LIMIT 1'
    );
    $query->execute([
        ':tenant_user_id' => $tenantUserId,
        ':billing_period' => date('Y-m'),
    ]);
    $row = $query->fetch();

    return $row ?: null;
}

function find_recent_payments(int $tenantUserId, int $limit): array
{
    $query = db()->prepare(
        'SELECT *
         FROM payments
         WHERE user_id = :tenant_user_id
         ORDER BY billing_period DESC, payment_id DESC
         LIMIT :limit'
    );
    $query->bindValue(':tenant_user_id', $tenantUserId, PDO::PARAM_INT);
    $query->bindValue(':limit', $limit, PDO::PARAM_INT);
    $query->execute();

    return $query->fetchAll();
}

function normalize_guardian_room(array $reservation): array
{
    $amenitiesRaw = trim((string)($reservation['amenities'] ?? ''));
    $amenities = $amenitiesRaw === ''
        ? []
        : array_values(array_filter(array_map('trim', explode(',', $amenitiesRaw))));

    return [
        'number' => $reservation['room_number'] ?? null,
        'type' => $reservation['room_type'] ?? null,
        'rate' => isset($reservation['monthly_rate']) ? (float)$reservation['monthly_rate'] : 0,
        'move_in_date' => $reservation['move_in_date'] ?? null,
        'capacity' => isset($reservation['capacity']) ? (int)$reservation['capacity'] : null,
        'status' => $reservation['availability_status'] ?? null,
        'amenities' => $amenities,
        'photo_url' => null,
    ];
}

function normalize_guardian_payment(array $payment): array
{
    return [
        'billing_period' => $payment['billing_period'] ?? null,
        'billing_period_label' => format_billing_period_label((string)($payment['billing_period'] ?? '')),
        'status' => $payment['payment_status'] ?? null,
        'amount_due' => isset($payment['amount_due']) ? (float)$payment['amount_due'] : 0,
        'amount_paid' => isset($payment['amount_paid']) ? (float)$payment['amount_paid'] : 0,
        'payment_date' => $payment['payment_date'] ?? null,
    ];
}

function format_billing_period_label(string $billingPeriod): string
{
    $date = DateTime::createFromFormat('Y-m', $billingPeriod);
    if ($date instanceof DateTime) {
        return $date->format('F Y');
    }

    return $billingPeriod;
}
