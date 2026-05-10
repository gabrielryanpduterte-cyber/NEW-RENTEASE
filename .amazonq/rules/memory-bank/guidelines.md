# RENTEASE - Development Guidelines

## Code Quality Standards

### PHP Backend Standards

#### Strict Typing
- **ALWAYS** declare strict types at the top of every PHP file:
```php
<?php
declare(strict_types=1);
```
- This enforces type safety and prevents implicit type coercion

#### File Structure
- Start with strict types declaration
- Include dependencies via `require_once`
- Define constants before functions
- Group related functions together
- Keep action handlers at the top level

#### Naming Conventions
- **Functions**: snake_case (e.g., `handle_login`, `require_auth`, `find_user_by_id`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `ALL_ROLES`, `API_BASE_URL`)
- **Variables**: camelCase for local variables, snake_case for database fields
- **Database columns**: snake_case (e.g., `user_id`, `full_name`, `created_at`)

#### Documentation
- Use PHPDoc-style comments for file headers:
```php
/**
 * Database Migration Check Script
 * Checks if email verification columns exist in users table
 */
```
- Inline comments for complex logic only
- Self-documenting function names preferred over excessive comments

### JavaScript/React Frontend Standards

#### File Naming
- **Components**: PascalCase with `.jsx` extension (e.g., `LoginPage.jsx`, `ProtectedRoute.jsx`)
- **Utilities**: camelCase with `.js` extension (e.g., `client.js`, `roles.js`)
- **Config files**: kebab-case (e.g., `vite.config.js`, `tailwind.config.js`)

#### Import Organization
- External dependencies first
- Internal components/utilities second
- Relative imports last
- Group by type (components, hooks, utils)

Example:
```javascript
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './auth/useAuth.js';
import LandingPage from './pages/LandingPage.jsx';
```

#### Naming Conventions
- **Components**: PascalCase (e.g., `HomeRedirect`, `App`)
- **Functions**: camelCase (e.g., `normalizeEndpoint`, `parseApiResponse`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth`)
- **API objects**: camelCase with `Api` suffix (e.g., `authApi`, `usersApi`)

#### Component Structure
- Functional components only (no class components)
- Hooks at the top of component body
- Helper functions inside component when component-specific
- Export default at the bottom

## Architectural Patterns

### Backend Patterns

#### Action-Based Routing
Each PHP module handles multiple actions via query parameters:
```php
$action = request_action($payload);

if ($method === 'POST' && $action === 'register') {
    handle_register($payload);
}

if ($method === 'POST' && $action === 'login') {
    handle_login($payload);
}
```

#### Standardized JSON Responses
All API responses follow this structure:
```php
json_response(
    bool $success,
    string $message,
    $data = null,
    array $errors = [],
    int $statusCode = 200
);
```

Example:
```php
json_response(true, 'Login successful.', sanitize_user($user), []);
json_response(false, 'Validation failed.', new stdClass(), ['email is required.'], 400);
```

#### Request Validation Pattern
1. Check HTTP method with `require_methods(['GET', 'POST'])`
2. Validate required fields with `require_fields($payload, ['email', 'password'])`
3. Validate field formats and business rules
4. Collect errors in array
5. Return early if validation fails

Example:
```php
require_fields($payload, ['full_name', 'email', 'password', 'role']);

$errors = [];
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'email must be a valid email address.';
}
if (strlen($password) < 8) {
    $errors[] = 'password must be at least 8 characters.';
}

