import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Building2, Home, MapPin, Phone, Users, Wifi } from 'lucide-react';
import { seekerDashboardApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import { EmptyState, LoadingSkeleton } from '../../components/seeker/SeekerShared.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

function amenityIcon(label) {
  const normalized = String(label || '').toLowerCase();
  if (normalized.includes('wifi')) return <Wifi size={16} />;
  if (normalized.includes('bed')) return <BedDouble size={16} />;
  return <Home size={16} />;
}

export default function MyRoomPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  async function loadRoom() {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const payload = await seekerDashboardApi.room();
      setState({ loading: false, error: '', data: payload.data || null });
    } catch (error) {
      setState({
        loading: false,
        error: error?.errors?.[0] || error?.message || 'Unable to load room details.',
        data: null,
      });
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadRoom();
    });
  }, []);

  const room = state.data?.room;
  const reservation = state.data?.reservation;
  const boardingHouse = state.data?.boarding_house;
  const landlord = state.data?.landlord;

  return (
    <AppShell title="My Room" subtitle="Read-only details for your approved room assignment.">
      <section className="seeker-main-column">
        {state.loading ? (
          <LoadingSkeleton rows={5} />
        ) : state.error ? (
          <div className="re-error-panel">{state.error}</div>
        ) : !room ? (
          <EmptyState
            icon={Building2}
            title="You do not have an assigned room yet."
            description="Once your reservation is approved by the landlord, your room details will appear here."
            cta={<Link className="button-primary" to="/rooms">Browse Rooms</Link>}
          />
        ) : (
          <>
            <div className="re-breadcrumb seeker-breadcrumb">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <strong>My Room</strong>
            </div>

            <article className="seeker-room-detail">
              <div className="seeker-room-photo">
                <Building2 size={42} />
              </div>

              <div className="seeker-detail-title">
                <div>
                  <span>Room {room.room_number}</span>
                  <h1>{room.room_type}</h1>
                  <p>Move-in: {formatDate(reservation?.move_in_date)}</p>
                </div>
                <strong>{formatCurrency(room.monthly_rate)} / month</strong>
              </div>

              <section className="seeker-detail-section">
                <h2>Room Details</h2>
                <div className="seeker-info-grid">
                  <article>
                    <Users size={18} />
                    <span>Capacity</span>
                    <strong>{room.capacity || 1}</strong>
                  </article>
                  <article>
                    <BedDouble size={18} />
                    <span>Type</span>
                    <strong>{room.room_type}</strong>
                  </article>
                </div>
                <div className="seeker-chip-row">
                  {(room.amenities || []).map((amenity) => (
                    <span key={amenity}>
                      {amenityIcon(amenity)}
                      {amenity}
                    </span>
                  ))}
                </div>
              </section>

              <section className="seeker-detail-section">
                <h2>Boarding House</h2>
                <div className="seeker-house-block">
                  <Building2 size={20} />
                  <div>
                    <strong>{boardingHouse?.house_name || 'Boarding House'}</strong>
                    <p><MapPin size={15} /> {boardingHouse?.address || 'Address not available'}</p>
                  </div>
                </div>
                {boardingHouse?.house_rules?.length > 0 && (
                  <ol className="seeker-rule-list">
                    {boardingHouse.house_rules.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ol>
                )}
              </section>

              <section className="seeker-detail-section">
                <h2>Landlord Contact</h2>
                <div className="seeker-contact-card">
                  <Phone size={20} />
                  <div>
                    <strong>{landlord?.name || 'Landlord'}</strong>
                    <p>{landlord?.contact_number || 'No contact number provided'}</p>
                  </div>
                </div>
              </section>
            </article>
          </>
        )}
      </section>
    </AppShell>
  );
}
