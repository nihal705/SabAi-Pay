// frontend/src/components/settings/Security.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaLock,
  FaMobile,
  FaFingerprint,
  FaBell,
  FaShieldAlt,
  FaHistory,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
  FaKey,
  FaClock,
  FaMapMarkerAlt,
  FaLaptop,
  FaGlobe,
  FaExclamationTriangle,
  FaSpinner,
  FaArrowRight
} from 'react-icons/fa';
import { MdDevices, MdSecurity, MdVerifiedUser } from 'react-icons/md';
import { IoPhonePortraitOutline, IoTabletLandscapeOutline } from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './SettingsStyles.css';

const Security = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [securityTips, setSecurityTips] = useState([]);
  const [securityScore, setSecurityScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState({});
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState({});
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    biometricLogin: false,
    transactionNotifications: true,
    loginAlerts: true,
    deviceHistory: true,
    emailVerified: user?.email ? true : false,
    phoneVerified: user?.phone_number ? true : false
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  // Load security settings from localStorage/backend
  useEffect(() => {
    loadSecuritySettings();
    fetchActiveSessions();
  }, []);

  // Calculate score whenever settings change
  useEffect(() => {
    calculateSecurityScore();
  }, [securitySettings, passwordStrength]);

  const loadSecuritySettings = () => {
    const saved = localStorage.getItem('securitySettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSecuritySettings({
        ...parsed,
        emailVerified: user?.email ? true : false,
        phoneVerified: user?.phone_number ? true : false
      });
    }
  };

  const saveSecuritySettings = (newSettings) => {
    localStorage.setItem('securitySettings', JSON.stringify(newSettings));
    setSecuritySettings(newSettings);
  };

  const fetchActiveSessions = async () => {
    setSessionsLoading(true);
    try {
      // Mock data for demo
      setTimeout(() => {
        setSessions([
          {
            id: 1,
            device: 'Chrome on Windows',
            device_type: 'desktop',
            location: 'Mumbai, India',
            ip: '192.168.1.1',
            last_active: '2 hours ago',
            current: true,
            icon: FaLaptop
          },
          {
            id: 2,
            device: 'Safari on iPhone',
            device_type: 'mobile',
            location: 'Delhi, India',
            ip: '192.168.1.2',
            last_active: '3 days ago',
            current: false,
            icon: IoPhonePortraitOutline
          }
        ]);
        setSessionsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessionsLoading(false);
    }
  };

  // Correct security score calculation
  const calculateSecurityScore = () => {
    let score = 0;
    const breakdown = {};

    // Password Strength (25 points)
    const passwordScore = passwordStrength.score;
    if (passwordScore >= 5) {
      score += 25;
      breakdown.passwordStrength = { points: 25, status: 'strong', label: 'Password Strength' };
    } else if (passwordScore >= 4) {
      score += 20;
      breakdown.passwordStrength = { points: 20, status: 'good', label: 'Password Strength' };
    } else if (passwordScore >= 3) {
      score += 15;
      breakdown.passwordStrength = { points: 15, status: 'fair', label: 'Password Strength' };
    } else if (passwordScore >= 2) {
      score += 10;
      breakdown.passwordStrength = { points: 10, status: 'weak', label: 'Password Strength' };
    } else {
      score += 5;
      breakdown.passwordStrength = { points: 5, status: 'very-weak', label: 'Password Strength' };
    }

    // Two-Factor Authentication (20 points)
    if (securitySettings.twoFactorAuth) {
      score += 20;
      breakdown.twoFactorAuth = { points: 20, status: 'enabled', label: 'Two-Factor Authentication' };
    } else {
      breakdown.twoFactorAuth = { points: 0, status: 'disabled', label: 'Two-Factor Authentication' };
    }

    // Biometric Login (15 points)
    if (securitySettings.biometricLogin) {
      score += 15;
      breakdown.biometricLogin = { points: 15, status: 'enabled', label: 'Biometric Login' };
    } else {
      breakdown.biometricLogin = { points: 0, status: 'disabled', label: 'Biometric Login' };
    }

    // Login Alerts (10 points)
    if (securitySettings.loginAlerts) {
      score += 10;
      breakdown.loginAlerts = { points: 10, status: 'enabled', label: 'Login Alerts' };
    } else {
      breakdown.loginAlerts = { points: 0, status: 'disabled', label: 'Login Alerts' };
    }

    // Transaction Notifications (10 points)
    if (securitySettings.transactionNotifications) {
      score += 10;
      breakdown.transactionNotifications = { points: 10, status: 'enabled', label: 'Transaction Notifications' };
    } else {
      breakdown.transactionNotifications = { points: 0, status: 'disabled', label: 'Transaction Notifications' };
    }

    // Device History (10 points)
    if (securitySettings.deviceHistory) {
      score += 10;
      breakdown.deviceHistory = { points: 10, status: 'enabled', label: 'Device History' };
    } else {
      breakdown.deviceHistory = { points: 0, status: 'disabled', label: 'Device History' };
    }

    // Email Verified (5 points)
    if (securitySettings.emailVerified) {
      score += 5;
      breakdown.emailVerified = { points: 5, status: 'verified', label: 'Email Verified' };
    } else {
      breakdown.emailVerified = { points: 0, status: 'unverified', label: 'Email Verified' };
    }

    // Phone Verified (5 points)
    if (securitySettings.phoneVerified) {
      score += 5;
      breakdown.phoneVerified = { points: 5, status: 'verified', label: 'Phone Verified' };
    } else {
      breakdown.phoneVerified = { points: 0, status: 'unverified', label: 'Phone Verified' };
    }

    setSecurityScore(score);
    setScoreBreakdown(breakdown);
  };

  const getScoreLevel = () => {
    if (securityScore >= 80) return { text: 'Excellent', color: '#10b981' };
    if (securityScore >= 60) return { text: 'Good', color: '#3b82f6' };
    if (securityScore >= 40) return { text: 'Fair', color: '#f59e0b' };
    return { text: 'Needs Improvement', color: '#ef4444' };
  };

  const fetchSecurityTips = async () => {
    setTipsLoading(true);
    try {
      // Mock API response with personalized tips based on security score
      setTimeout(() => {
        const allTips = [
          {
            id: 1,
            title: 'Enable Two-Factor Authentication',
            description: '2FA adds an extra layer of security by requiring a verification code in addition to your password.',
            priority: !securitySettings.twoFactorAuth ? 'high' : 'low',
            category: 'authentication',
            icon: MdVerifiedUser,
            action: 'Enable Now',
            impact: '+20 points'
          },
          {
            id: 2,
            title: 'Strengthen Your Password',
            description: 'Your password strength is currently weak. Use a mix of uppercase, lowercase, numbers, and special characters.',
            priority: passwordStrength.score < 3 ? 'high' : 'low',
            category: 'password',
            icon: FaKey,
            action: 'Change Password',
            impact: 'Up to +25 points'
          },
          {
            id: 3,
            title: 'Enable Biometric Login',
            description: 'Use fingerprint or face recognition for quick and secure access to your account.',
            priority: !securitySettings.biometricLogin ? 'medium' : 'low',
            category: 'biometric',
            icon: FaFingerprint,
            action: 'Enable',
            impact: '+15 points'
          },
          {
            id: 4,
            title: 'Turn On Login Alerts',
            description: 'Get instant notifications when someone logs into your account from a new device.',
            priority: !securitySettings.loginAlerts ? 'medium' : 'low',
            category: 'alerts',
            icon: FaBell,
            action: 'Enable',
            impact: '+10 points'
          },
          {
            id: 5,
            title: 'Review Active Sessions',
            description: 'Check and remove unrecognized devices that have access to your account.',
            priority: 'medium',
            category: 'sessions',
            icon: FaLaptop,
            action: 'Review Now',
            impact: 'Security Best Practice'
          },
          {
            id: 6,
            title: 'Verify Your Email',
            description: 'A verified email helps us recover your account if you ever get locked out.',
            priority: !securitySettings.emailVerified ? 'high' : 'low',
            category: 'verification',
            icon: FaCheckCircle,
            action: 'Verify Now',
            impact: '+5 points'
          },
          {
            id: 7,
            title: 'Enable Transaction Notifications',
            description: 'Get alerts for every transaction made from your account.',
            priority: !securitySettings.transactionNotifications ? 'medium' : 'low',
            category: 'notifications',
            icon: FaBell,
            action: 'Enable',
            impact: '+10 points'
          },
          {
            id: 8,
            title: 'Keep Device History Enabled',
            description: 'Track all devices that access your account for better security monitoring.',
            priority: !securitySettings.deviceHistory ? 'medium' : 'low',
            category: 'monitoring',
            icon: FaHistory,
            action: 'Enable',
            impact: '+10 points'
          }
        ];

        // Filter and prioritize tips based on user's security status
        const personalizedTips = allTips
          .filter(tip => {
            if (tip.category === 'authentication' && securitySettings.twoFactorAuth) return false;
            if (tip.category === 'biometric' && securitySettings.biometricLogin) return false;
            if (tip.category === 'alerts' && securitySettings.loginAlerts) return false;
            if (tip.category === 'notifications' && securitySettings.transactionNotifications) return false;
            if (tip.category === 'monitoring' && securitySettings.deviceHistory) return false;
            if (tip.category === 'verification' && securitySettings.emailVerified) return false;
            if (tip.category === 'password' && passwordStrength.score >= 4) return false;
            return true;
          })
          .sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          });

        setSecurityTips(personalizedTips);
        setTipsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Failed to fetch security tips:', error);
      toast.error('Failed to load security tips');
      setTipsLoading(false);
    }
  };

  const handleViewTips = () => {
    fetchSecurityTips();
    setShowTipsModal(true);
  };

  const calculatePasswordStrength = (password) => {
    const strength = {
      score: 0,
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password)
    };
    
    strength.score = Object.values(strength).filter(v => v === true).length;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthText = () => {
    const score = passwordStrength.score;
    if (score < 2) return 'Weak';
    if (score < 3) return 'Fair';
    if (score < 4) return 'Good';
    if (score < 5) return 'Strong';
    return 'Very Strong';
  };

  const getPasswordStrengthColor = () => {
    const score = passwordStrength.score;
    if (score < 2) return '#ef4444';
    if (score < 3) return '#f59e0b';
    if (score < 4) return '#3b82f6';
    if (score < 5) return '#10b981';
    return '#10b981';
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (name === 'new_password') {
      calculatePasswordStrength(value);
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = () => {
    const newErrors = {};
    
    if (!passwordData.current_password) {
      newErrors.current_password = 'Current password is required';
    }
    if (!passwordData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async () => {
    if (!validatePassword()) return;
    
    setLoading(true);
    
    try {
      // Simulate API call
      setTimeout(() => {
        toast.success('Password updated successfully!');
        setShowPasswordModal(false);
        resetPasswordData();
        setLoading(false);
      }, 1000);
    } catch (error) {
      toast.error('Failed to update password');
      setLoading(false);
    }
  };

  // Fixed toggle function - single toast
  const handleToggle = (key) => {
    const newValue = !securitySettings[key];
    const newSettings = { ...securitySettings, [key]: newValue };
    
    // Save and update state
    saveSecuritySettings(newSettings);
    
    // Single toast notification
    toast.success(`${key.split(/(?=[A-Z])/).join(' ')} ${newValue ? 'enabled' : 'disabled'}`);
  };

  const handleLogoutDevice = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    toast.success('Device logged out successfully');
  };

  const handleLogoutAllDevices = () => {
    setSessions(prev => prev.filter(s => s.current));
    toast.success('All other devices logged out');
  };

  const resetPasswordData = () => {
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setErrors({});
    setPasswordStrength({
      score: 0,
      hasMinLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecialChar: false
    });
  };

  const handleTipAction = (tip) => {
    setShowTipsModal(false);
    
    if (tip.category === 'password') {
      setShowPasswordModal(true);
    } else if (tip.category === 'authentication') {
      handleToggle('twoFactorAuth');
    } else if (tip.category === 'biometric') {
      handleToggle('biometricLogin');
    } else if (tip.category === 'alerts') {
      handleToggle('loginAlerts');
    } else if (tip.category === 'notifications') {
      handleToggle('transactionNotifications');
    } else if (tip.category === 'monitoring') {
      handleToggle('deviceHistory');
    } else if (tip.category === 'verification') {
      toast.success('Redirecting to verification...');
    } else if (tip.category === 'sessions') {
      setActiveTab('devices');
    }
  };

  const securityOptions = [
    {
      id: 'password',
      title: 'Password',
      description: 'Update your account password regularly for better security',
      icon: FaKey,
      action: () => setShowPasswordModal(true),
      status: passwordStrength.score >= 4 ? 'enabled' : 'warning',
      statusText: passwordStrength.score >= 4 ? 'Strong' : 'Weak',
      color: '#10b981'
    },
    {
      id: '2fa',
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      icon: MdVerifiedUser,
      toggle: true,
      key: 'twoFactorAuth',
      status: securitySettings.twoFactorAuth ? 'enabled' : 'disabled',
      color: '#f59e0b'
    },
    {
      id: 'biometric',
      title: 'Biometric Login',
      description: 'Use fingerprint or face recognition for quick access',
      icon: FaFingerprint,
      toggle: true,
      key: 'biometricLogin',
      status: securitySettings.biometricLogin ? 'enabled' : 'disabled',
      color: '#8b5cf6'
    },
    {
      id: 'alerts',
      title: 'Login Alerts',
      description: 'Get notified on new device logins',
      icon: FaBell,
      toggle: true,
      key: 'loginAlerts',
      status: securitySettings.loginAlerts ? 'enabled' : 'disabled',
      color: '#14b8a6'
    },
    {
      id: 'notifications',
      title: 'Transaction Notifications',
      description: 'Get instant alerts for all transactions',
      icon: FaBell,
      toggle: true,
      key: 'transactionNotifications',
      status: securitySettings.transactionNotifications ? 'enabled' : 'disabled',
      color: '#ec4899'
    },
    {
      id: 'history',
      title: 'Device History',
      description: 'Keep track of all devices that access your account',
      icon: FaHistory,
      toggle: true,
      key: 'deviceHistory',
      status: securitySettings.deviceHistory ? 'enabled' : 'disabled',
      color: '#6366f1'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      action: 'Login',
      device: 'Chrome on Windows',
      location: 'Mumbai, India',
      time: '2 hours ago',
      status: 'success',
      icon: FaCheckCircle,
      color: '#10b981'
    },
    {
      id: 2,
      action: 'Password Changed',
      device: 'Firefox on Mac',
      location: 'Delhi, India',
      time: '3 days ago',
      status: 'success',
      icon: FaCheckCircle,
      color: '#10b981'
    },
    {
      id: 3,
      action: 'Failed Login Attempt',
      device: 'Safari on iPhone',
      location: 'Bangalore, India',
      time: '5 days ago',
      status: 'failed',
      icon: FaTimesCircle,
      color: '#ef4444'
    }
  ];

  const scoreLevel = getScoreLevel();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="security-settings"
    >
      <div className="settings-header">
        <h2>Security Settings</h2>
      </div>

      {/* Security Score Card - Now dynamic */}
      <motion.div 
        className="security-score-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ borderTop: `4px solid ${scoreLevel.color}` }}
      >
        <div className="score-left">
          <div className="score-circle" style={{ borderColor: scoreLevel.color }}>
            <span className="score-value" style={{ color: scoreLevel.color }}>{securityScore}</span>
          </div>
          <div className="score-info">
            <h3 style={{ color: scoreLevel.color }}>{scoreLevel.text} Security</h3>
            <p>Your account security score is {securityScore}/100</p>
            <div className="score-details">
              {Object.entries(scoreBreakdown).map(([key, value]) => (
                value.points > 0 && (
                  <span key={key} className="score-detail">
                    <FaCheckCircle style={{ color: '#10b981' }} /> {value.label}
                  </span>
                )
              ))}
            </div>
          </div>
        </div>
        <button 
          className="view-tips-btn"
          onClick={handleViewTips}
          style={{ backgroundColor: scoreLevel.color }}
        >
          View Security Tips
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="security-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <MdSecurity /> Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          <MdDevices /> Devices
        </button>
        <button
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <FaHistory /> Activity
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="security-options-grid"
          >
            {securityOptions.map((option, index) => (
              <motion.div
                key={option.id}
                className="security-option-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <div className="option-icon" style={{ backgroundColor: `${option.color}20` }}>
                  <option.icon style={{ color: option.color }} />
                </div>
                <div className="option-content">
                  <h4>{option.title}</h4>
                  <p>{option.description}</p>
                </div>
                <div className="option-action">
                  {option.toggle ? (
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={securitySettings[option.key]}
                        onChange={() => handleToggle(option.key)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  ) : (
                    <button
                      className="configure-btn"
                      onClick={option.action}
                      style={{ backgroundColor: option.color }}
                    >
                      Configure
                    </button>
                  )}
                  <span className={`status-badge ${option.status}`}>
                    {option.statusText || option.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'devices' && (
          <motion.div
            key="devices"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="devices-section"
          >
            <div className="section-header">
              <h3>Active Sessions</h3>
              {sessions.length > 1 && (
                <button 
                  className="logout-all-btn"
                  onClick={handleLogoutAllDevices}
                >
                  Logout All Devices
                </button>
              )}
            </div>

            {sessionsLoading ? (
              <div className="loading-sessions">
                <FaSpinner className="spinner" /> Loading sessions...
              </div>
            ) : (
              <div className="sessions-list">
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    className={`session-item ${session.current ? 'current' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="session-icon">
                      <session.icon />
                    </div>
                    <div className="session-details">
                      <div className="session-header">
                        <h4>{session.device}</h4>
                        {session.current && (
                          <span className="current-badge">Current Device</span>
                        )}
                      </div>
                      <div className="session-meta">
                        <span className="session-location">
                          <FaMapMarkerAlt /> {session.location}
                        </span>
                        <span className="session-ip">
                          <FaGlobe /> {session.ip}
                        </span>
                        <span className="session-time">
                          <FaClock /> {session.last_active}
                        </span>
                      </div>
                    </div>
                    {!session.current && (
                      <button
                        className="logout-device-btn"
                        onClick={() => handleLogoutDevice(session.id)}
                      >
                        Logout
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="activity-section"
          >
            <h3>Recent Security Activity</h3>
            <div className="activity-list">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  className="activity-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="activity-icon" style={{ color: activity.color }}>
                    <activity.icon />
                  </div>
                  <div className="activity-details">
                    <div className="activity-header">
                      <span className="activity-action">{activity.action}</span>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                    <p className="activity-meta">
                      {activity.device} • {activity.location}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Danger Zone */}
      <motion.div 
        className="danger-zone"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3>
          <FaExclamationTriangle /> Danger Zone
        </h3>
        <div className="danger-actions">
          <div className="danger-item">
            <div>
              <h4>Delete Account</h4>
              <p>Permanently delete your account and all associated data</p>
            </div>
            <button 
              className="delete-account-btn"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  toast.error('Account deletion is not available in demo');
                }
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </motion.div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              resetPasswordData();
              setShowPasswordModal(false);
            }}
          >
            <motion.div 
              className="password-modal-modern"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  <FaKey /> Change Password
                </h3>
                <button 
                  className="modal-close-btn"
                  onClick={() => {
                    resetPasswordData();
                    setShowPasswordModal(false);
                  }}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="password-input-group">
                  <label>Current Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      className={errors.current_password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.current_password && (
                    <span className="error-message">{errors.current_password}</span>
                  )}
                </div>

                <div className="password-input-group">
                  <label>New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className={errors.new_password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.new_password && (
                    <span className="error-message">{errors.new_password}</span>
                  )}
                </div>

                {passwordData.new_password && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4, 5].map((bar) => (
                        <div
                          key={bar}
                          className="strength-bar"
                          style={{
                            backgroundColor: bar <= passwordStrength.score 
                              ? getPasswordStrengthColor() 
                              : '#e0e0e0',
                            width: '20%'
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
                  </div>
                )}

                <div className="password-input-group">
                  <label>Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className={errors.confirm_password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <span className="error-message">{errors.confirm_password}</span>
                  )}
                </div>

                <div className="password-requirements">
                  <p>Password must contain:</p>
                  <ul>
                    <li className={passwordStrength.hasMinLength ? 'met' : ''}>
                      <FaCheckCircle /> At least 8 characters
                    </li>
                    <li className={passwordStrength.hasUpperCase ? 'met' : ''}>
                      <FaCheckCircle /> One uppercase letter
                    </li>
                    <li className={passwordStrength.hasLowerCase ? 'met' : ''}>
                      <FaCheckCircle /> One lowercase letter
                    </li>
                    <li className={passwordStrength.hasNumber ? 'met' : ''}>
                      <FaCheckCircle /> One number
                    </li>
                    <li className={passwordStrength.hasSpecialChar ? 'met' : ''}>
                      <FaCheckCircle /> One special character
                    </li>
                  </ul>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="modal-btn cancel"
                  onClick={() => {
                    resetPasswordData();
                    setShowPasswordModal(false);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn submit"
                  onClick={handlePasswordSubmit}
                  disabled={loading}
                >
                  {loading ? <FaSpinner className="spinner" /> : 'Update Password'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Tips Modal */}
      <AnimatePresence>
        {showTipsModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTipsModal(false)}
          >
            <motion.div 
              className="tips-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  <MdSecurity /> Security Tips
                </h3>
                <button 
                  className="modal-close-btn"
                  onClick={() => setShowTipsModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                {tipsLoading ? (
                  <div className="tips-loading">
                    <FaSpinner className="spinner" />
                    <p>Loading personalized security tips...</p>
                  </div>
                ) : (
                  <div className="tips-list">
                    {securityTips.length > 0 ? (
                      securityTips.map(tip => (
                        <motion.div
                          key={tip.id}
                          className={`tip-item priority-${tip.priority}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="tip-header">
                            <div className="tip-icon" style={{ backgroundColor: `${tip.priority === 'high' ? '#ef4444' : tip.priority === 'medium' ? '#f59e0b' : '#3b82f6'}20` }}>
                              <tip.icon style={{ color: tip.priority === 'high' ? '#ef4444' : tip.priority === 'medium' ? '#f59e0b' : '#3b82f6' }} />
                            </div>
                            <div className="tip-title">
                              <h4>{tip.title}</h4>
                              <span className="tip-category">{tip.category}</span>
                            </div>
                            <span className={`tip-priority-badge priority-${tip.priority}`}>
                              {tip.priority}
                            </span>
                          </div>
                          <p className="tip-description">{tip.description}</p>
                          <div className="tip-footer">
                            <span className="tip-impact">
                              <FaArrowRight /> Impact: {tip.impact}
                            </span>
                            <button 
                              className="tip-action-btn"
                              onClick={() => handleTipAction(tip)}
                              style={{
                                backgroundColor: tip.priority === 'high' ? '#ef4444' : 
                                              tip.priority === 'medium' ? '#f59e0b' : '#3b82f6'
                              }}
                            >
                              {tip.action}
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="no-tips">
                        <FaCheckCircle className="no-tips-icon" />
                        <h4>Great job!</h4>
                        <p>Your security settings are already optimized. No tips needed.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  className="modal-btn submit"
                  onClick={() => setShowTipsModal(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Security;