// frontend/src/components/chat/AgentPinModal.jsx
// Shared PIN entry modal for Agent Pay

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import { verifyBankPin, hasUpiPin } from '../../services/storageService';
import toast from 'react-hot-toast';
import './AgentPinModal.css';

const AgentPinModal = ({
    isOpen,
    onClose,
    onConfirm,
    bankName,
    bankAccountId,
    amount,
    purpose = 'payment',
    loading = false
}) => {
    const [pinDigits, setPinDigits] = useState(['', '', '', '']);
    const [pinFilled, setPinFilled] = useState([false, false, false, false]);
    const [pinError, setPinError] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const pinInputRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            // Reset state when opened
            setPinDigits(['', '', '', '']);
            setPinFilled([false, false, false, false]);
            setPinError('');
            setShowPin(false);
            setVerifying(false);
            // Focus first input
            setTimeout(() => {
                pinInputRefs.current[0]?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handlePinChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return;
        
        const newPin = [...pinDigits];
        newPin[index] = value || '';
        setPinDigits(newPin);
        
        const newFilled = [...pinFilled];
        newFilled[index] = value !== '';
        setPinFilled(newFilled);
        
        if (value && index < 3) {
            pinInputRefs.current[index + 1]?.focus();
        }
        
        // Clear error when user starts typing
        if (pinError) setPinError('');
    };

    const handlePinKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
            pinInputRefs.current[index - 1]?.focus();
        }
        
        if (e.key === 'Enter') {
            handleVerify();
        }
    };

    const handleVerify = async () => {
        const pinString = pinDigits.join('');
        if (pinString.length !== 4) {
            setPinError('Please enter complete PIN');
            return;
        }

        setVerifying(true);
        
        try {
            // Check if bank has PIN
            const hasPin = await hasUpiPin(bankAccountId);
            if (!hasPin) {
                setPinError(`No PIN set for ${bankName}. Please set PIN in Settings.`);
                setVerifying(false);
                return;
            }
            
            // Verify PIN
            const isValid = await verifyBankPin(bankAccountId, pinString);
            
            if (!isValid) {
                setPinError('Incorrect PIN. Please try again.');
                setPinDigits(['', '', '', '']);
                setPinFilled([false, false, false, false]);
                pinInputRefs.current[0]?.focus();
                setVerifying(false);
                return;
            }
            
            // PIN verified
            setPinError('');
            await onConfirm(pinString);
            
        } catch (error) {
            console.error('PIN verification error:', error);
            setPinError('Verification failed. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const getPurposeText = () => {
        switch(purpose) {
            case 'send_money': return 'Send Money';
            case 'pay_bill': return 'Pay Bill';
            case 'recharge': return 'Mobile Recharge';
            case 'multi_payment': return 'Multi Payment';
            default: return 'Confirm Payment';
        }
    };

    const getPurposeEmoji = () => {
        switch(purpose) {
            case 'send_money': return '💸';
            case 'pay_bill': return '🧾';
            case 'recharge': return '📱';
            case 'multi_payment': return '📋';
            default: return '💳';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="agent-pin-overlay" onClick={onClose}>
            <motion.div 
                className="agent-pin-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
            >
                <button className="agent-pin-close" onClick={onClose}>
                    <FaTimes />
                </button>

                <div className="agent-pin-header">
                    <div className="agent-pin-icon">{getPurposeEmoji()}</div>
                    <h3>{getPurposeText()}</h3>
                    {amount && (
                        <p className="agent-pin-amount">₹{amount.toLocaleString()}</p>
                    )}
                    <p className="agent-pin-bank">Enter UPI PIN for {bankName}</p>
                </div>

                <div className="agent-pin-inputs">
                    {pinDigits.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => pinInputRefs.current[index] = el}
                            type={showPin ? 'text' : 'password'}
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handlePinChange(index, e.target.value)}
                            onKeyDown={(e) => handlePinKeyDown(e, index)}
                            className={`agent-pin-input ${pinFilled[index] ? 'filled' : ''}`}
                            autoFocus={index === 0}
                            inputMode="numeric"
                            disabled={loading || verifying}
                        />
                    ))}
                </div>

                <label className="agent-pin-show">
                    <input 
                        type="checkbox" 
                        checked={showPin} 
                        onChange={() => setShowPin(!showPin)}
                        disabled={loading || verifying}
                    />
                    <span>Show PIN</span>
                    {showPin ? <FaEye /> : <FaEyeSlash />}
                </label>

                {pinError && (
                    <p className="agent-pin-error">{pinError}</p>
                )}

                <div className="agent-pin-actions">
                    <button 
                        className="agent-pin-cancel"
                        onClick={onClose}
                        disabled={loading || verifying}
                    >
                        Cancel
                    </button>
                    <button 
                        className="agent-pin-confirm"
                        onClick={handleVerify}
                        disabled={loading || verifying || pinDigits.some(d => !d)}
                    >
                        {verifying ? 'Verifying...' : 'Confirm'}
                    </button>
                </div>

                <p className="agent-pin-note">
                    🔒 PIN is encrypted and never stored
                </p>
            </motion.div>
        </div>
    );
};

export default AgentPinModal;