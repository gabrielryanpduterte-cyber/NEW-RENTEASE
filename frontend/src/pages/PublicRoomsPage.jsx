import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, Search } from 'lucide-react';
import RoomCard from '../components/design/RoomCard.jsx';
import { featuredRooms } from '../data/renteaseContent.js';

const typeOptions = ['All', 'Single', 'Double', 'Shared'];
const capacityOptions = ['All', '1', '2', '3+'];
const availabilityOptions = ['All', 'Available', 'Occupied'];

export default function PublicRoomsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    type: 'All',
    capacity: 'All',
    availability: 'All',
    maxPrice: 10000,
  });

  const filteredRooms = useMemo(
    () =>
      featuredRooms.filter((room) => {
        const matchesSearch =
          filters.search.trim() === '' ||
          `${room.name} ${room.roomNumber} ${room.type}`
            .toLowerCase()
            .includes(filters.search.trim().toLowerCase());
        const matchesType = filters.type === 'All' || room.type === filters.type;
        const matchesAvailability =
          filters.availability === 'All' ||
          (filters.availability === 'Available' && room.available) ||
          (filters.availability === 'Occupied' && !room.available);
        const matchesCapacity =
          filters.capacity === 'All' ||
          (filters.capacity === '3+' ? room.capacity >= 3 : room.capacity === Number(filters.capacity));
        const matchesPrice = room.rate <= Number(filters.maxPrice);

        return matchesSearch && matchesType && matchesAvailability && matchesCapacity && matchesPrice;
      }),
    [filters],
  );

  return (
    <main className="re-public-page re-rooms-page">
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

      <section className="re-page-hero compact">
        <p className="re-eyebrow">Room listings</p>
        <h1>Find a boarding house room that fits your budget</h1>
        <p>Filter by type, capacity, availability, and monthly rate.</p>
      </section>

      <section className="re-room-filter-bar" aria-label="Room filters">
        <label className="re-search-field">
          <Search size={18} />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search room number or type"
          />
        </label>

        <label>
          <span>Room Type</span>
          <select
            value={filters.type}
            onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Capacity</span>
          <select
            value={filters.capacity}
            onChange={(event) => setFilters((current) => ({ ...current, capacity: event.target.value }))}
          >
            {capacityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Availability</span>
          <select
            value={filters.availability}
            onChange={(event) => setFilters((current) => ({ ...current, availability: event.target.value }))}
          >
            {availabilityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Max Price: PHP {Number(filters.maxPrice).toLocaleString('en-PH')}</span>
          <input
            type="range"
            min="3000"
            max="10000"
            step="500"
            value={filters.maxPrice}
            onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))}
          />
        </label>

        <button
          type="button"
          className="re-btn re-btn-secondary"
          onClick={() =>
            setFilters({
              search: '',
              type: 'All',
              capacity: 'All',
              availability: 'All',
              maxPrice: 10000,
            })
          }
        >
          <Filter size={16} />
          Reset
        </button>
      </section>

      <section className="re-section">
        <div className="re-results-line">
          <span>{filteredRooms.length} rooms found</span>
        </div>

        {filteredRooms.length > 0 ? (
          <div className="re-room-grid">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                cta="Reserve"
                onReserve={() => navigate(`/rooms/${room.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="re-empty-state">
            <div aria-hidden="true">RE</div>
            <h2>No rooms match your filter</h2>
            <p>Try adjusting room type, capacity, availability, or monthly rate.</p>
          </div>
        )}
      </section>
    </main>
  );
}
