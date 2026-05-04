import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authApi, describeApiError } from '../api/client.js';
import { useAuth } from '../auth/useAuth.js';
import { roleDashboardPath } from '../utils/roles.js';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';

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

  if (authState.status === 'authenticated') {
    return <Navigate to={roleDashboardPath(authState.user?.role)} replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setFeedback('');
    setSubmitting(true);

    try {
      await authApi.register(form);

      // Auto-login after successful registration
      const loginResult = await login({
        email: form.email,
        password: form.password,
        role: form.role,
      });

      if (!loginResult.success) {
        setFeedback(loginResult.errors?.[0] || loginResult.message || 'Registration succeeded but auto-login failed. Please try logging in manually.');
        setSubmitting(false);
        return;
      }

      // Navigate to the appropriate dashboard
      const dashboardPath = roleDashboardPath(form.role);
      navigate(dashboardPath, { replace: true });
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error?.errors?.[0] || error?.message || 'Registration failed. Please try again.';
      setFeedback(errorMessage);
      setSubmitting(false);
    }
  }

  const handleGoogleSuccess = (data) => {
    navigate(roleDashboardPath(data.data.role), { replace: true });
  };

  const handleGoogleError = (error) => {
    setFeedback(error || 'Google sign-in failed. Please try again.');
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <p className="hero-kicker">RentEase</p>
        <h1>Create an Account for Role-Based Access.</h1>
        <p className="hero-body">
          Register as seeker, parent, or owner. Admin accounts remain restricted to
          backend/admin creation.
        </p>

        <div className="hero-pills">
          <span>Self-Registration</span>
          <span>Session Auth</span>
          <span>RBAC Ready</span>
        </div>
      </section>

      <section className="login-card">
        <h2>Create account</h2>
        <p>Fill in the required fields and continue to your dashboard.</p>

        <form onSubmit={onSubmit} className="form-stack">
          <label htmlFor="full_name">Full Name</label>
          <input
            id="full_name"
            type="text"
            value={form.full_name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                full_name: event.target.value,
              }))
            }
            placeholder="Juan Dela Cruz"
            required
          />

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
            placeholder="you@example.com"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            placeholder="At least 8 characters"
            minLength={8}
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
          >
            <option value="seeker">Seeker</option>
            <option value="parent">Parent</option>
            <option value="owner">Owner</option>
          </select>

          <label htmlFor="contact_number">Contact Number</label>
          <input
            id="contact_number"
            type="text"
            value={form.contact_number}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                contact_number: event.target.value,
              }))
            }
            placeholder="09XXXXXXXXX"
            required
          />

          {feedback && (
            <div className="error-panel">
              <p>{feedback}</p>
            </div>
          )}

          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Register'}
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
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}

export default RegisterPage;
