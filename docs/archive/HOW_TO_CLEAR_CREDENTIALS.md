# How to Clear Credentials in Database

## Quick Reference

### Option 1: Clear All Users (Fresh Start)
```sql
-- Delete all users except keep the structure
TRUNCATE TABLE users;
```

### Option 2: Clear Specific User
```sql
-- Delete by email
DELETE FROM users WHERE email = 'user@example.com';

-- Delete by user_id
DELETE FROM users WHERE user_id = 5;
```

### Option 3: Reset Specific User Password
```sql
-- Reset password to 'password123'
UPDATE users 
SET password_hash = '$2y$10$YourNewHashHere'
WHERE email = 'user@example.com';
```

### Option 4: Clear All Demo Data (Keep Structure)
```sql
-- Clear all tables in correct order (respects foreign keys)
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE payments;
TRUNCATE TABLE reservations;
TRUNCATE TABLE feedback;
TRUNCATE TABLE uploads;
TRUNCATE TABLE account_links;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE error_logs;
TRUNCATE TABLE rooms;
TRUNCATE TABLE boarding_house;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;
```

---

## Detailed Methods

### Method 1: Using phpMyAdmin (GUI)

#### Clear All Users:
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Select database: `rentease_db`
3. Click on `users` table
4. Click "Operations" tab
5. Scroll to "Table maintenance"
6. Click "Empty the table (TRUNCATE)" button
7. Confirm

#### Clear Specific User:
1. Open phpMyAdmin
2. Select `rentease_db` → `users` table
3. Click "Browse" tab
4. Find the user you want to delete
5. Click the red "Delete" icon (trash can)
6. Confirm deletion

#### Clear All Data (Fresh Database):
1. Open phpMyAdmin
2. Select `rentease_db`
3. Click "Operations" tab
4. Scroll to "Remove data or table"
5. Click "Empty the database (DROP)" - **WARNING: This deletes everything!**
6. Or use the SQL script below for safer approach

---

### Method 2: Using MySQL Command Line

#### Open MySQL CLI:
```powershell
# Option A: Using XAMPP MySQL
cd C:\xampp\mysql\bin
.\mysql.exe -u root -p

# Option B: If MySQL is in PATH
mysql -u root -p
```

#### Select Database:
```sql
USE rentease_db;
```

#### Clear All Users:
```sql
TRUNCATE TABLE users;
```

#### Clear Specific User by Email:
```sql
DELETE FROM users WHERE email = 'test@example.com';
```

#### Clear Multiple Users:
```sql
-- Delete all seekers
DELETE FROM users WHERE role = 'seeker';

-- Delete all unverified users
DELETE FROM users WHERE email_verified = 0;

-- Delete users created after a date
DELETE FROM users WHERE created_at > '2024-01-01';
```

#### View Users Before Deleting:
```sql
-- See all users
SELECT user_id, full_name, email, role, created_at FROM users;

-- See specific user
SELECT * FROM users WHERE email = 'test@example.com';

-- Count users by role
SELECT role, COUNT(*) as count FROM users GROUP BY role;
```

---

### Method 3: Using SQL Script File

#### Create a Clear Script:

**File:** `scripts/clear-credentials.sql`

```sql
-- ============================================
-- RENTEASE: Clear Credentials Script
-- WARNING: This will delete user data!
-- ============================================

USE rentease_db;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Clear all user-related data
TRUNCATE TABLE payments;
TRUNCATE TABLE reservations;
TRUNCATE TABLE feedback;
TRUNCATE TABLE uploads;
TRUNCATE TABLE account_links;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE error_logs;
TRUNCATE TABLE users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify tables are empty
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'feedback', COUNT(*) FROM feedback
UNION ALL
SELECT 'uploads', COUNT(*) FROM uploads
UNION ALL
SELECT 'account_links', COUNT(*) FROM account_links;

SELECT 'All user data cleared successfully!' as status;
```

#### Run the Script:
```powershell
# From project root
mysql -u root -p rentease_db < scripts\clear-credentials.sql
```

---

### Method 4: Clear Specific Types of Data

#### Clear Only Test/Demo Users (Keep Real Users):
```sql
-- Delete users with test emails
DELETE FROM users WHERE email LIKE '%@test.com';
DELETE FROM users WHERE email LIKE '%@example.com';
DELETE FROM users WHERE email LIKE 'test%';

-- Delete demo accounts
DELETE FROM users WHERE email IN (
    'admin@rentease.local',
    'owner@rentease.local',
    'seeker@rentease.local',
    'parent@rentease.local'
);
```

