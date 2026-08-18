import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { productAPI } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import PageWrapper from '../components/PageWrapper';

export default function WishlistPage() {
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    productAPI.getAll({ limit: 100 })
      .then((res) => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  const loading = wishlistLoading || loadingProducts;
  const saved = products.filter((p) => wishlist.includes(p._id));

  return (
    <PageWrapper>
      <div className="min-h-screen bg-cream px-5 lg:px-10 py-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="section-eyebrow">Saved For Later</div>
          <h1 className="font-serif font-black text-brown-dark text-2xl lg:text-3xl">My Wishlist</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-cream-mid animate-pulse" />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={48} strokeWidth={1.5} className="mx-auto text-brown-mid/25 mb-4" />
            <p className="text-brown-dark font-semibold mb-2">Your wishlist is empty</p>
            <p className="text-brown-mid/60 text-sm mb-6">Tap the heart on any product to save it here.</p>
            <Link to="/products" className="btn-saffron px-8 py-3 inline-block">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {saved.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}