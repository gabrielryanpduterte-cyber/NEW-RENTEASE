-- Phase 6 feedback module table
-- Run this in the rentease_db database before using backend/feedback.php

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
