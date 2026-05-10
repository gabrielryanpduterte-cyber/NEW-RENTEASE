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
        handle_rooms_get($actor);
    }

    if ($method === 'POST') {
        if ($action === 'update') {
            handle_rooms_update($actor, $payload);
        }
        if ($action === 'archive') {
            handle_rooms_archive($actor, true);
        }
        if ($action === 'unarchive') {
            handle_rooms_archive($actor, false);
        }
        if ($action === 'upload_photos') {
            handle_rooms_upload_photos($actor);
        }

        handle_rooms_create($actor, $payload);
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        if ($action === 'archive') {
            handle_rooms_archive($actor, true);
        }
        if ($action === 'unarchive') {
            handle_rooms_archive($actor, false);
        }

        handle_rooms_update($actor, $payload);
    }

    if ($method === 'DELETE') {
        handle_rooms_delete($actor);
    }
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Rooms request failed', $user ? (int)$user['user_id'] : null);
}

function handle_rooms_get(?array $actor): void
{
    $roomId = parse_positive_int($_GET['room_id'] ?? null);
    $approvedCountSql = "(SELECT COUNT(*) FROM reservations rv_room_count WHERE rv_room_count.room_id = r.room_id AND rv_room_count.status = 'approved')";

    if ($roomId !== null) {
        $query = db()->prepare(
            'SELECT r.*, b.house_name, b.owner_id
             FROM rooms r
             INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
             WHERE r.room_id = :room_id
             LIMIT 1'
        );
        $query->execute([':room_id' => $roomId]);
        $room = $query->fetch();
        if (!$room) {
            json_response(false, 'Room not found.', new stdClass(), [], 404);
        }

        if ($actor !== null && $actor['role'] === 'owner' && (int)$room['owner_id'] !== (int)$actor['user_id']) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only access rooms under your boarding house.'], 403);
        }
        if ($actor === null && ((int)($room['is_archived'] ?? 0) === 1 || ($room['availability_status'] ?? '') === 'archived')) {
            json_response(false, 'Room not found.', new stdClass(), [], 404);
        }

        json_response(true, 'Room fetched successfully.', normalize_room_row($room, should_include_room_occupant($actor)), []);
    }

    $conditions = [];
    $params = [];

    $boardingHouseId = parse_positive_int($_GET['boarding_house_id'] ?? null);
    if ($boardingHouseId !== null) {
        $conditions[] = 'r.boarding_house_id = :boarding_house_id';
        $params[':boarding_house_id'] = $boardingHouseId;
    }

    $availability = strtolower(trim((string)($_GET['availability_status'] ?? '')));
    if ($availability !== '') {
        if ($availability === 'archived') {
            $conditions[] = '(r.is_archived = 1 OR r.availability_status = :availability_status)';
            $params[':availability_status'] = $availability;
        } elseif ($availability === 'available') {
            $conditions[] = "(r.availability_status = 'available' OR (r.availability_status = 'occupied' AND {$approvedCountSql} < r.capacity))";
            $conditions[] = "({$approvedCountSql} < r.capacity)";
            $conditions[] = '(r.is_archived = 0 OR r.is_archived IS NULL)';
        } elseif ($availability === 'occupied') {
            $conditions[] = "({$approvedCountSql} >= r.capacity)";
            $conditions[] = '(r.is_archived = 0 OR r.is_archived IS NULL)';
        } else {
            $conditions[] = 'r.availability_status = :availability_status';
            $conditions[] = '(r.is_archived = 0 OR r.is_archived IS NULL)';
            $params[':availability_status'] = $availability;
        }
    }

    $includeArchived = strtolower(trim((string)($_GET['include_archived'] ?? '1')));
    if ($availability === '' && in_array($includeArchived, ['0', 'false', 'no'], true)) {
        $conditions[] = '(r.is_archived = 0 OR r.is_archived IS NULL)';
    }

    if ($actor !== null && $actor['role'] === 'owner') {
        $conditions[] = 'b.owner_id = :owner_id';
        $params[':owner_id'] = (int)$actor['user_id'];
    } elseif ($actor === null) {
        $conditions[] = "(r.availability_status = 'available' OR (r.availability_status = 'occupied' AND {$approvedCountSql} < r.capacity))";
        $conditions[] = "({$approvedCountSql} < r.capacity)";
        $conditions[] = '(r.is_archived = 0 OR r.is_archived IS NULL)';
    }

    $sql = 'SELECT r.*, b.house_name, b.owner_id
            FROM rooms r
            INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id';
    if (!empty($conditions)) {
        $sql .= ' WHERE ' . implode(' AND ', $conditions);
    }
    $sql .= ' ORDER BY r.room_id DESC';

    $query = db()->prepare($sql);
    $query->execute($params);
    $rooms = $query->fetchAll();

    $includeOccupant = should_include_room_occupant($actor);
    json_response(
        true,
        'Rooms fetched successfully.',
        array_map(static fn(array $room): array => normalize_room_row($room, $includeOccupant), $rooms),
        []
    );
}

