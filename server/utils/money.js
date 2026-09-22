// server/utils/money.js
//
// Shared money-math helpers for the B2B portal. Every rupee amount in
// B2B code (pricing, invoices, ledger) goes through these — never
// rounded inline in a controller or component. Same principle as
// retail's server/utils/pricing.js being the one place order totals are
// computed (see AGENT.md §15), applied to B2B's own numbers.

/**
 * Rounds a number to 2 decimal places (paise), avoiding classic
 * floating-point drift by rounding in a nudged, then integer-paise,
 * space rather than trusting raw decimal arithmetic.
 */
function round2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Rounds a rupee-and-paise amount to the nearest whole rupee for an
 * invoice/order grand total, returning both the rounded amount and the
 * signed round-off applied (rounded - original), so the round-off can
 * be shown as its own line item rather than silently absorbed.
 */
function roundToRupee(value) {
  const original = round2(value);
  const rounded = Math.round(original);
  return { rounded, roundOff: round2(rounded - original) };
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

// Converts an integer 0-999 into words — the building block every
// higher Indian place value (thousand/lakh/crore) below reuses.
function threeDigitsToWords(n) {
  if (n === 0) return '';
  let words = '';
  if (n >= 100) {
    words += `${ONES[Math.floor(n / 100)]} Hundred`;
    n %= 100;
    if (n > 0) words += ' ';
  }
  if (n >= 20) {
    words += TENS[Math.floor(n / 10)];
    if (n % 10 > 0) words += `-${ONES[n % 10]}`;
  } else if (n > 0) {
    words += ONES[n];
  }
  return words;
}

// Indian numbering: crore (1,00,00,000) / lakh (1,00,000) / thousand /
// hundred — not the international thousand/million/billion grouping.
function integerToWordsIndian(n) {
  if (n === 0) return 'Zero';
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const rest = n;

  const parts = [];
  if (crore) parts.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (rest) parts.push(threeDigitsToWords(rest));
  return parts.join(' ');
}

/**
 * "Rupees <amount> Only" in Indian numbering, including paise in words
 * when the amount isn't a whole rupee (e.g. "Rupees One Lakh
 * Twenty-Three Thousand Four Hundred Fifty-Six and Fifty Paise Only").
 * Used on invoice/credit-note PDFs.
 */
function amountInWordsINR(value) {
  const amount = round2(value);
  const rupees = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupees) * 100);

  let words = `Rupees ${integerToWordsIndian(rupees)}`;
  if (paise > 0) {
    words += ` and ${integerToWordsIndian(paise)} Paise`;
  }
  words += ' Only';
  return words;
}

module.exports = { round2, roundToRupee, amountInWordsINR };
