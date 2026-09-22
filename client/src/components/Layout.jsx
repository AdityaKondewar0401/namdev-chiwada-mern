import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppFloat from './WhatsAppFloat';

// Extracted verbatim from App.jsx (was a local, unexported function there)
// so it can be imported both by App.jsx's routes and by B2BFeatureGate.jsx
// without a circular import between the two.
export function Layout({ children, hideFooter = false }) {
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
