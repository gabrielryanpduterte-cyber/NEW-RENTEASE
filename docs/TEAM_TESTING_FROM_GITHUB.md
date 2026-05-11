# RentEase Team Testing From GitHub

Use this guide after the project is pushed to GitHub and each teammate has cloned it.

## Prerequisites

Install these first:

- XAMPP with Apache and MySQL/MariaDB
- PHP available in PATH, or XAMPP PHP
- Composer
- Node.js and npm
- Git

## One-Command Local Setup

Open PowerShell in the cloned repo root:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\team-test-setup.ps1
```

The script will:

- Check XAMPP MySQL.
- Repair the known XAMPP `mysql.db` crash if needed.
- Create `backend/.env`.
- Create `frontend/.env.local`.
- Create a XAMPP Apache junction at `C:\xampp\htdocs\rentease`.
- Install backend and frontend dependencies.
- Recreate and seed `rentease_db`.

If your MySQL uses a different port:

```powershell
.\scripts\team-test-setup.ps1 -MySqlPort 3306
```

If you want to keep your existing database data:

```powershell
.\scripts\team-test-setup.ps1 -SkipDatabaseReset
```

## Start The App

1. Open XAMPP Control Panel as Administrator.
2. Start Apache.
3. Start MySQL.
4. Open a terminal:

```powershell
cd frontend
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost/rentease/backend/ping.php`

## Seeded Accounts

| Role | Email | Password | Login role |
| --- | --- | --- | --- |
| Admin | `admin@rentease.test` | `Admin@1234` | `admin` |
| Landlord | `landlord@rentease.test` | `Owner@1234` | `owner` |
| Seeker 1 | `seeker1@rentease.test` | `Seeker@1234` | `seeker` |
| Seeker 2 | `seeker2@rentease.test` | `Seeker@1234` | `seeker` |

## XAMPP MySQL Repair Only

If MySQL will not start, run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\xampp-mysql-repair.ps1 -Start
```

The repair script backs up affected files before repairing:

- `C:\xampp\mysql\data\mysql\db.frm`
- `C:\xampp\mysql\data\mysql\db.MAD`
- `C:\xampp\mysql\data\mysql\db.MAI`
- `C:\xampp\mysql\data\aria_log*`
- `C:\xampp\mysql\data\mysql_error.log`

Backups are stored under:

```text
C:\xampp\mysql\data\repair_backup_YYYYMMDD_HHMMSS
```

## Role Test Checklist

Admin:

- [ ] Login with role `admin`.
- [ ] Dashboard loads.
- [ ] Users section lists seeded users.
- [ ] Activity Logs load.
- [ ] Error Logs load.
- [ ] Boarding House section shows Santos Boarding House.

Landlord:

- [ ] Login with role `owner`.
- [ ] Property page loads.
- [ ] Rooms page shows 5 active rooms and 1 archived room.
- [ ] Reservations page shows 1 pending reservation.
- [ ] Approve the pending reservation.
- [ ] Rent Tracking shows unpaid current-month rent.
- [ ] Reports page loads.

Seeker:

- [ ] Login with role `seeker`.
- [ ] Dashboard loads.
- [ ] My Room shows Room 102 for Seeker 1.
- [ ] Payments page shows current month unpaid.
- [ ] Reservations page shows history.
- [ ] Guardian Access can create/revoke links.
- [ ] Profile update saves.

Guardian view:

- [ ] After database seed, copy the `/guardian-view/<token>` path printed by the SQL import.
- [ ] Open it in incognito with the frontend URL: `http://localhost:5173/guardian-view/<token>`.
- [ ] Confirm tenant, room, and current rent status are visible.

## When Setup Fails

MySQL is not running:

```powershell
.\scripts\xampp-mysql-repair.ps1 -Start
```

Backend health check returns 404:

- Confirm Apache is running.
- Confirm `C:\xampp\htdocs\rentease` exists.
- If it points to the wrong folder, delete only that junction/folder manually and rerun `team-test-setup.ps1`.

Frontend cannot reach backend:

- Confirm `frontend/.env.local` has `VITE_API_BASE_URL=/backend`.
- Confirm Vite was restarted after env changes.
- Confirm `http://localhost/rentease/backend/ping.php` works.

Login fails:

- Select the correct role on the login page.
- Admin must use role `admin`.
- Landlord must use role `owner`.
- Seekers must use role `seeker`.

## Manual Tasks The Team Lead Still Needs To Do

- Push the latest repo changes to GitHub.
- Confirm teammates have XAMPP, Composer, Node.js, and Git installed.
- Tell the team which branch to clone or pull from.
- For online staging, create Railway/Vercel accounts and set environment variables from `docs/STAGING_DEPLOYMENT_AND_TEAM_TESTING.md`.
- Share the final Railway backend URL and Vercel frontend URL after deployment.
