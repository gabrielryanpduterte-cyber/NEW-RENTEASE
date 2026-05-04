/**
 * RENTEASE - Google OAuth Configuration (Frontend)
 * Phase 12: Google Authentication
 */

export const GOOGLE_CONFIG = {
  // Get your Google OAuth Client ID from:
  // https://console.cloud.google.com/apis/credentials
  clientId: '845871313570-a58vib4ul9bap6euavssl4s0t5gehe4u.apps.googleusercontent.com',
  
  // Redirect URI (must match Google Cloud Console)
  redirectUri: 'http://localhost:5173/auth/google/callback',
  
  // OAuth scopes
  scope: 'openid email profile',
};

export default GOOGLE_CONFIG;
