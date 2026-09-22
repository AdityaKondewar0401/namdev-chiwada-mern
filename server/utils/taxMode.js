// server/utils/taxMode.js
//
// Single place every B2B code path asks "what does tax look like right
// now" (B2B_PORTAL_SPEC.md §4) — nothing else in the codebase branches
// on tax mode directly. Today only `unregistered` is implemented (the
// business holds an FSSAI license, not a GST registration); `regular`
// (and possibly `composition`) are Phase 6 work, added here without
// touching any B2B model or already-issued document — that's the whole
// point of this abstraction.
//
// The mode is validated the moment this module is first required (i.e.
// effectively at server start, since server.js's route-mounting chain
// requires it transitively) — an unsupported SELLER_GST_MODE fails
// loudly and immediately instead of surfacing as a confusing runtime
// error the first time someone tries to price an order.

const SUPPORTED_MODES = ['unregistered'];

function getTaxMode() {
  return (process.env.SELLER_GST_MODE || 'unregistered').trim();
}

const _mode = getTaxMode();
if (!SUPPORTED_MODES.includes(_mode)) {
  throw new Error(
    `SELLER_GST_MODE="${_mode}" is not implemented yet. Supported modes: ${SUPPORTED_MODES.join(', ')}. ` +
    'See docs/B2B_PORTAL_SPEC.md §4 and Phase 6 for what "regular" mode will require.'
  );
}

const DOCUMENT_TITLES = {
  unregistered: { invoice: 'Invoice', credit_note: 'Credit Note' },
};

const SUPPLIER_TAX_NOTES = {
  unregistered: 'Supplier not registered under GST. GST not charged.',
};

/**
 * @param {'invoice'|'credit_note'} kind
 */
function documentTitle(kind) {
  const titles = DOCUMENT_TITLES[getTaxMode()];
  const title = titles && titles[kind];
  if (!title) throw new Error(`Unknown document kind "${kind}"`);
  return title;
}

/**
 * @param {{ lineTotal: number }} line
 * @returns {{ taxAmount: number }}
 */
function computeLineTax(line) {
  // Only mode implemented is unregistered — always zero tax. When
  // `regular` mode is added (Phase 6), this becomes the one place that
  // branches on rate/place-of-supply; every caller stays unchanged.
  void line;
  return { taxAmount: 0 };
}

function supplierTaxNote() {
  return SUPPLIER_TAX_NOTES[getTaxMode()];
}

module.exports = { getTaxMode, documentTitle, computeLineTax, supplierTaxNote, SUPPORTED_MODES };
