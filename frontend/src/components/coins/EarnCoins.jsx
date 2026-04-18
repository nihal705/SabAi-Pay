import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaGem,
  FaGift,
  FaStar,
  FaFire,
  FaTrophy,
  FaMedal,
  FaCalendarAlt,
  FaUsers,
  FaShoppingBag,
  FaUtensils,
  FaBolt,
  FaMobile,
  FaShare,
  FaCopy,
  FaCheckCircle,
  FaArrowRight,
  FaInfoCircle,
  FaRocket,
  FaBolt as FaLightning,
  FaCrown
} from 'react-icons/fa';
import { MdEmojiEvents } from 'react-icons/md';
import Button from '../common/Button';
import axios from 'axios';
import toast from 'react-hot-toast';
import './CoinStyles.css';

const EarnCoins = ({ onEarn }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');
  const [userStats, setUserStats] = useState({
    dailyStreak: 0,
    referralCount: 0,
    completedChallenges: []
  });
  const [referralCode, setReferralCode] = useState('SABAI123');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchUserStats();
    fetchReferralCode();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/stats`);
      if (response.data.success) {
        setUserStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchReferralCode = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/referral/code`);
      if (response.data.success) {
        setReferralCode(response.data.data.code);
      }
    } catch (error) {
      console.error('Error fetching referral code:', error);
    }
  };

  const earnOptions = {
    daily: [
      {
        id: 'login',
        title: 'Daily Login',
        description: 'Log in to SabAI Pay',
        reward: '5 Gems',
        icon: FaCalendarAlt,
        color: '#667eea',
        action: 'Check In',
        completed: false,
        cooldown: 'Resets in 12h'
      },
      {
        id: 'transaction',
        title: 'First Transaction',
        description: 'Make your first transaction of the day',
        reward: '10 Gems',
        icon: FaShoppingBag,
        color: '#10b981',
        action: 'Send Money',
        completed: false
      },
      {
        id: 'streak',
        title: 'Streak Bonus',
        description: `${userStats.dailyStreak} day streak!`,
        reward: `${userStats.dailyStreak * 5} Gems`,
        icon: FaFire,
        color: '#f59e0b',
        action: 'Claim Bonus',
        completed: false,
        streak: userStats.dailyStreak
      },
      {
        id: 'bill',
        title: 'Pay a Bill',
        description: 'Pay any bill today',
        reward: '15 Gems',
        icon: FaBolt,
        color: '#ef4444',
        action: 'Pay Bills',
        completed: false
      }
    ],
    challenges: [
      {
        id: 'challenge1',
        title: 'Weekend Warrior',
        description: 'Make 5 transactions this weekend',
        reward: '50 Gems',
        icon: FaTrophy,
        color: '#fbbf24',
        progress: 3,
        total: 5,
        daysLeft: 2
      },
      {
        id: 'challenge2',
        title: 'Bill Master',
        description: 'Pay 3 bills this month',
        reward: '75 Gems',
        icon: FaBolt,
        color: '#8b5cf6',
        progress: 2,
        total: 3,
        daysLeft: 15
      },
      {
        id: 'challenge3',
        title: 'Shopping Spree',
        description: 'Spend ₹5000 on shopping',
        reward: '100 Gems',
        icon: FaShoppingBag,
        color: '#ec4899',
        progress: 3250,
        total: 5000,
        daysLeft: 7
      }
    ],
    achievements: [
      {
        id: 'achievement1',
        title: 'First Step',
        description: 'Complete your first transaction',
        reward: '25 Gems',
        icon: FaStar,
        color: '#fbbf24',
        unlocked: true,
        date: '2 days ago'
      },
      {
        id: 'achievement2',
        title: 'Social Butterfly',
        description: 'Refer 5 friends',
        reward: '100 Gems',
        icon: FaUsers,
        color: '#10b981',
        unlocked: false,
        progress: 3,
        total: 5
      },
      {
        id: 'achievement3',
        title: 'Big Spender',
        description: 'Spend ₹10,000 total',
        reward: '200 Gems',
        icon: FaCrown,
        color: '#8b5cf6',
        unlocked: false,
        progress: 7500,
        total: 10000
      },
      {
        id: 'achievement4',
        title: 'Early Bird',
        description: 'Log in for 7 consecutive days',
        reward: '50 Gems',
        icon: FaCalendarAlt,
        color: '#667eea',
        unlocked: false,
        progress: 4,
        total: 7
      },
      {
        id: 'achievement5',
        title: 'Foodie',
        description: 'Order food 10 times',
        reward: '150 Gems',
        icon: FaUtensils,
        color: '#f59e0b',
        unlocked: false,
        progress: 6,
        total: 10
      }
    ],
    referral: [
      {
        id: 'referral1',
        title: 'Invite Friends',
        description: 'Share SabAI Pay with friends',
        reward: '100 Gems per friend',
        icon: FaUsers,
        color: '#10b981',
        action: 'Invite Now'
      },
      {
        id: 'referral2',
        title: 'Friend’s First Transaction',
        description: 'When your friend makes first payment',
        reward: '50 Gems',
        icon: FaShoppingBag,
        color: '#fbbf24',
        pending: userStats.referralCount || 0
      }
    ],
    special: [
      {
        id: 'special1',
        title: '🎉 Festival Special',
        description: 'Double gems on all transactions',
        reward: '2x Gems',
        icon: FaRocket,
        color: '#ef4444',
        validUntil: 'Mar 31, 2026',
        active: true
      },
      {
        id: 'special2',
        title: '⚡ Weekend Flash',
        description: '50% extra gems on bill payments',
        reward: '+50% Gems',
        icon: FaLightning,
        color: '#f59e0b',
        validUntil: 'This weekend',
        active: true
      },
      {
        id: 'special3',
        title: '👥 Referral Rush',
        description: 'Double referral rewards',
        reward: '200 Gems per friend',
        icon: FaUsers,
        color: '#10b981',
        validUntil: 'Limited time',
        active: true
      }
    ]
  };

  const handleAction = async (option) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`You earned ${option.reward}! 🎉`);
      onEarn?.();
    } catch (error) {
      toast.error('Failed to claim reward');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Referral code copied!');
  };

  const handleShareReferral = async () => {
    const text = `Join me on SabAI Pay and get 100 free Gems! Use my code: ${referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SabAI Pay Referral',
          text: text,
          url: 'https://sabaipay.com'
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyReferral();
    }
  };

  const tabs = [
    { id: 'daily', label: 'Daily', icon: FaCalendarAlt },
    { id: 'challenges', label: 'Challenges', icon: FaTrophy },
    { id: 'achievements', label: 'Achievements', icon: FaStar },
    { id: 'referral', label: 'Referral', icon: FaUsers },
    { id: 'special', label: 'Special', icon: FaRocket }
  ];

  return (
    <div className="earn-coins-container">
      {/* Header */}
      <div className="earn-header">
        <div className="header-title">
          <FaGem className="header-icon" />
          <h2>Earn SabAI Gems</h2>
        </div>
        <p className="header-subtitle">Complete tasks and earn rewards</p>
      </div>

      {/* Streak Card */}
      <motion.div
        className="streak-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="streak-left">
          <div className="streak-icon">
            <FaFire />
          </div>
          <div className="streak-info">
            <h4>{userStats.dailyStreak} Day Streak!</h4>
            <p>Keep it up! +5 Gems daily</p>
          </div>
        </div>
        <div className="streak-right">
          <span className="streak-reward">🔥 {userStats.dailyStreak * 5} Gems</span>
          <button className="streak-claim-btn">Claim</button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="earn-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="earn-tab-content">
        {activeTab === 'daily' && (
          <div className="daily-grid">
            {earnOptions.daily.map((option, index) => (
              <motion.div
                key={option.id}
                className="earn-card daily"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{ borderColor: option.color }}
              >
                <div className="card-header">
                  <div className="card-icon" style={{ backgroundColor: option.color }}>
                    <option.icon />
                  </div>
                  <span className="card-reward">{option.reward}</span>
                </div>

                <h4>{option.title}</h4>
                <p className="card-description">{option.description}</p>

                {option.streak && (
                  <div className="streak-indicator">
                    <FaFire />
                    <span>{option.streak} day streak</span>
                  </div>
                )}

                {option.cooldown && (
                  <span className="cooldown-badge">{option.cooldown}</span>
                )}

                <button
                  className="earn-action-btn"
                  style={{ color: option.color }}
                  onClick={() => handleAction(option)}
                  disabled={option.completed || loading}
                >
                  {option.completed ? 'Completed' : option.action}
                  <FaArrowRight />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="challenges-grid">
            {earnOptions.challenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                className="challenge-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="challenge-header">
                  <div className="challenge-icon" style={{ backgroundColor: challenge.color }}>
                    <challenge.icon />
                  </div>
                  <span className="challenge-reward">{challenge.reward}</span>
                </div>

                <h4>{challenge.title}</h4>
                <p>{challenge.description}</p>

                <div className="progress-section">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span>{challenge.progress}/{challenge.total}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(challenge.progress / challenge.total) * 100}%`,
                        backgroundColor: challenge.color
                      }}
                    />
                  </div>
                </div>

                <div className="challenge-footer">
                  <span className="days-left">
                    <FaCalendarAlt /> {challenge.daysLeft} days left
                  </span>
                  <button className="view-details-btn">
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-grid">
            {earnOptions.achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div className="achievement-icon" style={{ color: achievement.color }}>
                  {achievement.unlocked ? (
                    <achievement.icon />
                  ) : (
                    <div className="locked-overlay">
                      <achievement.icon />
                    </div>
                  )}
                </div>

                <div className="achievement-content">
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                  
                  {!achievement.unlocked && achievement.progress !== undefined && (
                    <div className="achievement-progress">
                      <div className="progress-bar small">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(achievement.progress / achievement.total) * 100}%`,
                            backgroundColor: achievement.color
                          }}
                        />
                      </div>
                      <span className="progress-text">
                        {achievement.progress}/{achievement.total}
                      </span>
                    </div>
                  )}

                  {achievement.unlocked && (
                    <div className="unlocked-badge">
                      <FaCheckCircle />
                      <span>Unlocked {achievement.date}</span>
                    </div>
                  )}
                </div>

                <div className="achievement-reward">
                  <span className="reward-label">Reward</span>
                  <span className="reward-value">{achievement.reward}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'referral' && (
          <div className="referral-section">
            {/* Referral Code Card */}
            <div className="referral-code-card">
              <h3>Your Referral Code</h3>
              <div className="code-display">
                <span className="code">{referralCode}</span>
                <button
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyReferral}
                >
                  {copied ? <FaCheckCircle /> : <FaCopy />}
                </button>
                <button className="share-btn" onClick={handleShareReferral}>
                  <FaShare /> Share
                </button>
              </div>
              <p className="code-info">
                Share this code with friends. They get 50 Gems, you get 100 Gems!
              </p>
            </div>

            {/* Referral Stats */}
            <div className="referral-stats">
              <div className="stat-card">
                <FaUsers className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-label">Total Referrals</span>
                  <span className="stat-value">{userStats.referralCount || 0}</span>
                </div>
              </div>
              <div className="stat-card">
                <FaGem className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-label">Gems Earned</span>
                  <span className="stat-value">{(userStats.referralCount || 0) * 100}</span>
                </div>
              </div>
              <div className="stat-card">
                <FaFire className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-label">Pending</span>
                  <span className="stat-value">{earnOptions.referral[1].pending || 0}</span>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="how-it-works">
              <h4>How It Works</h4>
              <div className="steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <p>Share your referral code</p>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <p>Friend signs up with your code</p>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <p>You both get bonus Gems!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'special' && (
          <div className="special-grid">
            {earnOptions.special.map((offer, index) => (
              <motion.div
                key={offer.id}
                className="special-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{ borderColor: offer.color }}
              >
                <div className="special-header">
                  <div className="special-icon" style={{ backgroundColor: offer.color }}>
                    <offer.icon />
                  </div>
                  <span className="special-badge active">ACTIVE</span>
                </div>

                <h4>{offer.title}</h4>
                <p className="special-description">{offer.description}</p>

                <div className="special-reward">
                  <span className="reward-label">Reward</span>
                  <span className="reward-value">{offer.reward}</span>
                </div>

                <div className="special-footer">
                  <span className="validity">
                    <FaCalendarAlt /> Valid {offer.validUntil}
                  </span>
                  <button className="claim-now-btn">
                    Claim Now <FaArrowRight />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EarnCoins;