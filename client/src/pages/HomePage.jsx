import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import NamkeenSection from '../components/NamkeenSection';

// ── Constants ──────────────────────────────────────────
const MARQUEE_ITEMS = [
  'Dagdi-Poha Chiwada', 'Maka Chiwada', 'Bakarwadi', 'Lasun Sev',
  'Shengdana Chutney', 'Special Farsan', 'Authentic Taste Since 1873',
];

const TRUST = [
  { icon: '🏆', label: '150+ Years Legacy' },
  { icon: '🌿', label: 'No Artificial Colors' },
  { icon: '✅', label: 'FSSAI Licensed' },
  { icon: '🚚', label: 'Pan-India Delivery' },
];

const FEATURES = [
  { icon: '🔥', title: 'Perfectly Roasted', desc: 'Each batch is carefully roasted and blended for that signature Namdev crunch.' },
  { icon: '🏺', title: '150 Years of Craft', desc: 'A recipe passed down through six generations of the Namdev family.' },
  { icon: '🚚', title: 'Pan-India Delivery', desc: 'Fresh-packed and shipped within 24 hours of your order.' },
  { icon: '🌿', title: '100% Vegetarian', desc: 'No artificial colors, preservatives or additives. Ever.' },
];

const TESTIMONIALS = [
  { name: 'Vedant Lavate', city: 'Kolhapur', text: 'The Special Namkeen takes me back to my childhood in Solapur. Absolutely authentic!', rating: 5 },
  { name: 'Aditya Pawar', city: 'SambajiNagar', text: 'Ordered the Bakarwadi for Diwali gifting — everyone loved it. Will order again!', rating: 5 },
  { name: 'Umesh Chakure', city: 'Latur', text: 'The Dagdi Chiwada is perfectly crispy with just the right amount of spice. Love it!', rating: 5 },
];

const STATS = [
  { value: '150+', label: 'Years of Legacy', icon: '🏛️' },
  { value: '10K+', label: 'Happy Customers', icon: '😊' },
  { value: '100%', label: 'Vegetarian', icon: '🌿' },
  { value: '6th', label: 'Generation', icon: '👨‍👩‍👧‍👦' },
];

// ── Reveal wrapper ─────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}>
      {children}
    </motion.div>
  );
}

// ── HERO ───────────────────────────────────────────────
function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      style={{
        background: 'linear-gradient(145deg,#1a0800 0%,#3d1c00 30%,#7a3300 65%,#b35000 100%)',
        minHeight: '100svh',
        paddingTop: '72px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}>

      {/* Dot pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
      }} />

      {/* Gold radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 65% 40%,rgba(212,175,55,0.12),transparent 60%)',
      }} />

      {/* Bottom fade to cream */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, pointerEvents: 'none', zIndex: 10,
        background: 'linear-gradient(to top,#fffdf7,transparent)',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', width: '100%', position: 'relative', zIndex: 10 }}>
        <div className="flex flex-col md:grid md:grid-cols-2 md:gap-8 md:items-center">

          {/* ── Text (below image on mobile) ── */}
          <div className="order-2 md:order-1 text-center md:text-left mt-4 md:mt-0">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 16px', borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: '#f0cc5a', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                fontSize: 'clamp(0.6rem,1.5vw,0.72rem)',
                marginBottom: 20,
              }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f0cc5a', flexShrink: 0 }} />
              Since 1873 · Solapur, Maharashtra
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 900, color: '#fff', lineHeight: 1.05,
                fontSize: 'clamp(2rem,5.5vw,4.2rem)',
                textShadow: '0 2px 24px rgba(0,0,0,0.35)',
                marginBottom: 12,
              }}>
              Authentic Taste,<br />
              <span style={{
                background: 'linear-gradient(90deg,#ffd89b 0%,#f0cc5a 40%,#ffd89b 80%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                backgroundSize: '200% auto',
              }}>
                Timeless Tradition
              </span>
            </motion.h1>

            {/* Marathi tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              style={{
                fontFamily: "'Hind', 'Noto Sans Devanagari', sans-serif",
                fontSize: 'clamp(0.9rem,2.2vw,1.25rem)',
                background: 'linear-gradient(90deg,#ffd89b,#f0cc5a,#ffd89b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: 28, letterSpacing: '0.02em',
              }}>
              खमंग चिवडा — पिढ्यानपिढ्याची चव
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 mb-8 items-stretch sm:items-center justify-center md:justify-start">

              <motion.button
                whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/products')}
                style={{
                  padding: '14px 32px', borderRadius: 999, fontWeight: 800,
                  fontSize: 'clamp(0.85rem,1.8vw,1rem)',
                  background: 'linear-gradient(135deg,#d4af37,#f0cc5a)',
                  color: '#2d1a00', border: 'none', cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(212,175,55,0.45)',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                Shop Now →
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  padding: '14px 32px', borderRadius: 999, fontWeight: 700,
                  fontSize: 'clamp(0.85rem,1.8vw,1rem)',
                  background: 'transparent',
                  color: '#fff', cursor: 'pointer',
                  border: '2px solid rgba(255,255,255,0.3)',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                Our Story
              </motion.button>
            </motion.div>

            {/* Trust badges — 2 col on mobile */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
              className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-4 justify-center md:justify-start">
              {TRUST.map((t) => (
                <div key={t.label}
                  className="flex items-center gap-1.5 justify-center md:justify-start"
                  style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(0.68rem,1.5vw,0.8rem)' }}>
                  <span>{t.icon}</span>
                  <span style={{ fontWeight: 500 }}>{t.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Product Image (above text on mobile) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="order-1 md:order-2 flex items-center justify-center relative"
            style={{ minHeight: 'clamp(200px,35vw,420px)' }}>

            {/* Spinning ring — desktop only */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="hidden md:block absolute rounded-full"
              style={{
                width: '108%', height: '108%',
                border: '1.5px dashed rgba(212,175,55,0.25)',
              }} />

            {/* Inner glow ring */}
            <div className="hidden md:block absolute rounded-full"
              style={{
                width: '85%', height: '85%',
                background: 'radial-gradient(circle,rgba(212,175,55,0.08),transparent 70%)',
              }} />

            <motion.img
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              src="https://res.cloudinary.com/dz7ykg6qr/image/upload/v1776256647/special1_sy4zxa.png"
              alt="Namdev Chiwada Premium Snack"
              style={{
                width: '100%',
                maxWidth: 'clamp(200px,65vw,520px)',
                filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.45))',
                position: 'relative', zIndex: 10,
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── MARQUEE ────────────────────────────────────────────
function MarqueeSection() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{ background: 'linear-gradient(135deg,#e07000,#b35000)', overflow: 'hidden', padding: '12px 0' }}>
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'flex', width: 'max-content', whiteSpace: 'nowrap' }}>
        {doubled.map((item, i) => (
          <span key={i} style={{
            color: '#fff', fontWeight: 600, fontSize: 'clamp(0.75rem,1.5vw,0.875rem)',
            padding: '0 24px', display: 'inline-flex', alignItems: 'center', gap: 12,
          }}>
            {item}
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem' }}>◆</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── LEGACY SECTION ─────────────────────────────────────
function LegacySection() {
  return (
    <section style={{ background: 'linear-gradient(135deg,#1a0800,#2d1a00 50%,#3d1c00)', padding: 'clamp(60px,8vw,100px) 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Left — quote */}
          <Reveal>
            <div style={{
              padding: '32px', borderRadius: 24,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(212,175,55,0.2)',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: '4rem', color: 'rgba(212,175,55,0.25)', lineHeight: 1, marginBottom: 8, fontFamily: 'serif' }}>"</div>
              <p style={{
                fontFamily: "'Hind', sans-serif",
                fontSize: 'clamp(1.1rem,2.5vw,1.5rem)',
                color: '#fff', lineHeight: 1.6, fontWeight: 600, marginBottom: 16,
              }}>
                "माणसाला घडविणारे हे त्याचे स्वतःचे विचारच असतात"
              </p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                A man is shaped by his own thoughts — not his circumstances.
              </p>
              <div style={{
                marginTop: 20, paddingTop: 16,
                borderTop: '1px solid rgba(212,175,55,0.2)',
                color: '#d4af37', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em',
              }}>
                — आमचे बाप्पा, Founder · 1873
              </div>
            </div>
          </Reveal>

          {/* Right — story */}
          <Reveal delay={0.15}>
            <div>
              <div style={{ color: '#d4af37', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                Our Story
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 900, color: '#fff',
                fontSize: 'clamp(1.8rem,4vw,2.8rem)',
                lineHeight: 1.15, marginBottom: 16,
              }}>
                From a Single Lane<br />
                <span style={{ color: '#f0cc5a' }}>to Every Kitchen</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: 20 }}>
                In 1873, our founder Bappa walked the streets of Solapur with a wooden box of freshly made chiwada on his head. Within three years, he built a home with his own hands. Six generations later, that same recipe — same love, same masala — reaches your doorstep.
              </p>
              <Link to="/about"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 999,
                  border: '1.5px solid rgba(212,175,55,0.4)',
                  color: '#d4af37', fontWeight: 700, fontSize: '0.875rem',
                  textDecoration: 'none', transition: 'all 0.2s',
                }}>
                Read Full Story →
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── FEATURES ───────────────────────────────────────────
function FeaturesSection() {
  return (
    <section id="features" style={{ background: '#fffdf7', padding: 'clamp(48px,8vw,80px) 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal className="text-center" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ color: '#e07000', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
            Why Choose Us
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900, color: '#2d1a00',
            fontSize: 'clamp(1.6rem,3.5vw,2.5rem)',
          }}>
            Crafted Through Generations
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(224,112,0,0.15)' }}
                style={{
                  background: '#fff', borderRadius: 20, padding: 'clamp(16px,3vw,28px)',
                  textAlign: 'center', cursor: 'default',
                  boxShadow: '0 4px 20px rgba(45,26,0,0.07)',
                  border: '1px solid rgba(224,112,0,0.08)',
                  transition: 'box-shadow 0.3s, transform 0.3s',
                }}>
                <div style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', marginBottom: 12 }}>{f.icon}</div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700, color: '#2d1a00',
                  fontSize: 'clamp(0.8rem,1.8vw,1rem)',
                  lineHeight: 1.3, marginBottom: 8,
                }}>{f.title}</div>
                <div style={{ color: 'rgba(45,26,0,0.55)', fontSize: '0.8rem', lineHeight: 1.6 }}
                  className="hidden sm:block">
                  {f.desc}
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── STATS ──────────────────────────────────────────────
function StatsSection() {
  return (
    <section style={{ background: 'linear-gradient(135deg,#2d1a00,#3d1c00 50%,#7a3300)', padding: 'clamp(40px,6vw,64px) 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div>
                <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{s.icon}</div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 900, color: '#fff',
                  fontSize: 'clamp(1.8rem,4vw,3rem)',
                  lineHeight: 1,
                }}>{s.value}</div>
                <div style={{ color: '#f0cc5a', fontWeight: 600, fontSize: 'clamp(0.7rem,1.5vw,0.85rem)', marginTop: 6, letterSpacing: '0.05em' }}>
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── TESTIMONIALS ───────────────────────────────────────
function TestimonialsSection() {
  return (
    <section style={{ background: '#fef3e0', padding: 'clamp(48px,8vw,80px) 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ color: '#e07000', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
              Testimonials
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900, color: '#2d1a00',
              fontSize: 'clamp(1.6rem,3.5vw,2.5rem)',
            }}>
              What Our Customers Say
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -5 }}
                style={{
                  background: '#fff', borderRadius: 20, padding: 28,
                  boxShadow: '0 4px 20px rgba(45,26,0,0.07)',
                  border: '1px solid rgba(224,112,0,0.08)',
                  transition: 'transform 0.3s',
                }}>
                <div style={{ color: '#f59e0b', fontSize: '1.1rem', marginBottom: 12, letterSpacing: 2 }}>
                  {'★'.repeat(t.rating)}
                </div>
                <p style={{ color: 'rgba(45,26,0,0.75)', lineHeight: 1.75, marginBottom: 20, fontStyle: 'italic', fontSize: '0.92rem' }}>
                  "{t.text}"
                </p>
                <div>
                  <div style={{ fontWeight: 700, color: '#2d1a00', fontSize: '0.875rem' }}>{t.name}</div>
                  <div style={{ color: 'rgba(45,26,0,0.45)', fontSize: '0.75rem' }}>{t.city}</div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ────────────────────────────────────────────────
function CTASection() {
  return (
    <section style={{
      background: 'linear-gradient(135deg,#3d1c00,#7a3300 50%,#e07000)',
      padding: 'clamp(60px,8vw,100px) 24px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center,rgba(212,175,55,0.1),transparent 65%)',
      }} />
      <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🎁</div>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 900, color: '#fff',
          fontSize: 'clamp(1.6rem,3.5vw,2.5rem)',
          marginBottom: 12, lineHeight: 1.2,
        }}>
          Corporate Gifting
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 32, fontSize: 'clamp(0.85rem,1.8vw,1rem)' }}>
          Premium Maharashtrian snacks for Diwali, weddings, and corporate events. Custom gift hampers available in bulk.
        </p>
        <motion.a
          href="https://wa.me/919975333427" target="_blank" rel="noreferrer"
          whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
          style={{
            display: 'inline-block',
            padding: 'clamp(12px,2vw,16px) clamp(24px,4vw,40px)',
            borderRadius: 999, fontWeight: 800,
            fontSize: 'clamp(0.875rem,1.8vw,1rem)',
            color: '#fff', textDecoration: 'none',
            background: '#25D366',
            boxShadow: '0 8px 24px rgba(37,211,102,0.4)',
            width: '100%', maxWidth: 320,
          }}>
          💬 WhatsApp Us for Bulk Orders
        </motion.a>
      </div>
    </section>
  );
}

// ── HOME PAGE ──────────────────────────────────────────
export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <MarqueeSection />
      <LegacySection />
      <FeaturesSection />
      <NamkeenSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
