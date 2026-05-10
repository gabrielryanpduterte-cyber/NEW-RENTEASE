const STATUS_LABELS = {
  available: 'Available',
  occupied: 'Occupied',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
  unpaid: 'Unpaid',
  archived: 'Archived',
  no_record: 'No Record',
  active: 'Active',
  inactive: 'Inactive',
};

function normalizeStatus(value) {
  return String(value || 'pending').toLowerCase();
}

export default function StatusPill({ variant, children }) {
  const normalized = normalizeStatus(variant);
  return (
    <span className={`re-status-pill re-status-${normalized}`}>
      {children || STATUS_LABELS[normalized] || normalized}
    </span>
  );
}
