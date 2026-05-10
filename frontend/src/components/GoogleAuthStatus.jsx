import { ENABLE_GOOGLE_AUTH, GOOGLE_CONFIG } from '../config/google-oauth.js';

export default function GoogleAuthStatus() {
  const isConfigured = GOOGLE_CONFIG.clientId && GOOGLE_CONFIG.clientId.includes('.apps.googleusercontent.com');
  
  return (
    <div style={{ 
      padding: '1rem', 
      margin: '1rem 0', 
      borderRadius: '8px',
      backgroundColor: ENABLE_GOOGLE_AUTH ? '#fef3c7' : '#e5e7eb',
      border: '1px solid',
      borderColor: ENABLE_GOOGLE_AUTH ? '#f59e0b' : '#9ca3af'
    }}>
      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 'bold' }}>
        Google Authentication Status
      </h4>
      <div style={{ fontSize: '0.85rem' }}>
        <div>
          <strong>Enabled:</strong> {ENABLE_GOOGLE_AUTH ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>Client ID:</strong> {isConfigured ? '✅ Configured' : '❌ Not configured'}
        </div>
        {ENABLE_GOOGLE_AUTH && !isConfigured && (
          <div style={{ marginTop: '0.5rem', color: '#dc2626' }}>
            ⚠️ Google Auth is enabled but Client ID is not properly configured.
            <br />
            See <code>QUICK_GOOGLE_SETUP.md</code> for setup instructions.
          </div>
        )}
        {!ENABLE_GOOGLE_AUTH && (
          <div style={{ marginTop: '0.5rem', color: '#6b7280' }}>
            ℹ️ Using email/password authentication only.
            <br />
            Set <code>ENABLE_GOOGLE_AUTH = true</code> to enable Google Sign-In.
          </div>
        )}
      </div>
    </div>
  );
}
