import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
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
import NamkeenDetailPage from './pages/NamkeenDetailPage';
import AccountPage from './pages/AccountPage';
import AdminPage from './pages/AdminPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

function Layout({ children, hideFooter = false }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      {!hideFooter && <Footer />}
      <WhatsAppFloat />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
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
                success: { iconTheme: { primary: '#e07000', secondary: '#fff' } },
              }}
            />
            <Routes>
              <Route path="/" element={<Layout><HomePage /></Layout>} />
              <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
              <Route path="/products/:id" element={<Layout><ProductDetailPage /></Layout>} />
              <Route path="/cart" element={<Layout><CartPage /></Layout>} />
              <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
              <Route path="/about" element={<Layout><AboutPage /></Layout>} />
              <Route path="/namkeen/:id" element={<Layout><NamkeenDetailPage /></Layout>} />
              <Route path="/account" element={
                <ProtectedRoute>
                  <Layout><AccountPage /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              } />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Layout hideFooter><CheckoutPage /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <Layout><OrdersPage /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/orders/:id" element={
                <ProtectedRoute>
                  <Layout><OrdersPage /></Layout>
                </ProtectedRoute>
              } />
              {/* 404 */}
              <Route path="*" element={
                <Layout>
                  <div className="min-h-screen bg-cream flex items-center justify-center text-center px-6">
                    <div>
                      <div className="text-8xl mb-4">🥨</div>
                      <h2 className="font-serif font-black text-brown-dark text-3xl mb-3">Page Not Found</h2>
                      <p className="text-brown-mid/60 mb-8">Looks like this page took a different path!</p>
                      <a href="/" className="btn-saffron px-8 py-3.5 inline-block">Go Home</a>
                    </div>
                  </div>
                </Layout>
              } />
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
