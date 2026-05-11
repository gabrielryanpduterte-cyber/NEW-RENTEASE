param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
    [string]$XamppRoot = 'C:\xampp',
    [int]$MySqlPort = 0,
    [string]$MySqlUser = 'root',
    [string]$MySqlPassword = '',
    [string]$DatabaseName = 'rentease_db',
    [switch]$SkipDatabaseReset,
    [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'

function Write-Step($Message) {
    Write-Host ""
    Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Write-Ok($Message) {
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn($Message) {
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Get-MysqldPort([string]$MyIniPath) {
    if (!(Test-Path -LiteralPath $MyIniPath)) {
        return 3306
    }

    $inMysqld = $false
    foreach ($line in Get-Content -LiteralPath $MyIniPath) {
        $trimmed = $line.Trim()
        if ($trimmed -match '^\[mysqld\]$') {
            $inMysqld = $true
            continue
        }
        if ($inMysqld -and $trimmed -match '^\[') {
            break
        }
        if ($inMysqld -and $trimmed -match '^port\s*=\s*(\d+)') {
            return [int]$Matches[1]
        }
    }

    return 3306
}

function Invoke-MySqlFile([string]$MySqlExe, [array]$BaseArgs, [string]$DbName, [string]$FilePath) {
    if (!(Test-Path -LiteralPath $FilePath)) {
        throw "SQL file not found: $FilePath"
    }

    Write-Step "Importing $(Split-Path $FilePath -Leaf)"
    Get-Content -LiteralPath $FilePath -Raw | & $MySqlExe @BaseArgs $DbName
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL import failed: $FilePath"
    }
}

$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
$backendDir = Join-Path $RepoRoot 'backend'
$frontendDir = Join-Path $RepoRoot 'frontend'
$databaseDir = Join-Path $RepoRoot 'database'
$scriptsDir = Join-Path $RepoRoot 'scripts'

Write-Step "Checking project folders"
foreach ($path in @($backendDir, $frontendDir, $databaseDir)) {
    if (!(Test-Path -LiteralPath $path)) {
        throw "Missing required folder: $path"
    }
}
Write-Ok "Project root: $RepoRoot"

$mysqlRoot = Join-Path $XamppRoot 'mysql'
$mysqlBin = Join-Path $mysqlRoot 'bin'
$mysqlExe = Join-Path $mysqlBin 'mysql.exe'
$mysqlAdminExe = Join-Path $mysqlBin 'mysqladmin.exe'
$myIni = Join-Path $mysqlBin 'my.ini'

if (!(Test-Path -LiteralPath $mysqlExe)) {
    throw "XAMPP MySQL was not found at $mysqlExe. Install XAMPP or pass -XamppRoot."
}

if ($MySqlPort -le 0) {
    $MySqlPort = Get-MysqldPort $myIni
}

Write-Step "Checking XAMPP MySQL"
$pingArgs = @('-u', $MySqlUser, '--protocol=tcp', "--port=$MySqlPort")
if ($MySqlPassword -ne '') {
    $pingArgs += "-p$MySqlPassword"
}

$ping = & $mysqlAdminExe @pingArgs ping 2>$null
if (!($LASTEXITCODE -eq 0 -and ($ping -join "`n") -match 'alive')) {
    Write-Warn "MySQL is not running on port $MySqlPort. Trying the repair/start script."
    $repairScript = Join-Path $scriptsDir 'xampp-mysql-repair.ps1'
    & $repairScript -XamppRoot $XamppRoot -Port $MySqlPort -Start

    $ping = & $mysqlAdminExe @pingArgs ping 2>$null
    if (!($LASTEXITCODE -eq 0 -and ($ping -join "`n") -match 'alive')) {
        throw "MySQL still is not running. Open XAMPP Control Panel as Administrator, start MySQL, then rerun this script."
    }
}
Write-Ok "MySQL is running on port $MySqlPort."

Write-Step "Preparing environment files"
$backendEnvExample = Join-Path $backendDir '.env.example'
$backendEnv = Join-Path $backendDir '.env'
$frontendEnvExample = Join-Path $frontendDir '.env.example'
$frontendEnv = Join-Path $frontendDir '.env.local'

if (!(Test-Path -LiteralPath $backendEnv)) {
    $content = Get-Content -LiteralPath $backendEnvExample -Raw
    $content = $content -replace 'RENTEASE_DB_PORT=\d+', "RENTEASE_DB_PORT=$MySqlPort"
    $content = $content -replace 'RENTEASE_DB_USER=.*', "RENTEASE_DB_USER=$MySqlUser"
    $content = $content -replace 'RENTEASE_DB_PASS=.*', "RENTEASE_DB_PASS=$MySqlPassword"
    $content = $content -replace 'RENTEASE_DB_NAME=.*', "RENTEASE_DB_NAME=$DatabaseName"
    Set-Content -LiteralPath $backendEnv -Value $content -NoNewline
    Write-Ok "Created backend/.env"
} else {
    Write-Warn "backend/.env already exists; leaving it unchanged."
}

if (!(Test-Path -LiteralPath $frontendEnv)) {
    Copy-Item -LiteralPath $frontendEnvExample -Destination $frontendEnv
    Write-Ok "Created frontend/.env.local"
} else {
    Write-Warn "frontend/.env.local already exists; leaving it unchanged."
}

Write-Step "Creating Apache route /rentease"
$htdocs = Join-Path $XamppRoot 'htdocs'
$linkPath = Join-Path $htdocs 'rentease'
if (Test-Path -LiteralPath $htdocs) {
    if (!(Test-Path -LiteralPath $linkPath)) {
        New-Item -ItemType Junction -Path $linkPath -Target $RepoRoot | Out-Null
        Write-Ok "Created junction: $linkPath -> $RepoRoot"
    } else {
        Write-Warn "$linkPath already exists. Confirm it points to this repo before testing."
    }
} else {
    Write-Warn "XAMPP htdocs folder not found. Backend URL may not work until Apache can serve this repo as /rentease."
}

if (!$SkipInstall) {
    Write-Step "Installing backend dependencies"
    if (Get-Command composer -ErrorAction SilentlyContinue) {
        Push-Location $backendDir
        composer install
        Pop-Location
        Write-Ok "Composer dependencies installed."
    } else {
        Write-Warn "composer command not found. Install Composer if backend/vendor is missing."
    }

    Write-Step "Installing frontend dependencies"
    Push-Location $frontendDir
    if (Test-Path -LiteralPath (Join-Path $frontendDir 'package-lock.json')) {
        npm ci
    } else {
        npm install
    }
    Pop-Location
    Write-Ok "Frontend dependencies installed."
} else {
    Write-Warn "Skipping dependency install because -SkipInstall was supplied."
}

$mysqlArgs = @('-u', $MySqlUser, '--protocol=tcp', "--port=$MySqlPort")
if ($MySqlPassword -ne '') {
    $mysqlArgs += "-p$MySqlPassword"
}

$databaseWasReset = $false

if (!$SkipDatabaseReset) {
    Write-Step "Recreating $DatabaseName"
    & $mysqlExe @mysqlArgs -e "DROP DATABASE IF EXISTS $DatabaseName; CREATE DATABASE $DatabaseName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create database $DatabaseName."
    }

    Invoke-MySqlFile $mysqlExe $mysqlArgs $DatabaseName (Join-Path $databaseDir 'rentease_base_schema.sql')
    Invoke-MySqlFile $mysqlExe $mysqlArgs $DatabaseName (Join-Path $databaseDir 'staging_seed.sql')
    $databaseWasReset = $true
    Write-Ok "Database reset and seeded."
} else {
    Write-Warn "Skipping database reset because -SkipDatabaseReset was supplied."
}

Write-Step "Verifying database"
& $mysqlExe @mysqlArgs $DatabaseName -e "SELECT role, email FROM users ORDER BY user_id; SELECT COUNT(*) AS rooms FROM rooms; SELECT COUNT(*) AS reservations FROM reservations;"
if ($LASTEXITCODE -ne 0) {
    throw "Database verification failed."
}

Write-Step "Next commands"
Write-Host "1. Start Apache in XAMPP Control Panel if it is not running."
Write-Host "2. Verify backend: http://localhost/rentease/backend/ping.php"
Write-Host "3. Start frontend:"
Write-Host "   cd `"$frontendDir`""
Write-Host "   npm run dev"
Write-Host "4. Open: http://localhost:5173"
Write-Host ""
if ($databaseWasReset) {
    Write-Host "Seeded logins:"
    Write-Host "  Admin:    admin@rentease.test / Admin@1234    role=admin"
    Write-Host "  Landlord: landlord@rentease.test / Owner@1234 role=owner"
    Write-Host "  Seeker 1: seeker1@rentease.test / Seeker@1234 role=seeker"
    Write-Host "  Seeker 2: seeker2@rentease.test / Seeker@1234 role=seeker"
} else {
    Write-Host "Seeded test logins are only guaranteed after running without -SkipDatabaseReset."
}

Write-Ok "Team test setup complete."
