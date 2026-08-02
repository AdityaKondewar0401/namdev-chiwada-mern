import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cldUrl, cldSrcSet } from '../utils/cloudinary';

// ─────────────────────────────────────────────
// HeroExperience  (RENAMED + REDESIGNED from the old inline HeroSection)
//
// Kept from the original: the rotating-product carousel concept,
// the staggered heading reveal, the rotating Marathi/English
// tagline, the live "orders this week" chip, the warm brown
// gradient backdrop.
//
// New in this pass:
//  1. Cloudinary images now go through cldUrl()/cldSrcSet() (see
//     utils/cloudinary.js) instead of raw hardcoded URLs — every
//     hero image gets f_auto,q_auto plus a responsive srcset.
//  2. The first (default-visible) product image is the LCP
//     candidate: fetchPriority="high", loading="eager", explicit
//     width/height, decoding="async". Every other slide image is
//     loading="lazy". Pair this with the <link rel="preload"> in
//     index.html noted in the chat reply — this component alone
//     can't add that tag.
//  3. Hero content is animated on MOUNT only (initial/animate),
//     never on scroll — it's visible immediately, per the
//     "above-the-fold must not scroll-fade" requirement.
//  4. Mobile dots/CTA buttons are ≥48×48px tap targets with ≥8px
//     gaps (previously some dot hit-areas were ~7px).
//  5. Added a subtle film-grain vignette overlay for a more
//     cinematic, premium feel — a static SVG texture, no motion,
//     so prefers-reduced-motion is unaffected either way.
//  6. Added a one-line "Free shipping over ₹499 · COD available"
//     micro-trust line under the mobile trust badges — a small,
//     concrete purchase-reassurance detail near the CTA.
//
// Follow-up fixes (this revision):
//  7. BUG FIX — the whole hero (including the text block) appeared to
//     "flash/refresh" every ~3.5s. Root cause: BgDecorations and the old
//     Dots component were defined *inside* HeroExperience's function
//     body, so every autoplay tick created new function references and
//     forced React to unmount/remount them, restarting their CSS
//     animations. Both are now hoisted to module scope with stable
//     identities — no more remount, no more flicker.
//  8. Removed the mobile carousel dot row per feedback (swipe still
//     works to navigate slides). Desktop keeps its dots.
// ─────────────────────────────────────────────

const TRUST = ['150+ Years Legacy', 'No Artificial Colors', 'FSSAI Licensed'];
const MOBILE_TRUST = [
  { icon: '✦', label: '150+ Years' },
  { icon: '🍃', label: 'No Artificial Colors' },
  { icon: '🛡', label: 'FSSAI' },
];

const PRODUCTS = [
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1776256647/special1_sy4zxa.png', alt: 'Namdev Special Chiwda packet' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/maka-chiwada-Photoroom_efq78h.png', alt: 'Namdev Maka Chiwda packet' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/bakarwadii-Photoroom_wqk7o0.png', alt: 'Namdev Bakarwadi packet' },
  { img: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1778141952/farsan_1_-Photoroom_hsdpb5.png', alt: 'Namdev Special Farsan packet' },
];

const TAGLINES = [
  'खमंग चिवडा — पिढ्यानपिढ्याची चव',
  'Hand-Roasted in Small Batches, Daily',
  'सोलापूरची ओळख, घराघरात पोहोचलेली',
  'Six Generations. One Unchanged Recipe.',
];

// Approximate intrinsic aspect ratio for the packet renders (portrait, ~4:5).
// Swap these for the real source dimensions if they differ — the point is
// just to reserve the right box before the image loads (zero layout shift).
const IMG_W = 800;
const IMG_H = 1000;

function preloadImages() {
  // Warms the browser cache for the non-first slides only; slide 0 is
  // handled by the <link rel="preload"> in index.html + fetchPriority below.
  PRODUCTS.slice(1).forEach((p) => {
    const img = new Image();
    img.src = cldUrl(p.img);
  });
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

// Static (non-animated) grain texture — adds cinematic depth without
// touching prefers-reduced-motion, since it never moves.
function GrainOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: 0.05, mixBlendMode: 'overlay', zIndex: 1,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

// BUG FIX: this used to be defined *inside* HeroExperience's function body.
// Every autoplay tick changes `current` state → component re-renders → a
// brand-new `BgDecorations` function reference was created each time →
// React treats that as a different component type → it unmounted/remounted
// the whole decorative background layer (which sits absolute inset-0 behind
// everything) on every single slide change → its CSS keyframe animations
// (spinSlow etc.) restarted, which read as the whole hero "refreshing,"
// including the text sitting on top of it. Hoisting it to module scope
// gives it a stable identity, so it just re-renders in place — no remount,
// no restart, no flicker.
function BgDecorations() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0"
        style={{ opacity: 0.025, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
      <div className="absolute bottom-0 left-0 right-0 h-20 md:h-32 bg-gradient-to-t from-brown-dark/60 to-transparent" />
      <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,55,0.18) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: '40px', left: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,112,0,0.14) 0%, transparent 70%)' }} />
      <GrainOverlay />
    </div>
  );
}

