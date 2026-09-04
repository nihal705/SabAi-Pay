// frontend/src/components/RestaurantPaymentModal.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheckCircle, FaInfoCircle, FaUniversity, FaSpinner, FaEye, FaEyeSlash, FaCreditCard, FaGem } from 'react-icons/fa';
import { 
    getBankAccounts, 
    getBankBalances, 
    getCoinBalance, 
    getReserveLimits, 
    setReserveLimits, 
    updateBankBalance, 
    updateCoinBalance, 
    addTransaction, 
    verifyBankPin, 
    hasUpiPin 
} from '../services/storageService';
import toast from 'react-hot-toast';
import { agentOrderAPI } from '../services/apiService';

// Helper function to calculate cashback
const calculateCashback = (amount) => {
    const cashback = Math.floor(amount * 0.05);
    return Math.min(cashback, 100);
};

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

const RestaurantPaymentModal = ({ orderData, onClose, onPaymentSuccess, onPaymentFailed }) => {
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
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingPaymentData, setPendingPaymentData] = useState(null);
    const [imageErrors, setImageErrors] = useState({});
    const [paymentBreakdown, setPaymentBreakdown] = useState({
        gemsAmount: 0,
        reserveAmount: orderData.total,
        bankAmount: 0,
        totalAmount: orderData.total,
        orderAmount: orderData.total,
        remainingAfterGems: orderData.total
    });

    // Load data on mount
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
            const universalLimit = limits.find(l => l.merchant === orderData.merchant);
            setUniversalReserveLimit(universalLimit);
        } catch (error) {
            console.error('Failed to load reserve limits:', error);
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

    const getPaymentMethodDisplay = () => {
        if (selectedPaymentType === 'bank') {
            return `₹${paymentBreakdown.bankAmount} (${selectedPaymentMethod?.bank_name || 'Bank'})`;
        } else if (selectedPaymentType === 'gems_only') {
            return `${paymentBreakdown.gemsAmount} GEMS Only`;
        } else if (selectedPaymentType === 'reserve_pay') {
            return `₹${paymentBreakdown.reserveAmount} SabAI Pay Lite`;
        } else if (selectedPaymentType === 'gems_and_lite') {
            return `${paymentBreakdown.gemsAmount} GEMS + ₹${paymentBreakdown.reserveAmount} SabAI Pay Lite`;
        } else if (selectedPaymentType === 'gems_and_bank') {
            return `${paymentBreakdown.gemsAmount} GEMS + ₹${paymentBreakdown.bankAmount} Bank`;
        }
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
    // Use the actual breakdown values from state
    const { gemsAmount, bankAmount, reserveAmount } = paymentBreakdown;
    const cashbackEarned = (gemsAmount === 0 && reserveAmount === 0) ? calculateCashback(orderAmount) : 0;
    
    console.log('Processing payment with breakdown:', { gemsAmount, bankAmount, reserveAmount, orderAmount });
    
    setPayLoading(true);
    
    try {
        let paymentFailed = false;
        let failureReason = '';
        
        // Check reserve limit first (if using reserve pay)
        if (reserveAmount > 0 && universalReserveLimit) {
            const availableLimit = getAvailableReserveLimit();
            console.log('Reserve limit check:', { availableLimit, reserveAmount });
            if (reserveAmount > availableLimit) {
                paymentFailed = true;
                failureReason = `Insufficient SabAI Pay Lite limit. Available: ₹${availableLimit.toLocaleString()}`;
            }
        }
        
        // Check bank balance
        if (bankAmount > 0 && selectedPaymentMethod && !paymentFailed) {
            const currentBalance = bankBalances[selectedPaymentMethod.id] || 0;
            if (bankAmount > currentBalance) {
                paymentFailed = true;
                failureReason = `Insufficient balance in ${selectedPaymentMethod.bank_name}. Available: ₹${currentBalance.toLocaleString()}`;
            }
        }
        
        // Check reserve limit
        if (reserveAmount > 0 && universalReserveLimit && !paymentFailed) {
            const availableLimit = getAvailableReserveLimit();
            if (reserveAmount > availableLimit) {
                paymentFailed = true;
                failureReason = `Insufficient SabAI Pay Lite limit. Available: ₹${availableLimit.toLocaleString()}`;
            }
        }
        
        if (paymentFailed) {
            const transactionId = `TXN_FAILED_${Date.now()}`;
            const failedTransaction = {
                transactionId: transactionId,
                type: 'order_payment',
                amount: orderAmount,
                description: `Order payment to ${orderData.merchantName || orderData.merchant} - FAILED`,
                status: 'failed',
                failure_reason: failureReason,
                payment_method_display: getPaymentMethodDisplay(),
                payment_breakdown: { gemsAmount, bankAmount, reserveAmount },
                merchant: orderData.merchant,
                merchant_name: orderData.merchantName
            };
            
            await addTransaction(failedTransaction);
            
            onPaymentFailed({
                ...failedTransaction,
                amount: orderAmount,
                merchant: orderData.merchantName || orderData.merchant,
                failure_reason: failureReason,
                payment_method_display: getPaymentMethodDisplay()
            });
            setPayLoading(false);
            return;
        }
        
        // Process gems deduction
        if (gemsAmount > 0) {
            await updateCoinBalance(gemsAmount, false);
        }
        
        // Process reserve pay deduction
        if (reserveAmount > 0 && universalReserveLimit) {
            console.log(`Deducting ₹${reserveAmount} from Reserve Pay limit`);
            const limits = await getReserveLimits();
            const updatedLimits = limits.map(limit => {
                if (limit.merchant === orderData.merchant || limit.id === universalReserveLimit.id) {
                    const newSpent = (limit.current_spent || 0) + reserveAmount;
                    console.log(`Updating ${limit.merchant}: current_spent from ${limit.current_spent} to ${newSpent}`);
                    return {
                        ...limit,
                        current_spent: newSpent,
                        updated_at: new Date().toISOString()
                    };
                }
                return limit;
            });
            await setReserveLimits(updatedLimits);
            
            // Also update the local state
            if (universalReserveLimit) {
                universalReserveLimit.current_spent = (universalReserveLimit.current_spent || 0) + reserveAmount;
            }
        }
        
        // Process gems deduction
        if (gemsAmount > 0) {
            await updateCoinBalance(gemsAmount, false);
        }
        
        // Process bank deduction
        if (bankAmount > 0 && selectedPaymentMethod) {
            await updateBankBalance(selectedPaymentMethod.id, bankAmount, false);
        }
        
        // Add cashback
        if (cashbackEarned > 0) {
            await updateCoinBalance(cashbackEarned, true);
        }
        
        // Generate order ID
        const orderId = `ORD${Date.now()}`;
        const transactionId = `TXN${Date.now()}`;
        
        // Save transaction
        const transaction = await addTransaction({
            transactionId: transactionId,
            type: 'merchant_order',
            amount: orderAmount,
            description: `Order payment to ${orderData.merchantName || orderData.merchant}`,
            status: 'success',
            cashback_earned: cashbackEarned,
            gems_used: gemsAmount > 0 ? gemsAmount : 0,
            reserve_used: reserveAmount > 0 ? reserveAmount : 0,
            bank_used: bankAmount > 0 ? bankAmount : 0,
            payment_method_display: getPaymentMethodDisplay(),
            payment_breakdown: { gemsAmount, bankAmount, reserveAmount },
            merchant: orderData.merchant,
            merchant_name: orderData.merchantName,
            items: JSON.stringify(orderData.items)
        });
        
        // Create order object
        const now = new Date();
        const deliveryTime = new Date(now.getTime() + 45 * 60000);
        
        const order = {
            id: orderId,
            merchant: orderData.merchant,
            merchantName: orderData.merchantName || orderData.merchant,
            items: orderData.items,
            totalAmount: orderAmount,
            status: 'confirmed',
            paymentMethod: getPaymentMethodDisplay(),
            paymentMethodType: getPaymentMethodType(),
            transactionId: transactionId,
            sabaiGems: cashbackEarned,
            estimatedDelivery: '45 minutes',
            estimatedDeliveryTime: deliveryTime.toLocaleTimeString(),
            createdAt: now.toISOString(),
            tracking: [
                { status: 'confirmed', label: 'Order Confirmed', completed: true, time: now.toLocaleTimeString() },
                { status: 'preparing', label: 'Preparing', completed: false, estimatedTime: deliveryTime.toLocaleTimeString() },
                { status: 'out_for_delivery', label: 'Out for Delivery', completed: false },
                { status: 'delivered', label: 'Delivered', completed: false }
            ]
        };
        
        await agentOrderAPI.saveOrder(order);
        
        onPaymentSuccess({
            ...transaction,
            orderId: orderId,
            amount: orderAmount,
            merchant: orderData.merchantName || orderData.merchant,
            cashback: cashbackEarned,
            payment_method_display: getPaymentMethodDisplay(),
            items: orderData.items
        });
        
    } catch (error) {
        console.error('Payment error:', error);
        onPaymentFailed({
            amount: orderAmount,
            merchant: orderData.merchantName || orderData.merchant,
            failure_reason: error.message || 'Payment processing failed',
            payment_method_display: getPaymentMethodDisplay()
        });
    } finally {
        setPayLoading(false);
    }
};

    const handlePaymentMethodSelect = (type, method = null) => {
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
        setPaymentBreakdown({
            ...paymentBreakdown,
            gemsAmount: 0,
            reserveAmount: orderAmount,
            bankAmount: 0,
            remainingAfterGems: orderAmount
        });
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
            // Check if bank has UPI PIN
            const hasPin = hasUpiPin(method.id);
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
            const hasPin = hasUpiPin(method.id);
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

    const confirmPayment = () => {
        if (!pendingPaymentData) return;
        const breakdownToUse = { ...pendingPaymentData.paymentBreakdown };
        setPaymentBreakdown(breakdownToUse);
        setShowConfirmModal(false);
        setPendingPaymentData(null);
        processPayment();
    };

    const verifyPinAndPay = () => {
        const pinString = payPinDigits.join('');
        if (pinString.length !== 4) {
            setPayPinError('Please enter complete PIN');
            return;
        }
        
        const isValid = verifyBankPin(selectedPaymentMethod.id, pinString);
        if (!isValid) {
            setPayPinError('Incorrect PIN. Please try again.');
            setPayPinDigits(['', '', '', '']);
            setPayPinFilled([false, false, false, false]);
            return;
        }
        
        setPayPinError('');
        
        if (pendingPaymentData && pendingPaymentData.type === 'gems_and_bank') {
            setPaymentBreakdown(pendingPaymentData.paymentBreakdown);
        }
        processPayment();
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
    const remainingAfterGems = paymentBreakdown.remainingAfterGems;
    const banksWithPin = linkedBanks.filter(bank => {
        try {
            return hasUpiPin(bank.id);
        } catch {
            return false;
        }
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="custom-payment-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Complete Payment</h2>
                    <button className="modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="modal-body-scroll">
                    {/* Order Summary */}
                    <div className="order-summary-payment">
                        <div className="summary-merchant">
                            <strong>Merchant:</strong> {orderData.merchantName || orderData.merchant}
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
                                
                                {/* Pay with Reserve Pay */}
                                {availableReserveLimit >= orderData.total && (
                                    <button
                                        className={`payment-method-card ${selectedPaymentType === 'reserve_pay' ? 'selected' : ''}`}
                                        onClick={() => handlePaymentMethodSelect('reserve_pay')}
                                    >
                                        <div className="payment-method-icon reserve">
                                            <img src="/images/merchants/sabailogo.png" alt="SabAI" className="payment-method-logo" />
                                        </div>
                                        <div className="payment-method-info">
                                            <strong>SabAI Pay Lite (Reserve Pay)</strong>
                                            <span>Use ₹{orderData.total.toLocaleString()} from universal limit</span>
                                            <span className="limit-info">Available: ₹{availableReserveLimit.toLocaleString()}</span>
                                        </div>
                                        {selectedPaymentType === 'reserve_pay' && <FaCheckCircle className="selected-icon" />}
                                    </button>
                                )}
                                
                                {/* Pay with Gems + Reserve Pay */}
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
                                <button className="btn-secondary" onClick={onClose}>
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
                                        
                                        // For gems_only, reserve_pay, gems_and_lite - show confirmation modal
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
                                    <span>{orderData.merchantName || orderData.merchant}</span>
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
                                <button className="btn-secondary" onClick={() => setPayStep(1)}>
                                    Back
                                </button>
                                <button 
                                    className="btn-primary" 
                                    onClick={verifyPinAndPay}
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
                                    <button className="modal-close" onClick={() => setShowConfirmModal(false)}>
                                        <FaTimes />
                                    </button>
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
                                            <span>{orderData.merchantName || orderData.merchant}</span>
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
                                        {pendingPaymentData.type === 'gems_and_bank' && (
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
                                                : pendingPaymentData.type === 'gems_and_bank'
                                                ? `You are about to pay ${pendingPaymentData.paymentBreakdown.gemsAmount} Gems + ₹${pendingPaymentData.paymentBreakdown.bankAmount} via bank. No cashback will be earned.`
                                                : pendingPaymentData.type === 'reserve_pay'
                                                ? `You are about to pay ₹${orderData.total} using SabAI Pay Lite. You will earn ${calculateCashback(orderData.total)} 🪙 cashback!`
                                                : `You are about to pay ₹${orderData.total} via bank transfer. You will earn ${calculateCashback(orderData.total)} 🪙 cashback!`}
                                        </p>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>
                                        Cancel
                                    </button>
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

export default RestaurantPaymentModal;
