import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaUniversity, 
  FaLock, 
  FaBell, 
  FaPalette, 
  FaLanguage, 
  FaQuestionCircle,
  FaShieldAlt,
  FaMobile,
  FaCreditCard,
  FaHistory,
  FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Profile from '../components/settings/Profile';
import BankAccounts from '../components/settings/BankAccounts';
import Security from '../components/settings/Security';
import Notifications from '../components/settings/Notifications';
import Appearance from '../components/settings/Appearance';
import HelpSupport from '../components/settings/HelpSupport';
import './SettingsPage.css';

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');

  // Update URL when tab changes
  useEffect(() => {
    navigate(`/settings?tab=${activeTab}`, { replace: true });
  }, [activeTab, navigate]);

  const tabs = [
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: FaUser,
      component: Profile
    },
    { 
      id: 'bank', 
      label: 'UPI & Bank Accounts', 
      icon: FaUniversity,
      component: BankAccounts
    },
    { 
      id: 'security', 
      label: 'Security', 
      icon: FaLock,
      component: Security
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: FaBell,
      component: Notifications
    },
    { 
      id: 'appearance', 
      label: 'Appearance', 
      icon: FaPalette,
      component: Appearance
    },
    { 
      id: 'help', 
      label: 'Help & Support', 
      icon: FaQuestionCircle,
      component: HelpSupport
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Profile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="settings-page"
    >
      <div className="settings-page-header">
        <h1>Settings</h1>
        <p className="subtitle">Manage your account preferences</p>
      </div>

      <div className="settings-layout">
        {/* Sidebar */}
        <div className="settings-sidebar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="tab-icon" />
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
          
          {/* Logout Button */}
          <button className="sidebar-tab logout" onClick={logout}>
            <FaSignOutAlt className="tab-icon" />
            <span className="tab-label">Logout</span>
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          <ActiveComponent />
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;