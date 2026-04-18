import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaCoins,
  FaBolt,
  FaMobile,
  FaShoppingBag,
  FaUtensils,
  FaWallet,
  FaCheckCircle,
  FaArrowRight,
  FaInfoCircle,
  FaPercent,
  FaGift,
  FaStar
} from 'react-icons/fa';
import { MdReceipt } from 'react-icons/md';
import Button from '../common/Button';
import Input from '../common/Input';
import axios from 'axios';
import toast from 'react-hot-toast';
import './CoinStyles.css';

const RedeemCoins = ({ coinBalance, onRedeem }) => {
  const [step, setStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [redeemHistory, setRedeemHistory] = useState([]);
  const [targetDetails, setTargetDetails] = useState({
    upiId: '',
    mobileNumber: '',
    billType: 'electricity',
    provider: '',
    customerId: ''
  });

  useEffect(() => {
    fetchRedeemHistory();
  }, []);

  const fetchRedeemHistory = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/coins/redemptions?limit=5`);
      if (response.data.success) {
        setRedeemHistory(response.data.data.history);
      }
    } catch (error) {
      console.error('Error fetching redeem history:', error);
    }
  };

  const redeemOptions = [
    {
      id: 'bill',
      title: 'Bill Payment',
      description: 'Pay electricity, water, gas bills',
      icon: FaBolt,
      color: '#ef4444',
      minCoins: 100,
      fields: ['billType', 'provider', 'customerId']
    },
    {
      id: 'recharge',
      title: 'Mobile Recharge',
      description: 'Recharge any prepaid mobile',
      icon: FaMobile,
      color: '#8b5cf6',
      minCoins: 100,
      fields: ['mobileNumber', 'operator']
    },
    {
      id: 'shopping',
      title: 'Shopping Voucher',
      description: 'Get discount on shopping',
      icon: FaShoppingBag,
      color: '#10b981',
      minCoins: 200,
      fields: ['voucherCode']
    },
    {
      id: 'food',
      title: 'Food Delivery',
      description: 'Use coins for food orders',
      icon: FaUtensils,
      color: '#fbbf24',
      minCoins: 150,
      fields: ['restaurant']
    },
    {
      id: 'bank',
      title: 'Bank Transfer',
      description: 'Transfer to bank account',
      icon: FaWallet,
      color: '#667eea',
      minCoins: 500,
      fields: ['upiId']
    }
  ];

  const billTypes = [
    { value: 'electricity', label: 'Electricity' },
    { value: 'water', label: 'Water' },
    { value: 'gas', label: 'Gas' },
    { value: 'broadband', label: 'Broadband' }
  ];

  const operators = {
    mobile: ['Airtel', 'Jio', 'Vi', 'BSNL'],
    electricity: ['Tata Power', 'Adani', 'BSES', 'Torrent'],
    broadband: ['JioFiber', 'Airtel Xstream', 'ACT']
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setStep(2);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value <= coinBalance) {
      setAmount(value);
    }
  };

  const validateStep2 = () => {
    if (!amount || amount < selectedOption.minCoins) {
      toast.error(`Minimum ${selectedOption.minCoins} coins required`);
      return false;
    }

    if (selectedOption.id === 'recharge') {
      if (!targetDetails.mobileNumber || !/^[6-9]\d{9}$/.test(targetDetails.mobileNumber)) {
        toast.error('Enter valid mobile number');
        return false;
      }
    }

    if (selectedOption.id === 'bill') {
      if (!targetDetails.customerId) {
        toast.error('Enter customer ID');
        return false;
      }
    }

    if (selectedOption.id === 'bank' && !targetDetails.upiId) {
      toast.error('Enter UPI ID');
      return false;
    }

    return true;
  };

  const handleRedeem = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/coins/redeem`, {
        amount: parseInt(amount),
        redemption_type: selectedOption.id,
        ...targetDetails
      });

      if (response.data.success) {
        toast.success(`₹${response.data.data.rupee_value} redeemed successfully!`);
        setStep(3);
        onRedeem?.();
        fetchRedeemHistory();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Redemption failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setStep(1);
    setSelectedOption(null);
    setAmount('');
    setTargetDetails({
      upiId: '',
      mobileNumber: '',
      billType: 'electricity',
      provider: '',
      customerId: ''
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="redeem-coins-container">
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="redeem-step1"
        >
          <div className="step-header">
            <h2>Redeem Your Coins</h2>
            <p className="balance-info">
              Available: <strong>{coinBalance} coins</strong> (₹{(coinBalance / 100).toFixed(2)})
            </p>
          </div>

          <div className="redeem-options-grid">
            {redeemOptions.map((option) => (
              <motion.button
                key={option.id}
                className="redeem-option-card"
                style={{ borderColor: option.color }}
                onClick={() => handleOptionSelect(option)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                disabled={coinBalance < option.minCoins}
              >
                <div className="option-icon" style={{ backgroundColor: option.color }}>
                  <option.icon />
                </div>
                <div className="option-details">
                  <h4>{option.title}</h4>
                  <p>{option.description}</p>
                  <span className="min-coins">Min. {option.minCoins} coins</span>
                </div>
                <FaArrowRight className="option-arrow" />
              </motion.button>
            ))}
          </div>

          {/* Recent Redemptions */}
          {redeemHistory.length > 0 && (
            <div className="recent-redemptions">
              <h3>Recent Redemptions</h3>
              <div className="redemption-list">
                {redeemHistory.map((item, index) => (
                  <div key={index} className="redemption-item">
                    <div className="redemption-icon">
                      {item.redemption_type === 'bill' && <FaBolt />}
                      {item.redemption_type === 'recharge' && <FaMobile />}
                      {item.redemption_type === 'shopping' && <FaShoppingBag />}
                      {item.redemption_type === 'food' && <FaUtensils />}
                      {item.redemption_type === 'bank' && <FaWallet />}
                    </div>
                    <div className="redemption-details">
                      <span className="redemption-type">
                        {item.redemption_type} • ₹{item.rupee_value}
                      </span>
                      <span className="redemption-date">
                        {formatDate(item.redeemed_at)}
                      </span>
                    </div>
                    <span className="redemption-coins">{item.coin_amount} coins</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {step === 2 && selectedOption && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="redeem-step2"
        >
          <button className="back-btn" onClick={() => setStep(1)}>
            ← Back
          </button>

          <div className="step2-header">
            <div className="selected-option">
              <div className="option-icon" style={{ backgroundColor: selectedOption.color }}>
                <selectedOption.icon />
              </div>
              <div>
                <h2>{selectedOption.title}</h2>
                <p className="min-info">Minimum {selectedOption.minCoins} coins</p>
              </div>
            </div>

            <div className="coin-balance-info">
              <FaCoins />
              <span>Available: {coinBalance} coins</span>
            </div>
          </div>

          <div className="redemption-form">
            <Input
              label="Coins to Redeem"
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder={`Enter amount (min ${selectedOption.minCoins})`}
              icon={FaCoins}
              min={selectedOption.minCoins}
              max={coinBalance}
            />

            {amount && (
              <div className="value-preview">
                <span>You will get:</span>
                <span className="preview-amount">
                  ₹{(parseInt(amount) / 100).toFixed(2)}
                </span>
              </div>
            )}

            {selectedOption.id === 'bill' && (
              <>
                <div className="form-group">
                  <label>Bill Type</label>
                  <select
                    value={targetDetails.billType}
                    onChange={(e) => setTargetDetails(prev => ({
                      ...prev,
                      billType: e.target.value
                    }))}
                    className="form-select"
                  >
                    {billTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Provider</label>
                  <select
                    value={targetDetails.provider}
                    onChange={(e) => setTargetDetails(prev => ({
                      ...prev,
                      provider: e.target.value
                    }))}
                    className="form-select"
                  >
                    <option value="">Select Provider</option>
                    {operators[targetDetails.billType]?.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Customer ID / Account Number"
                  value={targetDetails.customerId}
                  onChange={(e) => setTargetDetails(prev => ({
                    ...prev,
                    customerId: e.target.value
                  }))}
                  placeholder="Enter customer ID"
                />
              </>
            )}

            {selectedOption.id === 'recharge' && (
              <>
                <Input
                  label="Mobile Number"
                  type="tel"
                  value={targetDetails.mobileNumber}
                  onChange={(e) => setTargetDetails(prev => ({
                    ...prev,
                    mobileNumber: e.target.value
                  }))}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                />

                <div className="form-group">
                  <label>Operator</label>
                  <select
                    value={targetDetails.provider}
                    onChange={(e) => setTargetDetails(prev => ({
                      ...prev,
                      provider: e.target.value
                    }))}
                    className="form-select"
                  >
                    <option value="">Select Operator</option>
                    {operators.mobile.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {selectedOption.id === 'bank' && (
              <Input
                label="UPI ID"
                value={targetDetails.upiId}
                onChange={(e) => setTargetDetails(prev => ({
                  ...prev,
                  upiId: e.target.value
                }))}
                placeholder="e.g., name@okhdfcbank"
              />
            )}

            {selectedOption.id === 'shopping' && (
              <div className="voucher-preview">
                <FaGift className="voucher-icon" />
                <div className="voucher-details">
                  <h4>Shopping Voucher</h4>
                  <p>Valid on Amazon, Flipkart, Myntra</p>
                </div>
              </div>
            )}

            {selectedOption.id === 'food' && (
              <div className="voucher-preview">
                <FaStar className="voucher-icon food" />
                <div className="voucher-details">
                  <h4>Food Discount</h4>
                  <p>Valid on Swiggy, Zomato, UberEats</p>
                </div>
              </div>
            )}
          </div>

          <div className="form-footer">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRedeem}
              loading={loading}
              disabled={!amount || amount < selectedOption.minCoins}
            >
              Redeem Now
            </Button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="redeem-step3"
        >
          <div className="success-content">
            <div className="success-icon">
              <FaCheckCircle />
            </div>
            
            <h2>Redemption Successful!</h2>
            
            <div className="success-details">
              <div className="detail-row">
                <span>Coins Redeemed:</span>
                <strong>{amount}</strong>
              </div>
              <div className="detail-row highlight">
                <span>Amount Credited:</span>
                <strong>₹{(parseInt(amount) / 100).toFixed(2)}</strong>
              </div>
              <div className="detail-row">
                <span>Redemption Type:</span>
                <strong className="type">{selectedOption?.title}</strong>
              </div>
            </div>

            <p className="success-message">
              The amount will be credited within a few minutes.
            </p>

            <div className="success-actions">
              <Button variant="primary" onClick={handleDone}>
                Done
              </Button>
              <Button variant="outline" onClick={() => {
                handleDone();
                // Navigate to history
              }}>
                View History
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RedeemCoins;