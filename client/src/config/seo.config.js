// client/src/config/seo.config.js
//
// Single source of truth for the site's canonical production domain and
// brand-level SEO defaults. Every other SEO file (SEO.jsx, structuredData.js,
// the sitemap/robots build script, individual pages) imports SITE_URL from
// here instead of hardcoding `https://namdevchiwda.com` — so connecting the
// real domain later, or testing against a staging domain, is a one-line
// change in one file (or one environment variable, see below).
//
// VITE_SITE_URL is optional. If it's not set (e.g. the env var hasn't been
// configured in Vercel yet), this falls back to the intended production
// domain so canonical/OG/JSON-LD URLs are still correct-shaped even before
// namdevchiwda.com is actually connected and pointed at the deployment.

const RAW_SITE_URL = import.meta.env.VITE_SITE_URL || 'https://www.namdevchiwda.com';

// Strip any trailing slash so every consumer can safely do `${SITE_URL}/path`.
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, '');

export const SITE_NAME = 'Namdev Chiwda';

export const SITE_NAME_MARATHI = 'नामदेव चिवडा';

// Used as the fallback Open Graph / Twitter image when a page doesn't
// supply its own (e.g. product pages use the actual product photo instead).
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/chiwada-1.jpg`;

export const DEFAULT_DESCRIPTION =
  'Namdev Chiwda — authentic Solapuri Chiwada and traditional Maharashtrian snacks, serving Solapur since 1873. Order online, delivered across Maharashtra.';

export const TWITTER_HANDLE = null; // No confirmed official X/Twitter handle yet — omit rather than guess.

// The real WhatsApp/social profile links already used elsewhere in the app
// (Footer.jsx, DistributorshipBand.jsx) — reused here for Organization
// structured data `sameAs`, so we never introduce a second, possibly
// inconsistent, source of truth for these URLs.
export const SOCIAL_PROFILES = {
  instagram: 'https://www.instagram.com/namdevchiwda?igsh=aGJoeDE3eDhpOXRx',
  facebook: 'https://www.facebook.com/share/19AojeQWs4/',
  whatsapp: 'https://wa.me/919130160491',
};

/**
 * True if the app is currently being viewed on the real production host
 * (i.e. the hostname matches SITE_URL). False for localhost, Vercel preview
 * deployments (*.vercel.app), or any other domain the app happens to be
 * served from. SEO.jsx uses this as a client-side safety net — on top of
 * the build-time robots.txt handling in scripts/generate-seo-files.mjs — to
 * force `noindex` on anything that isn't actually the production domain, so
 * a preview deployment can never accidentally get indexed as a duplicate of
 * the real site.
 */
export function isProductionHost() {
  if (typeof window === 'undefined') return true;
  try {
    const productionHost = new URL(SITE_URL).hostname;
    return window.location.hostname === productionHost;
  } catch {
    return true;
  }
}
