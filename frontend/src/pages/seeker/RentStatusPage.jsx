import { useEffect, useMemo, useState } from 'react';
import { FileText, Receipt, RotateCcw, Upload } from 'lucide-react';
import { paymentsApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import { FileUpload, LoadingSkeleton, SeekerStatusPill } from '../../components/seeker/SeekerShared.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

function currentBillingPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function billingLabel(value) {
  if (!value) {
    return 'Current month';
  }

  const [year, month] = String(value).split('-').map(Number);
  if (!year || !month) {
    return value;
  }

  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

export default function RentStatusPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadTarget, setUploadTarget] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function loadPayments() {
    setLoading(true);
    setError('');
    try {
      const payload = await paymentsApi.list();
      setPayments(Array.isArray(payload.data) ? payload.data : []);
    } catch (requestError) {
      setError(requestError?.errors?.[0] || requestError?.message || 'Unable to load payment records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadPayments();
    });
  }, []);

  const period = useMemo(() => currentBillingPeriod(), []);
  const currentPayment = useMemo(
    () => payments.find((payment) => payment.billing_period === period) || null,
    [payments, period],
  );

  const unpaidBalance = payments.reduce((total, payment) => {
    if (payment.payment_status !== 'unpaid') return total;
    return total + Math.max(Number(payment.amount_due || 0) - Number(payment.amount_paid || 0), 0);
  }, 0);

  async function submitProof(event) {
    event.preventDefault();
    if (!uploadTarget || !proofFile) {
      showToast('Select a proof file first.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('proof', proofFile);

    setUploading(true);
    try {
      await paymentsApi.uploadProof(uploadTarget.payment_id, formData);
      showToast('Proof uploaded. Awaiting landlord confirmation.', 'success');
      setUploadTarget(null);
      setProofFile(null);
      loadPayments();
    } catch (requestError) {
      showToast(requestError?.errors?.[0] || requestError?.message || 'Unable to upload proof.', 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppShell
      title="Rent Status"
      subtitle="Monitor monthly rent records and upload proof for unpaid entries."
      quickStats={[
        { label: 'Records', value: String(payments.length), tone: 'neutral' },
        { label: 'Unpaid Balance', value: formatCurrency(unpaidBalance), tone: 'amber' },
      ]}
    >
      <section className="seeker-main-column">
        <div className={`seeker-rent-banner ${currentPayment?.payment_status === 'paid' ? 'paid' : currentPayment ? 'unpaid' : 'none'}`}>
          <Receipt size={24} />
          {currentPayment ? (
            <div>
              <h2>Rent {currentPayment.payment_status} - {billingLabel(currentPayment.billing_period)}</h2>
              <p>
                {currentPayment.payment_status === 'paid'
                  ? `Paid on ${formatDate(currentPayment.payment_date)}`
                  : `${formatCurrency(Math.max(Number(currentPayment.amount_due || 0) - Number(currentPayment.amount_paid || 0), 0))} due`}
              </p>
            </div>
          ) : (
            <div>
              <h2>No rent record for {billingLabel(period)}</h2>
              <p>Payment records are added and confirmed by your landlord.</p>
            </div>
          )}
        </div>

        <div className="seeker-page-actions">
          <button type="button" className="button-light" onClick={loadPayments}>
            <RotateCcw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : error ? (
          <div className="re-error-panel">{error}</div>
        ) : (
          <div className="re-table-wrap">
            <table className="re-data-table">
              <thead>
                <tr>
                  <th>Billing Period</th>
                  <th>Amount Due</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                  <th>Date Paid</th>
                  <th>Proof</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="re-table-empty">No payment records found.</td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.payment_id}>
                      <td>{billingLabel(payment.billing_period)}</td>
                      <td>{formatCurrency(payment.amount_due)}</td>
                      <td>{formatCurrency(payment.amount_paid)}</td>
                      <td><SeekerStatusPill status={payment.payment_status} /></td>
                      <td>{payment.payment_status === 'paid' ? formatDate(payment.payment_date) : '-'}</td>
                      <td>
                        {payment.proof_uploaded ? (
                          <a
                            className="button-light"
                            href={paymentsApi.proofUrl(payment.payment_id)}
                            target="_blank"
                            rel="noreferrer"
                            title="Open proof"
                          >
                            <FileText size={15} />
                            Proof
                          </a>
                        ) : payment.payment_status === 'unpaid' ? (
                          <button type="button" className="button-light" onClick={() => setUploadTarget(payment)}>
                            <Upload size={15} />
                            Upload
                          </button>
                        ) : (
                          <span className="seeker-muted">-</span>
                        )}
                      </td>
                      <td>{payment.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="seeker-muted">Payment confirmation is managed by the landlord.</p>
      </section>

      {uploadTarget && (
        <div className="re-modal-backdrop" role="presentation" onClick={() => setUploadTarget(null)}>
          <section className="re-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>Upload Payment Proof</h2>
            <p>
              Upload a screenshot or receipt as reference for your landlord. This does not automatically update your payment status.
            </p>
            <form onSubmit={submitProof} className="seeker-form-grid">
              <div className="seeker-form-wide">
                <FileUpload accept="image/*,.pdf" maxSizeMB={5} onFileSelect={setProofFile} label="Choose payment proof" />
              </div>
              <div className="re-modal-actions seeker-form-wide">
                <button type="button" className="button-secondary" onClick={() => setUploadTarget(null)} disabled={uploading}>
                  Cancel
                </button>
                <button type="submit" className="button-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Submit Proof'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}
