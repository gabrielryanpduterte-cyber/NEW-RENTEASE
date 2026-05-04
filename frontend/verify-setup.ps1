# Shadcn/ui Implementation Verification Script

Write-Host ""
Write-Host "SHADCN/UI IMPLEMENTATION VERIFICATION" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check configuration files
Write-Host "Checking Configuration Files..." -ForegroundColor Yellow
$configFiles = @("tailwind.config.js", "postcss.config.js", "components.json", "vite.config.js")

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $file" -ForegroundColor Red
        $allGood = $false
    }
}

# Check UI components
Write-Host ""
Write-Host "Checking UI Components..." -ForegroundColor Yellow
$components = @(
    "src\components\ui\Button-new.jsx",
    "src\components\ui\Card-new.jsx",
    "src\components\ui\Input.jsx",
    "src\components\ui\Badge.jsx",
    "src\components\ui\Label.jsx"
)

foreach ($component in $components) {
    if (Test-Path $component) {
        Write-Host "  OK: $component" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $component" -ForegroundColor Red
        $allGood = $false
    }
}

# Check CSS files
Write-Host ""
Write-Host "Checking CSS Files..." -ForegroundColor Yellow
if (Test-Path "src\index-new.css") {
    Write-Host "  OK: src\index-new.css" -ForegroundColor Green
} else {
    Write-Host "  MISSING: src\index-new.css" -ForegroundColor Red
    $allGood = $false
}

# Check example page
Write-Host ""
Write-Host "Checking Example Pages..." -ForegroundColor Yellow
if (Test-Path "src\pages\ComponentShowcase.jsx") {
    Write-Host "  OK: src\pages\ComponentShowcase.jsx" -ForegroundColor Green
} else {
    Write-Host "  MISSING: src\pages\ComponentShowcase.jsx" -ForegroundColor Red
    $allGood = $false
}

# Check dependencies
Write-Host ""
Write-Host "Checking Dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules\tailwindcss") {
    Write-Host "  OK: Tailwind CSS installed" -ForegroundColor Green
} else {
    Write-Host "  NOT INSTALLED: Tailwind CSS" -ForegroundColor Yellow
}

if (Test-Path "node_modules\class-variance-authority") {
    Write-Host "  OK: class-variance-authority installed" -ForegroundColor Green
} else {
    Write-Host "  NOT INSTALLED: class-variance-authority" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "ALL FILES VERIFIED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Install dependencies (if not installed)" -ForegroundColor White
    Write-Host "2. Replace CSS file" -ForegroundColor White
    Write-Host "3. Start dev server: npm run dev" -ForegroundColor White
    Write-Host "4. Visit: http://localhost:5173/showcase" -ForegroundColor White
} else {
    Write-Host "SOME FILES ARE MISSING!" -ForegroundColor Red
    Write-Host "Please check the missing files above." -ForegroundColor Yellow
}

Write-Host ""
