import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  ShoppingCart,
  Check,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Zap,
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

// Simple Markdown-style parser for bot messages (bold, bullet points, strikethrough, links)
function FormattedMessage({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Bullet point lines
        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const cleanLine = isBullet ? trimmed.replace(/^[•\-\*]\s*/, '') : trimmed;

        // Parse inline bold (**bold**) and strikethrough (~~strike~~)
        const parts = [];
        let remaining = cleanLine;
        let keyCounter = 0;

        while (remaining.length > 0) {
          // Check for bold: **text**
          const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
          // Check for strikethrough: ~~text~~
          const strikeMatch = remaining.match(/~~(.+?)~~/);

          // Find the earliest match
          let firstMatch = null;
          let matchType = null;

          if (boldMatch && (!strikeMatch || boldMatch.index < strikeMatch.index)) {
            firstMatch = boldMatch;
            matchType = 'bold';
          } else if (strikeMatch) {
            firstMatch = strikeMatch;
            matchType = 'strike';
          }

          if (firstMatch) {
            if (firstMatch.index > 0) {
              parts.push(
                <span key={keyCounter++}>{remaining.slice(0, firstMatch.index)}</span>
              );
            }
            if (matchType === 'bold') {
              parts.push(
                <strong key={keyCounter++} className="font-semibold text-slate-900">
                  {firstMatch[1]}
                </strong>
              );
            } else if (matchType === 'strike') {
              parts.push(
                <del key={keyCounter++} className="text-slate-400 line-through">
                  {firstMatch[1]}
                </del>
              );
            }
            remaining = remaining.slice(firstMatch.index + firstMatch[0].length);
          } else {
            parts.push(<span key={keyCounter++}>{remaining}</span>);
            remaining = '';
          }
        }

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-primary-500 font-bold text-xs mt-1">•</span>
              <div className="flex-1 text-slate-700">{parts}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-700">
            {parts}
          </p>
        );
      })}
    </div>
  );
}