function fixed_room_capacity(string $roomType): ?int
{
    $normalized = strtolower(trim($roomType));
    if ($normalized === 'single') {
        return 1;
    }
    if ($normalized === 'double') {
        return 2;
    }

    return null;
}

function handle_rooms_create(array $actor, array $payload): void
{
    if (!in_array($actor['role'], ['owner', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only owner or admin can create rooms.'], 403);
    }

    require_fields($payload, ['boarding_house_id', 'room_number', 'room_type', 'capacity', 'monthly_rate']);

    $boardingHouseId = parse_positive_int($payload['boarding_house_id'] ?? null);
    $roomNumber = trim((string)$payload['room_number']);
    $roomType = trim((string)$payload['room_type']);
    $capacity = parse_positive_int($payload['capacity'] ?? null);
    $fixedCapacity = fixed_room_capacity($roomType);
    if ($fixedCapacity !== null) {
        $capacity = $fixedCapacity;
    }
    $monthlyRate = $payload['monthly_rate'] ?? null;
    $amenityItems = parse_room_amenities_payload($payload);
    $amenities = implode(', ', array_map(static fn(array $item): string => $item['amenity_name'], $amenityItems));
    $availabilityStatus = strtolower(trim((string)($payload['availability_status'] ?? 'available')));
    $floorNumber = parse_non_negative_int($payload['floor_number'] ?? null);
    $notes = trim((string)($payload['notes'] ?? ''));

    $errors = [];
    if ($boardingHouseId === null) {
        $errors[] = 'boarding_house_id must be a positive integer.';
    }
    if ($roomNumber === '') {
        $errors[] = 'room_number is required.';
    }
    if ($roomType === '') {
        $errors[] = 'room_type is required.';
    }
    if ($capacity === null || $capacity > 10) {
        $errors[] = 'capacity must be between 1 and 10 tenants.';
    }
    if (!is_numeric((string)$monthlyRate) || (float)$monthlyRate < 0) {
        $errors[] = 'monthly_rate must be a valid non-negative number.';
    }
    if (!in_array($availabilityStatus, ['available', 'unavailable', 'occupied', 'archived'], true)) {
        $errors[] = 'availability_status must be available, unavailable, occupied, or archived.';
    }
    if (($payload['floor_number'] ?? '') !== '' && ($floorNumber === null || $floorNumber > 10)) {
        $errors[] = 'floor_number must be from 0 to 10.';
    }
    if (!empty($errors)) {
        json_response(false, 'Validation failed.', new stdClass(), $errors, 400);
    }

    $houseQuery = db()->prepare('SELECT owner_id FROM boarding_house WHERE boarding_house_id = :id LIMIT 1');
    $houseQuery->execute([':id' => $boardingHouseId]);
    $house = $houseQuery->fetch();
    if (!$house) {
        json_response(false, 'Validation failed.', new stdClass(), ['boarding_house_id does not exist.'], 400);
    }

    if ($actor['role'] === 'owner' && (int)$house['owner_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only create rooms for your own boarding house.'], 403);
    }

    $isArchived = $availabilityStatus === 'archived' ? 1 : 0;

    $insert = db()->prepare(
        'INSERT INTO rooms (
            boarding_house_id, room_number, room_type, capacity, monthly_rate,
            amenities, availability_status, floor_number, notes, is_archived
         ) VALUES (
            :boarding_house_id, :room_number, :room_type, :capacity, :monthly_rate,
            :amenities, :availability_status, :floor_number, :notes, :is_archived
         )'
    );
    $insert->execute([
        ':boarding_house_id' => $boardingHouseId,
        ':room_number' => $roomNumber,
        ':room_type' => $roomType,
        ':capacity' => $capacity,
        ':monthly_rate' => (float)$monthlyRate,
        ':amenities' => $amenities,
        ':availability_status' => $availabilityStatus,
        ':floor_number' => $floorNumber,
        ':notes' => $notes !== '' ? $notes : null,
        ':is_archived' => $isArchived,
    ]);

    $newId = (int)db()->lastInsertId();
    replace_room_amenities($newId, $amenityItems);

    $photoPaths = store_room_photo_uploads($newId, 10);
    if (!empty($photoPaths)) {
        $updatePhotos = db()->prepare('UPDATE rooms SET photos = :photos WHERE room_id = :room_id');
        $updatePhotos->execute([
            ':photos' => json_encode($photoPaths, JSON_UNESCAPED_UNICODE),
            ':room_id' => $newId,
        ]);
    }

    log_activity((int)$actor['user_id'], "Added Room {$roomNumber}", 'rooms');

    $fetch = db()->prepare('SELECT * FROM rooms WHERE room_id = :id LIMIT 1');
    $fetch->execute([':id' => $newId]);
    $room = $fetch->fetch();

    json_response(true, 'Room created successfully.', $room ? normalize_room_row($room, true) : ['room_id' => $newId], [], 201);
}

