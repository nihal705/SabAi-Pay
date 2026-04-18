import React from 'react';
import { motion } from 'framer-motion';
import {
  FaShoppingBag,
  FaUtensils,
  FaFilm,
  FaGasPump,
  FaPlane,
  FaMedkit,
  FaGraduationCap,
  FaPaw,
  FaGift,
  FaCoffee,
  FaTrash,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaBell,
  FaExclamationTriangle,
  FaRupeeSign,
  FaCalendarAlt,
  FaChartLine
} from 'react-icons/fa';
import { MdLocalGroceryStore, MdFastfood } from 'react-icons/md';
import './ReserveStyles.css';

const LimitCard = ({
  limit,
  onEdit,
  onDelete,
  onToggle,
  compact = false
}) => {
  const getCategoryIcon = (category) => {
    const icons = {
      food: FaUtensils,
      shopping: FaShoppingBag,
      groceries: MdLocalGroceryStore,
      entertainment: FaFilm,
      travel: FaPlane,
      fuel: FaGasPump,
      healthcare: FaMedkit,
      education: FaGraduationCap,
      pets: FaPaw,
      gifts: FaGift,
      coffee: FaCoffee,
      others: FaShoppingBag
    };
    return icons[category] || FaShoppingBag;
  };

  const getCategoryColor = (category) => {
    const colors = {
      food: '#f59e0b',
      shopping: '#8b5cf6',
      groceries: '#10b981',
      entertainment: '#ec4899',
      travel: '#3b82f6',
      fuel: '#ef4444',
      healthcare: '#14b8a6',
      education: '#f97316',
      pets: '#a855f7',
      gifts: '#d946ef',
      coffee: '#b45309',
      others: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  const CategoryIcon = getCategoryIcon(limit.merchant_category);
  const categoryColor = getCategoryColor(limit.merchant_category);
  const spentPercentage = Math.min((limit.current_spent / limit.monthly_limit) * 100, 100);
  const remaining = limit.monthly_limit - limit.current_spent;

  const getStatusColor = () => {
    if (spentPercentage >= 90) return '#ef4444';
    if (spentPercentage >= 75) return '#f59e0b';
    if (spentPercentage >= 50) return '#fbbf24';
    return '#10b981';
  };

  const getStatusText = () => {
    if (spentPercentage >= 90) return 'Critical';
    if (spentPercentage >= 75) return 'Warning';
    if (spentPercentage >= 50) return 'Moderate';
    return 'Good';
  };

  if (compact) {
    return (
      <motion.div
        className="limit-card-compact"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -2 }}
      >
        <div className="compact-header">
          <div className="compact-icon" style={{ backgroundColor: categoryColor }}>
            <CategoryIcon />
          </div>
          <div className="compact-info">
            <h4 className="compact-merchant">{limit.merchant}</h4>
            <span className="compact-category">{limit.merchant_category}</span>
          </div>
        </div>

        <div className="compact-body">
          <div className="compact-amount">
            <span className="compact-label">Limit</span>
            <span className="compact-value">₹{limit.monthly_limit.toLocaleString()}</span>
          </div>
          <div className="compact-amount">
            <span className="compact-label">Spent</span>
            <span className="compact-value">₹{limit.current_spent.toLocaleString()}</span>
          </div>
        </div>

        <div className="compact-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${spentPercentage}%`,
                backgroundColor: getStatusColor()
              }}
            />
          </div>
          <span className="progress-percentage">{Math.round(spentPercentage)}%</span>
        </div>

        <div className="compact-footer">
          <span className={`status-badge ${getStatusText().toLowerCase()}`}>
            {getStatusText()}
          </span>
          <span className="remaining">₹{remaining.toLocaleString()} left</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`limit-card ${!limit.is_active ? 'inactive' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      <div className="limit-card-header">
        <div className="merchant-icon" style={{ backgroundColor: categoryColor }}>
          <CategoryIcon />
        </div>
        <div className="merchant-info">
          <h3 className="merchant-name">{limit.merchant}</h3>
          <span className="merchant-category">{limit.merchant_category}</span>
        </div>
        <div className="limit-actions">
          {onEdit && (
            <button className="action-btn edit" onClick={() => onEdit(limit)} title="Edit limit">
              <FaEdit />
            </button>
          )}
          {onToggle && (
            <button
              className={`action-btn toggle ${limit.is_active ? 'active' : 'inactive'}`}
              onClick={() => onToggle(limit)}
              title={limit.is_active ? 'Deactivate' : 'Activate'}
            >
              {limit.is_active ? <FaCheckCircle /> : <FaTimesCircle />}
            </button>
          )}
          {onDelete && (
            <button className="action-btn delete" onClick={() => onDelete(limit)} title="Delete limit">
              <FaTrash />
            </button>
          )}
        </div>
      </div>

      <div className="limit-card-body">
        <div className="limit-amounts">
          <div className="limit-amount">
            <span className="limit-label">Monthly Limit</span>
            <span className="limit-value">₹{limit.monthly_limit.toLocaleString()}</span>
          </div>
          {limit.per_transaction_limit && (
            <div className="per-txn-limit">
              <span className="limit-label">Per Transaction</span>
              <span className="limit-subvalue">₹{limit.per_transaction_limit.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="spent-progress">
          <div className="progress-header">
            <span>Spent this month</span>
            <span className="spent-amount">
              ₹{limit.current_spent.toLocaleString()} / ₹{limit.monthly_limit.toLocaleString()}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${spentPercentage >= 80 ? 'warning' : ''}`}
              style={{
                width: `${spentPercentage}%`,
                backgroundColor: getStatusColor()
              }}
            />
          </div>
        </div>

        <div className="limit-details">
          <div className="detail-item">
            <FaCalendarAlt className="detail-icon" />
            <span>Resets on 1st of month</span>
          </div>
          {limit.requires_approval && (
            <div className="detail-item">
              <FaBell className="detail-icon" />
              <span>Requires approval</span>
            </div>
          )}
          {!limit.is_active && (
            <div className="detail-item inactive">
              <FaTimesCircle className="detail-icon" />
              <span>Inactive</span>
            </div>
          )}
        </div>

        <div className="limit-footer">
          <div className="status-section">
            <span className={`status-indicator ${getStatusText().toLowerCase()}`} />
            <span className="status-text">{getStatusText()}</span>
          </div>
          <span className="remaining-amount">
            <FaRupeeSign />
            {remaining.toLocaleString()} left
          </span>
        </div>
      </div>

      {spentPercentage >= 90 && (
        <div className="limit-warning">
          <FaExclamationTriangle />
          <span>Limit almost reached!</span>
        </div>
      )}
    </motion.div>
  );
};

