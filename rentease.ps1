<#
RENTEASE project helper

Examples:
  .\rentease.ps1 help
  .\rentease.ps1 setup
  .\rentease.ps1 dev
  .\rentease.ps1 verify
  .\rentease.ps1 pre-push
  .\rentease.ps1 db-backup
  .\rentease.ps1 db-restore -BackupFile .\backups\rentease_db_20260510_120000.sql -Yes
  .\rentease.ps1 db-reset -Yes
#>

[CmdletBinding()]
param(
    [ValidateSet('help', 'setup', 'dev', 'verify', 'pre-push', 'db-reset', 'db-backup', 'db-restore')]
    [string]$Command = 'help',

    [string]$DbHost = '',
    [int]$DbPort = 0,
    [string]$DbName = '',
    [string]$DbUser = '',
    [string]$DbPass = '',
    [string]$BackupFile = '',

    [switch]$Yes,
    [switch]$SkipBuild,
    [switch]$SkipDbCheck
)

$ErrorActionPreference = 'Stop'

$Root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$FrontendDir = Join-Path $Root 'frontend'
$BackendDir = Join-Path $Root 'backend'
$DatabaseDir = Join-Path $Root 'database'
$BackupDir = Join-Path $Root 'backups'

if (-not $DbHost) { $DbHost = if ($env:RENTEASE_DB_HOST) { $env:RENTEASE_DB_HOST } else { 'localhost' } }
if ($DbPort -eq 0) { $DbPort = if ($env:RENTEASE_DB_PORT) { [int]$env:RENTEASE_DB_PORT } else { 3307 } }
if (-not $DbName) { $DbName = if ($env:RENTEASE_DB_NAME) { $env:RENTEASE_DB_NAME } else { 'rentease_db' } }
if (-not $DbUser) { $DbUser = if ($env:RENTEASE_DB_USER) { $env:RENTEASE_DB_USER } else { 'root' } }
if (-not $DbPass -and $env:RENTEASE_DB_PASS) { $DbPass = $env:RENTEASE_DB_PASS }

$script:Failures = 0
$script:Warnings = 0

function Write-Section {
    param([string]$Text)
    Write-Host ''
    Write-Host "== $Text ==" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Text)
    Write-Host "[OK] $Text" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Text)
    $script:Warnings++
    Write-Host "[WARN] $Text" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Text)
    $script:Failures++
    Write-Host "[FAIL] $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "[INFO] $Text" -ForegroundColor Gray
}

function Resolve-Executable {
    param(
        [string]$Name,
        [string[]]$Fallbacks = @()
    )

    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    foreach ($path in $Fallbacks) {
        if (Test-Path -LiteralPath $path -PathType Leaf) {
            return $path
        }
    }

    return $null
}

function Get-MySqlPath {
    return Resolve-Executable 'mysql.exe' @(
        'C:\xampp\mysql\bin\mysql.exe',
        'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
    )
}

function Get-MySqlDumpPath {
    return Resolve-Executable 'mysqldump.exe' @(
        'C:\xampp\mysql\bin\mysqldump.exe',
        'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe'
    )
}

function Get-MySqlArgs {
    param([switch]$IncludeDatabase)

    $argsList = @('-h', $DbHost, '-P', [string]$DbPort, '-u', $DbUser)
    if ($DbPass -ne '') {
        $argsList += "-p$DbPass"
    }
    if ($IncludeDatabase) {
        $argsList += $DbName
    }
    return $argsList
}

function Invoke-External {
    param(
        [string]$Label,
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$WorkingDirectory = $Root
    )

    Write-Info $Label
    Push-Location $WorkingDirectory
    try {
        & $FilePath @Arguments
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "$Label failed with exit code $LASTEXITCODE"
            return $false
        }
        Write-Ok $Label
        return $true
    }
    finally {
        Pop-Location
    }
}

function Import-SqlFile {
    param([string]$Path)

    $mysql = Get-MySqlPath
    if (-not $mysql) {
        Write-Fail 'MySQL client not found.'
        return $false
    }
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        Write-Fail "SQL file not found: $Path"
        return $false
    }

    Write-Info "Importing $Path"
    $mysqlArgs = Get-MySqlArgs -IncludeDatabase
    Get-Content -LiteralPath $Path -Raw | & $mysql @mysqlArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Import failed: $Path"
        return $false
    }

    Write-Ok "Imported $(Split-Path -Leaf $Path)"
    return $true
}

