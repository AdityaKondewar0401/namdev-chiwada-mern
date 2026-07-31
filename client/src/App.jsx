import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import AccountPage from './pages/AccountPage';
import WishlistPage from './pages/WishlistPage';
import AdminPage from './pages/AdminPage';
// NamkeenDetailPage was a legacy static product-detail page that referenced
// an undefined `PRODUCTS` global — visiting /namkeen/:id crashed with a
// ReferenceError (hard white screen), not just a rendering bug. It's fully
// superseded by ProductDetailPage (real API-backed data, wishlist, gallery,
// mobile sticky add-to-cart bar), so the route below now redirects instead
// of rendering the broken component. See AGENT.md §9 for the prior status
// of this page.
import PartnerSetPasswordPage from './pages/PartnerSetPasswordPage';
import PartnerDashboardPage from './pages/PartnerDashboardPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';

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

// Separate inner component so useLocation works inside BrowserRouter
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
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

        <Route
          path="/products/:id"
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

        {/* Distributor Portal Routes */}
        <Route path="/partner/set-password" element={<PartnerSetPasswordPage />} />
        <Route
          path="/partner/dashboard"
          element={
            <ProtectedRoute partnerOnly>
              <PartnerDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <Layout>
              <div className="min-h-screen bg-cream flex items-center justify-center text-center px-6">
                <div>
                  <div className="text-8xl mb-4">🥨</div>
                  <h2 className="font-serif font-black text-brown-dark text-3xl mb-3">
                    Page Not Found
                  </h2>
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