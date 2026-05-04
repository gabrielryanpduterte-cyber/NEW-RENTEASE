-- RENTEASE Phase 11: Email Verification & Password Reset
-- ROLLBACK SCRIPT - Use this to undo the migration
-- Date: 2026-04-28
-- WARNING: This will remove all email verification data

-- ============================================
-- ROLLBACK: Remove Email Verification Features
-- ============================================

-- Step 1: Drop indexes
DROP INDEX IF EXISTS idx_verification_token ON users;
DROP INDEX IF EXISTS idx_password_reset_token ON users;
DROP INDEX IF EXISTS idx_email_verified ON users;

-- Step 2: Remove columns
ALTER TABLE users 
DROP COLUMN IF EXISTS email_verified,
DROP COLUMN IF EXISTS verification_token,
DROP COLUMN IF EXISTS verification_token_expires,
DROP COLUMN IF EXISTS password_reset_token,
DROP COLUMN IF EXISTS password_reset_expires;

-- ============================================
-- ROLLBACK COMPLETE
-- ============================================
-- ✅ All email verification columns removed
-- ✅ System reverted to pre-Phase 11 state
-- ✅ Existing functionality preserved
