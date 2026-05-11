param(
    [string]$BaseUrl = 'http://localhost:8080',
    [switch]$RunFrontendChecks
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
    Write-Host "[phase8-smoke] $Message"
}

function Parse-JsonOrNull([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $null
    }

    try {
        return ($Text | ConvertFrom-Json)
    } catch {
        return $null
    }
}

function Invoke-Api {
    param(
        [Parameter(Mandatory = $true)][string]$Endpoint,
        [Parameter(Mandatory = $true)][ValidateSet('GET', 'POST', 'PUT', 'PATCH', 'DELETE')][string]$Method,
        [Parameter(Mandatory = $true)][Microsoft.PowerShell.Commands.WebRequestSession]$Session,
        [object]$Body = $null
    )

    $uri = '{0}/{1}' -f $BaseUrl.TrimEnd('/'), $Endpoint.TrimStart('/')
    $request = @{
        Uri         = $uri
        Method      = $Method
        WebSession  = $Session
        UseBasicParsing = $true
        TimeoutSec  = 30
    }

    if ($Body -ne $null) {
        $request.ContentType = 'application/json'
        $request.Body = ($Body | ConvertTo-Json -Depth 8)
    }

    $statusCode = 0
    $content = ''
    try {
        $response = Invoke-WebRequest @request
        $statusCode = [int]$response.StatusCode
        $content = [string]$response.Content
    } catch {
        if ($_.Exception.Response) {
            $response = $_.Exception.Response
            $statusCode = [int]$response.StatusCode.value__
            $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
            $content = $reader.ReadToEnd()
        } else {
            throw
        }
    }

    return [PSCustomObject]@{
        Uri     = $uri
        Status  = $statusCode
        Json    = Parse-JsonOrNull -Text $content
        Raw     = $content
    }
}

function Assert-True {
    param(
        [Parameter(Mandatory = $true)][bool]$Condition,
        [Parameter(Mandatory = $true)][string]$Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

function Assert-ApiSuccess {
    param(
        [Parameter(Mandatory = $true)]$Response,
        [Parameter(Mandatory = $true)][string]$StepName
    )

    Assert-True -Condition ($Response.Status -ge 200 -and $Response.Status -lt 300) -Message "$StepName failed: HTTP $($Response.Status) ($($Response.Uri))"
    Assert-True -Condition ($null -ne $Response.Json) -Message "$StepName failed: response is not JSON ($($Response.Uri))"
    Assert-True -Condition ([bool]$Response.Json.success) -Message "$StepName failed: success=false ($($Response.Uri)) $($Response.Raw)"
}

$checks = @(
    [PSCustomObject]@{
        Label = 'Admin'
        Role = 'admin'
        LoginRole = 'seeker'
        Email = 'admin@rentease.test'
        Password = 'Admin@1234'
        Endpoints = @(
            'users.php',
            'reports.php',
            'activity_logs.php',
            'error_logs.php',
            'feedback.php',
            'uploads.php'
        )
    },
    [PSCustomObject]@{
        Label = 'Owner'
        Role = 'owner'
        LoginRole = 'owner'
        Email = 'landlord@rentease.test'
        Password = 'Owner@1234'
        Endpoints = @(
            'boarding_house.php',
            'rooms.php',
            'reservations.php',
            'payments.php',
            'reports.php',
            'uploads.php'
        )
    },
    [PSCustomObject]@{
        Label = 'Seeker'
        Role = 'seeker'
        LoginRole = 'seeker'
        Email = 'seeker1@rentease.test'
        Password = 'Seeker@1234'
        Endpoints = @(
            'rooms.php?availability_status=available',
            'reservations.php',
            'payments.php',
            'feedback.php',
            'uploads.php'
        )
    }
)

$testCount = 0
Write-Step "Base URL: $BaseUrl"

try {
    $unauthSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $meResponse = Invoke-Api -Endpoint 'auth.php?action=me' -Method 'GET' -Session $unauthSession
    $testCount++
    Assert-True -Condition ($meResponse.Status -eq 401) -Message "Unauthenticated /auth.php?action=me should return 401. Got $($meResponse.Status)."
    Write-Step "PASS [$testCount] Unauthenticated auth check"

    foreach ($entry in $checks) {
        $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

        $loginResponse = Invoke-Api -Endpoint 'auth.php?action=login' -Method 'POST' -Session $session -Body @{
            email = $entry.Email
            password = $entry.Password
            role = $entry.LoginRole
        }
        $testCount++
        Assert-ApiSuccess -Response $loginResponse -StepName "$($entry.Label) login"
        Write-Step "PASS [$testCount] $($entry.Label) login"

        $me = Invoke-Api -Endpoint 'auth.php?action=me' -Method 'GET' -Session $session
        $testCount++
        Assert-ApiSuccess -Response $me -StepName "$($entry.Label) session"
        $actualRole = [string]$me.Json.data.role
        Assert-True -Condition ($actualRole -eq $entry.Role) -Message "$($entry.Label) session role mismatch: expected '$($entry.Role)', got '$actualRole'."
        Write-Step "PASS [$testCount] $($entry.Label) session role=$actualRole"

        foreach ($endpoint in $entry.Endpoints) {
            $response = Invoke-Api -Endpoint $endpoint -Method 'GET' -Session $session
            $testCount++
            Assert-ApiSuccess -Response $response -StepName "$($entry.Label) GET $endpoint"
            Write-Step "PASS [$testCount] $($entry.Label) GET $endpoint"
        }

        $logout = Invoke-Api -Endpoint 'auth.php?action=logout' -Method 'POST' -Session $session -Body @{}
        $testCount++
        Assert-ApiSuccess -Response $logout -StepName "$($entry.Label) logout"
        Write-Step "PASS [$testCount] $($entry.Label) logout"
    }

    if ($RunFrontendChecks) {
        $frontendPath = Resolve-Path (Join-Path $PSScriptRoot '..\frontend')
        Write-Step "Running frontend checks at: $frontendPath"
        Push-Location $frontendPath
        try {
            & npm run lint
            if ($LASTEXITCODE -ne 0) {
                throw 'npm run lint failed.'
            }
            & npm run build
            if ($LASTEXITCODE -ne 0) {
                throw 'npm run build failed.'
            }
        } finally {
            Pop-Location
        }
        $testCount++
        Write-Step "PASS [$testCount] Frontend lint/build"
    }

    Write-Step "All smoke tests passed ($testCount checks)."
    exit 0
} catch {
    Write-Error "[phase8-smoke] FAILED: $($_.Exception.Message)"
    exit 1
}
