import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Filter, MapPin, Search } from 'lucide-react';
import RoomCard from '../components/design/RoomCard.jsx';
import { boardingHouseApi, roomsApi } from '../api/client.js';
import { formatCurrency } from '../utils/format.js';
import {
  buildPropertyListings,
  filterPropertyListings,
  PROPERTY_TYPE_OPTIONS,
  propertyTypeLabel,
} from '../utils/propertyBrowse.js';

const DEFAULT_FILTERS = {
  search: '',
  propertyType: '',
  maxPrice: '',
};

function PropertyCard({ property, selected, onSelect }) {
  return (
    <article className={`re-property-browse-card ${selected ? 'active' : ''}`}>
      <div className="re-property-media">
        {property.image ? (
          <img src={property.image} alt={property.house_name || 'Property'} loading="lazy" />
        ) : (
          <div>
            <Building2 size={42} />
          </div>
        )}
        <span>{propertyTypeLabel(property.property_type)}</span>
      </div>
      <div className="re-property-body">
        <div className="re-property-heading">
          <div>
            <h2>{property.house_name || 'Property'}</h2>
            <p>
              <MapPin size={15} />
              {property.address || 'Address not listed'}
            </p>
          </div>
          <strong>
            {property.minRate ? `From ${formatCurrency(property.minRate)}` : 'Rates pending'}
          </strong>
        </div>
        {property.description && <p className="re-property-copy">{property.description}</p>}
        <div className="re-property-metrics">
          <span>{property.availableRooms.length} available room(s)</span>
          <span>{property.rooms.length} listed room(s)</span>
          <span>{property.roomTypes.join(', ') || 'Room details pending'}</span>
        </div>
        {property.amenities?.length > 0 && (
          <div className="re-property-chips">
            {property.amenities.slice(0, 4).map((amenity) => (
              <span key={amenity}>{amenity}</span>
            ))}
          </div>
        )}
        <button type="button" className="re-btn re-btn-gold" onClick={() => onSelect(property)}>
          View Rooms
        </button>
      </div>
    </article>
  );
}

export default function PublicRoomsPage() {
  const navigate = useNavigate();
  const [houses, setHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [state, setState] = useState({ loading: true, error: '' });

  async function loadListings() {
    setState({ loading: true, error: '' });
    try {
      const [housesPayload, roomsPayload] = await Promise.all([
        boardingHouseApi.list(),
        roomsApi.list({ availability_status: 'available', include_archived: 0 }),
      ]);
      setHouses(Array.isArray(housesPayload.data) ? housesPayload.data : []);
      setRooms(Array.isArray(roomsPayload.data) ? roomsPayload.data : []);
    } catch (error) {
      setState({
        loading: false,
        error: error?.errors?.[0] || error?.message || 'Unable to load properties.',
      });
      return;
    }
    setState({ loading: false, error: '' });
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadListings();
    });
  }, []);

  const properties = useMemo(() => buildPropertyListings(houses, rooms), [houses, rooms]);
  const filteredProperties = useMemo(
    () => filterPropertyListings(properties, filters),
    [filters, properties],
  );
  const selectedProperty = filteredProperties.find((property) => property.boarding_house_id === selectedPropertyId) || null;
  const totalAvailableRooms = filteredProperties.reduce((sum, property) => sum + property.availableRooms.length, 0);

  function selectProperty(property) {
    setSelectedPropertyId(property.boarding_house_id);
    window.requestAnimationFrame(() => {
      document.getElementById('property-rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <main className="re-public-page re-rooms-page">
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

      <section className="re-page-hero compact">
        <p className="re-eyebrow">Property listings</p>
        <h1>Browse properties first, then choose the right room</h1>
        <p>Compare boarding houses, apartments, dormitories, bedspaces, and other rentals before opening room options.</p>
      </section>

      <section className="re-room-filter-bar" aria-label="Property filters">
        <label className="re-search-field">
          <Search size={18} />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search property, address, amenity"
          />
        </label>

        <label>
          <span>Property Type</span>
          <select
            value={filters.propertyType}
            onChange={(event) => setFilters((current) => ({ ...current, propertyType: event.target.value }))}
          >
            {PROPERTY_TYPE_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Max Starting Rate</span>
          <input
            type="number"
            min="0"
            step="500"
            value={filters.maxPrice}
            onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))}
            placeholder="Any budget"
          />
        </label>

        <button type="button" className="re-btn re-btn-secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
          <Filter size={16} />
          Reset
        </button>
      </section>

      <section className="re-section">
        <div className="re-results-line">
          <span>
            {state.loading
              ? 'Loading properties...'
              : `${filteredProperties.length} properties, ${totalAvailableRooms} available room(s)`}
          </span>
          {selectedProperty && (
            <button type="button" className="button-light" onClick={() => setSelectedPropertyId(null)}>
              Show all properties
            </button>
          )}
        </div>

        {state.error && (
          <div className="re-empty-state">
            <div aria-hidden="true">RE</div>
            <h2>Unable to load properties</h2>
            <p>{state.error}</p>
            <button type="button" className="re-btn re-btn-gold" onClick={loadListings}>
              Try Again
            </button>
          </div>
        )}

        {!state.loading && !state.error && filteredProperties.length === 0 && (
          <div className="re-empty-state">
            <div aria-hidden="true">RE</div>
            <h2>No properties match your filters</h2>
            <p>Try a broader search, another property type, or a higher starting rate.</p>
          </div>
        )}

        {!state.error && filteredProperties.length > 0 && (
          <div className="re-property-grid">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.boarding_house_id}
                property={property}
                selected={selectedPropertyId === property.boarding_house_id}
                onSelect={selectProperty}
              />
            ))}
          </div>
        )}
      </section>

      {selectedProperty && (
        <section className="re-section re-property-room-section" id="property-rooms">
          <div className="re-section-heading">
            <div>
              <p className="re-eyebrow">{propertyTypeLabel(selectedProperty.property_type)}</p>
              <h2>{selectedProperty.house_name}</h2>
              <p>{selectedProperty.address || 'Address not listed'}</p>
            </div>
          </div>

          {selectedProperty.availableRooms.length > 0 ? (
            <div className="re-room-grid">
              {selectedProperty.availableRooms.map((room) => (
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
              <h2>No available rooms in this property</h2>
              <p>Choose another property or check again later.</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
