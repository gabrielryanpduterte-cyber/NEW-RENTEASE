import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarX2, Plus, RotateCcw } from 'lucide-react';
import { reservationsApi, roomsApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import { EmptyState, FileUpload, LoadingSkeleton, SeekerStatusPill } from '../../components/seeker/SeekerShared.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

export default function MyReservationsPage() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(Boolean(searchParams.get('room')));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [validId, setValidId] = useState(null);
  const [form, setForm] = useState({
    boarding_house_id: '',
    room_id: searchParams.get('room') || '',
    move_in_date: '',
    remarks: '',
  });
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    setMessage('');
    try {
      const [reservationsPayload, roomsPayload] = await Promise.all([
        reservationsApi.list(),
        roomsApi.list({ availability_status: 'available' }),
      ]);
      const nextRooms = Array.isArray(roomsPayload.data) ? roomsPayload.data : [];
      setReservations(Array.isArray(reservationsPayload.data) ? reservationsPayload.data : []);
      setRooms(nextRooms);
      setForm((current) => {
        if (!current.room_id || current.boarding_house_id) {
          return current;
        }

        const selectedRoom = nextRooms.find((room) => String(room.room_id) === String(current.room_id));
        if (!selectedRoom?.boarding_house_id) {
          return current;
        }

        return {
          ...current,
          boarding_house_id: String(selectedRoom.boarding_house_id),
        };
      });
    } catch (error) {
      setMessage(error?.errors?.[0] || error?.message || 'Unable to load reservations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadData();
    });
  }, []);

  const minMoveInDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  }, []);

  const propertyOptions = useMemo(() => {
    const properties = new Map();

    rooms.forEach((room) => {
      const id = String(room.boarding_house_id || '');
      if (!id) return;

      if (!properties.has(id)) {
        properties.set(id, {
          id,
          name: room.house_name || `Property ${id}`,
          roomCount: 0,
          minRate: null,
        });
      }

      const property = properties.get(id);
      const rate = Number(room.monthly_rate || 0);
      property.roomCount += 1;
      property.minRate = property.minRate === null ? rate : Math.min(property.minRate, rate);
    });

    return Array.from(properties.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [rooms]);

  const roomsForSelectedProperty = useMemo(
    () =>
      rooms.filter((room) => {
        if (!form.boarding_house_id) return false;
        return String(room.boarding_house_id) === String(form.boarding_house_id);
      }),
    [form.boarding_house_id, rooms],
  );
  const lockedReservation = reservations.find((reservation) => ['pending', 'approved'].includes(reservation.status));
  const reservationLockMessage = lockedReservation
    ? `You already have a ${lockedReservation.status} long-term reservation for Room ${lockedReservation.room_number || lockedReservation.room_id}. Resolve it before requesting another property.`
    : '';

  async function submitReservation(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    const body = new FormData();
    body.append('room_id', form.room_id);
    body.append('move_in_date', form.move_in_date);
    body.append('remarks', form.remarks);
    if (validId) {
      body.append('valid_id', validId);
    }

    try {
      await reservationsApi.create(body);
      setForm({ boarding_house_id: '', room_id: '', move_in_date: '', remarks: '' });
      setValidId(null);
      setShowForm(false);
      showToast('Reservation submitted successfully.', 'success');
      loadData();
    } catch (error) {
      setMessage(error?.errors?.[0] || error?.message || 'Unable to submit reservation.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;

    setCancelLoading(true);
    try {
      await reservationsApi.cancel(cancelTarget.reservation_id, {
        cancellation_reason: cancelReason,
      });
      showToast('Reservation cancelled.', 'success');
      setCancelTarget(null);
      setCancelReason('');
      loadData();
    } catch (error) {
      showToast(error?.errors?.[0] || error?.message || 'Unable to cancel reservation.', 'error');
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <AppShell
      title="My Reservations"
      subtitle="Submit requests and track landlord approval."
      quickStats={[
        { label: 'Pending', value: String(reservations.filter((item) => item.status === 'pending').length), tone: 'amber' },
        { label: 'Approved', value: String(reservations.filter((item) => item.status === 'approved').length), tone: 'mint' },
        { label: 'Total', value: String(reservations.length), tone: 'neutral' },
      ]}
    >
      <section className="seeker-main-column">
        <div className="re-notice-panel">
          RentEase reservations are for longer stays such as monthly or yearly boarding. Keep only one pending or approved reservation at a time.
        </div>

        <div className="seeker-page-actions">
          <button type="button" className="button-primary" onClick={() => setShowForm((current) => !current)} disabled={Boolean(lockedReservation)}>
            <Plus size={16} />
            {showForm ? 'Close Form' : 'New Reservation'}
          </button>
          <button type="button" className="button-light" onClick={loadData}>
            <RotateCcw size={16} />
            Refresh
          </button>
        </div>

        {showForm && (
          <article className="seeker-form-card">
            <h2>Submit New Reservation</h2>
            {reservationLockMessage && <div className="re-error-panel">{reservationLockMessage}</div>}
            <form onSubmit={submitReservation} className="seeker-form-grid">
              <label>
                <span>Property</span>
                <select
                  value={form.boarding_house_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      boarding_house_id: event.target.value,
                      room_id: '',
                    }))
                  }
                  required
                >
                  <option value="">Choose a property first</option>
                  {propertyOptions.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name} - {property.roomCount} available room(s)
                      {property.minRate ? ` from ${formatCurrency(property.minRate)}` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Available Room</span>
                <select
                  value={form.room_id}
                  onChange={(event) => setForm((current) => ({ ...current, room_id: event.target.value }))}
                  required
                  disabled={!form.boarding_house_id}
                >
                  <option value="">{form.boarding_house_id ? 'Choose a room' : 'Choose a property first'}</option>
                  {roomsForSelectedProperty.map((room) => (
                    <option key={room.room_id} value={room.room_id}>
                      Room {room.room_number} - {room.room_type} ({formatCurrency(room.monthly_rate)})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Move-in Date</span>
                <input
                  type="date"
                  value={form.move_in_date}
                  min={minMoveInDate}
                  onChange={(event) => setForm((current) => ({ ...current, move_in_date: event.target.value }))}
                  required
                />
              </label>

              <label className="seeker-form-wide">
                <span>Message to landlord</span>
                <textarea
                  value={form.remarks}
                  maxLength={500}
                  rows={3}
                  onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))}
                />
              </label>

              <div className="seeker-form-wide">
                <FileUpload
                  maxSizeMB={5}
                  onFileSelect={setValidId}
                  label="Upload valid ID (optional)"
                />
              </div>

              {message && <div className="re-error-panel seeker-form-wide">{message}</div>}

              <div className="seeker-form-actions">
                <button type="submit" className="button-primary" disabled={submitting || Boolean(lockedReservation)}>
                  {submitting ? 'Submitting...' : 'Submit Reservation'}
                </button>
                <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </article>
        )}

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : reservations.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title="No reservations yet."
            description="Browse properties first, then choose an available room to reserve."
            cta={<Link className="button-primary" to="/seeker/properties">Browse Properties</Link>}
          />
        ) : (
          <div className="re-table-wrap">
            <table className="re-data-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Date Submitted</th>
                  <th>Move-in Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.reservation_id}>
                    <td>Room {reservation.room_number || reservation.room_id}</td>
                    <td>{reservation.room_type || '-'}</td>
                    <td>{formatDate(reservation.date_submitted)}</td>
                    <td>{formatDate(reservation.move_in_date)}</td>
                    <td><SeekerStatusPill status={reservation.status} /></td>
                    <td>
                      {reservation.status === 'pending' ? (
                        <button
                          type="button"
                          className="button-light danger"
                          onClick={() => setCancelTarget(reservation)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="seeker-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {cancelTarget && (
        <div className="re-modal-backdrop" role="presentation" onClick={() => setCancelTarget(null)}>
          <section className="re-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>Cancel Reservation</h2>
            <p>
              Are you sure you want to cancel your reservation for Room {cancelTarget.room_number || cancelTarget.room_id}? This action cannot be undone.
            </p>
            <label className="seeker-modal-field">
              <span>Reason for cancellation (optional)</span>
              <textarea
                rows={4}
                maxLength={300}
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
              />
            </label>
            <div className="re-modal-actions">
              <button type="button" className="button-secondary" onClick={() => setCancelTarget(null)} disabled={cancelLoading}>
                Keep Reservation
              </button>
              <button type="button" className="button-light danger" onClick={confirmCancel} disabled={cancelLoading}>
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel It'}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
