# RENTEASE - Project Structure

## Directory Organization

```
NEW RENTEASE/
├── backend/              # PHP API layer
├── frontend/             # React SPA
├── database/             # SQL schemas and migrations
├── scripts/              # Automation and testing scripts
├── docs/                 # Documentation and guides
├── design/               # Design references and compliance docs
└── .amazonq/             # Amazon Q rules and memory bank
```

## Backend Structure (`backend/`)

### Core API Modules
- `auth.php` - Authentication, login, logout, session management, profile updates, password changes
- `users.php` - User CRUD operations, role management
- `boarding_house.php` - Boarding house management (owner-specific)
- `rooms.php` - Room inventory and availability
- `reservations.php` - Reservation requests, approval workflow, status updates
- `payments.php` - Payment recording and history tracking
- `feedback.php` - Feedback submission, visibility, moderation
- `reports.php` - Income, occupancy, payment status, reservation statistics
- `activity_logs.php` - Activity audit trail with filtering
- `error_logs.php` - Error tracking and debugging
- `uploads.php` - File upload handling with role-scoped access
- `account_links.php` - Parent-seeker connection management (Phase 10)
- `google-auth.php` - Google OAuth integration (Phase 12)

### Configuration & Utilities
- `config.php` - Database connection, CORS, session setup, security headers
- `config/google-oauth.php` - Google OAuth backend configuration
- `helpers.php` - Shared utility functions
- `check-migration.php` - Database migration status checker
- `test-google-auth.php` - Google authentication testing endpoint

### Storage
- `storage/uploads/` - User-uploaded files (PDFs, images)
- `vendor/` - Composer dependencies (PHPMailer, autoloader)

### Architecture Pattern
- **Request-Response API**: Each module handles specific actions via query parameters (`?action=...`)
- **Session-based Auth**: PHP sessions with secure cookie configuration
- **RBAC Enforcement**: Role checks on every protected endpoint
- **PDO with Prepared Statements**: SQL injection prevention
- **Centralized Config**: Single source for DB connection and CORS

## Frontend Structure (`frontend/`)

### Source Organization (`src/`)
- `api/` - Backend API client functions
- `auth/` - Authentication context and providers
- `components/` - Reusable UI components (shadcn/ui integration)
- `config/` - Frontend configuration (Google OAuth)
- `context/` - React context providers
- `hooks/` - Custom React hooks
- `lib/` - Utility libraries (cn helper for Tailwind)
- `pages/` - Route-based page components
- `utils/` - Helper functions and utilities
- `App.jsx` - Main application component with routing
- `main.jsx` - Application entry point
- `index.css` - Global styles with Tailwind directives

### Public Assets (`public/`)
- `favicon.svg` - Application favicon
- `icons.svg` - SVG icon sprite

### Configuration Files
- `vite.config.js` - Vite build configuration with backend proxy
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration for Tailwind
- `eslint.config.js` - ESLint rules and configuration
- `components.json` - shadcn/ui component configuration
- `package.json` - Dependencies and scripts

### Architecture Pattern
- **Component-Based**: Modular React components with composition
- **Context API**: Global state management for authentication
- **React Router**: Client-side routing with role-based dashboards
- **Vite Proxy**: Development proxy to backend (`/backend/*` → `http://localhost/rentease/backend/*`)
- **Tailwind CSS**: Utility-first styling with shadcn/ui components

## Database Structure (`database/`)

### Schema Files
- `rentease_final_phase7.sql` - Complete Phase 7 baseline schema with demo data
- `phase8_uploads_schema.sql` - File upload tracking table
- `phase10_parent_seeker_links_schema.sql` - Parent-seeker connection table
- `phase11_email_verification_schema.sql` - Email verification (not implemented)
- `phase12_google_oauth_schema.sql` - Google OAuth user columns

### Migration & Maintenance
- `phase7_demo_seed.sql` - Demo data reseed script
- `safe_google_oauth_migration.sql` - Safe Google OAuth column addition
- `verify_migration.sql` - Migration verification queries
- `clean_test_data.sql` - Test data cleanup
- `delete_test_users.sql` - Remove test users

