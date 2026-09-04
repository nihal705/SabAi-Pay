// frontend/src/components/chat/BillPayInputCard.jsx
// Interactive card for bill payment input

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaBolt,
  FaCheckCircle,
  FaTimes,
  FaRupeeSign,
  FaSearch,
  FaSpinner,
  FaTint,
  FaWifi,
  FaFire,
  FaMobile,
  FaCreditCard,
} from "react-icons/fa";
import axios from "axios";
import "./PaymentChatCards.css";

const BillPayInputCard = ({
  missingSlots,
  currentSlots,
  onConfirm,
  onCancel,
}) => {
  const [billType, setBillType] = useState(currentSlots?.billType || "");
  const [provider, setProvider] = useState(currentSlots?.provider || "");
  const [customerId, setCustomerId] = useState(currentSlots?.customerId || "");
  const [amount, setAmount] = useState(currentSlots?.amount || "");
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load providers when bill type changes
  useEffect(() => {
    if (billType) {
      loadProviders(billType);
    } else {
      setProviders([]);
    }
  }, [billType]);

  const loadProviders = async (type) => {
    try {
      const response = await axios.get(`/api/agent/billers/${type}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) {
        setProviders(response.data.data.billers || []);
      }
    } catch (error) {
      console.error("Load providers error:", error);
    }
  };

  const handleBillTypeSelect = (type) => {
    setBillType(type);
    setProvider("");
    setError("");
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

  const handleConfirm = () => {
    // Validate
    if (!billType) {
      setError("Please select a bill type");
      return;
    }

    if (!provider) {
      setError("Please select a provider");
      return;
    }

    if (!customerId || customerId.trim().length < 2) {
      setError("Please enter your customer ID");
      return;
    }

    if (!amount || amount < 10) {
      setError("Please enter a valid amount (minimum ₹10)");
      return;
    }

    const cardData = {
      billType: billType,
      provider: provider,
      customerId: customerId.trim(),
      amount: parseInt(amount),
    };

    onConfirm(cardData);
  };

  const getBillTypeIcon = (type) => {
    const icons = {
      electricity: <FaBolt />,
      water: <FaTint />,
      gas: <FaFire />,
      broadband: <FaWifi />,
      mobile: <FaMobile />,
      credit_card: <FaCreditCard />,
    };
    return icons[type] || <FaBolt />;
  };

  const getBillTypeLabel = (type) => {
    const labels = {
      electricity: "Electricity",
      water: "Water",
      gas: "Gas",
      broadband: "Broadband",
      mobile: "Mobile",
      credit_card: "Credit Card",
    };
    return labels[type] || type;
  };

  const billTypes = [
    "electricity",
    "water",
    "gas",
    "broadband",
    "mobile",
    "credit_card",
  ];

  return (
    <motion.div
      className="payment-chat-card bill-pay-input-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="payment-card-header">
        <div className="payment-card-icon" style={{ background: "#f59e0b" }}>
          <FaBolt />
        </div>
        <span className="payment-card-title">Pay Bill</span>
        <button className="payment-card-close" onClick={onCancel}>
          <FaTimes />
        </button>
      </div>

      <div className="payment-card-body">
        {/* Bill Type Selection */}
        <div className="form-group">
          <label>Bill Type</label>
          <div className="bill-type-grid">
            {billTypes.map((type) => (
              <button
                key={type}
                className={`bill-type-btn ${billType === type ? "active" : ""}`}
                onClick={() => handleBillTypeSelect(type)}
              >
                {getBillTypeIcon(type)}
                <span>{getBillTypeLabel(type)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Provider Selection */}
        {billType && (
          <div className="form-group">
            <label>Provider</label>
            <div className="provider-select">
              {providers.length > 0 ? (
                providers.map((p) => (
                  <button
                    key={p.id}
                    className={`provider-btn ${provider === p.name ? "selected" : ""}`}
                    onClick={() => setProvider(p.name)}
                  >
                    {p.name}
                  </button>
                ))
              ) : (
                <div className="loading-providers">Loading providers...</div>
              )}
            </div>
          </div>
        )}

        {/* Customer ID */}
        {provider && (
          <div className="form-group">
            <label>Customer ID / Account Number</label>
            <div className="input-with-icon">
              <FaSearch className="input-icon" />
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="Enter your customer ID"
                className="form-input"
                autoFocus={missingSlots?.includes("customerId")}
              />
            </div>
          </div>
        )}

        {/* Amount Input */}
        {customerId && (
          <div className="form-group">
            <label>Amount (₹)</label>
            <div className="input-with-icon">
              <FaRupeeSign className="input-icon" />
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter bill amount"
                min="10"
                className="form-input"
                autoFocus={missingSlots?.includes("amount")}
              />
            </div>
            <div className="quick-amounts">
              {[100, 500, 1000, 2000, 5000].map((amt) => (
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
            disabled={
              !billType || !provider || !customerId || !amount || loading
            }
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

export default BillPayInputCard;
