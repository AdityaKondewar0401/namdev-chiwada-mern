import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ORDER_STATUS_COLORS, STATUS_STEPS } from './accountConstants';

// ─────────────────────────────────────────────
// OrdersTab
//
// Data fetching moved up to AccountPage (see that file) so the
// header stats strip and this tab share one fetch instead of two.
//
// New: a compact visual status stepper under each order's status
// pill — dots + connecting line showing progress through
// pending → confirmed → processing → shipped → delivered, or a
// plain "cancelled" notice for cancelled orders. Built entirely
// from the existing `order.status` field, no new data needed.
// ─────────────────────────────────────────────

function StatusStepper({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold mt-3" style={{ color: '#991b1b' }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />
        This order was cancelled
      </div>
    );
  }

  const currentIndex = Math.max(STATUS_STEPS.indexOf(status), 0);

  return (
    <div className="mt-3">
      <div className="flex items-center">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentIndex;
          return (
            <div key={step} className="flex items-center" style={{ flex: i < STATUS_STEPS.length - 1 ? 1 : '0 0 auto' }}>
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                style={{ background: done ? '#e07000' : '#f0e6d6' }}
              >
                {done ? '✓' : ''}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-1"
                  style={{ background: i < currentIndex ? '#e07000' : '#f0e6d6', minWidth: 8 }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-[11px] font-semibold mt-1.5 capitalize" style={{ color: '#7a5a38' }}>
        Current status: <span style={{ color: '#e07000' }}>{status}</span>
      </div>
    </div>
  );
}

export default function OrdersTab({ orders, loading }) {
  const [expanded, setExpanded] = useState(null);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="font-serif font-bold text-brown-dark text-xl mb-2">No orders yet</h3>
        <p className="text-brown-mid/60 text-sm mb-6">Start shopping to see your orders here</p>
        <Link to="/products" className="inline-block px-6 py-3 rounded-full font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg,#e07000,#ff9010)' }}>
          Browse Products →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif font-black text-brown-dark text-2xl mb-6">
        My Orders <span className="text-lg text-brown-mid/50 font-normal">({orders.length})</span>
      </h2>

      <div className="space-y-4">
        {orders.map((order) => {
          const sc = ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.pending;
          const isOpen = expanded === order._id;

          return (
            <div key={order._id} className="bg-white rounded-2xl overflow-hidden transition-all"
              style={{ boxShadow: '0 4px 20px rgba(45,26,0,0.06)', border: '1px solid rgba(224,112,0,0.08)' }}>

              {/* Order header */}
              <div className="p-4 sm:p-5 cursor-pointer" onClick={() => setExpanded(isOpen ? null : order._id)}>
                <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <img key={i} src={item.img} alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white flex-shrink-0" />
                      ))}
                      {order.items?.length > 3 && (
                        <div className="w-12 h-12 rounded-xl border-2 border-white flex items-center justify-center text-xs font-bold text-brown-mid"
                          style={{ background: '#fef3e0' }}>
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-brown-dark text-sm">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </div>
                      <div className="text-xs text-brown-mid/60 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        · {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="font-black text-saffron text-base">₹{order.total}</div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1.5"
                      style={{ background: sc.bg, color: sc.text }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                      {order.status}
                    </span>
                    <svg className={`w-4 h-4 text-brown-mid/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Status stepper — new */}
                <StatusStepper status={order.status} />
              </div>

              {/* Expanded order details */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <div className="border-t px-4 sm:px-5 pb-5 pt-4" style={{ borderColor: 'rgba(224,112,0,0.08)', background: '#fffdf7' }}>

                      <div className="space-y-3 mb-4">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <img src={item.img} alt={item.name}
                              className="w-14 h-16 rounded-xl object-cover flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-semibold text-brown-dark text-sm">{item.name}</div>
                              <div className="text-xs text-brown-mid/60">{item.size} × {item.qty}</div>
                            </div>
                            <div className="font-bold text-saffron">₹{item.price * item.qty}</div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl p-4 text-sm space-y-1.5" style={{ background: '#fef3e0' }}>
                        <div className="flex justify-between text-brown-mid/70">
                          <span>Subtotal</span><span>₹{order.subtotal}</span>
                        </div>
                        <div className="flex justify-between text-brown-mid/70">
                          <span>Delivery</span>
                          <span className={order.shippingCharge === 0 ? 'text-green-600 font-semibold' : ''}>
                            {order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`}
                          </span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span><span>−₹{order.discount}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-black text-brown-dark border-t pt-1.5"
                          style={{ borderColor: 'rgba(224,112,0,0.15)' }}>
                          <span>Total</span><span>₹{order.total}</span>
                        </div>
                      </div>

                      {order.shippingAddress && (
                        <div className="mt-3 text-xs text-brown-mid/60">
                          <span className="font-semibold text-brown-dark">Delivered to: </span>
                          {order.shippingAddress.name}, {order.shippingAddress.street}, {order.shippingAddress.city} – {order.shippingAddress.pincode}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}