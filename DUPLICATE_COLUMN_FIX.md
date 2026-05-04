# 🔍 DUPLICATE COLUMN ERROR - DIAGNOSTIC GUIDE

## Error You're Seeing:
```
#1060 - Duplicate column name 'email_verified'
```

---

## ✅ Good News!

**This error means the migration is already partially or fully complete!**

The columns already exist in your database, which means:
- Someone already ran the migration, OR
- You ran it before and forgot, OR
- The system auto-migrated somehow

---

## 🎯 What To Do Now:

### Step 1: Check Migration Status

Run this in phpMyAdmin SQL tab:

```sql
DESCRIBE users;
```

**Look for these 5 columns:**
- `email_verified` (TINYINT)
- `verification_token` (VARCHAR 64)
- `verification_token_expires` (DATETIME)
- `password_reset_token` (VARCHAR 64)
- `password_reset_expires` (DATETIME)

---

### Step 2: Determine Your Situation

#### Scenario A: All 5 Columns Exist ✅
**Status:** Migration is COMPLETE!

**What to do:**
1. ✅ Skip the migration step
2. ✅ Go directly to testing (Step 3 in SETUP_CHECKLIST.md)
3. ✅ Your system is ready to use!

#### Scenario B: Only Some Columns Exist ⚠️
**Status:** Partial migration (rare)

**What to do:**
1. Run the safe migration script: `database/phase11_safe_migration.sql`
2. It will only add missing columns
3. Won't error on existing columns

#### Scenario C: Columns Exist But Wrong Type ⚠️
**Status:** Need to fix column types

**What to do:**
1. Check column types with:
   ```sql
   SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'rentease_db'
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME IN (
         'email_verified',
         'verification_token',
         'verification_token_expires',
         'password_reset_token',
         'password_reset_expires'
     );
   ```

2. If types are wrong, run the fix script below

---

## 🔧 Fix Scripts

### Fix 1: Safe Migration (Adds Only Missing Columns)

**File:** `database/phase11_safe_migration.sql`

This script:
- ✅ Checks each column before adding
- ✅ Skips if already exists
- ✅ Adds indexes if missing
- ✅ Safe to run multiple times

**How to use:**
1. Open phpMyAdmin
2. Select `rentease_db`
3. Click "SQL" tab
4. Copy contents of `phase11_safe_migration.sql`
5. Paste and click "Go"

---

### Fix 2: Verify Indexes Exist

Run this to check indexes:

```sql
SHOW INDEX FROM users WHERE Key_name IN (
    'idx_verification_token',
    'idx_password_reset_token',
    'idx_email_verified'
);
```

**Expected:** Should see 3 indexes

**If missing, add them:**

```sql
CREATE INDEX IF NOT EXISTS idx_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_email_verified ON users(email_verified);
```

---

### Fix 3: Ensure Existing Users Are Verified

Run this to make sure existing users can login:

```sql
UPDATE users 
SET email_verified = 1 
WHERE email_verified IS NULL OR email_verified = 0;
```

**This ensures backward compatibility!**

---

## 🧪 Verify Everything Works

### Test 1: Check All Columns Exist

```sql
SELECT 
    user_id,
    email,
    email_verified,
    verification_token,
    verification_token_expires,
    password_reset_token,
    password_reset_expires
FROM users
LIMIT 1;
```

**Expected:** Query runs without error, shows all columns

---

### Test 2: Check Existing Users Are Verified

```sql
SELECT 
    email,
    email_verified,
    CASE 
        WHEN email_verified = 1 THEN '✅ Can Login'
        ELSE '❌ Cannot Login'
    END as status
FROM users;
```

**Expected:** All existing users show "✅ Can Login"

---

### Test 3: Test Registration

Use Postman or your frontend:

```
POST http://localhost/rentease/backend/auth.php?action=register

Body:
{
  "full_name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "seeker",
  "contact_number": "09171234567"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email...",
  "data": {
    "requires_verification": true
  }
}
```

---

### Test 4: Check New User in Database

```sql
SELECT 
    email,
    email_verified,
    verification_token,
    verification_token_expires
FROM users
WHERE email = 'test@example.com';
```

**Expected:**
- `email_verified` = 0 (unverified)
- `verification_token` = (64-character token)
- `verification_token_expires` = (future datetime)

---

### Test 5: Test Existing User Login

```
POST http://localhost/rentease/backend/auth.php?action=login

Body:
{
  "email": "seeker@rentease.local",
  "password": "password",
  "role": "seeker"
}
```

**Expected:** ✅ Success (existing users can login)

---

## 📊 Migration Status Checklist

Run through this checklist:

- [ ] All 5 columns exist in users table
- [ ] All 3 indexes exist
- [ ] Existing users have `email_verified = 1`
- [ ] New user registration works
- [ ] New users get `email_verified = 0`
- [ ] Verification token is generated
- [ ] Existing users can still login
- [ ] No errors in PHP error log

**If all checked:** ✅ Migration is complete and working!

---

## 🎯 Next Steps

Once migration is verified:

1. ✅ **Skip to Step 3** in `SETUP_CHECKLIST.md`
2. ✅ **Test all backend APIs**
3. ✅ **Implement frontend components**

---

## 🆘 Still Having Issues?

### Issue: "Column exists but wrong type"

**Fix:**
```sql
-- Backup first!
ALTER TABLE users MODIFY COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE users MODIFY COLUMN verification_token VARCHAR(64) NULL;
ALTER TABLE users MODIFY COLUMN verification_token_expires DATETIME NULL;
ALTER TABLE users MODIFY COLUMN password_reset_token VARCHAR(64) NULL;
ALTER TABLE users MODIFY COLUMN password_reset_expires DATETIME NULL;
```

### Issue: "Existing users can't login"

**Fix:**
```sql
UPDATE users SET email_verified = 1;
```

### Issue: "New users not getting tokens"

**Check:**
1. Is `EMAIL_VERIFICATION_ENABLED = true` in `backend/config/features.php`?
2. Is `REQUIRE_EMAIL_VERIFICATION = true` in `backend/config/features.php`?
3. Check PHP error log for errors

---

## ✅ Summary

**The "duplicate column" error is actually GOOD NEWS!**

It means:
- ✅ Migration already done (fully or partially)
- ✅ System is ready or almost ready
- ✅ Just need to verify and test

**Next:** Run the verification queries above, then proceed to testing!

---

**Last Updated:** April 28, 2026  
**Status:** Diagnostic Guide  
**Purpose:** Help resolve duplicate column error
