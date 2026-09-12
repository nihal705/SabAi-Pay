// frontend/src/pages/HomePage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaRobot, FaShieldAlt, FaCoins, FaArrowRight, FaGooglePay, FaQrcode, FaRocket, FaWallet, FaMobileAlt, FaFileInvoiceDollar,
  FaStore, FaUserFriends, FaCheckCircle, FaStar, FaClock, FaLock, FaThumbsUp } from 'react-icons/fa';
import { SiPhonepe, SiPaytm } from 'react-icons/si';
import './HomePage.css';
import RobotCompanion from '../components/robot/RobotCompanion';

const HomePage = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  const features = [
  {
    icon: FaRobot,
    title: 'AI-Powered Assistant',
    description: 'Meet SabAI, your intelligent payment assistant that understands natural language and helps you with everything from payments to orders.',
    color: '#4F46E5',
    bgColor: 'rgba(79,70,229,0.08)',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    stats: '24/7 Support',
    detail: 'Ask anything, pay anyone',
    delay: 0.1
  },
  {
    icon: FaShieldAlt,
    title: 'Reserve Pay',
    description: 'Set monthly spending limits for trusted merchants and make PIN-less payments up to your limit. Perfect for subscriptions and recurring bills.',
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.08)',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    stats: '100% Secure',
    detail: 'Set limits, spend safely',
    delay: 0.2
  },
  {
    icon: FaCoins,
    title: 'SabAI Coins',
    description: 'Earn rewards on every transaction and redeem them for exciting offers. The more you transact, the more you earn.',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.08)',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    stats: 'Earn 1% Back',
    detail: 'Redeem instantly',
    delay: 0.3
  },
  {
  icon: FaClock,
  title: 'UPI AutoPay',
  description: 'Schedule recurring payments for subscriptions, bills, and more. Set it and forget it. Never miss a due date with automatic, hassle-free payments that work seamlessly with your bank accounts.',
  color: '#EC4899',
  bgColor: 'rgba(236,72,153,0.08)',
  gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
  stats: 'Scheduled',
  detail: 'Automatic payments',
  delay: 0.4
}
];

  const benefits = [
    {
      icon: FaWallet,
      title: 'Multiple Bank Accounts',
      description: 'Add and manage multiple bank accounts with individual UPI PINs for each',
      color: '#4F46E5'
    },
    {
      icon: FaMobileAlt,
      title: 'Mobile Recharge',
      description: 'Recharge prepaid mobile numbers instantly with payments',
      color: '#10B981'
    },
    {
      icon: FaFileInvoiceDollar,
      title: 'Bill Payments',
      description: 'Pay utility bills and set up AutoPay for recurring payments',
      color: '#F59E0B'
    },
    {
      icon: FaStore,
      title: 'Merchant Connect',
      description: 'Connect with merchants and place orders through the AI Agent',
      color: '#EF4444'
    },
    {
      icon: FaUserFriends,
      title: 'Request & Split',
      description: 'Request money from friends or split bills with multiple people',
      color: '#3B82F6'
    },
    {
      icon: FaQrcode,
      title: 'QR Code Payments',
      description: 'Scan and pay with QR codes at any supported merchant',
      color: '#8B5CF6'
    }
  ];

  const partners = [
    { icon: FaGooglePay, name: 'Google Pay', color: '#4285F4' },
    { icon: SiPhonepe, name: 'PhonePe', color: '#5F259F' },
    { icon: SiPaytm, name: 'Paytm', color: '#00BAF2' }
  ];

  const testimonials = [
    {
      name: 'Rahul Sharma',
      role: 'Merchant',
      content: 'SabAI Pay has transformed how I manage payments. The AI Assistant makes ordering so easy!',
      rating: 5,
      avatar: 'RS'
    },
    {
      name: 'Priya Patel',
      role: 'Freelancer',
      content: 'I love the Reserve Pay feature. It helps me control my spending without worrying about PINs.',
      rating: 5,
      avatar: 'PP'
    },
    {
      name: 'Amit Kumar',
      role: 'Student',
      content: 'Earning SabAI Coins on every transaction is a great bonus. I use it for all my daily payments.',
      rating: 5,
      avatar: 'AK'
    }
  ];

  return (
    <div className="homepage">
      {/* Animated Background */}
      <div className="homepage-background">
        <div className="gradient-orb"></div>
        <div className="gradient-orb secondary"></div>
        <div className="gradient-orb tertiary"></div>
        <div className="floating-shapes">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="shape"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 10 + 10}s`,
                width: `${Math.random() * 40 + 20}px`,
                height: `${Math.random() * 40 + 20}px`
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
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.img 
              src={darkMode ? "/images/merchants/sabailogodark1.png" : "/images/merchants/sabailogo.png"}
              alt="SabAI Pay" 
              className="hero-logo"
              whileHover={{ rotate: -5, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
            <div className="hero-title">
              <span className="hero-sab">Sab</span>
              <span className="hero-ai">AI</span>
              <span className="hero-pay">Pay</span>
            </div>
          </motion.div>

          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FaThumbsUp />
            <span>India's Most Trusted Payment Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: '3rem' }}
          >
            Smart Payments <span className="gradient-text">Powered by AI</span>
          </motion.h1>
          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Experience the future of payments with AI-powered assistance, 
            reward points, and bank-grade security. Join thousands who trust SabAI Pay.
          </motion.p>

          <motion.div
            className="hero-features-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <span><FaCheckCircle /> Instant Setup</span>
            <span><FaCheckCircle /> 100% Secure</span>
            <span><FaCheckCircle /> 24/7 Support</span>
          </motion.div>

          {user ? (
            <motion.div
              className="cta-buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button 
                className="cta-button primary"
                onClick={() => navigate('/dashboard')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Go to Dashboard <FaArrowRight className="button-icon" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              className="cta-buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button 
                className="cta-button primary"
                onClick={() => navigate('/register')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Get Started Free <FaRocket className="button-icon" />
              </motion.button>
              <motion.button 
                className="cta-button secondary"
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
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
          <FaRobot className="card-icon" style={{ color: '#4F46E5' }} />
          <span>AI Assistant</span>
        </motion.div>
        <motion.div 
          className="floating-card card-2"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
        >
          <FaCoins className="card-icon" style={{ color: '#F59E0B' }} />
          <span>+50 Coins</span>
        </motion.div>
        <motion.div 
          className="floating-card card-3"
          animate={{ y: [0, -25, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: 2 }}
        >
          <FaShieldAlt className="card-icon" style={{ color: '#10B981' }} />
          <span>Secure</span>
        </motion.div>
        <motion.div 
          className="floating-card card-4"
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, delay: 1.5 }}
        >
          <FaWallet className="card-icon" style={{ color: '#8B5CF6' }} />
          <span>Wallet</span>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="features-section">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="section-badge">Features</span>
          <h2 className="section-title">
            Why Choose <span className="gradient-text">SabAI Pay</span>?
          </h2>
          <p className="section-subtitle">
            Everything you need for smart, secure, and rewarding payments
          </p>
        </motion.div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: feature.delay }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
            >
              <div 
                className="feature-icon-wrapper"
                style={{ background: feature.bgColor }}
              >
                <feature.icon style={{ color: feature.color, fontSize: '28px' }} />
              </div>
              <h3>{feature.title}</h3>
              <p className='feature-description'>{feature.description}</p>
              <div className="feature-footer">
                <span className="feature-stats" style={{ color: feature.color }}>
                  {feature.stats}
                </span>
                <span className="feature-detail">{feature.detail}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="benefits-section">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="section-badge">Benefits</span>
          <h2 className="section-title">
            Everything You <span className="gradient-text">Need</span>
          </h2>
          <p className="section-subtitle">
            From payments to AI assistance — all in one place
          </p>
        </motion.div>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="benefit-card"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
            >
              <div className="benefit-icon-wrapper" style={{ background: `${benefit.color}12` }}>
                <benefit.icon style={{ color: benefit.color }} />
              </div>
              <h4>{benefit.title}</h4>
              <p>{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="section-badge">Testimonials</span>
          <h2 className="section-title">
            What Our <span className="gradient-text">Users Say</span>
          </h2>
        </motion.div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="testimonial-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
            >
              <div className="testimonial-rating">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <FaStar key={i} className="star-icon" />
                ))}
              </div>
              <p className="testimonial-content">"{testimonial.content}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  {testimonial.avatar}
                </div>
                <div>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
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
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, scale: 0.9 }}
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
            <div className="cta-badge">🚀 Get Started</div>
            <h2>Ready to experience <br />the future of payments?</h2>
            <p>Join thousands of users who trust SabAI Pay for their daily transactions</p>
            <motion.button
              className="cta-button large"
              onClick={() => navigate('/register')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Create Free Account <FaArrowRight />
            </motion.button>
            <div className="cta-features">
              <span><FaCheckCircle /> Free to use</span>
              <span><FaLock /> 100% secure</span>
              <span><FaClock /> Instant setup</span>
            </div>
          </div>
          <div className="cta-background"></div>
        </motion.section>
      )}

      <RobotCompanion />
    </div>
  );
};

export default HomePage;