# What You See at http://localhost:5173/

## 🎯 Quick Answer

When you visit `http://localhost:5173/`, you are **automatically redirected to the Login Page** at `http://localhost:5173/login`

---

## 📱 Complete Visual Description of Login Page

### Page Layout
The page is divided into **TWO MAIN SECTIONS** side by side:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  LEFT SECTION              │    RIGHT SECTION          │
│  (Hero/Info)               │    (Login Form)           │
│                            │                           │
│  - Branding                │    - Sign in form         │
│  - Tagline                 │    - Email input          │
│  - Description             │    - Password input       │
│  - Feature pills           │    - Role selector        │
│                            │    - Login button         │
│                            │    - Google sign-in       │
│                            │    - Links                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## LEFT SECTION: Hero/Information Panel

### 1. Branding Text (Small, above title)
```
RentEase
```
- Small text, likely gray or muted color
- Acts as a "kicker" or eyebrow text

### 2. Main Heading (Large, bold)
```
Boarding House Operations, Role by Role.
```
- Large, prominent heading
- Bold font weight
- Dark color (likely black or dark gray)

### 3. Description Paragraph
```
This frontend is integrated with Phase 3 PHP APIs for seeker, parent, 
owner, and admin workflows. Login to continue.
```
- Regular body text
- Gray color
- Explains the system purpose

### 4. Feature Pills (Horizontal badges)
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ React + Vite │  │ Session Auth │  │ RBAC Routes  │
└──────────────┘  └──────────────┘  └──────────────┘
```
- Three pill-shaped badges
- Likely with background color (light blue/gray)
- Shows tech stack features

---

## RIGHT SECTION: Login Form Card

### 1. Card Header
```
Sign in
```
- Medium-sized heading
- Bold text

### 2. Subheading Text
```
Use your registered account credentials and select the correct 
role for this login session.
```
- Smaller, gray text
- Instructions for users

---

### 3. Login Form Fields

#### Field 1: Email
```
┌─────────────────────────────────────────────┐
│ Email                                       │
├─────────────────────────────────────────────┤
│ your-email@domain.com                       │
└─────────────────────────────────────────────┘
```
- Label: "Email"
- Input type: email
- Placeholder: "your-email@domain.com"
- Required field

#### Field 2: Password
```
┌─────────────────────────────────────────────┐
│ Password                                    │
├─────────────────────────────────────────────┤
│ Enter your password                         │
└─────────────────────────────────────────────┘
```
- Label: "Password"
- Input type: password (hidden characters)
- Placeholder: "Enter your password"
- Required field

#### Field 3: Role Selector
```
┌─────────────────────────────────────────────┐
│ Role                                        │
├─────────────────────────────────────────────┤
│ Seeker / Boarder                        ▼   │
└─────────────────────────────────────────────┘
```
- Label: "Role"
- Dropdown/Select menu
- Default selected: "Seeker / Boarder"
- Options when clicked:
  - ✓ **Seeker / Boarder** (default)
  - **Parent**
  - **Owner**
  - **Admin**

---

### 4. Login Button
```
┌─────────────────────────────────────────────┐
│              Login                          │
└─────────────────────────────────────────────┘
```
- Full-width button
- Primary color (likely blue or brand color)
- Text: "Login"
- When submitting, changes to: "Signing in..."
- Disabled state while submitting

---

### 5. Divider
```
─────────────── OR ───────────────
```
- Horizontal line with "OR" text in center
- Separates traditional login from Google sign-in

---

### 6. Google Sign-In Button
```
┌─────────────────────────────────────────────┐
│  [G]  Sign in with Google                   │
└─────────────────────────────────────────────┘
```
- Google logo icon on left
- Text: "Sign in with Google"
- White background with border
- Google brand styling

---

### 7. Footer Links

#### Link 1: Forgot Password
```
Forgot your password?
```
- Clickable link (likely blue/underlined)
- Goes to: `/forgot-password`

#### Link 2: Backend Notice
```
Backend required: ensure XAMPP Apache/MySQL and `auth.php?action=me` 
are reachable.
```
- Small, gray text
- Technical note for developers

#### Link 3: Registration Link
```
No account yet? Create one
```
- Text: "No account yet? "
- Link: "Create one" (clickable, blue)
- Goes to: `/register`

---

## 🎨 Visual Styling

### Colors (Typical)
- **Background**: White or light gray
- **Text**: Dark gray/black for headings, medium gray for body
- **Primary Button**: Blue or brand color
- **Links**: Blue with underline on hover
- **Borders**: Light gray
- **Pills**: Light blue/gray background

### Typography
- **Heading Font**: Likely "Manrope" or "Inter" (modern sans-serif)
- **Body Font**: "Inter" or system font
- **Font Sizes**:
  - Main heading: ~32-40px
  - Card heading: ~24-28px
  - Body text: ~14-16px
  - Small text: ~12-14px

### Layout
- **Responsive**: Two columns on desktop, stacks on mobile
- **Spacing**: Clean, modern spacing between elements
- **Card**: White background with subtle shadow
- **Inputs**: Border with focus state (likely blue outline)

---

## 🔄 Dynamic Behavior

### On Page Load
1. Shows "Checking session..." briefly
2. If not logged in → Shows login page
3. If already logged in → Redirects to dashboard based on role:
   - Admin → `/admin/dashboard`
   - Owner → `/owner/dashboard`
   - Seeker → `/seeker/dashboard`
   - Parent → `/parent/dashboard`

### When Submitting Login
1. Button text changes: "Login" → "Signing in..."
2. Button becomes disabled (grayed out)
3. Form cannot be resubmitted

### On Login Error
```
┌─────────────────────────────────────────────┐
│ ⚠️ Invalid credentials or role mismatch     │
└─────────────────────────────────────────────┘
```
- Red error box appears above button
- Shows error message from backend

### On Unverified Email Error
```
┌─────────────────────────────────────────────┐
│ ⚠️ Your email address has not been verified.│
│    Please check your inbox for the          │
│    verification link.                       │
│                                             │
│    Need a new verification link?           │
│    [Resend Verification Email]             │
└─────────────────────────────────────────────┘
```
- Red error box
- Shows verification message
- Shows "Resend Verification Email" button

### On Successful Login
1. Redirects to appropriate dashboard
2. URL changes to:
   - `/admin/dashboard` (for admin)
   - `/owner/dashboard` (for owner)
   - `/seeker/dashboard` (for seeker)
   - `/parent/dashboard` (for parent)

---

## 📋 Complete Text Content

### Exact Text You'll See:

**Left Panel:**
```
RentEase

