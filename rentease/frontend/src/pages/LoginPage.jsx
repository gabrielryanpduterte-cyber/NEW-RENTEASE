import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { roleDashboardPath } from '../utils/roles.js';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';

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

  if (authState.status === 'authenticated') {
    return <Navigate to={roleDashboardPath(authState.user?.role)} replace />;
  }

  const fromPath = location.state?.from;

  async function onSubmit(event) {
    event.preventDefault();
    setFeedback('');
    setSubmitting(true);

    const result = await login(form);
    setSubmitting(false);

    if (!result.success) {
      const apiError = result.errors?.[0] || result.message || 'Unable to login.';
      setFeedback(apiError);
      return;
    }
  }

  const handleGoogleSuccess = (data) => {
    // Google auth successful, navigate to dashboard
    navigate(roleDashboardPath(data.data.role), { replace: true });
  };

  const handleGoogleError = (error) => {
    setFeedback(error || 'Google sign-in failed. Please try again.');
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <p className="hero-kicker">RentEase</p>
        <h1>Boarding House Operations, Role by Role.</h1>
        <p className="hero-body">
          This frontend is integrated with Phase 3 PHP APIs for seeker, parent, owner,
          and admin workflows. Login to continue.
        </p>

        <div className="hero-pills">
          <span>React + Vite</span>
          <span>Session Auth</span>
          <span>RBAC Routes</span>
        </div>
      </section>

      <section className="login-card">
        <h2>Sign in</h2>
        <p>
          Use your registered account credentials and select the correct role for this login session.
        </p>

        {fromPath && (
          <div className="notice-panel">
            <p>
              Protected path blocked: <strong>{fromPath}</strong>
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="form-stack">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder="your-email@domain.com"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            placeholder="Enter your password"
            required
          />

          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value,
              }))
            }
            required
          >
            <option value="seeker">Seeker / Boarder</option>
            <option value="parent">Parent</option>
            <option value="owner">Owner</option>
          </select>

          {feedback && (
            <div className="error-panel">
              <p>{feedback}</p>
            </div>
          )}

          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <GoogleSignInButton 
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />

        <p className="auth-switch">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </section>
    </div>
  );
}

export default LoginPage;
