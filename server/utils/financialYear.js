// server/utils/financialYear.js
//
// Indian financial year (1 April - 31 March) computed in IST
// (Asia/Kolkata, UTC+5:30, no DST), never server-local time — Render
// runs in UTC, and a naive Date computation would put the last ~5.5
// hours of each IST day into the wrong FY around midnight.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIST(date) {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

/**
 * @param {Date} [date] defaults to now
 * @returns {string} e.g. "26-27" for any date from 1 Apr 2026 through 31 Mar 2027 IST
 */
function getFinancialYear(date = new Date()) {
  const ist = toIST(date);
  // getUTC* on an IST-shifted Date reads back IST wall-clock fields.
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth(); // 0-indexed; 3 = April
  const startYear = month >= 3 ? year : year - 1;
  const startYearShort = String(startYear % 100).padStart(2, '0');
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYearShort}-${endYearShort}`;
}

/**
 * @param {string} fy e.g. "26-27"
 * @returns {{ start: Date, end: Date }} UTC instants corresponding to
 *   1 Apr 00:00:00.000 IST and 31 Mar 23:59:59.999 IST of that FY
 */
function getFinancialYearRange(fy) {
  const match = /^(\d{2})-(\d{2})$/.exec(fy);
  if (!match) throw new Error(`Invalid financial year "${fy}" - expected "YY-YY"`);
  const startYear = 2000 + Number(match[1]);

  const start = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0, 0) - IST_OFFSET_MS);
  const end = new Date(Date.UTC(startYear + 1, 2, 31, 23, 59, 59, 999) - IST_OFFSET_MS);

  return { start, end };
}

/**
 * @param {string} prefix e.g. "NCB" (invoice) or "NCC" (credit note)
 * @param {string} fy e.g. "26-27"
 * @param {number} seq sequence number from Counter
 * @returns {string} e.g. "NCB/26-27/00001" — asserted <= 16 characters
 *   so the same series stays valid after GST registration.
 */
function formatDocNumber(prefix, fy, seq) {
  const number = `${prefix}/${fy}/${String(seq).padStart(5, '0')}`;
  if (number.length > 16) {
    throw new Error(`Document number "${number}" exceeds 16 characters`);
  }
  return number;
}

module.exports = { getFinancialYear, getFinancialYearRange, formatDocNumber, IST_OFFSET_MS };
