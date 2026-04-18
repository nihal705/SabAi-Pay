import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FaCoins,
  FaGift,
  FaHistory,
  FaArrowRight,
  FaArrowDown,
  FaArrowUp,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaPercent,
  FaStar,
  FaTrophy,
  FaMedal,
  FaFire,
  FaGem,
  FaWallet,
  FaShoppingBag,
  FaUtensils,
  FaBolt,
  FaMobile,
  FaHourglassHalf
} from 'react-icons/fa';
import { MdReceipt } from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';
import './CoinStyles.css';

const CoinWallet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [coinData, setCoinData] = useState({
    balance: 0,
    lifetime: 0,
    expiringSoon: [],
    history: [],
    stats: {
      totalEarned: 0,
      totalUsed: 0,
      totalExpired: 0
    }
  });

  useEffect(() => {
    fetchCoinData();
  }, []);

  const fetchCoinData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setCoinData({
        balance: 1250,
        lifetime: 2500,
        expiringSoon: [
          { id: 1, amount: 150, expiry_date: '2024-04-15' },
          { id: 2, amount: 75, expiry_date: '2024-04-10' }
        ],
        history: [
          { id: 1, type: 'earned', amount: 50, description: 'Cashback on Swiggy order', created_at: '2024-03-15T10:30:00' },
          { id: 2, type: 'earned', amount: 100, description: 'Referral bonus', created_at: '2024-03-14T15:45:00' },
          { id: 3, type: 'used', amount: 200, description: 'Redeemed for bill payment', created_at: '2024-03-13T09:20:00' },
          { id: 4, type: 'earned', amount: 25, description: 'Daily login bonus', created_at: '2024-03-12T08:00:00' },
          { id: 5, type: 'earned', amount: 300, description: 'Transaction cashback', created_at: '2024-03-11T14:15:00' }
        ],
        stats: {
          totalEarned: 2500,
          totalUsed: 1250,
          totalExpired: 0
        }
      });
    } catch (error) {
      console.error('Error fetching coin data:', error);
      toast.error('Failed to load coin data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaCoins },
    { id: 'history', label: 'History', icon: FaHistory },
    { id: 'earn', label: 'Earn Coins', icon: FaGift },
    { id: 'redeem', label: 'Redeem', icon: FaArrowDown }
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days left`;
    return date.toLocaleDateString();
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earned':
        return <FaArrowDown className="history-icon earned" />;
      case 'used':
        return <FaArrowUp className="history-icon used" />;
      default:
        return <FaCoins className="history-icon" />;
    }
  };

  // Overview Tab Component
  const OverviewTab = () => (
    <div className="overview-tab">
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon earned">
            <FaGem />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Earned</span>
            <span className="stat-number">{coinData.stats.totalEarned}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon used">
            <FaCheckCircle />
          </div>
          <div className="stat-details">
            <span className="stat-label">Used</span>
            <span className="stat-number">{coinData.stats.totalUsed}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon expiring">
            <FaClock />
          </div>
          <div className="stat-details">
            <span className="stat-label">Expiring Soon</span>
            <span className="stat-number">
              {coinData.expiringSoon.reduce((sum, item) => sum + item.amount, 0)}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rate">
            <FaPercent />
          </div>
          <div className="stat-details">
            <span className="stat-label">Cashback Rate</span>
            <span className="stat-number">1%</span>
          </div>
        </div>
      </div>

      {/* Expiring Coins */}
      {coinData.expiringSoon.length > 0 && (
        <div className="expiring-section">
          <h3>Expiring Soon</h3>
          <div className="expiring-list">
            {coinData.expiringSoon.map((item) => (
              <div key={item.id} className="expiring-item">
                <div className="expiring-info">
                  <span className="expiring-amount">{item.amount} coins</span>
                  <span className="expiring-date">
                    <FaCalendarAlt /> Expires {formatDate(item.expiry_date)}
                  </span>
                </div>
                <button className="use-now-btn" onClick={() => setActiveTab('redeem')}>
                  Use Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {coinData.history.slice(0, 5).map((item) => (
            <div key={item.id} className="activity-item">
              <div className="activity-icon">
                {getTransactionIcon(item.type)}
              </div>
              <div className="activity-details">
                <span className="activity-title">{item.description}</span>
                <span className="activity-time">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              <span className={`activity-amount ${item.type}`}>
                {item.type === 'earned' ? '+' : '-'}{item.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // History Tab Component
  const HistoryTab = () => (
    <div className="history-tab">
      <div className="history-filters">
        <select className="filter-select">
          <option value="all">All Transactions</option>
          <option value="earned">Earned</option>
          <option value="used">Used</option>
        </select>
        <select className="filter-select">
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">This year</option>
        </select>
      </div>

      <div className="history-list">
        {coinData.history.map((item) => (
          <div key={item.id} className="history-item">
            <div className={`history-icon ${item.type}`}>
              {item.type === 'earned' ? <FaArrowDown /> : <FaArrowUp />}
            </div>
            <div className="history-details">
              <div className="history-header">
                <span className="history-title">{item.description}</span>
                <span className={`history-amount ${item.type}`}>
                  {item.type === 'earned' ? '+' : '-'}{item.amount}
                </span>
              </div>
              <div className="history-meta">
                <span className="history-date">
                  <FaCalendarAlt /> {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Earn Tab Component
  const EarnTab = () => {
    const earnOptions = [
      {
        id: 'transaction',
        title: 'Transaction Cashback',
        description: 'Earn 1 coin per ₹100 spent',
        reward: '1% cashback',
        icon: FaShoppingBag,
        color: '#10b981'
      },
      {
        id: 'referral',
        title: 'Refer a Friend',
        description: 'Get 100 coins for each referral',
        reward: '100 coins',
        icon: FaStar,
        color: '#fbbf24'
      },
      {
        id: 'daily',
        title: 'Daily Login',
        description: 'Earn 5 coins daily',
        reward: '5 coins/day',
        icon: FaCalendarAlt,
        color: '#6366f1'
      },
      {
        id: 'bill',
        title: 'Bill Payments',
        description: 'Double coins on bill payments',
        reward: '2% cashback',
        icon: FaBolt,
        color: '#ef4444'
      }
    ];

    return (
      <div className="earn-tab">
        <div className="earn-grid">
          {earnOptions.map((option) => (
            <div key={option.id} className="earn-card" style={{ borderColor: option.color }}>
              <div className="earn-card-header">
                <div className="earn-icon" style={{ backgroundColor: option.color }}>
                  <option.icon />
                </div>
                <span className="reward-badge">{option.reward}</span>
              </div>
              <h4>{option.title}</h4>
              <p>{option.description}</p>
              <button className="earn-action-btn" style={{ color: option.color }}>
                Earn Now <FaArrowRight />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Redeem Tab Component
  const RedeemTab = () => {
    const redeemOptions = [
      {
        id: 'bill',
        title: 'Pay Bills',
        description: 'Use coins to pay electricity, water bills',
        minCoins: 100,
        icon: FaBolt,
        color: '#ef4444'
      },
      {
        id: 'recharge',
        title: 'Mobile Recharge',
        description: 'Recharge any mobile number',
        minCoins: 100,
        icon: FaMobile,
        color: '#8b5cf6'
      },
      {
        id: 'shopping',
        title: 'Shopping Discount',
        description: 'Get discount on shopping',
        minCoins: 200,
        icon: FaShoppingBag,
        color: '#10b981'
      },
      {
        id: 'food',
        title: 'Food Order',
        description: 'Use coins for food delivery',
        minCoins: 150,
        icon: FaUtensils,
        color: '#fbbf24'
      }
    ];

    return (
      <div className="redeem-tab">
        <div className="redeem-grid">
          {redeemOptions.map((option) => (
            <div key={option.id} className="redeem-card">
              <div className="redeem-icon" style={{ backgroundColor: option.color }}>
                <option.icon />
              </div>
              <div className="redeem-details">
                <h4>{option.title}</h4>
                <p>{option.description}</p>
                <span className="min-coins">Min. {option.minCoins} coins</span>
              </div>
              <FaArrowRight className="redeem-arrow" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your coins...</p>
      </div>
    );
  }

  return (
    <div className="coin-wallet-container">
      {/* Header */}
      <div className="coin-wallet-header">
        <h1>SabAI Coins 🪙</h1>
        <p className="subtitle">Earn, save, and redeem reward points</p>
      </div>

      {/* Balance Card */}
      <div className="coin-balance-card">
        <div className="coin-balance-header">
          <div className="coin-icon-wrapper">
            <FaCoins />
          </div>
          <div className="coin-stats">
            <div className="stat-item">
              <span className="stat-label">Available Balance</span>
              <span className="stat-value balance">{coinData.balance}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Lifetime Earned</span>
              <span className="stat-value lifetime">{coinData.lifetime}</span>
            </div>
          </div>
        </div>

        <div className="coin-conversion">
          <span>100 coins = ₹1</span>
          <span>Your coins value: ₹{(coinData.balance / 100).toFixed(2)}</span>
        </div>

        <div className="coin-actions">
          <button className="coin-action-btn primary" onClick={() => setActiveTab('redeem')}>
            <FaArrowDown /> Redeem Coins
          </button>
          <button className="coin-action-btn secondary" onClick={() => setActiveTab('earn')}>
            <FaArrowUp /> Earn More
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="coin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'earn' && <EarnTab />}
        {activeTab === 'redeem' && <RedeemTab />}
      </div>
    </div>
  );
};

export default CoinWallet;