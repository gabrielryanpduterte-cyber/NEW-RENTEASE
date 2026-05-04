<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

require_methods(['GET', 'POST', 'PATCH', 'DELETE']);
$method = request_method();

try {
    $actor = require_auth();
    ensure_parent_seeker_links_table_exists();

    if ($method === 'GET') {
        handle_account_links_get($actor);
    }

    if ($method === 'POST') {
        handle_account_links_create($actor, request_payload());
    }

    if ($method === 'PATCH') {
        handle_account_links_update($actor, request_payload());
    }

    if ($method === 'DELETE') {
        handle_account_links_delete($actor);
    }
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Account links request failed', $user ? (int)$user['user_id'] : null);
}

function ensure_parent_seeker_links_table_exists(): void
{
    db()->exec(
        'CREATE TABLE IF NOT EXISTS parent_seeker_links (
            link_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            parent_user_id INT(10) UNSIGNED NOT NULL,
            seeker_user_id INT(10) UNSIGNED NOT NULL,
            requested_by ENUM(\'parent\', \'seeker\') NOT NULL,
            status ENUM(\'pending\', \'approved\', \'rejected\', \'cancelled\') NOT NULL DEFAULT \'pending\',
            notes VARCHAR(255) NULL,
            requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            decided_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_psl_parent_user
                FOREIGN KEY (parent_user_id)
                REFERENCES users (user_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            CONSTRAINT fk_psl_seeker_user
                FOREIGN KEY (seeker_user_id)
                REFERENCES users (user_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            CONSTRAINT uq_psl_pair UNIQUE KEY (parent_user_id, seeker_user_id),
            INDEX idx_psl_parent_status (parent_user_id, status),
            INDEX idx_psl_seeker_status (seeker_user_id, status),
            INDEX idx_psl_status_requested (status, requested_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

function account_links_base_select(): string
{
    return 'SELECT
                l.*,
                p.full_name AS parent_name,
                p.email AS parent_email,
                s.full_name AS seeker_name,
                s.email AS seeker_email
            FROM parent_seeker_links l
            INNER JOIN users p ON p.user_id = l.parent_user_id
            INNER JOIN users s ON s.user_id = l.seeker_user_id';
}

function normalize_account_link(array $row): array
{
    return [
        'link_id' => isset($row['link_id']) ? (int)$row['link_id'] : null,
        'parent_user_id' => isset($row['parent_user_id']) ? (int)$row['parent_user_id'] : null,
        'parent_name' => $row['parent_name'] ?? null,
        'parent_email' => $row['parent_email'] ?? null,
        'seeker_user_id' => isset($row['seeker_user_id']) ? (int)$row['seeker_user_id'] : null,
        'seeker_name' => $row['seeker_name'] ?? null,
        'seeker_email' => $row['seeker_email'] ?? null,
        'requested_by' => $row['requested_by'] ?? null,
        'status' => $row['status'] ?? null,
        'notes' => $row['notes'] ?? null,
        'requested_at' => $row['requested_at'] ?? null,
        'decided_at' => $row['decided_at'] ?? null,
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

function find_account_link_by_id(int $linkId): ?array
{
    $query = db()->prepare(account_links_base_select() . ' WHERE l.link_id = :link_id LIMIT 1');
    $query->execute([':link_id' => $linkId]);
    $row = $query->fetch();

    return $row ?: null;
}

function actor_can_access_account_link(array $actor, array $link): bool
{
    if ($actor['role'] === 'admin') {
        return true;
    }
    if ($actor['role'] === 'parent') {
        return (int)$link['parent_user_id'] === (int)$actor['user_id'];
    }
    if ($actor['role'] === 'seeker') {
        return (int)$link['seeker_user_id'] === (int)$actor['user_id'];
    }

    return false;
}

function find_active_user_by_email(string $email): ?array
{
    $query = db()->prepare(
        'SELECT *
         FROM users
         WHERE email = :email
           AND account_status = :account_status
         LIMIT 1'
    );
    $query->execute([
        ':email' => $email,
        ':account_status' => 'active',
    ]);
    $row = $query->fetch();

    return $row ?: null;
}

function handle_account_links_get(array $actor): void
{
    if (!in_array($actor['role'], ['admin', 'parent', 'seeker'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only admin, parent, or seeker can access account links.'], 403);
    }

    $linkId = parse_positive_int($_GET['link_id'] ?? null);
    if ($linkId !== null) {
        $link = find_account_link_by_id($linkId);
        if ($link === null) {
            json_response(false, 'Account link not found.', new stdClass(), [], 404);
        }
        if (!actor_can_access_account_link($actor, $link)) {
            json_response(false, 'Forbidden.', new stdClass(), ['You are not allowed to access this account link.'], 403);
        }

        json_response(true, 'Account link fetched successfully.', normalize_account_link($link), []);
    }

    $conditions = [];
    $params = [];

    if ($actor['role'] === 'parent') {
        $conditions[] = 'l.parent_user_id = :parent_user_id';
        $params[':parent_user_id'] = (int)$actor['user_id'];
    } elseif ($actor['role'] === 'seeker') {
        $conditions[] = 'l.seeker_user_id = :seeker_user_id';
        $params[':seeker_user_id'] = (int)$actor['user_id'];
    }

    if ($actor['role'] === 'admin') {
        $filterParentUserId = parse_positive_int($_GET['parent_user_id'] ?? null);
        if ($filterParentUserId !== null) {
            $conditions[] = 'l.parent_user_id = :filter_parent_user_id';
            $params[':filter_parent_user_id'] = $filterParentUserId;
        }

        $filterSeekerUserId = parse_positive_int($_GET['seeker_user_id'] ?? null);
        if ($filterSeekerUserId !== null) {
            $conditions[] = 'l.seeker_user_id = :filter_seeker_user_id';
            $params[':filter_seeker_user_id'] = $filterSeekerUserId;
        }
    }

    $status = strtolower(trim((string)($_GET['status'] ?? '')));
    if ($status !== '') {
        if (!in_array($status, ['pending', 'approved', 'rejected', 'cancelled'], true)) {
            json_response(false, 'Validation failed.', new stdClass(), ['status must be pending, approved, rejected, or cancelled.'], 400);
        }

        $conditions[] = 'l.status = :status';
        $params[':status'] = $status;
    }

    $sql = account_links_base_select();
    if (!empty($conditions)) {
        $sql .= ' WHERE ' . implode(' AND ', $conditions);
    }
    $sql .= ' ORDER BY l.updated_at DESC, l.link_id DESC';

    $query = db()->prepare($sql);
    $query->execute($params);
    $rows = $query->fetchAll();

    $items = array_map('normalize_account_link', $rows);
    json_response(true, 'Account links fetched successfully.', $items, []);
}

function handle_account_links_create(array $actor, array $payload): void
{
    if (!in_array($actor['role'], ['parent', 'seeker'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only parent or seeker can create account link requests.'], 403);
    }

    require_fields($payload, ['target_email']);

    $targetEmail = strtolower(trim((string)$payload['target_email']));
    if (!filter_var($targetEmail, FILTER_VALIDATE_EMAIL)) {
        json_response(false, 'Validation failed.', new stdClass(), ['target_email must be a valid email address.'], 400);
    }

    $notes = trim((string)($payload['notes'] ?? ''));
    if ($notes !== '' && strlen($notes) > 255) {
        json_response(false, 'Validation failed.', new stdClass(), ['notes cannot exceed 255 characters.'], 400);
    }

    $target = find_active_user_by_email($targetEmail);
    if ($target === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['target_email does not match an active account.'], 400);
    }

    $actorId = (int)$actor['user_id'];
    $targetId = (int)$target['user_id'];
    if ($actorId === $targetId) {
        json_response(false, 'Validation failed.', new stdClass(), ['You cannot create a link request to your own account.'], 400);
    }

    $parentUserId = 0;
    $seekerUserId = 0;

    if ($actor['role'] === 'parent') {
        if (($target['role'] ?? '') !== 'seeker') {
            json_response(false, 'Validation failed.', new stdClass(), ['Parent can only request linking to a seeker account.'], 400);
        }
        $parentUserId = $actorId;
        $seekerUserId = $targetId;
    } else {
        if (($target['role'] ?? '') !== 'parent') {
            json_response(false, 'Validation failed.', new stdClass(), ['Seeker can only request linking to a parent account.'], 400);
        }
        $parentUserId = $targetId;
        $seekerUserId = $actorId;
    }

    $existingQuery = db()->prepare(
        'SELECT link_id, status
         FROM parent_seeker_links
         WHERE parent_user_id = :parent_user_id
           AND seeker_user_id = :seeker_user_id
         LIMIT 1'
    );
    $existingQuery->execute([
        ':parent_user_id' => $parentUserId,
        ':seeker_user_id' => $seekerUserId,
    ]);
    $existing = $existingQuery->fetch();

    if ($existing) {
        $existingStatus = strtolower((string)$existing['status']);
        if ($existingStatus === 'approved') {
            json_response(false, 'Validation failed.', new stdClass(), ['This parent and seeker are already linked.'], 400);
        }
        if ($existingStatus === 'pending') {
            json_response(false, 'Validation failed.', new stdClass(), ['A pending link request already exists for this parent-seeker pair.'], 400);
        }

        $update = db()->prepare(
            'UPDATE parent_seeker_links
             SET requested_by = :requested_by,
                 status = :status,
                 notes = :notes,
                 requested_at = NOW(),
                 decided_at = NULL
             WHERE link_id = :link_id'
        );
        $update->execute([
            ':requested_by' => $actor['role'],
            ':status' => 'pending',
            ':notes' => $notes !== '' ? $notes : null,
            ':link_id' => (int)$existing['link_id'],
        ]);

        $linkId = (int)$existing['link_id'];
        log_activity($actorId, "Re-opened account link request #{$linkId}", 'account_links');

        $link = find_account_link_by_id($linkId);
        json_response(true, 'Account link request submitted successfully.', $link ? normalize_account_link($link) : ['link_id' => $linkId], []);
    }

    $insert = db()->prepare(
        'INSERT INTO parent_seeker_links (
            parent_user_id, seeker_user_id, requested_by, status, notes, requested_at
        ) VALUES (
            :parent_user_id, :seeker_user_id, :requested_by, :status, :notes, NOW()
        )'
    );
    $insert->execute([
        ':parent_user_id' => $parentUserId,
        ':seeker_user_id' => $seekerUserId,
        ':requested_by' => $actor['role'],
        ':status' => 'pending',
        ':notes' => $notes !== '' ? $notes : null,
    ]);

    $linkId = (int)db()->lastInsertId();
    log_activity($actorId, "Created account link request #{$linkId}", 'account_links');

    $link = find_account_link_by_id($linkId);
    json_response(true, 'Account link request created successfully.', $link ? normalize_account_link($link) : ['link_id' => $linkId], [], 201);
}

function handle_account_links_update(array $actor, array $payload): void
{
    if (!in_array($actor['role'], ['admin', 'parent', 'seeker'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only admin, parent, or seeker can update account links.'], 403);
    }

    $linkId = parse_positive_int($_GET['link_id'] ?? ($payload['link_id'] ?? null));
    if ($linkId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['link_id is required.'], 400);
    }

    $status = strtolower(trim((string)($payload['status'] ?? '')));
    if (!in_array($status, ['approved', 'rejected', 'cancelled'], true)) {
        json_response(false, 'Validation failed.', new stdClass(), ['status must be approved, rejected, or cancelled.'], 400);
    }

    $link = find_account_link_by_id($linkId);
    if ($link === null) {
        json_response(false, 'Account link not found.', new stdClass(), [], 404);
    }
    if (!actor_can_access_account_link($actor, $link)) {
        json_response(false, 'Forbidden.', new stdClass(), ['You are not allowed to update this account link.'], 403);
    }

    $currentStatus = strtolower((string)$link['status']);
    if ($actor['role'] !== 'admin') {
        if ($currentStatus !== 'pending') {
            json_response(false, 'Validation failed.', new stdClass(), ['Only pending link requests can be updated.'], 400);
        }

        $requestedBy = strtolower((string)$link['requested_by']);
        $actorRole = (string)$actor['role'];

        if (in_array($status, ['approved', 'rejected'], true)) {
            if ($requestedBy === $actorRole) {
                json_response(false, 'Forbidden.', new stdClass(), ['Requester cannot approve or reject their own link request.'], 403);
            }
        }

        if ($status === 'cancelled' && $requestedBy !== $actorRole) {
            json_response(false, 'Forbidden.', new stdClass(), ['Only the requester can cancel a pending link request.'], 403);
        }
    }

    $notes = array_key_exists('notes', $payload) ? trim((string)$payload['notes']) : null;
    if ($notes !== null && $notes !== '' && strlen($notes) > 255) {
        json_response(false, 'Validation failed.', new stdClass(), ['notes cannot exceed 255 characters.'], 400);
    }

    $decidedAt = $status === 'approved' || $status === 'rejected' || $status === 'cancelled'
        ? 'NOW()'
        : 'NULL';

    $sql = 'UPDATE parent_seeker_links
            SET status = :status,
                decided_at = ' . $decidedAt;
    if ($notes !== null) {
        $sql .= ', notes = :notes';
    }
    $sql .= ' WHERE link_id = :link_id';

    $query = db()->prepare($sql);
    $query->bindValue(':status', $status);
    $query->bindValue(':link_id', $linkId, PDO::PARAM_INT);
    if ($notes !== null) {
        $query->bindValue(':notes', $notes !== '' ? $notes : null);
    }
    $query->execute();

    log_activity((int)$actor['user_id'], "Updated account link #{$linkId} status to {$status}", 'account_links');

    $updated = find_account_link_by_id($linkId);
    json_response(true, 'Account link updated successfully.', $updated ? normalize_account_link($updated) : ['link_id' => $linkId], []);
}

function handle_account_links_delete(array $actor): void
{
    if (!in_array($actor['role'], ['admin', 'parent', 'seeker'], true)) {
        json_response(false, 'Forbidden.', new stdClass(), ['Only admin, parent, or seeker can delete account links.'], 403);
    }

    $linkId = parse_positive_int($_GET['link_id'] ?? null);
    if ($linkId === null) {
        json_response(false, 'Validation failed.', new stdClass(), ['link_id is required.'], 400);
    }

    $link = find_account_link_by_id($linkId);
    if ($link === null) {
        json_response(false, 'Account link not found.', new stdClass(), [], 404);
    }
    if (!actor_can_access_account_link($actor, $link)) {
        json_response(false, 'Forbidden.', new stdClass(), ['You are not allowed to delete this account link.'], 403);
    }

    $delete = db()->prepare('DELETE FROM parent_seeker_links WHERE link_id = :link_id');
    $delete->execute([':link_id' => $linkId]);

    log_activity((int)$actor['user_id'], "Deleted account link #{$linkId}", 'account_links');
    json_response(true, 'Account link deleted successfully.', new stdClass(), []);
}
