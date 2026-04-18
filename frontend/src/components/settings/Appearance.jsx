// frontend/src/components/settings/Appearance.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSun,
  FaMoon,
  FaPalette,
  FaFont,
  FaCheck,
  FaMobile,
  FaLaptop,
  FaTabletAlt,
  FaSpinner,
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Appearance.css';

const Appearance = () => {
  const { user, updateUser } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, mobile, tablet
  
  // Appearance settings
  const [settings, setSettings] = useState({
    theme: darkMode ? 'dark' : 'light',
    primaryColor: '#4f46e5',
    fontSize: 'medium', // small, medium, large
    fontFamily: 'inter', // inter, roboto, poppins, opensans
    sidebarCollapsed: false,
    compactView: false
  });

  // Available options
  const colorOptions = [
    { id: 'indigo', value: '#4f46e5', name: 'Indigo' },
    { id: 'purple', value: '#8b5cf6', name: 'Purple' },
    { id: 'pink', value: '#ec4899', name: 'Pink' },
    { id: 'red', value: '#ef4444', name: 'Red' },
    { id: 'orange', value: '#f97316', name: 'Orange' },
    { id: 'green', value: '#10b981', name: 'Green' },
    { id: 'blue', value: '#3b82f6', name: 'Blue' },
    { id: 'teal', value: '#14b8a6', name: 'Teal' }
  ];

  const fontSizeOptions = [
    { id: 'small', name: 'Small', scale: '0.875rem', value: 14 },
    { id: 'medium', name: 'Medium', scale: '1rem', value: 16 },
    { id: 'large', name: 'Large', scale: '1.125rem', value: 18 }
  ];

  const fontFamilyOptions = [
    { id: 'inter', name: 'Inter', value: "'Inter', sans-serif", sample: 'Aa' },
    { id: 'roboto', name: 'Roboto', value: "'Roboto', sans-serif", sample: 'Aa' },
    { id: 'poppins', name: 'Poppins', value: "'Poppins', sans-serif", sample: 'Aa' },
    { id: 'opensans', name: 'Open Sans', value: "'Open Sans', sans-serif", sample: 'Aa' }
  ];

  // Load saved settings from localStorage
  useEffect(() => {
    loadSettings();
  }, []);

  // Apply theme when settings change
  useEffect(() => {
    applySettings();
  }, [settings]);

  const loadSettings = () => {
    const saved = localStorage.getItem('appearanceSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      
      // Sync theme with context
      if (parsed.theme === 'dark' && !darkMode) {
        toggleDarkMode();
      } else if (parsed.theme === 'light' && darkMode) {
        toggleDarkMode();
      }
    }
  };

  const applySettings = () => {
    // Apply font size
    const fontSize = fontSizeOptions.find(f => f.id === settings.fontSize)?.value || 16;
    document.documentElement.style.fontSize = `${fontSize}px`;
    
    // Apply base font size to root
    document.documentElement.style.setProperty('--base-font-size', `${fontSize}px`);

    // Apply font family
    const fontFamily = fontFamilyOptions.find(f => f.id === settings.fontFamily)?.value || "'Inter', sans-serif";
    document.documentElement.style.fontFamily = fontFamily;

    // Apply primary color as CSS variable
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    
    // Apply primary color variations
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '79, 70, 229';
    };
    document.documentElement.style.setProperty('--primary-rgb', hexToRgb(settings.primaryColor));

    // Apply layout settings
    if (settings.sidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }

    if (settings.compactView) {
      document.body.classList.add('compact-view');
    } else {
      document.body.classList.remove('compact-view');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('appearanceSettings', JSON.stringify(settings));
      
      // Save to user profile via API
      await updateUser({ ...user, appearance: settings });
      
      toast.success('Appearance settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      theme: darkMode ? 'dark' : 'light',
      primaryColor: '#4f46e5',
      fontSize: 'medium',
      fontFamily: 'inter',
      sidebarCollapsed: false,
      compactView: false
    };
    setSettings(defaultSettings);
    toast.success('Settings reset to defaults');
  };

  const handleThemeChange = (theme) => {
    setSettings(prev => ({ ...prev, theme }));
    if ((theme === 'dark' && !darkMode) || (theme === 'light' && darkMode)) {
      toggleDarkMode();
    }
  };

  const handleColorChange = (color) => {
    setSettings(prev => ({ ...prev, primaryColor: color }));
  };

  const handleFontSizeChange = (size) => {
    setSettings(prev => ({ ...prev, fontSize: size }));
  };

  const handleFontFamilyChange = (font) => {
    setSettings(prev => ({ ...prev, fontFamily: font }));
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getPreviewClasses = () => {
    let classes = 'preview-card';
    return classes;
  };

  const currentFontSize = fontSizeOptions.find(f => f.id === settings.fontSize)?.value || 16;
  const currentFontFamily = fontFamilyOptions.find(f => f.id === settings.fontFamily)?.value || "'Inter', sans-serif";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="appearance-settings"
    >
      <div className="settings-header">
        <h2>Appearance Settings</h2>
        <div className="header-actions">
          <button 
            className="reset-btn"
            onClick={resetToDefaults}
            disabled={saving}
          >
            Reset to Default
          </button>
          <button 
            className="save-btn"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? <FaSpinner className="spinner" /> : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Enhanced Live Preview Section */}
      <motion.div 
        className="preview-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="preview-header">
          <h3>Live Preview</h3>
          <div className="preview-devices">
            <button
              className={`device-btn ${previewMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setPreviewMode('desktop')}
              title="Desktop View"
            >
              <FaLaptop />
            </button>
            <button
              className={`device-btn ${previewMode === 'tablet' ? 'active' : ''}`}
              onClick={() => setPreviewMode('tablet')}
              title="Tablet View"
            >
              <FaTabletAlt />
            </button>
            <button
              className={`device-btn ${previewMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setPreviewMode('mobile')}
              title="Mobile View"
            >
              <FaMobile />
            </button>
          </div>
        </div>

        <div className={`preview-container ${previewMode}`}>
          <div className={getPreviewClasses()} style={{ 
            '--preview-primary': settings.primaryColor,
            fontSize: `${currentFontSize}px`,
            fontFamily: currentFontFamily
          }}>
            {/* Preview Header with Logo and Name */}
            <div className="preview-header-bar">
  <div className="preview-logo-container">
    <div className="preview-logo-image-container">
      <img 
        src={darkMode ? "/images/merchants/sabailogodark1.png" : "/images/merchants/sabailogo.png"}
        alt="SabAI Pay" 
        className="preview-logo-image"
      />
    </div>
    <div className="preview-logo-text">
      <div className="logo-wrapper-preview">
        <span className="logo-sab-preview">
          <span className="sa-preview">Sa</span>
          <span className="b-preview">b</span>
        </span>
        <span className="logo-ai-preview">AI</span>
        <span className="logo-pay-preview">Pay</span>
      </div>
    </div>
  </div>
  <div className="preview-user-section">
    <span className="preview-user-name">{user?.name || 'John Doe'}</span>
    <div className="preview-avatar">
      {user?.profile_pic ? (
        <img 
          src={user.profile_pic} 
          alt={user?.name || 'User'} 
          className="preview-avatar-image"
        />
      ) : (
        user?.name?.charAt(0).toUpperCase() || 'J'
      )}
    </div>
  </div>
</div>

            {/* Preview Content */}
            <div className="preview-content">
              <div className="preview-welcome">
                <h4>Welcome back, {user?.name?.split(' ')[0] || 'John'}! 👋</h4>
                <p>Here's what's happening with your account today.</p>
              </div>

              <div className="preview-stats">
                <div className="preview-stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <span className="stat-label">Quick Actions</span>
                    <span className="stat-value">6</span>
                  </div>
                </div>
                <div className="preview-stat-card">
                  <div className="stat-icon">🪙</div>
                  <div className="stat-info">
                    <span className="stat-label">Coins Earned</span>
                    <span className="stat-value">1,250</span>
                  </div>
                </div>
                <div className="preview-stat-card">
                  <div className="stat-icon">📱</div>
                  <div className="stat-info">
                    <span className="stat-label">Connected Apps</span>
                    <span className="stat-value">8</span>
                  </div>
                </div>
              </div>

              <div className="preview-actions">
                <button className="preview-btn primary" style={{ backgroundColor: settings.primaryColor }}>
                  Send Money
                </button>
                <button className="preview-btn secondary">
                  Request
                </button>
                <button className="preview-btn outline">
                  View All
                </button>
              </div>

              <div className="preview-recent">
                <h5>Recent Activity</h5>
                <div className="preview-activity-item">
                  <span className="activity-dot" style={{ backgroundColor: settings.primaryColor }}></span>
                  <span className="activity-text">Payment to Rahul Kumar</span>
                  <span className="activity-amount">₹500</span>
                </div>
                <div className="preview-activity-item">
                  <span className="activity-dot" style={{ backgroundColor: settings.primaryColor }}></span>
                  <span className="activity-text">Received from Priya</span>
                  <span className="activity-amount">₹1,250</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Theme Selection */}
      <motion.div 
        className="settings-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="card-header">
          {settings.theme === 'light' ? <FaSun className="card-icon" /> : <FaMoon className="card-icon" />}
          <h3>Theme</h3>
        </div>
        <div className="theme-options">
          <button
            className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            <div className="theme-preview light">
              <div className="theme-preview-header light"></div>
              <div className="theme-preview-content">
                <div className="preview-line"></div>
                <div className="preview-line short"></div>
              </div>
            </div>
            <div className="theme-info">
              <span className="theme-name">Light</span>
              {settings.theme === 'light' && <FaCheck className="check-icon" />}
            </div>
          </button>

          <button
            className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            <div className="theme-preview dark">
              <div className="theme-preview-header dark"></div>
              <div className="theme-preview-content">
                <div className="preview-line"></div>
                <div className="preview-line short"></div>
              </div>
            </div>
            <div className="theme-info">
              <span className="theme-name">Dark</span>
              {settings.theme === 'dark' && <FaCheck className="check-icon" />}
            </div>
          </button>
        </div>
      </motion.div>

      {/* Color Theme */}
      <motion.div 
        className="settings-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="card-header">
          <FaPalette className="card-icon" />
          <h3>Accent Color</h3>
        </div>
        <div className="color-options">
          {colorOptions.map(color => (
            <button
              key={color.id}
              className={`color-option ${settings.primaryColor === color.value ? 'active' : ''}`}
              style={{ backgroundColor: color.value }}
              onClick={() => handleColorChange(color.value)}
              title={color.name}
            >
              {settings.primaryColor === color.value && <FaCheck />}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Font Settings */}
      <motion.div 
        className="settings-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="card-header">
          <FaFont className="card-icon" />
          <h3>Font & Text Size</h3>
        </div>
        
        <div className="font-size-section">
          <label>Text Size</label>
          <div className="font-size-options">
            {fontSizeOptions.map(option => (
              <button
                key={option.id}
                className={`size-option ${settings.fontSize === option.id ? 'active' : ''}`}
                onClick={() => handleFontSizeChange(option.id)}
              >
                <span className="size-preview" style={{ fontSize: option.scale }}>Aa</span>
                <span className="size-name">{option.name}</span>
                <span className="size-value">{option.value}px</span>
              </button>
            ))}
          </div>
        </div>

        <div className="font-family-section">
          <label>Font Family</label>
          <div className="font-family-options">
            {fontFamilyOptions.map(font => (
              <button
                key={font.id}
                className={`font-option ${settings.fontFamily === font.id ? 'active' : ''}`}
                onClick={() => handleFontFamilyChange(font.id)}
                style={{ fontFamily: font.value }}
              >
                <span className="font-sample">{font.sample}</span>
                <span className="font-name">{font.name}</span>
                {settings.fontFamily === font.id && <FaCheck className="check-icon" />}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Layout Options */}
      <motion.div 
        className="settings-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="card-header">
          <FaLaptop className="card-icon" />
          <h3>Layout</h3>
        </div>
        
        <div className="layout-options">
          <div className="layout-row">
            <div className="layout-info">
              <h4>Compact View</h4>
              <p>Show more content with reduced spacing</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.compactView}
                onChange={() => handleToggle('compactView')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="layout-row">
            <div className="layout-info">
              <h4>Collapsed Sidebar</h4>
              <p>Minimize sidebar for more screen space</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.sidebarCollapsed}
                onChange={() => handleToggle('sidebarCollapsed')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="layout-preview">
            <div className="layout-preview-sidebar" style={{ 
              width: settings.sidebarCollapsed ? '60px' : '200px',
              transition: 'width 0.3s ease'
            }}>
              <div className="sidebar-item" style={{ width: settings.sidebarCollapsed ? '40px' : '160px' }}></div>
              <div className="sidebar-item" style={{ width: settings.sidebarCollapsed ? '40px' : '160px' }}></div>
              <div className="sidebar-item" style={{ width: settings.sidebarCollapsed ? '40px' : '160px' }}></div>
            </div>
            <div className="layout-preview-content" style={{
              padding: settings.compactView ? '8px' : '16px'
            }}>
              <div className="content-line" style={{ height: settings.compactView ? '20px' : '30px' }}></div>
              <div className="content-line" style={{ height: settings.compactView ? '20px' : '30px' }}></div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Appearance;