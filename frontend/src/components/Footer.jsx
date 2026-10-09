import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, Clock, RefreshCw, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      {/* Value Badges Banner */}
      <div className="border-b border-slate-100 bg-slate-50/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Express Delivery</h4>
              <p className="text-xs text-slate-500">Fast and fresh directly to your doorstep</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">100% Quality Assurance</h4>
              <p className="text-xs text-slate-500">Only verified organic & fresh essentials</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Live Order Tracking</h4>
              <p className="text-xs text-slate-500">Real-time step-by-step order updates</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Instant Demo Banking</h4>
              <p className="text-xs text-slate-500">Simulated Net Banking with top Indian banks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-600 flex items-center justify-center text-white shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-slate-900">
                Jega<span className="text-primary-600">Mart</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              Fresh Essentials. Better Prices. Delivered Fast. JegaMart is a modern grocery and daily essentials e-commerce platform built for high-performance shopping.
            </p>
          </div>

          {/* Quick Categories */}
          <div>
            <h5 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
              Departments
            </h5>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/products?category=Grocery" className="hover:text-primary-600 transition-colors">
                  Daily Grocery & Staples
                </Link>
              </li>
              <li>
                <Link to="/products?category=Juice" className="hover:text-primary-600 transition-colors">
                  Fresh Cold Juices
                </Link>
              </li>
              <li>
                <Link to="/products?category=Snacks" className="hover:text-primary-600 transition-colors">
                  Crispy Snacks & Biscuits
                </Link>
              </li>
              <li>
                <Link to="/products?category=Ice%20Cream" className="hover:text-primary-600 transition-colors">
                  Artisanal Ice Creams
                </Link>
              </li>
              <li>
                <Link to="/products?category=Fragrance" className="hover:text-primary-600 transition-colors">
                  Fragrances & Deodorants
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h5 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
              Buyer Services
            </h5>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/orders" className="hover:text-primary-600 transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-primary-600 transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-primary-600 transition-colors">
                  Buyer Profile & Addresses
                </Link>
              </li>
              <li>
                <Link to="/seller" className="hover:text-purple-600 font-semibold transition-colors">
                  Seller Dashboard Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Academic Info */}
          <div>
            <h5 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">
              Platform Info
            </h5>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-800">Academic Project Demonstration</p>
              <p>Full-Stack: React + Vite + Tailwind CSS + Node.js Express + MySQL.</p>
              <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 text-slate-500">
                <span>Made for JegaMart demonstration</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} JegaMart Supermarket Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
