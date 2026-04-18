// frontend/src/components/common/Loader.js
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Loader.css';

const Loader = ({ size = 'medium', fullScreen = false }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');
  
  const sizes = {
    small: 60,
    medium: 100,
    large: 140
  };

  const loaderSize = sizes[size];
  
  // Simulate loading progress
  useEffect(() => {
    const texts = [
      'Initializing...',
      'Loading SabAI Pay...',
      'Connecting to secure servers...',
      'Almost there...',
      'Welcome to SabAI Pay!'
    ];
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    // Change text at different progress points
    const textInterval = setInterval(() => {
      if (progress < 20) setLoadingText(texts[0]);
      else if (progress < 40) setLoadingText(texts[1]);
      else if (progress < 60) setLoadingText(texts[2]);
      else if (progress < 80) setLoadingText(texts[3]);
      else if (progress < 100) setLoadingText(texts[4]);
    }, 500);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, [progress]);

  const logoVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const textVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { delay: 0.3, duration: 0.5 }
    }
  };

  const progressBarVariants = {
    initial: { width: 0 },
    animate: { 
      width: `${progress}%`,
      transition: { duration: 0.1 }
    }
  };

  const floatingElements = [...Array(6)].map((_, i) => (
    <motion.div
      key={i}
      className="floating-element"
      initial={{ 
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        scale: 0 
      }}
      animate={{ 
        y: [null, -30, 30, -30],
        x: [null, 30, -30, 30],
        rotate: [0, 180, 360],
        scale: [0, 1, 0.8, 0]
      }}
      transition={{
        duration: 10 + i * 2,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      {i % 2 === 0 ? '🪙' : '💎'}
    </motion.div>
  ));

  if (fullScreen) {
    return (
      <div className="fullscreen-loader">
        {floatingElements}
        <div className="loader-content">
          <motion.div
            className="logo-container"
            variants={logoVariants}
            initial="initial"
            animate="animate"
          >
            <img 
              src="/images/merchants/sabailogo.jpeg"
              alt="SabAI Pay" 
              className="loader-logo"
            />
            <div className="logo-text-container">
              <span className="logo-sab">Sab</span>
              <span className="logo-ai">AI</span>
              <span className="logo-pay">Pay</span>
            </div>
          </motion.div>

          <motion.p
            className="loader-tagline"
            variants={textVariants}
            initial="initial"
            animate="animate"
          >
            AI-Powered UPI Payment Assistant
          </motion.p>

          <motion.div
            className="progress-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="progress-bar-wrapper">
              <motion.div 
                className="progress-bar-fill"
                variants={progressBarVariants}
                initial="initial"
                animate="animate"
              />
            </div>
            <div className="progress-info">
              <span className="progress-text">{loadingText}</span>
              <span className="progress-percentage">{progress}%</span>
            </div>
          </motion.div>

          <motion.div
            className="feature-previews"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <span>AI Assistant</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Instant UPI</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <span>Secure</span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="loader-container">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: loaderSize,
          height: loaderSize,
          border: `3px solid #f3f3f3`,
          borderTop: `3px solid #667eea`,
          borderRadius: '50%'
        }}
      />
    </div>
  );
};

export default Loader;