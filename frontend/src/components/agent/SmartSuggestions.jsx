import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaLightbulb,
  FaUtensils,
  FaShoppingBag,
  FaBolt,
  FaUser,
  FaCoins,
  FaCreditCard,
  FaArrowRight,
  FaHistory,
  FaStar,
  FaCalendarAlt,
  FaChartLine,
  FaGift,
  FaPercent
} from 'react-icons/fa';
import './AgentStyles.css';

const SmartSuggestions = ({ suggestions, onSelect, userContext }) => {
  const [activeTab, setActiveTab] = useState('quick');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  const suggestionTabs = [
    { id: 'quick', label: 'Quick Actions', icon: FaLightbulb },
    { id: 'personalized', label: 'For You', icon: FaStar },
    { id: 'recent', label: 'Recent', icon: FaHistory },
    { id: 'offers', label: 'Offers', icon: FaGift }
  ];

  const quickSuggestions = [
    { id: 1, text: 'Order pizza 🍕', icon: FaUtensils, intent: 'order_food' },
    { id: 2, text: 'Send money to Rahul', icon: FaUser, intent: 'send_money' },
    { id: 3, text: 'Pay electricity bill', icon: FaBolt, intent: 'pay_bill' },
    { id: 4, text: 'Check balance', icon: FaCoins, intent: 'check_balance' },
    { id: 5, text: 'Buy from Amazon', icon: FaShoppingBag, intent: 'order_shopping' },
    { id: 6, text: 'Set monthly limit', icon: FaCreditCard, intent: 'set_limit' }
  ];

  const personalizedSuggestions = [
    {
      id: 1,
      text: 'Recharge your mobile',
      description: 'Your Airtel number is due',
      icon: FaBolt,
      action: 'Recharge now',
      amount: '₹299'
    },
    {
      id: 2,
      text: 'Order from Swiggy',
      description: 'Based on your last order',
      icon: FaUtensils,
      action: 'Order again',
      amount: '₹350'
    },
    {
      id: 3,
      text: 'Weekly spending report',
      description: 'You spent ₹3,250 this week',
      icon: FaChartLine,
      action: 'View report',
      trend: '+12% vs last week'
    }
  ];

  const recentActions = [
    {
      id: 1,
      text: 'Paid electricity bill',
      timestamp: '2 days ago',
      amount: '₹850',
      icon: FaBolt,
      status: 'success'
    },
    {
      id: 2,
      text: 'Ordered from Zomato',
      timestamp: '3 days ago',
      amount: '₹450',
      icon: FaUtensils,
      status: 'success'
    },
    {
      id: 3,
      text: 'Sent to Rahul',
      timestamp: '5 days ago',
      amount: '₹1,000',
      icon: FaUser,
      status: 'success'
    }
  ];

  const offers = [
    {
      id: 1,
      title: '20% Cashback',
      description: 'On your first AI order',
      code: 'SABAI20',
      expiry: '2 days left',
      icon: FaPercent,
      color: '#10b981'
    },
    {
      id: 2,
      title: 'Double Coins',
      description: 'On bill payments',
      code: 'COINS2X',
      expiry: '5 days left',
      icon: FaCoins,
      color: '#fbbf24'
    },
    {
      id: 3,
      title: 'Free Delivery',
      description: 'On orders above ₹299',
      code: 'FREEDEL',
      expiry: 'Limited period',
      icon: FaGift,
      color: '#8b5cf6'
    }
  ];

  const handleSuggestionClick = (suggestion) => {
    setSelectedSuggestion(suggestion.id);
    onSelect(suggestion);
    
    // Reset after animation
    setTimeout(() => setSelectedSuggestion(null), 300);
  };

  return (
    <div className="smart-suggestions">
      {/* Tabs */}
      <div className="suggestions-tabs">
        {suggestionTabs.map((tab) => (
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

      {/* Suggestions Content */}
      <div className="suggestions-content">
        <AnimatePresence mode="wait">
          {activeTab === 'quick' && (
            <motion.div
              key="quick"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="quick-suggestions-grid"
            >
              {quickSuggestions.map((suggestion) => (
                <motion.button
                  key={suggestion.id}
                  className={`suggestion-card ${
                    selectedSuggestion === suggestion.id ? 'selected' : ''
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="suggestion-icon">
                    <suggestion.icon />
                  </div>
                  <span className="suggestion-text">{suggestion.text}</span>
                  <FaArrowRight className="suggestion-arrow" />
                </motion.button>
              ))}
            </motion.div>
          )}

          {activeTab === 'personalized' && (
            <motion.div
              key="personalized"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="personalized-suggestions"
            >
              {personalizedSuggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  className="personalized-card"
                  whileHover={{ x: 4 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="personalized-icon">
                    <suggestion.icon />
                  </div>
                  <div className="personalized-content">
                    <h4>{suggestion.text}</h4>
                    <p className="description">{suggestion.description}</p>
                    {suggestion.amount && (
                      <span className="amount-badge">{suggestion.amount}</span>
                    )}
                    {suggestion.trend && (
                      <span className="trend-badge">{suggestion.trend}</span>
                    )}
                  </div>
                  <button className="action-btn">
                    {suggestion.action} <FaArrowRight />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'recent' && (
            <motion.div
              key="recent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="recent-actions"
            >
              {recentActions.map((action) => (
                <motion.div
                  key={action.id}
                  className="recent-action-card"
                  whileHover={{ x: 4 }}
                  onClick={() => handleSuggestionClick(action)}
                >
                  <div className="recent-icon">
                    <action.icon />
                  </div>
                  <div className="recent-details">
                    <div className="recent-header">
                      <span className="recent-text">{action.text}</span>
                      <span className="recent-amount">{action.amount}</span>
                    </div>
                    <div className="recent-footer">
                      <span className="recent-time">
                        <FaCalendarAlt /> {action.timestamp}
                      </span>
                      <span className={`recent-status ${action.status}`}>
                        {action.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'offers' && (
            <motion.div
              key="offers"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="offers-grid"
            >
              {offers.map((offer) => (
                <motion.div
                  key={offer.id}
                  className="offer-card"
                  style={{ borderColor: offer.color }}
                  whileHover={{ y: -2 }}
                >
                  <div className="offer-header">
                    <div className="offer-icon" style={{ backgroundColor: offer.color }}>
                      <offer.icon />
                    </div>
                    <span className="offer-expiry">{offer.expiry}</span>
                  </div>
                  
                  <h4 className="offer-title">{offer.title}</h4>
                  <p className="offer-description">{offer.description}</p>
                  
                  <div className="offer-code">
                    <span className="code-label">Code:</span>
                    <span className="code-value">{offer.code}</span>
                  </div>

                  <button
                    className="apply-offer-btn"
                    onClick={() => handleSuggestionClick(offer)}
                  >
                    Apply Offer
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* View All Link */}
      <div className="suggestions-footer">
        <button className="view-all-link">
          View all suggestions <FaArrowRight />
        </button>
      </div>
    </div>
  );
};

// Context-Aware Suggestion Component
export const ContextSuggestion = ({ context, onSelect }) => {
  const getContextMessage = () => {
    if (context.spentPercentage > 80) {
      return {
        icon: <FaChartLine />,
        title: 'Near Monthly Limit',
        message: `You've used ${context.spentPercentage}% of your limit`,
        action: 'View spending'
      };
    }
    if (context.expiringCoins > 0) {
      return {
        icon: <FaCoins />,
        title: 'Coins Expiring Soon',
        message: `${context.expiringCoins} coins will expire in 3 days`,
        action: 'Use coins'
      };
    }
    if (context.upcomingBills > 0) {
      return {
        icon: <FaBolt />,
        title: 'Upcoming Bills',
        message: `${context.upcomingBills} bills due this week`,
        action: 'Pay now'
      };
    }
    return null;
  };

  const contextMessage = getContextMessage();

  if (!contextMessage) return null;

  return (
    <motion.div
      className="context-suggestion"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 4 }}
      onClick={() => onSelect(contextMessage)}
    >
      <div className="context-icon">
        {contextMessage.icon}
      </div>
      <div className="context-content">
        <h4>{contextMessage.title}</h4>
        <p>{contextMessage.message}</p>
      </div>
      <button className="context-action">
        {contextMessage.action} <FaArrowRight />
      </button>
    </motion.div>
  );
};

export default SmartSuggestions;