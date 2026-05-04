-- Quick Migration Verification Script
-- Run this in phpMyAdmin to check if everything is ready

-- Check 1: Do all columns exist?
SELECT 
    'Checking columns...' as step,
    COUNT(*) as found_columns,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ All 5 columns exist!'
        ELSE '❌ Missing columns - run phase11_safe_migration.sql'
    END as status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'rentease_db'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN (
      'email_verified',
      'verification_token',
      'verification_token_expires',
      'password_reset_token',
      'password_reset_expires'
  );

-- Check 2: Are existing users verified?
SELECT 
    'Checking existing users...' as step,
    COUNT(*) as total_users,
    SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) as verified_users,
    CASE 
        WHEN COUNT(*) = SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) 
        THEN '✅ All existing users verified!'
        ELSE '⚠️ Some users unverified - run: UPDATE users SET email_verified = 1;'
    END as status
FROM users;

-- Check 3: Do indexes exist?
SELECT 
    'Checking indexes...' as step,
    COUNT(DISTINCT Key_name) as found_indexes,
    CASE 
        WHEN COUNT(DISTINCT Key_name) >= 3 THEN '✅ All indexes exist!'
        ELSE '⚠️ Missing indexes - run phase11_safe_migration.sql'
    END as status
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'rentease_db'
  AND TABLE_NAME = 'users'
  AND Key_name IN (
      'idx_verification_token',
      'idx_password_reset_token',
      'idx_email_verified'
  );

-- Final Summary
SELECT 
    '=== MIGRATION STATUS ===' as summary,
    CASE 
        WHEN (
            SELECT COUNT(*) 
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
        ) = 5 
        THEN '✅ MIGRATION COMPLETE - Ready to test!'
        ELSE '❌ MIGRATION INCOMPLETE - Run phase11_safe_migration.sql'
    END as final_status;
