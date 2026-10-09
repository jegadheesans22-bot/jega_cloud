import { getPool } from '../config/db.js';

/**
 * Chatbot Service for JegadheesanMart (JegaMart)
 * Connects with Google Gemini AI when GEMINI_API_KEY is configured,
 * and seamlessly provides intelligent, database-grounded store responses
 * when offline or when no API key is set.
 */

// Format product for chat display
function formatProduct(p) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: parseFloat(p.price),
    original_price: parseFloat(p.original_price),
    discount_percentage: p.discount_percentage,
    stock: p.stock,
    image: p.image,
  };
}

// Fetch live catalog context from MySQL
export async function getStoreCatalogSummary() {
  try {
    const pool = getPool();
    const [categories] = await pool.query('SELECT DISTINCT category FROM products ORDER BY category ASC');
    const [topDeals] = await pool.query(
      'SELECT id, name, category, price, original_price, discount_percentage, stock FROM products WHERE discount_percentage > 0 ORDER BY discount_percentage DESC LIMIT 8'
    );
    const [allProducts] = await pool.query(
      'SELECT id, name, category, price, stock, discount_percentage FROM products ORDER BY category, name LIMIT 50'
    );

    return {
      categories: categories.map((c) => c.category),
      topDeals,
      catalogSummary: allProducts
        .map(
          (p) =>
            `- [ID:${p.id}] ${p.name} (${p.category}): ₹${p.price} (${p.discount_percentage}% off, Stock: ${p.stock})`
        )
        .join('\n'),
    };
  } catch (err) {
    console.error('[ChatbotService] Error getting catalog summary:', err.message);
    return {
      categories: ['Grocery', 'Fragrance', 'Juice', 'Ice Cream', 'Snacks', 'Stationery', 'Makeup'],
      topDeals: [],
      catalogSummary: '',
    };
  }
}

// Search relevant products from MySQL based on query keywords
export async function findRelevantProducts(queryText) {
  try {
    const pool = getPool();
    if (!queryText || queryText.trim() === '') return [];

    const clean = queryText.trim().toLowerCase();
    
    // Check if query is looking for top offers/deals
    if (clean.includes('offer') || clean.includes('deal') || clean.includes('discount') || clean.includes('cheapest')) {
      const [deals] = await pool.query(
        'SELECT * FROM products WHERE discount_percentage > 0 ORDER BY discount_percentage DESC LIMIT 4'
      );
      return deals.map(formatProduct);
    }

    // Check specific categories
    const categories = ['grocery', 'fragrance', 'juice', 'ice cream', 'snacks', 'stationery', 'makeup'];
    const matchedCategory = categories.find((cat) => clean.includes(cat));
    if (matchedCategory) {
      const [catProducts] = await pool.query(
        'SELECT * FROM products WHERE LOWER(category) = ? ORDER BY discount_percentage DESC LIMIT 4',
        [matchedCategory]
      );
      return catProducts.map(formatProduct);
    }

    // Keyword search across name and description
    const words = clean
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['the', 'and', 'for', 'are', 'you', 'have', 'what', 'show', 'any', 'can'].includes(w));

    if (words.length === 0) {
      // General popular products
      const [popular] = await pool.query('SELECT * FROM products ORDER BY id ASC LIMIT 3');
      return popular.map(formatProduct);
    }

    const conditions = [];
    const params = [];
    words.forEach((w) => {
      conditions.push('(name LIKE ? OR category LIKE ? OR description LIKE ?)');
      params.push(`%${w}%`, `%${w}%`, `%${w}%`);
    });

    const sql = `SELECT * FROM products WHERE ${conditions.join(' OR ')} ORDER BY stock DESC LIMIT 4`;
    const [matched] = await pool.query(sql, params);
    return matched.map(formatProduct);
  } catch (err) {
    console.error('[ChatbotService] Error finding relevant products:', err.message);
    return [];
  }
}

