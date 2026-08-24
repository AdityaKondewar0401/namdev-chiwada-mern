import { Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import { buildBreadcrumbSchema, buildFAQSchema } from '../utils/structuredData';

// client/src/pages/ChiwadaPage.jsx
//
// Public SEO landing page targeting the generic "Chiwada / Chiwda / Chivda"
// search intent (Step 5 of the SEO plan). This is deliberately written as a
// genuinely useful explainer page, not a thin doorway page — real content
// about what Chiwada is, its variations, and how Namdev Chiwada makes it,
// with links into the actual product catalog. All brand-history facts
// (1873, six generations) are the same true facts already used on
// AboutPage/HomePage — nothing here is invented.

const BREADCRUMB_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Chiwada', path: '/chiwada' },
];

const FAQS = [
  {
    question: 'What is Chiwada?',
    answer:
      'Chiwada (also spelled Chiwda or Chivda) is a savoury Indian snack mix, traditionally built on a base of flattened rice (poha) or other roasted grains, combined with peanuts, curry leaves, mustard seeds, spices, and a touch of sweetness. It is roasted or lightly fried, never soft or soggy, and is eaten on its own as a tea-time snack, packed for travel, or served during festivals.',
  },
  {
    question: 'Is Chiwada the same as Chivda or Chiwda?',
    answer:
      '"Chiwada", "Chiwda", and "Chivda" are simply different English spellings of the same Marathi word (चिवडा) for this snack. There is no difference in the product itself — it is a regional/transliteration variation, most common across Maharashtra.',
  },
  {
    question: 'What is the difference between Poha Chiwada and Corn Chiwada?',
    answer:
      'Poha Chiwada uses flattened rice as its base and has a lighter, crisper texture, while Corn Chiwada is made from roasted corn flakes and has a heartier crunch. Namdev Chiwada makes both — Namdev Chiwada (our signature poha-based blend) and Maka Chiwada (our corn-based, Kolhapuri-spiced version).',
  },
  {
    question: 'How long does Chiwada stay fresh?',
    answer:
      'Namdev Chiwada products are made in small batches without artificial preservatives, and typically stay fresh for 30–45 days when stored in a cool, dry place in an airtight container. Exact shelf life is printed on each product page and pack.',
  },
  {
    question: 'Do you deliver Chiwada across Maharashtra?',
    answer:
      'Yes. Namdev Chiwada ships from our Solapur warehouse across Maharashtra, with Cash on Delivery and online payment options available at checkout.',
  },
];

function FaqBlock() {
  return (
    <div className="space-y-3">
      {FAQS.map((f) => (
        <div
          key={f.question}
          className="card p-5 md:p-6"
        >
          <h3 className="font-serif font-bold text-brown-dark text-base md:text-lg mb-2">
            {f.question}
          </h3>
          <p className="text-brown-mid/70 text-sm leading-relaxed">{f.answer}</p>
        </div>
      ))}
    </div>
  );
}

