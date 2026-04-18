// frontend/src/services/merchantConnectionService.js
// COMPLETE FIXED VERSION - Disconnect working

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const availableMerchants = [
  { id: 'swiggy', name: 'Swiggy', category: 'food', icon: '🍔', color: '#FC8019', logoUrl: '/images/merchants/swiggy.png' },
  { id: 'zomato', name: 'Zomato', category: 'food', icon: '🍕', color: '#CB202D', logoUrl: '/images/merchants/zomato.png' },
  { id: 'zepto', name: 'Zepto', category: 'groceries', icon: '⚡', color: '#820AD1', logoUrl: '/images/merchants/zepto.png' },
  { id: 'blinkit', name: 'Blinkit', category: 'groceries', icon: '⚡', color: '#F7CB15', logoUrl: '/images/merchants/blinkit.png' },
  { id: 'amazon', name: 'Amazon', category: 'shopping', icon: '📦', color: '#FF9900', logoUrl: '/images/merchants/amazon.png' },
  { id: 'flipkart', name: 'Flipkart', category: 'shopping', icon: '🛍️', color: '#2874F0', logoUrl: '/images/merchants/flipkart.png' },
  { id: 'myntra', name: 'Myntra', category: 'shopping', icon: '👚', color: '#E63946', logoUrl: '/images/merchants/myntra.png' },
  { id: 'netmeds', name: 'NetMeds', category: 'healthcare', icon: '💊', color: '#00A651', logoUrl: '/images/merchants/netmeds.png' },
  { id: 'pharmeasy', name: 'PharmEasy', category: 'healthcare', icon: '💊', color: '#4CAF50', logoUrl: '/images/merchants/pharmeasy.png' }
];

export const categoryNames = {
  shopping: 'Shopping',
  electronics: 'Electronics',
  food: 'Food Delivery',
  coffee: 'Coffee & Cafe',
  groceries: 'Groceries',
  healthcare: 'Healthcare',
  travel: 'Travel',
  entertainment: 'Entertainment'
};

export const getCategoryIcon = (category) => {
  const icons = {
    shopping: '🛍️',
    electronics: '💻',
    food: '🍔',
    coffee: '☕',
    groceries: '🛒',
    healthcare: '💊',
    travel: '✈️',
    entertainment: '🎬'
  };
  return icons[category] || '📱';
};

export const merchantsByCategory = availableMerchants.reduce((acc, merchant) => {
  if (!acc[merchant.category]) acc[merchant.category] = [];
  acc[merchant.category].push(merchant);
  return acc;
}, {});

