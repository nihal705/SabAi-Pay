import { merchantAPI } from './apiService';

export const availableMerchants = [
  { id: 'swiggy', name: 'Swiggy', category: 'food', icon: '🍔', color: '#FC8019', logoUrl: '/images/merchants/swiggy.png' },
  { id: 'zomato', name: 'Zomato', category: 'food', icon: '🍕', color: '#CB202D', logoUrl: '/images/merchants/zomato.png' },
  { id: 'zepto', name: 'Zepto', category: 'groceries', icon: '⚡', color: '#820AD1', logoUrl: '/images/merchants/zepto.png' },
  { id: 'blinkit', name: 'Blinkit', category: 'groceries', icon: '⚡', color: '#F7CB15', logoUrl: '/images/merchants/blinkit.png' },
  { id: 'amazon', name: 'Amazon', category: 'shopping', icon: '📦', color: '#FF9900', logoUrl: '/images/merchants/amazon.png' },
  { id: 'flipkart', name: 'Flipkart', category: 'shopping', icon: '🛍️', color: '#2874F0', logoUrl: '/images/merchants/flipkart.png' },
  { id: 'myntra', name: 'Myntra', category: 'shopping', icon: '👚', color: '#E63946', logoUrl: '/images/merchants/myntra.png' },
  { id: 'netmeds', name: 'NetMeds', category: 'healthcare', icon: '💊', color: '#00A651', logoUrl: '/images/merchants/netmeds.png' },
  { id: 'pharmeasy', name: 'PharmEasy', category: 'healthcare', icon: '💊', color: '#4CAF50', logoUrl: '/images/merchants/pharmaeasy.png' },
];

export const categoryNames = { shopping: 'Shopping', electronics: 'Electronics', food: 'Food Delivery', coffee: 'Coffee & Cafe', groceries: 'Groceries', healthcare: 'Healthcare', travel: 'Travel', entertainment: 'Entertainment' };
export const getCategoryIcon = (category) => ({ shopping: '🛍️', electronics: '💻', food: '🍔', coffee: '☕', groceries: '🛒', healthcare: '💊', travel: '✈️', entertainment: '🎬' }[category] || '📱');
export const merchantsByCategory = availableMerchants.reduce((all, merchant) => ({ ...all, [merchant.category]: [...(all[merchant.category] || []), merchant] }), {});

class MerchantConnectionService {
  constructor() { this.cache = new Map(); this.cacheTTL = 30_000; }
  clearCache(merchantId) { merchantId ? this.cache.delete(merchantId) : this.cache.clear(); }

  async getConnectedMerchants() {
    const response = await merchantAPI.getConnections();
    const connections = response.data.data || [];
    return connections.map((connection) => ({ ...availableMerchants.find((merchant) => merchant.id === connection.merchant_id), ...connection, merchantId: connection.merchant_id }));
  }
  async isConnected(_userId, merchantId) {
    const cached = this.cache.get(merchantId);
    if (cached && Date.now() - cached.at < this.cacheTTL) return cached.value;
    const response = await merchantAPI.checkConnection(merchantId);
    const value = Boolean(response.data.data?.connected);
    this.cache.set(merchantId, { value, at: Date.now() });
    return value;
  }
  async connectMerchant(_userId, merchantId, credentials = {}, location) {
    const response = await merchantAPI.connectMerchant(merchantId, { email: credentials.email, username: credentials.username }, location);
    this.clearCache(merchantId);
    return response.data;
  }
  async disconnectMerchant(_userId, merchantId) { const response = await merchantAPI.disconnectMerchant(merchantId); this.clearCache(merchantId); return response.data; }
  async updateMerchantLocation(_userId, merchantId, location) { const response = await merchantAPI.saveLocation(merchantId, location.address, location.city, location.area, location.coordinates); this.clearCache(merchantId); return Boolean(response.data.success); }
  async getMerchantWithLocation(_userId, merchantId) { const response = await merchantAPI.getLocation(merchantId); return response.data.data?.location || null; }
  async updateLastUsed(_userId, merchantId) { await merchantAPI.updateLastUsed(merchantId); this.clearCache(merchantId); }
  getConnections() { return {}; }
  getConnection() { return null; }
  getConnectionStatus(_userId, merchantIds) { return Object.fromEntries(merchantIds.map((id) => [id, this.isConnected(null, id)])); }
  clearConnections() { this.clearCache(); }
}

export default new MerchantConnectionService();
