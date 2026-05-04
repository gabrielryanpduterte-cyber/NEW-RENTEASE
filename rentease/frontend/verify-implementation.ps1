# Shadcn/ui Implementation Verification Script
# Run this to verify all files are in place before installation

Write-Host ""
Write-Host "🔍 SHADCN/UI IMPLEMENTATION VERIFICATION" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check configuration files
Write-Host "📋 Checking Configuration Files..." -ForegroundColor Yellow
$configFiles = @(
    "tailwind.config.js",
    "postcss.config.js",
    "components.json",
    "vite.config.js"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - MISSING!" -ForegroundColor Red
        $allGood = $false
    }
}

# Check UI components
Write-Host ""
Write-Host "🎨 Checking UI Components..." -ForegroundColor Yellow
$components = @(
    "src\components\ui\Button-new.jsx",
    "src\components\ui\Card-new.jsx",
    "src\components\ui\Input.jsx",
    "src\components\ui\Badge.jsx",
    "src\components\ui\Label.jsx"
)

foreach ($component in $components) {
    if (Test-Path $component) {
        Write-Host "  ✅ $component" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $component - MISSING!" -ForegroundColor Red
        $allGood = $false
    }
}

# Check CSS files
Write-Host ""
Write-Host "🎨 Checking CSS Files..." -ForegroundColor Yellow
if (Test-Path "src\index-new.css") {
    Write-Host "  ✅ src\index-new.css" -ForegroundColor Green
} else {
    Write-Host "  ❌ src\index-new.css - MISSING!" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path "src\index.css") {
    Write-Host "  ✅ src\index.css (original)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  src\index.css - Not found (will be created)" -ForegroundColor Yellow
}

# Check example page
Write-Host ""
Write-Host "📄 Checking Example Pages..." -ForegroundColor Yellow
if (Test-Path "src\pages\ComponentShowcase.jsx") {
    Write-Host "  ✅ src\pages\ComponentShowcase.jsx" -ForegroundColor Green
} else {
    Write-Host "  ❌ src\pages\ComponentShowcase.jsx - MISSING!" -ForegroundColor Red
    $allGood = $false
}

# Check installation script
Write-Host ""
Write-Host "⚙️  Checking Installation Script..." -ForegroundColor Yellow
if (Test-Path "install-shadcn.ps1") {
    Write-Host "  ✅ install-shadcn.ps1" -ForegroundColor Green
} else {
    Write-Host "  ❌ install-shadcn.ps1 - MISSING!" -ForegroundColor Red
    $allGood = $false
}

# Check package.json
Write-Host ""
Write-Host "📦 Checking Package Files..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "  ✅ package.json" -ForegroundColor Green
    
    # Check if dependencies are installed
    if (Test-Path "node_modules") {
        Write-Host "  ✅ node_modules exists" -ForegroundColor Green
        
        # Check for Tailwind
        if (Test-Path "node_modules\tailwindcss") {
            Write-Host "  ✅ Tailwind CSS already installed" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Tailwind CSS not installed yet" -ForegroundColor Yellow
        }
        
        # Check for CVA
        if (Test-Path "node_modules\class-variance-authority") {
            Write-Host "  ✅ class-variance-authority already installed" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  class-variance-authority not installed yet" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  node_modules not found - run npm install" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ package.json - MISSING!" -ForegroundColor Red
    $allGood = $false
}

# Summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✅ ALL FILES VERIFIED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Run: .\install-shadcn.ps1" -ForegroundColor White
    Write-Host "   OR manually install dependencies:" -ForegroundColor White
    Write-Host "   npm install -D tailwindcss postcss autoprefixer" -ForegroundColor Gray
    Write-Host "   npm install class-variance-authority" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Replace CSS file:" -ForegroundColor White
    Write-Host "   Rename-Item 'src\index.css' 'src\index-old.css'" -ForegroundColor Gray
    Write-Host "   Rename-Item 'src\index-new.css' 'src\index.css'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Start dev server:" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Visit: http://localhost:5173/showcase" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ SOME FILES ARE MISSING!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the missing files above." -ForegroundColor Yellow
    Write-Host "You may need to re-run the implementation." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "- IMPLEMENTATION_COMPLETE.md" -ForegroundColor White
Write-Host "- QUICK_START_SHADCN.md" -ForegroundColor White
Write-Host "- SHADCN_IMPLEMENTATION_GUIDE.md" -ForegroundColor White
Write-Host ""
