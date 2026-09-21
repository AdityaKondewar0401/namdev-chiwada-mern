// Shared status pill — same color language as adminConstants.js's
// STATUS_CONFIG (retail order statuses), reused here rather than
// inventing new colors. Used by both B2BDashboardPage (customer-facing)
// and the admin B2BAccountsTab.

const STATUS_STYLES = {
  pending:   { label: 'Pending Review', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  approved:  { label: 'Approved',       bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  rejected:  { label: 'Rejected',       bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
  suspended: { label: 'Suspended',      bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

export default function B2BStatusBadge({ status, className = '' }) {
  const style = STATUS_STYLES[status];
  if (!style) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${className}`}
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: style.color }} />
      {style.label}
    </span>
  );
}
