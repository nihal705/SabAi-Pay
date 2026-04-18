import { apiService } from './api';

class NotificationService {
  constructor() {
    this.baseUrl = '/auth/notifications';
  }

  // Get all notifications
  async getNotifications(page = 1, limit = 20) {
    try {
      const response = await apiService.get(`${this.baseUrl}`, { page, limit });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch notifications'
      };
    }
  }

  // Get unread notifications
  async getUnreadNotifications() {
    try {
      const response = await apiService.get(`/notifications/unread`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch unread notifications'
      };
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await apiService.get(`/notifications/unread-count`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch unread count'
      };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await apiService.put(`${this.baseUrl}/${notificationId}/read`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to mark notification as read'
      };
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await apiService.put(`${this.baseUrl}/read-all`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to mark all as read'
      };
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await apiService.delete(`/notifications/${notificationId}`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete notification'
      };
    }
  }

  // Delete all read notifications
  async deleteAllRead() {
    try {
      const response = await apiService.delete(`/notifications/read-all`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete read notifications'
      };
    }
  }

  // Get notification preferences
  async getPreferences() {
    try {
      const response = await apiService.get(`/notifications/preferences`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch preferences'
      };
    }
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    try {
      const response = await apiService.put(`/notifications/preferences`, preferences);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to update preferences'
      };
    }
  }

  // Get notification by type
  async getNotificationsByType(type, page = 1, limit = 20) {
    try {
      const response = await apiService.get(`/notifications/type/${type}`, { page, limit });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch notifications'
      };
    }
  }

  // Get notification stats
  async getStats() {
    try {
      const response = await apiService.get(`/notifications/stats`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch stats'
      };
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(subscription) {
    try {
      const response = await apiService.post(`/notifications/push/subscribe`, subscription);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to subscribe to push'
      };
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush() {
    try {
      const response = await apiService.post(`/notifications/push/unsubscribe`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to unsubscribe from push'
      };
    }
  }

  // Send test notification (admin only)
  async sendTestNotification(type = 'info') {
    try {
      const response = await apiService.post(`/notifications/test`, { type });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to send test notification'
      };
    }
  }

  // Clear all notifications
  async clearAll() {
    try {
      const response = await apiService.delete(`/notifications/clear-all`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to clear notifications'
      };
    }
  }

  // Get notification sound preference
  getNotificationSound() {
    return localStorage.getItem('notificationSound') !== 'false';
  }

  // Set notification sound preference
  setNotificationSound(enabled) {
    localStorage.setItem('notificationSound', enabled);
  }

  // Play notification sound
  playSound(type = 'default') {
    if (!this.getNotificationSound()) return;

    const sounds = {
      default: '/sounds/notification.mp3',
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      coin: '/sounds/coin.mp3'
    };

    const audio = new Audio(sounds[type] || sounds.default);
    audio.play().catch(() => {});
  }

  // Format notification time
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour ago`;
    if (diffDays < 7) return `${diffDays} day ago`;
    return date.toLocaleDateString();
  }

  // Get notification icon based on type
  getNotificationIcon(type) {
    const icons = {
      transaction: '💰',
      coin_expiry: '🪙',
      limit_alert: '⚠️',
      security: '🔒',
      reminder: '⏰',
      promo: '🎉',
      default: '📢'
    };
    return icons[type] || icons.default;
  }

  // Get notification color based on type
  getNotificationColor(type) {
    const colors = {
      transaction: '#10b981',
      coin_expiry: '#fbbf24',
      limit_alert: '#ef4444',
      security: '#8b5cf6',
      reminder: '#3b82f6',
      promo: '#ec4899'
    };
    return colors[type] || '#6b7280';
  }

  // Group notifications by date
  groupByDate(notifications) {
    const groups = {
      today: [],
      yesterday: [],
      earlier: []
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(notif => {
      const date = new Date(notif.created_at);
      date.setHours(0, 0, 0, 0);

      if (date.getTime() === today.getTime()) {
        groups.today.push(notif);
      } else if (date.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notif);
      } else {
        groups.earlier.push(notif);
      }
    });

    return groups;
  }
}

export default new NotificationService();