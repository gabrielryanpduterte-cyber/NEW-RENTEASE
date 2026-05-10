export const publicHeroImage =
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1800&q=80';

export const authImage =
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1400&q=80';

export const featureImages = {
  study:
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
  payments:
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
  family:
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80',
};

export const featuredRooms = [
  {
    id: '101',
    roomNumber: '101',
    name: 'Single Study Room',
    type: 'Single',
    rate: 4500,
    capacity: 1,
    available: true,
    photo:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
    ],
    amenities: ['WiFi', 'Private study desk', 'Shared bathroom', 'Fan room'],
    description:
      'A quiet single room designed for focused study, with natural light, a sturdy desk, and easy access to shared house facilities.',
    rules: [
      'Quiet hours start at 10:00 PM.',
      'Visitors must be logged with the landlord.',
      'Keep shared spaces clean after use.',
      'Monthly rent is due every first week of the month.',
    ],
  },
  {
    id: '204',
    roomNumber: '204',
    name: 'Double Comfort Room',
    type: 'Double',
    rate: 6800,
    capacity: 2,
    available: true,
    photo:
      'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
    ],
    amenities: ['WiFi', 'Air conditioning', 'Private bathroom', 'Storage cabinet'],
    description:
      'A practical double room for classmates or siblings, with cooling, storage, and a comfortable layout for daily student life.',
    rules: [
      'Maximum of two registered tenants only.',
      'Air conditioning usage follows house energy policy.',
      'No overnight visitors without landlord approval.',
      'Report repairs through RentEase.',
    ],
  },
  {
    id: '305',
    roomNumber: '305',
    name: 'Shared Barkada Suite',
    type: 'Shared',
    rate: 8500,
    capacity: 3,
    available: false,
    photo:
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?auto=format&fit=crop&w=1200&q=80',
    ],
    amenities: ['WiFi', 'Shared bathroom', 'Bunk beds', 'Study nook'],
    description:
      'A larger shared room for students who want lower costs while staying close to campus and essential services.',
    rules: [
      'Maintain assigned bed and cabinet areas.',
      'No cooking appliances inside the room.',
      'Shared cleaning schedule must be followed.',
      'Respect roommates during study hours.',
    ],
  },
  {
    id: '402',
    roomNumber: '402',
    name: 'Premium Solo Room',
    type: 'Single',
    rate: 7200,
    capacity: 1,
    available: true,
    photo:
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=80',
    ],
    amenities: ['WiFi', 'Air conditioning', 'Private bathroom', 'Large desk'],
    description:
      'A private room with stronger comfort features for students who need reliable rest, privacy, and focused work space.',
    rules: [
      'Room is for one tenant only.',
      'Keep balcony and windows secured when leaving.',
      'Monthly inspection is scheduled with notice.',
      'No smoking anywhere in the property.',
    ],
  },
];

export const trustItems = [
  { label: 'Verified Properties', value: '42+' },
  { label: 'Real-time Availability', value: 'Live' },
  { label: 'Transparent Pricing', value: 'PHP' },
  { label: 'Parent Access', value: 'Secure' },
];

export const publicStats = [
  { label: 'Rooms Managed', value: '120+' },
  { label: 'Active Tenants', value: '300+' },
  { label: 'Years Serving Students', value: '8' },
  { label: 'Happy Residents', value: '4.8/5' },
];

export const testimonials = [
  {
    name: 'Mika, 2nd Year Student',
    quote:
      'RentEase made it easier to compare rooms before moving near campus. I could see the rent, rules, and availability in one place.',
    rating: 5,
  },
  {
    name: 'Mrs. Santos, Parent',
    quote:
      'The guardian view helped me check rent status without calling the landlord every week.',
    rating: 5,
  },
  {
    name: 'Alvin, Boarding House Owner',
    quote:
      'Reservations and payment tracking are easier to monitor now, especially during enrollment season.',
    rating: 4,
  },
];

export const faqs = [
  {
    question: 'How do students reserve a room?',
    answer:
      'Students browse properties first, compare available rooms inside each property, and submit a reservation request after signing in.',
  },
  {
    question: 'Can parents view rent and room status?',
    answer:
      'Yes. A parent account can be linked to a seeker account so guardians can view approved room, reservation, and rent status.',
  },
  {
    question: 'Are room prices visible before login?',
    answer:
      'Yes. Public room cards show monthly rates and availability so students can compare options quickly.',
  },
  {
    question: 'Can landlords manage rooms and payments?',
    answer:
      'Landlord accounts can manage room records, approve reservations, track tenants, and monitor rent collection.',
  },
];

export function findRoomById(roomId) {
  return featuredRooms.find((room) => room.id === String(roomId));
}