function Invoke-MySqlQuery {
    param(
        [string]$Query,
        [switch]$UseDatabase
    )

    $mysql = Get-MySqlPath
    if (-not $mysql) {
        Write-Fail 'MySQL client not found.'
        return $false
    }

    $mysqlArgs = Get-MySqlArgs -IncludeDatabase:$UseDatabase
    $mysqlArgs += @('-e', $Query)
    & $mysql @mysqlArgs
    if ($LASTEXITCODE -ne 0) {
        return $false
    }
    return $true
}

function Show-Help {
    Write-Host ''
    Write-Host 'RENTEASE helper script' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'Usage:'
    Write-Host '  .\rentease.ps1 <command> [options]'
    Write-Host ''
    Write-Host 'Commands:'
    Write-Host '  help       Show this help.'
    Write-Host '  setup      Check tools, install frontend dependencies, and create DB if missing.'
    Write-Host '  dev        Run the frontend dev server in the foreground.'
    Write-Host '  verify     Run conflict scan, secret scan, PHP syntax, frontend lint, and build.'
    Write-Host '  pre-push   Run verify, then show Git status.'
    Write-Host '  db-reset   Re-seed demo data. Requires existing schema. Use -Yes to skip prompt.'
    Write-Host '  db-backup  Export MySQL database into .\backups.'
    Write-Host '  db-restore Import a SQL backup. Requires -BackupFile and confirmation.'
    Write-Host ''
    Write-Host 'Options:'
    Write-Host '  -Yes              Skip confirmation for destructive database actions.'
    Write-Host '  -SkipBuild        Skip Vite production build during verify/pre-push.'
    Write-Host '  -SkipDbCheck      Skip database connectivity check during verify.'
    Write-Host '  -BackupFile PATH  SQL backup path for db-restore, or output path for db-backup.'
    Write-Host '  -DbHost HOST      Default: RENTEASE_DB_HOST or localhost.'
    Write-Host '  -DbPort PORT      Default: RENTEASE_DB_PORT or 3307.'
    Write-Host '  -DbName NAME      Default: RENTEASE_DB_NAME or rentease_db.'
    Write-Host '  -DbUser USER      Default: RENTEASE_DB_USER or root.'
    Write-Host '  -DbPass PASS      Default: RENTEASE_DB_PASS or empty.'
    Write-Host ''
}

function Assert-Tool {
    param(
        [string]$Name,
        [string[]]$Fallbacks = @()
    )

    $path = Resolve-Executable $Name $Fallbacks
    if ($path) {
        Write-Ok "$Name found: $path"
        return $true
    }

    Write-Fail "$Name not found."
    return $false
}

function Invoke-Setup {
    Write-Section 'Setup'
    Assert-Tool 'php.exe' @('C:\xampp\php\php.exe') | Out-Null
    Assert-Tool 'node.exe' | Out-Null
    Assert-Tool 'npm.cmd' @('C:\Program Files\nodejs\npm.cmd') | Out-Null
    Assert-Tool 'mysql.exe' @('C:\xampp\mysql\bin\mysql.exe') | Out-Null

    if ($script:Failures -gt 0) {
        throw 'Missing required tools.'
    }

    Invoke-External 'Installing frontend dependencies' 'npm' @('install') $FrontendDir | Out-Null

    Write-Info "Creating database if missing: $DbName"
    $createDb = "CREATE DATABASE IF NOT EXISTS ``$DbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    if (Invoke-MySqlQuery $createDb) {
        Write-Ok "Database is available: $DbName"
    }
    else {
        Write-Fail 'Could not create/check database. Make sure MySQL is running.'
    }

    Write-Host ''
    Write-Host 'Next useful commands:' -ForegroundColor Cyan
    Write-Host '  .\rentease.ps1 verify'
    Write-Host '  .\rentease.ps1 dev'
}

