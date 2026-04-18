-- ============================================
-- CREATE ALL TABLES FOR SABAI PAY
-- Copy and paste this entire block
-- ============================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100),
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    profile_pic VARCHAR(255),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    upi_id VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone_number),
    INDEX idx_email (email)
);

-- 2. OTP VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS otp_verifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(15) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose ENUM('login', 'register', 'reset') DEFAULT 'register',
    attempts INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone_number),
    INDEX idx_expires (expires_at)
);

-- 3. BANK ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS bank_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    account_holder_name VARCHAR(100) NOT NULL,
    upi_id VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_upi (upi_id)
);

-- 4. BANK BALANCES TABLE
CREATE TABLE IF NOT EXISTS bank_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    bank_account_id INT NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bank_account (bank_account_id),
    INDEX idx_user (user_id)
);

-- 5. BANK UPI PINS TABLE
CREATE TABLE IF NOT EXISTS bank_upi_pins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bank_account_id INT NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bank_pin (bank_account_id)
);

-- 6. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    type ENUM('send', 'receive', 'bill', 'recharge', 'qr', 'self_transfer', 'cashback') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    sender_vpa VARCHAR(100),
    receiver_vpa VARCHAR(100),
    receiver_name VARCHAR(100),
    bank_name VARCHAR(100),
    bank_account_id INT,
    description TEXT,
    gems_used INT DEFAULT 0,
    reserve_used DECIMAL(15,2) DEFAULT 0,
    bank_used DECIMAL(15,2) DEFAULT 0,
    cashback_earned INT DEFAULT 0,
    bill_type VARCHAR(50),
    customer_id VARCHAR(100),
    provider VARCHAR(100),
    mobile_number VARCHAR(15),
    operator VARCHAR(50),
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_transaction_id (transaction_id)
);

-- 7. SABAI COINS TABLE
CREATE TABLE IF NOT EXISTS sabai_coins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    balance INT DEFAULT 0,
    lifetime_earned INT DEFAULT 0,
    lifetime_used INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_coin (user_id)
);

-- 8. COIN TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS coin_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    amount INT NOT NULL,
    type ENUM('earned', 'used', 'expired', 'refunded') NOT NULL,
    source_type ENUM('transaction', 'challenge', 'referral', 'cashback') NOT NULL,
    source_id VARCHAR(100),
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
);

-- 9. RESERVE LIMITS TABLE
CREATE TABLE IF NOT EXISTS reserve_limits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    merchant VARCHAR(100) NOT NULL,
    merchant_name VARCHAR(100),
    merchant_category VARCHAR(50),
    monthly_limit DECIMAL(15,2) NOT NULL,
    current_spent DECIMAL(15,2) DEFAULT 0,
    per_transaction_limit DECIMAL(15,2),
    requires_approval BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    contributions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_merchant (user_id, merchant),
    INDEX idx_user (user_id)
);

-- 10. AUTO PAY ORDERS TABLE
CREATE TABLE IF NOT EXISTS auto_pay_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    type ENUM('bill', 'recharge', 'merchant') NOT NULL,
    merchant VARCHAR(100),
    merchant_name VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL,
    schedule ENUM('monthly', 'yearly', 'one-time') DEFAULT 'monthly',
    date_value INT,
    month_value INT,
    time_value TIME DEFAULT '09:00:00',
    one_time_date DATE,
    payment_method ENUM('bank', 'reserve') NOT NULL,
    bank_account_id INT,
    bank_name VARCHAR(100),
    bank_account_last4 VARCHAR(4),
    status ENUM('active', 'paused', 'completed', 'cancelled') DEFAULT 'active',
    next_execution TIMESTAMP,
    last_executed TIMESTAMP,
    bill_id INT,
    customer_id VARCHAR(100),
    bill_type VARCHAR(50),
    provider VARCHAR(100),
    mobile_number VARCHAR(15),
    operator VARCHAR(50),
    circle VARCHAR(100),
    reminder_days INT DEFAULT 3,
    execution_history JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_next_execution (next_execution)
);

-- 11. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    vpa VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    avatar_color VARCHAR(10),
    total_sent DECIMAL(15,2) DEFAULT 0,
    total_received DECIMAL(15,2) DEFAULT 0,
    transaction_count INT DEFAULT 0,
    last_transaction TIMESTAMP NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_contact (user_id, vpa),
    INDEX idx_user (user_id),
    INDEX idx_name (name)
);

-- 12. BILLS TABLE
CREATE TABLE IF NOT EXISTS bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    bill_type VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
    auto_pay BOOLEAN DEFAULT FALSE,
    reserve_pay_enabled BOOLEAN DEFAULT FALSE,
    reminder_days INT DEFAULT 3,
    bank_account_id INT,
    bank_name VARCHAR(100),
    bank_account_last4 VARCHAR(4),
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
);

