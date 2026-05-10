import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { authImage } from '../data/renteaseContent.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="re-auth-page">
      <section className="re-auth-visual" style={{ '--auth-image': `url(${authImage})` }}>
        <div>
          <Link to="/" className="re-brand light">
            RentEase
          </Link>
          <h1>Reset access to your boarding house account.</h1>
          <p>Enter your email and follow the recovery instructions from RentEase support.</p>
        </div>
      </section>

      <section className="re-auth-panel">
        <div className="re-auth-card">
          <p className="re-eyebrow">Account recovery</p>
          <h2>Forgot password</h2>
          <p>Use the email connected to your RentEase account.</p>

          {submitted ? (
            <div className="re-success-panel">
              <MailCheck size={24} />
              <div>
                <h3>Recovery request received</h3>
                <p>
                  If this email exists in RentEase, check with your landlord or RentEase support
                  for the next reset step.
                </p>
              </div>
            </div>
          ) : (
            <form
              className="re-form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <label>
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <button type="submit" className="re-btn re-btn-primary">
                Send Reset Instructions
              </button>
            </form>
          )}

          <p className="re-auth-switch">
            Remembered your password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
