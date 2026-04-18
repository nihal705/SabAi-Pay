import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './DashboardStyles.css';

const QuickActions = ({ actions }) => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="quick-actions">
      <h2 className="section-title">Quick Actions</h2>
      <motion.div
        className="actions-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {actions.map((action) => (
          <motion.button
            key={action.id}
            className="action-card"
            variants={itemVariants}
            whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(action.path)}
          >
            <div
              className="action-icon-wrapper"
              style={{ backgroundColor: action.bgColor }}
            >
              <action.icon style={{ color: action.color }} />
            </div>
            <span className="action-name">{action.name}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default QuickActions;