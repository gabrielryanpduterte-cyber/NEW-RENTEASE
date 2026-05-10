# RENTEASE Project Cleanup Script
# Removes duplicate and unnecessary files

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RENTEASE PROJECT CLEANUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot

# Files to remove
$filesToRemove = @(
    "frontend\src\pages\LoginPage-enhanced.jsx",
    "frontend\src\pages\ModernLoginPage.jsx",
    "frontend\src\pages\RegisterPage-enhanced.jsx",
    "frontend\src\index-old.css",
    "backend\test-google-auth.php"
)

Write-Host "Files to remove:" -ForegroundColor Yellow
foreach ($file in $filesToRemove) {
    $fullPath = Join-Path $projectRoot $file
    if (Test-Path $fullPath) {
        Write-Host "  [FOUND] $file" -ForegroundColor Gray
    } else {
        Write-Host "  [NOT FOUND] $file" -ForegroundColor DarkGray
    }
}

Write-Host ""
$confirm = Read-Host "Remove these files? (y/n)"

if ($confirm -eq 'y') {
    Write-Host ""
    Write-Host "Removing files..." -ForegroundColor Yellow
    
    foreach ($file in $filesToRemove) {
        $fullPath = Join-Path $projectRoot $file
        if (Test-Path $fullPath) {
            try {
                Remove-Item $fullPath -Force
                Write-Host "  [OK] Removed $file" -ForegroundColor Green
            } catch {
                Write-Host "  [ERROR] Failed to remove $file" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
    Write-Host "Cleanup complete!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Cleanup cancelled." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Read DEEP_ANALYSIS_REPORT.md" -ForegroundColor White
Write-Host "2. Read ACTION_PLAN.md" -ForegroundColor White
Write-Host "3. Run database optimization:" -ForegroundColor White
Write-Host "   mysql -u root -p rentease_db < database\optimize_database.sql" -ForegroundColor Gray
Write-Host ""
