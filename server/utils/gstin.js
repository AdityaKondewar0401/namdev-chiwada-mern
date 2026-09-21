// server/utils/gstin.js
//
// GSTIN format + checksum validation. Used ONLY to validate a buyer's
// optional GSTIN (BusinessAccount.gstin) and to pre-fill their state —
// it has no tax effect while SELLER_GST_MODE=unregistered (see
// utils/taxMode.js). GSTIN shape: 2-digit state code, 10-char PAN,
// 1-digit entity number, fixed 'Z', 1 checksum character (15 total).

const GSTIN_FORMAT = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const CODE_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// GSTN's published check-digit algorithm: alternating x1/x2 multiplier
// over the base-36 code-point value of each of the first 14 characters,
// each product folded back into 0-35 by (quotient + remainder) of
// dividing by 36, summed, then the check character is whichever code
// point makes the total a multiple of 36.
function computeCheckDigit(first14) {
  let sum = 0;
  for (let i = 0; i < first14.length; i++) {
    const value = CODE_CHARS.indexOf(first14[i]);
    const product = value * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  const checkValue = (36 - (sum % 36)) % 36;
  return CODE_CHARS[checkValue];
}

/**
 * @param {string} gstin
 * @returns {{ valid: boolean, stateCode: string|null, reason?: string }}
 */
function validateGstin(gstin) {
  const value = String(gstin || '').trim().toUpperCase();

  if (!GSTIN_FORMAT.test(value)) {
    return { valid: false, stateCode: null, reason: 'Invalid GSTIN format' };
  }

  const expectedCheckDigit = computeCheckDigit(value.slice(0, 14));
  if (expectedCheckDigit !== value[14]) {
    return { valid: false, stateCode: null, reason: 'Invalid GSTIN checksum' };
  }

  return { valid: true, stateCode: value.slice(0, 2) };
}

module.exports = { validateGstin };
