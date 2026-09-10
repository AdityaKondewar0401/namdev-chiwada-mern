import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cldUrl } from '../utils/cloudinary';

// ─────────────────────────────────────────────
// HeroExperience — "Kinetic Type" hero
//
// A giant gold-outline word scrolls infinitely behind the scene; the
// headline wipes up line-by-line from a mask (the 2nd line carries the
// gold shimmer sweep); the product packs sit in a breathing warm
// spotlight with a slow rotating gold light-sweep halo and a gentle
// idle tilt/float. Dark-brown / saffron / gold scheme (unchanged from
// the original hero — `.hero-gradient` in index.css).
//
// Swap the pack shot by changing PACK below (Cloudinary URL, no
// transform string — cldUrl adds f_auto,q_auto).
// ─────────────────────────────────────────────

const PACK =
  'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1789065799/ChatGPT_Image_Sep_11_2026_12_13_02_AM_yry4na.png';

const LINES = ['Roasted Fresh.', 'Loved for 150 Years.'];

function MaskLine({ children, delay }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        className="block"
        initial={{ y: '115%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function HeroExperience() {
  const navigate = useNavigate();

  return (
    <section
      className="hero-gradient relative flex items-center overflow-hidden"
      style={{ minHeight: 'calc(100svh - var(--header-h, 128px))' }}
    >
      {/* giant scrolling ghost word */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-1/2 flex -translate-y-1/2 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 900,
          fontSize: 'clamp(8rem, 24vw, 20rem)',
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: '1.5px rgba(231,191,99,0.12)',
        }}
      >
        <span className="px-8">नामदेव चिवडा · SOLAPUR · </span>
        <span className="px-8">नामदेव चिवडा · SOLAPUR · </span>
      </motion.div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 px-6 pt-12 pb-28 md:grid-cols-2 md:gap-8 md:py-16">
        {/* Copy */}
        <div className="order-2 text-center md:order-1 md:text-left">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
            style={{ background: 'rgba(224,112,0,0.16)', border: '1px solid rgba(240,204,90,0.3)' }}
          >
            <span aria-hidden="true" style={{ color: '#f0cc5a', fontSize: '0.7rem', lineHeight: 1 }}>✦</span>
            <span style={{ color: '#f0cc5a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em' }}>
              SINCE 1873
            </span>
          </motion.div>

          <h1
            className="font-serif font-black text-white"
            style={{ fontSize: 'clamp(1.95rem, 1rem + 3.3vw, 4rem)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            <MaskLine delay={0.15}>
              <span style={{ color: '#fff' }}>{LINES[0]}</span>
            </MaskLine>
            <MaskLine delay={0.32}>
              <span className="shimmer-text">{LINES[1]}</span>
            </MaskLine>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.55 }}
            className="mx-auto mt-6 max-w-md md:mx-0"
            style={{ fontSize: 'clamp(0.95rem,2vw,1.1rem)', color: 'rgba(255,255,255,0.66)', lineHeight: 1.6 }}
          >
            Authentic Solapuri chiwda &amp; bakarwadi — hand-ground masala, pure ghee,
            delivered fresh across Maharashtra.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.82, duration: 0.55 }}
            className="mx-auto mt-8 flex max-w-[330px] flex-row items-stretch justify-center gap-2.5 sm:max-w-none sm:gap-3 md:mx-0 md:justify-start"
          >
            <motion.button
              whileHover={{ y: -2, scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/products')}
              className="btn-saffron font-poppins flex-1 whitespace-nowrap px-3 text-[0.82rem] sm:flex-none sm:px-8 sm:text-base"
            >
              Shop Now →
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/about')}
              className="btn-outline font-poppins flex-1 whitespace-nowrap px-3 text-[0.82rem] sm:flex-none sm:px-8 sm:text-base"
            >
              Explore the Story
            </motion.button>
          </motion.div>
        </div>

        {/* Product spotlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative order-1 flex items-center justify-center py-2 md:order-2 md:py-0"
        >
          {/* breathing warm spotlight */}
          <motion.div
            className="absolute"
            style={{
              width: 'min(92vw, 540px)',
              height: 'min(64vw, 420px)',
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse at 50% 46%, rgba(255,225,150,0.30) 0%, rgba(224,112,0,0.13) 44%, transparent 72%)',
              filter: 'blur(14px)',
            }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* slow rotating light-sweep halo */}
          <motion.div
            className="absolute"
            style={{
              width: 'min(84vw, 500px)',
              height: 'min(84vw, 500px)',
              borderRadius: '50%',
              background:
                'conic-gradient(from 90deg, transparent, rgba(212,168,55,0.26), transparent 45%, rgba(224,112,0,0.14) 70%, transparent)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
          {/* soft grounding shadow under the pack */}
          <div
            className="absolute"
            style={{
              bottom: '14%',
              width: 'min(58vw, 340px)',
              height: 26,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.45), transparent 72%)',
              filter: 'blur(10px)',
            }}
          />
          <motion.img
            src={cldUrl(PACK, 'f_auto,q_auto,w_1000')}
            alt="Namdev Chiwda and Bakarwadi packs"
            width={1000}
            height={1000}
            loading="eager"
            fetchpriority="high"
            decoding="async"
            className="relative block w-[min(80vw,380px)] md:w-[clamp(320px,40vw,460px)]"
            style={{ filter: 'drop-shadow(0 26px 34px rgba(0,0,0,0.42)) drop-shadow(0 6px 10px rgba(0,0,0,0.28))' }}
            animate={{ rotate: [-0.9, 0.9, -0.9], y: [0, -9, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
