import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FaBell,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaChevronDown,
  FaWallet,
  FaCoins,
  FaRobot,
  FaHeadset,
  FaQuestionCircle,
  FaShieldAlt,
  FaUserCircle
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';
import './DashboardHeader.css';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Handle click outside to close dropdowns
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/notifications?limit=5`);
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/notifications?limit=1`);
      if (response.data.success) {
        setUnreadCount(response.data.data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/auth/notifications/${notificationId}/read`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/auth/notifications/read-all`);
      fetchNotifications();
      fetchUnreadCount();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      // Implement search API call here
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'transaction') {
      navigate(`/transactions/${notification.data?.transaction_id}`);
    } else if (notification.type === 'coin_expiry') {
      navigate('/coins');
    } else if (notification.type === 'limit_alert') {
      navigate('/reserve-pay');
    }
    
    setShowNotifications(false);
  };

  const profileMenuItems = [
    { icon: FaUserCircle, label: 'My Profile', path: '/settings?tab=profile' },
    { icon: FaWallet, label: 'Balance', path: '/dashboard' },
    { icon: FaCoins, label: 'My Coins', path: '/coins' },
    { icon: FaRobot, label: 'AI Assistant', path: '/agent' },
    { icon: FaShieldAlt, label: 'Security', path: '/settings?tab=security' },
    { icon: FaCog, label: 'Settings', path: '/settings' },
    { icon: FaHeadset, label: 'Support', path: '/help' },
  ];

  const formatTime = (dateString) => {
    const date = new Date(dateString);
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
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button
          className={`menu-toggle ${isSidebarOpen ? 'open' : ''}`}
          onClick={toggleSidebar}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="header-logo" onClick={() => navigate('/dashboard')}>
          <img src="/logo192.png" alt="SabAI Pay" />
          <span className="logo-text">SabAI Pay</span>
        </div>

        <div className="header-search" ref={searchRef}>
          <input
            type="text"
            placeholder="Search transactions, merchants..."
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
          />
          <button className="search-btn">
            🔍
          </button>

          <AnimatePresence>
            {showSearchResults && (
              <motion.div
                className="search-results"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="search-results-header">
                  <h4>Search Results</h4>
                  <button onClick={() => setShowSearchResults(false)}>✕</button>
                </div>
                <div className="search-results-list">
                  <div className="search-result-item">
                    <span className="result-icon">📦</span>
                    <div className="result-info">
                      <p className="result-title">Payment to Amazon</p>
                      <p className="result-subtitle">₹1,299 • 2 days ago</p>
                    </div>
                  </div>
                  <div className="search-result-item">
                    <span className="result-icon">🍕</span>
                    <div className="result-info">
                      <p className="result-title">Swiggy Order</p>
                      <p className="result-subtitle">₹349 • Yesterday</p>
                    </div>
                  </div>
                  <div className="search-result-item">
                    <span className="result-icon">⚡</span>
                    <div className="result-info">
                      <p className="result-title">Electricity Bill</p>
                      <p className="result-subtitle">₹850 • 3 days ago</p>
                    </div>
                  </div>
                </div>
                <div className="search-results-footer">
                  <button onClick={() => navigate(`/transactions?search=${searchQuery}`)}>
                    View all results
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="header-right">
        <button className="theme-toggle" onClick={toggleDarkMode}>
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        {/* Notifications */}
        <div className="notification-wrapper" ref={notificationRef}>
          <button
            className={`notification-icon ${showNotifications ? 'active' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                className="notifications-dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="notifications-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button className="mark-all-read" onClick={markAllAsRead}>
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="notifications-list">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                        whileHover={{ x: 4 }}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className={`notif-icon ${notif.type}`}>
                          {notif.type === 'transaction' && '💰'}
                          {notif.type === 'coin_expiry' && '🪙'}
                          {notif.type === 'limit_alert' && '⚠️'}
                          {notif.type === 'security' && '🔒'}
                          {notif.type === 'reminder' && '⏰'}
                        </div>
                        <div className="notif-content">
                          <h4>{notif.title}</h4>
                          <p>{notif.message}</p>
                          <span className="notif-time">
                            {formatTime(notif.created_at)}
                          </span>
                        </div>
                        {!notif.is_read && <span className="unread-dot"></span>}
                      </motion.div>
                    ))
                  ) : (
                    <div className="no-notifications">
                      <FaBell className="no-notif-icon" />
                      <p>No notifications</p>
                    </div>
                  )}
                </div>

                <div className="notifications-footer">
                  <button onClick={() => navigate('/settings?tab=notifications')}>
                    View All Notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Menu */}
        <div className="profile-wrapper" ref={profileRef}>
          <button
            className={`profile-btn ${showProfileMenu ? 'active' : ''}`}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar">
              {user?.profile_pic ? (
                <img src={user.profile_pic} alt={user.name} />
              ) : (
                <FaUserCircle />
              )}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.name?.split(' ')[0]}</span>
              <span className="profile-role">
                <FaCoins className="coin-icon" />
                {user?.total_coins || 0} coins
              </span>
            </div>
            <FaChevronDown className={`dropdown-arrow ${showProfileMenu ? 'open' : ''}`} />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                className="profile-dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="dropdown-header">
                  <div className="dropdown-user">
                    <div className="user-avatar">
                      {user?.profile_pic ? (
                        <img src={user.profile_pic} alt={user.name} />
                      ) : (
                        <FaUserCircle />
                      )}
                    </div>
                    <div className="user-details">
                      <h4>{user?.name}</h4>
                      <p>{user?.phone_number}</p>
                    </div>
                  </div>
                </div>

                <div className="dropdown-menu">
                  {profileMenuItems.map((item, index) => (
                    <motion.button
                      key={index}
                      className="menu-item"
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        navigate(item.path);
                        setShowProfileMenu(false);
                      }}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </motion.button>
                  ))}

                  <div className="dropdown-divider"></div>

                  <motion.button
                    className="menu-item logout"
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;