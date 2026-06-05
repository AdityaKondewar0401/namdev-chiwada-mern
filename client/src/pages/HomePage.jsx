import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import useReveal from '../hooks/useReveal';
import NamkeenSection from '../components/NamkeenSection';
import PageWrapper from '../components/PageWrapper';

const MARQUEE_ITEMS = ['Dagdi-Poha Chiwada', 'मका चिवडा', 'Bakarwadi', 'लसूण सेव', 'Shengdana Chutney', 'Special Farsan', 'खमंग चव'];
const TRUST = ['150+ Years Legacy', 'No Artificial Colors', 'FSSAI Licensed'];
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
const PRODUCTS = [
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1776256647/special1_sy4zxa.png', name: 'Special Namkeen', tag: 'Bestseller' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/maka-chiwada-Photoroom_efq78h.png', name: 'Maka Chiwada', tag: 'New' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/bakarwadii-Photoroom_wqk7o0.png', name: 'Bakarvadi', tag: 'Fan Fav' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/farsan_1_-Photoroom_hsdpb5.png', name: 'Special Farsan', tag: 'Classic' },
];

// Live order ticker data
const ORDER_TICKER = [
  '🛒 Priya from Pune just ordered Special Namkeen',
  '🛒 Rahul from Mumbai ordered Bakarvadi',
  '🛒 Sneha from Nagpur ordered Maka Chiwada',
  '🛒 Amit from Solapur ordered Special Farsan',
  '🛒 Kavita from Nashik ordered 3 packs of Namkeen',
  '🛒 Suresh from Kolhapur ordered Diwali Hamper',
];

function preloadImages() {
  PRODUCTS.forEach(p => { const img = new Image(); img.src = p.img; });
}

// ── Live Order Ticker ─────────────────────────────────
function OrderTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % ORDER_TICKER.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 16, zIndex: 50,
      maxWidth: 260,
      background: 'rgba(20,10,0,0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(212,175,55,0.3)',
      borderRadius: 12,
      padding: '10px 14px',
      transition: 'opacity 0.4s, transform 0.4s',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 8px #22c55e' }} />
      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.68rem', lineHeight: 1.4 }}>{ORDER_TICKER[idx]}</span>
    </div>
  );
}

