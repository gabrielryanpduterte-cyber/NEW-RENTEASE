# RENTEASE Quick Fix Script
# Fixes ERR_CONNECTION_RESET and optimizes system

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RENTEASE QUICK FIX & OPTIMIZATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot | Split-Path

# 1. CHECK XAMPP STATUS
Write-Host "1. Checking XAMPP services..." -ForegroundColor Yellow

$apacheRunning = Get-Process -Name httpd -ErrorAction SilentlyContinue
$mysqlRunning = Get-Process -Name mysqld -ErrorAction SilentlyContinue

if ($apacheRunning) {
    Write-Host "   [OK] Apache is running" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Apache is NOT running" -ForegroundColor Red
    Write-Host "   Please start Apache in XAMPP Control Panel" -ForegroundColor Yellow
}

if ($mysqlRunning) {
    Write-Host "   [OK] MySQL is running" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] MySQL is NOT running" -ForegroundColor Red
    Write-Host "   Please start MySQL in XAMPP Control Panel" -ForegroundColor Yellow
}

Write-Host ""

# 2. TEST BACKEND CONNECTION
Write-Host "2. Testing backend connection..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost/rentease/backend/auth.php?action=me" -UseBasicParsing -TimeoutSec 5
    Write-Host "   [OK] Backend is accessible" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "   [ERROR] Cannot reach backend" -ForegroundColor Red
    Write-Host "   URL: http://localhost/rentease/backend/auth.php?action=me" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# 3. CHECK FRONTEND PORT
Write-Host "3. Checking frontend port..." -ForegroundColor Yellow

$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
$port5174 = Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue

if ($port5173) {
    Write-Host "   [INFO] Port 5173 is in use" -ForegroundColor Cyan
    Write-Host "   Process: $((Get-Process -Id $port5173[0].OwningProcess).ProcessName)" -ForegroundColor Gray
}

if ($port5174) {
    Write-Host "   [INFO] Port 5174 is in use" -ForegroundColor Cyan
    Write-Host "   Process: $((Get-Process -Id $port5174[0].OwningProcess).ProcessName)" -ForegroundColor Gray
}

if (-not $port5173 -and -not $port5174) {
    Write-Host "   [OK] Ports 5173 and 5174 are available" -ForegroundColor Green
}

Write-Host ""

# 4. KILL STUCK VITE PROCESSES
Write-Host "4. Cleaning up stuck processes..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Gray
    $response = Read-Host "   Kill all Node.js processes? (y/n)"
    if ($response -eq 'y') {
        $nodeProcesses | Stop-Process -Force
        Write-Host "   [OK] Processes killed" -ForegroundColor Green
    }
} else {
    Write-Host "   [OK] No stuck processes found" -ForegroundColor Green
}

Write-Host ""

# 5. APPLY OPTIMIZATIONS
Write-Host "5. Applying optimizations..." -ForegroundColor Yellow

$backendConfig = Join-Path $projectRoot "backend\config.php"
$optimizedConfig = Join-Path $projectRoot "backend\config-optimized.php"

if (Test-Path $optimizedConfig) {
    $response = Read-Host "   Apply optimized backend config? (y/n)"
    if ($response -eq 'y') {
        Copy-Item $backendConfig "$backendConfig.backup" -Force
        Copy-Item $optimizedConfig $backendConfig -Force
        Write-Host "   [OK] Optimized config applied" -ForegroundColor Green
        Write-Host "   Backup saved: config.php.backup" -ForegroundColor Gray
    }
}

Write-Host ""

# 6. OPTIMIZE DATABASE
Write-Host "6. Database optimization..." -ForegroundColor Yellow

$optimizeScript = Join-Path $projectRoot "database\optimize_database.sql"

if (Test-Path $optimizeScript) {
    $response = Read-Host "   Run database optimization? (y/n)"
    if ($response -eq 'y') {
        $mysqlPath = "mysql"
        if (-not (Get-Command $mysqlPath -ErrorAction SilentlyContinue)) {
            $mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
        }
        
        if (Test-Path $mysqlPath) {
            Write-Host "   Running optimization script..." -ForegroundColor Gray
            $dbUser = Read-Host "   MySQL username (default: root)"
            if (-not $dbUser) { $dbUser = "root" }
            
            cmd /c "`"$mysqlPath`" -u $dbUser -p rentease_db < `"$optimizeScript`""
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   [OK] Database optimized" -ForegroundColor Green
            } else {
                Write-Host "   [WARN] Optimization had issues" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host ""

# 7. CLEAR CACHES
Write-Host "7. Clearing caches..." -ForegroundColor Yellow

$frontendPath = Join-Path $projectRoot "frontend"

if (Test-Path "$frontendPath\.vite") {
    Remove-Item "$frontendPath\.vite" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   [OK] Vite cache cleared" -ForegroundColor Green
}

if (Test-Path "$frontendPath\node_modules\.vite") {
    Remove-Item "$frontendPath\node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   [OK] Node modules cache cleared" -ForegroundColor Green
}

Write-Host ""

# 8. FINAL INSTRUCTIONS
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIX COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ensure XAMPP services are running:" -ForegroundColor White
Write-Host "   - Apache: " -NoNewline -ForegroundColor Gray
if ($apacheRunning) { Write-Host "RUNNING" -ForegroundColor Green } else { Write-Host "STOPPED - START IT!" -ForegroundColor Red }
Write-Host "   - MySQL:  " -NoNewline -ForegroundColor Gray
if ($mysqlRunning) { Write-Host "RUNNING" -ForegroundColor Green } else { Write-Host "STOPPED - START IT!" -ForegroundColor Red }
Write-Host ""
Write-Host "2. Start frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Open browser:" -ForegroundColor White
Write-Host "   http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Clear browser cache:" -ForegroundColor White
Write-Host "   Press Ctrl+Shift+Delete" -ForegroundColor Gray
Write-Host "   Clear cached images and files" -ForegroundColor Gray
Write-Host ""
Write-Host "If issues persist:" -ForegroundColor Yellow
Write-Host "   - Check SYSTEM_OPTIMIZATION.md for detailed guide" -ForegroundColor Gray
Write-Host "   - Run: .\scripts\verify-deployment.ps1" -ForegroundColor Gray
Write-Host ""
