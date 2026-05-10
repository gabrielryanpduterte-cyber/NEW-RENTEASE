import { useEffect, useMemo, useState } from 'react';
import { Archive, Grid2X2, ImagePlus, Info, List, Pencil, Plus, RotateCcw, X } from 'lucide-react';
import { boardingHouseApi, roomsApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import AsyncState from '../../components/AsyncState.jsx';
import ModuleCard from '../../components/ModuleCard.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, statusClassName } from '../../utils/format.js';
import { IMAGE_UPLOAD_ACCEPT, prepareUploadFiles } from '../../utils/imageUpload.js';

const EMPTY_ROOM = {
  boarding_house_id: '',
  room_number: '',
  room_type: 'Single',
  floor_number: '',
  capacity: '1',
  monthly_rate: '',
  availability_status: 'available',
  amenities: [],
  notes: '',
};

const FILTERS = ['all', 'available', 'occupied', 'archived'];
const MAX_ROOM_PHOTOS = 10;
const ROOM_AMENITY_OPTIONS = [
  'Bed frame',
  'Foam / mattress',
  'Cabinet / locker',
  'Study table',
  'Chair',
  'Electric fan',
  'Air-conditioning',
  'Private CR',
  'Shared CR access',
  'WiFi access',
  'Power outlet',
  'Curtain / privacy divider',
];
const ROOM_TYPE_HELP = [
  { value: 'Single', description: 'Best for one tenant who wants a private room.' },
  { value: 'Double', description: 'Designed for two tenants sharing one room.' },
  { value: 'Shared', description: 'Good for bedspace-style rooms with several tenants.' },
  { value: 'Studio', description: 'A self-contained room, often with more private space.' },
];
const STATUS_HELP = [
  { value: 'available', label: 'Available', description: 'Seekers can still see and reserve this room while slots remain.' },
  { value: 'unavailable', label: 'Unavailable', description: 'Hide the room temporarily for repair, cleaning, or owner review.' },
  { value: 'occupied', label: 'Occupied', description: 'Use only when the room is already full.' },
  { value: 'archived', label: 'Archived', description: 'Remove from active management without deleting history.' },
];
const FIXED_CAPACITY_BY_TYPE = {
  Single: '1',
  Double: '2',
};

function fixedCapacityFor(roomType) {
  return FIXED_CAPACITY_BY_TYPE[normalizeRoomType(roomType)] || '';
}

function normalizeRoomType(roomType) {
  const value = String(roomType || '').trim();
  return ROOM_TYPE_HELP.find((item) => item.value.toLowerCase() === value.toLowerCase())?.value || 'Single';
}

function normalizeAmenities(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : item?.amenity_name || item?.name || ''))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toRoomForm(room, fallbackHouseId) {
  if (!room) {
    return { ...EMPTY_ROOM, boarding_house_id: fallbackHouseId || '' };
  }

  const amenities = Array.isArray(room.room_amenities)
    ? normalizeAmenities(room.room_amenities)
    : normalizeAmenities(room.amenities);
  const roomType = normalizeRoomType(room.room_type || 'Single');
  const fixedCapacity = fixedCapacityFor(roomType);

  return {
    boarding_house_id: String(room.boarding_house_id || fallbackHouseId || ''),
    room_number: room.room_number || '',
    room_type: roomType,
    floor_number: room.floor_number ?? '',
    capacity: fixedCapacity || String(room.capacity || 1),
    monthly_rate: String(room.monthly_rate || ''),
    availability_status: room.availability_status || 'available',
    amenities,
    notes: room.notes || '',
  };
}

export default function ManageRoomsPage() {
  const { showToast } = useToast();
  const [roomsState, setRoomsState] = useState({ loading: true, error: null, items: [] });
  const [houses, setHouses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState(EMPTY_ROOM);
  const [customRoomAmenity, setCustomRoomAmenity] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoStatus, setPhotoStatus] = useState('');
  const [preparingPhotos, setPreparingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionPendingId, setActionPendingId] = useState(null);

  async function loadData() {
    setRoomsState((current) => ({ ...current, loading: true, error: null }));

    try {
      const [roomsPayload, housesPayload] = await Promise.all([
        roomsApi.list({ include_archived: 1 }),
        boardingHouseApi.list(),
      ]);
      const nextHouses = Array.isArray(housesPayload.data) ? housesPayload.data : [];
      setHouses(nextHouses);
      setRoomsState({
        loading: false,
        error: null,
        items: Array.isArray(roomsPayload.data) ? roomsPayload.data : [],
      });
    } catch (error) {
      setRoomsState({ loading: false, error, items: [] });
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadData();
    });
  }, []);

  const defaultHouseId = houses[0]?.boarding_house_id ? String(houses[0].boarding_house_id) : '';
  const rooms = roomsState.items;
  const currentPhotoUrls = Array.isArray(editingRoom?.photo_urls) ? editingRoom.photo_urls : [];
  const remainingPhotoSlots = Math.max(MAX_ROOM_PHOTOS - currentPhotoUrls.length, 0);
  const photoPreviews = useMemo(
    () => photos.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [photos],
  );
  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        if (filter === 'all') return true;
        return String(room.availability_status || '').toLowerCase() === filter;
      }),
    [filter, rooms],
  );
  const selectedRoomAmenities = useMemo(() => new Set(formData.amenities || []), [formData.amenities]);
  const lockedCapacity = fixedCapacityFor(formData.room_type);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [photoPreviews]);

  function openModal(room = null) {
    setEditingRoom(room);
    setFormData(toRoomForm(room, defaultHouseId));
    setPhotos([]);
    setPhotoStatus('');
    setCustomRoomAmenity('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingRoom(null);
    setPhotos([]);
    setPhotoStatus('');
    setCustomRoomAmenity('');
  }

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function chooseRoomType(roomType) {
    const fixedCapacity = fixedCapacityFor(roomType);
    setFormData((current) => ({
      ...current,
      room_type: roomType,
      capacity: fixedCapacity || current.capacity,
    }));
  }

  function chooseStatus(status) {
    setFormData((current) => ({ ...current, availability_status: status }));
  }

  function warnLockedCapacity() {
    if (!lockedCapacity) return;
    showToast(`${formData.room_type} room type has a fixed capacity of ${lockedCapacity}. Choose Shared or Studio to edit capacity.`, 'warning');
  }

  async function handlePhotoChange(event) {
    const selectedFiles = Array.from(event.target.files || []);
    const selected = selectedFiles.slice(0, remainingPhotoSlots || 5);
    const skippedCount = Math.max(selectedFiles.length - selected.length, 0);
    setPhotoStatus('');

    if (remainingPhotoSlots <= 0) {
      setPhotos([]);
      setPhotoStatus(`This room already has ${MAX_ROOM_PHOTOS} photos. Remove an existing photo before adding more.`);
      event.target.value = '';
      return;
    }

    if (selected.length === 0) {
      setPhotos([]);
      return;
    }

    setPreparingPhotos(true);
    try {
      const prepared = await prepareUploadFiles(selected, {
        maxSizeMB: 2,
        maxWidth: 1600,
        maxHeight: 1600,
        allowPdf: false,
      });
      setPhotos(prepared.files);
      const limitMessage = skippedCount > 0 ? ` Only ${remainingPhotoSlots} more photo(s) can be added.` : '';
      setPhotoStatus(
        prepared.messages.length > 0
          ? `Photos converted to JPG for upload.${limitMessage}`
          : `${prepared.files.length} photo(s) ready.${limitMessage}`,
      );
      event.target.value = '';
    } catch (error) {
      setPhotos([]);
      setPhotoStatus(error?.message || 'Unable to prepare selected photos.');
      event.target.value = '';
    } finally {
      setPreparingPhotos(false);
    }
  }

  function removeSelectedPhoto(indexToRemove) {
    setPhotos((current) => current.filter((_, index) => index !== indexToRemove));
    setPhotoStatus((current) => (current ? current : 'Selected photo removed.'));
  }

  function toggleRoomAmenity(amenity) {
    setFormData((current) => {
      const next = new Set(current.amenities || []);
      if (next.has(amenity)) {
        next.delete(amenity);
      } else {
        next.add(amenity);
      }
      return { ...current, amenities: Array.from(next) };
    });
  }

  function addCustomRoomAmenity() {
    const value = customRoomAmenity.trim();
    if (!value) return;

    setFormData((current) => ({
      ...current,
      amenities: Array.from(new Set([...(current.amenities || []), value])),
    }));
    setCustomRoomAmenity('');
  }

  async function saveRoom(event) {
    event.preventDefault();
    setSaving(true);

    const body = new FormData();
    const submitData = {
      ...formData,
      room_type: normalizeRoomType(formData.room_type),
      capacity: fixedCapacityFor(formData.room_type) || formData.capacity,
    };

    Object.entries(submitData).forEach(([key, value]) => {
      if (key !== 'amenities') {
        body.append(key, value ?? '');
      }
    });
    body.append('amenities', JSON.stringify(submitData.amenities || []));
    photos.slice(0, MAX_ROOM_PHOTOS).forEach((file) => body.append('photos[]', file));

    try {
      if (editingRoom?.room_id) {
        await roomsApi.update(editingRoom.room_id, body);
      } else {
        await roomsApi.create(body);
      }
      showToast(`Room ${editingRoom ? 'updated' : 'created'} successfully.`, 'success');
      closeModal();
      await loadData();
    } catch (error) {
      showToast(error?.errors?.[0] || error?.message || 'Unable to save room.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function archiveRoom(room) {
    setActionPendingId(room.room_id);
    try {
      if (room.availability_status === 'archived') {
        await roomsApi.unarchive(room.room_id);
        showToast('Room unarchived.', 'success');
      } else {
        await roomsApi.archive(room.room_id);
        showToast('Room archived.', 'success');
      }
      await loadData();
    } catch (error) {
      showToast(error?.errors?.[0] || error?.message || 'Unable to update room archive status.', 'error');
    } finally {
      setActionPendingId(null);
    }
  }

  return (
    <AppShell
      title="Room Management"
      subtitle="Add rooms, update rates and amenities, and archive rooms without deleting history."
    >
      <ModuleCard
        id="owner-rooms"
        title="Rooms"
        description="Manage availability, capacity, monthly rates, and internal notes."
        actions={
          <button type="button" className="btn-primary" onClick={() => openModal()}>
            <Plus size={16} /> Add Room
          </button>
        }
      >
        <div className="owner-toolbar">
          <div className="filter-tabs">
            {FILTERS.map((item) => (
              <button
                type="button"
                key={item}
                className={filter === item ? 'active' : ''}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="view-toggle">
            <button type="button" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>
              <Grid2X2 size={16} /> Grid
            </button>
            <button type="button" className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>
              <List size={16} /> Table
            </button>
          </div>
        </div>

        <AsyncState
          loading={roomsState.loading}
          error={roomsState.error}
          isEmpty={filteredRooms.length === 0}
          loadingText="Loading rooms..."
          emptyText="No rooms found for this filter."
          onRetry={loadData}
        >
          {view === 'grid' ? (
            <div className="rooms-grid">
              {filteredRooms.map((room) => (
                <article
                  className={`room-card ${room.availability_status === 'archived' ? 'room-card-archived' : ''}`}
                  key={room.room_id}
                >
                  <div className="owner-room-photo">
                    {room.first_photo_url ? <img src={room.first_photo_url} alt="" /> : <span>Room {room.room_number}</span>}
                    <span className={`status-pill ${statusClassName(room.availability_status)}`}>
                      {room.availability_status}
                    </span>
                  </div>
                  <div className="room-header">
                    <h3>Room {room.room_number}</h3>
                    <strong>{formatCurrency(room.monthly_rate)}</strong>
                  </div>
                  <div className="room-details">
                    <p><strong>Type:</strong> {room.room_type}</p>
                    <p><strong>Floor:</strong> {room.floor_number ?? 'N/A'}</p>
                    <p><strong>Capacity:</strong> {room.occupied_count || 0}/{room.capacity} tenant(s)</p>
                    <p><strong>Slots left:</strong> {room.remaining_capacity ?? room.capacity}</p>
                    <p><strong>Occupant:</strong> {room.occupant_name || '-'}</p>
                  </div>
                  <div className="room-actions">
                    <button type="button" className="btn-secondary" onClick={() => openModal(room)}>
                      <Pencil size={15} /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => archiveRoom(room)}
                      disabled={actionPendingId === room.room_id}
                    >
                      {room.availability_status === 'archived' ? <RotateCcw size={15} /> : <Archive size={15} />}
                      {room.availability_status === 'archived' ? 'Unarchive' : 'Archive'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Type</th>
                    <th>Floor</th>
                    <th>Capacity</th>
                    <th>Slots Left</th>
                    <th>Rate</th>
                    <th>Status</th>
                    <th>Occupant</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room) => (
                    <tr key={room.room_id}>
                      <td>{room.room_number}</td>
                      <td>{room.room_type}</td>
                      <td>{room.floor_number ?? '-'}</td>
                      <td>{room.occupied_count || 0}/{room.capacity}</td>
                      <td>{room.remaining_capacity ?? room.capacity}</td>
                      <td>{formatCurrency(room.monthly_rate)}</td>
                      <td>
                        <span className={`status-pill ${statusClassName(room.availability_status)}`}>
                          {room.availability_status}
                        </span>
                      </td>
                      <td>{room.occupant_name || '-'}</td>
                      <td className="row-actions">
                        <button type="button" className="button-light" onClick={() => openModal(room)}>Edit</button>
                        <button
                          type="button"
                          className="button-light"
                          onClick={() => archiveRoom(room)}
                          disabled={actionPendingId === room.room_id}
                        >
                          {room.availability_status === 'archived' ? 'Unarchive' : 'Archive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AsyncState>
      </ModuleCard>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content owner-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add Room'}</h2>
              <button type="button" className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={saveRoom} className="owner-room-form">
              <div className="form-row owner-room-basic-row">
                <div className="form-group">
                  <label>Room number</label>
                  <input value={formData.room_number} onChange={(event) => updateField('room_number', event.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Room type</label>
                  <div className="owner-choice-grid room-type-choice-grid">
                    {ROOM_TYPE_HELP.map((item) => (
                      <button
                        type="button"
                        key={item.value}
                        className={`owner-choice-card ${formData.room_type === item.value ? 'active' : ''}`}
                        onClick={() => chooseRoomType(item.value)}
                        aria-pressed={formData.room_type === item.value}
                      >
                        <strong>
                          <Info size={14} />
                          {item.value}
                        </strong>
                        <small>{item.description}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Floor number</label>
                  <input type="number" min="0" max="10" value={formData.floor_number} onChange={(event) => updateField('floor_number', event.target.value)} placeholder="Example: 2" />
                  <small className="owner-field-hint">Use 0 for ground floor. Maximum is 10 floors for now.</small>
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.capacity}
                    readOnly={Boolean(lockedCapacity)}
                    className={lockedCapacity ? 'is-readonly' : ''}
                    onClick={warnLockedCapacity}
                    onChange={(event) => {
                      if (lockedCapacity) {
                        warnLockedCapacity();
                        return;
                      }
                      updateField('capacity', event.target.value);
                    }}
                    required
                  />
                  <small className={`owner-field-hint ${lockedCapacity ? 'warning' : ''}`}>
                    {lockedCapacity
                      ? `${formData.room_type} rooms use a fixed capacity of ${lockedCapacity}. Choose Shared or Studio if this room has more tenants.`
                      : 'Capacity means how many tenants can live in this room. Example: 3 capacity = 3 tenants max.'}
                  </small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Monthly rate</label>
                  <input type="number" min="0" step="100" value={formData.monthly_rate} onChange={(event) => updateField('monthly_rate', event.target.value)} placeholder="0, 100, 200..." required />
                  <small className="owner-field-hint">Use the monthly rent per tenant or per room based on how you bill this room.</small>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <div className="owner-choice-grid status-choice-grid">
                    {STATUS_HELP.map((item) => (
                      <button
                        type="button"
                        key={item.value}
                        className={`owner-choice-card ${formData.availability_status === item.value ? 'active' : ''}`}
                        onClick={() => chooseStatus(item.value)}
                        aria-pressed={formData.availability_status === item.value}
                      >
                        <strong>
                          <Info size={14} />
                          {item.label}
                        </strong>
                        <small>{item.description}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Amenities</label>
                <div className="amenity-check-grid room-amenity-grid">
                  {ROOM_AMENITY_OPTIONS.map((amenity) => (
                    <label key={amenity} className="owner-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedRoomAmenities.has(amenity)}
                        onChange={() => toggleRoomAmenity(amenity)}
                      />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
                <div className="owner-inline-add">
                  <input
                    type="text"
                    value={customRoomAmenity}
                    onChange={(event) => setCustomRoomAmenity(event.target.value)}
                    placeholder="Add custom room amenity"
                  />
                  <button type="button" className="btn-secondary" onClick={addCustomRoomAmenity}>
                    <Plus size={16} /> Add
                  </button>
                </div>
                {formData.amenities?.length > 0 && (
                  <div className="owner-chip-list">
                    {formData.amenities.map((amenity) => (
                      <span key={amenity}>{amenity}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Photos</label>
                <label className="owner-upload-control">
                  <ImagePlus size={18} />
                  <span>
                    {preparingPhotos
                      ? 'Converting photos...'
                      : photos.length > 0
                        ? `${photos.length} selected`
                        : remainingPhotoSlots <= 0
                          ? 'Photo limit reached'
                          : 'Select multiple room photos'}
                  </span>
                  <input
                    type="file"
                    accept={IMAGE_UPLOAD_ACCEPT}
                    multiple
                    onChange={handlePhotoChange}
                    disabled={preparingPhotos || remainingPhotoSlots <= 0}
                  />
                </label>
                <small className="owner-field-hint">You can select multiple photos at once. The system converts compatible photos for upload and keeps up to {MAX_ROOM_PHOTOS} room photos.</small>
                {photoStatus && <small className="re-upload-note">{photoStatus}</small>}
                {currentPhotoUrls.length > 0 && (
                  <div className="owner-upload-preview-block">
                    <span>Current photos</span>
                    <div className="owner-photo-preview-grid">
                      {currentPhotoUrls.map((photoUrl, index) => (
                        <img key={photoUrl || index} src={photoUrl} alt={`Current room ${index + 1}`} />
                      ))}
                    </div>
                  </div>
                )}
                {photoPreviews.length > 0 && (
                  <div className="owner-upload-preview-block">
                    <span>Selected photos</span>
                    <div className="owner-photo-preview-grid">
                      {photoPreviews.map((preview, index) => (
                        <div className="owner-photo-preview-item" key={preview.url}>
                          <img src={preview.url} alt={preview.name} />
                          <button type="button" onClick={() => removeSelectedPhoto(index)} aria-label={`Remove ${preview.name}`}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Internal notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  rows={3}
                  placeholder="Example: Upper bunk near window, repaint before next tenant, key is with caretaker."
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Room'}
                </button>
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
