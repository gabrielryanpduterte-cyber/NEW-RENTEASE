# Phase 10 Implementation Guide (RENTEASE)

This guide is for manual execution of Phase 10 only.  
Goal: move from seed-only demo behavior to a real-user onboarding flow with role-selected login and parent-seeker account linking.

## Phase 10 Scope

Phase 10 focuses on production-like onboarding behavior and parent monitoring eligibility.

Core tasks:
- Change login flow to require explicit role selection
- Add parent-seeker linking request/approval workflow
- Enforce parent monitoring scope to approved linked seeker accounts only
- Add Phase 10 onboarding smoke-test automation

Primary outputs in this phase:
- `backend/auth.php` login update (`role` required on login)
- `backend/account_links.php` (parent-seeker link API)
- `database/phase10_parent_seeker_links_schema.sql`
- `frontend` connection manager module (parent + seeker dashboards)
- `scripts/phase10-onboarding-smoke-test.ps1`

## Clarified Authentication Flow (Phase 10)

New login behavior:
1. User enters `email`
2. User enters `password`
3. User selects `role` (`seeker`, `parent`, `owner`, `admin`)
4. Backend authenticates only if credentials and selected role match the stored account

Registration behavior:
1. Unknown user can self-register as `seeker`, `parent`, or `owner`
2. `admin` remains restricted to backend/admin creation

Parent monitoring behavior:
1. Parent can sign in
2. Parent must create/approve a link with a seeker account
3. Monitoring data is scoped to approved linked seekers only

## Before You Start

1. Confirm Phase 9 baseline passes:
   - account settings profile/password features are working
2. Ensure runtime requirements:
   - XAMPP `Apache` and `MySQL`
   - Node.js/npm installed
3. Ensure DB has Phase 10 schema applied:
   - `database/phase10_parent_seeker_links_schema.sql`

## Step 1: Apply Phase 10 Database Schema

Command:

```powershell
mysql -u root -p rentease_db < rentease\database\phase10_parent_seeker_links_schema.sql
```

Or run setup automation (already updated to include Phase 10 schema):

```powershell
powershell -ExecutionPolicy Bypass -File rentease\scripts\phase8-local-setup.ps1 -SeedMode reseed
```

## Step 2: Validate Role-Selected Login Flow

Frontend route:
- `http://localhost:5173/login`

Expected behavior:
1. Login form includes role selector
2. Wrong role selection with valid email/password returns login failure
3. Correct role selection logs user into correct dashboard

## Step 3: Validate Parent-Seeker Linking Flow

New backend resource:
- `backend/account_links.php`

Expected behavior:
1. Parent sends link request to seeker email
2. Seeker can approve/reject incoming pending request
3. Approved status unlocks parent monitoring visibility for that seeker’s records
4. Cancel/unlink actions are available per role ownership rules

## Step 4: Execute Phase 10 Onboarding Smoke Tests

Command:

```powershell
powershell -ExecutionPolicy Bypass -File rentease\scripts\phase10-onboarding-smoke-test.ps1
```

What this smoke test validates:
1. Unauthenticated `auth.php?action=me` returns `401`
2. New unknown users can register as seeker/parent/owner
3. Login role mismatch is rejected
4. Correct role login succeeds
5. Seeker-to-parent link request and parent approval flow succeeds
6. Parent monitoring endpoint access works after link approval

Optional extended check:

```powershell
powershell -ExecutionPolicy Bypass -File rentease\scripts\phase10-onboarding-smoke-test.ps1 -RunFrontendChecks
```

This also runs frontend `lint` + `build`.

## Step 5: Run Phase 10 Verification Matrix

1. Register a brand-new seeker account.
2. Register a brand-new parent account.
3. Confirm wrong-role login fails.
4. Confirm correct-role login succeeds.
5. Send parent-seeker link request.
6. Approve request from counterpart account.
7. Confirm parent monitoring modules return linked seeker data scope only.
8. Confirm existing owner/admin flows are unaffected.
9. Run Phase 10 smoke test and confirm all checks pass.

## Phase 10 Completion Checklist

- [ ] Login now requires explicit role and validates role match
- [ ] Parent-seeker link schema added and applied
- [ ] `account_links.php` API implemented
- [ ] Parent/seeker dashboards include link management module
- [ ] Parent monitoring is scoped to approved linked seekers
- [ ] Phase 10 onboarding smoke-test script added and validated
- [ ] README updated with Phase 10 flow and commands

## Footprint Log Template (For Documentation/Defense)

Fill this during Phase 10 execution:

- Phase 10 schema applied (`yes/no`)
- Role-selected login tested (`yes/no`)
- Wrong-role login rejection tested (`yes/no`)
- Parent link request flow tested (`yes/no`)
- Seeker approval flow tested (`yes/no`)
- Parent monitoring after approval tested (`yes/no`)
- Phase 10 smoke test passed (`yes/no`)
- Frontend checks passed (`yes/no`)
- Final Phase 10 status: `complete/incomplete`

## Common Phase 10 Issues

- Login fails for known account:
  - Role selected in login form does not match the account role.

- Parent sees empty monitoring data:
  - No approved parent-seeker link exists yet.

- Link request fails:
  - Target email is not an active account of the required counterpart role.

- Setup script fails to apply Phase 10 schema:
  - Missing SQL file path or database permissions issue.
