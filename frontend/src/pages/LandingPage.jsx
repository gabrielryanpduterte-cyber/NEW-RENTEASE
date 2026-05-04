import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

function LandingPage() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    fetch('/backend/auth.php?action=me')
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="nav-brand">RentEase</div>
        <div className="nav-actions">
          <Link to="/login" className="button-secondary">Sign In</Link>
          <Link to="/register" className="button-primary">Get Started</Link>
        </div>
      </nav>

      <section className="hero-section">
        <h1>Find Your Perfect Boarding House</h1>
        <p className="hero-subtitle">
          Connect students, parents, and property owners in one simple platform
        </p>

        <div className="hero-cta">
          <Link to="/register" className="button-primary button-large">
            Start Your Search
          </Link>
          <Link to="/login" className="button-secondary button-large">
            I Have an Account
          </Link>
        </div>

        {backendStatus === 'offline' && (
          <div className="error-panel" style={{ marginTop: '2rem', maxWidth: '600px', margin: '2rem auto' }}>
            <h3>⚠️ Backend Server Offline</h3>
            <p>The backend server is not running. Please:</p>
            <ol style={{ textAlign: 'left', marginTop: '1rem' }}>
              <li>Open XAMPP Control Panel</li>
              <li>Start Apache (click "Start" button)</li>
              <li>Start MySQL (click "Start" button)</li>
              <li>Refresh this page</li>
            </ol>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Backend should be at: <code>C:\xampp\htdocs\rentease\backend\</code>
            </p>
          </div>
        )}

        {backendStatus === 'online' && (
          <div className="status-panel" style={{ marginTop: '2rem' }}>
            <p>✅ Backend Connected</p>
          </div>
        )}
      </section>

      <section className="features-section">
        <h2>How RentEase Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🏠</div>
            <h3>For Property Owners</h3>
            <p>List your boarding houses, manage rooms, and connect with students</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎓</div>
            <h3>For Students</h3>
            <p>Browse available rooms, compare prices, and book your ideal place</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍👩‍👧</div>
            <h3>For Parents</h3>
            <p>Monitor your child's accommodation and stay connected</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2024 RentEase. Simplifying boarding house management.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
