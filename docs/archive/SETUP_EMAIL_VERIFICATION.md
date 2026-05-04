# Email Verification Setup Instructions

## Phase 11: Email Verification & Password Reset - Installation Guide

---

## Step 1: Install PHPMailer (Required)

### Option A: Using Composer (Recommended)

1. Open terminal/command prompt
2. Navigate to backend directory:
   ```bash
   cd c:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\backend
   ```

3. Install Composer dependencies:
   ```bash
   composer install
   ```

### Option B: Manual Installation (if Composer not available)

1. Download PHPMailer from: https://github.com/PHPMailer/PHPMailer/releases
2. Extract to `backend/vendor/phpmailer/phpmailer/`
3. Update `EmailService.php` to use manual require instead of autoload

---

## Step 2: Run Database Migration

1. Open phpMyAdmin or MySQL client
2. Select your `rentease_db` database
3. Run the migration script:
   - File: `database/phase11_email_verification_schema.sql`
   - This adds 5 new columns to the `users` table
   - **SAFE**: Non-destructive, backward compatible

4. Verify migration:
   ```sql
   DESCRIBE users;
   ```
   You should see these new columns:
   - `email_verified`
   - `verification_token`
   - `verification_token_expires`
   - `password_reset_token`
   - `password_reset_expires`

---

## Step 3: Configure Email Service

### Using Gmail (Easiest for Development)

1. Open `backend/config/email.php`

2. Update these settings:
   ```php
   define('SMTP_USERNAME', 'your-gmail@gmail.com');
   define('SMTP_PASSWORD', 'your-app-password');
   ```

3. **Get Gmail App Password:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification (if not already enabled)
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character password
   - Paste it in `SMTP_PASSWORD`

4. Update frontend URL:
   ```php
   define('FRONTEND_BASE_URL', 'http://localhost:5173');
   ```

### Using SendGrid (Recommended for Production)

1. Sign up at: https://sendgrid.com (100 emails/day free)
2. Get API key from SendGrid dashboard
3. Update `backend/config/email.php`:
   ```php
   define('EMAIL_PROVIDER', 'sendgrid');
   define('SENDGRID_API_KEY', 'your-api-key-here');
   ```

---

## Step 4: Configure Feature Flags

Open `backend/config/features.php` and adjust settings:

```php
// Enable/disable email verification
define('EMAIL_VERIFICATION_ENABLED', true);

// Require verification for login
define('REQUIRE_EMAIL_VERIFICATION', true);

// Enable password reset
define('PASSWORD_RESET_ENABLED', true);
```

**For Testing:** Set `EMAIL_TEST_MODE` to `true` in `email.php` to prevent actual emails from being sent (logs only).

---

## Step 5: Test Email Sending

Create a test file: `backend/test-email.php`

```php
<?php
require_once __DIR__ . '/config/email.php';
require_once __DIR__ . '/config/features.php';
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/utils/EmailService.php';

$emailService = new EmailService();
$testToken = EmailService::generateToken();

$result = $emailService->sendVerificationEmail(
    'your-test-email@gmail.com',
    'Test User',
    $testToken
);

if ($result) {
    echo "✅ Email sent successfully!\n";
    echo "Check your inbox (and spam folder)\n";
} else {
    echo "❌ Email failed to send\n";
    echo "Check error logs\n";
}
?>
```

Run: `php backend/test-email.php`

---

## Step 6: Update .gitignore (Security)

Add to `.gitignore`:
```
backend/config/email.php
backend/vendor/
backend/composer.lock
```

**IMPORTANT:** Never commit email credentials to Git!

---

## Step 7: Frontend Integration (Next Phase)

The backend is now ready. Next steps:

1. Create React components:
   - `VerifyEmail.jsx`
   - `ForgotPassword.jsx`
   - `ResetPassword.jsx`
   - `ResendVerification.jsx`

2. Add routes in `App.jsx`:
   ```jsx
   <Route path="/verify-email/:token" element={<VerifyEmail />} />
   <Route path="/forgot-password" element={<ForgotPassword />} />
   <Route path="/reset-password/:token" element={<ResetPassword />} />
   ```

3. Update `Register.jsx` to show verification message
4. Update `Login.jsx` to handle unverified users

---

## Testing Checklist

