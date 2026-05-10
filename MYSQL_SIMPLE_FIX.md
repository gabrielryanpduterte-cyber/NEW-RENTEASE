# 🚨 XAMPP MySQL Won't Start - SIMPLE FIX

## ⚡ Quick Fix (Try This First)

### Step 1: Run as Administrator
1. Close XAMPP completely
2. Right-click `C:\xampp\xampp-control.exe`
3. Select **"Run as administrator"**
4. Click **Start** for MySQL

**If this works, you're done!** ✅

---

## 🔧 If Still Not Working

### Step 2: Run Fix Script

```cmd
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\scripts"
fix-mysql.bat
```

This will:
- Stop any running MySQL
- Check port 3306
- Fix permissions
- Show you what's wrong

---

## 📋 Manual Fix Steps

### Option A: Check Port 3306

```powershell
# Find what's using port 3306
netstat -ano | findstr :3306
```

**If you see output:**
```
TCP    0.0.0.0:3306    0.0.0.0:0    LISTENING    1234
```

The number `1234` is the Process ID. Kill it:

```powershell
# Kill the process
taskkill /F /PID 1234
```

Then try starting MySQL in XAMPP again.

---

### Option B: Stop MySQL Windows Service

1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Look for any service with "MySQL" in the name
4. Right-click → **Stop**
5. Right-click → **Properties** → Startup type: **Disabled**
6. Click **OK**

Try starting MySQL in XAMPP again.

---

### Option C: Check Error Log

```powershell
# View error log
notepad C:\xampp\mysql\data\*.err
```

Look for errors like:
- `Port 3306 is already in use`
- `Can't start server`
- `Permission denied`

---

### Option D: Reset MySQL Data

**⚠️ WARNING: This will delete your databases!**

```powershell
# 1. Backup your database first
Copy-Item "C:\xampp\mysql\data\rentease_db" -Destination "C:\Users\$env:USERNAME\Desktop\rentease_backup" -Recurse

# 2. Stop MySQL
taskkill /F /IM mysqld.exe

# 3. Delete data folder
Remove-Item "C:\xampp\mysql\data" -Recurse -Force

# 4. Restore clean data
Copy-Item "C:\xampp\mysql\backup" -Destination "C:\xampp\mysql\data" -Recurse

# 5. Start MySQL in XAMPP

# 6. Restore your database
# Use phpMyAdmin to import from Desktop\rentease_backup
```

---

## 🎯 Most Common Causes

### 1. Not Running as Administrator
**Fix**: Right-click XAMPP → Run as administrator

### 2. Port 3306 in Use
**Fix**: Kill process using port or change MySQL port

### 3. Another MySQL Installed
**Fix**: Stop/disable other MySQL service

### 4. Antivirus Blocking
**Fix**: Disable antivirus temporarily or add exception

### 5. Corrupted Data
**Fix**: Reset MySQL data folder

---

## 🔄 Alternative: Change MySQL Port

If port 3306 is blocked and you can't free it:

### 1. Edit MySQL Config

Open `C:\xampp\mysql\bin\my.ini`

Find:
```ini
port=3306
```

Change to:
```ini
port=3307
```

Also find:
```ini
[client]
port=3306
```

Change to:
```ini
[client]
port=3307
```

Save and close.

### 2. Update Backend Config

Edit `backend/config.php`:

```php
$dsn = "mysql:host={$host};port=3307;dbname={$name};charset=utf8mb4";
```

### 3. Start MySQL

Start MySQL in XAMPP. It will now use port 3307.

---

## ✅ Verify MySQL is Working

```powershell
# Test MySQL connection
C:\xampp\mysql\bin\mysql.exe -u root -e "SELECT 1"
```

**Should show:**
```
+---+
| 1 |
+---+
| 1 |
+---+
```

**If you see this, MySQL is working!** ✅

---

## 🆘 Still Not Working?

### Check These:

1. **XAMPP Version**
   ```powershell
   Get-Content C:\xampp\readme_en.txt | Select-String "Version"
   ```

2. **Windows Version**
   ```powershell
   systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
   ```

3. **Error Log**
   ```powershell
   Get-Content C:\xampp\mysql\data\*.err -Tail 20
   ```

### Try These:

1. **Reinstall XAMPP**
   - Download latest from https://www.apachefriends.org
   - Backup `C:\xampp\mysql\data\rentease_db` first
   - Uninstall old XAMPP
   - Install new XAMPP
   - Restore database

2. **Use Standalone MySQL**
   - Download from https://dev.mysql.com/downloads/mysql/
   - Install separately
   - Update backend config with new connection

3. **Use Different Stack**
   - Try WAMP instead of XAMPP
   - Try Laragon
   - Use Docker MySQL

---

## 📞 Get Detailed Error Info

Run this to get full diagnostic:

```powershell
Write-Host "=== XAMPP MySQL Diagnostic ===" -ForegroundColor Cyan

# Check if MySQL process is running
$mysql = Get-Process -Name mysqld -ErrorAction SilentlyContinue
if ($mysql) {
    Write-Host "[RUNNING] MySQL PID: $($mysql.Id)" -ForegroundColor Green
} else {
    Write-Host "[STOPPED] MySQL is not running" -ForegroundColor Red
}

# Check port 3306
$port = netstat -ano | findstr :3306
if ($port) {
    Write-Host "[BLOCKED] Port 3306 in use:" -ForegroundColor Red
    Write-Host $port
} else {
    Write-Host "[FREE] Port 3306 is available" -ForegroundColor Green
}

# Check MySQL service
$service = Get-Service -Name *mysql* -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "[SERVICE] Found: $($service.Name) - $($service.Status)" -ForegroundColor Yellow
} else {
    Write-Host "[NO SERVICE] No MySQL Windows service" -ForegroundColor Green
}

# Check error log
$errorLog = Get-ChildItem "C:\xampp\mysql\data\*.err" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($errorLog) {
    Write-Host "[ERROR LOG] Last 5 lines:" -ForegroundColor Yellow
    Get-Content $errorLog.FullName -Tail 5
} else {
    Write-Host "[NO ERRORS] No error log found" -ForegroundColor Green
}
```

Copy the output and search for the error online.

---

## 🎉 Success Checklist

- [ ] XAMPP running as Administrator
- [ ] Port 3306 is free (or using different port)
- [ ] No MySQL Windows service running
- [ ] Antivirus not blocking
- [ ] MySQL starts in XAMPP Control Panel (green)
- [ ] Can connect: `mysql -u root -e "SELECT 1"`
- [ ] Database exists: `mysql -u root -e "SHOW DATABASES"`

**If all checked, MySQL is working!** 🎉

---

## 💡 Pro Tips

1. **Always run XAMPP as Administrator**
2. **Add XAMPP to antivirus exceptions**
3. **Don't install multiple MySQL versions**
4. **Backup database regularly**
5. **Check error logs when issues occur**

---

**Need more help?** Check `FIX_MYSQL_XAMPP.md` for advanced solutions.
