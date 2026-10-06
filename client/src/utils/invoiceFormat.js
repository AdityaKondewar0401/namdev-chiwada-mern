const inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatINR = (amount) => `₹${inr.format(Number(amount) || 0)}`;

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// "2026-10-06" for today in IST — the invoice date picker's default and maximum.
export const todayIST = () => new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);

// First day of the current Indian financial year (1 April), as "YYYY-04-01".
export function financialYearStartIST() {
  const [year, month] = todayIST().split('-').map(Number);
  return `${month >= 4 ? year : year - 1}-04-01`;
}

// WhatsApp-bot customers have a placeholder `.local` email that can't receive mail.
export const usableEmail = (email) => (email && !/\.local$/i.test(email) ? email : '');

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Mirrors the server's computeTotals so the form preview matches the saved invoice.
export function previewTotals(items, discountType, discountValue, shipping) {
  const subtotal = round2(items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 0), 0));
  const value = Math.max(0, Number(discountValue) || 0);
  const raw = discountType === 'percent' ? (subtotal * Math.min(value, 100)) / 100 : value;
  const discount = round2(Math.min(raw, subtotal));
  const delivery = round2(Math.max(0, Number(shipping) || 0));
  return { subtotal, discount, shipping: delivery, total: round2(subtotal - discount + delivery) };
}

export const STATUS_TONES = {
  paid: { color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
  due: { color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  cancelled: { color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
};
