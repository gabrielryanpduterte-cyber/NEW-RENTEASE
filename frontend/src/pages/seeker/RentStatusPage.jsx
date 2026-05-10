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

function todayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
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

function paymentMethodLabel(value) {
  const labels = {
    cash: 'Paid on-site',
    gcash: 'GCash',
    bank_transfer: 'Bank Transfer',
    other: 'Other',
  };
  return labels[value] || value || '-';
}

function paymentActionLabel(status) {
  return status === 'pending_verification' ? 'Update submission' : 'I have paid';
}

export default function RentStatusPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadTarget, setUploadTarget] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofForm, setProofForm] = useState({
    amount_paid: '',
    payment_date: todayValue(),
    payment_method: 'cash',
    notes: '',
  });
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
    if (payment.payment_status === 'paid') return total;
    return total + Math.max(Number(payment.amount_due || 0) - Number(payment.amount_paid || 0), 0);
  }, 0);

  function openPaymentSubmission(payment) {
    const balance = Math.max(Number(payment.amount_due || 0) - Number(payment.amount_paid || 0), 0);
    setUploadTarget(payment);
    setProofFile(null);
    setProofForm({
      amount_paid: String(Number(payment.amount_paid || 0) > 0 ? payment.amount_paid : balance || payment.amount_due || ''),
      payment_date: payment.payment_date || todayValue(),
      payment_method: payment.payment_method || 'cash',
      notes: payment.notes || '',
    });
  }

  function closePaymentSubmission() {
    setUploadTarget(null);
    setProofFile(null);
    setProofForm({ amount_paid: '', payment_date: todayValue(), payment_method: 'cash', notes: '' });
  }

  async function submitProof(event) {
    event.preventDefault();
    if (!uploadTarget) {
      return;
    }
    if (!proofForm.amount_paid || Number(proofForm.amount_paid) <= 0) {
      showToast('Enter the amount you paid.', 'warning');
      return;
    }
    if (!proofForm.payment_date) {
      showToast('Select the date you paid.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('amount_paid', proofForm.amount_paid);
    formData.append('payment_date', proofForm.payment_date);
    formData.append('payment_method', proofForm.payment_method);
    formData.append('notes', proofForm.notes);
    if (proofFile) {
      formData.append('proof', proofFile);
    }

    setUploading(true);
    try {
      await paymentsApi.uploadProof(uploadTarget.payment_id, formData);
      showToast('Payment submitted. Awaiting owner verification.', 'success');
      setUploadTarget(null);
      setProofFile(null);
      setProofForm({ amount_paid: '', payment_date: todayValue(), payment_method: 'cash', notes: '' });
      loadPayments();
    } catch (requestError) {
      showToast(requestError?.errors?.[0] || requestError?.message || 'Unable to submit payment.', 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppShell
      title="Payments"
      subtitle="Use this page when you already paid rent and need the owner to verify it."
      quickStats={[
        { label: 'Records', value: String(payments.length), tone: 'neutral' },
        { label: 'Unpaid Balance', value: formatCurrency(unpaidBalance), tone: 'amber' },
      ]}
    >
      <section className="seeker-main-column">
        <div className={`seeker-rent-banner ${currentPayment?.payment_status === 'paid' ? 'paid' : currentPayment?.payment_status === 'pending_verification' ? 'pending' : currentPayment ? 'unpaid' : 'none'}`}>
          <Receipt size={24} />
          {currentPayment ? (
            <div>
              <h2>Rent {String(currentPayment.payment_status).replaceAll('_', ' ')} - {billingLabel(currentPayment.billing_period)}</h2>
              <p>
                {currentPayment.payment_status === 'paid'
                  ? `Paid on ${formatDate(currentPayment.payment_date)}`
                  : currentPayment.payment_status === 'pending_verification'
                    ? `Submitted ${formatCurrency(currentPayment.amount_paid)} on ${formatDate(currentPayment.payment_date)}. Waiting for owner verification.`
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
          {currentPayment && currentPayment.payment_status !== 'paid' && (
            <button type="button" className="button-primary" onClick={() => openPaymentSubmission(currentPayment)}>
              <Upload size={16} />
              {paymentActionLabel(currentPayment.payment_status)}
            </button>
          )}
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
                  <th>Method</th>
                  <th>Proof</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="re-table-empty">No payment records found.</td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.payment_id}>
                      <td>{billingLabel(payment.billing_period)}</td>
                      <td>{formatCurrency(payment.amount_due)}</td>
                      <td>{formatCurrency(payment.amount_paid)}</td>
                      <td><SeekerStatusPill status={payment.payment_status} /></td>
                      <td>{['paid', 'pending_verification'].includes(payment.payment_status) && payment.payment_date ? formatDate(payment.payment_date) : '-'}</td>
                      <td>{['paid', 'pending_verification'].includes(payment.payment_status) ? paymentMethodLabel(payment.payment_method) : '-'}</td>
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
                        ) : (
                          <span className="seeker-muted">-</span>
                        )}
                      </td>
                      <td>{payment.notes || '-'}</td>
                      <td>
                        {payment.payment_status === 'unpaid' || payment.payment_status === 'pending_verification' ? (
                          <button type="button" className="button-light" onClick={() => openPaymentSubmission(payment)}>
                            <Upload size={15} />
                            {paymentActionLabel(payment.payment_status)}
                          </button>
                        ) : (
                          <span className="seeker-muted">-</span>
                        )}
                      </td>
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
        <div className="re-modal-backdrop" role="presentation" onClick={closePaymentSubmission}>
          <section className="re-modal seeker-payment-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>Submit Payment</h2>
            <p>
              Enter what you paid. Proof and notes are optional, and the owner must verify the payment before it becomes paid.
            </p>
            <form onSubmit={submitProof} className="seeker-form-grid">
              <label>
                <span>Amount paid</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={proofForm.amount_paid}
                  onChange={(event) => setProofForm((current) => ({ ...current, amount_paid: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Date paid</span>
                <input
                  type="date"
                  value={proofForm.payment_date}
                  onChange={(event) => setProofForm((current) => ({ ...current, payment_date: event.target.value }))}
                  required
                />
              </label>
              <label className="seeker-form-wide">
                <span>Payment method</span>
                <select
                  value={proofForm.payment_method}
                  onChange={(event) => setProofForm((current) => ({ ...current, payment_method: event.target.value }))}
                >
                  <option value="cash">Paid on-site</option>
                  <option value="gcash">GCash</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <div className="seeker-form-wide">
                <FileUpload maxSizeMB={5} onFileSelect={setProofFile} label="Optional proof image or receipt" />
              </div>
              <label className="seeker-form-wide">
                <span>Payment note (optional)</span>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={proofForm.notes}
                  onChange={(event) => setProofForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Example: I paid to the owner or caretaker named..."
                />
              </label>
              <div className="mini-feedback mini-success seeker-form-wide">
                <p>Submitted payments stay pending until the owner verifies the amount, date, method, and proof.</p>
              </div>
              <div className="re-modal-actions seeker-form-wide">
                <button type="button" className="button-secondary" onClick={closePaymentSubmission} disabled={uploading}>
                  Cancel
                </button>
                <button type="submit" className="button-primary" disabled={uploading}>
                  {uploading ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}
