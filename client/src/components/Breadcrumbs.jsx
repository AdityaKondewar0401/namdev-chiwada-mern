// client/src/components/Breadcrumbs.jsx
//
// Visible breadcrumb navigation. Styled to match the small "Home › Products
// › ..." breadcrumb pattern already used inline on ProductDetailPage,
// CartPage, and ContactPage, but as one shared component so:
//   1. it doesn't get re-implemented slightly differently on every page, and
//   2. the exact same `items` array can be handed to
//      structuredData.js's buildBreadcrumbSchema(), guaranteeing the visible
//      breadcrumbs and the BreadcrumbList JSON-LD always describe the same
//      URLs (a Google structured-data requirement).
//
// `items` is [{ label, path }], in display order, e.g.:
//   [{ label: 'Home', path: '/' }, { label: 'Products', path: '/products' }, { label: product.name, path: `/products/${slug}` }]
// The last item renders as plain text (current page), not a link.

import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items, dark = false, className = '' }) {
  if (!items || items.length === 0) return null;

  const linkClass = dark
    ? 'text-white/50 hover:text-white transition-colors'
    : 'text-brown-mid/50 hover:text-saffron transition-colors';
  const currentClass = dark ? 'text-white font-medium' : 'text-brown-dark font-medium';

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs flex-wrap ${className}`}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.path} className="flex items-center gap-1.5">
            {isLast ? (
              <span className={`${currentClass} truncate max-w-48`} aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link to={item.path} className={linkClass}>
                {item.label}
              </Link>
            )}
            {!isLast && <span className={dark ? 'text-white/30' : 'text-brown-mid/30'}>›</span>}
          </span>
        );
      })}
    </nav>
  );
}
