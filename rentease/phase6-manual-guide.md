# Phase 6 Manual Guide (RENTEASE)

This guide is for manual execution of Phase 6 only.  
Goal: complete remaining features and harden the system for quality, responsiveness, and security.

## Phase 6 Scope

Phase 6 focuses on finishing the remaining functional and non-functional requirements from `roadmap.md`.

Core tasks:
- Implement reports
- Build logs viewer
- Add feedback/ratings
- Finish responsive behavior across device sizes
- Apply security hardening

Primary feature areas:
- Reporting (income, payment status, occupancy, reservation stats)
- Admin log monitoring UI (activity + error logs)
- Feedback/ratings module (seeker/parent input, owner/admin visibility)
- Frontend responsive hardening
- Backend and frontend security hardening

## Before You Start

1. Confirm Phase 5 integration is stable:
   - Login/logout/session flow works
   - Role dashboards already fetch real data
2. Start required services:
   - XAMPP `Apache`
   - XAMPP `MySQL`
   - Frontend dev server (`npm run dev`)
3. Confirm test users exist for all roles:
   - `seeker`
   - `parent`
   - `owner`
   - `admin`
4. Prepare test data with enough records:
   - Multiple reservations (pending/approved/rejected)
   - Multiple payment records (paid/unpaid)
   - Activity and error log entries

## Step 1: Define Phase 6 Delivery Targets

Lock the exact "done" targets before coding.

Minimum target outputs:
1. Reports available in owner/admin views
2. Logs viewer usable by admin
3. Feedback/ratings flow end-to-end
4. Responsive behavior verified on mobile/tablet/desktop
5. Security hardening checklist completed

Manual rule:
- Do not start polishing UI before report/log/feedback functionality is complete.

## Step 2: Implement Reports

Build report outputs required by proposal/roadmap.

Required report sets:
1. Monthly rental income report
2. Payment status report (paid vs unpaid)
3. Occupancy and room availability report
4. Reservation statistics report (pending/approved/rejected counts)

Implementation approach:
- Backend:
  - Add report endpoints (new file like `reports.php` or dedicated report actions in existing modules).
  - Protect with RBAC (`owner` for own scope, `admin` for system-wide scope).
  - Return report data using standard JSON format.
- Frontend:
  - Add report sections/cards/tables in owner/admin dashboards.
  - Add filter controls (date range, status, boarding house scope where applicable).
  - Handle loading, empty, and error states.

Manual checks:
- Owner only sees own boarding house metrics.
- Admin can view broader/system metrics.
- Report totals match actual reservation/payment records.

## Step 3: Build Logs Viewer

Use existing logging tables and Phase 3 APIs to provide practical admin visibility.

Required logs viewer capabilities:
1. Activity logs list
2. Error logs list
3. Filtering/search controls:
   - by user
   - by module
   - by date/time window
   - by error code (for error logs)
4. Clear display of timestamps and related user reference

Manual rule:
- Logs viewer must be admin-only in UI and backend role checks.

Manual checks:
- Unauthorized roles are blocked (`403`) with readable UI feedback.
- Large log sets do not break layout (use pagination or chunked rendering).

## Step 4: Add Feedback/Ratings Module

Implement a complete feedback feature as part of remaining functional scope.

Recommended data design:
- New table: `feedback` (or `ratings_feedback`)
- Suggested fields:
  - `feedback_id` (PK)
  - `user_id` (FK -> users)
  - `reservation_id` (FK -> reservations, optional but recommended)
  - `rating` (for example 1-5)
  - `comment`
  - `created_at`
  - `status` (optional: visible/hidden)

Required behavior:
1. Seeker/parent can submit feedback after eligible reservation state (recommended: approved/completed).
2. Owner can view feedback related to their managed rooms.
3. Admin can audit all feedback entries.
4. Validation blocks invalid ratings/comments.

Manual checks:
- Feedback submission errors are shown clearly in UI.
- Duplicate/abusive submissions are controlled by policy (at least basic validation).

## Step 5: Finish Responsive Hardening

Perform a full responsive pass on all major views.

Target viewport tests:
1. Mobile (~360px to 480px width)
2. Tablet (~768px width)
3. Desktop (>=1280px width)

