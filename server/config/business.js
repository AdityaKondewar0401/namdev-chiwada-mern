// server/config/business.js
//
// B2B seller/business configuration — env-driven, frozen at require
// time (fixed for the life of the process, like every other config
// module here). See docs/B2B_PORTAL_SPEC.md §10 for the full list and
// server/.env.example for the annotated template.
//
// Deliberately does NOT throw if seller invoice details (legal name,
// FSSAI license, bank details) are blank — those are only REQUIRED at
// actual invoice-issuance time (Phase 4), so the rest of the portal
// (onboarding, catalog, ordering) keeps working even before the owner
// has supplied them. The invoice-issuance code path is what enforces
// that requirement loudly, not this file — see REQUIRED_FOR_INVOICING
// below, exported so that check has one place to point at instead of
// repeating the field list.

const seller = Object.freeze({
  legalName: process.env.SELLER_LEGAL_NAME || '',
  tradeName: process.env.SELLER_TRADE_NAME || 'Namdev Chiwda',
  fssaiLicenseNo: process.env.SELLER_FSSAI_LICENSE || '',
  addressLine1: process.env.SELLER_ADDRESS_LINE1 || '',
  addressLine2: process.env.SELLER_ADDRESS_LINE2 || '',
  city: process.env.SELLER_CITY || 'Solapur',
  stateCode: process.env.SELLER_STATE_CODE || '27',
  pincode: process.env.SELLER_PINCODE || '',
  phone: process.env.SELLER_PHONE || '',
  email: process.env.SELLER_EMAIL || 'care@namdevchiwda.com',
  bank: Object.freeze({
    bankName: process.env.SELLER_BANK_NAME || '',
    accountName: process.env.SELLER_BANK_ACCOUNT_NAME || '',
    accountNo: process.env.SELLER_BANK_ACCOUNT_NO || '',
    ifsc: process.env.SELLER_BANK_IFSC || '',
    upiId: process.env.SELLER_UPI_ID || '',
  }),
});

const businessConfig = Object.freeze({
  seller,
  minOrderValue: Number(process.env.B2B_MIN_ORDER_VALUE || 5000),
  adminNotifyEmail: process.env.B2B_ADMIN_NOTIFY_EMAIL || 'care@namdevchiwda.com',
  gstRegistrationThreshold: Number(process.env.GST_REGISTRATION_THRESHOLD || 4000000),
});

// Checked by the invoice-issuance code path (Phase 4) before creating
// an Invoice — fails loudly there if any of these is still blank.
const REQUIRED_FOR_INVOICING = ['legalName', 'fssaiLicenseNo'];

module.exports = { businessConfig, REQUIRED_FOR_INVOICING };
