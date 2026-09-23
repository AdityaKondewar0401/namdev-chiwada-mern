// Invoice-status pill — same dot/border treatment as OrderStatusPill/
// B2BStatusBadge. Absorbs the "cancelled -> Credited" relabel that was
// copy-pasted in both B2BInvoicesPage and admin B2BLedgerTab.
const INVOICE_STATUS_STYLES = {
  issued:    { label: 'Issued',   bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  cancelled: { label: 'Credited', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
};

export default function InvoiceStatusPill({ status, className = '' }) {
  const style = INVOICE_STATUS_STYLES[status] || { label: status, bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' };
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
