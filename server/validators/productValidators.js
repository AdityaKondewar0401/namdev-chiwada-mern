// server/validators/productValidators.js
//
// Schema mirrors models/Product.js field-for-field. `create` requires
// every field the schema requires; `update` treats everything as
// optional (PUT semantics here are partial-update, matching how
// updateProduct actually spreads req.body) but still validates the
// type/length/format of whatever IS sent.

const { body, param, query } = require('express-validator');
const { mongoIdParam, paginationQuery } = require('./common');

const CATEGORIES = ['mild', 'spicy', 'special'];
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Free-text fields (name, desc, etc.) are rendered as plain text on the
// storefront, never through dangerouslySetInnerHTML — but "strict
// format" means rejecting markup-shaped input outright rather than
// trusting React's default escaping as the only line of defense.
const NO_MARKUP_RE = /^[^<>]*$/;

const sizesArray = (chain) =>
  chain
    .optional()
    .isArray({ max: 20 }).withMessage('sizes must be an array of at most 20 entries');

const sizeEntryValidators = [
  body('sizes.*.weight')
    .isString().withMessage('Each size.weight must be a string')
    .bail()
    .isLength({ min: 1, max: 20 }).withMessage('Each size.weight must be at most 20 characters'),
  body('sizes.*.price')
    .isFloat({ min: 0, max: 100000 }).withMessage('Each size.price must be a non-negative number')
    .toFloat(),
];

const imagesArray = (chain) =>
  chain
    .optional()
    .isArray({ max: 20 }).withMessage('images must be an array of at most 20 URLs');

const imageEntryValidator = body('images.*')
  .isString().withMessage('Each image must be a URL string')
  .bail()
  .isURL({ require_protocol: true }).withMessage('Each image must be a valid URL');

const ingredientsArray = (chain) =>
  chain
    .optional()
    .isArray({ max: 50 }).withMessage('ingredients must be an array of at most 50 entries');

const ingredientEntryValidator = body('ingredients.*')
  .isString().withMessage('Each ingredient must be a string')
  .bail()
  .isLength({ min: 1, max: 100 }).withMessage('Each ingredient must be at most 100 characters');

const getProducts = [
  query('category').optional().isIn([...CATEGORIES, 'all']).withMessage(`category must be one of: ${[...CATEGORIES, 'all'].join(', ')}`),
  query('sort').optional().isIn(['price-asc', 'price-desc', 'rating', 'popular']).withMessage('sort must be one of: price-asc, price-desc, rating, popular'),
  query('search').optional().isString().isLength({ max: 100 }).withMessage('search must be at most 100 characters'),
  query('featured').optional().isIn(['true', 'false']).withMessage('featured must be "true" or "false"'),
  ...paginationQuery,
];

const getProduct = [
  // Accepted by either Mongo id or slug (see productController.getProduct)
  // — validate as a bounded, URL-safe token rather than requiring one
  // specific shape.
  param('id')
    .exists({ checkFalsy: true }).withMessage('id is required')
    .bail()
    .isString().isLength({ min: 1, max: 200 }).withMessage('id must be at most 200 characters')
    .bail()
    .matches(/^[a-zA-Z0-9-]+$/).withMessage('id contains invalid characters'),
];

const search = [
  query('q')
    .exists({ checkFalsy: true }).withMessage('q is required')
    .bail()
    .isString().withMessage('q must be a string')
    .bail()
    .isLength({ min: 1, max: 100 }).withMessage('q must be between 1 and 100 characters'),
];

