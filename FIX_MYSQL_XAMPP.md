# 🔧 XAMPP MySQL Won't Start - Complete Fix Guide

## Quick Diagnosis

### Check What's Wrong

```powershell
# Check if MySQL is already running
Get-Process -Name mysqld -ErrorAction SilentlyContinue

# Check what's using MySQL port 3306
netstat -ano | findstr :3306

# Check XAMPP error log
Get-Content C:\xampp\mysql\data\*.err -Tail 50
```

---

## Solution 1: Port 3306 Already in Use (Most Common)

### Find What's Using Port 3306

```powershell
# Find process using port 3306
netstat -ano | findstr :3306

# Example output:
# TCP    0.0.0.0:3306    0.0.0.0:0    LISTENING    1234
# The last number (1234) is the Process ID (PID)

# Find what program it is
Get-Process -Id 1234

# Kill it
Stop-Process -Id 1234 -Force
```

### Common Programs That Block Port 3306:
- Another MySQL installation
- MariaDB
- SQL Server
- VMware
- Skype (old versions)

### Change MySQL Port (Alternative)

Edit `C:\xampp\mysql\bin\my.ini`:

```ini
# Find this line:
port=3306

# Change to:
port=3307

# Also change:
[client]
port=3307
```

Then update your backend config to use port 3307.

---

## Solution 2: MySQL Service Conflict

### Check Windows Services

```powershell
# Check if MySQL is installed as Windows service
Get-Service -Name *mysql* -ErrorAction SilentlyContinue

# If found, stop it
Stop-Service -Name "MySQL80" -Force  # Or whatever name it shows

# Disable it
Set-Service -Name "MySQL80" -StartupType Disabled
```

### Or Use Services GUI:
1. Press `Win + R`
2. Type `services.msc`
3. Find any MySQL services
4. Right-click → Stop
5. Right-click → Properties → Startup type: Disabled

---

## Solution 3: Corrupted MySQL Data

### Backup and Reset MySQL Data

```powershell
# 1. Backup current data
Copy-Item -Path "C:\xampp\mysql\data" -Destination "C:\xampp\mysql\data_backup" -Recurse

# 2. Stop MySQL if running
Stop-Process -Name mysqld -Force -ErrorAction SilentlyContinue

# 3. Delete error logs
Remove-Item "C:\xampp\mysql\data\*.err" -Force

# 4. Try starting MySQL again in XAMPP
```

### If Still Fails - Restore Clean MySQL:

```powershell
# 1. Stop MySQL
Stop-Process -Name mysqld -Force -ErrorAction SilentlyContinue

# 2. Backup your databases
Copy-Item "C:\xampp\mysql\data\rentease_db" -Destination "C:\xampp\mysql\rentease_db_backup" -Recurse -ErrorAction SilentlyContinue

# 3. Delete data folder
Remove-Item "C:\xampp\mysql\data" -Recurse -Force

# 4. Copy backup folder (XAMPP comes with backup)
Copy-Item "C:\xampp\mysql\backup" -Destination "C:\xampp\mysql\data" -Recurse

# 5. Start MySQL in XAMPP

# 6. Restore your database
# Use phpMyAdmin to import: C:\xampp\mysql\rentease_db_backup
```

---

## Solution 4: Permission Issues

### Run XAMPP as Administrator

1. Close XAMPP completely
2. Right-click `xampp-control.exe`
3. Select "Run as administrator"
4. Try starting MySQL

### Fix Folder Permissions

```powershell
# Give full control to XAMPP folder
icacls "C:\xampp" /grant Everyone:F /T

# Or specific to MySQL
icacls "C:\xampp\mysql" /grant Everyone:F /T
```

---

## Solution 5: Firewall/Antivirus Blocking

### Allow MySQL in Firewall

```powershell
# Add firewall rule
New-NetFirewallRule -DisplayName "XAMPP MySQL" -Direction Inbound -Program "C:\xampp\mysql\bin\mysqld.exe" -Action Allow

# Or disable firewall temporarily to test
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
```

