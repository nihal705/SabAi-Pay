// frontend/src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Register from '../components/auth/Register';
import OTPVerification from '../components/auth/OTPVerification';
import GoogleAccountPicker from '../components/auth/GoogleAccountPicker';
import { AnimatePresence } from 'framer-motion';

const RegisterPage = () => {
  const [step, setStep] = useState('register'); // register, otp, google-picker
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleRegisterSubmit = async (data) => {
    setPhoneNumber(data.phone_number);
    setUserData(data);
    
    // Send OTP
    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: data.phone_number,
          purpose: 'register'
        })
      });
      setStep('otp');
    } catch (error) {
      console.error('Failed to send OTP:', error);
    }
  };

  const handleOTPSuccess = async () => {
    // After OTP verification, show Google account picker
    setStep('google-picker');
  };

  const handleGoogleSelect = async (selectedAccount) => {
    try {
      // API call to complete registration with Google account
      const response = await fetch('/api/auth/register-with-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          google_account: selectedAccount,
          user_data: userData
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Google selection error:', error);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('register');
    } else if (step === 'google-picker') {
      setStep('otp');
    }
  };

  return (
    <AnimatePresence mode="wait">
      {step === 'register' && (
        <Register 
          key="register"
          onSubmit={handleRegisterSubmit}
        />
      )}
      
      {step === 'otp' && (
        <OTPVerification 
          key="otp"
          phoneNumber={phoneNumber}
          onBack={handleBack}
          onSuccess={handleOTPSuccess}
        />
      )}
      
      {step === 'google-picker' && (
        <GoogleAccountPicker
          key="google-picker"
          phoneNumber={phoneNumber}
          onSelect={handleGoogleSelect}
          onBack={handleBack}
          isRegistration={true}
        />
      )}
    </AnimatePresence>
  );
};

export default RegisterPage;