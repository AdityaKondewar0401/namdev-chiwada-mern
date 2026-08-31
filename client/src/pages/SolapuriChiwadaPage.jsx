import { Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import { buildBreadcrumbSchema, buildFAQSchema } from '../utils/structuredData';
import { SITE_NAME } from '../config/seo.config';

// client/src/pages/SolapuriChiwadaPage.jsx
//
// Public SEO landing page targeting "Solapuri Chiwada" (Step 5 of the SEO
// plan). Structured per the plan's suggested outline: what it is, what
// makes it different, ingredients/preparation, Solapur's snack tradition,
// Namdev Chiwda's heritage, product recommendations, and FAQs. All
// heritage facts reuse the same true information already on
// AboutPage/OurHistoryPage — nothing here is invented.

const BREADCRUMB_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Solapuri Chiwada', path: '/solapuri-chiwada' },
];

const FAQS = [
  {
    question: 'What is Solapuri Chiwada?',
    answer:
      'Solapuri Chiwada is a style of Chiwada associated with Solapur, Maharashtra, known for its hand-ground masala, use of pure ghee, and a distinct balance of mild heat, curry-leaf aroma, and light sweetness. It is typically roasted rather than deep-fried, giving it a lighter, longer-lasting crunch.',
  },
  {
    question: 'How is Solapuri Chiwada different from other regional Chiwadas?',
    answer:
      'While Chiwada is made across Maharashtra, Solapuri Chiwada is distinguished by its specific masala blend — ground fresh rather than using pre-mixed spice powders — and a preparation style passed down through generations of Solapur-based snack makers, including the Namdev Chiwda family recipe dating to 1873.',
  },
  {
    question: 'What are the main ingredients in Solapuri Chiwada?',
    answer:
      'A traditional Solapuri Chiwada base includes flattened rice (poha), peanuts, curry leaves, mustard seeds, green chilli, turmeric, rock salt, a touch of sugar, and pure ghee, finished with a hand-ground masala blend.',
  },
  {
    question: 'Which Namdev Chiwda product is less spicy?',
    answer:
      'Namdev Chiwda (our signature poha-based blend) is categorised as mild, making it a good starting point if you prefer a gentler heat level. Bakarwadi has a spicier, more robust masala profile.',
  },
  {
    question: 'Do you deliver Solapuri Chiwada across Maharashtra?',
    answer:
      'Yes — Namdev Chiwda ships from our Solapur warehouse across Maharashtra, with priority delivery in Pune and Solapur, and Cash on Delivery and online payment available at checkout.',
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

export default function SolapuriChiwadaPage() {
  return (
    <PageWrapper>
      <SEO
        title={`Solapuri Chiwada | Authentic Solapur-Style Chiwada — ${SITE_NAME}`}
        description={`Discover Solapuri Chiwada — the hand-ground, ghee-roasted style of Chiwada from Solapur, Maharashtra. Learn what makes it different and shop ${SITE_NAME}'s authentic recipe, made since 1873.`}
        canonical="/solapuri-chiwada"
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
              Solapur, Maharashtra · Since 1873
            </div>
            <h1
              className="font-serif font-black text-white mb-3"
              style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}
            >
              Solapuri Chiwada — A Taste of Solapur
            </h1>
            <p className="text-white/70 max-w-xl mx-auto">
              Ghee-roasted, hand-ground, and made the same way for six generations.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-14">
          {/* What is it */}
          <section>
            <div className="section-eyebrow">What is it?</div>
            <h2 className="section-title mb-4">What is Solapuri Chiwada?</h2>
            <p className="text-brown-mid/80 leading-relaxed">
              Solapuri Chiwada is the style of Chiwada that comes from Solapur, a city with a long
              and well-known snack-making tradition in southern Maharashtra. It shares the same
              basic idea as Chiwada made elsewhere in the state — roasted flattened rice or corn,
              peanuts, curry leaves, and spices — but is defined by a specific approach: fresh,
              hand-ground masala rather than a generic spice mix, real ghee instead of refined oil,
              and a roasting technique built to keep every ingredient distinct and crisp.
            </p>
          </section>

          {/* What makes it different */}
          <section>
            <div className="section-eyebrow">The Difference</div>
            <h2 className="section-title mb-4">What Makes Solapuri Chiwada Different?</h2>
            <p className="text-brown-mid/80 leading-relaxed mb-4">
              The difference comes down to method, not shortcuts. Solapuri Chiwada makers
              traditionally grind their own masala rather than buying a ready spice powder, which
              gives the final snack a fresher, more layered flavour than mass-produced versions.
              Pure ghee is used instead of cheaper refined oil, and the roasting is done in small
              batches so the texture stays consistent — crisp, not soggy or overly oily.
            </p>
            <p className="text-brown-mid/80 leading-relaxed">
              At Namdev Chiwda, this is exactly the process we've followed since 1873: the same
              hand-ground masala, the same ghee-based roasting, the same attention to batch size
              over speed.
            </p>
          </section>

          {/* Ingredients & preparation */}
          <section>
            <div className="section-eyebrow">How It's Made</div>
            <h2 className="section-title mb-4">Ingredients &amp; Preparation</h2>
            <p className="text-brown-mid/80 leading-relaxed mb-4">
              A traditional Solapuri Chiwada starts with thick, flattened rice (poha), which is
              roasted until crisp rather than fried. It's then combined with roasted peanuts,
              cashews, mustard seeds tempered in ghee, fresh curry leaves, green chilli, turmeric,
              rock salt, and a touch of sugar for balance — finished with the hand-ground masala
              that gives Solapuri Chiwada its signature aroma.
            </p>
            <p className="text-brown-mid/80 leading-relaxed">
              Namdev Chiwda's version follows this same base, with our own family masala blend
              carried forward since 1873.
            </p>
          </section>

          {/* Solapur's tradition */}
          <section>
            <div className="section-eyebrow">Local Heritage</div>
            <h2 className="section-title mb-4">Solapur's Snack Tradition</h2>
            <p className="text-brown-mid/80 leading-relaxed">
              Solapur has long been known across Maharashtra for its savoury snack-making — from
              home kitchens to small family businesses that have supplied the city's lanes and
              markets for generations. Chiwada, in particular, became a defining Solapur snack:
              practical to carry, long-lasting, and suited to the city's tea-stall culture. Namdev
              Chiwda's own story is part of that tradition, beginning in 1873 when our founder
              carried fresh chiwda through Solapur's lanes in a wooden box, one customer at a time.
            </p>
          </section>

          {/* Heritage tie-in */}
          <section>
            <div className="section-eyebrow">Our Heritage</div>
            <h2 className="section-title mb-4">Namdev Chiwda's Heritage</h2>
            <p className="text-brown-mid/80 leading-relaxed mb-4">
              Six generations later, Namdev Chiwda still follows the recipe our founder Bappa
              perfected in 1873 in Navipeth, Solapur — the same masala, the same roasting method,
              batch after batch.
            </p>
            <Link
              to="/our-history"
              className="text-saffron font-semibold text-sm hover:text-saffron-light underline underline-offset-2"
            >
              Read the full Namdev Chiwda story →
            </Link>
          </section>

          {/* Product recommendations */}
          <section>
            <div className="section-eyebrow">Shop This Style</div>
            <h2 className="section-title mb-4">Try Our Solapuri Chiwada</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link to="/products/namdev-chiwada" className="card p-5 block hover:-translate-y-1">
                <div className="font-serif font-bold text-brown-dark text-lg mb-1">
                  Namdev Chiwda
                </div>
                <p className="text-brown-mid/70 text-sm leading-relaxed">
                  Our house-signature blend — slow-roasted poha with pure ghee and hand-ground
                  Solapur masala. Mild heat, six generations of recipe.
                </p>
              </Link>
              <Link to="/products/bakarwadi" className="card p-5 block hover:-translate-y-1">
                <div className="font-serif font-bold text-brown-dark text-lg mb-1">Bakarwadi</div>
                <p className="text-brown-mid/70 text-sm leading-relaxed">
                  Another Maharashtrian classic from the same kitchen — spiral pastry rolls with a
                  spiced coconut-sesame filling.
                </p>
              </Link>
            </div>
          </section>

          {/* FAQs */}
          <section>
            <div className="section-eyebrow">Common Questions</div>
            <h2 className="section-title mb-5">Solapuri Chiwada — Frequently Asked Questions</h2>
            <FaqBlock />
          </section>

          {/* Internal links */}
          <section className="text-center pt-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/chiwada" className="btn-outline !text-brown-dark !border-brown-dark/20 hover:!bg-cream-mid px-6 py-2.5 text-sm">
                About Chiwada
              </Link>
              <Link to="/our-history" className="btn-outline !text-brown-dark !border-brown-dark/20 hover:!bg-cream-mid px-6 py-2.5 text-sm">
                Our Story
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
