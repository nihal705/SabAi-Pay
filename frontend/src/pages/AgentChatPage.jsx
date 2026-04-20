// frontend/src/pages/AgentChatPage.jsx
// COMPLETE WORKING VERSION - With Custom Payment Modal (Gems, SabAI Pay Lite, Bank)

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
import EnhancedOrderSummary from '../components/EnhancedOrderSummary';
import SituationSuggestionsCard from '../components/SituationSuggestionsCard';
import RestaurantOrderComponent from '../components/RestaurantOrderComponent';
import RestaurantMenuGrid from '../components/RestaurantMenuGrid';
import merchantConnectionService, { availableMerchants } from '../services/merchantConnectionService';
import storageService, {
    getCurrentUserId,
    getReserveLimits,
    getBankAccounts,
    getBankBalances,
    getCoinBalance,
    getTransactions,
    getBills,
    setReserveLimits,
    getPaidBills,
    getAutoPayOrders,
    getContacts,
    getMoneyRequests,
    getRecentRecharges,
    getConnectedMerchants,
    verifyBankPin,
    hasUpiPin,
    updateBankBalance,
    updateCoinBalance,
    addTransaction,
    addContact,
    refreshCurrentUserId
} from '../services/storageService';
import { 
  FaRobot, FaUser, FaPaperPlane, FaHistory, FaBoxOpen, FaArrowLeft,
  FaPlus, FaExclamationTriangle, FaCheckCircle, FaImage, FaClock,
  FaCopy, FaCheck, FaTruck, FaArrowRight, FaStore, FaShoppingCart,
  FaCheckDouble, FaTimes, FaPlay, FaPause, FaTrash, FaUniversity,
  FaCalendarAlt, FaRupeeSign, FaSpinner, FaInfoCircle, FaGem,
  FaEye, FaEyeSlash, FaTimesCircle, FaArrowDown, FaArrowUp
} from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import toast from 'react-hot-toast';
import './AgentChatPage.css';

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
    'IDFC First Bank': 'idfc.png', 'IDFC': 'idfc.png'
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
          <h2>Payment Successful!</h2>
          <p className="amount-paid">₹{transactionData?.amount?.toLocaleString()}</p>
          <p className="to-text">to {transactionData?.merchant}</p>
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
            <span>Payment Method</span>
            <span>{transactionData?.payment_method_display}</span>
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
              <FaArrowRight /> Continue Shopping
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Failed Payment Modal Component
const FailedPaymentModal = ({ transactionData, onClose, onRetry, onClearOrder }) => {
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
            <p className="to-text">to {transactionData?.merchant}</p>
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
              <span>Payment Method</span>
              <span>{transactionData?.payment_method_display}</span>
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
              <button className="popupi-btn secondary" onClick={onClearOrder}>
                <FaTrash /> Clear Order
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Custom Payment Modal Component
const CustomPaymentModal = ({ orderData, mode = 'pay', onClose, onPaymentSuccess, onPaymentFailed, onScheduleSuccess }) => {
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [bankBalances, setBankBalances] = useState({});
  const [sabaiGems, setSabaiGems] = useState(0);
  const [universalReserveLimit, setUniversalReserveLimit] = useState(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [payStep, setPayStep] = useState(1);
  const [payPinDigits, setPayPinDigits] = useState(['', '', '', '']);
  const [payPinFilled, setPayPinFilled] = useState([false, false, false, false]);
  const [payPinError, setPayPinError] = useState('');
  const [showPayPin, setShowPayPin] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [paymentBreakdown, setPaymentBreakdown] = useState({
    gemsAmount: 0,
    reserveAmount: 0,
    bankAmount: 0,
    totalAmount: orderData.total,
    orderAmount: orderData.total,
    remainingAfterGems: orderData.total
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  // Load data on mount - USING storageService
  useEffect(() => {
    loadBankAccounts();
    loadBankBalances();
    loadSabaiGems();
    loadUniversalReserveLimit();
  }, []);

  const loadBankAccounts = async () => {
    try {
      const accounts = await getBankAccounts();
      setLinkedBanks(accounts);
    } catch (error) {
      console.error('Failed to load bank accounts:', error);
    }
  };

  const loadBankBalances = async () => {
    try {
      const balances = await getBankBalances();
      setBankBalances(balances);
    } catch (error) {
      console.error('Failed to load bank balances:', error);
    }
  };

  const loadSabaiGems = async () => {
    try {
      const gems = await getCoinBalance();
      setSabaiGems(gems);
    } catch (error) {
      console.error('Failed to load SabAI Gems:', error);
    }
  };

  const loadUniversalReserveLimit = async () => {
    try {
      const limits = await getReserveLimits();
      const universalLimit = limits.find(l => l.merchant === 'sabai-pay-lite');
      setUniversalReserveLimit(universalLimit);
    } catch (error) {
      console.error('Failed to load reserve limits:', error);
    }
  };

  const hasUpiPin = async (bankId) => {
    try {
      return await storageService.hasUpiPin(bankId);
    } catch (error) {
      return false;
    }
  };

  const verifyBankPin = async (bankId, enteredPin) => {
    try {
      return await storageService.verifyBankPin(bankId, enteredPin);
    } catch (error) {
      return false;
    }
  };

  const handleSchedulePayment = async () => {
    setPayLoading(true);
    try {
        let paymentMethod = '';
        let bankAccountId = null;
        if (selectedPaymentType === 'reserve_pay') paymentMethod = 'reserve_pay';
        else if (selectedPaymentType === 'gems_only') paymentMethod = 'gems';
        else if (selectedPaymentType === 'bank') {
            paymentMethod = 'bank';
            bankAccountId = selectedPaymentMethod.id;
        } else if (selectedPaymentType === 'gems_and_bank') {
            paymentMethod = 'gems_and_bank';
            bankAccountId = selectedPaymentMethod.id;
        } else if (selectedPaymentType === 'gems_and_lite') paymentMethod = 'gems_and_lite';
        else paymentMethod = 'bank';

        const token = localStorage.getItem('token');
        const response = await axios.post(
            'http://localhost:5000/api/agent/order/schedule-order',
            {
                sessionId: orderData.sessionId,
                cart: orderData.items,
                total: orderData.total,
                merchant: orderData.merchant,
                merchantName: orderData.merchantName,
                scheduledTime: orderData.scheduledTime,
                paymentMethod,
                bankAccountId
            },
            { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        if (response.data.success) {
            onScheduleSuccess({ scheduledTime: orderData.scheduledTime });
            toast.success('Order scheduled successfully!');
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {
        console.error('Schedule error:', error);
        onPaymentFailed({ failure_reason: error.message });
    } finally {
        setPayLoading(false);
    }
};

  const updateBankBalance = async (bankId, amount) => {
    try {
      const newBalance = await storageService.updateBankBalance(bankId, amount, false);
      setBankBalances(prev => ({ ...prev, [bankId]: newBalance }));
      return newBalance;
    } catch (error) {
      console.error('Failed to update bank balance:', error);
      throw error;
    }
  };

  const updateSabaiGems = async (amount, isEarning = false) => {
    try {
      const newBalance = await updateCoinBalance(amount, isEarning);
      setSabaiGems(newBalance);
      return newBalance;
    } catch (error) {
      console.error('Failed to update gems:', error);
      throw error;
    }
  };

  const updateReserveLimitSpent = async (limitId, amount) => {
    try {
      const limits = await getReserveLimits();
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
      await setReserveLimits(updatedLimits);
      await loadUniversalReserveLimit();
      window.dispatchEvent(new Event('reservePayUpdated'));
      return updatedLimits;
    } catch (error) {
      console.error('Failed to update reserve limit:', error);
      throw error;
    }
  };

  const getAvailableReserveLimit = () => {
    if (!universalReserveLimit) return 0;
    return universalReserveLimit.monthly_limit - (universalReserveLimit.current_spent || 0);
  };

  const handleGemsAmountChange = (gemsToUse) => {
    const orderAmount = orderData.total;
    const maxGemsToUse = Math.min(sabaiGems, orderAmount);
    const validGems = Math.min(gemsToUse, maxGemsToUse);
    const remainingAfterGems = orderAmount - validGems;
    
    setPaymentBreakdown({
      gemsAmount: validGems,
      reserveAmount: 0,
      bankAmount: remainingAfterGems,
      totalAmount: orderAmount,
      orderAmount: orderAmount,
      remainingAfterGems: remainingAfterGems
    });
  };

  const saveTransaction = async (txnData) => {
    const newTransaction = {
      transactionId: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`,
      type: 'order_payment',
      amount: txnData.amount,
      description: `Order payment to ${txnData.merchant}`,
      merchant: txnData.merchant,
      merchant_name: txnData.merchant,
      items: JSON.stringify(txnData.items),
      payment_method: txnData.payment_method,
      payment_method_display: txnData.payment_method_display,
      payment_breakdown: JSON.stringify(txnData.payment_breakdown),
      bank_name: txnData.bank_name,
      bank_id: txnData.bank_id,
      status: 'success',
      cashback: txnData.cashback || 0,
      gems_used: txnData.gems_used || false,
      gems_amount: txnData.gems_amount || 0
    };
    
    await addTransaction(newTransaction);
    return newTransaction;
  };

  const saveFailedTransaction = async (txnData) => {
    const failedTransaction = {
      transactionId: `ORD_FAILED_${Date.now()}`,
      type: 'order_payment',
      amount: txnData.amount,
      description: `Order payment to ${txnData.merchant} - FAILED`,
      merchant: txnData.merchant,
      merchant_name: txnData.merchant,
      items: JSON.stringify(txnData.items),
      payment_method: 'failed',
      payment_method_display: txnData.payment_method_display,
      payment_breakdown: JSON.stringify(txnData.payment_breakdown),
      bank_name: txnData.bank_name,
      bank_id: txnData.bank_id,
      status: 'failed',
      cashback: 0,
      failure_reason: txnData.failure_reason,
      available_balance: txnData.available_balance
    };
    
    await addTransaction(failedTransaction);
    return failedTransaction;
  };

  const confirmPayment = () => {
    if (!pendingPaymentData) return;
    const breakdownToUse = { ...pendingPaymentData.paymentBreakdown };
    setShowConfirmModal(false);
    setPendingPaymentData(null);
    processPaymentWithBreakdown(breakdownToUse);
  };

  const processPaymentWithBreakdown = async (breakdown) => {
    const orderAmount = orderData.total;
    const { gemsAmount, bankAmount, reserveAmount } = breakdown;
    const cashbackEarned = (gemsAmount === 0 && reserveAmount === 0) ? calculateCashback(orderAmount) : 0;
    
    setPayLoading(true);
    
    try {
      let paymentFailed = false;
      let failureReason = '';
      let availableBalance = 0;
      
      if (bankAmount > 0 && selectedPaymentMethod) {
        const currentBalance = bankBalances[selectedPaymentMethod.id] || 0;
        availableBalance = currentBalance;
        if (bankAmount > currentBalance) {
          paymentFailed = true;
          failureReason = `Insufficient balance in ${selectedPaymentMethod.bank_name}`;
        }
      }
      
      if (reserveAmount > 0 && universalReserveLimit && !paymentFailed) {
        const availableLimit = getAvailableReserveLimit();
        if (reserveAmount > availableLimit) {
          paymentFailed = true;
          failureReason = `Insufficient SabAI Pay Lite limit. Available: ₹${availableLimit.toLocaleString()}, Required: ₹${reserveAmount.toLocaleString()}`;
        }
      }
      
      if (paymentFailed) {
        let paymentMethodDisplay = '';
        if (gemsAmount > 0 && bankAmount > 0) {
          paymentMethodDisplay = `${gemsAmount} 🪙 Gems + ₹${bankAmount} (${selectedPaymentMethod?.bank_name || 'Bank'})`;
        } else if (reserveAmount > 0 && gemsAmount === 0 && bankAmount === 0) {
          paymentMethodDisplay = `₹${reserveAmount} SabAI Pay Lite`;
        } else if (bankAmount > 0 && gemsAmount === 0 && reserveAmount === 0) {
          paymentMethodDisplay = `₹${bankAmount} (${selectedPaymentMethod?.bank_name || 'Bank'})`;
        } else if (gemsAmount > 0 && bankAmount === 0 && reserveAmount === 0) {
          paymentMethodDisplay = `${gemsAmount} 🪙 Gems Only`;
        } else if (gemsAmount > 0 && reserveAmount > 0) {
          paymentMethodDisplay = `${gemsAmount} 🪙 Gems + ₹${reserveAmount} SabAI Pay Lite`;
        }
        
        const failedTransaction = await saveFailedTransaction({
          amount: orderAmount,
          merchant: orderData.merchant,
          items: orderData.items,
          payment_method_display: paymentMethodDisplay,
          payment_breakdown: { gemsAmount, bankAmount, reserveAmount },
          bank_name: selectedPaymentMethod?.bank_name,
          bank_id: selectedPaymentMethod?.id,
          failure_reason: failureReason,
          available_balance: availableBalance
        });
        
        onPaymentFailed({
          ...failedTransaction,
          amount: orderAmount,
          merchant: orderData.merchant,
          payment_method_display: paymentMethodDisplay,
          failure_reason: failureReason
        });
        
        setPayLoading(false);
        return;
      }
      
      let paymentMethod = '';
      let paymentMethodDisplay = '';
      
      if (gemsAmount > 0) {
        await updateSabaiGems(gemsAmount, false);
      }
      
      if (gemsAmount > 0 && bankAmount > 0) {
        paymentMethodDisplay = `${gemsAmount} 🪙 Gems + ₹${bankAmount} (${selectedPaymentMethod?.bank_name || 'Bank'})`;
        paymentMethod = 'gems_and_bank';
      } else if (gemsAmount > 0 && reserveAmount > 0) {
        paymentMethodDisplay = `${gemsAmount} 🪙 Gems + ₹${reserveAmount} SabAI Pay Lite`;
        paymentMethod = 'gems_and_lite';
      } else if (gemsAmount > 0 && bankAmount === 0 && reserveAmount === 0) {
        paymentMethodDisplay = `${gemsAmount} 🪙 Gems Only`;
        paymentMethod = 'gems';
      } else if (reserveAmount > 0 && gemsAmount === 0 && bankAmount === 0) {
        paymentMethodDisplay = `₹${reserveAmount} SabAI Pay Lite`;
        paymentMethod = 'reserve_pay';
      } else if (bankAmount > 0 && gemsAmount === 0 && reserveAmount === 0) {
        paymentMethodDisplay = `₹${bankAmount} (${selectedPaymentMethod?.bank_name || 'Bank'})`;
        paymentMethod = 'bank';
      }
      
      if (reserveAmount > 0 && universalReserveLimit) {
        await updateReserveLimitSpent(universalReserveLimit.id, reserveAmount);
      }
      
      if (bankAmount > 0 && selectedPaymentMethod) {
        await updateBankBalance(selectedPaymentMethod.id, bankAmount);
      }
      
      if (cashbackEarned > 0) {
        await updateSabaiGems(cashbackEarned, true);
      }
      
      const newTransaction = await saveTransaction({
        amount: orderAmount,
        merchant: orderData.merchant,
        items: orderData.items,
        payment_method: paymentMethod,
        payment_method_display: paymentMethodDisplay,
        payment_breakdown: { gemsAmount, bankAmount, reserveAmount },
        bank_name: selectedPaymentMethod?.bank_name,
        bank_id: selectedPaymentMethod?.id,
        cashback: cashbackEarned,
        gems_used: gemsAmount > 0,
        gems_amount: gemsAmount
      });
      
      onPaymentSuccess({
        ...newTransaction,
        cashback: cashbackEarned,
        merchant: orderData.merchant,
        amount: orderAmount,
        payment_method_display: paymentMethodDisplay,
        payment_breakdown: { gemsAmount, bankAmount, reserveAmount }
      });
      
      setPayLoading(false);
      setSelectedPaymentType(null);
      setSelectedPaymentMethod(null);
      setPayStep(1);
      setPayPinDigits(['', '', '', '']);
      setPayPinFilled([false, false, false, false]);
      
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

  const handlePaymentMethodSelect = async (type, method = null) => {
    const orderAmount = orderData.total;
    const remainingAfterGems = paymentBreakdown.remainingAfterGems;
    const availableReserveLimit = getAvailableReserveLimit();
    
    setSelectedPaymentType(type);
    setSelectedPaymentMethod(method);
    
    if (type === 'gems_only') {
      if (sabaiGems >= orderAmount) {
        setPendingPaymentData({
          type: 'gems_only',
          method: null,
          paymentBreakdown: {
            ...paymentBreakdown,
            gemsAmount: orderAmount,
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
      if (availableReserveLimit >= orderAmount) {
        setPendingPaymentData({
          type: 'reserve_pay',
          method: null,
          paymentBreakdown: {
            ...paymentBreakdown,
            gemsAmount: 0,
            reserveAmount: orderAmount,
            bankAmount: 0,
            remainingAfterGems: orderAmount
          }
        });
        setShowConfirmModal(true);
      } else {
        toast.error(`Insufficient Reserve Pay limit. Available: ₹${availableReserveLimit.toLocaleString()}`);
        setSelectedPaymentType(null);
      }
    } else if (type === 'gems_and_lite') {
      const gemsToUse = paymentBreakdown.gemsAmount;
      const remaining = orderAmount - gemsToUse;
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
      const hasPin = await hasUpiPin(method.id);
      if (!hasPin) {
        toast.error(`Please set UPI PIN for ${method.bank_name} in Settings first`);
        setSelectedPaymentType(null);
        setSelectedPaymentMethod(null);
        return;
      }
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
      const hasPin = await hasUpiPin(method.id);
      if (!hasPin) {
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

  const banksWithPin = Promise.all(linkedBanks.map(async bank => ({
    ...bank,
    hasPin: await hasUpiPin(bank.id)
  }))).then(banks => banks.filter(b => b.hasPin));
  
  const availableReserveLimit = getAvailableReserveLimit();
  const remainingAfterGems = paymentBreakdown.remainingAfterGems;

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-payment-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Complete Payment</h2>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="modal-body-scroll">
          {/* Order Summary */}
          <div className="order-summary-payment">
            <div className="summary-merchant">
              <strong>Merchant:</strong> {orderData.merchant}
            </div>
            <div className="summary-items">
              {orderData.items.map((item, idx) => (
                <div key={idx} className="summary-item">
                  <span>{item.quantity}x {item.name}</span>
                  <span>₹{item.total || (item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="summary-total">
              <strong>Total Amount:</strong>
              <strong>₹{orderData.total.toLocaleString()}</strong>
            </div>
          </div>

          {payStep === 1 && (
            <>
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
                      max={Math.min(sabaiGems, orderData.total)}
                      placeholder="0"
                    />
                    <span className="gems-max" onClick={() => handleGemsAmountChange(Math.min(sabaiGems, orderData.total))}>
                      Max
                    </span>
                  </div>
                  <p className="gems-balance">Available: {sabaiGems} 🪙 (1 🪙 = ₹1)</p>
                  {paymentBreakdown.gemsAmount > 0 && (
                    <div className="payment-breakdown-preview">
                      <p>After using {paymentBreakdown.gemsAmount} 🪙: <strong>₹{paymentBreakdown.remainingAfterGems.toLocaleString()}</strong> remaining</p>
                    </div>
                  )}
                  {paymentBreakdown.gemsAmount === 0 && (
                    <span className="cashback-info">You'll earn +{calculateCashback(orderData.total)} 🪙 cashback</span>
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
                {sabaiGems >= orderData.total && (
                  <button
                    className={`payment-method-card ${selectedPaymentType === 'gems_only' ? 'selected' : ''}`}
                    onClick={() => handlePaymentMethodSelect('gems_only')}
                  >
                    <div className="payment-method-icon gems">
                      <img src="/images/sabaigems.png" alt="Gems" className="payment-method-logo" />
                    </div>
                    <div className="payment-method-info">
                      <strong>Pay with SabAI Gems Only</strong>
                      <span>Use {orderData.total.toLocaleString()} 🪙 (No cashback)</span>
                    </div>
                    {selectedPaymentType === 'gems_only' && <FaCheckCircle className="selected-icon" />}
                  </button>
                )}
                
                {/* Pay with SabAI Pay Lite (Reserve Pay) */}
                {availableReserveLimit >= orderData.total && (
                  <button
    className={`payment-method-card ${selectedPaymentType === 'reserve_pay' ? 'selected' : ''}`}
    onClick={() => handlePaymentMethodSelect('reserve_pay')}
>
    <div className="payment-method-icon reserve">
        <img src="/images/merchants/sabailogo.png" alt="SabAI" className="payment-method-logo" />
    </div>
    <div className="payment-method-info">
        <strong>SabAI Pay Lite</strong>
        <span>Use ₹{orderData.total.toLocaleString()} from your universal limit</span>
        <span className="limit-info">Available: ₹{availableReserveLimit.toLocaleString()}</span>
    </div>
    {selectedPaymentType === 'reserve_pay' && <FaCheckCircle className="selected-icon" />}
</button>
                )}
                
                {/* Pay with Gems + SabAI Pay Lite */}
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
                
                {/* Pay with Bank Account */}
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
                
                {/* Combined payment info */}
                {paymentBreakdown.gemsAmount > 0 && paymentBreakdown.remainingAfterGems > 0 && (
                  <div className="combined-payment-info">
                    <FaInfoCircle />
                    <span>You'll pay {paymentBreakdown.gemsAmount} 🪙 + ₹{paymentBreakdown.remainingAfterGems.toLocaleString()} via selected method</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={onClose}>Cancel</button>
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
                    if (selectedPaymentType === 'reserve_pay' && availableReserveLimit < orderData.total) {
                      toast.error('Insufficient Reserve Pay limit');
                      return;
                    }
                    if (selectedPaymentType === 'gems_and_lite' && availableReserveLimit < paymentBreakdown.remainingAfterGems) {
                      toast.error('Insufficient Reserve Pay limit for remaining amount');
                      return;
                    }
                    if (selectedPaymentType === 'gems_only' && sabaiGems < orderData.total) {
                      toast.error('Insufficient SabAI Gems');
                      return;
                    }
                    
                    // Handle bank only payment - go to PIN step
                    if (selectedPaymentType === 'bank') {
                      setPaymentBreakdown(prev => ({
                        ...prev,
                        bankAmount: prev.remainingAfterGems,
                        reserveAmount: 0
                      }));
                      setPayStep(2);
                      return;
                    }
                    
                    // Handle gems + bank payment - go to PIN step
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
                    
                    // For gems_only, reserve_pay, gems_and_lite - show confirmation modal (no PIN needed)
                    if (selectedPaymentType === 'gems_only' || selectedPaymentType === 'reserve_pay' || selectedPaymentType === 'gems_and_lite') {
                      let newBreakdown = {};
                      if (selectedPaymentType === 'gems_only') {
                        newBreakdown = {
                          ...paymentBreakdown,
                          gemsAmount: orderData.total,
                          bankAmount: 0,
                          reserveAmount: 0,
                          remainingAfterGems: 0
                        };
                      } else if (selectedPaymentType === 'reserve_pay') {
                        newBreakdown = {
                          ...paymentBreakdown,
                          gemsAmount: 0,
                          reserveAmount: orderData.total,
                          bankAmount: 0,
                          remainingAfterGems: orderData.total
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
                  <strong>₹{orderData.total.toLocaleString()}</strong>
                </div>
                {paymentBreakdown.gemsAmount > 0 && (
                  <div className="summary-row">
                    <span>SabAI Gems Used</span>
                    <span>{paymentBreakdown.gemsAmount} 🪙 (₹{paymentBreakdown.gemsAmount})</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Merchant</span>
                  <span>{orderData.merchant}</span>
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
                    <span className="cashback-amount">+{calculateCashback(orderData.total)} 🪙</span>
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
                <button className="btn-secondary" onClick={() => setPayStep(1)}>Back</button>
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

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && pendingPaymentData && (
            <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
              <div className="confirm-payment-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Confirm Payment</h2>
                  <button className="modal-close" onClick={() => setShowConfirmModal(false)}><FaTimes /></button>
                </div>
                <div className="modal-body">
                  <div className="payment-summary">
                    <div className="summary-row">
                      <span>Total Amount</span>
                      <strong>₹{orderData.total.toLocaleString()}</strong>
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
                      <span>Merchant</span>
                      <span>{orderData.merchant}</span>
                    </div>
                    {pendingPaymentData.type === 'reserve_pay' && pendingPaymentData.paymentBreakdown.gemsAmount === 0 && (
                      <div className="summary-row">
                        <span>Cashback (5%)</span>
                        <span className="cashback-amount">+{calculateCashback(orderData.total)} 🪙</span>
                      </div>
                    )}
                    {(pendingPaymentData.type === 'gems_only' || pendingPaymentData.type === 'gems_and_lite') && (
                      <div className="summary-row">
                        <span>Cashback</span>
                        <span className="cashback-amount no-cashback">0 🪙 (Gems used)</span>
                      </div>
                    )}
                  </div>
                  <div className="confirm-payment-note">
                    <FaInfoCircle />
                    <p>
                      {pendingPaymentData.type === 'gems_only' 
                        ? `You are about to pay ₹${orderData.total} using ${orderData.total} SabAI Gems. No cashback will be earned.`
                        : pendingPaymentData.type === 'gems_and_lite'
                        ? `You are about to pay ${pendingPaymentData.paymentBreakdown.gemsAmount} Gems + ₹${pendingPaymentData.paymentBreakdown.reserveAmount} using SabAI Pay Lite. No cashback will be earned.`
                        : pendingPaymentData.type === 'reserve_pay'
                        ? `You are about to pay ₹${orderData.total} using SabAI Pay Lite. You will earn ${calculateCashback(orderData.total)} 🪙 cashback!`
                        : `You are about to pay ₹${orderData.total} via bank transfer. You will earn ${calculateCashback(orderData.total)} 🪙 cashback!`}
                    </p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                  <button className="btn-primary" onClick={confirmPayment} disabled={payLoading}>
                    {payLoading ? <FaSpinner className="spinner" /> : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================
// COMPONENT: Auto Pay Setup Modal (Standalone)
// ============================================
const AutoPaySetupModal = ({ orderData, onConfirm, onCancel }) => {
  const [schedule, setSchedule] = useState('monthly');
  const [dayOfMonth, setDayOfMonth] = useState(new Date().getDate());
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const navigate = useNavigate();
  
  useEffect(() => {
    loadBankAccounts();
  }, []);
  
  const loadBankAccounts = () => {
    const saved = localStorage.getItem('bankAccounts');
    if (saved) {
      const accounts = JSON.parse(saved);
      setBankAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedBankId(accounts[0].id);
      }
    }
  };
  
  const hasUpiPin = (bankId) => {
    const pins = JSON.parse(localStorage.getItem('bankUpiPins') || '{}');
    return !!pins[bankId];
  };
  
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
      'IDFC First Bank': 'idfc.png', 'IDFC': 'idfc.png'
    };
    const fileName = bankLogoMap[bankName];
    if (fileName) return `/images/banks/${fileName}`;
    return null;
  };
  
  const handleConfirm = async () => {
    if (!selectedBankId) {
      toast.error('Please select a bank account');
      return;
    }
    
    const selectedBank = bankAccounts.find(b => b.id === selectedBankId);
    if (!hasUpiPin(selectedBankId)) {
      toast.error(`Please set UPI PIN for ${selectedBank?.bank_name} in Settings first`);
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agent/order/auto-pay/setup',
        {
          sessionId: orderData.sessionId,
          schedule: schedule,
          dayOfMonth: dayOfMonth,
          bankAccountId: selectedBankId
        },
        { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
      );
      
      if (response.data.success) {
        onConfirm(response.data.data.response);
        toast.success('Auto-Pay set up successfully!');
      } else {
        toast.error(response.data.message || 'Failed to set up Auto-Pay');
      }
    } catch (error) {
      console.error('Auto-Pay setup failed:', error);
      toast.error('Failed to set up Auto-Pay');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="auto-pay-setup-modal">
        <div className="modal-header">
          <h2>Set Up Auto-Pay Order</h2>
          <button className="modal-close" onClick={onCancel}><FaTimes /></button>
        </div>
        
        <div className="modal-body">
          <div className="order-summary-preview">
            <h3>Order to repeat:</h3>
            {orderData.items?.map((item, idx) => (
              <div key={idx} className="preview-item">
                <span>{item.quantity}x {item.name}</span>
                <span>₹{item.total}</span>
              </div>
            ))}
            <div className="preview-total">
              <strong>Total: ₹{orderData.total}</strong>
            </div>
            <div className="preview-merchant">
              <span>Merchant: {orderData.merchant}</span>
            </div>
          </div>
          
          <div className="form-group">
            <label>Schedule</label>
            <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className="form-select">
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Day of Month</label>
            <input 
              type="number" 
              min="1" 
              max="28" 
              value={dayOfMonth} 
              onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
              className="form-input"
            />
            <p className="field-note">Payment will be made on this day every month</p>
          </div>
          
          <div className="form-group">
            <label>Bank Account for Auto-Debit</label>
            <div className="bank-accounts-list">
              {bankAccounts.length === 0 ? (
                <div className="no-banks-warning">
                  <p>⚠️ No bank accounts linked. Please add a bank account in Settings first.</p>
                  <button onClick={() => navigate('/settings?tab=bank')} className="btn-link">
                    Add Bank Account
                  </button>
                </div>
              ) : (
                bankAccounts.map(bank => {
                  const hasPin = hasUpiPin(bank.id);
                  const bankLogo = getBankLogoUrl(bank.bank_name);
                  const hasError = imageErrors[`auto_pay_bank_${bank.id}`];
                  
                  return (
                    <div 
                      key={bank.id}
                      className={`bank-option ${selectedBankId === bank.id ? 'selected' : ''} ${!hasPin ? 'no-pin' : ''}`}
                      onClick={() => hasPin && setSelectedBankId(bank.id)}
                    >
                      <div className="bank-icon-small">
                        {bankLogo && !hasError ? (
                          <img 
                            src={bankLogo} 
                            alt={bank.bank_name}
                            className="bank-logo-image"
                            onError={() => setImageErrors(prev => ({ ...prev, [`auto_pay_bank_${bank.id}`]: true }))}
                          />
                        ) : (
                          <FaUniversity />
                        )}
                      </div>
                      <div className="bank-details">
                        <strong>{bank.bank_name}</strong>
                        <span>xxxx{bank.account_number?.slice(-4)}</span>
                      </div>
                      {!hasPin && <span className="pin-warning">🔒 PIN not set</span>}
                      {selectedBankId === bank.id && <FaCheckCircle className="selected-icon" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="auto-pay-info-note">
            <FaInfoCircle />
            <span>Amount will be automatically deducted from your selected bank account on the scheduled date. Ensure sufficient balance.</span>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button 
            className="btn-primary" 
            onClick={handleConfirm} 
            disabled={loading || bankAccounts.length === 0 || !selectedBankId}
          >
            {loading ? <FaSpinner className="spinner" /> : 'Set Up Auto-Pay'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENT: Enhanced Order Summary Card
// ============================================
const OrderSummaryCard = ({ orderData, onUPIPayment, onReservePay, onAddItems, onClearCart, isAlreadyConfirmed }) => {
    const [imageErrors, setImageErrors] = useState({});

    if (isAlreadyConfirmed) {
        return null;
    }

    // Debug log
    console.log('OrderSummaryCard received orderData:', {
        merchant: orderData.merchant,
        merchantName: orderData.merchantName,
        reserveCheck: orderData.reserveCheck
    });

  const getMerchantLogo = () => {
    const merchantName = orderData.merchant?.toLowerCase();
    const logoMap = {
      'swiggy': '/images/merchants/swiggy.png',
      'zomato': '/images/merchants/zomato.png',
      'zepto': '/images/merchants/zepto.png',
      'blinkit': '/images/merchants/blinkit.png',
      'amazon': '/images/merchants/amazon.png',
      'flipkart': '/images/merchants/flipkart.png',
      'myntra': '/images/merchants/myntra.png',
      'ajio': '/images/merchants/ajio.png',
      'netmeds': '/images/merchants/netmeds.png',
      'pharmeasy': '/images/merchants/pharmeasy.png'
    };
    return logoMap[merchantName] || orderData.merchantLogo;
  };

  const merchantLogo = getMerchantLogo();
  
  // Check if Reserve Pay is available for this merchant
  const isReservePayAvailable = orderData.reserveCheck?.eligible || false;
  const reserveRemaining = orderData.reserveCheck?.remaining || 0;
  const merchantName = orderData.merchantName || orderData.merchant;

  return (
    <div className="order-summary-card-enhanced">
      <div className="order-header-enhanced">
        {merchantLogo && !imageErrors.merchant && (
          <div className="merchant-logo-container">
            <img 
              src={merchantLogo}
              alt={merchantName}
              className="merchant-logo-enhanced"
              onError={(e) => {
                e.target.style.display = 'none';
                setImageErrors(prev => ({ ...prev, merchant: true }));
              }}
            />
          </div>
        )}
        <h3>Order Summary from {merchantName}</h3>
      </div>
      
      <div className="order-items-grid">
        {orderData.items && orderData.items.map((item, idx) => (
          <div key={item.id || idx} className="item-circle-card">
            <div className="item-image-circle">
              <img 
                src={item.image || '/images/items/default.png'}
                alt={item.name}
                className="item-circle-image"
                onError={(e) => {
                  e.target.src = '/images/items/default.png';
                }}
              />
            </div>
            <div className="item-circle-name">{item.name}</div>
            <div className="item-circle-price">₹{item.price}</div>
            <div className="item-circle-quantity">{item.quantity}x</div>
          </div>
        ))}
      </div>
      
      {orderData.unavailableItems && orderData.unavailableItems.length > 0 && (
        <div className="unavailable-items">
          <h4>❌ Not Available:</h4>
          {orderData.unavailableItems.map((item, idx) => (
            <div key={idx} className="unavailable-item">
              <span>{item.quantity}x {item.name}</span>
              {item.suggestions && item.suggestions.length > 0 && (
                <div className="suggestions">
                  Try: {item.suggestions.map(s => s.name).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="order-totals-enhanced">
        <div className="totals-row"><span>Subtotal:</span><span>₹{orderData.subtotal}</span></div>
        <div className="totals-row"><span>Tax (5%):</span><span>₹{orderData.tax}</span></div>
        <div className="totals-row total"><span>Total:</span><span>₹{orderData.total}</span></div>
        <div className="totals-row gems"><span>SabAI Gems Earned:</span><span>+{orderData.sabaiGems} 🪙</span></div>
      </div>
      
      {/* Reserve Pay Status Section */}
      {orderData.reserveCheck && (
        <div className="reserve-info-enhanced">
          <h4>Reserve Pay Status</h4>
          <div className="reserve-details">
            <div className="detail-row"><span>Monthly Limit:</span><span>₹{orderData.reserveCheck.limit?.toLocaleString() || 0}</span></div>
            <div className="detail-row"><span>Already Spent:</span><span>₹{orderData.reserveCheck.spent?.toLocaleString() || 0}</span></div>
            <div className="detail-row"><span>Remaining:</span><span>₹{orderData.reserveCheck.remaining?.toLocaleString() || 0}</span></div>
            <div className="detail-row"><span>This Payment:</span><span>₹{orderData.total.toLocaleString()}</span></div>
            {orderData.reserveCheck.eligible ? (
              <div className="eligible">✅ Within Reserve Pay Limit! Click "Pay with Reserve Pay" to complete payment instantly.</div>
            ) : (
              <div className="not-eligible">❌ {orderData.reserveCheck.message || "Insufficient Reserve Pay limit"}</div>
            )}
          </div>
        </div>
      )}
      
      <div className="payment-options-enhanced">
        <button className="pay-upi-btn-enhanced" onClick={() => onUPIPayment(orderData)}>💳 Pay with UPI</button>
        {isReservePayAvailable && (
          <button className="pay-reserve-btn-enhanced" onClick={() => onReservePay(orderData)}>
            💰 Pay with Reserve Pay
          </button>
        )}
      </div>
      
      <div className="order-actions-enhanced">
        <button className="add-items-btn" onClick={() => onAddItems()}>➕ Add Items</button>
        <button className="clear-cart-btn" onClick={() => onClearCart()}>🗑️ Clear Cart</button>
      </div>
    </div>
  );
};

// ============================================
// COMPONENT: Item Selection Grid
// ============================================
const ItemSelectionGrid = ({ gridData, onContinue, onCancel }) => {
  const [selectedItems, setSelectedItems] = useState({});
  
  const toggleItem = (itemId) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };
  
  const getSelectedCount = () => Object.values(selectedItems).filter(v => v).length;
  
  const handleContinue = () => {
    const selectedItemIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
    const selectedItemsData = gridData.items.filter(item => selectedItemIds.includes(item.id));
    onContinue(selectedItemsData);
  };
  
  return (
    <div className="item-selection-grid-enhanced">
      <div className="grid-header"><h3>{gridData.title || 'Select Items'}</h3><p className="grid-subtitle">Click on items to select/deselect</p></div>
      <div className="items-grid-enhanced">
        {gridData.items.map(item => (
          <div key={item.id} className={`grid-item-card ${selectedItems[item.id] ? 'selected' : ''}`} onClick={() => toggleItem(item.id)}>
            <div className="grid-item-image">
              <img src={item.image || '/images/items/default.jpg'} alt={item.name} onError={(e) => { e.target.src = '/images/items/default.jpg'; }} />
              {selectedItems[item.id] && <div className="selected-overlay"><FaCheckCircle className="selected-icon" /></div>}
            </div>
            <div className="grid-item-info"><h4>{item.name}</h4><div className="grid-item-price">₹{item.price}</div><div className="grid-item-unit">{item.unit}</div></div>
          </div>
        ))}
      </div>
      <div className="grid-actions">
        <button className="continue-selection-btn" onClick={handleContinue} disabled={getSelectedCount() === 0}>Continue with {getSelectedCount()} item(s)</button>
        <button className="cancel-selection-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

// ============================================
// COMPONENT: Auto-Pay Confirmation
// ============================================
const AutoPayConfirmation = ({ confirmationData, onNavigate }) => {
  return (
    <div className="auto-pay-confirmation">
      <div className="confirmation-icon">🎉</div>
      <h3>{confirmationData.title}</h3>
      <p>{confirmationData.message}</p>
      <div className="auto-pay-details-summary">
        <div>Items: {confirmationData.items.length} item(s)</div>
        <div>Total: ₹{confirmationData.total}</div>
        <div>Schedule: {confirmationData.schedule}</div>
        <div>Next Payment: {confirmationData.nextPayment}</div>
      </div>
      <button className="view-auto-pay-btn" onClick={onNavigate}>View in Auto Pay Section</button>
    </div>
  );
};

// ============================================
// MAIN COMPONENT: AgentChatPage
// ============================================
const AgentChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ordersSidebarOpen, setOrdersSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [copiedId, setCopiedId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  
  // Order state
  const [pendingAction, setPendingAction] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reserveLimits, setReserveLimits] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [activeOrderSession, setActiveOrderSession] = useState(null);
  
  // Custom Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrderForPayment, setPendingOrderForPayment] = useState(null);
  
  // Success/Error modals
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [showFailedAnimation, setShowFailedAnimation] = useState(false);
  const [failedTransactionResult, setFailedTransactionResult] = useState(null);
  const [clearOrderOnClose, setClearOrderOnClose] = useState(false);
  
  // Auto-Pay state
  const [autoPaySetup, setAutoPaySetup] = useState(null);
  const [showAutoPayModal, setShowAutoPayModal] = useState(false);
  const [autoPayBankAccounts, setAutoPayBankAccounts] = useState([]);
  const [autoPayDay, setAutoPayDay] = useState(new Date().getDate());
  const [selectedAutoPayBank, setSelectedAutoPayBank] = useState(null);
  const [showAutoPaySetupModal, setShowAutoPaySetupModal] = useState(false);
  const [pendingAutoPayOrder, setPendingAutoPayOrder] = useState(null);
  
  // Track which merchants are connected
  const [connectedMerchants, setConnectedMerchants] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  // Get current user ID
  const getUserId = () => {
    return getCurrentUserId();
};

  // Load connected merchants
  useEffect(() => {
    loadConnectedMerchants();
  }, [user]);

  const loadConnectedMerchants = () => {
    const userId = getUserId();
    const connected = merchantConnectionService.getConnectedMerchants(userId);
    setConnectedMerchants(connected);
  };

  useEffect(() => {
    loadUserLocations();
  }, [user]);

  const loadUserLocations = () => {
    const userId = getUserId();
    const savedLocations = localStorage.getItem(`merchant_locations_${userId}`);
    if (savedLocations) setUserLocation(JSON.parse(savedLocations));
  };

  const getUserLocationForMerchant = (merchant) => {
    if (userLocation && userLocation[merchant]) return userLocation[merchant];
    return null;
  };

  // Initialize demo connections
  useEffect(() => {
    const userId = getUserId();
    const connections = merchantConnectionService.getConnections(userId);
    if (Object.keys(connections).length === 0) {
      merchantConnectionService.initDemoConnections(userId);
      loadConnectedMerchants();
    }
  }, [user]);

  // Load Reserve Pay limits
  useEffect(() => {
    loadReserveLimits();
  }, [user]);

  const loadReserveLimits = async () => {
    const limits = await getReserveLimits();
    const limitsMap = {};
    // Ensure limits is an array before iterating
    if (limits && Array.isArray(limits)) {
        limits.forEach(limit => { 
            limitsMap[limit.merchant] = limit; 
        });
    }
    setReserveLimits(limitsMap);
};

  // Load data on mount
  useEffect(() => {
    checkApiStatus();
    loadConversations();
    loadOrders();
    loadCurrentChat();
    const interval = setInterval(() => refreshOrders(), 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const checkApiStatus = async () => {
    try {
      await axios.get('http://localhost:5000/health', { timeout: 3000 });
      setApiStatus('online');
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const loadConversations = () => {
    const userId = getUserId();
    const saved = localStorage.getItem(`agentConversations_${userId}`);
    if (saved) setConversations(JSON.parse(saved));
  };

  const loadOrders = async () => {
    try {
        const token = localStorage.getItem('token');
        const userId = getUserId();

        const response = await axios.get('http://localhost:5000/api/agent/order/orders', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            params: { _t: Date.now(), userId }
        });

        if (response.data && response.data.success) {
            let orders = response.data.data || [];
            const now = Date.now();
            const deliveryDuration = 45 * 60 * 1000;

            orders = orders.map(order => {
                if (!order.createdAt) return order;
                const created = new Date(order.createdAt).getTime();
                const elapsed = now - created;

                if (elapsed >= deliveryDuration) {
                    order.status = 'delivered';
                } else if (elapsed >= deliveryDuration * 0.66) {
                    order.status = 'out_for_delivery';
                } else if (elapsed >= deliveryDuration * 0.33) {
                    order.status = 'preparing';
                } else {
                    order.status = 'confirmed';
                }
                return order;
            });

            setOrders(orders);
            localStorage.setItem(`agentOrders_${userId}`, JSON.stringify(orders));
        }
    } catch (error) {
        console.error('Failed to load orders:', error);
        const userId = getUserId();
        const savedOrders = localStorage.getItem(`agentOrders_${userId}`);
        if (savedOrders) setOrders(JSON.parse(savedOrders));
    }
};

  const refreshOrders = async (showToast = false) => {
    try {
        if (showToast) toast.loading('Refreshing orders...', { id: 'refresh' });
        const token = localStorage.getItem('token');
        const userId = getUserId();

        let orders = [];
        try {
            const response = await axios.get('http://localhost:5000/api/agent/order/orders', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                params: { _t: Date.now(), userId }
            });
            if (response.data && response.data.success && response.data.data) {
                orders = response.data.data;
                localStorage.setItem(`agentOrders_${userId}`, JSON.stringify(orders));
            }
        } catch (error) {
            const savedOrders = localStorage.getItem(`agentOrders_${userId}`);
            if (savedOrders) orders = JSON.parse(savedOrders);
        }

        const now = Date.now();
        const deliveryDuration = 45 * 60 * 1000; // 45 minutes

        const updatedOrders = orders.map(order => {
            if (!order.createdAt) return order;
            const created = new Date(order.createdAt).getTime();
            const elapsed = now - created;

            let status = order.status;
            let tracking = order.tracking || [];

            if (elapsed >= deliveryDuration) {
                status = 'delivered';
                tracking = tracking.map(step => 
                    step.status === 'delivered' ? { ...step, completed: true, time: new Date().toLocaleTimeString() } : step
                );
            } else if (elapsed >= deliveryDuration * 0.66) {
                status = 'out_for_delivery';
            } else if (elapsed >= deliveryDuration * 0.33) {
                status = 'preparing';
            } else {
                status = 'confirmed';
            }

            return { ...order, status, tracking };
        });

        setOrders(updatedOrders);
        if (showToast) toast.success(`Found ${updatedOrders.length} orders!`, { id: 'refresh' });
    } catch (error) {
        if (showToast) toast.error('Failed to refresh orders', { id: 'refresh' });
        console.error('Refresh orders error:', error);
    }
};

// Poll for order updates every 10 seconds
useEffect(() => {
    const interval = setInterval(() => {
        refreshOrders();
    }, 10000);
    return () => clearInterval(interval);
}, []);

  const loadCurrentChat = () => {
    const userId = getUserId();
    const currentChatId = localStorage.getItem(`currentChatId_${userId}`);
    if (currentChatId) loadConversationById(currentChatId);
    else startNewChat();
  };

  const loadConversationById = (convId) => {
    const userId = getUserId();
    const savedMessages = localStorage.getItem(`chat_${userId}_${convId}`);
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      setMessages(parsedMessages);
      setCurrentConversationId(convId);
      const lastMsg = [...parsedMessages].reverse().find(m => m.role === 'agent' && m.sessionId);
      if (lastMsg && lastMsg.sessionId) {
        setSessionId(lastMsg.sessionId);
        setPendingAction(lastMsg.requiresAction);
        if (lastMsg.cart) setCart(lastMsg.cart);
        if (lastMsg.total) setCartTotal(lastMsg.total);
      }
    } else startNewChat();
  };

  const startNewChat = () => {
    const userId = getUserId();
    const newConvId = 'conv_' + Date.now();
    const welcomeMessage = [{
      id: Date.now(),
      role: 'agent',
      content: "👋 Hi! I'm SabAI, your AI payment assistant. I can help you with UPI payments, bill payments, mobile recharge, food ordering, shopping, Reserve Pay limits, SabAI Gems, and Auto-Pay recurring orders. What would you like help with today?",
      timestamp: new Date().toISOString()
    }];
    setMessages(welcomeMessage);
    setCurrentConversationId(newConvId);
    setSessionId(null);
    setPendingAction(null);
    setCart([]);
    setCartTotal(0);
    localStorage.setItem(`chat_${userId}_${newConvId}`, JSON.stringify(welcomeMessage));
    localStorage.setItem(`currentChatId_${userId}`, newConvId);
    const newConv = { id: newConvId, title: 'New Chat', lastMessage: new Date().toISOString(), preview: welcomeMessage[0].content.substring(0, 50) + '...' };
    const updatedConvs = [newConv, ...conversations.filter(c => c.id !== newConvId)].slice(0, 20);
    setConversations(updatedConvs);
    localStorage.setItem(`agentConversations_${userId}`, JSON.stringify(updatedConvs));
  };

  const loadConversation = (convId) => {
    const userId = getUserId();
    const savedMessages = localStorage.getItem(`chat_${userId}_${convId}`);
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      setMessages(parsedMessages);
      setCurrentConversationId(convId);
      const lastMsg = [...parsedMessages].reverse().find(m => m.role === 'agent' && m.sessionId);
      if (lastMsg && lastMsg.sessionId) {
        setSessionId(lastMsg.sessionId);
        setPendingAction(lastMsg.requiresAction);
        if (lastMsg.cart) setCart(lastMsg.cart);
        if (lastMsg.total) setCartTotal(lastMsg.total);
      }
      localStorage.setItem(`currentChatId_${userId}`, convId);
      setSidebarOpen(false);
    }
  };

  const deleteConversation = (convId, e) => {
    e.stopPropagation();
    const userId = getUserId();
    if (window.confirm('Delete this conversation?')) {
      localStorage.removeItem(`chat_${userId}_${convId}`);
      const updatedConvs = conversations.filter(c => c.id !== convId);
      setConversations(updatedConvs);
      localStorage.setItem(`agentConversations_${userId}`, JSON.stringify(updatedConvs));
      if (convId === currentConversationId) startNewChat();
      toast.success('Conversation deleted');
    }
  };

  const saveMessages = (newMessages) => {
    const userId = getUserId();
    setMessages(newMessages);
    if (currentConversationId) {
      localStorage.setItem(`chat_${userId}_${currentConversationId}`, JSON.stringify(newMessages));
      const lastAgentMsg = [...newMessages].reverse().find(m => m.role === 'agent');
      let preview = 'Chat';
      if (lastAgentMsg) {
        if (typeof lastAgentMsg.content === 'string') preview = lastAgentMsg.content.substring(0, 50) + '...';
        else if (lastAgentMsg.content && typeof lastAgentMsg.content === 'object') preview = lastAgentMsg.content.title || 'Response';
        else if (lastAgentMsg.cart) preview = `Cart: ${lastAgentMsg.cart.length} items`;
      }
      const updatedConvs = conversations.map(conv => conv.id === currentConversationId ? { ...conv, lastMessage: new Date().toISOString(), preview } : conv);
      setConversations(updatedConvs);
      localStorage.setItem(`agentConversations_${userId}`, JSON.stringify(updatedConvs));
    }
  };

  const saveConversation = (title) => {
    const userId = getUserId();
    let preview = 'Chat';
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
      if (typeof lastMsg.content === 'string') preview = lastMsg.content.substring(0, 50) + '...';
      else if (lastMsg.content && typeof lastMsg.content === 'object') preview = lastMsg.content.title || 'Response';
      else if (lastMsg.cart) preview = `Cart: ${lastMsg.cart.length} items`;
    }
    const newConv = { id: currentConversationId, title: title || 'New Chat', lastMessage: new Date().toISOString(), preview };
    const existingIndex = conversations.findIndex(c => c.id === currentConversationId);
    let updatedConvs;
    if (existingIndex >= 0) {
      updatedConvs = [...conversations];
      updatedConvs[existingIndex] = newConv;
    } else {
      updatedConvs = [newConv, ...conversations];
    }
    setConversations(updatedConvs.slice(0, 20));
    localStorage.setItem(`agentConversations_${userId}`, JSON.stringify(updatedConvs.slice(0, 20)));
  };

  // ============================================
  // DETECT AUTO PAY INTENT
  // ============================================
  const detectAutoPayIntent = (message) => {
    const msg = message.toLowerCase();
    const autoPayKeywords = [
      'auto order', 'auto-order', 'auto pay', 'autopay', 'recurring',
      'every month', 'monthly', 'set up auto', 'schedule', 'repeat',
      'auto every', 'automatically every', 'on every'
    ];
    return autoPayKeywords.some(keyword => msg.includes(keyword));
  };

  // ============================================
  // HANDLE ADD ITEMS FROM GRID
  // ============================================
  const handleAddSelectedItemsToCart = async (selectedItems, menuData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agent/order/select-items', {
        sessionId: menuData.sessionId,
        selectedItems: selectedItems.map(item => ({ id: item.id, name: item.name, quantity: 1, price: item.price }))
      }, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      if (response.data.success) {
        const data = response.data.data;
        const aiMessageObj = { id: Date.now(), role: 'agent', content: data.response, timestamp: new Date().toISOString(), sessionId: data.sessionId, cart: data.cart, total: data.total, requiresAction: data.requiresAction, merchant: data.merchant };
        saveMessages([...messages, aiMessageObj]);
        if (data.cart) { setCart(data.cart); setCartTotal(data.total); }
        if (data.sessionId) { setSessionId(data.sessionId); setPendingAction(data.requiresAction); }
        toast.success(`Added ${selectedItems.length} items to cart!`);
      }
    } catch (error) { console.error('Failed to add items to cart:', error); toast.error('Failed to add items to cart'); }
    finally { setLoading(false); }
  };

  const handleAddItems = () => { setInput("Add items"); setTimeout(() => handleSendMessage(), 100); };
  const handleClearCart = () => { setInput("Clear cart"); setTimeout(() => handleSendMessage(), 100); };

  // Handle UPI Payment - Open Custom Payment Modal
  const handleUPIPayment = (orderData) => {
    setPendingOrderForPayment(orderData);
    setShowPaymentModal(true);
  };

  // Handle Reserve Payment - Also Open Custom Payment Modal (it will show Reserve Pay as option)
 const handleReservePayment = (orderData) => {
  setPendingOrderForPayment(orderData);
  setShowPaymentModal(true);
};

const handleViewTransaction = () => {
    setShowSuccessAnimation(false);
    navigate('/transactions');
};

const handleNewPayment = () => {
    setShowSuccessAnimation(false);
    // Clear cart and start fresh
    setCart([]);
    setCartTotal(0);
    setSessionId(null);
    setPendingAction(null);
};

// ============================================
// HANDLE RESERVE PAY PAYMENT - DIRECT (No Modal)
// ============================================
// HANDLE RESERVE PAY PAYMENT - DIRECT (No Modal)
// In AgentChatPage.jsx, update the handleReservePayPayment function:

const handleReservePayPayment = async (orderData) => {
  setLoading(true);
  
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      'http://localhost:5000/api/agent/order/process-reserve',
      { sessionId: orderData.sessionId },
      { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
    );
    
    if (response.data && response.data.success) {
      const result = response.data.data;
      
      // Find and remove the order summary card from messages
      // and replace it with the confirmation message
      const updatedMessages = [...messages];
      
      // Find the last agent message that contains the order summary
      let orderSummaryIndex = -1;
      for (let i = updatedMessages.length - 1; i >= 0; i--) {
        const msg = updatedMessages[i];
        if (msg.role === 'agent' && msg.content && typeof msg.content === 'object' && msg.content.type === 'order_summary') {
          orderSummaryIndex = i;
          break;
        }
      }
      
      if (orderSummaryIndex !== -1) {
        // Replace the order summary with confirmation message
        updatedMessages[orderSummaryIndex] = {
          id: Date.now(),
          role: 'agent',
          content: result.response,
          timestamp: new Date().toISOString()
        };
      } else {
        // If no order summary found, just add confirmation message
        const successMessageObj = {
          id: Date.now(),
          role: 'agent',
          content: result.response,
          timestamp: new Date().toISOString()
        };
        updatedMessages.push(successMessageObj);
      }
      
      saveMessages(updatedMessages);
      
      // Show success animation
      setTransactionResult({
        amount: orderData.total,
        merchant: orderData.merchant || orderData.merchantName,
        cashback: result.order?.sabaiGems || 0,
        payment_method_display: "Reserve Pay",
        transactionId: result.orderId
      });
      setShowSuccessAnimation(true);
      
      // Refresh orders
      refreshOrders();
      
      // Clear cart and session
      setCart([]);
      setCartTotal(0);
      setSessionId(null);
      setPendingAction(null);
      
      toast.success(`Payment successful via Reserve Pay!`);
    } else {
      throw new Error(response.data?.message || 'Reserve Pay failed');
    }
  } catch (error) {
    console.error('Reserve Pay payment failed:', error);
    const failedData = {
      amount: orderData.total,
      merchant: orderData.merchant || orderData.merchantName || 'Unknown',
      failure_reason: error.response?.data?.message || error.message || "Reserve Pay failed. Please try UPI payment.",
      payment_method_display: `Reserve Pay`
    };
    setFailedTransactionResult(failedData);
    setShowFailedAnimation(true);
  } finally {
    setLoading(false);
  }
};
  // Handle Payment Success
  const handlePaymentSuccess = async (transactionData) => {
  setShowPaymentModal(false);
  setPendingOrderForPayment(null);
  
  // Find and remove the order summary card from messages
  const updatedMessages = [...messages];
  
  // Find the last agent message that contains the order summary
  let orderSummaryIndex = -1;
  for (let i = updatedMessages.length - 1; i >= 0; i--) {
    const msg = updatedMessages[i];
    if (msg.role === 'agent' && msg.content && typeof msg.content === 'object' && msg.content.type === 'order_summary') {
      orderSummaryIndex = i;
      break;
    }
  }
  
  const successMessageObj = {
    id: Date.now(),
    role: 'agent',
    content: `✅ **Payment Successful!**\n\nYour order has been confirmed.\n\n**Transaction ID:** ${transactionData.transactionId}\n\n**Amount Paid:** ₹${transactionData.amount.toLocaleString()}\n\n**Payment Method:** ${transactionData.payment_method_display}\n\n**Cashback Earned:** +${transactionData.cashback} 🪙\n\nThank you for shopping with SabAI Pay! 🎉`,
    timestamp: new Date().toISOString()
  };
  
  if (orderSummaryIndex !== -1) {
    updatedMessages[orderSummaryIndex] = successMessageObj;
    saveMessages(updatedMessages);
  } else {
    saveMessages([...messages, successMessageObj]);
  }
  
  // Show success animation
  setTransactionResult(transactionData);
  setShowSuccessAnimation(true);
  
  // Refresh orders
  refreshOrders();
  
  // Clear cart and session
  setCart([]);
  setCartTotal(0);
  setSessionId(null);
  setPendingAction(null);
};

  // Handle Payment Failure
  const handlePaymentFailure = (failedData) => {
    setShowPaymentModal(false);
    
    // Add failure message to chat
    const failureMessageObj = {
      id: Date.now(),
      role: 'agent',
      content: `❌ **Payment Failed!**\n\nYour payment could not be processed.\n\n**Reason:** ${failedData.failure_reason}\n**Amount:** ₹${failedData.amount.toLocaleString()}\n\nWould you like to try again with a different payment method or clear the order?`,
      timestamp: new Date().toISOString()
    };
    saveMessages([...messages, failureMessageObj]);
    
    // Show failed animation
    setFailedTransactionResult(failedData);
    setShowFailedAnimation(true);
    setClearOrderOnClose(false);
  };

  // Handle Retry Payment from Failed Modal
  const handleRetryPayment = () => {
    setShowFailedAnimation(false);
    setFailedTransactionResult(null);
    // Re-open payment modal with same order
    if (pendingOrderForPayment) {
      setShowPaymentModal(true);
    }
  };

  // Handle Clear Order from Failed Modal
  const handleClearOrder = () => {
    setShowFailedAnimation(false);
    setFailedTransactionResult(null);
    setPendingOrderForPayment(null);
    setCart([]);
    setCartTotal(0);
    setSessionId(null);
    setPendingAction(null);
    
    // Add clear order message to chat
    const clearMessageObj = {
      id: Date.now(),
      role: 'agent',
      content: `🗑️ **Order Cleared**\n\nYour cart has been cleared. You can start a new order anytime! Is there anything else I can help you with?`,
      timestamp: new Date().toISOString()
    };
    saveMessages([...messages, clearMessageObj]);
    
    toast.info('Order has been cleared');
  };

  const handleSelectedItemsSubmit = async (selectedItems, gridData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/agent/order/select-items', {
        sessionId: gridData.sessionId,
        selectedItems: selectedItems.map(item => ({ id: item.id, name: item.name, quantity: 1, price: item.price }))
      }, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      if (response.data.success) {
        const data = response.data.data;
        const aiMessageObj = { id: Date.now(), role: 'agent', content: data.response, timestamp: new Date().toISOString(), sessionId: data.sessionId, cart: data.cart, total: data.total, requiresAction: data.requiresAction, merchant: data.merchant };
        saveMessages([...messages, aiMessageObj]);
        if (data.cart) { setCart(data.cart); setCartTotal(data.total); }
        if (data.sessionId) { setSessionId(data.sessionId); setPendingAction(data.requiresAction); }
        toast.success(`Added ${selectedItems.length} items to cart!`);
      }
    } catch (error) { console.error('Failed to submit selected items:', error); toast.error('Failed to add items to cart'); }
    finally { setLoading(false); }
  };

  const checkMerchantConnection = async (merchant) => {
  const userId = getUserId();
  try { 
    const isConnected = await merchantConnectionService.isConnected(userId, merchant);
    return isConnected;
  }
  catch (error) { 
    console.error('Connection check error:', error);
    return false; 
  }
};

  const detectMerchantFromMessage = (message) => {
    const msg = message.toLowerCase();
    const merchantMap = {
        'swiggy': ['swiggy', 'food delivery', 'order food', 'food from swiggy', 'order from swiggy', 'i want to order from swiggy'],
        'zomato': ['zomato', 'order from zomato', 'food from zomato'],
        'zepto': ['zepto', 'grocery', 'groceries', 'order from zepto'],
        'blinkit': ['blinkit', 'order from blinkit'],
        'amazon': ['amazon', 'amzn', 'shop', 'shopping', 'order from amazon'],
        'flipkart': ['flipkart', 'fk', 'order from flipkart'],
        'netmeds': ['netmeds', 'medicine', 'order from netmeds'],
        'pharmeasy': ['pharmeasy', 'pharmacy', 'order from pharmeasy']
    };
    
    for (const [merchant, keywords] of Object.entries(merchantMap)) {
        for (const keyword of keywords) {
            if (msg.includes(keyword)) {
                console.log(`🎯 Frontend detected merchant: ${merchant} from keyword: "${keyword}"`);
                return merchant;
            }
        }
    }
    
    // Check for "order from X" pattern
    const orderFromMatch = msg.match(/order\s+from\s+(\w+)/i);
    if (orderFromMatch) {
        const merchant = orderFromMatch[1].toLowerCase();
        if (availableMerchants.some(m => m.id === merchant)) {
            return merchant;
        }
    }
    
    return null;
};

  const isMerchantSupported = (merchant) => availableMerchants.map(m => m.id).includes(merchant);
  const getMerchantInfo = (merchantId) => availableMerchants.find(m => m.id === merchantId) || { id: merchantId, name: merchantId.charAt(0).toUpperCase() + merchantId.slice(1) };

  const checkReservePayLimit = (merchant, amount) => {
    const limit = reserveLimits[merchant];
    if (!limit) return { eligible: false, remaining: 0, message: "No Reserve Pay limit set for this merchant" };
    const remaining = limit.monthly_limit - (limit.current_spent || 0);
    const eligible = amount <= remaining;
    return { eligible, remaining, limit: limit.monthly_limit, spent: limit.current_spent || 0, message: eligible ? `✅ Within Reserve Pay limit! ₹${remaining} remaining.` : `❌ Exceeds Reserve Pay limit by ₹${amount - remaining}` };
  };
  
const checkReservePayAvailability = async (merchant, amount) => {
    if (!merchant) {
        console.error('❌ Merchant is undefined in checkReservePayAvailability');
        return {
            available: false,
            eligible: false,
            limit: 0,
            spent: 0,
            remaining: 0,
            message: "No merchant specified. Please try again."
        };
    }
    
    try {
        console.log(`🔍 Checking Reserve Pay for merchant: ${merchant}, amount: ${amount}`);
        
        const token = localStorage.getItem('token');
        const response = await axios.post(
            'http://localhost:5000/api/agent/order/check-reserve',
            { merchant: merchant, amount: amount },
            { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        
        if (response.data && response.data.success) {
            console.log('✅ Reserve Pay check result:', response.data.data);
            return response.data.data;
        }
        
        return {
            available: false,
            eligible: false,
            limit: 0,
            spent: 0,
            remaining: 0,
            message: "Unable to check Reserve Pay limit"
        };
    } catch (error) {
        console.error('❌ Error checking Reserve Pay:', error);
        return {
            available: false,
            eligible: false,
            limit: 0,
            spent: 0,
            remaining: 0,
            message: "Error checking Reserve Pay limit"
        };
    }
};

  const getGuideMessageForMerchant = (merchant) => {
    const guides = {
      'uber': "**How to book an Uber ride:**\n1. Download the Uber app\n2. Create an account or log in\n3. Enter your pickup and drop locations\n4. Select your ride type\n5. Confirm your booking",
      'ola': "**How to book an Ola ride:**\n1. Download the Ola app\n2. Sign up or log in\n3. Enter your pickup location\n4. Choose your destination\n5. Select a cab type\n6. Confirm your booking",
      'irctc': "**How to book train tickets:**\n1. Visit irctc.co.in or download the IRCTC app\n2. Login with your IRCTC credentials\n3. Search for trains\n4. Select your train and class\n5. Add passenger details\n6. Complete payment",
      'default': "**How to book on the app:**\n1. Download the official app\n2. Create an account\n3. Follow in-app instructions\n4. Complete your booking"
    };
    return guides[merchant] || guides.default;
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };
  const clearChat = () => { if (window.confirm('Start a new chat? Current chat will be saved.')) { startNewChat(); toast.success('New chat started'); } };

  const formatTime = (timestamp) => {
    try { const date = new Date(timestamp); return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return ''; }
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch (e) { return ''; }
  };

  const copyToClipboard = (text, id) => {
    if (typeof text === 'string') { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); toast.success('Copied!'); }
    else { navigator.clipboard.writeText(JSON.stringify(text, null, 2)); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); toast.success('Copied!'); }
  };

  const getStatusColor = (status) => {
    switch(status) {
        case 'delivered': return '#10b981';
        case 'out_for_delivery': return '#3b82f6';
        case 'preparing': return '#f59e0b';
        case 'confirmed': return '#8b5cf6';
        default: return '#64748b';
    }
};

const getStatusIcon = (status) => {
    switch(status) {
        case 'delivered': return <FaCheckCircle />;
        case 'out_for_delivery': return <FaTruck />;
        case 'preparing': return <FaClock />;
        case 'confirmed': return <FaCheckCircle />;
        default: return <FaClock />;
    }
};

  // Add this function to AgentChatPage.jsx
const refreshReserveLimitsFromBackend = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/agent/order/reserve-limits', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.data.success) {
            // Update local reserveLimits state
            const limitsMap = {};
            const limitsArray = Object.values(response.data.data);
            limitsArray.forEach(limit => {
                limitsMap[limit.merchant] = limit;
            });
            setReserveLimits(limitsMap);
            
            // Also update localStorage for consistency
            localStorage.setItem('reserveLimits', JSON.stringify(limitsArray));
        }
    } catch (error) {
        console.error('Failed to refresh limits:', error);
    }
};
// Call this when the component mounts and after payments
useEffect(() => {
    refreshReserveLimitsFromBackend();
}, []);

const initiateCheckout = async (cart, total, sessionId) => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        
        // First create Razorpay order
        const orderResponse = await axios.post(
            'http://localhost:5000/api/agent/order/create-order',
            { amount: total, sessionId },
            { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        
        if (orderResponse.data.success) {
            const razorpayOrder = orderResponse.data.data.razorpayOrder;
            
            // Initialize Razorpay checkout
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'SabAI Pay',
                description: `Order payment for ${cart.length} items`,
                order_id: razorpayOrder.id,
                handler: async (response) => {
                    // Confirm payment with backend
                    const confirmResponse = await axios.post(
                        'http://localhost:5000/api/agent/order/confirm-upi',
                        { sessionId, paymentId: response.razorpay_payment_id },
                        { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
                    );
                    
                    if (confirmResponse.data.success) {
                        const data = confirmResponse.data.data;
                        const aiMessageObj = {
                            id: Date.now(),
                            role: 'agent',
                            content: data.response,
                            timestamp: new Date().toISOString()
                        };
                        saveMessages([...messages, aiMessageObj]);
                        toast.success('Payment successful!');
                        
                        // Clear cart
                        setCart([]);
                        setCartTotal(0);
                        setSessionId(null);
                        setPendingAction(null);
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                },
                theme: {
                    color: '#4f46e5'
                }
            };
            
            const razorpay = new window.Razorpay(options);
            razorpay.open();
        }
    } catch (error) {
        console.error('Checkout error:', error);
        toast.error('Failed to initiate payment');
    } finally {
        setLoading(false);
    }
};

  // ============================================
  // RENDER MESSAGE CONTENT
  // ============================================
  const renderMessageContent = (message) => {
    // First, check if content is a string that might be JSON
    let content = message.content;
    
    // If content is a string, try to parse it as JSON
    if (typeof content === 'string') {
        // Check if it looks like JSON (starts with { or [)
        if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
            try {
                const parsed = JSON.parse(content);
                console.log('Parsed JSON content:', parsed);
                content = parsed;
            } catch (e) {
                // Not valid JSON, keep as string
                console.log('Not valid JSON, keeping as string');
            }
        }
    }
    
    // Now check for products grid (restaurant menu items)
    if (content && typeof content === 'object' && content.type === 'products_grid') {
    const products = content.products || [];
    const merchant = content.merchant;
    const restaurantName = products[0]?.restaurantName || content.restaurantName || '';
    const restaurantRating = products[0]?.restaurantRating;
    const deliveryTime = products[0]?.deliveryTime;
    
    // Don't check activeOrderSession here - let the component handle its own state
    // Get reserve check status
    const reserveCheck = content.reserveCheck || null;
    
    return (
           <RestaurantOrderComponent
            key={message.sessionId}
            restaurant={{
                name: restaurantName,
                rating: restaurantRating,
                deliveryTime: deliveryTime
            }}
            menuItems={products}
            merchant={merchant}
            sessionId={message.sessionId}  // Make sure this is the correct session ID
            onCartUpdate={(updatedCart) => {
              console.log('Rendering RestaurantOrderComponent with sessionId:', message.sessionId);
    console.log('Cart updated in parent:', updatedCart);
    setCart(updatedCart);
    const total = updatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartTotal(total);
    
    // Also update the message in chat to reflect cart changes
    const updatedMessages = messages.map(msg => {
        if (msg.id === message.id && msg.content && msg.content.type === 'products_grid') {
            return {
                ...msg,
                cart: updatedCart,
                total: total
            };
        }
        return msg;
    });
    saveMessages(updatedMessages);
}}
            onProceedToPayment={(cart, total) => {
                initiateCheckout(cart, total, message.sessionId);
            }}
            onScheduleSuccess={(cart, total, scheduledTime) => {
        // Add confirmation message to chat
        const scheduledDate = new Date(scheduledTime);
        const formattedDate = scheduledDate.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        const formattedTime = scheduledDate.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
        });
        const confirmationMessage = {
            id: Date.now(),
            role: 'agent',
            content: `📅 **Order Scheduled!**\n\nYour order has been scheduled for **${formattedDate} at ${formattedTime}**.\n\n**Items:** ${cart.length} item(s)\n**Total:** ₹${total}\n\nYou can view and manage this scheduled order in **Reserve Pay → Auto Pay** section.`,
            timestamp: new Date().toISOString()
        };
        saveMessages([...messages, confirmationMessage]);
        // Clear cart and session
        setCart([]);
        setCartTotal(0);
        setSessionId(null);
        setPendingAction(null);
        // Refresh orders (optional)
        refreshOrders();
    }}
/>
    );
}


    
    // Check for situation suggestions
    if (content && typeof content === 'object' && content.type === 'situation_suggestions') {
        return (
            <SituationSuggestionsCard
                situation={content.situation}
                explanation={content.explanation}
                essentialItems={content.essentialItems || []}
                otherItems={content.otherItems || []}
                allItems={content.allItems || []}
                categories={content.categories}
                merchant={content.merchant}
                totalEstimatedCost={content.totalEstimatedCost}
                onItemSelect={(item) => handleAddSingleItemToCart(item, content.merchant, message.sessionId)}
                onOrderEssentials={(items) => handleAddMultipleItemsToCart(items, content.merchant, message.sessionId)}
                onSelectItems={(items) => handleAddMultipleItemsToCart(items, content.merchant, message.sessionId)}
                onCustomize={() => setInput(`I want to customize my ${content.situation} order`)}
            />
        );
    }
    
    // Check for enhanced order summary
    if (content && typeof content === 'object' && content.type === 'order_summary') {
        return (
            <EnhancedOrderSummary
                initialItems={message.cart || []}
                suggestedItems={content.items || []}
                merchant={content.merchantName || content.merchant || message.merchant}
                merchantLogo={content.merchantLogo}
                onCartUpdate={(cart) => updateCartInSession(cart, message.sessionId)}
                onCheckout={(cart, total) => initiateCheckout(cart, total, message.sessionId)}
                onClearCart={() => handleClearCart()}
                onScheduleOrder={(cart, total, scheduledTime) => handleScheduleOrder(cart, total, scheduledTime, message.sessionId)}
                reserveCheck={content.reserveCheck}
                sabaiGems={content.sabaiGems}
                isInteractable={true}
                showSuggestions={false}
            />
        );
    }

    if (content && typeof content === 'object' && content.type === 'restaurants_with_menus') {
    const restaurants = content.restaurants || [];
    const merchant = content.merchant;
    
    return (
        <div className="restaurants-with-menus-container">
            <div className="restaurants-header">
                <h3>🍽️ Restaurants near you</h3>
                <p className="restaurants-subtitle">Click on any restaurant to view full menu</p>
            </div>
            <div className="restaurants-list-horizontal">
                {restaurants.map((restData, idx) => (
                    <div key={restData.restaurant.id} className="restaurant-card-horizontal">
                        <div className="restaurant-header-info">
                            <div className="restaurant-image">
                                <img src={restData.restaurant.imageUrl || '/images/restaurants/default.jpg'} alt={restData.restaurant.name} />
                            </div>
                            <div className="restaurant-info">
                                <h4>{restData.restaurant.name}</h4>
                                <div className="restaurant-meta">
                                    <span className="rating">⭐ {restData.restaurant.rating}</span>
                                    <span className="cuisine">{restData.restaurant.cuisine}</span>
                                    <span className="delivery">⏱️ {restData.restaurant.deliveryTime}</span>
                                </div>
                                <div className="restaurant-price">₹{restData.restaurant.priceForTwo} for two</div>
                            </div>
                        </div>
                        
                        <div className="popular-items-section">
                            <div className="popular-items-header">
                                <span>🔥 Popular Items</span>
                                <button 
                                    className="view-full-menu-btn"
                                    onClick={() => handleViewFullMenu(restData.restaurant, merchant, message.sessionId)}
                                >
                                    View Full Menu →
                                </button>
                            </div>
                            <div className="popular-items-grid">
                                {restData.popularItems.map(item => (
                                    <div key={item.id} className="popular-item-card" onClick={() => handleAddSingleItemToCart(item, merchant, message.sessionId)}>
                                        <div className="popular-item-image">
                                            <img src={item.imageUrl || '/images/items/default.jpg'} alt={item.name} />
                                        </div>
                                        <div className="popular-item-info">
                                            <div className="popular-item-name">{item.name}</div>
                                            <div className="popular-item-price">₹{item.price}</div>
                                            <button className="add-item-btn">+ Add</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
    
    // Check for restaurants list
    if (content && typeof content === 'object' && content.type === 'restaurants_list') {
        return (
            <div className="restaurants-list-container">
                <h3>Restaurants near you</h3>
                <div className="restaurants-grid">
                    {content.restaurants?.map(restaurant => (
                        <div 
                            key={restaurant.id} 
                            className="restaurant-card"
                            onClick={() => handleSelectRestaurant(restaurant, content.merchant, message.sessionId)}
                        >
                            <div className="restaurant-image">
                                <img src={restaurant.imageUrl || '/images/restaurants/default.jpg'} alt={restaurant.name} />
                            </div>
                            <div className="restaurant-info">
                                <h4>{restaurant.name}</h4>
                                <div className="restaurant-cuisine">{restaurant.cuisine}</div>
                                <div className="restaurant-rating">⭐ {restaurant.rating} ({restaurant.ratingCount}+)</div>
                                <div className="restaurant-delivery">⏱️ {restaurant.deliveryTime}</div>
                                <div className="restaurant-price">₹{restaurant.priceForTwo} for two</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    // Check for auto-pay confirmation
    if (content && typeof content === 'object' && content.type === 'auto_pay_confirmed') {
        return (
            <div className="auto-pay-confirmation">
                <div className="confirmation-icon">🎉</div>
                <h3>{content.title}</h3>
                <p>{content.message}</p>
                <div className="auto-pay-details">
                    <div>Items: {content.items?.length} item(s)</div>
                    <div>Total: ₹{content.total}</div>
                    <div>Schedule: {content.schedule}</div>
                    <div>Next Payment: {content.nextPayment}</div>
                </div>
                <button onClick={() => navigate('/reserve-pay')}>View in Auto Pay Section</button>
            </div>
        );
    }
    
    // Default: render as markdown for string content
    if (typeof content === 'string') {
        return <ReactMarkdown>{content}</ReactMarkdown>;
    }
    
    // Fallback for any other object type
    if (typeof content === 'object') {
        return <pre>{JSON.stringify(content, null, 2)}</pre>;
    }
    
    return <ReactMarkdown>{String(content)}</ReactMarkdown>;
};

const handleViewFullMenu = async (restaurant, merchant, sessionId) => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            'http://localhost:5000/api/agent/order/select-restaurant',
            {
                sessionId: sessionId,
                restaurantId: restaurant.id,
                restaurantName: restaurant.name
            },
            { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        
        if (response.data.success) {
            const data = response.data.data;
            const aiMessageObj = {
                id: Date.now(),
                role: 'agent',
                content: data.response,
                timestamp: new Date().toISOString(),
                sessionId: data.sessionId,
                requiresAction: data.requiresAction
            };
            saveMessages([...messages, aiMessageObj]);
        }
    } catch (error) {
        console.error('Failed to load full menu:', error);
        toast.error('Failed to load restaurant menu');
    } finally {
        setLoading(false);
    }
};

const handleSelectRestaurant = async (restaurant, merchant, sessionId) => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            'http://localhost:5000/api/agent/order/select-restaurant',
            {
                sessionId: sessionId,
                restaurantId: restaurant.id,
                restaurantName: restaurant.name
            },
            { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        
        if (response.data.success) {
            const data = response.data.data;
            const aiMessageObj = {
                id: Date.now(),
                role: 'agent',
                content: data.response,
                timestamp: new Date().toISOString(),
                sessionId: data.sessionId,
                requiresAction: data.requiresAction
            };
            saveMessages([...messages, aiMessageObj]);
        }
    } catch (error) {
        console.error('Failed to select restaurant:', error);
        toast.error('Failed to load restaurant menu');
    } finally {
        setLoading(false);
    }
};
// ADD THESE HELPER FUNCTIONS

const handleAddSingleItemToCart = async (item, merchant, sessionId) => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            'http://localhost:5000/api/agent/order/select-items',
            {
                sessionId: sessionId,
                selectedItems: [{
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    imageUrl: item.imageUrl,
                    category: item.category
                }]
            },
            { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        
        if (response.data.success) {
            const data = response.data.data;
            const aiMessageObj = {
                id: Date.now(),
                role: 'agent',
                content: data.response,
                timestamp: new Date().toISOString(),
                sessionId: data.sessionId,
                cart: data.cart,
                total: data.total,
                requiresAction: data.requiresAction
            };
            saveMessages([...messages, aiMessageObj]);
            toast.success(`Added ${item.name} to cart!`);
        }
    } catch (error) {
        console.error('Failed to add item:', error);
        toast.error('Failed to add item to cart');
    } finally {
        setLoading(false);
    }
};

const handleAddMultipleItemsToCart = async (items, merchant, sessionId) => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            'http://localhost:5000/api/agent/order/select-items',
            {
                sessionId: sessionId,
                selectedItems: items.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.suggestedQuantity || 1,
                    imageUrl: item.imageUrl,
                    category: item.category
                }))
            },
            { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        
        if (response.data.success) {
            const data = response.data.data;
            const aiMessageObj = {
                id: Date.now(),
                role: 'agent',
                content: data.response,
                timestamp: new Date().toISOString(),
                sessionId: data.sessionId,
                cart: data.cart,
                total: data.total,
                requiresAction: data.requiresAction
            };
            saveMessages([...messages, aiMessageObj]);
            toast.success(`Added ${items.length} items to cart!`);
        }
    } catch (error) {
        console.error('Failed to add items:', error);
        toast.error('Failed to add items to cart');
    } finally {
        setLoading(false);
    }
};

const handleScheduleOrder = async (cart, total, scheduledTime, sessionId) => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');

        // Get session info to know merchant
        const sessionResponse = await axios.get(
            `http://localhost:5000/api/agent/order/session/${sessionId}`,
            { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        const merchant = sessionResponse.data.data?.merchant;
        const merchantName = sessionResponse.data.data?.merchantInfo?.name || merchant;

        // Show payment method selection modal (returns 'reserve_pay', 'gems', or 'bank')
        const paymentMethod = await showPaymentMethodSelectionModal();
        if (!paymentMethod) {
            toast.info('Schedule cancelled');
            setLoading(false);
            return;
        }

        let bankAccountId = null;
        if (paymentMethod === 'bank') {
            const bankAccount = await selectBankAccount();
            if (!bankAccount) {
                toast.info('Schedule cancelled');
                setLoading(false);
                return;
            }
            bankAccountId = bankAccount.id;
        }

        // Schedule the order via backend
        const response = await axios.post(
            'http://localhost:5000/api/agent/order/schedule-order',
            {
                sessionId,
                cart,
                total,
                merchant,
                merchantName,
                scheduledTime,
                paymentMethod,
                bankAccountId
            },
            { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );

        if (response.data.success) {
            const scheduledDate = new Date(scheduledTime);
            const formattedDate = scheduledDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            const formattedTime = scheduledDate.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const paymentMethodDisplay = paymentMethod === 'reserve_pay' ? 'SabAI Pay Lite' :
                                         paymentMethod === 'gems' ? 'SabAI Gems' : 'Bank Account';

            const aiMessageObj = {
                id: Date.now(),
                role: 'agent',
                content: `📅 **Order Scheduled!**\n\nYour order has been scheduled for **${formattedDate} at ${formattedTime}**.\n\n**Order ID:** ${response.data.data.scheduleId}\n**Items:** ${cart.length} item(s)\n**Total:** ₹${total}\n**Payment Method:** ${paymentMethodDisplay}\n\n💡 The amount will be automatically deducted at the scheduled time. You can view and manage this scheduled order in the **Reserve Pay → Auto Pay** section.`,
                timestamp: new Date().toISOString()
            };
            saveMessages([...messages, aiMessageObj]);
            toast.success('Order scheduled successfully!');

            // Clear cart
            setCart([]);
            setCartTotal(0);
            setSessionId(null);
            setPendingAction(null);
        }
    } catch (error) {
        console.error('Failed to schedule order:', error);
        toast.error(error.response?.data?.error || 'Failed to schedule order');
    } finally {
        setLoading(false);
    }
};

// Helper function to show payment method selection
const showPaymentMethodSelectionModal = () => {
    return new Promise((resolve) => {
        // Create a modal for payment method selection
        const modal = document.createElement('div');
        modal.className = 'payment-method-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Select Auto-Pay Method</h3>
                <p>Choose how you want to pay for this scheduled order</p>
                <div class="payment-options">
                    <button class="payment-option" data-method="reserve_pay">
                        <div class="payment-icon">💰</div>
                        <div>SabAI Pay Lite (Reserve Pay)</div>
                        <small>Auto-deduct from your monthly limit</small>
                    </button>
                    <button class="payment-option" data-method="gems">
                        <div class="payment-icon">💎</div>
                        <div>SabAI Gems</div>
                        <small>Use your earned gems</small>
                    </button>
                    <button class="payment-option" data-method="bank">
                        <div class="payment-icon">🏦</div>
                        <div>Bank Account</div>
                        <small>Auto-debit from linked bank account</small>
                    </button>
                </div>
                <button class="cancel-btn">Cancel</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const handleSelect = (e) => {
            const method = e.currentTarget.dataset.method;
            modal.remove();
            resolve(method);
        };
        
        const handleCancel = () => {
            modal.remove();
            resolve(null);
        };
        
        modal.querySelectorAll('.payment-option').forEach(btn => {
            btn.addEventListener('click', handleSelect);
        });
        modal.querySelector('.cancel-btn').addEventListener('click', handleCancel);
    });
};

// Helper function to select bank account
const selectBankAccount = async () => {
    const bankAccounts = await getBankAccounts();
    if (bankAccounts.length === 0) {
        toast.error('Please add a bank account in Settings first');
        return null;
    }
    
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'bank-selection-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Select Bank Account</h3>
                <div class="bank-list">
                    ${bankAccounts.map(account => `
                        <button class="bank-option" data-id="${account.id}" data-name="${account.bank_name}" data-last4="${account.account_number?.slice(-4)}">
                            <strong>${account.bank_name}</strong>
                            <span>xxxx${account.account_number?.slice(-4)}</span>
                            <small>Balance: ₹${account.balance || 0}</small>
                        </button>
                    `).join('')}
                </div>
                <button class="cancel-btn">Cancel</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const handleSelect = (e) => {
            const button = e.currentTarget;
            const account = {
                id: button.dataset.id,
                bank_name: button.dataset.name,
                account_number: `xxxx${button.dataset.last4}`
            };
            modal.remove();
            resolve(account);
        };
        
        const handleCancel = () => {
            modal.remove();
            resolve(null);
        };
        
        modal.querySelectorAll('.bank-option').forEach(btn => {
            btn.addEventListener('click', handleSelect);
        });
        modal.querySelector('.cancel-btn').addEventListener('click', handleCancel);
    });
};

const updateCartInSession = async (cart, sessionId) => {
    // This is handled by the backend when items are added/removed
    // Just update local state
    setCart(cart);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartTotal(total);
};

  // ============================================
  // MAIN SEND MESSAGE HANDLER
  // ============================================
const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    const userMessageObj = { id: Date.now(), role: 'user', content: userMessage, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessageObj];
    saveMessages(updatedMessages);
    setLoading(true);
    
    console.log('📤 Sending message:', userMessage);
    console.log('📤 Current sessionId:', sessionId);
    console.log('📤 Current pendingAction:', pendingAction);
    
    try {
        const token = localStorage.getItem('token');
        let userLocationForMerchant = null;
        const detectedMerchant = detectMerchantFromMessage(userMessage);
        
        if (detectedMerchant && ['swiggy', 'zomato', 'zepto', 'blinkit'].includes(detectedMerchant)) {
            userLocationForMerchant = getUserLocationForMerchant(detectedMerchant);
            if (!userLocationForMerchant) {
                const locationErrorMsg = { id: Date.now() + 1, role: 'agent', content: `📍 **Location Required**\n\nTo order from ${detectedMerchant}, please set your delivery address first.\n\n**How to set location:**\n1. Go to **Dashboard → Connect Apps**\n2. Click on ${detectedMerchant} app\n3. Enter your delivery address\n4. Once verified, come back and I'll help you order!`, timestamp: new Date().toISOString() };
                saveMessages([...updatedMessages, locationErrorMsg]);
                setLoading(false);
                return;
            }
        }
        
        let response;
        
        // Handle pending action (like selecting items after showing menu)
        if (pendingAction && sessionId) {
            console.log('📤 Sending to select-items with sessionId:', sessionId);
            response = await axios.post('http://localhost:5000/api/agent/order/select-items', 
                { sessionId: sessionId, selection: userMessage, userLocation: userLocationForMerchant }, 
                { headers: token ? { 'Authorization': `Bearer ${token}` } : {}, timeout: 30000 }
            );
        } 
        // Regular order processing
        else {
            const orderKeywords = ['order', 'buy', 'pizza', 'burger', 'biryani', 'food', 'grocery', 'zepto', 'swiggy', 'zomato', 'amazon', 'flipkart', 'show me', 'list', 'menu', 'items', 'suggest', 'recommend'];
            const isOrder = orderKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
            
            if (isOrder) {
                console.log('📤 Sending to process with sessionId:', sessionId);
                response = await axios.post('http://localhost:5000/api/agent/order/process', 
                    { message: userMessage, sessionId: sessionId, userLocation: userLocationForMerchant }, 
                    { headers: token ? { 'Authorization': `Bearer ${token}` } : {}, timeout: 30000 }
                );
            } else {
                console.log('📤 Sending to chat');
                response = await axios.post('http://localhost:5000/api/agent/chat', 
                    { message: userMessage, userLocation: userLocationForMerchant }, 
                    { headers: token ? { 'Authorization': `Bearer ${token}` } : {}, timeout: 30000 }
                );
            }
        }
        
        if (response && response.data && response.data.success) {
            const data = response.data.data;
            
            // IMPORTANT: Capture sessionId from response
            if (data.sessionId) {
                console.log('📥 Received sessionId:', data.sessionId);
                setSessionId(data.sessionId);
                setPendingAction(data.requiresAction);
            }
            
            // Handle different response types
            if (data.response && typeof data.response === 'object') {
                if (data.response.type === 'order_summary') {
                    data.response.sessionId = data.sessionId;
                    data.response.merchant = data.merchant || data.response.merchant;
                    const aiMessageObj = { id: Date.now() + 1, role: 'agent', content: data.response, timestamp: new Date().toISOString(), sessionId: data.sessionId, cart: data.cart, total: data.total, requiresAction: data.requiresAction, isStructured: true };
                    saveMessages([...updatedMessages, aiMessageObj]);
                } else if (data.response.type === 'item_list') {
                    data.response.sessionId = data.sessionId;
                    const aiMessageObj = { id: Date.now() + 1, role: 'agent', content: data.response, timestamp: new Date().toISOString(), sessionId: data.sessionId, isStructured: true };
                    saveMessages([...updatedMessages, aiMessageObj]);
                } else if (data.response.type === 'auto_pay_setup') {
                    setAutoPaySetup(data.response);
                    setShowAutoPayModal(true);
                } else {
                    const aiMessageObj = { id: Date.now() + 1, role: 'agent', content: JSON.stringify(data.response), timestamp: new Date().toISOString(), sessionId: data.sessionId, isStructured: true };
                    saveMessages([...updatedMessages, aiMessageObj]);
                }
            } if (data.requiresAction === 'confirm_items') {
    // Show the confirmation message with options
    const aiMessageObj = {
        id: Date.now() + 1,
        role: 'agent',
        content: data.response,
        timestamp: new Date().toISOString(),
        sessionId: data.sessionId,
        cart: data.cart,
        total: data.total,
        requiresAction: data.requiresAction,
        notFoundItems: data.notFoundItems,
        foundItems: data.foundItems
    };
    saveMessages([...updatedMessages, aiMessageObj]);
}
            else if (data.requiresAction === 'payment_selection' && data.total) {
    // Get merchant name properly
    let merchantName = data.merchant || data.merchantName;
    
    // If merchant name is still not set, try to get from cart or ML entities
    if (!merchantName || merchantName === 'Merchant') {
        if (data.cart && data.cart.length > 0) {
            merchantName = data.cart[0].merchant || data.cart[0].restaurantName || 'Swiggy';
        }
        // Check if we have ML entities stored in a ref or state
        // Instead of using 'session' which doesn't exist, use a ref or check the message
        const mlMerchant = data.mlMerchant || (data.cart && data.cart[0]?.merchant);
        if ((!merchantName || merchantName === 'Merchant') && mlMerchant) {
            merchantName = mlMerchant;
        }
        // Final fallback
        if (!merchantName || merchantName === 'Merchant') {
            merchantName = 'Swiggy';
        }
    }
    
    console.log('📝 Creating order summary for merchant:', merchantName);
    
    const reserveCheck = await checkReservePayAvailability(merchantName, data.total);
    
    const orderSummary = {
        type: 'order_summary',
        sessionId: data.sessionId,
        merchant: merchantName,
        merchantName: merchantName,
        items: data.cart,
        subtotal: data.total,
        tax: Math.round(data.total * 0.05),
        total: data.total,
        sabaiGems: Math.min(Math.floor(data.total * 0.05), 100),
        reserveCheck: reserveCheck
    };
    
    const aiMessageObj = { 
        id: Date.now() + 1, 
        role: 'agent', 
        content: orderSummary, 
        timestamp: new Date().toISOString(), 
        sessionId: data.sessionId, 
        cart: data.cart, 
        total: data.total, 
        requiresAction: data.requiresAction, 
        isStructured: true 
    };
    saveMessages([...updatedMessages, aiMessageObj]);
}
            else if (typeof data.response === 'string') {
                const aiMessageObj = { id: Date.now() + 1, role: 'agent', content: data.response, timestamp: new Date().toISOString(), sessionId: data.sessionId, cart: data.cart, total: data.total, requiresAction: data.requiresAction, merchant: data.merchant };
                saveMessages([...updatedMessages, aiMessageObj]);
            }
            
            if (data.cart) { 
                setCart(data.cart); 
                setCartTotal(data.total); 
            }
            
            if (data.requiresAction === 'complete') {
                refreshOrders();
                loadReserveLimits();
                
                const autoPayIntent = detectAutoPayIntent(userMessage);
                if (autoPayIntent && data.cart && data.cart.length > 0) {
                    // Get merchant name for auto-pay (reuse the logic)
                    const autoPayMerchant = data.merchant || (data.cart && data.cart[0]?.merchant) || 'Merchant';
                    
                    setPendingAutoPayOrder({
                        sessionId: data.sessionId,
                        total: data.total,
                        merchant: autoPayMerchant,
                        items: data.cart
                    });
                    setShowAutoPaySetupModal(true);
                }
            }
        }
        
        if (messages.length <= 1) saveConversation(userMessage.slice(0, 30));
    } catch (error) {
        console.error('Send message error:', error);
        let errorMessage = "I'm having trouble connecting. ";
        if (error.code === 'ECONNABORTED') errorMessage = "Request timeout. Please try again.";
        else if (error.response?.status === 500) errorMessage = "Server error. Please try again.";
        else if (error.response?.data?.message) errorMessage = error.response.data.message;
        else errorMessage = "Please try again.";
        const errorMessageObj = { id: Date.now() + 1, role: 'agent', content: `❌ ${errorMessage}`, timestamp: new Date().toISOString() };
        saveMessages([...updatedMessages, errorMessageObj]);
    } finally { 
        setLoading(false); 
    }
};

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="agent-chat-page">
      <div className="chat-header">
        <button className="back-button" onClick={() => navigate(-1)}><FaArrowLeft /> Back</button>
        <div className="agent-info">
          <div className="agent-avatar"><img src="/images/sabaiassistant.png" alt="SabAI Assistant" className="assistant-logo-medium" /></div>
          <div><h2>SabAI Assistant</h2><div className="agent-status"><span className={`status-dot ${apiStatus}`}></span>{apiStatus === 'online' ? 'Online' : 'Connecting...'}</div></div>
        </div>
        <div className="header-actions">
          <button className={`icon-btn ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(!sidebarOpen)} title="Chat History"><FaHistory /></button>
          <button className={`icon-btn ${ordersSidebarOpen ? 'active' : ''}`} onClick={() => { setOrdersSidebarOpen(!ordersSidebarOpen); if (!ordersSidebarOpen) refreshOrders(true); }} title="My Orders"><FaBoxOpen /></button>
          <button className="icon-btn" onClick={clearChat} title="New Chat"><FaPlus /></button>
        </div>
      </div>

      {apiStatus === 'offline' && (<div className="api-warning-banner"><FaExclamationTriangle /><span>Backend server offline. Check connection.</span></div>)}

      <div className="chat-main">
        <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header"><h3>Chat History</h3><button className="new-chat-btn" onClick={clearChat}><FaPlus /> New</button></div>
          <div className="conversations-list">
            {conversations.length > 0 ? conversations.map(conv => (
              <div key={conv.id} className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`} onClick={() => loadConversation(conv.id)}>
                <div className="conv-icon"><FaHistory /></div>
                <div className="conv-details"><h4>{conv.title}</h4><p className="conv-preview">{conv.preview || 'Tap to view'}</p><span className="conv-date">{formatDate(conv.lastMessage)}</span></div>
                <button className="conv-delete" onClick={(e) => deleteConversation(conv.id, e)} title="Delete">×</button>
              </div>
            )) : <p className="no-conversations">No previous conversations</p>}
          </div>
        </div>

        <div className="chat-messages-area">
          <div className="messages-container" ref={messagesContainerRef}>
            {messages.map((message) => (
              <motion.div key={message.id} className={`message-wrapper ${message.role}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="message-avatar">{message.role === 'agent' ? <img src="/images/sabaiassistant.png" alt="SabAI Assistant" className="assistant-logo-medium" /> : <img src={user.profile_pic} alt="Profile" className="profile-image" />}</div>
                <div className="message-content">
                  <div className={`message-bubble ${message.role}`}>
                    {renderMessageContent(message)}
                    <div className="message-footer"><span className="message-time">{formatTime(message.timestamp)}</span>{typeof message.content === 'string' && (<button className="message-copy-btn" onClick={() => copyToClipboard(message.content, message.id)}>{copiedId === message.id ? <FaCheck /> : <FaCopy />}</button>)}</div>
                  </div>
                </div>
              </motion.div>
            ))}
            {loading && (<motion.div className="message-wrapper agent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><div className="message-avatar"><img src="/images/sabaiassistant.png" alt="SabAI Assistant" className="assistant-logo-medium" /></div><div className="message-content"><div className="message-bubble agent typing"><div className="typing-dots"><span></span><span></span><span></span></div></div></div></motion.div>)}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-container">
            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder={pendingAction ? "Type 'yes' to proceed..." : "Ask me anything..."} className="chat-input" disabled={loading} />
            <button className="send-btn" onClick={handleSendMessage} disabled={!input.trim() || loading}><FaPaperPlane /></button>
          </div>
        </div>

        <div className={`orders-sidebar ${ordersSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header"><h3>My Orders ({orders.length})</h3><button className="refresh-btn" onClick={() => refreshOrders(true)} title="Refresh orders"><FaClock /></button></div>
          <div className="orders-list">
            {orders.length > 0 ? orders.map(order => (
              <div key={order.id} className="order-card" onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }}>
                
{order.isScheduled && (
    <p className="order-scheduled-time">📅 {new Date(order.scheduledTime).toLocaleString()}</p>
)}
                <div className="order-header"><h4>{order.merchantName || order.merchant}</h4><span className="order-status" style={{ background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status) }}>{getStatusIcon(order.status)}<span>{order.status?.replace(/_/g, ' ')}</span></span></div>
                <p className="order-item">{order.items?.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ')}{order.items?.length > 2 && '...'}</p>
                <div className="order-footer"><span className="order-amount">₹{order.totalAmount || order.total}</span><span className="order-time">{formatDate(order.createdAt)}</span></div>
              </div>
            )) : <p className="no-orders">No orders yet</p>}
          </div>
        </div>
      </div>

      {/* Custom Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && pendingOrderForPayment && (
          <CustomPaymentModal 
            orderData={pendingOrderForPayment}
            onClose={() => {
              setShowPaymentModal(false);
              setPendingOrderForPayment(null);
            }}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailed={handlePaymentFailure}
          />
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
              transactionData={transactionResult}
              onViewTransaction={handleViewTransaction}
              onNewPayment={handleNewPayment}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Failed Payment Modal */}
      <AnimatePresence>
        {showFailedAnimation && failedTransactionResult && (
          <FailedPaymentModal 
            transactionData={failedTransactionResult}
            onClose={() => {
              setShowFailedAnimation(false);
              setFailedTransactionResult(null);
            }}
            onRetry={handleRetryPayment}
            onClearOrder={handleClearOrder}
          />
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderDetails && selectedOrder && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOrderDetails(false)}>
            <motion.div className="order-details-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h2>Order Details</h2><button className="modal-close" onClick={() => setShowOrderDetails(false)}>×</button></div>
              <div className="order-details-content"><p><strong>Order ID:</strong> {selectedOrder.id}</p><p><strong>Merchant:</strong> {selectedOrder.merchantName || selectedOrder.merchant}</p><p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p><p><strong>Status:</strong> {selectedOrder.status?.replace(/_/g, ' ')}</p><p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p><p><strong>Coins Earned:</strong> {selectedOrder.sabaiGems} 🪙</p><h4>Items:</h4><div className="order-items-list">{selectedOrder.items?.map((item, i) => (<div key={i} className="order-item-row"><span>{item.quantity}x {item.name}</span><span>₹{item.total || (item.price * item.quantity)}</span></div>))}</div><h4>Real-Time Tracking:</h4><div className="tracking-steps-vertical">{selectedOrder.tracking?.map((step, i) => (<div key={i} className={`tracking-step-vertical ${step.completed ? 'completed' : ''}`}><div className="step-icon">{step.completed ? '✅' : '⏳'}</div><div className="step-info"><div className="step-label">{step.label}</div>{step.time && <div className="step-time">{step.time}</div>}{step.estimatedTime && !step.completed && <div className="step-estimate">Est. {step.estimatedTime}</div>}</div></div>))}</div></div>
              <div className="modal-actions"><button className="btn-primary" onClick={() => setShowOrderDetails(false)}>Close</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-Pay Setup Modal */}
      <AnimatePresence>
        {showAutoPaySetupModal && pendingAutoPayOrder && (
          <AutoPaySetupModal 
            orderData={pendingAutoPayOrder}
            onConfirm={(confirmationData) => {
              const aiMessageObj = {
                id: Date.now(),
                role: 'agent',
                content: confirmationData,
                timestamp: new Date().toISOString(),
                isStructured: true
              };
              saveMessages([...messages, aiMessageObj]);
              setShowAutoPaySetupModal(false);
              setPendingAutoPayOrder(null);
            }}
            onCancel={() => {
              setShowAutoPaySetupModal(false);
              setPendingAutoPayOrder(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentChatPage;