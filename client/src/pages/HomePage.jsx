import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import useReveal from '../hooks/useReveal';
import NamkeenSection from '../components/NamkeenSection';
import PageWrapper from '../components/PageWrapper';

// ── Constants ─────────────────────────────────────────
const MARQUEE_ITEMS = ['Dagdi-Poha Chiwada', 'मका चिवडा', 'Bakarwadi', 'लसूण सेव', 'Shengdana Chutney', 'Special Farsan', 'खमंग चव', 'Since 1873'];
const TRUST = ['150+ Years Legacy', 'No Artificial Colors', 'FSSAI Licensed'];
const TAGLINES = [
  'खमंग चिवडा — पिढ्यानपिढ्याची चव',
  'Hand-Roasted in Small Batches, Daily',
  'सोलापूरची ओळख, घराघरात पोहोचलेली',
  'Six Generations. One Unchanged Recipe.',
];
const PRODUCTS = [
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1776256647/special1_sy4zxa.png', name: 'Special Namkeen', tag: 'Bestseller' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/maka-chiwada-Photoroom_efq78h.png', name: 'Maka Chiwada', tag: 'New' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/bakarwadii-Photoroom_wqk7o0.png', name: 'Bakarvadi', tag: 'Fan Fav' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/farsan_1_-Photoroom_hsdpb5.png', name: 'Special Farsan', tag: 'Classic' },
];
const FEATURES = [
  { icon: '🔥', title: 'Perfectly Roasted', desc: 'Each batch roasted to perfection for that signature Namdev crunch.' },
  { icon: '🏺', title: '150 Years of Craft', desc: 'A recipe passed through six generations of the Namdev family.' },
  { icon: '🚚', title: 'Pan-India Delivery', desc: 'Fresh-packed and shipped within 24 hours of your order.' },
  { icon: '🌿', title: '100% Vegetarian', desc: 'No artificial colors, preservatives or additives. Ever.' },
];
const TESTIMONIALS = [
  { name: 'Vedant Lavate', city: 'Kolhapur', text: 'The Special Namkeen takes me back to my childhood in Solapur. Absolutely authentic!', rating: 5 },
  { name: 'Aditya Pawar', city: 'SambajiNagar', text: 'Ordered the Bakarwadi for Diwali gifting — everyone loved it. Will order again!', rating: 5 },
  { name: 'Umesh Chakure', city: 'Latur', text: 'The Dagdi Chiwada is perfectly crispy with just the right amount of spice. Love it!', rating: 5 },
];
const STATS = [
  { value: '150+', label: 'Years of Legacy', icon: '🏺', suffix: '' },
  { value: '10K', label: 'Happy Customers', icon: '😊', suffix: '+' },
  { value: '6', label: 'Generations', icon: '👨‍👩‍👧‍👦', suffix: '' },
  { value: '100', label: 'Vegetarian', icon: '🌿', suffix: '%' },
];

// ── Design Tokens ─────────────────────────────────────
const C = {
  maroon: '#6B2C2C',
  maroonDark: '#552020',
  gold: '#C9A961',
  goldLight: '#E8D5B5',
  cream: '#F5F1E8',
  creamMid: '#EDE8DC',
  dark: '#333333',
  mid: '#666666',
  white: '#FFFFFF',
};

function preloadImages() {
  PRODUCTS.forEach(p => { const img = new Image(); img.src = p.img; });
}

