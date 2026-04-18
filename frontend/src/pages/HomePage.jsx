// frontend/src/pages/HomePage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FaRobot, 
  FaShieldAlt, 
  FaCoins, 
  FaArrowRight, 
  FaGooglePay, 
  FaPhone, 
  FaQrcode,
  FaGift,
  FaRocket,
  FaChartLine
} from 'react-icons/fa';
import { SiPhonepe, SiPaytm } from 'react-icons/si';
import './HomePage.css';

const HomePage = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: FaRobot,
      title: 'AI-Powered Assistant',
      description: 'Meet SabAI, your intelligent payment assistant that understands natural language',
      color: '#4f46e5',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      stats: '24/7 Support',
      detail: 'Ask anything, pay anyone'
    },
    {
      icon: FaShieldAlt,
      title: 'Reserve Pay',
      description: 'PIN-less payments with monthly limits for trusted merchants',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      stats: '100% Secure',
      detail: 'Set limits, spend safely'
    },
    {
      icon: FaCoins,
      title: 'SabAI Coins',
      description: 'Earn rewards on every transaction and redeem them for exciting offers',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      stats: 'Earn 1% Back',
      detail: 'Redeem instantly'
    }
  ];

  const stats = [
    { value: '10M+', label: 'Active Users', icon: FaChartLine },
    { value: '₹500Cr+', label: 'Transactions', icon: FaRocket },
    { value: '4.8★', label: 'App Rating', icon: FaGift }
  ];

  const partners = [
    { icon: FaGooglePay, name: 'Google Pay', color: '#4285F4' },
    { icon: SiPhonepe, name: 'PhonePe', color: '#5F259F' },
    { icon: SiPaytm, name: 'Paytm', color: '#00BAF2' }
  ];

  return (
    <div className="homepage">
      {/* Animated Background */}
      <div className="homepage-background">
        <div className="gradient-orb"></div>
        <div className="gradient-orb secondary"></div>
        <div className="floating-shapes">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="shape"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 10 + 10}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        className="hero-section"
        initial={{ opacity: 0, y: 30 }}
        animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-content">
          <motion.div 
            className="hero-brand"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src={darkMode ? "/images/merchants/sabailogodark1.png" : "/images/merchants/sabailogo.png"}
              alt="SabAI Pay" 
              className="hero-logo"
            />
            <div className="hero-title">
              <span className="hero-sab">Sab</span>
              <span className="hero-ai">AI</span>
              <span className="hero-pay">Pay</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            The Future of <span className="gradient-text">Payments</span> is Here
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Experience AI-powered UPI payments with intelligent assistance, 
            reward points, and bank-grade security. Join millions who trust SabAI Pay.
          </motion.p>

          {user ? (
            <motion.div
              className="cta-buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button 
                className="cta-button primary"
                onClick={() => navigate('/dashboard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Go to Dashboard <FaArrowRight className="button-icon" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              className="cta-buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button 
                className="cta-button primary"
                onClick={() => navigate('/register')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Free <FaRocket className="button-icon" />
              </motion.button>
              <motion.button 
                className="cta-button secondary"
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Floating Elements */}
        <motion.div 
          className="floating-card card-1"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <FaRobot /> AI Assistant
        </motion.div>
        <motion.div 
          className="floating-card card-2"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
        >
          <FaCoins /> +50 Coins
        </motion.div>
        <motion.div 
          className="floating-card card-3"
          animate={{ y: [0, -25, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: 2 }}
        >
          <FaShieldAlt /> Secure
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <motion.section 
        className="stats-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="stat-card"
              whileHover={{ scale: 1.05, y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <stat.icon className="stat-icon" />
              <div>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="features-section">
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Why Choose <span className="gradient-text">SabAI Pay</span>?
        </motion.h2>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              <div 
                className="feature-icon-wrapper"
                style={{ background: feature.gradient }}
              >
                <feature.icon />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-footer">
                <span className="feature-stats">{feature.stats}</span>
                <span className="feature-detail">{feature.detail}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Partners Section */}
      <motion.section 
        className="partners-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h3>Works with all UPI apps</h3>
        <div className="partners-grid">
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              className="partner-card"
              whileHover={{ scale: 1.1, y: -5 }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <partner.icon style={{ color: partner.color }} />
              <span>{partner.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      {!user && (
        <motion.section 
          className="cta-section"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="cta-content">
            <h2>Ready to experience the future of payments?</h2>
            <p>Join millions of users who trust SabAI Pay for their daily transactions</p>
            <motion.button
              className="cta-button large"
              onClick={() => navigate('/register')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Free Account <FaArrowRight />
            </motion.button>
          </div>
          <div className="cta-background"></div>
        </motion.section>
      )}
    </div>
  );
};

export default HomePage;