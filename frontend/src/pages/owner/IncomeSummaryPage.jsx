import { useCallback, useEffect, useMemo, useState } from 'react';
import { reportsApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import AsyncState from '../../components/AsyncState.jsx';
import ModuleCard from '../../components/ModuleCard.jsx';
import { formatCurrency } from '../../utils/format.js';

function monthStart(month) {
  return `${month}-01`;
}

function currentMonthValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthEnd(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const day = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(day).padStart(2, '0')}`;
}

export default function IncomeSummaryPage() {
  const [month, setMonth] = useState(currentMonthValue());
  const [state, setState] = useState({ loading: true, error: null, data: null });

  const loadIncome = useCallback(async (nextMonth = month) => {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const payload = await reportsApi.get({
        date_from: monthStart(nextMonth),
        date_to: monthEnd(nextMonth),
      });
      setState({ loading: false, error: null, data: payload.data || null });
    } catch (error) {
      setState({ loading: false, error, data: null });
    }
  }, [month]);

  useEffect(() => {
    queueMicrotask(() => {
      loadIncome(month);
    });
  }, [loadIncome, month]);

  const rows = useMemo(() => state.data?.monthly_income?.rows || [], [state.data]);
  const summary = state.data?.monthly_income?.summary || {};
  const maxValue = useMemo(
    () => Math.max(...rows.map((row) => Number(row.total_due || 0)), 1),
    [rows],
  );

  return (
    <AppShell
      title="Income Summary"
      subtitle="Expected rent, collected rent, outstanding balance, and monthly collection rate."
      quickStats={[
        { label: 'Billed', value: formatCurrency(summary.total_due || 0), tone: 'neutral' },
        { label: 'Collected', value: formatCurrency(summary.total_collected || 0), tone: 'mint' },
        { label: 'Outstanding', value: formatCurrency(summary.total_outstanding || 0), tone: 'amber' },
        { label: 'Collection Rate', value: `${Number(summary.collection_rate || 0).toFixed(1)}%`, tone: 'mint' },
      ]}
    >
      <ModuleCard
        id="income-summary"
        title="Monthly Income"
        description="Income is derived from billing cycles when available, then falls back to legacy payments."
      >
        <div className="owner-toolbar">
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          <button type="button" className="button-light" onClick={() => loadIncome(month)}>
            Refresh
          </button>
        </div>
        <AsyncState
          loading={state.loading}
          error={state.error}
          isEmpty={rows.length === 0}
          loadingText="Loading income summary..."
          emptyText="No income records found for this month."
          onRetry={() => loadIncome(month)}
        >
          <div className="monthly-bars income-bars">
            {rows.map((row) => {
              const billedHeight = Math.max((Number(row.total_due || 0) / maxValue) * 100, 4);
              const collectedHeight = Math.max((Number(row.total_collected || 0) / maxValue) * 100, 4);
              return (
                <div className="month-bar" key={row.month}>
                  <div className="bar-container">
                    <div className="bar" style={{ height: `${billedHeight}%` }}>
                      <div className="bar-paid" style={{ height: `${collectedHeight}%` }} />
                    </div>
                  </div>
                  <span className="month-label">{row.month}</span>
                  <span className="amount-label">{formatCurrency(row.total_collected)}</span>
                </div>
              );
            })}
          </div>

          <div className="income-details">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Bills</th>
                  <th>Billed</th>
                  <th>Collected</th>
                  <th>Outstanding</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{row.tenant_count || row.payments_count || 0}</td>
                    <td>{formatCurrency(row.total_due)}</td>
                    <td>{formatCurrency(row.total_collected)}</td>
                    <td>{formatCurrency(row.total_outstanding || Math.max(row.total_due - row.total_collected, 0))}</td>
                    <td>{Number(row.collection_rate || 0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </ModuleCard>
    </AppShell>
  );
}