// ── Rotating Tagline ──────────────────────────────────
function RotatingTagline() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TAGLINES.length), 3400);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ minHeight: 32, position: 'relative', marginBottom: 20 }}>
      <AnimatePresence mode="wait">
        <motion.p key={idx}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          style={{
            fontFamily: "'Merriweather', serif",
            fontStyle: 'italic',
            fontSize: 'clamp(0.85rem, 1.8vw, 1.05rem)',
            color: C.gold,
            letterSpacing: '0.01em',
            margin: 0,
          }}>
          {TAGLINES[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ── Live Order Chip ───────────────────────────────────
function LiveOrderChip() {
  const [count, setCount] = useState(127);
  useEffect(() => {
    const t = setInterval(() => setCount(c => c + (Math.random() > 0.6 ? 1 : 0)), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.55 }}
      className="inline-flex items-center gap-2"
      style={{
        background: 'rgba(107,44,44,0.06)',
        border: `1px solid rgba(107,44,44,0.15)`,
        borderRadius: 999, padding: '6px 14px 6px 10px',
        marginBottom: 28,
      }}>
      <span style={{ position: 'relative', width: 8, height: 8, display: 'inline-block' }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80', animation: 'pulseDot 1.8s ease-in-out infinite' }} />
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80' }} />
      </span>
      <span style={{ fontSize: '0.78rem', color: C.mid, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
        <motion.span key={count} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}
          style={{ color: C.maroon, fontWeight: 700 }}>
          {count}
        </motion.span>{' '}orders placed this week
      </span>
    </motion.div>
  );
}

// ── Word-by-word Heading ──────────────────────────────
function StaggerHeading({ dark = false }) {
  const words1 = 'Authentic Taste,'.split(' ');
  const words2 = 'Timeless Tradition'.split(' ');
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
  };
  const word = {
    hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
  };
  return (
    <motion.h1 initial="hidden" animate="visible" variants={container}
      style={{
        fontFamily: "'Merriweather', serif",
        fontWeight: 700,
        color: dark ? C.dark : '#FFFFFF',
        fontSize: 'clamp(2rem, 5vw, 3.4rem)',
        lineHeight: 1.15,
        letterSpacing: '0.5px',
        marginBottom: 12,
        textShadow: dark ? 'none' : '0 2px 20px rgba(0,0,0,0.25)',
      }}>
      <span style={{ display: 'block' }}>
        {words1.map((w, i) => (
          <motion.span key={i} variants={word} style={{ display: 'inline-block', marginRight: '0.28em' }}>{w}</motion.span>
        ))}
      </span>
      <span style={{ display: 'block', color: dark ? C.maroon : C.gold }}>
        {words2.map((w, i) => (
          <motion.span key={i} variants={word} style={{ display: 'inline-block', marginRight: '0.28em' }}>{w}</motion.span>
        ))}
      </span>
    </motion.h1>
  );
}

// ── Hero Section ──────────────────────────────────────
function HeroSection() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(null);
  const autoRef = useRef(null);
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 500], [0, -60]);

  useEffect(() => { preloadImages(); }, []);

  const goTo = useCallback((i, dir = 1) => { setDirection(dir); setCurrent(i); }, []);
  const next = useCallback(() => goTo((current + 1) % PRODUCTS.length, 1), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + PRODUCTS.length) % PRODUCTS.length, -1), [current, goTo]);

  useEffect(() => {
    autoRef.current = setInterval(next, 3200);
    return () => clearInterval(autoRef.current);
  }, [next]);

  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const mobileVariants = {
    enter: d => ({ opacity: 0, x: d > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.45 } },
    exit: d => ({ opacity: 0, x: d > 0 ? -80 : 80, transition: { duration: 0.3 } }),
  };
  const desktopVariants = {
    enter: d => ({ opacity: 0, x: d > 0 ? 60 : -60, scale: 0.92, filter: 'blur(4px)' }),
    center: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.55 } },
    exit: d => ({ opacity: 0, x: d > 0 ? -60 : 60, scale: 0.92, filter: 'blur(4px)', transition: { duration: 0.4 } }),
  };

  const Dots = ({ className = '' }) => (
    <div className={`flex gap-2 ${className}`}>
      {PRODUCTS.map((_, i) => (
        <button key={i}
          onClick={() => { clearInterval(autoRef.current); goTo(i, i > current ? 1 : -1); }}
          style={{
            width: i === current ? '24px' : '7px', height: '7px', borderRadius: '4px',
            background: i === current ? C.maroon : `rgba(107,44,44,0.2)`,
            border: 'none', cursor: 'pointer', padding: 0,
            transition: 'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
          }} />
      ))}
    </div>
  );

  return (
    <section ref={heroRef} className="relative -mt-4 md:-mt-9"
      style={{ minHeight: '100svh', overflow: 'hidden', background: 'linear-gradient(145deg, #3d1200 0%, #5a1a00 35%, #7a2800 70%, #5a1a00 100%)' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* Parallax BG */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none" style2={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
          <div style={{ position: 'absolute', top: '-100px', right: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,97,0.18) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: '60px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,44,44,0.3) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to top, rgba(26,6,0,0.7) 0%, transparent 100%)' }} />
        </div>
      </motion.div>

      {/* ═══ MOBILE ═══ */}
      <div className="md:hidden" style={{ minHeight: '100svh', position: 'relative', zIndex: 5 }}>
        {/* Packet */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '62svh', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, pointerEvents: 'none', overflow: 'visible' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 55%, rgba(201,169,97,0.22) 0%, transparent 75%)', filter: 'blur(30px)' }} />
          <div style={{ position: 'absolute', width: '86vw', height: '86vw', borderRadius: '50%', border: '1px dashed rgba(201,169,97,0.18)', animation: 'spinSlow 22s linear infinite', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

          {/* Heritage badge */}
          <div style={{ position: 'absolute', top: '8%', right: '8%', zIndex: 10, background: `linear-gradient(135deg, ${C.gold}, #e8c870)`, borderRadius: '50%', width: 52, height: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px rgba(201,169,97,0.5)`, border: '2px solid rgba(255,255,255,0.35)', animation: 'spinSlow 12s linear infinite', pointerEvents: 'none' }}>
            <span style={{ fontSize: '0.38rem', fontWeight: 900, color: C.maroon, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.4, textAlign: 'center' }}>EST<br />1873<br />SOLAPUR</span>
          </div>

          {/* Marathi watermark */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Gotu',sans-serif", fontSize: '8rem', fontWeight: 900, color: 'rgba(201,169,97,0.05)', whiteSpace: 'nowrap', zIndex: 1, userSelect: 'none', pointerEvents: 'none' }}>चिवडा</div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.img key={current} custom={direction} variants={mobileVariants} initial="enter" animate="center" exit="exit"
              src={PRODUCTS[current].img} alt="Namdev Chiwada" draggable={false}
              style={{ position: 'relative', zIndex: 3, width: '110vw', maxWidth: 'none', height: 'auto', animation: 'heroFloat 4s ease-in-out infinite', filter: 'drop-shadow(0 28px 55px rgba(0,0,0,0.82)) drop-shadow(0 6px 22px rgba(201,169,97,0.4))', display: 'block', pointerEvents: 'auto' }} />
          </AnimatePresence>
        </div>

        {/* Text */}
        <div style={{ position: 'relative', zIndex: 10, padding: 'calc(62svh - 10px) 22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {/* Eyebrow */}
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-1.5 rounded-full font-semibold tracking-widest uppercase"
            style={{ fontSize: '0.5rem', padding: '4px 11px', marginBottom: 8, background: `rgba(201,169,97,0.12)`, border: `1px solid rgba(201,169,97,0.35)`, color: C.gold }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.gold, flexShrink: 0, display: 'inline-block' }} />
            Since 1873 · Solapur, Maharashtra
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            style={{ fontFamily: "'Merriweather', serif", fontWeight: 700, color: '#fff', fontSize: 'clamp(1.65rem,7.5vw,2.2rem)', lineHeight: 1.15, textShadow: '0 2px 20px rgba(0,0,0,0.4)', marginBottom: 4, textAlign: 'center' }}>
            Authentic Taste,<br />
            <span style={{ color: C.gold }}>Timeless Tradition</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
            style={{ fontFamily: "'Merriweather', serif", fontStyle: 'italic', fontSize: '0.78rem', color: `rgba(201,169,97,0.85)`, textAlign: 'center', marginBottom: 10 }}>
            खमंग चिवडा — पिढ्यानपिढ्याची चव
          </motion.p>

          <div className="flex justify-center" style={{ marginBottom: 12 }}><Dots /></div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="flex gap-3 w-full justify-center" style={{ marginBottom: 12 }}>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/products')}
              style={{ flex: 1, maxWidth: 160, padding: '12px 10px', fontSize: '0.78rem', borderRadius: 4, fontWeight: 500, textAlign: 'center', border: 'none', cursor: 'pointer', background: C.maroon, color: '#fff', fontFamily: "'Inter',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: `0 4px 16px rgba(107,44,44,0.4)` }}>
              Shop Now →
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/about')}
              style={{ flex: 1, maxWidth: 160, padding: '12px 10px', fontSize: '0.78rem', borderRadius: 4, fontWeight: 500, textAlign: 'center', cursor: 'pointer', background: 'transparent', border: `2px solid rgba(201,169,97,0.5)`, color: C.gold, fontFamily: "'Inter',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Our Story
            </motion.button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
            {TRUST.map(t => (
              <div key={t} className="flex items-center gap-1.5" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', fontFamily: "'Inter',sans-serif" }}>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.gold, flexShrink: 0, display: 'inline-block' }} />{t}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Gold bottom line */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
      </div>

      {/* ═══ DESKTOP ═══ */}
      <div className="hidden md:flex items-center" style={{ minHeight: '100svh', position: 'relative', zIndex: 5 }}>
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid md:grid-cols-2 w-full items-center" style={{ gap: 0 }}>

            {/* LEFT */}
            <div className="text-left order-1" style={{ position: 'relative', zIndex: 20, paddingTop: 'clamp(40px,8vh,100px)', paddingBottom: 'clamp(40px,6vh,80px)' }}>

              {/* Product name indicator */}
              <AnimatePresence mode="wait">
                <motion.div key={`pname-${current}`}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold }} />
                  <span style={{ color: C.gold, fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>
                    Now Showing: {PRODUCTS[current].name}
                  </span>
                  <span style={{ background: C.maroon, color: '#fff', fontSize: '0.5rem', fontWeight: 700, padding: '2px 8px', borderRadius: 3, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>
                    {PRODUCTS[current].tag}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Eyebrow */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full font-semibold tracking-widest uppercase mb-5"
                style={{ fontSize: '0.68rem', padding: '6px 14px', background: 'rgba(201,169,97,0.12)', border: `1px solid rgba(201,169,97,0.3)`, color: C.gold, fontFamily: "'Inter',sans-serif", letterSpacing: '0.1em' }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: C.gold }} />
                Est. 1873 · Solapur, Maharashtra
              </motion.div>

              <StaggerHeading dark={false} />
              <RotatingTagline />
              <LiveOrderChip />

              {/* Buttons */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
                className="flex gap-4 mb-10">
                <motion.button
                  whileHover={{ y: -2, boxShadow: `0 12px 32px rgba(107,44,44,0.5)` }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/products')}
                  style={{ padding: '14px 32px', background: C.maroon, color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: `0 4px 16px rgba(107,44,44,0.4)`, transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
                  Shop Now →
                </motion.button>
                <motion.button
                  whileHover={{ y: -2, borderColor: 'rgba(201,169,97,0.7)', color: C.gold }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/about')}
                  style={{ padding: '12px 30px', background: 'transparent', color: 'rgba(255,255,255,0.85)', border: `2px solid rgba(201,169,97,0.35)`, borderRadius: 4, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.3s ease' }}>
                  Our Story
                </motion.button>
              </motion.div>

              {/* Trust badges */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap gap-5">
                {TRUST.map(t => (
                  <div key={t} className="flex items-center gap-2" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter',sans-serif" }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.gold, flexShrink: 0, display: 'inline-block' }} />
                    {t}
                  </div>
                ))}
              </motion.div>

              {/* Dot nav with labels */}
              <div className="flex gap-4 mt-10">
                {PRODUCTS.map((p, i) => (
                  <button key={i} onClick={() => { clearInterval(autoRef.current); goTo(i, i > current ? 1 : -1); }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', opacity: i === current ? 1 : 0.35, transition: 'opacity 0.3s' }}>
                    <span style={{ fontSize: '0.58rem', color: C.gold, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>{p.name}</span>
                    <div style={{ height: 2, width: i === current ? 32 : 14, background: i === current ? C.gold : 'rgba(201,169,97,0.3)', borderRadius: 2, transition: 'all 0.35s' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT — Packet */}
            <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="order-2 flex flex-col items-center justify-center relative"
              style={{ position: 'relative', zIndex: 15 }}>

              {/* Watermark */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Gotu',sans-serif", fontSize: '13rem', fontWeight: 900, color: 'rgba(201,169,97,0.04)', whiteSpace: 'nowrap', zIndex: 1, userSelect: 'none', pointerEvents: 'none' }}>चिवडा</div>

              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '80%', height: '80%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,97,0.2) 0%, transparent 70%)', filter: 'blur(28px)', pointerEvents: 'none', zIndex: 1 }} />
              <div className="absolute" style={{ width: '520px', height: '520px', borderRadius: '50%', border: `1.5px dashed rgba(201,169,97,0.18)`, animation: 'spinSlow 22s linear infinite', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1 }} />
              <div className="absolute" style={{ width: '380px', height: '380px', borderRadius: '50%', border: `1px solid rgba(255,255,255,0.05)`, animation: 'spinSlow 14s linear infinite reverse', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1 }} />

              {/* Heritage stamp */}
              <div style={{ position: 'absolute', top: '10%', right: '8%', zIndex: 10, background: `linear-gradient(135deg, ${C.gold}, #e8c870)`, borderRadius: '50%', width: 68, height: 68, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px rgba(201,169,97,0.5)`, border: '2px solid rgba(255,255,255,0.35)', animation: 'spinSlow 12s linear infinite' }}>
                <span style={{ fontSize: '0.48rem', fontWeight: 900, color: C.maroon, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.4, textAlign: 'center' }}>EST<br />1873<br />SOLAPUR</span>
              </div>

              <div style={{ position: 'relative', zIndex: 3, width: '100%', display: 'flex', justifyContent: 'center' }}>
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div key={current} custom={direction} variants={desktopVariants} initial="enter" animate="center" exit="exit"
                    style={{ animation: 'heroFloat 4s ease-in-out infinite', display: 'flex', justifyContent: 'center', transform: 'translateY(-40px)' }}>
                    <img src={PRODUCTS[current].img} alt="Namdev Chiwada product"
                      style={{ width: 'clamp(300px,56vw,760px)', maxWidth: 'none', filter: 'drop-shadow(0 40px 70px rgba(0,0,0,0.65)) drop-shadow(0 8px 28px rgba(201,169,97,0.3))', display: 'block' }}
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

// ── Marquee ───────────────────────────────────────────
function MarqueeSection() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden relative" style={{ background: C.maroon, padding: '12px 0' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.04'%3E%3Cpath d='M0 0h20v20H0zM20 20h20v20H20z'/%3E%3C/g%3E%3C/svg%3E\")", opacity: 0.5 }} />
      <div className="marquee-track flex gap-0 whitespace-nowrap" style={{ width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 text-white font-medium px-6"
            style={{ fontSize: '0.8rem', fontFamily: "'Inter',sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <span style={{ color: C.gold, fontSize: '0.5rem' }}>✦</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Features ──────────────────────────────────────────
function FeaturesSection() {
  const ref = useReveal();
  return (
    <section id="features" style={{ padding: '80px 0', background: C.cream }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="reveal text-center" style={{ marginBottom: 56 }}>
          <p style={{ color: C.gold, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif", marginBottom: 12 }}>
            ✦ Why Choose Us ✦
          </p>
          <h2 style={{ fontFamily: "'Merriweather',serif", fontWeight: 700, color: C.dark, fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', letterSpacing: '0.5px' }}>
            Crafted Through Generations
          </h2>
          <div style={{ width: 48, height: 2, background: `linear-gradient(90deg, ${C.maroon}, ${C.gold})`, margin: '16px auto 0', borderRadius: 2 }} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
              whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(107,44,44,0.12)' }}
              style={{ background: C.white, border: `1px solid ${C.goldLight}`, borderRadius: 8, padding: '24px 20px', textAlign: 'center', cursor: 'default', transition: 'box-shadow 0.3s, transform 0.3s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Merriweather',serif", fontWeight: 700, color: C.maroon, marginBottom: 8, fontSize: '0.92rem', lineHeight: 1.4 }}>{f.title}</div>
              <div style={{ fontFamily: "'Inter',sans-serif", color: C.mid, fontSize: '0.8rem', lineHeight: 1.6 }} className="hidden sm:block">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Founder Quote ─────────────────────────────────────
function FounderQuoteSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section ref={ref} style={{ padding: '80px 0', background: `linear-gradient(135deg, #1a0800 0%, #2d1000 50%, #1a0800 100%)`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '300px', background: `radial-gradient(ellipse, rgba(201,169,97,0.07) 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div className="max-w-4xl mx-auto px-6 text-center" style={{ position: 'relative', zIndex: 10 }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.6 }}
          style={{ fontSize: '3.5rem', marginBottom: 20 }}>🧓🏽</motion.div>
        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
          style={{ width: 40, height: 1, background: C.gold, margin: '0 auto 24px' }} />
        <motion.blockquote initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ fontFamily: "'Merriweather',serif", fontWeight: 400, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 20, color: '#fff', fontSize: 'clamp(1.1rem,2.5vw,1.8rem)', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
          "मी सोलापूर सोडताना माझ्या हातात फक्त एक डबा होता — आणि मनात एक स्वप्न."
        </motion.blockquote>
        <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}
          style={{ fontFamily: "'Inter',sans-serif", color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginBottom: 20, fontStyle: 'italic' }}>
          "When I left Solapur, I had only a box in my hands — and a dream in my heart."
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.6 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${C.gold})` }} />
          <span style={{ color: C.gold, fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>Namdev Ji, Founder · 1873</span>
          <div style={{ height: 1, width: 40, background: `linear-gradient(to left, transparent, ${C.gold})` }} />
        </motion.div>
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────
function StatsSection() {
  const ref = useReveal();
  return (
    <section style={{ padding: '72px 0', background: C.maroon, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-opacity='0.04' stroke-width='1'%3E%3Cpath d='M30 0L60 30L30 60L0 30z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
      <div ref={ref} className="reveal max-w-6xl mx-auto px-4 sm:px-6" style={{ position: 'relative', zIndex: 10 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Merriweather',serif", fontWeight: 700, color: '#fff', fontSize: 'clamp(1.8rem,4vw,2.8rem)', marginBottom: 6, letterSpacing: '0.5px' }}>
                {s.value}{s.suffix}
              </div>
              <div style={{ fontFamily: "'Inter',sans-serif", color: `rgba(201,169,97,0.8)`, fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Legacy ────────────────────────────────────────────
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
    <section ref={ref} style={{ padding: '72px 0', background: '#1a0800' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center" style={{ marginBottom: 40 }}>
          <p style={{ color: C.gold, fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif", marginBottom: 12 }}>Our Story · Since 1873</p>
          <h2 style={{ fontFamily: "'Merriweather',serif", fontWeight: 700, color: '#fff', fontSize: 'clamp(1.5rem,3.5vw,2.2rem)', marginBottom: 12, letterSpacing: '0.5px' }}>
            150 years. <span style={{ color: C.gold }}>One recipe.</span>
          </h2>
          <p style={{ fontFamily: "'Inter',sans-serif", color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto' }}>
            Started by one man with nothing but hard work. Six generations later, the same taste — unchanged.
          </p>
        </motion.div>
        <div className="relative mt-8 mb-8">
          <div className="absolute" style={{ top: '19px', left: 'calc(10% + 19px)', right: 'calc(10% + 19px)', height: '1px', background: `rgba(201,169,97,0.25)` }} />
          <div className="grid grid-cols-5 gap-1 sm:gap-4">
            {milestones.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center text-center relative z-10 gap-2">
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.maroon, border: `1px solid rgba(201,169,97,0.35)`, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{m.icon}</div>
                <div style={{ fontSize: 'clamp(0.55rem,1.3vw,0.72rem)', color: 'rgba(255,255,255,0.82)', fontFamily: "'Inter',sans-serif", fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word', hyphens: 'auto' }}>{m.label}</div>
                <div style={{ fontSize: 'clamp(0.5rem,1.1vw,0.65rem)', color: 'rgba(201,169,97,0.5)', lineHeight: 1.3 }}>{m.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
          style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(201,169,97,0.12)`, borderRadius: 8, padding: '16px 20px' }}>
          <div>
            <div style={{ fontFamily: "'Merriweather',serif", fontWeight: 700, color: '#fff', fontSize: '0.92rem', marginBottom: 4 }}>Read the full story</div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>How one man's struggle became Solapur's favourite snack</div>
          </div>
          <Link to="/about"
            style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 8, background: C.maroon, border: 'none', borderRadius: 4, padding: '9px 18px', fontSize: '0.78rem', color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: "'Inter',sans-serif", fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `0 4px 12px rgba(107,44,44,0.4)` }}>
            Read More →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────
function TestimonialsSection() {
  const ref = useReveal();
  return (
    <section style={{ padding: '80px 0', background: C.cream }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="reveal text-center" style={{ marginBottom: 56 }}>
          <p style={{ color: C.gold, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif", marginBottom: 12 }}>✦ Testimonials ✦</p>
          <h2 style={{ fontFamily: "'Merriweather',serif", fontWeight: 700, color: C.dark, fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', letterSpacing: '0.5px' }}>What Our Customers Say</h2>
          <div style={{ width: 48, height: 2, background: `linear-gradient(90deg, ${C.maroon}, ${C.gold})`, margin: '16px auto 0', borderRadius: 2 }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5 }} viewport={{ once: true }}
              whileHover={{ y: -6 }}
              style={{ background: C.white, border: `1px solid ${C.goldLight}`, borderRadius: 8, padding: '28px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default' }}>
              {/* Stars */}
              <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                {[...Array(t.rating)].map((_, j) => (
                  <span key={j} style={{ color: C.gold, fontSize: '1rem' }}>★</span>
                ))}
              </div>
              {/* Quote */}
              <div style={{ width: 28, height: 2, background: C.maroon, marginBottom: 14, borderRadius: 2 }} />
              <p style={{ fontFamily: "'Merriweather',serif", fontStyle: 'italic', color: C.dark, lineHeight: 1.7, marginBottom: 20, fontSize: 'clamp(0.88rem,2.5vw,0.98rem)' }}>
                "{t.text}"
              </p>
              <div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, color: C.maroon, fontSize: '0.85rem' }}>{t.name}</div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '0.75rem', color: C.mid, marginTop: 2 }}>{t.city}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────
function CTASection() {
  return (
    <section style={{ padding: '80px 0', background: C.creamMid, textAlign: 'center' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎁</div>
        <h2 style={{ fontFamily: "'Merriweather',serif", fontWeight: 700, color: C.dark, fontSize: 'clamp(1.4rem,3vw,2rem)', marginBottom: 12, letterSpacing: '0.5px' }}>
          Corporate Gifting
        </h2>
        <div style={{ width: 40, height: 2, background: `linear-gradient(90deg, ${C.maroon}, ${C.gold})`, margin: '0 auto 20px', borderRadius: 2 }} />
        <p style={{ fontFamily: "'Inter',sans-serif", color: C.mid, marginBottom: 32, lineHeight: 1.7, fontSize: '0.95rem' }}>
          Looking for premium Maharashtrian snacks for Diwali, weddings, or corporate events? We offer custom gift hampers in bulk.
        </p>
        <motion.a whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
          href="https://wa.me/919975333427" target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 32px', borderRadius: 4, fontWeight: 500, color: '#fff', background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.3)', fontSize: '0.85rem', fontFamily: "'Inter',sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none' }}>
          💬 WhatsApp Us for Bulk Orders
        </motion.a>
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
      <FounderQuoteSection />
      <StatsSection />
      <LegacyGlimpseSection />
      <TestimonialsSection />
      <CTASection />
    </PageWrapper>
  );
}