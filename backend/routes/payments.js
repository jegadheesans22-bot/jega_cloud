import express from 'express';
import { getPool } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// POST process mock payment
router.post('/', async (req, res) => {
  const connection = await getPool().getConnection();
  try {
    const { orderId, paymentMethod = 'Net Banking', bankName, accountName, amount } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    await connection.beginTransaction();

    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orders[0];

    // Check if user is owner of the order
    if (order.user_id !== req.user.id && req.user.role !== 'SELLER') {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Unauthorized for this order payment.' });
    }

    // Check if payment already exists
    const [existingPayments] = await connection.query('SELECT id FROM payments WHERE order_id = ?', [orderId]);
    if (existingPayments.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Payment has already been processed for this order.' });
    }

    const paymentAmount = amount !== undefined ? parseFloat(amount) : order.total_amount;
    const formattedMethod = bankName ? `${paymentMethod} (${bankName})` : paymentMethod;
    const transactionId = `JM-TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Insert payment record
    const [paymentResult] = await connection.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, transaction_id)
       VALUES (?, ?, ?, 'SUCCESS', ?)`,
      [orderId, formattedMethod, paymentAmount, transactionId]
    );

    // Update order status to CONFIRMED
    await connection.query('UPDATE orders SET status = ? WHERE id = ?', ['CONFIRMED', orderId]);

    // Record confirmation in tracking history
    await connection.query(
      `INSERT INTO order_status_history (order_id, status, notes)
       VALUES (?, 'CONFIRMED', ?)`,
      [
        orderId,
        `Payment verified via ${formattedMethod}. Demo Txn ID: ${transactionId}. Order confirmed for packing.`,
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Payment verified and processed successfully!',
      payment: {
        id: paymentResult.insertId,
        orderId,
        paymentMethod: formattedMethod,
        accountName: accountName || order.customer_name,
        amount: paymentAmount,
        status: 'SUCCESS',
        transactionId,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Payment processing error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment.' });
  } finally {
    connection.release();
  }
});

export default router;
