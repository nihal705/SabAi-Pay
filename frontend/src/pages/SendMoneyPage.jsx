// frontend/src/pages/SendMoneyPage.jsx
// Complete with Split Payment (Fixed saving), Self Transfer (PopUPI success), Contact Modal

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * For licensing inquiries: sabaipaycontact@gmail.com
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bankAPI, agentOrderAPI, coinAPI } from '../services/apiService';
import storageService, {
    getBankAccounts,
    getBankBalances,
    updateContactAfterTransaction,
    getCoinBalance,
    getTransactions,
    getMoneyRequests,
    setMoneyRequests,
    getContacts,
    addContact,
    verifyBankPin,
    hasUpiPin,
    updateBankBalance,
    updateCoinBalance,
    addTransaction,
    refreshCurrentUserId,
} from '../services/storageService';
import { 
  FaArrowLeft, FaSearch, FaUser, FaRupeeSign, FaArrowRight,
  FaQrcode, FaCamera, FaUserCircle, FaCheckCircle, FaExclamationCircle,
  FaUniversity, FaWallet, FaTimes, FaEye, FaEyeSlash, FaLock, FaMoneyBillWave,
  FaCopy, FaInfoCircle, FaMobile, FaEnvelope, FaPhone, FaBuilding, FaTimesCircle,
  FaSpinner, FaChevronRight, FaClock, FaCalendarAlt, FaStar, FaChartLine,
  FaTrash, FaEdit, FaHistory, FaWhatsapp, FaLink, FaShare, FaSave,
  FaGooglePay, FaAmazonPay, FaApplePay, FaCreditCard as FaCreditCardIcon,
  FaEdit as FaEditIcon, FaUsers, FaUserPlus, FaPlus, FaMinus, FaFolderOpen,
  FaExchangeAlt, FaArrowUp, FaArrowDown, FaBalanceScale, FaGift, FaCopy as FaCopyIcon
} from 'react-icons/fa';
import { MdQrCodeScanner, MdVerified, MdGroups } from 'react-icons/md';
import { SiGooglepay, SiPhonepe, SiPaytm } from 'react-icons/si';
import toast from 'react-hot-toast';
import './SendMoneyPage.css';

// Helper function to get bank logo URL
const getBankLogoUrl = (bankName) => {
  const bankLogoMap = {
    'State Bank of India': 'sbi.png', 'SBI': 'sbi.png',
    'HDFC Bank': 'hdfc.png', 'HDFC': 'hdfc.png',
    'ICICI Bank': 'icici.png', 'ICICI': 'icici.png',
    'Axis Bank': 'axis.png', 'Axis': 'axis.png',
    'Bank of Baroda': 'bob.png', 'BOB': 'bob.png',
    'Punjab National Bank': 'pnb.png', 'PNB': 'pnb.png',
    'Canara Bank': 'canara.png', 'Canara': 'canara.png',
    'Union Bank of India': 'union.png', 'Union Bank': 'union.png',
    'Kotak Mahindra Bank': 'kotak.png', 'Kotak': 'kotak.png',
    'IndusInd Bank': 'indusind.png', 'IndusInd': 'indusind.png',
    'Yes Bank': 'yesbank.png', 'Yes': 'yesbank.png',
    'IDFC First Bank': 'idfc.png', 'IDFC': 'idfc.png',
    'Karnataka Bank': 'karnataka.png',
    'Indian Bank': 'indianbank.png',
    'Indian Overseas Bank': 'iob.png', 'IOB': 'iob.png',
    'Federal Bank': 'federal.png',
    'South Indian Bank': 'sib.png', 'SIB': 'sib.png'
  };
  const fileName = bankLogoMap[bankName];
  if (fileName) return `/images/banks/${fileName}`;
  return null;
};

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

// Helper function to calculate cashback (5% of amount)
// const calculateCashback = (amount) => {
//   return Math.floor(amount * 0.05);
// };

// PopUPI Style Success Animation Component
const PopUpiSuccessAnimation = ({ onComplete, transactionData, onNewPayment, onViewTransaction }) => {
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
          <FaCheckCircle />
        </motion.div>
        
        <motion.div 
          className="popupi-text"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: animationStage >= 2 ? 0 : 20, opacity: animationStage >= 2 ? 1 : 0 }}
        >
          <h2>Payment Successful!</h2>
          <p className="amount-paid">₹{transactionData?.amount?.toLocaleString()}</p>
          <p className="to-text">to {transactionData?.receiver_name || transactionData?.receiver_vpa}</p>
        </motion.div>
        
        <motion.div 
          className="popupi-details"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: animationStage >= 3 ? 'auto' : 0, opacity: animationStage >= 3 ? 1 : 0 }}
        >
          <div className="detail-item">
            <span>Transaction ID</span>
            <span className="txn-id">{transactionData?.transactionId}</span>
          </div>
          <div className="detail-item">
            <span>From</span>
            <span>{transactionData?.bank_name}</span>
          </div>
          {/* <div className="detail-item highlight">
            <span>SabAI Gems Earned</span>
            <span>+{transactionData?.cashback} 🪙</span>
          </div> */}
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
            <button className="popupi-btn primary" onClick={onViewTransaction}>
              <FaHistory /> View Transaction
            </button>
            <button className="popupi-btn secondary" onClick={onNewPayment}>
              <FaArrowRight /> New Payment
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

  // Failed Payment Modal Component
