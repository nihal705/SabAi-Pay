// frontend/src/components/settings/Notifications.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBell,
  FaEnvelope,
  FaMobile,
  FaWhatsapp,
  FaTelegram,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaCoins,
  FaExclamationTriangle,
  FaCreditCard,
  FaRobot,
  FaSpinner,
  FaArrowRight,
  FaInfoCircle,
  FaCheckDouble,
  FaSlidersH,
  FaMoon,
  FaSun
} from 'react-icons/fa';
import { MdNotifications, MdPayment, MdSecurity, MdUpdate } from 'react-icons/md';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import './SettingsStyles.css';

const Notifications = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('channels');
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: '22:00',
    end: '08:00'
  });
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [preferences, setPreferences] = useState({
    push: {
      transactions: true,
      coin_expiry: true,
      limit_alerts: true,
      promotions: false,
      security: true,
      agent_suggestions: true
    },
    email: {
      transactions: true,
      monthly_report: true,
      promotions: false,
      security: true
    },
    sms: {
      transactions: false,
      otp: true,
      alerts: true
    },
    whatsapp: {
      transactions: false,
      promotions: false
    }
  });

  const [notificationStats, setNotificationStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    thisWeek: 0
  });

  // Load preferences from localStorage
  useEffect(() => {
    loadPreferences();
    loadNotificationHistory();
    calculateStats();
  }, []);

  const loadPreferences = () => {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  };

  const savePreferences = (newPreferences) => {
    localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
    setPreferences(newPreferences);
    calculateStats();
  };

  const loadNotificationHistory = async () => {
    setHistoryLoading(true);
    try {
      // Mock API call
      setTimeout(() => {
        setNotificationHistory([
          {
            id: 1,
            type: 'transaction',
            title: 'Payment Successful',
            message: 'Your payment of ₹500 to Rahul Kumar was successful',
            time: '5 minutes ago',
            read: false,
            icon: MdPayment,
            color: '#10b981'
          },
          {
            id: 2,
            type: 'security',
            title: 'New Login Detected',
            message: 'New login from Chrome on Windows, Mumbai',
            time: '2 hours ago',
            read: false,
            icon: MdSecurity,
            color: '#3b82f6'
          },
          {
            id: 3,
            type: 'coin',
            title: 'Coins Earned',
            message: 'You earned 25 SabAI coins from your recent transaction',
            time: '5 hours ago',
            read: true,
            icon: FaCoins,
            color: '#f59e0b'
          },
          {
            id: 4,
            type: 'promo',
            title: 'Special Offer',
            message: 'Get 10% cashback on your next bill payment',
            time: '1 day ago',
            read: true,
            icon: FaCreditCard,
            color: '#ec4899'
          },
          {
            id: 5,
            type: 'agent',
            title: 'AI Agent Suggestion',
            message: 'Based on your spending, you could save ₹500 on utilities',
            time: '2 days ago',
            read: true,
            icon: FaRobot,
            color: '#8b5cf6'
          },
          {
            id: 6,
            type: 'limit',
            title: 'Limit Alert',
            message: 'You have used 80% of your monthly limit for Swiggy',
            time: '3 days ago',
            read: true,
            icon: FaExclamationTriangle,
            color: '#ef4444'
          }
        ]);
        setHistoryLoading(false);
      }, 800);
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistoryLoading(false);
    }
  };

  const calculateStats = () => {
    // Mock stats calculation
    setNotificationStats({
      total: 156,
      unread: 2,
      today: 3,
      thisWeek: 12
    });
  };

  const handleToggle = (channel, key) => {
    const newPreferences = {
      ...preferences,
      [channel]: {
        ...preferences[channel],
        [key]: !preferences[channel][key]
      }
    };

    setPreferences(newPreferences);
    savePreferences(newPreferences);
    toast.success('Notification preference updated');
  };

  const handleQuietHoursToggle = () => {
    setQuietHours(prev => ({ ...prev, enabled: !prev.enabled }));
    toast.success(`Quiet hours ${!quietHours.enabled ? 'enabled' : 'disabled'}`);
  };

  const handleQuietHoursChange = (field, value) => {
    setQuietHours(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveQuietHours = () => {
    localStorage.setItem('quietHours', JSON.stringify(quietHours));
    toast.success('Quiet hours saved successfully');
  };

  const handleMarkAllRead = () => {
    const updatedHistory = notificationHistory.map(n => ({ ...n, read: true }));
    setNotificationHistory(updatedHistory);
    setNotificationStats(prev => ({ ...prev, unread: 0 }));
    toast.success('All notifications marked as read');
  };

  const handleMarkAsRead = (id) => {
    const updatedHistory = notificationHistory.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotificationHistory(updatedHistory);
    setNotificationStats(prev => ({ 
      ...prev, 
      unread: Math.max(0, prev.unread - 1) 
    }));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      setNotificationHistory([]);
      setNotificationStats({
        total: 0,
        unread: 0,
        today: 0,
        thisWeek: 0
      });
      toast.success('All notifications cleared');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'transaction': return MdPayment;
      case 'coin': return FaCoins;
      case 'limit': return FaExclamationTriangle;
      case 'security': return MdSecurity;
      case 'promo': return FaBell;
      case 'agent': return FaRobot;
      default: return MdNotifications;
    }
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const tabs = [
    { id: 'channels', label: 'Channels', icon: FaBell },
    { id: 'quiet', label: 'Quiet Hours', icon: FaMoon },
    { id: 'history', label: 'History', icon: FaClock }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="notifications-settings"
    >
      <div className="settings-header">
        <h2>Notification Settings</h2>
        <button 
          className="mark-read-btn"
          onClick={handleMarkAllRead}
          disabled={notificationStats.unread === 0}
        >
          <FaCheckDouble /> Mark All Read
        </button>
      </div>

      {/* Stats Cards */}
      <div className="notification-stats">
        <motion.div 
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <MdNotifications style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{notificationStats.total}</span>
            <span className="stat-label">Total</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <span className="unread-dot-large"></span>
          </div>
          <div className="stat-info">
            <span className="stat-value">{notificationStats.unread}</span>
            <span className="stat-label">Unread</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <FaClock style={{ color: '#10b981' }} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{notificationStats.today}</span>
            <span className="stat-label">Today</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
            <MdUpdate style={{ color: '#8b5cf6' }} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{notificationStats.thisWeek}</span>
            <span className="stat-label">This Week</span>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="notification-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'channels' && (
          <motion.div
            key="channels"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="channels-container"
          >
            {/* Push Notifications */}
            <div className="channel-section">
              <div className="channel-header">
                <div className="channel-icon">
                  <FaMobile />
                </div>
                <div className="channel-title">
                  <h3>Push Notifications</h3>
                  <p>Receive real-time alerts on your device</p>
                </div>
              </div>

              <div className="channel-options">
                {Object.entries(preferences.push).map(([key, value]) => (
                  <div key={key} className="option-row">
                    <span className="option-label">
                      {key.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => handleToggle('push', key)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Notifications */}
            <div className="channel-section">
              <div className="channel-header">
                <div className="channel-icon">
                  <FaEnvelope />
                </div>
                <div className="channel-title">
                  <h3>Email Notifications</h3>
                  <p>Get updates in your inbox</p>
                </div>
              </div>

              <div className="channel-options">
                {Object.entries(preferences.email).map(([key, value]) => (
                  <div key={key} className="option-row">
                    <span className="option-label">
                      {key.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => handleToggle('email', key)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* SMS & WhatsApp */}
            <div className="channel-section">
              <div className="channel-header">
                <div className="channel-icon">
                  <FaWhatsapp />
                </div>
                <div className="channel-title">
                  <h3>SMS & WhatsApp</h3>
                  <p>Important alerts via text</p>
                </div>
              </div>

              <div className="channel-options">
                {Object.entries(preferences.sms).map(([key, value]) => (
                  <div key={key} className="option-row">
                    <span className="option-label">
                      {key === 'otp' ? 'OTP Verification' : 
                       key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => handleToggle('sms', key)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'quiet' && (
          <motion.div
            key="quiet"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="quiet-hours-container"
          >
            <div className="quiet-hours-card">
              <div className="quiet-header">
                <div className="quiet-icon">
                  <FaMoon />
                </div>
                <div className="quiet-title">
                  <h3>Quiet Hours</h3>
                  <p>Mute non-critical notifications during specific hours</p>
                </div>
                <label className="toggle-switch large">
                  <input
                    type="checkbox"
                    checked={quietHours.enabled}
                    onChange={handleQuietHoursToggle}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {quietHours.enabled && (
                <motion.div 
                  className="quiet-inputs"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="time-input-group">
                    <div className="time-input">
                      <label>From</label>
                      <input
                        type="time"
                        value={quietHours.start}
                        onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                        className="time-field"
                      />
                    </div>
                    <div className="time-input">
                      <label>To</label>
                      <input
                        type="time"
                        value={quietHours.end}
                        onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                        className="time-field"
                      />
                    </div>
                  </div>

                  <button 
                    className="save-quiet-btn"
                    onClick={handleSaveQuietHours}
                  >
                    Save Quiet Hours
                  </button>
                </motion.div>
              )}

              <p className="quiet-note">
                <FaInfoCircle /> During quiet hours, only security alerts and OTPs will be sent
              </p>
            </div>

            <div className="quiet-preview">
              <h4>Preview</h4>
              <div className="preview-times">
                <div className="preview-item">
                  <span className="preview-label">Quiet Hours:</span>
                  <span className="preview-value">
                    {quietHours.enabled ? `${quietHours.start} - ${quietHours.end}` : 'Disabled'}
                  </span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Notifications during quiet hours:</span>
                  <span className="preview-value">Security alerts only</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="history-container"
          >
            <div className="history-header">
              <h3>Recent Notifications</h3>
              {notificationHistory.length > 0 && (
                <button 
                  className="clear-btn"
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              )}
            </div>

            {historyLoading ? (
              <div className="history-loading">
                <FaSpinner className="spinner" />
                <p>Loading notifications...</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notificationHistory.length > 0 ? (
                  notificationHistory.map((notif, index) => {
                    const IconComponent = notif.icon || getNotificationIcon(notif.type);
                    
                    return (
                      <motion.div
                        key={notif.id}
                        className={`notification-item ${!notif.read ? 'unread' : ''}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                      >
                        <div className="notif-icon" style={{ backgroundColor: `${notif.color}20` }}>
                          <IconComponent style={{ color: notif.color }} />
                        </div>
                        <div className="notif-content">
                          <div className="notif-header">
                            <h4>{notif.title}</h4>
                            {!notif.read && <span className="unread-badge"></span>}
                          </div>
                          <p className="notif-message">{notif.message}</p>
                          <div className="notif-meta">
                            <span className="notif-time">
                              <FaClock /> {notif.time}
                            </span>
                            <span className={`notif-type ${notif.type}`}>
                              {notif.type}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="no-notifications">
                    <FaBell className="no-notif-icon" />
                    <h4>No notifications yet</h4>
                    <p>We'll notify you when something important happens</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Notifications;