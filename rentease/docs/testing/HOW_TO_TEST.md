# 🧪 How to Test Email Verification - Step by Step

## Quick Start (3 Methods)

---

## Method 1: Run Automated Tests (Easiest) ⭐

### Step 1: Open PowerShell
```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\scripts"
```

### Step 2: Run the Test Script
```powershell
.\phase10-onboarding-smoke-test.ps1
```

### Expected Output:
```
[phase10-onboarding] PASS [1] Unauthenticated session check
[phase10-onboarding] PASS [2] Register seeker
[phase10-onboarding] PASS [3] Register parent
[phase10-onboarding] PASS [4] Register owner
[phase10-onboarding] PASS [5] Role mismatch login rejected
[phase10-onboarding] PASS [6] Seeker login with explicit role
...
[phase10-onboarding] All Phase 10 onboarding smoke tests passed (15 checks).
```

✅ **If all tests pass, email verification is working!**

---

## Method 2: Test with Browser (Visual) 🌐

### Step 1: Start Frontend
```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\frontend"
npm run dev
```

### Step 2: Open Browser
Go to: http://localhost:5173

### Step 3: Register New User
1. Click **"Register"** or **"Sign Up"**
2. Fill in the form:
   - Full Name: `Test User`
   - Email: `testuser@example.com`
   - Password: `password123`
   - Role: Select **"Seeker"**
   - Contact Number: `09123456789`
3. Click **"Register"**

### Step 4: Check Response
You should see:
- ✅ Success message
- ✅ "Registration successful" or similar
- ✅ User account created

### Step 5: Login
1. Go to **Login** page
2. Enter:
   - Email: `testuser@example.com`
   - Password: `password123`
   - Role: **Seeker**
3. Click **Login**

✅ **If login works, email verification is working!**

---

## Method 3: Test with cURL (Command Line) 💻

### Test 1: Register New User

```powershell
curl -X POST http://localhost/rentease/backend/auth.php?action=register `
  -H "Content-Type: application/json" `
  -d '{
    "full_name": "John Doe",
    "email": "john.doe@example.com",
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
    "user_id": 10,
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "role": "seeker"
  }
}
```

✅ **Success!**

---

### Test 2: Login with New User

```powershell
curl -X POST http://localhost/rentease/backend/auth.php?action=login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "john.doe@example.com",
    "password": "password123",
    "role": "seeker"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user_id": 10,
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "role": "seeker"
  }
}
```

✅ **Success!**

---

### Test 3: Check Database

```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root rentease_db -e "SELECT user_id, full_name, email, email_verified FROM users WHERE email = 'john.doe@example.com';"
```

**Expected Output:**
```
user_id | full_name | email                  | email_verified
10      | John Doe  | john.doe@example.com   | 1
```

✅ **User created with email_verified = 1** (auto-verified in TEST MODE)

---

### Test 4: Test Password Reset

```powershell
curl -X POST http://localhost/rentease/backend/forgot-password.php `
  -H "Content-Type: application/json" `
  -d '{
    "email": "john.doe@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset email sent.",
  "data": {
    "message": "If the email exists, a password reset link has been sent to your email address."
  }
}
```

✅ **Password reset works!**

---

### Test 5: Check Reset Token in Database

```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root rentease_db -e "SELECT user_id, email, password_reset_token FROM users WHERE email = 'john.doe@example.com';"
```

**Expected Output:**
```
user_id | email                  | password_reset_token
10      | john.doe@example.com   | abc123def456... (64 characters)
```

✅ **Reset token generated!**

---

### Test 6: Reset Password with Token

```powershell
# First, get the token from database (from Test 5)
# Then use it here:

curl -X POST http://localhost/rentease/backend/reset-password.php `
  -H "Content-Type: application/json" `
  -d '{
    "token": "paste-token-from-database-here",
    "new_password": "newpassword123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset successful!",
  "data": {
    "message": "Your password has been reset successfully. You can now login with your new password."
  }
}
```

✅ **Password reset complete!**

---

### Test 7: Login with New Password

```powershell
curl -X POST http://localhost/rentease/backend/auth.php?action=login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "john.doe@example.com",
    "password": "newpassword123",
    "role": "seeker"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful."
}
```

✅ **Login with new password works!**

---

## Complete Test Checklist

Run through this checklist:

### Registration & Login
- [ ] Register new user → Success
- [ ] User appears in database → Yes
- [ ] User has email_verified = 1 → Yes
- [ ] Login with new user → Success
- [ ] Login with wrong password → Fails correctly
- [ ] Login with wrong role → Fails correctly

