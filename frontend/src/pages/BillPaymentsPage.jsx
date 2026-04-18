// frontend/src/pages/BillPaymentsPage.jsx
// COMPLETE FIXED VERSION

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import storageService, {
    getBankAccounts, getBankBalances, getCoinBalance, getReserveLimits,
    getBills, addBill, updateBill, deleteBill, markBillAsPaid, getPaidBills,
    verifyBankPin, hasUpiPin, updateBankBalance, updateCoinBalance, deleteAutoPayOrder,
    addTransaction, getAutoPayOrders, setAutoPayOrders, addAutoPayOrder
} from '../services/storageService';
import { 
  FaBolt, FaTint, FaMobile, FaWifi, FaFire, FaCreditCard,
  FaHistory, FaCalendarAlt, FaRupeeSign, FaCheckCircle, FaExclamationCircle,
  FaPlus, FaTimesCircle, FaTrash, FaEdit, FaBell, FaArrowLeft, FaTimes,
  FaSearch, FaFilter, FaClock, FaSpinner, FaUniversity, FaArrowRight,
  FaInfoCircle, FaRobot, FaGift, FaCheckDouble, FaGem, FaWallet, FaExchangeAlt
} from 'react-icons/fa';
import { MdReceipt } from 'react-icons/md';
import toast from 'react-hot-toast';
import axios from 'axios';
import './BillPaymentsPage.css';

// Helper function to get bank logo URL
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

// Helper function to calculate cashback (5% of amount, max 100 Gems)
const calculateCashback = (amount) => {
  const cashback = Math.floor(amount * 0.05);
  return Math.min(cashback, 100);
};

