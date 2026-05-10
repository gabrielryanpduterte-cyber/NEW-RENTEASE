-- Add Google OAuth columns to users table
-- Run this migration to enable Google Sign-In functionality

USE rentease_db;

-- Add google_id column (unique identifier from Google)
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER password_hash;

-- Add profile_picture column (URL to Google profile picture)
ALTER TABLE users 
ADD COLUMN profile_picture VARCHAR(500) NULL AFTER google_id;

-- Add auth_provider column (tracks how user registered: 'local' or 'google')
ALTER TABLE users 
ADD COLUMN auth_provider ENUM('local', 'google') NOT NULL DEFAULT 'local' AFTER profile_picture;

-- Add email_verified column (Google users are auto-verified)
ALTER TABLE users 
ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER auth_provider;

-- Add index for faster Google ID lookups
CREATE INDEX idx_users_google_id ON users(google_id);

-- Add index for auth provider
CREATE INDEX idx_users_auth_provider ON users(auth_provider);
