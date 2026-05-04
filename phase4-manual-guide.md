# Phase 4 Manual Guide (RENTEASE)

This guide is for manual execution of Phase 4 only.  
Goal: build the React frontend with role-based routing, protected navigation, and dashboard page shells.

## Phase 4 Scope

You will build the frontend inside `rentease/frontend/`.

Required views:
- Login page
- Seeker dashboard
- Parent dashboard/view
- Owner dashboard
- Admin dashboard
- Unauthorized page
- Not found page

Core requirements:
- React Router setup
- Authentication context for session/role state
- Role-based route protection
- Responsive layout for desktop and mobile

## Before You Start

1. Confirm Phase 3 backend exists and is running in XAMPP.
2. Confirm Node.js and npm are installed:
   - `node -v`
   - `npm -v`
3. Confirm project paths:
   - frontend: `rentease/frontend/`
   - backend: `rentease/backend/`
4. Ensure backend auth endpoint is reachable:
   - `http://localhost/rentease/backend/auth.php?action=me`

## Step 1: Initialize React Frontend

Inside `rentease/frontend/`:

1. Scaffold project:
   - `npm create vite@latest . -- --template react`
2. Install dependencies:
   - `npm install`
   - `npm install react-router-dom`
3. Run dev server:
   - `npm run dev`

Expected:
- Vite dev URL opens successfully.
- Starter app loads in browser.

## Step 2: Define Frontend Structure

Create/organize files similar to:

- `src/main.jsx`
- `src/App.jsx`
- `src/index.css`
- `src/auth/AuthContext.jsx`
- `src/auth/useAuth.js`
- `src/components/ProtectedRoute.jsx`
- `src/components/AppShell.jsx`
- `src/pages/LoginPage.jsx`
- `src/pages/dashboards/SeekerDashboard.jsx`
- `src/pages/dashboards/ParentDashboard.jsx`
- `src/pages/dashboards/OwnerDashboard.jsx`
- `src/pages/dashboards/AdminDashboard.jsx`
- `src/pages/UnauthorizedPage.jsx`
- `src/pages/NotFoundPage.jsx`
- `src/api/client.js`
- `src/utils/roles.js`

Manual rules:
- Keep route and role utilities centralized.
- Keep auth logic in context, not duplicated per page.

## Step 3: Build Auth Context

Implement an auth provider that handles:

1. Session loading on app start
   - Call backend `auth.php?action=me`
2. Login action
   - POST to `auth.php?action=login`
3. Logout action
   - POST to `auth.php?action=logout`
4. Shared auth state
   - `loading`, `authenticated`, `unauthenticated`
   - current user object with role

Manual checks:
- Include credentials/cookies in fetch/axios requests.
- Store only safe user data in frontend state.
- Handle failed auth gracefully.

## Step 4: Implement Role-Based Routing

In `App.jsx`, define routes:

- Public:
  - `/login`
- Protected:
  - `/seeker/dashboard` -> role `seeker`
  - `/parent/dashboard` -> role `parent`
  - `/owner/dashboard` -> role `owner`
  - `/admin/dashboard` -> role `admin`
- Utility routes:
  - `/unauthorized`
  - `*` -> not found

Use a reusable `ProtectedRoute` component:
- Redirect unauthenticated users to `/login`
- Redirect wrong-role users to `/unauthorized`

## Step 5: Build Dashboard Page Shells

Create initial UI shells for each role dashboard.

Minimum content per dashboard:
- Role-specific title/header
- Key summary cards/blocks
- Placeholder actions/navigation areas

Role expectations:
- Seeker: room browsing, reservation status, payment status
- Parent: dependent monitoring view, payment overview
- Owner: rooms management, reservation approvals, payment recording
- Admin: user oversight, activity/error log access

Manual rules:
- Keep pages responsive from day one.
- Maintain consistent navigation pattern across dashboards.

## Step 6: Add Navigation and Access UX

Implement:

1. Top/side navigation with role-aware items
2. Logout button wired to auth context
3. Landing redirect behavior:
   - If logged in, route user to their role dashboard
   - If not logged in, route to login page

## Step 7: Manual Testing (Frontend Only)

Run:
- `npm run dev`

Manual test flow:

1. Open `/login`.
2. Attempt login with valid credentials.
3. Confirm redirect to correct role dashboard.
4. Manually open another role route:
   - Expect `/unauthorized`.
5. Logout:
   - Expect return to `/login`.
6. Refresh protected page:
   - Session state should re-check and remain protected.
7. Test mobile viewport:
   - Navigation and dashboard blocks remain usable.

## Phase 4 Completion Checklist

- [ ] React app scaffolded in `rentease/frontend/`
- [ ] React Router configured
- [ ] Auth context implemented
- [ ] Protected route wrapper implemented
- [ ] Seeker dashboard shell created
- [ ] Parent dashboard shell created
- [ ] Owner dashboard shell created
- [ ] Admin dashboard shell created
- [ ] Unauthorized + Not Found pages created
- [ ] Login/logout flow wired
- [ ] Role-based access blocking verified
- [ ] Responsive layout verified

## Footprint Log Template (For Documentation/Defense)

Fill this while doing Phase 4 manually:

- Initialized React frontend with Vite (`yes/no`)
- Installed routing/auth dependencies (`yes/no`)
- Created auth context (`yes/no`)
- Created protected route wrapper (`yes/no`)
- Added role routes (`yes/no`)
- Implemented login page (`yes/no`)
- Implemented seeker dashboard (`yes/no`)
- Implemented parent dashboard (`yes/no`)
- Implemented owner dashboard (`yes/no`)
- Implemented admin dashboard (`yes/no`)
- Added unauthorized and 404 pages (`yes/no`)
- Tested route blocking by role (`yes/no`)
- Tested logout and session behavior (`yes/no`)
- Tested responsive layout (`yes/no`)
- Final Phase 4 status: `complete/incomplete`

## Common Phase 4 Issues

- Route protection not working:
  - Protected route is not checking auth state before render.

- Wrong dashboard redirect after login:
  - Role-to-path mapping function is incorrect.

- Session lost on refresh:
  - Missing `credentials: 'include'` in auth API calls.

- Infinite redirect loop:
  - Login page redirects before auth loading completes.

- Unauthorized users can view protected content briefly:
  - Route guard renders children before guard condition resolves.

- Mobile layout breaks:
  - Fixed widths and non-wrapping nav elements need responsive CSS updates.
