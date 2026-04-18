// frontend/src/components/auth/GoogleAccountPicker.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGoogle, FaCheckCircle, FaArrowRight, FaArrowLeft, FaPlus } from 'react-icons/fa';
import './GoogleAccountPicker.css';

const GoogleAccountPicker = ({ phoneNumber, profiles = [], onSelect, onBack, isRegistration = false }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadGoogleAccounts();
    }, []);

    const loadGoogleAccounts = async () => {
        try {
            setLoading(true);
            
            // If we have existing profiles, use them
            if (profiles && profiles.length > 0) {
                const formattedAccounts = profiles.map(profile => ({
                    email: profile.email,
                    name: profile.name,
                    picture: profile.profile_pic,
                    google_id: profile.google_id,
                    is_existing: true,
                    last_login: profile.last_login
                }));
                setAccounts(formattedAccounts);
                setLoading(false);
                return;
            }

            // Otherwise, fetch from Google
            // First, get Google auth URL
            const urlResponse = await fetch('/api/auth/google/url');
            const urlData = await urlResponse.json();
            
            if (urlData.success) {
                // Open Google sign-in popup
                const width = 500;
                const height = 600;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;
                
                const popup = window.open(
                    urlData.data.url,
                    'google-auth',
                    `width=${width},height=${height},left=${left},top=${top}`
                );

                // Listen for message from popup
                const messageHandler = (event) => {
                    if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                        setAccounts(prev => [...prev, {
                            ...event.data.account,
                            is_new: true
                        }]);
                        setSelectedAccount(event.data.account);
                        popup?.close();
                    }
                };

                window.addEventListener('message', messageHandler);

                // Check if popup closed without success
                const checkPopup = setInterval(() => {
                    if (popup?.closed) {
                        clearInterval(checkPopup);
                        window.removeEventListener('message', messageHandler);
                        if (accounts.length === 0) {
                            // If no accounts loaded, show demo accounts
                            setAccounts([
                                {
                                    email: 'demo@gmail.com',
                                    name: 'Demo User',
                                    picture: null,
                                    google_id: 'demo_1',
                                    is_demo: true
                                },
                                {
                                    email: 'work@example.com',
                                    name: 'Work Account',
                                    picture: null,
                                    google_id: 'demo_2',
                                    is_demo: true
                                }
                            ]);
                        }
                        setLoading(false);
                    }
                }, 1000);

                return () => {
                    clearInterval(checkPopup);
                    window.removeEventListener('message', messageHandler);
                };
            }
            
        } catch (error) {
            console.error('Failed to load Google accounts:', error);
            // Show demo accounts on error
            setAccounts([
                {
                    email: 'demo@gmail.com',
                    name: 'Demo User',
                    picture: null,
                    google_id: 'demo_1',
                    is_demo: true
                },
                {
                    email: 'work@example.com',
                    name: 'Work Account',
                    picture: null,
                    google_id: 'demo_2',
                    is_demo: true
                }
            ]);
            setLoading(false);
        }
    };

    const handleSelectAccount = (account) => {
        setSelectedAccount(account);
    };

    const handleContinue = () => {
        if (!selectedAccount) return;
        onSelect(selectedAccount);
    };

    const filteredAccounts = accounts.filter(account =>
        account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div
            className="google-picker-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="google-picker-modal"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
            >
                <button className="back-button" onClick={onBack}>
                    <FaArrowLeft /> Back
                </button>

                <div className="google-picker-header">
                    <FaGoogle className="google-icon" />
                    <h2>{isRegistration ? 'Choose an account to link' : 'Choose an account'}</h2>
                    <p className="google-picker-subtitle">
                        {isRegistration 
                            ? 'Link your Google account to complete registration'
                            : 'Select which account to use with this phone number'
                        }
                    </p>
                    <div className="google-picker-phone">
                        <span>{phoneNumber}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="google-picker-loading">
                        <div className="loader"></div>
                        <p>Loading your accounts...</p>
                    </div>
                ) : (
                    <>
                        <div className="google-picker-search">
                            <input
                                type="text"
                                placeholder="Search accounts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="google-accounts-list">
                            <AnimatePresence>
                                {filteredAccounts.map((account, index) => (
                                    <motion.div
                                        key={account.email}
                                        className={`google-account-item ${selectedAccount?.email === account.email ? 'selected' : ''} 
                                            ${account.is_existing ? 'existing' : ''} ${account.is_demo ? 'demo' : ''}`}
                                        onClick={() => handleSelectAccount(account)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="account-avatar">
                                            {account.picture ? (
                                                <img src={account.picture} alt={account.name} />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {account.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="account-details">
                                            <h4>{account.name}</h4>
                                            <p>{account.email}</p>
                                            {account.is_existing && (
                                                <span className="account-badge">Previously used</span>
                                            )}
                                            {account.is_demo && (
                                                <span className="account-badge demo">Demo Account</span>
                                            )}
                                        </div>
                                        {selectedAccount?.email === account.email && (
                                            <FaCheckCircle className="selected-icon" />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        <div className="google-picker-footer">
                            <button
                                className="add-account-btn"
                                onClick={loadGoogleAccounts}
                            >
                                <FaPlus /> Add another account
                            </button>
                            
                            <button
                                className="continue-btn"
                                onClick={handleContinue}
                                disabled={!selectedAccount}
                            >
                                Continue <FaArrowRight />
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

export default GoogleAccountPicker;