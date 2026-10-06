const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeUnitsSold } = require('../utils/unitsSold');

const products = [
  { _id: 'p1', name: 'Namdev Chiwda' },
  { _id: 'p2', name: 'Namdev Bakarwadi' },
  { _id: 'p3', name: 'Garlic Chiwda' },
];

test('combines online and offline units per product, best sellers first', () => {
  const rows = mergeUnitsSold({
    products,
    online: [
      { product: 'p1', name: 'Namdev Chiwda', size: '200g', qty: 5 },
      { product: 'p2', name: 'Namdev Bakarwadi', size: '200g', qty: 2 },
    ],
    offline: [
      { product: 'p1', name: 'Namdev Chiwda', size: '200g', qty: 10 },
      { product: 'p1', name: 'Namdev Chiwda', size: '1kg', qty: 3 },
    ],
  });
  assert.deepEqual(rows.map((r) => [r.name, r.online, r.offline, r.total]), [
    ['Namdev Chiwda', 5, 13, 18],
    ['Namdev Bakarwadi', 2, 0, 2],
    ['Garlic Chiwda', 0, 0, 0],
  ]);
  assert.deepEqual(rows[0].sizes, [
    { size: '200g', online: 5, offline: 10, total: 15 },
    { size: '1kg', online: 0, offline: 3, total: 3 },
  ]);
  assert.equal(rows[2].inCatalog, true);
});

test('matches lines without a known product id to the catalog by name', () => {
  const rows = mergeUnitsSold({
    products,
    online: [{ product: 'deleted-id', name: 'namdev  bakarwadi ', qty: 1 }],
    offline: [{ name: 'Namdev Bakarwadi', qty: 4 }],
  });
  const bakarwadi = rows.find((r) => r.key === 'p2');
  assert.deepEqual([bakarwadi.online, bakarwadi.offline, bakarwadi.total], [1, 4, 5]);
  assert.equal(rows.length, 3);
});

test('keeps custom items as their own rows, merged by name', () => {
  const rows = mergeUnitsSold({
    products,
    offline: [
      { name: 'Gift Hamper', qty: 2 },
      { name: 'gift hamper', qty: 1 },
      { name: '', qty: 1 },
    ],
  });
  const hamper = rows.find((r) => r.name === 'Gift Hamper');
  assert.deepEqual([hamper.inCatalog, hamper.offline, hamper.total], [false, 3, 3]);
  assert.deepEqual(hamper.sizes, [{ size: '', online: 0, offline: 3, total: 3 }]);
  assert.ok(rows.some((r) => r.name === 'Unnamed item' && r.total === 1));
});

test('ignores lines with no quantity', () => {
  const rows = mergeUnitsSold({ products, online: [{ product: 'p1', qty: 0 }, { product: 'p1', qty: null }] });
  assert.equal(rows.find((r) => r.key === 'p1').total, 0);
  assert.equal(rows.length, 3);
});
