param(
    [string]$BaseUrl = 'http://localhost:8080',
    [switch]$RunFrontendChecks
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
    Write-Host "[phase9-account] $Message"
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

function Get-TempPassword([string]$CurrentPassword, [string]$Role) {
    return "$CurrentPassword-P9-$Role"
}

$checks = @(
    [PSCustomObject]@{
        Label    = 'Admin'
        Role     = 'admin'
        LoginRole = 'seeker'
        Email    = 'admin@rentease.test'
        Password = 'Admin@1234'
    },
    [PSCustomObject]@{
        Label    = 'Owner'
        Role     = 'owner'
        LoginRole = 'owner'
        Email    = 'landlord@rentease.test'
        Password = 'Owner@1234'
    },
    [PSCustomObject]@{
        Label    = 'Seeker'
        Role     = 'seeker'
        LoginRole = 'seeker'
        Email    = 'seeker1@rentease.test'
        Password = 'Seeker@1234'
    }
)

$testCount = 0
Write-Step "Base URL: $BaseUrl"

try {
    foreach ($entry in $checks) {
        $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
        $tempPassword = Get-TempPassword -CurrentPassword $entry.Password -Role $entry.Role
        $profileSuffix = " [P9-$($entry.Role)]"

        $login = Invoke-Api -Endpoint 'auth.php?action=login' -Method 'POST' -Session $session -Body @{
            email    = $entry.Email
            password = $entry.Password
            role     = $entry.LoginRole
        }
        $testCount++
        Assert-ApiSuccess -Response $login -StepName "$($entry.Label) login (original)"
        Write-Step "PASS [$testCount] $($entry.Label) login (original)"

        $me = Invoke-Api -Endpoint 'auth.php?action=me' -Method 'GET' -Session $session
        $testCount++
        Assert-ApiSuccess -Response $me -StepName "$($entry.Label) me (original)"
        $actualRole = [string]$me.Json.data.role
        Assert-True -Condition ($actualRole -eq $entry.Role) -Message "$($entry.Label) role mismatch: expected '$($entry.Role)', got '$actualRole'."
        Write-Step "PASS [$testCount] $($entry.Label) me role=$actualRole"

        $originalFullName = [string]$me.Json.data.full_name
        $originalEmail = [string]$me.Json.data.email
        $originalContact = [string]$me.Json.data.contact_number

        $nextFullName = $originalFullName + $profileSuffix
        if ($originalFullName.EndsWith($profileSuffix)) {
            $nextFullName = $originalFullName.Replace($profileSuffix, '')
        }

        $updateProfile = Invoke-Api -Endpoint 'auth.php?action=update_profile' -Method 'POST' -Session $session -Body @{
            full_name      = $nextFullName
            email          = $originalEmail
            contact_number = $originalContact
        }
        $testCount++
        Assert-ApiSuccess -Response $updateProfile -StepName "$($entry.Label) update_profile"
        Write-Step "PASS [$testCount] $($entry.Label) update_profile"

        $meAfterProfile = Invoke-Api -Endpoint 'auth.php?action=me' -Method 'GET' -Session $session
        $testCount++
        Assert-ApiSuccess -Response $meAfterProfile -StepName "$($entry.Label) me after profile update"
        $updatedName = [string]$meAfterProfile.Json.data.full_name
        Assert-True -Condition ($updatedName -eq $nextFullName) -Message "$($entry.Label) full_name mismatch after update_profile."
        Write-Step "PASS [$testCount] $($entry.Label) profile reflected in session"

        $changePassword = Invoke-Api -Endpoint 'auth.php?action=change_password' -Method 'POST' -Session $session -Body @{
            current_password = $entry.Password
            new_password     = $tempPassword
        }
        $testCount++
        Assert-ApiSuccess -Response $changePassword -StepName "$($entry.Label) change_password"
        Write-Step "PASS [$testCount] $($entry.Label) change_password"

        $logoutAfterChange = Invoke-Api -Endpoint 'auth.php?action=logout' -Method 'POST' -Session $session -Body @{}
        $testCount++
        Assert-ApiSuccess -Response $logoutAfterChange -StepName "$($entry.Label) logout after change_password"
        Write-Step "PASS [$testCount] $($entry.Label) logout after change_password"

        $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
        $loginTemp = Invoke-Api -Endpoint 'auth.php?action=login' -Method 'POST' -Session $session -Body @{
            email    = $entry.Email
            password = $tempPassword
            role     = $entry.LoginRole
        }
        $testCount++
        Assert-ApiSuccess -Response $loginTemp -StepName "$($entry.Label) login (temporary password)"
        Write-Step "PASS [$testCount] $($entry.Label) login (temporary password)"

        $restoreProfile = Invoke-Api -Endpoint 'auth.php?action=update_profile' -Method 'POST' -Session $session -Body @{
            full_name      = $originalFullName
            email          = $originalEmail
            contact_number = $originalContact
        }
        $testCount++
        Assert-ApiSuccess -Response $restoreProfile -StepName "$($entry.Label) restore profile"
        Write-Step "PASS [$testCount] $($entry.Label) restore profile"

        $restorePassword = Invoke-Api -Endpoint 'auth.php?action=change_password' -Method 'POST' -Session $session -Body @{
            current_password = $tempPassword
            new_password     = $entry.Password
        }
        $testCount++
        Assert-ApiSuccess -Response $restorePassword -StepName "$($entry.Label) restore password"
        Write-Step "PASS [$testCount] $($entry.Label) restore password"

        $logoutAfterRestore = Invoke-Api -Endpoint 'auth.php?action=logout' -Method 'POST' -Session $session -Body @{}
        $testCount++
        Assert-ApiSuccess -Response $logoutAfterRestore -StepName "$($entry.Label) logout after restore"
        Write-Step "PASS [$testCount] $($entry.Label) logout after restore"

        $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
        $finalLogin = Invoke-Api -Endpoint 'auth.php?action=login' -Method 'POST' -Session $session -Body @{
            email    = $entry.Email
            password = $entry.Password
            role     = $entry.LoginRole
        }
        $testCount++
        Assert-ApiSuccess -Response $finalLogin -StepName "$($entry.Label) final login (original password restored)"
        Write-Step "PASS [$testCount] $($entry.Label) final login (original password restored)"

        $finalLogout = Invoke-Api -Endpoint 'auth.php?action=logout' -Method 'POST' -Session $session -Body @{}
        $testCount++
        Assert-ApiSuccess -Response $finalLogout -StepName "$($entry.Label) final logout"
        Write-Step "PASS [$testCount] $($entry.Label) final logout"
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

    Write-Step "All Phase 9 account smoke tests passed ($testCount checks)."
    exit 0
} catch {
    Write-Error "[phase9-account] FAILED: $($_.Exception.Message)"
    exit 1
}
