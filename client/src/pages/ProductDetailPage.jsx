import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import { DetailSkeleton } from '../components/Skeletons';
import PageWrapper from '../components/PageWrapper';

const TABS = ['Ingredients', 'Nutrition', 'Info'];

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [mainImg, setMainImg] = useState('');
  const [activeTab, setActiveTab] = useState('Ingredients');

  useEffect(() => {
    setLoading(true);
    productAPI.getOne(id)
      .then((res) => {
        const p = res.data.product;
        setProduct(p);
        setMainImg(p.img);
        setSelectedSizeIdx(Math.min(1, (p.sizes?.length || 1) - 1));
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!product) return;
    productAPI.getAll({ limit: 4 })
      .then((res) => setRelated((res.data.products || []).filter((p) => p._id !== id).slice(0, 3)))
      .catch(() => {});
  }, [product, id]);

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6 py-8 min-h-screen">
      <DetailSkeleton />
    </div>
  );
  if (!product) return null;

  const currentSize = product.sizes?.[selectedSizeIdx] || { weight: product.weight, price: product.price };
  const wishlisted = isWishlisted(product._id);
  const thumbs = [product.img, ...(product.images || [])];

  const handleAddToCart = () => {
    addToCart(product, currentSize.weight, currentSize.price, qty);
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-cream pb-16">
        <div className="max-w-6xl mx-auto px-6 pt-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-brown-mid/60 mb-6">
            <Link to="/" className="hover:text-saffron transition-colors">Home</Link>
            <span>›</span>
            <Link to="/products" className="hover:text-saffron transition-colors">Products</Link>
            <span>›</span>
            <span className="text-brown-dark">{product.name}</span>
          </nav>

          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-brown-mid hover:text-saffron transition-colors mb-6 font-medium">
            ← Back
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Gallery */}
            <div className="md:sticky md:top-24">
              <motion.div
                key={mainImg}
                initial={{ opacity: 0.7, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl2 overflow-hidden shadow-saffron mb-3 gallery-zoom"
                style={{ aspectRatio: '3/4' }}>
                <img src={mainImg} alt={product.name} className="w-full h-full object-cover transition-transform duration-300" />
              </motion.div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {thumbs.map((img, i) => (
                  <button key={i} onClick={() => setMainImg(img)}
                    className={`flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all ${mainImg === img ? 'border-saffron shadow-saffron' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-saffron mb-2">{product.sub}</div>
              <h1 className="font-serif font-black text-brown-dark leading-tight mb-3"
                style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)' }}>
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-amber-400 text-lg tracking-tight">
                  {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
                </span>
                <span className="text-sm text-brown-mid/60">({product.reviews} reviews)</span>
              </div>

              <div className="text-saffron font-black mb-4" style={{ fontSize: '2rem' }}>
                ₹{currentSize.price}
                <small className="text-base text-brown-mid/50 font-normal ml-1"> /{currentSize.weight}</small>
              </div>

              <p className="text-brown-dark/70 leading-relaxed mb-6">{product.desc}</p>

              {/* Size selector */}
              {product.sizes?.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-brown-dark mb-3">Select Size</div>
                  <div className="flex gap-2.5 flex-wrap">
                    {product.sizes.map((s, i) => (
                      <button key={i} onClick={() => setSelectedSizeIdx(i)}
                        className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all ${
                          selectedSizeIdx === i
                            ? 'bg-saffron border-saffron text-white'
                            : 'border-saffron/25 text-brown-dark hover:border-saffron bg-white'
                        }`}>
                        {s.weight} — ₹{s.price}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Qty */}
              <div className="flex items-center gap-4 mb-6">
                <div className="text-xs font-bold uppercase tracking-widest text-brown-dark">Quantity:</div>
                <div className="flex items-center gap-2.5 bg-cream-mid rounded-full px-2 py-1">
                  <button onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-9 h-9 rounded-full border-2 border-saffron text-saffron font-bold text-lg flex items-center justify-center bg-white hover:bg-saffron hover:text-white transition-all">
                    −
                  </button>
                  <span className="font-bold text-brown-dark w-7 text-center text-lg">{qty}</span>
                  <button onClick={() => setQty(qty + 1)}
                    className="w-9 h-9 rounded-full border-2 border-saffron text-saffron font-bold text-lg flex items-center justify-center bg-white hover:bg-saffron hover:text-white transition-all">
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8 flex-wrap">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 min-w-44 py-4 rounded-full font-bold text-white transition-all disabled:cursor-not-allowed"
                  style={{
                    background: !product.inStock ? '#9ca3af' : 'linear-gradient(135deg,#e07000,#ff9010)',
                    opacity: !product.inStock ? 0.7 : 1,
                    boxShadow: product.inStock ? '0 4px 16px rgba(224,112,0,0.3)' : 'none',
                  }}>
                  {!product.inStock ? '❌ Out of Stock' : '🛒 Add to Cart'}
                </button>
                <button onClick={() => toggle(product._id)}
                  className={`px-5 py-4 rounded-full border-2 text-xl transition-all ${
                    wishlisted
                      ? 'bg-red-50 border-red-400 text-red-500'
                      : 'border-saffron/30 text-saffron hover:bg-saffron-pale hover:border-saffron bg-white'
                  }`}>
                  {wishlisted ? '♥' : '♡'}
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b-2 border-saffron/10 flex gap-1 mb-5">
                {TABS.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all -mb-px ${
                      activeTab === tab
                        ? 'text-saffron border-saffron bg-saffron-pale'
                        : 'text-brown-mid/60 border-transparent hover:text-saffron'
                    }`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="min-h-24">
                {activeTab === 'Ingredients' && (
                  <div className="flex flex-wrap gap-2">
                    {(product.ingredients || []).map((ing) => (
                      <span key={ing} className="px-3 py-1.5 rounded-full text-xs text-brown-dark bg-cream-mid border border-saffron/15">
                        {ing}
                      </span>
                    ))}
                  </div>
                )}
                {activeTab === 'Nutrition' && (
                  <table className="w-full text-sm">
                    <tbody>
                      {(product.nutrition || []).map(([label, val]) => (
                        <tr key={label} className="border-b border-saffron/8">
                          <td className="py-2.5 text-brown-mid/70 font-medium">{label}</td>
                          <td className="py-2.5 font-bold text-brown-dark text-right">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {activeTab === 'Info' && (
                  <p className="text-sm text-brown-dark/70 leading-relaxed">{product.info}</p>
                )}
              </div>
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className="mt-20">
              <div className="mb-8">
                <div className="section-eyebrow">You May Also Like</div>
                <h3 className="font-serif font-bold text-brown-dark text-2xl">Related Products</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}