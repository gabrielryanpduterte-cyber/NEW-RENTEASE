param(
    [switch]$Detached,
    [switch]$ResetDatabase,
    [switch]$NoBuild,
    [switch]$Stop
)

$ErrorActionPreference = 'Stop'
if (Get-Variable PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

function Write-Step($Message) {
    Write-Host ""
    Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Write-Ok($Message) {
    Write-Host "[OK] $Message" -ForegroundColor Green
}

if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker was not found. Install Docker Desktop, start it, then rerun this script."
}

function Test-DockerEngine {
    try {
        & docker info *> $null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

if (!(Test-DockerEngine)) {
    Write-Step "Docker engine is not running"
    $dockerDesktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
    if (Test-Path -LiteralPath $dockerDesktop) {
        Write-Host "Starting Docker Desktop..."
        Start-Process -FilePath $dockerDesktop -WindowStyle Hidden | Out-Null

        $ready = $false
        for ($i = 1; $i -le 60; $i++) {
            Start-Sleep -Seconds 2
            if (Test-DockerEngine) {
                $ready = $true
                break
            }
            Write-Host "Waiting for Docker engine... ($i/60)"
        }

        if (!$ready) {
            throw "Docker Desktop started, but the Docker engine did not become ready. Open Docker Desktop and check its status."
        }
    } else {
        throw "Docker engine is not running. Start Docker Desktop, then rerun this script."
    }
}

$composeVersion = docker compose version 2>$null
if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose was not found. Install or update Docker Desktop."
}

if ($Stop) {
    Write-Step "Stopping RentEase Docker services"
    docker compose down
    exit $LASTEXITCODE
}

if ($ResetDatabase) {
    Write-Step "Resetting Docker database volume"
    docker compose down -v
}

Write-Step "Starting RentEase Docker services"
$args = @('compose', 'up')
if (!$NoBuild) {
    $args += '--build'
}
if ($Detached) {
    $args += '-d'
}

& docker @args
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Ok "RentEase Docker services started."
Write-Host ""
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:8080/ping.php"
Write-Host "MySQL:    localhost:3308, database=rentease_db, user=rentease, password=rentease"
Write-Host ""
Write-Host "Reset database later:"
Write-Host "  .\scripts\docker-dev.ps1 -ResetDatabase"
Write-Host ""
Write-Host "Stop services:"
Write-Host "  .\scripts\docker-dev.ps1 -Stop"
