import React from 'react';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';

const STAGES = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Received and registered at JegaMart' },
  { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Payment verified & order acknowledged' },
  { key: 'PACKED', label: 'Packed & Quality Checked', desc: 'Sealed safely in eco-friendly bags' },
  { key: 'SHIPPED', label: 'Shipped from Hub', desc: 'Dispatched to your local delivery center' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Delivery partner is en route to your address' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Handed over successfully' },
];

export default function OrderTimeline({ currentStatus = 'PLACED', timelineData = [] }) {
  const currentIdx = STAGES.findIndex((s) => s.key === currentStatus);
  const activeIndex = currentIdx >= 0 ? currentIdx : 0;

  const getStageMeta = (key) => {
    if (timelineData && timelineData.length > 0) {
      return timelineData.find((t) => t.status === key);
    }
    return null;
  };

  return (
    <div className="py-6 px-4 sm:px-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Live Delivery Tracker</h3>
          <p className="text-xs text-slate-500">Real-time status updates from JegaMart logistics</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200">
          <span className="w-2 h-2 rounded-full bg-primary-600 animate-ping" />
          Status: {currentStatus.replace(/_/g, ' ')}
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-9 sm:before:left-11 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const isUpcoming = idx > activeIndex;
          const meta = getStageMeta(stage.key);

          return (
            <div key={stage.key} className="relative flex items-start gap-4 sm:gap-6 group">
              {/* Step Icon Badge */}
              <div
                className={`relative z-10 flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : isCurrent
                    ? 'bg-gradient-to-tr from-primary-600 to-accent-600 text-white ring-4 ring-primary-100 shadow-primary-500/30 animate-pulse'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                ) : isCurrent ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                ) : (
                  <span className="text-xs">{idx + 1}</span>
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1 pt-0.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4
                    className={`text-sm font-bold transition-colors ${
                      isCurrent
                        ? 'text-primary-600 text-base'
                        : isCompleted
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </h4>

                  {meta?.timestamp && (
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(meta.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>

                <p
                  className={`text-xs mt-1 leading-relaxed ${
                    isCurrent ? 'text-slate-600 font-medium' : 'text-slate-400'
                  }`}
                >
                  {meta?.notes || stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
