import bcrypt from 'bcryptjs';
import { initDatabase, getPool } from './config/db.js';

export async function seedData() {
  const pool = getPool();

  console.log('[Seed] Checking and seeding initial demo data...');

  // Seed Users
  const [existingUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
  if (existingUsers[0].count === 0) {
    const salt = await bcrypt.genSalt(10);
    const buyerHash = await bcrypt.hash('buyer123', salt);
    const sellerHash = await bcrypt.hash('seller123', salt);

    await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES 
       ('John Buyer', 'buyer@jegamart.com', ?, 'BUYER'),
       ('Alex Seller', 'seller@jegamart.com', ?, 'SELLER')`,
      [buyerHash, sellerHash]
    );
    console.log('[Seed] Demo accounts created:');
    console.log('   Buyer:  buyer@jegamart.com / buyer123');
    console.log('   Seller: seller@jegamart.com / seller123');
  } else {
    console.log('[Seed] Users already present, skipping user seeding.');
  }

  // Seed Products
  const [existingProducts] = await pool.query('SELECT COUNT(*) as count FROM products');
  if (existingProducts[0].count === 0) {
    const demoProducts = [
      // Grocery
      {
        name: 'Royal Basmati Rice (5kg)',
        category: 'Grocery',
        description: 'Aged long-grain aromatic basmati rice, perfect for biryanis, pilafs, and royal family feasts.',
        original_price: 650.00,
        price: 520.00,
        discount_percentage: 20,
        stock: 35,
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Whole Wheat Chakki Atta (10kg)',
        category: 'Grocery',
        description: '100% whole wheat stone-ground flour enriched with dietary fiber for ultra-soft rotis.',
        original_price: 490.00,
        price: 420.00,
        discount_percentage: 14,
        stock: 22,
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Cold Pressed Sunflower Oil (1L)',
        category: 'Grocery',
        description: 'Naturally extracted wood-pressed sunflower oil rich in Vitamin E and heart-healthy antioxidants.',
        original_price: 210.00,
        price: 175.00,
        discount_percentage: 17,
        stock: 7, // Low Stock Alert
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Pure Refined Farm Cane Sugar (2kg)',
        category: 'Grocery',
        description: 'Sulphur-free sparkling white refined sugar crystals sourced from premium sugar plantations.',
        original_price: 110.00,
        price: 95.00,
        discount_percentage: 14,
        stock: 40,
        image: 'https://images.unsplash.com/photo-1622484212850-eb596d769edc?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Unpolished Organic Toor Dal (1kg)',
        category: 'Grocery',
        description: 'High-protein yellow split pigeon peas with zero added chemical polish for wholesome daily sambar.',
        original_price: 180.00,
        price: 149.00,
        discount_percentage: 17,
        stock: 5, // Low Stock Alert
        image: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Raw Himalayan Wild Forest Honey (500g)',
        category: 'Grocery',
        description: '100% pure unprocessed wild blossom honey loaded with enzymes and natural pollen.',
        original_price: 399.00,
        price: 299.00,
        discount_percentage: 25,
        stock: 0, // OUT OF STOCK demo
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
      },

      // Fragrance
      {
        name: 'Royal Velvet Oud Eau De Parfum (100ml)',
        category: 'Fragrance',
        description: 'Rich woody oriental oud fragrance infused with smoky amber, rose petals, and warm spices.',
        original_price: 1899.00,
        price: 1399.00,
        discount_percentage: 26,
        stock: 15,
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Aqua Marine Fresh Body Spray (150ml)',
        category: 'Fragrance',
        description: 'Energizing ocean breeze deodorant spray with 48-hour active freshness and crisp citrus notes.',
        original_price: 299.00,
        price: 229.00,
        discount_percentage: 23,
        stock: 6, // Low Stock Alert
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'French Lavender & Vanilla Mist (200ml)',
        category: 'Fragrance',
        description: 'Soothing French lavender body mist blended with Madagascar warm vanilla for day-long calm.',
        original_price: 499.00,
        price: 389.00,
        discount_percentage: 22,
        stock: 18,
        image: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Sandalwood & Bergamot Artisan Cologne (50ml)',
        category: 'Fragrance',
        description: 'Classic artisanal cologne uniting Mysore sandalwood with vibrant Italian bergamot zest.',
        original_price: 999.00,
        price: 749.00,
        discount_percentage: 25,
        stock: 4, // Low Stock Alert
        image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Citrus Burst Anti-Perspirant Roll-On (50ml)',
        category: 'Fragrance',
        description: 'Alcohol-free quick-drying roll-on with zesty lime extract to keep underarms fresh all day.',
        original_price: 199.00,
        price: 159.00,
        discount_percentage: 20,
        stock: 25,
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80',
      },

      // Juice
      {
        name: 'Alphonso Mango Nectar (1L)',
        category: 'Juice',
        description: 'Thick, sweet, sun-ripened Ratnagiri Alphonso mango pulp crafted without artificial preservatives.',
        original_price: 140.00,
        price: 115.00,
        discount_percentage: 18,
        stock: 30,
        image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Valencia Fresh Orange Juice (1L)',
        category: 'Juice',
        description: 'Freshly pressed 100% Valencia orange juice with real citrus pulp for immune-boosting Vitamin C.',
        original_price: 150.00,
        price: 125.00,
        discount_percentage: 17,
        stock: 19,
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Crisp Shimla Green Apple Juice (1L)',
        category: 'Juice',
        description: 'Refreshing sweet and tangy natural apple juice pressed from handpicked orchard apples.',
        original_price: 160.00,
        price: 130.00,
        discount_percentage: 19,
        stock: 8, // Low Stock Alert
        image: 'https://images.unsplash.com/photo-1570857502809-08184874388e?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Wild Pomegranate Antioxidant Juice (750ml)',
        category: 'Juice',
        description: 'Ruby red cold-pressed ruby pomegranate juice packed with polyphenols for radiant health.',
        original_price: 199.00,
        price: 159.00,
        discount_percentage: 20,
        stock: 12,
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Tropical Guava Delight (1L)',
        category: 'Juice',
        description: 'Velvety pink guava drink with a subtle pinch of black salt and chili spice.',
        original_price: 135.00,
        price: 109.00,
        discount_percentage: 19,
        stock: 24,
        image: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=600&q=80',
      },

      // Ice Cream
      {
        name: 'Madagascar Vanilla Bean Tub (1L)',
        category: 'Ice Cream',
        description: 'Creamy artisanal ice cream infused with real Madagascar vanilla caviar beans and fresh milk.',
        original_price: 320.00,
        price: 250.00,
        discount_percentage: 22,
        stock: 20,
        image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Belgian Dark Chocolate Truffle (1L)',
        category: 'Ice Cream',
        description: 'Decadent 70% dark Belgian cocoa churned with fudge swirl ribbons and cocoa nibs.',
        original_price: 380.00,
        price: 299.00,
        discount_percentage: 21,
        stock: 14,
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Mahabaleshwar Strawberry Swirl (1L)',
        category: 'Ice Cream',
        description: 'Velvety sweet cream swirled with real strawberry compote and luscious berry chunks.',
        original_price: 330.00,
        price: 265.00,
        discount_percentage: 20,
        stock: 5, // Low Stock Alert
        image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Caramel Butterscotch Crunch (1L)',
        category: 'Ice Cream',
        description: 'Rich buttery caramel ice cream packed with crispy cashew praline bits.',
        original_price: 310.00,
        price: 240.00,
        discount_percentage: 23,
        stock: 18,
        image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Royal Kesar Pista Matka Kulfi (500ml)',
        category: 'Ice Cream',
        description: 'Traditional slow-cooked milk kulfi infused with Kashmiri saffron strands and crunchy pistachios.',
        original_price: 280.00,
        price: 219.00,
        discount_percentage: 22,
        stock: 3, // Low Stock Alert
        image: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=600&q=80',
      },

      // Snacks
      {
        name: 'Spicy Masala Potato Chips (150g)',
        category: 'Snacks',
        description: 'Crispy wafer-thin potato chips tossed in fiery Indian masala spices and tangy dry mango.',
        original_price: 60.00,
        price: 48.00,
        discount_percentage: 20,
        stock: 50,
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Danish Butter Cookies Tin (400g)',
        category: 'Snacks',
        description: 'Assorted golden melt-in-mouth European butter cookies baked with pure dairy butter.',
        original_price: 399.00,
        price: 299.00,
        discount_percentage: 25,
        stock: 16,
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Roasted California Almonds - Sea Salt (200g)',
        category: 'Snacks',
        description: 'Slow-roasted jumbo California almonds gently seasoned with Himalayan pink rock salt.',
        original_price: 349.00,
        price: 279.00,
        discount_percentage: 20,
        stock: 9, // Low Stock Alert
        image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Gourmet Golden Cheddar Popcorn (120g)',
        category: 'Snacks',
        description: 'Air-popped butterfly popcorn generously coated with creamy melted aged cheddar cheese.',
        original_price: 120.00,
        price: 89.00,
        discount_percentage: 26,
        stock: 32,
        image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Dark Chocolate Hazelnut Wafers (150g)',
        category: 'Snacks',
        description: 'Crispy multi-layered wafer biscuits filled with creamy Piedmont roasted hazelnut paste.',
        original_price: 175.00,
        price: 135.00,
        discount_percentage: 23,
        stock: 22,
        image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
      },

      // Stationery
      {
        name: 'Executive Vegan Leather Hardbound Journal',
        category: 'Stationery',
        description: 'Premium A5 dotted journal with 120 GSM ink-proof bleed-resistant ivory sheets.',
        original_price: 499.00,
        price: 349.00,
        discount_percentage: 30,
        stock: 25,
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Fine Smooth Rollerball Gel Pens (Pack of 5)',
        category: 'Stationery',
        description: 'Precision Japanese 0.5mm quick-drying waterproof black ink pens for effortlessly smooth handwriting.',
        original_price: 250.00,
        price: 189.00,
        discount_percentage: 24,
        stock: 45,
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Pastel Chisel Tip Highlighters (Set of 6)',
        category: 'Stationery',
        description: 'Soft eye-friendly pastel highlighters that do not bleed through notebook paper or textbook pages.',
        original_price: 299.00,
        price: 219.00,
        discount_percentage: 27,
        stock: 6, // Low Stock Alert
        image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Artist Grade Graphite Sketch Pencils (Pack of 12)',
        category: 'Stationery',
        description: 'Complete 2H to 8B shading pencil set crafted from cedar wood with break-resistant leads.',
        original_price: 350.00,
        price: 260.00,
        discount_percentage: 26,
        stock: 14,
        image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Desktop Tape Dispenser & Acrylic Organizer',
        category: 'Stationery',
        description: 'Crystal clear heavy weighted desk accessory with non-slip rubber base for modern study tables.',
        original_price: 399.00,
        price: 279.00,
        discount_percentage: 30,
        stock: 2, // Low Stock Alert
        image: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=600&q=80',
      },

      // Makeup
      {
        name: 'Velvet Matte Long-Wear Lipstick - Ruby Wine',
        category: 'Makeup',
        description: 'Weightless transfer-proof matte lipstick infused with argan oil and Vitamin E for 12hr rich pigmentation.',
        original_price: 699.00,
        price: 499.00,
        discount_percentage: 29,
        stock: 28,
        image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Intense Black Waterproof Gel Kohl Kajal',
        category: 'Makeup',
        description: '24-hour smudge-proof deep black gel kajal enriched with soothing chamomile and almond oil.',
        original_price: 349.00,
        price: 249.00,
        discount_percentage: 29,
        stock: 35,
        image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Oil-Control Silky Matte Compact Powder (SPF 20)',
        category: 'Makeup',
        description: 'Micro-fine pressed powder that blurs pores, controls shine, and protects skin against UV rays.',
        original_price: 450.00,
        price: 330.00,
        discount_percentage: 27,
        stock: 7, // Low Stock Alert
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Luminous Hydrating Liquid Foundation (30ml)',
        category: 'Makeup',
        description: 'Seamless buildable medium-to-full coverage liquid foundation with hyaluronic acid for a dewy glow.',
        original_price: 899.00,
        price: 649.00,
        discount_percentage: 28,
        stock: 12,
        image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Volumizing & Curling Lash Extension Mascara',
        category: 'Makeup',
        description: 'Hourglass brush separates every single lash, coating it in flake-free dramatic black fibers.',
        original_price: 549.00,
        price: 399.00,
        discount_percentage: 27,
        stock: 4, // Low Stock Alert
        image: 'https://images.unsplash.com/photo-1631730486784-5456119f69ae?auto=format&fit=crop&w=600&q=80',
      },
    ];

    for (const p of demoProducts) {
      await pool.query(
        `INSERT INTO products (name, category, description, price, original_price, discount_percentage, stock, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.name,
          p.category,
          p.description,
          p.price,
          p.original_price,
          p.discount_percentage,
          p.stock,
          p.image,
        ]
      );
    }
    console.log(`[Seed] Seeded ${demoProducts.length} realistic products across all 7 categories.`);
  } else {
    console.log('[Seed] Products already present, skipping product seeding.');
  }

  console.log('[Seed] Seeding completed successfully.');
}

// If script is run directly from command line
if (process.argv[1].endsWith('seed.js')) {
  (async () => {
    try {
      await initDatabase();
      await seedData();
      process.exit(0);
    } catch (err) {
      console.error('[Seed Error]', err);
      process.exit(1);
    }
  })();
}
