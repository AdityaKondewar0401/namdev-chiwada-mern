import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nc_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nc_token');
      localStorage.removeItem('nc_user');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export default api;

/* ===============================
   Auth
================================= */
export const authAPI = {
  register: (data) =>
    api.post('/api/auth/register', data),

  login: (data) =>
    api.post('/api/auth/login', data),

  getMe: () =>
    api.get('/api/auth/me'),

  updateProfile: (data) =>
    api.put('/api/auth/profile', data),
};

/* ===============================
   Products
================================= */
export const productAPI = {
  getAll: (params) =>
    api.get('/api/products', { params }),

  getOne: (id) =>
    api.get(`/api/products/${id}`),

  create: (data) =>
    api.post('/api/products', data),

  update: (id, data) =>
    api.put(`/api/products/${id}`, data),

  delete: (id) =>
    api.delete(`/api/products/${id}`),
};

/* ===============================
   Cart
================================= */
export const cartAPI = {
  get: () =>
    api.get('/api/cart'),

  add: (data) =>
    api.post('/api/cart', data),

  // FIXED for steppers
  update: (
    productId,
    size,
    quantity
  ) =>
    api.put('/api/cart', {
      productId,
      size,
      quantity,
    }),

  remove: (itemId) =>
    api.delete(`/api/cart/${itemId}`),

  clear: () =>
    api.delete('/api/cart'),
};

/* ===============================
   Orders
================================= */
export const orderAPI = {
  place: (data) =>
    api.post('/api/orders', data),

  getAll: () =>
    api.get('/api/orders'),

  getOne: (id) =>
    api.get(`/api/orders/${id}`),

  validatePromo: (data) =>
    api.post(
      '/api/orders/validate-promo',
      data
    ),
};

/* ===============================
   Shipping (Shadowfax)
================================= */
export const shippingAPI = {
  // Public — no auth required. Returns { serviceable, services }.
  // `serviceable` is `null` (not true/false) if the check itself failed,
  // so the caller can tell "not serviceable" apart from "couldn't check".
  checkPincode: (pincode) =>
    api.get('/api/shipping/check-pincode', { params: { pincode } }),

  // Admin-only order-level shipment actions
  resyncTracking: (orderId) =>
    api.post(`/api/shipping/orders/${orderId}/resync`),

  createShipment: (orderId) =>
    api.post(`/api/shipping/orders/${orderId}/create-shipment`),

  cancelShipment: (orderId, remarks) =>
    api.post(`/api/shipping/orders/${orderId}/cancel-shipment`, { remarks }),

  escalate: (orderId, issueCategory) =>
    api.post(`/api/shipping/orders/${orderId}/escalate`, { issueCategory }),

  getPod: (orderId) =>
    api.get(`/api/shipping/orders/${orderId}/pod`),

  // Admin-only consignment-level shipment actions (same Shadowfax flow,
  // extended to partner bulk dispatches — see server/services/consignmentShipping.js)
  resyncConsignmentTracking: (consignmentId) =>
    api.post(`/api/shipping/consignments/${consignmentId}/resync`),

  createConsignmentShipment: (consignmentId) =>
    api.post(`/api/shipping/consignments/${consignmentId}/create-shipment`),

  cancelConsignmentShipment: (consignmentId, remarks) =>
    api.post(`/api/shipping/consignments/${consignmentId}/cancel-shipment`, { remarks }),
};

/* ===============================
   Wishlist
================================= */
export const wishlistAPI = {
  get: () =>
    api.get('/api/wishlist'),

  toggle: (id) =>
    api.post(`/api/wishlist/${id}`),
};

/* ===============================
   Partners (Admin — Phase 1)
================================= */
export const partnerAPI = {
  getAll: () =>
    api.get('/api/partners'),

  getOne: (id) =>
    api.get(`/api/partners/${id}`),

  create: (data) =>
    api.post('/api/partners', data),

  update: (id, data) =>
    api.put(`/api/partners/${id}`, data),

  delete: (id) =>
    api.delete(`/api/partners/${id}`),

  getInviteLink: (id) =>
    api.post(`/api/partners/${id}/invite-link`),
};

/* ===============================
   Distributor Portal (Phase 2 — logged-in partner's own view)
================================= */
export const partnerPortalAPI = {
  setPassword: (token, password) =>
    api.post('/api/partner/set-password', { token, password }),

  getMe: () =>
    api.get('/api/partner/me'),

  getConsignments: () =>
    api.get('/api/partner/consignments'),

  createPaymentOrder: (paymentId) =>
    api.post(`/api/partner/payments/${paymentId}/create-order`),

  verifyPayment: (paymentId, data) =>
    api.post(`/api/partner/payments/${paymentId}/verify`, data),

  getProducts: () =>
    api.get('/api/partner/products'),

  createOrder: (data) =>
    api.post('/api/partner/orders', data),

  getMyOrders: () =>
    api.get('/api/partner/orders'),
};
export const consignmentAPI = {
  getAll: () =>
    api.get('/api/consignments'),

  getOne: (id) =>
    api.get(`/api/consignments/${id}`),

  create: (data) =>
    api.post('/api/consignments', data),

  getDues: () =>
    api.get('/api/consignments/dues'),

  runReminders: () =>
    api.post('/api/consignments/reminders/run'),

  markPaymentPaid: (paymentId) =>
    api.put(`/api/consignments/payments/${paymentId}/mark-paid`),
};

/* ===============================
   Partner Order Requests (admin review queue)
================================= */
export const partnerOrderAPI = {
  getAll: () =>
    api.get('/api/partner-orders'),

  approve: (id, data) =>
    api.post(`/api/partner-orders/${id}/approve`, data),

  reject: (id, data) =>
    api.post(`/api/partner-orders/${id}/reject`, data),
};