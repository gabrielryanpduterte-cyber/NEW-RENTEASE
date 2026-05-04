# Google OAuth Setup Guide - RentEase

## ✅ Your Google OAuth is Already Configured!

Your system already has Google OAuth credentials set up:
- **Client ID**: `845871313570-a58vib4ul9bap6euavssl4s0t5gehe4u.apps.googleusercontent.com`
- **Client Secret**: `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`

## 🎯 How Google Auth Works in Your System

### User Flow:
1. **User clicks "Continue with Google"** on Login/Register page
2. **Google popup appears** → User selects their Google account
3. **Redirected to Complete Profile page** with Google info pre-filled:
   - Name (from Google)
   - Email (from Google)
   - Profile Picture (from Google)
4. **User fills required fields**:
   - Select Role (Seeker/Parent/Owner)
   - Enter Contact Number
5. **Submit** → Account created → Auto-login → Dashboard

### What Google Provides:
- ✅ Full Name
- ✅ Email Address
- ✅ Profile Picture
- ✅ Email Verification (Google already verified)

### What User Must Provide:
- ⚠️ Role Selection (Seeker/Parent/Owner)
- ⚠️ Contact Number (Required by your database)

## 🔧 Current Configuration

### Frontend (`frontend/src/config/google-oauth.js`):
```javascript
clientId: '845871313570-a58vib4ul9bap6euavssl4s0t5gehe4u.apps.googleusercontent.com'
```

### Backend (`backend/config/google-oauth.php`):
```php
GOOGLE_CLIENT_ID: '845871313570-a58vib4ul9bap6euavssl4s0t5gehe4u.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET: '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'
GOOGLE_OAUTH_ENABLED: true
GOOGLE_AUTO_VERIFY_EMAIL: true
GOOGLE_ALLOW_ADMIN_ROLE: false (security)
```

## 🚀 Testing Google OAuth

### Test the Flow:
1. Start your dev server: `npm run dev`
2. Make sure XAMPP Apache & MySQL are running
3. Go to: http://localhost:5173
4. Click "Get Started" or "Sign In"
5. Click "Continue with Google" button
6. Select your Google account
7. Complete profile with role and contact number
8. Should redirect to dashboard

### Expected Behavior:
- ✅ Google popup opens
- ✅ User selects account
- ✅ Redirects to Complete Profile page
- ✅ Shows Google name, email, picture
- ✅ User selects role and enters phone
- ✅ Submits → Creates account → Auto-login → Dashboard

## ⚠️ Common Issues & Fixes

### Issue 1: "The given origin is not allowed"
**Cause**: Your domain is not authorized in Google Cloud Console

**Fix**:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Add to "Authorized JavaScript origins":
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
4. Add to "Authorized redirect URIs":
   - `http://localhost:5173/auth/google/callback`
5. Save changes
6. Wait 5 minutes for changes to propagate
7. Clear browser cache and try again

### Issue 2: Google button doesn't appear
**Cause**: Missing npm package

**Fix**:
```bash
cd frontend
npm install @react-oauth/google
```

### Issue 3: "Network error" after completing profile
**Cause**: Backend not running or wrong path

**Fix**:
1. Make sure Apache is running in XAMPP
2. Check backend is at: `C:\xampp\htdocs\rentease\backend\`
3. Test backend: http://localhost/rentease/backend/google-auth.php
   - Should show: `{"success":false,"message":"Invalid action."...}`

### Issue 4: 500 Internal Server Error
**Cause**: Database issue or missing columns

**Fix**:
1. Check database has these columns in `users` table:
   - `google_id` (VARCHAR)
   - `profile_picture` (TEXT)
   - `auth_provider` (VARCHAR)
   - `email_verified` (TINYINT)
2. Run database migration if needed

## 📋 Database Schema Required

Your `users` table needs these columns for Google Auth:
```sql
google_id VARCHAR(255) NULL
profile_picture TEXT NULL
auth_provider VARCHAR(50) DEFAULT 'local'
email_verified TINYINT(1) DEFAULT 1
```

## 🔐 Security Features

1. **Admin Role Blocked**: Users cannot create admin accounts via Google OAuth
2. **Email Auto-Verified**: Google users are auto-verified (Google already verified them)
3. **Token Verification**: Backend verifies Google token with Google API
4. **Role Validation**: Only seeker/parent/owner roles allowed
5. **Account Linking**: If email exists, links Google account to existing account

## 🎨 UI Components

### Login Page:
- Email/Password form
- "OR" divider
- Google Sign-In button

### Register Page:
- Registration form
- "OR" divider
- Google Sign-In button

### Complete Profile Page:
- Shows Google profile picture
- Shows Google name and email
- Role dropdown (Seeker/Parent/Owner)
- Contact number input
- Submit button

## ✅ What's Already Working

Your Google OAuth setup is complete! All you need to do is:

1. **Verify Google Cloud Console settings** (authorized origins)
2. **Test the flow** (click "Continue with Google")
3. **Complete profile** (select role + contact number)
4. **Done!** User is registered and logged in

## 🆘 Still Having Issues?

Check browser console (F12 → Console) for detailed error messages.

Most common fix: Add `http://localhost:5173` to authorized origins in Google Cloud Console.
