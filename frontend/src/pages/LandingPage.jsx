import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

// ============================================================
// SVG ICONS — stroke-based, terracotta accent
// ============================================================

function IconBuilding() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  );
}

function IconStudent() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}

function IconFamily() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/>
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      <path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IconAlertCircle() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

// ============================================================
// MARQUEE DATA
// ============================================================
const marqueeItems = [
  '500+ Properties Listed',
  '2,400+ Students Served',
  '180+ Property Owners',
  'Parent Dashboard Included',
  'Free to Get Started',
];

// ============================================================
// BACKEND STATUS — ambient pill (never a full error panel)
// ============================================================
function BackendStatus({ status }) {
  if (status === 'checking') return null;

  if (status === 'online') {
    return (
      <div className="lp-status">
        <span className="lp-status-pill lp-status-online">
          <IconCheck />
          System ready
        </span>
      </div>
    );
  }

  return (
    <div className="lp-status">
      <span className="lp-offline-wrap">
        <span className="lp-status-pill lp-status-offline">
          <IconAlertCircle />
          Backend offline
        </span>
        <div className="lp-offline-tooltip" role="tooltip">
          <strong>Backend not running</strong>
          <ol>
            <li>Open XAMPP Control Panel</li>
            <li>Start Apache and MySQL</li>
            <li>Refresh this page</li>
          </ol>
          <p style={{ marginTop: '0.5rem', color: '#a8a29e' }}>
            Path: <code style={{ fontSize: '0.72rem', background: '#f8fafc', padding: '0.1rem 0.3rem', borderRadius: '0.2rem', border: '1px solid #e7e5e0' }}>C:\xampp\htdocs\rentease\backend\</code>
          </p>
        </div>
      </span>
    </div>
  );
}

// ============================================================
// FEATURE CARD — scroll-reveal via IntersectionObserver
// ============================================================
function FeatureCard({ icon, title, description, delay }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="lp-feature-card"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="lp-feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

// ============================================================
// MAIN LANDING PAGE
// ============================================================
function LandingPage() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    fetch('/backend/auth.php?action=me')
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  const features = [
    {
      icon: <IconBuilding />,
      title: 'For Property Owners',
      description: 'List your boarding houses, manage rooms, and connect with students — all in one clean dashboard.',
    },
    {
      icon: <IconStudent />,
      title: 'For Students',
      description: 'Browse available rooms, compare prices, and book your ideal place without the usual friction.',
    },
    {
      icon: <IconFamily />,
      title: 'For Parents',
      description: 'Monitor your child\'s accommodation and stay connected throughout their stay.',
    },
  ];

  // Duplicate marquee items for seamless CSS loop
  const marqueeContent = [...marqueeItems, ...marqueeItems];

  return (
    <div className="landing-page">
      {/* ── NAV ── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-nav-brand">RentEase</Link>
        <div className="lp-nav-actions">
          <Link to="/login" className="lp-btn lp-btn-text">Sign in</Link>
          <Link to="/register" className="lp-btn lp-btn-outline">Get started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <p className="lp-kicker">Boarding House Platform</p>
          <h1>Finding your next home should feel right.</h1>
          <p className="lp-hero-subtitle">
            Connect students, parents, and property owners in one simple platform.
            No clutter. No noise. Just the tools you need.
          </p>
          <div className="lp-hero-cta">
            <Link to="/register" className="lp-btn lp-btn-primary lp-btn-large">
              Start your search
            </Link>
            <Link to="/login" className="lp-btn lp-btn-outline lp-btn-large">
              I have an account
            </Link>
          </div>
          <BackendStatus status={backendStatus} />
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-inner">
          {marqueeContent.map((item, i) => (
            <span key={i} className="lp-marquee-item">
              {item}
              <span className="lp-marquee-dot" />
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="lp-features">
        <div className="lp-features-inner">
          <div className="lp-features-header">
            <h2>Three paths, one platform</h2>
            <p>RentEase works for everyone involved in student housing.</p>
          </div>
          <div className="lp-features-grid">
            {features.map((f, i) => (
              <FeatureCard
                key={i}
                icon={f.icon}
                title={f.title}
                description={f.description}
                delay={i * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── EDITORIAL CALLOUT ── */}
      <section className="lp-callout">
        <div className="lp-callout-inner">
          <blockquote>
            "Student housing doesn't have to be complicated.
            We built RentEase to make it simple."
          </blockquote>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <span className="lp-nav-brand">RentEase</span>
              <p>Simplifying boarding house management for students, parents, and property owners.</p>
            </div>
            <div className="lp-footer-col">
              <h4>Platform</h4>
              <ul>
                <li><Link to="/register">Get Started</Link></li>
                <li><Link to="/login">Sign In</Link></li>
                <li><Link to="/register">For Students</Link></li>
                <li><Link to="/register">For Owners</Link></li>
              </ul>
            </div>
            <div className="lp-footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <p>&copy; {new Date().getFullYear()} RentEase. All rights reserved.</p>
            <p>Built for students.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
