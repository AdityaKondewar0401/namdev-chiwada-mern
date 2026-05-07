import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeletons';
import useReveal from '../hooks/useReveal';
import NamkeenSection from '../components/NamkeenSection';
import PageWrapper from '../components/PageWrapper';

const MARQUEE_ITEMS = ['Dagdi-Poha Chiwada', 'Maka Chiwada', 'Bakarwadi', 'Lasun Sev', 'Shengdana Chutney', 'Special Farsan', 'Authentic Taste'];
const TRUST = ['150+ Years Legacy', 'No Artificial Colors', 'FSSAI Licensed', 'Pan-India Delivery'];
const FEATURES = [
  { icon: '🔥', title: 'Perfectly Roasted Blend', desc: 'Each batch is carefully roasted and blended for that signature Namdev crunch.' },
  { icon: '🏺', title: '150 Years of Craft', desc: 'A recipe passed down through six generations of the Namdev family.' },
  { icon: '🚚', title: 'Pan-India Delivery', desc: 'Fresh-packed and shipped within 24 hours of your order.' },
  { icon: '🌿', title: '100% Vegetarian', desc: 'No artificial colors, preservatives or additives. Ever.' },
];
const TESTIMONIALS = [
  { name: 'Vedant Lavate', city: 'Kolhapur', text: 'The Special Namkeen takes me back to my childhood in Solapur. Absolutely authentic!', rating: 5 },
  { name: 'Aditya Pawar', city: 'SambajiNagar', text: 'Ordered the Bakarwadi for Diwali gifting — everyone loved it. Will order again!', rating: 5 },
  { name: 'Umesh Chakure', city: 'Latur', text: 'The Dagdi Chiwada is perfectly crispy with just the right amount of spice. Love it!', rating: 5 },
];

const PRODUCTS = [
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1776256647/special1_sy4zxa.png' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/maka-chiwada-Photoroom_efq78h.png' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/bakarwadii-Photoroom_wqk7o0.png' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/farsan_1_-Photoroom_hsdpb5.png' },
];

// Preload all images on mount so there's zero lag on swap
function preloadImages() {
  PRODUCTS.forEach(p => { const img = new Image(); img.src = p.img; });
}

