// chatbot-backend/server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8082;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

// Model Runner configuration
const MODEL_RUNNER_URL = process.env.MODEL_RUNNER_URL;
const AI_MODEL = process.env.AI_MODEL || 'ai/llama3.2:latest';

class CatalogChatbot {
  
  async searchProducts(query, filters = {}) {
    try {
      let sql = `
        SELECT id, name, description, category, price, vendor_id, 
               created_at, updated_at, status
        FROM products 
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      // Text search in name and description
      if (query) {
        paramCount++;
        sql += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${query}%`);
      }

      // Category filter
      if (filters.category) {
        paramCount++;
        sql += ` AND category ILIKE $${paramCount}`;
        params.push(`%${filters.category}%`);
      }

      // Price range filter
      if (filters.minPrice) {
        paramCount++;
        sql += ` AND price >= $${paramCount}`;
        params.push(filters.minPrice);
      }

      if (filters.maxPrice) {
        paramCount++;
        sql += ` AND price <= $${paramCount}`;
        params.push(filters.maxPrice);
      }

      // Status filter (active products only by default)
      if (filters.status !== 'all') {
        paramCount++;
        sql += ` AND status = $${paramCount}`;
        params.push(filters.status || 'active');
      }

      sql += ` ORDER BY name LIMIT 20`;

      const result = await pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('Database search error:', error);
      throw error;
    }
  }

  async getProductById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const result = await pool.query(
        'SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category'
      );
      return result.rows.map(row => row.category);
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  async getProductStats() {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_products,
          COUNT(DISTINCT category) as total_categories,
          MIN(price) as min_price,
          MAX(price) as max_price,
          AVG(price) as avg_price
        FROM products
        WHERE status = 'active'
      `);
      return result.rows[0];
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  parseUserIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Extract price ranges
    const priceMatch = lowerMessage.match(/(\$?\d+)\s*(?:to|-)?\s*(\$?\d+)?/);
    let minPrice, maxPrice;
    
    if (priceMatch) {
      minPrice = parseInt(priceMatch[1].replace('$', ''));
      if (priceMatch[2]) {
        maxPrice = parseInt(priceMatch[2].replace('$', ''));
      }
    }

    // Detect categories
    const categoryKeywords = ['electronics', 'clothing', 'books', 'home', 'sports', 'toys'];
    const detectedCategory = categoryKeywords.find(cat => lowerMessage.includes(cat));

    // Detect specific product searches
    const searchTerms = lowerMessage
      .replace(/show me|find|search for|looking for|i want|i need/g, '')
      .replace(/\$?\d+/g, '') // Remove prices
      .trim();

    return {
      searchTerms: searchTerms || null,
      category: detectedCategory,
      minPrice,
      maxPrice,
      isGeneralQuery: lowerMessage.includes('how many') || lowerMessage.includes('what categories'),
      isProductSearch: lowerMessage.includes('product') || lowerMessage.includes('show') || lowerMessage.includes('find')
    };
  }

  async generateLLMResponse(userMessage, catalogData) {
    try {
      const systemPrompt = `You are a helpful product catalog assistant. You help users find products from our catalog.

Current catalog data: ${JSON.stringify(catalogData, null, 2)}

Instructions:
- Be conversational and helpful
- If showing products, format them clearly with name, price, and brief description
- If no products match, suggest alternatives or ask for clarification
- Keep responses concise but informative
- Always end with asking if they need help with anything else`;

      const response = await axios.post(`${MODEL_RUNNER_URL}/chat/completions`, {
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('LLM API error:', error);
      return "I'm having trouble connecting to our AI service. Let me help you with a basic search instead.";
    }
  }
}

const chatbot = new CatalogChatbot();

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Parse user intent
    const intent = chatbot.parseUserIntent(message);
    let catalogData = {};

    // Handle different types of queries
    if (intent.isGeneralQuery) {
      catalogData.stats = await chatbot.getProductStats();
      catalogData.categories = await chatbot.getCategories();
    } else if (intent.isProductSearch || intent.searchTerms) {
      catalogData.products = await chatbot.searchProducts(intent.searchTerms, {
        category: intent.category,
        minPrice: intent.minPrice,
        maxPrice: intent.maxPrice
      });
    } else {
      // Fallback: search for any terms in the message
      catalogData.products = await chatbot.searchProducts(message);
    }

    // Generate AI response
    const response = await chatbot.generateLLMResponse(message, catalogData);

    res.json({
      response,
      catalogData,
      intent
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Sorry, I encountered an error. Please try again.',
      details: error.message 
    });
  }
});

// Product search endpoint
app.get('/api/products/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, status } = req.query;
    
    const products = await chatbot.searchProducts(q, {
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      status
    });

    res.json({ products });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await chatbot.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await chatbot.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get catalog stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await chatbot.getProductStats();
    res.json({ stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Chatbot backend running on port ${port}`);
});
