# RENTEASE Project Roadmap

This document is the implementation guide for building RENTEASE end-to-end.  
Scope in this file is planning and execution flow only. No code is included here.

## Core Build Strategy

Follow this development order strictly:

1. Database schema
2. PHP authentication
3. PHP rooms module
4. React login
5. React room listing
6. Expand outward feature by feature

Do not build all UI pages first before backend validation. Connect frontend and backend incrementally as each feature is completed.

## Phase 1: Foundation Setup

Objective: Prepare local environment and project structure.

Tasks:
- Run and verify XAMPP services (Apache + MySQL).
- Scaffold folder structure:
  - `rentease/frontend/`
  - `rentease/backend/`
  - `rentease/database/`
- Create the MySQL database in phpMyAdmin.
- Confirm initial connectivity assumptions (PHP can reach MySQL).

Exit criteria:
- XAMPP is operational.
- Folder scaffolding exists.
- Empty project database exists and is accessible.

## Phase 2: Database Implementation

Objective: Build the complete schema exactly from the approved ERD in the docx.

Required tables:
- `users`
- `boarding_house`
- `rooms`
- `reservations`
- `payments`
- `activity_logs`
- `error_logs`

Tasks:
- Implement all 7 tables according to ERD field definitions and relationships.
- Apply primary keys, foreign keys, constraints, and indexes per design.
- Validate schema integrity with test inserts/selects.
- Export SQL dump as clean baseline backup.

Exit criteria:
- All 7 tables match ERD exactly.
- Relationships and constraints are working.
- Baseline SQL export is saved.

## Phase 3: PHP Backend APIs

Objective: Build resource-based PHP endpoints returning JSON.

Architecture rule:
- One file per resource (for example: `rooms.php`, `reservations.php`, `payments.php`).

Priority sequence:
1. Authentication
2. RBAC (role-based access control)
3. Remaining resources

Tasks:
- Implement auth endpoints first (register/login/session/token strategy as selected).
- Enforce RBAC in protected endpoints before business features.
- Build CRUD/resource handlers for rooms, reservations, payments, and other required modules.
- Standardize JSON response structure and HTTP status handling.

Exit criteria:
- Auth works reliably.
- RBAC gates are enforced.
- Core resource endpoints respond with correct JSON and status codes.

## Phase 4: React Frontend

Objective: Build role-based UI with protected navigation.

Required dashboards/views:
- Seeker dashboard
- Owner dashboard
- Admin dashboard
- Parent view

Tasks:
- Implement React Router routes.
- Build authentication context for role/session state.
- Add route/page protection by role.
- Create initial dashboard and key page shells for each role.

Exit criteria:
- Role-aware navigation works.
- Unauthorized users are blocked from protected routes.
- All required role views are reachable after login.

## Phase 5: Frontend-Backend Integration

Objective: Wire React and PHP, then validate complete user flows.

Tasks:
- Connect React to PHP endpoints via Axios.
- Test full journey flows (registration through income reporting).
- Resolve CORS configuration issues between frontend and backend.
- Verify API error handling and loading states on UI.

Exit criteria:
- End-to-end flows execute successfully.
- CORS is stable in development.
- Critical integration bugs are resolved.

## Phase 6: Feature Completion and Hardening

Objective: Complete remaining functional and non-functional requirements.

Tasks:
- Implement reports.
- Build logs viewer.
- Add feedback/ratings.
- Finish responsive behavior across device sizes.
- Apply security hardening (input validation, authorization checks, safe error exposure, etc.).

Exit criteria:
- Remaining features are complete.
- UX is responsive.
- Security posture is improved and reviewed.

## Phase 7: Finalization and Defense Prep

Objective: Package the project for submission/demo.

Tasks:
- Seed demo-ready data.
- Write/complete `README.md`.
- Export final SQL dump.
- Prepare defense walkthrough sequence.

Exit criteria:
- Demo data supports full scenario walkthrough.
- Documentation is complete.
- Final database export is archived.
- Defense runbook is ready.

## Suggested Milestone Checklist

- [ ] Phase 1 complete
- [ ] Phase 2 complete
- [ ] Phase 3 complete
- [ ] Phase 4 complete
- [ ] Phase 5 complete
- [ ] Phase 6 complete
- [ ] Phase 7 complete

## Notes for Execution Discipline

- Validate each module before moving forward.
- Keep SQL dumps at key milestones, not only at the end.
- Avoid parallel feature sprawl; prioritize vertical slices (DB -> API -> UI).
- Treat auth/RBAC as blockers for all protected features.
