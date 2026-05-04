# 🎨 Google Auth Visual Flow Diagram

## 🔐 Complete User Journey

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    RENTEASE LOGIN PAGE                          ┃
┃                  http://localhost:5173/login                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Sign in                                │  │
│  │                                                           │  │
│  │  Email:    [your-email@domain.com]                       │  │
│  │  Password: [••••••••••••••••••]                          │  │
│  │  Role:     [Seeker / Boarder ▼]                          │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │              Login                              │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  │                                                           │  │
│  │  ─────────────────── OR ───────────────────              │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │  [G]  Continue with Google                      │ ← CLICK
│  │  └─────────────────────────────────────────────────┘     │  │
│  │                                                           │  │
│  │  Forgot your password?                                    │  │
│  │  No account yet? Create one                               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                  GOOGLE AUTHENTICATION POPUP                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                Choose an account                          │  │
│  │                                                           │  │
│  │  ○  [👤] John Doe                                        │  │
│  │      john.doe@gmail.com                                   │  │
│  │                                                           │  │
│  │  ○  [👤] Jane Smith                                      │  │
│  │      jane.smith@gmail.com                                 │  │
│  │                                                           │  │
│  │  ○  Use another account                                   │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    User selects account
                              ↓
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    BACKEND PROCESSING                           ┃
┃                  google-auth.php endpoint                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────────────────────────────────────────┐
│  System receives:                                               │
│  • Email: john.doe@gmail.com                                    │
│  • Name: John Doe                                               │
│  • Picture: https://lh3.googleusercontent.com/...               │
│  • Google ID: 1234567890                                        │
│  • Email Verified: true                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓
                    🧠 DECISION POINT
                              ↓
                              ↓
              ┌───────────────┴───────────────┐
              │                               │
              │                               │
    ┌─────────▼─────────┐         ┌─────────▼─────────┐
    │  Email exists in  │         │  Email is NEW     │
    │  database?        │         │  (not in DB)      │
    │                   │         │                   │
    │  ✅ YES           │         │  ❌ NO            │
    └─────────┬─────────┘         └─────────┬─────────┘
              │                               │
              │                               │
              ↓                               ↓
              │                               │
┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃   EXISTING USER PATH     ┃   ┃      NEW USER PATH             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
              │                               │
              ↓                               ↓
┌─────────────────────────┐   ┌─────────────────────────────────┐
│  1. Find user in DB     │   │  1. Navigate to:                │
│  2. Verify active       │   │     /complete-profile           │
│  3. Create session      │   │                                 │
│  4. Login user          │   │  2. Pass Google data via state  │
│  5. Return success      │   │     • Name                      │
└─────────────────────────┘   │     • Email                     │
              │                │     • Picture                   │
              │                │     • Token                     │
              ↓                └─────────────────────────────────┘
              │                               │
              │                               ↓
              │                               │
              │               ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
              │               ┃      COMPLETE PROFILE PAGE                  ┃
              │               ┃   http://localhost:5173/complete-profile    ┃
              │               ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
              │               
              │               ┌─────────────────────────────────────────────┐
              │               │  ┌───────────────────────────────────────┐  │
              │               │  │  Complete Your Profile                │  │
              │               │  │  Just one more step to get started    │  │
              │               │  │                                       │  │
              │               │  │  ┌─────────────────────────────────┐  │  │
              │               │  │  │  [👤 Profile Picture]           │  │  │
              │               │  │  │  John Doe                       │  │  │
              │               │  │  │  john.doe@gmail.com             │  │  │
              │               │  │  └─────────────────────────────────┘  │  │
              │               │  │                                       │  │
              │               │  │  I am a:                              │  │
              │               │  │  ┌─────────────────────────────────┐  │  │
              │               │  │  │ Room Seeker                  ▼  │  │  │
              │               │  │  └─────────────────────────────────┘  │  │
              │               │  │  Options:                             │  │
              │               │  │  • Room Seeker                        │  │
              │               │  │  • Parent                             │  │
              │               │  │  • Boarding House Owner               │  │
              │               │  │                                       │  │
              │               │  │  Contact Number:                      │  │
              │               │  │  ┌─────────────────────────────────┐  │  │
              │               │  │  │ 09XXXXXXXXX                     │  │  │
              │               │  │  └─────────────────────────────────┘  │  │
              │               │  │                                       │  │
              │               │  │  ┌─────────────────────────────────┐  │  │
              │               │  │  │  Complete Registration          │  │  │
              │               │  │  └─────────────────────────────────┘  │  │
              │               │  │                                       │  │
              │               │  │  ← Back to Login                      │  │
              │               │  └───────────────────────────────────────┘  │
              │               └─────────────────────────────────────────────┘
              │                               │
              │                               ↓
              │                     User fills form & submits
              │                               ↓
              │                               │
              │               ┌─────────────────────────────────────────────┐
              │               │  Backend creates user:                      │
              │               │  • INSERT INTO users (...)                  │
              │               │  • google_id = '1234567890'                 │
              │               │  • email_verified = 1                       │
              │               │  • auth_provider = 'google'                 │
              │               │  • account_status = 'active'                │
              │               │                                             │
              │               │  Then:                                      │
              │               │  • Create session                           │
              │               │  • Login user automatically                 │
              │               │  • Return success                           │
              │               └─────────────────────────────────────────────┘
              │                               │
              │                               ↓
              │                               │
              │               ┌─────────────────────────────────────────────┐
              │               │  Frontend:                                  │
              │               │  • Refresh auth state (checkAuth)           │
              │               │  • User is now logged in                    │
              │               │  • Navigate to dashboard                    │
              │               └─────────────────────────────────────────────┘
              │                               │
              │                               │
              └───────────────┬───────────────┘
                              ↓
                              ↓
                              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    ROLE-BASED DASHBOARD                         ┃
