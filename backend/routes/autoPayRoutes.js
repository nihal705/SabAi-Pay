// backend/routes/autoPayRoutes.js
const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');
const { verifyToken } = require('../middleware/auth');

// Get all auto-pay orders
router.get('/orders', verifyToken, async (req, res) => {
    try {
        const orders = await dbService.getAutoPayOrders(req.user.id);
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get auto-pay orders error:', error);
        res.status(500).json({ success: false, message: 'Failed to get auto-pay orders' });
    }
});

// Create auto-pay order
router.post('/orders', verifyToken, async (req, res) => {
    const orderData = req.body;
    
    try {
        const order = await dbService.createAutoPayOrder(req.user.id, orderData);
        res.status(201).json({ success: true, data: { orderId: order.order_id, order } });
    } catch (error) {
        console.error('Create auto-pay order error:', error);
        res.status(500).json({ success: false, message: 'Failed to create auto-pay order' });
    }
});

// Update auto-pay order
router.put('/orders/:orderId', verifyToken, async (req, res) => {
    const { orderId } = req.params;
    const updates = req.body;
    
    try {
        await dbService.updateAutoPayOrder(orderId, req.user.id, updates);
        res.json({ success: true, message: 'Auto-pay order updated' });
    } catch (error) {
        console.error('Update auto-pay order error:', error);
        res.status(500).json({ success: false, message: 'Failed to update auto-pay order' });
    }
});

// Delete auto-pay order
router.delete('/orders/:orderId', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        
        await dbService.deleteAutoPayOrder(orderId, userId);
        
        res.json({ success: true, message: 'Auto-pay order deleted' });
    } catch (error) {
        console.error('Delete auto-pay order error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Cancel auto-pay order
router.post('/orders/:orderId/cancel', verifyToken, async (req, res) => {
    const { orderId } = req.params;
    
    try {
        await dbService.updateAutoPayOrderStatus(orderId, 'cancelled', req.user.id);
        res.json({ success: true, message: 'Auto-pay order cancelled' });
    } catch (error) {
        console.error('Cancel auto-pay order error:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel auto-pay order' });
    }
});

// Get auto-pay history
router.get('/history', verifyToken, async (req, res) => {
    try {
        const orders = await dbService.getAutoPayOrders(req.user.id);
        const history = [];
        
        orders.forEach(order => {
            if (order.execution_history) {
                const executions = Array.isArray(order.execution_history) ? order.execution_history : JSON.parse(order.execution_history);
                executions.forEach(exec => {
                    history.push({
                        id: `${order.order_id}_${exec.date}`,
                        orderId: order.order_id,
                        merchant: order.merchant_name,
                        amount: exec.amount || order.amount,
                        status: exec.status,
                        date: exec.date,
                        error: exec.error
                    });
                });
            }
        });
        
        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('Get auto-pay history error:', error);
        res.status(500).json({ success: false, message: 'Failed to get auto-pay history' });
    }
});

module.exports = router;