function handle_rooms_update(array $actor, array $payload): void
{
    if (!in_array($actor['role'], ['owner', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only owner or admin can update rooms.'], 403);
    }

    $roomId = parse_positive_int($_GET['room_id'] ?? ($payload['room_id'] ?? null));
    if ($roomId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['room_id is required.'], 400);
    }

    $existingQuery = db()->prepare(
        'SELECT r.*, b.owner_id
         FROM rooms r
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE r.room_id = :room_id
         LIMIT 1'
    );
    $existingQuery->execute([':room_id' => $roomId]);
    $existing = $existingQuery->fetch();
    if (!$existing) {
        json_response(false, 'Room not found.', new stdClass(), [], 404);
    }

    if ($actor['role'] === 'owner' && (int)$existing['owner_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only update your own rooms.'], 403);
    }

    $updates = [];
    $params = [':room_id' => $roomId];
    $nextRoomType = (string)($existing['room_type'] ?? '');

    if (array_key_exists('boarding_house_id', $payload)) {
        $newBoardingHouseId = parse_positive_int($payload['boarding_house_id']);
        if ($newBoardingHouseId === null) {
            json_response(false, 'Validation failed.', new stdClass(), ['boarding_house_id must be a positive integer.'], 400);
        }

        $houseQuery = db()->prepare('SELECT owner_id FROM boarding_house WHERE boarding_house_id = :id LIMIT 1');
        $houseQuery->execute([':id' => $newBoardingHouseId]);
        $house = $houseQuery->fetch();
        if (!$house) {
            json_response(false, 'Validation failed.', new stdClass(), ['boarding_house_id does not exist.'], 400);
        }
        if ($actor['role'] === 'owner' && (int)$house['owner_id'] !== (int)$actor['user_id']) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only move rooms to your own boarding house.'], 403);
        }

        $updates[] = 'boarding_house_id = :boarding_house_id';
        $params[':boarding_house_id'] = $newBoardingHouseId;
    }

    if (array_key_exists('room_number', $payload)) {
        $updates[] = 'room_number = :room_number';
        $params[':room_number'] = trim((string)$payload['room_number']);
    }
    if (array_key_exists('room_type', $payload)) {
        $nextRoomType = trim((string)$payload['room_type']);
        $updates[] = 'room_type = :room_type';
        $params[':room_type'] = $nextRoomType;
    }
    if (array_key_exists('capacity', $payload) || array_key_exists('room_type', $payload)) {
        $fixedCapacity = fixed_room_capacity($nextRoomType);
        $capacitySource = array_key_exists('capacity', $payload) ? $payload['capacity'] : ($existing['capacity'] ?? null);
        $capacity = $fixedCapacity ?? parse_positive_int($capacitySource);
        if ($capacity === null || $capacity > 10) {
            json_response(false, 'Validation failed.', new stdClass(), ['capacity must be between 1 and 10 tenants.'], 400);
        }
        $updates[] = 'capacity = :capacity';
        $params[':capacity'] = $capacity;
    }
    if (array_key_exists('monthly_rate', $payload)) {
        if (!is_numeric((string)$payload['monthly_rate']) || (float)$payload['monthly_rate'] < 0) {
            json_response(false, 'Validation failed.', new stdClass(), ['monthly_rate must be a valid non-negative number.'], 400);
        }
        $updates[] = 'monthly_rate = :monthly_rate';
        $params[':monthly_rate'] = (float)$payload['monthly_rate'];
    }
    if (array_key_exists('amenities', $payload)) {
        $amenityItems = parse_room_amenities_payload($payload);
        $updates[] = 'amenities = :amenities';
        $params[':amenities'] = implode(', ', array_map(static fn(array $item): string => $item['amenity_name'], $amenityItems));
    }
    if (array_key_exists('availability_status', $payload)) {
        $availabilityStatus = strtolower(trim((string)$payload['availability_status']));
        if (!in_array($availabilityStatus, ['available', 'unavailable', 'occupied', 'archived'], true)) {
            json_response(false, 'Validation failed.', new stdClass(), ['availability_status must be available, unavailable, occupied, or archived.'], 400);
        }
        $updates[] = 'availability_status = :availability_status';
        $params[':availability_status'] = $availabilityStatus;
        $updates[] = 'is_archived = :is_archived';
        $params[':is_archived'] = $availabilityStatus === 'archived' ? 1 : 0;
    }
    if (array_key_exists('floor_number', $payload)) {
        $floorNumber = parse_non_negative_int($payload['floor_number']);
        if (($payload['floor_number'] ?? '') !== '' && ($floorNumber === null || $floorNumber > 10)) {
            json_response(false, 'Validation failed.', new stdClass(), ['floor_number must be from 0 to 10.'], 400);
        }
        $updates[] = 'floor_number = :floor_number';
        $params[':floor_number'] = $floorNumber;
    }
    if (array_key_exists('notes', $payload)) {
        $notes = trim((string)$payload['notes']);
        $updates[] = 'notes = :notes';
        $params[':notes'] = $notes !== '' ? $notes : null;
    }
    if (isset($_FILES['photos']) && is_array($_FILES['photos'])) {
        $existingPhotos = decode_json_array($existing['photos'] ?? null);
        $newPhotos = store_room_photo_uploads($roomId, max(10 - count($existingPhotos), 0));
        $photos = array_slice(array_values(array_merge($existingPhotos, $newPhotos)), 0, 10);
        $updates[] = 'photos = :photos';
        $params[':photos'] = json_encode($photos, JSON_UNESCAPED_UNICODE);
    }

    if (empty($updates)) {
        json_response(false, 'Validation failed.', new stdClass(), ['No updatable fields provided.'], 400);
    }

    $sql = 'UPDATE rooms SET ' . implode(', ', $updates) . ' WHERE room_id = :room_id';
    $update = db()->prepare($sql);
    $update->execute($params);

    if (isset($amenityItems)) {
        replace_room_amenities($roomId, $amenityItems);
    }

    log_activity((int)$actor['user_id'], 'Updated Room ' . (string)($params[':room_number'] ?? $existing['room_number'] ?? $roomId), 'rooms');

    $fetch = db()->prepare('SELECT * FROM rooms WHERE room_id = :room_id LIMIT 1');
    $fetch->execute([':room_id' => $roomId]);
    $room = $fetch->fetch();

    json_response(true, 'Room updated successfully.', $room ? normalize_room_row($room, true) : new stdClass(), []);
}

