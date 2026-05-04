-- Phase 10 parent-seeker account linking schema

CREATE TABLE IF NOT EXISTS parent_seeker_links (
    link_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_user_id INT(10) UNSIGNED NOT NULL,
    seeker_user_id INT(10) UNSIGNED NOT NULL,
    requested_by ENUM('parent', 'seeker') NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Keep seeded demo parent/seeker connected for legacy smoke checks and walkthroughs.
INSERT INTO parent_seeker_links (
    parent_user_id,
    seeker_user_id,
    requested_by,
    status,
    notes,
    requested_at,
    decided_at,
    created_at,
    updated_at
)
SELECT
    p.user_id,
    s.user_id,
    'parent',
    'approved',
    'Seeded demo parent-seeker link',
    NOW(),
    NOW(),
    NOW(),
    NOW()
FROM users p
INNER JOIN users s ON s.role = 'seeker'
WHERE p.email = 'parent@rentease.local'
  AND s.email = 'seeker@rentease.local'
  AND NOT EXISTS (
      SELECT 1
      FROM parent_seeker_links x
      WHERE x.parent_user_id = p.user_id
        AND x.seeker_user_id = s.user_id
  );
