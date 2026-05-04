# 📧 WHY YOU'RE NOT RECEIVING EMAILS - ANALYSIS & FIX

## 🔴 ROOT CAUSES FOUND:

### Problem 1: TEST MODE is ENABLED ✅ FIXED
**Location:** `backend/config/email.php` line 76
```php
define('EMAIL_TEST_MODE', true); // ← Emails are logged, NOT sent!
```

**Status:** I changed this to `false` - emails will now attempt to send.

---

### Problem 2: PHP mail() Function DOESN'T WORK on Windows ⚠️
**Location:** `backend/utils/EmailService.php`

The EmailService uses PHP's built-in `mail()` function:
```php
$result = mail($toEmail, 'Subject', $htmlBody, $headers);
```

**Why it fails on Windows/XAMPP:**
- PHP `mail()` requires a mail server (sendmail/postfix)
- Windows doesn't have sendmail by default
- XAMPP doesn't configure mail() automatically
- Emails fail silently (no error shown)

---

### Problem 3: No SMTP Configuration
The current `email.php` is configured for Mailtrap (fake email service for testing), not real Gmail SMTP.

---

## ✅ COMPLETE FIX - 3 Steps

### Step 1: Get Gmail App Password (5 minutes)

1. **Go to:** https://myaccount.google.com/security
2. **Enable 2-Step Verification** (if not already enabled)
3. **Go to:** https://myaccount.google.com/apppasswords
4. **Select:**
   - App: "Mail"
   - Device: "Windows Computer"
5. **Click "Generate"**
6. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

---

### Step 2: Update email.php Configuration

Open: `backend/config/email.php`

**Find lines 14-25 and replace with:**
```php
// Email service provider: 'gmail' for Gmail SMTP
define('EMAIL_PROVIDER', 'gmail');

// GMAIL SMTP SETTINGS
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_ENCRYPTION', 'tls');
define('SMTP_USERNAME', 'your-email@gmail.com'); // ← Your Gmail address
define('SMTP_PASSWORD', 'abcd efgh ijkl mnop'); // ← Your App Password (16 chars)
```

**Find line 76 (already fixed by me):**
```php
define('EMAIL_TEST_MODE', false); // ← Must be false to send real emails
```

---

### Step 3: Install PHPMailer (Required for SMTP)

**Option A: Using Composer (Recommended)**
```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\backend"
composer require phpmailer/phpmailer
```

**Option B: Manual Download (if Composer fails)**
1. Download: https://github.com/PHPMailer/PHPMailer/archive/refs/heads/master.zip
2. Extract to: `backend/vendor/phpmailer/phpmailer/`
3. The folder structure should be:
   ```
   backend/vendor/phpmailer/phpmailer/src/
   ```

---

### Step 4: Update EmailService to Use PHPMailer

I need to rewrite the EmailService to use SMTP instead of mail(). 

**Create this file:** `backend/utils/EmailServiceSMTP.php`