if (!empty($errors)) {
    json_response(false, 'Validation failed.', new stdClass(), $errors, 400);
}
```

#### Database Access Pattern
- Use PDO with prepared statements exclusively
- Never concatenate user input into SQL
- Use named parameters (`:param_name`)
- Fetch associative arrays by default

Example:
```php
$query = db()->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
$query->execute([':email' => $email]);
$user = $query->fetch();
```

#### Authentication & Authorization Pattern
- `require_auth()` - Ensures user is logged in, returns user array
- `require_roles(['admin', 'owner'])` - Ensures user has specific role
- `current_user()` - Gets current user without throwing error
- `login_user($user)` - Regenerates session ID and stores user_id
- `logout_user()` - Destroys session and clears cookies

Example:
```php
function handle_update_profile(array $payload): void
{
    $actor = require_auth(); // Throws 401 if not authenticated
    $userId = (int)$actor['user_id'];
    // ... update logic
}
```

#### Ownership Validation Pattern
Helper functions verify resource ownership:
```php
owner_owns_boarding_house(int $ownerId, int $boardingHouseId): bool
owner_owns_room(int $ownerId, int $roomId): bool
owner_owns_reservation(int $ownerId, int $reservationId): bool
owner_owns_payment(int $ownerId, int $paymentId): bool
```

#### Activity Logging Pattern
Log all significant user actions:
```php
log_activity($userId, 'User login', 'auth');
log_activity($userId, 'Updated own profile', 'auth');
log_activity($userId, 'Created reservation', 'reservations');
```

#### Error Handling Pattern
- Use try-catch blocks at module entry points
- Log errors with `log_error($code, $message, $userId)`
- Use `handle_exception($exception, $context, $userId)` for unexpected errors
- Never expose internal error details to clients

Example:
```php
try {
    // ... business logic
} catch (Throwable $exception) {
    $user = current_user();
    handle_exception($exception, 'Auth request failed', $user ? (int)$user['user_id'] : null);
}
```

### Frontend Patterns

#### API Client Pattern
Centralized API client with typed endpoints:
```javascript
export const authApi = {
  me: () => apiRequest('auth.php?action=me'),
  login: (credentials) => apiRequest('auth.php?action=login', {
    method: 'POST',
    body: credentials,
  }),
  logout: () => apiRequest('auth.php?action=logout', {
    method: 'POST',
    body: {},
  }),
};
```

#### API Error Handling Pattern
Custom ApiError class with status codes:
```javascript
export class ApiError extends Error {
  constructor(message, status, errors = [], details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.details = details;
  }
}
```

Error description helper:
```javascript
export function describeApiError(error) {
  if (error.status === 401) return '401 Unauthorized: Please login again.';
  if (error.status === 403) return '403 Forbidden: Your role is not allowed.';
  if (error.status === 404) return '404 Not Found: Record does not exist.';
  if (error.status === 500) return '500 Server Error: Backend issue.';
  if (error.status === 0) return 'Network error: Unable to reach backend.';
  return error.message || 'Request failed.';
}
```

#### Protected Route Pattern
Wrap role-specific routes with ProtectedRoute component:
```javascript
<Route
  path="/seeker/dashboard"
  element={
    <ProtectedRoute allowedRoles={['seeker']}>
      <SeekerDashboard />
    </ProtectedRoute>
  }
/>
```

#### Authentication Context Pattern
- Use React Context for global auth state
- Provide `authState` and `setAuthState` via context
- Custom hook `useAuth()` for consuming context
- Status values: `'loading'`, `'authenticated'`, `'unauthenticated'`

Example:
```javascript
export const AuthContext = createContext(null);

function HomeRedirect() {
  const { authState } = useAuth();
  
  if (authState.status === 'loading') {
    return <div>Checking session...</div>;
  }
  
  if (authState.status === 'authenticated') {
    return <Navigate to={roleDashboardPath(authState.user?.role)} replace />;
  }
  
  return <RentEaseLanding />;
}
```

#### Vite Configuration Pattern
- Use `@` alias for `./src` directory
- Configure backend proxy for development
- Rewrite `/backend/*` to `/rentease/backend/*`

Example:
```javascript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/backend': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend/, '/rentease/backend'),
      },
    },
  },
});
```

## Common Code Idioms

### PHP Idioms

#### Null Coalescing and Ternary
```php
// Null coalescing for defaults
$action = $_GET['action'] ?? '';
$user = current_user() ?? null;

// Ternary for conditional values
$isSecure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
$statusCode = $success ? 200 : 400;
```

#### Type Casting
```php
// Explicit type casting for safety
$userId = (int)$user['user_id'];
$email = (string)$payload['email'];
$isActive = (bool)$query->fetchColumn();
```

#### Array Destructuring and Filtering
```php
// Filter and map arrays
$allowed = array_map('strtoupper', $allowedMethods);
$entries = array_filter($entries, static fn($value) => $value !== '');
$ids = array_values($ids); // Re-index array
```

#### Static Variables for Caching
```php
function current_user(bool $refresh = false): ?array
{
    static $loaded = false;
    static $cachedUser = null;
    
    if (!$loaded || $refresh) {
        $loaded = true;
        $cachedUser = find_user_by_id($sessionUserId);
    }
    
    return $cachedUser;
}
```

#### Early Returns for Validation
```php
if ($fullName === '') {
    json_response(false, 'Validation failed.', new stdClass(), ['full_name is required.'], 400);
}
// Continue with valid data
```

### JavaScript Idioms

#### Nullish Coalescing and Optional Chaining
```javascript
// Nullish coalescing for defaults
const method = options.method ?? 'GET';
const errors = Array.isArray(payload.errors) ? payload.errors : [];

// Optional chaining for safe property access
const role = authState.user?.role;
const userId = user?.user_id;
```

#### Destructuring
```javascript
// Object destructuring
const { authState } = useAuth();
const { method, body, headers } = options;

// Array destructuring
const [isLoading, setIsLoading] = useState(false);
```

#### Template Literals
```javascript
// String interpolation
const url = `${API_BASE_URL}/${clean}`;
const message = `401 Unauthorized: ${error.message}`;
```

#### Arrow Functions
```javascript
// Concise arrow functions
const normalize = (endpoint) => endpoint.replace(/^\/+/, '');

// Implicit return for objects (wrap in parentheses)
const sanitize = (user) => ({
  user_id: user.user_id,
  email: user.email,
});
```

#### Spread Operator
```javascript
// Object spreading for merging
const headers = {
  'Content-Type': 'application/json',
  ...(options.headers ?? {}),
};

// Array spreading
const allRoles = [...seekerRoles, ...ownerRoles];
```

#### Async/Await Pattern
```javascript
// Always use async/await for promises
async function fetchUser() {
  try {
    const response = await authApi.me();
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}
```

## Configuration Patterns

### Environment Variables
- Backend: Use `getenv()` with fallback defaults
- Frontend: Use `import.meta.env.VITE_*` for Vite environment variables

Backend example:
```php
function db_config(string $name, string $defaultValue): string
{
    $value = getenv($name);
    if ($value === false || $value === '') {
        return $defaultValue;
    }
    return $value;
}

$host = db_config('RENTEASE_DB_HOST', 'localhost');
```

Frontend example:
```javascript
const rawApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE_URL = rawApiBase && rawApiBase.length > 0
  ? rawApiBase.replace(/\/+$/, '')
  : '/backend';
```

### Feature Flags
Use boolean constants for optional features:
```javascript
// frontend/src/config/google-oauth.js
export const ENABLE_GOOGLE_AUTH = false;

// Usage
if (ENABLE_GOOGLE_AUTH) {
  // Render Google Sign-In button
}
```

### CORS Configuration
Centralized CORS handling in `backend/config.php`:
```php
function cors_allowed_origins(): array
{
    $raw = getenv('RENTEASE_ALLOWED_ORIGINS');
    if ($raw === false || trim($raw) === '') {
        return [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ];
    }
    return array_map('trim', explode(',', $raw));
}
```

## Security Best Practices

### Input Validation
1. **Always validate on backend** - Never trust client-side validation alone
2. **Whitelist approach** - Define allowed values explicitly
3. **Type validation** - Use `filter_var()` for emails, URLs, etc.
4. **Length validation** - Enforce minimum/maximum lengths
5. **Format validation** - Use regex for structured data (dates, phone numbers)

### SQL Injection Prevention
- **NEVER** concatenate user input into SQL queries
- **ALWAYS** use prepared statements with named parameters
- **NEVER** use `PDO::EMULATE_PREPARES = true`

### XSS Prevention
- Backend returns JSON only (no HTML rendering)
- React automatically escapes JSX content
- Use `JSON_UNESCAPED_UNICODE` for proper encoding

### Session Security
- Regenerate session ID on login: `session_regenerate_id(true)`
- Use HttpOnly cookies: `session.cookie_httponly = 1`
- Use SameSite=Lax: Prevents CSRF attacks
- Destroy session completely on logout

### Password Security
- Minimum 8 characters enforced
- Use `password_hash()` with `PASSWORD_DEFAULT`
- Use `password_verify()` for checking
- Never store plain text passwords

### Error Handling Security
- Never expose internal errors to clients
- Log detailed errors server-side
- Return generic error messages to clients
- Use sanitized error responses

Example:
```php
// Good: Generic client message, detailed server log
log_error('DB_CONNECTION_FAILED', $exception->getMessage(), $userId);
json_response(false, 'Server error.', new stdClass(), ['An unexpected error occurred.'], 500);

// Bad: Exposing internal details
json_response(false, $exception->getMessage(), new stdClass(), [], 500);
```

## Testing Patterns

### Manual Testing Approach
- Use PowerShell smoke test scripts for API validation
- Test all roles (admin, owner, seeker, parent)
- Verify RBAC enforcement
- Test error cases and edge conditions

### Smoke Test Structure
```powershell
# Phase-based smoke tests
scripts/phase8-api-smoke-test.ps1        # Core API endpoints
scripts/phase9-account-smoke-test.ps1    # Account self-service
scripts/phase10-onboarding-smoke-test.ps1 # Onboarding flow
```

## Code Style Preferences

### PHP Style
- Opening brace on same line for functions
- 4-space indentation
- Single quotes for simple strings, double quotes for interpolation
- Explicit return types when possible
- Void return type for functions that don't return values

### JavaScript Style
- 2-space indentation
- Single quotes for strings (except JSX attributes)
- Semicolons optional but consistent
- Trailing commas in multi-line arrays/objects
- Destructuring preferred over property access

### SQL Style
- Keywords in UPPERCASE
- Table/column names in lowercase
- Backticks for reserved words (e.g., `` `timestamp` ``)
- Indented multi-line queries
- Named parameters with colon prefix (`:param_name`)

## Common Annotations and Comments

### PHP Comments
```php
// Single-line comment for brief explanations
/* Multi-line comment for longer explanations */

/**
 * PHPDoc-style for file headers and complex functions
 * @param array $payload Request payload
 * @return void
 */
```

### JavaScript Comments
```javascript
// Single-line comment
/* Multi-line comment */

/** JSDoc-style for complex functions */
```

### TODO Comments
```php
// TODO: Implement email verification
// FIXME: Handle edge case for concurrent updates
// NOTE: This assumes single boarding house per owner
```

## Import/Require Patterns

### PHP Requires
```php
// Use require_once to prevent duplicate includes
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';
```

### JavaScript Imports
```javascript
// Named imports
import { useState, useEffect } from 'react';
import { apiRequest, authApi } from './api/client.js';

// Default imports
import React from 'react';
import App from './App.jsx';

// Namespace imports
import * as utils from './utils/helpers.js';
```

## File Organization Principles

### Backend Organization
- One module per domain concept (auth, users, rooms, etc.)
- Shared utilities in `helpers.php`
- Configuration in `config.php`
- Keep modules under 500 lines when possible

### Frontend Organization
- Pages in `pages/` directory, grouped by role
- Reusable components in `components/`
- API clients in `api/`
- Utilities in `utils/`
- Context providers in `context/` or `auth/`
- Custom hooks in `hooks/`

### Database Organization
- Schema files prefixed with phase number
- Migration files with descriptive names
- Verification scripts for checking migrations
- Cleanup scripts for test data
