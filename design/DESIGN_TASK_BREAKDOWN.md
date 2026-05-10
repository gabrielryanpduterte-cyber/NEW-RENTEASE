# RentEase Design Direction - Task Breakdown

This file captures the requested design direction as a planning reference only.
Do not treat this as implemented UI. Use it to break future design work into safe, reviewable tasks.

## Design North Star

RentEase should feel like refined hospitality meets academic trust: clean, modern, warm, local, and student-friendly.

The visual reference is inspired by accommodation booking layouts with:

- Full-bleed hero imagery
- Card-based room listings
- Room detail pages with sticky reservation sidebars
- Elegant typography and warm neutral backgrounds

The implementation should remain grounded in a Philippine boarding house context, with practical workflows for students, guardians, landlords, and admins.

## Visual System Tasks

### 1. Typography Foundation

- [ ] Add Playfair Display for hero headlines, section titles, and room names.
- [ ] Add DM Sans for body text, navigation, forms, labels, tables, and dashboard UI.
- [ ] Define heading scale for public pages.
- [ ] Define compact heading scale for dashboards, cards, modals, and tables.
- [ ] Verify font loading performance and fallback fonts.

### 2. Color Tokens

- [ ] Add brand color tokens:
  - Forest: `#1B4332`
  - Primary: `#2D6A4F`
  - Accent: `#52B788`
  - Light: `#B7E4C7`
  - Cream: `#F8F5F0`
  - Gold: `#D4A853`
  - Dark: `#2C2C2A`
  - Mist: `#E8EDE6`
- [ ] Replace harsh white backgrounds with cream where appropriate.
- [ ] Use forest green as the main brand anchor.
- [ ] Use gold only for strong CTAs and premium highlights.
- [ ] Use dark slate for text instead of pure black.
- [ ] Confirm contrast ratios for text, pills, buttons, and tables.

### 3. Base UI Polish

- [ ] Standardize border radius at 8px for cards and buttons unless an existing component requires otherwise.
- [ ] Define consistent shadows for cards, sticky sidebars, dropdowns, and modals.
- [ ] Add hover and focus states for all interactive elements.
- [ ] Ensure responsive spacing rules for mobile, tablet, and desktop.
- [ ] Audit existing CSS for conflicting legacy styles before applying the new system.

## Public Website Tasks

### 4. Public Homepage

- [ ] Build a full-bleed hero section.
- [ ] Use a boarding house exterior image when available.
- [ ] Add dark scrim overlay: `rgba(0, 0, 0, 0.45)`.
- [ ] Use centered Playfair Display headline at approximately 56px desktop.
- [ ] Use DM Sans subtext at approximately 18px.
- [ ] Add two CTAs:
  - Browse Rooms: filled gold, dark text
  - Login / Sign In: outlined white
- [ ] Add trust badge row below the hero:
  - Verified Landlord
  - Secure Payments
  - Real-time Availability
- [ ] Add room highlights carousel.
- [ ] Add "Why RentEase" feature section.
- [ ] Add testimonials or ratings strip.
- [ ] Add FAQ accordion.
- [ ] Add CTA band.
- [ ] Add footer.

### 5. Sticky Navigation

- [ ] Add sticky top navigation.
- [ ] Place logo on the left.
- [ ] Place public links in the center.
- [ ] Place auth buttons on the right.
- [ ] Use transparent nav over hero at page top.
- [ ] Switch nav to white background with shadow on scroll.
- [ ] Add mobile hamburger menu.
- [ ] Use full-screen overlay nav on mobile.

## Room Browsing Tasks

### 6. Rooms Listing Page

- [ ] Add filter bar for room type, capacity, price range, and availability.
- [ ] Build 3-column room grid on desktop.
- [ ] Build 1-column room grid on mobile.
- [ ] Add empty state illustration or visual placeholder.
- [ ] Ensure filter changes preserve layout stability.
- [ ] Add loading and error states.

### 7. Room Card Component

- [ ] Add room photo at 16:9 aspect ratio with `object-fit: cover`.
- [ ] Add room type badge: Single, Double, Shared, or similar.
- [ ] Show room number or room name.
- [ ] Show monthly rate using Playfair Display bold.
- [ ] Show capacity with bed icon and count.
- [ ] Show availability pill:
  - Available: green
  - Occupied: red
- [ ] Add Reserve Now button in forest green.
- [ ] Add hover lift shadow.
- [ ] Add image scale hover effect at `1.03`.
- [ ] Confirm card content does not shift on hover.

### 8. Room Detail Page

- [ ] Use two-column layout on desktop.
- [ ] Left column at approximately 65%.
- [ ] Right sticky sidebar at approximately 35%.
- [ ] Add main photo gallery.
- [ ] Add thumbnail strip.
- [ ] Add room description.
- [ ] Add amenities grid:
  - WiFi
  - Bathroom type
  - Air conditioning
  - Bed count
  - Study area
  - Security
- [ ] Add house rules section.
- [ ] Collapse layout into a single column on mobile.

### 9. Reservation Sidebar

- [ ] Add price card showing monthly rate.
- [ ] Add move-in date picker.
- [ ] Add Submit Reservation CTA in gold.
- [ ] Add landlord contact block.
- [ ] Keep sidebar sticky on desktop.
- [ ] Make sidebar non-sticky and full-width on mobile.
- [ ] Add validation for date and unavailable rooms.

## Auth Flow Tasks

### 10. Login Page

- [ ] Use split-screen layout with boarding house image.
- [ ] Keep role selector visible and clear.
- [ ] Use floating labels for form fields.
- [ ] Add inline validation.
- [ ] Keep Google sign-in styling consistent with the new visual system if enabled.
- [ ] Ensure mobile layout stacks cleanly.

### 11. Register Page

- [ ] Use split-screen layout with house image.
- [ ] Add role-based field sets.
- [ ] Add profile photo upload.
- [ ] Add inline validation:
  - Red for errors
  - Green checkmark for valid fields
- [ ] Keep form length manageable on mobile.

### 12. Forgot Password Page

- [ ] Add forgot password route if backend support exists.
- [ ] Match auth page visual layout.
- [ ] Add email validation.
- [ ] Add success and error states.

## Dashboard Tasks

### 13. Shared Dashboard Shell

- [ ] Add left sidebar navigation.
- [ ] Make sidebar role-aware.
- [ ] Collapse sidebar on mobile.
- [ ] Add page header with breadcrumb.
- [ ] Add main content layout with clear spacing.
- [ ] Add stat card row pattern.
- [ ] Add reusable table pattern.
- [ ] Add status pill pattern.

### 14. Tenant / Seeker Dashboard

- [ ] Add My Room status card.
- [ ] Add rent payment timeline.
- [ ] Add reservation history.
- [ ] Add parent access toggle.
- [ ] Add quick action buttons for browse rooms, payments, documents, and feedback.

### 15. Parent / Guardian View

- [ ] Build read-only dependent overview.
- [ ] Prioritize mobile-first layout.
- [ ] Show dependent room status.
- [ ] Show rent status.
- [ ] Show reservation status.
- [ ] Keep actions minimal and clearly read-only.

### 16. Landlord Dashboard

- [ ] Add room management CRUD views.
- [ ] Add reservation approvals list.
- [ ] Add tenant list.
- [ ] Add rent tracking.
- [ ] Add monthly income report.
- [ ] Add occupancy bar.
- [ ] Add pending approvals list.
- [ ] Add income chart using Recharts.

### 17. Admin Dashboard

- [ ] Add system overview.
- [ ] Add user account management.
- [ ] Add system reports.
- [ ] Add activity logs.
- [ ] Add error logs.
- [ ] Add boarding house configuration.

## Reusable Component Tasks

### 18. Buttons

- [ ] Primary: forest green background, white text, 8px radius.
- [ ] Secondary: outlined green.
- [ ] Accent CTA: gold background, dark text.
- [ ] Danger: coral outlined.
- [ ] Use 14px DM Sans, weight 500.
- [ ] Add disabled, loading, hover, active, and focus states.

### 19. Status Pills

- [ ] Available: green.
- [ ] Occupied: red.
- [ ] Pending: amber.
- [ ] Paid: teal.
- [ ] Unpaid: coral.
- [ ] Use 11px DM Sans uppercase.
- [ ] Ensure contrast remains readable.

### 20. Data Tables

- [ ] Use cream header row.
- [ ] Use alternating white and mist rows.
- [ ] Add sortable columns with chevron icons.
- [ ] Add pagination.
- [ ] Add row hover with light green tint.
- [ ] Add inline action buttons.
- [ ] Add loading, empty, and error states.

### 21. Forms

- [ ] Add floating labels.
- [ ] Add 1px forest green focus ring.
- [ ] Add inline validation messages.
- [ ] Add success checkmark state.
- [ ] Add file upload for profile photo where needed.
- [ ] Add role-based field groups.

### 22. Income Chart

- [ ] Use Recharts if already available or approved for install.
- [ ] X-axis: months.
- [ ] Y-axis: PHP amount.
- [ ] Bars in forest green.
- [ ] Current month in gold.
- [ ] Tooltip card on hover.
- [ ] Add month selector dropdown.

## Responsive And QA Tasks

### 23. Responsive QA

- [ ] Test mobile width around 360px.
- [ ] Test tablet width around 768px.
- [ ] Test desktop width around 1440px.
- [ ] Confirm text never overlaps.
- [ ] Confirm buttons and pills do not truncate awkwardly.
- [ ] Confirm sticky nav and sticky sidebar behave correctly.

### 24. Accessibility QA

- [ ] Check keyboard navigation.
- [ ] Check visible focus states.
- [ ] Check color contrast.
- [ ] Add alt text for room and house photos.
- [ ] Ensure form errors are accessible.
- [ ] Ensure status pills are not color-only indicators.

### 25. Integration QA

- [ ] Run frontend build.
- [ ] Smoke test login for all roles.
- [ ] Smoke test public room browsing.
- [ ] Smoke test room reservation flow.
- [ ] Smoke test dashboard pages for seeker, parent, landlord, and admin.
- [ ] Verify API errors render gracefully.

## Suggested Implementation Order

1. Establish typography, color tokens, and base components.
2. Update public homepage and navigation.
3. Update room cards, listing page, and detail page.
4. Update auth pages.
5. Update shared dashboard shell.
6. Update seeker and parent dashboards.
7. Update landlord dashboard.
8. Update admin dashboard.
9. Add chart polish, table polish, and final responsive QA.

## Notes For Future Work

- Keep public pages visually warm and hospitality-focused.
- Keep dashboards practical, dense, and task-focused.
- Do not make dashboards feel like marketing pages.
- Prefer real boarding house photos when available.
- Use placeholder imagery only until final assets are supplied.
- Any backend-dependent UI should be checked against the existing API before implementation.
