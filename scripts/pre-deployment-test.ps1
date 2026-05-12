# RENTEASE Pre-Deployment Test Script
# Comprehensive testing before deployment

param(
    [string]$BackendUrl = "http://localhost:8080",
    [string]$FrontendUrl = "http://localhost:5173"
)

$ErrorActionPreference = "Continue"
$script:TestResults = @()

function Add-TestResult {
    param(
        [string]$Category,
        [string]$Test,
        [bool]$Passed,
        [string]$Message = ""
    )
    
    $script:TestResults += [PSCustomObject]@{
        Category = $Category
        Test = $Test
        Passed = $Passed
        Message = $Message
    }
    
    $status = if ($Passed) { "PASS" } else { "FAIL" }
    $color = if ($Passed) { "Green" } else { "Red" }
    
    Write-Host "[$status] " -ForegroundColor $color -NoNewline
    Write-Host "$Category - $Test" -ForegroundColor White
    if ($Message) {
        Write-Host "      $Message" -ForegroundColor Gray
    }
}

function Test-ApiEndpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = @{},
        [int]$ExpectedStatus = 200
    )
    
    $params = @{
        Uri = $Url
        Method = $Method
        UseBasicParsing = $true
        ErrorAction = "Stop"
        TimeoutSec = 15
    }

    if ($Method -eq "POST") {
        $params.Body = ($Body | ConvertTo-Json)
        $params.ContentType = "application/json"
    }

    try {
        $response = Invoke-WebRequest @params
        $statusCode = [int]$response.StatusCode

        return @{
            Success = ($statusCode -eq $ExpectedStatus)
            StatusCode = $statusCode
            Content = $response.Content
        }
    } catch {
        $response = $_.Exception.Response
        $statusCode = 0
        $content = $_.Exception.Message

        if ($response) {
            $statusCode = [int]$response.StatusCode
            try {
                $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
                $content = $reader.ReadToEnd()
            } catch {
                $content = $_.Exception.Message
            }
        }

        return @{
            Success = ($statusCode -eq $ExpectedStatus)
            StatusCode = $statusCode
            Content = $content
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RENTEASE PRE-DEPLOYMENT TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. BACKEND API TESTS
Write-Host "1. BACKEND API TESTS" -ForegroundColor Yellow
Write-Host ""

# Test health endpoint
$result = Test-ApiEndpoint -Url "$BackendUrl/auth.php?action=me" -ExpectedStatus 401
Add-TestResult "Backend" "Health endpoint accessible" $result.Success $result.Content

# Test login endpoint structure
$result = Test-ApiEndpoint -Url "$BackendUrl/auth.php?action=login" -Method "POST" -Body @{} -ExpectedStatus 400
Add-TestResult "Backend" "Login endpoint responds" $result.Success

# Test users endpoint (should require auth)
$result = Test-ApiEndpoint -Url "$BackendUrl/users.php" -ExpectedStatus 401
Add-TestResult "Backend" "Users endpoint protected" $result.Success

# Test rooms endpoint
$result = Test-ApiEndpoint -Url "$BackendUrl/rooms.php"
Add-TestResult "Backend" "Rooms endpoint accessible" ($result.StatusCode -in @(200, 401))

# Test boarding house endpoint
$result = Test-ApiEndpoint -Url "$BackendUrl/boarding_house.php"
Add-TestResult "Backend" "Boarding house endpoint accessible" ($result.StatusCode -in @(200, 401))

# Test reservations endpoint
$result = Test-ApiEndpoint -Url "$BackendUrl/reservations.php" -ExpectedStatus 401
Add-TestResult "Backend" "Reservations endpoint protected" $result.Success

# Test payments endpoint
$result = Test-ApiEndpoint -Url "$BackendUrl/payments.php" -ExpectedStatus 401
Add-TestResult "Backend" "Payments endpoint protected" $result.Success

# Test feedback endpoint
$result = Test-ApiEndpoint -Url "$BackendUrl/feedback.php"
Add-TestResult "Backend" "Feedback endpoint accessible" ($result.StatusCode -in @(200, 401))

# Test reports endpoint
$result = Test-ApiEndpoint -Url "$BackendUrl/reports.php" -ExpectedStatus 401
Add-TestResult "Backend" "Reports endpoint protected" $result.Success

# Test activity logs endpoint
$result = Test-ApiEndpoint -Url "$BackendUrl/activity_logs.php" -ExpectedStatus 401
Add-TestResult "Backend" "Activity logs endpoint protected" $result.Success

# Test error logs endpoint
$result = Test-ApiEndpoint -Url "$BackendUrl/error_logs.php" -ExpectedStatus 401
Add-TestResult "Backend" "Error logs endpoint protected" $result.Success

# Test uploads endpoint
$result = Test-ApiEndpoint -Url "$BackendUrl/uploads.php" -ExpectedStatus 401
Add-TestResult "Backend" "Uploads endpoint protected" $result.Success

# Test account links endpoint
$result = Test-ApiEndpoint -Url "$BackendUrl/account_links.php" -ExpectedStatus 401
Add-TestResult "Backend" "Account links endpoint protected" $result.Success

Write-Host ""

# 2. AUTHENTICATION TESTS
Write-Host "2. AUTHENTICATION TESTS" -ForegroundColor Yellow
Write-Host ""

# Test login with invalid credentials
$result = Test-ApiEndpoint -Url "$BackendUrl/auth.php?action=login" -Method "POST" -Body @{
    email = "invalid@test.com"
    password = "wrongpassword"
    role = "seeker"
} -ExpectedStatus 401
Add-TestResult "Auth" "Invalid login rejected" $result.Success

# Test login with missing fields
$result = Test-ApiEndpoint -Url "$BackendUrl/auth.php?action=login" -Method "POST" -Body @{
    email = "test@test.com"
} -ExpectedStatus 400
Add-TestResult "Auth" "Missing fields validation" $result.Success

# Test registration with invalid email
$result = Test-ApiEndpoint -Url "$BackendUrl/auth.php?action=register" -Method "POST" -Body @{
    full_name = "Test User"
    email = "invalid-email"
    password = "Test123!"
    role = "seeker"
} -ExpectedStatus 400
Add-TestResult "Auth" "Email validation works" $result.Success

# Test registration with short password
$result = Test-ApiEndpoint -Url "$BackendUrl/auth.php?action=register" -Method "POST" -Body @{
    full_name = "Test User"
    email = "test@test.com"
    password = "short"
    role = "seeker"
} -ExpectedStatus 400
Add-TestResult "Auth" "Password length validation" $result.Success

Write-Host ""

# 3. SECURITY TESTS
Write-Host "3. SECURITY TESTS" -ForegroundColor Yellow
Write-Host ""

# Test CORS headers
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/auth.php?action=me" -Method OPTIONS -UseBasicParsing
    $hasCors = $response.Headers["Access-Control-Allow-Methods"] -ne $null
    Add-TestResult "Security" "CORS headers present" $hasCors
} catch {
    Add-TestResult "Security" "CORS headers present" $false
}

# Test security headers
$securityResponse = $null
try {
    $securityResponse = Invoke-WebRequest -Uri "$BackendUrl/auth.php?action=me" -UseBasicParsing -ErrorAction Stop
} catch {
    $securityResponse = $_.Exception.Response
}

if ($securityResponse) {
    $hasXContentType = $securityResponse.Headers["X-Content-Type-Options"] -eq "nosniff"
    $hasXFrame = $securityResponse.Headers["X-Frame-Options"] -eq "DENY"

    Add-TestResult "Security" "X-Content-Type-Options header" $hasXContentType
    Add-TestResult "Security" "X-Frame-Options header" $hasXFrame
} else {
    Add-TestResult "Security" "Security headers" $false
}

# Test SQL injection prevention (should not cause error)
$result = Test-ApiEndpoint -Url "$BackendUrl/auth.php?action=login" -Method "POST" -Body @{
    email = "admin' OR '1'='1"
    password = "password"
    role = "seeker"
} -ExpectedStatus 401
Add-TestResult "Security" "SQL injection prevention" $result.Success

Write-Host ""

# 4. FRONTEND TESTS
Write-Host "4. FRONTEND TESTS" -ForegroundColor Yellow
Write-Host ""

# Test frontend accessibility
try {
    $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 5
    Add-TestResult "Frontend" "Landing page accessible" ($response.StatusCode -eq 200)
} catch {
    Add-TestResult "Frontend" "Landing page accessible" $false "Cannot reach $FrontendUrl"
}

# Test frontend routes (should all return 200 with SPA)
$routes = @("/login", "/register", "/seeker/dashboard", "/owner/dashboard", "/admin/dashboard")
foreach ($route in $routes) {
    try {
        $response = Invoke-WebRequest -Uri "$FrontendUrl$route" -UseBasicParsing -TimeoutSec 5
        Add-TestResult "Frontend" "Route $route" ($response.StatusCode -eq 200)
    } catch {
        Add-TestResult "Frontend" "Route $route" $false
    }
}

Write-Host ""

# 5. FILE STRUCTURE TESTS
Write-Host "5. FILE STRUCTURE TESTS" -ForegroundColor Yellow
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot

# Check backend files
$backendFiles = @(
    "backend\config.php",
    "backend\helpers.php",
    "backend\index.php",
    "backend\auth.php",
    "backend\users.php",
    "backend\boarding_house.php",
    "backend\rooms.php",
    "backend\reservations.php",
    "backend\payments.php",
    "backend\feedback.php",
    "backend\reports.php",
    "backend\activity_logs.php",
    "backend\error_logs.php",
    "backend\uploads.php",
    "backend\account_links.php"
)

foreach ($file in $backendFiles) {
    $path = Join-Path $projectRoot $file
    $exists = Test-Path $path
    Add-TestResult "Files" "Backend: $file" $exists
}

# Check frontend files
$frontendFiles = @(
    "frontend\package.json",
    "frontend\vite.config.js",
    "frontend\src\main.jsx",
    "frontend\src\App.jsx"
)

foreach ($file in $frontendFiles) {
    $path = Join-Path $projectRoot $file
    $exists = Test-Path $path
    Add-TestResult "Files" "Frontend: $file" $exists
}

# Check database files
$databaseFiles = @(
    "database\rentease_base_schema.sql",
    "database\staging_seed.sql",
    "database\phase8_uploads_schema.sql",
    "database\phase10_parent_seeker_links_schema.sql"
)

foreach ($file in $databaseFiles) {
    $path = Join-Path $projectRoot $file
    $exists = Test-Path $path
    Add-TestResult "Files" "Database: $file" $exists
}

Write-Host ""

# 6. GENERATE REPORT
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = $script:TestResults.Count
$passedTests = ($script:TestResults | Where-Object { $_.Passed }).Count
$failedTests = $totalTests - $passedTests
$passRate = [math]::Round(($passedTests / $totalTests) * 100, 2)

Write-Host "Total Tests:  $totalTests" -ForegroundColor White
Write-Host "Passed:       " -NoNewline
Write-Host "$passedTests" -ForegroundColor Green
Write-Host "Failed:       " -NoNewline
Write-Host "$failedTests" -ForegroundColor Red
Write-Host "Pass Rate:    " -NoNewline
Write-Host "$passRate%" -ForegroundColor $(if ($passRate -ge 90) { "Green" } elseif ($passRate -ge 70) { "Yellow" } else { "Red" })
Write-Host ""

# Group failures by category
$failures = $script:TestResults | Where-Object { -not $_.Passed } | Group-Object Category

if ($failures) {
    Write-Host "FAILURES BY CATEGORY:" -ForegroundColor Red
    Write-Host ""
    foreach ($group in $failures) {
        Write-Host "  $($group.Name): $($group.Count) failure(s)" -ForegroundColor Yellow
        foreach ($test in $group.Group) {
            Write-Host "    - $($test.Test)" -ForegroundColor Gray
            if ($test.Message) {
                Write-Host "      $($test.Message)" -ForegroundColor DarkGray
            }
        }
    }
    Write-Host ""
}

# Final verdict
if ($passRate -ge 95) {
    Write-Host "VERDICT: " -NoNewline
    Write-Host "READY FOR DEPLOYMENT" -ForegroundColor Green
    Write-Host ""
    Write-Host "System is fully functional and ready for production deployment." -ForegroundColor White
    Write-Host "Review PRODUCTION_DEPLOYMENT.md for deployment steps." -ForegroundColor Gray
    exit 0
} elseif ($passRate -ge 80) {
    Write-Host "VERDICT: " -NoNewline
    Write-Host "MOSTLY READY - REVIEW FAILURES" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "System is mostly functional but has some issues." -ForegroundColor White
    Write-Host "Review and fix failures before deploying to production." -ForegroundColor Gray
    exit 1
} else {
    Write-Host "VERDICT: " -NoNewline
    Write-Host "NOT READY - CRITICAL ISSUES" -ForegroundColor Red
    Write-Host ""
    Write-Host "System has critical issues that must be fixed." -ForegroundColor White
    Write-Host "Do not deploy until all critical failures are resolved." -ForegroundColor Gray
    exit 1
}
