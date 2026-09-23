// Order-status pill — same color language + dot/border treatment as
// B2BStatusBadge.jsx (business-account status), extended to B2BOrder's
// status enum so both read as one visual family instead of two. Was
// previously three independently-defined color maps (B2BDashboardPage,
// B2BOrdersPage, admin B2BOrdersTab) that also disagreed on casing
// (PLACED / placed / Placed for the same value) — this is the one
// source of truth for both color and label.
const ORDER_STATUS_STYLES = {
  placed:     { label: 'Placed',     bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  confirmed:  { label: 'Confirmed',  bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  packed:     { label: 'Packed',     bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' },
  dispatched: { label: 'Dispatched', bg: '#cffafe', color: '#0e7490', border: '#a5f3fc' },
  delivered:  { label: 'Delivered',  bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  cancelled:  { label: 'Cancelled',  bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
  rejected:   { label: 'Rejected',   bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
};

export default function OrderStatusPill({ status, className = '' }) {
  const style = ORDER_STATUS_STYLES[status] || { label: status, bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${className}`}
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: style.color }} />
      {style.label}
    </span>
  );
}
