// frontend/src/components/auth/Login.jsx
// COMPLETE FIXED VERSION

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { 
  FaLock, 
  FaGoogle, 
  FaFacebook,
  FaEye, 
  FaEyeSlash,
  FaArrowRight,
  FaShieldAlt,
  FaRupeeSign,
  FaCheckCircle
} from 'react-icons/fa';
import axios from 'axios';
import { MdPhoneAndroid } from 'react-icons/md';
import { SiRazorpay } from 'react-icons/si';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { login } = useAuth();
  const [step, setStep] = useState('login'); // login, otp
  const [formData, setFormData] = useState({
    phone_number: '',
    password: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [tempPhoneNumber, setTempPhoneNumber] = useState('');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  const rightPanelVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 100, damping: 20, delay: 0.2 }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.phone_number) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Enter a valid 10-digit Indian phone number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Handle password login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        phone_number: formData.phone_number,
        password: formData.password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        toast.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Invalid phone number or password');
      } else if (error.response?.status === 404) {
        toast.error('Account not found. Please register first.');
        navigate('/register');
      } else {
        toast.error(error.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Send OTP for login
  const sendLoginOTP = async () => {
    if (!formData.phone_number) {
      toast.error('Please enter your mobile number');
      return;
    }
    
    if (!/^[6-9]\d{9}$/.test(formData.phone_number)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    
    setLoading(true);
    
    try {
      // First check if user exists
      const checkResponse = await axios.post('http://localhost:5000/api/auth/check-phone', {
        phone_number: formData.phone_number
      });
      
      if (!checkResponse.data.exists) {
        toast.error('Account not found. Please register first.');
        navigate('/register');
        setLoading(false);
        return;
      }
      
      // Send OTP
      const otpResponse = await axios.post('http://localhost:5000/api/auth/send-otp', {
        phone_number: formData.phone_number,
        purpose: 'login'
      });
      
      if (otpResponse.data.success) {
        setTempPhoneNumber(formData.phone_number);
        setStep('otp');
        toast.success('OTP sent to your mobile number!');
        
        // Start timer
        setTimeLeft(60);
        setCanResend(false);
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(otpResponse.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and login
  const verifyOTPAndLogin = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
        toast.error('Please enter complete OTP');
        return;
    }
    
    setLoading(true);
    
    try {
        // First verify OTP
        const verifyResponse = await axios.post('http://localhost:5000/api/auth/verify-otp', {
            phone_number: tempPhoneNumber,
            otp: otpValue,
            purpose: 'login'
        });
        
        console.log('Verify OTP response:', verifyResponse.data);
        
        if (!verifyResponse.data.success) {
            toast.error(verifyResponse.data.message || 'Invalid OTP');
            setLoading(false);
            return;
        }
        
        // OTP verified, now login
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login-with-otp', {
            phone_number: tempPhoneNumber
        });
        
        console.log('Login response:', loginResponse.data);
        
        if (loginResponse.data.success) {
            localStorage.setItem('token', loginResponse.data.data.token);
            localStorage.setItem('user', JSON.stringify(loginResponse.data.data.user));
            toast.success('Login successful!');
            navigate('/dashboard');
        } else {
            toast.error(loginResponse.data.message || 'Login failed');
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        console.error('Error response:', error.response?.data);
        
        if (error.response?.status === 400) {
            toast.error(error.response.data.message || 'Invalid or expired OTP');
        } else if (error.response?.status === 404) {
            toast.error('Service unavailable. Please try password login.');
        } else {
            toast.error(error.response?.data?.message || 'Verification failed');
        }
    } finally {
        setLoading(false);
    }
};

  const handleResendOTP = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/send-otp', {
        phone_number: tempPhoneNumber,
        purpose: 'login'
      });
      
      if (response.data.success) {
        toast.success('OTP resent successfully!');
        setTimeLeft(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(response.data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend OTP');
    }
  };

  const handleSocialLogin = (provider) => {
    toast.success(`${provider} login coming soon!`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container login-container">
        {/* Left Panel - Login Form */}
        <motion.div 
          className="auth-card login-card"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="card-header">
            <motion.div 
              className="logo-container"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.img 
                src={darkMode ? "/images/merchants/sabailogodark1.png" : "/images/merchants/sabailogo.png"}
                alt="SabAI Pay" 
                className="auth-logo-image"
                initial={{ rotate: -10, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
              <Link to="/" className="login-brand">
                <div className="logo-wrapper">
                  <span className="logo-sab">
                    <span className="sa">Sa</span>
                    <span className="b">b</span>
                  </span>
                  <span className="logo-ai">AI</span>
                  <span className="logo-pay">Pay</span>
                </div>
              </Link>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Welcome Back
            </motion.h2>
            <motion.p 
              className="welcome-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Sign in to continue your secure payments journey
            </motion.p>
          </div>

          {step === 'login' ? (
            <motion.form 
              onSubmit={handlePasswordLogin}
              className="auth-form"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="input-group" variants={itemVariants}>
                <label>Mobile Number</label>
                <div className={`input-wrapper ${errors.phone_number ? 'error' : ''}`}>
                  <MdPhoneAndroid className="input-icon" />
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    disabled={loading}
                  />
                </div>
                {errors.phone_number && (
                  <span className="error-message">{errors.phone_number}</span>
                )}
              </motion.div>

              <motion.div className="input-group" variants={itemVariants}>
                <label>Password</label>
                <div className={`input-wrapper ${errors.password ? 'error' : ''}`}>
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <span className="error-message">{errors.password}</span>
                )}
              </motion.div>

              <motion.div className="form-options" variants={itemVariants}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="forgot-link" onClick={() => toast.info('Password reset coming soon!')}>
                  Forgot Password?
                </button>
              </motion.div>

              <div className="login-actions">
                <motion.button
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <div className="button-loader"></div>
                  ) : (
                    <>
                      Sign In with Password <FaArrowRight className="button-icon" />
                    </>
                  )}
                </motion.button>

                <motion.button
                  type="button"
                  className="auth-button secondary"
                  onClick={sendLoginOTP}
                  disabled={loading}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign In with OTP
                </motion.button>
              </div>

              <motion.div className="auth-divider" variants={itemVariants}>
                <span>or continue with</span>
              </motion.div>

              <motion.div className="social-login" variants={itemVariants}>
                <button
                  type="button"
                  className="social-btn google"
                  onClick={() => handleSocialLogin('Google')}
                  disabled={loading}
                >
                  <FaGoogle />
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  className="social-btn facebook"
                  onClick={() => handleSocialLogin('Facebook')}
                  disabled={loading}
                >
                  <FaFacebook />
                  <span>Facebook</span>
                </button>
              </motion.div>

              <motion.div className="auth-footer" variants={itemVariants}>
                <p>
                  New to SabAI Pay?{' '}
                  <Link to="/register" className="auth-link">
                    Create account
                  </Link>
                </p>
              </motion.div>
            </motion.form>
          ) : (
            <motion.div 
              className="otp-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="otp-phone-badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <MdPhoneAndroid />
                <span>{tempPhoneNumber}</span>
              </motion.div>

              <p className="otp-message">Enter the 6-digit verification code sent to your mobile</p>

              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <motion.input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="otp-input"
                    disabled={loading}
                    autoFocus={index === 0}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileFocus={{ scale: 1.05, borderColor: '#4f46e5' }}
                  />
                ))}
              </div>

              <div className={`otp-timer ${timeLeft < 10 ? 'warning' : ''}`}>
                <span>⏱️</span>
                <span>{formatTime(timeLeft)}</span>
              </div>

              <motion.button
                className="auth-button"
                onClick={verifyOTPAndLogin}
                disabled={loading || otp.join('').length !== 6}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <div className="button-loader"></div> : 'Verify & Sign In'}
              </motion.button>

              <div className="otp-resend-container">
                {canResend ? (
                  <motion.button
                    className="otp-resend"
                    onClick={handleResendOTP}
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Resend Code
                  </motion.button>
                ) : (
                  <p className="otp-wait">Resend code in {formatTime(timeLeft)}</p>
                )}
              </div>

              <motion.button
                type="button"
                className="back-to-login"
                onClick={() => {
                  setStep('login');
                  setOtp(['', '', '', '', '', '']);
                }}
                whileHover={{ scale: 1.02 }}
              >
                ← Back to Login
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* Right Panel - UPI/NPCI/Razorpay Info */}
        <motion.div 
          className="info-panel"
          variants={rightPanelVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="info-header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2>Powered by India's</h2>
            <h3>Most Trusted Payment Infrastructure</h3>
          </motion.div>

          <div className="payment-logos">
            <motion.div 
              className="logo-item"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src="/images/merchants/razorpay.png" alt="Razorpay" className="payment-logo-image" />
              <span>Razorpay</span>
            </motion.div>
            <motion.div 
              className="logo-item"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <img src="/images/merchants/upilogo.png" alt="UPI" className="payment-logo-image" />
              <span>UPI</span>
            </motion.div>
            <motion.div 
              className="logo-item"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <img src="/images/merchants/npcilogo.png" alt="NPCI" className="payment-logo-image" />
              <span>NPCI</span>
            </motion.div>
          </div>

          <div className="features-grid">
            <motion.div 
              className="feature-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <FaCheckCircle className="feature-check" />
              <div>
                <h4>Instant Settlements</h4>
                <p>Real-time payment processing</p>
              </div>
            </motion.div>

            <motion.div 
              className="feature-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <FaCheckCircle className="feature-check" />
              <div>
                <h4>Bank-Grade Security</h4>
                <p>256-bit encryption</p>
              </div>
            </motion.div>

            <motion.div 
              className="feature-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <FaCheckCircle className="feature-check" />
              <div>
                <h4>UPI AutoPay</h4>
                <p>Schedule recurring payments</p>
              </div>
            </motion.div>

            <motion.div 
              className="feature-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <FaCheckCircle className="feature-check" />
              <div>
                <h4>QR Code Payments</h4>
                <p>Scan & pay anywhere</p>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="security-badge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <FaShieldAlt />
            <span>PCI DSS Compliant • ISO 27001 Certified</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;