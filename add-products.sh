#!/bin/bash

# Sample Products Setup Script
# This script adds sample products to your catalog database

echo "🛍️ Adding sample products to your catalog..."
echo "============================================="

# First, let's check if the database is running
echo "📊 Checking database connection..."

# Create a SQL script with sample products
cat > sample_products.sql << 'EOF'
-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10, 2),
    vendor_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample products
INSERT INTO products (name, description, category, price, vendor_id, status) VALUES
-- Electronics
('MacBook Pro 16"', 'Powerful laptop with M3 Pro chip, 18GB RAM, 512GB SSD. Perfect for developers and creators.', 'electronics', 2499.00, 'apple', 'active'),
('iPhone 15 Pro', 'Latest iPhone with titanium design, A17 Pro chip, and advanced camera system.', 'electronics', 999.00, 'apple', 'active'),
('Samsung Galaxy S24', 'Android flagship with AI features, excellent camera, and long battery life.', 'electronics', 899.00, 'samsung', 'active'),
('Sony WH-1000XM5', 'Industry-leading noise canceling wireless headphones with 30-hour battery.', 'electronics', 399.00, 'sony', 'active'),
('iPad Air', 'Versatile tablet with M2 chip, perfect for work and creativity.', 'electronics', 599.00, 'apple', 'active'),
('Dell XPS 13', 'Ultrabook with Intel Core i7, 16GB RAM, beautiful InfinityEdge display.', 'electronics', 1299.00, 'dell', 'active'),
('AirPods Pro', 'Wireless earbuds with active noise cancellation and spatial audio.', 'electronics', 249.00, 'apple', 'active'),
('Gaming Monitor 27"', '4K gaming monitor with 144Hz refresh rate and HDR support.', 'electronics', 599.00, 'lg', 'active'),

-- Clothing
('Premium Cotton T-Shirt', 'Soft, comfortable cotton t-shirt available in multiple colors and sizes.', 'clothing', 29.99, 'fashion_co', 'active'),
('Denim Jeans', 'Classic fit jeans made from premium denim with modern styling.', 'clothing', 79.99, 'fashion_co', 'active'),
('Running Shoes', 'Lightweight running shoes with advanced cushioning and breathable mesh.', 'clothing', 129.99, 'sportswear', 'active'),
('Winter Jacket', 'Warm, waterproof winter jacket with insulated lining.', 'clothing', 199.99, 'outdoor_gear', 'active'),
('Business Suit', 'Professional business suit, tailored fit, available in navy and charcoal.', 'clothing', 399.99, 'formal_wear', 'active'),
('Casual Sneakers', 'Comfortable everyday sneakers with classic design.', 'clothing', 89.99, 'sportswear', 'active'),

-- Books
('The Complete Guide to Programming', 'Comprehensive programming guide covering multiple languages and best practices.', 'books', 49.99, 'tech_books', 'active'),
('Digital Marketing Mastery', 'Learn modern digital marketing strategies and techniques.', 'books', 34.99, 'business_books', 'active'),
('Science Fiction Collection', 'Anthology of classic science fiction short stories from renowned authors.', 'books', 24.99, 'literature', 'active'),
('Cooking Fundamentals', 'Master the basics of cooking with step-by-step instructions and recipes.', 'books', 39.99, 'lifestyle', 'active'),
('History of Technology', 'Fascinating look at how technology has shaped our modern world.', 'books', 44.99, 'educational', 'active'),

-- Home & Garden
('Smart Home Hub', 'Central control system for all your smart home devices.', 'home', 149.99, 'smart_tech', 'active'),
('Coffee Maker Pro', 'Professional-grade coffee maker with programmable settings and thermal carafe.', 'home', 199.99, 'kitchen_pro', 'active'),
('Ergonomic Office Chair', 'Comfortable office chair with lumbar support and adjustable height.', 'home', 299.99, 'office_furniture', 'active'),
('Robot Vacuum', 'Smart robot vacuum with app control and automatic charging.', 'home', 349.99, 'smart_tech', 'active'),
('Garden Tool Set', 'Complete set of essential gardening tools with storage case.', 'home', 89.99, 'garden_supplies', 'active'),
('LED Desk Lamp', 'Adjustable LED desk lamp with multiple brightness settings and USB charging port.', 'home', 79.99, 'lighting', 'active'),

