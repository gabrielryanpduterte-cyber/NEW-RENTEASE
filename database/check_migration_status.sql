-- RENTEASE Phase 11: Check if Migration Already Completed
-- Run this to verify all columns exist

-- Check what columns exist in users table
DESCRIBE users;

-- Check if all 5 new columns exist
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'rentease_db'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN (
      'email_verified',
      'verification_token',
      'verification_token_expires',
      'password_reset_token',
      'password_reset_expires'
  )
ORDER BY COLUMN_NAME;

-- Check if indexes exist
SHOW INDEX FROM users WHERE Key_name IN (
    'idx_verification_token',
    'idx_password_reset_token',
    'idx_email_verified'
);

-- If you see all 5 columns and 3 indexes, migration is COMPLETE!
-- If some are missing, see the partial migration fix below.
