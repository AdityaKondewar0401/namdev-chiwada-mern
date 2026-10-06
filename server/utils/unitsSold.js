// Pure merge behind the dashboard's "Units sold by product" table.

const normName = (name) => String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * One row per product with online, offline and total units, plus a per-pack-size
 * breakdown. Lines are matched to the catalog by product id, else by name; a line
 * that matches neither (an offline custom item, or a since-deleted product) gets
 * its own row keyed by name. Every catalog product gets a row, even with 0 sold.
 * @param {{ online: Array<{product?, name?, size?, qty}>, offline: Array<{product?, name?, size?, qty}>, products: Array<{_id, name}> }} input
 */
function mergeUnitsSold({ online = [], offline = [], products = [] }) {
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const byName = new Map(products.map((p) => [normName(p.name), p]));
  const rows = new Map();

  const rowFor = (key, name, inCatalog) => {
    if (!rows.has(key)) rows.set(key, { key, name, inCatalog, online: 0, offline: 0, total: 0, sizes: new Map() });
    return rows.get(key);
  };
  products.forEach((p) => rowFor(String(p._id), p.name, true));

  const add = (channel) => (line) => {
    const qty = Number(line.qty) || 0;
    if (qty <= 0) return;
    const catalog = (line.product && byId.get(String(line.product))) || byName.get(normName(line.name));
    const row = catalog
      ? rows.get(String(catalog._id))
      : rowFor(`name:${normName(line.name)}`, String(line.name || '').trim() || 'Unnamed item', false);
    row[channel] += qty;
    row.total += qty;

    const size = String(line.size || '').trim();
    const pack = row.sizes.get(size) || { size, online: 0, offline: 0, total: 0 };
    pack[channel] += qty;
    pack.total += qty;
    row.sizes.set(size, pack);
  };
  online.forEach(add('online'));
  offline.forEach(add('offline'));

  return [...rows.values()]
    .map((row) => ({ ...row, sizes: [...row.sizes.values()].sort((a, b) => b.total - a.total) }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

module.exports = { mergeUnitsSold };
