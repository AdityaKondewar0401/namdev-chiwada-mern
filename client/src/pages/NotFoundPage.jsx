import SEO from '../components/SEO';
import { SITE_NAME } from '../config/seo.config';

// Extracted from App.jsx's inline 404 route element so B2BFeatureGate can
// show the EXACT same page when B2B is disabled (spec Part B1: "show the
// normal 404 page") instead of a similar-looking reimplementation.
export default function NotFoundPage() {
  return (
    <>
      <SEO
        title={`Page Not Found | ${SITE_NAME}`}
        description="The page you're looking for doesn't exist."
        canonical="/"
        robots="noindex,nofollow"
      />
      <div className="min-h-screen bg-cream flex items-center justify-center text-center px-6">
        <div>
          <div className="text-8xl mb-4">🥨</div>
          <h1 className="font-serif font-black text-brown-dark text-3xl mb-3">
            Page Not Found
          </h1>
          <p className="text-brown-mid/60 mb-8">
            Looks like this page took a different path!
          </p>
          <a href="/" className="btn-saffron px-8 py-3.5 inline-block">
            Go Home
          </a>
        </div>
      </div>
    </>
  );
}
