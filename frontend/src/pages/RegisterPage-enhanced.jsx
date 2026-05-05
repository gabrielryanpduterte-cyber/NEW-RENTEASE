import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authApi, describeApiError } from '../api/client.js';
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

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IconCurrency() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
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

function RegisterPage() {
  const { authState, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'seeker',
    contact_number: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  if (authState.status === 'authenticated') {
    return <Navigate to={roleDashboardPath(authState.user?.role)} replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setFeedback('');
    setSubmitting(true);

    try {
      const registerResponse = await authApi.register(form);

      if (registerResponse.data?.requires_verification) {
        setRequiresVerification(true);
        setRegisteredEmail(form.email);
        setSubmitting(false);
        return;
      }

      const loginResult = await login({
        email: form.email,
        password: form.password,
        role: form.role,
      });

      if (!loginResult.success) {
        setFeedback(loginResult.errors?.[0] || loginResult.message || 'Registration succeeded but auto-login failed.');
        setSubmitting(false);
        return;
      }

      navigate(roleDashboardPath(form.role), { replace: true });
    } catch (error) {
      setFeedback(error?.errors?.[0] || describeApiError(error));
      setSubmitting(false);
    }
  }

  const handleGoogleSuccess = (data) => {
    navigate(roleDashboardPath(data.data.role), { replace: true });
  };

  const handleGoogleError = (error) => {
    setFeedback(error || 'Google sign-in failed. Please try again.');
  };

  // ── VERIFICATION STATE ──
  if (requiresVerification) {
    return (
      <div className="auth-form-panel">
        <div className="auth-verification-card">
          <div className="auth-verification-icon">
            <IconEnvelopeCheck />
          </div>
          <h2>Check your inbox</h2>
          <p>We've sent a verification link to:</p>
          <p className="auth-verification-email">{registeredEmail}</p>

          <div className="auth-verification-notice">
            Click the link in the email to activate your account. The link expires in 24 hours. Check your spam folder if it doesn't arrive.
          </div>

          <div className="auth-verification-actions">
            <Link to="/login" className="auth-btn-primary">
              Go to sign in
            </Link>
            <Link
              to="/resend-verification"
              state={{ email: registeredEmail }}
              className="auth-btn-outline"
            >
              Resend verification email
            </Link>
          </div>

          <p className="auth-footer-link" style={{ marginTop: '1rem' }}>
            Already verified?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* ── EDITORIAL PANEL (left) ── */}
      <aside className="auth-editorial">
        <p className="auth-editorial-kicker">Boarding House Platform</p>
        <h1>Find your place, simpler.</h1>
        <p>
          Create your account and join seekers, parents, and owners on one platform.
          Your role determines your dashboard — nothing more, nothing less.
        </p>

        <div className="auth-editorial-pills">
          <span>Self-Registration</span>
          <span>Session Auth</span>
          <span>RBAC Ready</span>
        </div>

        <div className="auth-editorial-features">
          <div className="auth-editorial-feature">
            <div className="auth-editorial-feature-icon"><IconHome /></div>
            <div>
              <h3>For Seekers</h3>
              <p>Browse properties, make reservations, track payments.</p>
            </div>
          </div>
          <div className="auth-editorial-feature">
            <div className="auth-editorial-feature-icon"><IconCheck /></div>
            <div>
              <h3>For Parents</h3>
              <p>Monitor your child's accommodation and payment status.</p>
            </div>
          </div>
          <div className="auth-editorial-feature">
            <div className="auth-editorial-feature-icon"><IconClipboard /></div>
            <div>
              <h3>For Owners</h3>
              <p>Manage properties, rooms, reservations, and billing.</p>
            </div>
          </div>
          <div className="auth-editorial-feature">
            <div className="auth-editorial-feature-icon"><IconCurrency /></div>
            <div>
              <h3>Integrated billing</h3>
              <p>Track payments and due dates from your dashboard.</p>
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
            <h2>Create your account</h2>
            <p>Fill in your details and choose your role to get started.</p>
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="full_name">Full name</label>
              <input
                id="full_name"
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Juan Dela Cruz"
                required
              />
            </div>

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
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="role">Register as</label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="seeker">Seeker / Boarder</option>
                <option value="parent">Parent</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <div className="auth-form-group">
              <label htmlFor="contact_number">Contact number</label>
              <input
                id="contact_number"
                type="text"
                value={form.contact_number}
                onChange={(e) => setForm((f) => ({ ...f, contact_number: e.target.value }))}
                placeholder="09XXXXXXXXX"
                required
              />
            </div>

            {feedback && (
              <div className="auth-error-banner">{feedback}</div>
            )}

            <button type="submit" className="auth-btn-primary" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

          <p className="auth-footer-link">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
