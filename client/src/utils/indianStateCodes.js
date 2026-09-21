// Client-side copy of server/utils/indianStates.js's STATE_CODES —
// standard, publicly published GST state-code table, used only for the
// wholesale-apply form's state dropdown (sets both the display name and
// the 2-digit code from one control). Display-only; the server is the
// authority for anything that affects pricing or delivery eligibility.
export const STATE_CODES = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
};

// First 2 characters of a GSTIN are always its state code — true
// regardless of checksum validity, so this is safe to use for a live
// "auto-fill state" hint even before the full GSTIN is valid/complete.
export function stateNameFromGstinPrefix(gstin) {
  const code = String(gstin || '').trim().slice(0, 2);
  return STATE_CODES[code] || null;
}
