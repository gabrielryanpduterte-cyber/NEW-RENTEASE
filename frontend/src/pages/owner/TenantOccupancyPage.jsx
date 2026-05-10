import { useEffect, useMemo, useState } from 'react';
import { CreditCard, UserRound, Users } from 'lucide-react';
import { roomsApi, tenantsApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import AsyncState from '../../components/AsyncState.jsx';
import ModuleCard from '../../components/ModuleCard.jsx';
import { formatCurrency, formatDate, statusClassName } from '../../utils/format.js';

export default function TenantOccupancyPage() {
  const [tenantsState, setTenantsState] = useState({ loading: true, error: null, items: [] });
  const [roomsState, setRoomsState] = useState({ loading: true, error: null, items: [] });
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [tenantDetail, setTenantDetail] = useState({ loading: false, error: null, data: null });

  async function loadData() {
    setTenantsState((current) => ({ ...current, loading: true, error: null }));
    setRoomsState((current) => ({ ...current, loading: true, error: null }));

    try {
      const [tenantsPayload, roomsPayload] = await Promise.all([
        tenantsApi.list(),
        roomsApi.list({ include_archived: 1 }),
      ]);
      setTenantsState({
        loading: false,
        error: null,
        items: Array.isArray(tenantsPayload.data) ? tenantsPayload.data : [],
      });
      setRoomsState({
        loading: false,
        error: null,
        items: Array.isArray(roomsPayload.data) ? roomsPayload.data : [],
      });
    } catch (error) {
      setTenantsState({ loading: false, error, items: [] });
      setRoomsState({ loading: false, error, items: [] });
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadData();
    });
  }, []);

  async function openTenant(tenantId) {
    setSelectedTenantId(tenantId);
    setTenantDetail({ loading: true, error: null, data: null });

    try {
      const payload = await tenantsApi.get(tenantId);
      setTenantDetail({ loading: false, error: null, data: payload.data || null });
    } catch (error) {
      setTenantDetail({ loading: false, error, data: null });
    }
  }

  const roomStats = useMemo(() => {
    const total = roomsState.items.length;
    const occupied = roomsState.items.filter((room) => room.availability_status === 'occupied').length;
    const available = roomsState.items.filter((room) => room.availability_status === 'available').length;
    const archived = roomsState.items.filter((room) => room.availability_status === 'archived').length;
    const active = Math.max(total - archived, 0);
    return {
      total,
      occupied,
      available,
      archived,
      occupancyRate: active > 0 ? (occupied / active) * 100 : 0,
    };
  }, [roomsState.items]);

  return (
    <AppShell
      title="Tenant Management"
      subtitle="Current approved tenants, rent status, emergency contacts, and guardian links."
      quickStats={[
        { label: 'Active Tenants', value: String(tenantsState.items.length), tone: 'mint' },
        { label: 'Occupied Rooms', value: String(roomStats.occupied), tone: 'neutral' },
        { label: 'Available Rooms', value: String(roomStats.available), tone: 'neutral' },
        { label: 'Occupancy Rate', value: `${roomStats.occupancyRate.toFixed(1)}%`, tone: 'amber' },
      ]}
    >
      <ModuleCard
        id="tenant-table"
        title="Current Tenants"
        description="Click a tenant row to view profile, guardians, and payment history."
        actions={
          <button type="button" className="button-light" onClick={loadData}>
            Refresh
          </button>
        }
      >
        <AsyncState
          loading={tenantsState.loading}
          error={tenantsState.error}
          isEmpty={tenantsState.items.length === 0}
          loadingText="Loading tenants..."
          emptyText="No active tenants found."
          onRetry={loadData}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Room</th>
                  <th>Move-in</th>
                  <th>Contact</th>
                  <th>This Month</th>
                  <th>Guardians</th>
                </tr>
              </thead>
              <tbody>
                {tenantsState.items.map((tenant) => (
                  <tr key={`${tenant.user_id}-${tenant.reservation_id}`} onClick={() => openTenant(tenant.user_id)}>
                    <td>
                      <div className="table-contact">
                        <strong>{tenant.full_name}</strong>
                        <span>{tenant.email}</span>
                      </div>
                    </td>
                    <td>Room {tenant.room_number}</td>
                    <td>{formatDate(tenant.move_in_date)}</td>
                    <td>{tenant.contact_number || '-'}</td>
                    <td>
                      <span className={`status-pill ${statusClassName(tenant.rent_status_this_month)}`}>
                        {tenant.rent_status_this_month}
                      </span>
                    </td>
                    <td>{tenant.guardian_links_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </ModuleCard>

      <ModuleCard
        id="room-occupancy"
        title="Room Occupancy"
        description="Room-by-room state including archived rooms."
      >
        <AsyncState
          loading={roomsState.loading}
          error={roomsState.error}
          isEmpty={roomsState.items.length === 0}
          loadingText="Loading rooms..."
          emptyText="No rooms found."
          onRetry={loadData}
        >
          <div className="rooms-table">
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Rate</th>
                  <th>Status</th>
                  <th>Tenant</th>
                </tr>
              </thead>
              <tbody>
                {roomsState.items.map((room) => (
                  <tr key={room.room_id}>
                    <td>{room.room_number}</td>
                    <td>{room.room_type}</td>
                    <td>{formatCurrency(room.monthly_rate)}</td>
                    <td>
                      <span className={`status-pill ${statusClassName(room.availability_status)}`}>
                        {room.availability_status}
                      </span>
                    </td>
                    <td>{room.occupant_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </ModuleCard>

      {selectedTenantId && (
        <div className="modal-overlay" onClick={() => setSelectedTenantId(null)}>
          <aside className="tenant-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Tenant Profile</h2>
              <button type="button" className="modal-close" onClick={() => setSelectedTenantId(null)}>×</button>
            </div>

            <AsyncState
              loading={tenantDetail.loading}
              error={tenantDetail.error}
              isEmpty={!tenantDetail.data}
              loadingText="Loading tenant profile..."
              emptyText="Tenant profile not found."
              onRetry={() => openTenant(selectedTenantId)}
            >
              <div className="tenant-drawer-header">
                <div className="tenant-avatar"><UserRound size={28} /></div>
                <div>
                  <h3>{tenantDetail.data?.full_name}</h3>
                  <p>Room {tenantDetail.data?.room_number}</p>
                </div>
              </div>

              <section className="tenant-drawer-section">
                <h4><Users size={16} /> Profile</h4>
                <p><strong>Email:</strong> {tenantDetail.data?.email || '-'}</p>
                <p><strong>Contact:</strong> {tenantDetail.data?.contact_number || '-'}</p>
                <p><strong>School/Work:</strong> {tenantDetail.data?.school_or_workplace || '-'}</p>
                <p><strong>Emergency:</strong> {tenantDetail.data?.emergency_contact_name || '-'} {tenantDetail.data?.emergency_contact_number || ''}</p>
              </section>

              <section className="tenant-drawer-section">
                <h4><CreditCard size={16} /> Payment History</h4>
                <div className="mini-history-list">
                  {(tenantDetail.data?.payment_history || []).slice(0, 8).map((payment) => (
                    <div key={`${payment.billing_month}-${payment.room_number}`}>
                      <span>{payment.billing_month}</span>
                      <strong>{formatCurrency(payment.amount_paid)} / {formatCurrency(payment.amount_due)}</strong>
                      <em>{payment.payment_status}</em>
                    </div>
                  ))}
                  {(tenantDetail.data?.payment_history || []).length === 0 && <p>No billing history yet.</p>}
                </div>
              </section>

              <section className="tenant-drawer-section">
                <h4>Guardians</h4>
                {(tenantDetail.data?.guardians || []).map((guardian) => (
                  <p key={`${guardian.guardian_email}-${guardian.guardian_name}`}>
                    {guardian.guardian_name} · {guardian.status}
                  </p>
                ))}
                {(tenantDetail.data?.guardians || []).length === 0 && <p>No guardian links.</p>}
              </section>
            </AsyncState>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
