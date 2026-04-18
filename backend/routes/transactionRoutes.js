// backend/routes/transactionRoutes.js
// COMPLETE WORKING VERSION

const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');
const { verifyToken } = require('../middleware/auth');

// Get all transactions
router.get('/', verifyToken, async (req, res) => {
    const { limit = 100, offset = 0, type, status } = req.query;
    
    try {
        let transactions = await dbService.getTransactions(req.user.id, parseInt(limit), parseInt(offset));
        
        // Apply filters
        if (type && type !== 'all') {
            transactions = transactions.filter(t => t.type === type);
        }
        if (status && status !== 'all') {
            transactions = transactions.filter(t => t.status === status);
        }
        
        const stats = await dbService.getTransactionStats(req.user.id);
        
        res.json({
            success: true,
            data: {
                transactions,
                stats,
                total: transactions.length,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ success: false, message: 'Failed to get transactions' });
    }
});

// Get single transaction
router.get('/:transactionId', verifyToken, async (req, res) => {
    try {
        const transaction = await dbService.getTransactionById(req.params.transactionId, req.user.id);
        
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        res.json({ success: true, data: transaction });
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ success: false, message: 'Failed to get transaction' });
    }
});

// Create transaction
router.post('/', verifyToken, async (req, res) => {
    try {
        const transactionData = req.body;
        
        // Ensure required fields
        if (!transactionData.transaction_id) {
            transactionData.transaction_id = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
        }
        
        transactionData.user_id = req.user.id;
        
        console.log('Creating transaction with data:', transactionData);
        
        // Update bank balance if bank payment
        if (transactionData.bank_used > 0 && transactionData.bank_account_id) {
            await dbService.updateBankBalance(transactionData.bank_account_id, transactionData.bank_used, false);
        }
        
        // Update coin balance if used
        if (transactionData.gems_used > 0) {
            await dbService.updateCoinBalance(req.user.id, transactionData.gems_used, false);
        }
        
        // Add cashback if earned
        if (transactionData.cashback_earned > 0) {
            await dbService.updateCoinBalance(req.user.id, transactionData.cashback_earned, true);
            await dbService.addCoinTransaction(
                req.user.id, transactionData.cashback_earned, 'earned', 'cashback',
                transactionData.transaction_id, `Cashback for transaction`
            );
        }
        
        const transactionId = await dbService.createTransaction(transactionData);
        
        res.json({ 
            success: true, 
            data: { 
                id: transactionId,
                transaction_id: transactionData.transaction_id
            } 
        });
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create transaction: ' + error.message 
        });
    }
});

module.exports = router;