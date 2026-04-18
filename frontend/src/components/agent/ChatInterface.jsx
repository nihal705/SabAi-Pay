import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePayment } from '../../context/PaymentContext';
import {
  FaRobot,
  FaUser,
  FaPaperPlane,
  FaMicrophone,
  FaStop,
  FaShoppingBag,
  FaUtensils,
  FaBolt,
  FaCreditCard,
  FaCoins,
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaInfoCircle,
  FaMagic,
  FaTrash,
  FaCopy
} from 'react-icons/fa';
import { MdAttachMoney, MdReceipt } from 'react-icons/md';
import MessageBubble from './MessageBubble';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal, { ConfirmModal } from '../common/Modal';
import axios from 'axios';
import toast from 'react-hot-toast';
import './AgentStyles.css';

const ChatInterface = () => {
  const { user } = useAuth();
  const { balance, fetchBalance } = usePayment();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    // Add welcome message
    const welcomeMessage = {
      id: 'welcome',
      type: 'agent',
      content: `Hi ${user?.name || 'there'}! 👋 I'm SabAI, your AI payment assistant. How can I help you today?`,
      timestamp: new Date().toISOString(),
      suggestions: [
        { text: 'Send money to Rahul', icon: FaUser },
        { text: 'Order pizza under ₹400', icon: FaUtensils },
        { text: 'Pay electricity bill', icon: FaBolt },
        { text: 'Check my balance', icon: FaCoins }
      ]
    };
    setMessages([welcomeMessage]);
    fetchSuggestions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/agent/suggestions`);
      if (response.data.success) {
        setSuggestions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSendMessage = async (content = input) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setTyping(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/agent/chat`, {
        message: content,
        conversation_id: conversationId
      });

      if (response.data.success) {
        setTyping(false);
        
        // Add agent response
        const agentMessage = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          content: response.data.data.response,
          timestamp: new Date().toISOString(),
          intent: response.data.data.intent,
          orderDetails: response.data.data.order_details,
          limitCheck: response.data.data.limit_check,
          suggestions: response.data.data.suggestions
        };
        setMessages(prev => [...prev, agentMessage]);

        // Check if order needs approval
        if (response.data.data.limit_check?.requires_approval) {
          setPendingOrder({
            ...response.data.data.order_details,
            agentTxnId: response.data.data.agent_txn_id
          });
          setShowOrderModal(true);
        }

        // Update conversation ID
        if (response.data.data.conversation_id) {
          setConversationId(response.data.data.conversation_id);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setTyping(false);
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if (!isRecording) {
      // Start voice recording
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsRecording(true);
          toast.loading('Listening...', { id: 'voice' });
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          toast.success('Voice captured!', { id: 'voice' });
          setIsRecording(false);
        };

        recognition.onerror = () => {
          toast.error('Could not understand audio', { id: 'voice' });
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
      } else {
        toast.error('Voice input not supported in this browser');
      }
    } else {
      setIsRecording(false);
      toast.dismiss('voice');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion.text || suggestion);
  };

  const handleOrderConfirmation = async (approved) => {
    setShowOrderModal(false);
    
    if (approved && pendingOrder) {
      setLoading(true);
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/agent/process-order`, {
          ...pendingOrder,
          auto_approve: true
        });

        if (response.data.success) {
          toast.success('Order placed successfully!');
          
          // Add confirmation message
          const confirmMessage = {
            id: Date.now().toString(),
            type: 'agent',
            content: `✅ Great! Your order has been placed. You'll receive updates shortly.`,
            timestamp: new Date().toISOString(),
            isSuccess: true
          };
          setMessages(prev => [...prev, confirmMessage]);
          
          fetchBalance(); // Update balance
        }
      } catch (error) {
        toast.error('Failed to place order');
      } finally {
        setLoading(false);
      }
    }
    setPendingOrder(null);
  };

  const handleClearChat = () => {
    if (messages.length > 1) {
      ConfirmModal({
        isOpen: true,
        title: 'Clear Chat',
        message: 'Are you sure you want to clear the chat history?',
        onConfirm: () => {
          setMessages([messages[0]]); // Keep only welcome message
          toast.success('Chat cleared');
        }
      });
    }
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="chat-interface-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="agent-avatar">
            <FaRobot />
          </div>
          <div>
            <h2>SabAI Assistant</h2>
            <p className="agent-status">
              {typing ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button
            className="clear-chat-btn"
            onClick={handleClearChat}
            title="Clear chat"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      <div className="chat-messages">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onCopy={() => handleCopyMessage(message.content)}
              onSuggestionClick={handleSuggestionClick}
            />
          ))}
        </AnimatePresence>
        
        {typing && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length < 3 && suggestions.length > 0 && (
        <div className="quick-suggestions">
          <p className="suggestions-title">Try asking:</p>
          <div className="suggestions-grid">
            {suggestions.slice(0, 4).map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className="suggestion-emoji">{suggestion.emoji}</span>
                <span>{suggestion.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-input-container">
        <button
          className={`voice-btn ${isRecording ? 'recording' : ''}`}
          onClick={handleVoiceInput}
        >
          {isRecording ? <FaStop /> : <FaMicrophone />}
        </button>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={loading}
          className="chat-input"
        />

        <button
          className="send-btn"
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || loading}
        >
          <FaPaperPlane />
        </button>
      </div>

      {/* Order Confirmation Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Confirm Order"
        size="small"
      >
        <div className="order-confirm-modal">
          <div className="order-details">
            <h4>Order Summary</h4>
            {pendingOrder && (
              <>
                <div className="order-item">
                  <span>Item:</span>
                  <strong>{pendingOrder.item}</strong>
                </div>
                <div className="order-item">
                  <span>Merchant:</span>
                  <strong className="merchant-name">{pendingOrder.merchant}</strong>
                </div>
                <div className="order-item highlight">
                  <span>Amount:</span>
                  <strong>₹{pendingOrder.budget}</strong>
                </div>
              </>
            )}
          </div>

          <div className="order-warning">
            <FaInfoCircle />
            <p>This order requires your approval as it exceeds your auto-pay limit.</p>
          </div>

          <div className="order-actions">
            <Button
              variant="secondary"
              onClick={() => handleOrderConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleOrderConfirmation(true)}
              loading={loading}
            >
              Approve Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatInterface;