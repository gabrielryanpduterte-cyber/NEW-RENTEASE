# RENTEASE - Technology Stack

## Programming Languages

### Backend
- **PHP 8+** - Server-side API layer
  - Strict types enabled (`declare(strict_types=1)`)
  - PDO for database access
  - Session-based authentication
  - Composer for dependency management

### Frontend
- **JavaScript (ES6+)** - Client-side application
  - React 19.2.5
  - JSX syntax
  - ES modules
  - Async/await patterns

### Database
- **MySQL / MariaDB** - Relational database
  - UTF-8mb4 character set
  - InnoDB storage engine
  - Prepared statements for security

### Scripting
- **PowerShell** - Automation scripts
  - Setup automation
  - Smoke testing
  - Database management

## Core Technologies

### Backend Stack
- **PHP 8+** - Core language
- **PDO** - Database abstraction layer
- **Composer** - Dependency management
- **PHPMailer** - Email functionality (vendor dependency)

### Frontend Stack
- **React 19.2.5** - UI library
- **React Router 7.14.2** - Client-side routing
- **Vite 8.0.10** - Build tool and dev server
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **shadcn/ui** - Component library (via lucide-react, class-variance-authority)

### UI Components & Styling
- **lucide-react 1.14.0** - Icon library
- **class-variance-authority 0.7.1** - Component variant management
- **clsx 2.1.1** - Conditional class names
- **tailwind-merge 3.5.0** - Tailwind class merging utility
- **PostCSS 8.5.13** - CSS processing
- **Autoprefixer 10.5.0** - CSS vendor prefixing

### Authentication
- **@react-oauth/google 0.13.5** - Google OAuth integration (Phase 12)
- PHP sessions - Server-side session management
- Secure cookies - HttpOnly, SameSite=Lax

### Development Tools
- **ESLint 10.2.1** - JavaScript linting
  - eslint-plugin-react-hooks 7.1.1
  - eslint-plugin-react-refresh 0.5.2
- **Vite Plugin React 6.0.1** - React Fast Refresh
- **TypeScript types** - Type definitions for React (@types/react, @types/react-dom)

## Runtime Environment

### Local Development
- **XAMPP** - Local server stack
  - Apache 2.4+ - Web server
  - MySQL 5.7+ / MariaDB 10+ - Database server
  - PHP 8+ - Scripting engine

### Node.js Environment
- **Node.js 18+** - JavaScript runtime
- **npm** - Package manager
- **Vite Dev Server** - Hot module replacement

## Build System

### Frontend Build
```json
{
  "dev": "vite",           // Development server with HMR
  "build": "vite build",   // Production build
  "lint": "eslint .",      // Code linting
  "preview": "vite preview" // Preview production build
}
```

### Build Configuration
- **Vite Config** (`vite.config.js`)
  - React plugin with Fast Refresh
  - Backend proxy: `/backend/*` → `http://localhost/rentease/backend/*`
  - Port: 5173 (dev), 4173 (preview)

- **Tailwind Config** (`tailwind.config.js`)
  - Content paths: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`
  - Custom theme extensions
  - Dark mode support

- **PostCSS Config** (`postcss.config.js`)
  - Tailwind CSS processing
  - Autoprefixer for browser compatibility

- **ESLint Config** (`eslint.config.js`)
  - React hooks rules
  - React refresh rules
  - ES2020 globals

## Database Configuration

### Connection Details
- **Host**: `localhost` (override: `RENTEASE_DB_HOST`)
- **Database**: `rentease_db` (override: `RENTEASE_DB_NAME`)
- **User**: `rentease_user` (override: `RENTEASE_DB_USER`)
- **Password**: empty string (override: `RENTEASE_DB_PASS`)
- **Charset**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`

### PDO Configuration
```php
[
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  PDO::ATTR_EMULATE_PREPARES => false,
]
```

## Security Configuration

