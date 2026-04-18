import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowUp,
  FaArrowDown,
  FaShoppingBag,
  FaUtensils,
  FaFilm,
  FaBolt,
  FaQuestionCircle
} from 'react-icons/fa';
import './DashboardStyles.css';

const RecentTransactions = ({ transactions }) => {
  const navigate = useNavigate();

  const getTransactionIcon = (type, category) => {
    if (type === 'send') return <FaArrowUp className="txn-icon send" />;
    if (type === 'receive') return <FaArrowDown className="txn-icon receive" />;
    
    switch (category) {
      case 'food':
        return <FaUtensils className="txn-icon food" />;
      case 'shopping':
        return <FaShoppingBag className="txn-icon shopping" />;
      case 'entertainment':
        return <FaFilm className="txn-icon entertainment" />;
      case 'bills':
        return <FaBolt className="txn-icon bills" />;
      default:
        return <FaQuestionCircle className="txn-icon default" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatAmount = (amount, type) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);

    return type === 'send' ? `-${formatted}` : formatted;
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="no-transactions">
        <div className="no-txn-icon">📭</div>
        <p>No transactions yet</p>
        <button
          className="start-txn-btn"
          onClick={() => navigate('/send-money')}
        >
          Send Money
        </button>
      </div>
    );
  }

  return (
    <div className="recent-transactions">
      {transactions.map((txn, index) => (
        <motion.div
          key={txn.id}
          className="transaction-item"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ x: 4 }}
          onClick={() => navigate(`/transactions/${txn.transaction_id}`)}
        >
          <div className="txn-left">
            <div className="txn-icon-wrapper">
              {getTransactionIcon(txn.type, txn.category)}
            </div>
            <div className="txn-details">
              <h4 className="txn-title">
                {txn.merchant || txn.receiver_name || 'Transfer'}
              </h4>
              <p className="txn-description">
                {txn.description || txn.type === 'send' ? 'Sent to' : 'Received from'}{' '}
                {txn.receiver_vpa || txn.sender_vpa}
              </p>
              <span className="txn-time">{formatDate(txn.created_at)}</span>
            </div>
          </div>
          <div className="txn-right">
            <span className={`txn-amount ${txn.type}`}>
              {formatAmount(txn.amount, txn.type)}
            </span>
            <span className={`txn-status ${txn.status}`}>
              {txn.status}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default RecentTransactions;