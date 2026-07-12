import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import useReveal from '../hooks/useReveal';
import NamkeenSection from '../components/NamkeenSection';
import PageWrapper from '../components/PageWrapper';

const MARQUEE_ITEMS = ['Dagdi-Poha Chiwada', 'Maka Chiwada', 'Bakarwadi', 'Lasun Sev', 'Shengdana Chutney', 'Special Farsan', 'Authentic Taste'];
const TRUST = ['150+ Years Legacy', 'No Artificial Colors', 'FSSAI Licensed'];
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

const TAGLINES = [
  'खमंग चिवडा — पिढ्यानपिढ्याची चव',
  'Hand-Roasted in Small Batches, Daily',
  'सोलापूरची ओळख, घराघरात पोहोचलेली',
  'Six Generations. One Unchanged Recipe.',
];

function preloadImages() {
  PRODUCTS.forEach(p => { const img = new Image(); img.src = p.img; });
}

function StaggerHeading() {
  const line1 = 'Authentic Taste,';
  const line2 = 'Timeless Tradition';
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
  };
  const word = {
    hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
  };
  return (
    <motion.h1
      initial="hidden" animate="visible" variants={container}
      className="font-serif font-black text-white leading-[1.08] mb-3"
      style={{ fontSize: 'clamp(2.05rem,5vw,3.5rem)', textShadow: '0 2px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-block', overflow: 'hidden' }}>
        {line1.split(' ').map((w, i) => (
          <motion.span key={i} variants={word} style={{ display: 'inline-block', marginRight: '0.28em' }}>{w}</motion.span>
        ))}
      </span>
      <br />
      <span style={{ whiteSpace: 'nowrap', display: 'inline-block', overflow: 'hidden' }}>
        {line2.split(' ').map((w, i) => (
          <motion.span key={i} variants={word} className="shimmer-text" style={{ display: 'inline-block', marginRight: '0.28em' }}>{w}</motion.span>
        ))}
      </span>
    </motion.h1>
  );
}

function RotatingTagline() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % TAGLINES.length), 3400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="mb-6" style={{ minHeight: 'clamp(1.6rem,3vw,2.2rem)', position: 'relative' }}>
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            fontFamily: "'Gotu', sans-serif", fontSize: 'clamp(0.82rem,2vw,1.3rem)',
            background: 'linear-gradient(90deg,#ffd89b,#f0cc5a,#ffd89b)', backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            letterSpacing: '0.02em', margin: 0,
          }}
        >{TAGLINES[idx]}</motion.p>
      </AnimatePresence>
    </div>
  );
}

