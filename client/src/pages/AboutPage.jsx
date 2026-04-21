import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

// ── Timeline Data ──────────────────────────────────────
const TIMELINE = [
  {
    era: 'सुरुवात',
    marathiHeading: 'शून्यातून सुरुवात',
    marathiQuote: 'सोबत फक्त जिद्द, परिश्रम आणि चिकाटी...',
    english: 'Our founder, Bappa, left his small village of Rani Savargaon with nothing but determination. No money, no connections — only an unshakeable desire to create something of his own.',
    icon: '🚶',
    side: 'left',
    color: '#e07000',
  },
  {
    era: 'पहिली झलक',
    marathiHeading: 'शेंगा चुरमुऱ्याचा चिवडा',
    marathiQuote: 'या शेगा चुरमुऱ्याचा चिवडा करून विकला तर...',
    english: 'Hungry and penniless near Madla Maruti market, Bappa stared at roasted peanuts and puffed rice in his hands. A spark of inspiration — what if he made chiwada from this? Namdev Chiwada was born from that single thought.',
    icon: '💡',
    side: 'right',
    color: '#d4af37',
  },
  {
    era: 'पहिले पाऊल',
    marathiHeading: 'डोक्यावर पेटी, मनात स्वप्न',
    marathiQuote: 'एक छोटीशी लाकडी पेटी डोक्यावर घेऊन...',
    english: 'Carrying a small wooden box on his head filled with freshly made chiwda, Bappa walked the lanes of Solapur selling his creation. People began waiting for him every day — the taste was unlike anything they had known.',
    icon: '📦',
    side: 'left',
    color: '#e07000',
  },
  {
    era: 'स्थिरता',
    marathiHeading: '"दत्तात्रय निवास" — स्वप्न साकार',
    marathiQuote: 'त्यावर "दत्तात्रय निवास" ही दोन मजली इमारत बांधून काढली...',
    english: 'Within just 3 years of selling chiwda, Bappa purchased a 3,200 sq ft plot in Navipeth and built a two-storey home — Dattatraya Niwas. An audumbar tree stood at its centre, which he considered a blessing from Dattatraya himself.',
    icon: '🏛️',
    side: 'right',
    color: '#d4af37',
  },
  {
    era: 'वारसा',
    year: '1873 – आजपर्यंत',
    marathiHeading: 'पिढ्यानपिढ्यांची चव',
    marathiQuote: 'बाप्पा देखील आईच्या मायेने चिवडा बनवायचे...',
    english: 'Six generations later, the same recipe. The same masala. The same love. What began as one man\'s survival story became Solapur\'s most cherished culinary tradition — Namdev Chiwada.',
    icon: '🌱',
    side: 'left',
    color: '#2d5a1b',
  },
];

const VALUES = [
  { icon: '🤲', title: 'नम्रता', subtitle: 'Humility', desc: 'Bappa never let success change his simple, honest nature. That humility lives in every pack.' },
  { icon: '🔥', title: 'चिकाटी', subtitle: 'Perseverance', desc: 'From penniless wanderer to landmark — built through relentless, daily effort.' },
  { icon: '❤️', title: 'माया', subtitle: 'Love', desc: 'Made like a mother cooks — with care, not just ingredients. That\'s why it tastes different.' },
  { icon: '✨', title: 'दर्जा', subtitle: 'Quality', desc: 'No shortcuts, no compromises. The finest ingredients, the same slow-roasting technique since 1873.' },
];

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