// Compact interactive product card shown inside chat messages
function ChatProductCard({ product, onAddToCart, onViewProduct, isAdded, isAdding }) {
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all group">
      <img
        src={product.image}
        alt={product.name}
        className="w-14 h-14 object-cover rounded-lg bg-white border border-slate-100 flex-shrink-0 cursor-pointer"
        onClick={() => onViewProduct(product.id)}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
            {product.category}
          </span>
          {product.discount_percentage > 0 && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {product.discount_percentage}% OFF
            </span>
          )}
        </div>

        <h4
          onClick={() => onViewProduct(product.id)}
          className="text-xs font-semibold text-slate-900 truncate hover:text-primary-600 cursor-pointer"
          title={product.name}
        >
          {product.name}
        </h4>

        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-xs font-extrabold text-slate-900">₹{product.price}</span>
          {product.original_price > product.price && (
            <span className="text-[10px] text-slate-400 line-through">
              ₹{product.original_price}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 items-end flex-shrink-0">
        <button
          onClick={() => onViewProduct(product.id)}
          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
          title="View product details"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock || isAdding}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            isOutOfStock
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : isAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-sm'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-3 h-3" />
              <span>Added</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3 h-3" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [cartAddingId, setCartAddingId] = useState(null);
  const [cartAddedIds, setCartAddedIds] = useState(new Set());

  const initialGreeting = {
    id: 'welcome',
    sender: 'bot',
    text: "Hi there! 👋 Welcome to **JegadheesanMart**.\n\nI'm your AI Shopping Assistant. How can I help you today?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestedReplies: [
      "🔥 What are today's top deals?",
      '🌾 Show grocery items',
      '📦 Is Basmati rice in stock?',
      '🚚 What are the delivery charges?',
    ],
  };

  const [messages, setMessages] = useState([initialGreeting]);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
      setHasUnread(false);
    }
  }, [isOpen, messages, isLoading]);

  // Handle adding product to cart directly from chatbot recommendation
  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      setIsOpen(false);
      navigate('/login');
      return;
    }

    try {
      setCartAddingId(product.id);
      await addToCart(product.id, 1);
      setCartAddedIds((prev) => new Set(prev).add(product.id));
      setTimeout(() => {
        setCartAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
      }, 2000);
    } catch (err) {
      alert(err.message || 'Could not add to cart');
    } finally {
      setCartAddingId(null);
    }
  };

  // Navigate to product page
  const handleViewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Send message to backend AI endpoint
  const sendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessageObj = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update conversation state with user message
    const updatedMessages = [...messages, userMessageObj];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history for backend context
      const history = updatedMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text,
      }));

      const res = await api.post('/chatbot/message', {
        message: text,
        history,
      });

      if (res.data.success) {
        const botReplyObj = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: res.data.reply,
          products: res.data.products || [],
          suggestedReplies: res.data.suggestedReplies || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botReplyObj]);

        if (!isOpen) {
          setHasUnread(true);
        }
      } else {
        throw new Error(res.data.message || 'Failed to get AI response');
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      const errorReplyObj = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        isError: true,
        text: "I'm having a little trouble connecting to my knowledge base right now. Please ensure the backend server is running and try again in a moment! 🛒",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedReplies: ["🔥 Show today's offers", '🚚 Delivery charges'],
      };
      setMessages((prev) => [...prev, errorReplyObj]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset conversation
  const handleResetChat = () => {
    setMessages([
      {
        ...initialGreeting,
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Floating Chatbot Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center">
        {!isOpen && (
          <div className="hidden sm:flex items-center mr-3 px-3.5 py-1.5 bg-white/95 backdrop-blur border border-slate-200 text-slate-700 text-xs font-semibold rounded-full shadow-lg shadow-slate-200/50 animate-bounce duration-1000">
            <Sparkles className="w-3.5 h-3.5 text-accent-500 mr-1.5" />
            <span>Chat with JegaMart AI</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close Chatbot' : 'Open JegaMart AI Chatbot'}
          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-300 transform active:scale-95 ${
            isOpen
              ? 'bg-slate-800 hover:bg-slate-900 rotate-90 shadow-slate-900/30'
              : 'bg-gradient-to-tr from-primary-600 via-primary-500 to-accent-600 hover:scale-105 hover:shadow-primary-600/40 ring-4 ring-primary-100'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform" />
          ) : (
            <>
              <Bot className="w-7 h-7" />
              {/* Unread indicator */}
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-ping" />
              )}
              {/* Online pulse indicator */}
              <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-400 border-2 border-primary-600 rounded-full" />
            </>
          )}
        </button>
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[410px] h-[580px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{ boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.25)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-accent-700 px-4 py-3.5 text-white flex items-center justify-between shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight">JegaMart AI</span>
                  <span className="px-1.5 py-0.2 bg-white/20 text-[10px] font-semibold rounded-full uppercase tracking-wider">
                    Assistant
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-primary-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online • Store Shopping Guide</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 hover:bg-white/15 rounded-lg text-white/80 hover:text-white transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-lg text-white/80 hover:text-white transition-colors"
                title="Minimize chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/60 to-white">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary-600 to-accent-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="flex flex-col max-w-[84%] space-y-1.5">
                  {/* Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-tr-none shadow-sm shadow-primary-600/20'
                        : msg.isError
                        ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <FormattedMessage text={msg.text} />
                    )}

                    {/* Interactive Product Recommendations */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>Matching Products:</span>
                        </div>
                        {msg.products.map((p) => (
                          <ChatProductCard
                            key={p.id}
                            product={p}
                            onAddToCart={handleAddToCart}
                            onViewProduct={handleViewProduct}
                            isAdded={cartAddedIds.has(p.id)}
                            isAdding={cartAddingId === p.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span
                    className={`text-[10px] text-slate-400 px-1 ${
                      msg.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </span>

                  {/* Suggestion Chips after Bot message (if latest message) */}
                  {msg.sender === 'bot' &&
                    msg.suggestedReplies &&
                    msg.suggestedReplies.length > 0 &&
                    msg === messages[messages.length - 1] &&
                    !isLoading && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedReplies.map((reply, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(reply)}
                            className="px-2.5 py-1 bg-white hover:bg-primary-50 active:bg-primary-100 text-primary-700 hover:text-primary-800 border border-primary-200/80 rounded-full text-xs font-medium transition-all shadow-xs flex items-center gap-1 group"
                          >
                            <span>{reply}</span>
                            <ChevronRight className="w-3 h-3 text-primary-400 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing / Loading indicator */}
            {isLoading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary-600 to-accent-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">JegaMart AI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t border-slate-100 flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about groceries, offers, delivery..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-primary-500 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-primary-100 transition-all disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 active:scale-95 text-white flex items-center justify-center shadow-md shadow-primary-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex-shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between mt-2 px-2 text-[10px] text-slate-400">
              <span>Powered by JegadheesanMart AI</span>
              <span>Academic Demonstration Platform</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
