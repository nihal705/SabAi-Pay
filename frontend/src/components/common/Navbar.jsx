// frontend/src/components/common/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { 
  FaHome, 
  FaUser, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaRobot,
  FaCoins,
  FaCreditCard,
  FaBolt,
  FaMobile,
  FaSun,
  FaMoon,
  FaHistory,
  FaQrcode,
  FaWallet,
  FaTachometerAlt,
  FaCog,
  FaBell,
  FaQuestionCircle,
  FaUserCircle
} from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setProfileMenuOpen(false);
  };

  const triggerLogoAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  const navItems = [
    { path: '/', icon: FaHome, label: 'Home', public: true },
    ...(isAuthenticated ? [
      { path: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard', public: false },
      { path: '/send-money', icon: FaWallet, label: 'Send', public: false },
      { path: '/bills', icon: FaBolt, label: 'Bills', public: false },
      { path: '/mobile-recharge', icon: FaMobile, label: 'Recharge', public: false },
      { path: '/agent', icon: FaRobot, label: 'AI Agent', public: false },
      { path: '/reserve-pay', icon: FaCreditCard, label: 'Reserve', public: false },
      { path: '/coins', icon: FaCoins, label: 'Coins', public: false },
      { path: '/transactions', icon: FaHistory, label: 'History', public: false },
      { path: '/guide', icon: FaQuestionCircle, label: 'Guide', public: false },
    ] : [
      { path: '/login', icon: FaUser, label: 'Login', public: true },
      { path: '/register', icon: FaUser, label: 'Register', public: true }
    ])
  ];

  const filteredNavItems = navItems.filter(item => item.public || isAuthenticated);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link 
          to="/" 
          className="navbar-logo" 
          onClick={() => {
            setMenuOpen(false);
            triggerLogoAnimation();
          }}
        >
          <div className="logo-image-container">
            <div className={`payment-animation-wrapper ${isAnimating ? 'animating' : ''}`}>
              <img 
                src={darkMode ? "/images/merchants/sabailogodark1.png" : "/images/merchants/sabailogo.png"}
                alt="SabAI Pay" 
                className="navbar-logo-image"
              />
              </div>
          </div>
          <div className="logo-wrapper">
            <span className="logo-sab">
              <span className="sa">Sa</span>
              <span className="b">b</span>
            </span>
            <span className="logo-ai">AI</span>
            <span className="logo-pay">Pay</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-menu-desktop">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon className="nav-icon" />
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Theme Toggle Button */}
          <button onClick={toggleDarkMode} className="icon-button" title={darkMode ? 'Light Mode' : 'Dark Mode'}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>

          {isAuthenticated && (
            <div className="profile-menu" ref={profileMenuRef}>
              <button 
                className="profile-button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <div className="avatar">
                  {user?.profile_pic ? (
                    <img 
                      src={user.profile_pic} 
                      alt={user?.name || 'User'} 
                      className="avatar-image"
                    />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
              </button>

              {profileMenuOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <p className="user-name">{user?.name || 'User'}</p>
                    <p className="user-phone">{user?.phone_number || ''}</p>
                    <p className="user-email">{user?.email || ''}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/settings" className="dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                    <FaCog /> Settings
                  </Link>
                  <Link to="/guide" className="dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                    <FaQuestionCircle /> How to use SabAI Pay
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="nav-menu-mobile">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="mobile-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                <item.icon className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            ))}

            {/* Mobile Theme Toggle */}
            <button onClick={toggleDarkMode} className="mobile-nav-link">
              {darkMode ? <FaSun /> : <FaMoon />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {isAuthenticated && (
              <>
                <div className="mobile-user-info">
                  <p className="mobile-user-name">{user?.name}</p>
                  <p className="mobile-user-phone">{user?.phone_number}</p>
                </div>
                <Link to="/settings" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <FaCog /> Settings
                </Link>
                <button onClick={handleLogout} className="mobile-nav-link logout">
                  <FaSignOutAlt /> Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
