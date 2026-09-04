// frontend/src/components/chat/RechargeChatCard.jsx
// COMPLETE FIXED VERSION - No inline styles, uses CSS file

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaMobile,
  FaRupeeSign,
  FaTimes,
  FaUniversity,
  FaClock,
  FaWifi,
  FaSpinner,
} from "react-icons/fa";
import "./PaymentChatCards.css";

// ============================================
// HELPER: Get bank logo URL
// ============================================
const getBankLogoUrl = (bankName) => {
  const bankLogoMap = {
    "State Bank of India": "sbi.png",
    SBI: "sbi.png",
    "HDFC Bank": "hdfc.png",
    HDFC: "hdfc.png",
    "ICICI Bank": "icici.png",
    ICICI: "icici.png",
    "Axis Bank": "axis.png",
    Axis: "axis.png",
    "Bank of Baroda": "bob.png",
    BOB: "bob.png",
    "Punjab National Bank": "pnb.png",
    PNB: "pnb.png",
    "Canara Bank": "canara.png",
    Canara: "canara.png",
    "Union Bank of India": "union.png",
    "Union Bank": "union.png",
    "Kotak Mahindra Bank": "kotak.png",
    Kotak: "kotak.png",
    "IndusInd Bank": "indusind.png",
    IndusInd: "indusind.png",
    "Yes Bank": "yesbank.png",
    Yes: "yesbank.png",
    "IDFC First Bank": "idfc.png",
    IDFC: "idfc.png",
    "Karnataka Bank": "karnataka.png",
    "Indian Bank": "indianbank.png",
    "Indian Overseas Bank": "iob.png",
    IOB: "iob.png",
    "Federal Bank": "federal.png",
    "South Indian Bank": "sib.png",
    SIB: "sib.png",
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

  // Extract data
  const { paymentData } = data || {};
  const { mobileNumber, operator, amount, plan, security, bankAccount, plans } =
    paymentData || {};

  const operatorId = operator?.id || "unknown";
  const operatorName = operator?.name || "Operator";
  const operatorColor = operator?.color || "#4f46e5";
  const bankLogo = getBankLogoUrl(bankAccount?.bank_name);
  const requiresPin = security?.requiresPin || false;
  const method = security?.method || "bank";
  const isReservePay = method === "reserve_pay";

  // Use plans from paymentData or default
  const displayPlans = plans && plans.length > 0 ? plans : [];
  const defaultPlan =
    plan || (displayPlans.length > 0 ? displayPlans[0] : null);
  const [selectedOperator, setSelectedOperator] = useState(operator);

  useEffect(() => {
    setSelectedOperator(operator);
    setSelectedPlan(defaultPlan || null);
  }, [operator, defaultPlan]);

  // Get operator emoji
  const getOperatorEmoji = () => {
    switch (operatorId) {
      case "airtel":
        return "🔴";
      case "jio":
        return "🔵";
      case "vi":
        return "🟣";
      case "bsnl":
        return "🟢";
      default:
        return "📱";
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
        operator: selectedOperator || operator,
        selectedPlan: selectedPlan || plan || { amount: amount },
      };
      await onAction("confirm_payment", {
        paymentData: paymentDataToSend,
        requiresPin: requiresPin,
      });
    } catch (error) {
      console.error("Confirm error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onAction("cancel", null);
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
          onError={() => setImageErrors((prev) => ({ ...prev, bank: true }))}
        />
      );
    }
    return <FaUniversity className="method-icon-small" />;
  };

  // Limit number of plans shown
  const visiblePlans = displayPlans.slice(0, 8);

  return (
    <motion.div
      className="payment-chat-card recharge-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* HEADER */}
      <div className="payment-card-header">
        <div
          className="payment-card-icon"
          style={{ background: operatorColor }}
        >
          <FaMobile style={{ color: "white" }} />
        </div>
        <span className="payment-card-title">Mobile Recharge</span>
        <button className="payment-card-close" onClick={handleCancel}>
          <FaTimes />
        </button>
      </div>

      {/* BODY */}
      <div className="payment-card-body">
        {/* Mobile Number & Operator */}
        <div className="recharge-number-info">
          <div className="operator-picker">
            <span className="plans-label">Operator:</span>
            <div className="operator-picker-options">
              {[
                ["airtel", "Airtel", "#e31b23"],
                ["jio", "Jio", "#0f3cc9"],
                ["vi", "Vi", "#9b1fe0"],
                ["bsnl", "BSNL", "#1e7b4b"],
              ].map(([id, name, color]) => (
                <button
                  key={id}
                  type="button"
                  className={`operator-picker-btn ${selectedOperator?.id === id ? "selected" : ""}`}
                  style={{ "--operator-color": color }}
                  onClick={() => setSelectedOperator({ id, name, color })}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
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
        {visiblePlans.length > 0 && (
          <div className="recharge-plans">
            <span className="plans-label">Select Plan:</span>
            <div className="plans-grid">
              {visiblePlans.map((p) => (
                <button
                  key={p.id}
                  className={`plan-option ${selectedPlan?.id === p.id ? "selected" : ""}`}
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
                <span className="plan-detail">
                  <FaWifi /> {selectedPlan.data}
                </span>
              )}
              {selectedPlan.validity && (
                <span className="plan-detail">
                  <FaClock /> {selectedPlan.validity}
                </span>
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
            <span>{bankAccount?.bank_name || "Bank Account"}</span>
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
            className={`btn-confirm ${requiresPin ? "bank-pay" : "reserve-pay"}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <FaSpinner className="spinner-small" />
            ) : requiresPin ? (
              "Recharge with PIN"
            ) : (
              "Recharge Now"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default RechargeChatCard;
