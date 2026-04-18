import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowUp,
  FaArrowDown,
  FaShoppingBag,
  FaUtensils,
  FaFilm,
  FaBolt,
  FaQrcode,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaFilePdf,
  FaFileExcel,
  FaCalendarAlt,
  FaRupeeSign,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUser,
  FaStore
} from 'react-icons/fa';
import { MdReceipt } from 'react-icons/md';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import axios from 'axios';
import toast from 'react-hot-toast';
import './UPIStyles.css';

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    fromDate: '',
    toDate: '',
    merchant: '',
    minAmount: '',
    maxAmount: '',
    search: ''
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [pagination.page, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.fromDate && { from_date: filters.fromDate }),
        ...(filters.toDate && { to_date: filters.toDate }),
        ...(filters.merchant && { merchant: filters.merchant })
      });

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/transactions?${params}`
      );

      if (response.data.success) {
        setTransactions(response.data.data.transactions);
        setFilteredTransactions(response.data.data.transactions);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/transactions/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setFilters(prev => ({ ...prev, search: searchTerm }));

    if (searchTerm) {
      const filtered = transactions.filter(txn => 
        txn.transaction_id?.toLowerCase().includes(searchTerm) ||
        txn.merchant?.toLowerCase().includes(searchTerm) ||
        txn.receiver_name?.toLowerCase().includes(searchTerm) ||
        txn.receiver_vpa?.toLowerCase().includes(searchTerm) ||
        txn.description?.toLowerCase().includes(searchTerm)
      );
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(transactions);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchTransactions();
  };

  const resetFilters = () => {
    setFilters({
      type: '',
      status: '',
      fromDate: '',
      toDate: '',
      merchant: '',
      minAmount: '',
      maxAmount: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams({
        format,
        ...(filters.fromDate && { from_date: filters.fromDate }),
        ...(filters.toDate && { to_date: filters.toDate }),
        ...(filters.type && { type: filters.type })
      });

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/transactions/download?${params}`,
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Transactions exported as ${format.toUpperCase()}`);
      setShowExportModal(false);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const getTransactionIcon = (type, category) => {
    if (type === 'send') return <FaArrowUp className="txn-icon send" />;
    if (type === 'receive') return <FaArrowDown className="txn-icon receive" />;
    if (type === 'qr') return <FaQrcode className="txn-icon qr" />;
    if (type === 'bill') return <MdReceipt className="txn-icon bill" />;
    
    switch (category) {
      case 'food': return <FaUtensils className="txn-icon food" />;
      case 'shopping': return <FaShoppingBag className="txn-icon shopping" />;
      case 'entertainment': return <FaFilm className="txn-icon entertainment" />;
      case 'bills': return <FaBolt className="txn-icon bills" />;
      default: return <FaStore className="txn-icon default" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <FaCheckCircle className="status-icon success" />;
      case 'failed': return <FaTimesCircle className="status-icon failed" />;
      case 'pending': return <FaClock className="status-icon pending" />;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
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

  const formatAmount = (amount, type) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);

    return type === 'send' ? `-${formatted}` : formatted;
  };

  const transactionTypes = [
    { value: '', label: 'All Types' },
    { value: 'send', label: 'Sent' },
    { value: 'receive', label: 'Received' },
    { value: 'bill', label: 'Bill Payments' },
    { value: 'recharge', label: 'Recharges' },
    { value: 'qr', label: 'QR Payments' },
    { value: 'request', label: 'Requests' }
  ];

  const statusTypes = [
    { value: '', label: 'All Status' },
    { value: 'success', label: 'Success' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="transaction-history-container"
    >
      <div className="transaction-history-header">
        <h1>Transaction History</h1>
        <div className="header-actions">
          <button
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            <span>Filter</span>
          </button>
          <button
            className="export-btn"
            onClick={() => setShowExportModal(true)}
          >
            <FaDownload />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="transaction-stats">
          <div className="stat-card">
            <div className="stat-icon total">
              <FaRupeeSign />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Spent</span>
              <span className="stat-value">₹{stats.summary?.total_spent?.toLocaleString() || '0'}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon count">
              <FaEye />
            </div>
            <div className="stat-info">
              <span className="stat-label">Transactions</span>
              <span className="stat-value">{stats.summary?.total_transactions || '0'}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">
              <FaCheckCircle />
            </div>
            <div className="stat-info">
              <span className="stat-label">Successful</span>
              <span className="stat-value">{stats.summary?.successful || '0'}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon avg">
              <FaClock />
            </div>
            <div className="stat-info">
              <span className="stat-label">Average</span>
              <span className="stat-value">₹{Math.round(stats.summary?.avg_amount) || '0'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="transaction-search">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by ID, merchant, or description..."
          value={filters.search}
          onChange={handleSearch}
          className="search-input"
        />
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
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  {transactionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  {statusTypes.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Min Amount</label>
                <input
                  type="number"
                  placeholder="₹0"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Max Amount</label>
                <input
                  type="number"
                  placeholder="₹any"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                />
              </div>
            </div>

            <div className="filter-actions">
              <Button variant="secondary" onClick={resetFilters}>
                Reset
              </Button>
              <Button variant="primary" onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions List */}
      <div className="transactions-list">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map((txn, index) => (
            <motion.div
              key={txn.id}
              className="transaction-row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => {
                setSelectedTransaction(txn);
                setShowDetails(true);
              }}
            >
              <div className="transaction-icon">
                {getTransactionIcon(txn.type, txn.category)}
              </div>

              <div className="transaction-info">
                <div className="transaction-main">
                  <h4 className="transaction-title">
                    {txn.merchant || txn.receiver_name || txn.receiver_vpa || 'Transfer'}
                  </h4>
                  <p className="transaction-desc">
                    {txn.description || `${txn.type} payment`}
                  </p>
                </div>
                <div className="transaction-meta">
                  <span className="transaction-id">ID: {txn.transaction_id}</span>
                  <span className="transaction-time">{formatDate(txn.created_at)}</span>
                </div>
              </div>

              <div className="transaction-amount-status">
                <span className={`transaction-amount ${txn.type}`}>
                  {formatAmount(txn.amount, txn.type)}
                </span>
                <span className={`transaction-status ${txn.status}`}>
                  {getStatusIcon(txn.status)}
                  {txn.status}
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="no-transactions">
            <MdReceipt className="no-txn-icon" />
            <h3>No transactions found</h3>
            <p>Try adjusting your filters or make your first payment</p>
            <Button variant="primary" onClick={() => navigate('/send-money')}>
              Send Money
            </Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          
          <div className="page-numbers">
            {[...Array(pagination.totalPages).keys()].slice(
              Math.max(0, pagination.page - 3),
              Math.min(pagination.totalPages, pagination.page + 2)
            ).map(num => (
              <button
                key={num + 1}
                className={`page-number ${pagination.page === num + 1 ? 'active' : ''}`}
                onClick={() => setPagination(prev => ({ ...prev, page: num + 1 }))}
              >
                {num + 1}
              </button>
            ))}
          </div>

          <button
            className="page-btn"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}

      {/* Transaction Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Transaction Details"
        size="medium"
      >
        {selectedTransaction && (
          <div className="transaction-details">
            <div className="details-header">
              <div className="details-icon">
                {getTransactionIcon(selectedTransaction.type, selectedTransaction.category)}
              </div>
              <div className="details-amount">
                <span className={`amount ${selectedTransaction.type}`}>
                  {formatAmount(selectedTransaction.amount, selectedTransaction.type)}
                </span>
                <span className={`status-badge ${selectedTransaction.status}`}>
                  {selectedTransaction.status}
                </span>
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Transaction ID</span>
                <span className="detail-value">{selectedTransaction.transaction_id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date & Time</span>
                <span className="detail-value">
                  {new Date(selectedTransaction.created_at).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Type</span>
                <span className="detail-value type">{selectedTransaction.type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Method</span>
                <span className="detail-value">{selectedTransaction.payment_method}</span>
              </div>
              {selectedTransaction.merchant && (
                <div className="detail-item">
                  <span className="detail-label">Merchant</span>
                  <span className="detail-value">{selectedTransaction.merchant}</span>
                </div>
              )}
              {selectedTransaction.receiver_vpa && (
                <div className="detail-item">
                  <span className="detail-label">To UPI ID</span>
                  <span className="detail-value">{selectedTransaction.receiver_vpa}</span>
                </div>
              )}
              {selectedTransaction.receiver_name && (
                <div className="detail-item">
                  <span className="detail-label">Recipient</span>
                  <span className="detail-value">{selectedTransaction.receiver_name}</span>
                </div>
              )}
              {selectedTransaction.description && (
                <div className="detail-item full-width">
                  <span className="detail-label">Description</span>
                  <span className="detail-value">{selectedTransaction.description}</span>
                </div>
              )}
              {selectedTransaction.razorpay_payment_id && (
                <div className="detail-item">
                  <span className="detail-label">Payment ID</span>
                  <span className="detail-value">{selectedTransaction.razorpay_payment_id}</span>
                </div>
              )}
            </div>

            <div className="details-footer">
              <Button variant="secondary" onClick={() => setShowDetails(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => {
                // Handle download receipt
                toast.success('Receipt downloaded');
              }}>
                Download Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Transactions"
        size="small"
      >
        <div className="export-modal">
          <p className="export-desc">Choose format to export your transactions</p>
          
          <div className="export-options">
            <button
              className="export-option"
              onClick={() => handleExport('csv')}
            >
              <FaFileExcel className="option-icon excel" />
              <span>CSV File</span>
              <small>For Excel, Google Sheets</small>
            </button>
            
            <button
              className="export-option"
              onClick={() => handleExport('pdf')}
            >
              <FaFilePdf className="option-icon pdf" />
              <span>PDF File</span>
              <small>For printing, sharing</small>
            </button>
          </div>

          <div className="export-note">
            <FaCalendarAlt />
            <p>Exporting {filteredTransactions.length} transactions</p>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default TransactionHistory;