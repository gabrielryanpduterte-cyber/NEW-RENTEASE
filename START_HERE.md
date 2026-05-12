# START HERE - RentEase Docker Setup

## Get Running

From the repo root:

```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE"
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\docker-dev.ps1
```

Or with Docker Compose directly:

```powershell
docker compose up --build
```

Open the app:

```text
http://localhost:5173
```

Backend status:

```text
http://localhost:8080
http://localhost:8080/ping.php
```

## Seeded Login Accounts

- Admin: `admin@rentease.test` / `Admin@1234`
- Landlord: `landlord@rentease.test` / `Owner@1234`
- Seeker 1: `seeker1@rentease.test` / `Seeker@1234`
- Seeker 2: `seeker2@rentease.test` / `Seeker@1234`

Admin access is hidden from the sign-in role buttons. Use the admin email/password and the app redirects to the admin dashboard.

## Useful Commands

```powershell
docker compose ps
docker compose logs backend
docker compose logs frontend
docker compose logs mysql
.\scripts\docker-dev.ps1 -Stop
.\scripts\docker-dev.ps1 -ResetDatabase
```

## Tests

```powershell
powershell -ExecutionPolicy Bypass -File scripts\phase8-api-smoke-test.ps1
powershell -ExecutionPolicy Bypass -File scripts\phase9-account-smoke-test.ps1
powershell -ExecutionPolicy Bypass -File scripts\phase10-onboarding-smoke-test.ps1
powershell -ExecutionPolicy Bypass -File scripts\pre-deployment-test.ps1
```
