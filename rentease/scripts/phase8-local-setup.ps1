param(
    [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
    [string]$XamppRoot = 'C:\xampp',
    [string]$DatabaseName = 'rentease_db',
    [ValidateSet('reseed', 'final', 'none')]
    [string]$SeedMode = 'reseed',
    [string]$DbAdminUser = 'root',
    [string]$DbAdminPassword = '',
    [switch]$ForceLink
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
    Write-Host "[phase8-setup] $Message"
}

function Get-MySqlArgs {
    $args = @('-u', $DbAdminUser)
    if ($DbAdminPassword -ne '') {
        $args += "-p$DbAdminPassword"
    }
    return $args
}

function Invoke-MySqlCommand([string]$Sql) {
    $mysqlExe = Join-Path $XamppRoot 'mysql\bin\mysql.exe'
    if (-not (Test-Path $mysqlExe)) {
        throw "MySQL CLI not found: $mysqlExe"
    }

    $args = Get-MySqlArgs
    & $mysqlExe @args -e $Sql
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL command failed with exit code $LASTEXITCODE"
    }
}

function Import-MySqlFile([string]$SqlPath, [string]$Database) {
    $mysqlExe = Join-Path $XamppRoot 'mysql\bin\mysql.exe'
    if (-not (Test-Path $mysqlExe)) {
        throw "MySQL CLI not found: $mysqlExe"
    }
    if (-not (Test-Path $SqlPath)) {
        throw "SQL file not found: $SqlPath"
    }

    $args = Get-MySqlArgs
    Get-Content -LiteralPath $SqlPath -Raw | & $mysqlExe @args $Database
    if ($LASTEXITCODE -ne 0) {
        throw "Import failed for $SqlPath with exit code $LASTEXITCODE"
    }
}

function Test-DatabaseTableExists([string]$Database, [string]$TableName) {
    $mysqlExe = Join-Path $XamppRoot 'mysql\bin\mysql.exe'
    if (-not (Test-Path $mysqlExe)) {
        throw "MySQL CLI not found: $mysqlExe"
    }

    $args = Get-MySqlArgs
    $query = "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = '$Database' AND table_name = '$TableName';"
    $result = & $mysqlExe @args -N -s -e $query
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to check schema state for $Database.$TableName"
    }

    return ([int]($result.Trim())) -gt 0
}

function Ensure-HtdocsLink {
    $htdocsRoot = Join-Path $XamppRoot 'htdocs'
    if (-not (Test-Path $htdocsRoot)) {
        throw "XAMPP htdocs directory not found: $htdocsRoot"
    }

    $linkPath = Join-Path $htdocsRoot 'rentease'
    if (Test-Path $linkPath) {
        $item = Get-Item -LiteralPath $linkPath -Force
        if ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
            Write-Step "Existing link detected: $linkPath"
            return
        }

        $expectedBackend = Join-Path $linkPath 'backend\auth.php'
        if (Test-Path $expectedBackend) {
            Write-Step "Existing directory detected at $linkPath with backend files; keeping current path as-is."
            return
        }

        if (-not $ForceLink) {
            throw "Path exists at $linkPath but does not contain expected backend files. Re-run with -ForceLink to replace it with a junction."
        }

        $backupPath = $linkPath + '.backup.' + (Get-Date -Format 'yyyyMMdd-HHmmss')
        Move-Item -LiteralPath $linkPath -Destination $backupPath
        Write-Step "Moved existing directory to backup: $backupPath"
    }

    New-Item -ItemType Junction -Path $linkPath -Target $ProjectRoot | Out-Null
    Write-Step "Created junction: $linkPath -> $ProjectRoot"
}

Write-Step "Project root: $ProjectRoot"
Write-Step "XAMPP root: $XamppRoot"

Ensure-HtdocsLink

Write-Step "Ensuring database '$DatabaseName' exists"
Invoke-MySqlCommand "CREATE DATABASE IF NOT EXISTS $DatabaseName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

Write-Step "Ensuring backend DB user exists"
Invoke-MySqlCommand @"
CREATE USER IF NOT EXISTS 'rentease_user'@'localhost' IDENTIFIED BY '';
ALTER USER 'rentease_user'@'localhost' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON $DatabaseName.* TO 'rentease_user'@'localhost';
FLUSH PRIVILEGES;
"@

if ($SeedMode -ne 'none') {
    $finalDump = Join-Path $ProjectRoot 'database\rentease_final_phase7.sql'
    $reseedDump = Join-Path $ProjectRoot 'database\phase7_demo_seed.sql'

    if ($SeedMode -eq 'final') {
        Write-Step "Importing SQL (final): $finalDump"
        Import-MySqlFile -SqlPath $finalDump -Database $DatabaseName
    } else {
        $hasUsersTable = Test-DatabaseTableExists -Database $DatabaseName -TableName 'users'
        $hasFeedbackTable = Test-DatabaseTableExists -Database $DatabaseName -TableName 'feedback'
        if (-not $hasUsersTable -or -not $hasFeedbackTable) {
            Write-Step "Schema not detected. Importing full baseline first: $finalDump"
            Import-MySqlFile -SqlPath $finalDump -Database $DatabaseName
        }
        Write-Step "Importing SQL (reseed): $reseedDump"
        Import-MySqlFile -SqlPath $reseedDump -Database $DatabaseName
    }
}

Write-Step "Applying Phase 8 schema: uploads"
Import-MySqlFile -SqlPath (Join-Path $ProjectRoot 'database\phase8_uploads_schema.sql') -Database $DatabaseName

Write-Step "Applying Phase 10 schema: parent-seeker links"
Import-MySqlFile -SqlPath (Join-Path $ProjectRoot 'database\phase10_parent_seeker_links_schema.sql') -Database $DatabaseName

Write-Step "Applying Phase 11 schema: email verification"
Import-MySqlFile -SqlPath (Join-Path $ProjectRoot 'database\phase11_email_verification_schema.sql') -Database $DatabaseName

Write-Step 'Setup completed successfully.'
