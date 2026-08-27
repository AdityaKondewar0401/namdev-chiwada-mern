import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SITE_NAME } from '../config/seo.config';

const MILESTONES = [
  { icon: '🚶', label: 'Left his village', sub: 'Rani Savargaon' },
  { icon: '💡', label: 'Had an idea', sub: 'First chiwda made' },
  { icon: '📦', label: 'Sold door to door', sub: 'Box on his head' },
  { icon: '🏛️', label: 'Built a home', sub: 'In just 3 years' },
  { icon: '🌱', label: '6 generations', sub: 'Same taste today' },
];

// ─────────────────────────────────────────────
// HeritageTimeline  (RENAMED + REDESIGNED from LegacyGlimpseSection)
//
// The old version used a single `grid-cols-5` layout at all
// breakpoints, which on a 375–430px phone squeezed each milestone
// into ~15% of the viewport width — tiny icons, wrapping/hyphenated
// text (see the original screenshots). That's the opposite of the
// "immersive, bigger type" mobile direction the brief asks for.
//
// MOBILE (base/sm): vertical stepper, one milestone per row, with
// a connecting line running down the left side — bigger icon
// circles (56px), full-size readable type, comfortable spacing.
// This is its own scroll "beat," not a shrunk desktop grid.
//
// DESKTOP (md+): the original horizontal 5-column timeline is kept
// as-is, since the width supports it fine there.
// ─────────────────────────────────────────────
export default function HeritageTimeline() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="py-14 md:py-16" style={{ background: '#2d1a00' }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-9 md:mb-4"
        >
          <div
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: '#c8902a', letterSpacing: '0.13em' }}
          >
            Our Story · Since 1873
          </div>
          <h2
            className="font-serif font-black leading-tight mb-3"
            style={{ fontSize: 'clamp(1.7rem,4vw,2.4rem)', color: '#ffffff' }}
          >
            150 years. <span style={{ color: '#d4a843' }}>One recipe.</span>
          </h2>
          <p
            className="text-center mx-auto"
            style={{ fontSize: 'clamp(0.85rem,1.6vw,0.95rem)', color: 'rgba(255,255,255,0.48)', lineHeight: 1.65, maxWidth: 400 }}
          >
            Started by one man with nothing but hard work. Six generations later, the same taste — unchanged.
          </p>
        </motion.div>

        {/* ── MOBILE: vertical stepper ── */}
        <div className="md:hidden relative mt-8 mb-8">
          <div
            className="absolute top-2 bottom-2 left-[27px] w-px"
            style={{ background: 'rgba(212,175,55,0.28)' }}
          />
          <div className="flex flex-col gap-6">
            {MILESTONES.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.45 }}
                className="flex items-center gap-4 relative z-10"
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: '#3d1c00', border: '1.5px solid rgba(212,175,55,0.45)', fontSize: 22,
                  }}
                >
                  {m.icon}
                </div>
                <div>
                  <div className="font-semibold" style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.92)' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>{m.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── DESKTOP: original horizontal timeline, unchanged ── */}
        <div className="hidden md:block relative mt-8 mb-7">
          <div
            className="absolute"
            style={{ top: '19px', left: 'calc(10% + 19px)', right: 'calc(10% + 19px)', height: '1px', background: 'rgba(212,175,55,0.30)' }}
          />
          <div className="grid grid-cols-5 gap-4">
            {MILESTONES.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center text-center relative z-10 gap-2"
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#3d1c00', border: '1px solid rgba(212,175,55,0.40)', fontSize: '15px' }}
                >
                  {m.icon}
                </div>
                <div className="font-semibold leading-snug" style={{ fontSize: 'clamp(0.6rem,1.3vw,0.72rem)', color: 'rgba(255,255,255,0.82)' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 'clamp(0.5rem,1.1vw,0.65rem)', color: 'rgba(255,255,255,0.32)' }}>{m.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.16)', borderRadius: '10px', padding: '16px 20px' }}
        >
          <div>
            <div className="font-serif font-bold mb-0.5" style={{ color: '#ffffff', fontSize: '0.95rem' }}>
              Read the full story
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)' }}>
              How one man's struggle became Solapur's favourite snack
            </div>
          </div>
          <Link
            to="/about"
            className="flex-shrink-0 flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '8px',
              padding: '12px 18px', fontSize: '0.85rem', color: '#ffffff', textDecoration: 'none',
              whiteSpace: 'nowrap', minHeight: 48,
            }}
          >
            Read {SITE_NAME}'s Story →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}