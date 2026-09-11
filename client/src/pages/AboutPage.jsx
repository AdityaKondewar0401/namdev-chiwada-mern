import { useRef, useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import { buildBreadcrumbSchema } from '../utils/structuredData';
import { SITE_NAME } from '../config/seo.config';

gsap.registerPlugin(ScrollTrigger);

// The timeline's rail + node dots share this one gutter width — never
// compute their horizontal position from two different calculations
// (that's exactly what let them drift apart from each other before).
const TIMELINE_RAIL = 44;

const ABOUT_BREADCRUMB_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
];

// ─────────────────────────────────────────────
// AboutPage — REDESIGNED
//
// What changed from the previous version, and why:
//
// 1. TONE: cut the copy density and sentimentality across the page.
//    Removed the standalone "IntroQuote" full-viewport blockquote
//    section (it duplicated the hero's Marathi line and read as an
//    extra emotional beat). Timeline entries went from a heading +
//    long italic quote + full paragraph each, down to one short
//    Marathi caption + a single crisp sentence. Founder section went
//    from three stacked quotes to one. The story is still there —
//    it's just told with restraint instead of narrated at length.
//
// 2. TIMELINE (the main ask): redesigned as a numbered "chapter"
//    sequence — 01 through 05 — since this content is genuinely
//    chronological and the numbering carries real information (which
//    is the only case where numbering something is worth doing).
//    Mobile gets a compact numeral badge overlapping the icon medallion;
//    desktop additionally gets a large ghost numeral behind the center
//    dot as a quiet editorial signature. The gold scroll-linked
//    progress line from the original is kept — it's the single best
//    "premium" touch already in the codebase.
//
// 3. MOBILE: Values grid moved from a full-width single column to a
//    2-column grid (matching the homepage's FeaturesSection pattern),
//    with shorter copy that actually fits at that width. Timeline
//    entries are more compact and legible at 375–430px. Ember particle
//    count trimmed for mobile performance.
// ─────────────────────────────────────────────

// ── Timeline Data — trimmed to one clear sentence per chapter ──
const TIMELINE = [
  {
    num: '०१', eyebrow: 'The Beginning', marathi: 'शून्यातून सुरुवात',
    title: 'A Village Left Behind',
    text: "Bappa left Rani Savargaon with no capital and no contacts — only the resolve to build something of his own.",
    color: '#e07000',
  },
  {
    num: '०२', eyebrow: 'The Spark', marathi: 'शेंगदाणा चुरमुरा',
    title: 'An Idea Near Madla Maruti',
    text: 'Holding roasted peanuts and puffed rice, one question changed everything: what if this became chiwda?',
    color: '#d4af37',
  },
  {
    num: '०३', eyebrow: 'First Steps', marathi: 'डोक्यावर पेटी',
    title: 'A Box, A City, A Following',
    text: "Carrying fresh chiwda through Solapur's lanes in a wooden box, Bappa built a following one customer at a time.",
    color: '#e07000',
  },
  {
    num: '०४', eyebrow: 'Taking Root', year: '1873', marathi: 'दत्तात्रय निवास',
    title: 'A Home in Navipeth',
    text: 'Three years in, Bappa built a two-storey home — proof the risk had paid off.',
    color: '#d4af37',
  },
  {
    num: '०५', eyebrow: 'The Legacy', marathi: 'पिढ्यानपिढ्यांची चव',
    title: 'Six Generations, One Recipe',
    text: 'The same masala, the same method — carried forward, batch after batch, since 1873.',
    color: '#2d5a1b',
  },
];

// ── Values — short enough to sit comfortably in a 2-col mobile grid ──
const VALUES = [
  { icon: '🤲', title: 'नम्रता', subtitle: 'Humility', desc: "Success never changed Bappa's simple, honest nature." },
  { icon: '🔥', title: 'चिकाटी', subtitle: 'Perseverance', desc: 'Built through relentless daily effort — no shortcuts.' },
  { icon: '❤️', title: 'माया', subtitle: 'Care', desc: 'Made with the same care as a home kitchen, always.' },
  { icon: '✨', title: 'दर्जा', subtitle: 'Quality', desc: 'Same ingredients, same method, since 1873.' },
];