Boarding House Operations, Role by Role.

This frontend is integrated with Phase 3 PHP APIs for seeker, parent, 
owner, and admin workflows. Login to continue.

[React + Vite]  [Session Auth]  [RBAC Routes]
```

**Right Panel:**
```
Sign in

Use your registered account credentials and select the correct role 
for this login session.

Email
[your-email@domain.com]

Password
[Enter your password]

Role
[Seeker / Boarder ▼]

[Login]

─────────── OR ───────────

[G] Sign in with Google

Forgot your password?

Backend required: ensure XAMPP Apache/MySQL and `auth.php?action=me` 
are reachable.

No account yet? Create one
```

---

## 🖱️ Interactive Elements

### Clickable Elements:
1. **Email input** - Click to type email
2. **Password input** - Click to type password
3. **Role dropdown** - Click to select role
4. **Login button** - Click to submit form
5. **Google Sign-In button** - Click to sign in with Google
6. **"Forgot your password?"** link - Goes to password reset
7. **"Create one"** link - Goes to registration page
8. **"Resend Verification Email"** link - (appears on verification error)

### Keyboard Navigation:
- Tab through fields
- Enter to submit form
- Arrow keys in role dropdown

---

## 📱 Mobile View

On mobile devices (< 768px width):
- **Two sections stack vertically**
- Hero section on top
- Login form below
- Full-width inputs
- Same content, different layout

---

## 🔐 Demo Accounts (Pre-seeded)

If you've run the demo seed, you can login with:

```
Email: admin@rentease.local
Password: Admin123!
Role: Admin

Email: owner@rentease.local
Password: Owner123!
Role: Owner

Email: seeker@rentease.local
Password: Seeker123!
Role: Seeker

Email: parent@rentease.local
Password: Parent123!
Role: Parent
```

---

## 🎯 User Flow

```
Visit http://localhost:5173/
         ↓
Redirects to /login
         ↓
See login page (described above)
         ↓
Enter credentials + select role
         ↓
Click "Login" button
         ↓
