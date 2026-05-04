# 🚀 Quick Start: Email Setup (No Google Issues!)

## Problem
❌ Can't use Gmail due to Google security restrictions

## Solution
✅ Use **Mailtrap** (free, easy, no security issues!)

---

## 5-Minute Setup

### 1. Sign Up for Mailtrap
```
https://mailtrap.io
→ Sign up (free)
→ Verify email
→ Login
```

### 2. Get SMTP Credentials
```
Dashboard → Email Testing → Inboxes
→ Click "My Inbox"
→ SMTP Settings tab
→ Copy username & password
```

### 3. Install PHPMailer
```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\backend"
composer install
```

### 4. Configure Email
Edit `backend/config/email.php`:
```php
define('SMTP_HOST', 'sandbox.smtp.mailtrap.io');
define('SMTP_PORT', 2525);
define('SMTP_ENCRYPTION', 'tls');
define('SMTP_USERNAME', 'paste-username-here');
define('SMTP_PASSWORD', 'paste-password-here');
define('EMAIL_FROM_ADDRESS', 'noreply@rentease.local');
define('EMAIL_TEST_MODE', false);
```

### 5. Enable Feature
Edit `backend/config/features.php`:
```php
define('EMAIL_VERIFICATION_ENABLED', true);
define('REQUIRE_EMAIL_VERIFICATION', true);
```

### 6. Test It!
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

Check Mailtrap inbox → See verification email! ✅

---

## Why Mailtrap?

✅ **FREE** forever  
✅ **No security restrictions**  
✅ **Beautiful email preview**  
✅ **No real emails sent** (perfect for testing)  
✅ **No spam risk**  
✅ **5-minute setup**

---

## Other Options

| Service | Best For | Free Tier |
|---------|----------|-----------|
| **Mailtrap** | Development | Unlimited (no real emails) |
| **SendGrid** | Production | 100 emails/day |
| **Mailgun** | Production | 5,000 emails/month (3 months) |
| **Test Mode** | Quick testing | Unlimited (logs only) |

---

## Need More Details?

See **EMAIL_SETUP_ALTERNATIVES.md** for:
- Complete setup guides
- SendGrid configuration
- Mailgun configuration
- Local SMTP servers
- Test mode setup
- Troubleshooting

---

## Quick Test

After setup, test email sending:

Create `backend/test-email.php`:
```php
<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/utils/EmailService.php';

$emailService = new EmailService();
$token = EmailService::generateToken();

if ($emailService->sendVerificationEmail('test@example.com', 'Test User', $token)) {
    echo "✅ Email sent! Check Mailtrap inbox.\n";
} else {
    echo "❌ Failed to send email.\n";
}
?>
```

Run:
```powershell
php backend/test-email.php
```

---

**That's it! No Google security issues, no complications!** 🎉
