import { useState, useEffect } from 'react';
import { paymentsApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import { formatCurrency, formatDate, statusClassName } from '../../utils/format.js';

function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    setLoading(true);
    try {
      const res = await paymentsApi.list();
      setPayments(res.data || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalDue = payments.reduce((sum, p) => sum + (parseFloat(p.amount_due) || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0);
  const unpaidBalance = payments.reduce((sum, p) => {
    if (p.payment_status === 'unpaid') {
      return sum + Math.max((parseFloat(p.amount_due) || 0) - (parseFloat(p.amount_paid) || 0), 0);
    }
    return sum;
  }, 0);

  return (
    <AppShell
      title="Payments"
      subtitle="Monitor your rent payment status and history"
      quickStats={[
        { label: 'Total Due', value: formatCurrency(totalDue), tone: 'neutral' },
        { label: 'Total Paid', value: formatCurrency(totalPaid), tone: 'mint' },
        { label: 'Unpaid Balance', value: formatCurrency(unpaidBalance), tone: 'amber' },
      ]}
    >
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
            Payment History
          </h3>
          <button className="button-light" onClick={loadPayments}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '2rem' }}>
            Loading payment records...
          </p>
        ) : payments.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '2rem' }}>
            No payment records found.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Billing Period</th>
                  <th>Amount Due</th>
                  <th>Amount Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => {
                  const due = parseFloat(payment.amount_due) || 0;
                  const paid = parseFloat(payment.amount_paid) || 0;
                  const balance = Math.max(due - paid, 0);

                  return (
                    <tr key={payment.payment_id}>
                      <td style={{ fontWeight: '600' }}>#{payment.payment_id}</td>
                      <td>{payment.billing_period}</td>
                      <td>{formatCurrency(due)}</td>
                      <td style={{ color: paid > 0 ? '#10b981' : 'inherit' }}>
                        {formatCurrency(paid)}
                      </td>
                      <td style={{ color: balance > 0 ? '#f59e0b' : '#10b981', fontWeight: '600' }}>
                        {formatCurrency(balance)}
                      </td>
                      <td>
                        <span className={`status-pill ${statusClassName(payment.payment_status)}`}>
                          {payment.payment_status}
                        </span>
                      </td>
                      <td>{formatDate(payment.payment_date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Info */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          Payment Information
        </h3>
        <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--muted-foreground)' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            💡 <strong>Note:</strong> Payments are recorded by the boarding house owner.
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            📅 Payment records show your monthly rent billing and payment history.
          </p>
          <p>
            ⚠️ If you have any questions about your payments, please contact your boarding house owner.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

export default PaymentsPage;