### CORS Settings
- **Allowed Origins**: Configurable via `RENTEASE_ALLOWED_ORIGINS`
- **Default Origins**:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
  - `http://localhost:4173`
  - `http://127.0.0.1:4173`
- **Credentials**: Enabled for allowed origins
- **Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization, X-Requested-With

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Type: application/json; charset=utf-8`

### Session Configuration
```php
[
  'lifetime' => 0,           // Session cookie (expires on browser close)
  'path' => '/',
  'domain' => '',
  'secure' => $isSecure,     // HTTPS only in production
  'httponly' => true,        // No JavaScript access
  'samesite' => 'Lax',       // CSRF protection
]
```

### PHP INI Settings
- `session.use_strict_mode = 1`
- `session.use_only_cookies = 1`
- `session.cookie_httponly = 1`

## Development Commands

### Frontend Development
```bash
cd frontend
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

### Backend Setup
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS rentease_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -u root -p rentease_db < database/rentease_final_phase7.sql
mysql -u root -p rentease_db < database/phase8_uploads_schema.sql
mysql -u root -p rentease_db < database/phase10_parent_seeker_links_schema.sql
mysql -u root -p rentease_db < database/phase12_google_oauth_schema.sql

# Create DB user
mysql -u root -p -e "CREATE USER IF NOT EXISTS 'rentease_user'@'localhost' IDENTIFIED BY '';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON rentease_db.* TO 'rentease_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

### Automation Scripts
```powershell
# Local setup (one-time)
powershell -ExecutionPolicy Bypass -File scripts\phase8-local-setup.ps1 -SeedMode reseed

# API smoke tests
powershell -ExecutionPolicy Bypass -File scripts\phase8-api-smoke-test.ps1

# Account self-service tests
powershell -ExecutionPolicy Bypass -File scripts\phase9-account-smoke-test.ps1

# Onboarding flow tests
powershell -ExecutionPolicy Bypass -File scripts\phase10-onboarding-smoke-test.ps1
```

## API Endpoints

### Base URL
- **Development**: `http://localhost/rentease/backend`
- **Frontend Proxy**: `/backend/*` (Vite rewrites to backend)

### Health Check
- `GET /backend/auth.php?action=me` - Current session status

### Authentication
- `POST /backend/auth.php?action=login` - Login with email, password, role
- `POST /backend/auth.php?action=logout` - Logout and destroy session
- `POST /backend/auth.php?action=register` - Self-registration
- `POST /backend/auth.php?action=update_profile` - Update profile
- `POST /backend/auth.php?action=change_password` - Change password
- `POST /backend/google-auth.php?action=verify` - Google OAuth verification

### Core Modules
- `/backend/users.php` - User management
- `/backend/boarding_house.php` - Boarding house CRUD
- `/backend/rooms.php` - Room inventory
- `/backend/reservations.php` - Reservation workflow
- `/backend/payments.php` - Payment tracking
- `/backend/feedback.php` - Feedback and ratings
- `/backend/reports.php` - Analytics and reports
- `/backend/activity_logs.php` - Activity audit trail
- `/backend/error_logs.php` - Error tracking
- `/backend/uploads.php` - File upload handling
- `/backend/account_links.php` - Parent-seeker connections

## Version Requirements

### Minimum Versions
- PHP: 8.0+
- Node.js: 18.0+
- MySQL: 5.7+ or MariaDB: 10.0+
- npm: 8.0+

### Current Versions (package.json)
- React: 19.2.5
- React DOM: 19.2.5
- React Router: 7.14.2
- Vite: 8.0.10
- Tailwind CSS: 3.4.1
- ESLint: 10.2.1

## File Upload Constraints
- **Allowed Types**: PDF, JPG, PNG, WEBP
- **Max Size**: 5 MB
- **Storage**: `backend/storage/uploads/`
- **Access Control**: Role-scoped visibility

## Timezone Configuration
- **Default**: `Asia/Manila`
- Set in `backend/config.php` via `date_default_timezone_set()`
