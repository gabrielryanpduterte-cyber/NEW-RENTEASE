import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Home,
  Menu,
  MessageCircle,
  ShieldCheck,
  Star,
  WalletCards,
  X,
} from 'lucide-react';
import RoomCard from '../components/design/RoomCard.jsx';
import {
  faqs,
  featuredRooms,
  featureImages,
  publicHeroImage,
  publicStats,
  testimonials,
  trustItems,
} from '../data/renteaseContent.js';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Properties', href: '/properties' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

function PublicNav({ scrolled, mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();

  return (
    <nav className={`re-public-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="re-public-nav-inner">
        <Link to="/" className="re-brand" onClick={() => setMobileOpen(false)}>
          <span>
            <Home size={20} />
          </span>
          RentEase
        </Link>

        <div className="re-nav-links">
          {navLinks.map((item) =>
            item.href.startsWith('#') ? (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ) : (
              <Link key={item.label} to={item.href}>
                {item.label}
              </Link>
            ),
          )}
        </div>

        <div className="re-nav-actions">
          <button type="button" className="re-btn re-btn-ghost" onClick={() => navigate('/login')}>
            Login
          </button>
          <button type="button" className="re-btn re-btn-gold" onClick={() => navigate('/register')}>
            Get Started
          </button>
        </div>

        <button
          type="button"
          className="re-mobile-menu-button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="re-mobile-menu">
          {navLinks.map((item) =>
            item.href.startsWith('#') ? (
              <a key={item.label} href={item.href} onClick={() => setMobileOpen(false)}>
                {item.label}
              </a>
            ) : (
              <Link key={item.label} to={item.href} onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            ),
          )}
          <button type="button" onClick={() => navigate('/login')}>
            Login
          </button>
          <button type="button" onClick={() => navigate('/register')}>
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
}

export default function RentEaseLanding() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="re-public-page">
      <PublicNav scrolled={scrolled} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <section
        id="home"
        className="re-hero"
        style={{ '--hero-image': `url(${publicHeroImage})` }}
      >
        <div className="re-hero-content">
          <p className="re-eyebrow">Philippine boarding house rentals</p>
          <h1>Your Home Away From Home</h1>
          <p>
            Find verified boarding houses, apartments, dormitories, and student-friendly rooms
            with clear monthly rates, availability, and guardian access built in.
          </p>
          <div className="re-hero-actions">
            <button type="button" className="re-btn re-btn-gold" onClick={() => navigate('/properties')}>
              Browse Properties
            </button>
            <button type="button" className="re-btn re-btn-outline-light" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      <section className="re-trust-strip" aria-label="RentEase trust indicators">
        {trustItems.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section className="re-section">
        <div className="re-section-heading">
          <p className="re-eyebrow">Featured room previews</p>
          <h2>Start with properties, then compare their available rooms</h2>
          <Link to="/properties">View all properties</Link>
        </div>
        <div className="re-room-grid">
          {featuredRooms.slice(0, 3).map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onReserve={() => navigate(`/rooms/${room.id}`)}
            />
          ))}
        </div>
      </section>

      <section id="about" className="re-feature-rows">
        <article>
          <img src={featureImages.study} alt="Student study desk in a warm room" loading="lazy" />
          <div>
            <p className="re-eyebrow">Student-first search</p>
            <h2>Rooms that show the details before you ask</h2>
            <p>
            Browse property type, rates, capacity, amenities, room status, and house rules so
              moving decisions feel clear before reservation.
            </p>
            <ul>
              <li>
                <CheckCircle2 size={18} /> Property-first browsing with room filters
              </li>
              <li>
                <CheckCircle2 size={18} /> Clean room cards with monthly pricing
              </li>
              <li>
                <CheckCircle2 size={18} /> Mobile-friendly room detail pages
              </li>
            </ul>
          </div>
        </article>

        <article>
          <div>
            <p className="re-eyebrow">Managed operations</p>
            <h2>Landlords can track rooms, rent, and requests</h2>
            <p>
              RentEase keeps the day-to-day boarding house workflow organized, from pending
              approvals to rent status and activity logs.
            </p>
            <ul>
              <li>
                <CalendarCheck size={18} /> Reservation approval workflow
              </li>
              <li>
                <WalletCards size={18} /> Payment and income tracking
              </li>
              <li>
                <ShieldCheck size={18} /> Role-aware dashboard access
              </li>
            </ul>
          </div>
          <img src={featureImages.payments} alt="Payment records on a desk" loading="lazy" />
        </article>

        <article>
          <img src={featureImages.family} alt="Family reviewing housing information" loading="lazy" />
          <div>
            <p className="re-eyebrow">Guardian visibility</p>
            <h2>Parent access without exposing landlord tools</h2>
            <p>
              Guardians get a focused read-only view of dependent room, reservation, and payment
              status without landlord-only controls.
            </p>
            <ul>
              <li>
                <MessageCircle size={18} /> Linked parent and seeker accounts
              </li>
              <li>
                <Building2 size={18} /> Room and boarding house overview
              </li>
              <li>
                <ShieldCheck size={18} /> Minimal, secure interface
              </li>
            </ul>
          </div>
        </article>
      </section>

      <section className="re-stats-band">
        {publicStats.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section className="re-section">
        <div className="re-section-heading centered">
          <p className="re-eyebrow">Resident feedback</p>
          <h2>Trusted by students, parents, and landlords</h2>
        </div>
        <div className="re-testimonial-grid">
          {testimonials.map((item) => (
            <article key={item.name} className="re-testimonial-card">
              <div aria-label={`${item.rating} star rating`}>
                {Array.from({ length: item.rating }).map((_, index) => (
                  <Star key={index} size={16} fill="currentColor" />
                ))}
              </div>
              <p>"{item.quote}"</p>
              <strong>{item.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="re-section re-faq-section">
        <div className="re-section-heading centered">
          <p className="re-eyebrow">FAQ</p>
          <h2>Questions before moving in</h2>
        </div>
        <div className="re-faq-list">
          {faqs.map((faq, index) => (
            <article key={faq.question} className={openFaq === index ? 'is-open' : ''}>
              <button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                <span>{faq.question}</span>
                <ChevronDown size={20} />
              </button>
              <div>
                <p>{faq.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="re-cta-band">
        <div>
          <p className="re-eyebrow">Ready to compare properties?</p>
          <h2>Start with available properties and reserve a room when you are ready.</h2>
        </div>
        <button type="button" className="re-btn re-btn-gold" onClick={() => navigate('/properties')}>
          Browse Properties
        </button>
      </section>

      <footer className="re-footer">
        <div>
          <h3>RentEase</h3>
          <p>Boarding house rental management for students, parents, and landlords.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <Link to="/properties">Properties</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
        <div>
          <h4>Contact</h4>
          <p>support@rentease.local</p>
          <p>Manila, Philippines</p>
        </div>
      </footer>
    </main>
  );
}