function handle_rooms_delete(array $actor): void
{
    if (!in_array($actor['role'], ['owner', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only owner or admin can delete rooms.'], 403);
    }

    $roomId = parse_positive_int($_GET['room_id'] ?? null);
    if ($roomId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['room_id is required.'], 400);
    }

    $query = db()->prepare(
        'SELECT r.room_id, r.room_number, b.owner_id
         FROM rooms r
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE r.room_id = :room_id
         LIMIT 1'
    );
    $query->execute([':room_id' => $roomId]);
    $room = $query->fetch();
    if (!$room) {
        json_response(false, 'Room not found.', new stdClass(), [], 404);
    }

    if ($actor['role'] === 'owner' && (int)$room['owner_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only delete your own rooms.'], 403);
    }

    $activeTenant = room_has_active_tenant($roomId);
    if ($activeTenant) {
        json_response(
            false,
            'Room cannot be archived.',
            new stdClass(),
            ['Cannot archive while a tenant is assigned. End their tenancy first via the Tenant management page.'],
            400
        );
    }

    $archive = db()->prepare(
        "UPDATE rooms
         SET is_archived = 1, availability_status = 'archived'
         WHERE room_id = :room_id"
    );
    $archive->execute([':room_id' => $roomId]);

    log_activity((int)$actor['user_id'], 'Archived Room ' . (string)($room['room_number'] ?? $roomId), 'rooms');
    json_response(true, 'Room archived successfully.', new stdClass(), []);
}

