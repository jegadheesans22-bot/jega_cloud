import express from 'express';
import jwt from 'jsonwebtoken';
import { handleChatMessage } from '../services/chatbotService.js';

const router = express.Router();

// Helper to extract user info from optional Authorization header
function extractOptionalUser(req) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      return decoded;
    }
  } catch {
    // Ignore invalid or expired token for public chatbot queries
  }
  return null;
}

// POST /api/chatbot/message - Send a message to AI assistant
router.post('/message', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required.',
      });
    }

    const user = extractOptionalUser(req);
    const result = await handleChatMessage({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      user,
    });

    res.json({
      success: true,
      reply: result.reply,
      products: result.products || [],
      suggestedReplies: result.suggestedReplies || [],
      source: result.source || 'store-engine',
    });
  } catch (error) {
    console.error('[Chatbot Route Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message. Please try again.',
      reply: "I'm having a little trouble connecting to my knowledge base right now. Please try asking again in a moment! 🛒",
    });
  }
});

// GET /api/chatbot/suggestions - Get starter prompts & status
router.get('/suggestions', (req, res) => {
  res.json({
    success: true,
    suggestions: [
      "🔥 What are today's top deals?",
      '🌾 Show grocery items',
      '📦 Is Basmati Rice in stock?',
      '🚚 What are the delivery charges?',
      '📦 How can I track my order?',
    ],
  });
});

// GET /api/chatbot/status - Health check
router.get('/status', (req, res) => {
  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY &&
      !process.env.GEMINI_API_KEY.includes('your_gemini_api_key')
  );
  res.json({
    success: true,
    status: 'online',
    assistant: 'JegaMart AI Shopping Assistant',
    provider: hasGemini ? 'Google Gemini AI (Catalog-Grounded)' : 'Smart Store Engine (Catalog-Grounded)',
  });
});

export default router;
