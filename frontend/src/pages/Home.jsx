import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Flame,
  ShoppingBag,
  Clock,
  ShieldCheck,
  Truck,
  Apple,
  Coffee,
  Sparkle,
  IceCream,
  Cookie,
  BookOpen,
  Heart,
  TrendingUp,
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        // Load discounted deals
        const dealsRes = await api.get('/products?sort=discount&limit=6');
        if (dealsRes.data.success) {
          setDiscountedProducts(dealsRes.data.products);
        }

        // Load popular / featured products
        const popRes = await api.get('/products?limit=12');
        if (popRes.data.success) {
          setPopularProducts(popRes.data.products);
        }
      } catch (err) {
        console.error('Failed to load home page products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const categories = [
    { name: 'Grocery', icon: Apple, color: 'bg-emerald-500/10 text-emerald-600', count: 'Flour, Rice, Dal & Oil' },
    { name: 'Fragrance', icon: Sparkle, color: 'bg-purple-500/10 text-purple-600', count: 'Perfumes & Sprays' },
    { name: 'Juice', icon: Coffee, color: 'bg-amber-500/10 text-amber-600', count: 'Fresh Mango, Orange & Berry' },
    { name: 'Ice Cream', icon: IceCream, color: 'bg-rose-500/10 text-rose-600', count: 'Vanilla, Truffle & Berry' },
    { name: 'Snacks', icon: Cookie, color: 'bg-orange-500/10 text-orange-600', count: 'Chips, Cookies & Popcorn' },
    { name: 'Stationery', icon: BookOpen, color: 'bg-blue-500/10 text-blue-600', count: 'Journals, Pens & Sets' },
    { name: 'Makeup', icon: Heart, color: 'bg-pink-500/10 text-pink-600', count: 'Lipsticks, Kajal & Compact' },
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-700 to-accent-800 text-white shadow-xl mx-4 sm:mx-6 lg:mx-8 mt-6">
        {/* Background decorative glows */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-accent-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 rounded-full bg-primary-400/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-primary-200">
              <Sparkles className="w-4 h-4 text-amber-300" />
              India's Modern Digital Supermarket
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              Fresh Essentials.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-purple-200">
                Better Prices.
              </span>{' '}
              Delivered Fast.
            </h1>

            <p className="text-base sm:text-lg text-primary-100 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Order fresh daily groceries, pantry staples, refreshing cold juices, artisanal treats, stationery, and beauty essentials from JegaMart.
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2">
              <Link
                to="/products"
                className="px-8 py-3.5 bg-white text-primary-700 hover:bg-slate-50 active:scale-95 font-bold rounded-2xl shadow-lg shadow-black/10 transition-all flex items-center gap-2 group"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/products?sort=discount"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold rounded-2xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Today's Offers</span>
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-xs font-medium text-primary-200">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-300" />
                <span>Fast Home Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-300" />
                <span>100% Genuine Items</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-300" />
                <span>Live Order Tracker</span>
              </div>
            </div>
          </div>

          {/* Hero Image Showcase */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
                alt="Fresh Supermarket Essentials"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md text-slate-800 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                      JegaMart Mega Savings
                    </p>
                    <p className="text-sm font-extrabold text-slate-900">Up to 35% OFF This Week</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg">
                    Special Deals
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary-600 uppercase tracking-widest mb-1">
              <ShoppingBag className="w-4 h-4" />
              Curated Departments
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Explore Product Categories
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:text-primary-700"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {categories.map((cat) => {
            const IconComp = cat.icon;
            return (
              <Link
                key={cat.name}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="group bg-white rounded-2xl border border-slate-200 p-4 flex flex-col items-center text-center hover:border-primary-400 hover:shadow-md transition-all duration-200"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}
                >
                  <IconComp className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-primary-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{cat.count}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Special Offers & Discount Deals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 rounded-3xl p-6 sm:p-10 border border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
                <Flame className="w-3.5 h-3.5 fill-purple-600" />
                Best Value Super Saver Deals
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Top Discounts on JegaMart
              </h2>
            </div>
            <Link
              to="/products?sort=discount"
              className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 hover:text-primary-700"
            >
              <span>See More Deals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {discountedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Products Responsive Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary-600 uppercase tracking-widest mb-1">
              <TrendingUp className="w-4 h-4" />
              Customer Favorites
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Popular Grocery & Daily Items
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:text-primary-700"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
