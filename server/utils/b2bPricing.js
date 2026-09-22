// server/utils/b2bPricing.js
//
// Single source of truth for B2B order totals - used by the quote
// endpoint, order placement, and admin quantity edits
// (docs/B2B_PORTAL_SPEC.md §6.7), the same "one shared function, not
// three copies" principle as retail's server/utils/pricing.js (see
// AGENT.md §15). Never trusts a client-supplied price or product name -
// always re-reads the catalog and re-resolves the tier price server-side.

const WholesaleCatalogItem = require('../models/WholesaleCatalogItem');
const { round2, roundToRupee } = require('./money');
const { computeLineTax } = require('./taxMode');
const { isAllowedDeliveryState, getAllowedStateNames } = require('./b2bRegion');
const { businessConfig } = require('../config/business');

/**
 * @param {{ basePricePerUnit: number, tierOverrides: Array<{tier, pricePerUnit}> }} catalogItem
 * @param {{ _id: any, discountPercent: number }} [tier]
 */
function resolveUnitPrice(catalogItem, tier) {
  const override = (catalogItem.tierOverrides || []).find(
    (o) => tier && String(o.tier) === String(tier._id)
  );
  if (override) return round2(override.pricePerUnit);

  const discountPercent = tier?.discountPercent || 0;
  return round2(catalogItem.basePricePerUnit * (1 - discountPercent / 100));
}

/**
 * Prices a full B2B order (or a quote preview - same function, same
 * rules) from raw line requests.
 *
 * @param {{
 *   items: Array<{ catalogItemId: string, cases: number }>,
 *   account: { tier?: object, _id: any },
 *   shippingAddress: { stateCode: string },
 * }} params
 * @returns {Promise<
 *   { success: true, lines: Array, subtotal: number, taxTotal: number, grandTotal: number, roundOff: number, payable: number } |
 *   { success: false, errors: Array<{ field: string, message: string }> }
 * >}
 */
async function priceB2BOrder({ items, account, shippingAddress }) {
  const errors = [];

  if (!shippingAddress || !isAllowedDeliveryState(shippingAddress.stateCode)) {
    errors.push({
      field: 'shippingAddress',
      message: `We can currently only deliver B2B orders to: ${getAllowedStateNames().join(', ')}.`,
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ field: 'items', message: 'At least one item is required' });
  }

  if (errors.length) return { success: false, errors };

  const catalogItemIds = items.map((i) => i.catalogItemId);
  const catalogItems = await WholesaleCatalogItem.find({
    _id: { $in: catalogItemIds },
    active: true,
  }).populate('product');

  const catalogById = new Map(catalogItems.map((c) => [String(c._id), c]));

  const lines = [];
  for (const requested of items) {
    const catalogItem = catalogById.get(String(requested.catalogItemId));

    if (!catalogItem) {
      errors.push({ field: 'items', message: `Catalog item ${requested.catalogItemId} is not available` });
      continue;
    }
    const product = catalogItem.product;
    if (!product || product.inStock !== true) {
      errors.push({
        field: 'items',
        message: `"${product?.name || catalogItem.size}" is currently out of stock`,
      });
      continue;
    }

    const cases = Number(requested.cases);
    if (!Number.isInteger(cases) || cases < catalogItem.moqCases) {
      errors.push({
        field: 'items',
        message: `${product.name} (${catalogItem.size}): minimum order is ${catalogItem.moqCases} case${catalogItem.moqCases > 1 ? 's' : ''}`,
      });
      continue;
    }

    const unitPrice = resolveUnitPrice(catalogItem, account?.tier);
    const units = cases * catalogItem.unitsPerCase;
    const lineTotal = round2(unitPrice * units);
    const { taxAmount } = computeLineTax({ lineTotal });

    lines.push({
      catalogItem: catalogItem._id,
      product: product._id,
      name: product.name,
      size: catalogItem.size,
      unitsPerCase: catalogItem.unitsPerCase,
      cases,
      units,
      unitPrice,
      lineTotal,
      taxAmount,
    });
  }

  if (errors.length) return { success: false, errors };

  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  const taxTotal = round2(lines.reduce((sum, l) => sum + l.taxAmount, 0));

  if (subtotal < businessConfig.minOrderValue) {
    return {
      success: false,
      errors: [{
        field: 'items',
        message: `Minimum order value is ₹${businessConfig.minOrderValue.toLocaleString('en-IN')} (current subtotal ₹${subtotal.toLocaleString('en-IN')})`,
      }],
    };
  }

  const { rounded: payable, roundOff } = roundToRupee(subtotal + taxTotal);

  return {
    success: true,
    lines,
    subtotal,
    taxTotal,
    grandTotal: round2(subtotal + taxTotal),
    roundOff,
    payable,
  };
}

module.exports = { resolveUnitPrice, priceB2BOrder };
