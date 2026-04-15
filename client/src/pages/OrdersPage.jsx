import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../services/api';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};
const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

function OrderDetail({ id }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getOne(id)
      .then((r) => setOrder(r.data.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20"><div className="skeleton h-6 w-48 mx-auto rounded" /></div>;
  if (!order) return <div className="text-center py-16 text-brown-mid/60">Order not found.</div>;

  const stepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Status header */}
      <div className="bg-white rounded-xl2 shadow-saffron border border-saffron/8 p-6 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <div className="text-xs text-brown-mid/60 mb-1">Order ID</div>
            <div className="font-mono text-sm text-brown-dark font-semibold">{order._id}</div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[order.status]}`}>
            {order.status}
          </span>
        </div>

        {/* Progress */}
        {order.status !== 'cancelled' && (
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                  i <= stepIdx ? 'bg-saffron text-white' : 'bg-cream-mid text-brown-mid/40'
                }`}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${i < stepIdx ? 'bg-saffron' : 'bg-cream-mid'}`} />
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between mt-1.5">
          {STATUS_STEPS.map((s) => (
            <span key={s} className="text-xs text-brown-mid/50 capitalize flex-1 text-center first:text-left last:text-right">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl2 shadow-saffron p-6 border border-saffron/8 mb-5">
        <h3 className="font-serif font-bold text-brown-dark mb-4">Items Ordered</h3>
        {order.items.map((item, i) => (
          <div key={i} className="flex gap-4 items-center py-3 border-b border-saffron/8 last:border-0">
            <img src={item.img} alt={item.name} className="w-14 h-16 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-brown-dark text-sm">{item.name}</div>
              <div className="text-xs text-brown-mid/60">{item.size} × {item.qty}</div>
            </div>
            <div className="font-bold text-saffron">₹{item.price * item.qty}</div>
          </div>
        ))}
        <div className="pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-brown-mid/70"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
          <div className="flex justify-between text-brown-mid/70"><span>Delivery</span><span>{order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-leaf"><span>Discount</span><span>−₹{order.discount}</span></div>}
          <div className="flex justify-between font-black text-brown-dark border-t border-saffron/10 pt-2 text-base"><span>Total</span><span>₹{order.total}</span></div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl2 shadow-saffron p-6 border border-saffron/8">
        <h3 className="font-serif font-bold text-brown-dark mb-3">Delivery Address</h3>
        <div className="text-sm text-brown-mid/70 leading-relaxed">
          <div className="font-semibold text-brown-dark">{order.shippingAddress.name}</div>
          <div>{order.shippingAddress.street}</div>
          <div>{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}</div>
          <div className="mt-1">{order.shippingAddress.phone}</div>
        </div>
      </div>
    </div>
  );
}

function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getAll()
      .then((r) => setOrders(r.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      {[1, 2].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
    </div>
  );

  if (orders.length === 0) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">📦</div>
      <div className="font-serif font-bold text-brown-dark text-xl mb-3">No orders yet</div>
      <Link to="/products" className="btn-saffron px-6 py-3">Start Shopping →</Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {orders.map((order, i) => (
        <motion.div key={order._id}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
          className="bg-white rounded-xl shadow-saffron border border-saffron/8 p-5 hover:shadow-saffron-lg transition-all">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs text-brown-mid/50 mb-0.5">Order #{order._id.slice(-8).toUpperCase()}</div>
              <div className="font-serif font-bold text-brown-dark">{order.items.length} item{order.items.length > 1 ? 's' : ''}</div>
              <div className="text-xs text-brown-mid/60 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize mb-2 ${STATUS_COLORS[order.status]}`}>
                {order.status}
              </span>
              <div className="font-black text-saffron">₹{order.total}</div>
            </div>
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {order.items.slice(0, 4).map((item, j) => (
              <img key={j} src={item.img} alt={item.name} className="w-10 h-12 rounded-lg object-cover flex-shrink-0" />
            ))}
          </div>
          <Link to={`/orders/${order._id}`}
            className="inline-block mt-3 text-xs text-saffron font-semibold hover:text-saffron-light transition-colors">
            View Details →
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const { id } = useParams();
  return (
    <div className="min-h-screen bg-cream pb-16">
      <div className="pt-12 pb-8 px-6" style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300 60%,#e07000)' }}>
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-xs text-white/50 mb-3">
            <Link to="/" className="hover:text-white">Home</Link>
            <span>›</span>
            <span className="text-white">{id ? 'Order Details' : 'My Orders'}</span>
          </nav>
          <h1 className="font-serif font-black text-white text-3xl">{id ? 'Order Details' : 'My Orders'}</h1>
          {id && <Link to="/orders" className="text-white/60 text-sm hover:text-white mt-1 inline-block">← All Orders</Link>}
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-10">
        {id ? <OrderDetail id={id} /> : <OrdersList />}
      </div>
    </div>
  );
}