export default function ChiwadaPage() {
  return (
    <PageWrapper>
      <SEO
        title="Chiwada / Chiwda | Authentic Maharashtrian Chiwada — Namdev Chiwada"
        description="What is Chiwada? Learn about this classic Maharashtrian savoury snack — its ingredients, regional variations like Solapuri Chiwada, and how Namdev Chiwada has made it since 1873."
        canonical="/chiwada"
        jsonLd={[buildBreadcrumbSchema(BREADCRUMB_ITEMS), buildFAQSchema(FAQS)]}
      />

      <div className="min-h-screen bg-cream">
        {/* Hero */}
        <div
          className="pt-16 pb-10 px-6 text-center"
          style={{ background: 'linear-gradient(135deg,#3d1c00 0%,#7a3300 60%,#e07000 100%)' }}
        >
          <div className="max-w-3xl mx-auto">
            <Breadcrumbs items={BREADCRUMB_ITEMS} dark className="justify-center mb-3" />
            <div className="text-xs font-bold tracking-widest uppercase text-saffron-light mb-3">
              The Classic Maharashtrian Snack
            </div>
            <h1
              className="font-serif font-black text-white mb-3"
              style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}
            >
              Chiwada — Maharashtra's Favourite Savoury Snack
            </h1>
            <p className="text-white/70 max-w-xl mx-auto">
              Crunchy, spiced, and endlessly snackable — here's what makes Chiwada (or Chiwda) a
              staple across Maharashtrian homes, and how Namdev Chiwada has made it since 1873.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-14">
          {/* What is Chiwada */}
          <section>
            <div className="section-eyebrow">What is it?</div>
            <h2 className="section-title mb-4">What is Chiwada?</h2>
            <p className="text-brown-mid/80 leading-relaxed mb-4">
              Chiwada (also written Chiwda or Chivda) is a savoury snack mix that has been part of
              Maharashtrian households for generations. At its base is usually flattened rice
              (poha) or roasted corn flakes, mixed with peanuts, curry leaves, mustard seeds, a
              touch of turmeric, and a carefully balanced blend of spices and mild sweetness. The
              result is light, crunchy, and never greasy — a snack meant to be eaten by the
              handful, whether during a tea break, a long train journey, or a festival gathering.
            </p>
            <p className="text-brown-mid/80 leading-relaxed">
              Unlike many packaged snacks, traditional Chiwada isn't fried into submission — it's
              roasted and tempered so the texture of each ingredient (the crisp poha, the crunch
              of peanuts, the pop of mustard seeds) stays distinct in every bite.
            </p>
          </section>

          {/* Types */}
          <section>
            <div className="section-eyebrow">Variations</div>
            <h2 className="section-title mb-4">Types of Chiwada We Make</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link to="/products/namdev-chiwada" className="card p-5 block hover:-translate-y-1">
                <div className="font-serif font-bold text-brown-dark text-lg mb-1">
                  Namdev Chiwada (Poha-Based)
                </div>
                <p className="text-brown-mid/70 text-sm leading-relaxed">
                  Our signature blend — slow-roasted flattened rice with pure ghee, curry leaves,
                  and hand-ground Solapur masala. The recipe we've made since 1873.
                </p>
              </Link>
              <Link to="/products/maka-chiwada" className="card p-5 block hover:-translate-y-1">
                <div className="font-serif font-bold text-brown-dark text-lg mb-1">
                  Maka Chiwada (Corn-Based)
                </div>
                <p className="text-brown-mid/70 text-sm leading-relaxed">
                  Crispy corn flakes chiwada spiced with bold Kolhapuri masala — a fiery,
                  heartier-crunch alternative for spice lovers.
                </p>
              </Link>
            </div>
          </section>

          {/* Heritage tie-in */}
          <section>
            <div className="section-eyebrow">Our Approach</div>
            <h2 className="section-title mb-4">How Namdev Chiwada Makes It</h2>
            <p className="text-brown-mid/80 leading-relaxed mb-4">
              Namdev Chiwada has been made in Solapur since 1873, when our founder Bappa began
              selling fresh chiwda door to door from a wooden box. Six generations later, the
              recipe, the roasting method, and the hand-ground masala have stayed the same — no
              artificial colours, no shortcuts.
            </p>
            <Link
              to="/our-history"
              className="text-saffron font-semibold text-sm hover:text-saffron-light underline underline-offset-2"
            >
              Read the full Namdev Chiwada story →
            </Link>
          </section>

          {/* FAQs */}
          <section>
            <div className="section-eyebrow">Common Questions</div>
            <h2 className="section-title mb-5">Chiwada — Frequently Asked Questions</h2>
            <FaqBlock />
          </section>

          {/* Internal links */}
          <section className="text-center pt-2">
            <p className="text-brown-mid/60 text-sm mb-4">
              Looking for something more specific?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/solapuri-chiwada" className="btn-outline !text-brown-dark !border-brown-dark/20 hover:!bg-cream-mid px-6 py-2.5 text-sm">
                Solapuri Chiwada
              </Link>
              <Link to="/maharashtrian-snacks" className="btn-outline !text-brown-dark !border-brown-dark/20 hover:!bg-cream-mid px-6 py-2.5 text-sm">
                Maharashtrian Snacks
              </Link>
              <Link to="/products" className="btn-saffron px-6 py-2.5 text-sm">
                Shop All Products →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </PageWrapper>
  );
}
