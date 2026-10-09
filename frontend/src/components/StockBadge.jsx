import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function StockBadge({ stock }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5 text-rose-500" />
        Out of Stock
      </span>
    );
  }

  if (stock < 10) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        Only {stock} left!
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
      In Stock
    </span>
  );
}
