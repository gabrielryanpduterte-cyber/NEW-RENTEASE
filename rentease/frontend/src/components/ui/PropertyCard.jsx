import { Link } from 'react-router-dom';
import { Home, Bed, Bath, Maximize, MapPin, CheckCircle } from 'lucide-react';
import { formatCurrency, truncateText } from '../../lib/utils';

export function PropertyCard({ property }) {
  const {
    id,
    title,
    description,
    price,
    location,
    bedrooms,
    bathrooms,
    area,
    image,
    isVerified,
    status,
  } = property;

  return (
    <Link 
      to={`/property/${id}`}
      className="property-card"
    >
      <div className="property-image">
        {image ? (
          <img src={image} alt={title} />
        ) : (
          <div className="property-image-placeholder">
            <Home size={48} />
          </div>
        )}
        {isVerified && (
          <div className="property-badge verified">
            <CheckCircle size={14} />
            <span>Verified</span>
          </div>
        )}
        {status && (
          <div className={`property-badge status-${status.toLowerCase()}`}>
            {status}
          </div>
        )}
      </div>

      <div className="property-content">
        <div className="property-header">
          <h3 className="property-title">{truncateText(title, 40)}</h3>
          <p className="property-price">{formatCurrency(price)}/month</p>
        </div>

        {location && (
          <div className="property-location">
            <MapPin size={14} />
            <span>{location}</span>
          </div>
        )}

        {description && (
          <p className="property-description">
            {truncateText(description, 80)}
          </p>
        )}

        <div className="property-features">
          {bedrooms && (
            <div className="feature-item">
              <Bed size={16} />
              <span>{bedrooms} Beds</span>
            </div>
          )}
          {bathrooms && (
            <div className="feature-item">
              <Bath size={16} />
              <span>{bathrooms} Baths</span>
            </div>
          )}
          {area && (
            <div className="feature-item">
              <Maximize size={16} />
              <span>{area} sqm</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