#### Clear Only Unverified Users:
```sql
-- Delete unverified users older than 7 days
DELETE FROM users 
WHERE email_verified = 0 
AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

#### Clear Only Inactive Users:
```sql
-- Delete users who never logged in
DELETE FROM users 
WHERE user_id NOT IN (
    SELECT DISTINCT user_id FROM activity_logs WHERE action = 'login'
);
```

---

### Method 5: Reset to Demo Data

#### Reseed Database with Demo Accounts:
```powershell
# From project root
mysql -u root -p rentease_db < rentease\database\phase7_demo_seed.sql
```

This will:
- Clear all existing data
- Create 4 demo accounts:
  - `admin@rentease.local` / `Admin123!`
  - `owner@rentease.local` / `Owner123!`
  - `seeker@rentease.local` / `Seeker123!`
  - `parent@rentease.local` / `Parent123!`
- Add sample rooms, reservations, payments

---

### Method 6: Clear Sensitive Data Only (Keep Users)

#### Clear Passwords (Force Password Reset):
```sql
-- Set all passwords to NULL (users must reset)
UPDATE users SET password_hash = NULL;

-- Or set to a known temporary password
-- First generate hash in PHP:
-- password_hash('TempPassword123!', PASSWORD_DEFAULT)
UPDATE users SET password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
```

#### Clear Email Verification Tokens:
```sql
-- Clear all verification tokens
UPDATE users SET 
    verification_token = NULL,
    verification_token_expires = NULL,
    password_reset_token = NULL,
    password_reset_expires = NULL;
```

#### Clear Session Data:
```sql
-- If you have a sessions table
TRUNCATE TABLE sessions;
```

---

## Safety Scripts

### Backup Before Clearing

#### Create Backup:
```powershell
# Backup entire database
mysqldump -u root -p rentease_db > backup_before_clear.sql

# Backup only users table
mysqldump -u root -p rentease_db users > backup_users_only.sql
```

#### Restore from Backup:
```powershell
# Restore entire database
mysql -u root -p rentease_db < backup_before_clear.sql

# Restore only users table
mysql -u root -p rentease_db < backup_users_only.sql
```

---

### Safe Clear Script with Confirmation

**File:** `scripts/safe-clear-users.ps1`

```powershell
# Safe Clear Users Script
param(
    [switch]$Force
)

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "RENTEASE: Clear User Credentials" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Check if MySQL is running
$mysqlProcess = Get-Process mysqld -ErrorAction SilentlyContinue
if (-not $mysqlProcess) {
    Write-Host "ERROR: MySQL is not running!" -ForegroundColor Red
    Write-Host "Please start MySQL in XAMPP first." -ForegroundColor Yellow
    exit 1
}

# Count current users
Write-Host "Checking current users..." -ForegroundColor Cyan
$userCount = & mysql -u root -e "USE rentease_db; SELECT COUNT(*) FROM users;" -s -N

Write-Host "Current users in database: $userCount" -ForegroundColor White
Write-Host ""

if ($userCount -eq 0) {
    Write-Host "Database is already empty!" -ForegroundColor Green
    exit 0
}