// Call Google Gemini API if configured
async function callGeminiAI(apiKey, model, systemPrompt, conversationHistory, userMessage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Build Gemini contents
  const contents = [];

  // Add conversation history (up to last 6 messages to stay concise)
  const recentHistory = (conversationHistory || []).slice(-6);
  recentHistory.forEach((msg) => {
    if (msg.role === 'user' || msg.sender === 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: msg.text || msg.message || '' }],
      });
    } else if (msg.role === 'assistant' || msg.sender === 'bot') {
      contents.push({
        role: 'model',
        parts: [{ text: msg.text || msg.message || '' }],
      });
    }
  });

  // Add the current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 600,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (candidate && candidate.content && candidate.content.parts?.[0]?.text) {
    return candidate.content.parts[0].text;
  }

  throw new Error('No candidate returned from Gemini API');
}

/**
 * Intelligent Rule & Database Grounded Response Engine (Fallback & Instant Engine)
 * Handles comprehensive shopping assistance without external API keys.
 */
async function generateIntelligentStoreResponse(pool, userMessage) {
  const lower = userMessage.toLowerCase().trim();

  // 1. Greetings & Salutations
  if (
    /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|hoi|hai)\b/i.test(lower) ||
    lower === 'hi' ||
    lower === 'hello'
  ) {
    return {
      reply:
        "Hello! 👋 Welcome to **JegadheesanMart (JegaMart)**! I'm your dedicated AI Shopping Assistant.\n\nI can help you with:\n- 🛒 Finding fresh groceries, snacks, beverages, cosmetics & stationery\n- 💰 Checking today's top deals and discounts\n- 📦 Checking stock availability\n- 🚚 Delivery fees and shipping timelines\n- 💳 Checkout, payment methods, and tracking your orders\n\nWhat can I assist you with today?",
      suggestedReplies: [
        "🔥 Show today's top offers",
        '🛒 What categories do you have?',
        '🚚 Delivery charges & timing',
        '📦 How do I track my order?',
      ],
    };
  }

  // 2. Thank you & Goodbye
  if (/^(thanks|thank you|thx|cheers|bye|goodbye|see you)/i.test(lower)) {
    return {
      reply:
        "You're very welcome! 😊 It's always a pleasure assisting you at JegadheesanMart. Feel free to ask whenever you need help with your shopping or orders. Happy shopping! 🛍️",
      suggestedReplies: ["🔥 View top deals", "🛒 Browse all products"],
    };
  }

  // 3. Offers, Discounts, Deals, Promotions
  if (
    lower.includes('offer') ||
    lower.includes('discount') ||
    lower.includes('deal') ||
    lower.includes('sale') ||
    lower.includes('cheapest') ||
    lower.includes('best price')
  ) {
    const [deals] = await pool.query(
      'SELECT * FROM products WHERE discount_percentage > 0 ORDER BY discount_percentage DESC LIMIT 4'
    );
    const productCards = deals.map(formatProduct);
    const dealList = deals
      .map(
        (p) =>
          `• **${p.name}** — **₹${p.price}** (was ~~₹${p.original_price}~~, **${p.discount_percentage}% OFF!**)`
      )
      .join('\n');

    return {
      reply: `🎉 **Hot Deals & Offers at JegadheesanMart!**\n\nHere are our top discounted picks right now:\n\n${dealList}\n\n*Click on any card below to view details or add them directly to your cart!*`,
      products: productCards,
      suggestedReplies: [
        '🌾 Show Grocery deals',
        '🍦 Show Ice Cream offers',
        '💄 Show Makeup offers',
      ],
    };
  }

  // 4. Categories Query
  if (
    lower.includes('category') ||
    lower.includes('categories') ||
    lower.includes('department') ||
    lower.includes('what do you sell') ||
    lower.includes('what products')
  ) {
    const [cats] = await pool.query(
      'SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY category ASC'
    );
    const catList = cats.map((c) => `• **${c.category}** (${c.count} items)`).join('\n');

    return {
      reply: `🛒 **JegadheesanMart Store Departments:**\n\nWe offer a wide variety of daily supermarket essentials:\n\n${catList}\n\nTell me which category you'd like to explore, or tap below!`,
      suggestedReplies: [
        'Explore Grocery',
        'Explore Snacks',
        'Explore Juice',
        'Explore Fragrance',
      ],
    };
  }

  // 5. Stock & Availability Check (prioritized before category queries)
  if (
    lower.includes('stock') ||
    lower.includes('available') ||
    lower.includes('availability')
  ) {
    const cleanSearch = lower
      .replace(/[^\w\s]/g, '')
      .replace(/\b(is|are|the|in|stock|available|availability|any|for|left|of|check|do|you|have|item|items|currently)\b/gi, ' ')
      .trim();

    if (cleanSearch.length > 1) {
      const words = cleanSearch.split(/\s+/).filter(w => w.length > 2);
      let matching = [];
      if (words.length > 0) {
        const clauses = words.map(() => '(name LIKE ? OR category LIKE ?)').join(' OR ');
        const params = [];
        words.forEach(w => params.push(`%${w}%`, `%${w}%`));
        const [rows] = await pool.query(`SELECT * FROM products WHERE ${clauses} LIMIT 5`, params);
        matching = rows;
      }

      if (matching.length > 0) {
        const stockStatus = matching
          .map((p) => {
            if (p.stock <= 0) {
              return `❌ **${p.name}**: Currently **Out of Stock**.`;
            } else if (p.stock < 10) {
              return `⚠️ **${p.name}**: **Low Stock! Only ${p.stock} units remaining** (Price: ₹${p.price}).`;
            } else {
              return `✅ **${p.name}**: **In Stock** (${p.stock} units ready to ship, Price: ₹${p.price}).`;
            }
          })
          .join('\n');

        return {
          reply: `📦 **Stock Availability Report:**\n\n${stockStatus}\n\nWould you like to add any of these to your cart?`,
          products: matching.map(formatProduct),
          suggestedReplies: ['How do I add to cart?', 'View delivery time', "🔥 Top deals"],
        };
      } else {
        return {
          reply: `I searched for stock regarding **"${cleanSearch}"**, but couldn't find a matching product in our current inventory. Would you like to check our main departments or popular items?`,
          suggestedReplies: ['Browse Grocery', 'Browse Snacks', "🔥 Today's offers"],
        };
      }
    }
  }

  // 6. Specific Category Inquiries
  const categoriesMap = {
    grocery: 'Grocery',
    rice: 'Grocery',
    atta: 'Grocery',
    oil: 'Grocery',
    dal: 'Grocery',
    sugar: 'Grocery',
    fragrance: 'Fragrance',
    perfume: 'Fragrance',
    spray: 'Fragrance',
    cologne: 'Fragrance',
    juice: 'Juice',
    drink: 'Juice',
    mango: 'Juice',
    orange: 'Juice',
    'ice cream': 'Ice Cream',
    icecream: 'Ice Cream',
    kulfi: 'Ice Cream',
    vanilla: 'Ice Cream',
    chocolate: 'Ice Cream',
    snacks: 'Snacks',
    chips: 'Snacks',
    cookies: 'Snacks',
    almonds: 'Snacks',
    popcorn: 'Snacks',
    stationery: 'Stationery',
    journal: 'Stationery',
    pen: 'Stationery',
    pencil: 'Stationery',
    makeup: 'Makeup',
    lipstick: 'Makeup',
    kajal: 'Makeup',
    foundation: 'Makeup',
    compact: 'Makeup',
  };

  for (const [key, categoryName] of Object.entries(categoriesMap)) {
    if (lower.includes(key)) {
      const [items] = await pool.query(
        'SELECT * FROM products WHERE category = ? ORDER BY discount_percentage DESC LIMIT 4',
        [categoryName]
      );
      if (items.length > 0) {
        return {
          reply: `Here are our popular selections in **${categoryName}** at JegadheesanMart:\n\n${items
            .map(
              (p) =>
                `• **${p.name}** — ₹${p.price} ${
                  p.discount_percentage > 0 ? `(${p.discount_percentage}% OFF)` : ''
                } (${p.stock > 0 ? `In Stock: ${p.stock}` : '⚠️ Out of Stock'})`
            )
            .join('\n')}\n\nTap on any item to view or add to your basket!`,
          products: items.map(formatProduct),
          suggestedReplies: [
            `Show more ${categoryName}`,
            'Check delivery charges',
            'View other categories',
          ],
        };
      }
    }
  }

  // 7. Delivery & Shipping Information
  if (
    lower.includes('deliver') ||
    lower.includes('shipping') ||
    lower.includes('timing') ||
    lower.includes('how long') ||
    lower.includes('charges') ||
    lower.includes('courier')
  ) {
    return {
      reply: `🚚 **JegadheesanMart Delivery Policy:**\n\n• **Express Supermarket Delivery**: Delivered in **30–45 minutes** for local fresh groceries.\n• **Delivery Charges**:\n  - 🆓 **FREE Delivery** on orders of **₹500 and above**!\n  - Standard flat delivery fee of **₹40** for orders below ₹500.\n• **Coverage**: Fast delivery right to your doorstep with 100% contactless handling.\n• **Live Tracking**: Real-time status tracking available under **"My Orders"** right after placing your order.`,
      suggestedReplies: [
        '📦 How do I track an order?',
        '💳 What payment options exist?',
        "🔥 Show today's offers",
      ],
    };
  }

  // 8. Cart Guidance & How to Buy
  if (
    lower.includes('cart') ||
    lower.includes('how to buy') ||
    lower.includes('how to order') ||
    lower.includes('add to cart') ||
    lower.includes('checkout')
  ) {
    return {
      reply: `🛒 **How to Order on JegadheesanMart:**\n\n1. **Browse or Search**: Browse products from the catalog or search for items in the search bar.\n2. **Add to Cart**: Click the **"Add to Cart"** button on any product card, or use **"Buy Now"** for instant checkout.\n3. **View Cart**: Click the cart icon in the top header to review your items, quantities, and savings.\n4. **Checkout**: Click **"Proceed to Checkout"**, enter your delivery address and phone number.\n5. **Payment**: Choose your preferred payment method (UPI, Card, Net Banking, or Cash on Delivery).\n6. **Done**: You will receive an instant order confirmation with a live tracking timeline!`,
      suggestedReplies: [
        '💳 Payment methods',
        '🚚 Delivery charges',
        '📦 Track my orders',
      ],
    };
  }

  // 9. Order Tracking & Status
  if (
    lower.includes('track') ||
    lower.includes('order status') ||
    lower.includes('where is my order') ||
    lower.includes('my order') ||
    lower.includes('order history')
  ) {
    return {
      reply: `📦 **Tracking Your Order at JegadheesanMart:**\n\n• **Order History**: Click your user avatar in the top navbar and select **"My Orders & Tracking"** (or visit \`/orders\`).\n• **Real-Time Timeline**: Each order displays a live status tracker:\n  1. 📝 **PLACED** — Order confirmed by customer\n  2. ⚡ **CONFIRMED** — Payment verified & scheduled\n  3. 📦 **PACKED** — Fresh items carefully bagged\n  4. 🚚 **SHIPPED** — Dispatched from local hub\n  5. 🛵 **OUT FOR DELIVERY** — On the way to your door\n  6. 🏡 **DELIVERED** — Safely handed over!\n\n*Need immediate support with a specific order? Ensure you are logged in and check your orders page.*`,
      suggestedReplies: [
        'Go to My Orders',
        '🚚 Delivery speed',
        '🔄 Cancellation & returns',
      ],
    };
  }

  // 10. Payment Options
  if (
    lower.includes('payment') ||
    lower.includes('pay') ||
    lower.includes('upi') ||
    lower.includes('card') ||
    lower.includes('cash on delivery') ||
    lower.includes('cod')
  ) {
    return {
      reply: `💳 **Payment Methods Accepted at JegadheesanMart:**\n\n• **UPI**: Google Pay, PhonePe, Paytm, and BHIM\n• **Debit / Credit Cards**: Visa, MasterCard, RuPay, Maestro\n• **Net Banking**: All major Indian banks\n• **Cash on Delivery (COD)**: Pay securely upon doorstep delivery\n\nAll online transactions are 100% encrypted and secure. 🔒`,
      suggestedReplies: [
        '🛒 How do I checkout?',
        '🚚 Delivery charges',
        '🔥 Top offers today',
      ],
    };
  }

  // 11. Returns, Cancellations, Refunds
  if (
    lower.includes('return') ||
    lower.includes('refund') ||
    lower.includes('cancel') ||
    lower.includes('replacement') ||
    lower.includes('damaged')
  ) {
    return {
      reply: `🔄 **Returns & Refund Policy:**\n\n• **Fresh Groceries & Dairy**: 24-hour return window if items are damaged or substandard. Immediate doorstep replacement or store credit.\n• **Packaged Goods & Stationery**: 7-day hassle-free return for unopened packages in original condition.\n• **Refund Processing**: Online refunds are credited to the original payment source within 2–4 business days. COD refunds can be credited instantly as store credits or UPI transfer.`,
      suggestedReplies: [
        '📦 Track an order',
        '📞 Contact support',
        "🔥 Today's deals",
      ],
    };
  }

  // 12. Seller / Merchant Panel Inquiries
  if (
    lower.includes('seller') ||
    lower.includes('vendor') ||
    lower.includes('merchant') ||
    lower.includes('sell on jegamart')
  ) {
    return {
      reply: `🏪 **Seller Dashboard on JegadheesanMart:**\n\nIf your account has the **SELLER** role, you can access the exclusive **Seller Panel** by clicking **"Seller Panel"** in the top navigation bar or navigating to \`/seller\`.\n\nFrom the seller panel, you can:\n• 📊 Monitor total revenue, order volume, and sales trends\n• 📦 Add new products with categories, pricing, and images\n• ⚠️ Track low-stock alerts and adjust inventory levels in real-time\n• ✏️ Update product prices and discount offers.`,
      suggestedReplies: [
        '🛒 Buyer shopping options',
        '📦 How to view orders',
      ],
    };
  }

  // 13. About JegadheesanMart
  if (
    lower.includes('about') ||
    lower.includes('who are you') ||
    lower.includes('jegamart') ||
    lower.includes('jegadheesanmart')
  ) {
    return {
      reply: `🛒 **About JegadheesanMart:**\n\nJegadheesanMart (JegaMart) is an end-to-end modern supermarket platform delivering quality groceries, fragrances, fresh juices, ice creams, snacks, stationery, and makeup products at wholesale and discount prices.\n\nOur platform features real-time inventory management, responsive buyer and seller dashboards, multi-step order tracking, and this AI-powered shopping assistant to make your experience effortless!`,
      suggestedReplies: [
        '🔥 Show today’s deals',
        '🛒 Browse all products',
        '🚚 Delivery information',
      ],
    };
  }

  // 14. Fallback search in catalog
  const matching = await findRelevantProducts(userMessage);
  if (matching.length > 0) {
    return {
      reply: `I searched our catalog for **"${userMessage}"** and found these relevant items at JegadheesanMart:\n\n${matching
        .map(
          (p) =>
            `• **${p.name}** (${p.category}) — ₹${p.price} ${
              p.discount_percentage > 0 ? `(${p.discount_percentage}% OFF)` : ''
            }`
        )
        .join('\n')}\n\nCheck out the product details below or let me know if you need more details!`,
      products: matching,
      suggestedReplies: [
        'Is this in stock?',
        'Add to cart',
        'Show other categories',
      ],
    };
  }

  // 15. Default friendly fallback
  return {
    reply: `I'm here to help with your shopping at **JegadheesanMart**! 😊\n\nYou can ask me about:\n- 🍎 **Products**: "Do you have basmati rice?", "Show juices"\n- 💸 **Deals**: "What offers do you have today?"\n- 📦 **Stock**: "Is honey in stock?"\n- 🚚 **Delivery**: "What are the delivery charges?"\n- 🛒 **Ordering**: "How do I place an order?"\n\nWhat would you like to know?`,
    suggestedReplies: [
      "🔥 Show today's offers",
      '🛒 Browse categories',
      '🚚 Delivery info',
      '📦 How to track order',
    ],
  };
}

/**
 * Main function to generate response for a chatbot message.
 */
export async function handleChatMessage({ message, history = [], user = null }) {
  const pool = getPool();
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  // Find any directly relevant products from DB first
  const relevantProducts = await findRelevantProducts(message);

  // If Gemini API Key is configured and not default placeholder, attempt AI generation
  if (apiKey && apiKey.trim() !== '' && !apiKey.includes('your_gemini_api_key')) {
    try {
      const { categories, catalogSummary } = await getStoreCatalogSummary();

      const systemPrompt = `
You are the official AI Shopping Assistant for "JegadheesanMart" (also called "JegaMart"), a modern e-commerce supermarket and grocery platform.
Your job is to be an exceptionally friendly, knowledgeable, and helpful shopping assistant.

CURRENT STORE CONTEXT:
- Available Categories: ${categories.join(', ')}
- Store Catalog Sample:
${catalogSummary}

POLICIES & DETAILS:
- Currency: Indian Rupee (₹)
- Free Delivery: Orders of ₹500 and above. Flat ₹40 delivery fee for smaller orders.
- Delivery Speed: 30-45 minutes express local supermarket delivery.
- Payment Methods: UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, Net Banking, Cash on Delivery (COD).
- Tracking: Users can track orders in real-time under "My Orders & Tracking" (/orders or /order-track/:id).
- Returns: 24 hours for fresh items, 7 days for unopened packaged goods.
- Seller Panel: Users with SELLER role can manage products, stock alerts, and sales at /seller.

GUIDELINES:
1. Ground your answers ONLY in JegadheesanMart products and policies.
2. If asked about prices, stock, or discounts, refer to the catalog information provided above.
3. Keep answers concise, pleasant, and easy to read. Use bullet points and bold text for clarity.
4. When recommending products, highlight their price in ₹ and any active discount.
5. Do not hallucinate products that don't fit the supermarket catalog.
${user ? `Current customer: ${user.name || user.email}` : 'Customer is currently browsing as guest.'}
`.trim();

      const aiReply = await callGeminiAI(apiKey, model, systemPrompt, history, message);

      return {
        reply: aiReply,
        products: relevantProducts,
        suggestedReplies: [
          '🔥 Top offers',
          '🛒 Browse categories',
          '🚚 Delivery information',
        ],
        source: 'gemini-ai',
      };
    } catch (aiError) {
      console.warn('[ChatbotService] Gemini call failed, falling back to store engine:', aiError.message);
      // Fall through to store engine fallback
    }
  }

  // Fallback / Standalone Store Intelligence Engine
  const storeResponse = await generateIntelligentStoreResponse(pool, message);

  // Merge products if found from keyword search and not already in storeResponse
  if (!storeResponse.products && relevantProducts.length > 0) {
    storeResponse.products = relevantProducts;
  }

  return {
    ...storeResponse,
    source: 'store-engine',
  };
}
