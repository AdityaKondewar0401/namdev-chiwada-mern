import { Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import { buildBreadcrumbSchema, buildFAQSchema } from '../utils/structuredData';
import { SITE_NAME } from '../config/seo.config';

// client/src/pages/MaharashtrianSnacksPage.jsx
//
// Public SEO landing page targeting the "Maharashtrian snacks / Maharashtrian
// namkeen" category intent (Step 5 of the SEO plan). Positions Namdev
// Chiwada's actual product range (mild / spicy / special categories, as
// defined server-side in Product.category) within the broader category,
// with links into real products — not a fabricated catalog.

const BREADCRUMB_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Maharashtrian Snacks', path: '/maharashtrian-snacks' },
];

const FAQS = [
  {
    question: 'What are Maharashtrian snacks?',
    answer:
      'Maharashtrian snacks (often called namkeen) are savoury foods traditionally eaten as a tea-time bite, festival offering, or travel snack across Maharashtra. They typically combine roasted or fried grains, lentils, nuts, and spices — Chiwada, Bakarvadi, and Farsan are among the most well-known varieties.',
  },
  {
    question: 'What is the difference between Chiwada, Bakarvadi, and Farsan?',
    answer:
      'Chiwada is a poha- or corn-based savoury mix; Bakarvadi is a spiral fried pastry with a spiced coconut-sesame filling; Farsan is a broader term covering a range of Gujarati- and Maharashtrian-style fried snacks, including sev and other gram-flour based mixes. Namdev Chiwda makes all three.',
  },
  {
    question: 'Are Namdev Chiwda snacks vegetarian?',
    answer:
      'Yes, all Namdev Chiwda products are 100% vegetarian, made with no artificial colours.',
  },
  {
    question: 'Do you deliver Maharashtrian snacks outside Solapur?',
    answer:
      'Yes — we ship from our Solapur warehouse across Maharashtra, with Cash on Delivery and online payment available at checkout.',
  },
];

function FaqBlock() {
  return (
    <div className="space-y-3">
      {FAQS.map((f) => (
        <div key={f.question} className="card p-5 md:p-6">
          <h3 className="font-serif font-bold text-brown-dark text-base md:text-lg mb-2">
            {f.question}
          </h3>
          <p className="text-brown-mid/70 text-sm leading-relaxed">{f.answer}</p>
        </div>
      ))}
    </div>
  );
}

export default function MaharashtrianSnacksPage() {
  return (
    <PageWrapper>
      <SEO
        title={`Maharashtrian Snacks & Namkeen | ${SITE_NAME}`}
        description={`Shop authentic Maharashtrian snacks and namkeen from ${SITE_NAME} — Chiwada, Bakarvadi, and Farsan, made in Solapur since 1873 using traditional recipes and pure ingredients.`}
        canonical="/maharashtrian-snacks"
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
              Traditional Namkeen
            </div>
            <h1
              className="font-serif font-black text-white mb-3"
              style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}
            >
              Maharashtrian Snacks &amp; Namkeen
            </h1>
            <p className="text-white/70 max-w-xl mx-auto">
              Chiwada, Bakarvadi, and Farsan — the everyday snacks of Maharashtra, made by hand in
              Solapur since 1873.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-14">
          {/* What are they */}
          <section>
            <div className="section-eyebrow">The Category</div>
            <h2 className="section-title mb-4">What Are Maharashtrian Snacks?</h2>
            <p className="text-brown-mid/80 leading-relaxed">
              Maharashtrian snacks — commonly grouped under "namkeen" — are the savoury foods eaten
              across the state as a tea-time bite, a festival treat, or something to pack for a
              journey. They range from light, crunchy mixes like Chiwada to fried, spice-filled
              pastries like Bakarvadi, and gram-flour based mixes broadly known as Farsan. What
              connects them is a shared tradition of small-batch preparation, bold regional
              spicing, and recipes passed down within families and local snack-making businesses —
              much like Namdev Chiwda's own recipe, unchanged since 1873.
            </p>
          </section>

          {/* Categories */}
          <section>
            <div className="section-eyebrow">Our Range</div>
            <h2 className="section-title mb-4">What We Make</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link to="/chiwada" className="card p-5 block hover:-translate-y-1">
                <div className="font-serif font-bold text-brown-dark text-lg mb-1">Chiwada</div>
                <p className="text-brown-mid/70 text-sm leading-relaxed">
                  Poha- or corn-based roasted mixes — our signature Namdev Chiwda and spicy Maka
                  Chiwada.
                </p>
              </Link>
              <Link to="/products/bakarvadi" className="card p-5 block hover:-translate-y-1">
                <div className="font-serif font-bold text-brown-dark text-lg mb-1">Bakarvadi</div>
                <p className="text-brown-mid/70 text-sm leading-relaxed">
                  Spiral pastry rolls with a spiced coconut-sesame filling, fried to a golden
                  crisp.
                </p>
              </Link>
              <Link to="/products/special-farsan" className="card p-5 block hover:-translate-y-1">
                <div className="font-serif font-bold text-brown-dark text-lg mb-1">Farsan</div>
                <p className="text-brown-mid/70 text-sm leading-relaxed">
                  Our Special Farsan blend — a savoury gram-flour mix rounding out the traditional
                  Maharashtrian snack table.
                </p>
              </Link>
            </div>
          </section>

          {/* Namdev's role */}
          <section>
            <div className="section-eyebrow">Our Story</div>
            <h2 className="section-title mb-4">Namdev Chiwda in This Tradition</h2>
            <p className="text-brown-mid/80 leading-relaxed mb-4">
              Namdev Chiwda has been part of Solapur's snack-making tradition since 1873, when our
              founder Bappa began selling fresh chiwda from a wooden box. Six generations later, we
              still make our full namkeen range — Chiwada, Bakarvadi, and Farsan — using the same
              recipes, real ghee, and hand-ground spices, with no artificial colours.
            </p>
            <Link
              to="/our-history"
              className="text-saffron font-semibold text-sm hover:text-saffron-light underline underline-offset-2"
            >
              Read the full Namdev Chiwda story →
            </Link>
          </section>

          {/* FAQs */}
          <section>
            <div className="section-eyebrow">Common Questions</div>
            <h2 className="section-title mb-5">Maharashtrian Snacks — Frequently Asked Questions</h2>
            <FaqBlock />
          </section>

          {/* Internal links */}
          <section className="text-center pt-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/chiwada" className="btn-outline !text-brown-dark !border-brown-dark/20 hover:!bg-cream-mid px-6 py-2.5 text-sm">
                About Chiwada
              </Link>
              <Link to="/solapuri-chiwada" className="btn-outline !text-brown-dark !border-brown-dark/20 hover:!bg-cream-mid px-6 py-2.5 text-sm">
                Solapuri Chiwada
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
