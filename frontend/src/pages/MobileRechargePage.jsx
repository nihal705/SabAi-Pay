// frontend/src/pages/MobileRechargePage.jsx
// UPDATED: Auto-pay SabAI Pay Lite selectable, fixed plan selection, pay now for auto-pay recharges

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
    getBankAccounts, getBankBalances, getCoinBalance, getReserveLimits,
    getTransactions, getAutoPayOrders, setAutoPayOrders, deleteAutoPayOrder,
    verifyBankPin, hasUpiPin, updateBankBalance, updateCoinBalance, 
    addTransaction, addRecentRecharge, setReserveLimits, addAutoPayOrder
} from '../services/storageService';
import { 
  FaMobile, FaRupeeSign, FaArrowLeft, FaCheckCircle,
  FaExclamationCircle, FaUniversity, FaLock, FaEye,
  FaEyeSlash, FaArrowRight, FaHistory, FaTimes,
  FaSearch, FaWallet, FaSpinner, FaInfoCircle,
  FaCalendarAlt, FaClock, FaPhone, FaRobot,
  FaGem, FaBell, FaPlus, FaTrash, FaEdit, FaTimesCircle,
  FaUserCircle, FaCreditCard, FaBolt, FaTint, FaWifi,
  FaFire, FaList, FaFilter, FaCopy, FaShare,
  FaChevronRight, FaChevronLeft, FaStar, FaCrown,
  FaExchangeAlt, FaArrowDown, FaArrowUp, FaCheckDouble,
  FaStopwatch, FaChartLine, FaUsers, FaGift
} from 'react-icons/fa';
import { MdNetworkCell, MdSpeed, MdLocalOffer, MdVerified } from 'react-icons/md';
import toast from 'react-hot-toast';
import './MobileRechargePage.css';

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

// Helper function to get operator logo
const getOperatorLogo = (operatorId) => {
  const logos = {
    airtel: '/images/operators/airtel.png',
    jio: '/images/operators/jio.png',
    vi: '/images/operators/vi.png',
    bsnl: '/images/operators/bsnl.png'
  };
  return logos[operatorId];
};

