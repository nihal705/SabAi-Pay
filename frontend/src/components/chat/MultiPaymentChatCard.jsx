// frontend/src/components/chat/MultiPaymentChatCard.jsx
// Multi Payment Chat Card - Stacked list of multiple payments

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    FaRupeeSign, FaCheckCircle, FaTimes, FaUniversity, 
    FaUser, FaBolt, FaMobile, FaClock 
} from 'react-icons/fa';
import { getBankLogoUrl } from '../../services/storageService';
import './PaymentChatCards.css';

const MultiPaymentChatCard = ({ data, onAction, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    
    const { payments, security, bankAccount } = data;
    const bankLogo = getBankLogoUrl(bankAccount?.bank_name);
    const requiresPin = security?.requiresPin || false;
    const method = security?.method || 'bank';
    const isReservePay = method === 'reserve_pay';

    const totalAmount = payments?.reduce((sum, p) => sum + (p.paymentData?.amount || 0), 0) || 0;
    const paymentCount = payments?.length || 0;

    const getPaymentIcon = (type) => {
        switch(type) {
            case 'send_money': return <FaUser />;
            case 'pay_bill': return <FaBolt />;
            case 'recharge_mobile': return <FaMobile />;
            default: return <FaRupeeSign />;
        }
    };

    const getPaymentLabel = (type) => {
        switch(type) {
            case 'send_money': return 'Send Money';
            case 'pay_bill': return 'Bill Payment';
            case 'recharge_mobile': return 'Mobile Recharge';
            default: return 'Payment';
        }
    };

    const getPaymentStatus = (p) => {
        if (p.status === 'ready') return 'ready';
        if (p.status === 'completed') return 'completed';
        if (p.status === 'failed') return 'failed';
        return 'pending';
    };

    const handleConfirmAll = async () => {
        setConfirming(true);
        setLoading(true);
        try {
            const allPaymentData = payments.map(p => ({
                type: p.type,
                paymentData: p.paymentData
            }));
            await onAction('confirm_payment', { 
                paymentData: allPaymentData, 
                requiresPin: requiresPin,
                isMultiPayment: true
            });
        } catch (error) {
            console.error('Multi-payment confirm error:', error);
        } finally {
            setLoading(false);
            setConfirming(false);
        }
    };

    const handleCancel = () => {
        onAction('cancel', null);
        onClose?.();
    };

    return (
        <motion.div 
            className="payment-chat-card multi-payment-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="payment-card-header">
                <div className="payment-card-icon multi">
                    <FaClock />
                </div>
                <span className="payment-card-title">Multi-Payment ({paymentCount})</span>
                <button className="payment-card-close" onClick={handleCancel}>
                    <FaTimes />
                </button>
            </div>

            <div className="payment-card-body">
                {/* Payment List */}
                <div className="multi-payment-list">
                    {payments?.map((payment, index) => {
                        const status = getPaymentStatus(payment);
                        const amount = payment.paymentData?.amount || 0;
                        const label = getPaymentLabel(payment.type);
                        const icon = getPaymentIcon(payment.type);
                        const recipient = payment.paymentData?.recipient?.displayName || 
                                        payment.paymentData?.recipient?.name || 
                                        payment.paymentData?.provider || 
                                        payment.paymentData?.mobileNumber || 
                                        '';

                        return (
                            <div key={index} className="multi-payment-item">
                                <div className="item-index">{index + 1}</div>
                                <div className="item-icon">{icon}</div>
                                <div className="item-details">
                                    <span className="item-label">{label}</span>
                                    {recipient && <span className="item-recipient">{recipient}</span>}
                                </div>
                                <div className="item-amount">₹{parseFloat(amount || 0).toLocaleString()}</div>
                                <div className={`item-status ${status}`}>
                                    {status === 'ready' && <span>Ready</span>}
                                    {status === 'completed' && <FaCheckCircle />}
                                    {status === 'failed' && <span>❌</span>}
                                    {status === 'pending' && <span>⏳</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Total */}
                <div className="multi-payment-total">
                    <span>Total Amount</span>
                    <span className="total-value">₹{parseFloat(totalAmount).toLocaleString()}</span>
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
                        <span>PIN required for these payments</span>
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
                        Cancel All
                    </button>
                    <button 
                        className={`btn-confirm ${isReservePay ? 'reserve-pay' : 'bank-pay'} multi`}
                        onClick={handleConfirmAll}
                        disabled={loading || confirming}
                    >
                        {loading ? (
                            <span className="spinner-small"></span>
                        ) : (
                            <>
                                Confirm All ({paymentCount})
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default MultiPaymentChatCard;