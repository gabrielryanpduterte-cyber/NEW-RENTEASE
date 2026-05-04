import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { roleDashboardPath } from '../utils/roles.js';

function CompleteProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshSession } = useAuth();
  
  const [form, setForm] = useState({
    role: 'seeker',
    contact_number: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  // Get Google user info from navigation state
  const googleUserInfo = location.state?.googleUserInfo;
  const googleCredential = location.state?.googleCredential;

  useEffect(() => {
    // If no Google data, redirect back to login
    if (!googleUserInfo || !googleCredential) {
      navigate('/login', { replace: true });
      return;
    }

    // Try to login with just the token (for existing users)
    const tryAutoLogin = async () => {
      try {
        console.log('🔍 Attempting auto-login for existing user...');
        
        const response = await fetch('/backend/google-auth.php?action=google-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            google_token: googleCredential,
          }),
        });

        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📦 Response data:', data);

        if (data.success && data.data.user_id) {
          // Existing user - logged in successfully
          console.log('✅ Existing user found! Redirecting to dashboard...');
          await refreshSession();
          const dashboardPath = roleDashboardPath(data.data.role);
          console.log('🚀 Redirecting to:', dashboardPath);
          navigate(dashboardPath, { replace: true });
        } else {
          // New user or error - show form
          console.log('👤 New user detected. Showing profile form...');
          setChecking(false);
        }
      } catch (err) {
        console.error('❌ Auto-login error:', err);
        // Show form on error
        setChecking(false);
      }
    };

    tryAutoLogin();
  }, [googleUserInfo, googleCredential, navigate, refreshSession]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/backend/google-auth.php?action=google-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          google_token: googleCredential,
          role: form.role,
          contact_number: form.contact_number,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        // User is now registered and logged in automatically by backend
        // Refresh auth state
        await refreshSession();
        
        // Redirect to appropriate dashboard
        const dashboardPath = roleDashboardPath(data.data.role);
        navigate(dashboardPath, { replace: true });
      } else {
        const errorMsg = data.errors?.[0] || data.message || 'Authentication failed';
        setError(errorMsg);
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Error during Google auth:', err);
      setError(err.message || 'Network error. Please try again.');
      setSubmitting(false);
    }
  };

  if (!googleUserInfo || checking) {
    return (
      <div className="fullscreen-center">
        <div className="status-panel">
          <p>{checking ? 'Checking account...' : 'Redirecting...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="complete-profile-page">
      <div className="complete-profile-container">
        <div className="complete-profile-card">
          <h1>Complete Your Profile</h1>
          <p className="subtitle">Just one more step to get started with RentEase</p>

          <div className="user-info-preview">
            {googleUserInfo.picture && (
              <img 
                src={googleUserInfo.picture} 
                alt="Profile" 
                className="profile-preview-img"
              />
            )}
            <div className="user-info-text">
              <p className="user-name">{googleUserInfo.name}</p>
              <p className="user-email">{googleUserInfo.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form-stack">
            <label htmlFor="role">I am a:</label>
            <select
              id="role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            >
              <option value="seeker">Room Seeker</option>
              <option value="parent">Parent</option>
              <option value="owner">Boarding House Owner</option>
            </select>

            <label htmlFor="contact_number">Contact Number:</label>
            <input
              id="contact_number"
              type="text"
              value={form.contact_number}
              onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
              placeholder="09XXXXXXXXX"
              pattern="09[0-9]{9}"
              title="Please enter a valid Philippine mobile number (09XXXXXXXXX)"
              required
            />

            {error && (
              <div className="error-panel">
                <p>{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              className="button-primary" 
              disabled={submitting}
            >
              {submitting ? 'Completing Registration...' : 'Complete Registration'}
            </button>
          </form>

          <p className="back-link">
            <button 
              type="button" 
              onClick={() => navigate('/login')} 
              className="text-button"
            >
              ← Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CompleteProfilePage;
