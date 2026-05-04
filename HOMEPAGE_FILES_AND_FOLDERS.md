# All Files & Folders Involved in Homepage

## 🎯 Quick Summary

When you visit `http://localhost:5173/`, these files are involved:

**Total Files:** 23 files  
**Total Folders:** 7 folders

---

## 📁 Complete File Structure

```
rentease/frontend/
├── public/
│   ├── favicon.svg                    ✅ Browser tab icon
│   └── icons.svg                      ✅ SVG icon sprites
│
├── src/
│   ├── api/
│   │   └── client.js                  ✅ API functions (login, register, etc.)
│   │
│   ├── assets/
│   │   ├── hero.png                   ❌ Not used on login page
│   │   ├── react.svg                  ❌ Not used on login page
│   │   └── vite.svg                   ❌ Not used on login page
│   │
│   ├── auth/
│   │   ├── AuthContext.jsx            ✅ Auth state management
│   │   ├── context.js                 ✅ Auth context provider
│   │   └── useAuth.js                 ✅ Auth hook (login, logout, etc.)
│   │
│   ├── components/
│   │   ├── AccountSettingsCard.jsx    ❌ Not used on login page
│   │   ├── AppShell.jsx               ❌ Not used on login page
│   │   ├── AsyncState.jsx             ❌ Not used on login page
│   │   ├── GoogleSignInButton.jsx     ✅ Google sign-in button
│   │   ├── LinkAccountsCard.jsx       ❌ Not used on login page
│   │   ├── ModuleCard.jsx             ❌ Not used on login page
│   │   └── ProtectedRoute.jsx         ✅ Route protection logic
│   │
│   ├── pages/
│   │   ├── dashboards/
│   │   │   ├── AdminDashboard.jsx     ❌ Not loaded on login
│   │   │   ├── OwnerDashboard.jsx     ❌ Not loaded on login
│   │   │   ├── ParentDashboard.jsx    ❌ Not loaded on login
│   │   │   └── SeekerDashboard.jsx    ❌ Not loaded on login
│   │   │
│   │   ├── LoginPage.jsx              ✅ Main login page component
│   │   ├── RegisterPage.jsx           ❌ Not loaded on login
│   │   ├── VerifyEmailPage.jsx        ❌ Not loaded on login
│   │   ├── ResendVerificationPage.jsx ❌ Not loaded on login
│   │   ├── ForgotPasswordPage.jsx     ❌ Not loaded on login
│   │   ├── ResetPasswordPage.jsx      ❌ Not loaded on login
│   │   ├── NotFoundPage.jsx           ❌ Not loaded on login
│   │   ├── UnauthorizedPage.jsx       ❌ Not loaded on login
│   │   ├── PropertyBrowsePage.jsx     ❌ Not loaded on login
│   │   ├── AddPropertyPage.jsx        ❌ Not loaded on login
│   │   └── ComponentShowcase.jsx      ❌ Not loaded on login
│   │
│   ├── utils/
│   │   ├── format.js                  ❌ Not used on login page
│   │   └── roles.js                   ✅ Role utilities (dashboard paths)
│   │
│   ├── App.jsx                        ✅ Main app component with routes
│   ├── main.jsx                       ✅ React entry point
│   └── index.css                      ✅ Global styles
│
├── index.html                         ✅ HTML entry point
├── package.json                       ✅ Dependencies
├── vite.config.js                     ✅ Vite configuration
└── eslint.config.js                   ❌ Not involved in rendering
```

---

## ✅ Files DIRECTLY Involved (Core Files)

### 1. Entry Point Files (3 files)
```
frontend/
├── index.html                         # HTML entry point
├── src/main.jsx                       # React entry point
└── src/App.jsx                        # Main app with routing
```

### 2. Login Page Files (1 file)
```
frontend/src/pages/
└── LoginPage.jsx                      # Login page component
```

### 3. Authentication Files (3 files)
```
frontend/src/auth/
├── AuthContext.jsx                    # Auth state management
├── context.js                         # Auth context provider
└── useAuth.js                         # Auth hook
```

### 4. API Files (1 file)
```
frontend/src/api/
└── client.js                          # API client (login function)
```

### 5. Component Files (2 files)
```
frontend/src/components/
├── GoogleSignInButton.jsx             # Google sign-in button
└── ProtectedRoute.jsx                 # Route protection
```

### 6. Utility Files (1 file)
```
frontend/src/utils/
└── roles.js                           # Role utilities
```

### 7. Style Files (1 file)
```
frontend/src/
└── index.css                          # Global styles
```

### 8. Public Assets (2 files)
```
frontend/public/
├── favicon.svg                        # Browser tab icon
└── icons.svg                          # SVG icons (if used)
```

### 9. Configuration Files (2 files)
```
frontend/
├── package.json                       # Dependencies
└── vite.config.js                     # Vite config (proxy, etc.)
```

---

## 📊 Summary by Category

### ✅ USED on Homepage/Login (15 files)