### Check Antivirus:
- Temporarily disable antivirus
- Add `C:\xampp\mysql` to exclusions
- Try starting MySQL

---

## Solution 6: Use MariaDB Instead

XAMPP now uses MariaDB (MySQL compatible):

```powershell
# Check XAMPP version
Get-Content C:\xampp\readme_en.txt | Select-String "Version"

# If using MariaDB, the process name might be different
Get-Process -Name mariadbd -ErrorAction SilentlyContinue
```

---

## Solution 7: Reinstall MySQL in XAMPP

### Clean Reinstall:

```powershell
# 1. Backup databases
Copy-Item "C:\xampp\mysql\data\rentease_db" -Destination "C:\Users\$env:USERNAME\Desktop\rentease_db_backup" -Recurse -ErrorAction SilentlyContinue

# 2. Stop XAMPP
Stop-Process -Name xampp-control -Force -ErrorAction SilentlyContinue
Stop-Process -Name mysqld -Force -ErrorAction SilentlyContinue

# 3. Delete MySQL folder
Remove-Item "C:\xampp\mysql" -Recurse -Force

# 4. Download XAMPP again from apachefriends.org
# 5. Run installer and select "MySQL" component only
# 6. Restore your database backup
```

---

## Solution 8: Use Portable MySQL

If XAMPP MySQL won't work, use standalone MySQL:

### Download MySQL:
1. Go to: https://dev.mysql.com/downloads/mysql/
2. Download "Windows (x86, 64-bit), ZIP Archive"
3. Extract to `C:\mysql`

### Configure:

Create `C:\mysql\my.ini`:
```ini
[mysqld]
port=3306
basedir=C:/mysql
datadir=C:/mysql/data
```

### Initialize and Start:

```powershell
# Initialize
cd C:\mysql\bin
.\mysqld --initialize-insecure

# Start MySQL
.\mysqld --console

# In new terminal, create database
.\mysql -u root
CREATE DATABASE rentease_db;
```

### Update Backend Config:

Edit `backend/config.php`:
```php
$host = 'localhost';
$port = 3306;
```

---

## Automated Fix Script

Save as `fix-mysql.ps1`:

