# RentEase Staging Deployment and Team Testing Runbook

Last updated: 2026-05-11

This guide is adapted to the code that is currently implemented in this repository:

- Backend: custom PHP API modules in `backend/`
- Auth: PHP session cookies with role checks
- Frontend: React + Vite + React Router using `fetch` through `frontend/src/api/client.js`
- Database: MySQL / MariaDB SQL files in `database/`
- Local dev: XAMPP Apache + MySQL

Do not follow Laravel, Sanctum, Axios, or `php artisan` steps for this repo unless the backend is later migrated to Laravel. Those tools are not currently implemented here.

## What Was Implemented In The Repo

These files were added or updated so the manual deployment steps have working project support:

- `backend/.env.example`
- `frontend/.env.example`
- `backend/railway.json`
- `frontend/vercel.json`
- `backend/ping.php`
- `database/staging_seed.sql`
- `.gitignore`
- `backend/config.php`
- `backend/auth.php`
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/config/google-oauth.js`

## What Must Be Done Manually

An AI agent cannot create or approve these external resources for you:

- Create or connect GitHub, Railway, Vercel, and optional Google Cloud accounts.
- Create Railway and Vercel projects from the GitHub repository.
- Add Railway MySQL service and copy environment variable references.
- Set Vercel environment variables.
- Configure GitHub branch protection rules.
- Approve paid/free-tier terms and organization/team invitations.
- Run database imports in Railway if the Railway database is not directly reachable from this machine.
- Replace placeholder domains with your real Railway and Vercel URLs.

## Important Current-Stack Corrections

Use these endpoint patterns:

- Local backend through XAMPP: `http://localhost/rentease/backend`
- Local Vite proxy base: `/backend`
- Railway backend root: `https://your-backend.up.railway.app`
- Health check: `/ping.php`
- Example API endpoint: `/auth.php?action=login`

Do not use `/api` unless the backend is later refactored behind an API router.

## Git Strategy

Permanent branches:

- `main`: production-ready only
- `staging`: team testing branch
- `develop`: active integration branch

Short-lived branches:

- `feature/name`
- `fix/bug-name`
- `hotfix/urgent-name`

Rules:

- Work on feature/fix branches only.
- Merge feature branches into `develop` by pull request.
- Merge `develop` into `staging` when ready for team testing.
- Merge `staging` into `main` only after team sign-off.
- Do not force push to `develop`, `staging`, or `main`.

Commit examples:

```text
feat: add guardian link testing route
fix: resolve staging cookie login issue
style: improve rent tracking table layout
refactor: normalize API error handling
chore: update deployment docs
seed: add staging test accounts and sample rooms
```

Manual GitHub setup:

1. Open the GitHub repository settings.
2. Create `develop` and `staging` branches if they do not exist.
3. Add branch protection for `main`, `staging`, and `develop`.
4. Require pull requests before merging.
5. Disable force pushes on protected branches.

## Local Setup

From repo root:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
```

Edit `backend/.env` for local XAMPP MySQL:

```env
RENTEASE_DB_HOST=localhost
RENTEASE_DB_PORT=3307
RENTEASE_DB_NAME=rentease_db
RENTEASE_DB_USER=root
RENTEASE_DB_PASS=
RENTEASE_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
RENTEASE_COOKIE_SAMESITE=Lax
```

Install backend dependencies:

```powershell
cd backend
composer install
```

Install frontend dependencies:

```powershell
cd ..\frontend
npm install
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend health check through XAMPP: `http://localhost/rentease/backend/ping.php`

## Database Setup

Use the committed base schema first, then apply the staging seed. The seed is still written defensively so it can add later testing tables/columns when needed, but a fresh database should always start from `database/rentease_base_schema.sql`.

Recommended fresh database flow:

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS rentease_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p rentease_db < database\rentease_base_schema.sql
mysql -u root -p rentease_db < database\staging_seed.sql
```

For teammate local testing, the easier path is:

```powershell
.\scripts\team-test-setup.ps1
```

That script creates the local database and imports both SQL files automatically.

Seeded login accounts:

| Role | Email | Password | Login role |
| --- | --- | --- | --- |
| Admin | `admin@rentease.test` | `Admin@1234` | `admin` |
| Landlord | `landlord@rentease.test` | `Owner@1234` | `owner` |
| Seeker 1 | `seeker1@rentease.test` | `Seeker@1234` | `seeker` |
| Seeker 2 | `seeker2@rentease.test` | `Seeker@1234` | `seeker` |

The seed also outputs a guardian URL path:

```text
/guardian-view/<generated-token>
```

Use the frontend domain before that path:

```text
https://your-vercel-domain.vercel.app/guardian-view/<generated-token>
```

## Railway Backend Deployment

Manual steps:

1. Create or log in to Railway.
2. Create a new project from the GitHub repository.
3. Set the service root directory to `backend`.
4. Confirm Railway sees `backend/railway.json`.
5. Add a MySQL service to the same Railway project.
6. Set the backend service variables below.
7. Deploy the backend service.
8. Open `https://your-backend.up.railway.app/ping.php`.

