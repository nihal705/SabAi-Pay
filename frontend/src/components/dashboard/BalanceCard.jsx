import React from 'react';
import { motion } from 'framer-motion';
import { FaWallet, FaArrowUp, FaArrowDown, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useState } from 'react';
import './DashboardStyles.css';

const BalanceCard = ({ balance }) => {
  const [showBalance, setShowBalance] = useState(true);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculatePercentage = (spent, limit) => {
    return Math.min(Math.round((spent / limit) * 100), 100);
  };

  const spentPercentage = calculatePercentage(
    balance.current_spent,
    balance.monthly_limit
  );

  const getProgressColor = (percentage) => {
    if (percentage < 50) return '#10b981';
    if (percentage < 80) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <motion.div
      className="balance-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div className="balance-header">
        <div className="balance-title">
          <FaWallet className="wallet-icon" />
          <span>Total Balance</span>
        </div>
        <button
          className="visibility-toggle"
          onClick={() => setShowBalance(!showBalance)}
        >
          {showBalance ? <FaEye /> : <FaEyeSlash />}
        </button>
      </div>

      <div className="balance-amount">
        <span className="currency-symbol">₹</span>
        <span className="amount">
          {showBalance
            ? (balance.monthly_limit - balance.current_spent).toLocaleString()
            : '•••••'}
        </span>
      </div>

      <div className="limit-info">
        <span>Monthly Limit: ₹{balance.monthly_limit.toLocaleString()}</span>
        <span>Spent: ₹{balance.current_spent.toLocaleString()}</span>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{
            width: `${spentPercentage}%`,
            backgroundColor: getProgressColor(spentPercentage)
          }}
        />
      </div>

      <div className="balance-footer">
        <div className="usage-stats">
          <span className="usage-percentage">{spentPercentage}% Used</span>
          <span className="remaining">
            ₹{(balance.monthly_limit - balance.current_spent).toLocaleString()} left
          </span>
        </div>

        <div className="action-buttons">
          <motion.button
            className="action-btn add-money"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowUp />
            <span>Add Money</span>
          </motion.button>
          <motion.button
            className="action-btn withdraw"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowDown />
            <span>Withdraw</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default BalanceCard;