import express from 'express';
import { getPool } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);
router.use(requireRole('SELLER'));

// GET seller dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const pool = getPool();

    // 1. Total products
    const [pTotal] = await pool.query('SELECT COUNT(*) as total FROM products');

    // 2. Low stock products (stock < 10)
    const [pLow] = await pool.query('SELECT COUNT(*) as low FROM products WHERE stock < 10');

    // 3. Out of stock products (stock = 0)
    const [pOut] = await pool.query('SELECT COUNT(*) as out_of_stock FROM products WHERE stock = 0');

    // 4. Total orders
    const [oTotal] = await pool.query('SELECT COUNT(*) as total FROM orders');

    // 5. Total sales revenue
    const [oSales] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) as sales FROM orders');

    // 6. Recent 5 orders
    const [recentOrders] = await pool.query(`
      SELECT o.*, u.name as buyer_name, p.status as payment_status
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON o.id = p.order_id
      ORDER BY o.id DESC
      LIMIT 5
    `);

    // 7. Top low-stock items preview
    const [lowStockPreview] = await pool.query(
      'SELECT id, name, category, stock, price, image FROM products WHERE stock < 10 ORDER BY stock ASC LIMIT 6'
    );

    res.json({
      success: true,
      stats: {
        totalProducts: pTotal[0].total,
        lowStockProducts: pLow[0].low,
        outOfStockProducts: pOut[0].out_of_stock,
        totalOrders: oTotal[0].total,
        totalSales: parseFloat(Number(oSales[0].sales).toFixed(2)),
      },
      recentOrders,
      lowStockPreview,
    });
  } catch (error) {
    console.error('Seller dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard metrics.' });
  }
});

// GET low-stock products (< 10 units)
router.get('/low-stock', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE stock < 10 ORDER BY stock ASC, id DESC'
    );

    res.json({
      success: true,
      count: rows.length,
      products: rows,
    });
  } catch (error) {
    console.error('Fetch low stock error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch low stock products.' });
  }
});

export default router;