// Same bug fix applied here: hoisted to module scope and now takes
// `current`/`onSelect` as props instead of closing over component state,
// so its identity is stable across re-renders. Desktop-only now — the
// mobile carousel dots were removed per feedback (swipe still works).
function HeroDots({ current, onSelect, className = '' }) {
  return (
    <div className={`flex ${className}`} style={{ gap: 8 }}>
      {PRODUCTS.map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          aria-label={`Product ${i + 1}`}
          className="flex items-center justify-center"
          style={{ width: 48, height: 48, background: 'transparent', border: 'none', padding: 0 }}
        >
          <span
            style={{
              width: i === current ? 22 : 7, height: 7, borderRadius: 4,
              background: i === current ? '#ffd89b' : 'rgba(255,255,255,0.3)',
              display: 'block', transition: 'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
          />
        </button>
      ))}
    </div>
  );
}

export default function HeroExperience() {
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
    autoRef.current = setInterval(next, 3500);
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
    enter: { opacity: 0, x: -80, y: 0 },
    center: { opacity: 1, x: 0, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit: { opacity: 0, x: 90, y: 0, transition: { duration: 0.3, ease: [0.55, 0, 1, 0.45] } },
  };

  const desktopSlideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 50 : -50, scale: 0.94 }),
    center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -50 : 50, scale: 0.94, transition: { duration: 0.35 } }),
  };

  // Stable callback passed to HeroDots (desktop only now)
  const handleDotSelect = useCallback((i) => {
    clearInterval(autoRef.current);
    goTo(i, i > current ? 1 : -1);
  }, [current, goTo]);

  return (
    <section
      className="hero-gradient relative"
      style={{ minHeight: 'calc(100svh - var(--header-h, 128px))', overflow: 'hidden' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <BgDecorations />

      {/* ══════════════════════════════════════
          MOBILE layout — premium redesign
          ══════════════════════════════════════ */}
      <div className="md:hidden" style={{ minHeight: '100%', position: 'relative', zIndex: 5 }}>

        {/* Image zone: spans navbar-bottom to badge-top (53svh) so the packet sits centered */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '53svh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2, pointerEvents: 'none', overflow: 'visible',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 80% 70% at 50% 55%, rgba(212,168,55,0.28) 0%, rgba(224,112,0,0.10) 55%, transparent 75%)',
            filter: 'blur(30px)',
          }} />
          <div style={{
            position: 'absolute', width: '86vw', height: '86vw', borderRadius: '50%',
            border: '1px dashed rgba(212,175,55,0.18)', animation: 'spinSlow 22s linear infinite',
            top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          }} />
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current} custom={direction} variants={mobileSlideVariants}
              initial="enter" animate="center" exit="exit"
              style={{ position: 'relative', zIndex: 3, pointerEvents: 'auto' }}
            >
              <img
                src={cldUrl(PRODUCTS[current].img)}
                srcSet={cldSrcSet(PRODUCTS[current].img)}
                sizes="90vw"
                alt={PRODUCTS[current].alt}
                draggable={false}
                width={IMG_W}
                height={IMG_H}
                // LCP handling: first slide loads eager + high priority; later
                // slides (reached only via swipe/autoplay) are lazy.
                loading={current === 0 ? 'eager' : 'lazy'}
                fetchPriority={current === 0 ? 'high' : 'auto'}
                decoding="async"
                style={{
                  width: '132vw', maxWidth: 'none', height: 'auto', maxHeight: '46svh',
                  filter: 'drop-shadow(0 28px 55px rgba(0,0,0,0.82)) drop-shadow(0 6px 22px rgba(212,168,55,0.50))',
                  display: 'block',
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Text block */}
        <div style={{
          position: 'relative', zIndex: 10,
          padding: 'calc(53svh + 4px) 20px 18px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>

          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 text-gold-light font-semibold uppercase"
            style={{ fontSize: '0.46rem', padding: '4px 12px', marginBottom: 14, letterSpacing: '0.22em', fontFamily: "'Inter', sans-serif" }}
          >
            ● SINCE 1873 · SOLAPUR, MAHARASHTRA
          </div>

          <div className="relative text-center" style={{ marginBottom: 4, width: '100%', maxWidth: '94vw' }}>
            <h1 style={{ lineHeight: 1.12, position: 'relative', zIndex: 1, width: '100%' }}>
              <span style={{
                display: 'block', textAlign: 'center', fontFamily: "'Playfair Display', serif",
                fontWeight: 800, fontStyle: 'normal', fontSize: 'clamp(2rem,8.8vw,3.2rem)',
                letterSpacing: '-0.005em', color: '#fff', textShadow: '0 6px 24px rgba(0,0,0,0.4)',
              }}>
                Authentic Taste,
              </span>
              <span style={{
                display: 'block', textAlign: 'center', fontFamily: "'Playfair Display', serif",
                fontWeight: 800, fontStyle: 'normal', fontSize: 'clamp(2rem,8.8vw,3.2rem)',
                letterSpacing: '-0.005em', color: '#e7bf63', textShadow: '0 6px 24px rgba(224,112,0,0.3)',
                // NEW: small explicit gap above this line (not a general
                // line-height bump) — just enough extra vertical rhythm to
                // push everything below (tagline, divider, CTA buttons)
                // fully clear of the first-viewport fold, instead of the
                // buttons showing a half-cut sliver at the bottom edge.
                // Bump this a few px higher if your device still shows a
                // sliver; it's deliberately modest per your request.
                marginTop: 10,
              }}>
                Timeless Tradition
              </span>
            </h1>
          </div>

          <p style={{
            fontFamily: "'Gotu', sans-serif",
            background: 'linear-gradient(90deg,#ffd89b,#f0cc5a,#ffd89b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            letterSpacing: '0.02em', textAlign: 'center', fontSize: '1.22rem', marginTop: 16, marginBottom: 22,
          }}>
            खमंग चिवडा — पिढ्यानपिढ्याची चव
          </p>

          {/* NOTE: mobile carousel dots removed per feedback — swipe left/right
              on the packet image still navigates between products, this was
              purely the visual dot row. Divider's bottom margin bumped up a
              little to keep the spacing balanced now that row is gone. */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 34 }}>
            <div style={{ width: 45, height: 1, background: 'rgba(212,168,55,0.45)' }} />
            <div style={{ width: 7, height: 7, background: '#D4A843', borderRadius: 999 }} />
            <div style={{ width: 45, height: 1, background: 'rgba(212,168,55,0.45)' }} />
          </div>

          <div className="flex w-full justify-center" style={{ gap: 18, marginBottom: 16 }}>
            <button
              onClick={() => navigate('/products')}
              className="btn-primary font-poppins"
              style={{
                flex: 1, maxWidth: 165, height: 56, fontSize: '0.85rem', borderRadius: 999, fontWeight: 700,
                boxShadow: '0 15px 35px rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 6, whiteSpace: 'nowrap',
              }}
            >
              Shop Now <span>→</span>
            </button>
            <button
              onClick={() => navigate('/about')}
              className="btn-outline font-poppins"
              style={{
                flex: 1, maxWidth: 165, height: 56, fontSize: '0.85rem', borderRadius: 999, fontWeight: 700,
                boxShadow: '0 15px 35px rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', whiteSpace: 'nowrap',
              }}
            >
              Our Story
            </button>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 justify-center mb-2">
            {MOBILE_TRUST.map((t) => (
              <div key={t.label} className="flex items-center gap-1.5" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.68)', fontFamily: "'Inter', sans-serif" }}>
                <span style={{ fontSize: '0.75rem' }}>{t.icon}</span>
                {t.label}
              </div>
            ))}
          </div>

          {/* NEW: small purchase-reassurance microcopy, close to the CTA */}
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", letterSpacing: '0.02em' }}>
            Free shipping over ₹499 · Cash on delivery available
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          DESKTOP layout — unchanged structure, perf attrs added
          ══════════════════════════════ */}
      <div className="hidden md:flex items-center" style={{ minHeight: '100%', position: 'relative', zIndex: 5 }}>
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid md:grid-cols-2 w-full items-center" style={{ gap: 0 }}>

            <div className="text-left order-1"
              style={{ position: 'relative', zIndex: 20, paddingTop: 'clamp(40px,8vh,100px)', paddingBottom: 'clamp(40px,6vh,80px)', transform: 'translateY(28px)' }}>

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
              <div style={{ position: 'relative', zIndex: 3, width: '100%', display: 'flex', justifyContent: 'center', transform: 'translateY(28px)' }}>
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div key={current} custom={direction} variants={desktopSlideVariants}
                    initial="enter" animate="center" exit="exit"
                    style={{ animation: 'heroFloat 4s ease-in-out infinite', display: 'flex', justifyContent: 'center' }}>
                    <img
                      src={cldUrl(PRODUCTS[current].img)}
                      srcSet={cldSrcSet(PRODUCTS[current].img)}
                      sizes="(min-width: 1024px) 760px, 56vw"
                      alt={PRODUCTS[current].alt}
                      width={IMG_W}
                      height={IMG_H}
                      loading={current === 0 ? 'eager' : 'lazy'}
                      fetchPriority={current === 0 ? 'high' : 'auto'}
                      decoding="async"
                      style={{ width: 'clamp(300px,56vw,760px)', maxWidth: 'none', filter: 'drop-shadow(0 40px 70px rgba(0,0,0,0.6)) drop-shadow(0 8px 24px rgba(212,168,55,0.25))', display: 'block' }}
                      draggable={false}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
              <HeroDots current={current} onSelect={handleDotSelect} className="mt-2 justify-center" />
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}