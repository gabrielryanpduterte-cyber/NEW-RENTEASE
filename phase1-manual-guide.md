# Phase 1 Manual Guide (RENTEASE)

This guide is for manual execution only.  
Goal: finish Phase 1 setup without coding.

## Step-by-Step Procedure

1. Choose your project path.
   - Recommended: `C:\xampp\htdocs\rentease`
   - Your current path (`C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE`) is usable for files, but serving through Apache is easier in `htdocs`.

2. Open XAMPP Control Panel.
   - Run: `C:\xampp\xampp-control.exe`
   - Use **Run as Administrator**.

3. Start required services.
   - Click `Start` on `Apache`
   - Click `Start` on `MySQL`
   - Confirm both rows are green and show PID/port values.

4. Verify services in browser.
   - Apache check: `http://localhost/`
   - phpMyAdmin check: `http://localhost/phpmyadmin`

5. Create project folders.
   - Inside your project root, create:
   - `rentease/frontend/`
   - `rentease/backend/`
   - `rentease/database/`

6. Create the project database in phpMyAdmin.
   - Open phpMyAdmin
   - Click `Databases`
   - Enter database name: `rentease_db`
   - Set collation: `utf8mb4_unicode_ci`
   - Click `Create`

7. (Recommended) Create a dedicated DB user (full click-by-click).
   - Open `http://localhost/phpmyadmin`
   - Log in as root/admin user
   - Click `User accounts` tab (top menu)
   - Click `Add user account`
   - Under `Login Information`:
   - Username: `rentease_user`
   - Host name: select `Local` (this becomes `localhost`)
   - Password: enter a strong password
   - Re-type password: enter the same password
   - Under `Database for user account`:
   - Select `Grant all privileges on database`
   - In the database name box, choose or type: `rentease_db`
   - Do not select global admin options unless explicitly needed
   - Scroll down and click `Go` (bottom-right)
   - Verify creation:
   - Return to `User accounts`
   - Confirm `rentease_user@localhost` appears in the list
   - Confirm privileges are limited to `rentease_db` (recommended)
   - Optional verification test:
   - Log out of phpMyAdmin
   - Log in using `rentease_user`
   - Confirm you can see/use `rentease_db`

8. Validate completion criteria.
   - Apache is running
   - MySQL is running
   - `frontend`, `backend`, `database` folders exist
   - `rentease_db` exists in phpMyAdmin

## Footprint Log Template (For Documentation/Defense)

Copy this and fill it while you perform the steps:

- Opened `xampp-control.exe` at: `[time]`
- Started Apache (port `[port]`): `success/fail`
- Started MySQL (port `[port]`): `success/fail`
- Opened `http://localhost`: `success/fail`
- Opened `http://localhost/phpmyadmin`: `success/fail`
- Created folders: `frontend/backend/database` (`yes/no`)
- Created DB: `rentease_db` with `utf8mb4_unicode_ci` (`yes/no`)
- Created DB user: `rentease_user` (`yes/no`)
- Final Phase 1 status: `complete/incomplete`

## Common Phase 1 Issues

- MySQL not starting:
  - Usually port `3306` is already used by another MySQL service.

- Apache not starting:
  - Usually port `80` or `443` is occupied (IIS, Skype, VPN/security tools).

- phpMyAdmin not loading:
  - MySQL is not running, or wrong local URL was used.

- Path friction later:
  - Spaces in folder names can break some scripts/tools. Prefer a clean path like `C:\xampp\htdocs\rentease`.

## Phase 1 Exit Criteria

Phase 1 is complete only when all are true:

- XAMPP Apache + MySQL are running
- Required project folders are created
- `rentease_db` exists and is accessible in phpMyAdmin
