import { useState, useEffect } from 'react';
// Unused useNavigate removed
import AppShell from '../components/AppShell.jsx';
import { PropertyCard } from '../components/ui/PropertyCard';
import { SearchFilters } from '../components/ui/SearchFilters';
import { Button } from '../components/ui/Button';
import { roomsApi } from '../api/client.js';

function PropertyBrowsePage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [, setFilters] = useState({});

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await roomsApi.list({ availability_status: 'available' });
      const rooms = Array.isArray(response.data) ? response.data : response.data?.items || [];
      
      // Transform API data to PropertyCard format
      const transformedProperties = rooms.map(room => ({
        id: room.room_id,
        title: `Room ${room.room_number} - ${room.room_type}`,
        description: `${room.house_name || 'Boarding House'} - Capacity: ${room.capacity} person(s)`,
        price: room.monthly_rate,
        location: room.house_name || 'Location not specified',
        bedrooms: room.room_type === 'single' ? 1 : room.capacity,
        bathrooms: 1,
        area: null,
        image: null,
        isVerified: true,
        status: room.availability_status,
      }));
      
      setProperties(transformedProperties);
    } catch (err) {
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(searchFilters) {
    setFilters(searchFilters);
    // Implement filtering logic here
    console.log('Searching with filters:', searchFilters);
  }

  const quickStats = [
    { label: 'Available Properties', value: properties.length, tone: 'sky' },
    { label: 'New This Week', value: '5', tone: 'mint' },
    { label: 'Saved', value: '0', tone: 'amber' },
    { label: 'Viewed', value: '0', tone: 'neutral' },
  ];

  return (
    <AppShell
      title="Browse Properties"
      subtitle="Find your perfect boarding house"
      quickStats={quickStats}
    >
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="module-card">
          <div className="module-head">
            <h3>Search & Filter</h3>
          </div>
          <SearchFilters onSearch={handleSearch} onFilterChange={setFilters} />
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <div className="module-card">
          <div className="module-head">
            <h3>Available Properties ({properties.length})</h3>
            <Button variant="light" onClick={loadProperties}>
              Refresh
            </Button>
          </div>

          {loading && (
            <div className="state-card state-loading">
              <p>Loading properties...</p>
            </div>
          )}

          {error && (
            <div className="state-card state-error">
              <p>{error}</p>
              <Button variant="light" onClick={loadProperties} style={{ marginTop: '0.5rem' }}>
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && properties.length === 0 && (
            <div className="state-card state-empty">
              <p>No properties available at the moment</p>
            </div>
          )}

          {!loading && !error && properties.length > 0 && (
            <div className="property-grid">
              {properties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default PropertyBrowsePage;
