const Product = require('../models/Product');
const SEED_PRODUCTS = require('../config/seedData');

// @desc  Get all products with filter/sort/search
// @route GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const { category, sort, search, featured, page = 1, limit = 20 } = req.query;
    const query = {};

    if (category && category !== 'all') query.category = category;
    if (featured === 'true') query.featured = true;
    if (search) query.$text = { $search: search };

    let sortObj = { sortOrder: 1 }; // Default: our custom order
    if (sort === 'price-asc')  sortObj = { price: 1 };
    if (sort === 'price-desc') sortObj = { price: -1 };
    if (sort === 'rating')     sortObj = { rating: -1 };
    if (sort === 'popular')    sortObj = { reviews: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, count: products.length, total, products });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single product by ID or slug
// @route GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try finding by MongoDB ID first, then by slug
    let product = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({ slug: id });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get related products (same category, exclude current)
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    }).limit(3);

    res.json({ success: true, product, related });
  } catch (err) {
    next(err);
  }
};

// @desc  Create product (admin only)
// @route POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    // Auto generate slug if not provided
    if (!req.body.slug && req.body.name) {
      req.body.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// @desc  Update product (admin only)
// @route PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete product (admin only)
// @route DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: `"${product.name}" deleted successfully` });
  } catch (err) {
    next(err);
  }
};

// @desc  Seed products — clears DB and inserts fresh data
// @route POST /api/products/seed
exports.seedProducts = async (req, res, next) => {
  try {
    // Step 1: Delete ALL existing products
    await Product.deleteMany({});
    console.log('✅ Cleared existing products');

    // Step 2: Insert fresh products from seedData.js
    const products = await Product.insertMany(SEED_PRODUCTS);
    console.log(`✅ Inserted ${products.length} products`);

    res.json({
      success: true,
      count: products.length,
      message: `Database cleaned and ${products.length} products inserted!`,
      products: products.map(p => ({
        id: p._id,
        name: p.name,
        slug: p.slug,
        price: p.price,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get featured products (for homepage)
// @route GET /api/products/featured
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ featured: true })
      .sort({ sortOrder: 1 })
      .limit(4);

    res.json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
};

// @desc  Search products
// @route GET /api/products/search?q=chiwada
exports.searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const products = await Product.find({
      $or: [
        { name:  { $regex: q, $options: 'i' } },
        { sub:   { $regex: q, $options: 'i' } },
        { desc:  { $regex: q, $options: 'i' } },
        { intro: { $regex: q, $options: 'i' } },
      ],
    }).limit(10);

    res.json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
};