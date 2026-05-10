# Overview & Changes

This plan introduces deliberate changes from the original docx where they improve UX, close logic gaps, or are necessary for the parent-link system to work. Each change is tagged by layer.

## What Changes And Why

### Database Changes

**DB**

New table: `guardian_links` - manages the parent/guardian access connection. A seeker can invite multiple guardians; each link has its own token, expiry, and status. This decouples guardian access from the `users` table so a guardian doesn't need a full account.

- `id`
- `tenant_user_id` FK
- `guardian_email`
- `guardian_name`
- `access_token` UUID
- `status` pending|active|revoked
- `expires_at`
- `last_accessed_at`
- `created_at`

Modified: `users` table - Add profile photo and onboarding fields needed for boarding house tenant reality.

- `profile_photo` nullable
- `emergency_contact_name`
- `emergency_contact_number`
- `school_or_workplace` nullable

Modified: `reservations` table - Add ID verification and cancellation fields.

- `valid_id_path` nullable
- `cancellation_reason` nullable
- `cancelled_at` nullable

Modified: `payments` table - Add payment proof and notes.

- `proof_of_payment_path` nullable
- `notes` nullable

### Backend Changes

**BE**

New controller: `GuardianLinkController` - handles create, revoke, view, and the token-based public access route for guardians. Guardian access is tokenized, not account-based. A guardian visits a magic link like `/guardian-view/{token}` with no registration required.

New route group: `/api/guardian` - public routes protected only by token validation, separate from Sanctum auth middleware.

Modified: `ReservationController` - add `cancel()` method with business rule: seeker can only cancel a pending reservation, not an approved reservation. If approved, they must contact the landlord.

Modified: `PaymentController` - add `uploadProof()` to allow tenant to attach a payment screenshot. Landlord still controls the paid/unpaid status. This proof is informational only.

New activity log entries for:

- Guardian link created
- Guardian link revoked
- Guardian viewed data
- Reservation cancelled by seeker

### Frontend Changes

**FE**

New route: `/guardian-view/:token` - completely separate, no auth wall, minimal UI. Guardian sees a read-only snapshot of the tenant's room and rent status. Renders a "Guest View" notice.

New seeker dashboard page: `Guardian Access` - manage who has access, invite by email and name, see last-accessed time, revoke access.

New reservation cancellation flow - cancel button on pending reservations with confirmation modal and optional cancellation reason text field.

New payment proof upload - on the Rent Status page, tenant can attach a file, image, or PDF alongside an unpaid entry. Shows upload state and landlord-confirmation note.

Modified registration form - added emergency contact fields and school/workplace field for realism.

## UX Decisions & Rationale

**UX**

Guardian access is tokenized, not account-based. Requiring a parent to register an account creates friction and orphan accounts. A magic link is simpler, more realistic, and how services like Airbnb handle guest-access patterns.

Seekers cannot cancel approved reservations themselves. This protects the landlord. Only pending reservations can be self-cancelled. Approved reservations require landlord coordination, and clear messaging explains why.

Payment proof is upload-only, not status-changing. Tenants often want to show "I paid", but payment confirmation must remain the landlord's responsibility. The upload is a communication tool, not a payment gateway bypass.

Dashboard uses a welcome banner with room status at the top. The first thing a boarder needs to see is: "Do I have a room?" and "Is my rent due?" Everything else is secondary. This is the informational hierarchy applied.

## Implementation Note

This document is a guide only. Do not treat these items as implemented until the database, backend, frontend, and QA tasks are completed in code.
