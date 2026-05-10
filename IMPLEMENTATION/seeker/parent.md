# Parent / Guardian View

This document defines the complete planned parent/guardian view specification. It is a planning reference only and is not yet implemented.

## Complete Spec

The guardian view is a public tokenized route, not a dashboard. It lives outside the auth system entirely.

No registration. No login.

The token in the URL is the access credential.

## Route & Access

URL pattern:

```text
/guardian-view/{access_token}
```

Backend validates:

- Token exists
- Status is active
- Token is not expired
- `last_accessed_at` is recorded

If invalid, revoked, or expired, show a clean error page:

> This link is no longer valid. Please contact your family member to send a new link.

Session and storage rules:

- No session cookie set
- No `localStorage`
- Every visit re-validates the token

## What The Guardian Sees

### Header

- RentEase logo
- "Guardian View" badge
- Tenant name shown prominently

Example:

> Viewing: Juan dela Cruz's information

Layout rule:

- No navigation sidebar
- Stripped minimal layout

### Section 1 - Room Status Card

Shows:

- Room number
- Room type
- Boarding house name
- Address
- Monthly rate in PHP
- Move-in date
- Current occupancy status
- Amenities as icon chips

### Section 2 - Current Rent Status

Shows:

- Large status indicator for the current billing month
- Paid in green
- Unpaid in red with amount due

Last 3 months payment history table:

- Billing period
- Status
- Date paid

### Section 3 - Boarding House Contact

Shows:

- Landlord name
- Landlord contact number

Helper text:

> For concerns about accommodation, contact the landlord directly.

### Footer

Footer text:

> This is a read-only view. Information is accurate as of [last updated timestamp]. Powered by RentEase.

## What The Guardian Does Not See

Guardians must not see:

- Reservation history details
- Tenant profile information such as email or contact number
- Other tenant names
- Other rooms
- Landlord financial reports
- Ability to submit anything
- Link to the full RentEase platform
- Other guardians linked to the same tenant

## Design - Guardian View Specific

Layout:

- Stripped layout
- No sidebar
- No bottom nav
- Centered content
- Max width: 560px
- Mobile-first

Reason:

- Parents and guardians are likely to open the link on phones

UI style:

- Clean card-based sections
- Large colored status pill, not only a table cell
- Boarding house photo if available
- Timestamp footer
- No CTAs that lead anywhere
- Purely informational

Color:

- Same RentEase forest green brand
- White background
- No dashboard chrome

## Security Considerations

Tokens:

- UUID v4
- Unguessable

Privacy:

- No tenant PII exposed beyond name, room info, and rent status
- Landlord phone number is shown because the tenant already approved this by being a boarder

Expiry:

- No hard expiry by default
- Seeker controls access through revoke

Optional expiry:

- Add 30-day auto-expiry
- Seeker must regenerate link

Protection:

- Rate limiting on token validation endpoint to prevent brute force
- Access logged for audit trail

## Implementation Note

Do not implement this yet. Use this file as the reference for future parent/guardian tokenized view work.
