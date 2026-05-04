-- ✅ QUICK FIX: Manually Verify Your Email
-- Run this in phpMyAdmin to verify your account

-- Option 1: Verify a specific user by email
UPDATE users 
SET email_verified = 1, 
    verification_token = NULL, 
    verification_token_expires = NULL 
WHERE email = 'your-email@example.com';

-- Option 2: Verify ALL users (for testing)
UPDATE users 
SET email_verified = 1, 
    verification_token = NULL, 
    verification_token_expires = NULL;

-- Option 3: Check verification status
SELECT user_id, full_name, email, email_verified, role 
FROM users 
ORDER BY created_at DESC;

-- After running this, you can login without email verification!
