const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
  uploadImage,
  uploadMultiple,
  deleteImage,
} = require('../controllers/uploadController');
const { protect, admin } = require('../middleware/auth');
const { userActionLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const uploadValidators = require('../validators/uploadValidators');

// All upload routes require admin login — Tier 3 (loose, per-user).
router.use(protect, admin, userActionLimiter);

// Single image upload
router.post('/', upload.single('image'), uploadImage);

// Multiple images upload (max 4)
router.post('/multiple', upload.array('images', 4), uploadMultiple);

// Delete image
router.delete('/:publicId', uploadValidators.deleteImage, validate, deleteImage);

module.exports = router;