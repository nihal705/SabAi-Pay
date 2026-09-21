// frontend/src/components/settings/Appearance.jsx
// COMPLETE FIXED VERSION — works with current ThemeContext + AuthContext + index.css

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  FaUndo,
  FaSave,
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Appearance.css';

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_KEY = 'appearanceSettings';

// These map to the CSS variables in index.css that the entire
// app already uses (--primary-50 ... --primary-900).
// Changing the accent color means overriding all of them.
const COLOR_OPTIONS = [
  {
    id: 'indigo',
    name: 'Indigo',
    shades: {
      50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
      400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
      800: '#3730a3', 900: '#312e81',
    },
    swatch: '#4f46e5',
  },
  {
    id: 'purple',
    name: 'Purple',
    shades: {
      50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe',
      400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce',
      800: '#6b21a8', 900: '#581c87',
    },
    swatch: '#9333ea',
  },
  {
    id: 'pink',
    name: 'Pink',
    shades: {
      50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4',
      400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d',
      800: '#9d174d', 900: '#831843',
    },
    swatch: '#db2777',
  },
  {
    id: 'red',
    name: 'Red',
    shades: {
      50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
      400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
      800: '#991b1b', 900: '#7f1d1d',
    },
    swatch: '#dc2626',
  },
  {
    id: 'orange',
    name: 'Orange',
    shades: {
      50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
      400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
      800: '#9a3412', 900: '#7c2d12',
    },
    swatch: '#ea580c',
  },
  {
    id: 'green',
    name: 'Green',
    shades: {
      50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
      400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
      800: '#065f46', 900: '#064e3b',
    },
    swatch: '#059669',
  },
  {
    id: 'blue',
    name: 'Blue',
    shades: {
      50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
      400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
      800: '#1e40af', 900: '#1e3a8a',
    },
    swatch: '#2563eb',
  },
  {
    id: 'teal',
    name: 'Teal',
    shades: {
      50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
      400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
      800: '#115e59', 900: '#134e4a',
    },
    swatch: '#0d9488',
  },
];

const FONT_SIZE_OPTIONS = [
  { id: 'small',  name: 'Small',  px: 14, preview: '0.875rem' },
  { id: 'medium', name: 'Medium', px: 16, preview: '1rem' },
  { id: 'large',  name: 'Large',  px: 18, preview: '1.125rem' },
];

const FONT_FAMILY_OPTIONS = [
  { id: 'inter',   name: 'Inter',     value: "'Inter', sans-serif",       sample: 'Aa' },
  { id: 'roboto',  name: 'Roboto',    value: "'Roboto', sans-serif",      sample: 'Aa' },
  { id: 'poppins', name: 'Poppins',   value: "'Poppins', sans-serif",     sample: 'Aa' },
  { id: 'opensans',name: 'Open Sans', value: "'Open Sans', sans-serif",   sample: 'Aa' },
];

const DEFAULT_SETTINGS = {
  theme: 'light',
  colorId: 'indigo',
  fontSize: 'medium',
  fontFamily: 'inter',
  sidebarCollapsed: false,
  compactView: false,
};

// ============================================================
// HELPERS
// ============================================================

const getColorById = (id) => COLOR_OPTIONS.find((c) => c.id === id) || COLOR_OPTIONS[0];
const getFontSizeById = (id) => FONT_SIZE_OPTIONS.find((f) => f.id === id) || FONT_SIZE_OPTIONS[1];
const getFontFamilyById = (id) => FONT_FAMILY_OPTIONS.find((f) => f.id === id) || FONT_FAMILY_OPTIONS[0];

const loadSavedSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return null;
  }
};

/**
 * Apply appearance settings to the live document.
 * - Theme: handled by ThemeContext (dark class on <html>)
 * - Accent color: override all --primary-N variables from index.css
 * - Font size: set --app-font-size (used by body in index.css) + documentElement
 * - Font family: set --app-font-family on <html>
 * - Sidebar / compact: body classes
 */
const applyAppearanceToDocument = (settings, darkMode) => {
  const root = document.documentElement;

  // 1. Accent color — override the full --primary-N scale
  const color = getColorById(settings.colorId);
  Object.entries(color.shades).forEach(([shade, value]) => {
    root.style.setProperty(`--primary-${shade}`, value);
  });

  // 2. Font family
  const font = getFontFamilyById(settings.fontFamily);
  root.style.setProperty('--app-font-family', font.value);

  // 3. Font size — base px for rem calculations + a variable for scoped use
  const fontSize = getFontSizeById(settings.fontSize);
  root.style.setProperty('--app-font-size', `${fontSize.px}px`);

  // 4. Layout toggles
  document.body.classList.toggle('sidebar-collapsed', !!settings.sidebarCollapsed);
  document.body.classList.toggle('compact-view', !!settings.compactView);

  // 5. Theme (defensive — ThemeContext already handles this, but keep in sync)
  if (settings.theme === 'dark' && !darkMode) {
    root.classList.add('dark');
  } else if (settings.theme === 'light' && darkMode) {
    root.classList.remove('dark');
  }
};

