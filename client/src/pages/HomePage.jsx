import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import useReveal from '../hooks/useReveal';
import NamkeenSection from '../components/NamkeenSection';
import PageWrapper from '../components/PageWrapper';

const MARQUEE_ITEMS = ['Dagdi-Poha Chiwada', 'मका चिवडा', 'Bakarwadi', 'लसूण सेव', 'Shengdana Chutney', 'Special Farsan', 'खमंग चव', 'Since 1873'];
const TRUST = ['150+ Years Legacy', 'No Artificial Colors', 'FSSAI Licensed', 'Pan-India Delivery'];
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
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1776256647/special1_sy4zxa.png', name: 'Special Namkeen', tag: 'BESTSELLER' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/maka-chiwada-Photoroom_efq78h.png', name: 'Maka Chiwada', tag: 'NEW' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/bakarwadii-Photoroom_wqk7o0.png', name: 'Bakarvadi', tag: 'FAN FAV' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/farsan_1_-Photoroom_hsdpb5.png', name: 'Special Farsan', tag: 'CLASSIC' },
];

function preloadImages() {
  PRODUCTS.forEach(p => { const img = new Image(); img.src = p.img; });
}

// ── Mobile Hero — Full Cinematic ──────────────────────
function MobileHero({ current, direction, next, prev, goTo, autoRef, navigate }) {
  const touchStartX = useRef(null);
  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const variants = {
    enter: d => ({ opacity: 0, scale: 1.08, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit: d => ({ opacity: 0, scale: 0.95, x: d > 0 ? -60 : 60, transition: { duration: 0.4 } }),
  };

  return (
    <section
      className="md:hidden relative -mt-4"
      style={{ height: '100svh', overflow: 'hidden' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}>

      {/* ── Full screen packet image ── */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter" animate="center" exit="exit"
          style={{ position: 'absolute', inset: 0, zIndex: 1 }}>

          {/* Background gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #3d1200 0%, #6b2800 40%, #8a3800 70%, #5a2000 100%)',
          }} />

          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: '90vw', height: '90vw', borderRadius: '50%', border: '1px dashed rgba(212,175,55,0.15)', animation: 'spinSlow 25s linear infinite' }} />
          <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: '70vw', height: '70vw', borderRadius: '50%', border: '0.5px solid rgba(212,175,55,0.08)', animation: 'spinSlow 18s linear infinite reverse' }} />

          {/* Gold glow behind packet */}
          <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,55,0.3) 0%, transparent 70%)', filter: 'blur(30px)' }} />

          {/* Marathi watermark */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Gotu',sans-serif", fontSize: '10rem', fontWeight: 900, color: 'rgba(212,175,55,0.04)', whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.04em' }}>नामदेव</div>

          {/* GIANT PACKET — fills top 70% of screen */}
          <motion.img
            src={PRODUCTS[current].img}
            alt={PRODUCTS[current].name}
            draggable={false}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '-5%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '115vw',
              maxWidth: '520px',
              filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.8)) drop-shadow(0 10px 30px rgba(212,168,55,0.4))',
              zIndex: 2,
            }}
          />

          {/* Heritage badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            style={{
              position: 'absolute', top: '6%', right: '6%', zIndex: 10,
              background: 'linear-gradient(135deg,#d4af37,#f0cc5a)',
              borderRadius: '50%', width: 56, height: 56,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(212,175,55,0.6)', border: '2px solid rgba(255,255,255,0.4)',
              animation: 'spinSlow 12s linear infinite',
            }}>
            <span style={{ fontSize: '0.4rem', fontWeight: 900, color: '#3d1200', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.5, textAlign: 'center' }}>EST<br />1873<br />SOLAPUR</span>
          </motion.div>

          {/* Product tag top left */}
          <motion.div
            key={`tag-${current}`}
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            style={{
              position: 'absolute', top: '7%', left: '5%', zIndex: 10,
              background: 'rgba(107,44,44,0.9)', backdropFilter: 'blur(8px)',
              borderRadius: 4, padding: '4px 10px',
              fontSize: '0.55rem', fontWeight: 800, color: '#fff',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              fontFamily: "'Inter',sans-serif",
              border: '1px solid rgba(212,175,55,0.4)',
            }}>
            {PRODUCTS[current].tag}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* ── CINEMATIC BOTTOM TEXT OVERLAY ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 20,
      }}>
        {/* Multi-layer gradient for cinematic fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '75vw',
          background: 'linear-gradient(to top, rgba(20,6,0,1) 0%, rgba(20,6,0,0.97) 25%, rgba(20,6,0,0.85) 50%, rgba(20,6,0,0.5) 70%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 10, padding: '0 22px 32px' }}>

          {/* Product name */}
          <AnimatePresence mode="wait">
            <motion.div key={`name-${current}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 24, height: 1.5, background: '#d4af37', borderRadius: 2 }} />
              <span style={{ color: '#d4af37', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>
                {PRODUCTS[current].name}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Big heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 800, color: '#FFFFFF',
              fontSize: 'clamp(1.9rem, 7.5vw, 2.5rem)',
              lineHeight: 1.1,
              textShadow: '0 2px 20px rgba(0,0,0,0.6)',
              marginBottom: 6,
            }}>
            Authentic Taste,<br />
            <span style={{ color: '#d4af37' }}>Timeless Tradition</span>
          </motion.h1>

          {/* Marathi tagline */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontFamily: "'Gotu', sans-serif",
              fontSize: '0.82rem',
              color: 'rgba(212,175,55,0.8)',
              marginBottom: 18,
              letterSpacing: '0.02em',
            }}>
            खमंग चिवडा — पिढ्यानपिढ्याची चव
          </motion.p>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {PRODUCTS.map((_, i) => (
              <button key={i}
                onClick={() => { clearInterval(autoRef.current); goTo(i, i > current ? 1 : -1); }}
                style={{
                  width: i === current ? '28px' : '7px', height: '7px',
                  borderRadius: '4px',
                  background: i === current ? '#d4af37' : 'rgba(212,175,55,0.25)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
                }} />
            ))}
          </div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/products')}
              style={{
                flex: 1, padding: '14px 0',
                background: 'linear-gradient(135deg, #8B2500, #c03800)',
                color: '#fff', border: 'none', borderRadius: 6,
                fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Inter',sans-serif", letterSpacing: '0.1em',
                textTransform: 'uppercase',
                boxShadow: '0 4px 20px rgba(107,44,44,0.6)',
              }}>
              Shop Now →
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/about')}
              style={{
                flex: 1, padding: '14px 0',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                border: '1.5px solid rgba(212,175,55,0.4)',
                borderRadius: 6,
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Inter',sans-serif", letterSpacing: '0.1em',
                textTransform: 'uppercase',
                backdropFilter: 'blur(8px)',
              }}>
              Our Story
            </motion.button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 16px' }}>
            {TRUST.map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.45)', fontSize: '0.62rem', fontFamily: "'Inter',sans-serif" }}>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#d4af37', display: 'inline-block', flexShrink: 0 }} />
                {t}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Gold bottom line */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, zIndex: 30, background: 'linear-gradient(90deg, transparent, #d4af37, #f0cc5a, #d4af37, transparent)' }} />
    </section>
  );
}

// ── Desktop Hero ──────────────────────────────────────
function DesktopHero({ current, direction, next, prev, goTo, autoRef, navigate }) {
  const { scrollY } = useScroll();
  const packetY = useTransform(scrollY, [0, 600], [0, -60]);

  const variants = {
    enter: d => ({ opacity: 0, x: d > 0 ? 60 : -60, scale: 0.92, filter: 'blur(4px)' }),
    center: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.55 } },
    exit: d => ({ opacity: 0, x: d > 0 ? -60 : 60, scale: 0.92, filter: 'blur(4px)', transition: { duration: 0.4 } }),
  };

  return (
    <section className="hidden md:block relative -mt-9"
      style={{ minHeight: '100svh', overflow: 'hidden', background: 'linear-gradient(160deg, #3d1200 0%, #6b2800 40%, #8a3800 70%, #5a2000 100%)' }}>

      {/* BG decorations */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
        <div style={{ position: 'absolute', top: '-100px', right: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,55,0.18) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '60px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,44,44,0.3) 0%, transparent 70%)' }} />
        <svg style={{ position: 'absolute', top: '50%', right: '2%', transform: 'translateY(-50%)', opacity: 0.06 }} width="600" height="600" viewBox="0 0 600 600" fill="none">
          <circle cx="300" cy="300" r="280" stroke="#d4af37" strokeWidth="1" strokeDasharray="6 10" />
          <circle cx="300" cy="300" r="200" stroke="#d4af37" strokeWidth="0.5" />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to top, rgba(26,6,0,0.7) 0%, transparent 100%)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full relative" style={{ zIndex: 10, minHeight: '100svh', display: 'flex', alignItems: 'center' }}>
        <div className="grid md:grid-cols-2 w-full items-center">

          {/* LEFT */}
          <div style={{ paddingTop: 'clamp(40px,8vh,100px)', paddingBottom: 'clamp(40px,6vh,80px)', position: 'relative', zIndex: 20 }}>

            <AnimatePresence mode="wait">
              <motion.div key={`pname-${current}`}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37' }} />
                <span style={{ color: '#d4af37', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>
                  {PRODUCTS[current].name}
                </span>
                <span style={{ background: '#6B2C2C', color: '#fff', fontSize: '0.5rem', fontWeight: 800, padding: '2px 8px', borderRadius: 3, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>
                  {PRODUCTS[current].tag}
                </span>
              </motion.div>
            </AnimatePresence>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full font-semibold tracking-widest uppercase mb-5"
              style={{ fontSize: '0.68rem', padding: '6px 14px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37', fontFamily: "'Inter',sans-serif" }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#d4af37', display: 'inline-block' }} />
              Est. 1873 · Solapur, Maharashtra
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, color: '#fff', fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: 1.1, textShadow: '0 2px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', marginBottom: 10 }}>
              Authentic Taste,<br />
              <span style={{ color: '#d4af37' }}>Timeless Tradition</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              style={{ fontFamily: "'Gotu',sans-serif", fontSize: 'clamp(0.82rem,2vw,1.2rem)', color: 'rgba(212,175,55,0.8)', marginBottom: 28, letterSpacing: '0.02em' }}>
              खमंग चिवडा — पिढ्यानपिढ्याची चव
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              style={{ display: 'flex', gap: 14, marginBottom: 36 }}>
              <motion.button whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(107,44,44,0.6)' }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/products')}
                style={{ padding: '14px 36px', background: 'linear-gradient(135deg,#8B2500,#c03800)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: '0 4px 20px rgba(107,44,44,0.5)', transition: 'all 0.3s' }}>
                Shop Now →
              </motion.button>
              <motion.button whileHover={{ y: -2, borderColor: 'rgba(212,175,55,0.7)' }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/about')}
                style={{ padding: '12px 32px', background: 'transparent', color: 'rgba(255,255,255,0.85)', border: '1.5px solid rgba(212,175,55,0.3)', borderRadius: 6, fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.3s' }}>
                Our Story
              </motion.button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', marginBottom: 36 }}>
              {TRUST.map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', fontFamily: "'Inter',sans-serif" }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#d4af37', display: 'inline-block' }} />{t}
                </div>
              ))}
            </motion.div>

            {/* Product nav dots with labels */}
            <div style={{ display: 'flex', gap: 20 }}>
              {PRODUCTS.map((p, i) => (
                <button key={i} onClick={() => { clearInterval(autoRef.current); goTo(i, i > current ? 1 : -1); }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', opacity: i === current ? 1 : 0.3, transition: 'opacity 0.3s' }}>
                  <span style={{ fontSize: '0.58rem', color: '#d4af37', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>{p.name}</span>
                  <div style={{ height: 2, width: i === current ? 32 : 14, background: i === current ? '#d4af37' : 'rgba(212,175,55,0.3)', borderRadius: 2, transition: 'all 0.35s' }} />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — Packet */}
          <motion.div style={{ y: packetY }} className="flex flex-col items-center justify-center relative"
            style2={{ position: 'relative', zIndex: 15 }}>
            <div style={{ position: 'relative', zIndex: 15, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '80%', height: '80%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,55,0.25) 0%, transparent 70%)', filter: 'blur(28px)', pointerEvents: 'none', zIndex: 1 }} />
              <div style={{ position: 'absolute', fontFamily: "'Gotu',sans-serif", fontSize: '12rem', fontWeight: 900, color: 'rgba(212,175,55,0.04)', whiteSpace: 'nowrap', zIndex: 1, userSelect: 'none', pointerEvents: 'none' }}>चिवडा</div>
              <div className="absolute" style={{ width: '520px', height: '520px', borderRadius: '50%', border: '1.5px dashed rgba(212,175,55,0.15)', animation: 'spinSlow 22s linear infinite', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1 }} />
              <div className="absolute" style={{ width: '380px', height: '380px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', animation: 'spinSlow 14s linear infinite reverse', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1 }} />

              {/* Heritage stamp */}
              <div style={{ position: 'absolute', top: '10%', right: '8%', zIndex: 10, background: 'linear-gradient(135deg,#d4af37,#f0cc5a)', borderRadius: '50%', width: 70, height: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(212,175,55,0.5)', border: '2px solid rgba(255,255,255,0.4)', animation: 'spinSlow 12s linear infinite' }}>
                <span style={{ fontSize: '0.48rem', fontWeight: 900, color: '#3d1200', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.4, textAlign: 'center' }}>EST<br />1873<br />SOLAPUR</span>
              </div>

              <div style={{ position: 'relative', zIndex: 3, width: '100%', display: 'flex', justifyContent: 'center' }}>
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div key={current} custom={direction} variants={variants} initial="enter" animate="center" exit="exit"
                    style={{ animation: 'heroFloat 4s ease-in-out infinite', display: 'flex', justifyContent: 'center', transform: 'translateY(-40px)' }}>
                    <img src={PRODUCTS[current].img} alt="Namdev Chiwada"
                      style={{ width: 'clamp(300px,56vw,760px)', maxWidth: 'none', filter: 'drop-shadow(0 40px 70px rgba(0,0,0,0.65)) drop-shadow(0 8px 28px rgba(212,168,55,0.3))', display: 'block' }}
                      draggable={false} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Main HeroSection controller ───────────────────────
function HeroSection() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const autoRef = useRef(null);

  useEffect(() => { preloadImages(); }, []);

  const goTo = useCallback((i, dir = 1) => { setDirection(dir); setCurrent(i); }, []);
  const next = useCallback(() => goTo((current + 1) % PRODUCTS.length, 1), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + PRODUCTS.length) % PRODUCTS.length, -1), [current, goTo]);

  useEffect(() => {
    autoRef.current = setInterval(next, 3800);
    return () => clearInterval(autoRef.current);
  }, [next]);

  const shared = { current, direction, next, prev, goTo, autoRef, navigate };

  return (
    <>
      <MobileHero {...shared} />
      <DesktopHero {...shared} />
    </>
  );
}

// ── Marquee ───────────────────────────────────────────
function MarqueeSection() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden py-3 md:py-4 relative" style={{ background: 'linear-gradient(135deg,#8B2500,#6b1c00)' }}>
      <div className="marquee-track flex gap-0 whitespace-nowrap" style={{ width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 text-white font-medium px-6"
            style={{ fontSize: '0.75rem', fontFamily: "'Inter',sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <span style={{ color: '#d4af37', fontSize: '0.45rem' }}>✦</span>{item}
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
    <section className="py-12 md:py-20 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="reveal text-center mb-8 md:mb-14">
          <div className="section-eyebrow justify-center">Why Choose Us</div>
          <h2 className="section-title">Crafted Through Generations</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
              whileHover={{ y: -6 }}
              className="bg-white rounded-xl p-4 md:p-6 border border-saffron/10 text-center"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.3s, box-shadow 0.3s' }}>
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

// ── Founder Quote ─────────────────────────────────────
function FounderQuoteSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section ref={ref} style={{ padding: '72px 0', background: 'linear-gradient(135deg,#1a0800,#2d1000,#1a0800)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '250px', background: 'radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="max-w-4xl mx-auto px-6 text-center" style={{ position: 'relative', zIndex: 10 }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.6 }} style={{ fontSize: '3rem', marginBottom: 16 }}>🧓🏽</motion.div>
        <motion.blockquote initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.2 }}
          style={{ fontFamily: "'Playfair Display',serif", fontWeight: 600, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 16, color: '#fff', fontSize: 'clamp(1.1rem,2.5vw,1.8rem)', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
          "मी सोलापूर सोडताना माझ्या हातात फक्त एक डबा होता — आणि मनात एक स्वप्न."
        </motion.blockquote>
        <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}
          style={{ fontFamily: "'Inter',sans-serif", color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', marginBottom: 16, fontStyle: 'italic' }}>
          "When I left Solapur, I had only a box in my hands — and a dream in my heart."
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.6 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ height: 1, width: 40, background: 'linear-gradient(to right,transparent,#d4af37)' }} />
          <span style={{ color: '#d4af37', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>Namdev Ji, Founder · 1873</span>
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
    <section ref={ref} className="py-10 md:py-16" style={{ background: '#1a0800' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-8">
          <p style={{ color: '#d4af37', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif", marginBottom: 10 }}>Our Story · Since 1873</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: '#fff', fontSize: 'clamp(1.5rem,3.5vw,2.2rem)', marginBottom: 10 }}>
            150 years. <span style={{ color: '#d4af37' }}>One recipe.</span>
          </h2>
          <p style={{ fontFamily: "'Inter',sans-serif", color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto' }}>
            Started by one man with nothing but hard work. Six generations later, the same taste.
          </p>
        </motion.div>
        <div className="relative mb-8">
          <div className="absolute" style={{ top: '19px', left: 'calc(10% + 19px)', right: 'calc(10% + 19px)', height: '1px', background: 'rgba(212,175,55,0.2)' }} />
          <div className="grid grid-cols-5 gap-1 sm:gap-4">
            {milestones.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center text-center relative z-10 gap-2">
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#3d1200', border: '1px solid rgba(212,175,55,0.35)', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.icon}</div>
                <div style={{ fontSize: 'clamp(0.55rem,1.3vw,0.72rem)', color: 'rgba(255,255,255,0.8)', fontFamily: "'Inter',sans-serif", fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word' }}>{m.label}</div>
                <div style={{ fontSize: 'clamp(0.5rem,1.1vw,0.62rem)', color: 'rgba(212,175,55,0.45)', lineHeight: 1.3 }}>{m.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.6 }}
          className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 8, padding: '16px 20px' }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: '#fff', fontSize: '0.92rem', marginBottom: 4 }}>Read the full story</div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>How one man's struggle became Solapur's favourite snack</div>
          </div>
          <Link to="/about" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#8B2500,#c03800)', border: 'none', borderRadius: 6, padding: '9px 18px', fontSize: '0.75rem', color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: "'Inter',sans-serif", fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(107,44,44,0.4)' }}>
            Read More →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────
function StatsSection() {
  const ref = useReveal();
  const STATS = [
    { value: '150+', label: 'Years Legacy', icon: '🏺' },
    { value: '10K+', label: 'Customers', icon: '😊' },
    { value: '6', label: 'Generations', icon: '👨‍👩‍👧‍👦' },
    { value: '100%', label: 'Vegetarian', icon: '🌿' },
  ];
  return (
    <section style={{ padding: '60px 0', background: 'linear-gradient(135deg,#6b1c00,#8B2500)' }}>
      <div ref={ref} className="reveal max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: '#fff', fontSize: 'clamp(1.8rem,4vw,2.8rem)', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontFamily: "'Inter',sans-serif", color: 'rgba(212,175,55,0.75)', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
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
            <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }} viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-5 md:p-7 border border-saffron/10"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.3s' }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
                {[...Array(t.rating)].map((_, j) => <span key={j} style={{ color: '#d4af37', fontSize: '1rem' }}>★</span>)}
              </div>
              <div style={{ width: 24, height: 2, background: '#8B2500', marginBottom: 12, borderRadius: 2 }} />
              <p className="text-brown-dark/80 leading-relaxed mb-4 italic font-medium" style={{ fontSize: 'clamp(0.9rem,2.5vw,1rem)' }}>"{t.text}"</p>
              <div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, color: '#8B2500', fontSize: '0.85rem' }}>{t.name}</div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '0.72rem', color: '#666', marginTop: 2 }}>{t.city}</div>
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
    <section style={{ padding: '72px 0', background: '#F5F1E8', textAlign: 'center' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎁</div>
        <h2 className="section-title mb-3">Corporate Gifting</h2>
        <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg,#8B2500,#d4af37)', margin: '0 auto 20px', borderRadius: 2 }} />
        <p style={{ fontFamily: "'Inter',sans-serif", color: '#666', marginBottom: 28, lineHeight: 1.7, fontSize: '0.92rem' }}>
          Looking for premium Maharashtrian snacks for Diwali, weddings, or corporate events? We offer custom gift hampers in bulk.
        </p>
        <motion.a whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
          href="https://wa.me/919975333427" target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 32px', borderRadius: 6, fontWeight: 600, color: '#fff', background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.3)', fontSize: '0.85rem', fontFamily: "'Inter',sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none' }}>
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