// server/controllers/b2bCatalogController.js
//
// Business-facing catalog read (Phase 3). Mounted at /api/b2b/catalog,
// guarded by loadBusiness + requireApprovedBusiness — an approved
// business only. Prices are always resolved server-side for the
// requester's own tier; nothing here is ever client-supplied.

const WholesaleCatalogItem = require('../models/WholesaleCatalogItem');
const PriceTier = require('../models/PriceTier');
const { resolveUnitPrice } = require('../utils/b2bPricing');

exports.getCatalog = async (req, res, next) => {
  try {
    const tier = req.business.tier ? await PriceTier.findById(req.business.tier) : null;

    const items = await WholesaleCatalogItem.find({ active: true })
      .populate('product', 'name namMarathi img slug inStock')
      .sort('sortOrder');

    const catalog = items
      .filter((item) => item.product) // guards against a since-deleted product
      .map((item) => ({
        _id: item._id,
        product: {
          _id: item.product._id,
          name: item.product.name,
          namMarathi: item.product.namMarathi,
          img: item.product.img,
          slug: item.product.slug,
        },
        size: item.size,
        unitsPerCase: item.unitsPerCase,
        moqCases: item.moqCases,
        unitPrice: resolveUnitPrice(item, tier),
        inStock: item.product.inStock === true,
      }));

    res.json({ success: true, catalog });
  } catch (err) {
    next(err);
  }
};
