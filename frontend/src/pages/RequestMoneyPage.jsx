// frontend/src/pages/RequestMoneyPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import storageService from '../services/storageService';
import { 
  FaArrowLeft, FaSearch, FaUser, FaRupeeSign, FaArrowRight,
  FaCheckCircle, FaTimes, FaSpinner, FaHistory, FaEdit,
  FaMobile, FaUsers, FaQrcode, FaCopy, FaWhatsapp, FaEnvelope,
  FaLink, FaArrowDown, FaClock, FaTrash
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import QRScanner from '../components/upi/QRScanner';
import SplitPaymentModal from '../components/SplitPaymentModal';

const getContactColor = (name) => {
  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'];
  let hash = 0;
  for (let i = 0; i < name?.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
};

const RequestMoneyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContacts, setShowContacts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestLink, setRequestLink] = useState('');
  const [requestId, setRequestId] = useState('');
  const [requestSuccessData, setRequestSuccessData] = useState(null);
  
  const [formData, setFormData] = useState({
    vpa: '',
    name: '',
    amount: '',
    note: ''
  });
  const [errors, setErrors] = useState({});

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contactsData, requestsData] = await Promise.all([
        storageService.getContacts(),
        storageService.getMoneyRequests()
      ]);
      setContacts(contactsData || []);
      setFilteredContacts(contactsData || []);
      
      const sorted = (requestsData || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentRequests(sorted.slice(0, 10));
      
      const currentUserVpa = user?.phone_number ? `${user.phone_number}@sabai` : '';
      const pending = (requestsData || []).filter(r => 
        r.status === 'pending' && r.recipient_vpa === currentUserVpa
      );
      setPendingRequests(pending);
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.vpa) newErrors.vpa = 'UPI ID is required';
    else if (!/^[\w.-]+@[\w.-]+$/.test(formData.vpa) && !/^[6-9]\d{9}$/.test(formData.vpa)) {
      newErrors.vpa = 'Enter a valid UPI ID or mobile number';
    }
    if (!formData.amount) newErrors.amount = 'Amount is required';
    else if (isNaN(formData.amount) || formData.amount <= 0) newErrors.amount = 'Enter a valid amount';
    else if (formData.amount > 100000) newErrors.amount = 'Maximum ₹1,00,000';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      const currentUserVpa = user?.phone_number ? `${user.phone_number}@sabai` : '';
      
      const newRequest = {
        requestId: `REQ${Date.now()}${Math.floor(Math.random() * 1000)}`,
        amount,
        description: formData.note || 'Money request',
        requester_vpa: currentUserVpa,
        requester_name: user?.name || 'User',
        recipient_vpa: formData.vpa,
        recipient_name: formData.name || formData.vpa.split('@')[0],
        date: new Date().toISOString(),
        status: 'pending'
      };
      
      await storageService.addMoneyRequest(newRequest);
      
      const link = `https://sabaipay.com/pay?request=${newRequest.requestId}`;
      setRequestLink(link);
      setRequestId(newRequest.requestId);
      
      setRequestSuccessData({
        amount: formData.amount,
        contactName: newRequest.recipient_name,
        requestId: newRequest.requestId,
        note: formData.note
      });
      
      setShowSuccess(true);
      setFormData({ vpa: '', name: '', amount: '', note: '' });
      await loadData();
      toast.success(`Request sent to ${newRequest.recipient_name}`);
    } catch (error) {
      toast.error('Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 md:p-4">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-gray-800 px-3 py-2 rounded-full text-sm font-medium transition-all mb-3"
      >
        <FaArrowLeft className="text-xs" /> Back
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent">
              Request Money
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Request money from friends and family</p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowScanner(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              <FaQrcode /> Scan QR
            </button>
            <button
              onClick={() => {
                const amount = parseFloat(formData.amount);
                if (!amount || amount <= 0) {
                  toast.error('Enter an amount first');
                  return;
                }
                setShowSplitModal(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all"
            >
              <FaUsers /> Split
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                const filtered = contacts.filter(c =>
                  c.name?.toLowerCase().includes(e.target.value.toLowerCase()) ||
                  c.vpa?.toLowerCase().includes(e.target.value.toLowerCase())
                );
                setFilteredContacts(filtered);
                setShowContacts(true);
              }}
              onFocus={() => setShowContacts(true)}
              placeholder="Search by name, UPI ID or phone..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            
            {showContacts && searchTerm && filteredContacts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                {filteredContacts.slice(0, 10).map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setFormData({...formData, vpa: contact.vpa, name: contact.name});
                      setSearchTerm('');
                      setShowContacts(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: getContactColor(contact.name) }}>
                      {contact.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-gray-500 truncate">{contact.vpa}</p>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => setShowContacts(false)}
                  className="w-full py-2 text-xs text-center text-primary-500 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Recent Contacts */}
          {contacts.length > 0 && !showContacts && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Recent Contacts</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {contacts.slice(0, 8).map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => setFormData({...formData, vpa: contact.vpa, name: contact.name})}
                    className="flex flex-col items-center gap-0.5 p-1.5 min-w-[52px]"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm" style={{ backgroundColor: getContactColor(contact.name) }}>
                      {contact.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-[9px] text-gray-600 dark:text-gray-400 truncate max-w-[52px]">{contact.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-3">
            {/* VPA */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                UPI ID / Mobile <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-0.5">
                <FaMobile className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={formData.vpa}
                  onChange={(e) => setFormData({...formData, vpa: e.target.value})}
                  placeholder="friend@okhdfcbank or 9876543210"
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 ${
                    errors.vpa ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-200'
                  }`}
                />
              </div>
              {errors.vpa && <p className="text-[10px] text-red-500 mt-0.5">{errors.vpa}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Name (Optional)</label>
              <div className="relative mt-0.5">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter name"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-0.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">₹</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0"
                  className={`w-full pl-7 pr-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 ${
                    errors.amount ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-200'
                  }`}
                />
              </div>
              {errors.amount && <p className="text-[10px] text-red-500 mt-0.5">{errors.amount}</p>}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setFormData({...formData, amount: amt})}
                    className={`px-3 py-0.5 text-xs rounded-full border transition-all ${
                      parseFloat(formData.amount) === amt
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Note (Optional)</label>
              <div className="relative mt-0.5">
                <FaEdit className="absolute left-3 top-3 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  placeholder="What's it for?"
                  maxLength={100}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                <span>{formData.note?.length || 0}/100</span>
                <span>💡 Helps track requests</span>
              </div>
            </div>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Pending Requests</p>
                  <button onClick={() => setShowHistory(true)} className="text-[10px] text-primary-500">View All</button>
                </div>
                {pendingRequests.slice(0, 2).map(req => (
                  <div key={req.id} className="flex items-center justify-between px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-white text-xs font-bold">
                        {req.requester_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{req.requester_name || req.requester_vpa}</p>
                        <p className="text-[10px] text-yellow-600">₹{req.amount}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button className="px-2 py-0.5 text-[9px] bg-primary-100 text-primary-600 rounded-full hover:bg-primary-200">Resend</button>
                      <button className="px-2 py-0.5 text-[9px] bg-red-100 text-red-600 rounded-full hover:bg-red-200">Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 text-sm font-medium bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <><FaArrowDown /> Request</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner
            isOpen={showScanner}
            onClose={() => setShowScanner(false)}
            onScan={(data) => {
              setShowScanner(false);
              try {
                if (data.includes('@')) {
                  setFormData({...formData, vpa: data});
                  toast.success('UPI ID scanned!');
                } else if (data.includes('upi://')) {
                  const url = new URL(data);
                  const params = new URLSearchParams(url.search);
                  const vpa = params.get('pa');
                  if (vpa) {
                    setFormData({...formData, vpa: vpa});
                    toast.success('UPI ID scanned!');
                  }
                }
              } catch (e) {
                toast.error('Invalid QR code');
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Split Payment Modal */}
      <AnimatePresence>
        {showSplitModal && (
          <SplitPaymentModal
            totalAmount={parseFloat(formData.amount) || 0}
            contacts={contacts}
            onClose={() => setShowSplitModal(false)}
            onSplit={async (data) => {
              try {
                const token = localStorage.getItem('token');
                const response = await axios.post('/api/features/split/create', data, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                  toast.success('Split payment created!');
                  setShowSplitModal(false);
                }
              } catch (error) {
                toast.error('Failed to create split');
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && requestSuccessData && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-5 text-center"
            >
              <div className="w-14 h-14 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mb-3">
                <FaArrowDown className="text-white text-2xl" />
              </div>
              <h2 className="text-lg font-bold">Request Sent!</h2>
              <p className="text-2xl font-bold text-green-600 my-1">₹{requestSuccessData.amount}</p>
              <p className="text-sm text-gray-500">from {requestSuccessData.contactName}</p>
              
              <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-left space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Request ID</span>
                  <span className="font-mono text-xs">{requestSuccessData.requestId}</span>
                </div>
                {requestSuccessData.note && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Note</span>
                    <span>{requestSuccessData.note}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Expires</span>
                  <span>7 days</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setShowSuccess(false); setShowHistory(true); }}
                  className="flex-1 py-2.5 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all"
                >
                  View Requests
                </button>
                <button
                  onClick={() => { setShowSuccess(false); setFormData({ vpa: '', name: '', amount: '', note: '' }); }}
                  className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all"
                >
                  New Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold">Request History</h3>
                <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                  <FaTimes />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {recentRequests.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No requests yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                            {req.requester_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{req.requester_name || req.requester_vpa}</p>
                            <p className="text-xs text-gray-500">₹{req.amount} • {new Date(req.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          req.status === 'paid' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RequestMoneyPage;