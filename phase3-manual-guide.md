# Phase 3 Manual Guide (RENTEASE)

This guide is for manual execution of Phase 3 only.  
Goal: build PHP backend APIs (JSON) with auth and RBAC first, then resource endpoints.

## Phase 3 Scope

You will build API files inside `rentease/backend/`:

- `config.php` (database connection + common settings)
- `auth.php` (register/login/session or token checks)
- `users.php`
- `boarding_house.php`
- `rooms.php`
- `reservations.php`
- `payments.php`
- `activity_logs.php`
- `error_logs.php`

Rule:
- One file per resource.
- All responses must be JSON.
- Auth + RBAC must be completed before business endpoints.

## Before You Start

1. Start XAMPP (`Apache`, `MySQL`).
2. Ensure Phase 2 tables already exist in `rentease_db`.
3. Ensure your project is inside web root for easy API access:
   - Recommended path: `C:\xampp\htdocs\rentease\`
4. Open browser test URL pattern:
   - `http://localhost/rentease/backend/<file>.php`

## Backend Folder Setup (Manual)

Inside `rentease/backend/`, create:

- `config.php`
- `helpers.php` (optional but recommended for reusable JSON response/auth checks)
- `auth.php`
- `users.php`
- `boarding_house.php`
- `rooms.php`
- `reservations.php`
- `payments.php`
- `activity_logs.php`
- `error_logs.php`
- `.htaccess` (optional; useful later for clean routing/CORS headers)

## Step 1: Create DB Connection File (`config.php`)

Manual implementation checklist:

1. Define DB credentials:
   - host: `localhost`
   - db: `rentease_db`
   - user: `rentease_user` (recommended) or root during dev
   - password: your set password
2. Use `mysqli` or `PDO` consistently across all files.
3. Set response header for APIs:
   - `Content-Type: application/json`
4. Add basic error handling:
   - If DB connection fails, return JSON error (do not output raw PHP warnings).

## Step 2: Define JSON Response Standard

Use one response structure for every endpoint.

Recommended format:

```json
{
  "success": true,
  "message": "Readable summary",
  "data": {},
  "errors": []
}
```

Manual rules:
- `success=true` for successful requests.
- `success=false` for validation/auth/DB errors.
- Always send proper HTTP status codes:
  - 200 OK (read/update success)
  - 201 Created (new record)
  - 400 Bad Request (validation)
  - 401 Unauthorized (not logged in)
  - 403 Forbidden (RBAC denied)
  - 404 Not Found
  - 405 Method Not Allowed
  - 500 Server Error

## Step 3: Build Auth First (`auth.php`)

Implement these endpoints first because all protected modules depend on them.

Minimum auth operations:

1. Register user (`POST`)
   - Validate required fields
   - Check unique email
   - Hash password before insert
2. Login (`POST`)
   - Validate credentials
   - Verify hashed password
   - Start session or issue token
3. Current user/profile (`GET`)
   - Return logged-in user details
4. Logout (`POST`)
   - Destroy session/invalidate token

Manual validation checks:
- Never store plain text passwords.
- Return generic login failure messages.
- Add failed-login attempts to `activity_logs` where applicable.

## Step 4: Implement RBAC Guard (Before Other Resources)

Roles from your ERD/project:
- `seeker`
- `parent`
- `owner`
- `admin`

Manual RBAC pattern:

1. Create a reusable role-check function (in `helpers.php` or auth utility section).
2. At top of each protected resource file:
   - Confirm authenticated user
   - Confirm allowed role(s)
3. Return:
   - `401` if not authenticated
   - `403` if authenticated but role not allowed

Example role expectations:
- `owner`: room management, reservation approval, payment recording
- `admin`: account and logs oversight
- `seeker/parent`: read-only views relevant to their access

## Step 5: Build Resource APIs (One File Per Table)

After auth/RBAC is stable, implement in this order:

1. `rooms.php`
2. `reservations.php`
3. `payments.php`
4. `boarding_house.php`
5. `users.php`
6. `activity_logs.php`
7. `error_logs.php`

Per-file manual checklist:
- Handle allowed HTTP methods only (`GET`, `POST`, `PUT/PATCH`, `DELETE` as needed).
- Validate inputs before DB queries.
- Use prepared statements only.
- Return JSON consistently.
- Log important actions in `activity_logs`.
- Capture server-side exceptions into `error_logs` (without exposing sensitive details to client).

## Step 6: Manual Endpoint Testing (No Frontend Yet)

Test tools:
- Postman, Insomnia, or browser + REST client extension.

Test flow:

1. Test `auth.php` register.
2. Test `auth.php` login.
3. Test protected endpoint without auth -> expect `401`.
4. Test protected endpoint with wrong role -> expect `403`.
5. Test owner/admin allowed endpoints -> expect success.
6. Test invalid payloads -> expect `400`.
7. Test unknown record IDs -> expect `404`.

## Step 7: Logging Discipline in Phase 3

Every critical action should create activity logs:
- user login/logout
- reservation creation/approval/rejection
- payment record updates
- admin actions

System errors should create error logs:
- DB exceptions
- invalid query states
- unexpected server failures

## Phase 3 Completion Checklist

- [ ] `config.php` working and DB connected
- [ ] `auth.php` register/login/logout/me working
- [ ] Password hashing and verification working
- [ ] RBAC guard implemented and reused
- [ ] Resource files created (one per module)
- [ ] All endpoints return JSON only
- [ ] HTTP status codes are correct
- [ ] Activity logging integrated
- [ ] Error logging integrated
- [ ] Manual API tests completed

## Footprint Log Template (For Documentation/Defense)

Fill this while doing Phase 3 manually:

- Created backend files in `rentease/backend/` (`yes/no`)
- Implemented `config.php` DB connection (`yes/no`)
- Set JSON response standard (`yes/no`)
- Built `auth.php` register endpoint (`yes/no`)
- Built `auth.php` login endpoint (`yes/no`)
- Built logout/session check endpoint (`yes/no`)
- Implemented RBAC helper (`yes/no`)
- Implemented `rooms.php` (`yes/no`)
- Implemented `reservations.php` (`yes/no`)
- Implemented `payments.php` (`yes/no`)
- Implemented `boarding_house.php` (`yes/no`)
- Implemented `users.php` (`yes/no`)
- Implemented `activity_logs.php` (`yes/no`)
- Implemented `error_logs.php` (`yes/no`)
- Tested unauthenticated access returns `401` (`yes/no`)
- Tested unauthorized role access returns `403` (`yes/no`)
- Tested successful JSON responses (`yes/no`)
- Final Phase 3 status: `complete/incomplete`

## Common Phase 3 Issues

- API returns HTML instead of JSON:
  - Missing `Content-Type: application/json` header.

- CORS errors appear early:
  - Add correct `Access-Control-Allow-*` headers (full fix is handled in Phase 5 integration).

- Session not persisting:
  - `session_start()` missing or cookie settings misconfigured.

- Login always fails:
  - Password hash verify mismatch (stored hash format issue).

- Foreign key insert errors:
  - Related record IDs do not exist in parent tables.

- RBAC bypass risk:
  - Role checks missing in one or more endpoints.
