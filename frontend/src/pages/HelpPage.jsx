import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  FaUser,
  FaLock,
  FaArrowRight
} from 'react-icons/fa';
import { MdHelp, MdSupport } from 'react-icons/md';
import Button from '../components/common/Button';
import './HelpPage.css';

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I create a SabAI Pay account?',
          a: 'Download the app, click on "Sign Up", enter your mobile number, verify with OTP, and complete your profile. You can also register through our website.'
        },
        {
          q: 'How do I link my bank account?',
          a: 'Go to Settings > Bank Accounts, click "Add Bank Account", enter your account details, and verify with UPI PIN. Your account will be linked instantly.'
        },
        {
          q: 'Is SabAI Pay free to use?',
          a: 'Yes, SabAI Pay is completely free for all UPI transactions. There are no hidden charges or fees.'
        }
      ]
    },
    {
      category: 'Payments & Transactions',
      questions: [
        {
          q: 'How do I send money?',
          a: 'Click on "Send Money", enter recipient\'s UPI ID or mobile number, enter amount, add note (optional), and confirm with your UPI PIN.'
        },
        {
          q: 'What is Agent Pay?',
          a: 'Agent Pay is our AI-powered feature that lets you make payments through natural language. Just chat with SabAI and tell them what you want to do!'
        },
        {
          q: 'How do I request money?',
          a: 'Go to "Request Money", enter the payer\'s UPI ID, amount, and note. Share the generated payment link or QR code with them.'
        }
      ]
    },
    {
      category: 'SabAI Gems & Rewards',
      questions: [
        {
          q: 'What are SabAI Gems?',
          a: 'SabAI Gems are reward points you earn on every transaction (1% cashback). You can redeem them for bill payments, recharges, and more.'
        },
        {
          q: 'How do I earn more Gems?',
          a: 'Earn Gems through transactions, daily logins, referrals, completing challenges, and participating in special offers.'
        },
        {
          q: 'Do Gems expire?',
          a: 'Yes, SabAI Gems expire after 30 days. You\'ll receive notifications before they expire.'
        }
      ]
    },
    {
      category: 'Security & Privacy',
      questions: [
        {
          q: 'How secure is SabAI Pay?',
          a: 'We use bank-grade encryption, secure authentication, and regular security audits. Your data and money are completely safe.'
        },
        {
          q: 'What if I forget my UPI PIN?',
          a: 'You can reset your UPI PIN by going to Settings > Security > Change UPI PIN. You\'ll need your bank account details to reset.'
        },
        {
          q: 'How do I report unauthorized transactions?',
          a: 'Immediately contact our support team at security@sabaipay.com or call our helpline. We have 24/7 fraud monitoring.'
        }
      ]
    }
  ];

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

  const contactOptions = [
    {
      icon: FaHeadset,
      title: '24/7 Support',
      description: 'Get help anytime',
      action: 'Start Chat',
      color: '#667eea'
    },
    {
      icon: FaEnvelope,
      title: 'Email Us',
      description: 'support@sabaipay.com',
      action: 'Send Email',
      color: '#10b981'
    },
    {
      icon: FaPhone,
      title: 'Call Us',
      description: '+91 98765 43210',
      action: 'Call Now',
      color: '#f59e0b'
    },
    {
      icon: FaComments,
      title: 'Live Chat',
      description: 'Talk to our team',
      action: 'Start Chat',
      color: '#8b5cf6'
    }
  ];

  const guides = [
    {
      icon: FaUser,
      title: 'Getting Started Guide',
      description: 'New to SabAI Pay? Start here',
      link: '/guide/getting-started'
    },
    {
      icon: FaRobot,
      title: 'Using Agent Pay',
      description: 'Master AI-powered payments',
      link: '/guide/agent-pay'
    },
    {
      icon: FaCoins,
      title: 'SabAI Gems Rewards',
      description: 'Earn and redeem rewards',
      link: '/guide/gems'
    },
    {
      icon: FaShieldAlt,
      title: 'Security Best Practices',
      description: 'Keep your account safe',
      link: '/guide/security'
    }
  ];

  return (
    <div className="help-page">
      {/* Hero Section */}
      <section className="help-hero">
        <h1>How can we help you?</h1>
        <div className="search-box">
          <FaQuestionCircle className="search-icon" />
          <input
            type="text"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Contact Options */}
      <section className="contact-options">
        <h2>Contact Us</h2>
        <div className="contact-grid">
          {contactOptions.map((option, index) => (
            <motion.div
              key={index}
              className="contact-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <div className="contact-icon" style={{ backgroundColor: option.color }}>
                <option.icon />
              </div>
              <h3>{option.title}</h3>
              <p>{option.description}</p>
              <button className="contact-action">
                {option.action} <FaArrowRight />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        
        <div className="faq-list">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((category, catIndex) => (
              <div key={catIndex} className="faq-category">
                <h3>{category.category}</h3>
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
                        {activeFaq === `${catIndex}-${qIndex}` ? '−' : '+'}
                      </span>
                    </button>
                    {activeFaq === `${catIndex}-${qIndex}` && (
                      <motion.div
                        className="faq-answer"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <p>{faq.a}</p>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No results found for "{searchQuery}"</p>
              <Button variant="primary" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Guides Section */}
      <section className="guides-section">
        <h2>Helpful Guides</h2>
        <div className="guides-grid">
          {guides.map((guide, index) => (
            <motion.div
              key={index}
              className="guide-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <div className="guide-icon">
                <guide.icon />
              </div>
              <h3>{guide.title}</h3>
              <p>{guide.description}</p>
              <button className="guide-link">
                Read Guide <FaArrowRight />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="still-need-help">
        <MdSupport className="help-icon" />
        <h2>Still Need Help?</h2>
        <p>Our support team is available 24/7 to assist you</p>
        <div className="help-buttons">
          <Button variant="primary" icon={FaHeadset}>
            Start Live Chat
          </Button>
          <Button variant="outline" icon={FaEnvelope}>
            Send Email
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HelpPage;