// ── Extra premium keyframes (shine sweep, glow pulse) ──
const premiumStyles = `
  @keyframes shineSweep {
    0%   { transform: translateX(-120%) skewX(-20deg); }
    100% { transform: translateX(220%) skewX(-20deg); }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 0 4px rgba(212,175,55,0.15), 0 0 30px rgba(212,175,55,0.25); }
    50%      { box-shadow: 0 0 0 6px rgba(212,175,55,0.25), 0 0 46px rgba(212,175,55,0.4); }
  }
  .shine-btn { position: relative; overflow: hidden; }
  .shine-btn::after {
    content: '';
    position: absolute; top: 0; left: 0;
    width: 40%; height: 100%;
    background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent);
    animation: shineSweep 3.2s ease-in-out infinite;
    animation-delay: 1s;
  }
  .founder-frame { animation: glowPulse 4s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .shine-btn::after, .founder-frame { animation: none !important; }
  }
`;

// ── Film grain overlay — subtle premium texture across the whole page ──
function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] mix-blend-overlay"
      style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

// ── Floating ember particles for the hero — count trimmed for mobile perf ──
function EmberParticles({ count = 10 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 3.5,
        delay: Math.random() * 6,
        duration: 7 + Math.random() * 7,
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: '10%', opacity: 0 }}
          animate={{ y: '-90%', opacity: [0, 0.8, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            bottom: 0,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #f0cc5a, rgba(240,204,90,0) 70%)',
          }}
        />
      ))}
    </div>
  );
}

// ── Count-up hook for the stats strip ──
function useCountUp(target, duration, startWhenInView) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!startWhenInView) return;
    let startTime;
    let raf;
    function tick(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startWhenInView, target, duration]);
  return value;
}

