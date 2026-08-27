import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import ProtectedRoute from './components/ProtectedRoute';

// Public, crawled pages load eagerly — every millisecond here is initial
// bundle weight on the pages Google/users actually land on first.
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
// SEO landing pages — see AGENT.md §"SEO Architecture" / the SEO report for
// the keyword intent each one targets. All four are genuinely useful public
// content pages, not thin doorway pages.
import ChiwadaPage from './pages/ChiwadaPage';
import SolapuriChiwadaPage from './pages/SolapuriChiwadaPage';
import MaharashtrianSnacksPage from './pages/MaharashtrianSnacksPage';
import OurHistoryPage from './pages/OurHistoryPage';

// Authenticated-only pages (never seen by a first-time visitor or a
// crawler) are code-split out of the main bundle — this is what was
// pushing the single JS chunk over Vite's 500kB warning threshold.
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
// NamkeenDetailPage was a legacy static product-detail page that referenced
// an undefined `PRODUCTS` global — visiting /namkeen/:id crashed with a
// ReferenceError (hard white screen), not just a rendering bug. It's fully
// superseded by ProductDetailPage (real API-backed data, wishlist, gallery,
// mobile sticky add-to-cart bar), so the route below now redirects instead
// of rendering the broken component. See AGENT.md §9 for the prior status
// of this page.
import { LoginPage, RegisterPage } from './pages/AuthPages';
import SEO from './components/SEO';
import { SITE_NAME } from './config/seo.config';

// Redirects the legacy /namkeen/:id URL to the real, working product page
// instead of rendering the broken NamkeenDetailPage (see import comment
// above). `replace` so it doesn't leave the dead URL in browser history.
function NamkeenRedirect() {
  const { id } = useParams();
  return <Navigate to={`/products/${id}`} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // instant on page change so it doesn't fight the page transition animation
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function Layout({ children, hideFooter = false }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      {!hideFooter && <Footer />}
      <WhatsAppFloat
        phone="919130160491"
        message="Hi! I have a query about my order."
      />
    </>
  );
}

function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>{children}</WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

// Fallback while a lazy-loaded (authenticated-only) route's chunk is
// fetched — brief on a real connection, but a blank screen would be worse.
function RouteLoader() {
  return <div className="min-h-screen bg-cream" />;
}

// Separate inner component so useLocation works inside BrowserRouter
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<RouteLoader />}>
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />

        <Route
          path="/products"
          element={
            <Layout>
              <ProductsPage />
            </Layout>
          }
        />

        {/*
          Product URLs are now slug-based (/products/namdev-chiwada) instead
          of raw Mongo ObjectIds, for readable, keyword-relevant URLs. The
          route param is still just called ":slug" here for clarity, but
          the backend's GET /api/products/:id resolves EITHER a 24-char
          ObjectId OR a slug (see productController.getProduct), so this
          needed zero backend changes. ProductDetailPage itself handles the
          old-ID-URL → canonical-slug-URL redirect once the product
          resolves — see the component for details and the SEO report for
          why this is a client-side redirect rather than a true HTTP 301.
        */}
        <Route
          path="/products/:slug"
          element={
            <Layout>
              <ProductDetailPage />
            </Layout>
          }
        />

        <Route
          path="/cart"
          element={
            <Layout>
              <CartPage />
            </Layout>
          }
        />

        <Route
          path="/contact"
          element={
            <Layout>
              <ContactPage />
            </Layout>
          }
        />

        <Route
          path="/about"
          element={
            <Layout>
              <AboutPage />
            </Layout>
          }
        />

        <Route
          path="/our-history"
          element={
            <Layout>
              <OurHistoryPage />
            </Layout>
          }
        />

        <Route
          path="/chiwada"
          element={
            <Layout>
              <ChiwadaPage />
            </Layout>
          }
        />

        <Route
          path="/solapuri-chiwada"
          element={
            <Layout>
              <SolapuriChiwadaPage />
            </Layout>
          }
        />

        <Route
          path="/maharashtrian-snacks"
          element={
            <Layout>
              <MaharashtrianSnacksPage />
            </Layout>
          }
        />

        <Route path="/namkeen/:id" element={<NamkeenRedirect />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Layout>
                <AccountPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Layout>
                <WishlistPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Layout hideFooter>
                <CheckoutPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Layout>
                <OrdersPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <OrdersPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <Layout>
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
            </Layout>
          }
        />
      </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <ScrollToTop />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#2d1a00',
              color: '#fff',
              borderRadius: '30px',
              padding: '12px 20px',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 8px 32px rgba(224,112,0,0.15)',
            },
            success: {
              iconTheme: {
                primary: '#e07000',
                secondary: '#fff',
              },
            },
          }}
        />
        <AnimatedRoutes />
      </Providers>
    </BrowserRouter>
  );
}