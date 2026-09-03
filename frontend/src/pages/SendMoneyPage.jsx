// frontend/src/pages/SendMoneyPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bankAPI, agentOrderAPI, coinAPI } from '../services/apiService';
import storageService, {
    getBankAccounts, getBankBalances, updateContactAfterTransaction,
    getCoinBalance, getTransactions, getMoneyRequests, setMoneyRequests,
    getContacts, addContact, verifyBankPin, hasUpiPin,
    updateBankBalance, updateCoinBalance, addTransaction,
    refreshCurrentUserId,
} from '../services/storageService';
import { 
  FaArrowLeft, FaSearch, FaUser, FaFolderOpen, FaRupeeSign, FaArrowRight,
  FaQrcode, FaCamera, FaUserCircle, FaCheckCircle, FaExclamationCircle,
  FaUniversity, FaWallet, FaTimes, FaMobile, FaSpinner, FaChevronRight, 
  FaTrash, FaEdit, FaUsers, FaUserPlus, FaExchangeAlt, FaArrowDown, FaBalanceScale, FaGift,
  FaTimesCircle, FaChartLine
} from 'react-icons/fa';
import { MdQrCodeScanner, MdVerified, MdGroups } from 'react-icons/md';
import toast from 'react-hot-toast';

// ============================================
// HELPER FUNCTIONS
// ============================================

