import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Home, Receipt, RotateCcw } from 'lucide-react';
import { seekerDashboardApi } from '../../api/client.js';
import { useAuth } from '../../auth/useAuth.js';
import AppShell from '../../components/AppShell.jsx';
import { EmptyState, LoadingSkeleton } from '../../components/seeker/SeekerShared.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

function monthLabel(value = new Date()) {
  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(value);
}

function firstName(fullName = '') {
  return fullName.trim().split(/\s+/)[0] || 'there';
}

export default function SeekerDashboard() {
  const { authState } = useAuth();
  const [state, setState] = useState({ loading: true, error: '', data: null });

  async function loadDashboard() {
    setState((current) => ({ ...current, loading: true, error: '' }));

    try {
      const payload = await seekerDashboardApi.dashboard();
      setState({ loading: false, error: '', data: payload.data });
    } catch (error) {
      setState({
        loading: false,
        error: error?.errors?.[0] || error?.message || 'Unable to load dashboard.',
        data: null,
      });
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadDashboard();
    });
  }, []);

  const data = state.data || {};
  const user = data.user || authState.user || {};
  const activeReservation = data.active_reservation;
  const pendingReservation = data.pending_reservation;
  const currentPayment = data.current_payment;
  const rentStatus = currentPayment?.payment_status || 'No record';
  const unpaidAmount = currentPayment
    ? Math.max(Number(currentPayment.amount_due || 0) - Number(currentPayment.amount_paid || 0), 0)
    : 0;

  return (
    <AppShell
      title="Dashboard"
      subtitle="Your room, reservations, and rent status in one place."
      quickStats={[
        { label: 'Pending Reservations', value: String(data.pending_reservations_count || 0), tone: 'amber' },
        { label: 'Current Rent', value: currentPayment ? rentStatus : 'No record', tone: currentPayment?.payment_status === 'paid' ? 'mint' : 'amber' },
      ]}
    >
      <section className="seeker-main-column">
        <div className="seeker-welcome">
          <div>
            <p className="re-eyebrow">Seeker dashboard</p>
            <h1>Welcome back, {firstName(user.full_name)}</h1>
            <span>{new Intl.DateTimeFormat('en-PH', { dateStyle: 'full' }).format(new Date())}</span>
          </div>
          <button type="button" className="button-light" onClick={loadDashboard} disabled={state.loading}>
            <RotateCcw size={16} />
            Refresh
          </button>
        </div>

        {state.loading ? (
          <LoadingSkeleton rows={4} />
        ) : state.error ? (
          <div className="re-error-panel">{state.error}</div>
        ) : (
          <>
            <div className="seeker-status-grid">
              <article className="seeker-status-card">
                <div className="seeker-card-head">
                  <Home size={20} />
                  <h2>Room Status</h2>
                </div>

                {activeReservation ? (
                  <div className="seeker-room-summary">
                    <div className="seeker-room-thumb">RE</div>
                    <div>
                      <h3>Room {activeReservation.room_number} - {activeReservation.room_type}</h3>
                      <strong>{formatCurrency(activeReservation.monthly_rate)} / month</strong>
                      <p>Move-in: {formatDate(activeReservation.move_in_date)}</p>
                      <span className="seeker-active-dot">Active tenant</span>
                    </div>
                    <Link to="/dashboard/room">View room details</Link>
                  </div>
                ) : (
                  <EmptyState
                    icon={Home}
                    title="You do not have a room yet."
                    description="Approved room details will appear here after landlord review."
                    cta={<Link className="button-primary" to="/seeker/properties">Browse Properties</Link>}
                  />
                )}
              </article>

              <article className="seeker-status-card">
                <div className="seeker-card-head">
                  <Receipt size={20} />
                  <h2>Rent Status</h2>
                </div>

                <div className="seeker-rent-summary">
                  <span>{monthLabel()}</span>
                  {currentPayment ? (
                    <>
                      <strong className={currentPayment.payment_status === 'paid' ? 'is-paid' : 'is-unpaid'}>
                        {currentPayment.payment_status}
                      </strong>
                      {currentPayment.payment_status === 'paid' ? (
                        <p>Paid on {formatDate(currentPayment.payment_date)}</p>
                      ) : (
                        <p>{formatCurrency(unpaidAmount)} due</p>
                      )}
                    </>
                  ) : (
                    <>
                      <strong>No record</strong>
                      <p>No rent record for {monthLabel()}.</p>
                    </>
                  )}
                  <Link to="/dashboard/rent">Open payments</Link>
                </div>
              </article>
            </div>

            {pendingReservation && (
              <div className="seeker-notice">
                <CalendarDays size={20} />
                <p>
                  You have a pending reservation for Room {pendingReservation.room_number}. Awaiting landlord approval.
                </p>
              </div>
            )}

          </>
        )}
      </section>
    </AppShell>
  );
}
