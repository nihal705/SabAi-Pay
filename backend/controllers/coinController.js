// backend/controllers/coinController.js
const dbStorage = require('../services/databaseStorageService');

// Helper to get user ID
const getUserId = (req) => {
    return req.user?.id ? String(req.user.id) : '4';
};

// Get coin balance and summary
const getBalance = async (req, res) => {
    try {
        const userId = getUserId(req);
        
        // Get coin balance
        const balance = await dbStorage.getItem('coinBalance', userId, 0);
        const lifetimeEarned = await dbStorage.getItem('lifetimeEarned', userId, 0);
        const lifetimeUsed = await dbStorage.getItem('lifetimeUsed', userId, 0);
        
        // Get expiring coins
        const expiringSoon = await dbStorage.getItem('expiringSoon', userId, []);
        
        // Get level info
        const level = Math.floor((lifetimeEarned / 1000)) + 1;
        const levelProgress = ((lifetimeEarned % 1000) / 1000) * 100;
        const nextLevelGems = (level * 1000) - lifetimeEarned;
        
        res.json({
            success: true,
            data: {
                balance: balance,
                lifetimeEarned: lifetimeEarned,
                lifetimeUsed: lifetimeUsed,
                expiringSoon: expiringSoon,
                level: level,
                levelProgress: levelProgress,
                nextLevelGems: nextLevelGems
            }
        });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get coin history
const getHistory = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { limit = 50, offset = 0 } = req.query;
        
        let history = await dbStorage.getItem('coinHistory', userId, []);
        
        // Sort by date descending
        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Apply pagination
        const paginated = history.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        res.json({
            success: true,
            data: {
                history: paginated,
                total: history.length,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get redemption history
const getRedemptionHistory = async (req, res) => {
    try {
        const userId = getUserId(req);
        const redemptions = await dbStorage.getItem('coinRedemptions', userId, []);
        
        redemptions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json({
            success: true,
            data: redemptions
        });
    } catch (error) {
        console.error('Get redemption history error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get dashboard summary
const getDashboardSummary = async (req, res) => {
    try {
        const userId = getUserId(req);
        
        const balance = await dbStorage.getItem('coinBalance', userId, 0);
        const lifetimeEarned = await dbStorage.getItem('lifetimeEarned', userId, 0);
        const monthlyEarned = await dbStorage.getItem('monthlyEarned', userId, 0);
        const topCategory = await dbStorage.getItem('topCategory', userId, 'Shopping');
        const averageCashback = await dbStorage.getItem('averageCashback', userId, 0);
        
        // Get earning trends
        const earningTrends = await dbStorage.getItem('earningTrends', userId, []);
        
        // Get category breakdown
        const categoryBreakdown = await dbStorage.getItem('categoryBreakdown', userId, []);
        
        // Get redemption stats
        const redemptionStats = await dbStorage.getItem('redemptionStats', userId, []);
        
        res.json({
            success: true,
            data: {
                balance: balance,
                lifetimeEarned: lifetimeEarned,
                monthlyEarned: monthlyEarned,
                topCategory: topCategory,
                averageCashback: averageCashback,
                earningTrends: earningTrends,
                categoryBreakdown: categoryBreakdown,
                redemptionStats: redemptionStats
            }
        });
    } catch (error) {
        console.error('Get dashboard summary error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Redeem coins
const redeemCoins = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { coinAmount, type, target } = req.body;
        
        if (!coinAmount || coinAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid coin amount' });
        }
        
        const currentBalance = await dbStorage.getItem('coinBalance', userId, 0);
        
        if (coinAmount > currentBalance) {
            return res.status(400).json({ success: false, message: 'Insufficient coins' });
        }
        
        const rupeeValue = coinAmount; // 1 coin = ₹1
        
        // Update balance
        const newBalance = currentBalance - coinAmount;
        await dbStorage.setItem('coinBalance', newBalance, userId);
        
        // Update lifetime used
        const lifetimeUsed = await dbStorage.getItem('lifetimeUsed', userId, 0);
        await dbStorage.setItem('lifetimeUsed', lifetimeUsed + coinAmount, userId);
        
        // Record redemption
        const redemption = {
            id: Date.now(),
            coinAmount: coinAmount,
            rupeeValue: rupeeValue,
            type: type,
            target: target,
            date: new Date().toISOString(),
            status: 'completed'
        };
        
        const redemptions = await dbStorage.getItem('coinRedemptions', userId, []);
        redemptions.unshift(redemption);
        await dbStorage.setItem('coinRedemptions', redemptions, userId);
        
        // Add to coin history
        const history = await dbStorage.getItem('coinHistory', userId, []);
        history.unshift({
            id: Date.now(),
            amount: coinAmount,
            type: 'used',
            description: `Redeemed ${coinAmount} coins for ${type}`,
            date: new Date().toISOString()
        });
        await dbStorage.setItem('coinHistory', history, userId);
        
        res.json({
            success: true,
            data: {
                message: `Successfully redeemed ${coinAmount} coins for ₹${rupeeValue}`,
                newBalance: newBalance,
                redemption: redemption
            }
        });
    } catch (error) {
        console.error('Redeem coins error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get usage suggestions
const getUsageSuggestions = async (req, res) => {
    try {
        const suggestions = [
            { id: 1, title: 'Pay Bills', description: 'Use coins to pay electricity, water, or gas bills', icon: 'FaBolt', minCoins: 100 },
            { id: 2, title: 'Mobile Recharge', description: 'Recharge your mobile using coins', icon: 'FaMobile', minCoins: 50 },
            { id: 3, title: 'Send Money', description: 'Send coins to friends and family', icon: 'FaArrowUp', minCoins: 10 },
            { id: 4, title: 'Shopping Vouchers', description: 'Get vouchers for Amazon, Flipkart & more', icon: 'FaShoppingBag', minCoins: 500 }
        ];
        
        res.json({ success: true, data: suggestions });
    } catch (error) {
        console.error('Get usage suggestions error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get expiring soon coins
const getExpiringSoon = async (req, res) => {
    try {
        const userId = getUserId(req);
        const expiringSoon = await dbStorage.getItem('expiringSoon', userId, []);
        
        res.json({ success: true, data: expiringSoon });
    } catch (error) {
        console.error('Get expiring soon error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get coins by type
const getByType = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { type } = req.params;
        
        const history = await dbStorage.getItem('coinHistory', userId, []);
        const filtered = history.filter(h => h.sourceType === type);
        
        res.json({ success: true, data: filtered });
    } catch (error) {
        console.error('Get by type error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get earning opportunities
const getEarningOpportunities = async (req, res) => {
    try {
        const opportunities = [
            { id: 1, title: 'Complete Profile', reward: 50, description: 'Complete your profile information', completed: false },
            { id: 2, title: 'First Transaction', reward: 100, description: 'Make your first payment', completed: false },
            { id: 3, title: 'Refer a Friend', reward: 200, description: 'Invite friends to join SabAI Pay', completed: false },
            { id: 4, title: 'Weekly Challenge', reward: 50, description: 'Complete weekly challenges', completed: false }
        ];
        
        res.json({ success: true, data: opportunities });
    } catch (error) {
        console.error('Get earning opportunities error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getBalance,
    getHistory,
    getRedemptionHistory,
    getDashboardSummary,
    redeemCoins,
    getUsageSuggestions,
    getExpiringSoon,
    getByType,
    getEarningOpportunities
};