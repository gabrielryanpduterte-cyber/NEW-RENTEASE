import { describeApiError } from '../api/client.js';

export function asArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

export function formatCurrency(value) {
  const parsed = Number(value);
  const safeValue = Number.isFinite(parsed) ? parsed : 0;

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(safeValue);
}

export function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
  }).format(parsed);
}

export function formatDateTime(value) {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

export function errorMessage(error) {
  const fallback = describeApiError(error);
  const details = Array.isArray(error?.errors)
    ? error.errors.filter(Boolean)
    : [];

  if (details.length === 0) {
    return fallback;
  }

  return `${fallback} ${details[0]}`.trim();
}

export function statusClassName(value) {
  const status = String(value ?? '').toLowerCase();

  if (status === 'approved' || status === 'paid' || status === 'active' || status === 'available') {
    return 'pill-success';
  }

  if (status === 'pending' || status === 'pending_verification' || status === 'unpaid' || status === 'inactive' || status === 'occupied') {
    return 'pill-warning';
  }

  if (status === 'rejected' || status === 'revoked' || status === 'forbidden' || status === 'error') {
    return 'pill-danger';
  }

  if (status === 'cancelled' || status === 'archived' || status === 'no_record') {
    return 'pill-neutral';
  }

  return 'pill-neutral';
}
