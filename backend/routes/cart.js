import express from 'express';
import { getPool } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Require authentication for all cart routes
router.use(authenticateToken);

// GET buyer cart & saved for later items
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getPool();

    const query = `
      SELECT 
        c.id as cart_id,
        c.quantity,
        c.saved_for_later,
        c.created_at as added_at,
        p.id as product_id,
        p.name,
        p.category,
        p.price,
        p.original_price,
        p.discount_percentage,
        p.stock,
        p.image
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.id DESC
    `;

    const [rows] = await pool.query(query, [userId]);

    const activeCart = rows.filter((item) => !item.saved_for_later);
    const savedForLater = rows.filter((item) => item.saved_for_later);

    const subtotal = activeCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const originalSubtotal = activeCart.reduce((sum, item) => sum + item.original_price * item.quantity, 0);
    const totalDiscount = originalSubtotal - subtotal;
    const deliveryCharge = subtotal > 500 || subtotal === 0 ? 0 : 40;
    const finalTotal = subtotal > 0 ? subtotal + deliveryCharge : 0;

    res.json({
      success: true,
      activeCart,
      savedForLater,
      summary: {
        itemCount: activeCart.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: parseFloat(subtotal.toFixed(2)),
        originalSubtotal: parseFloat(originalSubtotal.toFixed(2)),
        discount: parseFloat(totalDiscount.toFixed(2)),
        deliveryCharge,
        finalTotal: parseFloat(finalTotal.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Fetch cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cart.' });
  }
});

// POST add product to cart
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const pool = getPool();
    const [productRows] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = productRows[0];
    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Sorry, this product is out of stock.' });
    }

    // Check if product already exists in active cart
    const [existing] = await pool.query(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND saved_for_later = 0',
      [userId, productId]
    );

    let newQuantity = quantity;
    if (existing.length > 0) {
      newQuantity = existing[0].quantity + quantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more than available stock (${product.stock} available).`,
        });
      }

      await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [newQuantity, existing[0].id]);
    } else {
      if (newQuantity > product.stock) {
        newQuantity = product.stock;
      }
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity, saved_for_later) VALUES (?, ?, ?, 0)',
        [userId, productId, newQuantity]
      );
    }

    res.status(201).json({ success: true, message: 'Product added to cart successfully!' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to add item to cart.' });
  }
});

// PUT update cart item (quantity or saved_for_later toggle)
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const cartId = req.params.id;
    const { quantity, saved_for_later } = req.body;

    const pool = getPool();

    // Verify cart item belongs to this user
    const [cartItem] = await pool.query(
      `SELECT c.id, c.quantity, c.product_id, p.stock 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.id = ? AND c.user_id = ?`,
      [cartId, userId]
    );

    if (cartItem.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    const item = cartItem[0];

    // Toggle saved for later
    if (saved_for_later !== undefined) {
      const isSaved = saved_for_later ? 1 : 0;
      await pool.query('UPDATE cart SET saved_for_later = ? WHERE id = ?', [isSaved, cartId]);
      return res.json({
        success: true,
        message: isSaved ? 'Item moved to Save for Later.' : 'Item moved back to Cart.',
      });
    }

    // Update quantity
    if (quantity !== undefined) {
      const numQty = parseInt(quantity, 10);
      if (numQty <= 0) {
        // Delete if quantity reduced to 0
        await pool.query('DELETE FROM cart WHERE id = ?', [cartId]);
        return res.json({ success: true, message: 'Item removed from cart.' });
      }

      if (numQty > item.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${item.stock} units available in stock.`,
        });
      }

      await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [numQty, cartId]);
      return res.json({ success: true, message: 'Cart quantity updated.' });
    }

    res.status(400).json({ success: false, message: 'No valid action specified.' });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ success: false, message: 'Failed to update cart item.' });
  }
});

// DELETE remove item from cart
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const cartId = req.params.id;
    const pool = getPool();

    const [result] = await pool.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [cartId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    res.json({ success: true, message: 'Item removed successfully.' });
  } catch (error) {
    console.error('Delete cart item error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove cart item.' });
  }
});

// DELETE clear all active cart items
router.delete('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getPool();
    await pool.query('DELETE FROM cart WHERE user_id = ? AND saved_for_later = 0', [userId]);
    res.json({ success: true, message: 'Active cart cleared.' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
});

export default router;
