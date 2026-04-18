import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaClock,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaCoins,
  FaGem,
  FaFire,
  FaHourglassHalf,
  FaCheckCircle,
  FaArrowRight,
  FaBell,
  FaTimes,
  FaInfoCircle,
  FaRocket
} from 'react-icons/fa';
import Button from '../common/Button';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaBolt, FaMobile, FaShoppingBag, FaWallet } from 'react-icons/fa';
import './CoinStyles.css';

const CoinExpiry = ({ onRedeem }) => {
  const [loading, setLoading] = useState(false);
  const [expiringCoins, setExpiringCoins] = useState([]);
  const [expiredCoins, setExpiredCoins] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    fetchExpiringCoins();
    fetchExpiredCoins();
    fetchReminders();
  }, []);

  const fetchExpiringCoins = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/coins/expiring?days=30`);
      if (response.data.success) {
        // Group by expiry date
        const grouped = response.data.data.reduce((acc, coin) => {
          const date = new Date(coin.expiry_date).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = {
              date: coin.expiry_date,
              coins: [],
              total: 0
            };
          }
          acc[date].coins.push(coin);
          acc[date].total += coin.amount;
          return acc;
        }, {});

        setExpiringCoins(Object.values(grouped));
      }
    } catch (error) {
      console.error('Error fetching expiring coins:', error);
    }
  };

  const fetchExpiredCoins = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/coins/expired`);
      if (response.data.success) {
        setExpiredCoins(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching expired coins:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/notifications?type=coin_expiry`);
      if (response.data.success) {
        setReminders(response.data.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyLevel = (days) => {
    if (days <= 3) return 'critical';
    if (days <= 7) return 'warning';
    if (days <= 15) return 'notice';
    return 'safe';
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'notice': return '#fbbf24';
      case 'safe': return '#10b981';
      default: return '#667eea';
    }
  };

  const getUrgencyIcon = (level) => {
    switch (level) {
      case 'critical': return <FaFire />;
      case 'warning': return <FaExclamationTriangle />;
      case 'notice': return <FaClock />;
      case 'safe': return <FaCheckCircle />;
      default: return <FaGem />;
    }
  };

  const handleRedeemGroup = (group) => {
    setSelectedGroup(group);
    setShowDetails(true);
  };

  const handleRedeemAll = async () => {
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/coins/redeem-expiring`);
      toast.success('All expiring coins redeemed!');
      fetchExpiringCoins();
      onRedeem?.();
    } catch (error) {
      toast.error('Failed to redeem coins');
    } finally {
      setLoading(false);
    }
  };

  const handleSnoozeReminder = async (reminderId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/notifications/${reminderId}/snooze`, {
        days: 1
      });
      toast.success('Reminder snoozed for 1 day');
      fetchReminders();
    } catch (error) {
      toast.error('Failed to snooze reminder');
    }
  };

  const totalExpiring = expiringCoins.reduce((sum, group) => sum + group.total, 0);
  const totalExpired = expiredCoins.reduce((sum, coin) => sum + coin.amount, 0);

  return (
    <div className="coin-expiry-container">
      {/* Header */}
      <div className="expiry-header">
        <div className="header-title">
          <FaHourglassHalf className="header-icon" />
          <h2>Gem Expiry Tracker</h2>
        </div>

        {totalExpiring > 0 && (
          <Button
            variant="primary"
            size="small"
            onClick={handleRedeemAll}
            loading={loading}
            icon={FaRocket}
          >
            Redeem All Expiring
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="expiry-stats">
        <div className="stat-card expiring">
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-info">
            <span className="stat-label">Expiring Soon</span>
            <span className="stat-value">{totalExpiring}</span>
            <span className="stat-sub">Gems at risk</span>
          </div>
        </div>

        <div className="stat-card expired">
          <div className="stat-icon">
            <FaTimes />
          </div>
          <div className="stat-info">
            <span className="stat-label">Expired</span>
            <span className="stat-value">{totalExpired}</span>
            <span className="stat-sub">Gems lost</span>
          </div>
        </div>

        <div className="stat-card reminders">
          <div className="stat-icon">
            <FaBell />
          </div>
          <div className="stat-info">
            <span className="stat-label">Reminders</span>
            <span className="stat-value">{reminders.length}</span>
            <span className="stat-sub">Active alerts</span>
          </div>
        </div>
      </div>

      {/* Active Reminders */}
      {reminders.length > 0 && (
        <div className="reminders-section">
          <h3>Active Reminders</h3>
          <div className="reminders-list">
            {reminders.map((reminder) => (
              <motion.div
                key={reminder.id}
                className="reminder-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <FaBell className="reminder-icon" />
                <div className="reminder-content">
                  <p>{reminder.message}</p>
                  <span className="reminder-time">
                    {new Date(reminder.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  className="snooze-btn"
                  onClick={() => handleSnoozeReminder(reminder.id)}
                >
                  Snooze
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring Coins Groups */}
      <div className="expiry-groups">
        <h3>Expiring Gems</h3>
        
        {expiringCoins.length > 0 ? (
          <div className="groups-list">
            {expiringCoins.map((group, index) => {
              const daysLeft = getDaysUntilExpiry(group.date);
              const urgency = getUrgencyLevel(daysLeft);
              const color = getUrgencyColor(urgency);

              return (
                <motion.div
                  key={index}
                  className="expiry-group-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{ borderColor: color }}
                >
                  <div className="group-header">
                    <div className="group-icon" style={{ color }}>
                      {getUrgencyIcon(urgency)}
                    </div>
                    <div className="group-info">
                      <span className="group-date">
                        <FaCalendarAlt /> Expires: {new Date(group.date).toLocaleDateString()}
                      </span>
                      <span className="group-days" style={{ color }}>
                        {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                      </span>
                    </div>
                  </div>

                  <div className="group-content">
                    <div className="group-coins">
                      <FaGem />
                      <span className="group-amount">{group.total} Gems</span>
                    </div>

                    <div className="group-preview">
                      {group.coins.slice(0, 3).map((coin, i) => (
                        <div key={i} className="coin-preview">
                          {coin.amount} Gems
                        </div>
                      ))}
                      {group.coins.length > 3 && (
                        <span className="more-badge">+{group.coins.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  <div className="group-footer">
                    <div className="urgency-badge" style={{ backgroundColor: `${color}20`, color }}>
                      {urgency === 'critical' && '⚠️ Critical'}
                      {urgency === 'warning' && '⚠️ Warning'}
                      {urgency === 'notice' && '📢 Notice'}
                      {urgency === 'safe' && '✅ Safe'}
                    </div>
                    
                    <button
                      className="redeem-group-btn"
                      style={{ color }}
                      onClick={() => handleRedeemGroup(group)}
                    >
                      Redeem Group <FaArrowRight />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="no-expiring">
            <FaCheckCircle className="no-icon" />
            <h4>No Expiring Gems</h4>
            <p>All your gems are safe!</p>
          </div>
        )}
      </div>

      {/* Expired Coins */}
      {expiredCoins.length > 0 && (
        <div className="expired-section">
          <h3>Recently Expired</h3>
          <div className="expired-list">
            {expiredCoins.slice(0, 5).map((coin, index) => (
              <div key={index} className="expired-item">
                <FaTimes className="expired-icon" />
                <div className="expired-details">
                  <span className="expired-amount">{coin.amount} Gems</span>
                  <span className="expired-date">
                    Expired on {new Date(coin.expiry_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group Details Modal */}
      <AnimatePresence>
        {showDetails && selectedGroup && (
          <motion.div
            className="group-details-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              className="group-details-modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Expiring Gems Details</h3>
                <button className="close-btn" onClick={() => setShowDetails(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="modal-content">
                <div className="expiry-summary">
                  <div className="summary-item">
                    <span>Expiry Date</span>
                    <strong>{new Date(selectedGroup.date).toLocaleDateString()}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Total Gems</span>
                    <strong className="highlight">{selectedGroup.total}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Days Left</span>
                    <strong className={getUrgencyLevel(getDaysUntilExpiry(selectedGroup.date))}>
                      {getDaysUntilExpiry(selectedGroup.date)} days
                    </strong>
                  </div>
                </div>

                <div className="coins-list">
                  <h4>Individual Gems</h4>
                  {selectedGroup.coins.map((coin, index) => (
                    <div key={index} className="coin-detail-item">
                      <div className="coin-source">
                        <FaGem />
                        <span>{coin.source_description || 'Earned'}</span>
                      </div>
                      <span className="coin-amount">{coin.amount} Gems</span>
                    </div>
                  ))}
                </div>

                <div className="redemption-options">
                  <h4>Quick Redeem Options</h4>
                  <div className="option-buttons">
                    <button className="option-btn bill">
                      <FaBolt /> Pay Bill
                    </button>
                    <button className="option-btn recharge">
                      <FaMobile /> Recharge
                    </button>
                    <button className="option-btn shopping">
                      <FaShoppingBag /> Shop
                    </button>
                    <button className="option-btn transfer">
                      <FaWallet /> Transfer
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowDetails(false);
                    onRedeem?.(selectedGroup.total);
                  }}
                >
                  Redeem All {selectedGroup.total} Gems
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoinExpiry;