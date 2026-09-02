// frontend/src/pages/BillPaymentsPage.jsx
// COMPLETE - Using the SAME payment modal as MobileRechargePage (built-in)

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import storageService, {
    getBankAccounts, getBankBalances, getCoinBalance, getReserveLimits,
    getBills, addBill, updateBill, deleteBill, markBillAsPaid, getPaidBills,
    verifyBankPin, hasUpiPin, updateBankBalance, updateCoinBalance, deleteAutoPayOrder,
    addTransaction, getAutoPayOrders, addAutoPayOrder, getTransactions
} from '../services/storageService';
import { 
  FaBolt, FaTint, FaMobile, FaWifi, FaFire, FaCreditCard,
  FaHistory, FaCalendarAlt, FaRupeeSign, FaCheckCircle, FaExclamationCircle,
  FaPlus, FaTimesCircle, FaTrash, FaEdit, FaBell, FaArrowLeft, FaTimes,
  FaSearch, FaClock, FaSpinner, FaUniversity, FaArrowRight,
  FaInfoCircle, FaCheckDouble, FaGem, FaWallet, FaExchangeAlt,
  FaEye, FaEyeSlash, FaLock, FaArrowDown
} from 'react-icons/fa';
import { MdReceipt } from 'react-icons/md';
import toast from 'react-hot-toast';
import axios from 'axios';
import './BillPaymentsPage.css';

// Helper functions
const getBankLogoUrl = (bankName) => {
  const map = {
    'State Bank of India': 'sbi.png', 'SBI': 'sbi.png',
    'HDFC Bank': 'hdfc.png', 'HDFC': 'hdfc.png',
    'ICICI Bank': 'icici.png', 'ICICI': 'icici.png',
    'Axis Bank': 'axis.png', 'Axis': 'axis.png',
    'Bank of Baroda': 'bob.png', 'BOB': 'bob.png',
    'Punjab National Bank': 'pnb.png', 'PNB': 'pnb.png',
    'Canara Bank': 'canara.png', 'Canara': 'canara.png',
    'Kotak Mahindra Bank': 'kotak.png', 'Kotak': 'kotak.png',
  };
  return map[bankName] ? `/images/banks/${map[bankName]}` : null;
};

const calculateCashback = (amount) => {
  const cashback = Math.floor(amount * 0.05);
  return Math.min(cashback, 100);
};

