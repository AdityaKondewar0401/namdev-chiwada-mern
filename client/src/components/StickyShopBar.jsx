import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// ─────────────────────────────────────────────
// StickyShopBar
//
// Brief requirement: "Sticky/floating add-to-cart or 'Shop Now'
// affordance on mobile so the path to purchase is always one
// thumb-tap away, without covering WhatsAppFloat."
//
// REVISION (this pass):
//  1. Was previously a wide pill spanning left:14 → right:84 (leaving
//     a gap for WhatsAppFloat). Feedback: move it further left. It's
//     now a compact, auto-width pill anchored to the bottom-LEFT
//     corner only (left: 10px) instead of stretching across most of
//     the screen — this both moves it left and, as a side effect,
//     removes any need to reserve space for WhatsAppFloat on the
//     right, since the two no longer share the same horizontal band.
//  2. Was previously visible for the rest of the page once scrolled
//     past the hero, including on top of the footer. It now also
//     hides itself once the <footer> element scrolls into view
//     (via IntersectionObserver), so it never floats over footer
//     links/content.
// ─────────────────────────────────────────────
export default function StickyShopBar() {
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const navigate = useNavigate();
  const ticking = useRef(false);

  // Show only after the hero has been scrolled past (~65% of viewport height)
  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setScrolledPastHero(window.scrollY > window.innerHeight * 0.65);
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // NEW: hide once the footer is in view, so the bar never sits on top
  // of footer content. Layout.jsx renders <Footer /> as a sibling after
  // <main>, so it's already in the DOM by the time this mounts.
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const visible = scrolledPastHero && !footerVisible;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="md:hidden fixed z-40"
          style={{
            left: 10,
            bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <button
            onClick={() => navigate('/products')}
            className="btn-primary font-poppins flex items-center justify-center gap-2"
            style={{
              height: 56,
              minHeight: 48,
              minWidth: 48,
              padding: '0 22px',
              fontSize: '0.92rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 12px 32px rgba(45,26,0,0.35), 0 4px 14px rgba(212,175,55,0.4)',
            }}
            aria-label="Shop Now"
          >
            🛍️ Shop Now <span>→</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}