```php
<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';

class EmailService {
    private $mailer;
    
    public function __construct() {
        require_once __DIR__ . '/../config/email.php';
        require_once __DIR__ . '/../config/features.php';
        
        $this->mailer = new PHPMailer(true);
        $this->setupSMTP();
    }
    
    private function setupSMTP() {
        $this->mailer->isSMTP();
        $this->mailer->Host = SMTP_HOST;
        $this->mailer->SMTPAuth = true;
        $this->mailer->Username = SMTP_USERNAME;
        $this->mailer->Password = SMTP_PASSWORD;
        $this->mailer->SMTPSecure = SMTP_ENCRYPTION;
        $this->mailer->Port = SMTP_PORT;
        $this->mailer->setFrom(EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME);
        $this->mailer->CharSet = 'UTF-8';
        
        if (EMAIL_DEBUG) {
            $this->mailer->SMTPDebug = 2;
        }
    }
    
    public function sendVerificationEmail($toEmail, $toName, $verificationToken) {
        if (!EMAIL_VERIFICATION_ENABLED) return true;
        if (EMAIL_TEST_MODE) {
            error_log("TEST MODE: Verification email to {$toEmail}");
            return true;
        }
        
        try {
            $verificationUrl = str_replace('{token}', $verificationToken, VERIFICATION_URL_FORMAT);
            $htmlBody = $this->loadTemplate('verification_email.html', [
                'user_name' => htmlspecialchars($toName),
                'verification_url' => $verificationUrl,
                'expiry_hours' => VERIFICATION_TOKEN_EXPIRY_HOURS,
                'support_email' => EMAIL_SUPPORT_EMAIL
            ]);
            
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->isHTML(true);
            $this->mailer->Subject = 'Verify Your RENTEASE Account';
            $this->mailer->Body = $htmlBody;
            $this->mailer->AltBody = "Verify your email: {$verificationUrl}";
            
            return $this->mailer->send();
        } catch (Exception $e) {
            error_log("Email failed: " . $e->getMessage());
            return false;
        }
    }
    
    public function sendPasswordResetEmail($toEmail, $toName, $resetToken) {
        if (!PASSWORD_RESET_ENABLED) return true;
        if (EMAIL_TEST_MODE) {
            error_log("TEST MODE: Password reset email to {$toEmail}");
            return true;
        }
        
        try {
            $resetUrl = str_replace('{token}', $resetToken, PASSWORD_RESET_URL_FORMAT);
            $htmlBody = $this->loadTemplate('password_reset_email.html', [
                'user_name' => htmlspecialchars($toName),
                'reset_url' => $resetUrl,
                'expiry_hours' => PASSWORD_RESET_TOKEN_EXPIRY_HOURS,
                'support_email' => EMAIL_SUPPORT_EMAIL
            ]);
            
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->isHTML(true);
            $this->mailer->Subject = 'Reset Your RENTEASE Password';
            $this->mailer->Body = $htmlBody;
            $this->mailer->AltBody = "Reset your password: {$resetUrl}";
            
            return $this->mailer->send();
        } catch (Exception $e) {
            error_log("Email failed: " . $e->getMessage());
            return false;
        }
    }
    
    private function loadTemplate($templateName, $variables) {
        $templatePath = __DIR__ . '/../email_templates/' . $templateName;
        if (!file_exists($templatePath)) {
            throw new Exception("Email template not found: {$templateName}");
        }
        $template = file_get_contents($templatePath);
        foreach ($variables as $key => $value) {
            $template = str_replace('{{' . $key . '}}', $value, $template);
        }
        return $template;
    }
    
    public static function generateToken() {
        return bin2hex(random_bytes(32));
    }
    
    public static function checkRateLimit($pdo, $userId, $type = 'verification') {
        $maxEmails = ($type === 'verification') 
            ? MAX_VERIFICATION_EMAILS_PER_HOUR 
            : MAX_PASSWORD_RESET_EMAILS_PER_HOUR;
        
        $oneHourAgo = date('Y-m-d H:i:s', strtotime('-1 hour'));
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as email_count 
            FROM activity_logs 
            WHERE user_id = :user_id 
            AND action_performed LIKE :action_pattern 
            AND timestamp > :one_hour_ago
        ");
        
        $actionPattern = ($type === 'verification') 
            ? '%verification email sent%' 
            : '%password reset email sent%';
        
        $stmt->execute([
            ':user_id' => $userId,
            ':action_pattern' => $actionPattern,
            ':one_hour_ago' => $oneHourAgo
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return ($result['email_count'] >= $maxEmails);
    }
}
?>
```

---

## 🧪 Test Email Sending

After configuration, test with this script:

**Create:** `backend/test-email-send.php`
```php
<?php
require_once __DIR__ . '/config/email.php';
require_once __DIR__ . '/config/features.php';
require_once __DIR__ . '/utils/EmailService.php';

$emailService = new EmailService();
$testToken = EmailService::generateToken();

echo "Sending test email...\n";
$result = $emailService->sendVerificationEmail(
    'YOUR_EMAIL@gmail.com', // ← Your email to receive test
    'Test User',
    $testToken
);

if ($result) {
    echo "✅ Email sent successfully!\n";
    echo "Check your inbox (and spam folder)\n";
    echo "Verification URL: http://localhost:5173/verify-email/{$testToken}\n";
} else {
    echo "❌ Email failed to send\n";
    echo "Check PHP error log for details\n";
}
?>
```

**Run:**
```powershell
cd backend
php test-email-send.php
```

---

## 📊 Summary of Issues

| Issue | Status | Fix |
|-------|--------|-----|
| TEST_MODE enabled | ✅ Fixed | Changed to `false` |
| Using mail() function | ⚠️ Won't work | Need PHPMailer + SMTP |
| No Gmail credentials | ❌ Missing | Need App Password |
| No PHPMailer installed | ❌ Missing | Run `composer require` |

---

## ✅ Quick Setup Checklist

- [ ] Get Gmail App Password
- [ ] Update `email.php` with Gmail credentials
- [ ] Verify `EMAIL_TEST_MODE = false`
- [ ] Install PHPMailer: `composer require phpmailer/phpmailer`
- [ ] Replace EmailService.php with SMTP version
- [ ] Test with `test-email-send.php`
- [ ] Check inbox (and spam folder)

---

## 🆘 Still Not Working?

### Check PHP Error Log:
```
C:\xampp\php\logs\php_error_log
```

### Common Errors:

**"SMTP connect() failed"**
- Check Gmail credentials
- Make sure 2-Step Verification is enabled
- Use App Password, not regular password

**"Could not authenticate"**
- Wrong App Password
- Copy-paste carefully (no spaces)

**Emails go to spam**
- Normal for first few emails
- Check spam folder
- Mark as "Not Spam"

---

**Current Status:** TEST_MODE disabled, but need PHPMailer + Gmail setup to actually send emails.
