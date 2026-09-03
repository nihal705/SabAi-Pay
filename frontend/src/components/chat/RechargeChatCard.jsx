// frontend/src/components/chat/RechargeChatCard.jsx
// COMPLETE FULL WORKING VERSION - Mobile Recharge Chat Card

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaMobile, 
  FaRupeeSign, 
  FaCheckCircle, 
  FaTimes, 
  FaUniversity, 
  FaClock, 
  FaWifi, 
  FaUser,
  FaSpinner
} from 'react-icons/fa';
import './PaymentChatCards.css';

// ============================================
// HELPER: Get bank logo URL
// ============================================
const getBankLogoUrl = (bankName) => {
  const bankLogoMap = {
    'State Bank of India': 'sbi.png',
    'SBI': 'sbi.png',
    'HDFC Bank': 'hdfc.png',
    'HDFC': 'hdfc.png',
    'ICICI Bank': 'icici.png',
    'ICICI': 'icici.png',
    'Axis Bank': 'axis.png',
    'Axis': 'axis.png',
    'Bank of Baroda': 'bob.png',
    'BOB': 'bob.png',
    'Punjab National Bank': 'pnb.png',
    'PNB': 'pnb.png',
    'Canara Bank': 'canara.png',
    'Canara': 'canara.png',
    'Union Bank of India': 'union.png',
    'Union Bank': 'union.png',
    'Kotak Mahindra Bank': 'kotak.png',
    'Kotak': 'kotak.png',
    'IndusInd Bank': 'indusind.png',
    'IndusInd': 'indusind.png',
    'Yes Bank': 'yesbank.png',
    'Yes': 'yesbank.png',
    'IDFC First Bank': 'idfc.png',
    'IDFC': 'idfc.png',
    'Karnataka Bank': 'karnataka.png',
    'Indian Bank': 'indianbank.png',
    'Indian Overseas Bank': 'iob.png',
    'IOB': 'iob.png',
    'Federal Bank': 'federal.png',
    'South Indian Bank': 'sib.png',
    'SIB': 'sib.png'
  };
  const fileName = bankLogoMap[bankName];
  if (fileName) return `/images/banks/${fileName}`;
  return null;
};