// ── Stats strip — quick, premium, count-up numbers ──
function StatsStrip() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const years = useCountUp(150, 1600, isInView);
  const generations = useCountUp(6, 1200, isInView);
  const customers = useCountUp(100, 1400, isInView);

  const stats = [
    { value: `${years}+`, label: 'Years of Legacy' },
    { value: `${generations}`, label: 'Generations' },
    { value: `${customers}K+`, label: 'Happy Customers' },
  ];

  return (
    <section
      ref={ref}
      className="relative py-10 md:py-14"
      style={{ background: '#fffdf7', borderTop: '1px solid rgba(224,112,0,0.08)', borderBottom: '1px solid rgba(224,112,0,0.08)' }}
    >
      <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-4 sm:gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div
              className="font-serif font-black"
              style={{
                fontSize: 'clamp(1.6rem,4.5vw,3rem)',
                background: 'linear-gradient(135deg,#e07000,#d4af37)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {s.value}
            </div>
            <div
              className="font-bold tracking-widest uppercase mt-1"
              style={{ color: '#7a5a38', fontSize: 'clamp(0.52rem,1.5vw,0.72rem)' }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 3D tilt wrapper for Values cards (desktop hover only — harmless no-op on touch) ──
function TiltCard({ children }) {
  const ref = useRef(null);
  const [transform, setTransform] = useState('perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)');

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(700px) rotateX(${py * -9}deg) rotateY(${px * 9}deg) scale(1.03)`);
  }
  function reset() {
    setTransform('perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)');
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ transform, transition: 'transform 0.18s ease-out', transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
}

// ── Fade In Component ──────────────────────────────────
function FadeIn({ children, delay = 0, direction = 'up', className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 30 : direction === 'down' ? -30 : 0,
      x: direction === 'left' ? -40 : direction === 'right' ? 40 : 0,
    },
    visible: { opacity: 1, y: 0, x: 0 },
  };
  return (
    <motion.div ref={ref} className={className}
      variants={variants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      transition={{ duration: 0.75, delay, ease: [0.25, 0.46, 0.45, 0.94] }}>
      {children}
    </motion.div>
  );
}

// ── Timeline node — a camera-iris ring that draws on with GSAP, its
// center numeral doubling as the chapter's Devanagari sequence marker ──
function TimelineIris({ item, className = '' }) {
  return (
    <svg className={className} width="34" height="34" viewBox="0 0 30 30" fill="none">
      <circle cx="15" cy="15" r="13" stroke={item.color} strokeWidth="2" strokeDasharray="100" strokeLinecap="round" transform="rotate(-90 15 15)" />
      <circle cx="15" cy="15" r="7" fill="#160603" stroke="#f0cc5a" strokeWidth="1" />
      <text x="15" y="15.5" textAnchor="middle" dominantBaseline="central"
        fontFamily="'Noto Serif Devanagari', serif" fontSize="6.5" fontWeight="700" fill="#f0cc5a">
        {item.num}
      </text>
    </svg>
  );
}

// ── Timeline copy block — eyebrow, Marathi caption, title, one sentence ──
function TimelineCopy({ item, align = 'left' }) {
  return (
    <div style={{ textAlign: align }}>
      <div className="text-[0.62rem] font-bold uppercase tracking-[0.2em]" style={{ color: '#f0cc5a' }}>
        {item.eyebrow}{item.year ? ` · ${item.year}` : ''}
      </div>
      <div className="mt-1 text-[0.9rem]" style={{ fontFamily: "'Tiro Devanagari Marathi',serif", color: '#e0b866', fontStyle: 'italic' }}>
        {item.marathi}
      </div>
      <h3 className="mt-1 font-serif font-black" style={{ color: '#fff8ec', fontSize: '1.2rem' }}>
        {item.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'rgba(255,248,236,0.6)' }}>
        {item.text}
      </p>
    </div>
  );
}

// ── Small gold line-and-circle motif for the section header ──
function TimelineOrnament({ color = '#e0b866', width = 150 }) {
  return (
    <svg viewBox="0 0 200 22" width={width} height={width * 0.11} fill="none" aria-hidden="true">
      <path
        d="M6 11 H74 M194 11 H126 M100 3 C108 3 114 7 114 11 C114 15 108 19 100 19 C92 19 86 15 86 11 C86 7 92 3 100 3 Z M78 11 h6 M116 11 h6"
        stroke={color} strokeWidth="1.3" strokeLinecap="round"
      />
    </svg>
  );
}

// ── Closing flourish — a gold rosette capstone, replacing the old 🌟 emoji ──
function ClosingFlourish() {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="46" height="46" viewBox="0 0 46 46" fill="none" aria-hidden="true">
        <circle cx="23" cy="23" r="21" stroke="#f0cc5a" strokeWidth="1" opacity="0.4" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1="23" y1="23"
            x2={23 + 16 * Math.cos((a * Math.PI) / 180)} y2={23 + 16 * Math.sin((a * Math.PI) / 180)}
            stroke="#f0cc5a" strokeWidth="1" opacity="0.5" />
        ))}
        <circle cx="23" cy="23" r="6" fill="#f0cc5a" />
      </svg>
      <div className="text-[0.68rem] font-bold uppercase tracking-[0.25em]" style={{ color: 'rgba(240,204,90,0.65)' }}>
        Since 1873
      </div>
    </div>
  );
}

// ── Hero Section — trimmed to one clean subline, no stacked quotes ──
function AboutHero() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={heroRef} className="relative min-h-[78vh] md:min-h-[85vh] flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#1a0a00 0%,#3d1c00 35%,#7a3300 65%,#e07000 100%)' }}>

      <EmberParticles />

      <motion.div style={{ y }} className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='1'%3E%3Cpath d='M40 0C17.9 0 0 17.9 0 40s17.9 40 40 40 40-17.9 40-40S62.1 0 40 0zm0 72C22.3 72 8 57.7 8 40S22.3 8 40 8s32 14.3 32 32-14.3 32-32 32z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }} />
      </motion.div>

      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(212,175,55,0.15),transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(224,112,0,0.2),transparent 70%)', filter: 'blur(50px)' }} />

      <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top,#fffdf7,transparent)' }} />

      <motion.div style={{ opacity }} className="max-w-5xl mx-auto px-6 py-20 md:py-24 text-center relative z-10 w-full">
        <motion.div
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-7">
          <div className="h-px w-16 md:w-20" style={{ background: 'linear-gradient(to right,transparent,#d4af37)' }} />
          <span style={{ color: '#d4af37', fontSize: '1.3rem' }}>✦</span>
          <div className="h-px w-16 md:w-20" style={{ background: 'linear-gradient(to left,transparent,#d4af37)' }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-xs font-bold tracking-widest uppercase mb-4"
          style={{ color: '#f0cc5a' }}>
          Solapur, Maharashtra · Since 1873
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
          className="font-serif font-black text-white leading-tight mb-5"
          style={{ fontSize: 'clamp(2.3rem,6vw,5rem)', textShadow: '0 4px 30px rgba(0,0,0,0.4)' }}>
          आमचा प्रवास
          <br />
          <span style={{
            background: 'linear-gradient(90deg,#ffd89b,#f0cc5a,#ffd89b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Our Legacy</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
          className="text-white/70 leading-relaxed max-w-xl mx-auto"
          style={{ fontSize: '1.02rem' }}>
          One man's leap of faith in 1873 has grown into six generations of the same recipe.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
          className="mt-12 md:mt-16 flex flex-col items-center gap-2 text-white/40 text-xs">
          <span className="tracking-widest uppercase text-[10px]">Scroll to explore the journey</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center text-xs">↓</motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Timeline Section — GSAP ScrollTrigger–driven "Spotlight Archway" chapters ──
// A scroll-scrubbed gold spine and a traveling spotlight glow run the full
// height of the chapter list, and each chapter reveals once as it enters
// view — real scroll-linkage, not an autoplay-on-mount demo.
//
// Reduced-motion / no-JS safe: every card and node renders fully visible in
// plain CSS by default (no inline opacity/scale in the JSX below). GSAP only
// dims cards down to their "waiting" state at runtime, inside the
// motion-is-OK branch of gsap.matchMedia() — so if that branch never runs
// (prefers-reduced-motion, or JS fails entirely), nothing is left stuck
// hidden; visitors just see the static, fully-lit layout.
//
// Alignment is content-height-agnostic on purpose: mobile uses one shared
// fixed-width gutter column (TIMELINE_RAIL) that holds both the rail line
// and every node, sized by natural document flow; desktop uses a CSS Grid
// row (1fr / TIMELINE_RAIL / 1fr) whose middle column is inherently
// centered regardless of container width. Neither needs a JS pixel
// calculation, so real (variable-length) chapter copy can't knock them
// out of alignment the way the old two-different-offsets bug did.
function TimelineSection() {
  const root = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isMobile: '(max-width: 767px)',
          isDesktop: '(min-width: 768px)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { isMobile, reduceMotion } = context.conditions;

          // Ambient embers are purely decorative, so they're gated on
          // reduced-motion alone rather than tied to scroll progress.
          if (!reduceMotion) {
            gsap.set('.tl-ember', { y: 0, opacity: 0 });
            gsap.to('.tl-ember', {
              y: -140, opacity: 1, duration: 4, repeat: -1, ease: 'none',
              stagger: { each: 0.7, repeat: -1 }, keyframes: { opacity: [0, 0.9, 0] },
            });
          }

          // Leave every chapter in its static, fully-visible fallback.
          if (reduceMotion) return;

          const scope = isMobile ? '.tl-mobile' : '.tl-desktop';
          const cardSel = isMobile ? '.tl-card' : '.tl-dcard';
          const nodeSel = isMobile ? '.tl-node' : '.tl-dnode';
          const spotSel = isMobile ? '.tl-spot' : '.tl-spot-d';
          const railFillSel = isMobile ? '.tl-rail-fill' : '.tl-rail-fill-d';
          const rowPrefix = isMobile ? '.tl-row-' : '.tl-drow-';
          const cardPrefix = isMobile ? '.tl-card-' : '.tl-dcard-';
          const nodePrefix = isMobile ? '.tl-node-' : '.tl-dnode-';

          gsap.set(cardSel, { opacity: 0.22, filter: 'brightness(0.55) blur(1px)' });
          gsap.set(nodeSel, { scale: 0 });
          gsap.set(spotSel, { opacity: 0 });

          // Rail fill + traveling spotlight scrub continuously with scroll —
          // no per-chapter pixel math, so this holds up for any copy length.
          gsap.timeline({
            scrollTrigger: { trigger: scope, start: 'top 70%', end: 'bottom 65%', scrub: 0.6 },
          })
            .fromTo(railFillSel, { scaleY: 0 }, { scaleY: 1, ease: 'none' }, 0)
            .fromTo(spotSel, { top: '0%', opacity: 1 }, { top: '100%', ease: 'none' }, 0);

          // Each chapter reveals once, the moment it enters view.
          TIMELINE.forEach((_, i) => {
            ScrollTrigger.create({
              trigger: `${rowPrefix}${i}`,
              start: 'top 82%',
              toggleActions: 'play none none none',
              onEnter: () => {
                gsap.to(`${nodePrefix}${i}`, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.5)' });
                gsap.to(`${cardPrefix}${i}`, { opacity: 1, filter: 'brightness(1) blur(0px)', duration: 0.5 });
                gsap.fromTo(`${nodePrefix}${i} circle`, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' });
              },
            });
          });
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative overflow-hidden px-6 py-16 md:px-10 md:py-24"
      style={{ background: 'linear-gradient(180deg,#1c0d02,#2f1600 40%,#231000)' }}
    >
      {/* Temple-archway backdrop: tiled arch silhouettes + drifting embers */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='90' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M45 118 V60 A25 25 0 0 1 95 60 V118' stroke='%23d4af37' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: '90px 120px',
        }}
      />
      {[...Array(8)].map((_, i) => (
        <span
          key={i}
          className="tl-ember pointer-events-none absolute h-1 w-1 rounded-full"
          style={{ left: `${8 + i * 11}%`, bottom: 60, background: '#f0cc5a', boxShadow: '0 0 6px 2px rgba(240,204,90,0.6)' }}
        />
      ))}
      {/* Spotlight-reel framing: film grain + velvet curtain edges */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {[0, 1].map((s) => (
        <div
          key={s}
          className="pointer-events-none absolute top-0 bottom-0 w-6 md:w-10"
          style={{
            [s ? 'right' : 'left']: 0,
            backgroundImage: 'repeating-linear-gradient(90deg,rgba(0,0,0,0.5) 0 4px,rgba(122,20,20,0.4) 4px 8px)',
          }}
        />
      ))}

      <div className="relative z-10 mb-12 text-center md:mb-16">
        <div className="flex justify-center"><TimelineOrnament /></div>
        <div className="mt-4 text-xs font-bold tracking-widest uppercase" style={{ color: '#e0b866' }}>
          The Journey
        </div>
        <h2 className="mt-2 font-serif font-black" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', color: '#fff8ec' }}>
          150 Years, Five Chapters
        </h2>
        <p className="mt-2" style={{ fontFamily: "'Tiro Devanagari Marathi',serif", color: '#e0b866', fontStyle: 'italic', fontSize: '1.05rem' }}>
          एक माणूस, एक स्वप्न, एक चव
        </p>
        <Link
          to="/our-history"
          className="mt-3 inline-block text-sm font-semibold underline underline-offset-2"
          style={{ color: '#f0cc5a' }}
        >
          Read the full illustrated timeline on Our History →
        </Link>
      </div>

      {/* ── MOBILE: single column, shared gutter rail on the left ── */}
      <div className="tl-mobile relative z-10 mx-auto max-w-md md:hidden">
        <div
          className="tl-spot pointer-events-none absolute left-1/2 z-0 -translate-x-1/2 rounded-full"
          style={{ width: 280, height: 190, background: 'radial-gradient(ellipse,rgba(255,224,160,0.18),transparent 70%)' }}
        />
        <span
          className="absolute top-2 bottom-2 w-px"
          style={{ left: TIMELINE_RAIL / 2, background: 'rgba(224,184,102,0.14)' }}
        />
        <span
          className="tl-rail-fill absolute top-2 bottom-2 w-[3px] origin-top -translate-x-1/2 rounded-full"
          style={{ left: TIMELINE_RAIL / 2, background: 'linear-gradient(to bottom,#f0cc5a,#7a3300)', boxShadow: '0 0 10px rgba(240,204,90,0.5)' }}
        />
        {TIMELINE.map((item, i) => (
          <div key={i} className={`tl-row-${i} relative flex items-start`}>
            <div className="relative flex flex-shrink-0 justify-center pt-1" style={{ width: TIMELINE_RAIL }}>
              <div className={`tl-node tl-node-${i} relative z-10`}>
                <TimelineIris item={item} />
              </div>
            </div>
            <div className={`tl-card tl-card-${i} min-w-0 flex-1 pb-10 last:pb-0`}>
              <TimelineCopy item={item} />
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP: centered rail, alternating sides via a 1fr/rail/1fr grid ── */}
      <div className="tl-desktop relative z-10 mx-auto hidden max-w-3xl md:block">
        <div
          className="tl-spot-d pointer-events-none absolute left-1/2 z-0 -translate-x-1/2 rounded-full"
          style={{ width: 480, height: 260, background: 'radial-gradient(ellipse,rgba(255,224,160,0.16),transparent 70%)' }}
        />
        <span className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2" style={{ background: 'rgba(224,184,102,0.14)' }} />
        <span
          className="tl-rail-fill-d absolute left-1/2 top-2 bottom-2 w-[3px] origin-top -translate-x-1/2 rounded-full"
          style={{ background: 'linear-gradient(to bottom,#f0cc5a,#7a3300)', boxShadow: '0 0 10px rgba(240,204,90,0.5)' }}
        />
        {TIMELINE.map((item, i) => {
          const left = i % 2 === 0;
          return (
            <div
              key={i}
              className={`tl-drow-${i} relative grid items-center py-8`}
              style={{ gridTemplateColumns: `1fr ${TIMELINE_RAIL}px 1fr` }}
            >
              <div className="pr-12">
                {left && <div className={`tl-dcard tl-dcard-${i}`}><TimelineCopy item={item} align="right" /></div>}
              </div>
              <div className="relative z-10 flex justify-center">
                <div className={`tl-dnode tl-dnode-${i}`}>
                  <TimelineIris item={item} />
                </div>
              </div>
              <div className="pl-12">
                {!left && <div className={`tl-dcard tl-dcard-${i}`}><TimelineCopy item={item} align="left" /></div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 mt-12 flex justify-center md:mt-16">
        <ClosingFlourish />
      </div>
    </section>
  );
}

// ── Values Section — 2-col grid on mobile, matching the homepage pattern ──
function ValuesSection() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#2d1a00 0%,#3d1c00 50%,#5a2800 100%)' }}>

      <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37'%3E%3Ccircle cx='40' cy='40' r='36' fill='none' stroke='%23d4af37' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }} />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 relative z-10">
        <FadeIn className="text-center mb-10 md:mb-16">
          <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#f0cc5a' }}>
            Our Foundation
          </div>
          <h2 className="font-serif font-black text-white mb-3"
            style={{ fontSize: 'clamp(1.7rem,3.5vw,2.8rem)' }}>
            What Makes Us{' '}
            <span style={{
              background: 'linear-gradient(90deg,#ffd89b,#f0cc5a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Different</span>
          </h2>
          <p style={{ fontFamily: "'Gotu',sans-serif", color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
            बाप्पानी आयुष्यभर ज्या गोष्टी जपल्या...
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {VALUES.map((v, i) => (
            <FadeIn key={v.title} delay={i * 0.08}>
              <TiltCard>
                <div
                  className="rounded-2xl p-4 sm:p-6 text-center transition-shadow duration-300 cursor-default h-full"
                  style={{
                    background: 'rgba(255,253,247,0.06)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 20px 50px rgba(224,112,0,0.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)')}
                >
                  <motion.div whileHover={{ scale: 1.2, rotate: 5 }} transition={{ type: 'spring', stiffness: 300 }}
                    className="text-3xl sm:text-4xl mb-3 sm:mb-4 inline-block">
                    {v.icon}
                  </motion.div>
                  <div style={{
                    fontFamily: "'Gotu',sans-serif",
                    fontSize: 'clamp(1rem,3vw,1.2rem)',
                    color: '#f0cc5a',
                    fontWeight: 700,
                    marginBottom: '2px',
                  }}>
                    {v.title}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-2 sm:mb-3"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {v.subtitle}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {v.desc}
                  </p>
                </div>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Founder Section — one quote instead of three ───────
function FounderSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-16 md:py-24 relative overflow-hidden" style={{ background: '#fffdf7' }} ref={ref}>
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Left — Visual */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative">

            <div className="founder-frame relative rounded-3xl overflow-hidden"
              style={{
                boxShadow: '0 30px 70px rgba(45,26,0,0.18)',
                border: '1.5px solid rgba(212,175,55,0.35)',
                background: 'linear-gradient(150deg,#fef3e0 0%,#fff0d6 55%,#fbe6c4 100%)',
                minHeight: '340px',
              }}>

              {[
                { top: 14, left: 14, rotate: 0 },
                { top: 14, right: 14, rotate: 90 },
                { bottom: 14, left: 14, rotate: -90 },
                { bottom: 14, right: 14, rotate: 180 },
              ].map((pos, i) => (
                <div key={i} className="absolute w-6 h-6 pointer-events-none z-10" style={{ ...pos }}>
                  <svg viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${pos.rotate}deg)` }}>
                    <path d="M2 2H14M2 2V14" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                  </svg>
                </div>
              ))}

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 45, ease: 'linear' }}
                className="absolute pointer-events-none"
                style={{ top: '38%', left: '50%', width: 200, height: 200, marginLeft: -100, marginTop: -100, borderRadius: '50%', border: '1px dashed rgba(212,175,55,0.45)' }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
                className="absolute pointer-events-none"
                style={{ top: '38%', left: '50%', width: 160, height: 160, marginLeft: -80, marginTop: -80, borderRadius: '50%', border: '1px solid rgba(224,112,0,0.2)' }}
              />

              <div className="p-8 sm:p-10 flex flex-col items-center justify-center h-full text-center relative z-10" style={{ minHeight: '340px' }}>
                <div className="text-6xl sm:text-7xl mb-5 sm:mb-6" style={{ filter: 'drop-shadow(0 8px 20px rgba(224,112,0,0.35))' }}>🏺</div>
                <div style={{ fontFamily: "'Gotu',sans-serif", fontSize: '1.4rem', color: '#3d1c00', fontWeight: 700, marginBottom: '8px' }}>
                  आमचे बाप्पा
                </div>
                <div className="text-sm font-semibold tracking-wide" style={{ color: '#e07000' }}>
                  Founder · Namdev Chiwda
                </div>
                <div className="mt-6 h-px w-24 mx-auto" style={{ background: 'linear-gradient(to right,transparent,#e07000,transparent)' }} />
              </div>

              <div className="absolute bottom-0 left-0 right-0 px-6 py-4 text-center z-10"
                style={{ background: 'linear-gradient(to top,rgba(45,26,0,0.1),transparent)' }}>
                <div style={{ fontFamily: "'Tiro Devanagari Marathi',serif", color: '#7a3300', fontSize: '0.88rem', fontStyle: 'italic' }}>
                  राणी सावरगाव → सोलापूर → इतिहास
                </div>
              </div>
            </div>

            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -top-5 -right-5 w-20 h-20 rounded-full flex flex-col items-center justify-center z-20"
              style={{ background: 'linear-gradient(135deg,#d4af37,#f0cc5a)', boxShadow: '0 8px 24px rgba(212,175,55,0.55)' }}>
              <div className="font-serif font-black text-brown-dark text-lg leading-none">1873</div>
              <div className="text-brown-dark/60 text-[9px] font-bold tracking-wider uppercase">Est.</div>
            </motion.div>
          </motion.div>

          {/* Right — Story: one quote, not three */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}>

            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#e07000' }}>
              The Founder
            </div>

            <h2 className="font-serif font-black text-brown-dark leading-tight mb-5"
              style={{ fontSize: 'clamp(1.7rem,3.5vw,2.5rem)' }}>
              One Man's Dream,<br />
              <span style={{
                background: 'linear-gradient(90deg,#e07000,#d4af37)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>A Lasting Craft</span>
            </h2>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="mb-6 pl-4 border-l-2"
              style={{ borderColor: '#d4af37' }}>
              <p style={{
                fontFamily: "'Tiro Devanagari Marathi',serif",
                fontSize: '1.15rem',
                color: '#d4af37',
                fontStyle: 'italic',
                lineHeight: 1.7,
                marginBottom: '4px',
              }}>
                "दत्त गुरूची कृपा झाली, मार्ग सापडला"
              </p>
              <p className="text-xs" style={{ color: '#7a5a38' }}>A moment of inspiration showed him the way forward.</p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.55 }}
              className="text-sm leading-relaxed mb-6"
              style={{ color: '#7a5a38' }}
            >
              What started as a way to survive became a craft he refined for the rest of his life —
              and passed down exactly as he found it.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.7 }}
              className="p-5 rounded-2xl"
              style={{ background: 'linear-gradient(135deg,#fff0d6,#fef3e0)', border: '1px solid rgba(224,112,0,0.15)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>🌳</div>
                <div>
                  <div className="font-bold text-brown-dark text-sm">दत्तात्रय निवास</div>
                  <div className="text-xs" style={{ color: '#7a3300' }}>
                    Built in 1873 · The audumbar tree still stands · Navipeth, Solapur
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── CTA Section ────────────────────────────────────────
function AboutCTA() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden text-center"
      style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300 50%,#e07000)' }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center,rgba(212,175,55,0.1),transparent 70%)' }} />

      <div className="max-w-2xl mx-auto px-5 sm:px-6 relative z-10">
        <FadeIn>
          <div className="text-4xl sm:text-5xl mb-4 sm:mb-5">🍛</div>
          <h2 className="font-serif font-black text-white mb-3"
            style={{ fontSize: 'clamp(1.7rem,4vw,3rem)' }}>
            Taste the Legacy
          </h2>
          <p style={{ fontFamily: "'Gotu',sans-serif", color: 'rgba(255,255,255,0.7)', fontSize: '1rem', marginBottom: '20px' }}>
            एक चव, सहा पिढ्या
          </p>
          <p className="text-white/60 text-sm mb-8">
            Every batch follows the same recipe Bappa perfected in 1873.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/products"
                className="shine-btn inline-block px-8 py-4 rounded-full font-bold text-brown-dark text-base"
                style={{ background: 'linear-gradient(135deg,#d4af37,#f0cc5a)', boxShadow: '0 8px 24px rgba(212,175,55,0.4)', minHeight: 48 }}>
                Shop Our Products →
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <a href="https://wa.me/919130160491" target="_blank" rel="noreferrer"
                className="inline-block px-8 py-4 rounded-full font-bold text-white text-base"
                style={{ border: '2px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)', minHeight: 48 }}>
                💬 Talk to Us
              </a>
            </motion.div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Main Export ────────────────────────────────────────
export default function AboutPage() {
  return (
    <PageWrapper>
      <SEO
        title={`Our Story | ${SITE_NAME} – Serving Solapur Since 1873`}
        description={`The story of ${SITE_NAME} — founded in Solapur in 1873, carried forward through six generations of the same family recipe, using groundnut oil and hand-ground masala.`}
        canonical="/about"
        jsonLd={buildBreadcrumbSchema(ABOUT_BREADCRUMB_ITEMS)}
      />
      <style>{premiumStyles}</style>
      <GrainOverlay />
      <div className="relative">
        <AboutHero />
        <StatsStrip />
        <TimelineSection />
        <ValuesSection />
        <FounderSection />
        <AboutCTA />
      </div>
    </PageWrapper>
  );
}