-- Sports & Fitness
('Yoga Mat Premium', 'High-quality yoga mat with excellent grip and cushioning.', 'sports', 49.99, 'fitness_gear', 'active'),
('Resistance Band Set', 'Complete set of resistance bands for home workouts.', 'sports', 34.99, 'fitness_gear', 'active'),
('Basketball', 'Official size basketball with superior grip and durability.', 'sports', 29.99, 'sports_equipment', 'active'),
('Fitness Tracker', 'Advanced fitness tracker with heart rate monitor and GPS.', 'sports', 199.99, 'wearable_tech', 'active'),
('Protein Powder', 'High-quality whey protein powder for post-workout recovery.', 'sports', 59.99, 'nutrition', 'active'),

-- Toys & Games
('Educational Building Blocks', 'STEM learning toy that encourages creativity and problem-solving.', 'toys', 39.99, 'educational_toys', 'active'),
('Board Game Classic', 'Family-friendly board game for ages 8 and up.', 'toys', 24.99, 'board_games', 'active'),
('Remote Control Drone', 'Easy-to-fly drone with HD camera and stable flight controls.', 'toys', 149.99, 'tech_toys', 'active'),
('Art Supply Kit', 'Complete art kit with paints, brushes, and drawing materials.', 'toys', 49.99, 'creative_toys', 'active'),

-- Sample inactive products
('Old Model Phone', 'Previous generation smartphone, discontinued.', 'electronics', 299.99, 'tech_legacy', 'inactive'),
('Vintage Camera', 'Classic film camera, no longer in production.', 'electronics', 199.99, 'photo_vintage', 'inactive');

-- Update the updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE
    ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Show summary
SELECT 
    category,
    COUNT(*) as product_count,
    AVG(price) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM products 
WHERE status = 'active'
GROUP BY category
ORDER BY category;

SELECT 'Total active products: ' || COUNT(*) as summary FROM products WHERE status = 'active';
EOF

echo "📦 Created sample products SQL script..."

# Execute the SQL script
echo "🚀 Adding products to database..."
docker compose exec -T postgres psql -U postgres -d catalog_db < sample_products.sql

# Check if the insertion was successful
echo ""
echo "✅ Verifying products were added..."
docker compose exec postgres psql -U postgres -d catalog_db -c "SELECT COUNT(*) as total_products FROM products;"

echo ""
echo "📊 Product summary by category:"
docker compose exec postgres psql -U postgres -d catalog_db -c "
SELECT 
    category,
    COUNT(*) as count,
    ROUND(AVG(price), 2) as avg_price
FROM products 
WHERE status = 'active'
GROUP BY category
ORDER BY category;
"

echo ""
echo "💰 Price ranges:"
docker compose exec postgres psql -U postgres -d catalog_db -c "
SELECT 
    'Under $50' as price_range,
    COUNT(*) as count
FROM products 
WHERE price < 50 AND status = 'active'
UNION ALL
SELECT 
    '$50 - $200' as price_range,
    COUNT(*) as count
FROM products 
WHERE price >= 50 AND price <= 200 AND status = 'active'
UNION ALL
SELECT 
    'Over $200' as price_range,
    COUNT(*) as count
FROM products 
WHERE price > 200 AND status = 'active';
"

echo ""
echo "🎉 Sample products added successfully!"
echo ""
echo "Your catalog now includes:"
echo "  📱 Electronics (laptops, phones, headphones)"
echo "  👕 Clothing (shirts, jeans, shoes)"
echo "  📚 Books (programming, cooking, fiction)"
echo "  🏠 Home & Garden (smart devices, furniture)"
echo "  🏃 Sports & Fitness (yoga mats, trackers)"
echo "  🎲 Toys & Games (educational, board games)"
echo ""
echo "🤖 Now you can test your chatbot with queries like:"
echo "  • 'Show me electronics under $500'"
echo "  • 'What clothing items do you have?'"
echo "  • 'Find books about programming'"
echo "  • 'Show me all Apple products'"
echo ""
echo "Ready to start your chatbot: docker compose up -d"

# Clean up the SQL file
rm sample_products.sql
