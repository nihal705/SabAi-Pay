// frontend/src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bankAPI, coinsAPI, agentOrderAPI, merchantAPI, transactionsAPI } from '../services/apiService';
import storageService, { 
    getBankAccounts, getBankBalances, getCoinBalance, 
    getTransactions, getBills, getRecentRecharges,
    getConnectedMerchants, verifyBankPin, updateBankBalance,
    updateCoinBalance, addTransaction, getCurrentUserId,
    setCurrentUserId, getMoneyRequests, setMoneyRequests,
    getAutoPayOrders, getReserveLimits,
    getContacts, getAgentOrders, hasUpiPin, addContact,
    refreshCurrentUserId
} from '../services/storageService';
import { 
  FaWallet, 
  FaArrowUp, 
  FaArrowDown, 
  FaQrcode, 
  FaHistory,
  FaRobot,
  FaCoins,
  FaCreditCard,
  FaBell,
  FaGift,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUserFriends,
  FaBuilding,
  FaBolt,
  FaMobile,
  FaUniversity,
  FaCheckCircle,
  FaCopy,
  FaWifi,
  FaTimes,
  FaPlug,
  FaStore,
  FaSpinner,
  FaUser,
  FaEnvelope,
  FaWhatsapp,
  FaShare,
  FaRupeeSign,
  FaClock,
  FaCalendarAlt,
  FaChevronRight,
  FaArrowRight,
  FaShoppingBag,
  FaReceipt,
  FaExternalLinkAlt,
  FaMoneyBillWave,
  FaArrowLeft,
  FaCheckDouble
} from 'react-icons/fa';
import { SiPhonepe, SiPaytm, SiGooglepay } from 'react-icons/si';
import { MdQrCodeScanner, MdLocalGasStation, MdElectricalServices, MdWaterDrop } from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';
import './DashboardPage.css';

// Helper function to get bank logo URL
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
  if (fileName) {
    return `/images/banks/${fileName}`;
  }
  return null;
};

