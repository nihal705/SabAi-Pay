// frontend/src/components/chat/BillPayChatCard.jsx
// Bill Pay Chat Card - Inline card for chat

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBolt, FaTint, FaMobile, FaWifi, FaFire, FaCreditCard, FaRupeeSign, FaCheckCircle, FaTimes, FaUniversity } from 'react-icons/fa';
import { getBankLogoUrl } from '../../services/storageService';
import './PaymentChatCards.css';

const billIcons = {
    electricity: FaBolt,
    water: FaTint,
    mobile: FaMobile,
    broadband: FaWifi,
    gas: FaFire,
    credit_card: FaCreditCard,
};

const billColors = {
    electricity: '#f59e0b',
    water: '#3b82f6',
    mobile: '#10b981',
    broadband: '#8b5cf6',
    gas: '#ef4444',
    credit_card: '#ec4899',
};

const BillPayChatCard = ({ data, onAction, onClose }) => {
    const [loading, setLoading] = useState(false);
    
    const { biller, customerId, amount, security, bankAccount } = data.paymentData || {};
    const billType = biller?.category || 'electricity';
    const billerName = biller?.name || 'Bill Provider';
    const Icon = billIcons[billType] || FaBolt;
    const billColor = billColors[billType] || '#64748b';
    const bankLogo = getBankLogoUrl(bankAccount?.bank_name);
    const requiresPin = security?.requiresPin || false;
    const method = security?.method || 'bank';
    const isReservePay = method === 'reserve_pay';

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onAction('confirm_payment', { 
                paymentData: data.paymentData, 
                requiresPin: requiresPin 
            });
        } catch (error) {
            console.error('Confirm error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        onAction('cancel', null);
        onClose?.();
    };

    return (
        <motion.div 
            className="payment-chat-card bill-pay-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="payment-card-header">
                <div className="payment-card-icon" style={{ background: billColor }}>
                    <Icon />
                </div>
                <span className="payment-card-title">Pay Bill</span>
                <button className="payment-card-close" onClick={handleCancel}>
                    <FaTimes />
                </button>
            </div>

            <div className="payment-card-body">
                {/* Biller */}
                <div className="bill-provider-info">
                    <div className="provider-icon" style={{ background: billColor + '20' }}>
                        <Icon style={{ color: billColor }} />
                    </div>
                    <div className="provider-details">
                        <span className="provider-name">{billerName}</span>
                        <span className="customer-id">ID: {customerId}</span>
                    </div>
                </div>

                {/* Amount */}
                <div className="payment-amount-display">
                    <span className="amount-currency">₹</span>
                    <span className="amount-value">{parseFloat(amount || 0).toLocaleString()}</span>
                </div>

                {/* Payment Method */}
                <div className="payment-method-info">
                    <div className="method-badge">
                        {isReservePay ? (
                            <>
                                <img 
                                    src="/images/merchants/sabailogo.png" 
                                    alt="SabAI Pay Lite" 
                                    className="method-icon-small"
                                />
                                <span>SabAI Pay Lite</span>
                            </>
                        ) : (
                            <>
                                {bankLogo ? (
                                    <img src={bankLogo} alt={bankAccount?.bank_name} className="method-icon-small" />
                                ) : (
                                    <FaUniversity className="method-icon-small" />
                                )}
                                <span>{bankAccount?.bank_name || 'Bank Account'}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Security Status */}
                {requiresPin ? (
                    <div className="security-status pin-required">
                        <span className="status-icon">🔒</span>
                        <span>PIN required for this bill payment</span>
                    </div>
                ) : (
                    <div className="security-status pin-free">
                        <span className="status-icon">✅</span>
                        <span>No PIN required - SabAI Pay Lite</span>
                        <span className="limit-remaining">
                            Remaining: ₹{(security?.limitRemaining || 0).toLocaleString()}
                        </span>
                    </div>
                )}

                {/* Actions */}
                <div className="payment-card-actions">
                    <button className="btn-cancel" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button 
                        className={`btn-confirm ${isReservePay ? 'reserve-pay' : 'bank-pay'}`}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner-small"></span>
                        ) : (
                            <>
                                {isReservePay ? 'Pay with SabAI Pay Lite' : 'Pay with PIN'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default BillPayChatCard;