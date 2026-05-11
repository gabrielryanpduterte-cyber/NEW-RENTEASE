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
- Local runtime: Docker Compose

## Project Structure

- `backend/` PHP API modules (`auth`, `users`, `rooms`, `reservations`, `payments`, `reports`, `feedback`, logs)
  - includes `uploads.php` for file attachments
- `frontend/` React application
- `database/` SQL artifacts for final restore and reseeding
- `scripts/` local setup and smoke-test automation

## Prerequisites

- Docker Desktop installed and running
- Git access to this repository

## Database Setup

Docker imports the database automatically on first startup:

1. `database/rentease_base_schema.sql`
2. `database/staging_seed.sql`

To reseed the Docker database:

```powershell
.\scripts\docker-dev.ps1 -ResetDatabase
```

## Backend Configuration

Docker Compose supplies the backend environment:

- host: `mysql`
- port: `3306`
- database: `rentease_db`
- user: `rentease`
- password: `rentease`

Override with environment variables when needed:
- `RENTEASE_DB_HOST`
- `RENTEASE_DB_NAME`
- `RENTEASE_DB_USER`
- `RENTEASE_DB_PASS`
- `RENTEASE_ALLOWED_ORIGINS` (comma-separated list)

Backend base URL:
- `http://localhost:8080`

Health/session check:
- `GET http://localhost:8080/ping.php`

## Frontend Setup

From the repo root:

```powershell
.\scripts\docker-dev.ps1
```

Default local URL:
- `http://localhost:5173`

The Vite proxy rewrites `/backend/*` to the Docker backend container.

### Google Authentication (Optional)

To enable Google Sign-In:
1. See `QUICK_GOOGLE_SETUP.md` for step-by-step instructions
2. Configure OAuth Client ID in Google Cloud Console
3. Update `frontend/src/config/google-oauth.js` with your Client ID
4. Set `ENABLE_GOOGLE_AUTH = true`

To disable Google Sign-In:
- Set `ENABLE_GOOGLE_AUTH = false` in `frontend/src/config/google-oauth.js`

## Demo Accounts

These are pre-seeded by the Docker database seed:

- Admin: `admin@rentease.test` / `Admin@1234`
- Landlord: `landlord@rentease.test` / `Owner@1234`
- Seeker 1: `seeker1@rentease.test` / `Seeker@1234`
- Seeker 2: `seeker2@rentease.test` / `Seeker@1234`

Admin access is hidden from the sign-in role buttons. Use the admin email/password and the app redirects to the admin dashboard.

## Feature Summary

- Auth/session: login, logout, current user session endpoint
- Frontend auth UX: login + self-registration (`seeker`, `parent`, `owner`)
- Login flow: email + password + selected role for public roles; admin access is inferred from the admin account
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
  - role-aware login (`auth.php?action=login`)
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

## Database Artifacts

- Docker base schema: `database/rentease_base_schema.sql`
- Docker staging seed: `database/staging_seed.sql`
- Defense runbook: `DEFENSE_RUNBOOK.md`

## Quick Start (5 Minutes)

Get RENTEASE running immediately:

```powershell
# Start Docker services
.\scripts\docker-dev.ps1
```

Then visit `http://localhost:5173` and login with demo accounts.

**See `docs/DOCKER_DEVELOPMENT.md` for detailed instructions and troubleshooting.**

## Deployment

### Local Development

1. **Start**: Run `.\scripts\docker-dev.ps1`
2. **Verify**: Open `http://localhost:5173` and `http://localhost:8080/ping.php`
3. **Test**: Run `.\scripts\pre-deployment-test.ps1`

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
