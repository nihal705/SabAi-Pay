// frontend/src/pages/QRCodePage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaQrcode, FaArrowLeft, FaDownload, FaCopy, FaShare, FaPrint,
  FaUser, FaRupeeSign, FaEdit, FaCheckCircle, FaTimes,
  FaCamera, FaMobile, FaGooglePay, FaAmazonPay,
  FaSpinner, FaHistory, FaArrowRight, FaInfoCircle,
  FaWhatsapp, FaEnvelope, FaLink, FaClock
} from 'react-icons/fa';
import { SiPhonepe, SiPaytm } from 'react-icons/si';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import QRScanner from '../components/upi/QRScanner';

const QRCodePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [recentQRCodes, setRecentQRCodes] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [noteFocused, setNoteFocused] = useState(false);
  
  const [formData, setFormData] = useState({
    vpa: user?.phone_number ? `${user.phone_number}@sabai` : '',
    name: user?.name || '',
    amount: '',
    note: ''
  });
  const [errors, setErrors] = useState({});
  const [qrValue, setQrValue] = useState('');

  const quickAmounts = [100, 500, 1000, 2000, 5000];
  
  const upiApps = [
    { id: 'gpay', name: 'Google Pay', icon: FaGooglePay, color: '#4285F4' },
    { id: 'phonepe', name: 'PhonePe', icon: SiPhonepe, color: '#5F259F' },
    { id: 'paytm', name: 'Paytm', icon: SiPaytm, color: '#00BAF2' },
    { id: 'amazon', name: 'Amazon Pay', icon: FaAmazonPay, color: '#FF9900' }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('recentQRCodes') || '[]';
    setRecentQRCodes(JSON.parse(saved).slice(0, 5));
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.vpa) newErrors.vpa = 'UPI ID is required';
    else if (!/^[\w.-]+@[\w.-]+$/.test(formData.vpa)) {
      newErrors.vpa = 'Enter a valid UPI ID';
    }
    if (formData.amount && (isNaN(formData.amount) || formData.amount <= 0)) {
      newErrors.amount = 'Enter a valid amount';
    }
    if (formData.note && formData.note.length > 100) {
      newErrors.note = 'Note cannot exceed 100 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateUPIString = () => {
    let str = `upi://pay?pa=${encodeURIComponent(formData.vpa)}`;
    if (formData.name) str += `&pn=${encodeURIComponent(formData.name)}`;
    if (formData.amount) str += `&am=${formData.amount}`;
    if (formData.note) str += `&tn=${encodeURIComponent(formData.note)}`;
    str += '&cu=INR';
    return str;
  };

  const handleGenerate = () => {
    if (!validateForm()) return;
    setLoading(true);
    setTimeout(() => {
      const upiString = generateUPIString();
      setQrValue(upiString);
      const newQR = { id: Date.now(), ...formData, date: new Date().toISOString(), value: upiString };
      const updated = [newQR, ...recentQRCodes].slice(0, 5);
      localStorage.setItem('recentQRCodes', JSON.stringify(updated));
      setRecentQRCodes(updated);
      setLoading(false);
      setStep(2);
      toast.success('QR Code generated!');
    }, 400);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text || qrValue);
    toast.success('Copied!');
  };

  const handleDownload = async () => {
    try {
      const svg = document.getElementById('qr-code');
      if (!svg) { toast.error('QR Code not found'); return; }
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = `sabai-qr-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('Downloaded!');
      };
      img.src = url;
    } catch (error) {
      toast.error('Download failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 md:p-4">
      {/* Back Button */}
      <button 
        onClick={() => step > 1 ? setStep(1) : navigate(-1)}
        className="flex items-center gap-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-gray-800 px-3 py-2 rounded-full text-sm font-medium transition-all mb-3"
      >
        <FaArrowLeft className="text-xs" /> Back
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent">
              QR Code Generator
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Create your UPI QR code for instant payments
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-5 px-2">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-0.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {step > s ? <FaCheckCircle className="text-xs" /> : s}
                  </div>
                  <span className={`text-[10px] font-medium ${step >= s ? 'text-primary-500' : 'text-gray-400'}`}>
                    {s === 1 ? 'Details' : 'QR Code'}
                  </span>
                </div>
                {s < 2 && (
                  <div className={`flex-1 h-0.5 mx-1 ${step > s ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* STEP 1: Form */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              {/* Quick Apps */}
              <div className="mb-4">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Quick Select</p>
                <div className="grid grid-cols-4 gap-2">
                  {upiApps.map(app => (
                    <button
                      key={app.id}
                      onClick={() => setSelectedApp(app.id)}
                      className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border transition-all ${
                        selectedApp === app.id 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <app.icon style={{ color: app.color, fontSize: '1.3rem' }} />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400">{app.name}</span>
                      {selectedApp === app.id && (
                        <FaCheckCircle className="text-[10px] text-green-500 absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scan Button */}
              <button
                onClick={() => setShowScanner(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all"
              >
                <FaCamera /> Scan QR Code
              </button>

              {/* Form */}
              <div className="mt-4 space-y-3">
                {/* VPA */}
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    UPI ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-0.5">
                    <FaMobile className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      value={formData.vpa}
                      onChange={(e) => setFormData({...formData, vpa: e.target.value})}
                      placeholder="name@okhdfcbank"
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 ${
                        errors.vpa ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-200'
                      }`}
                    />
                  </div>
                  {errors.vpa && <p className="text-[10px] text-red-500 mt-0.5">{errors.vpa}</p>}
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Your Name (Optional)</label>
                  <div className="relative mt-0.5">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Your name"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Amount (Optional)</label>
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
                    <textarea
                      value={formData.note}
                      onChange={(e) => setFormData({...formData, note: e.target.value})}
                      onFocus={() => setNoteFocused(true)}
                      onBlur={() => setNoteFocused(false)}
                      placeholder="What's this for?"
                      rows={noteFocused ? 2 : 1}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
                    />
                    {formData.note && (
                      <button
                        onClick={() => setFormData({...formData, note: ''})}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500"
                      >
                        <FaTimes className="text-sm" />
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                    <span>{formData.note?.length || 0}/100</span>
                    <span>💡 Adding a note helps track payments</span>
                  </div>
                </div>

                {/* Recent QR Codes */}
                {recentQRCodes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Recent</p>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5">
                      {recentQRCodes.map(qr => (
                        <button
                          key={qr.id}
                          onClick={() => {
                            setFormData({ vpa: qr.vpa, name: qr.name || '', amount: qr.amount || '', note: qr.note || '' });
                            setQrValue(qr.value);
                            setStep(2);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium text-gray-800 dark:text-gray-200">{qr.vpa}</span>
                            {qr.amount && <span className="text-xs text-green-600">₹{qr.amount}</span>}
                          </div>
                          <FaArrowRight className="text-gray-400 text-xs" />
                        </button>
                      ))}
                    </div>
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
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex-1 py-2.5 text-sm font-medium bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : <><FaQrcode /> Generate</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: QR Display */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-full">
                  <FaQrcode className="text-primary-500 text-xs" />
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">UPI QR Code</span>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-500 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <FaEdit /> Edit
                </button>
              </div>

              {/* QR Image */}
              <div className="flex justify-center p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <QRCode id="qr-code" value={qrValue} size={200} level="H" />
                  <img
                    src="/images/merchants/sabailogo.png"
                    alt="SabAI Pay"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full p-1 shadow-md"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">UPI ID</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{formData.vpa}</span>
                </div>
                {formData.name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{formData.name}</span>
                  </div>
                )}
                {formData.amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold text-green-600">₹{formData.amount}</span>
                  </div>
                )}
                {formData.note && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Note</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{formData.note}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[
                  { icon: FaDownload, label: 'Download', onClick: handleDownload },
                  { icon: FaCopy, label: 'Copy', onClick: () => handleCopy(qrValue) },
                  { icon: FaShare, label: 'Share', onClick: () => setShowShareModal(true) },
                  { icon: FaPrint, label: 'Print', onClick: () => window.print() }
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-primary-50 hover:text-primary-500 dark:hover:bg-primary-900/20 transition-all"
                  >
                    <action.icon className="text-base" />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Note */}
              <div className="flex items-center gap-2 px-3 py-2 mt-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-xs text-yellow-700 dark:text-yellow-400">
                <FaInfoCircle />
                <p>Scan with any UPI app to make payment</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all"
                >
                  New QR
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 py-2.5 text-sm font-medium bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <FaShare /> Share
                </button>
              </div>
            </motion.div>
          )}
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
                if (data.includes('upi://')) {
                  const url = new URL(data);
                  const params = new URLSearchParams(url.search);
                  setFormData({
                    vpa: params.get('pa') || '',
                    name: params.get('pn') || '',
                    amount: params.get('am') || '',
                    note: params.get('tn') || ''
                  });
                  toast.success('QR scanned!');
                } else if (data.includes('@')) {
                  setFormData(prev => ({ ...prev, vpa: data }));
                  toast.success('UPI ID scanned!');
                }
              } catch (e) {
                toast.error('Invalid QR code');
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-5 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>

              <div className="text-center mb-4">
                <FaCheckCircle className="text-3xl text-green-500 mx-auto mb-1" />
                <h3 className="text-lg font-bold">QR Code Generated!</h3>
                <p className="text-xs text-gray-500">Share to receive payments</p>
              </div>

              <div className="flex justify-center p-3 bg-white rounded-xl border border-gray-200">
                <div className="relative">
                  <QRCode value={qrValue} size={160} level="H" />
                  <img src="/images/merchants/sabailogo.png" alt="Logo" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full p-1" />
                </div>
              </div>

              <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-2.5 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">UPI ID</span>
                  <span className="font-medium">{formData.vpa}</span>
                </div>
                {formData.amount && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold text-green-600">₹{formData.amount}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                {[
                  { icon: FaWhatsapp, label: 'WhatsApp', color: '#25d366' },
                  { icon: FaEnvelope, label: 'Email', color: '#ea4335' },
                  { icon: FaLink, label: 'Copy', color: '#4f46e5' }
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={() => {
                      if (btn.label === 'Copy') {
                        handleCopy(qrValue);
                      } else {
                        const msg = `💰 Pay me using SabAI Pay\nUPI ID: ${formData.vpa}${formData.amount ? `\nAmount: ₹${formData.amount}` : ''}`;
                        if (btn.label === 'WhatsApp') {
                          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
                        } else {
                          window.open(`mailto:?subject=Payment Request&body=${encodeURIComponent(msg)}`);
                        }
                      }
                    }}
                    className="flex-1 py-2 text-xs font-medium text-white rounded-xl hover:opacity-90 transition-all"
                    style={{ backgroundColor: btn.color }}
                  >
                    <btn.icon className="inline mr-1" /> {btn.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleDownload}
                className="w-full mt-2 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all"
              >
                <FaDownload className="inline mr-2" /> Download QR
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QRCodePage;