function handle_rooms_archive(array $actor, bool $archive): void
{
    if (!in_array($actor['role'], ['owner', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only owner or admin can archive rooms.'], 403);
    }

    $payload = request_payload();
    $roomId = parse_positive_int($_GET['room_id'] ?? ($payload['room_id'] ?? null));
    if ($roomId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['room_id is required.'], 400);
    }

    $query = db()->prepare(
        'SELECT r.room_id, r.room_number, b.owner_id
         FROM rooms r
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE r.room_id = :room_id
         LIMIT 1'
    );
    $query->execute([':room_id' => $roomId]);
    $room = $query->fetch();
    if (!$room) {
        json_response(false, 'Room not found.', new stdClass(), [], 404);
    }
    if ($actor['role'] === 'owner' && (int)$room['owner_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only archive your own rooms.'], 403);
    }
    if ($archive && room_has_active_tenant($roomId)) {
        json_response(
            false,
            'Room cannot be archived.',
            new stdClass(),
            ['Cannot archive while a tenant is assigned. End their tenancy first via the Tenant management page.'],
            400
        );
    }

    $status = $archive ? 'archived' : 'available';
    $update = db()->prepare(
        'UPDATE rooms
         SET is_archived = :is_archived,
             availability_status = :availability_status
         WHERE room_id = :room_id'
    );
    $update->execute([
        ':is_archived' => $archive ? 1 : 0,
        ':availability_status' => $status,
        ':room_id' => $roomId,
    ]);

    log_activity(
        (int)$actor['user_id'],
        ($archive ? 'Archived Room ' : 'Unarchived Room ') . (string)$room['room_number'],
        'rooms'
    );

    $fetch = db()->prepare('SELECT * FROM rooms WHERE room_id = :room_id LIMIT 1');
    $fetch->execute([':room_id' => $roomId]);
    $updated = $fetch->fetch();

    json_response(
        true,
        $archive ? 'Room archived successfully.' : 'Room unarchived successfully.',
        $updated ? normalize_room_row($updated, true) : new stdClass(),
        []
    );
}

