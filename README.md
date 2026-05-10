# RENTEASE

Role-based boarding house management system built with PHP (backend), MySQL (database), and React + Vite (frontend).

This repository includes the Phase 7 baseline plus post-Phase-7 enhancements through Phase 10, including:
- demo-ready database data
- setup and smoke-test automation
- frontend self-registration + uploads
- account self-service (profile update and password change)
- real-user onboarding flow with role-selected login
- parent-seeker account linking and approval workflow
- defense walkthrough runbook

## Tech Stack

- Backend: PHP 8+, PDO, session-based auth, RBAC
- Frontend: React 19, React Router, Vite
- Database: MySQL / MariaDB
- Local runtime: XAMPP (Apache + MySQL)

## Project Structure

- `backend/` PHP API modules (`auth`, `users`, `rooms`, `reservations`, `payments`, `reports`, `feedback`, logs)
  - includes `uploads.php` for file attachments
- `frontend/` React application
- `database/` SQL artifacts for final restore and reseeding
- `scripts/` local setup and smoke-test automation

## Prerequisites

- XAMPP installed and running (`Apache`, `MySQL`)
- PHP available in PATH (or use XAMPP PHP binary)
- Node.js 18+ and npm

## Database Setup

Use the Phase 7 final SQL dump:
- `database/rentease_final_phase7.sql`
- then apply Phase 8 upload schema:
  - `database/phase8_uploads_schema.sql`
- then apply Phase 10 parent-seeker linking schema:
  - `database/phase10_parent_seeker_links_schema.sql`

### Option A: phpMyAdmin

1. Create database `rentease_db`
2. Import `database/rentease_final_phase7.sql`

### Option B: MySQL CLI

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS rentease_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p rentease_db < database/rentease_final_phase7.sql
mysql -u root -p rentease_db < database/phase8_uploads_schema.sql
mysql -u root -p rentease_db < database/phase10_parent_seeker_links_schema.sql
```

### Optional reseed only

If schema already exists, run:
- `database/phase7_demo_seed.sql`

## Backend Configuration

By default, `backend/config.php` uses:
- host: `localhost`
- database: `rentease_db`
- user: `rentease_user`
- password: empty string

Override with environment variables when needed:
- `RENTEASE_DB_HOST`
- `RENTEASE_DB_NAME`
- `RENTEASE_DB_USER`
- `RENTEASE_DB_PASS`
- `RENTEASE_ALLOWED_ORIGINS` (comma-separated list)

If you keep default backend credentials, create the DB user:

```sql
CREATE USER IF NOT EXISTS 'rentease_user'@'localhost' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON rentease_db.* TO 'rentease_user'@'localhost';
FLUSH PRIVILEGES;
```

If you prefer using root for local testing, set:
- `RENTEASE_DB_USER=root`
- `RENTEASE_DB_PASS=<your root password>`

Backend base path expected by frontend proxy:
- `http://localhost/rentease/backend`

Health/session check:
- `GET http://localhost/rentease/backend/auth.php?action=me`

## Frontend Setup

From `frontend/`:

```bash
npm install
npm run dev
```

Default local URL:
- `http://localhost:5173`

The Vite proxy rewrites `/backend/*` to `http://localhost/rentease/backend/*`.

### Google Authentication (Optional)

To enable Google Sign-In:
1. See `QUICK_GOOGLE_SETUP.md` for step-by-step instructions
2. Configure OAuth Client ID in Google Cloud Console
3. Update `frontend/src/config/google-oauth.js` with your Client ID
4. Set `ENABLE_GOOGLE_AUTH = true`

To disable Google Sign-In:
- Set `ENABLE_GOOGLE_AUTH = false` in `frontend/src/config/google-oauth.js`

## Demo Accounts

These are pre-seeded by `rentease_final_phase7.sql`:

- Admin: `admin@rentease.local` / `Admin123!`
- Owner: `owner@rentease.local` / `Owner123!`
- Seeker: `seeker@rentease.local` / `Seeker123!`
- Parent: `parent@rentease.local` / `Parent123!`

## Feature Summary

