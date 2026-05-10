====================================================================
RENTEASE — OWNER / LANDLORD VIEW
FULL-STACK IMPLEMENTATION PROMPT
====================================================================

TECH STACK (continue from existing project):
  Frontend : React (Vite) + React Router DOM + Tailwind CSS
             + Axios + Recharts + lucide-react / Tabler Icons
             + react-datepicker
  Backend  : PHP 8.x Laravel 11 + Laravel Sanctum (RBAC)
  Database : MySQL 8.x
  Server   : Apache via XAMPP (local dev)
  Storage  : Laravel Storage (public disk for room/boarding
             house photos, private disk for ID/proof files)

Context: The public homepage, room listing, auth pages (login/
register), and seeker/parent views are already built.
Build everything for the OWNER / LANDLORD role now.

====================================================================
SECTION 1: DATABASE MIGRATIONS
====================================================================

Run in this order:

--- 1A. Modify boarding_houses table ---
ALTER TABLE boarding_houses ADD COLUMN:
  cover_photo         VARCHAR(255) NULL,
  contact_number      VARCHAR(20)  NULL,
  facebook_page       VARCHAR(255) NULL,
  amenities_list      JSON         NULL
    (e.g. ["WiFi","Water","Electric","Parking"])

--- 1B. Modify rooms table ---
ALTER TABLE rooms ADD COLUMN:
  photos        JSON     NULL
    (ordered array of file paths, max 5)
  floor_number  TINYINT  NULL,
  is_archived   BOOLEAN  NOT NULL DEFAULT 0,
  notes         TEXT     NULL
    (internal landlord notes, not public-facing)

--- 1C. Create room_amenities table ---
CREATE TABLE room_amenities (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  room_id      BIGINT UNSIGNED NOT NULL,
  amenity_name VARCHAR(80)  NOT NULL,
  amenity_icon VARCHAR(50)  NULL,
    (Tabler icon name string e.g. "ti-wifi")
  sort_order   TINYINT      NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  INDEX idx_room (room_id)
);

--- 1D. Create billing_cycles table ---
CREATE TABLE billing_cycles (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reservation_id  BIGINT UNSIGNED NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  room_id         BIGINT UNSIGNED NOT NULL,
  billing_month   CHAR(7)         NOT NULL,
    (format: YYYY-MM e.g. "2026-05")
  amount_due      DECIMAL(10,2)   NOT NULL,
  due_date        DATE            NULL,
  generated_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  created_by      BIGINT UNSIGNED NOT NULL,
    (landlord user_id who triggered generation)
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (user_id)        REFERENCES users(id),
  FOREIGN KEY (room_id)        REFERENCES rooms(id),
  FOREIGN KEY (created_by)     REFERENCES users(id),
  UNIQUE KEY uq_tenant_month (reservation_id, billing_month),
  INDEX idx_month (billing_month),
  INDEX idx_user  (user_id)
);

--- 1E. Modify payments table ---
ALTER TABLE payments ADD COLUMN:
  billing_cycle_id  BIGINT UNSIGNED NULL,
  payment_method    ENUM('cash','gcash','bank_transfer','other')
                    NULL DEFAULT 'cash',
  received_by       BIGINT UNSIGNED NULL,
    (landlord user_id who confirmed payment)
  FOREIGN KEY (billing_cycle_id)
    REFERENCES billing_cycles(id) ON DELETE SET NULL,
  FOREIGN KEY (received_by)
    REFERENCES users(id) ON DELETE SET NULL

--- 1F. Modify reservations table ---
ALTER TABLE reservations ADD COLUMN:
  rejection_remarks TEXT NULL
    (required when landlord rejects a reservation)

====================================================================
SECTION 2: LARAVEL BACKEND
====================================================================

--- 2A. Models ---

BoardingHouse model:
  - fillable: owner_id, name, address, description, cover_photo,
    contact_number, facebook_page, house_rules, amenities_list
  - Cast: amenities_list → array
  - hasMany: rooms (through room_id → boarding_house_id)
  - belongsTo: owner (User)

Room model:
  - fillable: boarding_house_id, room_number, room_type, floor_number,
    capacity, monthly_rate, availability_status, photos, notes,
    is_archived
  - Cast: photos → array
  - hasMany: room_amenities, reservations
  - Scope: active() → where('is_archived', false)
  - Scope: available() → active()->where('availability_status','available')

