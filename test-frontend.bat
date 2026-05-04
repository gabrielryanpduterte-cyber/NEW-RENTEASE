@echo off
echo Testing RentEase Frontend...
echo.
echo Checking dependencies...
cd rentease\frontend

if not exist "node_modules\" (
    echo X node_modules not found. Run: npm install
    exit /b 1
)

echo + Dependencies installed
echo.
echo Checking file structure...

set files=src\lib\utils.js src\components\ui\Card.jsx src\components\ui\Button.jsx src\components\ui\PropertyCard.jsx src\components\ui\SearchFilters.jsx src\components\ui\ImageUpload.jsx src\pages\PropertyBrowsePage.jsx src\pages\AddPropertyPage.jsx

for %%f in (%files%) do (
    if exist "%%f" (
        echo + %%f
    ) else (
        echo X %%f missing
    )
)

echo.
echo Run 'npm run dev' to start the development server
pause
