-- Safe migration: Add only missing Google OAuth columns
USE rentease_db;

-- Add profile_picture if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'rentease_db' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_picture';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500) NULL AFTER google_id', 
    'SELECT "profile_picture already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add auth_provider if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'rentease_db' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'auth_provider';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN auth_provider ENUM(''local'', ''google'') NOT NULL DEFAULT ''local'' AFTER profile_picture', 
    'SELECT "auth_provider already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add email_verified if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'rentease_db' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verified';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER auth_provider', 
    'SELECT "email_verified already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show final structure
SELECT 'Migration complete! Current columns:' AS message;
SHOW COLUMNS FROM users;
