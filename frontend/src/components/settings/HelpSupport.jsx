// frontend/src/components/settings/HelpSupport.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaQuestionCircle,
  FaHeadset,
  FaEnvelope,
  FaPhone,
  FaComments,
  FaRobot,
  FaShieldAlt,
  FaCoins,
  FaCreditCard,
  FaEye,
  FaUser,
  FaLock,
  FaArrowRight,
  FaSearch,
  FaBook,
  FaVideo,
  FaFileAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaRegStar,
  FaPaperPlane,
  FaSpinner,
  FaDownload,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
  FaGlobe,
  FaClock,
  FaWhatsapp,
  FaTelegram,
  FaTwitter,
  FaFacebook,
  FaYoutube,
  FaBug,
  FaLightbulb,
  FaHeart,
  FaMedal
} from 'react-icons/fa';
import { MdSupport, MdHelp, MdAnnouncement, MdUpdate } from 'react-icons/md';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './HelpSupport.css';

const HelpSupport = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedCategory, setExpandedCategory] = useState('all');
  const [ticketData, setTicketData] = useState({
    subject: '',
    category: 'technical',
    message: '',
    priority: 'medium',
    attachments: []
  });
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    upi: 'operational',
    payments: 'operational',
    agent: 'operational',
    gems: 'operational',
    maintenance: false
  });

  // Load announcements
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      // Mock API call
      setTimeout(() => {
        setAnnouncements([
          {
            id: 1,
            title: 'New Agent Pay Features Released',
            description: 'We\'ve added support for more natural language commands. Try "Send ₹500 to Rahul for dinner" or "Pay electricity bill"',
            date: '2 hours ago',
            type: 'feature',
            icon: FaRobot,
            color: '#8b5cf6',
            read: false
          },
          {
            id: 2,
            title: 'SabAI Gems Double Week!',
            description: 'Earn double gems on all transactions this week. Offer ends Sunday.',
            date: '1 day ago',
            type: 'promo',
            icon: FaCoins,
            color: '#f59e0b',
            read: true
          },
          {
            id: 3,
            title: 'Scheduled Maintenance',
            description: 'We\'ll be performing system upgrades on Sunday, 2 AM - 4 AM IST. Services may be unavailable during this time.',
            date: '3 days ago',
            type: 'maintenance',
            icon: FaShieldAlt,
            color: '#3b82f6',
            read: true
          },
          {
            id: 4,
            title: 'New Security Features',
            description: 'Biometric login and device history tracking now available. Enable them in Security settings.',
            date: '1 week ago',
            type: 'security',
            icon: FaLock,
            color: '#10b981',
            read: true
          }
        ]);
        setAnnouncementsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      setAnnouncementsLoading(false);
    }
  };

  // FAQs data
  const faqs = [
    {
      category: 'Getting Started',
      icon: FaUser,
      questions: [
        {
          q: 'How do I create a SabAI Pay account?',
          a: 'Download the app, click on "Sign Up", enter your mobile number, verify with OTP, and complete your profile. You can also register through our website.',
          helpful: 245,
          views: 1245
        },
        {
          q: 'How do I link my bank account?',
          a: 'Go to Settings > Bank Accounts, click "Add Bank Account", enter your account details, and verify with UPI PIN. Your account will be linked instantly.',
          helpful: 189,
          views: 987
        },
        {
          q: 'Is SabAI Pay free to use?',
          a: 'Yes, SabAI Pay is completely free for all UPI transactions. There are no hidden charges or fees.',
          helpful: 312,
          views: 1567
        },
        {
          q: 'What is the daily transaction limit?',
          a: 'The default daily transaction limit is ₹1,00,000. You can request a higher limit by contacting support with valid reasons.',
          helpful: 156,
          views: 876
        }
      ]
    },
    {
      category: 'Payments & Transactions',
      icon: FaCreditCard,
      questions: [
        {
          q: 'How do I send money?',
          a: 'Click on "Send Money", enter recipient\'s UPI ID or mobile number, enter amount, add note (optional), and confirm with your UPI PIN.',
          helpful: 423,
          views: 2134
        },
        {
          q: 'What is Agent Pay?',
          a: 'Agent Pay is our AI-powered feature that lets you make payments through natural language. Just chat with SabAI and tell them what you want to do!',
          helpful: 267,
          views: 1456
        },
        {
          q: 'How do I request money?',
          a: 'Go to "Request Money", enter the payer\'s UPI ID, amount, and note. Share the generated payment link or QR code with them.',
          helpful: 198,
          views: 1098
        },
        {
          q: 'Can I schedule recurring payments?',
          a: 'Yes, you can set up recurring payments for bills, rent, or subscriptions. Go to the payment screen and select "Schedule Payment".',
          helpful: 134,
          views: 765
        },
        {
          q: 'What payment methods are supported?',
          a: 'We support all UPI apps, bank transfers, debit cards, credit cards, and netbanking from major Indian banks.',
          helpful: 289,
          views: 1543
        }
      ]
    },
    {
      category: 'SabAI Gems & Rewards',
      icon: FaCoins,
      questions: [
        {
          q: 'What are SabAI Gems?',
          a: 'SabAI Gems are reward points you earn on every transaction (1% cashback). You can redeem them for bill payments, recharges, and more.',
          helpful: 378,
          views: 1890
        },
        {
          q: 'How do I earn more Gems?',
          a: 'Earn Gems through transactions, daily logins, referrals, completing challenges, and participating in special offers.',
          helpful: 245,
          views: 1345
        },
        {
          q: 'Do Gems expire?',
          a: 'Yes, SabAI Gems expire after 30 days. You\'ll receive notifications before they expire.',
          helpful: 167,
          views: 987
        },
        {
          q: 'How do I redeem Gems?',
          a: 'Go to the Gems section, browse available rewards, and click "Redeem". You can use them for bill payments, recharges, or transfer to bank account.',
          helpful: 198,
          views: 1123
        }
      ]
    },
    {
      category: 'Security & Privacy',
      icon: FaLock,
      questions: [
        {
          q: 'How secure is SabAI Pay?',
          a: 'We use bank-grade encryption (256-bit SSL), secure authentication, and regular security audits. Your data and money are completely safe.',
          helpful: 456,
          views: 2345
        },
        {
          q: 'What if I forget my UPI PIN?',
          a: 'You can reset your UPI PIN by going to Settings > Security > Change UPI PIN. You\'ll need your bank account details to reset.',
          helpful: 289,
          views: 1567
        },
        {
          q: 'How do I report unauthorized transactions?',
          a: 'Immediately contact our support team at security@sabaipay.com or call our helpline. We have 24/7 fraud monitoring.',
          helpful: 198,
          views: 1098
        },
        {
          q: 'Is my data shared with third parties?',
          a: 'We never share your personal data without consent. Read our Privacy Policy for detailed information.',
          helpful: 167,
          views: 876
        },
        {
          q: 'How do I enable two-factor authentication?',
          a: 'Go to Settings > Security > Two-Factor Authentication and follow the setup process. You can use authenticator apps or SMS.',
          helpful: 234,
          views: 1234
        }
      ]
    },
    {
      category: 'Account Management',
      icon: FaUser,
      questions: [
        {
          q: 'How do I change my mobile number?',
          a: 'Contact support to change your registered mobile number. You\'ll need to verify your identity with documents.',
          helpful: 145,
          views: 876
        },
        {
          q: 'Can I have multiple accounts?',
          a: 'No, each user can have only one SabAI Pay account linked to their mobile number and bank accounts.',
          helpful: 98,
          views: 654
        },
        {
          q: 'How do I close my account?',
          a: 'Go to Settings > Security > Danger Zone to initiate account closure. Ensure all balances are withdrawn before closing.',
          helpful: 123,
          views: 765
        },
        {
          q: 'How do I update my profile information?',
          a: 'Go to Settings > Profile to update your name, email, date of birth, and profile picture.',
          helpful: 167,
          views: 987
        }
      ]
    }
  ];

  // Contact options
  const contactOptions = [
    {
      icon: FaHeadset,
      title: '24/7 Live Support',
      description: 'Get instant help from our support team',
      action: 'Start Chat',
      color: '#667eea',
      availability: 'Available now',
      responseTime: '< 2 minutes'
    },
    {
      icon: FaComments,
      title: 'Chat with SabAI',
      description: 'AI-powered instant answers',
      action: 'Chat Now',
      color: '#8b5cf6',
      availability: 'Always available',
      responseTime: 'Instant'
    },
    {
      icon: FaPhone,
      title: 'Call Us',
      description: 'Speak to a support representative',
      action: '+91 98765 43210',
      color: '#f59e0b',
      availability: '24/7',
      responseTime: '< 5 minutes'
    },
    {
      icon: FaEnvelope,
      title: 'Email Support',
      description: 'Get detailed help via email',
      action: 'support@sabaipay.com',
      color: '#10b981',
      availability: '24/7',
      responseTime: '< 4 hours'
    },
    {
      icon: FaWhatsapp,
      title: 'WhatsApp',
      description: 'Chat on WhatsApp',
      action: '+91 98765 43210',
      color: '#25D366',
      availability: '9 AM - 9 PM',
      responseTime: '< 1 hour'
    },
    {
      icon: FaTelegram,
      title: 'Telegram',
      description: 'Join our Telegram community',
      action: '@sabaipay_support',
      color: '#0088cc',
      availability: '24/7',
      responseTime: '< 30 minutes'
    }
  ];

  // Support resources
  const resources = [
    {
      icon: FaBook,
      title: 'User Guide',
      description: 'Complete guide to using SabAI Pay',
      articles: 45,
      color: '#3b82f6'
    },
    {
      icon: FaVideo,
      title: 'Video Tutorials',
      description: 'Watch step-by-step tutorials',
      videos: 32,
      color: '#ef4444'
    },
    {
      icon: FaFileAlt,
      title: 'FAQs & Articles',
      description: 'Browse our knowledge base',
      articles: 128,
      color: '#10b981'
    },
    {
      icon: FaDownload,
      title: 'Downloads',
      description: 'Forms, statements, and reports',
      files: 15,
      color: '#f59e0b'
    },
    {
      icon: FaBug,
      title: 'Report a Bug',
      description: 'Help us improve by reporting issues',
      color: '#8b5cf6'
    },
    {
      icon: FaLightbulb,
      title: 'Feature Request',
      description: 'Suggest new features',
      color: '#ec4899'
    }
  ];

  // Support tickets categories
  const ticketCategories = [
    { id: 'technical', label: 'Technical Issue', icon: FaBug },
    { id: 'payment', label: 'Payment Issue', icon: FaCreditCard },
    { id: 'account', label: 'Account Issue', icon: FaUser },
    { id: 'security', label: 'Security Concern', icon: FaLock },
    { id: 'gems', label: 'Gems & Rewards', icon: FaCoins },
    { id: 'other', label: 'Other', icon: FaQuestionCircle }
  ];

  // Priority levels
  const priorityLevels = [
    { id: 'low', label: 'Low', color: '#10b981' },
    { id: 'medium', label: 'Medium', color: '#f59e0b' },
    { id: 'high', label: 'High', color: '#ef4444' },
    { id: 'critical', label: 'Critical', color: '#7f1d1d' }
  ];

  // Filter FAQs based on search
  const filteredFaqs = searchQuery
    ? faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
          q => 
            q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.questions.length > 0)
    : faqs;

  // Handle feedback submission
  const handleFeedbackSubmit = () => {
    if (feedbackRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setFeedbackSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setFeedbackSubmitted(true);
      setFeedbackSubmitting(false);
      toast.success('Thank you for your feedback!');
    }, 1000);
  };

  // Handle ticket submission
  const handleTicketSubmit = (e) => {
    e.preventDefault();
    
    if (!ticketData.subject || !ticketData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setTicketSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setTicketSubmitted(true);
      setTicketSubmitting(false);
      toast.success('Support ticket created successfully!');
    }, 1500);
  };

  // Reset ticket form
  const resetTicketForm = () => {
    setTicketData({
      subject: '',
      category: 'technical',
      message: '',
      priority: 'medium',
      attachments: []
    });
    setTicketSubmitted(false);
  };

  // Mark announcement as read
  const markAnnouncementRead = (id) => {
    setAnnouncements(prev =>
      prev.map(a => a.id === id ? { ...a, read: true } : a)
    );
  };

  // Mark all announcements as read
  const markAllRead = () => {
    setAnnouncements(prev =>
      prev.map(a => ({ ...a, read: true }))
    );
    toast.success('All announcements marked as read');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return '#10b981';
      case 'degraded':
        return '#f59e0b';
      case 'down':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded':
        return 'Degraded Performance';
      case 'down':
        return 'Service Down';
      default:
        return 'Unknown';
    }
  };

  const tabs = [
    { id: 'faq', label: 'FAQs', icon: FaQuestionCircle },
    { id: 'contact', label: 'Contact Us', icon: FaHeadset },
    { id: 'resources', label: 'Resources', icon: FaBook },
    { id: 'ticket', label: 'Support Ticket', icon: FaFileAlt },
    { id: 'announcements', label: 'Announcements', icon: MdAnnouncement },
    { id: 'feedback', label: 'Feedback', icon: FaStar }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="help-support-settings"
    >
      <div className="settings-header">
        <h2>Help & Support</h2>
        <div className="header-actions">
          <button 
            className="emergency-btn"
            onClick={() => {
              setActiveTab('ticket');
              setTicketData(prev => ({ ...prev, priority: 'critical' }));
            }}
          >
            <FaExclamationTriangle /> Emergency Support
          </button>
        </div>
      </div>

      {/* System Status Bar */}
      <motion.div 
        className="system-status-bar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="status-left">
          <span className="status-label">System Status:</span>
          <div className="status-items">
            <span className="status-item">
              <span className="status-dot" style={{ backgroundColor: getStatusColor(systemStatus.upi) }}></span>
              UPI
            </span>
            <span className="status-item">
              <span className="status-dot" style={{ backgroundColor: getStatusColor(systemStatus.payments) }}></span>
              Payments
            </span>
            <span className="status-item">
              <span className="status-dot" style={{ backgroundColor: getStatusColor(systemStatus.agent) }}></span>
              Agent Pay
            </span>
            <span className="status-item">
              <span className="status-dot" style={{ backgroundColor: getStatusColor(systemStatus.gems) }}></span>
              Gems
            </span>
          </div>
        </div>
        {systemStatus.maintenance && (
          <div className="maintenance-banner">
            <FaShieldAlt /> Scheduled maintenance on Sunday, 2 AM - 4 AM IST
          </div>
        )}
      </motion.div>

      {/* Search Bar */}
      <div className="help-search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search for help articles, FAQs, or topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>
            <FaTimesCircle />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="help-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* FAQs Tab */}
        {activeTab === 'faq' && (
          <motion.div
            key="faq"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="faq-tab-content"
          >
            <div className="faq-header">
              <h3>Frequently Asked Questions</h3>
              <div className="category-filters">
                <button
                  className={`category-filter ${expandedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setExpandedCategory('all')}
                >
                  All Categories
                </button>
                {faqs.map(cat => (
                  <button
                    key={cat.category}
                    className={`category-filter ${expandedCategory === cat.category ? 'active' : ''}`}
                    onClick={() => setExpandedCategory(cat.category)}
                  >
                    <cat.icon /> {cat.category}
                  </button>
                ))}
              </div>
            </div>

            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((category, catIndex) => (
                (expandedCategory === 'all' || expandedCategory === category.category) && (
                  <motion.div
                    key={catIndex}
                    className="faq-category-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIndex * 0.05 }}
                  >
                    <div className="category-header">
                      <category.icon className="category-icon" />
                      <h4>{category.category}</h4>
                      <span className="question-count">{category.questions.length} questions</span>
                    </div>

                    <div className="faq-items">
                      {category.questions.map((faq, qIndex) => (
                        <div
                          key={qIndex}
                          className={`faq-item ${activeFaq === `${catIndex}-${qIndex}` ? 'active' : ''}`}
                        >
                          <button
                            className="faq-question"
                            onClick={() => setActiveFaq(
                              activeFaq === `${catIndex}-${qIndex}` ? null : `${catIndex}-${qIndex}`
                            )}
                          >
                            <span>{faq.q}</span>
                            <span className="faq-icon">
                              {activeFaq === `${catIndex}-${qIndex}` ? <FaChevronUp /> : <FaChevronDown />}
                            </span>
                          </button>
                          <AnimatePresence>
                            {activeFaq === `${catIndex}-${qIndex}` && (
                              <motion.div
                                className="faq-answer"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                <p>{faq.a}</p>
                                <div className="faq-meta">
                                  <span className="helpful-count">
                                    <FaStar /> {faq.helpful} found this helpful
                                  </span>
                                  <span className="view-count">
                                    <FaEye /> {faq.views} views
                                  </span>
                                  <button className="helpful-btn">
                                    Was this helpful?
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )
              ))
            ) : (
              <div className="no-results">
                <FaQuestionCircle className="no-results-icon" />
                <h4>No results found</h4>
                <p>We couldn't find any articles matching "{searchQuery}"</p>
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  Clear Search
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Contact Us Tab */}
        {activeTab === 'contact' && (
          <motion.div
            key="contact"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="contact-tab-content"
          >
            <h3>Contact Support</h3>
            <p className="contact-subtitle">Choose your preferred way to get help</p>

            <div className="contact-options-grid">
              {contactOptions.map((option, index) => (
                <motion.div
                  key={index}
                  className="contact-option-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="contact-option-icon" style={{ backgroundColor: `${option.color}20` }}>
                    <option.icon style={{ color: option.color }} />
                  </div>
                  <div className="contact-option-content">
                    <h4>{option.title}</h4>
                    <p className="contact-description">{option.description}</p>
                    <div className="contact-availability">
                      <span className="availability-badge" style={{ backgroundColor: `${option.color}20`, color: option.color }}>
                        <FaClock /> {option.availability}
                      </span>
                      <span className="response-time">Response: {option.responseTime}</span>
                    </div>
                    <button 
                      className="contact-action-btn"
                      style={{ backgroundColor: option.color }}
                      onClick={() => {
                        if (option.title.includes('Call')) {
                          window.location.href = 'tel:+919876543210';
                        } else if (option.title.includes('Email')) {
                          window.location.href = 'mailto:support@sabaipay.com';
                        } else {
                          toast.success(`Opening ${option.title}...`);
                        }
                      }}
                    >
                      {option.action} <FaArrowRight />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="social-support">
              <h4>Connect With Us</h4>
              <div className="social-icons">
                <button className="social-icon twitter">
                  <FaTwitter />
                </button>
                <button className="social-icon facebook">
                  <FaFacebook />
                </button>
                <button className="social-icon youtube">
                  <FaYoutube />
                </button>
                <button className="social-icon telegram">
                  <FaTelegram />
                </button>
                <button className="social-icon whatsapp">
                  <FaWhatsapp />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <motion.div
            key="resources"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="resources-tab-content"
          >
            <h3>Helpful Resources</h3>
            <p className="resources-subtitle">Guides, tutorials, and tools to help you get the most out of SabAI Pay</p>

            <div className="resources-grid">
              {resources.map((resource, index) => (
                <motion.div
                  key={index}
                  className="resource-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="resource-icon" style={{ backgroundColor: `${resource.color}20` }}>
                    <resource.icon style={{ color: resource.color }} />
                  </div>
                  <div className="resource-content">
                    <h4>{resource.title}</h4>
                    <p>{resource.description}</p>
                    {resource.articles && (
                      <span className="resource-meta">{resource.articles} articles</span>
                    )}
                    {resource.videos && (
                      <span className="resource-meta">{resource.videos} videos</span>
                    )}
                    {resource.files && (
                      <span className="resource-meta">{resource.files} files</span>
                    )}
                    <button className="resource-btn">
                      Explore <FaArrowRight />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="quick-links">
              <h4>Quick Links</h4>
              <div className="quick-links-grid">
                <button className="quick-link">
                  <FaDownload /> Download Statements
                </button>
                <button className="quick-link">
                  <FaFileAlt /> Tax Reports
                </button>
                <button className="quick-link">
                  <FaLock /> Privacy Policy
                </button>
                <button className="quick-link">
                  <FaGlobe /> Terms of Service
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Support Ticket Tab */}
        {activeTab === 'ticket' && (
          <motion.div
            key="ticket"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="ticket-tab-content"
          >
            {!ticketSubmitted ? (
              <>
                <div className="ticket-header">
                  <h3>Create Support Ticket</h3>
                  <p>Fill out the form below and we'll get back to you within 24 hours</p>
                </div>

                <form onSubmit={handleTicketSubmit} className="ticket-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Subject <span className="required">*</span></label>
                      <input
                        type="text"
                        value={ticketData.subject}
                        onChange={(e) => setTicketData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Brief description of the issue"
                        className="ticket-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Category <span className="required">*</span></label>
                      <select
                        value={ticketData.category}
                        onChange={(e) => setTicketData(prev => ({ ...prev, category: e.target.value }))}
                        className="ticket-select"
                      >
                        {ticketCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Priority</label>
                      <div className="priority-options">
                        {priorityLevels.map(priority => (
                          <button
                            key={priority.id}
                            type="button"
                            className={`priority-option ${ticketData.priority === priority.id ? 'active' : ''}`}
                            style={{
                              borderColor: ticketData.priority === priority.id ? priority.color : 'transparent',
                              backgroundColor: ticketData.priority === priority.id ? `${priority.color}20` : 'transparent'
                            }}
                            onClick={() => setTicketData(prev => ({ ...prev, priority: priority.id }))}
                          >
                            <span className="priority-dot" style={{ backgroundColor: priority.color }}></span>
                            {priority.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Message <span className="required">*</span></label>
                    <textarea
                      value={ticketData.message}
                      onChange={(e) => setTicketData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Describe your issue in detail..."
                      rows="6"
                      className="ticket-textarea"
                    />
                  </div>

                  <div className="form-group">
                    <label>Attachments (Optional)</label>
                    <div className="file-upload-area">
                      <input
                        type="file"
                        multiple
                        id="file-upload"
                        className="file-input"
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          setTicketData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
                        }}
                      />
                      <label htmlFor="file-upload" className="file-upload-label">
                        <FaDownload /> Click to upload or drag and drop
                      </label>
                      <p className="file-hint">Supported: Images, PDFs (Max 10MB each)</p>
                    </div>
                    
                    {ticketData.attachments.length > 0 && (
                      <div className="attachment-list">
                        {ticketData.attachments.map((file, index) => (
                          <div key={index} className="attachment-item">
                            <span>{file.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newAttachments = ticketData.attachments.filter((_, i) => i !== index);
                                setTicketData(prev => ({ ...prev, attachments: newAttachments }));
                              }}
                            >
                              <FaTimesCircle />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ticket-actions">
                    <button type="button" className="cancel-btn" onClick={resetTicketForm}>
                      Clear Form
                    </button>
                    <button type="submit" className="submit-ticket-btn" disabled={ticketSubmitting}>
                      {ticketSubmitting ? <FaSpinner className="spinner" /> : <><FaPaperPlane /> Submit Ticket</>}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <motion.div
                className="ticket-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <FaCheckCircle className="success-icon" />
                <h3>Ticket Submitted Successfully!</h3>
                <p>Your support ticket has been created. We'll get back to you within 24 hours.</p>
                <div className="ticket-info">
                  <p><strong>Ticket ID:</strong> #SUP-{Math.floor(Math.random() * 10000)}</p>
                  <p><strong>Estimated Response Time:</strong> 2-4 hours</p>
                </div>
                <button className="create-another-btn" onClick={resetTicketForm}>
                  Create Another Ticket
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <motion.div
            key="announcements"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="announcements-tab-content"
          >
            <div className="announcements-header">
              <h3>Announcements & Updates</h3>
              {announcements.some(a => !a.read) && (
                <button className="mark-read-btn" onClick={markAllRead}>
                  <FaCheckCircle /> Mark All Read
                </button>
              )}
            </div>

            {announcementsLoading ? (
              <div className="announcements-loading">
                <FaSpinner className="spinner" />
                <p>Loading announcements...</p>
              </div>
            ) : (
              <div className="announcements-list">
                {announcements.map((announcement, index) => (
                  <motion.div
                    key={announcement.id}
                    className={`announcement-card ${!announcement.read ? 'unread' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => markAnnouncementRead(announcement.id)}
                  >
                    <div className="announcement-icon" style={{ backgroundColor: `${announcement.color}20` }}>
                      <announcement.icon style={{ color: announcement.color }} />
                    </div>
                    <div className="announcement-content">
                      <div className="announcement-header">
                        <h4>{announcement.title}</h4>
                        {!announcement.read && <span className="unread-badge">New</span>}
                      </div>
                      <p>{announcement.description}</p>
                      <div className="announcement-meta">
                        <span className="announcement-date">
                          <FaClock /> {announcement.date}
                        </span>
                        <span className={`announcement-type ${announcement.type}`}>
                          {announcement.type}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="announcements-footer">
              <button className="view-all-btn">
                View All Announcements <FaExternalLinkAlt />
              </button>
            </div>
          </motion.div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="feedback-tab-content"
          >
            {!feedbackSubmitted ? (
              <>
                <div className="feedback-header">
                  <h3>We Value Your Feedback</h3>
                  <p>Help us improve SabAI Pay by sharing your experience</p>
                </div>

                <div className="feedback-rating">
                  <p>How would you rate your experience with SabAI Pay?</p>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`star ${star <= (feedbackHover || feedbackRating) ? 'active' : ''}`}
                        onMouseEnter={() => setFeedbackHover(star)}
                        onMouseLeave={() => setFeedbackHover(0)}
                        onClick={() => setFeedbackRating(star)}
                      >
                        {star <= (feedbackHover || feedbackRating) ? <FaStar /> : <FaRegStar />}
                      </span>
                    ))}
                  </div>
                  <span className="rating-label">
                    {feedbackRating === 1 && 'Poor'}
                    {feedbackRating === 2 && 'Fair'}
                    {feedbackRating === 3 && 'Good'}
                    {feedbackRating === 4 && 'Very Good'}
                    {feedbackRating === 5 && 'Excellent'}
                  </span>
                </div>

                <div className="feedback-message">
                  <p>Tell us more (optional)</p>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Share your thoughts, suggestions, or report issues..."
                    rows="5"
                    className="feedback-textarea"
                  />
                </div>

                <div className="feedback-actions">
                  <button 
                    className="submit-feedback-btn"
                    onClick={handleFeedbackSubmit}
                    disabled={feedbackSubmitting}
                  >
                    {feedbackSubmitting ? <FaSpinner className="spinner" /> : 'Submit Feedback'}
                  </button>
                </div>
              </>
            ) : (
              <motion.div
                className="feedback-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <FaHeart className="success-icon" />
                <h3>Thank You!</h3>
                <p>Your feedback helps us make SabAI Pay better for everyone.</p>
                <div className="feedback-badge">
                  <FaMedal /> You're awesome!
                </div>
                <button 
                  className="submit-another-btn"
                  onClick={() => {
                    setFeedbackSubmitted(false);
                    setFeedbackRating(0);
                    setFeedbackMessage('');
                  }}
                >
                  Submit Another Feedback
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HelpSupport;