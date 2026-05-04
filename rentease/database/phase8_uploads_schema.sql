-- Phase 8 uploads schema

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
