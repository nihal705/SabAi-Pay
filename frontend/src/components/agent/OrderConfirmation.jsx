import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaShoppingBag,
  FaUtensils,
  FaStore,
  FaRupeeSign,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaInfoCircle,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaArrowRight,
  FaCreditCard,
  FaWallet,
  FaCoins
} from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import './AgentStyles.css';

const OrderConfirmation = ({
  isOpen,
  onClose,
  orderDetails,
  onConfirm,
  onModify,
  onCancel,
  loading = false
}) => {
  const [step, setStep] = useState(1);
  const [modifiedOrder, setModifiedOrder] = useState(orderDetails);
  const [paymentMethod, setPaymentMethod] = useState('upi');

  if (!orderDetails) return null;

  const {
    item,
    merchant,
    amount,
    quantity = 1,
    options = [],
    category,
    estimatedDelivery,
    merchantRating,
    merchantImage
  } = orderDetails;

  const getCategoryIcon = () => {
    switch (category) {
      case 'food':
        return <FaUtensils className="category-icon food" />;
      case 'shopping':
        return <FaShoppingBag className="category-icon shopping" />;
      default:
        return <FaStore className="category-icon default" />;
    }
  };

  const getMerchantColor = (merchant) => {
    const colors = {
      swiggy: '#fc8019',
      zomato: '#e23744',
      amazon: '#ff9900',
      flipkart: '#2874f0',
      zepto: '#8400e5',
      bigbasket: '#4caf50',
      default: '#667eea'
    };
    return colors[merchant?.toLowerCase()] || colors.default;
  };

  const handleQuantityChange = (change) => {
    const newQuantity = Math.max(1, quantity + change);
    setModifiedOrder(prev => ({
      ...prev,
      quantity: newQuantity,
      amount: (orderDetails.unitPrice || amount) * newQuantity
    }));
  };

  const handleOptionSelect = (option) => {
    // Handle option selection (e.g., size, flavor)
    setModifiedOrder(prev => ({
      ...prev,
      selectedOption: option,
      amount: prev.amount + (option.price || 0)
    }));
  };

  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
  };

  const handleConfirm = () => {
    if (step === 1) {
      setStep(2);
    } else {
      onConfirm(modifiedOrder, paymentMethod);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onModify?.();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="order-confirmation-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="order-confirmation-modal"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="order-confirmation-header">
              <button className="back-btn" onClick={handleBack}>
                <FaArrowLeft />
              </button>
              <h2>
                {step === 1 ? 'Confirm Order' : 'Choose Payment Method'}
              </h2>
              <button className="close-btn" onClick={onClose}>
                <FaTimesCircle />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="order-progress">
              <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">Review Order</span>
              </div>
              <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
              <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">Payment</span>
              </div>
            </div>

            {step === 1 ? (
              /* Step 1: Order Review */
              <div className="order-review-step">
                {/* Merchant Info */}
                <div className="merchant-info-card">
                  <div className="merchant-image">
                    {merchantImage ? (
                      <img src={merchantImage} alt={merchant} />
                    ) : (
                      <div className="merchant-placeholder">
                        {getCategoryIcon()}
                      </div>
                    )}
                  </div>
                  <div className="merchant-details">
                    <h3 className="merchant-name" style={{ color: getMerchantColor(merchant) }}>
                      {merchant}
                    </h3>
                    <div className="merchant-rating">
                      {'⭐'.repeat(Math.floor(merchantRating || 4))}
                      <span>({merchantRating || 4.5})</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="order-items-card">
                  <h4>Order Items</h4>
                  
                  <div className="order-item-row">
                    <div className="item-info">
                      <span className="item-name">{item}</span>
                      {modifiedOrder.selectedOption && (
                        <span className="item-option">
                          {modifiedOrder.selectedOption}
                        </span>
                      )}
                    </div>
                    
                    <div className="item-quantity">
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="quantity">{quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(1)}
                      >
                        +
                      </button>
                    </div>
                    
                    <span className="item-price">
                      ₹{(orderDetails.unitPrice || amount) * quantity}
                    </span>
                  </div>

                  {/* Options */}
                  {options.length > 0 && (
                    <div className="item-options">
                      <p className="options-label">Select Options:</p>
                      <div className="options-grid">
                        {options.map((option, index) => (
                          <button
                            key={index}
                            className={`option-btn ${modifiedOrder.selectedOption === option.name ? 'selected' : ''}`}
                            onClick={() => handleOptionSelect(option)}
                          >
                            <span className="option-name">{option.name}</span>
                            {option.price > 0 && (
                              <span className="option-price">+₹{option.price}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="price-breakdown-card">
                  <h4>Price Details</h4>
                  
                  <div className="price-row">
                    <span>Item Total</span>
                    <span>₹{modifiedOrder.amount}</span>
                  </div>
                  
                  <div className="price-row">
                    <span>Delivery Fee</span>
                    <span className="free">FREE</span>
                  </div>
                  
                  <div className="price-row">
                    <span>Taxes & Charges</span>
                    <span>₹{Math.round(modifiedOrder.amount * 0.05)}</span>
                  </div>
                  
                  <div className="price-row total">
                    <span>Total Amount</span>
                    <span>₹{modifiedOrder.amount + Math.round(modifiedOrder.amount * 0.05)}</span>
                  </div>
                </div>

                {/* Delivery Estimate */}
                {estimatedDelivery && (
                  <div className="delivery-estimate">
                    <FaClock className="delivery-icon" />
                    <div className="delivery-info">
                      <span className="delivery-label">Estimated Delivery</span>
                      <span className="delivery-time">{estimatedDelivery}</span>
                    </div>
                  </div>
                )}

                {/* Special Instructions */}
                <div className="special-instructions">
                  <textarea
                    placeholder="Add special instructions (optional)"
                    rows="2"
                    className="instructions-input"
                  />
                </div>
              </div>
            ) : (
              /* Step 2: Payment Method */
              <div className="payment-step">
                <div className="order-summary">
                  <div className="summary-item">
                    <span>Order Total:</span>
                    <strong>₹{modifiedOrder.amount + Math.round(modifiedOrder.amount * 0.05)}</strong>
                  </div>
                </div>

                <div className="payment-methods">
                  <h4>Select Payment Method</h4>
                  
                  <button
                    className={`payment-method-card ${paymentMethod === 'upi' ? 'selected' : ''}`}
                    onClick={() => handlePaymentMethodSelect('upi')}
                  >
                    <div className="payment-method-icon">
                      <FaWallet />
                    </div>
                    <div className="payment-method-details">
                      <span className="method-name">UPI</span>
                      <span className="method-desc">Google Pay, PhonePe, etc.</span>
                    </div>
                    {paymentMethod === 'upi' && (
                      <FaCheckCircle className="selected-icon" />
                    )}
                  </button>

                  <button
                    className={`payment-method-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                    onClick={() => handlePaymentMethodSelect('card')}
                  >
                    <div className="payment-method-icon">
                      <FaCreditCard />
                    </div>
                    <div className="payment-method-details">
                      <span className="method-name">Credit/Debit Card</span>
                      <span className="method-desc">Visa, MasterCard, RuPay</span>
                    </div>
                    {paymentMethod === 'card' && (
                      <FaCheckCircle className="selected-icon" />
                    )}
                  </button>

                  <button
                    className={`payment-method-card ${paymentMethod === 'coins' ? 'selected' : ''}`}
                    onClick={() => handlePaymentMethodSelect('coins')}
                  >
                    <div className="payment-method-icon">
                      <FaCoins />
                    </div>
                    <div className="payment-method-details">
                      <span className="method-name">SabAI Coins</span>
                      <span className="method-desc">Pay with reward points</span>
                    </div>
                    {paymentMethod === 'coins' && (
                      <FaCheckCircle className="selected-icon" />
                    )}
                  </button>
                </div>

                {/* Coin Balance (if applicable) */}
                {paymentMethod === 'coins' && (
                  <div className="coin-balance-info">
                    <FaInfoCircle />
                    <span>Available Coins: 250 (₹2.50 value)</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div className="order-confirmation-footer">
              <Button
                variant="secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <div className="footer-right">
                {step === 1 && (
                  <Button
                    variant="outline"
                    onClick={onModify}
                    disabled={loading}
                    icon={FaEdit}
                  >
                    Modify
                  </Button>
                )}
                
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  loading={loading}
                  icon={step === 2 ? FaCheckCircle : FaArrowRight}
                >
                  {step === 1 ? 'Continue to Payment' : 'Confirm & Pay'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Order Success Component
export const OrderSuccess = ({ orderDetails, onDone }) => {
  return (
    <motion.div
      className="order-success"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className="success-icon">
        <FaCheckCircle />
      </div>
      
      <h2>Order Placed Successfully!</h2>
      
      <div className="success-details">
        <p>Your order has been confirmed</p>
        
        <div className="order-info">
          <div className="info-row">
            <span>Order ID:</span>
            <strong>#{orderDetails?.orderId || 'ORD' + Date.now()}</strong>
          </div>
          <div className="info-row">
            <span>Amount Paid:</span>
            <strong>₹{orderDetails?.amount}</strong>
          </div>
          <div className="info-row">
            <span>Estimated Delivery:</span>
            <strong>{orderDetails?.estimatedDelivery || '30-45 minutes'}</strong>
          </div>
        </div>
      </div>

      <div className="success-actions">
        <Button variant="primary" onClick={onDone}>
          Done
        </Button>
        <Button variant="outline" onClick={() => window.open('/orders')}>
          Track Order
        </Button>
      </div>
    </motion.div>
  );
};

export default OrderConfirmation;