import { motion } from 'framer-motion';

// HeritagePatch — a small "woven fabric label" that states the brand's
// legacy just before the product collection on the homepage. Same
// physical-object spirit as the Shadowfax "shipped with" patch, in a
// stitched-cloth-label form: weave texture, dashed stitching, frayed
// selvedge threads on the short ends, a slight tilt.

function FrayThreads({ side }) {
  const threads = [13, 8, 15, 6, 12, 9, 14, 7];
  const colors = ['#d8c49a', '#b98a52', '#8a5a2a'];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 flex -translate-y-1/2 flex-col gap-[2.5px]"
      style={{ [side]: -15, width: 15, alignItems: side === 'left' ? 'flex-end' : 'flex-start' }}
    >
      {threads.map((w, i) => (
        <span
          key={i}
          style={{
            height: 1.5,
            width: w,
            background: colors[i % 3],
            opacity: 0.5 + (i % 3) * 0.16,
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

export default function HeritagePatch() {
  return (
    <div
      className="w-full px-5 py-11 md:py-14"
      style={{ background: 'linear-gradient(180deg,#fdf1da,#fffdf7)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto"
        style={{ width: 'clamp(258px, 66vw, 336px)', transform: 'rotate(-1.4deg)' }}
      >
        <FrayThreads side="left" />
        <FrayThreads side="right" />

        <div
          className="relative overflow-hidden text-center"
          style={{
            padding: '20px 26px 22px',
            boxShadow: '0 16px 34px -10px rgba(45,26,0,0.3)',
            background:
              'repeating-linear-gradient(0deg,rgba(122,51,0,0.055) 0 1px,transparent 1px 4px),' +
              'repeating-linear-gradient(90deg,rgba(122,51,0,0.055) 0 1px,transparent 1px 4px),' +
              'linear-gradient(135deg,#f2e6c8,#e8d7b0)',
          }}
        >
          <span
            aria-hidden="true"
            className="absolute"
            style={{ inset: 6, border: '1.5px dashed rgba(122,51,0,0.55)' }}
          />

          <div
            className="relative"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.24em',
              color: '#7a3300',
              textShadow: '0 1px 0 rgba(255,252,240,0.6)',
            }}
          >
            NAMDEV CHIWDA
          </div>
          <div
            className="relative font-serif"
            style={{
              fontSize: 'clamp(1rem, 2.8vw, 1.28rem)',
              fontWeight: 900,
              color: '#2d1a00',
              margin: '4px 0 5px',
              lineHeight: 1.15,
              textShadow: '0 1px 0 rgba(255,252,240,0.45)',
            }}
          >
            Serving Solapur
          </div>
          <div className="relative flex items-baseline justify-center gap-1.5">
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.26em',
                color: '#b98b2e',
                textShadow: '0 1px 0 rgba(255,252,240,0.6)',
              }}
            >
              SINCE
            </span>
            <span
              className="font-serif"
              style={{
                fontSize: 'clamp(1.6rem, 4.6vw, 2.15rem)',
                fontWeight: 900,
                color: '#e07000',
                letterSpacing: '0.01em',
                lineHeight: 1,
                textShadow: '0 1px 0 rgba(255,252,240,0.5)',
              }}
            >
              1873
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
