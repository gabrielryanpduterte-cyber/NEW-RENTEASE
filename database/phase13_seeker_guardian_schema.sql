-- Phase 13 seeker dashboard and tokenized guardian access schema

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS emergency_contact_number VARCHAR(20) NULL,
    ADD COLUMN IF NOT EXISTS school_or_workplace VARCHAR(150) NULL;

ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS valid_id_path VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL,
    ADD COLUMN IF NOT EXISTS cancelled_at DATETIME NULL;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS proof_of_payment_path VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS notes TEXT NULL;

ALTER TABLE activity_logs
    ADD COLUMN IF NOT EXISTS notes TEXT NULL,
    ADD COLUMN IF NOT EXISTS guardian_link_id INT(10) UNSIGNED NULL;

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