// ============================================
// (SAME AS MOBILE)
// ============================================
const PopUpiSuccessAnimation = ({ transactionData, onViewTransaction, onNewPayment }) => {
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
          <p className="to-text">to {transactionData?.provider}</p>
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
          {transactionData?.cashback_earned > 0 && (
            <div className="detail-item highlight">
              <span>SabAI Gems Earned</span>
              <span>+{transactionData.cashback_earned} 🪙</span>
            </div>
          )}
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

// ============================================
// FAILED PAYMENT MODAL (SAME AS MOBILE)
// ============================================
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
            <p className="to-text">to {transactionData?.provider}</p>
          </motion.div>
          
          <motion.div 
            className="popupi-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: animationStage >= 3 ? 'auto' : 0, opacity: animationStage >= 3 ? 1 : 0 }}
          >
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

// ============================================
// PIN VERIFICATION MODAL (for Schedule)
// ============================================
const PinVerificationModal = ({ bank, onConfirm, onCancel, loading }) => {
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const pinInputRefs = useRef([]);

  const handlePinChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newPin = [...pinDigits];
    newPin[index] = value || '';
    setPinDigits(newPin);
    if (value && index < 3) pinInputRefs.current[index + 1]?.focus();
  };

  const handleVerify = async () => {
    const pinString = pinDigits.join('');
    if (pinString.length !== 4) { setPinError('Enter complete PIN'); return; }
    try {
      const isValid = await verifyBankPin(bank.id, pinString);
      if (!isValid) { setPinError('Incorrect PIN'); setPinDigits(['','','','']); return; }
      await onConfirm();
    } catch (error) { setPinError('Verification failed'); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-5">
        <button onClick={onCancel} className="float-right text-gray-400 hover:text-gray-600"><FaTimes /></button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            {(() => {
              const logo = getBankLogoUrl(bank.bank_name);
              return logo ? <img src={logo} alt={bank.bank_name} className="w-10 h-10 object-contain" /> : <FaUniversity className="text-2xl" />;
            })()}
          </div>
          <div><h3 className="font-bold text-base">Confirm Auto-Pay</h3><p className="text-sm text-gray-500">Enter PIN for {bank.bank_name}</p></div>
        </div>
        <div className="flex justify-center gap-3 mb-2">
          {pinDigits.map((d, i) => (
            <input key={i} ref={el => pinInputRefs.current[i] = el} type={showPin ? 'text' : 'password'} maxLength="1" value={d} onChange={(e) => handlePinChange(i, e.target.value)} className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 ${d ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'}`} autoFocus={i === 0} inputMode="numeric" />
          ))}
        </div>
        <label className="flex items-center justify-center gap-1.5 text-sm text-gray-500 cursor-pointer"><input type="checkbox" checked={showPin} onChange={() => setShowPin(!showPin)} className="accent-primary-500" /> Show PIN</label>
        {pinError && <p className="text-sm text-red-500 text-center mt-1">{pinError}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200">Cancel</button>
          <button onClick={handleVerify} disabled={loading} className="flex-1 py-2.5 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50">
            {loading ? <FaSpinner className="animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================
// SCHEDULE SUCCESS MODAL
// ============================================
const ScheduleSuccessModal = ({ billData, onClose, onViewAutoPay }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-5 text-center">
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2"><FaCheckDouble className="text-white text-3xl" /></div>
      <h3 className="font-bold text-xl">Auto-Pay Scheduled!</h3>
      <p className="text-sm text-gray-500 mt-1">Your auto-pay has been set up successfully.</p>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mt-3 text-left text-sm space-y-1.5">
        <div className="flex justify-between"><span className="text-gray-500">Provider</span><span className="font-medium">{billData.provider}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-green-600">₹{parseFloat(billData.amount).toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Due Date</span><span>{new Date(billData.due_date).toLocaleDateString()}</span></div>
        {billData.reserve_pay_enabled && <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="text-primary-500 font-medium">SabAI Pay Lite</span></div>}
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200">Close</button>
        <button onClick={onViewAutoPay} className="flex-1 py-2.5 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all"><FaClock className="inline mr-1" /> View</button>
      </div>
    </motion.div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const BillPaymentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showScheduleSuccess, setShowScheduleSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // ← ADD THIS
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedBankForSchedule, setSelectedBankForSchedule] = useState(null);
  const [bills, setBills] = useState([]);
  const [paidBills, setPaidBills] = useState([]);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [bankBalances, setBankBalances] = useState({});
  const [sabaiGems, setSabaiGems] = useState(0);
  const [universalReserveLimit, setUniversalReserveLimit] = useState(null);
  const [payStep, setPayStep] = useState(1);
  const [payPinDigits, setPayPinDigits] = useState(['', '', '', '']);
  const [payPinFilled, setPayPinFilled] = useState([false, false, false, false]);
  const [payPinError, setPayPinError] = useState('');
  const [showPayPin, setShowPayPin] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [failedTransactionResult, setFailedTransactionResult] = useState(null);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
    
  const [formData, setFormData] = useState({
    bill_type: 'electricity',
    provider: '',
    customer_id: '',
    amount: '',
    due_date: '',
    auto_pay: false,
    reminder_days: 3,
    reserve_pay_enabled: false,
  });
  const [errors, setErrors] = useState({});
  
  // Payment breakdown (SAME AS MOBILE)
  const [paymentBreakdown, setPaymentBreakdown] = useState({
    gemsAmount: 0,
    reserveAmount: 0,
    bankAmount: 0,
    billAmount: 0,
    remainingAfterGems: 0
  });

  const billCategories = [
    { id: 'electricity', name: 'Electricity', icon: FaBolt, color: '#f59e0b', providers: ['Tata Power', 'Adani Electricity', 'BSES', 'Torrent Power'] },
    { id: 'mobile', name: 'Mobile', icon: FaMobile, color: '#10b981', providers: ['Airtel', 'Jio', 'Vi', 'BSNL'] },
    { id: 'broadband', name: 'Broadband', icon: FaWifi, color: '#8b5cf6', providers: ['JioFiber', 'Airtel Xstream', 'ACT', 'Hathway'] },
    { id: 'gas', name: 'Gas', icon: FaFire, color: '#ef4444', providers: ['HP Gas', 'Indane', 'Bharat Gas'] },
    { id: 'credit_card', name: 'Credit Card', icon: FaCreditCard, color: '#ec4899', providers: ['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak'] },
    { id: 'water', name: 'Water', icon: FaTint, color: '#3b82f6', providers: ['Municipal Corporation', 'BMC', 'DWSS'] },
  ];

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [banks, billsList, gems, limits] = await Promise.all([
        getBankAccounts(),
        getBills(),
        getCoinBalance(),
        getReserveLimits()
      ]);
      setLinkedBanks(banks || []);
      setBills(billsList || []);
      setSabaiGems(gems || 0);
      const universal = limits?.find(l => l.merchant === 'sabai-pay-lite');
      setUniversalReserveLimit(universal);
      
      const upcoming = (billsList || []).filter(bill => {
        const diff = Math.ceil((new Date(bill.due_date) - new Date()) / (1000 * 60 * 60 * 24));
        return diff <= 7 && diff >= 0 && bill.status !== 'paid';
      });
      setUpcomingBills(upcoming);
      
      const paid = await getPaidBills();
      setPaidBills((paid || []).slice(0, 10));
      
      const balances = {};
      for (const bank of (banks || [])) {
        try {
          const resp = await axios.get(`/api/bank/balance/${bank.id}`, { 
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
          });
          if (resp.data.success) balances[bank.id] = resp.data.data.balance;
        } catch (e) {}
      }
      setBankBalances(balances);
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  // ============================================
  // BILL MANAGEMENT FUNCTIONS
  // ============================================

  const handleDeleteBill = async (billId) => {
    try {
      const autoPayOrders = await getAutoPayOrders();
      const associatedOrders = autoPayOrders.filter(order => order.bill_id === billId);
      
      for (const order of associatedOrders) {
        try {
          await deleteAutoPayOrder(order.id);
        } catch (orderError) {
          console.error(`Failed to delete auto-pay order ${order.id}:`, orderError);
        }
      }
      
      await deleteBill(billId);
      toast.success('Bill removed successfully');
      await loadData();
      
    } catch (error) {
      console.error('Failed to delete bill:', error);
      toast.error('Failed to delete bill');
    }
  };

  const getAvailableReserveLimit = () => {
    if (!universalReserveLimit) return 0;
    return universalReserveLimit.monthly_limit - (universalReserveLimit.current_spent || 0);
  };

  const getCategoryIcon = (type) => billCategories.find(c => c.id === type)?.icon || FaBolt;
  const getCategoryColor = (type) => billCategories.find(c => c.id === type)?.color || '#64748b';
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const getDaysUntilDue = (d) => Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));

  const handleAddBill = async () => {
    const newErrors = {};
    if (!formData.provider) newErrors.provider = 'Select provider';
    if (!formData.customer_id) newErrors.customer_id = 'Customer ID required';
    if (!formData.amount || isNaN(formData.amount) || formData.amount <= 0) newErrors.amount = 'Enter valid amount';
    if (!formData.due_date) newErrors.due_date = 'Due date required';
    if (formData.auto_pay && formData.reserve_pay_enabled) {
      newErrors.auto_pay = 'Choose either Auto-pay or Reserve Pay';
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      await addBill({
        bill_type: formData.bill_type,
        provider: formData.provider,
        customer_id: formData.customer_id,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        auto_pay: formData.auto_pay || false,
        reserve_pay_enabled: formData.reserve_pay_enabled || false,
        reminder_days: formData.reminder_days || 3
      });
      toast.success('Bill added!');
      await loadData();
      setShowAddModal(false);
      setFormData({ bill_type: 'electricity', provider: '', customer_id: '', amount: '', due_date: '', auto_pay: false, reminder_days: 3, reserve_pay_enabled: false });
    } catch (error) { toast.error('Failed to add bill'); }
    setLoading(false);
  };

  const handleScheduleBill = (bill) => {
    setSelectedBill(bill);
    setFormData(prev => ({
      ...prev,
      reminder_days: bill.reminder_days || 3,
      auto_pay: bill.auto_pay || false,
      reserve_pay_enabled: bill.reserve_pay_enabled || false
    }));
    
    if (bill.reserve_pay_enabled) {
      setShowScheduleModal(true);
      return;
    }
    
    const banksWithPin = linkedBanks.filter(b => hasUpiPin(b.id));
    if (banksWithPin.length === 0) {
      toast.error('Add a bank account with UPI PIN in Settings');
      return;
    }
    setShowPinModal(true);
  };

  const saveSchedule = async () => {
    setLoading(true);
    try {
      const updatedBill = {
        auto_pay: formData.auto_pay,
        reserve_pay_enabled: formData.reserve_pay_enabled,
        reminder_days: formData.reminder_days
      };
      await updateBill(selectedBill.id, updatedBill);
      
      if (formData.reserve_pay_enabled) {
        const dueDate = new Date(selectedBill.due_date);
        dueDate.setHours(9, 0, 0, 0);
        const mysqlDate = dueDate.toISOString().replace('T', ' ').slice(0, 19);
        
        await addAutoPayOrder({
          orderId: `AP_BILL_${selectedBill.id}_${Date.now()}`,
          type: 'bill',
          merchant: selectedBill.provider?.toLowerCase().replace(/\s+/g, '-'),
          merchantName: selectedBill.provider,
          merchantCategory: selectedBill.bill_type,
          amount: parseFloat(selectedBill.amount),
          schedule: 'monthly',
          dateValue: new Date(selectedBill.due_date).getDate(),
          time: '09:00',
          paymentMethod: 'reserve',
          status: 'active',
          nextExecution: mysqlDate,
          isBillPayment: true,
          bill_id: selectedBill.id,
          customer_id: selectedBill.customer_id,
          bill_type: selectedBill.bill_type,
          provider: selectedBill.provider,
          reminderDays: formData.reminder_days || 3
        });
      }
      
      setShowScheduleModal(false);
      setShowScheduleSuccess(true);
      await loadData();
      toast.success('Auto-pay scheduled!');
    } catch (error) { toast.error('Failed to schedule'); }
    setLoading(false);
  };

  // ============================================
  // PAYMENT FUNCTIONS (SAME AS MOBILE RECHARGE)
  // ============================================

  const handlePayBill = (bill) => {
    setSelectedBill(bill);
    setPayStep(1);
    setSelectedPaymentMethod(null);
    setSelectedPaymentType(null);
    setPayPinDigits(['', '', '', '']);
    setPayPinFilled([false, false, false, false]);
    setPayPinError('');
    setPaymentBreakdown({
      gemsAmount: 0,
      reserveAmount: 0,
      bankAmount: 0,
      billAmount: parseFloat(bill.amount),
      remainingAfterGems: parseFloat(bill.amount)
    });
    setShowPayModal(true);
  };

  const getPaymentDisplay = () => {
    if (selectedPaymentType === 'bank') {
      return `₹${paymentBreakdown.bankAmount} (${selectedPaymentMethod?.bank_name || 'Bank'})`;
    } else if (selectedPaymentType === 'gems_only') {
      return `${paymentBreakdown.gemsAmount} GEMS Only`;
    } else if (selectedPaymentType === 'reserve_pay') {
      return `₹${paymentBreakdown.reserveAmount} SabAI Pay Lite`;
    } else if (selectedPaymentType === 'gems_and_lite') {
      return `${paymentBreakdown.gemsAmount} GEMS + ₹${paymentBreakdown.reserveAmount} SabAI Pay Lite`;
    }
    return 'Bank Transfer';
  };

  const getPaymentMethod = () => {
    if (selectedPaymentType === 'bank') return 'bank';
    if (selectedPaymentType === 'gems_only') return 'gems';
    if (selectedPaymentType === 'reserve_pay') return 'reserve_pay';
    if (selectedPaymentType === 'gems_and_lite') return 'gems_and_lite';
    if (selectedPaymentType === 'gems_and_bank') return 'gems_and_bank';
    return 'unknown';
  };

  const handleGemsAmountChange = (gemsToUse) => {
    const billAmount = parseFloat(selectedBill.amount);
    const maxGemsToUse = Math.min(sabaiGems, billAmount);
    const validGems = Math.min(gemsToUse, maxGemsToUse);
    const remainingAfterGems = billAmount - validGems;
    
    setPaymentBreakdown({
      gemsAmount: validGems,
      reserveAmount: 0,
      bankAmount: remainingAfterGems,
      totalAmount: billAmount,
      billAmount: billAmount,
      remainingAfterGems: remainingAfterGems
    });
  };

  const handlePaymentMethodSelect = (type, method = null) => {
    const billAmount = parseFloat(selectedBill.amount);
    const remainingAfterGems = paymentBreakdown.remainingAfterGems;
    const availableReserveLimit = getAvailableReserveLimit();
    
    setSelectedPaymentType(type);
    setSelectedPaymentMethod(method);
    
    if (type === 'gems_only') {
      if (sabaiGems >= billAmount) {
        setPendingPaymentData({
          type: 'gems_only',
          method: null,
          amount: billAmount,
          cashbackEarned: 0,
          paymentBreakdown: {
            ...paymentBreakdown,
            gemsAmount: billAmount,
            bankAmount: 0,
            reserveAmount: 0,
            remainingAfterGems: 0
          }
        });
        setShowConfirmModal(true);
      } else {
        toast.error(`Insufficient SabAI Gems. You have ${sabaiGems} 🪙`);
        setSelectedPaymentType(null);
      }
    } else if (type === 'reserve_pay') {
      if (availableReserveLimit >= billAmount) {
        setPendingPaymentData({
          type: 'reserve_pay',
          method: null,
          amount: billAmount,
          cashbackEarned: calculateCashback(billAmount),
          paymentBreakdown: {
            ...paymentBreakdown,
            gemsAmount: 0,
            reserveAmount: billAmount,
            bankAmount: 0,
            remainingAfterGems: billAmount
          }
        });
        setShowConfirmModal(true);
      } else {
        toast.error(`Insufficient Reserve Pay limit. Available: ₹${availableReserveLimit.toLocaleString()}`);
        setSelectedPaymentType(null);
      }
    } else if (type === 'gems_and_lite') {
      const gemsToUse = paymentBreakdown.gemsAmount;
      const remaining = billAmount - gemsToUse;
      if (gemsToUse > 0 && remaining > 0 && availableReserveLimit >= remaining) {
        setPendingPaymentData({
          type: 'gems_and_lite',
          method: null,
          amount: billAmount,
          cashbackEarned: 0,
          paymentBreakdown: {
            ...paymentBreakdown,
            gemsAmount: gemsToUse,
            reserveAmount: remaining,
            bankAmount: 0,
            remainingAfterGems: remaining
          }
        });
        setShowConfirmModal(true);
      } else {
        toast.error(`Insufficient Reserve Pay limit for remaining amount. Available: ₹${availableReserveLimit.toLocaleString()}`);
        setSelectedPaymentType(null);
      }
    } else if (type === 'bank') {
      if (!method) {
        toast.error('Please select a bank account');
        return;
      }
      if (!hasUpiPin(method.id)) {
        toast.error(`Please set UPI PIN for ${method.bank_name} in Settings first`);
        setSelectedPaymentType(null);
        setSelectedPaymentMethod(null);
        return;
      }
      setSelectedPaymentMethod(method);
      setPaymentBreakdown(prev => ({
        ...prev,
        bankAmount: remainingAfterGems,
        reserveAmount: 0
      }));
      setPayStep(2);
    } else if (type === 'gems_and_bank') {
      if (!method) {
        toast.error('Please select a bank account');
        return;
      }
      if (!hasUpiPin(method.id)) {
        toast.error(`Please set UPI PIN for ${method.bank_name} in Settings first`);
        setSelectedPaymentType(null);
        setSelectedPaymentMethod(null);
        return;
      }
      setSelectedPaymentMethod(method);
      setPendingPaymentData({
        type: 'gems_and_bank',
        method: method,
        amount: billAmount,
        cashbackEarned: 0,
        paymentBreakdown: {
          ...paymentBreakdown,
          gemsAmount: paymentBreakdown.gemsAmount,
          bankAmount: remainingAfterGems,
          reserveAmount: 0,
          remainingAfterGems: remainingAfterGems
        }
      });
      setPayStep(2);
    }
  };

  const confirmPayment = () => {
    if (!pendingPaymentData) return;
    setShowConfirmModal(false);
    processPaymentWithBreakdown(pendingPaymentData.paymentBreakdown);
  };

  const processPaymentWithBreakdown = async (breakdown) => {
  const billAmount = parseFloat(selectedBill.amount);
  const { gemsAmount, bankAmount, reserveAmount } = breakdown;
  const cashbackEarned = (gemsAmount === 0 && reserveAmount === 0) ? calculateCashback(billAmount) : 0;
  
  setPayLoading(true);
  
  try {
    let paymentFailed = false;
    let failureReason = '';
    
    if (bankAmount > 0 && selectedPaymentMethod) {
      const currentBalance = bankBalances[selectedPaymentMethod.id] || 0;
      if (bankAmount > currentBalance) {
        paymentFailed = true;
        failureReason = `Insufficient balance in ${selectedPaymentMethod.bank_name}`;
      }
    }
    
    if (reserveAmount > 0 && universalReserveLimit && !paymentFailed) {
      const availableLimit = getAvailableReserveLimit();
      if (reserveAmount > availableLimit) {
        paymentFailed = true;
        failureReason = `Insufficient SabAI Pay Lite limit. Available: ₹${availableLimit.toLocaleString()}`;
      }
    }
    
    if (paymentFailed) {
      const failedTransaction = {
        transactionId: `BILL_FAILED_${Date.now()}`,
        type: 'bill_payment',
        amount: billAmount,
        description: `Bill payment to ${selectedBill.provider} - FAILED`,
        status: 'failed',
        failure_reason: failureReason,
        payment_method_display: getPaymentDisplay(),
        payment_breakdown: { gemsAmount, bankAmount, reserveAmount }
      };
      await addTransaction(failedTransaction);
      setFailedTransactionResult(failedTransaction);
      setShowPayModal(false);
      setShowFailed(true);
      setPayLoading(false);
      return;
    }
    
    // STEP 1: DEDUCT GEMS
    if (gemsAmount > 0) {
      await updateCoinBalance(gemsAmount, false);
    }
    
    // STEP 2: DEDUCT FROM RESERVE PAY
    if (reserveAmount > 0 && universalReserveLimit) {
      const limits = await getReserveLimits();
      const updatedLimits = limits.map(limit => {
        if (limit.id === universalReserveLimit.id) {
          return { ...limit, current_spent: (limit.current_spent || 0) + reserveAmount };
        }
        return limit;
      });
      await storageService.setReserveLimits(updatedLimits);
    }
    
    // STEP 3: DEDUCT FROM BANK
    if (bankAmount > 0 && selectedPaymentMethod) {
      await updateBankBalance(selectedPaymentMethod.id, bankAmount, false);
    }
    
    // STEP 4: ADD CASHBACK
    if (cashbackEarned > 0) {
      await updateCoinBalance(cashbackEarned, true);
    }
    
    // STEP 5: CREATE TRANSACTION FIRST
    const transactionId = `TXN${Date.now()}`;
    const transaction = await addTransaction({
      transactionId: transactionId,
      type: 'bill',
      amount: billAmount,
      description: `Bill payment to ${selectedBill.provider}`,
      status: 'success',
      cashback_earned: cashbackEarned,
      gems_used: gemsAmount > 0 ? gemsAmount : 0,
      payment_method_display: getPaymentDisplay(),
      payment_breakdown: { gemsAmount, bankAmount, reserveAmount },
      provider: selectedBill.provider,
      customer_id: selectedBill.customer_id,
      bill_type: selectedBill.bill_type
    });
    
    // STEP 6: MARK BILL AS PAID WITH THE TRANSACTION ID
    await markBillAsPaid(selectedBill.id, {
      payment_method: getPaymentMethod(),
      payment_breakdown: { gemsAmount, bankAmount, reserveAmount },
      cashback_earned: cashbackEarned,
      gems_used: gemsAmount,
      transaction_id: transactionId  // Use the same transaction ID
    });
    
    setTransactionResult(transaction);
    setShowPayModal(false);
    setShowSuccess(true);
    setPayLoading(false);
    
    await loadData();
    
    toast.success(`Bill paid successfully! ${cashbackEarned > 0 ? `+${cashbackEarned} 🪙 earned!` : ''}`);
    
  } catch (error) {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again.');
    setPayLoading(false);
  }
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

  const getBankLogo = (bank) => {
    const url = getBankLogoUrl(bank.bank_name);
    if (url && !imageErrors[bank.id]) {
      return <img src={url} alt={bank.bank_name} className="w-8 h-8 object-contain rounded" onError={() => setImageErrors(prev => ({...prev, [bank.id]: true}))} />;
    }
    return <FaUniversity className="text-xl text-gray-400" />;
  };

  const filteredBills = bills.filter(bill => 
    (bill.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     bill.customer_id?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterCategory === 'all' || bill.bill_type === filterCategory)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2 md:p-6">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-gray-800 px-4 py-0 rounded-full text-sm font-medium transition-all mb-3">
        <FaArrowLeft /> Back
      </button>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 md:p-6">
          
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent">
              Bill Payments
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pay bills with 5% cashback (Max 100 Gems)</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-600">
              <div className="text-2xl font-bold text-primary-500">{upcomingBills.length}</div>
              <div className="text-xs text-gray-500">Upcoming Bills</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-600">
              <div className="text-2xl font-bold text-green-500">{paidBills.length}</div>
              <div className="text-xs text-gray-500">Paid This Month</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-600">
              <div className="text-2xl font-bold text-orange-500">₹{bills.reduce((s, b) => s + parseFloat(b.amount || 0), 0).toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total Due</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-600">
              <div className="text-2xl font-bold text-yellow-500">{sabaiGems.toLocaleString()}</div>
              <div className="text-xs text-gray-500">🪙 SabAI Gems</div>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
            {billCategories.map(cat => (
              <button key={cat.id} onClick={() => { setFormData(prev => ({...prev, bill_type: cat.id})); setShowAddModal(true); }} className="flex flex-col items-center gap-1 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                <cat.icon style={{ color: cat.color, fontSize: '1.3rem' }} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate max-w-full">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Search & Add */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input type="text" placeholder="Search bills by provider or customer ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200">
              <option value="all">All Categories</option>
              {billCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setShowAddModal(true)} className="px-5 py-3 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all flex items-center gap-2">
              <FaPlus /> Add Bill
            </button>
          </div>

          {/* Bills List */}
          {filteredBills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBills.map(bill => {
                const days = getDaysUntilDue(bill.due_date);
                const Icon = getCategoryIcon(bill.bill_type);
                const color = getCategoryColor(bill.bill_type);
                const bankLogo = bill.bank_name ? getBankLogoUrl(bill.bank_name) : null;
                
                return (
                  <motion.div key={bill.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                          <Icon style={{ color, fontSize: '1.1rem' }} />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold">{bill.provider}</h4>
                          <p className="text-xs text-gray-500">ID: {bill.customer_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {(bill.auto_pay || bill.reserve_pay_enabled) && <FaBell className="text-sm text-primary-500" />}
                        <button onClick={() => handleDeleteBill(bill.id)} className="text-gray-400 hover:text-red-500 transition-all p-1"><FaTrash className="text-sm" /></button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-2xl font-bold">₹{parseFloat(bill.amount).toLocaleString()}</span>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${days < 0 ? 'bg-red-100 text-red-600' : days === 0 ? 'bg-orange-100 text-orange-600' : days <= 3 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                        {days < 0 ? 'Overdue' : days === 0 ? 'Due Today' : `${days}d left`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                      <span><FaCalendarAlt className="inline mr-1" /> {formatDate(bill.due_date)}</span>
                      {bill.reserve_pay_enabled && <span className="text-primary-500 font-medium">🪙 SabAI Pay Lite</span>}
                      {bill.bank_name && bill.auto_pay && (
                        <span className="flex items-center gap-1">
                          {bankLogo && !imageErrors[`bill_${bill.id}`] ? 
                            <img src={bankLogo} alt={bill.bank_name} className="w-5 h-5 object-contain rounded" onError={() => setImageErrors(prev => ({...prev, [`bill_${bill.id}`]: true}))} /> :
                            <FaUniversity className="text-sm" />
                          }
                          <span className="font-medium">Auto</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleScheduleBill(bill)} className="flex-1 py-2.5 text-sm font-medium bg-gray-200 dark:bg-gray-600 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all flex items-center justify-center gap-2">
                        <FaClock /> Schedule
                      </button>
                      <button onClick={() => handlePayBill(bill)} className="flex-1 py-2.5 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all flex items-center justify-center gap-2">
                        <FaRupeeSign /> Pay Now
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <MdReceipt className="text-5xl text-gray-300 mx-auto mb-3" />
              <p className="text-base text-gray-500">No bills found</p>
              <button onClick={() => setShowAddModal(true)} className="mt-3 px-5 py-2.5 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all">Add Your First Bill</button>
            </div>
          )}

          {/* Paid Bills */}
          {paidBills.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-500 mb-3">Recently Paid</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {paidBills.slice(0, 5).map(bill => {
                  const Icon = getCategoryIcon(bill.bill_type);
                  const color = getCategoryColor(bill.bill_type);
                  return (
                    <div key={bill.id} className="flex items-center justify-between text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-3">
                        <Icon style={{ color, fontSize: '1rem' }} />
                        <span className="font-medium">{bill.provider}</span>
                        <span className="text-xs text-gray-500">{formatDate(bill.paid_at)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">₹{parseFloat(bill.amount).toLocaleString()}</span>
                        {bill.cashback > 0 && <span className="text-sm text-yellow-500">+{bill.cashback}🪙</span>}
                        <FaCheckCircle className="text-green-500 text-base" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* ADD BILL MODAL */}
      {/* ============================================ */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-5">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-xl">Add New Bill</h3><button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes className="text-xl" /></button></div>
              
              <div className="space-y-3.5">
                <div>
                  <label className="text-sm font-medium block mb-1">Bill Type</label>
                  <select value={formData.bill_type} onChange={(e) => setFormData({...formData, bill_type: e.target.value, provider: ''})} className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200">
                    {billCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-1">Provider <span className="text-red-500">*</span></label>
                  <select value={formData.provider} onChange={(e) => setFormData({...formData, provider: e.target.value})} className={`w-full px-4 py-3 text-sm border rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 ${errors.provider ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}>
                    <option value="">Select Provider</option>
                    {billCategories.find(c => c.id === formData.bill_type)?.providers.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.provider && <p className="text-sm text-red-500 mt-1">{errors.provider}</p>}
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-1">Customer ID <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})} placeholder="Enter customer ID" className={`w-full px-4 py-3 text-sm border rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 ${errors.customer_id ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`} />
                  {errors.customer_id && <p className="text-sm text-red-500 mt-1">{errors.customer_id}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Amount (₹) <span className="text-red-500">*</span></label>
                    <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="0" className={`w-full px-4 py-3 text-sm border rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 ${errors.amount ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`} />
                    {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Due Date <span className="text-red-500">*</span></label>
                    <input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className={`w-full px-4 py-3 text-sm border rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 ${errors.due_date ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`} />
                    {errors.due_date && <p className="text-sm text-red-500 mt-1">{errors.due_date}</p>}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-1">Reminder Days</label>
                  <select value={formData.reminder_days} onChange={(e) => setFormData({...formData, reminder_days: parseInt(e.target.value)})} className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200">
                    <option value="1">1 day before</option>
                    <option value="2">2 days before</option>
                    <option value="3">3 days before</option>
                    <option value="5">5 days before</option>
                    <option value="7">7 days before</option>
                  </select>
                </div>
                
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={formData.auto_pay} onChange={(e) => setFormData({...formData, auto_pay: e.target.checked, reserve_pay_enabled: e.target.checked ? false : formData.reserve_pay_enabled})} className="w-4 h-4 accent-primary-500" disabled={formData.reserve_pay_enabled} />
                    Bank Auto-Pay
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={formData.reserve_pay_enabled} onChange={(e) => setFormData({...formData, reserve_pay_enabled: e.target.checked, auto_pay: e.target.checked ? false : formData.auto_pay})} className="w-4 h-4 accent-primary-500" disabled={formData.auto_pay} />
                    SabAI Pay Lite
                  </label>
                </div>
                {errors.auto_pay && <p className="text-sm text-red-500">{errors.auto_pay}</p>}
              </div>
              
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200">Cancel</button>
                <button onClick={handleAddBill} disabled={loading} className="flex-1 py-3 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <FaSpinner className="animate-spin" /> : 'Add Bill'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* PAY BILL MODAL*/}
      {/* ============================================ */}
      <AnimatePresence>
        {showPayModal && selectedBill && (
          <div className="modal-overlay">
            <motion.div 
              className="pay-bill-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Pay Bill</h2>
                <button className="modal-close" onClick={() => setShowPayModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body-scroll">
  {/* Bill Summary - Redesigned */}
  <div className="bill-summary">
    <div className="summary-provider">
      {/* Left side: Icon + Provider */}
      <div className="summary-left">
        <div className="summary-icon" style={{ background: `${getCategoryColor(selectedBill.bill_type)}15` }}>
          {React.createElement(getCategoryIcon(selectedBill.bill_type), { style: { color: getCategoryColor(selectedBill.bill_type) } })}
        </div>
        <div>
          <h3>{selectedBill.provider}</h3>
        </div>
      </div>
      
      {/* Right side: Customer ID + Amount */}
      <div className="summary-right">
        <p className="customer-id">{selectedBill.customer_id}</p>
        <span className="amount-label">₹{parseFloat(selectedBill.amount).toLocaleString()}</span>
      </div>
    </div>
  </div>

  {payStep === 1 && (
    <>
      <div className="payment-amount-display">
        <span className="amount-label">Bill Amount</span>
        <span className="amount-value-large">₹{parseFloat(selectedBill.amount).toLocaleString()}</span>
                      {sabaiGems > 0 && (
                        <div className="gems-input-section">
                          <label className="gems-label">
                            <img src="/images/sabaigems.png" alt="Gems" className="gem-icon" /> Use SabAI Gems
                          </label>
                          <div className="gems-input-wrapper">
                            <input
                              type="number"
                              className="gems-input"
                              value={paymentBreakdown.gemsAmount}
                              onChange={(e) => handleGemsAmountChange(parseInt(e.target.value) || 0)}
                              min="0"
                              max={Math.min(sabaiGems, parseFloat(selectedBill.amount))}
                              placeholder="0"
                            />
                            <span className="gems-max" onClick={() => handleGemsAmountChange(Math.min(sabaiGems, parseFloat(selectedBill.amount)))}>
                              Max
                            </span>
                          </div>
                          <p className="gems-balance">Available: {sabaiGems} 🪙 (1 🪙 = ₹1)</p>
                        </div>
                      )}
                      {paymentBreakdown.gemsAmount > 0 && (
                        <div className="payment-breakdown-preview">
                          <p>After using {paymentBreakdown.gemsAmount} 🪙: <strong>₹{paymentBreakdown.remainingAfterGems.toLocaleString()}</strong> remaining</p>
                        </div>
                      )}
                      {paymentBreakdown.gemsAmount === 0 && (
                        <span className="cashback-info">You'll earn +{calculateCashback(parseFloat(selectedBill.amount))} 🪙 cashback</span>
                      )}
                      {paymentBreakdown.gemsAmount > 0 && (
                        <span className="cashback-info no-cashback">⚠️ No cashback when using Gems</span>
                      )}
                    </div>

                    <div className="payment-methods-section">
                      <h4>Select Payment Method</h4>
                      
                      {sabaiGems >= parseFloat(selectedBill.amount) && (
                        <button
                          className={`payment-method-card ${selectedPaymentType === 'gems_only' ? 'selected' : ''}`}
                          onClick={() => handlePaymentMethodSelect('gems_only')}
                        >
                          <div className="payment-method-icon gems">
                            <img src="/images/sabaigems.png" alt="Gems" className="payment-method-logo" />
                          </div>
                          <div className="payment-method-info">
                            <strong>Pay with SabAI Gems Only</strong>
                            <span>Use {parseFloat(selectedBill.amount).toLocaleString()} 🪙 (No cashback)</span>
                          </div>
                          {selectedPaymentType === 'gems_only' && <FaCheckCircle className="selected-icon" />}
                        </button>
                      )}
                      
                      {getAvailableReserveLimit() >= parseFloat(selectedBill.amount) && (
                        <button
                          className={`payment-method-card ${selectedPaymentType === 'reserve_pay' ? 'selected' : ''}`}
                          onClick={() => handlePaymentMethodSelect('reserve_pay')}
                        >
                          <div className="payment-method-icon reserve">
                            <img src="/images/merchants/sabailogo.png" alt="SabAI" className="payment-method-logo" />
                          </div>
                          <div className="payment-method-info">
                            <strong>SabAI Pay Lite (Reserve Pay)</strong>
                            <span>Use ₹{parseFloat(selectedBill.amount).toLocaleString()} from universal limit</span>
                            <span className="limit-info">Available: ₹{getAvailableReserveLimit().toLocaleString()}</span>
                          </div>
                          {selectedPaymentType === 'reserve_pay' && <FaCheckCircle className="selected-icon" />}
                        </button>
                      )}
                      
                      {paymentBreakdown.gemsAmount > 0 && paymentBreakdown.remainingAfterGems > 0 && getAvailableReserveLimit() >= paymentBreakdown.remainingAfterGems && (
                        <button
                          className={`payment-method-card ${selectedPaymentType === 'gems_and_lite' ? 'selected' : ''}`}
                          onClick={() => handlePaymentMethodSelect('gems_and_lite')}
                        >
                          <div className="payment-method-icon gems-lite">
                            <img src="/images/sabaigems.png" alt="Gems" className="payment-method-logo-small" />
                            <img src="/images/merchants/sabailogo.png" alt="SabAI" className="payment-method-logo-small" />
                          </div>
                          <div className="payment-method-info">
                            <strong>Gems + SabAI Pay Lite</strong>
                            <span>Use {paymentBreakdown.gemsAmount} 🪙 + ₹{paymentBreakdown.remainingAfterGems.toLocaleString()} from limit</span>
                          </div>
                          {selectedPaymentType === 'gems_and_lite' && <FaCheckCircle className="selected-icon" />}
                        </button>
                      )}
                      
                      {paymentBreakdown.remainingAfterGems > 0 && linkedBanks.filter(b => hasUpiPin(b.id)).length > 0 && (
                        <div className="bank-options-section">
                          <div className="bank-options-header">
                            <FaUniversity /> Pay remaining ₹{paymentBreakdown.remainingAfterGems.toLocaleString()} with Bank
                          </div>
                          <div className="banks-list-pay">
                            {linkedBanks.filter(b => hasUpiPin(b.id)).map(bank => (
                              <button
                                key={bank.id}
                                className={`bank-option-pay ${selectedPaymentMethod?.id === bank.id && selectedPaymentType === 'bank' ? 'selected' : ''}`}
                                onClick={() => handlePaymentMethodSelect('bank', bank)}
                              >
                                <div className="bank-icon-small-pay">
                                  {getBankLogo(bank)}
                                </div>
                                <div className="bank-info-pay">
                                  <span className="bank-name-pay">{bank.bank_name}</span>
                                  <span className="bank-account-pay">xxxx{bank.account_number?.slice(-4)}</span>
                                </div>
                                {selectedPaymentMethod?.id === bank.id && selectedPaymentType === 'bank' && <FaCheckCircle className="selected-icon-pay" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {paymentBreakdown.gemsAmount > 0 && paymentBreakdown.remainingAfterGems > 0 && (
                        <div className="combined-payment-info">
                          <FaInfoCircle />
                          <span>You'll pay {paymentBreakdown.gemsAmount} 🪙 + ₹{paymentBreakdown.remainingAfterGems.toLocaleString()} via selected method</span>
                        </div>
                      )}
                    </div>

                    <div className="modal-footer">
                      <button className="btn-secondary" onClick={() => setShowPayModal(false)}>
                        Cancel
                      </button>
                      <button 
                        className="btn-primary" 
                        onClick={() => {
                          if (!selectedPaymentType) {
                            toast.error('Please select a payment method');
                            return;
                          }
                          if ((selectedPaymentType === 'bank' || selectedPaymentType === 'gems_and_bank') && !selectedPaymentMethod) {
                            toast.error('Please select a bank account');
                            return;
                          }
                          if (selectedPaymentType === 'reserve_pay' && getAvailableReserveLimit() < paymentBreakdown.billAmount) {
                            toast.error('Insufficient Reserve Pay limit');
                            return;
                          }
                          if (selectedPaymentType === 'gems_and_lite' && getAvailableReserveLimit() < paymentBreakdown.remainingAfterGems) {
                            toast.error('Insufficient Reserve Pay limit for remaining amount');
                            return;
                          }
                          if (selectedPaymentType === 'gems_only' && sabaiGems < paymentBreakdown.billAmount) {
                            toast.error('Insufficient SabAI Gems');
                            return;
                          }
                          
                          if (selectedPaymentType === 'bank') {
                            setPaymentBreakdown(prev => ({
                              ...prev,
                              bankAmount: prev.remainingAfterGems,
                              reserveAmount: 0
                            }));
                            setPayStep(2);
                            return;
                          }
                          
                          if (selectedPaymentType === 'gems_and_bank') {
                            const gemsToUse = paymentBreakdown.gemsAmount;
                            const remainingToPay = paymentBreakdown.remainingAfterGems;
                            if (gemsToUse > 0 && remainingToPay > 0 && selectedPaymentMethod) {
                              setPendingPaymentData({
                                type: 'gems_and_bank',
                                method: selectedPaymentMethod,
                                paymentBreakdown: {
                                  ...paymentBreakdown,
                                  gemsAmount: gemsToUse,
                                  bankAmount: remainingToPay,
                                  reserveAmount: 0
                                }
                              });
                              setPayStep(2);
                            } else {
                              toast.error('Please enter gems amount and select a bank account');
                            }
                            return;
                          }
                          
                          if (selectedPaymentType === 'gems_only' || selectedPaymentType === 'reserve_pay' || selectedPaymentType === 'gems_and_lite') {
                            let newBreakdown = {};
                            if (selectedPaymentType === 'gems_only') {
                              newBreakdown = {
                                ...paymentBreakdown,
                                gemsAmount: paymentBreakdown.billAmount,
                                bankAmount: 0,
                                reserveAmount: 0,
                                remainingAfterGems: 0
                              };
                            } else if (selectedPaymentType === 'reserve_pay') {
                              newBreakdown = {
                                ...paymentBreakdown,
                                gemsAmount: 0,
                                reserveAmount: paymentBreakdown.billAmount,
                                bankAmount: 0,
                                remainingAfterGems: paymentBreakdown.billAmount
                              };
                            } else if (selectedPaymentType === 'gems_and_lite') {
                              newBreakdown = {
                                ...paymentBreakdown,
                                reserveAmount: paymentBreakdown.remainingAfterGems,
                                bankAmount: 0
                              };
                            }
                            setPendingPaymentData({
                              type: selectedPaymentType,
                              method: null,
                              paymentBreakdown: newBreakdown
                            });
                            setShowConfirmModal(true);
                          }
                        }}
                        disabled={!selectedPaymentType || ((selectedPaymentType === 'bank' || selectedPaymentType === 'gems_and_bank') && !selectedPaymentMethod)}
                      >
                        {(selectedPaymentType === 'bank' || selectedPaymentType === 'gems_and_bank') ? 'Next →' : 'Pay Now'}
                      </button>
                    </div>
                  </>
                )}

                {payStep === 2 && selectedPaymentMethod && (
                  <>
                    <div className="payment-summary">
                      <div className="summary-row">
                        <span>Total Amount</span>
                        <strong>₹{parseFloat(selectedBill.amount).toLocaleString()}</strong>
                      </div>
                      {paymentBreakdown.gemsAmount > 0 && (
                        <div className="summary-row">
                          <span>SabAI Gems Used</span>
                          <span>{paymentBreakdown.gemsAmount} 🪙 (₹{paymentBreakdown.gemsAmount})</span>
                        </div>
                      )}
                      <div className="summary-row">
                        <span>To</span>
                        <span>{selectedBill.provider}</span>
                      </div>
                      <div className="summary-row">
                        <span>From</span>
                        <span>{selectedPaymentMethod.bank_name} (xxxx{selectedPaymentMethod.account_number?.slice(-4)})</span>
                      </div>
                      {paymentBreakdown.bankAmount > 0 && (
                        <div className="summary-row">
                          <span>Bank Payment</span>
                          <strong>₹{paymentBreakdown.bankAmount.toLocaleString()}</strong>
                        </div>
                      )}
                      {paymentBreakdown.reserveAmount > 0 && (
                        <div className="summary-row">
                          <span>SabAI Pay Lite</span>
                          <strong>₹{paymentBreakdown.reserveAmount.toLocaleString()}</strong>
                        </div>
                      )}
                      {paymentBreakdown.gemsAmount === 0 && paymentBreakdown.reserveAmount === 0 && paymentBreakdown.bankAmount > 0 && (
                        <div className="summary-row">
                          <span>Cashback (5%)</span>
                          <span className="cashback-amount">+{calculateCashback(parseFloat(selectedBill.amount))} 🪙</span>
                        </div>
                      )}
                      {(paymentBreakdown.gemsAmount > 0 || paymentBreakdown.reserveAmount > 0) && (
                        <div className="summary-row">
                          <span>Cashback</span>
                          <span className="cashback-amount no-cashback">0 🪙 (Gems/Reserve Pay used)</span>
                        </div>
                      )}
                    </div>

                    <div className="pin-section-pay">
                      <label>Enter UPI PIN for {selectedPaymentMethod.bank_name}</label>
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

                    <div className="modal-footer">
                      <button className="btn-secondary" onClick={() => setPayStep(1)}>
                        Back
                      </button>
                      <button 
                        className="btn-primary" 
                        onClick={() => {
                          const pinString = payPinDigits.join('');
                          if (pinString.length !== 4) {
                            setPayPinError('Please enter complete PIN');
                            return;
                          }
                          
                          if (!verifyBankPin(selectedPaymentMethod.id, pinString)) {
                            setPayPinError('Incorrect PIN. Please try again.');
                            setPayPinDigits(['', '', '', '']);
                            setPayPinFilled([false, false, false, false]);
                            return;
                          }
                          
                          setPayPinError('');
                          
                          if (pendingPaymentData && pendingPaymentData.type === 'gems_and_bank') {
                            processPaymentWithBreakdown(pendingPaymentData.paymentBreakdown);
                          } else {
                            processPaymentWithBreakdown(paymentBreakdown);
                          }
                        }} 
                        disabled={payLoading}
                      >
                        {payLoading ? <FaSpinner className="spinner" /> : `Pay ₹${paymentBreakdown.bankAmount.toLocaleString()}`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* CONFIRM MODAL */}
      {/* ============================================ */}
      <AnimatePresence>
        {showConfirmModal && pendingPaymentData && (
          <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <motion.div 
              className="confirm-payment-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Confirm Payment</h2>
                <button className="modal-close" onClick={() => setShowConfirmModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="payment-summary">
                  <div className="summary-row">
                    <span>Total Amount</span>
                    <strong>₹{parseFloat(selectedBill?.amount || 0).toLocaleString()}</strong>
                  </div>
                  {pendingPaymentData.paymentBreakdown.gemsAmount > 0 && (
                    <div className="summary-row">
                      <span>SabAI Gems Used</span>
                      <span>{pendingPaymentData.paymentBreakdown.gemsAmount} 🪙 (₹{pendingPaymentData.paymentBreakdown.gemsAmount})</span>
                    </div>
                  )}
                  {pendingPaymentData.paymentBreakdown.reserveAmount > 0 && (
                    <div className="summary-row">
                      <span>SabAI Pay Lite</span>
                      <span>₹{pendingPaymentData.paymentBreakdown.reserveAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {pendingPaymentData.paymentBreakdown.bankAmount > 0 && (
                    <div className="summary-row">
                      <span>Bank Payment</span>
                      <span>₹{pendingPaymentData.paymentBreakdown.bankAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>To</span>
                    <span>{selectedBill?.provider}</span>
                  </div>
                  {pendingPaymentData.type === 'reserve_pay' && pendingPaymentData.paymentBreakdown.gemsAmount === 0 && (
                    <div className="summary-row">
                      <span>Cashback (5%)</span>
                      <span className="cashback-amount">+{calculateCashback(parseFloat(selectedBill?.amount || 0))} 🪙</span>
                    </div>
                  )}
                  {(pendingPaymentData.type === 'gems_only' || pendingPaymentData.type === 'gems_and_lite') && (
                    <div className="summary-row">
                      <span>Cashback</span>
                      <span className="cashback-amount no-cashback">0 🪙 (Gems used)</span>
                    </div>
                  )}
                </div>
                <div className="confirm-payment-note">
                  <FaInfoCircle />
                  <p>
                    {pendingPaymentData.type === 'gems_only' 
                      ? `You are about to pay ₹${parseFloat(selectedBill?.amount || 0).toLocaleString()} using ${pendingPaymentData.paymentBreakdown.gemsAmount} SabAI Gems. No cashback will be earned.`
                      : pendingPaymentData.type === 'gems_and_lite'
                      ? `You are about to pay ${pendingPaymentData.paymentBreakdown.gemsAmount} Gems + ₹${pendingPaymentData.paymentBreakdown.reserveAmount.toLocaleString()} using SabAI Pay Lite. No cashback will be earned.`
                      : pendingPaymentData.type === 'reserve_pay'
                      ? `You are about to pay ₹${parseFloat(selectedBill?.amount || 0).toLocaleString()} using SabAI Pay Lite. You will earn ${calculateCashback(parseFloat(selectedBill?.amount || 0))} 🪙 cashback!`
                      : `You are about to pay ₹${parseFloat(selectedBill?.amount || 0).toLocaleString()} via bank transfer. You will earn ${calculateCashback(parseFloat(selectedBill?.amount || 0))} 🪙 cashback!`}
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={confirmPayment} disabled={payLoading}>
                  {payLoading ? <FaSpinner className="spinner" /> : 'Confirm Payment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* SCHEDULE MODAL */}
      {/* ============================================ */}
      <AnimatePresence>
        {showScheduleModal && selectedBill && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-5">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-xl">Schedule Auto-Pay</h3><button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes className="text-xl" /></button></div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-4 text-sm space-y-1.5">
                <p><span className="text-gray-500">Provider:</span> <span className="font-medium">{selectedBill.provider}</span></p>
                <p><span className="text-gray-500">Amount:</span> <strong className="text-primary-500">₹{parseFloat(selectedBill.amount).toLocaleString()}</strong></p>
                <p><span className="text-gray-500">Due:</span> {formatDate(selectedBill.due_date)}</p>
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium block mb-1">Reminder Days</label>
                <select value={formData.reminder_days} onChange={(e) => setFormData({...formData, reminder_days: parseInt(e.target.value)})} className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200">
                  <option value="1">1 day before</option><option value="2">2 days before</option><option value="3">3 days before</option><option value="5">5 days before</option><option value="7">7 days before</option>
                </select>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <FaInfoCircle /> {selectedBill.reserve_pay_enabled ? 'SabAI Pay Lite auto-pay' : 'Bank auto-pay with PIN verification'}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200">Cancel</button>
                <button onClick={saveSchedule} disabled={loading} className="flex-1 py-3 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50">
                  {loading ? <FaSpinner className="animate-spin" /> : 'Save Schedule'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* PIN MODAL FOR SCHEDULE */}
      {/* ============================================ */}
      <AnimatePresence>
        {showPinModal && selectedBankForSchedule && (
          <PinVerificationModal
            bank={selectedBankForSchedule}
            onConfirm={async () => {
              setShowPinModal(false);
              await saveSchedule();
            }}
            onCancel={() => {
              setShowPinModal(false);
              setSelectedBankForSchedule(null);
            }}
            loading={loading}
          />
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* SCHEDULE SUCCESS MODAL */}
      {/* ============================================ */}
      <AnimatePresence>
        {showScheduleSuccess && selectedBill && (
          <ScheduleSuccessModal
            billData={selectedBill}
            onClose={() => setShowScheduleSuccess(false)}
            onViewAutoPay={() => {
              setShowScheduleSuccess(false);
              navigate('/reserve-pay?tab=auto-pay');
            }}
          />
        )}
      </AnimatePresence>

      {/* ============================================ */}
{/* SUCCESS ANIMATION*/}
{/* ============================================ */}
<AnimatePresence>
  {showSuccess && transactionResult && (
    <div className="popupi-overlay" onClick={() => {}}>
      <PopUpiSuccessAnimation 
        transactionData={transactionResult}
        onViewTransaction={() => {
          setShowSuccess(false);
          navigate('/transactions');
        }}
        onNewPayment={() => {
          setShowSuccess(false);
          setShowAddModal(true);
        }}
      />
    </div>
  )}
</AnimatePresence>

{/* ============================================ */}
{/* FAILED ANIMATION*/}
{/* ============================================ */}
<AnimatePresence>
  {showFailed && failedTransactionResult && (
    <div className="popupi-overlay" onClick={() => {}}>
      <FailedPaymentModal 
        transactionData={failedTransactionResult}
        onClose={() => {
          setShowFailed(false);
          setFailedTransactionResult(null);
        }}
        onRetry={() => {
          setShowFailed(false);
          setFailedTransactionResult(null);
          if (selectedBill) {
            handlePayBill(selectedBill);
          }
        }}
      />
    </div>
  )}
</AnimatePresence>
    </div>
  );
};

export default BillPaymentsPage;