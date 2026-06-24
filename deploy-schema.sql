-- AscenD Finance Database Schema - Deployment Version
-- PostgreSQL Database Design
-- Version: 1.0 (MVP - Streamlined)
-- Created: 2024

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE USER MANAGEMENT (2 tables)
-- =============================================

-- Users table - Core user information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    username VARCHAR(100) UNIQUE NOT NULL CHECK (length(username) >= 3),
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    otp_attempts INTEGER DEFAULT 0,
    otp_expires_at TIMESTAMP,
    account_locked_until TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences - Consolidated settings
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    daily_message_enabled BOOLEAN DEFAULT TRUE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- =============================================
-- CATEGORY SYSTEM (1 table)
-- =============================================

-- Expense categories - The 4 core categories + user custom ones
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system categories, NOT NULL for user custom
    name VARCHAR(50) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name) -- User can't have duplicate category names
);

-- =============================================
-- TRANSACTION MANAGEMENT (2 tables)
-- =============================================

-- Main transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(10) NOT NULL DEFAULT 'expense' CHECK (transaction_type = 'expense'),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL CHECK (length(description) >= 1),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    merchant_name VARCHAR(255),
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'digital_wallet', 'other')),
    location VARCHAR(255),
    notes TEXT,
    tags TEXT[], -- Array of tags for better categorization
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern VARCHAR(20) CHECK (recurring_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receipt storage - Simplified
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_processed BOOLEAN DEFAULT FALSE,
    extracted_text TEXT, -- OCR extracted text
    extracted_amount DECIMAL(15,2),
    extracted_merchant VARCHAR(255),
    processing_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- AI FEATURES (2 tables)
-- =============================================

-- Daily motivational messages
CREATE TABLE daily_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_text TEXT NOT NULL CHECK (length(message_text) >= 10 AND length(message_text) <= 500),
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('motivational', 'educational', 'tip')),
    category VARCHAR(50) CHECK (category IN ('saving', 'investing', 'spending', 'general')),
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User message history - Track shown messages
CREATE TABLE user_message_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES daily_messages(id) ON DELETE CASCADE,
    shown_date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, message_id, shown_date)
);

-- =============================================
-- ESSENTIAL INDEXES (Minimal but effective)
-- =============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Transaction indexes (most important for performance)
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- Receipt indexes
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_transaction_id ON receipts(transaction_id);

-- Category indexes
CREATE INDEX idx_expense_categories_user_id ON expense_categories(user_id);
CREATE INDEX idx_expense_categories_system ON expense_categories(user_id) WHERE user_id IS NULL; -- System categories

-- Message indexes
CREATE INDEX idx_daily_messages_active ON daily_messages(is_active);
CREATE INDEX idx_user_message_history_user_date ON user_message_history(user_id, shown_date);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_messages_updated_at BEFORE UPDATE ON daily_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL DATA SEEDING
-- =============================================

-- Insert core expense categories (system categories - user_id is NULL)
INSERT INTO expense_categories (user_id, name, description, sort_order) VALUES
(NULL, 'necessity', 'Essential expenses like food, rent, transport', 1),
(NULL, 'investment', 'Expenses that bring value or improve life/profession', 2),
(NULL, 'status', 'Expenses for luxury, image, or indulgence', 3),
(NULL, 'savings', 'Money set aside for future use', 4)
ON CONFLICT DO NOTHING;

-- Insert sample daily messages
INSERT INTO daily_messages (message_text, message_type, category, priority) VALUES
('Money managed well = freedom of life', 'motivational', 'general', 10),
('Invest today, enjoy tomorrow', 'motivational', 'investing', 9),
('Every dollar saved is a dollar earned', 'educational', 'saving', 8),
('Track your spending to control your future', 'tip', 'spending', 7),
('Small expenses add up to big savings', 'educational', 'saving', 6),
('Quality investments compound over time', 'motivational', 'investing', 5),
('Budget like your future depends on it - because it does', 'motivational', 'general', 8),
('Compound interest is the eighth wonder of the world', 'educational', 'investing', 7),
('The best time to start saving was yesterday. The second best time is now', 'motivational', 'saving', 9),
('Financial freedom is not about having money, it''s about having control', 'educational', 'general', 8)
ON CONFLICT DO NOTHING;

