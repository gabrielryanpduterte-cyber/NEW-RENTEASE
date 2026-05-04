# Registration Error Fix Guide

## The Issue

When you create an account, you see "An unexpected error occurred" because:
- Email verification is **ENABLED** in your backend
- After registration, the system tries to send a verification email
- You need to verify your email before you can login

## Quick Fix Options

### Option 1: Disable Email Verification (Easiest for Testing)

1. Open this file:
   ```
   c:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\backend\config\features.php
   ```

2. Change line 21 from:
   ```php
   define('REQUIRE_EMAIL_VERIFICATION', true);
   ```
   
   To:
   ```php
   define('REQUIRE_EMAIL_VERIFICATION', false);
   ```

3. Save the file

4. Now you can register and login immediately without email verification!

### Option 2: Manually Verify Your Account in Database

If you already created an account and want to verify it:

1. Open **phpMyAdmin** (http://localhost/phpmyadmin)

2. Select database: `rentease_db`

3. Click on `users` table

4. Find your user row (by email)

5. Change `email_verified` column from `0` to `1`

6. Click "Go" to save

7. Now you can login!

### Option 3: Configure Email Service (For Production)

If you want email verification to work properly:

1. Check if `backend/config/email.php` exists and is configured
2. Make sure you have valid SMTP credentials
3. Test the email service

## Recommended for Development

**Use Option 1** - Disable email verification while testing. You can enable it later when you're ready to configure email properly.

## After the Fix

1. If you disabled verification, try registering again
2. You should be able to login immediately
3. No more "unexpected error"!

## Still Having Issues?

Check browser console (F12 → Console tab) for detailed error messages.