function Test-ConflictMarkers {
    Write-Section 'Conflict marker scan'
    $exclude = '\\(node_modules|vendor|dist|\.git|\.idea)\\'
    $pattern = '^(<<<<<<< .+|=======$|>>>>>>> .+)'
    $matches = Get-ChildItem -Path $Root -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch $exclude -and $_.Length -lt 5242880 } |
        Select-String -Pattern $pattern

    if ($matches) {
        foreach ($match in $matches) {
            Write-Host "$($match.Path):$($match.LineNumber): $($match.Line)" -ForegroundColor Red
        }
        Write-Fail 'Conflict markers found.'
        return
    }

    Write-Ok 'No conflict markers found.'
}

function Test-SecretPatterns {
    Write-Section 'Secret scan'
    $exclude = '\\(node_modules|vendor|dist|\.git)\\'
    $pattern = @'
GOCSPX-[A-Za-z0-9_-]+|ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|AIza[0-9A-Za-z_-]{20,}|client_secret\s*[:=]\s*["'][^"'<\s]
'@.Trim()

    $matches = Get-ChildItem -Path $Root -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch $exclude -and $_.Length -lt 1048576 } |
        Select-String -Pattern $pattern -CaseSensitive:$false

    if ($matches) {
        foreach ($match in $matches) {
            Write-Host "$($match.Path):$($match.LineNumber): $($match.Line)" -ForegroundColor Red
        }
        Write-Fail 'Potential secret found.'
        return
    }

    Write-Ok 'No obvious secrets found.'
}

function Test-GitDiffCheck {
    Write-Section 'Git diff check'
    $git = Resolve-Executable 'git.exe'
    if (-not $git) {
        Write-Warn 'Git not found; skipping diff check.'
        return
    }

    & $git diff --check
    $unstagedCode = $LASTEXITCODE
    & $git diff --cached --check
    $stagedCode = $LASTEXITCODE

    if ($unstagedCode -ne 0 -or $stagedCode -ne 0) {
        Write-Fail 'Git diff check failed.'
    }
    else {
        Write-Ok 'Git diff check passed.'
    }
}

function Test-PhpSyntax {
    Write-Section 'PHP syntax'
    $php = Resolve-Executable 'php.exe' @('C:\xampp\php\php.exe')
    if (-not $php) {
        Write-Fail 'PHP not found.'
        return
    }

    $files = Get-ChildItem -Path $BackendDir -Recurse -Filter '*.php' -File |
        Where-Object { $_.FullName -notmatch '\\vendor\\' }

    foreach ($file in $files) {
        & $php -l $file.FullName | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "PHP syntax failed: $($file.FullName)"
        }
    }

    if ($script:Failures -eq 0) {
        Write-Ok "PHP syntax OK ($($files.Count) files)."
    }
}

function Test-Frontend {
    Write-Section 'Frontend'
    Invoke-External 'npm run lint' 'npm' @('run', 'lint') $FrontendDir | Out-Null
    if (-not $SkipBuild) {
        Invoke-External 'npm run build' 'npm' @('run', 'build') $FrontendDir | Out-Null
    }
    else {
        Write-Warn 'Build skipped because -SkipBuild was provided.'
    }
}

function Test-DatabaseConnection {
    if ($SkipDbCheck) {
        Write-Warn 'Database check skipped because -SkipDbCheck was provided.'
        return
    }

    Write-Section 'Database'
    $mysql = Get-MySqlPath
    if (-not $mysql) {
        Write-Warn 'MySQL client not found; database connectivity not checked.'
        return
    }

    if (Invoke-MySqlQuery 'SELECT 1;' -UseDatabase) {
        Write-Ok "Connected to $DbName on ${DbHost}:${DbPort}."
    }
    else {
        Write-Warn "Could not connect to $DbName on ${DbHost}:${DbPort}."
    }
}

function Invoke-Verify {
    $script:Failures = 0
    $script:Warnings = 0

    Test-ConflictMarkers
    Test-SecretPatterns
    Test-GitDiffCheck
    Test-PhpSyntax
    Test-Frontend
    Test-DatabaseConnection

    Write-Section 'Summary'
    if ($script:Failures -gt 0) {
        Write-Fail "$($script:Failures) failure(s), $($script:Warnings) warning(s)."
        exit 1
    }

    Write-Ok "Verification passed with $($script:Warnings) warning(s)."
}

