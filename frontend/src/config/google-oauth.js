/**
 * RENTEASE - Google OAuth Configuration (Frontend)
 * Phase 12: Google Authentication
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.cloud.google.com/apis/credentials
 * 2. Create OAuth 2.0 Client ID (Web application)
 * 3. Add http://localhost:5173 to Authorized JavaScript origins
 * 4. Add http://localhost:5173/auth/google/callback to Authorized redirect URIs
 * 5. Set VITE_GOOGLE_CLIENT_ID in the environment
 * 6. Set VITE_ENABLE_GOOGLE_AUTH=true
 */

const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

// Keep disabled unless a real OAuth client is configured for the current domain.
export const ENABLE_GOOGLE_AUTH = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true';

export const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',

  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${appOrigin}/auth/google/callback`,

  // OAuth scopes
  scope: 'openid email profile',
};

export default GOOGLE_CONFIG;
