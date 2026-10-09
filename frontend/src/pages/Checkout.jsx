import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  MapPin,
  Truck,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const isBuyNow = searchParams.get('buyNow') === 'true';

  const { cartItems, summary, buyNowData } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    phone: '',
    address: '',
    city: 'Chennai',
    pincode: '600001',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Determine which items to checkout
  const activeItems = isBuyNow && buyNowData
    ? [
        {
          product_id: buyNowData.product.id,
          name: buyNowData.product.name,
          category: buyNowData.product.category,
          price: buyNowData.product.price,
          quantity: buyNowData.quantity,
          image: buyNowData.product.image,
        },
      ]
    : cartItems;

  const checkoutSummary = isBuyNow && buyNowData
    ? {
        subtotal: buyNowData.subtotal,
        discount: buyNowData.discount,
        deliveryCharge: buyNowData.deliveryCharge,
        finalTotal: buyNowData.finalTotal,
        itemCount: buyNowData.quantity,
      }
    : summary;

  // Redirect if no items
  useEffect(() => {
    if (isBuyNow && !buyNowData) {
      navigate('/products');
    } else if (!isBuyNow && cartItems.length === 0) {
      navigate('/cart');
    }
  }, [isBuyNow, buyNowData, cartItems, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!formData.customerName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMsg('Please fill in all mandatory customer and delivery details.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const payload = {
        customerName: formData.customerName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        isBuyNow,
        buyNowItem: isBuyNow && buyNowData ? {
          productId: buyNowData.product.id,
          quantity: buyNowData.quantity,
        } : null,
      };

      const res = await api.post('/orders', payload);

      if (res.data.success) {
        // Direct to Payment screen with generated orderId
        navigate(`/payment?orderId=${res.data.orderId}`);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to initialize order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isBuyNow ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                <Zap className="w-3.5 h-3.5 fill-current" />
                Direct Express Checkout
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                <ShoppingBag className="w-3.5 h-3.5" />
                Cart Checkout
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Delivery & Order Checkout
          </h1>
        </div>
        <Link
          to={isBuyNow ? '/products' : '/cart'}
          className="text-xs font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          {isBuyNow ? 'Cancel Buy Now' : 'Back to Cart'}
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Delivery Address */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Delivery Information</h2>
              <p className="text-xs text-slate-500">Where should JegaMart dispatch your order?</p>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} id="checkout-form" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Ranjith Kumar"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mobile Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Delivery Street Address / Flat / Floor *
              </label>
              <textarea
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Apartment #, Street name, Landmark..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  City / Town *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Postal Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 600001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-2 text-xs text-purple-700">
                <Truck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>Express grocery delivery with real-time tracking will activate after order placement.</span>
              </div>
            </div>
          </form>
        </div>

        {/* Right Summary: Items & Total */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Items in this Order ({activeItems.length})</span>
              {isBuyNow && (
                <span className="text-[11px] font-bold text-primary-600">Buy Now Item</span>
              )}
            </h3>

            {/* Items Mini List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2">
              {activeItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 pt-2">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Qty: {item.quantity} × ₹{parseFloat(item.price).toFixed(2)}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">
                  ₹{checkoutSummary.subtotal.toFixed(2)}
                </span>
              </div>

              {checkoutSummary.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Savings Applied</span>
                  <span>- ₹{checkoutSummary.discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-semibold text-slate-800">
                  {checkoutSummary.deliveryCharge === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase text-xs">FREE</span>
                  ) : (
                    `₹${checkoutSummary.deliveryCharge.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-black text-slate-900">
                <span>Total to Pay</span>
                <span className="text-primary-600 text-lg">
                  ₹{checkoutSummary.finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Continue to Payment CTA */}
            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 active:scale-95 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-primary-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{submitting ? 'Creating Order...' : 'Continue to Payment'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Next step: Mock Net Banking payment confirmation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
