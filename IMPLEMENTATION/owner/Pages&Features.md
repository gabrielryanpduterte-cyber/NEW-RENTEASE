# Pages & Features

## Landlord Dashboard Pages

### Dashboard Home

4 stat cards:

- Total Rooms
- Occupied Rooms
- Pending Reservations with amber highlight if > 0
- This Month's Income, ₱ formatted

Quick-action buttons:

- "Add Room"
- "Generate Bills"
- "View Reports"

Recent activity feed shows the last 5 actions with timestamp. Occupancy mini-chart shows a donut chart of occupied vs available vs archived. Unpaid tenants alert list shows names, amount due, and days overdue.

### Boarding House Profile

Edit the boarding house:

- Name
- Address
- Description
- Contact number
- Facebook page optional

Cover photo upload is single-file and replaces the existing cover. House rules use a rich or plain textarea. Amenities checklist uses checkboxes: WiFi, Water, Electric, Parking, CR inside, Kitchen, etc. Amenities save as JSON. Preview card shows how seekers will see the listing. Save button includes an unsaved-changes warning.

### Room Management

Table + card-grid toggle.

Columns:

- Photo thumbnail
- Room number
- Type
- Floor
- Capacity
- Rate
- Status pill
- Occupant if any
- Actions Edit / Archive

"Add Room" button opens a slide-in drawer form.

Edit drawer fields:

- Room number
- Type Single/Double/Shared/Studio
- Floor
- Capacity
- Monthly rate
- Notes internal
- Amenities multi-select
- Multi-photo upload drag-drop, up to 5, reorderable
- Availability toggle

Archive button triggers a confirm modal explaining records are preserved. Archived rooms are shown in a collapsed "Archived" section at the bottom.

### Reservation Management

Tabs:

- Pending
- Approved
- Rejected
- Cancelled

Pending tab has amber count badge.

Each pending row:

- Applicant avatar + name
- Requested room
- Date submitted
- Move-in date
- "Review" button

Review opens a full-detail modal:

- Applicant profile name, contact, school/workplace, emergency contact
- Valid ID view button, opens in new tab via signed URL
- Room info
- Move-in date

Approve button green → confirmation → creates billing cycle.

Reject button red → requires remarks, required, min 10 chars → submit.

Approved, Rejected, and Cancelled tabs are read-only history tables.

### Tenant Management

Table of all currently approved tenants.

Columns:

- Avatar + name
- Room number
- Move-in date
- Contact number
- Rent status this month paid/unpaid pill
- Actions

Click row opens Tenant Drawer, a right-side panel 380px wide.

Tenant Drawer includes:

- Full profile
- Emergency contact
- Room info
- Full payment history table all months
- Guardian links count

Drawer has "View Full Payment History" link to Rent Tracking filtered to that tenant.

### Rent Tracking

Top toolbar:

- Month selector, default current month
- "Generate Bills for [Month]" button
- Search by tenant name

Status summary strip:

- Paid count green
- Unpaid count red
- No record count gray

Table columns:

- Tenant name
- Room
- Billing period
- Amount due
- Amount paid
- Status pill
- Proof file icon if uploaded by tenant
- Date paid
- Payment method
- Actions

Actions:

- "Mark Paid" opens MarkPaidModal
- "Mark Unpaid" reverses status with confirm modal

MarkPaidModal fields:

- Amount paid input, pre-filled with amount due
- Payment method select Cash/GCash/Bank Transfer/Other
- Notes textarea
- Confirm button

Generate Bills modal previews the list of active tenants who will receive a bill for the selected month. It shows amount from room rate and warns if a bill already exists for any tenant that month.

### Reports

Three report sections shown as tabs:

- Income Report
- Occupancy Report
- Reservation Statistics

Income:

- 12-month bar chart using Recharts
- Gold bars
- Current month highlighted in forest green

Below chart:

- Monthly breakdown table with month, bills generated, total collected, total outstanding, collection rate %
- Date range filter
- Print button using window.print() with print-specific CSS

Occupancy:

- Donut chart occupied/available/archived rooms
- Table of room-by-room occupancy history

Reservation Stats:

- Bar chart of reservations per month
- Stacked by status approved/rejected/cancelled

All charts use the RentEase color palette.

### Profile & Settings

Two sections:

Personal:

- Profile photo
- Full name
- Email read-only
- Contact number
- Password change

Account Settings:

- Notification preferences placeholder for future email/SMS
- Danger zone deactivate account, requires admin confirmation in real use and shows info message for now
