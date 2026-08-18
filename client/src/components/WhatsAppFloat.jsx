import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// WhatsAppFloat is rendered globally (once, inside App.jsx's Layout) so it
// appears on every storefront page. Two things have to make it hide itself
// rather than always showing at fixed bottom-24/right-5:
//
// 1. ProductDetailPage.jsx already dispatches a `pdp-sticky-bar` CustomEvent
//    when its own mobile sticky add-to-cart bar is visible, expecting this
//    component to hide during that overlap — previously this component
//    ignored that event entirely (a stale comment in ProductDetailPage
//    described behavior that didn't actually exist yet). Now it does.
// 2. CheckoutPage's full-width mobile sticky "Pay"/"Place Order" bar sits
//    in the exact same bottom-right band (bottom-24..~130px on the right
//    edge) and has a higher z-index/opaque background, so on /checkout the
//    WhatsApp button was getting visually clipped and partially covering
//    the "Pay" button's own tap target — right where a mobile shopper is
//    trying to complete payment. Hiding it on /checkout removes that clash;
//    CartPage's own sticky bar instead reserves `right: 84` to coexist with
//    this button rather than needing it hidden.
// `phone` / `message` are now actually honored (App.jsx's <Layout> already
// passed these — e.g. phone="919130160491" — but this component previously
// ignored both and used its own hardcoded copy of the same values).
//
// 3. NEW — the button was sitting fixed at bottom-right on every page, which
//    meant it kept floating on top of the footer once a shopper scrolled
//    all the way down, overlapping the footer's own social icons/links.
//    Fixed by watching Footer.jsx's <footer id="site-footer"> with an
//    IntersectionObserver: as soon as any part of the footer enters the
//    viewport, this button hides itself, and it reappears the moment the
//    footer scrolls back out of view.
export default function WhatsAppFloat({ phone = '919130160491', message = "Namaste! I'd like to place an order / inquire about Namdev Chiwda products." }) {
  const location = useLocation();
  const [pdpBarVisible, setPdpBarVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const handlePdpStickyBar = (e) => setPdpBarVisible(Boolean(e.detail?.visible));
    window.addEventListener('pdp-sticky-bar', handlePdpStickyBar);
    return () => window.removeEventListener('pdp-sticky-bar', handlePdpStickyBar);
  }, []);

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

  // Reset once we navigate away from a product page, so a stale "hide" from
  // the last PDP visited doesn't linger on an unrelated page.
  useEffect(() => {
    setPdpBarVisible(false);
  }, [location.pathname]);

  const hidden = location.pathname === '/checkout' || pdpBarVisible || footerVisible;

  if (hidden) return null;

  const handleClick = () => {
    const msg = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      title="Chat on WhatsApp"
      className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform duration-200 hover:scale-110 animate-pulse2"
      style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.4)' }}
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