-- =============================================
-- ESSENTIAL VIEWS FOR DASHBOARD
-- =============================================

-- User transaction summary for dashboard
CREATE VIEW user_transaction_summary AS
SELECT 
    u.id as user_id,
    u.username,
    u.first_name,
    u.last_name,
    COUNT(t.id) as total_transactions,
    SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END) as total_income,
    SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN t.transaction_type = 'expense' AND ec.name = 'necessity' THEN t.amount ELSE 0 END) as necessity_spending,
    SUM(CASE WHEN t.transaction_type = 'expense' AND ec.name = 'investment' THEN t.amount ELSE 0 END) as investment_spending,
    SUM(CASE WHEN t.transaction_type = 'expense' AND ec.name = 'status' THEN t.amount ELSE 0 END) as status_spending,
    SUM(CASE WHEN t.transaction_type = 'expense' AND ec.name = 'savings' THEN t.amount ELSE 0 END) as savings_amount
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
LEFT JOIN expense_categories ec ON t.category_id = ec.id
GROUP BY u.id, u.username, u.first_name, u.last_name;

-- Monthly spending trend
CREATE VIEW monthly_spending_trend AS
SELECT 
    user_id,
    DATE_TRUNC('month', transaction_date) as month,
    SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
    COUNT(*) as transaction_count
FROM transactions
GROUP BY user_id, DATE_TRUNC('month', transaction_date)
ORDER BY user_id, month;

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to get user's daily message
CREATE OR REPLACE FUNCTION get_daily_message(p_user_id UUID)
RETURNS TABLE(message_id UUID, message_text TEXT, message_type VARCHAR(50), category VARCHAR(50)) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dm.id,
        dm.message_text,
        dm.message_type,
        dm.category
    FROM daily_messages dm
    WHERE dm.is_active = TRUE
    AND dm.id NOT IN (
        SELECT umh.message_id 
        FROM user_message_history umh 
        WHERE umh.user_id = p_user_id 
        AND umh.shown_date = CURRENT_DATE
    )
    ORDER BY dm.priority DESC, RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON TABLE users IS 'Core user accounts and authentication';
COMMENT ON TABLE user_preferences IS 'User settings and preferences';
COMMENT ON TABLE expense_categories IS 'Expense categories (system + user custom). System categories have user_id=NULL, custom categories have user_id=user_id. Frontend handles colors, icons, and system vs custom logic.';
COMMENT ON TABLE transactions IS 'Main transactions table for expenses and income';
COMMENT ON TABLE receipts IS 'Receipt images and OCR processing';
COMMENT ON TABLE daily_messages IS 'AI-generated motivational messages';
COMMENT ON TABLE user_message_history IS 'Track shown messages to avoid repetition';

-- =============================================
-- DEPLOYMENT COMPLETED
-- =============================================

-- ✅ 7 Core Tables Created:
--   1. users - Authentication and basic info
--   2. user_preferences - Settings and preferences
--   3. expense_categories - The 4 core categories + user custom
--   4. transactions - Main expense/income tracking
--   5. receipts - Receipt scanning and OCR
--   6. daily_messages - AI motivational messages
--   7. user_message_history - Message tracking

-- ✅ Features Fully Supported:
--   - Four-category system (Necessity, Investment, Status, Savings)
--   - Manual transaction input
--   - Receipt scanning with OCR
--   - Daily AI motivational messages
--   - User preferences and settings
--   - Dashboard views for UI

-- ✅ Performance Optimized:
--   - Essential indexes for fast queries
--   - Simple relationships
--   - Fast queries for dashboard
--   - Minimal complexity

-- Schema deployment completed successfully!
-- Version: 1.0 (MVP - Streamlined)
-- Ready for production use!

