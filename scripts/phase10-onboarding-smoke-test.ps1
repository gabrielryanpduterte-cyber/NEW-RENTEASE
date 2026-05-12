param(
    [string]$BaseUrl = 'http://localhost:8080',
    [switch]$RunFrontendChecks
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
    Write-Host "[phase10-onboarding] $Message"
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
        Uri             = $uri
        Method          = $Method
        WebSession      = $Session
        UseBasicParsing = $true
        TimeoutSec      = 30
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
        Uri    = $uri
        Status = $statusCode
        Json   = Parse-JsonOrNull -Text $content
        Raw    = $content
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

$testCount = 0
$suffix = (Get-Date -Format 'yyyyMMddHHmmssfff') + (Get-Random -Minimum 1000 -Maximum 9999)
$password = 'Phase10Test!123'

$seeker = [PSCustomObject]@{
    full_name = "Phase10 Seeker $suffix"
    email = "phase10.seeker.$suffix@rentease.local"
    password = $password
    role = 'seeker'
    contact_number = '09170010001'
}

$parent = [PSCustomObject]@{
    full_name = "Phase10 Parent $suffix"
    email = "phase10.parent.$suffix@rentease.local"
    password = $password
    role = 'parent'
    contact_number = '09170010002'
}

$owner = [PSCustomObject]@{
    full_name = "Phase10 Owner $suffix"
    email = "phase10.owner.$suffix@rentease.local"
    password = $password
    role = 'owner'
    contact_number = '09170010003'
}

Write-Step "Base URL: $BaseUrl"

try {
    $unauth = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $meUnauth = Invoke-Api -Endpoint 'auth.php?action=me' -Method 'GET' -Session $unauth
    $testCount++
    Assert-True -Condition ($meUnauth.Status -eq 401) -Message "Unauthenticated auth.php?action=me should return 401."
    Write-Step "PASS [$testCount] Unauthenticated session check"

    $registerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

    $registerSeeker = Invoke-Api -Endpoint 'auth.php?action=register' -Method 'POST' -Session $registerSession -Body $seeker
    $testCount++
    Assert-ApiSuccess -Response $registerSeeker -StepName 'Register seeker'
    Write-Step "PASS [$testCount] Register seeker"

    $registerParent = Invoke-Api -Endpoint 'auth.php?action=register' -Method 'POST' -Session $registerSession -Body $parent
    $testCount++
    Assert-ApiSuccess -Response $registerParent -StepName 'Register parent'
    Write-Step "PASS [$testCount] Register parent"

    $registerOwner = Invoke-Api -Endpoint 'auth.php?action=register' -Method 'POST' -Session $registerSession -Body $owner
    $testCount++
    Assert-ApiSuccess -Response $registerOwner -StepName 'Register owner'
    Write-Step "PASS [$testCount] Register owner"

    $seekerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

    $wrongRoleLogin = Invoke-Api -Endpoint 'auth.php?action=login' -Method 'POST' -Session $seekerSession -Body @{
        email = $seeker.email
        password = $seeker.password
        role = 'parent'
    }
    $testCount++
    Assert-True -Condition ($wrongRoleLogin.Status -eq 401) -Message 'Login with mismatched role should fail with 401.'
    Write-Step "PASS [$testCount] Role mismatch login rejected"

    $seekerLogin = Invoke-Api -Endpoint 'auth.php?action=login' -Method 'POST' -Session $seekerSession -Body @{
        email = $seeker.email
        password = $seeker.password
        role = 'seeker'
    }
    $testCount++
    Assert-ApiSuccess -Response $seekerLogin -StepName 'Seeker login'
    Write-Step "PASS [$testCount] Seeker login with explicit role"

    $createLink = Invoke-Api -Endpoint 'account_links.php' -Method 'POST' -Session $seekerSession -Body @{
        target_email = $parent.email
        notes = 'Phase 10 onboarding smoke link request'
    }
    $testCount++
    Assert-ApiSuccess -Response $createLink -StepName 'Create account link request'
    $linkId = [int]$createLink.Json.data.link_id
    Assert-True -Condition ($linkId -gt 0) -Message 'Account link ID was not returned.'
    Write-Step "PASS [$testCount] Seeker created link request (#$linkId)"

    $seekerLogout = Invoke-Api -Endpoint 'auth.php?action=logout' -Method 'POST' -Session $seekerSession -Body @{}
    $testCount++
    Assert-ApiSuccess -Response $seekerLogout -StepName 'Seeker logout'
    Write-Step "PASS [$testCount] Seeker logout"

    $parentSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $parentLogin = Invoke-Api -Endpoint 'auth.php?action=login' -Method 'POST' -Session $parentSession -Body @{
        email = $parent.email
        password = $parent.password
        role = 'parent'
    }
    $testCount++
    Assert-ApiSuccess -Response $parentLogin -StepName 'Parent login'
    Write-Step "PASS [$testCount] Parent login with explicit role"

    $linksBeforeApprove = Invoke-Api -Endpoint 'account_links.php' -Method 'GET' -Session $parentSession
    $testCount++
    Assert-ApiSuccess -Response $linksBeforeApprove -StepName 'Parent list account links'
    Write-Step "PASS [$testCount] Parent link list fetched"

    $approveLink = Invoke-Api -Endpoint "account_links.php?link_id=$linkId" -Method 'PATCH' -Session $parentSession -Body @{
        status = 'approved'
    }
    $testCount++
    Assert-ApiSuccess -Response $approveLink -StepName 'Approve account link'
    Write-Step "PASS [$testCount] Parent approved link request"

    $reservationsCheck = Invoke-Api -Endpoint 'reservations.php' -Method 'GET' -Session $parentSession
    $testCount++
    Assert-ApiSuccess -Response $reservationsCheck -StepName 'Parent reservations visibility after linking'
    Write-Step "PASS [$testCount] Parent monitoring endpoint accessible after linking"

    $parentLogout = Invoke-Api -Endpoint 'auth.php?action=logout' -Method 'POST' -Session $parentSession -Body @{}
    $testCount++
    Assert-ApiSuccess -Response $parentLogout -StepName 'Parent logout'
    Write-Step "PASS [$testCount] Parent logout"

    $ownerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $ownerLogin = Invoke-Api -Endpoint 'auth.php?action=login' -Method 'POST' -Session $ownerSession -Body @{
        email = $owner.email
        password = $owner.password
        role = 'owner'
    }
    $testCount++
    Assert-ApiSuccess -Response $ownerLogin -StepName 'Owner login'
    Write-Step "PASS [$testCount] Owner login with explicit role"

    $ownerLogout = Invoke-Api -Endpoint 'auth.php?action=logout' -Method 'POST' -Session $ownerSession -Body @{}
    $testCount++
    Assert-ApiSuccess -Response $ownerLogout -StepName 'Owner logout'
    Write-Step "PASS [$testCount] Owner logout"

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

    Write-Step "All Phase 10 onboarding smoke tests passed ($testCount checks)."
    exit 0
} catch {
    Write-Error "[phase10-onboarding] FAILED: $($_.Exception.Message)"
    exit 1
}
