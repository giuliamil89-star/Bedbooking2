const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Errore ${res.status}`);
  }
  return data;
}

export const api = {
  // Properties
  getProperties: () => request('/properties'),
  getProperty: (id) => request(`/properties/${id}`),
  createProperty: (body) => request('/properties', { method: 'POST', body: JSON.stringify(body) }),
  updateProperty: (id, body) => request(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProperty: (id) => request(`/properties/${id}`, { method: 'DELETE' }),

  // iCal feeds
  addFeed: (propertyId, body) => request(`/properties/${propertyId}/feeds`, { method: 'POST', body: JSON.stringify(body) }),
  deleteFeed: (feedId) => request(`/properties/feeds/${feedId}`, { method: 'DELETE' }),
  syncFeed: (feedId) => request(`/properties/feeds/${feedId}/sync`, { method: 'POST' }),
  syncAll: () => request('/sync', { method: 'POST' }),

  // Bookings
  getBookings: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/bookings${qs ? `?${qs}` : ''}`);
  },
  getArrivals: (days = 1) => request(`/bookings/arrivals?days=${days}`),
  createBooking: (body) => request('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  updateBooking: (id, body) => request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBooking: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),
};
