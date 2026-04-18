// backend/services/databaseService.js
// COMPLETE FIXED VERSION - All SQL queries working

const db = require('../config/database');
const bcrypt = require('bcryptjs');

class DatabaseService {
    // ============ USER MANAGEMENT ============
    
    async getUserById(userId) {
        const [rows] = await db.pool.execute(
            `SELECT id, phone_number, name, email, upi_id, profile_pic, 
                    date_of_birth, gender, is_verified, created_at 
             FROM users WHERE id = ?`,
            [userId]
        );
        return rows[0];
    }

    async getUserByPhone(phoneNumber) {
        const [rows] = await db.pool.execute(
            `SELECT * FROM users WHERE phone_number = ?`,
            [phoneNumber]
        );
        return rows[0];
    }

    async createUser(phoneNumber, name, email = null, passwordHash = null) {
        const upiId = `${phoneNumber}@sabai`;
        const [result] = await db.pool.execute(
            `INSERT INTO users (phone_number, name, email, password_hash, upi_id, is_verified) 
             VALUES (?, ?, ?, ?, ?, TRUE)`,
            [phoneNumber, name, email, passwordHash, upiId]
        );
        
        await db.pool.execute(
            `INSERT INTO sabai_coins (user_id, balance) VALUES (?, 0)`,
            [result.insertId]
        );
        
        return result.insertId;
    }

    async updateLastLogin(userId) {
        await db.pool.execute(
            `UPDATE users SET last_login = NOW() WHERE id = ?`,
            [userId]
        );
    }

    async updateUserProfile(userId, updates) {
        const fields = [];
        const values = [];
        
        if (updates.name) {
            fields.push('name = ?');
            values.push(updates.name);
        }
        if (updates.email) {
            fields.push('email = ?');
            values.push(updates.email);
        }
        if (updates.profile_pic) {
            fields.push('profile_pic = ?');
            values.push(updates.profile_pic);
        }
        if (updates.date_of_birth) {
            fields.push('date_of_birth = ?');
            values.push(updates.date_of_birth);
        }
        if (updates.gender) {
            fields.push('gender = ?');
            values.push(updates.gender);
        }
        
        if (fields.length === 0) return null;
        
        values.push(userId);
        await db.pool.execute(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        
        return this.getUserById(userId);
    }

    // ============ OTP VERIFICATION ============
    
    async saveOTP(phoneNumber, otpCode, purpose = 'register') {
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await db.pool.execute(
            `INSERT INTO otp_verifications (phone_number, otp_code, purpose, expires_at) 
             VALUES (?, ?, ?, ?)`,
            [phoneNumber, otpCode, purpose, expiresAt]
        );
    }

    async verifyOTP(phoneNumber, otpCode, purpose = 'register') {
        const [rows] = await db.pool.execute(
            `SELECT * FROM otp_verifications 
             WHERE phone_number = ? AND otp_code = ? AND purpose = ? 
             AND is_verified = FALSE AND expires_at > NOW()
             ORDER BY id DESC LIMIT 1`,
            [phoneNumber, otpCode, purpose]
        );
        
        if (rows.length === 0) return false;
        
        await db.pool.execute(
            `UPDATE otp_verifications SET is_verified = TRUE WHERE id = ?`,
            [rows[0].id]
        );
        
        return true;
    }

    // ============ BANK ACCOUNTS ============
    
    async getBankAccounts(userId) {
        const [rows] = await db.pool.execute(
            `SELECT ba.*, COALESCE(bb.balance, 0) as balance 
             FROM bank_accounts ba
             LEFT JOIN bank_balances bb ON ba.id = bb.bank_account_id
             WHERE ba.user_id = ? 
             ORDER BY ba.is_primary DESC, ba.created_at ASC`,
            [userId]
        );
        return rows;
    }

    async getBankAccountById(accountId, userId) {
        const [rows] = await db.pool.execute(
            `SELECT ba.*, COALESCE(bb.balance, 0) as balance 
             FROM bank_accounts ba
             LEFT JOIN bank_balances bb ON ba.id = bb.bank_account_id
             WHERE ba.id = ? AND ba.user_id = ?`,
            [accountId, userId]
        );
        return rows[0];
    }

    async addBankAccount(userId, bankData) {
        const { bank_name, account_number, ifsc_code, account_holder_name, upi_id, is_primary } = bankData;
        
        if (is_primary) {
            await db.pool.execute(
                `UPDATE bank_accounts SET is_primary = FALSE WHERE user_id = ?`,
                [userId]
            );
        }
        
        const [result] = await db.pool.execute(
            `INSERT INTO bank_accounts 
             (user_id, bank_name, account_number, ifsc_code, account_holder_name, upi_id, is_primary) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, bank_name, account_number, ifsc_code, account_holder_name, upi_id, is_primary || false]
        );
        
        await db.pool.execute(
            `INSERT INTO bank_balances (user_id, bank_account_id, balance) VALUES (?, ?, 0)`,
            [userId, result.insertId]
        );
        
        return this.getBankAccountById(result.insertId, userId);
    }

    async deleteBill(billId, userId) {
    try {
        // First delete associated auto-pay orders
        await db.pool.execute(
            `DELETE FROM auto_pay_orders WHERE bill_id = ? AND user_id = ?`,
            [billId, userId]
        );
        
        // Then delete the bill
        const [result] = await db.pool.execute(
            `DELETE FROM bills WHERE id = ? AND user_id = ?`,
            [billId, userId]
        );
        
        console.log(`Deleted bill ${billId}, affected rows: ${result.affectedRows}`);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('deleteBill error:', error);
        throw error;
    }
}

// Find and check the updateBankBalance function:

async updateBankBalance(accountId, amount, isAddition = true) {
    try {
        console.log('updateBankBalance called:', { accountId, amount, isAddition });
        
        let result;
        if (isAddition) {
            [result] = await db.pool.execute(
                `UPDATE bank_balances SET balance = balance + ? WHERE bank_account_id = ?`,
                [amount, accountId]
            );
        } else {
            [result] = await db.pool.execute(
                `UPDATE bank_balances SET balance = balance - ? WHERE bank_account_id = ? AND balance >= ?`,
                [amount, accountId, amount]
            );
        }
        
        console.log('Update result:', result);
        
        const [rows] = await db.pool.execute(
            `SELECT balance FROM bank_balances WHERE bank_account_id = ?`,
            [accountId]
        );
        
        const newBalance = rows[0]?.balance || 0;
        console.log('New balance:', newBalance);
        return newBalance;
    } catch (error) {
        console.error('updateBankBalance error:', error);
        throw error;
    }
}

    async deleteBankAccount(accountId, userId) {
        await db.pool.execute(
            `DELETE FROM bank_accounts WHERE id = ? AND user_id = ?`,
            [accountId, userId]
        );
    }

    async setPrimaryBankAccount(accountId, userId) {
        await db.pool.execute(
            `UPDATE bank_accounts SET is_primary = FALSE WHERE user_id = ?`,
            [userId]
        );
        await db.pool.execute(
            `UPDATE bank_accounts SET is_primary = TRUE WHERE id = ? AND user_id = ?`,
            [accountId, userId]
        );
    }

    // ============ BANK UPI PINS ============
    
    async hasUpiPin(accountId) {
        try {
            const [rows] = await db.pool.execute(
                `SELECT * FROM bank_upi_pins WHERE bank_account_id = ?`,
                [accountId]
            );
            return rows.length > 0;
        } catch (error) {
            console.error('hasUpiPin error:', error);
            return false;
        }
    }

    async verifyUpiPin(accountId, enteredPin) {
        try {
            const [rows] = await db.pool.execute(
                `SELECT pin_hash FROM bank_upi_pins WHERE bank_account_id = ?`,
                [accountId]
            );
            
            if (rows.length === 0) return false;
            
            return await bcrypt.compare(enteredPin, rows[0].pin_hash);
        } catch (error) {
            console.error('verifyUpiPin error:', error);
            return false;
        }
    }

    async setUpiPin(accountId, pinHash) {
        try {
            await db.pool.execute(
                `INSERT INTO bank_upi_pins (bank_account_id, pin_hash) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE pin_hash = ?`,
                [accountId, pinHash, pinHash]
            );
            return true;
        } catch (error) {
            console.error('setUpiPin error:', error);
            throw error;
        }
    }

    // ============ TRANSACTIONS ============
    
    async createTransaction(transactionData) {
    try {
        const {
            transaction_id, user_id, type, amount, status = 'success',
            sender_vpa, receiver_vpa, receiver_name, bank_name, bank_account_id,
            description, gems_used = 0, reserve_used = 0, bank_used = 0,
            cashback_earned = 0, bill_type, customer_id, provider,
            mobile_number, operator, circle, failure_reason,
            payment_method_display, created_at
        } = transactionData;
        
        // Convert undefined to null for all fields
        const safeValue = (val) => (val === undefined ? null : val);
        
        // Convert ISO date string to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
        let formattedDate = null;
        if (created_at) {
            const date = new Date(created_at);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');
            } else {
                formattedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
            }
        } else {
            formattedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }
        
        console.log('Formatted date for MySQL:', formattedDate);
        
        const [result] = await db.pool.execute(
            `INSERT INTO transactions (
                transaction_id, user_id, type, amount, status,
                sender_vpa, receiver_vpa, receiver_name, bank_name, bank_account_id,
                description, gems_used, reserve_used, bank_used, cashback_earned,
                bill_type, customer_id, provider, mobile_number, operator, circle,
                failure_reason, payment_method_display, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                safeValue(transaction_id), safeValue(user_id), safeValue(type), safeValue(amount), safeValue(status),
                safeValue(sender_vpa), safeValue(receiver_vpa), safeValue(receiver_name), safeValue(bank_name), safeValue(bank_account_id),
                safeValue(description), safeValue(gems_used), safeValue(reserve_used), safeValue(bank_used), safeValue(cashback_earned),
                safeValue(bill_type), safeValue(customer_id), safeValue(provider), safeValue(mobile_number), safeValue(operator), safeValue(circle),
                safeValue(failure_reason), safeValue(payment_method_display), formattedDate
            ]
        );
        
        console.log('Transaction created with ID:', result.insertId);
        return result.insertId;
    } catch (error) {
        console.error('createTransaction error:', error);
        throw error;
    }
}
    async getTransactions(userId, limit = 100, offset = 0) {
        // Convert to numbers explicitly
        const limitNum = parseInt(limit) || 100;
        const offsetNum = parseInt(offset) || 0;
        
        const [rows] = await db.pool.execute(
            `SELECT * FROM transactions 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ${limitNum} OFFSET ${offsetNum}`,
            [userId]
        );
        return rows;
    }

