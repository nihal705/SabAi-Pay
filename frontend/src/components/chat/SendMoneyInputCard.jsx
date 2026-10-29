// frontend/src/components/chat/SendMoneyInputCard.jsx
// Interactive card for send money input with distinct, logical form fields per tab

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
  FaUserPlus,
} from "react-icons/fa";
import axios from "axios";
import { getContacts, addContact } from "../../services/storageService";
import "./PaymentChatCards.css";

const SendMoneyInputCard = ({
  missingSlots,
  currentSlots,
  onConfirm,
  onCancel,
}) => {
  const [recipientType, setRecipientType] = useState("contact");
  const [amount, setAmount] = useState(currentSlots?.amount || "");
  const [note, setNote] = useState(currentSlots?.note || "");
  const [saveToContacts, setSaveToContacts] = useState(true);

  // Field states
  const [contactRecipient, setContactRecipient] = useState(
    currentSlots?.recipient || currentSlots?.recipientName || ""
  );
  const [recipientName, setRecipientName] = useState(
    currentSlots?.recipientName || ""
  );
  const [upiId, setUpiId] = useState("");
  const [phone, setPhone] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");

  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const UPI_HANDLES = ["@oksbi", "@okhdfcbank", "@okicici", "@ybl", "@paytm"];

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (contactRecipient.length > 0) {
      const filtered = contacts.filter(
        (c) =>
          c.name?.toLowerCase().includes(contactRecipient.toLowerCase()) ||
          c.vpa?.toLowerCase().includes(contactRecipient.toLowerCase()) ||
          c.phone?.includes(contactRecipient)
      );
      setFilteredContacts(filtered);
      setShowContacts(filtered.length > 0);
    } else {
      setFilteredContacts(contacts.slice(0, 5));
      setShowContacts(contacts.length > 0);
    }
  }, [contactRecipient, contacts]);

  const loadContacts = async () => {
    try {
      const loaded = await getContacts();
      if (Array.isArray(loaded)) {
        setContacts(loaded);
        setFilteredContacts(loaded.slice(0, 5));

        // If initial recipient was passed and isn't in contacts, auto-switch to UPI tab!
        const initialName = currentSlots?.recipient || currentSlots?.recipientName;
        if (initialName) {
          const exists = loaded.some(
            (c) =>
              c.name?.toLowerCase() === initialName.toLowerCase() ||
              c.vpa?.toLowerCase() === initialName.toLowerCase() ||
              c.phone === initialName
          );
          if (!exists) {
            setRecipientType("upi");
            setRecipientName(initialName);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load contacts:", err.message);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setAmount(value ? parseInt(value, 10) : "");
    setError("");
  };

  const handleQuickAmount = (amt) => {
    setAmount(amt);
    setError("");
  };

  const handleContactSelect = (contact) => {
    setContactRecipient(contact.name || contact.vpa || contact.phone);
    setShowContacts(false);
    setError("");
  };

  const handleConfirm = async () => {
    setError("");

    if (!amount || Number(amount) < 1) {
      setError("Please enter a valid amount (₹1 or more)");
      return;
    }

    let targetRecipient = "";
    let formattedMessage = "";

    if (recipientType === "contact") {
      if (!contactRecipient || contactRecipient.trim().length < 2) {
        setError("Please select or type a contact name");
        return;
      }
      targetRecipient = contactRecipient.trim();
      formattedMessage = `Send ₹${amount} to ${targetRecipient}`;
    } else if (recipientType === "upi") {
      if (!upiId || !upiId.includes("@")) {
        setError("Please enter a valid UPI ID (e.g., name@bank)");
        return;
      }
      targetRecipient = upiId.trim();
      formattedMessage = `Send ₹${amount} to ${targetRecipient}`;
    } else if (recipientType === "phone") {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
        setError("Please enter a valid 10-digit Indian phone number");
        return;
      }
      targetRecipient = cleanPhone;
      formattedMessage = `Send ₹${amount} to ${targetRecipient}`;
    } else if (recipientType === "bank") {
      const cleanAccount = accountNumber.replace(/\D/g, "");
      const cleanIfsc = ifsc.trim().toUpperCase();
      if (cleanAccount.length < 8 || cleanAccount.length > 18) {
        setError("Please enter a valid bank account number (8-18 digits)");
        return;
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
        setError("Please enter a valid 11-character IFSC code (e.g. HDFC0001234)");
        return;
      }
      targetRecipient = `${cleanAccount}/${cleanIfsc}`;
      formattedMessage = `Send ₹${amount} to bank account ${cleanAccount} IFSC ${cleanIfsc}`;
    }

    // Save contact if requested for non-contact tabs
    if (saveToContacts && recipientType !== "contact" && (recipientName || targetRecipient)) {
      try {
        const cName = recipientName.trim() || targetRecipient;
        const cVpa = recipientType === "upi" ? targetRecipient : `${targetRecipient}@upi`;
        const cPhone = recipientType === "phone" ? targetRecipient : null;

        await addContact({ name: cName, vpa: cVpa, phone: cPhone });
      } catch (saveErr) {
        console.warn("Could not auto-save contact:", saveErr.message);
      }
    }

    if (note && note.trim()) {
      formattedMessage += ` for ${note.trim()}`;
    }

    onConfirm({
      recipient: targetRecipient,
      amount: Number(amount),
      note: note.trim() || undefined,
      recipientType,
      message: formattedMessage,
    });
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
        {/* Recipient Type Tabs */}
        <div className="form-group">
          <label>Transfer Method</label>
          <div className="recipient-type-select">
            {[
              { id: "contact", label: "Contact", icon: <FaUserFriends /> },
              { id: "upi", label: "UPI ID", icon: <FaAddressCard /> },
              { id: "phone", label: "Phone", icon: <FaPhone /> },
              { id: "bank", label: "Bank Wire", icon: <FaUniversity /> },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`type-btn ${recipientType === t.id ? "active" : ""}`}
                onClick={() => {
                  setRecipientType(t.id);
                  setError("");
                }}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 1. CONTACT TAB */}
        {recipientType === "contact" && (
          <div className="form-group">
            <label>Saved Contact</label>
            <div className="input-with-icon">
              <FaSearch className="input-icon" />
              <input
                type="text"
                value={contactRecipient}
                onChange={(e) => {
                  setContactRecipient(e.target.value);
                  setError("");
                }}
                placeholder="Search contact by name or number..."
                className="form-input"
                onFocus={() => setShowContacts(true)}
              />
            </div>
            {showContacts && filteredContacts.length > 0 && (
              <div className="contact-suggestions">
                {filteredContacts.map((c) => (
                  <button
                    key={c.id || c.vpa}
                    type="button"
                    className="contact-suggestion"
                    onClick={() => handleContactSelect(c)}
                  >
                    <div className="contact-avatar">
                      {c.name ? c.name.charAt(0).toUpperCase() : "👤"}
                    </div>
                    <div className="contact-info">
                      <span className="contact-name">{c.name || c.vpa}</span>
                      <span className="contact-detail">{c.vpa || c.phone || ""}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. UPI TAB */}
        {recipientType === "upi" && (
          <>
            <div className="form-group">
              <label>Recipient Name (Optional)</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Virtual Payment Address (UPI ID)</label>
              <div className="input-with-icon">
                <FaAddressCard className="input-icon" />
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => {
                    setUpiId(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. username@okhdfcbank"
                  className="form-input"
                />
              </div>
              <div className="quick-handles">
                {UPI_HANDLES.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className="quick-handle-btn"
                    onClick={() => {
                      const prefix = upiId.includes("@") ? upiId.split("@")[0] : upiId;
                      setUpiId((prefix || "user") + h);
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 3. PHONE TAB */}
        {recipientType === "phone" && (
          <>
            <div className="form-group">
              <label>Recipient Name (Optional)</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>10-Digit Mobile Number</label>
              <div className="input-with-icon">
                <FaPhone className="input-icon" />
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  placeholder="e.g. 9876543210"
                  className="form-input"
                />
              </div>
            </div>
          </>
        )}

        {/* 4. BANK TAB */}
        {recipientType === "bank" && (
          <>
            <div className="form-group">
              <label>Account Holder Name</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Bank Account Number</label>
              <div className="input-with-icon">
                <FaUniversity className="input-icon" />
                <input
                  type="text"
                  maxLength={18}
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  placeholder="e.g. 123456789012"
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label>11-Character IFSC Code</label>
              <input
                type="text"
                maxLength={11}
                value={ifsc}
                onChange={(e) => {
                  setIfsc(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="e.g. HDFC0001234"
                className="form-input"
                style={{ textTransform: "uppercase" }}
              />
            </div>
          </>
        )}

        {/* Save to contacts toggle for new recipients */}
        {recipientType !== "contact" && (
          <div className="save-contact-row" style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0" }}>
            <input
              type="checkbox"
              id="saveContactCheck"
              checked={saveToContacts}
              onChange={(e) => setSaveToContacts(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label htmlFor="saveContactCheck" style={{ fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <FaUserPlus /> Save as contact for instant PIN-less Reserve Pay
            </label>
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
              min="1"
              className="form-input"
            />
          </div>
          <div className="quick-amounts">
            {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
              <button
                key={amt}
                type="button"
                className={`quick-amount-btn ${amount === amt ? "active" : ""}`}
                onClick={() => handleQuickAmount(amt)}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="form-group">
          <label>Note (Optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What is this payment for?"
            className="form-input"
          />
        </div>

        {/* Error message */}
        {error && <div className="error-message" style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px" }}>{error}</div>}

        {/* Actions */}
        <div className="payment-card-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-confirm bank-pay" onClick={handleConfirm}>
            Proceed
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SendMoneyInputCard;