// ── Timeline Item ──────────────────────────────────────
function TimelineItem({ item, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="relative flex gap-0 mb-12 last:mb-0">

      {/* ── Mobile layout: left dot + full-width card ── */}
      <div className="flex md:hidden items-start gap-4 w-full">
        {/* Dot */}
        <div className="flex flex-col items-center flex-shrink-0 pt-1">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-lg z-10"
            style={{
              background: `linear-gradient(135deg, ${item.color}, ${item.color}bb)`,
              boxShadow: `0 0 0 3px ${item.color}20, 0 4px 16px ${item.color}40`,
            }}>
            {item.icon}
          </motion.div>
          {/* Vertical connector line below dot */}
          <div className="flex-1 w-px mt-2" style={{ background: `${item.color}30`, minHeight: '24px' }} />
        </div>

        {/* Card */}
        <motion.div
          className="flex-1 min-w-0"
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <div className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,253,247,0.95)',
              border: '1px solid rgba(224,112,0,0.12)',
              boxShadow: '0 4px 20px rgba(45,26,0,0.08)',
            }}>
            {/* Era pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-3"
              style={{ background: `${item.color}18`, color: item.color, border: `1px solid ${item.color}30` }}>
              {item.era}
            </div>

            {/* Year */}
            {item.year && (
              <div className="font-serif font-black mb-2" style={{ color: item.color, fontSize: '1.1rem' }}>
                {item.year}
              </div>
            )}

            {/* Marathi Heading */}
            <h3 style={{ fontFamily: "'Gotu', sans-serif", fontSize: '1.05rem', color: '#2d1a00', fontWeight: 700, marginBottom: '8px', lineHeight: 1.4 }}>
              {item.marathiHeading}
            </h3>

            {/* Marathi Quote */}
            <div className="relative mb-3 pl-3" style={{ borderLeft: `3px solid ${item.color}` }}>
              <p style={{
                fontFamily: "'Tiro Devanagari Marathi', serif",
                fontSize: '0.9rem',
                color: item.color,
                fontStyle: 'italic',
                lineHeight: 1.7,
              }}>
                "{item.marathiQuote}"
              </p>
            </div>

            {/* English */}
            <p className="text-sm leading-relaxed" style={{ color: '#7a5a38' }}>
              {item.english}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Desktop layout: alternating left/right ── */}
      <div className={`hidden md:flex items-center gap-0 w-full ${item.side === 'left' ? 'flex-row' : 'flex-row-reverse'}`}>

        {/* Card */}
        <motion.div
          className="w-[calc(50%-40px)]"
          initial={{ opacity: 0, x: item.side === 'left' ? -60 : 60 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <div className="relative rounded-3xl p-7 group transition-all duration-300"
            style={{
              background: 'rgba(255,253,247,0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(224,112,0,0.12)',
              boxShadow: '0 8px 32px rgba(45,26,0,0.08)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 20px 60px rgba(224,112,0,0.15)`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(45,26,0,0.08)'}>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
              style={{ background: `${item.color}18`, color: item.color, border: `1px solid ${item.color}30` }}>
              <span className="text-base">{item.icon}</span>
              {item.era}
            </div>

            {item.year && (
              <div className="font-serif font-black mb-2" style={{ color: item.color, fontSize: '1.5rem' }}>
                {item.year}
              </div>
            )}

            <h3 style={{ fontFamily: "'Gotu', sans-serif", fontSize: '1.15rem', color: '#2d1a00', fontWeight: 700, marginBottom: '10px', lineHeight: 1.4 }}>
              {item.marathiHeading}
            </h3>

            <div className="relative mb-4 pl-4" style={{ borderLeft: `3px solid ${item.color}` }}>
              <p style={{
                fontFamily: "'Tiro Devanagari Marathi', serif",
                fontSize: '0.95rem',
                color: item.color,
                fontStyle: 'italic',
                lineHeight: 1.7,
              }}>
                "{item.marathiQuote}"
              </p>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: '#7a5a38' }}>
              {item.english}
            </p>

            {/* Connector arrow */}
            <div className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 ${item.side === 'left' ? '-right-3' : '-left-3'}`}
              style={{
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent',
                [item.side === 'left' ? 'borderLeft' : 'borderRight']: '12px solid rgba(255,253,247,0.9)',
              }} />
          </div>
        </motion.div>

        {/* Center dot */}
        <div className="w-20 flex flex-col items-center flex-shrink-0 relative z-10">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${item.color}, ${item.color}bb)`,
              boxShadow: `0 0 0 4px ${item.color}20, 0 0 0 8px ${item.color}10, 0 8px 24px ${item.color}40`,
            }}>
            {item.icon}
          </motion.div>
        </div>

        {/* Spacer */}
        <div className="w-[calc(50%-40px)]" />
      </div>
    </div>
  );
}

