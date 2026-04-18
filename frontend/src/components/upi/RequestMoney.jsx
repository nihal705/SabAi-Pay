import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePayment } from '../../context/PaymentContext';
import {
  FaUser,
  FaRupeeSign,
  FaShare,
  FaCopy,
  FaWhatsapp,
  FaEnvelope,
  FaLink
} from 'react-icons/fa';
import { MdQrCode } from 'react-icons/md';
import Input from '../common/Input';
import Button from '../common/Button';
import QRCode from 'react-qr-code';
import axios from 'axios';
import toast from 'react-hot-toast';
import './UPIStyles.css';

const RequestMoney = () => {
  const navigate = useNavigate();
  const { user } = usePayment();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    requester_vpa: '',
    amount: '',
    note: ''
  });
  const [errors, setErrors] = useState({});
  const [requestLink, setRequestLink] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.requester_vpa) {
      newErrors.requester_vpa = 'UPI ID is required';
    } else if (!/^[\w.-]+@[\w.-]+$/.test(formData.requester_vpa)) {
      newErrors.requester_vpa = 'Enter a valid UPI ID';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || formData.amount <= 0) {
      newErrors.amount = 'Enter a valid amount';
    } else if (formData.amount > 100000) {
      newErrors.amount = 'Maximum request amount is ₹1,00,000';
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/upi/request`, {
        requester_vpa: formData.requester_vpa,
        amount: parseFloat(formData.amount),
        note: formData.note
      });

      if (response.data.success) {
        const link = `https://sabaipay.com/pay?request=${response.data.data.request_id}`;
        setRequestLink(link);
        setStep(2);
        toast.success('Money request created!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleShare = (method) => {
    const message = `Please pay me ₹${formData.amount} using SabAI Pay: ${requestLink}`;
    
    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=Money Request&body=${encodeURIComponent(message)}`);
        break;
      default:
        navigator.share?.({
          title: 'Money Request',
          text: message,
          url: requestLink
        }).catch(() => handleCopy(requestLink));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="request-money-container"
    >
      <div className="request-money-card">
        <div className="request-money-header">
          <h1>Request Money</h1>
          <p className="subtitle">Request money from friends and family</p>
        </div>

        {step === 1 ? (
          <div className="step-content">
            <div className="form-section">
              <Input
                label="Requester's UPI ID"
                type="text"
                name="requester_vpa"
                value={formData.requester_vpa}
                onChange={handleChange}
                placeholder="e.g., friend@okhdfcbank"
                icon={FaUser}
                error={errors.requester_vpa}
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
                max="100000"
              />

              <Input
                label="Note (Optional)"
                type="text"
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="What's it for?"
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
                onClick={handleSubmit}
                loading={loading}
              >
                Create Request
              </Button>
            </div>
          </div>
        ) : (
          <div className="step-content">
            <div className="request-success">
              <div className="success-icon">✅</div>
              <h3>Request Created!</h3>
              <p className="success-message">
                Share this link with {formData.requester_vpa} to receive ₹{formData.amount}
              </p>

              {/* QR Code */}
              <div className="qr-code-container">
                <QRCode value={requestLink} size={200} />
              </div>

              {/* Payment Link */}
              <div className="payment-link-section">
                <label>Payment Link</label>
                <div className="link-copy">
                  <input type="text" value={requestLink} readOnly />
                  <button onClick={() => handleCopy(requestLink)}>
                    <FaCopy />
                  </button>
                </div>
              </div>

              {/* Share Options */}
              <div className="share-options">
                <h4>Share via</h4>
                <div className="share-buttons">
                  <button
                    className="share-btn whatsapp"
                    onClick={() => handleShare('whatsapp')}
                  >
                    <FaWhatsapp />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    className="share-btn email"
                    onClick={() => handleShare('email')}
                  >
                    <FaEnvelope />
                    <span>Email</span>
                  </button>
                  <button
                    className="share-btn link"
                    onClick={() => handleShare('link')}
                  >
                    <FaLink />
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>

              <div className="form-footer single">
                <Button
                  variant="primary"
                  onClick={() => navigate('/dashboard')}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RequestMoney;