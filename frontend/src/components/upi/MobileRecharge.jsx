import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FaMobile,
  FaRupeeSign,
  FaWifi,
  FaTv,
  FaHistory,
  FaStar,
  FaBolt,
  FaCheckCircle,
  FaExclamationCircle,
  FaSimCard
} from 'react-icons/fa';
import { MdNetworkCell, MdSpeed } from 'react-icons/md';
import Input from '../common/Input';
import Button from '../common/Button';
import axios from 'axios';
import toast from 'react-hot-toast';
import './UPIStyles.css';

const MobileRecharge = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [operator, setOperator] = useState('airtel');
  const [circle, setCircle] = useState('delhi');
  const [mobileNumber, setMobileNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [plans, setPlans] = useState([]);
  const [recentRecharges, setRecentRecharges] = useState([]);
  const [errors, setErrors] = useState({});

  const operators = [
    { id: 'airtel', name: 'Airtel', icon: '🟥', color: '#e31b23' },
    { id: 'jio', name: 'Jio', icon: '🔷', color: '#0f3cc9' },
    { id: 'vi', name: 'Vi', icon: '🟪', color: '#9b1fe0' },
    { id: 'bsnl', name: 'BSNL', icon: '🟩', color: '#1e7b4b' }
  ];

  const circles = [
    'Delhi/NCR', 'Mumbai', 'Kolkata', 'Chennai', 'Bangalore', 
    'Hyderabad', 'Pune', 'Ahmedabad', 'Lucknow', 'Chandigarh'
  ];

  useEffect(() => {
    fetchRecentRecharges();
    fetchPlans();
  }, [operator, circle]);

  const fetchRecentRecharges = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/transactions?type=recharge&limit=5`);
      if (response.data.success) {
        setRecentRecharges(response.data.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching recent recharges:', error);
    }
  };

  const fetchPlans = async () => {
    // Mock plans data
    const mockPlans = [
      { id: 1, amount: 299, data: '2GB/day', validity: '28 days', calls: 'Unlimited', sms: 100 },
      { id: 2, amount: 399, data: '3GB/day', validity: '28 days', calls: 'Unlimited', sms: 100 },
      { id: 3, amount: 499, data: '2GB/day', validity: '56 days', calls: 'Unlimited', sms: 100 },
      { id: 4, amount: 599, data: '3GB/day', validity: '56 days', calls: 'Unlimited', sms: 100 },
      { id: 5, amount: 799, data: '2GB/day', validity: '84 days', calls: 'Unlimited', sms: 100 },
      { id: 6, amount: 999, data: '3GB/day', validity: '84 days', calls: 'Unlimited', sms: 100 },
      { id: 7, amount: 1499, data: '2GB/day', validity: '180 days', calls: 'Unlimited', sms: 100 },
      { id: 8, amount: 1999, data: '3GB/day', validity: '365 days', calls: 'Unlimited', sms: 100 }
    ];
    setPlans(mockPlans);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!mobileNumber) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      newErrors.mobileNumber = 'Enter a valid 10-digit mobile number';
    }

    if (!amount && !selectedPlan) {
      newErrors.amount = 'Amount or plan is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRecharge = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/upi/recharge`, {
        mobile_number: mobileNumber,
        operator,
        circle,
        amount: parseFloat(amount) || selectedPlan?.amount
      });

      if (response.data.success) {
        toast.success('Recharge successful!');
        fetchRecentRecharges();
        setMobileNumber('');
        setAmount('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Recharge failed');
    } finally {
      setLoading(false);
    }
  };

  const [selectedPlan, setSelectedPlan] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mobile-recharge-container"
    >
      <div className="mobile-recharge-card">
        <div className="recharge-header">
          <h1>Mobile Recharge</h1>
          <p className="subtitle">Recharge any prepaid mobile number instantly</p>
        </div>

        {/* Operator Selection */}
        <div className="operator-selection">
          <h3>Select Operator</h3>
          <div className="operator-grid">
            {operators.map((op) => (
              <button
                key={op.id}
                className={`operator-btn ${operator === op.id ? 'active' : ''}`}
                onClick={() => setOperator(op.id)}
                style={{ borderColor: operator === op.id ? op.color : 'transparent' }}
              >
                <span className="operator-icon">{op.icon}</span>
                <span className="operator-name">{op.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Circle Selection */}
        <div className="circle-selection">
          <h3>Select Circle</h3>
          <select
            value={circle}
            onChange={(e) => setCircle(e.target.value)}
            className="circle-select"
          >
            {circles.map((c) => (
              <option key={c} value={c.toLowerCase()}>{c}</option>
            ))}
          </select>
        </div>

        {/* Mobile Number Input */}
        <div className="mobile-input-section">
          <Input
            label="Mobile Number"
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="Enter 10-digit mobile number"
            icon={FaMobile}
            error={errors.mobileNumber}
            maxLength={10}
            required
          />
        </div>

        {/* Quick Recharge Amounts */}
        <div className="quick-amounts">
          <h3>Quick Recharge</h3>
          <div className="amount-grid">
            {[10, 20, 50, 100, 200, 500].map((amt) => (
              <button
                key={amt}
                className={`amount-btn ${amount == amt ? 'selected' : ''}`}
                onClick={() => {
                  setAmount(amt);
                  setSelectedPlan(null);
                }}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="custom-amount">
          <Input
            label="Custom Amount"
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setSelectedPlan(null);
            }}
            placeholder="Enter amount"
            icon={FaRupeeSign}
            error={errors.amount}
            min="10"
            max="10000"
          />
        </div>

        {/* Recharge Button */}
        <Button
          variant="primary"
          onClick={handleRecharge}
          loading={loading}
          fullWidth
          size="large"
        >
          Proceed to Recharge
        </Button>

        {/* Popular Plans */}
        <div className="popular-plans">
          <h3>Popular Plans</h3>
          <div className="plans-grid">
            {plans.slice(0, 4).map((plan) => (
              <motion.button
                key={plan.id}
                className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedPlan(plan);
                  setAmount(plan.amount);
                }}
                whileHover={{ y: -2 }}
              >
                <div className="plan-amount">₹{plan.amount}</div>
                <div className="plan-details">
                  <span className="plan-data">{plan.data}</span>
                  <span className="plan-validity">{plan.validity}</span>
                </div>
                <div className="plan-features">
                  <span className="feature">📞 {plan.calls}</span>
                  <span className="feature">💬 {plan.sms} SMS/day</span>
                </div>
              </motion.button>
            ))}
          </div>
          <button className="view-all-plans" onClick={() => {}}>
            View All Plans
          </button>
        </div>

        {/* Recent Recharges */}
        {recentRecharges.length > 0 && (
          <div className="recent-recharges">
            <h3>Recent Recharges</h3>
            <div className="recent-list">
              {recentRecharges.map((recharge) => (
                <div key={recharge.id} className="recent-item">
                  <div className="recent-info">
                    <FaMobile className="recent-icon" />
                    <div>
                      <div className="recent-number">{recharge.description || 'Mobile Recharge'}</div>
                      <div className="recent-date">
                        {new Date(recharge.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="recent-amount">₹{recharge.amount}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MobileRecharge;