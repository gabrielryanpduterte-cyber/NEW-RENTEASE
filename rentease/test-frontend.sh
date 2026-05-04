#!/bin/bash
echo "Testing RentEase Frontend..."
echo ""
echo "Checking dependencies..."
cd rentease/frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Run: npm install"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""
echo "Checking file structure..."

# Check critical files
files=(
    "src/lib/utils.js"
    "src/components/ui/Card.jsx"
    "src/components/ui/Button.jsx"
    "src/components/ui/PropertyCard.jsx"
    "src/components/ui/SearchFilters.jsx"
    "src/components/ui/ImageUpload.jsx"
    "src/pages/PropertyBrowsePage.jsx"
    "src/pages/AddPropertyPage.jsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "Run 'npm run dev' to start the development server"
