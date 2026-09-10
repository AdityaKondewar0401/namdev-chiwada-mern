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
  'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1789056399/ChatGPT_Image_Sep_10_2026_09_35_51_PM_dzttx4.png';

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
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full rounded-full"
                style={{ background: '#4ade80', animation: 'pulseDot 1.8s ease-in-out infinite' }}
              />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#4ade80' }} />
            </span>
            <span style={{ color: '#f0cc5a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em' }}>
              FRESHLY ROASTED TODAY
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
          className="relative order-1 flex items-center justify-center md:order-2"
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
          {/* diffuse cast shadow — elliptical, so it can never read as a
              rectangle (the pack PNG isn't transparent, so a CSS drop-shadow
              filter on the <img> would trace its rectangular edge). */}
          <div
            className="absolute"
            style={{
              width: 'min(82vw, 470px)',
              height: 'min(42vw, 240px)',
              top: '50%',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0.4), transparent 70%)',
              filter: 'blur(26px)',
            }}
          />
          {/* tight contact shadow at the base */}
          <div
            className="absolute"
            style={{
              bottom: '15%',
              width: 'min(52vw, 320px)',
              height: 20,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.5), transparent 72%)',
              filter: 'blur(7px)',
            }}
          />
          <motion.img
            src={cldUrl(PACK, 'f_auto,q_auto,w_1000')}
            alt="Namdev Chiwda and Bakarwadi packs"
            width={1000}
            height={667}
            loading="eager"
            fetchpriority="high"
            decoding="async"
            className="relative block w-[min(86vw,420px)] md:w-[clamp(340px,42vw,480px)]"
            style={{
              WebkitMaskImage:
                'radial-gradient(ellipse 120% 82% at 50% 46%, #000 72%, transparent 95%)',
              maskImage: 'radial-gradient(ellipse 120% 82% at 50% 46%, #000 72%, transparent 95%)',
            }}
            animate={{ rotate: [-0.9, 0.9, -0.9], y: [0, -9, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
