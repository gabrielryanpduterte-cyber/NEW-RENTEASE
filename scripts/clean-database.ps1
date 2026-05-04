# Quick Database Cleanup Script
# Removes test users but keeps demo accounts

param(
    [switch]$FullReset,
    [switch]$Help
)

$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
$dbName = "rentease_db"
$user = "root"
$scriptPath = "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\database"

if ($Help) {
    Write-Host ""
    Write-Host "Database Cleanup Script" -ForegroundColor Cyan
    Write-Host "======================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\clean-database.ps1           # Remove test users only"
    Write-Host "  .\clean-database.ps1 -FullReset # Reset entire database"
    Write-Host "  .\clean-database.ps1 -Help      # Show this help"
    Write-Host ""
    Write-Host "What it does:" -ForegroundColor Yellow
    Write-Host "  - Removes all test users (keeps demo accounts)"
    Write-Host "  - Preserves: admin, owner, seeker, parent accounts"
    Write-Host "  - Clears: verification tokens, reset tokens"
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "Database Cleanup" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
Write-Host ""

if ($FullReset) {
    Write-Host "⚠️  FULL RESET MODE" -ForegroundColor Red
    Write-Host "This will reset the entire database!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure? (yes/no)"
    
    if ($confirm -ne "yes") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host ""
    Write-Host "Resetting database..." -ForegroundColor Yellow
    
    # Run base schema
    & $mysqlPath -u $user $dbName -e "SOURCE $scriptPath/rentease_final_phase7.sql"
    
    # Run Phase 11 migration
    & $mysqlPath -u $user $dbName -e "SOURCE $scriptPath/phase11_email_verification_schema.sql"
    
    Write-Host "✅ Database reset complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Demo accounts restored:" -ForegroundColor Cyan
    Write-Host "  - admin@rentease.local / password" -ForegroundColor White
    Write-Host "  - owner@rentease.local / password" -ForegroundColor White
    Write-Host "  - seeker@rentease.local / password" -ForegroundColor White
    Write-Host "  - parent@rentease.local / password" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "Cleaning test data..." -ForegroundColor Yellow
    
    # Show current test users
    Write-Host ""
    Write-Host "Current test users:" -ForegroundColor Cyan
    & $mysqlPath -u $user $dbName -e "SELECT user_id, email, role, email_verified FROM users WHERE email NOT IN ('admin@rentease.local', 'owner@rentease.local', 'seeker@rentease.local', 'parent@rentease.local') ORDER BY created_at DESC;"
    
    # Run cleanup script
    & $mysqlPath -u $user $dbName -e "SOURCE $scriptPath/clean_test_data.sql"
    
    Write-Host ""
    Write-Host "✅ Cleanup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Remaining users:" -ForegroundColor Cyan
    & $mysqlPath -u $user $dbName -e "SELECT user_id, email, role, email_verified FROM users ORDER BY user_id;"
    Write-Host ""
}

Write-Host "Ready for fresh testing! 🚀" -ForegroundColor Green
Write-Host ""
