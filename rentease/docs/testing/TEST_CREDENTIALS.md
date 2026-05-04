# 🔑 Test Credentials - RentEase

## Demo Accounts (Pre-seeded)

These accounts are created by the database setup:

| Role | Email | Password | User ID |
|------|-------|----------|---------|
| **Admin** | `admin@rentease.local` | `Admin123!` | 1 |
| **Owner** | `owner@rentease.local` | `Owner123!` | 2 |
| **Seeker** | `seeker@rentease.local` | `Seeker123!` | 3 |
| **Parent** | `parent@rentease.local` | `Parent123!` | 4 |

## Important: Login Requires Role Selection

Starting from Phase 10, you **MUST** specify the role when logging in:

### ✅ Correct Login Request

```bash
curl -X POST http://localhost/rentease/backend/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rentease.local",
    "password": "Admin123!",
    "role": "admin"
  }'
```

### ❌ Wrong - Missing Role

```bash
# This will fail!
curl -X POST http://localhost/rentease/backend/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rentease.local",
    "password": "Admin123!"
  }'
```

## Login Examples for Each Role

### Admin Login
```json
{
  "email": "admin@rentease.local",
  "password": "Admin123!",
  "role": "admin"
}
```

### Owner Login
```json
{
  "email": "owner@rentease.local",
  "password": "Owner123!",
  "role": "owner"
}
```

### Seeker Login
```json
{
  "email": "seeker@rentease.local",
  "password": "Seeker123!",
  "role": "seeker"
}
```

### Parent Login
```json
{
  "email": "parent@rentease.local",
  "password": "Parent123!",
  "role": "parent"
}
```

## Why "Email or password is incorrect"?

This error happens when:

1. ❌ **Missing role field** - Phase 10 requires role in login request
2. ❌ **Wrong role** - Email exists but role doesn't match (e.g., trying to login as "admin" with seeker email)
3. ❌ **Wrong password** - Password doesn't match
4. ❌ **Wrong email** - Email doesn't exist in database
5. ❌ **Account inactive** - Account status is not "active"

## Testing in Frontend (Browser)

When using the frontend at `http://localhost:5173`:

1. Go to **Login** page
2. **Select the role** from dropdown (Admin/Owner/Seeker/Parent)
3. Enter email and password
4. Click **Login**

The frontend automatically includes the role in the request.

## Testing with cURL (Command Line)

### Test Admin Login
```powershell
curl -X POST http://localhost/rentease/backend/auth.php?action=login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@rentease.local\",\"password\":\"Admin123!\",\"role\":\"admin\"}'
```

### Test Seeker Login
```powershell
curl -X POST http://localhost/rentease/backend/auth.php?action=login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"seeker@rentease.local\",\"password\":\"Seeker123!\",\"role\":\"seeker\"}'
```

## Testing with Postman

1. **Method**: POST
2. **URL**: `http://localhost/rentease/backend/auth.php?action=login`
3. **Headers**: 
   - `Content-Type: application/json`
4. **Body** (raw JSON):
```json
{
  "email": "admin@rentease.local",
  "password": "Admin123!",
  "role": "admin"
}
```

## Role Mismatch Example

This will **FAIL** with "Invalid credentials":

```json
{
  "email": "seeker@rentease.local",
  "password": "Seeker123!",
  "role": "admin"
}
```

Why? Because the email belongs to a **seeker**, not an **admin**.

## Creating New Test Users

You can register new users via the API:

```bash
curl -X POST http://localhost/rentease/backend/auth.php?action=register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "seeker",
    "contact_number": "09123456789"
  }'
```

Then login with:
```json
{
  "email": "test@example.com",
  "password": "password123",
  "role": "seeker"
}
```

## Verify Current Users in Database

```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root rentease_db -e "SELECT user_id, full_name, email, role, account_status FROM users;"
```

## Quick Test Script

Save this as `test-login.ps1`:

```powershell
# Test all demo accounts
$accounts = @(
    @{email="admin@rentease.local"; password="Admin123!"; role="admin"},
    @{email="owner@rentease.local"; password="Owner123!"; role="owner"},
    @{email="seeker@rentease.local"; password="Seeker123!"; role="seeker"},
    @{email="parent@rentease.local"; password="Parent123!"; role="parent"}
)

foreach ($account in $accounts) {
    Write-Host "Testing $($account.role)..." -ForegroundColor Cyan
    $body = @{
        email = $account.email
        password = $account.password
        role = $account.role
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost/rentease/backend/auth.php?action=login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    if ($result.success) {
        Write-Host "✅ $($account.role) login successful" -ForegroundColor Green
    } else {
        Write-Host "❌ $($account.role) login failed: $($result.message)" -ForegroundColor Red
    }
}
```

Run it:
```powershell
.\test-login.ps1
```

## Summary

**Remember**: Always include the `role` field when logging in! This is a Phase 10 requirement for security and proper role-based access control.
