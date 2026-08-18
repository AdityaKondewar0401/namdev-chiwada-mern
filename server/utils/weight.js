// server/utils/weight.js
//
// Shared weight-parsing helper. Product sizes/cart line "size" values are
// free-text strings like "250g", "500g", "1kg" (see server/models/Product.js
// sizeSchema). Shadowfax's Warehouse Order Creation API wants a single
// numeric `actual_weight` in grams for the whole order, so cart/order items
// need to be summed into grams.
//
// Kept dependency-free and defensive: any size string that doesn't parse
// falls back to `defaultGrams` rather than throwing, since a shipping
// integration should never be the reason an order can't be placed because
// of a cosmetic label like "Family Pack".

const DEFAULT_FALLBACK_GRAMS = 250;

/**
 * Parses a weight label ("250g", "1kg", "1.5 KG", "500 g") into grams.
 * Returns `fallbackGrams` if the string can't be parsed.
 */
function parseWeightToGrams(sizeLabel, fallbackGrams = DEFAULT_FALLBACK_GRAMS) {
  if (typeof sizeLabel === 'number' && Number.isFinite(sizeLabel)) {
    return sizeLabel;
  }
  if (typeof sizeLabel !== 'string' || !sizeLabel.trim()) {
    return fallbackGrams;
  }

  const match = sizeLabel.trim().toLowerCase().match(/([\d.]+)\s*(kg|g|gm|gms|grams?|kgs?)?/);
  if (!match || !match[1]) return fallbackGrams;

  const value = parseFloat(match[1]);
  if (!Number.isFinite(value)) return fallbackGrams;

  const unit = match[2] || 'g';
  const isKg = unit.startsWith('kg');
  return Math.round(isKg ? value * 1000 : value);
}

/**
 * Sums the total actual weight (in grams) of an array of cart/order line
 * items. Each item is expected to have `size` (weight label) and `qty`.
 */
function calcTotalWeightGrams(items, fallbackGrams = DEFAULT_FALLBACK_GRAMS) {
  return (items || []).reduce((sum, item) => {
    const unitGrams = parseWeightToGrams(item.size || item.weight, fallbackGrams);
    const qty = Number(item.qty) || 1;
    return sum + unitGrams * qty;
  }, 0);
}

module.exports = { parseWeightToGrams, calcTotalWeightGrams, DEFAULT_FALLBACK_GRAMS };