### Email Verification Endpoints
- [ ] Register user → Creates verification token
- [ ] Call verify-email.php → Verifies email
- [ ] Call resend-verification.php → Works
- [ ] Verification token expires after 24h → Configured

### Password Reset
- [ ] Call forgot-password.php → Success
- [ ] Reset token created in database → Yes
- [ ] Call reset-password.php with token → Success
- [ ] Login with new password → Success
- [ ] Old password doesn't work → Correct

### Security
- [ ] Can't reset with expired token → Blocked
- [ ] Can't reuse old password → Blocked
- [ ] Rate limiting works (3 emails/hour) → Configured
- [ ] Invalid tokens rejected → Yes

---

## Quick Test Script

Save this as `test-all.ps1`:

```powershell
Write-Host "Testing Email Verification System..." -ForegroundColor Cyan

# Test 1: Register
Write-Host "`n[1/4] Testing Registration..." -ForegroundColor Yellow
$register = Invoke-WebRequest -Uri "http://localhost/rentease/backend/auth.php?action=register" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"full_name":"Test User","email":"quicktest@example.com","password":"password123","role":"seeker","contact_number":"09123456789"}' `
    -UseBasicParsing

$regResult = $register.Content | ConvertFrom-Json
if ($regResult.success) {
    Write-Host "✅ Registration successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Registration failed: $($regResult.message)" -ForegroundColor Red
}

# Test 2: Login
Write-Host "`n[2/4] Testing Login..." -ForegroundColor Yellow
$login = Invoke-WebRequest -Uri "http://localhost/rentease/backend/auth.php?action=login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"quicktest@example.com","password":"password123","role":"seeker"}' `
    -UseBasicParsing

$loginResult = $login.Content | ConvertFrom-Json
if ($loginResult.success) {
    Write-Host "✅ Login successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Login failed: $($loginResult.message)" -ForegroundColor Red
}

# Test 3: Password Reset Request
Write-Host "`n[3/4] Testing Password Reset Request..." -ForegroundColor Yellow
$forgot = Invoke-WebRequest -Uri "http://localhost/rentease/backend/forgot-password.php" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"quicktest@example.com"}' `
    -UseBasicParsing

$forgotResult = $forgot.Content | ConvertFrom-Json
if ($forgotResult.success) {
    Write-Host "✅ Password reset request successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Password reset failed: $($forgotResult.message)" -ForegroundColor Red
}

# Test 4: Check Database
Write-Host "`n[4/4] Checking Database..." -ForegroundColor Yellow
$dbCheck = & "C:\xampp\mysql\bin\mysql.exe" -u root rentease_db -e "SELECT user_id, email, email_verified FROM users WHERE email = 'quicktest@example.com';"
Write-Host $dbCheck

Write-Host "`n✅ All tests completed!" -ForegroundColor Green
Write-Host "Check results above for any failures." -ForegroundColor Cyan
```

Run it:
```powershell
.\test-all.ps1
```

---

## Troubleshooting

### Issue: Registration fails
**Check**:
- XAMPP Apache is running
- XAMPP MySQL is running
- Database has Phase 11 schema

**Fix**:
```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root rentease_db < "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\database\phase11_email_verification_schema.sql"
```

### Issue: Login fails
**Check**:
- Using correct credentials
- Including `role` field in request
- User exists in database

**Fix**: See TEST_CREDENTIALS.md for demo accounts

### Issue: Can't access backend
**Check**:
- URL is correct: `http://localhost/rentease/backend/`
- Junction exists: `C:\xampp\htdocs\rentease`

**Fix**:
```powershell
cd scripts
.\phase8-local-setup.ps1
```

---

## What Success Looks Like

### ✅ Registration Success:
```json
{
  "success": true,
  "message": "User registered successfully."
}
```

### ✅ Login Success:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user_id": 10,
    "email": "test@example.com",
    "role": "seeker"
  }
}
```

### ✅ Password Reset Success:
```json
{
  "success": true,
  "message": "Password reset email sent."
}
```

### ✅ Email Verification Success:
```json
{
  "success": true,
  "message": "Email verified successfully!"
}
```

---

## Summary

### Easiest Way to Test:
```powershell
# Just run this!
cd scripts
.\phase10-onboarding-smoke-test.ps1
```

### Most Visual Way:
1. Open http://localhost:5173
2. Register new user
3. Login
4. Done!

### Most Detailed Way:
- Use cURL commands above
- Check database after each step
- Verify all endpoints work

---

**Pick any method and start testing!** 🚀

All three methods test the same functionality - choose what's easiest for you!
