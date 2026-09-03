import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import storageService, {
    getBankAccounts, 
    addBankAccount, 
    deleteBankAccount, 
    setPrimaryBankAccount, 
    updateBankBalance, 
    getBankBalances,
    verifyBankPin, 
    addTransaction,
    hasUpiPin, 
    updateCoinBalance,
    clearPinCache,
    setBankUpiPin,
    getBankUpiPins,
    refreshCurrentUserId
} from '../../services/storageService';
import { 
  FaUniversity, 
  FaPlus, 
  FaTrash, 
  FaStar, 
  FaCheckCircle,
  FaTimes,
  FaExclamationTriangle,
  FaLock,
  FaEye,
  FaArrowRight,
  FaTimesCircle,
  FaEyeSlash,
  FaKey,
  FaMoneyBillWave,
  FaMobile,
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaRupeeSign,
  FaBuilding,
  FaAt,
  FaMobileAlt,
  FaInfoCircle,
  FaEye as FaEyeIcon,
  FaSpinner
} from 'react-icons/fa';
import { SiGooglepay, SiPhonepe, SiPaytm } from 'react-icons/si';
import { MdVerified } from 'react-icons/md';
import toast from 'react-hot-toast';
import axios from 'axios';
import { bankAPI } from '../../services/apiService';
import './SettingsStyles.css';

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
  
  const fallbackName = bankName.toLowerCase().replace(/\s+/g, '-');
  return `/images/banks/${fallbackName}.png`;
};

