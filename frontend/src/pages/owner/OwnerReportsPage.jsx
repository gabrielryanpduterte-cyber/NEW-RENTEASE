import { useCallback, useEffect, useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { reportsApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import AsyncState from '../../components/AsyncState.jsx';
import ModuleCard from '../../components/ModuleCard.jsx';
import { formatCurrency } from '../../utils/format.js';

const TABS = ['income', 'occupancy', 'reservations'];

function defaultFromMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() - 11);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

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

export default function OwnerReportsPage() {
  const [tab, setTab] = useState('income');
  const [filters, setFilters] = useState({
    from: defaultFromMonth(),
    to: currentMonthValue(),
  });
  const [state, setState] = useState({ loading: true, error: null, data: null });

  const loadReports = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const payload = await reportsApi.get({
        date_from: monthStart(filters.from),
        date_to: monthEnd(filters.to),
      });
      setState({ loading: false, error: null, data: payload.data || null });
    } catch (error) {
      setState({ loading: false, error, data: null });
    }
  }, [filters]);

  useEffect(() => {
    queueMicrotask(() => {
      loadReports();
    });
  }, [loadReports]);

  const incomeRows = useMemo(() => state.data?.monthly_income?.rows || [], [state.data]);
  const incomeSummary = state.data?.monthly_income?.summary || {};
  const occupancy = state.data?.occupancy || {};
  const reservationStats = state.data?.reservation_stats || {};
  const maxIncome = useMemo(
    () => Math.max(...incomeRows.map((row) => Number(row.total_due || 0)), 1),
    [incomeRows],
  );

  return (
    <AppShell
      title="Owner Reports"
      subtitle="Income, occupancy, and reservation performance for your boarding house."
      quickStats={[
        { label: 'Total Billed', value: formatCurrency(incomeSummary.total_due || 0), tone: 'neutral' },
        { label: 'Collected', value: formatCurrency(incomeSummary.total_collected || 0), tone: 'mint' },
        { label: 'Occupancy', value: `${Number(occupancy.occupancy_rate_percent || 0).toFixed(1)}%`, tone: 'amber' },
        { label: 'Reservations', value: String(reservationStats.total || 0), tone: 'neutral' },
      ]}
    >
      <ModuleCard
        id="owner-reports"
        title="Reports"
        description="Use month filters for printable report views."
        actions={
          <button type="button" className="button-light" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
        }
      >
        <div className="owner-toolbar filter-toolbar">
          <div className="filter-tabs tab-row">
            {TABS.map((item) => (
              <button type="button" key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>
                {item}
              </button>
            ))}
          </div>
          <input type="month" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
          <input type="month" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
          <button type="button" className="button-light" onClick={loadReports}>Load Report</button>
        </div>

        <AsyncState
          loading={state.loading}
          error={state.error}
          isEmpty={!state.data}
          loadingText="Loading reports..."
          emptyText="No report data available."
          onRetry={loadReports}
        >
          {tab === 'income' && (
            <section className="report-section print-full-width">
              <h2>RentEase - Income Report - {filters.from} to {filters.to}</h2>
              <div className="report-grid">
                <div className="report-stat"><p>Billed</p><h4>{formatCurrency(incomeSummary.total_due || 0)}</h4></div>
                <div className="report-stat"><p>Collected</p><h4>{formatCurrency(incomeSummary.total_collected || 0)}</h4></div>
                <div className="report-stat"><p>Outstanding</p><h4>{formatCurrency(incomeSummary.total_outstanding || 0)}</h4></div>
                <div className="report-stat"><p>Rate</p><h4>{Number(incomeSummary.collection_rate || 0).toFixed(1)}%</h4></div>
              </div>
              <div className="owner-bar-chart">
                {incomeRows.map((row) => (
                  <div className="owner-bar-group" key={row.month}>
                    <div className="owner-bars">
                      <span className="owner-bar-billed" style={{ height: `${Math.max((Number(row.total_due || 0) / maxIncome) * 100, 3)}%` }} />
                      <span className="owner-bar-collected" style={{ height: `${Math.max((Number(row.total_collected || 0) / maxIncome) * 100, 3)}%` }} />
                    </div>
                    <small>{row.month}</small>
                  </div>
                ))}
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Tenants</th>
                      <th>Billed</th>
                      <th>Collected</th>
                      <th>Outstanding</th>
                      <th>Collection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeRows.map((row) => (
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
            </section>
          )}

          {tab === 'occupancy' && (
            <section className="report-section">
              <h2>Occupancy Report</h2>
              <div className="occupancy-strip">
                <div><strong>{occupancy.available_rooms || 0}</strong><span>Available</span></div>
                <div><strong>{occupancy.occupied_rooms || 0}</strong><span>Occupied</span></div>
                <div><strong>{occupancy.archived_rooms || 0}</strong><span>Archived</span></div>
                <div><strong>{Number(occupancy.occupancy_rate_percent || 0).toFixed(1)}%</strong><span>Rate</span></div>
              </div>
            </section>
          )}

          {tab === 'reservations' && (
            <section className="report-section">
              <h2>Reservation Statistics</h2>
              <div className="report-grid">
                <div className="report-stat"><p>Pending</p><h4>{reservationStats.pending || 0}</h4></div>
                <div className="report-stat"><p>Approved</p><h4>{reservationStats.approved || 0}</h4></div>
                <div className="report-stat"><p>Rejected</p><h4>{reservationStats.rejected || 0}</h4></div>
                <div className="report-stat"><p>Cancelled</p><h4>{reservationStats.cancelled || 0}</h4></div>
              </div>
            </section>
          )}
        </AsyncState>
      </ModuleCard>
    </AppShell>
  );
}
