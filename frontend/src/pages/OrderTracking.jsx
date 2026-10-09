import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Truck,
  ArrowLeft,
  MapPin,
  Calendar,
  CreditCard,
  Package,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import api from '../services/api';
import OrderTimeline from '../components/OrderTimeline';
import { useAuth } from '../context/AuthContext';

export default function OrderTracking() {
  const { id } = useParams();
  const { isSeller } = useAuth();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}/track`);
      if (res.data.success) {
        setTrackingData(res.data.tracking);
        setSelectedNewStatus(res.data.tracking.currentStatus);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch order tracking info.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [id]);

  // Seller Quick Status Update Helper
  const handleStatusUpdate = async () => {
    if (!selectedNewStatus) return;
    try {
      setUpdatingStatus(true);
      const res = await api.put(`/orders/${id}/status`, {
        status: selectedNewStatus,
        notes: `Status changed to ${selectedNewStatus} via JegaMart dashboard.`,
      });
      if (res.data.success) {
        await fetchTracking();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Connecting to JegaMart logistics network...</p>
      </div>
    );
  }

  if (errorMsg || !trackingData) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Order Tracking Unavailable</h2>
        <p className="text-xs text-slate-500">
          {errorMsg || 'We could not retrieve live tracking data for this order reference.'}
        </p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            to="/orders"
            className="text-xs font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Orders
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Order Tracking #{trackingData.orderId}
          </h1>
          <p className="text-xs text-slate-500">
            Placed on{' '}
            {new Date(trackingData.createdAt).toLocaleDateString([], {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <button
          onClick={fetchTracking}
          className="self-start sm:self-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
          title="Refresh Live Status"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Tracker</span>
        </button>
      </div>

      {/* Seller Quick Control Bar (if user is seller) */}
      {isSeller && (
        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
            <div>
              <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Seller Order Control Tool
              </h4>
              <p className="text-xs text-purple-700">
                You can change the tracking status right here to test buyer tracking updates in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedNewStatus}
              onChange={(e) => setSelectedNewStatus(e.target.value)}
              className="bg-white border border-purple-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-400"
            >
              <option value="PLACED">PLACED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PACKED">PACKED</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>

            <button
              onClick={handleStatusUpdate}
              disabled={updatingStatus || selectedNewStatus === trackingData.currentStatus}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
            >
              {updatingStatus ? 'Saving...' : 'Update Status'}
            </button>
          </div>
        </div>
      )}

      {/* Visual Timeline Component */}
      <OrderTimeline
        currentStatus={trackingData.currentStatus}
        timelineData={trackingData.timeline}
      />

      {/* Shipping & Order Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Destination Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MapPin className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-sm text-slate-900">Delivery Address</h3>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900 text-sm">{trackingData.customerName}</p>
            <p className="leading-relaxed">{trackingData.address}</p>
            <p className="pt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified JegaMart Delivery Location
            </p>
          </div>
        </div>

        {/* Payment & Invoice Summary Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900">Payment & Billing</h3>
          </div>
          <div className="text-xs text-slate-600 space-y-2">
            <div className="flex justify-between">
              <span>Total Amount Paid:</span>
              <span className="font-extrabold text-slate-900 text-sm">
                ₹{parseFloat(trackingData.totalAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <span className="font-semibold text-slate-800">
                {trackingData.payment?.payment_method || 'Net Banking'}
              </span>
            </div>
            {trackingData.payment?.transaction_id && (
              <div className="flex justify-between items-center pt-1">
                <span>Demo Txn ID:</span>
                <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {trackingData.payment.transaction_id}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Payment Status:</span>
              <span className="font-bold text-emerald-600">CONFIRMED SUCCESS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items In this Delivery */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary-600" />
          Package Contents ({trackingData.items?.length || 0} items)
        </h3>

        <div className="divide-y divide-slate-100">
          {trackingData.items?.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'}
                  alt={item.product_name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200"
                />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {item.product_name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Quantity: {item.quantity} × ₹{parseFloat(item.price).toFixed(2)}
                  </p>
                </div>
              </div>

              <span className="text-xs sm:text-sm font-bold text-slate-900">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
