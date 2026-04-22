import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import api from '../services/api';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

const STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu & Kashmir',
  'Ladakh',
];

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  half,
  value,
  onChange,
  error,
}) {
  return (
    <div className={half ? 'flex-1 min-w-0' : 'w-full'}>
      <label className="block text-xs font-bold uppercase tracking-wider text-brown-dark mb-1.5">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full px-4 py-3 rounded-xl border text-sm bg-white text-brown-dark placeholder-brown-mid/40 outline-none transition-all ${
          error
            ? 'border-red-400 bg-red-50'
            : 'border-saffron/20 focus:border-saffron focus:ring-2 focus:ring-saffron/10'
        }`}
      />

      {error && (
        <p className="text-red-500 text-xs mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();

  const {
    items: cart = [],
    subtotal: cartTotal = 0,
    clearCart,
  } = useCart();

  const { user } = useAuth();

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
  });

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] =
    useState(null);

  const [promoLoading, setPromoLoading] =
    useState(false);

  const [promoError, setPromoError] =
    useState('');

  const [paymentMethod, setPaymentMethod] =
    useState('razorpay');

  const [processing, setProcessing] =
    useState(false);

  const [errors, setErrors] = useState({});

  const handleAddressChange =
    useCallback((e) => {
      const { name, value } = e.target;

      setAddress((prev) => ({
        ...prev,
        [name]: value,
      }));
    }, []);

  const subtotal = cartTotal;
  const discount =
    promoApplied?.discount || 0;

  const shipping =
    subtotal >= 499 ? 0 : 49;

  const total = Math.max(
    0,
    subtotal - discount + shipping
  );

  function validate() {
    const e = {};

    if (!address.fullName.trim())
      e.fullName = 'Name is required';

    if (
      !/^\d{10}$/.test(address.phone)
    )
      e.phone =
        'Enter valid 10-digit phone';

    if (!address.line1.trim())
      e.line1 = 'Address is required';

    if (!address.city.trim())
      e.city = 'City is required';

    if (!address.state)
      e.state = 'State is required';

    if (
      !/^\d{6}$/.test(
        address.pincode
      )
    )
      e.pincode =
        'Enter valid 6-digit pincode';

    setErrors(e);

    return (
      Object.keys(e).length === 0
    );
  }

  async function applyPromo() {
    if (!promoCode.trim()) return;

    setPromoLoading(true);
    setPromoError('');

    try {
      const res =
        await orderAPI.validatePromo(
          {
            code: promoCode,
            subtotal,
          }
        );

      setPromoApplied({
        discount:
          res.data.discount,
        message:
          res.data.message,
      });
    } catch (err) {
      setPromoError(
        err.response?.data
          ?.message ||
          'Invalid promo code'
      );

      setPromoApplied(null);
    } finally {
      setPromoLoading(false);
    }
  }

  async function placeCODOrder() {
    setProcessing(true);

    try {
      const res =
        await orderAPI.place({
          shippingAddress:
            address,
          paymentMethod:
            'COD',
          promoCode:
            promoApplied
              ? promoCode
              : '',
        });

      clearCart();

      navigate(
        `/orders/${res.data.order._id}`,
        {
          state: {
            success: true,
          },
        }
      );
    } catch (err) {
      alert(
        err.response?.data
          ?.message ||
          'Failed to place order.'
      );
    } finally {
      setProcessing(false);
    }
  }

  async function handleRazorpayPayment() {
    setProcessing(true);

    try {
      const loaded =
        await loadRazorpayScript();

      if (!loaded) {
        alert(
          'Failed to load payment gateway.'
        );

        setProcessing(false);
        return;
      }

      // Step 1: create payment order only
      const rzpRes =
        await api.post(
          '/api/payment/create-order',
          { amount: total }
        );

      const {
        order_id,
        amount,
        currency,
      } = rzpRes.data;

      const options = {
        key: import.meta.env
          .VITE_RAZORPAY_KEY_ID,

        amount,
        currency,

        name: 'Namdev Chiwada',

        description:
          'Secure Checkout',

        image: '/logo.png',

        order_id,

        handler:
          async function (
            response
          ) {
            try {
              // Step 2: verify payment
              const verifyRes =
                await api.post(
                  '/api/payment/verify',
                  {
                    razorpay_order_id:
                      response.razorpay_order_id,
                    razorpay_payment_id:
                      response.razorpay_payment_id,
                    razorpay_signature:
                      response.razorpay_signature,
                  }
                );

              if (
                verifyRes.data
                  .success
              ) {
                // Step 3: place real order after success
                const orderRes =
                  await orderAPI.place(
                    {
                      shippingAddress:
                        address,
                      paymentMethod:
                        'ONLINE',
                      paymentStatus:
                        'paid',
                      promoCode:
                        promoApplied
                          ? promoCode
                          : '',
                      razorpayOrderId:
                        response.razorpay_order_id,
                      razorpayPaymentId:
                        response.razorpay_payment_id,
                    }
                  );

                clearCart();

                navigate(
                  `/orders/${orderRes.data.order._id}`,
                  {
                    state: {
                      success: true,
                      paid: true,
                    },
                  }
                );
              } else {
                alert(
                  'Payment verification failed.'
                );
              }
            } catch {
              alert(
                'Payment verification failed.'
              );
            } finally {
              setProcessing(
                false
              );
            }
          },

        prefill: {
          name:
            address.fullName,
          contact:
            address.phone,
          email:
            user?.email ||
            '',
        },

        notes: {
          address: `${address.line1}, ${address.city}`,
        },

        theme: {
          color:
            '#e07000',
        },

        modal: {
          ondismiss:
            function () {
              setProcessing(
                false
              );
            },
        },
      };

      const rzp =
        new window.Razorpay(
          options
        );

      rzp.on(
        'payment.failed',
        function (
          response
        ) {
          alert(
            response.error
              ?.description ||
              'Payment failed'
          );

          setProcessing(
            false
          );
        }
      );

      rzp.open();
    } catch (err) {
      alert(
        err.response?.data
          ?.message ||
          'Payment failed.'
      );

      setProcessing(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    if (cart.length === 0) {
      alert(
        'Your cart is empty.'
      );
      return;
    }

    if (
      paymentMethod === 'cod'
    ) {
      await placeCODOrder();
    } else {
      await handleRazorpayPayment();
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-5xl">
          🛒
        </div>

        <p className="font-serif font-bold text-brown-dark text-xl">
          Your cart is empty
        </p>

        <button
          onClick={() =>
            navigate(
              '/products'
            )
          }
          className="px-6 py-3 rounded-full font-bold text-white"
          style={{
            background:
              'linear-gradient(135deg,#e07000,#ff9010)',
          }}
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <h1
          className="font-serif font-black text-brown-dark mb-8"
          style={{
            fontSize:
              'clamp(1.6rem,3vw,2.2rem)',
          }}
        >
          Checkout
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {/* Address */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-saffron/8">
                <h2 className="font-serif font-bold text-brown-dark text-lg mb-5">
                  📍 Delivery Address
                </h2>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Field
                      label="Full Name"
                      name="fullName"
                      half
                      value={
                        address.fullName
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="Aditya"
                      error={
                        errors.fullName
                      }
                    />

                    <Field
                      label="Phone"
                      name="phone"
                      type="tel"
                      half
                      value={
                        address.phone
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="9876543210"
                      error={
                        errors.phone
                      }
                    />
                  </div>

                  <Field
                    label="Address Line 1"
                    name="line1"
                    value={
                      address.line1
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="House no, street"
                    error={
                      errors.line1
                    }
                  />

                  <Field
                    label="Address Line 2"
                    name="line2"
                    value={
                      address.line2
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="Landmark"
                  />

                  <div className="flex gap-3">
                    <Field
                      label="City"
                      name="city"
                      half
                      value={
                        address.city
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="Solapur"
                      error={
                        errors.city
                      }
                    />

                    <Field
                      label="Pincode"
                      name="pincode"
                      half
                      value={
                        address.pincode
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="413001"
                      error={
                        errors.pincode
                      }
                    />
                  </div>

                  <select
                    name="state"
                    value={
                      address.state
                    }
                    onChange={
                      handleAddressChange
                    }
                    className="w-full px-4 py-3 rounded-xl border border-saffron/20"
                  >
                    {STATES.map(
                      (s) => (
                        <option
                          key={s}
                        >
                          {s}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-saffron/8">
                <h2 className="font-serif font-bold text-brown-dark text-lg mb-5">
                  💳 Payment Method
                </h2>

                <div className="space-y-3">
                  <label className="flex gap-3 p-4 border rounded-xl cursor-pointer">
                    <input
                      type="radio"
                      checked={
                        paymentMethod ===
                        'razorpay'
                      }
                      onChange={() =>
                        setPaymentMethod(
                          'razorpay'
                        )
                      }
                    />
                    Pay Online
                  </label>

                  <label className="flex gap-3 p-4 border rounded-xl cursor-pointer">
                    <input
                      type="radio"
                      checked={
                        paymentMethod ===
                        'cod'
                      }
                      onChange={() =>
                        setPaymentMethod(
                          'cod'
                        )
                      }
                    />
                    Cash on Delivery
                  </label>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-saffron/8">
                <h2 className="font-serif font-bold text-brown-dark text-lg mb-5">
                  🧾 Order Summary
                </h2>

                <div className="space-y-3 mb-5">
                  {cart.map(
                    (
                      item,
                      i
                    ) => (
                      <div
                        key={i}
                        className="flex justify-between"
                      >
                        <span>
                          {
                            item.name
                          }{' '}
                          ×{' '}
                          {
                            item.qty
                          }
                        </span>
                        <span>
                          ₹
                          {(
                            item.price *
                            item.qty
                          ).toLocaleString()}
                        </span>
                      </div>
                    )
                  )}
                </div>

                <div className="space-y-2 text-sm mb-6">
                  <div className="flex justify-between">
                    <span>
                      Subtotal
                    </span>
                    <span>
                      ₹
                      {subtotal.toLocaleString()}
                    </span>
                  </div>

                  {discount >
                    0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount
                      </span>
                      <span>
                        -₹
                        {discount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>
                      Shipping
                    </span>
                    <span>
                      {shipping ===
                      0
                        ? 'FREE'
                        : `₹${shipping}`}
                    </span>
                  </div>

                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>
                      Total
                    </span>
                    <span>
                      ₹
                      {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    processing
                  }
                  className="w-full py-4 rounded-full font-bold text-white"
                  style={{
                    background:
                      'linear-gradient(135deg,#e07000,#ff9010)',
                  }}
                >
                  {processing
                    ? 'Processing...'
                    : paymentMethod ===
                      'razorpay'
                    ? `Pay ₹${total.toLocaleString()}`
                    : `Place Order ₹${total.toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}