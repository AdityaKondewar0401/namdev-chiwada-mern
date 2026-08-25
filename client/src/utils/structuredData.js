// client/src/utils/structuredData.js
//
// Pure functions that build Schema.org-compatible JSON-LD objects from real
// data already present in the app (product documents, visible breadcrumb
// trails, visible FAQ content). Nothing here invents facts, ratings,
// reviews, or business information — every field is either passed in from
// an actual Product document, or is a static, genuinely-true brand fact
// also stated elsewhere on the site (name, url, logo, social links).
//
// No LocalBusiness schema is defined here on purpose — see the SEO report
// for why (the business asked not to make the physical shop address more
// discoverable via search).

import { SITE_URL, SITE_NAME, SOCIAL_PROFILES } from '../config/seo.config';

/**
 * Organization schema — intended for the homepage only (Schema.org doesn't
 * expect/need this repeated on every page).
 */
export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    sameAs: Object.values(SOCIAL_PROFILES),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'care@namdevchiwda.com',
      telephone: '+91-9130160491',
      areaServed: 'IN',
      availableLanguage: ['en', 'mr'],
    },
  };
}

/**
 * Product schema, built entirely from an actual Product document fetched
 * from the API. Only includes aggregateRating when the product genuinely
 * has reviews (reviews > 0) — the same rating/review count already shown
 * on the visible product card/page, never a separately-invented number.
 */
export function buildProductSchema(product) {
  if (!product) return null;

  const canonicalUrl = `${SITE_URL}/products/${product.slug || product._id}`;
  const images = [product.img, ...(product.images || [])].filter(Boolean);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.desc,
    image: images,
    url: canonicalUrl,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    sku: product._id,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'INR',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  if (typeof product.rating === 'number' && product.reviews > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews,
    };
  }

  return schema;
}

/**
 * BreadcrumbList schema. `items` is [{ label, path }] in display order,
 * where `path` is site-relative ("/", "/products", "/products/slug"...).
 * Callers should build this from the SAME array used to render the visible
 * breadcrumb nav (see Breadcrumbs.jsx), so structured data and on-page
 * content always agree, per Google's structured-data guidelines.
 */
export function buildBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${SITE_URL}${item.path === '/' ? '' : item.path}`,
    })),
  };
}

/**
 * FAQPage schema. `faqs` is [{ question, answer }] — must match the
 * genuinely visible, human-readable FAQ content on the page (never used to
 * mark up hidden or fabricated Q&A).
 */
export function buildFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
