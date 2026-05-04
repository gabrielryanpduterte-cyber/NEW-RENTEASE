-- ============================================
-- VERIFY GOOGLE OAUTH COLUMNS
-- ============================================
-- Run this in phpMyAdmin to verify Part 2 is complete

-- Check if all required columns exist
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_SCHEMA = 'rentease_db' 
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME IN (
        'google_id',
        'profile_picture', 
        'auth_provider',
        'email_verified'
    )
ORDER BY 
    FIELD(COLUMN_NAME, 'google_id', 'profile_picture', 'auth_provider', 'email_verified');

-- ============================================
-- EXPECTED RESULTS (Part 2 Complete):
-- ============================================
-- google_id        | varchar(255) | YES | NULL
-- profile_picture  | varchar(500) | YES | NULL  
-- auth_provider    | varchar(20)  | NO  | 'local'
-- email_verified   | tinyint(1)   | YES | 0

-- ============================================
-- If you see all 4 rows, Part 2 is ✅ COMPLETE
-- If missing any, run: phase12_google_oauth_schema.sql
-- ============================================
