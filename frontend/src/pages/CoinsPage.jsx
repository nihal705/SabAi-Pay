// frontend/src/pages/CoinsPage.jsx
// FIXED - Excludes failed transactions, improved category breakdown

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * For licensing inquiries: sabaipaycontact@gmail.com
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import storageService, {
    getCoinBalance, getTransactions, getClaimedChallenges, claimChallenge,
    updateCoinBalance, addTransaction, getCurrentUserId, getLifetimeEarned
} from '../services/storageService';
import { 
  FaCoins, FaGem, FaFire, FaCalendarAlt, FaHistory, FaGift, 
  FaArrowRight, FaArrowDown, FaArrowUp, FaExclamationTriangle, 
  FaCheckCircle, FaTimesCircle, FaClock, FaPercent, FaStar, 
  FaTrophy, FaMedal, FaWallet, FaShoppingBag, FaUtensils, 
  FaBolt, FaMobile, FaGamepad, FaFilm, FaBook, FaCoffee, FaMoon,
  FaPizzaSlice, FaIceCream, FaRocket, FaCrown, FaCopy, FaSun,
  FaTwitter, FaInstagram, FaWhatsapp, FaFacebook, FaUsers, 
  FaUserFriends, FaUserPlus, FaTimes, FaBell, FaEye, FaEyeSlash,
  FaChartLine, FaChartBar, FaChartPie, FaWallet as FaWalletIcon,
  FaExchangeAlt, FaCreditCard, FaHome, FaPlane, FaCar, FaHeart,
  FaLeaf, FaShieldAlt, FaLock, FaUnlockAlt, FaSync, FaDownload,
  FaUpload, FaMoneyBillWave, FaHandHoldingUsd, FaBullhorn,
  FaAward, FaMedal as FaMedalIcon, FaCertificate, FaDiamond,
  FaGem as FaGemIcon, FaSparkles, FaMagic, FaZap, FaInfinity
} from 'react-icons/fa';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import './CoinsPage.css';

const CoinsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [showHistoryDetailModal, setShowHistoryDetailModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [animateValue, setAnimateValue] = useState(false);
  
  // Data State
  const [gemBalance, setGemBalance] = useState(0);
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [lifetimeUsed, setLifetimeUsed] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [history, setHistory] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [claimedChallenges, setClaimedChallenges] = useState([]);
  const [monthlySpending, setMonthlySpending] = useState(0);
  
  // Chart Data
  const [earningTrends, setEarningTrends] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [redemptionStats, setRedemptionStats] = useState([]);
  
  // Stats
  const [monthlyEarned, setMonthlyEarned] = useState(0);
  const [topCategory, setTopCategory] = useState('Shopping');
  const [averageCashback, setAverageCashback] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0);
  const [nextLevelGems, setNextLevelGems] = useState(1000);

  // Helper function to get gem logo
  const GemLogo = ({ size = 'medium' }) => {
    const sizeClass = size === 'large' ? 'gem-logo-large' : 
                      size === 'small' ? 'gem-logo-small' : 'gem-logo-icon';
    return (
      <img src="/images/sabaigems.png" alt="SabAI Gems" className={sizeClass} />
    );
  };

  // Calculate gems from amount (5 gems per ₹100 spent = 5% cashback)
  const calculateGemsFromAmount = (amount) => {
    return Math.floor(amount * 0.05);
  };

  // Load all data
  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => loadAllData(), 30000);
    return () => clearInterval(interval);
}, []);

  const loadAllData = async () => {
    await loadGemData();
    await loadChallenges();
    await loadAchievements();
    await loadChartsData();
};

  // Helper function to get proper category name
  const getCategoryName = (transaction) => {
    // Priority order for category detection
    if (transaction.category) return transaction.category;
    if (transaction.bill_type) {
      const billTypeMap = {
        'electricity': 'Electricity Bill',
        'water': 'Water Bill',
        'mobile': 'Mobile Recharge',
        'broadband': 'Broadband Bill',
        'gas': 'Gas Bill',
        'credit_card': 'Credit Card Bill'
      };
      return billTypeMap[transaction.bill_type] || transaction.bill_type;
    }
    if (transaction.merchant_category) {
      const merchantMap = {
        'food': 'Food & Dining',
        'groceries': 'Groceries',
        'shopping': 'Shopping',
        'entertainment': 'Entertainment',
        'travel': 'Travel',
        'fuel': 'Fuel',
        'healthcare': 'Healthcare',
        'education': 'Education',
        'universal': 'Universal'
      };
      return merchantMap[transaction.merchant_category] || transaction.merchant_category;
    }
    if (transaction.type === 'recharge') return 'Mobile Recharge';
    if (transaction.type === 'bill_payment') return 'Bill Payment';
    if (transaction.type === 'send' || transaction.type === 'sent') return 'Send Money';
    if (transaction.type === 'self_transfer') return 'Self Transfer';
    if (transaction.type === 'challenge_reward') return 'Challenge Reward';
    return 'Other';
  };

// frontend/src/pages/CoinsPage.jsx
// Replace the entire loadGemData function with this fixed version:

