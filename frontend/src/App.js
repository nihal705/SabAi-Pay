// frontend/src/App.js

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * For licensing inquiries: support@sabai-pay.com
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { PaymentProvider } from './context/PaymentContext';

// Layout Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import PrivateRoute from './components/common/PrivateRoute';
import LoadingScreen from './components/common/LoadingScreen';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import OTPVerification from './components/auth/OTPVerification';

// Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import SendMoneyPage from './pages/SendMoneyPage';
import RequestMoneyPage from './pages/RequestMoneyPage';
import BillPaymentsPage from './pages/BillPaymentsPage';
import AgentChatPage from './pages/AgentChatPage';
import ReservePayPage from './pages/ReservePayPage';
import CoinsPage from './pages/CoinsPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import AboutUs from './pages/AboutUs';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import QRCodePage from './pages/QRCodePage';
import MobileRechargePage from './pages/MobileRechargePage';
import ConnectAppsPage from './pages/ConnectAppsPage';

// Styles
import './index.css';
import './App.css';
import './components/common/Navbar.css';
import './components/common/Footer.css';
import './pages/DashboardPage.css';
import './components/auth/Auth.css';
import './components/coins/CoinStyles.css';

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  // Show loading screen for minimum 2 seconds on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingScreen(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Show loading screen first
  if (showLoadingScreen) {
    return <LoadingScreen minimumDisplayTime={2000} />;
  }

  // Then show auth loading
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading SabAI Pay...</p>
      </div>
    );
  }

  const token = localStorage.getItem('token');
if (token) {
    // Verify token validity by making a profile request
    fetch('http://localhost:5000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {
        // If fails, clear token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    });
}

  return (
    <PaymentProvider>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/verify-otp" element={!user ? <OTPVerification /> : <Navigate to="/dashboard" />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/about" element={<AboutUs />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } />
            <Route path="/connect-apps" element={
              <PrivateRoute>
                <ConnectAppsPage />
              </PrivateRoute>
            } />
            <Route path="/send-money" element={
              <PrivateRoute>
                <SendMoneyPage />
              </PrivateRoute>
            } />
            <Route path="/request-money" element={
              <PrivateRoute>
                <RequestMoneyPage />
              </PrivateRoute>
            } />
            <Route path="/bills" element={
              <PrivateRoute>
                <BillPaymentsPage />
              </PrivateRoute>
            } />
            <Route path="/agent" element={
              <PrivateRoute>
                <AgentChatPage />
              </PrivateRoute>
            } />
            <Route path="/reserve-pay" element={
              <PrivateRoute>
                <ReservePayPage />
              </PrivateRoute>
            } />
            <Route path="/coins" element={
              <PrivateRoute>
                <CoinsPage />
              </PrivateRoute>
            } />
            <Route path="/transactions" element={
              <PrivateRoute>
                <TransactionHistoryPage />
              </PrivateRoute>
            } />
            <Route path="/qr-code" element={
              <PrivateRoute>
                <QRCodePage />
              </PrivateRoute>
            } />
            <Route path="/settings/*" element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            } />
            <Route path="/mobile-recharge" element={
                <PrivateRoute>
                    <MobileRechargePage />
                </PrivateRoute>
            } />

            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </PaymentProvider>
  );
}

export default App;