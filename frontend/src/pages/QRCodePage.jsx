// frontend/src/pages/QRCodePage.jsx
// Complete redesigned with similar structure to SendMoneyPage

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaQrcode, 
  FaArrowLeft, 
  FaDownload, 
  FaCopy, 
  FaShare, 
  FaPrint,
  FaUser,
  FaRupeeSign,
  FaEdit,
  FaCheckCircle,
  FaTimes,
  FaCamera,
  FaMobile,
  FaGooglePay,
  FaAmazonPay,
  FaWallet,
  FaSpinner,
  FaHistory,
  FaArrowRight,
  FaInfoCircle,
  FaWhatsapp,
  FaEnvelope,
  FaLink,
  FaStar,
  FaClock
} from 'react-icons/fa';
import { SiPhonepe, SiPaytm } from 'react-icons/si';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import './QRCodePage.css';

// Helper function to generate QR with logo
const generateQRWithLogo = async (qrValue, logoSize = 55) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 300;
    canvas.height = 300;
    
    const qrSvg = document.getElementById('qr-code');
    if (!qrSvg) {
      resolve(null);
      return;
    }
    
    const svgData = new XMLSerializer().serializeToString(qrSvg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw white background for logo
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(canvas.width/2, canvas.height/2, logoSize/2 + 5, 0, Math.PI * 2);
      ctx.fill();
      
      const logoImg = new Image();
      logoImg.onload = () => {
        ctx.drawImage(
          logoImg, 
          canvas.width/2 - logoSize/2, 
          canvas.height/2 - logoSize/2, 
          logoSize, 
          logoSize
        );
        resolve(canvas.toDataURL('image/png'));
      };
      logoImg.src = '/images/merchants/sabailogo.png';
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  });
};

// Animated Progress Bar Component
const AnimatedProgressBar = ({ step, totalSteps = 2 }) => {
  const progress = (step / totalSteps) * 100;
  
  return (
    <div className="progress-container">
      <div className="progress-bar-bg">
        <motion.div 
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
      <div className="progress-steps">
        <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-circle">
            {step > 1 ? <FaCheckCircle /> : <span>1</span>}
          </div>
          <span className="step-label">Details</span>
        </div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-circle">
            {step > 2 ? <FaCheckCircle /> : <span>2</span>}
          </div>
          <span className="step-label">QR Code</span>
        </div>
      </div>
    </div>
  );
};

// QR Display Modal for sharing
const QRShareModal = ({ onClose, qrValue, formData, onDownload, onCopy, onShare, onPrint }) => {
  return (
    <motion.div className="qr-share-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><FaTimes /></button>
      
      <div className="qr-share-header">
        <div className="success-icon-small">
          <FaCheckCircle />
        </div>
        <h3>QR Code Generated!</h3>
        <p className="share-subtitle">Share this QR code to receive payments</p>
      </div>

      <div className="qr-share-body">
        <div className="qr-image-container">
          <div className="qr-wrapper">
            <QRCode
              id="qr-code-share"
              value={qrValue}
              size={200}
              level="H"
              className="qr-image"
            />
            <img src="/images/merchants/sabailogo.png" alt="SabAI Pay" className="qr-center-logo" />
          </div>
        </div>

        <div className="qr-details-summary">
          <div className="summary-row">
            <span>UPI ID</span>
            <span className="detail-value">{formData.vpa}</span>
          </div>
          {formData.name && (
            <div className="summary-row">
              <span>Name</span>
              <span>{formData.name}</span>
            </div>
          )}
          {formData.amount && (
            <div className="summary-row highlight">
              <span>Amount</span>
              <span className="amount-highlight">₹{formData.amount}</span>
            </div>
          )}
          {formData.note && (
            <div className="summary-row">
              <span>Note</span>
              <span>{formData.note}</span>
            </div>
          )}
        </div>

        <div className="share-options">
          <h4>Share via</h4>
          <div className="share-buttons">
            <button className="share-btn whatsapp" onClick={() => onShare('whatsapp')}>
              <FaWhatsapp /> WhatsApp
            </button>
            <button className="share-btn email" onClick={() => onShare('email')}>
              <FaEnvelope /> Email
            </button>
            <button className="share-btn copy" onClick={() => onCopy(qrValue)}>
              <FaLink /> Copy Link
            </button>
          </div>
        </div>
      </div>

      <div className="qr-share-footer">
        <button className="btn-secondary" onClick={onClose}>Close</button>
        <button className="btn-primary" onClick={onDownload}>
          <FaDownload /> Download
        </button>
      </div>
    </motion.div>
  );
};

const QRCodePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vpa: user?.phone_number ? `${user.phone_number}@sabai` : '',
    name: user?.name || '',
    amount: '',
    note: ''
  });
  const [errors, setErrors] = useState({});
  const [qrValue, setQrValue] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [recentQRCodes, setRecentQRCodes] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [noteFocused, setNoteFocused] = useState(false);

  useEffect(() => {
    loadRecentQRCodes();
  }, []);

  const loadRecentQRCodes = () => {
    const saved = localStorage.getItem('recentQRCodes') || '[]';
    setRecentQRCodes(JSON.parse(saved).slice(0, 5));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vpa) {
      newErrors.vpa = 'UPI ID is required';
    } else if (!/^[\w.-]+@[\w.-]+$/.test(formData.vpa)) {
      newErrors.vpa = 'Enter a valid UPI ID (e.g., name@bank)';
    }

    if (formData.amount && (isNaN(formData.amount) || formData.amount <= 0)) {
      newErrors.amount = 'Enter a valid amount';
    } else if (formData.amount && formData.amount > 100000) {
      newErrors.amount = 'Amount cannot exceed ₹1,00,000';
    }

    if (formData.note && formData.note.length > 100) {
      newErrors.note = 'Note cannot exceed 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAppSelect = (appName) => {
    setSelectedApp(appName);
    toast.success(`${appName} selected!`);
  };

  const generateUPIString = () => {
    let upiString = `upi://pay?pa=${encodeURIComponent(formData.vpa)}`;
    
    if (formData.name) {
      upiString += `&pn=${encodeURIComponent(formData.name)}`;
    }
    
    if (formData.amount) {
      upiString += `&am=${formData.amount}`;
    }
    
    if (formData.note) {
      upiString += `&tn=${encodeURIComponent(formData.note)}`;
    }
    
    upiString += '&cu=INR';
    
    return upiString;
  };

  const handleGenerate = () => {
    if (!validateForm()) return;

    setLoading(true);
    
    setTimeout(() => {
      const upiString = generateUPIString();
      setQrValue(upiString);
      
      // Save to recent QR codes
      const newQR = {
        id: Date.now(),
        vpa: formData.vpa,
        name: formData.name,
        amount: formData.amount,
        note: formData.note,
        date: new Date().toISOString(),
        value: upiString
      };
      
      const updated = [newQR, ...recentQRCodes].slice(0, 5);
      localStorage.setItem('recentQRCodes', JSON.stringify(updated));
      setRecentQRCodes(updated);
      
      setLoading(false);
      setStep(2);
      toast.success('QR Code generated successfully!');
    }, 500);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(1);
    } else {
      navigate(-1);
    }
  };

  const handleDownload = async () => {
    try {
      const qrWithLogo = await generateQRWithLogo(qrValue);
      
      if (qrWithLogo) {
        const link = document.createElement('a');
        link.download = `sabai-pay-qr-${Date.now()}.png`;
        link.href = qrWithLogo;
        link.click();
        toast.success('QR Code with logo downloaded!');
      } else {
        const svg = document.getElementById('qr-code');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const link = document.createElement('a');
          link.download = `sabai-pay-qr-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          toast.success('QR Code downloaded!');
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svg.outerHTML);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text || qrValue);
    toast.success('UPI string copied to clipboard');
  };

  const handleShare = async (method) => {
    const message = `💰 Please pay me using SabAI Pay\n\nUPI ID: ${formData.vpa}\n${formData.amount ? `Amount: ₹${formData.amount}\n` : ''}${formData.note ? `Note: ${formData.note}\n` : ''}\n\nScan this QR code or use UPI ID to pay.`;
    
    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=Payment Request&body=${encodeURIComponent(message)}`);
        break;
      default:
        handleCopy(qrValue);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>SabAI Pay QR Code</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: white; font-family: Arial, sans-serif; }
            .qr-container { text-align: center; padding: 30px; max-width: 400px; }
            .qr-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #333; }
            .qr-wrapper { position: relative; display: inline-block; }
            .qr-logo { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 50px; height: 50px; background: white; border-radius: 50%; padding: 5px; }
            .qr-details { margin-top: 20px; text-align: left; border-top: 1px solid #eee; padding-top: 20px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
            .detail-label { color: #666; font-weight: 500; }
            .detail-value { color: #333; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-title">SabAI Pay QR Code</div>
            <div class="qr-wrapper">
              <img src="data:image/svg+xml;base64,${btoa(document.getElementById('qr-code').outerHTML)}" style="width: 250px; height: 250px;" />
              <img src="/images/merchants/sabailogo.png" class="qr-logo" />
            </div>
            <div class="qr-details">
              <div class="detail-row"><span class="detail-label">UPI ID:</span><span class="detail-value">${formData.vpa}</span></div>
              ${formData.name ? `<div class="detail-row"><span class="detail-label">Name:</span><span class="detail-value">${formData.name}</span></div>` : ''}
              ${formData.amount ? `<div class="detail-row"><span class="detail-label">Amount:</span><span class="detail-value">₹${formData.amount}</span></div>` : ''}
              ${formData.note ? `<div class="detail-row"><span class="detail-label">Note:</span><span class="detail-value">${formData.note}</span></div>` : ''}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleScanQR = () => {
    setShowScanner(true);
  };

  const handleScanComplete = (data) => {
    setShowScanner(false);
    
    try {
      if (data.includes('upi://')) {
        const url = new URL(data);
        const params = new URLSearchParams(url.search);
        
        setFormData({
          vpa: params.get('pa') || '',
          name: params.get('pn') || '',
          amount: params.get('am') || '',
          note: params.get('tn') || ''
        });
      } else if (data.includes('@')) {
        setFormData(prev => ({ ...prev, vpa: data }));
      }
      
      toast.success('QR code scanned!');
    } catch (e) {
      console.log('Parse error:', e);
    }
  };

  const loadRecentQR = (qr) => {
    setFormData({
      vpa: qr.vpa,
      name: qr.name || '',
      amount: qr.amount || '',
      note: qr.note || ''
    });
    setQrValue(qr.value);
    setStep(2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const upiApps = [
    { id: 'gpay', name: 'Google Pay', icon: FaGooglePay, color: '#4285F4' },
    { id: 'phonepe', name: 'PhonePe', icon: SiPhonepe, color: '#5F259F' },
    { id: 'paytm', name: 'Paytm', icon: SiPaytm, color: '#00BAF2' },
    { id: 'amazon', name: 'Amazon Pay', icon: FaAmazonPay, color: '#FF9900' }
  ];

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  return (
    <div className="qr-page">
      <button className="back-button" onClick={handleBack}>
        <FaArrowLeft /> Back
      </button>

      <div className="qr-container">
        <div className="qr-header">
          <h1>QR Code Generator</h1>
          <p className="subtitle">Create your UPI QR code for instant payments</p>
          <AnimatedProgressBar step={step} totalSteps={2} />
        </div>

        <div className="qr-content">
          {/* STEP 1: Enter Details */}
          {step === 1 && (
            <motion.div
              className="step-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              

              {/* Form Section */}
              <div className="form-section">
                <div className="form-group">
                  <label>UPI ID / VPA <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <FaMobile className="input-icon" />
                    <input
                      type="text"
                      name="vpa"
                      value={formData.vpa}
                      onChange={handleChange}
                      placeholder="e.g., name@okhdfcbank"
                      className={`form-input ${errors.vpa ? 'error' : ''}`}
                    />
                  </div>
                  {errors.vpa && <span className="error-text">{errors.vpa}</span>}
                </div>

                <div className="form-group">
                  <label>Your Name (Optional)</label>
                  <div className="input-wrapper">
                    <FaUser className="input-icon" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Amount (Optional)</label>
                  <div className="amount-wrapper">
                    <span className="currency">₹</span>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0"
                      className={`amount-input ${errors.amount ? 'error' : ''}`}
                      min="1"
                      max="100000"
                    />
                  </div>
                  {errors.amount && <span className="error-text">{errors.amount}</span>}
                  
                  <div className="quick-amounts">
                    {quickAmounts.map(amt => (
                      <button key={amt} onClick={() => setFormData(prev => ({ ...prev, amount: amt }))}>
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`form-group note-group ${noteFocused ? 'focused' : ''}`}>
                  <label>Note (Optional)</label>
                  <div className="note-wrapper">
                    <div className="note-icon">
                      <FaEdit />
                    </div>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      onFocus={() => setNoteFocused(true)}
                      onBlur={() => setNoteFocused(false)}
                      placeholder="What's this for? (e.g., Dinner payment, Rent)"
                      rows={noteFocused ? 3 : 1}
                    />
                    {formData.note && (
                      <button className="clear-note" onClick={() => setFormData(prev => ({ ...prev, note: '' }))}>
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  <div className="note-hint">
                    <span>{formData.note?.length || 0}/100 characters</span>
                    <span>💡 Adding a note helps track payments</span>
                  </div>
                </div>
              </div>

              {/* Recent QR Codes */}
              {recentQRCodes.length > 0 && (
                <div className="recent-qr-section">
                  <div className="section-header">
                    <h3>Recent QR Codes</h3>
                    <button className="view-all" onClick={() => {}}>View All</button>
                  </div>
                  <div className="recent-qr-scroll-container">
                    <div className="recent-qr-list">
                      {recentQRCodes.map(qr => (
                        <button
                          key={qr.id}
                          className="recent-qr-item"
                          onClick={() => loadRecentQR(qr)}
                        >
                          <div className="recent-qr-info">
                            <span className="recent-vpa">{qr.vpa}</span>
                            {qr.amount && (
                              <span className="recent-amount">₹{qr.amount}</span>
                            )}
                            <span className="recent-date">{formatDate(qr.date)}</span>
                          </div>
                          <FaArrowRight className="recent-arrow" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
                  {loading ? <FaSpinner className="spinner" /> : 'Generate QR Code'} <FaQrcode />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: QR Code Display */}
          {step === 2 && (
            <motion.div
              className="step-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="qr-display-card">
                <div className="qr-header-info">
                  <div className="qr-badge">
                    <FaQrcode /> UPI QR Code
                  </div>
                  <button className="edit-btn" onClick={() => setStep(1)}>
                    <FaEdit /> Edit
                  </button>
                </div>

                <div className="qr-image-container">
                  <div className="qr-wrapper">
                    <QRCode
                      id="qr-code"
                      value={qrValue}
                      size={250}
                      level="H"
                      className="qr-image"
                    />
                    <img src="/images/merchants/sabailogo.png" alt="SabAI Pay" className="qr-center-logo" />
                  </div>
                </div>

                <div className="qr-details-card">
                  <div className="detail-item">
                    <span className="detail-label">UPI ID</span>
                    <span className="detail-value">{formData.vpa}</span>
                  </div>
                  {formData.name && (
                    <div className="detail-item">
                      <span className="detail-label">Name</span>
                      <span className="detail-value">{formData.name}</span>
                    </div>
                  )}
                  {formData.amount && (
                    <div className="detail-item highlight">
                      <span className="detail-label">Amount</span>
                      <span className="detail-value amount-highlight">₹{formData.amount}</span>
                    </div>
                  )}
                  {formData.note && (
                    <div className="detail-item">
                      <span className="detail-label">Note</span>
                      <span className="detail-value">{formData.note}</span>
                    </div>
                  )}
                </div>

                <div className="qr-actions">
                  <button className="action-btn" onClick={handleDownload}>
                    <FaDownload />
                    <span>Download</span>
                  </button>
                  <button className="action-btn" onClick={() => handleCopy(qrValue)}>
                    <FaCopy />
                    <span>Copy</span>
                  </button>
                  <button className="action-btn" onClick={() => setShowShareModal(true)}>
                    <FaShare />
                    <span>Share</span>
                  </button>
                  <button className="action-btn" onClick={handlePrint}>
                    <FaPrint />
                    <span>Print</span>
                  </button>
                </div>

                <div className="qr-note">
                  <FaInfoCircle />
                  <p>Scan this QR code with any UPI app to make payment</p>
                </div>

                <div className="form-actions">
                  <button className="btn-secondary" onClick={() => setStep(1)}>
                    Create New QR
                  </button>
                  <button className="btn-primary" onClick={() => setShowShareModal(true)}>
                    <FaShare /> Share QR Code
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowScanner(false)}>
            <motion.div className="scanner-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowScanner(false)}><FaTimes /></button>
              <h3>Scan QR Code</h3>
              
              <div className="scanner-placeholder">
                <FaCamera className="scanner-icon" />
                <p>Position QR code within the frame</p>
                <p className="scanner-hint">
                  Camera access will be requested
                </p>
              </div>

              <div className="scanner-actions">
                <button className="btn-secondary" onClick={() => setShowScanner(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    handleScanComplete('upi://pay?pa=merchant@okhdfcbank&pn=Merchant&am=500&tn=Test Payment');
                  }}
                >
                  Simulate Scan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share QR Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowShareModal(false)}>
            <QRShareModal 
              onClose={() => setShowShareModal(false)}
              qrValue={qrValue}
              formData={formData}
              onDownload={handleDownload}
              onCopy={handleCopy}
              onShare={handleShare}
              onPrint={handlePrint}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QRCodePage;