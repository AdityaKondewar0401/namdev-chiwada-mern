// server/utils/imageSignature.js
//
// Detects a file's REAL type from its binary signature ("magic bytes"),
// not from the client-supplied filename extension or Content-Type header
// — both of which are just text the uploader typed/set and can claim
// anything regardless of what bytes actually follow. A file named
// "product.png" with a browser-set `Content-Type: image/png` can still
// contain arbitrary bytes (an HTML/SVG/script payload, a polyglot file,
// etc.) — only reading the actual first few bytes tells you the truth.
//
// Deliberately hand-rolled rather than pulling in a dependency: this app
// only needs to recognize the 3 formats it accepts (matching Cloudinary's
// own `allowed_formats: ['jpg', 'jpeg', 'png', 'webp']` in
// config/cloudinary.js), and each has a short, well-documented, stable
// magic-byte signature — no need for a general-purpose file-type library
// and its dependency/maintenance surface for 3 fixed checks.

const SIGNATURES = [
  {
    format: 'png',
    mimeType: 'image/png',
    // 89 50 4E 47 0D 0A 1A 0A
    matches: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
      buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a,
  },
  {
    format: 'jpeg',
    mimeType: 'image/jpeg',
    // FF D8 FF (every valid JPEG starts with this, regardless of variant)
    matches: (buf) =>
      buf.length >= 3 &&
      buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  {
    format: 'webp',
    mimeType: 'image/webp',
    // "RIFF" .... "WEBP" — RIFF container with a WEBP fourCC at offset 8
    matches: (buf) =>
      buf.length >= 12 &&
      buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && // "RIFF"
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50, // "WEBP"
  },
];

/**
 * Inspects the actual bytes of a buffer and returns the detected image
 * format, or null if it doesn't match any allowed signature — regardless
 * of what the uploader's filename or Content-Type header claimed.
 *
 * @param {Buffer} buffer
 * @returns {{ format: string, mimeType: string } | null}
 */
function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  for (const sig of SIGNATURES) {
    if (sig.matches(buffer)) {
      return { format: sig.format, mimeType: sig.mimeType };
    }
  }
  return null;
}

module.exports = { detectImageType };
