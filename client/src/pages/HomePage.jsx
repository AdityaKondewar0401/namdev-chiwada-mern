import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import useReveal from '../hooks/useReveal';
import PageWrapper from '../components/PageWrapper';
import NamkeenSection from '../components/NamkeenSection';
// ── New / redesigned homepage sections ──
import HeroExperience from '../components/HeroExperience';
import HeritageTimeline from '../components/HeritageTimeline';
import TestimonialsCarousel from '../components/TestimonialsCarousel';
import DistributorshipBand from '../components/DistributorshipBand';
import StickyShopBar from '../components/StickyShopBar';

const MARQUEE_ITEMS = ['Dagdi-Poha Chiwda', 'Maka Chiwda', 'Bakarwadi', 'Lasun Sev', 'Shengdana Chutney', 'Special Farsan', 'Authentic Taste'];

// ============================================================================
// FEATURES SECTION — "Glassmorphic layered cards" (chosen concept)
//
// Frosted-glass icon plates float over duotone-treated product photos, all
// sitting inside one warm gradient panel. The vegetarian card has no product
// photo of its own, so it gets a matching frosted panel instead of forcing a
// photo where there isn't one. Desktop is a 4-up grid inside the gradient
// panel; mobile is a horizontal snap-scroll carousel of the same cards so
// nothing gets cramped or overflows into the WhatsApp button.
// ============================================================================

const FEATURES = [
  {
    icon: '🔥',
    image: '/images/chiwada-1.jpg',
    title: 'Perfectly Roasted Blend',
    desc: 'Each batch is carefully roasted and blended for that signature Namdev crunch.',
  },
  {
    icon: '🏅',
    image: '/images/bakarwadi-2.jpg',
    title: '150 Years of Craft',
    desc: 'A recipe passed down through six generations of the Namdev family.',
  },
  {
    icon: '🚚',
    image: '/images/maka-chiwada-1.jpg',
    title: 'Pan-Maharashtra Delivery',
    desc: 'Fresh-packed and delivered across Maharashtra via Shadowfax, fast and reliable.',
  },
  {
    icon: 'VEG_MARK',
    title: '100% Vegetarian',
    desc: 'No artificial colors, preservatives or additives. Ever.',
  },
];

// India's mandatory FSSAI "green dot" vegetarian mark, drawn with plain divs
// so it renders instantly with no image request and no broken-image fallback
// to worry about.
function VegMark({ size = 22, border = 3 }) {
  return (
    <div
      style={{
        width: size, height: size,
        border: `${border}px solid #fff`,
        borderRadius: Math.max(4, size * 0.16),
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '58%', height: '58%', borderRadius: '50%', background: '#2F6B1B' }} />
    </div>
  );
}

// One glass card. Photo cards get a warm duotone wash (so four different
// product photos still read as one cohesive palette) plus a frosted icon
// plate; the vegetarian card is a frosted panel over a soft green wash with
// no photo, since there's no product shot for "100% vegetarian" to show.
function GlassFeatureCard({ f, index, className = '' }) {
  const isVeg = f.icon === 'VEG_MARK';
  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ boxShadow: '0 8px 24px rgba(45,26,0,0.12)' }}
    >
      <div className="absolute inset-0">
        {isVeg ? (
          <div className="w-full h-full" style={{ background: 'linear-gradient(150deg, rgba(63,122,40,0.9), rgba(27,61,16,0.95))' }} />
        ) : (
          <>
            <img
              src={f.image}
              alt={f.title}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(150deg, rgba(224,112,0,0.3), rgba(30,16,0,0.62))' }} />
          </>
        )}
      </div>

      {/* Frosted icon plate */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: 12, left: 12, width: 34, height: 34, borderRadius: 10,
          background: 'rgba(255,255,255,0.28)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.35)',
          fontSize: 15,
        }}
      >
        {isVeg ? '🌿' : f.icon}
      </div>

      {/* Frosted number plate */}
      <div
        className="absolute flex items-center justify-center font-bold text-white"
        style={{
          top: 12, right: 12, width: 24, height: 24, borderRadius: 8, fontSize: 11,
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      >
        {index + 1}
      </div>

      {isVeg ? (
        <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
          <VegMark size={36} border={3} />
          <h3 className="font-serif font-bold text-white mt-3" style={{ fontSize: 'clamp(0.9rem,1.6vw,1.05rem)' }}>{f.title}</h3>
          <p className="text-white/80 mt-1" style={{ fontSize: 'clamp(0.72rem,1.2vw,0.8rem)' }}>{f.desc}</p>
        </div>
      ) : (
        <div className="relative h-full flex flex-col justify-end p-4">
          <h3 className="font-serif font-bold text-white leading-tight" style={{ fontSize: 'clamp(0.95rem,1.6vw,1.1rem)' }}>{f.title}</h3>
          <p className="text-white/80 mt-1.5 leading-snug" style={{ fontSize: 'clamp(0.72rem,1.2vw,0.8rem)' }}>{f.desc}</p>
        </div>
      )}
    </div>
  );
}