If successful → Redirect to dashboard
If error → Show error message
```

---

## 🖼️ ASCII Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────┐   │
│  │                      │  │                              │   │
│  │  RentEase            │  │  Sign in                     │   │
│  │                      │  │                              │   │
│  │  Boarding House      │  │  Use your registered account │   │
│  │  Operations,         │  │  credentials and select the  │   │
│  │  Role by Role.       │  │  correct role for this login │   │
│  │                      │  │  session.                    │   │
│  │  This frontend is    │  │                              │   │
│  │  integrated with     │  │  Email                       │   │
│  │  Phase 3 PHP APIs    │  │  ┌────────────────────────┐ │   │
│  │  for seeker, parent, │  │  │ your-email@domain.com  │ │   │
│  │  owner, and admin    │  │  └────────────────────────┘ │   │
│  │  workflows. Login    │  │                              │   │
│  │  to continue.        │  │  Password                    │   │
│  │                      │  │  ┌────────────────────────┐ │   │
│  │  ┌──────────────┐    │  │  │ ••••••••••••••••••••   │ │   │
│  │  │ React + Vite │    │  │  └────────────────────────┘ │   │
│  │  └──────────────┘    │  │                              │   │
│  │  ┌──────────────┐    │  │  Role                        │   │
│  │  │ Session Auth │    │  │  ┌────────────────────────┐ │   │
│  │  └──────────────┘    │  │  │ Seeker / Boarder    ▼  │ │   │
│  │  ┌──────────────┐    │  │  └────────────────────────┘ │   │
│  │  │ RBAC Routes  │    │  │                              │   │
│  │  └──────────────┘    │  │  ┌────────────────────────┐ │   │
│  │                      │  │  │       Login            │ │   │
│  │                      │  │  └────────────────────────┘ │   │
│  │                      │  │                              │   │
│  │                      │  │  ────────── OR ──────────    │   │
│  │                      │  │                              │   │
│  │                      │  │  ┌────────────────────────┐ │   │
│  │                      │  │  │ [G] Sign in with Google│ │   │
│  │                      │  │  └────────────────────────┘ │   │
│  │                      │  │                              │   │
│  │                      │  │  Forgot your password?       │   │
│  │                      │  │                              │   │
│  │                      │  │  Backend required: ensure    │   │
│  │                      │  │  XAMPP Apache/MySQL and      │   │
│  │                      │  │  `auth.php?action=me` are    │   │
│  │                      │  │  reachable.                  │   │
│  │                      │  │                              │   │
│  │                      │  │  No account yet? Create one  │   │
│  │                      │  │                              │   │
│  └──────────────────────┘  └──────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎬 What Happens Step by Step

### Step 1: Browser loads `http://localhost:5173/`
- React app initializes
- Checks authentication status

### Step 2: Auth check runs
- Calls backend: `GET /backend/auth.php?action=me`
- Checks if user has active session

### Step 3: Not authenticated
- Redirects to `/login`
- URL changes to `http://localhost:5173/login`

### Step 4: Login page renders
- Shows hero section (left)
- Shows login form (right)
- All text and inputs appear

### Step 5: User interaction
- User can type in email
- User can type in password
- User can select role
- User can click Login button

### Step 6: Form submission
- Button shows "Signing in..."
- POST request to `/backend/auth.php?action=login`
- Waits for response

### Step 7: Response handling
- **Success**: Redirect to dashboard
- **Error**: Show error message
- **Unverified**: Show verification prompt

---

## 🔍 Browser Developer Tools View

If you open DevTools (F12), you'll see:

### Console:
```
[Vite] connected.
Checking authentication status...
User not authenticated, redirecting to login
```

### Network Tab:
```
GET /backend/auth.php?action=me → 401 Unauthorized
```

### Elements Tab:
```html
<div class="login-page">
  <section class="login-hero">...</section>
  <section class="login-card">...</section>
</div>
```

---

## ✅ Summary

**When you visit `http://localhost:5173/`, you will see:**

1. ✅ **Automatic redirect** to login page
2. ✅ **Left panel** with RentEase branding and description
3. ✅ **Right panel** with login form
4. ✅ **Three input fields**: Email, Password, Role
5. ✅ **Login button** (primary blue button)
6. ✅ **Google Sign-In button** (white with Google logo)
7. ✅ **Three links**: Forgot password, Backend notice, Create account
8. ✅ **Clean, modern design** with responsive layout

**The page is ready for users to:**
- Enter their credentials
- Select their role
- Click Login to access their dashboard
- Or register a new account
- Or reset their password

---

**That's exactly what you'll see!** 🎉
