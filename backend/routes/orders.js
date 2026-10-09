import express from 'express';
import { getPool } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

const VALID_STATUSES = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

// POST create order (supports Cart Checkout and Direct "Buy Now")
router.post('/', async (req, res) => {
  const connection = await getPool().getConnection();
  try {
    const userId = req.user.id;
    const {
      customerName,
      phone,
      address,
      city,
      pincode,
      isBuyNow,
      buyNowItem,
    } = req.body;

    if (!customerName || !phone || !address || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'All shipping fields (Name, Phone, Address, City, Pincode) are required.',
      });
    }

    await connection.beginTransaction();

    let orderItems = [];

    if (isBuyNow && buyNowItem) {
      // Direct "Buy Now" flow
      const [pRows] = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [
        buyNowItem.productId,
      ]);
      if (pRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Selected product not found.' });
      }

      const product = pRows[0];
      const qty = parseInt(buyNowItem.quantity || 1, 10);

      if (product.stock < qty) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stock} available.`,
        });
      }

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        price: product.price,
      });

      // Decrement stock
      await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, product.id]);
    } else {
      // Regular Cart Checkout flow
      const [cartRows] = await connection.query(
        `SELECT c.product_id, c.quantity, p.name, p.price, p.stock 
         FROM cart c 
         JOIN products p ON c.product_id = p.id 
         WHERE c.user_id = ? AND c.saved_for_later = 0 
         FOR UPDATE`,
        [userId]
      );

      if (cartRows.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Your cart is empty.' });
      }

      for (const item of cartRows) {
        if (item.stock < item.quantity) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for "${item.name}". Only ${item.stock} available.`,
          });
        }

        orderItems.push({
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
        });

        // Decrement stock
        await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [
          item.quantity,
          item.product_id,
        ]);
      }

      // Clear active cart items
      await connection.query('DELETE FROM cart WHERE user_id = ? AND saved_for_later = 0', [userId]);
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryCharge = subtotal > 500 ? 0 : 40;
    const finalTotal = parseFloat((subtotal + deliveryCharge).toFixed(2));

    // Create Order Record
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total_amount, status, customer_name, phone, address, city, pincode)
       VALUES (?, ?, 'PLACED', ?, ?, ?, ?, ?)`,
      [userId, finalTotal, customerName.trim(), phone.trim(), address.trim(), city.trim(), pincode.trim()]
    );

    const orderId = orderResult.insertId;

    // Insert Order Items
    for (const item of orderItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.product_name, item.quantity, item.price]
      );
    }

    // Insert Initial Status History
    await connection.query(
      `INSERT INTO order_status_history (order_id, status, notes)
       VALUES (?, 'PLACED', 'Order placed successfully by buyer on JegaMart.')`,
      [orderId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Order created successfully! Proceeding to payment.',
      orderId,
      totalAmount: finalTotal,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to place order.' });
  } finally {
    connection.release();
  }
});

// GET list orders (Buyer views their own, Seller views all)
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    let query = '';
    let params = [];

    if (req.user.role === 'SELLER') {
      query = `
        SELECT o.*, u.name as buyer_name, u.email as buyer_email,
               p.payment_method, p.status as payment_status, p.transaction_id
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN payments p ON o.id = p.order_id
        ORDER BY o.id DESC
      `;
    } else {
      query = `
        SELECT o.*, p.payment_method, p.status as payment_status, p.transaction_id
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE o.user_id = ?
        ORDER BY o.id DESC
      `;
      params.push(req.user.id);
    }

    const [orders] = await pool.query(query, params);

    // Fetch items for each order
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, p.image 
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// GET single order by ID
router.get('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const pool = getPool();

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orders[0];

    // Check authorization: must be the buyer who placed it, or a seller
    if (req.user.role !== 'SELLER' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order.' });
    }

    const [items] = await pool.query(
      `SELECT oi.*, p.image 
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [orderId]);
    const [history] = await pool.query(
      'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id ASC',
      [orderId]
    );

    order.items = items;
    order.payment = payments.length > 0 ? payments[0] : null;
    order.history = history;

    res.json({ success: true, order });
  } catch (error) {
    console.error('Fetch order detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order details.' });
  }
});

// GET order tracking information (/api/orders/:id/track)
router.get('/:id/track', async (req, res) => {
  try {
    const orderId = req.params.id;
    const pool = getPool();

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orders[0];

    if (req.user.role !== 'SELLER' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to track this order.' });
    }

    const [history] = await pool.query(
      'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id ASC',
      [orderId]
    );

    const [items] = await pool.query(
      `SELECT oi.*, p.image 
       FROM order_items oi 
       LEFT JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [orderId]
    );

    const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [orderId]);

    // Build timeline stages
    const timeline = VALID_STATUSES.map((status) => {
      const match = history.find((h) => h.status === status);
      return {
        status,
        completed: VALID_STATUSES.indexOf(order.status) >= VALID_STATUSES.indexOf(status),
        isCurrent: order.status === status,
        timestamp: match ? match.created_at : null,
        notes: match ? match.notes : null,
      };
    });

    res.json({
      success: true,
      tracking: {
        orderId: order.id,
        currentStatus: order.status,
        createdAt: order.created_at,
        customerName: order.customer_name,
        address: `${order.address}, ${order.city} - ${order.pincode}`,
        totalAmount: order.total_amount,
        itemsCount: items.length,
        items,
        payment: payments[0] || null,
        timeline,
      },
    });
  } catch (error) {
    console.error('Order tracking error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve tracking information.' });
  }
});

// PUT update order status (SELLER ONLY)
router.put('/:id/status', requireRole('SELLER'), async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, notes } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const pool = getPool();
    const [orders] = await pool.query('SELECT id, status FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Update order table
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

    // Record in history
    await pool.query(
      'INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)',
      [orderId, status, notes || `Status updated to ${status} by seller.`]
    );

    res.json({
      success: true,
      message: `Order #${orderId} status successfully updated to "${status}".`,
      orderId,
      status,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

export default router;
