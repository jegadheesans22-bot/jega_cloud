import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageCheck,
  Truck,
  ArrowRight,
  Clock,
  Calendar,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await api.get('/orders');
        if (res.data.success) {
          setOrders(res.data.orders);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'OUT_FOR_DELIVERY':
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PACKED':
      case 'CONFIRMED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            My Orders & Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track past grocery orders, delivery updates, and invoices
          </p>
        </div>
        <Link
          to="/products"
          className="text-xs font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 self-start sm:self-auto"
        >
          <ShoppingBag className="w-4 h-4" />
          Shop More Items
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl h-44 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <PackageCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Orders Yet</h3>
          <p className="text-sm text-slate-500">
            You haven't placed any grocery orders on JegaMart yet.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Explore Groceries Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-all"
            >
              {/* Order Header */}
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Order ID</span>
                    <span className="font-extrabold text-slate-900 text-sm">#{order.id}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Placed</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(order.created_at).toLocaleDateString([], {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Amount</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      ₹{parseFloat(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadgeClass(
                      order.status
                    )}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    {order.status.replace(/_/g, ' ')}
                  </span>

                  {/* Track Order Button */}
                  <Link
                    to={`/order-track/${order.id}`}
                    className="px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm shadow-primary-600/20 transition-all flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track Order</span>
                  </Link>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="p-6">
                <div className="divide-y divide-slate-100">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'}
                          alt={item.product_name}
                          className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200"
                        />
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {item.product_name}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Qty: {item.quantity} × ₹{parseFloat(item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Info */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                  <p>
                    Delivery Destination: <strong className="text-slate-700">{order.customer_name}</strong> ({order.city} - {order.pincode})
                  </p>
                  <p>
                    Payment: <span className="font-semibold text-emerald-600">{order.payment_method || 'Net Banking (Success)'}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
