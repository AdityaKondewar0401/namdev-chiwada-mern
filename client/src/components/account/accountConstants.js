// ─────────────────────────────────────────────
// Shared account-page constants — same reasoning as the admin
// panel's adminConstants.js: one place for tab definitions and
// status colors so the sidebar badges, the orders list, and the
// new status stepper all read from the same source.
// ─────────────────────────────────────────────

export const TABS = [
  { id: 'profile',  icon: '👤', label: 'My Profile' },
  { id: 'orders',   icon: '📦', label: 'My Orders' },
  { id: 'wishlist', icon: '❤️', label: 'Wishlist' },
  { id: 'address',  icon: '📍', label: 'Address' },
];

export const ORDER_STATUS_COLORS = {
  pending:    { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  confirmed:  { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  processing: { bg: '#f5f3ff', text: '#6d28d9', dot: '#8b5cf6' },
  shipped:    { bg: '#ecfdf5', text: '#065f46', dot: '#10b981' },
  delivered:  { bg: '#f0fdf4', text: '#166534', dot: '#22c55e' },
  cancelled:  { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444' },
};

// Progression order for the new visual status stepper on each order
// card. "cancelled" is a separate terminal state, handled on its own.
export const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];