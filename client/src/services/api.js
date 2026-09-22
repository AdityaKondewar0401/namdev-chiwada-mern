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
    if (err.response?.status === 401 && err.config?.headers?.Authorization) {
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
};

/* ===============================
   Users (admin)
================================= */
export const userAPI = {
  getAll: (params) =>
    api.get('/api/users/admin', { params }),

  getOne: (id) =>
    api.get(`/api/users/admin/${id}`),
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
   B2B (Wholesale) — business-facing
================================= */
export const b2bAPI = {
  getConfig: () =>
    api.get('/api/b2b/config'),

  getMe: () =>
    api.get('/api/b2b/me'),

  apply: (data) =>
    api.post('/api/b2b/apply', data),

  updateMe: (data) =>
    api.put('/api/b2b/me', data),

  getCatalog: () =>
    api.get('/api/b2b/catalog'),

  quoteOrder: (data) =>
    api.post('/api/b2b/orders/quote', data),

  placeOrder: (data) =>
    api.post('/api/b2b/orders', data),

  getOrders: (params) =>
    api.get('/api/b2b/orders', { params }),

  getOrder: (id) =>
    api.get(`/api/b2b/orders/${id}`),

  cancelOrder: (id, data) =>
    api.post(`/api/b2b/orders/${id}/cancel`, data),

  getInvoices: () =>
    api.get('/api/b2b/invoices'),

  getInvoice: (id) =>
    api.get(`/api/b2b/invoices/${id}`),

  // PDF/CSV downloads use the shared axios instance (carries the JWT via
  // its request interceptor) with responseType "blob" — a plain <a href>
  // can't authenticate, since the token lives in localStorage, not a
  // cookie. Callers turn the blob into an object URL to trigger the save.
  downloadInvoicePdf: (id) =>
    api.get(`/api/b2b/invoices/${id}/pdf`, { responseType: 'blob' }),

  downloadCreditNotePdf: (id) =>
    api.get(`/api/b2b/credit-notes/${id}/pdf`, { responseType: 'blob' }),

  getLedger: (params) =>
    api.get('/api/b2b/ledger', { params }),

  downloadLedgerCsv: (params) =>
    api.get('/api/b2b/ledger/export.csv', { params, responseType: 'blob' }),
};

/* ===============================
   B2B (Wholesale) — admin
================================= */
export const b2bAdminAPI = {
  listAccounts: (params) =>
    api.get('/api/b2b/admin/accounts', { params }),

  getAccount: (id) =>
    api.get(`/api/b2b/admin/accounts/${id}`),

  createAccount: (data) =>
    api.post('/api/b2b/admin/accounts', data),

  updateAccount: (id, data) =>
    api.put(`/api/b2b/admin/accounts/${id}`, data),

  approveAccount: (id, data) =>
    api.post(`/api/b2b/admin/accounts/${id}/approve`, data),

  rejectAccount: (id, data) =>
    api.post(`/api/b2b/admin/accounts/${id}/reject`, data),

  suspendAccount: (id, data) =>
    api.post(`/api/b2b/admin/accounts/${id}/suspend`, data),

  reactivateAccount: (id, data) =>
    api.post(`/api/b2b/admin/accounts/${id}/reactivate`, data),

  listTiers: () =>
    api.get('/api/b2b/admin/tiers'),

  createTier: (data) =>
    api.post('/api/b2b/admin/tiers', data),

  updateTier: (id, data) =>
    api.put(`/api/b2b/admin/tiers/${id}`, data),

  deleteTier: (id) =>
    api.delete(`/api/b2b/admin/tiers/${id}`),

  listCatalogItems: () =>
    api.get('/api/b2b/admin/catalog'),

  createCatalogItem: (data) =>
    api.post('/api/b2b/admin/catalog', data),

  updateCatalogItem: (id, data) =>
    api.put(`/api/b2b/admin/catalog/${id}`, data),

  deleteCatalogItem: (id) =>
    api.delete(`/api/b2b/admin/catalog/${id}`),

  listOrders: (params) =>
    api.get('/api/b2b/admin/orders', { params }),

  getOrder: (id) =>
    api.get(`/api/b2b/admin/orders/${id}`),

  updateOrderItems: (id, data) =>
    api.put(`/api/b2b/admin/orders/${id}/items`, data),

  updateOrderStatus: (id, data) =>
    api.post(`/api/b2b/admin/orders/${id}/status`, data),

  overrideCreditHold: (id, data) =>
    api.post(`/api/b2b/admin/orders/${id}/override-credit-hold`, data),

  issueInvoice: (orderId) =>
    api.post(`/api/b2b/admin/orders/${orderId}/invoice`),

  listInvoices: (params) =>
    api.get('/api/b2b/admin/invoices', { params }),

  downloadInvoicePdf: (id) =>
    api.get(`/api/b2b/admin/invoices/${id}/pdf`, { responseType: 'blob' }),

  createCreditNote: (invoiceId, data) =>
    api.post(`/api/b2b/admin/invoices/${invoiceId}/credit-note`, data),

  downloadCreditNotePdf: (id) =>
    api.get(`/api/b2b/admin/credit-notes/${id}/pdf`, { responseType: 'blob' }),

  getAccountLedger: (accountId, params) =>
    api.get(`/api/b2b/admin/accounts/${accountId}/ledger`, { params }),

  downloadAccountLedgerCsv: (accountId, params) =>
    api.get(`/api/b2b/admin/accounts/${accountId}/ledger/export.csv`, { params, responseType: 'blob' }),

  recordPayment: (accountId, data) =>
    api.post(`/api/b2b/admin/accounts/${accountId}/payments`, data),

  recordAdjustment: (accountId, data) =>
    api.post(`/api/b2b/admin/accounts/${accountId}/adjustments`, data),

  recordOpeningBalance: (accountId, data) =>
    api.post(`/api/b2b/admin/accounts/${accountId}/opening-balance`, data),

  getSummary: () =>
    api.get('/api/b2b/admin/summary'),
};