import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Calendar, LogOut, PackageCheck, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, isSeller, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Account Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your personal details, credentials, and role permissions on JegaMart
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-200">
              Role: {user?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase text-[10px]">
              <Mail className="w-3.5 h-3.5" />
              Email Address
            </div>
            <p className="font-bold text-slate-800 text-sm">{user?.email}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase text-[10px]">
              <Shield className="w-3.5 h-3.5" />
              Account ID
            </div>
            <p className="font-bold text-slate-800 text-sm">JM-USER-00{user?.id}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Account Navigation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/orders"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-400 hover:bg-slate-50 transition-all flex items-center gap-3 text-slate-800 font-bold text-xs"
            >
              <PackageCheck className="w-5 h-5 text-primary-600" />
              <span>View Order History & Tracking</span>
            </Link>

            {isSeller && (
              <Link
                to="/seller"
                className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 transition-all flex items-center gap-3 text-purple-800 font-bold text-xs"
              >
                <LayoutDashboard className="w-5 h-5 text-purple-600" />
                <span>Go to Seller Dashboard</span>
              </Link>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-rose-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
