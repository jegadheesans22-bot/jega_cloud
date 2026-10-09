import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  ShoppingBag,
  IndianRupee,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown,
  X,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import StockBadge from '../components/StockBadge';

const CATEGORIES = [
  'Grocery',
  'Fragrance',
  'Juice',
  'Ice Cream',
  'Snacks',
  'Stationery',
  'Makeup',
];

const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export default function SellerDashboard() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'low-stock', 'orders'
  const [loading, setLoading] = useState(true);

  // Search & Filter state for product table
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('All');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Grocery',
    description: '',
    originalPrice: '',
    price: '',
    stock: '',
    image: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Restock quick modal
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState(25);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, prodRes, lowRes, ordRes] = await Promise.all([
        api.get('/seller/dashboard'),
        api.get('/products'),
        api.get('/seller/low-stock'),
        api.get('/orders'),
      ]);

      if (dashRes.data.success) setStats(dashRes.data.stats);
      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (lowRes.data.success) setLowStockProducts(lowRes.data.products);
      if (ordRes.data.success) setOrders(ordRes.data.orders);
    } catch (err) {
      console.error('Failed to load seller dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate auto discount for form
  const computedDiscount = () => {
    const orig = parseFloat(productForm.originalPrice);
    const sell = parseFloat(productForm.price);
    if (orig > sell && orig > 0 && sell > 0) {
      return Math.round(((orig - sell) / orig) * 100);
    }
    return 0;
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Grocery',
      description: '',
      originalPrice: '',
      price: '',
      stock: '20',
      image: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category,
      description: prod.description || '',
      originalPrice: prod.original_price,
      price: prod.price,
      stock: prod.stock,
      image: prod.image || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.category) {
      setFormError('Product Name and Category are required.');
      return;
    }
    if (parseFloat(productForm.price) < 0 || parseInt(productForm.stock, 10) < 0) {
      setFormError('Price and stock values cannot be negative.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      const payload = {
        name: productForm.name,
        category: productForm.category,
        description: productForm.description,
        originalPrice: productForm.originalPrice || productForm.price,
        price: productForm.price,
        stock: productForm.stock,
        image: productForm.image || undefined,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setIsModalOpen(false);
      await fetchDashboardData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}" from JegaMart?`)) {
      try {
        await api.delete(`/products/${id}`);
        await fetchDashboardData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete product.');
      }
    }
  };

  const handleQuickRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockItem) return;
    try {
      await api.patch(`/products/${restockItem.id}/stock`, {
        stock: restockItem.stock + parseInt(restockQty, 10),
      });
      setRestockItem(null);
      await fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restock product.');
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, {
        status: newStatus,
        notes: `Status updated to ${newStatus} by Seller on Dashboard.`,
      });
      await fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  // Filter products for table
  const filteredProducts = products.filter((p) => {
    const matchCat = productCatFilter === 'All' || p.category === productCatFilter;
    const matchSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Seller Management Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            JegaMart Seller Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Products */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Total Catalog
            </span>
            <span className="text-2xl font-black text-slate-900">
              {stats?.totalProducts || 0}
            </span>
          </div>
        </div>

        {/* Low Stock Alert Card */}
        <div
          onClick={() => setActiveTab('low-stock')}
          className="cursor-pointer bg-white rounded-3xl border border-amber-200 hover:border-amber-400 p-6 shadow-sm flex items-center gap-4 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block">
              Low Stock Alert (&lt;10)
            </span>
            <span className="text-2xl font-black text-amber-700">
              {stats?.lowStockProducts || 0} items
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Total Orders
            </span>
            <span className="text-2xl font-black text-slate-900">
              {stats?.totalOrders || 0}
            </span>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Total Revenue
            </span>
            <span className="text-2xl font-black text-emerald-700">
              ₹{parseFloat(stats?.totalSales || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'products'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Product Catalog ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('low-stock')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'low-stock'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Alerts ({lowStockProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-purple-700 hover:bg-purple-50'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Order Management ({orders.length})</span>
        </button>
      </div>

      {/* Tab 1: Product Catalog Table */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Table Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products in catalog..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs font-bold text-slate-500">Category:</span>
              <select
                value={productCatFilter}
                onChange={(e) => setProductCatFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-11 h-11 rounded-lg object-cover bg-slate-100 border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900 line-clamp-1 max-w-xs">{p.name}</div>
                        <div className="text-[10px] text-slate-400">ID: #{p.id}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-purple-700">{p.category}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{parseFloat(p.price).toFixed(2)}
                      {p.original_price > p.price && (
                        <span className="text-[10px] text-slate-400 block line-through">
                          ₹{parseFloat(p.original_price).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {p.discount_percentage > 0 ? (
                        <span className="font-bold text-emerald-600">
                          {p.discount_percentage}% OFF
                        </span>
                      ) : (
                        <span className="text-slate-400">0%</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-slate-800 text-sm">{p.stock}</span> units
                    </td>
                    <td className="py-3 px-4">
                      <StockBadge stock={p.stock} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setRestockItem(p);
                            setRestockQty(20);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Restock units"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Dedicated Low Stock Section */}
      {activeTab === 'low-stock' && (
        <div className="bg-white rounded-3xl border border-amber-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-amber-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Critical Low-Stock & Out-of-Stock Alert Panel
                </h2>
                <p className="text-xs text-slate-500">
                  Products with fewer than 10 units remaining in JegaMart storage
                </p>
              </div>
            </div>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Healthy Inventory Levels</p>
              <p className="text-xs">No products currently have stock below 10 units.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                    item.stock === 0
                      ? 'border-rose-200 bg-rose-50/50'
                      : 'border-amber-200 bg-amber-50/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase text-purple-700">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                      <p className="text-xs font-bold text-slate-800">
                        Price: ₹{parseFloat(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Warning Notice */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <div className="text-xs font-bold">
                      {item.stock === 0 ? (
                        <span className="text-rose-700 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          Out of Stock (0 units)
                        </span>
                      ) : (
                        <span className="text-amber-800 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Low Stock: Only {item.stock} left
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setRestockItem(item);
                        setRestockQty(25);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-primary-600" />
                      <span>Restock</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Order Management & Status Controls */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Customer Orders & Real-Time Logistics Tracking
              </h2>
              <p className="text-xs text-slate-500">
                Update status stages: PLACED → CONFIRMED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer & City</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">#{ord.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{ord.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{ord.city} - {ord.pincode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{ord.items?.length || 0}</span> items
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{parseFloat(ord.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        {ord.payment_status || 'SUCCESS'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={ord.status}
                        onChange={(e) => handleOrderStatusChange(ord.id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-primary-500"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              {editingProduct ? 'Edit Catalog Product' : 'Add New Product to JegaMart'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Fill in product details and stock quantities.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                  placeholder="e.g. Organic Sunflower Oil (1L)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none font-semibold"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    placeholder="e.g. 250"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                    placeholder="e.g. 199"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {computedDiscount() > 0 && (
                <div className="p-2 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-700 flex items-center justify-between">
                  <span>Auto-Calculated Discount:</span>
                  <span>{computedDiscount()}% OFF</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Product Image URL
                </label>
                <input
                  type="url"
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Product Description
                </label>
                <textarea
                  rows="2"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Add item details, weight, ingredients..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-600/20"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Quick Restock: {restockItem.name}
            </h3>
            <p className="text-xs text-slate-500">
              Current Stock: <strong className="text-slate-800">{restockItem.stock}</strong> units
            </p>

            <form onSubmit={handleQuickRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Units to Add
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Add Units
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
