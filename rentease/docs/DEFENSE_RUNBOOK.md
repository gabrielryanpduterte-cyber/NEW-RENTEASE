# RENTEASE Defense Runbook (Phase 7)

Use this script for demo/defense delivery. Keep execution tight and role-focused.

## Target Duration

- Total: 12-15 minutes
- Setup check: 2 minutes
- Functional walkthrough: 8-10 minutes
- Q&A buffer: 2-3 minutes

## Pre-Demo Checklist

- Apache and MySQL are running in XAMPP
- Frontend is running (`npm run dev`)
- Database imported from `database/rentease_final_phase7.sql`
- Demo accounts verified (admin/owner/seeker/parent)
- Browser has no stale session (incognito recommended)

## Walkthrough Sequence

### 1) System Overview (1 minute)

- Present architecture:
  - React frontend (`frontend/`)
  - PHP resource APIs (`backend/`)
  - MySQL database (`database/`)
- State RBAC model: seeker, parent, owner, admin

### 2) Authentication + RBAC (2 minutes)

1. Login as `seeker`
2. Show seeker dashboard scope only
3. Attempt restricted admin route (expect unauthorized behavior)
4. Logout

### 3) Core Transaction Flow (3-4 minutes)

1. As seeker/parent: show reservations and submit/view request
2. Logout, login as owner:
   - review reservation queue
   - approve/reject reservation
   - record payment (paid/unpaid states)
3. Logout, login as seeker/parent:
   - verify updated reservation/payment status

### 4) Phase 6 Features (3-4 minutes)

1. Owner/Admin reports:
   - monthly income
   - payment status
   - occupancy/availability
   - reservation statistics
2. Admin logs viewer:
   - activity logs filters
   - error logs filters and pagination
3. Feedback module:
   - seeker/parent submission
   - owner visibility
   - admin moderation (visible/hidden)

### 5) Security + Hardening Highlights (1-2 minutes)

- Backend RBAC enforced (not frontend-only)
- Validation errors return safe messages
- Unauthorized requests return `401/403`
- No raw exception stack traces in responses

### 6) Final Artifacts (1 minute)

- Show `README.md` setup instructions
- Show final SQL artifact:
  - `database/rentease_final_phase7.sql`
- Mention demo reseed script:
  - `database/phase7_demo_seed.sql`

## Fallback Plan

If live mutation fails:

1. Reload from seeded data and continue read-only tour.
2. Show expected API behavior via existing records.
3. Resume from admin reports/logs/feedback modules.

If one account cannot login:

1. Use another seeded role first.
2. Continue with available scope.
3. Return to missing role after quick credential check.

## Expected Questions and Short Answers

- Why role-based separation?
  - Prevents cross-role data exposure and enforces least privilege.

- How are direct API calls protected?
  - Backend `require_auth` / `require_roles` checks, plus ownership validation.

- How was final package prepared?
  - Seeded demo data, completed README, exported final SQL dump, rehearsed runbook.
