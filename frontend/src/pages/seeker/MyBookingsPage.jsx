import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reservationsApi, roomsApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import { formatCurrency, formatDate, statusClassName } from '../../utils/format.js';

function MyBookingsPage() {
  const [searchParams] = useSearchParams();
  const preselectedRoomId = searchParams.get('room');

  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(!!preselectedRoomId);
  const [form, setForm] = useState({
    room_id: preselectedRoomId || '',
    move_in_date: '',
    remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [reservationsRes, roomsRes] = await Promise.all([
        reservationsApi.list(),
        roomsApi.list({ availability_status: 'available' }),
      ]);
      setReservations(reservationsRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await reservationsApi.create({
        room_id: parseInt(form.room_id),
        move_in_date: form.move_in_date,
        remarks: form.remarks,
      });

      setMessage({ type: 'success', text: 'Reservation submitted successfully!' });
      setForm({ room_id: '', move_in_date: '', remarks: '' });
      setShowForm(false);
      loadData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.errors?.[0] || error.message || 'Failed to submit reservation' 
      });
    } finally {
      setSubmitting(false);
    }
  }

  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const approvedCount = reservations.filter(r => r.status === 'approved').length;

  return (
    <AppShell
      title="My Bookings"
      subtitle="Manage your room reservations"
      quickStats={[
        { label: 'Pending', value: String(pendingCount), tone: 'amber' },
        { label: 'Approved', value: String(approvedCount), tone: 'mint' },
        { label: 'Total', value: String(reservations.length), tone: 'neutral' },
      ]}
    >
      {/* New Reservation Button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          className="button-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New Reservation'}
        </button>
      </div>

      {/* Reservation Form */}
      {showForm && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            Submit New Reservation
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Select Room *
              </label>
              <select
                value={form.room_id}
                onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                required
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
              >
                <option value="">Choose a room...</option>
                {rooms.map(room => (
                  <option key={room.room_id} value={room.room_id}>
                    Room {room.room_number} - {room.room_type} ({formatCurrency(room.monthly_rate)}/month)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Move-in Date *
              </label>
              <input
                type="date"
                value={form.move_in_date}
                onChange={(e) => setForm({ ...form, move_in_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Remarks (Optional)
              </label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Any special requests or notes..."
                rows={3}
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem', resize: 'vertical' }}
              />
            </div>

            {message.text && (
              <div className={message.type === 'success' ? 'mini-success' : 'mini-error'}>
                <p>{message.text}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                className="button-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Reservation'}
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setShowForm(false);
                  setForm({ room_id: '', move_in_date: '', remarks: '' });
                  setMessage({ type: '', text: '' });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reservations List */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          Your Reservations
        </h3>

        {loading ? (
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '2rem' }}>
            Loading reservations...
          </p>
        ) : reservations.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '2rem' }}>
            No reservations yet. Book your first room!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {reservations.map(reservation => (
              <div
                key={reservation.reservation_id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1.25rem',
                  background: 'var(--background)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      Room {reservation.room_number || reservation.room_id}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                      {reservation.house_name || 'Boarding House'}
                    </p>
                  </div>
                  <span className={`status-pill ${statusClassName(reservation.status)}`}>
                    {reservation.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div>
                    <p style={{ color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                      Reservation ID
                    </p>
                    <p style={{ fontWeight: '500' }}>#{reservation.reservation_id}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                      Move-in Date
                    </p>
                    <p style={{ fontWeight: '500' }}>{formatDate(reservation.move_in_date)}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                      Submitted
                    </p>
                    <p style={{ fontWeight: '500' }}>{formatDate(reservation.date_submitted)}</p>
                  </div>
                </div>

                {reservation.remarks && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                    <p style={{ color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                      Remarks:
                    </p>
                    <p>{reservation.remarks}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default MyBookingsPage;