const loadGemData = async () => {
  console.log('=== LOADING GEM DATA ===');
  
  // Use getCoinBalance for remaining balance
  const remainingBalance = await getCoinBalance();
  console.log('Remaining balance:', remainingBalance);
  
  // Use getLifetimeEarned for total earned
  const totalEarned = await getLifetimeEarned();
  console.log('Total earned:', totalEarned);
  
  // Get all transactions
  const transactions = await getTransactions();
  console.log('All transactions count:', transactions?.length);
  
  const successfulTransactions = (transactions || []).filter(t => t.status !== 'failed');
  console.log('Successful transactions count:', successfulTransactions.length);
  
  let totalUsed = 0;
  const usageHistory = [];
  const earningHistory = [];
  const expiringGems = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Track monthly earned and monthly spent separately
  let monthlyEarnedAmount = 0;
  let monthlySpentAmount = 0;
  const categorySpending = {}; // For top category calculation
  
  successfulTransactions.forEach(t => {
    // Parse transaction date
    let txnDate;
    if (t.created_at) {
      txnDate = new Date(t.created_at);
    } else if (t.date) {
      txnDate = new Date(t.date);
    } else {
      return;
    }
    
    if (isNaN(txnDate.getTime())) return;
    
    const isCurrentMonth = (txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear);
    
    // ============================================
    // TRACK GEMS USED (for lifetime used)
    // ============================================
    let gemsUsed = 0;
    if (t.payment_breakdown && t.payment_breakdown.gemsAmount > 0) {
      gemsUsed = t.payment_breakdown.gemsAmount;
    }
    if (t.gems_used && t.gems_used > 0) {
      gemsUsed = t.gems_used;
    }
    
    if (gemsUsed > 0) {
      totalUsed += gemsUsed;
      
      // Determine usage description
      let usageDescription = '';
      if (t.type === 'bill' || t.type === 'bill_payment') {
        usageDescription = `Bill payment to ${t.provider || t.merchant}`;
      } else if (t.type === 'recharge') {
        usageDescription = `Mobile recharge for ${t.mobileNumber}`;
      } else if (t.type === 'send' || t.type === 'sent') {
        usageDescription = `Sent to ${t.receiver_name || t.receiver_vpa}`;
      } else if (t.type === 'merchant_order') {
        usageDescription = `Order from ${t.merchant}`;
      } else {
        usageDescription = t.description || `Used ${gemsUsed} gems`;
      }
      
      usageHistory.push({
        id: t.id,
        amount: gemsUsed,
        date: t.date || t.created_at,
        description: usageDescription,
        type: 'used',
        transactionId: t.transactionId,
        source: t.type
      });
    }
    
    // ============================================
    // TRACK GEMS EARNED
    // ============================================
    // Check if this transaction earns gems
    const gemsUsedInTxn = gemsUsed > 0;
    const isEarningType = t.type === 'bill' || t.type === 'bill_payment' ||
                          t.type === 'recharge' || t.type === 'merchant_order' ||
                          t.type === 'auto_pay_execution' || t.type === 'reserve_pay' ||
                          t.type === 'challenge_reward';
    
    // Only add to earned if it's an earning type and NO gems were used
    if (isEarningType && !gemsUsedInTxn) {
      let gemsEarned = 0;
      if (t.type === 'challenge_reward') {
        gemsEarned = t.cashback_earned || t.amount || 0;
      } else {
        gemsEarned = t.cashback_earned || Math.min(Math.floor(t.amount * 0.05), 100);
      }
      
      if (gemsEarned > 0) {
        earningHistory.push({
          id: t.id,
          amount: gemsEarned,
          date: t.date || t.created_at,
          description: t.description || `${t.merchant || t.provider || 'Transaction'}`,
          type: 'earned',
          transactionId: t.transactionId
        });
        
        // Add to monthly earned if current month
        if (isCurrentMonth) {
          monthlyEarnedAmount += gemsEarned;
          console.log(`Monthly earned +${gemsEarned} from:`, t.description || t.type);
        }
      }
    }
    
    // ============================================
    // TRACK MONTHLY SPENDING (for dashboard)
    // ============================================
    // Include all spending transactions (bill, recharge, merchant_order, send)
    const isSpendingType = t.type === 'bill' || t.type === 'bill_payment' ||
                           t.type === 'recharge' || t.type === 'merchant_order' ||
                           t.type === 'send' || t.type === 'sent';
    
    if (isSpendingType && t.amount > 0 && t.status === 'success') {
      const amount = parseFloat(t.amount);
      
      // Add to monthly spending if current month
      if (isCurrentMonth) {
        monthlySpentAmount += amount;
        console.log(`Monthly spent +₹${amount} from:`, t.type, t.merchant || t.provider);
      }
      
      // Track category spending for top category
      let category = 'Other';
      if (t.type === 'recharge') {
        category = 'Mobile Recharge';
      } else if (t.type === 'bill' || t.type === 'bill_payment') {
        if (t.bill_type === 'electricity') category = 'Electricity Bill';
        else if (t.bill_type === 'mobile') category = 'Mobile Recharge';
        else category = 'Bill Payment';
      } else if (t.type === 'merchant_order') {
        category = t.merchant || 'Shopping';
      } else if (t.type === 'send' || t.type === 'sent') {
        category = 'Send Money';
      }
      
      categorySpending[category] = (categorySpending[category] || 0) + amount;
    }
    
    // Check for expiring gems (30 days)
    if (gemsUsed === 0 && isEarningType && !gemsUsedInTxn) {
      const txnDateObj = new Date(t.date || t.created_at);
      if (!isNaN(txnDateObj.getTime())) {
        const daysDiff = Math.floor((now - txnDateObj) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 25 && daysDiff < 30) {
          let gemsEarned = t.cashback_earned || Math.min(Math.floor(t.amount * 0.05), 100);
          if (gemsEarned > 0) {
            expiringGems.push({
              id: t.id,
              amount: gemsEarned,
              expiryDate: new Date(txnDateObj.getTime() + 30 * 24 * 60 * 60 * 1000),
              source: t.description || t.merchant || 'Transaction',
              daysLeft: 30 - daysDiff
            });
          }
        }
      }
    }
  });
  
  console.log('Monthly earned amount:', monthlyEarnedAmount);
  console.log('Monthly spent amount:', monthlySpentAmount);
  console.log('Category spending:', categorySpending);
  
  // Determine top category (highest spending)
  let topCategory = 'None';
  let maxSpending = 0;
  for (const [category, amount] of Object.entries(categorySpending)) {
    if (amount > maxSpending) {
      maxSpending = amount;
      topCategory = category;
    }
  }
  console.log('Top category:', topCategory, 'with ₹', maxSpending);
  
  // Also check redemptions from localStorage
  const redemptions = JSON.parse(localStorage.getItem(`${getCurrentUserId()}_coinRedemptions`) || '[]');
  redemptions.forEach(r => {
    totalUsed += r.coinAmount;
    usageHistory.push({
      id: r.id,
      amount: r.coinAmount,
      date: r.date,
      description: `Redeemed for ${r.type === 'bill' ? 'Bill Payment' : r.type === 'recharge' ? 'Mobile Recharge' : r.type === 'shopping' ? 'Shopping Voucher' : r.type}`,
      type: 'used',
      transactionId: r.id
    });
  });
  
  // Combine history and sort
  const allHistory = [...earningHistory, ...usageHistory];
  allHistory.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });
  
  // Calculate level (every 1000 gems = next level)
  const userLevel = Math.floor(totalEarned / 1000) + 1;
  const progress = ((totalEarned % 1000) / 1000) * 100;
  const nextLevel = (userLevel * 1000) - totalEarned;
  
  // Calculate average cashback rate
  const totalSpent = successfulTransactions
    .filter(t => {
      const isSpending = t.type === 'bill' || t.type === 'bill_payment' ||
                         t.type === 'recharge' || t.type === 'merchant_order';
      const gemsUsed = (t.payment_breakdown && t.payment_breakdown.gemsAmount > 0) || 
                       (t.gems_used === true) || (t.gems_used > 0);
      return isSpending && !gemsUsed && t.amount > 0;
    })
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const avgCashback = totalSpent > 0 ? ((totalEarned * 100) / totalSpent).toFixed(1) : 0;
  
  // Update all state variables
  setGemBalance(remainingBalance);
  setLifetimeEarned(totalEarned);
  setLifetimeUsed(totalUsed);
  setExpiringSoon(expiringGems);
  setHistory(allHistory.slice(0, 50));
  setMonthlyEarned(monthlyEarnedAmount);
  setMonthlySpending(monthlySpentAmount);  // Make sure you have this state
  setTopCategory(topCategory);
  setAverageCashback(parseFloat(avgCashback));
  setLevel(userLevel);
  setLevelProgress(progress);
  setNextLevelGems(nextLevel);
  
  console.log('Final state - Monthly Earned:', monthlyEarnedAmount);
  console.log('Final state - Monthly Spending:', monthlySpentAmount);
  console.log('Final state - Top Category:', topCategory);
};

  const loadChallenges = async () => {
    const claimed = await getClaimedChallenges();
    setClaimedChallenges(claimed);
    
    const transactions = await getTransactions();
    // Ensure transactions is an array
    if (!transactions || !Array.isArray(transactions)) {
        setChallenges([]);
        return;
    }
    
    // Only consider successful transactions for challenges
    const successfulTransactions = transactions.filter(t => t.status !== 'failed');
    
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    
    // Filter this week's successful transactions
    const weekTxns = successfulTransactions.filter(t => {
        const txnDate = new Date(t.date);
        return txnDate >= currentWeekStart;
    });
    
    // Calculate challenge progress
    const today = new Date();
    const todayTxns = weekTxns.filter(t => new Date(t.date).toDateString() === today.toDateString());
    const totalSpentWeek = weekTxns.reduce((sum, t) => sum + t.amount, 0);
    const foodTxns = weekTxns.filter(t => getCategoryName(t) === 'Food & Dining').length;
    const billTxns = weekTxns.filter(t => t.type === 'bill_payment' || t.type === 'bill').length;
    const uniqueMerchants = new Set(weekTxns.map(t => t.merchant || t.provider)).size;
    
    const challengesList = [
        {
            id: 1,
            title: 'Early Bird',
            description: 'Make a transaction before 10 AM',
            progress: todayTxns.length > 0 && today.getHours() < 10 ? 1 : 0,
            total: 1,
            reward: 10,
            icon: FaSun,
            color: '#f59e0b',
            completed: todayTxns.length > 0 && today.getHours() < 10,
            claimed: claimed.includes(1)
        },
        {
            id: 2,
            title: 'Night Owl',
            description: 'Make a transaction after 10 PM',
            progress: todayTxns.length > 0 && today.getHours() >= 22 ? 1 : 0,
            total: 1,
            reward: 10,
            icon: FaMoon,
            color: '#3b82f6',
            completed: todayTxns.length > 0 && today.getHours() >= 22,
            claimed: claimed.includes(2)
        },
        {
            id: 3,
            title: 'Food Lover',
            description: 'Order food 3 times this week',
            progress: Math.min(foodTxns, 3),
            total: 3,
            reward: 30,
            icon: FaUtensils,
            color: '#10b981',
            completed: foodTxns >= 3,
            claimed: claimed.includes(3)
        },
        {
            id: 4,
            title: 'Bill Master',
            description: 'Pay 2 bills this week',
            progress: Math.min(billTxns, 2),
            total: 2,
            reward: 20,
            icon: FaBolt,
            color: '#ef4444',
            completed: billTxns >= 2,
            claimed: claimed.includes(4)
        },
        {
            id: 5,
            title: 'Shop Explorer',
            description: 'Use 5 different merchants',
            progress: Math.min(uniqueMerchants, 5),
            total: 5,
            reward: 50,
            icon: FaShoppingBag,
            color: '#8b5cf6',
            completed: uniqueMerchants >= 5,
            claimed: claimed.includes(5)
        },
        {
            id: 6,
            title: 'Big Spender',
            description: 'Spend ₹5000 this week',
            progress: Math.min(totalSpentWeek, 5000),
            total: 5000,
            reward: 50,
            icon: FaCrown,
            color: '#fbbf24',
            completed: totalSpentWeek >= 5000,
            claimed: claimed.includes(6),
            isAmount: true
        }
    ];
    
    setChallenges(challengesList);
};

  const claimChallengeReward = async (challengeId) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.completed || challenge.claimed) return;
    
    const success = await claimChallenge(challengeId);
    
    if (success) {
        const newBalance = await updateCoinBalance(challenge.reward, true);
        
        await addTransaction({
            transactionId: `CHALLENGE_${Date.now()}`,
            type: 'challenge_reward',
            amount: challenge.reward,
            description: `Completed challenge: ${challenge.title}`,
            status: 'success',
            cashback: challenge.reward
        });
        
        toast.success(`🎉 Claimed ${challenge.reward} SabAI Gems!`);
        await loadAllData();
        setAnimateValue(true);
        setTimeout(() => setAnimateValue(false), 1000);
    } else {
        toast.error('Failed to claim reward. Please try again.');
    }
};

