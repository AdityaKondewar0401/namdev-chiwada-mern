import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { productAPI } from '../services/api';

function ProductCard({ product, index }) {
  const [selectedSize, setSelectedSize] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const sizes = product.sizes || [{ weight: product.weight, price: product.price }];

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!product.inStock) return;
    addToCart(
      { _id: product._id, name: product.name, img: product.img },
      sizes[selectedSize].weight,
      sizes[selectedSize].price
    );
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onClick={() => navigate(`/products/${product._id}`)}
      className="bg-white rounded-3xl overflow-hidden flex flex-col cursor-pointer group"
      style={{ boxShadow: '0 4px 24px rgba(45,26,0,0.08)' }}
      whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(224,112,0,0.18)' }}
    >
      {/* Main Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>

        {/* Out of Stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="px-4 py-2 rounded-full text-sm font-bold text-white bg-gray-700">
              Out of Stock
            </span>
          </div>
        )}

        {/* Badge — only show if in stock */}
        {product.badge && product.inStock && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: product.badgeColor || '#e07000' }}>
              {product.badge}
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.stopPropagation(); setWishlisted(!wishlisted); }}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          style={{ color: wishlisted ? '#e53e3e' : '#a07050' }}>
          {wishlisted ? '♥' : '♡'}
        </button>

        {/* Primary Image — always use product.img */}
        <img
          src={product.img}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Marathi name overlay */}
        {product.namMarathi && (
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3"
            style={{ background: 'linear-gradient(to top,rgba(45,26,0,0.65),transparent)' }}>
            <span style={{ fontFamily: "'Gotu',sans-serif", color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>
              {product.namMarathi}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pt-4 pb-5 flex flex-col flex-1">

        {/* Tag */}
        {product.tag && (
          <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#e07000' }}>
            {product.tag}
          </div>
        )}

        {/* Name */}
        <h3 className="font-serif font-black text-brown-dark text-xl leading-tight mb-1">
          {product.name}
        </h3>

        {/* Intro */}
        {product.intro && (
          <p className="text-xs text-brown-mid/60 mb-3 leading-relaxed">{product.intro}</p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-sm"
                style={{ color: i < Math.floor(product.rating) ? '#f59e0b' : '#d1d5db' }}>
                ★
              </span>
            ))}
          </div>
          <span className="text-xs text-brown-mid/60">({product.reviews})</span>
        </div>

        {/* Size Selector */}
        <div className="mb-4" onClick={(e) => e.stopPropagation()}>
          <div className="text-xs font-bold uppercase tracking-wider text-brown-dark mb-2">
            Net Weight
          </div>
          <div className="flex gap-2">
            {sizes.map((size, i) => (
              <button key={i}
                onClick={(e) => { e.stopPropagation(); setSelectedSize(i); }}
                disabled={!product.inStock}
                className="flex-1 py-2 rounded-full text-sm font-bold border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: selectedSize === i && product.inStock ? '#e07000' : 'transparent',
                  borderColor: selectedSize === i && product.inStock ? '#e07000' : 'rgba(224,112,0,0.3)',
                  color: selectedSize === i && product.inStock ? '#fff' : '#e07000',
                }}>
                {size.weight}
              </button>
            ))}
          </div>
        </div>

        {/* Price + Cart */}
        <div className="flex items-center gap-3 mt-auto" onClick={(e) => e.stopPropagation()}>
          <div>
            <div className="text-2xl font-black" style={{ color: '#e07000' }}>
              ₹{sizes[selectedSize].price}
            </div>
            <div className="text-xs text-brown-mid/50">MRP incl. of all taxes</div>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="flex-1 py-3 rounded-full font-bold text-sm text-white transition-all duration-300 disabled:cursor-not-allowed"
            style={{
              background: !product.inStock
                ? '#9ca3af'
                : addedToCart
                  ? 'linear-gradient(135deg,#2d5a1b,#4a9a2e)'
                  : 'linear-gradient(135deg,#e07000,#ff9010)',
              opacity: !product.inStock ? 0.7 : 1,
            }}>
            {!product.inStock ? '❌ Out of Stock' : addedToCart ? '✓ Added!' : '🛒 Add to Cart'}
          </button>
        </div>
      </div>

      {/* Bottom color bar */}
      <div className="h-1 w-full"
        style={{ background: `linear-gradient(90deg,${product.badgeColor || '#e07000'},transparent)` }} />
    </motion.div>
  );
}

export default function NamkeenSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getAll({ featured: 'true', limit: 4, sort: 'popular' })
      .then((res) => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative py-20 overflow-hidden" style={{ background: '#fffdf7' }}>

      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e07000'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />

      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg,transparent,#e07000,#d4af37,#e07000,transparent)' }} />

      <div className="max-w-7xl mx-auto px-6">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px flex-1 max-w-16"
              style={{ background: 'linear-gradient(to right,transparent,#d4af37)' }} />
            <span className="text-2xl">🌾</span>
            <div className="h-px flex-1 max-w-16"
              style={{ background: 'linear-gradient(to left,transparent,#d4af37)' }} />
          </div>
          <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#e07000' }}>
            Our Collection
          </div>
          <h2 className="font-serif font-black text-brown-dark mb-3"
            style={{ fontSize: 'clamp(2rem,4vw,3rem)', lineHeight: 1.1 }}>
            Our Namkeen Collection
          </h2>
          <p className="mb-1" style={{
            fontFamily: "'Gotu', sans-serif",
            fontSize: 'clamp(1rem,2vw,1.2rem)',
            background: 'linear-gradient(90deg,#ffd89b,#e07000,#ffd89b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            पिढ्यानपिढ्यांची चव, प्रत्येक घासात आनंद
          </p>
          <p className="text-brown-mid/60 text-sm italic">
            "Crafted with tradition, served with love since 1873"
          </p>
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-3xl overflow-hidden">
                <div className="skeleton w-full" style={{ aspectRatio: '4/3' }} />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-4 w-1/2 rounded" />
                  <div className="skeleton h-10 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-brown-mid/50">
            <div className="text-5xl mb-3">🍛</div>
            <p className="font-serif font-bold text-brown-dark">No featured products yet</p>
            <p className="text-sm mt-1">Mark products as "Featured" in the Admin Panel</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <ProductCard key={product._id} product={product} index={i} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-14">
          <p className="text-brown-mid/60 text-sm mb-5">
            Explore our full range of authentic Maharashtrian snacks
          </p>
          <a href="/products"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white text-base transition-all duration-300 hover:-translate-y-1"
            style={{
              background: 'linear-gradient(135deg,#e07000,#ff9010)',
              boxShadow: '0 8px 24px rgba(224,112,0,0.35)',
            }}>
            View All Products →
          </a>
        </motion.div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg,transparent,#e07000,#d4af37,#e07000,transparent)' }} />
    </section>
  );
}