| Category | Files | Purpose |
|----------|-------|---------|
| **Entry Points** | 3 | HTML, React entry, App routing |
| **Pages** | 1 | LoginPage.jsx |
| **Auth** | 3 | Auth context, provider, hooks |
| **API** | 1 | API client functions |
| **Components** | 2 | GoogleSignInButton, ProtectedRoute |
| **Utils** | 1 | Role utilities |
| **Styles** | 1 | Global CSS |
| **Assets** | 2 | Favicon, icons |
| **Config** | 2 | package.json, vite.config.js |

### ❌ NOT USED on Homepage/Login (8+ files)

| Category | Files | When Used |
|----------|-------|-----------|
| **Pages** | 11 | Other pages (register, dashboards, etc.) |
| **Components** | 4 | Dashboard components |
| **Utils** | 1 | Format utilities |
| **Assets** | 3 | Hero images, logos |

---

## 🔍 Detailed File Breakdown

### 1. `frontend/index.html`
**Purpose:** HTML entry point  
**What it does:**
- Loads the React app
- Sets page title
- Includes root div for React mounting
- Links to main.jsx

**Key content:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RentEase</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

### 2. `frontend/src/main.jsx`
**Purpose:** React entry point  
**What it does:**
- Imports React and ReactDOM
- Imports global CSS
- Wraps app with Router and AuthProvider
- Mounts React to #root div

**Key imports:**
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/context.js'
import App from './App.jsx'
import './index.css'
```

---

### 3. `frontend/src/App.jsx`
**Purpose:** Main app component with routing  
**What it does:**
- Defines all routes
- Handles root path (/) redirect logic
- Checks authentication status
- Redirects to /login if not authenticated

**Key logic:**
```javascript
function RootRedirect() {
  const { authState } = useAuth();
  
  if (authState.status === 'loading') {
    return <div>Checking session...</div>;
  }
  
  if (authState.status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }
  
  return <Navigate to={roleDashboardPath(authState.user?.role)} replace />;
}
```

---

### 4. `frontend/src/pages/LoginPage.jsx`
**Purpose:** Login page component  
**What it does:**
- Renders login form
- Handles form submission
- Shows error messages
- Redirects on successful login
- Shows Google sign-in option

**Key features:**
- Email input
- Password input
- Role selector
- Login button
- Google sign-in button
- Links to register and forgot password

---

### 5. `frontend/src/auth/AuthContext.jsx`
**Purpose:** Auth state management  
**What it does:**
- Defines auth state shape
- Manages user session
- Provides auth actions (login, logout)

---

### 6. `frontend/src/auth/context.js`
**Purpose:** Auth context provider  
**What it does:**
- Creates React context
- Provides AuthProvider component
- Manages auth state globally

---

### 7. `frontend/src/auth/useAuth.js`
**Purpose:** Auth hook  
**What it does:**
- Provides useAuth() hook
- Exposes login, logout, checkAuth functions
- Manages auth state updates

**Key functions:**
```javascript
const { authState, login, logout, checkAuth } = useAuth();
```

---

### 8. `frontend/src/api/client.js`
**Purpose:** API client functions  
**What it does:**
- Defines API base URL
- Provides login() function
- Provides register() function
- Handles API requests/responses

**Key function:**
```javascript
export async function login(credentials) {
  const response = await fetch('/backend/auth.php?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include'
  });
  return response.json();
}
```

---

### 9. `frontend/src/components/GoogleSignInButton.jsx`
**Purpose:** Google sign-in button  
**What it does:**
- Renders Google sign-in button
- Handles Google OAuth flow
- Calls onSuccess/onError callbacks

---

### 10. `frontend/src/components/ProtectedRoute.jsx`
**Purpose:** Route protection  
**What it does:**
- Checks if user is authenticated
- Checks if user has required role
- Redirects to login if not authenticated
- Redirects to unauthorized if wrong role

---

### 11. `frontend/src/utils/roles.js`
**Purpose:** Role utilities  
**What it does:**
- Defines role constants
- Provides roleDashboardPath() function
- Maps roles to dashboard URLs

**Key function:**
```javascript
export function roleDashboardPath(role) {
  switch (role) {
    case 'admin': return '/admin/dashboard';
    case 'owner': return '/owner/dashboard';
    case 'seeker': return '/seeker/dashboard';
    case 'parent': return '/parent/dashboard';
    default: return '/login';
  }
}
```

---

### 12. `frontend/src/index.css`
**Purpose:** Global styles  
**What it does:**
- Defines CSS variables (colors, fonts)
- Styles login page layout
- Styles form elements
- Styles buttons
- Responsive design rules

**Key styles:**
- `.login-page` - Page layout
- `.login-hero` - Left hero section
- `.login-card` - Right form card
- `.button-primary` - Login button
- Form input styles

---

### 13. `frontend/public/favicon.svg`
**Purpose:** Browser tab icon  
**What it does:**
- Shows icon in browser tab
- Shows icon in bookmarks

---

### 14. `frontend/package.json`
**Purpose:** Dependencies and scripts  
**What it does:**
- Lists npm dependencies (React, React Router, etc.)
- Defines npm scripts (dev, build, preview)
- Project metadata

**Key dependencies:**
```json
{
  "dependencies": {
    "react": "^19.x",
    "react-dom": "^19.x",
    "react-router-dom": "^6.x"
  }
}
```

---

### 15. `frontend/vite.config.js`
**Purpose:** Vite configuration  
**What it does:**
- Configures dev server
- Sets up proxy to backend
- Defines build settings

**Key config:**
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

---

## 🔗 File Dependencies (Flow)

### Load Order:
```
1. index.html
   ↓
2. main.jsx
   ↓
3. App.jsx (imports AuthProvider, Router)
   ↓
4. AuthContext/context.js (provides auth state)
   ↓
5. App.jsx RootRedirect (checks auth)
   ↓
6. Navigate to /login
   ↓
7. LoginPage.jsx (renders)
   ↓
8. Uses: useAuth, client.js, GoogleSignInButton, roles.js
   ↓
9. Styled by: index.css
```

### Import Chain:
```
index.html
  → main.jsx
    → App.jsx
      → LoginPage.jsx
        → useAuth.js
          → AuthContext.jsx
          → context.js
        → client.js
        → GoogleSignInButton.jsx
        → roles.js
    → index.css
```

---

## 📦 Folders Involved

### 1. `frontend/` (root)
- Main frontend directory
- Contains all frontend code

### 2. `frontend/public/`
- Static assets
- Served directly by Vite
- Contains favicon, icons

### 3. `frontend/src/`
- Source code directory
- All React components and logic

### 4. `frontend/src/api/`
- API client functions
- Backend communication

### 5. `frontend/src/auth/`
- Authentication logic
- Auth context and hooks

### 6. `frontend/src/components/`
- Reusable React components
- GoogleSignInButton, ProtectedRoute

### 7. `frontend/src/pages/`
- Page components
- LoginPage and other pages

### 8. `frontend/src/utils/`
- Utility functions
- Role helpers, formatters

---

## 🎯 Critical Path (Minimum Required Files)

To render the login page, you MUST have these files:

```
✅ REQUIRED (15 files):

1. index.html
2. src/main.jsx
3. src/App.jsx
4. src/pages/LoginPage.jsx
5. src/auth/AuthContext.jsx
6. src/auth/context.js
7. src/auth/useAuth.js
8. src/api/client.js
9. src/components/GoogleSignInButton.jsx
10. src/components/ProtectedRoute.jsx
11. src/utils/roles.js
12. src/index.css
13. public/favicon.svg
14. package.json
15. vite.config.js
```

**If any of these are missing, the login page will NOT work!**

---

## 🔧 Backend Files Also Involved

When login page loads, it also calls backend:

```
backend/
├── auth.php                           # Login endpoint
├── config.php                         # Database config
└── helpers.php                        # Helper functions
```

**Backend endpoint called:**
- `GET /backend/auth.php?action=me` (check session)
- `POST /backend/auth.php?action=login` (on form submit)

---

## 📊 File Size Estimate

| File | Approx Size | Lines of Code |
|------|-------------|---------------|
| index.html | 0.5 KB | 15 lines |
| main.jsx | 1 KB | 30 lines |
| App.jsx | 3 KB | 80 lines |
| LoginPage.jsx | 6 KB | 180 lines |
| AuthContext.jsx | 2 KB | 60 lines |
| context.js | 3 KB | 90 lines |
| useAuth.js | 1 KB | 30 lines |
| client.js | 2 KB | 60 lines |
| GoogleSignInButton.jsx | 2 KB | 50 lines |
| ProtectedRoute.jsx | 2 KB | 50 lines |
| roles.js | 1 KB | 30 lines |
| index.css | 15 KB | 600 lines |
| **TOTAL** | **~38 KB** | **~1,275 lines** |

---

## 🎯 Quick Reference

### To modify login page appearance:
- Edit: `src/pages/LoginPage.jsx`
- Edit: `src/index.css`

### To modify login logic:
- Edit: `src/auth/useAuth.js`
- Edit: `src/api/client.js`

### To modify routing:
- Edit: `src/App.jsx`

### To modify auth state:
- Edit: `src/auth/AuthContext.jsx`
- Edit: `src/auth/context.js`

---

## ✅ Summary

**Total files involved in homepage/login:**
- ✅ **15 core files** directly used
- ❌ **20+ files** not loaded on login page
- 📁 **8 folders** in structure
- 🔗 **3 backend files** called via API

**Most important files:**
1. `LoginPage.jsx` - The actual page
2. `index.css` - All the styling
3. `useAuth.js` - Login logic
4. `client.js` - API calls
5. `App.jsx` - Routing

---

**That's every file and folder involved!** 🎉
