import { Link } from 'react-router-dom';

function UnauthorizedPage() {
  return (
    <div className="fullscreen-center">
      <div className="status-panel wide-panel">
        <p className="status-kicker">403</p>
        <h1>Unauthorized Access</h1>
        <p>
          Your account is authenticated but does not have permission for this route.
        </p>
        <Link className="button-primary inline-action" to="/">
          Return to Allowed Dashboard
        </Link>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
