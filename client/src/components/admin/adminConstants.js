import {
  LayoutDashboard, ShoppingBag, Plus, Package, Tag, Users,
  Clock, CheckCircle2, Settings2, Truck, PackageCheck, XCircle, CreditCard, Banknote,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Shared admin constants — extracted from the old single-file
// AdminPage.jsx so the new DashboardTab analytics (status breakdown,
// category breakdown) and OrdersTab/ProductFormTab all read from the
// exact same status list, colors, and categories instead of each
// tab keeping its own copy that could drift out of sync.
// ─────────────────────────────────────────────

// TABS.icon holds a lucide-react component (not emoji) — only AdminNav.jsx
// reads it, rendering `<tab.icon size={18} />`.
export const TABS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', group: 'store' },
  { id: 'products', icon: ShoppingBag, label: 'Products', group: 'store' },
  { id: 'add', icon: Plus, label: 'Add Product', group: 'store' },
  { id: 'orders', icon: Package, label: 'Customer Orders', group: 'store' },
  { id: 'promos', icon: Tag, label: 'Promo Codes', group: 'store' },
  { id: 'users', icon: Users, label: 'Users', group: 'store' },
];

export const CATEGORIES = ['mild', 'spicy', 'special'];

// Used for the "Products by Category" breakdown on the dashboard
export const CATEGORY_COLORS = { mild: '#e07000', spicy: '#dc2626', special: '#d4af37' };

export const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

// `icon` holds a lucide-react component (not emoji) — every consumer
// renders it as a tag, e.g. `<STATUS_CONFIG[status].icon size={12} />`.
export const STATUS_CONFIG = {
  pending:    { color: '#b45309', bg: '#fef3c7', border: '#fde68a', icon: Clock, dot: '#f59e0b' },
  confirmed:  { color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', icon: CheckCircle2, dot: '#3b82f6' },
  processing: { color: '#6d28d9', bg: '#ede9fe', border: '#ddd6fe', icon: Settings2, dot: '#8b5cf6' },
  shipped:    { color: '#0e7490', bg: '#cffafe', border: '#a5f3fc', icon: Truck, dot: '#06b6d4' },
  delivered:  { color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', icon: PackageCheck, dot: '#22c55e' },
  cancelled:  { color: '#b91c1c', bg: '#fee2e2', border: '#fecaca', icon: XCircle,  dot: '#ef4444' },
};

export const PAYMENT_ICONS = { ONLINE: CreditCard, COD: Banknote, online: CreditCard, cod: Banknote };

// Used by the Users tab for the role badge on each customer/admin row.
// (No `icon` field — the badge is a plain colored text pill, no glyph.)
export const ROLE_CONFIG = {
  admin: { color: '#b45309', bg: '#fef3c7', border: '#fde68a', label: 'Admin' },
  user:  { color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', label: 'Customer' },
};