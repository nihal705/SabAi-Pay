// frontend/src/pages/TransactionHistoryPage.jsx
// COMPLETELY REDESIGNED - Better UI/UX, proper transaction handling from all platforms

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import storageService, {
    getTransactions, getPaidBills, getAutoPayOrders, getBills,
    getCurrentUserId, getBankAccounts, getLifetimeEarned
} from '../services/storageService';
import { 
  FaArrowUp, FaArrowDown, FaSearch, FaFilter, FaDownload, 
  FaTimes, FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt, 
  FaUniversity, FaMobile, FaBolt, FaShoppingBag, FaUtensils, 
  FaFilm, FaGasPump, FaPlane, FaMedkit, FaGraduationCap, FaUser,
  FaHistory, FaChevronLeft, FaChevronRight, FaFileInvoice, 
  FaCopy, FaShare, FaPrint, FaWallet, FaPercent, FaExclamationTriangle,
  FaRobot, FaGem, FaGift, FaStar, FaCrown, FaTrophy, FaFire,
  FaInfoCircle, FaEye, FaEyeSlash, FaSync, FaQrcode, FaReceipt
} from 'react-icons/fa';
import { MdQrCodeScanner, MdReceipt } from 'react-icons/md';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import './TransactionHistoryPage.css';

// Helper to get gem logo
const GemLogo = ({ size = 'small' }) => (
  <img 
    src="/images/sabaigems.png" 
    alt="SabAI Gems" 
    className={`gem-logo-${size}`}
    style={{ width: size === 'small' ? 14 : size === 'medium' ? 20 : 28, height: 'auto' }}
  />
);

const TransactionHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for transactions
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // State for filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    bank: 'all',
    dateRange: '30',
    type: 'all',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // State for sorting
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // State for banks list
  const [linkedBanks, setLinkedBanks] = useState([]);
  
  // State for statistics
  const [stats, setStats] = useState({
    totalSent: 0,
    totalReceived: 0,
    totalCashback: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0
  });

  // Load data on mount
  useEffect(() => {
    loadLinkedBanks();
    loadTransactions();
  }, []);

  // Apply filters whenever filters, search, or transactions change
  useEffect(() => {
    applyFilters();
  }, [filters, searchTerm, transactions, sortBy, sortOrder]);

  // Update pagination when filtered transactions change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredTransactions.length / itemsPerPage));
    setCurrentPage(1);
  }, [filteredTransactions]);

  const loadLinkedBanks = async () => {
    const savedAccounts = await getBankAccounts();
    setLinkedBanks(savedAccounts);
};

  // In TransactionHistoryPage.jsx, update the loadTransactions function:

