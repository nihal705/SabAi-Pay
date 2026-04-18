// backend/models/Transaction.js
// Transaction model for database operations

const db = require('../config/database');
const Helpers = require('../utils/helpers');
const constants = require('../utils/constants');

class Transaction {
    
    // Create new transaction
    static async create(transactionData) {
        const {
            user_id, amount, type, payment_method,
            receiver_vpa, receiver_name, merchant,
            description, category, bill_type, bill_number,
            razorpay_order_id
        } = transactionData;
        
        const transaction_id = Helpers.generateTransactionId();
        
        const query = `
            INSERT INTO transactions (
                transaction_id, user_id, amount, type, status, payment_method,
                receiver_vpa, receiver_name, merchant, description, category,
                bill_type, bill_number, razorpay_order_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const params = [
            transaction_id,
            user_id,
            amount,
            type || constants.TRANSACTION_TYPES.SEND,
            constants.TRANSACTION_STATUS.PENDING,
            payment_method || constants.PAYMENT_METHODS.UPI,
            receiver_vpa || null,
            receiver_name || null,
            merchant || null,
            description || null,
            category || null,
            bill_type || null,
            bill_number || null,
            razorpay_order_id || null
        ];
        
        const result = await db.executeQuery(query, params);
        
        if (result.success) {
            return {
                success: true,
                data: {
                    id: result.data.insertId,
                    transaction_id,
                    ...transactionData
                }
            };
        }
        
        return result;
    }
    
    // Get transaction by ID
    static async findById(id) {
        const query = 'SELECT * FROM transactions WHERE id = ?';
        return await db.getOne(query, [id]);
    }
    
    // Get transaction by transaction ID
    static async findByTransactionId(transaction_id) {
        const query = 'SELECT * FROM transactions WHERE transaction_id = ?';
        return await db.getOne(query, [transaction_id]);
    }
    
    // Get transactions by user ID
    static async findByUserId(user_id, filters = {}) {
        let query = 'SELECT * FROM transactions WHERE user_id = ?';
        const params = [user_id];
        
        // Apply filters
        if (filters.type) {
            query += ' AND type = ?';
            params.push(filters.type);
        }
        
        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }
        
        if (filters.from_date) {
            query += ' AND DATE(created_at) >= ?';
            params.push(filters.from_date);
        }
        
        if (filters.to_date) {
            query += ' AND DATE(created_at) <= ?';
            params.push(filters.to_date);
        }
        
        if (filters.merchant) {
            query += ' AND merchant = ?';
            params.push(filters.merchant);
        }
        
        // Add sorting and pagination
        query += ' ORDER BY created_at DESC';
        
        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);
            
            if (filters.offset) {
                query += ' OFFSET ?';
                params.push(filters.offset);
            }
        }
        
        return await db.executeQuery(query, params);
    }
    
    // Update transaction status
    static async updateStatus(id, status, razorpay_payment_id = null) {
        let query = 'UPDATE transactions SET status = ?';
        const params = [status];
        
        if (razorpay_payment_id) {
            query += ', razorpay_payment_id = ?';
            params.push(razorpay_payment_id);
        }
        
        query += ' WHERE id = ?';
        params.push(id);
        
        const result = await db.executeQuery(query, params);
        
        if (result.success && result.data.affectedRows > 0) {
            // If transaction succeeded, trigger coin addition
            if (status === constants.TRANSACTION_STATUS.SUCCESS) {
                await this.addCoinsForTransaction(id);
            }
            
            return { success: true, message: 'Transaction status updated' };
        }
        
        return { success: false, error: 'Transaction not found' };
    }
    
    // Add coins for successful transaction
    static async addCoinsForTransaction(transactionId) {
        const transaction = await this.findById(transactionId);
        
        if (!transaction.success || transaction.data.status !== constants.TRANSACTION_STATUS.SUCCESS) {
            return { success: false, error: 'Invalid transaction' };
        }
        
        const txn = transaction.data;
        const coinsToAdd = Math.floor(txn.amount / 100); // 1 coin per ₹100
        
        if (coinsToAdd > 0) {
            const Coin = require('./Coin');
            await Coin.addCoins(
                txn.user_id,
                coinsToAdd,
                constants.COIN_TYPES.CASHBACK,
                txn.transaction_id,
                `Cashback on ₹${txn.amount} transaction`
            );
        }
        
        return { success: true, coinsAdded: coinsToAdd };
    }
    
    // Get transaction statistics
    static async getStats(user_id, period = 'month') {
        let dateFilter = '';
        
        switch(period) {
            case 'week':
                dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                break;
            case 'month':
                dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                break;
            case 'year':
                dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)';
                break;
            default:
                dateFilter = '';
        }
        
        const query = `
            SELECT 
                COUNT(*) as total_count,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_amount,
                AVG(CASE WHEN status = 'success' THEN amount ELSE NULL END) as avg_amount,
                MAX(CASE WHEN status = 'success' THEN amount ELSE 0 END) as max_amount,
                COUNT(DISTINCT merchant) as unique_merchants,
                SUM(CASE WHEN type = 'send' AND status = 'success' THEN amount ELSE 0 END) as total_sent,
                SUM(CASE WHEN type = 'bill' AND status = 'success' THEN amount ELSE 0 END) as total_bills,
                SUM(CASE WHEN type = 'recharge' AND status = 'success' THEN amount ELSE 0 END) as total_recharges
            FROM transactions 
            WHERE user_id = ? ${dateFilter}
        `;
        
        return await db.getOne(query, [user_id]);
    }
    
    // Get spending by category
    static async getSpendingByCategory(user_id, period = 'month') {
        let dateFilter = '';
        
        switch(period) {
            case 'week':
                dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                break;
            case 'month':
                dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                break;
            case 'year':
                dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)';
                break;
            default:
                dateFilter = '';
        }
        
        const query = `
            SELECT 
                COALESCE(category, 'others') as category,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount
            FROM transactions 
            WHERE user_id = ? AND status = 'success' ${dateFilter}
            GROUP BY COALESCE(category, 'others')
            ORDER BY total_amount DESC
        `;
        
        return await db.executeQuery(query, [user_id]);
    }
    
    // Get spending by merchant
    static async getSpendingByMerchant(user_id, limit = 10) {
        const query = `
            SELECT 
                merchant,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount,
                MAX(created_at) as last_transaction
            FROM transactions 
            WHERE user_id = ? AND status = 'success' AND merchant IS NOT NULL
            GROUP BY merchant
            ORDER BY total_amount DESC
            LIMIT ?
        `;
        
        return await db.executeQuery(query, [user_id, limit]);
    }
    
    // Get daily spending trend
    static async getDailyTrend(user_id, days = 30) {
        const query = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount
            FROM transactions 
            WHERE user_id = ? 
                AND status = 'success'
                AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;
        
        return await db.executeQuery(query, [user_id, days]);
    }
    
    // Search transactions
    static async search(user_id, searchTerm) {
        const query = `
            SELECT * FROM transactions 
            WHERE user_id = ? 
                AND (
                    receiver_name LIKE ? 
                    OR merchant LIKE ? 
                    OR description LIKE ?
                    OR transaction_id LIKE ?
                )
            ORDER BY created_at DESC
            LIMIT 50
        `;
        
        const searchPattern = `%${searchTerm}%`;
        return await db.executeQuery(query, [
            user_id, 
            searchPattern, 
            searchPattern, 
            searchPattern,
            searchPattern
        ]);
    }
    
    // Get pending requests (money requests received)
    static async getPendingRequests(user_id) {
        const query = `
            SELECT * FROM transactions 
            WHERE receiver_vpa = (SELECT upi_id FROM users WHERE id = ?)
                AND type = 'request'
                AND status = 'pending'
            ORDER BY created_at DESC
        `;
        
        return await db.executeQuery(query, [user_id]);
    }
    
    // Get transaction by Razorpay order ID
    static async findByRazorpayOrderId(order_id) {
        const query = 'SELECT * FROM transactions WHERE razorpay_order_id = ?';
        return await db.getOne(query, [order_id]);
    }
    
    // Get transaction by Razorpay payment ID
    static async findByRazorpayPaymentId(payment_id) {
        const query = 'SELECT * FROM transactions WHERE razorpay_payment_id = ?';
        return await db.getOne(query, [payment_id]);
    }
    
    // Refund transaction
    static async refund(transaction_id) {
        const query = 'UPDATE transactions SET status = ? WHERE transaction_id = ?';
        const result = await db.executeQuery(query, [
            constants.TRANSACTION_STATUS.REFUNDED,
            transaction_id
        ]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'Transaction refunded' };
        }
        
        return { success: false, error: 'Transaction not found' };
    }
    
    // Delete transaction (admin only)
    static async delete(id) {
        const query = 'DELETE FROM transactions WHERE id = ?';
        return await db.executeQuery(query, [id]);
    }
    
    // Get transaction summary for user
    static async getSummary(user_id) {
        const query = `
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_value,
                MIN(created_at) as first_transaction,
                MAX(created_at) as last_transaction
            FROM transactions 
            WHERE user_id = ?
        `;
        
        return await db.getOne(query, [user_id]);
    }
}

module.exports = Transaction;