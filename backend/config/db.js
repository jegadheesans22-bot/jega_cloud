import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'mysql.railway.internal',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'YLsmdYruinvhVxqoefcFfrBRZSnDuIPl',
};

const DB_NAME = process.env.DB_NAME || 'jegamart_db';

let pool = null;

export async function initDatabase() {
  try {
    // Connect to MySQL server to ensure the database exists
    const rootConnection = await mysql.createConnection(dbConfig);
    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConnection.end();

    // Create pool for jegamart_db
    pool = mysql.createPool({
      ...dbConfig,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true,
    });

    console.log(`[Database] Connected to MySQL database "${DB_NAME}"`);

    // Create tables
    await createTables();

    return pool;
  } catch (error) {
    console.error('[Database] Failed to initialize database:', error.message);
    throw error;
  }
}

async function createTables() {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('BUYER', 'SELLER') NOT NULL DEFAULT 'BUYER',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;

  const productsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      original_price DECIMAL(10, 2) NOT NULL,
      discount_percentage INT NOT NULL DEFAULT 0,
      stock INT NOT NULL DEFAULT 0,
      image VARCHAR(1000),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;

  const cartTable = `
    CREATE TABLE IF NOT EXISTS cart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      saved_for_later TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_cart_user (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  const ordersTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      status ENUM('PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED') NOT NULL DEFAULT 'PLACED',
      customer_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(100) NOT NULL,
      pincode VARCHAR(20) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_orders_user (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  const orderItemsTable = `
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_items_order (order_id),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  const paymentsTable = `
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      payment_method VARCHAR(100) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) NOT NULL,
      transaction_id VARCHAR(100) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_payments_order (order_id),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  const orderTrackingHistoryTable = `
    CREATE TABLE IF NOT EXISTS order_status_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      status ENUM('PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED') NOT NULL,
      notes VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_history_order (order_id),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  await pool.query(usersTable);
  await pool.query(productsTable);
  await pool.query(cartTable);
  await pool.query(ordersTable);
  await pool.query(orderItemsTable);
  await pool.query(paymentsTable);
  await pool.query(orderTrackingHistoryTable);

  console.log('[Database] All tables checked/created successfully.');
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDatabase() first.');
  }
  return pool;
}
