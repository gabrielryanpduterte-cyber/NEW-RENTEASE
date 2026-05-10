import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Bath, BedDouble, CalendarDays, Fan, Home, MapPin, ShieldCheck, Wifi } from 'lucide-react';
import StatusPill from '../components/design/StatusPill.jsx';
import { featuredRooms, findRoomById } from '../data/renteaseContent.js';
import { formatCurrency } from '../utils/format.js';

function amenityIcon(label) {
  const lower = label.toLowerCase();
  if (lower.includes('wifi')) return <Wifi size={18} />;
  if (lower.includes('bath')) return <Bath size={18} />;
  if (lower.includes('air') || lower.includes('fan')) return <Fan size={18} />;
  if (lower.includes('study') || lower.includes('desk')) return <ShieldCheck size={18} />;
  return <BedDouble size={18} />;
}

export default function RoomDetailPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const room = findRoomById(roomId);
  const [selectedImage, setSelectedImage] = useState('');
  const [form, setForm] = useState({ moveInDate: '', message: '' });

  const relatedRooms = useMemo(
    () => featuredRooms.filter((item) => item.id !== room?.id).slice(0, 2),
    [room],
  );

  if (!room) {
    return <Navigate to="/rooms" replace />;
  }

  const availability = room.available ? 'available' : 'occupied';
  const activeImage = room.gallery.includes(selectedImage) ? selectedImage : room.gallery[0];

  return (
    <main className="re-public-page re-room-detail-page">
      <header className="re-public-subnav">
        <Link to="/" className="re-brand">
          RentEase
        </Link>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/rooms">Rooms</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>

      <section className="re-detail-shell">
        <div className="re-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/rooms">Rooms</Link>
          <span>/</span>
          <strong>Room {room.roomNumber}</strong>
        </div>

        <div className="re-detail-layout">
          <article className="re-detail-main">
            <div className="re-gallery">
              <img src={activeImage || room.photo} alt={`${room.name} main view`} />
              <div>
                {room.gallery.map((image) => (
                  <button
                    type="button"
                    key={image}
                    className={activeImage === image ? 'active' : ''}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img src={image} alt={`${room.name} thumbnail`} loading="lazy" />
                  </button>
                ))}
              </div>
            </div>

            <div className="re-detail-title">
              <div>
                <p className="re-eyebrow">Room {room.roomNumber}</p>
                <h1>{room.name}</h1>
              </div>
              <StatusPill variant={availability} />
            </div>

            <p className="re-detail-copy">{room.description}</p>

            <section className="re-amenities-grid">
              {room.amenities.map((amenity) => (
                <article key={amenity}>
                  {amenityIcon(amenity)}
                  <span>{amenity}</span>
                </article>
              ))}
              <article>
                <BedDouble size={18} />
                <span>{room.capacity} tenant capacity</span>
              </article>
              <article>
                <MapPin size={18} />
                <span>Near campus and transit</span>
              </article>
            </section>

            <section className="re-house-rules">
              <h2>House Rules</h2>
              <ol>
                {room.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ol>
            </section>

            <section className="re-location-card">
              <Home size={22} />
              <div>
                <h2>Dela Cruz Boarding House</h2>
                <p>Quiet student neighborhood, near jeepney routes, sari-sari stores, and campus gates.</p>
              </div>
            </section>

            {relatedRooms.length > 0 && (
              <section className="re-related-rooms">
                <h2>Other available options</h2>
                <div>
                  {relatedRooms.map((item) => (
                    <Link key={item.id} to={`/rooms/${item.id}`}>
                      Room {item.roomNumber} - {item.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="re-booking-sidebar">
            <div className="re-booking-card">
              <div className="re-booking-rate">
                <StatusPill variant={availability} />
                <strong>{formatCurrency(room.rate)}</strong>
                <span>per month</span>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  navigate('/login', { state: { from: `/rooms/${room.id}` } });
                }}
              >
                <label>
                  <span>Move-in date</span>
                  <div className="re-input-with-icon">
                    <CalendarDays size={17} />
                    <input
                      type="date"
                      value={form.moveInDate}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, moveInDate: event.target.value }))
                      }
                      required
                    />
                  </div>
                </label>

                <label>
                  <span>Message to landlord</span>
                  <textarea
                    rows="4"
                    value={form.message}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, message: event.target.value }))
                    }
                    placeholder="Share your preferred move-in schedule or questions."
                  />
                </label>

                <button type="submit" className="re-btn re-btn-gold" disabled={!room.available}>
                  {room.available ? 'Submit Reservation' : 'Room Occupied'}
                </button>
              </form>
            </div>

            <div className="re-landlord-card">
              <h2>Landlord Contact</h2>
              <p>Dela Cruz Boarding House</p>
              <span>Available after login</span>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
