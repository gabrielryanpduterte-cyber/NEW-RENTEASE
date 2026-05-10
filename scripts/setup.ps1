# RENTEASE Simple Setup Script
# Uses cmd.exe for MySQL operations to avoid PowerShell redirection issues

param(
    [string]$DbUser = "root",
    [string]$DbPass = ""
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RENTEASE SIMPLE SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot

# 1. CHECK PREREQUISITES
Write-Host "1. Checking prerequisites..." -ForegroundColor Yellow

try {
    $phpVersion = php -v 2>&1 | Select-String "PHP (\d+\.\d+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    Write-Host "   [OK] PHP $phpVersion found" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] PHP not found in PATH" -ForegroundColor Red
    Write-Host "   Add PHP to PATH or use XAMPP PHP: C:\xampp\php\php.exe" -ForegroundColor Yellow
    exit 1
}

try {
    $nodeVersion = node --version
    Write-Host "   [OK] Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Node.js not found" -ForegroundColor Red
    Write-Host "   Install Node.js 18+ from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 2. SETUP DATABASE
Write-Host "2. Setting up database..." -ForegroundColor Yellow

$mysqlCmd = "mysql"
$mysqlPath = ""

if (Get-Command $mysqlCmd -ErrorAction SilentlyContinue) {
    $mysqlPath = (Get-Command $mysqlCmd).Source
    Write-Host "   [OK] MySQL found in PATH" -ForegroundColor Green
} elseif (Test-Path "C:\xampp\mysql\bin\mysql.exe") {
    $mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
    Write-Host "   [OK] MySQL found in XAMPP" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] MySQL not found" -ForegroundColor Red
    Write-Host "   Start XAMPP MySQL or add MySQL to PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "   Creating database..." -ForegroundColor Gray

# Create database using cmd.exe
$createDbCmd = "CREATE DATABASE IF NOT EXISTS rentease_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if ($DbPass) {
    cmd /c "`"$mysqlPath`" -u $DbUser -p$DbPass -e `"$createDbCmd`" 2>&1"
} else {
    cmd /c "`"$mysqlPath`" -u $DbUser -e `"$createDbCmd`" 2>&1"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] Database created" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Failed to create database" -ForegroundColor Red
    Write-Host "   Check MySQL is running and credentials are correct" -ForegroundColor Yellow
    exit 1
}

# Import schema files
Write-Host "   Importing schema files..." -ForegroundColor Gray
$databasePath = Join-Path $projectRoot "database"

$schemaFiles = @(
    "rentease_final_phase7.sql",
    "phase8_uploads_schema.sql",
    "phase10_parent_seeker_links_schema.sql"
)

foreach ($file in $schemaFiles) {
    $filePath = Join-Path $databasePath $file
    if (Test-Path $filePath) {
        Write-Host "   Importing $file..." -ForegroundColor Gray
        
        if ($DbPass) {
            cmd /c "`"$mysqlPath`" -u $DbUser -p$DbPass rentease_db < `"$filePath`" 2>&1"
        } else {
            cmd /c "`"$mysqlPath`" -u $DbUser rentease_db < `"$filePath`" 2>&1"
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] $file imported" -ForegroundColor Green
        } else {
            Write-Host "   [WARN] Failed to import $file (may already exist)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   [WARN] $file not found" -ForegroundColor Yellow
    }
}

# Create database user
Write-Host "   Creating database user..." -ForegroundColor Gray
$createUserCmd = "CREATE USER IF NOT EXISTS 'rentease_user'@'localhost' IDENTIFIED BY '';"
$grantCmd = "GRANT ALL PRIVILEGES ON rentease_db.* TO 'rentease_user'@'localhost';"
$flushCmd = "FLUSH PRIVILEGES;"

if ($DbPass) {
    cmd /c "`"$mysqlPath`" -u $DbUser -p$DbPass -e `"$createUserCmd`" 2>&1" | Out-Null
    cmd /c "`"$mysqlPath`" -u $DbUser -p$DbPass -e `"$grantCmd`" 2>&1" | Out-Null
    cmd /c "`"$mysqlPath`" -u $DbUser -p$DbPass -e `"$flushCmd`" 2>&1" | Out-Null
} else {
    cmd /c "`"$mysqlPath`" -u $DbUser -e `"$createUserCmd`" 2>&1" | Out-Null
    cmd /c "`"$mysqlPath`" -u $DbUser -e `"$grantCmd`" 2>&1" | Out-Null
    cmd /c "`"$mysqlPath`" -u $DbUser -e `"$flushCmd`" 2>&1" | Out-Null
}

Write-Host "   [OK] Database user created" -ForegroundColor Green

Write-Host ""

# 3. SETUP BACKEND SYMLINK
Write-Host "3. Setting up backend symlink..." -ForegroundColor Yellow

$backendPath = Join-Path $projectRoot "backend"
$symlinkPath = "C:\xampp\htdocs\rentease"

if (Test-Path $symlinkPath) {
    $item = Get-Item $symlinkPath
    if ($item.LinkType -eq "SymbolicLink") {
        $target = $item.Target
        if ($target -eq $backendPath) {
            Write-Host "   [OK] Symlink already exists and is correct" -ForegroundColor Green
        } else {
            Write-Host "   [WARN] Symlink exists but points to: $target" -ForegroundColor Yellow
            Write-Host "   Remove it manually if needed: Remove-Item C:\xampp\htdocs\rentease" -ForegroundColor Gray
        }
    } else {
        Write-Host "   [WARN] Directory exists (not a symlink)" -ForegroundColor Yellow
        Write-Host "   Backend may already be copied to htdocs" -ForegroundColor Gray
    }
} else {
    try {
        New-Item -ItemType SymbolicLink -Path $symlinkPath -Target $backendPath -Force | Out-Null
        Write-Host "   [OK] Symlink created: $symlinkPath -> $backendPath" -ForegroundColor Green
    } catch {
        Write-Host "   [WARN] Failed to create symlink" -ForegroundColor Yellow
        Write-Host "   Copying backend folder instead..." -ForegroundColor Gray
        try {
            Copy-Item -Path $backendPath -Destination $symlinkPath -Recurse -Force
            Write-Host "   [OK] Backend copied to htdocs" -ForegroundColor Green
        } catch {
            Write-Host "   [ERROR] Failed to copy backend" -ForegroundColor Red
            Write-Host "   Manually copy 'backend' folder to C:\xampp\htdocs\rentease" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# 4. SETUP FRONTEND
Write-Host "4. Setting up frontend..." -ForegroundColor Yellow

$frontendPath = Join-Path $projectRoot "frontend"

if (-not (Test-Path $frontendPath)) {
    Write-Host "   [ERROR] Frontend directory not found" -ForegroundColor Red
    exit 1
}

Push-Location $frontendPath

Write-Host "   Installing dependencies (this may take a few minutes)..." -ForegroundColor Gray
try {
    npm install 2>&1 | Out-Null
    Write-Host "   [OK] Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] npm install failed" -ForegroundColor Red
    Write-Host "   Try running manually: cd frontend && npm install" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

Pop-Location
Write-Host ""

# 5. CREATE STORAGE DIRECTORY
Write-Host "5. Setting up storage..." -ForegroundColor Yellow

$storagePath = Join-Path $backendPath "storage\uploads"
if (-not (Test-Path $storagePath)) {
    try {
        New-Item -ItemType Directory -Path $storagePath -Force | Out-Null
        Write-Host "   [OK] Storage directory created" -ForegroundColor Green
    } catch {
        Write-Host "   [ERROR] Failed to create storage directory" -ForegroundColor Red
    }
} else {
    Write-Host "   [OK] Storage directory exists" -ForegroundColor Green
}

Write-Host ""

# 6. FINAL INSTRUCTIONS
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start XAMPP (Apache + MySQL)" -ForegroundColor White
Write-Host "   - Open XAMPP Control Panel" -ForegroundColor Gray
Write-Host "   - Click Start for Apache" -ForegroundColor Gray
Write-Host "   - Click Start for MySQL" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start frontend dev server:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Access application:" -ForegroundColor White
Write-Host "   Frontend: " -NoNewline -ForegroundColor Gray
Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:  " -NoNewline -ForegroundColor Gray
Write-Host "http://localhost/rentease/backend" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Login with demo accounts:" -ForegroundColor White
Write-Host "   Admin:  admin@rentease.local / Admin123!" -ForegroundColor Gray
Write-Host "   Owner:  owner@rentease.local / Owner123!" -ForegroundColor Gray
Write-Host "   Seeker: seeker@rentease.local / Seeker123!" -ForegroundColor Gray
Write-Host "   Parent: parent@rentease.local / Parent123!" -ForegroundColor Gray
Write-Host ""
Write-Host "Need help? Check QUICK_START.md for troubleshooting" -ForegroundColor Yellow
Write-Host ""