const FailedPaymentModal = ({ transactionData, onClose, onRetry }) => {
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
      className="popupi-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="popupi-animation failed"
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
            <div className="logo-inner failed">
              <FaTimesCircle style={{ fontSize: '2rem', color: '#ef4444' }} />
            </div>
            <div className="logo-ring failed"></div>
          </motion.div>
          
          <motion.div 
            className="popupi-check failed"
            initial={{ scale: 0 }}
            animate={{ scale: animationStage >= 2 ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.2 }}
          >
            <FaTimesCircle style={{ color: '#ef4444', fontSize: '2rem' }} />
          </motion.div>
          
          <motion.div 
            className="popupi-text"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: animationStage >= 2 ? 0 : 20, opacity: animationStage >= 2 ? 1 : 0 }}
          >
            <h2 style={{ color: '#ef4444' }}>Payment Failed!</h2>
            <p className="amount-paid">₹{transactionData?.amount?.toLocaleString()}</p>
            <p className="to-text">to {transactionData?.receiver_name || transactionData?.receiver_vpa}</p>
          </motion.div>
          
          <motion.div 
            className="popupi-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: animationStage >= 3 ? 'auto' : 0, opacity: animationStage >= 3 ? 1 : 0 }}
          >
            <div className="detail-item">
              <span>Transaction ID</span>
              <span className="txn-id">{transactionData?.transactionId}</span>
            </div>
            <div className="detail-item">
              <span>From</span>
              <span>{transactionData?.bank_name}</span>
            </div>
            <div className="detail-item highlight failed">
              <span>Failure Reason</span>
              <span style={{ color: '#ef4444' }}>{transactionData?.failure_reason || 'Insufficient balance'}</span>
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
              <button className="popupi-btn primary" onClick={onRetry}>
                <FaArrowRight /> Try Again
              </button>
              <button className="popupi-btn secondary" onClick={onClose}>
                Close
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Split Success Modal
const SplitSuccessModal = ({ onClose, splitData }) => {
  return (
    <motion.div 
      className="split-success-modal"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
    >
      <div className="split-success-icon">
        <FaCheckCircle />
      </div>
      <h3>Split Request Created!</h3>
      <p>Total Amount: <strong>₹{splitData?.totalAmount?.toLocaleString()}</strong></p>
      <p>Split among <strong>{splitData?.splits?.length}</strong> people</p>
      <div className="split-success-preview">
        {splitData?.splits?.filter(s => !s.isSelf && s.amount > 0).map((split, idx) => (
          <div key={idx} className="split-success-item">
            <span>{split.contact?.name || split.contact?.name}</span>
            <span>₹{split.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <button className="split-success-btn" onClick={onClose}>Done</button>
    </motion.div>
  );
};

// Contact Details Modal (Similar to Dashboard)
const ContactDetailsModal = ({ contact, onClose, onPay, onRequest, formatDate, contactTransactions, contactTotalReceived }) => {
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
        </div>
        <div className="contact-actions-large">
          <button className="contact-pay-btn-large" onClick={() => onPay(contact)}>
            <FaMoneyBillWave /> Pay
          </button>
          <button className="contact-request-btn-large" onClick={() => onRequest(contact)}>
            <FaArrowDown /> Request
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
                  {tx.type === 'sent' ? <FaArrowUp className="sent" /> : <FaArrowDown className="received" />}
                </div>
                <div className="transaction-info">
                  <p className="transaction-desc">{tx.description || 'Payment'}</p>
                  <p className="transaction-date">{formatDate(tx.date)}</p>
                </div>
                <div className="transaction-amount">
                  <span className={tx.type === 'sent' ? 'amount-sent' : 'amount-received'}>
                    {tx.type === 'sent' ? '-' : '+'}₹{tx.amount}
                  </span>
                </div>
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

// Split Payment Component with Fixed Saving
const SplitPaymentModal = ({ onClose, onSplitComplete, contacts, user, bankBalances, linkedBanks }) => {
  const [step, setStep] = useState(1);
  const [totalAmount, setTotalAmount] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customAmounts, setCustomAmounts] = useState({});
  const [customPercentages, setCustomPercentages] = useState({});
  const [groupName, setGroupName] = useState('');
  const [savedGroups, setSavedGroups] = useState([]);
  const [showGroupSelect, setShowGroupSelect] = useState(false);
  const [splitNote, setSplitNote] = useState('');
  const [showSplitSuccess, setShowSplitSuccess] = useState(false);
  const [createdSplitData, setCreatedSplitData] = useState(null);
  
  const userSelf = {
    id: 'self',
    name: user?.name || 'You',
    vpa: user?.phone_number ? `${user.phone_number}@sabai` : 'self@sabai',
    avatar: user?.name?.charAt(0) || 'Y',
    color: '#1eac2a',
    isSelf: true
  };
  
  // Load saved groups on mount
  useEffect(() => {
    const groups = JSON.parse(localStorage.getItem('splitGroups') || '[]');
    setSavedGroups(groups);
  }, []);
  
  const filteredContacts = contacts.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.vpa?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const allParticipants = [userSelf, ...selectedContacts];
  
  const toggleContact = (contact) => {
    if (selectedContacts.find(c => c.id === contact.id)) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
      const newAmounts = { ...customAmounts };
      const newPercentages = { ...customPercentages };
      delete newAmounts[contact.id];
      delete newPercentages[contact.id];
      setCustomAmounts(newAmounts);
      setCustomPercentages(newPercentages);
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };
  
  const calculateSplit = () => {
    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact to split with');
      return;
    }
    
    let splits = [];
    let selfAmount = 0;
    
    if (splitType === 'equal') {
      const perPerson = amount / (selectedContacts.length + 1);
      selfAmount = perPerson;
      splits = selectedContacts.map(contact => ({
        contact,
        amount: perPerson,
        percentage: (perPerson / amount) * 100
      }));
    } else if (splitType === 'custom') {
      let totalCustom = 0;
      splits = selectedContacts.map(contact => {
        const customAmount = parseFloat(customAmounts[contact.id] || 0);
        totalCustom += customAmount;
        return {
          contact,
          amount: customAmount,
          percentage: (customAmount / amount) * 100
        };
      });
      selfAmount = amount - totalCustom;
      if (selfAmount < 0) {
        toast.error(`Total amount allocated exceeds ₹${amount.toFixed(2)}`);
        return;
      }
    } else if (splitType === 'percentage') {
      let totalPercentage = 0;
      splits = selectedContacts.map(contact => {
        const percentage = parseFloat(customPercentages[contact.id] || 0);
        totalPercentage += percentage;
        return {
          contact,
          amount: (percentage / 100) * amount,
          percentage: percentage
        };
      });
      selfAmount = amount - splits.reduce((sum, s) => sum + s.amount, 0);
    }
    
    const allSplits = [
      {
        contact: userSelf,
        amount: selfAmount,
        percentage: (selfAmount / amount) * 100,
        isSelf: true
      },
      ...splits
    ];
    
    const splitRequestId = `SPLIT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const splitRequestData = {
      id: splitRequestId,
      type: splitType,
      totalAmount: amount,
      splits: allSplits,
      groupName: groupName || 'Split Payment',
      note: splitNote,
      createdBy: userSelf.name,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // Save split request to localStorage
    const existingRequests = JSON.parse(localStorage.getItem('splitRequests') || '[]');
    existingRequests.unshift(splitRequestData);
    localStorage.setItem('splitRequests', JSON.stringify(existingRequests.slice(0, 50)));
    
    // Save group if name provided
    if (groupName) {
      const groups = JSON.parse(localStorage.getItem('splitGroups') || '[]');
      const existingGroupIndex = groups.findIndex(g => g.name === groupName);
      const groupData = {
        id: existingGroupIndex !== -1 ? groups[existingGroupIndex].id : Date.now(),
        name: groupName,
        contacts: selectedContacts,
        splitType: splitType,
        customAmounts: customAmounts,
        customPercentages: customPercentages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (existingGroupIndex !== -1) {
        groups[existingGroupIndex] = groupData;
      } else {
        groups.push(groupData);
      }
      localStorage.setItem('splitGroups', JSON.stringify(groups));
      toast.success(`Group "${groupName}" saved!`);
    }
    
    // For each participant, create a money request
    allSplits.forEach(split => {
      if (!split.isSelf && split.amount > 0) {
        const moneyRequest = {
          id: Date.now() + Math.random(),
          requestId: `REQ${Date.now()}${Math.floor(Math.random() * 1000)}`,
          amount: split.amount,
          description: `${splitNote || groupName || 'Split payment'} - Your share`,
          requester_vpa: split.contact.vpa,
          requester_name: split.contact.name,
          requester_avatar: split.contact.avatar,
          date: new Date().toISOString(),
          status: 'pending',
          splitId: splitRequestId,
          totalAmount: totalAmount,
          groupName: groupName
        };
        
        const moneyRequests = JSON.parse(localStorage.getItem('moneyRequests') || '[]');
        moneyRequests.unshift(moneyRequest);
        localStorage.setItem('moneyRequests', JSON.stringify(moneyRequests.slice(0, 100)));
      }
    });
    
    setCreatedSplitData(splitRequestData);
    setShowSplitSuccess(true);
  };
  
  const updateCustomAmount = (contactId, value) => {
    setCustomAmounts(prev => ({ ...prev, [contactId]: value }));
  };
  
  const updateCustomPercentage = (contactId, value) => {
    const percentage = parseFloat(value);
    if (percentage > 100) {
      toast.error('Percentage cannot exceed 100%');
      return;
    }
    setCustomPercentages(prev => ({ ...prev, [contactId]: value }));
  };
  
  const loadSavedGroups = () => {
    const groups = JSON.parse(localStorage.getItem('splitGroups') || '[]');
    setSavedGroups(groups);
    setShowGroupSelect(true);
  };
  
  const loadGroup = (group) => {
    setGroupName(group.name);
    setSelectedContacts(group.contacts);
    setSplitType(group.splitType);
    setCustomAmounts(group.customAmounts || {});
    setCustomPercentages(group.customPercentages || {});
    setShowGroupSelect(false);
    toast.success(`Loaded group: ${group.name}`);
  };
  
  const getTotalAllocated = () => {
    const amount = parseFloat(totalAmount);
    if (isNaN(amount)) return 0;
    let total = 0;
    selectedContacts.forEach(contact => {
      total += parseFloat(customAmounts[contact.id] || 0);
    });
    return total;
  };
  
  const getRemainingAmount = () => {
    const amount = parseFloat(totalAmount);
    if (isNaN(amount)) return 0;
    return amount - getTotalAllocated();
  };
  
  const getRemainingPercentage = () => {
    let total = 0;
    selectedContacts.forEach(contact => {
      total += parseFloat(customPercentages[contact.id] || 0);
    });
    return 100 - total;
  };
  
  const handleSplitSuccessClose = () => {
    setShowSplitSuccess(false);
    onSplitComplete(createdSplitData);
    onClose();
  };
  
  return (
    <>
      <div className="split-modal">
        <div className="split-modal-header">
          <h3>Split Payment</h3>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        
        <div className="split-modal-body">
          {step === 1 && (
            <>
              <div className="form-group">
                <label>Total Amount (₹)</label>
                <div className="amount-wrapper">
                  <span className="currency">₹</span>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="Enter total bill amount"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Split Type</label>
                <div className="split-type-buttons">
                  <button className={`split-type-btn ${splitType === 'equal' ? 'active' : ''}`} onClick={() => setSplitType('equal')}>
                    <FaBalanceScale /> Equal
                  </button>
                  <button className={`split-type-btn ${splitType === 'custom' ? 'active' : ''}`} onClick={() => setSplitType('custom')}>
                    <FaEdit /> Custom Amount
                  </button>
                  <button className={`split-type-btn ${splitType === 'percentage' ? 'active' : ''}`} onClick={() => setSplitType('percentage')}>
                    <FaChartLine /> Percentage
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>Group Name (Optional)</label>
                <div className="group-input-wrapper">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., Dinner with Friends, Trip Expenses"
                  />
                  <button className="save-group-btn" onClick={loadSavedGroups}>
                    <FaFolderOpen /> Load Group
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>Note (Optional)</label>
                <textarea
                  value={splitNote}
                  onChange={(e) => setSplitNote(e.target.value)}
                  placeholder="Add a note about this split (e.g., Dinner at Restaurant, Movie tickets)"
                  rows={2}
                  className="form-input"
                />
              </div>
              
              <button className="next-btn" onClick={() => setStep(2)} disabled={!totalAmount}>
                Next <FaArrowRight />
              </button>
            </>
          )}
          
          {step === 2 && (
            <>
              <div className="split-summary">
                <div className="summary-header">
                  <span>Total Bill: ₹{parseFloat(totalAmount || 0).toLocaleString()}</span>
                  <span>{selectedContacts.length + 1} people including you</span>
                </div>
                {splitType === 'equal' && totalAmount && (
                  <div className="per-person">
                    Each person pays: ₹{(parseFloat(totalAmount) / (selectedContacts.length + 1)).toLocaleString()}
                  </div>
                )}
                {splitType === 'custom' && totalAmount && (
                  <div className="per-person">
                    You pay: ₹{getRemainingAmount().toLocaleString()} (remaining)
                  </div>
                )}
                {splitType === 'percentage' && totalAmount && (
                  <div className="per-person">
                    You pay: {getRemainingPercentage().toFixed(1)}% (₹{((getRemainingPercentage() / 100) * parseFloat(totalAmount)).toLocaleString()})
                  </div>
                )}
              </div>
              
              <div className="search-contacts-split">
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search contacts to add..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="contacts-list-split">
                {filteredContacts.map(contact => (
                  <div key={contact.id} className={`contact-split-item ${selectedContacts.find(c => c.id === contact.id) ? 'selected' : ''}`}>
                    <div className="contact-info-left">
                      <div className="contact-avatar-small" style={{ backgroundColor: contact.color || '#4f46e5' }}>
                        {contact.avatar || contact.name?.charAt(0)}
                      </div>
                      <div>
                        <span className="contact-name">{contact.name}</span>
                        <span className="contact-vpa-small">{contact.vpa}</span>
                      </div>
                    </div>
                    <div className="contact-split-actions">
                      {selectedContacts.find(c => c.id === contact.id) && (
                        <>
                          {splitType === 'custom' && (
                            <div className="custom-amount-input">
                              <span>₹</span>
                              <input
                                type="number"
                                value={customAmounts[contact.id] || ''}
                                onChange={(e) => updateCustomAmount(contact.id, e.target.value)}
                                placeholder="Amount"
                              />
                            </div>
                          )}
                          {splitType === 'percentage' && (
                            <div className="custom-amount-input">
                              <input
                                type="number"
                                value={customPercentages[contact.id] || ''}
                                onChange={(e) => updateCustomPercentage(contact.id, e.target.value)}
                                placeholder="%"
                                style={{ width: '60px' }}
                              />
                              <span>%</span>
                            </div>
                          )}
                        </>
                      )}
                      <button 
                        className={`select-contact-btn ${selectedContacts.find(c => c.id === contact.id) ? 'selected' : ''}`}
                        onClick={() => toggleContact(contact)}
                      >
                        {selectedContacts.find(c => c.id === contact.id) ? <FaCheckCircle /> : <FaUserPlus />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Split Preview */}
              {allParticipants.length > 0 && totalAmount && (
                <div className="split-preview">
                  <h4>Split Preview</h4>
                  <div className="preview-list">
                    {allParticipants.map((participant, idx) => {
                      let amount = 0;
                      let percentage = 0;
                      if (splitType === 'equal') {
                        amount = parseFloat(totalAmount) / allParticipants.length;
                        percentage = (amount / parseFloat(totalAmount)) * 100;
                      } else if (splitType === 'custom') {
                        if (participant.isSelf) {
                          amount = getRemainingAmount();
                        } else {
                          amount = parseFloat(customAmounts[participant.id] || 0);
                        }
                        percentage = (amount / parseFloat(totalAmount)) * 100;
                      } else {
                        if (participant.isSelf) {
                          percentage = getRemainingPercentage();
                        } else {
                          percentage = parseFloat(customPercentages[participant.id] || 0);
                        }
                        amount = (percentage / 100) * parseFloat(totalAmount);
                      }
                      return (
                        <div key={participant.id || idx} className="preview-item">
                          <div className="preview-avatar" style={{ backgroundColor: participant.color || '#1eac2a' }}>
                            {participant.avatar || participant.name?.charAt(0)}
                          </div>
                          <div className="preview-info">
                            <span className="preview-name">{participant.name} {participant.isSelf && '(You)'}</span>
                            <span className="preview-amount">₹{amount.toLocaleString()}</span>
                          </div>
                          <span className="preview-percentage">{percentage.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="split-actions">
                <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button className="btn-primary" onClick={calculateSplit} disabled={selectedContacts.length === 0}>
                  Create Split Request
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Group Selection Modal */}
        <AnimatePresence>
          {showGroupSelect && (
            <div className="group-select-overlay" onClick={() => setShowGroupSelect(false)}>
              <div className="group-select-modal" onClick={e => e.stopPropagation()}>
                <div className="group-select-header">
                  <h4>Saved Groups</h4>
                  <button onClick={() => setShowGroupSelect(false)}><FaTimes /></button>
                </div>
                <div className="group-select-list">
                  {savedGroups.length === 0 ? (
                    <p className="no-groups">No saved groups yet</p>
                  ) : (
                    savedGroups.map(group => (
                      <div key={group.id} className="group-item" onClick={() => loadGroup(group)}>
                        <div className="group-icon"><MdGroups /></div>
                        <div className="group-info">
                          <span className="group-name">{group.name}</span>
                          <span className="group-members">{group.contacts.length} members</span>
                        </div>
                        <FaChevronRight />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Split Success Modal */}
      <AnimatePresence>
        {showSplitSuccess && createdSplitData && (
          <div className="modal-overlay" onClick={handleSplitSuccessClose}>
            <SplitSuccessModal 
              splitData={createdSplitData}
              onClose={handleSplitSuccessClose}
            />
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// Self Transfer Component with PopUPI Success
// Self Transfer Component with PopUPI Success and Failed Modals
const SelfTransferModal = ({ onClose, onTransferComplete, linkedBanks, bankBalances, updateBankBalance, hasUpiPin, verifyBankPin }) => {
  const [step, setStep] = useState(1);
  const [fromBank, setFromBank] = useState(null);
  const [toBank, setToBank] = useState(null);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinFilled, setPinFilled] = useState([false, false, false, false]);
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [failedData, setFailedData] = useState(null);
  const pinInputRefs = useRef([]);
  
  const availableBanks = linkedBanks.filter(b => hasUpiPin(b.id));
  
  const handlePinChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value || '';
    setPin(newPin);
    const newFilled = [...pinFilled];
    newFilled[index] = value !== '';
    setPinFilled(newFilled);
    if (value && index < 3) pinInputRefs.current[index + 1]?.focus();
  };
  
  const handleTransfer = () => {
    const pinString = pin.join('');
    if (pinString.length !== 4) {
      setPinError('Please enter complete PIN');
      return;
    }
    if (!verifyBankPin(fromBank.id, pinString)) {
      setPinError('Incorrect PIN. Please try again.');
      setPin(['', '', '', '']);
      setPinFilled([false, false, false, false]);
      pinInputRefs.current[0]?.focus();
      return;
    }
    
    const transferAmount = parseFloat(amount);
    
    setLoading(true);
    
    setTimeout(() => {
      try {
        // Check balance DURING processing (not before)
        const currentBalance = bankBalances[fromBank.id] || 0;
        const availableBalance = currentBalance;
        
        // If insufficient balance, record failed transaction and show failed modal
        if (transferAmount > currentBalance) {
          const failureReason = `Insufficient balance in ${fromBank.bank_name}`;
          
          // Create failed transaction record
          const failedTransaction = {
            id: Date.now(),
            transactionId: `TRF_FAILED_${Date.now()}`,
            type: 'self_transfer',
            amount: transferAmount,
            description: `Self transfer from ${fromBank.bank_name} to ${toBank.bank_name} - FAILED`,
            from_bank: fromBank.bank_name,
            to_bank: toBank.bank_name,
            date: new Date().toISOString(),
            status: 'failed',
            failure_reason: failureReason,
            available_balance: availableBalance
          };
          
          const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
          transactions.unshift(failedTransaction);
          localStorage.setItem('transactions', JSON.stringify(transactions.slice(0, 200)));
          
          setFailedData({
            amount: transferAmount,
            fromBank: fromBank.bank_name,
            toBank: toBank.bank_name,
            transactionId: failedTransaction.transactionId,
            failure_reason: failureReason
          });
          
          setLoading(false);
          setShowFailedModal(true);
          
          return;
        }
        
        // Process successful transfer
        // Update balances
        const balances = JSON.parse(localStorage.getItem('bankBalances') || '{}');
        balances[fromBank.id] = (balances[fromBank.id] || 0) - transferAmount;
        balances[toBank.id] = (balances[toBank.id] || 0) + transferAmount;
        localStorage.setItem('bankBalances', JSON.stringify(balances));
        updateBankBalance(fromBank.id, transferAmount);
        
        // Save transaction
        const transactionId = `TRF${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const transaction = {
          id: Date.now(),
          transactionId: transactionId,
          type: 'self_transfer',
          amount: transferAmount,
          description: `Self transfer from ${fromBank.bank_name} to ${toBank.bank_name}`,
          from_bank: fromBank.bank_name,
          to_bank: toBank.bank_name,
          date: new Date().toISOString(),
          status: 'success'
        };
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        transactions.unshift(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions.slice(0, 200)));
        
        setSuccessData({
          amount: transferAmount,
          fromBank: fromBank.bank_name,
          toBank: toBank.bank_name,
          transactionId: transactionId,
          date: new Date()
        });
        setShowSuccess(true);
        setLoading(false);
        
      } catch (error) {
        console.error('Transfer error:', error);
        toast.error('Transfer failed. Please try again.');
        setLoading(false);
      }
    }, 1000);
  };
  
  const handleSuccessClose = () => {
    setShowSuccess(false);
    onTransferComplete(successData);
    onClose();
  };
  
  const getBankLogoComponent = (bank) => {
    const logoUrl = getBankLogoUrl(bank.bank_name);
    if (logoUrl) {
      return <img src={logoUrl} alt={bank.bank_name} className="bank-logo-img" />;
    }
    return <span className="bank-logo-fallback">🏦</span>;
  };
  
  // Self Transfer Failed Modal Component (inside SelfTransferModal)
  const SelfTransferFailedModal = ({ transactionData, onClose, onRetry }) => {
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
        className="popupi-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="popupi-animation failed"
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
              <div className="logo-inner failed">
                <FaTimesCircle style={{ fontSize: '2rem', color: '#ef4444' }} />
              </div>
              <div className="logo-ring failed"></div>
            </motion.div>
            
            <motion.div 
              className="popupi-check failed"
              initial={{ scale: 0 }}
              animate={{ scale: animationStage >= 2 ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.2 }}
            >
              <FaTimesCircle style={{ color: '#ef4444', fontSize: '2rem' }} />
            </motion.div>
            
            <motion.div 
              className="popupi-text"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: animationStage >= 2 ? 0 : 20, opacity: animationStage >= 2 ? 1 : 0 }}
            >
              <h2 style={{ color: '#ef4444' }}>Transfer Failed!</h2>
              <p className="amount-paid">₹{transactionData?.amount?.toLocaleString()}</p>
              <p className="to-text">from {transactionData?.fromBank} to {transactionData?.toBank}</p>
            </motion.div>
            
            <motion.div 
              className="popupi-details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: animationStage >= 3 ? 'auto' : 0, opacity: animationStage >= 3 ? 1 : 0 }}
            >
              <div className="detail-item">
                <span>Transaction ID</span>
                <span className="txn-id">{transactionData?.transactionId}</span>
              </div>
              <div className="detail-item highlight failed">
                <span>Failure Reason</span>
                <span style={{ color: '#ef4444' }}>{transactionData?.failure_reason || 'Insufficient balance'}</span>
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
                <button className="popupi-btn primary" onClick={onRetry}>
                  <FaArrowRight /> Try Again
                </button>
                <button className="popupi-btn secondary" onClick={onClose}>
                  Close
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };
  
  return (
    <>
      <div className="self-transfer-modal">
        <div className="self-transfer-header">
          <h3>Self Transfer</h3>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        
        <div className="self-transfer-body">
          {step === 1 && (
            <>
              <div className="transfer-direction">
                <div className="from-section">
                  <label>From Account</label>
                  <div className="bank-selector">
                    {availableBanks.map(bank => (
                      <div key={bank.id} className={`bank-option-transfer ${fromBank?.id === bank.id ? 'selected' : ''}`} onClick={() => setFromBank(bank)}>
                        <div className="bank-icon-small">{getBankLogoComponent(bank)}</div>
                        <div className="bank-info-small">
                          <strong>{bank.bank_name}</strong>
                          <span>xxxx{bank.account_number.slice(-4)}</span>
                        </div>
                        {fromBank?.id === bank.id && <FaCheckCircle className="selected-icon" />}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="transfer-arrow">
                  <FaArrowDown />
                </div>
                
                <div className="to-section">
                  <label>To Account</label>
                  <div className="bank-selector">
                    {availableBanks.filter(b => b.id !== fromBank?.id).map(bank => (
                      <div key={bank.id} className={`bank-option-transfer ${toBank?.id === bank.id ? 'selected' : ''}`} onClick={() => setToBank(bank)}>
                        <div className="bank-icon-small">{getBankLogoComponent(bank)}</div>
                        <div className="bank-info-small">
                          <strong>{bank.bank_name}</strong>
                          <span>xxxx{bank.account_number.slice(-4)}</span>
                        </div>
                        {toBank?.id === bank.id && <FaCheckCircle className="selected-icon" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label>Amount (₹)</label>
                <div className="amount-wrapper">
                  <span className="currency">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <button className="next-btn" onClick={() => setStep(2)} disabled={!fromBank || !toBank || !amount}>
                Next <FaArrowRight />
              </button>
            </>
          )}
          
          {step === 2 && (
            <>
              <div className="transfer-summary">
                <div className="summary-row">
                  <span>Amount</span>
                  <strong>₹{parseFloat(amount || 0).toLocaleString()}</strong>
                </div>
                <div className="summary-row">
                  <span>From</span>
                  <span>{fromBank?.bank_name} (xxxx{fromBank?.account_number.slice(-4)})</span>
                </div>
                <div className="summary-row">
                  <span>To</span>
                  <span>{toBank?.bank_name} (xxxx{toBank?.account_number.slice(-4)})</span>
                </div>
              </div>
              
              <div className="pin-input-group">
                <label>Enter UPI PIN for {fromBank?.bank_name}</label>
                <div className="pin-inputs">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => pinInputRefs.current[index] = el}
                      type={showPin ? 'text' : 'password'}
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      className={pinFilled[index] ? 'filled' : ''}
                      autoFocus={index === 0}
                      inputMode="numeric"
                    />
                  ))}
                </div>
                <label className="show-pin">
                  <input type="checkbox" checked={showPin} onChange={() => setShowPin(!showPin)} />
                  Show PIN
                </label>
                {pinError && <p className="pin-error">{pinError}</p>}
              </div>
              
              <div className="transfer-actions">
                <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button className="btn-primary" onClick={handleTransfer} disabled={loading}>
                  {loading ? <FaSpinner className="spinner" /> : `Transfer ₹${parseFloat(amount || 0).toLocaleString()}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Self Transfer Success Modal - PopUPI Style */}
      <AnimatePresence>
        {showSuccess && successData && (
          <motion.div 
            className="popupi-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="popupi-animation"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="popupi-content">
                <div className="popupi-logo">
                  <div className="logo-inner">
                    <FaExchangeAlt style={{ fontSize: '2rem', color: '#1eac2a' }} />
                  </div>
                </div>
                <div className="popupi-check">
                  <FaCheckCircle />
                </div>
                <div className="popupi-text">
                  <h2>Transfer Successful!</h2>
                  <p className="amount-paid">₹{successData.amount.toLocaleString()}</p>
                  <p className="to-text">from {successData.fromBank} to {successData.toBank}</p>
                </div>
                <div className="popupi-details">
                  <div className="detail-item">
                    <span>Transaction ID</span>
                    <span className="txn-id">{successData.transactionId}</span>
                  </div>
                  <div className="detail-item">
                    <span>Date & Time</span>
                    <span>{new Date().toLocaleString()}</span>
                  </div>
                </div>
                <div className="popupi-options">
                  <button className="popupi-btn primary" onClick={handleSuccessClose}>
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Self Transfer Failed Modal */}
      <AnimatePresence>
        {showFailedModal && failedData && (
          <SelfTransferFailedModal
            transactionData={failedData}
            onClose={() => {
              setShowFailedModal(false);
              setFailedData(null);
              onClose(); // Close the transfer modal
            }}
            onRetry={() => {
              setShowFailedModal(false);
              setFailedData(null);
              setStep(1);
              setFromBank(null);
              setToBank(null);
              setAmount('');
              setPin(['', '', '', '']);
              setPinFilled([false, false, false, false]);
              setPinError('');
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// QR Scanner Component
const QRScannerComponent = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(true);
  
  const simulateScan = () => {
    const mockQRCodes = [
      'upi://pay?pa=merchant@okhdfcbank&pn=Merchant Store&am=500&tn=Payment for order',
      'upi://pay?pa=shopkeeper@ybl&pn=Shop Keeper&am=1200&tn=Bill payment',
    ];
    const randomQR = mockQRCodes[Math.floor(Math.random() * mockQRCodes.length)];
    setScanning(false);
    setTimeout(() => {
      onScan(randomQR);
      onClose();
    }, 1500);
  };
  
  return (
    <div className="scanner-container">
      <div className="scanner-viewport">
        {scanning ? (
          <>
            <div className="scanner-overlay">
              <div className="scanner-frame">
                <div className="scanner-line"></div>
              </div>
            </div>
            <div className="scanner-message">
              <p>Position QR code within the frame</p>
            </div>
          </>
        ) : (
          <div className="scanner-result">
            <FaCheckCircle />
            <p>QR Code Scanned!</p>
          </div>
        )}
      </div>
      <div className="scanner-actions">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={simulateScan}>Simulate Scan</button>
      </div>
    </div>
  );
};

const SendMoneyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showSelfTransferModal, setShowSelfTransferModal] = useState(false);
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [recentContacts, setRecentContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [bankBalances, setBankBalances] = useState({});
  const [successData, setSuccessData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [cashbackEarned, setCashbackEarned] = useState(0);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [noteFocused, setNoteFocused] = useState(false);
  const [contacts, setContacts] = useState([]); 
  const [paymentMode, setPaymentMode] = useState('single');
  const [showRequestModal, setShowRequestModal] = useState(false);
const [requestAmount, setRequestAmount] = useState('');
const [requestNote, setRequestNote] = useState('');
const [requestLoading, setRequestLoading] = useState(false);
const [showRequestSuccessModal, setShowRequestSuccessModal] = useState(false);
const [requestSuccessData, setRequestSuccessData] = useState(null);
  
  // Contact modal state
  const [selectedContact, setSelectedContact] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false); 
  const [showContactDetailsModal, setShowContactDetailsModal] = useState(false);
  const [contactTransactions, setContactTransactions] = useState([]);
  const [contactTotalReceived, setContactTotalReceived] = useState(0);
  
  // Payment states
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [selectedBankForPay, setSelectedBankForPay] = useState(null);
  const [payStep, setPayStep] = useState(1);
  const [payPinDigits, setPayPinDigits] = useState(['', '', '', '']);
  const [payPinFilled, setPayPinFilled] = useState([false, false, false, false]);
  const [payPinError, setPayPinError] = useState('');
  const [showPayPin, setShowPayPin] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [showFailedAnimation, setShowFailedAnimation] = useState(false);
  const [failedTransactionResult, setFailedTransactionResult] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    receiver_vpa: location.state?.contact?.vpa || '',
    receiver_name: location.state?.contact?.name || '',
    receiver_avatar: location.state?.contact?.avatar || '',
    amount: '',
    note: ''
  });
  const [errors, setErrors] = useState({});
  
  // PIN states
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinFilled, setPinFilled] = useState([false, false, false, false]);
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const pinInputRefs = useRef([]);

  // Load data on mount
  useEffect(() => {
    loadLinkedBanks();
    loadRecentContacts();
    loadContacts();
    loadBankBalances();
  }, []);

  // Filter contacts when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = recentContacts.filter(contact => 
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.vpa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.includes(searchTerm)
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(recentContacts);
    }
  }, [searchTerm, recentContacts]);

  // Calculate cashback when amount changes
  useEffect(() => {
    const amount = parseFloat(formData.amount);
    if (!isNaN(amount) && amount > 0) {
      setCashbackEarned(Math.floor(amount * 0.05));
    } else {
      setCashbackEarned(0);
    }
  }, [formData.amount]);

  // REPLACE loadLinkedBanks
const loadLinkedBanks = async () => {
    try {
        const response = await bankAPI.getAccounts();
        if (response.data.success) {
            setLinkedBanks(response.data.data);
            const primary = response.data.data.find(acc => acc.is_primary);
            if (primary) setSelectedBank(primary);
        }
    } catch (error) {
        console.error('Failed to load banks:', error);
    }
};

// Replace loadBankBalances
const loadBankBalances = async () => {
    try {
        const accounts = linkedBanks;
        const balancesMap = {};
        for (const account of accounts) {
            try {
                const response = await bankAPI.getBalance(account.id);
                if (response.data.success) {
                    balancesMap[account.id] = response.data.data.balance;
                }
            } catch (err) {
                console.error(`Failed to load balance for account ${account.id}:`, err);
                balancesMap[account.id] = 0;
            }
        }
        setBankBalances(balancesMap);
    } catch (error) {
        console.error('Failed to load balances:', error);
    }
};

const loadContacts = async () => {
    try {
        const contactsList = await getContacts();
        console.log('Loaded contacts:', contactsList); // Debug log
        setContacts(contactsList);
        
        // Also update recent contacts for the people section
        const sortedContacts = [...contactsList].sort((a, b) => 
            new Date(b.last_transaction) - new Date(a.last_transaction)
        );
        setRecentContacts(sortedContacts.slice(0, 10));
    } catch (error) {
        console.error('Failed to load contacts:', error);
    }
};

// Replace loadRecentContacts
const loadRecentContacts = async () => {
    try {
        const contactsList = await getContacts();
        const sorted = [...contactsList].sort((a, b) => 
            new Date(b.last_transaction) - new Date(a.last_transaction)
        );
        setRecentContacts(sorted.slice(0, 10));
    } catch (error) {
        console.error('Failed to load recent contacts:', error);
    }
};

// In SendMoneyPage.jsx, add this function after loadRecentContacts:

const loadContactTransactions = async (contact) => {
    try {
        const allTransactions = await getTransactions();
        
        // Filter ALL send transactions to this contact (successful ones)
        const sentTransactions = allTransactions.filter(tx => 
            (tx.type === 'send' || tx.type === 'sent') && 
            tx.receiver_vpa === contact.vpa && 
            tx.status === 'success'
        );
        
        console.log('Sent transactions found:', sentTransactions.length);
        
        // Map to transaction items for display
        const contactTx = sentTransactions.map(tx => ({
            id: tx.id,
            amount: Number(tx.amount), // Convert to number
            date: tx.date,
            type: 'sent',
            description: tx.description,
            transactionId: tx.transactionId,
            status: tx.status
        }));
        
        contactTx.sort((a, b) => new Date(b.date) - new Date(a.date));
        setContactTransactions(contactTx);
        
        // Calculate total sent using Number() to ensure numeric addition
        let totalSent = 0;
        sentTransactions.forEach(tx => {
            totalSent += Number(tx.amount);
        });
        
        console.log('Total sent calculated:', totalSent);
        
        // Update the selected contact with correct totals
        setSelectedContact(prev => ({
            ...prev,
            totalSent: totalSent,
            transactionCount: sentTransactions.length
        }));
        
        setContactTotalReceived(contact.totalReceived || 0);
        
    } catch (error) {
        console.error('Failed to load contact transactions:', error);
        setContactTransactions([]);
        setContactTotalReceived(0);
    }
};
// REPLACE getBankBalance
const getBankBalance = (bankId) => {
    const balances = getBankBalances();
    return balances[bankId] || 0;
};

// REPLACE hasUpiPin
const hasUpiPinFunc = (bankId) => hasUpiPin(bankId);

// REPLACE verifyBankPin
const verifyBankPinFunc = (bankId, enteredPin) => verifyBankPin(bankId, enteredPin);

// REPLACE updateBankBalance
const updateBankBalanceFunc = (bankId, amount) => {
    const newBalance = updateBankBalance(bankId, amount, true);
    setBankBalances(prev => ({ ...prev, [bankId]: newBalance }));
    return newBalance;
};

// REPLACE updateCoinBalance
const updateCoinBalanceFunc = (cashback) => {
    const newBalance = updateCoinBalance(cashback, true);
    return newBalance;
};

// REPLACE saveTransaction
const saveTransactionFunc = (txnData) => {
    const newTransaction = {
        transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
        type: 'sent',
        amount: txnData.amount,
        description: txnData.note || `Payment to ${txnData.receiver_name || txnData.receiver_vpa}`,
        merchant: txnData.receiver_name || txnData.receiver_vpa,
        receiver_vpa: txnData.receiver_vpa,
        receiver_name: txnData.receiver_name,
        bank_name: txnData.bank_name,
        bank_id: txnData.bank_id,
        account_suffix: txnData.account_suffix,
        date: new Date().toISOString(),
        status: 'success',
        cashback: txnData.cashback || 0,
        gems_used: txnData.gems_used || false,
        gems_amount: txnData.gems_amount || 0
    };
    addTransaction(newTransaction);
    updateContactsFunc(txnData);
    return newTransaction;
};

// REPLACE updateContacts
const updateContactsFunc = (txnData) => {
    const contact = {
        name: txnData.receiver_name || txnData.receiver_vpa.split('@')[0],
        vpa: txnData.receiver_vpa,
        phone: txnData.receiver_vpa.replace('@', '').replace(/\D/g, ''),
        avatar: txnData.receiver_name?.charAt(0) || txnData.receiver_vpa.charAt(0),
        color: getContactColor(txnData.receiver_name || txnData.receiver_vpa),
        lastTransaction: 'Just now',
        lastAmount: txnData.amount,
        transactionCount: 1,
        totalSent: txnData.amount
    };
    addContact(contact);
    loadRecentContacts();
};

  // Handle contact click - open details modal
const handleContactClick = async (contact) => {
    console.log('Contact clicked:', contact);
    
    try {
        const latestContacts = await getContacts();
        const latestContact = latestContacts.find(c => c.id === contact.id || c.vpa === contact.vpa);
        
        if (latestContact) {
            setSelectedContact(latestContact);
            await loadContactTransactions(latestContact);
            setShowContactModal(true);  // This opens the modal
        } else {
            setSelectedContact(contact);
            await loadContactTransactions(contact);
            setShowContactModal(true);  // This opens the modal
        }
    } catch (error) {
        console.error('Error opening contact:', error);
        setSelectedContact(contact);
        setShowContactModal(true);
    }
};

  // Handle pay from contact modal
  const handlePayFromContactModal = (contact) => {
    setSelectedContact(contact);
    setPayAmount('');
    setPayNote('');
    setPayStep(1);
    setSelectedBankForPay(null);
    setPayPinDigits(['', '', '', '']);
    setPayPinFilled([false, false, false, false]);
    setPayPinError('');
    setShowPayModal(true);
    setShowContactDetailsModal(false);
  };

  // Handle request from contact modal
// Handle request from contact modal
const handleRequestFromContactModal = (contact) => {
  console.log('Request button clicked for contact:', contact);
  setSelectedContact(contact);
  setRequestAmount('');
  setRequestNote('');
  setShowContactModal(false);  // Close contact modal first
  // Small delay to ensure contact modal closes before opening request modal
  setTimeout(() => {
    setShowRequestModal(true);
  }, 100);
};

const processRequest = async () => {
  const amount = parseFloat(requestAmount);
  if (isNaN(amount) || amount <= 0) {
    toast.error('Please enter a valid amount');
    return;
  }
  
  setRequestLoading(true);
  
  try {
    const requestId = `REQ${Date.now()}`;
    const newRequest = {
      id: Date.now(),
      requestId: requestId,
      amount: amount,
      note: requestNote || `Money request from ${selectedContact.name}`,
      requester_name: user?.name || 'User',
      requester_vpa: upiId,
      recipient_name: selectedContact.name,
      recipient_vpa: selectedContact.vpa,
      date: new Date().toISOString(),
      status: 'pending'
    };
    
    // Get existing requests
    const existingRequests = await getMoneyRequests();
    const requestsArray = Array.isArray(existingRequests) ? existingRequests : [];
    requestsArray.unshift(newRequest);
    
    // Save back
    await setMoneyRequests(requestsArray);
    
    setRequestSuccessData({
      amount: amount,
      contactName: selectedContact.name,
      requestId: requestId,
      date: new Date()
    });
    setShowRequestSuccessModal(true);
    setShowRequestModal(false);
    
    // Reset form
    setRequestAmount('');
    setRequestNote('');
    
    toast.success(`Request sent to ${selectedContact.name} for ₹${amount.toLocaleString()}`);
    
  } catch (error) {
    console.error('Request error:', error);
    toast.error('Failed to send request. Please try again.');
  } finally {
    setRequestLoading(false);
  }
};
  // QR Code scan handler
  const handleQRScan = (scannedData) => {
    let vpa = scannedData;
    let amount = '';
    let name = '';
    let note = '';
    
    if (scannedData.startsWith('upi://')) {
      try {
        const paMatch = scannedData.match(/[&?]pa=([^&]+)/);
        const pnMatch = scannedData.match(/[&?]pn=([^&]+)/);
        const amMatch = scannedData.match(/[&?]am=([^&]+)/);
        const tnMatch = scannedData.match(/[&?]tn=([^&]+)/);
        
        if (paMatch) vpa = decodeURIComponent(paMatch[1]);
        if (pnMatch) name = decodeURIComponent(pnMatch[1]);
        if (amMatch) amount = decodeURIComponent(amMatch[1]);
        if (tnMatch) note = decodeURIComponent(tnMatch[1]);
      } catch (e) {
        console.log('Error parsing UPI URL:', e);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      receiver_vpa: vpa,
      receiver_name: name || prev.receiver_name,
      amount: amount || prev.amount,
      note: note || prev.note
    }));
    
    toast.success(`QR scanned: ${name || vpa}`);
    
    if (amount && vpa) {
      setTimeout(() => setStep(2), 500);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.receiver_vpa) {
      newErrors.receiver_vpa = 'UPI ID / Mobile number is required';
    } else if (!/^[\w.-]+@[\w.-]+$/.test(formData.receiver_vpa) && !/^[6-9]\d{9}$/.test(formData.receiver_vpa)) {
      newErrors.receiver_vpa = 'Enter a valid UPI ID or mobile number';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || formData.amount <= 0) {
      newErrors.amount = 'Enter a valid amount';
    } else if (formData.amount > 100000) {
      newErrors.amount = 'Maximum amount per transaction is ₹1,00,000';
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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleContactSelect = (contact) => {
    setFormData(prev => ({
      ...prev,
      receiver_vpa: contact.vpa || contact.phone,
      receiver_name: contact.name,
      receiver_avatar: contact.avatar
    }));
    setShowContactsModal(false);
    setSearchTerm('');
  };

  const handleBankSelect = (bank) => {
    if (!hasUpiPin(bank.id)) {
      toast.error(`Please set UPI PIN for ${bank.bank_name} in Settings first`);
      return;
    }
    setSelectedBank(bank);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateForm()) return;
      setStep(2);
    } else if (step === 2) {
      if (!selectedBank) {
        toast.error('Please select a bank account');
        return;
      }
      setStep(3);
      setTimeout(() => {
        pinInputRefs.current[0]?.focus();
      }, 100);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  // PIN handlers
  const handlePinChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value || '';
    setPin(newPin);
    
    const newFilled = [...pinFilled];
    newFilled[index] = value !== '';
    setPinFilled(newFilled);
    
    if (value && index < 3) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  // Process payment
  const handleSendMoney = async () => {
    const pinString = pin.join('');
    if (pinString.length !== 4) {
        setPinError('Please enter complete PIN');
        return;
    }
    
    const amount = parseFloat(formData.amount);
    
    try {
        // Verify PIN
        const verifyResponse = await bankAPI.verifyPin(selectedBank.id, pinString);
        if (!verifyResponse.data.success) {
            setPinError('Incorrect PIN. Please try again.');
            setPin(['', '', '', '']);
            return;
        }
        
        // Check balance
        const balanceResponse = await bankAPI.getBalance(selectedBank.id);
        const currentBalance = balanceResponse.data.data.balance;
        
        if (amount > currentBalance) {
            toast.error(`Insufficient balance. Available: ₹${currentBalance.toLocaleString()}`);
            return;
        }
        
        setLoading(true);
        
        // Process withdrawal
        await bankAPI.withdraw(selectedBank.id, amount);
        
        const cashback = Math.floor(amount * 0.05);
        
        // Save transaction
        const transaction = {
            transactionId: `TXN${Date.now()}`,
            type: 'send',
            amount: amount,
            description: formData.note || `Payment to ${formData.receiver_name || formData.receiver_vpa}`,
            receiver_vpa: formData.receiver_vpa,
            receiver_name: formData.receiver_name,
            bank_name: selectedBank.bank_name,
            bank_id: selectedBank.id,
            cashback: cashback,
            date: new Date().toISOString(),
            status: 'success'
        };
        
        await agentOrderAPI.saveTransaction(transaction);
        
        // Update coin balance
        await coinAPI.getBalance();
        
        setTransactionResult(transaction);
        setShowSuccessAnimation(true);
        setLoading(false);
        
    } catch (error) {
        console.error('Payment error:', error);
        toast.error(error.response?.data?.message || 'Payment failed');
        setLoading(false);
    }
};

// Simple Contact Details Modal component inside SendMoneyPage
const ContactDetailsModal = ({ contact, onClose, onPay, onRequest, formatDate, contactTransactions, contactTotalReceived }) => {
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
                <div className="contact-actions-large">
                    <button className="contact-pay-btn-large" onClick={() => onPay(contact)}>
                        <FaMoneyBillWave /> Pay
                    </button>
                    <button className="contact-request-btn-large" onClick={() => onRequest(contact)}>
                        <FaArrowDown /> Request
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
                                    {tx.type === 'sent' ? <FaArrowUp className="sent" /> : <FaArrowDown className="received" />}
                                </div>
                                <div className="transaction-info">
                                    <p className="transaction-desc">{tx.description || 'Payment'}</p>
                                    <p className="transaction-date">{formatDate(tx.date)}</p>
                                </div>
                                <div className="transaction-amount">
                                    <span className={tx.type === 'sent' ? 'amount-sent' : 'amount-received'}>
                                        {tx.type === 'sent' ? '-' : '+'}₹{tx.amount}
                                    </span>
                                </div>
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

  const handleViewTransaction = () => {
    setShowSuccessAnimation(false);
    navigate('/transactions');
  };

  const handleNewPayment = () => {
    setShowSuccessAnimation(false);
    setStep(1);
    setFormData({
      receiver_vpa: '',
      receiver_name: '',
      receiver_avatar: '',
      amount: '',
      note: ''
    });
    setPin(['', '', '', '']);
    setPinFilled([false, false, false, false]);
    setSelectedBank(null);
  };

  const handleSplitComplete = (splitData) => {
    const splits = JSON.parse(localStorage.getItem('splitRequests') || '[]');
    splits.unshift({
      id: Date.now(),
      ...splitData,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('splitRequests', JSON.stringify(splits.slice(0, 50)));
    toast.success(`Split request created for ₹${splitData.totalAmount.toLocaleString()}`);
    setShowSplitModal(false);
  };

  const handleSelfTransferComplete = (transaction) => {
    loadBankBalances();
    loadLinkedBanks();
    toast.success(`₹${transaction.amount.toLocaleString()} transferred successfully!`);
    setShowSelfTransferModal(false);
  };

  // Pay from modal handlers - FIXED: No toast for PIN not set
  const handleBankSelectForPay = (bank) => {
    // Check if bank has UPI PIN set
    if (!hasUpiPin(bank.id)) {
        toast.error(`Please set UPI PIN for ${bank.bank_name} in Settings first`);
        return;
    }
    setSelectedBankForPay(bank);
    setPayStep(2);
    // Focus on first PIN input after a short delay
    setTimeout(() => {
        const firstPinInput = document.getElementById('pay-pin-0');
        if (firstPinInput) firstPinInput.focus();
    }, 100);
};

  const handlePayPinChange = (index, value) => {
    if (isNaN(value) && value !== '') return;
    const newPin = [...payPinDigits];
    newPin[index] = value;
    setPayPinDigits(newPin);
    
    const newFilled = [...payPinFilled];
    newFilled[index] = value !== '';
    setPayPinFilled(newFilled);

    if (value && index < 3) {
      const nextInput = document.getElementById(`pay-pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePayPinKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !payPinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pay-pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // In SendMoneyPage.jsx, replace the entire processPayment function with this:

const processPayment = async () => {
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
    }
    
    const pinString = payPinDigits.join('');
    if (pinString.length !== 4) {
        setPayPinError('Please enter complete PIN');
        return;
    }
    
    try {
        const isValid = await verifyBankPin(selectedBankForPay.id, pinString);
        if (!isValid) {
            setPayPinError('Incorrect PIN. Please try again.');
            setPayPinDigits(['', '', '', '']);
            setPayPinFilled([false, false, false, false]);
            return;
        }
        
        const currentBalance = bankBalances[selectedBankForPay.id] || 0;
        if (amount > currentBalance) {
            toast.error(`Insufficient balance. Available: ₹${currentBalance.toLocaleString()}`);
            return;
        }
        
        setPayLoading(true);
        
        // Process withdrawal
        await updateBankBalance(selectedBankForPay.id, amount, false);
        
        // NO CASHBACK for send money
        const cashbackEarned = 0;
        
        const transactionId = `TXN${Date.now()}`;
        const transactionData = {
            transactionId: transactionId,
            type: 'send',
            amount: amount,
            description: payNote || `Payment to ${selectedContact.name}`,
            receiver_vpa: selectedContact.vpa,
            receiver_name: selectedContact.name,
            bank_name: selectedBankForPay.bank_name,
            bank_id: selectedBankForPay.id,
            cashback_earned: cashbackEarned,
            gems_used: 0,
            status: 'success',
            date: new Date().toISOString()
        };
        
        // Save transaction to database
        const savedTransaction = await addTransaction(transactionData);
        
        // Update local bank balances
        const newBalance = bankBalances[selectedBankForPay.id] - amount;
        setBankBalances(prev => ({ ...prev, [selectedBankForPay.id]: newBalance }));
        
        // IMPORTANT: Update the contact's transaction history
        // Reload contacts to get updated transaction data
        await loadRecentContacts();
        
        // Also update the specific contact's transactions if the modal is open
        if (selectedContact && showContactDetailsModal) {
            // Refresh the contact's transactions
            const updatedContact = await getContactByVpa(selectedContact.vpa);
            if (updatedContact) {
                setSelectedContact(updatedContact);
                loadContactTransactions(updatedContact);
            }
        }
        
        // Show success modal
        const successData = {
            amount: amount,
            contactName: selectedContact.name,
            bank_name: selectedBankForPay.bank_name,
            transactionId: transactionId,
            cashback: cashbackEarned
        };
        
        setSuccessData(successData);
        setShowSuccessModal(true);
        setShowPayModal(false);
        setPayLoading(false);
        
        toast.success(`₹${amount.toLocaleString()} sent to ${selectedContact.name}!`);
        
    } catch (error) {
        console.error('Payment error:', error);
        toast.error(error.response?.data?.message || 'Payment failed');
        setPayLoading(false);
    }
};

// Add this function in SendMoneyPage component

const getContactByVpa = async (vpa) => {
    try {
        const allContacts = await getContacts();
        return allContacts.find(c => c.vpa === vpa);
    } catch (error) {
        console.error('Failed to get contact:', error);
        return null;
    }
};

  // In SendMoneyPage.jsx, update the processPaymentFromModal function

const processPaymentFromModal = async () => {
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
    }
    
    const pinString = payPinDigits.join('');
    if (pinString.length !== 4) {
        setPayPinError('Please enter complete PIN');
        return;
    }

    const isValid = await verifyBankPin(selectedBankForPay.id, pinString);
    if (!isValid) {
        setPayPinError('Incorrect PIN. Please try again.');
        setPayPinDigits(['', '', '', '']);
        setPayPinFilled([false, false, false, false]);
        return;
    }

    setPayLoading(true);
    
    try {
        const currentBalance = bankBalances[selectedBankForPay.id] || 0;
        
        if (amount > currentBalance) {
            toast.error(`Insufficient balance. Available: ₹${currentBalance.toLocaleString()}`);
            setPayLoading(false);
            return;
        }
        
        // Process withdrawal
        await updateBankBalance(selectedBankForPay.id, amount, false);
        
        const cashbackEarned = 0;
        
        const transactionId = `TXN${Date.now()}`;
        const now = new Date().toISOString();
        
        const transaction = {
            transactionId: transactionId,
            type: 'send',
            amount: amount,
            description: payNote || `Payment to ${selectedContact.name}`,
            receiver_vpa: selectedContact.vpa,
            receiver_name: selectedContact.name,
            bank_name: selectedBankForPay.bank_name,
            bank_id: selectedBankForPay.id,
            cashback_earned: cashbackEarned,
            gems_used: 0,
            status: 'success',
            date: now,
            created_at: now
        };
        
        await addTransaction(transaction);
        
        // IMPORTANT: Create or update contact with correct total sent
        // First get existing contact to calculate new total
        const existingContacts = await getContacts();
        const existingContact = existingContacts.find(c => c.vpa === selectedContact.vpa);
        
        const newTotalSent = (existingContact?.total_sent || 0) + amount;
        
        await addContact({
            name: selectedContact.name,
            vpa: selectedContact.vpa,
            phone: selectedContact.phone || selectedContact.vpa.split('@')[0],
            amount: amount,
            is_received: false,
            total_sent: newTotalSent  // Pass the updated total
        });
        
        // Wait for database to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh contacts list
        await loadContacts();
        await loadRecentContacts();
        
        // Get the updated contact
        const updatedContactsList = await getContacts();
        const updatedContact = updatedContactsList.find(c => c.vpa === selectedContact.vpa);
        
        if (updatedContact) {
            setSelectedContact(updatedContact);
            // Update contact transactions
            const allTransactions = await getTransactions();
            const contactTx = allTransactions.filter(tx => 
                (tx.type === 'send' || tx.type === 'sent') && 
                (tx.receiver_vpa === selectedContact.vpa || tx.receiver_name === selectedContact.name) &&
                tx.status === 'success'
            ).map(tx => ({
                id: tx.id,
                amount: tx.amount,
                date: tx.created_at || tx.date,
                type: 'sent',
                description: tx.description,
                transactionId: tx.transactionId,
                status: tx.status
            }));
            setContactTransactions(contactTx.sort((a, b) => new Date(b.date) - new Date(a.date)));
            setContactTotalReceived(updatedContact.total_received || 0);
        }
        
        // Refresh balances
        await loadBankBalances();
        
        // Show success animation
        setTransactionResult({
            amount: amount,
            receiver_name: selectedContact.name,
            receiver_vpa: selectedContact.vpa,
            bank_name: selectedBankForPay.bank_name,
            transactionId: transactionId,
            cashback: cashbackEarned
        });
        setShowSuccessAnimation(true);
        setShowPayModal(false);
        setPayLoading(false);
        
        // Reset payment state
        setPayAmount('');
        setPayNote('');
        setPayStep(1);
        setSelectedBankForPay(null);
        setPayPinDigits(['', '', '', '']);
        setPayPinFilled([false, false, false, false]);
        
        toast.success(`₹${amount.toLocaleString()} sent to ${selectedContact.name} successfully!`);
        
    } catch (error) {
        console.error('Payment error:', error);
        
        const failedTransaction = {
            transactionId: `TXN_FAILED_${Date.now()}`,
            type: 'send',
            amount: amount,
            description: `Payment to ${selectedContact.name} - FAILED`,
            receiver_vpa: selectedContact.vpa,
            receiver_name: selectedContact.name,
            bank_name: selectedBankForPay.bank_name,
            bank_id: selectedBankForPay.id,
            status: 'failed',
            failure_reason: error.response?.data?.message || error.message || 'Payment failed',
            date: new Date().toISOString()
        };
        
        await addTransaction(failedTransaction);
        
        setFailedTransactionResult({
            amount: amount,
            receiver_name: selectedContact.name,
            receiver_vpa: selectedContact.vpa,
            bank_name: selectedBankForPay.bank_name,
            transactionId: failedTransaction.transactionId,
            failure_reason: failedTransaction.failure_reason
        });
        setShowFailedAnimation(true);
        setShowPayModal(false);
        setPayLoading(false);
    }
};

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

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const getBankLogoComponent = (bank) => {
    const logoUrl = getBankLogoUrl(bank.bank_name);
    const hasError = imageErrors[`bank_${bank.id}`];
    
    if (logoUrl && !hasError) {
      return (
        <img 
          src={logoUrl} 
          alt={bank.bank_name}
          className="bank-logo-img"
          onError={() => setImageErrors(prev => ({ ...prev, [`bank_${bank.id}`]: true }))}
        />
      );
    }
    return <span className="bank-logo-fallback">🏦</span>;
  };

  return (
    <div className="send-money-page">
      <button className="back-button" onClick={handleBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="send-money-header">
        <h1>Send Money</h1>
        <p className="subtitle">Fast, secure payments with SabAI Pay</p>
        <AnimatedProgressBar step={step} totalSteps={3} />
      </div>

      {/* STEP 1: Enter Details */}
      {step === 1 && (
        <motion.div
          className="step-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {/* Payment Mode Selection */}
          <div className="payment-modes">
            <button className={`mode-btn ${paymentMode === 'single' ? 'active' : ''}`} onClick={() => setPaymentMode('single')}>
              <FaUser /> Single Payment
            </button>
            <button className={`mode-btn ${paymentMode === 'split' ? 'active' : ''}`} onClick={() => setShowSplitModal(true)}>
              <FaUsers /> Split Payment
            </button>
            <button className={`mode-btn ${paymentMode === 'self-transfer' ? 'active' : ''}`} onClick={() => setShowSelfTransferModal(true)}>
              <FaExchangeAlt /> Self Transfer
            </button>
          </div>

          {/* Scan QR Button */}
          <div className="scan-qr-section">
            <button className="scan-qr-btn" onClick={() => setShowScanner(true)}>
              <div className="scan-icon">
                <MdQrCodeScanner />
              </div>
              <div className="scan-text">
                <span className="scan-title">Scan QR Code</span>
                <span className="scan-subtitle">Pay by scanning any UPI QR</span>
              </div>
              <FaArrowRight className="scan-arrow" />
            </button>
          </div>

          {/* Search Contact */}
          <div className="search-section">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, UPI ID or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowContactsModal(true)}
              />
            </div>
            
            {showContactsModal && searchTerm && (
              <div className="contacts-dropdown">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map(contact => (
                    <div key={contact.id} className="contact-item" onClick={() => handleContactClick(contact)}>
                      <div className="contact-avatar" style={{ backgroundColor: contact.color || '#4f46e5' }}>
                        {contact.avatar || contact.name?.charAt(0)}
                      </div>
                      <div className="contact-info">
                        <span className="contact-name">{contact.name}</span>
                        <span className="contact-vpa">{contact.vpa || contact.phone}</span>
                      </div>
                      {contact.lastAmount && <span className="contact-amount">₹{contact.lastAmount}</span>}
                    </div>
                  ))
                ) : (
                  <div className="no-contacts">No contacts found</div>
                )}
                <button className="close-dropdown" onClick={() => setShowContactsModal(false)}>Close</button>
              </div>
            )}
          </div>

          {/* Recent Contacts - Click opens contact modal */}
{recentContacts.length > 0 && !showContactsModal && (
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
                {recentContacts.slice(0, 8).map(contact => (
                    <button 
                        key={contact.id} 
                        className="recent-contact" 
                        onClick={() => handleContactClick(contact)}  // Make sure this is correct
                    >
                        <div className="contact-circle" style={{ backgroundColor: contact.color || getContactColor(contact.name) }}>
                            {contact.avatar || contact.name?.charAt(0)}
                        </div>
                        <span>{contact.name}</span>
                    </button>
                ))}
            </div>
        </div>
    </div>
)}

          {/* Payment Form */}
          <div className="payment-form">
            <div className="form-group">
              <label>To (UPI ID / Mobile Number)</label>
              <div className="input-wrapper">
                <FaMobile className="input-icon" />
                <input
                  type="text"
                  name="receiver_vpa"
                  value={formData.receiver_vpa}
                  onChange={handleChange}
                  placeholder="e.g., name@okhdfcbank"
                  className={errors.receiver_vpa ? 'error' : ''}
                />
              </div>
              {errors.receiver_vpa && <span className="error-text">{errors.receiver_vpa}</span>}
            </div>

            <div className="form-group">
              <label>Recipient Name (Optional)</label>
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  name="receiver_name"
                  value={formData.receiver_name}
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

            {/* Enhanced Note Input Section */}
            <div className={`form-group note-group ${noteFocused ? 'focused' : ''}`}>
              <label>Add a note (Optional)</label>
              <div className="note-wrapper">
                <div className="note-icon">
                  <FaEditIcon />
                </div>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  onFocus={() => setNoteFocused(true)}
                  onBlur={() => setNoteFocused(false)}
                  placeholder="What's this for? (e.g., Dinner payment, Rent, Shopping)"
                  rows={noteFocused ? 3 : 1}
                />
                {formData.note && (
                  <button className="clear-note" onClick={() => setFormData(prev => ({ ...prev, note: '' }))}>
                    <FaTimes />
                  </button>
                )}
              </div>
              <div className="note-hint">
                <span>{formData.note?.length || 0}/100 characters</span>
                <span>💡 Adding a note helps you track payments</span>
              </div>
            </div>

            <button className="continue-btn" onClick={handleNext}>
              Continue <FaArrowRight />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 2: Bank Selection */}
      {step === 2 && (
        <motion.div
          className="step-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="bank-selection-section">
            <div className="payment-summary">
              <h3>Payment Summary</h3>
              <div className="summary-row">
                <span>Amount</span>
                <strong>₹{parseFloat(formData.amount || 0).toLocaleString()}</strong>
              </div>
              <div className="summary-row">
                <span>To</span>
                <span>{formData.receiver_name || formData.receiver_vpa}</span>
              </div>
              {/* <div className="summary-row cashback">
                <span>Cashback (5%)</span>
                <span className="cashback-value">+{cashbackEarned} 🪙</span>
              </div> */}
              {formData.note && (
                <div className="summary-row">
                  <span>Note</span>
                  <span className="note-preview">{formData.note}</span>
                </div>
              )}
            </div>

            <h3 className="banks-title">Select Bank Account</h3>
            <div className="banks-grid">
              {linkedBanks.length > 0 ? (
                linkedBanks.map(bank => {
                  const hasPin = hasUpiPin(bank.id);
                  
                  return (
                    <div
                      key={bank.id}
                      className={`bank-card ${selectedBank?.id === bank.id ? 'selected' : ''} ${!hasPin ? 'no-pin' : ''}`}
                      onClick={() => handleBankSelect(bank)}
                    >
                      <div className="bank-logo">
                        {getBankLogoComponent(bank)}
                      </div>
                      <div className="bank-info">
                        <h4>{bank.bank_name}</h4>
                        <p className="account-number">xxxx{bank.account_number.slice(-4)}</p>
                      </div>
                      {!hasPin && <span className="pin-badge">PIN not set</span>}
                      {selectedBank?.id === bank.id && <FaCheckCircle className="selected-icon" />}
                    </div>
                  );
                })
              ) : (
                <div className="no-banks">
                  <FaUniversity />
                  <p>No bank accounts linked</p>
                  <button onClick={() => navigate('/settings?tab=bank')}>Link Bank Account</button>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={handleBack}>Back</button>
              <button className="btn-primary" onClick={handleNext} disabled={!selectedBank}>
                Continue <FaArrowRight />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 3: PIN Entry */}
      {step === 3 && (
        <motion.div
          className="step-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="pin-section">
            <div className="selected-bank">
              <div className="bank-icon">
                {getBankLogoComponent(selectedBank)}
              </div>
              <div>
                <h4>{selectedBank?.bank_name}</h4>
                <p>xxxx{selectedBank?.account_number?.slice(-4)}</p>
              </div>
            </div>

            <div className="payment-details">
              <div className="amount-large">₹{parseFloat(formData.amount).toLocaleString()}</div>
              <div className="recipient">to {formData.receiver_name || formData.receiver_vpa}</div>
              {/* <div className="cashback-info">You'll earn {cashbackEarned} SabAI Gems</div> */}
            </div>

            <div className="pin-input-group">
              <label>Enter UPI PIN</label>
              <div className="pin-inputs">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => pinInputRefs.current[index] = el}
                    type={showPin ? 'text' : 'password'}
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(e, index)}
                    className={pinFilled[index] ? 'filled' : ''}
                    autoFocus={index === 0}
                    inputMode="numeric"
                  />
                ))}
              </div>
              <label className="show-pin">
                <input type="checkbox" checked={showPin} onChange={() => setShowPin(!showPin)} />
                Show PIN
              </label>
              {pinError && <p className="pin-error">{pinError}</p>}
            </div>

            <div className="pin-actions">
              <button className="btn-secondary" onClick={handleBack}>Back</button>
              <button className="btn-primary" onClick={handleSendMoney} disabled={loading}>
                {loading ? <FaSpinner className="spinner" /> : `Pay ₹${parseFloat(formData.amount || 0).toLocaleString()}`}
              </button>
            </div>

            <button className="forgot-pin" onClick={() => navigate('/settings?tab=bank')}>
              Forgot PIN?
            </button>
          </div>
        </motion.div>
      )}

      {/* Request Modal */}
<AnimatePresence>
  {showRequestModal && selectedContact && (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRequestModal(false)}>
      <motion.div className="request-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowRequestModal(false)}><FaTimes /></button>
        {console.log('Request Modal should be visible')}
        
        <div className="request-modal-header">
          <div className="request-recipient-circle" style={{ backgroundColor: selectedContact.color || getContactColor(selectedContact.name) }}>
            {selectedContact.name?.charAt(0).toUpperCase()}
          </div>
          <h3>Request from {selectedContact.name}</h3>
          <p>{selectedContact.vpa}</p>
        </div>

        <div className="request-amount-section">
          <div className="request-amount-input">
            <span className="currency-symbol">₹</span>
            <input
              type="number"
              placeholder="0"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              className="request-amount-field"
              autoFocus
            />
          </div>
          <div className="quick-amounts-request">
            {[100, 200, 500, 1000, 2000].map(amt => (
              <button key={amt} className="quick-amount-request" onClick={() => setRequestAmount(amt)}>₹{amt}</button>
            ))}
          </div>
          <div className="request-note-input">
            <input
              type="text"
              placeholder="Add a note (optional)"
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              className="request-note-field"
            />
          </div>
        </div>

        <div className="request-modal-footer">
          <button className="cancel-request-btn" onClick={() => setShowRequestModal(false)}>Cancel</button>
          <button 
            className="send-request-btn" 
            onClick={processRequest} 
            disabled={requestLoading || !requestAmount || parseFloat(requestAmount) <= 0}
          >
            {requestLoading ? <FaSpinner className="spinner" /> : `Request ₹${requestAmount ? parseFloat(requestAmount).toLocaleString() : '0'}`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

{/* Request Success Modal */}
<AnimatePresence>
  {showRequestSuccessModal && requestSuccessData && (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRequestSuccessModal(false)}>
      <motion.div className="success-modal request-success" initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 50 }} onClick={e => e.stopPropagation()}>
        <div className="success-icon">
          <FaArrowDown />
        </div>
        <h2>Request Sent!</h2>
        <div className="success-details">
          <div className="success-row">
            <span>Amount</span>
            <strong>₹{requestSuccessData.amount.toLocaleString()}</strong>
          </div>
          <div className="success-row">
            <span>To</span>
            <span>{requestSuccessData.contactName}</span>
          </div>
          <div className="success-row">
            <span>Request ID</span>
            <span className="txn-id">{requestSuccessData.requestId}</span>
          </div>
        </div>
        <button className="success-close-btn" onClick={() => setShowRequestSuccessModal(false)}>Done</button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowScanner(false)}>
            <motion.div className="scanner-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowScanner(false)}><FaTimes /></button>
              <h3>Scan QR Code</h3>
              <QRScannerComponent onScan={handleQRScan} onClose={() => setShowScanner(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Split Payment Modal */}
      <AnimatePresence>
        {showSplitModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSplitModal(false)}>
            <motion.div className="split-modal-container" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <SplitPaymentModal 
                onClose={() => setShowSplitModal(false)}
                onSplitComplete={handleSplitComplete}
                contacts={recentContacts}
                user={user}
                bankBalances={bankBalances}
                linkedBanks={linkedBanks}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Self Transfer Modal */}
      <AnimatePresence>
        {showSelfTransferModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSelfTransferModal(false)}>
            <motion.div className="self-transfer-modal-container" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <SelfTransferModal 
                onClose={() => setShowSelfTransferModal(false)}
                onTransferComplete={handleSelfTransferComplete}
                linkedBanks={linkedBanks}
                bankBalances={bankBalances}
                updateBankBalance={updateBankBalance}
                hasUpiPin={hasUpiPin}
                verifyBankPin={verifyBankPin}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Details Modal - Opens when clicking on contact */}
<AnimatePresence>
    {showContactModal && selectedContact && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowContactModal(false)}>
            <ContactDetailsModal 
                contact={selectedContact}
                onClose={() => setShowContactModal(false)}
                onPay={handlePayFromContactModal}
                onRequest={handleRequestFromContactModal}
                formatDate={formatDate}
                contactTransactions={contactTransactions}
                contactTotalReceived={contactTotalReceived}
            />
        </motion.div>
    )}
</AnimatePresence>

      {/* Payment Modal (from contact click) - FIXED: Only shows banks with PIN set */}
      <AnimatePresence>
        {showPayModal && selectedContact && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPayModal(false)}>
            <motion.div className="payment-large-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowPayModal(false)}><FaTimes /></button>
              
              <div className="payment-modal-header">
                <div className="payment-recipient-circle" style={{ backgroundColor: selectedContact.color || getContactColor(selectedContact.name) }}>
                  {selectedContact.name?.charAt(0).toUpperCase()}
                </div>
                <h3>Pay {selectedContact.name}</h3>
                <p className="payment-vpa">{selectedContact.vpa}</p>
              </div>

              {payStep === 1 && (
                <>
                  <div className="payment-amount-section">
                    <div className="payment-amount-input-large">
                      <span className="currency-symbol-large">₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="payment-amount-field-large"
                        autoFocus
                      />
                    </div>
                    <div className="quick-amounts-payment-large">
                      {[100, 200, 500, 1000, 2000].map(amt => (
                        <button key={amt} className="quick-amount-payment-large" onClick={() => setPayAmount(amt)}>₹{amt}</button>
                      ))}
                    </div>
                    <div className="payment-note-input-large">
                      <input
                        type="text"
                        placeholder="Add a note (optional)"
                        value={payNote}
                        onChange={(e) => setPayNote(e.target.value)}
                        className="payment-note-field-large"
                      />
                    </div>
                  </div>

                  <div className="bank-selection-section">
                    <h4>Select Bank Account</h4>
                    <div className="bank-list-pay">
                      {linkedBanks.length > 0 ? (
                        linkedBanks.filter(bank => hasUpiPin(bank.id)).map(bank => (
                          <button
                            key={bank.id}
                            className={`bank-option-pay ${selectedBankForPay?.id === bank.id ? 'selected' : ''}`}
                            onClick={() => handleBankSelectForPay(bank)}
                          >
                            <div className="bank-icon-small-pay">
                              {(() => {
                                const bankLogo = getBankLogoUrl(bank.bank_name);
                                const hasError = imageErrors[`pay_bank_${bank.id}`];
                                if (bankLogo && !hasError) {
                                  return <img src={bankLogo} alt={bank.bank_name} className="bank-logo-small" onError={() => setImageErrors(prev => ({ ...prev, [`pay_bank_${bank.id}`]: true }))} />;
                                }
                                return <FaUniversity />;
                              })()}
                            </div>
                            <div className="bank-info-pay">
                              <span className="bank-name-pay">{bank.bank_name}</span>
                              <span className="bank-account-pay">xxxx{bank.account_number?.slice(-4)}</span>
                            </div>
                            {selectedBankForPay?.id === bank.id && <FaCheckCircle className="selected-icon-pay" />}
                          </button>
                        ))
                      ) : (
                        <div className="no-banks-pay">
                          <p>No bank accounts linked</p>
                          <button onClick={() => navigate('/settings?tab=bank')}>Add Bank Account</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="payment-modal-footer">
                    <button className="cancel-pay-btn" onClick={() => setShowPayModal(false)}>Cancel</button>
                    <button 
                      className="next-pay-btn" 
                      onClick={() => {
                        if (!selectedBankForPay) {
                          toast.error('Please select a bank account');
                          return;
                        }
                        if (!payAmount || parseFloat(payAmount) <= 0) {
                          toast.error('Please enter an amount');
                          return;
                        }
                        setPayStep(2);
                      }}
                      disabled={!selectedBankForPay || !payAmount}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {payStep === 2 && (
                <>
                  <div className="payment-summary-section">
                    <div className="summary-row">
                      <span>Amount</span>
                      <strong>₹{parseFloat(payAmount || 0).toLocaleString()}</strong>
                    </div>
                    <div className="summary-row">
                      <span>To</span>
                      <span>{selectedContact.name}</span>
                    </div>
                    <div className="summary-row">
                      <span>From</span>
                      <span>{selectedBankForPay?.bank_name} (xxxx{selectedBankForPay?.account_number?.slice(-4)})</span>
                    </div>
                    {/* <div className="summary-row">
                      <span>Cashback (5%)</span>
                      <span className="cashback-amount">+{calculateCashback(parseFloat(payAmount || 0))} 🪙</span>
                    </div> */}
                    {payNote && (
                      <div className="summary-row">
                        <span>Note</span>
                        <span>{payNote}</span>
                      </div>
                    )}
                  </div>

                  <div className="pin-section-pay">
                    <label>Enter UPI PIN</label>
                    <div className="pin-inputs-pay">
                      {payPinDigits.map((digit, index) => (
                        <input
                          key={index}
                          id={`pay-pin-${index}`}
                          type={showPayPin ? 'text' : 'password'}
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handlePayPinChange(index, e.target.value)}
                          onKeyDown={(e) => handlePayPinKeyDown(e, index)}
                          className={`pin-input-pay ${payPinFilled[index] ? 'filled' : ''}`}
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                    <label className="show-pin-checkbox-pay">
                      <input type="checkbox" checked={showPayPin} onChange={() => setShowPayPin(!showPayPin)} />
                      <span>Show PIN</span>
                    </label>
                    {payPinError && <p className="pin-error-pay">{payPinError}</p>}
                  </div>

                  <div className="payment-modal-footer">
                    <button className="back-pay-btn" onClick={() => setPayStep(1)}>Back</button>
                    <button className="confirm-pay-btn" onClick={processPaymentFromModal} disabled={payLoading}>
                      {payLoading ? <FaSpinner className="spinner" /> : `Pay ₹${parseFloat(payAmount || 0).toLocaleString()}`}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PopUPI Style Success Animation */}
      <AnimatePresence>
        {showSuccessAnimation && transactionResult && (
          <motion.div 
            className="popupi-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PopUpiSuccessAnimation 
              onComplete={() => {}}
              onViewTransaction={handleViewTransaction}
              onNewPayment={handleNewPayment}
              transactionData={transactionResult}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Failed Payment Modal */}
<AnimatePresence>
  {showFailedAnimation && failedTransactionResult && (
    <motion.div 
      className="popupi-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <FailedPaymentModal 
        transactionData={failedTransactionResult}
        onClose={() => {
          setShowFailedAnimation(false);
          setFailedTransactionResult(null);
        }}
        onRetry={() => {
          setShowFailedAnimation(false);
          setFailedTransactionResult(null);
          // Reset and allow user to try again
          setStep(2);
          setPayStep(1);
          setSelectedBankForPay(null);
          setPayPinDigits(['', '', '', '']);
          setPayPinFilled([false, false, false, false]);
        }}
      />
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
};

// Animated Progress Bar Component
const AnimatedProgressBar = ({ step, totalSteps = 3 }) => {
  const progress = (step / totalSteps) * 100;
  
  return (
    <div className="progress-container">
      <div className="progress-bar-bg">
        <motion.div 
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
      <div className="progress-steps">
        <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-circle">
            {step > 1 ? <FaCheckCircle /> : <span>1</span>}
          </div>
          <span className="step-label">Details</span>
        </div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-circle">
            {step > 2 ? <FaCheckCircle /> : <span>2</span>}
          </div>
          <span className="step-label">Bank</span>
        </div>
        <div className={`progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
          <div className="step-circle">
            {step > 3 ? <FaCheckCircle /> : <span>3</span>}
          </div>
          <span className="step-label">Pay</span>
        </div>
      </div>
    </div>
  );
};

export default SendMoneyPage;