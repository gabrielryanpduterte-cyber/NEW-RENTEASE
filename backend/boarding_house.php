<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
$method = request_method();

try {
    $actor = require_auth();

    if ($method === 'GET') {
        handle_boarding_house_get($actor);
    }

    if ($method === 'POST') {
        handle_boarding_house_create($actor, request_payload());
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        handle_boarding_house_update($actor, request_payload());
    }

    if ($method === 'DELETE') {
        handle_boarding_house_delete($actor);
    }
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Boarding house request failed', $user ? (int)$user['user_id'] : null);
}

function handle_boarding_house_get(array $actor): void
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

        json_response(true, 'Boarding house fetched successfully.', $item, []);
    }

    $conditions = [];
    $params = [];

    $ownerId = parse_positive_int($_GET['owner_id'] ?? null);
    if ($ownerId !== null) {
        $conditions[] = 'b.owner_id = :owner_id';
        $params[':owner_id'] = $ownerId;
    }

    if ($actor['role'] === 'owner' && $ownerId === null) {
        $conditions[] = 'b.owner_id = :actor_owner_id';
        $params[':actor_owner_id'] = (int)$actor['user_id'];
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

    json_response(true, 'Boarding houses fetched successfully.', $items, []);
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

    $insert = db()->prepare(
        'INSERT INTO boarding_house (owner_id, house_name, address, description, house_rules)
         VALUES (:owner_id, :house_name, :address, :description, :house_rules)'
    );
    $insert->execute([
        ':owner_id' => $ownerId,
        ':house_name' => $houseName,
        ':address' => $address,
        ':description' => $description,
        ':house_rules' => $houseRules,
    ]);

    $newId = (int)db()->lastInsertId();
    log_activity((int)$actor['user_id'], "Created boarding house #{$newId}", 'boarding_house');

    $fetch = db()->prepare('SELECT * FROM boarding_house WHERE boarding_house_id = :id LIMIT 1');
    $fetch->execute([':id' => $newId]);
    $row = $fetch->fetch();

    json_response(true, 'Boarding house created successfully.', $row ?: ['boarding_house_id' => $newId], [], 201);
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

    log_activity((int)$actor['user_id'], "Updated boarding house #{$boardingHouseId}", 'boarding_house');

    $fetch = db()->prepare('SELECT * FROM boarding_house WHERE boarding_house_id = :id LIMIT 1');
    $fetch->execute([':id' => $boardingHouseId]);
    $row = $fetch->fetch();

    json_response(true, 'Boarding house updated successfully.', $row ?: new stdClass(), []);
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