function FeaturesSection() {
  const ref = useReveal();
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / (el.scrollWidth / FEATURES.length));
      setActive(Math.min(FEATURES.length - 1, Math.max(0, idx)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * (el.scrollWidth / FEATURES.length), behavior: 'smooth' });
  };

  return (
    <section id="features" className="py-12 md:py-20 bg-cream overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="reveal text-center mb-8 md:mb-14">
          <div className="section-eyebrow justify-center">Why Choose Us</div>
          <h2 className="section-title">Crafted Through Generations</h2>
        </div>

        {/* Warm gradient panel that hosts every card — ties the four
            different product photos + the veg panel into one cohesive
            surface instead of four disconnected rectangles. */}
        <div
          className="rounded-3xl p-4 md:p-6"
          style={{ background: 'linear-gradient(135deg, #FDEDD0, #F5D497)' }}
        >
          {/* Mobile (<640px): horizontal snap-scroll carousel */}
          <div className="sm:hidden -mx-1 px-1">
            <div
              ref={trackRef}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1"
              style={{ scrollbarWidth: 'none' }}
            >
              {FEATURES.map((f, i) => (
                <motion.div key={f.title}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.45 }} viewport={{ once: true }}
                  className="snap-center shrink-0"
                  style={{ width: '76%', aspectRatio: '3/4' }}
                >
                  <GlassFeatureCard f={f} index={i} className="h-full" />
                </motion.div>
              ))}
            </div>
            <div className="flex justify-center gap-1.5 mt-4">
              {FEATURES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to feature ${i + 1}`}
                  onClick={() => scrollTo(i)}
                  className="rounded-full transition-all"
                  style={{ width: active === i ? 20 : 6, height: 6, background: active === i ? '#e07000' : 'rgba(43,22,0,0.25)' }}
                />
              ))}
            </div>
          </div>

          {/* Tablet/desktop (>=640px): 4-up grid inside the gradient panel */}
          <div className="hidden sm:grid grid-cols-4 gap-4 md:gap-5" style={{ gridAutoRows: '230px' }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
              >
                <GlassFeatureCard f={f} index={i} className="h-full" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Shipping partner "tape" — unchanged from the original ──
function ShippingPartnerTape() {
  return (
    <div className="w-full py-10 md:py-14" style={{ background: 'linear-gradient(135deg,#fff8ec,#fdf0d6)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative"
          style={{ transform: 'rotate(1deg)' }}
        >
          <div
            className="absolute z-10"
            style={{
              top: -14, left: '50%', transform: 'translateX(-50%) rotate(-2deg)',
              width: 'clamp(90px,18vw,140px)', height: 26,
              background: 'rgba(224,112,0,0.35)',
              boxShadow: '0 2px 6px rgba(45,26,0,0.12)',
              borderRadius: 3,
            }}
          />
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-7 text-center px-6 sm:px-12 pt-8 pb-10 md:pt-10 md:pb-14"
            style={{
              background: '#fff',
              boxShadow: '0 12px 36px rgba(45,26,0,0.12)',
              clipPath:
                'polygon(0 0,100% 0,100% 88%,95% 100%,90% 88%,85% 100%,80% 88%,75% 100%,70% 88%,65% 100%,60% 88%,55% 100%,50% 88%,45% 100%,40% 88%,35% 100%,30% 88%,25% 100%,20% 88%,15% 100%,10% 88%,5% 100%,0 88%)',
            }}
          >
            <span
              className="font-serif font-bold text-brown-dark leading-snug"
              style={{ fontSize: 'clamp(1.1rem,2.8vw,1.6rem)' }}
            >
              Proudly shipped with <span style={{ color: '#e07000' }}>Shadowfax 360</span>
            </span>
            <img
              src="/shadowfax-logo.webp"
              alt="Shadowfax"
              style={{ height: 44 }}
              className="md:h-[64px] w-auto flex-shrink-0"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Stats band — unchanged from the original ──
function StatsSection() {
  const ref = useReveal();
  const STATS = [
    { value: '150+', label: 'Years of Legacy' },
    { value: '10K+', label: 'Happy Customers' },
    { value: '100%', label: 'Vegetarian' },
  ];
  return (
    <section className="py-10 md:py-16" style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300)' }}>
      <div ref={ref} className="reveal max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap justify-center gap-12 md:gap-28 lg:gap-36 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-serif font-black text-white mb-1" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)' }}>{s.value}</div>
              <div className="text-saffron-light font-semibold tracking-wide" style={{ fontSize: 'clamp(0.7rem,1.5vw,0.875rem)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Corporate Gifting CTA — unchanged from the original ──
function CTASection() {
  return (
    <section className="py-14 md:py-20 bg-cream-mid text-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-4xl md:text-5xl mb-3 md:mb-4">🎁</div>
        <h2 className="section-title mb-2 md:mb-3">Corporate Gifting</h2>
        <p className="text-brown-mid/70 mb-6 md:mb-8 leading-relaxed" style={{ fontSize: 'clamp(0.85rem,1.8vw,1rem)' }}>
          Looking for premium Maharashtrian snacks for Diwali, weddings, or corporate events? We offer custom gift hampers in bulk.
        </p>
        <a href="https://wa.me/919130160491" target="_blank" rel="noreferrer"
          className="inline-block px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold text-white transition-all hover:-translate-y-0.5 w-full sm:w-auto"
          style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.3)', fontSize: 'clamp(0.85rem,1.8vw,1rem)', minHeight: 48 }}>
          💬 WhatsApp Us for Bulk Orders
        </a>
      </div>
    </section>
  );
}

// ── "Follow Us" banner — unchanged from the original ──
const INSTAGRAM_URL = 'https://www.instagram.com/namdevchiwda?igsh=aGJoeDE3eDhpOXRx';
const FACEBOOK_URL = 'https://www.facebook.com/share/19AojeQWs4/';
function FollowUsBanner() {
  const ref = useReveal();
  return (
    <section className="py-10 md:py-16 bg-cream">
      <div ref={ref} className="reveal max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            height: 'clamp(180px,32vw,220px)',
            boxShadow: '0 16px 40px rgba(45,26,0,0.25)',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg,#3a1c08 45%,#7a3300 100%)' }} />
          <img
            src="https://res.cloudinary.com/dz7ykg6qr/image/upload/v1776256647/special1_sy4zxa.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none select-none"
            style={{ right: -20, bottom: -30, width: 'clamp(120px,26vw,180px)', opacity: 0.3 }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              clipPath: 'polygon(0 0,55% 0,40% 100%,0 100%)',
              background: 'linear-gradient(160deg,#f58529,#dd2a7b 55%,#8134af)',
            }}
          />
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Namdev Chiwda on Instagram"
            className="absolute left-0 top-0 bottom-0 flex flex-col justify-center text-white transition-opacity hover:opacity-90"
            style={{ width: '46%', paddingLeft: 'clamp(16px,4vw,26px)' }}
          >
            <img src="https://cdn.simpleicons.org/instagram/FFFFFF" alt="" width={26} height={26} loading="lazy" decoding="async" style={{ marginBottom: 10 }} />
            <span className="font-bold" style={{ fontSize: 'clamp(0.82rem,2.2vw,0.95rem)' }}>@namdevchiwda</span>
            <span className="opacity-85 mt-1" style={{ fontSize: 'clamp(0.62rem,1.6vw,0.7rem)' }}>Tap to follow →</span>
          </a>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Like Namdev Chiwda on Facebook"
            className="absolute right-0 top-0 bottom-0 flex flex-col justify-center items-end text-right text-white transition-opacity hover:opacity-90"
            style={{ width: '46%', paddingRight: 'clamp(16px,4vw,26px)' }}
          >
            <img src="https://cdn.simpleicons.org/facebook/FFFFFF" alt="" width={26} height={26} loading="lazy" decoding="async" style={{ marginBottom: 10 }} />
            <span className="font-bold" style={{ fontSize: 'clamp(0.82rem,2.2vw,0.95rem)' }}>Namdev Chiwda</span>
            <span className="opacity-85 mt-1" style={{ fontSize: 'clamp(0.62rem,1.6vw,0.7rem)' }}>← Tap to like</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <PageWrapper>
      <HeroExperience />
      <MarqueeSection />
      <FeaturesSection />
      <ShippingPartnerTape />
      <NamkeenSection />
      <StatsSection />
      <HeritageTimeline />
      <TestimonialsCarousel />
      <CTASection />
      <FollowUsBanner />
      <DistributorshipBand />
      <StickyShopBar />
    </PageWrapper>
  );
}

// ── Marquee — unchanged from the original ──
function MarqueeSection() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden py-3 md:py-4" style={{ background: 'linear-gradient(135deg,#e07000,#c05a00)' }}>
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