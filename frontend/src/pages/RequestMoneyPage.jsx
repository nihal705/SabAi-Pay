// frontend/src/pages/RequestMoneyPage.jsx
// Complete working version with contact modal, success animation, and all features

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import storageService, { 
  getTransactions,
  getContacts,
  getMoneyRequests,
  setMoneyRequests,
  addTransaction,
  addMoneyRequest
} from '../services/storageService';
import { 
  FaUser, FaRupeeSign, FaArrowRight, FaHistory,
  FaStar, FaQrcode, FaUserCircle, FaCheckCircle,
  FaExclamationCircle, FaUniversity, FaWallet,
  FaTimes, FaArrowLeft, FaCopy, FaShare, FaArrowUp,
  FaWhatsapp, FaEnvelope, FaLink, FaSpinner,
  FaSearch, FaClock, FaCalendarAlt, FaTrash,
  FaEdit, FaInfoCircle, FaMobileAlt, FaArrowDown,
  FaMoneyBillWave, FaClock as FaClockIcon
} from 'react-icons/fa';
import { MdQrCodeScanner, MdVerified, MdGroups } from 'react-icons/md';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import './RequestMoneyPage.css';

// Helper function to get contact color
const getContactColor = (name) => {
  const colors = [
    '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#d946ef',
    '#3b82f6', '#14b8a6', '#a855f7', '#e11d48', '#f43f5e'
  ];
  let hash = 0;
  for (let i = 0; i < name?.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
};

// PopUPI Style Success Animation Component for Request
const RequestSuccessAnimation = ({ onComplete, requestData, onViewRequests, onNewRequest }) => {
  const [animationStage, setAnimationStage] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationStage(1), 300);
    const timer2 = setTimeout(() => setAnimationStage(2), 800);
    const timer3 = setTimeout(() => setAnimationStage(3), 1300);
    const timer4 = setTimeout(() => setShowOptions(true), 1800);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);
  
  return (
    <motion.div 
      className="popupi-animation"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="popupi-content">
        <motion.div 
          className="popupi-logo"
          animate={{ 
            scale: animationStage >= 1 ? [1, 1.2, 1] : 1,
            rotate: animationStage >= 1 ? [0, 360, 0] : 0
          }}
          transition={{ duration: 0.5 }}
        >
          <div className="logo-inner">
            <img src="/images/merchants/sabailogo.png" alt="SabAI Pay" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div className="logo-ring"></div>
        </motion.div>
        
        <motion.div 
          className="popupi-check"
          initial={{ scale: 0 }}
          animate={{ scale: animationStage >= 2 ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.2 }}
        >
          <FaArrowDown />
        </motion.div>
        
        <motion.div 
          className="popupi-text"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: animationStage >= 2 ? 0 : 20, opacity: animationStage >= 2 ? 1 : 0 }}
        >
          <h2>Request Sent!</h2>
          <p className="amount-paid">₹{requestData?.amount?.toLocaleString()}</p>
          <p className="to-text">from {requestData?.contactName}</p>
        </motion.div>
        
        <motion.div 
          className="popupi-details"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: animationStage >= 3 ? 'auto' : 0, opacity: animationStage >= 3 ? 1 : 0 }}
        >
          <div className="detail-item">
            <span>Request ID</span>
            <span className="txn-id">{requestData?.requestId}</span>
          </div>
          {requestData?.note && (
            <div className="detail-item">
              <span>Note</span>
              <span>{requestData.note}</span>
            </div>
          )}
          <div className="detail-item">
            <span>Expires in</span>
            <span>7 days</span>
          </div>
          <div className="detail-item">
            <span>Date & Time</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </motion.div>
        
        {showOptions && (
          <motion.div 
            className="popupi-options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button className="popupi-btn primary" onClick={onViewRequests}>
              <FaHistory /> View Requests
            </button>
            <button className="popupi-btn secondary" onClick={onNewRequest}>
              <FaArrowRight /> New Request
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Contact Details Modal (Similar to SendMoneyPage)
const ContactDetailsModal = ({ contact, onClose, onRequest, onCancelRequest, formatDate, contactTransactions, contactTotalReceived }) => {
  return (
    <motion.div className="contact-details-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><FaTimes /></button>
      
      <div className="contact-modal-header">
        <div className="contact-large-circle" style={{ backgroundColor: contact.color || getContactColor(contact.name) }}>
          {contact.name?.charAt(0).toUpperCase()}
        </div>
        <div className="contact-header-info">
          <h2>{contact.name}</h2>
          <p className="contact-vpa-large">{contact.vpa}</p>
          <div className="contact-stats">
            <div className="contact-stats">
              <div className="contact-stat">
                <span className="stat-value">₹{(contact.totalSent || 0).toLocaleString()}</span>
                <span className="stat-label">TOTAL SENT</span>
              </div>
              <div className="contact-stat">
                <span className="stat-value">{contact.transactionCount || 0}</span>
                <span className="stat-label">TRANSACTIONS</span>
              </div>
              <div className="contact-stat">
                <span className="stat-value">₹{(contactTotalReceived || 0).toLocaleString()}</span>
                <span className="stat-label">TOTAL RECEIVED</span>
              </div>
            </div>
          </div>
        </div>
        <div className="contact-actions-large">
          <button className="contact-request-btn-large" onClick={() => onRequest(contact)}>
            <FaArrowDown /> Request Money
          </button>
        </div>
      </div>

      <div className="contact-transactions-section">
        <h3>Transaction History</h3>
        <div className="transactions-list-scroll">
          {contactTransactions?.length > 0 ? (
            contactTransactions.map(tx => (
              <div key={tx.id} className="transaction-item">
                <div className="transaction-icon">
                  {tx.type === 'sent' ? <FaArrowUp className="sent" /> : 
                   tx.type === 'request_sent' ? <FaArrowDown className="request" /> : 
                   <FaArrowDown className="received" />}
                </div>
                <div className="transaction-info">
                  <p className="transaction-desc">
                    {tx.description || 'Payment'}
                    {tx.status === 'pending' && <span className="pending-badge"> (Pending)</span>}
                  </p>
                  <p className="transaction-date">{formatDate(tx.date)}</p>
                </div>
                <div className="transaction-amount">
                  <span className={tx.type === 'sent' ? 'amount-sent' : 'amount-request'}>
                    {tx.type === 'sent' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                  </span>
                </div>
                {tx.isRequest && tx.status === 'pending' && (
                  <button 
                    className="cancel-request-btn-small"
                    onClick={() => onCancelRequest(tx.requestId, contact)}
                    title="Cancel Request"
                  >
                    <FaTimes /> Cancel
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="no-transactions">
              <p>No transactions with this contact yet</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Share Request Modal
const ShareRequestModal = ({ onClose, requestData, requestLink, requestId, onCopy, onShare }) => {
  return (
    <motion.div className="share-request-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><FaTimes /></button>
      
      <div className="share-request-header">
        <div className="success-icon-small">
          <FaCheckCircle />
        </div>
        <h3>Request Created!</h3>
        <p className="share-subtitle">Share this link to receive payment</p>
      </div>

      <div className="share-request-body">
        {/* QR Code */}
        <div className="qr-code-container">
          <QRCode value={requestLink} size={180} level="H" />
          <div className="qr-logo">
            <img src="/images/merchants/sabailogo.png" alt="SabAI Pay" />
          </div>
        </div>

        {/* Amount Display */}
        <div className="request-amount-display">
          <span className="amount-label">Request Amount</span>
          <span className="amount-value">₹{requestData?.amount?.toLocaleString()}</span>
        </div>

        {/* Payment Link */}
        <div className="payment-link-section">
          <label>Payment Link</label>
          <div className="link-copy-group">
            <input 
              type="text" 
              value={requestLink} 
              readOnly 
              className="link-input"
            />
            <button 
              className="copy-btn"
              onClick={() => onCopy(requestLink)}
              title="Copy link"
            >
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
              onClick={() => onShare('whatsapp')}
            >
              <FaWhatsapp />
              <span>WhatsApp</span>
            </button>
            <button 
              className="share-btn email"
              onClick={() => onShare('email')}
            >
              <FaEnvelope />
              <span>Email</span>
            </button>
            <button 
              className="share-btn copy"
              onClick={() => onCopy(requestLink)}
            >
              <FaLink />
              <span>Copy Link</span>
            </button>
          </div>
        </div>

        {/* Request Summary */}
        <div className="request-summary">
          <div className="summary-row">
            <span>To</span>
            <span>{requestData?.contactName}</span>
          </div>
          {requestData?.note && (
            <div className="summary-row">
              <span>Note</span>
              <span>{requestData.note}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Request ID</span>
            <span className="request-id">{requestId}</span>
          </div>
          <div className="summary-row">
            <span>Expires in</span>
            <span>7 days</span>
          </div>
        </div>
      </div>

      <div className="share-request-footer">
        <button className="btn-secondary" onClick={onClose}>Close</button>
        <button className="btn-primary" onClick={() => onShare('whatsapp')}>
          <FaWhatsapp /> Share
        </button>
      </div>
    </motion.div>
  );
};

const RequestMoneyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showRequestsHistory, setShowRequestsHistory] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [recentRequests, setRecentRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  
  // Contact modal state
  const [selectedContact, setSelectedContact] = useState(null);
  const [showContactDetailsModal, setShowContactDetailsModal] = useState(false);
  const [contactTransactions, setContactTransactions] = useState([]);
  const [contactTotalReceived, setContactTotalReceived] = useState(0);
  
  // Success animation state
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [requestSuccessData, setRequestSuccessData] = useState(null);
  
  const [formData, setFormData] = useState({
    requester_vpa: '',
    requester_name: '',
    amount: '',
    note: ''
  });
  const [errors, setErrors] = useState({});
  const [requestLink, setRequestLink] = useState('');
  const [requestId, setRequestId] = useState('');

  // Load data on mount
  useEffect(() => {
    loadRecentRequests();
    loadPendingRequests();
    loadAllContacts();
  }, []);

// REPLACE loadAllContacts - Make it async
const loadAllContacts = async () => {
    try {
        const contacts = await getContacts();
        setAllContacts(contacts || []);
        setFilteredContacts(contacts || []);
    } catch (error) {
        console.error('Failed to load contacts:', error);
        setAllContacts([]);
        setFilteredContacts([]);
    }
};

// REPLACE loadRecentRequests - Make it async
const loadRecentRequests = async () => {
    try {
        let requests = await getMoneyRequests();
        if (!requests || !Array.isArray(requests) || requests.length === 0) {
            // Fallback to localStorage
            const localRequests = localStorage.getItem('moneyRequests');
            requests = localRequests ? JSON.parse(localRequests) : [];
        }
        const requestsArray = Array.isArray(requests) ? requests : [];
        const sorted = requestsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentRequests(sorted.slice(0, 10));
    } catch (error) {
        console.error('Failed to load recent requests:', error);
        // Fallback to localStorage
        const localRequests = localStorage.getItem('moneyRequests');
        const requests = localRequests ? JSON.parse(localRequests) : [];
        setRecentRequests(requests.slice(0, 10));
    }
};

const loadPendingRequests = async () => {
    try {
        let requests = await getMoneyRequests();
        if (!requests || !Array.isArray(requests) || requests.length === 0) {
            const localRequests = localStorage.getItem('moneyRequests');
            requests = localRequests ? JSON.parse(localRequests) : [];
        }
        const requestsArray = Array.isArray(requests) ? requests : [];
        const currentUserVpa = user?.phone_number ? `${user.phone_number}@sabai` : '';
        const pending = requestsArray.filter(r => 
            r.status === 'pending' && 
            r.recipient_vpa === currentUserVpa
        );
        setPendingRequests(pending);
    } catch (error) {
        console.error('Failed to load pending requests:', error);
        setPendingRequests([]);
    }
};

const loadContactTransactions = async (contact) => {
  try {
    const allTransactions = await getTransactions();
    const allRequests = await getMoneyRequests();
    
    // Get actual money SENT to this contact (successful transactions only)
    const sentTransactions = allTransactions.filter(tx => 
        (tx.type === 'send' || tx.type === 'sent') && 
        (tx.receiver_vpa === contact.vpa || tx.receiver_name === contact.name) &&
        tx.status === 'success'
    ).map(tx => ({
        id: tx.id,
        amount: tx.amount,
        date: tx.created_at || tx.date,
        type: 'sent',
        description: tx.description || 'Payment',
        isRequest: false
    }));
    
    // Get REQUESTS sent to this contact (money you requested from them)
    const sentRequests = allRequests.filter(req => 
        req.recipient_vpa === contact.vpa && 
        req.status === 'pending'
    ).map(req => ({
        id: req.id,
        amount: req.amount,
        date: req.date,
        type: 'request_sent',
        description: req.description || 'Money request',
        status: req.status,
        requestId: req.requestId,
        isRequest: true
    }));
    
    // Combine and sort
    const allContactTx = [...sentTransactions, ...sentRequests];
    allContactTx.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setContactTransactions(allContactTx);
    
    // Calculate TOTAL SENT (only actual money sent, NOT pending requests)
    const totalSent = sentTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    // Calculate total requested (pending requests amount)
    const totalRequested = sentRequests.reduce((sum, req) => sum + Number(req.amount), 0);
    
    setContactTotalReceived(contact.total_received || 0);
    
    // Update selected contact - totalSent should only include actual money sent
    setSelectedContact(prev => ({
        ...prev,
        totalSent: totalSent,
        totalRequested: totalRequested,
        transactionCount: sentTransactions.length
    }));
    
  } catch (error) {
    console.error('Failed to load contact transactions:', error);
    setContactTransactions([]);
    setContactTotalReceived(0);
  }
};

const getContacts = async () => {
    return await storageService.getContacts();
};

const getMoneyRequests = async () => {
    return await storageService.getMoneyRequests();
};

const addMoneyRequest = async (requestData) => {
    return await storageService.addMoneyRequest(requestData);
};

// REPLACE saveRequest
const saveRequestFunc = (requestData) => {
    const newRequest = {
        id: Date.now(),
        requestId: `REQ${Date.now()}${Math.floor(Math.random() * 1000)}`,
        amount: requestData.amount,
        description: requestData.note || `Money request`,
        requester_vpa: requestData.requester_vpa,
        requester_name: requestData.requester_name,
        requester_avatar: requestData.requester_name?.charAt(0) || 'U',
        date: new Date().toISOString(),
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    addMoneyRequest(newRequest);
    return newRequest;
};

  // Handle contact click - open details modal
  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    loadContactTransactions(contact);
    setShowContactDetailsModal(true);
  };

  // Handle request from contact modal
  // Handle request from contact modal
const handleRequestFromContactModal = (contact) => {
  // Set the form data with the contact's info
  setFormData({
    requester_vpa: contact.vpa,
    requester_name: contact.name,
    amount: '',
    note: ''
  });
  // Close the contact modal
  setShowContactDetailsModal(false);
  // The form is already visible on the page, so user can now enter amount and submit
  toast.success(`Enter amount to request from ${contact.name}`);
};

  useEffect(() => {
    const loadData = async () => {
        await Promise.all([
            loadRecentRequests(),
            loadPendingRequests(),
            loadAllContacts()
        ]);
    };
    loadData();
}, []);

  // Save request to history
  const saveRequest = async (requestData) => {
    try {
        const newRequest = {
            id: Date.now(),
            requestId: `REQ${Date.now()}${Math.floor(Math.random() * 1000)}`,
            amount: requestData.amount,
            description: requestData.note || `Money request`,
            requester_vpa: requestData.requester_vpa,
            requester_name: requestData.requester_name,
            requester_avatar: requestData.requester_name?.charAt(0) || 'U',
            date: new Date().toISOString(),
            status: 'pending',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        await addMoneyRequest(newRequest);
        return newRequest;
    } catch (error) {
        console.error('Failed to save request:', error);
        throw error;
    }
};

  const validateForm = () => {
    const newErrors = {};

    if (!formData.requester_vpa) {
      newErrors.requester_vpa = 'UPI ID / Mobile number is required';
    } else if (!/^[\w.-]+@[\w.-]+$/.test(formData.requester_vpa) && !/^[6-9]\d{9}$/.test(formData.requester_vpa)) {
      newErrors.requester_vpa = 'Enter a valid UPI ID or mobile number';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || formData.amount <= 0) {
      newErrors.amount = 'Enter a valid amount';
    } else if (formData.amount > 100000) {
      newErrors.amount = 'Maximum request amount is ₹1,00,000';
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
      requester_vpa: contact.vpa || contact.phone,
      requester_name: contact.name
    }));
    setShowContactsModal(false);
    setSearchTerm('');
  };

  const handleSubmit = async () => {
  if (!validateForm()) return;

  setLoading(true);
  
  try {
    const amount = parseFloat(formData.amount);
    const currentUserVpa = user?.phone_number ? `${user.phone_number}@sabai` : '';
    
    const newRequest = {
      id: Date.now(),
      requestId: `REQ${Date.now()}${Math.floor(Math.random() * 1000)}`,
      amount: amount,
      description: formData.note || `Money request`,
      requester_vpa: currentUserVpa,
      requester_name: user?.name || 'User',
      recipient_vpa: formData.requester_vpa,
      recipient_name: formData.requester_name || formData.requester_vpa.split('@')[0],
      date: new Date().toISOString(),
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Try to save using storageService, fallback to localStorage
    let saved = false;
    try {
      await addMoneyRequest(newRequest);
      saved = true;
    } catch (error) {
      console.error('API save failed, using localStorage:', error);
      // Fallback to localStorage
      const existingRequests = JSON.parse(localStorage.getItem('moneyRequests') || '[]');
      existingRequests.unshift(newRequest);
      localStorage.setItem('moneyRequests', JSON.stringify(existingRequests.slice(0, 100)));
      saved = true;
    }
    
    if (saved) {
      // Create share link
      const link = `https://sabaipay.com/pay?request=${newRequest.requestId}`;
      setRequestLink(link);
      setRequestId(newRequest.requestId);
      
      setRequestSuccessData({
        amount: formData.amount,
        contactName: newRequest.recipient_name,
        requestId: newRequest.requestId,
        note: formData.note,
        date: new Date()
      });
      
      // Show success animation
      setShowSuccessAnimation(true);
      
      // Reset form
      setFormData({
        requester_vpa: '',
        requester_name: '',
        amount: '',
        note: ''
      });
      
      // Refresh requests lists
      await Promise.all([
        loadRecentRequests(),
        loadPendingRequests()
      ]);
      
      toast.success(`Request sent to ${newRequest.recipient_name} for ₹${amount.toLocaleString()}`);
    } else {
      throw new Error('Failed to save request');
    }
    
  } catch (error) {
    console.error('Failed to submit request:', error);
    toast.error('Failed to send request. Please try again.');
  } finally {
    setLoading(false);
  }
};
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleShare = (method) => {
    const message = `💰 Please pay me ₹${formData.amount} using SabAI Pay.\n\nRequest Link: ${requestLink}\n\n${formData.note ? `Note: ${formData.note}` : ''}`;
    
    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=Money Request&body=${encodeURIComponent(message)}`);
        break;
      default:
        handleCopy(requestLink);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(1);
    } else {
      navigate(-1);
    }
  };

  const handleViewRequests = () => {
    setShowSuccessAnimation(false);
    setShowRequestsHistory(true);
  };

  const handleNewRequest = () => {
    setShowSuccessAnimation(false);
    setFormData({
      requester_vpa: '',
      requester_name: '',
      amount: '',
      note: ''
    });
    setRequestLink('');
    setRequestId('');
  };

  const handleCancelRequestFromModal = async (requestId, contact) => {
  try {
    const requests = await getMoneyRequests();
    const requestsArray = Array.isArray(requests) ? requests : [];
    const updated = requestsArray.map(r => 
      r.requestId === requestId ? { ...r, status: 'cancelled' } : r
    );
    await setMoneyRequests(updated);
    
    // Refresh the contact's transactions
    await loadContactTransactions(contact);
    
    // Also refresh global requests lists
    await Promise.all([
      loadRecentRequests(),
      loadPendingRequests()
    ]);
    
    toast.success('Request cancelled successfully');
  } catch (error) {
    console.error('Failed to cancel request:', error);
    toast.error('Failed to cancel request');
  }
};

  const handleCancelRequest = async (requestId) => {
    try {
        const requests = await getMoneyRequests();
        const requestsArray = Array.isArray(requests) ? requests : [];
        const updated = requestsArray.map(r => 
            r.requestId === requestId ? { ...r, status: 'cancelled' } : r
        );
        await setMoneyRequests(updated);
        await Promise.all([
            loadRecentRequests(),
            loadPendingRequests()
        ]);
        toast.success('Request cancelled');
    } catch (error) {
        console.error('Failed to cancel request:', error);
        toast.error('Failed to cancel request');
    }
};

  const handleResendRequest = (request) => {
    setFormData({
      requester_vpa: request.requester_vpa,
      requester_name: request.requester_name,
      amount: request.amount,
      note: request.description
    });
    setShowRequestsHistory(false);
    setTimeout(() => handleSubmit(), 500);
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="request-money-page">
      <button className="back-button" onClick={handleBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="request-money-container">
        <div className="request-money-header">
          <h1>Request Money</h1>
          <p className="subtitle">Request money from friends and family</p>
        </div>

        <div className="request-money-content">
          {/* Search/Select Contact Section */}
          <div className="search-section">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, UPI ID or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  loadAllContacts();
                  setShowContactsModal(true);
                }}
              />
            </div>
            
            {showContactsModal && searchTerm && (
              <div className="contacts-dropdown">
                {filteredContacts.filter(c => 
                  c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.vpa?.toLowerCase().includes(searchTerm.toLowerCase())
                ).slice(0, 10).map(contact => (
                  <div
                    key={contact.id}
                    className="contact-item"
                    onClick={() => handleContactClick(contact)}
                  >
                    <div className="contact-avatar" style={{ backgroundColor: contact.color || '#4f46e5' }}>
                      {contact.avatar || contact.name?.charAt(0)}
                    </div>
                    <div className="contact-info">
                      <span className="contact-name">{contact.name}</span>
                      <span className="contact-vpa">{contact.vpa || contact.phone}</span>
                    </div>
                    {contact.lastAmount && <span className="contact-amount">₹{contact.lastAmount}</span>}
                  </div>
                ))}
                <button className="close-dropdown" onClick={() => setShowContactsModal(false)}>Close</button>
              </div>
            )}
          </div>

          {/* Recent Contacts - Click opens contact modal */}
          {allContacts.length > 0 && !showContactsModal && (
            <div className="recent-section">
              <div className="section-header">
                <h3>Recent Contacts</h3>
                <button className="view-all" onClick={() => {
                  setShowContactsModal(true);
                  setSearchTerm('');
                }}>View All</button>
              </div>
              <div className="recent-contacts-scroll-container">
                <div className="recent-contacts-grid">
                  {allContacts.slice(0, 8).map(contact => (
                    <button key={contact.id} className="recent-contact" onClick={() => handleContactClick(contact)}>
                      <div className="contact-circle" style={{ backgroundColor: contact.color || '#4f46e5' }}>
                        {contact.avatar || contact.name?.charAt(0)}
                      </div>
                      <span>{contact.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Request Form */}
          <div className="request-form">
            <div className="form-group">
              <label>Request From (UPI ID / Mobile Number)</label>
              <div className="input-wrapper">
                <FaMobileAlt className="input-icon" />
                <input
                  type="text"
                  name="requester_vpa"
                  value={formData.requester_vpa}
                  onChange={handleChange}
                  placeholder="e.g., friend@okhdfcbank or 9876543210"
                  className={errors.requester_vpa ? 'error' : ''}
                />
              </div>
              {errors.requester_vpa && <span className="error-text">{errors.requester_vpa}</span>}
            </div>

            <div className="form-group">
              <label>Name (Optional)</label>
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  name="requester_name"
                  value={formData.requester_name}
                  onChange={handleChange}
                  placeholder="Enter name"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Amount (₹)</label>
              <div className="amount-wrapper">
                <span className="currency">₹</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0"
                  className={errors.amount ? 'error' : ''}
                  min="1"
                  max="100000"
                  step="1"
                />
              </div>
              {errors.amount && <span className="error-text">{errors.amount}</span>}
              
              <div className="quick-amounts">
                {quickAmounts.map(amt => (
                  <button key={amt} onClick={() => setFormData(prev => ({ ...prev, amount: amt }))}>
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Note (Optional)</label>
              <div className="input-wrapper">
                <FaEdit className="input-icon" />
                <input
                  type="text"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="What's it for? (e.g., Dinner payment, Rent)"
                  maxLength="100"
                />
              </div>
              {errors.note && <span className="error-text">{errors.note}</span>}
              <div className="note-hint">
                <span>{formData.note?.length || 0}/100 characters</span>
                <span>💡 Adding a note helps track requests</span>
              </div>
            </div>

            {/* Pending Requests Preview */}
            {pendingRequests.length > 0 && (
              <div className="pending-requests">
                <div className="section-header">
                  <h3>Pending Requests</h3>
                  <button className="view-all" onClick={() => setShowRequestsHistory(true)}>
                    View All <FaArrowRight />
                  </button>
                </div>
                <div className="pending-requests-list">
                  {pendingRequests.slice(0, 3).map(req => (
                    <div key={req.id} className="pending-request-item">
                      <div className="pending-request-info">
                        <div className="pending-avatar" style={{ backgroundColor: '#f59e0b' }}>
                          {req.requester_avatar || req.requester_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h4>{req.requester_name || req.requester_vpa}</h4>
                          <p className="pending-amount">₹{req.amount}</p>
                          <p className="pending-date">{formatDate(req.date)}</p>
                        </div>
                      </div>
                      <div className="pending-actions">
                        <button 
                          className="resend-btn"
                          onClick={() => handleResendRequest(req)}
                        >
                          Resend
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={() => handleCancelRequest(req.requestId)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? <FaSpinner className="spinner" /> : 'Request Money'} <FaArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Details Modal */}
      <AnimatePresence>
        {showContactDetailsModal && selectedContact && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowContactDetailsModal(false)}>
            <ContactDetailsModal 
  contact={selectedContact}
  onClose={() => setShowContactDetailsModal(false)}
  onRequest={handleRequestFromContactModal}
  onCancelRequest={handleCancelRequestFromModal}
  formatDate={formatDate}
  contactTransactions={contactTransactions}
  contactTotalReceived={contactTotalReceived}
/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Requests History Modal */}
      <AnimatePresence>
        {showRequestsHistory && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRequestsHistory(false)}>
            <motion.div className="requests-history-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Request History</h3>
                <button className="modal-close" onClick={() => setShowRequestsHistory(false)}><FaTimes /></button>
              </div>
              <div className="modal-body">
                {recentRequests.length === 0 ? (
                  <div className="no-requests">
                    <p>No requests yet</p>
                  </div>
                ) : (
                  <div className="requests-list-full">
                    {recentRequests.map(req => (
                      <div key={req.id} className="request-history-item">
                        <div className="request-history-info">
                          <div className="request-avatar" style={{ backgroundColor: '#4f46e5' }}>
                            {req.requester_avatar || req.requester_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <h4>{req.requester_name || req.requester_vpa}</h4>
                            <p className="request-amount">₹{req.amount}</p>
                            <p className="request-date">{formatDate(req.date)}</p>
                          </div>
                        </div>
                        <div className="request-history-actions">
                          <span className={`request-status ${req.status}`}>
                            {req.status}
                          </span>
                          {req.status === 'pending' && (
                            <>
                              <button 
                                className="resend-btn"
                                onClick={() => handleResendRequest(req)}
                              >
                                Resend
                              </button>
                              <button 
                                className="cancel-btn"
                                onClick={() => handleCancelRequest(req.requestId)}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Request Modal */}
      <AnimatePresence>
        {showShareModal && requestSuccessData && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowShareModal(false)}>
            <ShareRequestModal 
              onClose={() => setShowShareModal(false)}
              requestData={requestSuccessData}
              requestLink={requestLink}
              requestId={requestId}
              onCopy={handleCopy}
              onShare={handleShare}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PopUPI Style Success Animation */}
      <AnimatePresence>
        {showSuccessAnimation && requestSuccessData && (
          <motion.div 
            className="popupi-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RequestSuccessAnimation 
              onComplete={() => {}}
              onViewRequests={handleViewRequests}
              onNewRequest={handleNewRequest}
              requestData={requestSuccessData}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RequestMoneyPage;