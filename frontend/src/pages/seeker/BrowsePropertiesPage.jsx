import { useState, useEffect } from 'react';
import { roomsApi, boardingHouseApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import { formatCurrency } from '../../utils/format.js';

function BrowsePropertiesPage() {
  const [rooms, setRooms] = useState([]);
  const [boardingHouses, setBoardingHouses] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    roomType: '',
    minPrice: '',
    maxPrice: '',
  });

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      roomsApi.list({ availability_status: 'available' }),
      boardingHouseApi.list(),
    ])
      .then(([roomsRes, housesRes]) => {
        if (!isMounted) {
          return;
        }

        setRooms(roomsRes.data || []);

        const housesMap = {};
        (housesRes.data || []).forEach(house => {
          housesMap[house.boarding_house_id] = house;
        });
        setBoardingHouses(housesMap);
      })
      .catch((error) => {
        console.error('Failed to load data:', error);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRooms = rooms.filter(room => {
    if (filters.search && !room.room_number.toLowerCase().includes(filters.search.toLowerCase()) &&
        !boardingHouses[room.boarding_house_id]?.house_name?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.roomType && room.room_type !== filters.roomType) return false;
    if (filters.minPrice && parseFloat(room.monthly_rate) < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && parseFloat(room.monthly_rate) > parseFloat(filters.maxPrice)) return false;
    return true;
  });

  const roomTypes = [...new Set(rooms.map(r => r.room_type))];

  return (
    <AppShell
      title="Browse Properties"
      subtitle="Find your perfect boarding house room"
    >
      {/* Search and Filters */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Room number or house name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Room Type
            </label>
            <select
              value={filters.roomType}
              onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
            >
              <option value="">All Types</option>
              {roomTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Min Price
            </label>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Max Price
            </label>
            <input
              type="number"
              placeholder="10000"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
            />
          </div>
        </div>
        <button
          onClick={() => setFilters({ search: '', roomType: '', minPrice: '', maxPrice: '' })}
          className="button-light"
          style={{ marginTop: '1rem' }}
        >
          Clear Filters
        </button>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: '1rem', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
        {loading ? 'Loading...' : `${filteredRooms.length} room(s) available`}
      </div>

      {/* Room Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredRooms.map(room => {
          const house = boardingHouses[room.boarding_house_id];
          return (
            <div
              key={room.room_id}
              onClick={() => setSelectedRoom(room)}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                background: 'var(--card)',
                cursor: 'pointer',
                transition: 'transform 150ms, box-shadow 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ height: '200px', background: 'linear-gradient(145deg, #f1f5f9, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '3rem' }}>
                🏠
              </div>

              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      Room {room.room_number}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                      {house?.house_name || 'Boarding House'}
                    </p>
                  </div>
                  <span className="status-pill pill-success" style={{ fontSize: '0.7rem' }}>
                    Available
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <span>🛏️</span>
                    <span>{room.room_type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <span>👥</span>
                    <span>Capacity: {room.capacity}</span>
                  </div>
                  {house?.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                      <span>📍</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {house.address}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                      Monthly Rate
                    </p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                      {formatCurrency(room.monthly_rate)}
                    </p>
                  </div>
                  <button
                    className="button-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRoom(room);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Room Details Modal */}
      {selectedRoom && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedRoom(null)}
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius)',
              padding: '2rem',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Room {selectedRoom.room_number}
                </h2>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '1.125rem' }}>
                  {boardingHouses[selectedRoom.boarding_house_id]?.house_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="button-light"
                style={{ padding: '0.5rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Room Type</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>{selectedRoom.room_type}</p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Capacity</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>{selectedRoom.capacity} person(s)</p>
              </div>
            </div>

            <div style={{ padding: '1.5rem', background: 'var(--muted)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Monthly Rate</p>
              <p style={{ fontSize: '2.25rem', fontWeight: '700', color: 'var(--primary)' }}>
                {formatCurrency(selectedRoom.monthly_rate)}
              </p>
            </div>

            {selectedRoom.amenities && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>Amenities</h3>
                <p style={{ fontSize: '0.9375rem', lineHeight: '1.6', color: 'var(--muted-foreground)' }}>
                  {selectedRoom.amenities}
                </p>
              </div>
            )}

            {boardingHouses[selectedRoom.boarding_house_id] && (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>Location</h3>
                  <p style={{ fontSize: '0.9375rem', lineHeight: '1.6', color: 'var(--muted-foreground)' }}>
                    📍 {boardingHouses[selectedRoom.boarding_house_id].address}
                  </p>
                </div>

                {boardingHouses[selectedRoom.boarding_house_id].description && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>About</h3>
                    <p style={{ fontSize: '0.9375rem', lineHeight: '1.6', color: 'var(--muted-foreground)' }}>
                      {boardingHouses[selectedRoom.boarding_house_id].description}
                    </p>
                  </div>
                )}

                {boardingHouses[selectedRoom.boarding_house_id].house_rules && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>House Rules</h3>
                    <p style={{ fontSize: '0.9375rem', lineHeight: '1.6', color: 'var(--muted-foreground)' }}>
                      {boardingHouses[selectedRoom.boarding_house_id].house_rules}
                    </p>
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <button
                className="button-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  setSelectedRoom(null);
                  window.location.href = '/seeker/bookings?room=' + selectedRoom.room_id;
                }}
              >
                Book This Room
              </button>
              <button
                className="button-secondary"
                onClick={() => setSelectedRoom(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default BrowsePropertiesPage;
