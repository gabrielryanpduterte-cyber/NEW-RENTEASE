# EMAIL VERIFICATION - COMPLETE SETUP GUIDE

## Current Status: Backend Code Ready, Setup Required

I've updated the EmailService to use PHP's built-in `mail()` function instead of PHPMailer to avoid Composer SSL issues.

---

## ✅ STEP 1: Run Database Migration

### Option A: Using phpMyAdmin (Recommended)

1. **Start XAMPP:**
   - Open XAMPP Control Panel
   - Start Apache
   - Start MySQL

2. **Open phpMyAdmin:**
   - Go to: http://localhost/phpmyadmin
   - Click on `rentease_db` database (left sidebar)

3. **Run Migration SQL:**
   - Click "SQL" tab at the top
   - Copy and paste this SQL:

```sql
-- RENTEASE Phase 11: Email Verification Migration
-- Add email verification columns to users table

ALTER TABLE users 
ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 1 
    COMMENT 'Email verification status: 1=verified, 0=unverified',
ADD COLUMN verification_token VARCHAR(64) NULL 
    COMMENT 'Token for email verification link',
ADD COLUMN verification_token_expires DATETIME NULL 
    COMMENT 'Expiration timestamp for verification token',
ADD COLUMN password_reset_token VARCHAR(64) NULL 
    COMMENT 'Token for password reset link',
ADD COLUMN password_reset_expires DATETIME NULL 
    COMMENT 'Expiration timestamp for password reset token';

-- Add indexes for performance
CREATE INDEX idx_verification_token ON users(verification_token);
CREATE INDEX idx_password_reset_token ON users(password_reset_token);
CREATE INDEX idx_email_verified ON users(email_verified);

-- Ensure all existing users are verified
UPDATE users 
SET email_verified = 1 
WHERE email_verified IS NULL OR email_verified = 0;

-- Verify migration
SELECT 'Migration Complete!' as status;
```

4. **Click "Go" button**

5. **Verify Success:**
   - You should see "Migration Complete!" message
   - Run this query to verify columns exist:
   ```sql
   DESCRIBE users;
   ```
   - You should see 5 new columns at the bottom

---

## ✅ STEP 2: Configure Email Settings

### Option A: Test Mode (No Email Setup Required)

The system is already in TEST MODE. Emails will be logged but not sent.

**Current settings in `backend/config/email.php`:**
```php
define('EMAIL_TEST_MODE', true); // Emails logged, not sent
```

**To test:**
- Register a new user
- Check PHP error log for email content
- Token will be in database, you can manually verify

### Option B: Enable Real Emails (Gmail)

1. **Get Gmail App Password:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification
   - Go to: https://myaccount.google.com/apppasswords
   - Create app password for "Mail"
   - Copy the 16-character password

2. **Update `backend/config/email.php`:**
   ```php
   define('SMTP_HOST', 'smtp.gmail.com');
   define('SMTP_PORT', 587);
   define('SMTP_ENCRYPTION', 'tls');
   define('SMTP_USERNAME', 'your-gmail@gmail.com'); // Your Gmail
   define('SMTP_PASSWORD', 'xxxx xxxx xxxx xxxx'); // App password
   define('EMAIL_TEST_MODE', false); // Enable real sending
   ```

3. **Configure PHP mail() function:**
   - Edit `php.ini` in XAMPP
   - Find `[mail function]` section
   - Update:
   ```ini
   SMTP=smtp.gmail.com
   smtp_port=587
   sendmail_from=your-gmail@gmail.com
   ```

### Option C: Mailtrap (Safest for Testing)

1. **Sign up at:** https://mailtrap.io (Free)
2. **Get credentials** from inbox settings
3. **Update `backend/config/email.php`:**
   ```php
   define('SMTP_HOST', 'sandbox.smtp.mailtrap.io');
   define('SMTP_PORT', 2525);
   define('SMTP_USERNAME', 'your-mailtrap-username');
   define('SMTP_PASSWORD', 'your-mailtrap-password');
   define('EMAIL_TEST_MODE', false);
   ```

---

## ✅ STEP 3: Enable/Disable Features

Edit `backend/config/features.php`:

```php
// Enable email verification feature
define('EMAIL_VERIFICATION_ENABLED', true);

// Require verification to login (set false for easier testing)
define('REQUIRE_EMAIL_VERIFICATION', false); // Start with false

// Enable password reset
define('PASSWORD_RESET_ENABLED', true);
```

**Recommendation:** Keep `REQUIRE_EMAIL_VERIFICATION = false` during testing so you can still login without verifying.

---

## ✅ STEP 4: Test the Feature

### Test 1: Check Database Migration

