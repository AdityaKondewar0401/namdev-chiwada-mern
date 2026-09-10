import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useReveal from '../hooks/useReveal';

const TESTIMONIALS = [
  {
    name: 'Vedant Lavate',
    city: 'Kolhapur',
    text: 'The Namdev Chiwda takes me back to my childhood in Solapur. Absolutely authentic.',
    rating: 5,
  },
  {
    name: 'Aditya Pawar',
    city: 'Chhatrapati Sambhajinagar',
    text: 'Ordered the Bakarwadi for Diwali gifting — everyone loved it. Will order again.',
    rating: 5,
  },
  {
    name: 'Umesh Chakure',
    city: 'Nashik',
    text: "That khamang taste is exactly the Solapur streets — crunchy, spiced, properly addictive.",
    rating: 5,
  },
  {
    name: 'Priya Joshi',
    city: 'Pune',
    text: 'Fresh, crisp and perfectly spiced. This has become our family’s go-to evening snack.',
    rating: 5,
  },
];

const STAR_PATH =
  'M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z';

function Stars({ rating }) {
  return (
    <span className="flex flex-shrink-0 gap-[3px]" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 20 20" aria-hidden="true"
          fill={i < rating ? '#d4af37' : 'rgba(45,26,0,0.12)'}>
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

function Card({ t }) {
  return (
    <figure
      className="flex h-full flex-col rounded-[20px] bg-white p-7 md:p-8"
      style={{
        border: '1px solid rgba(212,175,55,0.22)',
        boxShadow: '0 1px 2px rgba(45,26,0,0.03), 0 22px 46px -32px rgba(45,26,0,0.24)',
      }}
    >
      <span
        aria-hidden="true"
        className="font-serif font-black leading-none"
        style={{ color: '#c6982f', fontSize: '2.6rem', display: 'block', height: '0.5em' }}
      >
        &ldquo;
      </span>

      <blockquote
        className="mt-3 flex-1 font-serif text-brown-dark"
        style={{ fontSize: 'clamp(1rem, 2.1vw, 1.12rem)', lineHeight: 1.62, fontWeight: 400 }}
      >
        {t.text}
      </blockquote>

      <div className="mt-6 h-px w-8" style={{ background: 'rgba(212,175,55,0.55)' }} />

      <figcaption className="mt-4 flex items-end justify-between gap-3">
        <span>
          <span className="block font-semibold text-brown-dark" style={{ fontSize: '0.86rem' }}>
            {t.name}
          </span>
          <span className="block text-brown-mid/55" style={{ fontSize: '0.75rem' }}>
            {t.city}
          </span>
        </span>
        <Stars rating={t.rating} />
      </figcaption>
    </figure>
  );
}

export default function TestimonialsCarousel() {
  const ref = useReveal();
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);

  const goTo = useCallback((i) => setCurrent((i + TESTIMONIALS.length) % TESTIMONIALS.length), []);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(current + (diff > 0 ? 1 : -1));
    touchStartX.current = null;
  };

  return (
    <section className="py-14 md:py-24 bg-cream">
      <div className="mx-auto max-w-4xl px-5 sm:px-6">
        <div ref={ref} className="reveal mb-9 text-center md:mb-14">
          <div className="section-eyebrow justify-center">Testimonials</div>
          <h2 className="section-title">What Our Customers Say</h2>
        </div>

        {/* MOBILE: swipeable single card */}
        <div className="md:hidden">
          <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ minHeight: 240 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.32 }}
              >
                <Card t={TESTIMONIALS[current]} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex justify-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Testimonial ${i + 1}`}
                className="flex items-center justify-center"
                style={{ width: 40, height: 40, background: 'transparent', border: 'none', padding: 0 }}
              >
                <span
                  style={{
                    width: i === current ? 22 : 7,
                    height: 7,
                    borderRadius: 4,
                    background: i === current ? '#c6982f' : 'rgba(45,26,0,0.14)',
                    display: 'block',
                    transition: 'all 0.3s ease',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* DESKTOP: 2 x 2 */}
        <div className="hidden gap-5 md:grid md:auto-rows-fr md:grid-cols-2 md:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
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
