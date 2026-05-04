<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
$method = request_method();

try {
    $actor = require_auth();

    if ($method === 'GET') {
        handle_rooms_get($actor);
    }

    if ($method === 'POST') {
        handle_rooms_create($actor, request_payload());
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        handle_rooms_update($actor, request_payload());
    }

    if ($method === 'DELETE') {
        handle_rooms_delete($actor);
    }
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Rooms request failed', $user ? (int)$user['user_id'] : null);
}

function handle_rooms_get(array $actor): void
{
    $roomId = parse_positive_int($_GET['room_id'] ?? null);

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

        if ($actor['role'] === 'owner' && (int)$room['owner_id'] !== (int)$actor['user_id']) {
            json_response(false, 'Forbidden.', new stdClass(), ['You can only access rooms under your boarding house.'], 403);
        }

        json_response(true, 'Room fetched successfully.', $room, []);
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
        $conditions[] = 'r.availability_status = :availability_status';
        $params[':availability_status'] = $availability;
    }

    if ($actor['role'] === 'owner') {
        $conditions[] = 'b.owner_id = :owner_id';
        $params[':owner_id'] = (int)$actor['user_id'];
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

    json_response(true, 'Rooms fetched successfully.', $rooms, []);
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
    $monthlyRate = $payload['monthly_rate'] ?? null;
    $amenities = trim((string)($payload['amenities'] ?? ''));
    $availabilityStatus = strtolower(trim((string)($payload['availability_status'] ?? 'available')));

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
    if ($capacity === null) {
        $errors[] = 'capacity must be a positive integer.';
    }
    if (!is_numeric((string)$monthlyRate) || (float)$monthlyRate < 0) {
        $errors[] = 'monthly_rate must be a valid non-negative number.';
    }
    if (!in_array($availabilityStatus, ['available', 'unavailable', 'occupied'], true)) {
        $errors[] = 'availability_status must be available, unavailable, or occupied.';
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

    $insert = db()->prepare(
        'INSERT INTO rooms (boarding_house_id, room_number, room_type, capacity, monthly_rate, amenities, availability_status)
         VALUES (:boarding_house_id, :room_number, :room_type, :capacity, :monthly_rate, :amenities, :availability_status)'
    );
    $insert->execute([
        ':boarding_house_id' => $boardingHouseId,
        ':room_number' => $roomNumber,
        ':room_type' => $roomType,
        ':capacity' => $capacity,
        ':monthly_rate' => (float)$monthlyRate,
        ':amenities' => $amenities,
        ':availability_status' => $availabilityStatus,
    ]);

    $newId = (int)db()->lastInsertId();
    log_activity((int)$actor['user_id'], "Created room #{$newId}", 'rooms');

    $fetch = db()->prepare('SELECT * FROM rooms WHERE room_id = :id LIMIT 1');
    $fetch->execute([':id' => $newId]);
    $room = $fetch->fetch();

    json_response(true, 'Room created successfully.', $room ?: ['room_id' => $newId], [], 201);
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
        $updates[] = 'room_type = :room_type';
        $params[':room_type'] = trim((string)$payload['room_type']);
    }
    if (array_key_exists('capacity', $payload)) {
        $capacity = parse_positive_int($payload['capacity']);
        if ($capacity === null) {
            json_response(false, 'Validation failed.', new stdClass(), ['capacity must be a positive integer.'], 400);
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
        $updates[] = 'amenities = :amenities';
        $params[':amenities'] = trim((string)$payload['amenities']);
    }
    if (array_key_exists('availability_status', $payload)) {
        $availabilityStatus = strtolower(trim((string)$payload['availability_status']));
        if (!in_array($availabilityStatus, ['available', 'unavailable', 'occupied'], true)) {
            json_response(false, 'Validation failed.', new stdClass(), ['availability_status must be available, unavailable, or occupied.'], 400);
        }
        $updates[] = 'availability_status = :availability_status';
        $params[':availability_status'] = $availabilityStatus;
    }

    if (empty($updates)) {
        json_response(false, 'Validation failed.', new stdClass(), ['No updatable fields provided.'], 400);
    }

    $sql = 'UPDATE rooms SET ' . implode(', ', $updates) . ' WHERE room_id = :room_id';
    $update = db()->prepare($sql);
    $update->execute($params);

    log_activity((int)$actor['user_id'], "Updated room #{$roomId}", 'rooms');

    $fetch = db()->prepare('SELECT * FROM rooms WHERE room_id = :room_id LIMIT 1');
    $fetch->execute([':room_id' => $roomId]);
    $room = $fetch->fetch();

    json_response(true, 'Room updated successfully.', $room ?: new stdClass(), []);
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
        'SELECT r.room_id, b.owner_id
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

    $delete = db()->prepare('DELETE FROM rooms WHERE room_id = :room_id');
    $delete->execute([':room_id' => $roomId]);

    log_activity((int)$actor['user_id'], "Deleted room #{$roomId}", 'rooms');
    json_response(true, 'Room deleted successfully.', new stdClass(), []);
}