// ============================================
// PIN VERIFICATION MODAL - FIXED
// ============================================
const PinVerificationModal = ({ bank, onConfirm, onCancel, loading }) => {
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const pinInputRefs = useRef([]);

  const verifyBankPinFunc = async (bankId, enteredPin) => {
    try {
      const isValid = await verifyBankPin(bankId, enteredPin);
      return isValid;
    } catch (error) {
      console.error('PIN verification error:', error);
      return false;
    }
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

  const handleVerify = async () => {
    const pinString = pinDigits.join('');
    if (pinString.length !== 4) {
      setPinError('Please enter complete PIN');
      return;
    }

    setIsVerifying(true);
    setPinError('');
    
    try {
      const isValid = await verifyBankPinFunc(bank.id, pinString);
      
      if (!isValid) {
        setPinError('Incorrect PIN. Please try again.');
        setPinDigits(['', '', '', '']);
        pinInputRefs.current[0]?.focus();
        setIsVerifying(false);
        return;
      }
      
      await onConfirm();
    } catch (error) {
      console.error('Verification error:', error);
      setPinError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div 
        className="pin-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onCancel}>
          <FaTimes />
        </button>
        
        <div className="pin-modal-header">
          <div className="pin-bank-logo">
            {(() => {
              const bankLogo = getBankLogoUrl(bank.bank_name);
              if (bankLogo) {
                return <img src={bankLogo} alt={bank.bank_name} className="bank-logo-large" />;
              }
              return <FaUniversity style={{ fontSize: '1.8rem', color: '#4f46e5' }} />;
            })()}
          </div>
          <div className="pin-bank-details">
            <h3>Confirm Auto-Pay Setup</h3>
            <p>Enter UPI PIN for {bank.bank_name}</p>
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

        <div className="pin-modal-actions">
          <button className="pin-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="pin-confirm-btn" onClick={handleVerify} disabled={isVerifying || loading}>
            {isVerifying || loading ? <FaSpinner className="spinner" /> : 'Confirm Setup'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// BANK SELECTION MODAL - FIXED
// ============================================
const BankSelectionModal = ({ banks, onSelect, onCancel }) => {
  const [imageErrors, setImageErrors] = useState({});
  const [pinStatus, setPinStatus] = useState({});
  const [loadingPins, setLoadingPins] = useState(true);

  useEffect(() => {
    const checkPinStatus = async () => {
      const status = {};
      for (const bank of banks) {
        try {
          const hasPin = await hasUpiPin(bank.id);
          status[bank.id] = hasPin;
        } catch (error) {
          console.error(`Failed to check PIN for ${bank.bank_name}:`, error);
          status[bank.id] = false;
        }
      }
      setPinStatus(status);
      setLoadingPins(false);
    };
    checkPinStatus();
  }, [banks]);

  const handleBankSelect = (bank) => {
    const hasPin = pinStatus[bank.id];
    if (!hasPin) {
      toast.error(`Please set UPI PIN for ${bank.bank_name} in Settings first`);
      return;
    }
    onSelect(bank);
  };

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div 
        className="bank-selection-modal"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Select Bank Account for Auto-Pay</h2>
          <button className="modal-close" onClick={onCancel}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-description">Choose which bank account to use for auto-pay:</p>
          {banks.length === 0 ? (
            <div className="no-banks-message">
              <p>No bank accounts linked. Please add a bank account in Settings first.</p>
              <button className="btn-primary" onClick={() => window.location.href = '/settings?tab=bank'}>
                Add Bank Account
              </button>
            </div>
          ) : loadingPins ? (
            <div className="loading-pins">
              <FaSpinner className="spinner" /> Checking PIN status...
            </div>
          ) : (
            <div className="bank-list">
              {banks.map(bank => {
                const hasPin = pinStatus[bank.id];
                const bankLogo = getBankLogoUrl(bank.bank_name);
                const hasError = imageErrors[`bank_select_${bank.id}`];
                
                return (
                  <div 
                    key={bank.id} 
                    className={`bank-select-card ${!hasPin ? 'no-pin' : ''}`}
                    style={{ cursor: hasPin ? 'pointer' : 'not-allowed', opacity: hasPin ? 1 : 0.6 }}
                    onClick={() => handleBankSelect(bank)}
                  >
                    <div className="bank-icon-small">
                      {bankLogo && !hasError ? (
                        <img 
                          src={bankLogo} 
                          alt={bank.bank_name} 
                          className="bank-logo-image"
                          onError={() => setImageErrors(prev => ({ ...prev, [`bank_select_${bank.id}`]: true }))}
                        />
                      ) : (
                        <FaUniversity />
                      )}
                    </div>
                    <div className="bank-info">
                      <h4>{bank.bank_name}</h4>
                      <p className="account-number">xxxx{bank.account_number?.slice(-4)}</p>
                      {bank.is_primary && <span className="primary-badge">Primary</span>}
                    </div>
                    {!hasPin && <div className="pin-warning">🔒 PIN not set</div>}
                    {hasPin && <FaCheckCircle className="has-pin-icon" style={{ color: '#10b981' }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// SCHEDULE SUCCESS MODAL
// ============================================
const ScheduleSuccessModal = ({ billData, onClose, onViewAutoPay }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="schedule-success-modal"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="success-icon">
          <FaCheckDouble />
        </div>
        <h2>Auto-Pay Scheduled! 🎉</h2>
        <p className="success-message">Your auto-pay has been set up successfully.</p>
        
        <div className="schedule-success-details">
          <div className="success-row">
            <span>Bill Provider:</span>
            <strong>{billData.provider}</strong>
          </div>
          <div className="success-row">
            <span>Customer ID:</span>
            <span>{billData.customer_id}</span>
          </div>
          <div className="success-row">
            <span>Amount:</span>
            <strong>₹{parseFloat(billData.amount).toLocaleString()}</strong>
          </div>
          <div className="success-row">
            <span>Due Date:</span>
            <span>{formatDate(billData.due_date)}</span>
          </div>
          {billData.auto_pay && billData.bank_name && (
            <div className="success-row">
              <span>Bank Account:</span>
              <span>{billData.bank_name} (xxxx{billData.bank_account_last4})</span>
            </div>
          )}
          {billData.reserve_pay_enabled && (
            <div className="success-row highlight">
              <span>Reserve Pay (SabAI Pay Lite):</span>
              <span>Auto-pay on due date</span>
            </div>
          )}
          <div className="success-row">
            <span>Reminder:</span>
            <span>{billData.reminder_days} day(s) before due date</span>
          </div>
        </div>
        
        <p className="success-note">
          {billData.reserve_pay_enabled 
            ? `Amount will be automatically deducted from SabAI Pay Lite on the due date if sufficient limit is available.`
            : `Amount will be automatically deducted from your bank account on the due date.`}
          You'll receive a reminder {billData.reminder_days} day(s) before.
        </p>
        
        <div className="success-actions">
          <button className="success-secondary-btn" onClick={onClose}>
            Close
          </button>
          <button className="success-primary-btn" onClick={onViewAutoPay}>
            <FaClock /> View Auto-Pay
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// POPUPI SUCCESS ANIMATION
// ============================================
const PopUpiSuccessAnimation = ({ transactionData, onViewTransaction, onNewPayment }) => {
  const [animationStage, setAnimationStage] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationStage(1), 300);
    const timer2 = setTimeout(() => setAnimationStage(2), 800);
    const timer3 = setTimeout(() => setAnimationStage(3), 1300);
    const timer4 = setTimeout(() => setShowOptions(true), 1800);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);
  
  return (
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
            <img src="/images/merchants/sabailogo.png" alt="SabAI Pay" />
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
          <h2>Payment Successful!</h2>
          <p className="amount-paid">₹{transactionData?.amount?.toLocaleString()}</p>
          <p className="to-text">to {transactionData?.provider}</p>
        </motion.div>
        
        <motion.div 
          className="popupi-details"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: animationStage >= 3 ? 'auto' : 0, opacity: animationStage >= 3 ? 1 : 0 }}
        >
          <div className="detail-item">
            <span>Transaction ID</span>
            <span className="txn-id">{transactionData?.transactionId}</span>
          </div>
          <div className="detail-item highlight">
            <span>SabAI Gems Earned</span>
            <span>+{transactionData?.cashback || 0} 🪙</span>
          </div>
          <div className="detail-item">
            <span>Date & Time</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </motion.div>
        
        {showOptions && (
          <motion.div 
            className="popupi-options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button className="popupi-btn primary" onClick={onViewTransaction}>
              <FaHistory /> View Transaction
            </button>
            <button className="popupi-btn secondary" onClick={onNewPayment}>
              <FaArrowRight /> Pay Another Bill
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// FAILED PAYMENT MODAL
// ============================================
const FailedPaymentModal = ({ transactionData, onClose, onRetry }) => {
  const [animationStage, setAnimationStage] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationStage(1), 300);
    const timer2 = setTimeout(() => setAnimationStage(2), 800);
    const timer3 = setTimeout(() => setAnimationStage(3), 1300);
    const timer4 = setTimeout(() => setShowOptions(true), 1800);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
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
        className="popupi-animation failed"
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
            <div className="logo-inner failed">
              <FaTimesCircle style={{ fontSize: '2rem', color: '#ef4444' }} />
            </div>
            <div className="logo-ring failed"></div>
          </motion.div>
          
          <motion.div 
            className="popupi-check failed"
            initial={{ scale: 0 }}
            animate={{ scale: animationStage >= 2 ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.2 }}
          >
            <FaTimesCircle style={{ color: '#ef4444', fontSize: '2rem' }} />
          </motion.div>
          
          <motion.div 
            className="popupi-text"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: animationStage >= 2 ? 0 : 20, opacity: animationStage >= 2 ? 1 : 0 }}
          >
            <h2 style={{ color: '#ef4444' }}>Payment Failed!</h2>
            <p className="amount-paid">₹{transactionData?.amount?.toLocaleString()}</p>
            <p className="to-text">to {transactionData?.provider}</p>
          </motion.div>
          
          <motion.div 
            className="popupi-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: animationStage >= 3 ? 'auto' : 0, opacity: animationStage >= 3 ? 1 : 0 }}
          >
            <div className="detail-item highlight failed">
              <span>Failure Reason</span>
              <span style={{ color: '#ef4444' }}>{transactionData?.failure_reason || 'Insufficient balance'}</span>
            </div>
            <div className="detail-item">
              <span>Date & Time</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </motion.div>
          
          {showOptions && (
            <motion.div 
              className="popupi-options"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button className="popupi-btn primary" onClick={onRetry}>
                <FaArrowRight /> Try Again
              </button>
              <button className="popupi-btn secondary" onClick={onClose}>
                Close
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// MAIN BILL PAYMENTS PAGE COMPONENT
// ============================================
const BillPaymentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showPayBillModal, setShowPayBillModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showBankSelectionModal, setShowBankSelectionModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showScheduleSuccessModal, setShowScheduleSuccessModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedBankForSchedule, setSelectedBankForSchedule] = useState(null);
  const [pendingScheduleData, setPendingScheduleData] = useState(null);
  const [bills, setBills] = useState([]);
  const [paidBills, setPaidBills] = useState([]);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [imageErrors, setImageErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  
  // Payment method states
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [bankBalances, setBankBalances] = useState({});
  const [sabaiGems, setSabaiGems] = useState(0);
  const [universalReserveLimit, setUniversalReserveLimit] = useState(null);
  const [payStep, setPayStep] = useState(1);
  const [payPinDigits, setPayPinDigits] = useState(['', '', '', '']);
  const [payPinFilled, setPayPinFilled] = useState([false, false, false, false]);
  const [payPinError, setPayPinError] = useState('');
  const [showPayPin, setShowPayPin] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [showFailedAnimation, setShowFailedAnimation] = useState(false);
  const [failedTransactionResult, setFailedTransactionResult] = useState(null);
  
  // Combined payment breakdown
  const [paymentBreakdown, setPaymentBreakdown] = useState({
    gemsAmount: 0,
    reserveAmount: 0,
    bankAmount: 0,
    totalAmount: 0,
    billAmount: 0,
    remainingAfterGems: 0
  });
  
  // New bill form state
  const [formData, setFormData] = useState({
    bill_type: 'electricity',
    provider: '',
    customer_id: '',
    amount: '',
    due_date: '',
    auto_pay: false,
    max_amount: '',
    reminder_days: 3,
    reserve_pay_enabled: false,
    reserve_pay_limit: ''
  });
  const [errors, setErrors] = useState({});

  // Bill categories
  const billCategories = [
    { id: 'electricity', name: 'Electricity', icon: FaBolt, color: '#f59e0b', bgColor: '#fff3cd',
      providers: ['Tata Power', 'Adani Electricity', 'BSES', 'Torrent Power', 'CESC', 'MSEDCL', 'UPPCL'] },
    { id: 'water', name: 'Water', icon: FaTint, color: '#3b82f6', bgColor: '#dbeafe',
      providers: ['Municipal Corporation', 'BMC', 'DWSS', 'Chennai Metro', 'Bangalore Water'] },
    { id: 'mobile', name: 'Mobile', icon: FaMobile, color: '#10b981', bgColor: '#d1fae5',
      providers: ['Airtel', 'Jio', 'Vi', 'BSNL', 'MTNL'] },
    { id: 'broadband', name: 'Broadband', icon: FaWifi, color: '#8b5cf6', bgColor: '#ede9fe',
      providers: ['JioFiber', 'Airtel Xstream', 'ACT', 'Hathway', 'Tikona', 'Excitel'] },
    { id: 'gas', name: 'Gas', icon: FaFire, color: '#ef4444', bgColor: '#fee2e2',
      providers: ['HP Gas', 'Indane', 'Bharat Gas', 'Mahanagar Gas', 'Gujarat Gas'] },
    { id: 'credit_card', name: 'Credit Card', icon: FaCreditCard, color: '#ec4899', bgColor: '#fce7f3',
      providers: ['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak', 'IndusInd', 'American Express'] }
  ];

  // Load data on mount
  useEffect(() => {
    loadBills();
    loadPaidBills();
    loadBankAccounts();
    loadBankBalances();
    loadSabaiGems();
    loadUniversalReserveLimit();
    loadAutoPayFromReservePay();
    checkAutoPaySchedule();
  }, []);

  // Handle editing from Reserve Pay
  useEffect(() => {
    const editBillId = localStorage.getItem('editBillId');
    if (editBillId && bills.length > 0) {
      localStorage.removeItem('editBillId');
      const billToEdit = bills.find(b => b.id === parseInt(editBillId));
      if (billToEdit) {
        setTimeout(() => {
          handleScheduleBill(billToEdit);
        }, 100);
      }
    }
  }, [bills]);

  // ============================================
  // DATA LOADING FUNCTIONS
  // ============================================
  
  const loadBankAccounts = async () => {
    const accounts = await getBankAccounts();
    setLinkedBanks(accounts);
  };

  const loadBankBalances = async () => {
    const balances = await getBankBalances();
    setBankBalances(balances);
  };

  const loadSabaiGems = async () => {
    // This should return the remaining balance
    const gems = await getCoinBalance();
    setSabaiGems(gems);
};

  const loadUniversalReserveLimit = async () => {
    const limits = await getReserveLimits();
    const universalLimit = limits.find(l => l.merchant === 'sabai-pay-lite');
    setUniversalReserveLimit(universalLimit);
  };

  const loadBills = async () => {
    try {
      const billsList = await getBills();
      setBills(billsList);
      
      const upcoming = billsList.filter(bill => {
        const dueDate = new Date(bill.due_date);
        const today = new Date();
        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays >= 0 && bill.status !== 'paid';
      });
      setUpcomingBills(upcoming);
    } catch (error) {
      console.error('Failed to load bills:', error);
      const billsList = await getBills();
      setBills(billsList);
    }
  };

  const loadPaidBills = async () => {
    const saved = await getPaidBills();
    setPaidBills(saved.slice(0, 10));
  };

  const loadAutoPayFromReservePay = () => {
    const reservePayAutoPay = JSON.parse(localStorage.getItem('reservePayAutoPay') || '[]');
    const currentBills = bills;
    
    reservePayAutoPay.forEach(autoPayItem => {
      const existingBill = currentBills.find(b => b.id === autoPayItem.bill_id);
      if (existingBill && !existingBill.auto_pay && !existingBill.reserve_pay_enabled) {
        const updatedBills = currentBills.map(b => 
          b.id === autoPayItem.bill_id ? { 
            ...b, 
            auto_pay: autoPayItem.reserve_pay_enabled ? false : true,
            reserve_pay_enabled: autoPayItem.reserve_pay_enabled || false,
            reserve_pay_limit: autoPayItem.reserve_pay_limit,
            reminder_days: autoPayItem.reminder_days,
            bank_account_id: autoPayItem.bank_account_id,
            bank_name: autoPayItem.bank_name,
            bank_account_last4: autoPayItem.bank_account_last4
          } : b
        );
        setBills(updatedBills);
      }
    });
  };

  const checkAutoPaySchedule = async () => {
    const today = new Date().toISOString().split('T')[0];
    const savedBills = await getBills();
    
    if (savedBills && Array.isArray(savedBills)) {
      for (const bill of savedBills) {
        if ((bill.auto_pay || bill.reserve_pay_enabled) && bill.due_date === today && bill.status !== 'paid') {
          await processAutoPay(bill);
        }
      }
    }
  };

  const processAutoPay = async (bill) => {
    const amount = parseFloat(bill.amount);
    
    if (bill.reserve_pay_enabled) {
      const limits = await getReserveLimits();
      const universalLimit = limits.find(l => l.merchant === 'sabai-pay-lite');
      
      if (!universalLimit) {
        console.log('Auto-pay failed: SabAI Pay Lite limit not found');
        return;
      }
      
      const availableLimit = universalLimit.monthly_limit - (universalLimit.current_spent || 0);
      
      if (amount > availableLimit) {
        console.log(`Auto-pay failed: Insufficient SabAI Pay Lite limit. Available: ₹${availableLimit}`);
        return;
      }
      
      const updatedLimits = limits.map(limit => {
        if (limit.id === universalLimit.id) {
          return {
            ...limit,
            current_spent: (limit.current_spent || 0) + amount,
            updated_at: new Date().toISOString()
          };
        }
        return limit;
      });
      await storageService.setReserveLimits(updatedLimits);
      
      const transaction = await addTransaction({
        transactionId: `AP_BILL_${Date.now()}`,
        type: 'auto_pay_execution',
        amount: amount,
        description: `Auto-pay: Bill payment to ${bill.provider}`,
        status: 'success',
        payment_method_display: 'SabAI Pay Lite (Auto-Pay)'
      });
      
      const updatedBills = bills.map(b => 
        b.id === bill.id ? { ...b, status: 'paid', paid_at: new Date().toISOString() } : b
      );
      setBills(updatedBills);
      
      toast.success(`Auto-pay completed: ₹${amount} paid to ${bill.provider} via SabAI Pay Lite`);
      return;
    }
    
    if (bill.auto_pay && bill.bank_account_id) {
      const accounts = await getBankAccounts();
      const bankAccount = accounts.find(acc => acc.id === bill.bank_account_id);
      
      if (!bankAccount || !(await hasUpiPin(bankAccount.id))) {
        console.log('Auto-pay failed: No bank account with PIN found');
        return;
      }

      const currentBalance = bankBalances[bankAccount.id] || 0;
      
      if (amount > currentBalance) {
        console.log(`Auto-pay failed: Insufficient balance. Available: ₹${currentBalance}`);
        return;
      }
      
      const cashback = calculateCashback(amount);
      await updateBankBalance(bankAccount.id, amount, false);
      await updateCoinBalance(cashback, true);
      
      const transaction = await addTransaction({
        transactionId: `AP_BILL_${Date.now()}`,
        type: 'auto_pay_execution',
        amount: amount,
        description: `Auto-pay: Bill payment to ${bill.provider}`,
        status: 'success',
        cashback_earned: cashback,
        payment_method_display: `Auto-Pay (${bankAccount.bank_name})`
      });
      
      const updatedBills = bills.map(b => 
        b.id === bill.id ? { ...b, status: 'paid', paid_at: new Date().toISOString() } : b
      );
      setBills(updatedBills);
      
      toast.success(`Auto-pay completed: ₹${amount} paid to ${bill.provider}`);
    }
  };

  // ============================================
  // BILL MANAGEMENT FUNCTIONS
  // ============================================
  
  const validateForm = () => {
    const newErrors = {};

    if (!formData.provider) {
      newErrors.provider = 'Please select a provider';
    }

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer ID / Account number is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || formData.amount <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    }

    if (formData.auto_pay && formData.reserve_pay_enabled) {
      newErrors.auto_pay = 'Cannot select both Auto-pay and Reserve Pay. Choose one.';
      newErrors.reserve_pay_enabled = 'Cannot select both Auto-pay and Reserve Pay. Choose one.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'auto_pay' && checked) {
        setFormData(prev => ({
          ...prev,
          [name]: checked,
          reserve_pay_enabled: false,
          reserve_pay_limit: ''
        }));
      } else if (name === 'reserve_pay_enabled' && checked) {
        setFormData(prev => ({
          ...prev,
          [name]: checked,
          auto_pay: false
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddBill = async () => {
    if (!validateForm()) return;

    const newBill = {
      bill_type: formData.bill_type,
      provider: formData.provider,
      customer_id: formData.customer_id,
      amount: parseFloat(formData.amount),
      due_date: formData.due_date,
      auto_pay: formData.auto_pay || false,
      reserve_pay_enabled: formData.reserve_pay_enabled || false,
      reminder_days: formData.reminder_days || 3
    };

    try {
      setLoading(true);
      await addBill(newBill);
      toast.success('Bill added successfully!');
      await loadBills();
      setShowAddBillModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to add bill:', error);
      toast.error('Failed to add bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = async (billId) => {
    try {
        await deleteBill(billId);
        toast.success('Bill removed');
        await loadBills();
        
        // Also refresh auto-pay orders in Reserve Pay page
        // Dispatch an event to notify ReservePayPage to refresh
        window.dispatchEvent(new CustomEvent('billDeleted', { detail: { billId } }));
        
    } catch (error) {
        console.error('Failed to delete bill:', error);
        toast.error('Failed to delete bill: ' + (error.response?.data?.message || error.message));
    }
};

  const handleScheduleBill = (bill) => {
    setSelectedBill(bill);
    setFormData(prev => ({
      ...prev,
      reminder_days: bill.reminder_days || 3,
      auto_pay: bill.auto_pay || false,
      reserve_pay_enabled: bill.reserve_pay_enabled || false,
      reserve_pay_limit: bill.reserve_pay_limit || ''
    }));
    
    if (bill.reserve_pay_enabled) {
      setShowScheduleModal(true);
      return;
    }
    
    const banksWithPin = linkedBanks.filter(bank => hasUpiPin(bank.id));
    
    if (banksWithPin.length === 0) {
      toast.error('Please add a bank account with UPI PIN in Settings first');
      return;
    }
    
    setShowBankSelectionModal(true);
  };

  const handleBankSelectForSchedule = (bank) => {
    setSelectedBankForSchedule(bank);
    setShowBankSelectionModal(false);
    setShowScheduleModal(true);
  };

  const saveSchedule = async () => {
    const scheduleData = { ...formData };
    
    if (scheduleData.reserve_pay_enabled) {
        setLoading(true);
        
        try {
            // Update the bill in database
            const updatedBill = {
                auto_pay: false,
                reserve_pay_enabled: true,
                reminder_days: scheduleData.reminder_days,
                scheduled_date: selectedBill.due_date
            };
            
            await updateBill(selectedBill.id, updatedBill);
            
            // Check if auto-pay order already exists
            const existingOrders = await getAutoPayOrders();
            const existingOrder = existingOrders.find(order => order.bill_id === selectedBill.id);
            
            // Create MySQL datetime format for next_execution
            const dueDate = new Date(selectedBill.due_date);
            dueDate.setHours(9, 0, 0, 0);
            const mysqlFormattedDate = dueDate.getFullYear() + '-' + 
                String(dueDate.getMonth() + 1).padStart(2, '0') + '-' + 
                String(dueDate.getDate()).padStart(2, '0') + ' ' +
                String(dueDate.getHours()).padStart(2, '0') + ':' +
                String(dueDate.getMinutes()).padStart(2, '0') + ':' +
                String(dueDate.getSeconds()).padStart(2, '0');
            
            const autoPayOrder = {
                orderId: existingOrder ? existingOrder.order_id : `AP_BILL_${selectedBill.id}_${Date.now()}`,
                type: 'bill',
                merchant: selectedBill.provider?.toLowerCase().replace(/\s+/g, '-'),
                merchantName: selectedBill.provider,
                merchantCategory: selectedBill.bill_type,
                amount: parseFloat(selectedBill.amount),
                schedule: 'monthly',
                dateValue: new Date(selectedBill.due_date).getDate(),
                time: '09:00',
                paymentMethod: 'reserve',
                status: 'active',
                nextExecution: mysqlFormattedDate,
                isBillPayment: true,
                bill_id: selectedBill.id,
                customer_id: selectedBill.customer_id,
                bill_type: selectedBill.bill_type,
                provider: selectedBill.provider,
                reminderDays: scheduleData.reminder_days || 3
            };
            
            if (existingOrder) {
                await deleteAutoPayOrder(existingOrder.id);
            }
            
            await addAutoPayOrder(autoPayOrder);
            
            setShowScheduleModal(false);
            
            const successBillData = {
                ...selectedBill,
                reminder_days: scheduleData.reminder_days,
                reserve_pay_enabled: true
            };
            setSelectedBill(successBillData);
            setShowScheduleSuccessModal(true);
            
            toast.success(existingOrder ? 'Auto-pay updated with SabAI Pay Lite!' : 'Auto-pay scheduled with SabAI Pay Lite!');
            await loadBills();
            
        } catch (error) {
            console.error('Failed to schedule Reserve Pay auto-pay:', error);
            toast.error('Failed to schedule auto-pay: ' + error.message);
        } finally {
            setLoading(false);
        }
        
    } else if (scheduleData.auto_pay && selectedBankForSchedule) {
        setPendingScheduleData({
            bill: selectedBill,
            formData: scheduleData,
            selectedBank: selectedBankForSchedule
        });
        setShowPinModal(true);
    }
};
const confirmScheduleWithPin = async () => {
    const { bill, formData: scheduleData, selectedBank: bank } = pendingScheduleData;
    
    setLoading(true);
    
    try {
        // Update the bill in database
        const updatedBill = {
            auto_pay: true,
            reserve_pay_enabled: false,
            reminder_days: scheduleData.reminder_days,
            bank_account_id: bank.id,
            bank_name: bank.bank_name,
            bank_account_last4: bank.account_number?.slice(-4) || '****'
        };
        
        await updateBill(bill.id, updatedBill);
        
        // FIRST, check if an auto-pay order already exists for this bill
        const existingOrders = await getAutoPayOrders();
        const existingOrder = existingOrders.find(order => order.bill_id === bill.id);
        
        // Create MySQL datetime format for next_execution
        const dueDate = new Date(bill.due_date);
        dueDate.setHours(9, 0, 0, 0);
        const mysqlFormattedDate = dueDate.getFullYear() + '-' + 
            String(dueDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(dueDate.getDate()).padStart(2, '0') + ' ' +
            String(dueDate.getHours()).padStart(2, '0') + ':' +
            String(dueDate.getMinutes()).padStart(2, '0') + ':' +
            String(dueDate.getSeconds()).padStart(2, '0');
        
        const autoPayOrder = {
            orderId: existingOrder ? existingOrder.order_id : `AP_BILL_${bill.id}_${Date.now()}`,
            type: 'bill',
            merchant: bill.provider?.toLowerCase().replace(/\s+/g, '-') || 'bill',
            merchantName: bill.provider,
            merchantCategory: bill.bill_type,
            amount: parseFloat(bill.amount),
            schedule: 'monthly',
            dateValue: new Date(bill.due_date).getDate(),
            time: '09:00',
            paymentMethod: 'bank',
            bankAccountId: bank.id,
            bankName: bank.bank_name,
            bankAccountLast4: bank.account_number?.slice(-4) || '****',
            status: 'active',
            nextExecution: mysqlFormattedDate,
            isBillPayment: true,
            bill_id: bill.id,
            customer_id: bill.customer_id,
            bill_type: bill.bill_type,
            provider: bill.provider,
            reminderDays: scheduleData.reminder_days || 3
        };
        
        console.log('Creating/updating auto-pay order:', autoPayOrder);
        
        if (existingOrder) {
            // Update existing order - you may need a separate API for update
            // For now, delete and recreate
            await deleteAutoPayOrder(existingOrder.id);
        }
        
        await addAutoPayOrder(autoPayOrder);
        
        setShowPinModal(false);
        setShowScheduleModal(false);
        setSelectedBankForSchedule(null);
        setPendingScheduleData(null);
        
        const successBillData = {
            ...bill,
            bank_name: bank.bank_name,
            bank_account_last4: bank.account_number?.slice(-4) || '****',
            reminder_days: scheduleData.reminder_days
        };
        setSelectedBill(successBillData);
        setShowScheduleSuccessModal(true);
        
        toast.success(existingOrder ? 'Auto-pay updated successfully!' : 'Auto-pay scheduled successfully!');
        await loadBills();
        
    } catch (error) {
        console.error('Schedule confirmation error:', error);
        toast.error('Failed to schedule auto-pay: ' + (error.response?.data?.message || error.message));
    } finally {
        setLoading(false);
    }
};

  const syncAutoPayWithReservePay = (billId, isActive, paymentData = null) => {
    const autoPayOrders = JSON.parse(localStorage.getItem('autoPayOrders') || '[]');
    
    if (isActive && paymentData) {
      const existingIndex = autoPayOrders.findIndex(order => order.bill_id === billId);
      
      const dueDate = new Date(paymentData.due_date);
      const nextExecution = dueDate.toISOString();
      
      const newOrder = {
        id: existingIndex !== -1 ? autoPayOrders[existingIndex].id : `AP_BILL_${billId}_${Date.now()}`,
        bill_id: billId,
        limitId: 'sabai-pay-lite',
        merchant: paymentData.provider?.toLowerCase().replace(/\s+/g, '-'),
        merchantName: paymentData.provider,
        merchantCategory: paymentData.bill_type,
        amount: parseFloat(paymentData.amount),
        bankAccountId: paymentData.bank_account_id,
        bankName: paymentData.bank_name,
        bankAccountLast4: paymentData.bank_account_last4,
        schedule: 'monthly',
        dateValue: dueDate.getDate(),
        monthValue: null,
        time: '09:00',
        oneTimeDate: null,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastExecuted: null,
        nextExecution: nextExecution,
        executionHistory: [],
        isBillPayment: true,
        reserve_pay_enabled: paymentData.reserve_pay_enabled || false,
        reminder_days: paymentData.reminder_days || 3,
        due_date: paymentData.due_date,
        customer_id: paymentData.customer_id,
        bill_type: paymentData.bill_type,
        provider: paymentData.provider
      };
      
      if (existingIndex !== -1) {
        autoPayOrders[existingIndex] = newOrder;
      } else {
        autoPayOrders.push(newOrder);
      }
      localStorage.setItem('autoPayOrders', JSON.stringify(autoPayOrders));
      
      const autoPayBills = JSON.parse(localStorage.getItem('autoPayBills') || '[]');
      const billIndex = autoPayBills.findIndex(b => b.bill_id === billId);
      const billData = {
        bill_id: billId,
        provider: paymentData.provider,
        customer_id: paymentData.customer_id,
        amount: paymentData.amount,
        due_date: paymentData.due_date,
        bill_type: paymentData.bill_type,
        reserve_pay_enabled: true,
        reminder_days: paymentData.reminder_days,
        enabled: true
      };
      
      if (billIndex !== -1) {
        autoPayBills[billIndex] = billData;
      } else {
        autoPayBills.push(billData);
      }
      localStorage.setItem('autoPayBills', JSON.stringify(autoPayBills));
      localStorage.setItem('reservePayAutoPay', JSON.stringify(autoPayBills));
      
    } else {
      const updatedOrders = autoPayOrders.filter(order => order.bill_id !== billId);
      localStorage.setItem('autoPayOrders', JSON.stringify(updatedOrders));
      
      const updatedBills = JSON.parse(localStorage.getItem('autoPayBills') || '[]').filter(b => b.bill_id !== billId);
      localStorage.setItem('autoPayBills', JSON.stringify(updatedBills));
      localStorage.setItem('reservePayAutoPay', JSON.stringify(updatedBills));
    }
  };

  const resetForm = () => {
    setFormData({
      bill_type: 'electricity',
      provider: '',
      customer_id: '',
      amount: '',
      due_date: '',
      auto_pay: false,
      max_amount: '',
      reminder_days: 3,
      reserve_pay_enabled: false,
      reserve_pay_limit: ''
    });
    setErrors({});
  };

  // ============================================
  // PAYMENT FUNCTIONS
  // ============================================
  
  const handlePayBill = (bill) => {
    setSelectedBill(bill);
    setPayStep(1);
    setSelectedPaymentMethod(null);
    setSelectedPaymentType(null);
    setPayPinDigits(['', '', '', '']);
    setPayPinFilled([false, false, false, false]);
    setPayPinError('');
    setPaymentBreakdown({
      gemsAmount: 0,
      reserveAmount: 0,
      bankAmount: 0,
      totalAmount: 0,
      billAmount: parseFloat(bill.amount),
      remainingAfterGems: parseFloat(bill.amount)
    });
    setShowPayBillModal(true);
  };

  const handleGemsAmountChange = (gemsToUse) => {
    const billAmount = parseFloat(selectedBill.amount);
    const maxGemsToUse = Math.min(sabaiGems, billAmount);
    const validGems = Math.min(gemsToUse, maxGemsToUse);
    const remainingAfterGems = billAmount - validGems;
    
    setPaymentBreakdown({
      gemsAmount: validGems,
      reserveAmount: 0,
      bankAmount: remainingAfterGems,
      totalAmount: billAmount,
      billAmount: billAmount,
      remainingAfterGems: remainingAfterGems
    });
  };

  const getAvailableReserveLimit = () => {
    if (!universalReserveLimit) return 0;
    return universalReserveLimit.monthly_limit - (universalReserveLimit.current_spent || 0);
  };

  const getPaymentDisplay = () => {
    if (selectedPaymentType === 'bank') {
      return `₹${paymentBreakdown.bankAmount} (${selectedPaymentMethod?.bank_name || 'Bank'})`;
    } else if (selectedPaymentType === 'gems_only') {
      return `${paymentBreakdown.gemsAmount} GEMS Only`;
    } else if (selectedPaymentType === 'reserve_pay') {
      return `₹${paymentBreakdown.reserveAmount} SabAI Pay Lite`;
    } else if (selectedPaymentType === 'gems_and_lite') {
      return `${paymentBreakdown.gemsAmount} GEMS + ₹${paymentBreakdown.reserveAmount} SabAI Pay Lite`;
    }
    return 'Bank Transfer';
  };

  const getPaymentMethod = () => {
    if (selectedPaymentType === 'bank') return 'bank';
    if (selectedPaymentType === 'gems_only') return 'gems';
    if (selectedPaymentType === 'reserve_pay') return 'reserve_pay';
    if (selectedPaymentType === 'gems_and_lite') return 'gems_and_lite';
    if (selectedPaymentType === 'gems_and_bank') return 'gems_and_bank';
    return 'unknown';
  };

  const handlePaymentMethodSelect = (type, method = null) => {
    const billAmount = parseFloat(selectedBill.amount);
    const remainingAfterGems = paymentBreakdown.remainingAfterGems;
    const availableReserveLimit = getAvailableReserveLimit();
    
    setSelectedPaymentType(type);
    setSelectedPaymentMethod(method);
    
    if (type === 'gems_only') {
      if (sabaiGems >= billAmount) {
        setPendingPaymentData({
          type: 'gems_only',
          method: null,
          paymentBreakdown: {
            ...paymentBreakdown,
            gemsAmount: billAmount,
            bankAmount: 0,
            reserveAmount: 0,
            remainingAfterGems: 0
          }
        });
        setShowConfirmModal(true);
      } else {
        toast.error(`Insufficient SabAI Gems. You have ${sabaiGems} 🪙`);
        setSelectedPaymentType(null);
      }
    } else if (type === 'reserve_pay') {
      if (availableReserveLimit >= billAmount) {
        setPendingPaymentData({
          type: 'reserve_pay',
          method: null,
          paymentBreakdown: {
            ...paymentBreakdown,
            gemsAmount: 0,
            reserveAmount: billAmount,
            bankAmount: 0,
            remainingAfterGems: billAmount
          }
        });
        setShowConfirmModal(true);
      } else {
        toast.error(`Insufficient Reserve Pay limit. Available: ₹${availableReserveLimit.toLocaleString()}`);
        setSelectedPaymentType(null);
      }
    } else if (type === 'gems_and_lite') {
      const gemsToUse = paymentBreakdown.gemsAmount;
      const remaining = billAmount - gemsToUse;
      if (gemsToUse > 0 && remaining > 0 && availableReserveLimit >= remaining) {
        setPendingPaymentData({
          type: 'gems_and_lite',
          method: null,
          paymentBreakdown: {
            ...paymentBreakdown,
            gemsAmount: gemsToUse,
            reserveAmount: remaining,
            bankAmount: 0,
            remainingAfterGems: remaining
          }
        });
        setShowConfirmModal(true);
      } else {
        toast.error(`Insufficient Reserve Pay limit for remaining amount. Available: ₹${availableReserveLimit.toLocaleString()}`);
        setSelectedPaymentType(null);
      }
    } else if (type === 'bank') {
      if (!method) {
        toast.error('Please select a bank account');
        return;
      }
      if (!hasUpiPin(method.id)) {
        toast.error(`Please set UPI PIN for ${method.bank_name} in Settings first`);
        setSelectedPaymentType(null);
        setSelectedPaymentMethod(null);
        return;
      }
      setSelectedPaymentMethod(method);
      setPaymentBreakdown(prev => ({
        ...prev,
        bankAmount: remainingAfterGems,
        reserveAmount: 0
      }));
      setPayStep(2);
    } else if (type === 'gems_and_bank') {
      if (!method) {
        toast.error('Please select a bank account');
        return;
      }
      if (!hasUpiPin(method.id)) {
        toast.error(`Please set UPI PIN for ${method.bank_name} in Settings first`);
        setSelectedPaymentType(null);
        setSelectedPaymentMethod(null);
        return;
      }
      setSelectedPaymentMethod(method);
      setPendingPaymentData({
        type: 'gems_and_bank',
        method: method,
        paymentBreakdown: {
          ...paymentBreakdown,
          bankAmount: remainingAfterGems,
          reserveAmount: 0
        }
      });
      setPayStep(2);
    }
  };

  const confirmPayment = () => {
    if (!pendingPaymentData) return;
    
    const breakdownToUse = { ...pendingPaymentData.paymentBreakdown };
    
    setShowConfirmModal(false);
    setPendingPaymentData(null);
    
    processPaymentWithBreakdown(breakdownToUse);
  };

  const processPaymentWithBreakdown = async (breakdown) => {
    const billAmount = parseFloat(selectedBill.amount);
    const { gemsAmount, bankAmount, reserveAmount } = breakdown;
    
    const cashbackEarned = (gemsAmount === 0 && reserveAmount === 0) ? calculateCashback(billAmount) : 0;
    
    setPayLoading(true);
    
    try {
      let paymentFailed = false;
      let failureReason = '';
      
      if (bankAmount > 0 && selectedPaymentMethod) {
        const currentBalance = bankBalances[selectedPaymentMethod.id] || 0;
        if (bankAmount > currentBalance) {
          paymentFailed = true;
          failureReason = `Insufficient balance in ${selectedPaymentMethod.bank_name}`;
        }
      }
      
      if (reserveAmount > 0 && universalReserveLimit && !paymentFailed) {
        const availableLimit = universalReserveLimit.monthly_limit - (universalReserveLimit.current_spent || 0);
        if (reserveAmount > availableLimit) {
          paymentFailed = true;
          failureReason = `Insufficient SabAI Pay Lite limit. Available: ₹${availableLimit.toLocaleString()}`;
        }
      }
      
      if (paymentFailed) {
        const failedTransaction = {
          transactionId: `TXN_FAILED_${Date.now()}`,
          type: 'bill_payment',
          amount: billAmount,
          description: `Bill payment to ${selectedBill.provider} - FAILED`,
          status: 'failed',
          failure_reason: failureReason,
          payment_method_display: getPaymentDisplay(),
          payment_breakdown: { gemsAmount, bankAmount, reserveAmount }
        };
        
        await addTransaction(failedTransaction);
        
        setFailedTransactionResult(failedTransaction);
        setShowPayBillModal(false);
        setShowFailedAnimation(true);
        setPayLoading(false);
        return;
      }
      
      if (gemsAmount > 0) {
        await updateCoinBalance(gemsAmount, false);
      }
      
      if (reserveAmount > 0 && universalReserveLimit) {
        const limits = await getReserveLimits();
        const updatedLimits = limits.map(limit => {
          if (limit.id === universalReserveLimit.id) {
            return { ...limit, current_spent: (limit.current_spent || 0) + reserveAmount };
          }
          return limit;
        });
        await storageService.setReserveLimits(updatedLimits);
      }
      
      if (bankAmount > 0 && selectedPaymentMethod) {
        await updateBankBalance(selectedPaymentMethod.id, bankAmount, false);
      }
      
      if (cashbackEarned > 0) {
        await updateCoinBalance(cashbackEarned, true);
      }
      
      await markBillAsPaid(selectedBill.id, {
        payment_method: getPaymentMethod(),
        payment_breakdown: { gemsAmount, bankAmount, reserveAmount },
        cashback_earned: cashbackEarned,
        gems_used: gemsAmount,  
        transaction_id: `TXN${Date.now()}`
      });
      
      const transaction = await addTransaction({
        transactionId: `TXN${Date.now()}`,
        type: 'bill',
        amount: billAmount,
        description: `Bill payment to ${selectedBill.provider}`,
        status: 'success',
        cashback_earned: cashbackEarned,
        gems_used: gemsAmount > 0 ? gemsAmount : 0,
        payment_method_display: getPaymentDisplay(),
        payment_breakdown: { gemsAmount, bankAmount, reserveAmount },
        provider: selectedBill.provider,
        customer_id: selectedBill.customer_id,
        bill_type: selectedBill.bill_type
      });
      
      setTransactionResult(transaction);
      setShowPayBillModal(false);
      setShowSuccessAnimation(true);
      setPayLoading(false);
      
      await loadBills();
      await loadBankBalances();
      await loadSabaiGems();
      
      toast.success(`Bill paid successfully! ${cashbackEarned > 0 ? `+${cashbackEarned} 🪙 earned!` : ''}`);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setPayLoading(false);
    }
  };

  const handlePayPinChange = (index, value) => {
    if (isNaN(value) && value !== '') return;
    const newPin = [...payPinDigits];
    newPin[index] = value;
    setPayPinDigits(newPin);
    
    const newFilled = [...payPinFilled];
    newFilled[index] = value !== '';
    setPayPinFilled(newFilled);

    if (value && index < 3) {
      const nextInput = document.getElementById(`pay-pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePayPinKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !payPinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pay-pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCategoryIcon = (type) => {
    const category = billCategories.find(c => c.id === type);
    return category?.icon || FaBolt;
  };

  const getCategoryColor = (type) => {
    const category = billCategories.find(c => c.id === type);
    return category?.color || '#64748b';
  };

  const getBankLogoComponent = (bank) => {
    const logoUrl = getBankLogoUrl(bank.bank_name);
    const hasError = imageErrors[`bank_${bank.id}`];
    
    if (logoUrl && !hasError) {
      return (
        <img 
          src={logoUrl} 
          alt={bank.bank_name}
          className="bank-logo-img"
          onError={() => setImageErrors(prev => ({ ...prev, [`bank_${bank.id}`]: true }))}
        />
      );
    }
    return <span className="bank-logo-fallback">🏦</span>;
  };

  const handleViewTransaction = () => {
    setShowSuccessAnimation(false);
    navigate('/transactions');
  };

  const handleNewPayment = () => {
    setShowSuccessAnimation(false);
    setShowAddBillModal(true);
  };

  const handleViewAutoPay = () => {
    setShowScheduleSuccessModal(false);
    navigate('/reserve-pay?tab=auto-pay');
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.customer_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || bill.bill_type === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const banksWithPin = linkedBanks.filter(bank => hasUpiPin(bank.id));
  const availableReserveLimit = getAvailableReserveLimit();
  const remainingAfterGems = paymentBreakdown.remainingAfterGems;

  const formatPaymentBreakdown = (breakdown) => {
    if (!breakdown) return null;
    
    const { gemsAmount, reserveAmount, bankAmount } = breakdown;
    const parts = [];
    
    if (gemsAmount > 0) {
      parts.push(`${gemsAmount} 🪙 Gems`);
    }
    if (reserveAmount > 0) {
      parts.push(`₹${reserveAmount} SabAI Pay Lite`);
    }
    if (bankAmount > 0) {
      parts.push(`₹${bankAmount} Bank`);
    }
    
    if (parts.length === 0) return null;
    return <span className="payment-breakdown-text">Paid via: {parts.join(' + ')}</span>;
  };

  return (
    <div className="bill-payments-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>

      <div className="bill-payments-container">
        <div className="bill-payments-header">
          <h1>Bill Payments</h1>
          <p className="subtitle">Pay your bills instantly with 5% cashback (Max 100 Gems per transaction)</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
              <FaClock />
            </div>
            <div className="stat-info">
              <span className="stat-label">Upcoming Bills</span>
              <span className="stat-value">{upcomingBills.length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
              <FaCheckCircle />
            </div>
            <div className="stat-info">
              <span className="stat-label">Paid this month</span>
              <span className="stat-value">{paidBills.length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <FaRupeeSign />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Due</span>
              <span className="stat-value">
                ₹{bills.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
              <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-stat" />
            </div>
            <div className="stat-info">
              <span className="stat-label">SabAI Gems</span>
              <span className="stat-value">{sabaiGems.toLocaleString()} 🪙</span>
            </div>
          </div>
        </div>

        {/* Quick Bill Pay Categories */}
        <div className="quick-categories">
          <h2>Quick Bill Pay</h2>
          <div className="categories-grid">
            {billCategories.map(cat => (
              <button
                key={cat.id}
                className="category-card"
                onClick={() => {
                  setFormData(prev => ({ ...prev, bill_type: cat.id }));
                  setShowAddBillModal(true);
                }}
              >
                <div className="category-icon" style={{ background: `${cat.color}15`, color: cat.color }}>
                  <cat.icon />
                </div>
                <span className="category-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="search-filter-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by provider or customer ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {billCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button className="add-bill-btn" onClick={() => setShowAddBillModal(true)}>
            <FaPlus /> Add Bill
          </button>
        </div>

        {/* Bills List */}
        <div className="bills-list-section">
          <h2>Your Bills</h2>
          
          {filteredBills.length > 0 ? (
            <div className="bills-grid">
              {filteredBills.map(bill => {
                const daysUntil = getDaysUntilDue(bill.due_date);
                const CategoryIcon = getCategoryIcon(bill.bill_type);
                const categoryColor = getCategoryColor(bill.bill_type);
                const bankLogo = bill.bank_name ? getBankLogoUrl(bill.bank_name) : null;
                const bankLogoError = imageErrors[`bill_bank_${bill.id}`];
                
                return (
                  <motion.div
                    key={bill.id}
                    className="bill-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="bill-card-header">
                      <div className="bill-icon" style={{ background: `${categoryColor}15` }}>
                        <CategoryIcon style={{ color: categoryColor }} />
                      </div>
                      <div className="bill-info">
                        <h3>{bill.provider}</h3>
                        <p className="bill-customer">ID: {bill.customer_id}</p>
                      </div>
                      <div className="bill-actions">
                        {(bill.auto_pay || bill.reserve_pay_enabled) && (
                          <span className="auto-pay-badge" title="Auto-pay enabled">
                            <FaBell />
                          </span>
                        )}
                        <button 
                          className="delete-bill-btn"
                          onClick={() => handleDeleteBill(bill.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    <div className="bill-card-body">
                      <div className="bill-amount-row">
                        <span className="amount-label">Amount</span>
                        <span className="amount-value">₹{parseFloat(bill.amount).toLocaleString()}</span>
                      </div>
                      <div className="bill-due-row">
                        <FaCalendarAlt className="due-icon" />
                        <span className="due-date">Due: {formatDate(bill.due_date)}</span>
                        <span className={`due-badge ${daysUntil < 0 ? 'overdue' : daysUntil === 0 ? 'today' : daysUntil <= 3 ? 'urgent' : daysUntil <= 7 ? 'warning' : 'normal'}`}>
                          {daysUntil < 0 ? 'Overdue' : daysUntil === 0 ? 'Due Today' : `${daysUntil} days left`}
                        </span>
                      </div>
                      {bill.reserve_pay_enabled && (
                        <div className="bill-reserve-row">
                          <img src="/images/merchants/sabailogo.png" alt="SabAI" className="assistant-icon-small" />
                          <span className="reserve-text">SabAI Pay Lite Auto-Pay enabled</span>
                        </div>
                      )}
                      {bill.bank_name && bill.auto_pay && (
                        <div className="bill-bank-row">
                          <div className="bank-icon-small-bill">
                            {bankLogo && !bankLogoError ? (
                              <img 
                                src={bankLogo} 
                                alt={bill.bank_name}
                                className="bank-logo-small"
                                onError={() => setImageErrors(prev => ({ ...prev, [`bill_bank_${bill.id}`]: true }))}
                              />
                            ) : (
                              <FaUniversity className="bank-icon" />
                            )}
                          </div>
                          <span className="bank-text">Auto-pay from {bill.bank_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="bill-card-footer">
                      <button 
                        className="schedule-btn"
                        onClick={() => handleScheduleBill(bill)}
                      >
                        <FaClock /> Schedule
                      </button>
                      <button 
                        className="pay-now-btn"
                        onClick={() => handlePayBill(bill)}
                      >
                        Pay Now
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="no-bills">
              <MdReceipt className="no-bills-icon" />
              <h3>No bills found</h3>
              <p>{searchTerm ? 'Try a different search term' : 'Add your first bill to get started'}</p>
              <button className="add-first-btn" onClick={() => setShowAddBillModal(true)}>
                <FaPlus /> Add Bill
              </button>
            </div>
          )}
        </div>

        {/* Recent Paid Bills */}
        {paidBills.length > 0 && (
          <div className="paid-bills-section">
            <h2>Recently Paid</h2>
            <div className="paid-bills-list">
              {paidBills.map(bill => {
                const CategoryIcon = getCategoryIcon(bill.bill_type);
                const categoryColor = getCategoryColor(bill.bill_type);
                
                return (
                  <div key={bill.id} className="paid-bill-item">
                    <div className="paid-bill-icon" style={{ background: `${categoryColor}15` }}>
                      <CategoryIcon style={{ color: categoryColor }} />
                    </div>
                    <div className="paid-bill-info">
                      <h4>{bill.provider}</h4>
                      <p className="paid-bill-meta">
                        {bill.customer_id} • Paid on {formatDate(bill.paid_at)}
                      </p>
                      {bill.cashback > 0 && (
                        <p className="cashback-text">
                          +{bill.cashback} 🪙 cashback earned
                        </p>
                      )}
                      {bill.payment_breakdown && formatPaymentBreakdown(bill.payment_breakdown)}
                    </div>
                    <div className="paid-bill-amount">₹{parseFloat(bill.amount).toLocaleString()}</div>
                    <FaCheckCircle className="paid-bill-status" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Bill Modal */}
        <AnimatePresence>
          {showAddBillModal && (
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddBillModal(false)}
            >
              <motion.div 
                className="add-bill-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Add New Bill</h2>
                  <button className="modal-close" onClick={() => setShowAddBillModal(false)}>
                    <FaTimes />
                  </button>
                </div>

                <div className="modal-body-scroll">
                  <div className="form-group">
                    <label>Bill Type</label>
                    <select
                      name="bill_type"
                      value={formData.bill_type}
                      onChange={handleChange}
                      className="form-select"
                    >
                      {billCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Provider</label>
                    <select
                      name="provider"
                      value={formData.provider}
                      onChange={handleChange}
                      className={`form-select ${errors.provider ? 'error' : ''}`}
                    >
                      <option value="">Select Provider</option>
                      {billCategories.find(c => c.id === formData.bill_type)?.providers.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    {errors.provider && <span className="error-text">{errors.provider}</span>}
                  </div>

                  <div className="form-group">
                    <label>Customer ID / Account Number</label>
                    <input
                      type="text"
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleChange}
                      placeholder="Enter customer ID"
                      className={`form-input ${errors.customer_id ? 'error' : ''}`}
                    />
                    {errors.customer_id && <span className="error-text">{errors.customer_id}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Amount (₹)</label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        className={`form-input ${errors.amount ? 'error' : ''}`}
                      />
                      {errors.amount && <span className="error-text">{errors.amount}</span>}
                    </div>

                    <div className="form-group">
                      <label>Due Date</label>
                      <input
                        type="date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleChange}
                        className={`form-input ${errors.due_date ? 'error' : ''}`}
                      />
                      {errors.due_date && <span className="error-text">{errors.due_date}</span>}
                    </div>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="auto_pay"
                        checked={formData.auto_pay}
                        onChange={handleChange}
                        disabled={formData.reserve_pay_enabled}
                      />
                      <span>Enable Auto-pay (from Bank Account)</span>
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="reserve_pay_enabled"
                        checked={formData.reserve_pay_enabled}
                        onChange={handleChange}
                        disabled={formData.auto_pay}
                      />
                      <span>Enable Reserve Pay (SabAI Pay Lite) Auto-pay</span>
                    </label>
                  </div>

                  {formData.auto_pay && (
                    <div className="form-group">
                      <label>Remind me before (days)</label>
                      <select
                        name="reminder_days"
                        value={formData.reminder_days}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="1">1 day before</option>
                        <option value="2">2 days before</option>
                        <option value="3">3 days before</option>
                        <option value="5">5 days before</option>
                        <option value="7">7 days before</option>
                      </select>
                    </div>
                  )}

                  {formData.reserve_pay_enabled && (
                    <>
                      <div className="form-group">
                        <label>Remind me before (days)</label>
                        <select
                          name="reminder_days"
                          value={formData.reminder_days}
                          onChange={handleChange}
                          className="form-select"
                        >
                          <option value="1">1 day before</option>
                          <option value="2">2 days before</option>
                          <option value="3">3 days before</option>
                          <option value="5">5 days before</option>
                          <option value="7">7 days before</option>
                        </select>
                      </div>
                      <p className="field-hint" style={{ color: '#4f46e5', marginTop: '-8px', marginBottom: '16px' }}>
                        <img src="/images/merchants/sabailogo.png" alt="SabAI" className="assistant-icon-very-small" /> 
                        Amount will be auto-deducted from SabAI Pay Lite on due date if sufficient limit available.
                      </p>
                    </>
                  )}

                  {errors.auto_pay && <span className="error-text">{errors.auto_pay}</span>}
                </div>

                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setShowAddBillModal(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleAddBill} disabled={loading}>
                    {loading ? <FaSpinner className="spinner" /> : 'Add Bill'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pay Bill Modal */}
        <AnimatePresence>
          {showPayBillModal && selectedBill && (
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPayBillModal(false)}
            >
              <motion.div 
                className="pay-bill-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Pay Bill</h2>
                  <button className="modal-close" onClick={() => setShowPayBillModal(false)}>
                    <FaTimes />
                  </button>
                </div>

                <div className="modal-body-scroll">
                  <div className="bill-summary">
                    <div className="summary-provider">
                      <div className="summary-icon" style={{ background: `${getCategoryColor(selectedBill.bill_type)}15` }}>
                        {React.createElement(getCategoryIcon(selectedBill.bill_type), { style: { color: getCategoryColor(selectedBill.bill_type) } })}
                      </div>
                      <div>
                        <h3>{selectedBill.provider}</h3>
                        <p>{selectedBill.customer_id}</p>
                      </div>
                    </div>
                  </div>

                  {payStep === 1 && (
                    <>
                      <div className="payment-amount-display">
                        <span className="amount-label">Bill Amount</span>
                        <span className="amount-value-large">₹{parseFloat(selectedBill.amount).toLocaleString()}</span>
                        {sabaiGems > 0 && (
                          <div className="gems-input-section">
                            <label className="gems-label">
                              <img src="/images/sabaigems.png" alt="Gems" className="gem-icon" /> Use SabAI Gems
                            </label>
                            <div className="gems-input-wrapper">
                              <input
                                type="number"
                                className="gems-input"
                                value={paymentBreakdown.gemsAmount}
                                onChange={(e) => handleGemsAmountChange(parseInt(e.target.value) || 0)}
                                min="0"
                                max={Math.min(sabaiGems, parseFloat(selectedBill.amount))}
                                placeholder="0"
                              />
                              <span className="gems-max" onClick={() => handleGemsAmountChange(Math.min(sabaiGems, parseFloat(selectedBill.amount)))}>
                                Max
                              </span>
                            </div>
                            <p className="gems-balance">Available: {sabaiGems} 🪙 (1 🪙 = ₹1)</p>
                          </div>
                        )}
                        {paymentBreakdown.gemsAmount > 0 && (
                          <div className="payment-breakdown-preview">
                            <p>After using {paymentBreakdown.gemsAmount} 🪙: <strong>₹{paymentBreakdown.remainingAfterGems.toLocaleString()}</strong> remaining</p>
                          </div>
                        )}
                        {paymentBreakdown.gemsAmount === 0 && (
                          <span className="cashback-info">You'll earn +{calculateCashback(parseFloat(selectedBill.amount))} 🪙 cashback</span>
                        )}
                        {paymentBreakdown.gemsAmount > 0 && (
                          <span className="cashback-info no-cashback">⚠️ No cashback when using Gems</span>
                        )}
                      </div>

                      <div className="payment-methods-section">
                        <h4>Select Payment Method</h4>
                        
                        {sabaiGems >= parseFloat(selectedBill.amount) && (
                          <button
                            className={`payment-method-card ${selectedPaymentType === 'gems_only' ? 'selected' : ''}`}
                            onClick={() => handlePaymentMethodSelect('gems_only')}
                          >
                            <div className="payment-method-icon gems">
                              <img src="/images/sabaigems.png" alt="Gems" className="payment-method-logo" />
                            </div>
                            <div className="payment-method-info">
                              <strong>Pay with SabAI Gems Only</strong>
                              <span>Use {parseFloat(selectedBill.amount).toLocaleString()} 🪙 (No cashback)</span>
                            </div>
                            {selectedPaymentType === 'gems_only' && <FaCheckCircle className="selected-icon" />}
                          </button>
                        )}
                        
                        {availableReserveLimit >= parseFloat(selectedBill.amount) && (
                          <button
                            className={`payment-method-card ${selectedPaymentType === 'reserve_pay' ? 'selected' : ''}`}
                            onClick={() => handlePaymentMethodSelect('reserve_pay')}
                          >
                            <div className="payment-method-icon reserve">
                              <img src="/images/merchants/sabailogo.png" alt="SabAI" className="payment-method-logo" />
                            </div>
                            <div className="payment-method-info">
                              <strong>SabAI Pay Lite (Reserve Pay)</strong>
                              <span>Use ₹{parseFloat(selectedBill.amount).toLocaleString()} from universal limit</span>
                              <span className="limit-info">Available: ₹{availableReserveLimit.toLocaleString()}</span>
                            </div>
                            {selectedPaymentType === 'reserve_pay' && <FaCheckCircle className="selected-icon" />}
                          </button>
                        )}
                        
                        {paymentBreakdown.gemsAmount > 0 && paymentBreakdown.remainingAfterGems > 0 && availableReserveLimit >= paymentBreakdown.remainingAfterGems && (
                          <button
                            className={`payment-method-card ${selectedPaymentType === 'gems_and_lite' ? 'selected' : ''}`}
                            onClick={() => handlePaymentMethodSelect('gems_and_lite')}
                          >
                            <div className="payment-method-icon gems-lite">
                              <img src="/images/sabaigems.png" alt="Gems" className="payment-method-logo-small" />
                              <img src="/images/merchants/sabailogo.png" alt="SabAI" className="payment-method-logo-small" />
                            </div>
                            <div className="payment-method-info">
                              <strong>Gems + SabAI Pay Lite</strong>
                              <span>Use {paymentBreakdown.gemsAmount} 🪙 + ₹{paymentBreakdown.remainingAfterGems.toLocaleString()} from limit</span>
                            </div>
                            {selectedPaymentType === 'gems_and_lite' && <FaCheckCircle className="selected-icon" />}
                          </button>
                        )}
                        
                        {paymentBreakdown.remainingAfterGems > 0 && banksWithPin.length > 0 && (
                          <div className="bank-options-section">
                            <div className="bank-options-header">
                              <FaUniversity /> Pay remaining ₹{paymentBreakdown.remainingAfterGems.toLocaleString()} with Bank
                            </div>
                            <div className="banks-list-pay">
                              {banksWithPin.map(bank => (
                                <button
                                  key={bank.id}
                                  className={`bank-option-pay ${selectedPaymentMethod?.id === bank.id && selectedPaymentType === 'bank' ? 'selected' : ''}`}
                                  onClick={() => handlePaymentMethodSelect('bank', bank)}
                                >
                                  <div className="bank-icon-small-pay">
                                    {getBankLogoComponent(bank)}
                                  </div>
                                  <div className="bank-info-pay">
                                    <span className="bank-name-pay">{bank.bank_name}</span>
                                    <span className="bank-account-pay">xxxx{bank.account_number?.slice(-4)}</span>
                                  </div>
                                  {selectedPaymentMethod?.id === bank.id && selectedPaymentType === 'bank' && <FaCheckCircle className="selected-icon-pay" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {paymentBreakdown.gemsAmount > 0 && paymentBreakdown.remainingAfterGems > 0 && (
                          <div className="combined-payment-info">
                            <FaInfoCircle />
                            <span>You'll pay {paymentBreakdown.gemsAmount} 🪙 + ₹{paymentBreakdown.remainingAfterGems.toLocaleString()} via selected method</span>
                          </div>
                        )}
                      </div>

                      <div className="modal-footer">
                        <button className="btn-secondary" onClick={() => setShowPayBillModal(false)}>
                          Cancel
                        </button>
                        <button 
                          className="btn-primary" 
                          onClick={() => {
                            if (!selectedPaymentType) {
                              toast.error('Please select a payment method');
                              return;
                            }
                            if ((selectedPaymentType === 'bank' || selectedPaymentType === 'gems_and_bank') && !selectedPaymentMethod) {
                              toast.error('Please select a bank account');
                              return;
                            }
                            if (selectedPaymentType === 'reserve_pay' && availableReserveLimit < paymentBreakdown.billAmount) {
                              toast.error('Insufficient Reserve Pay limit');
                              return;
                            }
                            if (selectedPaymentType === 'gems_and_lite' && availableReserveLimit < paymentBreakdown.remainingAfterGems) {
                              toast.error('Insufficient Reserve Pay limit for remaining amount');
                              return;
                            }
                            if (selectedPaymentType === 'gems_only' && sabaiGems < paymentBreakdown.billAmount) {
                              toast.error('Insufficient SabAI Gems');
                              return;
                            }
                            
                            if (selectedPaymentType === 'bank') {
                              setPaymentBreakdown(prev => ({
                                ...prev,
                                bankAmount: prev.remainingAfterGems,
                                reserveAmount: 0
                              }));
                              setPayStep(2);
                              return;
                            }
                            
                            if (selectedPaymentType === 'gems_and_bank') {
                              const gemsToUse = paymentBreakdown.gemsAmount;
                              const remainingToPay = paymentBreakdown.remainingAfterGems;
                              if (gemsToUse > 0 && remainingToPay > 0 && selectedPaymentMethod) {
                                setPendingPaymentData({
                                  type: 'gems_and_bank',
                                  method: selectedPaymentMethod,
                                  paymentBreakdown: {
                                    ...paymentBreakdown,
                                    gemsAmount: gemsToUse,
                                    bankAmount: remainingToPay,
                                    reserveAmount: 0
                                  }
                                });
                                setPayStep(2);
                              } else {
                                toast.error('Please enter gems amount and select a bank account');
                              }
                              return;
                            }
                            
                            if (selectedPaymentType === 'gems_only' || selectedPaymentType === 'reserve_pay' || selectedPaymentType === 'gems_and_lite') {
                              let newBreakdown = {};
                              if (selectedPaymentType === 'gems_only') {
                                newBreakdown = {
                                  ...paymentBreakdown,
                                  gemsAmount: paymentBreakdown.billAmount,
                                  bankAmount: 0,
                                  reserveAmount: 0,
                                  remainingAfterGems: 0
                                };
                              } else if (selectedPaymentType === 'reserve_pay') {
                                newBreakdown = {
                                  ...paymentBreakdown,
                                  gemsAmount: 0,
                                  reserveAmount: paymentBreakdown.billAmount,
                                  bankAmount: 0,
                                  remainingAfterGems: paymentBreakdown.billAmount
                                };
                              } else if (selectedPaymentType === 'gems_and_lite') {
                                newBreakdown = {
                                  ...paymentBreakdown,
                                  reserveAmount: paymentBreakdown.remainingAfterGems,
                                  bankAmount: 0
                                };
                              }
                              setPendingPaymentData({
                                type: selectedPaymentType,
                                method: null,
                                paymentBreakdown: newBreakdown
                              });
                              setShowConfirmModal(true);
                            }
                          }}
                          disabled={!selectedPaymentType || ((selectedPaymentType === 'bank' || selectedPaymentType === 'gems_and_bank') && !selectedPaymentMethod)}
                        >
                          {(selectedPaymentType === 'bank' || selectedPaymentType === 'gems_and_bank') ? 'Next →' : 'Pay Now'}
                        </button>
                      </div>
                    </>
                  )}

                  {payStep === 2 && selectedPaymentMethod && (
                    <>
                      <div className="payment-summary">
                        <div className="summary-row">
                          <span>Total Amount</span>
                          <strong>₹{parseFloat(selectedBill.amount).toLocaleString()}</strong>
                        </div>
                        {paymentBreakdown.gemsAmount > 0 && (
                          <div className="summary-row">
                            <span>SabAI Gems Used</span>
                            <span>{paymentBreakdown.gemsAmount} 🪙 (₹{paymentBreakdown.gemsAmount})</span>
                          </div>
                        )}
                        <div className="summary-row">
                          <span>To</span>
                          <span>{selectedBill.provider}</span>
                        </div>
                        <div className="summary-row">
                          <span>From</span>
                          <span>{selectedPaymentMethod.bank_name} (xxxx{selectedPaymentMethod.account_number?.slice(-4)})</span>
                        </div>
                        {paymentBreakdown.bankAmount > 0 && (
                          <div className="summary-row">
                            <span>Bank Payment</span>
                            <strong>₹{paymentBreakdown.bankAmount.toLocaleString()}</strong>
                          </div>
                        )}
                        {paymentBreakdown.reserveAmount > 0 && (
                          <div className="summary-row">
                            <span>SabAI Pay Lite</span>
                            <strong>₹{paymentBreakdown.reserveAmount.toLocaleString()}</strong>
                          </div>
                        )}
                        {paymentBreakdown.gemsAmount === 0 && paymentBreakdown.reserveAmount === 0 && paymentBreakdown.bankAmount > 0 && (
                          <div className="summary-row">
                            <span>Cashback (5%)</span>
                            <span className="cashback-amount">+{calculateCashback(parseFloat(selectedBill.amount))} 🪙</span>
                          </div>
                        )}
                        {(paymentBreakdown.gemsAmount > 0 || paymentBreakdown.reserveAmount > 0) && (
                          <div className="summary-row">
                            <span>Cashback</span>
                            <span className="cashback-amount no-cashback">0 🪙 (Gems/Reserve Pay used)</span>
                          </div>
                        )}
                      </div>

                      <div className="pin-section-pay">
                        <label>Enter UPI PIN for {selectedPaymentMethod.bank_name}</label>
                        <div className="pin-inputs-pay">
                          {payPinDigits.map((digit, index) => (
                            <input
                              key={index}
                              id={`pay-pin-${index}`}
                              type={showPayPin ? 'text' : 'password'}
                              maxLength="1"
                              value={digit}
                              onChange={(e) => handlePayPinChange(index, e.target.value)}
                              onKeyDown={(e) => handlePayPinKeyDown(e, index)}
                              className={`pin-input-pay ${payPinFilled[index] ? 'filled' : ''}`}
                              autoFocus={index === 0}
                            />
                          ))}
                        </div>
                        <label className="show-pin-checkbox-pay">
                          <input type="checkbox" checked={showPayPin} onChange={() => setShowPayPin(!showPayPin)} />
                          <span>Show PIN</span>
                        </label>
                        {payPinError && <p className="pin-error-pay">{payPinError}</p>}
                      </div>

                      <div className="modal-footer">
                        <button className="btn-secondary" onClick={() => setPayStep(1)}>
                          Back
                        </button>
                        <button 
                          className="btn-primary" 
                          onClick={() => {
                            const pinString = payPinDigits.join('');
                            if (pinString.length !== 4) {
                              setPayPinError('Please enter complete PIN');
                              return;
                            }
                            
                            if (!verifyBankPin(selectedPaymentMethod.id, pinString)) {
                              setPayPinError('Incorrect PIN. Please try again.');
                              setPayPinDigits(['', '', '', '']);
                              setPayPinFilled([false, false, false, false]);
                              return;
                            }
                            
                            setPayPinError('');
                            
                            if (pendingPaymentData && pendingPaymentData.type === 'gems_and_bank') {
                              processPaymentWithBreakdown(pendingPaymentData.paymentBreakdown);
                            } else {
                              processPaymentWithBreakdown(paymentBreakdown);
                            }
                          }} 
                          disabled={payLoading}
                        >
                          {payLoading ? <FaSpinner className="spinner" /> : `Pay ₹${paymentBreakdown.bankAmount.toLocaleString()}`}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bank Selection Modal for Schedule */}
        <AnimatePresence>
          {showBankSelectionModal && (
            <BankSelectionModal
              banks={banksWithPin}
              onSelect={handleBankSelectForSchedule}
              onCancel={() => setShowBankSelectionModal(false)}
            />
          )}
        </AnimatePresence>

        {/* Schedule Modal */}
        <AnimatePresence>
          {showScheduleModal && selectedBill && (
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScheduleModal(false)}
            >
              <motion.div 
                className="schedule-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>{selectedBill.reserve_pay_enabled ? 'Schedule Auto-pay (SabAI Pay Lite)' : 'Schedule Auto-pay'}</h2>
                  <button className="modal-close" onClick={() => setShowScheduleModal(false)}>
                    <FaTimes />
                  </button>
                </div>

                <div className="modal-body-scroll">
                  <div className="bill-info-schedule">
                    <p><strong>{selectedBill.provider}</strong></p>
                    <p className="bill-customer-id">Customer ID: {selectedBill.customer_id}</p>
                    <p className="bill-amount-schedule">Amount: ₹{parseFloat(selectedBill.amount).toLocaleString()}</p>
                  </div>

                  {!selectedBill.reserve_pay_enabled && selectedBankForSchedule && (
                    <div className="selected-bank-info-schedule">
                      <div className="bank-icon-small">
                        {(() => {
                          const bankLogo = getBankLogoUrl(selectedBankForSchedule.bank_name);
                          if (bankLogo) {
                            return <img src={bankLogo} alt={selectedBankForSchedule.bank_name} className="bank-logo-image" />;
                          }
                          return <FaUniversity />;
                        })()}
                      </div>
                      <div className="bank-details">
                        <span className="bank-name">{selectedBankForSchedule.bank_name}</span>
                        <span className="account-number">xxxx{selectedBankForSchedule.account_number?.slice(-4)}</span>
                      </div>
                      <FaCheckCircle className="selected-bank-check" />
                    </div>
                  )}

                  {selectedBill.reserve_pay_enabled && (
                    <div className="selected-bank-info-schedule" style={{ background: '#eef2ff' }}>
                      <div className="bank-icon-small" style={{ background: '#4f46e5', color: 'white' }}>
                        <img src="/images/merchants/sabailogo.png" alt="SabAI" className="assistant-logo-small" />
                      </div>
                      <div className="bank-details">
                        <span className="bank-name">SabAI Pay Lite</span>
                        <span className="account-number">Reserve Pay Limit: ₹{getAvailableReserveLimit().toLocaleString()} available</span>
                      </div>
                      <FaCheckCircle className="selected-bank-check" />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Remind me before</label>
                    <select
                      name="reminder_days"
                      value={formData.reminder_days}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="1">1 day before</option>
                      <option value="2">2 days before</option>
                      <option value="3">3 days before</option>
                      <option value="5">5 days before</option>
                      <option value="7">7 days before</option>
                    </select>
                  </div>

                  <div className="schedule-info">
                    {selectedBill.reserve_pay_enabled ? (
                      <>
                        <img src="/images/merchants/sabailogo.png" alt="SabAI" className="assistant-icon-small" />
                        <p>Auto-pay will be processed on the due date using <strong>SabAI Pay Lite</strong>. Amount will be deducted if sufficient limit is available.</p>
                      </>
                    ) : (
                      <>
                        <img src="/images/merchants/sabailogo.png" alt="SabAI" className="assistant-icon-small" />
                        <p>Auto-pay will be processed on the due date using <strong>{selectedBankForSchedule?.bank_name}</strong>. You'll receive a reminder before each payment.</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setShowScheduleModal(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={saveSchedule}>
                    Save Schedule
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PIN Modal for Schedule Confirmation */}
        <AnimatePresence>
          {showPinModal && pendingScheduleData && (
            <PinVerificationModal
              bank={pendingScheduleData.selectedBank}
              onConfirm={confirmScheduleWithPin}
              onCancel={() => {
                setShowPinModal(false);
                setPendingScheduleData(null);
              }}
              loading={loading}
            />
          )}
        </AnimatePresence>

        {/* Schedule Success Modal */}
        <AnimatePresence>
          {showScheduleSuccessModal && selectedBill && (
            <ScheduleSuccessModal
              billData={selectedBill}
              onClose={() => setShowScheduleSuccessModal(false)}
              onViewAutoPay={handleViewAutoPay}
            />
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && pendingPaymentData && (
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowConfirmModal(false);
                setPendingPaymentData(null);
              }}
            >
              <motion.div 
                className="confirm-payment-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Confirm Payment</h2>
                  <button 
                    className="modal-close" 
                    onClick={() => {
                      setShowConfirmModal(false);
                      setPendingPaymentData(null);
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="modal-body-scroll">
                  <div className="bill-summary">
                    <div className="summary-provider">
                      <div className="summary-icon" style={{ background: `${getCategoryColor(selectedBill?.bill_type)}15` }}>
                        {selectedBill && React.createElement(getCategoryIcon(selectedBill.bill_type), { style: { color: getCategoryColor(selectedBill.bill_type) } })}
                      </div>
                      <div>
                        <h3>{selectedBill?.provider}</h3>
                        <p>{selectedBill?.customer_id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="payment-summary">
                    <div className="summary-row">
                      <span>Total Amount</span>
                      <strong>₹{parseFloat(selectedBill?.amount || 0).toLocaleString()}</strong>
                    </div>
                    
                    {pendingPaymentData.paymentBreakdown.gemsAmount > 0 && (
                      <div className="summary-row">
                        <span>SabAI Gems Used</span>
                        <span>{pendingPaymentData.paymentBreakdown.gemsAmount} 🪙 (₹{pendingPaymentData.paymentBreakdown.gemsAmount})</span>
                      </div>
                    )}
                    
                    {pendingPaymentData.paymentBreakdown.reserveAmount > 0 && (
                      <div className="summary-row">
                        <span>SabAI Pay Lite</span>
                        <span>₹{pendingPaymentData.paymentBreakdown.reserveAmount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {pendingPaymentData.paymentBreakdown.bankAmount > 0 && (
                      <div className="summary-row">
                        <span>Bank Payment</span>
                        <span>₹{pendingPaymentData.paymentBreakdown.bankAmount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="summary-row">
                      <span>To</span>
                      <span>{selectedBill?.provider}</span>
                    </div>
                    
                    {pendingPaymentData.type === 'reserve_pay' && pendingPaymentData.paymentBreakdown.gemsAmount === 0 && (
                      <div className="summary-row">
                        <span>Cashback (5%)</span>
                        <span className="cashback-amount">+{calculateCashback(parseFloat(selectedBill?.amount || 0))} 🪙</span>
                      </div>
                    )}
                    
                    {(pendingPaymentData.type === 'gems_only' || pendingPaymentData.type === 'gems_and_lite') && (
                      <div className="summary-row">
                        <span>Cashback</span>
                        <span className="cashback-amount no-cashback">0 🪙 (Gems used)</span>
                      </div>
                    )}
                    
                    {pendingPaymentData.type === 'gems_and_bank' && (
                      <div className="summary-row">
                        <span>Cashback</span>
                        <span className="cashback-amount no-cashback">0 🪙 (Gems used)</span>
                      </div>
                    )}
                    
                    {pendingPaymentData.type === 'bank' && pendingPaymentData.paymentBreakdown.gemsAmount === 0 && (
                      <div className="summary-row">
                        <span>Cashback (5%)</span>
                        <span className="cashback-amount">+{calculateCashback(parseFloat(selectedBill?.amount || 0))} 🪙</span>
                      </div>
                    )}
                  </div>

                  <div className="confirm-payment-note">
                    <FaInfoCircle />
                    <p>
                      {pendingPaymentData.type === 'gems_only' 
                        ? `You are about to pay ₹${parseFloat(selectedBill?.amount || 0).toLocaleString()} using ${pendingPaymentData.paymentBreakdown.gemsAmount} SabAI Gems. No cashback will be earned.`
                        : pendingPaymentData.type === 'gems_and_lite'
                        ? `You are about to pay ${pendingPaymentData.paymentBreakdown.gemsAmount} Gems + ₹${pendingPaymentData.paymentBreakdown.reserveAmount.toLocaleString()} using SabAI Pay Lite. No cashback will be earned.`
                        : pendingPaymentData.type === 'gems_and_bank'
                        ? `You are about to pay ${pendingPaymentData.paymentBreakdown.gemsAmount} Gems + ₹${pendingPaymentData.paymentBreakdown.bankAmount.toLocaleString()} via bank. No cashback will be earned.`
                        : pendingPaymentData.type === 'reserve_pay'
                        ? `You are about to pay ₹${parseFloat(selectedBill?.amount || 0).toLocaleString()} using SabAI Pay Lite. You will earn ${calculateCashback(parseFloat(selectedBill?.amount || 0))} 🪙 cashback!`
                        : `You are about to pay ₹${parseFloat(selectedBill?.amount || 0).toLocaleString()} via bank transfer. You will earn ${calculateCashback(parseFloat(selectedBill?.amount || 0))} 🪙 cashback!`}
                    </p>
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      setShowConfirmModal(false);
                      setPendingPaymentData(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={confirmPayment}
                    disabled={payLoading}
                  >
                    {payLoading ? <FaSpinner className="spinner" /> : 'Confirm Payment'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Animation */}
        <AnimatePresence>
          {showSuccessAnimation && transactionResult && (
            <motion.div 
              className="popupi-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PopUpiSuccessAnimation 
                onViewTransaction={handleViewTransaction}
                onNewPayment={handleNewPayment}
                transactionData={transactionResult}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Failed Payment Modal */}
        <AnimatePresence>
          {showFailedAnimation && failedTransactionResult && (
            <motion.div 
              className="popupi-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FailedPaymentModal 
                transactionData={failedTransactionResult}
                onClose={() => {
                  setShowFailedAnimation(false);
                  setFailedTransactionResult(null);
                }}
                onRetry={() => {
                  setShowFailedAnimation(false);
                  setFailedTransactionResult(null);
                  if (selectedBill) {
                    handlePayBill(selectedBill);
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BillPaymentsPage;