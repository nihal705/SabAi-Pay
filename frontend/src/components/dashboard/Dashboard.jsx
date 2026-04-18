import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';  // Fixed: removed extra 'i'
import { usePayment } from '../../context/PaymentContext';
import { useNavigate } from 'react-router-dom';
import {
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaQrcode,
  FaHistory,
  FaRobot,
  FaCoins,
  FaCreditCard,
  FaBell,
  FaGift,
  FaPercent
} from 'react-icons/fa';
import { MdDashboard, MdPayment, MdReceipt } from 'react-icons/md';
import Header from './Header';
import Sidebar from './Sidebar';
import BalanceCard from './BalanceCard';
import QuickActions from './QuickActions';
import RecentTransactions from './RecentTransactions';
import AgentSuggestions from './AgentSuggestions';
import Loader from '../common/Loader';
import Button from '../common/Button';
import axios from 'axios';
import toast from 'react-hot-toast';
import './DashboardStyles.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { balance, fetchBalance } = usePayment();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBalance(),
        fetchStats(),
        fetchRecentTransactions(),
        fetchSuggestions(),
        fetchNotifications()
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/transactions?limit=5`);
      if (response.data.success) {
        setRecentTxns(response.data.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/agent/suggestions`);
      if (response.data.success) {
        setSuggestions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/notifications?limit=3`);
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const quickActions = [
    {
      id: 'send',
      name: 'Send Money',
      icon: FaArrowUp,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      path: '/send-money'
    },
    {
      id: 'request',
      name: 'Request',
      icon: FaArrowDown,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      path: '/request-money'
    },
    {
      id: 'qr',
      name: 'Scan & Pay',
      icon: FaQrcode,
      color: '#667eea',
      bgColor: 'rgba(102, 126, 234, 0.1)',
      path: '/send-money?qr=true'
    },
    {
      id: 'bills',
      name: 'Pay Bills',
      icon: MdReceipt,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      path: '/bills'
    },
    {
      id: 'agent',
      name: 'AI Agent',
      icon: FaRobot,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      path: '/agent'
    },
    {
      id: 'reserve',
      name: 'Reserve Pay',
      icon: FaCreditCard,
      color: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.1)',
      path: '/reserve-pay'
    }
  ];

  const statCards = [
    {
      title: 'Total Spent',
      value: `₹${stats?.transactions?.total_spent?.toLocaleString() || '0'}`,
      icon: MdPayment,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)'
    },
    {
      title: 'Active Coins',
      value: stats?.coins?.active_coins || '0',
      icon: FaCoins,
      color: '#fbbf24',
      bgColor: 'rgba(251, 191, 36, 0.1)'
    },
    {
      title: 'Transactions',
      value: stats?.transactions?.total_count || '0',
      icon: FaHistory,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    {
      title: 'Merchant Limits',
      value: stats?.limits?.total_limits || '0',
      icon: FaCreditCard,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)'
    }
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="dashboard-container"
        >
          {/* Welcome Header */}
          <div className="dashboard-header">
            <div className="welcome-section">
              <h1 className="welcome-title">
                Welcome back, <span className="user-name">{user?.name}</span>! 👋
              </h1>
              <p className="welcome-subtitle">
                Here's what's happening with your money today.
              </p>
            </div>

            <div className="header-actions">
              <Button
                variant="primary"
                size="small"
                onClick={() => navigate('/coins')}
                icon={FaGift}
              >
                Earn Coins
              </Button>
            </div>
          </div>

          {/* Balance Card */}
          <BalanceCard balance={balance} />

          {/* Quick Actions */}
          <QuickActions actions={quickActions} />

          {/* Stats Grid */}
          <div className="stats-grid">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                className="stat-card"
                style={{ backgroundColor: stat.bgColor }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="stat-icon" style={{ color: stat.color }}>
                  <stat.icon />
                </div>
                <div className="stat-content">
                  <h3 className="stat-title">{stat.title}</h3>
                  <p className="stat-value">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="dashboard-grid">
            {/* Recent Transactions */}
            <div className="grid-item transactions-section">
              <div className="section-header">
                <h2>Recent Transactions</h2>
                <button
                  className="view-all-btn"
                  onClick={() => navigate('/transactions')}
                >
                  View All
                </button>
              </div>
              <RecentTransactions transactions={recentTxns} />
            </div>

            {/* AI Suggestions */}
            <div className="grid-item suggestions-section">
              <div className="section-header">
                <h2>
                  <FaRobot className="section-icon" />
                  SabAI Suggestions
                </h2>
              </div>
              <AgentSuggestions suggestions={suggestions} />
            </div>
          </div>

          {/* Offers Banner */}
          <motion.div
            className="offers-banner"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="offers-content">
              <div className="offers-icon">
                <FaPercent />
              </div>
              <div className="offers-text">
                <h3>Special Offer!</h3>
                <p>Get 5% cashback on your first AI Agent order</p>
              </div>
              <Button
                variant="outline"
                size="small"
                onClick={() => navigate('/agent')}
              >
                Try Now
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;