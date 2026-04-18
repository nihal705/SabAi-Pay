import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaArrowUp,
  FaArrowDown,
  FaQrcode,
  FaHistory,
  FaRobot,
  FaCoins,
  FaCreditCard,
  FaCog,
  FaQuestionCircle,
  FaReceipt,
  FaChartLine,
  FaUsers,
  FaGift,
  FaShieldAlt,
  FaWallet,
  FaChevronRight,
  FaChevronDown
} from 'react-icons/fa';
import { MdDashboard, MdPayment } from 'react-icons/md';
import './DashboardSidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [userStats, setUserStats] = useState({
    totalCoins: 0,
    monthlySpent: 0,
    monthlyLimit: 5000
  });

  useEffect(() => {
    // Load user stats
    const loadStats = async () => {
      try {
        // Fetch from API
        setUserStats({
          totalCoins: 250,
          monthlySpent: 3250,
          monthlyLimit: 5000
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    
    loadStats();
  }, []);

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: MdDashboard,
      path: '/dashboard',
      exact: true
    },
    {
      id: 'payments',
      title: 'Payments',
      icon: MdPayment,
      children: [
        { title: 'Send Money', icon: FaArrowUp, path: '/send-money' },
        { title: 'Request Money', icon: FaArrowDown, path: '/request-money' },
        { title: 'Scan & Pay', icon: FaQrcode, path: '/send-money?qr=true' },
        { title: 'Bills & Recharge', icon: FaReceipt, path: '/bills' }
      ]
    },
    {
      id: 'agent',
      title: 'AI Agent',
      icon: FaRobot,
      path: '/agent',
      badge: 'NEW',
      badgeColor: '#10b981'
    },
    {
      id: 'reserve',
      title: 'Reserve Pay',
      icon: FaCreditCard,
      path: '/reserve-pay'
    },
    {
      id: 'coins',
      title: 'SabAI Coins',
      icon: FaCoins,
      path: '/coins',
      badge: userStats.totalCoins,
      badgeColor: '#fbbf24'
    },
    {
      id: 'transactions',
      title: 'Transactions',
      icon: FaHistory,
      path: '/transactions'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: FaChartLine,
      children: [
        { title: 'Spending Analysis', path: '/analytics/spending' },
        { title: 'Category Breakdown', path: '/analytics/categories' },
        { title: 'Monthly Report', path: '/analytics/monthly' }
      ]
    },
    {
      id: 'referrals',
      title: 'Refer & Earn',
      icon: FaUsers,
      path: '/referrals',
      badge: 'EARN',
      badgeColor: '#8b5cf6'
    },
    {
      id: 'offers',
      title: 'Offers',
      icon: FaGift,
      path: '/offers'
    },
    {
      id: 'security',
      title: 'Security',
      icon: FaShieldAlt,
      path: '/settings?tab=security'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: FaCog,
      path: '/settings'
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: FaQuestionCircle,
      path: '/help'
    }
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const overlayVariants = {
    open: { opacity: 1, pointerEvents: 'auto' },
    closed: { opacity: 0, pointerEvents: 'none' }
  };

  const calculateProgress = () => {
    return Math.min((userStats.monthlySpent / userStats.monthlyLimit) * 100, 100);
  };

  const progressColor = calculateProgress() > 80 ? '#ef4444' : '#667eea';

  return (
    <>
      {/* Mobile Overlay */}
      <motion.div
        className="sidebar-overlay"
        variants={overlayVariants}
        animate={isOpen ? 'open' : 'closed'}
        onClick={onClose}
      />

      {/* Sidebar */}
      <motion.aside
        className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}
        variants={sidebarVariants}
        animate={isOpen ? 'open' : 'closed'}
        initial="closed"
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/logo192.png" alt="SabAI Pay" />
            <span>SabAI Pay</span>
          </div>
          <button className="close-sidebar" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Quick Stats */}
        <div className="sidebar-stats">
          <div className="stat-item">
            <FaCoins className="stat-icon coins" />
            <div className="stat-info">
              <span className="stat-label">Coins</span>
              <span className="stat-value">{userStats.totalCoins}</span>
            </div>
          </div>
          <div className="stat-item">
            <FaWallet className="stat-icon wallet" />
            <div className="stat-info">
              <span className="stat-label">Spent</span>
              <span className="stat-value">₹{userStats.monthlySpent}</span>
            </div>
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="monthly-progress">
          <div className="progress-header">
            <span>Monthly Limit</span>
            <span>₹{userStats.monthlySpent} / ₹{userStats.monthlyLimit}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${calculateProgress()}%`,
                backgroundColor: progressColor
              }}
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.id} className="nav-item-wrapper">
              {item.children ? (
                // Menu with children
                <div className="nav-group">
                  <button
                    className={`nav-group-btn ${expandedMenus[item.id] ? 'expanded' : ''}`}
                    onClick={() => toggleMenu(item.id)}
                  >
                    <div className="nav-group-left">
                      <item.icon className="nav-icon" />
                      <span>{item.title}</span>
                    </div>
                    {expandedMenus[item.id] ? (
                      <FaChevronDown className="arrow-icon" />
                    ) : (
                      <FaChevronRight className="arrow-icon" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedMenus[item.id] && (
                      <motion.div
                        className="nav-children"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              `nav-child-link ${isActive ? 'active' : ''}`
                            }
                            onClick={onClose}
                          >
                            <child.icon className="child-icon" />
                            <span>{child.title}</span>
                          </NavLink>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                // Single menu item
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''} ${item.exact ? 'exact' : ''}`
                  }
                  onClick={onClose}
                >
                  <item.icon className="nav-icon" />
                  <span>{item.title}</span>
                  {item.badge && (
                    <span
                      className="nav-badge"
                      style={{ backgroundColor: item.badgeColor }}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        {/* Upgrade Banner */}
        <div className="upgrade-banner">
          <div className="banner-content">
            <h4>Upgrade to Premium</h4>
            <p>Get 2x coins and exclusive offers</p>
            <button className="upgrade-btn">View Plans →</button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;