import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BarChart3, DoorOpen, Plus, ReceiptText } from 'lucide-react';
import { ownerDashboardApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import AsyncState from '../../components/AsyncState.jsx';
import ModuleCard from '../../components/ModuleCard.jsx';
import { formatCurrency, formatDateTime } from '../../utils/format.js';

function OwnerDashboard() {
  const navigate = useNavigate();
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null,
  });

  async function loadDashboard() {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const payload = await ownerDashboardApi.get();
      setState({ loading: false, error: null, data: payload.data || null });
    } catch (error) {
      setState({ loading: false, error, data: null });
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadDashboard();
    });
  }, []);

  const dashboard = useMemo(() => state.data || {}, [state.data]);
  const collectionRate = Number(dashboard.collection_rate_this_month || 0);
  const quickStats = useMemo(
    () => [
      { label: 'Total Rooms', value: String(dashboard.total_rooms || 0), tone: 'neutral' },
      { label: 'Occupied Rooms', value: String(dashboard.occupied_rooms || 0), tone: 'mint' },
      {
        label: 'Pending Reservations',
        value: String(dashboard.pending_reservations_count || 0),
        tone: Number(dashboard.pending_reservations_count || 0) > 0 ? 'amber' : 'neutral',
      },
      {
        label: "This Month's Income",
        value: formatCurrency(dashboard.this_month_income || 0),
        tone: 'mint',
      },
    ],
    [dashboard],
  );

  return (
    <AppShell
      title="Landlord Dashboard"
      subtitle="Rooms, reservations, rent collection, and operational alerts."
      quickStats={quickStats}
    >
      <ModuleCard
        id="owner-quick-actions"
        title="Quick Actions"
        description="Shortcuts for the most common owner workflows."
        actions={
          <button type="button" className="button-light" onClick={loadDashboard}>
            Refresh
          </button>
        }
      >
        <div className="owner-action-grid">
          <button type="button" className="btn-primary" onClick={() => navigate('/owner/rooms')}>
            <Plus size={17} /> Add Room
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/owner/rent-tracking')}>
            <ReceiptText size={17} /> Generate Bills
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/owner/reports')}>
            <BarChart3 size={17} /> View Reports
          </button>
        </div>
      </ModuleCard>

      <ModuleCard
        id="owner-monthly-collection"
        title="Monthly Collection"
        description={`${dashboard.month || 'Current month'} billing progress.`}
      >
        <AsyncState
          loading={state.loading}
          error={state.error}
          isEmpty={!state.data}
          loadingText="Loading owner dashboard..."
          emptyText="No dashboard data available."
          onRetry={loadDashboard}
        >
          <div className="collection-meter">
            <div>
              <strong>
                {formatCurrency(dashboard.this_month_income || 0)} collected of{' '}
                {formatCurrency(dashboard.this_month_billed || 0)} billed
              </strong>
              <span>{collectionRate.toFixed(1)}% collection rate</span>
            </div>
            <div className="collection-track" aria-hidden="true">
              <span style={{ width: `${Math.min(collectionRate, 100)}%` }} />
            </div>
          </div>
        </AsyncState>
      </ModuleCard>

      <ModuleCard
        id="owner-unpaid-tenants"
        title="Unpaid Tenants"
        description="Tenants with unpaid rent for the selected billing month."
      >
        <AsyncState
          loading={state.loading}
          error={state.error}
          isEmpty={!state.data}
          loadingText="Checking unpaid tenants..."
          emptyText="No dashboard data available."
          onRetry={loadDashboard}
        >
          {dashboard.unpaid_tenants?.length > 0 ? (
            <div className="owner-alert-list">
              <div className="mini-feedback mini-error">
                <AlertTriangle size={16} />
                <p>{dashboard.unpaid_tenants.length} tenant(s) have unpaid rent.</p>
              </div>
              {dashboard.unpaid_tenants.map((tenant) => (
                <div className="owner-alert-row" key={`${tenant.name}-${tenant.room}`}>
                  <div>
                    <strong>{tenant.name}</strong>
                    <span>Room {tenant.room}</span>
                  </div>
                  <div>
                    <strong>{formatCurrency(tenant.amount_due)}</strong>
                    <span>{tenant.days_overdue} day(s) overdue</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="state-card state-empty">
              <p>No unpaid tenants for this month.</p>
            </div>
          )}
        </AsyncState>
      </ModuleCard>

      <ModuleCard
        id="owner-room-mix"
        title="Room Occupancy"
        description="Available, occupied, and archived room mix."
      >
        <AsyncState
          loading={state.loading}
          error={state.error}
          isEmpty={!state.data}
          loadingText="Loading room mix..."
          emptyText="No room data available."
          onRetry={loadDashboard}
        >
          <div className="occupancy-strip">
            <div>
              <DoorOpen size={28} />
              <strong>{dashboard.available_rooms || 0}</strong>
              <span>Available</span>
            </div>
            <div>
              <DoorOpen size={28} />
              <strong>{dashboard.occupied_rooms || 0}</strong>
              <span>Occupied</span>
            </div>
            <div>
              <DoorOpen size={28} />
              <strong>{dashboard.archived_rooms || 0}</strong>
              <span>Archived</span>
            </div>
          </div>
        </AsyncState>
      </ModuleCard>

      <ModuleCard
        id="owner-activity"
        title="Recent Activity"
        description="Latest owner-side actions recorded by the backend."
      >
        <AsyncState
          loading={state.loading}
          error={state.error}
          isEmpty={!state.data}
          loadingText="Loading activity..."
          emptyText="No recent activity yet."
          onRetry={loadDashboard}
        >
          <div className="activity-feed">
            {(dashboard.recent_activity || []).map((activity) => (
              <div className="activity-item" key={activity.log_id}>
                <strong>{activity.action_performed}</strong>
                <span>{activity.affected_module} · {formatDateTime(activity.timestamp)}</span>
              </div>
            ))}
            {(dashboard.recent_activity || []).length === 0 && (
              <div className="state-card state-empty">
                <p>No recent activity yet.</p>
              </div>
            )}
          </div>
        </AsyncState>
      </ModuleCard>
    </AppShell>
  );
}

export default OwnerDashboard;
