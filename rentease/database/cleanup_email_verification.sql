-- ============================================
-- RENTEASE DATABASE CLEANUP
-- Remove Email Verification Columns
-- ============================================

-- Step 1: Delete all test users (keep only real users)
-- CAUTION: Review this before running!
DELETE FROM users WHERE user_id >= 28; -- Adjust this number based on your needs

-- Step 2: Remove email verification columns (not needed anymore)
ALTER TABLE users 
DROP COLUMN verification_token,
DROP COLUMN verification_token_expires,
DROP COLUMN password_reset_token,
DROP COLUMN password_reset_expires;

-- Step 3: Set all existing users to verified
UPDATE users SET email_verified = 1 WHERE email_verified = 0;

-- Step 4: Verify cleanup
SELECT 
    user_id,
    full_name,
    email,
    role,
    contact_number,
    account_status,
    email_verified,
    google_id,
    auth_provider,
    created_at
FROM users
ORDER BY user_id;

-- ============================================
-- RESULT: Clean users table without email verification columns
-- ============================================