const loadTransactions = async () => {
  setLoading(true);
  
  try {
    const allTransactions = await getTransactions();
    const paidBillsData = await getPaidBills();
    const autoPayOrdersData = await getAutoPayOrders();
    const billsData = await getBills();
    
    // Process main transactions - INCLUDE ALL (both success and failed)
    const mainTransactions = allTransactions.map(txn => ({
      ...txn,
      source: 'main',
      type: txn.type || determineTransactionType(txn),
      amount: txn.amount || 0,
      date: txn.date || new Date().toISOString(),
      status: txn.status || (txn.failure_reason ? 'failed' : 'success'),
      description: txn.description || getDefaultDescription(txn),
      transactionId: txn.transactionId || `TXN${txn.id || Date.now()}`,
      cashback: txn.cashback_earned || txn.cashback || 0,
      bank_name: txn.bank_name,
      bank_id: txn.bank_id,
      failure_reason: txn.failure_reason,
      payment_method_display: txn.payment_method_display
    }));
    
    // Process paid bills as transactions (only successful)
    const billTransactions = paidBillsData.map(bill => ({
      id: `bill_${bill.id}`,
      transactionId: bill.transaction_id || `BILL${bill.id}`,
      type: 'bill',
      amount: parseFloat(bill.amount),
      date: bill.paid_at || bill.due_date || new Date().toISOString(),
      status: 'success',
      description: `Bill payment to ${bill.provider} (${bill.customer_id})`,
      merchant: bill.provider,
      customer_id: bill.customer_id,
      bill_type: bill.bill_type,
      source: 'bill',
      cashback: bill.cashback_earned || 0,
      payment_method: bill.payment_method,
      bank_name: bill.bank_name,
      payment_method_display: bill.payment_method_display
    }));
    
    // Process auto-pay executions (only successful)
    const autoPayTransactions = [];
    autoPayOrdersData.forEach(order => {
      if (order.executionHistory && order.executionHistory.length > 0) {
        order.executionHistory.forEach(exec => {
          autoPayTransactions.push({
            id: `auto_${order.id}_${exec.date}`,
            transactionId: `AP${order.id}`,
            type: order.isBillPayment ? 'bill' : order.isRecharge ? 'recharge' : 'auto_pay',
            amount: exec.amount || order.amount,
            date: exec.date,
            status: exec.status === 'success' ? 'success' : 'failed',
            description: `Auto-pay: ${order.merchantName || order.operatorName || 'Payment'}`,
            merchant: order.merchantName || order.operatorName,
            source: 'auto_pay',
            cashback: exec.cashback || 0,
            failure_reason: exec.error
          });
        });
      }
    });
    
    // Combine all transactions
    let allProcessed = [
      ...mainTransactions,
      ...billTransactions,
      ...autoPayTransactions
    ];
    
    // Remove duplicates by transactionId (keep the first one)
    const uniqueMap = new Map();
    allProcessed.forEach(txn => {
      if (!uniqueMap.has(txn.transactionId) || txn.source === 'main') {
        uniqueMap.set(txn.transactionId, txn);
      }
    });
    
    allProcessed = Array.from(uniqueMap.values());
    allProcessed.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setTransactions(allProcessed);
    calculateStats(allProcessed);
  } catch (error) {
    console.error('Error loading transactions:', error);
    toast.error('Failed to load transactions');
  } finally {
    setLoading(false);
  }
};

  const determineTransactionType = (txn) => {
    if (txn.type === 'send' || txn.type === 'sent') return 'send';
    if (txn.type === 'receive' || txn.type === 'received') return 'receive';
    if (txn.type === 'bill' || txn.type === 'bill_payment') return 'bill';
    if (txn.type === 'recharge') return 'recharge';
    if (txn.type === 'qr' || txn.type === 'qr_payment') return 'qr';
    if (txn.type === 'cashback') return 'cashback';
    if (txn.type === 'auto_pay_execution') return 'auto_pay';
    if (txn.type === 'reserve_pay') return 'reserve_pay';
    if (txn.type === 'challenge_reward') return 'cashback';
    return 'other';
  };

  const getDefaultDescription = (txn) => {
    if (txn.merchant) return `Payment to ${txn.merchant}`;
    if (txn.receiver_name) return `Payment to ${txn.receiver_name}`;
    if (txn.provider) return `Payment to ${txn.provider}`;
    return 'Transaction';
  };

// In TransactionHistoryPage.jsx, update calculateStats function:

const calculateStats = async (txns) => {
    // Get lifetime earned from storageService
    const lifetimeEarned = await getLifetimeEarned();
    
    // Calculate total sent
    const totalSent = txns
        .filter(t => {
            const outgoingTypes = ['send', 'bill', 'recharge', 'auto_pay', 'reserve_pay'];
            const isOutgoing = outgoingTypes.includes(t.type);
            const isSuccess = t.status === 'success';
            const isSelfTransfer = t.type === 'self_transfer';
            return isOutgoing && isSuccess && !isSelfTransfer;
        })
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const totalReceived = txns
        .filter(t => t.type === 'receive' && t.status === 'success')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const successful = txns.filter(t => t.status === 'success').length;
    const failed = txns.filter(t => t.status === 'failed').length;
    const pending = txns.filter(t => t.status === 'pending').length;

    setStats({
        totalSent,
        totalReceived,
        totalCashback: lifetimeEarned,  // Use the consistent lifetime earned
        totalTransactions: txns.length,
        successfulTransactions: successful,
        failedTransactions: failed,
        pendingTransactions: pending
    });
};

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(term) ||
        t.merchant?.toLowerCase().includes(term) ||
        t.receiver_name?.toLowerCase().includes(term) ||
        t.receiver_vpa?.toLowerCase().includes(term) ||
        t.transactionId?.toLowerCase().includes(term) ||
        t.provider?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // Bank filter
    if (filters.bank !== 'all') {
      filtered = filtered.filter(t => t.bank_id === parseInt(filters.bank));
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Date range filter
    const now = new Date();
    if (filters.dateRange !== 'custom') {
      const days = parseInt(filters.dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter(t => new Date(t.date) >= cutoff);
    } else if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => {
        const txnDate = new Date(t.date);
        return txnDate >= start && txnDate <= end;
      });
    }

    // Amount filter
    if (filters.minAmount) {
      filtered = filtered.filter(t => t.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(t => t.amount <= parseFloat(filters.maxAmount));
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'amount') {
        comparison = (a.amount || 0) - (b.amount || 0);
      } else if (sortBy === 'type') {
        comparison = (a.type || '').localeCompare(b.type || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTransactions(filtered);
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${days[date.getDay()]}, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const getFullDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    const iconStyle = { fontSize: '1.3rem' };
    switch (type) {
      case 'send': return <FaArrowUp style={{ ...iconStyle, color: '#ef4444' }} />;
      case 'receive': return <FaArrowDown style={{ ...iconStyle, color: '#10b981' }} />;
      case 'bill': return <FaBolt style={{ ...iconStyle, color: '#f59e0b' }} />;
      case 'recharge': return <FaMobile style={{ ...iconStyle, color: '#3b82f6' }} />;
      case 'qr': return <MdQrCodeScanner style={{ ...iconStyle, color: '#8b5cf6' }} />;
      case 'cashback': return <GemLogo size="medium" />;
      case 'auto_pay': return <FaRobot style={{ ...iconStyle, color: '#6b7280' }} />;
      case 'reserve_pay': return <FaWallet style={{ ...iconStyle, color: '#4f46e5' }} />;
      case 'redeem': return <FaGift style={{ ...iconStyle, color: '#ec4899' }} />;
      default: return <FaReceipt style={{ ...iconStyle, color: '#64748b' }} />;
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

  const getTransactionTypeName = (type) => {
    const types = {
      send: 'Money Sent',
      receive: 'Money Received',
      bill: 'Bill Payment',
      recharge: 'Mobile Recharge',
      qr: 'QR Payment',
      cashback: 'Cashback Earned',
      auto_pay: 'Auto-Pay',
      reserve_pay: 'Reserve Pay',
      redeem: 'Gems Redeemed',
      other: 'Transaction'
    };
    return types[type] || types.other;
  };

  const formatAmount = (amount, type) => {
    const numAmount = parseFloat(amount) || 0;
    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(numAmount);
    
    // Remove the ₹ symbol from the formatted string and add it back with proper styling
    const amountWithoutSymbol = formatted.replace('₹', '').trim();
    
    if (type === 'send' || type === 'bill' || type === 'recharge' || type === 'qr' || type === 'auto_pay' || type === 'reserve_pay') {
        return <span className="amount negative">- ₹{amountWithoutSymbol}</span>;
    } else if (type === 'receive') {
        return <span className="amount positive">+ ₹{amountWithoutSymbol}</span>;
    } else if (type === 'cashback') {
        return <span className="amount cashback">+ ₹{amountWithoutSymbol}</span>;
    } else if (type === 'redeem') {
        return <span className="amount neutral">- ₹{amountWithoutSymbol}</span>;
    }
    return <span className="amount neutral">₹{amountWithoutSymbol}</span>;
};
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setTextColor(79, 70, 229);
      doc.text('Transaction History', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
      doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 38);
      
      const tableData = filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.transactionId?.slice(0, 12) || '-',
        getTransactionTypeName(t.type),
        t.merchant || t.receiver_name || t.provider || '-',
        `₹${(t.amount || 0).toLocaleString()}`,
        t.status.toUpperCase()
      ]);
      
      doc.autoTable({
        startY: 45,
        head: [['Date', 'ID', 'Type', 'To/From', 'Amount', 'Status']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      doc.save(`transactions-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully!');
      setShowExportMenu(false);
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleExportExcel = () => {
    try {
      const wsData = filteredTransactions.map(t => ({
        Date: new Date(t.date).toLocaleString(),
        'Transaction ID': t.transactionId,
        Type: getTransactionTypeName(t.type),
        'To/From': t.merchant || t.receiver_name || t.provider || '-',
        Amount: t.amount || 0,
        Status: t.status.toUpperCase(),
        Description: t.description || '-',
        Cashback: t.cashback || 0
      }));
      
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
      XLSX.writeFile(wb, `transactions-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel file downloaded successfully!');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel');
    }
  };

  const calculateGemsFromAmount = (amount) => {
  const cashback = Math.floor(amount * 0.05);
  return Math.min(cashback, 100);
};

  const copyTransactionId = (id) => {
    navigator.clipboard.writeText(id);
    toast.success('Transaction ID copied!');
  };

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearAllFilters = () => {
    setFilters({
      status: 'all',
      bank: 'all',
      dateRange: '30',
      type: 'all',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
    });
    setSearchTerm('');
    setSortBy('date');
    setSortOrder('desc');
  };

  return (
    <div className="transaction-history-page">
      {/* Header */}
      <div className="transaction-header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Transaction History</h1>
          <p className="subtitle">Track all your payments, recharges, and cashback in one place</p>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <motion.div 
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="stat-card">
          <div className="stat-icon sent">
            <FaArrowUp />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Sent</span>
            <span className="stat-value">₹{stats.totalSent.toLocaleString()}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon received">
            <FaArrowDown />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Received</span>
            <span className="stat-value">₹{stats.totalReceived.toLocaleString()}</span>
          </div>
        </div>
        <div className="stat-card">
  <div className="stat-icon cashback">
    <GemLogo size="medium" />
  </div>
  <div className="stat-info">
    <span className="stat-label">Cashback Earned</span>
    <span className="stat-value">{stats.totalCashback} <GemLogo size="small" /></span>
  </div>
</div>
        <div className="stat-card">
          <div className="stat-icon transactions">
            <FaHistory />
          </div>
          <div className="stat-info">
            <span className="stat-label">Transactions</span>
            <span className="stat-value">{stats.totalTransactions}</span>
          </div>
        </div>
      </motion.div>

      {/* Status Summary */}
      <div className="status-summary">
  <div className="status-badge success">
    <FaCheckCircle />
    <span>{stats.successfulTransactions} Successful</span>
  </div>
  <div className="status-badge pending">
    <FaClock />
    <span>{stats.pendingTransactions} Pending</span>
  </div>
  <div className="status-badge failed">
    <FaTimesCircle />
    <span>{stats.failedTransactions} Failed</span>
  </div>
</div>
      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by description, merchant, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <FaTimes />
            </button>
          )}
        </div>
        <div className="filter-actions">
          <button 
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Filters
            {Object.values(filters).some(v => v !== 'all' && v !== '30' && v !== '') && (
              <span className="filter-badge">●</span>
            )}
          </button>
          <div className="export-dropdown">
            <button className="export-btn" onClick={() => setShowExportMenu(!showExportMenu)}>
              <FaDownload /> Export
            </button>
            {showExportMenu && (
              <div className="export-menu">
                <button onClick={handleExportPDF}>📄 Export as PDF</button>
                <button onClick={handleExportExcel}>📊 Export as Excel</button>
              </div>
            )}
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
            transition={{ duration: 0.3 }}
          >
            <div className="filters-grid">
              <div className="filter-group">
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="all">All Status</option>
                  <option value="success">Successful</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Transaction Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="all">All Types</option>
                  <option value="send">Money Sent</option>
                  <option value="receive">Money Received</option>
                  <option value="bill">Bill Payment</option>
                  <option value="recharge">Mobile Recharge</option>
                  <option value="qr">QR Payment</option>
                  <option value="cashback">Cashback</option>
                  <option value="auto_pay">Auto-Pay</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Bank Account</label>
                <select
                  value={filters.bank}
                  onChange={(e) => setFilters({ ...filters, bank: e.target.value })}
                >
                  <option value="all">All Banks</option>
                  {linkedBanks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.bank_name} (xxxx{bank.account_number?.slice(-4)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last 365 days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {filters.dateRange === 'custom' && (
                <>
                  <div className="filter-group">
                    <label>From Date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    />
                  </div>
                  <div className="filter-group">
                    <label>To Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="filter-group">
                <label>Min Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                />
              </div>
              <div className="filter-group">
                <label>Max Amount (₹)</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="filter-footer">
              <button className="clear-filters" onClick={clearAllFilters}>
                Clear All Filters
              </button>
              <span className="results-count">
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort Bar */}
      <div className="sort-bar">
        <div className="sort-options">
          <span>Sort by:</span>
          <button
            className={`sort-btn ${sortBy === 'date' ? 'active' : ''}`}
            onClick={() => {
              setSortBy('date');
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
            }}
          >
            Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-btn ${sortBy === 'amount' ? 'active' : ''}`}
            onClick={() => {
              setSortBy('amount');
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
            }}
          >
            Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-btn ${sortBy === 'type' ? 'active' : ''}`}
            onClick={() => {
              setSortBy('type');
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
            }}
          >
            Type {sortBy === 'type' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="transactions-list">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your transactions...</p>
          </div>
        ) : paginatedTransactions.length > 0 ? (
          <AnimatePresence>
            {paginatedTransactions.map((txn, index) => (
              <motion.div
                key={txn.id || index}
                className="transaction-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => handleViewDetails(txn)}
              >
                <div className="transaction-icon">
                  {getTransactionIcon(txn.type)}
                </div>

                <div className="transaction-info">
                  <div className="transaction-main">
                    <h4 className="transaction-title">
                      {getTransactionTypeName(txn.type)}
                    </h4>
                    <p className="transaction-desc">
                      {txn.description || txn.merchant || txn.provider || 'Transaction'}
                    </p>
                  </div>
                  <div className="transaction-meta">
                    <span className="transaction-time">
                      <FaCalendarAlt /> {formatDate(txn.date)}
                    </span>
                    {txn.transactionId && (
                      <span className="transaction-id" title={txn.transactionId}>
                        ID: {txn.transactionId.slice(0, 12)}...
                      </span>
                    )}
                  </div>
                </div>

                <div className="transaction-amount-status">
                  <div className="transaction-amount">
                    {formatAmount(txn.amount, txn.type)}
                  </div>
                  <div className={`transaction-status ${txn.status}`}>
                    {getStatusIcon(txn.status)}
                    <span>{txn.status}</span>
                  </div>
                </div>

                {txn.bank_name && (
                  <div className="transaction-bank">
                    <FaUniversity />
                    <span>{txn.bank_name} • xxxx{txn.account_suffix || '****'}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="no-transactions">
            <FaHistory className="no-txn-icon" />
            <h3>No transactions found</h3>
            <p>Try adjusting your filters or make your first payment</p>
            <div className="no-txn-actions">
              <button className="send-money-btn" onClick={() => navigate('/send-money')}>
                <FaArrowUp /> Send Money
              </button>
              <button className="recharge-btn" onClick={() => navigate('/mobile-recharge')}>
                <FaMobile /> Mobile Recharge
              </button>
              <button className="pay-bill-btn" onClick={() => navigate('/bills')}>
                <FaBolt /> Pay Bill
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredTransactions.length > itemsPerPage && (
        <div className="pagination">
          <button
            className="page-btn prev"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <FaChevronLeft /> Previous
          </button>
          
          <div className="page-numbers">
            {(() => {
              const pages = [];
              const maxVisible = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
              let endPage = Math.min(totalPages, startPage + maxVisible - 1);
              
              if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }
              
              if (startPage > 1) {
                pages.push(
                  <button key={1} className="page-number" onClick={() => setCurrentPage(1)}>1</button>
                );
                if (startPage > 2) pages.push(<span key="dots1" className="page-dots">...</span>);
              }
              
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    className={`page-number ${currentPage === i ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i)}
                  >
                    {i}
                  </button>
                );
              }
              
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) pages.push(<span key="dots2" className="page-dots">...</span>);
                pages.push(
                  <button key={totalPages} className="page-number" onClick={() => setCurrentPage(totalPages)}>
                    {totalPages}
                  </button>
                );
              }
              
              return pages;
            })()}
          </div>

          <button
            className="page-btn next"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next <FaChevronRight />
          </button>
        </div>
      )}

      {/* Transaction Details Modal - Enhanced UI/UX */}
      <AnimatePresence>
        {showDetails && selectedTransaction && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
          >
            <motion.div 
              className="details-modal"
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title">
                  <div className="modal-icon">
                    {getTransactionIcon(selectedTransaction.type)}
                  </div>
                  <h2>Transaction Details</h2>
                </div>
                <button className="modal-close" onClick={() => setShowDetails(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body-scroll">
                {/* Status Badge */}
                <div className={`detail-status ${selectedTransaction.status}`}>
                  {getStatusIcon(selectedTransaction.status)}
                  <span>{selectedTransaction.status.toUpperCase()}</span>
                </div>

                {/* Amount Section */}
                <div className="detail-amount-section">
                  <span className="detail-amount-label">Amount</span>
                  <div className="detail-amount">
                    {formatAmount(selectedTransaction.amount, selectedTransaction.type)}
                  </div>
                </div>

                {/* Transaction Info Cards */}
                <div className="detail-grid">
                  <div className="detail-card">
                    <div className="detail-card-icon">
                      <FaReceipt />
                    </div>
                    <div className="detail-card-content">
                      <span className="detail-label">Transaction ID</span>
                      <div className="detail-value-with-copy">
                        <span className="detail-value txn-id">{selectedTransaction.transactionId}</span>
                        <button 
                          className="copy-txn-btn"
                          onClick={() => copyTransactionId(selectedTransaction.transactionId)}
                          title="Copy Transaction ID"
                        >
                          <FaCopy />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-card-icon">
                      <FaCalendarAlt />
                    </div>
                    <div className="detail-card-content">
                      <span className="detail-label">Date & Time</span>
                      <span className="detail-value">{getFullDateTime(selectedTransaction.date)}</span>
                    </div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-card-icon">
                      {selectedTransaction.type === 'send' ? <FaArrowUp /> : selectedTransaction.type === 'receive' ? <FaArrowDown /> : <FaInfoCircle />}
                    </div>
                    <div className="detail-card-content">
                      <span className="detail-label">Transaction Type</span>
                      <span className={`detail-value type-badge ${selectedTransaction.type}`}>
                        {getTransactionTypeName(selectedTransaction.type)}
                      </span>
                    </div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-card-icon">
                      <FaUniversity />
                    </div>
                    <div className="detail-card-content">
                      <span className="detail-label">Payment Method</span>
                      <span className="detail-value">
                        {selectedTransaction.payment_method || selectedTransaction.bank_name || 'UPI'}
                        {selectedTransaction.account_suffix && ` • xxxx${selectedTransaction.account_suffix}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recipient/Sender Details */}
                {(selectedTransaction.type === 'send' || selectedTransaction.type === 'bill' || 
                  selectedTransaction.type === 'recharge' || selectedTransaction.type === 'qr' || 
                  selectedTransaction.type === 'auto_pay') && (
                  <div className="detail-card full-width">
                    <div className="detail-card-icon">
                      <FaUser />
                    </div>
                    <div className="detail-card-content">
                      <span className="detail-label">Paid To</span>
                      <span className="detail-value">
                        {selectedTransaction.merchant || selectedTransaction.receiver_name || 
                         selectedTransaction.provider || selectedTransaction.receiver_vpa || 'Unknown'}
                      </span>
                      {selectedTransaction.receiver_vpa && (
                        <span className="detail-subvalue">{selectedTransaction.receiver_vpa}</span>
                      )}
                      {selectedTransaction.customer_id && (
                        <span className="detail-subvalue">Customer ID: {selectedTransaction.customer_id}</span>
                      )}
                    </div>
                  </div>
                )}

                {selectedTransaction.type === 'receive' && (
                  <div className="detail-card full-width">
                    <div className="detail-card-icon">
                      <FaUser />
                    </div>
                    <div className="detail-card-content">
                      <span className="detail-label">Received From</span>
                      <span className="detail-value">
                        {selectedTransaction.sender_name || selectedTransaction.sender_vpa || 'Unknown'}
                      </span>
                      {selectedTransaction.sender_vpa && (
                        <span className="detail-subvalue">{selectedTransaction.sender_vpa}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Cashback Details */}
                {(selectedTransaction.cashback > 0 || selectedTransaction.type === 'cashback') && (
                  <div className="detail-card cashback-card">
                    <div className="detail-card-icon">
                      <GemLogo size="medium" />
                    </div>
                    <div className="detail-card-content">
                      <span className="detail-label">SabAI Gems Earned</span>
                      <span className="detail-value cashback-value">
                        +{Math.floor(selectedTransaction.cashback || selectedTransaction.amount || 0)} <GemLogo size="small" />
                      </span>
                      <span className="detail-subvalue">5% cashback on transaction amount</span>
                    </div>
                  </div>
                )}

                {/* Description / Note */}
                {selectedTransaction.description && (
                  <div className="detail-card full-width">
                    <div className="detail-card-icon">
                      <FaFileInvoice />
                    </div>
                    <div className="detail-card-content">
                      <span className="detail-label">Description</span>
                      <span className="detail-value">{selectedTransaction.description}</span>
                    </div>
                  </div>
                )}

                {selectedTransaction.note && (
                  <div className="detail-card full-width">
                    <div className="detail-card-icon">
                      <FaInfoCircle />
                    </div>
                    <div className="detail-card-content">
                      <span className="detail-label">Note</span>
                      <span className="detail-value">{selectedTransaction.note}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowDetails(false)}>
                  Close
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    toast.success('Receipt feature coming soon');
                  }}
                >
                  <FaPrint /> Download Receipt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionHistoryPage;