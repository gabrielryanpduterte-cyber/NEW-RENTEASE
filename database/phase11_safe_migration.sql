-- RENTEASE Phase 11: Safe Migration (Checks for Existing Columns)
-- This script will only add columns that don't exist yet

-- Add email_verified if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'rentease_db' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'email_verified';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 1 COMMENT "Email verification status"',
    'SELECT "email_verified already exists" AS status');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add verification_token if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'rentease_db' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'verification_token';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN verification_token VARCHAR(64) NULL COMMENT "Token for email verification"',
    'SELECT "verification_token already exists" AS status');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add verification_token_expires if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'rentease_db' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'verification_token_expires';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN verification_token_expires DATETIME NULL COMMENT "Verification token expiration"',
    'SELECT "verification_token_expires already exists" AS status');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add password_reset_token if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'rentease_db' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'password_reset_token';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(64) NULL COMMENT "Token for password reset"',
    'SELECT "password_reset_token already exists" AS status');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add password_reset_expires if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'rentease_db' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'password_reset_expires';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL COMMENT "Password reset token expiration"',
    'SELECT "password_reset_expires already exists" AS status');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes (will skip if they exist)
CREATE INDEX IF NOT EXISTS idx_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_email_verified ON users(email_verified);

-- Ensure all existing users are verified
UPDATE users 
SET email_verified = 1 
WHERE email_verified IS NULL OR email_verified = 0;

-- Final verification
SELECT 'Migration Complete! All columns and indexes added.' AS status;

-- Show the users table structure
DESCRIBE users;
