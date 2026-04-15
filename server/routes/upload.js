const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
  uploadImage,
  uploadMultiple,
  deleteImage,
} = require('../controllers/uploadController');
const { protect, admin } = require('../middleware/auth');

// All upload routes require admin login
router.use(protect, admin);

// Single image upload
router.post('/', upload.single('image'), uploadImage);

// Multiple images upload (max 4)
router.post('/multiple', upload.array('images', 4), uploadMultiple);

// Delete image
router.delete('/:publicId', deleteImage);

module.exports = router;