import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaArrowRight } from 'react-icons/fa';
import './DashboardStyles.css';

const AgentSuggestions = ({ suggestions }) => {
  const navigate = useNavigate();

  const defaultSuggestions = [
    {
      text: "Order pizza for dinner 🍕",
      intent: "order_food",
      emoji: "🍕"
    },
    {
      text: "Pay electricity bill 💡",
      intent: "pay_bill",
      emoji: "💡"
    },
    {
      text: "Check monthly spending 📊",
      intent: "check_balance",
      emoji: "📊"
    },
    {
      text: "Send money to Rahul 👤",
      intent: "send_money",
      emoji: "👤"
    }
  ];

  const displaySuggestions = suggestions?.length ? suggestions : defaultSuggestions;

  const handleSuggestionClick = (suggestion) => {
    // Store in localStorage for agent chat to pick up
    localStorage.setItem('agent_suggestion', JSON.stringify(suggestion));
    navigate('/agent');
  };

  return (
    <div className="agent-suggestions">
      <div className="suggestions-header">
        <FaRobot className="header-icon" />
        <span>Try asking SabAI</span>
      </div>

      <div className="suggestions-grid">
        {displaySuggestions.slice(0, 4).map((suggestion, index) => (
          <motion.button
            key={index}
            className="suggestion-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <span className="suggestion-emoji">{suggestion.emoji}</span>
            <span className="suggestion-text">{suggestion.text}</span>
            <FaArrowRight className="suggestion-arrow" />
          </motion.button>
        ))}
      </div>

      <motion.button
        className="chat-now-btn"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/agent')}
      >
        <FaRobot />
        <span>Chat with SabAI Now</span>
        <FaArrowRight />
      </motion.button>
    </div>
  );
};

export default AgentSuggestions;