// ── Hero Section ───────────────────────────────────────
function AboutHero() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={heroRef} className="relative min-h-[85vh] flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#1a0a00 0%,#3d1c00 35%,#7a3300 65%,#e07000 100%)' }}>

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

      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top,#fffdf7,transparent)' }} />

      <motion.div style={{ opacity }} className="max-w-5xl mx-auto px-6 py-24 text-center relative z-10 w-full">
        <motion.div
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-20" style={{ background: 'linear-gradient(to right,transparent,#d4af37)' }} />
          <span style={{ color: '#d4af37', fontSize: '1.4rem' }}>✦</span>
          <div className="h-px w-20" style={{ background: 'linear-gradient(to left,transparent,#d4af37)' }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-xs font-bold tracking-widest uppercase mb-4"
          style={{ color: '#f0cc5a' }}>
          Solapur, Maharashtra · Since 1873
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
          className="font-serif font-black text-white leading-tight mb-6"
          style={{ fontSize: 'clamp(2.5rem,6vw,5rem)', textShadow: '0 4px 30px rgba(0,0,0,0.4)' }}>
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
          className="text-white/70 leading-relaxed max-w-2xl mx-auto mb-4"
          style={{ fontSize: '1.05rem' }}>
          150 years ago, one man left his village with nothing but courage and a dream. Today, six generations later, that dream feeds thousands of families across India — one crunch at a time.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}
          style={{
            fontFamily: "'Tiro Devanagari Marathi', serif",
            fontSize: 'clamp(1rem,2vw,1.3rem)',
            color: 'rgba(255,255,255,0.75)',
            fontStyle: 'italic',
          }}>
          "सन्मानाने जगण्याचा, पायावर उभे राहण्याचा प्रवास..."
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="mt-16 flex flex-col items-center gap-2 text-white/40 text-xs">
          <span className="tracking-widest uppercase text-[10px]">Scroll to explore the journey</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center text-xs">↓</motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Intro Quote ────────────────────────────────────────
