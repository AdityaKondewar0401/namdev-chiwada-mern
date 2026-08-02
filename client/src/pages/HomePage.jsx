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
  { icon: '🔥', image: '/features/roasted-blend.jpg', title: 'Perfectly Roasted Blend', desc: 'Each batch is carefully roasted and blended for that signature Namdev crunch.' },
  { icon: '🏺', image: '/features/heritage-craft.jpg', title: '150 Years of Craft', desc: 'A recipe passed down through six generations of the Namdev family.' },
  { icon: '🚚', image: '/features/maharashtra-delivery.jpg', title: 'Pan-Maharashtra Delivery', desc: 'Fresh-packed and delivered across Maharashtra via Shadowfax, fast and reliable.' },
  { icon: 'VEG_MARK', title: '100% Vegetarian', desc: 'No artificial colors, preservatives or additives. Ever.' },
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

// ── Features — "journey" redesign. Each feature is a numbered stop with a
//    real photo in a gold-ringed badge, joined by a soft dotted trail —
//    vertical on mobile, horizontal on tablet/desktop. Photo badges have an
//    emoji + gradient fallback sitting behind the <img>, so if an image
//    ever fails to load the badge still looks intentional instead of
//    showing a broken-image icon (same defensive pattern as the Shadowfax
//    tape's logo). ──
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

function FeatureBadge({ f, i, size = 56 }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative"
        style={{
          background: 'linear-gradient(135deg,#fff0d6,#fdf3c8)',
          boxShadow: '0 0 0 1.5px #d4af37, 0 4px 12px rgba(45,26,0,0.15)',
        }}
      >
        {f.icon === 'VEG_MARK' ? (
          // Vegetarian card shows only the official green-dot mark — no
          // product photo here by design (per explicit request), so
          // there's no <img> to fall back from.
          <VegMark size={size * 0.55} />
        ) : (
          <>
            <span className="absolute" style={{ fontSize: size * 0.4 }}>{f.icon}</span>
            <img
              src={f.image}
              alt={f.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </>
        )}
      </div>
      <div
        className="absolute -bottom-1 -right-1 rounded-full bg-[#e07000] text-white font-bold flex items-center justify-center border-2 border-cream"
        style={{ width: size * 0.34, height: size * 0.34, fontSize: size * 0.16 }}
      >
        {i + 1}
      </div>
    </div>
  );
}

function FeaturesSection() {
  const ref = useReveal();
  return (
    <section id="features" className="py-12 md:py-20 bg-cream overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="reveal text-center mb-10 md:mb-16">
          <div className="section-eyebrow justify-center">Why Choose Us</div>
          <h2 className="section-title">Crafted Through Generations</h2>
        </div>

        {/* Mobile (<640px): vertical stack of white "stop" cards, each one
            holding a bigger photo badge + title/desc, with a thin dotted
            gold trail running behind the stack so it still reads as a
            connected journey even though each stop now has its own card. */}
        <div className="relative flex flex-col gap-5 sm:hidden">
          <svg
            className="absolute left-12 w-4 pointer-events-none z-0"
            style={{ top: 8, bottom: 8, height: 'calc(100% - 16px)' }}
            viewBox="0 0 20 400" preserveAspectRatio="none"
          >
            <path d="M10 0 Q-6 66 10 132 Q26 198 10 264 Q-6 330 10 396"
              stroke="#d4af37" strokeWidth="1.5" fill="none" strokeDasharray="1 7" strokeLinecap="round" />
          </svg>
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.45 }} viewport={{ once: true }}
              className="relative z-10 flex items-center gap-4 bg-white rounded-2xl border border-saffron/10 p-4"
              style={{ boxShadow: '0 4px 16px rgba(45,26,0,0.08)' }}
            >
              <FeatureBadge f={f} i={i} size={64} />
              <div className="flex-1 min-w-0">
                <div className="font-serif font-bold text-brown-dark text-base leading-tight mb-1">{f.title}</div>
                <div className="text-brown-mid/70 text-sm leading-relaxed">{f.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tablet/desktop (≥640px): same idea, laid out as 4 white cards in
            a row. Badges are notably bigger here (96px) than the old bare
            circles so the photos actually read at a glance. The dotted
            trail sits behind the cards and only peeks through the gaps. */}
        <div className="hidden sm:block relative">
          <div
            className="absolute left-[6%] right-[6%] pointer-events-none z-0"
            style={{
              top: 72,
              height: 2,
              backgroundImage: 'repeating-linear-gradient(to right, #d4af37 0 6px, transparent 6px 12px)',
            }}
          />
          <div className="grid grid-cols-4 gap-4 md:gap-6 relative z-10">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
                className="flex flex-col items-center text-center bg-white rounded-2xl border border-saffron/10 p-5 md:p-6"
                style={{ boxShadow: '0 6px 20px rgba(45,26,0,0.08)' }}
              >
                <div className="mb-4">
                  <FeatureBadge f={f} i={i} size={96} />
                </div>
                <div className="font-serif font-bold text-brown-dark leading-tight mb-1.5"
                  style={{ fontSize: 'clamp(0.9rem,1.6vw,1.05rem)' }}>{f.title}</div>
                <div className="text-brown-mid/70 leading-relaxed"
                  style={{ fontSize: 'clamp(0.78rem,1.3vw,0.9rem)' }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
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
          
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Namdev Chiwda on Instagram"
            className="absolute left-0 top-0 bottom-0 flex flex-col justify-center text-white transition-opacity hover:opacity-90"
            style={{ width: '46%', paddingLeft: 'clamp(16px,4vw,26px)' }}
          >
            <img src="https://cdn.simpleicons.org/instagram/FFFFFF" alt="" width={26} height={26} loading="lazy" decoding="async" style={{ marginBottom: 10 }} />
            <span className="font-bold" style={{ fontSize: 'clamp(0.82rem,2.2vw,0.95rem)' }}>@namdevchiwda</span>
            <span className="opacity-85 mt-1" style={{ fontSize: 'clamp(0.62rem,1.6vw,0.7rem)' }}>Tap to follow →</span>
          </a>

          {/* Facebook half */}
          
            href={FACEBOOK_URL}
            target="_blank"
            rel="noreferrer"
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