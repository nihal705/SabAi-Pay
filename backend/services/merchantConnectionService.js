// backend/services/merchantConnectionService.js
// COMPLETE WORKING VERSION

const dbService = require('./databaseService');

class MerchantConnectionService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 30000;
    console.log('✅ MerchantConnectionService initialized with database');
  }

  getCacheKey(userId, merchantId) {
    return `${userId}_${merchantId}`;
  }

  clearUserCache(userId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Cleared cache for user ${userId}`);
  }

  clearAllCache() {
    this.cache.clear();
    console.log('🗑️ Cleared all merchant connection cache');
  }

  async isConnected(userId, merchantId) {
    try {
      const userIdStr = String(userId);
      const merchantIdStr = String(merchantId);
      
      console.log(`🔍 Checking connection: user=${userIdStr}, merchant=${merchantIdStr}`);
      
      const cacheKey = this.getCacheKey(userIdStr, merchantIdStr);
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
        console.log(`✅ Cache hit: ${cached.connected}`);
        return cached.connected;
      }
      
      const isConnected = await dbService.isMerchantConnected(userIdStr, merchantIdStr);
      
      this.cache.set(cacheKey, {
        connected: isConnected,
        timestamp: Date.now()
      });
      
      console.log(`🔍 Result from DB: ${isConnected}`);
      return isConnected;
    } catch (error) {
      console.error('❌ Error checking connection:', error);
      return false;
    }
  }

  // CONNECT MERCHANT - FIXED
  async connectMerchant(userId, merchantId, connectionData) {
    try {
      const userIdStr = String(userId);
      const merchantIdStr = String(merchantId);
      const merchantName = connectionData?.name || merchantIdStr.charAt(0).toUpperCase() + merchantIdStr.slice(1);
      
      console.log(`🔗 Connecting merchant: user=${userIdStr}, merchant=${merchantIdStr}`);
      
      // Check if already connected
      const alreadyConnected = await this.isConnected(userIdStr, merchantIdStr);
      if (alreadyConnected) {
        return { success: false, message: 'Merchant already connected' };
      }
      
      // Save to database
      await dbService.connectMerchant(userIdStr, merchantIdStr, merchantName);
      
      // Also save location if provided
      if (connectionData?.location) {
        await dbService.updateMerchantLocation(userIdStr, merchantIdStr, connectionData.location);
      }
      
      // Clear cache for this user
      this.clearUserCache(userIdStr);
      
      console.log(`✅ User ${userIdStr} connected to ${merchantIdStr}`);
      return { 
        success: true, 
        data: {
          merchantId: merchantIdStr,
          merchantName: merchantName,
          connected: true,
          connectedAt: new Date().toISOString(),
          location: connectionData?.location || null
        } 
      };
    } catch (error) {
      console.error('❌ Connect merchant error:', error);
      return { success: false, error: error.message };
    }
  }

  // DISCONNECT MERCHANT - FIXED
  async disconnectMerchant(userId, merchantId) {
    try {
      const userIdStr = String(userId);
      const merchantIdStr = String(merchantId);
      
      console.log(`🔌 Disconnecting merchant: user=${userIdStr}, merchant=${merchantIdStr}`);
      
      // Update database
      await dbService.disconnectMerchant(userIdStr, merchantIdStr);
      
      // Clear cache for this user
      this.clearUserCache(userIdStr);
      
      console.log(`✅ User ${userIdStr} disconnected from ${merchantIdStr}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Disconnect merchant error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateMerchantLocation(userId, merchantId, location) {
    try {
      await dbService.updateMerchantLocation(userId, merchantId, location);
      console.log(`📍 Updated location for ${merchantId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Update merchant location error:', error);
      return false;
    }
  }

  async getMerchantConnection(userId, merchantId) {
    try {
      const connection = await dbService.getMerchantConnection(userId, merchantId);
      return connection;
    } catch (error) {
      console.error('Get merchant connection error:', error);
      return null;
    }
  }

  async getUserDefaultCity(userId, merchantId) {
    try {
        const connection = await this.getMerchantConnection(userId, merchantId);
        return connection?.location_city || null;
    } catch (error) {
        console.error('Error getting user city:', error);
        return null;
    }
  }

  async getConnectedMerchants(userId) {
    try {
      const userIdStr = String(userId);
      console.log(`📋 Getting connected merchants for user ${userIdStr}`);
      
      const merchants = await dbService.getConnectedMerchants(userIdStr);
      
      console.log(`✅ Found ${merchants.length} connected merchants for user ${userIdStr}`);
      return merchants;
    } catch (error) {
      console.error('❌ Get connected merchants error:', error);
      return [];
    }
  }

  async getConnection(userId, merchantId) {
    try {
      const userIdStr = String(userId);
      const merchantIdStr = String(merchantId);
      
      const isConnected = await this.isConnected(userIdStr, merchantIdStr);
      if (!isConnected) return null;
      
      const merchants = await this.getConnectedMerchants(userIdStr);
      return merchants.find(m => (m.merchantId || m.merchant_id) === merchantIdStr) || null;
    } catch (error) {
      console.error('❌ Get connection error:', error);
      return null;
    }
  }

  async updateLastUsed(userId, merchantId) {
    try {
      const userIdStr = String(userId);
      const merchantIdStr = String(merchantId);
      
      await dbService.updateMerchantLastUsed(userIdStr, merchantIdStr);
      console.log(`🕐 Updated last_used for user ${userIdStr}, merchant ${merchantIdStr}`);
      
      const cacheKey = this.getCacheKey(userIdStr, merchantIdStr);
      this.cache.delete(cacheKey);
      
      return true;
    } catch (error) {
      console.error('❌ Update last used error:', error);
      return false;
    }
  }

  getAllConnections() {
    return { message: 'Use database queries for full data' };
  }

  async initDemoConnections(userId) {
    try {
      const userIdStr = String(userId);
      console.log(`🎮 Initializing demo connections for user ${userIdStr}`);
      
      const demoMerchants = ['swiggy', 'zomato', 'zepto', 'amazon', 'flipkart'];
      
      for (const merchantId of demoMerchants) {
        await this.connectMerchant(userIdStr, merchantId, { name: merchantId });
      }
      
      console.log(`✅ Demo connections initialized for user ${userIdStr}`);
      return await this.getConnectedMerchants(userIdStr);
    } catch (error) {
      console.error('❌ Demo connections error:', error);
      return [];
    }
  }
}

module.exports = new MerchantConnectionService();