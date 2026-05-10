import { useEffect, useMemo, useState } from 'react';
import { Archive, Grid2X2, List, Pencil, Plus, RotateCcw } from 'lucide-react';
import { boardingHouseApi, roomsApi } from '../../api/client.js';
import AppShell from '../../components/AppShell.jsx';
import AsyncState from '../../components/AsyncState.jsx';
import ModuleCard from '../../components/ModuleCard.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, statusClassName } from '../../utils/format.js';

const EMPTY_ROOM = {
  boarding_house_id: '',
  room_number: '',
  room_type: 'Single',
  floor_number: '',
  capacity: '1',
  monthly_rate: '',
  availability_status: 'available',
  amenities: '',
  notes: '',
};

const FILTERS = ['all', 'available', 'occupied', 'archived'];

function toRoomForm(room, fallbackHouseId) {
  if (!room) {
    return { ...EMPTY_ROOM, boarding_house_id: fallbackHouseId || '' };
  }

  const amenities = Array.isArray(room.room_amenities)
    ? room.room_amenities.map((item) => item.amenity_name).join(', ')
    : room.amenities || '';

  return {
    boarding_house_id: String(room.boarding_house_id || fallbackHouseId || ''),
    room_number: room.room_number || '',
    room_type: room.room_type || 'Single',
    floor_number: room.floor_number ?? '',
    capacity: String(room.capacity || 1),
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
  const [photos, setPhotos] = useState([]);
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
  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        if (filter === 'all') return true;
        return String(room.availability_status || '').toLowerCase() === filter;
      }),
    [filter, rooms],
  );

  function openModal(room = null) {
    setEditingRoom(room);
    setFormData(toRoomForm(room, defaultHouseId));
    setPhotos([]);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingRoom(null);
    setPhotos([]);
  }

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function saveRoom(event) {
    event.preventDefault();
    setSaving(true);

    const body = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      body.append(key, value ?? '');
    });
    body.append(
      'amenities',
      JSON.stringify(
        formData.amenities
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
    photos.slice(0, 5).forEach((file) => body.append('photos[]', file));

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
                    <p><strong>Capacity:</strong> {room.capacity} tenant(s)</p>
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
                      <td>{room.capacity}</td>
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
            <form onSubmit={saveRoom}>
              <div className="form-row">
                <div className="form-group">
                  <label>Room number</label>
                  <input value={formData.room_number} onChange={(event) => updateField('room_number', event.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Room type</label>
                  <select value={formData.room_type} onChange={(event) => updateField('room_type', event.target.value)}>
                    <option>Single</option>
                    <option>Double</option>
                    <option>Shared</option>
                    <option>Studio</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Floor number</label>
                  <input type="number" min="0" value={formData.floor_number} onChange={(event) => updateField('floor_number', event.target.value)} />
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <input type="number" min="1" max="8" value={formData.capacity} onChange={(event) => updateField('capacity', event.target.value)} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Monthly rate</label>
                  <input type="number" min="0" step="0.01" value={formData.monthly_rate} onChange={(event) => updateField('monthly_rate', event.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.availability_status} onChange={(event) => updateField('availability_status', event.target.value)}>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="occupied">Occupied</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Amenities</label>
                <input
                  value={formData.amenities}
                  onChange={(event) => updateField('amenities', event.target.value)}
                  placeholder="WiFi, Cabinet, CR inside"
                />
              </div>

              <div className="form-group">
                <label>Photos</label>
                <label className="owner-upload-control">
                  <span>{photos.length > 0 ? `${photos.length} selected` : 'Drop photos here or click to browse'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => setPhotos(Array.from(event.target.files || []).slice(0, 5))}
                  />
                </label>
              </div>

              <div className="form-group">
                <label>Internal notes</label>
                <textarea value={formData.notes} onChange={(event) => updateField('notes', event.target.value)} rows={3} />
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