### Backend API Tests

Test these endpoints using Postman or curl:

1. **Register New User:**
   ```
   POST http://localhost/rentease/backend/auth.php?action=register
   Body: {
     "full_name": "Test User",
     "email": "test@example.com",
     "password": "password123",
     "role": "seeker",
     "contact_number": "09171234567"
   }
   ```
   Expected: Success + "Please check your email" message

2. **Verify Email:**
   ```
   POST http://localhost/rentease/backend/verify-email.php
   Body: {
     "token": "your-token-from-email"
   }
   ```
   Expected: "Email verified successfully"

3. **Login (Unverified):**
   ```
   POST http://localhost/rentease/backend/auth.php?action=login
   Body: {
     "email": "test@example.com",
     "password": "password123",
     "role": "seeker"
   }
   ```
   Expected: 403 error "Email not verified"

4. **Resend Verification:**
   ```
   POST http://localhost/rentease/backend/resend-verification.php
   Body: {
     "email": "test@example.com"
   }
   ```
   Expected: "Verification email sent"

5. **Forgot Password:**
   ```
   POST http://localhost/rentease/backend/forgot-password.php
   Body: {
     "email": "test@example.com"
   }
   ```
   Expected: "Password reset email sent"

6. **Reset Password:**
   ```
   POST http://localhost/rentease/backend/reset-password.php
   Body: {
     "token": "your-reset-token",
     "new_password": "newpassword123"
   }
   ```
   Expected: "Password reset successful"

---

## Troubleshooting

### Issue: Emails not sending

**Solution:**
1. Check `EMAIL_TEST_MODE` is set to `false`
2. Verify SMTP credentials are correct
3. Check Gmail "Less secure app access" or use App Password
4. Check firewall isn't blocking port 587
5. Look at PHP error logs

### Issue: Emails going to spam

**Solution:**
1. Use a verified domain email address
2. Add SPF and DKIM records to your domain
3. Use professional email service (SendGrid/Mailgun)
4. Avoid spam trigger words in subject/body

### Issue: Token expired

**Solution:**
1. Increase `VERIFICATION_TOKEN_EXPIRY_HOURS` in `features.php`
2. User can request new verification email via resend endpoint

### Issue: Rate limit exceeded

**Solution:**
1. Wait 1 hour before requesting again
2. Adjust `MAX_VERIFICATION_EMAILS_PER_HOUR` in `features.php`

### Issue: Existing users can't login

**Solution:**
1. Check database migration set `email_verified = 1` for existing users
2. Run this SQL to fix:
   ```sql
   UPDATE users SET email_verified = 1 WHERE email_verified IS NULL OR email_verified = 0;
   ```

---

## Rollback Instructions

If something goes wrong:

1. **Disable Feature:**
   ```php
   // In backend/config/features.php
   define('EMAIL_VERIFICATION_ENABLED', false);
   ```

2. **Rollback Database:**
   ```bash
   # Run: database/phase11_email_verification_rollback.sql
   ```

3. **Restore Backup:**
   - Restore database from backup taken before migration

---

## Security Checklist

- [ ] Email credentials not committed to Git
- [ ] `.gitignore` updated
- [ ] Tokens are cryptographically secure (64 characters)
- [ ] Token expiration times are appropriate
- [ ] Rate limiting is enabled
- [ ] HTTPS enabled in production
- [ ] Email inputs are sanitized
- [ ] Prepared statements used for all queries

---

## Production Deployment Checklist

- [ ] Composer dependencies installed
- [ ] Database migration completed
- [ ] Email service configured (SendGrid/Mailgun recommended)
- [ ] Feature flags configured
- [ ] Frontend URLs updated to production domain
- [ ] SSL/TLS certificates installed
- [ ] Email templates tested
- [ ] All API endpoints tested
- [ ] Rate limiting verified
- [ ] Monitoring/logging enabled
- [ ] Backup created before deployment

---

## Support

If you encounter issues:

1. Check PHP error logs
2. Check email service logs
3. Verify database migration completed
4. Test with `EMAIL_TEST_MODE = true` first
5. Review this guide's troubleshooting section

---

**Last Updated:** 2026-04-28  
**Phase:** 11 - Email Verification & Password Reset  
**Status:** Backend Complete - Frontend Pending
