import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

function NotFoundPage() {
  return (
    <main className="re-simple-state-page">
      <section className="re-simple-state-card">
        <div aria-hidden="true">
          <Home size={34} />
        </div>
        <p className="re-eyebrow">404</p>
        <h1>Lost your way?</h1>
        <p>The page you opened is not available in RentEase.</p>
        <Link className="re-btn re-btn-primary" to="/">
          Go Home
        </Link>
      </section>
    </main>
  );
}

export default NotFoundPage;
