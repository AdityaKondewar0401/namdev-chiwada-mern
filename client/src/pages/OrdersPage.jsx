import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { orderAPI } from '../services/api';
import PageWrapper from '../components/PageWrapper';

// ── Constants ──────────────────────────────────────────
const WHATSAPP_NUMBER = '919975333427'; // ← Replace with your actual WhatsApp number (with country code, no +)

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed:  'bg-blue-100 text-blue-700 border-blue-200',
  processing: 'bg-purple-100 text-purple-700 border-purple-200',
  shipped:    'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-100 text-green-700 border-green-200',
  cancelled:  'bg-red-100 text-red-600 border-red-200',
};

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_ICONS = {
  pending:    '🕐',
  confirmed:  '✅',
  processing: '⚙️',
  shipped:    '🚚',
  delivered:  '🎉',
  cancelled:  '❌',
};

const STATUS_DESC = {
  pending:    'Your order has been received and is awaiting confirmation.',
  confirmed:  'Your order has been confirmed and is being prepared.',
  processing: 'Your order is being packed with care.',
  shipped:    'Your order is on its way to you!',
  delivered:  'Your order has been delivered. Enjoy your snacks! 🍿',
  cancelled:  'This order has been cancelled.',
};

const PAYMENT_LABELS = { COD: 'Cash on Delivery', ONLINE: 'Online Payment', UPI: 'UPI' };

