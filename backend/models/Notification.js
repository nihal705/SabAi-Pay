// backend/models/Notification.js
// Notification model for user alerts

const db = require('../config/database');
const constants = require('../utils/constants');

class Notification {
    
    // Create notification
    static async create(userId, notificationData) {
        const {
            type, title, message, action_url,
            action_text, data, priority
        } = notificationData;
        
        const query = `
            INSERT INTO notifications (
                user_id, type, title, message, action_url,
                action_text, data, priority, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const params = [
            userId,
            type || constants.NOTIFICATION_TYPES.REMINDER,
            title,
            message,
            action_url || null,
            action_text || null,
            data ? JSON.stringify(data) : null,
            priority || constants.NOTIFICATION_PRIORITIES.MEDIUM
        ];
        
        const result = await db.executeQuery(query, params);
        
        if (result.success) {
            return {
                success: true,
                data: {
                    id: result.data.insertId,
                    ...notificationData,
                    user_id: userId
                }
            };
        }
        
        return result;
    }
    
    // Get user notifications
    static async findByUserId(userId, limit = 50, offset = 0) {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;
        return await db.executeQuery(query, [userId, limit, offset]);
    }
    
    // Get unread notifications
    static async getUnread(userId) {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = ? AND is_read = false 
            ORDER BY created_at DESC
        `;
        return await db.executeQuery(query, [userId]);
    }
    
    // Get unread count
    static async getUnreadCount(userId) {
        const query = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false';
        const result = await db.getOne(query, [userId]);
        
        if (result.success) {
            return { success: true, data: result.data.count };
        }
        
        return { success: false, data: 0 };
    }
    
    // Mark as read
    static async markAsRead(userId, notificationId) {
        const query = `
            UPDATE notifications 
            SET is_read = true 
            WHERE user_id = ? AND id = ?
        `;
        const result = await db.executeQuery(query, [userId, notificationId]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'Notification marked as read' };
        }
        
        return { success: false, error: 'Notification not found' };
    }
    
    // Mark all as read
    static async markAllAsRead(userId) {
        const query = 'UPDATE notifications SET is_read = true WHERE user_id = ?';
        const result = await db.executeQuery(query, [userId]);
        
        return {
            success: true,
            data: {
                affected_rows: result.data.affectedRows
            }
        };
    }
    
    // Mark as clicked
    static async markAsClicked(userId, notificationId) {
        const query = `
            UPDATE notifications 
            SET is_clicked = true 
            WHERE user_id = ? AND id = ?
        `;
        const result = await db.executeQuery(query, [userId, notificationId]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'Notification marked as clicked' };
        }
        
        return { success: false, error: 'Notification not found' };
    }
    
    // Delete notification
    static async delete(userId, notificationId) {
        const query = 'DELETE FROM notifications WHERE user_id = ? AND id = ?';
        const result = await db.executeQuery(query, [userId, notificationId]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'Notification deleted' };
        }
        
        return { success: false, error: 'Notification not found' };
    }
    
    // Delete all read notifications
    static async deleteRead(userId) {
        const query = 'DELETE FROM notifications WHERE user_id = ? AND is_read = true';
        const result = await db.executeQuery(query, [userId]);
        
        return {
            success: true,
            data: {
                deleted_count: result.data.affectedRows
            }
        };
    }
    
    // Get notifications by type
    static async getByType(userId, type, limit = 50) {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = ? AND type = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        return await db.executeQuery(query, [userId, type, limit]);
    }
    
    // Get notifications by priority
    static async getByPriority(userId, priority) {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = ? AND priority = ? AND is_read = false
            ORDER BY created_at DESC
        `;
        return await db.executeQuery(query, [userId, priority]);
    }
    
    // Create transaction notification
    static async createTransactionNotification(userId, transactionData) {
        const { amount, type, merchant, status } = transactionData;
        
        let title, message;
        
        if (status === 'success') {
            title = 'Transaction Successful ✅';
            message = `Your payment of ₹${amount} to ${merchant || 'Unknown'} was successful.`;
        } else if (status === 'failed') {
            title = 'Transaction Failed ❌';
            message = `Your payment of ₹${amount} failed. Please try again.`;
        } else {
            title = 'Transaction Pending ⏳';
            message = `Your payment of ₹${amount} is being processed.`;
        }
        
        return await this.create(userId, {
            type: constants.NOTIFICATION_TYPES.TRANSACTION,
            title,
            message,
            priority: status === 'failed' ? constants.NOTIFICATION_PRIORITIES.HIGH : constants.NOTIFICATION_PRIORITIES.MEDIUM,
            data: transactionData
        });
    }
    
    // Create coin expiry notification
    static async createCoinExpiryNotification(userId, coins, expiryDate) {
        return await this.create(userId, {
            type: constants.NOTIFICATION_TYPES.COIN_EXPIRY,
            title: 'Coins Expiring Soon! 🪙',
            message: `Your ${coins} SabAI coins will expire on ${expiryDate}. Use them before they're gone!`,
            priority: constants.NOTIFICATION_PRIORITIES.HIGH,
            data: { coins, expiry_date: expiryDate }
        });
    }
    
    // Create limit alert notification
    static async createLimitAlert(userId, merchant, percentage) {
        return await this.create(userId, {
            type: constants.NOTIFICATION_TYPES.LIMIT_ALERT,
            title: 'Monthly Limit Alert ⚠️',
            message: `You've used ${percentage}% of your ${merchant} monthly limit.`,
            priority: constants.NOTIFICATION_PRIORITIES.HIGH,
            data: { merchant, percentage }
        });
    }
    
    // Create security notification
    static async createSecurityNotification(userId, message) {
        return await this.create(userId, {
            type: constants.NOTIFICATION_TYPES.SECURITY,
            title: 'Security Alert 🔒',
            message,
            priority: constants.NOTIFICATION_PRIORITIES.HIGH
        });
    }
    
    // Get notification statistics
    static async getStats(userId) {
        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread,
                SUM(CASE WHEN type = 'transaction' THEN 1 ELSE 0 END) as transaction_count,
                SUM(CASE WHEN type = 'coin_expiry' THEN 1 ELSE 0 END) as coin_expiry_count,
                SUM(CASE WHEN type = 'limit_alert' THEN 1 ELSE 0 END) as limit_alert_count,
                SUM(CASE WHEN priority = 'high' AND is_read = false THEN 1 ELSE 0 END) as high_priority_unread
            FROM notifications 
            WHERE user_id = ?
        `;
        return await db.getOne(query, [userId]);
    }
}

module.exports = Notification;