import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './useAuth';

export const useNotification = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [preferences, setPreferences] = useState({
    push: true,
    email: true,
    sms: false,
    whatsapp: false
  });

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL, {
        query: { userId: user.id }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('notification', (data) => {
        handleNewNotification(data);
      });

      newSocket.on('coin_expiry', (data) => {
        handleCoinExpiry(data);
      });

      newSocket.on('payment_success', (data) => {
        handlePaymentSuccess(data);
      });

      newSocket.on('limit_alert', (data) => {
        handleLimitAlert(data);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  // Fetch notifications on mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [user]);

  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/notifications?page=${page}&limit=${limit}`
      );
      
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unread_count);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/notifications/preferences`
      );
      
      if (response.data.success) {
        setPreferences(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  }, []);

  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/notifications/preferences`,
        newPreferences
      );
      
      if (response.data.success) {
        setPreferences(newPreferences);
        toast.success('Notification preferences updated');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to update preferences');
      return { success: false };
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/notifications/${notificationId}/read`
      );
      
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return { success: true };
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false };
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/notifications/read-all`
      );
      
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to mark all as read');
      return { success: false };
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/notifications/${notificationId}`
      );
      
      if (response.data.success) {
        setNotifications(prev =>
          prev.filter(n => n.id !== notificationId)
        );
        if (notifications.find(n => n.id === notificationId)?.is_read === false) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success('Notification deleted');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to delete notification');
      return { success: false };
    }
  }, [notifications]);

  const deleteAllRead = useCallback(async () => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/notifications/read-all`
      );
      
      if (response.data.success) {
        setNotifications(prev => prev.filter(n => !n.is_read));
        toast.success('All read notifications deleted');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to delete notifications');
      return { success: false };
    }
  }, []);

  const handleNewNotification = useCallback((data) => {
    setNotifications(prev => [data, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show toast based on notification type
    switch (data.type) {
      case 'transaction':
        toast.success(data.message, { icon: '💰' });
        break;
      case 'coin_expiry':
        toast.error(data.message, { icon: '🪙', duration: 5000 });
        break;
      case 'limit_alert':
        toast.custom((t) => (
          <div className="limit-alert-toast">
            <span>⚠️</span>
            <div>
              <strong>{data.title}</strong>
              <p>{data.message}</p>
            </div>
          </div>
        ), { duration: 5000 });
        break;
      case 'security':
        toast.error(data.message, { icon: '🔒' });
        break;
      default:
        toast(data.message, { icon: '🔔' });
    }
  }, []);

  const handleCoinExpiry = useCallback((data) => {
    toast.error(
      `⚠️ ${data.coins} coins expiring in ${data.days} days!`,
      {
        duration: 10000,
        icon: '🪙',
        action: {
          text: 'Redeem',
          onClick: () => window.location.href = '/coins'
        }
      }
    );
  }, []);

  const handlePaymentSuccess = useCallback((data) => {
    toast.success(
      `✅ Payment of ₹${data.amount} successful!`,
      {
        icon: '💰',
        action: {
          text: 'View',
          onClick: () => window.location.href = `/transactions/${data.transaction_id}`
        }
      }
    );
  }, []);

  const handleLimitAlert = useCallback((data) => {
    toast.custom((t) => (
      <div className="limit-alert">
        <div className="alert-icon">⚠️</div>
        <div className="alert-content">
          <h4>Limit Alert!</h4>
          <p>You've used {data.percentage}% of your {data.merchant} limit</p>
          <button onClick={() => window.location.href = '/reserve-pay'}>
            View Limits
          </button>
        </div>
      </div>
    ), { duration: 8000 });
  }, []);

  const sendNotification = useCallback(async (type, data) => {
    if (socket && isConnected) {
      socket.emit('send_notification', { type, data });
    }
  }, [socket, isConnected]);

  const subscribeToTopic = useCallback((topic) => {
    if (socket && isConnected) {
      socket.emit('subscribe', topic);
    }
  }, [socket, isConnected]);

  const unsubscribeFromTopic = useCallback((topic) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe', topic);
    }
  }, [socket, isConnected]);

  const getUnreadCount = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/notifications/unread-count`
      );
      
      if (response.data.success) {
        setUnreadCount(response.data.data.count);
        return response.data.data.count;
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const getNotificationStats = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/notifications/stats`
      );
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return { success: false };
    }
  }, []);

  const filterNotifications = useCallback((type) => {
    if (type === 'all') return notifications;
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const searchNotifications = useCallback((query) => {
    const searchTerm = query.toLowerCase();
    return notifications.filter(n =>
      n.title.toLowerCase().includes(searchTerm) ||
      n.message.toLowerCase().includes(searchTerm)
    );
  }, [notifications]);

  return {
    // State
    loading,
    notifications,
    unreadCount,
    preferences,
    isConnected,

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    updatePreferences,
    sendNotification,
    subscribeToTopic,
    unsubscribeFromTopic,
    getUnreadCount,
    getNotificationStats,
    filterNotifications,
    searchNotifications
  };
};

// Additional specialized hooks
export const useUnreadCount = () => {
  const { unreadCount, getUnreadCount } = useNotification();
  return { unreadCount, refreshUnreadCount: getUnreadCount };
};

export const useNotificationPreferences = () => {
  const { preferences, updatePreferences } = useNotification();
  return { preferences, updatePreferences };
};

export const useRealtimeNotifications = () => {
  const { isConnected, sendNotification, subscribeToTopic, unsubscribeFromTopic } = useNotification();
  return { isConnected, sendNotification, subscribeToTopic, unsubscribeFromTopic };
};

export const useNotificationActions = () => {
  const { markAsRead, markAllAsRead, deleteNotification, deleteAllRead } = useNotification();
  return { markAsRead, markAllAsRead, deleteNotification, deleteAllRead };
};

export default useNotification;