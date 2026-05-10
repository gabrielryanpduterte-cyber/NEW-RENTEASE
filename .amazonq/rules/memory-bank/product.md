# RENTEASE - Product Overview

## Purpose
RENTEASE is a comprehensive role-based boarding house management system designed to streamline the entire lifecycle of boarding house operations, from room listings and reservations to payments and feedback management.

## Value Proposition
- Centralized platform for boarding house owners to manage properties, rooms, and tenants
- Simplified reservation and payment tracking for seekers (tenants)
- Parent oversight capabilities for monitoring dependent seekers
- Administrative controls for system-wide management and reporting
- Secure, role-based access control ensuring data privacy and appropriate permissions

## Target Users

### Seeker (Tenant)
- Browse available boarding houses and rooms
- Submit reservation requests
- Track payment history
- Upload supporting documents (IDs, requirements)
- Submit feedback and ratings
- Manage personal profile and account settings

### Parent (Guardian)
- Monitor linked seeker accounts (children/dependents)
- View seeker reservations and payment status
- Access seeker activity logs
- Approve/manage parent-seeker account connections
- Submit feedback on behalf of linked seekers

### Owner (Landlord)
- Manage boarding house details and room inventory
- Approve/reject reservation requests
- Record and track payments
- View occupancy and income reports
- Respond to feedback and ratings
- Upload property-related documents

### Admin (System Administrator)
- Full system oversight and user management
- Access comprehensive reports (income, occupancy, payment status)
- View activity and error logs with filtering
- Moderate feedback and ratings
- Manage all boarding houses, rooms, and reservations

## Key Features

### Authentication & Authorization
- Email/password login with role selection
- Optional Google OAuth integration (Phase 12)
- Self-registration for seekers, parents, and owners
- Session-based authentication with secure cookie handling
- Strict RBAC enforcement across all endpoints

### Core Management Modules
- **Users**: Profile management, password changes, role-based access
- **Boarding Houses**: Property listings with details and amenities
- **Rooms**: Room inventory with pricing, capacity, and availability
- **Reservations**: Request submission, approval workflow, status tracking
- **Payments**: Payment recording, history, and verification

### Advanced Features
- **Reports**: Income analysis, payment status, occupancy rates, reservation statistics
- **Activity Logs**: Comprehensive audit trail with filtering and pagination
- **Error Logs**: System error tracking for debugging and monitoring
- **Feedback/Ratings**: Submission, visibility controls, moderation tools
- **File Uploads**: PDF/image attachments with role-scoped access (5MB limit)
- **Parent-Seeker Linking**: Connection requests, approval workflow, monitoring access

### Security & Compliance
- Input validation and sanitization
- Prepared statements preventing SQL injection
- Sanitized error responses
- Session/cookie hardening
- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- CORS configuration with allowed origins

## Use Cases

### Seeker Journey
1. Register account and complete profile
2. Browse available rooms and boarding houses
3. Submit reservation request with required documents
4. Wait for owner approval
5. Receive confirmation and payment instructions
6. Upload payment proof
7. Submit feedback after move-in

### Owner Journey
1. Register and set up boarding house profile
2. Add room inventory with details and pricing
3. Receive and review reservation requests
4. Approve/reject based on requirements
5. Record payments and update reservation status
6. Monitor occupancy and income through reports
7. Respond to feedback and maintain ratings

### Parent Journey
1. Register parent account
2. Request connection to seeker account (child/dependent)
3. Wait for seeker approval
4. Monitor seeker's reservations and payments
5. View activity logs and ensure safety
6. Provide feedback on boarding house experience

### Admin Journey
1. Monitor system-wide activity through logs
2. Generate reports for analysis and insights
3. Moderate inappropriate feedback
4. Manage user accounts and resolve disputes
5. Ensure system health and security