function LiveOrderChip() {
  const [count, setCount] = useState(127);
  useEffect(() => {
    const t = setInterval(() => { setCount((c) => c + (Math.random() > 0.6 ? 1 : 0)); }, 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.55 }}
      className="inline-flex items-center gap-2"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '999px', padding: '6px 14px 6px 10px', marginBottom: '28px' }}
    >
      <span style={{ position: 'relative', width: 8, height: 8, display: 'inline-block' }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80', animation: 'pulseDot 1.8s ease-in-out infinite' }} />
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80' }} />
      </span>
      <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: 'clamp(0.68rem,1.4vw,0.78rem)', fontWeight: 600 }}>
        <motion.span key={count} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} style={{ color: '#f0cc5a', fontWeight: 800 }}>{count}</motion.span>{' '}
        orders placed this week
      </span>
    </motion.div>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(null);
  const autoRef = useRef(null);

  useEffect(() => { preloadImages(); }, []);

  const goTo = useCallback((index, dir = 1) => { setDirection(dir); setCurrent(index); }, []);
  const next = useCallback(() => goTo((current + 1) % PRODUCTS.length, 1), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + PRODUCTS.length) % PRODUCTS.length, -1), [current, goTo]);

  useEffect(() => {
    autoRef.current = setInterval(next, 3200);
    return () => clearInterval(autoRef.current);
  }, [next]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  const mobileSlideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -80 : 80, transition: { duration: 0.3 } }),
  };

  const desktopSlideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 50 : -50, scale: 0.94 }),
    center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -50 : 50, scale: 0.94, transition: { duration: 0.35 } }),
  };

  const BgDecorations = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
      <div className="absolute bottom-0 left-0 right-0 h-20 md:h-32 bg-gradient-to-t from-brown-dark/60 to-transparent" />
      <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,55,0.18) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: '40px', left: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,112,0,0.14) 0%, transparent 70%)' }} />
    </div>
  );

  const Dots = ({ className = '' }) => (
    <div className={`flex gap-2 ${className}`}>
      {PRODUCTS.map((_, i) => (
        <button key={i}
          onClick={() => { clearInterval(autoRef.current); goTo(i, i > current ? 1 : -1); }}
          style={{
            width: i === current ? '22px' : '7px', height: '7px', borderRadius: '4px',
            background: i === current ? '#ffd89b' : 'rgba(255,255,255,0.3)',
            border: 'none', cursor: 'pointer', padding: 0,
            transition: 'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
          aria-label={`Product ${i + 1}`}
        />
      ))}
    </div>
  );

  return (
    <section
      className="hero-gradient relative -mt-4 md:-mt-9"
      style={{ minHeight: '100svh', overflow: 'hidden' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <BgDecorations />

      {/* ══════════════════════════════════════
          MOBILE layout — UPDATED
          • Image zone: 52svh (was 62svh) → text starts higher
          • Packet width: 125vw (was 110vw) → bigger product
          • Tighter spacing → buttons visible on first screen
          ══════════════════════════════════════ */}
      <div className="md:hidden" style={{ minHeight: '100svh', position: 'relative', zIndex: 5 }}>

        {/* ── Image zone — shrunk to 52svh so text appears higher ── */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '52svh',               /* ← was 62svh */
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2, pointerEvents: 'none', overflow: 'visible',
        }}>
          {/* Glow */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 80% 70% at 50% 55%, rgba(212,168,55,0.28) 0%, rgba(224,112,0,0.10) 55%, transparent 75%)',
            filter: 'blur(30px)',
          }} />
          {/* Spinning ring */}
          <div style={{
            position: 'absolute', width: '86vw', height: '86vw', borderRadius: '50%',
            border: '1px dashed rgba(212,175,55,0.18)', animation: 'spinSlow 22s linear infinite',
            top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          }} />
          {/* Packet image — bigger */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.img
              key={current} custom={direction} variants={mobileSlideVariants}
              initial="enter" animate="center" exit="exit"
              src={PRODUCTS[current].img} alt="Namdev Chiwada" draggable={false}
              style={{
                position: 'relative', zIndex: 3,
                width: '125vw',          /* ← was 110vw → bigger packet */
                maxWidth: 'none',
                height: 'auto',
                animation: 'heroFloat 4s ease-in-out infinite',
                filter: 'drop-shadow(0 28px 55px rgba(0,0,0,0.82)) drop-shadow(0 6px 22px rgba(212,168,55,0.50))',
                display: 'block', pointerEvents: 'auto',
              }}
            />
          </AnimatePresence>
        </div>

        {/* ── Text block — starts at 52svh, tight spacing ── */}
        <div style={{
          position: 'relative', zIndex: 10,
          padding: 'calc(52svh + 4px) 20px 18px', /* ← matches new image height */
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>

          {/* Eyebrow pill */}
          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 text-gold-light font-semibold tracking-widest uppercase"
            style={{ fontSize: '0.48rem', padding: '3px 9px', marginBottom: 5 }}
          >
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#f0cc5a', flexShrink: 0, display: 'inline-block' }} />
            Since 1873 · Solapur, Maharashtra
          </div>

          {/* Heading */}
          <h1
            className="font-serif font-black text-white text-center"
            style={{ fontSize: 'clamp(1.65rem, 7.5vw, 2.2rem)', textShadow: '0 2px 20px rgba(0,0,0,0.4)', marginBottom: 3, lineHeight: 1.08 }}
          >
            Authentic Taste,<br />
            <span className="shimmer-text">Timeless Tradition</span>
          </h1>

          {/* Marathi tagline — tighter margin */}
          <p style={{
            fontFamily: "'Gotu', sans-serif",
            background: 'linear-gradient(90deg,#ffd89b,#f0cc5a,#ffd89b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            letterSpacing: '0.02em', textAlign: 'center',
            marginBottom: 7,             /* ← was 9 */
            fontSize: '0.76rem',
          }}>
            खमंग चिवडा — पिढ्यानपिढ्याची चव
          </p>

          {/* Dots — tighter */}
          <div className="flex justify-center" style={{ marginBottom: 9 }}> {/* ← was 11 */}
            <Dots />
          </div>

          {/* CTA Buttons — these should now be visible on landing */}
          <div className="flex gap-3 w-full justify-center" style={{ marginBottom: 10 }}> {/* ← was 11 */}
            <button
              onClick={() => navigate('/products')}
              className="btn-primary font-poppins"
              style={{ flex: 1, maxWidth: 165, padding: '13px 10px', fontSize: '0.85rem', borderRadius: '999px', fontWeight: 700, textAlign: 'center' }}
            >
              Shop Now →
            </button>
            <button
              onClick={() => navigate('/about')}
              className="btn-outline font-poppins"
              style={{ flex: 1, maxWidth: 165, padding: '13px 10px', fontSize: '0.85rem', borderRadius: '999px', fontWeight: 700, textAlign: 'center' }}
            >
              Our Story
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
            {TRUST.map((t) => (
              <div key={t} className="flex items-center gap-1.5" style={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.62)' }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#f0cc5a', flexShrink: 0, display: 'inline-block' }} />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          DESKTOP layout — UNCHANGED
          ══════════════════════════════ */}
      <div className="hidden md:flex items-center" style={{ minHeight: '100svh', position: 'relative', zIndex: 5 }}>
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid md:grid-cols-2 w-full items-center" style={{ gap: 0 }}>

            <div className="text-left order-1"
              style={{ position: 'relative', zIndex: 20, paddingTop: 'clamp(40px,8vh,100px)', paddingBottom: 'clamp(40px,6vh,80px)' }}>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/25 bg-white/10 text-gold-light font-semibold tracking-widest uppercase mb-6"
                style={{ fontSize: 'clamp(0.58rem,1.8vw,0.75rem)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-gold-light flex-shrink-0" />
                Since 1873 · Solapur, Maharashtra
              </motion.div>

              <StaggerHeading />
              <RotatingTagline />
              <LiveOrderChip />

              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
                className="flex gap-3 mb-10">
                <motion.button
                  whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(224,112,0,0.45)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/products')}
                  className="btn-primary font-poppins text-base px-8 py-3.5"
                >Shop Now →</motion.button>
                <motion.button
                  whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/about')}
                  className="btn-outline font-poppins text-base px-8 py-3.5"
                >Our Story</motion.button>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap gap-5">
                {TRUST.map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-white/75" style={{ fontSize: 'clamp(0.68rem,1.5vw,0.8rem)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-light flex-shrink-0" />
                    <span className="whitespace-nowrap">{t}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="order-2 flex flex-col items-center justify-center relative"
              style={{ position: 'relative', zIndex: 15 }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: '80%', height: '80%', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(212,168,55,0.25) 0%, transparent 70%)',
                filter: 'blur(28px)', pointerEvents: 'none', zIndex: 1,
              }} />
              <div className="absolute" style={{
                width: '540px', height: '540px', borderRadius: '50%',
                border: '1.5px dashed rgba(212,175,55,0.2)', animation: 'spinSlow 22s linear infinite',
                top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1,
              }} />
              <div className="absolute" style={{
                width: '400px', height: '400px', borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.06)', animation: 'spinSlow 14s linear infinite reverse',
                top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1,
              }} />
              <div style={{ position: 'relative', zIndex: 3, width: '100%', display: 'flex', justifyContent: 'center' }}>
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div key={current} custom={direction} variants={desktopSlideVariants}
                    initial="enter" animate="center" exit="exit"
                    style={{ animation: 'heroFloat 4s ease-in-out infinite', display: 'flex', justifyContent: 'center', transform: 'translateY(-40px)' }}>
                    <img src={PRODUCTS[current].img} alt="Namdev Chiwada product"
                      style={{ width: 'clamp(300px,56vw,760px)', maxWidth: 'none', filter: 'drop-shadow(0 40px 70px rgba(0,0,0,0.6)) drop-shadow(0 8px 24px rgba(212,168,55,0.25))', display: 'block' }}
                      draggable={false} />
                  </motion.div>
                </AnimatePresence>
              </div>
              <Dots className="mt-2 justify-center" />
            </motion.div>

          </div>
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
            {item}<span className="text-white/40 text-xs">◆</span>
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
                style={{ fontSize: 'clamp(0.78rem,1.8vw,1rem)' }}>{f.title}</div>
              <div className="text-brown-mid/70 leading-relaxed hidden sm:block"
                style={{ fontSize: 'clamp(0.72rem,1.5vw,0.875rem)' }}>{f.desc}</div>
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-4">
          <div className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#c8902a', letterSpacing: '0.13em' }}>Our Story · Since 1873</div>
          <h2 className="font-serif font-black leading-tight mb-3" style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', color: '#ffffff' }}>
            150 years. <span style={{ color: '#d4a843' }}>One recipe.</span>
          </h2>
          <p className="text-center mx-auto" style={{ fontSize: 'clamp(0.82rem,1.6vw,0.95rem)', color: 'rgba(255,255,255,0.48)', lineHeight: 1.65, maxWidth: '400px' }}>
            Started by one man with nothing but hard work. Six generations later, the same taste — unchanged.
          </p>
        </motion.div>
        <div className="relative mt-8 mb-7">
          <div className="absolute" style={{ top: '19px', left: 'calc(10% + 19px)', right: 'calc(10% + 19px)', height: '1px', background: 'rgba(212,175,55,0.30)' }} />
          <div className="grid grid-cols-5 gap-1 sm:gap-4">
            {milestones.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center text-center relative z-10 gap-1 sm:gap-2">
                <div className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#3d1c00', border: '1px solid rgba(212,175,55,0.40)', fontSize: '15px' }}>{m.icon}</div>
                <div className="font-semibold leading-snug" style={{ fontSize: 'clamp(0.55rem,1.3vw,0.72rem)', color: 'rgba(255,255,255,0.82)', wordBreak: 'break-word', hyphens: 'auto' }}>{m.label}</div>
                <div style={{ fontSize: 'clamp(0.5rem,1.1vw,0.65rem)', color: 'rgba(255,255,255,0.32)', lineHeight: 1.3, wordBreak: 'break-word' }}>{m.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.16)', borderRadius: '10px', padding: '16px 20px' }}>
          <div>
            <div className="font-serif font-bold mb-0.5" style={{ color: '#ffffff', fontSize: '0.95rem' }}>Read the full story</div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)' }}>How one man's struggle became Solapur's favourite snack</div>
          </div>
          <Link to="/about" className="flex-shrink-0 flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
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
            <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5 }} viewport={{ once: true }}
              className="bg-white rounded-xl md:rounded-xl2 p-5 md:p-7 shadow-saffron border border-saffron/5">
              <div className="text-amber-400 text-base md:text-lg mb-2 md:mb-3">{'★'.repeat(t.rating)}</div>
              <p className="text-brown-dark/80 leading-relaxed mb-3 md:mb-5 italic font-medium"
                style={{ fontSize: 'clamp(0.96rem,3.2vw,1.1rem)' }}>"{t.text}"</p>
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
              <div className="font-serif font-black text-white mb-1" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)' }}>{s.value}</div>
              <div className="text-saffron-light font-semibold tracking-wide" style={{ fontSize: 'clamp(0.7rem,1.5vw,0.875rem)' }}>{s.label}</div>
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
        <p className="text-brown-mid/70 mb-6 md:mb-8 leading-relaxed" style={{ fontSize: 'clamp(0.85rem,1.8vw,1rem)' }}>
          Looking for premium Maharashtrian snacks for Diwali, weddings, or corporate events? We offer custom gift hampers in bulk.
        </p>
        <a href="https://wa.me/919975333427" target="_blank" rel="noreferrer"
          className="inline-block px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold text-white transition-all hover:-translate-y-0.5 w-full sm:w-auto"
          style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.3)', fontSize: 'clamp(0.85rem,1.8vw,1rem)' }}>
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