// Helper function to get random pastel color for contacts
const getContactColor = (name) => {
  const colors = [
    '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#d946ef',
    '#3b82f6', '#14b8a6', '#a855f7', '#e11d48', '#f43f5e'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
};

// Helper function to get first name
const getFirstName = (fullName) => {
  return fullName?.split(' ')[0] || fullName;
};

// Helper function to calculate cashback (5% of amount)
const calculateCashback = (amount) => {
  return Math.floor(amount * 0.05);
};

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
            {/* <span style={{ fontSize: '2rem' }}>💰</span> */}
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

const MerchantCard = ({ merchant, onClick }) => {
  const [logoError, setLogoError] = useState(false);
  
  const merchantLogoMap = {
    'swiggy': '/images/merchants/swiggy.png',
    'zomato': '/images/merchants/zomato.png',
    'zepto': '/images/merchants/zepto.png',
    'blinkit': '/images/merchants/blinkit.png',
    'amazon': '/images/merchants/amazon.png',
    'flipkart': '/images/merchants/flipkart.png',
    'myntra': '/images/merchants/myntra.png',
    'netmeds': '/images/merchants/netmeds.png',
    'pharmeasy': '/images/merchants/pharmeasy.png'
  };
  
  const logoUrl = merchantLogoMap[merchant.merchantId?.toLowerCase()] || merchant.logoUrl || '/images/merchants/default.png';
  
  return (
    <div className="business-card-order" onClick={() => onClick(merchant)}>
      <div className="business-logo-container">
        {!logoError ? (
          <img 
            src={logoUrl} 
            alt={merchant.name}
            className="business-logo"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="business-fallback">{merchant.name?.charAt(0) || 'M'}</span>
        )}
      </div>
      <div className="business-info-order">
        <h4>{merchant.name}</h4>
        <p>{merchant.totalOrders} order{merchant.totalOrders !== 1 ? 's' : ''} • ₹{merchant.totalSpent.toLocaleString()}</p>
      </div>
      <FaChevronRight className="business-arrow" />
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinFilled, setPinFilled] = useState([false, false, false, false]);
  const [balance, setBalance] = useState(null);
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [showBalanceValue, setShowBalanceValue] = useState(false);
  const [pinError, setPinError] = useState('');
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [balances, setBalances] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  
  // Contact/People states
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactTransactions, setContactTransactions] = useState([]);
  const [contactTotalReceived, setContactTotalReceived] = useState(0);
  
  // Payment states
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [showBankSelectionForPay, setShowBankSelectionForPay] = useState(false);
  const [selectedBankForPay, setSelectedBankForPay] = useState(null);
  const [payStep, setPayStep] = useState(1);
  const [payPinDigits, setPayPinDigits] = useState(['', '', '', '']);
  const [payPinFilled, setPayPinFilled] = useState([false, false, false, false]);
  const [payPinError, setPayPinError] = useState('');
  const [showPayPin, setShowPayPin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  
  // Success confirmation modal (PopUPI style)
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  
  // Request states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [showRequestSuccessModal, setShowRequestSuccessModal] = useState(false);
  const [requestSuccessData, setRequestSuccessData] = useState(null);
  
  // Bills & Recharges states
  const [bills, setBills] = useState([]);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [recentRecharges, setRecentRecharges] = useState([]);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  
  // Orders by Merchant states
  const [merchantOrders, setMerchantOrders] = useState({});
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showMerchantOrdersModal, setShowMerchantOrdersModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  
  // Coin balance
  const [coinBalance, setCoinBalance] = useState(0);

  useEffect(() => {
    if (user?.phone_number) {
      setUpiId(`${user.phone_number}@sabai`);
    }
    loadBankAccounts();
    loadBalances();
    loadContacts();
    loadBills();
    loadRecentRecharges();
    loadMerchantOrders();
    loadCoinBalance();
  }, [user]);

  useEffect(() => {
    const handleBankAccountsUpdate = () => {
      loadBankAccounts();
      loadBalances();
    };
    window.addEventListener('bankAccountsUpdated', handleBankAccountsUpdate);
    return () => {
      window.removeEventListener('bankAccountsUpdated', handleBankAccountsUpdate);
    };
  }, []);

  useEffect(() => {
    // Refresh user ID in storage service on page load
    refreshCurrentUserId();
    
    // Also refresh when user changes
    if (user?.id) {
        const userId = user.id.toString();
        localStorage.setItem('currentUserId', userId);
        // Set current user ID in storage service
        setCurrentUserId(userId);
    }
}, [user]);

  useEffect(() => {
    const handleOrdersUpdate = () => {

      loadMerchantOrders();
    };
    
    window.addEventListener('ordersUpdated', handleOrdersUpdate);
    
    const handleStorageChange = (e) => {
      if (e.key && (e.key.includes('agentOrders') || e.key === 'agentOrders')) {
        loadMerchantOrders();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('ordersUpdated', handleOrdersUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // MODIFIED: Load contacts using storageService
    const loadContacts = async () => {
    try {
        const contactsList = await getContacts();
        console.log('Loaded contacts in Dashboard:', contactsList); // Debug log
        
        // Sort by last transaction date (most recent first)
        const sortedContacts = [...contactsList].sort((a, b) => 
            new Date(b.last_transaction) - new Date(a.last_transaction)
        );
        
        setContacts(sortedContacts);
    } catch (error) {
        console.error('Failed to load contacts:', error);
        setContacts([]);
    }
};


useEffect(() => {
    if (user?.id) {
        const userId = user.id.toString();
        const isNewUserFlag = localStorage.getItem(`isNewUser_${userId}`);
        
        // Check if this user has any data
        const userHasBankAccounts = getBankAccounts().length > 0;
        const userHasTransactions = getTransactions().length > 0;
        
        if (!userHasBankAccounts && !userHasTransactions && !isNewUserFlag) {
            // This appears to be a new user, set flag
            localStorage.setItem(`isNewUser_${userId}`, 'true');
            console.log(`New user ${userId} detected - no existing data`);
            
            // Clear any old data that might have been mistakenly loaded
            // The storage helpers already handle user-specific keys
        }
    }
}, [user]);

  const loadContactTransactions = async (contact) => {
    try {
        const allTransactions = await getTransactions();
        
        // Filter ALL send transactions to this contact (successful ones)
        const sentTransactions = allTransactions.filter(tx => 
            (tx.type === 'send' || tx.type === 'sent') && 
            (tx.receiver_vpa === contact.vpa || tx.receiver_name === contact.name) && 
            tx.status === 'success'
        );
        
        console.log('Sent transactions found:', sentTransactions.length);
        
        // Map to transaction items for display with proper date parsing
        const contactTx = sentTransactions.map(tx => ({
            id: tx.id,
            amount: Number(tx.amount),
            date: tx.created_at || tx.date,
            type: 'sent',
            description: tx.description || `Payment to ${contact.name}`,
            transactionId: tx.transactionId,
            status: tx.status
        }));
        
        // Sort by date (newest first)
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
        
        // Calculate total received (transactions where this contact sent to user)
        const receivedTransactions = allTransactions.filter(tx => 
            (tx.type === 'receive' || tx.type === 'received') && 
            (tx.sender_vpa === contact.vpa || tx.sender_name === contact.name) && 
            tx.status === 'success'
        );
        const totalReceived = receivedTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
        setContactTotalReceived(totalReceived);
        
    } catch (error) {
        console.error('Failed to load contact transactions:', error);
        setContactTransactions([]);
        setContactTotalReceived(0);
    }
};

 const loadBills = async () => {
    try {
        const billsList = await getBills();
        setBills(billsList);
        const upcoming = billsList.filter(bill => {
            const dueDate = new Date(bill.due_date);
            const today = new Date();
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 7 && diffDays >= 0 && bill.status !== 'paid';
        });
        setUpcomingBills(upcoming.slice(0, 4));
    } catch (error) {
        console.error('Failed to load bills:', error);
    }
};
  const loadRecentRecharges = async () => {
    try {
        const recharges = await getRecentRecharges();
        setRecentRecharges(recharges.slice(0, 3));
    } catch (error) {
        console.error('Failed to load recharges:', error);
    }
};


   // MODIFIED: Load merchant orders using storageService
    const loadMerchantOrders = async () => {
    try {
        const orders = await getAgentOrders();
        const grouped = {};
        (orders || []).forEach(order => {
            const merchant = order.merchantName || order.merchant;
            if (!grouped[merchant]) {
                grouped[merchant] = {
                    merchantId: order.merchant,
                    name: merchant,
                    orders: [],
                    totalOrders: 0,
                    totalSpent: 0
                };
            }
            grouped[merchant].orders.push(order);
            grouped[merchant].totalOrders++;
            grouped[merchant].totalSpent += order.totalAmount || 0;
        });
        setMerchantOrders(grouped);
    } catch (error) {
        console.error('Failed to load merchant orders:', error);
        setMerchantOrders({});
    }
};


  const getUserId = () => {
    return getCurrentUserId();
};


// MODIFIED: Load bank accounts using storageService
    const loadBankAccounts = async () => {
        try {
            const accounts = await getBankAccounts();
            setLinkedBanks(accounts);
            if (accounts.length > 0) {
                const primary = accounts.find(acc => acc.is_primary) || accounts[0];
                setSelectedBank(primary);
            }
        } catch (error) {
            console.error('Failed to load bank accounts:', error);
            toast.error('Failed to load bank accounts');
        }
    };
    
    // MODIFIED: Load balances using storageService
    const loadBalances = async () => {
        try {
            const balancesMap = await getBankBalances();
            setBalances(balancesMap);
        } catch (error) {
            console.error('Failed to load balances:', error);
        }
    };
    
    // MODIFIED: Load coin balance using storageService
    const loadCoinBalance = async () => {
        try {
            const balance = await getCoinBalance();
            setCoinBalance(balance);
        } catch (error) {
            console.error('Failed to load coin balance:', error);
        }
    };


  const hasUpiPinFunc = (bankId) => {
    return hasUpiPin(bankId);
};

  // REPLACE verifyBankPin function
const verifyBankPinFunc = (bankId, enteredPin) => {
    return verifyBankPin(bankId, enteredPin);
};

// REPLACE updateBankBalance function
const updateBankBalanceFunc = (bankId, amount) => {
    const newBalance = updateBankBalance(bankId, amount, true);
    setBalances(prev => ({ ...prev, [bankId]: newBalance }));
    return newBalance;
};

// REPLACE updateCoinBalanceAfterPayment function
const updateCoinBalanceAfterPayment = (cashback) => {
    const newBalance = updateCoinBalance(cashback, true);
    setCoinBalance(newBalance);
    return newBalance;
};

// REPLACE saveTransaction function
const saveTransaction = (txnData) => {
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
        cashback: txnData.cashback || 0
    };
    
    addTransaction(newTransaction);
    updateContacts(txnData);
    return newTransaction;
};

// REPLACE updateContacts function
const updateContacts = (txnData) => {
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
    loadContacts();
};

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setShowBalanceValue(false);
    setBalance(null);
  };

  const openBalanceModal = () => {
    if (!selectedBank) {
      toast.error('Please select a bank account first');
      return;
    }
    
    if (!hasUpiPin(selectedBank.id)) {
      toast.error(`Please set UPI PIN for ${selectedBank.bank_name} in Settings first`);
      return;
    }
    
    setPin(['', '', '', '']);
    setPinFilled([false, false, false, false]);
    setPinError('');
    setShowBalanceModal(true);
  };

  const handlePinInputChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value || '';
    setPin(newPin);
    
    const newFilled = [...pinFilled];
    newFilled[index] = value !== '';
    setPinFilled(newFilled);
    
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePinInputKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const verifyPinAndShowBalance = async () => {
    const pinString = pin.join('');
    if (pinString.length !== 4) {
        setPinError('Please enter complete PIN');
        return;
    }

    const isValid = await verifyBankPin(selectedBank.id, pinString);
    if (!isValid) {
        setPinError('Incorrect PIN. Please try again.');
        setPin(['', '', '', '']);
        setPinFilled([false, false, false, false]);
        document.getElementById('pin-input-0')?.focus();
        return;
    }

    setCheckingBalance(true);
    
    setTimeout(() => {
        const currentBalance = balances[selectedBank.id] || 0;
        setBalance({ balance: currentBalance });
        setShowBalanceValue(true);
        setShowBalanceModal(false);
        setCheckingBalance(false);
        toast.success(`Balance fetched for ${selectedBank.bank_name}`);
    }, 800);
};


  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    loadContactTransactions(contact);
    setShowContactModal(true);
  };

  const handlePayToContact = (contact) => {
    setSelectedContact(contact);
    setPayAmount('');
    setPayNote('');
    setPayStep(1);
    setSelectedBankForPay(null);
    setPayPinDigits(['', '', '', '']);
    setPayPinFilled([false, false, false, false]);
    setPayPinError('');
    setShowPayModal(true);
  };

  const handleBankSelectForPay = (bank) => {
    if (!hasUpiPin(bank.id)) {
      toast.error(`Please set UPI PIN for ${bank.bank_name} in Settings first`);
      return;
    }
    setSelectedBankForPay(bank);
    setPayStep(2);
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
            // Verify PIN
            const isValid = await verifyBankPin(selectedBankForPay.id, pinString);
            if (!isValid) {
                setPayPinError('Incorrect PIN. Please try again.');
                setPayPinDigits(['', '', '', '']);
                return;
            }
            
            // Check balance
            const currentBalance = balances[selectedBankForPay.id] || 0;
            if (amount > currentBalance) {
                toast.error(`Insufficient balance. Available: ₹${currentBalance.toLocaleString()}`);
                return;
            }
            
            setPayLoading(true);
            
            // Process withdrawal
            await updateBankBalance(selectedBankForPay.id, amount, false);
            
            const cashbackEarned = Math.floor(amount * 0.05);
            
            // Save transaction
            const transaction = {
                transactionId: `TXN${Date.now()}`,
                type: 'send',
                amount: amount,
                description: payNote || `Payment to ${selectedContact.name}`,
                receiver_vpa: selectedContact.vpa,
                receiver_name: selectedContact.name,
                bank_name: selectedBankForPay.bank_name,
                bank_id: selectedBankForPay.id,
                cashback: cashbackEarned,
                status: 'success'
            };
            
            await addTransaction(transaction);
            
            // Update coin balance
            if (cashbackEarned > 0) {
                await updateCoinBalance(cashbackEarned, true);
            }
            
            setSuccessData({
                amount: amount,
                contactName: selectedContact.name,
                bank_name: selectedBankForPay.bank_name,
                transactionId: transaction.transactionId,
                cashback: cashbackEarned
            });
            setShowSuccessModal(true);
            setShowPayModal(false);
            setPayLoading(false);
            
            // Refresh data
            await loadBalances();
            await loadCoinBalance();
            
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'Payment failed');
            setPayLoading(false);
        }
    };

  const handleViewTransaction = () => {
    setShowSuccessModal(false);
    navigate('/transactions');
  };

  const handleNewPayment = () => {
    setShowSuccessModal(false);
    setPayAmount('');
    setPayNote('');
    setPayStep(1);
    setSelectedBankForPay(null);
    setPayPinDigits(['', '', '', '']);
  };

  const handleRequestMoney = (contact) => {
    setSelectedContact(contact);
    setRequestAmount('');
    setRequestNote('');
    setShowRequestModal(true);
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
    
    // Get existing requests (await the Promise)
    const existingRequests = await getMoneyRequests();
    const requestsArray = Array.isArray(existingRequests) ? existingRequests : [];
    requestsArray.unshift(newRequest);
    
    // Save back (if setMoneyRequests is async, await it)
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
  const handleBillClick = (bill) => {
    setSelectedBill(bill);
    setShowBillDetails(true);
  };

  const handlePayBill = () => {
    if (!selectedBill) return;
    navigate('/bills', { state: { selectedBill } });
    setShowBillDetails(false);
  };

  const handleRechargeClick = (recharge) => {
    navigate('/mobile-recharge', { state: { number: recharge.mobileNumber } });
  };

  const startNewChat = () => {
    const userId = getCurrentUserId();
    const newChatId = 'conv_' + Date.now();
    
    const welcomeMessage = [{
        id: Date.now(),
        role: 'agent',
        content: "👋 Hi! I'm SabAI, your AI payment assistant. I can help you with UPI payments, bill payments, mobile recharge, food ordering, shopping, Reserve Pay limits, and SabAI Gems. What would you like help with today?",
        timestamp: new Date().toISOString()
    }];
    
    localStorage.setItem(`chat_${userId}_${newChatId}`, JSON.stringify(welcomeMessage));
    localStorage.setItem(`currentChatId_${userId}`, newChatId);
    
    navigate('/agent');
};

// Update handleBusinessClick function:
const handleBusinessClick = (business) => {
    const newChatId = 'conv_' + Date.now();
    const userId = getCurrentUserId();
    
    const welcomeMessages = {
        swiggy: "What would you like to order from Swiggy? 🍔",
        zomato: "What would you like to order from Zomato? 🍕",
        amazon: "What would you like to shop for on Amazon? 📦",
        flipkart: "What would you like to shop for on Flipkart? 🛍️",
        zepto: "What groceries would you like to order from Zepto? 🥬",
        netmeds: "What medicines would you like to order from NetMeds? 💊"
    };
    
    const welcomeMessage = welcomeMessages[business.id] || `What would you like to order from ${business.name}?`;
    
    const conversationStarter = [{
        id: Date.now(),
        role: 'agent',
        content: welcomeMessage,
        timestamp: new Date().toISOString()
    }];
    
    localStorage.setItem(`chat_${userId}_${newChatId}`, JSON.stringify(conversationStarter));
    localStorage.setItem(`currentChatId_${userId}`, newChatId);
    
    navigate('/agent');
    
    toast.success(`Opening new chat for ${business.name}`);
};

  const handleAIAgentClick = () => {
    startNewChat();
  };

  const handleMerchantOrdersClick = (merchant) => {
    setSelectedMerchant(merchant);
    setShowMerchantOrdersModal(true);
  };

  const handleOrderDetailsClick = (order) => {
    setSelectedOrderDetails(order);
    setShowOrderDetailsModal(true);
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

  const quickActions = [
    { id: 'send', name: 'Send Money', icon: FaArrowUp, path: '/send-money', color: '#4f46e5' },
    { id: 'request', name: 'Request', icon: FaArrowDown, path: '/request-money', color: '#059669' },
    { id: 'qr', name: 'Scan & Pay', icon: MdQrCodeScanner, path: '/send-money', color: '#7c3aed' },
    { id: 'bills', name: 'Pay Bills', icon: FaBolt, path: '/bills', color: '#dc2626' },
    { id: 'recharge', name: 'Recharge', icon: FaMobile, path: '/mobile-recharge', color: '#2563eb' },
    { id:'qr', name:'QR Code', icon: FaQrcode, path: '/qr-code',  color: '#83a1e4' },
    { id: 'connect', name: 'Connect Apps', icon: FaPlug, path: '/connect-apps', color: '#f59e0b' },
    { id: 'agent', name: 'AI Agent', icon: FaRobot, path: '/agent', color: '#9333ea', action: handleAIAgentClick }
  ];

  const businesses = [
    { id: 'swiggy', name: 'Swiggy', logoUrl: '/images/merchants/swiggy.png', category: 'Food' },
    { id: 'zomato', name: 'Zomato', logoUrl: '/images/merchants/zomato.png', category: 'Food' },
    { id: 'amazon', name: 'Amazon', logoUrl: '/images/merchants/amazon.png', category: 'Shopping' },
    { id: 'flipkart', name: 'Flipkart', logoUrl: '/images/merchants/flipkart.png', category: 'Shopping' },
    { id: 'zepto', name: 'Zepto', logoUrl: '/images/merchants/zepto.png', category: 'Groceries' },
    { id: 'netmeds', name: 'NetMeds', logoUrl: '/images/merchants/netmeds.png', category: 'Medicine' }
  ];

  const getBankLogo = (bank) => {
    const logoUrl = getBankLogoUrl(bank.bank_name);
    const hasError = imageErrors[`dashboard_${bank.id}`];
    
    if (logoUrl && !hasError) {
      return (
        <img 
          src={logoUrl} 
          alt={bank.bank_name}
          className="bank-logo-compact-img"
          onError={() => setImageErrors(prev => ({ ...prev, [`dashboard_${bank.id}`]: true }))}
        />
      );
    }
    return <span className="bank-logo-compact-fallback">🏦</span>;
  };

  return (
    <div className="dashboard">
      {/* Welcome Section with UPI ID */}
      <div className="welcome-section">
        <div>
          <h1 className="welcome-title">
            Welcome back, <span className="gradient-text">{user?.name || 'User'}</span>! 👋
          </h1>
          <div className="upi-id-container">
            <span className="upi-label">Your UPI ID:</span>
            <span className="upi-id">{upiId}</span>
            <button className="copy-upi" onClick={() => {
              navigator.clipboard.writeText(upiId);
              toast.success('UPI ID copied!');
            }}>
              <FaCopy />
            </button>
          </div>
        </div>
        <div className="rewards-badge" onClick={() => navigate('/coins')}>
          <FaGift className="rewards-icon" />
          <div>
            <span className="rewards-label">Reward Points</span>
            <span className="rewards-value">{coinBalance} 🪙</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action) => (
            <motion.button
              key={action.id}
              className="action-card"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action || (() => navigate(action.path))}
            >
              <div className="action-icon" style={{ backgroundColor: `${action.color}15` }}>
                <action.icon style={{ color: action.color }} />
              </div>
              <span className="action-name">{action.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bank Selector */}
      {linkedBanks.length > 0 && (
        <div className="bank-selector-container">
          <label className="bank-selector-label">Select Bank Account</label>
          <select 
            className="bank-selector"
            value={selectedBank?.id || ''}
            onChange={(e) => {
              const bank = linkedBanks.find(b => b.id === parseInt(e.target.value));
              handleBankSelect(bank);
            }}
          >
            {linkedBanks.map(bank => (
              <option key={bank.id} value={bank.id}>
                {bank.bank_name} - xxxx{bank.account_number?.slice(-4)} {hasUpiPin(bank.id) ? '✓' : '🔒'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Balance Card */}
      {selectedBank ? (
        <div className="main-balance-card">
          <div className="balance-card-header">
            <div className="bank-info-compact">
              <div className="bank-logo-compact">
                {getBankLogo(selectedBank)}
              </div>
              <div>
                <h3 className="bank-name-compact">{selectedBank.bank_name}</h3>
                <p className="account-number-compact">xxxx{selectedBank.account_number?.slice(-4)}</p>
                {!hasUpiPin(selectedBank.id) && (
                  <p className="pin-warning" onClick={() => navigate('/settings?tab=bank')}>
                    ⚠️ PIN not set - Click to set
                  </p>
                )}
              </div>
            </div>
            <button 
              className="refresh-balance-btn"
              onClick={openBalanceModal}
              disabled={!hasUpiPin(selectedBank.id)}
            >
              <FaEye /> Check Balance
            </button>
          </div>
          {showBalanceValue && balance && (
            <div className="balance-value-display">
              <span className="balance-label">Available Balance</span>
              <span className="balance-amount">₹{balance.balance?.toLocaleString()}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="no-bank-card">
          <FaUniversity className="no-bank-icon" />
          <h3>No Bank Account Linked</h3>
          <p>Link your first bank account to get started</p>
          <button className="link-bank-btn" onClick={() => navigate('/settings?tab=bank')}>
            Link Bank Account
          </button>
        </div>
      )}

      {/* People Section */}
<div className="people-section">
  <div className="section-header">
    <h2 className="section-title">
      <FaUserFriends className="section-icon" /> People
    </h2>
    <button className="view-all" onClick={() => navigate('/send-money')}>See all</button>
  </div>
  <div className="people-grid">
    {contacts.length > 0 ? (
      contacts.slice(0, 8).map(contact => (
        <div 
          key={contact.id} 
          className="person-circle-card"
          onClick={() => handleContactClick(contact)}
        >
          <div className="person-circle" style={{ backgroundColor: contact.color || getContactColor(contact.name) }}>
            {contact.avatar || contact.name?.charAt(0).toUpperCase()}
          </div>
          <span className="person-name">{getFirstName(contact.name)}</span>
        </div>
      ))
    ) : (
      <div className="empty-people">
        <p>No contacts yet</p>
        <button onClick={() => navigate('/send-money')}>Send Money</button>
      </div>
    )}
  </div>
</div>

      {/* Bills & Recharges Section */}
      <div className="bills-recharges-section">
        <div className="section-header">
          <h2 className="section-title">
            <FaBolt className="section-icon" /> Bills & Recharges
          </h2>
          <button className="view-all" onClick={() => navigate('/bills')}>Manage</button>
        </div>
        
        <div className="bills-recharges-grid">
          <div className="bills-preview">
            <h3>Upcoming Bills</h3>
            {upcomingBills.length > 0 ? (
              upcomingBills.map(bill => (
                <div key={bill.id} className="bill-preview-item" onClick={() => handleBillClick(bill)}>
                  <div className="bill-preview-icon" style={{ backgroundColor: `${bill.color || '#f59e0b'}15` }}>
                    {bill.icon || <FaBolt style={{ color: bill.color || '#f59e0b' }} />}
                  </div>
                  <div className="bill-preview-info">
                    <h4>{bill.name || bill.provider}</h4>
                    <p className="bill-due">Due {new Date(bill.due_date).toLocaleDateString()}</p>
                  </div>
                  <span className="bill-preview-amount">₹{bill.amount}</span>
                </div>
              ))
            ) : (
              <p className="no-items">No upcoming bills</p>
            )}
          </div>
          
          <div className="recharges-preview">
            <h3>Recent Recharges</h3>
            {recentRecharges.length > 0 ? (
              recentRecharges.map(recharge => (
                <div key={recharge.id} className="recharge-preview-item" onClick={() => handleRechargeClick(recharge)}>
                  <div className="recharge-preview-icon">
                    <FaMobile />
                  </div>
                  <div className="recharge-preview-info">
                    <h4>{recharge.mobileNumber}</h4>
                    <p className="recharge-operator">{recharge.operator}</p>
                  </div>
                  <span className="recharge-preview-amount">₹{recharge.amount}</span>
                </div>
              ))
            ) : (
              <p className="no-items">No recent recharges</p>
            )}
          </div>
        </div>
      </div>

      {/* Orders by Merchant Section */}
      <div className="business-section">
        <div className="section-header">
          <h2 className="section-title">
            <FaStore className="section-icon" /> Orders by Merchant
          </h2>
          {Object.keys(merchantOrders).length === 0 && (
            <button className="view-all" onClick={startNewChat}>Start Ordering</button>
          )}
        </div>
        <div className="business-grid">
          {Object.keys(merchantOrders).length > 0 ? (
            Object.values(merchantOrders).map(merchant => (
              <MerchantCard 
                key={merchant.merchantId} 
                merchant={merchant} 
                onClick={handleMerchantOrdersClick} 
              />
            ))
          ) : (
            <div className="empty-business">
              <FaShoppingBag className="empty-icon" />
              <p>No orders yet</p>
              <button onClick={startNewChat}>Start Ordering</button>
            </div>
          )}
        </div>
      </div>

      {/* Use AI Agent Section */}
      <div className="ai-agent-section">
        <div className="section-header">
          <h2 className="section-title">
            <FaRobot className="section-icon" /> Use AI Agent
          </h2>
        </div>
        <div className="businesses-grid">
          {businesses.map(business => (
            <button 
              key={business.id} 
              className="business-card"
              onClick={() => handleBusinessClick(business)}
            >
              <img 
                src={business.logoUrl} 
                alt={business.name}
                className="business-logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span className="business-fallback">${business.name.charAt(0)}</span>`;
                }}
              />
              <div className="business-info">
                <h4>{business.name}</h4>
                <p>{business.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contact Modal */}
      <AnimatePresence>
        {showContactModal && selectedContact && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowContactModal(false)}>
            <motion.div className="contact-large-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowContactModal(false)}><FaTimes /></button>
              
              <div className="contact-modal-header">
                <div className="contact-large-circle" style={{ backgroundColor: selectedContact.color || getContactColor(selectedContact.name) }}>
            {selectedContact.name?.charAt(0).toUpperCase()}
          </div>
                <div className="contact-header-info">
                  <h2>{selectedContact.name}</h2>
                  <p className="contact-vpa-large">{selectedContact.vpa}</p>
                  <div className="contact-stats">
                    <div className="contact-stat">
                      <span className="stat-value">₹{selectedContact.totalSent?.toLocaleString() || 0}</span>
                      <span className="stat-label">TOTAL SENT</span>
                    </div>
                    <div className="contact-stat">
                      <span className="stat-value">{selectedContact.transactionCount || 0}</span>
                      <span className="stat-label">TRANSACTIONS</span>
                    </div>
                    <div className="contact-stat">
                      <span className="stat-value">₹{contactTotalReceived.toLocaleString() || 0}</span>
                      <span className="stat-label">TOTAL RECEIVED</span>
                    </div>
                  </div>
                </div>
                <div className="contact-actions-large">
                  <button className="contact-pay-btn-large" onClick={() => handlePayToContact(selectedContact)}>
                    <FaMoneyBillWave /> Pay
                  </button>
                  <button className="contact-request-btn-large" onClick={() => handleRequestMoney(selectedContact)}>
                    <FaArrowDown /> Request
                  </button>
                </div>
              </div>

              {/* Contact Modal - Update the transaction item rendering */}
<div className="contact-transactions-section">
    <h3>Transaction History</h3>
    <div className="transactions-list-scroll">
        {contactTransactions.length > 0 ? (
            contactTransactions.map(tx => (
                <div key={tx.id} className="transaction-item">
                    <div className="transaction-icon">
                        {tx.type === 'sent' ? <FaArrowUp className="sent" /> : <FaArrowDown className="received" />}
                    </div>
                    <div className="transaction-info">
                        <p className="transaction-desc">{tx.description || 'Payment'}</p>
                        <p className="transaction-date">
                            {tx.date ? new Date(tx.date).toLocaleString() : 'Date not available'}
                        </p>
                    </div>
                    <div className="transaction-amount">
                        <span className={tx.type === 'sent' ? 'amount-sent' : 'amount-received'}>
                            {tx.type === 'sent' ? '-' : '+'}₹{tx.amount.toLocaleString()}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayModal && selectedContact && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPayModal(false)}>
            <motion.div className="payment-large-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowPayModal(false)}><FaTimes /></button>
              
              <div className="payment-modal-header">
                <div className="contact-large-circle" style={{ backgroundColor: selectedContact.color || getContactColor(selectedContact.name) }}>
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
                        linkedBanks.map(bank => (
                          <button
                            key={bank.id}
                            className={`bank-option-pay ${selectedBankForPay?.id === bank.id ? 'selected' : ''} ${!hasUpiPin(bank.id) ? 'no-pin' : ''}`}
                            onClick={() => handleBankSelectForPay(bank)}
                            disabled={!hasUpiPin(bank.id)}
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
                            {!hasUpiPin(bank.id) && <span className="pin-warning-small">PIN not set</span>}
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
                    <button className="confirm-pay-btn" onClick={processPayment} disabled={payLoading}>
                      {payLoading ? <FaSpinner className="spinner" /> : `Pay ₹${parseFloat(payAmount || 0).toLocaleString()}`}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PopUPI Style Payment Success Modal */}
      <AnimatePresence>
        {showSuccessModal && successData && (
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
              transactionData={successData}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Modal */}
<AnimatePresence>
  {showRequestModal && selectedContact && (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRequestModal(false)}>
      <motion.div className="request-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowRequestModal(false)}><FaTimes /></button>
        
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

      {/* Bill Details Modal */}
      <AnimatePresence>
        {showBillDetails && selectedBill && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBillDetails(false)}>
            <motion.div className="bill-details-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowBillDetails(false)}><FaTimes /></button>
              <div className="bill-details-content">
                <div className="bill-icon-large" style={{ backgroundColor: `${selectedBill.color || '#f59e0b'}15` }}>
                  {selectedBill.icon || <FaBolt style={{ color: selectedBill.color || '#f59e0b' }} />}
                </div>
                <h3>{selectedBill.name || selectedBill.provider}</h3>
                <p className="bill-customer-id">Customer ID: {selectedBill.customer_id}</p>
                <div className="bill-amount-large">₹{selectedBill.amount}</div>
                <div className="bill-due-large">
                  <FaCalendarAlt /> Due: {new Date(selectedBill.due_date).toLocaleDateString()}
                </div>
                <button className="pay-bill-btn-modal" onClick={handlePayBill}>
                  Pay Bill
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Merchant Orders Modal */}
      <AnimatePresence>
        {showMerchantOrdersModal && selectedMerchant && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMerchantOrdersModal(false)}>
            <motion.div className="merchant-orders-large-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowMerchantOrdersModal(false)}><FaTimes /></button>
              
              <div className="merchant-orders-header-large">
                <img src={selectedMerchant.logoUrl} alt={selectedMerchant.name} className="merchant-logo-large" 
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<span className="merchant-fallback-large">${selectedMerchant.name.charAt(0)}</span>`; }} />
                <div className="merchant-header-info">
                  <h2>{selectedMerchant.name}</h2>
                  <div className="merchant-stats">
                    <div className="merchant-stat">
                      <span className="stat-value">{selectedMerchant.totalOrders}</span>
                      <span className="stat-label">Orders</span>
                    </div>
                    <div className="merchant-stat">
                      <span className="stat-value">₹{selectedMerchant.totalSpent.toLocaleString()}</span>
                      <span className="stat-label">Total spent</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="merchant-orders-list-large">
                <h3>Order History</h3>
                <div className="orders-scroll-container">
                  {selectedMerchant.orders.length > 0 ? (
                    selectedMerchant.orders.map(order => (
                      <div key={order.id} className="merchant-order-card-large" onClick={() => handleOrderDetailsClick(order)}>
                        <div className="order-card-left-large">
                          <span className="order-date-large">{formatDate(order.createdAt)}</span>
                          <span className="order-id-large">Order #{order.id}</span>
                        </div>
                        <div className="order-card-middle">
                          <span className={`order-status-badge-large ${order.status}`}>{order.status?.replace(/_/g, ' ')}</span>
                          <span className="order-items-count">{order.items?.length} items</span>
                        </div>
                        <div className="order-card-right-large">
                          <span className="order-amount-large">₹{order.totalAmount}</span>
                          <FaChevronRight className="order-arrow-large" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-orders-message">
                      <p>No orders found</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderDetailsModal && selectedOrderDetails && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOrderDetailsModal(false)}>
            <motion.div className="order-details-large-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowOrderDetailsModal(false)}><FaTimes /></button>
              
              <div className="order-details-header-large">
                <h3>Order Details</h3>
                <span className={`order-status-badge-large ${selectedOrderDetails.status}`}>{selectedOrderDetails.status?.replace(/_/g, ' ')}</span>
              </div>
              
              <div className="order-details-info-large">
                <div className="info-row">
                  <span>Order ID:</span>
                  <strong>{selectedOrderDetails.id}</strong>
                </div>
                <div className="info-row">
                  <span>Date:</span>
                  <span>{new Date(selectedOrderDetails.createdAt).toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <span>Payment Method:</span>
                  <span>{selectedOrderDetails.paymentMethod}</span>
                </div>
                <div className="info-row">
                  <span>Total Amount:</span>
                  <strong className="total-amount">₹{selectedOrderDetails.totalAmount}</strong>
                </div>
              </div>
              
              <div className="order-items-large">
                <h4>Items Ordered</h4>
                <div className="items-scroll-container">
                  {selectedOrderDetails.items?.map((item, idx) => (
                    <div key={idx} className="order-item-large">
                      <div className="item-info">
                        <span className="item-quantity">{item.quantity}x</span>
                        <span className="item-name">{item.name}</span>
                      </div>
                      <div className="item-price">₹{item.total || (item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedOrderDetails.tracking && selectedOrderDetails.tracking.length > 0 && (
                <div className="order-tracking-large">
                  <h4>Delivery Tracking</h4>
                  <div className="tracking-steps">
                    {selectedOrderDetails.tracking.map((step, idx) => (
                      <div key={idx} className={`tracking-step ${step.completed ? 'completed' : ''}`}>
                        <div className="step-indicator">{step.completed ? '✓' : '○'}</div>
                        <div className="step-content">
                          <div className="step-label">{step.label}</div>
                          {step.time && <div className="step-time">{step.time}</div>}
                          {step.estimatedTime && !step.completed && <div className="step-estimate">Est. {step.estimatedTime}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button className="close-order-btn-large" onClick={() => setShowOrderDetailsModal(false)}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balance Check PIN Modal */}
      <AnimatePresence>
        {showBalanceModal && selectedBank && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBalanceModal(false)}>
            <motion.div className="pin-modal-white" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setShowBalanceModal(false)}><FaTimes /></button>
              
              <div className="modal-bank-header">
                <div className="modal-bank-logo" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                  {(() => {
                    const bankLogo = getBankLogoUrl(selectedBank.bank_name);
                    const hasError = imageErrors[`balance_pin_${selectedBank.id}`];
                    if (bankLogo && !hasError) {
                      return <img src={bankLogo} alt={selectedBank.bank_name} className="bank-logo-large" onError={() => setImageErrors(prev => ({ ...prev, [`balance_pin_${selectedBank.id}`]: true }))} />;
                    }
                    return <FaUniversity style={{ fontSize: '1.8rem', color: '#4f46e5' }} />;
                  })()}
                </div>
                <div className="modal-bank-details">
                  <h3 className="modal-bank-name-white">Check Balance</h3>
                  <p className="modal-account-white">Enter UPI PIN for {selectedBank.bank_name}</p>
                </div>
              </div>

              <div className="pin-input-group">
                <div className="pin-inputs-row">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      id={`pin-input-${index}`}
                      type={showPin ? 'text' : 'password'}
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handlePinInputChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinInputKeyDown(e, index)}
                      className={`pin-input-field ${digit ? 'filled' : ''}`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <label className="show-pin-checkbox">
                  <input 
                    type="checkbox" 
                    checked={showPin} 
                    onChange={() => setShowPin(!showPin)} 
                  />
                  <span>Show PIN</span>
                </label>
                {pinError && <p className="pin-error">{pinError}</p>}
              </div>

              <div className="modal-actions-white">
                <button className="modal-btn-white cancel" onClick={() => setShowBalanceModal(false)}>Cancel</button>
                <button className="modal-btn-white submit" onClick={verifyPinAndShowBalance} disabled={checkingBalance}>
                  {checkingBalance ? <FaSpinner className="spinner" /> : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;