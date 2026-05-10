import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, CircleCheck, Link2Off, MapPin, Phone, Receipt, TriangleAlert } from 'lucide-react';
import { guardianLinksApi } from '../api/client.js';
import { LoadingSkeleton, SeekerStatusPill } from '../components/seeker/SeekerShared.jsx';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format.js';

function currentMonthLabel() {
  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(new Date());
}

export default function GuardianViewPage() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    async function loadGuardianView() {
      setState({ loading: true, error: '', data: null });
      try {
        const payload = await guardianLinksApi.publicView(token);
        setState({ loading: false, error: '', data: payload.data });
      } catch {
        setState({ loading: false, error: 'invalid', data: null });
      }
    }

    loadGuardianView();
  }, [token]);

  if (state.loading) {
    return (
      <main className="guardian-page">
        <section className="guardian-shell">
          <div className="guardian-topbar">
            <strong>RentEase</strong>
            <span>Guardian View</span>
          </div>
          <LoadingSkeleton rows={5} />
        </section>
      </main>
    );
  }

  if (state.error || !state.data) {
    return (
      <main className="guardian-page">
        <section className="guardian-error-card">
          <strong>RentEase</strong>
          <div><Link2Off size={30} /></div>
          <h1>This link is no longer valid</h1>
          <p>The access to this information has been revoked or the link has expired. Please ask your family member to send you a new link.</p>
        </section>
      </main>
    );
  }

  const data = state.data;
  const room = data.room;
  const rent = data.rent_current_month;
  const landlord = data.landlord_contact;
  const house = data.boarding_house;

  return (
    <main className="guardian-page">
      <section className="guardian-shell">
        <div className="guardian-topbar">
          <strong>RentEase</strong>
          <span>Guardian View</span>
        </div>

        <div className="guardian-tenant-banner">
          Viewing information for <strong>{data.tenant_name}</strong>
        </div>

        <article className="guardian-card">
          <header>
            <Building2 size={20} />
            <h2>Current Room</h2>
          </header>
          {room ? (
            <>
              <div className="guardian-room-photo"><Building2 size={34} /></div>
              <h3>Room {room.number}</h3>
              <SeekerStatusPill status={room.type} />
              <p>{house?.name || 'Boarding House'}</p>
              <p><MapPin size={15} /> {house?.address || 'Address not available'}</p>
              <dl className="guardian-definition-list">
                <div>
                  <dt>Monthly Rate</dt>
                  <dd>{formatCurrency(room.rate)}</dd>
                </div>
                <div>
                  <dt>Move-in Date</dt>
                  <dd>{formatDate(room.move_in_date)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p>No current approved room assignment.</p>
          )}
        </article>

        <article className="guardian-card">
          <header>
            <Receipt size={20} />
            <h2>Rent Status</h2>
          </header>
          <div className={`guardian-rent-status ${rent?.status === 'paid' ? 'paid' : rent ? 'unpaid' : 'none'}`}>
            {rent?.status === 'paid' ? <CircleCheck size={32} /> : rent ? <TriangleAlert size={32} /> : <Receipt size={32} />}
            <span>{rent ? rent.status : 'No record'}</span>
            <p>
              {rent
                ? rent.status === 'paid'
                  ? `Paid on ${formatDate(rent.payment_date)}`
                  : `${formatCurrency(Math.max(Number(rent.amount_due || 0) - Number(rent.amount_paid || 0), 0))} due`
                : `No record for ${currentMonthLabel()}`}
            </p>
          </div>

          <div className="guardian-history">
            {(data.rent_history || []).map((payment) => (
              <div key={`${payment.billing_period}-${payment.status}`}>
                <span>{payment.billing_period_label || payment.billing_period}</span>
                <SeekerStatusPill status={payment.status} />
                <small>{payment.payment_date ? formatDate(payment.payment_date) : '-'}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="guardian-card">
          <header>
            <Phone size={20} />
            <h2>Landlord Contact</h2>
          </header>
          <strong>{landlord?.name || 'Landlord'}</strong>
          <p>{landlord?.contact_number || 'No contact number provided'}</p>
          <small>For questions about accommodation, contact the landlord directly.</small>
        </article>

        <footer className="guardian-footer">
          <p>Information last updated: {formatDateTime(data.last_updated)}</p>
          <p>Powered by RentEase</p>
        </footer>
      </section>
    </main>
  );
}
