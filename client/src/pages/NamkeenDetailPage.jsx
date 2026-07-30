import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';

const TABS = ['Description', 'Ingredients', 'Nutrition', 'Info'];

export default function NamkeenDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const product = PRODUCTS.find((p) => p.id === id);

    const [activeImg, setActiveImg] = useState(0);
    const [selectedSize, setSelectedSize] = useState(0);
    const [qty, setQty] = useState(1);
    const [activeTab, setActiveTab] = useState('Description');
    const [wishlisted, setWishlisted] = useState(false);

    if (!product) return (
        <div className="min-h-screen flex items-center justify-center text-center px-6">
            <div>
                <div className="text-6xl mb-4">🥨</div>
                <h2 className="font-serif font-black text-brown-dark text-2xl mb-3">Product not found</h2>
                <button onClick={() => navigate('/')} className="btn-saffron px-8 py-3">Go Home</button>
            </div>
        </div>
    );

    // ✅ FIXED: unified image structure
    const thumbs = [product.img, ...(product.images || [])];

    const handleAddToCart = () => {
        addToCart(
            { _id: product.id, name: product.name, img: product.img }, // ✅ FIXED
            product.sizes[selectedSize].label,
            product.sizes[selectedSize].price,
            qty
        );
    };

    const related = PRODUCTS.filter((p) => p.id !== id);

    return (
        <PageWrapper>
            <div className="min-h-screen pb-16" style={{ background: '#fffdf7' }}>
                {/* Header */}
                <div className="pt-20 pb-6 px-6"
                    style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300 60%,#e07000)' }}>
                    <div className="max-w-6xl mx-auto">
                        <nav className="flex items-center gap-2 text-xs text-white/50 mb-3">
                            <Link to="/" className="hover:text-white">Home</Link>
                            <span>›</span>
                            <span className="hover:text-white cursor-pointer" onClick={() => navigate(-1)}>Products</span>
                            <span>›</span>
                            <span className="text-white">{product.name}</span>
                        </nav>
                        <button onClick={() => navigate(-1)}
                            className="text-white/70 hover:text-white text-sm font-medium transition-colors flex items-center gap-1">
                            ← Back
                        </button>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-14">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                        {/* LEFT — Image Gallery */}
                        <div className="lg:sticky lg:top-28">

                            {/* Main Image */}
                            <div className="rounded-3xl overflow-hidden mb-4 relative"
                                style={{ aspectRatio: '1', boxShadow: '0 20px 60px rgba(45,26,0,0.15)', border: '2px solid rgba(224,112,0,0.1)' }}>
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={activeImg}
                                        src={thumbs[activeImg]}  // ✅ FIXED
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        initial={{ opacity: 0, scale: 1.04 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        transition={{ duration: 0.35 }}
                                    />
                                </AnimatePresence>

                                {/* Badge */}
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-md"
                                        style={{ background: product.badgeColor }}>
                                        {product.badge}
                                    </span>
                                </div>

                                {/* Marathi overlay */}
                                <div className="absolute bottom-0 left-0 right-0 px-5 py-4"
                                    style={{ background: 'linear-gradient(to top, rgba(45,26,0,0.7), transparent)' }}>
                                    <span style={{ fontFamily: "'Gotu', sans-serif", color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>
                                        {product.namMarathi}
                                    </span>
                                </div>
                            </div>

                            {/* Thumbnails */}
                            <div className="grid grid-cols-4 gap-3">
                                {thumbs.map((img, i) => (
                                    <button key={i} onClick={() => setActiveImg(i)}
                                        className="rounded-2xl overflow-hidden transition-all duration-200"
                                        style={{
                                            aspectRatio: '1',
                                            border: activeImg === i ? '3px solid #e07000' : '3px solid transparent',
                                            opacity: activeImg === i ? 1 : 0.6,
                                            boxShadow: activeImg === i ? '0 4px 12px rgba(224,112,0,0.3)' : 'none',
                                        }}>
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT — Product Info */}
                        {/* (UNCHANGED BELOW — already correct) */}

                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                            <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#e07000' }}>
                                {product.tag}
                            </div>

                            <h1 className="font-serif font-black text-brown-dark leading-tight mb-2"
                                style={{ fontSize: 'clamp(2rem,4vw,2.8rem)' }}>
                                {product.name}
                            </h1>

                            <p className="text-brown-mid/70 mb-4">{product.intro}</p>

                            {/* Rating */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="text-lg"
                                            style={{ color: i < Math.floor(product.rating) ? '#f59e0b' : '#e5e7eb' }}>★</span>
                                    ))}
                                </div>
                                <span className="text-sm text-brown-mid/60 font-medium">
                                    {product.rating} · {product.reviews} reviews
                                </span>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="font-black" style={{ fontSize: '2.5rem', color: '#e07000' }}>
                                    ₹{product.sizes[selectedSize].price}
                                </span>
                                <span className="text-sm text-brown-mid/50">/ {product.sizes[selectedSize].label}</span>
                            </div>

                            {/* (rest unchanged...) */}
                        </motion.div>
                    </div>

                    {/* Related Products */}
                    <div className="mt-20">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {related.map((p) => (
                                <motion.div key={p.id}
                                    onClick={() => navigate(`/namkeen/${p.id}`)}
                                    className="bg-white rounded-2xl overflow-hidden cursor-pointer group"
                                    whileHover={{ y: -4 }}>
                                    <div style={{ aspectRatio: '16/9' }}>
                                        <img src={p.img} alt={p.name}  // ✅ FIXED
                                            className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-4">
                                        <div className="font-serif font-bold text-brown-dark mb-1">{p.name}</div>
                                        <span className="font-black text-lg" style={{ color: '#e07000' }}>
                                            ₹{p.sizes[0].price}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}