Backend Railway variables:

```env
RENTEASE_APP_NAME=RentEase
RENTEASE_APP_ENV=staging
RENTEASE_APP_URL=https://your-backend.up.railway.app
RENTEASE_FRONTEND_URL=https://your-frontend.vercel.app

RENTEASE_DB_HOST=${{MySQL.MYSQLHOST}}
RENTEASE_DB_PORT=${{MySQL.MYSQLPORT}}
RENTEASE_DB_NAME=${{MySQL.MYSQLDATABASE}}
RENTEASE_DB_USER=${{MySQL.MYSQLUSER}}
RENTEASE_DB_PASS=${{MySQL.MYSQLPASSWORD}}

RENTEASE_ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://*.vercel.app,http://localhost:5173,http://127.0.0.1:5173
RENTEASE_COOKIE_SAMESITE=None

GOOGLE_OAUTH_ENABLED=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://your-frontend.vercel.app/auth/google/callback
```

Notes:

- Railway's MySQL variables are currently named `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, and `MYSQL_URL`.
- `backend/config.php` also accepts underscore variants like `MYSQL_HOST`, but the no-underscore names match Railway's current docs.
- `RENTEASE_COOKIE_SAMESITE=None` is required for cross-site cookie login from Vercel to Railway.
- If browser login still fails because third-party cookies are blocked, use a shared custom domain setup or add a Vercel rewrite proxy for `/backend/*`.
- File uploads currently write to `backend/storage`. Railway app filesystem can be replaced on redeploy, so use a Railway volume for persistent upload testing or treat uploaded photos/proofs as disposable staging files.

Railway database import:

Use Railway's database shell, local MySQL client with Railway TCP proxy credentials, or another SQL client. Run:

```bash
mysql -h <railway-mysql-host> -P <railway-mysql-port> -u <railway-mysql-user> -p <railway-db-name> < database/rentease_base_schema.sql
mysql -h <railway-mysql-host> -P <railway-mysql-port> -u <railway-mysql-user> -p <railway-db-name> < database/staging_seed.sql
```

## Vercel Frontend Deployment

Manual steps:

1. Create or log in to Vercel.
2. Import the GitHub repository.
3. Set root directory to `frontend`.
4. Set framework preset to Vite.
5. Set build command to `npm run build`.
6. Set output directory to `dist`.
7. Add the frontend variables below.
8. Deploy.

Frontend Vercel variables:

```env
VITE_API_BASE_URL=https://your-backend.up.railway.app
VITE_APP_ENV=staging
VITE_APP_NAME=RentEase Staging

VITE_ENABLE_GOOGLE_AUTH=false
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_REDIRECT_URI=https://your-frontend.vercel.app/auth/google/callback
```

The committed `frontend/vercel.json` rewrites all non-file paths to `/index.html`, which is required for React Router refreshes such as:

- `/dashboard`
- `/owner/rooms`
- `/admin/dashboard`
- `/guardian-view/<token>`

## Optional Google OAuth Manual Setup

Only do this if the team needs Google sign-in during staging.

1. Open Google Cloud Console.
2. Create OAuth 2.0 credentials for a Web application.
3. Add JavaScript origins:
   - `http://localhost:5173`
   - `https://your-frontend.vercel.app`
4. Add redirect URIs:
   - `http://localhost:5173/auth/google/callback`
   - `https://your-frontend.vercel.app/auth/google/callback`
5. Set backend variables:
   - `GOOGLE_OAUTH_ENABLED=true`
   - `GOOGLE_CLIENT_ID=<client-id>`
   - `GOOGLE_CLIENT_SECRET=<client-secret>`
   - `GOOGLE_REDIRECT_URI=https://your-frontend.vercel.app/auth/google/callback`
6. Set frontend variables:
   - `VITE_ENABLE_GOOGLE_AUTH=true`
   - `VITE_GOOGLE_CLIENT_ID=<client-id>`
   - `VITE_GOOGLE_REDIRECT_URI=https://your-frontend.vercel.app/auth/google/callback`
7. Redeploy both services.

## Team Testing Assignments

Assign one primary role per teammate.

Seeker:

- [ ] Login with `seeker1@rentease.test` using role `seeker`.
- [ ] Dashboard loads.
- [ ] My Room shows Room 102.
- [ ] Payments/Rent page shows current month unpaid.
- [ ] Upload payment proof on the unpaid row.
- [ ] Reservations show approved and cancelled history.
- [ ] Guardian Access creates or displays a guardian link.
- [ ] Open guardian link in incognito.
- [ ] Profile contact update saves.

Landlord:

- [ ] Login with `landlord@rentease.test` using role `owner`.
- [ ] Dashboard stat cards load.
- [ ] Property page shows Santos Boarding House.
- [ ] Rooms page shows 5 active rooms and 1 archived room.
- [ ] Add a new room with amenities.
- [ ] Reservations page shows 1 pending reservation.
- [ ] Approve the pending reservation.
- [ ] Verify Room 101 changes after approval.
- [ ] Rent Tracking shows current unpaid entries.
- [ ] Mark Seeker 1 current rent as paid.
- [ ] Reports page loads income/payment summaries.

Admin:

- [ ] Login with `admin@rentease.test` using role `admin`.
- [ ] Admin dashboard loads.
- [ ] Users section lists staging users.
- [ ] Deactivate Seeker 2.
- [ ] Verify Seeker 2 cannot login in incognito.
- [ ] Reactivate Seeker 2.
- [ ] Activity Logs show seeded and session actions.
- [ ] Error Logs show the seeded errors.
- [ ] Delete one seeded error log if you need to test log cleanup.
- [ ] Boarding House section shows Santos Boarding House.

Guardian public view:

- [ ] Open the seeded guardian URL in incognito.
- [ ] Confirm it shows Juan dela Cruz.
- [ ] Confirm Room 102 is shown.
- [ ] Confirm current month rent is unpaid.
- [ ] Reopen the copied URL and verify it still works.
- [ ] Revoke the link from Seeker 1's Guardian Access page.
- [ ] Reopen the URL and verify the invalid-link message.

## Staging Deployment Checklist

Before merging `develop` into `staging`:

- [ ] Pull requests into `develop` were reviewed.
- [ ] `npm run build` passes in `frontend/`.
- [ ] PHP syntax check passes for changed backend files.
- [ ] No `dd()`, `dump()`, or temporary debug output exists in PHP.
- [ ] `.env.example` files include any new variables.
- [ ] New SQL files are documented in the pull request.
- [ ] Team is notified before pushing to `staging`.

Deployment:

```bash
git checkout staging
git merge develop
git push origin staging
```

Post-deploy checks:

- [ ] `https://your-backend.up.railway.app/ping.php` returns status `ok`.
- [ ] `https://your-frontend.vercel.app` loads.
- [ ] Admin login succeeds.
- [ ] Landlord login succeeds.
- [ ] Seeker login succeeds.
- [ ] Guardian public URL loads.

## Staging Database Reset Protocol

Resetting staging data deletes teammate test work.

1. Announce: `Resetting staging DB in 5 minutes.`
2. Wait for active testers to acknowledge.
3. Run the schema/import reset or `database/staging_seed.sql`.
4. Announce: `Staging DB reset. Use seeded test accounts.`
5. Share the new guardian URL from the seed output.

Never reset during an active test session.

## API Contract Template

Document every new or changed endpoint before the frontend depends on it.

```md
### Endpoint Name

Method: POST
URL: /billing.php?action=generate
Auth: session cookie, role=owner or admin
Request body:
{
  "month": "2026-05"
}
Success response:
200 {
  "success": true,
  "message": "...",
  "data": {}
}
Error responses:
- 400 validation
- 401 unauthenticated
- 403 forbidden
- 500 server error
```

Frontend rule:

- Use `apiRequest()` or exported API helpers from `frontend/src/api/client.js`.
- Do not hardcode `http://localhost` inside React components.
- Add new Vite variables to `frontend/.env.example`.

Backend rule:

- Use `helpers.php` request/auth/response helpers.
- Do not add a second response format.
- Do not alter old SQL migration/phase files after teammates have run them. Add a new SQL file instead.

## Enhanced Prompt For Future AI Work

Use this when asking another AI agent to continue deployment work:

```text
Act as a prompt engineer, full-stack developer, deployment specialist, and planning expert for RentEase.

First inspect the repository and use only the tech stack that is actually implemented. The current repo is a custom PHP backend with MySQL SQL files and a React Vite frontend. Do not scaffold Laravel, Sanctum, Axios, or artisan commands unless the repo has already been migrated to those tools.

Goal: prepare or improve the pre-production staging setup for team testing across Seeker, Landlord/Owner, Admin, and Guardian public view.

Do the tasks that can be safely implemented in the repo, such as env examples, deployment config, health checks, CORS/session settings, seed SQL, frontend routing config, and testing docs. For tasks that require external accounts or dashboard access, write exact manual steps in Markdown.

Constraints:
- Keep secrets out of git.
- Keep changes compatible with XAMPP local development.
- Use `/backend` locally and Railway backend root URLs in staging.
- Current backend endpoints are PHP files like `/auth.php?action=login`, not `/api/*`.
- Current frontend uses `fetch` through `frontend/src/api/client.js`, not Axios.
- For Vercel, preserve React Router deep links.
- For Railway, use the backend root directory and MySQL variables from Railway.

Before finishing, run available syntax/build checks and summarize files changed, manual steps remaining, and any blockers.
```

## Official References Checked

- Railway Config as Code: https://docs.railway.com/reference/config-as-code
- Railway MySQL variables: https://docs.railway.com/guides/mysql
- Railway start commands: https://docs.railway.com/guides/start-command
- Vercel Vite SPA rewrites: https://vercel.com/docs/frameworks/frontend/vite
- Vercel rewrites: https://vercel.com/docs/routing/rewrites
