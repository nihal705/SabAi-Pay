// backend/models/AgentLimit.js
// Agent Limit model for Reserve Pay

const db = require('../config/database');

class AgentLimit {
    
    // Set or update limit for merchant
    static async setLimit(userId, limitData) {
        const {
            merchant, merchant_category, monthly_limit,
            per_transaction_limit, requires_approval
        } = limitData;
        
        // Check if limit already exists
        const existing = await this.findByUserAndMerchant(userId, merchant);
        
        if (existing.success && existing.data) {
            // Update existing limit
            const query = `
                UPDATE agent_limits 
                SET monthly_limit = ?,
                    per_transaction_limit = ?,
                    requires_approval = ?,
                    is_active = true,
                    updated_at = NOW()
                WHERE user_id = ? AND merchant = ?
            `;
            
            const params = [
                monthly_limit,
                per_transaction_limit || null,
                requires_approval || false,
                userId,
                merchant
            ];
            
            const result = await db.executeQuery(query, params);
            
            if (result.success) {
                return {
                    success: true,
                    message: 'Limit updated successfully',
                    data: { user_id: userId, merchant, monthly_limit }
                };
            }
            
            return result;
        } else {
            // Create new limit
            const query = `
                INSERT INTO agent_limits (
                    user_id, merchant, merchant_category,
                    monthly_limit, per_transaction_limit,
                    requires_approval, current_spent, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, 0, true)
            `;
            
            const params = [
                userId,
                merchant,
                merchant_category || 'others',
                monthly_limit,
                per_transaction_limit || null,
                requires_approval || false
            ];
            
            const result = await db.executeQuery(query, params);
            
            if (result.success) {
                return {
                    success: true,
                    message: 'Limit created successfully',
                    data: {
                        id: result.data.insertId,
                        user_id: userId,
                        merchant,
                        monthly_limit
                    }
                };
            }
            
            return result;
        }
    }
    
    // Find limit by user and merchant
    static async findByUserAndMerchant(userId, merchant) {
        const query = 'SELECT * FROM agent_limits WHERE user_id = ? AND merchant = ?';
        return await db.getOne(query, [userId, merchant]);
    }
    
    // Get all limits for user
    static async findByUserId(userId) {
        const query = `
            SELECT * FROM agent_limits 
            WHERE user_id = ? AND is_active = true
            ORDER BY merchant_category, merchant
        `;
        return await db.executeQuery(query, [userId]);
    }
    
    // Check if transaction is within limits
    static async checkLimit(userId, merchant, amount) {
        const limit = await this.findByUserAndMerchant(userId, merchant);
        
        if (!limit.success || !limit.data) {
            return {
                success: false,
                allowed: false,
                reason: 'No limit set for this merchant'
            };
        }
        
        const limitData = limit.data;
        
        // Check monthly limit
        if (limitData.current_spent + amount > limitData.monthly_limit) {
            return {
                success: true,
                allowed: false,
                reason: 'Monthly limit exceeded',
                remaining: limitData.monthly_limit - limitData.current_spent
            };
        }
        
        // Check per transaction limit
        if (limitData.per_transaction_limit && amount > limitData.per_transaction_limit) {
            return {
                success: true,
                allowed: false,
                reason: 'Per transaction limit exceeded',
                max_allowed: limitData.per_transaction_limit
            };
        }
        
        // Check if requires approval
        if (limitData.requires_approval) {
            return {
                success: true,
                allowed: true,
                requires_approval: true,
                remaining: limitData.monthly_limit - limitData.current_spent
            };
        }
        
        return {
            success: true,
            allowed: true,
            auto_approve: true,
            remaining: limitData.monthly_limit - limitData.current_spent
        };
    }
    
    // Update spent amount
    static async updateSpent(userId, merchant, amount) {
        const query = `
            UPDATE agent_limits 
            SET current_spent = current_spent + ? 
            WHERE user_id = ? AND merchant = ?
        `;
        
        const result = await db.executeQuery(query, [amount, userId, merchant]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'Spent amount updated' };
        }
        
        return { success: false, error: 'Limit not found' };
    }
    
    // Reset spent amount (monthly)
    static async resetMonthlySpent() {
        const query = 'UPDATE agent_limits SET current_spent = 0';
        return await db.executeQuery(query);
    }
    
    // Delete limit
    static async delete(userId, merchant) {
        const query = 'DELETE FROM agent_limits WHERE user_id = ? AND merchant = ?';
        const result = await db.executeQuery(query, [userId, merchant]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'Limit deleted' };
        }
        
        return { success: false, error: 'Limit not found' };
    }
    
    // Deactivate limit
    static async deactivate(userId, merchant) {
        const query = `
            UPDATE agent_limits 
            SET is_active = false 
            WHERE user_id = ? AND merchant = ?
        `;
        const result = await db.executeQuery(query, [userId, merchant]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'Limit deactivated' };
        }
        
        return { success: false, error: 'Limit not found' };
    }
    
    // Get spending summary for user
    static async getSummary(userId) {
        const query = `
            SELECT 
                COUNT(*) as total_limits,
                SUM(monthly_limit) as total_monthly_budget,
                SUM(current_spent) as total_spent,
                AVG(current_spent/monthly_limit) * 100 as avg_usage_percentage
            FROM agent_limits 
            WHERE user_id = ? AND is_active = true
        `;
        return await db.getOne(query, [userId]);
    }
    
    // Get merchants nearing limit
    static async getNearLimit(userId, threshold = 80) {
        const query = `
            SELECT * FROM agent_limits 
            WHERE user_id = ? 
                AND is_active = true
                AND (current_spent / monthly_limit) * 100 >= ?
            ORDER BY (current_spent / monthly_limit) DESC
        `;
        return await db.executeQuery(query, [userId, threshold]);
    }
}

module.exports = AgentLimit;