function handle_rooms_upload_photos(array $actor): void
{
    if (!in_array($actor['role'], ['owner', 'admin'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only owner or admin can upload room photos.'], 403);
    }

    $roomId = parse_positive_int($_GET['room_id'] ?? ($_POST['room_id'] ?? null));
    if ($roomId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['room_id is required.'], 400);
    }

    $query = db()->prepare(
        'SELECT r.*, b.owner_id
         FROM rooms r
         INNER JOIN boarding_house b ON b.boarding_house_id = r.boarding_house_id
         WHERE r.room_id = :room_id
         LIMIT 1'
    );
    $query->execute([':room_id' => $roomId]);
    $room = $query->fetch();
    if (!$room) {
        json_response(false, 'Room not found.', new stdClass(), [], 404);
    }
    if ($actor['role'] === 'owner' && (int)$room['owner_id'] !== (int)$actor['user_id']) {
        json_response(false, 'Forbidden.', new stdClass(), ['You can only upload photos for your own rooms.'], 403);
    }

    $existingPhotos = decode_json_array($room['photos'] ?? null);
    $newPhotos = store_room_photo_uploads($roomId, max(10 - count($existingPhotos), 0));
    $photos = array_slice(array_values(array_merge($existingPhotos, $newPhotos)), 0, 10);

    $update = db()->prepare('UPDATE rooms SET photos = :photos WHERE room_id = :room_id');
    $update->execute([
        ':photos' => json_encode($photos, JSON_UNESCAPED_UNICODE),
        ':room_id' => $roomId,
    ]);

    json_response(
        true,
        'Room photos uploaded successfully.',
        [
            'photos' => $photos,
            'photo_urls' => array_map('backend_asset_url', $photos),
        ],
        []
    );
}

function room_has_active_tenant(int $roomId): bool
{
    $query = db()->prepare(
        "SELECT reservation_id
         FROM reservations
         WHERE room_id = :room_id
           AND status = 'approved'
         LIMIT 1"
    );
    $query->execute([':room_id' => $roomId]);
    return (bool)$query->fetchColumn();
}

function normalize_room_row(array $row, bool $includeOccupant = false): array
{
    $roomId = (int)($row['room_id'] ?? 0);
    $photos = decode_json_array($row['photos'] ?? null);
    $approvedTenantCount = count_room_approved_tenants($roomId);
    $row['room_id'] = $roomId;
    $row['boarding_house_id'] = isset($row['boarding_house_id']) ? (int)$row['boarding_house_id'] : null;
    $row['capacity'] = isset($row['capacity']) ? (int)$row['capacity'] : null;
    $row['monthly_rate'] = isset($row['monthly_rate']) ? (float)$row['monthly_rate'] : 0.0;
    $row['floor_number'] = $row['floor_number'] !== null && $row['floor_number'] !== ''
        ? (int)$row['floor_number']
        : null;
    $row['is_archived'] = (int)($row['is_archived'] ?? 0) === 1;
    $row['occupied_count'] = $approvedTenantCount;
    $row['remaining_capacity'] = max((int)($row['capacity'] ?? 0) - $approvedTenantCount, 0);
    $row['occupancy_summary'] = $approvedTenantCount . ' tenant(s) inside, ' . $row['remaining_capacity'] . ' slot(s) left';
    if ($row['is_archived']) {
        $row['availability_status'] = 'archived';
    } elseif (($row['availability_status'] ?? '') !== 'unavailable') {
        $row['availability_status'] = $row['remaining_capacity'] > 0 ? 'available' : 'occupied';
    }
    $row['photos'] = $photos;
    $row['photo_urls'] = array_map('backend_asset_url', $photos);
    $row['first_photo_url'] = !empty($photos) ? backend_asset_url((string)$photos[0]) : null;
    $row['room_amenities'] = fetch_room_amenities($roomId, (string)($row['amenities'] ?? ''));

    if ($includeOccupant) {
        $occupants = find_room_occupants($roomId);
        $row['occupants'] = $occupants;
        $row['occupant'] = $occupants[0] ?? null;
        $row['occupant_name'] = count($occupants) > 1
            ? count($occupants) . ' tenants'
            : ($occupants[0]['full_name'] ?? null);
    }

    return $row;
}

function should_include_room_occupant(?array $actor): bool
{
    return $actor !== null && in_array((string)$actor['role'], ['owner', 'admin'], true);
}

function parse_room_amenities_payload(array $payload): array
{
    $raw = $payload['amenities'] ?? ($payload['room_amenities'] ?? []);
    if (isset($payload['amenities_json'])) {
        $raw = $payload['amenities_json'];
    }

    if (is_string($raw)) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $raw = $decoded;
        } else {
            $raw = array_map('trim', explode(',', $raw));
        }
    }

    if (!is_array($raw)) {
        return [];
    }

    $items = [];
    foreach ($raw as $index => $item) {
        $name = is_array($item) ? ($item['amenity_name'] ?? $item['name'] ?? '') : $item;
        $icon = is_array($item) ? ($item['amenity_icon'] ?? $item['icon'] ?? null) : null;
        $name = trim((string)$name);
        if ($name === '') {
            continue;
        }
        $items[] = [
            'amenity_name' => substr($name, 0, 80),
            'amenity_icon' => $icon !== null ? substr(trim((string)$icon), 0, 50) : null,
            'sort_order' => $index,
        ];
    }

    return $items;
}

