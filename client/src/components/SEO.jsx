// client/src/components/SEO.jsx
//
// Single reusable component for every page's <head> metadata: title,
// description, canonical URL, robots directives, Open Graph, Twitter/X
// card, and JSON-LD structured data. Every public page should render one
// <SEO /> near the top of its JSX; every private/authenticated page should
// render one too, with `robots="noindex,nofollow"`, so indexing rules are
// explicit and consistent instead of left to chance.
//
// Built on react-helmet-async (industry-standard for CRA/Vite React apps —
// updates document.head reactively per-route without needing SSR). See the
// "Rendering / crawlability" note in the final SEO report for the honest
// limitation this implies: Googlebot renders JavaScript and will see these
// tags, but crawlers that DON'T execute JS (most social-preview bots —
// Facebook/WhatsApp/LinkedIn scrapers, some SEO tools) will only ever see
// the static defaults baked into client/index.html, not this per-page data.

import { Helmet } from 'react-helmet-async';
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  DEFAULT_DESCRIPTION,
  TWITTER_HANDLE,
  isProductionHost,
} from '../config/seo.config';

/**
 * @param {string} title - Full page title, already composed (this
 *   component does not append a site-name suffix automatically, so callers
 *   control the exact title as specified in the SEO plan for that page).
 * @param {string} [description] - Meta description. Falls back to the
 *   brand default if omitted.
 * @param {string} canonical - REQUIRED. Either an absolute URL or a
 *   site-relative path starting with "/" (e.g. "/solapuri-chiwada"); this
 *   component resolves relative paths against SITE_URL.
 * @param {'index,follow'|'noindex,nofollow'|'noindex,follow'|string} [robots]
 *   Defaults to 'index,follow'. Automatically forced to
 *   'noindex,nofollow' when the app isn't running on the real production
 *   host (see isProductionHost in seo.config.js) — this is the client-side
 *   half of the Vercel-preview-safety strategy described in the SEO report;
 *   the build-time half lives in scripts/generate-seo-files.mjs.
 * @param {string} [image] - Absolute or relative OG/Twitter image URL.
 * @param {string} [imageAlt]
 * @param {'website'|'product'|'article'} [type]
 * @param {string} [keywords] - Comma-separated. Included because it's
 *   harmless, but per the SEO plan this is NOT relied on for rankings.
 * @param {object|object[]} [jsonLd] - One or more JSON-LD objects
 *   (build with client/src/utils/structuredData.js helpers) to embed as
 *   <script type="application/ld+json"> tags.
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  robots = 'index,follow',
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  type = 'website',
  keywords,
  jsonLd,
}) {
  const canonicalUrl = canonical
    ? canonical.startsWith('http')
      ? canonical
      : `${SITE_URL}${canonical.startsWith('/') ? '' : '/'}${canonical}`
    : SITE_URL;

  const imageUrl = image
    ? image.startsWith('http')
      ? image
      : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`
    : DEFAULT_OG_IMAGE;

  // Safety net: force noindex off the real domain regardless of what the
  // page passed in, so a Vercel preview URL can never rank as a duplicate
  // of the production page it's previewing.
  const effectiveRobots = isProductionHost() ? robots : 'noindex,nofollow';

  const jsonLdList = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={effectiveRobots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
      <meta property="og:locale" content="en_IN" />

      {/* Twitter/X */}
      <meta name="twitter:card" content="summary_large_image" />
      {TWITTER_HANDLE && <meta name="twitter:site" content={TWITTER_HANDLE} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}

      {jsonLdList.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
