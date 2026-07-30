const { cloudinary } = require('../config/cloudinary');

// @desc  Upload single image
// @route POST /api/upload
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    // Cloudinary URL is automatically set by multer-storage-cloudinary
    res.json({
      success: true,
      url: req.file.path,         // Cloudinary URL
      publicId: req.file.filename, // Cloudinary public ID
      message: 'Image uploaded successfully!',
    });

  } catch (err) {
    next(err);
  }
};

// @desc  Upload multiple images
// @route POST /api/upload/multiple
exports.uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided',
      });
    }

    const urls = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
    }));

    res.json({
      success: true,
      images: urls,
      message: `${urls.length} images uploaded successfully!`,
    });

  } catch (err) {
    next(err);
  }
};

// @desc  Delete image from Cloudinary
// @route DELETE /api/upload/:publicId
exports.deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.params;

    await cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });

  } catch (err) {
    next(err);
  }
};