// ============================================================
// COMPONENT
// ============================================================

const Appearance = () => {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop | tablet | mobile

  const [settings, setSettings] = useState(() => {
    const saved = loadSavedSettings();
    if (saved) return saved;
    return { ...DEFAULT_SETTINGS, theme: darkMode ? 'dark' : 'light' };
  });

  // ------------------------------------------------------------
  // Keep `theme` in settings in sync when user toggles dark mode
  // from the navbar (or anywhere else), so the Appearance page
  // reflects the actual current theme.
  // ------------------------------------------------------------
  useEffect(() => {
    setSettings((prev) => {
      const nextTheme = darkMode ? 'dark' : 'light';
      if (prev.theme === nextTheme) return prev;
      return { ...prev, theme: nextTheme };
    });
  }, [darkMode]);

  // ------------------------------------------------------------
  // Apply settings to the live document whenever they change.
  // ------------------------------------------------------------
  useEffect(() => {
    applyAppearanceToDocument(settings, darkMode);
  }, [settings, darkMode]);

  // ------------------------------------------------------------
  // Persist on unmount (so a page refresh doesn't lose unsaved tweaks)
  // ------------------------------------------------------------
  useEffect(() => {
    return () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        /* ignore quota errors */
      }
    };
  }, [settings]);

  // ------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------
  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleThemeChange = (theme) => {
    updateSetting('theme', theme);
    // Only toggle the context if it disagrees with the target theme
    if ((theme === 'dark') !== darkMode) {
      toggleDarkMode();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist to localStorage only — the backend has no appearance endpoint,
      // and AuthContext.updateUser only accepts name/email/profile_pic/dob/gender.
      // (Calling updateUser({ appearance }) here was the original bug.)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      applyAppearanceToDocument(settings, darkMode);
      toast.success('Appearance settings saved!');
    } catch (error) {
      console.error('Save appearance error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const fresh = { ...DEFAULT_SETTINGS, theme: darkMode ? 'dark' : 'light' };
    setSettings(fresh);
    applyAppearanceToDocument(fresh, darkMode);
    toast.success('Appearance reset to defaults');
  };

  // ------------------------------------------------------------
  // Derived preview values
  // ------------------------------------------------------------
  const activeColor = getColorById(settings.colorId);
  const activeFontSize = getFontSizeById(settings.fontSize);
  const activeFontFamily = getFontFamilyById(settings.fontFamily);

  const previewFirstName = (user?.name || 'User').split(' ')[0];
  const previewInitial = (user?.name || 'U').charAt(0).toUpperCase();

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="appearance-settings"
    >
      {/* ---------- HEADER ---------- */}
      <div className="settings-header">
        <h2>Appearance Settings</h2>
        <div className="header-actions">
          <button
            className="reset-btn"
            onClick={handleReset}
            disabled={saving}
            type="button"
          >
            <FaUndo style={{ marginRight: 6 }} /> Reset
          </button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saving}
            type="button"
          >
            {saving ? (
              <>
                <FaSpinner className="spinner" /> Saving…
              </>
            ) : (
              <>
                <FaSave style={{ marginRight: 6 }} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* ---------- LIVE PREVIEW ---------- */}
      <motion.div
        className="preview-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="preview-header">
          <h3>Live Preview</h3>
          <div className="preview-devices">
            <button
              type="button"
              className={`device-btn ${previewMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setPreviewMode('desktop')}
              title="Desktop View"
            >
              <FaLaptop />
            </button>
            <button
              type="button"
              className={`device-btn ${previewMode === 'tablet' ? 'active' : ''}`}
              onClick={() => setPreviewMode('tablet')}
              title="Tablet View"
            >
              <FaTabletAlt />
            </button>
            <button
              type="button"
              className={`device-btn ${previewMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setPreviewMode('mobile')}
              title="Mobile View"
            >
              <FaMobile />
            </button>
          </div>
        </div>

        <div className={`preview-container ${previewMode}`}>
          <div
            className="preview-card"
            style={{
              '--preview-primary': activeColor.shades[600],
              '--preview-primary-soft': activeColor.shades[50],
              fontFamily: activeFontFamily.value,
              fontSize: `${activeFontSize.px}px`,
            }}
          >
            {/* Preview header */}
            <div className="preview-header-bar">
              <div className="preview-logo-container">
                <div className="preview-logo-image-container">
                  <img
                    src={
                      darkMode
                        ? '/images/merchants/sabailogodark1.png'
                        : '/images/merchants/sabailogo.png'
                    }
                    alt="SabAI Pay"
                    className="preview-logo-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
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
                <span className="preview-user-name">{previewFirstName}</span>
                <div
                  className="preview-avatar"
                  style={{
                    background: `linear-gradient(135deg, ${activeColor.shades[600]} 0%, ${activeColor.shades[500]} 100%)`,
                  }}
                >
                  {user?.profile_pic ? (
                    <img
                      src={user.profile_pic}
                      alt={user?.name || 'User'}
                      className="preview-avatar-image"
                    />
                  ) : (
                    previewInitial
                  )}
                </div>
              </div>
            </div>

            {/* Preview body */}
            <div className="preview-content">
              <div className="preview-welcome">
                <h4>Welcome back, {previewFirstName}! 👋</h4>
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
                <button
                  type="button"
                  className="preview-btn primary"
                  style={{
                    backgroundColor: activeColor.shades[600],
                    borderColor: activeColor.shades[600],
                  }}
                >
                  Send Money
                </button>
                <button type="button" className="preview-btn secondary">
                  Request
                </button>
                <button type="button" className="preview-btn outline">
                  View All
                </button>
              </div>

              <div className="preview-recent">
                <h5>Recent Activity</h5>
                <div className="preview-activity-item">
                  <span
                    className="activity-dot"
                    style={{ backgroundColor: activeColor.shades[600] }}
                  />
                  <span className="activity-text">Payment to Rahul Kumar</span>
                  <span className="activity-amount">₹500</span>
                </div>
                <div className="preview-activity-item">
                  <span
                    className="activity-dot"
                    style={{ backgroundColor: activeColor.shades[600] }}
                  />
                  <span className="activity-text">Received from Priya</span>
                  <span className="activity-amount">₹1,250</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ---------- THEME ---------- */}
      <motion.div
        className="settings-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="card-header">
          {settings.theme === 'light' ? (
            <FaSun className="card-icon" />
          ) : (
            <FaMoon className="card-icon" />
          )}
          <h3>Theme</h3>
        </div>
        <div className="theme-options">
          <button
            type="button"
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
            type="button"
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

      {/* ---------- ACCENT COLOR ---------- */}
      <motion.div
        className="settings-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="card-header">
          <FaPalette className="card-icon" />
          <h3>Accent Color</h3>
        </div>
        <div className="color-options">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color.id}
              type="button"
              className={`color-option ${
                settings.colorId === color.id ? 'active' : ''
              }`}
              style={{ backgroundColor: color.swatch }}
              onClick={() => updateSetting('colorId', color.id)}
              title={color.name}
              aria-label={color.name}
            >
              {settings.colorId === color.id && <FaCheck />}
            </button>
          ))}
        </div>
        <p className="color-name">
          Selected: <strong>{activeColor.name}</strong>
        </p>
      </motion.div>

      {/* ---------- FONT ---------- */}
      <motion.div
        className="settings-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="card-header">
          <FaFont className="card-icon" />
          <h3>Font &amp; Text Size</h3>
        </div>

        <div className="font-size-section">
          <label>Text Size</label>
          <div className="font-size-options">
            {FONT_SIZE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`size-option ${
                  settings.fontSize === option.id ? 'active' : ''
                }`}
                onClick={() => updateSetting('fontSize', option.id)}
              >
                <span className="size-preview" style={{ fontSize: option.preview }}>
                  Aa
                </span>
                <span className="size-name">{option.name}</span>
                <span className="size-value">{option.px}px</span>
              </button>
            ))}
          </div>
        </div>

        <div className="font-family-section">
          <label>Font Family</label>
          <div className="font-family-options">
            {FONT_FAMILY_OPTIONS.map((font) => (
              <button
                key={font.id}
                type="button"
                className={`font-option ${
                  settings.fontFamily === font.id ? 'active' : ''
                }`}
                onClick={() => updateSetting('fontFamily', font.id)}
                style={{ fontFamily: font.value }}
              >
                <span className="font-sample">{font.sample}</span>
                <span className="font-name">{font.name}</span>
                {settings.fontFamily === font.id && (
                  <FaCheck className="check-icon" />
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ---------- LAYOUT ---------- */}
      <motion.div
        className="settings-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
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
                onChange={() =>
                  updateSetting('compactView', !settings.compactView)
                }
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
                onChange={() =>
                  updateSetting('sidebarCollapsed', !settings.sidebarCollapsed)
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="layout-preview">
            <div
              className="layout-preview-sidebar"
              style={{
                width: settings.sidebarCollapsed ? '60px' : '200px',
                transition: 'width 0.3s ease',
              }}
            >
              <div
                className="sidebar-item"
                style={{ width: settings.sidebarCollapsed ? '40px' : '160px' }}
              ></div>
              <div
                className="sidebar-item"
                style={{ width: settings.sidebarCollapsed ? '40px' : '160px' }}
              ></div>
              <div
                className="sidebar-item"
                style={{ width: settings.sidebarCollapsed ? '40px' : '160px' }}
              ></div>
            </div>
            <div
              className="layout-preview-content"
              style={{ padding: settings.compactView ? '8px' : '16px' }}
            >
              <div
                className="content-line"
                style={{ height: settings.compactView ? '20px' : '30px' }}
              ></div>
              <div
                className="content-line"
                style={{ height: settings.compactView ? '20px' : '30px' }}
              ></div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Appearance;