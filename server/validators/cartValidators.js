// server/validators/cartValidators.js

const { body } = require('express-validator');
const { mongoIdParam } = require('./common');

const addToCart = [
  body('productId')
    .exists({ checkFalsy: true }).withMessage('productId is required')
    .bail()
    .isMongoId().withMessage('productId must be a valid id'),
  body('size')
    .exists({ checkFalsy: true }).withMessage('size is required')
    .bail()
    .isString().withMessage('size must be a string')
    .bail()
    .isLength({ min: 1, max: 50 }).withMessage('size must be between 1 and 50 characters'),
  body('qty')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('qty must be an integer between 1 and 50')
    .toInt(),
];

const updateCartItem = [
  body('productId')
    .exists({ checkFalsy: true }).withMessage('productId is required')
    .bail()
    .isMongoId().withMessage('productId must be a valid id'),
  body('size')
    .exists({ checkFalsy: true }).withMessage('size is required')
    .bail()
    .isString().withMessage('size must be a string')
    .bail()
    .isLength({ min: 1, max: 50 }).withMessage('size must be between 1 and 50 characters'),
  body('quantity')
    .exists().withMessage('quantity is required')
    .bail()
    .isInt({ min: 0, max: 99 }).withMessage('quantity must be an integer between 0 and 99')
    .toInt(),
];

const removeFromCart = [mongoIdParam('itemId')];

module.exports = { addToCart, updateCartItem, removeFromCart };
