// backend/routes/reserveRoutes.js
// Make sure this file has the correct endpoints

const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');
const { verifyToken } = require('../middleware/auth');

// Get all reserve limits
router.get('/limits', verifyToken, async (req, res) => {
    try {
        const limits = await dbService.getReserveLimits(req.user.id);
        console.log(`Found ${limits.length} limits for user ${req.user.id}`);
        res.json({ success: true, data: limits });
    } catch (error) {
        console.error('Get reserve limits error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create or update reserve limit
router.post('/limits', verifyToken, async (req, res) => {
    const { 
        merchant, merchant_name, merchant_category, monthly_limit, 
        per_transaction_limit, requires_approval, is_active, contributions 
    } = req.body;
    
    try {
        console.log('Creating/updating limit:', { merchant, monthly_limit });
        
        const limit = await dbService.createOrUpdateReserveLimit(req.user.id, merchant, {
            merchant_name,
            merchant_category,
            monthly_limit: Number(monthly_limit),
            per_transaction_limit: per_transaction_limit ? Number(per_transaction_limit) : null,
            requires_approval: requires_approval || false,
            is_active: is_active !== false,
            contributions: contributions || []
        });
        
        res.json({ success: true, data: limit });
    } catch (error) {
        console.error('Create reserve limit error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete reserve limit
router.delete('/limits/:merchant', verifyToken, async (req, res) => {
    try {
        const result = await dbService.deleteReserveLimit(req.user.id, req.params.merchant);
        res.json({ success: true, message: 'Limit deleted' });
    } catch (error) {
        console.error('Delete reserve limit error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Check if payment is within limit
router.post('/check-payment', verifyToken, async (req, res) => {
    const { merchant, amount } = req.body;
    
    try {
        const limit = await dbService.getReserveLimit(req.user.id, merchant);
        
        if (!limit || !limit.is_active) {
            return res.json({
                success: true,
                data: {
                    eligible: false,
                    reason: 'No active limit found for this merchant',
                    remaining: 0
                }
            });
        }
        
        const remaining = limit.monthly_limit - limit.current_spent;
        const eligible = amount <= remaining;
        
        if (!eligible) {
            return res.json({
                success: true,
                data: {
                    eligible: false,
                    reason: `Insufficient limit. Remaining: ₹${remaining}`,
                    remaining
                }
            });
        }
        
        if (limit.per_transaction_limit && amount > limit.per_transaction_limit) {
            return res.json({
                success: true,
                data: {
                    eligible: false,
                    reason: `Amount exceeds per-transaction limit of ₹${limit.per_transaction_limit}`,
                    remaining
                }
            });
        }
        
        res.json({
            success: true,
            data: {
                eligible: true,
                remaining,
                limit: limit.monthly_limit,
                spent: limit.current_spent
            }
        });
    } catch (error) {
        console.error('Check payment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Process reserve payment
router.post('/process-payment', verifyToken, async (req, res) => {
    const { merchant, amount, transactionId, description } = req.body;
    
    try {
        await dbService.updateReserveLimitSpent(req.user.id, merchant, amount);
        
        await dbService.createTransaction({
            transaction_id: transactionId,
            user_id: req.user.id,
            type: 'reserve_pay',
            amount: amount,
            status: 'success',
            description: description || `Payment to ${merchant} via Reserve Pay`,
            reserve_used: amount
        });
        
        res.json({ success: true, message: 'Payment processed successfully' });
    } catch (error) {
        console.error('Process reserve payment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/limits/:merchant', verifyToken, async (req, res) => {
    try {
        const result = await dbService.deleteReserveLimit(req.user.id, req.params.merchant);
        res.json({ success: true, message: 'Limit deleted' });
    } catch (error) {
        console.error('Delete reserve limit error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;