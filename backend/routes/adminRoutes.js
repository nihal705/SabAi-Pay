// backend/routes/adminRoutes.js
// Admin routes for testing and management

const express = require('express');
const router = express.Router();
const cronService = require('../services/cronService');
const db = require('../config/database');
const constants = require('../utils/constants');

// In production, add admin authentication middleware
// router.use(AuthMiddleware.verifyToken);
// router.use(AuthMiddleware.requireAdmin);

// ============================================
// Test Routes (For Development Only)
// ============================================

// Manual trigger for coin expiry check
router.post('/test/coin-expiry', async (req, res) => {
    try {
        const result = await cronService.triggerCoinExpiryCheck();
        res.json({ 
            success: true, 
            message: 'Coin expiry check triggered', 
            data: result 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Manual trigger for monthly reset
router.post('/test/monthly-reset', async (req, res) => {
    try {
        const result = await cronService.triggerMonthlyReset();
        res.json({ 
            success: true, 
            message: 'Monthly reset triggered' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Test database connection
router.get('/test/db', async (req, res) => {
    try {
        const [result] = await db.pool.execute('SELECT 1 as test');
        res.json({ 
            success: true, 
            message: 'Database connected', 
            data: result 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get system stats
router.get('/stats', async (req, res) => {
    try {
        const [userCount] = await db.pool.execute('SELECT COUNT(*) as count FROM users');
        const [txnCount] = await db.pool.execute('SELECT COUNT(*) as count FROM transactions');
        const [coinCount] = await db.pool.execute('SELECT SUM(amount) as total FROM coins WHERE status = "active"');
        
        res.json({
            success: true,
            data: {
                users: userCount[0].count,
                transactions: txnCount[0].count,
                active_coins: coinCount[0].total || 0,
                server_time: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development'
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get all users (admin only)
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.pool.execute(`
            SELECT id, phone_number, name, email, upi_id, 
                   monthly_limit, current_spent, is_verified, is_active, created_at
            FROM users 
            ORDER BY created_at DESC
            LIMIT 100
        `);
        
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Clear expired coins manually
router.post('/clear-expired-coins', async (req, res) => {
    try {
        const [result] = await db.pool.execute(
            'UPDATE coins SET status = "expired" WHERE expiry_date <= CURDATE() AND status = "active"'
        );
        
        res.json({
            success: true,
            message: 'Expired coins cleared',
            data: {
                affected_rows: result.affectedRows
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;