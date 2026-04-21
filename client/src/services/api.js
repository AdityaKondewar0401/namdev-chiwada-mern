import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
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

// Auth
export const authAPI = {
  register:      (data) => api.post('/api/auth/register', data),
  login:         (data) => api.post('/api/auth/login', data),
  getMe:         ()     => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
};

// Products
export const productAPI = {
  getAll: (params) => api.get('/api/products', { params }),
  getOne: (id)     => api.get(`/api/products/${id}`),
  create: (data)   => api.post('/api/products', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id)     => api.delete(`/api/products/${id}`),
};

// Cart
export const cartAPI = {
  get:    ()                => api.get('/api/cart'),
  add:    (data)            => api.post('/api/cart', data),
  update: (itemId, qty)     => api.put(`/api/cart/${itemId}`, { qty }),
  remove: (itemId)          => api.delete(`/api/cart/${itemId}`),
  clear:  ()                => api.delete('/api/cart'),
};

// Orders
export const orderAPI = {
  place:         (data)             => api.post('/api/orders', data),
  getAll:        ()                 => api.get('/api/orders'),
  getOne:        (id)               => api.get(`/api/orders/${id}`),
  validatePromo: (data) => api.post('/api/orders/validate-promo', data),
};

// Wishlist
export const wishlistAPI = {
  get:    ()   => api.get('/api/wishlist'),
  toggle: (id) => api.post(`/api/wishlist/${id}`),
};