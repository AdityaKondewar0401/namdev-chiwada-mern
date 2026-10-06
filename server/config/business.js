// Seller details printed on every invoice. The legal name and FSSAI number
// must match the FSSAI licence; the business is not GST-registered, so
// invoices carry no GSTIN or tax lines.
module.exports = Object.freeze({
  brandName: 'Namdev Chiwda',
  legalName: 'Namdev Chiwada Sweet Home',
  tagline: 'Authentic Solapuri Chiwda · Since 1873',
  address: Object.freeze([
    '205/A, Suhas Building, Killa Road',
    'Goldfinch Peth, Near DCC Bank',
    'Solapur, Maharashtra 413007',
  ]),
  phone: '+91 91301 60491',
  email: 'care@namdevchiwda.com',
  fssai: '21526041003460',
  bank: Object.freeze({
    name: 'SVC Bank',
    accountNumber: '301160400000355',
    ifsc: 'SVCB0000116',
  }),
  upiId: '8668284570-11@ybl',
});
