import { useEffect, useMemo, useState } from 'react';
import { Copy, Link2, RotateCcw, ShieldOff, UserRoundPlus, Users } from 'lucide-react';
import { guardianLinksApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import { ConfirmModal, EmptyState, LoadingSkeleton, SeekerStatusPill } from '../../components/seeker/SeekerShared.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime } from '../../utils/format.js';

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'G';
}

function relativeAccess(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDateTime(value);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export default function GuardianAccessPage() {
  const { showToast } = useToast();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ guardian_name: '', guardian_email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);

  async function loadLinks() {
    setLoading(true);
    setError('');
    try {
      const payload = await guardianLinksApi.list();
      setLinks(Array.isArray(payload.data) ? payload.data : []);
    } catch (requestError) {
      setError(requestError?.errors?.[0] || requestError?.message || 'Unable to load guardian links.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadLinks();
    });
  }, []);

  const activeCount = useMemo(
    () => links.filter((link) => link.status === 'active').length,
    [links],
  );
  const limitReached = activeCount >= 5;

  function buildLink(token) {
    return `${window.location.origin}/guardian-view/${token}`;
  }

  async function submitGuardian(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await guardianLinksApi.create(form);
      setForm({ guardian_name: '', guardian_email: '' });
      showToast('Guardian access link generated.', 'success');
      loadLinks();
    } catch (requestError) {
      showToast(requestError?.errors?.[0] || requestError?.message || 'Unable to generate link.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink(link) {
    const url = buildLink(link.access_token);
    try {
      await navigator.clipboard.writeText(url);
      showToast('Access link copied.', 'success');
    } catch {
      showToast(url, 'info');
    }
  }

  async function confirmRevoke() {
    if (!revokeTarget) return;

    setRevoking(true);
    try {
      await guardianLinksApi.revoke(revokeTarget.id || revokeTarget.guardian_link_id);
      showToast('Guardian access revoked.', 'success');
      setRevokeTarget(null);
      loadLinks();
    } catch (requestError) {
      showToast(requestError?.errors?.[0] || requestError?.message || 'Unable to revoke access.', 'error');
    } finally {
      setRevoking(false);
    }
  }

  return (
    <AppShell title="Guardian Access" subtitle="Generate tokenized read-only access for a parent or guardian.">
      <section className="seeker-main-column">
        <article className="seeker-form-card">
          <div className="seeker-card-head">
            <UserRoundPlus size={20} />
            <h2>Add Guardian</h2>
          </div>
          <p className="seeker-muted">
            Allow a parent or guardian to view your room and rent status without creating an account.
          </p>
          <form onSubmit={submitGuardian} className="seeker-form-grid">
            <label>
              <span>Guardian Name</span>
              <input
                type="text"
                value={form.guardian_name}
                maxLength={100}
                onChange={(event) => setForm((current) => ({ ...current, guardian_name: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Guardian Email</span>
              <input
                type="email"
                value={form.guardian_email}
                maxLength={150}
                onChange={(event) => setForm((current) => ({ ...current, guardian_email: event.target.value }))}
                required
              />
            </label>
            <div className="seeker-form-actions seeker-form-wide">
              <button type="submit" className="button-primary" disabled={submitting || limitReached}>
                {submitting ? 'Generating...' : 'Generate Access Link'}
              </button>
              <button type="button" className="button-light" onClick={loadLinks}>
                <RotateCcw size={16} />
                Refresh
              </button>
            </div>
          </form>
          {limitReached && <p className="seeker-limit-note">Maximum of 5 active guardians reached.</p>}
        </article>

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : error ? (
          <div className="re-error-panel">{error}</div>
        ) : links.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No guardians linked yet."
            description="Generated links will appear here for copying and revoking."
          />
        ) : (
          <div className="guardian-list">
            {links.map((link) => {
              const url = buildLink(link.access_token);
              return (
                <article className="guardian-row" key={link.id || link.guardian_link_id}>
                  <div className="guardian-avatar">{initials(link.guardian_name)}</div>
                  <div className="guardian-main">
                    <div className="guardian-title-row">
                      <div>
                        <h3>{link.guardian_name}</h3>
                        <p>{link.guardian_email}</p>
                      </div>
                      <SeekerStatusPill status={link.status} />
                    </div>
                    <p className="guardian-access-time">Last accessed: {relativeAccess(link.last_accessed_at)}</p>
                    <div className="guardian-link-row">
                      <Link2 size={16} />
                      <input type="text" value={url} readOnly />
                      <button type="button" className="button-light" onClick={() => copyLink(link)}>
                        <Copy size={15} />
                        Copy Link
                      </button>
                      {link.status === 'active' && (
                        <button type="button" className="button-light danger" onClick={() => setRevokeTarget(link)}>
                          <ShieldOff size={15} />
                          Revoke Access
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {revokeTarget && (
        <ConfirmModal
          title={`Revoke access for ${revokeTarget.guardian_name}?`}
          body="They will no longer be able to view your information."
          confirmLabel="Revoke Access"
          confirmVariant="danger"
          onConfirm={confirmRevoke}
          onCancel={() => setRevokeTarget(null)}
          isLoading={revoking}
        />
      )}
    </AppShell>
  );
}
