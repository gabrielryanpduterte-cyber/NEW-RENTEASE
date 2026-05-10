$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"

Write-Host "Creating RENTEASE database with all tables (Port 3307)..." -ForegroundColor Cyan

$sql = @'
DROP DATABASE IF EXISTS rentease_db;
CREATE DATABASE rentease_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rentease_db;

CREATE TABLE users (
    user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('seeker', 'parent', 'owner', 'admin') NOT NULL,
    contact_number VARCHAR(30) NOT NULL,
    account_status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role_status (role, account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE boarding_house (
    boarding_house_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_id INT UNSIGNED NOT NULL,
    house_name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    description TEXT NULL,
    house_rules TEXT NULL,
    PRIMARY KEY (boarding_house_id),
    UNIQUE KEY uq_boarding_house_owner (owner_id),
    CONSTRAINT fk_boarding_house_owner FOREIGN KEY (owner_id) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rooms (
    room_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    boarding_house_id INT UNSIGNED NOT NULL,
    room_number VARCHAR(30) NOT NULL,
    room_type VARCHAR(80) NOT NULL,
    capacity INT UNSIGNED NOT NULL,
    monthly_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    amenities TEXT NULL,
    availability_status ENUM('available', 'unavailable', 'occupied') NOT NULL DEFAULT 'available',
    PRIMARY KEY (room_id),
    UNIQUE KEY uq_rooms_boarding_room_number (boarding_house_id, room_number),
    KEY idx_rooms_boarding_status (boarding_house_id, availability_status),
    CONSTRAINT fk_rooms_boarding_house FOREIGN KEY (boarding_house_id) REFERENCES boarding_house (boarding_house_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reservations (
    reservation_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    room_id INT UNSIGNED NOT NULL,
    date_submitted DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    move_in_date DATE NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
    remarks TEXT NULL,
    PRIMARY KEY (reservation_id),
    KEY idx_reservations_user_status (user_id, status),
    KEY idx_reservations_room_status (room_id, status),
    CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_reservations_room FOREIGN KEY (room_id) REFERENCES rooms (room_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
    payment_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    reservation_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    room_id INT UNSIGNED NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('paid', 'unpaid') NOT NULL DEFAULT 'unpaid',
    payment_date DATE NOT NULL,
    billing_period VARCHAR(30) NOT NULL,
    recorded_by INT UNSIGNED NOT NULL,
    PRIMARY KEY (payment_id),
    KEY idx_payments_status_date (payment_status, payment_date),
    KEY idx_payments_user (user_id),
    KEY idx_payments_room (room_id),
    KEY idx_payments_recorded_by (recorded_by),
    CONSTRAINT fk_payments_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_payments_room FOREIGN KEY (room_id) REFERENCES rooms (room_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_payments_recorded_by FOREIGN KEY (recorded_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_logs (
    log_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    action_performed VARCHAR(255) NOT NULL,
    affected_module VARCHAR(80) NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    KEY idx_activity_logs_user_ts (user_id, timestamp),
    KEY idx_activity_logs_module_ts (affected_module, timestamp),
    CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE error_logs (
    error_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    error_code VARCHAR(50) NOT NULL,
    error_message VARCHAR(1000) NOT NULL,
    affected_user_id INT UNSIGNED NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (error_id),
    KEY idx_error_logs_code_ts (error_code, timestamp),
    KEY idx_error_logs_user_ts (affected_user_id, timestamp),
    CONSTRAINT fk_error_logs_user FOREIGN KEY (affected_user_id) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE feedback (
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
    CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_feedback_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE uploads (
    upload_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    related_entity_type ENUM('reservation', 'payment', 'profile', 'other') NOT NULL,
    related_entity_id INT UNSIGNED NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (upload_id),
    KEY idx_uploads_user (user_id),
    KEY idx_uploads_entity (related_entity_type, related_entity_id),
    CONSTRAINT fk_uploads_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE parent_seeker_links (
    link_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    parent_id INT UNSIGNED NOT NULL,
    seeker_id INT UNSIGNED NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME NULL,
    PRIMARY KEY (link_id),
    UNIQUE KEY uq_parent_seeker (parent_id, seeker_id),
    KEY idx_links_seeker_status (seeker_id, status),
    CONSTRAINT fk_links_parent FOREIGN KEY (parent_id) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_links_seeker FOREIGN KEY (seeker_id) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
'@

$sql | & $mysqlPath -u root --port=3307

Write-Host "All tables created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Now importing demo data..." -ForegroundColor Cyan

& $mysqlPath -u root --port=3307 rentease_db -e @"
INSERT INTO users (user_id, full_name, email, password_hash, role, contact_number, account_status, created_at) VALUES
(1, 'System Administrator', 'admin@rentease.local', '\$2y\$12\$y7nCCZDXVoJ0Py85deHbmumVvnz1ZjKeJsRfWf/ArTp09vWdWl/E.', 'admin', '09170000001', 'active', '2026-01-10 09:00:00'),
(2, 'Olivia Ramos', 'owner@rentease.local', '\$2y\$12\$UAqLNlKBJ5m31I1DC7SiJOYx1EQGQgGCWvCvKE4O9YtKKoREjkNOG', 'owner', '09170000002', 'active', '2026-01-10 09:10:00'),
(3, 'Ethan Cruz', 'seeker@rentease.local', '\$2y\$12\$BCT/9GZyN/pFUzVzZZUNHur2y0imNoxrFxn4acCus/xNq.F4GsdBW', 'seeker', '09170000003', 'active', '2026-01-10 09:20:00'),
(4, 'Mia Fernandez', 'parent@rentease.local', '\$2y\$12\$aXX5g6cvJD6qVwaUll/gkuW9lnItiW5jwuC2d2DkvKYsLO6iiZAKW', 'parent', '09170000004', 'active', '2026-01-10 09:30:00');

INSERT INTO boarding_house (boarding_house_id, owner_id, house_name, address, description, house_rules) VALUES
(1, 2, 'Sunrise Residences', '123 Mabini St, Baguio City', 'Mixed solo and shared rooms near major schools.', 'Observe quiet hours after 10:00 PM. No smoking indoors.');

INSERT INTO rooms (room_id, boarding_house_id, room_number, room_type, capacity, monthly_rate, amenities, availability_status) VALUES
(1, 1, 'A101', 'solo', 1, 4500.00, 'Bed, study table, cabinet, wifi', 'occupied'),
(2, 1, 'A102', 'shared', 2, 3500.00, 'Bunk bed, fan, wifi', 'available'),
(3, 1, 'A103', 'solo', 1, 4000.00, 'Bed, cabinet', 'unavailable'),
(4, 1, 'B201', 'shared', 3, 3200.00, '3 beds, fan, wifi', 'occupied');

INSERT INTO reservations (reservation_id, user_id, room_id, date_submitted, move_in_date, status, remarks) VALUES
(1, 3, 1, '2026-03-01 10:00:00', '2026-03-10', 'approved', 'Ready for move-in'),
(2, 3, 2, '2026-04-05 11:20:00', '2026-05-01', 'pending', 'Waiting for owner review'),
(3, 4, 4, '2026-03-15 08:45:00', '2026-04-01', 'approved', 'Parent-assisted booking'),
(4, 4, 3, '2026-04-12 16:05:00', '2026-05-10', 'rejected', 'Room unavailable for requested date'),
(5, 3, 4, '2026-04-20 13:33:00', '2026-05-20', 'rejected', 'Capacity already reached');

INSERT INTO payments (payment_id, reservation_id, user_id, room_id, amount_due, amount_paid, payment_status, payment_date, billing_period, recorded_by) VALUES
(1, 1, 3, 1, 4500.00, 4500.00, 'paid', '2026-03-15', '2026-03', 2),
(2, 1, 3, 1, 4500.00, 2000.00, 'unpaid', '2026-04-15', '2026-04', 2),
(3, 3, 4, 4, 3200.00, 3200.00, 'paid', '2026-04-20', '2026-04', 2),
(4, 3, 4, 4, 3200.00, 0.00, 'unpaid', '2026-04-26', '2026-05', 2);

INSERT INTO activity_logs (log_id, user_id, action_performed, affected_module, timestamp) VALUES
(1, 1, 'User login', 'auth', '2026-04-27 08:00:00'),
(2, 2, 'User login', 'auth', '2026-04-27 08:05:00'),
(3, 3, 'User login', 'auth', '2026-04-27 08:08:00');

INSERT INTO error_logs (error_id, error_code, error_message, affected_user_id, timestamp) VALUES
(1, 'AUTH_LOGIN_FAILED', 'Failed login for email invalid-user@rentease.local', NULL, '2026-04-26 18:10:33');

INSERT INTO feedback (feedback_id, user_id, reservation_id, rating, comment, status, created_at, updated_at) VALUES
(1, 3, 1, 5, 'Great room and very responsive owner. Process was smooth.', 'visible', '2026-04-10 12:10:00', NULL),
(2, 4, 3, 4, 'Clean room and fair rent. We requested minor maintenance.', 'hidden', '2026-04-21 14:40:00', '2026-04-22 09:15:00');
"@

Write-Host ""
Write-Host "Database restored successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Demo Accounts:" -ForegroundColor Yellow
Write-Host "  Admin: admin@rentease.local / Admin123!" -ForegroundColor White
Write-Host "  Owner: owner@rentease.local / Owner123!" -ForegroundColor White
Write-Host "  Seeker: seeker@rentease.local / Seeker123!" -ForegroundColor White
Write-Host "  Parent: parent@rentease.local / Parent123!" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Update backend/config.php to use port 3307" -ForegroundColor Red
Write-Host ""
pause
