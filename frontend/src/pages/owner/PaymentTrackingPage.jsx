import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarPlus, FileCheck2, Printer } from 'lucide-react';
import { billingApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import AsyncState from '../../components/AsyncState.jsx';
import ModuleCard from '../../components/ModuleCard.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, statusClassName } from '../../utils/format.js';

function currentMonthValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function todayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function PaymentTrackingPage() {
  const { showToast } = useToast();
  const [month, setMonth] = useState(currentMonthValue());
  const [search, setSearch] = useState('');
  const [state, setState] = useState({ loading: true, error: null, items: [], summary: {} });
  const [generateOpen, setGenerateOpen] = useState(false);
  const [previewState, setPreviewState] = useState({ loading: false, data: null });
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: todayValue(),
    amount_paid: '',
    payment_method: 'cash',
    notes: '',
  });
  const [savingPayment, setSavingPayment] = useState(false);

  const loadBilling = useCallback(async (nextMonth = month) => {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const payload = await billingApi.list({ month: nextMonth });
      setState({
        loading: false,
        error: null,
        items: Array.isArray(payload.data?.items) ? payload.data.items : [],
        summary: payload.data?.summary || {},
      });
    } catch (error) {
      setState({ loading: false, error, items: [], summary: {} });
    }
  }, [month]);

  useEffect(() => {
    queueMicrotask(() => {
      loadBilling(month);
    });
  }, [loadBilling, month]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return state.items;
    }
    return state.items.filter((row) => String(row.tenant_name || '').toLowerCase().includes(term));
  }, [search, state.items]);

  function openPaymentModal(row) {
    setSelectedCycle(row);
    setPaymentForm({
      payment_date: todayValue(),
      amount_paid: String(row.amount_due || ''),
      payment_method: 'cash',
      notes: '',
    });
  }

  async function submitPayment(event) {
    event.preventDefault();
    if (!selectedCycle?.billing_cycle_id) {
      showToast('Generate a billing cycle before recording payment.', 'warning');
      return;
    }

    setSavingPayment(true);
    try {
      await billingApi.markPaid(selectedCycle.billing_cycle_id, {
        payment_date: paymentForm.payment_date,
        amount_paid: Number(paymentForm.amount_paid),
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes,
      });
      showToast('Payment recorded.', 'success');
      setSelectedCycle(null);
      await loadBilling(month);
    } catch (error) {
      showToast(error?.errors?.[0] || error?.message || 'Unable to record payment.', 'error');
    } finally {
      setSavingPayment(false);
    }
  }

  async function reversePayment(row) {
    if (!row.payment_id) {
      return;
    }
    try {
      await billingApi.markUnpaid(row.payment_id, 'Owner reversed payment from rent tracking.');
      showToast('Payment reversed.', 'success');
      await loadBilling(month);
    } catch (error) {
      showToast(error?.errors?.[0] || error?.message || 'Unable to reverse payment.', 'error');
    }
  }

  async function previewBills() {
    setPreviewState({ loading: true, data: null });
    try {
      const payload = await billingApi.preview(month);
      setPreviewState({ loading: false, data: payload.data || null });
    } catch (error) {
      setPreviewState({ loading: false, data: null });
      showToast(error?.errors?.[0] || error?.message || 'Unable to preview billing.', 'error');
    }
  }

  async function generateBills() {
    try {
      const payload = await billingApi.generate(month);
      showToast(
        `Generated ${payload.data?.created_count || 0} bill(s), skipped ${payload.data?.skipped_count || 0}.`,
        'success',
      );
      setGenerateOpen(false);
      setPreviewState({ loading: false, data: null });
      await loadBilling(month);
    } catch (error) {
      showToast(error?.errors?.[0] || error?.message || 'Unable to generate bills.', 'error');
    }
  }

  return (
    <AppShell
      title="Rent Tracking"
      subtitle="Generate monthly bills, verify proof badges, and record owner-confirmed payments."
      quickStats={[
        { label: 'Paid', value: String(state.summary.paid_count || 0), tone: 'mint' },
        { label: 'Unpaid', value: String(state.summary.unpaid_count || 0), tone: 'amber' },
        { label: 'No Record', value: String(state.summary.no_record_count || 0), tone: 'neutral' },
        { label: 'Collected', value: formatCurrency(state.summary.total_collected || 0), tone: 'mint' },
      ]}
    >
      <ModuleCard
        id="rent-tracking-table"
        title="Billing Records"
        description={`${formatCurrency(state.summary.total_billed || 0)} billed for ${month}.`}
        actions={
          <button type="button" className="btn-secondary" onClick={() => setGenerateOpen(true)}>
            <CalendarPlus size={16} /> Generate Bills
          </button>
        }
      >
        <div className="owner-toolbar">
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tenant"
          />
          <button type="button" className="button-light" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
        </div>

        <AsyncState
          loading={state.loading}
          error={state.error}
          isEmpty={filteredRows.length === 0}
          loadingText="Loading rent records..."
          emptyText="No billing records found."
          onRetry={() => loadBilling(month)}
        >
          <div className="table-wrap print-full-width">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Room</th>
                  <th>Billing</th>
                  <th>Amount Due</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Proof</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={`${row.reservation_id}-${row.billing_cycle_id || 'no-record'}`}>
                    <td>{row.tenant_name}</td>
                    <td>Room {row.room_number}</td>
                    <td>{row.billing_month}</td>
                    <td>{formatCurrency(row.amount_due)}</td>
                    <td>{formatCurrency(row.amount_paid)}</td>
                    <td>
                      <span className={`status-pill ${statusClassName(row.payment_status)}`}>
                        {row.payment_status}
                      </span>
                    </td>
                    <td>{row.payment_method || '-'}</td>
                    <td>
                      {row.proof_url ? (
                        <button type="button" className="button-light" onClick={() => window.open(row.proof_url, '_blank', 'noopener,noreferrer')}>
                          <FileCheck2 size={15} />
                        </button>
                      ) : '-'}
                    </td>
                    <td className="row-actions">
                      {row.payment_status === 'paid' ? (
                        <button type="button" className="button-light" onClick={() => reversePayment(row)} disabled={month !== currentMonthValue()}>
                          Reverse
                        </button>
                      ) : (
                        <button type="button" className="button-light" onClick={() => openPaymentModal(row)} disabled={!row.billing_cycle_id}>
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </ModuleCard>

      {generateOpen && (
        <div className="modal-overlay" onClick={() => setGenerateOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Generate Bills for {month}</h2>
              <button type="button" className="modal-close" onClick={() => setGenerateOpen(false)}>×</button>
            </div>
            <div className="form-group">
              <label>Billing month</label>
              <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={previewBills} disabled={previewState.loading}>
                {previewState.loading ? 'Previewing...' : 'Preview'}
              </button>
              <button type="button" className="btn-primary" onClick={generateBills} disabled={!previewState.data}>
                Generate Bills
              </button>
            </div>
            {previewState.data && (
              <div className="generate-preview">
                <h3>{previewState.data.will_create?.length || 0} tenant(s) will receive a bill</h3>
                {(previewState.data.will_create || []).map((item) => (
                  <div key={`new-${item.reservation_id}`}><span>{item.tenant_name} · Room {item.room_number}</span><strong>{formatCurrency(item.amount_due)}</strong></div>
                ))}
                <h3>{previewState.data.already_exists?.length || 0} tenant(s) already have a bill</h3>
                {(previewState.data.already_exists || []).map((item) => (
                  <div key={`skip-${item.reservation_id}`}><span>{item.tenant_name} · Room {item.room_number}</span><strong>Skip</strong></div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCycle && (
        <div className="modal-overlay" onClick={() => setSelectedCycle(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Payment - {selectedCycle.tenant_name}</h2>
              <button type="button" className="modal-close" onClick={() => setSelectedCycle(null)}>×</button>
            </div>
            <form onSubmit={submitPayment}>
              <div className="mini-feedback mini-success">
                <p>Room {selectedCycle.room_number} · Billing {selectedCycle.billing_month}</p>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Payment date</label>
                  <input type="date" value={paymentForm.payment_date} onChange={(event) => setPaymentForm((current) => ({ ...current, payment_date: event.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Amount paid</label>
                  <input type="number" min="0" step="0.01" value={paymentForm.amount_paid} onChange={(event) => setPaymentForm((current) => ({ ...current, amount_paid: event.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Payment method</label>
                <select value={paymentForm.payment_method} onChange={(event) => setPaymentForm((current) => ({ ...current, payment_method: event.target.value }))}>
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={paymentForm.notes} onChange={(event) => setPaymentForm((current) => ({ ...current, notes: event.target.value }))} rows={3} maxLength={300} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={savingPayment}>
                  {savingPayment ? 'Recording...' : 'Confirm Payment'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setSelectedCycle(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
