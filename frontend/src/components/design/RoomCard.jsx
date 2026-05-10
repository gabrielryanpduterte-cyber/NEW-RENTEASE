import { Bath, BedDouble, Fan, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/format.js';
import StatusPill from './StatusPill.jsx';

function AmenityIcon({ label }) {
  const lower = label.toLowerCase();
  if (lower.includes('wifi')) return <Wifi size={16} />;
  if (lower.includes('bath')) return <Bath size={16} />;
  if (lower.includes('air') || lower.includes('fan')) return <Fan size={16} />;
  return <BedDouble size={16} />;
}

export default function RoomCard({ room, cta = 'Reserve Now', detailTo, onReserve }) {
  const status = room.available ? 'available' : 'occupied';

  return (
    <article className="re-room-card">
      <Link className="re-room-media" to={detailTo || `/rooms/${room.id}`}>
        <img src={room.photo} alt={`${room.name} room`} loading="lazy" />
        <span className="re-room-type">{room.type}</span>
        <StatusPill variant={status} />
      </Link>

      <div className="re-room-card-body">
        <div className="re-room-card-heading">
          <div>
            <p>Room {room.roomNumber}</p>
            <h3>{room.name}</h3>
          </div>
          <strong>{formatCurrency(room.rate)}</strong>
        </div>

        <div className="re-room-meta" aria-label="Room capacity and amenities">
          <span>
            <BedDouble size={16} />
            {room.capacity} {room.capacity > 1 ? 'beds' : 'bed'}
          </span>
          {room.amenities.slice(0, 3).map((amenity) => (
            <span key={amenity}>
              <AmenityIcon label={amenity} />
              {amenity}
            </span>
          ))}
        </div>

        <div className="re-room-actions">
          <Link to={detailTo || `/rooms/${room.id}`}>View Details</Link>
          <button type="button" onClick={() => onReserve?.(room)} disabled={!room.available}>
            {room.available ? cta : 'Occupied'}
          </button>
        </div>
      </div>
    </article>
  );
}
