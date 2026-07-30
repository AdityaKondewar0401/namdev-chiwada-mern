// ─────────────────────────────────────────────
// Shared admin constants — extracted from the old single-file
// AdminPage.jsx so the new DashboardTab analytics (status breakdown,
// category breakdown) and OrdersTab/ProductFormTab all read from the
// exact same status list, colors, and categories instead of each
// tab keeping its own copy that could drift out of sync.
// ─────────────────────────────────────────────

export const TABS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard', group: 'store' },
  { id: 'products', icon: '🍛', label: 'Products', group: 'store' },
  { id: 'add', icon: '➕', label: 'Add Product', group: 'store' },
  { id: 'orders', icon: '📦', label: 'Customer Orders', group: 'store' },
  { id: 'promos', icon: '🎟️', label: 'Promo Codes', group: 'store' },
  { id: 'partnerDashboard', icon: '📈', label: 'Partner Dashboard', group: 'partner' },
  { id: 'partners', icon: '🤝', label: 'Partners', group: 'partner' },
  { id: 'consignments', icon: '🚚', label: 'Consignments', group: 'partner' },
  { id: 'partnerOrders', icon: '📥', label: 'Partner Orders', group: 'partner' },
];

export const PARTNER_TYPES = ['distributor', 'retailer', 'corporate'];

export const PARTNER_TYPE_LABELS = {
  distributor: 'Distributor',
  retailer: 'Retailer / Sweet Mart',
  corporate: 'Corporate Office',
};

export const CONSIGNMENT_STATUS_CONFIG = {
  dispatched:          { color: '#b45309', bg: '#fef3c7', label: 'Dispatched' },
  partially_settled:   { color: '#1d4ed8', bg: '#dbeafe', label: 'Partially Paid' },
  settled:             { color: '#15803d', bg: '#dcfce7', label: 'Settled' },
};

export const CATEGORIES = ['mild', 'spicy', 'special'];

// Used for the "Products by Category" breakdown on the dashboard
export const CATEGORY_COLORS = { mild: '#e07000', spicy: '#dc2626', special: '#d4af37' };

export const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export const STATUS_CONFIG = {
  pending:    { color: '#b45309', bg: '#fef3c7', border: '#fde68a', icon: '🕐', dot: '#f59e0b' },
  confirmed:  { color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', icon: '✅', dot: '#3b82f6' },
  processing: { color: '#6d28d9', bg: '#ede9fe', border: '#ddd6fe', icon: '⚙️', dot: '#8b5cf6' },
  shipped:    { color: '#0e7490', bg: '#cffafe', border: '#a5f3fc', icon: '🚚', dot: '#06b6d4' },
  delivered:  { color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', icon: '🎉', dot: '#22c55e' },
  cancelled:  { color: '#b91c1c', bg: '#fee2e2', border: '#fecaca', icon: '✕',  dot: '#ef4444' },
};

export const PAYMENT_ICONS = { ONLINE: '💳', COD: '💵', online: '💳', cod: '💵' };