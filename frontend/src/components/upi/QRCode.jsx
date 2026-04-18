import React, { useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import {
  FaQrcode,
  FaDownload,
  FaCopy,
  FaShare,
  FaPrint,
  FaRupeeSign,
  FaUser,
  FaEdit
} from 'react-icons/fa';
import { MdQrCodeScanner } from 'react-icons/md';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import './UPIStyles.css';

const QRCodeGenerator = () => {
  const [vpa, setVpa] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [generated, setGenerated] = useState(false);
  const [qrValue, setQrValue] = useState('');

  const generateUPIString = () => {
    let upiString = `upi://pay?pa=${vpa}`;
    if (name) upiString += `&pn=${encodeURIComponent(name)}`;
    if (amount) upiString += `&am=${amount}`;
    if (note) upiString += `&tn=${encodeURIComponent(note)}`;
    upiString += '&cu=INR';
    return upiString;
  };

  const handleGenerate = () => {
    if (!vpa) {
      toast.error('Please enter UPI ID');
      return;
    }

    const upiString = generateUPIString();
    setQrValue(upiString);
    setGenerated(true);
    toast.success('QR Code generated successfully');
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Create image from SVG
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Download as PNG
      const link = document.createElement('a');
      link.download = `sabai-qr-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svg.outerHTML);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrValue);
    toast.success('UPI string copied to clipboard');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My UPI QR Code',
          text: `Pay me using UPI: ${qrValue}`,
          url: qrValue
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopy();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>SabAI Pay QR Code</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; }
            .qr-container { text-align: center; }
            .qr-details { margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="data:image/svg+xml;base64,${btoa(document.getElementById('qr-code').outerHTML)}" />
            <div class="qr-details">
              <p>UPI ID: ${vpa}</p>
              ${name ? `<p>Name: ${name}</p>` : ''}
              ${amount ? `<p>Amount: ₹${amount}</p>` : ''}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="qr-generator-container"
    >
      <div className="qr-generator-card">
        <div className="qr-generator-header">
          <h1>QR Code Generator</h1>
          <p className="subtitle">Create your UPI QR code for payments</p>
        </div>

        <div className="qr-content">
          {/* Input Form */}
          <div className="qr-form">
            <Input
              label="UPI ID / VPA"
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              placeholder="e.g., name@okhdfcbank"
              icon={FaQrcode}
              required
            />

            <Input
              label="Name (Optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              icon={FaUser}
            />

            <Input
              label="Amount (Optional)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              icon={FaRupeeSign}
            />

            <Input
              label="Note (Optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Payment note"
            />

            <Button
              variant="primary"
              onClick={handleGenerate}
              fullWidth
              size="large"
            >
              Generate QR Code
            </Button>
          </div>

          {/* QR Code Display */}
          {generated && (
            <motion.div
              className="qr-display"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="qr-wrapper">
                <QRCode
                  id="qr-code"
                  value={qrValue}
                  size={250}
                  level="H"
                  className="qr-image"
                />
              </div>

              <div className="qr-details">
                <div className="qr-detail-item">
                  <span className="detail-label">UPI ID:</span>
                  <span className="detail-value">{vpa}</span>
                </div>
                {name && (
                  <div className="qr-detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{name}</span>
                  </div>
                )}
                {amount && (
                  <div className="qr-detail-item highlight">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value">₹{amount}</span>
                  </div>
                )}
              </div>

              <div className="qr-actions">
                <button className="qr-action-btn" onClick={handleDownload}>
                  <FaDownload />
                  <span>Download</span>
                </button>
                <button className="qr-action-btn" onClick={handleCopy}>
                  <FaCopy />
                  <span>Copy</span>
                </button>
                <button className="qr-action-btn" onClick={handleShare}>
                  <FaShare />
                  <span>Share</span>
                </button>
                <button className="qr-action-btn" onClick={handlePrint}>
                  <FaPrint />
                  <span>Print</span>
                </button>
              </div>

              <div className="qr-note">
                <MdQrCodeScanner />
                <p>Scan this QR code with any UPI app to make payment</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// QR Scanner Component (for scanning)
export const QRScanner = ({ onScan, onClose }) => {
  // This would integrate with a QR scanner library
  // For now, showing a placeholder
  return (
    <div className="qr-scanner-placeholder">
      <div className="scanner-preview">
        <div className="scanner-frame">
          <MdQrCodeScanner className="scanner-icon" />
          <p>Camera access would be requested here</p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;