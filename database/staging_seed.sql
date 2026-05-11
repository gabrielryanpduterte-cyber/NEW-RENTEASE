-- RentEase staging data seed for the current custom PHP backend.
-- Run after the base core schema has been applied.

SET time_zone = '+08:00';
SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS add_column_if_missing;

DELIMITER //
CREATE PROCEDURE add_column_if_missing(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_column_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table_name
          AND COLUMN_NAME = p_column_name
    ) THEN
        SET @ddl = CONCAT(
            'ALTER TABLE `',
            REPLACE(p_table_name, '`', '``'),
            '` ADD COLUMN `',
            REPLACE(p_column_name, '`', '``'),
            '` ',
            p_column_definition
        );
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//
DELIMITER ;

CALL add_column_if_missing('users', 'profile_photo', 'VARCHAR(255) NULL');
CALL add_column_if_missing('users', 'emergency_contact_name', 'VARCHAR(100) NULL');
CALL add_column_if_missing('users', 'emergency_contact_number', 'VARCHAR(20) NULL');
CALL add_column_if_missing('users', 'school_or_workplace', 'VARCHAR(150) NULL');
CALL add_column_if_missing('users', 'last_login_at', 'DATETIME NULL');
CALL add_column_if_missing('users', 'email_verified', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_missing('users', 'google_id', 'VARCHAR(255) NULL');
CALL add_column_if_missing('users', 'profile_picture', 'TEXT NULL');
CALL add_column_if_missing('users', 'auth_provider', 'VARCHAR(20) NOT NULL DEFAULT ''local''');

CALL add_column_if_missing('boarding_house', 'property_type', 'VARCHAR(30) NOT NULL DEFAULT ''boarding_house''');
CALL add_column_if_missing('boarding_house', 'cover_photo', 'VARCHAR(255) NULL');
CALL add_column_if_missing('boarding_house', 'contact_number', 'VARCHAR(20) NULL');
CALL add_column_if_missing('boarding_house', 'facebook_page', 'VARCHAR(255) NULL');
CALL add_column_if_missing('boarding_house', 'amenities_list', 'JSON NULL');
CALL add_column_if_missing('boarding_house', 'created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');

CALL add_column_if_missing('rooms', 'photos', 'JSON NULL');
CALL add_column_if_missing('rooms', 'floor_number', 'TINYINT NULL');
CALL add_column_if_missing('rooms', 'is_archived', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_missing('rooms', 'notes', 'TEXT NULL');

CALL add_column_if_missing('reservations', 'valid_id_path', 'VARCHAR(255) NULL');
CALL add_column_if_missing('reservations', 'cancellation_reason', 'TEXT NULL');
CALL add_column_if_missing('reservations', 'cancelled_at', 'DATETIME NULL');
CALL add_column_if_missing('reservations', 'rejection_remarks', 'TEXT NULL');

CALL add_column_if_missing('payments', 'proof_of_payment_path', 'VARCHAR(255) NULL');
CALL add_column_if_missing('payments', 'notes', 'TEXT NULL');
CALL add_column_if_missing('payments', 'billing_cycle_id', 'INT(10) UNSIGNED NULL');
CALL add_column_if_missing('payments', 'payment_method', 'ENUM(''cash'',''gcash'',''bank_transfer'',''other'') NULL DEFAULT ''cash''');
CALL add_column_if_missing('payments', 'received_by', 'INT(10) UNSIGNED NULL');

CALL add_column_if_missing('activity_logs', 'notes', 'TEXT NULL');
CALL add_column_if_missing('activity_logs', 'guardian_link_id', 'INT(10) UNSIGNED NULL');

DROP PROCEDURE IF EXISTS add_column_if_missing;

CREATE TABLE IF NOT EXISTS feedback (
    feedback_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    reservation_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT NOT NULL,
    status ENUM('visible', 'hidden') NOT NULL DEFAULT 'visible',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (feedback_id),
    UNIQUE KEY uq_feedback_user_reservation (user_id, reservation_id),
    KEY idx_feedback_reservation (reservation_id),
    KEY idx_feedback_status_created (status, created_at),
    CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_feedback_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations (reservation_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT chk_feedback_rating
        CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    UNIQUE KEY uq_psl_pair (parent_user_id, seeker_user_id),
    INDEX idx_psl_parent_status (parent_user_id, status),
    INDEX idx_psl_seeker_status (seeker_user_id, status),
    INDEX idx_psl_status_requested (status, requested_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS uploads (
    upload_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT(10) UNSIGNED NOT NULL,
    reservation_id INT(10) UNSIGNED NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    visibility ENUM('private', 'owner', 'admin') NOT NULL DEFAULT 'owner',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_uploads_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_uploads_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations (reservation_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_uploads_user (user_id),
    INDEX idx_uploads_reservation (reservation_id),
    INDEX idx_uploads_visibility (visibility)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_amenities (
    room_amenity_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_id INT(10) UNSIGNED NOT NULL,
    amenity_name VARCHAR(80) NOT NULL,
    amenity_icon VARCHAR(50) NULL,
    sort_order TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_room_amenities_room
        FOREIGN KEY (room_id)
        REFERENCES rooms (room_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_room_amenities_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_cycles (
    billing_cycle_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT(10) UNSIGNED NOT NULL,
    user_id INT(10) UNSIGNED NOT NULL,
    room_id INT(10) UNSIGNED NOT NULL,
    billing_month CHAR(7) NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    due_date DATE NULL,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT(10) UNSIGNED NOT NULL,
    CONSTRAINT fk_billing_cycles_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations (reservation_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_billing_cycles_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_billing_cycles_room
        FOREIGN KEY (room_id)
        REFERENCES rooms (room_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_billing_cycles_created_by
        FOREIGN KEY (created_by)
        REFERENCES users (user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    UNIQUE KEY uq_billing_cycles_reservation_month (reservation_id, billing_month),
    INDEX idx_billing_cycles_month (billing_month),
    INDEX idx_billing_cycles_user (user_id),
    INDEX idx_billing_cycles_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guardian_links (
    guardian_link_id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_user_id INT(10) UNSIGNED NOT NULL,
    guardian_name VARCHAR(100) NOT NULL,
    guardian_email VARCHAR(150) NOT NULL,
    access_token CHAR(36) NOT NULL,
    status ENUM('pending', 'active', 'revoked') NOT NULL DEFAULT 'active',
    last_accessed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_guardian_links_tenant
        FOREIGN KEY (tenant_user_id)
        REFERENCES users (user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    UNIQUE KEY uq_guardian_links_access_token (access_token),
    INDEX idx_guardian_links_tenant (tenant_user_id),
    INDEX idx_guardian_links_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE room_amenities;
TRUNCATE TABLE guardian_links;
TRUNCATE TABLE parent_seeker_links;
TRUNCATE TABLE uploads;
TRUNCATE TABLE feedback;
TRUNCATE TABLE error_logs;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE payments;
TRUNCATE TABLE billing_cycles;
TRUNCATE TABLE reservations;
TRUNCATE TABLE rooms;
TRUNCATE TABLE boarding_house;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE rooms
    MODIFY availability_status ENUM('available','unavailable','occupied','archived') NOT NULL DEFAULT 'available';

ALTER TABLE reservations
    MODIFY status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending';

ALTER TABLE payments
    MODIFY payment_status ENUM('paid','unpaid','pending_verification') NOT NULL DEFAULT 'unpaid';

INSERT INTO users (
    user_id,
    full_name,
    email,
    password_hash,
    role,
    contact_number,
    account_status,
    email_verified,
    auth_provider,
    emergency_contact_name,
    emergency_contact_number,
    school_or_workplace,
    last_login_at,
    created_at
) VALUES
(1, 'System Admin', 'admin@rentease.test', '$2y$12$XubIUuxrNwAM7uzeJjabTuCf2ehK5o.baXJ0iiOsvihJUGj/RDYaq', 'admin', '09170000001', 'active', 1, 'local', 'Parent Name', '09171234567', 'Jose Rizal Memorial State University', NULL, NOW()),
(2, 'Maria Santos', 'landlord@rentease.test', '$2y$12$TggeBTEnYJFHp8Nhp/9quev1s/smZcQax4cYjWRZNAbWE2MQYTB0S', 'owner', '09181234567', 'active', 1, 'local', 'Parent Name', '09171234567', 'Jose Rizal Memorial State University', NULL, NOW()),
(3, 'Juan dela Cruz', 'seeker1@rentease.test', '$2y$12$kLwttJYfs4S4y8gso5h.9eJY9k0sceNMv9ym01W6NZ5QlGfkNdEBq', 'seeker', '09170000003', 'active', 1, 'local', 'Parent Name', '09171234567', 'Jose Rizal Memorial State University', NULL, NOW()),
(4, 'Ana Reyes', 'seeker2@rentease.test', '$2y$12$kLwttJYfs4S4y8gso5h.9eJY9k0sceNMv9ym01W6NZ5QlGfkNdEBq', 'seeker', '09170000004', 'active', 1, 'local', 'Parent Name', '09171234567', 'Jose Rizal Memorial State University', NULL, NOW()),
(5, 'Paolo Applicant', 'pending.seeker@rentease.test', '$2y$12$kLwttJYfs4S4y8gso5h.9eJY9k0sceNMv9ym01W6NZ5QlGfkNdEBq', 'seeker', '09170000005', 'active', 1, 'local', 'Parent Name', '09171234567', 'Jose Rizal Memorial State University', NULL, NOW()),
(6, 'Rosa Applicant', 'rejected.seeker@rentease.test', '$2y$12$kLwttJYfs4S4y8gso5h.9eJY9k0sceNMv9ym01W6NZ5QlGfkNdEBq', 'seeker', '09170000006', 'active', 1, 'local', 'Parent Name', '09171234567', 'Jose Rizal Memorial State University', NULL, NOW());

INSERT INTO boarding_house (
    boarding_house_id,
    owner_id,
    house_name,
    address,
    description,
    house_rules,
    contact_number,
    amenities_list,
    created_at
) VALUES (
    1,
    2,
    'Santos Boarding House',
    'Purok 4, Dipolog City, Zamboanga del Norte',
    'Clean and affordable rooms near JRMSU.',
    '1. No visitors after 10PM\n2. No smoking inside rooms\n3. Quiet hours 10PM-6AM\n4. Keep common areas clean\n5. Rent due every 5th of the month',
    '09181234567',
    JSON_ARRAY('WiFi', 'Water', 'Electric', 'CR inside'),
    NOW()
);

INSERT INTO rooms (
    room_id,
    boarding_house_id,
    room_number,
    room_type,
    capacity,
    monthly_rate,
    amenities,
    availability_status,
    photos,
    floor_number,
    is_archived,
    notes
) VALUES
(1, 1, '101', 'single', 1, 2500.00, 'WiFi, Water, Electric', 'available', NULL, 1, 0, NULL),
(2, 1, '102', 'single', 1, 2500.00, 'WiFi, Water, CR inside', 'occupied', NULL, 1, 0, NULL),
(3, 1, '201', 'double', 2, 4000.00, 'WiFi, Electric, CR inside', 'available', NULL, 2, 0, NULL),
(4, 1, '202', 'double', 2, 4000.00, 'WiFi, Water, Electric', 'occupied', NULL, 2, 0, NULL),
(5, 1, '301', 'shared', 4, 1500.00, 'WiFi, Water, Electric', 'available', NULL, 3, 0, NULL),
(6, 1, '302', 'single', 1, 3000.00, 'WiFi, Water, Electric', 'archived', NULL, 3, 1, 'Archived staging room.');

INSERT INTO room_amenities (room_id, amenity_name, amenity_icon, sort_order) VALUES
(1, 'WiFi', 'wifi', 1), (1, 'Water', 'droplets', 2), (1, 'Electric', 'plug', 3),
(2, 'WiFi', 'wifi', 1), (2, 'Water', 'droplets', 2), (2, 'CR inside', 'bath', 3),
(3, 'WiFi', 'wifi', 1), (3, 'Electric', 'plug', 2), (3, 'CR inside', 'bath', 3),
(4, 'WiFi', 'wifi', 1), (4, 'Water', 'droplets', 2), (4, 'Electric', 'plug', 3),
(5, 'WiFi', 'wifi', 1), (5, 'Water', 'droplets', 2), (5, 'Electric', 'plug', 3),
(6, 'WiFi', 'wifi', 1), (6, 'Water', 'droplets', 2), (6, 'Electric', 'plug', 3);

INSERT INTO reservations (
    reservation_id,
    user_id,
    room_id,
    date_submitted,
    move_in_date,
    status,
    remarks,
    cancellation_reason,
    cancelled_at,
    rejection_remarks
) VALUES
(1, 3, 2, DATE_SUB(NOW(), INTERVAL 3 MONTH), DATE_SUB(CURDATE(), INTERVAL 3 MONTH), 'approved', 'Approved staging tenant.', NULL, NULL, NULL),
(2, 4, 4, DATE_SUB(NOW(), INTERVAL 2 MONTH), DATE_SUB(CURDATE(), INTERVAL 2 MONTH), 'approved', 'Approved staging tenant.', NULL, NULL, NULL),
(3, 5, 1, NOW(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'pending', 'Waiting for landlord review.', NULL, NULL, NULL),
(4, 6, 5, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'rejected', 'Applicant requested this room.', NULL, NULL, 'Room already reserved.'),
(5, 3, 5, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'cancelled', 'Old cancelled request.', 'Found another room.', DATE_SUB(NOW(), INTERVAL 15 DAY), NULL);

INSERT INTO billing_cycles (
    billing_cycle_id,
    reservation_id,
    user_id,
    room_id,
    billing_month,
    amount_due,
    due_date,
    created_by
) VALUES
(1, 1, 3, 2, DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m'), 2500.00, STR_TO_DATE(CONCAT(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m'), '-05'), '%Y-%m-%d'), 2),
(2, 1, 3, 2, DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m'), 2500.00, STR_TO_DATE(CONCAT(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m'), '-05'), '%Y-%m-%d'), 2),
(3, 1, 3, 2, DATE_FORMAT(CURDATE(), '%Y-%m'), 2500.00, STR_TO_DATE(CONCAT(DATE_FORMAT(CURDATE(), '%Y-%m'), '-05'), '%Y-%m-%d'), 2),
(4, 2, 4, 4, DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m'), 4000.00, STR_TO_DATE(CONCAT(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m'), '-05'), '%Y-%m-%d'), 2),
(5, 2, 4, 4, DATE_FORMAT(CURDATE(), '%Y-%m'), 4000.00, STR_TO_DATE(CONCAT(DATE_FORMAT(CURDATE(), '%Y-%m'), '-05'), '%Y-%m-%d'), 2);

INSERT INTO payments (
    payment_id,
    reservation_id,
    user_id,
    room_id,
    amount_due,
    amount_paid,
    payment_status,
    payment_date,
    billing_period,
    recorded_by,
    billing_cycle_id,
    payment_method,
    received_by,
    notes
) VALUES
(1, 1, 3, 2, 2500.00, 2500.00, 'paid', DATE_SUB(CURDATE(), INTERVAL 3 MONTH), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m'), 2, 1, 'gcash', 2, 'Seeded paid GCash payment.'),
(2, 1, 3, 2, 2500.00, 2500.00, 'paid', DATE_SUB(CURDATE(), INTERVAL 2 MONTH), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m'), 2, 2, 'cash', 2, 'Seeded paid cash payment.'),
(3, 1, 3, 2, 2500.00, 0.00, 'unpaid', NULL, DATE_FORMAT(CURDATE(), '%Y-%m'), 2, 3, NULL, NULL, 'Current month unpaid for Seeker 1.'),
(4, 2, 4, 4, 4000.00, 4000.00, 'paid', DATE_SUB(CURDATE(), INTERVAL 2 MONTH), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m'), 2, 4, 'bank_transfer', 2, 'Seeded paid bank transfer.'),
(5, 2, 4, 4, 4000.00, 0.00, 'unpaid', NULL, DATE_FORMAT(CURDATE(), '%Y-%m'), 2, 5, NULL, NULL, 'Current month unpaid for Seeker 2.');

INSERT INTO activity_logs (log_id, user_id, action_performed, affected_module, `timestamp`, notes) VALUES
(1, 1, 'Seeded staging data', 'system', NOW(), 'Initial staging dataset.'),
(2, 2, 'Approved reservation for Juan dela Cruz', 'reservations', DATE_SUB(NOW(), INTERVAL 3 MONTH), NULL),
(3, 2, 'Approved reservation for Ana Reyes', 'reservations', DATE_SUB(NOW(), INTERVAL 2 MONTH), NULL),
(4, 3, 'Created guardian link', 'guardian_links', NOW(), NULL),
(5, 1, 'Viewed admin dashboard', 'reports', NOW(), NULL);

INSERT INTO error_logs (error_id, error_code, error_message, affected_user_id, `timestamp`) VALUES
(1, 'AUTH_LOGIN_FAILED', 'Seeded failed login for invalid-user@rentease.test', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 'PAYMENT_VALIDATION', 'Seeded payment validation example.', 3, NOW());

SET @guardian_token = UUID();

INSERT INTO guardian_links (
    guardian_link_id,
    tenant_user_id,
    guardian_name,
    guardian_email,
    access_token,
    status,
    last_accessed_at,
    created_at,
    updated_at
) VALUES (
    1,
    3,
    'Elena dela Cruz',
    'elena@example.com',
    @guardian_token,
    'active',
    NULL,
    NOW(),
    NOW()
);

ALTER TABLE users AUTO_INCREMENT = 7;
ALTER TABLE boarding_house AUTO_INCREMENT = 2;
ALTER TABLE rooms AUTO_INCREMENT = 7;
ALTER TABLE reservations AUTO_INCREMENT = 6;
ALTER TABLE payments AUTO_INCREMENT = 6;
ALTER TABLE activity_logs AUTO_INCREMENT = 6;
ALTER TABLE error_logs AUTO_INCREMENT = 3;
ALTER TABLE room_amenities AUTO_INCREMENT = 19;
ALTER TABLE billing_cycles AUTO_INCREMENT = 6;
ALTER TABLE guardian_links AUTO_INCREMENT = 2;

SELECT '=== RentEase Staging Seed Complete ===' AS message;
SELECT 'Admin' AS role_name, 'admin@rentease.test' AS email, 'Admin@1234' AS password, 'admin' AS login_role;
SELECT 'Landlord' AS role_name, 'landlord@rentease.test' AS email, 'Owner@1234' AS password, 'owner' AS login_role;
SELECT 'Seeker 1' AS role_name, 'seeker1@rentease.test' AS email, 'Seeker@1234' AS password, 'seeker' AS login_role;
SELECT 'Seeker 2' AS role_name, 'seeker2@rentease.test' AS email, 'Seeker@1234' AS password, 'seeker' AS login_role;
SELECT CONCAT('/guardian-view/', @guardian_token) AS guardian_url_path;
