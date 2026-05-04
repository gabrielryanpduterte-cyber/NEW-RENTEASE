# Quick Fix: Registration HTTP 500 Error

## Root Cause
The registration fails with HTTP 500 because:
1. **Phase 11 email verification columns are missing** from the `users` table
2. The auth.php code tries to insert into columns that don't exist: `email_verified`, `verification_token`, `verification_token_expires`
3. The setup script (`phase8-local-setup.ps1`) doesn't apply Phase 11 schema

## Solution Options

### Option 1: Apply Phase 11 Database Schema (Recommended)

**This adds the missing email verification columns to your database.**

```powershell
# Open PowerShell
cd "C:\xampp\mysql\bin"

# Import Phase 11 schema
.\mysql.exe -u root rentease_db < "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\database\phase11_email_verification_schema.sql"
```

**Then rerun the test:**
```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\scripts"
.\phase10-onboarding-smoke-test.ps1
```

✅ This is the **proper fix** - it adds the missing database columns.

---

### Option 2: Disable Email Verification (Already Applied)

### Option 2: Disable Email Verification (Already Applied)

I already disabled email verification in `backend/config/features.php`:

```php
define('EMAIL_VERIFICATION_ENABLED', false);
define('REQUIRE_EMAIL_VERIFICATION', false);
```

**But this still requires the database columns to exist!** The code still tries to insert NULL values into those columns.

⚠️ This alone won't fix the error - you need Option 1 or Option 3.

---

### Option 3: Remove Email Verification Code (Temporary Workaround)

Edit `backend/config/email.php`:

```php
// Change this line at the bottom:
define('EMAIL_TEST_MODE', true);  // Changed from false
```

This logs emails instead of sending them.

**Then install PHPMailer:**
```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\backend"

# Install Composer if not installed
# Download from: https://getcomposer.org/download/

# Install PHPMailer
composer require phpmailer/phpmailer
```

---

### Option 3: Full Email Setup (Production Ready)

1. **Install PHPMailer:**
```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\backend"
composer require phpmailer/phpmailer
```

2. **Configure Gmail App Password:**
   - Go to Google Account settings
   - Enable 2-Step Verification
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Copy the 16-character password

3. **Edit `backend/config/email.php`:**
```php
define('SMTP_USERNAME', 'your-actual-email@gmail.com');
define('SMTP_PASSWORD', 'your-16-char-app-password');
define('EMAIL_FROM_ADDRESS', 'your-actual-email@gmail.com');
```

4. **Keep email verification enabled in `backend/config/features.php`:**
```php
define('EMAIL_VERIFICATION_ENABLED', true);
define('REQUIRE_EMAIL_VERIFICATION', true);
```

---

## Recommended for Testing: Option 1

For quick testing, use **Option 1** to disable email verification entirely.

After making the change, run:
```powershell
.\phase10-onboarding-smoke-test.ps1
```

---

## Verify the Fix

After applying any option, test registration manually:

```powershell
# Test registration
curl -X POST http://localhost/rentease/backend/auth.php?action=register `
  -H "Content-Type: application/json" `
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "seeker",
    "contact_number": "09123456789"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user_id": 123,
    "full_name": "Test User",
    "email": "test@example.com",
    "role": "seeker"
  }
}
```

---

## Why This Happened

The Phase 11 email verification feature was added but requires:
- PHPMailer library (installed via Composer)
- Email configuration (Gmail credentials)

Without these, the registration endpoint crashes when trying to send verification emails.

---

## Next Steps

1. Apply **Option 1** to continue testing
2. Later, set up proper email configuration for production
3. Update TESTING_GUIDE.md with this information
