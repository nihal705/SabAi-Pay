import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePayment } from '../../context/PaymentContext';
import { useAuth } from '../../context/AuthContext';
import {
  FaUser,
  FaRupeeSign,
  FaArrowRight,
  FaHistory,
  FaStar,
  FaQrcode,
  FaCamera,
  FaUserCircle,
  FaCheckCircle,
  FaExclamationCircle
} from 'react-icons/fa';
import { MdContactPhone } from 'react-icons/md';
import Input from '../common/Input';
import Button from '../common/Button';
import Modal, { ConfirmModal, SuccessModal } from '../common/Modal';
import axios from 'axios';
import toast from 'react-hot-toast';
import './UPIStyles.css';

const SendMoney = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance, sendMoney, fetchBalance } = usePayment();
  
  const [step, setStep] = useState(1); // 1: Enter details, 2: Confirm, 3: PIN
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recentContacts, setRecentContacts] = useState([]);
  const [formData, setFormData] = useState({
    receiver_vpa: '',
    receiver_name: '',
    amount: '',
    note: ''
  });
  const [errors, setErrors] = useState({});
  const [transactionDetails, setTransactionDetails] = useState(null);

  useEffect(() => {
    fetchRecentContacts();
  }, []);

  const fetchRecentContacts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/upi/contacts`);
      if (response.data.success) {
        setRecentContacts(response.data.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.receiver_vpa) {
      newErrors.receiver_vpa = 'UPI ID is required';
    } else if (!/^[\w.-]+@[\w.-]+$/.test(formData.receiver_vpa)) {
      newErrors.receiver_vpa = 'Enter a valid UPI ID (e.g., name@bank)';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || formData.amount <= 0) {
      newErrors.amount = 'Enter a valid amount';
    } else if (formData.amount > balance.remaining) {
      newErrors.amount = `Amount exceeds remaining limit (₹${balance.remaining})`;
    } else if (formData.amount > 100000) {
      newErrors.amount = 'Maximum transaction limit is ₹1,00,000';
    }

    if (formData.note && formData.note.length > 100) {
      newErrors.note = 'Note cannot exceed 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleContactSelect = (contact) => {
    setFormData(prev => ({
      ...prev,
      receiver_vpa: contact.contact_vpa,
      receiver_name: contact.contact_name || ''
    }));
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!validateForm()) return;
      
      // Verify UPI ID (mock)
      setLoading(true);
      try {
        // In production, call API to verify UPI ID
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setFormData(prev => ({
          ...prev,
          receiver_name: prev.receiver_name || 'Test User'
        }));
        
        setStep(2);
      } catch (error) {
        toast.error('Failed to verify UPI ID');
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    
    // Mock PIN validation
    const result = await sendMoney({
      receiver_vpa: formData.receiver_vpa,
      amount: parseFloat(formData.amount),
      note: formData.note,
      pin: '1234' // In production, get from PIN input
    });

    setLoading(false);

    if (result?.success) {
      setTransactionDetails({
        amount: formData.amount,
        receiver: formData.receiver_vpa,
        transaction_id: result.data?.transaction_id
      });
      setShowSuccess(true);
      setStep(1);
      setFormData({
        receiver_vpa: '',
        receiver_name: '',
        amount: '',
        note: ''
      });
      fetchBalance();
    }
  };

  const handleQRScan = (data) => {
    if (data) {
      // Parse QR data (should contain UPI ID or payment link)
      setFormData(prev => ({ ...prev, receiver_vpa: data }));
      setShowScanner(false);
      toast.success('QR code scanned successfully');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="send-money-container"
    >
      <div className="send-money-card">
        <div className="send-money-header">
          <h1>Send Money</h1>
          <p className="balance-info">
            Available Balance: <strong>₹{balance.remaining}</strong>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Enter Details</span>
          </div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Confirm</span>
          </div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Pay</span>
          </div>
        </div>

        {step === 1 && (
          <div className="step-content">
            {/* Recent Contacts */}
            {recentContacts.length > 0 && (
              <div className="recent-contacts">
                <h3>
                  <FaHistory className="section-icon" />
                  Recent Contacts
                </h3>
                <div className="contacts-list">
                  {recentContacts.map((contact) => (
                    <button
                      key={contact.id}
                      className="contact-chip"
                      onClick={() => handleContactSelect(contact)}
                    >
                      <FaUserCircle />
                      <span>{contact.contact_name || contact.contact_vpa.split('@')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QR Scanner Option */}
            <div className="qr-option">
              <button
                className="qr-scan-btn"
                onClick={() => setShowScanner(true)}
              >
                <FaQrcode />
                <span>Scan QR Code</span>
              </button>
            </div>

            {/* Form */}
            <div className="form-section">
              <Input
                label="UPI ID / Mobile Number"
                type="text"
                name="receiver_vpa"
                value={formData.receiver_vpa}
                onChange={handleChange}
                placeholder="e.g., name@okhdfcbank or 9876543210"
                icon={FaUser}
                error={errors.receiver_vpa}
                required
              />

              <Input
                label="Amount (₹)"
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                icon={FaRupeeSign}
                error={errors.amount}
                required
                min="1"
                max={balance.remaining}
              />

              <Input
                label="Note (Optional)"
                type="text"
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="What's this for?"
                error={errors.note}
              />

              {/* Quick Amounts */}
              <div className="quick-amounts">
                {[100, 500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    className={`quick-amount-btn ${formData.amount == amt ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, amount: amt }))}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-footer">
              <Button
                variant="secondary"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                loading={loading}
                icon={FaArrowRight}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <div className="confirm-details">
              <h3>Confirm Payment Details</h3>

              <div className="details-card">
                <div className="detail-row">
                  <span className="detail-label">Receiving UPI ID</span>
                  <span className="detail-value">{formData.receiver_vpa}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Recipient Name</span>
                  <span className="detail-value">{formData.receiver_name}</span>
                </div>
                <div className="detail-row highlight">
                  <span className="detail-label">Amount</span>
                  <span className="detail-value amount">₹{formData.amount}</span>
                </div>
                {formData.note && (
                  <div className="detail-row">
                    <span className="detail-label">Note</span>
                    <span className="detail-value">{formData.note}</span>
                  </div>
                )}
              </div>

              <div className="warning-message">
                <FaExclamationCircle />
                <p>Please verify the details before proceeding. This action cannot be undone.</p>
              </div>
            </div>

            <div className="form-footer">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
              >
                Proceed to Pay
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <div className="pin-section">
              <h3>Enter UPI PIN</h3>
              <p className="pin-info">Enter your 4-digit UPI PIN to confirm payment</p>

              <div className="pin-display">
                <span>₹{formData.amount}</span>
                <span>to {formData.receiver_name}</span>
              </div>

              <div className="pin-inputs">
                {[1, 2, 3, 4].map((i) => (
                  <input
                    key={i}
                    type="password"
                    maxLength="1"
                    className="pin-digit"
                    autoFocus={i === 1}
                  />
                ))}
              </div>

              <div className="pin-keypad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((key) => (
                  <button
                    key={key}
                    className="keypad-btn"
                    onClick={() => {
                      // Handle keypad input
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                onClick={handleSend}
                loading={loading}
                fullWidth
              >
                Pay ₹{formData.amount}
              </Button>

              <button
                className="forgot-pin-link"
                onClick={() => toast.info('PIN recovery coming soon')}
              >
                Forgot PIN?
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <Modal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        title="Scan QR Code"
        size="medium"
      >
        <div className="qr-scanner-modal">
          <div className="scanner-preview">
            <div className="scanner-frame">
              <FaCamera className="scanner-icon" />
              <p>Place QR code inside the frame</p>
            </div>
          </div>
          <div className="scanner-footer">
            <Button variant="secondary" onClick={() => setShowScanner(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          navigate('/transactions');
        }}
        title="Payment Successful!"
        message={`₹${formData.amount} sent to ${formData.receiver_name}`}
      />
    </motion.div>
  );
};

export default SendMoney;