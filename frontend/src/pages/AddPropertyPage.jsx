import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ImageUpload } from '../components/ui/ImageUpload';
import { Button } from '../components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

function AddPropertyPage() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'room',
    bedrooms: '1',
    bathrooms: '1',
    area: '',
    price: '',
    location: '',
    address: '',
    amenities: {
      wifi: false,
      aircon: false,
      parking: false,
      kitchen: false,
      laundry: false,
      security: false,
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('amenities.')) {
      const amenityName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        amenities: {
          ...prev.amenities,
          [amenityName]: checked,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccess(
        images.length > 0
          ? `Property added successfully with ${images.length} image${images.length === 1 ? '' : 's'}!`
          : 'Property added successfully!'
      );
      
      // Reset form after 2 seconds
      setTimeout(() => {
        navigate('/owner/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to add property');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      title="Add New Property"
      subtitle="List your property for potential boarders"
    >
      <div style={{ gridColumn: '1 / -1' }}>
        <Card>
          <CardHeader>
            <Button 
              variant="light" 
              onClick={() => navigate('/owner/dashboard')}
              style={{ marginRight: 'auto' }}
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Button>
          </CardHeader>
        </Card>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <Card>
          <CardHeader>
            <CardTitle>
              <Home size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Property Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="inline-form" style={{ gridTemplateColumns: '1fr' }}>
              {/* Basic Information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Property Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Modern Studio Apartment"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Property Type *</label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="room">Room</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your property..."
                  rows="4"
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Property Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Bedrooms *</label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Bathrooms *</label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Area (sqm)</label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="25"
                  />
                </div>

                <div className="form-group">
                  <label>Monthly Rate (₱) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="5000"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>City/Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Quezon City"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Full Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street, Barangay, City"
                    required
                  />
                </div>
              </div>

              {/* Amenities */}
              <div className="form-group">
                <label>Amenities</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {Object.keys(formData.amenities).map(amenity => (
                    <label key={amenity} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        name={`amenities.${amenity}`}
                        checked={formData.amenities[amenity]}
                        onChange={handleInputChange}
                      />
                      {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <ImageUpload onImagesChange={setImages} maxImages={10} />

              {/* Error/Success Messages */}
              {error && (
                <div className="mini-feedback mini-error">
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="mini-feedback mini-success">
                  <p>{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/owner/dashboard')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Adding Property...' : 'Add Property'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default AddPropertyPage;