const loadCoinBalanceData = () => {
    const balance = getCoinBalance();
    setGemBalance(balance);
};

  const loadAchievements = async () => {
    const transactions = await getTransactions();
    
    // Ensure transactions is an array
    if (!transactions || !Array.isArray(transactions)) {
        setAchievements([]);
        return;
    }
    
    const successfulTransactions = transactions.filter(t => t.status !== 'failed');
    const totalTxns = successfulTransactions.length;
    const totalSpent = successfulTransactions.reduce((sum, t) => sum + t.amount, 0);
    const uniqueMerchants = new Set(successfulTransactions.map(t => t.merchant || t.provider)).size;
    const totalGemsEarned = lifetimeEarned;
    
    const achievementsList = [
        {
            id: 1,
            title: 'First Step',
            description: 'Complete your first transaction',
            icon: FaRocket,
            color: '#4f46e5',
            unlocked: totalTxns >= 1,
            progress: Math.min(totalTxns, 1),
            total: 1,
            reward: 50
        },
        {
            id: 2,
            title: 'Getting Started',
            description: 'Complete 10 transactions',
            icon: FaStar,
            color: '#f59e0b',
            unlocked: totalTxns >= 10,
            progress: Math.min(totalTxns, 10),
            total: 10,
            reward: 100
        },
        {
            id: 3,
            title: 'Power User',
            description: 'Complete 50 transactions',
            icon: FaBolt,
            color: '#fbbf24',
            unlocked: totalTxns >= 50,
            progress: Math.min(totalTxns, 50),
            total: 50,
            reward: 250
        },
        {
            id: 4,
            title: 'Legend',
            description: 'Complete 100 transactions',
            icon: FaCrown,
            color: '#f59e0b',
            unlocked: totalTxns >= 100,
            progress: Math.min(totalTxns, 100),
            total: 100,
            reward: 500
        },
        {
            id: 5,
            title: 'Big Spender',
            description: 'Spend ₹10,000 total',
            icon: FaMoneyBillWave,
            color: '#10b981',
            unlocked: totalSpent >= 10000,
            progress: Math.min(totalSpent, 10000),
            total: 10000,
            reward: 300,
            isAmount: true
        },
        {
            id: 6,
            title: 'Gem Collector',
            description: 'Earn 1000 SabAI Gems',
            icon: FaGem,
            color: '#f59e0b',
            unlocked: totalGemsEarned >= 1000,
            progress: Math.min(totalGemsEarned, 1000),
            total: 1000,
            reward: 500
        }
    ];
    
    setAchievements(achievementsList);
};

