# 🚀 Quick Start - Email Verification Setup

## What Was Done

✅ **Backend APIs created** (5 new endpoints)  
✅ **Database schema designed** (5 new columns)  
✅ **Email templates created** (Beautiful HTML emails)  
✅ **Configuration files ready** (Feature flags + email config)  
✅ **Documentation complete** (Setup guide + implementation tracker)

---

## ⚡ Next 3 Steps (Do This Now)

### Step 1: Install PHPMailer (2 minutes)

Open terminal and run:
```bash
cd c:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\backend
composer install
```

If you don't have Composer:
- Download from: https://getcomposer.org/download/
- Install it
- Run the command above

---

### Step 2: Run Database Migration (1 minute)

1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Click on `rentease_db` database
3. Click "SQL" tab
4. Copy and paste the contents of:
   `database/phase11_email_verification_schema.sql`
5. Click "Go"
6. ✅ Done! You should see "5 columns added"

---

### Step 3: Configure Email (5 minutes)

#### Option A: Gmail (Easiest)

1. Open: `backend/config/email.php`

2. Update line 18-19:
   ```php
   define('SMTP_USERNAME', 'your-gmail@gmail.com');
   define('SMTP_PASSWORD', 'your-app-password');
   ```

3. Get Gmail App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Create app password for "Mail"
   - Copy the 16-character password
   - Paste it in `SMTP_PASSWORD`

4. Update line 38:
   ```php
   define('FRONTEND_BASE_URL', 'http://localhost:5173');
   ```

#### Option B: Test Mode (Skip Email Setup)

1. Open: `backend/config/email.php`
2. Change line 62 to:
   ```php
   define('EMAIL_TEST_MODE', true);
   ```
3. Emails will be logged but not sent (good for testing)

---

## 🧪 Test It Works

### Test 1: Register New User

Use Postman or your frontend:

```
POST http://localhost/rentease/backend/auth.php?action=register

Body:
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
    "requires_verification": true,
    "message": "A verification link has been sent..."
  }
}
```

### Test 2: Check Email

- Check your inbox (and spam folder)
- You should receive a beautiful verification email
- Click the verification link

### Test 3: Try to Login (Should Fail)

```
POST http://localhost/rentease/backend/auth.php?action=login

Body:
{
  "email": "test@example.com",
  "password": "password123",
  "role": "seeker"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Email not verified.",
  "errors": ["Please verify your email address before logging in."]
}
```

✅ **If you see this, it's working!**

---

## 🎯 What's Next?

After testing backend:

1. **Implement Frontend Components:**
   - VerifyEmail.jsx
   - ForgotPassword.jsx
   - ResetPassword.jsx
   - Update Register.jsx
   - Update Login.jsx

2. **Full Testing:**
   - Complete all 15 tests in implementation guide
   - Test rate limiting
   - Test token expiration
   - Test existing users can still login

3. **Production Deployment:**
   - Use SendGrid or Mailgun (not Gmail)
   - Update frontend URLs
   - Enable SSL/TLS
   - Create database backup

---

## 📚 Full Documentation

- **Implementation Guide:** `email_verification-implementation-guide.md`
- **Setup Instructions:** `SETUP_EMAIL_VERIFICATION.md`
- **Progress Summary:** `EMAIL_VERIFICATION_PROGRESS.md`

---

## 🆘 Troubleshooting

### "Composer not found"
- Install Composer: https://getcomposer.org/download/

### "Email not sending"
- Set `EMAIL_TEST_MODE = true` to test without sending
- Check Gmail App Password is correct
- Check port 587 is not blocked by firewall

### "Database error"
- Make sure you ran the migration SQL
- Check database name is `rentease_db`
- Verify columns were added: `DESCRIBE users;`

### "Existing users can't login"
- Run this SQL:
  ```sql
  UPDATE users SET email_verified = 1;
  ```

---

## 🎉 You're Ready!

Backend is **100% complete**. Just need to:
1. Install PHPMailer
2. Run database migration
3. Configure email
4. Test it

Then move to frontend implementation!

---

**Time Required:** 10-15 minutes  
**Difficulty:** Easy  
**Risk:** Low (fully reversible)

**Let's go! 🚀**
