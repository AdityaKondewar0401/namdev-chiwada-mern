import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useReveal from '../hooks/useReveal';
import PageWrapper from '../components/PageWrapper';
import NamkeenSection from '../components/NamkeenSection';
import SEO from '../components/SEO';
import { buildOrganizationSchema, buildWebsiteSchema } from '../utils/structuredData';
import { SITE_NAME } from '../config/seo.config';

// ── New / redesigned homepage sections ──
import HeroExperience from '../components/HeroExperience';
import HeritageTimeline from '../components/HeritageTimeline';
import TestimonialsCarousel from '../components/TestimonialsCarousel';
import DistributorshipBand from '../components/DistributorshipBand';
import StickyShopBar from '../components/StickyShopBar';

const MARQUEE_ITEMS = [
  'Dagdi-Poha Chiwda',
  'Maka Chiwda',
  'Bakarwadi',
  'Lasun Sev',
  'Shengdana Chutney',
  'Special Farsan',
  'Authentic Taste',
];

// ============================================================================
// FEATURES SECTION — "Glassmorphic layered cards"
// ============================================================================

const FEATURES = [
  {
    icon: '🔥',
    image: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1786263602/an-assortment-of-whole-spices-arranged-in-harmonious-chaos-photo_oyphny.jpg',
    title: 'Perfectly Roasted Blend',
    desc: 'Each batch of Namdev Chiwda is roasted and blended in Solapur for that signature crunch.',
  },
  {
    icon: '🏅',
    image: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1786263603/ChatGPT_Image_Jul_19_2026_05_26_04_PM_tfdhil.png',
    title: '150 Years of Craft',
    desc: 'A recipe passed down through six generations of the Namdev family.',
  },
  {
    icon: '🚚',
    image: 'https://res.cloudinary.com/dz7ykg6qr/image/upload/v1786263981/1777361411288-SF360_prmfr9.jpg',
    title: 'Pan-Maharashtra Delivery',
    desc: 'Fresh-packed and delivered across Maharashtra via Shadowfax, fast and reliable.',
  },
  {
    icon: 'VEG_MARK',
    title: '100% Vegetarian',
    desc: 'No artificial colors, preservatives or additives. Ever.',
  },
];

// India's mandatory FSSAI "green dot" vegetarian mark
function VegMark({ size = 22, border = 3 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `${border}px solid #fff`,
        borderRadius: Math.max(4, size * 0.16),
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '58%',
          height: '58%',
          borderRadius: '50%',
          background: '#2F6B1B',
        }}
      />
    </div>
  );
}

// One glass card — photo or vegetarian panel
function GlassFeatureCard({
  f,
  index,
  className = '',
  style = {},
}) {
  const isVeg = f.icon === 'VEG_MARK';

  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        boxShadow: '0 8px 24px rgba(45,26,0,0.12)',
        ...style,
      }}
    >
      <div className="absolute inset-0">
        {isVeg ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                'linear-gradient(150deg, rgba(63,122,40,0.9), rgba(27,61,16,0.95))',
            }}
          >
            <VegMark size={36} border={3} />
          </div>
        ) : (
          <img
            src={f.image}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </div>

      {/* Frosted icon plate */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: 8,
          left: 8,
          width: 26,
          height: 26,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.28)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.35)',
          fontSize: 13,
        }}
      >
        {isVeg ? '🌿' : f.icon}
      </div>

      {/* Frosted number plate */}
      <div
        className="absolute flex items-center justify-center font-bold text-white"
        style={{
          top: 8,
          right: 8,
          width: 20,
          height: 20,
          borderRadius: 6,
          fontSize: 10,
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      >
        {index + 1}
      </div>
    </div>
  );
}

