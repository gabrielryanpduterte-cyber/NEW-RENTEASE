import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { accountLinksApi, describeApiError } from '../api/client.js';
import { useAuth } from '../auth/useAuth.js';
import { asArray, formatDateTime, statusClassName } from '../utils/format.js';
import AsyncState from './AsyncState.jsx';
import ModuleCard from './ModuleCard.jsx';

const defaultLinksState = Object.freeze({
  loading: true,
  error: null,
  items: [],
});

function LinkAccountsCard({
  id = 'connections',
  title = 'Linked Accounts',
  description = 'Connect parent and seeker accounts to enable parent monitoring access.',
  onLinksChange = null,
}) {
  const { authState } = useAuth();
  const role = authState.user?.role;
  const isSupportedRole = role === 'parent' || role === 'seeker';

  const [linksState, setLinksState] = useState(defaultLinksState);
  const [requestForm, setRequestForm] = useState({
    target_email: '',
    notes: '',
  });
  const [requestSubmit, setRequestSubmit] = useState({
    pending: false,
    success: '',
    error: '',
  });
  const [actionPendingId, setActionPendingId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState('');

  const links = linksState.items;

  const approvedCount = useMemo(
    () => links.filter((item) => item.status === 'approved').length,
    [links],
  );

  const targetRoleLabel = role === 'parent' ? 'seeker' : 'parent';

  async function loadLinks() {
    setLinksState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const payload = await accountLinksApi.list();
      const items = asArray(payload.data);

      setLinksState({
        loading: false,
        error: null,
        items,
      });
      onLinksChange?.(items);
    } catch (error) {
      setLinksState({
        loading: false,
        error,
        items: [],
      });
      onLinksChange?.([]);
    }
  }

  async function submitLinkRequest(event) {
    event.preventDefault();
    setRequestSubmit({
      pending: true,
      success: '',
      error: '',
    });

    if (requestForm.target_email.trim() === '') {
      setRequestSubmit({
        pending: false,
        success: '',
        error: 'target_email is required.',
      });
      return;
    }

    try {
      await accountLinksApi.create({
        target_email: requestForm.target_email,
        notes: requestForm.notes,
      });

      setRequestForm({
        target_email: '',
        notes: '',
      });
      setRequestSubmit({
        pending: false,
        success: 'Link request submitted successfully.',
        error: '',
      });
      loadLinks();
    } catch (error) {
      setRequestSubmit({
        pending: false,
        success: '',
        error: error?.errors?.[0] || describeApiError(error),
      });
    }
  }

  async function updateLinkStatus(link, status) {
    setActionPendingId(link.link_id);
    setActionFeedback('');

    try {
      await accountLinksApi.update(link.link_id, { status });
      loadLinks();
    } catch (error) {
      setActionFeedback(error?.errors?.[0] || describeApiError(error));
    } finally {
      setActionPendingId(null);
    }
  }

  async function removeLink(linkId) {
    setActionPendingId(linkId);
    setActionFeedback('');

    try {
      await accountLinksApi.remove(linkId);
      loadLinks();
    } catch (error) {
      setActionFeedback(error?.errors?.[0] || describeApiError(error));
    } finally {
      setActionPendingId(null);
    }
  }

  const loadInitialData = useEffectEvent(() => {
    if (isSupportedRole) {
      loadLinks();
    }
  });

  useEffect(() => {
    queueMicrotask(() => {
      loadInitialData();
    });
  }, [isSupportedRole]);

  if (!isSupportedRole) {
    return null;
  }

  return (
    <ModuleCard
      id={id}
      title={title}
      description={description}
      actions={
        <button type="button" className="button-light" onClick={loadLinks}>
          Refresh
        </button>
      }
    >
      <div className="info-block">
        <p>
          <strong>Role:</strong> {role}
        </p>
        <p>
          <strong>Approved links:</strong> {approvedCount}
        </p>
        <p>
          <strong>Rule:</strong> Parent monitoring data is available only after an approved parent-seeker link.
        </p>
      </div>

      <form className="inline-form connection-form" onSubmit={submitLinkRequest}>
        <input
          type="email"
          placeholder={`Target ${targetRoleLabel} email`}
          value={requestForm.target_email}
          onChange={(event) =>
            setRequestForm((current) => ({
              ...current,
              target_email: event.target.value,
            }))
          }
          required
        />
        <input
          type="text"
          placeholder="Notes (optional)"
          value={requestForm.notes}
          onChange={(event) =>
            setRequestForm((current) => ({
              ...current,
              notes: event.target.value,
            }))
          }
        />
        <button type="submit" className="button-light" disabled={requestSubmit.pending}>
          {requestSubmit.pending ? 'Sending...' : 'Send Link Request'}
        </button>
      </form>

      {requestSubmit.error && (
        <div className="mini-feedback mini-error">
          <p>{requestSubmit.error}</p>
        </div>
      )}
      {requestSubmit.success && (
        <div className="mini-feedback mini-success">
          <p>{requestSubmit.success}</p>
        </div>
      )}
      {actionFeedback && (
        <div className="mini-feedback mini-error">
          <p>{actionFeedback}</p>
        </div>
      )}

      <AsyncState
        loading={linksState.loading}
        error={linksState.error}
        isEmpty={links.length === 0}
        loadingText="Loading account links..."
        emptyText="No account links yet. Send a link request to start."
        onRetry={loadLinks}
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Counterpart</th>
                <th>Requested By</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const counterpartName = role === 'parent' ? link.seeker_name : link.parent_name;
                const counterpartEmail = role === 'parent' ? link.seeker_email : link.parent_email;
                const pending = link.status === 'pending';
                const isRequester = link.requested_by === role;
                const canApprove = pending && !isRequester;
                const canCancel = pending && isRequester;
                const canUnlink = link.status === 'approved';

                return (
                  <tr key={link.link_id}>
                    <td>{link.link_id}</td>
                    <td>
                      <div className="table-contact">
                        <strong>{counterpartName || '-'}</strong>
                        <span>{counterpartEmail || '-'}</span>
                      </div>
                    </td>
                    <td>{link.requested_by}</td>
                    <td>
                      <span className={`status-pill ${statusClassName(link.status)}`}>
                        {link.status}
                      </span>
                    </td>
                    <td>{formatDateTime(link.requested_at)}</td>
                    <td className="row-actions">
                      {canApprove && (
                        <button
                          type="button"
                          className="button-light"
                          onClick={() => updateLinkStatus(link, 'approved')}
                          disabled={actionPendingId === link.link_id}
                        >
                          Approve
                        </button>
                      )}
                      {canApprove && (
                        <button
                          type="button"
                          className="button-light danger"
                          onClick={() => updateLinkStatus(link, 'rejected')}
                          disabled={actionPendingId === link.link_id}
                        >
                          Reject
                        </button>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          className="button-light danger"
                          onClick={() => updateLinkStatus(link, 'cancelled')}
                          disabled={actionPendingId === link.link_id}
                        >
                          Cancel
                        </button>
                      )}
                      {canUnlink && (
                        <button
                          type="button"
                          className="button-light danger"
                          onClick={() => removeLink(link.link_id)}
                          disabled={actionPendingId === link.link_id}
                        >
                          Unlink
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AsyncState>
    </ModuleCard>
  );
}

export default LinkAccountsCard;
