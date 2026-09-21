// server/controllers/b2bAdminCatalogController.js
//
// Admin catalog-item CRUD (Phase 3). `size` must match one of the
// product's `sizes[].weight`, or the product's single `weight` for a
// single-size product (today's reality for every real product) — this
// is validated here, not in the schema, so the same code works
// unchanged if a product later gains multiple sizes.

const WholesaleCatalogItem = require('../models/WholesaleCatalogItem');
const Product = require('../models/Product');
const B2BOrder = require('../models/B2BOrder');

function validSizeForProduct(product, size) {
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    return product.sizes.some((s) => s.weight === size);
  }
  return product.weight === size;
}

exports.listCatalogItems = async (req, res, next) => {
  try {
    const items = await WholesaleCatalogItem.find()
      .populate('product', 'name namMarathi img weight sizes inStock')
      .populate('tierOverrides.tier', 'name code')
      .sort('sortOrder');
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
};

exports.createCatalogItem = async (req, res, next) => {
  try {
    const { product: productId, size, unitsPerCase, moqCases, basePricePerUnit, hsnCode, tierOverrides, active, sortOrder } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (!validSizeForProduct(product, size)) {
      const validSizes = Array.isArray(product.sizes) && product.sizes.length
        ? product.sizes.map((s) => s.weight).join(', ')
        : product.weight;
      return res.status(400).json({
        success: false,
        message: `"${size}" is not a valid size for ${product.name}. Valid size(s): ${validSizes}.`,
      });
    }

    const item = await WholesaleCatalogItem.create({
      product: productId, size, unitsPerCase, moqCases, basePricePerUnit,
      hsnCode, tierOverrides,
      active: active === undefined ? true : active,
      sortOrder: sortOrder || 0,
    });
    await item.populate('product', 'name namMarathi img weight sizes inStock');

    res.status(201).json({ success: true, item });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'This product and size combination already exists in the catalog.' });
    }
    next(err);
  }
};

exports.updateCatalogItem = async (req, res, next) => {
  try {
    const item = await WholesaleCatalogItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Catalog item not found' });
    }

    // product/size are intentionally NOT editable here — the unique
    // index is keyed on them, so changing either would really mean a
    // different catalog item. Deactivate this one and create a new one.
    const fields = ['unitsPerCase', 'moqCases', 'basePricePerUnit', 'hsnCode', 'tierOverrides', 'active', 'sortOrder'];
    for (const field of fields) {
      if (req.body[field] !== undefined) item[field] = req.body[field];
    }
    await item.save();
    await item.populate('product', 'name namMarathi img weight sizes inStock');

    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

exports.deleteCatalogItem = async (req, res, next) => {
  try {
    const item = await WholesaleCatalogItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Catalog item not found' });
    }

    const everOrdered = await B2BOrder.exists({ 'items.catalogItem': item._id });
    if (everOrdered) {
      return res.status(400).json({
        success: false,
        message: 'This catalog item has been ordered before and cannot be deleted. Deactivate it instead.',
      });
    }

    await item.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
