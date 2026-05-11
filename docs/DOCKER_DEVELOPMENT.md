# RentEase Docker Development Guide

Docker is the recommended local setup when you want to avoid manually starting XAMPP Apache and MySQL.

It does not remove the XAMPP setup. It runs beside it using different ports:

- Frontend: `http://localhost:5173`
- Backend PHP/Apache: `http://localhost:8080`
- MySQL: `localhost:3308`

## Why This Is Safer For The Team

- One command starts frontend, backend, and database.
- Everyone gets the same MySQL/PHP/Node environment.
- No manual XAMPP Apache/MySQL startup.
- No local MySQL port conflict with the current XAMPP `3307` setup.
- The existing XAMPP workflow remains available as fallback.

## Prerequisite

Install and start Docker Desktop.

Verify:

```powershell
docker --version
docker compose version
```

## Start RentEase

From the repo root:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\docker-dev.ps1
```

Detached/background mode:

```powershell
.\scripts\docker-dev.ps1 -Detached
```

Open:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:8080/ping.php
```

## Seeded Accounts

The first Docker database startup imports:

1. `database/rentease_base_schema.sql`
2. `database/staging_seed.sql`

Seeded logins:

| Role | Email | Password | Login role |
| --- | --- | --- | --- |
| Admin | `admin@rentease.test` | `Admin@1234` | `admin` |
| Landlord | `landlord@rentease.test` | `Owner@1234` | `owner` |
| Seeker 1 | `seeker1@rentease.test` | `Seeker@1234` | `seeker` |
| Seeker 2 | `seeker2@rentease.test` | `Seeker@1234` | `seeker` |

## Reset The Docker Database

This deletes only the Docker MySQL volume, not your XAMPP database.

```powershell
.\scripts\docker-dev.ps1 -ResetDatabase
```

Docker will recreate the database and rerun the SQL seed files.

## Stop Docker Services

```powershell
.\scripts\docker-dev.ps1 -Stop
```

## Useful Manual Commands

```powershell
docker compose ps
docker compose logs backend
docker compose logs mysql
docker compose logs frontend
docker compose down
docker compose down -v
```

## Ports

| Service | Host port | Container port |
| --- | ---: | ---: |
| Frontend Vite | `5173` | `5173` |
| Backend Apache/PHP | `8080` | `80` |
| MySQL | `3308` | `3306` |

If port `5173` is already in use, stop the existing Vite process or change the port mapping in `docker-compose.yml`.

If port `8080` is already in use, change this line:

```yaml
ports:
  - "8080:80"
```

## How It Works

- `mysql` runs MySQL 8.4 and stores data in the `rentease_mysql_data` Docker volume.
- `backend` runs PHP 8.2 with Apache and `pdo_mysql`.
- `frontend` runs Node and Vite.
- Vite still uses `VITE_API_BASE_URL=/backend`.
- In Docker only, Vite proxies `/backend/*` to the backend container and rewrites it to `/*.php`.
- In XAMPP, Vite keeps the old default proxy: `/backend/*` to `http://localhost/rentease/backend/*`.

## When To Use XAMPP Instead

Use XAMPP only when:

- Docker Desktop is not installed.
- You need to debug against the old local `rentease_db`.
- You are testing the XAMPP-specific setup script.

Repair Apache:

```powershell
.\scripts\xampp-apache-repair.ps1
```

Restart Apache:

```powershell
.\scripts\xampp-apache-repair.ps1 -Restart
```

Repair MySQL:

```powershell
.\scripts\xampp-mysql-repair.ps1 -Start
```