// ── WhatsApp Support Box ───────────────────────────────
function WhatsAppSupportBox({ order }) {
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState(false);

  const shortId = order._id.slice(-8).toUpperCase();

  const quickIssues = [
    '📦 Where is my order?',
    '❌ I want to cancel my order',
    '🔄 I received a wrong item',
    '💔 Product was damaged',
    '💰 Refund not received',
  ];

  const buildWhatsAppUrl = (text) => {
    const fullMsg = `Hi Namdev Chiwada! 👋\n\nOrder ID: #${shortId}\nDate: ${new Date(order.createdAt).toLocaleDateString('en-IN')}\nAmount: ₹${order.total}\n\nIssue: ${text}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fullMsg)}`;
  };

  const handleCustomSend = () => {
    if (!message.trim()) return;
    window.open(buildWhatsAppUrl(message), '_blank');
    setMessage('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-2xl overflow-hidden border border-green-200"
      style={{ boxShadow: '0 4px 24px rgba(37,211,102,0.12)' }}
    >
      {/* Header */}
      <div
        className="p-5 cursor-pointer select-none"
        style={{ background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* WhatsApp SVG Icon */}
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 32 32" width="22" height="22" fill="white">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 2.82.736 5.46 2.027 7.754L0 32l8.454-2.016A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.267 13.267 0 01-6.756-1.845l-.484-.288-5.02 1.197 1.22-4.89-.316-.502A13.227 13.227 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.878c-.398-.199-2.355-1.162-2.72-1.295-.365-.133-.63-.199-.895.199-.265.398-1.028 1.295-1.26 1.56-.232.265-.464.298-.862.1-.398-.2-1.681-.62-3.203-1.977-1.183-1.057-1.982-2.363-2.214-2.761-.232-.398-.025-.613.174-.81.179-.178.398-.464.597-.696.199-.232.265-.398.398-.664.133-.265.066-.497-.033-.696-.1-.199-.895-2.157-1.227-2.952-.323-.775-.65-.67-.895-.682-.231-.011-.497-.014-.762-.014a1.46 1.46 0 00-1.061.497c-.365.398-1.393 1.361-1.393 3.318s1.426 3.85 1.625 4.115c.199.265 2.806 4.282 6.796 6.003.95.41 1.692.655 2.27.838.954.304 1.822.261 2.508.158.765-.114 2.355-.963 2.687-1.893.332-.93.332-1.728.232-1.893-.1-.166-.365-.265-.763-.464z"/>
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-sm">Need help with this order?</div>
              <div className="text-white/80 text-xs">Chat with us on WhatsApp instantly</div>
            </div>
          </div>
          <div className="text-white/80 text-lg transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▾
          </div>
        </div>
      </div>

      {/* Expandable Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden bg-white"
          >
            <div className="p-5">
              {/* Quick Issues */}
              <div className="mb-4">
                <div className="text-xs font-bold uppercase tracking-wider text-brown-mid/60 mb-2">Quick Issues</div>
                <div className="flex flex-wrap gap-2">
                  {quickIssues.map((issue) => (
                    <a
                      key={issue}
                      href={buildWhatsAppUrl(issue)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-2 rounded-full border font-medium transition-all hover:-translate-y-0.5 hover:shadow-md"
                      style={{ borderColor: '#25d366', color: '#128c7e', background: '#f0fdf4' }}
                    >
                      {issue}
                    </a>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-saffron/10" />
                <span className="text-xs text-brown-mid/40 font-medium">or describe your issue</span>
                <div className="flex-1 h-px bg-saffron/10" />
              </div>

              {/* Custom Message */}
              <div className="flex gap-2">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={`Describe your issue with order #${shortId}...`}
                  rows={2}
                  className="flex-1 text-sm rounded-xl border px-3 py-2 resize-none outline-none focus:border-green-400 transition-colors"
                  style={{ borderColor: 'rgba(37,211,102,0.3)', background: '#fafffe' }}
                />
                <button
                  onClick={handleCustomSend}
                  disabled={!message.trim()}
                  className="px-4 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition-all hover:-translate-y-0.5 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#25d366,#128c7e)' }}
                >
                  Send
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-brown-mid/50">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                Typically replies within 30 minutes · Order ID auto-included
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Order Detail ───────────────────────────────────────
function OrderDetail({ id }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getOne(id)
      .then((r) => setOrder(r.data.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
    </div>
  );
  if (!order) return <div className="text-center py-16 text-brown-mid/60">Order not found.</div>;

  const stepIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const shortId = order._id.slice(-8).toUpperCase();
  const orderDate = new Date(order.createdAt);

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Card 1: Order Status Header ── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-saffron/10 overflow-hidden"
        style={{ boxShadow: '0 4px 24px rgba(45,26,0,0.07)' }}>

        {/* Colored top strip based on status */}
        <div className="h-1.5 w-full" style={{
          background: isCancelled
            ? 'linear-gradient(90deg,#fca5a5,#ef4444)'
            : isDelivered
              ? 'linear-gradient(90deg,#86efac,#22c55e)'
              : 'linear-gradient(90deg,#fed7aa,#e07000,#ff9010)'
        }} />

        <div className="p-6">
          {/* Top row: ID + Status badge */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
            <div>
              <div className="text-xs text-brown-mid/50 font-medium uppercase tracking-wider mb-1">Order</div>
              <div className="font-black text-brown-dark text-2xl font-serif">#{shortId}</div>
              <div className="text-xs text-brown-mid/50 mt-1 font-mono">{order._id}</div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border capitalize ${STATUS_COLORS[order.status]}`}>
                <span>{STATUS_ICONS[order.status]}</span>
                {order.status}
              </span>
              <div className="text-xs text-brown-mid/50 mt-2">
                {orderDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className="text-xs text-brown-mid/40">
                {orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Status description */}
          <div className={`text-sm px-4 py-3 rounded-xl mb-5 font-medium ${isCancelled ? 'bg-red-50 text-red-600' : isDelivered ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {STATUS_ICONS[order.status]} {STATUS_DESC[order.status]}
          </div>

          {/* Progress tracker */}
          {!isCancelled && (
            <>
              <div className="flex items-center">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all shadow-sm ${
                        i < stepIdx ? 'bg-saffron text-white' :
                        i === stepIdx ? 'bg-saffron text-white ring-4 ring-saffron/20' :
                        'bg-cream-mid text-brown-mid/30'
                      }`}>
                        {i < stepIdx ? '✓' : i === stepIdx ? STATUS_ICONS[step] : i + 1}
                      </div>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-1 mx-1 rounded-full transition-all ${i < stepIdx ? 'bg-saffron' : 'bg-cream-mid'}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {STATUS_STEPS.map((s, i) => (
                  <span key={s} className={`text-xs capitalize flex-1 text-center first:text-left last:text-right font-medium ${i <= stepIdx ? 'text-saffron' : 'text-brown-mid/40'}`}>
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Key info pills */}
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-saffron/8">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-cream-mid text-brown-dark">
              💳 {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-cream-mid text-brown-dark">
              📦 {order.items.reduce((s, i) => s + i.qty, 0)} item{order.items.reduce((s, i) => s + i.qty, 0) > 1 ? 's' : ''}
            </div>
            {order.promoCode && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                🎟️ {order.promoCode}
              </div>
            )}
            {order.paymentStatus && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                {order.paymentStatus === 'paid' ? '✅' : '⏳'} Payment {order.paymentStatus}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Card 2: Items + Pricing ── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="bg-white rounded-2xl border border-saffron/10"
        style={{ boxShadow: '0 4px 24px rgba(45,26,0,0.07)' }}>
        <div className="p-6">
          <h3 className="font-serif font-bold text-brown-dark text-lg mb-4 flex items-center gap-2">
            🛍️ Items Ordered
          </h3>
          <div className="space-y-0 divide-y divide-saffron/8">
            {order.items.map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}
                className="flex gap-4 items-center py-4">
                <div className="w-16 h-18 rounded-xl overflow-hidden flex-shrink-0 shadow-sm"
                  style={{ border: '1px solid rgba(224,112,0,0.1)' }}>
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-brown-dark text-sm">{item.name}</div>
                  <div className="text-xs text-brown-mid/60 mt-0.5">
                    Size: <span className="font-medium text-brown-dark">{item.size}</span>
                  </div>
                  <div className="text-xs text-brown-mid/60">
                    ₹{item.price} × {item.qty} = <span className="font-semibold text-brown-dark">₹{item.price * item.qty}</span>
                  </div>
                </div>
                <div className="font-black text-saffron text-base flex-shrink-0">₹{item.price * item.qty}</div>
              </motion.div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="mt-4 pt-4 border-t border-saffron/10 space-y-2">
            <div className="flex justify-between text-sm text-brown-mid/70">
              <span>Subtotal ({order.items.reduce((s, i) => s + i.qty, 0)} items)</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm text-brown-mid/70">
              <span>Delivery</span>
              <span className={order.shippingCharge === 0 ? 'text-green-600 font-semibold' : ''}>
                {order.shippingCharge === 0 ? '🎉 FREE' : `₹${order.shippingCharge}`}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-semibold">
                <span>🎟️ Promo Discount {order.promoCode && `(${order.promoCode})`}</span>
                <span>−₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-brown-dark text-lg border-t border-saffron/10 pt-3 mt-1">
              <span>Total</span>
              <span className="text-saffron">₹{order.total}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Card 3: Delivery + Payment Info ── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-saffron/10 overflow-hidden"
        style={{ boxShadow: '0 4px 24px rgba(45,26,0,0.07)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-saffron/10">
          {/* Delivery address */}
          <div className="p-6">
            <h3 className="font-serif font-bold text-brown-dark text-base mb-3 flex items-center gap-2">
              📍 Delivery Address
            </h3>
            <div className="text-sm text-brown-mid/70 leading-relaxed space-y-0.5">
              <div className="font-bold text-brown-dark text-base">{order.shippingAddress?.name}</div>
              <div>{order.shippingAddress?.street}</div>
              <div>{order.shippingAddress?.city}, {order.shippingAddress?.state}</div>
              <div className="font-medium text-brown-dark">PIN: {order.shippingAddress?.pincode}</div>
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-saffron/8">
                <span>📞</span>
                <span className="font-semibold text-brown-dark">{order.shippingAddress?.phone}</span>
              </div>
            </div>
          </div>

          {/* Payment info */}
          <div className="p-6">
            <h3 className="font-serif font-bold text-brown-dark text-base mb-3 flex items-center gap-2">
              💳 Payment Info
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-brown-mid/60">Method</span>
                <span className="font-semibold text-brown-dark">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-brown-mid/60">Status</span>
                <span className={`font-bold capitalize px-2 py-0.5 rounded-full text-xs ${
                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{order.paymentStatus || 'pending'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-brown-mid/60">Amount Paid</span>
                <span className="font-black text-saffron">₹{order.total}</span>
              </div>
              {order.notes && (
                <div className="mt-3 pt-3 border-t border-saffron/8">
                  <div className="text-xs text-brown-mid/50 font-semibold mb-1 uppercase tracking-wider">Order Notes</div>
                  <div className="text-sm text-brown-dark italic">"{order.notes}"</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Card 4: WhatsApp Support ── */}
      <WhatsAppSupportBox order={order} />

      {/* ── Bottom actions ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-3 justify-between items-center pt-2">
        <Link to="/orders"
          className="text-sm text-brown-mid/60 hover:text-brown-dark transition-colors font-medium flex items-center gap-1">
          ← Back to All Orders
        </Link>
        <Link to="/products"
          className="px-6 py-2.5 rounded-full font-bold text-white text-sm transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)', boxShadow: '0 4px 12px rgba(224,112,0,0.25)' }}>
          Order Again →
        </Link>
      </motion.div>
    </div>
  );
}

// ── Orders List ────────────────────────────────────────
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
      {[1, 2, 3].map((i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
    </div>
  );

  if (orders.length === 0) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">📦</div>
      <div className="font-serif font-bold text-brown-dark text-xl mb-2">No orders yet</div>
      <div className="text-brown-mid/60 text-sm mb-6">Looks like you haven't ordered anything yet!</div>
      <Link to="/products" className="btn-saffron px-8 py-3.5 font-bold">Start Shopping →</Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {orders.map((order, i) => {
        const shortId = order._id.slice(-8).toUpperCase();
        const isCancelled = order.status === 'cancelled';
        const isDelivered = order.status === 'delivered';
        return (
          <motion.div key={order._id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-saffron/10 overflow-hidden hover:shadow-lg transition-all group"
            style={{ boxShadow: '0 2px 16px rgba(45,26,0,0.06)' }}>
            {/* Status strip */}
            <div className="h-1 w-full" style={{
              background: isCancelled ? '#ef4444' : isDelivered ? '#22c55e' : 'linear-gradient(90deg,#e07000,#ff9010)'
            }} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-xs text-brown-mid/50 font-medium">Order #{shortId}</div>
                  <div className="font-serif font-bold text-brown-dark text-lg mt-0.5">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-brown-mid/50 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-brown-mid/40 mt-0.5">
                    {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border capitalize ${STATUS_COLORS[order.status]}`}>
                    {STATUS_ICONS[order.status]} {order.status}
                  </span>
                  <div className="font-black text-saffron text-xl mt-1.5">₹{order.total}</div>
                </div>
              </div>

              {/* Item thumbnails */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {order.items.slice(0, 5).map((item, j) => (
                  <div key={j} className="relative flex-shrink-0">
                    <img src={item.img} alt={item.name}
                      className="w-12 h-14 rounded-xl object-cover"
                      style={{ border: '1px solid rgba(224,112,0,0.15)' }} />
                    {item.qty > 1 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-saffron text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {item.qty}
                      </span>
                    )}
                  </div>
                ))}
                {order.items.length > 5 && (
                  <div className="w-12 h-14 rounded-xl bg-cream-mid flex items-center justify-center text-xs font-bold text-brown-mid flex-shrink-0">
                    +{order.items.length - 5}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-saffron/8">
                <Link to={`/orders/${order._id}`}
                  className="text-sm text-saffron font-bold hover:text-saffron-light transition-colors group-hover:underline">
                  View Details →
                </Link>
                {/* Mini WhatsApp quick link */}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! Issue with order #${shortId}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:-translate-y-0.5"
                  style={{ background: '#f0fdf4', color: '#128c7e', border: '1px solid #bbf7d0' }}>
                  <svg viewBox="0 0 32 32" width="12" height="12" fill="#25d366">
                    <path d="M16 0C7.163 0 0 7.163 0 16c0 2.82.736 5.46 2.027 7.754L0 32l8.454-2.016A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm7.27 19.455c-.398-.199-2.355-1.162-2.72-1.295-.365-.133-.63-.199-.895.199-.265.398-1.028 1.295-1.26 1.56-.232.265-.464.298-.862.1-.398-.2-1.681-.62-3.203-1.977-1.183-1.057-1.982-2.363-2.214-2.761-.232-.398-.025-.613.174-.81.179-.178.398-.464.597-.696.199-.232.265-.398.398-.664.133-.265.066-.497-.033-.696-.1-.199-.895-2.157-1.227-2.952-.323-.775-.65-.67-.895-.682-.231-.011-.497-.014-.762-.014a1.46 1.46 0 00-1.061.497c-.365.398-1.393 1.361-1.393 3.318s1.426 3.85 1.625 4.115c.199.265 2.806 4.282 6.796 6.003.95.41 1.692.655 2.27.838.954.304 1.822.261 2.508.158.765-.114 2.355-.963 2.687-1.893.332-.93.332-1.728.232-1.893-.1-.166-.365-.265-.763-.464z"/>
                  </svg>
                  Help
                </a>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function OrdersPage() {
  const { id } = useParams();
  return (
    <PageWrapper>
      <div className="min-h-screen bg-cream pb-20">
        <div className="pt-12 pb-8 px-6" style={{ background: 'linear-gradient(135deg,#3d1c00,#7a3300 60%,#e07000)' }}>
          <div className="max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-white/50 mb-3">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>›</span>
              {id && <><Link to="/orders" className="hover:text-white transition-colors">My Orders</Link><span>›</span></>}
              <span className="text-white">{id ? 'Order Details' : 'My Orders'}</span>
            </nav>
            <h1 className="font-serif font-black text-white text-3xl">{id ? 'Order Details' : 'My Orders'}</h1>
            {id && (
              <Link to="/orders" className="text-white/60 text-sm hover:text-white mt-1 inline-block transition-colors">
                ← All Orders
              </Link>
            )}
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {id ? <OrderDetail id={id} /> : <OrdersList />}
        </div>
      </div>
    </PageWrapper>
  );
}
