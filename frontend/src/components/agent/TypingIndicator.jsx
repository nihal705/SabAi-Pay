import React from 'react';
import { motion } from 'framer-motion';
import { FaRobot } from 'react-icons/fa';
import './AgentStyles.css';

const TypingIndicator = ({ variant = 'default' }) => {
  const variants = {
    default: {
      container: 'typing-indicator-default',
      dotCount: 3
    },
    bubble: {
      container: 'typing-indicator-bubble',
      dotCount: 3
    },
    minimal: {
      container: 'typing-indicator-minimal',
      dotCount: 2
    },
    wave: {
      container: 'typing-indicator-wave',
      dotCount: 4
    }
  };

  const currentVariant = variants[variant] || variants.default;

  const renderDots = () => {
    return [...Array(currentVariant.dotCount)].map((_, i) => (
      <motion.span
        key={i}
        className="typing-dot"
        animate={{
          y: ['0%', '50%', '0%'],
          opacity: [0.4, 1, 0.4]
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          delay: i * 0.2,
          ease: "easeInOut"
        }}
      />
    ));
  };

  if (variant === 'bubble') {
    return (
      <div className="typing-bubble-container">
        <div className="typing-avatar">
          <FaRobot />
        </div>
        <div className={`typing-bubble ${currentVariant.container}`}>
          {renderDots()}
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`typing-minimal ${currentVariant.container}`}>
        <span className="typing-text">SabAI is typing</span>
        {renderDots()}
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={`typing-wave ${currentVariant.container}`}>
        {renderDots()}
      </div>
    );
  }

  return (
    <div className={`typing-indicator ${currentVariant.container}`}>
      {renderDots()}
    </div>
  );
};

// Typing Animation with Text
export const TypingWithText = ({ text = "SabAI is thinking", interval = 100 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, interval);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, interval]);

  return (
    <div className="typing-with-text">
      <span className="typing-text-content">{displayText}</span>
      <span className="typing-cursor">|</span>
    </div>
  );
};

// Typing Dots Animation
export const TypingDots = ({ count = 3, size = 'medium' }) => {
  const sizes = {
    small: '6px',
    medium: '8px',
    large: '12px'
  };

  const dotSize = sizes[size] || sizes.medium;

  return (
    <div className="typing-dots-container">
      {[...Array(count)].map((_, i) => (
        <motion.span
          key={i}
          className="typing-dot"
          style={{
            width: dotSize,
            height: dotSize
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Typing Bubble with Avatar
export const TypingBubble = ({ avatar = true, name = "SabAI" }) => {
  return (
    <div className="typing-bubble-wrapper">
      {avatar && (
        <div className="typing-avatar">
          <FaRobot />
        </div>
      )}
      <div className="typing-message-bubble">
        <TypingDots count={3} size="medium" />
        {name && <span className="typing-name">{name}</span>}
      </div>
    </div>
  );
};

// Pulse Animation Indicator
export const PulseIndicator = () => {
  return (
    <div className="pulse-indicator">
      <motion.div
        className="pulse-ring"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <div className="pulse-dot" />
    </div>
  );
};

// Loading Skeleton for Messages
export const MessageSkeleton = () => {
  return (
    <div className="message-skeleton">
      <div className="skeleton-avatar" />
      <div className="skeleton-content">
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
    </div>
  );
};

export default TypingIndicator;