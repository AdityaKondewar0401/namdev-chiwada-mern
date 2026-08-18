const crypto = require('crypto');
const { Readable } = require('stream');
const { cloudinary, UPLOAD_FOLDER, ALLOWED_FORMATS, UPLOAD_TRANSFORMATION } = require('../config/cloudinary');
const { detectImageType } = require('../utils/imageSignature');

/**
 * Uploads an already-content-verified buffer to Cloudinary and returns
 * its result ({ secure_url, public_id, ... }). The random public_id is
 * generated SERVER-SIDE — never derived from the uploader-supplied
 * filename — so nothing about the original file name (which is fully
 * attacker-controlled text) ends up as part of a storage path or key.
 */
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const publicId = crypto.randomBytes(16).toString('hex');

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: UPLOAD_FOLDER,
        public_id: publicId,
        resource_type: 'image',
        // Redundant with our own magic-byte check below by design —
        // defense in depth. Even if our check were ever bypassed or
        // buggy, Cloudinary independently refuses anything outside this
        // list based on its own server-side content inspection.
        allowed_formats: ALLOWED_FORMATS,
        transformation: UPLOAD_TRANSFORMATION,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

/**
 * Verifies a multer-buffered file's REAL content (not its claimed
 * filename/mimetype) before allowing it anywhere near Cloudinary. Throws
 * a safe, user-facing 400 error if the bytes don't match one of the
 * image formats this app accepts.
 */
function assertRealImageContent(file) {
  const detected = detectImageType(file.buffer);
  if (!detected) {
    const err = new Error(
      'That file does not appear to be a valid JPEG, PNG, or WEBP image.'
    );
    err.statusCode = 400;
    err.expose = true;
    throw err;
  }
  return detected;
}

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

    // Real, byte-level content check — independent of whatever filename
    // or Content-Type the upload request claimed. This is the actual
    // security boundary; multer's fileFilter (config/cloudinary.js) is
    // only a cheap early rejection, not a substitute for this.
    assertRealImageContent(req.file);

    const result = await uploadBufferToCloudinary(req.file.buffer);

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
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

    // Verify every file's real content BEFORE uploading any of them —
    // if one file in the batch is bogus, reject the whole request rather
    // than partially uploading (avoids orphaned Cloudinary assets from a
    // request the client will see as failed).
    req.files.forEach(assertRealImageContent);

    const results = await Promise.all(
      req.files.map((file) => uploadBufferToCloudinary(file.buffer))
    );

    const images = results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
    }));

    res.json({
      success: true,
      images,
      message: `${images.length} images uploaded successfully!`,
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
