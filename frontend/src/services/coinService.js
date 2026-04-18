import { apiService } from './api';

class CoinService {
  constructor() {
    this.baseUrl = '/coins';
  }

  // Get coin balance
  async getBalance() {
    try {
      const response = await apiService.get(`${this.baseUrl}/balance`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch balance'
      };
    }
  }

  // Get coin history
  async getHistory(page = 1, limit = 20) {
    try {
      const response = await apiService.get(`${this.baseUrl}/history`, { page, limit });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch history'
      };
    }
  }

  // Get redemption history
  async getRedemptionHistory(page = 1, limit = 20) {
    try {
      const response = await apiService.get(`${this.baseUrl}/redemptions`, { page, limit });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch redemption history'
      };
    }
  }

  // Redeem coins
  async redeemCoins(redemptionData) {
    try {
      const response = await apiService.post(`${this.baseUrl}/redeem`, redemptionData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Redemption failed'
      };
    }
  }

  // Get expiring coins
  async getExpiringCoins(days = 7) {
    try {
      const response = await apiService.get(`${this.baseUrl}/expiring`, { days });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch expiring coins'
      };
    }
  }

  // Get coins by type
  async getCoinsByType(type) {
    try {
      const response = await apiService.get(`${this.baseUrl}/type/${type}`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch coins'
      };
    }
  }

  // Get dashboard summary
  async getDashboardSummary() {
    try {
      const response = await apiService.get(`${this.baseUrl}/dashboard`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch dashboard summary'
      };
    }
  }

  // Get earning opportunities
  async getEarningOpportunities() {
    try {
      const response = await apiService.get(`${this.baseUrl}/opportunities`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch opportunities'
      };
    }
  }

  // Get usage suggestions
  async getUsageSuggestions() {
    try {
      const response = await apiService.get(`${this.baseUrl}/suggestions`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch suggestions'
      };
    }
  }

  // Convert coins to value
  convertToValue(coins) {
    return (coins / 100).toFixed(2);
  }

  // Format coins with commas
  formatCoins(coins) {
    return new Intl.NumberFormat('en-IN').format(coins);
  }

  // Calculate cashback for amount
  calculateCashback(amount) {
    return Math.floor(amount / 100);
  }

  // Get coin value in words
  getCoinValueText(coins) {
    const value = this.convertToValue(coins);
    return `${value} (${coins} coins)`;
  }

  // Check if user can afford with coins
  canAfford(coins, requiredCoins) {
    return coins >= requiredCoins;
  }

  // Get minimum coins needed for redemption type
  getMinimumCoins(redemptionType) {
    const minima = {
      bill: 100,
      recharge: 100,
      shopping: 200,
      food: 150,
      transfer: 500
    };
    return minima[redemptionType] || 100;
  }

  // Get coin expiry status
  getExpiryStatus(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'expired';
    if (daysLeft === 0) return 'expires-today';
    if (daysLeft <= 3) return 'critical';
    if (daysLeft <= 7) return 'warning';
    if (daysLeft <= 15) return 'notice';
    return 'safe';
  }

  // Get color for expiry status
  getExpiryColor(status) {
    const colors = {
      expired: '#9ca3af',
      'expires-today': '#ef4444',
      critical: '#ef4444',
      warning: '#f59e0b',
      notice: '#fbbf24',
      safe: '#10b981'
    };
    return colors[status] || '#6b7280';
  }

  // Get icon for expiry status
  getExpiryIcon(status) {
    const icons = {
      expired: '❌',
      'expires-today': '⚠️',
      critical: '🔥',
      warning: '⚡',
      notice: '📢',
      safe: '✅'
    };
    return icons[status] || '🪙';
  }
}

export default new CoinService();