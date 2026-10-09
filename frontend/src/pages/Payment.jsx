import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Landmark,
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const POPULAR_BANKS = [
  { id: 'sbi', name: 'State Bank of India', code: 'SBI', popular: true },
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC', popular: true },
  { id: 'icici', name: 'ICICI Bank', code: 'ICICI', popular: true },
  { id: 'axis', name: 'Axis Bank', code: 'AXIS', popular: true },
  { id: 'kotak', name: 'Kotak Mahindra Bank', code: 'KOTAK', popular: false },
  { id: 'pnb', name: 'Punjab National Bank', code: 'PNB', popular: false },
];

export default function Payment() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const navigate = useNavigate();
  const { clearBuyNow, fetchCart } = useCart();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState('sbi');
  const [accountHolder, setAccountHolder] = useState(user?.name || '');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        navigate('/orders');
        return;
      }
      try {
        setLoading(true);
        const res = await api.get(`/orders/${orderId}`);
        if (res.data.success) {
          setOrder(res.data.order);
          setAccountHolder(res.data.order.customer_name);
        }
      } catch (err) {
        setErrorMsg('Failed to load order for payment.');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId, navigate]);

  const handlePayNow = async (e) => {
    e.preventDefault();

    const bankObj = POPULAR_BANKS.find((b) => b.id === selectedBank);
    const bankName = bankObj ? bankObj.name : 'State Bank of India';

    try {
      setProcessing(true);
      setErrorMsg('');

      // Simulate a realistic 1.2s bank gateway handshake
      await new Promise((r) => setTimeout(r, 1200));

      const res = await api.post('/payments', {
        orderId: parseInt(orderId, 10),
        paymentMethod: 'Net Banking',
        bankName,
        accountName: accountHolder || order?.customer_name,
        amount: order?.total_amount,
      });

      if (res.data.success) {
        // Clear any stored buyNow state
        clearBuyNow();
        // Refresh cart in context
        await fetchCart();

        navigate(
          `/order-success?orderId=${orderId}&txn=${encodeURIComponent(
            res.data.payment.transactionId
          )}`
        );
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Payment simulation failed. Please retry.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Initializing secure payment gateway...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          Demo 256-Bit SSL Net Banking
        </div>
        <h1 className="text-3xl font-black text-slate-900">
          JegaMart Express Payment
        </h1>
        <p className="text-sm text-slate-500">
          Select your bank to complete mock payment for Order #{orderId}
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Payment Container */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8">
        
        {/* Order Amount Recap */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Payable Amount
            </span>
            <div className="text-2xl sm:text-3xl font-black text-primary-600">
              ₹{parseFloat(order?.total_amount).toFixed(2)}
            </div>
          </div>
          <div className="text-xs text-slate-500 sm:text-right">
            <p>Order ID: <strong className="text-slate-800">#{order?.id}</strong></p>
            <p>Customer: <strong className="text-slate-800">{order?.customer_name}</strong></p>
            <p className="text-emerald-600 font-semibold">Payment Status: PENDING CONFIRMATION</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handlePayNow} className="space-y-6">
          
          {/* Account Holder Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Account / Customer Name
            </label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              required
              placeholder="Name on bank account"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
            />
          </div>

          {/* Bank Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Choose Net Banking Bank
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {POPULAR_BANKS.map((bank) => {
                const isSelected = selectedBank === bank.id;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => setSelectedBank(bank.id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                        <Landmark className="w-4 h-4 text-primary-600" />
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-600" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{bank.name}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{bank.code}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pay Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={processing}
              className="w-full py-4 px-6 bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 hover:from-primary-700 hover:to-accent-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-base rounded-2xl shadow-lg shadow-primary-600/30 transition-all flex items-center justify-center gap-3"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Net Banking Demo...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    Pay ₹{parseFloat(order?.total_amount).toFixed(2)} via{' '}
                    {POPULAR_BANKS.find((b) => b.id === selectedBank)?.code} Net Banking
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Disclaimers */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">Academic Demo Simulation Notice</p>
          <p>
            This is a mock Net Banking payment flow for academic evaluation of JegaMart. No real money will be charged or deducted. Clicking "Pay" will simulate a successful banking transaction and create confirmed order records in the MySQL database.
          </p>
        </div>
      </div>
    </div>
  );
}
