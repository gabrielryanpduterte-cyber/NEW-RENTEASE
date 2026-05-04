-- RENTEASE Phase 12: Google OAuth Authentication
-- Migration: Add Google OAuth support
-- Date: 2026-04-29
-- Status: SAFE - Non-destructive, backward compatible

-- ============================================
-- STEP 1: Add Google OAuth Column
-- ============================================

ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) NULL 
    COMMENT 'Google OAuth user ID for "Sign in with Google"',
ADD COLUMN profile_picture VARCHAR(500) NULL 
    COMMENT 'Profile picture URL from Google OAuth',
ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'local' 
    COMMENT 'Authentication provider: local, google';

-- ============================================
-- STEP 2: Add Index for Performance
-- ============================================

CREATE INDEX idx_google_id ON users(google_id);
CREATE INDEX idx_auth_provider ON users(auth_provider);

-- ============================================
-- STEP 3: Update Existing Users
-- ============================================
-- All existing users use local authentication

UPDATE users 
SET auth_provider = 'local' 
WHERE auth_provider IS NULL OR auth_provider = '';

-- ============================================
-- STEP 4: Make Password Optional for OAuth Users
-- ============================================
-- Google OAuth users don't need passwords
-- Modify password_hash to allow NULL for OAuth users

ALTER TABLE users 
MODIFY COLUMN password_hash VARCHAR(255) NULL 
    COMMENT 'Password hash (NULL for OAuth users)';

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the migration was successful:
-- SELECT user_id, email, auth_provider, google_id, profile_picture FROM users;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- ✅ Existing users: auth_provider = 'local' (password login)
-- ✅ New Google users: auth_provider = 'google' (OAuth login)
-- ✅ Backward compatible: No breaking changes
-- ✅ Users can have both local and Google auth
