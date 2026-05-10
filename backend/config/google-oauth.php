<?php
/**
 * RENTEASE - Google OAuth Configuration
 * Phase 12: Google Authentication
 */

// ============================================
// GOOGLE OAUTH SETTINGS
// ============================================

// Get your Google OAuth credentials from:
// https://console.cloud.google.com/apis/credentials

function google_oauth_config(string $name, string $defaultValue): string
{
    $value = getenv($name);
    if ($value === false || $value === '') {
        return $defaultValue;
    }

    return $value;
}

define('GOOGLE_OAUTH_ENABLED', filter_var(google_oauth_config('GOOGLE_OAUTH_ENABLED', 'true'), FILTER_VALIDATE_BOOLEAN));

// Google OAuth Client ID (from Google Cloud Console)
define('GOOGLE_CLIENT_ID', google_oauth_config('GOOGLE_CLIENT_ID', '845871313570-a58vib4ul9bap6euavssl4s0t5gehe4u.apps.googleusercontent.com'));

// Google OAuth Client Secret (set GOOGLE_CLIENT_SECRET in the environment)
define('GOOGLE_CLIENT_SECRET', google_oauth_config('GOOGLE_CLIENT_SECRET', ''));

// Authorized redirect URI (must match Google Cloud Console)
define('GOOGLE_REDIRECT_URI', google_oauth_config('GOOGLE_REDIRECT_URI', 'http://localhost:5173/auth/google/callback'));

// ============================================
// OAUTH SETTINGS
// ============================================

// Auto-verify email for Google OAuth users (Google already verified them)
define('GOOGLE_AUTO_VERIFY_EMAIL', true);

// Allow admin role creation via Google OAuth (SECURITY: set to false)
define('GOOGLE_ALLOW_ADMIN_ROLE', false);

// Default role for Google OAuth users if not specified
define('GOOGLE_DEFAULT_ROLE', 'seeker');

?>
