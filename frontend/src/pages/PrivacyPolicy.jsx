// frontend/src/pages/PrivacyPolicy.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaShieldAlt, 
  FaLock, 
  FaEye, 
  FaCookie,
  FaUserSecret,
  FaFileContract,
  FaChevronDown,
  FaChevronUp,
  FaDownload,
  FaPrint,
  FaShare,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaGlobe,
  FaMobile,
  FaServer,
  FaCreditCard,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { MdPrivacyTip, MdSecurity, MdGppGood, MdVerified } from 'react-icons/md';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('introduction');
  const [expandedSections, setExpandedSections] = useState({});
  const [lastUpdated] = useState('March 15, 2026');
  const [effectiveDate] = useState('March 25, 2026');
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false
  });

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

    document.querySelectorAll('.policy-section').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // Show cookie consent on mount
  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowCookieConsent(true);
    }
  }, []);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleCookieAccept = (preferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    setShowCookieConsent(false);
    setCookiePreferences(preferences);
  };

  const handleCookieDecline = () => {
    const minimalPrefs = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    localStorage.setItem('cookieConsent', JSON.stringify(minimalPrefs));
    setShowCookieConsent(false);
    setCookiePreferences(minimalPrefs);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a text version of the policy
    const policyText = `
      SABAI PAY PRIVACY POLICY
      Last Updated: ${lastUpdated}
      Effective Date: ${effectiveDate}

      1. INTRODUCTION
      Welcome to SabAI Pay ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.

      2. INFORMATION WE COLLECT
      Personal Information: Name, email address, phone number, date of birth, government ID, bank account details, UPI IDs.
      Financial Information: Transaction history, payment methods, account balances, spending patterns.
      Technical Information: IP address, device type, browser type, operating system, app version.
      Usage Information: How you use our app, features you access, time spent, interactions.

      3. HOW WE USE YOUR INFORMATION
      - To provide and maintain our services
      - To process transactions and send payment notifications
      - To improve and personalize your experience
      - To communicate with you about updates and offers
      - To detect and prevent fraud
      - To comply with legal obligations

      4. COOKIES AND TRACKING TECHNOLOGIES
      We use cookies and similar technologies to enhance your experience. You can control cookie settings in your browser.

      5. DATA SHARING AND DISCLOSURE
      We may share your information with:
      - Service providers and business partners
      - Financial institutions for payment processing
      - Law enforcement when required by law
      - Other users with your consent

      6. DATA SECURITY
      We implement industry-standard security measures including encryption, secure servers, and regular security audits.

      7. YOUR RIGHTS
      You have the right to:
      - Access your personal data
      - Correct inaccurate data
      - Request deletion of your data
      - Object to processing
      - Data portability

      8. THIRD-PARTY LINKS
      Our app may contain links to third-party websites. We are not responsible for their privacy practices.

      9. CHILDREN'S PRIVACY
      Our services are not intended for children under 13. We do not knowingly collect data from children.

      10. INTERNATIONAL DATA TRANSFERS
      Your data may be transferred to and processed in countries other than your own.

      11. DATA RETENTION
      We retain your data as long as necessary to provide services and comply with legal obligations.

      12. CHANGES TO THIS POLICY
      We may update this policy periodically. We will notify you of significant changes.

      13. CONTACT US
      If you have questions about this privacy policy, please contact us at:
      Email: privacy@sabaipay.com
      Phone: +91 98765 43210
      Address: SabAI Pay Headquarters, Bangalore, India

      © 2026 SabAI Pay. All rights reserved.
    `;

    const blob = new Blob([policyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SabAI_Pay_Privacy_Policy_${lastUpdated.replace(/\s/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sections = [
    {
      id: 'introduction',
      title: '1. Introduction',
      icon: MdPrivacyTip,
      content: `
        Welcome to SabAI Pay ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience when using our mobile application and services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our SabAI Pay mobile application and related services (collectively, the "App").
        
        Please read this privacy policy carefully. By accessing or using the App, you acknowledge that you have read, understood, and agree to be bound by all the terms outlined in this privacy policy. If you do not agree with our policies and practices, please do not use our App.
        
        We reserve the right to make changes to this privacy policy at any time. Any changes will be posted on this page with an updated effective date. Your continued use of the App after we make changes is deemed acceptance of those changes.
      `
    },
    {
      id: 'information-collection',
      title: '2. Information We Collect',
      icon: FaEye,
      content: `
        We collect several types of information from and about users of our App, including information:
      `,
      subsections: [
        {
          title: 'Personal Information',
          items: [
            'Name, email address, and phone number',
            'Date of birth and gender',
            'Government-issued identification (PAN card, Aadhaar)',
            'Bank account details and UPI IDs',
            'Profile pictures and signatures'
          ]
        },
        {
          title: 'Financial Information',
          items: [
            'Transaction history and payment records',
            'Account balances and statements',
            'Spending patterns and categories',
            'Payment methods used',
            'Rewards and gems earned'
          ]
        },
        {
          title: 'Technical Information',
          items: [
            'IP address and device identifiers',
            'Browser type and version',
            'Operating system and app version',
            'Device settings and configurations',
            'Mobile network information'
          ]
        },
        {
          title: 'Usage Information',
          items: [
            'How you interact with our App',
            'Features you access and use',
            'Time spent on different sections',
            'Search queries and preferences',
            'Agent Pay conversations and commands'
          ]
        }
      ]
    },
    {
      id: 'information-use',
      title: '3. How We Use Your Information',
      icon: FaServer,
      content: `
        We use the information we collect for various purposes, including:
      `,
      bulletPoints: [
        'To provide, operate, and maintain our App and services',
        'To process transactions and send payment confirmations',
        'To verify your identity and prevent fraud',
        'To personalize your experience and improve our services',
        'To communicate with you about updates, offers, and promotions',
        'To respond to your comments, questions, and requests',
        'To analyze usage patterns and optimize user experience',
        'To comply with legal and regulatory requirements',
        'To enforce our terms and conditions',
        'To develop new features and services'
      ]
    },
    {
      id: 'cookies',
      title: '4. Cookies and Tracking Technologies',
      icon: FaCookie,
      content: `
        We use cookies and similar tracking technologies to enhance your experience on our App. Cookies are small data files stored on your device that help us improve functionality and understand user behavior.
      `,
      subsections: [
        {
          title: 'Types of Cookies We Use',
          items: [
            'Essential Cookies: Required for basic app functionality',
            'Functional Cookies: Remember your preferences and settings',
            'Analytics Cookies: Help us understand how users interact with our app',
            'Marketing Cookies: Track your activity for targeted advertising'
          ]
        },
        {
          title: 'Your Cookie Choices',
          items: [
            'You can set your browser to refuse all or some cookies',
            'You may disable cookies through your device settings',
            'Some features may not function properly without cookies'
          ]
        }
      ]
    },
    {
      id: 'data-sharing',
      title: '5. Data Sharing and Disclosure',
      icon: FaShare,
      content: `
        We may share your information in the following situations:
      `,
      bulletPoints: [
        'With service providers and business partners who help us operate our business',
        'With financial institutions to process payments and verify accounts',
        'With law enforcement or government agencies when required by law',
        'With other users when you initiate transactions or requests',
        'In connection with a business transfer, merger, or acquisition',
        'With your consent or at your direction'
      ]
    },
    {
      id: 'data-security',
      title: '6. Data Security',
      icon: FaLock,
      content: `
        We implement comprehensive security measures to protect your personal information:
      `,
      bulletPoints: [
        '256-bit SSL encryption for all data transmission',
        'Secure servers with firewall protection',
        'Regular security audits and penetration testing',
        'Multi-factor authentication for sensitive operations',
        'Biometric authentication options (fingerprint, face recognition)',
        'Automated fraud detection systems',
        'Strict access controls for employee data access',
        'Regular security training for our staff'
      ]
    },
    {
      id: 'your-rights',
      title: '7. Your Rights and Choices',
      icon: MdGppGood,
      content: `
        Depending on your location, you may have the following rights regarding your personal information:
      `,
      bulletPoints: [
        'Right to access your personal data',
        'Right to correct inaccurate or incomplete data',
        'Right to request deletion of your data',
        'Right to object to data processing',
        'Right to data portability',
        'Right to withdraw consent',
        'Right to opt-out of marketing communications',
        'Right to lodge a complaint with supervisory authority'
      ]
    },
    {
      id: 'third-party',
      title: '8. Third-Party Links and Services',
      icon: FaGlobe,
      content: `
        Our App may contain links to third-party websites, products, and services. We are not responsible for the privacy practices or content of these third parties. We encourage you to read their privacy policies before providing any information.
      `
    },
    {
      id: 'children',
      title: '9. Children\'s Privacy',
      icon: FaUserSecret,
      content: `
        Our App is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
      `
    },
    {
      id: 'international',
      title: '10. International Data Transfers',
      icon: FaGlobe,
      content: `
        Your information may be transferred to and processed in countries other than your own. These countries may have different data protection laws. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.
      `
    },
    {
      id: 'retention',
      title: '11. Data Retention',
      icon: FaClock,
      content: `
        We retain your personal information for as long as necessary to:
      `,
      bulletPoints: [
        'Provide you with our services',
        'Comply with legal and regulatory requirements',
        'Resolve disputes and enforce agreements',
        'Maintain business records for audit purposes'
      ]
    },
    {
      id: 'changes',
      title: '12. Changes to This Privacy Policy',
      icon: FaFileContract,
      content: `
        We may update this privacy policy from time to time. We will notify you of any changes by:
      `,
      bulletPoints: [
        'Posting the updated policy on this page',
        'Updating the "Last Updated" date',
        'Sending you an in-app notification',
        'Emailing you at your registered email address'
      ]
    },
    {
      id: 'contact',
      title: '13. Contact Us',
      icon: FaEnvelope,
      content: `
        If you have any questions, concerns, or requests regarding this privacy policy, please contact us:
      `,
      contactInfo: {
        email: 'privacy@sabaipay.com',
        phone: '+91 98765 43210',
        address: 'SabAI Pay Headquarters, Electronic City, Bangalore, Karnataka 560100, India',
        hours: 'Monday - Friday, 9:00 AM - 6:00 PM IST'
      }
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="privacy-policy-page"
    >
      {/* Cookie Consent Banner */}
      {showCookieConsent && (
        <motion.div 
          className="cookie-consent-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
        >
          <div className="cookie-icon">
            <FaCookie />
          </div>
          <div className="cookie-content">
            <h3>We Value Your Privacy</h3>
            <p>
              We use cookies to enhance your browsing experience, serve personalized ads or content, 
              and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
            </p>
            <div className="cookie-preferences">
              <label className="cookie-checkbox">
                <input 
                  type="checkbox" 
                  checked={cookiePreferences.necessary} 
                  disabled 
                />
                <span className="checkmark"></span>
                Necessary (Always Active)
              </label>
              <label className="cookie-checkbox">
                <input 
                  type="checkbox" 
                  checked={cookiePreferences.functional}
                  onChange={(e) => setCookiePreferences(prev => ({ ...prev, functional: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Functional
              </label>
              <label className="cookie-checkbox">
                <input 
                  type="checkbox" 
                  checked={cookiePreferences.analytics}
                  onChange={(e) => setCookiePreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Analytics
              </label>
              <label className="cookie-checkbox">
                <input 
                  type="checkbox" 
                  checked={cookiePreferences.marketing}
                  onChange={(e) => setCookiePreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Marketing
              </label>
            </div>
            <div className="cookie-actions">
              <button className="accept-btn" onClick={() => handleCookieAccept(cookiePreferences)}>
                Accept All
              </button>
              <button className="decline-btn" onClick={handleCookieDecline}>
                Necessary Only
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="policy-hero">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1>
              <MdPrivacyTip className="hero-icon" />
              Privacy Policy
            </h1>
            <p className="hero-subtitle">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
            <div className="policy-meta">
              <span className="meta-item">
                <FaClock /> Last Updated: {lastUpdated}
              </span>
              <span className="meta-item">
                <MdVerified /> Effective: {effectiveDate}
              </span>
            </div>
            <div className="hero-actions">
              <button className="action-btn print" onClick={handlePrint}>
                <FaPrint /> Print
              </button>
              <button className="action-btn download" onClick={handleDownload}>
                <FaDownload /> Download PDF
              </button>
            </div>
          </motion.div>
        </div>
        <div className="hero-shape"></div>
      </section>

      <div className="policy-container">
        {/* Table of Contents Sidebar */}
        <aside className="policy-sidebar">
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

            <div className="sidebar-contact">
              <h4>Questions?</h4>
              <p>Contact our privacy team</p>
              <button className="contact-privacy-btn" onClick={() => navigate('/help')}>
                <FaEnvelope /> Contact Us
              </button>
            </div>

            <div className="sidebar-badge">
              <MdGppGood className="badge-icon" />
              <div>
                <strong>GDPR Compliant</strong>
                <small>We follow global privacy standards</small>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="policy-content">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="policy-section"
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
                            <FaCheckCircle className="bullet-icon" />
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

          {/* Data Processing Agreement */}
          <section className="policy-section dpa-section">
            <div className="dpa-notice">
              <FaShieldAlt className="dpa-icon" />
              <div className="dpa-content">
                <h3>Data Processing Agreement</h3>
                <p>
                  If you are a business user and require a Data Processing Agreement (DPA) 
                  to comply with GDPR or other regulations, please contact our legal team.
                </p>
                <button className="dpa-btn" onClick={() => navigate('/contact')}>
                  Request DPA
                </button>
              </div>
            </div>
          </section>

          {/* Last Updated Notice */}
          <div className="last-updated-note">
            <FaClock className="clock-icon" />
            <p>
              This privacy policy was last updated on <strong>{lastUpdated}</strong> and is 
              effective from <strong>{effectiveDate}</strong>.
            </p>
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

export default PrivacyPolicy;