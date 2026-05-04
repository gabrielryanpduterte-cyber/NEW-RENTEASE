# 📧 Email Setup Alternatives (Without Google Security Issues)

## The Problem with Gmail

Google's security policies can block your application:
- ❌ Requires 2FA setup
- ❌ App passwords can be revoked
- ❌ "Less secure app" access disabled
- ❌ May block automated emails
- ❌ Rate limiting for new accounts

## ✅ Better Alternatives for Development/Production

---

## Option 1: Mailtrap (BEST for Development) ⭐

**Perfect for testing without sending real emails!**

### Why Mailtrap?
- ✅ **FREE** for development
- ✅ No real emails sent (catches all emails)
- ✅ Beautiful email preview interface
- ✅ No security restrictions
- ✅ Test email templates easily
- ✅ No risk of spamming users

### Setup (5 minutes):

1. **Sign up**: https://mailtrap.io (free account)
2. **Get credentials** from inbox settings
3. **Configure** `backend/config/email.php`:

```php
// MAILTRAP CONFIGURATION
define('EMAIL_PROVIDER', 'smtp');
define('SMTP_HOST', 'sandbox.smtp.mailtrap.io');
define('SMTP_PORT', 2525);
define('SMTP_ENCRYPTION', 'tls');
define('SMTP_USERNAME', 'your-mailtrap-username'); // From Mailtrap
define('SMTP_PASSWORD', 'your-mailtrap-password'); // From Mailtrap

define('EMAIL_FROM_ADDRESS', 'noreply@rentease.local');
define('EMAIL_FROM_NAME', 'RENTEASE');

define('EMAIL_TEST_MODE', false); // Mailtrap handles this
define('EMAIL_DEBUG', false);
```

4. **Enable features** in `backend/config/features.php`:
```php
define('EMAIL_VERIFICATION_ENABLED', true);
define('REQUIRE_EMAIL_VERIFICATION', true);
```

5. **Test it!** Register a user and check Mailtrap inbox

### Mailtrap Features:
- 📧 View all sent emails in web interface
- 🎨 Preview HTML/text versions
- 📱 Test responsive design
- 🔍 Check spam score
- 📊 Email analytics

---

## Option 2: SendGrid (BEST for Production) ⭐

**Free tier: 100 emails/day forever**

### Why SendGrid?
- ✅ **FREE** tier (100 emails/day)
- ✅ Professional email delivery
- ✅ High deliverability rates
- ✅ No Google security issues
- ✅ Easy API integration
- ✅ Email analytics

### Setup (10 minutes):

1. **Sign up**: https://sendgrid.com (free account)
2. **Create API Key**: Settings → API Keys → Create API Key
3. **Verify sender**: Settings → Sender Authentication
4. **Configure** `backend/config/email.php`:

```php
// SENDGRID CONFIGURATION
define('EMAIL_PROVIDER', 'smtp');
define('SMTP_HOST', 'smtp.sendgrid.net');
define('SMTP_PORT', 587);
define('SMTP_ENCRYPTION', 'tls');
define('SMTP_USERNAME', 'apikey'); // Literally the word "apikey"
define('SMTP_PASSWORD', 'your-sendgrid-api-key'); // Your actual API key

define('EMAIL_FROM_ADDRESS', 'your-verified-email@yourdomain.com');
define('EMAIL_FROM_NAME', 'RENTEASE');

define('EMAIL_TEST_MODE', false);
define('EMAIL_DEBUG', false);
```

### SendGrid Free Tier:
- 📧 100 emails/day
- 📊 Email analytics
- 🔒 Secure delivery
- 📈 Scalable (upgrade when needed)

---

## Option 3: Mailgun (Alternative to SendGrid)

**Free tier: 5,000 emails/month for 3 months**

### Why Mailgun?
- ✅ Generous free tier
- ✅ Developer-friendly
- ✅ Good documentation
- ✅ Reliable delivery

### Setup:

1. **Sign up**: https://mailgun.com
2. **Get credentials**: Sending → Domain Settings
3. **Configure** `backend/config/email.php`:

```php
// MAILGUN CONFIGURATION
define('EMAIL_PROVIDER', 'smtp');
define('SMTP_HOST', 'smtp.mailgun.org');
define('SMTP_PORT', 587);
define('SMTP_ENCRYPTION', 'tls');
define('SMTP_USERNAME', 'postmaster@your-domain.mailgun.org');
define('SMTP_PASSWORD', 'your-mailgun-password');

define('EMAIL_FROM_ADDRESS', 'noreply@your-domain.mailgun.org');
define('EMAIL_FROM_NAME', 'RENTEASE');
```

---

## Option 4: Local SMTP Server (For Testing Only)

**Use a local fake SMTP server**

### MailHog (Recommended)

1. **Download**: https://github.com/mailhog/MailHog/releases
2. **Run**: `MailHog.exe`
3. **Web UI**: http://localhost:8025
4. **Configure**:

```php
define('SMTP_HOST', 'localhost');
define('SMTP_PORT', 1025);
define('SMTP_ENCRYPTION', ''); // No encryption
define('SMTP_USERNAME', '');
define('SMTP_PASSWORD', '');
```

### Papercut SMTP (Windows Alternative)

1. **Download**: https://github.com/ChangemakerStudios/Papercut-SMTP/releases
2. **Run**: Papercut.exe
3. **Configure**: Same as MailHog

---

## Option 5: Test Mode (No Real Emails)

**Already built into your system!**

### Enable Test Mode:

Edit `backend/config/email.php`:
```php
define('EMAIL_TEST_MODE', true);
```

