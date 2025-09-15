# Product Catalog Chatbot

## 🚀 Quick Setup

1. **Pull the required model:**
   ```bash
   docker model pull ai/llama3.2:latest
   ```

2. **Start all services:**
   ```bash
   docker compose up -d --build
   ```

3. **Access the chatbot:**
   - Chatbot UI: http://localhost:5174
   - Your existing services remain unchanged

## 💬 Try These Queries

- "Show me all electronics"
- "Find products under $100"
- "What categories do you have?"
- "How many products are in the catalog?"

## 📍 Service Ports

- Chatbot: http://localhost:5174
- Chatbot API: http://localhost:8082
- Main App: http://localhost:5173 (unchanged)
- Agent Portal: http://localhost:3001 (unchanged)
- API: http://localhost:3000 (unchanged)

Happy chatting! 🎉
