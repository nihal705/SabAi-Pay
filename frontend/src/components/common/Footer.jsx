// frontend/src/components/common/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext'; 
import { 
  FaFacebook, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedin, 
  FaGithub,
  FaHeart 
} from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { darkMode } = useTheme();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-section">
            <div className="footer-brand-container">
              <div className="footer-logo-image-container">
                <img 
                  src={darkMode ? "/images/merchants/sabailogodark1.png" : "/images/merchants/sabailogo.png"}
                  alt="SabAI Pay" 
                  className="footer-logo-image"
                />
              </div>
              <Link to="/" className="footer-brand">
                <div className="logo-wrapper">
                  <span className="logo-sab">
                    <span className="sa">Sa</span>
                    <span className="b">b</span>
                  </span>
                  <span className="logo-ai">AI</span>
                  <span className="logo-pay">Pay</span>
                </div>
              </Link>
            </div>
            <p className="footer-tagline">
              AI-Powered UPI Payment Assistant
            </p>
            <p className="footer-description">
              Experience the future of payments with intelligent AI assistance,
              reward points, and secure transactions.
            </p>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <FaFacebook />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <FaTwitter />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <FaInstagram />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <FaLinkedin />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <FaGithub />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/terms">Terms & Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div className="footer-section">
            <h4>Features</h4>
            <ul>
              <li><Link to="/agent">AI Agent</Link></li>
              <li><Link to="/reserve-pay">Reserve Pay</Link></li>
              <li><Link to="/coins">SabAI Coins</Link></li>
              <li><Link to="/bills">Bill Payments</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-section">
            <h4>Contact Us</h4>
            <div className="contact-info">
              <p>📞 +91 84318 75440</p>
              <p>✉️ support@sabaipay.com</p>
              <p>📍 Bengaluru, India</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} SabAI Pay. All rights reserved.</p>
          <p className="made-with">
            Made with <FaHeart className="heart-icon" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;