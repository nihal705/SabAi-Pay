// frontend/src/pages/ReservePayPage.jsx
// COMPLETE FIXED VERSION - Connected to database properly

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * For licensing inquiries: support@sabai-pay.com
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import storageService, {
    getBankAccounts,
    getBankBalances,
    getReserveLimits,
    setReserveLimits,
    getAutoPayOrders,
    addAutoPayOrder,
    deleteAutoPayOrder,
    verifyBankPin,
    hasUpiPin,
    updateBill,
    updateBankBalance,
    updateCoinBalance,
    addTransaction,
    getTransactions,
    getCurrentUserId,
    getPaidBills,
    getBills
} from '../services/storageService';
import { 
  FaSlidersH, FaCheckCircle, FaChartLine, FaShoppingBag, FaUtensils,
  FaFilm, FaGasPump, FaPlane, FaSpinner, FaMedkit, FaGraduationCap,
  FaPaw, FaGift, FaCoffee, FaBell, FaClock, FaExclamationTriangle,
  FaTimes, FaEdit, FaTrash, FaPlus, FaRupeeSign, FaHistory, FaDownload,
  FaEye, FaEyeSlash, FaArrowUp, FaArrowDown, FaArrowLeft, FaStore, FaCar,
  FaTshirt, FaBook, FaGamepad, FaPizzaSlice, FaHamburger, FaFish, FaDumbbell,
  FaDog, FaCat, FaHome, FaTools, FaPaintRoller, FaFlask, FaTooth, FaGlasses,
  FaGem, FaHeadphones, FaMobile, FaLaptop, FaTv, FaSearch, FaUniversity,
  FaWallet, FaMoneyBillWave, FaExchangeAlt, FaRobot, FaSync, FaKey, FaLock,
  FaCalendarAlt, FaCheckDouble, FaInfoCircle, FaPlay, FaBolt, FaWifi, FaTint,
  FaFire, FaCreditCard, FaArrowRight, FaCrown, FaStar
} from 'react-icons/fa';
import { MdLocalGroceryStore, MdMovie } from 'react-icons/md';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import './ReservePayPage.css';

const calculateCashback = (amount) => {
  return Math.floor(amount * 0.05);
};

// Helper functions
const getBankLogoUrl = (bankName) => {
  const bankLogoMap = {
    'State Bank of India': 'sbi.png', 'SBI': 'sbi.png',
    'HDFC Bank': 'hdfc.png', 'HDFC': 'hdfc.png',
    'ICICI Bank': 'icici.png', 'ICICI': 'icici.png',
    'Axis Bank': 'axis.png', 'Axis': 'axis.png',
    'Bank of Baroda': 'bob.png', 'BOB': 'bob.png',
    'Punjab National Bank': 'pnb.png', 'PNB': 'pnb.png',
    'Canara Bank': 'canara.png', 'Canara': 'canara.png',
    'Union Bank of India': 'union.png', 'Union Bank': 'union.png',
    'Kotak Mahindra Bank': 'kotak.png', 'Kotak': 'kotak.png',
    'IndusInd Bank': 'indusind.png', 'IndusInd': 'indusind.png',
    'Yes Bank': 'yesbank.png', 'Yes': 'yesbank.png',
    'IDFC First Bank': 'idfc.png', 'IDFC': 'idfc.png',
    'Karnataka Bank': 'karnataka.png',
    'Indian Bank': 'indianbank.png',
    'Indian Overseas Bank': 'iob.png', 'IOB': 'iob.png',
    'Federal Bank': 'federal.png',
    'South Indian Bank': 'sib.png', 'SIB': 'sib.png'
  };
  const fileName = bankLogoMap[bankName];
  if (fileName) return `/images/banks/${fileName}`;
  return null;
};

const merchantCategories = {
  food: { name: 'Food & Restaurants', icon: FaUtensils, color: '#f59e0b' },
  groceries: { name: 'Groceries', icon: MdLocalGroceryStore, color: '#10b981' },
  shopping: { name: 'Shopping', icon: FaShoppingBag, color: '#8b5cf6' },
  electronics: { name: 'Electronics', icon: FaLaptop, color: '#2563eb' },
  entertainment: { name: 'Entertainment', icon: FaFilm, color: '#ec4899' },
  travel: { name: 'Travel', icon: FaPlane, color: '#3b82f6' },
  fuel: { name: 'Fuel', icon: FaGasPump, color: '#ef4444' },
  healthcare: { name: 'Healthcare', icon: FaMedkit, color: '#14b8a6' },
  education: { name: 'Education', icon: FaGraduationCap, color: '#f97316' },
  pets: { name: 'Pets', icon: FaPaw, color: '#a855f7' },
  universal: { name: 'Universal', icon: FaExchangeAlt, color: '#4f46e5' },
  others: { name: 'Others', icon: FaShoppingBag, color: '#6b7280' }
};

const availableMerchants = [
  { id: 'sabai-pay-lite', name: 'SabAI Pay Lite', category: 'universal', logoUrl: '/images/merchants/sabailogo.png' },
  { id: 'swiggy', name: 'Swiggy', category: 'food', logoUrl: '/images/merchants/swiggy.png' },
  { id: 'zomato', name: 'Zomato', category: 'food', logoUrl: '/images/merchants/zomato.png' },
  { id: 'zepto', name: 'Zepto', category: 'groceries', logoUrl: '/images/merchants/zepto.png' },
  { id: 'blinkit', name: 'Blinkit', category: 'groceries', logoUrl: '/images/merchants/blinkit.png' },
  { id: 'amazon', name: 'Amazon', category: 'shopping', logoUrl: '/images/merchants/amazon.png' },
  { id: 'flipkart', name: 'Flipkart', category: 'shopping', logoUrl: '/images/merchants/flipkart.png' },
  { id: 'myntra', name: 'Myntra', category: 'shopping', logoUrl: '/images/merchants/myntra.png' },
  { id: 'netmeds', name: 'NetMeds', category: 'healthcare', logoUrl: '/images/merchants/netmeds.png' },
  { id: 'pharmeasy', name: 'PharmEasy', category: 'healthcare', logoUrl: '/images/merchants/pharmeasy.png' }
];

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6', '#f97316', '#a855f7'];

// Helper function to get operator color
const getOperatorColor = (operatorId) => {
  const colors = {
    airtel: '#e31b23',
    jio: '#0f3cc9',
    vi: '#9b1fe0',
    bsnl: '#1e7b4b'
  };
  return colors[operatorId] || '#4f46e5';
};

