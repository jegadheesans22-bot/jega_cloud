import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, ShoppingBag, X } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

const CATEGORIES = [
  'All',
  'Grocery',
  'Fragrance',
  'Juice',
  'Ice Cream',
  'Snacks',
  'Stationery',
  'Makeup',
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || 'default';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState(initialSort);

  // Sync state if URL changes
  useEffect(() => {
    const cat = searchParams.get('category') || 'All';
    const s = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'default';
    setSelectedCategory(cat);
    setSearchQuery(s);
    setSortBy(sort);
  }, [searchParams]);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        setLoading(true);
        let url = `/products?category=${encodeURIComponent(selectedCategory)}&search=${encodeURIComponent(
          searchQuery
        )}`;
        if (sortBy !== 'default') {
          url += `&sort=${encodeURIComponent(sortBy)}`;
        }

        const res = await api.get(url);
        if (res.data.success) {
          setProducts(res.data.products);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, [selectedCategory, searchQuery, sortBy]);

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    const params = new URLSearchParams(searchParams);
    if (cat === 'All') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSortBy('default');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title & Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            JegaMart Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse fresh supermarket groceries, snacks, beverages, and daily essentials
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, category..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 focus:border-primary-500 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-100 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                const params = new URLSearchParams(searchParams);
                params.delete('search');
                setSearchParams(params);
              }}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Category Pills & Sorting Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-sm shadow-primary-500/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              const params = new URLSearchParams(searchParams);
              params.set('sort', e.target.value);
              setSearchParams(params);
            }}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          >
            <option value="default">Featured / Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="discount">Highest Discount</option>
          </select>
        </div>
      </div>

      {/* Active Filter Tags */}
      {(selectedCategory !== 'All' || searchQuery) && (
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 p-3 rounded-xl">
          <span className="font-semibold">Active Filters:</span>
          {selectedCategory !== 'All' && (
            <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
              Category: {selectedCategory}
              <button onClick={() => handleCategoryChange('All')} className="text-slate-400 hover:text-slate-700">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
              Query: "{searchQuery}"
              <button
                onClick={() => {
                  setSearchQuery('');
                  const params = new URLSearchParams(searchParams);
                  params.delete('search');
                  setSearchParams(params);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-primary-600 hover:text-primary-800 font-bold ml-auto hover:underline"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Useful Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No products found</h3>
          <p className="text-sm text-slate-500">
            We couldn't find any products matching your selected category or search keyword.
          </p>
          <button
            onClick={clearFilters}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Reset Filters & View All
          </button>
        </div>
      )}
    </div>
  );
}