// Mini Limit Card for Dashboard
export const MiniLimitCard = ({ limit, onClick }) => {
  const getCategoryIcon = (category) => {
    const icons = {
      food: FaUtensils,
      shopping: FaShoppingBag,
      groceries: MdLocalGroceryStore
    };
    return icons[category] || FaShoppingBag;
  };

  const getCategoryColor = (category) => {
    const colors = {
      food: '#f59e0b',
      shopping: '#8b5cf6',
      groceries: '#10b981'
    };
    return colors[category] || '#6b7280';
  };

  const CategoryIcon = getCategoryIcon(limit.merchant_category);
  const categoryColor = getCategoryColor(limit.merchant_category);
  const spentPercentage = Math.min((limit.current_spent / limit.monthly_limit) * 100, 100);
  const remaining = limit.monthly_limit - limit.current_spent;

  return (
    <motion.div
      className="mini-limit-card"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="mini-icon" style={{ backgroundColor: categoryColor }}>
        <CategoryIcon />
      </div>
      <div className="mini-content">
        <div className="mini-header">
          <h4>{limit.merchant}</h4>
          <span className="mini-remaining">₹{remaining}</span>
        </div>
        <div className="mini-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${spentPercentage}%`,
                backgroundColor: spentPercentage >= 80 ? '#ef4444' : '#10b981'
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Summary Card for Overview
export const LimitSummaryCard = ({ totalLimit, totalSpent, activeLimits, nearLimit }) => {
  const overallPercentage = Math.min((totalSpent / totalLimit) * 100, 100);

  return (
    <div className="limit-summary-card">
      <h3>Reserve Pay Summary</h3>
      
      <div className="summary-stats">
        <div className="summary-stat">
          <span className="stat-label">Active Limits</span>
          <span className="stat-value">{activeLimits}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Near Limit</span>
          <span className="stat-value warning">{nearLimit}</span>
        </div>
      </div>

      <div className="summary-progress">
        <div className="progress-header">
          <span>Overall Usage</span>
          <span>₹{totalSpent.toLocaleString()} / ₹{totalLimit.toLocaleString()}</span>
        </div>
        <div className="progress-bar large">
          <div
            className="progress-fill"
            style={{
              width: `${overallPercentage}%`,
              backgroundColor: overallPercentage >= 80 ? '#ef4444' : '#667eea'
            }}
          />
        </div>
      </div>

      <div className="summary-footer">
        <FaChartLine className="summary-icon" />
        <span>{nearLimit} merchants near their limit</span>
      </div>
    </div>
  );
};

export default LimitCard;