const WithdrawFailedModal = ({ transactionData, onClose, onRetry }) => {
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
            <h2 style={{ color: '#ef4444' }}>Withdrawal Failed!</h2>
            <p className="amount-paid">₹{transactionData?.amount?.toLocaleString()}</p>
            <p className="to-text">from {transactionData?.bankName}</p>
          </motion.div>
          
          <motion.div 
            className="popupi-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: animationStage >= 3 ? 'auto' : 0, opacity: animationStage >= 3 ? 1 : 0 }}
          >
            <div className="detail-item">
              <span>Bank Account</span>
              <span>{transactionData?.bankName} (xxxx{transactionData?.accountNumber?.slice(-4)})</span>
            </div>
            <div className="detail-item">
              <span>Available Balance</span>
              <span>₹{transactionData?.currentBalance?.toLocaleString()}</span>
            </div>
            <div className="detail-item highlight failed">
              <span>Failure Reason</span>
              <span style={{ color: '#ef4444' }}>{transactionData?.failure_reason || 'Insufficient balance'}</span>
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

const BankAccounts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [showAtmModal, setShowAtmModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawFailedModal, setShowWithdrawFailedModal] = useState(false);
  const [withdrawFailedData, setWithdrawFailedData] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBalanceConfirmation, setShowBalanceConfirmation] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [atmAmount, setAtmAmount] = useState('');
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinStatusMap, setPinStatusMap] = useState({});
  
  // Show PIN states
  const [showPin, setShowPin] = useState(false);
  const [showAtmPin, setShowAtmPin] = useState(false);
  
  // Bank Selection Modal states
  const [showBankSelectionModal, setShowBankSelectionModal] = useState(false);
  const [pendingBankData, setPendingBankData] = useState(null);
  const [selectedBankForAdd, setSelectedBankForAdd] = useState(null);
  
  // PIN Change flow states
  const [pinChangeStep, setPinChangeStep] = useState(1);
  const [oldPinDigits, setOldPinDigits] = useState(['', '', '', '']);
  const [newPinDigits, setNewPinDigits] = useState(['', '', '', '']);
  const [confirmPinDigits, setConfirmPinDigits] = useState(['', '', '', '']);
  const [pinChangeError, setPinChangeError] = useState('');
  
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [balanceResult, setBalanceResult] = useState(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [pinFilled, setPinFilled] = useState([false, false, false, false]);
  const [pinError, setPinError] = useState('');
  
  const [expandedBank, setExpandedBank] = useState(null);
  const [atmAction, setAtmAction] = useState('deposit');
  const [upiIdInput, setUpiIdInput] = useState('');
  const isLoadingPinStatus = useRef(false);

  // Complete bank database with UPI handles mapping
  const bankDatabase = [
    { id: 1, name: 'State Bank of India', ifsc_prefix: 'SBIN', upi_handles: ['@sbi', '@oksbi', '@ybl', '@paytm'], color: '#2E7D32', logo: 'sbi.png' },
    { id: 2, name: 'HDFC Bank', ifsc_prefix: 'HDFC', upi_handles: ['@hdfc', '@okhdfcbank', '@ybl'], color: '#004C8C', logo: 'hdfc.png' },
    { id: 3, name: 'ICICI Bank', ifsc_prefix: 'ICIC', upi_handles: ['@icici', '@okicici', '@ybl'], color: '#AF4C9C', logo: 'icici.png' },
    { id: 4, name: 'Axis Bank', ifsc_prefix: 'UTIB', upi_handles: ['@axis', '@okaxis', '@ybl'], color: '#971A1F', logo: 'axis.png' },
    { id: 5, name: 'Bank of Baroda', ifsc_prefix: 'BARB', upi_handles: ['@baroda', '@okbob', '@ybl', '@paytm'], color: '#0033A0', logo: 'bob.png' },
    { id: 6, name: 'Punjab National Bank', ifsc_prefix: 'PUNB', upi_handles: ['@pnb', '@okpnb', '@ybl'], color: '#C2A25B', logo: 'pnb.png' },
    { id: 7, name: 'Canara Bank', ifsc_prefix: 'CNRB', upi_handles: ['@canara', '@okcanara', '@ybl'], color: '#1A4A7A', logo: 'canara.png' },
    { id: 8, name: 'Union Bank of India', ifsc_prefix: 'UBIN', upi_handles: ['@union', '@okuboi', '@ybl'], color: '#E7673A', logo: 'union.png' },
    { id: 9, name: 'Kotak Mahindra Bank', ifsc_prefix: 'KKBK', upi_handles: ['@kotak', '@okkotak', '@ybl'], color: '#F79F1F', logo: 'kotak.png' },
    { id: 10, name: 'IndusInd Bank', ifsc_prefix: 'INDB', upi_handles: ['@indus', '@okindus', '@ybl'], color: '#B61E2E', logo: 'indusind.png' },
    { id: 11, name: 'Yes Bank', ifsc_prefix: 'YESB', upi_handles: ['@yes', '@okyes', '@ybl'], color: '#142C64', logo: 'yesbank.png' },
    { id: 12, name: 'IDFC First Bank', ifsc_prefix: 'IDFB', upi_handles: ['@idfc', '@okidfc', '@ybl'], color: '#E57200', logo: 'idfc.png' },
    { id: 13, name: 'Karnataka Bank', ifsc_prefix: 'KARB', upi_handles: ['@ktk', '@karnataka', '@ybl'], color: '#006B54', logo: 'karnataka.png' },
    { id: 14, name: 'Indian Bank', ifsc_prefix: 'IDIB', upi_handles: ['@indian', '@okindian', '@ybl'], color: '#E57200', logo: 'indianbank.png' },
    { id: 15, name: 'Indian Overseas Bank', ifsc_prefix: 'IOBA', upi_handles: ['@iob', '@okiob', '@ybl'], color: '#2B5C8A', logo: 'iob.png' },
    { id: 16, name: 'Federal Bank', ifsc_prefix: 'FDRL', upi_handles: ['@federal', '@okfed', '@ybl'], color: '#E4173E', logo: 'federal.png' },
    { id: 17, name: 'South Indian Bank', ifsc_prefix: 'SIBL', upi_handles: ['@sib', '@oksib', '@ybl'], color: '#1E418C', logo: 'sib.png' }
  ];

  useEffect(() => {
    loadAccounts();
    loadBalances();
    
  }, []);

  const generateRealisticAccountNumber = () => {
    // Generate a 12-16 digit account number
    const length = Math.floor(Math.random() * 4) + 12; // 12-15 digits
    let accountNumber = '';
    for (let i = 0; i < length; i++) {
        accountNumber += Math.floor(Math.random() * 10);
    }
    return accountNumber;
};

  useEffect(() => {
    const loadPinStatus = async () => {
        if (isLoadingPinStatus.current) return;
        isLoadingPinStatus.current = true;
        
        const status = {};
        for (const account of accounts) {
            status[account.id] = await hasUpiPin(account.id);
        }
        setPinStatusMap(status);
        
        isLoadingPinStatus.current = false;
    };
    
    if (accounts.length > 0 && Object.keys(pinStatusMap).length !== accounts.length) {
        loadPinStatus();
    }
}, [accounts]);

useEffect(() => {
    const loadPinStatus = async () => {
        if (isLoadingPinStatus.current) return;
        isLoadingPinStatus.current = true;
        
        const status = {};
        for (const account of accounts) {
            status[account.id] = await hasUpiPin(account.id);
        }
        setPinStatusMap(status);
        
        isLoadingPinStatus.current = false;
    };
    
    if (accounts.length > 0 && Object.keys(pinStatusMap).length !== accounts.length) {
        loadPinStatus();
    }
}, [accounts]);

  // In BankAccounts.jsx, update the loadAccounts function
const loadAccounts = async (forceRefresh = false) => {
    try {
        const savedAccounts = await getBankAccounts();
        
        if (forceRefresh) {
            for (const account of savedAccounts) {
                clearPinCache(account.id);
            }
            // Clear pinStatusMap to force reload
            setPinStatusMap({});
        }
        
        setAccounts(savedAccounts);
    } catch (error) {
        console.error('Failed to load accounts:', error);
        toast.error('Failed to load bank accounts');
    }
};


// Replace loadBalances function
const loadBalances = async () => {
        try {
            const savedBalances = await getBankBalances();
            setBalances(savedBalances);
        } catch (error) {
            console.error('Failed to load balances:', error);
        }
    };


  const detectBankFromUpiId = (upiId) => {
    const lowerUpiId = upiId.toLowerCase().trim();
    const atIndex = lowerUpiId.indexOf('@');
    if (atIndex === -1) return null;
    
    const handle = lowerUpiId.substring(atIndex);
    
    for (const bank of bankDatabase) {
      for (const bankHandle of bank.upi_handles) {
        if (handle === bankHandle || handle.includes(bankHandle)) {
          return bank;
        }
      }
    }
    return bankDatabase[0];
  };

  const bankAlreadyExists = (bankName) => {
    return accounts.some(acc => acc.bank_name === bankName);
  };
  

  // Original working Razorpay handler - KEPT AS IS
  const handleRazorpaySuccess = async (response) => {
        let enteredUpiId = upiIdInput;
        
        if (!enteredUpiId) {
            const possibleUpiIds = ['user@baroda', 'user@ktk', 'user@iob', 'user@sbi', 'user@hdfc', 'user@icici', 'user@axis'];
            const timestamp = Date.now();
            const randomIndex = timestamp % possibleUpiIds.length;
            enteredUpiId = possibleUpiIds[randomIndex];
        }
        
        const detectedBank = detectBankFromUpiId(enteredUpiId);
        
        if (!detectedBank) {
            toast.error('Could not detect bank from UPI ID');
            return;
        }
        
        if (bankAlreadyExists(detectedBank.name)) {
            toast.error(`You already have a ${detectedBank.name} account linked`);
            return;
        }
        
        const newAccount = {
            bank_name: detectedBank.name,
            account_number: Math.random().toString().slice(2, 14),
            ifsc_code: `${detectedBank.ifsc_prefix}0${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            account_holder_name: user?.name || 'G Nihal',
            is_primary: accounts.length === 0,
            upi_id: enteredUpiId,
            payment_id: response.razorpay_payment_id
        };
        
        try {
            const addedAccount = await addBankAccount(newAccount);
            await loadAccounts();
            await loadBalances();
            
            toast.success(`${detectedBank.name} linked successfully! +1 SabAI Gem credited!`);
            
            // Trigger event to update dashboard
            window.dispatchEvent(new Event('bankAccountsUpdated'));
            
            setShowAddModal(false);
            setUpiIdInput('');
            setShowBankSelectionModal(false);
            setPendingBankData(null);
            setSelectedBankForAdd(null);
            
        } catch (error) {
            console.error('Failed to add bank account:', error);
            toast.error('Failed to link bank account');
        }
    };

  // Original working add bank function - MODIFIED to show selection modal first
  const handleAddBank = () => {
    if (!upiIdInput) {
      toast.error('Please enter your UPI ID (e.g., name@bankhandle)');
      return;
    }
    
    if (!upiIdInput.includes('@')) {
      toast.error('Invalid UPI ID format. Please enter ID like: name@bankhandle');
      return;
    }
    
    // Detect bank from UPI ID
    const detectedBank = detectBankFromUpiId(upiIdInput);
    
    if (!detectedBank) {
      toast.error('Could not detect bank from UPI ID. Please enter a valid UPI ID with correct bank handle.');
      return;
    }
    
    if (bankAlreadyExists(detectedBank.name)) {
      toast.error(`You already have a ${detectedBank.name} account linked. Only one account per bank is allowed.`);
      return;
    }
    
    // Store the UPI ID and detected bank for later use
    setPendingBankData({
      upiId: upiIdInput,
      detectedBank: detectedBank
    });
    
    // Open custom bank selection modal
    setShowBankSelectionModal(true);
  };

  // Link a bank only after a server-created Razorpay test order succeeds.
  const initiateRazorpayPayment = async () => {
  if (!selectedBankForAdd || !pendingBankData) {
    toast.error('Please select a bank');
    return;
  }
  const detectedBank = pendingBankData.detectedBank;
  if (bankAlreadyExists(detectedBank.name)) { toast.error(`You already have a ${detectedBank.name} account linked.`); return; }
  try {
    if (!window.Razorpay) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.onload = resolve; script.onerror = reject; document.body.appendChild(script);
      });
    }
    const orderResponse = await bankAPI.createVerificationOrder();
    const order = orderResponse.data.data;
    const account = {
      bank_name: detectedBank.name,
      account_number: generateRealisticAccountNumber(),
      ifsc_code: `${detectedBank.ifsc_prefix}0${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      account_holder_name: user?.name || 'Account Holder',
      is_primary: accounts.length === 0,
      upi_id: pendingBankData.upiId
    };
    const checkout = new window.Razorpay({
      key: order.key, order_id: order.orderId, amount: order.amount, currency: order.currency,
      name: 'SabAI Pay', description: 'Test bank-link verification (₹1)',
      prefill: { name: user?.name || '', email: user?.email || '', contact: user?.phone_number || '' },
      theme: { color: '#4f46e5' },
      handler: async (response) => {
        try {
          const saved = await bankAPI.createVerifiedAccount({ ...response, account });
          const addedAccount = saved.data.data;
          await loadAccounts(); await loadBalances();
          setShowBankSelectionModal(false); setPendingBankData(null); setSelectedBankForAdd(null); setUpiIdInput(''); setShowAddModal(false);
          setSelectedAccount(addedAccount); setPinChangeStep(2); setNewPinDigits(['', '', '', '']); setConfirmPinDigits(['', '', '', '']); setPinChangeError(''); setShowPinSetupModal(true);
          window.dispatchEvent(new Event('bankAccountsUpdated'));
          toast.success(`${detectedBank.name} linked. Set its UPI PIN to begin using it.`);
        } catch (error) { toast.error(error.response?.data?.message || 'Razorpay payment could not be verified'); }
      },
      modal: { ondismiss: () => toast('Bank verification cancelled') }
    });
    checkout.open();
  } catch (error) { console.error('Failed to link bank account:', error); toast.error(error.response?.data?.message || 'Failed to link bank account'); }
  return;
  
  // Check if this bank was previously removed and has saved balance
  const removedBalances = JSON.parse(localStorage.getItem('removedBankBalances') || '{}');
  const savedBalance = removedBalances[pendingBankData.detectedBank.name] || 0;
  
  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_your_key',
    amount: 100,
    currency: 'INR',
    name: 'SabAI Pay',
    description: savedBalance > 0 ? 'Restore your bank account (₹1 verification)' : 'Link your bank account (₹1 verification)',
    image: '/sabailogo.png',
    handler: async function(response) {
    const detectedBank = pendingBankData.detectedBank;
    
    if (bankAlreadyExists(detectedBank.name)) {
        toast.error(`You already have a ${detectedBank.name} account linked.`);
        setShowBankSelectionModal(false);
        setPendingBankData(null);
        setSelectedBankForAdd(null);
        return;
    }
    
    // Check for saved balance
    const removedBalancesCheck = JSON.parse(localStorage.getItem('removedBankBalances') || '{}');
    const savedBalanceAmount = removedBalancesCheck[detectedBank.name] || 0;
    
    // Create a REAL account number (not random)
    const accountNumber = generateRealisticAccountNumber();
    const ifscCode = `${detectedBank.ifsc_prefix}0${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const newAccount = {
        bank_name: detectedBank.name,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        account_holder_name: user?.name || 'Account Holder',
        is_primary: accounts.length === 0,
        upi_id: pendingBankData.upiId,
        payment_id: response.razorpay_payment_id,
        restored_balance: savedBalanceAmount > 0
    };
    
    try {
        // Add bank account to database
        const addedAccount = await addBankAccount(newAccount);
        
        // Refresh accounts list
        await loadAccounts();
        await loadBalances();
        
        // Handle restored balance if any
        if (savedBalanceAmount > 0) {
            await updateBankBalance(addedAccount.id, savedBalanceAmount, true);
            
            // Remove from removed balances storage
            const updatedRemovedBalances = { ...removedBalancesCheck };
            delete updatedRemovedBalances[detectedBank.name];
            localStorage.setItem('removedBankBalances', JSON.stringify(updatedRemovedBalances));
            
            toast.success(`${detectedBank.name} linked successfully! Restored balance of ₹${savedBalanceAmount.toLocaleString()}`);
            
            // Close modals
            setShowBankSelectionModal(false);
            setPendingBankData(null);
            setSelectedBankForAdd(null);
            setUpiIdInput('');
            setShowAddModal(false);
            
            // Trigger event to update dashboard
            window.dispatchEvent(new Event('bankAccountsUpdated'));
            
        } else {
            // NEW ACCOUNT: Prompt user to set PIN immediately
            toast.success(`${detectedBank.name} linked successfully! +1 SabAI Gem credited!`);
            
            // Close the bank selection modal
            setShowBankSelectionModal(false);
            setPendingBankData(null);
            setSelectedBankForAdd(null);
            setUpiIdInput('');
            setShowAddModal(false);
            
            // Open PIN setup modal for the newly added account
            const newlyAddedAccount = accounts.find(a => a.id === addedAccount.id) || addedAccount;
            setSelectedAccount(newlyAddedAccount);
            setPinChangeStep(2); // Start at new PIN entry (skip old PIN)
            setNewPinDigits(['', '', '', '']);
            setConfirmPinDigits(['', '', '', '']);
            setPinChangeError('');
            setShowPinSetupModal(true);
            
            toast.info(`Please set a UPI PIN for your ${detectedBank.name} account to start using it.`);
        }
        
        // Trigger event to update dashboard
        window.dispatchEvent(new Event('bankAccountsUpdated'));
        
    } catch (error) {
        console.error('Failed to add bank account:', error);
        toast.error('Failed to link bank account');
    }
},
    modal: { 
      ondismiss: () => {
        toast.error('Payment cancelled');
        setShowBankSelectionModal(false);
        setPendingBankData(null);
        setSelectedBankForAdd(null);
      } 
    },
    prefill: {
      name: user?.name || 'Customer',
      email: user?.email || 'customer@example.com',
      contact: user?.phone_number || '9876543210',
      vpa: pendingBankData.upiId
    },
    theme: { color: '#4f46e5' },
    method: { upi: true }
  };

  try {
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('Razorpay error:', error);
    toast.error('Failed to open payment window');
  }
};
  const handlePaymentSuccess = (response) => {
    // Payment successful - add the bank account
    const detectedBank = pendingBankData.detectedBank;
    
    if (bankAlreadyExists(detectedBank.name)) {
      toast.error(`You already have a ${detectedBank.name} account linked.`);
      setShowBankSelectionModal(false);
      setPendingBankData(null);
      setSelectedBankForAdd(null);
      return;
    }
    
    const newAccount = {
      id: Date.now(),
      bank_name: detectedBank.name,
      account_number: Math.random().toString().slice(2, 14),
      ifsc_code: `${detectedBank.ifsc_prefix}0${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      account_holder_name: user?.name || 'G Nihal',
      is_primary: accounts.length === 0,
      is_verified: true,
      upi_handles: detectedBank.upi_handles,
      bank_color: detectedBank.color,
      bank_logo: detectedBank.logo,
      upi_id: pendingBankData.upiId,
      hasPin: false,
      created_at: new Date().toISOString(),
      payment_id: response.razorpay_payment_id,
      order_id: response.razorpay_order_id
    };
    
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    localStorage.setItem('bankAccounts', JSON.stringify(updatedAccounts));
    
    const updatedBalances = { ...balances, [newAccount.id]: 0 };
    setBalances(updatedBalances);
    localStorage.setItem('bankBalances', JSON.stringify(updatedBalances));
    
    // Add ₹1 cashback to coins
    const currentCoins = parseInt(localStorage.getItem('coinBalance') || '0');
    const newCoins = currentCoins + 1;
    localStorage.setItem('coinBalance', newCoins.toString());
    
    toast.success(`${detectedBank.name} linked successfully! +1 SabAI Gem credited!`);
    setShowBankSelectionModal(false);
    setPendingBankData(null);
    setSelectedBankForAdd(null);
    setUpiIdInput('');
    
    // Trigger event to update dashboard
    window.dispatchEvent(new Event('bankAccountsUpdated'));
  };

  const handleRemoveAccount = async (account) => {
        if (account.is_primary && accounts.length > 1) {
            toast.error('Please set another account as primary before removing this one');
            return;
        }
        
        try {
            await deleteBankAccount(account.id);
            await loadAccounts();
            await loadBalances();
            
            toast.success('Bank account removed successfully');
            setShowRemoveConfirm(false);
            setSelectedAccount(null);
        } catch (error) {
            console.error('Failed to remove account:', error);
            toast.error('Failed to remove bank account');
        }
    };
// Replace handleSetPrimary function
const handleSetPrimary = async (accountId) => {
        try {
            await setPrimaryBankAccount(accountId);
            await loadAccounts();
            toast.success('Primary account updated');
        } catch (error) {
            console.error('Failed to set primary:', error);
            toast.error('Failed to update primary account');
        }
    };

  // Replace hasUpiPin function
const hasUpiPinForAccount = async (accountId) => {
    return await hasUpiPin(accountId);
};

  const openBalanceModal = (account) => {
    // Use pinStatusMap instead of calling hasUpiPin directly
    if (!pinStatusMap[account.id]) {
        toast.error(`Please set UPI PIN for ${account.bank_name} first`);
        return;
    }
    setSelectedAccount(account);
    setPinDigits(['', '', '', '']);
    setPinFilled([false, false, false, false]);
    setPinError('');
    setShowPin(false);
    setShowBalanceModal(true);
};

  // Old PIN input handlers
const handleOldPinInputChange = (index, value) => {
  if (value && !/^\d$/.test(value)) return;
  
  const newPin = [...oldPinDigits];
  newPin[index] = value || '';
  setOldPinDigits(newPin);
  
  if (value && index < 3) {
    const nextInput = document.getElementById(`old-pin-${index + 1}`);
    if (nextInput) nextInput.focus();
  }
};

// New PIN input handlers
const handleNewPinInputChange = (index, value) => {
  if (value && !/^\d$/.test(value)) return;
  
  const newPin = [...newPinDigits];
  newPin[index] = value || '';
  setNewPinDigits(newPin);
  
  if (value && index < 3) {
    const nextInput = document.getElementById(`new-pin-${index + 1}`);
    if (nextInput) nextInput.focus();
  }
};

// Confirm PIN input handlers
const handleConfirmPinInputChange = (index, value) => {
  if (value && !/^\d$/.test(value)) return;
  
  const newPin = [...confirmPinDigits];
  newPin[index] = value || '';
  setConfirmPinDigits(newPin);
  
  if (value && index < 3) {
    const nextInput = document.getElementById(`confirm-pin-${index + 1}`);
    if (nextInput) nextInput.focus();
  }
};

// Submit PIN change
const handlePinChangeSubmit = async () => {
    setLoading(true);
    
    try {
        if (pinChangeStep === 1) {
            // Verify old PIN
            const oldPin = oldPinDigits.join('');
            if (oldPin.length !== 4) {
                setPinChangeError('Please enter complete PIN');
                setLoading(false);
                return;
            }
            
            const isValid = await verifyBankPin(selectedAccount.id, oldPin);
            if (!isValid) {
                setPinChangeError('Incorrect PIN. Please try again.');
                setOldPinDigits(['', '', '', '']);
                document.getElementById('old-pin-0')?.focus();
                setLoading(false);
                return;
            }
            
            setPinChangeStep(2);
            setPinChangeError('');
            setLoading(false);
            
        } else if (pinChangeStep === 2) {
            // Enter new PIN
            const newPin = newPinDigits.join('');
            if (newPin.length !== 4) {
                setPinChangeError('Please enter 4-digit PIN');
                setLoading(false);
                return;
            }
            
            // Validate PIN is not too simple
            if (newPin === '0000' || newPin === '1234' || newPin === '1111' || newPin === '9999') {
                setPinChangeError('Please choose a more secure PIN');
                setNewPinDigits(['', '', '', '']);
                setLoading(false);
                return;
            }
            
            setPinChangeStep(3);
            setPinChangeError('');
            setLoading(false);
            
        } else {
            // Confirm new PIN
            const newPin = newPinDigits.join('');
            const confirmPin = confirmPinDigits.join('');
            
            if (confirmPin.length !== 4) {
                setPinChangeError('Please enter 4-digit confirmation PIN');
                setLoading(false);
                return;
            }
            
            if (newPin !== confirmPin) {
                setPinChangeError('PINs do not match');
                setConfirmPinDigits(['', '', '', '']);
                document.getElementById('confirm-pin-0')?.focus();
                setLoading(false);
                return;
            }
            
            // Set the PIN
            const success = await setBankUpiPin(selectedAccount.id, newPin);
            
            if (success) {
                toast.success(`UPI PIN ${pinStatusMap[selectedAccount.id] ? 'changed' : 'set'} successfully for ${selectedAccount.bank_name}`);
                setShowPinSetupModal(false);
                
                // Clear cache and refresh accounts
                clearPinCache(selectedAccount.id);
                await loadAccounts(true);
                
                // Reset all PIN fields
                setOldPinDigits(['', '', '', '']);
                setNewPinDigits(['', '', '', '']);
                setConfirmPinDigits(['', '', '', '']);
                setPinChangeStep(1);
                
            } else {
                throw new Error('Failed to set PIN');
            }
            setLoading(false);
        }
    } catch (error) {
        console.error('PIN change error:', error);
        toast.error('Failed to set PIN. Please try again.');
        setLoading(false);
    }
};
  // PIN input handlers for balance check
  const handlePinInputChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newPin = [...pinDigits];
    newPin[index] = value || '';
    setPinDigits(newPin);
    
    const newFilled = [...pinFilled];
    newFilled[index] = value !== '';
    setPinFilled(newFilled);
    
    if (value && index < 3) {
      const nextInput = document.getElementById(`balance-pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePinInputKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`balance-pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const verifyPinAndShowBalance = async () => {
    const pinString = pinDigits.join('');
    if (pinString.length !== 4) {
        setPinError('Please enter complete PIN');
        return;
    }

    setCheckingBalance(true);
    
    try {
        // Use the async verifyBankPin from storageService
        const isValid = await verifyBankPin(selectedAccount.id, pinString);
        
        if (!isValid) {
            setPinError('Incorrect PIN. Please try again.');
            setPinDigits(['', '', '', '']);
            setPinFilled([false, false, false, false]);
            document.getElementById('balance-pin-0')?.focus();
            setCheckingBalance(false);
            return;
        }
        
        // PIN is correct, show balance
        const currentBalance = balances[selectedAccount.id] || 0;
        setBalanceResult({
            bankName: selectedAccount.bank_name,
            accountNumber: selectedAccount.account_number,
            balance: currentBalance
        });
        setShowBalanceModal(false);
        setShowBalanceConfirmation(true);
        toast.success(`Balance fetched for ${selectedAccount.bank_name}`);
        
    } catch (error) {
        console.error('Balance check error:', error);
        setPinError('Verification failed. Please try again.');
    } finally {
        setCheckingBalance(false);
    }
};


  // PIN Change Modal Handlers
  const openPinChangeModal = (account) => {
    setSelectedAccount(account);
    setPinChangeStep(1);
    setOldPinDigits(['', '', '', '']);
    setNewPinDigits(['', '', '', '']);
    setConfirmPinDigits(['', '', '', '']);
    setPinChangeError('');
    setShowPinSetupModal(true);
  };

  const openSetPinModal = (account) => {
    setSelectedAccount(account);
    setPinChangeStep(2); // Start at new PIN entry (skip old PIN verification)
    setNewPinDigits(['', '', '', '']);
    setConfirmPinDigits(['', '', '', '']);
    setPinChangeError('');
    setShowPinSetupModal(true);
};



  const getPinCirclesForStep = () => {
    let digits;
    if (pinChangeStep === 1) digits = oldPinDigits;
    else if (pinChangeStep === 2) digits = newPinDigits;
    else digits = confirmPinDigits;
    
    const filled = digits.filter(d => d !== '').length;
    return (
      <div className="pin-circles-balance">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`pin-circle-balance ${i < filled ? 'filled' : ''}`} />
        ))}
      </div>
    );
  };

