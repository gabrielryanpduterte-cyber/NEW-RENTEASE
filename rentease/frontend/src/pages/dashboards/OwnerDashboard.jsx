import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import {
  boardingHouseApi,
  feedbackApi,
  paymentsApi,
  reportsApi,
  reservationsApi,
  roomsApi,
} from '../../api/client.js';
import AccountSettingsCard from '../../components/AccountSettingsCard.jsx';
import AppShell from '../../components/AppShell.jsx';
import AsyncState from '../../components/AsyncState.jsx';
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

function todayDateValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function OwnerDashboard() {
  const [housesState, setHousesState] = useState(defaultSectionState);
  const [roomsState, setRoomsState] = useState(defaultSectionState);
  const [reservationsState, setReservationsState] = useState(defaultSectionState);
  const [paymentsState, setPaymentsState] = useState(defaultSectionState);
  const [feedbackState, setFeedbackState] = useState(defaultSectionState);
  const [reportsState, setReportsState] = useState({
    loading: true,
    error: null,
    data: null,
  });
  const [reportFilters, setReportFilters] = useState({
    date_from: '',
    date_to: '',
  });
  const [feedbackFilters, setFeedbackFilters] = useState({
    status: '',
    rating: '',
    search: '',
  });
  const [feedbackPage, setFeedbackPage] = useState(1);

  const [roomForm, setRoomForm] = useState({
    boarding_house_id: '',
    room_number: '',
    room_type: '',
    capacity: '1',
    monthly_rate: '',
    amenities: '',
    availability_status: 'available',
  });
  const [roomSubmission, setRoomSubmission] = useState({
    pending: false,
    success: '',
    error: '',
  });
  const [roomStatusDrafts, setRoomStatusDrafts] = useState({});
  const [roomStatusPendingId, setRoomStatusPendingId] = useState(null);
  const [roomActionFeedback, setRoomActionFeedback] = useState('');

  const [reservationRemarks, setReservationRemarks] = useState({});
  const [reservationPendingId, setReservationPendingId] = useState(null);
  const [reservationActionFeedback, setReservationActionFeedback] = useState('');

  const [paymentForm, setPaymentForm] = useState({
    reservation_id: '',
    amount_due: '',
    amount_paid: '',
    billing_period: '',
    payment_date: todayDateValue(),
  });
  const [paymentSubmission, setPaymentSubmission] = useState({
    pending: false,
    success: '',
    error: '',
  });
  const [paymentStatusPendingId, setPaymentStatusPendingId] = useState(null);
  const [paymentActionFeedback, setPaymentActionFeedback] = useState('');

  const houses = housesState.items;
  const rooms = roomsState.items;
  const reservations = reservationsState.items;
  const payments = paymentsState.items;
  const feedbackEntries = feedbackState.items;
  const feedbackMeta = feedbackState.meta || { page: 1, total_pages: 0, total: 0 };

  const roomById = useMemo(
    () =>
      new Map(
        rooms.map((room) => [Number(room.room_id), room]),
      ),
    [rooms],
  );

  const approvedReservations = useMemo(
    () => reservations.filter((item) => item.status === 'approved'),
    [reservations],
  );

  const selectedReservation = useMemo(
    () =>
      approvedReservations.find(
        (item) => String(item.reservation_id) === paymentForm.reservation_id,
      ) || null,
    [approvedReservations, paymentForm.reservation_id],
  );

  const pendingReservations = useMemo(
    () => reservations.filter((item) => item.status === 'pending').length,
    [reservations],
  );

  const collectedThisMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    return payments.reduce((total, payment) => {
      const paidDate = new Date(payment.payment_date);
      if (Number.isNaN(paidDate.getTime())) {
        return total;
      }
      if (paidDate.getFullYear() !== year || paidDate.getMonth() !== month) {
        return total;
      }
      return total + (Number(payment.amount_paid) || 0);
    }, 0);
  }, [payments]);

  const reportCollectedTotal = useMemo(
    () => Number(reportsState.data?.monthly_income?.summary?.total_collected || 0),
    [reportsState.data],
  );

  const reportOccupancyRate = useMemo(
    () => Number(reportsState.data?.occupancy?.occupancy_rate_percent || 0),
    [reportsState.data],
  );

  const reportPendingReservations = useMemo(
    () => Number(reportsState.data?.reservation_stats?.pending || 0),
    [reportsState.data],
  );

  const pendingReservationsStat = reportsState.data
    ? reportPendingReservations
    : pendingReservations;
  const collectedStat = reportsState.data
    ? reportCollectedTotal
    : collectedThisMonth;

  function listPayloadItems(data) {
    if (Array.isArray(data)) {
      return data;
    }

    return asArray(data?.items);
  }

  async function loadBoardingHouses() {
    setHousesState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const payload = await boardingHouseApi.list();
      const items = listPayloadItems(payload.data);

      setHousesState({
        loading: false,
        error: null,
        items,
        meta: payload.data?.meta || null,
      });

      if (items.length > 0) {
        setRoomForm((current) => ({
          ...current,
          boarding_house_id:
            current.boarding_house_id || String(items[0].boarding_house_id),
        }));
      }
    } catch (error) {
      setHousesState({
        loading: false,
        error,
        items: [],
        meta: null,
      });
    }
  }

  async function loadRooms() {
    setRoomsState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const payload = await roomsApi.list();
      const items = listPayloadItems(payload.data);

      setRoomsState({
        loading: false,
        error: null,
        items,
        meta: payload.data?.meta || null,
      });

      setRoomStatusDrafts(
        Object.fromEntries(
          items.map((room) => [room.room_id, room.availability_status || 'available']),
        ),
      );
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

  async function loadReports(nextFilters = reportFilters) {
    setReportsState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    const query = {
      date_from: nextFilters.date_from,
      date_to: nextFilters.date_to,
    };

    try {
      const payload = await reportsApi.get(query);
      setReportsState({
        loading: false,
        error: null,
        data: payload.data || null,
      });
    } catch (error) {
      setReportsState({
        loading: false,
        error,
        data: null,
      });
    }
  }

  async function loadFeedback(page = feedbackPage, nextFilters = feedbackFilters) {
    setFeedbackState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    const query = {
      page,
      limit: 15,
      status: nextFilters.status,
      rating: nextFilters.rating,
      search: nextFilters.search,
    };

    try {
      const payload = await feedbackApi.list(query);
      setFeedbackState({
        loading: false,
        error: null,
        items: listPayloadItems(payload.data),
        meta: payload.data?.meta || null,
      });
      setFeedbackPage(page);
    } catch (error) {
      setFeedbackState({
        loading: false,
        error,
        items: [],
        meta: null,
      });
    }
  }

  async function submitRoom(event) {
    event.preventDefault();
    setRoomSubmission({
      pending: true,
      success: '',
      error: '',
    });

    try {
      await roomsApi.create({
        boarding_house_id: Number(roomForm.boarding_house_id),
        room_number: roomForm.room_number,
        room_type: roomForm.room_type,
        capacity: Number(roomForm.capacity),
        monthly_rate: Number(roomForm.monthly_rate),
        amenities: roomForm.amenities,
        availability_status: roomForm.availability_status,
      });

      setRoomSubmission({
        pending: false,
        success: 'Room created successfully.',
        error: '',
      });

      setRoomForm((current) => ({
        ...current,
        room_number: '',
        room_type: '',
        capacity: '1',
        monthly_rate: '',
        amenities: '',
        availability_status: 'available',
      }));

      loadRooms();
    } catch (error) {
      setRoomSubmission({
        pending: false,
        success: '',
        error: error?.errors?.[0] || error?.message || 'Unable to create room.',
      });
    }
  }

  async function saveRoomStatus(roomId) {
    setRoomStatusPendingId(roomId);
    setRoomActionFeedback('');

    try {
      await roomsApi.update(roomId, {
        availability_status: roomStatusDrafts[roomId] || 'available',
      });
      loadRooms();
    } catch (error) {
      setRoomActionFeedback(
        error?.errors?.[0] || error?.message || 'Unable to update room status.',
      );
    } finally {
      setRoomStatusPendingId(null);
    }
  }

  async function decideReservation(reservationId, status) {
    setReservationPendingId(reservationId);
    setReservationActionFeedback('');

    try {
      await reservationsApi.update(reservationId, {
        status,
        remarks: reservationRemarks[reservationId] || '',
      });

      loadReservations();
    } catch (error) {
      setReservationActionFeedback(
        error?.errors?.[0] || error?.message || 'Unable to update reservation.',
      );
    } finally {
      setReservationPendingId(null);
    }
  }

  function onPaymentReservationChange(value) {
    const reservation = approvedReservations.find(
      (item) => String(item.reservation_id) === value,
    );
    const roomRate = reservation
      ? Number(roomById.get(Number(reservation.room_id))?.monthly_rate || 0)
      : 0;

    setPaymentForm((current) => ({
      ...current,
      reservation_id: value,
      amount_due: roomRate > 0 ? String(roomRate) : current.amount_due,
      amount_paid: current.amount_paid || '0',
    }));
  }

  async function submitPayment(event) {
    event.preventDefault();
    setPaymentSubmission({
      pending: true,
      success: '',
      error: '',
    });

    if (!selectedReservation) {
      setPaymentSubmission({
        pending: false,
        success: '',
        error: 'Please select an approved reservation.',
      });
      return;
    }

    try {
      await paymentsApi.create({
        reservation_id: Number(selectedReservation.reservation_id),
        user_id: Number(selectedReservation.user_id),
        room_id: Number(selectedReservation.room_id),
        amount_due: Number(paymentForm.amount_due),
        amount_paid: Number(paymentForm.amount_paid),
        billing_period: paymentForm.billing_period,
        payment_date: paymentForm.payment_date,
      });

      setPaymentSubmission({
        pending: false,
        success: 'Payment recorded successfully.',
        error: '',
      });

      setPaymentForm({
        reservation_id: '',
        amount_due: '',
        amount_paid: '',
        billing_period: '',
        payment_date: todayDateValue(),
      });

      loadPayments();
    } catch (error) {
      setPaymentSubmission({
        pending: false,
        success: '',
        error: error?.errors?.[0] || error?.message || 'Unable to record payment.',
      });
    }
  }

  async function updatePaymentStatus(payment, status) {
    setPaymentStatusPendingId(payment.payment_id);
    setPaymentActionFeedback('');

    try {
      const payload =
        status === 'paid'
          ? {
              payment_status: 'paid',
              amount_paid: Number(payment.amount_due),
            }
          : {
              payment_status: 'unpaid',
            };

      await paymentsApi.update(payment.payment_id, payload);
      loadPayments();
    } catch (error) {
      setPaymentActionFeedback(
        error?.errors?.[0] || error?.message || 'Unable to update payment status.',
      );
    } finally {
      setPaymentStatusPendingId(null);
    }
  }

  function applyReportFilters(event) {
    event.preventDefault();
    loadReports(reportFilters);
  }

  function applyFeedbackFilters(event) {
    event.preventDefault();
    loadFeedback(1, feedbackFilters);
  }

  function goToFeedbackPage(nextPage) {
    if (nextPage < 1) {
      return;
    }

    const totalPages = Number(feedbackMeta.total_pages || 0);
    if (totalPages > 0 && nextPage > totalPages) {
      return;
    }

    loadFeedback(nextPage, feedbackFilters);
  }

  const loadInitialData = useEffectEvent(() => {
    loadBoardingHouses();
    loadRooms();
    loadReservations();
    loadPayments();
    loadReports();
    loadFeedback();
  });

  useEffect(() => {
    queueMicrotask(() => {
      loadInitialData();
    });
  }, []);

  const monthlyIncomeRows = asArray(reportsState.data?.monthly_income?.rows);
  const paymentStatusRows = asArray(reportsState.data?.payment_status?.rows);
  const occupancy = reportsState.data?.occupancy || {};
  const reservationStats = reportsState.data?.reservation_stats || {};

  return (
    <AppShell
      title="Operate Rooms, Reservations, and Rent Tracking"
      subtitle="Integrated owner controls for boarding house, reservation decisions, and payment updates."
      quickStats={[
        { label: 'Total Rooms', value: String(rooms.length), tone: 'sky' },
        { label: 'Pending Reservations', value: String(pendingReservationsStat), tone: 'amber' },
        { label: 'Collected', value: formatCurrency(collectedStat), tone: 'mint' },
        { label: 'Occupancy Rate', value: `${reportOccupancyRate.toFixed(2)}%`, tone: 'neutral' },
      ]}
    >
      <ModuleCard
        id="rooms"
        title="Room Management"
        description="Create rooms and update room availability."
        actions={
          <button type="button" className="button-light" onClick={loadRooms}>
            Refresh
          </button>
        }
      >
        <AsyncState
          loading={housesState.loading}
          error={housesState.error}
          isEmpty={houses.length === 0}
          loadingText="Loading boarding house profile..."
          emptyText="No boarding house record found for this owner account."
          onRetry={loadBoardingHouses}
        >
          <div className="info-block">
            <p>
              <strong>House:</strong> {houses[0]?.house_name}
            </p>
            <p>
              <strong>Address:</strong> {houses[0]?.address}
            </p>
          </div>
        </AsyncState>

        <form className="inline-form room-form" onSubmit={submitRoom}>
          <select
            value={roomForm.boarding_house_id}
            onChange={(event) =>
              setRoomForm((current) => ({
                ...current,
                boarding_house_id: event.target.value,
              }))
            }
            required
          >
            <option value="">Select boarding house</option>
            {houses.map((house) => (
              <option key={house.boarding_house_id} value={house.boarding_house_id}>
                {house.house_name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Room number"
            value={roomForm.room_number}
            onChange={(event) =>
              setRoomForm((current) => ({
                ...current,
                room_number: event.target.value,
              }))
            }
            required
          />
          <input
            type="text"
            placeholder="Room type"
            value={roomForm.room_type}
            onChange={(event) =>
              setRoomForm((current) => ({
                ...current,
                room_type: event.target.value,
              }))
            }
            required
          />
          <input
            type="number"
            min="1"
            placeholder="Capacity"
            value={roomForm.capacity}
            onChange={(event) =>
              setRoomForm((current) => ({
                ...current,
                capacity: event.target.value,
              }))
            }
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Monthly rate"
            value={roomForm.monthly_rate}
            onChange={(event) =>
              setRoomForm((current) => ({
                ...current,
                monthly_rate: event.target.value,
              }))
            }
            required
          />
          <input
            type="text"
            placeholder="Amenities"
            value={roomForm.amenities}
            onChange={(event) =>
              setRoomForm((current) => ({
                ...current,
                amenities: event.target.value,
              }))
            }
          />
          <select
            value={roomForm.availability_status}
            onChange={(event) =>
              setRoomForm((current) => ({
                ...current,
                availability_status: event.target.value,
              }))
            }
          >
            <option value="available">available</option>
            <option value="unavailable">unavailable</option>
            <option value="occupied">occupied</option>
          </select>
          <button type="submit" className="button-light" disabled={roomSubmission.pending}>
            {roomSubmission.pending ? 'Saving...' : 'Create Room'}
          </button>
        </form>

        {roomSubmission.error && (
          <div className="mini-feedback mini-error">
            <p>{roomSubmission.error}</p>
          </div>
        )}
        {roomSubmission.success && (
          <div className="mini-feedback mini-success">
            <p>{roomSubmission.success}</p>
          </div>
        )}
        {roomActionFeedback && (
          <div className="mini-feedback mini-error">
            <p>{roomActionFeedback}</p>
          </div>
        )}

        <AsyncState
          loading={roomsState.loading}
          error={roomsState.error}
          isEmpty={rooms.length === 0}
          loadingText="Loading rooms..."
          emptyText="No rooms found for this boarding house."
          onRetry={loadRooms}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Rate</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.room_id}>
                    <td>{room.room_number}</td>
                    <td>{room.room_type}</td>
                    <td>{room.capacity}</td>
                    <td>{formatCurrency(room.monthly_rate)}</td>
                    <td>
                      <span className={`status-pill ${statusClassName(room.availability_status)}`}>
                        {room.availability_status}
                      </span>
                    </td>
                    <td className="row-actions">
                      <select
                        value={roomStatusDrafts[room.room_id] || room.availability_status}
                        onChange={(event) =>
                          setRoomStatusDrafts((current) => ({
                            ...current,
                            [room.room_id]: event.target.value,
                          }))
                        }
                      >
                        <option value="available">available</option>
                        <option value="unavailable">unavailable</option>
                        <option value="occupied">occupied</option>
                      </select>
                      <button
                        type="button"
                        className="button-light"
                        onClick={() => saveRoomStatus(room.room_id)}
                        disabled={roomStatusPendingId === room.room_id}
                      >
                        {roomStatusPendingId === room.room_id ? 'Updating...' : 'Save'}
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
        id="reservations"
        title="Reservation Decisions"
        description="Approve or reject pending reservations."
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
          loadingText="Loading reservation queue..."
          emptyText="No reservations found."
          onRetry={loadReservations}
        >
          {reservationActionFeedback && (
            <div className="mini-feedback mini-error">
              <p>{reservationActionFeedback}</p>
            </div>
          )}

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Room</th>
                  <th>Move-in</th>
                  <th>Status</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.reservation_id}>
                    <td>{reservation.reservation_id}</td>
                    <td>{reservation.user_id}</td>
                    <td>{reservation.room_number || reservation.room_id}</td>
                    <td>{formatDate(reservation.move_in_date)}</td>
                    <td>
                      <span className={`status-pill ${statusClassName(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </td>
                    <td>
                      {reservation.status === 'pending' ? (
                        <div className="decision-block">
                          <input
                            type="text"
                            placeholder="Remarks"
                            value={reservationRemarks[reservation.reservation_id] || ''}
                            onChange={(event) =>
                              setReservationRemarks((current) => ({
                                ...current,
                                [reservation.reservation_id]: event.target.value,
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="button-light"
                            onClick={() =>
                              decideReservation(reservation.reservation_id, 'approved')
                            }
                            disabled={reservationPendingId === reservation.reservation_id}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="button-light danger"
                            onClick={() =>
                              decideReservation(reservation.reservation_id, 'rejected')
                            }
                            disabled={reservationPendingId === reservation.reservation_id}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span>{reservation.remarks || '-'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </ModuleCard>

      <ModuleCard
        id="payments"
        title="Payment Recording"
        description="Record new payment entries and update payment status."
        actions={
          <button type="button" className="button-light" onClick={loadPayments}>
            Refresh
          </button>
        }
      >
        <form className="inline-form payment-form" onSubmit={submitPayment}>
          <select
            value={paymentForm.reservation_id}
            onChange={(event) => onPaymentReservationChange(event.target.value)}
            required
          >
            <option value="">Select approved reservation</option>
            {approvedReservations.map((reservation) => (
              <option key={reservation.reservation_id} value={reservation.reservation_id}>
                #{reservation.reservation_id} - Room {reservation.room_number || reservation.room_id}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount due"
            value={paymentForm.amount_due}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                amount_due: event.target.value,
              }))
            }
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount paid"
            value={paymentForm.amount_paid}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                amount_paid: event.target.value,
              }))
            }
            required
          />
          <input
            type="text"
            placeholder="Billing period (e.g. 2026-04)"
            value={paymentForm.billing_period}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                billing_period: event.target.value,
              }))
            }
            required
          />
          <input
            type="date"
            value={paymentForm.payment_date}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                payment_date: event.target.value,
              }))
            }
            required
          />
          <button type="submit" className="button-light" disabled={paymentSubmission.pending}>
            {paymentSubmission.pending ? 'Recording...' : 'Record Payment'}
          </button>
        </form>

        {paymentSubmission.error && (
          <div className="mini-feedback mini-error">
            <p>{paymentSubmission.error}</p>
          </div>
        )}
        {paymentSubmission.success && (
          <div className="mini-feedback mini-success">
            <p>{paymentSubmission.success}</p>
          </div>
        )}
        {paymentActionFeedback && (
          <div className="mini-feedback mini-error">
            <p>{paymentActionFeedback}</p>
          </div>
        )}

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
                  <th>ID</th>
                  <th>Billing</th>
                  <th>Due</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.payment_id}>
                    <td>{payment.payment_id}</td>
                    <td>{payment.billing_period}</td>
                    <td>{formatCurrency(payment.amount_due)}</td>
                    <td>{formatCurrency(payment.amount_paid)}</td>
                    <td>
                      <span className={`status-pill ${statusClassName(payment.payment_status)}`}>
                        {payment.payment_status}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button
                        type="button"
                        className="button-light"
                        onClick={() => updatePaymentStatus(payment, 'paid')}
                        disabled={paymentStatusPendingId === payment.payment_id}
                      >
                        Mark Paid
                      </button>
                      <button
                        type="button"
                        className="button-light danger"
                        onClick={() => updatePaymentStatus(payment, 'unpaid')}
                        disabled={paymentStatusPendingId === payment.payment_id}
                      >
                        Mark Unpaid
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
        id="reports"
        title="Owner Reports"
        description="Monthly income, payment status, occupancy, and reservation statistics."
        actions={
          <button type="button" className="button-light" onClick={() => loadReports()}>
            Refresh
          </button>
        }
      >
        <form className="inline-form report-form" onSubmit={applyReportFilters}>
          <input
            type="date"
            value={reportFilters.date_from}
            onChange={(event) =>
              setReportFilters((current) => ({
                ...current,
                date_from: event.target.value,
              }))
            }
          />
          <input
            type="date"
            value={reportFilters.date_to}
            onChange={(event) =>
              setReportFilters((current) => ({
                ...current,
                date_to: event.target.value,
              }))
            }
          />
          <button type="submit" className="button-light" disabled={reportsState.loading}>
            {reportsState.loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </form>

        <AsyncState
          loading={reportsState.loading}
          error={reportsState.error}
          isEmpty={!reportsState.data}
          loadingText="Loading report data..."
          emptyText="No report data available."
          onRetry={() => loadReports()}
        >
          <div className="report-grid">
            <div className="report-stat">
              <p>Total Collected</p>
              <h4>{formatCurrency(reportCollectedTotal)}</h4>
            </div>
            <div className="report-stat">
              <p>Outstanding Balance</p>
              <h4>
                {formatCurrency(
                  Number(reportsState.data?.payment_status?.summary?.total_outstanding || 0),
                )}
              </h4>
            </div>
            <div className="report-stat">
              <p>Occupancy Rate</p>
              <h4>{Number(occupancy.occupancy_rate_percent || 0).toFixed(2)}%</h4>
            </div>
            <div className="report-stat">
              <p>Reservations</p>
              <h4>{Number(reservationStats.total || 0)}</h4>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Due</th>
                  <th>Collected</th>
                  <th>Payments</th>
                </tr>
              </thead>
              <tbody>
                {monthlyIncomeRows.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{formatCurrency(row.total_due)}</td>
                    <td>{formatCurrency(row.total_collected)}</td>
                    <td>{row.payments_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                  <th>Total Due</th>
                  <th>Total Paid</th>
                  <th>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {paymentStatusRows.map((row) => (
                  <tr key={row.payment_status}>
                    <td>{row.payment_status}</td>
                    <td>{row.record_count}</td>
                    <td>{formatCurrency(row.total_due)}</td>
                    <td>{formatCurrency(row.total_paid)}</td>
                    <td>{formatCurrency(row.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </ModuleCard>

      <ModuleCard
        id="feedback"
        title="Feedback Visibility"
        description="Ratings and comments submitted for reservations in your managed boarding house."
        actions={
          <button type="button" className="button-light" onClick={() => loadFeedback()}>
            Refresh
          </button>
        }
      >
        <form className="inline-form report-form" onSubmit={applyFeedbackFilters}>
          <select
            value={feedbackFilters.status}
            onChange={(event) =>
              setFeedbackFilters((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            <option value="">All status</option>
            <option value="visible">visible</option>
            <option value="hidden">hidden</option>
          </select>
          <select
            value={feedbackFilters.rating}
            onChange={(event) =>
              setFeedbackFilters((current) => ({
                ...current,
                rating: event.target.value,
              }))
            }
          >
            <option value="">All ratings</option>
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
          <input
            type="text"
            value={feedbackFilters.search}
            onChange={(event) =>
              setFeedbackFilters((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
            placeholder="Search comment or tenant"
          />
          <button type="submit" className="button-light" disabled={feedbackState.loading}>
            {feedbackState.loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </form>

        <AsyncState
          loading={feedbackState.loading}
          error={feedbackState.error}
          isEmpty={feedbackEntries.length === 0}
          loadingText="Loading feedback records..."
          emptyText="No feedback records found."
          onRetry={() => loadFeedback()}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Reservation</th>
                  <th>Room</th>
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
                    <td>{entry.user_name || entry.user_id}</td>
                    <td>{entry.reservation_id}</td>
                    <td>{entry.room_number || entry.room_id}</td>
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

          <div className="pagination-controls">
            <button
              type="button"
              className="button-light"
              onClick={() => goToFeedbackPage(feedbackPage - 1)}
              disabled={feedbackState.loading || feedbackPage <= 1}
            >
              Previous
            </button>
            <p>
              Page {feedbackMeta.page || 1} of {feedbackMeta.total_pages || 1}
              {' '}({feedbackMeta.total || 0} records)
            </p>
            <button
              type="button"
              className="button-light"
              onClick={() => goToFeedbackPage(feedbackPage + 1)}
              disabled={
                feedbackState.loading ||
                feedbackPage >= Number(feedbackMeta.total_pages || 1)
              }
            >
              Next
            </button>
          </div>
        </AsyncState>
      </ModuleCard>

      <AccountSettingsCard
        id="account"
        title="Account Settings"
        description="Maintain your owner profile and change your account password."
      />
    </AppShell>
  );
}

export default OwnerDashboard;
