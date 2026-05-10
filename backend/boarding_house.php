<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
ensure_owner_feature_schema();
$method = request_method();
$payload = in_array($method, ['POST', 'PUT', 'PATCH'], true) ? request_payload() : [];
$action = request_action($payload);

try {
    $actor = $method === 'GET' ? current_user() : require_auth();

    if ($method === 'GET') {
        handle_boarding_house_get($actor);
    }

    if ($method === 'POST') {
        if ($action === 'update') {
            handle_boarding_house_update($actor, $payload);
        }

        handle_boarding_house_create($actor, $payload);
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        handle_boarding_house_update($actor, $payload);
    }

    if ($method === 'DELETE') {
        handle_boarding_house_delete($actor);
    }
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Boarding house request failed', $user ? (int)$user['user_id'] : null);
}

function handle_boarding_house_get(?array $actor): void
{
    $boardingHouseId = parse_positive_int($_GET['boarding_house_id'] ?? null);
    if ($boardingHouseId !== null) {
        $query = db()->prepare(
            'SELECT b.*, u.full_name AS owner_name, u.email AS owner_email
             FROM boarding_house b
             INNER JOIN users u ON u.user_id = b.owner_id
             WHERE b.boarding_house_id = :boarding_house_id
             LIMIT 1'
        );
        $query->execute([':boarding_house_id' => $boardingHouseId]);
        $item = $query->fetch();
        if (!$item) {
            json_response(false, 'Boarding house not found.', new stdClass(), [], 404);
        }

        json_response(true, 'Boarding house fetched successfully.', normalize_boarding_house_row($item, $actor === null), []);
    }

    $conditions = [];
    $params = [];

    $ownerId = parse_positive_int($_GET['owner_id'] ?? null);
    if ($ownerId !== null) {
        $conditions[] = 'b.owner_id = :owner_id';
        $params[':owner_id'] = $ownerId;
    }

    if ($actor !== null && $actor['role'] === 'owner' && $ownerId === null) {
        $conditions[] = 'b.owner_id = :actor_owner_id';
        $params[':actor_owner_id'] = (int)$actor['user_id'];
    }

    $propertyType = normalize_property_type($_GET['property_type'] ?? null, true);
    if ($propertyType !== null) {
        $conditions[] = 'b.property_type = :property_type';
        $params[':property_type'] = $propertyType;
    }

    $sql = 'SELECT b.*, u.full_name AS owner_name, u.email AS owner_email
            FROM boarding_house b
            INNER JOIN users u ON u.user_id = b.owner_id';
    if (!empty($conditions)) {
        $sql .= ' WHERE ' . implode(' AND ', $conditions);
    }
    $sql .= ' ORDER BY b.boarding_house_id DESC';

    $query = db()->prepare($sql);
    $query->execute($params);
    $items = $query->fetchAll();

    $isPublic = $actor === null;
    json_response(
        true,
        'Boarding houses fetched successfully.',
        array_map(static fn(array $item): array => normalize_boarding_house_row($item, $isPublic), $items),
        []
    );
}

