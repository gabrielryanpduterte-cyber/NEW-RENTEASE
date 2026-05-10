/**
 * RENTEASE - Google OAuth Configuration (Frontend)
 * Phase 12: Google Authentication
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.cloud.google.com/apis/credentials
 * 2. Create OAuth 2.0 Client ID (Web application)
 * 3. Add http://localhost:5173 to Authorized JavaScript origins
 * 4. Add http://localhost:5173/auth/google/callback to Authorized redirect URIs
 * 5. Copy your Client ID and paste below
 * 6. Set ENABLE_GOOGLE_AUTH = true
 */

// Set to false to disable Google Sign-In and remove console errors
export const ENABLE_GOOGLE_AUTH = false;

export const GOOGLE_CONFIG = {
  // Replace with your Google OAuth Client ID from Google Cloud Console
  // Get it from: https://console.cloud.google.com/apis/credentials
  clientId: '845871313570-a58vib4ul9bap6euavssl4s0t5gehe4u.apps.googleusercontent.com',

  // Redirect URI (must match Google Cloud Console)
  redirectUri: 'http://localhost:5173/auth/google/callback',

  // OAuth scopes
  scope: 'openid email profile',
};

export default GOOGLE_CONFIG;
