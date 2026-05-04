# Shadcn/ui Installation Script for RentEase
# Run this in PowerShell from the frontend directory

Write-Host "🚀 Installing Shadcn/ui for RentEase..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the frontend directory:" -ForegroundColor Yellow
    Write-Host "cd 'C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\frontend'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Step 1: Installing Tailwind CSS..." -ForegroundColor Green
npm install -D tailwindcss postcss autoprefixer

Write-Host ""
Write-Host "📦 Step 2: Installing utility dependencies..." -ForegroundColor Green
npm install class-variance-authority

Write-Host ""
Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

# Backup old CSS
Write-Host "💾 Step 3: Backing up old CSS..." -ForegroundColor Green
if (Test-Path "src\index.css") {
    Copy-Item "src\index.css" "src\index-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').css"
    Write-Host "✅ Backup created!" -ForegroundColor Green
}

# Replace CSS
Write-Host ""
Write-Host "🎨 Step 4: Installing new CSS..." -ForegroundColor Green
if (Test-Path "src\index-new.css") {
    Copy-Item "src\index-new.css" "src\index.css" -Force
    Write-Host "✅ New CSS installed!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: src\index-new.css not found. Skipping CSS replacement." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Installation Complete! ✨" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start the dev server: npm run dev" -ForegroundColor White
Write-Host "2. Visit: http://localhost:5173" -ForegroundColor White
Write-Host "3. Test the showcase: http://localhost:5173/showcase" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "- Read: SHADCN_IMPLEMENTATION_GUIDE.md" -ForegroundColor White
Write-Host "- Read: MINIMALIST_DESIGN_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "🎨 Happy coding! 🚀" -ForegroundColor Cyan
