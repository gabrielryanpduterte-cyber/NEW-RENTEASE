# Phase 9 Implementation Guide (RENTEASE)

This guide is for manual execution of Phase 9 only.  
Goal: add account self-service hardening for all roles and automate validation of profile/password lifecycle.

## Phase 9 Scope

Phase 9 focuses on account lifecycle completeness after Phase 8.

Core tasks:
- Add backend self-service profile update endpoint
- Add backend self-service password change endpoint
- Add frontend account settings module to all role dashboards
- Add repeatable Phase 9 account smoke-test automation

Primary outputs in this phase:
- `backend/auth.php` new actions:
  - `POST ?action=update_profile`
  - `POST ?action=change_password`
- frontend reusable account module integrated in:
  - seeker dashboard
  - parent dashboard
  - owner dashboard
  - admin dashboard
- `scripts/phase9-account-smoke-test.ps1`

## Before You Start

1. Confirm Phase 8 baseline:
   - setup script and API smoke tests already pass
   - registration and uploads are working
2. Ensure runtime requirements:
   - XAMPP `Apache` and `MySQL` are running
   - frontend dependencies are installed
3. Confirm seeded demo accounts still use default credentials from README.

## Step 1: Implement Backend Account Self-Service

Target file:
- `rentease/backend/auth.php`

Add actions for authenticated users:
1. `update_profile`
   - allows updating `full_name`, `email`, `contact_number`
   - validates email format and uniqueness
   - blocks empty profile fields
   - refreshes session user payload after update
2. `change_password`
   - requires `current_password` and `new_password`
   - verifies current password matches
   - enforces minimum length (8)
   - blocks no-op password reuse

Security requirement:
- only the currently authenticated user updates their own profile/password.

## Step 2: Integrate Account Module in Frontend

Add a reusable dashboard card component for:
1. Profile update form
2. Password change form

Integration targets:
- `rentease/frontend/src/pages/dashboards/SeekerDashboard.jsx`
- `rentease/frontend/src/pages/dashboards/ParentDashboard.jsx`
- `rentease/frontend/src/pages/dashboards/OwnerDashboard.jsx`
- `rentease/frontend/src/pages/dashboards/AdminDashboard.jsx`

Also update:
- API client auth methods for the new backend actions
- dashboard navigation links to include `#account` anchor

Expected behavior:
1. Any logged-in role can update own profile details
2. Any logged-in role can change own password using current password
3. Success/error feedback renders in the same card module pattern as other features

## Step 3: Execute Phase 9 Account Smoke Tests

Command:

```powershell
powershell -ExecutionPolicy Bypass -File rentease\scripts\phase9-account-smoke-test.ps1
```

What the smoke test validates:
1. Login works for `admin`, `owner`, `seeker`, `parent`
2. `update_profile` succeeds and is reflected in `auth.php?action=me`
3. `change_password` succeeds per role
4. Login with temporary password works
5. Profile/password are restored back to original defaults

Optional extended check:

```powershell
powershell -ExecutionPolicy Bypass -File rentease\scripts\phase9-account-smoke-test.ps1 -RunFrontendChecks
```

This also runs frontend `lint` + `build`.

## Step 4: Run Phase 9 Verification Matrix

1. Login as each seeded role.
2. Open dashboard `#account` section.
3. Update profile fields and confirm dashboard account panel reflects changes.
4. Change password and confirm logout/login using the new password.
5. Revert password to baseline test credential.
6. Run Phase 9 smoke-test script and confirm PASS results.
7. Run frontend `npm run lint` and `npm run build`.

## Phase 9 Completion Checklist

- [ ] Backend `update_profile` action implemented and validated
- [ ] Backend `change_password` action implemented and validated
- [ ] Frontend account settings card integrated for all role dashboards
- [ ] Nav links include account section anchor per role
- [ ] Phase 9 account smoke-test script added and validated
- [ ] No regressions in reservation/payment/report/feedback/upload flows
- [ ] README updated with Phase 9 command/feature notes

## Footprint Log Template (For Documentation/Defense)

Fill this during Phase 9 execution:

- Backend profile-update action tested (`yes/no`)
- Backend password-change action tested (`yes/no`)
- Seeker account module tested (`yes/no`)
- Parent account module tested (`yes/no`)
- Owner account module tested (`yes/no`)
- Admin account module tested (`yes/no`)
- Phase 9 smoke test passed (`yes/no`)
- Frontend lint/build passed (`yes/no`)
- Final Phase 9 status: `complete/incomplete`

## Common Phase 9 Issues

- Password change fails with validation:
  - `current_password` mismatch or new password shorter than 8 characters.

- Profile update fails with duplicate email:
  - target email already belongs to another user account.

- Session appears stale after profile update:
  - client must refresh auth session state after success.

- Smoke test leaves credentials changed:
  - script execution interrupted before restore step; re-run script to restore baseline.