- Auth/session: login, logout, current user session endpoint
- Frontend auth UX: login + self-registration (`seeker`, `parent`, `owner`)
- Login flow: email + password + selected role (must match account role)
- RBAC dashboards: seeker, parent, owner, admin
- Core modules: users, boarding house, rooms, reservations, payments
- Phase 6 modules:
  - reports (income, payment status, occupancy, reservation stats)
  - logs viewer (activity + error logs with filters/pagination)
  - feedback/ratings (submission, visibility, moderation)
- Phase 8 modules:
  - uploads (PDF/images) with role-scoped access and metadata tracking
  - setup/smoke scripts under `scripts/`
- Phase 9 modules:
  - account self-service (`auth.php?action=update_profile`, `auth.php?action=change_password`)
  - dashboard account settings section for all roles
  - Phase 9 account smoke-test script
- Phase 10 modules:
  - role-required login (`auth.php?action=login` now requires `role`)
  - parent-seeker connection API (`account_links.php`)
  - connection manager UI for parent/seeker dashboards
  - parent monitoring data scoped to approved seeker links
  - Phase 10 onboarding smoke-test script
- Security controls:
  - backend input validation + prepared statements
  - strict RBAC enforcement
  - sanitized error responses
  - session/cookie hardening + basic security headers

## Recommended Smoke Test

1. Login as seeker and submit reservation
2. Login as owner and approve/reject reservation
3. Owner records payment
4. Seeker/parent submits feedback for approved reservation
5. Admin verifies reports, logs, and feedback moderation
6. Seeker uploads a reservation-related file and verifies visibility

## Phase 8 Automation

From project root:

```powershell
# One-time local mapping + DB user + seed
powershell -ExecutionPolicy Bypass -File scripts\phase8-local-setup.ps1 -SeedMode reseed
# if C:\xampp\htdocs\rentease exists but points to another project:
# powershell -ExecutionPolicy Bypass -File scripts\phase8-local-setup.ps1 -SeedMode reseed -ForceLink

# API smoke checks for all seeded roles
powershell -ExecutionPolicy Bypass -File scripts\phase8-api-smoke-test.ps1
```

## Phase 9 Automation

From project root:

```powershell
# Account self-service smoke checks for all seeded roles
powershell -ExecutionPolicy Bypass -File scripts\phase9-account-smoke-test.ps1
```

## Phase 10 Automation

From project root:

```powershell
# Real-user onboarding flow + role login + parent-seeker linking validation
powershell -ExecutionPolicy Bypass -File scripts\phase10-onboarding-smoke-test.ps1
```

## Phase 7 Artifacts

- Final SQL dump: `database/rentease_final_phase7.sql`
- Demo reseed script: `database/phase7_demo_seed.sql`
- Defense runbook: `DEFENSE_RUNBOOK.md`

## Quick Start (5 Minutes)

Get RENTEASE running immediately:

```powershell
# Run automated setup
.\scripts\quick-setup.ps1

# Start frontend
cd frontend
npm run dev
```

Then visit `http://localhost:5173` and login with demo accounts.

**See `QUICK_START.md` for detailed instructions and troubleshooting.**

## Deployment

### Local Development

1. **Quick Setup**: Run `.\scripts\quick-setup.ps1`
2. **Verify**: Run `.\scripts\verify-deployment.ps1`
3. **Test**: Run `.\scripts\pre-deployment-test.ps1`
4. **Start**: `cd frontend && npm run dev`

### Production Deployment

1. **Review**: Read `DEPLOYMENT_STATUS.md` for system readiness
2. **Checklist**: Follow `DEPLOYMENT_CHECKLIST.md` step-by-step
3. **Deploy**: Follow `PRODUCTION_DEPLOYMENT.md` for server setup
4. **Verify**: Run smoke tests and verify all features

### Deployment Resources

- **QUICK_START.md** - Get running in 5 minutes
- **DEPLOYMENT_STATUS.md** - System readiness overview
- **DEPLOYMENT_CHECKLIST.md** - Comprehensive deployment checklist
- **PRODUCTION_DEPLOYMENT.md** - Production server deployment guide
- **DEFENSE_RUNBOOK.md** - Feature walkthrough for demonstrations

## Known Limitations

- No CI test suite yet (manual verification matrix + phase smoke scripts are used)
- Single boarding house per owner is enforced by dataset/logic assumptions
- Upload module currently enforces only PDF/JPG/PNG/WEBP and 5 MB limit
- Email verification (OTP/link to inbox) is not implemented yet
