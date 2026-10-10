import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './config/db.js';
import { seedData } from './seed.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import sellerRoutes from './routes/seller.js';
import chatbotRoutes from './routes/chatbot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
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

// Serve Frontend Static Build if present (monorepo / container / production)
const candidateDistPaths = [
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, './public'),
];
const distPath = candidateDistPaths.find((p) => fs.existsSync(p));

if (distPath) {
  app.use(express.static(distPath));
  // Client-side SPA routing fallback for non-API requests
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // If static frontend is not present, provide a friendly API overview on root
  app.get('/', (req, res) => {
    res.json({
      status: 'online',
      platform: 'JegaMart Supermarket & Grocery Platform API',
      health: '/api/health',
      products: '/api/products',
      categories: '/api/products/categories',
      chatbotSuggestions: '/api/chatbot/suggestions',
      note: 'API server is running. For web UI, build frontend/dist or deploy frontend to Vercel/Netlify.',
    });
  });
}

// 404 Handler for unmatched API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
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
