import { useEffect, useMemo, useState } from 'react';
import { Camera, Link as LinkIcon, Plus } from 'lucide-react';
import { boardingHouseApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import AsyncState from '../../components/AsyncState.jsx';
import ModuleCard from '../../components/ModuleCard.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const AMENITY_OPTIONS = [
  'WiFi',
  'Filtered Water',
  'Electric',
  'Parking',
  'CR inside room',
  'Kitchen access',
  'Washing area',
  'Common area',
];

const EMPTY_FORM = {
  house_name: '',
  address: '',
  contact_number: '',
  facebook_page: '',
  description: '',
  house_rules: '',
  amenities_list: [],
};

function normalizeHouse(house) {
  if (!house) {
    return EMPTY_FORM;
  }

  return {
    house_name: house.house_name || '',
    address: house.address || '',
    contact_number: house.contact_number || '',
    facebook_page: house.facebook_page || '',
    description: house.description || '',
    house_rules: house.house_rules || '',
    amenities_list: Array.isArray(house.amenities_list) ? house.amenities_list : [],
  };
}

export default function BoardingHouseProfilePage() {
  const { showToast } = useToast();
  const [state, setState] = useState({
    loading: true,
    error: null,
    house: null,
  });
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [customAmenity, setCustomAmenity] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadHouse() {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const payload = await boardingHouseApi.list();
      const house = Array.isArray(payload.data) ? payload.data[0] || null : null;
      setState({ loading: false, error: null, house });
      setFormData(normalizeHouse(house));
      setCoverPreview(house?.cover_photo_url || '');
    } catch (error) {
      setState({ loading: false, error, house: null });
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadHouse();
    });
  }, []);

  const selectedAmenities = useMemo(
    () => new Set(formData.amenities_list || []),
    [formData.amenities_list],
  );

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function toggleAmenity(amenity) {
    setFormData((current) => {
      const next = new Set(current.amenities_list || []);
      if (next.has(amenity)) {
        next.delete(amenity);
      } else {
        next.add(amenity);
      }
      return { ...current, amenities_list: Array.from(next) };
    });
  }

  function addCustomAmenity() {
    const value = customAmenity.trim();
    if (!value) {
      return;
    }
    setFormData((current) => ({
      ...current,
      amenities_list: Array.from(new Set([...(current.amenities_list || []), value])),
    }));
    setCustomAmenity('');
  }

  function onCoverChange(event) {
    const file = event.target.files?.[0] || null;
    setCoverFile(file);
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);

    const body = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'amenities_list') {
        body.append(key, JSON.stringify(value || []));
      } else {
        body.append(key, value ?? '');
      }
    });
    if (coverFile) {
      body.append('cover_photo', coverFile);
    }

    try {
      if (state.house?.boarding_house_id) {
        await boardingHouseApi.update(state.house.boarding_house_id, body);
      } else {
        await boardingHouseApi.create(body);
      }
      showToast('Boarding house profile saved.', 'success');
      setCoverFile(null);
      await loadHouse();
    } catch (error) {
      showToast(error?.errors?.[0] || error?.message || 'Unable to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Boarding House Profile"
      subtitle="Public listing details, contact information, house rules, and seeker-facing amenities."
    >
      <ModuleCard
        id="boarding-house-form"
        title="Profile Details"
        description="Keep listing information accurate before rooms go live."
      >
        <AsyncState
          loading={state.loading}
          error={state.error}
          isEmpty={false}
          loadingText="Loading boarding house profile..."
          onRetry={loadHouse}
        >
          <form className="owner-profile-grid" onSubmit={saveProfile}>
            <div className="owner-form-panel">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="house-name">House name</label>
                  <input
                    id="house-name"
                    type="text"
                    value={formData.house_name}
                    onChange={(event) => updateField('house_name', event.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-number">Contact number</label>
                  <input
                    id="contact-number"
                    type="tel"
                    value={formData.contact_number}
                    onChange={(event) => updateField('contact_number', event.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="house-address">Address</label>
                <input
                  id="house-address"
                  type="text"
                  value={formData.address}
                  onChange={(event) => updateField('address', event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="facebook-page">Facebook page</label>
                <div className="owner-icon-input">
                  <LinkIcon size={16} />
                  <input
                    id="facebook-page"
                    type="url"
                    value={formData.facebook_page}
                    onChange={(event) => updateField('facebook_page', event.target.value)}
                    placeholder="https://facebook.com/your-page"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="house-description">Description</label>
                <textarea
                  id="house-description"
                  value={formData.description}
                  onChange={(event) => updateField('description', event.target.value.slice(0, 500))}
                  rows={4}
                  maxLength={500}
                />
                <small>{formData.description.length}/500</small>
              </div>

              <div className="form-group">
                <label>Cover photo</label>
                <label className="owner-upload-control">
                  <Camera size={18} />
                  <span>{coverFile ? coverFile.name : 'Change cover photo'}</span>
                  <input type="file" accept="image/*" onChange={onCoverChange} />
                </label>
              </div>

              <div className="form-group">
                <label>House amenities</label>
                <div className="amenity-check-grid">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <label key={amenity} className="owner-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.has(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                      />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
                <div className="owner-inline-add">
                  <input
                    type="text"
                    value={customAmenity}
                    onChange={(event) => setCustomAmenity(event.target.value)}
                    placeholder="Custom amenity"
                  />
                  <button type="button" className="btn-secondary" onClick={addCustomAmenity}>
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="house-rules">House rules</label>
                <textarea
                  id="house-rules"
                  value={formData.house_rules}
                  onChange={(event) => updateField('house_rules', event.target.value)}
                  rows={5}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>

            <aside className="owner-preview-panel">
              <div className="owner-cover-preview">
                {coverPreview ? (
                  <img src={coverPreview} alt="" />
                ) : (
                  <span>No cover photo</span>
                )}
              </div>
              <h3>{formData.house_name || 'Boarding house name'}</h3>
              <p>{formData.address || 'Address will appear here.'}</p>
              <div className="owner-chip-list">
                {(formData.amenities_list || []).map((amenity) => (
                  <span key={amenity}>{amenity}</span>
                ))}
              </div>
              <p className="owner-preview-rules">
                {formData.house_rules || 'House rules preview will appear here.'}
              </p>
            </aside>
          </form>
        </AsyncState>
      </ModuleCard>
    </AppShell>
  );
}
