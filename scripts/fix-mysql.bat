@echo off
echo ========================================
echo XAMPP MySQL Quick Fix
echo ========================================
echo.

echo Checking MySQL status...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [INFO] MySQL is running
    echo Stopping MySQL...
    taskkill /F /IM mysqld.exe >NUL 2>&1
    timeout /t 2 >NUL
) else (
    echo [OK] MySQL is not running
)

echo.
echo Checking port 3306...
netstat -ano | findstr :3306 >NUL
if "%ERRORLEVEL%"=="0" (
    echo [ERROR] Port 3306 is in use!
    echo.
    netstat -ano | findstr :3306
    echo.
    echo Please close the program using port 3306 or change MySQL port
    pause
    exit /b 1
) else (
    echo [OK] Port 3306 is available
)

echo.
echo Fixing permissions...
icacls "C:\xampp\mysql\data" /grant Everyone:F /T >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    echo [OK] Permissions fixed
) else (
    echo [WARN] Could not fix permissions - run as Administrator
)

echo.
echo Checking MySQL configuration...
if exist "C:\xampp\mysql\bin\my.ini" (
    echo [OK] MySQL config found
) else (
    echo [ERROR] MySQL config not found!
    echo Please reinstall XAMPP
    pause
    exit /b 1
)

echo.
echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open XAMPP Control Panel as Administrator
echo 2. Click Start for MySQL
echo 3. If it fails, check error log:
echo    C:\xampp\mysql\data\*.err
echo.
echo Common solutions:
echo - Run XAMPP as Administrator
echo - Disable antivirus temporarily
echo - Check firewall settings
echo.
pause
