import React, { useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  PackageCheck,
  Truck,
  ArrowRight,
  ShoppingBag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const txnId = searchParams.get('txn') || 'JM-TXN-DEMO-SUCCESS';
  const { fetchCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center space-y-8">
        
        {/* Success Icon */}
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-12 h-12 stroke-[2.2]" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            Order Placed Successfully!
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Thank you for shopping at <strong>JegaMart</strong>. Your grocery order has been confirmed and is being packed for delivery.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="max-w-md mx-auto bg-slate-50 rounded-2xl border border-slate-200 p-5 text-left space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Order Reference:</span>
            <span className="font-extrabold text-slate-900 text-sm">#{orderId}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Demo Transaction ID:</span>
            <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
              {txnId}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Payment Method:</span>
            <span className="font-bold text-emerald-600">Net Banking (Verified)</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Order Status:</span>
            <span className="inline-flex items-center gap-1 font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-ping" />
              CONFIRMED
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
          {orderId && (
            <Link
              to={`/order-track/${orderId}`}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md shadow-primary-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Track Order Live</span>
            </Link>
          )}

          <Link
            to="/orders"
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <PackageCheck className="w-4 h-4" />
            <span>My Order History</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping on JegaMart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
