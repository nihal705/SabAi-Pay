// backend/routes/coinRoutes.js
// COMPLETE WORKING VERSION

const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');
const { verifyToken } = require('../middleware/auth');

// Get coin balance
router.get('/balance', verifyToken, async (req, res) => {
    try {
        const balance = await dbService.getCoinBalance(req.user.id);
        const history = await dbService.getCoinHistory(req.user.id, 10);
        
        res.json({
            success: true,
            data: {
                balance: balance.balance,
                lifetimeEarned: balance.lifetime_earned,
                lifetimeUsed: balance.lifetime_used,
                recentTransactions: history
            }
        });
    } catch (error) {
        console.error('Get coin balance error:', error);
        res.status(500).json({ success: false, message: 'Failed to get balance' });
    }
});

// Get coin history
router.get('/history', verifyToken, async (req, res) => {
    const { limit = 50 } = req.query;
    
    try {
        const history = await dbService.getCoinHistory(req.user.id, parseInt(limit));
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('Get coin history error:', error);
        res.status(500).json({ success: false, message: 'Failed to get history' });
    }
});

// Redeem coins
router.post('/redeem', verifyToken, async (req, res) => {
    const { coinAmount, type, target } = req.body;
    
    if (!coinAmount || coinAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid coin amount' });
    }
    
    try {
        const balance = await dbService.getCoinBalance(req.user.id);
        
        if (coinAmount > balance.balance) {
            return res.status(400).json({ success: false, message: 'Insufficient coins' });
        }
        
        const rupeeValue = coinAmount;
        
        await dbService.updateCoinBalance(req.user.id, coinAmount, false);
        await dbService.addCoinTransaction(
            req.user.id, coinAmount, 'used', 'redemption',
            `redemption_${Date.now()}`,
            `Redeemed ${coinAmount} coins for ${type}`
        );
        
        res.json({
            success: true,
            data: {
                message: `Successfully redeemed ${coinAmount} coins for ₹${rupeeValue}`,
                newBalance: balance.balance - coinAmount
            }
        });
    } catch (error) {
        console.error('Redeem coins error:', error);
        res.status(500).json({ success: false, message: 'Failed to redeem coins' });
    }
});

module.exports = router;