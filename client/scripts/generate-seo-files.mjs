#!/usr/bin/env node
// client/scripts/generate-seo-files.mjs
//
// Build-time generator for /public/sitemap.xml and /public/robots.txt
// (Steps 15, 16 and 18 of the SEO plan).
//
// WHY BUILD-TIME, NOT A SERVER ROUTE:
// The Express API and the React SPA are deployed to two different hosts
// (API on Railway/Render, static site on Vercel — see AGENT.md §5/§21).
// Google needs sitemap.xml and robots.txt served from the SITE's own
// domain (https://namdevchiwda.com/sitemap.xml), not the API's domain, so
// generating them as static files that ship inside the Vercel build output
// is the correct place for them in this architecture — not a new Express
// route on a different host.
//
// HOW IT RUNS:
// Wired up as the client package's "prebuild" script (see package.json) —
// npm automatically runs prebuild before build for `npm run build`, so
// this always executes before `vite build`, and its output lands in
// client/public/, which Vite copies byte-for-byte into client/dist/.
//
// PRODUCT URLS:
// Product slugs come from the live API at build time (GET /api/products),
// not a hardcoded list, so the sitemap tracks the actual MongoDB catalog
// without needing a manual update every time a product is added. If the
// API is unreachable during a build (e.g. the backend happens to be
// asleep/down at deploy time), this is caught and logged as a warning —
// the build still produces a valid sitemap with just the static pages
// rather than failing the whole deployment over a transient network issue.
//
// PREVIEW-DEPLOYMENT SAFETY (Step 18):
// Vercel sets VERCEL_ENV to "production", "preview", or "development"
// automatically at build time. When it's "preview", this script writes a
// robots.txt that disallows everything, so a Vercel preview URL can never
// get crawled/indexed as a duplicate of the real production site. This is
// the build-time half of the preview-safety strategy; the client-side half
// is the `isProductionHost()` check in SEO.jsx, which also forces
// `noindex` on the actual rendered page `<meta name="robots">` tag for any
// non-production hostname, including this same preview case.

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

// Single source of truth for the production domain, same fallback value as
// client/src/config/seo.config.js — kept in sync there for the same reason
// documented in that file: one place to change when the real domain goes
// live, or to point at a staging domain for testing.
const SITE_URL = (process.env.VITE_SITE_URL || 'https://namdevchiwda.com').replace(/\/+$/, '');

// API base to fetch product slugs from at build time. Falls back to the
// same production API origin already used as the Vite dev proxy target
// (see client/vite.config.js) so a build works out of the box even before
// a dedicated VITE_API_URL is configured for this script's environment.
const API_BASE = (process.env.VITE_API_URL || 'https://namdev-backend.onrender.com').replace(/\/+$/, '');

const IS_PREVIEW = process.env.VERCEL_ENV === 'preview';

// Canonical, indexable, static public pages. Deliberately excludes every
// authenticated route (/account, /wishlist, /cart, /checkout, /orders),
// /admin, /login, /register, the legacy /namkeen/:id redirect, and the
// destructive-admin-only /products/seed API concern — none of those should
// ever appear in a sitemap. See AGENT.md §7 for the full route table this
// was cross-checked against.
const STATIC_PAGES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/chiwada', changefreq: 'monthly', priority: '0.8' },
  { path: '/solapuri-chiwada', changefreq: 'monthly', priority: '0.8' },
  { path: '/maharashtrian-snacks', changefreq: 'monthly', priority: '0.8' },
  { path: '/our-history', changefreq: 'monthly', priority: '0.6' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
];

async function fetchProductUrls() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(`${API_BASE}/api/products?limit=1000`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[generate-seo-files] API responded ${res.status} — sitemap will omit product URLs.`);
      return [];
    }

    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];

    return products
      .filter((p) => p.slug || p._id)
      .map((p) => ({
        path: `/products/${p.slug || p._id}`,
        changefreq: 'weekly',
        priority: '0.7',
      }));
  } catch (err) {
    console.warn(
      `[generate-seo-files] Could not fetch products from ${API_BASE} (${err.message}). ` +
      'Sitemap will still be generated with static pages only — this does not fail the build.'
    );
    return [];
  }
}

function buildSitemapXml(urls) {
  const today = new Date().toISOString().split('T')[0];
  const entries = urls
    .map(
      (u) => `  <url>
    <loc>${SITE_URL}${u.path === '/' ? '/' : u.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function buildRobotsTxt() {
  if (IS_PREVIEW) {
    // Blanket-block: this is a Vercel preview deployment, not the real
    // production site. No sitemap reference either — nothing on this host
    // should be crawled at all.
    return `User-agent: *
Disallow: /
`;
  }

  return `User-agent: *
Allow: /

Disallow: /admin
Disallow: /account
Disallow: /wishlist
Disallow: /cart
Disallow: /checkout
Disallow: /orders
Disallow: /login
Disallow: /register

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });

  const productUrls = await fetchProductUrls();
  const allUrls = [...STATIC_PAGES, ...productUrls];

  await writeFile(path.join(PUBLIC_DIR, 'sitemap.xml'), buildSitemapXml(allUrls), 'utf8');
  await writeFile(path.join(PUBLIC_DIR, 'robots.txt'), buildRobotsTxt(), 'utf8');

  console.log(
    `[generate-seo-files] Wrote sitemap.xml (${allUrls.length} URLs: ${STATIC_PAGES.length} static + ${productUrls.length} product) ` +
    `and robots.txt (${IS_PREVIEW ? 'PREVIEW — crawling blocked' : 'production — crawling allowed'}).`
  );
}

main().catch((err) => {
  // Never fail the whole deployment just because SEO-file generation had a
  // problem — log loudly and let the actual app build continue.
  console.error('[generate-seo-files] Unexpected error, continuing build without failing it:', err);
});
