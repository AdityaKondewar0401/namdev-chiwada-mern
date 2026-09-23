// Shared currency/date formatters for the B2B portal — previously
// redefined locally (byte-identically, in most cases) in nearly every
// B2B page/component. One copy so formatting can never quietly drift
// between two screens showing the same order/invoice.

export function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export function formatDateTime(d) {
  return d
    ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
}
