const errorHandler = (err, req, res, next) => {
  // Always log full details server-side FIRST, regardless of what we're
  // about to tell the client. This is the only copy of the real error —
  // once this function returns, everything past this line is sanitized.
  console.error(`❌ Error on ${req.method} ${req.originalUrl}:`, err.stack || err);

  let statusCode = err.statusCode || err.status || 500;

  // SAFE-BY-DEFAULT: the client never sees err.message unless this error
  // has been explicitly classified below as safe to show. A raw
  // err.message can come from Mongoose driver internals, a third-party
  // SDK (Razorpay/Cloudinary/Shadowfax), or a plain JS TypeError — any of
  // which can contain internal file paths, property names, connection
  // details, or upstream vendor error text that was never meant for an
  // end user. Defaulting to generic and only opting IN specific, known-
  // safe cases means a brand-new error type introduced anywhere in the
  // app is safe by construction, not by someone remembering to sanitize it.
  let message = 'Something went wrong. Please try again.';

  if (err.name === 'CastError') {
    // Mongoose couldn't cast a value to the expected type — almost always
    // means "no such id/resource" from the client's point of view.
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.code === 11000) {
    // Mongoose/MongoDB duplicate key error. err.keyValue is just the
    // field name and the value that collided — safe to name the field
    // (e.g. "Email already exists"), not the underlying driver error.
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      : 'This value already exists';
  } else if (err.name === 'ValidationError' && err.errors) {
    // Mongoose schema validation error. These messages are OUR OWN schema
    // definitions (models/*.js), not raw driver/vendor text, so they're
    // safe to surface as-is.
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'MulterError') {
    // multer's own built-in messages ("File too large", "Too many
    // files", etc.) are already generic and written for end users —
    // safe to pass through directly.
    statusCode = 400;
    message = err.message;
  } else if (
    err.name === 'MongoNetworkError' ||
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoServerSelectionError'
  ) {
    // Database connectivity issue — never expose connection strings,
    // hostnames, or replica set details that can appear in these errors.
    statusCode = 503;
    message = 'Service temporarily unavailable. Please try again shortly.';
  } else if (err.expose === true && typeof err.message === 'string') {
    // Explicit opt-in escape hatch (mirrors the same `err.expose`
    // convention Express itself uses internally): a spot in the code that
    // deliberately threw a message written FOR the end user — e.g.
    // config/cloudinary.js's file-type filter — can mark itself safe by
    // setting `err.expose = true` at the throw site, rather than this
    // handler guessing based on error shape.
    message = err.message;
  }

  // Local-development convenience ONLY — never in staging/production.
  // Surfaces the real message/stack alongside the sanitized one so
  // debugging locally doesn't require tailing server logs, without ever
  // widening what a deployed environment can leak.
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      message,
      debug: { originalMessage: err.message, stack: err.stack },
    });
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