-- 13. PAID BILLS TABLE
CREATE TABLE IF NOT EXISTS paid_bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    bill_id INT,
    provider VARCHAR(100) NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    bill_type VARCHAR(50),
    payment_method VARCHAR(100),
    payment_breakdown JSON,
    cashback_earned INT DEFAULT 0,
    transaction_id VARCHAR(100),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_paid_at (paid_at)
);

-- 14. RECENT RECHARGES TABLE
CREATE TABLE IF NOT EXISTS recent_recharges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    operator VARCHAR(50) NOT NULL,
    operator_id VARCHAR(20),
    amount DECIMAL(15,2) NOT NULL,
    circle VARCHAR(100),
    transaction_id VARCHAR(100),
    cashback_earned INT DEFAULT 0,
    payment_method VARCHAR(100),
    recharged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_mobile (mobile_number),
    INDEX idx_recharged_at (recharged_at)
);

-- 15. MONEY REQUESTS TABLE
CREATE TABLE IF NOT EXISTS money_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    requester_vpa VARCHAR(100) NOT NULL,
    requester_name VARCHAR(100),
    recipient_vpa VARCHAR(100) NOT NULL,
    recipient_name VARCHAR(100),
    description TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_request_id (request_id)
);

-- 16. SPLIT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS split_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    split_id VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    split_type ENUM('equal', 'custom', 'percentage') NOT NULL,
    group_name VARCHAR(100),
    note TEXT,
    splits JSON NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_split_id (split_id)
);

-- 17. WEEKLY CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS weekly_challenges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    challenge_id INT NOT NULL,
    week_start DATE NOT NULL,
    progress INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_challenge_week (user_id, challenge_id, week_start),
    INDEX idx_user (user_id)
);

-- 18. AGENT CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS agent_conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    conversation_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_updated (updated_at)
);

-- 19. AGENT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS agent_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id VARCHAR(100) NOT NULL,
    role ENUM('user', 'agent') NOT NULL,
    content TEXT NOT NULL,
    session_id VARCHAR(100),
    cart JSON,
    total DECIMAL(15,2),
    requires_action BOOLEAN DEFAULT FALSE,
    merchant VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation (conversation_id),
    INDEX idx_created (created_at)
);

-- 20. AGENT ORDERS TABLE
CREATE TABLE IF NOT EXISTS agent_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    conversation_id VARCHAR(100),
    merchant VARCHAR(100) NOT NULL,
    merchant_name VARCHAR(100),
    items JSON NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    tax DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    sabai_gems INT DEFAULT 0,
    status ENUM('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_breakdown JSON,
    transaction_id VARCHAR(100),
    tracking JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

-- 21. MERCHANT CONNECTIONS TABLE
CREATE TABLE IF NOT EXISTS merchant_connections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    merchant_id VARCHAR(100) NOT NULL,
    merchant_name VARCHAR(100),
    is_connected BOOLEAN DEFAULT TRUE,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_merchant (user_id, merchant_id),
    INDEX idx_user (user_id),
    INDEX idx_merchant (merchant_id)
);

-- 22. USER LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS user_locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    merchant_id VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_merchant_location (user_id, merchant_id),
    INDEX idx_user (user_id),
    INDEX idx_merchant (merchant_id)
);

-- Create additional indexes for performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, created_at);
CREATE INDEX idx_auto_pay_next ON auto_pay_orders(next_execution, status);
CREATE INDEX idx_bills_due ON bills(due_date, status);
CREATE INDEX idx_agent_orders_user_status ON agent_orders(user_id, status);

-- Insert sample user (for testing)
INSERT INTO users (phone_number, name, email, is_verified) VALUES 
('9876543210', 'Test User', 'test@example.com', TRUE)
ON DUPLICATE KEY UPDATE name = name;

-- Initialize coin balance for test user
INSERT INTO sabai_coins (user_id, balance, lifetime_earned)
SELECT id, 0, 0 FROM users u
WHERE NOT EXISTS (SELECT 1 FROM sabai_coins sc WHERE sc.user_id = u.id);

-- Show results
SELECT '✅ All tables created successfully!' as Status;
SHOW TABLES;
SELECT COUNT(*) as TotalUsers FROM users;

