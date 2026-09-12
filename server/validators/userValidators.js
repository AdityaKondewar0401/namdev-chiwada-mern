// server/validators/userValidators.js

const { query } = require('express-validator');
const { mongoIdParam, paginationQuery } = require('./common');

const adminListUsers = [
  ...paginationQuery,
  query('search').optional({ values: 'falsy' }).isString().isLength({ max: 100 }).withMessage('search must be at most 100 characters'),
  query('role').optional({ values: 'falsy' }).isIn(['user', 'admin']).withMessage("role must be 'user' or 'admin'"),
];

const adminGetUser = [mongoIdParam('id')];

module.exports = {
  adminListUsers,
  adminGetUser,
};
