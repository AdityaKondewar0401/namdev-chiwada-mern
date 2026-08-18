// ─────────────────────────────────────────────
// Cloudinary URL helpers  (NEW FILE)
//
// The codebase previously hardcoded raw Cloudinary URLs directly in
// HomePage.jsx with no transform params, e.g.:
//   https://res.cloudinary.com/dz7ykg6qr/image/upload/v.../special1_sy4zxa.png
//
// This file centralizes the two things every image on the homepage
// needs: (1) f_auto,q_auto so Cloudinary serves the best format/
// compression per-browser, and (2) a responsive srcset so mobile
// doesn't download a desktop-sized PNG.
//
// Usage:
//   import { cldUrl, cldSrcSet } from '../utils/cloudinary';
//   <img src={cldUrl(product.img)} srcSet={cldSrcSet(product.img)} ... />
// ─────────────────────────────────────────────

const UPLOAD_MARKER = '/upload/';

/**
 * Insert a Cloudinary transformation string right after `/upload/`.
 * cldUrl(url)                       -> same image, f_auto,q_auto applied
 * cldUrl(url, 'f_auto,q_auto,w_600') -> resized + optimized
 */
export function cldUrl(url, transform = 'f_auto,q_auto') {
  if (!url || typeof url !== 'string' || !url.includes(UPLOAD_MARKER)) return url;
  return url.replace(UPLOAD_MARKER, `${UPLOAD_MARKER}${transform}/`);
}

/**
 * Build a responsive srcset string for a Cloudinary image.
 * Default widths cover a 375px phone up through a 1400px desktop hero.
 */
export function cldSrcSet(url, widths = [400, 600, 800, 1000, 1400], transform = 'f_auto,q_auto') {
  if (!url || typeof url !== 'string' || !url.includes(UPLOAD_MARKER)) return undefined;
  return widths
    .map((w) => `${cldUrl(url, `${transform},w_${w}`)} ${w}w`)
    .join(', ');
}

/**
 * Recover the Cloudinary public_id (including folder) from a delivery URL,
 * e.g. ".../upload/v1234/namdev-chiwada/abc123.jpg" -> "namdev-chiwada/abc123".
 * Needed to call DELETE /api/upload/:publicId, since the admin product form
 * only has the URL for images already saved on a product (not upload-time
 * publicId responses). Returns null if the URL doesn't look Cloudinary-shaped.
 */
export function publicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:[?#].*)?$/);
  return match ? match[1] : null;
}