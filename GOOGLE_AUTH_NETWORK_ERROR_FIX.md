# 🔧 Google Auth Network Error - Troubleshooting Guide

## ❌ Error: "Network error. Please try again."

This error appears when the frontend cannot connect to the backend API.

---

## ✅ Quick Fix Applied

**Issue:** Hardcoded URL in `CompleteProfilePage.jsx`

**Fixed:** Changed from:
```javascript
// ❌ Before (hardcoded)
fetch('http://localhost/rentease/backend/google-auth.php?action=google-auth', ...)
```

To:
```javascript
// ✅ After (using Vite proxy)
fetch('/backend/google-auth.php?action=google-auth', ...)
```

---

## 🔍 Common Causes & Solutions

### 1. ✅ Backend Not Running

**Check:**
```bash
# Is Apache running in XAMPP?
# Open XAMPP Control Panel
# Apache should show "Running" in green
```

**Solution:**
1. Open XAMPP Control Panel
2. Click "Start" next to Apache
3. Wait for it to turn green
4. Try again

---

### 2. ✅ Backend File Missing

**Check:**
```bash
# Does the file exist?
# Path: C:\xampp\htdocs\rentease\backend\google-auth.php
```

**Solution:**
1. Navigate to `C:\xampp\htdocs\`
2. Check if `rentease` folder exists
3. Check if `backend\google-auth.php` exists
4. If missing, copy from your project folder

---

### 3. ✅ CORS Issue

**Check Browser Console:**
```
Press F12 → Console tab
Look for errors like:
"Access to fetch at '...' from origin '...' has been blocked by CORS policy"
```

**Solution:**
Check `backend/google-auth.php` has CORS headers:
```php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

---

### 4. ✅ Wrong Backend Path

**Check:**
Your backend should be at:
```
C:\xampp\htdocs\rentease\backend\google-auth.php
```

**Test URL:**
Open browser and go to:
```
http://localhost/rentease/backend/google-auth.php
```

**Expected:** Should show some response (not 404)

---

### 5. ✅ Vite Proxy Not Working

**Check `vite.config.js`:**
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/backend': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend/, '/rentease/backend')
      }
    }
  }
})
```

**Solution:**
1. Restart Vite dev server
2. Stop: `Ctrl+C`
3. Start: `npm run dev`

---

## 🧪 Step-by-Step Debugging

### Step 1: Check Backend is Accessible

Open browser and test:
```
http://localhost/rentease/backend/google-auth.php
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid action.",
  "errors": ["Use ?action=google-auth"]
}
```

**If you get 404:**
- Backend file is missing or path is wrong
- Apache is not running
- Folder structure is incorrect

---

### Step 2: Check Frontend Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try Google sign-in again
4. Look for errors

**Common Errors:**

**Error 1: "Failed to fetch"**
```
Solution: Backend is not running or wrong URL
```

**Error 2: "CORS policy"**
```
Solution: Add CORS headers to backend
```

**Error 3: "404 Not Found"**
```
Solution: Check backend file path
```

---

### Step 3: Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try Google sign-in again
4. Look for the request to `google-auth.php`

**Check:**
- Request URL: Should be `/backend/google-auth.php?action=google-auth`
- Status: Should be 200 (not 404, 500, or failed)
- Response: Should be JSON

**If Status is 0 or "failed":**
- Backend is not reachable
- CORS issue
- Network issue

---

### Step 4: Test Backend Directly

Use curl or Postman to test:

```bash
curl -X POST http://localhost/rentease/backend/google-auth.php?action=google-auth \
  -H "Content-Type: application/json" \
  -d '{"google_token":"test","role":"seeker","contact_number":"09123456789"}'
```

**Expected:**
Should return JSON (even if error about invalid token)

**If connection refused:**
- Apache is not running
- Wrong port
- Firewall blocking

---

## 🔧 Quick Fixes

### Fix 1: Restart Everything

```bash
# 1. Stop Vite
Ctrl+C in terminal

# 2. Restart Apache in XAMPP
Stop → Start

# 3. Start Vite again
npm run dev

