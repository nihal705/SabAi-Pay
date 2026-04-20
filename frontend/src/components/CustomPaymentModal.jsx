// frontend/src/components/CustomPaymentModal.jsx
// COMPLETE FIXED VERSION - All functions defined

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * For licensing inquiries: support@sabai-pay.com
 */

import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaInfoCircle, FaUniversity, FaSpinner, FaEye, FaEyeSlash, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import { getBankAccounts, getBankBalances, getCoinBalance, getReserveLimits, setReserveLimits, updateBankBalance, updateCoinBalance, addTransaction, verifyBankPin, hasUpiPin } from '../services/storageService';
import toast from 'react-hot-toast';
import './CustomPaymentModal.css';

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

const calculateCashback = (amount, gemsUsed = false, reserveUsed = false) => {
  if (gemsUsed || reserveUsed) return 0;
  const cashback = Math.floor(amount * 0.05);
  return Math.min(cashback, 100);
};

const CustomPaymentModal = ({ orderData, mode = 'pay', onClose, onPaymentSuccess, onPaymentFailed, onScheduleSuccess }) => {
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [bankBalances, setBankBalances] = useState({});
  const [sabaiGems, setSabaiGems] = useState(0);
  const [universalReserveLimit, setUniversalReserveLimit] = useState(null);
  const [merchantReserveLimit, setMerchantReserveLimit] = useState(null);
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
    remainingAfterGems: orderData.total,
    reserveType: 'universal'
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  useEffect(() => {
    loadBankAccounts();
    loadBankBalances();
    loadSabaiGems();
    loadReserveLimits();
  }, []);

  const loadBankAccounts = async () => {
    try {
      const accounts = await getBankAccounts();
      setLinkedBanks(accounts);
    } catch (error) { console.error(error); }
  };

  const loadBankBalances = async () => {
    try {
      const balances = await getBankBalances();
      setBankBalances(balances);
    } catch (error) { console.error(error); }
  };

  const loadSabaiGems = async () => {
    try {
      const gems = await getCoinBalance();
      setSabaiGems(gems);
    } catch (error) { console.error(error); }
  };

  const loadReserveLimits = async () => {
    try {
      const limits = await getReserveLimits();
      const universal = limits.find(l => l.merchant === 'sabai-pay-lite');
      const merchantLimit = limits.find(l => l.merchant === orderData.merchant);
      setUniversalReserveLimit(universal);
      setMerchantReserveLimit(merchantLimit);
    } catch (error) { console.error(error); }
  };

  const getAvailableUniversalLimit = () => {
    if (!universalReserveLimit) return 0;
    return universalReserveLimit.monthly_limit - (universalReserveLimit.current_spent || 0);
  };

  const getAvailableMerchantLimit = () => {
    if (!merchantReserveLimit) return 0;
    return merchantReserveLimit.monthly_limit - (merchantReserveLimit.current_spent || 0);
  };

  const isReservePayAvailable = () => {
    const availableUniversal = getAvailableUniversalLimit();
    const availableMerchant = getAvailableMerchantLimit();
    return availableUniversal >= orderData.total || availableMerchant >= orderData.total;
  };

  const handleGemsAmountChange = (gemsToUse) => {
    const orderAmount = orderData.total;
    const maxGemsToUse = Math.min(sabaiGems, orderAmount);
    const validGems = Math.min(gemsToUse, maxGemsToUse);
    const remainingAfterGems = orderAmount - validGems;
    setPaymentBreakdown(prev => ({
      ...prev,
      gemsAmount: validGems,
      bankAmount: remainingAfterGems,
      remainingAfterGems: remainingAfterGems
    }));
  };

  const handleUPIPayment = () => {
    // This will be handled by the main payment flow
    setSelectedPaymentType('bank');
    setPayStep(2);
  };

  const handleReservePayPayment = () => {
    setSelectedPaymentType('reserve_pay');
    setShowConfirmModal(true);
  };

  const handleSchedulePayment = () => {
    setShowScheduleModal(true);
  };

  const confirmSchedulePayment = async () => {
    if (!scheduleDate || !scheduleTime) {
      toast.error('Please select both date and time');
      return;
    }
    
    const scheduledDateTimeObj = new Date(`${scheduleDate}T${scheduleTime}`);
    if (scheduledDateTimeObj <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }
    
    setPayLoading(true);
    try {
      let paymentMethod = '';
      let bankAccountId = null;
      
      if (selectedPaymentType === 'reserve_pay') {
        paymentMethod = 'reserve_pay';
      } else if (selectedPaymentType === 'gems_only') {
        paymentMethod = 'gems';
      } else if (selectedPaymentType === 'bank' && selectedPaymentMethod) {
        paymentMethod = 'bank';
        bankAccountId = selectedPaymentMethod.id;
      } else if (selectedPaymentType === 'gems_and_bank' && selectedPaymentMethod) {
        paymentMethod = 'gems_and_bank';
        bankAccountId = selectedPaymentMethod.id;
      } else {
        paymentMethod = 'bank';
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/agent/order/schedule-order',
        {
          sessionId: orderData.sessionId,
          cart: orderData.items,
          total: orderData.total,
          merchant: orderData.merchant,
          merchantName: orderData.merchantName,
          scheduledTime: scheduledDateTimeObj.toISOString(),
          paymentMethod,
          bankAccountId,
          paymentBreakdown: {
            gemsAmount: paymentBreakdown.gemsAmount,
            reserveAmount: paymentBreakdown.reserveAmount,
            bankAmount: paymentBreakdown.bankAmount,
            reserveType: paymentBreakdown.reserveType
          }
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      
      if (response.data.success) {
        toast.success('Order scheduled successfully!');
        setShowScheduleModal(false);
        setScheduleDate('');
        setScheduleTime('');
        onScheduleSuccess?.({ scheduledTime: scheduledDateTimeObj.toISOString() });
        onClose();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error(error.message || 'Failed to schedule order');
    } finally {
      setPayLoading(false);
    }
  };

  const getPaymentMethodDisplay = () => {
    if (selectedPaymentType === 'reserve_pay') return 'SabAI Pay Lite';
    if (selectedPaymentType === 'merchant_reserve_pay') return `Reserve Pay (${orderData.merchant})`;
    if (selectedPaymentType === 'gems_only') return `${paymentBreakdown.gemsAmount} Gems`;
    if (selectedPaymentType === 'bank') return `₹${paymentBreakdown.bankAmount} (${selectedPaymentMethod?.bank_name})`;
    if (selectedPaymentType === 'gems_and_bank') return `${paymentBreakdown.gemsAmount} Gems + ₹${paymentBreakdown.bankAmount} (${selectedPaymentMethod?.bank_name})`;
    if (selectedPaymentType === 'gems_and_lite') return `${paymentBreakdown.gemsAmount} Gems + ₹${paymentBreakdown.reserveAmount} SabAI Pay Lite`;
    return 'Bank Transfer';
  };

  const getPaymentMethodType = () => {
    if (selectedPaymentType === 'bank') return 'bank';
    if (selectedPaymentType === 'gems_only') return 'gems';
    if (selectedPaymentType === 'reserve_pay') return 'reserve_pay';
    if (selectedPaymentType === 'gems_and_lite') return 'gems_and_lite';
    if (selectedPaymentType === 'gems_and_bank') return 'gems_and_bank';
    return 'unknown';
  };

  const processPayment = async () => {
    const orderAmount = orderData.total;
    const { gemsAmount, bankAmount, reserveAmount } = paymentBreakdown;
    const cashbackEarned = calculateCashback(orderAmount, gemsAmount > 0, reserveAmount > 0);
    
    setPayLoading(true);
    
    try {
      let paymentFailed = false;
      let failureReason = '';
      
      // Check bank balance
      if (bankAmount > 0 && selectedPaymentMethod) {
        const currentBalance = bankBalances[selectedPaymentMethod.id] || 0;
        if (bankAmount > currentBalance) {
          paymentFailed = true;
          failureReason = `Insufficient balance in ${selectedPaymentMethod.bank_name}. Available: ₹${currentBalance}`;
        }
      }
      
      // Check reserve limit
      if (reserveAmount > 0 && !paymentFailed) {
        const available = paymentBreakdown.reserveType === 'merchant' ? getAvailableMerchantLimit() : getAvailableUniversalLimit();
        if (reserveAmount > available) {
          paymentFailed = true;
          failureReason = `Insufficient ${paymentBreakdown.reserveType === 'merchant' ? 'merchant reserve' : 'SabAI Pay Lite'} limit. Available: ₹${available}`;
        }
      }
      
      if (paymentFailed) {
        onPaymentFailed({ amount: orderAmount, merchant: orderData.merchant, failure_reason: failureReason });
        setPayLoading(false);
        return;
      }
      
      // Deduct Gems
      if (gemsAmount > 0) {
        await updateCoinBalance(gemsAmount, false);
      }
      
      // Deduct Bank
      if (bankAmount > 0 && selectedPaymentMethod) {
        await updateBankBalance(selectedPaymentMethod.id, bankAmount, false);
      }
      
      // Deduct Reserve Pay
      if (reserveAmount > 0) {
        const limits = await getReserveLimits();
        const updatedLimits = limits.map(limit => {
          if (paymentBreakdown.reserveType === 'merchant' && limit.merchant === orderData.merchant) {
            return { ...limit, current_spent: (limit.current_spent || 0) + reserveAmount };
          }
          if (paymentBreakdown.reserveType !== 'merchant' && limit.merchant === 'sabai-pay-lite') {
            return { ...limit, current_spent: (limit.current_spent || 0) + reserveAmount };
          }
          return limit;
        });
        await setReserveLimits(updatedLimits);
      }
      
      // Add cashback
      if (cashbackEarned > 0) {
        await updateCoinBalance(cashbackEarned, true);
      }
      
      // Create transaction
      const transaction = {
        transactionId: `TXN${Date.now()}`,
        type: 'merchant_order',
        amount: orderAmount,
        description: `Payment to ${orderData.merchant}`,
        merchant: orderData.merchant,
        items: JSON.stringify(orderData.items),
        payment_method: getPaymentMethodType(),
        payment_method_display: getPaymentMethodDisplay(),
        payment_breakdown: JSON.stringify({ gemsAmount, bankAmount, reserveAmount, reserveType: paymentBreakdown.reserveType }),
        status: 'success',
        cashback: cashbackEarned,
        gems_used: gemsAmount,
        reserve_used: reserveAmount,
        bank_used: bankAmount
      };
      await addTransaction(transaction);
      
      onPaymentSuccess({
        ...transaction,
        amount: orderAmount,
        merchant: orderData.merchant,
        cashback: cashbackEarned
      });
      
      setPayLoading(false);
      setSelectedPaymentType(null);
      setSelectedPaymentMethod(null);
      setPayStep(1);
      setPayPinDigits(['', '', '', '']);
      setPayPinFilled([false, false, false, false]);
      
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentFailed({ amount: orderAmount, merchant: orderData.merchant, failure_reason: error.message });
      setPayLoading(false);
    }
  };

  const handlePaymentMethodSelect = async (type, method = null) => {
    const orderAmount = orderData.total;
    const remainingAfterGems = paymentBreakdown.remainingAfterGems;
    const availableUniversal = getAvailableUniversalLimit();
    const availableMerchant = getAvailableMerchantLimit();

    setSelectedPaymentType(type);
    setSelectedPaymentMethod(method);

    if (type === 'gems_only') {
      if (sabaiGems >= orderAmount) {
        setPaymentBreakdown(prev => ({ ...prev, gemsAmount: orderAmount, bankAmount: 0, reserveAmount: 0 }));
        setShowConfirmModal(true);
      } else toast.error(`Insufficient Gems. You have ${sabaiGems} 🪙`);
    } else if (type === 'reserve_pay') {
      if (availableUniversal >= orderAmount || availableMerchant >= orderAmount) {
        const useMerchant = availableMerchant >= orderAmount;
        setPaymentBreakdown(prev => ({ 
          ...prev, 
          gemsAmount: 0, 
          reserveAmount: orderAmount, 
          bankAmount: 0, 
          reserveType: useMerchant ? 'merchant' : 'universal' 
        }));
        setShowConfirmModal(true);
      } else toast.error(`Insufficient Reserve Pay limit. Available: ₹${Math.max(availableUniversal, availableMerchant)}`);
    } else if (type === 'bank') {
      if (!method) return toast.error('Select a bank account');
      const hasPin = await hasUpiPin(method.id);
      if (!hasPin) return toast.error(`Set UPI PIN for ${method.bank_name} in Settings first`);
      setPayStep(2);
    } else if (type === 'gems_and_bank') {
      if (!method) return toast.error('Select a bank account');
      const hasPin = await hasUpiPin(method.id);
      if (!hasPin) return toast.error(`Set UPI PIN for ${method.bank_name} in Settings first`);
      setPendingPaymentData({ type, method, paymentBreakdown });
      setPayStep(2);
    } else if (type === 'gems_and_lite') {
      const gemsToUse = paymentBreakdown.gemsAmount;
      const remaining = orderAmount - gemsToUse;
      if (gemsToUse > 0 && remaining > 0 && (availableUniversal >= remaining || availableMerchant >= remaining)) {
        const useMerchant = availableMerchant >= remaining;
        setPaymentBreakdown(prev => ({ 
          ...prev, 
          reserveAmount: remaining, 
          bankAmount: 0, 
          reserveType: useMerchant ? 'merchant' : 'universal' 
        }));
        setShowConfirmModal(true);
      } else toast.error('Insufficient Gems or Reserve Pay limit');
    }
  };

  const verifyPinAndPay = async () => {
    const pin = payPinDigits.join('');
    if (pin.length !== 4) return setPayPinError('Enter complete PIN');
    const isValid = await verifyBankPin(selectedPaymentMethod.id, pin);
    if (!isValid) {
      setPayPinError('Incorrect PIN');
      setPayPinDigits(['', '', '', '']);
      return;
    }
    setPayPinError('');
    if (pendingPaymentData) setPaymentBreakdown(pendingPaymentData.paymentBreakdown);
    await processPayment();
  };

  const handlePayPinChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
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

  const getBankLogoComponent = (bank) => {
    const url = getBankLogoUrl(bank.bank_name);
    if (url && !imageErrors[bank.id]) {
      return <img src={url} alt={bank.bank_name} className="bank-logo-img" onError={() => setImageErrors(prev => ({ ...prev, [bank.id]: true }))} />;
    }
    return <FaUniversity className="bank-fallback-icon" />;
  };

  const availableUniversal = getAvailableUniversalLimit();
  const availableMerchant = getAvailableMerchantLimit();
  const remainingAfterGems = paymentBreakdown.remainingAfterGems;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-payment-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'schedule' ? 'Schedule Order' : 'Complete Payment'}</h2>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        
        <div className="modal-body-scroll">
          {/* Order Summary */}
          <div className="order-summary-payment">
            <div className="summary-merchant">
              <strong>Merchant:</strong> {orderData.merchantName || orderData.merchant}
            </div>
            {orderData.items?.map((item, idx) => (
              <div key={idx} className="summary-item">
                <span>{item.quantity}x {item.name}</span>
                <span>₹{item.total || item.price * item.quantity}</span>
              </div>
            ))}
            <div className="summary-total">
              <strong>Total:</strong> <strong>₹{orderData.total.toLocaleString()}</strong>
            </div>
          </div>

          {payStep === 1 && (
            <>
              {/* Gems Section */}
              {sabaiGems > 0 && (
                <div className="gems-input-section">
                  <label className="gems-label">
                    <img src="/images/sabaigems.png" alt="Gems" className="gem-icon" /> Use SabAI Gems (1 🪙 = ₹1)
                  </label>
                  <div className="gems-input-wrapper">
                    <input type="number" className="gems-input" value={paymentBreakdown.gemsAmount} onChange={e => handleGemsAmountChange(parseInt(e.target.value) || 0)} min="0" max={Math.min(sabaiGems, orderData.total)} />
                    <button className="gems-max" onClick={() => handleGemsAmountChange(Math.min(sabaiGems, orderData.total))}>Max</button>
                  </div>
                  <p className="gems-balance">Available: {sabaiGems} 🪙</p>
                  {paymentBreakdown.gemsAmount > 0 && <div className="payment-breakdown-preview">After using {paymentBreakdown.gemsAmount} 🪙: <strong>₹{paymentBreakdown.remainingAfterGems.toLocaleString()}</strong> remaining</div>}
                  {paymentBreakdown.gemsAmount === 0 && <span className="cashback-info">You'll earn +{calculateCashback(orderData.total)} 🪙 cashback</span>}
                  {paymentBreakdown.gemsAmount > 0 && <span className="cashback-info no-cashback">⚠️ No cashback when using Gems</span>}
                </div>
              )}

              {/* Payment Methods */}
              <div className="payment-methods-section">
                <h4>Select Payment Method</h4>

                {/* Pay with UPI - Bank Account */}
                {remainingAfterGems > 0 && linkedBanks.length > 0 && (
                  <div className="bank-options">
                    <h5>Pay with UPI (Bank Account)</h5>
                    {linkedBanks.map(bank => (
                      <button key={bank.id} className={`bank-option ${selectedPaymentMethod?.id === bank.id && selectedPaymentType === 'bank' ? 'selected' : ''}`} onClick={() => handlePaymentMethodSelect('bank', bank)}>
                        {getBankLogoComponent(bank)}
                        <div><strong>{bank.bank_name}</strong><span>xxxx{bank.account_number?.slice(-4)}</span></div>
                        {selectedPaymentMethod?.id === bank.id && selectedPaymentType === 'bank' && <FaCheckCircle className="selected-icon" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Pay with Reserve Pay */}
                {isReservePayAvailable() && (
                  <button className={`payment-method-card ${selectedPaymentType === 'reserve_pay' ? 'selected' : ''}`} onClick={() => handlePaymentMethodSelect('reserve_pay')}>
                    <div className="payment-method-icon reserve">
                      <img src="/images/merchants/sabailogo.png" alt="SabAI" className="payment-method-logo" />
                    </div>
                    <div className="payment-method-info">
                      <strong>SabAI Pay Lite (Reserve Pay)</strong>
                      <span>Pay using your monthly limit</span>
                      <span className="limit-info">Available: ₹{Math.max(availableUniversal, availableMerchant).toLocaleString()}</span>
                    </div>
                    {selectedPaymentType === 'reserve_pay' && <FaCheckCircle className="selected-icon" />}
                  </button>
                )}

                {/* Pay with Gems Only */}
                {sabaiGems >= orderData.total && (
                  <button className={`payment-method-card ${selectedPaymentType === 'gems_only' ? 'selected' : ''}`} onClick={() => handlePaymentMethodSelect('gems_only')}>
                    <div className="payment-method-icon gems">
                      <img src="/images/sabaigems.png" alt="Gems" className="payment-method-logo" />
                    </div>
                    <div className="payment-method-info">
                      <strong>Pay with SabAI Gems Only</strong>
                      <span>Use {orderData.total} 🪙 (No cashback)</span>
                    </div>
                    {selectedPaymentType === 'gems_only' && <FaCheckCircle className="selected-icon" />}
                  </button>
                )}

                {/* Schedule Payment Option */}
                <button className="payment-method-card" onClick={handleSchedulePayment}>
                  <div className="payment-method-icon schedule">
                    <FaCalendarAlt />
                  </div>
                  <div className="payment-method-info">
                    <strong>Schedule Payment</strong>
                    <span>Pay at a later date and time</span>
                  </div>
                </button>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn-primary" onClick={() => {
                  if (!selectedPaymentType) return toast.error('Select a payment method');
                  if (selectedPaymentType === 'bank' && !selectedPaymentMethod) return toast.error('Select a bank account');
                  if (selectedPaymentType === 'bank') {
                    setPayStep(2);
                  } else if (selectedPaymentType === 'gems_and_bank') {
                    if (paymentBreakdown.gemsAmount > 0 && paymentBreakdown.remainingAfterGems > 0 && selectedPaymentMethod) {
                      setPendingPaymentData({ type: selectedPaymentType, method: selectedPaymentMethod, paymentBreakdown: { ...paymentBreakdown, bankAmount: paymentBreakdown.remainingAfterGems } });
                      setPayStep(2);
                    } else toast.error('Enter gems amount and select bank');
                  } else {
                    setShowConfirmModal(true);
                  }
                }} disabled={!selectedPaymentType || (selectedPaymentType === 'bank' && !selectedPaymentMethod)}>
                  {(selectedPaymentType === 'bank' || selectedPaymentType === 'gems_and_bank') ? 'Next →' : (mode === 'schedule' ? 'Schedule Order' : 'Pay Now')}
                </button>
              </div>
            </>
          )}

          {payStep === 2 && selectedPaymentMethod && (
            <>
              <div className="payment-summary">
                <div className="summary-row"><span>Total</span><strong>₹{orderData.total.toLocaleString()}</strong></div>
                {paymentBreakdown.gemsAmount > 0 && <div className="summary-row"><span>Gems Used</span><span>{paymentBreakdown.gemsAmount} 🪙 (₹{paymentBreakdown.gemsAmount})</span></div>}
                <div className="summary-row"><span>From</span><span>{selectedPaymentMethod.bank_name} (xxxx{selectedPaymentMethod.account_number?.slice(-4)})</span></div>
                <div className="summary-row"><span>Bank Payment</span><strong>₹{paymentBreakdown.bankAmount.toLocaleString()}</strong></div>
                {paymentBreakdown.gemsAmount === 0 && paymentBreakdown.reserveAmount === 0 && <div className="summary-row"><span>Cashback (5%)</span><span className="cashback-amount">+{calculateCashback(orderData.total)} 🪙</span></div>}
              </div>

              <div className="pin-section-pay">
                <label>Enter UPI PIN for {selectedPaymentMethod.bank_name}</label>
                <div className="pin-inputs-pay">
                  {payPinDigits.map((digit, index) => (
                    <input key={index} id={`pay-pin-${index}`} type={showPayPin ? 'text' : 'password'} maxLength="1" value={digit} onChange={e => handlePayPinChange(index, e.target.value)} onKeyDown={e => handlePayPinKeyDown(e, index)} className={`pin-input-pay ${payPinFilled[index] ? 'filled' : ''}`} autoFocus={index === 0} />
                  ))}
                </div>
                <label className="show-pin-checkbox-pay"><input type="checkbox" checked={showPayPin} onChange={() => setShowPayPin(!showPayPin)} /> Show PIN</label>
                {payPinError && <p className="pin-error-pay">{payPinError}</p>}
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setPayStep(1)}>Back</button>
                <button className="btn-primary" onClick={verifyPinAndPay} disabled={payLoading}>{payLoading ? <FaSpinner className="spinner" /> : `Pay ₹${paymentBreakdown.bankAmount}`}</button>
              </div>
            </>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="confirm-payment-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>Confirm Payment</h3><button onClick={() => setShowConfirmModal(false)}><FaTimes /></button></div>
              <div className="modal-body">
                <div className="payment-summary">
                  <div className="summary-row"><span>Total</span><strong>₹{orderData.total.toLocaleString()}</strong></div>
                  {paymentBreakdown.gemsAmount > 0 && <div className="summary-row"><span>Gems Used</span><span>{paymentBreakdown.gemsAmount} 🪙 (₹{paymentBreakdown.gemsAmount})</span></div>}
                  {paymentBreakdown.reserveAmount > 0 && <div className="summary-row"><span>{paymentBreakdown.reserveType === 'merchant' ? `Reserve Pay (${orderData.merchant})` : 'SabAI Pay Lite'}</span><span>₹{paymentBreakdown.reserveAmount.toLocaleString()}</span></div>}
                  {paymentBreakdown.bankAmount > 0 && <div className="summary-row"><span>Bank Payment</span><span>₹{paymentBreakdown.bankAmount.toLocaleString()}</span></div>}
                  <div className="summary-row"><span>Merchant</span><span>{orderData.merchantName || orderData.merchant}</span></div>
                  {selectedPaymentType === 'reserve_pay' && paymentBreakdown.gemsAmount === 0 && <div className="summary-row"><span>Cashback</span><span className="cashback-amount">+{calculateCashback(orderData.total)} 🪙</span></div>}
                </div>
                <div className="confirm-payment-note">
                  <FaInfoCircle />
                  <p>{selectedPaymentType === 'gems_only' ? `Pay ₹${orderData.total} using ${orderData.total} Gems. No cashback.` :
                     selectedPaymentType === 'gems_and_lite' ? `Pay ${paymentBreakdown.gemsAmount} Gems + ₹${paymentBreakdown.reserveAmount} via Reserve Pay. No cashback.` :
                     selectedPaymentType === 'reserve_pay' ? `Pay ₹${orderData.total} via Reserve Pay. You earn ${calculateCashback(orderData.total)} 🪙 cashback!` :
                     `Pay ₹${orderData.total} via ${selectedPaymentType}.`}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={async () => { setShowConfirmModal(false); await processPayment(); }} disabled={payLoading}>
                  {payLoading ? <FaSpinner className="spinner" /> : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
            <div className="schedule-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Schedule Payment</h3>
                <button onClick={() => setShowScheduleModal(false)}><FaTimes /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Date</label>
                  <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group">
                  <label>Select Time</label>
                  <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                </div>
                <div className="order-preview">
                  <p><strong>Total Amount:</strong> ₹{orderData.total.toLocaleString()}</p>
                  <p><strong>Items:</strong> {orderData.items?.length} item(s)</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={confirmSchedulePayment} disabled={payLoading}>
                  {payLoading ? <FaSpinner className="spinner" /> : 'Schedule Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomPaymentModal;