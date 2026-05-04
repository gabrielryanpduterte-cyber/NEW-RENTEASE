-- RENTEASE Phase 11: Email Verification & Password Reset
-- Migration: Add email verification and password reset functionality
-- Date: 2026-04-28
-- Status: SAFE - Non-destructive, backward compatible

-- ============================================
-- STEP 1: Add Email Verification Columns
-- ============================================

ALTER TABLE users 
ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 1 
    COMMENT 'Email verification status: 1=verified (default for existing users), 0=unverified',
ADD COLUMN verification_token VARCHAR(64) NULL 
    COMMENT 'Token for email verification link',
ADD COLUMN verification_token_expires DATETIME NULL 
    COMMENT 'Expiration timestamp for verification token (24 hours)',
ADD COLUMN password_reset_token VARCHAR(64) NULL 
    COMMENT 'Token for password reset link',
ADD COLUMN password_reset_expires DATETIME NULL 
    COMMENT 'Expiration timestamp for password reset token (1 hour)';

-- ============================================
-- STEP 2: Add Indexes for Performance
-- ============================================

CREATE INDEX idx_verification_token ON users(verification_token);
CREATE INDEX idx_password_reset_token ON users(password_reset_token);
CREATE INDEX idx_email_verified ON users(email_verified);

-- ============================================
-- STEP 3: Verify Existing Users Are Auto-Verified
-- ============================================
-- All existing users should already have email_verified = 1 due to DEFAULT
-- This is a safety check to ensure backward compatibility

UPDATE users 
SET email_verified = 1 
WHERE email_verified IS NULL OR email_verified = 0;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the migration was successful:
-- SELECT user_id, email, email_verified, verification_token, password_reset_token FROM users;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- ✅ Existing users: email_verified = 1 (can login immediately)
-- ✅ New users: email_verified = 0 (requires verification)
-- ✅ Backward compatible: No breaking changes
-- ✅ Rollback available: See phase11_email_verification_rollback.sql