const getContactColor = (name) => {
  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#d946ef'];
  let hash = 0;
  for (let i = 0; i < name?.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
};

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

// ============================================
// SPLIT PAYMENT MODAL - FULL VERSION
// ============================================

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
    
    const existingRequests = JSON.parse(localStorage.getItem('splitRequests') || '[]');
    existingRequests.unshift(splitRequestData);
    localStorage.setItem('splitRequests', JSON.stringify(existingRequests.slice(0, 50)));
    
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
  
  const getRemainingAmount = () => {
    const amount = parseFloat(totalAmount);
    if (isNaN(amount)) return 0;
    let total = 0;
    selectedContacts.forEach(contact => {
      total += parseFloat(customAmounts[contact.id] || 0);
    });
    return amount - total;
  };
  
  const getRemainingPercentage = () => {
    let total = 0;
    selectedContacts.forEach(contact => {
      total += parseFloat(customPercentages[contact.id] || 0);
    });
    return 100 - total;
  };
  
  return (
    <div className="p-4 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Split Payment</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
      </div>
      
      {step === 1 && (
        <>
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1">Total Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="Enter total bill amount" className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200" autoFocus />
            </div>
          </div>
          
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1">Split Type</label>
            <div className="flex gap-2">
              <button className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${splitType === 'equal' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`} onClick={() => setSplitType('equal')}><FaBalanceScale className="inline mr-1" /> Equal</button>
              <button className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${splitType === 'custom' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`} onClick={() => setSplitType('custom')}><FaEdit className="inline mr-1" /> Custom</button>
              <button className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${splitType === 'percentage' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`} onClick={() => setSplitType('percentage')}><FaChartLine className="inline mr-1" /> %</button>
            </div>
          </div>
          
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1">Group Name (Optional)</label>
            <div className="flex gap-2">
              <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g., Dinner with Friends" className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200" />
              <button onClick={loadSavedGroups} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 transition-all"><FaFolderOpen /></button>
            </div>
          </div>
          
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1">Note (Optional)</label>
            <input type="text" value={splitNote} onChange={(e) => setSplitNote(e.target.value)} placeholder="Add a note" className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200" />
          </div>
          
          <button onClick={() => setStep(2)} disabled={!totalAmount} className="w-full py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50">Next</button>
        </>
      )}
      
      {step === 2 && (
        <>
          <div className="text-center mb-3">
            <p className="text-sm font-medium">Total: ₹{parseFloat(totalAmount || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500">{selectedContacts.length + 1} people including you</p>
            {splitType === 'equal' && totalAmount && (
              <p className="text-xs text-green-600">Each: ₹{(parseFloat(totalAmount) / (selectedContacts.length + 1)).toFixed(2)}</p>
            )}
            {splitType === 'custom' && totalAmount && (
              <p className="text-xs text-orange-500">You pay: ₹{getRemainingAmount().toFixed(2)}</p>
            )}
            {splitType === 'percentage' && totalAmount && (
              <p className="text-xs text-purple-500">You pay: {getRemainingPercentage().toFixed(1)}%</p>
            )}
          </div>
          
          <div className="relative mb-2">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input type="text" placeholder="Search contacts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200" />
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
            {filteredContacts.map(contact => {
              const isSelected = selectedContacts.find(c => c.id === contact.id);
              return (
                <div key={contact.id} className={`flex items-center justify-between p-1.5 rounded-xl border ${isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: getContactColor(contact.name) }}>{contact.name?.charAt(0)?.toUpperCase()}</div>
                    <span className="text-sm">{contact.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isSelected && splitType === 'custom' && (
                      <input type="number" placeholder="₹" value={customAmounts[contact.id] || ''} onChange={(e) => setCustomAmounts(prev => ({...prev, [contact.id]: e.target.value}))} className="w-16 px-1.5 py-0.5 text-xs border border-gray-200 rounded-lg" />
                    )}
                    {isSelected && splitType === 'percentage' && (
                      <input type="number" placeholder="%" value={customPercentages[contact.id] || ''} onChange={(e) => setCustomPercentages(prev => ({...prev, [contact.id]: e.target.value}))} className="w-14 px-1.5 py-0.5 text-xs border border-gray-200 rounded-lg" />
                    )}
                    <button onClick={() => toggleContact(contact)} className={`p-1 rounded-lg ${isSelected ? 'text-primary-500' : 'text-gray-400 hover:text-primary-500'}`}>
                      {isSelected ? <FaCheckCircle /> : <FaUserPlus />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200">Back</button>
            <button onClick={calculateSplit} disabled={selectedContacts.length === 0} className="flex-1 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50">Create Split</button>
          </div>
        </>
      )}
      
      {/* Group Select Modal */}
      <AnimatePresence>
        {showGroupSelect && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold">Saved Groups</h4>
                <button onClick={() => setShowGroupSelect(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
              </div>
              {savedGroups.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No saved groups yet</p>
              ) : (
                savedGroups.map(group => (
                  <button key={group.id} onClick={() => loadGroup(group)} className="w-full flex items-center gap-3 p-2 border border-gray-200 dark:border-gray-700 rounded-xl mb-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    <MdGroups className="text-primary-500 text-lg" />
                    <div className="flex-1 text-left"><p className="text-sm font-medium">{group.name}</p><p className="text-xs text-gray-500">{group.contacts.length} members</p></div>
                    <FaChevronRight className="text-gray-400 text-sm" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Split Success Modal */}
      <AnimatePresence>
        {showSplitSuccess && createdSplitData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-5 text-center">
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2"><FaCheckCircle className="text-white text-2xl" /></div>
              <h3 className="font-bold text-lg">Split Created!</h3>
              <p className="text-2xl font-bold text-green-600">₹{createdSplitData.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Split among {createdSplitData.splits.length} people</p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2.5 mt-2 text-left text-sm max-h-32 overflow-y-auto">
                {createdSplitData.splits.filter(s => !s.isSelf && s.amount > 0).slice(0, 5).map((s, i) => (
                  <div key={i} className="flex justify-between py-0.5 border-b border-gray-100 dark:border-gray-600"><span>{s.contact.name}</span><span>₹{s.amount.toFixed(2)}</span></div>
                ))}
              </div>
              <button onClick={() => { setShowSplitSuccess(false); onSplitComplete(createdSplitData); onClose(); }} className="w-full mt-3 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600">Done</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// SELF TRANSFER MODAL - FULL VERSION
// ============================================

const SelfTransferModal = ({ onClose, onTransferComplete, linkedBanks, bankBalances }) => {
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
  const pinInputRefs = useRef([]);
  
  const availableBanks = linkedBanks.filter(b => {
    try { return hasUpiPin(b.id); } catch { return false; }
  });
  
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
  
  const handleTransfer = async () => {
    const pinString = pin.join('');
    if (pinString.length !== 4) {
      setPinError('Please enter complete PIN');
      return;
    }
    
    try {
      const isValid = await verifyBankPin(fromBank.id, pinString);
      if (!isValid) {
        setPinError('Incorrect PIN. Please try again.');
        setPin(['', '', '', '']);
        setPinFilled([false, false, false, false]);
        pinInputRefs.current[0]?.focus();
        return;
      }
      
      const transferAmount = parseFloat(amount);
      const fromBalance = bankBalances[fromBank.id] || 0;
      
      if (transferAmount > fromBalance) {
        toast.error(`Insufficient balance. Available: ₹${fromBalance.toLocaleString()}`);
        return;
      }
      
      setLoading(true);
      
      await updateBankBalance(fromBank.id, transferAmount, false);
      await updateBankBalance(toBank.id, transferAmount, true);
      
      // Save transaction
      await addTransaction({
        transactionId: `SELF${Date.now()}`,
        type: 'self_transfer',
        amount: transferAmount,
        description: `Self transfer from ${fromBank.bank_name} to ${toBank.bank_name}`,
        bank_name: fromBank.bank_name,
        bank_id: fromBank.id,
        status: 'success',
        date: new Date().toISOString()
      });
      
      setSuccessData({
        amount: transferAmount,
        fromBank: fromBank.bank_name,
        toBank: toBank.bank_name,
        transactionId: `SELF${Date.now()}`
      });
      setShowSuccess(true);
      setLoading(false);
      
      toast.success(`₹${transferAmount.toLocaleString()} transferred successfully!`);
      
    } catch (error) {
      toast.error('Transfer failed');
      setLoading(false);
    }
  };
  
  const getBankLogo = (bank) => {
    const url = getBankLogoUrl(bank.bank_name);
    if (url) return <img src={url} alt={bank.bank_name} className="w-8 h-8 object-contain rounded" />;
    return <FaUniversity className="text-gray-400" />;
  };
  
  return (
    <div className="p-4 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Self Transfer</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
      </div>
      
      {step === 1 ? (
        <>
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1">From Account</label>
            <div className="space-y-1">
              {availableBanks.map(bank => (
                <button key={bank.id} onClick={() => setFromBank(bank)} className={`w-full flex items-center gap-3 p-2 border rounded-xl transition-all ${fromBank?.id === bank.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 overflow-hidden">{getBankLogo(bank)}</div>
                  <div className="flex-1 text-left"><p className="text-sm font-medium">{bank.bank_name}</p><p className="text-xs text-gray-500">xxxx{bank.account_number?.slice(-4)}</p></div>
                  {fromBank?.id === bank.id && <FaCheckCircle className="text-primary-500" />}
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-center my-2"><FaArrowDown className="text-gray-400 text-lg" /></div>
          
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1">To Account</label>
            <div className="space-y-1">
              {availableBanks.filter(b => b.id !== fromBank?.id).map(bank => (
                <button key={bank.id} onClick={() => setToBank(bank)} className={`w-full flex items-center gap-3 p-2 border rounded-xl transition-all ${toBank?.id === bank.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 overflow-hidden">{getBankLogo(bank)}</div>
                  <div className="flex-1 text-left"><p className="text-sm font-medium">{bank.bank_name}</p><p className="text-xs text-gray-500">xxxx{bank.account_number?.slice(-4)}</p></div>
                  {toBank?.id === bank.id && <FaCheckCircle className="text-primary-500" />}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1">Amount (₹)</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200" /></div>
          </div>
          
          <button onClick={() => setStep(2)} disabled={!fromBank || !toBank || !amount} className="w-full py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50">Next</button>
        </>
      ) : (
        <>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><strong>₹{parseFloat(amount || 0).toLocaleString()}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">From</span><span>{fromBank?.bank_name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">To</span><span>{toBank?.bank_name}</span></div>
          </div>
          
          <div className="text-center mb-3">
            <label className="text-xs font-medium block mb-1.5">Enter UPI PIN</label>
            <div className="flex justify-center gap-2">
              {pin.map((digit, i) => (
                <input key={i} ref={el => pinInputRefs.current[i] = el} type={showPin ? 'text' : 'password'} maxLength="1" value={digit} onChange={(e) => handlePinChange(i, e.target.value)} className={`w-10 h-12 text-center text-lg font-bold border-2 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 ${pinFilled[i] ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'}`} autoFocus={i === 0} inputMode="numeric" />
              ))}
            </div>
            <label className="flex items-center justify-center gap-1.5 mt-1 text-xs text-gray-500 cursor-pointer"><input type="checkbox" checked={showPin} onChange={() => setShowPin(!showPin)} className="accent-primary-500" /> Show PIN</label>
            {pinError && <p className="text-xs text-red-500 mt-1">{pinError}</p>}
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200">Back</button>
            <button onClick={handleTransfer} disabled={loading} className="flex-1 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <FaSpinner className="animate-spin" /> : `Transfer ₹${parseFloat(amount || 0).toLocaleString()}`}
            </button>
          </div>
        </>
      )}
      
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && successData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-5 text-center">
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2"><FaCheckCircle className="text-white text-2xl" /></div>
              <h3 className="font-bold">Transfer Successful!</h3>
              <p className="text-2xl font-bold text-green-600">₹{successData.amount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">from {successData.fromBank} to {successData.toBank}</p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2.5 mt-2 text-left text-sm"><span className="text-gray-500">Txn ID:</span> {successData.transactionId}</div>
              <button onClick={() => { setShowSuccess(false); onTransferComplete(successData); onClose(); }} className="w-full mt-3 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600">Done</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// QR SCANNER COMPONENT
// ============================================

const QRScannerComponent = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(true);
  const simulate = () => {
    const mock = 'upi://pay?pa=merchant@okhdfcbank&pn=Merchant&am=500';
    setScanning(false);
    setTimeout(() => { onScan(mock); onClose(); }, 1000);
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 max-w-sm w-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Scan QR Code</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 rounded-xl h-56 flex items-center justify-center relative overflow-hidden">
        {scanning ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 border-2 border-primary-500 rounded-lg relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary-500"></div>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary-500 animate-pulse"></div>
              </div>
            </div>
            <p className="absolute bottom-4 text-xs text-gray-500">Position QR in frame</p>
          </>
        ) : (
          <div className="text-center">
            <FaCheckCircle className="text-3xl text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium">QR Scanned!</p>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={onClose} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-xl">Cancel</button>
        <button onClick={simulate} className="flex-1 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl">Simulate</button>
      </div>
    </div>
  );
};

// ============================================
// CONTACT DETAILS MODAL
// ============================================

const ContactDetailsModal = ({ contact, onClose, onPay, onRequest, formatDate, contactTransactions, contactTotalReceived }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full max-h-[80vh] overflow-y-auto p-4">
      <button onClick={onClose} className="float-right text-gray-400 hover:text-gray-600"><FaTimes /></button>
      <div className="text-center mb-3">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto" style={{ backgroundColor: getContactColor(contact.name) }}>{contact.name?.charAt(0)?.toUpperCase()}</div>
        <h3 className="font-bold text-lg mt-1">{contact.name}</h3>
        <p className="text-xs text-gray-500">{contact.vpa}</p>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div><div className="font-bold">₹{(contact.totalSent || 0).toLocaleString()}</div><div className="text-gray-400">Sent</div></div>
          <div><div className="font-bold">{contact.transactionCount || 0}</div><div className="text-gray-400">Txn</div></div>
          <div><div className="font-bold">₹{(contactTotalReceived || 0).toLocaleString()}</div><div className="text-gray-400">Received</div></div>
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => onPay(contact)} className="flex-1 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all">Pay</button>
        <button onClick={() => onRequest(contact)} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all">Request</button>
      </div>
      {contactTransactions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">History</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {contactTransactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex justify-between items-center text-xs py-1 border-b border-gray-100 dark:border-gray-700">
                <div><span className="font-medium">{tx.description || 'Payment'}</span><span className="text-gray-400 ml-1">{formatDate(tx.date)}</span></div>
                <span className="text-red-500">-₹{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN SENDMONEY PAGE
// ============================================

const SendMoneyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // State
  const [step, setStep] = useState(1);
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
  const [bankBalances, setBankBalances] = useState({});
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactTransactions, setContactTransactions] = useState([]);
  const [contactTotalReceived, setContactTotalReceived] = useState(0);
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
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [showRequestSuccessModal, setShowRequestSuccessModal] = useState(false);
  const [requestSuccessData, setRequestSuccessData] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  
  // Form data
  const [formData, setFormData] = useState({
    receiver_vpa: location.state?.contact?.vpa || '',
    receiver_name: location.state?.contact?.name || '',
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
  const payPinInputRefs = useRef([]);

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [banks, contactsList] = await Promise.all([
        getBankAccounts(),
        getContacts()
      ]);
      setLinkedBanks(banks || []);
      const primary = banks?.find(b => b.is_primary);
      if (primary) setSelectedBank(primary);
      
      setContacts(contactsList || []);
      const sorted = [...(contactsList || [])].sort((a, b) => 
        new Date(b.last_transaction_at || 0) - new Date(a.last_transaction_at || 0)
      );
      setRecentContacts(sorted.slice(0, 8));
      
      const balances = {};
      for (const bank of (banks || [])) {
        try {
          const resp = await bankAPI.getBalance(bank.id);
          if (resp.data.success) balances[bank.id] = resp.data.data.balance;
        } catch (e) {}
      }
      setBankBalances(balances);
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const handleContactClick = async (contact) => {
    try {
      const allContacts = await getContacts();
      const latest = allContacts.find(c => c.id === contact.id || c.vpa === contact.vpa);
      if (latest) {
        setSelectedContact(latest);
        await loadContactTransactions(latest);
        setShowContactModal(true);
      }
    } catch (error) {
      console.error('Contact click error:', error);
    }
  };

  const loadContactTransactions = async (contact) => {
    try {
      const allTx = await getTransactions();
      const sentTx = allTx.filter(tx => 
        (tx.type === 'send' || tx.type === 'sent') && 
        tx.receiver_vpa === contact.vpa && 
        tx.status === 'success'
      );
      
      const mapped = sentTx.map(tx => ({
        id: tx.id,
        amount: Number(tx.amount),
        date: tx.created_at || tx.date,
        type: 'sent',
        description: tx.description,
        transactionId: tx.transactionId
      }));
      
      setContactTransactions(mapped.sort((a, b) => new Date(b.date) - new Date(a.date)));
      const totalSent = sentTx.reduce((sum, tx) => sum + Number(tx.amount), 0);
      setSelectedContact(prev => ({ ...prev, totalSent, transactionCount: sentTx.length }));
      setContactTotalReceived(contact.total_received || 0);
    } catch (error) {
      console.error('Load contact transactions error:', error);
    }
  };

  const handlePayFromContact = (contact) => {
    setSelectedContact(contact);
    setPayAmount('');
    setPayNote('');
    setPayStep(1);
    setSelectedBankForPay(null);
    setPayPinDigits(['', '', '', '']);
    setPayPinFilled([false, false, false, false]);
    setShowPayModal(true);
    setShowContactModal(false);
  };

  const handleRequestFromContact = (contact) => {
    setSelectedContact(contact);
    setRequestAmount('');
    setRequestNote('');
    setShowContactModal(false);
    setTimeout(() => setShowRequestModal(true), 150);
  };

  const processRequest = async () => {
    const amount = parseFloat(requestAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    
    setRequestLoading(true);
    try {
      const newRequest = {
        id: Date.now(),
        requestId: `REQ${Date.now()}`,
        amount,
        description: requestNote || `Money request from ${selectedContact.name}`,
        requester_name: user?.name || 'User',
        requester_vpa: user?.phone_number ? `${user.phone_number}@sabai` : '',
        recipient_name: selectedContact.name,
        recipient_vpa: selectedContact.vpa,
        date: new Date().toISOString(),
        status: 'pending'
      };
      
      const existing = await getMoneyRequests();
      const arr = Array.isArray(existing) ? existing : [];
      arr.unshift(newRequest);
      await setMoneyRequests(arr);
      
      setRequestSuccessData({ amount, contactName: selectedContact.name, requestId: newRequest.requestId });
      setShowRequestSuccessModal(true);
      setShowRequestModal(false);
      toast.success(`Request sent to ${selectedContact.name}`);
    } catch (error) {
      toast.error('Failed to send request');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleQRScan = (data) => {
    let vpa = data, amount = '', name = '';
    if (data.startsWith('upi://')) {
      try {
        const pa = data.match(/[&?]pa=([^&]+)/);
        const pn = data.match(/[&?]pn=([^&]+)/);
        const am = data.match(/[&?]am=([^&]+)/);
        if (pa) vpa = decodeURIComponent(pa[1]);
        if (pn) name = decodeURIComponent(pn[1]);
        if (am) amount = decodeURIComponent(am[1]);
      } catch (e) {}
    }
    setFormData({ ...formData, receiver_vpa: vpa, receiver_name: name, amount: amount || formData.amount });
    toast.success(`QR scanned: ${name || vpa}`);
    if (amount && vpa) setTimeout(() => setStep(2), 400);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.receiver_vpa) newErrors.receiver_vpa = 'UPI ID is required';
    else if (!/^[\w.-]+@[\w.-]+$/.test(formData.receiver_vpa) && !/^[6-9]\d{9}$/.test(formData.receiver_vpa)) {
      newErrors.receiver_vpa = 'Enter valid UPI ID or mobile';
    }
    if (!formData.amount) newErrors.amount = 'Amount is required';
    else if (isNaN(formData.amount) || formData.amount <= 0) newErrors.amount = 'Enter valid amount';
    else if (formData.amount > 100000) newErrors.amount = 'Max ₹1,00,000';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateForm()) return;
      setStep(2);
    } else if (step === 2) {
      if (!selectedBank) { toast.error('Select a bank account'); return; }
      setStep(3);
      setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
    }
  };

  const handleSendMoney = async () => {
    const pinStr = pin.join('');
    if (pinStr.length !== 4) { setPinError('Enter complete PIN'); return; }
    
    const amount = parseFloat(formData.amount);
    try {
      const isValid = await verifyBankPin(selectedBank.id, pinStr);
      if (!isValid) { setPinError('Incorrect PIN'); setPin(['','','','']); return; }
      
      const balance = bankBalances[selectedBank.id] || 0;
      if (amount > balance) { toast.error(`Insufficient balance: ₹${balance.toLocaleString()}`); return; }
      
      setLoading(true);
      await updateBankBalance(selectedBank.id, amount, false);
      
      const tx = {
        transactionId: `TXN${Date.now()}`,
        type: 'send',
        amount,
        description: formData.note || `Payment to ${formData.receiver_name || formData.receiver_vpa}`,
        receiver_vpa: formData.receiver_vpa,
        receiver_name: formData.receiver_name,
        bank_name: selectedBank.bank_name,
        bank_id: selectedBank.id,
        cashback_earned: 0,
        status: 'success',
        date: new Date().toISOString()
      };
      
      await addTransaction(tx);
      await addContact({ name: formData.receiver_name || formData.receiver_vpa.split('@')[0], vpa: formData.receiver_vpa, amount, is_received: false });
      
      setTransactionResult(tx);
      setShowSuccessAnimation(true);
      setLoading(false);
      await loadData();
    } catch (error) {
      toast.error('Payment failed');
      setLoading(false);
    }
  };

  const processPaymentFromModal = async () => {
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('Enter valid amount'); return; }
    
    const pinStr = payPinDigits.join('');
    if (pinStr.length !== 4) { setPayPinError('Enter complete PIN'); return; }
    
    try {
      const isValid = await verifyBankPin(selectedBankForPay.id, pinStr);
      if (!isValid) { setPayPinError('Incorrect PIN'); setPayPinDigits(['','','','']); return; }
      
      const balance = bankBalances[selectedBankForPay.id] || 0;
      if (amount > balance) { toast.error(`Insufficient balance`); return; }
      
      setPayLoading(true);
      await updateBankBalance(selectedBankForPay.id, amount, false);
      
      const tx = {
        transactionId: `TXN${Date.now()}`,
        type: 'send',
        amount,
        description: payNote || `Payment to ${selectedContact.name}`,
        receiver_vpa: selectedContact.vpa,
        receiver_name: selectedContact.name,
        bank_name: selectedBankForPay.bank_name,
        bank_id: selectedBankForPay.id,
        cashback_earned: 0,
        status: 'success',
        date: new Date().toISOString()
      };
      
      await addTransaction(tx);
      await addContact({ name: selectedContact.name, vpa: selectedContact.vpa, amount, is_received: false });
      
      setTransactionResult(tx);
      setShowSuccessAnimation(true);
      setShowPayModal(false);
      setPayLoading(false);
      await loadData();
      toast.success(`₹${amount.toLocaleString()} sent to ${selectedContact.name}`);
    } catch (error) {
      toast.error('Payment failed');
      setPayLoading(false);
    }
  };

  const handleBankSelectForPay = (bank) => {
    try {
      if (!hasUpiPin(bank.id)) {
        toast.error(`Set UPI PIN for ${bank.bank_name} in Settings`);
        return;
      }
      setSelectedBankForPay(bank);
      setPayStep(2);
      setTimeout(() => payPinInputRefs.current[0]?.focus(), 100);
    } catch (error) {
      toast.error('Error selecting bank');
    }
  };

  const handlePayPinChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newPin = [...payPinDigits];
    newPin[index] = value || '';
    setPayPinDigits(newPin);
    const newFilled = [...payPinFilled];
    newFilled[index] = value !== '';
    setPayPinFilled(newFilled);
    if (value && index < 3) {
      const next = document.getElementById(`pay-pin-${index + 1}`);
      if (next) next.focus();
    }
  };

  const handlePayPinKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !payPinDigits[index] && index > 0) {
      const prev = document.getElementById(`pay-pin-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  const getBankLogo = (bank) => {
    const url = getBankLogoUrl(bank.bank_name);
    if (url && !imageErrors[bank.id]) {
      return <img src={url} alt={bank.bank_name} className="w-8 h-8 object-contain rounded" onError={() => setImageErrors(prev => ({...prev, [bank.id]: true}))} />;
    }
    return <FaUniversity className="text-gray-400" />;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
      amount: '',
      note: ''
    });
    setPin(['', '', '', '']);
    setPinFilled([false, false, false, false]);
    setSelectedBank(null);
  };

  const handleSplitComplete = (data) => {
    toast.success(`Split created for ₹${data.totalAmount.toLocaleString()}`);
    setShowSplitModal(false);
  };

  const handleSelfTransferComplete = (data) => {
    toast.success(`₹${data.amount.toLocaleString()} transferred!`);
    setShowSelfTransferModal(false);
    loadData();
  };

  // Progress Steps Component
  const ProgressSteps = ({ step }) => (
    <div className="flex items-center justify-between mb-4 px-1">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-0.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= s ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {step > s ? <FaCheckCircle className="text-xs" /> : s}
            </div>
            <span className={`text-[9px] font-medium ${step >= s ? 'text-primary-500' : 'text-gray-400'}`}>
              {s === 1 ? 'Details' : s === 2 ? 'Bank' : 'Pay'}
            </span>
          </div>
          {s < 3 && <div className={`flex-1 h-0.5 mx-1 ${step > s ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  // Main Render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-1 md:p-4">
      {/* Back Button */}
      <button 
        onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
        className="flex items-center gap-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-gray-800 px-3 py-0 rounded-full text-sm font-medium transition-all mb-0"
      >
        <FaArrowLeft className="text-xs" /> Back
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          
          {/* Header */}
          <div className="text-center mb-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent">
              Send Money
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Fast & secure payments</p>
          </div>

          {/* Progress */}
          <ProgressSteps step={step} />

          {/* STEP 1: Details */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button onClick={() => setShowScanner(true)} className="flex items-center justify-center gap-1.5 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-xl hover:bg-primary-100 transition-all">
                  <MdQrCodeScanner className="text-sm" /> Scan
                </button>
                <button onClick={() => setShowSplitModal(true)} className="flex items-center justify-center gap-1.5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-xl hover:bg-gray-200 transition-all">
                  <FaUsers className="text-sm" /> Split
                </button>
                <button onClick={() => setShowSelfTransferModal(true)} className="flex items-center justify-center gap-1.5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-xl hover:bg-gray-200 transition-all">
                  <FaExchangeAlt className="text-sm" /> Transfer
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    const filtered = contacts.filter(c => 
                      c.name?.toLowerCase().includes(e.target.value.toLowerCase()) ||
                      c.vpa?.toLowerCase().includes(e.target.value.toLowerCase())
                    );
                    setFilteredContacts(filtered);
                    setShowContactsModal(true);
                  }}
                  onFocus={() => setShowContactsModal(true)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
                {showContactsModal && searchTerm && filteredContacts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredContacts.slice(0, 8).map(c => (
                      <button key={c.id} onClick={() => { setFormData({...formData, receiver_vpa: c.vpa, receiver_name: c.name}); setSearchTerm(''); setShowContactsModal(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: getContactColor(c.name) }}>{c.name?.charAt(0)?.toUpperCase()}</div>
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{c.name}</p><p className="text-xs text-gray-500 truncate">{c.vpa}</p></div>
                      </button>
                    ))}
                    <button onClick={() => setShowContactsModal(false)} className="w-full py-1.5 text-xs text-center text-primary-500 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50">Close</button>
                  </div>
                )}
              </div>

              {/* Recent Contacts */}
              {recentContacts.length > 0 && !showContactsModal && (
                <div className="mb-3">
                  <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Recent</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentContacts.slice(0, 8).map(c => (
                      <button key={c.id} onClick={() => handleContactClick(c)} className="flex flex-col items-center gap-0.5 p-1 min-w-[44px]">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: getContactColor(c.name) }}>{c.name?.charAt(0)?.toUpperCase()}</div>
                        <span className="text-[8px] text-gray-500 dark:text-gray-400 truncate max-w-[44px]">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form */}
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">UPI ID / Mobile <span className="text-red-500">*</span></label>
                  <div className="relative mt-0.5">
                    <FaMobile className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input type="text" value={formData.receiver_vpa} onChange={(e) => setFormData({...formData, receiver_vpa: e.target.value})} placeholder="name@okhdfcbank" className={`w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 ${errors.receiver_vpa ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-200'}`} />
                  </div>
                  {errors.receiver_vpa && <p className="text-[10px] text-red-500 mt-0.5">{errors.receiver_vpa}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Recipient Name</label>
                  <div className="relative mt-0.5">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input type="text" value={formData.receiver_name} onChange={(e) => setFormData({...formData, receiver_name: e.target.value})} placeholder="Enter name" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Amount (₹) <span className="text-red-500">*</span></label>
                  <div className="relative mt-0.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">₹</span>
                    <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="0" className={`w-full pl-7 pr-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 ${errors.amount ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-200'}`} />
                  </div>
                  {errors.amount && <p className="text-[10px] text-red-500 mt-0.5">{errors.amount}</p>}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {quickAmounts.map(amt => (
                      <button key={amt} onClick={() => setFormData({...formData, amount: amt})} className={`px-2.5 py-0.5 text-[10px] rounded-full border transition-all ${parseFloat(formData.amount) === amt ? 'bg-primary-500 text-white border-primary-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-200'}`}>₹{amt}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Note</label>
                  <div className="relative mt-0.5">
                    <FaEdit className="absolute left-3 top-2.5 text-gray-400 text-sm" />
                    <input type="text" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} placeholder="What's it for?" maxLength={100} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200" />
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                    <span>{formData.note?.length || 0}/100</span>
                    <span>💡 Helps track payments</span>
                  </div>
                </div>

                <button onClick={handleNext} className="w-full py-2.5 text-sm font-medium bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  Continue <FaArrowRight className="text-xs" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Bank Selection */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-3">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Amount</span><strong>₹{parseFloat(formData.amount || 0).toLocaleString()}</strong></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">To</span><span>{formData.receiver_name || formData.receiver_vpa}</span></div>
                {formData.note && <div className="flex justify-between text-sm"><span className="text-gray-500">Note</span><span className="text-xs truncate max-w-[120px]">{formData.note}</span></div>}
              </div>

              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Select Bank Account</p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {linkedBanks.length > 0 ? linkedBanks.map(bank => {
                  const hasPin = hasUpiPin(bank.id);
                  return (
                    <button key={bank.id} onClick={() => { if (hasPin) setSelectedBank(bank); else toast.error(`Set UPI PIN for ${bank.bank_name}`); }} className={`w-full flex items-center gap-3 p-2.5 border rounded-xl transition-all ${selectedBank?.id === bank.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'} ${!hasPin ? 'opacity-50' : ''}`}>
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-600 flex-shrink-0 overflow-hidden">{getBankLogo(bank)}</div>
                      <div className="flex-1 text-left"><p className="text-sm font-medium">{bank.bank_name}</p><p className="text-xs text-gray-500">xxxx{bank.account_number?.slice(-4)}</p></div>
                      {!hasPin && <span className="text-[9px] text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">No PIN</span>}
                      {selectedBank?.id === bank.id && <FaCheckCircle className="text-primary-500 text-sm" />}
                    </button>
                  );
                }) : (
                  <div className="text-center py-4"><FaUniversity className="text-2xl text-gray-300 mx-auto mb-1" /><p className="text-sm text-gray-500">No banks linked</p><button onClick={() => navigate('/settings?tab=bank')} className="text-xs text-primary-500 mt-1">Add Bank</button></div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button onClick={() => setStep(1)} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all">Back</button>
                <button onClick={handleNext} disabled={!selectedBank} className="flex-1 py-2 text-sm font-medium bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50">Continue</button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PIN */}
          {step === 3 && selectedBank && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-600 overflow-hidden">{getBankLogo(selectedBank)}</div>
                <div className="flex-1"><p className="text-sm font-medium">{selectedBank.bank_name}</p><p className="text-xs text-gray-500">xxxx{selectedBank.account_number?.slice(-4)}</p></div>
              </div>

              <div className="text-center mb-3">
                <div className="text-2xl font-bold">₹{parseFloat(formData.amount).toLocaleString()}</div>
                <div className="text-xs text-gray-500">to {formData.receiver_name || formData.receiver_vpa}</div>
              </div>

              <div className="text-center mb-3">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Enter UPI PIN</label>
                <div className="flex justify-center gap-2">
                  {pin.map((digit, i) => (
                    <input key={i} ref={el => pinInputRefs.current[i] = el} type={showPin ? 'text' : 'password'} maxLength="1" value={digit} onChange={(e) => { const val = e.target.value; if (val && !/^\d$/.test(val)) return; const newPin = [...pin]; newPin[i] = val || ''; setPin(newPin); const newFilled = [...pinFilled]; newFilled[i] = val !== ''; setPinFilled(newFilled); if (val && i < 3) pinInputRefs.current[i+1]?.focus(); }} onKeyDown={(e) => { if (e.key === 'Backspace' && !pin[i] && i > 0) pinInputRefs.current[i-1]?.focus(); }} className={`w-10 h-12 text-center text-lg font-bold border-2 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 ${pinFilled[i] ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'}`} autoFocus={i === 0} inputMode="numeric" />
                  ))}
                </div>
                <label className="flex items-center justify-center gap-1.5 mt-1.5 text-xs text-gray-500 cursor-pointer"><input type="checkbox" checked={showPin} onChange={() => setShowPin(!showPin)} className="accent-primary-500" /> Show PIN</label>
                {pinError && <p className="text-xs text-red-500 mt-1">{pinError}</p>}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all">Back</button>
                <button onClick={handleSendMoney} disabled={loading} className="flex-1 py-2 text-sm font-medium bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <FaSpinner className="animate-spin" /> : <>Pay ₹{parseFloat(formData.amount || 0).toLocaleString()}</>}
                </button>
              </div>
              <button onClick={() => navigate('/settings?tab=bank')} className="text-center w-full mt-2 text-xs text-primary-500 hover:underline">Forgot PIN?</button>
            </motion.div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {/* QR Scanner */}
      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <QRScannerComponent onScan={handleQRScan} onClose={() => setShowScanner(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* Contact Modal */}
      <AnimatePresence>
        {showContactModal && selectedContact && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <ContactDetailsModal 
              contact={selectedContact}
              onClose={() => setShowContactModal(false)}
              onPay={handlePayFromContact}
              onRequest={handleRequestFromContact}
              formatDate={formatDate}
              contactTransactions={contactTransactions}
              contactTotalReceived={contactTotalReceived}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Pay Modal */}
      <AnimatePresence>
        {showPayModal && selectedContact && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-4 max-h-[90vh] overflow-y-auto">
              <button onClick={() => { setShowPayModal(false); setPayStep(1); }} className="float-right text-gray-400 hover:text-gray-600"><FaTimes /></button>
              <div className="text-center mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white mx-auto" style={{ backgroundColor: getContactColor(selectedContact.name) }}>{selectedContact.name?.charAt(0)?.toUpperCase()}</div>
                <h4 className="font-bold">Pay {selectedContact.name}</h4>
                <p className="text-xs text-gray-500">{selectedContact.vpa}</p>
              </div>

              {payStep === 1 ? (
                <>
                  <div className="mb-3">
                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span><input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0" className="w-full pl-7 pr-3 py-2.5 text-lg font-bold border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200" autoFocus /></div>
                    <div className="flex flex-wrap gap-1 mt-1.5 justify-center">{quickAmounts.map(a => <button key={a} onClick={() => setPayAmount(a)} className="px-2.5 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-all">₹{a}</button>)}</div>
                    <input type="text" value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Add a note" maxLength={100} className="w-full mt-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200" />
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Bank</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {linkedBanks.filter(b => hasUpiPin(b.id)).map(bank => (
                      <button key={bank.id} onClick={() => handleBankSelectForPay(bank)} className={`w-full flex items-center gap-2 p-2 border rounded-xl transition-all ${selectedBankForPay?.id === bank.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">{getBankLogo(bank)}</div>
                        <div className="flex-1 text-left"><p className="text-sm font-medium">{bank.bank_name}</p><p className="text-xs text-gray-500">xxxx{bank.account_number?.slice(-4)}</p></div>
                        {selectedBankForPay?.id === bank.id && <FaCheckCircle className="text-primary-500 text-sm" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setShowPayModal(false)} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200">Cancel</button>
                    <button onClick={() => { if (!selectedBankForPay) { toast.error('Select bank'); return; } if (!payAmount || parseFloat(payAmount) <= 0) { toast.error('Enter amount'); return; } setPayStep(2); }} className="flex-1 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all">Next</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5 mb-3 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-gray-500">Amount</span><strong>₹{parseFloat(payAmount || 0).toLocaleString()}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">To</span><span>{selectedContact.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">From</span><span>{selectedBankForPay?.bank_name}</span></div>
                  </div>
                  <div className="text-center mb-3">
                    <label className="text-xs font-medium block mb-1.5">Enter UPI PIN</label>
                    <div className="flex justify-center gap-2">
                      {payPinDigits.map((d, i) => (
                        <input key={i} id={`pay-pin-${i}`} ref={el => payPinInputRefs.current[i] = el} type={showPayPin ? 'text' : 'password'} maxLength="1" value={d} onChange={(e) => handlePayPinChange(i, e.target.value)} onKeyDown={(e) => handlePayPinKeyDown(e, i)} className={`w-10 h-12 text-center text-lg font-bold border-2 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 ${payPinFilled[i] ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'}`} autoFocus={i === 0} inputMode="numeric" />
                      ))}
                    </div>
                    <label className="flex items-center justify-center gap-1.5 mt-1 text-xs text-gray-500 cursor-pointer"><input type="checkbox" checked={showPayPin} onChange={() => setShowPayPin(!showPayPin)} className="accent-primary-500" /> Show PIN</label>
                    {payPinError && <p className="text-xs text-red-500 mt-1">{payPinError}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPayStep(1)} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200">Back</button>
                    <button onClick={processPaymentFromModal} disabled={payLoading} className="flex-1 py-2 text-sm font-medium bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {payLoading ? <FaSpinner className="animate-spin" /> : <>Pay ₹{parseFloat(payAmount || 0).toLocaleString()}</>}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Modal */}
      <AnimatePresence>
        {showRequestModal && selectedContact && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-4">
              <button onClick={() => setShowRequestModal(false)} className="float-right text-gray-400 hover:text-gray-600"><FaTimes /></button>
              <div className="text-center mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white mx-auto" style={{ backgroundColor: getContactColor(selectedContact.name) }}>{selectedContact.name?.charAt(0)?.toUpperCase()}</div>
                <h4 className="font-bold">Request from {selectedContact.name}</h4>
              </div>
              <div className="relative mb-2"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span><input type="number" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} placeholder="0" className="w-full pl-7 pr-3 py-2.5 text-lg font-bold border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200" autoFocus /></div>
              <div className="flex flex-wrap gap-1 mb-2 justify-center">{quickAmounts.slice(0, 5).map(a => <button key={a} onClick={() => setRequestAmount(a)} className="px-2.5 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200">₹{a}</button>)}</div>
              <input type="text" value={requestNote} onChange={(e) => setRequestNote(e.target.value)} placeholder="Add a note" className="w-full mb-3 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200" />
              <div className="flex gap-2">
                <button onClick={() => setShowRequestModal(false)} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200">Cancel</button>
                <button onClick={processRequest} disabled={requestLoading || !requestAmount} className="flex-1 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {requestLoading ? <FaSpinner className="animate-spin" /> : <>Request ₹{requestAmount ? parseFloat(requestAmount).toLocaleString() : '0'}</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Success */}
      <AnimatePresence>
        {showRequestSuccessModal && requestSuccessData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-5 text-center">
              <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2"><FaArrowDown className="text-white text-xl" /></div>
              <h3 className="font-bold text-lg">Request Sent!</h3>
              <p className="text-2xl font-bold text-green-600">₹{requestSuccessData.amount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">to {requestSuccessData.contactName}</p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2.5 mt-2 text-left text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Request ID</span><span className="font-mono text-xs">{requestSuccessData.requestId}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Expires</span><span>7 days</span></div>
              </div>
              <button onClick={() => setShowRequestSuccessModal(false)} className="w-full mt-3 py-2.5 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all">Done</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Split Modal - FULL VERSION */}
      <AnimatePresence>
        {showSplitModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto">
              <SplitPaymentModal 
                onClose={() => setShowSplitModal(false)}
                onSplitComplete={handleSplitComplete}
                contacts={contacts}
                user={user}
                bankBalances={bankBalances}
                linkedBanks={linkedBanks}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Self Transfer Modal - FULL VERSION */}
      <AnimatePresence>
        {showSelfTransferModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto">
              <SelfTransferModal 
                onClose={() => setShowSelfTransferModal(false)}
                onTransferComplete={handleSelfTransferComplete}
                linkedBanks={linkedBanks}
                bankBalances={bankBalances}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccessAnimation && transactionResult && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-5 text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-lg"><img src="/images/merchants/sabailogo.png" alt="SabAI" className="w-8 h-8 object-contain" /></div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow"><FaCheckCircle className="text-green-500 text-sm" /></div>
              </div>
              <h3 className="font-bold">Payment Successful!</h3>
              <p className="text-2xl font-bold text-green-600">₹{transactionResult.amount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">to {transactionResult.receiver_name || transactionResult.receiver_vpa}</p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2.5 mt-2 text-left text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Txn ID</span><span className="font-mono text-xs">{transactionResult.transactionId}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">From</span><span>{transactionResult.bank_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time</span><span>{new Date().toLocaleString()}</span></div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleViewTransaction} className="flex-1 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all">View Transaction</button>
                <button onClick={handleNewPayment} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all">New Payment</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Failed Animation */}
      <AnimatePresence>
        {showFailedAnimation && failedTransactionResult && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-5 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-2"><FaTimesCircle className="text-red-500 text-3xl" /></div>
              <h3 className="font-bold text-red-500">Payment Failed!</h3>
              <p className="text-2xl font-bold">₹{failedTransactionResult.amount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">to {failedTransactionResult.receiver_name}</p>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-2.5 mt-2 text-sm"><span className="text-red-500">⚠️</span> {failedTransactionResult.failure_reason}</div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setShowFailedAnimation(false); setFailedTransactionResult(null); }} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200">Close</button>
                <button onClick={() => { setShowFailedAnimation(false); setFailedTransactionResult(null); setStep(2); }} className="flex-1 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all">Retry</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SendMoneyPage;