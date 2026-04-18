import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCoins,
  FaHistory,
  FaFilter,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaTimes,
  FaDownload,
  FaGem,
  FaFire,
  FaStar,
  FaGift,
  FaShoppingBag,
  FaUtensils,
  FaBolt,
  FaMobile,
  FaWallet
} from 'react-icons/fa';
import { MdReceipt } from 'react-icons/md';
import Button from '../common/Button';
import Input from '../common/Input';
import axios from 'axios';
import toast from 'react-hot-toast';
import './CoinStyles.css';

const CoinHistory = ({ userId, limit = 50 }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalUsed: 0,
    totalExpired: 0,
    averageEarned: 0
  });
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: '30',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [history, filters]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/coins/history?limit=${limit}&page=${page}`
      );
      
      if (response.data.success) {
        if (page === 1) {
          setHistory(response.data.data.history);
        } else {
          setHistory(prev => [...prev, ...response.data.data.history]);
        }
        setHasMore(response.data.data.history.length === limit);
      }
    } catch (error) {
      console.error('Error fetching coin history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...history];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(item => item.type === filters.type);
    }

    // Filter by date range
    const now = new Date();
    const daysAgo = new Date(now.setDate(now.getDate() - parseInt(filters.dateRange)));
    
    filtered = filtered.filter(item => new Date(item.created_at) >= daysAgo);

    // Custom date range
    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(item => {
        const date = new Date(item.created_at);
        return date >= new Date(filters.startDate) && date <= new Date(filters.endDate);
      });
    }

    setFilteredHistory(filtered);
  };

  const calculateStats = () => {
    const earned = filteredHistory
      .filter(item => item.type === 'earned' || item.type === 'bonus' || item.type === 'cashback')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const used = filteredHistory
      .filter(item => item.type === 'used')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const expired = filteredHistory
      .filter(item => item.type === 'expired')
      .reduce((sum, item) => sum + item.amount, 0);

    setStats({
      totalEarned: earned,
      totalUsed: used,
      totalExpired: expired,
      averageEarned: filteredHistory.length ? earned / filteredHistory.length : 0
    });
  };

  const getIconForType = (type, source) => {
    switch (type) {
      case 'earned':
        if (source?.includes('cashback')) return <FaGem className="history-icon earned" />;
        if (source?.includes('bonus')) return <FaStar className="history-icon bonus" />;
        if (source?.includes('referral')) return <FaGift className="history-icon referral" />;
        return <FaArrowDown className="history-icon earned" />;
      
      case 'used':
        if (source?.includes('bill')) return <FaBolt className="history-icon used" />;
        if (source?.includes('recharge')) return <FaMobile className="history-icon used" />;
        if (source?.includes('shopping')) return <FaShoppingBag className="history-icon used" />;
        if (source?.includes('food')) return <FaUtensils className="history-icon used" />;
        if (source?.includes('transfer')) return <FaWallet className="history-icon used" />;
        return <FaArrowUp className="history-icon used" />;
      
      case 'expired':
        return <FaTimes className="history-icon expired" />;
      
      default:
        return <FaCoins className="history-icon default" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'earned': return '#10b981';
      case 'used': return '#ef4444';
      case 'expired': return '#9ca3af';
      case 'bonus': return '#fbbf24';
      case 'cashback': return '#8b5cf6';
      case 'referral': return '#ec4899';
      default: return '#667eea';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleExport = () => {
    const csv = [
      ['Date', 'Type', 'Description', 'Amount', 'Status', 'Expiry Date'].join(','),
      ...filteredHistory.map(item => [
        new Date(item.created_at).toLocaleString(),
        item.type,
        item.description || '-',
        item.amount,
        item.status || 'completed',
        item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sabai-gems-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('History exported successfully!');
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="coin-history-container">
      {/* Header with Stats */}
      <div className="history-header">
        <div className="header-title">
          <FaHistory className="header-icon" />
          <h2>Gem History</h2>
        </div>

        <div className="header-actions">
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            <span>Filter</span>
          </button>
          <button className="export-btn" onClick={handleExport}>
            <FaDownload />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="history-stats">
        <div className="stat-card earned">
          <div className="stat-icon">
            <FaGem />
          </div>
          <div className="stat-info">
            <span className="stat-label">Earned</span>
            <span className="stat-value">{stats.totalEarned}</span>
          </div>
        </div>

        <div className="stat-card used">
          <div className="stat-icon">
            <FaFire />
          </div>
          <div className="stat-info">
            <span className="stat-label">Used</span>
            <span className="stat-value">{stats.totalUsed}</span>
          </div>
        </div>

        <div className="stat-card expired">
          <div className="stat-icon">
            <FaTimes />
          </div>
          <div className="stat-info">
            <span className="stat-label">Expired</span>
            <span className="stat-value">{stats.totalExpired}</span>
          </div>
        </div>

        <div className="stat-card average">
          <div className="stat-icon">
            <FaStar />
          </div>
          <div className="stat-info">
            <span className="stat-label">Average</span>
            <span className="stat-value">{Math.round(stats.averageEarned)}</span>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="filters-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="filters-grid">
              <div className="filter-group">
                <label>Transaction Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="all">All Types</option>
                  <option value="earned">Earned</option>
                  <option value="used">Used</option>
                  <option value="expired">Expired</option>
                  <option value="bonus">Bonus</option>
                  <option value="cashback">Cashback</option>
                  <option value="referral">Referral</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Time Period</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">This year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {filters.dateRange === 'custom' && (
                <>
                  <div className="filter-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="filter-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="filter-actions">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setFilters({
                  type: 'all',
                  dateRange: '30',
                  startDate: '',
                  endDate: ''
                })}
              >
                Reset Filters
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={() => {
                  applyFilters();
                  setShowFilters(false);
                }}
              >
                Apply Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Timeline */}
      <div className="history-timeline">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item, index) => (
            <motion.div
              key={item.id || index}
              className="timeline-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => {
                setSelectedItem(item);
                setShowDetails(true);
              }}
            >
              <div className="timeline-icon" style={{ color: getTypeColor(item.type) }}>
                {getIconForType(item.type, item.description)}
              </div>

              <div className="timeline-content">
                <div className="timeline-header">
                  <div>
                    <span className="timeline-title">
                      {item.description || `${item.type} Gems`}
                    </span>
                    <span className={`timeline-type ${item.type}`}>
                      {item.type}
                    </span>
                  </div>
                  <span className={`timeline-amount ${item.type}`}>
                    {item.type === 'earned' || item.type === 'bonus' || item.type === 'cashback'
                      ? `+${item.amount}`
                      : `-${item.amount}`}
                  </span>
                </div>

                <div className="timeline-footer">
                  <span className="timeline-date">
                    <FaCalendarAlt /> {formatDate(item.created_at)}
                  </span>
                  {item.expiry_date && (
                    <span className={`timeline-expiry ${new Date(item.expiry_date) < new Date() ? 'expired' : ''}`}>
                      Expires: {new Date(item.expiry_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="no-history">
            <FaGem className="no-history-icon" />
            <h3>No Gem History</h3>
            <p>Start earning gems by making transactions!</p>
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="load-more">
            <Button
              variant="outline"
              onClick={loadMore}
              loading={loading}
            >
              Load More
            </Button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && selectedItem && (
          <motion.div
            className="detail-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              className="detail-modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="detail-header">
                <div className="detail-icon" style={{ color: getTypeColor(selectedItem.type) }}>
                  {getIconForType(selectedItem.type, selectedItem.description)}
                </div>
                <h3>Transaction Details</h3>
                <button className="close-btn" onClick={() => setShowDetails(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="detail-content">
                <div className="detail-row highlight">
                  <span>Amount</span>
                  <span className="detail-amount">
                    {selectedItem.type === 'earned' ? '+' : '-'}{selectedItem.amount} Gems
                  </span>
                </div>

                <div className="detail-row">
                  <span>Type</span>
                  <span className={`detail-type ${selectedItem.type}`}>
                    {selectedItem.type}
                  </span>
                </div>

                <div className="detail-row">
                  <span>Description</span>
                  <span>{selectedItem.description || '-'}</span>
                </div>

                <div className="detail-row">
                  <span>Date & Time</span>
                  <span>{new Date(selectedItem.created_at).toLocaleString('en-IN')}</span>
                </div>

                {selectedItem.source_transaction_id && (
                  <div className="detail-row">
                    <span>Transaction ID</span>
                    <span className="txn-id">{selectedItem.source_transaction_id}</span>
                  </div>
                )}

                {selectedItem.expiry_date && (
                  <div className="detail-row">
                    <span>Expiry Date</span>
                    <span className={new Date(selectedItem.expiry_date) < new Date() ? 'expired-text' : ''}>
                      {new Date(selectedItem.expiry_date).toLocaleDateString('en-IN')}
                      {new Date(selectedItem.expiry_date) < new Date() && ' (Expired)'}
                    </span>
                  </div>
                )}

                {selectedItem.status && (
                  <div className="detail-row">
                    <span>Status</span>
                    <span className={`status-badge ${selectedItem.status}`}>
                      {selectedItem.status}
                    </span>
                  </div>
                )}
              </div>

              <div className="detail-footer">
                <Button variant="primary" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoinHistory;