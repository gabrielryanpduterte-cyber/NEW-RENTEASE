# RentEase Production Readiness Guide

Use this as the step-by-step guide from the current GitHub branch to production.

Current stack: React/Vite frontend, custom PHP backend, MySQL/MariaDB SQL files, XAMPP locally, Railway plus Vercel for staging/production.

Do not use Laravel, Sanctum, Axios, `php artisan`, or Laravel migrations unless the repo is intentionally migrated later.

## Task 1 - Confirm Branch Workflow

- [ ] Keep `main` for production-ready code only.
- [ ] Create/use `develop` for active integration.
- [ ] Create/use `staging` for team testing.
- [ ] Keep feature branches short-lived.
- [ ] Protect `main` and `staging` in GitHub.
- [ ] Require pull request review before merge.

Commands if branches are missing:

```powershell
git switch main
git pull origin main
git switch -c develop
git push -u origin develop
git switch -c staging
git push -u origin staging
```

## Task 2 - Review Current Setup Branch

Current branch:

```text
feature/team-testing-setup
```

Pull request:

```text
https://github.com/gabrielryanpduterte-cyber/NEW-RENTEASE/pull/new/feature/team-testing-setup
```

Review these files before merging:

- `docs/TEAM_TESTING_FROM_GITHUB.md`
- `docs/STAGING_DEPLOYMENT_AND_TEAM_TESTING.md`
- `scripts/team-test-setup.ps1`
- `scripts/xampp-mysql-repair.ps1`
- `database/rentease_base_schema.sql`
- `database/staging_seed.sql`
- `backend/.env.example`
- `frontend/.env.example`
- `backend/railway.json`
- `frontend/vercel.json`

## Task 3 - Run Local Verification

Run from repo root:

```powershell
php -l backend\config.php
php -l backend\auth.php
php -l backend\ping.php
cd frontend
npm run lint
npm run build
```

Pass condition:

- [ ] PHP syntax checks pass.
- [ ] ESLint passes.
- [ ] Vite build passes.

## Task 4 - Decide Production Feature Gaps

Mark each as `Required before production` or `Out of scope for first release`.

- [ ] Forgot password backend flow.
- [ ] Email sending for password reset or account notifications.
- [ ] Admin System Config page.
- [ ] Configurable `max_guardian_links`; current limit is hardcoded to `5`.
- [ ] Error log `mark as resolved` workflow.
- [ ] Admin boarding house oversight/detail page.
- [ ] Guardian email invitation sending.
- [ ] Real payment gateway integration.
- [ ] SMS or email notifications.
- [ ] Persistent file storage for Railway uploads.

Recommendation: implement password reset and persistent upload storage before real production users. Payment gateway and SMS can be out of scope if manual rent tracking is accepted.

## Task 5 - Implement Required Gaps

Use one branch per feature:

```powershell
git switch develop
git pull origin develop
git switch -c feature/password-reset
```

Each feature must have:

- [ ] Backend validation.
- [ ] Role checks.
- [ ] Frontend UI.
- [ ] Test using seeded accounts.
- [ ] `.env.example` updates for new environment keys.
- [ ] New SQL file for database changes.

## Task 6 - Clean Clone Team Test

A teammate should test from a fresh clone:

```powershell
git clone https://github.com/gabrielryanpduterte-cyber/NEW-RENTEASE.git
cd NEW-RENTEASE
git switch staging
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\team-test-setup.ps1
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
http://localhost/rentease/backend/ping.php
```

Pass condition:

- [ ] Clean clone runs without manual DB editing.
- [ ] Admin, landlord, and seeker logins work.

## Task 7 - Deploy Staging Backend On Railway

Follow `docs/STAGING_DEPLOYMENT_AND_TEAM_TESTING.md`.

Required manual steps:

- [ ] Create/login to Railway.
- [ ] Create project from GitHub repo.
- [ ] Set backend root directory to `backend`.
- [ ] Add Railway MySQL service.
- [ ] Add backend environment variables.
- [ ] Deploy backend.
- [ ] Verify `https://your-backend.up.railway.app/ping.php`.

Pass condition:

- [ ] `/ping.php` returns `status=ok` and `env=staging`.
- [ ] Railway logs show no DB connection errors.

## Task 8 - Import Staging Database

Fresh staging import:

```bash
mysql -h <railway-mysql-host> -P <railway-mysql-port> -u <railway-mysql-user> -p <railway-db-name> < database/rentease_base_schema.sql
mysql -h <railway-mysql-host> -P <railway-mysql-port> -u <railway-mysql-user> -p <railway-db-name> < database/staging_seed.sql
```

Rules:

- [ ] Do not reset staging during active testing.
- [ ] Do not run `staging_seed.sql` on real production after launch.

## Task 9 - Deploy Staging Frontend On Vercel

Follow `docs/STAGING_DEPLOYMENT_AND_TEAM_TESTING.md`.

Required manual steps:

- [ ] Create/login to Vercel.
- [ ] Import GitHub repo.
- [ ] Set root directory to `frontend`.
- [ ] Framework preset: Vite.
- [ ] Build command: `npm run build`.
- [ ] Output directory: `dist`.
- [ ] Add frontend environment variables.

Pass condition:

- [ ] Vercel deploy succeeds.
- [ ] Deep route refresh works, for example `/owner/rooms`.
- [ ] Frontend login reaches Railway backend.

## Task 10 - Full Staging Role Test

Admin:

- [ ] Dashboard loads.
- [ ] Users load.
- [ ] Activity logs load.
- [ ] Error logs load.
- [ ] Reports load.

Landlord:

- [ ] Dashboard loads.
- [ ] Boarding house profile loads.
- [ ] Rooms load and can be managed.
- [ ] Reservation approval/rejection works.
- [ ] Rent tracking works.

Seeker:

- [ ] Dashboard loads.
- [ ] My room loads.
- [ ] Reservations load.
- [ ] Rent status loads.
- [ ] Payment proof upload works.
- [ ] Guardian link create/open/revoke works.

Pass condition:

- [ ] All roles pass.
- [ ] Bugs are fixed and redeployed to staging.
- [ ] Team signs off.

## Task 11 - Prepare Production Environment

Production must not use staging test data as real data.

- [ ] Create production Railway backend service or production environment.
- [ ] Create production Railway MySQL database.
- [ ] Create production Vercel project/environment.
- [ ] Set production backend env vars with `RENTEASE_APP_ENV=production`.
- [ ] Set production frontend env vars with `VITE_APP_ENV=production`.
- [ ] Use final production domains.
- [ ] Import only `database/rentease_base_schema.sql` into production.
- [ ] Create the first admin account manually.

Do not import `database/staging_seed.sql` into real production unless it is only a demo deployment.

## Task 12 - Deploy Production

Merge staging to main only after signoff:

```powershell
git switch main
git pull origin main
git merge staging
git push origin main
```

Then deploy:

- [ ] Railway backend from `main`.
- [ ] Vercel frontend from `main`.
- [ ] Custom domains if required.
- [ ] HTTPS active.

Pass condition:

- [ ] Backend `/ping.php` returns `env=production`.
- [ ] Frontend production URL loads.
- [ ] Login works.
- [ ] Browser console has no CORS or cookie errors.

## Task 13 - Production Smoke Test

Run immediately after production deploy:

- [ ] Admin login works.
- [ ] Landlord account works.
- [ ] Seeker account works.
- [ ] Landlord creates boarding house.
- [ ] Landlord creates room.
- [ ] Seeker submits reservation.
- [ ] Landlord approves reservation.
- [ ] Billing/rent record works.
- [ ] Payment proof upload works.
- [ ] Guardian link works.
- [ ] Activity logs record actions.
- [ ] Error logs show no critical new errors.

## Task 14 - Backup And Rollback Plan

Before launch:

- [ ] Export production database.
- [ ] Save Railway and Vercel deployment URLs.
- [ ] Record last known good Git commit.
- [ ] Confirm who can redeploy or rollback.

Backup example:

```bash
mysqldump -h <prod-mysql-host> -P <prod-mysql-port> -u <prod-mysql-user> -p <prod-db-name> > rentease_prod_backup_YYYYMMDD.sql
```

Rollback options:

- Redeploy last known good Railway deployment.
- Redeploy last known good Vercel deployment.
- Revert bad commit on `main`.
- Restore database only if data is corrupted.

## Task 15 - Launch And Operate

Final launch checklist:

- [ ] `main` has approved code.
- [ ] Staging passed.
- [ ] Production smoke test passed.
- [ ] `.env` files and secrets are not committed.
- [ ] Branch protections are active.
- [ ] Backup exists.
- [ ] Known out-of-scope features are documented.

Post-launch rules:

- [ ] Do not run `staging_seed.sql` on production.
- [ ] Do not force push to `main`, `staging`, or `develop`.
- [ ] Use `hotfix/...` branches for production fixes.
- [ ] Add new SQL files for database changes.
- [ ] Check Railway logs weekly.
- [ ] Check Vercel deployment logs weekly.
- [ ] Export database backup weekly.

## References

- Railway start commands: https://docs.railway.com/guides/start-command
- Railway MySQL: https://docs.railway.com/guides/mysql
- Railway variables: https://docs.railway.com/reference/variables
- Vercel Vite deployments: https://vercel.com/docs/frameworks/frontend/vite
- Vercel rewrites: https://vercel.com/docs/rewrites
