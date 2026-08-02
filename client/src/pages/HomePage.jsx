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

const FEATURES = [
  { icon: '🔥', title: 'Perfectly Roasted Blend', desc: 'Each batch is carefully roasted and blended for that signature Namdev crunch.' },
  { icon: '🏺', title: '150 Years of Craft', desc: 'A recipe passed down through six generations of the Namdev family.' },
  { icon: '🚚', title: 'Pan-India Delivery', desc: 'Fresh-packed and shipped within 24 hours of your order.' },
  { icon: '🌿', title: '100% Vegetarian', desc: 'No artificial colors, preservatives or additives. Ever.' },
];

const STATS = [
  { value: '150+', label: 'Years of Legacy' },
  { value: '10K+', label: 'Happy Customers' },
  { value: '100%', label: 'Vegetarian' },
];

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

// ── Features — same content, icons upgraded to circular badges (small polish) ──
function FeaturesSection() {
  const ref = useReveal();
  return (
    <section id="features" className="py-12 md:py-20 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="reveal text-center mb-8 md:mb-14">
          <div className="section-eyebrow justify-center">Why Choose Us</div>
          <h2 className="section-title">Crafted Through Generations</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
              className="bg-white rounded-xl md:rounded-xl2 p-4 md:p-6 shadow-saffron border border-saffron/5 text-center hover:-translate-y-1 transition-transform duration-300">
              {/* NEW: icon now sits in a circular gold-ring badge instead of a bare emoji */}
              <div
                className="mx-auto mb-3 md:mb-4 flex items-center justify-center"
                style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#fff0d6,#fdf3c8)', border: '1px solid rgba(212,175,55,0.3)' }}
              >
                <span className="text-xl md:text-2xl">{f.icon}</span>
              </div>
              <div className="font-serif font-bold text-brown-dark mb-1 md:mb-2 leading-tight"
                style={{ fontSize: 'clamp(0.78rem,1.8vw,1rem)' }}>{f.title}</div>
              <div className="text-brown-mid/70 leading-relaxed hidden sm:block"
                style={{ fontSize: 'clamp(0.72rem,1.5vw,0.875rem)' }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Shipping partner "tape" — NEW. A slim full-width strip (like a
//    ribbon of tape stuck across the page) calling out that every order
//    ships via Shadowfax, using their real logo from client/public/.
//    Sits right after the features grid (which already mentions
//    "Pan-India Delivery"), before the product listing. ──
function ShippingPartnerTape() {
  return (
    <div className="w-full py-3 md:py-4 bg-white border-y border-saffron/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-2 md:gap-3 flex-wrap text-center">
        <span className="text-brown-mid/70 font-medium" style={{ fontSize: 'clamp(0.72rem,1.6vw,0.9rem)' }}>
          Your order will be delivered by Shadowfax 360
        </span>
        <img
          src="/shadowfax-logo.webp"
          alt="Shadowfax"
          style={{ height: 20 }}
          className="md:h-6 w-auto"
          loading="lazy"
        />
      </div>
    </div>
  );
}

// ── Stats band — unchanged from the original ──
function StatsSection() {
  const ref = useReveal();
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

// ── Corporate Gifting CTA — unchanged content; kept distinct from the
//    new B2B DistributorshipBand below (this one is consumer bulk/gifting) ──
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

export default function HomePage() {
  return (
    <PageWrapper>
      {/* Hero — visible immediately, no scroll-fade. See HeroExperience.jsx */}
      <HeroExperience />

      <MarqueeSection />
      <FeaturesSection />

      {/* NEW: shipping/courier partner tape — see ShippingPartnerTape above */}
      <ShippingPartnerTape />

      {/* Existing API-backed featured products — data-fetching untouched */}
      <NamkeenSection />

      <StatsSection />

      {/* Heritage story — mobile now a vertical stepper instead of a
          cramped 5-column grid. See HeritageTimeline.jsx */}
      <HeritageTimeline />

      {/* Mobile: swipeable single-card carousel with dots.
          Desktop: original 3-column grid. See TestimonialsCarousel.jsx */}
      <TestimonialsCarousel />

      <CTASection />

      {/* NEW: distributorship/trade section — after story + products,
          right before the footer, visually distinct "trade" band. */}
      <DistributorshipBand />

      {/* NEW: mobile-only sticky "Shop Now" bar, offset clear of
          WhatsAppFloat (bottom-right). See StickyShopBar.jsx */}
      <StickyShopBar />
    </PageWrapper>
  );
}
