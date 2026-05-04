# 🧪 QUICK TEST GUIDE - Email Verification

## Start Here - 5 Minute Test

---

## Step 1: Start Everything (2 minutes)

### Start XAMPP:
1. Open XAMPP Control Panel
2. Click "Start" for **Apache**
3. Click "Start" for **MySQL**
4. Wait for green indicators

### Start Frontend:
```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\frontend"
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

## Step 2: Test Registration (1 minute)

1. Open browser: `http://localhost:5173`
2. Click **"Create account"** or go to `/register`
3. Fill in form:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
   - Role: `Seeker`
   - Contact: `09123456789`
4. Click **"Register"**

### ✅ Expected Result:
```
✓ Registration Successful!

We've sent a verification link to:
test@example.com

Please check your inbox and click the verification link...

[Go to Login] [Resend Verification Email]
```

### ❌ If you see auto-login instead:
- Check `backend/config/features.php`
- Make sure `REQUIRE_EMAIL_VERIFICATION = true`

---

## Step 3: Get Verification Token (30 seconds)

### Option A: phpMyAdmin
1. Go to: `http://localhost/phpmyadmin`
2. Click `rentease_db`
3. Click `users` table
4. Find your test user
5. Copy the `verification_token` value

### Option B: MySQL Command
```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root rentease_db -e "SELECT email, verification_token FROM users WHERE email = 'test@example.com';"
```

**Copy the token** (64-character string)

---

## Step 4: Test Verification (30 seconds)

1. In browser, go to:
   ```
   http://localhost:5173/verify-email/PASTE-TOKEN-HERE
   ```

### ✅ Expected Result:
```
Verifying your email...
(spinner)

Then:

✓ Email Verified!

Your email has been verified. You can now login to your account.

[Go to Login]
```

---

## Step 5: Test Login (30 seconds)

1. Click **"Go to Login"** or go to `/login`
2. Enter:
   - Email: `test@example.com`
   - Password: `password123`
   - Role: `Seeker`
3. Click **"Login"**

### ✅ Expected Result:
- Redirected to seeker dashboard
- Logged in successfully

---

## Step 6: Test Unverified Login (1 minute)

1. Register another user (don't verify):
   - Email: `unverified@example.com`
   - Password: `password123`
2. Try to login with this user

### ✅ Expected Result:
```
❌ Your email address has not been verified. 
Please check your inbox for the verification link.

Need a new verification link?
[Resend Verification Email]
```

3. Click **"Resend Verification Email"**

### ✅ Expected Result:
- Email field pre-filled with `unverified@example.com`
- Can send new verification email

---

## Step 7: Test Password Reset (1 minute)

1. Go to login page
2. Click **"Forgot your password?"**
3. Enter email: `test@example.com`
4. Click **"Send Reset Link"**

### ✅ Expected Result:
```
✓ Email Sent!

If the email exists, a password reset link has been sent...

[Go to Login]
```

5. Get reset token from database:
```sql
SELECT email, password_reset_token FROM users WHERE email = 'test@example.com';
```

6. Go to: `http://localhost:5173/reset-password/PASTE-TOKEN-HERE`

### ✅ Expected Result:
```
Validating reset link...

Then:

Reset Password

Enter your new password below.

[New Password input]
[Confirm Password input]

[Reset Password button]
```

7. Enter new password: `newpassword123`
8. Confirm password: `newpassword123`
9. Click **"Reset Password"**

### ✅ Expected Result:
```
✓ Password Reset Successful!

Your password has been reset successfully...

Redirecting to login page...

[Go to Login Now]
```

10. Login with new password

### ✅ Expected Result:
- Login successful with new password

---

## ✅ All Tests Passed?

If all 7 steps worked:
- 🎉 **Email Verification is 100% working!**
- 🎉 **Frontend is complete!**
- 🎉 **Backend is complete!**
- 🎉 **Ready for production!**

---

## ❌ Troubleshooting

### Issue: "Registration Successful" message not showing
**Fix:** Check `backend/config/features.php`:
```php
define('REQUIRE_EMAIL_VERIFICATION', true); // Should be true
```

### Issue: "Invalid verification token"
**Fix:** 
- Make sure you copied the full token (64 characters)
- Check token hasn't expired (24 hours)
- Token is case-sensitive

### Issue: "Unable to reach backend server"
**Fix:**
- Make sure XAMPP Apache is running
- Check: `http://localhost/rentease/backend/auth.php?action=me`
- Should return JSON response

### Issue: Frontend not starting
**Fix:**
```powershell
cd frontend
npm install
npm run dev
```

### Issue: "Email not verified" not showing on login
**Fix:** Check backend response in browser console (F12)
- Should see status: 403
- Should see requires_verification: true

---

## 🎯 Quick Verification Commands

### Check if user is verified:
```sql
SELECT email, email_verified FROM users WHERE email = 'test@example.com';
```
- `email_verified = 1` → Verified
- `email_verified = 0` → Not verified

### Check verification token:
```sql
SELECT email, verification_token, verification_token_expires 
FROM users WHERE email = 'test@example.com';
```

### Check reset token:
```sql
SELECT email, password_reset_token, password_reset_expires 
FROM users WHERE email = 'test@example.com';
```

### Manually verify a user:
```sql
UPDATE users SET email_verified = 1 WHERE email = 'test@example.com';
```

---

## 📊 Test Results Template

Copy this and fill in as you test:

```
Email Verification Testing - [DATE]

[ ] Step 1: XAMPP Started
[ ] Step 2: Frontend Started
[ ] Step 3: Registration shows verification message
[ ] Step 4: Verification token in database
[ ] Step 5: Verification link works
[ ] Step 6: Can login after verification
[ ] Step 7: Unverified login blocked
[ ] Step 8: Resend verification works
[ ] Step 9: Password reset request works
[ ] Step 10: Password reset link works
[ ] Step 11: Can login with new password

Issues Found:
- 

Notes:
- 

Status: [ ] PASS  [ ] FAIL
```

---

**Time Required:** 5-10 minutes  
**Difficulty:** Easy  
**Prerequisites:** XAMPP running, Frontend started

**Let's test it! 🚀**
