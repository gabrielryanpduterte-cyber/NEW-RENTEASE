import { useEffect, useMemo, useState } from 'react';
import { Building2, CalendarDays, CheckCircle2, Eye, IdCard, Mail, Phone, School, UserRound, XCircle } from 'lucide-react';
import { reservationsApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import AsyncState from '../../components/AsyncState.jsx';
import ModuleCard from '../../components/ModuleCard.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate, statusClassName } from '../../utils/format.js';

const TABS = ['pending', 'approved', 'rejected', 'cancelled'];

export default function ReservationRequestsPage() {
  const { showToast } = useToast();
  const [state, setState] = useState({ loading: true, error: null, items: [] });
  const [tab, setTab] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [pendingAction, setPendingAction] = useState('');

  async function loadReservations() {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const payload = await reservationsApi.list();
      setState({
        loading: false,
        error: null,
        items: Array.isArray(payload.data) ? payload.data : [],
      });
    } catch (error) {
      setState({ loading: false, error, items: [] });
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadReservations();
    });
  }, []);

  const reservations = state.items;
  const counts = useMemo(
    () =>
      TABS.reduce((result, item) => {
        result[item] = reservations.filter((reservation) => reservation.status === item).length;
        return result;
      }, {}),
    [reservations],
  );
  const filtered = reservations.filter((reservation) => reservation.status === tab);

  async function approveReservation(reservation) {
    setPendingAction(`approve-${reservation.reservation_id}`);
    try {
      await reservationsApi.approve(reservation.reservation_id);
      showToast('Reservation approved and first billing cycle created.', 'success');
      setSelected(null);
      await loadReservations();
      setTab('approved');
    } catch (error) {
      showToast(error?.errors?.[0] || error?.message || 'Unable to approve reservation.', 'error');
    } finally {
      setPendingAction('');
    }
  }

  async function rejectReservation(reservation) {
    if (remarks.trim().length < 10) {
      showToast('Rejection remarks must be at least 10 characters.', 'warning');
      return;
    }

    setPendingAction(`reject-${reservation.reservation_id}`);
    try {
      await reservationsApi.reject(reservation.reservation_id, remarks.trim());
      showToast('Reservation rejected.', 'success');
      setSelected(null);
      setRemarks('');
      await loadReservations();
      setTab('rejected');
    } catch (error) {
      showToast(error?.errors?.[0] || error?.message || 'Unable to reject reservation.', 'error');
    } finally {
      setPendingAction('');
    }
  }

  function openReview(reservation) {
    setSelected(reservation);
    setRemarks('');
  }

  return (
    <AppShell
      title="Reservation Management"
      subtitle="Review applicants, approve move-ins, and reject requests with remarks."
    >
      <ModuleCard
        id="reservation-queue"
        title="Reservation Queue"
        description="Approving a pending request marks the room occupied and creates the first bill."
        actions={
          <button type="button" className="button-light" onClick={loadReservations}>
            Refresh
          </button>
        }
      >
        <div className="filter-tabs">
          {TABS.map((item) => (
            <button
              type="button"
              key={item}
              className={tab === item ? 'active' : ''}
              onClick={() => setTab(item)}
            >
              {item} ({counts[item] || 0})
            </button>
          ))}
        </div>

        <AsyncState
          loading={state.loading}
          error={state.error}
          isEmpty={filtered.length === 0}
          loadingText="Loading reservations..."
          emptyText={`No ${tab} reservations found.`}
          onRetry={loadReservations}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Room</th>
                  <th>Move-in</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reservation) => (
                  <tr key={reservation.reservation_id}>
                    <td>
                      <div className="table-contact">
                        <strong>{reservation.user_name || `User #${reservation.user_id}`}</strong>
                        <span>{reservation.user_contact_number || reservation.user_email || 'No contact'}</span>
                      </div>
                    </td>
                    <td>Room {reservation.room_number}</td>
                    <td>{formatDate(reservation.move_in_date)}</td>
                    <td>{formatDate(reservation.date_submitted)}</td>
                    <td>
                      <span className={`status-pill ${statusClassName(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="button-light" onClick={() => openReview(reservation)}>
                        <Eye size={15} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </ModuleCard>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content reservation-review-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Reservation Application</h2>
              <button type="button" className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="reservation-review-summary">
              <div className="reservation-review-avatar">
                {selected.profile_photo_url ? (
                  <img src={selected.profile_photo_url} alt={selected.user_name || 'Applicant'} />
                ) : (
                  <UserRound size={28} />
                )}
              </div>
              <div>
                <span>Applicant</span>
                <h3>{selected.user_name || 'Applicant'}</h3>
                <p>{selected.user_email || selected.user_contact_number || 'No contact provided'}</p>
              </div>
              <div className="reservation-review-rate">
                <span>Requested room</span>
                <strong>Room {selected.room_number}</strong>
                <small>{formatCurrency(selected.monthly_rate)} / month</small>
              </div>
            </div>

            <div className="review-grid reservation-review-grid">
              <section className="info-card reservation-review-card">
                <h3>Applicant Details</h3>
                <div className="review-detail-list">
                  <div><Phone size={16} /><span>Contact</span><strong>{selected.user_contact_number || '-'}</strong></div>
                  <div><Mail size={16} /><span>Email</span><strong>{selected.user_email || '-'}</strong></div>
                  <div><School size={16} /><span>School / Work</span><strong>{selected.school_or_workplace || '-'}</strong></div>
                  <div><UserRound size={16} /><span>Emergency</span><strong>{selected.emergency_contact_name || '-'} {selected.emergency_contact_number || ''}</strong></div>
                </div>
                <div className="review-document-row">
                  {selected.valid_id_url ? (
                    <button type="button" className="btn-secondary" onClick={() => window.open(selected.valid_id_url, '_blank', 'noopener,noreferrer')}>
                      <IdCard size={16} />
                      View Valid ID
                    </button>
                  ) : (
                    <p className="muted-note">No valid ID uploaded.</p>
                  )}
                </div>
              </section>

              <section className="info-card reservation-review-card">
                <h3>Reservation Details</h3>
                <div className="review-detail-list">
                  <div><Building2 size={16} /><span>Property</span><strong>{selected.house_name || '-'}</strong></div>
                  <div><Building2 size={16} /><span>Room Type</span><strong>{selected.room_type || '-'}</strong></div>
                  <div><UserRound size={16} /><span>Capacity</span><strong>{selected.capacity || '-'}</strong></div>
                  <div><CalendarDays size={16} /><span>Move-in</span><strong>{formatDate(selected.move_in_date)}</strong></div>
                </div>
                {selected.remarks && (
                  <div className="review-note">
                    <span>Message from seeker</span>
                    <p>{selected.remarks}</p>
                  </div>
                )}
              </section>
            </div>

            {selected.status === 'pending' ? (
              <>
                <div className="form-group reservation-decision-box">
                  <label>Rejection remarks</label>
                  <textarea
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Required only when rejecting."
                  />
                  <small>Approve only when the applicant details and room availability are correct. Use remarks when rejecting.</small>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-success"
                    onClick={() => approveReservation(selected)}
                    disabled={pendingAction === `approve-${selected.reservation_id}`}
                  >
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => rejectReservation(selected)}
                    disabled={pendingAction === `reject-${selected.reservation_id}`}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </>
            ) : (
              <div className="mini-feedback mini-success">
                <p>
                  Decision: {selected.status}
                  {selected.rejection_remarks ? ` - ${selected.rejection_remarks}` : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
