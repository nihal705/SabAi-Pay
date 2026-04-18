import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FaBolt,
  FaTint,
  FaMobile,
  FaWifi,
  FaFire,
  FaCreditCard,
  FaHistory,
  FaCalendarAlt,
  FaRupeeSign,
  FaCheckCircle,
  FaExclamationCircle,
  FaPlus,
  FaTrash,
  FaEdit,
  FaBell
} from 'react-icons/fa';
import { MdElectricalServices, MdWaterDrop, MdLocalGasStation } from 'react-icons/md';
import Input from '../common/Input';
import Button from '../common/Button';
import Modal, { ConfirmModal } from '../common/Modal';
import axios from 'axios';
import toast from 'react-hot-toast';
import './UPIStyles.css';

const BillPayments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('electricity');
  const [showAddBill, setShowAddBill] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [bills, setBills] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [formData, setFormData] = useState({
    bill_type: 'electricity',
    provider: '',
    customer_id: '',
    amount: '',
    due_date: '',
    auto_pay: false,
    max_amount: ''
  });
  const [errors, setErrors] = useState({});

  const billCategories = [
    { id: 'electricity', name: 'Electricity', icon: FaBolt, color: '#fbbf24', providers: ['Tata Power', 'Adani Electricity', 'BSES', 'Torrent Power'] },
    { id: 'water', name: 'Water', icon: FaTint, color: '#3b82f6', providers: ['Municipal Corporation', 'BMC', 'DWSS'] },
    { id: 'mobile', name: 'Mobile', icon: FaMobile, color: '#10b981', providers: ['Airtel', 'Jio', 'Vi', 'BSNL'] },
    { id: 'broadband', name: 'Broadband', icon: FaWifi, color: '#8b5cf6', providers: ['JioFiber', 'Airtel Xstream', 'ACT', 'Hathway'] },
    { id: 'gas', name: 'Gas', icon: FaFire, color: '#ef4444', providers: ['HP Gas', 'Indane', 'Bharat Gas'] },
    { id: 'credit_card', name: 'Credit Card', icon: FaCreditCard, color: '#ec4899', providers: ['HDFC', 'ICICI', 'SBI', 'Axis'] }
  ];

  useEffect(() => {
    fetchBills();
    fetchRecentPayments();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/transactions/bills/recurring`);
      if (response.data.success) {
        setBills(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/transactions?type=bill&limit=5`);
      if (response.data.success) {
        setRecentPayments(response.data.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.provider) {
      newErrors.provider = 'Provider is required';
    }

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer ID/Account number is required';
    }

    if (formData.amount && (isNaN(formData.amount) || formData.amount <= 0)) {
      newErrors.amount = 'Enter a valid amount';
    }

    if (formData.max_amount && (isNaN(formData.max_amount) || formData.max_amount <= 0)) {
      newErrors.max_amount = 'Enter a valid maximum amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddBill = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/transactions/bills/recurring`, formData);
      
      if (response.data.success) {
        toast.success('Bill added successfully');
        setShowAddBill(false);
        fetchBills();
        setFormData({
          bill_type: 'electricity',
          provider: '',
          customer_id: '',
          amount: '',
          due_date: '',
          auto_pay: false,
          max_amount: ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = async (bill) => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/upi/pay-bill`, {
        bill_type: bill.bill_type,
        provider: bill.provider,
        customer_id: bill.customer_id,
        amount: bill.amount || bill.fixed_amount
      });

      if (response.data.success) {
        toast.success('Bill paid successfully');
        fetchRecentPayments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleBill = (bill) => {
    setSelectedBill(bill);
    setShowScheduleModal(true);
  };

  const handleDeleteBill = async (billId) => {
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/transactions/bills/recurring/${billId}`);
      
      if (response.data.success) {
        toast.success('Bill removed');
        fetchBills();
      }
    } catch (error) {
      toast.error('Failed to remove bill');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bill-payments-container"
    >
      <div className="bill-payments-header">
        <h1>Bill Payments</h1>
        <p className="subtitle">Pay your bills instantly with SabAI Pay</p>
      </div>

      {/* Bill Categories */}
      <div className="bill-categories">
        {billCategories.map((category) => (
          <motion.button
            key={category.id}
            className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="category-icon" style={{ backgroundColor: `${category.color}20` }}>
              <category.icon style={{ color: category.color }} />
            </div>
            <span className="category-name">{category.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Quick Bill Pay */}
      <div className="quick-bill-pay">
        <h2>Quick Bill Pay</h2>
        <div className="bill-form">
          <select
            className="bill-select"
            value={formData.provider}
            onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
          >
            <option value="">Select Provider</option>
            {billCategories.find(c => c.id === selectedCategory)?.providers.map(provider => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>

          <Input
            type="text"
            name="customer_id"
            value={formData.customer_id}
            onChange={handleChange}
            placeholder="Customer ID / Account Number"
            error={errors.customer_id}
          />

          <Input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Amount (₹)"
            icon={FaRupeeSign}
            error={errors.amount}
          />

          <Button
            variant="primary"
            onClick={() => handlePayBill(formData)}
            loading={loading}
            fullWidth
          >
            Pay Bill
          </Button>
        </div>
      </div>

      {/* Saved Bills */}
      <div className="saved-bills-section">
        <div className="section-header">
          <h2>Saved Bills</h2>
          <button className="add-bill-btn" onClick={() => setShowAddBill(true)}>
            <FaPlus /> Add Bill
          </button>
        </div>

        {bills.length > 0 ? (
          <div className="saved-bills-list">
            {bills.map((bill) => (
              <motion.div
                key={bill.id}
                className="saved-bill-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="bill-info">
                  <div className="bill-icon">
                    {bill.bill_type === 'electricity' && <FaBolt style={{ color: '#fbbf24' }} />}
                    {bill.bill_type === 'water' && <FaTint style={{ color: '#3b82f6' }} />}
                    {bill.bill_type === 'mobile' && <FaMobile style={{ color: '#10b981' }} />}
                    {bill.bill_type === 'broadband' && <FaWifi style={{ color: '#8b5cf6' }} />}
                    {bill.bill_type === 'gas' && <FaFire style={{ color: '#ef4444' }} />}
                    {bill.bill_type === 'credit_card' && <FaCreditCard style={{ color: '#ec4899' }} />}
                  </div>
                  <div className="bill-details">
                    <h4>{bill.provider}</h4>
                    <p className="customer-id">{bill.customer_id}</p>
                    <div className="bill-meta">
                      <span className="due-date">
                        <FaCalendarAlt /> Due: {bill.due_date ? `Every ${bill.due_date}th` : 'Not set'}
                      </span>
                      {bill.fixed_amount && (
                        <span className="fixed-amount">₹{bill.fixed_amount}/month</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bill-actions">
                  {bill.auto_pay ? (
                    <span className="auto-pay-badge">
                      <FaBell /> Auto-pay
                    </span>
                  ) : (
                    <button
                      className="schedule-btn"
                      onClick={() => handleScheduleBill(bill)}
                    >
                      <FaCalendarAlt />
                    </button>
                  )}
                  <button
                    className="pay-now-btn"
                    onClick={() => handlePayBill(bill)}
                  >
                    Pay Now
                  </button>
                  <button
                    className="delete-bill-btn"
                    onClick={() => handleDeleteBill(bill.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="no-bills">
            <p>No saved bills yet</p>
            <button className="add-first-bill" onClick={() => setShowAddBill(true)}>
              Add your first bill
            </button>
          </div>
        )}
      </div>

      {/* Recent Bill Payments */}
      <div className="recent-bill-payments">
        <h2>Recent Payments</h2>
        {recentPayments.length > 0 ? (
          <div className="recent-payments-list">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="recent-payment-item">
                <div className="payment-info">
                  <span className="payment-provider">{payment.merchant || payment.description}</span>
                  <span className="payment-date">{formatDate(payment.created_at)}</span>
                </div>
                <span className="payment-amount">₹{payment.amount}</span>
                <span className={`payment-status ${payment.status}`}>
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-payments">No recent bill payments</p>
        )}
      </div>

      {/* Add Bill Modal */}
      <Modal
        isOpen={showAddBill}
        onClose={() => setShowAddBill(false)}
        title="Add Recurring Bill"
        size="medium"
      >
        <div className="add-bill-modal">
          <div className="modal-form">
            <div className="form-group">
              <label>Bill Type</label>
              <select
                name="bill_type"
                value={formData.bill_type}
                onChange={handleChange}
                className="bill-type-select"
              >
                {billCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Provider</label>
              <select
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                className="provider-select"
              >
                <option value="">Select Provider</option>
                {billCategories.find(c => c.id === formData.bill_type)?.providers.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
              {errors.provider && <span className="error-text">{errors.provider}</span>}
            </div>

            <Input
              label="Customer ID / Account Number"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              placeholder="Enter your customer ID"
              error={errors.customer_id}
              required
            />

            <Input
              label="Fixed Amount (Optional)"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter fixed amount if applicable"
              icon={FaRupeeSign}
              error={errors.amount}
            />

            <div className="form-group">
              <label>Due Date (Day of month)</label>
              <select
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="due-date-select"
              >
                <option value="">Select due date</option>
                {[...Array(31)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="auto_pay"
                  checked={formData.auto_pay}
                  onChange={handleChange}
                />
                <span>Enable Auto-pay</span>
              </label>
            </div>

            {formData.auto_pay && (
              <Input
                label="Maximum Auto-pay Amount"
                name="max_amount"
                type="number"
                value={formData.max_amount}
                onChange={handleChange}
                placeholder="Maximum amount for auto-pay"
                icon={FaRupeeSign}
                error={errors.max_amount}
              />
            )}
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowAddBill(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddBill} loading={loading}>
              Add Bill
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Payment"
        size="small"
      >
        <div className="schedule-modal">
          <p>Set up automatic payment for {selectedBill?.provider}</p>
          
          <div className="schedule-options">
            <button className="schedule-option active">
              <span className="option-day">15</span>
              <span className="option-label">Every month</span>
            </button>
            <button className="schedule-option">
              <span className="option-day">📅</span>
              <span className="option-label">Custom</span>
            </button>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Save Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default BillPayments;