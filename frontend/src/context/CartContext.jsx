import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { isAuthenticated, isBuyer } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [summary, setSummary] = useState({
    itemCount: 0,
    subtotal: 0,
    originalSubtotal: 0,
    discount: 0,
    deliveryCharge: 0,
    finalTotal: 0,
  });
  const [loading, setLoading] = useState(false);

  // Buy Now direct item state (stored in sessionStorage for page refresh resilience)
  const [buyNowData, setBuyNowData] = useState(() => {
    try {
      const stored = sessionStorage.getItem('jegamart_buynow');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setSavedItems([]);
      setSummary({
        itemCount: 0,
        subtotal: 0,
        originalSubtotal: 0,
        discount: 0,
        deliveryCharge: 0,
        finalTotal: 0,
      });
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.data.success) {
        setCartItems(res.data.activeCart || []);
        setSavedItems(res.data.savedForLater || []);
        setSummary(
          res.data.summary || {
            itemCount: 0,
            subtotal: 0,
            originalSubtotal: 0,
            discount: 0,
            deliveryCharge: 0,
            finalTotal: 0,
          }
        );
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to your cart.');
    }
    const res = await api.post('/cart', { productId, quantity });
    if (res.data.success) {
      await fetchCart();
      return res.data;
    }
    throw new Error(res.data.message || 'Could not add to cart.');
  };

  const updateQuantity = async (cartId, quantity) => {
    const res = await api.put(`/cart/${cartId}`, { quantity });
    if (res.data.success) {
      await fetchCart();
      return res.data;
    }
    throw new Error(res.data.message || 'Could not update quantity.');
  };

  const toggleSaveForLater = async (cartId, saved_for_later) => {
    const res = await api.put(`/cart/${cartId}`, { saved_for_later });
    if (res.data.success) {
      await fetchCart();
      return res.data;
    }
    throw new Error(res.data.message || 'Could not move item.');
  };

  const removeFromCart = async (cartId) => {
    const res = await api.delete(`/cart/${cartId}`);
    if (res.data.success) {
      await fetchCart();
      return res.data;
    }
    throw new Error(res.data.message || 'Could not remove item.');
  };

  const clearCart = async () => {
    const res = await api.delete('/cart');
    if (res.data.success) {
      await fetchCart();
      return res.data;
    }
  };

  // Direct "Buy Now" handler
  const setDirectBuyNow = (product, quantity = 1) => {
    const data = {
      product,
      quantity,
      subtotal: parseFloat((product.price * quantity).toFixed(2)),
      originalSubtotal: parseFloat((product.original_price * quantity).toFixed(2)),
      discount: parseFloat(((product.original_price - product.price) * quantity).toFixed(2)),
      deliveryCharge: product.price * quantity > 500 ? 0 : 40,
      finalTotal: parseFloat((product.price * quantity + (product.price * quantity > 500 ? 0 : 40)).toFixed(2)),
    };
    setBuyNowData(data);
    sessionStorage.setItem('jegamart_buynow', JSON.stringify(data));
  };

  const clearBuyNow = () => {
    setBuyNowData(null);
    sessionStorage.removeItem('jegamart_buynow');
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        savedItems,
        summary,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        toggleSaveForLater,
        removeFromCart,
        clearCart,
        buyNowData,
        setDirectBuyNow,
        clearBuyNow,
        cartCount: summary.itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
