import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import {
  activityLogsApi,
  errorLogsApi,
  feedbackApi,
  reportsApi,
  usersApi,
} from '../../api/client.js';
import { useAuth } from '../../auth/useAuth.js';
import AccountSettingsCard from '../../components/AccountSettingsCard.jsx';
import AppShell from '../../components/AppShell.jsx';
import AsyncState from '../../components/AsyncState.jsx';
import ModuleCard from '../../components/ModuleCard.jsx';
import {
  asArray,
  formatCurrency,
  formatDateTime,
  statusClassName,
} from '../../utils/format.js';

const defaultSectionState = Object.freeze({
  loading: true,
  error: null,
  items: [],
  meta: null,
});

function listPayloadItems(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return asArray(data?.items);
}

function AdminDashboard() {
  const { authState } = useAuth();
  const [usersState, setUsersState] = useState(defaultSectionState);
  const [activityState, setActivityState] = useState(defaultSectionState);
  const [errorState, setErrorState] = useState(defaultSectionState);
  const [feedbackState, setFeedbackState] = useState(defaultSectionState);
  const [reportsState, setReportsState] = useState({
    loading: true,
    error: null,
    data: null,
  });

  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'seeker',
    contact_number: '',
    account_status: 'active',
  });
  const [userSubmission, setUserSubmission] = useState({
    pending: false,
    success: '',
    error: '',
  });
  const [userActionPendingId, setUserActionPendingId] = useState(null);
  const [userActionFeedback, setUserActionFeedback] = useState('');

  const [reportFilters, setReportFilters] = useState({
    date_from: '',
    date_to: '',
    boarding_house_id: '',
  });
  const [activityFilters, setActivityFilters] = useState({
    user_id: '',
    module: '',
    date_from: '',
    date_to: '',
    search: '',
  });
  const [errorFilters, setErrorFilters] = useState({
    affected_user_id: '',
    error_code: '',
    module: '',
    date_from: '',
    date_to: '',
    search: '',
  });
  const [feedbackFilters, setFeedbackFilters] = useState({
    user_id: '',
    status: '',
    rating: '',
    search: '',
  });

  const [activityPage, setActivityPage] = useState(1);
  const [errorPage, setErrorPage] = useState(1);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackActionPendingId, setFeedbackActionPendingId] = useState(null);
  const [feedbackActionMessage, setFeedbackActionMessage] = useState('');

  const users = usersState.items;
  const activityLogs = activityState.items;
  const errorLogs = errorState.items;
  const feedbackEntries = feedbackState.items;

  const activityMeta = activityState.meta || { page: 1, total_pages: 0, total: 0 };
  const errorMeta = errorState.meta || { page: 1, total_pages: 0, total: 0 };
  const feedbackMeta = feedbackState.meta || { page: 1, total_pages: 0, total: 0 };

  const activeUsers = useMemo(
    () => users.filter((item) => item.account_status === 'active').length,
    [users],
  );

  const activityToday = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    return activityLogs.filter((entry) => {
      const parsed = new Date(entry.timestamp);
      if (Number.isNaN(parsed.getTime())) {
        return false;
      }
      return (
        parsed.getFullYear() === year &&
        parsed.getMonth() === month &&
        parsed.getDate() === day
      );
    }).length;
  }, [activityLogs]);

  const monthlyIncomeRows = asArray(reportsState.data?.monthly_income?.rows);
  const paymentStatusRows = asArray(reportsState.data?.payment_status?.rows);
  const occupancy = reportsState.data?.occupancy || {};
  const reservationStats = reportsState.data?.reservation_stats || {};

  async function loadUsers() {
    setUsersState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const payload = await usersApi.list();
      setUsersState({
        loading: false,
        error: null,
        items: listPayloadItems(payload.data),
        meta: payload.data?.meta || null,
      });
    } catch (error) {
      setUsersState({
        loading: false,
        error,
        items: [],
        meta: null,
      });
    }
  }

  async function loadActivityLogs(page = activityPage, filters = activityFilters) {
    setActivityState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    const query = {
      page,
      limit: 15,
      user_id: filters.user_id,
      module: filters.module,
      date_from: filters.date_from,
      date_to: filters.date_to,
      search: filters.search,
    };

    try {
      const payload = await activityLogsApi.list(query);
      setActivityState({
        loading: false,
        error: null,
        items: listPayloadItems(payload.data),
        meta: payload.data?.meta || null,
      });
      setActivityPage(page);
    } catch (error) {
      setActivityState({
        loading: false,
        error,
        items: [],
        meta: null,
      });
    }
  }

  async function loadErrorLogs(page = errorPage, filters = errorFilters) {
    setErrorState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    const query = {
      page,
      limit: 15,
      affected_user_id: filters.affected_user_id,
      error_code: filters.error_code,
      module: filters.module,
      date_from: filters.date_from,
      date_to: filters.date_to,
      search: filters.search,
    };

    try {
      const payload = await errorLogsApi.list(query);
      setErrorState({
        loading: false,
        error: null,
        items: listPayloadItems(payload.data),
        meta: payload.data?.meta || null,
      });
      setErrorPage(page);
    } catch (error) {
      setErrorState({
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
      boarding_house_id: nextFilters.boarding_house_id,
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

  async function loadFeedback(page = feedbackPage, filters = feedbackFilters) {
    setFeedbackState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    const query = {
      page,
      limit: 15,
      user_id: filters.user_id,
      status: filters.status,
      rating: filters.rating,
      search: filters.search,
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

  async function submitUser(event) {
    event.preventDefault();
    setUserSubmission({
      pending: true,
      success: '',
      error: '',
    });

    try {
      await usersApi.create(userForm);
      setUserSubmission({
        pending: false,
        success: 'User account created successfully.',
        error: '',
      });

      setUserForm({
        full_name: '',
        email: '',
        password: '',
        role: 'seeker',
        contact_number: '',
        account_status: 'active',
      });

      loadUsers();
    } catch (error) {
      setUserSubmission({
        pending: false,
        success: '',
        error: error?.errors?.[0] || error?.message || 'Unable to create user.',
      });
    }
  }

  async function toggleUserStatus(user) {
    setUserActionPendingId(user.user_id);
    setUserActionFeedback('');

    try {
      const nextStatus = user.account_status === 'active' ? 'inactive' : 'active';
      await usersApi.update(user.user_id, {
        account_status: nextStatus,
      });

      loadUsers();
    } catch (error) {
      setUserActionFeedback(
        error?.errors?.[0] || error?.message || 'Unable to update user status.',
      );
    } finally {
      setUserActionPendingId(null);
    }
  }

  async function deactivateUser(userId) {
    setUserActionPendingId(userId);
    setUserActionFeedback('');

    try {
      await usersApi.deactivate(userId);
      loadUsers();
    } catch (error) {
      setUserActionFeedback(
        error?.errors?.[0] || error?.message || 'Unable to deactivate user.',
      );
    } finally {
      setUserActionPendingId(null);
    }
  }

  async function toggleFeedbackStatus(entry) {
    setFeedbackActionPendingId(entry.feedback_id);
    setFeedbackActionMessage('');

    try {
      const nextStatus = entry.status === 'visible' ? 'hidden' : 'visible';
      await feedbackApi.update(entry.feedback_id, { status: nextStatus });
      loadFeedback(feedbackPage, feedbackFilters);
    } catch (error) {
      setFeedbackActionMessage(
        error?.errors?.[0] || error?.message || 'Unable to update feedback status.',
      );
    } finally {
      setFeedbackActionPendingId(null);
    }
  }

  function applyReportFilters(event) {
    event.preventDefault();
    loadReports(reportFilters);
  }

  function applyActivityFilters(event) {
    event.preventDefault();
    loadActivityLogs(1, activityFilters);
  }

  function applyErrorFilters(event) {
    event.preventDefault();
    loadErrorLogs(1, errorFilters);
  }

  function applyFeedbackFilters(event) {
    event.preventDefault();
    loadFeedback(1, feedbackFilters);
  }

  function goToActivityPage(nextPage) {
    if (nextPage < 1) {
      return;
    }

    const totalPages = Number(activityMeta.total_pages || 0);
    if (totalPages > 0 && nextPage > totalPages) {
      return;
    }

    loadActivityLogs(nextPage, activityFilters);
  }

  function goToErrorPage(nextPage) {
    if (nextPage < 1) {
      return;
    }

    const totalPages = Number(errorMeta.total_pages || 0);
    if (totalPages > 0 && nextPage > totalPages) {
      return;
    }

    loadErrorLogs(nextPage, errorFilters);
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
    loadUsers();
    loadActivityLogs();
    loadErrorLogs();
    loadReports();
    loadFeedback();
  });

  useEffect(() => {
    queueMicrotask(() => {
      loadInitialData();
    });
  }, []);

  return (
    <AppShell
      title="System Reports, Logs, and Governance"
      subtitle="Admin controls for users, reports, log monitoring, and feedback moderation."
      quickStats={[
        { label: 'Active Users', value: String(activeUsers), tone: 'sky' },
        { label: 'Audit Events Today', value: String(activityToday), tone: 'mint' },
        { label: 'Error Logs', value: String(errorMeta.total || errorLogs.length), tone: 'amber' },
        { label: 'Feedback Entries', value: String(feedbackMeta.total || feedbackEntries.length), tone: 'neutral' },
      ]}
    >
      <ModuleCard
        id="reports"
        title="System Reports"
        description="Generate monthly income, payment status, occupancy, and reservation statistics."
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
          <input
            type="number"
            min="1"
            value={reportFilters.boarding_house_id}
            onChange={(event) =>
              setReportFilters((current) => ({
                ...current,
                boarding_house_id: event.target.value,
              }))
            }
            placeholder="Boarding house ID (optional)"
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
              <h4>{formatCurrency(reportsState.data?.monthly_income?.summary?.total_collected || 0)}</h4>
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
              <p>Total Reservations</p>
              <h4>{Number(reservationStats.total || 0)}</h4>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Due</th>
                  <th>Total Collected</th>
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
        id="users"
        title="Account Oversight"
        description="Create users, update status, and deactivate accounts."
        actions={
          <button type="button" className="button-light" onClick={loadUsers}>
            Refresh
          </button>
        }
      >
        <form className="inline-form user-form" onSubmit={submitUser}>
          <input
            type="text"
            placeholder="Full name"
            value={userForm.full_name}
            onChange={(event) =>
              setUserForm((current) => ({
                ...current,
                full_name: event.target.value,
              }))
            }
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={userForm.email}
            onChange={(event) =>
              setUserForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={userForm.password}
            onChange={(event) =>
              setUserForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            required
          />
          <select
            value={userForm.role}
            onChange={(event) =>
              setUserForm((current) => ({
                ...current,
                role: event.target.value,
              }))
            }
          >
            <option value="seeker">seeker</option>
            <option value="parent">parent</option>
            <option value="owner">owner</option>
            <option value="admin">admin</option>
          </select>
          <input
            type="text"
            placeholder="Contact number"
            value={userForm.contact_number}
            onChange={(event) =>
              setUserForm((current) => ({
                ...current,
                contact_number: event.target.value,
              }))
            }
            required
          />
          <select
            value={userForm.account_status}
            onChange={(event) =>
              setUserForm((current) => ({
                ...current,
                account_status: event.target.value,
              }))
            }
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <button type="submit" className="button-light" disabled={userSubmission.pending}>
            {userSubmission.pending ? 'Creating...' : 'Create User'}
          </button>
        </form>

        {userSubmission.error && (
          <div className="mini-feedback mini-error">
            <p>{userSubmission.error}</p>
          </div>
        )}
        {userSubmission.success && (
          <div className="mini-feedback mini-success">
            <p>{userSubmission.success}</p>
          </div>
        )}
        {userActionFeedback && (
          <div className="mini-feedback mini-error">
            <p>{userActionFeedback}</p>
          </div>
        )}

        <AsyncState
          loading={usersState.loading}
          error={usersState.error}
          isEmpty={users.length === 0}
          loadingText="Loading users..."
          emptyText="No users found."
          onRetry={loadUsers}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.user_id}</td>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`status-pill ${statusClassName(user.account_status)}`}>
                        {user.account_status}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button
                        type="button"
                        className="button-light"
                        onClick={() => toggleUserStatus(user)}
                        disabled={userActionPendingId === user.user_id}
                      >
                        Toggle Status
                      </button>
                      <button
                        type="button"
                        className="button-light danger"
                        onClick={() => deactivateUser(user.user_id)}
                        disabled={
                          userActionPendingId === user.user_id ||
                          user.user_id === authState.user?.user_id
                        }
                      >
                        Deactivate
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
        id="activity"
        title="Activity Logs Viewer"
        description="Filter by user, module, date window, and keyword search."
        actions={
          <button type="button" className="button-light" onClick={() => loadActivityLogs()}>
            Refresh
          </button>
        }
      >
        <form className="inline-form report-form" onSubmit={applyActivityFilters}>
          <input
            type="number"
            min="1"
            placeholder="User ID"
            value={activityFilters.user_id}
            onChange={(event) =>
              setActivityFilters((current) => ({
                ...current,
                user_id: event.target.value,
              }))
            }
          />
          <input
            type="text"
            placeholder="Module"
            value={activityFilters.module}
            onChange={(event) =>
              setActivityFilters((current) => ({
                ...current,
                module: event.target.value,
              }))
            }
          />
          <input
            type="date"
            value={activityFilters.date_from}
            onChange={(event) =>
              setActivityFilters((current) => ({
                ...current,
                date_from: event.target.value,
              }))
            }
          />
          <input
            type="date"
            value={activityFilters.date_to}
            onChange={(event) =>
              setActivityFilters((current) => ({
                ...current,
                date_to: event.target.value,
              }))
            }
          />
          <input
            type="text"
            placeholder="Search action/user"
            value={activityFilters.search}
            onChange={(event) =>
              setActivityFilters((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
          />
          <button type="submit" className="button-light" disabled={activityState.loading}>
            {activityState.loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </form>

        <AsyncState
          loading={activityState.loading}
          error={activityState.error}
          isEmpty={activityLogs.length === 0}
          loadingText="Loading activity logs..."
          emptyText="No activity logs found."
          onRetry={() => loadActivityLogs()}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log) => (
                  <tr key={log.log_id}>
                    <td>{log.log_id}</td>
                    <td>{log.user_name || log.user_id}</td>
                    <td>{log.action_performed}</td>
                    <td>{log.affected_module}</td>
                    <td>{formatDateTime(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="button-light"
              onClick={() => goToActivityPage(activityPage - 1)}
              disabled={activityState.loading || activityPage <= 1}
            >
              Previous
            </button>
            <p>
              Page {activityMeta.page || 1} of {activityMeta.total_pages || 1}
              {' '}({activityMeta.total || 0} records)
            </p>
            <button
              type="button"
              className="button-light"
              onClick={() => goToActivityPage(activityPage + 1)}
              disabled={
                activityState.loading ||
                activityPage >= Number(activityMeta.total_pages || 1)
              }
            >
              Next
            </button>
          </div>
        </AsyncState>
      </ModuleCard>

      <ModuleCard
        id="error"
        title="Error Logs Viewer"
        description="Filter by error code, affected user, module keyword, date range, and search text."
        actions={
          <button type="button" className="button-light" onClick={() => loadErrorLogs()}>
            Refresh
          </button>
        }
      >
        <form className="inline-form report-form" onSubmit={applyErrorFilters}>
          <input
            type="number"
            min="1"
            placeholder="Affected user ID"
            value={errorFilters.affected_user_id}
            onChange={(event) =>
              setErrorFilters((current) => ({
                ...current,
                affected_user_id: event.target.value,
              }))
            }
          />
          <input
            type="text"
            placeholder="Error code"
            value={errorFilters.error_code}
            onChange={(event) =>
              setErrorFilters((current) => ({
                ...current,
                error_code: event.target.value,
              }))
            }
          />
          <input
            type="text"
            placeholder="Module keyword"
            value={errorFilters.module}
            onChange={(event) =>
              setErrorFilters((current) => ({
                ...current,
                module: event.target.value,
              }))
            }
          />
          <input
            type="date"
            value={errorFilters.date_from}
            onChange={(event) =>
              setErrorFilters((current) => ({
                ...current,
                date_from: event.target.value,
              }))
            }
          />
          <input
            type="date"
            value={errorFilters.date_to}
            onChange={(event) =>
              setErrorFilters((current) => ({
                ...current,
                date_to: event.target.value,
              }))
            }
          />
          <input
            type="text"
            placeholder="Search logs"
            value={errorFilters.search}
            onChange={(event) =>
              setErrorFilters((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
          />
          <button type="submit" className="button-light" disabled={errorState.loading}>
            {errorState.loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </form>

        <AsyncState
          loading={errorState.loading}
          error={errorState.error}
          isEmpty={errorLogs.length === 0}
          loadingText="Loading error logs..."
          emptyText="No error logs found."
          onRetry={() => loadErrorLogs()}
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Code</th>
                  <th>Message</th>
                  <th>User</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {errorLogs.map((log) => (
                  <tr key={log.error_id}>
                    <td>{log.error_id}</td>
                    <td>{log.error_code}</td>
                    <td>{log.error_message}</td>
                    <td>{log.user_name || log.affected_user_id || '-'}</td>
                    <td>{formatDateTime(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="button-light"
              onClick={() => goToErrorPage(errorPage - 1)}
              disabled={errorState.loading || errorPage <= 1}
            >
              Previous
            </button>
            <p>
              Page {errorMeta.page || 1} of {errorMeta.total_pages || 1}
              {' '}({errorMeta.total || 0} records)
            </p>
            <button
              type="button"
              className="button-light"
              onClick={() => goToErrorPage(errorPage + 1)}
              disabled={
                errorState.loading ||
                errorPage >= Number(errorMeta.total_pages || 1)
              }
            >
              Next
            </button>
          </div>
        </AsyncState>
      </ModuleCard>

      <ModuleCard
        id="feedback"
        title="Feedback Audit"
        description="Audit feedback entries and toggle visibility status."
        actions={
          <button type="button" className="button-light" onClick={() => loadFeedback()}>
            Refresh
          </button>
        }
      >
        <form className="inline-form report-form" onSubmit={applyFeedbackFilters}>
          <input
            type="number"
            min="1"
            placeholder="User ID"
            value={feedbackFilters.user_id}
            onChange={(event) =>
              setFeedbackFilters((current) => ({
                ...current,
                user_id: event.target.value,
              }))
            }
          />
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
            placeholder="Search feedback"
            value={feedbackFilters.search}
            onChange={(event) =>
              setFeedbackFilters((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
          />
          <button type="submit" className="button-light" disabled={feedbackState.loading}>
            {feedbackState.loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </form>

        {feedbackActionMessage && (
          <div className="mini-feedback mini-error">
            <p>{feedbackActionMessage}</p>
          </div>
        )}

        <AsyncState
          loading={feedbackState.loading}
          error={feedbackState.error}
          isEmpty={feedbackEntries.length === 0}
          loadingText="Loading feedback audit records..."
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
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Comment</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {feedbackEntries.map((entry) => (
                  <tr key={entry.feedback_id}>
                    <td>{entry.feedback_id}</td>
                    <td>{entry.user_name || entry.user_id}</td>
                    <td>{entry.reservation_id}</td>
                    <td>{entry.rating}/5</td>
                    <td>
                      <span className={`status-pill ${statusClassName(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td>{entry.comment}</td>
                    <td>{formatDateTime(entry.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="button-light"
                        onClick={() => toggleFeedbackStatus(entry)}
                        disabled={feedbackActionPendingId === entry.feedback_id}
                      >
                        {entry.status === 'visible' ? 'Hide' : 'Show'}
                      </button>
                    </td>
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
        description="Maintain your admin profile and change your account password."
      />
    </AppShell>
  );
}

export default AdminDashboard;