const getPinChangeTitle = () => {
    const hasExistingPin = pinStatusMap[selectedAccount?.id]; // Use state instead of direct call
    if (!hasExistingPin) return 'Set UPI PIN';
    if (pinChangeStep === 1) return 'Enter Current PIN';
    if (pinChangeStep === 2) return 'Enter New PIN';
    return 'Confirm New PIN';
};

const getPinChangeSubtitle = () => {
    const hasExistingPin = pinStatusMap[selectedAccount?.id];
    if (!hasExistingPin) return 'Create a 4-digit UPI PIN for your account. This PIN will be used for all transactions.';
    if (pinChangeStep === 1) return 'Verify your identity with current PIN';
    if (pinChangeStep === 2) return 'Choose a new 4-digit PIN';
    return 'Confirm your new PIN';
};

  const handleAtmPinChange = (index, value) => {
    if (isNaN(value)) return;
    const newPin = [...pinDigits];
    newPin[index] = value;
    setPinDigits(newPin);
    if (value && index < 3) {
      const nextInput = document.getElementById(`atm-pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleAtmPinKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      const prevInput = document.getElementById(`atm-pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // In BankAccounts.jsx - Replace verifyPinAndProceed

const verifyPinAndProceed = async () => {
    const pin = pinDigits.join('');
    if (pin.length !== 4) {
        setPinError('Please enter 4-digit UPI PIN');
        return;
    }

    try {
        setLoading(true);
        setPinError(''); // Clear previous error
        
        // Use the async verifyBankPin from storageService
        const isValid = await verifyBankPin(selectedAccount.id, pin);
        
        if (!isValid) {
            setPinError('Incorrect PIN. Please try again.');
            setPinDigits(['', '', '', '']); // Clear PIN fields
            // Focus on first input
            setTimeout(() => {
                const firstInput = document.getElementById('atm-pin-0');
                if (firstInput) firstInput.focus();
            }, 100);
            setLoading(false);
            return;
        }
        
        // PIN is correct, close PIN modal and open deposit/withdraw modal
        setShowPinModal(false);
        setPinDigits(['', '', '', '']);
        setPinError('');
        setShowAtmPin(false);
        
        if (atmAction === 'deposit') {
            setShowDepositModal(true);
        } else {
            setShowWithdrawModal(true);
        }
        
    } catch (error) {
        console.error('PIN verification failed:', error);
        setPinError('Verification failed. Please try again.');
        setPinDigits(['', '', '', '']);
    } finally {
        setLoading(false);
    }
};

const handleDeposit = async () => {
    const amount = parseFloat(atmAmount);
    if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
    }
    if (amount > 100000000) {
        toast.error('Maximum deposit amount is ₹10,00,00,000');
        return;
    }

    try {
        setLoading(true);
        
        console.log('Depositing:', { accountId: selectedAccount.id, amount }); // Debug log
        
        // Use backend API for deposit
        const newBalance = await updateBankBalance(selectedAccount.id, amount, true);
        
        console.log('Deposit successful, new balance:', newBalance); // Debug log
        
        // Update local state
        const updatedBalances = { ...balances, [selectedAccount.id]: newBalance };
        setBalances(updatedBalances);
        
        setTransactionResult({
            action: 'deposit',
            amount: amount,
            oldBalance: balances[selectedAccount.id] || 0,
            newBalance: newBalance,
            bankName: selectedAccount.bank_name,
            accountNumber: selectedAccount.account_number
        });
        setShowBalanceConfirmation(true);
        
        setAtmAmount('');
        setShowDepositModal(false);
        setSelectedAccount(null);
        
        toast.success(`₹${amount.toLocaleString()} deposited successfully!`);
        
        // Refresh balances
        await loadBalances();
        
    } catch (error) {
        console.error('Deposit failed:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Deposit failed';
        toast.error(errorMessage);
    } finally {
        setLoading(false);
    }
};

const handleWithdraw = async () => {
  const amount = parseFloat(atmAmount);
  if (isNaN(amount) || amount <= 0) {
    toast.error('Please enter a valid amount');
    return;
  }
  if (amount > 100000000) {
    toast.error('Maximum withdrawal amount is ₹10,00,00,000');
    return;
  }

  const currentBalance = balances[selectedAccount.id] || 0;
  if (amount > currentBalance) {
    // Show failed modal instead of just toast
    setWithdrawFailedData({
      amount: amount,
      bankName: selectedAccount.bank_name,
      accountNumber: selectedAccount.account_number,
      currentBalance: currentBalance,
      failure_reason: 'Insufficient balance'
    });
    setShowWithdrawFailedModal(true);
    setShowWithdrawModal(false);
    return;
  }

  try {
    setLoading(true);
    
    // Use backend API for withdrawal
    const newBalance = await updateBankBalance(selectedAccount.id, amount, false);
    
    // Update local state
    const updatedBalances = { ...balances, [selectedAccount.id]: newBalance };
    setBalances(updatedBalances);
    
    setTransactionResult({
      action: 'withdraw',
      amount: amount,
      oldBalance: currentBalance,
      newBalance: newBalance,
      bankName: selectedAccount.bank_name,
      accountNumber: selectedAccount.account_number
    });
    setShowBalanceConfirmation(true);
    
    setAtmAmount('');
    setShowWithdrawModal(false);
    setSelectedAccount(null);
    
    toast.success(`₹${amount.toLocaleString()} withdrawn successfully!`);
    
    // Refresh balances
    await loadBalances();
    
  } catch (error) {
    console.error('Withdrawal failed:', error);
    setWithdrawFailedData({
      amount: amount,
      bankName: selectedAccount.bank_name,
      accountNumber: selectedAccount.account_number,
      currentBalance: currentBalance,
      failure_reason: error.response?.data?.message || error.message || 'Withdrawal failed'
    });
    setShowWithdrawFailedModal(true);
    setShowWithdrawModal(false);
  } finally {
    setLoading(false);
  }
};

  const openAtmModal = (account, action) => {
    // Use pinStatusMap instead of calling hasUpiPin directly
    if (!pinStatusMap[account.id]) {
        toast.error(`Please set UPI PIN for ${account.bank_name} first`);
        return;
    }
    setSelectedAccount(account);
    setAtmAction(action);
    setAtmAmount('');
    setPinDigits(['', '', '', '']);
    setShowAtmPin(false);
    setShowPinModal(true);
};

  const toggleBankExpand = (bankId) => {
    setExpandedBank(expandedBank === bankId ? null : bankId);
  };

  const upiApps = [
    { id: 'gpay', name: 'Google Pay', icon: SiGooglepay, color: '#4285F4', linked: true },
    { id: 'phonepe', name: 'PhonePe', icon: SiPhonepe, color: '#5F259F', linked: true },
    { id: 'paytm', name: 'Paytm', icon: SiPaytm, color: '#00BAF2', linked: true }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bank-accounts-settings">
      <div className="settings-header">
        <h2>UPI & Bank Accounts</h2>
        <button className="add-btn" onClick={() => setShowAddModal(true)}><FaPlus /> Add Bank Account</button>
      </div>

      {/* Local ATM Machine Section */}
      <div className="atm-machine-section">
        <div className="atm-header">
          <FaMoneyBillWave className="atm-icon" />
          <h3>Local ATM Machine</h3>
        </div>
        <p className="section-note">Deposit or withdraw money from your linked bank accounts</p>
        
        {accounts.length === 0 ? (
          <div className="no-accounts-mini">
            <p>No bank accounts linked. Add a bank account to use ATM features.</p>
          </div>
        ) : (
          <div className="atm-banks-grid">
            {accounts.map(account => {
              const bankLogo = getBankLogoUrl(account.bank_name);
              const hasImageError = imageErrors[`atm_${account.id}`];
              
              return (
                <div key={account.id} className="atm-bank-card">
                  <div className="atm-bank-info">
                    <div className="bank-icon-small" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                      {!hasImageError ? (
                        <img 
                          src={bankLogo} 
                          alt={account.bank_name}
                          className="bank-logo-image"
                          onError={() => setImageErrors(prev => ({ ...prev, [`atm_${account.id}`]: true }))}
                        />
                      ) : (
                        <FaUniversity style={{ color: '#4f46e5', fontSize: '1.2rem' }} />
                      )}
                    </div>
                    <div className="atm-bank-details">
                      <h4>{account.bank_name}</h4>
                      <p className="account-number">xxxx{account.account_number?.slice(-4)}</p>
                    </div>
                  </div>
                  <div className="atm-actions">
                    <button className="atm-deposit-btn" onClick={() => openAtmModal(account, 'deposit')}>
                      <FaArrowDown /> Deposit
                    </button>
                    <button className="atm-withdraw-btn" onClick={() => openAtmModal(account, 'withdraw')}>
                      <FaArrowUp /> Withdraw
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Balance Confirmation Modal */}
      {showBalanceConfirmation && (transactionResult || balanceResult) && (
        <div className="modal-overlay" onClick={() => setShowBalanceConfirmation(false)}>
          <motion.div className="balance-confirmation-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="confirmation-header">
              <div className={`confirmation-icon ${transactionResult?.action === 'deposit' ? 'deposit-icon' : transactionResult?.action === 'withdraw' ? 'withdraw-icon' : 'deposit-icon'}`}>
                {transactionResult?.action === 'deposit' ? <FaArrowDown /> : transactionResult?.action === 'withdraw' ? <FaArrowUp /> : <FaEyeIcon />}
              </div>
              <h3>{transactionResult ? (transactionResult.action === 'deposit' ? 'Deposit Successful!' : 'Withdrawal Successful!') : 'Balance Details'}</h3>
            </div>
            <div className="confirmation-details">
              {transactionResult ? (
                <>
                  <p className="amount">₹{transactionResult.amount.toLocaleString()}</p>
                  <div className="balance-info">
                    <div className="balance-row"><span>Previous Balance:</span><span>₹{transactionResult.oldBalance.toLocaleString()}</span></div>
                    <div className="balance-row highlight"><span>New Balance:</span><strong>₹{transactionResult.newBalance.toLocaleString()}</strong></div>
                  </div>
                </>
              ) : (
                <div className="balance-info">
                  <div className="balance-row"><span>Bank:</span><strong>{balanceResult?.bankName}</strong></div>
                  <div className="balance-row"><span>Account:</span><span>xxxx{balanceResult?.accountNumber?.slice(-4)}</span></div>
                  <div className="balance-row highlight"><span>Available Balance:</span><strong>₹{balanceResult?.balance.toLocaleString()}</strong></div>
                </div>
              )}
              <div className="bank-info-confirmation">
                <div className="bank-icon-small-confirmation">
                  {(() => {
                    const bankLogo = getBankLogoUrl(transactionResult?.bankName || balanceResult?.bankName);
                    const hasImageError = imageErrors[`confirmation_${transactionResult?.bankName || balanceResult?.bankName}`];
                    if (!hasImageError && bankLogo) {
                      return <img src={bankLogo} alt="bank" className="bank-logo-small" onError={() => setImageErrors(prev => ({ ...prev, [`confirmation_${transactionResult?.bankName}`]: true }))} />;
                    }
                    return <FaUniversity />;
                  })()}
                </div>
                <span>{transactionResult?.bankName || balanceResult?.bankName}</span>
              </div>
            </div>
            <button className="confirmation-close-btn" onClick={() => { setShowBalanceConfirmation(false); setTransactionResult(null); setBalanceResult(null); }}>OK</button>
          </motion.div>
        </div>
      )}

      {/* Linked Bank Accounts */}
      <div className="bank-accounts-list">
        <h3>Linked Bank Accounts</h3>
        {accounts.length === 0 ? (
          <div className="no-accounts">
            <FaUniversity className="no-accounts-icon" />
            <p>No bank accounts linked yet</p>
            <button className="add-first-btn" onClick={() => setShowAddModal(true)}><FaPlus /> Link your first bank account</button>
          </div>
        ) : (
          accounts.map(account => {
            const hasPin = pinStatusMap[account.id];
            const bankLogo = getBankLogoUrl(account.bank_name);
            const hasImageError = imageErrors[`bank_${account.id}`];
            
            return (
              <div key={account.id} className="bank-account-card">
                <div className="bank-card-header" onClick={() => toggleBankExpand(account.id)}>
                  <div className="bank-icon" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                    {!hasImageError && bankLogo ? (
                      <img src={bankLogo} alt={account.bank_name} className="bank-logo-image" onError={() => setImageErrors(prev => ({ ...prev, [`bank_${account.id}`]: true }))} />
                    ) : (
                      <FaUniversity style={{ color: '#4f46e5', fontSize: '1.3rem' }} />
                    )}
                  </div>
                  <div className="bank-info">
                    <div className="bank-name-row">
                      <h4>{account.bank_name}</h4>
                      {account.is_verified && <MdVerified className="verified-icon" />}
                      {hasPin && <span className="pin-status-badge"><FaLock /> PIN Set</span>}
                      {account.is_primary && <span className="primary-badge-small">Primary</span>}
                    </div>
                    <p className="account-number">xxxx{account.account_number.slice(-4)}</p>
                    <p className="ifsc">{account.ifsc_code}</p>
                  </div>
                  <div className="bank-actions">
                    {!account.is_primary && (
                      <button className="set-primary-btn" onClick={(e) => { e.stopPropagation(); handleSetPrimary(account.id); }}>
                        <FaStar /> Set Primary
                      </button>
                    )}
                    <button className="check-balance-btn" onClick={(e) => { e.stopPropagation(); openBalanceModal(account); }} disabled={!hasPin}>
                      <FaEyeIcon /> Check Balance
                    </button>
                    <button className="delete-btn" onClick={(e) => { e.stopPropagation(); setSelectedAccount(account); setShowRemoveConfirm(true); }}>
                      <FaTrash />
                    </button>
                    <span className={`expand-icon ${expandedBank === account.id ? 'expanded' : ''}`}>▼</span>
                  </div>
                </div>

                {expandedBank === account.id && (
                  <motion.div className="bank-expanded-section" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <div className="upi-pin-management">
                      <h4><FaLock className="section-icon" /> UPI PIN for {account.bank_name}</h4>
                      {hasPin ? (
                        <div className="pin-status">
                          <div className="pin-info"><FaCheckCircle className="pin-set-icon" /><span>PIN is set for this account</span></div>
                          <button className="change-pin-btn" onClick={() => openPinChangeModal(account)}><FaKey /> Change PIN</button>
                        </div>
                      ) : (
                        <div className="pin-status">
                          <div className="pin-info"><FaExclamationTriangle className="pin-not-set-icon" /><span>PIN not set for this account</span></div>
                          <button className="set-pin-btn-small" onClick={() => openSetPinModal(account)}><FaKey /> Set PIN</button>
                        </div>
                      )}
                    </div>
                    <div className="bank-details">
                      <p><strong>Account Holder:</strong> {account.account_holder_name}</p>
                      <p><strong>IFSC Code:</strong> {account.ifsc_code}</p>
                      <p><strong>UPI ID:</strong> {account.upi_id || 'Not set'}</p>
                      <div className="upi-handles-expanded">
                        <strong>UPI Handles:</strong>
                        <div className="handles-list">
                          {account.upi_handles?.map(handle => <span key={handle} className="upi-handle">{handle}</span>)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Bank Account Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setUpiIdInput(''); }}>
          <div className="bank-add-modal-white" onClick={e => e.stopPropagation()}>
            <div className="modal-header-white">
              <h2>Add Bank Account</h2>
              <button className="modal-close-white" onClick={() => { setShowAddModal(false); setUpiIdInput(''); }}><FaTimes /></button>
            </div>
            <div className="modal-body-white">
              <p className="modal-description-white">Enter your UPI ID to link your bank account.</p>
              <div className="upi-input-group-white">
                <FaAt className="upi-input-icon-white" />
                <input
                  type="text"
                  placeholder="e.g., username@okhdfcbank"
                  value={upiIdInput}
                  onChange={(e) => setUpiIdInput(e.target.value)}
                  className="upi-id-input-white"
                  autoFocus
                />
              </div>
              <div className="upi-examples-white">
                <p>Examples:</p>
                <div className="example-list-white">
                  <span>username@okhdfcbank</span>
                  <span>username@ybl</span>
                  <span>username@sbi</span>
                  <span>username@icici</span>
                </div>
              </div>
              <div className="modal-footer-white">
                <button className="btn-secondary-white" onClick={() => { setShowAddModal(false); setUpiIdInput(''); }}>Cancel</button>
                <button className="btn-primary-white" onClick={handleAddBank}>Continue</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Selection Modal */}
      {showBankSelectionModal && pendingBankData && (
        <div className="modal-overlay" onClick={() => { setShowBankSelectionModal(false); setPendingBankData(null); setSelectedBankForAdd(null); }}>
          <div className="bank-selection-add-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-white">
              <h2>Select Payment Method</h2>
              <button className="modal-close-white" onClick={() => { setShowBankSelectionModal(false); setPendingBankData(null); setSelectedBankForAdd(null); }}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body-white">
              <div className="detected-bank-info">
                <div className="bank-icon-small" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                  {(() => {
                    const bankLogo = getBankLogoUrl(pendingBankData.detectedBank.name);
                    if (bankLogo) {
                      return <img src={bankLogo} alt={pendingBankData.detectedBank.name} className="bank-logo-image" />;
                    }
                    return <FaUniversity style={{ color: '#4f46e5', fontSize: '1.2rem' }} />;
                  })()}
                </div>
                <div>
                  <p className="detected-bank-label">Detected Bank:</p>
                  <p className="detected-bank-name">{pendingBankData.detectedBank.name}</p>
                  <p className="detected-upi-id">{pendingBankData.upiId}</p>
                </div>
              </div>
              
              <p className="payment-verification-note">
                <FaInfoCircle /> A verification amount of ₹1 will be deducted to link your bank account.
                This amount will be credited back as SabAI Gems.
              </p>
              
              <div className="bank-selection-options">
                <h3>Select Payment Method</h3>
                
                {/* Option 1: Use detected bank directly */}
                <div 
                  className={`bank-option-add ${selectedBankForAdd?.id === pendingBankData.detectedBank.id ? 'selected' : ''}`}
                  onClick={() => setSelectedBankForAdd(pendingBankData.detectedBank)}
                >
                  <div className="bank-option-icon">
                    {(() => {
                      const bankLogo = getBankLogoUrl(pendingBankData.detectedBank.name);
                      if (bankLogo) {
                        return <img src={bankLogo} alt={pendingBankData.detectedBank.name} className="bank-logo-small" />;
                      }
                      return <FaUniversity />;
                    })()}
                  </div>
                  <div className="bank-option-details">
                    <strong>{pendingBankData.detectedBank.name}</strong>
                    <span>via UPI</span>
                  </div>
                  {selectedBankForAdd?.id === pendingBankData.detectedBank.id && <FaCheckCircle className="selected-check-icon" />}
                </div>
                
                {/* Option 2: Use UPI ID directly */}
                <div 
                  className={`bank-option-add ${selectedBankForAdd?.id === 'upi-direct' ? 'selected' : ''}`}
                  onClick={() => setSelectedBankForAdd({ id: 'upi-direct', name: 'Pay via UPI ID', upiHandle: 'upi-direct' })}
                >
                  <div className="bank-option-icon">
                    <FaMobile />
                  </div>
                  <div className="bank-option-details">
                    <strong>Pay via UPI ID</strong>
                    <span>{pendingBankData.upiId}</span>
                  </div>
                  {selectedBankForAdd?.id === 'upi-direct' && <FaCheckCircle className="selected-check-icon" />}
                </div>
                
                {/* Available Banks List */}
                <div className="available-banks-section">
                  <h4>Other Banks</h4>
                  <div className="available-banks-scroll">
                    {bankDatabase.filter(bank => bank.name !== pendingBankData.detectedBank.name).map(bank => (
                      <div 
                        key={bank.id}
                        className={`bank-option-add ${selectedBankForAdd?.id === bank.id ? 'selected' : ''}`}
                        onClick={() => setSelectedBankForAdd(bank)}
                      >
                        <div className="bank-option-icon">
                          {(() => {
                            const bankLogo = getBankLogoUrl(bank.name);
                            if (bankLogo) {
                              return <img src={bankLogo} alt={bank.name} className="bank-logo-small" />;
                            }
                            return <FaUniversity />;
                          })()}
                        </div>
                        <div className="bank-option-details">
                          <strong>{bank.name}</strong>
                          <span>via UPI</span>
                        </div>
                        {selectedBankForAdd?.id === bank.id && <FaCheckCircle className="selected-check-icon" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer-white">
              <button className="btn-secondary-white" onClick={() => { setShowBankSelectionModal(false); setPendingBankData(null); setSelectedBankForAdd(null); }}>
                Cancel
              </button>
              <button 
                className="btn-primary-white" 
                onClick={initiateRazorpayPayment}
                disabled={!selectedBankForAdd}
              >
                Link selected bank
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && selectedAccount && (
        <div className="modal-overlay" onClick={() => setShowRemoveConfirm(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-header"><FaExclamationTriangle className="warning-icon" /><h3>Remove Bank Account</h3></div>
            <p className="confirm-message">Are you sure you want to remove {selectedAccount.bank_name} (xxxx{selectedAccount.account_number?.slice(-4)})?</p>
            <p className="warning-message">Your balance of ₹{(balances[selectedAccount.id] || 0).toLocaleString()} will be saved and restored if you re-add this account later.</p>
            {selectedAccount.is_primary && accounts.length > 1 && <p className="warning-message">This is your primary account. Another account will automatically become primary.</p>}
            <div className="confirm-actions"><button className="cancel-btn" onClick={() => setShowRemoveConfirm(false)}>Cancel</button><button className="confirm-btn" onClick={() => handleRemoveAccount(selectedAccount)}>Remove Account</button></div>
          </div>
        </div>
      )}

      {/* Check Balance Modal */}
      {showBalanceModal && selectedAccount && (
        <div className="modal-overlay" onClick={() => setShowBalanceModal(false)}>
          <motion.div className="pin-modal-white" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowBalanceModal(false)}><FaTimes /></button>
            <div className="modal-bank-header">
              <div className="modal-bank-logo" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                {(() => {
                  const bankLogo = getBankLogoUrl(selectedAccount.bank_name);
                  const hasError = imageErrors[`balance_pin_${selectedAccount.id}`];
                  if (bankLogo && !hasError) {
                    return <img src={bankLogo} alt={selectedAccount.bank_name} className="bank-logo-large" onError={() => setImageErrors(prev => ({ ...prev, [`balance_pin_${selectedAccount.id}`]: true }))} />;
                  }
                  return <FaUniversity style={{ fontSize: '1.8rem', color: '#4f46e5' }} />;
                })()}
              </div>
              <div className="modal-bank-details">
                <h3 className="modal-bank-name-white">Check Balance</h3>
                <p className="modal-account-white">Enter UPI PIN for {selectedAccount.bank_name}</p>
              </div>
            </div>
            <div className="pin-input-group">
              <div className="pin-inputs-row">
                {pinDigits.map((digit, index) => (
                  <input
                    key={index}
                    id={`balance-pin-${index}`}
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
                <input type="checkbox" checked={showPin} onChange={() => setShowPin(!showPin)} />
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
        </div>
      )}

      {/* PIN Change/Setup Modal */}
      {/* PIN Change/Setup Modal - Updated with system keyboard input */}
{showPinSetupModal && selectedAccount && (
  <div className="modal-overlay" onClick={() => setShowPinSetupModal(false)}>
    <motion.div className="pin-modal-white" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
      <button className="modal-close-btn" onClick={() => setShowPinSetupModal(false)}><FaTimes /></button>
      <div className="modal-bank-header">
        <div className="modal-bank-logo" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
          {(() => {
            const bankLogo = getBankLogoUrl(selectedAccount.bank_name);
            const hasError = imageErrors[`pin_setup_${selectedAccount.id}`];
            if (bankLogo && !hasError) {
              return <img src={bankLogo} alt={selectedAccount.bank_name} className="bank-logo-large" onError={() => setImageErrors(prev => ({ ...prev, [`pin_setup_${selectedAccount.id}`]: true }))} />;
            }
            return <FaUniversity style={{ fontSize: '1.8rem', color: '#4f46e5' }} />;
          })()}
        </div>
        <div className="modal-bank-details">
          <h3 className="modal-bank-name-white">{getPinChangeTitle()}</h3>
          <p className="modal-account-white">{getPinChangeSubtitle()}</p>
        </div>
      </div>
      
      <div className="pin-input-group">
        <div className="pin-inputs-row">
          {pinChangeStep === 1 && oldPinDigits.map((digit, index) => (
            <input
              key={index}
              id={`old-pin-${index}`}
              type={showCurrentPin ? 'text' : 'password'}
              maxLength="1"
              value={digit}
              onChange={(e) => handleOldPinInputChange(index, e.target.value)}
              onKeyDown={(e) => handlePinInputKeyDown(e, index, 'old')}
              className={`pin-input-field ${digit ? 'filled' : ''}`}
              autoFocus={index === 0}
            />
          ))}
          {pinChangeStep === 2 && newPinDigits.map((digit, index) => (
            <input
              key={index}
              id={`new-pin-${index}`}
              type={showNewPin ? 'text' : 'password'}
              maxLength="1"
              value={digit}
              onChange={(e) => handleNewPinInputChange(index, e.target.value)}
              onKeyDown={(e) => handlePinInputKeyDown(e, index, 'new')}
              className={`pin-input-field ${digit ? 'filled' : ''}`}
              autoFocus={index === 0}
            />
          ))}
          {pinChangeStep === 3 && confirmPinDigits.map((digit, index) => (
            <input
              key={index}
              id={`confirm-pin-${index}`}
              type={showConfirmPin ? 'text' : 'password'}
              maxLength="1"
              value={digit}
              onChange={(e) => handleConfirmPinInputChange(index, e.target.value)}
              onKeyDown={(e) => handlePinInputKeyDown(e, index, 'confirm')}
              className={`pin-input-field ${digit ? 'filled' : ''}`}
              autoFocus={index === 0}
            />
          ))}
        </div>
        
        {/* Show PIN checkbox for each step */}
        {pinChangeStep === 1 && (
          <label className="show-pin-checkbox">
            <input type="checkbox" checked={showCurrentPin} onChange={() => setShowCurrentPin(!showCurrentPin)} />
            <span>Show PIN</span>
          </label>
        )}
        {pinChangeStep === 2 && (
          <label className="show-pin-checkbox">
            <input type="checkbox" checked={showNewPin} onChange={() => setShowNewPin(!showNewPin)} />
            <span>Show PIN</span>
          </label>
        )}
        {pinChangeStep === 3 && (
          <label className="show-pin-checkbox">
            <input type="checkbox" checked={showConfirmPin} onChange={() => setShowConfirmPin(!showConfirmPin)} />
            <span>Show PIN</span>
          </label>
        )}
        {pinChangeError && <p className="pin-error">{pinChangeError}</p>}
      </div>
      
      <div className="modal-actions-white">
        <button className="modal-btn-white cancel" onClick={() => setShowPinSetupModal(false)}>Cancel</button>
        <button className="modal-btn-white submit" onClick={() => handlePinChangeSubmit()} disabled={loading}>
          {loading ? <FaSpinner className="spinner" /> : 'Confirm'}
        </button>
      </div>
    </motion.div>
  </div>
)}
      {/* ATM PIN Modal */}
      {showPinModal && selectedAccount && (
        <div className="modal-overlay" onClick={() => { setShowPinModal(false); setPinDigits(['', '', '', '']); setShowAtmPin(false); }}>
          <motion.div className="pin-modal-white" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => { setShowPinModal(false); setPinDigits(['', '', '', '']); setShowAtmPin(false); }}><FaTimes /></button>
            <div className="modal-bank-header">
              <div className="modal-bank-logo" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                {(() => {
                  const bankLogo = getBankLogoUrl(selectedAccount.bank_name);
                  const hasError = imageErrors[`atm_pin_${selectedAccount.id}`];
                  if (bankLogo && !hasError) {
                    return <img src={bankLogo} alt={selectedAccount.bank_name} className="bank-logo-large" onError={() => setImageErrors(prev => ({ ...prev, [`atm_pin_${selectedAccount.id}`]: true }))} />;
                  }
                  return <FaUniversity style={{ fontSize: '1.8rem', color: '#4f46e5' }} />;
                })()}
              </div>
              <div className="modal-bank-details">
                <h3 className="modal-bank-name-white">Verify UPI PIN</h3>
                <p className="modal-account-white">Enter your UPI PIN for {selectedAccount.bank_name}</p>
              </div>
            </div>
            <div className="pin-input-group">
              <div className="pin-inputs-white">
                {pinDigits.map((digit, index) => (
                  <input 
                    key={index} 
                    id={`atm-pin-${index}`} 
                    type={showAtmPin ? 'text' : 'password'} 
                    maxLength="1" 
                    value={digit} 
                    onChange={(e) => handleAtmPinChange(index, e.target.value)} 
                    onKeyDown={(e) => handleAtmPinKeyDown(e, index)} 
                    className="pin-input-white" 
                    autoFocus={index === 0} 
                  />
                ))}
              </div>
              <label className="show-pin-checkbox">
                <input type="checkbox" checked={showAtmPin} onChange={() => setShowAtmPin(!showAtmPin)} />
                <span>Show PIN</span>
              </label>
            </div>
            <div className="modal-actions-white">
              <button className="modal-btn-white cancel" onClick={() => { setShowPinModal(false); setPinDigits(['', '', '', '']); setShowAtmPin(false); }}>Cancel</button>
              <button className="modal-btn-white submit" onClick={verifyPinAndProceed} disabled={loading}>
                {loading ? <FaSpinner className="spinner" /> : 'Verify'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Deposit Amount Modal */}
      {showDepositModal && selectedAccount && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <motion.div className="atm-amount-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowDepositModal(false)}><FaTimes /></button>
            <div className="modal-bank-header">
              <div className="modal-bank-logo" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                {(() => {
                  const bankLogo = getBankLogoUrl(selectedAccount.bank_name);
                  const hasError = imageErrors[`deposit_${selectedAccount.id}`];
                  if (bankLogo && !hasError) {
                    return <img src={bankLogo} alt={selectedAccount.bank_name} className="bank-logo-large" onError={() => setImageErrors(prev => ({ ...prev, [`deposit_${selectedAccount.id}`]: true }))} />;
                  }
                  return <FaArrowDown style={{ fontSize: '1.5rem', color: '#10b981' }} />;
                })()}
              </div>
              <div className="modal-bank-details">
                <h3 className="modal-bank-name-white">Deposit Money</h3>
                <p className="modal-account-white">{selectedAccount.bank_name} - xxxx{selectedAccount.account_number?.slice(-4)}</p>
              </div>
            </div>
            <p className="modal-instruction">Enter amount to deposit</p>
            <div className="atm-amount-display">
              <span className="currency-symbol">₹</span>
              <input type="number" value={atmAmount} onChange={(e) => setAtmAmount(e.target.value)} placeholder="0" className="atm-amount-input" autoFocus />
            </div>
            <div className="quick-amounts">
              <button onClick={() => setAtmAmount('100')}>₹100</button>
              <button onClick={() => setAtmAmount('500')}>₹500</button>
              <button onClick={() => setAtmAmount('1000')}>₹1,000</button>
              <button onClick={() => setAtmAmount('5000')}>₹5,000</button>
              <button onClick={() => setAtmAmount('10000')}>₹10,000</button>
              <button onClick={() => setAtmAmount('50000')}>₹50,000</button>
            </div>
            <div className="modal-actions-white">
              <button className="modal-btn-white cancel" onClick={() => setShowDepositModal(false)}>Cancel</button>
              <button className="modal-btn-white submit" onClick={handleDeposit} disabled={loading}>{loading ? 'Processing...' : 'Deposit'}</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Withdraw Amount Modal */}
      {showWithdrawModal && selectedAccount && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <motion.div className="atm-amount-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowWithdrawModal(false)}><FaTimes /></button>
            <div className="modal-bank-header">
              <div className="modal-bank-logo" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                {(() => {
                  const bankLogo = getBankLogoUrl(selectedAccount.bank_name);
                  const hasError = imageErrors[`withdraw_${selectedAccount.id}`];
                  if (bankLogo && !hasError) {
                    return <img src={bankLogo} alt={selectedAccount.bank_name} className="bank-logo-large" onError={() => setImageErrors(prev => ({ ...prev, [`withdraw_${selectedAccount.id}`]: true }))} />;
                  }
                  return <FaArrowUp style={{ fontSize: '1.5rem', color: '#ef4444' }} />;
                })()}
              </div>
              <div className="modal-bank-details">
                <h3 className="modal-bank-name-white">Withdraw Money</h3>
                <p className="modal-account-white">{selectedAccount.bank_name} - xxxx{selectedAccount.account_number?.slice(-4)}</p>
              </div>
            </div>
            <p className="modal-instruction">Enter amount to withdraw</p>
            <div className="atm-amount-display">
              <span className="currency-symbol">₹</span>
              <input type="number" value={atmAmount} onChange={(e) => setAtmAmount(e.target.value)} placeholder="0" className="atm-amount-input" autoFocus />
            </div>
            <div className="quick-amounts">
              <button onClick={() => setAtmAmount('100')}>₹100</button>
              <button onClick={() => setAtmAmount('500')}>₹500</button>
              <button onClick={() => setAtmAmount('1000')}>₹1,000</button>
              <button onClick={() => setAtmAmount('5000')}>₹5,000</button>
              <button onClick={() => setAtmAmount('10000')}>₹10,000</button>
              <button onClick={() => setAtmAmount('50000')}>₹50,000</button>
            </div>
            <div className="modal-actions-white">
              <button className="modal-btn-white cancel" onClick={() => setShowWithdrawModal(false)}>Cancel</button>
              <button className="modal-btn-white submit" onClick={handleWithdraw} disabled={loading}>{loading ? 'Processing...' : 'Withdraw'}</button>
            </div>
          </motion.div>
        </div>
      )}
      <AnimatePresence>
        {showWithdrawFailedModal && withdrawFailedData && (
          <WithdrawFailedModal
            transactionData={withdrawFailedData}
            onClose={() => {
              setShowWithdrawFailedModal(false);
              setWithdrawFailedData(null);
            }}
            onRetry={() => {
              setShowWithdrawFailedModal(false);
              setWithdrawFailedData(null);
              setShowWithdrawModal(true);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BankAccounts;