// ── 3D Tilt Packet ────────────────────────────────────
function TiltPacket({ src, alt }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -12, y: dx * 12 });
  }, []);

  const handleLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave}
      style={{ perspective: '800px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'none' }}>
      <motion.img
        src={src} alt={alt} draggable={false}
        animate={{ rotateX: tilt.x, rotateY: tilt.y, scale: tilt.x !== 0 || tilt.y !== 0 ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          width: 'clamp(300px,52vw,720px)', maxWidth: 'none',
          filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.7)) drop-shadow(0 8px 28px rgba(212,168,55,0.35))',
          display: 'block', transformStyle: 'preserve-3d',
          animation: 'heroFloat 4s ease-in-out infinite',
        }}
      />
    </div>
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
  const heroParallax = useTransform(scrollY, [0, 500], [0, -80]);

  useEffect(() => { preloadImages(); }, []);

  const goTo = useCallback((i, dir = 1) => { setDirection(dir); setCurrent(i); }, []);
  const next = useCallback(() => goTo((current + 1) % PRODUCTS.length, 1), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + PRODUCTS.length) % PRODUCTS.length, -1), [current, goTo]);

  useEffect(() => {
    autoRef.current = setInterval(next, 3200);
    return () => clearInterval(autoRef.current);
  }, [next]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const mobileVariants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.45 } },
    exit: (d) => ({ opacity: 0, x: d > 0 ? -80 : 80, transition: { duration: 0.3 } }),
  };

  const desktopVariants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? 60 : -60, scale: 0.92, filter: 'blur(6px)' }),
    center: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.55 } },
    exit: (d) => ({ opacity: 0, x: d > 0 ? -60 : 60, scale: 0.92, filter: 'blur(6px)', transition: { duration: 0.4 } }),
  };

  const Dots = () => (
    <div className="flex gap-2 justify-center">
      {PRODUCTS.map((_, i) => (
        <button key={i}
          onClick={() => { clearInterval(autoRef.current); goTo(i, i > current ? 1 : -1); }}
          style={{
            width: i === current ? '24px' : '7px', height: '7px', borderRadius: '4px',
            background: i === current ? '#ffd89b' : 'rgba(255,255,255,0.25)',
            border: 'none', cursor: 'pointer', padding: 0,
            transition: 'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
          }} />
      ))}
    </div>
  );

  return (
    <section ref={heroRef} className="hero-gradient relative -mt-4 md:-mt-9"
      style={{ minHeight: '100svh', overflow: 'hidden' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* Animated BG mesh */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
        <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,55,0.18) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '40px', left: '-80px', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,112,0,0.14) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-brown-dark/60 to-transparent" />
      </div>

      {/* ═══ MOBILE ═══ */}
      <div className="md:hidden" style={{ minHeight: '100svh', position: 'relative', zIndex: 5 }}>

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50svh', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, pointerEvents: 'none', overflow: 'visible' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 55%, rgba(212,168,55,0.28) 0%, rgba(224,112,0,0.10) 55%, transparent 75%)', filter: 'blur(30px)' }} />

          {/* Marathi watermark */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Gotu',sans-serif", fontSize: '9rem', fontWeight: 900, color: 'rgba(212,175,55,0.05)', whiteSpace: 'nowrap', zIndex: 1, userSelect: 'none', pointerEvents: 'none' }}>चिवडा</div>

          {/* Spinning rings */}
          <div style={{ position: 'absolute', width: '86vw', height: '86vw', borderRadius: '50%', border: '1px dashed rgba(212,175,55,0.18)', animation: 'spinSlow 22s linear infinite', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div style={{ position: 'absolute', width: '65vw', height: '65vw', borderRadius: '50%', border: '0.5px solid rgba(224,112,0,0.12)', animation: 'spinSlow 14s linear infinite reverse', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

          {/* Heritage stamp */}
          <div style={{ position: 'absolute', top: '6%', right: '8%', zIndex: 10, background: 'linear-gradient(135deg,#d4af37,#f0cc5a)', borderRadius: '50%', width: 54, height: 54, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(212,175,55,0.5)', border: '2px solid rgba(255,255,255,0.4)', animation: 'spinSlow 12s linear infinite', pointerEvents: 'none' }}>
            <span style={{ fontSize: '0.42rem', fontWeight: 900, color: '#2d1a00', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3, textAlign: 'center' }}>EST<br />1873<br />SOLAPUR</span>
          </div>

          {/* Product tag */}
          <motion.div
            key={`tag-${current}`}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', top: '12%', left: '6%', zIndex: 10, background: 'rgba(224,112,0,0.9)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '4px 10px', fontSize: '0.6rem', fontWeight: 800, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', border: '1px solid rgba(255,200,80,0.4)', pointerEvents: 'none' }}>
            {PRODUCTS[current].tag}
          </motion.div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.img key={current} custom={direction} variants={mobileVariants} initial="enter" animate="center" exit="exit"
              src={PRODUCTS[current].img} alt="Namdev Chiwada" draggable={false}
              style={{ position: 'relative', zIndex: 3, width: '110vw', maxWidth: 'none', height: 'auto', animation: 'heroFloat 4s ease-in-out infinite', filter: 'drop-shadow(0 28px 55px rgba(0,0,0,0.82)) drop-shadow(0 6px 22px rgba(212,168,55,0.50))', display: 'block', pointerEvents: 'auto' }} />
          </AnimatePresence>
        </div>

        {/* Text */}
        <div style={{ position: 'relative', zIndex: 10, padding: 'calc(50svh - 40px) 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-1.5 rounded-full font-semibold tracking-widest uppercase"
            style={{ fontSize: '0.5rem', padding: '4px 11px', marginBottom: 6, background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(224,112,0,0.15))', border: '1px solid rgba(212,175,55,0.45)', color: '#f0cc5a', boxShadow: '0 2px 12px rgba(212,175,55,0.2)' }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#f0cc5a', flexShrink: 0, display: 'inline-block' }} />
            Since 1873 · Solapur, Maharashtra
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="font-serif font-black text-white text-center"
            style={{ fontSize: 'clamp(1.65rem,7.5vw,2.2rem)', textShadow: '0 2px 20px rgba(0,0,0,0.4)', marginBottom: 3, lineHeight: 1.08 }}>
            Authentic Taste,<br /><span className="shimmer-text">Timeless Tradition</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
            style={{ fontFamily: "'Gotu',sans-serif", background: 'linear-gradient(90deg,#ffd89b,#f0cc5a,#ffd89b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '0.02em', textAlign: 'center', marginBottom: 8, fontSize: '0.78rem' }}>
            खमंग चिवडा — पिढ्यानपिढ्याची चव
          </motion.p>

          <div className="flex justify-center" style={{ marginBottom: 10 }}><Dots /></div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="flex gap-3 w-full justify-center" style={{ marginBottom: 10 }}>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/products')}
              style={{ flex: 1, maxWidth: 165, padding: '12px 10px', fontSize: '0.83rem', borderRadius: 999, fontWeight: 800, textAlign: 'center', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#d4af37,#f5cc40)', color: '#2d1a00', boxShadow: '0 4px 20px rgba(212,175,55,0.55)' }}>
              Shop Now →
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/about')}
              style={{ flex: 1, maxWidth: 165, padding: '12px 10px', fontSize: '0.83rem', borderRadius: 999, fontWeight: 700, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.35)', color: '#fff', backdropFilter: 'blur(8px)' }}>
              Our Story
            </motion.button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
            {TRUST.map((t) => (
              <div key={t} className="flex items-center gap-1.5" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.62)' }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#f0cc5a', flexShrink: 0, display: 'inline-block' }} />{t}
              </div>
            ))}
          </motion.div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', zIndex: 20, background: 'linear-gradient(90deg,transparent,#d4af37,#f0cc5a,#d4af37,transparent)' }} />
      </div>

      {/* ═══ DESKTOP ═══ */}
      <motion.div style={{ y: heroParallax }} className="hidden md:flex items-center" style2={{ minHeight: '100svh', position: 'relative', zIndex: 5 }}>
        <div style={{ minHeight: '100svh', position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', width: '100%' }}>
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="grid md:grid-cols-2 w-full items-center" style={{ gap: 0 }}>

              {/* LEFT */}
              <div className="text-left order-1 hidden md:block"
                style={{ position: 'relative', zIndex: 20, paddingTop: 'clamp(40px,8vh,100px)', paddingBottom: 'clamp(40px,6vh,80px)' }}>

                {/* Animated product name indicator */}
                <AnimatePresence mode="wait">
                  <motion.div key={`pname-${current}`}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.35 }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e07000' }} />
                    <span style={{ color: '#e07000', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                      Now Showing: {PRODUCTS[current].name}
                    </span>
                    <span style={{ background: '#e07000', color: '#fff', fontSize: '0.55rem', fontWeight: 800, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      {PRODUCTS[current].tag}
                    </span>
                  </motion.div>
                </AnimatePresence>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/25 bg-white/10 text-gold-light font-semibold tracking-widest uppercase mb-6"
                  style={{ fontSize: 'clamp(0.58rem,1.8vw,0.75rem)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-light flex-shrink-0" />
                  Since 1873 · Solapur, Maharashtra
                </motion.div>

                <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                  className="font-serif font-black text-white leading-[1.08] mb-3"
                  style={{ fontSize: 'clamp(2.05rem,5vw,3.5rem)', textShadow: '0 2px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
                  Authentic Taste,<br /><span className="shimmer-text" style={{ whiteSpace: 'nowrap' }}>Timeless Tradition</span>
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                  className="mb-6"
                  style={{ fontFamily: "'Gotu',sans-serif", fontSize: 'clamp(0.82rem,2vw,1.3rem)', background: 'linear-gradient(90deg,#ffd89b,#f0cc5a,#ffd89b)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '0.02em' }}>
                  खमंग चिवडा — पिढ्यानपिढ्याची चव
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }} className="flex gap-3 mb-10">
                  <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/products')} className="btn-primary font-poppins text-base px-8 py-3.5">Shop Now →</motion.button>
                  <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/about')} className="btn-outline font-poppins text-base px-8 py-3.5">Our Story</motion.button>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap gap-5">
                  {TRUST.map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-white/75" style={{ fontSize: 'clamp(0.68rem,1.5vw,0.8rem)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-light flex-shrink-0" />
                      <span className="whitespace-nowrap">{t}</span>
                    </div>
                  ))}
                </motion.div>

                {/* Desktop dot nav */}
                <div className="flex gap-3 mt-10">
                  {PRODUCTS.map((p, i) => (
                    <button key={i} onClick={() => { clearInterval(autoRef.current); goTo(i, i > current ? 1 : -1); }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', opacity: i === current ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                      <span style={{ fontSize: '0.6rem', color: '#ffd89b', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{p.name}</span>
                      <div style={{ height: 2, width: i === current ? 32 : 16, background: i === current ? '#ffd89b' : 'rgba(255,255,255,0.3)', borderRadius: 2, transition: 'all 0.35s' }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* RIGHT — 3D tilt packet */}
              <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.15 }}
                className="order-2 flex flex-col items-center justify-center relative hidden md:flex"
                style={{ position: 'relative', zIndex: 15 }}>

                {/* Watermark */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Gotu',sans-serif", fontSize: '13rem', fontWeight: 900, color: 'rgba(212,175,55,0.04)', whiteSpace: 'nowrap', zIndex: 1, userSelect: 'none', pointerEvents: 'none' }}>चिवडा</div>

                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '80%', height: '80%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,55,0.25) 0%, transparent 70%)', filter: 'blur(28px)', pointerEvents: 'none', zIndex: 1 }} />
                <div className="absolute" style={{ width: '540px', height: '540px', borderRadius: '50%', border: '1.5px dashed rgba(212,175,55,0.2)', animation: 'spinSlow 22s linear infinite', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1 }} />
                <div className="absolute" style={{ width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', animation: 'spinSlow 14s linear infinite reverse', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1 }} />

                {/* Heritage stamp */}
                <div style={{ position: 'absolute', top: '10%', right: '8%', zIndex: 10, background: 'linear-gradient(135deg,#d4af37,#f0cc5a)', borderRadius: '50%', width: 68, height: 68, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(212,175,55,0.5)', border: '2px solid rgba(255,255,255,0.4)', animation: 'spinSlow 12s linear infinite' }}>
                  <span style={{ fontSize: '0.5rem', fontWeight: 900, color: '#2d1a00', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3, textAlign: 'center' }}>EST<br />1873<br />SOLAPUR</span>
                </div>

                <div style={{ position: 'relative', zIndex: 3, width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div key={current} custom={direction} variants={desktopVariants} initial="enter" animate="center" exit="exit"
                      style={{ display: 'flex', justifyContent: 'center', transform: 'translateY(-40px)' }}>
                      <TiltPacket src={PRODUCTS[current].img} alt={PRODUCTS[current].name} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ── Cinematic Marquee ─────────────────────────────────
function MarqueeSection() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden py-3 md:py-4 relative" style={{ background: 'linear-gradient(135deg,#e07000,#c05a00)' }}>
      <div style={{ position: 'absolute', inset: 0, background: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.04'%3E%3Cpath d='M0 0h20v20H0zM20 20h20v20H20z'/%3E%3C/g%3E%3C/svg%3E\")", opacity: 0.5 }} />
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

// ── Features ──────────────────────────────────────────
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
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(224,112,0,0.15)' }}
              className="bg-white rounded-xl md:rounded-xl2 p-4 md:p-6 shadow-saffron border border-saffron/5 text-center transition-shadow duration-300">
              <div className="text-2xl md:text-4xl mb-2 md:mb-4">{f.icon}</div>
              <div className="font-serif font-bold text-brown-dark mb-1 md:mb-2 leading-tight" style={{ fontSize: 'clamp(0.78rem,1.8vw,1rem)' }}>{f.title}</div>
              <div className="text-brown-mid/70 leading-relaxed hidden sm:block" style={{ fontSize: 'clamp(0.72rem,1.5vw,0.875rem)' }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Founder Quote Wall ────────────────────────────────
function FounderQuoteSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section ref={ref} className="relative py-16 md:py-24 overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#1a0a00,#2d1200,#1a0a00)' }}>
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: '200px' }} />

      {/* Glowing orb */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(212,168,55,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.6 }}
          style={{ fontSize: '4rem', marginBottom: 16 }}>🧓🏽</motion.div>

        <motion.blockquote initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.2 }}
          style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, lineHeight: 1.35, marginBottom: 20, color: '#fff', fontSize: 'clamp(1.2rem,3vw,2rem)', fontStyle: 'italic', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
          "मी सोलापूर सोडताना माझ्या हातात फक्त एक डबा होता — आणि मनात एक स्वप्न."
        </motion.blockquote>

        <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}
          style={{ fontFamily: "'Gotu',sans-serif", color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 4 }}>
          — Translated: "When I left Solapur, I had only a box in my hands — and a dream in my heart."
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.6 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <div style={{ height: 1, width: 40, background: 'linear-gradient(to right,transparent,#d4af37)' }} />
          <span style={{ color: '#d4af37', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Namdev Ji, Founder · 1873</span>
          <div style={{ height: 1, width: 40, background: 'linear-gradient(to left,transparent,#d4af37)' }} />
        </motion.div>
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
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#3d1c00', border: '1px solid rgba(212,175,55,0.40)', fontSize: '15px' }}>{m.icon}</div>
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

// ── Testimonials ──────────────────────────────────────
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
            <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12, duration: 0.5 }} viewport={{ once: true }}
              whileHover={{ y: -6 }}
              className="bg-white rounded-xl md:rounded-xl2 p-5 md:p-7 shadow-saffron border border-saffron/5">
              <div className="text-amber-400 text-base md:text-lg mb-2 md:mb-3">{'★'.repeat(t.rating)}</div>
              <p className="text-brown-dark/80 leading-relaxed mb-3 md:mb-5 italic font-medium" style={{ fontSize: 'clamp(0.96rem,3.2vw,1.1rem)' }}>"{t.text}"</p>
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

// ── Stats ─────────────────────────────────────────────
function StatsSection() {
  const ref = useReveal();
  const STATS = [
    { value: '150+', label: 'Years of Legacy', icon: '🏺' },
    { value: '10K+', label: 'Happy Customers', icon: '😊' },
    { value: '100%', label: 'Vegetarian', icon: '🌿' },
    { value: '6', label: 'Generations', icon: '👨‍👩‍👧‍👦' },
  ];
  return (
    <section className="py-10 md:py-16 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300)' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-opacity='0.03' stroke-width='1'%3E%3Cpath d='M30 0L60 30L30 60L0 30z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
      <div ref={ref} className="reveal max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}>
              <div style={{ fontSize: '2rem', marginBottom: 4 }}>{s.icon}</div>
              <div className="font-serif font-black text-white mb-1" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)' }}>{s.value}</div>
              <div className="text-saffron-light font-semibold tracking-wide" style={{ fontSize: 'clamp(0.7rem,1.5vw,0.875rem)' }}>{s.label}</div>
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
    <section className="py-14 md:py-20 bg-cream-mid text-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-4xl md:text-5xl mb-3 md:mb-4">🎁</div>
        <h2 className="section-title mb-2 md:mb-3">Corporate Gifting</h2>
        <p className="text-brown-mid/70 mb-6 md:mb-8 leading-relaxed" style={{ fontSize: 'clamp(0.85rem,1.8vw,1rem)' }}>
          Looking for premium Maharashtrian snacks for Diwali, weddings, or corporate events? We offer custom gift hampers in bulk.
        </p>
        <motion.a whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
          href="https://wa.me/919975333427" target="_blank" rel="noreferrer"
          className="inline-block px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold text-white w-full sm:w-auto"
          style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.3)', fontSize: 'clamp(0.85rem,1.8vw,1rem)', display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          💬 WhatsApp Us for Bulk Orders
        </motion.a>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <PageWrapper>
      <OrderTicker />
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
