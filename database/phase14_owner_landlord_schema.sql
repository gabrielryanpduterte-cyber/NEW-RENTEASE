-- Phase 14 owner / landlord schema
-- Matches the existing custom PHP backend table names.

ALTER TABLE boarding_house
    ADD COLUMN IF NOT EXISTS cover_photo VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20) NULL,
    ADD COLUMN IF NOT EXISTS facebook_page VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS amenities_list JSON NULL;

ALTER TABLE rooms
    ADD COLUMN IF NOT EXISTS photos JSON NULL,
    ADD COLUMN IF NOT EXISTS floor_number TINYINT NULL,
    ADD COLUMN IF NOT EXISTS is_archived TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notes TEXT NULL;

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

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS billing_cycle_id INT(10) UNSIGNED NULL,
    ADD COLUMN IF NOT EXISTS payment_method ENUM('cash','gcash','bank_transfer','other') NULL DEFAULT 'cash',
    ADD COLUMN IF NOT EXISTS received_by INT(10) UNSIGNED NULL;

ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS rejection_remarks TEXT NULL;