### What happens:
- ✅ Tokens generated and stored in database
- ✅ All verification logic works
- ✅ Emails logged to PHP error log
- ❌ No actual emails sent

### Check logs:
```
C:\xampp\php\logs\php_error_log
```

### Manually verify users:
```sql
-- Verify a user manually
UPDATE users 
SET email_verified = 1, 
    verification_token = NULL 
WHERE email = 'test@example.com';
```

---

## Comparison Table

| Service | Cost | Setup Time | Best For | Emails/Month |
|---------|------|------------|----------|--------------|
| **Mailtrap** | Free | 5 min | Development | Unlimited (not sent) |
| **SendGrid** | Free | 10 min | Production | 3,000 |
| **Mailgun** | Free (3mo) | 10 min | Production | 5,000 |
| **MailHog** | Free | 2 min | Local Testing | Unlimited (local) |
| **Test Mode** | Free | 1 min | Quick Testing | N/A |

---

## Recommended Setup Strategy

### Phase 1: Development (Now)
**Use Mailtrap or Test Mode**
- No real emails sent
- Easy testing
- No security issues

### Phase 2: Staging/Demo
**Use SendGrid Free Tier**
- Real email delivery
- Professional appearance
- 100 emails/day is enough

### Phase 3: Production
**Use SendGrid Paid or Mailgun**
- Scale as needed
- High deliverability
- Email analytics

---

## Step-by-Step: Mailtrap Setup (Recommended)

### 1. Create Mailtrap Account
```
1. Go to https://mailtrap.io
2. Click "Sign Up" (free)
3. Verify your email
4. Login to dashboard
```

### 2. Get SMTP Credentials
```
1. Go to "Email Testing" → "Inboxes"
2. Click on "My Inbox" (or create new)
3. Click "SMTP Settings"
4. Copy credentials shown
```

### 3. Install PHPMailer
```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\backend"
composer install
```

### 4. Configure Email Settings

Edit `backend/config/email.php`:
```php
<?php
// MAILTRAP CONFIGURATION (Development)
define('EMAIL_PROVIDER', 'smtp');
define('SMTP_HOST', 'sandbox.smtp.mailtrap.io');
define('SMTP_PORT', 2525);
define('SMTP_ENCRYPTION', 'tls');
define('SMTP_USERNAME', 'paste-your-username-here');
define('SMTP_PASSWORD', 'paste-your-password-here');

define('EMAIL_FROM_ADDRESS', 'noreply@rentease.local');
define('EMAIL_FROM_NAME', 'RENTEASE - Boarding House Management');

define('EMAIL_SUPPORT_EMAIL', 'support@rentease.local');
define('EMAIL_COMPANY_ADDRESS', '123 Mabini St, Baguio City');

define('FRONTEND_BASE_URL', 'http://localhost:5173');
define('VERIFICATION_URL_FORMAT', FRONTEND_BASE_URL . '/verify-email/{token}');
define('PASSWORD_RESET_URL_FORMAT', FRONTEND_BASE_URL . '/reset-password/{token}');

define('EMAIL_DEBUG', false);
define('EMAIL_TEST_MODE', false);
?>
```

### 5. Enable Email Verification

Edit `backend/config/features.php`:
```php
define('EMAIL_VERIFICATION_ENABLED', true);
define('REQUIRE_EMAIL_VERIFICATION', true);
define('PASSWORD_RESET_ENABLED', true);
```

### 6. Test Registration

```powershell
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

### 7. Check Mailtrap Inbox

1. Go to Mailtrap dashboard
2. Click on your inbox
3. See the verification email!
4. Click "Show HTML" to preview

---

## Troubleshooting

### PHPMailer Not Found
```powershell
cd backend
composer install
```

### SMTP Connection Failed
- Check SMTP credentials are correct
- Check port is not blocked by firewall
- Try different port (587, 2525, 465)

### Emails Not Appearing in Mailtrap
- Check `EMAIL_TEST_MODE` is `false`
- Check credentials are correct
- Check `EMAIL_DEBUG` is `true` for detailed logs

### Frontend Can't Verify Email
- Make sure frontend has verify-email route
- Check `FRONTEND_BASE_URL` is correct
- Check token is being passed correctly

---

## Quick Test Script

Save as `test-email.php` in backend folder:

```php
<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/config/features.php';
require_once __DIR__ . '/utils/EmailService.php';

try {
    $emailService = new EmailService();
    $token = EmailService::generateToken();
    
    $result = $emailService->sendVerificationEmail(
        'test@example.com',
        'Test User',
        $token
    );
    
    if ($result) {
        echo "✅ Email sent successfully!\n";
        echo "Check your Mailtrap inbox.\n";
    } else {
        echo "❌ Email failed to send.\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
```

Run it:
```powershell
cd backend
php test-email.php
```

---

## Summary

### ✅ DO USE:
- **Mailtrap** (development)
- **SendGrid** (production)
- **Mailgun** (production alternative)
- **Test Mode** (quick testing)

### ❌ DON'T USE:
- Gmail (security issues)
- Outlook/Hotmail (similar issues)
- Your personal email (security risks)

### 🎯 Recommended Right Now:
**Use Mailtrap** - It's free, easy, and perfect for development!

---

## Need Help?

If you get stuck:
1. Check `EMAIL_DEBUG = true` for detailed logs
2. Check PHP error log: `C:\xampp\php\logs\php_error_log`
3. Test SMTP connection with test script above
4. Verify PHPMailer is installed: `ls vendor/phpmailer`

---

**Ready to set up Mailtrap?** It takes 5 minutes and solves all your email problems! 🚀
