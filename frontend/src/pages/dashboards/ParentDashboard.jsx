import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { feedbackApi, paymentsApi, reservationsApi } from '../../api/client.js';
import AccountSettingsCard from '../../components/AccountSettingsCard.jsx';
import AppShell from '../../components/AppShell.jsx';
import AsyncState from '../../components/AsyncState.jsx';
import LinkAccountsCard from '../../components/LinkAccountsCard.jsx';
import ModuleCard from '../../components/ModuleCard.jsx';
import {
  asArray,
  formatCurrency,
  formatDate,
  formatDateTime,
  statusClassName,
} from '../../utils/format.js';

const defaultSectionState = Object.freeze({
  loading: true,
  error: null,
  items: [],
  meta: null,
});

function ParentDashboard() {
  const [reservationsState, setReservationsState] = useState(defaultSectionState);
  const [paymentsState, setPaymentsState] = useState(defaultSectionState);
  const [feedbackState, setFeedbackState] = useState(defaultSectionState);
  const [feedbackForm, setFeedbackForm] = useState({
    reservation_id: '',
    rating: '5',
    comment: '',
  });
  const [feedbackSubmit, setFeedbackSubmit] = useState({
    pending: false,
    success: '',
    error: '',
  });
  const [linkedAccounts, setLinkedAccounts] = useState([]);

  const reservations = reservationsState.items;
  const payments = paymentsState.items;
  const feedbackEntries = feedbackState.items;

  const linkedDependents = useMemo(() => {
    const uniqueUserIds = new Set(reservations.map((item) => item.user_id).filter(Boolean));
    return uniqueUserIds.size;
  }, [reservations]);

  const balance = useMemo(
    () =>
      payments.reduce((total, item) => {
        const due = Number(item.amount_due) || 0;
        const paid = Number(item.amount_paid) || 0;
        return total + Math.max(due - paid, 0);
      }, 0),
    [payments],
  );

  const hasActiveOccupancy = useMemo(
    () => reservations.some((item) => item.status === 'approved'),
    [reservations],
  );

  const feedbackByReservationId = useMemo(
    () =>
      new Set(
        feedbackEntries
          .map((item) => Number(item.reservation_id))
          .filter((value) => Number.isInteger(value) && value > 0),
      ),
    [feedbackEntries],
  );

  const eligibleReservations = useMemo(
    () =>
      reservations.filter(
        (item) =>
          ['approved', 'completed'].includes(String(item.status || '').toLowerCase()) &&
          !feedbackByReservationId.has(Number(item.reservation_id)),
      ),
    [reservations, feedbackByReservationId],
  );

  function listPayloadItems(data) {
    if (Array.isArray(data)) {
      return data;
    }

    return asArray(data?.items);
  }

  const alerts = useMemo(() => {
    const nextAlerts = [];
    const pendingReservations = reservations.filter((item) => item.status === 'pending').length;
    const unpaidItems = payments.filter((item) => item.payment_status === 'unpaid').length;

    if (unpaidItems > 0) {
      nextAlerts.push(`${unpaidItems} unpaid billing record(s) need attention.`);
    }
    if (pendingReservations > 0) {
      nextAlerts.push(`${pendingReservations} reservation(s) are still pending owner decision.`);
    }

    if (nextAlerts.length === 0) {
      nextAlerts.push('No urgent alerts. Reservation and payment status are stable.');
    }

    return nextAlerts;
  }, [payments, reservations]);

  const hasApprovedLink = useMemo(
    () => linkedAccounts.some((item) => item.status === 'approved'),
    [linkedAccounts],
  );

  async function loadReservations() {
    setReservationsState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const payload = await reservationsApi.list();
      setReservationsState({
        loading: false,
        error: null,
        items: listPayloadItems(payload.data),
        meta: payload.data?.meta || null,
      });
    } catch (error) {
      setReservationsState({
        loading: false,
        error,
        items: [],
        meta: null,
      });
    }
  }

  async function loadPayments() {
    setPaymentsState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const payload = await paymentsApi.list();
      setPaymentsState({
        loading: false,
        error: null,
        items: listPayloadItems(payload.data),
        meta: payload.data?.meta || null,
      });
    } catch (error) {
      setPaymentsState({
        loading: false,
        error,
        items: [],
        meta: null,
      });
    }
  }

  async function loadFeedback() {
    setFeedbackState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const payload = await feedbackApi.list({ limit: 100 });
      setFeedbackState({
        loading: false,
        error: null,
        items: listPayloadItems(payload.data),
        meta: payload.data?.meta || null,
      });
    } catch (error) {
      setFeedbackState({
        loading: false,
        error,
        items: [],
        meta: null,
      });
    }
  }

  async function submitFeedback(event) {
    event.preventDefault();
    setFeedbackSubmit({
      pending: true,
      success: '',
      error: '',
    });

    const reservationId = Number(feedbackForm.reservation_id);
    if (!Number.isInteger(reservationId) || reservationId <= 0) {
      setFeedbackSubmit({
        pending: false,
        success: '',
        error: 'Please select an approved reservation.',
      });
      return;
    }

    try {
      await feedbackApi.create({
        reservation_id: reservationId,
        rating: Number(feedbackForm.rating),
        comment: feedbackForm.comment,
      });

      setFeedbackSubmit({
        pending: false,
        success: 'Feedback submitted successfully.',
        error: '',
      });
      setFeedbackForm({
        reservation_id: '',
        rating: '5',
        comment: '',
      });
      loadFeedback();
    } catch (error) {
      setFeedbackSubmit({
        pending: false,
        success: '',
        error: error?.errors?.[0] || error?.message || 'Unable to submit feedback.',
      });
    }
  }

  const loadInitialData = useEffectEvent(() => {
    loadReservations();
    loadPayments();
    loadFeedback();
  });

  useEffect(() => {
    queueMicrotask(() => {
      loadInitialData();
    });
  }, []);

  return (
    <AppShell
      title="Monitor Boarding and Payment Status"
      subtitle="Parent account visibility for reservations and rent records tied to this profile."
      quickStats={[
        { label: 'Linked Dependents', value: String(linkedDependents), tone: 'sky' },
        { label: 'Current Balance', value: formatCurrency(balance), tone: 'amber' },
        { label: 'Active Occupancy', value: hasActiveOccupancy ? 'Yes' : 'No', tone: 'mint' },
        { label: 'Feedback Submitted', value: String(feedbackEntries.length), tone: 'neutral' },
      ]}
    >
      <LinkAccountsCard
        id="connections"
        title="Parent-Seeker Connections"
        description="Link your parent account to seeker accounts. Monitoring data unlocks after seeker approval."
        onLinksChange={setLinkedAccounts}
      />

      {!hasApprovedLink && (
        <ModuleCard
          id="linking-required"
          title="Connection Required"
          description="Your parent account is active, but monitoring modules are limited until at least one seeker link is approved."
          points={[
            'Send a link request to a seeker email above.',
            'The seeker must approve the request from their dashboard connection section.',
            'Once approved, reservation and payment monitoring will populate automatically.',
          ]}
        />
      )}

      <ModuleCard
        id="monitoring"
        title="Dependent Monitoring"
        description="Reservation visibility from reservations.php."
        actions={
          <button type="button" className="button-light" onClick={loadReservations}>
            Refresh
          </button>
        }
      >
        <AsyncState
          loading={reservationsState.loading}
          error={reservationsState.error}
          isEmpty={reservations.length === 0}
          loadingText="Loading reservation monitoring data..."
          emptyText="No reservation records available. Approve a seeker link first or wait for seeker reservation activity."
          onRetry={loadReservations}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Room</th>
                  <th>Move-in</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.reservation_id}>
                    <td>{reservation.reservation_id}</td>
                    <td>{reservation.room_number || reservation.room_id}</td>
                    <td>{formatDate(reservation.move_in_date)}</td>
                    <td>
                      <span className={`status-pill ${statusClassName(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </td>
                    <td>{reservation.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </ModuleCard>

      <ModuleCard
        id="payments"
        title="Payment Overview"
        description="Payment status from payments.php."
        actions={
          <button type="button" className="button-light" onClick={loadPayments}>
            Refresh
          </button>
        }
      >
        <AsyncState
          loading={paymentsState.loading}
          error={paymentsState.error}
          isEmpty={payments.length === 0}
          loadingText="Loading payment monitoring data..."
          emptyText="No payment records available. Approve a seeker link first or wait for billing records."
          onRetry={loadPayments}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Billing</th>
                  <th>Due</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.payment_id}>
                    <td>{payment.billing_period}</td>
                    <td>{formatCurrency(payment.amount_due)}</td>
                    <td>{formatCurrency(payment.amount_paid)}</td>
                    <td>
                      <span className={`status-pill ${statusClassName(payment.payment_status)}`}>
                        {payment.payment_status}
                      </span>
                    </td>
                    <td>{formatDate(payment.payment_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </ModuleCard>

      <ModuleCard
        id="alerts"
        title="Action Alerts"
        description="Computed alerts from reservation and payment state."
      >
        <div className="alert-list">
          {alerts.map((alert, index) => (
            <div className="alert-item" key={`${alert}-${index}`}>
              {alert}
            </div>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard
        id="feedback"
        title="Ratings and Feedback"
        description="Submit feedback for approved reservations and monitor submission status."
        actions={
          <button type="button" className="button-light" onClick={loadFeedback}>
            Refresh
          </button>
        }
      >
        <form className="inline-form feedback-form" onSubmit={submitFeedback}>
          <select
            value={feedbackForm.reservation_id}
            onChange={(event) =>
              setFeedbackForm((current) => ({
                ...current,
                reservation_id: event.target.value,
              }))
            }
            required
          >
            <option value="">Select approved reservation</option>
            {eligibleReservations.map((reservation) => (
              <option key={reservation.reservation_id} value={reservation.reservation_id}>
                #{reservation.reservation_id} - Room {reservation.room_number || reservation.room_id}
              </option>
            ))}
          </select>
          <select
            value={feedbackForm.rating}
            onChange={(event) =>
              setFeedbackForm((current) => ({
                ...current,
                rating: event.target.value,
              }))
            }
            required
          >
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Fair</option>
            <option value="2">2 - Poor</option>
            <option value="1">1 - Very Poor</option>
          </select>
          <textarea
            value={feedbackForm.comment}
            onChange={(event) =>
              setFeedbackForm((current) => ({
                ...current,
                comment: event.target.value,
              }))
            }
            placeholder="Share your experience..."
            required
          />
          <button
            type="submit"
            className="button-light"
            disabled={feedbackSubmit.pending || eligibleReservations.length === 0}
          >
            {feedbackSubmit.pending ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>

        {feedbackSubmit.error && (
          <div className="mini-feedback mini-error">
            <p>{feedbackSubmit.error}</p>
          </div>
        )}
        {feedbackSubmit.success && (
          <div className="mini-feedback mini-success">
            <p>{feedbackSubmit.success}</p>
          </div>
        )}

        <AsyncState
          loading={feedbackState.loading}
          error={feedbackState.error}
          isEmpty={feedbackEntries.length === 0}
          loadingText="Loading feedback records..."
          emptyText="No feedback records available for linked seeker reservations."
          onRetry={loadFeedback}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Reservation</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Comment</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {feedbackEntries.map((entry) => (
                  <tr key={entry.feedback_id}>
                    <td>{entry.feedback_id}</td>
                    <td>{entry.reservation_id}</td>
                    <td>{entry.rating}/5</td>
                    <td>
                      <span className={`status-pill ${statusClassName(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td>{entry.comment}</td>
                    <td>{formatDateTime(entry.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </ModuleCard>

      <AccountSettingsCard
        id="account"
        title="Account Settings"
        description="Maintain your parent profile and change your account password."
      />
    </AppShell>
  );
}

export default ParentDashboard;
