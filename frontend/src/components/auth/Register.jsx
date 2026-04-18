// frontend/src/components/auth/Register.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaGoogle, 
  FaFacebook,
  FaEye, 
  FaEyeSlash,
  FaArrowRight,
  FaShieldAlt,
  FaRupeeSign,
  FaExchangeAlt,
  FaCheckCircle,
  FaGift,
  darkMode,
  FaMobile
} from 'react-icons/fa';
import { MdPhone, MdVerified } from 'react-icons/md';
import { SiRazorpay } from 'react-icons/si';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { register } = useAuth();
  const [step, setStep] = useState('register');
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);

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

  const stepIndicatorVariants = {
    active: { scale: 1, backgroundColor: '#4f46e5', color: '#fff' },
    completed: { scale: 1, backgroundColor: '#10b981', color: '#fff' },
    inactive: { scale: 0.9, backgroundColor: '#e0e0e0', color: '#666' }
  };

  // Password strength checker
  useEffect(() => {
    let strength = 0;
    const password = formData.password;
    
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 15;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    
    setPasswordStrength(strength);
  }, [formData.password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return '#ef4444';
    if (passwordStrength < 60) return '#f59e0b';
    if (passwordStrength < 80) return '#3b82f6';
    return '#10b981';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 30) return 'Weak';
    if (passwordStrength < 60) return 'Fair';
    if (passwordStrength < 80) return 'Good';
    return 'Strong';
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.name) {
        newErrors.name = 'Full name is required';
      } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
        newErrors.name = 'Name can only contain letters and spaces';
      } else if (formData.name.length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }
      
      if (!formData.phone_number) {
        newErrors.phone_number = 'Phone number is required';
      } else if (!/^[6-9]\d{9}$/.test(formData.phone_number)) {
        newErrors.phone_number = 'Enter a valid 10-digit Indian phone number';
      }
      
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Enter a valid email address';
      }
    }
    
    if (currentStep === 2) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      
      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }
    
    if (currentStep === 3 && !acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
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

  const handleNextStep = () => {
    if (validateForm()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 'register') {
        if (!validateForm()) return;
        
        setLoading(true);
        
        try {
            console.log('Checking phone number:', formData.phone_number);
            
            const checkResponse = await fetch('http://localhost:5000/api/auth/check-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: formData.phone_number })
            });
            
            const checkData = await checkResponse.json();
            console.log('Check phone response:', checkData);
            
            // Check if the response indicates user exists
            if (checkData.success && checkData.exists === true) {
                toast.error('Phone number already registered. Please login instead.');
                setLoading(false);
                return;
            }
            
            // If check failed or user doesn't exist, proceed with OTP
            const otpResponse = await fetch('http://localhost:5000/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    phone_number: formData.phone_number,
                    purpose: 'register'
                })
            });

            const otpData = await otpResponse.json();
            
            if (otpData.success) {
                toast.success('OTP sent successfully!');
                setStep('otp');
                localStorage.setItem('register_data', JSON.stringify(formData));
                
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
                toast.error(otpData.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    } else {
        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            toast.error('Please enter complete OTP');
            return;
        }

        setLoading(true);

        try {
            // Get saved registration data
            const savedData = JSON.parse(localStorage.getItem('register_data') || '{}');
            const phoneNumber = savedData.phone_number || formData.phone_number;
            
            // Verify OTP
            const verifyResponse = await fetch('http://localhost:5000/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    otp: otpValue,
                    purpose: 'register'
                })
            });

            const verifyData = await verifyResponse.json();
            console.log('Verify OTP response:', verifyData);

            if (verifyData.success) {
                // Complete registration
                const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(savedData)
                });

                const registerData = await registerResponse.json();
                console.log('Register response:', registerData);

                if (registerData.success) {
                    localStorage.setItem('token', registerData.data.token);
                    localStorage.setItem('user', JSON.stringify(registerData.data.user));
                    toast.success('Registration successful!');
                    navigate('/dashboard');
                } else {
                    toast.error(registerData.message || 'Registration failed');
                }
            } else {
                toast.error(verifyData.message || 'Invalid OTP');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            toast.error('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }
};

  const handleResendOTP = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone_number: formData.phone_number,
          purpose: 'register'
        })
      });

      const data = await response.json();
      
      if (data.success) {
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
        toast.error(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend OTP');
    }
  };

  const handleSocialRegister = (provider) => {
    toast.success(`${provider} registration coming soon!`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="auth-wrapper register-wrapper">
      {/* Background Pattern */}
      <div className="auth-pattern">
        <div className="pattern-grid"></div>
        <div className="pattern-dots"></div>
      </div>

      <div className="auth-container register-container">
        {/* Left Panel - Registration Form */}
        <motion.div 
          className="auth-card register-card"
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
      const parent = e.target.parentElement;
      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'logo-emoji';
      emojiSpan.textContent = '⟁';
      parent.insertBefore(emojiSpan, parent.firstChild);
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
              Create your account
            </motion.h2>
            <motion.p 
              className="welcome-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Get started with secure UPI payments
            </motion.p>
          </div>

          {step === 'register' ? (
            <>
              {/* Step Indicators */}
              <motion.div 
                className="step-indicators"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {[1, 2, 3].map((stepNum) => (
                  <motion.div
                    key={stepNum}
                    className={`step-indicator ${currentStep === stepNum ? 'active' : ''} ${currentStep > stepNum ? 'completed' : ''}`}
                    animate={
                      currentStep === stepNum ? 'active' :
                      currentStep > stepNum ? 'completed' : 'inactive'
                    }
                    variants={stepIndicatorVariants}
                  >
                    {currentStep > stepNum ? '✓' : stepNum}
                  </motion.div>
                ))}
              </motion.div>

              <motion.form 
                onSubmit={handleSubmit} 
                className="auth-form"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key={currentStep}
              >
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div className="input-group" variants={itemVariants}>
                        <label>Full Name</label>
                        <div className={`input-wrapper ${errors.name ? 'error' : ''}`}>
                          <FaUser className="input-icon" />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            disabled={loading}
                          />
                        </div>
                        {errors.name && <span className="error-message">{errors.name}</span>}
                      </motion.div>

                      <motion.div className="input-group" variants={itemVariants}>
                        <label>Mobile Number</label>
                        <div className={`input-wrapper ${errors.phone_number ? 'error' : ''}`}>
                          <MdPhone className="input-icon" />
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
                        {errors.phone_number && <span className="error-message">{errors.phone_number}</span>}
                      </motion.div>

                      <motion.div className="input-group" variants={itemVariants}>
                        <label>Email Address</label>
                        <div className={`input-wrapper ${errors.email ? 'error' : ''}`}>
                          <FaEnvelope className="input-icon" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            disabled={loading}
                          />
                        </div>
                        {errors.email && <span className="error-message">{errors.email}</span>}
                      </motion.div>

                      <motion.button
                        type="button"
                        className="auth-button next-btn"
                        onClick={handleNextStep}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Continue <FaArrowRight className="button-icon" />
                      </motion.button>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div className="input-group" variants={itemVariants}>
                        <label>Password</label>
                        <div className={`input-wrapper ${errors.password ? 'error' : ''}`}>
                          <FaLock className="input-icon" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
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
                        {formData.password && (
                          <motion.div 
                            className="password-strength"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="strength-bars">
                              {[1, 2, 3, 4].map((bar) => (
                                <div
                                  key={bar}
                                  className="strength-bar"
                                  style={{
                                    backgroundColor: bar * 25 <= passwordStrength 
                                      ? getPasswordStrengthColor() 
                                      : '#e0e0e0',
                                    width: '25%'
                                  }}
                                />
                              ))}
                            </div>
                            <span 
                              className="strength-text"
                              style={{ color: getPasswordStrengthColor() }}
                            >
                              {getPasswordStrengthText()} password
                            </span>
                          </motion.div>
                        )}
                        {errors.password && <span className="error-message">{errors.password}</span>}
                      </motion.div>

                      <motion.div className="input-group" variants={itemVariants}>
                        <label>Confirm Password</label>
                        <div className={`input-wrapper ${errors.confirm_password ? 'error' : ''}`}>
                          <FaLock className="input-icon" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        {errors.confirm_password && <span className="error-message">{errors.confirm_password}</span>}
                      </motion.div>

                      <div className="step-buttons">
                        <motion.button
                          type="button"
                          className="auth-button secondary"
                          onClick={handlePrevStep}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Back
                        </motion.button>
                        <motion.button
                          type="button"
                          className="auth-button"
                          onClick={handleNextStep}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Continue <FaArrowRight className="button-icon" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div 
                        className="welcome-bonus"
                        variants={itemVariants}
                      >
                        <FaGift className="bonus-icon" />
                        <div>
                          <h4>Welcome Bonus!</h4>
                          <p>Get 50 SabAI Coins on signup</p>
                        </div>
                      </motion.div>

                      <motion.div className="terms-section" variants={itemVariants}>
                        <label className="checkbox-label terms">
                          <input
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                          />
                          <span>
                            I agree to the <a href="/terms">Terms of Service</a> and{' '}
                            <a href="/privacy">Privacy Policy</a>
                          </span>
                        </label>
                        {errors.terms && <span className="error-message">{errors.terms}</span>}
                      </motion.div>

                      <div className="step-buttons">
                        <motion.button
                          type="button"
                          className="auth-button secondary"
                          onClick={handlePrevStep}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Back
                        </motion.button>
                        <motion.button
                          type="submit"
                          className="auth-button"
                          disabled={loading || !acceptTerms}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {loading ? <div className="button-loader"></div> : 'Create Account'}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.form>

              {currentStep === 1 && (
                <>
                  <motion.div 
                    className="auth-divider"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <span>or continue with</span>
                  </motion.div>

                  <motion.div 
                    className="social-login"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <button
                      type="button"
                      className="social-btn google"
                      onClick={() => handleSocialRegister('Google')}
                      disabled={loading}
                    >
                      <FaGoogle />
                      <span>Google</span>
                    </button>
                    <button
                      type="button"
                      className="social-btn facebook"
                      onClick={() => handleSocialRegister('Facebook')}
                      disabled={loading}
                    >
                      <FaFacebook />
                      <span>Facebook</span>
                    </button>
                  </motion.div>

                  <motion.div 
                    className="auth-footer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                  >
                    <p>
                      Already have an account?{' '}
                      <Link to="/login" className="auth-link">
                        Sign in
                      </Link>
                    </p>
                  </motion.div>
                </>
              )}
            </>
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
                <MdPhone />
                <span>{formData.phone_number}</span>
              </motion.div>

              <p className="otp-message">Enter the 6-digit verification code</p>

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
                onClick={handleSubmit}
                disabled={loading || otp.join('').length !== 6}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <div className="button-loader"></div> : 'Verify & Complete'}
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
            </motion.div>
          )}
        </motion.div>

        {/* Right Panel - UPI/NPCI/Razorpay Info */}
        <motion.div 
          className="info-panel register-info"
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
            <h2>Join India's</h2>
            <h3>Fastest Growing Payment Platform</h3>
          </motion.div>

          <div className="payment-logos">
            <motion.div 
              className="logo-item"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              <img 
      src="/images/merchants/razorpay.png" 
      alt="Razorpay" 
      className="payment-logo-image"
    />
              <span>Razorpay</span>
            </motion.div>
            <motion.div 
              className="logo-item"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5 
              }}
            >
              <img 
      src="/images/merchants/upilogo.png" 
      alt="UPI" 
      className="payment-logo-image"
    />
              <span>Unified Payments </span>
    <span1>Interface </span1>
            </motion.div>
            <motion.div 
              className="logo-item"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1 
              }}
            >
              <img 
      src="/images/merchants/npcilogo.png" 
      alt="NPCI" 
      className="payment-logo-image"
    />
              <span>National Payments</span>
    <span1>Corporation of India</span1>
            </motion.div>
          </div>

          <div className="benefits-grid">
            <motion.div 
              className="benefit-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <MdVerified className="benefit-check" />
              <div>
                <h4>Instant Account Setup</h4>
                <p>Go live in minutes</p>
              </div>
            </motion.div>

            <motion.div 
              className="benefit-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <MdVerified className="benefit-check" />
              <div>
                <h4>SabAI Assistant</h4>
                <p>Easy Agent Orders through AI</p>
              </div>
            </motion.div>

            <motion.div 
              className="benefit-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <MdVerified className="benefit-check" />
              <div>
                <h4>Reserve Pay</h4>
                <p>Set Limit, Pay without Pin</p>
              </div>
            </motion.div>

            <motion.div 
              className="benefit-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <MdVerified className="benefit-check" />
              <div>
                <h4>UPI AutoPay</h4>
                <p>Schedule payments</p>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="testimonial-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="testimonial-content">
              "Happy to go on with SabAI Assistant, It's easier! one click order tasty Food!!"
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">RK</div>
              <div>
                <strong>Rahul Kumar</strong>
                <span>Merchant since 2026</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="security-badge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <FaShieldAlt />
            <span>RBI Regulated • PCI DSS Compliant</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;