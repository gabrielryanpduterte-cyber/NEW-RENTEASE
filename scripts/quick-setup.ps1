# RENTEASE Quick Setup Script
# Prepares system for deployment

param(
    [switch]$SkipDatabase,
    [switch]$SkipFrontend,
    [string]$DbUser = "root",
    [string]$DbPass = ""
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RENTEASE QUICK SETUP" -ForegroundColor Cyan
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

try {
    $npmVersion = npm --version
    Write-Host "   [OK] npm $npmVersion found" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] npm not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. SETUP DATABASE
if (-not $SkipDatabase) {
    Write-Host "2. Setting up database..." -ForegroundColor Yellow
    
    $mysqlCmd = "mysql"
    if (-not (Get-Command $mysqlCmd -ErrorAction SilentlyContinue)) {
        $mysqlCmd = "C:\xampp\mysql\bin\mysql.exe"
        if (-not (Test-Path $mysqlCmd)) {
            Write-Host "   [ERROR] MySQL not found" -ForegroundColor Red
            Write-Host "   Start XAMPP MySQL or add MySQL to PATH" -ForegroundColor Yellow
            exit 1
        }
    }
    
    Write-Host "   Creating database..." -ForegroundColor Gray
    $passArg = if ($DbPass) { "-p$DbPass" } else { "" }
    
    try {
        & $mysqlCmd -u $DbUser $passArg -e "CREATE DATABASE IF NOT EXISTS rentease_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1 | Out-Null
        Write-Host "   [OK] Database created" -ForegroundColor Green
    } catch {
        Write-Host "   [ERROR] Failed to create database" -ForegroundColor Red
        Write-Host "   $_" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "   Importing schema..." -ForegroundColor Gray
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
            try {
                $importCmd = "$mysqlCmd -u $DbUser $passArg rentease_db"
                Get-Content $filePath | & $mysqlCmd -u $DbUser $passArg rentease_db 2>&1 | Out-Null
                Write-Host "   [OK] $file imported" -ForegroundColor Green
            } catch {
                Write-Host "   [WARN] Failed to import $file" -ForegroundColor Yellow
                Write-Host "   Error: $_" -ForegroundColor DarkGray
            }
        } else {
            Write-Host "   [WARN] $file not found" -ForegroundColor Yellow
        }
    }
    
    Write-Host "   Creating database user..." -ForegroundColor Gray
    try {
        & $mysqlCmd -u $DbUser $passArg -e "CREATE USER IF NOT EXISTS 'rentease_user'@'localhost' IDENTIFIED BY '';" 2>&1 | Out-Null
        & $mysqlCmd -u $DbUser $passArg -e "GRANT ALL PRIVILEGES ON rentease_db.* TO 'rentease_user'@'localhost';" 2>&1 | Out-Null
        & $mysqlCmd -u $DbUser $passArg -e "FLUSH PRIVILEGES;" 2>&1 | Out-Null
        Write-Host "   [OK] Database user created" -ForegroundColor Green
    } catch {
        Write-Host "   [WARN] User creation failed (may already exist)" -ForegroundColor Yellow
    }
    
    Write-Host ""
} else {
    Write-Host "2. Skipping database setup" -ForegroundColor Gray
    Write-Host ""
}

# 3. SETUP BACKEND SYMLINK
Write-Host "3. Setting up backend symlink..." -ForegroundColor Yellow

$backendPath = Join-Path $projectRoot "backend"
$symlinkPath = "C:\xampp\htdocs\rentease"

if (Test-Path $symlinkPath) {
    $target = (Get-Item $symlinkPath).Target
    if ($target -eq $backendPath) {
        Write-Host "   [OK] Symlink already exists and points to correct location" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Symlink exists but points to: $target" -ForegroundColor Yellow
        Write-Host "   Remove it manually if needed: Remove-Item C:\xampp\htdocs\rentease" -ForegroundColor Gray
    }
} else {
    try {
        New-Item -ItemType SymbolicLink -Path $symlinkPath -Target $backendPath -Force | Out-Null
        Write-Host "   [OK] Symlink created: $symlinkPath -> $backendPath" -ForegroundColor Green
    } catch {
        Write-Host "   [ERROR] Failed to create symlink" -ForegroundColor Red
        Write-Host "   Run PowerShell as Administrator and try again" -ForegroundColor Yellow
        Write-Host "   Or manually copy backend folder to C:\xampp\htdocs\rentease" -ForegroundColor Yellow
    }
}

Write-Host ""

# 4. SETUP FRONTEND
if (-not $SkipFrontend) {
    Write-Host "4. Setting up frontend..." -ForegroundColor Yellow
    
    $frontendPath = Join-Path $projectRoot "frontend"
    
    if (-not (Test-Path $frontendPath)) {
        Write-Host "   [ERROR] Frontend directory not found" -ForegroundColor Red
        exit 1
    }
    
    Push-Location $frontendPath
    
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    try {
        npm install 2>&1 | Out-Null
        Write-Host "   [OK] Dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "   [ERROR] npm install failed" -ForegroundColor Red
        Write-Host "   $_" -ForegroundColor Yellow
        Pop-Location
        exit 1
    }
    
    Write-Host "   Testing build..." -ForegroundColor Gray
    try {
        npm run build 2>&1 | Out-Null
        Write-Host "   [OK] Build successful" -ForegroundColor Green
    } catch {
        Write-Host "   [WARN] Build failed (may need manual fix)" -ForegroundColor Yellow
    }
    
    Pop-Location
    Write-Host ""
} else {
    Write-Host "4. Skipping frontend setup" -ForegroundColor Gray
    Write-Host ""
}

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

# 6. VERIFY SETUP
Write-Host "6. Verifying setup..." -ForegroundColor Yellow

$verifyScript = Join-Path $PSScriptRoot "verify-deployment.ps1"
if (Test-Path $verifyScript) {
    Write-Host "   Running verification script..." -ForegroundColor Gray
    Write-Host ""
    & $verifyScript
} else {
    Write-Host "   [WARN] Verification script not found" -ForegroundColor Yellow
    Write-Host ""
}

# 7. FINAL INSTRUCTIONS
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start XAMPP (Apache + MySQL)" -ForegroundColor White
Write-Host ""
Write-Host "2. Start frontend dev server:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Access application:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost/rentease/backend" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Test with demo accounts:" -ForegroundColor White
Write-Host "   Admin:  admin@rentease.local / Admin123!" -ForegroundColor Gray
Write-Host "   Owner:  owner@rentease.local / Owner123!" -ForegroundColor Gray
Write-Host "   Seeker: seeker@rentease.local / Seeker123!" -ForegroundColor Gray
Write-Host "   Parent: parent@rentease.local / Parent123!" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Run smoke tests:" -ForegroundColor White
Write-Host "   .\scripts\phase8-api-smoke-test.ps1" -ForegroundColor Gray
Write-Host ""