function Invoke-Dev {
    Write-Section 'Development server'
    Write-Host 'Frontend: http://localhost:5173'
    Write-Host 'Backend:  http://localhost/rentease/backend'
    Write-Host ''
    Write-Info 'Running npm run dev. Press Ctrl+C to stop.'
    Push-Location $FrontendDir
    try {
        & npm run dev
    }
    finally {
        Pop-Location
    }
}

function Confirm-Action {
    param([string]$Message)

    if ($Yes) {
        return $true
    }

    $answer = Read-Host "$Message Type YES to continue"
    return $answer -eq 'YES'
}

function Invoke-DbReset {
    Write-Section 'Database reset'
    Write-Warn 'This re-seeds demo data and may truncate existing app tables.'
    Write-Warn 'It requires the base schema to already exist.'

    if (-not (Confirm-Action "Reset $DbName on ${DbHost}:${DbPort}?")) {
        Write-Host 'Cancelled.'
        return
    }

    $files = @(
        'phase7_demo_seed.sql',
        'phase8_uploads_schema.sql',
        'phase10_parent_seeker_links_schema.sql',
        'safe_google_oauth_migration.sql',
        'phase12_google_oauth_schema.sql',
        'phase13_seeker_guardian_schema.sql',
        'phase14_owner_landlord_schema.sql'
    )

    foreach ($file in $files) {
        Import-SqlFile (Join-Path $DatabaseDir $file) | Out-Null
        if ($script:Failures -gt 0) {
            exit 1
        }
    }

    Write-Ok 'Database reset/migrations completed.'
    Write-Host ''
    Write-Host 'Demo credentials:' -ForegroundColor Cyan
    Write-Host '  admin@rentease.local  / Admin123!  / admin'
    Write-Host '  owner@rentease.local  / Owner123!  / owner'
    Write-Host '  seeker@rentease.local / Seeker123! / seeker'
    Write-Host '  parent@rentease.local / Parent123! / parent'
}

function Invoke-DbBackup {
    Write-Section 'Database backup'
    $dump = Get-MySqlDumpPath
    if (-not $dump) {
        Write-Fail 'mysqldump not found.'
        exit 1
    }

    if (-not $BackupFile) {
        New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
        $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
        $BackupFile = Join-Path $BackupDir "$DbName`_$stamp.sql"
    }

    $dumpArgs = Get-MySqlArgs
    $dumpArgs += @('--routines', '--triggers', $DbName)
    Write-Info "Writing backup to $BackupFile"
    & $dump @dumpArgs > $BackupFile

    if ($LASTEXITCODE -ne 0) {
        Write-Fail 'Database backup failed.'
        exit 1
    }

    Write-Ok "Backup created: $BackupFile"
}

function Invoke-DbRestore {
    Write-Section 'Database restore'
    if (-not $BackupFile) {
        Write-Fail 'Provide -BackupFile for db-restore.'
        exit 1
    }
    if (-not (Test-Path -LiteralPath $BackupFile -PathType Leaf)) {
        Write-Fail "Backup file not found: $BackupFile"
        exit 1
    }

    Write-Warn "This imports $BackupFile into $DbName."
    if (-not (Confirm-Action "Restore $DbName on ${DbHost}:${DbPort}?")) {
        Write-Host 'Cancelled.'
        return
    }

    $createDb = "CREATE DATABASE IF NOT EXISTS ``$DbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    if (-not (Invoke-MySqlQuery $createDb)) {
        Write-Fail 'Could not create/check database.'
        exit 1
    }

    Import-SqlFile $BackupFile | Out-Null
    if ($script:Failures -gt 0) {
        exit 1
    }

    Write-Ok 'Database restore completed.'
}

function Invoke-PrePush {
    Invoke-Verify
    Write-Section 'Git status'
    git status -sb
}

switch ($Command) {
    'help' { Show-Help }
    'setup' { Invoke-Setup }
    'dev' { Invoke-Dev }
    'verify' { Invoke-Verify }
    'pre-push' { Invoke-PrePush }
    'db-reset' { Invoke-DbReset }
    'db-backup' { Invoke-DbBackup }
    'db-restore' { Invoke-DbRestore }
}
