import { Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import { buildBreadcrumbSchema, buildFAQSchema } from '../utils/structuredData';

// client/src/pages/OurHistoryPage.jsx
//
// Public SEO landing page targeting "Namdev Chiwada history", "Solapur
// Chiwada", "heritage snacks" and "Serving Solapur Since 1873" (Step 6 of
// the SEO plan). Deliberately written in a plainer, chronological,
// text-forward style — distinct wording and structure from AboutPage.jsx
// (which tells the same true story through a heavier motion/visual
// treatment) — to avoid duplicate-content overlap while using only the
// same real facts already established there. Nothing here is invented:
// no fabricated founder names beyond "Bappa" (as already used on
// AboutPage), no invented award/customer-count claims.

const BREADCRUMB_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Our History', path: '/our-history' },
];

const FAQS = [
  {
    question: 'When was Namdev Chiwada founded?',
    answer:
      'Namdev Chiwada traces its roots to 1873 in Solapur, Maharashtra, when our founder — known within the family as Bappa — began selling fresh chiwda from a wooden box, carried through the city\'s lanes.',
  },
  {
    question: 'How many generations has Namdev Chiwada been run by?',
    answer:
      'The recipe and business have been carried forward through six generations of the same family, from Bappa\'s original chiwda in 1873 to today.',
  },
  {
    question: 'Where is Namdev Chiwada based?',
    answer:
      'Namdev Chiwada is based in Solapur, Maharashtra, where it has operated since 1873.',
  },
  {
    question: 'Has the recipe changed over the years?',
    answer:
      'The core recipe — the same masala, the same roasting method — has been carried forward largely unchanged since 1873, passed down through each generation of the family.',
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

const TIMELINE = [
  {
    year: '1873',
    title: 'A Fresh Start in Solapur',
    text:
      "Bappa left Rani Savargaon with no capital and no contacts — only the resolve to build something of his own. He began making fresh chiwda by hand in Solapur.",
  },
  {
    year: '1873',
    title: 'Selling Door to Door',
    text:
      "Carrying fresh chiwda through Solapur's lanes in a wooden box, Bappa built a loyal following one customer at a time.",
  },
  {
    year: '1876',
    title: 'Taking Root in Navipeth',
    text:
      "Three years in, Bappa built a two-storey home in Navipeth, Solapur — proof that the early risk had paid off. The house, and the audumbar tree beside it, still stand today.",
  },
  {
    year: 'Today',
    title: 'Six Generations, One Recipe',
    text:
      "The same masala, the same method — carried forward, batch after batch, since 1873, now reaching customers across Maharashtra online.",
  },
];

export default function OurHistoryPage() {
  return (
    <PageWrapper>
      <SEO
        title="Our History | Namdev Chiwada – Serving Solapur Since 1873"
        description="The history of Namdev Chiwada — from one founder selling fresh chiwda door to door in Solapur in 1873, to six generations of the same family recipe today."
        canonical="/our-history"
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
              Serving Solapur Since 1873
            </div>
            <h1
              className="font-serif font-black text-white mb-3"
              style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}
            >
              Our History
            </h1>
            <p className="text-white/70 max-w-xl mx-auto">
              How one founder's wooden box of fresh chiwda became six generations of Namdev
              Chiwada.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-14">
          {/* Intro */}
          <section>
            <div className="section-eyebrow">The Beginning</div>
            <h2 className="section-title mb-4">Where It Started</h2>
            <p className="text-brown-mid/80 leading-relaxed">
              Namdev Chiwada's history begins in 1873 in Solapur, Maharashtra. Our founder — known
              within the family simply as Bappa — arrived with no capital and no contacts, only the
              resolve to build something of his own. What he built was a small chiwda-making
              business that, six generations later, still carries his name and his recipe.
            </p>
          </section>

          {/* Timeline */}
          <section>
            <div className="section-eyebrow">The Story, Year by Year</div>
            <h2 className="section-title mb-6">Our Timeline</h2>
            <div className="space-y-5">
              {TIMELINE.map((t, i) => (
                <div key={i} className="card p-5 md:p-6 flex gap-4 md:gap-6 items-start">
                  <div
                    className="font-serif font-black text-saffron flex-shrink-0"
                    style={{ fontSize: '1.4rem', minWidth: 64 }}
                  >
                    {t.year}
                  </div>
                  <div>
                    <div className="font-serif font-bold text-brown-dark text-base md:text-lg mb-1">
                      {t.title}
                    </div>
                    <p className="text-brown-mid/70 text-sm leading-relaxed">{t.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recipe continuity */}
          <section>
            <div className="section-eyebrow">What Hasn't Changed</div>
            <h2 className="section-title mb-4">The Same Recipe, Six Generations On</h2>
            <p className="text-brown-mid/80 leading-relaxed mb-4">
              What makes Namdev Chiwada's history unusual isn't just its length — it's how little
              the core recipe has changed. The same hand-ground masala, the same ghee-based
              roasting method Bappa used in 1873, has been carried forward by each generation of
              the family since. Today, that same Namdev Chiwada recipe is available online, shipped
              from Solapur across Maharashtra.
            </p>
            <Link
              to="/about"
              className="text-saffron font-semibold text-sm hover:text-saffron-light underline underline-offset-2"
            >
              See the full illustrated story on our About page →
            </Link>
          </section>

          {/* FAQs */}
          <section>
            <div className="section-eyebrow">Common Questions</div>
            <h2 className="section-title mb-5">History — Frequently Asked Questions</h2>
            <FaqBlock />
          </section>

          {/* Internal links */}
          <section className="text-center pt-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/solapuri-chiwada" className="btn-outline !text-brown-dark !border-brown-dark/20 hover:!bg-cream-mid px-6 py-2.5 text-sm">
                Solapuri Chiwada
              </Link>
              <Link to="/chiwada" className="btn-outline !text-brown-dark !border-brown-dark/20 hover:!bg-cream-mid px-6 py-2.5 text-sm">
                About Chiwada
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
