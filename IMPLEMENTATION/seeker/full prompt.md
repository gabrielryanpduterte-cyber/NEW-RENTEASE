# RentEase - User Seeker/Boarder View + Parent/Guardian View Full-Stack Implementation Prompt

```text
====================================================================
RENTEASE — USER (SEEKER/BOARDER) VIEW + PARENT/GUARDIAN VIEW
FULL-STACK IMPLEMENTATION PROMPT
====================================================================
Stack: React (Vite) + React Router + Tailwind CSS + Axios
Backend: PHP 8.x Laravel 11 + Sanctum
Database: MySQL
Context: This continues the RentEase Boarding House Rental Management
System. The public homepage, room listing, and auth pages are already
built. Build everything related to the SEEKER/BOARDER role and the
PARENT/GUARDIAN tokenized view now.

====================================================================
SECTION 1: DATABASE CHANGES
====================================================================

Run these migrations in order:

--- 1A. Modify users table ---
Add columns:
  - profile_photo VARCHAR(255) NULL
  - emergency_contact_name VARCHAR(100) NULL
  - emergency_contact_number VARCHAR(20) NULL
  - school_or_workplace VARCHAR(150) NULL

--- 1B. Modify reservations table ---
Add columns:
  - valid_id_path VARCHAR(255) NULL
    (file path for uploaded government ID during reservation)
  - cancellation_reason TEXT NULL
  - cancelled_at TIMESTAMP NULL

--- 1C. Modify payments table ---
Add columns:
  - proof_of_payment_path VARCHAR(255) NULL
    (tenant-uploaded payment screenshot or receipt)
  - notes TEXT NULL

--- 1D. Create guardian_links table (NEW) ---
CREATE TABLE guardian_links (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_user_id  BIGINT UNSIGNED NOT NULL,
  guardian_name   VARCHAR(100) NOT NULL,
  guardian_email  VARCHAR(150) NOT NULL,
  access_token    CHAR(36) NOT NULL UNIQUE,  -- UUID v4
  status          ENUM('pending','active','revoked') DEFAULT 'active',
  last_accessed_at TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_access_token (access_token),
  INDEX idx_tenant (tenant_user_id)
);

NOTE: No expires_at by default — seeker controls validity via revoke.
Add expires_at if implementing auto-expiry later.

====================================================================
SECTION 2: BACKEND — LARAVEL
====================================================================

--- 2A. New Model: GuardianLink ---
- fillable: tenant_user_id, guardian_name, guardian_email,
  access_token, status, last_accessed_at
- belongsTo User (as tenant)
- Scope: active() → where status = 'active'
- Boot: generating access_token = Str::uuid() on creating

--- 2B. New Controller: GuardianLinkController ---

Methods:
  index()
    - Auth: seeker only
    - Returns all guardian_links for the authenticated user
    - Include: id, guardian_name, guardian_email, status,
      last_accessed_at, created_at, access_token

  store(Request $request)
    - Auth: seeker only
    - Validate: guardian_name (required, max 100),
      guardian_email (required, email, max 150)
    - Business rule: max 5 active guardian links per tenant
    - Create: access_token = Str::uuid()
    - Log activity: "Created guardian link for {guardian_name}"
    - Return: created guardian link record

  destroy($id)
    - Auth: seeker only, must own the link
    - Set status = 'revoked'
    - Log activity: "Revoked guardian link for {guardian_name}"
    - Return: success message

  publicView($token)
    - NO AUTH MIDDLEWARE — public route
    - Find guardian_link by access_token
    - If not found OR status != 'active': return 404 JSON error
    - Update last_accessed_at = now()
    - Load tenant's: current approved reservation → room →
      boarding house, last 3 payment records
    - Return structured JSON:
      {
        tenant_name: string,
        room: { number, type, rate, move_in_date, amenities[] },
        boarding_house: { name, address },
        landlord_contact: { name, contact_number },
        rent_current_month: { billing_period, status, amount_due,
          amount_paid, payment_date|null },
        rent_history: [ last 3 months ],
        last_updated: timestamp
      }

--- 2C. Modified: ReservationController ---

Add method: cancel($id)
  - Auth: seeker only, must own the reservation
  - Find reservation by id
  - Business rule: can only cancel if status = 'pending'
    If status = 'approved': return 403 with message
    "Approved reservations cannot be cancelled here.
     Please contact your landlord."
    If status = 'rejected' or 'cancelled': return 400
  - Update: status = 'cancelled', cancelled_at = now(),
    cancellation_reason = request input (optional)
  - Log: "Cancelled reservation for Room {room_number}"
  - Return: updated reservation

Add to store() validation:
  - valid_id: nullable, file, mimes:jpg,jpeg,png,pdf, max:5120
  - Store uploaded file to storage/app/private/ids/{user_id}/
  - Set valid_id_path in reservation record

--- 2D. Modified: PaymentController ---

Add method: uploadProof($paymentId)
  - Auth: seeker only
  - Find payment by id, confirm tenant_user_id matches auth user
  - Only allow if payment status = 'unpaid'
  - Validate: proof file, mimes:jpg,jpeg,png,pdf, max:5120
  - Store to storage/app/private/proofs/{user_id}/
  - Update proof_of_payment_path
  - Log: "Uploaded payment proof for billing period {period}"
  - Return: updated payment record
  NOTE: This does NOT change payment status.
  Only the landlord can mark as paid.

--- 2E. Routes (api.php) ---

Sanctum-protected routes (seeker middleware):
  GET    /api/user/dashboard          → UserDashboardController@index
  GET    /api/user/room               → UserDashboardController@myRoom
  GET    /api/user/reservations       → ReservationController@myIndex
  POST   /api/user/reservations       → ReservationController@store
  PATCH  /api/user/reservations/{id}/cancel → ReservationController@cancel
  GET    /api/user/payments           → PaymentController@myIndex
  POST   /api/user/payments/{id}/proof → PaymentController@uploadProof
  GET    /api/user/guardian-links     → GuardianLinkController@index
  POST   /api/user/guardian-links     → GuardianLinkController@store
  DELETE /api/user/guardian-links/{id} → GuardianLinkController@destroy
  GET    /api/user/profile            → UserProfileController@show
  PUT    /api/user/profile            → UserProfileController@update

Public (no auth — token protected):
  GET    /api/guardian/{token}        → GuardianLinkController@publicView

--- 2F. New Controller: UserDashboardController ---

index()
  - Returns composite dashboard data:
    - auth user info
    - active reservation (if any) with room details
    - current month payment record (if any)
    - pending reservations count
    - last 3 activity log entries for this user

myRoom()
  - Returns full room detail for the user's approved reservation
  - If no approved reservation: return null with message
  - Includes: room, boarding_house, amenities, house_rules,
    landlord (name + contact_number only)

====================================================================
SECTION 3: FRONTEND — REACT + TAILWIND
====================================================================

--- 3A. Design System (use existing RentEase tokens) ---
  --color-forest:   #1B4332
  --color-primary:  #2D6A4F
  --color-accent:   #52B788
  --color-cream:    #F8F5F0
  --color-gold:     #D4A853
  --color-dark:     #2C2C2A

Fonts: Playfair Display (headings), DM Sans (body/UI)
Status colors:
  Paid/Available:  #1D9E75 bg, #085041 text
  Unpaid/Occupied: #D85A30 bg, #4A1B0C text
  Pending:         #BA7517 bg, #412402 text
  Approved:        #2D6A4F bg, #E1F5EE text
  Rejected:        #A32D2D bg, #FCEBEB text
  Cancelled:       #888780 bg, #2C2C2A text

--- 3B. Routing (React Router) ---

/login                    → LoginPage
/register                 → RegisterPage
/                         → PublicHomePage
/rooms                    → RoomsListingPage
/rooms/:id                → RoomDetailPage
/guardian-view/:token     → GuardianViewPage (NO auth)

Protected (role: seeker/boarder):
/dashboard                → UserDashboard (layout wrapper)
  /dashboard              → DashboardHome
  /dashboard/room         → MyRoomPage
  /dashboard/reservations → MyReservationsPage
  /dashboard/rent         → RentStatusPage
  /dashboard/guardians    → GuardianAccessPage
  /dashboard/profile      → ProfilePage

--- 3C. Layout: UserDashboardLayout ---

Left sidebar (240px, sticky):
  - RentEase logo top
  - Navigation items with icons (Tabler Icons):
    Dashboard    → ti-home-2
    My Room      → ti-building
    Reservations → ti-file-description
    Rent Status  → ti-receipt
    Guardian Access → ti-users
    Profile      → ti-user-circle
  - Active state: forest green bg, white text, rounded-lg
  - Bottom: logout button with ti-logout icon
  - Mobile: bottom tab bar (5 icons, no labels)

Top bar: breadcrumb + user avatar + notification bell icon

--- 3D. Page: DashboardHome ---

Layout: single column, max-width 800px, centered

Top section — Welcome banner:
  "Welcome back, [First Name]" in Playfair Display 28px
  Subtext: current date (e.g. "Saturday, May 9, 2026")

Status cards row (2 across on desktop, stacked on mobile):

  ROOM STATUS CARD:
    If active room:
      Room photo thumbnail (rounded, 60x60)
      Room [number] · [type]
      "₱[rate] / month"
      Move-in: [date]
      Green dot + "Active tenant"
      Link: "View room details →"
    If no room:
      Empty illustration (simple SVG house outline)
      "You don't have a room yet."
      CTA button: "Browse Available Rooms"

  RENT STATUS CARD:
    Current month label (e.g. "May 2026")
    Large status: PAID (green) or UNPAID (coral) or "No record"
    If unpaid: "₱[amount] due" below status
    If paid: "Paid on [date]" below status
    Link: "View payment history →"

Below cards: Reservation quick status (if pending):
  Amber notice box: "You have a pending reservation for Room [X].
  Awaiting landlord approval."

--- 3E. Page: MyReservationsPage ---

Page header: "My Reservations"
Table columns: Room, Type, Date Submitted, Move-in Date,
               Status, Actions

Status pills: styled per 3A status colors

Actions column:
  - If status = 'pending': red outlined "Cancel" button
  - Clicking Cancel → opens CancelReservationModal

CancelReservationModal:
  Modal with backdrop (faux-fixed using min-height wrapper)
  Title: "Cancel Reservation" in Playfair
  Body: "Are you sure you want to cancel your reservation for
  Room [number]? This action cannot be undone."
  Textarea: "Reason for cancellation (optional)" — max 300 chars
  Buttons: "Keep Reservation" (outlined) + "Yes, Cancel It"
  (coral/red filled)
  On confirm: PATCH /api/user/reservations/{id}/cancel
  On success: toast + refresh table

Empty state: illustration + "No reservations yet." +
  "Browse Rooms" CTA

--- 3F. Page: MyRoomPage ---

If no approved reservation:
  Centered empty state card
  "You don't have an assigned room yet."
  Subtext: "Once your reservation is approved by the landlord,
  your room details will appear here."
  CTA: "Browse Rooms"

If approved reservation:
  Breadcrumb: Dashboard / My Room
  Room photo (full width, 300px height, object-fit: cover,
    rounded-xl)
  Room info: number badge, type, monthly rate (Playfair bold)
  Section: "Room Details"
    Grid: Capacity, Type, Amenities (icon + label chips)
  Section: "Boarding House"
    Name, address, house rules (numbered list)
  Section: "Landlord Contact"
    Card: name + ti-phone icon + contact number

--- 3G. Page: RentStatusPage ---

Current month highlight banner:
  If paid: green banner "✓ Rent Paid — May 2026"
  If unpaid: coral banner "⚠ Rent Unpaid — ₱[amount] due"
  If no record: gray banner "No rent record for May 2026"

Payment history table:
  Columns: Billing Period, Amount Due, Amount Paid, Status,
           Date Paid, Proof, Notes
  Proof column:
    If uploaded: file icon button → opens in new tab
    If not uploaded AND status=unpaid: "Upload" button
    If paid: "—"

UploadProofModal:
  Triggered by "Upload" button on unpaid row
  Title: "Upload Payment Proof"
  Subtext: "Upload a screenshot or receipt as reference for
  your landlord. This does not automatically update your
  payment status."
  File input: accept="image/*,.pdf" max 5MB
  Preview: show image preview OR filename for PDF
  Submit: POST /api/user/payments/{id}/proof (FormData)
  On success: toast "Proof uploaded. Awaiting landlord
  confirmation." + update row to show file icon

--- 3H. Page: GuardianAccessPage ---

Page header: "Guardian Access"
Subtext: "Allow a parent or guardian to view your room and
rent status without creating an account."

Add Guardian form (card):
  Guardian Name: text input (required)
  Guardian Email: email input (required)
  Button: "Generate Access Link" (forest green)
  On submit: POST /api/user/guardian-links
  On success: show new link in the list below

Active Guardians list:
  If empty: "No guardians linked yet." with info text.

  Each guardian row (card-style):
    Avatar circle: initials of guardian name
    Name + email
    Status pill (active/revoked)
    Last accessed: "X days ago" or "Never"
    Access link: monospace text field (truncated) +
      "Copy Link" button (copies full URL to clipboard)
    "Revoke Access" button (outlined red, small)

RevokeConfirmModal:
  "Revoke access for [Guardian Name]?"
  "They will no longer be able to view your information."
  Buttons: Cancel + "Revoke Access" (red)

Max 5 guardians note shown if limit reached.

--- 3I. Page: ProfilePage ---

Two-section layout (stacked):

Section 1 — Personal Info:
  Profile photo: circular (96px), click to change
    Overlay "Change Photo" on hover
    File input (image only, max 2MB)
    Shows preview immediately on file select
  Fields: Full Name, Email (disabled, grayed), Contact Number,
    School / Workplace (optional)
  Save Changes button → PUT /api/user/profile

Section 2 — Emergency Contact:
  Helper text: "Your emergency contact information is only
  visible to the landlord in case of emergency."
  Fields: Emergency Contact Name, Emergency Contact Number
  Save button (separate from section 1)

Section 3 — Change Password:
  Current Password, New Password, Confirm New Password
  Password strength indicator (weak/fair/strong)
  Update Password button

====================================================================
SECTION 4: GUARDIAN VIEW PAGE (PUBLIC)
====================================================================

Route: /guardian-view/:token
Auth: NONE. Token is the credential.

On mount:
  GET /api/guardian/{token}
  Show loading skeleton while fetching.

If error (invalid/revoked token):
  Centered card on cream background
  RentEase logo
  Red icon (ti-link-off)
  "This link is no longer valid"
  "The access to this information has been revoked or the link
  has expired. Please ask your family member to send you a
  new link."
  No other links or navigation.

If success — render GuardianViewLayout:

Design: no sidebar, centered column, max-width 560px, cream bg.
Top bar: RentEase logo left + "Guardian View" amber badge right.

Banner (top of content):
  "Viewing information for [Tenant Full Name]"
  Forest green left border accent, cream background.

Section 1 — Room Status (card):
  Card header: ti-building icon + "Current Room"
  Room photo if available (200px height, cover)
  Room number (large, Playfair)
  Room type badge
  Boarding house name
  Address (with ti-map-pin icon)
  Monthly rate (₱ formatted)
  Move-in date

Section 2 — Rent Status (card):
  Card header: ti-receipt icon + "Rent Status"
  Current month name (e.g. "May 2026")
  Large status display:
    PAID → big green circle-check icon + "PAID" text
    UNPAID → big coral warning icon + "UNPAID" text +
      "₱[amount] due"
    No record → gray "—" + "No record for this month"
  Payment history (last 3 months):
    Simple rows: month label + status pill + date paid (if any)

Section 3 — Contact (card):
  Card header: ti-phone icon + "Landlord Contact"
  Landlord name
  Contact number
  Note: "For questions about accommodation, contact
  the landlord directly."

Footer (outside cards):
  "Information last updated: [timestamp]"
  "Powered by RentEase"
  No links, no nav.

====================================================================
SECTION 5: SHARED COMPONENTS & UX DETAILS
====================================================================

StatusPill component:
  Props: status (paid|unpaid|pending|approved|rejected|cancelled
    |active|revoked)
  Map each to color + label. 11px DM Sans uppercase font-weight 500.

Toast notifications:
  Top-right, auto-dismiss after 4 seconds.
  Types: success (green), error (red), info (blue), warning (amber).
  Use a React context (ToastContext) for global access.

ConfirmModal component (reusable):
  Props: title, body, confirmLabel, confirmVariant (danger|primary),
    onConfirm, onCancel, isLoading
  Shows spinner on confirm button while isLoading.

FileUpload component:
  Props: accept, maxSizeMB, onFileSelect, preview (boolean)
  Shows file name + size after selection.
  Validates client-side before submit.
  Shows error message if too large or wrong type.

LoadingSkeleton:
  Pulse animation (Tailwind animate-pulse).
  Used on: dashboard cards, table rows, room detail.

EmptyState component:
  Props: icon (Tabler icon name), title, description, cta (optional)
  Simple centered layout with muted icon above.

====================================================================
SECTION 6: ACTIVITY LOGGING (add these entries)
====================================================================

On every listed action, insert to activity_logs:
  user_id = auth user
  module = relevant module string
  action = descriptive past-tense string
  timestamp = now()

Events to log:
  "Submitted reservation for Room {room_number}"
  "Cancelled reservation for Room {room_number}"
  "Uploaded payment proof for {billing_period}"
  "Created guardian link for {guardian_name}"
  "Revoked guardian link for {guardian_name}"
  "Updated profile information"
  "Changed password"
  Guardian view access is logged with guardian_link_id reference
    in the notes field: "Guardian [{guardian_name}] viewed data"

====================================================================
SECTION 7: VALIDATION RULES SUMMARY
====================================================================

Registration (additional fields):
  emergency_contact_name: sometimes|string|max:100
  emergency_contact_number: sometimes|string|max:20|regex:phone
  school_or_workplace: nullable|string|max:150

Reservation creation:
  room_id: required|exists:rooms,id
  move_in_date: required|date|after:today
  message: nullable|string|max:500
  valid_id: nullable|file|mimes:jpg,jpeg,png,pdf|max:5120

Reservation cancellation:
  cancellation_reason: nullable|string|max:300

Payment proof upload:
  proof: required|file|mimes:jpg,jpeg,png,pdf|max:5120

Guardian link creation:
  guardian_name: required|string|max:100
  guardian_email: required|email|max:150
  Business: max 5 active links per user (count check)

Profile update:
  profile_photo: nullable|image|max:2048
  full_name: required|string|max:100
  contact_number: required|string|max:20
  school_or_workplace: nullable|string|max:150
  emergency_contact_name: nullable|string|max:100
  emergency_contact_number: nullable|string|max:20

====================================================================
SECTION 8: FILE STORAGE STRUCTURE
====================================================================

Use Laravel's storage disk (private, not public):
  storage/app/private/
    ids/{user_id}/{filename}          ← reservation ID uploads
    proofs/{user_id}/{filename}       ← payment proof uploads
    profiles/{user_id}/{filename}     ← profile photos (public)

Profile photos → public disk (accessible via URL).
ID uploads and payment proofs → private disk (only accessible
  through authenticated controller responses using
  Storage::download() or signed URLs).

====================================================================
END OF PROMPT
====================================================================
```

## Implementation Note

This is a reference prompt only. Do not treat these requirements as implemented until the database, backend, frontend, and QA work are completed in code.
