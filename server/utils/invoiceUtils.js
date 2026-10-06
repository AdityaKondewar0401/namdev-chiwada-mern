// Pure helpers shared by invoice numbering, totals, the PDF and emails.

// Render runs in UTC; invoice dates and financial years must follow IST.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const IST = 'Asia/Kolkata';

// Indian financial year (1 April – 31 March), e.g. any date in 1 Apr 2026 – 31 Mar 2027 IST → "26-27".
function getFinancialYear(date = new Date()) {
  const ist = new Date(new Date(date).getTime() + IST_OFFSET_MS);
  const startYear = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  const yy = (y) => String(y % 100).padStart(2, '0');
  return `${yy(startYear)}-${yy(startYear + 1)}`;
}

function getFinancialYearStart(date = new Date()) {
  const startYear = 2000 + Number(getFinancialYear(date).slice(0, 2));
  return new Date(Date.UTC(startYear, 3, 1) - IST_OFFSET_MS);
}

// "2026-10-05" for the IST calendar day containing `date`.
function istDateKey(date = new Date()) {
  return new Date(new Date(date).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

const formatInvoiceNumber = (fy, seq) => `NC/${fy}/${String(seq).padStart(4, '0')}`;

const invoiceFileName = (invoiceNumber) => `Namdev-Chiwda-Invoice-${invoiceNumber.replace(/\//g, '-')}.pdf`;

function round2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatINR = (amount) => `₹${inr.format(round2(amount))}`;

const formatDateIST = (date) =>
  new Date(date).toLocaleDateString('en-IN', { timeZone: IST, day: 'numeric', month: 'long', year: 'numeric' });

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const twoDigits = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ''));
const threeDigits = (n) => (n >= 100
  ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${twoDigits(n % 100)}` : ''}`
  : twoDigits(n));

// Indian grouping: 1,23,45,678 → "One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight".
function integerInWords(value) {
  let n = Math.floor(Math.abs(value));
  if (n === 0) return 'Zero';
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  return [
    crore && `${integerInWords(crore)} Crore`,
    lakh && `${twoDigits(lakh)} Lakh`,
    thousand && `${twoDigits(thousand)} Thousand`,
    n && threeDigits(n),
  ].filter(Boolean).join(' ');
}

function amountInWords(amount) {
  const total = round2(Math.abs(amount));
  const rupees = Math.floor(total);
  const paise = Math.round((total - rupees) * 100);
  return `Rupees ${integerInWords(rupees)}${paise ? ` and ${integerInWords(paise)} Paise` : ''} Only`;
}

/**
 * Server-side source of truth for offline invoice maths.
 * @param {Array<{price:number, qty:number}>} items
 * @param {{type?: 'flat'|'percent', value?: number}} [discount]
 * @param {number} [shipping]
 */
function computeTotals(items, discount = {}, shipping = 0) {
  const lines = items.map((item) => ({ ...item, amount: round2(item.price * item.qty) }));
  const subtotal = round2(lines.reduce((sum, line) => sum + line.amount, 0));
  const value = Math.max(0, Number(discount.value) || 0);
  const rawDiscount = discount.type === 'percent' ? (subtotal * Math.min(value, 100)) / 100 : value;
  const discountAmount = round2(Math.min(rawDiscount, subtotal));
  const shippingAmount = round2(Math.max(0, Number(shipping) || 0));
  return {
    lines,
    subtotal,
    discount: discountAmount,
    shipping: shippingAmount,
    total: round2(subtotal - discountAmount + shippingAmount),
  };
}

module.exports = {
  IST,
  IST_OFFSET_MS,
  getFinancialYear,
  getFinancialYearStart,
  istDateKey,
  formatInvoiceNumber,
  invoiceFileName,
  round2,
  formatINR,
  formatDateIST,
  amountInWords,
  computeTotals,
};