### Database Schema Overview
- `users` - User accounts with roles (admin, owner, seeker, parent)
- `boarding_houses` - Property listings owned by users
- `rooms` - Room inventory linked to boarding houses
- `reservations` - Reservation requests with approval workflow
- `payments` - Payment records linked to reservations
- `feedback` - Ratings and reviews with moderation flags
- `activity_logs` - Audit trail of user actions
- `error_logs` - System error tracking
- `uploads` - File metadata with role-scoped access
- `parent_seeker_links` - Parent-seeker connections with approval status

## Scripts Structure (`scripts/`)

### Automation Scripts (PowerShell)
- `phase8-local-setup.ps1` - One-time XAMPP setup, DB user creation, symlink
- `phase8-api-smoke-test.ps1` - API endpoint validation for all roles
- `phase9-account-smoke-test.ps1` - Account self-service validation
- `phase10-onboarding-smoke-test.ps1` - Real-user onboarding flow validation
- `clean-database.ps1` - Database cleanup utility

## Documentation Structure (`docs/`)

### Active Documentation
- `DEFENSE_RUNBOOK.md` - Defense presentation walkthrough
- `PHASE12_SUMMARY.md` - Phase 12 Google OAuth summary
- `PHASE12_QUICK_REFERENCE.md` - Quick reference for Phase 12
- `PHASE12_FOOTPRINT_LOG.md` - Phase 12 implementation log
- `PHASE7_FOOTPRINT_LOG.md` - Phase 7 implementation log

### Archived Guides (`docs/archive/`)
- Phase implementation guides (1-10)
- Setup and troubleshooting guides
- Email verification documentation
- Google authentication guides
- Design and implementation summaries

### Specialized Docs
- `docs/email/` - Email setup alternatives and status
- `docs/testing/` - Testing guides and credentials
- `docs/troubleshooting/` - Issue resolution guides

## Design Documentation (`design/`)
- `DESIGN_REFERENCE.md` - Design system reference
- `IMPLEMENTATION_STATUS.md` - Feature implementation tracking
- `QUICK_REFERENCE.md` - Quick design reference
- `RENTEASE_V2_COMPLIANCE.md` - Version 2 compliance checklist

## Component Relationships

### Authentication Flow
1. Frontend login form → `frontend/src/pages/Login.jsx`
2. API call → `frontend/src/api/auth.js`
3. Backend validation → `backend/auth.php?action=login`
4. Session creation → `backend/config.php` (session setup)
5. Context update → `frontend/src/auth/context.js`
6. Dashboard redirect → `frontend/src/App.jsx` (routing)

### Reservation Flow
1. Seeker browses rooms → `frontend/src/pages/seeker/`
2. Submit reservation → `backend/reservations.php?action=create`
3. Owner receives notification → `frontend/src/pages/owner/`
4. Owner approves → `backend/reservations.php?action=update_status`
5. Payment recording → `backend/payments.php?action=create`
6. Feedback submission → `backend/feedback.php?action=create`

### Parent-Seeker Linking Flow
1. Parent requests link → `backend/account_links.php?action=request_link`
2. Seeker receives notification → `frontend/src/pages/seeker/`
3. Seeker approves → `backend/account_links.php?action=respond_to_request`
4. Parent gains monitoring access → `backend/account_links.php?action=get_linked_seekers`

## Architectural Patterns

### Backend Patterns
- **Action-based routing**: Single file per module with action parameter
- **Centralized configuration**: Shared config.php for all modules
- **Prepared statements**: PDO with parameter binding
- **Role-based guards**: Session role checks before data access
- **Standardized responses**: JSON with success, message, data, errors structure

### Frontend Patterns
- **Protected routes**: Authentication checks before rendering
- **Role-based dashboards**: Separate page trees per role
- **API abstraction**: Centralized API client functions
- **Context providers**: Global auth state management
- **Component composition**: Reusable UI components with props
- **Utility-first CSS**: Tailwind with shadcn/ui components
