// backend/models/Coin.js
// Coin model for SabAI rewards system

const db = require('../config/database');
const constants = require('../utils/constants');

class Coin {
    
    // Add coins to user
    static async addCoins(userId, amount, coinType, sourceId = null, description = null) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (constants.COIN_EXPIRY_DAYS || 30));
        
        const query = `
            INSERT INTO coins (
                user_id, amount, coin_type, source_transaction_id,
                source_description, expiry_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, 'active')
        `;
        
        const params = [
            userId,
            amount,
            coinType,
            sourceId,
            description,
            expiryDate
        ];
        
        const result = await db.executeQuery(query, params);
        
        if (result.success) {
            return {
                success: true,
                data: {
                    id: result.data.insertId,
                    user_id: userId,
                    amount,
                    expiry_date: expiryDate
                }
            };
        }
        
        return result;
    }
    
    // Get user's active coins
    static async getActiveCoins(userId) {
        const query = `
            SELECT * FROM coins 
            WHERE user_id = ? 
                AND status = 'active' 
                AND expiry_date > CURDATE()
            ORDER BY expiry_date ASC
        `;
        return await db.executeQuery(query, [userId]);
    }
    
    // Get total active coins balance
    static async getBalance(userId) {
        const query = `
            SELECT SUM(amount) as total 
            FROM coins 
            WHERE user_id = ? 
                AND status = 'active' 
                AND expiry_date > CURDATE()
        `;
        const result = await db.getOne(query, [userId]);
        
        if (result.success) {
            return { success: true, data: result.data.total || 0 };
        }
        
        return { success: false, data: 0 };
    }
    
    // Get coins expiring soon
    static async getExpiringSoon(userId, days = 7) {
        const query = `
            SELECT * FROM coins 
            WHERE user_id = ? 
                AND status = 'active'
                AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
                AND expiry_date > CURDATE()
            ORDER BY expiry_date ASC
        `;
        return await db.executeQuery(query, [userId, days]);
    }
    
    // Use coins (FIFO method)
    static async useCoins(userId, amount, purpose, targetAccount = null) {
        // Start transaction
        const connection = await db.beginTransaction();
        
        try {
            // Get available coins (oldest first)
            const [coins] = await connection.execute(
                `SELECT * FROM coins 
                 WHERE user_id = ? 
                    AND status = 'active' 
                    AND expiry_date > CURDATE()
                 ORDER BY expiry_date ASC`,
                [userId]
            );
            
            let remainingToUse = amount;
            const usedCoins = [];
            
            for (const coin of coins) {
                if (remainingToUse <= 0) break;
                
                const useFromThis = Math.min(coin.amount, remainingToUse);
                remainingToUse -= useFromThis;
                
                // Update coin amount
                await connection.execute(
                    'UPDATE coins SET amount = amount - ? WHERE id = ?',
                    [useFromThis, coin.id]
                );
                
                // If coin is fully used, mark as used
                if (coin.amount - useFromThis === 0) {
                    await connection.execute(
                        'UPDATE coins SET status = ? WHERE id = ?',
                        ['used', coin.id]
                    );
                }
                
                usedCoins.push({
                    coin_id: coin.id,
                    amount: useFromThis,
                    original_coin: coin
                });
            }
            
            if (remainingToUse > 0) {
                throw new Error('Insufficient coins');
            }
            
            // Record redemption
            const rupeeValue = amount / constants.COIN_CONVERSION_RATE;
            
            await connection.execute(
                `INSERT INTO coin_redemptions 
                 (user_id, coin_amount, rupee_value, redemption_type, target_account) 
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, amount, rupeeValue, purpose, targetAccount]
            );
            
            await connection.commit();
            
            return {
                success: true,
                data: {
                    coins_used: amount,
                    rupee_value: rupeeValue,
                    used_coins: usedCoins
                }
            };
            
        } catch (error) {
            await connection.rollback();
            return { success: false, error: error.message };
        } finally {
            connection.release();
        }
    }
    
    // Check if user has enough coins
    static async hasEnoughCoins(userId, amount) {
        const balance = await this.getBalance(userId);
        return balance.success && balance.data >= amount;
    }
    
    // Get coin history
    static async getHistory(userId, limit = 50, offset = 0) {
        const query = `
            SELECT * FROM coins 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;
        return await db.executeQuery(query, [userId, limit, offset]);
    }
    
    // Get redemption history
    static async getRedemptionHistory(userId, limit = 50, offset = 0) {
        const query = `
            SELECT * FROM coin_redemptions 
            WHERE user_id = ? 
            ORDER BY redeemed_at DESC 
            LIMIT ? OFFSET ?
        `;
        return await db.executeQuery(query, [userId, limit, offset]);
    }
    
    // Get coin statistics
    static async getStats(userId) {
        const query = `
            SELECT 
                COUNT(*) as total_earned_entries,
                SUM(amount) as total_coins_earned,
                SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END) as active_coins,
                SUM(CASE WHEN status = 'used' THEN amount ELSE 0 END) as used_coins,
                SUM(CASE WHEN status = 'expired' THEN amount ELSE 0 END) as expired_coins,
                COUNT(CASE WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
                           AND expiry_date > CURDATE() 
                           AND status = 'active' THEN 1 END) as expiring_soon_count,
                SUM(CASE WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
                           AND expiry_date > CURDATE() 
                           AND status = 'active' THEN amount ELSE 0 END) as expiring_soon_amount
            FROM coins 
            WHERE user_id = ?
        `;
        return await db.getOne(query, [userId]);
    }
    
    // Get coins by type
    static async getByType(userId, coinType) {
        const query = `
            SELECT * FROM coins 
            WHERE user_id = ? AND coin_type = ?
            ORDER BY created_at DESC
        `;
        return await db.executeQuery(query, [userId, coinType]);
    }
    
    // Process expired coins (cron job)
    static async processExpiredCoins() {
        const query = `
            UPDATE coins 
            SET status = 'expired' 
            WHERE expiry_date <= CURDATE() AND status = 'active'
        `;
        const result = await db.executeQuery(query);
        
        if (result.success) {
            return {
                success: true,
                data: {
                    affected_rows: result.data.affectedRows
                }
            };
        }
        
        return result;
    }
    
    // Get coins summary for dashboard
    static async getDashboardSummary(userId) {
        const balance = await this.getBalance(userId);
        const expiringSoon = await this.getExpiringSoon(userId, 7);
        const stats = await this.getStats(userId);
        
        return {
            success: true,
            data: {
                balance: balance.data || 0,
                expiring_soon: expiringSoon.success ? expiringSoon.data : [],
                expiring_soon_count: expiringSoon.success ? expiringSoon.data.length : 0,
                stats: stats.success ? stats.data : null,
                conversion_rate: constants.COIN_CONVERSION_RATE,
                coin_value: 1 / constants.COIN_CONVERSION_RATE
            }
        };
    }
}

module.exports = Coin;