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

// NOTE: the old paths here ('/features/roasted-blend.jpg' etc.) pointed at
// files that don't exist in client/public — they 404'd, which is why the
// cards only ever showed the emoji fallback. Swapped in real shots that
// already ship in client/public/images. Feel free to swap these filenames
// for better-matched photography later — the layout doesn't care which
// image goes where.
const FEATURES = [
  { icon: '🔥', image: '/images/chiwada-1.jpg', title: 'Perfectly Roasted Blend' },
  { icon: '🏅', image: '/images/bakarwadi-2.jpg', title: '150 Years of Craft' },
  { icon: '🚚', image: '/images/maka-chiwada-1.jpg', title: 'Pan-Maharashtra Delivery' },
  { icon: 'VEG_MARK', title: '100% Vegetarian' },
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

// ── Features — "diagonal split" redesign (concept #3 from the design
//    review). Each card is a photo with a slanted bottom edge instead of a
//    straight rectangle; desktop alternates the slant direction card to
//    card for rhythm, mobile keeps one consistent direction so the list
//    reads cleanly top to bottom. A small round icon badge sits on the
//    photo (top-left) and a numbered badge marks the step (top-right on
//    desktop, bottom-right on mobile). ──

// India's mandatory FSSAI "green dot" vegetarian mark — a green-outlined
// square with a solid green filled circle inside. Drawn with plain divs
// (no external asset) so it renders instantly and never has a broken-image
// fallback problem of its own.
function VegMark({ size = 22 }) {
  return (
    <div
      style={{
        width: size, height: size,
        border: `${Math.max(1.5, size * 0.09)}px solid #027021`,
        borderRadius: Math.max(1, size * 0.06),
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '58%', height: '58%', borderRadius: '50%', background: '#027021' }} />
    </div>
  );
}

// Small round badge that sits on top of a feature's photo, top-left.
function FeatureIconBadge({ icon, size = 34 }) {
  return (
    <div
      className="absolute flex items-center justify-center rounded-full"
      style={{
        top: 10, left: 10, width: size, height: size,
        background: 'rgba(255,253,247,0.94)',
        boxShadow: '0 2px 8px rgba(45,26,0,0.18)',
        fontSize: size * 0.5, zIndex: 2,
      }}
    >
      {icon}
    </div>
  );
}

// Numbered step badge — positioned by the className passed in (top-3
// right-3 on desktop, bottom-3 right-3 on mobile).
function FeatureNumberBadge({ n, className = '' }) {
  return (
    <div
      className={`absolute flex items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{ width: 26, height: 26, fontSize: 12, background: '#e07000', boxShadow: '0 2px 6px rgba(45,26,0,0.28)', zIndex: 2 }}
    >
      {n}
    </div>
  );
}

// The diagonally-clipped photo layer itself. The vegetarian card has no
// photo by design (per explicit earlier request) — it gets a soft
// cream/gold panel with the official green-dot mark centered instead.
function FeatureDiagonalPhoto({ f, clipPath }) {
  const isVeg = f.icon === 'VEG_MARK';
  return (
    <div
      style={{
        position: 'absolute', inset: 0, clipPath,
        background: isVeg ? 'linear-gradient(135deg,#4a8a2e,#2d5a1b)' : 'linear-gradient(135deg,#f3c9a0,#d8763f)',
      }}
    >
      {isVeg ? (
        <div className="w-full h-full flex items-center justify-center"><VegMark size={44} /></div>
      ) : (
        <img
          src={f.image}
          alt={f.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
    </div>
  );
}

function FeaturesSection() {
  const ref = useReveal();
  return (
    <section id="features" className="py-12 md:py-20 bg-cream overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="reveal text-center mb-10 md:mb-14">
          <div className="section-eyebrow justify-center">Why Choose Us</div>
          <h2 className="section-title">Crafted Through Generations</h2>
        </div>

        {/* Mobile (<640px): one consistent diagonal-cut direction so the
            stacked list reads cleanly top to bottom. */}
        <div className="flex flex-col gap-4 sm:hidden">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.45 }} viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden bg-white border border-saffron/10"
              style={{ height: 108, boxShadow: '0 4px 16px rgba(45,26,0,0.08)' }}
            >
              <FeatureDiagonalPhoto f={f} clipPath="polygon(0 0, 58% 0, 44% 100%, 0 100%)" />
              <FeatureIconBadge icon={f.icon === 'VEG_MARK' ? '🌿' : f.icon} size={30} />
              <FeatureNumberBadge n={i + 1} className="bottom-3 right-3" />
              <div className="absolute flex flex-col justify-center" style={{ left: '52%', right: 14, top: 10, bottom: 10 }}>
                <div className="font-serif font-bold text-brown-dark text-sm leading-tight">{f.title}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tablet/desktop (≥640px): slant direction alternates card to
            card for visual rhythm across the row. */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden bg-white border border-saffron/10"
              style={{ height: 260, boxShadow: '0 6px 20px rgba(45,26,0,0.08)' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '64%' }}>
                <FeatureDiagonalPhoto
                  f={f}
                  clipPath={i % 2 === 0 ? 'polygon(0 0,100% 0,100% 78%,0 100%)' : 'polygon(0 0,100% 0,100% 100%,0 78%)'}
                />
              </div>
              <FeatureIconBadge icon={f.icon === 'VEG_MARK' ? '🌿' : f.icon} />
              <FeatureNumberBadge n={i + 1} className="top-3 right-3" />
              <div className="absolute left-4 right-4" style={{ bottom: 16 }}>
                <div className="font-serif font-bold text-brown-dark" style={{ fontSize: 'clamp(0.9rem,1.6vw,1.05rem)' }}>{f.title}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Shipping partner "tape" — designed to look like a torn slip of paper
//    taped down at the top, calling out that every order ships via
//    Shadowfax, using their real logo from client/public/. Sits right
//    after the features grid (which already mentions "Pan-India
//    Delivery"), before the product listing.
//
//    The jagged bottom edge is a CSS clip-path zigzag (percentage-based,
//    so it scales with the card's width at any viewport) and the "tape"
//    is just a small rotated rectangle positioned over the top edge.
//    Rotation is intentionally tiny (1deg) so it reads as a nice touch
//    rather than something crooked-looking on a phone.
//
//    The <img> has an onError fallback that hides itself instead of
//    showing a broken-image icon — belt-and-braces in case the logo file
//    ever fails to deploy for any reason; the text still reads fine on
//    its own either way. ──
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
          {/* Tape strip — sits centered over the top edge of the card */}
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

// ── "Follow Us" banner — a diagonal two-way split card: Instagram gradient
//    on the left, a warm brand-brown panel with a product photo bleeding
//    through on the right. Each half is its own full-height <a> so the
//    whole colored region is tappable, not just the icon/text. Deliberately
//    has no follower/like counts — those get stale fast and read as fake
//    if nobody's updating them; the CTA copy ("Tap to follow →") carries
//    the call-to-action instead.
//
//    Real handles: update INSTAGRAM_URL / FACEBOOK_URL here if the
//    business's profile links ever change — they're also duplicated in
//    Footer.jsx's SOCIALS array, so keep both in sync.
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
          {/* Base warm-brown backdrop + faded product photo, purely decorative */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg,#3a1c08 45%,#7a3300 100%)' }} />
          <img
            src="https://res.cloudinary.com/dz7ykg6qr/image/upload/v1776256647/special1_sy4zxa.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none select-none"
            style={{ right: -20, bottom: -30, width: 'clamp(120px,26vw,180px)', opacity: 0.3 }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          {/* Instagram-gradient diagonal panel, clipped to a slanted left wedge */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              clipPath: 'polygon(0 0,55% 0,40% 100%,0 100%)',
              background: 'linear-gradient(160deg,#f58529,#dd2a7b 55%,#8134af)',
            }}
          />

          {/* Instagram half */}
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

          {/* Facebook half */}
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

      {/* NEW: social follow-us banner — see FollowUsBanner above */}
      <FollowUsBanner />

      {/* NEW: distributorship/trade section — after story + products,
          right before the footer, visually distinct "trade" band. */}
      <DistributorshipBand />

      {/* NEW: mobile-only sticky "Shop Now" bar, offset clear of
          WhatsAppFloat (bottom-right). See StickyShopBar.jsx */}
      <StickyShopBar />
    </PageWrapper>
  );
}