import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import {
  feedbackApi,
  paymentsApi,
  reservationsApi,
  roomsApi,
  uploadsApi,
} from '../../api/client.js';
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

function formatBytes(value) {
  const numeric = Number(value) || 0;
  if (numeric < 1024) return `${numeric} B`;
  if (numeric < 1024 * 1024) return `${(numeric / 1024).toFixed(1)} KB`;
  return `${(numeric / (1024 * 1024)).toFixed(2)} MB`;
}

function SeekerDashboard() {
  const [roomsState, setRoomsState] = useState(defaultSectionState);
  const [reservationsState, setReservationsState] = useState(defaultSectionState);
  const [paymentsState, setPaymentsState] = useState(defaultSectionState);
  const [feedbackState, setFeedbackState] = useState(defaultSectionState);
  const [uploadsState, setUploadsState] = useState(defaultSectionState);

  const [reservationForm, setReservationForm] = useState({
    room_id: '',
    move_in_date: '',
    remarks: '',
  });
  const [reservationSubmit, setReservationSubmit] = useState({
    pending: false,
    success: '',
    error: '',
  });
  const [feedbackForm, setFeedbackForm] = useState({
    reservation_id: '',
    rating: '5',
    comment: '',
  });
  const [uploadForm, setUploadForm] = useState({
    reservation_id: '',
    visibility: 'owner',
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDeletePendingId, setUploadDeletePendingId] = useState(null);
  const [feedbackSubmit, setFeedbackSubmit] = useState({
    pending: false,
    success: '',
    error: '',
  });
  const [uploadSubmit, setUploadSubmit] = useState({
    pending: false,
    success: '',
    error: '',
  });

  const availableRooms = roomsState.items;
  const reservations = reservationsState.items;
  const payments = paymentsState.items;
  const feedbackEntries = feedbackState.items;
  const uploads = uploadsState.items;

  const openReservations = useMemo(
    () => reservations.filter((item) => item.status === 'pending').length,
    [reservations],
  );

  const unpaidBalance = useMemo(
    () =>
      payments.reduce((total, item) => {
        if (item.payment_status === 'paid') {
          return total;
        }

        const due = Number(item.amount_due) || 0;
        const paid = Number(item.amount_paid) || 0;
        return total + Math.max(due - paid, 0);
      }, 0),
    [payments],
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

  async function loadRooms() {
    setRoomsState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const payload = await roomsApi.list({ availability_status: 'available' });
      setRoomsState({
        loading: false,
        error: null,
        items: listPayloadItems(payload.data),
        meta: payload.data?.meta || null,
      });
    } catch (error) {
      setRoomsState({
        loading: false,
        error,
        items: [],
        meta: null,
      });
    }
  }

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

  async function loadUploads() {
    setUploadsState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const payload = await uploadsApi.list({ limit: 25 });
      setUploadsState({
        loading: false,
        error: null,
        items: listPayloadItems(payload.data),
        meta: payload.data?.meta || null,
      });
    } catch (error) {
      setUploadsState({
        loading: false,
        error,
        items: [],
        meta: null,
      });
    }
  }

  async function submitReservation(event) {
    event.preventDefault();
    setReservationSubmit({
      pending: true,
      success: '',
      error: '',
    });

    try {
      await reservationsApi.create({
        room_id: Number(reservationForm.room_id),
        move_in_date: reservationForm.move_in_date,
        remarks: reservationForm.remarks,
      });

      setReservationForm({
        room_id: '',
        move_in_date: '',
        remarks: '',
      });
      setReservationSubmit({
        pending: false,
        success: 'Reservation submitted successfully.',
        error: '',
      });

      loadReservations();
    } catch (error) {
      setReservationSubmit({
        pending: false,
        success: '',
        error: error?.errors?.[0] || error?.message || 'Unable to create reservation.',
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

  async function submitUpload(event) {
    event.preventDefault();
    setUploadSubmit({
      pending: true,
      success: '',
      error: '',
    });

    if (!uploadFile) {
      setUploadSubmit({
        pending: false,
        success: '',
        error: 'Please select a file to upload.',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('visibility', uploadForm.visibility);
    if (uploadForm.reservation_id) {
      formData.append('reservation_id', uploadForm.reservation_id);
    }

    try {
      await uploadsApi.create(formData);
      setUploadSubmit({
        pending: false,
        success: 'File uploaded successfully.',
        error: '',
      });
      setUploadForm({
        reservation_id: '',
        visibility: 'owner',
      });
      setUploadFile(null);
      loadUploads();
    } catch (error) {
      setUploadSubmit({
        pending: false,
        success: '',
        error: error?.errors?.[0] || error?.message || 'Unable to upload file.',
      });
    }
  }

  async function removeUpload(uploadId) {
    setUploadDeletePendingId(uploadId);
    setUploadSubmit((current) => ({
      ...current,
      success: '',
      error: '',
    }));

    try {
      await uploadsApi.remove(uploadId);
      loadUploads();
    } catch (error) {
      setUploadSubmit((current) => ({
        ...current,
        error: error?.errors?.[0] || error?.message || 'Unable to delete file.',
      }));
    } finally {
      setUploadDeletePendingId(null);
    }
  }

  const loadInitialData = useEffectEvent(() => {
    loadRooms();
    loadReservations();
    loadPayments();
    loadFeedback();
    loadUploads();
  });

  useEffect(() => {
    queueMicrotask(() => {
      loadInitialData();
    });
  }, []);

  return (
    <AppShell
      title="Find and Track Boarding Options"
      subtitle="Live data from rooms, reservations, and payments APIs for your account."
      quickStats={[
        { label: 'Open Reservations', value: String(openReservations), tone: 'sky' },
        { label: 'Unpaid Balance', value: formatCurrency(unpaidBalance), tone: 'amber' },
        { label: 'Available Rooms', value: String(availableRooms.length), tone: 'mint' },
        { label: 'Uploaded Files', value: String(uploads.length), tone: 'neutral' },
      ]}
    >
      <LinkAccountsCard
        id="connections"
        title="Parent-Seeker Connections"
        description="Approve parent link requests so parents can monitor your reservation and payment progress."
      />

      <ModuleCard
        id="rooms"
        title="Room Discovery"
        description="Available rooms pulled from rooms.php."
        actions={
          <button type="button" className="button-light" onClick={loadRooms}>
            Refresh
          </button>
        }
      >
        <AsyncState
          loading={roomsState.loading}
          error={roomsState.error}
          isEmpty={availableRooms.length === 0}
          loadingText="Loading available rooms..."
          emptyText="No available rooms found."
          onRetry={loadRooms}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>House</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {availableRooms.map((room) => (
                  <tr key={room.room_id}>
                    <td>{room.room_number}</td>
                    <td>{room.house_name || '-'}</td>
                    <td>{room.room_type}</td>
                    <td>{room.capacity}</td>
                    <td>{formatCurrency(room.monthly_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </ModuleCard>

      <ModuleCard
        id="reservations"
        title="Reservation Timeline"
        description="Create reservations and monitor approval decisions from reservations.php."
        actions={
          <button type="button" className="button-light" onClick={loadReservations}>
            Refresh
          </button>
        }
      >
        <form className="inline-form" onSubmit={submitReservation}>
          <select
            value={reservationForm.room_id}
            onChange={(event) =>
              setReservationForm((current) => ({
                ...current,
                room_id: event.target.value,
              }))
            }
            required
          >
            <option value="">Select room</option>
            {availableRooms.map((room) => (
              <option key={room.room_id} value={room.room_id}>
                {room.room_number} ({formatCurrency(room.monthly_rate)})
              </option>
            ))}
          </select>
          <input
            type="date"
            value={reservationForm.move_in_date}
            onChange={(event) =>
              setReservationForm((current) => ({
                ...current,
                move_in_date: event.target.value,
              }))
            }
            required
          />
          <input
            type="text"
            value={reservationForm.remarks}
            onChange={(event) =>
              setReservationForm((current) => ({
                ...current,
                remarks: event.target.value,
              }))
            }
            placeholder="Remarks (optional)"
          />
          <button
            type="submit"
            className="button-light"
            disabled={reservationSubmit.pending || availableRooms.length === 0}
          >
            {reservationSubmit.pending ? 'Submitting...' : 'Create Reservation'}
          </button>
        </form>

        {reservationSubmit.error && (
          <div className="mini-feedback mini-error">
            <p>{reservationSubmit.error}</p>
          </div>
        )}
        {reservationSubmit.success && (
          <div className="mini-feedback mini-success">
            <p>{reservationSubmit.success}</p>
          </div>
        )}

        <AsyncState
          loading={reservationsState.loading}
          error={reservationsState.error}
          isEmpty={reservations.length === 0}
          loadingText="Loading reservations..."
          emptyText="No reservations yet."
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
        title="Payment Status"
        description="Payment records fetched from payments.php."
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
          loadingText="Loading payment records..."
          emptyText="No payment records found."
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
        id="uploads"
        title="Document Uploads"
        description="Upload reservation-related files (PDF, JPG, PNG, WEBP up to 5 MB)."
        actions={
          <button type="button" className="button-light" onClick={loadUploads}>
            Refresh
          </button>
        }
      >
        <form className="inline-form feedback-form" onSubmit={submitUpload}>
          <select
            value={uploadForm.reservation_id}
            onChange={(event) =>
              setUploadForm((current) => ({
                ...current,
                reservation_id: event.target.value,
              }))
            }
          >
            <option value="">No reservation link</option>
            {reservations.map((reservation) => (
              <option key={reservation.reservation_id} value={reservation.reservation_id}>
                #{reservation.reservation_id} - Room {reservation.room_number || reservation.room_id}
              </option>
            ))}
          </select>
          <select
            value={uploadForm.visibility}
            onChange={(event) =>
              setUploadForm((current) => ({
                ...current,
                visibility: event.target.value,
              }))
            }
          >
            <option value="private">private</option>
            <option value="owner">owner</option>
          </select>
          <input
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
            required
          />
          <button type="submit" className="button-light" disabled={uploadSubmit.pending}>
            {uploadSubmit.pending ? 'Uploading...' : 'Upload File'}
          </button>
        </form>

        {uploadSubmit.error && (
          <div className="mini-feedback mini-error">
            <p>{uploadSubmit.error}</p>
          </div>
        )}
        {uploadSubmit.success && (
          <div className="mini-feedback mini-success">
            <p>{uploadSubmit.success}</p>
          </div>
        )}

        <AsyncState
          loading={uploadsState.loading}
          error={uploadsState.error}
          isEmpty={uploads.length === 0}
          loadingText="Loading uploads..."
          emptyText="No uploaded files yet."
          onRetry={loadUploads}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Reservation</th>
                  <th>Visibility</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => (
                  <tr key={upload.upload_id}>
                    <td>{upload.upload_id}</td>
                    <td>
                      <a href={upload.file_url} target="_blank" rel="noreferrer">
                        {upload.original_name}
                      </a>
                    </td>
                    <td>{upload.mime_type}</td>
                    <td>{formatBytes(upload.file_size)}</td>
                    <td>{upload.reservation_id || '-'}</td>
                    <td>{upload.visibility}</td>
                    <td>{formatDateTime(upload.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="button-light danger"
                        onClick={() => removeUpload(upload.upload_id)}
                        disabled={uploadDeletePendingId === upload.upload_id}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </ModuleCard>

      <ModuleCard
        id="feedback"
        title="Ratings and Feedback"
        description="Submit feedback for approved reservations and review your submitted ratings."
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
            placeholder="Share your boarding experience..."
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
          emptyText="No feedback submitted yet."
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
        description="Maintain your seeker profile and change your account password."
      />
    </AppShell>
  );
}

export default SeekerDashboard;
