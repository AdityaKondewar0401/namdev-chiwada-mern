const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary-side params shared by every upload — enforced by Cloudinary
// itself as a second, independent layer on top of our own content check
// in uploadController.js (see UPLOAD_FOLDER / ALLOWED_FORMATS below).
// allowed_formats intentionally excludes svg: SVG is an XML/text format
// that can carry an embedded <script>, so allowing it would reopen a
// stored-XSS path that binary raster formats don't have.
const UPLOAD_FOLDER = 'namdev-chiwada';
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const UPLOAD_TRANSFORMATION = [
  { width: 800, height: 800, crop: 'limit' }, // Max size
  { quality: 'auto' },                         // Auto compress
  { fetch_format: 'auto' },                    // Best format
];

// ── Storage: memory, not disk, and NOT streamed straight through to
// Cloudinary either ─────────────────────────────────────────────────
// Previously this used multer-storage-cloudinary's CloudinaryStorage
// engine, which pipes the incoming upload stream directly to Cloudinary's
// API as bytes arrive — meaning nothing on our side ever inspects the
// actual file content, only multer's `fileFilter` below, which only sees
// the CLIENT-SUPPLIED `file.mimetype` string (from the multipart part's
// Content-Type header). That header is attacker-controlled: a request can
// name a file "product.png" and set Content-Type: image/png while the
// actual bytes are anything at all (a script, an HTML payload, a
// polyglot file) — fileFilter alone would wave it straight through to
// Cloudinary, relying entirely on Cloudinary's own downstream validation
// as the only real content check.
//
// Buffering into memory here means the actual bytes are fully available
// on OUR server BEFORE any external call is made, so uploadController.js
// can verify the real file signature (magic bytes — see
// utils/imageSignature.js) itself, independent of Cloudinary. This is a
// deliberate memory/latency trade-off (files fully buffer before
// upload starts) that's negligible at this app's scale and the 5MB cap
// enforced below.
const storage = multer.memoryStorage();

// Multer upload middleware. This fileFilter is a CHEAP, EARLY rejection
// only (fails fast on the common case of a clearly-wrong content type
// without spending time buffering the whole request body) — it is
// explicitly NOT the real security boundary. The actual content
// verification happens in uploadController.js against the buffered
// bytes via detectImageType(), which is what actually decides whether a
// file gets forwarded to Cloudinary at all.
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      // This message is deliberately written for the end user (the admin
      // uploading a product image) — mark it safe to show verbatim via
      // the errorHandler's `err.expose` convention, rather than letting
      // it fall through to the generic "Something went wrong" default.
      const err = new Error('Only image files allowed!');
      err.statusCode = 400;
      err.expose = true;
      cb(err, false);
    }
  },
});

module.exports = { cloudinary, upload, UPLOAD_FOLDER, ALLOWED_FORMATS, UPLOAD_TRANSFORMATION };
