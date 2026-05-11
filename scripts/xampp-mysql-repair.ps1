param(
    [string]$XamppRoot = 'C:\xampp',
    [int]$Port = 0,
    [switch]$Start
)

$ErrorActionPreference = 'Stop'

function Write-Step($Message) {
    Write-Host "[RentEase MySQL Repair] $Message" -ForegroundColor Cyan
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

$mysqlRoot = Join-Path $XamppRoot 'mysql'
$mysqlBin = Join-Path $mysqlRoot 'bin'
$mysqlData = Join-Path $mysqlRoot 'data'
$mysqlSystemDb = Join-Path $mysqlData 'mysql'
$mysqlExe = Join-Path $mysqlBin 'mysql.exe'
$mysqlAdminExe = Join-Path $mysqlBin 'mysqladmin.exe'
$mysqldExe = Join-Path $mysqlBin 'mysqld.exe'
$ariaChkExe = Join-Path $mysqlBin 'aria_chk.exe'
$myIni = Join-Path $mysqlBin 'my.ini'

foreach ($path in @($mysqlExe, $mysqlAdminExe, $mysqldExe, $ariaChkExe, $myIni, $mysqlSystemDb)) {
    if (!(Test-Path -LiteralPath $path)) {
        throw "Required XAMPP MySQL path not found: $path"
    }
}

if ($Port -le 0) {
    $Port = Get-MysqldPort $myIni
}

Write-Step "Checking MySQL on port $Port"
$ping = & $mysqlAdminExe -u root --protocol=tcp --port=$Port ping 2>$null
if ($LASTEXITCODE -eq 0 -and ($ping -join "`n") -match 'alive') {
    Write-Ok "MySQL is already running on port $Port."
    exit 0
}

Write-Warn "MySQL is not accepting connections on port $Port."

$running = Get-Process mysqld -ErrorAction SilentlyContinue
if ($running) {
    Write-Step "Stopping existing mysqld process before repair"
    $running | Stop-Process -Force
    Start-Sleep -Seconds 2
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupDir = Join-Path $mysqlData "repair_backup_$stamp"
New-Item -ItemType Directory -Path $backupDir | Out-Null

Write-Step "Backing up affected MySQL system files to $backupDir"
$backupFiles = @(
    (Join-Path $mysqlSystemDb 'db.frm'),
    (Join-Path $mysqlSystemDb 'db.MAD'),
    (Join-Path $mysqlSystemDb 'db.MAI'),
    (Join-Path $mysqlData 'aria_log_control'),
    (Join-Path $mysqlData 'mysql_error.log')
)

$backupFiles += Get-ChildItem -LiteralPath $mysqlData -Filter 'aria_log*' -File -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty FullName

foreach ($file in $backupFiles) {
    if (Test-Path -LiteralPath $file) {
        Copy-Item -LiteralPath $file -Destination $backupDir -Force
    }
}

$dbIndex = Join-Path $mysqlSystemDb 'db.MAI'
Write-Step "Repairing crashed MariaDB privilege table mysql.db"
& $ariaChkExe --recover --force $dbIndex
if ($LASTEXITCODE -ne 0) {
    Write-Warn "aria_chk returned exit code $LASTEXITCODE. Review the output above."
}

if ($Start) {
    Write-Step "Starting mysqld with $myIni"
    Start-Process -FilePath $mysqldExe `
        -ArgumentList "--defaults-file=$myIni", '--standalone' `
        -WorkingDirectory $mysqlBin `
        -WindowStyle Hidden | Out-Null

    Start-Sleep -Seconds 5
    $ping = & $mysqlAdminExe -u root --protocol=tcp --port=$Port ping 2>$null
    if ($LASTEXITCODE -eq 0 -and ($ping -join "`n") -match 'alive') {
        Write-Ok "MySQL repaired and running on port $Port."
        exit 0
    }

    Write-Warn "Repair ran, but MySQL still did not answer on port $Port."
    Write-Host "Check: $mysqlData\mysql_error.log" -ForegroundColor Yellow
    exit 1
}

Write-Ok "Repair finished. Start MySQL from XAMPP Control Panel or rerun with -Start."
