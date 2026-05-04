# Phase 2 Manual Guide (RENTEASE)

This guide is for manual execution of Phase 2 only.  
Goal: build all 7 database tables in `rentease_db` based on your ERD, then export a clean SQL backup.

## Scope of Phase 2

Required tables:
- `users`
- `boarding_house`
- `rooms`
- `reservations`
- `payments`
- `activity_logs`
- `error_logs`

## Before You Start

1. Open XAMPP Control Panel (`C:\xampp\xampp-control.exe`).
2. Start `Apache` and `MySQL`.
3. Open `http://localhost/phpmyadmin`.
4. Confirm database `rentease_db` already exists (from Phase 1).

## Build Order (Recommended)

Create tables in this order to avoid foreign-key errors:

1. `users`
2. `boarding_house`
3. `rooms`
4. `reservations`
5. `payments`
6. `activity_logs`
7. `error_logs`

## Step-by-Step (Manual UI Flow)

Use the same pattern for each table:

1. Click database `rentease_db` in the left sidebar.
2. In the `Create table` section:
   - Enter table name
   - Enter number of columns
   - Click `Create`
3. Fill each column:
   - Name
   - Type
   - Length/Values
   - Default (if needed)
   - Null (`No` unless optional)
   - Index (`PRIMARY`, `INDEX`, `UNIQUE`)
   - A_I (Auto Increment) for ID PK columns
4. Click `Save`.
5. Open table `Structure` tab and add indexes/foreign keys if not yet set.

## Table Blueprint (Based on Your ERD Attributes)

Use these as your implementation checklist. Keep names and relationships consistent with your ERD document.

### 1) `users`

Core columns from ERD:
- `user_id` (PK)
- `full_name`
- `email` (unique)
- `password_hash`
- `role` (`seeker`, `parent`, `owner`, `admin`)
- `contact_number`
- `account_status` (`active`, `inactive`)
- `created_at`

Manual notes:
- Set `user_id` as `PRIMARY` + `AUTO_INCREMENT`.
- Set `email` as `UNIQUE`.
- Prefer `created_at` default = current timestamp.

### 2) `boarding_house`

Core columns from ERD:
- `boarding_house_id` (PK)
- `owner_id` (FK -> `users.user_id`)
- `house_name`
- `address`
- `description`
- `house_rules`

Manual notes:
- PK: `boarding_house_id` auto-increment.
- Add index on `owner_id`.
- Add FK `owner_id` references `users(user_id)`.
- Owner should map to a `users` record with role `owner`.

### 3) `rooms`

Core columns from ERD:
- `room_id` (PK)
- `boarding_house_id` (FK -> `boarding_house.boarding_house_id`)
- `room_number`
- `room_type`
- `capacity`
- `monthly_rate`
- `amenities`
- `availability_status`

Manual notes:
- PK: `room_id` auto-increment.
- Index + FK on `boarding_house_id`.

### 4) `reservations`

Core columns from ERD:
- `reservation_id` (PK)
- `user_id` (FK -> `users.user_id`)
- `room_id` (FK -> `rooms.room_id`)
- `date_submitted`
- `move_in_date`
- `status` (`pending`, `approved`, `rejected`)
- `remarks`

Manual notes:
- PK: `reservation_id` auto-increment.
- Index + FK on `user_id`.
- Index + FK on `room_id`.

### 5) `payments`

Core columns from ERD:
- `payment_id` (PK)
- `reservation_id` (FK -> `reservations.reservation_id`)
- `user_id` (FK -> `users.user_id`)
- `room_id` (FK -> `rooms.room_id`)
- `amount_due`
- `amount_paid`
- `payment_status` (`paid`, `unpaid`)
- `payment_date`
- `billing_period`
- `recorded_by` (FK -> `users.user_id`, landlord/owner account)

Manual notes:
- PK: `payment_id` auto-increment.
- Add indexes/FKs for `reservation_id`, `user_id`, `room_id`, `recorded_by`.

### 6) `activity_logs`

Core columns from ERD:
- `log_id` (PK)
- `user_id` (FK -> `users.user_id`)
- `action_performed`
- `affected_module`
- `timestamp`

Manual notes:
- PK: `log_id` auto-increment.
- Index + FK on `user_id`.

### 7) `error_logs`

Core columns from ERD:
- `error_id` (PK)
- `error_code`
- `error_message`
- `affected_user_id` (nullable FK -> `users.user_id`)
- `timestamp`

Manual notes:
- PK: `error_id` auto-increment.
- `affected_user_id` should allow `NULL` (optional relation).
- Add FK to `users(user_id)`.

## Add Foreign Keys in phpMyAdmin (UI)

If FK was not added during create:

1. Open the table -> `Structure`.
2. Ensure child FK column has an index.
3. Click `Relation view`.
4. Under `Foreign key constraints`:
   - Choose child column
   - Choose referenced table + referenced PK
   - Set `ON DELETE` and `ON UPDATE` behavior (commonly `RESTRICT` or `CASCADE` based on your ERD rule)
5. Click `Save`.

## Quick Validation Checklist

After creating all tables:

1. Click `rentease_db` -> confirm all 7 tables appear.
2. Open each table `Structure`:
   - PK exists
   - Required columns set `NOT NULL`
   - `AUTO_INCREMENT` set for ID columns
3. Verify FKs:
   - `boarding_house.owner_id -> users.user_id`
   - `rooms.boarding_house_id -> boarding_house.boarding_house_id`
   - `reservations.user_id -> users.user_id`
   - `reservations.room_id -> rooms.room_id`
   - `payments.reservation_id -> reservations.reservation_id`
   - `payments.user_id -> users.user_id`
   - `payments.room_id -> rooms.room_id`
   - `payments.recorded_by -> users.user_id`
   - `activity_logs.user_id -> users.user_id`
   - `error_logs.affected_user_id -> users.user_id`

## Export Clean SQL Backup (Required in Phase 2)

1. Click database `rentease_db`.
2. Click `Export`.
3. Choose `Custom` (recommended).
4. Set format to `SQL`.
5. Ensure all 7 tables are selected.
6. Enable:
   - `Add DROP TABLE / VIEW / PROCEDURE / FUNCTION`
   - `IF NOT EXISTS` (if available)
7. Click `Go` and save as:
   - `rentease_phase2_schema.sql`
8. Move/copy this file to `rentease/database/`.

## Footprint Log Template (For Documentation/Defense)

Fill this while doing Phase 2 manually:

- Opened XAMPP and started Apache/MySQL at: `[time]`
- Opened phpMyAdmin and selected DB: `rentease_db`
- Created table `users`: `yes/no`
- Created table `boarding_house`: `yes/no`
- Created table `rooms`: `yes/no`
- Created table `reservations`: `yes/no`
- Created table `payments`: `yes/no`
- Created table `activity_logs`: `yes/no`
- Created table `error_logs`: `yes/no`
- Added all required foreign keys: `yes/no`
- Exported SQL backup filename: `[filename]`
- Backup saved in `rentease/database/`: `yes/no`
- Final Phase 2 status: `complete/incomplete`

## Common Phase 2 Issues

- Foreign key creation fails:
  - Parent table or referenced column does not exist yet.
  - Data type/length/signed mismatch between child and parent IDs.
  - Storage engine mismatch (use InnoDB for FK support).

- Cannot save enum/value constraints:
  - Verify exact allowed values and format in Length/Values.

- Export file missing tables:
  - Re-export in `Custom` mode and ensure all tables are checked.
