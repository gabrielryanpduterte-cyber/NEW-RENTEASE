import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Home, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../auth/useAuth.js';
import { roleDashboardPath } from '../utils/roles.js';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { authImage } from '../data/renteaseContent.js';

const loginRoles = [
  { value: 'seeker', label: 'Seeker' },
  { value: 'parent', label: 'Parent' },
  { value: 'owner', label: 'Landlord' },
  { value: 'admin', label: 'Admin' },
];

function LoginPage() {
  const { authState, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'seeker',
    remember: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (authState.status === 'authenticated') {
    return <Navigate to={roleDashboardPath(authState.user?.role)} replace />;
  }

  const fromPath = location.state?.from;

  async function onSubmit(event) {
    event.preventDefault();
    setFeedback('');
    setSubmitting(true);

    const result = await login({
      email: form.email,
      password: form.password,
      role: form.role,
    });
    setSubmitting(false);

    if (!result.success) {
      const apiError = result.errors?.[0] || result.message || 'Unable to login.';
      setFeedback(apiError);
    }
  }

  const handleGoogleSuccess = (data) => {
    navigate(roleDashboardPath(data.data.role), { replace: true });
  };

  const handleGoogleError = (error) => {
    setFeedback(error || 'Google sign-in failed. Please try again.');
  };

  return (
    <main className="re-auth-page">
      <section className="re-auth-visual" style={{ '--auth-image': `url(${authImage})` }}>
        <div>
          <Link to="/" className="re-brand light">
            <span>
              <Home size={20} />
            </span>
            RentEase
          </Link>
          <h1>Boarding house access for every role.</h1>
          <p>
            Students, guardians, landlords, and admins sign in to the same trusted platform
            with role-aware dashboards.
          </p>
          <ul>
            <li>
              <CheckCircle2 size={18} /> Verified rooms and reservation tracking
            </li>
            <li>
              <CheckCircle2 size={18} /> Payment status and guardian visibility
            </li>
            <li>
              <CheckCircle2 size={18} /> Landlord and admin controls
            </li>
          </ul>
        </div>
      </section>

      <section className="re-auth-panel">
        <div className="re-auth-card">
          <p className="re-eyebrow">Welcome back</p>
          <h2>Sign in</h2>
          <p>Select the role that matches your account.</p>

          {fromPath && (
            <div className="re-notice-panel">
              Protected page requested: <strong>{fromPath}</strong>
            </div>
          )}

          <div className="re-role-tabs" role="tablist" aria-label="Login role">
            {loginRoles.map((role) => (
              <button
                type="button"
                key={role.value}
                className={form.role === role.value ? 'active' : ''}
                onClick={() => setForm((current) => ({ ...current, role: role.value }))}
              >
                {role.label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="re-form-stack">
            <label>
              <span>Email address</span>
              <div className="re-input-with-icon">
                <Mail size={17} />
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="you@example.com"
                  required
                />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className="re-input-with-icon">
                <LockKeyhole size={17} />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Enter your password"
                  required
                />
              </div>
            </label>

            <div className="re-auth-options">
              <label>
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, remember: event.target.checked }))
                  }
                />
                Remember me
              </label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            {feedback && <div className="re-error-panel">{feedback}</div>}

            <button type="submit" className="re-btn re-btn-primary" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="re-divider">
            <span>or</span>
          </div>

          <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

          <p className="re-auth-switch">
            No account yet? <Link to="/register">Create one</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