RoomAmenity model:
  - fillable: room_id, amenity_name, amenity_icon, sort_order
  - belongsTo: room

BillingCycle model:
  - fillable: reservation_id, user_id, room_id, billing_month,
    amount_due, due_date, generated_at, created_by
  - hasOne: payment (via billing_cycle_id)
  - belongsTo: tenant (User, via user_id)
  - belongsTo: room
  - belongsTo: reservation

Payment model (existing — extend):
  - Add to fillable: billing_cycle_id, payment_method, received_by
  - belongsTo: billingCycle

--- 2B. Controllers ---

BoardingHouseController:
  show()
    Auth: owner
    Returns own boarding house with rooms count, amenities,
    cover_photo URL
  update(Request)
    Auth: owner
    Validate all fields. Handle cover_photo upload → store to
    public disk at "boarding_houses/{user_id}/cover.{ext}"
    Update amenities_list as JSON array.
    Log: "Updated boarding house profile"
  updateHouseRules(Request)
    Auth: owner
    Validate: house_rules required|string|max:3000
    Update house_rules field
    Log: "Updated house rules"

RoomController (extend existing):
  index()
    Auth: owner
    Returns all rooms for owner's boarding_house_id
    Include: amenities, occupant (current approved tenant),
    first photo URL, reservation count
    Separate active and archived rooms in response.
  store(Request)
    Auth: owner
    Validate: room_number, room_type, capacity, monthly_rate,
      floor_number (nullable), notes (nullable),
      photos (nullable, array, max 5, each image max 2MB)
      amenities (nullable, array of {name, icon})
    Upload photos → storage/public/rooms/{room_id}/
    Store photo paths as JSON in rooms.photos
    Create room_amenities records
    Log: "Added Room {room_number}"
  update($id, Request)
    Auth: owner, must own the room
    Same as store() but merge/replace photos
    If amenities changed: delete old amenity records, re-insert
    Log: "Updated Room {room_number}"
  archive($id)
    Auth: owner, must own the room
    Business rule: cannot archive if room has active (approved)
      reservation currently running
    Set is_archived = true
    Set availability_status = 'archived'
    Log: "Archived Room {room_number}"
  unarchive($id)
    Auth: owner
    Set is_archived = false, availability_status = 'available'
    Log: "Unarchived Room {room_number}"
  uploadPhotos($id, Request)
    Auth: owner
    Validate: photos array, max 5, each image|max:2048
    Store each → storage/public/rooms/{id}/{timestamp}.{ext}
    Merge with existing photos JSON, cap at 5
    Return updated photos array

ReservationController (extend — landlord side):
  ownerIndex()
    Auth: owner
    Returns all reservations for own boarding_house_id
    Filter by status via query param: ?status=pending
    Include: applicant profile (name, contact, school_or_workplace,
    emergency_contact_name, emergency_contact_number),
    valid_id signed URL, room info
  approve($id)
    Auth: owner, must own the room
    Business rule: room must be 'available' not 'occupied'
    Business rule: only 'pending' reservations can be approved
    In a DB transaction:
      1. Set reservation status = 'approved'
      2. Set room availability_status = 'occupied'
      3. Create first billing_cycle record:
           billing_month = move_in_date month (YYYY-MM)
           amount_due = room.monthly_rate
           due_date = move_in_date + 30 days
           created_by = auth user id
    Log: "Approved reservation by {tenant_name} for Room {num}"
    Return: updated reservation with room and billing cycle
  reject($id, Request)
    Auth: owner, must own the room
    Validate: rejection_remarks required|string|min:10|max:500
    Business rule: only 'pending' reservations can be rejected
    Set reservation status = 'rejected'
    Set reservation.rejection_remarks = input
    Log: "Rejected reservation by {tenant_name} for Room {num}"

BillingCycleController (NEW):
  index()
    Auth: owner
    Query param: ?month=YYYY-MM (default: current month)
    Returns all billing_cycles for own boarding_house_id
    for the given month, with payment record joined (if exists)
    Include: tenant name, room number, amount_due, payment status,
    payment_method, proof_of_payment_path, received_by name
  previewGenerate(Request)
    Auth: owner
    Validate: month required|date_format:Y-m
    Returns: list of active tenants (approved reservations, not
    yet ended) who do NOT already have a billing_cycle for
    that month. Shows: tenant name, room, amount_due.
    Also returns: list of tenants who ALREADY have a cycle
    (will be skipped).
  generate(Request)
    Auth: owner
    Validate: month required|date_format:Y-m
    In a DB transaction, for each active reservation:
      - Skip if billing_cycle already exists for that month
      - Create billing_cycle:
          user_id = reservation.user_id
          room_id = reservation.room_id
          billing_month = request.month
          amount_due = room.monthly_rate
          due_date = first day of month + 5 days
          created_by = auth user id
    Log: "Generated billing for {month} — {count} tenants"
    Return: created billing cycles count + skipped count

PaymentController (extend — landlord side):
  ownerIndex()
    Auth: owner
    Returns all payments for own boarding_house_id
    Joined with billing_cycles and tenants
    Filter by month, tenant, status via query params
  markAsPaid($billingCycleId, Request)
    Auth: owner, must own the billing cycle
    Validate:
      amount_paid: required|numeric|min:0
      payment_method: required|in:cash,gcash,bank_transfer,other
      notes: nullable|string|max:300
      payment_date: required|date
    Business rule: billing_cycle must not already be 'paid'
    Create or update payment record:
      status = 'paid'
      payment_date = request.payment_date
      received_by = auth user id
    Log: "Marked {tenant_name} rent as Paid for {billing_month}
      via {payment_method}"
    Return: updated payment record
  markAsUnpaid($paymentId, Request)
    Auth: owner, must own the payment
    Validate: reason nullable|string|max:200
    Set payment status = 'unpaid', clear payment_date,
    clear received_by, clear payment_method
    Log: "Reversed payment for {tenant_name} — {billing_month}"

ReportController (NEW):
  income(Request)
    Auth: owner
    Params: from (YYYY-MM), to (YYYY-MM), max range 12 months
    For each month in range:
      total_billed = SUM(billing_cycles.amount_due)
        WHERE boarding_house_id = ? AND billing_month = ?
      total_collected = SUM(payments.amount_paid)
        WHERE billing_cycle_id in above AND status = 'paid'
      total_outstanding = total_billed - total_collected
      collection_rate = (collected / billed * 100)
      tenant_count = COUNT(DISTINCT user_id) in billing_cycles
    Also return per-tenant breakdown for each month
  occupancy()
    Auth: owner
    total_rooms, occupied_count, available_count, archived_count,
    occupancy_rate (%)
    Per-room: number, type, status, current_tenant_name or null
  reservationStats(Request)
    Auth: owner
    Params: from, to (month range)
    Per month: approved_count, rejected_count, cancelled_count,
    pending_count (end of month snapshot)

TenantController (NEW):
  index()
    Auth: owner
    Returns all users with an approved reservation in own
    boarding_house_id. Include: current room, this month's
    payment status, guardian_links count, move-in date.
  show($userId)
    Auth: owner
    Returns full tenant profile: personal info, emergency contact,
    current room, full payment history (all billing_cycles with
    payment status), guardian_links (names only, no tokens).

--- 2C. Routes (api.php) ---

Route::middleware(['auth:sanctum','role:owner'])->prefix('owner')
->group(function() {
  // Boarding House
  GET    /boarding-house             BoardingHouseController@show
  PUT    /boarding-house             BoardingHouseController@update
  PUT    /boarding-house/house-rules BoardingHouseController@updateHouseRules

  // Rooms
  GET    /rooms                      RoomController@index
  POST   /rooms                      RoomController@store
  PUT    /rooms/{id}                 RoomController@update
  POST   /rooms/{id}/archive         RoomController@archive
  POST   /rooms/{id}/unarchive       RoomController@unarchive
  POST   /rooms/{id}/photos          RoomController@uploadPhotos

  // Reservations
  GET    /reservations               ReservationController@ownerIndex
  POST   /reservations/{id}/approve  ReservationController@approve
  POST   /reservations/{id}/reject   ReservationController@reject

  // Billing Cycles
  GET    /billing                    BillingCycleController@index
  GET    /billing/preview            BillingCycleController@previewGenerate
  POST   /billing/generate           BillingCycleController@generate

  // Payments
  GET    /payments                   PaymentController@ownerIndex
  POST   /billing/{cycleId}/pay      PaymentController@markAsPaid
  DELETE /payments/{id}/paid         PaymentController@markAsUnpaid

  // Tenants
  GET    /tenants                    TenantController@index
  GET    /tenants/{userId}           TenantController@show

  // Reports
  GET    /reports/income             ReportController@income
  GET    /reports/occupancy          ReportController@occupancy
  GET    /reports/reservations       ReportController@reservationStats

  // Dashboard
  GET    /dashboard                  OwnerDashboardController@index
});

