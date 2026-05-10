import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './auth/useAuth.js';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import CompleteProfilePage from './pages/CompleteProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import UnauthorizedPage from './pages/UnauthorizedPage.jsx';
import AdminDashboard from './pages/dashboards/AdminDashboard.jsx';
import OwnerDashboard from './pages/dashboards/OwnerDashboard.jsx';
import ParentDashboard from './pages/dashboards/ParentDashboard.jsx';
import SeekerDashboard from './pages/dashboards/SeekerDashboard.jsx';
import MyRoomPage from './pages/seeker/MyRoomPage.jsx';
import MyReservationsPage from './pages/seeker/MyReservationsPage.jsx';
import RentStatusPage from './pages/seeker/RentStatusPage.jsx';
import GuardianAccessPage from './pages/seeker/GuardianAccessPage.jsx';
import DocumentsPage from './pages/seeker/DocumentsPage.jsx';
import FeedbackPage from './pages/seeker/FeedbackPage.jsx';
import ProfilePage from './pages/seeker/ProfilePage.jsx';
import BoardingHouseProfilePage from './pages/owner/BoardingHouseProfilePage.jsx';
import ManageRoomsPage from './pages/owner/ManageRoomsPage.jsx';
import ReservationRequestsPage from './pages/owner/ReservationRequestsPage.jsx';
import TenantOccupancyPage from './pages/owner/TenantOccupancyPage.jsx';
import PaymentTrackingPage from './pages/owner/PaymentTrackingPage.jsx';
import IncomeSummaryPage from './pages/owner/IncomeSummaryPage.jsx';
import OwnerReportsPage from './pages/owner/OwnerReportsPage.jsx';
import OwnerProfilePage from './pages/owner/OwnerProfilePage.jsx';
import AddPropertyPage from './pages/AddPropertyPage.jsx';
import RentEaseLanding from './pages/RentEaseLanding.jsx';
import PublicRoomsPage from './pages/PublicRoomsPage.jsx';
import RoomDetailPage from './pages/RoomDetailPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import GuardianViewPage from './pages/GuardianViewPage.jsx';
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

  return <RentEaseLanding />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/rooms" element={<PublicRoomsPage />} />
      <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
      <Route path="/guardian-view/:token" element={<GuardianViewPage />} />
      <Route path="/complete-profile" element={<CompleteProfilePage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/landing" element={<RentEaseLanding />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['seeker']}>
            <SeekerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/room"
        element={
          <ProtectedRoute allowedRoles={['seeker']}>
            <MyRoomPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/reservations"
        element={
          <ProtectedRoute allowedRoles={['seeker']}>
            <MyReservationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/rent"
        element={
          <ProtectedRoute allowedRoles={['seeker']}>
            <RentStatusPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/guardians"
        element={
          <ProtectedRoute allowedRoles={['seeker']}>
            <GuardianAccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seeker/documents"
        element={
          <ProtectedRoute allowedRoles={['seeker']}>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seeker/feedback"
        element={
          <ProtectedRoute allowedRoles={['seeker']}>
            <FeedbackPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute allowedRoles={['seeker']}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/seeker/dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/seeker/properties" element={<Navigate to="/dashboard/room" replace />} />
      <Route path="/seeker/bookings" element={<Navigate to="/dashboard/reservations" replace />} />
      <Route path="/seeker/payments" element={<Navigate to="/dashboard/rent" replace />} />
      <Route path="/seeker/account" element={<Navigate to="/dashboard/profile" replace />} />
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
        path="/owner/boarding-house"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <BoardingHouseProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/rooms"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <ManageRoomsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/reservations"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <ReservationRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/tenants"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <TenantOccupancyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/rent-tracking"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <PaymentTrackingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/income"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <IncomeSummaryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/reports"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/profile"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/owner/occupancy" element={<Navigate to="/owner/tenants" replace />} />
      <Route path="/owner/payments" element={<Navigate to="/owner/rent-tracking" replace />} />
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
