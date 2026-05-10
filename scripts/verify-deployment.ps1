# RENTEASE Deployment Verification Script
# Checks system readiness for deployment

param(
    [string]$BackendUrl = "http://localhost/rentease/backend",
    [string]$FrontendUrl = "http://localhost:5173",
    [string]$DbHost = "localhost",
    [string]$DbName = "rentease_db",
    [string]$DbUser = "root",
    [string]$DbPass = ""
)

$ErrorActionPreference = "Continue"
$script:FailCount = 0
$script:PassCount = 0
$script:WarnCount = 0

function Write-TestResult {
    param(
        [string]$Test,
        [string]$Status,
        [string]$Message = ""
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    switch ($Status) {
        "PASS" {
            Write-Host "[$timestamp] " -NoNewline
            Write-Host "[PASS] " -ForegroundColor Green -NoNewline
            Write-Host "$Test" -ForegroundColor White
            if ($Message) { Write-Host "       $Message" -ForegroundColor Gray }
            $script:PassCount++
        }
        "FAIL" {
            Write-Host "[$timestamp] " -NoNewline
            Write-Host "[FAIL] " -ForegroundColor Red -NoNewline
            Write-Host "$Test" -ForegroundColor White
            if ($Message) { Write-Host "       $Message" -ForegroundColor Yellow }
            $script:FailCount++
        }
        "WARN" {
            Write-Host "[$timestamp] " -NoNewline
            Write-Host "[WARN] " -ForegroundColor Yellow -NoNewline
            Write-Host "$Test" -ForegroundColor White
            if ($Message) { Write-Host "       $Message" -ForegroundColor Gray }
            $script:WarnCount++
        }
        "INFO" {
            Write-Host "[$timestamp] " -NoNewline
            Write-Host "[INFO] " -ForegroundColor Cyan -NoNewline
            Write-Host "$Test" -ForegroundColor White
            if ($Message) { Write-Host "       $Message" -ForegroundColor Gray }
        }
    }
}

function Test-Command {
    param([string]$Command)
    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Test-DatabaseConnection {
    param(
        [string]$Host,
        [string]$Database,
        [string]$User,
        [string]$Password
    )
    
    try {
        $mysqlCmd = "mysql"
        if (-not (Test-Command $mysqlCmd)) {
            $mysqlCmd = "C:\xampp\mysql\bin\mysql.exe"
        }
        
        $query = "SELECT 1;"
        $passArg = if ($Password) { "-p$Password" } else { "" }
        
        $result = & $mysqlCmd -h $Host -u $User $passArg -D $Database -e $query 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
        return $false
    } catch {
        return $false
    }
}

function Test-DatabaseTable {
    param(
        [string]$Host,
        [string]$Database,
        [string]$User,
        [string]$Password,
        [string]$Table
    )
    
    try {
        $mysqlCmd = "mysql"
        if (-not (Test-Command $mysqlCmd)) {
            $mysqlCmd = "C:\xampp\mysql\bin\mysql.exe"
        }
        
        $query = "SHOW TABLES LIKE '$Table';"
        $passArg = if ($Password) { "-p$Password" } else { "" }
        
        $result = & $mysqlCmd -h $Host -u $User $passArg -D $Database -e $query 2>&1
        
        return ($result -match $Table)
    } catch {
        return $false
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RENTEASE DEPLOYMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. PREREQUISITES
Write-Host "1. CHECKING PREREQUISITES..." -ForegroundColor Cyan
Write-Host ""

# Check PHP
if (Test-Command "php") {
    $phpVersion = php -v 2>&1 | Select-String "PHP (\d+\.\d+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    if ($phpVersion -ge 8.0) {
        Write-TestResult "PHP 8.0+ installed" "PASS" "Version: $phpVersion"
    } else {
        Write-TestResult "PHP 8.0+ installed" "FAIL" "Found version: $phpVersion"
    }
} else {
    Write-TestResult "PHP installed" "FAIL" "PHP not found in PATH"
}

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version 2>&1
    Write-TestResult "Node.js installed" "PASS" "Version: $nodeVersion"
} else {
    Write-TestResult "Node.js installed" "FAIL" "Node.js not found in PATH"
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version 2>&1
    Write-TestResult "npm installed" "PASS" "Version: $npmVersion"
} else {
    Write-TestResult "npm installed" "FAIL" "npm not found in PATH"
}

# Check MySQL
$mysqlAvailable = $false
if (Test-Command "mysql") {
    $mysqlAvailable = $true
    Write-TestResult "MySQL CLI available" "PASS"
} elseif (Test-Path "C:\xampp\mysql\bin\mysql.exe") {
    $mysqlAvailable = $true
    Write-TestResult "MySQL CLI available" "PASS" "Found in XAMPP"
} else {
    Write-TestResult "MySQL CLI available" "FAIL" "MySQL not found"
}

Write-Host ""

# 2. DATABASE VERIFICATION
Write-Host "2. CHECKING DATABASE..." -ForegroundColor Cyan
Write-Host ""

if ($mysqlAvailable) {
    # Test connection
    if (Test-DatabaseConnection -Host $DbHost -Database $DbName -User $DbUser -Password $DbPass) {
        Write-TestResult "Database connection" "PASS" "Connected to $DbName"
        
        # Check required tables
        $requiredTables = @(
            "users",
            "boarding_houses",
            "rooms",
            "reservations",
            "payments",
            "feedback",
            "activity_logs",
            "error_logs",
            "uploads",
            "parent_seeker_links"
        )
        
        foreach ($table in $requiredTables) {
            if (Test-DatabaseTable -Host $DbHost -Database $DbName -User $DbUser -Password $DbPass -Table $table) {
                Write-TestResult "Table: $table" "PASS"
            } else {
                Write-TestResult "Table: $table" "FAIL" "Table not found"
            }
        }
    } else {
        Write-TestResult "Database connection" "FAIL" "Cannot connect to $DbName"
    }
} else {
    Write-TestResult "Database verification" "WARN" "MySQL CLI not available, skipping database checks"
}

Write-Host ""

# 3. BACKEND VERIFICATION
Write-Host "3. CHECKING BACKEND..." -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "..\backend"

# Check backend files
$backendFiles = @(
    "config.php",
    "helpers.php",
    "auth.php",
    "users.php",
    "boarding_house.php",
    "rooms.php",
    "reservations.php",
    "payments.php",
    "feedback.php",
    "reports.php",
    "activity_logs.php",
    "error_logs.php",
    "uploads.php",
    "account_links.php"
)

foreach ($file in $backendFiles) {
    $filePath = Join-Path $backendPath $file
    if (Test-Path $filePath) {
        Write-TestResult "Backend file: $file" "PASS"
    } else {
        Write-TestResult "Backend file: $file" "FAIL" "File not found"
    }
}

# Check storage directory
$storagePath = Join-Path $backendPath "storage\uploads"
if (Test-Path $storagePath) {
    Write-TestResult "Storage directory" "PASS" "Path: $storagePath"
} else {
    Write-TestResult "Storage directory" "FAIL" "Directory not found"
}

# Check backend health endpoint
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/auth.php?action=me" -Method GET -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) {
        Write-TestResult "Backend health check" "PASS" "Endpoint accessible"
    } else {
        Write-TestResult "Backend health check" "WARN" "Unexpected status: $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Backend health check" "FAIL" "Cannot reach $BackendUrl"
}

Write-Host ""

# 4. FRONTEND VERIFICATION
Write-Host "4. CHECKING FRONTEND..." -ForegroundColor Cyan
Write-Host ""

$frontendPath = Join-Path $PSScriptRoot "..\frontend"

# Check package.json
$packageJsonPath = Join-Path $frontendPath "package.json"
if (Test-Path $packageJsonPath) {
    Write-TestResult "package.json" "PASS"
} else {
    Write-TestResult "package.json" "FAIL" "File not found"
}

# Check node_modules
$nodeModulesPath = Join-Path $frontendPath "node_modules"
if (Test-Path $nodeModulesPath) {
    Write-TestResult "Dependencies installed" "PASS" "node_modules exists"
} else {
    Write-TestResult "Dependencies installed" "WARN" "Run 'npm install' in frontend directory"
}

# Check config files
$configFiles = @(
    "vite.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "eslint.config.js"
)

foreach ($file in $configFiles) {
    $filePath = Join-Path $frontendPath $file
    if (Test-Path $filePath) {
        Write-TestResult "Config: $file" "PASS"
    } else {
        Write-TestResult "Config: $file" "FAIL" "File not found"
    }
}

# Check source files
$srcPath = Join-Path $frontendPath "src"
$srcFiles = @(
    "main.jsx",
    "App.jsx",
    "index.css"
)

foreach ($file in $srcFiles) {
    $filePath = Join-Path $srcPath $file
    if (Test-Path $filePath) {
        Write-TestResult "Source: $file" "PASS"
    } else {
        Write-TestResult "Source: $file" "FAIL" "File not found"
    }
}

Write-Host ""

# 5. SUMMARY
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Passed:  " -NoNewline
Write-Host "$script:PassCount" -ForegroundColor Green
Write-Host "Failed:  " -NoNewline
Write-Host "$script:FailCount" -ForegroundColor Red
Write-Host "Warnings: " -NoNewline
Write-Host "$script:WarnCount" -ForegroundColor Yellow
Write-Host ""

if ($script:FailCount -eq 0) {
    Write-Host "STATUS: " -NoNewline
    Write-Host "READY FOR DEPLOYMENT" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run smoke tests: .\scripts\phase8-api-smoke-test.ps1" -ForegroundColor White
    Write-Host "2. Start frontend: cd frontend && npm run dev" -ForegroundColor White
    Write-Host "3. Test login with demo accounts" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "STATUS: " -NoNewline
    Write-Host "NOT READY - FIX FAILURES ABOVE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Review DEPLOYMENT_CHECKLIST.md for detailed requirements" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