function FeaturesSection() {
  const ref = useReveal();
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  // Update active mobile carousel item based on the actual card positions.
  useEffect(() => {
    const el = trackRef.current;

    if (!el) return;

    const updateActive = () => {
      const cards = Array.from(el.children);

      if (!cards.length) return;

      const scrollLeft = el.scrollLeft;
      let closestIndex = 0;
      let closestDistance = Infinity;

      cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft - scrollLeft);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActive(closestIndex);
    };

    el.addEventListener('scroll', updateActive, {
      passive: true,
    });

    updateActive();

    return () => {
      el.removeEventListener('scroll', updateActive);
    };
  }, []);

  const scrollTo = (index) => {
    const el = trackRef.current;

    if (!el) return;

    const cards = Array.from(el.children);
    const target = cards[index];

    if (!target) return;

    el.scrollTo({
      left: target.offsetLeft,
      behavior: 'smooth',
    });
  };

  return (
    <section
      id="features"
      className="py-6 md:py-12 bg-cream overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          ref={ref}
          className="reveal text-center mb-4 md:mb-8"
        >
          <div className="section-eyebrow justify-center">
            Why Choose Us
          </div>

          <h2 className="section-title">
            Crafted Through Generations
          </h2>
        </div>

        {/* Warm gradient panel */}
        <div
          className="rounded-2xl md:rounded-3xl p-2.5 md:p-4"
          style={{
            background:
              'linear-gradient(135deg, #FDEDD0, #F5D497)',
          }}
        >
          {/* Mobile carousel */}
          <div className="sm:hidden -mx-1 px-1">
            <div
              ref={trackRef}
              className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1"
              style={{
                scrollbarWidth: 'none',
                // FIX: touch-action: pan-x does NOT chain a vertical swipe
                // to the page — it just disables the browser's vertical-pan
                // handling entirely for the gesture, so the touch went
                // nowhere. 'auto' lets the browser attempt the vertical pan
                // here first; since overflowY: hidden below guarantees this
                // element has zero vertical scroll room, native
                // scroll-chaining hands it straight to the page. Horizontal
                // swipes still scroll this row (overflow-x-auto + snap).
                touchAction: 'auto',
                overflowY: 'hidden',
              }}
            >
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{
                    opacity: 0,
                    y: 16,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.45,
                  }}
                  viewport={{
                    once: true,
                  }}
                  className="snap-center shrink-0"
                  style={{
                    width: '100%',
                  }}
                >
                  <GlassFeatureCard
                    f={f}
                    index={i}
                    className="w-full"
                    style={{
                      aspectRatio: '4/3',
                    }}
                  />

                  <h3
                    className="font-serif font-bold text-brown-dark text-center mt-1.5"
                    style={{
                      fontSize: '0.82rem',
                      lineHeight: 1.25,
                    }}
                  >
                    {f.title}
                  </h3>
                </motion.div>
              ))}
            </div>

            {/* Carousel indicators */}
            <div className="flex justify-center gap-1.5 mt-2.5">
              {FEATURES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to feature ${i + 1}`}
                  aria-current={active === i ? 'true' : 'false'}
                  onClick={() => scrollTo(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: active === i ? 18 : 5,
                    height: 5,
                    background:
                      active === i
                        ? '#e07000'
                        : 'rgba(43,22,0,0.25)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Tablet / desktop grid */}
          <div className="hidden sm:grid grid-cols-4 gap-4 md:gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: i * 0.1,
                  duration: 0.5,
                }}
                viewport={{
                  once: true,
                }}
              >
                <GlassFeatureCard
                  f={f}
                  index={i}
                  className="w-full"
                  style={{
                    height: 220,
                  }}
                />

                <h3
                  className="font-serif font-bold text-brown-dark text-center mt-3"
                  style={{
                    fontSize:
                      'clamp(0.95rem,1.5vw,1.15rem)',
                  }}
                >
                  {f.title}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Shipping partner tape ──
function ShippingPartnerTape() {
  return (
    <div
      className="w-full py-6 md:py-14"
      style={{
        background:
          'linear-gradient(135deg,#fff8ec,#fdf0d6)',
      }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.5,
          }}
          className="relative"
          style={{
            transform: 'rotate(1deg)',
          }}
        >
          <div
            className="absolute z-10"
            style={{
              top: -14,
              left: '50%',
              transform:
                'translateX(-50%) rotate(-2deg)',
              width: 'clamp(90px,18vw,140px)',
              height: 26,
              background:
                'rgba(224,112,0,0.35)',
              boxShadow:
                '0 2px 6px rgba(45,26,0,0.12)',
              borderRadius: 3,
            }}
          />

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-7 text-center px-6 sm:px-12 pt-6 pb-8 md:pt-10 md:pb-14"
            style={{
              background: '#fff',
              boxShadow:
                '0 12px 36px rgba(45,26,0,0.12)',
              clipPath:
                'polygon(0 0,100% 0,100% 88%,95% 100%,90% 88%,85% 100%,80% 88%,75% 100%,70% 88%,65% 100%,60% 88%,55% 100%,50% 88%,45% 100%,40% 88%,35% 100%,30% 88%,25% 100%,20% 88%,15% 100%,10% 88%,5% 100%,0 88%)',
            }}
          >
            <span
              className="font-serif font-bold text-brown-dark leading-snug"
              style={{
                fontSize:
                  'clamp(1.1rem,2.8vw,1.6rem)',
              }}
            >
              Proudly shipped with{' '}
              <span style={{ color: '#e07000' }}>
                Shadowfax 360
              </span>
            </span>

            <img
              src="/shadowfax-logo.webp"
              alt="Shadowfax"
              style={{
                height: 40,
              }}
              className="md:h-[64px] w-auto flex-shrink-0"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Stats band ──
function StatsSection() {
  const ref = useReveal();

  const STATS = [
    {
      value: '150+',
      label: 'Years of Legacy',
    },
    {
      value: '100K+',
      label: 'Happy Customers',
    },
    {
      value: '100%',
      label: 'Vegetarian',
    },
  ];

  return (
    <section
      className="py-7 md:py-16"
      style={{
        background:
          'linear-gradient(135deg,#3d1c00,#7a3300)',
      }}
    >
      <div
        ref={ref}
        className="reveal max-w-6xl mx-auto px-4 sm:px-6"
      >
        <div className="flex flex-wrap justify-center gap-8 sm:gap-12 md:gap-28 lg:gap-36 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div
                className="font-serif font-black text-white mb-1"
                style={{
                  fontSize:
                    'clamp(1.6rem,4vw,3rem)',
                }}
              >
                {s.value}
              </div>

              <div
                className="text-saffron-light font-semibold tracking-wide"
                style={{
                  fontSize:
                    'clamp(0.68rem,1.5vw,0.875rem)',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Corporate Gifting CTA ──
function CTASection() {
  return (
    <section className="py-9 md:py-20 bg-cream-mid text-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-3xl md:text-5xl mb-2 md:mb-4">
          🎁
        </div>

        <h2 className="section-title mb-2 md:mb-3">
          Corporate Gifting
        </h2>

        <p
          className="text-brown-mid/70 mb-5 md:mb-8 leading-relaxed"
          style={{
            fontSize:
              'clamp(0.85rem,1.8vw,1rem)',
          }}
        >
          Looking for premium Maharashtrian snacks for
          Diwali, weddings, or corporate events? We offer
          custom gift hampers in bulk.
        </p>

        <a
          href="https://wa.me/919130160491"
          target="_blank"
          rel="noreferrer"
          className="inline-block px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold text-white transition-all hover:-translate-y-0.5 w-full sm:w-auto"
          style={{
            background: '#25D366',
            boxShadow:
              '0 4px 20px rgba(37,211,102,0.3)',
            fontSize:
              'clamp(0.85rem,1.8vw,1rem)',
            minHeight: 48,
          }}
        >
          💬 WhatsApp Us for Bulk Orders
        </a>
      </div>
    </section>
  );
}

// ── Follow Us banner ──
const INSTAGRAM_URL =
  'https://www.instagram.com/namdevchiwda?igsh=aGJoeDE3eDhpOXRx';

const FACEBOOK_URL =
  'https://www.facebook.com/share/19AojeQWs4/';

function FollowUsBanner() {
  const ref = useReveal();

  return (
    <section className="py-7 md:py-16 bg-cream">
      <div
        ref={ref}
        className="reveal max-w-3xl mx-auto px-4 sm:px-6"
      >
        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.5,
          }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            height:
              'clamp(150px,30vw,220px)',
            boxShadow:
              '0 16px 40px rgba(45,26,0,0.25)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(120deg,#3a1c08 45%,#7a3300 100%)',
            }}
          />

          <img
            src="https://res.cloudinary.com/dz7ykg6qr/image/upload/v1776256647/special1_sy4zxa.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none select-none"
            style={{
              right: -20,
              bottom: -30,
              width:
                'clamp(100px,24vw,180px)',
              opacity: 0.3,
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              clipPath:
                'polygon(0 0,55% 0,40% 100%,0 100%)',
              background:
                'linear-gradient(160deg,#f58529,#dd2a7b 55%,#8134af)',
            }}
          />

          {/* Instagram */}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Namdev Chiwda on Instagram"
            className="absolute left-0 top-0 bottom-0 flex flex-col justify-center text-white transition-opacity hover:opacity-90"
            style={{
              width: '46%',
              paddingLeft:
                'clamp(14px,4vw,26px)',
            }}
          >
            <img
              src="https://cdn.simpleicons.org/instagram/FFFFFF"
              alt=""
              width={24}
              height={24}
              loading="lazy"
              decoding="async"
              style={{
                marginBottom: 8,
              }}
            />

            <span
              className="font-bold"
              style={{
                fontSize:
                  'clamp(0.78rem,2.2vw,0.95rem)',
              }}
            >
              @namdevchiwda
            </span>

            <span
              className="opacity-85 mt-1"
              style={{
                fontSize:
                  'clamp(0.6rem,1.6vw,0.7rem)',
              }}
            >
              Tap to follow →
            </span>
          </a>

          {/* Facebook */}
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Like Namdev Chiwda on Facebook"
            className="absolute right-0 top-0 bottom-0 flex flex-col justify-center items-end text-right text-white transition-opacity hover:opacity-90"
            style={{
              width: '46%',
              paddingRight:
                'clamp(14px,4vw,26px)',
            }}
          >
            <img
              src="https://cdn.simpleicons.org/facebook/FFFFFF"
              alt=""
              width={24}
              height={24}
              loading="lazy"
              decoding="async"
              style={{
                marginBottom: 8,
              }}
            />

            <span
              className="font-bold"
              style={{
                fontSize:
                  'clamp(0.78rem,2.2vw,0.95rem)',
              }}
            >
              Namdev Chiwda
            </span>

            <span
              className="opacity-85 mt-1"
              style={{
                fontSize:
                  'clamp(0.6rem,1.6vw,0.7rem)',
              }}
            >
              ← Tap to like
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// HOME PAGE
// ============================================================================

// Small, understated internal-linking band — helps both visitors and
// search engines discover the SEO landing pages and product catalog from
// the homepage (Step 14 of the SEO plan). Deliberately minimal: a single
// row of pill links reusing the existing saffron/cream palette, not a new
// visual section.
const EXPLORE_LINKS = [
  { label: 'Chiwada', to: '/chiwada' },
  { label: 'Solapuri Chiwada', to: '/solapuri-chiwada' },
  { label: 'Maharashtrian Snacks', to: '/maharashtrian-snacks' },
  { label: 'All Products', to: '/products' },
  { label: 'Our Story', to: '/our-history' },
];

function ExploreMoreLinks() {
  const ref = useReveal();
  return (
    <section className="py-8 md:py-10 bg-cream">
      <div ref={ref} className="reveal max-w-4xl mx-auto px-5 sm:px-6 text-center">
        <div className="text-xs font-bold tracking-widest uppercase text-brown-mid/40 mb-4">
          Explore {SITE_NAME}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {EXPLORE_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-brown-dark bg-white border border-saffron/15 hover:border-saffron hover:text-saffron transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <PageWrapper>
      <SEO
        title={`${SITE_NAME} | Authentic Solapuri Chiwda Since 1873`}
        description={`${SITE_NAME} — authentic Solapuri Chiwda and traditional Maharashtrian snacks, crafted in Solapur since 1873. Order online and get fresh delivery across Maharashtra.`}
        canonical="/"
        jsonLd={[buildOrganizationSchema(), buildWebsiteSchema()]}
      />

      <HeroExperience />

      <MarqueeSection />

      <FeaturesSection />

      <ShippingPartnerTape />

      <NamkeenSection />

      <StatsSection />

      <HeritageTimeline />

      <TestimonialsCarousel />

      <CTASection />

      <ExploreMoreLinks />

      <FollowUsBanner />

      <DistributorshipBand />

      <StickyShopBar />
    </PageWrapper>
  );
}

// ── Marquee ──
function MarqueeSection() {
  const doubled = [
    ...MARQUEE_ITEMS,
    ...MARQUEE_ITEMS,
  ];

  return (
    <div
      className="overflow-hidden py-3 md:py-4"
      style={{
        background:
          'linear-gradient(135deg,#e07000,#c05a00)',
      }}
    >
      <div
        className="marquee-track flex gap-0 whitespace-nowrap"
        style={{
          width: 'max-content',
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center gap-2 md:gap-3 text-white font-semibold text-xs md:text-sm px-4 md:px-6"
          >
            {item}

            <span className="text-white/40 text-xs">
              ◆
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}