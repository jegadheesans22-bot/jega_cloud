import express from 'express';
import { getPool } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all products with filtering, search, and sorting
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, limit } = req.query;
    const pool = getPool();

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ' AND (name LIKE ? OR category LIKE ? OR description LIKE ?)';
      params.push(term, term, term);
    }

    if (sort === 'price_asc') {
      query += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY price DESC';
    } else if (sort === 'discount') {
      query += ' ORDER BY discount_percentage DESC';
    } else {
      query += ' ORDER BY id DESC';
    }

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit, 10));
    }

    const [products] = await pool.query(query, params);
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
});

// GET single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, product: rows[0] });
  } catch (error) {
    console.error('Fetch product detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product details.' });
  }
});

// POST create product (SELLER ONLY)
router.post('/', authenticateToken, requireRole('SELLER'), async (req, res) => {
  try {
    const { name, category, description, price, originalPrice, stock, image } = req.body;

    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product name, category, price, and stock are required.',
      });
    }

    const numPrice = parseFloat(price);
    const numOriginalPrice = originalPrice ? parseFloat(originalPrice) : numPrice;
    const numStock = parseInt(stock, 10);

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Valid selling price is required.' });
    }
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative.' });
    }

    let discountPercentage = 0;
    if (numOriginalPrice > numPrice && numOriginalPrice > 0) {
      discountPercentage = Math.round(((numOriginalPrice - numPrice) / numOriginalPrice) * 100);
    }

    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO products (name, category, description, price, original_price, discount_percentage, stock, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        category.trim(),
        description || '',
        numPrice,
        numOriginalPrice,
        discountPercentage,
        numStock,
        image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      ]
    );

    const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Product added successfully to JegaMart catalog!',
      product: newProduct[0],
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
});

// PUT update product (SELLER ONLY)
router.put('/:id', authenticateToken, requireRole('SELLER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, price, originalPrice, stock, image } = req.body;

    const pool = getPool();
    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const current = existing[0];
    const numPrice = price !== undefined ? parseFloat(price) : current.price;
    const numOriginalPrice = originalPrice !== undefined ? parseFloat(originalPrice) : current.original_price;
    const numStock = stock !== undefined ? parseInt(stock, 10) : current.stock;

    if (numPrice < 0 || numStock < 0) {
      return res.status(400).json({ success: false, message: 'Price and stock must be non-negative.' });
    }

    let discountPercentage = 0;
    if (numOriginalPrice > numPrice && numOriginalPrice > 0) {
      discountPercentage = Math.round(((numOriginalPrice - numPrice) / numOriginalPrice) * 100);
    }

    await pool.query(
      `UPDATE products SET 
        name = ?, 
        category = ?, 
        description = ?, 
        price = ?, 
        original_price = ?, 
        discount_percentage = ?, 
        stock = ?, 
        image = ?
       WHERE id = ?`,
      [
        name ? name.trim() : current.name,
        category ? category.trim() : current.category,
        description !== undefined ? description : current.description,
        numPrice,
        numOriginalPrice,
        discountPercentage,
        numStock,
        image || current.image,
        id,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product updated successfully.', product: updated[0] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

// PATCH quick stock restock (SELLER ONLY)
router.patch('/:id/stock', authenticateToken, requireRole('SELLER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock quantity cannot be negative.' });
    }

    const pool = getPool();
    await pool.query('UPDATE products SET stock = ? WHERE id = ?', [numStock, id]);
    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    res.json({ success: true, message: 'Stock updated successfully.', product: updated[0] });
  } catch (error) {
    console.error('Stock update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update stock.' });
  }
});

// DELETE product (SELLER ONLY)
router.delete('/:id', authenticateToken, requireRole('SELLER'), async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product deleted from JegaMart successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

export default router;
