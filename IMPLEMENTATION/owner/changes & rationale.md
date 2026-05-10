# Changes & Rationale

The landlord is the operational core of RentEase. All deliberate changes below improve real boarding house management workflows, not just CRUD. Each change is tagged by the layer it affects.

## Database Changes DB

### New table: room_amenities

Normalize amenities as a many-to-many instead of a comma-string field. A landlord needs to manage amenities per room flexibly without parsing strings.

Fields:

- id
- room_id FK
- amenity_name
- amenity_icon string

### Modified: rooms table

Add photos, floor number, archive support, and landlord-only notes.

Purpose:

- photos stores a JSON array of file paths.
- floor_number is nullable.
- is_archived soft-deletes rooms without losing history.
- notes stores internal landlord notes and is not shown to seekers.

Fields:

- photos JSON NULL
- floor_number TINYINT NULL
- is_archived BOOL DEFAULT 0
- notes TEXT NULL

### New table: billing_cycles

Instead of ad-hoc payment records, the landlord defines monthly billing cycles per tenant. This makes monthly income reporting accurate and predictable.

Fields:

- id
- reservation_id FK
- user_id FK
- room_id FK
- billing_month YYYY-MM
- amount_due
- due_date
- generated_at
- created_by landlord user_id

### Modified: payments table

Add billing_cycle_id FK to link payments to their billing cycle. Also add payment_method and received_by.

Fields:

- billing_cycle_id FK NULL
- payment_method ENUM cash/gcash/bank/other
- received_by FK NULL

### Modified: boarding_houses table

Add owner-facing profile fields for stronger public listing quality.

Fields:

- cover_photo VARCHAR NULL
- house_rules TEXT
- amenities_list TEXT/JSON
- contact_number VARCHAR
- facebook_page VARCHAR NULL

## Backend Changes BE

### New: BillingCycleController

Landlord generates monthly billing for all active tenants or per tenant. System can auto-populate billing_cycle records at the start of each month or through a manual trigger. This drives the income report.

### New: RoomPhotoController

Handles multi-photo upload per room, up to 5 photos. Stores to storage/app/public/rooms/{room_id}/. Returns ordered URLs.

### New: ReportController

Generates:

- Monthly income report by billing_cycles and payments
- Occupancy report for rooms filled vs total
- Reservation statistics
- Unpaid tenants list

All reports are exportable as JSON for frontend chart rendering.

### Modified: ReservationController

Add approve() and reject() with business rules:

- Approving a reservation automatically sets the room's availability_status to "occupied".
- Approving creates the first billing_cycle record for that tenant's move-in month.
- Rejecting sends a remark back.

### Modified: PaymentController

markAsPaid() now accepts:

- payment_method
- amount_paid
- notes

Landlord can also markAsUnpaid() to reverse a mistake. All payment confirmations log who confirmed and when.

### RBAC Middleware

All landlord routes are protected by role:owner middleware. A landlord can only manage rooms, reservations, and tenants belonging to their own boarding_house_id.

## Frontend Changes FE

### New: Landlord dashboard layout

Separate layout component from the seeker dashboard. Wider sidebar with grouped nav sections:

- Operations
- Finances
- Settings

### New: Multi-photo room form

Drag-and-drop photo upload with reorder capability. Preview grid. Max 5 photos per room.

### New: Billing generation UI

"Generate Monthly Bills" action on the Rent Tracking page. Selects month, previews which tenants get a bill, confirms. Sends to backend to create billing_cycle records.

### New: Income Report page

Bar chart using Recharts showing monthly income for the last 12 months. Breakdown table per month. Export button prints to PDF via browser.

### New: Reservation detail modal

When approving or rejecting, shows:

- Applicant's full profile
- Uploaded valid ID view button
- Requested room
- Move-in date

Reject includes a remarks textarea.

### New: Tenant profile drawer

Clicking a tenant in any table opens a right-side drawer with:

- Full profile
- Current room
- Payment history
- Contact info

No separate page navigation needed.

## Key UX Decisions UX

Approving a reservation auto-sets room to "Occupied" and creates the first billing cycle. Without this automation, a landlord has to do 3 steps after approval. The system does it in one.

Rooms use soft-delete with is_archived, not hard delete. Deleting a room with a payment history destroys financial records. Archived rooms disappear from public listing but all historical data is preserved.

Billing cycles are landlord-controlled, not automatic. In Philippine boarding houses, billing dates vary per tenant. Some pay on move-in anniversary, some on the 1st. The landlord triggers billing generation rather than a cron job doing it blindly.

Payment method is recorded. Real landlords care whether they received GCash, cash, or bank transfer. This is a 30-second UX addition that makes the system genuinely useful compared with a generic template.
