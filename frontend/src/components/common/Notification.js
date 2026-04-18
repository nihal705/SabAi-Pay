import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
  FaBell,
  FaClock,
  FaCoins,
  FaExclamationTriangle
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const Notification = ({
  notification,
  onClose,
  onClick,
  autoClose = true,
  autoCloseTime = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  const {
    id,
    type,
    title,
    message,
    priority,
    is_read,
    created_at,
    data
  } = notification;

  useEffect(() => {
    if (autoClose && !is_read) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            handleClose();
            return 0;
          }
          return prev - (100 / (autoCloseTime / 100));
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [autoClose, is_read]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(id), 300);
  };

  const handleClick = () => {
    onClick?.(notification);
  };

  const getIcon = () => {
    switch (type) {
      case 'transaction':
        return <FaCheckCircle className="notif-icon success" />;
      case 'coin_expiry':
        return <FaCoins className="notif-icon warning" />;
      case 'limit_alert':
        return <FaExclamationTriangle className="notif-icon danger" />;
      case 'security':
        return <FaExclamationCircle className="notif-icon danger" />;
      case 'reminder':
        return <FaClock className="notif-icon info" />;
      default:
        return <FaBell className="notif-icon info" />;
    }
  };

  const getBackgroundColor = () => {
    if (is_read) return 'var(--notif-read-bg)';
    
    switch (priority) {
      case 'high':
        return 'var(--notif-high-bg)';
      case 'medium':
        return 'var(--notif-medium-bg)';
      default:
        return 'var(--notif-low-bg)';
    }
  };

  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={`notification-item ${!is_read ? 'unread' : ''}`}
          style={{ backgroundColor: getBackgroundColor() }}
          onClick={handleClick}
        >
          <div className="notification-icon">
            {getIcon()}
          </div>

          <div className="notification-content">
            <div className="notification-header">
              <h4 className="notification-title">{title}</h4>
              {!is_read && <span className="notification-badge">New</span>}
            </div>
            
            <p className="notification-message">{message}</p>
            
            <div className="notification-footer">
              <span className="notification-time">{timeAgo}</span>
              {data && (
                <span className="notification-data">
                  {Object.entries(data).map(([key, value]) => (
                    <span key={key} className="data-tag">
                      {key}: {value}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>

          <button
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
          >
            <FaTimes />
          </button>

          {autoClose && !is_read && (
            <div
              className="notification-progress"
              style={{ width: `${progress}%` }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Notification Center Component
export const NotificationCenter = ({ notifications, onClose, onMarkRead, onMarkAllRead }) => {
  const [filter, setFilter] = useState('all');

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'high') return notif.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notification-center">
      <div className="notification-center-header">
        <h3>
          Notifications
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </h3>
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <div className="notification-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread
        </button>
        <button
          className={`filter-btn ${filter === 'high' ? 'active' : ''}`}
          onClick={() => setFilter('high')}
        >
          High Priority
        </button>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={onMarkAllRead}>
            Mark all read
          </button>
        )}
      </div>

      <div className="notification-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <Notification
              key={notification.id}
              notification={notification}
              onClose={onMarkRead}
              onClick={(n) => onMarkRead(n.id)}
            />
          ))
        ) : (
          <div className="no-notifications">
            <FaBell className="no-notif-icon" />
            <p>No notifications to show</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Toast Notification Component (for temporary alerts)
export const ToastNotification = ({ message, type = 'info', duration = 3000 }) => {
  const types = {
    success: {
      icon: <FaCheckCircle />,
      className: 'toast-success'
    },
    error: {
      icon: <FaExclamationCircle />,
      className: 'toast-error'
    },
    warning: {
      icon: <FaExclamationTriangle />,
      className: 'toast-warning'
    },
    info: {
      icon: <FaInfoCircle />,
      className: 'toast-info'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`toast-notification ${types[type].className}`}
    >
      <span className="toast-icon">{types[type].icon}</span>
      <span className="toast-message">{message}</span>
    </motion.div>
  );
};

// Notification Badge Component
export const NotificationBadge = ({ count, onClick }) => {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="notification-badge"
      onClick={onClick}
    >
      {count > 99 ? '99+' : count}
    </motion.div>
  );
};

// Notification Bell Component
export const NotificationBell = ({ count, onClick }) => {
  return (
    <button className="notification-bell" onClick={onClick}>
      <FaBell />
      <NotificationBadge count={count} />
    </button>
  );
};

// In-App Notification Component (for real-time alerts)
export const InAppNotification = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="in-app-notification"
    >
      <div className="in-app-content">
        <h4>{notification.title}</h4>
        <p>{notification.message}</p>
      </div>
      <button className="dismiss-btn" onClick={() => onDismiss(notification.id)}>
        <FaTimes />
      </button>
    </motion.div>
  );
};

export default Notification;