    async getTransactionById(transactionId, userId) {
        const [rows] = await db.pool.execute(
            `SELECT * FROM transactions 
             WHERE transaction_id = ? AND user_id = ?`,
            [transactionId, userId]
        );
        return rows[0];
    }

    async getTransactionStats(userId) {
        const [rows] = await db.pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN type IN ('send', 'bill', 'recharge') AND status = 'success' THEN amount ELSE 0 END) as total_sent,
                SUM(CASE WHEN type = 'receive' AND status = 'success' THEN amount ELSE 0 END) as total_received,
                SUM(cashback_earned) as total_cashback
             FROM transactions WHERE user_id = ?`,
            [userId]
        );
        return rows[0];
    }

    // ============ SABAI COINS ============
    
    async getCoinBalance(userId) {
        const [rows] = await db.pool.execute(
            `SELECT balance, lifetime_earned, lifetime_used FROM sabai_coins WHERE user_id = ?`,
            [userId]
        );
        if (rows.length === 0) {
            await db.pool.execute(
                `INSERT INTO sabai_coins (user_id, balance) VALUES (?, 0)`,
                [userId]
            );
            return { balance: 0, lifetimeEarned: 0, lifetimeUsed: 0 };
        }
        return rows[0];
    }

    async updateCoinBalance(userId, amount, isAddition = true) {
        if (isAddition) {
            await db.pool.execute(
                `UPDATE sabai_coins 
                 SET balance = balance + ?, lifetime_earned = lifetime_earned + ? 
                 WHERE user_id = ?`,
                [amount, amount, userId]
            );
        } else {
            await db.pool.execute(
                `UPDATE sabai_coins 
                 SET balance = balance - ?, lifetime_used = lifetime_used + ? 
                 WHERE user_id = ? AND balance >= ?`,
                [amount, amount, userId, amount]
            );
        }
        
        return this.getCoinBalance(userId);
    }

    async addCoinTransaction(userId, amount, type, sourceType, sourceId, description) {
        await db.pool.execute(
            `INSERT INTO coin_transactions (user_id, amount, type, source_type, source_id, description) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, amount, type, sourceType, sourceId, description]
        );
    }

    async getCoinHistory(userId, limit = 50) {
        const limitNum = parseInt(limit) || 50;
        
        const [rows] = await db.pool.execute(
            `SELECT * FROM coin_transactions 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ${limitNum}`,
            [userId]
        );
        return rows;
    }

    // ============ RESERVE LIMITS ============

