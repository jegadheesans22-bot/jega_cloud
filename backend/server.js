import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/db.js';
import { seedData } from './seed.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import sellerRoutes from './routes/seller.js';
import chatbotRoutes from './routes/chatbot.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'JegaMart Supermarket & Grocery Platform',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server and Initialize DB
async function startServer() {
  try {
    await initDatabase();
    await seedData();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  🛒 JegaMart Backend Server running on port ${PORT}`);
      console.log(`  🔗 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  📦 MySQL Database: jegamart_db`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to start JegaMart backend server:', error);
    process.exit(1);
  }
}

startServer();