function IntroQuote() {
  return (
    <section className="py-16 relative" style={{ background: '#fffdf7' }}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <FadeIn>
          <div className="font-serif text-5xl mb-4" style={{ color: 'rgba(224,112,0,0.15)' }}>"</div>
          <blockquote style={{
            fontFamily: "'Tiro Devanagari Marathi', serif",
            fontSize: 'clamp(2.2rem,3.0vw,2.2rem)',
            color: '#3d1c00',
            lineHeight: 1.8,
            fontStyle: 'italic',
          }}>
            सोबत फक्त आणि फक्त जिद्द, परिश्रम, आणि चिकाटी घेऊन...
          </blockquote>
          <p className="text-brown-mid/60 mt-4 text-sm italic">
            "With nothing but willpower, hard work, and perseverance..."
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="h-px w-12" style={{ background: 'linear-gradient(to right,transparent,#e07000)' }} />
            <span style={{ color: '#e07000' }}>✦</span>
            <div className="h-px w-12" style={{ background: 'linear-gradient(to left,transparent,#e07000)' }} />
          </div>
          <p className="text-xs font-bold tracking-widest uppercase mt-4" style={{ color: '#e07000' }}>
            — The words that started it all
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Timeline Section ───────────────────────────────────
function TimelineSection() {
  return (
    <section className="py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#fef3e0 0%,#fffdf7 100%)' }}>

      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e07000'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />

      <div className="max-w-5xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#e07000' }}>
            The Journey
          </div>
          <h2 className="font-serif font-black text-brown-dark mb-3"
            style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>
            150 Years, One Story
          </h2>
          <p style={{ fontFamily: "'Gotu',sans-serif", color: '#7a3300', fontSize: '1.1rem' }}>
            एक माणूस, एक स्वप्न, एक चव
          </p>
        </FadeIn>

        {/* Timeline */}
        <div className="relative">
          {/* Desktop center vertical line — hidden on mobile */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
            style={{ background: 'linear-gradient(to bottom,transparent,#e07000 10%,#d4af37 50%,#e07000 90%,transparent)' }} />

          {/* Mobile left vertical line */}
          <div className="md:hidden absolute left-[22px] top-0 bottom-0 w-px"
            style={{ background: 'linear-gradient(to bottom,transparent,#e07000 10%,#d4af37 50%,#e07000 90%,transparent)' }} />

          {TIMELINE.map((item, index) => (
            <TimelineItem key={index} item={item} index={index} />
          ))}

          {/* End dot */}
          <div className="flex justify-center mt-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,#e07000,#d4af37)', boxShadow: '0 0 0 6px rgba(224,112,0,0.15)' }}>
              🌟
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Values Section ─────────────────────────────────────
function ValuesSection() {
  return (
    <section className="py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#2d1a00 0%,#3d1c00 50%,#5a2800 100%)' }}>

      <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37'%3E%3Ccircle cx='40' cy='40' r='36' fill='none' stroke='%23d4af37' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }} />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <FadeIn className="text-center mb-16">
          <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#f0cc5a' }}>
            Our Foundation
          </div>
          <h2 className="font-serif font-black text-white mb-3"
            style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)' }}>
            What Makes Us{' '}
            <span style={{
              background: 'linear-gradient(90deg,#ffd89b,#f0cc5a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Different</span>
          </h2>
          <p style={{ fontFamily: "'Gotu',sans-serif", color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
            बाप्पानी आयुष्यभर ज्या गोष्टी जपल्या...
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((v, i) => (
            <FadeIn key={v.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(224,112,0,0.2)' }}
                className="rounded-2xl p-6 text-center transition-all duration-300 cursor-default"
                style={{
                  background: 'rgba(255,253,247,0.06)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}>
                <motion.div whileHover={{ scale: 1.2, rotate: 5 }} transition={{ type: 'spring', stiffness: 300 }}
                  className="text-4xl mb-4 inline-block">
                  {v.icon}
                </motion.div>
                <div style={{
                  fontFamily: "'Gotu',sans-serif",
                  fontSize: '1.2rem',
                  color: '#f0cc5a',
                  fontWeight: 700,
                  marginBottom: '2px',
                }}>
                  {v.title}
                </div>
                <div className="text-xs font-bold tracking-widest uppercase mb-3"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {v.subtitle}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {v.desc}
                </p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Founder Section ────────────────────────────────────
function FounderSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: '#fffdf7' }} ref={ref}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* Left — Visual */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative">

            <div className="rounded-3xl overflow-hidden relative"
              style={{
                boxShadow: '0 24px 60px rgba(45,26,0,0.15)',
                border: '2px solid rgba(224,112,0,0.1)',
                background: 'linear-gradient(135deg,#fef3e0,#fff0d6)',
                minHeight: '380px',
              }}>

              <div className="p-10 flex flex-col items-center justify-center h-full text-center" style={{ minHeight: '380px' }}>
                <div className="text-7xl mb-6">🏺</div>
                <div style={{ fontFamily: "'Gotu',sans-serif", fontSize: '1.5rem', color: '#3d1c00', fontWeight: 700, marginBottom: '8px' }}>
                  आमचे बाप्पा
                </div>
                <div className="text-sm font-semibold tracking-wide" style={{ color: '#e07000' }}>
                  Founder · Namdev Chiwada
                </div>
                <div className="mt-6 h-px w-24 mx-auto" style={{ background: 'linear-gradient(to right,transparent,#e07000,transparent)' }} />
                <div className="mt-4 font-serif text-4xl" style={{ color: 'rgba(224,112,0,0.2)' }}>"</div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 px-6 py-4 text-center"
                style={{ background: 'linear-gradient(to top,rgba(45,26,0,0.08),transparent)' }}>
                <div style={{ fontFamily: "'Tiro Devanagari Marathi',serif", color: '#7a3300', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  राणी सावरगाव → सोलापूर → इतिहास
                </div>
              </div>
            </div>

            <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full flex flex-col items-center justify-center z-10"
              style={{ background: 'linear-gradient(135deg,#d4af37,#f0cc5a)', boxShadow: '0 8px 24px rgba(212,175,55,0.5)' }}>
              <div className="font-serif font-black text-brown-dark text-lg leading-none">1873</div>
              <div className="text-brown-dark/60 text-[9px] font-bold tracking-wider uppercase">Est.</div>
            </div>
          </motion.div>

          {/* Right — Story */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}>

            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#e07000' }}>
              The Founder
            </div>

            <h2 className="font-serif font-black text-brown-dark leading-tight mb-5"
              style={{ fontSize: 'clamp(1.8rem,3.5vw,2.5rem)' }}>
              One Man's Dream,<br />
              <span style={{
                background: 'linear-gradient(90deg,#e07000,#d4af37)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>A City's Tradition</span>
            </h2>

            {[
              { marathi: '"माणसाला घडविणारे हे त्याचे स्वतःचे विचारच असतात"', english: 'A man is shaped by his own thoughts — not his circumstances.' },
              { marathi: '"बाप्पा देखील आईच्या मायेने चिवडा बनवायचे"', english: 'Bappa made chiwda with a mother\'s love — and people could taste the difference.' },
              { marathi: '"दत्त गुरूची कृपा झाली, मार्ग सापडला"', english: 'When all seemed lost, a divine inspiration struck — and Namdev Chiwada was born.' },
            ].map((q, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="mb-5 pl-4 border-l-2"
                style={{ borderColor: i === 0 ? '#e07000' : i === 1 ? '#d4af37' : '#2d5a1b' }}>
                <p style={{
                  fontFamily: "'Tiro Devanagari Marathi',serif",
                  fontSize: '1.2rem',
                  color: i === 0 ? '#e07000' : i === 1 ? '#d4af37' : '#2d5a1b',
                  fontStyle: 'italic',
                  lineHeight: 1.7,
                  marginBottom: '4px',
                }}>
                  {q.marathi}
                </p>
                <p className="text-xs" style={{ color: '#7a5a38' }}>{q.english}</p>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.9 }}
              className="mt-6 p-5 rounded-2xl"
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
    <section className="py-24 relative overflow-hidden text-center"
      style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300 50%,#e07000)' }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center,rgba(212,175,55,0.1),transparent 70%)' }} />

      <div className="max-w-2xl mx-auto px-6 relative z-10">
        <FadeIn>
          <div className="text-5xl mb-5">🍛</div>
          <h2 className="font-serif font-black text-white mb-4"
            style={{ fontSize: 'clamp(1.8rem,4vw,3rem)' }}>
            Taste 150 Years of History
          </h2>
          <p style={{ fontFamily: "'Gotu',sans-serif", color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', marginBottom: '32px' }}>
            एक चव जी पिढ्यानपिढ्या टिकून आहे
          </p>
          <p className="text-white/60 text-sm mb-8">
            Every pack of Namdev Chiwada carries 150 years of a family's love, struggle, and craft.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/products"
                className="inline-block px-8 py-4 rounded-full font-bold text-brown-dark text-base"
                style={{ background: 'linear-gradient(135deg,#d4af37,#f0cc5a)', boxShadow: '0 8px 24px rgba(212,175,55,0.4)' }}>
                Shop Our Products →
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <a href="https://wa.me/919975333427" target="_blank" rel="noreferrer"
                className="inline-block px-8 py-4 rounded-full font-bold text-white text-base"
                style={{ border: '2px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)' }}>
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
    <div>
      <AboutHero />
      <IntroQuote />
      <TimelineSection />
      <ValuesSection />
      <FounderSection />
      <AboutCTA />
    </div>
  );
}
