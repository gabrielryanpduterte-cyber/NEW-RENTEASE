# Page & Feautures

This document defines the planned seeker dashboard pages and feature behavior. It is a planning reference only and is not yet implemented.

## Seeker Dashboard Pages

### Dashboard Home

Welcome banner with name and greeting.

Hero status card:

- Room number
- Room type
- Rate
- Move-in date
- Empty state: "No active room"

Rent alert card:

- Current month billing status shown prominently
- Paid
- Unpaid with amount due
- No record yet

Reservation quick-status:

- Show if there is a pending approval

Recent activity list:

- Last 3 log entries

### Browse Rooms Pre-Approval

Accessible even before having a reservation.

Shows all available rooms.

When already an approved tenant, show banner:

> You currently have an approved room - browsing is view-only.

Prevents double-reservation at the API level:

- One active reservation per user max

### My Reservations

Table of all reservation history.

Columns:

- Room number
- Room type
- Date submitted
- Move-in date
- Status pill
- Actions

Actions column:

- Cancel button only if status is Pending

Cancel behavior:

- Clicking Cancel opens a confirmation modal
- Modal includes optional cancellation reason textarea
- Cancelled rows show reason in a tooltip
- Rejected rows show landlord remarks
- Approved row is marked with a room icon

### My Room

Full read-only room detail.

Content:

- Room photo
- Room type
- Room number
- Capacity
- Monthly rate
- Amenities grid with icon and label for each item
- Boarding house name
- Boarding house address
- House rules as a numbered list
- Landlord contact card at bottom with name and contact number

Access rule:

- Accessible only if an approved reservation exists
- Otherwise show "No active room" with CTA to browse

### Rent Status

Monthly payment history.

Top summary:

- Current month status shown large and prominent
- Paid
- Unpaid

Table columns:

- Billing period
- Amount due in PHP
- Amount paid in PHP
- Status pill
- Payment date if paid
- Proof uploaded, shown with file icon if present
- Notes

Unpaid row action:

- Upload Proof button
- Opens file picker
- Accepts image or PDF
- Max file size: 5MB
- After upload, show: "Proof submitted - awaiting landlord confirmation"

Paid rows:

- Read-only

Footer note:

> Payment confirmation is managed by the landlord.

### Guardian Access

New page for managing who can view the tenant's information.

Top section:

- Add Guardian form
- Guardian name field
- Guardian email field
- Generate Link button

Active guardians list:

- Name
- Email
- Status pill
- Last accessed
- Revoke button

Revoke behavior:

- Revoke opens confirmation modal

Link display:

- Copyable text field
- Copy-to-clipboard button

Help text:

> Anyone with this link can view your room and rent status. They do not need to log in.

### My Profile

Editable profile form.

Fields:

- Profile photo upload with circular crop preview
- Full name
- Email, read-only
- Contact number
- School/workplace
- Emergency contact name
- Emergency contact number

Save behavior:

- Save button with loading state

Password change section:

- Current password
- New password
- Confirm password

Photo upload behavior:

- Uses `FormData`
- Preview updates immediately after selection

## Implementation Note

Do not implement this yet. Use this file as the reference for future seeker dashboard work.
