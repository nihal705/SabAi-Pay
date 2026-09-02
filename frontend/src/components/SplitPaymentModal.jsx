// frontend/src/components/SplitPaymentModal.jsx
// COMPLETE REDESIGNED VERSION - Fixed FaEqualizer issue

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaUserPlus, FaUsers, FaRupeeSign, FaCheckCircle, 
  FaSpinner, FaAdjust, FaSearch, FaTrash, FaUser,
  FaWhatsapp, FaEnvelope, FaLink, FaCopy, FaShare
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import './SplitPaymentModal.css';

const SplitPaymentModal = ({ totalAmount, onClose, onSplit, contacts }) => {
    const [splitType, setSplitType] = useState('equal');
    const [participants, setParticipants] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [shares, setShares] = useState({});
    const [loading, setLoading] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [splitLink, setSplitLink] = useState('');

    useEffect(() => {
        if (contacts.length > 0) {
            const initial = contacts.slice(0, 2).map(c => ({
                ...c,
                share: splitType === 'equal' ? totalAmount / 2 : 0
            }));
            setParticipants(initial);
            const shareObj = {};
            initial.forEach(p => {
                shareObj[p.id] = splitType === 'equal' ? totalAmount / 2 : 0;
            });
            setShares(shareObj);
            setSelectedContacts(initial.map(p => p.id));
        }
    }, [contacts, totalAmount]);

    const handleAddContact = (contact) => {
        if (selectedContacts.includes(contact.id)) return;
        
        const newParticipants = [...participants, { ...contact, share: 0 }];
        setParticipants(newParticipants);
        setSelectedContacts([...selectedContacts, contact.id]);
        
        const shareObj = { ...shares };
        shareObj[contact.id] = splitType === 'equal' ? totalAmount / newParticipants.length : 0;
        setShares(shareObj);
    };

    const handleRemoveContact = (contactId) => {
        const newParticipants = participants.filter(p => p.id !== contactId);
        setParticipants(newParticipants);
        setSelectedContacts(selectedContacts.filter(id => id !== contactId));
        
        const shareObj = { ...shares };
        delete shareObj[contactId];
        setShares(shareObj);
    };

    const handleShareChange = (contactId, value) => {
        const shareObj = { ...shares };
        shareObj[contactId] = parseFloat(value) || 0;
        setShares(shareObj);
    };

    const calculateEqualShares = () => {
        const equalShare = totalAmount / participants.length;
        const shareObj = {};
        participants.forEach(p => {
            shareObj[p.id] = equalShare;
        });
        setShares(shareObj);
    };

    const handleSplit = async () => {
        const totalShares = Object.values(shares).reduce((sum, val) => sum + val, 0);
        if (Math.abs(totalShares - totalAmount) > 0.01) {
            toast.error(`Total shares (₹${totalShares.toFixed(2)}) don't match total amount (₹${totalAmount})`);
            return;
        }

        setLoading(true);
        try {
            const splitData = {
                totalAmount,
                participants: participants.map(p => ({
                    id: p.id,
                    name: p.name,
                    vpa: p.vpa,
                    amount: shares[p.id] || 0
                })),
                note: 'Split payment',
                splitType
            };

            await onSplit(splitData);
            
            // Generate share link
            const link = `https://sabaipay.com/split/${Date.now()}`;
            setSplitLink(link);
            setShowShareModal(true);
            
            toast.success('Split payment created successfully!');
        } catch (error) {
            console.error('Split error:', error);
            toast.error('Failed to create split payment');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(splitLink);
        toast.success('Split link copied!');
    };

    const handleShareWhatsApp = () => {
        const message = `💰 Split payment of ₹${totalAmount}\n\n${participants.map(p => `${p.name}: ₹${(shares[p.id] || 0).toFixed(2)}`).join('\n')}\n\nPay here: ${splitLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
    };

    const filteredContacts = contacts.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.vpa?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Share Modal
    const ShareModal = () => (
        <motion.div 
            className="split-share-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
        >
            <button className="split-share-close" onClick={() => setShowShareModal(false)}>
                <FaTimes />
            </button>
            
            <div className="split-share-header">
                <FaCheckCircle className="split-share-icon" />
                <h3>Split Created!</h3>
                <p>Share with your friends</p>
            </div>

            <div className="split-share-body">
                <div className="split-share-summary">
                    <div className="split-share-total">
                        <span>Total Amount</span>
                        <strong>₹{totalAmount.toLocaleString()}</strong>
                    </div>
                    <div className="split-share-participants">
                        {participants.map(p => (
                            <div key={p.id} className="split-share-person">
                                <div className="split-share-avatar" style={{ backgroundColor: p.color || '#4f46e5' }}>
                                    {p.name?.charAt(0)}
                                </div>
                                <span>{p.name}</span>
                                <span className="split-share-amount">₹{(shares[p.id] || 0).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="split-share-link">
                    <input type="text" value={splitLink} readOnly />
                    <button onClick={handleCopyLink}><FaCopy /> Copy</button>
                </div>

                <div className="split-share-buttons">
                    <button className="share-btn whatsapp" onClick={handleShareWhatsApp}>
                        <FaWhatsapp /> WhatsApp
                    </button>
                    <button className="share-btn email" onClick={() => {
                        window.open(`mailto:?subject=Split Payment&body=Split payment of ₹${totalAmount}%0A%0A${participants.map(p => `${p.name}: ₹${(shares[p.id] || 0).toFixed(2)}`).join('%0A')}%0A%0APay here: ${splitLink}`);
                    }}>
                        <FaEnvelope /> Email
                    </button>
                </div>
            </div>

            <div className="split-share-footer">
                <button className="btn-secondary" onClick={() => setShowShareModal(false)}>Close</button>
                <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
        </motion.div>
    );

    return (
        <>
            <div className="split-modal-overlay" onClick={onClose}>
                <motion.div 
                    className="split-modal"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                >
                    <button className="split-modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>

                    <div className="split-modal-header">
                        <h2>Split Payment</h2>
                        <p className="split-modal-subtitle">Split ₹{totalAmount.toLocaleString()} with friends</p>
                    </div>

                    <div className="split-modal-body">
                        {/* Split Type Selection */}
                        <div className="split-type-section">
                            <button 
                                className={`split-type-btn ${splitType === 'equal' ? 'active' : ''}`}
                                onClick={() => {
                                    setSplitType('equal');
                                    calculateEqualShares();
                                }}
                            >
                                <FaAdjust />
                                Equal
                            </button>
                            <button 
                                className={`split-type-btn ${splitType === 'custom' ? 'active' : ''}`}
                                onClick={() => setSplitType('custom')}
                            >
                                <FaUserPlus />
                                Custom
                            </button>
                        </div>

                        {/* Search Contacts */}
                        <div className="split-search">
                            <FaSearch className="split-search-icon" />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <div className="split-search-results">
                                    {filteredContacts.slice(0, 5).map(contact => (
                                        <div 
                                            key={contact.id}
                                            className="split-search-item"
                                            onClick={() => handleAddContact(contact)}
                                        >
                                            <div className="split-search-avatar" style={{ backgroundColor: contact.color || '#4f46e5' }}>
                                                {contact.name?.charAt(0)}
                                            </div>
                                            <div className="split-search-info">
                                                <span>{contact.name}</span>
                                                <span>{contact.vpa}</span>
                                            </div>
                                            {selectedContacts.includes(contact.id) && (
                                                <FaCheckCircle className="split-search-check" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Participants List */}
                        <div className="split-participants">
                            {participants.map(participant => (
                                <div key={participant.id} className="split-participant">
                                    <div className="split-participant-info">
                                        <div className="split-participant-avatar" style={{ backgroundColor: participant.color || '#4f46e5' }}>
                                            {participant.name?.charAt(0)}
                                        </div>
                                        <span>{participant.name}</span>
                                    </div>
                                    <div className="split-participant-share">
                                        <span>₹</span>
                                        <input
                                            type="number"
                                            value={shares[participant.id] || 0}
                                            onChange={(e) => handleShareChange(participant.id, e.target.value)}
                                            min="0"
                                            step="1"
                                            disabled={splitType === 'equal'}
                                        />
                                        <button 
                                            className="split-participant-remove"
                                            onClick={() => handleRemoveContact(participant.id)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="split-summary">
                            <div className="split-summary-row">
                                <span>Total</span>
                                <span>₹{totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="split-summary-row">
                                <span>Participants</span>
                                <span>{participants.length}</span>
                            </div>
                            <div className="split-summary-row highlight">
                                <span>Per Person</span>
                                <span>₹{(totalAmount / (participants.length || 1)).toFixed(2)}</span>
                            </div>
                            <div className="split-summary-row total">
                                <span>Total Shares</span>
                                <span>₹{Object.values(shares).reduce((sum, val) => sum + val, 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="split-modal-footer">
                        <button className="split-cancel-btn" onClick={onClose}>Cancel</button>
                        <button className="split-confirm-btn" onClick={handleSplit} disabled={loading || participants.length < 2}>
                            {loading ? <FaSpinner className="spinner" /> : 'Create Split'}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <div className="split-share-overlay" onClick={() => setShowShareModal(false)}>
                        <ShareModal />
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SplitPaymentModal;