OwnerDashboardController@index returns:
  total_rooms, occupied_rooms, available_rooms,
  pending_reservations_count,
  this_month_income (total_collected for current month),
  this_month_billed (total_billed for current month),
  collection_rate_this_month,
  recent_activity (last 5 activity_logs for owner's actions),
  unpaid_tenants (list: name, room, amount_due, days_since_bill)

====================================================================
SECTION 3: FRONTEND — REACT + VITE
====================================================================

--- 3A. Design System (RentEase tokens — consistent with seeker) ---

Colors:
  --forest:   #1B4332  (sidebar bg, headings)
  --primary:  #2D6A4F  (primary buttons, active states)
  --accent:   #52B788  (hover tints, highlights)
  --cream:    #F8F5F0  (page background)
  --gold:     #D4A853  (CTA accent, chart current month)
  --dark:     #2C2C2A  (body text)

Status colors (consistent with seeker view):
  Paid/Available:  bg #1D9E75, text #E1F5EE
  Unpaid/Occupied: bg #D85A30, text #FAECE7
  Pending:         bg #BA7517, text #FAEEDA
  Approved:        bg #2D6A4F, text #E1F5EE
  Rejected:        bg #A32D2D, text #FCEBEB
  Cancelled/Arch:  bg #888780, text #F1EFE8

Fonts: Playfair Display (headings) + DM Sans (body, UI)

--- 3B. Routing ---

/owner/dashboard           → OwnerDashboardLayout (wrapper)
  /owner/dashboard         → OwnerDashboardHome
  /owner/boarding-house    → BoardingHouseProfilePage
  /owner/rooms             → RoomsManagementPage
  /owner/reservations      → ReservationManagementPage
  /owner/tenants           → TenantManagementPage
  /owner/rent-tracking     → RentTrackingPage
  /owner/reports           → ReportsPage
  /owner/profile           → OwnerProfilePage

--- 3C. OwnerDashboardLayout component ---

Left sidebar (260px, forest green bg):
  Top: RentEase logo (white) + "Landlord Portal" small label
  Nav sections:
    OPERATIONS:
      Dashboard       ti-home-2
      Boarding House  ti-building-estate
      Rooms           ti-door
      Reservations    ti-clipboard-list  (badge: pending count)
    FINANCES:
      Tenants         ti-users
      Rent Tracking   ti-receipt
      Reports         ti-chart-bar
    ACCOUNT:
      Profile         ti-user-circle
      Logout          ti-logout

  Active nav item: white text + left white border + slight bg
  Non-active: 60% opacity white text, hover: 80% opacity
  Pending badge: amber pill on Reservations nav item

Top bar (white, 64px):
  Left: page title (breadcrumb)
  Right: notification bell + owner avatar + name dropdown

Mobile: sidebar collapses to icon-only (48px). Hamburger reveals
  full sidebar as overlay.

--- 3D. Page: OwnerDashboardHome ---

Stat cards row (4 across, responsive):
  - Total Rooms (ti-door icon)
  - Occupied (ti-user-check, coral if full)
  - Pending Reservations (ti-clock, amber if > 0)
  - This Month's Income ₱ formatted (ti-cash, Playfair Display)

Collection rate mini-bar:
  "May 2026: ₱14,000 collected of ₱18,500 billed (75.7%)"
  Progress bar (forest green fill on cream track)

Unpaid tenants alert section (if any unpaid):
  Amber warning banner: "X tenant(s) have unpaid rent for
  [current month]"
  List: avatar + name + room + amount due + "View" link

Recent activity feed (last 5 entries):
  Icon + action text + timestamp relative ("2 hours ago")

Quick actions row:
  "Add Room" (primary) + "Generate Bills" (outlined) +
  "View Reports" (outlined)

--- 3E. Page: BoardingHouseProfilePage ---

Two-column layout (left: form, right: live preview card)

Left form:
  Section: Basic Info
    House name (required)
    Address (required)
    Contact number
    Facebook page (optional, with ti-brand-facebook icon)
    Description (textarea, max 500 chars, char counter)
  Section: Cover Photo
    Current cover photo preview (if exists)
    "Change Photo" button → file input (image, max 3MB)
    Immediate preview on select
  Section: House Amenities
    Checkbox grid (2 columns):
      WiFi (ti-wifi), Filtered Water (ti-droplet),
      Electric (ti-bolt), Parking (ti-car),
      CR inside room (ti-bath), Kitchen access (ti-chef-hat),
      Washing area (ti-shirt), Common area (ti-sofa)
    Custom amenity text field + add button
  Section: House Rules
    Textarea (plain text, min 50 chars recommended)
    Markdown hint: "You can use line breaks to separate rules"
  Save button (sticky bottom on mobile)

Right preview card:
  Shows how the boarding house listing looks to seekers:
  Cover photo, name, address, amenity chips, rules excerpt

--- 3F. Page: RoomsManagementPage ---

Top toolbar:
  Filter: All | Available | Occupied | Archived
  View toggle: Grid | Table
  "Add Room" button (primary, ti-plus icon)

Grid view (3 cols desktop, 2 tablet, 1 mobile):
  Room card: first photo (16:9 ratio), room number badge overlay,
  type badge, floor if set, rate (Playfair bold), capacity icons,
  status pill, occupant name (if occupied), Edit button.
  Archived rooms: desaturated with "Archived" banner.

Table view columns:
  Photo thumb | Room # | Type | Floor | Capacity | Rate |
  Status | Occupant | Actions

RoomFormDrawer (slide in from right, 420px):
  Title: "Add Room" or "Edit Room 101"
  Fields:
    Room Number (required, unique within boarding house)
    Room Type (select: Single / Double / Shared / Studio)
    Floor Number (optional, number)
    Capacity (number, min 1 max 8)
    Monthly Rate ₱ (number, formatted)
    Notes (textarea, internal, optional)
  Photo Upload section:
    Drag-drop zone (dashed border, 200px height)
    "Drop photos here or click to browse"
    Preview grid (2 cols, shows uploaded/existing photos)
    Reorder via drag handles
    Delete (X) per photo
    Max 5 photos note
  Amenities section:
    Checkbox list (predefined list + custom add)
  Footer: Cancel + Save buttons

ArchiveConfirmModal:
  Warns: "This room will be hidden from seekers. All history
  is preserved. You can unarchive at any time."
  If room has active tenant: blocks archive, shows error.

--- 3G. Page: ReservationManagementPage ---

Tabs (with counts): Pending (3) | Approved | Rejected |
Cancelled

Pending tab — urgency first:
  Each row: applicant avatar + name, room requested, move-in
  date, date submitted, "Review" button (primary)

ReviewReservationModal:
  Header: "Reservation Application — Room 201"
  Left panel (60%):
    Applicant profile card:
      Avatar (initials circle), full name, contact number,
      school/workplace, emergency contact
    Valid ID section:
      If uploaded: "View ID" button → window.open(signed URL)
      If not uploaded: "No ID uploaded" (gray note)
  Right panel (40%):
    Room info card: photo, type, rate, capacity
    Move-in date
    Applicant's message (if any)
  Footer buttons:
    "Reject" (outlined red) → expands rejection remarks area
      below (required, min 10 chars, max 500)
    "Approve" (filled green) → confirm modal:
      "Approving will mark Room [X] as Occupied and create
      the first billing cycle for [month]. Proceed?"
      Confirm button calls approve API.
  On approve success: toast + redirect to Approved tab.
  On reject success: toast + refresh Pending tab.

Approved/Rejected/Cancelled tabs:
  Read-only table. Columns vary by tab.
  Approved: tenant, room, approved date, move-in date, view tenant.
  Rejected: applicant, room, rejection date, remarks (truncated).

--- 3H. Page: TenantManagementPage ---

Search bar + filter by room

Tenant table:
  Avatar + name | Room | Move-in date | Contact |
  Rent status (this month pill) | Actions

Row click → opens TenantDrawer (right-side panel, 380px):
  Header: avatar circle (large, 64px) + name + room badge
  Tabs inside drawer: Profile | Payment History | Guardians
  Profile tab:
    Contact number, email, school/workplace,
    emergency contact name + number
  Payment History tab:
    Compact table: billing month | amount due | status pill |
    method | date paid
    Load 6 months by default, "Load more" below
  Guardians tab:
    List of guardian names linked to this tenant (names only).
    Count badge if > 0.
  Drawer footer: "View full payment history →" (links to
  Rent Tracking filtered to this tenant)

--- 3I. Page: RentTrackingPage ---

Top toolbar:
  Month picker (default: current month, format: May 2026)
  Tenant search input
  "Generate Bills" button (outlined forest green, ti-calendar-plus)
  Export button (ti-printer, triggers window.print())

Status summary strip (3 cards inline):
  Paid: X tenants (green count)
  Unpaid: X tenants (coral count)
  No record: X (gray count)
  Total billed: ₱XX,XXX | Total collected: ₱XX,XXX

Main table:
  Fixed layout. Columns:
  Tenant (avatar + name) | Room | Amount Due | Amount Paid |
  Status | Method | Date Paid | Proof | Actions

  Proof column:
    Green file icon (ti-file-check) if proof uploaded by tenant
    Click → opens proof in new tab (signed URL)
    "—" if no proof

  Actions column:
    If unpaid: "Mark Paid" button (small, green)
    If paid: "Reverse" button (small, gray outlined)
    Only show "Reverse" if current month (prevent reversing
    historical payments carelessly)

MarkPaidModal:
  Title: "Record Payment — [Tenant Name]"
  Room: [Room Number] | Billing: [Month]
  Fields:
    Payment Date (date picker, default today, required)
    Amount Paid ₱ (pre-filled with amount_due, editable)
    Payment Method (select: Cash / GCash / Bank Transfer / Other)
    Notes (optional textarea, max 200 chars)
  Submit: "Confirm Payment"
  Loading state on button while submitting.

GenerateBillsModal:
  Title: "Generate Bills for [Month Picker]"
  Month selector at top.
  "Preview" button → calls previewGenerate API
  Preview result:
    Green section: "X tenants will receive a bill"
    List: name, room, amount ₱
    Amber section: "X tenants already have a bill — will skip"
    List: name, room
    Gray section: "No active tenants" (if empty)
  "Generate Bills" button (disabled until preview loaded)
  On success: toast + refresh table.

--- 3J. Page: ReportsPage ---

Three-tab layout:
  Income Report | Occupancy | Reservation Statistics

=== Income Report Tab ===

Date range filter: From [Month] To [Month] (max 12 months)
"Load Report" button

4 summary metric cards:
  Total Billed | Total Collected | Outstanding | Avg Collection Rate

Bar chart (Recharts BarChart):
  X-axis: month labels (MMM YYYY)
  Y-axis: amount in ₱ (formatted with comma separators)
  Two bars per month: total_billed (cream/light) +
    total_collected (forest green)
  Current month: gold outline on bars
  Tooltip: month name + billed + collected + outstanding
  Legend at bottom

Monthly breakdown table (below chart):
  Month | Tenants Billed | Total Billed | Collected |
  Outstanding | Collection Rate (progress bar inline)

Print button:
  window.print() — add @media print CSS:
    Hide sidebar, hide filters, show full table
    Print-friendly typography

=== Occupancy Tab ===

Donut chart (Recharts PieChart):
  Segments: Available (green), Occupied (coral), Archived (gray)
  Center label: occupancy rate %
  Legend: count per segment

Room-by-room table:
  Room # | Type | Status | Current Tenant | Move-in Date | Rate

=== Reservation Statistics Tab ===

Bar chart (stacked): approved / rejected / cancelled per month
Month range filter (same as income)
Simple stats below: total submitted, approval rate %, avg
processing days

--- 3K. Page: OwnerProfilePage ---

Same layout as seeker profile page, adapted for owner:
  Section 1: Personal info (photo, name, email read-only, contact)
  Section 2: Password change (current + new + confirm)
  Section 3: Boarding House Quick Link
    "View your boarding house listing as seekers see it"
    Button → opens public listing in new tab

====================================================================
SECTION 4: SHARED COMPONENTS (owner-specific)
====================================================================

TenantDrawer:
  Props: tenantId, isOpen, onClose
  Fetches /api/owner/tenants/{tenantId} on open
  Renders: profile, payment history, guardian count
  Slide-in animation (translate from right)
  Backdrop click closes drawer

RoomFormDrawer:
  Props: roomId (null = add mode), isOpen, onClose, onSave
  Fetches room data if roomId provided
  Photo state: existing URLs (from DB) + new File objects
  On submit: FormData with all fields + photos (new ones only)
  On save: parent refreshes room list

MarkPaidModal:
  Props: billingCycle (object), isOpen, onClose, onSuccess
  Local state: amount_paid, payment_method, payment_date, notes
  Submit → POST /api/owner/billing/{cycleId}/pay
  On success: callback + toast

GenerateBillsModal:
  Props: isOpen, onClose, onSuccess
  Local state: selectedMonth, preview (null|object), isLoading
  Two-step: preview → confirm generate

ReviewReservationModal:
  Props: reservationId, isOpen, onClose, onApprove, onReject
  Fetches full reservation detail on open (inc. signed ID URL)
  State: mode ('review'|'rejecting')
  Reject mode: shows remarks textarea

StatusPill (extend from seeker — add 'archived' variant):
  available → green | occupied → coral | archived → gray
  paid → teal | unpaid → coral | pending → amber
  approved → forest | rejected → red | cancelled → gray

IncomeChart (Recharts):
  Props: data (array of monthly summaries)
  Two bars: billed (light green), collected (forest green)
  Gold border on current month
  Custom tooltip component
  Responsive container (100% width)

====================================================================
SECTION 5: UX DETAILS & RULES
====================================================================

1. Approve reservation → DB transaction must be atomic.
   If billing cycle creation fails → rollback approval.
   Frontend shows error: "Approval failed. Please try again."

2. Archive room guard: if room.reservation where status='approved'
   and tenant has not vacated → block archive with message:
   "Cannot archive while a tenant is assigned. End their tenancy
   first via the Tenant management page." (future feature hook)

3. Generate Bills idempotency: the UNIQUE KEY on
   (reservation_id, billing_month) prevents duplicate bills even
   if the button is clicked twice. Frontend disables button after
   first successful generation and shows success state.

4. Mark Paid: amount_paid can differ from amount_due (partial
   payments or extra fees). System records both. Outstanding =
   amount_due - amount_paid. Status = 'paid' only if
   amount_paid >= amount_due.

5. Reverse payment: only allowed for current month. Guard on
   backend: if billing_month < current month → return 403 with
   "Historical payments cannot be reversed. Contact administrator."

6. Room photos: stored in public disk, accessible via URL.
   ID files and payment proofs: stored in private disk, accessed
   via Storage::temporaryUrl() (signed URL, 30-min expiry).

7. All monetary values: formatted as "₱ #,###.00" using
   Intl.NumberFormat('en-PH', {style:'currency', currency:'PHP'})

8. Pagination: all tables use page-based pagination (15 per page).
   Rent tracking: 20 per page (more rows needed at once).

9. Toast system: same ToastContext as seeker. Success (green),
   Error (red), Warning (amber), Info (blue). 4s auto-dismiss.

10. Sidebar reservation badge: refreshed every 60 seconds via
    polling (/api/owner/reservations?status=pending&count=1) or
    invalidate on reservation-related actions.

====================================================================
SECTION 6: ACTIVITY LOGGING (owner actions)
====================================================================

Log all of the following to activity_logs:
  "Updated boarding house profile"
  "Updated house rules"
  "Added Room {room_number}"
  "Updated Room {room_number}"
  "Archived Room {room_number}"
  "Unarchived Room {room_number}"
  "Approved reservation by {tenant_name} for Room {room_number}"
  "Rejected reservation by {tenant_name} — {rejection_remarks truncated}"
  "Generated billing for {billing_month} — {count} tenants"
  "Marked {tenant_name} rent as Paid for {billing_month}"
  "Reversed payment for {tenant_name} — {billing_month}"
  "Viewed income report for {from} to {to}"

====================================================================
SECTION 7: PRINT / EXPORT CSS
====================================================================

Add to global CSS (applies when window.print() called):

@media print {
  .owner-sidebar, .top-bar, .tab-row, .action-buttons,
  .filter-toolbar, .no-print { display: none !important; }
  .print-full-width { width: 100% !important; }
  body { background: white; font-size: 12px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; }
  .status-pill { border: 1px solid currentColor !important;
    background: transparent !important; }
  h1, h2 { color: black !important; }
  @page { margin: 1.5cm; }
}

Include "RentEase — Income Report — [Month Range]" as a print
header (
).

====================================================================
END OF PROMPT
====================================================================


Copy full prompt
