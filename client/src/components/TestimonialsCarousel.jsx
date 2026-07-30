import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useReveal from '../hooks/useReveal';

const TESTIMONIALS = [
  { name: 'Vedant Lavate', city: 'Kolhapur', text: 'The Special Namkeen takes me back to my childhood in Solapur. Absolutely authentic!', rating: 5 },
  { name: 'Aditya Pawar', city: 'SambajiNagar', text: 'Ordered the Bakarwadi for Diwali gifting — everyone loved it. Will order again!', rating: 5 },
  { name: 'Umesh Chakure', city: 'Latur', text: 'The Dagdi Chiwda is perfectly crispy with just the right amount of spice. Love it!', rating: 5 },
];

function Card({ t }) {
  return (
    <div className="bg-white rounded-xl md:rounded-xl2 p-5 md:p-7 shadow-saffron border border-saffron/5 h-full">
      <div className="text-amber-400 text-base md:text-lg mb-2 md:mb-3">{'★'.repeat(t.rating)}</div>
      <p
        className="text-brown-dark/80 leading-relaxed mb-3 md:mb-5 italic font-medium"
        style={{ fontSize: 'clamp(0.96rem,3.2vw,1.1rem)' }}
      >
        "{t.text}"
      </p>
      <div>
        <div className="font-bold text-brown-dark text-sm">{t.name}</div>
        <div className="text-xs text-brown-mid/60">{t.city}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TestimonialsCarousel  (RENAMED + REDESIGNED from TestimonialsSection)
//
// The old mobile view stacked all 3 full-height cards vertically —
// a lot of scroll distance for a single "beat." This gives mobile
// a native-feel swipeable single-card carousel with visible
// (48×48px tap-target) progress dots, matching the same touch
// pattern already used in the hero. Desktop keeps the original
// 3-column grid untouched.
// ─────────────────────────────────────────────
export default function TestimonialsCarousel() {
  const ref = useReveal();
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);

  const goTo = useCallback((i) => setCurrent((i + TESTIMONIALS.length) % TESTIMONIALS.length), []);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(current + (diff > 0 ? 1 : -1));
    touchStartX.current = null;
  };

  return (
    <section className="py-12 md:py-20 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="reveal text-center mb-8 md:mb-14">
          <div className="section-eyebrow justify-center">Testimonials</div>
          <h2 className="section-title">What Our Customers Say</h2>
        </div>

        {/* MOBILE: swipeable single-card carousel */}
        <div className="md:hidden">
          <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ minHeight: 220 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <Card t={TESTIMONIALS[current]} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-2 mt-4">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Testimonial ${i + 1}`}
                className="flex items-center justify-center"
                style={{ width: 48, height: 48, background: 'transparent', border: 'none', padding: 0 }}
              >
                <span
                  style={{
                    width: i === current ? 24 : 10, height: 10, borderRadius: 6,
                    background: i === current ? '#e07000' : 'rgba(224,112,0,0.25)',
                    display: 'block', transition: 'all 0.3s ease',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* DESKTOP: original 3-column grid, unchanged */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card t={t} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}