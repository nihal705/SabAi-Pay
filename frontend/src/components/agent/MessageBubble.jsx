import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaRobot,
  FaUser,
  FaCopy,
  FaCheckCircle,
  FaExclamationCircle,
  FaShoppingBag,
  FaUtensils,
  FaBolt,
  FaArrowRight
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import './AgentStyles.css';

const MessageBubble = ({ message, onCopy, onSuggestionClick }) => {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const {
    type,
    content,
    timestamp,
    intent,
    orderDetails,
    limitCheck,
    suggestions,
    isError,
    isSuccess
  } = message;

  const handleCopy = () => {
    onCopy(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIntentIcon = () => {
    switch (intent) {
      case 'order_food':
        return <FaUtensils className="intent-icon food" />;
      case 'order_shopping':
        return <FaShoppingBag className="intent-icon shopping" />;
      case 'pay_bill':
        return <FaBolt className="intent-icon bill" />;
      case 'send_money':
        return <FaUser className="intent-icon send" />;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    if (isError) return <FaExclamationCircle className="status-icon error" />;
    if (isSuccess) return <FaCheckCircle className="status-icon success" />;
    return null;
  };

  const timeAgo = timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: true }) : '';

  return (
    <motion.div
      className={`message-wrapper ${type}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="message-avatar">
        {type === 'agent' ? <FaRobot /> : <FaUser />}
      </div>

      <div className="message-content-wrapper">
        <div className={`message-bubble ${type} ${isError ? 'error' : ''} ${isSuccess ? 'success' : ''}`}>
          {/* Intent Indicator */}
          {intent && (
            <div className="intent-indicator">
              {getIntentIcon()}
              <span className="intent-label">
                {intent.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
            </div>
          )}

          {/* Main Message */}
          <div className="message-text">
            {content}
          </div>

          {/* Order Details */}
          {orderDetails && (
            <div className="order-preview">
              <h4>Order Details</h4>
              <div className="order-preview-item">
                <span>Item:</span>
                <strong>{orderDetails.item}</strong>
              </div>
              {orderDetails.merchant && (
                <div className="order-preview-item">
                  <span>Merchant:</span>
                  <span className="merchant-badge">{orderDetails.merchant}</span>
                </div>
              )}
              {orderDetails.budget && (
                <div className="order-preview-item highlight">
                  <span>Budget:</span>
                  <strong>₹{orderDetails.budget}</strong>
                </div>
              )}
            </div>
          )}

          {/* Limit Check */}
          {limitCheck && (
            <div className="limit-check">
              {!limitCheck.allowed ? (
                <div className="limit-warning">
                  <FaExclamationCircle />
                  <span>{limitCheck.reason}</span>
                </div>
              ) : limitCheck.requires_approval ? (
                <div className="limit-approval">
                  <FaCheckCircle />
                  <span>Requires your approval</span>
                </div>
              ) : (
                <div className="limit-auto">
                  <FaCheckCircle />
                  <span>Within limits - auto-approved</span>
                </div>
              )}
            </div>
          )}

          {/* Status Icon */}
          {getStatusIcon()}
        </div>

        {/* Message Actions */}
        {showActions && (
          <div className="message-actions">
            <button
              className="action-btn copy"
              onClick={handleCopy}
              title="Copy message"
            >
              {copied ? <FaCheckCircle /> : <FaCopy />}
            </button>
          </div>
        )}

        {/* Timestamp */}
        <div className="message-time">
          {timeAgo}
        </div>

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="message-suggestions">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-pill"
                onClick={() => onSuggestionClick(suggestion)}
              >
                <span>{suggestion.emoji}</span>
                <span>{suggestion.text}</span>
                <FaArrowRight className="suggestion-arrow" />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Typing Indicator Component
export const TypingIndicator = () => {
  return (
    <div className="typing-indicator-container">
      <div className="typing-avatar">
        <FaRobot />
      </div>
      <div className="typing-bubble">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

// Quick Reply Component
export const QuickReply = ({ options, onSelect }) => {
  return (
    <div className="quick-replies">
      {options.map((option, index) => (
        <motion.button
          key={index}
          className="quick-reply-btn"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(option)}
        >
          {option.emoji && <span>{option.emoji}</span>}
          <span>{option.text}</span>
        </motion.button>
      ))}
    </div>
  );
};

// Transaction Card Component
export const TransactionCard = ({ transaction, onView }) => {
  return (
    <motion.div
      className="transaction-card"
      whileHover={{ y: -2 }}
      onClick={() => onView(transaction)}
    >
      <div className="transaction-card-header">
        <span className="transaction-card-amount">₹{transaction.amount}</span>
        <span className={`transaction-card-status ${transaction.status}`}>
          {transaction.status}
        </span>
      </div>
      <div className="transaction-card-details">
        <p className="transaction-card-merchant">
          {transaction.merchant || transaction.receiver_name}
        </p>
        <p className="transaction-card-date">
          {new Date(transaction.created_at).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
};

export default MessageBubble;