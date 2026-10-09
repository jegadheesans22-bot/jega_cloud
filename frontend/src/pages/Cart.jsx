import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Bookmark,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const {
    cartItems,
    savedItems,
    summary,
    loading,
    updateQuantity,
    toggleSaveForLater,
    removeFromCart,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign In to View Your Cart</h2>
        <p className="text-xs text-slate-500">
          Your saved items and cart history will appear here once you log in.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl text-xs shadow-sm hover:bg-primary-700"
        >
          Log In to JegaMart
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {summary.itemCount} items currently in your grocery bag
          </p>
        </div>
        <Link
          to="/products"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>

      {/* Main Grid: Items vs Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Active Cart & Saved for Later */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active Cart Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary-600" />
              Cart Items ({cartItems.length})
            </h2>

            {cartItems.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Explore fresh groceries, daily essentials, and snacks on JegaMart today.
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  Start Shopping
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => (
                  <div
                    key={item.cart_id}
                    className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    {/* Thumbnail & Title */}
                    <div className="flex items-center gap-4 flex-1">
                      <Link
                        to={`/product/${item.product_id}`}
                        className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                        <Link
                          to={`/product/${item.product_id}`}
                          className="block text-sm font-bold text-slate-900 hover:text-primary-600 transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-extrabold text-slate-900">
                            ₹{parseFloat(item.price).toFixed(2)}
                          </span>
                          {parseFloat(item.original_price) > parseFloat(item.price) && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{parseFloat(item.original_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Item Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                        <button
                          onClick={() => updateQuantity(item.cart_id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 transition-colors"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cart_id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 transition-colors"
                          title="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-sm font-bold text-slate-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {/* Actions: Save for later & Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleSaveForLater(item.cart_id, true)}
                          className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                          title="Save for Later"
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.cart_id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save for Later Section */}
          {savedItems.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-purple-600" />
                Saved for Later ({savedItems.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedItems.map((saved) => (
                  <div
                    key={saved.cart_id}
                    className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={saved.image}
                        alt={saved.name}
                        className="w-14 h-14 object-cover rounded-xl bg-slate-100"
                      />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {saved.name}
                        </h4>
                        <p className="text-xs font-extrabold text-primary-600">
                          ₹{parseFloat(saved.price).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => toggleSaveForLater(saved.cart_id, false)}
                        className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-xs font-bold transition-colors"
                      >
                        Move to Cart
                      </button>
                      <button
                        onClick={() => removeFromCart(saved.cart_id)}
                        className="text-[11px] text-slate-400 hover:text-red-500 font-medium text-center"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Price Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-24">
            <h3 className="text-base font-bold text-slate-900 pb-4 border-b border-slate-100">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-800">
                  ₹{summary.originalSubtotal.toFixed(2)}
                </span>
              </div>

              {summary.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Special Discount</span>
                  <span>- ₹{summary.discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-semibold text-slate-800">
                  {summary.deliveryCharge === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase text-xs">FREE</span>
                  ) : (
                    `₹${summary.deliveryCharge.toFixed(2)}`
                  )}
                </span>
              </div>

              {summary.subtotal < 500 && summary.subtotal > 0 && (
                <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg">
                  💡 Add ₹{(500 - summary.subtotal).toFixed(2)} more for <strong>FREE Delivery</strong>!
                </p>
              )}

              <div className="border-t border-slate-200 pt-3 flex justify-between text-base sm:text-lg font-black text-slate-900">
                <span>Total Amount</span>
                <span className="text-primary-600">₹{summary.finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => navigate('/checkout')}
              disabled={cartItems.length === 0}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md shadow-primary-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Micro Guarantees */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary-600" />
                <span>Superfast delivery to your home</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Safe and hygienic contactless delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
