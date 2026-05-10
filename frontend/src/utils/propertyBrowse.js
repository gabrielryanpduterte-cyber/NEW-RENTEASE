export const PROPERTY_TYPE_OPTIONS = [
  { value: '', label: 'All property types' },
  { value: 'boarding_house', label: 'Boarding House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'dormitory', label: 'Dormitory' },
  { value: 'condominium', label: 'Condominium' },
  { value: 'bedspace', label: 'Bedspace' },
  { value: 'other', label: 'Other' },
];

export function propertyTypeLabel(value) {
  return PROPERTY_TYPE_OPTIONS.find((option) => option.value === value)?.label || 'Boarding House';
}

function roomAmenities(room) {
  if (Array.isArray(room.room_amenities) && room.room_amenities.length > 0) {
    return room.room_amenities.map((item) => item.amenity_name).filter(Boolean);
  }

  if (Array.isArray(room.amenities)) {
    return room.amenities.filter(Boolean);
  }

  return String(room.amenities || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function roomToBrowseCard(room, property = null) {
  const amenities = roomAmenities(room);
  const photo = room.first_photo_url || room.photo_urls?.[0] || property?.cover_photo_url || property?.image || '';

  return {
    id: String(room.room_id),
    roomId: room.room_id,
    name: property?.house_name || room.house_name || 'Property',
    roomNumber: room.room_number || room.room_id,
    type: room.room_type || 'Room',
    rate: Number(room.monthly_rate || 0),
    capacity: Number(room.capacity || 1),
    occupiedCount: Number(room.occupied_count || 0),
    remainingCapacity: Number(room.remaining_capacity ?? room.capacity ?? 1),
    occupancySummary: room.occupancy_summary || '',
    amenities,
    available: String(room.availability_status || '').toLowerCase() === 'available',
    photo,
    raw: room,
  };
}

export function buildPropertyListings(houses = [], rooms = []) {
  const map = new Map();

  houses.forEach((house) => {
    const id = Number(house.boarding_house_id);
    if (!id) return;

    map.set(id, {
      ...house,
      boarding_house_id: id,
      property_type: house.property_type || 'boarding_house',
      rooms: [],
      availableRooms: [],
      roomTypes: [],
      amenities: Array.isArray(house.amenities_list) ? house.amenities_list : [],
      minRate: null,
      maxRate: null,
      totalCapacity: 0,
      image: house.cover_photo_url || '',
    });
  });

  rooms.forEach((room) => {
    const id = Number(room.boarding_house_id);
    if (!id) return;

    if (!map.has(id)) {
      map.set(id, {
        boarding_house_id: id,
        house_name: room.house_name || 'Property',
        property_type: 'boarding_house',
        address: '',
        description: '',
        house_rules: '',
        amenities: [],
        rooms: [],
        availableRooms: [],
        roomTypes: [],
        minRate: null,
        maxRate: null,
        totalCapacity: 0,
        image: room.first_photo_url || room.photo_urls?.[0] || '',
      });
    }

    const property = map.get(id);
    const normalizedRoom = roomToBrowseCard(room, property);
    property.rooms.push(normalizedRoom);
    if (normalizedRoom.available) {
      property.availableRooms.push(normalizedRoom);
    }
    if (normalizedRoom.type && !property.roomTypes.includes(normalizedRoom.type)) {
      property.roomTypes.push(normalizedRoom.type);
    }
    property.totalCapacity += normalizedRoom.capacity;
    if (!property.image && normalizedRoom.photo) {
      property.image = normalizedRoom.photo;
    }
    if (normalizedRoom.rate > 0) {
      property.minRate = property.minRate === null ? normalizedRoom.rate : Math.min(property.minRate, normalizedRoom.rate);
      property.maxRate = property.maxRate === null ? normalizedRoom.rate : Math.max(property.maxRate, normalizedRoom.rate);
    }
  });

  return Array.from(map.values()).sort((left, right) => {
    const leftAvailable = left.availableRooms.length;
    const rightAvailable = right.availableRooms.length;
    if (leftAvailable !== rightAvailable) {
      return rightAvailable - leftAvailable;
    }
    return String(left.house_name || '').localeCompare(String(right.house_name || ''));
  });
}

export function filterPropertyListings(properties, filters) {
  const search = filters.search.trim().toLowerCase();
  const maxPrice = filters.maxPrice === '' ? null : Number(filters.maxPrice);

  return properties.filter((property) => {
    const searchable = [
      property.house_name,
      property.address,
      property.description,
      propertyTypeLabel(property.property_type),
      ...property.roomTypes,
      ...property.amenities,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (search && !searchable.includes(search)) {
      return false;
    }
    if (filters.propertyType && property.property_type !== filters.propertyType) {
      return false;
    }
    if (maxPrice !== null && property.minRate !== null && property.minRate > maxPrice) {
      return false;
    }

    return true;
  });
}