Required responsive checks:
- Navigation remains usable
- Tables/cards remain readable (scroll/wrap strategy)
- Forms are usable without overlap/clipping
- Dashboard sections stack correctly
- Buttons remain tappable on touch screens

Manual rule:
- Do not leave desktop-only table layouts without a mobile fallback (horizontal scroll or card transform).

## Step 6: Apply Security Hardening

Perform backend and frontend hardening pass.

Backend hardening checklist:
1. Input validation on all new/updated endpoints
2. Strict RBAC enforcement for report/log/feedback access
3. Prepared statements only (no raw SQL concatenation)
4. Safe error exposure (no raw stack traces)
5. Consistent status codes (`400`, `401`, `403`, `404`, `500`)
6. CORS/session policy reviewed for dev and deployment paths

Frontend hardening checklist:
1. Guard role-restricted routes and actions
2. Do not trust role checks from UI alone (backend still enforced)
3. Handle `401/403/404/500` consistently in user-facing messages
4. Disable duplicate submit while request is pending

Manual checks:
- Direct API hit with wrong role returns `403`.
- Tampered request payloads fail validation safely.
- Sensitive internal details are not leaked in API responses.

## Step 7: Run Phase 6 Verification Matrix

Execute end-to-end manual tests:

1. Owner opens reports and verifies monthly income totals.
2. Admin opens system-wide reports and verifies aggregated counts.
3. Admin opens activity/error logs viewer and applies filters.
4. Seeker/parent submits feedback and rating.
5. Owner/admin verifies feedback visibility by allowed scope.
6. Test mobile/tablet/desktop layouts for all major screens.
7. Trigger validation errors intentionally and confirm readable handling.
8. Test unauthorized access to report/log/feedback endpoints.
9. Confirm no blank screens during API failures.

## Phase 6 Completion Checklist

- [ ] Reports implemented and visible in correct role dashboards
- [ ] Monthly income report verified
- [ ] Payment status report verified
- [ ] Occupancy/availability report verified
- [ ] Reservation statistics report verified
- [ ] Logs viewer implemented for admin
- [ ] Activity log filtering works
- [ ] Error log filtering works
- [ ] Feedback/ratings module implemented
- [ ] Feedback role access rules enforced
- [ ] Responsive behavior validated on mobile/tablet/desktop
- [ ] Security hardening pass completed
- [ ] Unauthorized access handling verified (`401/403`)
- [ ] Safe error exposure verified
- [ ] Phase 6 status stable

## Footprint Log Template (For Documentation/Defense)

Fill this while doing Phase 6 manually:

- Confirmed Phase 5 stable baseline (`yes/no`)
- Implemented reports backend logic (`yes/no`)
- Implemented reports frontend view (`yes/no`)
- Verified monthly income report totals (`yes/no`)
- Verified payment status report totals (`yes/no`)
- Verified occupancy/availability report totals (`yes/no`)
- Verified reservation statistics report totals (`yes/no`)
- Implemented logs viewer UI (`yes/no`)
- Added activity log filters (`yes/no`)
- Added error log filters (`yes/no`)
- Implemented feedback/ratings backend (`yes/no`)
- Implemented feedback/ratings frontend (`yes/no`)
- Verified role restrictions for feedback/logs/reports (`yes/no`)
- Completed responsive test pass (`yes/no`)
- Completed security hardening checklist (`yes/no`)
- Verified `401` handling (`yes/no`)
- Verified `403` handling (`yes/no`)
- Verified `500` handling without sensitive leakage (`yes/no`)
- Final Phase 6 status: `complete/incomplete`

## Common Phase 6 Issues

- Report totals are incorrect:
  - Aggregation query scope or date filter is wrong.

- Logs viewer is too slow:
  - Missing indexes, no pagination, or fetching too much data at once.

- Feedback can be submitted by wrong users:
  - Backend role/ownership checks missing.

- Mobile layout breaks on tables:
  - No overflow strategy or fixed-width columns.

- Security hardening appears done but endpoints still leak details:
  - Exception messages are returned directly instead of sanitized server errors.

- Unauthorized access still works from direct API calls:
  - Frontend guard exists but backend RBAC validation is incomplete.
