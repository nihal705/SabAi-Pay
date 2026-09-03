// frontend/src/components/chat/SendMoneyChatCard.jsx
// Send Money Chat Card - Inline card for chat

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaRupeeSign, FaCheckCircle, FaTimes, FaUniversity, FaWallet } from 'react-icons/fa';
import { getBankLogoUrl } from '../../services/storageService';
import './PaymentChatCards.css';

const SendMoneyChatCard = ({ data, onAction, onClose }) => {
    const [loading, setLoading] = useState(false);
    
    const { recipient, amount, note, security, bankAccount } = data.paymentData || {};
    const recipientName = recipient?.displayName || recipient?.name || recipient?.vpa || 'Recipient';
    const recipientVpa = recipient?.vpa || recipient?.phone || '';
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
            className="payment-chat-card send-money-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="payment-card-header">
                <div className="payment-card-icon">
                    <FaRupeeSign />
                </div>
                <span className="payment-card-title">Send Money</span>
                <button className="payment-card-close" onClick={handleCancel}>
                    <FaTimes />
                </button>
            </div>

            <div className="payment-card-body">
                {/* Recipient */}
                <div className="payment-recipient">
                    <div className="recipient-avatar" style={{ background: getAvatarColor(recipientName) }}>
                        {recipientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="recipient-info">
                        <span className="recipient-name">{recipientName}</span>
                        {recipientVpa && <span className="recipient-vpa">{recipientVpa}</span>}
                    </div>
                </div>

                {/* Amount */}
                <div className="payment-amount-display">
                    <span className="amount-currency">₹</span>
                    <span className="amount-value">{parseFloat(amount || 0).toLocaleString()}</span>
                </div>

                {note && (
                    <div className="payment-note">
                        <span>📝 {note}</span>
                    </div>
                )}

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
                        <span>PIN required for this transaction</span>
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

const getAvatarColor = (name) => {
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash |= 0;
    }
    return colors[Math.abs(hash) % colors.length];
};

export default SendMoneyChatCard;