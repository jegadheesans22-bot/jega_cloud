import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart,
  Zap,
  Bookmark,
  ShieldCheck,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  ArrowLeft,
  Check,
} from 'lucide-react';
import api from '../services/api';
import StockBadge from '../components/StockBadge';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, setDirectBuyNow, toggleSaveForLater } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        if (res.data.success) {
          setProduct(res.data.product);
          setQuantity(1);

          // Load related products from same category
          const relRes = await api.get(
            `/products?category=${encodeURIComponent(res.data.product.category)}&limit=4`
          );
          if (relRes.data.success) {
            setRelatedProducts(relRes.data.products.filter((p) => p.id !== parseInt(id, 10)));
          }
        }
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">Loading JegaMart product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-lg mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-sm text-slate-500">
          The grocery or daily item you requested is no longer available in the JegaMart catalog.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isOutOfStock) return;

    try {
      setAddingCart(true);
      await addToCart(product.id, quantity);
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 2000);
    } catch (err) {
      alert(err.message || 'Failed to add item to cart.');
    } finally {
      setAddingCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isOutOfStock) return;

    setDirectBuyNow(product, quantity);
    navigate('/checkout?buyNow=true');
  };

  const handleSaveForLater = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      // Add to cart then move to saved for later
      const addRes = await api.post('/cart', { productId: product.id, quantity: 1 });
      if (addRes.data.success) {
        const cartRes = await api.get('/cart');
        const item = cartRes.data.activeCart.find((i) => i.product_id === product.id);
        if (item) {
          await toggleSaveForLater(item.cart_id, true);
        }
      }
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch (err) {
      alert(err.message || 'Could not save item for later.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600">Catalog</Link>
        <span>/</span>
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-primary-600">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-slate-800 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
        
        {/* Large Image Column */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {product.discount_percentage > 0 && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-primary-600 text-white text-xs font-extrabold px-3 py-1 rounded-lg shadow-md">
                {product.discount_percentage}% OFF
              </div>
            )}
          </div>
        </div>

        {/* Product Details & Actions Column */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 mb-2">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>
            <div className="mt-3 flex items-center gap-3">
              <StockBadge stock={product.stock} />
              {product.stock > 0 && product.stock < 10 && (
                <span className="text-xs text-amber-700 font-medium">
                  Hurry! Limited stock remaining at JegaMart warehouse.
                </span>
              )}
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-baseline gap-4">
            <span className="text-3xl font-black text-slate-900">
              ₹{parseFloat(product.price).toFixed(2)}
            </span>
            {parseFloat(product.original_price) > parseFloat(product.price) && (
              <>
                <span className="text-base text-slate-400 line-through">
                  ₹{parseFloat(product.original_price).toFixed(2)}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Save ₹{(product.original_price - product.price).toFixed(2)} ({product.discount_percentage}%)
                </span>
              </>
            )}
          </div>

          {/* Product Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              About This Item
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description || 'Premium quality grocery essential, guaranteed fresh and packed under strict hygiene conditions.'}
            </p>
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-sm text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="p-2 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-500">
                  Total: <strong className="text-slate-900">₹{(product.price * quantity).toFixed(2)}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Dual Action Buttons: Add to Cart & Buy Now */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingCart}
                className={`py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : addedNotice
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-2 border-primary-200'
                }`}
              >
                {addedNotice ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>{addingCart ? 'Adding...' : 'Add to Cart'}</span>
                  </>
                )}
              </button>

              {/* Buy Now */}
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={`py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 active:scale-95 text-white shadow-primary-600/30'
                }`}
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Buy Now Directly</span>
              </button>
            </div>

            {/* Save for Later Button */}
            {!isOutOfStock && (
              <button
                onClick={handleSaveForLater}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-primary-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Bookmark className="w-4 h-4" />
                <span>{savedNotice ? 'Saved to your wishlist!' : 'Save for Later'}</span>
              </button>
            )}
          </div>

          {/* Guarantees list */}
          <div className="border-t border-slate-100 pt-4 grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
            <div className="flex flex-col items-center gap-1">
              <Truck className="w-4 h-4 text-primary-600" />
              <span>Free on orders over ₹500</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>100% Quality Checked</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>Easy replacement policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products from same category */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-6">
          <h2 className="text-xl font-bold text-slate-900">
            More in {product.category}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