// Decorative spice SVG blobs — purely CSS animated, no JS
function SpiceDecorations() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {/* Large blurred golden orb top-right */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-60px',
        width: '340px', height: '340px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,168,55,0.18) 0%, transparent 70%)',
      }} />
      {/* Medium orb bottom-left */}
      <div style={{
        position: 'absolute', bottom: '60px', left: '-80px',
        width: '260px', height: '260px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(224,112,0,0.14) 0%, transparent 70%)',
      }} />
      {/* Floating spice particles */}
      {[
        { top: '18%', left: '54%', size: 7, delay: '0s', dur: '4.2s', emoji: '✦' },
        { top: '72%', left: '58%', size: 5, delay: '1.1s', dur: '5s', emoji: '✦' },
        { top: '30%', left: '88%', size: 9, delay: '0.5s', dur: '3.8s', emoji: '✦' },
        { top: '60%', left: '82%', size: 6, delay: '2s', dur: '4.5s', emoji: '✦' },
        { top: '12%', left: '72%', size: 8, delay: '1.6s', dur: '5.2s', emoji: '✦' },
        { top: '80%', left: '70%', size: 5, delay: '0.8s', dur: '4s', emoji: '✦' },
      ].map((p, i) => (
        <div key={i} style={{
          position: 'absolute', top: p.top, left: p.left,
          fontSize: p.size,
          color: 'rgba(212,175,55,0.5)',
          animation: `spiceFloat ${p.dur} ease-in-out ${p.delay} infinite`,
        }}>{p.emoji}</div>
      ))}
      {/* Thin arcing lines — decorative rings */}
      <svg style={{ position: 'absolute', top: '50%', right: '4%', transform: 'translateY(-50%)', opacity: 0.07 }}
        width="520" height="520" viewBox="0 0 520 520" fill="none">
        <circle cx="260" cy="260" r="240" stroke="#d4af37" strokeWidth="1" strokeDasharray="6 10" />
        <circle cx="260" cy="260" r="190" stroke="#d4af37" strokeWidth="0.5" />
        <circle cx="260" cy="260" r="140" stroke="#e07000" strokeWidth="0.5" strokeDasharray="3 8" />
      </svg>
    </div>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(null);
  const autoRef = useRef(null);

  useEffect(() => { preloadImages(); }, []);

  const goTo = useCallback((index, dir = 1) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    goTo((current + 1) % PRODUCTS.length, 1);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + PRODUCTS.length) % PRODUCTS.length, -1);
  }, [current, goTo]);

  // Auto-advance
  useEffect(() => {
    autoRef.current = setInterval(next, 3200);
    return () => clearInterval(autoRef.current);
  }, [next]);

  // Touch swipe
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  const slideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60, scale: 0.92, filter: 'blur(4px)' }),
    center: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60, scale: 0.92, filter: 'blur(4px)', transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }),
  };

  return (
    <section
      className="hero-gradient relative overflow-hidden flex items-center -mt-4 md:-mt-9"
      style={{ minHeight: 'clamp(560px, 100svh, 100vh)' }}>

      {/* Dot-grid texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-t from-brown-dark/70 to-transparent pointer-events-none z-10" />

      {/* Spice decorations */}
      <SpiceDecorations />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-0 pb-6 md:pt-1 md:pb-8 w-full relative z-10">
        <div className="flex flex-col md:grid md:grid-cols-2 md:gap-8 md:items-center">

          {/* LEFT — text */}
          <div className="text-center md:text-left order-2 md:order-1 mt-2 md:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/25 bg-white/10 text-gold-light font-semibold tracking-widest uppercase mb-4 md:mb-6"
              style={{ fontSize: 'clamp(0.58rem, 1.8vw, 0.75rem)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-gold-light flex-shrink-0" />
              Since 1873 · Solapur, Maharashtra
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              className="font-serif font-black text-white leading-[1.08] mb-3"
              style={{ fontSize: 'clamp(2.05rem, 7vw, 4rem)', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              Authentic Taste,<br />
              <span className="shimmer-text">Timeless Tradition</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="mb-5 md:mb-6"
              style={{
                fontFamily: "'Gotu', sans-serif",
                fontSize: 'clamp(0.82rem, 2vw, 1.3rem)',
                color: 'rgba(255,255,255,0.90)',
                background: 'linear-gradient(90deg, #ffd89b, #f0cc5a, #ffd89b)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '0.02em',
              }}>
              खमंग चिवडा — पिढ्यानपिढ्याची चव
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-row gap-3 mb-6 md:mb-10 items-center justify-center md:justify-start">
              <button
                onClick={() => navigate('/products')}
                className="btn-primary w-[40%] font-poppins text-sm md:text-base px-4 py-3 md:px-8 md:py-3.5 text-center">
                Shop Now →
              </button>
              <button
                onClick={() => navigate('/about')}
                className="btn-outline w-[40%] font-poppins text-sm md:text-base px-4 py-3 md:px-8 md:py-3.5 text-center">
                Our Story
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:gap-5 justify-center md:justify-start">
              {TRUST.map((t) => (
                <div key={t}
                  className="flex items-center gap-1.5 text-white/75 justify-center md:justify-start"
                  style={{ fontSize: 'clamp(0.68rem, 1.5vw, 0.8rem)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-light flex-shrink-0" />
                  <span className="whitespace-nowrap">{t}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — Premium carousel, no labels */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative order-1 md:order-2 flex flex-col items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{ minHeight: 'clamp(420px, 65vw, 760px)' }}
          >
            {/* Outer glow halo behind packet */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '70%', height: '70%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,168,55,0.22) 0%, transparent 70%)',
              filter: 'blur(24px)',
              pointerEvents: 'none',
              zIndex: 1,
            }} />

            {/* Spinning dashed rings */}
            <div className="hidden md:block absolute" style={{
              width: '480px', height: '480px', borderRadius: '50%',
              border: '1.5px dashed rgba(212,175,55,0.2)',
              animation: 'spinSlow 22s linear infinite',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
            }} />
            <div className="hidden md:block absolute" style={{
              width: '360px', height: '360px', borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.06)',
              animation: 'spinSlow 14s linear infinite reverse',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
            }} />

            {/* The packet — AnimatePresence crossfade + slide */}
            <div style={{ position: 'relative', zIndex: 3, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  style={{
                    animation: 'heroFloat 4s ease-in-out infinite',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={PRODUCTS[current].img}
                    alt="Namdev Chiwada product"
                    style={{
                      width: 'clamp(380px, 62vw, 720px)',
                      maxWidth: 'none',
                      filter: 'drop-shadow(0 32px 60px rgba(0,0,0,0.55)) drop-shadow(0 8px 20px rgba(212,168,55,0.2))',
                      display: 'block',
                    }}
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dot indicators only — no labels */}
            <div className="flex gap-2 mt-4" style={{ zIndex: 4, position: 'relative' }}>
              {PRODUCTS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { clearInterval(autoRef.current); goTo(i, i > current ? 1 : -1); }}
                  style={{
                    width: i === current ? '22px' : '7px',
                    height: '7px',
                    borderRadius: '4px',
                    background: i === current ? '#ffd89b' : 'rgba(255,255,255,0.3)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
                  }}
                  aria-label={`Go to product ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function MarqueeSection() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden py-3 md:py-4" style={{ background: 'linear-gradient(135deg,#e07000,#c05a00)' }}>
      <div className="marquee-track flex gap-0 whitespace-nowrap" style={{ width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 md:gap-3 text-white font-semibold text-xs md:text-sm px-4 md:px-6">
            {item}
            <span className="text-white/40 text-xs">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function FeaturesSection() {
  const ref = useReveal();
  return (
    <section id="features" className="py-12 md:py-20 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="reveal text-center mb-8 md:mb-14">
          <div className="section-eyebrow justify-center">Why Choose Us</div>
          <h2 className="section-title">Crafted Through Generations</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
              className="bg-white rounded-xl md:rounded-xl2 p-4 md:p-6 shadow-saffron border border-saffron/5 text-center hover:-translate-y-1 transition-transform duration-300">
              <div className="text-2xl md:text-4xl mb-2 md:mb-4">{f.icon}</div>
              <div className="font-serif font-bold text-brown-dark mb-1 md:mb-2 leading-tight"
                style={{ fontSize: 'clamp(0.78rem, 1.8vw, 1rem)' }}>
                {f.title}
              </div>
              <div className="text-brown-mid/70 leading-relaxed hidden sm:block"
                style={{ fontSize: 'clamp(0.72rem, 1.5vw, 0.875rem)' }}>
                {f.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LegacyGlimpseSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const milestones = [
    { icon: '🚶', label: 'Left his village', sub: 'Rani Savargaon' },
    { icon: '💡', label: 'Had an idea', sub: 'First chiwada made' },
    { icon: '📦', label: 'Sold door to door', sub: 'Box on his head' },
    { icon: '🏛️', label: 'Built a home', sub: 'In just 3 years' },
    { icon: '🌱', label: '6 generations', sub: 'Same taste today' },
  ];

  return (
    <section ref={ref} className="py-10 md:py-16" style={{ background: '#2d1a00' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-4"
        >
          <div className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: '#c8902a', letterSpacing: '0.13em' }}>
            Our Story · Since 1873
          </div>
          <h2 className="font-serif font-black leading-tight mb-3"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: '#ffffff' }}>
            150 years.{' '}
            <span style={{ color: '#d4a843' }}>One recipe.</span>
          </h2>
          <p className="text-center mx-auto"
            style={{ fontSize: 'clamp(0.82rem, 1.6vw, 0.95rem)', color: 'rgba(255,255,255,0.48)', lineHeight: 1.65, maxWidth: '400px' }}>
            Started by one man with nothing but hard work. Six generations later, the same taste — unchanged.
          </p>
        </motion.div>

        <div className="relative mt-8 mb-7">
          <div className="absolute"
            style={{ top: '19px', left: 'calc(10% + 19px)', right: 'calc(10% + 19px)', height: '1px', background: 'rgba(212,175,55,0.30)' }} />
          <div className="grid grid-cols-5 gap-1 sm:gap-4">
            {milestones.map((m, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center text-center relative z-10 gap-1 sm:gap-2">
                <div className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#3d1c00', border: '1px solid rgba(212,175,55,0.40)', fontSize: '15px' }}>
                  {m.icon}
                </div>
                <div className="font-semibold leading-snug"
                  style={{ fontSize: 'clamp(0.55rem, 1.3vw, 0.72rem)', color: 'rgba(255,255,255,0.82)', wordBreak: 'break-word', hyphens: 'auto' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 'clamp(0.5rem, 1.1vw, 0.65rem)', color: 'rgba(255,255,255,0.32)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                  {m.sub}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.16)', borderRadius: '10px', padding: '16px 20px' }}>
          <div>
            <div className="font-serif font-bold mb-0.5" style={{ color: '#ffffff', fontSize: '0.95rem' }}>
              Read the full story
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)' }}>
              How one man's struggle became Solapur's favourite snack
            </div>
          </div>
          <Link to="/about"
            className="flex-shrink-0 flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '8px', padding: '9px 18px', fontSize: '0.85rem', color: '#ffffff', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Read more →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const ref = useReveal();
  return (
    <section className="py-12 md:py-20 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="reveal text-center mb-8 md:mb-14">
          <div className="section-eyebrow justify-center">Testimonials</div>
          <h2 className="section-title">What Our Customers Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5 }} viewport={{ once: true }}
              className="bg-white rounded-xl md:rounded-xl2 p-5 md:p-7 shadow-saffron border border-saffron/5">
              <div className="text-amber-400 text-base md:text-lg mb-2 md:mb-3">
                {'★'.repeat(t.rating)}
              </div>
              <p className="text-brown-dark/80 leading-relaxed mb-3 md:mb-5 italic font-medium"
                style={{ fontSize: 'clamp(0.96rem, 3.2vw, 1.1rem)' }}>
                "{t.text}"
              </p>
              <div>
                <div className="font-bold text-brown-dark text-sm">{t.name}</div>
                <div className="text-xs text-brown-mid/60">{t.city}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const ref = useReveal();
  const STATS = [
    { value: '150+', label: 'Years of Legacy' },
    { value: '10K+', label: 'Happy Customers' },
    { value: '100%', label: 'Vegetarian' },
  ];
  return (
    <section className="py-10 md:py-16" style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300)' }}>
      <div ref={ref} className="reveal max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap justify-center gap-12 md:gap-28 lg:gap-36 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-serif font-black text-white mb-1"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
                {s.value}
              </div>
              <div className="text-saffron-light font-semibold tracking-wide"
                style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.875rem)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-14 md:py-20 bg-cream-mid text-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-4xl md:text-5xl mb-3 md:mb-4">🎁</div>
        <h2 className="section-title mb-2 md:mb-3">Corporate Gifting</h2>
        <p className="text-brown-mid/70 mb-6 md:mb-8 leading-relaxed"
          style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1rem)' }}>
          Looking for premium Maharashtrian snacks for Diwali, weddings, or corporate events?
          We offer custom gift hampers in bulk.
        </p>
        <a href="https://wa.me/919975333427" target="_blank" rel="noreferrer"
          className="inline-block px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold text-white transition-all hover:-translate-y-0.5 w-full sm:w-auto"
          style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.3)', fontSize: 'clamp(0.85rem, 1.8vw, 1rem)' }}>
          💬 WhatsApp Us for Bulk Orders
        </a>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <PageWrapper>
      <HeroSection />
      <MarqueeSection />
      <FeaturesSection />
      <NamkeenSection />
      <StatsSection />
      <LegacyGlimpseSection />
      <TestimonialsSection />
      <CTASection />
    </PageWrapper>
  );
}