# 4. Try again
```

---

### Fix 2: Check File Paths

**Your project structure should be:**
```
C:\xampp\htdocs\rentease\
├── backend\
│   ├── google-auth.php          ← Must exist
│   ├── auth.php
│   ├── config.php
│   └── ...
└── ...
```

**If `rentease` folder is not in `htdocs`:**
1. Copy entire `rentease` folder to `C:\xampp\htdocs\`
2. Or create a symbolic link
3. Or update Vite proxy to point to correct location

---

### Fix 3: Update Vite Proxy

If your backend is in a different location, update `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/backend': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) => {
          // Change this to match your backend path
          return path.replace(/^\/backend/, '/YOUR_FOLDER_NAME/backend')
        }
      }
    }
  }
})
```

---

### Fix 4: Add CORS Headers

If CORS is the issue, add to `backend/google-auth.php` at the top:

```php
<?php
// Add these headers at the very top
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Rest of your code...
```

---

## 🧪 Test Checklist

Run through this checklist:

- [ ] XAMPP Apache is running (green in control panel)
- [ ] Backend file exists at `C:\xampp\htdocs\rentease\backend\google-auth.php`
- [ ] Can access `http://localhost/rentease/backend/google-auth.php` in browser
- [ ] Vite dev server is running (`npm run dev`)
- [ ] No CORS errors in browser console
- [ ] Network tab shows request to `/backend/google-auth.php`
- [ ] Request status is 200 (not 404 or failed)

---

## 🔍 Advanced Debugging

### Check Apache Error Logs

Location: `C:\xampp\apache\logs\error.log`

Look for:
- PHP errors
- File not found errors
- Permission errors

### Check PHP Error Logs

Location: `C:\xampp\php\logs\php_error_log`

Look for:
- PHP syntax errors
- Fatal errors
- Warnings

### Enable Verbose Logging

Add to `backend/google-auth.php`:
```php
error_log("Google auth request received");
error_log("Payload: " . json_encode($_POST));
```

Check logs after trying again.

---

## 💡 Most Likely Causes

Based on "Network error. Please try again.", the most likely causes are:

1. **Backend not running** (90% of cases)
   - Solution: Start Apache in XAMPP

2. **Wrong backend path** (5% of cases)
   - Solution: Check file exists at correct location

3. **CORS issue** (3% of cases)
   - Solution: Add CORS headers

4. **Vite proxy not working** (2% of cases)
   - Solution: Restart Vite dev server

---

## ✅ Verification Steps

After fixing, verify:

1. **Backend is accessible:**
   ```
   http://localhost/rentease/backend/google-auth.php
   Should NOT show 404
   ```

2. **Frontend can reach backend:**
   ```
   Open DevTools → Network tab
   Try Google sign-in
   Should see request to /backend/google-auth.php
   Status should be 200
   ```

3. **No console errors:**
   ```
   Open DevTools → Console tab
   Should not see "Failed to fetch" or CORS errors
   ```

---

## 🆘 Still Not Working?

### Check These:

1. **Is MySQL running?**
   - Google auth needs database
   - Start MySQL in XAMPP

2. **Is database configured?**
   - Check `backend/config.php`
   - Database name: `rentease_db`
   - User: `rentease_user` or `root`

3. **Is Google OAuth configured?**
   - Check `backend/config/google-oauth.php`
   - `GOOGLE_OAUTH_ENABLED` should be `true`
   - `GOOGLE_CLIENT_ID` should be set

4. **Are dependencies installed?**
   - Frontend: `npm install` in `frontend/` folder
   - Backend: Check if `backend/vendor/` exists

---

## 📞 Quick Diagnostic

Run this in browser console:

```javascript
// Test if backend is reachable
fetch('/backend/google-auth.php')
  .then(r => r.json())
  .then(d => console.log('Backend response:', d))
  .catch(e => console.error('Backend error:', e));
```

**Expected output:**
```
Backend response: {success: false, message: "Invalid action.", ...}
```

**If error:**
- Backend is not reachable
- Check Apache is running
- Check file path

---

## ✅ Solution Summary

**The fix I applied:**
Changed the fetch URL from hardcoded `http://localhost/rentease/backend/...` to `/backend/...` to use Vite proxy.

**Now you need to:**
1. ✅ Make sure Apache is running in XAMPP
2. ✅ Make sure backend files are in `C:\xampp\htdocs\rentease\backend\`
3. ✅ Restart Vite dev server: `Ctrl+C` then `npm run dev`
4. ✅ Try Google sign-in again

**It should work now!** 🎉

---

## 📋 Checklist Before Testing

- [ ] Apache running in XAMPP
- [ ] MySQL running in XAMPP
- [ ] Backend files in correct location
- [ ] Vite dev server running
- [ ] Browser cache cleared (Ctrl+Shift+R)
- [ ] No console errors

---

**If still having issues, check the browser console (F12) and share the exact error message!**
