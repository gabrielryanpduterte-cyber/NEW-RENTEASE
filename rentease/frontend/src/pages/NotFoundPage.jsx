import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="fullscreen-center">
      <div className="status-panel wide-panel">
        <p className="status-kicker">404</p>
        <h1>Page Not Found</h1>
        <p>The route you entered does not exist in this frontend module.</p>
        <Link className="button-primary inline-action" to="/">
          Go to Home Redirect
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
