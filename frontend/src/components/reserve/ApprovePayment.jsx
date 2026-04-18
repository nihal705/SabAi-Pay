import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaShoppingBag,
  FaUtensils,
  FaFilm,
  FaGasPump,
  FaPlane,
  FaMedkit,
  FaGraduationCap,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaRupeeSign,
  FaUser,
  FaCalendarAlt,
  FaBell,
  FaArrowRight,
  FaInfoCircle,
  FaQrcode
} from 'react-icons/fa';
import Button from '../common/Button';
import Modal from '../common/Modal';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ReserveStyles.css';

const ApprovePayment = ({ onApprovalComplete }) => {
  const [loading, setLoading] = useState(false);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingPayments();
    // Poll for new pending payments every 30 seconds
    const interval = setInterval(fetchPendingPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/agent/pending-approvals`);
      if (response.data.success) {
        setPendingPayments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    }
  };

  const getMerchantIcon = (merchant) => {
    const icons = {
      swiggy: FaUtensils,
      zomato: FaUtensils,
      amazon: FaShoppingBag,
      flipkart: FaShoppingBag,
      zepto: FaShoppingBag,
      bigbasket: FaShoppingBag,
      netflix: FaFilm,
      prime: FaFilm,
      uber: FaPlane,
      ola: FaPlane
    };
    return icons[merchant?.toLowerCase()] || FaShoppingBag;
  };

  const getMerchantColor = (merchant) => {
    const colors = {
      swiggy: '#fc8019',
      zomato: '#e23744',
      amazon: '#ff9900',
      flipkart: '#2874f0',
      zepto: '#8400e5',
      netflix: '#e50914',
      uber: '#000000'
    };
    return colors[merchant?.toLowerCase()] || '#667eea';
  };

  const handleApprove = async (payment) => {
    setProcessing(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/agent/approve/${payment.id}`,
        { action: 'approve' }
      );

      if (response.data.success) {
        toast.success('Payment approved successfully!');
        setPendingPayments(prev => prev.filter(p => p.id !== payment.id));
        onApprovalComplete?.();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve payment');
    } finally {
      setProcessing(false);
      setShowDetails(false);
    }
  };

  const handleReject = async (payment) => {
    setProcessing(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/agent/approve/${payment.id}`,
        { action: 'reject' }
      );

      if (response.data.success) {
        toast.success('Payment rejected');
        setPendingPayments(prev => prev.filter(p => p.id !== payment.id));
      }
    } catch (error) {
      toast.error('Failed to reject payment');
    } finally {
      setProcessing(false);
      setShowDetails(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour ago`;
    return date.toLocaleDateString();
  };

  if (pendingPayments.length === 0) {
    return null;
  }

  return (
    <div className="approve-payment-container">
      <div className="approve-header">
        <div className="header-title">
          <FaBell className="header-icon" />
          <h3>Pending Approvals</h3>
          <span className="pending-count">{pendingPayments.length}</span>
        </div>
      </div>

      <div className="pending-list">
        {pendingPayments.map((payment, index) => {
          const MerchantIcon = getMerchantIcon(payment.extracted_merchant);
          const merchantColor = getMerchantColor(payment.extracted_merchant);

          return (
            <motion.div
              key={payment.id}
              className="pending-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="pending-icon" style={{ backgroundColor: `${merchantColor}20` }}>
                <MerchantIcon style={{ color: merchantColor }} />
              </div>

              <div className="pending-content">
                <div className="pending-header">
                  <h4>{payment.extracted_merchant}</h4>
                  <span className="pending-amount">₹{payment.extracted_amount}</span>
                </div>
                
                <p className="pending-description">
                  {payment.user_message}
                </p>

                <div className="pending-footer">
                  <span className="pending-time">
                    <FaClock /> {formatTime(payment.created_at)}
                  </span>
                  <button
                    className="view-details-btn"
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowDetails(true);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Payment Approval"
        size="medium"
      >
        {selectedPayment && (
          <div className="approval-modal">
            <div className="modal-merchant">
              <div
                className="modal-merchant-icon"
                style={{ backgroundColor: getMerchantColor(selectedPayment.extracted_merchant) }}
              >
                {React.createElement(getMerchantIcon(selectedPayment.extracted_merchant), { size: 32 })}
              </div>
              <div className="modal-merchant-info">
                <h3>{selectedPayment.extracted_merchant}</h3>
                <span className="modal-category">
                  {selectedPayment.extracted_merchant_category || 'Merchant'}
                </span>
              </div>
            </div>

            <div className="modal-details">
              <div className="detail-row highlight">
                <span>Amount</span>
                <strong className="amount">₹{selectedPayment.extracted_amount}</strong>
              </div>

              <div className="detail-row">
                <span>Item/Service</span>
                <span className="item-name">
                  {selectedPayment.extracted_items?.item || selectedPayment.user_message}
                </span>
              </div>

              <div className="detail-row">
                <span>Requested by</span>
                <span>SabAI Assistant</span>
              </div>

              <div className="detail-row">
                <span>Time</span>
                <span>{new Date(selectedPayment.created_at).toLocaleString()}</span>
              </div>

              {selectedPayment.extracted_items && (
                <div className="order-summary">
                  <h4>Order Summary</h4>
                  {Object.entries(selectedPayment.extracted_items).map(([key, value]) => (
                    <div key={key} className="summary-row">
                      <span>{key}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="approval-warning">
                <FaExclamationTriangle />
                <p>
                  This payment requires your approval. Once approved, the amount will be
                  deducted from your {selectedPayment.extracted_merchant} limit.
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <Button
                variant="danger"
                onClick={() => handleReject(selectedPayment)}
                disabled={processing}
                icon={FaTimesCircle}
              >
                Reject
              </Button>
              <Button
                variant="success"
                onClick={() => handleApprove(selectedPayment)}
                disabled={processing}
                loading={processing}
                icon={FaCheckCircle}
              >
                Approve Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Payment Request Card (for notifications)
export const PaymentRequestCard = ({ request, onRespond }) => {
  return (
    <motion.div
      className="payment-request-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="request-header">
        <FaQrcode className="request-icon" />
        <span className="request-time">{formatTime(request.created_at)}</span>
      </div>

      <div className="request-body">
        <h4>Payment Request</h4>
        <p className="request-message">{request.user_message}</p>
        
        <div className="request-amount">
          <FaRupeeSign />
          <span>{request.extracted_amount}</span>
        </div>

        <div className="request-merchant">
          <FaUser />
          <span>{request.extracted_merchant}</span>
        </div>
      </div>

      <div className="request-actions">
        <button
          className="request-btn reject"
          onClick={() => onRespond(request.id, 'reject')}
        >
          <FaTimesCircle /> Decline
        </button>
        <button
          className="request-btn approve"
          onClick={() => onRespond(request.id, 'approve')}
        >
          <FaCheckCircle /> Approve
        </button>
      </div>
    </motion.div>
  );
};

export default ApprovePayment;