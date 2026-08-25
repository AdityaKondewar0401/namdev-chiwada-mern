// client/src/components/SEO.jsx
//
// Single reusable component for every page's <head> metadata: title,
// description, canonical URL, robots directives, Open Graph, Twitter/X
// card, and JSON-LD structured data. Every public page should render one
// <SEO /> near the top of its JSX; every private/authenticated page should
// render one too, with `robots="noindex,nofollow"`, so indexing rules are
// explicit and consistent instead of left to chance.
//
// Manages document.head directly via useEffect instead of react-helmet-async
// — that library's side-effect commit never actually reaches document.head
// under this project's Vite 8 (Rolldown) build: confirmed by reproducing
// with a bare <Helmet><title>...</title></Helmet> at the app root in both
// `vite` dev and the production build — document.title never changed and no
// data-rh-marked elements ever appeared. Rather than fight a third-party
// library's internals against a very new bundler, this manages the same
// small set of tags directly — title, meta, link[rel=canonical], and
// script[type=application/ld+json] — which is simple enough not to need a
// dependency. Every managed element carries `data-seo="true"` so a later
// page's effect can find and update/replace exactly the tags this component
// owns, never touching the static fallback tags baked into index.html.
//
// Honest limitation, same as before: Googlebot renders JavaScript and will
// see these tags, but crawlers that DON'T execute JS (most social-preview
// bots — Facebook/WhatsApp/LinkedIn scrapers, some SEO tools) only ever see
// the static defaults in client/index.html, not this per-page data.

import { useEffect } from 'react';
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  DEFAULT_DESCRIPTION,
  TWITTER_HANDLE,
  isProductionHost,
} from '../config/seo.config';

function setMetaByAttr(attrName, attrValue, content) {
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    el.setAttribute('data-seo', 'true');
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMetaByAttr(attrName, attrValue) {
  document.head.querySelector(`meta[${attrName}="${attrValue}"]`)?.remove();
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    el.setAttribute('data-seo', 'true');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

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
  // JSON-LD stringified here (not in the dependency array) so effect
  // dependencies stay primitive — object identity from callers building a
  // fresh object every render would otherwise re-run this effect every render.
  const jsonLdJson = JSON.stringify(jsonLdList);

  useEffect(() => {
    document.title = title;

    setMetaByAttr('name', 'description', description);
    if (keywords) setMetaByAttr('name', 'keywords', keywords);
    else removeMetaByAttr('name', 'keywords');
    setMetaByAttr('name', 'robots', effectiveRobots);
    setCanonical(canonicalUrl);

    // Open Graph
    setMetaByAttr('property', 'og:type', type === 'product' ? 'product' : 'website');
    setMetaByAttr('property', 'og:site_name', SITE_NAME);
    setMetaByAttr('property', 'og:title', title);
    setMetaByAttr('property', 'og:description', description);
    setMetaByAttr('property', 'og:url', canonicalUrl);
    setMetaByAttr('property', 'og:image', imageUrl);
    if (imageAlt) setMetaByAttr('property', 'og:image:alt', imageAlt);
    else removeMetaByAttr('property', 'og:image:alt');
    setMetaByAttr('property', 'og:locale', 'en_IN');

    // Twitter/X
    setMetaByAttr('name', 'twitter:card', 'summary_large_image');
    if (TWITTER_HANDLE) setMetaByAttr('name', 'twitter:site', TWITTER_HANDLE);
    else removeMetaByAttr('name', 'twitter:site');
    setMetaByAttr('name', 'twitter:title', title);
    setMetaByAttr('name', 'twitter:description', description);
    setMetaByAttr('name', 'twitter:image', imageUrl);
    if (imageAlt) setMetaByAttr('name', 'twitter:image:alt', imageAlt);
    else removeMetaByAttr('name', 'twitter:image:alt');

    // JSON-LD — remove every previously-managed structured-data script
    // first since the count/shape varies per page (e.g. Product +
    // Breadcrumb on a product page vs. just Organization on the homepage).
    document.head.querySelectorAll('script[data-seo-jsonld="true"]').forEach((el) => el.remove());
    const parsed = JSON.parse(jsonLdJson).filter(Boolean);
    parsed.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }, [title, description, canonicalUrl, effectiveRobots, imageUrl, imageAlt, type, keywords, jsonLdJson]);

  return null;
}