class MerchantConnectionService {
  constructor() {
    this.storageKey = 'merchant_connections';
    this.cache = new Map();
    this.cacheTTL = 30000;
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      this.connections = saved ? JSON.parse(saved) : {};
      console.log('✅ Loaded merchant connections from localStorage:', Object.keys(this.connections).length, 'users');
    } catch (error) {
      console.error('Failed to load merchant connections:', error);
      this.connections = {};
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.connections));
    } catch (error) {
      console.error('Failed to save merchant connections:', error);
    }
  }

  getConnections(userId) {
    return this.connections[userId] || {};
  }

  getAllConnections() {
    return this.connections;
  }

  async isConnected(userId, merchantId) {
    try {
      const cacheKey = `${userId}_${merchantId}`;
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
        return cached.connected;
      }

      const response = await axios.get(
        `${API_BASE_URL}/merchant/check/${merchantId}`,
        { headers: getAuthHeaders() }
      );
      
      const isConnected = response.data?.data?.connected || false;
      
      this.cache.set(cacheKey, {
        connected: isConnected,
        timestamp: Date.now()
      });
      
      return isConnected;
    } catch (error) {
      console.error('Check connection error:', error);
      return !!(this.connections[userId] && this.connections[userId][merchantId]?.connected === true);
    }
  }

  // CONNECT MERCHANT - FIXED
  async connectMerchant(userId, merchantId, credentials) {
    try {
      console.log(`🔗 Connecting merchant ${merchantId} for user ${userId}`);
      
      const response = await axios.post(
        `${API_BASE_URL}/merchant/connect`,
        { merchantId, connectionData: credentials },
        { headers: getAuthHeaders() }
      );
      
      if (response.data?.success) {
        if (!this.connections[userId]) {
          this.connections[userId] = {};
        }
        
        this.connections[userId][merchantId] = {
          connected: true,
          merchantId,
          connectedAt: new Date().toISOString(),
          lastUsed: null,
          status: 'connected',
          credentials: {
            username: credentials?.email || credentials?.username || `user_${merchantId}`,
            email: credentials?.email || `user@${merchantId}.com`
          }
        };
        
        this.saveToStorage();
        
        const cacheKey = `${userId}_${merchantId}`;
        this.cache.delete(cacheKey);
        
        console.log(`✅ Connected ${merchantId} for user ${userId}`);
        return { success: true, data: this.connections[userId][merchantId] };
      }
      
      return response.data;
    } catch (error) {
      console.error('Connection failed:', error);
      return { success: false, error: error.message };
    }
  }

  // DISCONNECT MERCHANT - FIXED
  async disconnectMerchant(userId, merchantId) {
    try {
      console.log(`🔌 Disconnecting merchant ${merchantId} for user ${userId}`);
      
      // Call backend API
      const response = await axios.post(
        `${API_BASE_URL}/merchant/disconnect`,
        { merchantId },
        { headers: getAuthHeaders() }
      );
      
      console.log('Disconnect response:', response.data);
      
      if (response.data?.success) {
        // Update localStorage
        if (this.connections[userId] && this.connections[userId][merchantId]) {
          delete this.connections[userId][merchantId];
          this.saveToStorage();
        }
        
        // Clear cache
        const cacheKey = `${userId}_${merchantId}`;
        this.cache.delete(cacheKey);
        
        console.log(`✅ Disconnected ${merchantId} for user ${userId}`);
        return { success: true };
      }
      
      return { success: false, message: response.data?.message || 'Failed to disconnect' };
    } catch (error) {
      console.error('Disconnect failed:', error);
      return { success: false, error: error.message };
    }
  }

  async initDemoConnections(userId) {
    try {
      const userIdStr = String(userId);
      const demoMerchants = ['swiggy', 'zomato', 'zepto', 'amazon', 'flipkart'];
      
      console.log(`🎮 Initializing demo connections for user ${userIdStr}`);
      
      for (const merchantId of demoMerchants) {
        await this.connectMerchant(userIdStr, merchantId, { name: merchantId });
      }
      
      console.log(`✅ Demo connections initialized for user ${userIdStr}`);
      return this.getConnectedMerchants(userIdStr);
    } catch (error) {
      console.error('Failed to initialize demo connections:', error);
      return [];
    }
  }

  async updateMerchantLocation(userId, merchantId, location) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/merchant/update-location`,
        { merchantId, location },
        { headers: getAuthHeaders() }
      );
      
      if (response.data?.success) {
        if (this.connections[userId] && this.connections[userId][merchantId]) {
          this.connections[userId][merchantId].location = location;
          this.saveToStorage();
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update location error:', error);
      return false;
    }
  }

  async getMerchantWithLocation(userId, merchantId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/merchant/connection/${merchantId}`,
        { headers: getAuthHeaders() }
      );
      
      if (response.data?.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Get merchant connection error:', error);
      return null;
    }
  }

  async getConnectedMerchants(userId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/merchant/connections`,
        { headers: getAuthHeaders() }
      );
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      if (!this.connections[userId]) return [];
      
      const userConnections = this.connections[userId];
      const connectedMerchants = [];
      
      for (const [merchantId, connection] of Object.entries(userConnections)) {
        if (connection.connected) {
          const merchant = availableMerchants.find(m => m.id === merchantId);
          if (merchant) {
            connectedMerchants.push({
              ...merchant,
              ...connection,
              merchantId: merchantId
            });
          }
        }
      }
      
      return connectedMerchants;
    } catch (error) {
      console.error('Get connected merchants error:', error);
      return [];
    }
  }

  getConnection(userId, merchantId) {
    if (!this.connections[userId]) return null;
    return this.connections[userId][merchantId] || null;
  }

  async updateLastUsed(userId, merchantId) {
    try {
      await axios.post(
        `${API_BASE_URL}/merchant/update-last-used`,
        { merchantId },
        { headers: getAuthHeaders() }
      );
    } catch (error) {
      console.error('Update last used error:', error);
    }
    
    if (this.connections[userId] && this.connections[userId][merchantId]) {
      this.connections[userId][merchantId].lastUsed = new Date().toISOString();
      this.saveToStorage();
    }
  }

  getConnectionStatus(userId, merchantIds) {
    const status = {};
    merchantIds.forEach(id => {
      status[id] = this.isConnected(userId, id);
    });
    return status;
  }

  clearConnections(userId) {
    if (this.connections[userId]) {
      delete this.connections[userId];
      this.saveToStorage();
      console.log(`✅ Cleared all connections for user ${userId}`);
      return true;
    }
    return false;
  }
}

const merchantConnectionService = new MerchantConnectionService();

export default merchantConnectionService;