// backend/services/databaseService.js
// Replace ALL reserve limit related functions with these:

async getReserveLimits(userId) {
    try {
        const [rows] = await db.pool.execute(
            `SELECT * FROM reserve_limits 
             WHERE user_id = ? 
             ORDER BY merchant_name ASC`,
            [userId]
        );
        
        console.log(`Found ${rows.length} limits for user ${userId}`);
        
        // Parse contributions JSON for each limit
        const parsedLimits = rows.map(row => {
            let contributions = row.contributions;
            
            // Parse if it's a string
            if (typeof contributions === 'string') {
                try {
                    contributions = JSON.parse(contributions);
                } catch (e) {
                    console.error('Failed to parse contributions for', row.merchant, e);
                    contributions = [];
                }
            }
            
            // Ensure it's an array
            if (!Array.isArray(contributions)) {
                contributions = [];
            }
            
            // Log the contributions for debugging
            console.log(`Limit ${row.merchant}: ${contributions.length} contributions`, contributions);
            
            return {
                id: row.id,
                user_id: row.user_id,
                merchant: row.merchant,
                merchant_name: row.merchant_name,
                merchant_category: row.merchant_category,
                monthly_limit: Number(row.monthly_limit) || 0,
                current_spent: Number(row.current_spent) || 0,
                per_transaction_limit: row.per_transaction_limit ? Number(row.per_transaction_limit) : null,
                requires_approval: row.requires_approval === 1,
                is_active: row.is_active === 1,
                contributions: contributions,
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        });
        
        return parsedLimits;
    } catch (error) {
        console.error('getReserveLimits error:', error);
        return [];
    }
}

async getReserveLimit(userId, merchant) {
    try {
        const [rows] = await db.pool.execute(
            `SELECT * FROM reserve_limits 
             WHERE user_id = ? AND merchant = ?`,
            [userId, merchant]
        );
        
        if (rows.length > 0) {
            let contributions = rows[0].contributions;
            
            if (typeof contributions === 'string') {
                try {
                    contributions = JSON.parse(contributions);
                } catch (e) {
                    contributions = [];
                }
            }
            
            if (!Array.isArray(contributions)) {
                contributions = [];
            }
            
            console.log(`getReserveLimit ${merchant}: ${contributions.length} contributions`);
            
            return {
                id: rows[0].id,
                user_id: rows[0].user_id,
                merchant: rows[0].merchant,
                merchant_name: rows[0].merchant_name,
                merchant_category: rows[0].merchant_category,
                monthly_limit: Number(rows[0].monthly_limit) || 0,
                current_spent: Number(rows[0].current_spent) || 0,
                per_transaction_limit: rows[0].per_transaction_limit ? Number(rows[0].per_transaction_limit) : null,
                requires_approval: rows[0].requires_approval === 1,
                is_active: rows[0].is_active === 1,
                contributions: contributions,
                created_at: rows[0].created_at,
                updated_at: rows[0].updated_at
            };
        }
        return null;
    } catch (error) {
        console.error('getReserveLimit error:', error);
        return null;
    }
}

async createOrUpdateReserveLimit(userId, merchant, data) {
    try {
        const existing = await this.getReserveLimit(userId, merchant);
        
        // Ensure contributions is an array
        let contributions = data.contributions || [];
        
        // If contributions came as a string, parse it
        if (typeof contributions === 'string') {
            try {
                contributions = JSON.parse(contributions);
            } catch (e) {
                contributions = [];
            }
        }
        
        // Ensure each contribution has required fields
        contributions = contributions.map(c => ({
            bank_account_id: c.bank_account_id,
            bank_name: c.bank_name,
            amount: Number(c.amount) || 0,
            added_at: c.added_at || new Date().toISOString()
        }));
        
        const contributionsJSON = JSON.stringify(contributions);
        const monthlyLimit = Number(data.monthly_limit) || 0;
        
        console.log(`Saving limit for ${merchant}: monthly_limit=${monthlyLimit}, contributions=${contributions.length}`);
        
        if (existing) {
            const [result] = await db.pool.execute(
                `UPDATE reserve_limits SET 
                    monthly_limit = ?, 
                    per_transaction_limit = ?,
                    requires_approval = ?,
                    is_active = ?,
                    merchant_name = ?,
                    merchant_category = ?,
                    contributions = ?,
                    updated_at = NOW()
                 WHERE user_id = ? AND merchant = ?`,
                [
                    monthlyLimit,
                    data.per_transaction_limit ? Number(data.per_transaction_limit) : null,
                    data.requires_approval || false,
                    data.is_active !== false,
                    data.merchant_name,
                    data.merchant_category,
                    contributionsJSON,
                    userId,
                    merchant
                ]
            );
            console.log(`Updated limit for ${merchant}, affected rows: ${result.affectedRows}`);
            return this.getReserveLimit(userId, merchant);
        } else {
            const [result] = await db.pool.execute(
                `INSERT INTO reserve_limits 
                    (user_id, merchant, merchant_name, merchant_category, monthly_limit, 
                     per_transaction_limit, requires_approval, is_active, contributions)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId, merchant, data.merchant_name, data.merchant_category,
                    monthlyLimit,
                    data.per_transaction_limit ? Number(data.per_transaction_limit) : null,
                    data.requires_approval || false,
                    data.is_active !== false,
                    contributionsJSON
                ]
            );
            console.log(`Created new limit for ${merchant}, insert ID: ${result.insertId}`);
            return this.getReserveLimit(userId, merchant);
        }
    } catch (error) {
        console.error('createOrUpdateReserveLimit error:', error);
        throw error;
    }
}

async deleteReserveLimit(userId, merchant) {
    try {
        const [result] = await db.pool.execute(
            `DELETE FROM reserve_limits WHERE user_id = ? AND merchant = ?`,
            [userId, merchant]
        );
        console.log(`Deleted limit for ${merchant}, affected rows: ${result.affectedRows}`);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('deleteReserveLimit error:', error);
        throw error;
    }
}

async updateReserveLimitSpent(userId, merchant, amount) {
    try {
        const [result] = await db.pool.execute(
            `UPDATE reserve_limits SET current_spent = current_spent + ? 
             WHERE user_id = ? AND merchant = ?`,
            [Number(amount), userId, merchant]
        );
        console.log('Updated spent amount, affected rows:', result.affectedRows);
        return this.getReserveLimit(userId, merchant);
    } catch (error) {
        console.error('updateReserveLimitSpent error:', error);
        throw error;
    }
}

    // ============ BILLS ============
    
    async getBills(userId) {
    try {
        const [rows] = await db.pool.execute(
            `SELECT * FROM bills 
             WHERE user_id = ? AND status != 'paid' 
             ORDER BY due_date ASC`,
            [userId]
        );
        console.log(`Found ${rows.length} pending bills for user ${userId}`);
        return rows;
    } catch (error) {
        console.error('getBills error:', error);
        return [];
    }
}

    async createBill(userId, billData) {
    try {
        console.log('Creating bill for user:', userId, billData);
        
        const [result] = await db.pool.execute(
            `INSERT INTO bills (
                user_id, bill_type, provider, customer_id, amount, due_date,
                auto_pay, reserve_pay_enabled, reminder_days, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                userId, 
                billData.bill_type, 
                billData.provider, 
                billData.customer_id,
                billData.amount, 
                billData.due_date, 
                billData.auto_pay || false,
                billData.reserve_pay_enabled || false, 
                billData.reminder_days || 3
            ]
        );
        
        console.log('Bill created, insert ID:', result.insertId);
        return result.insertId;
    } catch (error) {
        console.error('createBill error:', error);
        throw error;
    }
}
    async updateBill(billId, userId, updates) {
        const fields = [];
        const values = [];
        
        if (updates.auto_pay !== undefined) {
            fields.push('auto_pay = ?');
            values.push(updates.auto_pay);
        }
        if (updates.reserve_pay_enabled !== undefined) {
            fields.push('reserve_pay_enabled = ?');
            values.push(updates.reserve_pay_enabled);
        }
        if (updates.reminder_days !== undefined) {
            fields.push('reminder_days = ?');
            values.push(updates.reminder_days);
        }
        if (updates.bank_account_id !== undefined) {
            fields.push('bank_account_id = ?');
            values.push(updates.bank_account_id);
        }
        if (updates.bank_name !== undefined) {
            fields.push('bank_name = ?');
            values.push(updates.bank_name);
        }
        if (updates.bank_account_last4 !== undefined) {
            fields.push('bank_account_last4 = ?');
            values.push(updates.bank_account_last4);
        }
        
        if (fields.length === 0) return;
        
        values.push(billId, userId);
        await db.pool.execute(
            `UPDATE bills SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );
    }

    async markBillAsPaid(billId, userId, paymentData) {
        const [bill] = await db.pool.execute(
            `SELECT * FROM bills WHERE id = ? AND user_id = ?`,
            [billId, userId]
        );
        
        if (bill.length === 0) return;
        
        await db.pool.execute(
            `UPDATE bills SET status = 'paid', paid_at = NOW() WHERE id = ?`,
            [billId]
        );
        
        await db.pool.execute(
            `INSERT INTO paid_bills (
                user_id, bill_id, provider, customer_id, amount, bill_type,
                payment_method, payment_breakdown, cashback_earned, transaction_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, billId, bill[0].provider, bill[0].customer_id,
                bill[0].amount, bill[0].bill_type, paymentData.payment_method,
                JSON.stringify(paymentData.payment_breakdown), paymentData.cashback_earned,
                paymentData.transaction_id
            ]
        );
    }

    async getPaidBills(userId, limit = 50) {
        const limitNum = parseInt(limit) || 50;
        
        const [rows] = await db.pool.execute(
            `SELECT * FROM paid_bills 
             WHERE user_id = ? 
             ORDER BY paid_at DESC 
             LIMIT ${limitNum}`,
            [userId]
        );
        return rows;
    }

    async getConnectedMerchants(userId) {
    try {
        const [rows] = await db.pool.execute(
            `SELECT 
                mc.merchant_id as merchantId,
                mc.merchant_name as merchantName,
                mc.connected_at as connectedAt,
                mc.last_used as lastUsed,
                mc.is_connected as isConnected
             FROM merchant_connections mc
             WHERE mc.user_id = ? AND mc.is_connected = TRUE
             ORDER BY mc.last_used DESC, mc.connected_at DESC`,
            [userId]
        );
        
        console.log(`Found ${rows.length} connected merchants for user ${userId}`);
        return rows;
    } catch (error) {
        console.error('getConnectedMerchants error:', error);
        return [];
    }
}

async isMerchantConnected(userId, merchantId) {
    try {
        const [rows] = await db.pool.execute(
            `SELECT is_connected FROM merchant_connections 
             WHERE user_id = ? AND merchant_id = ? AND is_connected = TRUE`,
            [userId, merchantId]
        );
        console.log(`isMerchantConnected: user=${userId}, merchant=${merchantId}, result=${rows.length > 0}`);
        return rows.length > 0;
    } catch (error) {
        console.error('isMerchantConnected error:', error);
        return false;
    }
}

async connectMerchant(userId, merchantId, merchantName) {
    try {
        await db.pool.execute(
            `INSERT INTO merchant_connections (user_id, merchant_id, merchant_name, is_connected, connected_at)
             VALUES (?, ?, ?, TRUE, NOW())
             ON DUPLICATE KEY UPDATE 
                is_connected = TRUE, 
                connected_at = NOW(),
                merchant_name = ?,
                updated_at = NOW()`,
            [userId, merchantId, merchantName, merchantName]
        );
        console.log(`Connected merchant ${merchantId} for user ${userId}`);
        return true;
    } catch (error) {
        console.error('connectMerchant error:', error);
        throw error;
    }
}

async disconnectMerchant(userId, merchantId) {
    try {
        const [result] = await db.pool.execute(
            `UPDATE merchant_connections 
             SET is_connected = FALSE
             WHERE user_id = ? AND merchant_id = ?`,
            [userId, merchantId]
        );
        console.log(`Disconnected merchant ${merchantId} for user ${userId}, affected rows: ${result.affectedRows}`);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('disconnectMerchant error:', error);
        throw error;
    }
}

async updateMerchantLastUsed(userId, merchantId) {
    try {
        await db.pool.execute(
            `UPDATE merchant_connections 
             SET last_used = NOW()
             WHERE user_id = ? AND merchant_id = ? AND is_connected = TRUE`,
            [userId, merchantId]
        );
        return true;
    } catch (error) {
        console.error('updateMerchantLastUsed error:', error);
        return false;
    }
}

async saveOrderSession(sessionData) {
    try {
        // Helper to convert undefined to null
        const toNull = (val) => (val === undefined ? null : val);
        
        // Ensure JSON fields are strings or null
        let merchantInfo = sessionData.merchant_info;
        if (merchantInfo !== null && merchantInfo !== undefined) {
            merchantInfo = typeof merchantInfo === 'string' ? merchantInfo : JSON.stringify(merchantInfo);
        } else {
            merchantInfo = null;
        }
        
        let cart = sessionData.cart;
        if (cart !== null && cart !== undefined) {
            cart = typeof cart === 'string' ? cart : JSON.stringify(cart);
        } else {
            cart = null;
        }
        
        let preferences = sessionData.preferences;
        if (preferences !== null && preferences !== undefined) {
            preferences = typeof preferences === 'string' ? preferences : JSON.stringify(preferences);
        } else {
            preferences = null;
        }
        
        const [result] = await db.pool.execute(
            `INSERT INTO order_sessions 
            (session_id, user_id, merchant, merchant_info, cart, subtotal, tax, total, step, preferences, is_scheduled, scheduled_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            merchant = VALUES(merchant),
            merchant_info = VALUES(merchant_info),
            cart = VALUES(cart),
            subtotal = VALUES(subtotal),
            tax = VALUES(tax),
            total = VALUES(total),
            step = VALUES(step),
            preferences = VALUES(preferences),
            is_scheduled = VALUES(is_scheduled),
            scheduled_time = VALUES(scheduled_time),
            updated_at = NOW()`,
            [
                toNull(sessionData.session_id),
                toNull(sessionData.user_id),
                toNull(sessionData.merchant),
                merchantInfo,
                cart,
                toNull(sessionData.subtotal) ?? 0,
                toNull(sessionData.tax) ?? 0,
                toNull(sessionData.total) ?? 0,
                toNull(sessionData.step) ?? 'init',
                preferences,
                toNull(sessionData.is_scheduled) ?? 0,
                toNull(sessionData.scheduled_time)
            ]
        );
        console.log(`✅ Saved session ${sessionData.session_id}`);
        return true;
    } catch (error) {
        console.error('saveOrderSession error:', error);
        return false;
    }
}

async getOrderSession(sessionId) {
    try {
        const [rows] = await db.pool.execute(
            `SELECT * FROM order_sessions WHERE session_id = ?`,
            [sessionId]
        );
        if (rows.length === 0) return null;
        const session = rows[0];
        // Parse JSON fields
        if (session.merchant_info && typeof session.merchant_info === 'string') {
            try { session.merchant_info = JSON.parse(session.merchant_info); } catch(e) { session.merchant_info = null; }
        }
        if (session.cart && typeof session.cart === 'string') {
            try { session.cart = JSON.parse(session.cart); } catch(e) { session.cart = []; }
        }
        if (session.preferences && typeof session.preferences === 'string') {
            try { session.preferences = JSON.parse(session.preferences); } catch(e) { session.preferences = null; }
        }
        return session;
    } catch (error) {
        console.error('getOrderSession error:', error);
        return null;
    }
}

async deleteOrderSession(sessionId) {
    try {
        await db.pool.execute(
            `DELETE FROM order_sessions WHERE session_id = ?`,
            [sessionId]
        );
        return true;
    } catch (error) {
        console.error('deleteOrderSession error:', error);
        return false;
    }
}

    // ============ RECHARGES ============
    
    async addRecentRecharge(userId, rechargeData) {
        const [result] = await db.pool.execute(
            `INSERT INTO recent_recharges (
                user_id, mobile_number, operator, operator_id, amount, circle, 
                transaction_id, cashback_earned, payment_method
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, rechargeData.mobileNumber, rechargeData.operator,
                rechargeData.operatorId, rechargeData.amount, rechargeData.circle,
                rechargeData.transactionId, rechargeData.cashbackEarned || 0,
                rechargeData.paymentMethod
            ]
        );
        return result.insertId;
    }

    async getRecentRecharges(userId, limit = 10) {
        const limitNum = parseInt(limit) || 10;
        
        const [rows] = await db.pool.execute(
            `SELECT * FROM recent_recharges 
             WHERE user_id = ? 
             ORDER BY recharged_at DESC 
             LIMIT ${limitNum}`,
            [userId]
        );
        return rows;
    }

    // ============ CONTACTS ============
    
    async getContacts(userId) {
        const [rows] = await db.pool.execute(
            `SELECT * FROM contacts 
             WHERE user_id = ? 
             ORDER BY transaction_count DESC, last_transaction DESC`,
            [userId]
        );
        return rows;
    }

    async createOrUpdateContact(userId, name, vpa, phone, amount, isReceived = false) {
    const [existing] = await db.pool.execute(
        `SELECT * FROM contacts WHERE user_id = ? AND vpa = ?`,
        [userId, vpa]
    );
    
    if (existing.length > 0) {
        const contact = existing[0];
        if (isReceived) {
            await db.pool.execute(
                `UPDATE contacts SET 
                    total_received = total_received + ?,
                    transaction_count = transaction_count + 1,
                    last_transaction = NOW(),
                    name = ?,
                    phone = ?
                 WHERE user_id = ? AND vpa = ?`,
                [amount, name, phone, userId, vpa]
            );
        } else {
            await db.pool.execute(
                `UPDATE contacts SET 
                    total_sent = total_sent + ?,
                    transaction_count = transaction_count + 1,
                    last_transaction = NOW(),
                    name = ?,
                    phone = ?
                 WHERE user_id = ? AND vpa = ?`,
                [amount, name, phone, userId, vpa]
            );
        }
    } else {
        const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        await db.pool.execute(
            `INSERT INTO contacts 
                (user_id, name, vpa, phone, avatar_color, total_sent, total_received, transaction_count, last_transaction)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [userId, name, vpa, phone, randomColor, isReceived ? 0 : amount, isReceived ? amount : 0, 1]
        );
    }
}

async verifyUpiPin(accountId, enteredPin) {
    try {
        const [rows] = await db.pool.execute(
            `SELECT pin_hash FROM bank_upi_pins WHERE bank_account_id = ?`,
            [accountId]
        );
        
        if (rows.length === 0) {
            console.log('No PIN found for account:', accountId);
            return false;
        }
        
        const isValid = await bcrypt.compare(enteredPin, rows[0].pin_hash);
        console.log('PIN verification result:', isValid);
        return isValid;
    } catch (error) {
        console.error('verifyUpiPin error:', error);
        return false;
    }
}


    // ============ AUTO PAY ORDERS ============
    
    async getAutoPayOrders(userId) {
    try {
        const [rows] = await db.pool.execute(
            `SELECT 
                id, order_id, type, merchant, merchant_name, amount,
                schedule, date_value, month_value, time_value, one_time_date,
                payment_method, bank_account_id, bank_name, bank_account_last4,
                next_execution, reminder_days, customer_id, bill_type, provider,
                mobile_number, operator, circle, status,
                is_recharge, is_bill_payment, bill_id, execution_history,
                created_at, updated_at
             FROM auto_pay_orders 
             WHERE user_id = ? 
             ORDER BY next_execution ASC`,
            [userId]
        );
        
        // Map database fields to frontend expected fields
        const mappedOrders = rows.map(order => ({
            id: order.id,
            orderId: order.order_id,
            type: order.type,
            merchant: order.merchant,
            merchantName: order.merchant_name,
            amount: order.amount,
            schedule: order.schedule,
            dateValue: order.date_value,
            monthValue: order.month_value,
            time: order.time_value,
            oneTimeDate: order.one_time_date,
            paymentMethod: order.payment_method,
            bankAccountId: order.bank_account_id,
            bankName: order.bank_name,
            bankAccountLast4: order.bank_account_last4,
            nextExecution: order.next_execution,
            reminderDays: order.reminder_days,
            status: order.status,
            isRecharge: order.is_recharge === 1,
            isBillPayment: order.is_bill_payment === 1,
            billId: order.bill_id,
            customerId: order.customer_id,
            billType: order.bill_type,
            provider: order.provider,
            mobileNumber: order.mobile_number,
            operator: order.operator,
            circle: order.circle,
            executionHistory: order.execution_history ? JSON.parse(order.execution_history) : [],
            createdAt: order.created_at,
            updatedAt: order.updated_at
        }));
        
        console.log(`Found ${mappedOrders.length} auto-pay orders for user ${userId}`);
        console.log('Recharge orders:', mappedOrders.filter(o => o.isRecharge === true));
        
        return mappedOrders;
    } catch (error) {
        console.error('getAutoPayOrders error:', error);
        return [];
    }
}

    async createAutoPayOrder(userId, orderData) {
    try {
        console.log('Creating auto-pay order for user:', userId, orderData);
        
        // Convert undefined to null for all fields
        const safeValue = (val) => (val === undefined ? null : val);
        
        // Convert ISO date to MySQL datetime format
        let formattedNextExecution = null;
        if (orderData.nextExecution) {
            const date = new Date(orderData.nextExecution);
            if (!isNaN(date.getTime())) {
                formattedNextExecution = date.toISOString().slice(0, 19).replace('T', ' ');
            }
        }
        
        // Ensure isRecharge and isBillPayment are set correctly
        const isRecharge = orderData.isRecharge === true || orderData.type === 'recharge';
        const isBillPayment = orderData.isBillPayment === true || orderData.type === 'bill';
        
        const [result] = await db.pool.execute(
            `INSERT INTO auto_pay_orders (
                user_id, order_id, type, merchant, merchant_name, amount,
                schedule, date_value, month_value, time_value, one_time_date,
                payment_method, bank_account_id, bank_name, bank_account_last4,
                next_execution, reminder_days, customer_id, bill_type, provider,
                mobile_number, operator, circle, status, 
                is_recharge, is_bill_payment, bill_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                safeValue(userId),
                safeValue(orderData.orderId),
                safeValue(orderData.type),
                safeValue(orderData.merchant),
                safeValue(orderData.merchantName),
                safeValue(orderData.amount),
                safeValue(orderData.schedule || 'monthly'),
                safeValue(orderData.dateValue),
                safeValue(orderData.monthValue),
                safeValue(orderData.time || '09:00:00'),
                safeValue(orderData.oneTimeDate),
                safeValue(orderData.paymentMethod),
                safeValue(orderData.bankAccountId),
                safeValue(orderData.bankName),
                safeValue(orderData.bankAccountLast4),
                formattedNextExecution,
                safeValue(orderData.reminderDays || 3),
                safeValue(orderData.customer_id),
                safeValue(orderData.bill_type),
                safeValue(orderData.provider),
                safeValue(orderData.mobile_number),
                safeValue(orderData.operator),
                safeValue(orderData.circle),
                safeValue(orderData.status || 'active'),
                isRecharge ? 1 : 0,
                isBillPayment ? 1 : 0,
                safeValue(orderData.bill_id)
            ]
        );
        
        console.log('Auto-pay order created, insert ID:', result.insertId);
        return result.insertId;
    } catch (error) {
        console.error('createAutoPayOrder error:', error);
        throw error;
    }
}

    async updateAutoPayOrderStatus(orderId, status) {
        await db.pool.execute(
            `UPDATE auto_pay_orders SET status = ? WHERE order_id = ?`,
            [status, orderId]
        );
    }

    async updateAutoPayExecution(orderId, executionData) {
        const [order] = await db.pool.execute(
            `SELECT execution_history FROM auto_pay_orders WHERE order_id = ?`,
            [orderId]
        );
        
        let history = [];
        if (order[0]?.execution_history) {
            history = JSON.parse(order[0].execution_history);
        }
        
        history.push(executionData);
        
        await db.pool.execute(
            `UPDATE auto_pay_orders SET 
                last_executed = ?,
                execution_history = ?,
                next_execution = ?,
                status = ?
             WHERE order_id = ?`,
            [
                executionData.date,
                JSON.stringify(history.slice(-10)),
                executionData.nextExecution,
                executionData.status,
                orderId
            ]
        );
    }

    async deleteAutoPayOrder(orderId, userId) {
        await db.pool.execute(
            `DELETE FROM auto_pay_orders WHERE order_id = ? AND user_id = ?`,
            [orderId, userId]
        );
    }

    // ============ AGENT CONVERSATIONS ============
    
    async getConversations(userId) {
        const [rows] = await db.pool.execute(
            `SELECT * FROM agent_conversations 
             WHERE user_id = ? 
             ORDER BY updated_at DESC`,
            [userId]
        );
        return rows;
    }

    async createConversation(userId, conversationId, title = null) {
        await db.pool.execute(
            `INSERT INTO agent_conversations (user_id, conversation_id, title) 
             VALUES (?, ?, ?)`,
            [userId, conversationId, title || 'New Chat']
        );
    }

    async addMessage(conversationId, role, content, sessionId = null, cart = null, total = null, requiresAction = false, merchant = null) {
        await db.pool.execute(
            `INSERT INTO agent_messages 
                (conversation_id, role, content, session_id, cart, total, requires_action, merchant)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [conversationId, role, content, sessionId, cart ? JSON.stringify(cart) : null, total, requiresAction, merchant]
        );
    }

    async getMessages(conversationId) {
        const [rows] = await db.pool.execute(
            `SELECT * FROM agent_messages 
             WHERE conversation_id = ? 
             ORDER BY created_at ASC`,
            [conversationId]
        );
        return rows;
    }

    async updateConversation(conversationId, updates) {
        const fields = [];
        const values = [];
        
        if (updates.title) {
            fields.push('title = ?');
            values.push(updates.title);
        }
        
        fields.push('updated_at = NOW()');
        
        if (fields.length === 0) return;
        
        values.push(conversationId);
        await db.pool.execute(
            `UPDATE agent_conversations SET ${fields.join(', ')} WHERE conversation_id = ?`,
            values
        );
    }

    async deleteConversation(conversationId, userId) {
        await db.pool.execute(
            `DELETE FROM agent_conversations WHERE conversation_id = ? AND user_id = ?`,
            [conversationId, userId]
        );
    }

    async saveScheduledOrder(scheduledOrder) {
  try {
    const toSafe = (val) => (val === undefined || val === null ? null : val);
    
    // Convert ISO datetime to MySQL datetime format
    let mysqlDateTime = null;
    if (scheduledOrder.scheduleTime) {
      const date = new Date(scheduledOrder.scheduleTime);
      if (!isNaN(date.getTime())) {
        mysqlDateTime = date.toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    const orderData = {
      merchant: scheduledOrder.merchant,
      merchantName: scheduledOrder.merchantName,
      items: scheduledOrder.items,
      totalAmount: scheduledOrder.totalAmount,
      paymentMethod: scheduledOrder.paymentMethod,
      paymentBreakdown: scheduledOrder.paymentBreakdown
    };

    const params = [
      toSafe(scheduledOrder.id),
      toSafe(scheduledOrder.userId),
      JSON.stringify(orderData),
      mysqlDateTime,  // converted datetime
      toSafe(scheduledOrder.status) || 'scheduled',
      scheduledOrder.paymentBreakdown ? JSON.stringify(scheduledOrder.paymentBreakdown) : null,
      toSafe(scheduledOrder.bankAccountId)
    ];

    const [result] = await db.pool.execute(
      `INSERT INTO scheduled_orders (
        schedule_id, user_id, order_data, scheduled_time, status, payment_breakdown, bank_account_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      params
    );
    return result.insertId;
  } catch (error) {
    console.error('saveScheduledOrder error:', error);
    throw error;
  }
}

async updateScheduledOrder(scheduleId, updates) {
    try {
        const fields = [];
        const values = [];
        
        if (updates.status) {
            fields.push('status = ?');
            values.push(updates.status);
        }
        if (updates.executed_at) {
            fields.push('executed_at = ?');
            values.push(updates.executed_at);
        }
        if (updates.result) {
            fields.push('result = ?');
            values.push(updates.result);
        }
        if (updates.error) {
            fields.push('error = ?');
            values.push(updates.error);
        }
        if (updates.retry_count !== undefined) {
            fields.push('retry_count = ?');
            values.push(updates.retry_count);
        }
        if (updates.last_error) {
            fields.push('last_error = ?');
            values.push(updates.last_error);
        }
        if (updates.cancelled_at) {
            fields.push('cancelled_at = ?');
            values.push(updates.cancelled_at);
        }
        if (updates.scheduled_time) {
            fields.push('scheduled_time = ?');
            values.push(updates.scheduled_time);
        }
        
        if (fields.length === 0) return;
        
        fields.push('updated_at = NOW()');
        values.push(scheduleId);
        
        await db.pool.execute(
            `UPDATE scheduled_orders SET ${fields.join(', ')} WHERE schedule_id = ?`,
            values
        );
    } catch (error) {
        console.error('updateScheduledOrder error:', error);
        throw error;
    }
}

async getScheduledOrders(userId) {
    const [rows] = await db.pool.execute(
        `SELECT schedule_id as id, user_id, order_data, scheduled_time, status, created_at 
         FROM scheduled_orders WHERE user_id = ? ORDER BY scheduled_time DESC`,
        [userId]
    );
    return rows.map(row => {
        let orderData = {};
        if (row.order_data) {
            try {
                orderData = typeof row.order_data === 'string' ? JSON.parse(row.order_data) : row.order_data;
            } catch(e) {}
        }
        return {
            id: row.id,
            merchant: orderData.merchant,
            merchantName: orderData.merchantName,
            items: orderData.items,
            totalAmount: orderData.totalAmount,
            status: row.status === 'confirmed' ? (orderData.status || 'confirmed') : row.status,
            isScheduled: row.status !== 'confirmed' && row.status !== 'failed',
            scheduledTime: row.scheduled_time,
            createdAt: row.created_at,
            tracking: orderData.tracking || [],
            paymentMethod: orderData.paymentMethod,
            sabaiGems: orderData.sabaiGems || 0
        };
    });
}

async getMerchantConnection(userId, merchantId) {
    try {
        const [rows] = await db.pool.execute(
            `SELECT * FROM merchant_connections 
             WHERE user_id = ? AND merchant_id = ? AND is_connected = TRUE`,
            [userId, merchantId]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('getMerchantConnection error:', error);
        return null;
    }
}


async getUserScheduledOrders(userId) {
    try {
        const [rows] = await db.pool.execute(
            `SELECT * FROM scheduled_orders 
             WHERE user_id = ? 
             ORDER BY scheduled_time ASC`,
            [userId]
        );
        return rows;
    } catch (error) {
        console.error('getUserScheduledOrders error:', error);
        return [];
    }
}

async saveNotification(userId, notification) {
    try {
        await db.pool.execute(
            `INSERT INTO notifications (user_id, type, message, data, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, notification.type, notification.message, JSON.stringify(notification), notification.timestamp]
        );
    } catch (error) {
        console.error('saveNotification error:', error);
    }
}

// Update saveOrderSession to include preferences and scheduled fields
async saveOrderSession(sessionData) {
    try {
        await db.pool.execute(
            `INSERT INTO order_sessions 
             (session_id, user_id, merchant, merchant_info, cart, subtotal, tax, total, step, preferences, is_scheduled, scheduled_time)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             merchant = VALUES(merchant),
             merchant_info = VALUES(merchant_info),
             cart = VALUES(cart),
             subtotal = VALUES(subtotal),
             tax = VALUES(tax),
             total = VALUES(total),
             step = VALUES(step),
             preferences = VALUES(preferences),
             is_scheduled = VALUES(is_scheduled),
             scheduled_time = VALUES(scheduled_time),
             updated_at = NOW()`,
            [
                sessionData.session_id,
                sessionData.user_id,
                sessionData.merchant,
                sessionData.merchant_info,
                sessionData.cart,
                sessionData.subtotal,
                sessionData.tax,
                sessionData.total,
                sessionData.step,
                sessionData.preferences,
                sessionData.is_scheduled || 0,
                sessionData.scheduled_time
            ]
        );
        return true;
    } catch (error) {
        console.error('saveOrderSession error:', error);
        return false;
    }
}

async updateMerchantLocation(userId, merchantId, location) {
    try {
        await db.pool.execute(
            `UPDATE merchant_connections 
             SET location_city = ?, location_area = ?, location_address = ?, updated_at = NOW()
             WHERE user_id = ? AND merchant_id = ?`,
            [location.city, location.area, location.address, userId, merchantId]
        );
        return true;
    } catch (error) {
        console.error('updateMerchantLocation error:', error);
        return false;
    }
}

async getMerchantConnection(userId, merchantId) {
    try {
        const [rows] = await db.pool.execute(
            `SELECT * FROM merchant_connections 
             WHERE user_id = ? AND merchant_id = ?`,
            [userId, merchantId]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('getMerchantConnection error:', error);
        return null;
    }
}

    // ============ AGENT ORDERS ============
    
    async createAgentOrder(userId, orderData) {
        const [result] = await db.pool.execute(
            `INSERT INTO agent_orders (
                user_id, order_id, conversation_id, merchant, merchant_name, items,
                subtotal, tax, total_amount, sabai_gems, status, payment_method,
                payment_breakdown, transaction_id, tracking
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, orderData.orderId, orderData.conversationId, orderData.merchant,
                orderData.merchantName, JSON.stringify(orderData.items), orderData.subtotal,
                orderData.tax || 0, orderData.totalAmount, orderData.sabaiGems || 0,
                orderData.status || 'pending', orderData.paymentMethod,
                JSON.stringify(orderData.paymentBreakdown || {}), orderData.transactionId,
                JSON.stringify(orderData.tracking || [])
            ]
        );
        return result.insertId;
    }

    async getAgentOrders(userId) {
        const [rows] = await db.pool.execute(
            `SELECT * FROM agent_orders 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [userId]
        );
        return rows;
    }

    async updateAgentOrderStatus(orderId, status, tracking = null) {
        let query = `UPDATE agent_orders SET status = ?`;
        const params = [status];
        
        if (tracking) {
            query += `, tracking = ?`;
            params.push(JSON.stringify(tracking));
        }
        
        query += ` WHERE order_id = ?`;
        params.push(orderId);
        
        await db.pool.execute(query, params);
    }

    // ============ MERCHANT CONNECTIONS ============
    
    async connectMerchant(userId, merchantId, merchantName) {
    try {
        await db.pool.execute(
            `INSERT INTO merchant_connections (user_id, merchant_id, merchant_name, is_connected, connected_at)
             VALUES (?, ?, ?, TRUE, NOW())
             ON DUPLICATE KEY UPDATE 
                is_connected = TRUE, 
                connected_at = NOW(),
                merchant_name = ?`,
            [userId, merchantId, merchantName, merchantName]
        );
        console.log(`Connected merchant ${merchantId} for user ${userId}`);
        return true;
    } catch (error) {
        console.error('connectMerchant error:', error);
        throw error;
    }
}

    async disconnectMerchant(userId, merchantId) {
    try {
        await db.pool.execute(
            `UPDATE merchant_connections 
             SET is_connected = FALSE, updated_at = NOW()
             WHERE user_id = ? AND merchant_id = ?`,
            [userId, merchantId]
        );
        console.log(`Disconnected merchant ${merchantId} for user ${userId}`);
        return true;
    } catch (error) {
        console.error('disconnectMerchant error:', error);
        throw error;
    }
}

    async updateMerchantLastUsed(userId, merchantId) {
    try {
        await db.pool.execute(
            `UPDATE merchant_connections 
             SET last_used = NOW()
             WHERE user_id = ? AND merchant_id = ?`,
            [userId, merchantId]
        );
        return true;
    } catch (error) {
        console.error('updateMerchantLastUsed error:', error);
        return false;
    }
}

async updateMerchantLastUsed(userId, merchantId) {
        await db.pool.execute(
            `UPDATE merchant_connections SET last_used = NOW() WHERE user_id = ? AND merchant_id = ?`,
            [userId, merchantId]
        );
    }

    async isMerchantConnected(userId, merchantId) {
    try {
        const [rows] = await db.pool.execute(
            `SELECT is_connected FROM merchant_connections 
             WHERE user_id = ? AND merchant_id = ? AND is_connected = TRUE`,
            [userId, merchantId]
        );
        return rows.length > 0;
    } catch (error) {
        console.error('isMerchantConnected error:', error);
        return false;
    }
}


    // ============ WEEKLY CHALLENGES ============
    
    async getWeeklyChallenges(userId) {
        const currentWeekStart = new Date();
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
        currentWeekStart.setHours(0, 0, 0, 0);
        
        const [rows] = await db.pool.execute(
            `SELECT * FROM weekly_challenges 
             WHERE user_id = ? AND week_start = ?`,
            [userId, currentWeekStart]
        );
        return rows;
    }

    async updateChallengeProgress(userId, challengeId, progress, completed = false) {
        const currentWeekStart = new Date();
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
        currentWeekStart.setHours(0, 0, 0, 0);
        
        await db.pool.execute(
            `INSERT INTO weekly_challenges (user_id, challenge_id, week_start, progress, completed)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE progress = ?, completed = ?`,
            [userId, challengeId, currentWeekStart, progress, completed, progress, completed]
        );
    }

    async claimChallengeReward(userId, challengeId) {
        const currentWeekStart = new Date();
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
        currentWeekStart.setHours(0, 0, 0, 0);
        
        await db.pool.execute(
            `UPDATE weekly_challenges 
             SET claimed = TRUE, claimed_at = NOW() 
             WHERE user_id = ? AND challenge_id = ? AND week_start = ? AND completed = TRUE`,
            [userId, challengeId, currentWeekStart]
        );
    }
}

module.exports = new DatabaseService();