function handle_boarding_house_create(array $actor, array $payload): void
{
    if (!in_array($actor['role'], ['owner', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only owner or admin can create a boarding house.'], 403);
    }

    require_fields($payload, ['house_name', 'address']);

    $houseName = trim((string)$payload['house_name']);
    $address = trim((string)$payload['address']);
    $description = trim((string)($payload['description'] ?? ''));
    $houseRules = trim((string)($payload['house_rules'] ?? ''));
    $propertyType = normalize_property_type($payload['property_type'] ?? null);
    $contactNumber = trim((string)($payload['contact_number'] ?? ''));
    $facebookPage = trim((string)($payload['facebook_page'] ?? ''));
    $amenitiesList = normalize_amenities_payload($payload['amenities_list'] ?? ($payload['amenities'] ?? []));

    $ownerId = (int)$actor['user_id'];
    if ($actor['role'] === 'admin') {
        $ownerId = parse_positive_int($payload['owner_id'] ?? null) ?? 0;
        if ($ownerId <= 0) {
            json_response(false, 'Validation failed.', new stdClass(), ['owner_id is required for admin-created records.'], 400);
        }

        $ownerQuery = db()->prepare('SELECT user_id, role FROM users WHERE user_id = :user_id LIMIT 1');
        $ownerQuery->execute([':user_id' => $ownerId]);
        $owner = $ownerQuery->fetch();
        if (!$owner || $owner['role'] !== 'owner') {
            json_response(false, 'Validation failed.', new stdClass(), ['owner_id must reference an existing owner account.'], 400);
        }
    }

    $existingHouse = db()->prepare('SELECT boarding_house_id FROM boarding_house WHERE owner_id = :owner_id LIMIT 1');
    $existingHouse->execute([':owner_id' => $ownerId]);
    if ($existingHouse->fetch()) {
        json_response(false, 'Validation failed.', new stdClass(), ['This owner already has a boarding house record.'], 400);
    }

    $coverPhoto = null;
    if (isset($_FILES['cover_photo']) && is_array($_FILES['cover_photo'])) {
        $coverPhoto = store_uploaded_file(
            $_FILES['cover_photo'],
            'storage/public/boarding_houses/' . $ownerId,
            [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
            ],
            3 * 1024 * 1024,
            'cover_photo'
        );
    }

    $insert = db()->prepare(
        'INSERT INTO boarding_house (
            owner_id, house_name, property_type, address, description, house_rules,
            contact_number, facebook_page, amenities_list, cover_photo
         ) VALUES (
            :owner_id, :house_name, :property_type, :address, :description, :house_rules,
            :contact_number, :facebook_page, :amenities_list, :cover_photo
         )'
    );
    $insert->execute([
        ':owner_id' => $ownerId,
        ':house_name' => $houseName,
        ':property_type' => $propertyType,
        ':address' => $address,
        ':description' => $description,
        ':house_rules' => $houseRules,
        ':contact_number' => $contactNumber !== '' ? $contactNumber : null,
        ':facebook_page' => $facebookPage !== '' ? $facebookPage : null,
        ':amenities_list' => json_encode($amenitiesList, JSON_UNESCAPED_UNICODE),
        ':cover_photo' => $coverPhoto,
    ]);

    $newId = (int)db()->lastInsertId();
    log_activity((int)$actor['user_id'], "Created boarding house #{$newId}", 'boarding_house');

    $fetch = db()->prepare('SELECT * FROM boarding_house WHERE boarding_house_id = :id LIMIT 1');
    $fetch->execute([':id' => $newId]);
    $row = $fetch->fetch();

    json_response(true, 'Boarding house created successfully.', $row ? normalize_boarding_house_row($row) : ['boarding_house_id' => $newId], [], 201);
}

function handle_boarding_house_update(array $actor, array $payload): void
{
    if (!in_array($actor['role'], ['owner', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only owner or admin can update boarding house data.'], 403);
    }

    $boardingHouseId = parse_positive_int($_GET['boarding_house_id'] ?? ($payload['boarding_house_id'] ?? null));
    if ($boardingHouseId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['boarding_house_id is required.'], 400);
    }

    $existingQuery = db()->prepare('SELECT * FROM boarding_house WHERE boarding_house_id = :id LIMIT 1');
    $existingQuery->execute([':id' => $boardingHouseId]);
    $existing = $existingQuery->fetch();
    if (!$existing) {
        json_response(false, 'Boarding house not found.', new stdClass(), [], 404);
    }

    if ($actor['role'] === 'owner' && (int)$existing['owner_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only update your own boarding house.'], 403);
    }

    $updates = [];
    $params = [':id' => $boardingHouseId];

    if (array_key_exists('house_name', $payload)) {
        $updates[] = 'house_name = :house_name';
        $params[':house_name'] = trim((string)$payload['house_name']);
    }
    if (array_key_exists('property_type', $payload)) {
        $updates[] = 'property_type = :property_type';
        $params[':property_type'] = normalize_property_type($payload['property_type']);
    }
    if (array_key_exists('address', $payload)) {
        $updates[] = 'address = :address';
        $params[':address'] = trim((string)$payload['address']);
    }
    if (array_key_exists('description', $payload)) {
        $updates[] = 'description = :description';
        $params[':description'] = trim((string)$payload['description']);
    }
    if (array_key_exists('house_rules', $payload)) {
        $updates[] = 'house_rules = :house_rules';
        $params[':house_rules'] = trim((string)$payload['house_rules']);
    }
    if (array_key_exists('contact_number', $payload)) {
        $updates[] = 'contact_number = :contact_number';
        $contactNumber = trim((string)$payload['contact_number']);
        $params[':contact_number'] = $contactNumber !== '' ? $contactNumber : null;
    }
    if (array_key_exists('facebook_page', $payload)) {
        $updates[] = 'facebook_page = :facebook_page';
        $facebookPage = trim((string)$payload['facebook_page']);
        $params[':facebook_page'] = $facebookPage !== '' ? $facebookPage : null;
    }
    if (array_key_exists('amenities_list', $payload) || array_key_exists('amenities', $payload)) {
        $updates[] = 'amenities_list = :amenities_list';
        $params[':amenities_list'] = json_encode(
            normalize_amenities_payload($payload['amenities_list'] ?? ($payload['amenities'] ?? [])),
            JSON_UNESCAPED_UNICODE
        );
    }
    if (isset($_FILES['cover_photo']) && is_array($_FILES['cover_photo'])) {
        $updates[] = 'cover_photo = :cover_photo';
        $params[':cover_photo'] = store_uploaded_file(
            $_FILES['cover_photo'],
            'storage/public/boarding_houses/' . (int)$existing['owner_id'],
            [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
            ],
            3 * 1024 * 1024,
            'cover_photo'
        );
    }

    if ($actor['role'] === 'admin' && array_key_exists('owner_id', $payload)) {
        $newOwnerId = parse_positive_int($payload['owner_id']);
        if ($newOwnerId === null) {
            json_response(false, 'Validation failed.', new stdClass(), ['owner_id must be a positive integer.'], 400);
        }

        $ownerQuery = db()->prepare('SELECT user_id, role FROM users WHERE user_id = :user_id LIMIT 1');
        $ownerQuery->execute([':user_id' => $newOwnerId]);
        $owner = $ownerQuery->fetch();
        if (!$owner || $owner['role'] !== 'owner') {
            json_response(false, 'Validation failed.', new stdClass(), ['owner_id must reference an existing owner account.'], 400);
        }

        if ($newOwnerId !== (int)$existing['owner_id']) {
            $otherHouseQuery = db()->prepare(
                'SELECT boarding_house_id FROM boarding_house
                 WHERE owner_id = :owner_id AND boarding_house_id <> :id
                 LIMIT 1'
            );
            $otherHouseQuery->execute([':owner_id' => $newOwnerId, ':id' => $boardingHouseId]);
            if ($otherHouseQuery->fetch()) {
                json_response(false, 'Validation failed.', new stdClass(), ['New owner already has a boarding house.'], 400);
            }
        }

        $updates[] = 'owner_id = :owner_id';
        $params[':owner_id'] = $newOwnerId;
    }

    if (empty($updates)) {
        json_response(false, 'Validation failed.', new stdClass(), ['No updatable fields provided.'], 400);
    }

    $sql = 'UPDATE boarding_house SET ' . implode(', ', $updates) . ' WHERE boarding_house_id = :id';
    $update = db()->prepare($sql);
    $update->execute($params);

    log_activity((int)$actor['user_id'], 'Updated boarding house profile', 'boarding_house');

    $fetch = db()->prepare('SELECT * FROM boarding_house WHERE boarding_house_id = :id LIMIT 1');
    $fetch->execute([':id' => $boardingHouseId]);
    $row = $fetch->fetch();

    json_response(true, 'Boarding house updated successfully.', $row ? normalize_boarding_house_row($row) : new stdClass(), []);
}

function handle_boarding_house_delete(array $actor): void
{
    if (!in_array($actor['role'], ['owner', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only owner or admin can delete boarding house records.'], 403);
    }

    $boardingHouseId = parse_positive_int($_GET['boarding_house_id'] ?? null);
    if ($boardingHouseId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['boarding_house_id is required.'], 400);
    }

    $query = db()->prepare('SELECT owner_id FROM boarding_house WHERE boarding_house_id = :id LIMIT 1');
    $query->execute([':id' => $boardingHouseId]);
    $row = $query->fetch();
    if (!$row) {
        json_response(false, 'Boarding house not found.', new stdClass(), [], 404);
    }

    if ($actor['role'] === 'owner' && (int)$row['owner_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only delete your own boarding house.'], 403);
    }

    $delete = db()->prepare('DELETE FROM boarding_house WHERE boarding_house_id = :id');
    $delete->execute([':id' => $boardingHouseId]);

    log_activity((int)$actor['user_id'], "Deleted boarding house #{$boardingHouseId}", 'boarding_house');
    json_response(true, 'Boarding house deleted successfully.', new stdClass(), []);
}

function normalize_boarding_house_row(array $row, bool $isPublic = false): array
{
    $coverPhoto = trim((string)($row['cover_photo'] ?? ''));
    $row['boarding_house_id'] = isset($row['boarding_house_id']) ? (int)$row['boarding_house_id'] : null;
    $row['owner_id'] = isset($row['owner_id']) ? (int)$row['owner_id'] : null;
    $row['property_type'] = normalize_property_type($row['property_type'] ?? null);
    $row['amenities_list'] = decode_json_array($row['amenities_list'] ?? null);
    $row['cover_photo_url'] = $coverPhoto !== '' ? backend_asset_url($coverPhoto) : null;
    if ($isPublic) {
        unset($row['owner_email']);
    }
    return $row;
}

function normalize_property_type($value, bool $allowNull = false): ?string
{
    $type = strtolower(trim((string)($value ?? '')));
    if ($type === '') {
        return $allowNull ? null : 'boarding_house';
    }

    $type = str_replace([' ', '-'], '_', $type);
    if ($type === 'boardinghouse') {
        $type = 'boarding_house';
    }
    if ($type === 'condo') {
        $type = 'condominium';
    }

    if (!in_array($type, ['boarding_house', 'apartment', 'dormitory', 'condominium', 'bedspace', 'other'], true)) {
        json_response(false, 'Validation failed.', new stdClass(), ['property_type is invalid.'], 400);
    }

    return $type;
}

function normalize_amenities_payload($value): array
{
    if (is_string($value)) {
        $decoded = json_decode($value, true);
        if (is_array($decoded)) {
            $value = $decoded;
        } else {
            $value = array_map('trim', explode(',', $value));
        }
    }

    if (!is_array($value)) {
        return [];
    }

    $amenities = [];
    foreach ($value as $item) {
        $name = is_array($item) ? ($item['name'] ?? $item['amenity_name'] ?? '') : $item;
        $name = trim((string)$name);
        if ($name !== '') {
            $amenities[$name] = $name;
        }
    }

    return array_values($amenities);
}
