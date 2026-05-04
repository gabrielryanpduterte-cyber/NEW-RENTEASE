import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { roleLabel, roleDashboardPath } from '../utils/roles.js';
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  Settings,
  FileText,
  Activity,
  AlertCircle,
  PanelsTopLeft,
  ChevronLeft,
  Menu,
  LogOut
} from 'lucide-react';

const NAV_BY_ROLE = Object.freeze({
  seeker: [
    { to: '/seeker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/seeker/properties', label: 'Browse Properties', icon: Home },
    { to: '/seeker/dashboard#reservations', label: 'My Bookings', icon: Calendar },
    { to: '/seeker/dashboard#payments', label: 'Payments', icon: CreditCard },
    { to: '/seeker/dashboard#uploads', label: 'Documents', icon: FileText },
    { to: '/seeker/dashboard#feedback', label: 'Feedback', icon: MessageSquare },
    { to: '/seeker/dashboard#account', label: 'Account', icon: Settings },
  ],
  parent: [
    { to: '/parent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/parent/dashboard#connections', label: 'Connections', icon: Users },
    { to: '/parent/dashboard#monitoring', label: 'Monitoring', icon: Activity },
    { to: '/parent/dashboard#payments', label: 'Payments', icon: CreditCard },
    { to: '/parent/dashboard#feedback', label: 'Feedback', icon: MessageSquare },
    { to: '/parent/dashboard#account', label: 'Account', icon: Settings },
  ],
  owner: [
    { to: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/owner/add-property', label: 'Add Property', icon: Home },
    { to: '/owner/dashboard#rooms', label: 'My Properties', icon: Home },
    { to: '/owner/dashboard#reservations', label: 'Bookings', icon: Calendar },
    { to: '/owner/dashboard#payments', label: 'Payments', icon: CreditCard },
    { to: '/owner/dashboard#reports', label: 'Reports', icon: FileText },
    { to: '/owner/dashboard#feedback', label: 'Feedback', icon: MessageSquare },
    { to: '/owner/dashboard#account', label: 'Account', icon: Settings },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/dashboard#reports', label: 'Reports', icon: FileText },
    { to: '/admin/dashboard#users', label: 'Users', icon: Users },
    { to: '/admin/dashboard#activity', label: 'Activity Logs', icon: Activity },
    { to: '/admin/dashboard#error', label: 'Error Logs', icon: AlertCircle },
    { to: '/admin/dashboard#feedback', label: 'Feedback', icon: MessageSquare },
    { to: '/admin/dashboard#account', label: 'Account', icon: Settings },
  ],
});

function AppShell({ title, subtitle, quickStats = [], children }) {
  const { authState, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const user = authState.user;
  const role = user?.role ?? 'seeker';
  const navItems = NAV_BY_ROLE[role] ?? [];

  async function onLogout() {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  }

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  return (
    <div className={`modern-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileNavOpen ? 'mobile-open' : ''}`}>
      {/* Overlay for mobile */}
      <button
        type="button"
        className="sidebar-overlay"
        onClick={closeMobileNav}
        aria-label="Close navigation"
      />

      {/* Sidebar */}
      <aside className="modern-sidebar">
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <PanelsTopLeft size={24} />
            </div>
            {!sidebarCollapsed && (
              <div className="brand-text">
                <h1>RentEase</h1>
                <p>{roleLabel(role)}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft size={18} className={sidebarCollapsed ? 'rotate-180' : ''} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
                end={item.to === roleDashboardPath(role)}
                onClick={closeMobileNav}
                title={sidebarCollapsed ? item.label : ''}
              >
                <Icon size={20} className="nav-icon" />
                {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="user-info">
              <div className="user-avatar">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="user-details">
                <p className="user-name">{user?.full_name || 'User'}</p>
                <p className="user-email">{user?.email || 'No email'}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            className="logout-btn"
            onClick={onLogout}
            disabled={loggingOut}
            title="Logout"
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="modern-main">
        {/* Top Bar */}
        <header className="modern-topbar">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={24} />
          </button>
          <div className="topbar-title">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="topbar-actions">
            <div className="user-badge">{roleLabel(role)}</div>
          </div>
        </header>

        {/* Quick Stats */}
        {quickStats.length > 0 && (
          <section className="stats-grid">
            {quickStats.map((item, index) => (
              <div
                className={`stat-card stat-${item.tone || 'neutral'}`}
                key={`${item.label}-${index}`}
              >
                <p className="stat-label">{item.label}</p>
                <p className="stat-value">{item.value}</p>
              </div>
            ))}
          </section>
        )}

        {/* Content Grid */}
        <section className="content-grid">{children}</section>
      </main>
    </div>
  );
}

export default AppShell;
