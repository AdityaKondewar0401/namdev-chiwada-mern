import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// WhatsAppFloat is rendered globally (once, inside App.jsx's Layout) so it
// appears on every storefront page. Two things make it move/hide itself
// rather than always sitting at fixed bottom-5/right-5:
//
// 1. ProductDetailPage.jsx has its own mobile sticky add-to-cart bar in the
//    exact same bottom-right band. This USED TO be handled by
//    ProductDetailPage dispatching a `pdp-sticky-bar` CustomEvent that this
//    component listened for — but that's a real cross-component race:
//    ProductDetailPage sits earlier in the tree (inside <main>, before this
//    component in <Layout>), so its first dispatch fires before this
//    component's listener even exists, and (confirmed by tracing it) React
//    18 StrictMode's mount→cleanup→mount effect replay in dev makes the
//    event's resting value unpredictable on top of that. Rather than fight
//    event timing, this is now a pure CSS breakpoint switch: on a product
//    page, the button sits raised above the mobile sticky bar's band
//    (`bottom-24`) below the `lg` breakpoint, where that bar actually
//    exists, and back at its normal spot at `lg` and up. A CSS media query
//    is evaluated by the browser at layout/paint time against whatever the
//    real viewport is — there's no JS timing to race.
// 2. CheckoutPage's full-width mobile sticky "Pay"/"Place Order" bar sits
//    in the exact same bottom-right band and has a higher z-index/opaque
//    background, so on /checkout the WhatsApp button was getting visually
//    clipped and partially covering the "Pay" button's own tap target —
//    right where a mobile shopper is trying to complete payment. Hiding it
//    on /checkout removes that clash; CartPage's own sticky bar instead
//    reserves `right: 84` to coexist with this button rather than needing
//    it hidden.
// `phone` / `message` are actually honored (App.jsx's <Layout> passes
// these — e.g. phone="919130160491").
//
// 3. The button used to sit fixed at bottom-right on every page, which
//    meant it kept floating on top of the footer once a shopper scrolled
//    all the way down, overlapping the footer's own social icons/links.
//    Fixed by watching Footer.jsx's <footer id="site-footer"> with an
//    IntersectionObserver: as soon as any part of the footer enters the
//    viewport, this button hides itself, and it reappears the moment the
//    footer scrolls back out of view.
const isProductDetailRoute = (pathname) => /^\/products\/[^/]+$/.test(pathname);

export default function WhatsAppFloat({ phone = '919130160491', message = "Namaste! I'd like to place an order / inquire about Namdev Chiwda products." }) {
  const location = useLocation();
  const [footerVisible, setFooterVisible] = useState(false);
  const isProductDetail = isProductDetailRoute(location.pathname);

  // Re-attach on every route change: Footer.jsx is rendered once per page
  // inside the shared Layout, but the DOM node is fresh on each navigation,
  // and re-observing a stale/detached element would silently stop working.
  useEffect(() => {
    const footerEl = document.getElementById('site-footer');
    if (!footerEl) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(footerEl);
    return () => observer.disconnect();
  }, [location.pathname]);

  const hidden = location.pathname === '/checkout' || footerVisible;

  if (hidden) return null;

  const handleClick = () => {
    const msg = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      title="Chat on WhatsApp"
      aria-label="Chat on WhatsApp"
      // Raised above the mobile sticky add-to-cart bar's band on a product
      // page (below `lg`, where that bar actually renders — see
      // ProductDetailPage's own `lg:hidden` wrapper on it); normal spot
      // everywhere else, and always normal at `lg` and up.
      className={`fixed right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform duration-200 hover:scale-110 animate-pulse2 ${
        isProductDetail ? 'bottom-24 lg:bottom-5' : 'bottom-5'
      }`}
      style={{
        background: '#25D366',
        boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
        marginBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Same Simple Icons WhatsApp glyph the footer's social row uses
          (cdn.simpleicons.org/whatsapp/<hex>), just recolored white since
          this button's own background is already WhatsApp green — a
          plain speech-bubble emoji was standing in for it before. */}
      <img
        src="https://cdn.simpleicons.org/whatsapp/FFFFFF"
        alt=""
        width={26}
        height={26}
        loading="lazy"
        decoding="async"
      />
    </button>
  );
}
