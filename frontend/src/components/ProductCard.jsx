import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap, Check } from 'lucide-react';
import StockBadge from './StockBadge';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductCard({ product }) {
  const { addToCart, setDirectBuyNow } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isOutOfStock) return;

    try {
      setAdding(true);
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      alert(err.message || 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isOutOfStock) return;

    // Direct Buy Now flow
    setDirectBuyNow(product, 1);
    navigate('/checkout?buyNow=true');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group">
      {/* Product Image Container */}
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden aspect-square bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Discount Badge */}
        {product.discount_percentage > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-purple-600 to-primary-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-sm">
            {product.discount_percentage}% OFF
          </div>
        )}

        {/* Category Tag */}
        <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border border-slate-200/60 shadow-xs">
          {product.category}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <Link
          to={`/product/${product.id}`}
          className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 line-clamp-2 min-h-[40px] leading-snug transition-colors mb-2"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Stock status */}
        <div className="mb-3">
          <StockBadge stock={product.stock} />
        </div>

        {/* Price Section */}
        <div className="mt-auto pt-2 border-t border-slate-100 flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">₹{parseFloat(product.price).toFixed(2)}</span>
            {parseFloat(product.original_price) > parseFloat(product.price) && (
              <span className="text-xs text-slate-400 line-through">
                ₹{parseFloat(product.original_price).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Dual Actions: Add to Cart & Buy Now */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white'
                : 'bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200 border border-primary-200'
            }`}
            title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{adding ? 'Adding...' : 'Add to Cart'}</span>
              </>
            )}
          </button>

          {/* Buy Now Button */}
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 active:scale-95 text-white shadow-primary-600/20'
            }`}
            title={isOutOfStock ? 'Out of Stock' : 'Buy directly without cart'}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
