# 🗑️ DATABASE CLEANUP - QUICK REFERENCE

## Choose Your Method:

---

## ⚡ Method 1: PowerShell Script (Easiest)

### Clean Test Users Only:
```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\scripts"
.\clean-database.ps1
```

**What it does:**
- ✅ Removes all test users
- ✅ Keeps demo accounts (admin, owner, seeker, parent)
- ✅ Shows before/after user list
- ✅ Safe and quick

### Full Database Reset:
```powershell
.\clean-database.ps1 -FullReset
```

**What it does:**
- ⚠️ Resets entire database
- ✅ Restores demo accounts
- ✅ Re-runs Phase 11 migration
- ⚠️ Asks for confirmation

---

## 🌐 Method 2: phpMyAdmin (Visual)

1. Go to: `http://localhost/phpmyadmin`
2. Click `rentease_db`
3. Click `users` table
4. Click "SQL" tab
5. Paste this:

```sql
-- Remove test users
DELETE FROM users 
WHERE email NOT IN (
    'admin@rentease.local',
    'owner@rentease.local',
    'seeker@rentease.local',
    'parent@rentease.local'
);
```

6. Click "Go"

---

## 💻 Method 3: MySQL Command Line

```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root rentease_db
```

Then run:
```sql
-- Show test users
SELECT user_id, email, role FROM users 
WHERE email NOT IN (
    'admin@rentease.local',
    'owner@rentease.local',
    'seeker@rentease.local',
    'parent@rentease.local'
);

-- Delete them
DELETE FROM users 
WHERE email NOT IN (
    'admin@rentease.local',
    'owner@rentease.local',
    'seeker@rentease.local',
    'parent@rentease.local'
);

-- Verify
SELECT user_id, email, role FROM users;

-- Exit
exit;
```

---

## 📝 Method 4: SQL File (Automated)

Run the cleanup script:

```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root rentease_db < "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\database\clean_test_data.sql"
```

---

## 🎯 Quick Commands

### Delete Specific User:
```sql
DELETE FROM users WHERE email = 'test@example.com';
```

### Delete All Test Users (*.example.com):
```sql
DELETE FROM users WHERE email LIKE '%@example.com';
```

### Reset Verification Status:
```sql
UPDATE users 
SET email_verified = 1,
    verification_token = NULL,
    verification_token_expires = NULL
WHERE email = 'test@example.com';
```

### Clear All Tokens:
```sql
UPDATE users 
SET verification_token = NULL,
    verification_token_expires = NULL,
    password_reset_token = NULL,
    password_reset_expires = NULL;
```

### View All Users:
```sql
SELECT user_id, email, role, email_verified, 
       verification_token IS NOT NULL as has_verify_token,
       password_reset_token IS NOT NULL as has_reset_token
FROM users 
ORDER BY created_at DESC;
```

---

## 🔄 Testing Workflow

### Before Each Test:
```powershell
# Clean test data
.\clean-database.ps1

# Start frontend
cd ..\frontend
npm run dev
```

### After Testing:
```powershell
# Clean again for next test
cd ..\scripts
.\clean-database.ps1
```

---

## 📊 Demo Accounts (Always Preserved)

These accounts are NEVER deleted:

| Email | Password | Role |
|-------|----------|------|
| admin@rentease.local | password | admin |
| owner@rentease.local | password | owner |
| seeker@rentease.local | password | seeker |
| parent@rentease.local | password | parent |

All have `email_verified = 1` (already verified)

---

## ⚠️ Important Notes

### What Gets Deleted:
- ✅ Test users (any email not in demo list)
- ✅ Their reservations
- ✅ Their payments
- ✅ Their feedback
- ✅ Their activity logs
- ✅ Their account links

### What's Preserved:
- ✅ Demo accounts (4 users)
- ✅ Boarding house data
- ✅ Room data
- ✅ Database schema
- ✅ Phase 11 migration

### Cascade Deletes:
When you delete a user, these are automatically deleted:
- Their reservations (CASCADE)
- Their payments (CASCADE)
- Their feedback (CASCADE)
- Their activity logs (CASCADE)
- Their account links (CASCADE)

---

## 🆘 Troubleshooting

### Issue: "Cannot delete user - foreign key constraint"
**Cause:** User has related data
**Fix:** The CASCADE should handle this automatically. If not:
```sql
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM users WHERE email = 'test@example.com';
SET FOREIGN_KEY_CHECKS = 1;
```

### Issue: "Access denied"
**Cause:** MySQL user doesn't have DELETE permission
**Fix:** Use root user:
```powershell
.\mysql.exe -u root rentease_db
```

### Issue: Script not found
**Cause:** Wrong directory
**Fix:**
```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\scripts"
```

---

## 🎯 Recommended Workflow

### For Quick Testing:
```powershell
# 1. Clean data
.\clean-database.ps1

# 2. Test
# (do your testing)

# 3. Clean again
.\clean-database.ps1
```

### For Fresh Start:
```powershell
# Full reset
.\clean-database.ps1 -FullReset
```

### For Specific User:
```sql
-- In phpMyAdmin or MySQL
DELETE FROM users WHERE email = 'specific@example.com';
```

---

## 📁 Files Created

1. ✅ `database/clean_test_data.sql` - SQL cleanup script
2. ✅ `scripts/clean-database.ps1` - PowerShell cleanup script
3. ✅ `DATABASE_CLEANUP_GUIDE.md` - This guide

---

**Recommendation:** Use the PowerShell script - it's the easiest and safest!

```powershell
cd scripts
.\clean-database.ps1
```

Done! 🎉