# Confirmation
if (-not $Force) {
    Write-Host "WARNING: This will delete ALL users and related data!" -ForegroundColor Red
    Write-Host "This action CANNOT be undone!" -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "Type 'DELETE' to confirm"
    
    if ($confirm -ne "DELETE") {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Create backup
Write-Host ""
Write-Host "Creating backup..." -ForegroundColor Cyan
$backupFile = "backup_users_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
& mysqldump -u root rentease_db users > $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup created: $backupFile" -ForegroundColor Green
} else {
    Write-Host "ERROR: Backup failed!" -ForegroundColor Red
    exit 1
}

# Clear data
Write-Host ""
Write-Host "Clearing user data..." -ForegroundColor Cyan

$clearSQL = @"
USE rentease_db;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payments;
TRUNCATE TABLE reservations;
TRUNCATE TABLE feedback;
TRUNCATE TABLE uploads;
TRUNCATE TABLE account_links;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE error_logs;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
"@

$clearSQL | & mysql -u root

if ($LASTEXITCODE -eq 0) {
    Write-Host "User data cleared successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backup saved to: $backupFile" -ForegroundColor Yellow
    Write-Host "To restore: mysql -u root -p rentease_db < $backupFile" -ForegroundColor Yellow
} else {
    Write-Host "ERROR: Clear operation failed!" -ForegroundColor Red
    exit 1
}
```

#### Run Safe Clear Script:
```powershell
# With confirmation prompt
powershell -ExecutionPolicy Bypass -File scripts\safe-clear-users.ps1

# Skip confirmation (dangerous!)
powershell -ExecutionPolicy Bypass -File scripts\safe-clear-users.ps1 -Force
```

---

## Common Scenarios

### Scenario 1: Testing Registration
**Goal:** Clear test accounts after testing

```sql
-- Delete all test accounts
DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example%';
```

### Scenario 2: Fresh Demo for Defense
**Goal:** Reset to clean demo data

```powershell
# Reseed with demo accounts
mysql -u root -p rentease_db < rentease\database\phase7_demo_seed.sql
```

### Scenario 3: Production Deployment
**Goal:** Remove all test data, keep structure

```sql
-- Clear all data but keep tables
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payments;
TRUNCATE TABLE reservations;
TRUNCATE TABLE feedback;
TRUNCATE TABLE uploads;
TRUNCATE TABLE account_links;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE error_logs;
TRUNCATE TABLE rooms;
TRUNCATE TABLE boarding_house;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
```

### Scenario 4: Clear Uploaded Files Too
**Goal:** Clear database AND uploaded files

```powershell
# Clear database
mysql -u root -p rentease_db < scripts\clear-credentials.sql

# Clear uploaded files
Remove-Item "rentease\backend\storage\uploads\*" -Recurse -Force
```

---

## Verification Queries

### Check What Will Be Deleted:
```sql
-- Count records in each table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'feedback', COUNT(*) FROM feedback
UNION ALL
SELECT 'uploads', COUNT(*) FROM uploads
UNION ALL
SELECT 'account_links', COUNT(*) FROM account_links
UNION ALL
SELECT 'activity_logs', COUNT(*) FROM activity_logs
UNION ALL
SELECT 'error_logs', COUNT(*) FROM error_logs;
```

### Check Users Before Deleting:
```sql
-- List all users
SELECT user_id, full_name, email, role, email_verified, created_at 
FROM users 
ORDER BY created_at DESC;
```

### Verify Deletion:
```sql
-- Should return 0 for all tables
SELECT COUNT(*) as remaining_users FROM users;
SELECT COUNT(*) as remaining_reservations FROM reservations;
SELECT COUNT(*) as remaining_payments FROM payments;
```

---

## Important Notes

### ⚠️ Foreign Key Constraints
Always disable foreign key checks when truncating:
```sql
SET FOREIGN_KEY_CHECKS = 0;
-- Your TRUNCATE statements here
SET FOREIGN_KEY_CHECKS = 1;
```

### ⚠️ Cascade Deletes
Some tables have CASCADE delete rules. Deleting a user will automatically delete:
- Their reservations
- Their payments
- Their feedback
- Their uploads
- Their account links
- Their activity logs

### ⚠️ Cannot Undo
`TRUNCATE` and `DELETE` are permanent. Always backup first!

### ✅ Best Practice
1. Always create backup before clearing
2. Test on development database first
3. Verify what will be deleted
4. Use transactions when possible
5. Document what you cleared and why

---

## Quick Commands Cheat Sheet

```sql
-- View all users
SELECT * FROM users;

-- Count users
SELECT COUNT(*) FROM users;

-- Delete one user
DELETE FROM users WHERE email = 'test@example.com';

-- Delete all users
TRUNCATE TABLE users;

-- Reset to demo data
SOURCE rentease/database/phase7_demo_seed.sql;

-- Backup database
-- Run in PowerShell:
-- mysqldump -u root -p rentease_db > backup.sql

-- Restore database
-- Run in PowerShell:
-- mysql -u root -p rentease_db < backup.sql
```

---

## Troubleshooting

### Error: Cannot truncate table (foreign key constraint)
**Solution:** Disable foreign key checks first
```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
```

### Error: Access denied
**Solution:** Use root user or user with DELETE privileges
```powershell
mysql -u root -p
```

### Error: Table doesn't exist
**Solution:** Check database name and table name
```sql
SHOW DATABASES;
USE rentease_db;
SHOW TABLES;
```

---

## Recommended Approach

**For your situation, I recommend:**

1. **Create backup first:**
   ```powershell
   mysqldump -u root -p rentease_db > backup_$(Get-Date -Format 'yyyyMMdd').sql
   ```

2. **Clear all data:**
   ```sql
   USE rentease_db;
   SET FOREIGN_KEY_CHECKS = 0;
   TRUNCATE TABLE payments;
   TRUNCATE TABLE reservations;
   TRUNCATE TABLE feedback;
   TRUNCATE TABLE uploads;
   TRUNCATE TABLE account_links;
   TRUNCATE TABLE activity_logs;
   TRUNCATE TABLE error_logs;
   TRUNCATE TABLE users;
   SET FOREIGN_KEY_CHECKS = 1;
   ```

3. **Reseed with demo data:**
   ```powershell
   mysql -u root -p rentease_db < rentease\database\phase7_demo_seed.sql
   ```

This gives you a clean slate with demo accounts ready for testing!
