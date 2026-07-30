import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';

import AdminNav from '../components/admin/AdminNav';
import DashboardTab from '../components/admin/DashboardTab';
import ProductsTab from '../components/admin/ProductsTab';
import ProductFormTab from '../components/admin/ProductFormTab';
import OrdersTab from '../components/admin/OrdersTab';
import PromoCodesTab from '../components/admin/PromoCodesTab';
import PartnersTab from '../components/admin/PartnersTab';
import ConsignmentsTab from '../components/admin/ConsignmentsTab';
import PartnerOrdersTab from '../components/admin/PartnerOrdersTab';
import PartnerDashboardTab from '../components/admin/PartnerDashboardTab';

// ─────────────────────────────────────────────
// AdminPage — REDESIGNED shell
//
// This file used to contain every tab as an inline sub-component
// (DashboardTab, ProductsTab, ProductFormTab, OrdersTab, OrderCard,
// PromoCodesTab all in one ~700-line file). It's now a thin shell:
// fetches products/orders, owns which tab is active, and renders
// the right tab component from components/admin/. All the actual
// per-tab logic lives in its own file — see the accompanying files.
//
// The only structural change here is swapping the old always-vertical
// sidebar for <AdminNav>, which renders a compact horizontal pill bar
// on mobile and the original vertical sidebar on desktop (see
// AdminNav.jsx for why).
// ─────────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/'); return; }
  }, [user, navigate]);

  useEffect(() => {
    productAPI.getAll({ limit: 100 })
      .then((res) => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.get('/api/orders/admin')
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => {});
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await productAPI.delete(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success(`"${name}" deleted`);
    } catch { toast.error('Failed to delete product'); }
  };

  const handleSave = async (data, isEdit) => {
    try {
      if (isEdit) {
        const res = await productAPI.update(editProduct._id, data);
        setProducts((prev) => prev.map((p) => (p._id === editProduct._id ? res.data.product : p)));
        toast.success('Product updated!');
        setEditProduct(null);
        setActiveTab('products');
      } else {
        const res = await productAPI.create(data);
        setProducts((prev) => [...prev, res.data.product]);
        toast.success('Product added!');
        setActiveTab('products');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save product'); }
  };

  const handleEdit = (product) => { setEditProduct(product); setActiveTab('add'); };
  const handleTabChange = (id) => { setActiveTab(id); if (id !== 'add') setEditProduct(null); };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen" style={{ background: '#fef3e0' }}>
      <div className="sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,#2d1a00,#3d1c00)', borderBottom: '1px solid rgba(224,112,0,0.2)' }}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link to="/" className="text-white/60 hover:text-white text-sm transition-colors flex-shrink-0">← Site</Link>
          <span className="text-white/20 flex-shrink-0">|</span>
          <span className="font-serif font-black text-white text-base sm:text-lg truncate">Admin Panel</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
            {user.name?.charAt(0)}
          </div>
          <span className="text-white/70 text-sm hidden sm:block">{user.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 lg:gap-6 items-start">
          <AdminNav activeTab={activeTab} onTabChange={handleTabChange} productsCount={products.length} />

          <div className="bg-white rounded-2xl p-4 sm:p-6"
            style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)', minHeight: '500px' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {activeTab === 'dashboard' && <DashboardTab products={products} orders={orders} />}
                {activeTab === 'products' && <ProductsTab products={products} onDelete={handleDelete} onEdit={handleEdit} loading={loading} />}
                {activeTab === 'add' && <ProductFormTab editProduct={editProduct} onSave={handleSave} onCancel={() => { setEditProduct(null); setActiveTab('products'); }} />}
                {activeTab === 'orders' && <OrdersTab />}
                {activeTab === 'promos' && <PromoCodesTab />}
                {activeTab === 'partners' && <PartnersTab />}
                {activeTab === 'consignments' && <ConsignmentsTab />}
                {activeTab === 'partnerOrders' && <PartnerOrdersTab />}
                {activeTab === 'partnerDashboard' && <PartnerDashboardTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}