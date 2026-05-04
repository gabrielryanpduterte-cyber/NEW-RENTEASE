# Quick Test - Google OAuth

## ✅ Pre-Test Checklist

- [ ] XAMPP Apache is running (green)
- [ ] XAMPP MySQL is running (green)
- [ ] Frontend dev server running: `npm run dev`
- [ ] Browser at: http://localhost:5173

## 🧪 Test Google OAuth

### Step 1: Access the App
1. Go to: http://localhost:5173
2. Should see landing page with "Get Started" button

### Step 2: Try Google Sign-In
1. Click "Get Started" or "Sign In"
2. Click "Continue with Google" button
3. **Expected**: Google popup appears

### Step 3: Select Google Account
1. Choose your Google account
2. **Expected**: Redirects to Complete Profile page

### Step 4: Complete Profile
1. Should see your Google profile picture
2. Should see your name and email
3. Select role: Seeker/Parent/Owner
4. Enter contact number: 09123456789
5. Click "Complete Registration"
6. **Expected**: Redirects to dashboard

### Step 5: Verify Login
1. Should be logged in
2. Should see your dashboard
3. Should see your name in sidebar/header

## ❌ If Google Button Shows Error

**Error**: "The given origin is not allowed for the given client ID"

**Fix**:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized JavaScript origins", add:
   - `http://localhost:5173`
4. Under "Authorized redirect URIs", add:
   - `http://localhost:5173/auth/google/callback`
5. Click "Save"
6. Wait 5 minutes
7. Clear browser cache (Ctrl+Shift+Delete)
8. Try again

## ✅ Success Indicators

- ✅ Google popup opens
- ✅ Can select Google account
- ✅ Redirects to Complete Profile
- ✅ Shows Google info (name, email, picture)
- ✅ Can submit form
- ✅ Redirects to dashboard
- ✅ User is logged in

## 🔍 Debugging

### Check Browser Console (F12 → Console):
- Look for errors
- Should NOT see "403" or "origin not allowed"

### Check Network Tab (F12 → Network):
- Look for request to `/backend/google-auth.php`
- Should return status 200 or 201
- Should have `success: true` in response

### Check Backend:
- Test: http://localhost/rentease/backend/google-auth.php
- Should show: `{"success":false,"message":"Invalid action."...}`
- If 404: Backend path is wrong

## 📝 Test Results

After testing, you should be able to:
- ✅ Sign in with Google
- ✅ Complete profile
- ✅ Access dashboard
- ✅ See your Google profile picture
- ✅ Logout and login again with Google

## 🎯 Next Steps After Success

1. Test with different roles (Seeker, Parent, Owner)
2. Test account linking (register with email, then link Google)
3. Test logout and re-login with Google
4. Verify user data in database (phpMyAdmin)