const getOrdinalSuffix = (date) => {
  if (date > 3 && date < 21) return 'th';
  switch (date % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

// ============================================
// POPUPI STYLE SUCCESS MODAL FOR LIMIT ADDED
// ============================================
// Find the PopUpiLimitAddedModal component and update the availableLimit calculation

const PopUpiLimitAddedModal = ({ transactionData, onClose }) => {
  const [animationStage, setAnimationStage] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationStage(1), 300);
    const timer2 = setTimeout(() => setAnimationStage(2), 800);
    const timer3 = setTimeout(() => setShowDetails(true), 1300);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);
  
  // Format the available limit properly
  const formattedAvailableLimit = transactionData?.availableLimit 
    ? Number(transactionData.availableLimit).toLocaleString('en-IN', { maximumFractionDigits: 0 })
    : '0';
  
  const formattedAmount = transactionData?.amount 
    ? Number(transactionData.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })
    : '0';
  
  return (
    <motion.div 
      className="popupi-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="popupi-animation"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="popupi-content">
          <motion.div 
            className="popupi-logo"
            animate={{ 
              scale: animationStage >= 1 ? [1, 1.2, 1] : 1,
              rotate: animationStage >= 1 ? [0, 360, 0] : 0
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="logo-inner">
              <img src="/images/merchants/sabailogo.png" alt="SabAI Pay" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
            <div className="logo-ring"></div>
          </motion.div>
          
          <motion.div 
            className="popupi-check"
            initial={{ scale: 0 }}
            animate={{ scale: animationStage >= 2 ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.2 }}
          >
            <FaCheckCircle />
          </motion.div>
          
          <motion.div 
            className="popupi-text"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: animationStage >= 2 ? 0 : 20, opacity: animationStage >= 2 ? 1 : 0 }}
          >
            <h2>Limit Added Successfully!</h2>
            <p className="amount-paid">₹{formattedAmount}</p>
            <p className="to-text">for {transactionData?.merchantName}</p>
          </motion.div>
          
          {showDetails && (
            <motion.div 
              className="popupi-details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="detail-item">
                <span>From Bank</span>
                <span>{transactionData?.bankName}</span>
              </div>
              <div className="detail-item">
                <span>Transaction ID</span>
                <span className="txn-id">{transactionData?.transactionId}</span>
              </div>
              <div className="detail-item highlight">
                <span>Available to Spend</span>
                <span>₹{formattedAvailableLimit}</span>
              </div>
              <div className="detail-item">
                <span>Date & Time</span>
                <span>{new Date(transactionData?.date).toLocaleString()}</span>
              </div>
            </motion.div>
          )}
          
          <motion.div 
            className="popupi-options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <button className="popupi-btn primary" onClick={onClose}>
              <FaCheckCircle /> Done
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// POPUPI STYLE SUCCESS MODAL FOR AUTO PAY SETUP
// ============================================
const PopUpiAutoPaySetupModal = ({ orderData, onClose }) => {
  const [animationStage, setAnimationStage] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const getScheduleDisplay = () => {
    if (orderData.schedule === 'monthly') {
      const suffix = getOrdinalSuffix(orderData.dateValue);
      return `Monthly on ${orderData.dateValue}${suffix} at ${orderData.time}`;
    } else if (orderData.schedule === 'yearly') {
      const suffix = getOrdinalSuffix(orderData.dateValue);
      return `Yearly on ${monthNames[orderData.monthValue - 1]} ${orderData.dateValue}${suffix} at ${orderData.time}`;
    } else {
      return `One-time on ${new Date(orderData.oneTimeDate).toLocaleDateString()} at ${orderData.time}`;
    }
  };
  
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationStage(1), 300);
    const timer2 = setTimeout(() => setAnimationStage(2), 800);
    const timer3 = setTimeout(() => setShowDetails(true), 1300);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);
  
  const getTitle = () => {
    if (orderData.schedule === 'one-time') {
      return 'One-Time Payment Scheduled!';
    }
    return 'Auto Pay Setup Complete!';
  };
  
  return (
    <motion.div 
      className="popupi-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="popupi-animation"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="popupi-content">
          <motion.div 
            className="popupi-logo"
            animate={{ 
              scale: animationStage >= 1 ? [1, 1.2, 1] : 1,
              rotate: animationStage >= 1 ? [0, 360, 0] : 0
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="logo-inner">
              <img src="/images/merchants/sabailogo.png" alt="SabAI Pay" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
            <div className="logo-ring"></div>
          </motion.div>
          
          <motion.div 
            className="popupi-check"
            initial={{ scale: 0 }}
            animate={{ scale: animationStage >= 2 ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.2 }}
          >
            <FaCheckCircle />
          </motion.div>
          
          <motion.div 
            className="popupi-text"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: animationStage >= 2 ? 0 : 20, opacity: animationStage >= 2 ? 1 : 0 }}
          >
            <h2>{getTitle()}</h2>
            <p className="amount-paid">₹{orderData?.amount?.toLocaleString()}</p>
            <p className="to-text">for {orderData?.merchantName}</p>
          </motion.div>
          
          {showDetails && (
            <motion.div 
              className="popupi-details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="detail-item">
                <span>Schedule</span>
                <span>{getScheduleDisplay()}</span>
              </div>
              <div className="detail-item">
                <span>Bank Account</span>
                <span>{orderData?.bankName} (xxxx{orderData?.bankAccountLast4})</span>
              </div>
              <div className="detail-item highlight">
                <span>Next Payment</span>
                <span>{new Date(orderData?.nextExecution).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span>Setup Date</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
            </motion.div>
          )}
          
          <motion.div 
            className="popupi-options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <button className="popupi-btn primary" onClick={onClose}>
              <FaCheckCircle /> Done
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// POPUPI STYLE SUCCESS MODAL FOR WITHDRAWAL
// ============================================
const PopUpiWithdrawModal = ({ transactionData, onClose }) => {
  const [animationStage, setAnimationStage] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationStage(1), 300);
    const timer2 = setTimeout(() => setAnimationStage(2), 800);
    const timer3 = setTimeout(() => setShowDetails(true), 1300);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);
  
  return (
    <motion.div 
      className="popupi-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="popupi-animation"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="popupi-content">
          <motion.div 
            className="popupi-logo"
            animate={{ 
              scale: animationStage >= 1 ? [1, 1.2, 1] : 1,
              rotate: animationStage >= 1 ? [0, 360, 0] : 0
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="logo-inner">
              <img src="/images/merchants/sabailogo.png" alt="SabAI Pay" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
            <div className="logo-ring"></div>
          </motion.div>
          
          <motion.div 
            className="popupi-check"
            initial={{ scale: 0 }}
            animate={{ scale: animationStage >= 2 ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.2 }}
          >
            <FaArrowUp style={{ color: '#f59e0b' }} />
          </motion.div>
          
          <motion.div 
            className="popupi-text"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: animationStage >= 2 ? 0 : 20, opacity: animationStage >= 2 ? 1 : 0 }}
          >
            <h2>Withdrawal Successful!</h2>
            <p className="amount-paid">₹{transactionData?.amount?.toLocaleString()}</p>
            <p className="to-text">from {transactionData?.merchantName}</p>
          </motion.div>
          
          {showDetails && (
            <motion.div 
              className="popupi-details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="detail-item">
                <span>Returned to</span>
                <span>{transactionData?.banks?.length || 1} bank account(s)</span>
              </div>
              {transactionData?.banks?.map((bank, idx) => (
                <div key={idx} className="detail-item">
                  <span>• {bank.bank_name}</span>
                  <span>₹{bank.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="detail-item highlight">
                <span>Remaining Limit</span>
                <span>₹{transactionData?.remainingLimit?.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span>Date & Time</span>
                <span>{new Date(transactionData?.date).toLocaleString()}</span>
              </div>
            </motion.div>
          )}
          
          <motion.div 
            className="popupi-options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <button className="popupi-btn primary" onClick={onClose}>
              <FaCheckCircle /> Done
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// DELETE AUTO PAY CONFIRMATION MODAL COMPONENT
// ============================================
const DeleteAutoPayConfirmModal = ({ order, onConfirm, onCancel }) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const getScheduleDisplay = () => {
    if (order?.schedule === 'monthly') {
      const suffix = getOrdinalSuffix(order.dateValue);
      return `Monthly on ${order.dateValue}${suffix} at ${order.time}`;
    } else if (order?.schedule === 'yearly') {
      const suffix = getOrdinalSuffix(order.dateValue);
      return `Yearly on ${monthNames[order.monthValue - 1]} ${order.dateValue}${suffix} at ${order.time}`;
    } else if (order?.schedule === 'one-time') {
      return `One-time on ${new Date(order.oneTimeDate).toLocaleDateString()} at ${order.time}`;
    }
    return 'Unknown schedule';
  };
  
  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
      <motion.div className="delete-confirm-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
        <div className="delete-confirm-icon">
          <FaExclamationTriangle />
        </div>
        <h3>Delete Auto Pay Order</h3>
        <p>Are you sure you want to permanently delete this Auto Pay order?</p>
        
        <div className="delete-order-details">
          <div className="detail-row">
            <span>Merchant:</span>
            <strong>{order?.merchantName}</strong>
          </div>
          <div className="detail-row">
            <span>Amount:</span>
            <strong>₹{order?.amount?.toLocaleString()}</strong>
          </div>
          <div className="detail-row">
            <span>Schedule:</span>
            <span>{getScheduleDisplay()}</span>
          </div>
          <div className="detail-row">
            <span>Bank:</span>
            <span>{order?.bankName} (xxxx{order?.bankAccountLast4})</span>
          </div>
        </div>
        
        <p className="delete-warning">This action cannot be undone. The order will be permanently removed.</p>
        
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>Delete Permanently</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// AUTO PAY SETUP MODAL COMPONENT
// ============================================
const AutoPaySetupModalComponent = ({ limit, bankAccounts, balances, onConfirm, onCancel }) => {
  const [amount, setAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [schedule, setSchedule] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [time, setTime] = useState('09:00');
  const [oneTimeDate, setOneTimeDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [merchantImageError, setMerchantImageError] = useState(false);
  
  // PIN verification state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const pinInputRefs = useRef([]);
  const [showPin, setShowPin] = useState(false);
  
  const availableAmount = limit.monthly_limit - limit.current_spent;
  
  const availableDates = Array.from({ length: 28 }, (_, i) => i + 1);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const getMerchantLogoUrl = (merchantId) => {
    const logoMap = {
      'sabai-pay-lite': '/images/merchants/sabailogo.png',
      'swiggy': '/images/merchants/swiggy.png',
      'zomato': '/images/merchants/zomato.png',
      'zepto': '/images/merchants/zepto.png',
      'blinkit': '/images/merchants/blinkit.png',
      'amazon': '/images/merchants/amazon.png',
      'flipkart': '/images/merchants/flipkart.png',
      'myntra': '/images/merchants/myntra.png',
      'netmeds': '/images/merchants/netmeds.png',
      'pharmeasy': '/images/merchants/pharmeasy.png'
    };
    return logoMap[merchantId] || null;
  };
  
  const handleAmountChange = (e) => {
    let value = e.target.value;
    if (value === '') {
      setAmount('');
      return;
    }
    let numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    if (numValue > availableAmount) {
      setAmount(availableAmount.toString());
    } else if (numValue < 0) {
      setAmount('0');
    } else {
      setAmount(value);
    }
  };
  
  const handleQuickAmount = (amt) => {
    if (amt > availableAmount) {
      setAmount(availableAmount.toString());
    } else {
      setAmount(amt.toString());
    }
  };
  
  const handleProceedToPin = () => {
    if (!selectedBankId) {
      toast.error('Please select a bank account');
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amountNum > availableAmount) {
      toast.error(`Amount exceeds available limit of ₹${availableAmount.toLocaleString()}`);
      return;
    }
    
    if (schedule === 'one-time') {
      if (!oneTimeDate) {
        toast.error('Please select a date for one-time payment');
        return;
      }
      const selectedDateObj = new Date(oneTimeDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDateObj <= today) {
        toast.error('Please select a future date for one-time payment');
        return;
      }
    }
    
    const selectedBank = bankAccounts.find(b => b.id === selectedBankId);
    if (!selectedBank) {
      toast.error('Selected bank account not found');
      return;
    }
    
    setPinDigits(['', '', '', '']);
    setPinError('');
    setShowPinModal(true);
  };
  
  const handlePinChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newPin = [...pinDigits];
    newPin[index] = value || '';
    setPinDigits(newPin);
    
    if (value && index < 3) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };
  
  const handlePinKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };
  
  const calculateNextExecution = (scheduleVal, dateVal, monthVal, timeVal, oneTimeDateVal = null) => {
    const now = new Date();
    const [hours, minutes] = timeVal.split(':').map(Number);
    
    if (scheduleVal === 'one-time') {
      if (!oneTimeDateVal) return null;
      const scheduledDate = new Date(oneTimeDateVal);
      scheduledDate.setHours(hours, minutes, 0, 0);
      return scheduledDate.toISOString();
    }
    
    let nextDate = new Date();
    nextDate.setHours(hours, minutes, 0, 0);
    
    if (scheduleVal === 'monthly') {
      nextDate.setDate(dateVal);
      if (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
    } else if (scheduleVal === 'yearly') {
      nextDate.setMonth(monthVal - 1);
      nextDate.setDate(dateVal);
      if (nextDate <= now) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
    }
    
    return nextDate.toISOString();
  };
  
  const getScheduleDisplayText = () => {
    if (schedule === 'monthly') {
      const suffix = getOrdinalSuffix(selectedDate);
      return `Monthly on ${selectedDate}${suffix} at ${time}`;
    } else if (schedule === 'yearly') {
      const suffix = getOrdinalSuffix(selectedDate);
      return `Yearly on ${monthNames[selectedMonth - 1]} ${selectedDate}${suffix} at ${time}`;
    } else {
      return `One-time on ${new Date(oneTimeDate).toLocaleDateString()} at ${time}`;
    }
  };
  
  const handleConfirmPin = async () => {
    const pinString = pinDigits.join('');
    if (pinString.length !== 4) {
      setPinError('Please enter complete PIN');
      return;
    }
    
    const selectedBank = bankAccounts.find(b => b.id === selectedBankId);
    const isValid = await verifyBankPin(selectedBankId, pinString);
    
    if (!isValid) {
      setPinError('Incorrect PIN. Please try again.');
      setPinDigits(['', '', '', '']);
      pinInputRefs.current[0]?.focus();
      return;
    }
    
    setLoading(true);
    setShowPinModal(false);
    
    try {
      const amountNum = parseFloat(amount);
      
      const currentBalance = balances[selectedBankId] || 0;
      if (currentBalance < amountNum) {
        toast.error(`Insufficient balance in ${selectedBank.bank_name}. Available: ₹${currentBalance.toLocaleString()}`);
        setLoading(false);
        return;
      }
      
      // Update bank balance (deduct)
      await updateBankBalance(selectedBankId, amountNum, false);
      
      // Create transaction record
      const transactionId = `AP_SETUP_${Date.now()}`;
      await addTransaction({
        transactionId: transactionId,
        type: 'add_limit',
        amount: amountNum,
        description: `Added ₹${amountNum} to ${limit.merchant_name} Auto-Pay limit`,
        bank_name: selectedBank.bank_name,
        bank_id: selectedBankId,
        status: 'success'
      });
      
      const nextExecution = calculateNextExecution(schedule, selectedDate, selectedMonth, time, oneTimeDate);
      
      const newAutoPayOrder = {
        orderId: `AP_${Date.now()}`,
        type: 'merchant',
        merchant: limit.merchant,
        merchantName: limit.merchant_name,
        merchantCategory: limit.merchant_category,
        amount: amountNum,
        schedule: schedule,
        dateValue: selectedDate,
        monthValue: schedule === 'yearly' ? selectedMonth : null,
        time: time,
        oneTimeDate: schedule === 'one-time' ? oneTimeDate : null,
        paymentMethod: 'bank',
        bankAccountId: selectedBankId,
        bankName: selectedBank.bank_name,
        bankAccountLast4: selectedBank.account_number?.slice(-4) || '****',
        nextExecution: nextExecution,
        reminderDays: 3,
        status: 'active'
      };
      
      await addAutoPayOrder(newAutoPayOrder);
      
      onConfirm(newAutoPayOrder);
      
    } catch (error) {
      console.error('Auto Pay setup failed:', error);
      toast.error('Failed to set up Auto Pay');
    } finally {
      setLoading(false);
    }
  };
  
  const merchantLogo = getMerchantLogoUrl(limit.merchant);
  
  return (
    <>
      <div className="modal-overlay" onClick={onCancel}>
        <div className="auto-pay-setup-modal-large" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Set Up Auto Pay</h2>
            <button className="modal-close" onClick={onCancel}><FaTimes /></button>
          </div>
          
          <div className="modal-body auto-pay-modal-body">
            <div className="auto-pay-merchant-info">
              <div className="merchant-icon-small">
                {merchantLogo && !merchantImageError ? (
                  <img 
                    src={merchantLogo} 
                    alt={limit.merchant_name}
                    onError={() => setMerchantImageError(true)}
                  />
                ) : (
                  <FaStore />
                )}
              </div>
              <div>
                <h3>{limit.merchant_name}</h3>
                <p className="available-limit">Available limit: ₹{availableAmount.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="form-group">
              <label>Payment Amount (₹)</label>
              <div className="amount-input-wrapper">
                <span className="currency-symbol">₹</span>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                  className="form-input amount-input"
                  min="1"
                  max={availableAmount}
                />
              </div>
              <div className="quick-amounts">
                <button type="button" onClick={() => handleQuickAmount(100)}>₹100</button>
                <button type="button" onClick={() => handleQuickAmount(500)}>₹500</button>
                <button type="button" onClick={() => handleQuickAmount(1000)}>₹1,000</button>
                <button type="button" onClick={() => handleQuickAmount(5000)}>₹5,000</button>
                <button type="button" onClick={() => handleQuickAmount(10000)}>₹10,000</button>
                <button type="button" onClick={() => handleQuickAmount(availableAmount)}>Max</button>
              </div>
            </div>
            
            <div className="form-group">
              <label>Schedule Type</label>
              <div className="schedule-type-buttons">
                <button 
                  type="button"
                  className={`schedule-type-btn ${schedule === 'monthly' ? 'active' : ''}`}
                  onClick={() => setSchedule('monthly')}
                >
                  <FaCalendarAlt /> Monthly
                </button>
                <button 
                  type="button"
                  className={`schedule-type-btn ${schedule === 'yearly' ? 'active' : ''}`}
                  onClick={() => setSchedule('yearly')}
                >
                  <FaCalendarAlt /> Yearly
                </button>
                <button 
                  type="button"
                  className={`schedule-type-btn ${schedule === 'one-time' ? 'active' : ''}`}
                  onClick={() => setSchedule('one-time')}
                >
                  <FaClock /> One-Time
                </button>
              </div>
            </div>
            
            {schedule === 'monthly' && (
              <div className="form-row">
                <div className="form-group half">
                  <label>Date of Month</label>
                  <select 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(parseInt(e.target.value))}
                    className="form-select"
                  >
                    {availableDates.map(date => (
                      <option key={date} value={date}>
                        {date}{getOrdinalSuffix(date)} of every month
                      </option>
                    ))}
                  </select>
                  <p className="field-note">Payment on this date each month</p>
                </div>
                <div className="form-group half">
                  <label>Time</label>
                  <input 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            )}
            
            {schedule === 'yearly' && (
              <div className="form-row">
                <div className="form-group half">
                  <label>Month</label>
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="form-select"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group half">
                  <label>Date</label>
                  <select 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(parseInt(e.target.value))}
                    className="form-select"
                  >
                    {availableDates.map(date => (
                      <option key={date} value={date}>
                        {date}{getOrdinalSuffix(date)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group half">
                  <label>Time</label>
                  <input 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            )}
            
            {schedule === 'one-time' && (
              <div className="form-row">
                <div className="form-group half">
                  <label>Select Date</label>
                  <input 
                    type="date" 
                    value={oneTimeDate} 
                    onChange={(e) => setOneTimeDate(e.target.value)}
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="field-note">One-time payment on selected date</p>
                </div>
                <div className="form-group half">
                  <label>Time</label>
                  <input 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label>Bank Account for Payment</label>
              <div className="bank-accounts-scrollable">
                {bankAccounts.length === 0 ? (
                  <div className="no-banks-warning">
                    <p>⚠️ No bank accounts linked. Please add a bank account in Settings first.</p>
                  </div>
                ) : (
                  bankAccounts.map(bank => {
                    const bankLogo = getBankLogoUrl(bank.bank_name);
                    const hasError = imageErrors[`auto_pay_bank_${bank.id}`];
                    
                    return (
                      <div 
                        key={bank.id}
                        className={`bank-option-card ${selectedBankId === bank.id ? 'selected' : ''}`}
                        onClick={() => setSelectedBankId(bank.id)}
                      >
                        <div className="bank-option-icon">
                          {bankLogo && !hasError ? (
                            <img 
                              src={bankLogo} 
                              alt={bank.bank_name}
                              onError={() => setImageErrors(prev => ({ ...prev, [`auto_pay_bank_${bank.id}`]: true }))}
                            />
                          ) : (
                            <FaUniversity />
                          )}
                        </div>
                        <div className="bank-option-details">
                          <strong>{bank.bank_name}</strong>
                          <span>xxxx{bank.account_number?.slice(-4)}</span>
                        </div>
                        {selectedBankId === bank.id && <FaCheckCircle className="selected-icon" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            <div className="auto-pay-summary-card">
              <h4>Summary</h4>
              <div className="summary-row">
                <span>Merchant:</span>
                <span>{limit.merchant_name}</span>
              </div>
              <div className="summary-row">
                <span>Amount:</span>
                <span>₹{parseFloat(amount || 0).toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Schedule:</span>
                <span>{getScheduleDisplayText()}</span>
              </div>
              <div className="summary-row">
                <span>Bank Account:</span>
                <span>{bankAccounts.find(b => b.id === selectedBankId)?.bank_name || 'Not selected'}</span>
              </div>
            </div>
            
            <div className="auto-pay-info-note">
              <FaInfoCircle />
              <span>
                {schedule === 'one-time' 
                  ? 'Amount will be deducted once on the scheduled date. Ensure sufficient balance.'
                  : `Amount will be automatically deducted ${schedule === 'monthly' ? 'every month' : 'every year'} on the scheduled date. Ensure sufficient balance.`}
              </span>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button 
              className="btn-primary" 
              onClick={handleProceedToPin}
              disabled={!selectedBankId || !amount || parseFloat(amount) <= 0 || loading}
            >
              {loading ? <FaSpinner className="spinner" /> : 'Proceed to Verify'}
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showPinModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPinModal(false)}>
            <motion.div className="pin-modal-white" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setShowPinModal(false)}><FaTimes /></button>
              
              <div className="modal-bank-header">
                <div className="modal-bank-logo" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                  {(() => {
                    const selectedBank = bankAccounts.find(b => b.id === selectedBankId);
                    const bankLogo = selectedBank ? getBankLogoUrl(selectedBank.bank_name) : null;
                    if (bankLogo && !imageErrors[`pin_${selectedBankId}`]) {
                      return <img src={bankLogo} alt="bank" className="bank-logo-large" onError={() => setImageErrors(prev => ({ ...prev, [`pin_${selectedBankId}`]: true }))} />;
                    }
                    return <FaUniversity style={{ fontSize: '1.8rem', color: '#4f46e5' }} />;
                  })()}
                </div>
                <div className="modal-bank-details">
                  <h3 className="modal-bank-name-white">
                    {schedule === 'one-time' ? 'Confirm One-Time Payment' : 'Confirm Auto Pay'}
                  </h3>
                  <p className="modal-account-white">
                    Enter UPI PIN for {bankAccounts.find(b => b.id === selectedBankId)?.bank_name}
                  </p>
                </div>
              </div>
              
              <div className="pin-input-group">
                <div className="pin-inputs-row">
                  {pinDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => pinInputRefs.current[index] = el}
                      type={showPin ? 'text' : 'password'}
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(e, index)}
                      className={`pin-input-field ${digit ? 'filled' : ''}`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <label className="show-pin-checkbox">
                  <input type="checkbox" checked={showPin} onChange={() => setShowPin(!showPin)} />
                  <span>Show PIN</span>
                </label>
                {pinError && <p className="pin-error">{pinError}</p>}
              </div>
              
              <div className="modal-actions-white">
                <button className="modal-btn-white cancel" onClick={() => setShowPinModal(false)}>Cancel</button>
                <button className="modal-btn-white submit" onClick={handleConfirmPin} disabled={loading}>
                  {loading ? <FaSpinner className="spinner" /> : 'Confirm Setup'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ============================================
// AUTO PAY CARD COMPONENT
// ============================================
const AutoPayCard = ({ order, onCancel, onDelete, onResume, getMerchantLogoUrl }) => {
  const [merchantImageError, setMerchantImageError] = useState(false);
  const merchantLogoUrl = getMerchantLogoUrl(order.merchant);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const getOrdinalSuffix = (date) => {
    if (date > 3 && date < 21) return 'th';
    switch (date % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  const getScheduleDisplay = () => {
    if (order.schedule === 'monthly') {
      const dateValue = order.dateValue || order.date_value;
      const timeValue = order.time || order.time_value || '09:00';
      const suffix = getOrdinalSuffix(dateValue);
      return `Monthly on ${dateValue}${suffix} at ${timeValue}`;
    } else if (order.schedule === 'yearly') {
      const dateValue = order.dateValue || order.date_value;
      const monthValue = order.monthValue || order.month_value;
      const timeValue = order.time || order.time_value || '09:00';
      const suffix = getOrdinalSuffix(dateValue);
      return `Yearly on ${monthNames[monthValue - 1]} ${dateValue}${suffix} at ${timeValue}`;
    } else if (order.schedule === 'one-time') {
      const oneTimeDate = order.oneTimeDate || order.one_time_date;
      const timeValue = order.time || order.time_value || '09:00';
      return `One-time on ${new Date(oneTimeDate).toLocaleDateString()} at ${timeValue}`;
    }
    return 'Unknown schedule';
  };
  
  const getNextExecutionDisplay = () => {
    if (!order.nextExecution) return 'N/A';
    const nextDate = new Date(order.nextExecution);
    if (isNaN(nextDate.getTime())) return 'N/A';
    if (order.schedule === 'one-time') {
      return `Scheduled for ${nextDate.toLocaleString()}`;
    }
    return nextDate.toLocaleDateString();
  };
  
  const getScheduleIcon = () => {
    if (order.schedule === 'monthly') return <FaCalendarAlt />;
    if (order.schedule === 'yearly') return <FaCalendarAlt />;
    return <FaClock />;
  };
  
  return (
    <div className={`auto-pay-card-compact ${order.status !== 'active' ? 'inactive' : ''}`}>
      <div className="auto-pay-card-header">
        <div className="auto-pay-merchant-icon-compact">
          {merchantLogoUrl && !merchantImageError ? (
            <img 
              src={merchantLogoUrl} 
              alt={order.merchantName}
              onError={() => setMerchantImageError(true)}
            />
          ) : (
            <FaStore />
          )}
        </div>
        <div className="auto-pay-card-info">
          <h4>{order.merchantName}</h4>
          <div className="schedule-type-badge">
            {getScheduleIcon()}
            <span>{order.schedule === 'monthly' ? 'Monthly' : order.schedule === 'yearly' ? 'Yearly' : 'One-Time'}</span>
          </div>
        </div>
        <div className="auto-pay-card-actions">
          {order.status === 'active' ? (
            <>
              <button 
                className="icon-btn-small cancel" 
                onClick={() => onCancel(order.id)}
                title="Cancel Auto Pay"
              >
                <FaTimes />
              </button>
              <button 
                className="icon-btn-small delete" 
                onClick={() => onDelete(order.id)}
                title="Delete Order"
              >
                <FaTrash />
              </button>
            </>
          ) : (
            <>
              <button 
                className="icon-btn-small resume" 
                onClick={() => onResume(order.id)}
                title="Resume Auto Pay"
              >
                <FaPlay />
              </button>
              <button 
                className="icon-btn-small delete" 
                onClick={() => onDelete(order.id)}
                title="Delete Order"
              >
                <FaTrash />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="auto-pay-card-details">
        <div className="detail-row-compact">
          <span>Amount:</span>
          <strong>₹{order.amount?.toLocaleString()}</strong>
        </div>
        <div className="detail-row-compact">
          <span>Schedule:</span>
          <span>{getScheduleDisplay()}</span>
        </div>
        <div className="detail-row-compact">
          <span>Bank:</span>
          <span>{order.bankName} (xxxx{order.bankAccountLast4})</span>
        </div>
        <div className="detail-row-compact">
          <span>{order.schedule === 'one-time' ? 'Scheduled:' : 'Next:'}</span>
          <span>{getNextExecutionDisplay()}</span>
        </div>
      </div>
      
      {order.executionHistory && order.executionHistory.length > 0 && (
        <div className="execution-history-compact">
          <span className="history-label">Last: {new Date(order.executionHistory[order.executionHistory.length - 1]?.date).toLocaleDateString()}</span>
          <span className={`history-status ${order.executionHistory[order.executionHistory.length - 1]?.status}`}>
            {order.executionHistory[order.executionHistory.length - 1]?.status === 'success' ? '✅' : '❌'}
          </span>
        </div>
      )}
    </div>
  );
};

const checkReservePayAvailability = async (merchant, amount) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            'http://localhost:5000/api/agent/order/check-reserve',
            { merchant, amount },
            { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        
        if (response.data && response.data.success) {
            return {
                available: response.data.data.eligible,
                eligible: response.data.data.eligible,
                limit: response.data.data.limit,
                spent: response.data.data.spent,
                remaining: response.data.data.remaining,
                message: response.data.data.message
            };
        }
        return { available: false, eligible: false, limit: 0, spent: 0, remaining: 0 };
    } catch (error) {
        console.error('Reserve check error:', error);
        return { available: false, eligible: false, limit: 0, spent: 0, remaining: 0 };
    }
};

// ============================================
// MAIN RESERVE PAY PAGE COMPONENT
// ============================================
const ReservePayPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [imageErrors, setImageErrors] = useState({});
  const pinInputRefs = useRef([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('limits');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState('month');
  
  // Data State
  const [limits, setLimits] = useState([]);
  const [autoPayOrders, setAutoPayOrders] = useState([]);
  const [autoPayBills, setAutoPayBills] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [analyticsData, setAnalyticsData] = useState({
    summary: {}, transactions: [], byCategory: [], byMerchant: [], trends: [], insights: []
  });
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBankSelectionModal, setShowBankSelectionModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPopUpiSuccessModal, setShowPopUpiSuccessModal] = useState(false);
  const [popUpiData, setPopUpiData] = useState(null);
  const [popUpiType, setPopUpiType] = useState(null);
  const [selectedLimit, setSelectedLimit] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // Auto Pay Modal States
  const [showAutoPayModal, setShowAutoPayModal] = useState(false);
  const [selectedAutoPayLimit, setSelectedAutoPayLimit] = useState(null);
  const [rechargeAutoPayOrders, setRechargeAutoPayOrders] = useState([])
  
  // Delete Auto Pay Confirmation Modal States
  const [showDeleteAutoPayConfirm, setShowDeleteAutoPayConfirm] = useState(false);
  const [autoPayOrderToDelete, setAutoPayOrderToDelete] = useState(null);
  
  // PIN Verification State
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [pinAction, setPinAction] = useState(null);
  const [pendingAddData, setPendingAddData] = useState(null);
  const [showPin, setShowPin] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    merchant: '', merchant_category: '', merchant_name: '', monthly_limit: '',
    per_transaction_limit: '', requires_approval: false, is_active: true, bank_account_id: null
  });
  const [errors, setErrors] = useState({});

  const filteredMerchants = availableMerchants.filter(merchant =>
    merchant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedFilteredMerchants = filteredMerchants.reduce((acc, merchant) => {
    if (!acc[merchant.category]) acc[merchant.category] = [];
    acc[merchant.category].push(merchant);
    return acc;
  }, {});

  useEffect(() => {
    // Listen for bill deletion events
    const handleBillDeleted = (event) => {
        console.log('Bill deleted, refreshing auto-pay orders:', event.detail);
        loadAutoPayOrdersData();
        loadAutoPayBillsData();
    };
    
    window.addEventListener('billDeleted', handleBillDeleted);
    
    return () => {
        window.removeEventListener('billDeleted', handleBillDeleted);
    };
}, []);

useEffect(() => {
    const handleStorageChange = (e) => {
        if (e.key === 'autoPayOrders' || e.key === 'autoPayBills' || e.key === 'bills') {
            console.log('Storage changed, refreshing auto-pay data');
            loadAutoPayOrdersData();
            loadAutoPayBillsData();
        }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
}, []);

  // ============================================
  // LOAD DATA FUNCTIONS - USING DATABASE
  // ============================================

  const loadBankAccounts = async () => {
    const accounts = await getBankAccounts();
    setBankAccounts(accounts);
  };

  const loadBalances = async () => {
    const balancesMap = await getBankBalances();
    setBalances(balancesMap);
  };

  const loadLimits = async () => {
    const savedLimits = await getReserveLimits();
    const limitsWithContributions = savedLimits.map(limit => ({
      ...limit,
      contributions: limit.contributions || []
    }));
    setLimits(limitsWithContributions);
  };

  const loadAutoPayOrdersData = async () => {
    try {
        const savedOrders = await getAutoPayOrders();
        console.log('All auto-pay orders:', savedOrders);
        
        const updatedOrders = savedOrders.map(order => {
            if (order.status === 'active' && order.nextExecution) {
                const nextDate = new Date(order.nextExecution);
                if (nextDate <= new Date()) {
                    return { ...order, status: 'pending_execution' };
                }
            }
            return order;
        });
        
        // Separate orders by type - use isRecharge and isBillPayment flags
        const regularOrders = updatedOrders.filter(order => 
            !order.isBillPayment && !order.isRecharge
        );
        const billOrders = updatedOrders.filter(order => order.isBillPayment === true);
        const rechargeOrders = updatedOrders.filter(order => order.isRecharge === true);
        
        console.log('Regular orders:', regularOrders.length);
        console.log('Bill orders:', billOrders.length);
        console.log('Recharge orders:', rechargeOrders.length);
        
        setAutoPayOrders(regularOrders);
        setAutoPayBills(billOrders);
        setRechargeAutoPayOrders(rechargeOrders);
    } catch (error) {
        console.error('Failed to load auto-pay orders:', error);
        setAutoPayOrders([]);
        setAutoPayBills([]);
        setRechargeAutoPayOrders([]);
    }
};

// Then add this function as an alias if needed:
const loadAutoPayBillsData = () => {
    // This function is already handled by loadAutoPayOrdersData
    // Just call loadAutoPayOrdersData to refresh both
    loadAutoPayOrdersData();
};

  const loadAnalytics = async () => {
    const allTransactions = await getTransactions();
    
    const reserveTransactions = allTransactions.filter(t => 
      t.type === 'reserve_pay' || 
      t.type === 'add_limit' || 
      t.type === 'withdraw_limit' ||
      t.type === 'auto_pay_execution'
    );
    
    const now = new Date();
    const filtered = reserveTransactions.filter(t => {
      const txnDate = new Date(t.created_at || t.date);
      const diffDays = Math.floor((now - txnDate) / (1000 * 60 * 60 * 24));
      if (timeframe === 'week') return diffDays <= 7;
      if (timeframe === 'month') return diffDays <= 30;
      if (timeframe === 'quarter') return diffDays <= 90;
      if (timeframe === 'year') return diffDays <= 365;
      return true;
    });

    filtered.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

    const spendingTransactions = filtered.filter(t => t.type === 'reserve_pay');
    const totalSpent = spendingTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalTransactions = filtered.length;
    const totalAdded = filtered.filter(t => t.type === 'add_limit').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalWithdrawn = filtered.filter(t => t.type === 'withdraw_limit').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalAutoPay = filtered.filter(t => t.type === 'auto_pay_execution').reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const categoryMap = new Map();
    filtered.forEach(t => {
      const category = t.merchant_category || 'others';
      const amount = t.amount || 0;
      const current = categoryMap.get(category) || { category, total: 0, count: 0 };
      categoryMap.set(category, { category, total: current.total + amount, count: current.count + 1 });
    });
    
    const byCategory = Array.from(categoryMap.values())
      .map(c => ({ ...c, average: c.total / c.count, percentage: totalSpent ? (c.total / totalSpent) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);

    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : timeframe === 'quarter' ? 90 : 365;
    const dateMap = new Map();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      dateMap.set(dateStr, { amount: 0, transactions: 0, fullDate: new Date(date) });
    }
    
    filtered.forEach(t => {
      const txnDate = new Date(t.created_at || t.date);
      const dateStr = txnDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const amount = t.amount || 0;
      if (dateMap.has(dateStr)) {
        const existing = dateMap.get(dateStr);
        existing.amount += amount;
        existing.transactions += 1;
      }
    });
    
    const sortedDates = Array.from(dateMap.entries()).sort((a, b) => a[1].fullDate - b[1].fullDate);
    const trends = sortedDates.map(([dateStr, data]) => ({ date: dateStr, amount: data.amount, transactions: data.transactions }));

    setAnalyticsData({
      summary: { totalSpent, totalTransactions, totalAdded, totalWithdrawn, totalAutoPay },
      transactions: filtered.slice(0, 50),
      byCategory,
      trends,
      insights: []
    });
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const getAvailableReserveLimit = (limit) => {
    if (!limit) return 0;
    return limit.monthly_limit - (limit.current_spent || 0);
  };

  // ============================================
  // LIMIT HANDLERS
  // ============================================

  const handleAddLimitClick = () => {
    if (bankAccounts.length === 0) {
        toast.error('Please add a bank account first in Settings → UPI & Bank Accounts');
        return;
    }
    // Reset form first
    setFormData({
        merchant: '', merchant_category: '', merchant_name: '', monthly_limit: '',
        per_transaction_limit: '', requires_approval: false, is_active: true, bank_account_id: null
    });
    setSearchTerm('');
    setErrors({});
    setShowBankSelectionModal(true);
};

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setFormData(prev => ({ ...prev, bank_account_id: bank.id }));
    setShowBankSelectionModal(false);
    setShowAddModal(true);
  };

  const handleMerchantSelect = (merchant) => {
    setFormData(prev => ({
      ...prev,
      merchant: merchant.id,
      merchant_category: merchant.category,
      merchant_name: merchant.name
    }));
    setSearchTerm('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.merchant) newErrors.merchant = 'Please select a merchant';
    if (!formData.monthly_limit) {
      newErrors.monthly_limit = 'Monthly limit is required';
    } else if (isNaN(formData.monthly_limit) || formData.monthly_limit < 100) {
      newErrors.monthly_limit = 'Monthly limit must be at least ₹100';
    }
    if (formData.per_transaction_limit) {
      if (isNaN(formData.per_transaction_limit) || formData.per_transaction_limit < 1) {
        newErrors.per_transaction_limit = 'Per transaction limit must be at least ₹1';
      } else if (formData.per_transaction_limit > formData.monthly_limit) {
        newErrors.per_transaction_limit = 'Per transaction limit cannot exceed monthly limit';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const initiateAddLimit = () => {
    if (!validateForm()) return;
    
    const amount = parseFloat(formData.monthly_limit);
    const currentBalance = balances[formData.bank_account_id] || 0;
    
    if (currentBalance < amount) {
        toast.error(`Insufficient balance in ${selectedBank?.bank_name}. Available: ₹${currentBalance.toLocaleString()}`);
        return;
    }
    
    // Make sure selectedBank is set
    if (!selectedBank) {
        toast.error('No bank selected');
        return;
    }
    
    console.log('Initiating add limit:', { amount, selectedBank, formData });
    
    setPendingAddData({
        amount: amount,
        formData: { ...formData },
        selectedBank: selectedBank
    });
    setPinAction('add');
    setPinDigits(['', '', '', '']);
    setPinError('');
    setShowPinModal(true);
    setShowAddModal(false);
};

// Replace the executeAddLimit function in ReservePayPage.jsx

// Replace the executeAddLimit function with this fixed version:

const executeAddLimit = async () => {
    if (!pendingAddData) {
        toast.error('No pending data found');
        setLoading(false);
        return;
    }
    
    const { amount, formData: pendingFormData, selectedBank: pendingBank } = pendingAddData;
    
    try {
        // Ensure amount is a number
        const addAmount = Number(amount);
        console.log('Executing add limit:', { addAmount, pendingFormData, pendingBank });
        
        // Check balance again
        const currentBalance = balances[pendingFormData.bank_account_id] || 0;
        if (currentBalance < addAmount) {
            toast.error(`Insufficient balance in ${pendingBank?.bank_name}. Available: ₹${currentBalance.toLocaleString()}`);
            setLoading(false);
            setPendingAddData(null);
            setPinAction(null);
            return;
        }
        
        // Update bank balance (deduct)
        await updateBankBalance(pendingFormData.bank_account_id, addAmount, false);
        console.log('Bank balance updated');
        
        // Get existing limits
        let existingLimits = await getReserveLimits();
        console.log('Existing limits count:', existingLimits.length);
        
        const existingLimitIndex = existingLimits.findIndex(l => l.merchant === pendingFormData.merchant);
        
        let updatedLimits;
        let newTotalLimit = addAmount;
        
        if (existingLimitIndex !== -1) {
            const existingLimit = existingLimits[existingLimitIndex];
            let existingContributions = existingLimit.contributions || [];
            
            // Convert existing monthly_limit to number
            const existingMonthlyLimit = Number(existingLimit.monthly_limit) || 0;
            newTotalLimit = existingMonthlyLimit + addAmount;
            
            console.log('Existing monthly limit:', existingMonthlyLimit);
            console.log('Adding amount:', addAmount);
            console.log('New total limit:', newTotalLimit);
            
            // Find if this bank already contributed
            const existingContributionIndex = existingContributions.findIndex(c => c.bank_account_id === pendingFormData.bank_account_id);
            
            let updatedContributions;
            if (existingContributionIndex !== -1) {
                // Update existing contribution
                updatedContributions = [...existingContributions];
                const existingContributionAmount = Number(updatedContributions[existingContributionIndex].amount) || 0;
                updatedContributions[existingContributionIndex] = {
                    ...updatedContributions[existingContributionIndex],
                    amount: existingContributionAmount + addAmount
                };
            } else {
                // Add new contribution
                updatedContributions = [...existingContributions, {
                    bank_account_id: pendingFormData.bank_account_id,
                    bank_name: pendingBank.bank_name,
                    amount: addAmount,
                    added_at: new Date().toISOString()
                }];
            }
            
            updatedLimits = [...existingLimits];
            updatedLimits[existingLimitIndex] = {
                ...existingLimit,
                monthly_limit: newTotalLimit,
                per_transaction_limit: pendingFormData.per_transaction_limit ? Number(pendingFormData.per_transaction_limit) : existingLimit.per_transaction_limit,
                contributions: updatedContributions,
                updated_at: new Date().toISOString()
            };
            
            console.log('Updated existing limit, new total:', newTotalLimit);
        } else {
            // Create new limit
            newTotalLimit = addAmount;
            const newLimit = {
                id: Date.now(),
                merchant: pendingFormData.merchant,
                merchant_name: pendingFormData.merchant_name,
                merchant_category: pendingFormData.merchant_category,
                monthly_limit: addAmount,
                current_spent: 0,
                per_transaction_limit: pendingFormData.per_transaction_limit ? Number(pendingFormData.per_transaction_limit) : null,
                requires_approval: pendingFormData.requires_approval || false,
                is_active: true,
                contributions: [{
                    bank_account_id: pendingFormData.bank_account_id,
                    bank_name: pendingBank.bank_name,
                    amount: addAmount,
                    added_at: new Date().toISOString()
                }],
                created_at: new Date().toISOString()
            };
            updatedLimits = [...existingLimits, newLimit];
        }
        
        console.log('Saving updated limits...');
        await setReserveLimits(updatedLimits);
        
        // Save transaction
        const transactionId = `RPL_ADD_${Date.now()}`;
        await addTransaction({
            transactionId: transactionId,
            type: 'add_limit',
            amount: addAmount,
            description: `Added ₹${addAmount} to ${pendingFormData.merchant_name} limit from ${pendingBank.bank_name}`,
            bank_name: pendingBank.bank_name,
            bank_id: pendingFormData.bank_account_id,
            status: 'success'
        });
        
        // Refresh data
        await loadLimits();
        await loadBalances();
        await loadAnalytics();
        
        // Show success modal
        setPopUpiType('limit_added');
        setPopUpiData({
            amount: addAmount,
            merchantName: pendingFormData.merchant_name,
            bankName: pendingBank.bank_name,
            availableLimit: newTotalLimit,
            transactionId: transactionId,
            date: new Date()
        });
        setShowPopUpiSuccessModal(true);
        
        // Reset states
        resetForm();
        setSelectedBank(null);
        setPendingAddData(null);
        setPinAction(null);
        
        toast.success(`₹${addAmount.toLocaleString()} limit added for ${pendingFormData.merchant_name}`);
        
    } catch (error) {
        console.error('Failed to add limit:', error);
        toast.error(error.message || 'Failed to add limit');
    } finally {
        setLoading(false);
    }
};

  const handleEdit = (limit) => {
    setSelectedLimit(limit);
    setFormData({
      merchant: limit.merchant,
      merchant_category: limit.merchant_category,
      merchant_name: limit.merchant_name,
      monthly_limit: limit.monthly_limit.toString(),
      per_transaction_limit: limit.per_transaction_limit ? limit.per_transaction_limit.toString() : '',
      requires_approval: limit.requires_approval || false,
      is_active: limit.is_active,
      bank_account_id: limit.bank_account_id
    });
    setShowEditModal(true);
  };

  const handleUpdateLimit = async () => {
    if (!validateForm() || !selectedLimit) return;

    try {
      setLoading(true);
      
      const updatedLimits = limits.map(l => 
        l.id === selectedLimit.id ? { 
          ...l, 
          merchant: formData.merchant,
          merchant_category: formData.merchant_category,
          merchant_name: formData.merchant_name,
          per_transaction_limit: formData.per_transaction_limit ? parseFloat(formData.per_transaction_limit) : null,
          requires_approval: formData.requires_approval,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        } : l
      );
      
      await setReserveLimits(updatedLimits);
      
      setShowEditModal(false);
      resetForm();
      await loadLimits();
      await loadAnalytics();
      
      toast.success('Limit updated successfully');
      
    } catch (error) {
      console.error('Failed to update limit:', error);
      toast.error('Failed to update limit');
    } finally {
      setLoading(false);
    }
  };

  // In ReservePayPage.jsx, update the handleWithdrawLimit function:

const handleWithdrawLimit = (limit) => {
    const availableToWithdraw = getAvailableReserveLimit(limit);
    if (availableToWithdraw <= 0) {
        toast.error('No unused amount to withdraw');
        return;
    }
    
    const contributions = limit.contributions || [];
    console.log('Withdraw - Contributions:', contributions);
    
    if (contributions.length === 0) {
        toast.error('No bank account found for this limit. Please contact support.');
        return;
    }
    
    setSelectedLimit(limit);
    setWithdrawAmount('');
    setShowWithdrawModal(true);
};

  // Replace the initiateWithdraw function

const initiateWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
    }
    
    const limit = selectedLimit;
    const availableInLimit = getAvailableReserveLimit(limit);
    
    if (amount > availableInLimit) {
        toast.error(`Cannot withdraw more than ₹${availableInLimit.toLocaleString()} (unused amount)`);
        return;
    }
    
    const contributions = limit.contributions || [];
    console.log('Contributions for withdraw:', contributions);
    
    if (contributions.length === 0) {
        toast.error('No bank account found for this limit. Please contact support.');
        return;
    }
    
    // Get the first contribution (FIFO order)
    const firstContribution = contributions[0];
    
    // Find the bank account by ID
    const bank = bankAccounts.find(b => b.id === firstContribution.bank_account_id);
    
    if (!bank) {
        console.error('Bank not found for contribution:', firstContribution);
        toast.error(`Bank account not found. Available banks: ${bankAccounts.map(b => `${b.id}:${b.bank_name}`).join(', ')}`);
        return;
    }
    
    console.log('Found bank for withdraw:', bank);
    
    setSelectedBank(bank);
    setPendingAddData({
        amount: amount,
        limit: limit,
        bank: bank
    });
    setPinAction('withdraw');
    setPinDigits(['', '', '', '']);
    setPinError('');
    setShowPinModal(true);
    setShowWithdrawModal(false);
};

  // Replace the executeWithdraw function

// Update the executeWithdraw function similarly:

const executeWithdraw = async () => {
    const { amount, limit, bank } = pendingAddData;
    
    setLoading(true);
    
    try {
        const withdrawAmount = Number(amount);
        console.log('Executing withdraw:', { withdrawAmount, limit, bank });
        
        // Return money to bank account
        await updateBankBalance(bank.id, withdrawAmount, true);
        
        // Update limit contributions (FIFO order)
        const contributions = [...(limit.contributions || [])];
        let remainingToWithdraw = withdrawAmount;
        const updatedContributions = [];
        const returnedToBanks = [];
        
        for (const contribution of contributions) {
            if (remainingToWithdraw <= 0) {
                updatedContributions.push(contribution);
                continue;
            }
            
            const availableFromThisBank = Number(contribution.amount) || 0;
            if (availableFromThisBank <= remainingToWithdraw) {
                remainingToWithdraw -= availableFromThisBank;
                returnedToBanks.push({
                    bank_account_id: contribution.bank_account_id,
                    bank_name: contribution.bank_name,
                    amount: availableFromThisBank
                });
                // Don't add this contribution back - it's fully withdrawn
            } else {
                const remainingInThisBank = availableFromThisBank - remainingToWithdraw;
                updatedContributions.push({
                    ...contribution,
                    amount: remainingInThisBank
                });
                returnedToBanks.push({
                    bank_account_id: contribution.bank_account_id,
                    bank_name: contribution.bank_name,
                    amount: remainingToWithdraw
                });
                remainingToWithdraw = 0;
            }
        }
        
        if (remainingToWithdraw > 0) {
            toast.error(`Cannot withdraw more than available. Available: ₹${(limit.monthly_limit - limit.current_spent).toLocaleString()}`);
            setLoading(false);
            return;
        }
        
        // Update the limit - convert monthly_limit to number
        const currentMonthlyLimit = Number(limit.monthly_limit) || 0;
        const updatedLimits = limits.map(l => 
            l.id === limit.id ? {
                ...l,
                monthly_limit: currentMonthlyLimit - withdrawAmount,
                contributions: updatedContributions,
                updated_at: new Date().toISOString()
            } : l
        );
        
        await setReserveLimits(updatedLimits);
        
        // Save transactions for each returned amount
        for (const returned of returnedToBanks) {
            await addTransaction({
                transactionId: `RPL_WITHDRAW_${Date.now()}_${returned.bank_account_id}`,
                type: 'withdraw_limit',
                amount: returned.amount,
                description: `Withdrew ₹${returned.amount} from ${limit.merchant_name} limit (returned to ${returned.bank_name})`,
                bank_name: returned.bank_name,
                bank_id: returned.bank_account_id,
                status: 'success'
            });
        }
        
        const totalReturned = returnedToBanks.reduce((sum, r) => sum + r.amount, 0);
        const remainingLimit = currentMonthlyLimit - withdrawAmount;
        
        setPopUpiType('withdraw');
        setPopUpiData({
            amount: totalReturned,
            merchantName: limit.merchant_name,
            banks: returnedToBanks,
            remainingLimit: remainingLimit,
            date: new Date()
        });
        setShowPopUpiSuccessModal(true);
        
        setShowPinModal(false);
        setSelectedLimit(null);
        setWithdrawAmount('');
        setPendingAddData(null);
        setPinAction(null);
        
        await loadLimits();
        await loadBalances();
        await loadAnalytics();
        
        toast.success(`₹${totalReturned.toLocaleString()} withdrawn from ${limit.merchant_name}`);
        
    } catch (error) {
        console.error('Failed to withdraw:', error);
        toast.error('Failed to withdraw: ' + error.message);
    } finally {
        setLoading(false);
    }
};

  const handleDeleteLimit = async () => {
    if (!selectedLimit) return;
    
    setLoading(true);
    
    try {
        console.log('Deleting limit:', selectedLimit);
        
        const unusedAmount = getAvailableReserveLimit(selectedLimit);
        const contributions = selectedLimit.contributions || [];
        
        console.log('Unused amount:', unusedAmount);
        console.log('Contributions to return:', contributions);
        
        // Return unused amount to bank accounts in FIFO order
        if (unusedAmount > 0 && contributions.length > 0) {
            let remainingToReturn = unusedAmount;
            
            for (const contribution of contributions) {
                if (remainingToReturn <= 0) break;
                
                const contributionAmount = Number(contribution.amount) || 0;
                const amountToReturn = Math.min(contributionAmount, remainingToReturn);
                
                console.log(`Returning ₹${amountToReturn} to ${contribution.bank_name} (account: ${contribution.bank_account_id})`);
                
                // Return money to bank account
                await updateBankBalance(contribution.bank_account_id, amountToReturn, true);
                
                remainingToReturn -= amountToReturn;
            }
        }
        
        // IMPORTANT: Remove the limit from the database by calling delete API
        // First, get current limits
        let currentLimits = await getReserveLimits();
        
        // Filter out the limit to delete
        const updatedLimits = currentLimits.filter(l => l.id !== selectedLimit.id);
        
        // Save the updated list back to database
        await setReserveLimits(updatedLimits);
        
        // Also call the delete API endpoint directly to ensure it's removed
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/reserve/limits/${selectedLimit.merchant}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            console.log('Limit deleted via API');
        } catch (apiError) {
            console.error('API delete failed, but continuing:', apiError);
        }
        
        setShowDeleteConfirm(false);
        setSelectedLimit(null);
        
        // Refresh data
        await loadLimits();
        await loadBalances();
        
        toast.success(`Limit for ${selectedLimit.merchant_name} deleted successfully`);
        
    } catch (error) {
        console.error('Failed to delete limit:', error);
        toast.error('Failed to delete limit: ' + error.message);
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    if (autoPayBills.length > 0) {
        console.log('autoPayBills data structure:', autoPayBills.map(b => ({ 
            id: b.id, 
            order_id: b.order_id, 
            bill_id: b.bill_id,
            provider: b.provider,
            amount: b.amount
        })));
    }
}, [autoPayBills]);

  const calculateNextExecution = (schedule, dateValue, monthValue, time, oneTimeDate) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    if (schedule === 'one-time') {
        if (!oneTimeDate) return null;
        const scheduledDate = new Date(oneTimeDate);
        scheduledDate.setHours(hours, minutes, 0, 0);
        return scheduledDate.toISOString();
    }
    
    let nextDate = new Date();
    nextDate.setHours(hours, minutes, 0, 0);
    
    if (schedule === 'monthly') {
        nextDate.setDate(dateValue);
        if (nextDate <= now) {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
    } else if (schedule === 'yearly') {
        nextDate.setMonth(monthValue - 1);
        nextDate.setDate(dateValue);
        if (nextDate <= now) {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
    }
    
    return nextDate.toISOString();
};

const cancelDeleteAutoPayOrder = () => {
    setShowDeleteAutoPayConfirm(false);
    setAutoPayOrderToDelete(null);
};

// Also add this function if missing
const deleteAutoPayOrderById = async (orderId) => {
    try {
        await deleteAutoPayOrder(orderId);
        const updatedOrders = autoPayOrders.filter(o => o.id !== orderId);
        setAutoPayOrders(updatedOrders);
        toast.success('Auto Pay order deleted');
    } catch (error) {
        console.error('Failed to delete auto pay order:', error);
        toast.error('Failed to delete order');
    }
};

  const handleToggleActive = async (limit) => {
    const updated = limits.map(l =>
      l.id === limit.id ? { ...l, is_active: !l.is_active } : l
    );
    await setReserveLimits(updated);
    setLimits(updated);
    toast.success(`${limit.merchant_name} is now ${!limit.is_active ? 'active' : 'inactive'}`);
  };

  // ============================================
  // AUTO PAY FUNCTIONS
  // ============================================

  const handleSetupAutoPay = (limit) => {
    if (bankAccounts.length === 0) {
      toast.error('Please add a bank account first in Settings → UPI & Bank Accounts');
      return;
    }
    setSelectedAutoPayLimit(limit);
    setShowAutoPayModal(true);
  };

  const handleAutoPayConfirm = async (newAutoPayOrder) => {
    const updatedOrders = [...autoPayOrders, newAutoPayOrder];
    setAutoPayOrders(updatedOrders);
    
    setShowAutoPayModal(false);
    setSelectedAutoPayLimit(null);
    
    setPopUpiType('auto_pay_setup');
    setPopUpiData(newAutoPayOrder);
    setShowPopUpiSuccessModal(true);
    
    await loadAnalytics();
    toast.success(`Auto Pay set up for ${newAutoPayOrder.merchantName}`);
  };
  
  const cancelAutoPay = async (orderId) => {
    const updatedOrders = autoPayOrders.map(o => 
      o.id === orderId ? { ...o, status: 'cancelled', cancelledAt: new Date().toISOString() } : o
    );
    setAutoPayOrders(updatedOrders);
    toast.success('Auto Pay cancelled');
  };

  const deleteAutoPayOrder = (orderId) => {
    const order = autoPayOrders.find(o => o.id === orderId);
    setAutoPayOrderToDelete(order);
    setShowDeleteAutoPayConfirm(true);
  };

  const confirmDeleteAutoPayOrder = async () => {
    if (autoPayOrderToDelete) {
        try {
            console.log('Deleting auto-pay order:', autoPayOrderToDelete.id);
            await deleteAutoPayOrder(autoPayOrderToDelete.id);
            
            // Refresh all orders
            await loadAutoPayOrdersData();
            
            setShowDeleteAutoPayConfirm(false);
            setAutoPayOrderToDelete(null);
            toast.success('Auto Pay order deleted');
            
            // Dispatch event to refresh other components
            window.dispatchEvent(new CustomEvent('rechargeAutoPayUpdated'));
        } catch (error) {
            console.error('Failed to delete auto pay order:', error);
            toast.error('Failed to delete order');
        }
    }
};

  const resumeAutoPay = async (orderId) => {
    const order = autoPayOrders.find(o => o.id === orderId);
    if (order) {
        const updatedOrders = autoPayOrders.map(o => 
            o.id === orderId ? { 
                ...o, 
                status: 'active',
                nextExecution: calculateNextExecution(o.schedule, o.dateValue, o.monthValue, o.time, o.oneTimeDate)
            } : o
        );
        setAutoPayOrders(updatedOrders);
        
        // Also update in database
        try {
            // You might need to call an API to update the order status
            // For now, just update local state
            toast.success('Auto Pay resumed');
        } catch (error) {
            console.error('Failed to resume auto pay:', error);
            toast.error('Failed to resume');
        }
    }
};

  const getMerchantLogoUrl = (merchantId) => {
    const merchant = availableMerchants.find(m => m.id === merchantId);
    return merchant?.logoUrl || null;
  };

  const resetForm = () => {
    setFormData({
      merchant: '', merchant_category: '', merchant_name: '', monthly_limit: '',
      per_transaction_limit: '', requires_approval: false, is_active: true, bank_account_id: null
    });
    setSelectedLimit(null);
    setSelectedBank(null);
    setErrors({});
    setSearchTerm('');
    setPendingAddData(null);
    setPinAction(null);
    setPinDigits(['', '', '', '']);
  };

  const getCategoryIcon = (category) => {
    const cat = merchantCategories[category] || merchantCategories.others;
    return cat.icon;
  };

  const getCategoryColor = (category) => {
    const cat = merchantCategories[category] || merchantCategories.others;
    return cat.color;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getTransactionIcon = (type) => {
    switch(type) {
      case 'add_limit': return <FaPlus className="txn-icon-add" />;
      case 'withdraw_limit': return <FaMoneyBillWave className="txn-icon-withdraw" />;
      case 'auto_pay_execution': return <FaClock className="txn-icon-auto" />;
      case 'reserve_pay':
      case 'spending': return <FaShoppingBag className="txn-icon-spend" />;
      default: return <FaExchangeAlt className="txn-icon-default" />;
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch(type) {
      case 'add_limit': return 'Limit Added';
      case 'withdraw_limit': return 'Limit Withdrawn';
      case 'auto_pay_execution': return 'Auto Pay';
      case 'reserve_pay':
      case 'spending': return 'Purchase';
      default: return 'Transaction';
    }
  };

  const getBillCategoryIcon = (type) => {
    const icons = {
      electricity: <FaBolt />,
      water: <FaTint />,
      mobile: <FaMobile />,
      broadband: <FaWifi />,
      gas: <FaFire />,
      credit_card: <FaCreditCard />
    };
    return icons[type] || <FaBolt />;
  };

  const getBillCategoryColor = (type) => {
    const colors = {
      electricity: '#f59e0b',
      water: '#3b82f6',
      mobile: '#10b981',
      broadband: '#8b5cf6',
      gas: '#ef4444',
      credit_card: '#ec4899'
    };
    return colors[type] || '#64748b';
  };

  // PIN MODAL HANDLERS
  const handlePinChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newPin = [...pinDigits];
    newPin[index] = value || '';
    setPinDigits(newPin);
    
    if (value && index < 3) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  // Replace the verifyPinAndProceed function (around line 2400)

const verifyPinAndProceed = async () => {
    const pinString = pinDigits.join('');
    if (pinString.length !== 4) {
        setPinError('Please enter complete PIN');
        return;
    }

    setLoading(true);
    
    try {
        console.log('Verifying PIN for bank:', selectedBank);
        console.log('Bank ID:', selectedBank?.id);
        
        // Verify the PIN using the storageService
        const isValid = await verifyBankPin(selectedBank.id, pinString);
        
        console.log('PIN verification result:', isValid);
        
        if (!isValid) {
            setPinError('Incorrect PIN. Please try again.');
            setPinDigits(['', '', '', '']);
            pinInputRefs.current[0]?.focus();
            setLoading(false);
            return;
        }
        
        // PIN is correct, close PIN modal first
        setShowPinModal(false);
        setPinError('');
        setPinDigits(['', '', '', '']);
        
        // Proceed with the action
        if (pinAction === 'add') {
            await executeAddLimit();
        } else if (pinAction === 'withdraw') {
            await executeWithdraw();
        }
        
    } catch (error) {
        console.error('PIN verification error:', error);
        setPinError('Verification failed. Please try again.');
        setLoading(false);
    }
};


  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    const loadData = async () => {
      await loadBankAccounts();
      await loadBalances();
      await loadLimits();
      await loadAutoPayOrdersData();
      await loadAnalytics();
    };
    loadData();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'auto-pay') {
      setActiveTab('auto-pay');
    } else if (tabParam === 'analytics') {
      setActiveTab('analytics');
    } else if (tabParam === 'limits') {
      setActiveTab('limits');
    }
  }, []);

  const tabs = [
    { id: 'limits', label: 'Set Limits', icon: FaSlidersH },
    { id: 'auto-pay', label: 'Auto Pay', icon: FaClock },
    { id: 'analytics', label: 'Analytics', icon: FaChartLine }
  ];

  return (
    <div className="reserve-pay-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>

      <div className="reserve-container">
        <div className="reserve-header">
          <h1>Reserve Pay</h1>
          <p className="subtitle">Set spending limits - No PIN required for purchases within limits!</p>
        </div>

        <div className="reserve-tabs">
          {tabs.map(tab => (
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

        {/* ============================================ */}
        {/* LIMITS TAB */}
        {/* ============================================ */}
        {activeTab === 'limits' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="limits-tab">
            <div className="limits-header">
              <h2>Your Spending Limits</h2>
              <button className="add-limit-btn" onClick={handleAddLimitClick}>
                <FaPlus /> Add Limit
              </button>
            </div>

            {limits.length === 0 ? (
              <div className="no-limits">
                <FaWallet className="no-limits-icon" />
                <h3>No Limits Set</h3>
                <p>Start by adding a limit for your favorite merchant</p>
                <button className="add-first-btn" onClick={handleAddLimitClick}>
                  <FaPlus /> Add Your First Limit
                </button>
              </div>
            ) : (
              <div className="limits-grid">
                {limits.map(limit => {
                  const CategoryIcon = getCategoryIcon(limit.merchant_category);
                  const categoryColor = getCategoryColor(limit.merchant_category);
                  const spentPercentage = Math.min((limit.current_spent / limit.monthly_limit) * 100, 100);
                  const remaining = limit.monthly_limit - limit.current_spent;
                  const logoUrl = getMerchantLogoUrl(limit.merchant);
                  const hasImageError = imageErrors[limit.id];
                  const hasAutoPay = autoPayOrders.some(ap => ap.limitId === limit.id && ap.status === 'active');
                  
                  return (
                    <div key={limit.id} className={`limit-card ${!limit.is_active ? 'inactive' : ''}`}>
                      <div className="limit-card-header">
                        <div className="merchant-icon" style={{ backgroundColor: categoryColor }}>
                          {logoUrl && !hasImageError ? (
                            <img 
                              src={logoUrl} 
                              alt={limit.merchant_name}
                              className="merchant-logo-image"
                              onError={() => setImageErrors(prev => ({ ...prev, [limit.id]: true }))}
                            />
                          ) : (
                            <CategoryIcon />
                          )}
                        </div>
                        <div className="merchant-info">
                          <h3>{limit.merchant_name}</h3>
                          <span className="merchant-category">
                            {merchantCategories[limit.merchant_category]?.name || limit.merchant_category}
                          </span>
                        </div>
                        <div className="limit-actions">
                          <button className="action-btn edit" onClick={() => handleEdit(limit)}><FaEdit /></button>
                          <button className={`action-btn toggle ${limit.is_active ? 'active' : 'inactive'}`} onClick={() => handleToggleActive(limit)}>
                            {limit.is_active ? <FaEye /> : <FaEyeSlash />}
                          </button>
                          <button className="action-btn delete" onClick={() => { setSelectedLimit(limit); setShowDeleteConfirm(true); }}><FaTrash /></button>
                        </div>
                      </div>

                      <div className="limit-card-body">
                        <div className="limit-amounts">
                          <div className="limit-amount">
                            <span className="limit-label">Available Limit</span>
                            <span className="limit-value">₹{Number(remaining).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="limit-amount">
                            <span className="limit-label">Total Limit</span>
                            <span className="limit-subvalue">₹{Number(limit.monthly_limit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
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
                            <span>Used this month</span>
                            <span className="spent-amount">₹{limit.current_spent.toLocaleString()} / ₹{limit.monthly_limit.toLocaleString()}</span>
                          </div>
                          <div className="progress-bar">
                            <div className={`progress-fill ${spentPercentage >= 80 ? 'warning' : ''}`} style={{ width: `${spentPercentage}%` }} />
                          </div>
                        </div>

                        <div className="limit-footer">
                          {limit.requires_approval ? (
                            <span className="approval-badge"><FaBell /> Requires Approval</span>
                          ) : (
                            <span className="auto-badge"><FaCheckCircle /> Auto-Pay</span>
                          )}
                          <div className="limit-footer-actions">
                            {remaining > 0 && (
                              <button className="withdraw-btn" onClick={() => handleWithdrawLimit(limit)}>
                                <FaMoneyBillWave /> Withdraw
                              </button>
                            )}
                            {!hasAutoPay && remaining > 0 && (
                              <button className="auto-pay-setup-btn" onClick={() => handleSetupAutoPay(limit)}>
                                <FaClock /> Set Auto Pay
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================ */}
{/* AUTO PAY TAB */}
{/* ============================================ */}
{activeTab === 'auto-pay' && (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="auto-pay-tab">
    <div className="auto-pay-header">
      <h2>Auto Pay Orders</h2>
      <p className="section-note">Manage your recurring payments</p>
    </div>
    
    {/* Bill Auto-Pay Section */}
{autoPayBills.length > 0 && (
  <div className="auto-pay-section">
    <div className="section-header">
      <h3><FaBell /> Bill Auto-Pay</h3>
      <button className="view-all-btn" onClick={() => navigate('/bills')}>
        Manage Bills <FaArrowRight />
      </button>
    </div>
    <div className="auto-pay-list">
      {autoPayBills.map((bill, index) => {
        const scheduleDisplay = bill.schedule === 'monthly' 
          ? `Monthly on ${bill.dateValue || (bill.due_date ? new Date(bill.due_date).getDate() : '?')}${getOrdinalSuffix(bill.dateValue || (bill.due_date ? new Date(bill.due_date).getDate() : 1))}`
          : 'One-time';
        const nextDate = bill.nextExecution ? new Date(bill.nextExecution) : (bill.due_date ? new Date(bill.due_date) : null);
        
        return (
          <div key={bill.bill_id || bill.id || index} className="auto-pay-item">
            <div className="auto-pay-info">
              <div className="auto-pay-icon" style={{ background: getBillCategoryColor(bill.bill_type) + '15' }}>
                {getBillCategoryIcon(bill.bill_type)}
              </div>
              <div>
                <h4>{bill.provider}</h4>
                <p className="auto-pay-details">
                  ₹{parseFloat(bill.amount).toLocaleString()} • Due {bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'Date not set'}
                </p>
                <p className="auto-pay-schedule">
                  {scheduleDisplay} • Next: {nextDate ? nextDate.toLocaleDateString() : 'N/A'}
                </p>
                {bill.reserve_pay_enabled && (
                  <p className="reserve-pay-badge">
                    <img src="/images/merchants/sabailogo.png" alt="SabAI" className="assistant-icon-very-small" /> SabAI Pay Lite
                  </p>
                )}
                {bill.bank_name && !bill.reserve_pay_enabled && (
                  <p className="bank-pay-badge">
                    <FaUniversity /> {bill.bank_name} (xxxx{bill.bank_account_last4})
                  </p>
                )}
              </div>
            </div>
            <div className="auto-pay-status">
              <span className="status-badge active">Active</span>
              {/* REMOVED DELETE BUTTON - User should manage from Bill Payments page */}
              <button 
                className="view-bill-btn"
                onClick={() => navigate('/bills')}
                title="Manage in Bill Payments"
              >
                <FaArrowRight /> Manage
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
    
    {/* Recharge Auto-Pay Section */}
{(() => {
  // Get recharge orders from autoPayOrders
  const rechargeOrders = autoPayOrders.filter(order => order.isRecharge === true);
  
  if (rechargeOrders.length > 0) {
    return (
      <div className="auto-pay-section">
        <div className="section-header">
          <h3><FaMobile /> Recharge Auto-Pay</h3>
          <button className="view-all-btn" onClick={() => navigate('/mobile-recharge')}>
            New Recharge <FaArrowRight />
          </button>
        </div>
        <div className="auto-pay-list">
          {rechargeOrders.map(order => {
            const scheduleDisplay = order.schedule === 'monthly' 
              ? `Monthly on ${order.dateValue}${getOrdinalSuffix(order.dateValue)} at ${order.time || '09:00'}`
              : `Yearly on ${order.dateValue}${getOrdinalSuffix(order.dateValue)}`;
            const nextDate = order.nextExecution ? new Date(order.nextExecution) : null;
            const operatorColor = getOperatorColor(order.operator);
            
            return (
              <div key={order.id} className="auto-pay-item">
                <div className="auto-pay-info">
                  <div className="auto-pay-icon" style={{ background: operatorColor + '15' }}>
                    <FaMobile style={{ color: operatorColor }} />
                  </div>
                  <div>
                    <h4>{order.mobileNumber}</h4>
                    <p className="auto-pay-details">
                      {order.operatorName} • ₹{order.amount?.toLocaleString()} • {scheduleDisplay}
                    </p>
                    <p className="auto-pay-schedule">
                      Next: {nextDate ? nextDate.toLocaleDateString() : 'N/A'}
                    </p>
                    {order.paymentMethod === 'reserve' ? (
                      <p className="reserve-pay-badge">
                        <img src="/images/merchants/sabailogo.png" alt="SabAI" className="assistant-icon-very-small" /> SabAI Pay Lite
                      </p>
                    ) : (
                      <p className="bank-pay-badge">
                        <FaUniversity /> {order.bankName} (xxxx{order.bankAccountLast4})
                      </p>
                    )}
                  </div>
                </div>
                <div className="auto-pay-status">
                  <span className="status-badge active">Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
})()}
    
    {/* Merchant Auto-Pay Section */}
    {autoPayOrders.filter(order => !order.isBillPayment && !order.isRecharge).length > 0 && (
      <div className="auto-pay-section">
        <div className="section-header">
          <h3><FaShoppingBag /> Merchant Auto-Pay</h3>
          <p className="section-note">Auto-pay orders created from Set Limits</p>
        </div>
        <div className="auto-pay-orders-grid-compact">
          {autoPayOrders.filter(order => !order.isBillPayment && !order.isRecharge).map(order => (
            <AutoPayCard
              key={order.id}
              order={order}
              onCancel={cancelAutoPay}
              onDelete={deleteAutoPayOrder}
              onResume={resumeAutoPay}
              getMerchantLogoUrl={getMerchantLogoUrl}
            />
          ))}
        </div>
      </div>
    )}
    
    {/* No Auto Pay Orders Message */}
    {autoPayOrders.filter(order => !order.isBillPayment && !order.isRecharge).length === 0 && 
     autoPayBills.length === 0 && 
     autoPayOrders.filter(order => order.isRecharge === true).length === 0 && (
      <div className="no-auto-pay">
        <FaClock className="no-auto-pay-icon" />
        <h3>No Auto Pay Orders</h3>
        <p>Set up Auto Pay for your favorite merchants, bills, or mobile recharges</p>
        <button className="add-limit-btn" onClick={() => setActiveTab('limits')}>
          <FaPlus /> Add a Limit First
        </button>
      </div>
    )}
  </motion.div>
)}

        {/* ============================================ */}
        {/* ANALYTICS TAB */}
        {/* ============================================ */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="analytics-tab">
            <div className="analytics-header">
              <h2>Reserve Pay Analytics</h2>
              <div className="analytics-controls">
                <div className="timeframe-selector">
                  {['week', 'month', 'quarter', 'year'].map(option => (
                    <button
                      key={option}
                      className={`timeframe-btn ${timeframe === option ? 'active' : ''}`}
                      onClick={() => setTimeframe(option)}
                    >
                      {option === 'week' ? 'This Week' : option === 'month' ? 'This Month' : option === 'quarter' ? 'Last 3 Months' : 'This Year'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {analyticsData.summary.totalTransactions === 0 ? (
              <div className="no-transactions-message">
                <FaChartLine className="no-transactions-icon" />
                <h3>No Reserve Pay Transactions Yet</h3>
                <p>Start using Reserve Pay for your purchases to see analytics here!</p>
                <button className="add-limit-btn" onClick={() => setActiveTab('limits')} style={{ marginTop: '20px' }}>
                  <FaPlus /> Set a Limit First
                </button>
              </div>
            ) : (
              <>
                <div className="summary-cards">
                  <div className="summary-card">
                    <div className="summary-icon spent"><FaRupeeSign /></div>
                    <div className="summary-info">
                      <span className="summary-label">Total Spent</span>
                      <span className="summary-value">₹{Math.round(analyticsData.summary.totalSpent || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-icon added"><FaPlus /></div>
                    <div className="summary-info">
                      <span className="summary-label">Total Added</span>
                      <span className="summary-value">₹{Math.round(analyticsData.summary.totalAdded || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-icon withdrawn"><FaMoneyBillWave /></div>
                    <div className="summary-info">
                      <span className="summary-label">Total Withdrawn</span>
                      <span className="summary-value">₹{Math.round(analyticsData.summary.totalWithdrawn || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-icon auto"><FaClock /></div>
                    <div className="summary-info">
                      <span className="summary-label">Auto Pay Total</span>
                      <span className="summary-value">₹{Math.round(analyticsData.summary.totalAutoPay || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analyticsData.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Legend />
                      <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} name="Spending (₹)" />
                      <Line type="monotone" dataKey="transactions" stroke="#10b981" strokeWidth={2} name="Transactions" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="category-section">
                  <h3>Spending by Category</h3>
                  <div className="category-grid">
                    {analyticsData.byCategory.map((cat, index) => (
                      <div key={cat.category} className="category-item">
                        <div className="category-header">
                          <span className="category-name">{merchantCategories[cat.category]?.name || cat.category}</span>
                          <span className="category-total">₹{Math.round(cat.total).toLocaleString()}</span>
                        </div>
                        <div className="category-bar">
                          <div className="category-fill" style={{ width: `${cat.percentage}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                        </div>
                        <div className="category-stats">
                          <span>{cat.count} transactions</span>
                          <span>Avg: ₹{Math.round(cat.average).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="transaction-history-section">
                  <h3>Transaction History</h3>
                  <div className="transaction-list">
                    {analyticsData.transactions.length > 0 ? (
                      analyticsData.transactions.map((txn, index) => (
                        <div key={index} className="transaction-row">
                          <div className="transaction-icon-cell">
                            {getTransactionIcon(txn.type)}
                          </div>
                          <div className="transaction-details-cell">
                            <div className="transaction-title">
                              {getTransactionTypeLabel(txn.type)}
                              {txn.type === 'add_limit' && <span className="txn-badge add">Added</span>}
                              {txn.type === 'withdraw_limit' && <span className="txn-badge withdraw">Withdrawn</span>}
                              {txn.type === 'auto_pay_execution' && <span className="txn-badge auto">Auto</span>}
                              {txn.type === 'reserve_pay' && <span className="txn-badge spend">Spend</span>}
                            </div>
                            <div className="transaction-description">{txn.description}</div>
                            <div className="transaction-merchant">{txn.merchant_name}</div>
                            <div className="transaction-date">{formatDate(txn.created_at || txn.date)}</div>
                          </div>
                          <div className="transaction-amount-cell">
                            <span className={`amount ${txn.type === 'add_limit' ? 'positive' : txn.type === 'withdraw_limit' ? 'neutral' : 'negative'}`}>
                              {txn.type === 'add_limit' ? '+' : txn.type === 'withdraw_limit' ? '↺' : '-'} ₹{Math.round(txn.amount).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-transactions">No transactions found</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Add Limit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)}>
            <motion.div className="limit-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add New Limit</h2>
                <button className="modal-close" onClick={() => setShowAddModal(false)}><FaTimes /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Merchant</label>
                  <div className="merchant-search-container">
                    <div className="search-input-wrapper">
                      <FaSearch className="search-icon" />
                      <input type="text" placeholder="Search merchants..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                    </div>
                    <div className="merchant-select-wrapper">
                      <select value={formData.merchant} onChange={(e) => { const merchant = availableMerchants.find(m => m.id === e.target.value); if (merchant) handleMerchantSelect(merchant); }} className={`form-select ${errors.merchant ? 'error' : ''}`} size="5">
                        <option value="">Choose a merchant</option>
                        {Object.keys(groupedFilteredMerchants).map(category => (
                          <optgroup key={category} label={merchantCategories[category]?.name || category}>
                            {groupedFilteredMerchants[category].map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>
                  {errors.merchant && <span className="error-text">{errors.merchant}</span>}
                </div>
                <div className="form-group">
                  <label>Amount to Add (₹)</label>
                  <input type="number" name="monthly_limit" value={formData.monthly_limit} onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })} className={`form-input ${errors.monthly_limit ? 'error' : ''}`} min="100" />
                  {errors.monthly_limit && <span className="error-text">{errors.monthly_limit}</span>}
                </div>
                <div className="form-group">
                  <label>Per Transaction Limit (Optional)</label>
                  <input type="number" name="per_transaction_limit" value={formData.per_transaction_limit} onChange={(e) => setFormData({ ...formData, per_transaction_limit: e.target.value })} className={`form-input ${errors.per_transaction_limit ? 'error' : ''}`} min="1" />
                  {errors.per_transaction_limit && <span className="error-text">{errors.per_transaction_limit}</span>}
                </div>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="requires_approval" checked={formData.requires_approval} onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })} />
                    <span>Require my approval for each transaction</span>
                  </label>
                </div>
                {selectedBank && (
                  <div className="selected-bank-info">
                    <div className="bank-icon-small">
                      {(() => {
                        const bankLogo = getBankLogoUrl(selectedBank.bank_name);
                        const hasBankError = imageErrors[`selected_bank_${selectedBank.id}`];
                        if (bankLogo && !hasBankError) {
                          return <img src={bankLogo} alt={selectedBank.bank_name} className="bank-logo-image" onError={() => setImageErrors(prev => ({ ...prev, [`selected_bank_${selectedBank.id}`]: true }))} />;
                        }
                        return <FaUniversity />;
                      })()}
                    </div>
                    <span>{selectedBank.bank_name} (xxxx{selectedBank.account_number?.slice(-4)})</span>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={initiateAddLimit} disabled={loading}>{loading ? <FaSpinner className="spinner" /> : 'Add Limit'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Limit Modal */}
      <AnimatePresence>
        {showEditModal && selectedLimit && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)}>
            <motion.div className="limit-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Limit</h2>
                <button className="modal-close" onClick={() => setShowEditModal(false)}><FaTimes /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Merchant</label>
                  <div className="readonly-field">{selectedLimit.merchant_name}</div>
                </div>
                <div className="form-group">
                  <label>Monthly Limit (₹)</label>
                  <input type="number" name="monthly_limit" value={formData.monthly_limit} onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })} className="form-input" min="100" />
                </div>
                <div className="form-group">
                  <label>Per Transaction Limit (Optional)</label>
                  <input type="number" name="per_transaction_limit" value={formData.per_transaction_limit} onChange={(e) => setFormData({ ...formData, per_transaction_limit: e.target.value })} className="form-input" min="1" />
                </div>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="requires_approval" checked={formData.requires_approval} onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })} />
                    <span>Require my approval for each transaction</span>
                  </label>
                </div>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                    <span>Active (can use this limit)</span>
                  </label>
                </div>
                {selectedLimit.contributions && selectedLimit.contributions.length > 0 && (
                  <div className="contribution-breakdown">
                    <h4>Fund Sources (FIFO Order)</h4>
                    {selectedLimit.contributions.map((contrib, idx) => {
                      const bank = bankAccounts.find(b => b.id === contrib.bank_account_id);
                      return (
                        <div key={idx} className="contribution-item">
                          <span>{idx + 1}. {bank?.bank_name || 'Unknown Bank'}</span>
                          <span>₹{contrib.amount.toLocaleString()}</span>
                        </div>
                      );
                    })}
                    <p className="fifo-note">Withdrawals will be processed in this order (First In, First Out)</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleUpdateLimit} disabled={loading}>{loading ? <FaSpinner className="spinner" /> : 'Update Limit'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && selectedLimit && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(false)}>
            <motion.div className="confirm-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="confirm-icon"><FaExclamationTriangle /></div>
              <h3>Delete Limit</h3>
              <p>Are you sure you want to delete the limit for {selectedLimit.merchant_name}?</p>
              <p className="warning-text">Unused amount will be returned to your bank account(s) in FIFO order.</p>
              <div className="confirm-actions">
                <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="btn-danger" onClick={handleDeleteLimit}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bank Selection Modal */}
      <AnimatePresence>
        {showBankSelectionModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBankSelectionModal(false)}>
            <motion.div className="bank-selection-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Select Bank Account</h2>
                <button className="modal-close" onClick={() => setShowBankSelectionModal(false)}><FaTimes /></button>
              </div>
              <div className="modal-body">
                <p className="modal-description">Choose which bank account to use for this limit:</p>
                {bankAccounts.length === 0 ? (
                  <div className="no-banks-message">
                    <p>No bank accounts linked. Please add a bank account in Settings first.</p>
                    <button className="btn-primary" onClick={() => navigate('/settings?tab=bank')}>Add Bank Account</button>
                  </div>
                ) : (
                  <div className="bank-list">
                    {bankAccounts.map(bank => {
                      const bankLogo = getBankLogoUrl(bank.bank_name);
                      const hasBankError = imageErrors[`bank_select_${bank.id}`];
                      return (
                        <div key={bank.id} className="bank-select-card" onClick={() => handleBankSelect(bank)}>
                          <div className="bank-icon-small">
                            {bankLogo && !hasBankError ? (
                              <img src={bankLogo} alt={bank.bank_name} className="bank-logo-image" onError={() => setImageErrors(prev => ({ ...prev, [`bank_select_${bank.id}`]: true }))} />
                            ) : (
                              <FaUniversity />
                            )}
                          </div>
                          <div className="bank-info">
                            <h4>{bank.bank_name}</h4>
                            <p className="account-number">xxxx{bank.account_number?.slice(-4)}</p>
                            {bank.is_primary && <span className="primary-badge">Primary</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Amount Modal */}
      <AnimatePresence>
  {showWithdrawModal && selectedLimit && (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowWithdrawModal(false)}>
      <motion.div className="withdraw-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Withdraw from Limit</h2>
          <button className="modal-close" onClick={() => setShowWithdrawModal(false)}><FaTimes /></button>
        </div>
        <div className="modal-body">
          <p className="withdraw-info">Withdraw unused amount from <strong>{selectedLimit.merchant_name}</strong> limit back to your bank account(s).</p>
          <div className="limit-info">
            <div className="info-row">
              <span>Total Limit:</span>
              <strong>₹{selectedLimit.monthly_limit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
            </div>
            <div className="info-row">
              <span>Used:</span>
              <strong>₹{selectedLimit.current_spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
            </div>
            <div className="info-row highlight">
              <span>Available to Withdraw:</span>
              <strong>₹{(selectedLimit.monthly_limit - selectedLimit.current_spent).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
            </div>
          </div>
          
          {selectedLimit.contributions && selectedLimit.contributions.length > 0 && (
            <div className="contribution-breakdown">
              <h4>Fund Sources (FIFO Order)</h4>
              {selectedLimit.contributions.map((contrib, idx) => {
                const bank = bankAccounts.find(b => b.id === contrib.bank_account_id);
                return (
                  <div key={idx} className="contribution-item">
                    <span>{idx + 1}. {bank?.bank_name || contrib.bank_name || 'Unknown Bank'}</span>
                    <span>₹{contrib.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                );
              })}
              <p className="fifo-note">Withdrawals will be processed in this order (First In, First Out)</p>
              <p className="pin-note">You will verify with the PIN of the first bank in this list: <strong>{selectedLimit.contributions[0]?.bank_name}</strong></p>
            </div>
          )}
          
          <div className="form-group">
            <label>Amount to Withdraw (₹)</label>
            <input 
              type="number" 
              value={withdrawAmount} 
              onChange={(e) => setWithdrawAmount(e.target.value)} 
              placeholder="Enter amount" 
              className="form-input" 
              min="1" 
              max={selectedLimit.monthly_limit - selectedLimit.current_spent} 
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => setShowWithdrawModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={initiateWithdraw} disabled={loading}>
            {loading ? <FaSpinner className="spinner" /> : 'Withdraw'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
      {/* PIN Verification Modal */}
      <AnimatePresence>
        {showPinModal && selectedBank && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPinModal(false)}>
            <motion.div className="pin-modal-white" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setShowPinModal(false)}><FaTimes /></button>
              
              <div className="modal-bank-header">
                <div className="modal-bank-logo" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                  {(() => {
                    const bankLogo = getBankLogoUrl(selectedBank.bank_name);
                    const hasError = imageErrors[`pin_${selectedBank.id}`];
                    if (bankLogo && !hasError) {
                      return <img src={bankLogo} alt={selectedBank.bank_name} className="bank-logo-large" onError={() => setImageErrors(prev => ({ ...prev, [`pin_${selectedBank.id}`]: true }))} />;
                    }
                    return <FaUniversity style={{ fontSize: '1.8rem', color: '#4f46e5' }} />;
                  })()}
                </div>
                <div className="modal-bank-details">
                  <h3 className="modal-bank-name-white">
                    {pinAction === 'add' ? 'Confirm Add Limit' : pinAction === 'withdraw' ? 'Confirm Withdrawal' : 'Confirm Update'}
                  </h3>
                  <p className="modal-account-white">Enter UPI PIN for {selectedBank.bank_name}</p>
                </div>
              </div>

              <div className="pin-input-group">
                <div className="pin-inputs-row">
                  {pinDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => pinInputRefs.current[index] = el}
                      type={showPin ? 'text' : 'password'}
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(e, index)}
                      className={`pin-input-field ${digit ? 'filled' : ''}`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <label className="show-pin-checkbox">
                  <input type="checkbox" checked={showPin} onChange={() => setShowPin(!showPin)} />
                  <span>Show PIN</span>
                </label>
                {pinError && <p className="pin-error">{pinError}</p>}
              </div>

              <div className="modal-actions-white">
                <button className="modal-btn-white cancel" onClick={() => setShowPinModal(false)}>Cancel</button>
                <button className="modal-btn-white submit" onClick={verifyPinAndProceed} disabled={loading}>
                  {loading ? <FaSpinner className="spinner" /> : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto Pay Setup Modal */}
      <AnimatePresence>
        {showAutoPayModal && selectedAutoPayLimit && (
          <AutoPaySetupModalComponent
            limit={selectedAutoPayLimit}
            bankAccounts={bankAccounts}
            balances={balances}
            onConfirm={handleAutoPayConfirm}
            onCancel={() => {
              setShowAutoPayModal(false);
              setSelectedAutoPayLimit(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Auto Pay Confirmation Modal */}
      <AnimatePresence>
        {showDeleteAutoPayConfirm && autoPayOrderToDelete && (
          <DeleteAutoPayConfirmModal
            order={autoPayOrderToDelete}
            onConfirm={confirmDeleteAutoPayOrder}
            onCancel={cancelDeleteAutoPayOrder}
          />
        )}
      </AnimatePresence>

      {/* PopUPI Success Modals */}
      <AnimatePresence>
        {showPopUpiSuccessModal && popUpiType === 'limit_added' && popUpiData && (
          <PopUpiLimitAddedModal
            transactionData={popUpiData}
            onClose={() => {
              setShowPopUpiSuccessModal(false);
              setPopUpiData(null);
              setPopUpiType(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPopUpiSuccessModal && popUpiType === 'auto_pay_setup' && popUpiData && (
          <PopUpiAutoPaySetupModal
            orderData={popUpiData}
            onClose={() => {
              setShowPopUpiSuccessModal(false);
              setPopUpiData(null);
              setPopUpiType(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPopUpiSuccessModal && popUpiType === 'withdraw' && popUpiData && (
          <PopUpiWithdrawModal
            transactionData={popUpiData}
            onClose={() => {
              setShowPopUpiSuccessModal(false);
              setPopUpiData(null);
              setPopUpiType(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReservePayPage;