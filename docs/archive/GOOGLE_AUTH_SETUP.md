# 🔵 Google Authentication Setup Guide

## ✅ What's Been Implemented

Your RentEase system now has **Google OAuth Authentication** ("Sign in with Google")!

### Files Created:

**Backend:**
- `backend/google-auth.php` - Google OAuth API endpoint
- `backend/config/google-oauth.php` - Google OAuth configuration
- `database/phase12_google_oauth_schema.sql` - Database migration

**Frontend:**
- `frontend/src/components/GoogleSignInButton.jsx` - Google Sign-In button component
- `frontend/src/config/google-oauth.js` - Frontend Google config
- Updated `LoginPage.jsx` and `RegisterPage.jsx` with Google button
- Updated `main.jsx` with GoogleOAuthProvider
- Added CSS styles for Google UI

---

## 🚀 Setup Steps (15 minutes)

### Step 1: Run Database Migration

Open phpMyAdmin and run this SQL:

```sql
-- Run this in your rentease database
SOURCE C:/Users/gabri/OneDrive/Desktop/NEW RENTEASE/rentease/database/phase12_google_oauth_schema.sql;
```

Or copy-paste the SQL from `phase12_google_oauth_schema.sql` into phpMyAdmin SQL tab.

**This adds:**
- `google_id` column (stores Google user ID)
- `profile_picture` column (stores Google profile pic URL)
- `auth_provider` column (tracks if user uses 'local' or 'google' auth)
- Makes `password_hash` optional (Google users don't need passwords)

---

### Step 2: Create Google Cloud Project

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/

2. **Create New Project:**
   - Click "Select a project" → "New Project"
   - Project name: `RentEase`
   - Click "Create"

3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

---

### Step 3: Create OAuth Credentials

1. **Go to Credentials:**
   - "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"

2. **Configure OAuth Consent Screen** (if prompted):
   - User Type: "External"
   - App name: `RentEase`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Skip (click "Save and Continue")
   - Test users: Add your Gmail (click "Save and Continue")

3. **Create OAuth Client ID:**
   - Application type: "Web application"
   - Name: `RentEase Web Client`
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:5173
   http://localhost:5173/auth/google/callback
   ```
   
   - Click "Create"

4. **Copy Credentials:**
   - You'll see a popup with:
     - **Client ID**: `123456789-abc...xyz.apps.googleusercontent.com`
     - **Client Secret**: `<client secret>`
   - Copy both (you'll need them next)

---

### Step 4: Configure Backend

Edit `backend/config/google-oauth.php`:

```php
<?php
// Replace with YOUR credentials from Google Cloud Console
define('GOOGLE_CLIENT_ID', 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', 'YOUR_CLIENT_SECRET_HERE');

// Keep these as-is
define('GOOGLE_OAUTH_ENABLED', true);
define('GOOGLE_REDIRECT_URI', 'http://localhost:5173/auth/google/callback');
define('GOOGLE_AUTO_VERIFY_EMAIL', true);
define('GOOGLE_ALLOW_ADMIN_ROLE', false);
define('GOOGLE_DEFAULT_ROLE', 'seeker');
?>
```

---

### Step 5: Configure Frontend

Edit `frontend/src/config/google-oauth.js`:

```javascript
export const GOOGLE_CONFIG = {
  // Replace with YOUR Client ID from Google Cloud Console
  clientId: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
  
  // Keep these as-is
  redirectUri: 'http://localhost:5173/auth/google/callback',
  scope: 'openid email profile',
};
```

---

### Step 6: Test It!

1. **Start XAMPP:**
   - Apache: Running
   - MySQL: Running

2. **Start Frontend:**
   ```bash
   cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\frontend"
   npm run dev
   ```

3. **Open Browser:**
   - Go to: http://localhost:5173/login

4. **Test Google Sign-In:**
   - Click "Continue with Google" button
   - Google popup appears
   - Login with your Google account
   - Select role (Seeker/Owner/Parent)
   - Enter phone number
   - Click "Complete Registration"
   - ✅ You're logged in!

---

## 🎯 How It Works

### First-Time Google User:

```
User clicks "Continue with Google"
    ↓
Google login popup
    ↓
User logs in with Google
    ↓
Modal appears: "Complete Your Profile"
    ↓
User selects role (Seeker/Owner/Parent)
    ↓
User enters phone number
    ↓
Account created in database
    ↓
Auto-login → Dashboard ✅
```

### Returning Google User:

```
User clicks "Continue with Google"
    ↓
Google login popup
    ↓
User logs in with Google
    ↓
System finds existing account
    ↓
Auto-login → Dashboard ✅
(No role selection needed!)
```

### Existing Local User:

```
User has account with email/password
    ↓
User clicks "Continue with Google"
    ↓
Google login with SAME email
    ↓
System links Google to existing account
    ↓
Auto-login → Dashboard ✅
(Can now use both methods!)
```

---

## 🔒 Security Features

✅ **Email Auto-Verified** - Google already verified the email  
✅ **No Admin via OAuth** - Admin accounts must be created manually  
✅ **Token Verification** - Backend verifies Google token with Google API  
✅ **Role Validation** - Users must select valid role (seeker/owner/parent)  
✅ **Account Linking** - Safely links Google to existing local accounts  

---

## 📊 Database Changes

### New Columns in `users` table:

| Column | Type | Description |
|--------|------|-------------|
| `google_id` | VARCHAR(255) | Google user ID (unique) |
| `profile_picture` | VARCHAR(500) | Google profile picture URL |
| `auth_provider` | VARCHAR(20) | 'local' or 'google' |
| `password_hash` | VARCHAR(255) NULL | Now optional for OAuth users |

### Example User Records:

**Local User:**
```sql
email: john@example.com
password_hash: $2y$10$abc...
auth_provider: local
google_id: NULL
```

**Google User:**
```sql
email: jane@gmail.com
password_hash: NULL
auth_provider: google
google_id: 123456789012345678901
profile_picture: https://lh3.googleusercontent.com/...
```

**Linked User (both methods):**
```sql
email: bob@gmail.com
password_hash: $2y$10$xyz...
auth_provider: google
google_id: 987654321098765432109
```

---

## 🎨 UI Features

### Login Page:
- Email/password form
- "OR" divider
- "Continue with Google" button
- Google popup for authentication
- Role selection modal for new users

### Register Page:
- Registration form
- "OR" divider
- "Continue with Google" button
- Same Google flow as login

### Modal (New Google Users):
- Shows Google profile picture
- Shows name and email from Google
- Role selection dropdown
- Phone number input
- "Complete Registration" button

---

## 🐛 Troubleshooting

### "Google sign-in failed"
**Fix:** Check that Client ID in both config files matches Google Cloud Console

### "Invalid Google token"
**Fix:** Verify Client ID is correct and matches your Google Cloud project

### "redirect_uri_mismatch" error
**Fix:** Add `http://localhost:5173` to Authorized JavaScript origins in Google Cloud Console

### Modal doesn't appear
**Fix:** Check browser console for errors, ensure `@react-oauth/google` is installed

### Database error
**Fix:** Run the SQL migration in phpMyAdmin first

### "Admin accounts cannot be created via Google OAuth"
**This is intentional!** Admin accounts must be created manually for security.

---

## 📝 Configuration Options

### Backend (`backend/config/google-oauth.php`):

```php
// Enable/disable Google OAuth
define('GOOGLE_OAUTH_ENABLED', true);

// Auto-verify emails from Google (recommended: true)
define('GOOGLE_AUTO_VERIFY_EMAIL', true);

// Allow admin creation via OAuth (recommended: false)
define('GOOGLE_ALLOW_ADMIN_ROLE', false);

// Default role if not specified (fallback)
define('GOOGLE_DEFAULT_ROLE', 'seeker');
```

---

## 🚀 Production Deployment

### When deploying to production:

1. **Update Authorized Origins:**
   - Add your production domain to Google Cloud Console
   - Example: `https://rentease.com`

2. **Update Config Files:**
   ```php
   // backend/config/google-oauth.php
   define('GOOGLE_REDIRECT_URI', 'https://rentease.com/auth/google/callback');
   ```
   
   ```javascript
   // frontend/src/config/google-oauth.js
   redirectUri: 'https://rentease.com/auth/google/callback',
   ```

3. **Verify OAuth Consent Screen:**
   - Change from "Testing" to "In Production"
   - Add privacy policy URL
   - Add terms of service URL

---

## ✅ Testing Checklist

- [ ] Database migration completed
- [ ] Google Cloud project created
- [ ] OAuth credentials configured
- [ ] Backend config updated with Client ID/Secret
- [ ] Frontend config updated with Client ID
- [ ] XAMPP Apache/MySQL running
- [ ] Frontend dev server running
- [ ] Google button appears on login page
- [ ] Google button appears on register page
- [ ] Can click Google button → popup appears
- [ ] Can login with Google account
- [ ] Role selection modal appears for new users
- [ ] Can select role and enter phone number
- [ ] Account created in database
- [ ] Auto-login works after registration
- [ ] Returning users login without role selection
- [ ] Profile picture displays (if available)

---

## 🎉 Success!

Your RentEase system now supports:
- ✅ Traditional email/password login
- ✅ Google OAuth "Sign in with Google"
- ✅ Role-based access (Seeker/Owner/Parent/Admin)
- ✅ Auto-verified emails for Google users
- ✅ Account linking for existing users
- ✅ Secure authentication flow

**No more email verification issues for Google users!** 🚀

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check PHP error log: `C:\xampp\php\logs\php_error_log`
3. Verify all config files have correct Client ID
4. Ensure database migration ran successfully
5. Test with a fresh Google account

---

**Ready to test?** Follow Step 6 above! 🎯
