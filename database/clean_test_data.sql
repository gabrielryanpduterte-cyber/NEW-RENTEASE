-- Quick Clean Test Data Script
-- Removes test users but keeps demo accounts

-- Show current test users
SELECT 'Current test users:' as info;
SELECT user_id, email, role, email_verified, created_at 
FROM users 
WHERE email NOT IN (
    'admin@rentease.local',
    'owner@rentease.local',
    'seeker@rentease.local',
    'parent@rentease.local'
)
ORDER BY created_at DESC;

-- Delete test users
DELETE FROM users 
WHERE email NOT IN (
    'admin@rentease.local',
    'owner@rentease.local',
    'seeker@rentease.local',
    'parent@rentease.local'
);

-- Show remaining users
SELECT 'Remaining users after cleanup:' as info;
SELECT user_id, email, role, email_verified 
FROM users 
ORDER BY user_id;

-- Reset auto-increment (optional)
-- This makes new users start from a clean ID
SET @max_id = (SELECT IFNULL(MAX(user_id), 0) FROM users);
SET @sql = CONCAT('ALTER TABLE users AUTO_INCREMENT = ', @max_id + 1);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Cleanup complete! Ready for fresh testing.' as status;
