// frontend/src/components/chat/SendMoneyInputCard.jsx
// Interactive card for send money input

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaUser,
  FaCheckCircle,
  FaTimes,
  FaRupeeSign,
  FaSearch,
  FaSpinner,
  FaAddressCard,
  FaPhone,
  FaUniversity,
  FaUserFriends,
} from "react-icons/fa";
import axios from "axios";
import "./PaymentChatCards.css";

const SendMoneyInputCard = ({
  missingSlots,
  currentSlots,
  onConfirm,
  onCancel,
}) => {
  const [recipient, setRecipient] = useState(currentSlots?.recipient || "");
  const [amount, setAmount] = useState(currentSlots?.amount || "");
  const [note, setNote] = useState(currentSlots?.note || "");
  const [recipientType, setRecipientType] = useState("contact");
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load contacts
  useEffect(() => {
    loadContacts();
  }, []);

  // Filter contacts on recipient change
  useEffect(() => {
    if (recipient.length > 0) {
      const filtered = contacts.filter(
        (c) =>
          c.name?.toLowerCase().includes(recipient.toLowerCase()) ||
          c.vpa?.toLowerCase().includes(recipient.toLowerCase()) ||
          c.phone?.includes(recipient),
      );
      setFilteredContacts(filtered);
      setShowContacts(filtered.length > 0);
    } else {
      setFilteredContacts(contacts.slice(0, 5));
      setShowContacts(contacts.length > 0);
    }
  }, [recipient, contacts]);

  const loadContacts = async () => {
    try {
      const response = await axios.get("/api/agent/contacts", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) {
        setContacts(response.data.data.contacts || []);
        setFilteredContacts((response.data.data.contacts || []).slice(0, 5));
      }
    } catch (error) {
      console.error("Load contacts error:", error);
    }
  };

  const handleRecipientChange = (e) => {
    setRecipient(e.target.value);
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

  const handleContactSelect = (contact) => {
    setRecipient(contact.name || contact.vpa || contact.phone);
    setShowContacts(false);
    setError("");
  };

  const handleConfirm = () => {
    // Validate
    if (!recipient || recipient.trim().length < 2) {
      setError("Please enter a recipient name, UPI ID, or phone number");
      return;
    }

    if (!amount || amount < 1) {
      setError("Please enter a valid amount");
      return;
    }

    const cardData = {
      recipient: recipient.trim(),
      amount: parseInt(amount),
      note: note.trim() || undefined,
      recipientType: recipientType,
    };

    onConfirm(cardData);
  };

  const getRecipientTypeIcon = () => {
    switch (recipientType) {
      case "contact":
        return <FaUserFriends />;
      case "upi":
        return <FaAddressCard />;
      case "phone":
        return <FaPhone />;
      case "bank":
        return <FaUniversity />;
      default:
        return <FaUser />;
    }
  };

  return (
    <motion.div
      className="payment-chat-card send-money-input-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="payment-card-header">
        <div className="payment-card-icon" style={{ background: "#10b981" }}>
          <FaUser />
        </div>
        <span className="payment-card-title">Send Money</span>
        <button className="payment-card-close" onClick={onCancel}>
          <FaTimes />
        </button>
      </div>

      <div className="payment-card-body">
        {/* Recipient Type Selection */}
        <div className="form-group">
          <label>Recipient Type</label>
          <div className="recipient-type-select">
            {["contact", "upi", "phone", "bank"].map((type) => (
              <button
                key={type}
                className={`type-btn ${recipientType === type ? "active" : ""}`}
                onClick={() => setRecipientType(type)}
              >
                {type === "contact" && <FaUserFriends />}
                {type === "upi" && <FaAddressCard />}
                {type === "phone" && <FaPhone />}
                {type === "bank" && <FaUniversity />}
                <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recipient Input */}
        <div className="form-group">
          <label>
            {recipientType === "contact"
              ? "Contact Name"
              : recipientType === "upi"
                ? "UPI ID"
                : recipientType === "phone"
                  ? "Phone Number"
                  : "Bank Account Details"}
          </label>
          <div className="input-with-icon">
            {getRecipientTypeIcon()}
            <input
              type="text"
              value={recipient}
              onChange={handleRecipientChange}
              placeholder={
                recipientType === "contact"
                  ? "Enter contact name"
                  : recipientType === "upi"
                    ? "Enter UPI ID (e.g., name@bank)"
                    : recipientType === "phone"
                      ? "Enter phone number"
                      : "Enter bank account details"
              }
              className="form-input"
              autoFocus={missingSlots?.includes("recipient")}
              onFocus={() => setShowContacts(true)}
              onBlur={() => setTimeout(() => setShowContacts(false), 300)}
            />
          </div>

          {/* Contact Suggestions */}
          {showContacts && filteredContacts.length > 0 && (
            <div className="contact-suggestions">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  className="contact-suggestion"
                  onClick={() => handleContactSelect(contact)}
                >
                  <div className="contact-avatar">
                    {contact.name?.charAt(0) || "U"}
                  </div>
                  <div className="contact-info">
                    <span className="contact-name">
                      {contact.name || contact.vpa}
                    </span>
                    <span className="contact-detail">
                      {contact.vpa || contact.phone || ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

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
              min="1"
              className="form-input"
              autoFocus={missingSlots?.includes("amount")}
            />
          </div>
          <div className="quick-amounts">
            {[100, 500, 1000, 2000, 5000, 10000].map((amt) => (
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

        {/* Note (Optional) */}
        <div className="form-group">
          <label>Note (Optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's this for?"
            className="form-input"
          />
        </div>

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
            disabled={!recipient || !amount || loading}
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

export default SendMoneyInputCard;
