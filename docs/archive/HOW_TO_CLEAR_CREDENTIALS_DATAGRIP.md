# How to Clear Credentials Using DataGrip

## Quick Guide for DataGrip Users

### Method 1: Clear All Users (Recommended)

#### Step 1: Open SQL Console
1. In DataGrip, right-click on `rentease_db` database
2. Select **"New"** → **"Query Console"** (or press `Ctrl+Shift+F10`)

#### Step 2: Run Clear Script
Copy and paste this SQL:

```sql
-- Clear all user data
USE rentease_db;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Clear all tables
TRUNCATE TABLE payments;
TRUNCATE TABLE reservations;
TRUNCATE TABLE feedback;
TRUNCATE TABLE uploads;
TRUNCATE TABLE account_links;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE error_logs;
TRUNCATE TABLE users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify (should show 0 for all)
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;
```

#### Step 3: Execute
- Press `Ctrl+Enter` (execute current statement)
- Or press `Ctrl+Shift+Enter` (execute all statements)
- Or click the green "Execute" button ▶️

---

### Method 2: Clear Specific User (GUI Method)

#### Step 1: Open Users Table
1. In DataGrip left panel, expand `rentease_db`
2. Expand **"tables"**
3. Double-click **"users"** table

#### Step 2: View Data
- You'll see all users in a table view
- Find the user you want to delete

#### Step 3: Delete User
1. Right-click on the row you want to delete
2. Select **"Delete Row(s)"** (or press `Ctrl+Delete`)
3. Click **"Submit"** button (or press `Ctrl+Enter`)

#### Visual Guide:
```
DataGrip Interface:
├── rentease_db
│   ├── tables
│   │   ├── users (double-click here)
│   │   │   → Table opens with data
│   │   │   → Right-click row → Delete Row(s)
│   │   │   → Click Submit button
```

---

### Method 3: Delete Multiple Users (GUI)

#### Step 1: Open Users Table
1. Double-click `users` table in DataGrip

#### Step 2: Select Multiple Rows
- Hold `Ctrl` and click multiple rows
- Or hold `Shift` and click first and last row (selects range)

#### Step 3: Delete
1. Right-click on selected rows
2. Select **"Delete Row(s)"**
3. Click **"Submit"** button

---

### Method 4: Clear Using SQL with Filters

#### Delete Test Users Only:
```sql
-- Delete users with test emails
DELETE FROM users WHERE email LIKE '%test%';
DELETE FROM users WHERE email LIKE '%example%';

-- Verify deletion
SELECT * FROM users;
```

#### Delete Unverified Users:
```sql
-- Delete unverified users
DELETE FROM users WHERE email_verified = 0;

-- Verify
SELECT COUNT(*) as remaining_users FROM users;
```

#### Delete by Role:
```sql
-- Delete all seekers
DELETE FROM users WHERE role = 'seeker';

-- Delete all parents
DELETE FROM users WHERE role = 'parent';

-- Verify
SELECT role, COUNT(*) as count FROM users GROUP BY role;
```

---

### Method 5: Reseed with Demo Data

#### Step 1: Clear All Data First
```sql
USE rentease_db;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE payments;
TRUNCATE TABLE reservations;
TRUNCATE TABLE feedback;
TRUNCATE TABLE uploads;
TRUNCATE TABLE account_links;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE error_logs;
TRUNCATE TABLE rooms;
TRUNCATE TABLE boarding_house;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;
```

#### Step 2: Run Demo Seed File
1. In DataGrip, click **"File"** → **"Open"**
2. Navigate to: `C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\database\phase7_demo_seed.sql`
3. File opens in new tab
4. Press `Ctrl+Shift+Enter` to execute all
5. Wait for completion

#### Or Use SQL Console:
```sql
-- Run seed file
SOURCE 'C:/Users/gabri/OneDrive/Desktop/NEW RENTEASE/rentease/database/phase7_demo_seed.sql';
```

**Note:** Use forward slashes `/` in path, not backslashes `\`

---

## DataGrip-Specific Features

### Feature 1: View Before Delete

#### Check Users Before Deleting:
```sql
-- View all users
SELECT user_id, full_name, email, role, email_verified, created_at 
FROM users 
ORDER BY created_at DESC;
```

DataGrip will show results in a nice table view with:
- ✅ Sortable columns (click column header)
- ✅ Filterable data (click funnel icon)
- ✅ Exportable (right-click → Export Data)

---

### Feature 2: Transaction Control

DataGrip has transaction controls at the top:

#### Safe Delete with Transaction:
```sql
-- Start transaction
START TRANSACTION;

-- Delete users
DELETE FROM users WHERE email LIKE '%test%';

-- Check what was deleted
SELECT * FROM users;

-- If looks good, commit:
COMMIT;

-- If something wrong, rollback:
-- ROLLBACK;
```

**Transaction Buttons in DataGrip:**
- 🔵 **Commit** button (green checkmark)
- 🔴 **Rollback** button (red X)

---

### Feature 3: Export Backup Before Delete

#### Step 1: Right-click on `users` table
#### Step 2: Select **"Export Data"** (or press `F8`)
#### Step 3: Choose format:
- SQL Inserts (recommended for backup)
- CSV
- JSON
- Excel

#### Step 4: Save file
- Save as: `users_backup_2024.sql`
- Location: Desktop or project folder

#### Step 5: Now safe to delete data

---

### Feature 4: Run SQL File

#### To Run Any SQL File:
1. **File** → **Open** → Select `.sql` file
2. Or drag and drop `.sql` file into DataGrip
3. Press `Ctrl+Shift+Enter` to execute all
4. Or select specific statements and press `Ctrl+Enter`

---

## Common DataGrip Shortcuts

| Action | Shortcut |
|--------|----------|
| New Query Console | `Ctrl+Shift+F10` |
| Execute Current Statement | `Ctrl+Enter` |
| Execute All Statements | `Ctrl+Shift+Enter` |
| Delete Row(s) | `Ctrl+Delete` |
| Submit Changes | `Ctrl+Enter` |
| Rollback Changes | `Ctrl+Alt+Z` |
| Export Data | `F8` |
| Find in Table | `Ctrl+F` |
| Refresh | `Ctrl+F5` |

---

## Step-by-Step: Complete Clear & Reseed

### 🎯 Recommended Process for DataGrip:

#### Step 1: Backup Current Data
1. Right-click `rentease_db` in DataGrip
2. Select **"SQL Scripts"** → **"Dump with 'mysqldump'"**
3. Or manually:
   - Right-click `users` table → **"Export Data"** → Save as `users_backup.sql`

#### Step 2: Open Query Console
1. Right-click `rentease_db`
2. Select **"New"** → **"Query Console"**

#### Step 3: Clear All Data
Paste and execute:
```sql
USE rentease_db;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE payments;
TRUNCATE TABLE reservations;
TRUNCATE TABLE feedback;
TRUNCATE TABLE uploads;
TRUNCATE TABLE account_links;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE error_logs;
TRUNCATE TABLE rooms;
TRUNCATE TABLE boarding_house;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'All data cleared!' as status;
```

Press `Ctrl+Shift+Enter`

#### Step 4: Reseed Demo Data
1. **File** → **Open**
2. Navigate to: `NEW RENTEASE\rentease\database\phase7_demo_seed.sql`
3. Press `Ctrl+Shift+Enter` to execute all
4. Wait for "Query executed successfully" message

#### Step 5: Verify Demo Data
```sql
-- Check demo accounts
SELECT user_id, full_name, email, role 
FROM users 
ORDER BY user_id;

-- Should show 4 users:
-- admin@rentease.local
-- owner@rentease.local
-- seeker@rentease.local
-- parent@rentease.local
```

#### Step 6: Refresh DataGrip
- Press `Ctrl+F5` to refresh database view
- Or right-click database → **"Refresh"**

---

## Quick Scripts for DataGrip

### Script 1: View All Users
```sql
SELECT 
    user_id,
    full_name,
    email,
    role,
    email_verified,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created
FROM users
ORDER BY created_at DESC;
```

### Script 2: Count Records
```sql
SELECT 
    'users' as table_name, 
    COUNT(*) as count,
    CONCAT(COUNT(*), ' records') as status
FROM users
UNION ALL
SELECT 'reservations', COUNT(*), CONCAT(COUNT(*), ' records') FROM reservations
UNION ALL
SELECT 'payments', COUNT(*), CONCAT(COUNT(*), ' records') FROM payments
UNION ALL
SELECT 'feedback', COUNT(*), CONCAT(COUNT(*), ' records') FROM feedback
UNION ALL
SELECT 'uploads', COUNT(*), CONCAT(COUNT(*), ' records') FROM uploads
UNION ALL
SELECT 'account_links', COUNT(*), CONCAT(COUNT(*), ' records') FROM account_links;
```

### Script 3: Delete Test Users Only
```sql
-- View test users first
SELECT * FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%'
   OR email LIKE '%demo%';

-- If looks good, delete them
DELETE FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%example%'
   OR email LIKE '%demo%';

-- Verify deletion
SELECT COUNT(*) as remaining_users FROM users;
```

### Script 4: Safe Delete with Confirmation
```sql
-- Step 1: See what will be deleted
SELECT 
    user_id,
    full_name,
    email,
    role,
    'WILL BE DELETED' as status
FROM users
WHERE email = 'test@example.com';

-- Step 2: If correct, uncomment and run:
-- DELETE FROM users WHERE email = 'test@example.com';

-- Step 3: Verify
SELECT * FROM users WHERE email = 'test@example.com';
-- Should return 0 rows
```

---

## DataGrip Tips & Tricks

### Tip 1: Use Transactions for Safety
```sql
START TRANSACTION;

-- Your DELETE or TRUNCATE statements here
DELETE FROM users WHERE role = 'seeker';

-- Check results
SELECT * FROM users;

-- If good: COMMIT;
-- If bad: ROLLBACK;
```

DataGrip shows transaction status in bottom bar.

### Tip 2: Use Table Editor for Visual Editing
1. Double-click table name
2. Edit cells directly (like Excel)
3. Delete rows with `Ctrl+Delete`
4. Click **"Submit"** to save changes
5. Click **"Rollback"** to undo

### Tip 3: Filter Data Before Delete
1. Open `users` table
2. Click filter icon (funnel) in column header
3. Set filter: `email LIKE '%test%'`
4. Select filtered rows
5. Right-click → **"Delete Row(s)"**

### Tip 4: Use SQL History
- Press `Ctrl+H` to see SQL history
- Rerun previous queries
- Copy queries from history

### Tip 5: Save Frequently Used Queries
1. Write your query
2. Right-click in editor
3. Select **"Save as Scratch File"**
4. Or save as `.sql` file in project

---

## Troubleshooting in DataGrip

### Issue: "Cannot truncate table" error
**Solution:**
```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
```

### Issue: Changes not showing
**Solution:**
- Press `Ctrl+F5` to refresh
- Or click refresh icon in database panel

### Issue: "Submit" button disabled
**Solution:**
- Make sure you're in edit mode
- Check if you have write permissions
- Try reconnecting to database

### Issue: Query takes too long
**Solution:**
- Click red stop button (or press `Ctrl+F2`)
- Check query for missing WHERE clause
- Add LIMIT clause for testing

---

## Recommended Workflow for Your Project

### For Regular Testing:
```sql
-- Quick clear test users
DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example%';
```

### For Fresh Demo:
```sql
-- Full reset
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payments;
TRUNCATE TABLE reservations;
TRUNCATE TABLE feedback;
TRUNCATE TABLE uploads;
TRUNCATE TABLE account_links;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE error_logs;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Then run phase7_demo_seed.sql file
```

### For Defense Preparation:
1. Export current data as backup
2. Run full clear script
3. Run demo seed file
4. Verify 4 demo accounts exist
5. Test login with each account

---

## DataGrip Console Template

Save this as a scratch file for quick access:

```sql
-- ============================================
-- RENTEASE: Quick Clear & Verify
-- ============================================

USE rentease_db;

-- 1. VIEW CURRENT DATA
SELECT 'Current Users:' as info;
SELECT user_id, full_name, email, role FROM users;

-- 2. CLEAR ALL DATA (uncomment to run)
/*
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payments;
TRUNCATE TABLE reservations;
TRUNCATE TABLE feedback;
TRUNCATE TABLE uploads;
TRUNCATE TABLE account_links;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE error_logs;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
*/

-- 3. VERIFY EMPTY
SELECT 'After Clear:' as info;
SELECT COUNT(*) as user_count FROM users;

-- 4. RESEED (run phase7_demo_seed.sql file separately)

-- 5. VERIFY DEMO DATA
SELECT 'Demo Accounts:' as info;
SELECT user_id, full_name, email, role FROM users ORDER BY user_id;
```

---

## Quick Reference Card

### Clear Everything:
```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payments;
TRUNCATE TABLE reservations;
TRUNCATE TABLE feedback;
TRUNCATE TABLE uploads;
TRUNCATE TABLE account_links;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE error_logs;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
```

### Delete One User:
```sql
DELETE FROM users WHERE email = 'test@example.com';
```

### View Users:
```sql
SELECT * FROM users ORDER BY created_at DESC;
```

### Count Users:
```sql
SELECT role, COUNT(*) as count FROM users GROUP BY role;
```

### Reseed Demo:
Open file: `rentease/database/phase7_demo_seed.sql` → Execute All

---

**DataGrip is perfect for database management!** 🎉

The GUI makes it easy to:
- ✅ View data before deleting
- ✅ Delete specific rows visually
- ✅ Use transactions safely
- ✅ Export backups easily
- ✅ Run SQL files with one click

**Recommended:** Use the Query Console method for full control and safety.
