-- ============================================
-- DELETE TEST USERS ONLY
-- Quick cleanup without removing columns
-- ============================================

-- Option 1: Delete specific user by ID
DELETE FROM users WHERE user_id = 28;

-- Option 2: Delete all users created today (be careful!)
-- DELETE FROM users WHERE DATE(created_at) = CURDATE();

-- Option 3: Delete users by email pattern
-- DELETE FROM users WHERE email LIKE '%test%';

-- Option 4: Delete all Google auth test users
-- DELETE FROM users WHERE auth_provider = 'google' AND created_at > '2026-05-03';

-- Option 5: Keep only first user, delete rest (DANGEROUS!)
-- DELETE FROM users WHERE user_id > 1;

-- Verify what's left
SELECT 
    user_id,
    full_name,
    email,
    role,
    auth_provider,
    created_at
FROM users
ORDER BY user_id;

-- ============================================
-- INSTRUCTIONS:
-- 1. Uncomment the DELETE statement you want to use
-- 2. Run it in phpMyAdmin SQL tab
-- 3. Check the SELECT query to verify
-- ============================================