// ============================================
// MAIN COMPONENT
// ============================================
const RechargeChatCard = ({ data, onAction, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  
  console.log("📱 RechargeChatCard received data:", data);
  
  // Extract data
  const { paymentData } = data || {};
  const { 
    mobileNumber, 
    operator, 
    amount, 
    plan, 
    security, 
    bankAccount, 
    plans 
  } = paymentData || {};
  
  const operatorId = operator?.id || 'unknown';
  const operatorName = operator?.name || 'Operator';
  const operatorColor = operator?.color || '#4f46e5';
  const bankLogo = getBankLogoUrl(bankAccount?.bank_name);
  const requiresPin = security?.requiresPin || false;
  const method = security?.method || 'bank';
  const isReservePay = method === 'reserve_pay';
  
  // Use plans from paymentData or default
  const displayPlans = plans && plans.length > 0 ? plans : [];
  const defaultPlan = plan || (displayPlans.length > 0 ? displayPlans[0] : null);
  
  // Auto-select the plan if not selected
  if (!selectedPlan && defaultPlan) {
    setSelectedPlan(defaultPlan);
  }

  // Get operator emoji
  const getOperatorEmoji = () => {
    switch(operatorId) {
      case 'airtel': return '🔴';
      case 'jio': return '🔵';
      case 'vi': return '🟣';
      case 'bsnl': return '🟢';
      default: return '📱';
    }
  };

  // Handle plan selection
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  // Handle confirm
  const handleConfirm = async () => {
    setLoading(true);
    try {
      const paymentDataToSend = {
        ...paymentData,
        selectedPlan: selectedPlan || plan || { amount: amount }
      };
      await onAction('confirm_payment', { 
        paymentData: paymentDataToSend, 
        requiresPin: requiresPin 
      });
    } catch (error) {
      console.error('Confirm error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onAction('cancel', null);
    onClose?.();
  };

  // Get bank logo component
  const getBankLogoComponent = () => {
    if (bankLogo && !imageErrors.bank) {
      return (
        <img 
          src={bankLogo} 
          alt={bankAccount?.bank_name} 
          className="method-icon-small"
          onError={() => setImageErrors(prev => ({ ...prev, bank: true }))}
        />
      );
    }
    return <FaUniversity className="method-icon-small" />;
  };

  return (
    <motion.div 
      className="payment-chat-card recharge-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="payment-card-header">
        <div className="payment-card-icon" style={{ background: operatorColor }}>
          <FaMobile style={{ color: 'white' }} />
        </div>
        <span className="payment-card-title">Mobile Recharge</span>
        <button className="payment-card-close" onClick={handleCancel}>
          <FaTimes />
        </button>
      </div>

      {/* ============================================ */}
      {/* BODY */}
      {/* ============================================ */}
      <div className="payment-card-body">
        
        {/* Mobile Number & Operator */}
        <div className="recharge-number-info">
          <div className="operator-indicator" style={{ color: operatorColor }}>
            {getOperatorEmoji()}
          </div>
          <div className="number-details">
            <span className="mobile-number">{mobileNumber}</span>
            <span className="operator-name" style={{ color: operatorColor }}>
              {operatorName}
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        {displayPlans.length > 1 && (
          <div className="recharge-plans">
            <span className="plans-label">Select Plan:</span>
            <div className="plans-grid">
              {displayPlans.map((p) => (
                <button
                  key={p.id}
                  className={`plan-option ${selectedPlan?.id === p.id ? 'selected' : ''}`}
                  onClick={() => handleSelectPlan(p)}
                >
                  <span className="plan-amount">₹{p.amount}</span>
                  {p.data && (
                    <span className="plan-data">
                      <FaWifi /> {p.data}
                    </span>
                  )}
                  {p.validity && (
                    <span className="plan-validity">
                      <FaClock /> {p.validity}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Plan Details */}
        {selectedPlan && (
          <div className="selected-plan-details">
            <div className="plan-name">{selectedPlan.name}</div>
            <div className="plan-details-row">
              {selectedPlan.data && (
                <span className="plan-detail"><FaWifi /> {selectedPlan.data}</span>
              )}
              {selectedPlan.validity && (
                <span className="plan-detail"><FaClock /> {selectedPlan.validity}</span>
              )}
              {selectedPlan.talktime && (
                <span className="plan-detail">📞 {selectedPlan.talktime}</span>
              )}
              {selectedPlan.sms && (
                <span className="plan-detail">✉️ {selectedPlan.sms}</span>
              )}
            </div>
          </div>
        )}

        {/* Amount Display */}
        <div className="payment-amount-display">
          <span className="amount-currency">₹</span>
          <span className="amount-value">
            {parseFloat(selectedPlan?.amount || amount || 0).toLocaleString()}
          </span>
        </div>

        {/* Payment Method */}
        <div className="payment-method-info">
          <div className="method-badge">
            {getBankLogoComponent()}
            <span>{bankAccount?.bank_name || 'Bank Account'}</span>
            {isReservePay && (
              <span className="reserve-badge">SabAI Pay Lite</span>
            )}
          </div>
        </div>

        {/* Security Status */}
        {requiresPin ? (
          <div className="security-status pin-required">
            <span className="status-icon">🔒</span>
            <span>PIN required for this recharge</span>
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
            className={`btn-confirm ${requiresPin ? 'bank-pay' : 'reserve-pay'}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <FaSpinner className="spinner-small" />
            ) : (
              requiresPin ? 'Recharge with PIN' : 'Recharge Now'
            )}
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* STYLES - Inline for completeness */}
      {/* ============================================ */}
      <style jsx>{`
        .payment-chat-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          max-width: 460px;
          margin: 8px 0;
          border: 1px solid rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
        }

        .dark .payment-chat-card {
          background: #1e293b;
          border-color: #334155;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .payment-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #eef2ff;
        }

        .dark .payment-card-header {
          border-bottom-color: #334155;
        }

        .payment-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .payment-card-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          flex: 1;
        }

        .dark .payment-card-title {
          color: #f1f5f9;
        }

        .payment-card-close {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 50%;
          background: #f1f5f9;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .dark .payment-card-close {
          background: #334155;
          color: #94a3b8;
        }

        .payment-card-close:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .payment-card-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .recharge-number-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: #f8fafc;
          border-radius: 12px;
        }

        .dark .recharge-number-info {
          background: #0f172a;
        }

        .operator-indicator {
          font-size: 1.8rem;
        }

        .number-details {
          flex: 1;
        }

        .mobile-number {
          display: block;
          font-weight: 600;
          font-size: 1.1rem;
          color: #1e293b;
          letter-spacing: 1px;
        }

        .dark .mobile-number {
          color: #f1f5f9;
        }

        .operator-name {
          font-size: 0.8rem;
          font-weight: 500;
        }

        .recharge-plans {
          margin: 4px 0;
        }

        .plans-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #64748b;
          display: block;
          margin-bottom: 8px;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
        }

        .plan-option {
          padding: 10px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .dark .plan-option {
          background: #0f172a;
          border-color: #334155;
        }

        .plan-option:hover {
          border-color: #4f46e5;
          transform: translateY(-2px);
        }

        .plan-option.selected {
          border-color: #4f46e5;
          background: #eef2ff;
        }

        .dark .plan-option.selected {
          background: #1e1b4b;
          border-color: #818cf8;
        }

        .plan-amount {
          display: block;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
        }

        .dark .plan-amount {
          color: #f1f5f9;
        }

        .plan-data {
          display: block;
          font-size: 0.7rem;
          color: #10b981;
        }

        .plan-validity {
          display: block;
          font-size: 0.7rem;
          color: #64748b;
        }

        .selected-plan-details {
          background: #f8fafc;
          border-radius: 12px;
          padding: 12px;
          text-align: center;
        }

        .dark .selected-plan-details {
          background: #0f172a;
        }

        .plan-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 6px;
        }

        .dark .plan-name {
          color: #f1f5f9;
        }

        .plan-details-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .plan-detail {
          font-size: 0.75rem;
          color: #64748b;
          background: white;
          padding: 2px 10px;
          border-radius: 12px;
        }

        .dark .plan-detail {
          background: #1e293b;
          color: #94a3b8;
        }

        .payment-amount-display {
          text-align: center;
          padding: 8px 0;
        }

        .amount-currency {
          font-size: 1.2rem;
          font-weight: 600;
          color: #64748b;
        }

        .amount-value {
          font-size: 2.2rem;
          font-weight: 800;
          color: #4f46e5;
          margin-left: 4px;
        }

        .dark .amount-value {
          color: #818cf8;
        }

        .payment-method-info {
          padding: 6px 0;
        }

        .method-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: #f1f5f9;
          border-radius: 30px;
          font-size: 0.8rem;
          color: #475569;
        }

        .dark .method-badge {
          background: #0f172a;
          color: #94a3b8;
        }

        .method-icon-small {
          width: 20px;
          height: 20px;
          object-fit: contain;
          border-radius: 50%;
        }

        .reserve-badge {
          font-size: 0.65rem;
          color: #10b981;
          background: #d1fae5;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .dark .reserve-badge {
          background: #1a3a2e;
          color: #34d399;
        }

        .security-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.85rem;
        }

        .security-status.pin-required {
          background: #fef2f2;
          color: #dc2626;
        }

        .dark .security-status.pin-required {
          background: #2d1a1a;
          color: #f87171;
        }

        .security-status.pin-free {
          background: #d1fae5;
          color: #059669;
        }

        .dark .security-status.pin-free {
          background: #1a3a2e;
          color: #34d399;
        }

        .security-status .status-icon {
          font-size: 1rem;
        }

        .limit-remaining {
          margin-left: auto;
          font-size: 0.7rem;
          opacity: 0.8;
        }

        .payment-card-actions {
          display: flex;
          gap: 12px;
        }

        .btn-cancel,
        .btn-confirm {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 40px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-cancel {
          background: #f1f5f9;
          color: #475569;
        }

        .dark .btn-cancel {
          background: #334155;
          color: #94a3b8;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .btn-confirm {
          color: white;
        }

        .btn-confirm.bank-pay {
          background: #4f46e5;
        }

        .btn-confirm.bank-pay:hover:not(:disabled) {
          background: #4338ca;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .btn-confirm.reserve-pay {
          background: #10b981;
        }

        .btn-confirm.reserve-pay:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .payment-chat-card {
            padding: 16px;
            border-radius: 16px;
          }
          
          .amount-value {
            font-size: 1.8rem;
          }
          
          .plans-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          }
          
          .payment-card-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default RechargeChatCard;