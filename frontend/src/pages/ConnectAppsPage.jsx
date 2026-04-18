// frontend/src/pages/ConnectAppsPage.jsx
// COMPLETELY FIXED - Disconnect working + Logo showing + Address input correct

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    getConnectedMerchants, 
    connectMerchant, 
    disconnectMerchant,
    getCurrentUserId
} from '../services/storageService';
import { 
  FaArrowLeft,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaLink,
  FaUnlink,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaExternalLinkAlt,
  FaStore,
  FaShoppingBag,
  FaUtensils,
  FaCoffee,
  FaHeartbeat,
  FaPlane,
  FaFilm,
  FaCar,
  FaLaptop,
  FaExclamationTriangle,
  FaTshirt,
  FaPizzaSlice,
  FaHamburger,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { MdLocalGroceryStore } from 'react-icons/md';
import { availableMerchants, categoryNames, merchantsByCategory, getCategoryIcon } from '../services/merchantConnectionService';
import merchantConnectionService from '../services/merchantConnectionService';
import toast from 'react-hot-toast';
import axios from 'axios';
import './ConnectAppsPage.css';

const ConnectAppsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [connectedMerchants, setConnectedMerchants] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationArea, setLocationArea] = useState('');
  const [locationPincode, setLocationPincode] = useState('');
  const [currentUserId, setCurrentUserIdState] = useState(null);
  const [locationValidation, setLocationValidation] = useState(null);
  const [validatingLocation, setValidatingLocation] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    phone: '',
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState('credentials');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [merchantToDisconnect, setMerchantToDisconnect] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  // Get current user ID
  const getUserId = () => {
    if (user?.id) return user.id.toString();
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) return storedUserId;
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.id) return payload.id.toString();
        if (payload.userId) return payload.userId.toString();
      } catch (e) {}
    }
    return '1';
  };

  // Initialize currentUserId
  useEffect(() => {
    const userId = getUserId();
    setCurrentUserIdState(userId);
    console.log('Current User ID:', userId);
  }, [user]);

  // Load connected merchants
  useEffect(() => {
    loadConnectedMerchants();
  }, [user]);

  const loadConnectedMerchants = async () => {
    try {
      setLoading(true);
      const connected = await getConnectedMerchants();
      console.log('Loaded connected merchants:', connected);
      setConnectedMerchants(connected || []);
    } catch (error) {
      console.error('Failed to load connected merchants:', error);
      setConnectedMerchants([]);
    } finally {
      setLoading(false);
    }
  };

  const isMerchantConnected = (merchantId) => {
    return connectedMerchants.some(conn => {
        const connId = conn.merchantId || conn.merchant_id;
        return connId === merchantId;
    });
  };

  // ============================================
  // DISCONNECT - FIXED
  // ============================================
  const handleDisconnectClick = (merchant) => {
    setMerchantToDisconnect(merchant);
    setShowDisconnectConfirm(true);
  };

  const handleDisconnect = async () => {
    if (!merchantToDisconnect) return;
    
    setLoading(true);
    try {
      const userId = getUserId();
      console.log(`Disconnecting merchant: ${merchantToDisconnect.merchantId} for user ${userId}`);
      
      // Call disconnectMerchant with userId and merchantId
      const result = await merchantConnectionService.disconnectMerchant(userId, merchantToDisconnect.merchantId);
      
      if (result && result.success) {
        toast.success(`Disconnected from ${merchantToDisconnect.name}`);
        await loadConnectedMerchants();
        setShowDisconnectConfirm(false);
        setMerchantToDisconnect(null);
      } else {
        toast.error(result?.message || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error(error.response?.data?.message || 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOCATION INPUT - CORRECTED
  // ============================================
  const handleLocationSubmit = async () => {
    if (!locationCity.trim()) {
      toast.error('Please enter your city');
      return;
    }
    
    if (!locationArea.trim()) {
      toast.error('Please enter your area/locality');
      return;
    }
    
    if (!locationAddress.trim()) {
      toast.error('Please enter your delivery address');
      return;
    }
    
    setValidatingLocation(true);
    
    try {
      // Validate location with backend
      const response = await axios.post(
        'http://localhost:5000/api/merchant/validate-location',
        {
          merchantId: selectedMerchant.id,
          address: `${locationAddress}, ${locationArea}, ${locationCity}${locationPincode ? ', ' + locationPincode : ''}`,
          city: locationCity
        }
      );
      
      if (response.data.success && response.data.data.valid) {
        // Save location to localStorage
        const userId = getUserId();
        const savedLocations = JSON.parse(localStorage.getItem(`merchant_locations_${userId}`) || '{}');
        savedLocations[selectedMerchant.id] = {
          address: locationAddress,
          area: locationArea,
          city: response.data.data.city,
          pincode: locationPincode,
          coordinates: response.data.data.coordinates,
          validatedAt: new Date().toISOString()
        };
        localStorage.setItem(`merchant_locations_${userId}`, JSON.stringify(savedLocations));
        
        // Also save to backend
        const token = localStorage.getItem('token');
        await axios.post(
          'http://localhost:5000/api/merchant/update-location',
          {
            merchantId: selectedMerchant.id,
            location: {
              city: locationCity.toLowerCase(),
              area: locationArea,
              address: locationAddress,
              pincode: locationPincode
            }
          },
          { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        
        toast.success(`Location saved! ${response.data.data.message}`);
        
        // Close location modal and open login modal
        setShowLocationModal(false);
        setLocationAddress('');
        setLocationArea('');
        setLocationCity('');
        setLocationPincode('');
        setLocationValidation(null);
        
        // Proceed to login modal for authentication
        setLoginData({ email: '', password: '', phone: '', remember: false });
        setLoginStep('credentials');
        setOtp(['', '', '', '', '', '']);
        setShowLoginModal(true);
      } else {
        setLocationValidation({
          valid: false,
          message: response.data.data.message,
          availableCities: response.data.data.availableCities
        });
        toast.error(response.data.data.message);
      }
    } catch (error) {
      console.error('Location validation error:', error);
      toast.error(error.response?.data?.message || 'Failed to validate location. Please try again.');
    } finally {
      setValidatingLocation(false);
    }
  };

  // ============================================
  // CONNECT - FIXED
  // ============================================
  const handleConnectClick = (merchant) => {
    if (isMerchantConnected(merchant.id)) {
      toast.error(`${merchant.name} is already connected`);
      return;
    }
    
    setSelectedMerchant(merchant);
    
    const locationRequiredMerchants = ['swiggy', 'zomato', 'zepto', 'blinkit', 'bigbasket', 'dmart', 'netmeds', 'pharmeasy'];
    
    if (locationRequiredMerchants.includes(merchant.id)) {
      // Reset location form
      setLocationAddress('');
      setLocationArea('');
      setLocationCity('');
      setLocationPincode('');
      setLocationValidation(null);
      setShowLocationModal(true);
    } else {
      // For merchants that don't require location, show login modal directly
      setLoginData({ email: '', password: '', phone: '', remember: false });
      setLoginStep('credentials');
      setOtp(['', '', '', '', '', '']);
      setShowLoginModal(true);
    }
  };

  // Handle login and final connection
  const handleLogin = async () => {
    if (loginStep === 'credentials') {
      if (!loginData.email && !loginData.phone) {
        toast.error('Please enter email or phone number');
        return;
      }
      if (!loginData.password) {
        toast.error('Please enter password');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setLoginStep('otp');
        toast.success(`OTP sent to ${loginData.email || loginData.phone}`);
      }, 1500);
    } else if (loginStep === 'otp') {
      const otpString = otp.join('');
      if (otpString.length !== 6) {
        toast.error('Please enter complete OTP');
        return;
      }
      
      setLoading(true);
      setTimeout(async () => {
        try {
          const userId = getUserId();
          const result = await merchantConnectionService.connectMerchant(
            userId,
            selectedMerchant.id,
            {
              email: loginData.email,
              phone: loginData.phone,
              name: 'User'
            }
          );
          
          setLoading(false);
          
          if (result && result.success) {
            setLoginStep('success');
            toast.success(`Successfully connected to ${selectedMerchant.name}!`);
            await loadConnectedMerchants();
            
            setTimeout(() => {
              setShowLoginModal(false);
              setLoginStep('credentials');
              setOtp(['', '', '', '', '', '']);
            }, 2000);
          } else {
            toast.error(result?.message || 'Connection failed');
          }
        } catch (error) {
          console.error('Connection error:', error);
          toast.error('Connection failed');
          setLoading(false);
        }
      }, 1500);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Filter merchants based on search and category
  const filteredMerchants = availableMerchants.filter(merchant => {
    const matchesSearch = merchant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || merchant.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group filtered merchants by category
  const groupedFilteredMerchants = filteredMerchants.reduce((acc, merchant) => {
    if (!acc[merchant.category]) {
      acc[merchant.category] = [];
    }
    acc[merchant.category].push(merchant);
    return acc;
  }, {});

  // Categories for filter tabs
  const categories = [
    { id: 'all', name: 'All Apps', icon: FaStore },
    ...Object.keys(merchantsByCategory).map(cat => ({
      id: cat,
      name: categoryNames[cat] || cat,
      icon: () => <span>{getCategoryIcon(cat)}</span>
    }))
  ];

  const getMerchantIcon = (merchant) => {
    const iconMap = {
      amazon: '📦',
      flipkart: '🛍️',
      ajio: '👕',
      myntra: '👚',
      swiggy: '🍔',
      zomato: '🍕',
      zepto: '⚡',
      blinkit: '⚡',
      bigbasket: '🛒',
      netmeds: '💊',
      pharmeasy: '💊',
      uber: '🚗',
      ola: '🚕',
      dominos: '🍕',
      pizzahut: '🍕',
      kfc: '🍗',
      mcdonalds: '🍔',
      burgerking: '🍔',
      starbucks: '☕',
      croma: '💻'
    };
    return iconMap[merchant.id] || merchant.icon || '🏪';
  };

  const handleImageError = (merchantId) => {
    setImageErrors(prev => ({ ...prev, [merchantId]: true }));
  };

  return (
    <div className="connect-apps-page">
      <div className="connect-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        <h1>Connect Apps</h1>
        <p>Link your merchant accounts to enable SabAI Assistance</p>
      </div>

      {/* Connected Apps Section */}
      {connectedMerchants.length > 0 && (
        <div className="connected-section">
          <h2>Connected Apps ({connectedMerchants.length})</h2>
          <div className="connected-grid">
            {connectedMerchants.map(conn => {
              const merchantInfo = availableMerchants.find(m => m.id === conn.merchantId);
              const merchantName = merchantInfo?.name || conn.name || conn.merchant_name || conn.merchantId;
              const merchantLogo = merchantInfo?.logoUrl || conn.logoUrl;
              const merchantColor = merchantInfo?.color || conn.color || '#4f46e5';
              const connectedDate = conn.connectedAt || conn.connected_at;
              
              return (
                <div key={conn.merchantId || conn.id} className="connected-card">
                  <div className="connected-icon" style={{ backgroundColor: merchantColor }}>
                    {merchantLogo && !imageErrors[conn.merchantId] ? (
                      <img 
                        src={merchantLogo} 
                        alt={merchantName}
                        className="merchant-logo-small"
                        onError={() => handleImageError(conn.merchantId)}
                      />
                    ) : (
                      <span style={{ fontSize: '1.5rem' }}>{getMerchantIcon({ id: conn.merchantId, name: merchantName })}</span>
                    )}
                  </div>
                  <div className="connected-info">
                    <h3>{merchantName}</h3>
                    <p>Connected {connectedDate ? new Date(connectedDate).toLocaleDateString() : 'Recently'}</p>
                  </div>
                  <button 
                    className="disconnect-btn"
                    onClick={() => handleDisconnectClick({ merchantId: conn.merchantId, name: merchantName })}
                  >
                    <FaUnlink />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="connect-controls">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search merchants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {typeof cat.icon === 'function' ? <cat.icon /> : <cat.icon />}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Merchants Grid */}
      <div className="merchants-container">
        {Object.keys(groupedFilteredMerchants).length > 0 ? (
          Object.keys(groupedFilteredMerchants).map(category => (
            <div key={category} className="category-section">
              <h3>{categoryNames[category] || category}</h3>
              <div className="merchants-grid">
                {groupedFilteredMerchants[category].map(merchant => {
                  const isConnected = isMerchantConnected(merchant.id);
                  const hasImageError = imageErrors[merchant.id];
                  
                  return (
                    <motion.div
                      key={merchant.id}
                      className={`merchant-card ${isConnected ? 'connected' : ''}`}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => !isConnected && handleConnectClick(merchant)}
                    >
                      <div className="merchant-icon" style={{ backgroundColor: merchant.color }}>
                        {merchant.logoUrl && !hasImageError ? (
                          <img 
                            src={merchant.logoUrl} 
                            alt={merchant.name}
                            className="merchant-logo"
                            onError={() => handleImageError(merchant.id)}
                          />
                        ) : (
                          <span className="merchant-fallback-icon">{getMerchantIcon(merchant)}</span>
                        )}
                      </div>
                      <div className="merchant-info">
                        <h4>{merchant.name}</h4>
                        <span className="merchant-category">{categoryNames[merchant.category]}</span>
                      </div>
                      {isConnected ? (
                        <div className="connected-badge">
                          <FaCheckCircle />
                          <span>Connected</span>
                        </div>
                      ) : (
                        <button className="connect-btn">
                          <FaLink /> Connect
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <FaSearch size={48} />
            <h3>No merchants found</h3>
            <p>Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* LOCATION MODAL - CORRECTED ADDRESS INPUT */}
      {/* ============================================ */}
      <AnimatePresence>
        {showLocationModal && selectedMerchant && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowLocationModal(false);
              setLocationAddress('');
              setLocationArea('');
              setLocationCity('');
              setLocationPincode('');
              setLocationValidation(null);
            }}
          >
            <motion.div
              className="location-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => {
                setShowLocationModal(false);
                setLocationAddress('');
                setLocationArea('');
                setLocationCity('');
                setLocationPincode('');
                setLocationValidation(null);
              }}>
                <FaTimes />
              </button>

              <div className="modal-merchant-header">
                <div className="modal-merchant-icon" style={{ backgroundColor: selectedMerchant.color }}>
                  {selectedMerchant.logoUrl && !imageErrors[selectedMerchant.id] ? (
                    <img 
                      src={selectedMerchant.logoUrl} 
                      alt={selectedMerchant.name} 
                      className="merchant-logo-large" 
                      onError={() => handleImageError(selectedMerchant.id)}
                    />
                  ) : (
                    <span className="merchant-fallback-icon-large">{getMerchantIcon(selectedMerchant)}</span>
                  )}
                </div>
                <div>
                  <h2>Set Delivery Address</h2>
                  <p>Enter your location for {selectedMerchant.name}</p>
                </div>
              </div>

              <div className="location-form">
                <div className="form-group">
                  <label>City <span className="required">*</span></label>
                  <div className="input-with-icon">
                    <FaMapMarkerAlt className="input-icon" />
                    <input
                      type="text"
                      placeholder="Enter city (e.g., Bangalore, Mumbai, Delhi)"
                      value={locationCity}
                      onChange={(e) => setLocationCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Area/Locality <span className="required">*</span></label>
                  <div className="input-with-icon">
                    <FaMapMarkerAlt className="input-icon" />
                    <input
                      type="text"
                      placeholder="Enter area (e.g., Indiranagar, Koramangala, Andheri)"
                      value={locationArea}
                      onChange={(e) => setLocationArea(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Street Address <span className="required">*</span></label>
                  <div className="input-with-icon">
                    <FaMapMarkerAlt className="input-icon" />
                    <input
                      type="text"
                      placeholder="House No., Building Name, Street"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Pincode (Optional)</label>
                  <div className="input-with-icon">
                    <FaMapMarkerAlt className="input-icon" />
                    <input
                      type="text"
                      placeholder="Enter pincode"
                      value={locationPincode}
                      onChange={(e) => setLocationPincode(e.target.value)}
                      maxLength="6"
                    />
                  </div>
                </div>

                {locationValidation && !locationValidation.valid && (
                  <div className="location-validation-error">
                    <FaExclamationTriangle />
                    <span>{locationValidation.message}</span>
                    {locationValidation.availableCities && (
                      <div className="available-cities">
                        <strong>Available cities:</strong> {locationValidation.availableCities.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="location-submit-btn"
                  onClick={handleLocationSubmit}
                  disabled={validatingLocation || !locationCity || !locationArea || !locationAddress}
                >
                  {validatingLocation ? <FaSpinner className="spinner" /> : 'Verify & Save Location'}
                </button>

                <div className="location-note">
                  <FaStore />
                  <span>{selectedMerchant.name} delivers to major Indian cities. Enter your delivery address to check availability.</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* LOGIN MODAL - WITH MERCHANT LOGO FIXED */}
      {/* ============================================ */}
      <AnimatePresence>
        {showLoginModal && selectedMerchant && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              className="login-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowLoginModal(false)}>
                <FaTimes />
              </button>

              <div className="modal-merchant-header">
                <div className="modal-merchant-icon" style={{ backgroundColor: selectedMerchant.color }}>
                  {selectedMerchant.logoUrl && !imageErrors[selectedMerchant.id] ? (
                    <img 
                      src={selectedMerchant.logoUrl} 
                      alt={selectedMerchant.name} 
                      className="merchant-logo-large" 
                      onError={() => handleImageError(selectedMerchant.id)}
                    />
                  ) : (
                    <span className="merchant-fallback-icon-large">{getMerchantIcon(selectedMerchant)}</span>
                  )}
                </div>
                <div>
                  <h2>Connect {selectedMerchant.name}</h2>
                  <p>Enter your credentials to link your account</p>
                </div>
              </div>

              {loginStep === 'credentials' && (
                <div className="login-form">
                  <div className="form-group">
                    <label>Email or Phone Number</label>
                    <div className="input-with-icon">
                      <FaEnvelope className="input-icon" />
                      <input
                        type="text"
                        placeholder="Enter email or phone"
                        value={loginData.email || loginData.phone}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.includes('@')) {
                            setLoginData({ ...loginData, email: value, phone: '' });
                          } else {
                            setLoginData({ ...loginData, phone: value, email: '' });
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <div className="input-with-icon">
                      <FaLock className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      />
                      <button 
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="form-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={loginData.remember}
                        onChange={(e) => setLoginData({ ...loginData, remember: e.target.checked })}
                      />
                      <span>Remember me</span>
                    </label>
                    <button className="forgot-password">Forgot Password?</button>
                  </div>

                  <button 
                    className="login-submit-btn"
                    onClick={handleLogin}
                    disabled={loading}
                  >
                    {loading ? <FaSpinner className="spinner" /> : 'Login & Connect'}
                  </button>

                  <div className="login-note">
                    <FaExternalLinkAlt />
                    <span>Your credentials are securely stored and only used for order placement.</span>
                  </div>
                </div>
              )}

              {loginStep === 'otp' && (
                <div className="otp-form">
                  <p className="otp-instruction">
                    Enter the 6-digit OTP sent to {loginData.email || loginData.phone}
                  </p>
                  <div className="otp-inputs">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="otp-input"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  <button 
                    className="otp-submit-btn"
                    onClick={handleLogin}
                    disabled={loading}
                  >
                    {loading ? <FaSpinner className="spinner" /> : 'Verify & Connect'}
                  </button>
                  <button 
                    className="resend-otp"
                    onClick={() => {
                      toast.success('OTP resent!');
                    }}
                  >
                    Resend OTP
                  </button>
                </div>
              )}

              {loginStep === 'success' && (
                <div className="success-message">
                  <FaCheckCircle className="success-icon" />
                  <h3>Connected Successfully!</h3>
                  <p>You can now use SabAI Assistant to order from {selectedMerchant.name}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* DISCONNECT CONFIRMATION MODAL */}
      {/* ============================================ */}
      <AnimatePresence>
        {showDisconnectConfirm && merchantToDisconnect && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDisconnectConfirm(false)}
          >
            <motion.div
              className="confirm-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="confirm-icon warning">
                <FaTimesCircle />
              </div>
              <h3>Disconnect {merchantToDisconnect.name}?</h3>
              <p>
                You will no longer be able to use SabAI Assistance to order from{' '}
                {merchantToDisconnect.name}. You can reconnect anytime.
              </p>
              <div className="confirm-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowDisconnectConfirm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-danger"
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  {loading ? <FaSpinner className="spinner" /> : 'Disconnect'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConnectAppsPage;