// backend/routes/billRoutes.js
// COMPLETE FIXED VERSION

const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Get all bills (pending and paid)
router.get('/', verifyToken, async (req, res) => {
    const { paid } = req.query;
    
    try {
        if (paid === 'true') {
            const paidBills = await dbService.getPaidBills(req.user.id, 50);
            return res.json({ success: true, data: { paid: paidBills } });
        }
        
        const bills = await dbService.getBills(req.user.id);
        const paidBills = await dbService.getPaidBills(req.user.id, 10);
        
        res.json({
            success: true,
            data: {
                pending: bills,
                paid: paidBills
            }
        });
    } catch (error) {
        console.error('Get bills error:', error);
        res.status(500).json({ success: false, message: 'Failed to get bills' });
    }
});

// Create bill
router.post('/', verifyToken, async (req, res) => {
    const { bill_type, provider, customer_id, amount, due_date, auto_pay, reserve_pay_enabled, reminder_days } = req.body;
    
    console.log('Create bill request:', { bill_type, provider, customer_id, amount, due_date });
    
    try {
        if (!bill_type || !provider || !customer_id || !amount || !due_date) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: bill_type, provider, customer_id, amount, due_date' 
            });
        }
        
        const billId = await dbService.createBill(req.user.id, {
            bill_type,
            provider,
            customer_id,
            amount: parseFloat(amount),
            due_date,
            auto_pay: auto_pay || false,
            reserve_pay_enabled: reserve_pay_enabled || false,
            reminder_days: reminder_days || 3
        });
        
        res.json({ success: true, data: { id: billId } });
    } catch (error) {
        console.error('Create bill error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update bill
router.put('/:id', verifyToken, async (req, res) => {
    const { auto_pay, reserve_pay_enabled, reminder_days, bank_account_id, bank_name, bank_account_last4 } = req.body;
    
    try {
        await dbService.updateBill(parseInt(req.params.id), req.user.id, {
            auto_pay, reserve_pay_enabled, reminder_days, bank_account_id, bank_name, bank_account_last4
        });
        
        res.json({ success: true, message: 'Bill updated' });
    } catch (error) {
        console.error('Update bill error:', error);
        res.status(500).json({ success: false, message: 'Failed to update bill' });
    }
});

// Pay bill
router.post('/:id/pay', verifyToken, async (req, res) => {
    const { payment_method, payment_breakdown, cashback_earned, transaction_id } = req.body;
    
    try {
        if (payment_breakdown.bankAmount > 0 && payment_breakdown.bank_account_id) {
            await dbService.updateBankBalance(payment_breakdown.bank_account_id, payment_breakdown.bankAmount, false);
        }
        
        if (payment_breakdown.reserveAmount > 0 && payment_breakdown.merchant) {
            await dbService.updateReserveLimitSpent(req.user.id, payment_breakdown.merchant, payment_breakdown.reserveAmount);
        }
        
        if (payment_breakdown.gemsAmount > 0) {
            await dbService.updateCoinBalance(req.user.id, payment_breakdown.gemsAmount, false);
        }
        
        if (cashback_earned > 0) {
            await dbService.updateCoinBalance(req.user.id, cashback_earned, true);
        }
        
        await dbService.markBillAsPaid(parseInt(req.params.id), req.user.id, {
            payment_method,
            payment_breakdown,
            cashback_earned,
            transaction_id
        });
        
        res.json({ success: true, message: 'Bill paid successfully' });
    } catch (error) {
        console.error('Pay bill error:', error);
        res.status(500).json({ success: false, message: 'Failed to pay bill' });
    }
});

// Delete bill - FIXED VERSION
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const billId = parseInt(req.params.id);
        const userId = req.user.id;
        
        console.log(`Deleting bill ${billId} for user ${userId}`);
        
        // Use the database connection pool directly
        const pool = db.pool;
        
        // First, delete associated auto-pay orders
        await pool.execute(
            `DELETE FROM auto_pay_orders WHERE bill_id = ? AND user_id = ?`,
            [billId, userId]
        );
        
        // Then delete the bill
        const [result] = await pool.execute(
            `DELETE FROM bills WHERE id = ? AND user_id = ?`,
            [billId, userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }
        
        console.log(`Bill ${billId} deleted successfully`);
        res.json({ success: true, message: 'Bill deleted successfully' });
    } catch (error) {
        console.error('Delete bill error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;