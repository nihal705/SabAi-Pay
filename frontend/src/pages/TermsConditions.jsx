// frontend/src/pages/TermsConditions.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaFileContract, 
  FaGavel, 
  FaUserCheck, 
  FaCreditCard,
  FaLock,
  FaExclamationTriangle,
  FaBan,
  FaBalanceScale,
  FaChevronDown,
  FaChevronUp,
  FaDownload,
  FaPrint,
  FaCheckCircle,
  FaEnvelope,
  FaPhone,
  FaClock,
  FaMapMarkerAlt,
  FaTimesCircle,
  FaQuestionCircle,
  FaArrowRight,
  FaShieldAlt,
  FaCoins,
  FaRobot,
  FaMobile,
  FaGlobe
} from 'react-icons/fa';
import { MdSecurity, MdGppGood, MdVerified, MdWarning } from 'react-icons/md';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import './TermsConditions.css';

const TermsConditions = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('acceptance');
  const [expandedSections, setExpandedSections] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [lastUpdated] = useState('March 15, 2026');
  const [effectiveDate] = useState('March 25, 2026');
  const [version] = useState('2.1.0');

  // Observer for scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('.terms-section').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // Check if user has accepted terms
  useEffect(() => {
    const accepted = localStorage.getItem('termsAccepted');
    if (accepted) {
      setAcceptedTerms(JSON.parse(accepted));
    }
  }, []);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleAcceptTerms = () => {
    localStorage.setItem('termsAccepted', JSON.stringify(true));
    setAcceptedTerms(true);
    setShowAcceptModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a text version of the terms
    const termsText = `
      SABAI PAY TERMS AND CONDITIONS
      Version: ${version}
      Last Updated: ${lastUpdated}
      Effective Date: ${effectiveDate}

      1. ACCEPTANCE OF TERMS
      By accessing or using SabAI Pay ("the App"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.

      2. ELIGIBILITY
      - You must be at least 18 years old
      - You must have a valid bank account in India
      - You must have a registered mobile number
      - You must not have been previously banned from our services

      3. ACCOUNT REGISTRATION
      You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.

      4. USER RESPONSIBILITIES
      - Maintain confidentiality of your account credentials
      - Notify us immediately of unauthorized access
      - Comply with all applicable laws and regulations
      - Not use the service for illegal transactions

      5. PAYMENT SERVICES
      - We facilitate UPI payments between users
      - Transactions are processed through partner banks
      - We are not responsible for bank delays or errors
      - Transaction limits apply as per RBI guidelines

      6. SABAI GEMS REWARDS PROGRAM
      - Earn 1% cashback as SabAI Gems on eligible transactions
      - Gems expire after 30 days
      - Gems have no cash value and cannot be transferred
      - We may modify the rewards program at any time

      7. AGENT PAY FEATURE
      - AI-powered payment assistance
      - Transactions via Agent Pay are final
      - We are not liable for incorrect commands
      - Agent Pay may not support all transaction types

      8. FEES AND CHARGES
      - Basic UPI transactions are free
      - Premium features may incur charges
      - Bank charges may apply for certain transactions
      - All fees will be clearly disclosed

      9. INTELLECTUAL PROPERTY
      All content, features, and functionality are owned by SabAI Pay and protected by copyright, trademark, and other intellectual property laws.

      10. PRIVACY AND DATA PROTECTION
      Your use of the App is also governed by our Privacy Policy, which is incorporated by reference.

      11. PROHIBITED ACTIVITIES
      - Fraudulent transactions
      - Money laundering
      - Unauthorized access to others' accounts
      - Harassment or abuse of other users
      - Reverse engineering the app

      12. TERMINATION
      We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.

      13. DISCLAIMER OF WARRANTIES
      The App is provided on an "AS IS" and "AS AVAILABLE" basis. We disclaim all warranties of any kind.

      14. LIMITATION OF LIABILITY
      To the maximum extent permitted by law, SabAI Pay shall not be liable for any indirect, incidental, special, consequential, or punitive damages.

      15. INDEMNIFICATION
      You agree to indemnify and hold SabAI Pay harmless from any claims arising out of your use of the App.

      16. GOVERNING LAW
      These Terms shall be governed by the laws of India, without regard to its conflict of law provisions.

      17. DISPUTE RESOLUTION
      Any disputes shall first be attempted to be resolved through informal negotiation. If not resolved, disputes shall be submitted to binding arbitration in Bangalore, India.

      18. CHANGES TO TERMS
      We may modify these terms at any time. Continued use of the App constitutes acceptance of the modified terms.

      19. CONTACT INFORMATION
      For questions about these Terms, contact us at legal@sabaipay.com

      © 2026 SabAI Pay. All rights reserved.
    `;

    const blob = new Blob([termsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SabAI_Pay_Terms_Conditions_v${version}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: FaFileContract,
      content: `
        By accessing, downloading, or using the SabAI Pay mobile application ("App") and any services provided therein, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not access or use the App.
        
        These Terms constitute a legally binding agreement between you and SabAI Pay ("we," "our," or "us"). Please read them carefully. We may modify these Terms at any time, and such modifications shall be effective immediately upon posting. Your continued use of the App after any modifications indicates your acceptance of the modified Terms.
      `
    },
    {
      id: 'eligibility',
      title: '2. Eligibility',
      icon: FaUserCheck,
      content: `
        By using the App, you represent and warrant that:
      `,
      bulletPoints: [
        'You are at least 18 years of age',
        'You have the legal capacity to enter into a binding contract',
        'You are a resident of India with a valid bank account',
        'You have a registered mobile number in India',
        'You have not been previously suspended or removed from our services',
        'You are not located in a country that is subject to trade sanctions',
        'You will comply with all applicable laws and regulations'
      ]
    },
    {
      id: 'account',
      title: '3. Account Registration and Security',
      icon: FaLock,
      content: `
        To use certain features of the App, you must register for an account. You agree to:
      `,
      bulletPoints: [
        'Provide accurate, current, and complete information during registration',
        'Maintain and promptly update your account information',
        'Maintain the security and confidentiality of your login credentials',
        'Notify us immediately of any unauthorized use of your account',
        'Accept responsibility for all activities that occur under your account',
        'Not share your account credentials with any third party',
        'Use a strong password and enable two-factor authentication'
      ]
    },
    {
      id: 'payment',
      title: '4. Payment Services',
      icon: FaCreditCard,
      content: `
        SabAI Pay facilitates UPI-based payments and money transfers between users. The following terms apply to all payment services:
      `,
      subsections: [
        {
          title: 'Transaction Processing',
          items: [
            'All transactions are processed through our partner banks and UPI infrastructure',
            'Transaction limits apply as per RBI guidelines and your bank\'s policies',
            'We are not responsible for delays or errors caused by banks or payment networks',
            'Transactions, once completed, are generally irreversible',
            'You are responsible for verifying recipient details before sending payments'
          ]
        },
        {
          title: 'Transaction Limits',
          items: [
            'Daily transaction limit: ₹1,00,000 per account',
            'Per transaction limit: ₹25,000 for most banks',
            'Monthly aggregate limit: ₹5,00,000',
            'Higher limits may be available upon verification and approval'
          ]
        },
        {
          title: 'Refunds and Disputes',
          items: [
            'Refunds are processed only in case of failed transactions',
            'Disputes must be raised within 7 days of the transaction',
            'We will assist in resolving disputes but cannot guarantee outcomes',
            'Fraudulent transactions should be reported immediately to your bank'
          ]
        }
      ]
    },
    {
      id: 'gems',
      title: '5. SabAI Gems Rewards Program',
      icon: FaCoins,
      content: `
        The SabAI Gems program allows users to earn reward points on eligible transactions. The program is subject to these terms:
      `,
      bulletPoints: [
        'Earn 1% cashback as SabAI Gems on eligible UPI transactions',
        'Gems are credited within 24 hours of transaction settlement',
        'Gems expire 30 days from the date of credit',
        'Gems have no cash value and cannot be exchanged for cash',
        'Gems cannot be transferred to another user or account',
        'We may modify, suspend, or terminate the program at any time',
        'Fraudulent earning of Gems will result in account termination',
        'Minimum redemption: 100 Gems',
        'Redemption options include bill payments, recharges, and gift cards'
      ]
    },
    {
      id: 'agent',
      title: '6. Agent Pay Feature',
      icon: FaRobot,
      content: `
        Agent Pay is our AI-powered payment assistant that allows you to make payments using natural language commands. By using Agent Pay, you acknowledge:
      `,
      bulletPoints: [
        'Agent Pay uses artificial intelligence to interpret your commands',
        'We are not liable for misinterpretation of unclear or ambiguous commands',
        'You should review transaction details before confirming',
        'Agent Pay may not support all transaction types or payment scenarios',
        'The feature is provided "AS IS" and may have limitations',
        'We may record and analyze conversations to improve the service',
        'Do not share sensitive information like passwords in chat'
      ]
    },
    {
      id: 'fees',
      title: '7. Fees and Charges',
      icon: FaBalanceScale,
      content: `
        SabAI Pay strives to keep its services affordable and transparent. The following fee structure applies:
      `,
      subsections: [
        {
          title: 'Free Services',
          items: [
            'Basic UPI payments and money transfers',
            'Account maintenance and statements',
            'SabAI Gems earning and redemption',
            'Standard customer support'
          ]
        },
        {
          title: 'Paid Services',
          items: [
            'Premium support: ₹99/month',
            'Instant settlements: 0.5% of transaction amount',
            'International payments: 2% of transaction amount',
            'Business accounts: Custom pricing'
          ]
        },
        {
          title: 'Third-Party Fees',
          items: [
            'Your bank may charge for UPI transactions',
            'Data charges from your mobile operator',
            'GST applicable on paid services'
          ]
        }
      ]
    },
    {
      id: 'prohibited',
      title: '8. Prohibited Activities',
      icon: FaBan,
      content: `
        You agree not to engage in any of the following prohibited activities:
      `,
      bulletPoints: [
        'Using the App for any illegal purpose or in violation of any laws',
        'Attempting to interfere with or compromise the App\'s security',
        'Engaging in fraudulent transactions or money laundering',
        'Using the App to harass, abuse, or harm others',
        'Impersonating another person or entity',
        'Reverse engineering, decompiling, or disassembling the App',
        'Using automated scripts or bots to interact with the App',
        'Creating multiple accounts to abuse rewards or promotions',
        'Sharing account credentials or allowing others to use your account',
        'Using the App to send spam or unsolicited messages'
      ]
    },
    {
      id: 'ip',
      title: '9. Intellectual Property Rights',
      icon: FaGavel,
      content: `
        All content, features, and functionality of the App, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software, are the exclusive property of SabAI Pay or its licensors and are protected by Indian and international copyright, trademark, patent, trade secret, and other intellectual property laws.
        
        You may not:
      `,
      bulletPoints: [
        'Copy, modify, or create derivative works of the App',
        'Use any trademarks, logos, or trade dress without our prior written consent',
        'Remove any copyright or proprietary notices',
        'Sublicense, sell, or commercially exploit the App',
        'Use the App in a way that infringes on others\' rights'
      ]
    },
    {
      id: 'termination',
      title: '10. Termination',
      icon: FaExclamationTriangle,
      content: `
        We may terminate or suspend your account and access to the App immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
        
        Upon termination:
      `,
      bulletPoints: [
        'Your right to use the App will immediately cease',
        'Any pending transactions may be cancelled',
        'Unused SabAI Gems will be forfeited',
        'We may delete your account information',
        'Certain provisions of these Terms shall survive termination'
      ]
    },
    {
      id: 'liability',
      title: '11. Limitation of Liability',
      icon: MdGppGood,
      content: `
        To the maximum extent permitted by law, in no event shall SabAI Pay, its affiliates, directors, employees, or agents be liable for any indirect, punitive, incidental, special, consequential, or exemplary damages, including without limitation damages for loss of profits, goodwill, use, data, or other intangible losses, arising out of or relating to the use of, or inability to use, the App.
        
        Our total liability to you shall not exceed the amount you paid us, if any, during the twelve months preceding the claim.
      `
    },
    {
      id: 'disputes',
      title: '12. Dispute Resolution',
      icon: FaBalanceScale,
      content: `
        Any dispute arising out of or relating to these Terms or your use of the App shall be resolved through the following process:
      `,
      bulletPoints: [
        'Informal Negotiation: Parties shall attempt to resolve disputes through informal negotiation for 30 days',
        'Arbitration: If not resolved, disputes shall be submitted to binding arbitration in Bangalore, India',
        'Arbitration shall be conducted in English by a single arbitrator',
        'The arbitration award shall be final and binding',
        'Small claims disputes may be filed in small claims court',
        'You agree to waive any right to participate in class action lawsuits'
      ]
    },
    {
      id: 'governing',
      title: '13. Governing Law',
      icon: FaGavel,
      content: `
        These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. The courts in Bangalore, Karnataka shall have exclusive jurisdiction over any disputes.
      `
    },
    {
      id: 'changes',
      title: '14. Changes to Terms',
      icon: FaFileContract,
      content: `
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
        
        By continuing to access or use our App after those revisions become effective, you agree to be bound by the revised terms.
      `
    },
    {
      id: 'contact',
      title: '15. Contact Information',
      icon: FaQuestionCircle,
      content: `
        If you have any questions about these Terms, please contact us:
      `,
      contactInfo: {
        email: 'legal@sabaipay.com',
        address: 'SabAI Pay Headquarters, Electronic City, Bangalore, Karnataka 560100, India',
        phone: '+91 98765 43210',
        hours: 'Monday - Friday, 9:00 AM - 6:00 PM IST'
      }
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="terms-page"
    >
      {/* Accept Terms Modal */}
      {showAcceptModal && (
        <div className="modal-overlay" onClick={() => setShowAcceptModal(false)}>
          <motion.div 
            className="accept-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-icon">
              <FaFileContract />
            </div>
            <h3>Accept Terms and Conditions</h3>
            <p>
              By clicking "Accept", you confirm that you have read, understood, and agree to be bound by 
              SabAI Pay's Terms and Conditions, including any future modifications.
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAcceptModal(false)}>
                Cancel
              </button>
              <button className="accept-btn" onClick={handleAcceptTerms}>
                I Accept
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <section className="terms-hero">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1>
              <FaFileContract className="hero-icon" />
              Terms and Conditions
            </h1>
            <p className="hero-subtitle">
              Please read these terms carefully before using SabAI Pay. By using our services, 
              you agree to be bound by these terms.
            </p>
            <div className="terms-meta">
              <span className="meta-item">
                Version: <strong>{version}</strong>
              </span>
              <span className="meta-item">
                Last Updated: <strong>{lastUpdated}</strong>
              </span>
              <span className="meta-item">
                Effective: <strong>{effectiveDate}</strong>
              </span>
            </div>
            <div className="hero-actions">
              <button className="action-btn print" onClick={handlePrint}>
                <FaPrint /> Print
              </button>
              <button className="action-btn download" onClick={handleDownload}>
                <FaDownload /> Download
              </button>
              {!acceptedTerms && (
                <button className="action-btn accept" onClick={() => setShowAcceptModal(true)}>
                  <FaCheckCircle /> Accept Terms
                </button>
              )}
              {acceptedTerms && (
                <span className="accepted-badge">
                  <FaCheckCircle /> Terms Accepted
                </span>
              )}
            </div>
          </motion.div>
        </div>
        <div className="hero-shape"></div>
      </section>

      <div className="terms-container">
        {/* Table of Contents Sidebar */}
        <aside className="terms-sidebar">
          <div className="sidebar-sticky">
            <h3>Contents</h3>
            <nav className="toc-nav">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`toc-link ${activeSection === section.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(section.id).scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <section.icon className="toc-icon" />
                  <span>{section.title}</span>
                </a>
              ))}
            </nav>

            <div className="sidebar-status">
              <div className="status-item">
                <span className="status-label">Acceptance Status:</span>
                {acceptedTerms ? (
                  <span className="status-value accepted">
                    <FaCheckCircle /> Accepted
                  </span>
                ) : (
                  <span className="status-value pending">
                    <FaTimesCircle /> Not Accepted
                  </span>
                )}
              </div>
              <button 
                className="accept-terms-btn"
                onClick={() => setShowAcceptModal(true)}
                disabled={acceptedTerms}
              >
                {acceptedTerms ? 'Already Accepted' : 'Accept Terms'}
              </button>
            </div>

            <div className="sidebar-summary">
              <h4>Quick Summary</h4>
              <ul>
                <li>✓ Must be 18+ years old</li>
                <li>✓ Indian bank account required</li>
                <li>✓ Free UPI transactions</li>
                <li>✓ 1% cashback as Gems</li>
                <li>✓ Gems expire in 30 days</li>
                <li>✓ Daily limit: ₹1,00,000</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="terms-content">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="terms-section"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="section-header" onClick={() => toggleSection(section.id)}>
                  <div className="section-title">
                    <section.icon className="section-icon" />
                    <h2>{section.title}</h2>
                  </div>
                  <button className="expand-btn">
                    {expandedSections[section.id] ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>

                {(expandedSections[section.id] !== false) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="section-content"
                  >
                    <p className="section-text">{section.content}</p>

                    {section.subsections && (
                      <div className="subsections">
                        {section.subsections.map((sub, idx) => (
                          <div key={idx} className="subsection">
                            <h3>{sub.title}</h3>
                            {sub.items && (
                              <ul className="subsection-list">
                                {sub.items.map((item, i) => (
                                  <li key={i}>
                                    <FaCheckCircle className="list-icon" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {section.bulletPoints && (
                      <ul className="bullet-list">
                        {section.bulletPoints.map((point, idx) => (
                          <li key={idx}>
                            <span className="bullet-point">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.contactInfo && (
                      <div className="contact-details">
                        <div className="contact-item">
                          <FaEnvelope className="contact-icon" />
                          <div>
                            <strong>Email:</strong>
                            <a href={`mailto:${section.contactInfo.email}`}>{section.contactInfo.email}</a>
                          </div>
                        </div>
                        <div className="contact-item">
                          <FaPhone className="contact-icon" />
                          <div>
                            <strong>Phone:</strong>
                            <a href={`tel:${section.contactInfo.phone}`}>{section.contactInfo.phone}</a>
                          </div>
                        </div>
                        <div className="contact-item">
                          <FaMapMarkerAlt className="contact-icon" />
                          <div>
                            <strong>Address:</strong>
                            <span>{section.contactInfo.address}</span>
                          </div>
                        </div>
                        <div className="contact-item">
                          <FaClock className="contact-icon" />
                          <div>
                            <strong>Hours:</strong>
                            <span>{section.contactInfo.hours}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </section>
          ))}

          {/* Legal Disclaimer */}
          <section className="terms-section disclaimer-section">
            <div className="disclaimer-notice">
              <MdWarning className="disclaimer-icon" />
              <div className="disclaimer-content">
                <h3>Legal Disclaimer</h3>
                <p>
                  This document is a legal agreement between you and SabAI Pay. If you have any questions 
                  or concerns about these terms, please consult with a legal professional before using our services.
                </p>
              </div>
            </div>
          </section>

          {/* Version History */}
          <div className="version-history">
            <h4>Version History</h4>
            <div className="version-item">
              <span className="version-number">v2.1.0</span>
              <span className="version-date">March 25, 2026</span>
              <span className="version-change">Updated Agent Pay terms, added Gemini rewards clarification</span>
            </div>
            <div className="version-item">
              <span className="version-number">v2.0.0</span>
              <span className="version-date">March 15, 2026</span>
              <span className="version-change">Major update: Added Agent Pay, revised fee structure</span>
            </div>
            <div className="version-item">
              <span className="version-number">v1.5.0</span>
              <span className="version-date">March 7, 2026</span>
              <span className="version-change">Updated transaction limits, added dispute resolution process</span>
            </div>
          </div>
        </main>
      </div>

      {/* Scroll to Top Button */}
      <button 
        className="scroll-top-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>
    </motion.div>
  );
};

export default TermsConditions;