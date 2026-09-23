import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO';
import { buildFAQSchema } from '../../utils/structuredData';
import { SITE_NAME } from '../../config/seo.config';
import { b2bAPI } from '../../services/api';

// Public, indexable landing page (spec §8.3). Every fact below is real
// and already stated elsewhere on this site (Footer, AboutPage,
// OurHistoryPage) — nothing here is invented. Delivery-region text is
// fetched from GET /api/b2b/config (now public — see routes/b2b.js),
// never hardcoded, so it stays correct if B2B_ALLOWED_STATE_CODES ever
// changes.

const WHY_POINTS = [
  { icon: '🏺', title: 'Since 1873', text: 'Six generations of the same family recipe, started by our founder Bappa in Solapur.' },
  { icon: '📍', title: 'Made in Solapur', text: 'The same hand-ground masala and slow-roasting method, unchanged since 1873.' },
  { icon: '✅', title: 'FSSAI-licensed', text: 'Every batch made in a licensed kitchen. Lic. No: 21526041003460.' },
  { icon: '🥨', title: 'A focused range', text: 'Namdev Chiwda and Bakarwadi, made well rather than made wide.' },
];

const HOW_STEPS = [
  { num: '01', title: 'Apply', text: 'Tell us about your business — a couple of minutes, no documents needed upfront.' },
  { num: '02', title: 'Get approved', text: 'Our team reviews your application and sets up your wholesale pricing.' },
  { num: '03', title: 'Order', text: 'Place bulk orders by the case at your wholesale price, any time.' },
  { num: '04', title: 'Get your invoice', text: 'Every order comes with a clear invoice — no GST, no hidden lines.' },
];

const FAQS = [
  { question: 'Who can apply for a wholesale account?', answer: 'Retailers, sweet shops, distributors, supermarkets, caterers, and other businesses that want to stock or resell Namdev Chiwda products.' },
  { question: 'Is there a minimum order?', answer: 'Yes — wholesale orders have a minimum order value and are placed by the case, not individual packs. Exact minimums are shown once your account is approved.' },
  { question: 'Do you charge GST on wholesale orders?', answer: 'No. We are not currently registered under GST, so no GST is added to your invoice — the price you see is the final price.' },
  { question: 'How long does approval take?', answer: 'We review every application personally. Once approved, you can see wholesale pricing and place your first order right away.' },
];

export default function BusinessLandingPage() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    b2bAPI.getConfig().then((res) => setConfig(res.data.config)).catch(() => {});
  }, []);

  const deliveryText = config?.allowedStateNames?.length
    ? config.allowedStateNames.join(', ')
    : null;

  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title={`Wholesale &amp; Bulk Orders | ${SITE_NAME}`}
        description="Apply for a Namdev Chiwda wholesale account. Bulk pricing on our Solapur chiwda and bakarwadi for retailers, distributors, and caterers, since 1873."
        canonical="/business"
        // Belt-and-braces alongside the sitemap omission (Part B1): this
        // page only ever renders for a non-admin when B2B is live at
        // RUNTIME (B2BFeatureGate checks /config), but a build where B2B
        // was never turned on at build time shouldn't advertise it as
        // indexable either, in case it's ever reached some other way.
        robots={import.meta.env.VITE_B2B_ENABLED === 'true' ? 'index,follow' : 'noindex,nofollow'}
        jsonLd={buildFAQSchema(FAQS)}
      />

      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-14 px-4 sm:pt-16 sm:pb-20" style={{ background: 'linear-gradient(180deg,#fff0d6,#fef3e0)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="section-eyebrow justify-center">For Businesses</span>
            <h1 className="section-title mt-2" style={{ fontSize: 'clamp(1.75rem,6vw,3rem)' }}>
              Bring Namdev Chiwda to your shelves
            </h1>
            <p className="mt-4 text-brown-mid text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Wholesale pricing on the same chiwda and bakarwadi we've made since 1873 — for retailers,
              distributors, sweet shops, supermarkets, and caterers.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <Link to="/business/apply" className="btn-saffron text-center" style={{ minHeight: 48 }}>
                Apply for a wholesale account
              </Link>
              <a href="https://wa.me/919130160491" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 rounded-full font-semibold text-brown-dark border-2 border-saffron/25 bg-white/60 transition-colors hover:bg-white"
                style={{ minHeight: 48 }}>
                Ask us on WhatsApp
              </a>
            </div>
            <p className="mt-5 text-xs sm:text-sm text-brown-mid/70">
              {deliveryText
                ? `Currently delivering wholesale orders to ${deliveryText}.`
                : 'Delivery region details are shown after you apply.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why partner with us */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title text-center" style={{ fontSize: 'clamp(1.4rem,4vw,2rem)' }}>
            Why businesses partner with us
          </h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY_POINTS.map((p) => (
              <div key={p.title} className="card p-5 text-center">
                <div className="text-3xl mb-3" aria-hidden="true">{p.icon}</div>
                <div className="font-serif font-bold text-brown-dark text-base mb-1.5">{p.title}</div>
                <p className="text-brown-mid/70 text-sm leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16 px-4" style={{ background: '#fef3e0' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title text-center" style={{ fontSize: 'clamp(1.4rem,4vw,2rem)' }}>
            How it works
          </h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_STEPS.map((s) => (
              <div key={s.num} className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(224,112,0,0.1)' }}>
                <div className="font-serif font-black text-saffron text-2xl mb-2">{s.num}</div>
                <div className="font-bold text-brown-dark text-sm mb-1.5">{s.title}</div>
                <p className="text-brown-mid/70 text-sm leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="section-title text-center" style={{ fontSize: 'clamp(1.4rem,4vw,2rem)' }}>
            Frequently asked questions
          </h2>
          <div className="mt-8 flex flex-col gap-3">
            {FAQS.map((f) => (
              <div key={f.question} className="card p-5">
                <div className="font-bold text-brown-dark text-sm mb-1.5">{f.question}</div>
                <p className="text-brown-mid/70 text-sm leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-14 sm:py-16 px-4 text-center" style={{ background: 'linear-gradient(135deg,#23140a,#3d1c00 65%,#42210b)' }}>
        <h2 className="font-serif font-black text-white" style={{ fontSize: 'clamp(1.4rem,4vw,2rem)' }}>
          Ready to get started?
        </h2>
        <p className="mt-3 text-white/60 text-sm max-w-md mx-auto">
          Applying takes a couple of minutes. Our team reviews every application personally.
        </p>
        <Link to="/business/apply" className="btn-saffron inline-block mt-6" style={{ minHeight: 48 }}>
          Apply for a wholesale account
        </Link>
      </section>
    </div>
  );
}
