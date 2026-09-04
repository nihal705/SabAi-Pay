// frontend/src/components/chat/RechargeInputCard.jsx
// Interactive card for mobile recharge input

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaMobile,
  FaUser,
  FaCheckCircle,
  FaTimes,
  FaRupeeSign,
  FaClock,
  FaWifi,
  FaSearch,
  FaSpinner,
} from "react-icons/fa";
import axios from "axios";
import "./PaymentChatCards.css";

const RechargeInputCard = ({
  missingSlots,
  currentSlots,
  onConfirm,
  onCancel,
}) => {
  const [mobileNumber, setMobileNumber] = useState(
    currentSlots?.mobileNumber || "",
  );
  const [amount, setAmount] = useState(currentSlots?.amount || "");
  const [operator, setOperator] = useState(currentSlots?.operator || "");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detectingOperator, setDetectingOperator] = useState(false);
  const [error, setError] = useState("");
  const [showPlans, setShowPlans] = useState(false);

  // Auto-detect operator when mobile number changes
  useEffect(() => {
    if (mobileNumber.length === 10) {
      detectOperator(mobileNumber);
    } else if (mobileNumber.length > 0 && mobileNumber.length < 10) {
      setError("Please enter a 10-digit mobile number");
    } else {
      setError("");
    }
  }, [mobileNumber]);

  // Load plans when operator is detected
  useEffect(() => {
    if (operator) {
      loadPlans(operator);
    }
  }, [operator]);

  const detectOperator = async (number) => {
    if (number.length !== 10) return;

    setDetectingOperator(true);
    setError("");

    try {
      const response = await axios.get(`/api/agent/detect-operator/${number}`);
      if (response.data.success && response.data.data.operator) {
        setOperator(response.data.data.operator);
      } else {
        setError("Could not detect operator. Please select manually.");
      }
    } catch (error) {
      console.error("Operator detection error:", error);
      setError("Could not detect operator. Please select manually.");
    } finally {
      setDetectingOperator(false);
    }
  };

  const loadPlans = async (op) => {
    try {
      const response = await axios.get(`/api/agent/recharge-plans/${op}`);
      if (response.data.success) {
        setPlans(response.data.data.plans || []);
        setShowPlans(true);
      }
    } catch (error) {
      console.error("Load plans error:", error);
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setMobileNumber(value);
      if (value.length === 10) {
        detectOperator(value);
      }
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value) {
      setAmount(parseInt(value));
    } else {
      setAmount("");
    }
  };

  const handleQuickAmount = (amt) => {
    setAmount(amt);
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setAmount(plan.amount);
  };

  const handleConfirm = () => {
    // Validate
    if (!mobileNumber || mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!amount || amount < 10) {
      setError("Please enter a valid amount (minimum ₹10)");
      return;
    }

    if (!operator) {
      setError("Please select an operator");
      return;
    }

    const cardData = {
      mobileNumber: mobileNumber,
      amount: parseInt(amount),
      operator: operator,
      plan: selectedPlan,
    };

    onConfirm(cardData);
  };

  const getOperatorOptions = () => {
    return ["airtel", "jio", "vi", "bsnl"];
  };

  const getOperatorEmoji = (op) => {
    const map = {
      airtel: "🔴",
      jio: "🔵",
      vi: "🟣",
      bsnl: "🟢",
    };
    return map[op] || "📱";
  };

  const getOperatorColor = (op) => {
    const map = {
      airtel: "#e31b23",
      jio: "#0f3cc9",
      vi: "#9b1fe0",
      bsnl: "#1e7b4b",
    };
    return map[op] || "#4f46e5";
  };

  return (
    <motion.div
      className="payment-chat-card recharge-input-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="payment-card-header">
        <div className="payment-card-icon" style={{ background: "#4f46e5" }}>
          <FaMobile />
        </div>
        <span className="payment-card-title">Mobile Recharge</span>
        <button className="payment-card-close" onClick={onCancel}>
          <FaTimes />
        </button>
      </div>

      <div className="payment-card-body">
        {/* Mobile Number Input */}
        <div className="form-group">
          <label>Mobile Number</label>
          <div className="input-with-icon">
            <FaMobile className="input-icon" />
            <input
              type="text"
              value={mobileNumber}
              onChange={handleMobileChange}
              placeholder="Enter 10-digit number"
              maxLength="10"
              className="form-input"
              autoFocus={missingSlots?.includes("mobileNumber")}
            />
            {detectingOperator && <FaSpinner className="spinner-input" />}
          </div>
          {operator && (
            <div
              className="operator-detected"
              style={{ color: getOperatorColor(operator) }}
            >
              {getOperatorEmoji(operator)}{" "}
              {operator.charAt(0).toUpperCase() + operator.slice(1)} detected
            </div>
          )}
        </div>

        {/* Operator Selection (if not auto-detected) */}
        {!operator && mobileNumber.length > 0 && mobileNumber.length < 10 && (
          <div className="form-group">
            <label>Select Operator (Manual)</label>
            <div className="operator-select">
              {getOperatorOptions().map((op) => (
                <button
                  key={op}
                  className={`operator-btn ${operator === op ? "selected" : ""}`}
                  onClick={() => setOperator(op)}
                  style={{
                    borderColor:
                      operator === op ? getOperatorColor(op) : "#e2e8f0",
                    background:
                      operator === op
                        ? getOperatorColor(op) + "20"
                        : "transparent",
                  }}
                >
                  {getOperatorEmoji(op)}{" "}
                  {op.charAt(0).toUpperCase() + op.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="form-group">
          <label>Amount (₹)</label>
          <div className="input-with-icon">
            <FaRupeeSign className="input-icon" />
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount"
              min="10"
              className="form-input"
              autoFocus={missingSlots?.includes("amount")}
            />
          </div>
          <div className="quick-amounts">
            {[100, 199, 299, 399, 599, 999].map((amt) => (
              <button
                key={amt}
                className={`quick-amount-btn ${amount === amt ? "active" : ""}`}
                onClick={() => handleQuickAmount(amt)}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Plans (if available) */}
        {showPlans && plans.length > 0 && (
          <div className="form-group">
            <label>Select Plan (Optional)</label>
            <div className="plans-grid">
              {plans.slice(0, 6).map((plan) => (
                <button
                  key={plan.id}
                  className={`plan-option ${selectedPlan?.id === plan.id ? "selected" : ""}`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  <span className="plan-amount">₹{plan.amount}</span>
                  {plan.data && (
                    <span className="plan-data">
                      <FaWifi /> {plan.data}
                    </span>
                  )}
                  {plan.validity && (
                    <span className="plan-validity">
                      <FaClock /> {plan.validity}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && <div className="error-message">{error}</div>}

        {/* Actions */}
        <div className="payment-card-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-confirm bank-pay"
            onClick={handleConfirm}
            disabled={!mobileNumber || !amount || !operator || loading}
          >
            {loading ? (
              <FaSpinner className="spinner-small" />
            ) : (
              "Proceed to Payment"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default RechargeInputCard;
