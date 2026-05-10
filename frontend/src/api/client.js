const rawApiBase = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL =
  rawApiBase && rawApiBase.length > 0
    ? rawApiBase.replace(/\/+$/, '')
    : '/backend';

export class ApiError extends Error {
  constructor(message, status, errors = [], details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.details = details;
  }
}

function normalizeEndpoint(endpoint) {
  const clean = endpoint.replace(/^\/+/, '');
  return `${API_BASE_URL}/${clean}`;
}

function appendQuery(endpoint, query = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  if (!queryString) {
    return endpoint;
  }

  const joiner = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${joiner}${queryString}`;
}

export function normalizeApiAssetUrl(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const backendPath = '/rentease/backend';
  if (value.startsWith(backendPath)) {
    return `${API_BASE_URL}${value.slice(backendPath.length)}`;
  }

  const localBackendMatch = value.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/rentease\/backend(\/.*)$/i);
  if (localBackendMatch) {
    return `${API_BASE_URL}${localBackendMatch[1]}`;
  }

  return value;
}

function normalizeApiPayload(value) {
  if (typeof value === 'string') {
    return normalizeApiAssetUrl(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeApiPayload(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, normalizeApiPayload(nestedValue)]),
    );
  }

  return value;
}

async function parseApiResponse(response) {
  const text = await response.text();
  if (!text) {
    return {
      success: response.ok,
      message: response.ok ? 'Request completed.' : 'Request failed.',
      data: {},
      errors: [],
    };
  }

  try {
    return normalizeApiPayload(JSON.parse(text));
  } catch {
    return {
      success: false,
      message: 'Invalid server response.',
      data: {},
      errors: ['Response was not valid JSON.'],
    };
  }
}

export function describeApiError(error) {
  if (!(error instanceof ApiError)) {
    return 'Unexpected error occurred.';
  }

  if (error.status === 401) {
    return '401 Unauthorized: Please login again.';
  }
  if (error.status === 403) {
    return '403 Forbidden: Your role is not allowed for this action.';
  }
  if (error.status === 404) {
    return '404 Not Found: The requested record or endpoint does not exist.';
  }
  if (error.status === 500) {
    return '500 Server Error: Backend encountered an unexpected issue.';
  }
  if (error.status === 0) {
    return 'Network error: Unable to reach backend server.';
  }

  return error.message || 'Request failed.';
}

export async function apiRequest(endpoint, options = {}) {
  const method = options.method ?? 'GET';
  const url = normalizeEndpoint(appendQuery(endpoint, options.query));

  const headers = {
    ...(!(options.body instanceof FormData) && options.body
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(options.headers ?? {}),
  };

  // Add timeout to prevent hanging
  const timeout = options.timeout ?? 10000; // 10 seconds default
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body:
        options.body instanceof FormData
          ? options.body
          : options.body
            ? JSON.stringify(options.body)
            : undefined,
      signal: options.signal ?? controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError(
        'Request timeout - backend not responding.',
        0,
        ['Request took longer than ' + (timeout / 1000) + ' seconds. Check XAMPP Apache is running.'],
        { endpoint, method },
      );
    }

    throw new ApiError(
      'Unable to reach backend server.',
      0,
      [error?.message || 'Check API base URL, Vite proxy, and XAMPP status.'],
      { endpoint, method },
    );
  }

  const payload = await parseApiResponse(response);
  const message =
    payload.message ||
    (response.ok ? 'Request completed.' : 'Request failed.');
  const errors = Array.isArray(payload.errors) ? payload.errors : [];

  if (!response.ok || payload.success === false) {
    throw new ApiError(message, response.status, errors, { endpoint, method });
  }

  return payload;
}

export const authApi = {
  me: () => apiRequest('auth.php?action=me'),
  register: (payload) =>
    apiRequest('auth.php?action=register', {
      method: 'POST',
      body: payload,
    }),
  login: (credentials) =>
    apiRequest('auth.php?action=login', {
      method: 'POST',
      body: credentials,
    }),
  logout: () =>
    apiRequest('auth.php?action=logout', {
      method: 'POST',
      body: {},
    }),
  updateProfile: (payload) =>
    apiRequest('auth.php?action=update_profile', {
      method: 'POST',
      body: payload,
    }),
  changePassword: (payload) =>
    apiRequest('auth.php?action=change_password', {
      method: 'POST',
      body: payload,
    }),
};

export const usersApi = {
  list: (query = {}) => apiRequest('users.php', { query }),
  get: (userId) => apiRequest('users.php', { query: { user_id: userId } }),
  create: (payload) =>
    apiRequest('users.php', {
      method: 'POST',
      body: payload,
    }),
  update: (userId, payload) =>
    apiRequest('users.php', {
      method: 'PATCH',
      query: { user_id: userId },
      body: payload,
    }),
  deactivate: (userId) =>
    apiRequest('users.php', {
      method: 'DELETE',
      query: { user_id: userId },
    }),
};

export const boardingHouseApi = {
  list: (query = {}) => apiRequest('boarding_house.php', { query }),
  get: (boardingHouseId) =>
    apiRequest('boarding_house.php', {
      query: { boarding_house_id: boardingHouseId },
    }),
  create: (payload) =>
    apiRequest('boarding_house.php', {
      method: 'POST',
      body: payload,
    }),
  update: (boardingHouseId, payload) =>
    apiRequest('boarding_house.php', {
      method: 'POST',
      query: { action: 'update', boarding_house_id: boardingHouseId },
      body: payload,
    }),
  remove: (boardingHouseId) =>
    apiRequest('boarding_house.php', {
      method: 'DELETE',
      query: { boarding_house_id: boardingHouseId },
    }),
};

export const roomsApi = {
  list: (query = {}) => apiRequest('rooms.php', { query }),
  get: (roomId) => apiRequest('rooms.php', { query: { room_id: roomId } }),
  create: (payload) =>
    apiRequest('rooms.php', {
      method: 'POST',
      body: payload,
    }),
  update: (roomId, payload) =>
    apiRequest('rooms.php', {
      method: 'POST',
      query: { action: 'update', room_id: roomId },
      body: payload,
    }),
  archive: (roomId) =>
    apiRequest('rooms.php', {
      method: 'POST',
      query: { action: 'archive', room_id: roomId },
      body: {},
    }),
  unarchive: (roomId) =>
    apiRequest('rooms.php', {
      method: 'POST',
      query: { action: 'unarchive', room_id: roomId },
      body: {},
    }),
  uploadPhotos: (roomId, formData) =>
    apiRequest('rooms.php', {
      method: 'POST',
      query: { action: 'upload_photos', room_id: roomId },
      body: formData,
    }),
  remove: (roomId) =>
    apiRequest('rooms.php', {
      method: 'DELETE',
      query: { room_id: roomId },
    }),
};

export const reservationsApi = {
  list: (query = {}) => apiRequest('reservations.php', { query }),
  get: (reservationId) =>
    apiRequest('reservations.php', { query: { reservation_id: reservationId } }),
  create: (payload) =>
    apiRequest('reservations.php', {
      method: 'POST',
      body: payload,
    }),
  update: (reservationId, payload) =>
    apiRequest('reservations.php', {
      method: 'PATCH',
      query: { reservation_id: reservationId },
      body: payload,
    }),
  approve: (reservationId) =>
    apiRequest('reservations.php', {
      method: 'POST',
      query: { action: 'approve', reservation_id: reservationId },
      body: {},
    }),
  reject: (reservationId, rejectionRemarks) =>
    apiRequest('reservations.php', {
      method: 'POST',
      query: { action: 'reject', reservation_id: reservationId },
      body: { rejection_remarks: rejectionRemarks },
    }),
  cancel: (reservationId, payload = {}) =>
    apiRequest('reservations.php', {
      method: 'PATCH',
      query: { reservation_id: reservationId, action: 'cancel' },
      body: payload,
    }),
  remove: (reservationId) =>
    apiRequest('reservations.php', {
      method: 'DELETE',
      query: { reservation_id: reservationId },
    }),
};

export const paymentsApi = {
  list: (query = {}) => apiRequest('payments.php', { query }),
  get: (paymentId) => apiRequest('payments.php', { query: { payment_id: paymentId } }),
  create: (payload) =>
    apiRequest('payments.php', {
      method: 'POST',
      body: payload,
    }),
  update: (paymentId, payload) =>
    apiRequest('payments.php', {
      method: 'PATCH',
      query: { payment_id: paymentId },
      body: payload,
    }),
  uploadProof: (paymentId, formData) =>
    apiRequest('payments.php', {
      method: 'POST',
      query: { action: 'upload_proof', payment_id: paymentId },
      body: formData,
    }),
  proofUrl: (paymentId) =>
    normalizeEndpoint(appendQuery('payments.php', { action: 'proof', payment_id: paymentId })),
  remove: (paymentId) =>
    apiRequest('payments.php', {
      method: 'DELETE',
      query: { payment_id: paymentId },
    }),
};

export const activityLogsApi = {
  list: (query = {}) => apiRequest('activity_logs.php', { query }),
  get: (logId) => apiRequest('activity_logs.php', { query: { log_id: logId } }),
  create: (payload) =>
    apiRequest('activity_logs.php', {
      method: 'POST',
      body: payload,
    }),
  remove: (logId) =>
    apiRequest('activity_logs.php', {
      method: 'DELETE',
      query: { log_id: logId },
    }),
};

export const errorLogsApi = {
  list: (query = {}) => apiRequest('error_logs.php', { query }),
  get: (errorId) => apiRequest('error_logs.php', { query: { error_id: errorId } }),
  create: (payload) =>
    apiRequest('error_logs.php', {
      method: 'POST',
      body: payload,
    }),
  remove: (errorId) =>
    apiRequest('error_logs.php', {
      method: 'DELETE',
      query: { error_id: errorId },
    }),
};

export const reportsApi = {
  get: (query = {}) => apiRequest('reports.php', { query }),
};

export const ownerDashboardApi = {
  get: () => apiRequest('owner_dashboard.php'),
};

export const billingApi = {
  list: (query = {}) => apiRequest('billing.php', { query }),
  preview: (month) =>
    apiRequest('billing.php', {
      query: { action: 'preview', month },
    }),
  generate: (month) =>
    apiRequest('billing.php', {
      method: 'POST',
      query: { action: 'generate' },
      body: { month },
    }),
  markPaid: (billingCycleId, payload) =>
    apiRequest('billing.php', {
      method: 'POST',
      query: { action: 'pay', billing_cycle_id: billingCycleId },
      body: payload,
    }),
  markUnpaid: (paymentId, reason = '') =>
    apiRequest('billing.php', {
      method: 'PATCH',
      query: { action: 'unpaid', payment_id: paymentId },
      body: { reason },
    }),
};

export const tenantsApi = {
  list: (query = {}) => apiRequest('tenants.php', { query }),
  get: (tenantId) => apiRequest('tenants.php', { query: { tenant_id: tenantId } }),
};

export const feedbackApi = {
  list: (query = {}) => apiRequest('feedback.php', { query }),
  get: (feedbackId) =>
    apiRequest('feedback.php', {
      query: { feedback_id: feedbackId },
    }),
  create: (payload) =>
    apiRequest('feedback.php', {
      method: 'POST',
      body: payload,
    }),
  update: (feedbackId, payload) =>
    apiRequest('feedback.php', {
      method: 'PATCH',
      query: { feedback_id: feedbackId },
      body: payload,
    }),
  remove: (feedbackId) =>
    apiRequest('feedback.php', {
      method: 'DELETE',
      query: { feedback_id: feedbackId },
    }),
};

export const uploadsApi = {
  list: (query = {}) => apiRequest('uploads.php', { query }),
  create: (formData) =>
    apiRequest('uploads.php', {
      method: 'POST',
      body: formData,
    }),
  remove: (uploadId) =>
    apiRequest('uploads.php', {
      method: 'DELETE',
      query: { upload_id: uploadId },
    }),
};

export const accountLinksApi = {
  list: (query = {}) => apiRequest('account_links.php', { query }),
  get: (linkId) =>
    apiRequest('account_links.php', {
      query: { link_id: linkId },
    }),
  create: (payload) =>
    apiRequest('account_links.php', {
      method: 'POST',
      body: payload,
    }),
  update: (linkId, payload) =>
    apiRequest('account_links.php', {
      method: 'PATCH',
      query: { link_id: linkId },
      body: payload,
    }),
  remove: (linkId) =>
    apiRequest('account_links.php', {
      method: 'DELETE',
      query: { link_id: linkId },
    }),
};

export const seekerDashboardApi = {
  dashboard: () => apiRequest('seeker_dashboard.php?action=dashboard'),
  room: () => apiRequest('seeker_dashboard.php?action=room'),
};

export const guardianLinksApi = {
  list: () => apiRequest('guardian_links.php'),
  create: (payload) =>
    apiRequest('guardian_links.php', {
      method: 'POST',
      body: payload,
    }),
  revoke: (guardianLinkId) =>
    apiRequest('guardian_links.php', {
      method: 'DELETE',
      query: { guardian_link_id: guardianLinkId },
    }),
  publicView: (token) =>
    apiRequest('guardian_links.php', {
      query: { action: 'public', token },
    }),
};
