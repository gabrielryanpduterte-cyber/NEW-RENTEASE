# Phase 5 Manual Guide (RENTEASE)

This guide is for manual execution of Phase 5 only.  
Goal: integrate React frontend and PHP backend, validate full user flows, and stabilize CORS/session behavior.

## Phase 5 Scope

Phase 5 focuses on frontend-backend wiring and end-to-end behavior.

Core tasks:
- Connect React requests to Phase 3 PHP APIs
- Run full feature flow tests from login to role dashboards
- Resolve CORS/session issues between Vite and XAMPP
- Implement reliable loading/error UX for API calls

Primary integration modules:
- `auth.php`
- `users.php`
- `boarding_house.php`
- `rooms.php`
- `reservations.php`
- `payments.php`
- `activity_logs.php`
- `error_logs.php`

## Before You Start

1. Confirm Phase 3 backend is complete and reachable:
   - `http://localhost/rentease/backend/auth.php?action=me`
2. Confirm Phase 4 frontend is running:
   - `cd rentease/frontend`
   - `npm run dev`
3. Start XAMPP services:
   - Apache
   - MySQL
4. Confirm `rentease_db` has test users per role:
   - `seeker`
   - `parent`
   - `owner`
   - `admin`

## Step 1: Define API Connection Strategy

Choose one stable approach and keep it consistent.

Option A (recommended for local dev): Vite proxy
- Frontend calls `/backend/...`
- Vite rewrites to `http://localhost/rentease/backend/...`
- Avoids most local CORS friction

Option B: direct backend URL
- Frontend calls full URL (for example `http://localhost/rentease/backend`)
- Backend must return proper `Access-Control-Allow-*` headers

Manual rule:
- Do not mix both approaches in random components.
- Centralize base URL in one API client file.

## Step 2: Centralize API Client

In frontend, ensure one shared request wrapper exists.

Minimum client requirements:
- Base URL handling
- JSON parsing
- Standard error object handling
- `credentials: include` for session/cookie auth
- Support for `GET`, `POST`, `PUT/PATCH`, `DELETE`

Manual checks:
- Request failures should not crash pages.
- API errors should produce readable UI messages.

## Step 3: Wire Authentication End-to-End

Connect frontend auth state to backend endpoints:

1. Session check on app load
   - `GET auth.php?action=me`
2. Login submit
   - `POST auth.php?action=login`
3. Logout action
   - `POST auth.php?action=logout`

Validation:
- Successful login routes to role dashboard.
- Refresh keeps protected session behavior correct.
- Invalid credentials show clear error message.

## Step 4: Integrate Dashboard Data by Role

### Seeker
- Fetch available rooms from `rooms.php`
- Fetch own reservations from `reservations.php`
- Fetch own payment status from `payments.php`

### Parent
- Fetch dependent reservation/payment monitoring data
- Restrict visibility to allowed records only

### Owner
- Fetch/manage rooms from `rooms.php`
- Approve/reject reservations via `reservations.php`
- Record/update payments via `payments.php`
- Access own boarding house data via `boarding_house.php`

### Admin
- Manage users via `users.php`
- View activity logs via `activity_logs.php`
- View error logs via `error_logs.php`

Manual rule:
- Each dashboard must only call endpoints allowed by its role.
- Display backend `401` and `403` responses clearly in UI.

## Step 5: Add Loading and Error States

For every major API-backed section:

1. Loading state
   - skeleton, spinner, or loading text
2. Success state
   - render cards/tables/data blocks
3. Empty state
   - no records message
4. Error state
   - readable failure message + retry action

Manual checks:
- No blank screens during request failures.
- Buttons prevent duplicate submit while pending.

## Step 6: Validate Core End-to-End Flows

Use Postman + browser testing together.

Test flow matrix:

1. Register new seeker account
2. Login as seeker and view seeker dashboard
3. Seeker creates reservation
4. Login as owner and view pending reservation
5. Owner approves/rejects reservation
6. Owner records payment entry
7. Login as seeker and verify payment status reflects changes
8. Login as admin and verify logs visibility
9. Attempt unauthorized route access per role
10. Confirm frontend handles `401`, `403`, `404`, `500` gracefully

## Step 7: CORS and Session Stability Checklist

Check these if integration is unstable:

- Backend sends:
  - `Content-Type: application/json`
  - `Access-Control-Allow-Origin` (correct origin)
  - `Access-Control-Allow-Headers`
  - `Access-Control-Allow-Methods`
- Frontend requests include credentials when using session auth.
- `OPTIONS` preflight requests return valid response (204/200).
- Browser devtools show cookies being set/sent correctly.

## Phase 5 Completion Checklist

- [ ] Frontend API client wired to backend
- [ ] Auth session flow works (`me/login/logout`)
- [ ] Role dashboards fetch real backend data
- [ ] Owner actions update reservation/payment records
- [ ] Admin can access users/activity/error logs
- [ ] Unauthorized route access is blocked and handled
- [ ] Loading/error states implemented on major API sections
- [ ] CORS issues resolved in local dev
- [ ] End-to-end flow tested from reservation to payment visibility
- [ ] Phase 5 integration status stable

## Footprint Log Template (For Documentation/Defense)

Fill this while doing Phase 5 manually:

- Started Apache/MySQL (`yes/no`)
- Ran frontend dev server (`yes/no`)
- Configured API base strategy (proxy/direct) (`yes/no`)
- Verified auth session check endpoint (`yes/no`)
- Connected login/logout to backend (`yes/no`)
- Connected seeker dashboard APIs (`yes/no`)
- Connected parent dashboard APIs (`yes/no`)
- Connected owner dashboard APIs (`yes/no`)
- Connected admin dashboard APIs (`yes/no`)
- Implemented loading/error states (`yes/no`)
- Verified 401 handling (`yes/no`)
- Verified 403 handling (`yes/no`)
- Verified 404 handling (`yes/no`)
- Verified 500 handling (`yes/no`)
- Tested full reservation -> approval -> payment flow (`yes/no`)
- Final Phase 5 status: `complete/incomplete`

## Common Phase 5 Issues

- Frontend says "Failed to fetch":
  - Wrong API base URL or backend is not running.

- Login works in Postman but fails in browser:
  - Missing `credentials: include` or cookie settings mismatch.

- Random CORS preflight failures:
  - Backend `OPTIONS` request not handled correctly.

- Role dashboard shows empty data incorrectly:
  - Query filters are too strict or user role mapping is wrong.

- Unauthorized page never appears:
  - Frontend route guard does not process `authenticated but forbidden` state.

- Session drops on refresh:
  - `me` endpoint call fails or session cookie not persisted.
