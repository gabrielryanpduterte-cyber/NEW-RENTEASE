import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './auth/useAuth.js';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import CompleteProfilePage from './pages/CompleteProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import UnauthorizedPage from './pages/UnauthorizedPage.jsx';
import AdminDashboard from './pages/dashboards/AdminDashboard.jsx';
import OwnerDashboard from './pages/dashboards/OwnerDashboard.jsx';
import ParentDashboard from './pages/dashboards/ParentDashboard.jsx';
import SeekerDashboard from './pages/dashboards/SeekerDashboard.jsx';
import PropertyBrowsePage from './pages/PropertyBrowsePage.jsx';
import AddPropertyPage from './pages/AddPropertyPage.jsx';
import ComponentShowcase from './pages/ComponentShowcase.jsx';
import { roleDashboardPath } from './utils/roles.js';

function HomeRedirect() {
  const { authState } = useAuth();

  if (authState.status === 'loading') {
    return (
      <div className="fullscreen-center">
        <div className="status-panel">
          <p>Checking session...</p>
        </div>
      </div>
    );
  }

  if (authState.status === 'authenticated') {
    return <Navigate to={roleDashboardPath(authState.user?.role)} replace />;
  }

  return <LandingPage />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/complete-profile" element={<CompleteProfilePage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/showcase" element={<ComponentShowcase />} />

      <Route
        path="/seeker/dashboard"
        element={
          <ProtectedRoute allowedRoles={['seeker']}>
            <SeekerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seeker/properties"
        element={
          <ProtectedRoute allowedRoles={['seeker']}>
            <PropertyBrowsePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/dashboard"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/add-property"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <AddPropertyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