-- Add app_storage table for generic key-value storage
CREATE TABLE IF NOT EXISTS app_storage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    storage_key VARCHAR(255) NOT NULL,
    storage_value LONGTEXT,
    user_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_storage_key (storage_key),
    INDEX idx_user (user_id),
    INDEX idx_key (storage_key)
);

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_limit DECIMAL(15,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_spent DECIMAL(15,2) DEFAULT 0;

-- Add missing column to reserve_limits
ALTER TABLE reserve_limits ADD COLUMN IF NOT EXISTS current_spent DECIMAL(15,2) DEFAULT 0;

-- Create missing recurring_bills table
CREATE TABLE IF NOT EXISTS recurring_bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    bill_type VARCHAR(50),
    provider VARCHAR(100),
    amount DECIMAL(15,2),
    due_date DATE,
    frequency ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Fix foreign key constraints
ALTER TABLE bank_upi_pins 
DROP FOREIGN KEY IF EXISTS bank_upi_pins_ibfk_1;

ALTER TABLE bank_upi_pins 
ADD CONSTRAINT fk_bank_upi_pins_bank 
FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE;

-- First, fix any send/sent transactions (they should NOT earn cashback)
UPDATE transactions SET cashback_earned = 0 WHERE type IN ('send', 'sent');

-- Update coin balances (earned - used)
UPDATE sabai_coins sc 
SET sc.balance = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN t.type IN ('bill', 'recharge', 'cashback') 
                 AND t.status = 'success'
            THEN t.cashback_earned
            ELSE 0
        END
    ), 0) - COALESCE((
        SELECT SUM(t.gems_used)
        FROM transactions t2 
        WHERE t2.user_id = sc.user_id 
        AND t2.status = 'success'
        AND t2.gems_used > 0
    ), 0)
    FROM transactions t 
    WHERE t.user_id = sc.user_id AND t.status = 'success'
);

-- Update lifetime_earned (only from bill, recharge, cashback transactions)
UPDATE sabai_coins sc 
SET sc.lifetime_earned = (
    SELECT COALESCE(SUM(t.cashback_earned), 0)
    FROM transactions t 
    WHERE t.user_id = sc.user_id 
    AND t.status = 'success'
    AND t.type IN ('bill', 'recharge', 'cashback')
);

-- Update lifetime_used (gems used in any transaction)
UPDATE sabai_coins sc 
SET sc.lifetime_used = (
    SELECT COALESCE(SUM(t.gems_used), 0)
    FROM transactions t 
    WHERE t.user_id = sc.user_id 
    AND t.status = 'success'
    AND t.gems_used > 0
);

-- Verify the updated data
SELECT 
    u.phone_number,
    sc.balance,
    sc.lifetime_earned,
    sc.lifetime_used,
    (sc.lifetime_earned - sc.lifetime_used) as calculated_balance
FROM sabai_coins sc
JOIN users u ON sc.user_id = u.id;

-- Check recent transactions with cashback
SELECT 
    id,
    type,
    amount,
    cashback_earned,
    gems_used,
    status,
    DATE(created_at) as date
FROM transactions 
WHERE status = 'success' 
ORDER BY created_at DESC 
LIMIT 20;

-- Update coin balances
UPDATE sabai_coins sc 
SET sc.balance = (
    SELECT COALESCE(SUM(t.cashback_earned), 0) - COALESCE(SUM(t.gems_used), 0)
    FROM transactions t 
    WHERE t.user_id = sc.user_id 
    AND t.status = 'success'
);

-- Update lifetime_earned
UPDATE sabai_coins sc 
SET sc.lifetime_earned = (
    SELECT COALESCE(SUM(t.cashback_earned), 0)
    FROM transactions t 
    WHERE t.user_id = sc.user_id 
    AND t.status = 'success'
);

-- Update lifetime_used
UPDATE sabai_coins sc 
SET sc.lifetime_used = (
    SELECT COALESCE(SUM(t.gems_used), 0)
    FROM transactions t 
    WHERE t.user_id = sc.user_id 
    AND t.status = 'success'
);

-- Add new columns to order_sessions table
ALTER TABLE order_sessions 
ADD COLUMN IF NOT EXISTS preferences JSON NULL,
ADD COLUMN IF NOT EXISTS is_scheduled TINYINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_time DATETIME NULL;

-- Create scheduled_orders table
CREATE TABLE IF NOT EXISTS scheduled_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(50) NOT NULL,
    order_data JSON NOT NULL,
    scheduled_time DATETIME NOT NULL,
    status ENUM('scheduled', 'processing', 'executed', 'failed', 'cancelled') DEFAULT 'scheduled',
    executed_at DATETIME NULL,
    result JSON NULL,
    error TEXT NULL,
    retry_count INT DEFAULT 0,
    last_error TEXT NULL,
    cancelled_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_time (scheduled_time)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    data JSON NULL,
    is_read TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read)
);

-- Create user_order_preferences table
CREATE TABLE IF NOT EXISTS user_order_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    default_merchant VARCHAR(50) NULL,
    default_payment_method VARCHAR(50) NULL,
    dietary_preferences JSON NULL,
    budget_preferences JSON NULL,
    favorite_items JSON NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100),
    password_hash VARCHAR(255),
    upi_id VARCHAR(100),
    profile_pic VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);