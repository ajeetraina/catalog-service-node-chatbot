import React, { useState, useRef, useEffect } from 'react';
import './App.css';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  catalogData?: any;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  vendor_id: string;
  status: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your product catalog assistant. I can help you find products, check categories, or answer questions about our catalog. Try asking me something like 'Show me electronics under $100' or 'What categories do you have?'",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8082';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load initial stats
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`);
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputValue }),
      });

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date(),
        catalogData: data.catalogData
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <div className="product-card">
      <h4>{product.name}</h4>
      <p className="product-category">{product.category}</p>
      <p className="product-price">${product.price}</p>
      <p className="product-description">{product.description}</p>
      <span className={`product-status ${product.status}`}>{product.status}</span>
    </div>
  );

  const quickQuestions = [
    "Show me all electronics",
    "What categories do you have?",
    "Find products under $50",
    "Show me the most expensive items",
    "How many products are in the catalog?"
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>🛍️ Product Catalog Assistant</h1>
        {stats && (
          <div className="stats-bar">
            <span>{stats.total_products} Products</span>
            <span>{stats.total_categories} Categories</span>
            <span>Price Range: ${Math.round(stats.min_price)} - ${Math.round(stats.max_price)}</span>
          </div>
        )}
      </header>

      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.isUser ? 'user' : 'bot'}`}>
              <div className="message-content">
                <p>{message.text}</p>
                
                {/* Display products if available */}
                {message.catalogData?.products && message.catalogData.products.length > 0 && (
                  <div className="products-grid">
                    {message.catalogData.products.map((product: Product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {/* Display categories if available */}
                {message.catalogData?.categories && (
                  <div className="categories-list">
                    <h4>Available Categories:</h4>
                    <div className="categories-grid">
                      {message.catalogData.categories.map((category: string) => (
                        <span key={category} className="category-tag">{category}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display stats if available */}
                {message.catalogData?.stats && (
                  <div className="stats-display">
                    <h4>Catalog Statistics:</h4>
                    <ul>
                      <li>Total Products: {message.catalogData.stats.total_products}</li>
                      <li>Categories: {message.catalogData.stats.total_categories}</li>
                      <li>Price Range: ${Math.round(message.catalogData.stats.min_price)} - ${Math.round(message.catalogData.stats.max_price)}</li>
                      <li>Average Price: ${Math.round(message.catalogData.stats.avg_price)}</li>
                    </ul>
                  </div>
                )}
              </div>
              <span className="timestamp">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="message bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="quick-questions">
          <p>Quick questions to try:</p>
          <div className="quick-buttons">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputValue(question)}
                className="quick-button"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className="input-container">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about products, categories, prices..."
            disabled={isLoading}
            rows={2}
          />
          <button onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
