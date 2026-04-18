import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FaQrcode, 
  FaTimes, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaImage,
  FaMobile
} from 'react-icons/fa';
import { Html5Qrcode } from 'html5-qrcode';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import './UPIStyles.css';

const QRScanner = ({ isOpen, onClose, onScan }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [hasCamera, setHasCamera] = useState(true);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualVpa, setManualVpa] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check for cameras on mount
  useEffect(() => {
    if (isOpen) {
      checkCameras();
    }
    
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const checkCameras = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setHasCamera(false);
        setError('Camera access not supported in this browser');
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        setHasCamera(false);
        setError('No camera found on this device');
        return;
      }
      
      setCameras(videoDevices);
      
      // Prefer back camera
      const backCamera = videoDevices.find(camera => 
        camera.label.toLowerCase().includes('back') || 
        camera.label.toLowerCase().includes('environment')
      );
      
      const selectedId = backCamera?.deviceId || videoDevices[0].deviceId;
      setSelectedCamera(selectedId);
      startScanner(selectedId);
      
    } catch (err) {
      console.error('Camera error:', err);
      setHasCamera(false);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const startScanner = async (cameraId) => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }

      const html5QrCode = new Html5Qrcode('qr-reader', { verbose: false });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        cameraId,
        config,
        onScanSuccess,
        (errorMessage) => {
          // Ignore scanning errors
        }
      );
      
      setScanning(true);
      setError('');
      
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Failed to start camera. Please try manual entry.');
      setScanning(false);
    }
  };

  const onScanSuccess = (decodedText) => {
    console.log('QR Code detected:', decodedText);
    
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    setScannedData(decodedText);
    setScanSuccess(true);
    
    const upiData = parseUPIQrCode(decodedText);
    stopScanner();
    
    toast.success('QR code scanned successfully!');
    onScan(upiData.vpa || decodedText);
  };

  const parseUPIQrCode = (qrData) => {
    let vpa = qrData;

    try {
      if (qrData.toLowerCase().includes('upi://')) {
        const url = new URL(qrData);
        const params = new URLSearchParams(url.search);
        vpa = params.get('pa') || vpa;
      } else if (qrData.includes('@')) {
        const vpaMatch = qrData.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+/);
        if (vpaMatch) {
          vpa = vpaMatch[0];
        }
      }
    } catch (e) {
      console.log('Parse error:', e);
    }

    return { vpa };
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.log('Stop error:', err);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleCameraChange = (deviceId) => {
    setSelectedCamera(deviceId);
    startScanner(deviceId);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader', { verbose: false });
      const decodedText = await html5QrCode.scanFile(file, true);
      
      if (decodedText) {
        setScannedData(decodedText);
        setScanSuccess(true);
        
        const upiData = parseUPIQrCode(decodedText);
        await html5QrCode.clear();
        
        toast.success('QR code scanned from image!');
        onScan(upiData.vpa || decodedText);
      }
    } catch (err) {
      console.error('File scan error:', err);
      setError('Could not read QR code from image. Please try another image.');
    }
  };

  const handleManualSubmit = () => {
    if (manualVpa.trim()) {
      if (manualVpa.includes('@') || /^[6-9]\d{9}$/.test(manualVpa)) {
        onScan(manualVpa.trim());
        onClose();
      } else {
        toast.error('Please enter a valid UPI ID or mobile number');
      }
    }
  };

  const handleRetry = () => {
    setError('');
    setScanSuccess(false);
    setScannedData('');
    if (selectedCamera) {
      startScanner(selectedCamera);
    } else {
      checkCameras();
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="qr-scanner-overlay" onClick={handleClose}>
      <motion.div 
        className="qr-scanner-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <button className="qr-scanner-close" onClick={handleClose}>
          <FaTimes />
        </button>

        <h2 className="qr-scanner-title">
          <FaQrcode /> Scan QR Code
        </h2>

        {showManualInput ? (
          <div className="qr-scanner-manual">
            <h3>Enter UPI ID Manually</h3>
            <input
              type="text"
              value={manualVpa}
              onChange={(e) => setManualVpa(e.target.value)}
              placeholder="e.g., name@okhdfcbank"
              className="manual-input"
              autoFocus
            />
            <p className="manual-hint">Or enter 10-digit mobile number</p>
            <div className="manual-actions">
              <Button variant="secondary" onClick={() => setShowManualInput(false)}>
                Back
              </Button>
              <Button variant="primary" onClick={handleManualSubmit}>
                Submit
              </Button>
            </div>
          </div>
        ) : scanSuccess ? (
          <div className="qr-scanner-success">
            <FaCheckCircle className="success-icon" />
            <h3>QR Code Scanned!</h3>
            <p className="scanned-data">{scannedData}</p>
            <Button variant="primary" onClick={handleClose}>
              Continue
            </Button>
          </div>
        ) : !hasCamera ? (
          <div className="qr-scanner-error">
            <FaExclamationTriangle className="error-icon" />
            <p>{error || 'No camera detected'}</p>
            <div className="qr-scanner-error-actions">
              <Button variant="primary" onClick={() => setShowManualInput(true)}>
                <FaMobile /> Enter Manually
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <Button variant="secondary" onClick={() => fileInputRef.current.click()}>
                <FaImage /> Upload Image
              </Button>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {cameras.length > 1 && (
              <div className="qr-scanner-controls">
                <select 
                  value={selectedCamera} 
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="camera-select"
                >
                  {cameras.map(camera => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="qr-scanner-viewport">
              <div id="qr-reader" className="qr-reader-container"></div>
              <div className="qr-scanner-frame">
                <div className="frame-corner top-left"></div>
                <div className="frame-corner top-right"></div>
                <div className="frame-corner bottom-left"></div>
                <div className="frame-corner bottom-right"></div>
              </div>
            </div>

            {!scanning && (
              <div className="qr-scanner-loading">
                <div className="loading-spinner-small"></div>
                <p>Starting camera...</p>
              </div>
            )}

            {error && (
              <div className="qr-scanner-error-message">
                <FaExclamationTriangle />
                <p>{error}</p>
                <button onClick={handleRetry} className="retry-btn">
                  Retry
                </button>
              </div>
            )}

            <div className="qr-scanner-footer">
              <p className="qr-scanner-instruction">
                Position QR code within the frame
              </p>
              
              <div className="qr-scanner-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <Button variant="outline" onClick={() => fileInputRef.current.click()}>
                  <FaImage /> Upload QR
                </Button>
                <Button variant="outline" onClick={() => setShowManualInput(true)}>
                  <FaMobile /> Manual
                </Button>
                <Button variant="danger" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default QRScanner;