// server/validators/uploadValidators.js
//
// Note: the actual file (type/size/mimetype) is validated by multer +
// multer-storage-cloudinary's own file filter/limits in config/cloudinary.js
// before it ever reaches the controller — this file only validates the
// non-file parts of these requests (route params).

const { param } = require('express-validator');

// Cloudinary public IDs are folder-path-like: letters, digits, underscore,
// hyphen, and forward slash for folder separators. Rejecting anything
// else blocks path-traversal-style or otherwise malformed ids before
// they're handed to cloudinary.uploader.destroy().
const deleteImage = [
  param('publicId')
    .exists({ checkFalsy: true }).withMessage('publicId is required')
    .bail()
    .isString().withMessage('publicId must be a string')
    .bail()
    .isLength({ min: 1, max: 200 }).withMessage('publicId must be at most 200 characters')
    .bail()
    .matches(/^[A-Za-z0-9_\-/]+$/).withMessage('publicId contains invalid characters'),
];

module.exports = { deleteImage };
