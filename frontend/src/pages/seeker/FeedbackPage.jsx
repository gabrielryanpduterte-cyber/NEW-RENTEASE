import { useState, useEffect, useMemo } from 'react';
import { feedbackApi, reservationsApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import { formatDateTime, statusClassName } from '../../utils/format.js';

function FeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    reservation_id: '',
    rating: '5',
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [feedbackRes, reservationsRes] = await Promise.all([
        feedbackApi.list({ limit: 100 }),
        reservationsApi.list(),
      ]);
      setFeedback(feedbackRes.data?.items || feedbackRes.data || []);
      setReservations(reservationsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  const feedbackByReservationId = useMemo(
    () => new Set(feedback.map(f => parseInt(f.reservation_id))),
    [feedback]
  );

  const eligibleReservations = useMemo(
    () => reservations.filter(r => 
      ['approved', 'completed'].includes(r.status?.toLowerCase()) &&
      !feedbackByReservationId.has(parseInt(r.reservation_id))
    ),
    [reservations, feedbackByReservationId]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await feedbackApi.create({
        reservation_id: parseInt(form.reservation_id),
        rating: parseInt(form.rating),
        comment: form.comment,
      });

      setMessage({ type: 'success', text: 'Feedback submitted successfully!' });
      setForm({ reservation_id: '', rating: '5', comment: '' });
      loadData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.errors?.[0] || error.message || 'Failed to submit feedback' 
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      title="Feedback & Ratings"
      subtitle="Share your boarding house experience"
      quickStats={[
        { label: 'Submitted', value: String(feedback.length), tone: 'mint' },
        { label: 'Eligible', value: String(eligibleReservations.length), tone: 'sky' },
      ]}
    >
      {/* Submit Feedback Form */}
      {eligibleReservations.length > 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            Submit Feedback
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Select Reservation *
              </label>
              <select
                value={form.reservation_id}
                onChange={(e) => setForm({ ...form, reservation_id: e.target.value })}
                required
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
              >
                <option value="">Choose a reservation...</option>
                {eligibleReservations.map(r => (
                  <option key={r.reservation_id} value={r.reservation_id}>
                    #{r.reservation_id} - Room {r.room_number || r.room_id} ({r.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Rating *
              </label>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                required
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
              >
                <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                <option value="4">⭐⭐⭐⭐ Good</option>
                <option value="3">⭐⭐⭐ Fair</option>
                <option value="2">⭐⭐ Poor</option>
                <option value="1">⭐ Very Poor</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Your Experience *
              </label>
              <textarea
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder="Share your boarding house experience..."
                required
                rows={4}
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem', resize: 'vertical' }}
              />
            </div>

            {message.text && (
              <div className={message.type === 'success' ? 'mini-success' : 'mini-error'}>
                <p>{message.text}</p>
              </div>
            )}

            <button
              type="submit"
              className="button-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      )}

      {/* Feedback List */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
            Your Feedback History
          </h3>
          <button className="button-light" onClick={loadData}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '2rem' }}>
            Loading feedback...
          </p>
        ) : feedback.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '2rem' }}>
            No feedback submitted yet.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {feedback.map(entry => (
              <div
                key={entry.feedback_id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1.25rem',
                  background: 'var(--background)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '1.125rem' }}>
                        {'⭐'.repeat(parseInt(entry.rating))}
                      </span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                        {entry.rating}/5
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                      Reservation #{entry.reservation_id}
                    </p>
                  </div>
                  <span className={`status-pill ${statusClassName(entry.status)}`}>
                    {entry.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.9375rem', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                  {entry.comment}
                </p>

                <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                  Submitted: {formatDateTime(entry.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default FeedbackPage;
