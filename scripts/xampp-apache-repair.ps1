param(
    [string]$XamppRoot = 'C:\xampp',
    [int]$Port = 80,
    [switch]$Restart
)

$ErrorActionPreference = 'Stop'

function Write-Step($Message) {
    Write-Host "[RentEase Apache Repair] $Message" -ForegroundColor Cyan
}

function Write-Ok($Message) {
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn($Message) {
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

$apacheBin = Join-Path $XamppRoot 'apache\bin'
$httpdExe = Join-Path $apacheBin 'httpd.exe'
$errorLog = Join-Path $XamppRoot 'apache\logs\error.log'

if (!(Test-Path -LiteralPath $httpdExe)) {
    throw "XAMPP Apache was not found at $httpdExe. Install XAMPP or pass -XamppRoot."
}

Write-Step "Checking Apache config"
& $httpdExe -t
if ($LASTEXITCODE -ne 0) {
    throw "Apache config test failed. Check $errorLog."
}

$listeners = netstat -ano | Select-String -Pattern ":$Port\s+.*LISTENING"
$httpdProcesses = Get-Process httpd -ErrorAction SilentlyContinue

if ($listeners -and !$Restart) {
    Write-Ok "Something is already listening on port $Port."
    $listeners | ForEach-Object { Write-Host $_.Line }
    if ($httpdProcesses) {
        Write-Ok "Apache appears to be running."
        exit 0
    }

    Write-Warn "Port $Port is occupied by a non-Apache process. Stop that app or change Apache's Listen port."
    exit 1
}

if ($Restart -and $httpdProcesses) {
    Write-Step "Stopping existing Apache processes"
    $httpdProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Write-Step "Starting Apache"
Start-Process -FilePath $httpdExe `
    -ArgumentList '-d', (Join-Path $XamppRoot 'apache') `
    -WorkingDirectory $apacheBin `
    -WindowStyle Hidden | Out-Null

Start-Sleep -Seconds 3
$listeners = netstat -ano | Select-String -Pattern ":$Port\s+.*LISTENING"
if ($listeners) {
    Write-Ok "Apache is listening on port $Port."
    exit 0
}

Write-Warn "Apache did not start on port $Port."
if (Test-Path -LiteralPath $errorLog) {
    Get-Content -LiteralPath $errorLog -Tail 40
}
exit 1
