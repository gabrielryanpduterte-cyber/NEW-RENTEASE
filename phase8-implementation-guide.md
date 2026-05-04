# Phase 8 Implementation Guide (RENTEASE)

This guide is for manual execution of Phase 8 only.  
Goal: close the post-Phase-7 gaps with automation and remaining feature coverage.

## Phase 8 Scope

Phase 8 focuses on stabilizing daily developer/testing workflow and implementing remaining practical gaps.

Core tasks:
- Add local setup automation
- Add repeatable API smoke-test automation
- Add frontend self-registration flow
- Add file upload module with RBAC scope

Primary outputs in this phase:
- `scripts/phase8-local-setup.ps1`
- `scripts/phase8-api-smoke-test.ps1`
- frontend `/register` route and page
- backend `uploads.php` resource + seeker dashboard uploads UI

## Before You Start

1. Confirm Phase 7 baseline:
   - Existing modules run without fatal errors
   - DB schema/tables are present
2. Ensure runtime requirements:
   - XAMPP `Apache` and `MySQL` installed
   - Node.js and npm installed
3. Confirm working folder layout:
   - project root contains `rentease/`
   - backend and frontend directories are unchanged

## Step 1: Run Local Setup Automation

Use the Phase 8 setup script to standardize local runtime path and database readiness.

Command:

```powershell
powershell -ExecutionPolicy Bypass -File rentease\scripts\phase8-local-setup.ps1 -SeedMode reseed
```

If `C:\xampp\htdocs\rentease` already exists and points to a different project:

```powershell
powershell -ExecutionPolicy Bypass -File rentease\scripts\phase8-local-setup.ps1 -SeedMode reseed -ForceLink
```

Expected outcomes:
1. Creates/validates `C:\xampp\htdocs\rentease` junction to project path
2. Creates `rentease_db` if missing
3. Creates/grants `rentease_user@localhost`
4. Imports seed data when `-SeedMode reseed` or `-SeedMode final`

## Step 2: Execute API Smoke Tests

Run a role-by-role API validation pass after setup.

Command:

```powershell
powershell -ExecutionPolicy Bypass -File rentease\scripts\phase8-api-smoke-test.ps1
```

What the smoke test validates:
1. Unauthenticated `auth.php?action=me` returns `401`
2. Login/session/logout works for `admin`, `owner`, `seeker`, `parent`
3. Role-scoped GET requests return success for key modules

Optional extended check:

```powershell
powershell -ExecutionPolicy Bypass -File rentease\scripts\phase8-api-smoke-test.ps1 -RunFrontendChecks
```

This also runs frontend `lint` + `build`.

## Step 3: Validate Registration Flow

Frontend registration route:
- `http://localhost:5173/register`

Expected behavior:
1. User can register as `seeker`, `parent`, or `owner`
2. Registration calls backend `auth.php?action=register`
3. Successful registration auto-logins and redirects to role dashboard
4. Validation errors are rendered in the UI

## Step 4: Validate Upload Module

Backend resource:
- `backend/uploads.php`

Accepted file types:
- `application/pdf`
- `image/jpeg`
- `image/png`
- `image/webp`

Size limit:
- 5 MB

Core checks:
1. Seeker uploads file from dashboard upload section
2. File metadata appears in upload list
3. File is retrievable via returned file URL
4. Upload delete works for owner/uploader/admin access scope
5. Unauthorized users cannot access unrelated uploads

## Step 5: Run Phase 8 Verification Matrix

1. Execute setup script successfully on a clean machine path.
2. Execute smoke test script with all PASS results.
3. Register a new seeker via `/register`.
4. Login as the new seeker and confirm dashboard access.
5. Upload a valid PDF/JPG/PNG/WEBP and confirm listing.
6. Attempt invalid upload (file type or >5 MB) and confirm validation failure.
7. Confirm existing reservation/payment/report/feedback modules remain working.
8. Run frontend `npm run lint` and `npm run build`.

## Phase 8 Completion Checklist

- [ ] Local setup script added and validated
- [ ] API smoke-test script added and validated
- [ ] Frontend registration page and route implemented
- [ ] Backend registration integration verified end-to-end
- [ ] Upload API module implemented
- [ ] Upload UI integrated for seeker workflow
- [ ] Upload RBAC scope validated
- [ ] No regressions in Phase 6/7 core flows
- [ ] README updated with Phase 8 execution commands

## Footprint Log Template (For Documentation/Defense)

Fill this during Phase 8 execution:

- Setup script executed (`yes/no`)
- DB user and grants verified (`yes/no`)
- Demo seed imported (`yes/no`)
- Smoke test passed (`yes/no`)
- Frontend checks passed (`yes/no`)
- Registration flow tested (`yes/no`)
- Upload create/list/delete tested (`yes/no`)
- Role-restriction checks for uploads tested (`yes/no`)
- Final Phase 8 status: `complete/incomplete`

## Common Phase 8 Issues

- Setup script fails to create junction:
  - Existing `C:\xampp\htdocs\rentease` is a regular folder, not a link.

- Smoke test fails at login:
  - Seed data missing or backend path mismatch (`/rentease/backend`).

- Upload fails with validation:
  - Unsupported MIME type or file size exceeds 5 MB.

- Upload list appears empty after success:
  - Session/account mismatch or wrong role scope filter.