```powershell
Write-Host "XAMPP MySQL Fix Script" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if MySQL is running
Write-Host "1. Checking MySQL status..." -ForegroundColor Yellow
$mysql = Get-Process -Name mysqld -ErrorAction SilentlyContinue
if ($mysql) {
    Write-Host "   MySQL is running (PID: $($mysql.Id))" -ForegroundColor Green
    $kill = Read-Host "   Kill it? (y/n)"
    if ($kill -eq 'y') {
        Stop-Process -Id $mysql.Id -Force
        Write-Host "   Killed" -ForegroundColor Green
    }
} else {
    Write-Host "   MySQL is not running" -ForegroundColor Gray
}

# 2. Check port 3306
Write-Host ""
Write-Host "2. Checking port 3306..." -ForegroundColor Yellow
$port = netstat -ano | findstr :3306
if ($port) {
    Write-Host "   Port 3306 is in use:" -ForegroundColor Red
    Write-Host "   $port" -ForegroundColor Gray
    
    # Extract PID
    $pid = ($port -split '\s+')[-1]
    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   Process: $($process.ProcessName)" -ForegroundColor Yellow
        $kill = Read-Host "   Kill it? (y/n)"
        if ($kill -eq 'y') {
            Stop-Process -Id $pid -Force
            Write-Host "   Killed" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   Port 3306 is free" -ForegroundColor Green
}

# 3. Check MySQL Windows Service
Write-Host ""
Write-Host "3. Checking MySQL Windows services..." -ForegroundColor Yellow
$services = Get-Service -Name *mysql* -ErrorAction SilentlyContinue
if ($services) {
    foreach ($service in $services) {
        Write-Host "   Found: $($service.Name) - Status: $($service.Status)" -ForegroundColor Yellow
        if ($service.Status -eq 'Running') {
            $stop = Read-Host "   Stop service $($service.Name)? (y/n)"
            if ($stop -eq 'y') {
                Stop-Service -Name $service.Name -Force
                Write-Host "   Stopped" -ForegroundColor Green
            }
        }
    }
} else {
    Write-Host "   No MySQL services found" -ForegroundColor Green
}

# 4. Check error logs
Write-Host ""
Write-Host "4. Checking MySQL error logs..." -ForegroundColor Yellow
$errorLog = Get-ChildItem "C:\xampp\mysql\data\*.err" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($errorLog) {
    Write-Host "   Found error log: $($errorLog.Name)" -ForegroundColor Yellow
    Write-Host "   Last 10 lines:" -ForegroundColor Gray
    Get-Content $errorLog.FullName -Tail 10 | ForEach-Object {
        Write-Host "   $_" -ForegroundColor DarkGray
    }
} else {
    Write-Host "   No error logs found" -ForegroundColor Green
}

# 5. Fix permissions
Write-Host ""
Write-Host "5. Fixing permissions..." -ForegroundColor Yellow
try {
    icacls "C:\xampp\mysql\data" /grant Everyone:F /T 2>&1 | Out-Null
    Write-Host "   Permissions fixed" -ForegroundColor Green
} catch {
    Write-Host "   Failed to fix permissions (run as Administrator)" -ForegroundColor Red
}

# 6. Final instructions
Write-Host ""
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open XAMPP Control Panel as Administrator" -ForegroundColor White
Write-Host "2. Click Start for MySQL" -ForegroundColor White
Write-Host "3. If it fails, check the error log above" -ForegroundColor White
Write-Host ""
Write-Host "Common solutions:" -ForegroundColor Yellow
Write-Host "- Port conflict: Change port in C:\xampp\mysql\bin\my.ini" -ForegroundColor Gray
Write-Host "- Service conflict: Disable MySQL Windows service" -ForegroundColor Gray
Write-Host "- Corrupted data: Restore from C:\xampp\mysql\backup" -ForegroundColor Gray
Write-Host ""
```

Run it:
```powershell
.\fix-mysql.ps1
```

---

## Quick Test After Fix

```powershell
# Test MySQL connection
C:\xampp\mysql\bin\mysql.exe -u root -e "SELECT 1"

# Should output:
# +---+
# | 1 |
# +---+
# | 1 |
# +---+
```

---

## Alternative: Use SQLite (Quick Workaround)

If MySQL won't work at all, temporarily use SQLite:

### Install SQLite for PHP:

1. Download: https://www.sqlite.org/download.html
2. Enable in `C:\xampp\php\php.ini`:
   ```ini
   extension=sqlite3
   extension=pdo_sqlite
   ```

### Update Backend:

Edit `backend/config.php`:
```php
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    // Use SQLite instead
    $pdo = new PDO('sqlite:' . __DIR__ . '/rentease.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    return $pdo;
}
```

---

## Success Checklist

- [ ] No process using port 3306
- [ ] No MySQL Windows service running
- [ ] XAMPP running as Administrator
- [ ] MySQL folder has full permissions
- [ ] Firewall allows mysqld.exe
- [ ] No antivirus blocking
- [ ] Error logs checked
- [ ] MySQL starts in XAMPP Control Panel

---

## Still Not Working?

### Get Help:

1. **Check error log**:
   ```powershell
   Get-Content C:\xampp\mysql\data\*.err -Tail 50
   ```

2. **Post error to support** with:
   - XAMPP version
   - Windows version
   - Error log content
   - What you've tried

3. **Use alternative**:
   - Install standalone MySQL
   - Use WAMP instead of XAMPP
   - Use Docker MySQL container

---

**Most Common Fix**: Kill process on port 3306 and restart XAMPP as Administrator!