Run this in phpMyAdmin SQL tab:
```sql
DESCRIBE users;
```

Expected: You should see these columns:
- email_verified
- verification_token
- verification_token_expires
- password_reset_token
- password_reset_expires

### Test 2: Register New User

**Using Postman or your frontend:**
```
POST http://localhost/rentease/backend/auth.php?action=register

Body (JSON):
{
  "full_name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "seeker",
  "contact_number": "09171234567"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email...",
  "data": {
    "user_id": 5,
    "email": "test@example.com",
    "requires_verification": true,
    "message": "A verification link has been sent to your email address."
  }
}
```

### Test 3: Check Database for Token

Run in phpMyAdmin:
```sql
SELECT user_id, email, email_verified, verification_token, verification_token_expires 
FROM users 
WHERE email = 'test@example.com';
```

Expected:
- email_verified = 0
- verification_token = (64-character token)
- verification_token_expires = (24 hours from now)

### Test 4: Verify Email Manually

Copy the token from database, then:
```
POST http://localhost/rentease/backend/verify-email.php

Body (JSON):
{
  "token": "paste-token-here"
}
```

Expected:
```json
{
  "success": true,
  "message": "Email verified successfully!",
  "data": {
    "email": "test@example.com",
    "message": "Your email has been verified. You can now login..."
  }
}
```

### Test 5: Check Email Verified in Database

```sql
SELECT user_id, email, email_verified, verification_token 
FROM users 
WHERE email = 'test@example.com';
```

Expected:
- email_verified = 1
- verification_token = NULL

### Test 6: Login

```
POST http://localhost/rentease/backend/auth.php?action=login

Body (JSON):
{
  "email": "test@example.com",
  "password": "password123",
  "role": "seeker"
}
```

Expected: Success (login works)

### Test 7: Test Password Reset

**Request reset:**
```
POST http://localhost/rentease/backend/forgot-password.php

Body (JSON):
{
  "email": "test@example.com"
}
```

**Check database for reset token:**
```sql
SELECT email, password_reset_token, password_reset_expires 
FROM users 
WHERE email = 'test@example.com';
```

**Reset password:**
```
POST http://localhost/rentease/backend/reset-password.php

Body (JSON):
{
  "token": "paste-reset-token-here",
  "new_password": "newpassword123"
}
```

**Login with new password:**
```
POST http://localhost/rentease/backend/auth.php?action=login

Body (JSON):
{
  "email": "test@example.com",
  "password": "newpassword123",
  "role": "seeker"
}
```

---

## ✅ STEP 5: Test Existing Users Still Work

**Login with existing user:**
```
POST http://localhost/rentease/backend/auth.php?action=login

Body (JSON):
{
  "email": "seeker@rentease.local",
  "password": "password",
  "role": "seeker"
}
```

Expected: ✅ Success (existing users auto-verified)

---

## 🎯 Quick Summary

### What You Need To Do:

1. **Start XAMPP** (Apache + MySQL)
2. **Run SQL migration** in phpMyAdmin (copy from above)
3. **Test with TEST MODE** (already enabled)
4. **Register new user** via API
5. **Verify email manually** using token from database
6. **Test login** works

### What's Already Done:

✅ All backend PHP files created  
✅ Email templates created  
✅ Configuration files created  
✅ EmailService updated (no PHPMailer needed)  
✅ Feature flags configured  
✅ Rate limiting implemented  
✅ Security measures in place  

---

## 🆘 Troubleshooting

### "Database connection failed"
- Start MySQL in XAMPP
- Check database name is `rentease_db`
- Check credentials in `backend/config.php`

### "Column already exists"
- Migration already run
- Skip to Step 2

### "Email not sending"
- Keep `EMAIL_TEST_MODE = true` for now
- Emails will be logged, not sent
- Check PHP error log for email content

### "Existing users can't login"
- Run this SQL:
  ```sql
  UPDATE users SET email_verified = 1;
  ```

---

## 📊 Current Status

- ✅ Backend code: 100% complete
- ⏳ Database migration: Waiting for you to run SQL
- ⏳ Email config: In TEST MODE (safe)
- ⏳ Testing: Ready to test after migration

**Next:** Run the SQL migration, then test!

---

## 🚀 After Testing Backend

Once backend works:
1. Implement frontend components (VerifyEmail.jsx, etc.)
2. Enable `REQUIRE_EMAIL_VERIFICATION = true`
3. Configure real email service (Mailtrap/Gmail)
4. Deploy to production

---

**Time to complete:** 15-30 minutes  
**Difficulty:** Easy  
**Risk:** Very low (fully reversible)

**Let's do this! 🎉**
