import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CalendarPlus, Eye, Filter, MapPin, RotateCcw, Search, Users } from 'lucide-react';
import { boardingHouseApi, roomsApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import { LoadingSkeleton } from '../../components/seeker/SeekerShared.jsx';
import { formatCurrency } from '../../utils/format.js';
import {
  buildPropertyListings,
  filterPropertyListings,
  PROPERTY_TYPE_OPTIONS,
  propertyTypeLabel,
} from '../../utils/propertyBrowse.js';

const DEFAULT_FILTERS = {
  search: '',
  propertyType: '',
  maxPrice: '',
};

export default function BrowsePropertiesPage() {
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
      setState({ loading: false, error: '' });
    } catch (error) {
      setState({
        loading: false,
        error: error?.errors?.[0] || error?.message || 'Unable to load properties.',
      });
    }
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

  const quickStats = [
    { label: 'Properties', value: String(properties.length), tone: 'neutral' },
    {
      label: 'Available Rooms',
      value: String(properties.reduce((sum, property) => sum + property.availableRooms.length, 0)),
      tone: 'mint',
    },
  ];

  function selectProperty(property) {
    setSelectedPropertyId(property.boarding_house_id);
    window.requestAnimationFrame(() => {
      document.getElementById('seeker-property-rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <AppShell
      title="Browse Properties"
      subtitle="Choose a property first, then review its available rooms."
      quickStats={quickStats}
    >
      <section className="seeker-main-column">
        <div className="browse-filter-card">
          <label className="browse-search-field">
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
          <button type="button" className="button-light" onClick={() => setFilters(DEFAULT_FILTERS)}>
            <Filter size={16} />
            Reset
          </button>
          <button type="button" className="button-light" onClick={loadListings} disabled={state.loading}>
            <RotateCcw size={16} />
            Refresh
          </button>
        </div>

        {state.loading ? (
          <LoadingSkeleton rows={4} />
        ) : state.error ? (
          <div className="re-error-panel">{state.error}</div>
        ) : (
          <>
            <div className="re-notice-panel">
              Browse properties first, then choose a room. RentEase is for longer stays, so an approved or pending reservation blocks new reservations until it is resolved.
            </div>

            <div className="browse-results-line">
              <span>{filteredProperties.length} properties found</span>
              {selectedProperty && (
                <button type="button" className="button-light" onClick={() => setSelectedPropertyId(null)}>
                  Show all properties
                </button>
              )}
            </div>

            {filteredProperties.length === 0 ? (
              <div className="re-empty-state seeker-empty">
                <div aria-hidden="true">RE</div>
                <h2>No properties match your filters.</h2>
                <p>Try another property type, address, amenity, or budget.</p>
              </div>
            ) : (
              <div className="browse-property-grid">
                {filteredProperties.map((property) => (
                  <article
                    key={property.boarding_house_id}
                    className={`browse-property-card ${selectedPropertyId === property.boarding_house_id ? 'active' : ''}`}
                  >
                    <div className="browse-property-photo">
                      {property.image ? (
                        <img src={property.image} alt={property.house_name || 'Property'} loading="lazy" />
                      ) : (
                        <Building2 size={36} />
                      )}
                      <span>{propertyTypeLabel(property.property_type)}</span>
                    </div>
                    <div className="browse-property-body">
                      <div>
                        <h2>{property.house_name || 'Property'}</h2>
                        <p>
                          <MapPin size={15} />
                          {property.address || 'Address not listed'}
                        </p>
                      </div>
                      <strong>{property.minRate ? `From ${formatCurrency(property.minRate)}` : 'Rates pending'}</strong>
                      <div className="browse-property-metrics">
                        <span>{property.availableRooms.length} available room(s)</span>
                        <span>{property.roomTypes.join(', ') || 'Rooms pending'}</span>
                      </div>
                      {property.amenities?.length > 0 && (
                        <div className="browse-chip-row">
                          {property.amenities.slice(0, 4).map((amenity) => (
                            <span key={amenity}>{amenity}</span>
                          ))}
                        </div>
                      )}
                      <button type="button" className="button-primary" onClick={() => selectProperty(property)}>
                        View Rooms
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {selectedProperty && (
              <article className="browse-room-panel" id="seeker-property-rooms">
                <div className="seeker-card-head">
                  <Building2 size={20} />
                  <h2>{selectedProperty.house_name}</h2>
                </div>
                <p className="seeker-muted">
                  {selectedProperty.address || 'Address not listed'} - {selectedProperty.availableRooms.length} available room(s)
                </p>
                {selectedProperty.availableRooms.length > 0 ? (
                  <div className="browse-room-list">
                    {selectedProperty.availableRooms.map((room) => (
                      <div className="browse-room-row" key={room.id}>
                        <div className="browse-room-thumb">
                          {room.photo ? (
                            <img src={room.photo} alt={`Room ${room.roomNumber}`} loading="lazy" />
                          ) : (
                            <Building2 size={24} />
                          )}
                        </div>
                        <div className="browse-room-copy">
                          <strong>Room {room.roomNumber}</strong>
                          <span>{room.type}</span>
                          <span>
                            <Users size={14} />
                            {room.occupiedCount || 0} inside, {room.remainingCapacity ?? room.capacity} left
                          </span>
                        </div>
                        <strong className="browse-room-rate">{formatCurrency(room.rate)}</strong>
                        <div className="browse-room-actions">
                          <button type="button" className="button-light" onClick={() => navigate(`/rooms/${room.id}`)}>
                            <Eye size={15} />
                            Details
                          </button>
                          <button
                            type="button"
                            className="button-primary"
                            onClick={() => navigate(`/dashboard/reservations?room=${room.id}`)}
                          >
                            <CalendarPlus size={15} />
                            Reserve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="seeker-muted">No available rooms in this property right now.</p>
                )}
              </article>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}
