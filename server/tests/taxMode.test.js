const { test } = require('node:test');
const assert = require('node:assert/strict');

test('unregistered mode: zero tax, correct titles, correct supplier note', () => {
  delete process.env.SELLER_GST_MODE; // exercise the default fallback path too
  delete require.cache[require.resolve('../utils/taxMode')];
  const taxMode = require('../utils/taxMode');

  assert.equal(taxMode.getTaxMode(), 'unregistered');
  assert.equal(taxMode.documentTitle('invoice'), 'Invoice');
  assert.equal(taxMode.documentTitle('credit_note'), 'Credit Note');
  assert.deepEqual(taxMode.computeLineTax({ lineTotal: 1000 }), { taxAmount: 0 });
  assert.equal(taxMode.supplierTaxNote(), 'Supplier not registered under GST. GST not charged.');
});

test('an unsupported SELLER_GST_MODE throws at require time', () => {
  process.env.SELLER_GST_MODE = 'regular'; // not implemented yet — see spec Phase 6
  delete require.cache[require.resolve('../utils/taxMode')];

  assert.throws(() => require('../utils/taxMode'), /not implemented yet/);

  // Restore so later tests in the same process (or a later file) don't
  // inherit this — node:test files in the same run share process.env.
  delete process.env.SELLER_GST_MODE;
  delete require.cache[require.resolve('../utils/taxMode')];
  require('../utils/taxMode');
});
