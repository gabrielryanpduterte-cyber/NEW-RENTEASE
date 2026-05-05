import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { roleDashboardPath } from '../utils/roles.js';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

function IconEnvelopeCheck() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}

function LoginPage() {
  const { authState, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'seeker',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  if (authState.status === 'authenticated') {
    return <Navigate to={roleDashboardPath(authState.user?.role)} replace />;
  }

  const fromPath = location.state?.from;

  async function onSubmit(event) {
    event.preventDefault();
    setFeedback('');
    setUnverifiedEmail('');
    setSubmitting(true);

    const result = await login(form);
    setSubmitting(false);

    if (!result.success) {
      if (result.status === 403 && result.data?.requires_verification) {
        setUnverifiedEmail(form.email);
        setFeedback('Your email address has not been verified.');
        return;
      }

      const apiError = result.errors?.[0] || result.message || 'Unable to sign in.';
      setFeedback(apiError);
      return;
    }
  }

  const handleGoogleSuccess = (data) => {
    navigate(roleDashboardPath(data.data.role), { replace: true });
  };

  const handleGoogleError = (error) => {
    setFeedback(error || 'Google sign-in failed. Please try again.');
  };

  return (
    <div className="auth-page">
      {/* ── EDITORIAL PANEL (left) ── */}
      <aside className="auth-editorial">
        <p className="auth-editorial-kicker">Boarding House Platform</p>
        <h1>Your dashboard awaits.</h1>
        <p>
          Sign in to access your role-based dashboard. Every account is scoped to
          its role — seekers, parents, owners, and admins each see what they need.
        </p>

        <div className="auth-editorial-pills">
          <span>Session Auth</span>
          <span>RBAC Routes</span>
          <span>Email Verification</span>
        </div>

        <div className="auth-editorial-features">
          <div className="auth-editorial-feature">
            <div className="auth-editorial-feature-icon"><IconCheck /></div>
            <div>
              <h3>Role-based access</h3>
              <p>Every user lands in the right dashboard for their role.</p>
            </div>
          </div>
          <div className="auth-editorial-feature">
            <div className="auth-editorial-feature-icon"><IconShield /></div>
            <div>
              <h3>Secure sessions</h3>
              <p>Your session is validated server-side on every request.</p>
            </div>
          </div>
          <div className="auth-editorial-feature">
            <div className="auth-editorial-feature-icon"><IconMail /></div>
            <div>
              <h3>Email verification</h3>
              <p>New accounts must verify their email before signing in.</p>
            </div>
          </div>
          <div className="auth-editorial-feature">
            <div className="auth-editorial-feature-icon"><IconUsers /></div>
            <div>
              <h3>Parent linking</h3>
              <p>Parents can monitor their child's boarding arrangement.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── FORM PANEL (right) ── */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-card-header">
            <Link to="/" className="auth-brand">
              RentEase
              <span className="auth-brand-dot" />
            </Link>
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to continue to your dashboard.</p>
          </div>

          {fromPath && (
            <div className="auth-error-banner" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af', marginBottom: '1.25rem' }}>
              <strong>Protected path:</strong> {fromPath}
            </div>
          )}

          <form onSubmit={onSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="role">Sign in as</label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                required
              >
                <option value="seeker">Seeker / Boarder</option>
                <option value="parent">Parent</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {feedback && (
              <div className="auth-error-banner">
                {feedback}
                {unverifiedEmail && (
                  <>
                    {' '}
                    <Link to="/resend-verification" state={{ email: unverifiedEmail }}>
                      Resend verification email →
                    </Link>
                  </>
                )}
              </div>
            )}

            <button type="submit" className="auth-btn-primary" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

          <p className="auth-footer-link">
            No account yet?{' '}
            <Link to="/register">Create one</Link>
          </p>

          <div className="auth-two-actions" style={{ marginTop: '1rem' }}>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
