// server/validators/b2bAdminCatalogValidators.js

const { body } = require('express-validator');
const { mongoIdParam } = require('./common');

exports.catalogItemIdParam = [mongoIdParam('id')];

const tierOverridesChain = [
  body('tierOverrides').optional().isArray().withMessage('tierOverrides must be an array'),
  body('tierOverrides.*.tier').isMongoId().withMessage('tierOverrides[].tier must be a valid id'),
  body('tierOverrides.*.pricePerUnit').isFloat({ min: 0 }).withMessage('tierOverrides[].pricePerUnit must be >= 0'),
];

exports.createCatalogItem = [
  body('product').exists({ checkFalsy: true }).withMessage('product is required').bail()
    .isMongoId().withMessage('product must be a valid id'),
  body('size').exists({ checkFalsy: true }).withMessage('size is required').bail()
    .isString().trim().isLength({ max: 30 }),
  body('unitsPerCase').exists().withMessage('unitsPerCase is required').bail()
    .isInt({ min: 1 }).withMessage('unitsPerCase must be a positive integer'),
  body('moqCases').exists().withMessage('moqCases is required').bail()
    .isInt({ min: 1 }).withMessage('moqCases must be a positive integer'),
  body('basePricePerUnit').exists().withMessage('basePricePerUnit is required').bail()
    .isFloat({ min: 0.01 }).withMessage('basePricePerUnit must be > 0'),
  body('hsnCode').optional({ values: 'falsy' }).isString().trim().isLength({ max: 20 }),
  body('active').optional().isBoolean(),
  body('sortOrder').optional().isInt(),
  ...tierOverridesChain,
];

exports.updateCatalogItem = [
  body('unitsPerCase').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('unitsPerCase must be a positive integer'),
  body('moqCases').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('moqCases must be a positive integer'),
  body('basePricePerUnit').optional({ values: 'falsy' }).isFloat({ min: 0.01 }).withMessage('basePricePerUnit must be > 0'),
  body('hsnCode').optional({ values: 'falsy' }).isString().trim().isLength({ max: 20 }),
  body('active').optional().isBoolean(),
  body('sortOrder').optional().isInt(),
  ...tierOverridesChain,
];
