// backend/routes/rechargeRoutes.js
// COMPLETE WORKING VERSION

const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');
const { verifyToken } = require('../middleware/auth');

// Get recent recharges
router.get('/recent', verifyToken, async (req, res) => {
    const { limit = 10 } = req.query;
    
    try {
        const recharges = await dbService.getRecentRecharges(req.user.id, parseInt(limit));
        res.json({ success: true, data: recharges });
    } catch (error) {
        console.error('Get recent recharges error:', error);
        res.status(500).json({ success: false, message: 'Failed to get recharges' });
    }
});

// Add recharge
router.post('/', verifyToken, async (req, res) => {
    const { mobile_number, operator, operator_id, amount, circle, transaction_id, cashback_earned, payment_method } = req.body;
    
    try {
        await dbService.addRecentRecharge(req.user.id, {
            mobileNumber: mobile_number,
            operator,
            operatorId: operator_id,
            amount,
            circle,
            transactionId: transaction_id,
            cashbackEarned: cashback_earned || 0,
            paymentMethod: payment_method
        });
        
        // Also save as transaction
        await dbService.createTransaction({
            transaction_id: transaction_id,
            user_id: req.user.id,
            type: 'recharge',
            amount: amount,
            status: 'success',
            mobile_number: mobile_number,
            operator: operator,
            cashback_earned: cashback_earned || 0,
            description: `Mobile recharge for ${mobile_number}`
        });
        
        res.json({ success: true, message: 'Recharge recorded' });
    } catch (error) {
        console.error('Add recharge error:', error);
        res.status(500).json({ success: false, message: 'Failed to record recharge' });
    }
});

module.exports = router;