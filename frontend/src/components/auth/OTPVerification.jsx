// frontend/src/components/auth/OTPVerification.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaMobile, FaRedo, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import './Auth.css';

const OTPVerification = ({ phoneNumber, onBack, onSuccess }) => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);

  const displayPhone = phoneNumber || localStorage.getItem('login_phone') || '9876543210';

  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.split('');
      const newOtp = [...otp];
      digits.forEach((digit, index) => {
        if (index < 6) newOtp[index] = digit;
      });
      setOtp(newOtp);
      
      // Focus last filled or next empty
      const lastFilledIndex = Math.min(digits.length, 5);
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: displayPhone,
          otp: otpValue
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        
        if (data.data.has_profiles) {
          // Show Google account picker
          setTimeout(() => {
            onSuccess?.();
          }, 1500);
        } else {
          // New user - show Google account picker for registration
          setTimeout(() => {
            onSuccess?.();
          }, 1500);
        }
      } else {
        setError(data.message || 'Invalid OTP');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setTimeLeft(60);
    setOtp(['', '', '', '', '', '']);
    setError('');
    
    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: displayPhone
        })
      });
    } catch (error) {
      console.error('Failed to resend OTP');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (success) {
    return (
      <motion.div 
        className="otp-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="otp-card">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <FaCheckCircle className="success-icon" />
          </motion.div>
          <h2>Verified!</h2>
          <p>Redirecting you to complete setup...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="otp-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="otp-card">
        <button className="back-button" onClick={onBack}>
          <FaArrowLeft /> Back
        </button>

        <div className="otp-icon">
          <FaMobile />
        </div>

        <h2>Verify OTP</h2>
        <p className="otp-message">
          We've sent a 6-digit code to
        </p>

        <div className="otp-phone-badge">
          <FaMobile />
          <span>{displayPhone}</span>
        </div>

        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="otp-input"
              disabled={loading}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {error && (
          <motion.p 
            className="error-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}

        <div className={`otp-timer ${timeLeft < 10 ? 'warning' : ''}`}>
          <FaClock className="otp-timer-icon" />
          <span>{formatTime(timeLeft)}</span>
        </div>

        <button
          className="auth-button"
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
        >
          {loading ? <div className="button-loader"></div> : 'Verify & Continue'}
        </button>

        <div className="otp-resend-container">
          {canResend ? (
            <button
              className="otp-resend"
              onClick={handleResend}
              disabled={loading}
            >
              <FaRedo /> Resend OTP
            </button>
          ) : (
            <p className="otp-wait">
              Didn't receive code? Wait {formatTime(timeLeft)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default OTPVerification;