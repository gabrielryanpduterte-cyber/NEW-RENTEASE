# Google Auth Debug Guide

## Current Issue
Existing Google users are still being redirected to Complete Profile page instead of going directly to dashboard.

## Let's Debug Step by Step

### Step 1: Check Your Database
Open phpMyAdmin and run:
```sql
SELECT user_id, full_name, email, google_id, role, auth_provider 
FROM users 
WHERE email = 'gabrielryanpduterte@gmail.com';
```

**Expected Result:**
- Should show your user with a `google_id` value
- `auth_provider` should be 'google'

### Step 2: Test Backend Directly

Open browser console (F12) and run:
```javascript
// Get your Google token (you'll need to click "Continue with Google" first)
// Then in the Complete Profile page, check the console for the token

// Test the endpoint
fetch('/backend/google-auth.php?action=google-auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    google_token: 'YOUR_TOKEN_HERE'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

### Step 3: Check Browser Console

When you click "Continue with Google":
1. Open browser console (F12)
2. Go to Console tab
3. Click "Continue with Google"
4. Look for these messages:
   - "Auto-login error:" - means the check failed
   - Response data from backend

### Step 4: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Continue with Google"
4. Look for request to `google-auth.php`
5. Click on it
6. Check:
   - Request payload (should have google_token)
   - Response (what did backend return?)

## Possible Issues

### Issue 1: Google Token Expires Too Fast
**Symptom**: Works first time, fails on retry
**Solution**: Google tokens expire quickly, need to get fresh token each time

### Issue 2: Backend Not Recognizing Existing User
**Symptom**: Always shows Complete Profile form
**Check**: 
- Is `google_id` in database?
- Does it match the Google ID from token?

### Issue 3: Session Not Being Created
**Symptom**: Backend says success but still shows form
**Check**: 
- Is `login_user()` being called?
- Is session being created?

## Quick Test

### Delete your user and try fresh:
```sql
DELETE FROM users WHERE email = 'gabrielryanpduterte@gmail.com';
```

Then:
1. Click "Continue with Google"
2. Fill Complete Profile (role + contact)
3. Submit
4. Should go to dashboard
5. Logout
6. Click "Continue with Google" again
7. **Should go DIRECTLY to dashboard** (no form)

If step 7 fails, there's a bug.

## Manual Test of Backend Logic

Create file: `backend/test-google-check.php`
```php
<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/config/google-oauth.php';

// Replace with your actual google_id from database
$testGoogleId = '109882252274703342130';

$query = db()->prepare('SELECT * FROM users WHERE google_id = :google_id LIMIT 1');
$query->execute([':google_id' => $testGoogleId]);
$user = $query->fetch();

if ($user) {
    echo "✅ User found!\n";
    echo "User ID: " . $user['user_id'] . "\n";
    echo "Role: " . $user['role'] . "\n";
    echo "Email: " . $user['email'] . "\n";
} else {
    echo "❌ User NOT found with google_id: $testGoogleId\n";
}
?>
```

Visit: http://localhost/rentease/backend/test-google-check.php

## What Should Happen

### For NEW User:
```
1. Click "Continue with Google"
2. Page shows "Checking account..."
3. Backend: User not found
4. Page shows Complete Profile form
5. Fill role + contact
6. Submit
7. Backend: Create user + login
8. Redirect to dashboard ✅
```

### For EXISTING User:
```
1. Click "Continue with Google"
2. Page shows "Checking account..."
3. Backend: User found! Login them.
4. Redirect to dashboard ✅
5. NO FORM SHOWN ✅
```

## Current Behavior (Bug)

Both new and existing users see the Complete Profile form.

## Root Cause

Need to check:
1. Is the auto-login attempt in CompleteProfilePage actually running?
2. Is it getting a success response?
3. Is the redirect happening?

Add console.log to see what's happening!
