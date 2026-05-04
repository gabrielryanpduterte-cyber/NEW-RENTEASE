# ✅ EMAIL VERIFICATION - QUICK FIX

## 🔴 **PROBLEM:**
"Please verify your email address before logging in" but no email received.

---

## ⚡ **FASTEST FIX (Choose One):**

### **Option 1: One-Click Auto-Verify (30 seconds)**

Visit this URL in your browser:
```
http://localhost/rentease/backend/auto-verify-users.php
```

✅ **Done!** All users are now verified. Try logging in!

---

### **Option 2: Manual SQL (1 minute)**

1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Click `rentease_db`
3. Click **SQL** tab
4. Paste this:

```sql
UPDATE users SET email_verified = 1;
```

5. Click **"Go"**

✅ **Done!** Try logging in!

---

### **Option 3: Disable Verification (2 minutes)**

Edit: `backend/config/features.php`

Change line 19:
```php
define('REQUIRE_EMAIL_VERIFICATION', false);
```

✅ **Done!** Users can login without verification!

---

## 📧 **WHY NO EMAILS?**

PHP `mail()` doesn't work on Windows/XAMPP without a mail server.

**Solutions:**
- ✅ Use the quick fixes above (recommended for testing)
- 📧 Configure Gmail SMTP (for production)
- 📧 Use Mailtrap (for testing emails)

---

## 🎯 **RECOMMENDED:**

**For Testing/Development:**
Use **Option 1** (one-click) or **Option 2** (SQL)

**For Production:**
Configure Gmail SMTP (see `EMAIL_FIX_GUIDE.md`)

---

## ✅ **AFTER FIXING:**

1. ✅ Visit: http://localhost:5173/login
2. ✅ Enter your email and password
3. ✅ Select your role
4. ✅ Click "Sign In"
5. ✅ You're in! 🎉

---

**Choose Option 1 for the fastest fix!** 🚀