const createProduct = [
  body('name').exists({ checkFalsy: true }).withMessage('name is required').bail().isString().isLength({ min: 2, max: 200 }).withMessage('name must be between 2 and 200 characters').bail().matches(NO_MARKUP_RE).withMessage('name must not contain \'<\' or \'>\' characters'),
  body('namMarathi').optional({ values: 'falsy' }).isString().isLength({ max: 200 }).withMessage('namMarathi must be at most 200 characters').bail().matches(NO_MARKUP_RE).withMessage('namMarathi must not contain \'<\' or \'>\' characters'),
  body('slug').optional({ values: 'falsy' }).isString().matches(SLUG_RE).isLength({ max: 200 }).withMessage('slug must be lowercase letters, numbers and hyphens only'),
  body('sub').optional({ values: 'falsy' }).isString().isLength({ max: 200 }).withMessage('sub must be at most 200 characters').bail().matches(NO_MARKUP_RE).withMessage('sub must not contain \'<\' or \'>\' characters'),
  body('desc').exists({ checkFalsy: true }).withMessage('desc is required').bail().isString().isLength({ min: 1, max: 3000 }).withMessage('desc must be at most 3000 characters').bail().matches(NO_MARKUP_RE).withMessage('desc must not contain \'<\' or \'>\' characters'),
  body('intro').optional({ values: 'falsy' }).isString().isLength({ max: 300 }).withMessage('intro must be at most 300 characters').bail().matches(NO_MARKUP_RE).withMessage('intro must not contain \'<\' or \'>\' characters'),
  body('category').exists({ checkFalsy: true }).withMessage('category is required').bail().isIn(CATEGORIES).withMessage(`category must be one of: ${CATEGORIES.join(', ')}`),
  body('tag').optional({ values: 'falsy' }).isString().isLength({ max: 100 }).withMessage('tag must be at most 100 characters').bail().matches(NO_MARKUP_RE).withMessage('tag must not contain \'<\' or \'>\' characters'),
  body('badge').optional({ values: 'falsy' }).isString().isLength({ max: 100 }).withMessage('badge must be at most 100 characters').bail().matches(NO_MARKUP_RE).withMessage('badge must not contain \'<\' or \'>\' characters'),
  body('badgeColor').optional({ values: 'falsy' }).isString().matches(HEX_COLOR_RE).withMessage('badgeColor must be a hex color like #e07000'),
  sizesArray(body('sizes')),
  ...sizeEntryValidators.map((v) => v.optional()),
  body('price').exists().withMessage('price is required').bail().isFloat({ min: 0, max: 100000 }).withMessage('price must be a non-negative number').toFloat(),
  body('originalPrice').optional().isFloat({ min: 0, max: 100000 }).withMessage('originalPrice must be a non-negative number').toFloat(),
  body('weight').optional({ values: 'falsy' }).isString().isLength({ max: 20 }).withMessage('weight must be at most 20 characters'),
  imagesArray(body('images')),
  imageEntryValidator.optional(),
  body('img').exists({ checkFalsy: true }).withMessage('img is required').bail().isString().isURL({ require_protocol: true }).withMessage('img must be a valid URL'),
  ingredientsArray(body('ingredients')),
  ingredientEntryValidator.optional(),
  body('nutrition').optional().isArray({ max: 50 }).withMessage('nutrition must be an array'),
  body('info').optional({ values: 'falsy' }).isString().isLength({ max: 1000 }).withMessage('info must be at most 1000 characters').bail().matches(NO_MARKUP_RE).withMessage('info must not contain \'<\' or \'>\' characters'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5').toFloat(),
  body('reviews').optional().isInt({ min: 0, max: 1000000 }).withMessage('reviews must be a non-negative integer').toInt(),
  body('inStock').optional().isBoolean().withMessage('inStock must be true or false').toBoolean(),
  body('featured').optional().isBoolean().withMessage('featured must be true or false').toBoolean(),
  body('sortOrder').optional().isInt({ min: -100000, max: 100000 }).withMessage('sortOrder must be an integer').toInt(),
];

// Partial update: every field optional, same type/format rules as create.
const updateProduct = [
  mongoIdParam('id'),
  body('name').optional({ values: 'falsy' }).isString().isLength({ min: 2, max: 200 }).withMessage('name must be between 2 and 200 characters').bail().matches(NO_MARKUP_RE).withMessage('name must not contain \'<\' or \'>\' characters'),
  body('namMarathi').optional({ values: 'falsy' }).isString().isLength({ max: 200 }).withMessage('namMarathi must be at most 200 characters').bail().matches(NO_MARKUP_RE).withMessage('namMarathi must not contain \'<\' or \'>\' characters'),
  body('slug').optional({ values: 'falsy' }).isString().matches(SLUG_RE).isLength({ max: 200 }).withMessage('slug must be lowercase letters, numbers and hyphens only'),
  body('sub').optional({ values: 'falsy' }).isString().isLength({ max: 200 }).withMessage('sub must be at most 200 characters').bail().matches(NO_MARKUP_RE).withMessage('sub must not contain \'<\' or \'>\' characters'),
  body('desc').optional({ values: 'falsy' }).isString().isLength({ min: 1, max: 3000 }).withMessage('desc must be at most 3000 characters').bail().matches(NO_MARKUP_RE).withMessage('desc must not contain \'<\' or \'>\' characters'),
  body('intro').optional({ values: 'falsy' }).isString().isLength({ max: 300 }).withMessage('intro must be at most 300 characters').bail().matches(NO_MARKUP_RE).withMessage('intro must not contain \'<\' or \'>\' characters'),
  body('category').optional({ values: 'falsy' }).isIn(CATEGORIES).withMessage(`category must be one of: ${CATEGORIES.join(', ')}`),
  body('tag').optional({ values: 'falsy' }).isString().isLength({ max: 100 }).withMessage('tag must be at most 100 characters').bail().matches(NO_MARKUP_RE).withMessage('tag must not contain \'<\' or \'>\' characters'),
  body('badge').optional({ values: 'falsy' }).isString().isLength({ max: 100 }).withMessage('badge must be at most 100 characters').bail().matches(NO_MARKUP_RE).withMessage('badge must not contain \'<\' or \'>\' characters'),
  body('badgeColor').optional({ values: 'falsy' }).isString().matches(HEX_COLOR_RE).withMessage('badgeColor must be a hex color like #e07000'),
  sizesArray(body('sizes')),
  ...sizeEntryValidators.map((v) => v.optional()),
  body('price').optional().isFloat({ min: 0, max: 100000 }).withMessage('price must be a non-negative number').toFloat(),
  body('originalPrice').optional().isFloat({ min: 0, max: 100000 }).withMessage('originalPrice must be a non-negative number').toFloat(),
  body('weight').optional({ values: 'falsy' }).isString().isLength({ max: 20 }).withMessage('weight must be at most 20 characters'),
  imagesArray(body('images')),
  imageEntryValidator.optional(),
  body('img').optional({ values: 'falsy' }).isString().isURL({ require_protocol: true }).withMessage('img must be a valid URL'),
  ingredientsArray(body('ingredients')),
  ingredientEntryValidator.optional(),
  body('nutrition').optional().isArray({ max: 50 }).withMessage('nutrition must be an array'),
  body('info').optional({ values: 'falsy' }).isString().isLength({ max: 1000 }).withMessage('info must be at most 1000 characters').bail().matches(NO_MARKUP_RE).withMessage('info must not contain \'<\' or \'>\' characters'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5').toFloat(),
  body('reviews').optional().isInt({ min: 0, max: 1000000 }).withMessage('reviews must be a non-negative integer').toInt(),
  body('inStock').optional().isBoolean().withMessage('inStock must be true or false').toBoolean(),
  body('featured').optional().isBoolean().withMessage('featured must be true or false').toBoolean(),
  body('sortOrder').optional().isInt({ min: -100000, max: 100000 }).withMessage('sortOrder must be an integer').toInt(),
];

const deleteProduct = [mongoIdParam('id')];

module.exports = { getProducts, getProduct, search, createProduct, updateProduct, deleteProduct };
