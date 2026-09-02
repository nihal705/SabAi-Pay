import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUniversity, FaExchangeAlt, FaMobileAlt, FaFileInvoiceDollar, FaRobot, FaShieldAlt, FaArrowRight, FaWallet, FaCreditCard,
  FaHistory, FaBell, FaQuestionCircle, FaLock, FaUserFriends, FaStore, FaRocket, FaBookOpen, FaPlay, FaChevronDown, FaChevronUp, FaExternalLinkAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './UserGuidePage.css';

const UserGuidePage = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const quickStartSteps = [
    {
      id: 'step1',
      icon: FaUniversity,
      title: 'Set up your wallet',
      description: 'Add dummy bank accounts and set UPI PINs',
      details: [
        'Go to Settings → Bank Accounts',
        'Click "Add Bank Account" and enter dummy bank details',
        'Set a 4-digit UPI PIN for each account (remember it!)',
        'Use "Deposit" to add test funds to your accounts'
      ],
      tip: '💡 Use different PINs for different accounts to test PIN validation'
    },
    {
      id: 'step2',
      icon: FaExchangeAlt,
      title: 'Make a secure payment',
      description: 'Send money to friends or self-transfer',
      details: [
        'Go to Send Money from the navigation',
        'Enter a contact or test VPA (e.g., test@pay)',
        'Choose which bank account to pay from',
        'Enter your 4-digit UPI PIN to authorize',
        'Check Transaction History to confirm'
      ],
      tip: '💡 Self-transfer is great for testing - move money between your own accounts'
    },
    {
      id: 'step3',
      icon: FaMobileAlt,
      title: 'Recharge & pay bills',
      description: 'Test mobile recharges and bill payments',
      details: [
        'Go to Recharge for mobile plans',
        'Enter a test 10-digit number, select operator & circle',
        'Choose a plan and payment method',
        'Go to Bills to add and manage utilities',
        'Enable AutoPay for recurring bills'
      ],
      tip: '💡 Dummy payments never charge real money - perfect for testing!'
    },
    {
      id: 'step4',
      icon: FaFileInvoiceDollar,
      title: 'Reserve Pay controls',
      description: 'Set monthly spending limits',
      details: [
        'Go to Reserve Pay from the navigation',
        'Create a monthly limit for a merchant',
        'Any spending above the limit will be blocked',
        'Perfect for budgeting and expense control'
      ],
      tip: '💡 Use Reserve Pay to practice financial discipline'
    },
    {
      id: 'step5',
      icon: FaRobot,
      title: 'AI Agent & app connections',
      description: 'Connect merchants and order with AI',
      details: [
        'Save your location in Connect Apps',
        'Connect a merchant (dummy store)',
        'Ask the AI Agent to find products',
        'Add items to cart and complete dummy orders',
        'Track your orders in real-time'
      ],
      tip: '💡 Try natural language like "Find me a pizza nearby"'
    }
  ];

  const features = [
    {
      icon: FaWallet,
      title: 'Multiple Bank Accounts',
      description: 'Add multiple dummy bank accounts with separate balances and UPI PINs for each',
      color: '#4F46E5'
    },
    {
      icon: FaCreditCard,
      title: 'UPI AutoPay',
      description: 'Schedule recurring bill payments automatically with proper authorization',
      color: '#7C3AED'
    },
    {
      icon: FaHistory,
      title: 'Transaction History',
      description: 'View all your payments, recharges, and bill payments in one place',
      color: '#10B981'
    },
    {
      icon: FaBell,
      title: 'Smart Notifications',
      description: 'Get real-time updates for transactions, orders, and important events',
      color: '#F59E0B'
    },
    {
      icon: FaUserFriends,
      title: 'Request & Split Money',
      description: 'Request money from friends or split bills with multiple people',
      color: '#3B82F6'
    },
    {
      icon: FaStore,
      title: 'Merchant Connect',
      description: 'Connect with merchants and place orders through the AI Agent',
      color: '#EF4444'
    }
  ];

  const faqs = [
    {
      question: 'Is this real money?',
      answer: 'No! SabAI Pay uses dummy money for testing and demonstration purposes. No real financial transactions occur.'
    },
    {
      question: 'What is a UPI PIN?',
      answer: 'A 4-digit PIN you set for each bank account to authorize payments. It\'s like a password for your transactions.'
    },
    {
      question: 'How do I get funds?',
      answer: 'Go to Settings → Bank Accounts and use the "Deposit" button to add dummy funds to any of your accounts.'
    },
    {
      question: 'What is Reserve Pay?',
      answer: 'A feature that lets you set monthly spending limits for specific merchants to control your expenses.'
    },
    {
      question: 'How does the AI Agent work?',
      answer: 'The AI Agent uses natural language to help you find products, place orders, and track deliveries with connected merchants.'
    },
    {
      question: 'Where can I see my transactions?',
      answer: 'All your transactions are available in the "History" section of the app. You can filter and search them.'
    }
  ];

  return (
    <motion.section 
      className="user-guide-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <div className="guide-hero">
        <div className="guide-hero-content">
          <motion.div 
            className="guide-badge"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <FaShieldAlt className="badge-icon" />
            <span>SABAI PAY GUIDE</span>
          </motion.div>
          
          <motion.h1
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Your Guide to SabAI Pay
          </motion.h1>
          
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Everything you need to know about using SabAI Pay — 
            from setting up your wallet to using the AI Agent.
            <span className="highlight-text"> All dummy money, real learning.</span>
          </motion.p>
          
          <motion.div 
            className="guide-hero-actions"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/settings" className="btn-primary">
              <FaWallet /> Set Up Wallet
            </Link>
            <Link to="/dashboard" className="btn-secondary">
              Go to Dashboard <FaArrowRight />
            </Link>
          </motion.div>
        </div>
        
        <motion.div 
          className="guide-hero-stats"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="stat-item">
            <span className="stat-number">5</span>
            <span className="stat-label">Easy Steps</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">6</span>
            <span className="stat-label">Features</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">6</span>
            <span className="stat-label">FAQs</span>
          </div>
        </motion.div>
      </div>

      {/* Important Notice */}
      <motion.div 
        className="guide-notice"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <FaLock className="notice-icon" />
        <div>
          <strong>🔒 Security Notice:</strong>
          <span>Never share your UPI PIN. Each bank account has its own 4-digit PIN for authorization. Treat it like a password!</span>
        </div>
      </motion.div>

      {/* Quick Start Steps */}
      <section className="guide-section">
        <div className="section-header">
          <h2>
            <FaRocket className="section-icon" />
            Quick Start Guide
          </h2>
          <p>Follow these 5 steps to get started with SabAI Pay</p>
        </div>

        <div className="steps-timeline">
          {quickStartSteps.map((step, index) => (
            <motion.div 
              key={step.id}
              className={`step-item ${expandedSection === step.id ? 'expanded' : ''}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <div className="step-header" onClick={() => toggleSection(step.id)}>
                  <div className="step-icon-wrapper">
                    <step.icon className="step-icon" />
                  </div>
                  <div className="step-title">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                  <button className="step-toggle">
                    {expandedSection === step.id ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>
                
                <AnimatePresence>
                  {expandedSection === step.id && (
                    <motion.div 
                      className="step-details"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ul>
                        {step.details.map((detail, i) => (
                          <li key={i}>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                      {step.tip && (
                        <div className="step-tip">
                          <span>{step.tip}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="guide-section">
        <div className="section-header">
          <h2>
            <FaBookOpen className="section-icon" />
            Key Features
          </h2>
          <p>Explore everything SabAI Pay has to offer</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div 
              key={feature.title}
              className="feature-card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="feature-icon-wrapper" style={{ background: `${feature.color}15` }}>
                <feature.icon style={{ color: feature.color }} />
              </div>
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="guide-section">
        <div className="section-header">
          <h2>
            <FaPlay className="section-icon" />
            Quick Access
          </h2>
          <p>Jump to the most important sections</p>
        </div>

        <div className="quick-links">
          <Link to="/settings" className="quick-link">
            <FaUniversity />
            <span>Bank Accounts</span>
            <FaExternalLinkAlt className="link-arrow" />
          </Link>
          <Link to="/send-money" className="quick-link">
            <FaExchangeAlt />
            <span>Send Money</span>
            <FaExternalLinkAlt className="link-arrow" />
          </Link>
          <Link to="/mobile-recharge" className="quick-link">
            <FaMobileAlt />
            <span>Mobile Recharge</span>
            <FaExternalLinkAlt className="link-arrow" />
          </Link>
          <Link to="/bills" className="quick-link">
            <FaFileInvoiceDollar />
            <span>Bills</span>
            <FaExternalLinkAlt className="link-arrow" />
          </Link>
          <Link to="/agent" className="quick-link">
            <FaRobot />
            <span>AI Agent</span>
            <FaExternalLinkAlt className="link-arrow" />
          </Link>
          <Link to="/transactions" className="quick-link">
            <FaHistory />
            <span>History</span>
            <FaExternalLinkAlt className="link-arrow" />
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="guide-section faq-section">
        <div className="section-header">
          <h2>
            <FaQuestionCircle className="section-icon" />
            Frequently Asked Questions
          </h2>
          <p>Quick answers to common questions</p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              className={`faq-item ${expandedSection === `faq-${index}` ? 'expanded' : ''}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <button 
                className="faq-question"
                onClick={() => toggleSection(`faq-${index}`)}
              >
                <span>{faq.question}</span>
                {expandedSection === `faq-${index}` ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              <AnimatePresence>
                {expandedSection === `faq-${index}` && (
                  <motion.div 
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <motion.div 
        className="guide-cta"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="cta-content">
          <div className="cta-icon-wrapper">
            <FaRocket />
          </div>
          <div className="cta-text">
            <h3>Ready to get started?</h3>
            <p>Set up your bank accounts and start exploring SabAI Pay today</p>
          </div>
          <Link to="/settings" className="cta-button">
            Get Started <FaArrowRight />
          </Link>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default UserGuidePage;