const loadChartsData = async () => {
  const transactions = await getTransactions();
  console.log('All transactions for charts:', transactions);
  
  // Filter out failed transactions for charts
  const successfulTransactions = (transactions || []).filter(t => t.status !== 'failed');
  console.log('Successful transactions:', successfulTransactions);
  
  const now = new Date();
  let days = 30;
  
  if (selectedTimeframe === 'week') days = 7;
  else if (selectedTimeframe === 'month') days = 30;
  else if (selectedTimeframe === 'quarter') days = 90;
  else if (selectedTimeframe === 'year') days = 365;
  
  // ============================================
  // EARNING TRENDS
  // ============================================
  const dateMap = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    dateMap.set(dateStr, { 
      date: dateStr, 
      earned: 0, 
      used: 0, 
      fullDate: new Date(date) 
    });
  }
  
  successfulTransactions.forEach(t => {
    // Parse date safely
    let txnDate;
    if (t.created_at) {
      txnDate = new Date(t.created_at);
    } else if (t.date) {
      txnDate = new Date(t.date);
    } else {
      return;
    }
    
    if (isNaN(txnDate.getTime())) return;
    
    const dateStr = txnDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    
    // Find matching date
    let matchedEntry = dateMap.get(dateStr);
    if (!matchedEntry) {
      for (const [key, value] of dateMap.entries()) {
        if (value.fullDate.toDateString() === txnDate.toDateString()) {
          matchedEntry = value;
          break;
        }
      }
    }
    
    if (matchedEntry) {
      // Check if this transaction earns gems
      const gemsUsed = (t.payment_breakdown && t.payment_breakdown.gemsAmount > 0) || 
                       (t.gems_used === true) || (t.gems_used > 0);
      
      const isEarningType = t.type === 'bill' || t.type === 'bill_payment' ||
                            t.type === 'recharge' || t.type === 'merchant_order' ||
                            t.type === 'auto_pay_execution' || t.type === 'reserve_pay' ||
                            t.type === 'challenge_reward';
      
      if (isEarningType && !gemsUsed) {
        let gemsEarned = 0;
        if (t.type === 'challenge_reward') {
          gemsEarned = t.cashback_earned || t.amount || 0;
        } else {
          gemsEarned = t.cashback_earned || Math.min(Math.floor(t.amount * 0.05), 100);
        }
        matchedEntry.earned += gemsEarned;
      }
      
      if (gemsUsed) {
        const usedAmount = (t.payment_breakdown?.gemsAmount) || t.gems_used || 0;
        matchedEntry.used += usedAmount;
      }
    }
  });
  
  const trendsArray = Array.from(dateMap.values());
  trendsArray.sort((a, b) => a.fullDate - b.fullDate);
  setEarningTrends(trendsArray);
  
  // ============================================
  // CATEGORY BREAKDOWN - FIXED
  // ============================================
  const categoryMap = {};
  
  // Helper function to get proper category
  const getProperCategory = (transaction) => {
    // Check bill_type first
    if (transaction.bill_type) {
      const billTypeMap = {
        'electricity': 'Electricity Bill',
        'water': 'Water Bill',
        'mobile': 'Mobile Recharge',
        'broadband': 'Broadband Bill',
        'gas': 'Gas Bill',
        'credit_card': 'Credit Card Bill'
      };
      return billTypeMap[transaction.bill_type] || transaction.bill_type;
    }
    
    // Check transaction type
    if (transaction.type === 'recharge') {
      return 'Mobile Recharge';
    }
    if (transaction.type === 'bill' || transaction.type === 'bill_payment') {
      return 'Bill Payment';
    }
    if (transaction.type === 'send' || transaction.type === 'sent') {
      return 'Send Money';
    }
    if (transaction.type === 'merchant_order') {
      return transaction.merchant ? `${transaction.merchant} Order` : 'Shopping';
    }
    
    // Check description
    if (transaction.description) {
      const desc = transaction.description.toLowerCase();
      if (desc.includes('recharge')) return 'Mobile Recharge';
      if (desc.includes('bill')) return 'Bill Payment';
      if (desc.includes('order')) return 'Shopping';
      if (desc.includes('food')) return 'Food & Dining';
    }
    
    return 'Other';
  };
  
  // Process each successful transaction for category breakdown
  successfulTransactions.forEach(t => {
    // Parse date to check timeframe
    let txnDate;
    if (t.created_at) {
      txnDate = new Date(t.created_at);
    } else if (t.date) {
      txnDate = new Date(t.date);
    } else {
      return;
    }
    
    if (isNaN(txnDate.getTime())) return;
    
    // Check if within selected timeframe
    const daysDiff = Math.floor((now - txnDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > days) return;
    
    // Only include transactions that actually earned gems (no gems used)
    const gemsUsed = (t.payment_breakdown && t.payment_breakdown.gemsAmount > 0) || 
                     (t.gems_used === true) || (t.gems_used > 0);
    
    const isEarningType = t.type === 'bill' || t.type === 'bill_payment' ||
                          t.type === 'recharge' || t.type === 'merchant_order' ||
                          t.type === 'auto_pay_execution' || t.type === 'reserve_pay';
    
    // For category breakdown, include all spending transactions (even if they used gems)
    // This shows where money was spent, not just where gems were earned
    if ((isEarningType || t.type === 'send') && t.amount > 0) {
      const category = getProperCategory(t);
      const amount = parseFloat(t.amount);
      categoryMap[category] = (categoryMap[category] || 0) + amount;
      console.log(`Category ${category}: +₹${amount} (total: ${categoryMap[category]})`);
    }
  });
  
  console.log('Final categoryMap:', categoryMap);
  
  // Define colors for categories
  const categoryColors = {
    'Mobile Recharge': '#3b82f6',
    'Bill Payment': '#ef4444',
    'Electricity Bill': '#f59e0b',
    'Water Bill': '#3b82f6',
    'Broadband Bill': '#8b5cf6',
    'Gas Bill': '#ef4444',
    'Credit Card Bill': '#ec4899',
    'Send Money': '#10b981',
    'Shopping': '#8b5cf6',
    'Food & Dining': '#f59e0b',
    'Entertainment': '#ec4899',
    'Travel': '#06b6d4',
    'Groceries': '#84cc16',
    'Fuel': '#f97316',
    'Healthcare': '#14b8a6',
    'Education': '#f43f5e',
    'Self Transfer': '#64748b',
    'Universal': '#4f46e5',
    'Other': '#94a3b8'
  };
  
  // Convert to array format for PieChart
  const breakdownData = Object.entries(categoryMap)
    .map(([name, value]) => ({
      name: name,
      value: Math.round(value),
      color: categoryColors[name] || '#4f46e5'
    }))
    .sort((a, b) => b.value - a.value);
  
  console.log('Breakdown data for chart:', breakdownData);
  setCategoryBreakdown(breakdownData);
  
  // ============================================
  // GEM USAGE BREAKDOWN (Redemption Stats)
  // ============================================
  const redemptionMap = {};
  
  successfulTransactions.forEach(t => {
    // Parse date
    let txnDate;
    if (t.created_at) {
      txnDate = new Date(t.created_at);
    } else if (t.date) {
      txnDate = new Date(t.date);
    } else {
      return;
    }
    
    if (isNaN(txnDate.getTime())) return;
    
    const daysDiff = Math.floor((now - txnDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > days) return;
    
    let gemsUsed = 0;
    if (t.payment_breakdown && t.payment_breakdown.gemsAmount > 0) {
      gemsUsed = t.payment_breakdown.gemsAmount;
    }
    if (t.gems_used && t.gems_used > 0) {
      gemsUsed = t.gems_used;
    }
    
    if (gemsUsed > 0) {
      let type = 'Other';
      if (t.type === 'bill_payment' || t.type === 'bill') type = 'Bill Payment';
      else if (t.type === 'recharge') type = 'Mobile Recharge';
      else if (t.type === 'send' || t.type === 'sent') type = 'Send Money';
      else if (t.type === 'merchant_order') type = 'Shopping';
      else if (t.type === 'qr' || t.type === 'qr_payment') type = 'QR Payment';
      
      redemptionMap[type] = (redemptionMap[type] || 0) + gemsUsed;
    }
  });
  
  const redemptionData = Object.entries(redemptionMap).map(([name, amount]) => ({
    name,
    amount,
    color: name === 'Bill Payment' ? '#ef4444' : 
           name === 'Mobile Recharge' ? '#3b82f6' : 
           name === 'Send Money' ? '#10b981' : 
           name === 'Shopping' ? '#8b5cf6' : '#4f46e5'
  }));
  
  console.log('Redemption data:', redemptionData);
  setRedemptionStats(redemptionData);
};

  const formatDate = (dateString) => {
  if (!dateString) return 'Date not available';
  
  let date;
  try {
    date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return 'Invalid Date';
    }
  } catch (e) {
    console.warn('Error parsing date:', dateString, e);
    return 'Invalid Date';
  }
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FaGem, color: '#4f46e5' },
    { id: 'earn', label: 'Earn', icon: FaStar, color: '#f59e0b' },
    { id: 'history', label: 'History', icon: FaHistory, color: '#3b82f6' },
    { id: 'achievements', label: 'Achievements', icon: FaTrophy, color: '#fbbf24' }
  ];

  return (
    <div className="coins-page">
      <div className="coins-container">
        {/* Header Section */}
        <div className="coins-header-section">
          <div className="coins-title">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GemLogo /> SabAI Gems
            </motion.h1>
            <p className="subtitle">Earn 5 SabAI Gems for every ₹100 spent • 5% Cashback • Never expires with activity</p>
          </div>
        </div>

        {/* Main Balance Card */}
        <motion.div 
          className={`main-balance-card ${animateValue ? 'value-animate' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
        >
          <div className="balance-glow"></div>
          <div className="balance-content">
            <div className="balance-icon-wrapper">
              <div className="balance-icon">
                <GemLogo size="large" />
              </div>
              <div className="balance-text">
                <span className="balance-label">Total SabAI Gems</span>
                <motion.span 
                  className="balance-value"
                  initial={{ scale: 1 }}
                  animate={{ scale: animateValue ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {gemBalance.toLocaleString()}
                </motion.span>
              </div>
            </div>
            
            <div className="balance-stats-grid">
              <div className="balance-stat">
                <GemLogo size="medium" />
                <div>
                  <span className="stat-label">Lifetime Earned</span>
                  <span className="stat-value">{lifetimeEarned.toLocaleString()}</span>
                </div>
              </div>
              <div className="balance-stat">
                <FaGift className="stat-icon" />
                <div>
                  <span className="stat-label">Used</span>
                  <span className="stat-value">{lifetimeUsed.toLocaleString()}</span>
                </div>
              </div>
              <div className="balance-stat">
                <FaChartLine className="stat-icon" />
                <div>
                  <span className="stat-label">Cashback Rate</span>
                  <span className="stat-value">{averageCashback}%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Level Progress */}
          <div className="level-progress-section">
            <div className="level-header">
              <div className="level-badge">
                <span>Level {level}</span>
                <GemLogo />
              </div>
              <div className="level-rewards">
                <span>🎁 {level * 100} gems at next level</span>
              </div>
            </div>
            <div className="level-progress-bar">
              <motion.div 
                className="level-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="level-next">
              <span>{nextLevelGems} gems to Level {level + 1}</span>
            </div>
          </div>
        </motion.div>

        {/* Expiring Alert */}
        <AnimatePresence>
          {expiringSoon.length > 0 && (
            <motion.div 
              className="expiry-alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <FaExclamationTriangle className="alert-icon" />
              <div className="alert-content">
                <h4>⚠️ {expiringSoon.reduce((sum, e) => sum + e.amount, 0)} SabAI Gems Expiring Soon!</h4>
                <p>Use them before they expire in {expiringSoon[0]?.daysLeft || 5} days</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="coins-tabs">
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon style={{ color: activeTab === tab.id ? tab.color : 'inherit' }} />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          <AnimatePresence mode="wait">
            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="dashboard-tab"
              >
                {/* Quick Stats Cards */}
                <div className="quick-stats-grid">
                  <div className="quick-stat-card">
                    <div className="quick-stat-icon" style={{ background: '#eef2ff' }}>
                      <FaCalendarAlt style={{ color: '#4f46e5' }} />
                    </div>
                    <div>
                      <span className="quick-stat-label">This Month</span>
                      <span className="quick-stat-value">+{monthlyEarned} <GemLogo /></span>
                    </div>
                  </div>
                  <div className="quick-stat-card">
                    <div className="quick-stat-icon" style={{ background: '#fef3c7' }}>
                      <FaChartLine style={{ color: '#f59e0b' }} />
                    </div>
                    <div>
                      <span className="quick-stat-label">Monthly Spending</span>
                      <span className="quick-stat-value">₹{(monthlyEarned * 20).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="quick-stat-card">
                    <div className="quick-stat-icon" style={{ background: '#d1fae5' }}>
                      <FaShoppingBag style={{ color: '#10b981' }} />
                    </div>
                    <div>
                      <span className="quick-stat-label">Top Category</span>
                      <span className="quick-stat-value">{topCategory}</span>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="charts-section">
                  <div className="section-header">
                    <h3><FaChartLine /> Earning Trends</h3>
                    <div className="timeframe-selector">
                      {['week', 'month', 'quarter', 'year'].map(tf => (
                        <button 
                          key={tf}
                          className={`timeframe-btn ${selectedTimeframe === tf ? 'active' : ''}`}
                          onClick={() => { setSelectedTimeframe(tf); loadChartsData(); }}
                        >
                          {tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : tf === 'quarter' ? '3M' : 'Year'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={earningTrends}>
                        <defs>
                          <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value} 🪙`} />
                        <Legend />
                        <Area type="monotone" dataKey="earned" stroke="#4f46e5" fillOpacity={1} fill="url(#colorEarned)" name="Gems Earned" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="charts-grid">
                  <div className="chart-card">
  <h3><FaChartPie /> Category Breakdown</h3>
  {categoryBreakdown.length > 0 ? (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={categoryBreakdown}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
          labelLine={false}
        >
          {categoryBreakdown.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  ) : (
    <div className="no-chart-data">
      <p>No spending data available for the selected period</p>
      <p className="hint-text">Make a payment to see your category breakdown here</p>
    </div>
  )}
</div>
                  <div className="chart-card">
                    <h3><FaGift /> Gem Usage Breakdown</h3>
                    {redemptionStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={redemptionStats} layout="vertical" margin={{ left: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={100} />
                          <Tooltip formatter={(value) => `${value} 🪙`} />
                          <Bar dataKey="amount" fill="#4f46e5" radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="no-chart-data">No gem usage data available</div>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="recent-activity">
                  <h3><FaClock /> Recent Activity</h3>
                  <div className="activity-list">
                    {history.slice(0, 10).map(item => (
                      <motion.div 
                        key={item.id} 
                        className={`activity-item ${item.type}`}
                        whileHover={{ x: 5 }}
                        onClick={() => { setSelectedHistoryItem(item); setShowHistoryDetailModal(true); }}
                      >
                        <div className={`activity-icon ${item.type}`}>
                          {item.type === 'earned' ? <FaArrowDown /> : <FaArrowUp />}
                        </div>
                        <div className="activity-details">
                          <span className="activity-title">{item.description}</span>
                          <span className="activity-time">{formatDate(item.date)}</span>
                        </div>
                        <span className={`activity-amount ${item.type}`}>
                          {item.type === 'earned' ? '+' : '-'}{item.amount} <GemLogo />
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* EARN TAB - unchanged */}
            {activeTab === 'earn' && (
              <motion.div
                key="earn"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="earn-tab"
              >
                {/* How to Earn Section */}
                <div className="earn-methods-section">
                  <h3><FaStar /> Ways to Earn SabAI Gems</h3>
                  <div className="earn-methods-grid">
                    <div className="earn-method-card">
                      <div className="method-icon"><GemLogo /></div>
                      <h4>Every Transaction</h4>
                      <p>Earn 5 Gems per ₹100 spent</p>
                      <span className="method-rate">5% Cashback</span>
                    </div>
                    <div className="earn-method-card">
                      <div className="method-icon">🏆</div>
                      <h4>Complete Challenges</h4>
                      <p>Earn bonus rewards up to 100 gems</p>
                      <span className="method-rate">Weekly Challenges</span>
                    </div>
                    <div className="earn-method-card">
                      <div className="method-icon">👥</div>
                      <h4>Refer Friends</h4>
                      <p>100 gems per referral</p>
                      <span className="method-rate">+100 each</span>
                    </div>
                    <div className="earn-method-card">
                      <div className="method-icon">✨</div>
                      <h4>Special Events</h4>
                      <p>Participate in limited-time events</p>
                      <span className="method-rate">Bonus Gems</span>
                    </div>
                  </div>
                </div>

                {/* Weekly Challenges */}
                <div className="challenges-section">
                  <h3><FaBolt /> Weekly Challenges</h3>
                  <p className="challenges-subtitle">Complete challenges each week to earn bonus gems (can be claimed once per week)</p>
                  <div className="challenges-grid">
                    {challenges.map(challenge => (
                      <motion.div 
                        key={challenge.id} 
                        className={`challenge-card ${challenge.completed ? 'completed' : ''}`}
                        whileHover={{ y: -4 }}
                      >
                        <div className="challenge-header">
                          <div className="challenge-icon" style={{ background: `${challenge.color}20` }}>
                            <challenge.icon style={{ color: challenge.color }} />
                          </div>
                          <span className="challenge-reward">+{challenge.reward} <GemLogo /></span>
                        </div>
                        <h4>{challenge.title}</h4>
                        <p>{challenge.description}</p>
                        <div className="challenge-progress">
                          <div className="progress-bar">
                            <motion.div 
                              className="progress-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                              style={{ backgroundColor: challenge.color }}
                            />
                          </div>
                          <span className="progress-text">
                            {challenge.isAmount ? `₹${challenge.progress.toLocaleString()}` : challenge.progress}/{challenge.total}
                          </span>
                        </div>
                        {challenge.completed && !challenge.claimed && (
                          <button className="claim-btn" onClick={() => claimChallengeReward(challenge.id)}>
                            <FaCheckCircle /> Claim Reward
                          </button>
                        )}
                        {challenge.claimed && (
                          <div className="claimed-badge-small">
                            <FaCheckCircle /> Claimed this week
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Referral Section */}
                <div className="referral-section">
                  <div className="referral-header">
                    <FaUsers className="referral-icon" />
                    <div>
                      <h3>Invite Friends, Earn More!</h3>
                      <p>Share your referral code and earn 100 SabAI Gems for every friend who joins SabAI Pay</p>
                    </div>
                  </div>
                  <div className="referral-code-display">
                    <div className="code-box">
                      <span className="code">SABAI{user?.phone_number?.slice(-6) || 'WELCOME'}</span>
                      <button className="copy-code-btn" onClick={() => {
                        navigator.clipboard.writeText(`SABAI${user?.phone_number?.slice(-6) || 'WELCOME'}`);
                        toast.success('Referral code copied! 📋');
                      }}>
                        <FaCopy /> Copy
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="history-tab"
              >
                <div className="history-header">
                  <h3><FaHistory /> Transaction History</h3>
                  <div className="history-stats">
                    <div className="history-stat">
                      <span>Total Earned</span>
                      <strong>+{lifetimeEarned} <GemLogo /></strong>
                    </div>
                    <div className="history-stat">
                      <span>Total Used</span>
                      <strong>-{lifetimeUsed} <GemLogo /></strong>
                    </div>
                  </div>
                </div>
                
                <div className="history-list">
  {history.length > 0 ? (
    history.map(item => {
      // Parse date safely
      let formattedDate = 'Date not available';
      if (item.date) {
        try {
          const dateObj = new Date(item.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toLocaleDateString('en-IN', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        } catch (e) {
          console.error('Date parsing error:', e);
        }
      }
      
      return (
        <motion.div 
          key={item.id} 
          className={`history-item ${item.type}`}
          whileHover={{ x: 5 }}
          onClick={() => { setSelectedHistoryItem(item); setShowHistoryDetailModal(true); }}
        >
          <div className="history-icon">
            {item.type === 'earned' ? <FaArrowDown /> : <FaArrowUp />}
          </div>
          <div className="history-details">
            <span className="history-title">{item.description}</span>
            <span className="history-date">{formattedDate}</span>
            {item.transactionId && (
              <span className="history-txn-id">ID: {item.transactionId}</span>
            )}
          </div>
          <span className={`history-amount ${item.type}`}>
            {item.type === 'earned' ? '+' : '-'}{item.amount} <GemLogo />
          </span>
        </motion.div>
      );
    })
  ) : (
    <div className="no-history-data">
      <p>No transaction history available</p>
    </div>
  )}
</div>
              </motion.div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="achievements-tab"
              >
                <div className="achievements-header">
                  <h3><FaTrophy /> Your Achievements</h3>
                  <div className="achievement-summary">
                    <div className="summary-stat">
                      <span>Unlocked</span>
                      <strong>{achievements.filter(a => a.unlocked).length}/{achievements.length}</strong>
                    </div>
                    <div className="summary-stat">
                      <span>Total Rewards</span>
                      <strong>{achievements.filter(a => a.unlocked).reduce((sum, a) => sum + (a.reward || 0), 0)} <GemLogo /></strong>
                    </div>
                  </div>
                </div>
                
                <div className="achievements-grid">
                  {achievements.map(achievement => (
                    <motion.div 
                      key={achievement.id} 
                      className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                      whileHover={{ y: -4 }}
                    >
                      <div className="achievement-icon" style={{ background: `${achievement.color}20` }}>
                        <achievement.icon style={{ color: achievement.color }} />
                      </div>
                      <div className="achievement-info">
                        <h4>{achievement.title}</h4>
                        <p>{achievement.description}</p>
                        {!achievement.unlocked && (
                          <div className="achievement-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ 
                                  width: `${(achievement.progress / achievement.total) * 100}%`,
                                  backgroundColor: achievement.color
                                }}
                              />
                            </div>
                            <span className="progress-text">
                              {achievement.isAmount ? `₹${achievement.progress.toLocaleString()}` : achievement.progress}/{achievement.total}
                            </span>
                          </div>
                        )}
                        {achievement.reward && (
                          <div className="achievement-reward">
                            <GemLogo /> +{achievement.reward} gems
                          </div>
                        )}
                      </div>
                      {achievement.unlocked && (
                        <FaCheckCircle className="achievement-check" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* History Detail Modal */}
      <AnimatePresence>
        {showHistoryDetailModal && selectedHistoryItem && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistoryDetailModal(false)}>
            <motion.div className="detail-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Transaction Details</h2>
                <button className="modal-close" onClick={() => setShowHistoryDetailModal(false)}><FaTimes /></button>
              </div>
              <div className="detail-content">
                <div className="detail-icon">
                  {selectedHistoryItem.type === 'earned' ? <FaArrowDown className="earned" /> : <FaArrowUp className="used" />}
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span>Description</span>
                    <strong>{selectedHistoryItem.description}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Amount</span>
                    <strong className={selectedHistoryItem.type === 'earned' ? 'earned' : 'used'}>
                      {selectedHistoryItem.type === 'earned' ? '+' : '-'}{selectedHistoryItem.amount} <GemLogo />
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>Date & Time</span>
                    <span>{new Date(selectedHistoryItem.date).toLocaleString()}</span>
                  </div>
                  {selectedHistoryItem.transactionId && (
                    <div className="detail-row">
                      <span>Transaction ID</span>
                      <span className="txn-id">{selectedHistoryItem.transactionId}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-primary" onClick={() => setShowHistoryDetailModal(false)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoinsPage;