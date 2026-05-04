import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { isRoleAllowed } from '../utils/roles.js';

function ProtectedRoute({ allowedRoles, children }) {
  const { authState } = useAuth();
  const location = useLocation();

  if (authState.status === 'loading') {
    return (
      <div className="fullscreen-center">
        <div className="status-panel">
          <p>Loading protected route...</p>
        </div>
      </div>
    );
  }

  if (authState.status !== 'authenticated') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const currentRole = authState.user?.role;
  if (!isRoleAllowed(currentRole, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