// PopUPI Style Success Animation Component
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

  const formatPaymentDisplay = (display) => {
  if (!display) return 'Bank Transfer';
  
  // Check if it contains "GEMS"
  if (display.includes('GEMS')) {
    const parts = display.split('GEMS');
    return (
      <span>
        {parts[0]} <img src="/images/sabaigems.png" alt="SabAI Gems" className="gem-icon-small" /> Gems {parts[1]}
      </span>
    );
  }
  return display;
};

  
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
          <h2>Recharge Successful!</h2>
          <p className="amount-paid">₹{transactionData?.amount?.toLocaleString()}</p>
          <p className="to-text">to {transactionData?.mobileNumber}</p>
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
          <div className="detail-item">
            <span>From</span>
            <span>{formatPaymentDisplay(transactionData?.payment_method_display)}</span>
          </div>
          <div className="detail-item highlight">
            <span>SabAI Gems Earned</span>
            <span>+{transactionData?.cashback} <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-small" /></span>
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
              <FaArrowRight /> New Recharge
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Failed Payment Modal Component
// Failed Payment Modal Component
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

  // Add this helper function inside FailedPaymentModal
  const formatPaymentDisplay = (display) => {
    if (!display) return 'Bank Transfer';
    if (display.includes('GEMS')) {
      const parts = display.split('GEMS');
      return (
        <span>
          {parts[0]} <img src="/images/sabaigems.png" alt="SabAI Gems" className="gem-icon-small" /> Gems {parts[1]}
        </span>
      );
    }
    return display;
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
            <h2 style={{ color: '#ef4444' }}>Recharge Failed!</h2>
            <p className="amount-paid">₹{transactionData?.amount?.toLocaleString()}</p>
            <p className="to-text">to {transactionData?.mobileNumber}</p>
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
            <div className="detail-item">
              <span>From</span>
              <span>{formatPaymentDisplay(transactionData?.payment_method_display)}</span>
            </div>
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

// Schedule Success Modal Component
const ScheduleSuccessModal = ({ rechargeData, onClose, onViewAutoPay }) => {
  const getOrdinalSuffix = (date) => {
    if (date > 3 && date < 21) return 'th';
    switch (date % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
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
            <span>Mobile Number:</span>
            <strong>{rechargeData.mobileNumber}</strong>
          </div>
          <div className="success-row">
            <span>Operator:</span>
            <span>{rechargeData.operatorName}</span>
          </div>
          <div className="success-row">
            <span>Amount:</span>
            <strong>₹{parseFloat(rechargeData.amount).toLocaleString()}</strong>
          </div>
          <div className="success-row">
            <span>Schedule:</span>
            <span>{rechargeData.schedule === 'monthly' ? `Monthly on ${rechargeData.dateValue}${getOrdinalSuffix(rechargeData.dateValue)}` : `Yearly on ${rechargeData.dateValue}${getOrdinalSuffix(rechargeData.dateValue)}`}</span>
          </div>
          <div className="success-row">
            <span>Reminder:</span>
            <span>{rechargeData.reminderDays} day(s) before due date</span>
          </div>
          <div className="success-row">
            <span>Payment Method:</span>
            <span>{rechargeData.paymentMethod === 'reserve' ? 'SabAI Pay Lite' : rechargeData.bankName}</span>
          </div>
        </div>
        
        <p className="success-note">
          {rechargeData.paymentMethod === 'reserve' 
            ? `Amount will be automatically deducted from SabAI Pay Lite on the scheduled date if sufficient limit is available.`
            : `Amount will be automatically deducted from your bank account on the scheduled date.`}
          You'll receive a reminder {rechargeData.reminderDays} day(s) before.
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

// Recharge History Modal Component
// Recharge History Modal Component - UPDATED to use API
const RechargeHistoryModal = ({ mobileNumber, operatorName, operatorLogo, operatorId,
    circle, operatorColor, onClose, onRechargeAgain }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadHistory();
  }, [mobileNumber]);
  
  const loadHistory = async () => {
    setLoading(true);
    try {
      // Use the API to get transactions
      const allTransactions = await getTransactions();
      console.log('All transactions:', allTransactions);
      console.log('Looking for mobile number:', mobileNumber);
      
      const rechargeHistory = allTransactions
        .filter(tx => {
          const txMobile = tx.mobileNumber || tx.mobile_number;
          const isMatch = String(txMobile) === String(mobileNumber);
          const isRecharge = tx.type === 'recharge';
          const isSuccess = tx.status === 'success';
          return isRecharge && isMatch && isSuccess;
        })
        .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
      
      console.log('Filtered history:', rechargeHistory);
      setHistory(rechargeHistory);
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
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
        className="recharge-history-modal"
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="history-modal-header">
          <button className="back-btn" onClick={onClose}>
            <FaArrowLeft />
          </button>
          <div className="history-number-info">
            <div className="history-number-icon" style={{ backgroundColor: operatorColor }}>
              {operatorLogo ? (
                <img src={operatorLogo} alt={operatorName} className="history-operator-logo" />
              ) : (
                <FaMobile style={{ color: 'white' }} />
              )}
            </div>
            <div>
              <h3>{mobileNumber}</h3>
              <p className="history-operator-name">{operatorName}</p>
            </div>
          </div>
          <button className="recharge-again-btn" onClick={() => { 
    onRechargeAgain({
        mobileNumber: mobileNumber,
        operatorId: operatorId,
        circle: circle,  // Pass the circle back
        operatorName: operatorName
    }); 
    onClose(); 
}}>
    <FaPlus /> Recharge
</button>
        </div>
        
        <div className="history-modal-body">
          {loading ? (
            <div className="history-loading"><FaSpinner className="spinner" /> Loading history...</div>
          ) : history.length === 0 ? (
            <div className="no-history">
              <FaHistory className="no-history-icon" />
              <p>No recharge history found for this number</p>
              <button className="recharge-now-btn" onClick={() => { onRechargeAgain(); onClose(); }}>
                Recharge Now
              </button>
            </div>
          ) : (
            <div className="history-list">
              {history.map(tx => (
                <div key={tx.id} className="history-item">
                  <div className="history-item-date">
                    <FaCalendarAlt />
                    <span>{formatDate(tx.created_at || tx.date)}</span>
                  </div>
                  <div className="history-item-details">
                    <div className="history-amount">₹{Number(tx.amount).toLocaleString()}</div>
                    <div className="history-payment-method">{tx.payment_method_display || 'Bank Transfer'}</div>
                    {tx.cashback_earned > 0 && (
                      <div className="history-cashback">+{tx.cashback_earned} <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-very-small" /></div>
                    )}
                  </div>
                  <div className="history-item-status success">
                    <FaCheckCircle /> Success
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Plan Details Modal Component
const PlanDetailsModal = ({ plan, onClose, onSelect }) => {
  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="plan-details-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}><FaTimes /></button>
        
        <div className="plan-details-header">
          <div className="plan-details-amount">₹{plan.amount}</div>
          <div className="plan-details-type">
            {plan.type === 'talktime' ? 'Talktime Plan' : 'Data Plan'}
          </div>
        </div>
        
        <div className="plan-details-content">
          <div className="detail-item">
            <span>Data/Benefit:</span>
            <strong>{plan.data}</strong>
          </div>
          <div className="detail-item">
            <span>Validity:</span>
            <strong>{plan.validity}</strong>
          </div>
          {plan.calls && (
            <div className="detail-item">
              <span>Calls:</span>
              <strong>{plan.calls}</strong>
            </div>
          )}
          {plan.sms && (
            <div className="detail-item">
              <span>SMS:</span>
              <strong>{plan.sms} SMS/day</strong>
            </div>
          )}
          <div className="detail-item">
            <span>Benefits:</span>
            <strong>{plan.benefits}</strong>
          </div>
          <div className="detail-item highlight">
            <span>Cashback:</span>
            <strong>+{Math.min(Math.floor(plan.amount * 0.05), 100)} <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-small" /> (Max 100)</strong>
          </div>
        </div>
        
        <button className="select-plan-btn" onClick={() => onSelect(plan)}>
          Select this Plan
        </button>
      </motion.div>
    </motion.div>
  );
};

// Bank Selection Modal for Auto-Pay
const BankSelectionModal = ({ banks, onSelect, onCancel }) => {
  const [imageErrors, setImageErrors] = useState({});

  const hasUpiPin = async (bankId) => {
    return await storageService.hasUpiPin(bankId);
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
          ) : (
            <div className="bank-list">
              {banks.map(bank => {
                const hasPin = hasUpiPin(bank.id);
                const bankLogo = getBankLogoUrl(bank.bank_name);
                const hasError = imageErrors[`bank_select_${bank.id}`];
                
                return (
                  <div 
                    key={bank.id} 
                    className={`bank-select-card ${!hasPin ? 'no-pin' : ''}`} 
                    onClick={() => hasPin && onSelect(bank)}
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

// PIN Verification Modal Component
const PinVerificationModal = ({ bank, onConfirm, onCancel, loading }) => {
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const pinInputRefs = useRef([]);

  const verifyBankPin = async (bankId, enteredPin) => {
    return await storageService.verifyBankPin(bankId, enteredPin);
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

  const handleVerify = () => {
    const pinString = pinDigits.join('');
    if (pinString.length !== 4) {
      setPinError('Please enter complete PIN');
      return;
    }

    if (!verifyBankPin(bank.id, pinString)) {
      setPinError('Incorrect PIN. Please try again.');
      setPinDigits(['', '', '', '']);
      pinInputRefs.current[0]?.focus();
      return;
    }

    onConfirm();
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
          <button className="pin-confirm-btn" onClick={handleVerify} disabled={loading}>
            {loading ? <FaSpinner className="spinner" /> : 'Confirm Setup'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MobileRechargePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // UI State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState(null);
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showRechargeHistory, setShowRechargeHistory] = useState(false);
  const [selectedHistoryNumber, setSelectedHistoryNumber] = useState(null);
  const [showAutoPayModal, setShowAutoPayModal] = useState(false);
  const [showScheduleSuccessModal, setShowScheduleSuccessModal] = useState(false);
  const [pendingAutoPayData, setPendingAutoPayData] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showBankSelectionModal, setShowBankSelectionModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedBankForAutoPay, setSelectedBankForAutoPay] = useState(null);
  const [autoPayPaymentMethod, setAutoPayPaymentMethod] = useState(null);
  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [selectedAutoPayOrder, setSelectedAutoPayOrder] = useState(null);
  const [rechargeAutoPayOrders, setRechargeAutoPayOrders] = useState([]);
  const [payLoading, setPayLoading] = useState(false);
  const [showEditAutoPayModal, setShowEditAutoPayModal] = useState(false);
  const [editingAutoPayOrder, setEditingAutoPayOrder] = useState(null);
  
  // Recharge Details
  const [mobileNumber, setMobileNumber] = useState('');
  const [operator, setOperator] = useState('');
  const [circle, setCircle] = useState('');
  const [amount, setAmount] = useState('');
  const [recentNumbers, setRecentNumbers] = useState([]);
  const [errors, setErrors] = useState({});
  
  // Payment Methods
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [bankBalances, setBankBalances] = useState({});
  const [sabaiGems, setSabaiGems] = useState(0);
  const [universalReserveLimit, setUniversalReserveLimit] = useState(null);
  const [payStep, setPayStep] = useState(1);
  const [showFailedAnimation, setShowFailedAnimation] = useState(false);
const [failedTransactionResult, setFailedTransactionResult] = useState(null);

  
  // Combined payment breakdown
  const [paymentBreakdown, setPaymentBreakdown] = useState({
    gemsAmount: 0,
    reserveAmount: 0,
    bankAmount: 0,
    totalAmount: 0,
    rechargeAmount: 0,
    remainingAfterGems: 0
  });
  
  // PIN States
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinFilled, setPinFilled] = useState([false, false, false, false]);
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const pinInputRefs = useRef([]);
  
  const [imageErrors, setImageErrors] = useState({});

  // Operators Data
  const operators = [
    { id: 'airtel', name: 'Airtel', color: '#e31b23', bgColor: '#fef2f2', logo: '/images/operators/airtel.png', description: 'India\'s leading telecom network' },
    { id: 'jio', name: 'Jio', color: '#0f3cc9', bgColor: '#eff6ff', logo: '/images/operators/jio.png', description: 'True 5G network' },
    { id: 'vi', name: 'Vi', color: '#9b1fe0', bgColor: '#faf5ff', logo: '/images/operators/vi.png', description: 'Vodafone Idea Limited' },
    { id: 'bsnl', name: 'BSNL', color: '#1e7b4b', bgColor: '#f0fdf4', logo: '/images/operators/bsnl.png', description: 'Bharat Sanchar Nigam Limited' }
  ];

  const circles = [
    'Andhra Pradesh', 'Assam', 'Bihar', 'Chennai', 'Delhi NCR',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir',
    'Karnataka', 'Kerala', 'Kolkata', 'Madhya Pradesh', 'Maharashtra',
    'Mumbai', 'North East', 'Odisha', 'Punjab', 'Rajasthan',
    'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
  ];

  const quickAmounts = [10, 20, 50, 100, 199, 299, 399, 499, 599, 999];

  // Comprehensive recharge plans for all operators
  const allPlans = [
    { id: 1, amount: 10, data: 'Talktime', validity: '1 day', calls: '₹10 talktime', type: 'talktime', operator: 'airtel', benefits: 'Get ₹10 talktime instantly', isPopular: false },
    { id: 2, amount: 20, data: 'Talktime', validity: '1 day', calls: '₹20 talktime', type: 'talktime', operator: 'airtel', benefits: 'Get ₹20 talktime instantly', isPopular: false },
    { id: 3, amount: 50, data: 'Talktime', validity: '1 day', calls: '₹50 talktime', type: 'talktime', operator: 'airtel', benefits: 'Get ₹50 talktime instantly', isPopular: false },
    { id: 4, amount: 100, data: 'Talktime', validity: '1 day', calls: '₹100 talktime', type: 'talktime', operator: 'airtel', benefits: 'Get ₹100 talktime instantly', isPopular: true },
    { id: 5, amount: 199, data: '2GB/day', validity: '28 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'airtel', benefits: 'Unlimited calls + 100 SMS/day', isPopular: true },
    { id: 6, amount: 299, data: '2GB/day', validity: '28 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'airtel', benefits: 'Unlimited calls + 100 SMS/day + Disney+ Hotstar', isPopular: false },
    { id: 7, amount: 399, data: '3GB/day', validity: '28 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'airtel', benefits: 'Unlimited calls + 100 SMS/day + Amazon Prime', isPopular: true },
    { id: 8, amount: 499, data: '2GB/day', validity: '56 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'airtel', benefits: 'Unlimited calls + 100 SMS/day', isPopular: false },
    { id: 9, amount: 599, data: '3GB/day', validity: '56 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'airtel', benefits: 'Unlimited calls + 100 SMS/day', isPopular: true },
    { id: 10, amount: 799, data: '2GB/day', validity: '84 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'airtel', benefits: 'Unlimited calls + 100 SMS/day', isPopular: false },
    { id: 11, amount: 999, data: '3GB/day', validity: '84 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'airtel', benefits: 'Unlimited calls + 100 SMS/day', isPopular: true },
    { id: 12, amount: 1499, data: '2GB/day', validity: '180 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'airtel', benefits: 'Unlimited calls + 100 SMS/day', isPopular: false },
    { id: 13, amount: 1999, data: '3GB/day', validity: '365 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'airtel', benefits: 'Unlimited calls + 100 SMS/day', isPopular: false },
    // Jio Plans
    { id: 14, amount: 10, data: 'Talktime', validity: '1 day', calls: '₹10 talktime', type: 'talktime', operator: 'jio', benefits: 'Get ₹10 talktime instantly', isPopular: false },
    { id: 15, amount: 20, data: 'Talktime', validity: '1 day', calls: '₹20 talktime', type: 'talktime', operator: 'jio', benefits: 'Get ₹20 talktime instantly', isPopular: false },
    { id: 16, amount: 50, data: 'Talktime', validity: '1 day', calls: '₹50 talktime', type: 'talktime', operator: 'jio', benefits: 'Get ₹50 talktime instantly', isPopular: false },
    { id: 17, amount: 100, data: 'Talktime', validity: '1 day', calls: '₹100 talktime', type: 'talktime', operator: 'jio', benefits: 'Get ₹100 talktime instantly', isPopular: true },
    { id: 18, amount: 199, data: '1.5GB/day', validity: '28 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'jio', benefits: 'Unlimited calls + 100 SMS/day + Jio apps', isPopular: true },
    { id: 19, amount: 299, data: '2GB/day', validity: '28 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'jio', benefits: 'Unlimited calls + 100 SMS/day + Jio apps', isPopular: false },
    { id: 20, amount: 399, data: '3GB/day', validity: '28 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'jio', benefits: 'Unlimited calls + 100 SMS/day + Jio apps + Netflix', isPopular: true },
    { id: 21, amount: 499, data: '2GB/day', validity: '56 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'jio', benefits: 'Unlimited calls + 100 SMS/day + Jio apps', isPopular: false },
    { id: 22, amount: 599, data: '3GB/day', validity: '56 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'jio', benefits: 'Unlimited calls + 100 SMS/day + Jio apps', isPopular: true },
    { id: 23, amount: 799, data: '2GB/day', validity: '84 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'jio', benefits: 'Unlimited calls + 100 SMS/day + Jio apps', isPopular: false },
    { id: 24, amount: 999, data: '3GB/day', validity: '84 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'jio', benefits: 'Unlimited calls + 100 SMS/day + Jio apps', isPopular: true },
    { id: 25, amount: 1499, data: '2GB/day', validity: '180 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'jio', benefits: 'Unlimited calls + 100 SMS/day + Jio apps', isPopular: false },
    { id: 26, amount: 1999, data: '3GB/day', validity: '365 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'jio', benefits: 'Unlimited calls + 100 SMS/day + Jio apps', isPopular: false },
    // Vi Plans
    { id: 27, amount: 10, data: 'Talktime', validity: '1 day', calls: '₹10 talktime', type: 'talktime', operator: 'vi', benefits: 'Get ₹10 talktime instantly', isPopular: false },
    { id: 28, amount: 20, data: 'Talktime', validity: '1 day', calls: '₹20 talktime', type: 'talktime', operator: 'vi', benefits: 'Get ₹20 talktime instantly', isPopular: false },
    { id: 29, amount: 50, data: 'Talktime', validity: '1 day', calls: '₹50 talktime', type: 'talktime', operator: 'vi', benefits: 'Get ₹50 talktime instantly', isPopular: false },
    { id: 30, amount: 100, data: 'Talktime', validity: '1 day', calls: '₹100 talktime', type: 'talktime', operator: 'vi', benefits: 'Get ₹100 talktime instantly', isPopular: true },
    { id: 31, amount: 199, data: '2GB/day', validity: '28 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'vi', benefits: 'Unlimited calls + 100 SMS/day', isPopular: true },
    { id: 32, amount: 299, data: '2GB/day', validity: '28 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'vi', benefits: 'Unlimited calls + 100 SMS/day + Vi Movies', isPopular: false },
    { id: 33, amount: 399, data: '3GB/day', validity: '28 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'vi', benefits: 'Unlimited calls + 100 SMS/day + Amazon Prime', isPopular: true },
    { id: 34, amount: 499, data: '2GB/day', validity: '56 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'vi', benefits: 'Unlimited calls + 100 SMS/day', isPopular: false },
    { id: 35, amount: 599, data: '3GB/day', validity: '56 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'vi', benefits: 'Unlimited calls + 100 SMS/day', isPopular: true },
    { id: 36, amount: 799, data: '2GB/day', validity: '84 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'vi', benefits: 'Unlimited calls + 100 SMS/day', isPopular: false },
    { id: 37, amount: 999, data: '3GB/day', validity: '84 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'vi', benefits: 'Unlimited calls + 100 SMS/day', isPopular: true },
    // BSNL Plans
    { id: 38, amount: 10, data: 'Talktime', validity: '1 day', calls: '₹10 talktime', type: 'talktime', operator: 'bsnl', benefits: 'Get ₹10 talktime instantly', isPopular: false },
    { id: 39, amount: 20, data: 'Talktime', validity: '1 day', calls: '₹20 talktime', type: 'talktime', operator: 'bsnl', benefits: 'Get ₹20 talktime instantly', isPopular: false },
    { id: 40, amount: 50, data: 'Talktime', validity: '1 day', calls: '₹50 talktime', type: 'talktime', operator: 'bsnl', benefits: 'Get ₹50 talktime instantly', isPopular: false },
    { id: 41, amount: 100, data: 'Talktime', validity: '1 day', calls: '₹100 talktime', type: 'talktime', operator: 'bsnl', benefits: 'Get ₹100 talktime instantly', isPopular: true },
    { id: 42, amount: 199, data: '2GB/day', validity: '28 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'bsnl', benefits: 'Unlimited calls + 100 SMS/day', isPopular: true },
    { id: 43, amount: 299, data: '2GB/day', validity: '56 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'bsnl', benefits: 'Unlimited calls + 100 SMS/day', isPopular: false },
    { id: 44, amount: 499, data: '2GB/day', validity: '84 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'bsnl', benefits: 'Unlimited calls + 100 SMS/day', isPopular: true },
    { id: 45, amount: 999, data: '2GB/day', validity: '180 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'bsnl', benefits: 'Unlimited calls + 100 SMS/day', isPopular: false },
    { id: 46, amount: 1499, data: '2GB/day', validity: '365 days', calls: 'Unlimited', sms: 100, type: 'data', operator: 'bsnl', benefits: 'Unlimited calls + 100 SMS/day', isPopular: false }
  ];

  // Filter plans based on operator, amount, and filter type
  const getFilteredPlans = () => {
    let filtered = allPlans;
    
    if (operator) {
      filtered = filtered.filter(plan => plan.operator === operator);
    }
    
    if (activeFilter === 'data') {
      filtered = filtered.filter(plan => plan.type === 'data');
    } else if (activeFilter === 'talktime') {
      filtered = filtered.filter(plan => plan.type === 'talktime');
    }
    
    if (amount && parseFloat(amount) > 0) {
      const exactMatch = filtered.find(plan => plan.amount === parseFloat(amount));
      if (exactMatch) return [exactMatch];
      return filtered.filter(plan => quickAmounts.includes(plan.amount)).slice(0, 8);
    }
    
    // Show all plans when no amount is entered
    return filtered.filter(plan => quickAmounts.includes(plan.amount));
  };

  const filteredPlans = getFilteredPlans();
  // Show all plans when showAllPlans is true, otherwise show first 6
  const displayPlans = showAllPlans ? filteredPlans : filteredPlans.slice(0, 6);

  // Add these helper functions before processPaymentWithBreakdown

const getPaymentMethod = () => {
  if (selectedPaymentType === 'bank') return 'bank';
  if (selectedPaymentType === 'gems_only') return 'gems';
  if (selectedPaymentType === 'reserve_pay') return 'reserve_pay';
  if (selectedPaymentType === 'gems_and_lite') return 'gems_and_lite';
  if (selectedPaymentType === 'gems_and_bank') return 'gems_and_bank';
  return 'unknown';
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

  // In MobileRechargePage.jsx, update the processPaymentWithBreakdown function:

// Replace the processPaymentWithBreakdown function in MobileRechargePage.jsx

const processPaymentWithBreakdown = async (breakdown) => {
  const rechargeAmount = parseFloat(amount);
  const { gemsAmount, bankAmount, reserveAmount } = breakdown;
  
  // CASHBACK ONLY WHEN NO GEMS USED AND NO RESERVE PAY USED
  // If ANY gems are used OR reserve pay is used -> NO cashback
  const cashbackEarned = (gemsAmount === 0 && reserveAmount === 0) ? calculateCashback(rechargeAmount) : 0;
  
  console.log('=== PROCESS PAYMENT ===');
  console.log('gemsAmount:', gemsAmount);
  console.log('reserveAmount:', reserveAmount);
  console.log('bankAmount:', bankAmount);
  console.log('cashbackEarned:', cashbackEarned);
  
  setPayLoading(true);
  
  try {
    let paymentFailed = false;
    let failureReason = '';
    
    // For bank payments, check balance
    if (bankAmount > 0 && selectedPaymentMethod) {
      const currentBalance = bankBalances[selectedPaymentMethod.id] || 0;
      if (bankAmount > currentBalance) {
        paymentFailed = true;
        failureReason = `Insufficient balance in ${selectedPaymentMethod.bank_name}`;
      }
    }
    
    // For reserve pay, check limit
    if (reserveAmount > 0 && universalReserveLimit && !paymentFailed) {
      const availableLimit = universalReserveLimit.monthly_limit - (universalReserveLimit.current_spent || 0);
      if (reserveAmount > availableLimit) {
        paymentFailed = true;
        failureReason = `Insufficient SabAI Pay Lite limit. Available: ₹${availableLimit.toLocaleString()}`;
      }
    }
    
    if (paymentFailed) {
      // Create failed transaction record
      const failedTransaction = {
        transactionId: `RCH_FAILED_${Date.now()}`,
        type: 'recharge',
        amount: rechargeAmount,
        description: `Mobile recharge for ${mobileNumber} - FAILED`,
        status: 'failed',
        failure_reason: failureReason,
        payment_method_display: getPaymentDisplay(),
        payment_breakdown: { gemsAmount, bankAmount, reserveAmount }
      };
      
      await addTransaction(failedTransaction);
      
      setFailedTransactionResult(failedTransaction);
      setShowFailedAnimation(true);
      setPayLoading(false);
      return;
    }
    
    // STEP 1: DEDUCT GEMS IF USED (this is correct)
    if (gemsAmount > 0) {
      console.log(`Deducting ${gemsAmount} gems from balance`);
      await updateCoinBalance(gemsAmount, false);  // false = deduct
    }
    
    // STEP 2: DEDUCT FROM RESERVE PAY IF USED
    if (reserveAmount > 0 && universalReserveLimit) {
      console.log(`Using reserve pay: ₹${reserveAmount}`);
      const limits = await getReserveLimits();
      const updatedLimits = limits.map(limit => {
        if (limit.id === universalReserveLimit.id) {
          return { ...limit, current_spent: (limit.current_spent || 0) + reserveAmount };
        }
        return limit;
      });
      await setReserveLimits(updatedLimits);
    }
    
    // STEP 3: DEDUCT FROM BANK IF USED
    if (bankAmount > 0 && selectedPaymentMethod) {
      console.log(`Using bank: ₹${bankAmount} from ${selectedPaymentMethod.bank_name}`);
      await updateBankBalance(selectedPaymentMethod.id, bankAmount, false);
    }
    
    // STEP 4: ADD CASHBACK ONLY IF EARNED
    // Cashback is ONLY earned when:
    // - gemsAmount === 0 (no gems used)
    // - reserveAmount === 0 (no reserve pay used)
    if (cashbackEarned > 0) {
      console.log(`Adding cashback: ${cashbackEarned} gems`);
      await updateCoinBalance(cashbackEarned, true);
    } else {
      console.log(`No cashback earned (gems used: ${gemsAmount > 0}, reserve used: ${reserveAmount > 0})`);
    }
    
    const selectedOperator = operators.find(o => o.id === operator);
    
    // Save transaction with correct values
    const transaction = await addTransaction({
      transactionId: `RCH${Date.now()}`,
      type: 'recharge',
      amount: rechargeAmount,
      description: `Mobile recharge for ${mobileNumber}`,
      mobileNumber: mobileNumber,
      operator: selectedOperator?.name,
      operatorId: operator,
      circle: circle,
      payment_method: getPaymentMethod(),
      payment_method_display: getPaymentDisplay(),
      payment_breakdown: { gemsAmount, bankAmount, reserveAmount },
      bank_name: selectedPaymentMethod?.bank_name,
      bank_id: selectedPaymentMethod?.id,
      cashback_earned: cashbackEarned,
      gems_used: gemsAmount,  // Record how many gems were used
      status: 'success',
      date: new Date().toISOString()
    });
    
    // Save to recent recharges
    await addRecentRecharge({
      mobile_number: mobileNumber,
      operator: selectedOperator?.name,
      operator_id: operator,
      amount: rechargeAmount,
      circle: circle,
      transaction_id: transaction.transactionId,
      cashback_earned: cashbackEarned,
      payment_method: getPaymentMethod(),
      gems_used: gemsAmount
    });
    
    setTransactionDetails({
      ...transaction,
      cashback: cashbackEarned,
      mobileNumber: mobileNumber,
      amount: rechargeAmount,
      payment_method_display: getPaymentDisplay(),
      gems_used: gemsAmount
    });
    
    setShowSuccess(true);
    setPayLoading(false);
    setSelectedPaymentType(null);
    setSelectedPaymentMethod(null);
    setPayStep(1);
    
    // Show appropriate message
    if (cashbackEarned > 0) {
      toast.success(`Recharge successful! +${cashbackEarned} 🪙 earned!`);
    } else if (gemsAmount > 0) {
      toast.success(`Recharge successful! ${gemsAmount} 🪙 used!`);
    } else if (reserveAmount > 0) {
      toast.success(`Recharge successful! ₹${rechargeAmount} paid via SabAI Pay Lite!`);
    } else {
      toast.success(`Recharge successful!`);
    }
    
    // Refresh data
    await loadRecentNumbers();
    await loadBankBalances();
    await loadSabaiGems();
    
  } catch (error) {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again.');
    setPayLoading(false);
  }
};
  // Load data on mount
  useEffect(() => {
    loadBankAccounts();
    loadBankBalances();
    loadSabaiGems();
    loadUniversalReserveLimit();
    loadRecentNumbers();
    loadRechargeAutoPayOrders(); // Make sure this is called
    
    // Listen for auto-pay updates
    const handleAutoPayUpdate = () => {
        loadRechargeAutoPayOrders();
    };
    window.addEventListener('rechargeAutoPayUpdated', handleAutoPayUpdate);
    
    return () => {
        window.removeEventListener('rechargeAutoPayUpdated', handleAutoPayUpdate);
    };
}, []);

  useEffect(() => {
    console.log('Circle state changed to:', circle);
}, [circle]);

  const loadBankAccounts = async () => {
    const accounts = await getBankAccounts();
    setLinkedBanks(accounts);
};

const loadBankBalances = async () => {
    const balances = await getBankBalances();
    setBankBalances(balances);
};

const loadSabaiGems = async () => {
    const gems = await getCoinBalance();
    setSabaiGems(gems);
};

const loadUniversalReserveLimit = async () => {
    const limits = await getReserveLimits();
    const universalLimit = limits.find(l => l.merchant === 'sabai-pay-lite');
    setUniversalReserveLimit(universalLimit);
};

const loadRechargeAutoPayOrders = async () => {
    try {
        console.log('Loading recharge auto-pay orders...');
        const allOrders = await getAutoPayOrders();
        console.log('All orders from API:', allOrders);
        
        // Filter for recharge orders that are active
        const rechargeOrders = allOrders.filter(order => order.isRecharge === true && order.status === 'active');
        console.log('Filtered recharge orders:', rechargeOrders);
        
        setRechargeAutoPayOrders(rechargeOrders);
        
        // Also update the parent autoPayOrders state if needed
        // This ensures consistency across the component
        if (rechargeOrders.length > 0) {
            console.log(`Found ${rechargeOrders.length} recharge auto-pay orders`);
        }
    } catch (error) {
        console.error('Failed to load recharge auto-pay orders:', error);
        setRechargeAutoPayOrders([]);
    }
};

// Handle edit auto-pay
const handleEditAutoPay = (order) => {
  setEditingAutoPayOrder(order);
  setMobileNumber(order.mobileNumber);
  setOperator(order.operator);
  setCircle(order.circle || '');
  setAmount(order.amount.toString());
  setSelectedPlan(null);
  setShowEditAutoPayModal(true);
};

// Handle delete auto-pay
const handleDeleteAutoPay = async (orderId, mobileNumber) => {
  if (window.confirm(`Are you sure you want to remove auto-pay for ${mobileNumber}?`)) {
    try {
      await deleteAutoPayOrder(orderId);
      toast.success(`Auto-pay removed for ${mobileNumber}`);
      await loadRechargeAutoPayOrders();
      // Also refresh in ReservePayPage
      window.dispatchEvent(new CustomEvent('rechargeAutoPayUpdated'));
    } catch (error) {
      console.error('Failed to delete auto-pay:', error);
      toast.error('Failed to delete auto-pay');
    }
  }
};

// Handle update auto-pay
const handleUpdateAutoPay = async () => {
  if (!editingAutoPayOrder) return;
  
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    toast.error('Please enter a valid amount');
    return;
  }
  
  setLoading(true);
  
  try {
    // Delete old order
    await deleteAutoPayOrder(editingAutoPayOrder.id);
    
    // Create new order with updated details
    const dueDate = new Date();
    dueDate.setDate(editingAutoPayOrder.dateValue);
    dueDate.setHours(9, 0, 0, 0);
    
    const mysqlFormattedDate = dueDate.getFullYear() + '-' + 
      String(dueDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(dueDate.getDate()).padStart(2, '0') + ' ' +
      String(dueDate.getHours()).padStart(2, '0') + ':' +
      String(dueDate.getMinutes()).padStart(2, '0') + ':' +
      String(dueDate.getSeconds()).padStart(2, '0');
    
    const newOrder = {
      orderId: `AP_RCH_${Date.now()}`,
      type: 'recharge',
      merchant: 'recharge',
      merchantName: `${operators.find(o => o.id === operator)?.name} Recharge`,
      amount: amountNum,
      schedule: 'monthly',
      dateValue: editingAutoPayOrder.dateValue,
      time: editingAutoPayOrder.time || '09:00',
      paymentMethod: editingAutoPayOrder.paymentMethod,
      bankAccountId: editingAutoPayOrder.bankAccountId,
      bankName: editingAutoPayOrder.bankName,
      bankAccountLast4: editingAutoPayOrder.bankAccountLast4,
      status: 'active',
      nextExecution: mysqlFormattedDate,
      isRecharge: true,
      mobileNumber: mobileNumber,
      operator: operator,
      operatorName: operators.find(o => o.id === operator)?.name,
      circle: circle,
      reminderDays: editingAutoPayOrder.reminderDays || 3
    };
    
    await addAutoPayOrder(newOrder);
    
    toast.success(`Auto-pay updated for ${mobileNumber}`);
    setShowEditAutoPayModal(false);
    setEditingAutoPayOrder(null);
    await loadRechargeAutoPayOrders();
    
    // Refresh ReservePayPage
    window.dispatchEvent(new CustomEvent('rechargeAutoPayUpdated'));
    
  } catch (error) {
    console.error('Failed to update auto-pay:', error);
    toast.error('Failed to update auto-pay');
  } finally {
    setLoading(false);
  }
};

const loadRecentNumbers = async () => {
    try {
        const allTransactions = await getTransactions();
        console.log('All transactions:', allTransactions);
        
        const rechargeNumbers = [];
        
        allTransactions.forEach(tx => {
            if (tx.type === 'recharge' && tx.status === 'success') {
                const mobileNum = tx.mobileNumber || tx.mobile_number;
                if (mobileNum) {
                    // DON'T set any default - use the actual circle from transaction
                    // If it's NULL, keep it as NULL (don't replace with default)
                    let circleValue = tx.circle;
                    
                    // Only try to get from previous transactions if current is NULL
                    // But still don't use default - let it be empty
                    if (!circleValue || circleValue === 'NULL' || circleValue === null) {
                        // Try to get from previous transactions for same number
                        const previousTx = allTransactions.find(t => 
                            (t.mobileNumber === mobileNum || t.mobile_number === mobileNum) && 
                            t.circle && t.circle !== 'NULL' && t.circle !== null
                        );
                        // Use previous circle if found, otherwise leave as empty string
                        circleValue = previousTx?.circle || '';
                    }
                    
                    rechargeNumbers.push({
                        mobileNumber: mobileNum,
                        operator: tx.operator,
                        operatorId: tx.operatorId || (tx.operator === 'Airtel' ? 'airtel' : 
                                                      tx.operator === 'Jio' ? 'jio' : 
                                                      tx.operator === 'Vi' ? 'vi' : 'bsnl'),
                        operatorName: tx.operator,
                        circle: circleValue,  // This will be empty string if no circle found
                        lastAmount: tx.amount,
                        lastDate: tx.created_at || tx.date,
                        transactionCount: 1
                    });
                }
            }
        });
        
        // Deduplicate by mobile number
        const uniqueNumbers = new Map();
        rechargeNumbers.forEach(num => {
            if (!uniqueNumbers.has(num.mobileNumber) || 
                new Date(num.lastDate) > new Date(uniqueNumbers.get(num.mobileNumber).lastDate)) {
                uniqueNumbers.set(num.mobileNumber, num);
            }
        });
        
        const uniqueList = Array.from(uniqueNumbers.values());
        uniqueList.sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
        
        console.log('Recent numbers with actual circles:', uniqueList);
        setRecentNumbers(uniqueList.slice(0, 8));
        
    } catch (error) {
        console.error('Failed to load recent numbers:', error);
        setRecentNumbers([]);
    }
};

// Helper functions for backward compatibility
const hasUpiPinHelper = async (bankId) => {
    return await storageService.hasUpiPin(bankId);
};

const verifyBankPinHelper = async (bankId, enteredPin) => {
    return await storageService.verifyBankPin(bankId, enteredPin);
};

const updateCoinBalanceHelper = async (amount, isEarning = true) => {
    return await storageService.updateCoinBalance(amount, isEarning);
};


  const getBankBalance = (bankId) => bankBalances[bankId] || 0;

const hasUpiPin = (bankId) => {
    return hasUpiPinHelper(bankId);  // Use the imported helper
};

const verifyBankPin = (bankId, enteredPin) => {
    return verifyBankPinHelper(bankId, enteredPin);  // Use the imported helper
};

  const updateBankBalance = async (bankId, amount, isDeposit = true) => {
    return await storageService.updateBankBalance(bankId, amount, isDeposit);
};

const updateCoinBalance = async (amount, isEarning = true) => {
    return await storageService.updateCoinBalance(amount, isEarning);
};

  const updateSabaiGems = (amount, isEarning = false) => {
    const newBalance = updateCoinBalanceHelper(amount, isEarning);  // Use the imported helper
    setSabaiGems(newBalance);
    return newBalance;
};

  const updateReserveLimitSpent = (limitId, amount) => {
    const limits = getReserveLimits();
    const updatedLimits = limits.map(limit => {
        if (limit.id === limitId) {
            return {
                ...limit,
                current_spent: (limit.current_spent || 0) + amount,
                updated_at: new Date().toISOString()
            };
        }
        return limit;
    });
    const setReserveLimits = async (limits) => {
    return await storageService.setReserveLimits(limits);
}; // Use the imported setter
    loadUniversalReserveLimit();
    window.dispatchEvent(new Event('reservePayUpdated'));
    return updatedLimits;
};

  const getAvailableReserveLimit = () => {
    if (!universalReserveLimit) return 0;
    return universalReserveLimit.monthly_limit - (universalReserveLimit.current_spent || 0);
  };

  const saveTransaction = (txnData) => {
    const newTransaction = {
        id: Date.now(),
        transactionId: `RCH${Date.now()}${Math.floor(Math.random() * 1000)}`,
        type: 'recharge',
        amount: txnData.amount,
        description: `Mobile recharge for ${txnData.mobileNumber}`,
        merchant: txnData.operator,
        mobileNumber: txnData.mobileNumber,
        operator: txnData.operator,
        operatorId: txnData.operatorId,
        circle: txnData.circle,
        payment_method: txnData.payment_method,
        payment_method_display: txnData.payment_method_display,
        payment_breakdown: txnData.payment_breakdown,
        bank_name: txnData.bank_name,
        bank_id: txnData.bank_id,
        account_suffix: txnData.account_suffix,
        date: new Date().toISOString(),
        status: 'success',
        cashback: txnData.cashback || 0
    };
    
    addTransaction(newTransaction);  // Use the imported helper
    loadRecentNumbers();
    
    return newTransaction;
};

  const handleGemsAndLitePayment = () => {
  const rechargeAmount = parseFloat(amount);
  const gemsToUse = paymentBreakdown.gemsAmount;
  const remainingAfterGems = rechargeAmount - gemsToUse;
  const availableReserveLimit = getAvailableReserveLimit();
  
  if (gemsToUse <= 0) {
    toast.error('Please enter amount of Gems to use');
    return;
  }
  
  if (remainingAfterGems <= 0) {
    toast.error('Please use less Gems so remaining amount can be paid with SabAI Pay Lite');
    return;
  }
  
  if (availableReserveLimit < remainingAfterGems) {
    toast.error(`Insufficient Reserve Pay limit for remaining amount. Available: ₹${availableReserveLimit.toLocaleString()}`);
    return;
  }
  
  setPendingPaymentData({
    type: 'gems_and_lite',
    method: null,
    amount: rechargeAmount,
    cashbackEarned: 0, // No cashback when using Gems
    paymentBreakdown: {
      ...paymentBreakdown,
      gemsAmount: gemsToUse,
      reserveAmount: remainingAfterGems,
      bankAmount: 0,
      remainingAfterGems: remainingAfterGems
    }
  });
  setShowConfirmModal(true);
};

  // Sync auto-pay with Reserve Pay
  const syncAutoPayWithReservePay = (rechargeData, isActive) => {
    const autoPayOrders = getAutoPayOrders();  // Changed from localStorage
    
    if (isActive && rechargeData) {
        // ... rest of the function
        setAutoPayOrders(autoPayOrders);  // Use the imported setter
        loadRechargeAutoPayOrders();
    } else {
        const updatedOrders = autoPayOrders.filter(order => order.mobileNumber !== rechargeData.mobileNumber);
        setAutoPayOrders(updatedOrders);  // Use the imported setter
        loadRechargeAutoPayOrders();
    }
};

  // Remove auto-pay order after manual payment
 const removeAutoPayOrder = (mobileNumber) => {
    const autoPayOrders = getAutoPayOrders();  // Changed from localStorage
    const updatedOrders = autoPayOrders.filter(order => order.mobileNumber !== mobileNumber);
    setAutoPayOrders(updatedOrders);  // Use the imported setter
    loadRechargeAutoPayOrders();
    toast.success(`Auto-pay removed for ${mobileNumber} as it has been manually recharged`);
};

  const validateForm = () => {
    const newErrors = {};

    if (!mobileNumber) {
        newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
        newErrors.mobileNumber = 'Enter a valid 10-digit mobile number';
    }

    if (!operator) {
        newErrors.operator = 'Please select an operator';
    }

    if (!circle) {
        newErrors.circle = 'Please select your circle';
    }

    // Don't validate plan/amount here - let the payment button handle it
    // This allows plan selection to work

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

  const handlePlanSelect = (plan) => {
    console.log('Plan selected:', plan);
    
    // Set the amount first
    setAmount(plan.amount.toString());
    setSelectedPlan(plan);
    
    // Check if we have all required fields
    if (!mobileNumber) {
        toast.error('Please enter mobile number first');
        return;
    }
    if (!operator) {
        toast.error('Please select operator first');
        return;
    }
    if (!circle) {
        toast.error('Please select circle first');
        return;
    }
    
    // Proceed to payment step
    setStep(2);
    setPaymentBreakdown({
        gemsAmount: 0,
        reserveAmount: 0,
        bankAmount: 0,
        totalAmount: parseFloat(plan.amount),
        rechargeAmount: parseFloat(plan.amount),
        remainingAfterGems: parseFloat(plan.amount)
    });
};

  const handlePlanDetails = (plan) => {
    setSelectedPlanForDetails(plan);
    setShowPlanDetails(true);
  };

  const handleProceedToPayment = () => {
    // Check if we have a selected plan OR a custom amount
    if (!selectedPlan && !amount) {
        toast.error('Please select a plan or enter an amount');
        return;
    }

     console.log('=== PROCEED TO PAYMENT ===');
    console.log('Circle before proceeding:', circle);
    
    // Check required fields
    if (!mobileNumber) {
        toast.error('Please enter mobile number');
        return;
    }
    if (!operator) {
        toast.error('Please select operator');
        return;
    }
    if (!circle) {
        toast.error('Please select circle');
        return;
    }
    
    const numAmount = selectedPlan ? selectedPlan.amount : parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
        toast.error('Please enter a valid amount');
        return;
    }
    
    // If we have a selected plan but amount is different, use plan amount
    if (selectedPlan && (!amount || parseFloat(amount) !== selectedPlan.amount)) {
        setAmount(selectedPlan.amount.toString());
    }
    
    setSelectedPlan(selectedPlan || { 
        amount: numAmount, 
        type: 'custom', 
        data: 'Custom Amount', 
        validity: 'Custom',
        benefits: 'Custom recharge amount'
    });
    
    setStep(2);
    setPaymentBreakdown({
        gemsAmount: 0,
        reserveAmount: 0,
        bankAmount: 0,
        totalAmount: numAmount,
        rechargeAmount: numAmount,
        remainingAfterGems: numAmount
    });
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

  const handleNumberClick = (numberData) => {
    console.log('Number clicked:', numberData);
    
    const mobileNum = numberData.mobileNumber;
    if (!mobileNum) {
        console.error('No mobile number found in:', numberData);
        return;
    }
    
    setMobileNumber(mobileNum);
    setOperator(numberData.operatorId);
    
    // Set circle from the clicked data - NO DEFAULT
    if (numberData.circle && numberData.circle !== '') {
        setCircle(numberData.circle);
        console.log('Circle set from clicked data:', numberData.circle);
    } else {
        // If no circle in data, set empty string (user will need to select)
        setCircle('');
        console.log('No circle found in clicked data, user must select');
    }
    
    setSelectedHistoryNumber(numberData);
    setShowRechargeHistory(true);
};

  const handleRechargeAgain = (numberData) => {
    console.log('Recharge again with data:', numberData);
    
    const mobileNum = numberData.mobileNumber;
    setMobileNumber(mobileNum);
    setOperator(numberData.operatorId);
    
    // Set circle from the passed data - NO DEFAULT
    if (numberData.circle && numberData.circle !== '') {
        setCircle(numberData.circle);
        console.log('Circle set from database in recharge again:', numberData.circle);
    } else {
        setCircle('');
        console.log('No circle in recharge data');
    }
    
    setAmount('');
    setSelectedPlan(null);
    setStep(1);
    setShowRechargeHistory(false);
};

  const handleGemsAmountChange = (gemsToUse) => {
    const rechargeAmount = parseFloat(amount);
    const maxGemsToUse = Math.min(sabaiGems, rechargeAmount);
    const validGems = Math.min(gemsToUse, maxGemsToUse);
    const remainingAfterGems = rechargeAmount - validGems;
    
    setPaymentBreakdown({
      gemsAmount: validGems,
      reserveAmount: 0,
      bankAmount: remainingAfterGems,
      totalAmount: rechargeAmount,
      rechargeAmount: rechargeAmount,
      remainingAfterGems: remainingAfterGems
    });
  };

  const handlePaymentMethodSelect = (type, method = null) => {
  const rechargeAmount = parseFloat(amount);
  const remainingAfterGems = paymentBreakdown.remainingAfterGems;
  const availableReserveLimit = getAvailableReserveLimit();
  
  setSelectedPaymentType(type);
  setSelectedPaymentMethod(method);
  
  if (type === 'gems_only') {
    if (sabaiGems >= rechargeAmount) {
      setPendingPaymentData({
        type: 'gems_only',
        method: null,
        amount: rechargeAmount,
        cashbackEarned: 0,
        paymentBreakdown: {
          ...paymentBreakdown,
          gemsAmount: rechargeAmount,
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
    if (availableReserveLimit >= rechargeAmount) {
      setPendingPaymentData({
        type: 'reserve_pay',
        method: null,
        amount: rechargeAmount,
        cashbackEarned: calculateCashback(rechargeAmount),
        paymentBreakdown: {
          ...paymentBreakdown,
          gemsAmount: 0,
          reserveAmount: rechargeAmount,
          bankAmount: 0,
          remainingAfterGems: rechargeAmount
        }
      });
      setShowConfirmModal(true);
    } else {
      toast.error(`Insufficient Reserve Pay limit. Available: ₹${availableReserveLimit.toLocaleString()}`);
      setSelectedPaymentType(null);
    }
  } else if (type === 'gems_and_lite') {
    const gemsToUse = paymentBreakdown.gemsAmount;
    const remaining = rechargeAmount - gemsToUse;
    if (gemsToUse > 0 && remaining > 0 && availableReserveLimit >= remaining) {
      setPendingPaymentData({
        type: 'gems_and_lite',
        method: null,
        amount: rechargeAmount,
        cashbackEarned: 0,
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
    // For bank only, go to PIN step and use unified payment function
    setPayStep(2);
    // Set pendingPaymentData for bank only
    setPendingPaymentData({
      type: 'bank',
      method: method,
      amount: rechargeAmount,
      cashbackEarned: calculateCashback(rechargeAmount),
      paymentBreakdown: {
        ...paymentBreakdown,
        gemsAmount: 0,
        reserveAmount: 0,
        bankAmount: remainingAfterGems,
        remainingAfterGems: remainingAfterGems
      }
    });
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
      amount: rechargeAmount,
      cashbackEarned: 0,
      paymentBreakdown: {
        ...paymentBreakdown,
        gemsAmount: paymentBreakdown.gemsAmount,
        bankAmount: remainingAfterGems,
        reserveAmount: 0,
        remainingAfterGems: remainingAfterGems
      }
    });
    // For gems + bank, also go to PIN step
    setPayStep(2);
  }
};

  // frontend/src/pages/MobileRechargePage.jsx
// Update the handlePaymentMethodSelect function and confirmPayment function

// First, update the confirmPayment function (the main payment processor):

const confirmPayment = async () => {
  if (!pendingPaymentData) return;

  console.log('=== CONFIRM PAYMENT ===');
  console.log('pendingPaymentData:', pendingPaymentData);
  
  const { type, amount: rechargeAmount, paymentBreakdown: breakdownToUse } = pendingPaymentData;
  const { gemsAmount, reserveAmount, bankAmount } = breakdownToUse;
  
  // CRITICAL: Cashback is ONLY earned when:
  // 1. NO gems are used (gemsAmount === 0)
  // 2. NO reserve pay is used (reserveAmount === 0)
  // Cashback is NEVER earned when gems are used, even if also using bank
  const cashbackEarned = (gemsAmount === 0 && reserveAmount === 0) ? calculateCashback(rechargeAmount) : 0;
  
  console.log('gemsAmount:', gemsAmount);
  console.log('reserveAmount:', reserveAmount);
  console.log('bankAmount:', bankAmount);
  console.log('cashbackEarned:', cashbackEarned);
  
  setLoading(true);
  setShowConfirmModal(false);
  
  try {
    let paymentFailed = false;
    let failureReason = '';
    
    // Check for bank payment insufficient balance
    if (bankAmount > 0 && selectedPaymentMethod) {
      const currentBalance = bankBalances[selectedPaymentMethod.id] || 0;
      if (bankAmount > currentBalance) {
        paymentFailed = true;
        failureReason = `Insufficient balance in ${selectedPaymentMethod.bank_name}`;
      }
    }
    
    // Check for reserve pay insufficient limit
    if (reserveAmount > 0 && universalReserveLimit && !paymentFailed) {
      const availableLimit = getAvailableReserveLimit();
      if (reserveAmount > availableLimit) {
        paymentFailed = true;
        failureReason = `Insufficient SabAI Pay Lite limit. Available: ₹${availableLimit.toLocaleString()}`;
      }
    }
    
    if (paymentFailed) {
      // Handle failed payment
      const failedTransaction = {
        transactionId: `RCH_FAILED_${Date.now()}`,
        type: 'recharge',
        amount: rechargeAmount,
        description: `Mobile recharge for ${mobileNumber} - FAILED`,
        status: 'failed',
        failure_reason: failureReason,
        payment_method_display: getPaymentDisplay(),
        payment_breakdown: { gemsAmount, bankAmount, reserveAmount }
      };
      await addTransaction(failedTransaction);
      setFailedTransactionResult(failedTransaction);
      setShowFailedAnimation(true);
      setLoading(false);
      return;
    }
    
    // ============================================
    // STEP 1: DEDUCT GEMS IF USED (ALWAYS)
    // ============================================
    if (gemsAmount > 0) {
      console.log(`Deducting ${gemsAmount} gems from balance`);
      await updateCoinBalance(gemsAmount, false);  // false = deduct
    }
    
    // ============================================
    // STEP 2: DEDUCT FROM RESERVE PAY IF USED
    // ============================================
    if (reserveAmount > 0 && universalReserveLimit) {
      console.log(`Using reserve pay: ₹${reserveAmount}`);
      const limits = await getReserveLimits();
      const updatedLimits = limits.map(limit => {
        if (limit.id === universalReserveLimit.id) {
          return { ...limit, current_spent: (limit.current_spent || 0) + reserveAmount };
        }
        return limit;
      });
      await setReserveLimits(updatedLimits);
    }
    
    // ============================================
    // STEP 3: DEDUCT FROM BANK IF USED
    // ============================================
    if (bankAmount > 0 && selectedPaymentMethod) {
      console.log(`Using bank: ₹${bankAmount} from ${selectedPaymentMethod.bank_name}`);
      await updateBankBalance(selectedPaymentMethod.id, bankAmount, false);
    }
    
    // ============================================
    // STEP 4: ADD CASHBACK ONLY IF EARNED
    // Cashback is ONLY earned when:
    // - gemsAmount === 0 (no gems used)
    // - reserveAmount === 0 (no reserve pay used)
    // ============================================
    if (cashbackEarned > 0) {
      console.log(`Adding cashback: ${cashbackEarned} gems`);
      await updateCoinBalance(cashbackEarned, true);
    } else {
      console.log(`No cashback earned (gems used: ${gemsAmount > 0}, reserve used: ${reserveAmount > 0})`);
    }
    
    const selectedOperator = operators.find(o => o.id === operator);
    
    // Save transaction with correct values
    const transaction = await addTransaction({
      transactionId: `RCH${Date.now()}`,
      type: 'recharge',
      amount: rechargeAmount,
      description: `Mobile recharge for ${mobileNumber}`,
      mobileNumber: mobileNumber,
      operator: selectedOperator?.name,
      operatorId: operator,
      circle: circle,
      payment_method: type,
      payment_method_display: getPaymentDisplay(),
      payment_breakdown: { gemsAmount, bankAmount, reserveAmount },
      bank_name: selectedPaymentMethod?.bank_name,
      bank_id: selectedPaymentMethod?.id,
      cashback_earned: cashbackEarned,
      gems_used: gemsAmount,  // Record how many gems were used
      status: 'success',
      date: new Date().toISOString()
    });
    
    // Save to recent recharges
    await addRecentRecharge({
      mobile_number: mobileNumber,
      operator: selectedOperator?.name,
      operator_id: operator,
      amount: rechargeAmount,
      circle: circle,
      transaction_id: transaction.transactionId,
      cashback_earned: cashbackEarned,
      payment_method: type,
      gems_used: gemsAmount
    });
    
    setTransactionDetails({
      ...transaction,
      cashback: cashbackEarned,
      mobileNumber: mobileNumber,
      amount: rechargeAmount,
      payment_method_display: getPaymentDisplay(),
      gems_used: gemsAmount
    });
    
    setShowSuccess(true);
    setLoading(false);
    setSelectedPaymentType(null);
    setSelectedPaymentMethod(null);
    setPayStep(1);
    
    // Show appropriate message
    if (cashbackEarned > 0) {
      toast.success(`Recharge successful! +${cashbackEarned} 🪙 earned!`);
    } else if (gemsAmount > 0) {
      toast.success(`Recharge successful! ${gemsAmount} 🪙 used!`);
    } else if (reserveAmount > 0) {
      toast.success(`Recharge successful! ₹${rechargeAmount} paid via SabAI Pay Lite!`);
    } else {
      toast.success(`Recharge successful!`);
    }
    
    // Refresh data
    await loadRecentNumbers();
    await loadBankBalances();
    await loadSabaiGems();
    
  } catch (error) {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again.');
    setLoading(false);
  }
};
  const handleBankSelect = (bank) => {
    if (!hasUpiPin(bank.id)) {
      toast.error(`Please set UPI PIN for ${bank.bank_name} in Settings first`);
      return;
    }
    
    setSelectedPaymentMethod(bank);
    setSelectedPaymentType('bank');
    setPaymentBreakdown(prev => ({
      ...prev,
      bankAmount: prev.remainingAfterGems,
      reserveAmount: 0
    }));
    setPayStep(2);
    setTimeout(() => {
      pinInputRefs.current[0]?.focus();
    }, 100);
  };

  const handlePinChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newPin = [...pinDigits];
    newPin[index] = value || '';
    setPinDigits(newPin);
    
    const newFilled = [...pinFilled];
    newFilled[index] = value !== '';
    setPinFilled(newFilled);
    
    if (value && index < 3) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const processPayment = async () => {
  const pinString = pinDigits.join('');
  if (pinString.length !== 4) {
    setPinError('Please enter complete PIN');
    return;
  }

  if (!verifyBankPin(selectedPaymentMethod.id, pinString)) {
    setPinError('Incorrect PIN. Please try again.');
    setPinDigits(['', '', '', '']);
    setPinFilled([false, false, false, false]);
    pinInputRefs.current[0]?.focus();
    return;
  }

  const rechargeAmount = parseFloat(amount);
  const { gemsAmount, reserveAmount, bankAmount } = paymentBreakdown;
  
  setLoading(true);
  
  setTimeout(() => {
    try {
      let paymentFailed = false;
      let failureReason = '';
      let availableBalance = 0;
      
      // Check for insufficient balance BEFORE processing
      if (bankAmount > 0) {
        const currentBalance = bankBalances[selectedPaymentMethod.id] || 0;
        availableBalance = currentBalance;
        if (bankAmount > currentBalance) {
          paymentFailed = true;
          failureReason = `Insufficient balance in ${selectedPaymentMethod.bank_name}`;
        }
      }
      
      if (paymentFailed) {
        let paymentMethodDisplay = '';
        if (gemsAmount > 0) {
          paymentMethodDisplay += `${gemsAmount} GEMS `;  // Use "GEMS" text instead of HTML
        }
        if (bankAmount > 0) {
          paymentMethodDisplay += `${bankAmount > 0 && gemsAmount > 0 ? '+' : ''} ₹${bankAmount} (${selectedPaymentMethod.bank_name})`;
        }
        
        const selectedOperator = operators.find(o => o.id === operator);
        
        // Create failed transaction record
        const failedTransaction = {
          id: Date.now(),
          transactionId: `RCH_FAILED_${Date.now()}`,
          type: 'recharge',
          amount: rechargeAmount,
          description: `Mobile recharge for ${mobileNumber} - FAILED`,
          merchant: selectedOperator?.name,
          mobileNumber: mobileNumber,
          operator: selectedOperator?.name,
          operatorId: operator,
          circle: circle,
          payment_method: 'failed',
          payment_method_display: paymentMethodDisplay.trim() || 'Bank Transfer',
          payment_breakdown: { gemsAmount, bankAmount, reserveAmount },
          bank_name: selectedPaymentMethod?.bank_name,
          bank_id: selectedPaymentMethod?.id,
          date: new Date().toISOString(),
          status: 'failed',
          cashback: 0,
          failure_reason: failureReason,
          available_balance: availableBalance
        };
        
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        transactions.unshift(failedTransaction);
        localStorage.setItem('transactions', JSON.stringify(transactions.slice(0, 200)));
        
        setFailedTransactionResult({
          ...failedTransaction,
          amount: rechargeAmount,
          mobileNumber: mobileNumber,
          payment_method_display: paymentMethodDisplay.trim() || 'Bank Transfer',
          failure_reason: failureReason
        });
        
        setShowSuccess(false);
        setLoading(false);
        setShowFailedAnimation(true);
        
        setSelectedPaymentType(null);
        setSelectedPaymentMethod(null);
        setPayStep(1);
        setPinDigits(['', '', '', '']);
        setPinFilled([false, false, false, false]);
        
        return;
      }
      
      // Process successful payment
      let paymentMethodDisplay = '';
      
      if (gemsAmount > 0) {
        updateSabaiGems(gemsAmount, false);
        paymentMethodDisplay += `${gemsAmount} GEMS `;  // Use "GEMS" text
      }
      
      if (reserveAmount > 0 && universalReserveLimit) {
        updateReserveLimitSpent(universalReserveLimit.id, reserveAmount);
        paymentMethodDisplay += `${reserveAmount > 0 && gemsAmount > 0 ? '+' : ''} ₹${reserveAmount} SabAI Pay Lite `;
      }
      
      if (bankAmount > 0) {
        updateBankBalance(selectedPaymentMethod.id, bankAmount);
        paymentMethodDisplay += `${bankAmount > 0 && (gemsAmount > 0 || reserveAmount > 0) ? '+' : ''} ₹${bankAmount} (${selectedPaymentMethod.bank_name})`;
      }
      
      const cashbackEarned = (gemsAmount === 0 && reserveAmount === 0) ? calculateCashback(rechargeAmount) : 0;
      
      if (cashbackEarned > 0) {
        updateSabaiGems(cashbackEarned, true);
      }
      
      const selectedOperator = operators.find(o => o.id === operator);
      
      const txn = saveTransaction({
        amount: rechargeAmount,
        mobileNumber,
        operator: selectedOperator?.name,
        operatorId: operator,
        circle: circle,
        payment_method: 'combined',
        payment_method_display: paymentMethodDisplay.trim(),
        payment_breakdown: { gemsAmount, bankAmount, reserveAmount },
        bank_name: selectedPaymentMethod?.bank_name,
        bank_id: selectedPaymentMethod?.id,
        account_suffix: selectedPaymentMethod?.account_number?.slice(-4),
        cashback: 0,
        status: 'success'
      });

      // If this was an auto-pay order, remove it from auto-pay
      const autoPayOrders = JSON.parse(localStorage.getItem('autoPayOrders') || '[]');
      const existingOrder = autoPayOrders.find(o => o.mobileNumber === mobileNumber && o.isRecharge === true);
      if (existingOrder && existingOrder.status === 'active') {
        removeAutoPayOrder(mobileNumber);
      }

      setTransactionDetails({
        ...txn,
        cashback: cashbackEarned,
        mobileNumber,
        amount: rechargeAmount,
        payment_method_display: paymentMethodDisplay.trim()
      });

      setShowSuccess(true);
      setLoading(false);
      setSelectedPaymentType(null);
      setSelectedPaymentMethod(null);
      setPayStep(1);
      setPinDigits(['', '', '', '']);
      setPinFilled([false, false, false, false]);
      
      toast.success(`Recharge successful! ${cashbackEarned > 0 ? `+${cashbackEarned} 🪙 earned!` : ''}`);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setLoading(false);
    }
  }, 1500);
};
  // Auto-Pay Handlers
  const handleAutoPaySetup = () => {
    if (!validateForm()) return;
    let dayOfMonth = new Date().getDate();
    if (!selectedPlan && !amount) {
      toast.error('Please select a plan first');
      return;
    }
    
    const selectedOperator = operators.find(o => o.id === operator);
    setPendingAutoPayData({
      mobileNumber,
      operator,
      operatorName: selectedOperator?.name,
      amount: parseFloat(amount),
      circle:circle,
      dayOfMonth: dayOfMonth
    });
    setAutoPayPaymentMethod(null); // Reset to no selection
    setShowAutoPayModal(true);
  };

  const handleAutoPayMethodSelect = (method) => {
    if (method === 'reserve') {
      setAutoPayPaymentMethod('reserve');
    } else if (method === 'bank') {
      const banksWithPin = linkedBanks.filter(bank => hasUpiPin(bank.id));
      if (banksWithPin.length === 0) {
        toast.error('Please add a bank account with UPI PIN in Settings first');
        return;
      }
      setShowBankSelectionModal(true);
    }
  };

  const handleBankSelectForAutoPay = (bank) => {
    setSelectedBankForAutoPay(bank);
    setShowBankSelectionModal(false);
    setAutoPayPaymentMethod('bank');
    setShowPinModal(true);
  };

  const confirmAutoPayWithPin = () => {
    setShowPinModal(false);
    confirmAutoPaySetup();
  };

const confirmAutoPaySetup = async () => {
    if (!autoPayPaymentMethod) {
        toast.error('Please select a payment method');
        return;
    }
    
    const selectedOperator = operators.find(o => o.id === operator);
    const reminderSelect = document.getElementById('reminderDays');
    const reminderDays = reminderSelect ? parseInt(reminderSelect.value) : 3;
    
    // Get the day of month from pendingAutoPayData or use current date
    const dayOfMonth = pendingAutoPayData?.dayOfMonth || new Date().getDate();
    
    setLoading(true);
    
    try {
        // Create MySQL datetime format for next execution (next month same day)
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(dayOfMonth);
        nextDate.setHours(9, 0, 0, 0);
        
        const mysqlFormattedDate = nextDate.getFullYear() + '-' + 
            String(nextDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(nextDate.getDate()).padStart(2, '0') + ' ' +
            String(nextDate.getHours()).padStart(2, '0') + ':' +
            String(nextDate.getMinutes()).padStart(2, '0') + ':' +
            String(nextDate.getSeconds()).padStart(2, '0');
        
        const autoPayData = {
    orderId: `AP_RCH_${Date.now()}`,
    type: 'recharge',
    merchant: 'recharge',
    merchantName: `${selectedOperator?.name} Recharge`,
    amount: parseFloat(pendingAutoPayData?.amount || amount),
    schedule: 'monthly',
    dateValue: dayOfMonth,
    time: '09:00',
    paymentMethod: autoPayPaymentMethod,
    bankAccountId: selectedBankForAutoPay?.id,
    bankName: selectedBankForAutoPay?.bank_name,
    bankAccountLast4: selectedBankForAutoPay?.account_number?.slice(-4),
    status: 'active',
    nextExecution: mysqlFormattedDate,
    isRecharge: true,  // IMPORTANT: Set this explicitly
    isBillPayment: false,
    mobileNumber: pendingAutoPayData?.mobileNumber || mobileNumber,
    operator: pendingAutoPayData?.operator || operator,
    operatorName: selectedOperator?.name,
    circle: pendingAutoPayData?.circle || circle,
    reminderDays: reminderDays,
    createdAt: new Date().toISOString()
};
        
        console.log('Creating recharge auto-pay order:', autoPayData);
        
        await addAutoPayOrder(autoPayData);
        
        setShowAutoPayModal(false);
        setShowScheduleSuccessModal(true);
        setSelectedBankForAutoPay(null);
        setAutoPayPaymentMethod(null);
        
        // CRITICAL FIX: Wait a moment before refreshing to ensure database is updated
        // Add a small delay to allow the database to process
        setTimeout(async () => {
            await loadRechargeAutoPayOrders();
            
            // Dispatch event to notify ReservePayPage
            window.dispatchEvent(new CustomEvent('rechargeAutoPayUpdated'));
            
            toast.success(`Auto-pay scheduled for ${pendingAutoPayData?.mobileNumber || mobileNumber}`);
        }, 500);
        
    } catch (error) {
        console.error('Failed to setup auto-pay:', error);
        toast.error('Failed to setup auto-pay: ' + (error.response?.data?.message || error.message));
    } finally {
        setLoading(false);
    }
};

  // Handle Pay Now for auto-pay order
  // Handle Pay Now for auto-pay order
const handlePayNowForAutoPay = (order) => {
  setSelectedAutoPayOrder(order);
  setMobileNumber(order.mobileNumber);
  setOperator(order.operator);
  setCircle(order.circle || '');
  setAmount(order.amount.toString());
  
  // Find matching plan
  const matchedPlan = allPlans.find(p => p.amount === order.amount);
  setSelectedPlan(matchedPlan || { 
    amount: order.amount, 
    type: 'custom', 
    data: 'Custom Amount', 
    validity: 'Custom',
    benefits: 'Custom recharge amount'
  });
  
  setStep(2);
  setPaymentBreakdown({
    gemsAmount: 0,
    reserveAmount: 0,
    bankAmount: 0,
    totalAmount: order.amount,
    rechargeAmount: order.amount,
    remainingAfterGems: order.amount
  });
  setShowPayNowModal(false);
};

  const handleViewAutoPay = () => {
    setShowScheduleSuccessModal(false);
    navigate('/reserve-pay?tab=auto-pay');
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setSelectedPaymentType(null);
      setSelectedPaymentMethod(null);
      setPayStep(1);
      setPinDigits(['', '', '', '']);
      setPinFilled([false, false, false, false]);
    } else {
      navigate(-1);
    }
  };

  const handleDone = () => {
    setShowSuccess(false);
    navigate('/transactions');
  };

  const handleNewRecharge = () => {
    setShowSuccess(false);
    setStep(1);
    setMobileNumber('');
    setOperator('');
    setCircle('');
    setAmount('');
    setSelectedPlan(null);
    setSelectedPaymentType(null);
    setSelectedPaymentMethod(null);
    setPayStep(1);
    setPinDigits(['', '', '', '']);
    setPinFilled([false, false, false, false]);
    setPaymentBreakdown({
      gemsAmount: 0,
      reserveAmount: 0,
      bankAmount: 0,
      totalAmount: 0,
      rechargeAmount: 0,
      remainingAfterGems: 0
    });
  };

  const handleViewTransaction = () => {
    setShowSuccess(false);
    navigate('/transactions');
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
  

  const availableReserveLimit = getAvailableReserveLimit();
  const selectedOperatorData = operators.find(o => o.id === operator);
  const remainingAfterGems = paymentBreakdown.remainingAfterGems;

  {/* Edit Auto-Pay Modal */}
<AnimatePresence>
  {showEditAutoPayModal && editingAutoPayOrder && (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditAutoPayModal(false)}>
      <motion.div className="edit-auto-pay-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Auto-Pay Recharge</h2>
          <button className="modal-close" onClick={() => setShowEditAutoPayModal(false)}><FaTimes /></button>
        </div>
        
        <div className="modal-body">
          <div className="recharge-info-display">
            <p><strong>Mobile Number:</strong> {mobileNumber}</p>
            <p><strong>Operator:</strong> {operators.find(o => o.id === operator)?.name}</p>
            <p><strong>Circle:</strong> {circle}</p>
          </div>
          
          <div className="form-group">
            <label>Amount (₹)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="form-input"
              min="10"
              step="1"
            />
          </div>
          
          <div className="form-group">
            <label>Schedule Day</label>
            <select 
              value={editingAutoPayOrder.dateValue} 
              onChange={(e) => setEditingAutoPayOrder({ ...editingAutoPayOrder, dateValue: parseInt(e.target.value) })}
              className="form-select"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>Day {day}{getOrdinalSuffix(day)} of every month</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Payment Method</label>
            <div className="payment-method-display">
              {editingAutoPayOrder.paymentMethod === 'reserve' ? (
                <div className="payment-method-badge reserve">
                  <img src="/images/merchants/sabailogo.png" alt="SabAI" className="assistant-icon-small" />
                  SabAI Pay Lite
                </div>
              ) : (
                <div className="payment-method-badge bank">
                  <FaUniversity /> {editingAutoPayOrder.bankName} (xxxx{editingAutoPayOrder.bankAccountLast4})
                </div>
              )}
            </div>
          </div>
          
          <div className="auto-pay-info-note">
            <FaInfoCircle />
            <span>Amount will be auto-deducted on the scheduled day each month</span>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => setShowEditAutoPayModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleUpdateAutoPay} disabled={loading}>
            {loading ? <FaSpinner className="spinner" /> : 'Update Auto-Pay'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

  return (
    <div className="mobile-recharge-page">
      <button className="back-button" onClick={handleBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="recharge-container">
        <div className="recharge-header">
          <h1>Mobile Recharge</h1>
          <p className="subtitle">Instant recharge with 5% cashback (Max 100 Gems per transaction)</p>
          
          <div className="progress-container">
            <div className="progress-bar-bg">
              <motion.div 
                className="progress-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            <div className="progress-steps">
              <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                <div className="step-circle">
                  {step > 1 ? <FaCheckCircle /> : <span>1</span>}
                </div>
                <span className="step-label">Details</span>
              </div>
              <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                <div className="step-circle">
                  {step > 2 ? <FaCheckCircle /> : <span>2</span>}
                </div>
                <span className="step-label">Pay</span>
              </div>
              <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                <div className="step-circle">
                  <span>3</span>
                </div>
                <span className="step-label">Confirm</span>
              </div>
            </div>
          </div>
        </div>

        <div className="recharge-content">
          {/* STEP 1: Recharge Details */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="step-content"
            >
              {/* Recent Numbers Section */}
{recentNumbers.length > 0 && (
    <div className="recent-numbers-section">
        <div className="section-header">
            <h3>Recent Recharges</h3>
        </div>
        <div className="recent-numbers-scroll">
            <div className="recent-numbers-grid">
                {recentNumbers.map((num, idx) => {
    const opData = operators.find(o => o.id === num.operatorId);
    return (
        <button 
            key={idx} 
            className="recent-number-card"
            onClick={() => handleNumberClick({
                mobileNumber: num.mobileNumber,
                operatorId: num.operatorId,
                circle: num.circle,  // Make sure circle is included
                lastAmount: num.lastAmount
            })}
        >
            <div className="recent-number-circle" style={{ backgroundColor: opData?.color || '#4f46e5' }}>
                {opData?.logo ? (
                    <img src={opData.logo} alt={opData.name} className="recent-operator-logo" />
                ) : (
                    <FaMobile style={{ color: 'white', fontSize: '1.2rem' }} />
                )}
            </div>
            <span className="recent-number">{num.mobileNumber || 'No number'}</span>
            <span className="recent-operator-name">{opData?.name || num.operatorName}</span>
            <span className="recent-amount">₹{Number(num.lastAmount).toLocaleString()}</span>
        </button>
    );
})}
            </div>
        </div>
    </div>
)}

              {/* Auto-Pay Recharges Section - With Edit, Delete, AND Pay Now */}
{rechargeAutoPayOrders.length > 0 && (
  <div className="auto-pay-recharges-section">
    <div className="section-header">
      <h3><FaBell /> Auto-Pay Recharges</h3>
      <button className="view-all" onClick={() => navigate('/reserve-pay?tab=auto-pay')}>
        Manage All <FaChevronRight />
      </button>
    </div>
    <div className="auto-pay-recharges-list">
      {rechargeAutoPayOrders.map(order => {
        const scheduleDisplay = order.schedule === 'monthly' 
          ? `Monthly on ${order.dateValue}${getOrdinalSuffix(order.dateValue)} at ${order.time || '09:00'}`
          : `Yearly on ${order.dateValue}${getOrdinalSuffix(order.dateValue)}`;
        const nextDate = order.nextExecution ? new Date(order.nextExecution) : null;
        const operatorData = operators.find(o => o.id === order.operator);
        
        return (
          <div key={order.id} className="auto-pay-recharge-card">
            <div className="auto-pay-recharge-icon" style={{ backgroundColor: operatorData?.color + '15' }}>
              <FaMobile style={{ color: operatorData?.color }} />
            </div>
            <div className="auto-pay-recharge-info">
              <h4>{order.mobileNumber}</h4>
              <p className="auto-pay-recharge-details">
                {order.operatorName} • ₹{order.amount?.toLocaleString()} • {scheduleDisplay}
              </p>
              <p className="auto-pay-recharge-next">
                Next: {nextDate ? nextDate.toLocaleDateString() : 'N/A'}
              </p>
              <span className="payment-method-badge">
                {order.paymentMethod === 'reserve' ? (
                  <><img src="/images/merchants/sabailogo.png" alt="SabAI" className="assistant-icon-very-small" /> SabAI Pay Lite</>
                ) : (
                  <><FaUniversity /> {order.bankName} (xxxx{order.bankAccountLast4})</>
                )}
              </span>
            </div>
            <div className="auto-pay-recharge-actions">
              <button 
                className="pay-now-auto-btn"
                onClick={() => handlePayNowForAutoPay(order)}
                title="Pay Now"
              >
                <FaRupeeSign /> Pay Now
              </button>
              <button 
                className="edit-auto-pay-btn"
                onClick={() => handleEditAutoPay(order)}
                title="Edit Auto-Pay"
              >
                <FaEdit />
              </button>
              <button 
                className="delete-auto-pay-btn"
                onClick={() => handleDeleteAutoPay(order.id, order.mobileNumber)}
                title="Delete Auto-Pay"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

              {/* Main Form Section */}
              <div className="form-section-main">
                <div className="form-group">
                  <label>Mobile Number</label>
                  <div className="input-with-icon">
                    <FaPhone className="input-icon" />
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Enter 10-digit mobile number"
                      className={`form-input ${errors.mobileNumber ? 'error' : ''}`}
                      maxLength={10}
                    />
                  </div>
                  {errors.mobileNumber && <span className="error-text">{errors.mobileNumber}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Operator</label>
                    <select
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                      className={`form-select ${errors.operator ? 'error' : ''}`}
                    >
                      <option value="">Select Operator</option>
                      {operators.map(op => (
                        <option key={op.id} value={op.id}>{op.name}</option>
                      ))}
                    </select>
                    {errors.operator && <span className="error-text">{errors.operator}</span>}
                  </div>

                  <div className="form-group">
                    <label>Circle</label>
                    <select
    value={circle}
    onChange={(e) => {
        const newCircle = e.target.value;
        setCircle(newCircle);
        console.log('Circle selected:', newCircle);
    }}
    className={`form-select ${errors.circle ? 'error' : ''}`}
>
    <option value="">Select Circle</option>
    {circles.map(c => (
        <option key={c} value={c}>{c}</option>
    ))}
</select>
                    {errors.circle && <span className="error-text">{errors.circle}</span>}
                  </div>
                </div>

                {/* Plans Section inside form - Fixed to show all plans */}
                <div className="plans-section-inline">
                  <label>Select a Plan <span className="required-star">*</span></label>
                  <div className="plans-filters-inline">
                    <button 
                      className={`filter-chip-small ${activeFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('all')}
                    >
                      All
                    </button>
                    <button 
                      className={`filter-chip-small ${activeFilter === 'data' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('data')}
                    >
                      Data
                    </button>
                    <button 
                      className={`filter-chip-small ${activeFilter === 'talktime' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('talktime')}
                    >
                      Talktime
                    </button>
                  </div>
                  
                  {/* Plans Grid with scrolling */}
                  <div className="plans-grid-scrollable">
                    <div className="plans-grid-inline">
                      {displayPlans.map(plan => (
                          <div 
                              key={plan.id} 
                              className={`plan-card-inline ${selectedPlan?.amount === plan.amount ? 'selected' : ''}`}
                              onClick={() => handlePlanSelect(plan)}
                          >
                              <div className="plan-amount-inline">₹{plan.amount}</div>
                              <div className="plan-data-inline">{plan.data}</div>
                              <div className="plan-validity-inline">{plan.validity}</div>
                          </div>                      ))}
                    </div>
                  </div>
                  
                  {filteredPlans.length > 6 && (
                    <button className="view-more-plans" onClick={() => setShowAllPlans(!showAllPlans)}>
                      {showAllPlans ? 'Show Less' : `View ${filteredPlans.length - 6} More Plans`}
                    </button>
                  )}
                </div>

                {errors.plan && <span className="error-text">{errors.plan}</span>}

                {selectedPlan && (
                  <div className="selected-plan-info">
                    <div className="selected-plan-badge">
                      <FaStar /> Selected Plan: ₹{selectedPlan.amount} - {selectedPlan.data} ({selectedPlan.validity})
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Or Enter Custom Amount (₹)</label>
                  <div className="amount-input-wrapper">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setSelectedPlan(null);
                      }}
                      placeholder="Enter amount"
                      className={`amount-input ${errors.amount ? 'error' : ''}`}
                      min="10"
                      step="1"
                    />
                  </div>
                  {errors.amount && <span className="error-text">{errors.amount}</span>}
                </div>

                <div className="quick-amounts">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      className={`quick-amount-btn ${amount == amt ? 'selected' : ''}`}
                      onClick={() => {
                        setAmount(amt);
                        setSelectedPlan(null);
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {amount && parseFloat(amount) >= 10 && (
  <div className="cashback-info-banner">
    <FaInfoCircle />
    <span>
      You'll earn {Math.min(Math.floor(parseFloat(amount) * 0.05), 100)}{' '}
      <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-inline" /> (5% cashback, max 100 per transaction)
    </span>
  </div>
)}

                <div className="form-actions">
                  <button className="auto-pay-btn" onClick={handleAutoPaySetup}>
                    <FaBell /> Set Auto-Pay
                  </button>
                  <button className="continue-btn" onClick={handleProceedToPayment}>
                    Continue <FaArrowRight />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Payment Method Selection */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="step-content"
            >
              <div className="payment-section">
                <h3>Select Payment Method</h3>
                <p className="payment-subtitle">Choose how to pay for your recharge</p>

                <div className="recharge-summary">
                  <div className="summary-item">
                    <span>Mobile</span>
                    <strong>{mobileNumber}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Operator</span>
                    <strong style={{ color: getOperatorColor(operator) }}>
                      {operators.find(o => o.id === operator)?.name}
                    </strong>
                  </div>
                  <div className="summary-item">
                    <span>Circle</span>
                    <strong>{circle}</strong>
                  </div>
                  <div className="summary-item highlight">
                    <span>Amount</span>
                    <strong>₹{amount}</strong>
                  </div>
                  {selectedPlan && (
                    <div className="summary-item">
                      <span>Plan</span>
                      <strong>{selectedPlan.data} - {selectedPlan.validity}</strong>
                    </div>
                  )}
                </div>

                {/* Gems Input Section */}
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
                        max={Math.min(sabaiGems, parseFloat(amount))}
                        placeholder="0"
                      />
                      <span className="gems-max" onClick={() => handleGemsAmountChange(Math.min(sabaiGems, parseFloat(amount)))}>
                        Max
                      </span>
                    </div>
                    <p className="gems-balance">Available: {sabaiGems} <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-very-small" /> (1 <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-very-small" /> = ₹1)</p>
                    {paymentBreakdown.gemsAmount > 0 && (
                      <div className="payment-breakdown-preview">
                        <p>After using {paymentBreakdown.gemsAmount} <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-very-small" />: <strong>₹{paymentBreakdown.remainingAfterGems.toLocaleString()}</strong> remaining</p>
                      </div>
                    )}
                   {paymentBreakdown.gemsAmount === 0 && (
  <span className="cashback-info">
    You'll earn +{calculateCashback(parseFloat(amount))}{' '}
    <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-very-small" /> cashback
  </span>
)}
                    {paymentBreakdown.gemsAmount > 0 && (
                      <span className="cashback-info no-cashback">⚠️ No cashback when using Gems</span>
                    )}
                  </div>
                )}

                {/* Payment Methods Section */}
                <div className="payment-methods-section">
                  <h4>Select Payment Method</h4>
                  
                  {/* Pay with Gems Only */}
                  {sabaiGems >= parseFloat(amount) && (
                    <button
                      className={`payment-method-card ${selectedPaymentType === 'gems_only' ? 'selected' : ''}`}
                      onClick={() => handlePaymentMethodSelect('gems_only')}
                    >
                      <div className="payment-method-icon gems">
                        <img src="/images/sabaigems.png" alt="Gems" className="payment-method-logo" />
                      </div>
                      <div className="payment-method-info">
                        <strong>Pay with SabAI Gems Only</strong>
                        <span>Use {parseFloat(amount).toLocaleString()} <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-very-small" /> (No cashback)</span>
                      </div>
                      {selectedPaymentType === 'gems_only' && <FaCheckCircle className="selected-icon" />}
                    </button>
                  )}
                  
                  {/* Pay with SabAI Pay Lite (Reserve Pay) */}
                  {availableReserveLimit >= parseFloat(amount) && (
                    <button
                      className={`payment-method-card ${selectedPaymentType === 'reserve_pay' ? 'selected' : ''}`}
                      onClick={() => handlePaymentMethodSelect('reserve_pay')}
                    >
                      <div className="payment-method-icon reserve">
                        <img src="/images/merchants/sabailogo.png" alt="SabAI" className="payment-method-logo" />
                      </div>
                      <div className="payment-method-info">
                        <strong>SabAI Pay Lite (Reserve Pay)</strong>
                        <span>Use ₹{parseFloat(amount).toLocaleString()} from universal limit</span>
                        <span className="limit-info">Available: ₹{availableReserveLimit.toLocaleString()}</span>
                      </div>
                      {selectedPaymentType === 'reserve_pay' && <FaCheckCircle className="selected-icon" />}
                    </button>
                  )}

                  {/* Pay with Gems + SabAI Pay Lite (Reserve Pay) */}
{sabaiGems > 0 && paymentBreakdown.gemsAmount > 0 && paymentBreakdown.remainingAfterGems > 0 && availableReserveLimit >= paymentBreakdown.remainingAfterGems && (
  <button
    className={`payment-method-card ${selectedPaymentType === 'gems_and_lite' ? 'selected' : ''}`}
    onClick={() => {
      setSelectedPaymentType('gems_and_lite');
      // Set pending payment data directly without requiring another click
      const gemsToUse = paymentBreakdown.gemsAmount;
      const remainingToPay = paymentBreakdown.remainingAfterGems;
      setPendingPaymentData({
        type: 'gems_and_lite',
        method: null,
        amount: parseFloat(amount),
        cashbackEarned: 0,
        paymentBreakdown: {
          ...paymentBreakdown,
          gemsAmount: gemsToUse,
          reserveAmount: remainingToPay,
          bankAmount: 0,
          remainingAfterGems: remainingToPay
        }
      });
      setShowConfirmModal(true);
    }}
  >
    <div className="payment-method-icon gems-lite">
      <img src="/images/sabaigems.png" alt="Gems" className="payment-method-logo-small" onError={(e) => { e.target.style.display = 'none'; }} />
      <img src="/images/merchants/sabailogo.png" alt="SabAI" className="payment-method-logo-small" onError={(e) => { e.target.style.display = 'none'; }} />
    </div>
    <div className="payment-method-info">
      <strong>Gems + SabAI Pay Lite</strong>
      <span>Use {paymentBreakdown.gemsAmount} <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-very-small" onError={(e) => { e.target.style.display = 'none'; }} /> + ₹{paymentBreakdown.remainingAfterGems.toLocaleString()} from limit</span>
      <span className="limit-info">Available limit: ₹{availableReserveLimit.toLocaleString()}</span>
    </div>
    {selectedPaymentType === 'gems_and_lite' && <FaCheckCircle className="selected-icon" />}
  </button>
)}
                  
                  {/* Pay with Bank Account */}
                  <div className="bank-options-section">
                    <div className="bank-options-header">
                      <FaUniversity /> Pay with Bank Account
                    </div>
                    <div className="bank-list-scrollable">
                      {linkedBanks.filter(bank => hasUpiPin(bank.id)).length > 0 ? (
                        linkedBanks.filter(bank => hasUpiPin(bank.id)).map(bank => (
                          <button
                            key={bank.id}
                            className={`bank-option ${selectedPaymentMethod?.id === bank.id && selectedPaymentType === 'bank' ? 'selected' : ''}`}
                            onClick={() => handleBankSelect(bank)}
                          >
                            <div className="bank-option-left">
                              <div className="bank-logo">
                                {getBankLogoComponent(bank)}
                              </div>
                              <div className="bank-details">
                                <h4>{bank.bank_name}</h4>
                                <p className="bank-account">xxxx {bank.account_number.slice(-4)}</p>
                              </div>
                            </div>
                            <div className="bank-option-right">
                              {selectedPaymentMethod?.id === bank.id && selectedPaymentType === 'bank' && (
                                <FaCheckCircle className="selected-icon" />
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="no-banks-message">
                          <p>No bank accounts with UPI PIN linked</p>
                          <button onClick={() => navigate('/settings?tab=bank')}>
                            Link Bank Account
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Combined payment info */}
                  {paymentBreakdown.gemsAmount > 0 && paymentBreakdown.remainingAfterGems > 0 && (
                    <div className="combined-payment-info">
                      <FaInfoCircle />
                      <span>You'll pay {paymentBreakdown.gemsAmount} <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-very-small" /> + ₹{paymentBreakdown.remainingAfterGems.toLocaleString()} via selected method</span>
                    </div>
                  )}
                </div>

                <div className="payment-actions">
                  <button className="btn-secondary" onClick={handleBack}>Back</button>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      if (!selectedPaymentType) {
                        toast.error('Please select a payment method');
                        return;
                      }
                      if (selectedPaymentType === 'bank' && !selectedPaymentMethod) {
                        toast.error('Please select a bank account');
                        return;
                      }
                      if (selectedPaymentType === 'reserve_pay' && availableReserveLimit < parseFloat(amount)) {
                        toast.error('Insufficient Reserve Pay limit');
                        return;
                      }
                      if (selectedPaymentType === 'gems_only' && sabaiGems < parseFloat(amount)) {
                        toast.error('Insufficient SabAI Gems');
                        return;
                      }
                      if (selectedPaymentType === 'bank') {
                        setPayStep(2);
                        setStep(3);
                      } else if (selectedPaymentType === 'gems_only' || selectedPaymentType === 'reserve_pay') {
                        let newBreakdown = {};
                        if (selectedPaymentType === 'gems_only') {
                          newBreakdown = {
                            ...paymentBreakdown,
                            gemsAmount: parseFloat(amount),
                            bankAmount: 0,
                            reserveAmount: 0,
                            remainingAfterGems: 0
                          };
                        } else if (selectedPaymentType === 'reserve_pay') {
                          newBreakdown = {
                            ...paymentBreakdown,
                            gemsAmount: 0,
                            reserveAmount: parseFloat(amount),
                            bankAmount: 0,
                            remainingAfterGems: parseFloat(amount)
                          };
                        }
                        setPendingPaymentData({
                          type: selectedPaymentType,
                          method: null,
                          amount: parseFloat(amount),
                          cashbackEarned: selectedPaymentType === 'reserve_pay' ? calculateCashback(parseFloat(amount)) : 0,
                          paymentBreakdown: newBreakdown
                        });
                        setShowConfirmModal(true);
                      }
                    }}
                    disabled={!selectedPaymentType || (selectedPaymentType === 'bank' && !selectedPaymentMethod)}
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PIN Entry for Bank Payment */}
          {step === 3 && selectedPaymentType === 'bank' && selectedPaymentMethod && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="step-content"
            >
              <div className="pin-section">
                <div className="selected-bank-info">
                  <div className="bank-icon-small">
                    {getBankLogoComponent(selectedPaymentMethod)}
                  </div>
                  <div>
                    <h4>{selectedPaymentMethod.bank_name}</h4>
                    <p className="bank-account-small">xxxx {selectedPaymentMethod.account_number.slice(-4)}</p>
                  </div>
                </div>

                <div className="payment-details">
                  <div className="payment-amount">₹{paymentBreakdown.bankAmount.toLocaleString()}</div>
                  <div className="payment-recipient">
                    {mobileNumber} • {operators.find(o => o.id === operator)?.name}
                  </div>
                  {paymentBreakdown.gemsAmount > 0 && (
                    <div className="payment-breakdown">
                      Using {paymentBreakdown.gemsAmount} <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-very-small" /> + ₹{paymentBreakdown.bankAmount.toLocaleString()} Bank
                    </div>
                  )}
                  <div className="cashback-info">
  <FaInfoCircle /> 
  {paymentBreakdown.gemsAmount === 0 ? (
    <>You'll earn {calculateCashback(parseFloat(amount))} <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-very-small" /></>
  ) : 'No cashback when using Gems'}
</div>
                </div>

                <div className="pin-input-container">
                  <label>Enter UPI PIN for {selectedPaymentMethod.bank_name}</label>
                  <div className="pin-inputs">
                    {pinDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => pinInputRefs.current[index] = el}
                        type={showPin ? 'text' : 'password'}
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handlePinChange(index, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(e, index)}
                        className={`pin-input-field ${pinFilled[index] ? 'filled' : ''}`}
                        autoFocus={index === 0}
                        inputMode="numeric"
                        pattern="\d*"
                      />
                    ))}
                  </div>
                  <label className="show-pin-checkbox">
                    <input type="checkbox" checked={showPin} onChange={() => setShowPin(!showPin)} />
                    <span>Show PIN</span>
                  </label>
                  {pinError && <p className="pin-error">{pinError}</p>}
                </div>

                <div className="pin-actions">
                  <button className="btn-secondary" onClick={() => { setStep(2); setPayStep(1); }}>Back</button>
                  <button className="btn-primary" onClick={processPayment} disabled={loading}>
                    {loading ? <FaSpinner className="spinner" /> : `Pay ₹${paymentBreakdown.bankAmount.toLocaleString()}`}
                  </button>
                </div>

                <button className="forgot-pin-link" onClick={() => navigate('/settings?tab=bank')}>
                  Forgot PIN?
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Recharge History Modal */}
      <AnimatePresence>
        {showRechargeHistory && selectedHistoryNumber && (
          <RechargeHistoryModal
            mobileNumber={selectedHistoryNumber?.mobileNumber || selectedHistoryNumber?.mobile_number}
            operatorName={operators.find(o => o.id === selectedHistoryNumber?.operatorId)?.name}
            operatorLogo={operators.find(o => o.id === selectedHistoryNumber?.operatorId)?.logo}
            operatorColor={getOperatorColor(selectedHistoryNumber?.operatorId)}
            onClose={() => setShowRechargeHistory(false)}
            onRechargeAgain={() => handleRechargeAgain(selectedHistoryNumber)}
         />
        )}
      </AnimatePresence>

      {/* Plan Details Modal */}
      <AnimatePresence>
        {showPlanDetails && selectedPlanForDetails && (
          <PlanDetailsModal
            plan={selectedPlanForDetails}
            onClose={() => setShowPlanDetails(false)}
            onSelect={handlePlanSelect}
          />
        )}
      </AnimatePresence>

      {/* Auto-Pay Setup Modal - Updated: No pre-selected method */}
      <AnimatePresence>
        {showAutoPayModal && pendingAutoPayData && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAutoPayModal(false)}
          >
            <motion.div 
              className="auto-pay-setup-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Schedule Auto-pay</h2>
                <button className="modal-close" onClick={() => setShowAutoPayModal(false)}><FaTimes /></button>
              </div>
              
              <div className="modal-body">
                <div className="auto-pay-number-info">
                  <div className="auto-pay-number">{pendingAutoPayData.mobileNumber}</div>
                  <div className="auto-pay-operator">{pendingAutoPayData.operatorName}</div>
                  <div className="auto-pay-amount">Amount: ₹{pendingAutoPayData.amount}</div>
                </div>
                
                {/* Payment Method Selection - No pre-selected */}
                <div className="auto-pay-payment-methods">
                  <label>Select Payment Method <span className="required-star">*</span></label>
                  <div className="payment-method-options">
                    <button 
                      className={`payment-method-option ${autoPayPaymentMethod === 'reserve' ? 'selected' : ''}`}
                      onClick={() => handleAutoPayMethodSelect('reserve')}
                    >
                      <div className="payment-method-option-icon">
                        <img src="/images/merchants/sabailogo.png" alt="SabAI" className="assistant-logo-medium" />
                      </div>
                      <div className="payment-method-option-info">
                        <strong>SabAI Pay Lite</strong>
                        <span>Auto-deduct from Reserve Pay limit</span>
                      </div>
                      {autoPayPaymentMethod === 'reserve' && <FaCheckCircle className="selected-icon" />}
                    </button>
                    
                    <button 
                      className={`payment-method-option ${autoPayPaymentMethod === 'bank' ? 'selected' : ''}`}
                      onClick={() => handleAutoPayMethodSelect('bank')}
                    >
                      <div className="payment-method-option-icon">
                        <FaUniversity />
                      </div>
                      <div className="payment-method-option-info">
                        <strong>Bank Account</strong>
                        <span>Auto-deduct from your bank account</span>
                      </div>
                      {autoPayPaymentMethod === 'bank' && <FaCheckCircle className="selected-icon" />}
                    </button>
                  </div>
                </div>
                
                {autoPayPaymentMethod === 'reserve' && (
                  <div className="selected-bank-info-schedule">
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
                
                {autoPayPaymentMethod === 'bank' && selectedBankForAutoPay && (
                  <div className="selected-bank-info-schedule">
                    <div className="bank-icon-small">
                      {getBankLogoComponent(selectedBankForAutoPay)}
                    </div>
                    <div className="bank-details">
                      <span className="bank-name">{selectedBankForAutoPay.bank_name}</span>
                      <span className="account-number">xxxx{selectedBankForAutoPay.account_number?.slice(-4)}</span>
                    </div>
                    <FaCheckCircle className="selected-bank-check" />
                  </div>
                )}
                
                <div className="form-group">
                  <label>Remind me before</label>
                  <select 
                    className="form-select"
                    id="reminderDays"
                    defaultValue="3"
                  >
                    <option value="1">1 day before</option>
                    <option value="2">2 days before</option>
                    <option value="3">3 days before</option>
                    <option value="5">5 days before</option>
                    <option value="7">7 days before</option>
                  </select>
                </div>
                
                <div className="schedule-info">
                  <img src="/images/merchants/sabailogo.png" alt="SabAI" className="assistant-icon-medium" />
                  <p>Auto-pay will be processed on the due date using <strong>{autoPayPaymentMethod === 'reserve' ? 'SabAI Pay Lite' : selectedBankForAutoPay?.bank_name || 'selected bank'}</strong>. Amount will be deducted if sufficient {autoPayPaymentMethod === 'reserve' ? 'limit' : 'balance'} is available.</p>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowAutoPayModal(false)}>Cancel</button>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    if (!autoPayPaymentMethod) {
                      toast.error('Please select a payment method');
                      return;
                    }
                    if (autoPayPaymentMethod === 'reserve') {
                      confirmAutoPaySetup();
                    } else if (autoPayPaymentMethod === 'bank' && selectedBankForAutoPay) {
                      confirmAutoPayWithPin();
                    } else if (autoPayPaymentMethod === 'bank' && !selectedBankForAutoPay) {
                      toast.error('Please select a bank account first');
                    }
                  }}
                  disabled={!autoPayPaymentMethod || (autoPayPaymentMethod === 'bank' && !selectedBankForAutoPay)}
                >
                  Save Schedule
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bank Selection Modal for Auto-Pay */}
      <AnimatePresence>
        {showBankSelectionModal && (
          <BankSelectionModal
            banks={linkedBanks.filter(bank => hasUpiPin(bank.id))}
            onSelect={handleBankSelectForAutoPay}
            onCancel={() => setShowBankSelectionModal(false)}
          />
        )}
      </AnimatePresence>

      {/* PIN Modal for Bank Auto-Pay */}
      <AnimatePresence>
        {showPinModal && selectedBankForAutoPay && (
          <PinVerificationModal
            bank={selectedBankForAutoPay}
            onConfirm={confirmAutoPayWithPin}
            onCancel={() => {
              setShowPinModal(false);
              setSelectedBankForAutoPay(null);
              setAutoPayPaymentMethod(null);
            }}
            loading={loading}
          />
        )}
      </AnimatePresence>

      {/* Schedule Success Modal */}
      <AnimatePresence>
        {showScheduleSuccessModal && pendingAutoPayData && (
          <ScheduleSuccessModal
            rechargeData={{
              ...pendingAutoPayData,
              schedule: 'monthly',
              dateValue: new Date().getDate(),
              reminderDays: 3,
              paymentMethod: autoPayPaymentMethod,
              bankName: selectedBankForAutoPay?.bank_name
            }}
            onClose={() => setShowScheduleSuccessModal(false)}
            onViewAutoPay={handleViewAutoPay}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Gems/Reserve Pay */}
      {/* Confirmation Modal for Gems/Reserve Pay */}
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
        
        <div className="modal-body">
          <div className="recharge-summary">
            <div className="summary-item">
              <span>Mobile Number</span>
              <strong>{mobileNumber}</strong>
            </div>
            <div className="summary-item">
              <span>Operator</span>
              <strong>{operators.find(o => o.id === operator)?.name}</strong>
            </div>
            <div className="summary-item">
              <span>Amount</span>
              <strong>₹{pendingPaymentData.amount}</strong>
            </div>
            {pendingPaymentData.type === 'gems_only' && (
              <div className="summary-item">
                <span>Payment Method</span>
                <strong>SabAI Gems ({pendingPaymentData.amount} <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-very-small" />)</strong>
              </div>
            )}
            {pendingPaymentData.type === 'reserve_pay' && (
              <div className="summary-item">
                <span>Payment Method</span>
                <strong>SabAI Pay Lite</strong>
              </div>
            )}
            {pendingPaymentData.type === 'gems_and_lite' && (
              <div className="summary-item">
                <span>Payment Method</span>
                <strong>
                  {pendingPaymentData.paymentBreakdown.gemsAmount} <img src="/images/sabaigems.png" alt="Gems" className="gem-icon-very-small" /> + 
                  ₹{pendingPaymentData.paymentBreakdown.reserveAmount} SabAI Pay Lite
                </strong>
              </div>
            )}
            <div className="summary-item">
              <span>Cashback</span>
              <strong className="no-cashback">
                {pendingPaymentData.type === 'reserve_pay' ? `+${pendingPaymentData.cashbackEarned} 🪙` : '0 🪙 (Gems used)'}
              </strong>
            </div>
          </div>
          
          <div className="confirm-payment-note">
            <FaInfoCircle />
            <p>
              {pendingPaymentData.type === 'gems_only' 
                ? `You are about to pay ₹${pendingPaymentData.amount} using ${pendingPaymentData.amount} SabAI Gems. No cashback will be earned.`
                : pendingPaymentData.type === 'gems_and_lite'
                ? `You are about to pay ${pendingPaymentData.paymentBreakdown.gemsAmount} Gems + ₹${pendingPaymentData.paymentBreakdown.reserveAmount} using SabAI Pay Lite. No cashback will be earned.`
                : `You are about to pay ₹${pendingPaymentData.amount} using SabAI Pay Lite. You will earn ${pendingPaymentData.cashbackEarned} 🪙 cashback!`}
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
          <button className="btn-primary" onClick={confirmPayment} disabled={loading}>
            {loading ? <FaSpinner className="spinner" /> : 'Confirm Payment'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      {/* PopUPI Style Success Animation */}
      <AnimatePresence>
        {showSuccess && transactionDetails && (
          <motion.div 
            className="popupi-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PopUpiSuccessAnimation 
              onViewTransaction={handleViewTransaction}
              onNewPayment={handleNewRecharge}
              transactionData={transactionDetails}
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
          // Reset and allow user to try again
          setStep(2);
          setPayStep(1);
          setSelectedPaymentType(null);
          setSelectedPaymentMethod(null);
          setPinDigits(['', '', '', '']);
          setPinFilled([false, false, false, false]);
        }}
      />
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
};

export default MobileRechargePage;