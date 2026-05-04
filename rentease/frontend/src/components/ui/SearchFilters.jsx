import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from './Button';

export function SearchFilters({ onSearch, onFilterChange }) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    location: '',
    propertyType: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    if (onSearch) onSearch(filters);
    if (onFilterChange) onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      location: '',
      propertyType: '',
    };
    setFilters(resetFilters);
    if (onFilterChange) onFilterChange(resetFilters);
  };

  return (
    <div className="search-filters">
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            name="search"
            placeholder="Search properties..."
            value={filters.search}
            onChange={handleInputChange}
            className="search-input"
          />
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowFilters(!showFilters)}
          className="filter-toggle"
        >
          <SlidersHorizontal size={18} />
          Filters
        </Button>
        <Button onClick={handleSearch}>
          Search
        </Button>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-grid">
            <div className="form-group">
              <label>Min Price</label>
              <input
                type="number"
                name="minPrice"
                placeholder="₱0"
                value={filters.minPrice}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Max Price</label>
              <input
                type="number"
                name="maxPrice"
                placeholder="₱50,000"
                value={filters.maxPrice}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Bedrooms</label>
              <select
                name="bedrooms"
                value={filters.bedrooms}
                onChange={handleInputChange}
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>

            <div className="form-group">
              <label>Property Type</label>
              <select
                name="propertyType"
                value={filters.propertyType}
                onChange={handleInputChange}
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="room">Room</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                placeholder="City or area"
                value={filters.location}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="filter-actions">
            <Button variant="light" onClick={handleReset}>
              <X size={16} />
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
