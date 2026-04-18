// backend/models/User.js
// User model for database operations

const db = require('../config/database');
const Helpers = require('../utils/helpers');

class User {
    
    // Create new user
    static async create(userData) {
        const { phone_number, name, email, password } = userData;
        
        // Generate UPI ID
        const upi_id = Helpers.generateUpiId(phone_number);
        
        // Hash password if provided
        let password_hash = null;
        if (password) {
            password_hash = await Helpers.hashPassword(password);
        }
        
        const query = `
            INSERT INTO users (
                phone_number, name, email, upi_id, password_hash, 
                monthly_limit, current_spent, is_verified, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const params = [
            phone_number, 
            name, 
            email || null, 
            upi_id, 
            password_hash,
            Helpers.DEFAULT_MONTHLY_LIMIT || 5000, 
            0, 
            false
        ];
        
        const result = await db.executeQuery(query, params);
        
        if (result.success) {
            return {
                success: true,
                data: {
                    id: result.data.insertId,
                    phone_number,
                    name,
                    email,
                    upi_id,
                    message: 'User created successfully'
                }
            };
        }
        
        return result;
    }
    
    // Find user by phone number
    static async findByPhone(phone_number) {
        const query = 'SELECT * FROM users WHERE phone_number = ?';
        return await db.getOne(query, [phone_number]);
    }
    
    // Find user by ID
    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = ?';
        return await db.getOne(query, [id]);
    }
    
    // Find user by UPI ID
    static async findByUpiId(upi_id) {
        const query = 'SELECT * FROM users WHERE upi_id = ?';
        return await db.getOne(query, [upi_id]);
    }
    
    // Update user
    static async update(id, updateData) {
        const allowedFields = ['name', 'email', 'profile_pic', 'date_of_birth', 'gender', 'theme', 'language'];
        const updates = [];
        const params = [];
        
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updates.push(`${key} = ?`);
                params.push(value);
            }
        }
        
        if (updates.length === 0) {
            return { success: false, error: 'No valid fields to update' };
        }
        
        params.push(id);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        
        const result = await db.executeQuery(query, params);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'User updated successfully' };
        }
        
        return { success: false, error: 'User not found' };
    }
    
    // Update monthly limit
    static async updateMonthlyLimit(id, monthly_limit) {
        const query = 'UPDATE users SET monthly_limit = ? WHERE id = ?';
        const result = await db.executeQuery(query, [monthly_limit, id]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'Monthly limit updated successfully' };
        }
        
        return { success: false, error: 'User not found' };
    }
    
    // Update password
    static async updatePassword(id, newPassword) {
        const password_hash = await Helpers.hashPassword(newPassword);
        const query = 'UPDATE users SET password_hash = ? WHERE id = ?';
        const result = await db.executeQuery(query, [password_hash, id]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'Password updated successfully' };
        }
        
        return { success: false, error: 'User not found' };
    }
    
    // Update UPI PIN
    static async updateUpiPin(id, pin) {
        const pin_hash = await Helpers.hashPassword(pin);
        const query = 'UPDATE users SET pin_hash = ? WHERE id = ?';
        const result = await db.executeQuery(query, [pin_hash, id]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'UPI PIN updated successfully' };
        }
        
        return { success: false, error: 'User not found' };
    }
    
    // Verify UPI PIN
    static async verifyUpiPin(id, pin) {
        const user = await this.findById(id);
        if (!user.success || !user.data.pin_hash) {
            return { success: false, error: 'PIN not set' };
        }
        
        const isValid = await Helpers.comparePassword(pin, user.data.pin_hash);
        return { success: isValid };
    }
    
    // Verify user (after OTP)
    static async verifyUser(id) {
        const query = 'UPDATE users SET is_verified = true WHERE id = ?';
        const result = await db.executeQuery(query, [id]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'User verified successfully' };
        }
        
        return { success: false, error: 'User not found' };
    }
    
    // Get user balance info
    static async getBalanceInfo(id) {
        const query = `
            SELECT 
                monthly_limit,
                current_spent,
                (monthly_limit - current_spent) as remaining
            FROM users 
            WHERE id = ?
        `;
        return await db.getOne(query, [id]);
    }
    
    // Get user with all details
    static async getUserDetails(id) {
        const query = `
            SELECT 
                u.*,
                COUNT(DISTINCT ba.id) as bank_accounts_count,
                COUNT(DISTINCT t.id) as transactions_count,
                COALESCE(SUM(CASE WHEN c.status = 'active' THEN c.amount ELSE 0 END), 0) as total_coins
            FROM users u
            LEFT JOIN bank_accounts ba ON u.id = ba.user_id
            LEFT JOIN transactions t ON u.id = t.user_id
            LEFT JOIN coins c ON u.id = c.user_id AND c.status = 'active'
            WHERE u.id = ?
            GROUP BY u.id
        `;
        
        return await db.getOne(query, [id]);
    }
    
    // Get user notifications
    static async getNotifications(id, limit = 20, offset = 0) {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;
        return await db.executeQuery(query, [id, limit, offset]);
    }
    
    // Mark notification as read
    static async markNotificationRead(userId, notificationId) {
        const query = `
            UPDATE notifications 
            SET is_read = true 
            WHERE user_id = ? AND id = ?
        `;
        return await db.executeQuery(query, [userId, notificationId]);
    }
    
    // Mark all notifications as read
    static async markAllNotificationsRead(userId) {
        const query = 'UPDATE notifications SET is_read = true WHERE user_id = ?';
        return await db.executeQuery(query, [userId]);
    }
    
    // Get unread notifications count
    static async getUnreadCount(userId) {
        const query = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false';
        const result = await db.getOne(query, [userId]);
        
        if (result.success) {
            return { success: true, data: result.data.count };
        }
        
        return { success: false, data: 0 };
    }
    
    // Add contact (frequent transaction partner)
    static async addContact(userId, contactVpa, contactName, contactPhone) {
        const query = `
            INSERT INTO contacts (user_id, contact_vpa, contact_name, contact_phone)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            contact_name = VALUES(contact_name),
            contact_phone = VALUES(contact_phone)
        `;
        
        return await db.executeQuery(query, [userId, contactVpa, contactName, contactPhone]);
    }
    
    // Get user contacts
    static async getContacts(userId) {
        const query = `
            SELECT * FROM contacts 
            WHERE user_id = ? 
            ORDER BY is_favorite DESC, transaction_count DESC, last_transaction DESC
        `;
        return await db.executeQuery(query, [userId]);
    }
    
    // Update contact transaction count
    static async updateContactTransaction(userId, contactVpa) {
        const query = `
            UPDATE contacts 
            SET transaction_count = transaction_count + 1,
                last_transaction = NOW()
            WHERE user_id = ? AND contact_vpa = ?
        `;
        return await db.executeQuery(query, [userId, contactVpa]);
    }
    
    // Toggle favorite contact
    static async toggleFavoriteContact(userId, contactId) {
        const query = `
            UPDATE contacts 
            SET is_favorite = NOT is_favorite 
            WHERE user_id = ? AND id = ?
        `;
        return await db.executeQuery(query, [userId, contactId]);
    }
    
    // Delete user (soft delete)
    static async delete(id) {
        const query = 'UPDATE users SET is_active = false WHERE id = ?';
        const result = await db.executeQuery(query, [id]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'User deactivated successfully' };
        }
        
        return { success: false, error: 'User not found' };
    }
    
    // Get all users (admin only)
    static async getAll(limit = 50, offset = 0) {
        const query = `
            SELECT id, phone_number, name, email, upi_id, monthly_limit, 
                   current_spent, is_verified, is_active, created_at
            FROM users 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;
        return await db.executeQuery(query, [limit, offset]);
    }
    
    // Get user statistics
    static async getStats(userId) {
        const query = `
            SELECT 
                COUNT(DISTINCT DATE(created_at)) as active_days,
                COUNT(*) as total_transactions,
                SUM(CASE WHEN type = 'send' THEN amount ELSE 0 END) as total_sent,
                SUM(CASE WHEN type = 'receive' THEN amount ELSE 0 END) as total_received,
                SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_spent,
                MAX(amount) as max_transaction,
                AVG(amount) as avg_transaction
            FROM transactions 
            WHERE user_id = ? AND status = 'success'
        `;
        return await db.getOne(query, [userId]);
    }
}

module.exports = User;