function replace_room_amenities(int $roomId, array $amenities): void
{
    $delete = db()->prepare('DELETE FROM room_amenities WHERE room_id = :room_id');
    $delete->execute([':room_id' => $roomId]);

    if (empty($amenities)) {
        return;
    }

    $insert = db()->prepare(
        'INSERT INTO room_amenities (room_id, amenity_name, amenity_icon, sort_order)
         VALUES (:room_id, :amenity_name, :amenity_icon, :sort_order)'
    );

    foreach ($amenities as $item) {
        $insert->execute([
            ':room_id' => $roomId,
            ':amenity_name' => $item['amenity_name'],
            ':amenity_icon' => $item['amenity_icon'],
            ':sort_order' => (int)$item['sort_order'],
        ]);
    }
}

function fetch_room_amenities(int $roomId, string $fallbackAmenities): array
{
    $query = db()->prepare(
        'SELECT amenity_name, amenity_icon, sort_order
         FROM room_amenities
         WHERE room_id = :room_id
         ORDER BY sort_order ASC, room_amenity_id ASC'
    );
    $query->execute([':room_id' => $roomId]);
    $rows = $query->fetchAll();

    if (!empty($rows)) {
        return array_map(static function (array $row): array {
            return [
                'amenity_name' => $row['amenity_name'],
                'amenity_icon' => $row['amenity_icon'],
                'sort_order' => (int)$row['sort_order'],
            ];
        }, $rows);
    }

    if (trim($fallbackAmenities) === '') {
        return [];
    }

    $items = [];
    foreach (array_map('trim', explode(',', $fallbackAmenities)) as $index => $name) {
        if ($name !== '') {
            $items[] = [
                'amenity_name' => $name,
                'amenity_icon' => null,
                'sort_order' => $index,
            ];
        }
    }

    return $items;
}

function count_room_approved_tenants(int $roomId): int
{
    $query = db()->prepare(
        "SELECT COUNT(*)
         FROM reservations
         WHERE room_id = :room_id
           AND status = 'approved'"
    );
    $query->execute([':room_id' => $roomId]);

    return (int)$query->fetchColumn();
}

function find_room_occupants(int $roomId): array
{
    $query = db()->prepare(
        "SELECT u.user_id, u.full_name, u.email, u.contact_number, rv.move_in_date, rv.reservation_id
         FROM reservations rv
         INNER JOIN users u ON u.user_id = rv.user_id
         WHERE rv.room_id = :room_id
           AND rv.status = 'approved'
         ORDER BY rv.reservation_id DESC"
    );
    $query->execute([':room_id' => $roomId]);
    $rows = $query->fetchAll();

    return array_map(static fn(array $row): array => [
        'user_id' => (int)$row['user_id'],
        'full_name' => $row['full_name'],
        'email' => $row['email'],
        'contact_number' => $row['contact_number'],
        'move_in_date' => $row['move_in_date'],
        'reservation_id' => (int)$row['reservation_id'],
    ], $rows);
}

function store_room_photo_uploads(int $roomId, int $maxFiles): array
{
    if ($maxFiles <= 0 || !isset($_FILES['photos']) || !is_array($_FILES['photos'])) {
        return [];
    }

    $files = normalize_multi_upload($_FILES['photos']);
    if (count($files) > $maxFiles) {
        json_response(false, 'Validation failed.', new stdClass(), ["A room can only have up to {$maxFiles} more photo(s)."], 400);
    }

    $paths = [];
    foreach ($files as $index => $file) {
        if ((int)($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        $paths[] = store_uploaded_file(
            $file,
            'storage/public/rooms/' . $roomId,
            [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
            ],
            2 * 1024 * 1024,
            'photo_' . ($index + 1)
        );
    }

    return $paths;
}

function normalize_multi_upload(array $input): array
{
    if (!is_array($input['name'] ?? null)) {
        return [$input];
    }

    $files = [];
    foreach ($input['name'] as $index => $name) {
        $files[] = [
            'name' => $name,
            'type' => $input['type'][$index] ?? '',
            'tmp_name' => $input['tmp_name'][$index] ?? '',
            'error' => $input['error'][$index] ?? UPLOAD_ERR_NO_FILE,
            'size' => $input['size'][$index] ?? 0,
        ];
    }

    return $files;
}
