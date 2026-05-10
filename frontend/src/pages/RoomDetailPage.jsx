import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Bath, BedDouble, CalendarDays, Fan, Home, MapPin, ShieldCheck, Wifi } from 'lucide-react';
import StatusPill from '../components/design/StatusPill.jsx';
import { boardingHouseApi, roomsApi } from '../api/client.js';
import { featuredRooms, findRoomById } from '../data/renteaseContent.js';
import { formatCurrency } from '../utils/format.js';
import { propertyTypeLabel, roomToBrowseCard } from '../utils/propertyBrowse.js';

function amenityIcon(label) {
  const lower = label.toLowerCase();
  if (lower.includes('wifi')) return <Wifi size={18} />;
  if (lower.includes('bath')) return <Bath size={18} />;
  if (lower.includes('air') || lower.includes('fan')) return <Fan size={18} />;
  if (lower.includes('study') || lower.includes('desk')) return <ShieldCheck size={18} />;
  return <BedDouble size={18} />;
}

function splitTextList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || '')
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeApiRoom(room, house) {
  const card = roomToBrowseCard(room, house);
  const gallery = Array.isArray(room.photo_urls) && room.photo_urls.length > 0
    ? room.photo_urls
    : [card.photo].filter(Boolean);

  return {
    id: String(room.room_id),
    roomNumber: room.room_number || room.room_id,
    name: `${house?.house_name || room.house_name || 'Property'} - ${room.room_type || 'Room'}`,
    description: room.notes || house?.description || 'Review this room inside the selected property before sending a reservation request.',
    type: room.room_type || 'Room',
    rate: Number(room.monthly_rate || 0),
    capacity: Number(room.capacity || 1),
    occupiedCount: Number(room.occupied_count || 0),
    remainingCapacity: Number(room.remaining_capacity ?? room.capacity ?? 1),
    occupancySummary: room.occupancy_summary || '',
    amenities: card.amenities,
    available: String(room.availability_status || '').toLowerCase() === 'available',
    photo: gallery[0] || house?.cover_photo_url || '',
    gallery: gallery.length > 0 ? gallery : [house?.cover_photo_url].filter(Boolean),
    rules: splitTextList(house?.house_rules),
    house,
  };
}

export default function RoomDetailPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const staticRoom = findRoomById(roomId);
  const [state, setState] = useState({
    loading: /^\d+$/.test(String(roomId || '')),
    error: '',
    room: staticRoom || null,
    related: [],
  });
  const [selectedImage, setSelectedImage] = useState('');
  const [form, setForm] = useState({ moveInDate: '', message: '' });

  useEffect(() => {
    let isMounted = true;

    async function loadRoom() {
      if (!/^\d+$/.test(String(roomId || ''))) {
        return;
      }

      setState((current) => ({ ...current, loading: true, error: '' }));
      try {
        const roomPayload = await roomsApi.get(roomId);
        const room = roomPayload.data || null;
        let house = null;
        if (room?.boarding_house_id) {
          const housePayload = await boardingHouseApi.get(room.boarding_house_id);
          house = housePayload.data || null;
        }
        const relatedPayload = room?.boarding_house_id
          ? await roomsApi.list({ boarding_house_id: room.boarding_house_id, availability_status: 'available', include_archived: 0 })
          : { data: [] };
        const related = (Array.isArray(relatedPayload.data) ? relatedPayload.data : [])
          .filter((item) => String(item.room_id) !== String(roomId))
          .slice(0, 2)
          .map((item) => normalizeApiRoom(item, house));

        if (isMounted) {
          setState({
            loading: false,
            error: '',
            room: room ? normalizeApiRoom(room, house) : null,
            related,
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            loading: false,
            error: error?.errors?.[0] || error?.message || 'Unable to load room details.',
            room: staticRoom || null,
            related: staticRoom ? featuredRooms.filter((item) => item.id !== staticRoom.id).slice(0, 2) : [],
          });
        }
      }
    }

    queueMicrotask(() => {
      loadRoom();
    });

    return () => {
      isMounted = false;
    };
  }, [roomId, staticRoom]);

  const room = state.room;
  const relatedRooms = useMemo(
    () => state.related || [],
    [state.related],
  );

  if (state.loading) {
    return (
      <main className="re-public-page re-room-detail-page">
        <div className="fullscreen-center">
          <div className="status-panel">
            <p>Loading room details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!room) {
    return <Navigate to="/properties" replace />;
  }

  const availability = room.available ? 'available' : 'occupied';
  const gallery = room.gallery?.length ? room.gallery : [room.photo].filter(Boolean);
  const activeImage = gallery.includes(selectedImage) ? selectedImage : gallery[0];
  const house = room.house;

  return (
    <main className="re-public-page re-room-detail-page">
      <header className="re-public-subnav">
        <Link to="/" className="re-brand">
          RentEase
        </Link>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/properties">Properties</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>

      <section className="re-detail-shell">
        <div className="re-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/properties">Properties</Link>
          <span>/</span>
          <strong>Room {room.roomNumber}</strong>
        </div>

        {state.error && <div className="re-error-panel">{state.error}</div>}

        <div className="re-detail-layout">
          <article className="re-detail-main">
            <div className="re-gallery">
              {activeImage ? (
                <img src={activeImage} alt={`${room.name} main view`} />
              ) : (
                <div className="re-gallery-placeholder">
                  <Home size={44} />
                </div>
              )}
              {gallery.length > 1 && (
                <div>
                  {gallery.map((image) => (
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
              )}
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
                <span>{room.occupiedCount} inside, {room.remainingCapacity} slot(s) left</span>
              </article>
              <article>
                <MapPin size={18} />
                <span>{house?.address || 'Location details available after inquiry'}</span>
              </article>
            </section>

            {room.rules.length > 0 && (
              <section className="re-house-rules">
                <h2>House Rules</h2>
                <ol>
                  {room.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ol>
              </section>
            )}

            <section className="re-location-card">
              <Home size={22} />
              <div>
                <h2>{house?.house_name || 'Property'}</h2>
                <p>
                  {house?.property_type ? `${propertyTypeLabel(house.property_type)} - ` : ''}
                  {house?.address || 'Property address not listed.'}
                </p>
              </div>
            </section>

            {relatedRooms.length > 0 && (
              <section className="re-related-rooms">
                <h2>Other available options in this property</h2>
                <div>
                  {relatedRooms.map((item) => (
                    <Link key={item.id} to={`/rooms/${item.id}`}>
                      Room {item.roomNumber} - {item.type}
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
                  {room.available ? 'Login to Reserve' : 'Room Occupied'}
                </button>
              </form>
            </div>

            <div className="re-landlord-card">
              <h2>Property Contact</h2>
              <p>{house?.house_name || 'Property'}</p>
              <span>Available after login</span>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
