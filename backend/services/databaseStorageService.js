// backend/services/databaseStorageService.js
// This service replaces localStorage with MySQL while maintaining the same API
const db = require('../config/database');

class DatabaseStorageService {
    constructor() {
        this.cache = new Map(); // In-memory cache for performance
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    }

    // Get user-specific key
    getUserKey(userId, key) {
        return `${userId}_${key}`;
    }

    // Set data (replaces localStorage.setItem)
    async setItem(key, value, userId = null) {
        try {
            const storageKey = userId ? this.getUserKey(userId, key) : key;
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            
            // Store in database
            await db.pool.execute(
                `INSERT INTO app_storage (storage_key, storage_value, user_id, updated_at) 
                 VALUES (?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE storage_value = ?, updated_at = NOW()`,
                [storageKey, stringValue, userId || null, stringValue]
            );
            
            // Update cache
            this.cache.set(storageKey, {
                value: stringValue,
                timestamp: Date.now()
            });
            
            return true;
        } catch (error) {
            console.error('DatabaseStorage setItem error:', error);
            return false;
        }
    }

    // Get data (replaces localStorage.getItem)
    async getItem(key, userId = null, defaultValue = null) {
        try {
            const storageKey = userId ? this.getUserKey(userId, key) : key;
            
            // Check cache first
            const cached = this.cache.get(storageKey);
            if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
                const value = cached.value;
                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            }
            
            // Get from database
            const [rows] = await db.pool.execute(
                `SELECT storage_value FROM app_storage WHERE storage_key = ?`,
                [storageKey]
            );
            
            if (rows.length > 0) {
                const value = rows[0].storage_value;
                // Update cache
                this.cache.set(storageKey, {
                    value: value,
                    timestamp: Date.now()
                });
                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            }
            
            return defaultValue;
        } catch (error) {
            console.error('DatabaseStorage getItem error:', error);
            return defaultValue;
        }
    }

    // Remove data (replaces localStorage.removeItem)
    async removeItem(key, userId = null) {
        try {
            const storageKey = userId ? this.getUserKey(userId, key) : key;
            await db.pool.execute(`DELETE FROM app_storage WHERE storage_key = ?`, [storageKey]);
            this.cache.delete(storageKey);
            return true;
        } catch (error) {
            console.error('DatabaseStorage removeItem error:', error);
            return false;
        }
    }

    // Clear all user data (for logout)
    async clearUserData(userId) {
        try {
            await db.pool.execute(`DELETE FROM app_storage WHERE user_id = ?`, [userId]);
            // Clear cache entries for this user
            for (const [key, value] of this.cache.entries()) {
                if (key.startsWith(`${userId}_`)) {
                    this.cache.delete(key);
                }
            }
            return true;
        } catch (error) {
            console.error('DatabaseStorage clearUserData error:', error);
            return false;
        }
    }
}

// Create storage table if not exists
const initStorageTable = async () => {
    try {
        await db.pool.execute(`
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
            )
        `);
        console.log('✅ App storage table ready');
    } catch (error) {
        console.error('Failed to create storage table:', error);
    }
};

initStorageTable();

module.exports = new DatabaseStorageService();