┃                  User is logged in ✅                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────────────────────────────────────────┐
│  IF role = 'seeker':                                            │
│  → http://localhost:5173/seeker/dashboard                       │
│                                                                 │
│  IF role = 'parent':                                            │
│  → http://localhost:5173/parent/dashboard                       │
│                                                                 │
│  IF role = 'owner':                                             │
│  → http://localhost:5173/owner/dashboard                        │
│                                                                 │
│  IF role = 'admin':                                             │
│  → http://localhost:5173/admin/dashboard                        │
└─────────────────────────────────────────────────────────────────┘

                    ✅ USER IS NOW LOGGED IN
                    ✅ SESSION ACTIVE
                    ✅ CAN USE THE APP
```

---

## 🎯 Key Decision Points

### Decision 1: Email Exists?
```
┌─────────────────────────────────────┐
│  Check database:                    │
│  SELECT * FROM users                │
│  WHERE email = 'user@gmail.com'     │
│  OR google_id = '1234567890'        │
└─────────────────────────────────────┘
         ↓
    ┌────┴────┐
    │         │
   YES       NO
    │         │
  Login    Register
```

### Decision 2: Role Match?
```
┌─────────────────────────────────────┐
│  User's stored role: 'seeker'       │
│  Requested role: 'seeker'           │
│  Match? ✅ YES → Allow              │
│                                     │
│  User's stored role: 'seeker'       │
│  Requested role: 'owner'            │
│  Match? ❌ NO → Reject              │
└─────────────────────────────────────┘
```

---

## 📊 Data Flow

### From Google → Backend:
```
Google API
    ↓
{
  "sub": "1234567890",
  "email": "user@gmail.com",
  "name": "John Doe",
  "picture": "https://...",
  "email_verified": true
}
    ↓
Backend verifies token
    ↓
Checks database
```

### From Complete Profile → Backend:
```
Frontend Form
    ↓
{
  "google_token": "eyJhbGc...",
  "role": "seeker",
  "contact_number": "09123456789"
}
    ↓
POST /backend/google-auth.php
    ↓
Backend creates user
    ↓
Auto-login
```

### From Backend → Frontend:
```
Backend Response
    ↓
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user_id": 10,
    "email": "user@gmail.com",
    "role": "seeker",
    "full_name": "John Doe"
  }
}
    ↓
Frontend refreshes auth
    ↓
Navigate to dashboard
```

---

## 🔄 State Transitions

```
┌──────────────┐
│ Not Logged In│
└──────┬───────┘
       │
       ↓ Click "Continue with Google"
       │
┌──────▼───────┐
│ Authenticating│
└──────┬───────┘
       │
       ↓ Google returns data
       │
┌──────▼───────┐
│ Checking User│
└──────┬───────┘
       │
       ├─→ Existing User
       │   └─→ ┌──────────┐
       │       │ Logged In│
       │       └──────────┘
       │
       └─→ New User
           └─→ ┌────────────────┐
               │ Completing     │
               │ Profile        │
               └────────┬───────┘
                        │
                        ↓ Submit form
                        │
                   ┌────▼────┐
                   │ Logged In│
                   └─────────┘
```

---

## ✅ Success Indicators

### For Existing Users:
```
✅ Google popup appears
✅ User selects account
✅ Immediately redirected to dashboard
✅ No profile page shown
✅ User is logged in
✅ Session is active
```

### For New Users:
```
✅ Google popup appears
✅ User selects account
✅ Redirected to /complete-profile
✅ Profile info displayed
✅ Form has only 2 fields
✅ Submit button works
✅ Automatically logged in
✅ Redirected to dashboard
✅ Session is active
```

---

## 🎨 Visual Summary

```
LOGIN PAGE
    ↓
[Continue with Google]
    ↓
GOOGLE POPUP
    ↓
┌─────────────┐
│ New User?   │
└─────────────┘
    ↓
┌───────┴────────┐
│                │
YES              NO
│                │
COMPLETE         DIRECT
PROFILE          LOGIN
│                │
FILL 2           │
FIELDS           │
│                │
SUBMIT           │
│                │
AUTO-            │
LOGIN            │
│                │
└────────┬───────┘
         ↓
    DASHBOARD
    (LOGGED IN)
```

---

**🎉 Complete visual flow diagram!**

**Status:** ✅ Production Ready  
**Documentation:** Complete  
**Testing:** Ready
