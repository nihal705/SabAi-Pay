import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaShoppingBag,
  FaUtensils,
  FaCoffee,
  FaFilm,
  FaGasPump,
  FaPlane,
  FaMedkit,
  FaGraduationCap,
  FaPaw,
  FaGift,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaRupeeSign,
  FaCalendarAlt,
  FaBell,
  FaRobot,
  FaSave
} from 'react-icons/fa';
import { MdFastfood, MdLocalGroceryStore } from 'react-icons/md';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal, { ConfirmModal } from '../common/Modal';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ReserveStyles.css';

const SetLimits = ({ onLimitChange }) => {
  const [loading, setLoading] = useState(false);
  const [limits, setLimits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState(null);
  const [formData, setFormData] = useState({
    merchant: '',
    merchant_category: '',
    monthly_limit: '',
    per_transaction_limit: '',
    requires_approval: false,
    is_active: true
  });
  const [errors, setErrors] = useState({});

  const merchantCategories = {
    food: { name: 'Food & Restaurants', icon: FaUtensils, color: '#f59e0b' },
    shopping: { name: 'Shopping', icon: FaShoppingBag, color: '#8b5cf6' },
    groceries: { name: 'Groceries', icon: MdLocalGroceryStore, color: '#10b981' },
    entertainment: { name: 'Entertainment', icon: FaFilm, color: '#ec4899' },
    travel: { name: 'Travel', icon: FaPlane, color: '#3b82f6' },
    fuel: { name: 'Fuel', icon: FaGasPump, color: '#ef4444' },
    healthcare: { name: 'Healthcare', icon: FaMedkit, color: '#14b8a6' },
    education: { name: 'Education', icon: FaGraduationCap, color: '#f97316' },
    pets: { name: 'Pets', icon: FaPaw, color: '#a855f7' },
    gifts: { name: 'Gifts & Donations', icon: FaGift, color: '#d946ef' },
    others: { name: 'Others', icon: FaShoppingBag, color: '#6b7280' }
  };

  const merchants = [
    // Food
    { id: 'swiggy', name: 'Swiggy', category: 'food', icon: FaUtensils },
    { id: 'zomato', name: 'Zomato', category: 'food', icon: FaUtensils },
    { id: 'uber-eats', name: 'Uber Eats', category: 'food', icon: FaUtensils },
    { id: 'dominos', name: 'Dominos', category: 'food', icon: FaUtensils },
    { id: 'pizza-hut', name: 'Pizza Hut', category: 'food', icon: FaUtensils },
    { id: 'mcdonalds', name: "McDonald's", category: 'food', icon: FaUtensils },
    { id: 'kfc', name: 'KFC', category: 'food', icon: FaUtensils },
    { id: 'starbucks', name: 'Starbucks', category: 'food', icon: FaCoffee },
    
    // Shopping
    { id: 'amazon', name: 'Amazon', category: 'shopping', icon: FaShoppingBag },
    { id: 'flipkart', name: 'Flipkart', category: 'shopping', icon: FaShoppingBag },
    { id: 'myntra', name: 'Myntra', category: 'shopping', icon: FaShoppingBag },
    { id: 'ajio', name: 'Ajio', category: 'shopping', icon: FaShoppingBag },
    { id: 'meesho', name: 'Meesho', category: 'shopping', icon: FaShoppingBag },
    { id: 'nykaa', name: 'Nykaa', category: 'shopping', icon: FaShoppingBag },
    
    // Groceries
    { id: 'zepto', name: 'Zepto', category: 'groceries', icon: MdLocalGroceryStore },
    { id: 'bigbasket', name: 'BigBasket', category: 'groceries', icon: MdLocalGroceryStore },
    { id: 'blinkit', name: 'Blinkit', category: 'groceries', icon: MdLocalGroceryStore },
    { id: 'grofers', name: 'Grofers', category: 'groceries', icon: MdLocalGroceryStore },
    { id: 'dunzo', name: 'Dunzo', category: 'groceries', icon: MdLocalGroceryStore },
    
    // Entertainment
    { id: 'netflix', name: 'Netflix', category: 'entertainment', icon: FaFilm },
    { id: 'prime-video', name: 'Prime Video', category: 'entertainment', icon: FaFilm },
    { id: 'hotstar', name: 'Hotstar', category: 'entertainment', icon: FaFilm },
    { id: 'sony-liv', name: 'Sony LIV', category: 'entertainment', icon: FaFilm },
    { id: 'zee5', name: 'ZEE5', category: 'entertainment', icon: FaFilm },
    { id: 'spotify', name: 'Spotify', category: 'entertainment', icon: FaFilm },
    { id: 'gaana', name: 'Gaana', category: 'entertainment', icon: FaFilm },
    { id: 'bookmyshow', name: 'BookMyShow', category: 'entertainment', icon: FaFilm },
    
    // Travel
    { id: 'uber', name: 'Uber', category: 'travel', icon: FaPlane },
    { id: 'ola', name: 'Ola', category: 'travel', icon: FaPlane },
    { id: 'makemytrip', name: 'MakeMyTrip', category: 'travel', icon: FaPlane },
    { id: 'goibibo', name: 'GoIbibo', category: 'travel', icon: FaPlane },
    { id: 'irctc', name: 'IRCTC', category: 'travel', icon: FaPlane },
    { id: 'redbus', name: 'RedBus', category: 'travel', icon: FaPlane },
    
    // Fuel
    { id: 'indian-oil', name: 'Indian Oil', category: 'fuel', icon: FaGasPump },
    { id: 'bharat-petroleum', name: 'Bharat Petroleum', category: 'fuel', icon: FaGasPump },
    { id: 'hp', name: 'Hindustan Petroleum', category: 'fuel', icon: FaGasPump },
    { id: 'shell', name: 'Shell', category: 'fuel', icon: FaGasPump },
    
    // Healthcare
    { id: 'practo', name: 'Practo', category: 'healthcare', icon: FaMedkit },
    { id: 'pharmeasy', name: 'PharmEasy', category: 'healthcare', icon: FaMedkit },
    { id: 'netmeds', name: 'NetMeds', category: 'healthcare', icon: FaMedkit },
    { id: '1mg', name: '1mg', category: 'healthcare', icon: FaMedkit },
    { id: 'apollo', name: 'Apollo Pharmacy', category: 'healthcare', icon: FaMedkit }
  ];

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/reserve/limits`);
      if (response.data.success) {
        setLimits(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching limits:', error);
      toast.error('Failed to load limits');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.merchant) {
      newErrors.merchant = 'Please select a merchant';
    }

    if (!formData.monthly_limit) {
      newErrors.monthly_limit = 'Monthly limit is required';
    } else if (isNaN(formData.monthly_limit) || formData.monthly_limit < 100) {
      newErrors.monthly_limit = 'Monthly limit must be at least ₹100';
    } else if (formData.monthly_limit > 100000) {
      newErrors.monthly_limit = 'Monthly limit cannot exceed ₹1,00,000';
    }

    if (formData.per_transaction_limit) {
      if (isNaN(formData.per_transaction_limit) || formData.per_transaction_limit < 1) {
        newErrors.per_transaction_limit = 'Per transaction limit must be at least ₹1';
      } else if (formData.per_transaction_limit > formData.monthly_limit) {
        newErrors.per_transaction_limit = 'Per transaction limit cannot exceed monthly limit';
      }
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

  const handleMerchantSelect = (merchant) => {
    const category = merchant.category;
    setFormData(prev => ({
      ...prev,
      merchant: merchant.id,
      merchant_category: category,
      merchant_name: merchant.name,
      merchant_icon: merchant.icon
    }));
  };

  const handleAddLimit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/reserve/limits`, formData);

      if (response.data.success) {
        toast.success('Limit added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchLimits();
        onLimitChange?.();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add limit');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimit = async () => {
    if (!validateForm() || !selectedLimit) return;

    setLoading(true);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/reserve/limits/${selectedLimit.merchant}`,
        formData
      );

      if (response.data.success) {
        toast.success('Limit updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchLimits();
        onLimitChange?.();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update limit');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLimit = async () => {
    if (!selectedLimit) return;

    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/reserve/limits/${selectedLimit.merchant}`
      );

      if (response.data.success) {
        toast.success('Limit deleted successfully');
        setShowDeleteConfirm(false);
        setSelectedLimit(null);
        fetchLimits();
        onLimitChange?.();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete limit');
    }
  };

  const handleEdit = (limit) => {
    setSelectedLimit(limit);
    setFormData({
      merchant: limit.merchant,
      merchant_category: limit.merchant_category,
      monthly_limit: limit.monthly_limit,
      per_transaction_limit: limit.per_transaction_limit || '',
      requires_approval: limit.requires_approval || false,
      is_active: limit.is_active
    });
    setShowEditModal(true);
  };

  const handleToggleActive = async (limit) => {
    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_API_URL}/reserve/limits/${limit.merchant}/toggle`
      );

      if (response.data.success) {
        toast.success(`Limit ${limit.is_active ? 'deactivated' : 'activated'}`);
        fetchLimits();
      }
    } catch (error) {
      toast.error('Failed to toggle limit');
    }
  };

  const resetForm = () => {
    setFormData({
      merchant: '',
      merchant_category: '',
      monthly_limit: '',
      per_transaction_limit: '',
      requires_approval: false,
      is_active: true
    });
    setSelectedLimit(null);
    setErrors({});
  };

  const getCategoryIcon = (category) => {
    const cat = merchantCategories[category] || merchantCategories.others;
    return cat.icon;
  };

  const getCategoryColor = (category) => {
    const cat = merchantCategories[category] || merchantCategories.others;
    return cat.color;
  };

  // Group merchants by category for the modal
  const groupedMerchants = merchants.reduce((acc, merchant) => {
    const category = merchant.category;
    if (!acc[category]) {
      acc[category] = {
        name: merchantCategories[category]?.name || 'Others',
        icon: merchantCategories[category]?.icon || FaShoppingBag,
        merchants: []
      };
    }
    acc[category].merchants.push(merchant);
    return acc;
  }, {});

  return (
    <div className="set-limits-container">
      {/* Header */}
      <div className="limits-header">
        <div className="header-title">
          <h2>Reserve Pay Limits</h2>
          <p className="subtitle">Set monthly spending limits for your favorite merchants</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          icon={FaPlus}
        >
          Add New Limit
        </Button>
      </div>

      {/* Info Card */}
      <div className="limits-info-card">
        <FaRobot className="info-icon" />
        <div className="info-content">
          <h3>How Reserve Pay Works</h3>
          <p>
            Set monthly limits for merchants. SabAI can auto-pay within these limits without asking for PIN.
            For transactions above limits or requiring approval, you'll get a notification to approve.
          </p>
        </div>
      </div>

      {/* Limits Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your limits...</p>
        </div>
      ) : limits.length > 0 ? (
        <div className="limits-grid">
          {limits.map((limit, index) => (
            <motion.div
              key={limit.id}
              className={`limit-card ${!limit.is_active ? 'inactive' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="limit-card-header">
                <div
                  className="merchant-icon"
                  style={{ backgroundColor: getCategoryColor(limit.merchant_category) }}
                >
                  {React.createElement(getCategoryIcon(limit.merchant_category), { size: 24 })}
                </div>
                <div className="merchant-info">
                  <h3 className="merchant-name">{limit.merchant}</h3>
                  <span className="merchant-category">
                    {merchantCategories[limit.merchant_category]?.name || 'Others'}
                  </span>
                </div>
                <div className="limit-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => handleEdit(limit)}
                    title="Edit limit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className={`action-btn toggle ${limit.is_active ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleActive(limit)}
                    title={limit.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <FaCheckCircle />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => {
                      setSelectedLimit(limit);
                      setShowDeleteConfirm(true);
                    }}
                    title="Delete limit"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="limit-card-body">
                <div className="limit-amount">
                  <span className="limit-label">Monthly Limit</span>
                  <span className="limit-value">₹{limit.monthly_limit?.toLocaleString()}</span>
                </div>

                {limit.per_transaction_limit && (
                  <div className="per-txn-limit">
                    <span className="limit-label">Per Transaction</span>
                    <span className="limit-subvalue">₹{limit.per_transaction_limit?.toLocaleString()}</span>
                  </div>
                )}

                <div className="spent-progress">
                  <div className="progress-header">
                    <span>Spent this month</span>
                    <span className="spent-amount">
                      ₹{limit.current_spent?.toLocaleString()} / ₹{limit.monthly_limit?.toLocaleString()}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${(limit.current_spent / limit.monthly_limit) > 0.8 ? 'warning' : ''}`}
                      style={{ width: `${Math.min((limit.current_spent / limit.monthly_limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="limit-footer">
                  {limit.requires_approval ? (
                    <span className="approval-badge">
                      <FaBell /> Requires Approval
                    </span>
                  ) : (
                    <span className="auto-badge">
                      <FaCheckCircle /> Auto-Pay Enabled
                    </span>
                  )}
                  
                  <span className="remaining">
                    ₹{(limit.monthly_limit - limit.current_spent)?.toLocaleString()} left
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="no-limits">
          <FaShoppingBag className="no-limits-icon" />
          <h3>No Limits Set</h3>
          <p>Start by adding a limit for your favorite merchant</p>
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            icon={FaPlus}
          >
            Add Your First Limit
          </Button>
        </div>
      )}

      {/* Add/Edit Limit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={showEditModal ? 'Edit Limit' : 'Add New Limit'}
        size="large"
      >
        <div className="limit-modal">
          {/* Merchant Selection */}
          {!showEditModal && !formData.merchant && (
            <div className="merchant-selection">
              <h3>Select Merchant</h3>
              <div className="merchant-categories">
                {Object.entries(groupedMerchants).map(([category, group]) => (
                  <div key={category} className="category-group">
                    <h4 className="category-title">
                      {React.createElement(group.icon, { size: 16 })} {group.name}
                    </h4>
                    <div className="merchant-grid">
                      {group.merchants.map((merchant) => (
                        <button
                          key={merchant.id}
                          className="merchant-option"
                          onClick={() => handleMerchantSelect(merchant)}
                        >
                          {React.createElement(merchant.icon || group.icon, { size: 20 })}
                          <span>{merchant.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limit Form */}
          {formData.merchant && (
            <div className="limit-form">
              <div className="selected-merchant">
                <div
                  className="merchant-icon-large"
                  style={{ backgroundColor: getCategoryColor(formData.merchant_category) }}
                >
                  {React.createElement(
                    merchants.find(m => m.id === formData.merchant)?.icon || FaShoppingBag,
                    { size: 32 }
                  )}
                </div>
                <div className="selected-merchant-info">
                  <h3>{merchants.find(m => m.id === formData.merchant)?.name}</h3>
                  <p className="merchant-category">
                    {merchantCategories[formData.merchant_category]?.name}
                  </p>
                </div>
                {!showEditModal && (
                  <button
                    className="change-merchant-btn"
                    onClick={() => setFormData(prev => ({ ...prev, merchant: '' }))}
                  >
                    Change
                  </button>
                )}
              </div>

              <div className="form-fields">
                <Input
                  label="Monthly Limit (₹)"
                  type="number"
                  name="monthly_limit"
                  value={formData.monthly_limit}
                  onChange={handleChange}
                  placeholder="e.g., 5000"
                  icon={FaRupeeSign}
                  error={errors.monthly_limit}
                  required
                  min="100"
                  max="100000"
                />

                <Input
                  label="Per Transaction Limit (Optional)"
                  type="number"
                  name="per_transaction_limit"
                  value={formData.per_transaction_limit}
                  onChange={handleChange}
                  placeholder="e.g., 1000"
                  icon={FaRupeeSign}
                  error={errors.per_transaction_limit}
                  min="1"
                />

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="requires_approval"
                      checked={formData.requires_approval}
                      onChange={handleChange}
                    />
                    <span>Require my approval for each transaction</span>
                  </label>
                  <p className="checkbox-hint">
                    When enabled, you'll need to approve each payment even within limits
                  </p>
                </div>

                <div className="limit-summary">
                  <h4>Summary</h4>
                  <div className="summary-row">
                    <span>Monthly spending limit</span>
                    <strong>₹{formData.monthly_limit || 0}</strong>
                  </div>
                  {formData.per_transaction_limit && (
                    <div className="summary-row">
                      <span>Max per transaction</span>
                      <strong>₹{formData.per_transaction_limit}</strong>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>Approval required</span>
                    <strong>{formData.requires_approval ? 'Yes' : 'No'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={showEditModal ? handleUpdateLimit : handleAddLimit}
              loading={loading}
              disabled={!formData.merchant || !formData.monthly_limit}
              icon={FaSave}
            >
              {showEditModal ? 'Update Limit' : 'Save Limit'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedLimit(null);
        }}
        onConfirm={handleDeleteLimit}
        title="Delete Limit"
        message={`Are you sure you want to delete the limit for ${selectedLimit?.merchant}?`}
        type="danger"
        confirmText="Delete"
      />
    </div>
  );
};

export default SetLimits;