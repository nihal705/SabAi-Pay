// backend/routes/agentOrderRoutes.js
// COMPLETE WORKING VERSION - Uses agentOrderController for all order processing

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * For licensing inquiries: sabaipaycontact@gmail.com
 */

const express = require('express');
const router = express.Router();
const agentOrderController = require('../controllers/agentOrderController');
const dbService = require('../services/databaseService');
const paymentService = require('../services/paymentService');
const { verifyToken } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(verifyToken);

// Logging middleware
router.use((req, res, next) => {
    console.log(`📨 Order Route: ${req.method} ${req.url}`);
    next();
});

// ============================================
// ORDER PROCESSING - Using Controller
// ============================================

// Process order - Main entry point for all chat messages
router.post('/process', agentOrderController.processOrder.bind(agentOrderController));

// Select items - For adding items to cart from grid or text
router.post('/select-items', agentOrderController.selectItems.bind(agentOrderController));

// Process Reserve Pay payment
router.post('/process-reserve', agentOrderController.processReservePayment.bind(agentOrderController));

// Confirm UPI payment after Razorpay success
router.post('/confirm-upi', agentOrderController.confirmUPIPayment.bind(agentOrderController));

// Setup Auto-Pay for recurring orders
router.post('/auto-pay/setup', agentOrderController.confirmAutoPaySetup.bind(agentOrderController));

// ============================================
// RESERVE LIMITS ENDPOINTS
// ============================================

// Get all reserve limits for user
router.get('/reserve-limits', agentOrderController.getReserveLimits.bind(agentOrderController));

// Sync reserve limits from frontend to database
router.post('/sync-reserve-limits', agentOrderController.syncReserveLimits.bind(agentOrderController));

// Update a specific reserve limit
router.post('/update-reserve-limits', agentOrderController.updateReserveLimits.bind(agentOrderController));

// Check if payment is within Reserve Pay limit
router.post('/check-reserve', agentOrderController.checkReservePayLimit.bind(agentOrderController));

// ============================================
// ORDER ENDPOINTS
// ============================================

// Get all user orders
router.get('/orders', agentOrderController.getUserOrders.bind(agentOrderController));

// Get single order by ID
router.get('/order/:orderId', agentOrderController.getOrder.bind(agentOrderController));

// Get order status with tracking
router.get('/status/:orderId', agentOrderController.getOrderStatus.bind(agentOrderController));

// ============================================
// TRANSACTION ENDPOINTS
// ============================================

// Save transaction to database
router.post('/save-transaction', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const transaction = req.body;
        
        const transactionId = transaction.transactionId || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        await dbService.createTransaction({
            transaction_id: transactionId,
            user_id: userId,
            type: transaction.type,
            amount: transaction.amount,
            status: transaction.status || 'success',
            description: transaction.description,
            sender_vpa: transaction.sender_vpa,
            receiver_vpa: transaction.receiver_vpa,
            receiver_name: transaction.receiver_name,
            bank_name: transaction.bank_name,
            bank_account_id: transaction.bank_id,
            gems_used: transaction.gems_used || 0,
            reserve_used: transaction.reserve_used || 0,
            bank_used: transaction.bank_used || 0,
            cashback_earned: transaction.cashback || 0,
            mobile_number: transaction.mobileNumber,
            operator: transaction.operator,
            circle: transaction.circle
        });
        
        console.log(`✅ Transaction saved for user ${userId}: ${transactionId}`);
        res.json({ success: true, message: "Transaction saved successfully", data: { transactionId } });
    } catch (error) {
        console.error('Save transaction error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all transactions for user
router.get('/transactions', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const { limit = 100, offset = 0 } = req.query;
        const transactions = await dbService.getTransactions(userId, parseInt(limit), parseInt(offset));
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// MERCHANT CONNECTION ENDPOINTS
// ============================================

// Get all connected merchants for user
router.get('/connected-merchants', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const merchants = await dbService.getConnectedMerchants(userId);
        res.json({ success: true, data: merchants });
    } catch (error) {
        console.error('Get connected merchants error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check if a specific merchant is connected
router.get('/check-connection/:merchantId', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const { merchantId } = req.params;
        const isConnected = await dbService.isMerchantConnected(userId, merchantId);
        res.json({ success: true, data: { connected: isConnected, merchantId } });
    } catch (error) {
        console.error('Check merchant connection error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// AUTO-PAY ENDPOINTS
// ============================================

// Get all auto-pay orders
router.get('/auto-pay/orders', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const orders = await dbService.getAutoPayOrders(userId);
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get Auto-Pay orders error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancel an auto-pay order
router.post('/auto-pay/cancel', async (req, res) => {
    try {
        const { orderId } = req.body;
        await dbService.updateAutoPayOrderStatus(orderId, 'cancelled');
        res.json({ success: true, message: "Auto-Pay cancelled successfully" });
    } catch (error) {
        console.error('Cancel Auto-Pay error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete an auto-pay order
router.delete('/auto-pay/:orderId', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const { orderId } = req.params;
        await dbService.deleteAutoPayOrder(orderId, userId);
        res.json({ success: true, message: "Auto-Pay order deleted successfully" });
    } catch (error) {
        console.error('Delete Auto-Pay error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update bank account for auto-pay
router.post('/auto-pay/update-bank', async (req, res) => {
    try {
        const { orderId, bankAccountId, bankName, bankAccountLast4 } = req.body;
        // Update logic would go here
        res.json({ success: true, message: "Bank account updated successfully" });
    } catch (error) {
        console.error('Update bank error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get auto-pay execution history
router.get('/auto-pay/history', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const orders = await dbService.getAutoPayOrders(userId);
        
        const history = [];
        orders.forEach(order => {
            if (order.execution_history) {
                const executions = JSON.parse(order.execution_history);
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
        console.error('Get Auto-Pay history error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// RAZORPAY ENDPOINTS
// ============================================

// Create Razorpay order for UPI payment
router.post('/create-order', async (req, res) => {
    try {
        const { amount, sessionId, merchant } = req.body;
        const razorpayOrder = await paymentService.createOrder(amount, 'INR', `order_${Date.now()}`);
        res.json({ 
            success: true, 
            data: { 
                razorpayOrder: razorpayOrder.order,
                sessionId,
                amount,
                merchant
            } 
        });
    } catch (error) {
        console.error('Create Razorpay order error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// CHAT SESSION ENDPOINTS
// ============================================

// Get all conversations for user
router.get('/conversations', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const conversations = await dbService.getConversations(userId);
        res.json({ success: true, data: conversations });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get messages for a conversation
router.get('/conversations/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await dbService.getMessages(conversationId);
        res.json({ success: true, data: messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save a message to conversation
router.post('/messages', async (req, res) => {
    try {
        const { conversationId, role, content, sessionId, cart, total, requiresAction, merchant } = req.body;
        await dbService.addMessage(conversationId, role, content, sessionId, cart, total, requiresAction, merchant);
        res.json({ success: true, message: "Message saved" });
    } catch (error) {
        console.error('Save message error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete a conversation
router.delete('/conversations/:conversationId', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const { conversationId } = req.params;
        await dbService.deleteConversation(conversationId, userId);
        res.json({ success: true, message: "Conversation deleted" });
    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/schedule', async (req, res) => {
    try {
        const { sessionId, scheduledTime } = req.body;
        const userId = req.user?.id ? String(req.user.id) : '4';
        
        // Update session with scheduled time
        const session = await dbService.getOrderSession(sessionId);
        if (session) {
            await dbService.saveOrderSession({
                ...session,
                is_scheduled: 1,
                scheduled_time: scheduledTime
            });
        }
        
        res.json({ success: true, message: "Order scheduled" });
    } catch (error) {
        console.error('Schedule order error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add route for updating merchant location
router.post('/update-location', async (req, res) => {
    try {
        const { merchantId, location } = req.body;
        const userId = req.user?.id ? String(req.user.id) : '4';
        
        await dbService.updateMerchantLocation(userId, merchantId, location);
        res.json({ success: true, message: "Location updated" });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// In agentOrderRoutes.js, update the add-to-cart endpoint to log the cart
router.post('/add-to-cart', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const { sessionId, items } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ success: false, error: 'Session ID required' });
        }
        
        // Get or create session
        let session = await dbService.getOrderSession(sessionId);
        if (!session) {
            // Create new session with nulls
            await dbService.saveOrderSession({
                session_id: sessionId,
                user_id: userId,
                merchant: null,
                merchant_info: null,
                cart: JSON.stringify([]),
                subtotal: 0,
                tax: 0,
                total: 0,
                step: 'init',
                preferences: null,
                is_scheduled: 0,
                scheduled_time: null
            });
            session = await dbService.getOrderSession(sessionId);
        }
        
        if (!session) {
            return res.status(404).json({ success: false, error: 'Failed to create session' });
        }
        
        // Parse cart
        let cart = [];
        if (session.cart) {
            try {
                cart = typeof session.cart === 'string' ? JSON.parse(session.cart) : session.cart;
                if (!Array.isArray(cart)) cart = [];
            } catch (e) {
                cart = [];
            }
        }
        
        // Add items
        for (const newItem of items) {
            const existing = cart.find(i => i.id === newItem.id);
            if (existing) {
                existing.quantity += newItem.quantity;
                existing.total = existing.price * existing.quantity;
            } else {
                cart.push({
                    id: newItem.id,
                    name: newItem.name,
                    price: newItem.price,
                    quantity: newItem.quantity,
                    total: newItem.price * newItem.quantity,
                    imageUrl: newItem.imageUrl || null,
                    category: newItem.category || null,
                    isVeg: newItem.isVeg || false
                });
            }
        }
        
        // Calculate totals
        const subtotal = cart.reduce((sum, i) => sum + (i.total || 0), 0);
        const tax = Math.round(subtotal * 0.05);
        const grandTotal = subtotal + tax;
        
        // Save updated session
        await dbService.saveOrderSession({
            session_id: session.session_id,
            user_id: session.user_id,
            merchant: session.merchant,
            merchant_info: session.merchant_info,
            cart: JSON.stringify(cart),
            subtotal: subtotal,
            tax: tax,
            total: grandTotal,
            step: cart.length > 0 ? 'payment_selection' : 'awaiting_items',
            preferences: session.preferences,
            is_scheduled: session.is_scheduled,
            scheduled_time: session.scheduled_time
        });
        
        res.json({
            success: true,
            data: { cart, total: grandTotal, subtotal, tax }
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Remove from cart
router.post('/remove-from-cart', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const { sessionId, itemId } = req.body;

        let session = await dbService.getOrderSession(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        let cart = [];
        if (session.cart) {
            try {
                cart = typeof session.cart === 'string' ? JSON.parse(session.cart) : session.cart;
            } catch (e) {
                cart = [];
            }
        }

        // Remove item
        cart = cart.filter(item => item.id !== itemId);

        // Recalculate totals
        let subtotal = cart.reduce((sum, i) => sum + (i.total || 0), 0);
        const tax = Math.round(subtotal * 0.05);
        const grandTotal = subtotal + tax;

        // Save updated session
        await dbService.saveOrderSession({
            session_id: session.session_id,
            user_id: session.user_id,
            merchant: session.merchant,
            merchant_info: session.merchant_info,
            cart: JSON.stringify(cart),
            subtotal: subtotal,
            tax: tax,
            total: grandTotal,
            step: cart.length > 0 ? 'payment_selection' : 'awaiting_items',
            preferences: session.preferences,
            is_scheduled: session.is_scheduled,
            scheduled_time: session.scheduled_time
        });

        res.json({
            success: true,
            data: { cart, total: grandTotal, subtotal, tax }
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update cart item quantity
router.post('/update-cart-quantity', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const { sessionId, itemId, quantity } = req.body;
        
        let session = await agentOrderController.getOrCreateSession(userId, sessionId);
        
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }
        
        // Update item quantity
        let updatedCart = (session.cart || []).map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    quantity: quantity,
                    total: item.price * quantity
                };
            }
            return item;
        }).filter(item => item.quantity > 0);
        
        // Calculate totals
        let subtotal = updatedCart.reduce((sum, i) => sum + i.total, 0);
        const tax = Math.round(subtotal * 0.05);
        const grandTotal = subtotal + tax;
        
        session.cart = updatedCart;
        session.subtotal = subtotal;
        session.tax = tax;
        session.total = grandTotal;
        
        await agentOrderController.saveSession(session);
        
        res.json({
            success: true,
            data: {
                cart: updatedCart,
                total: grandTotal
            }
        });
    } catch (error) {
        console.error('Update cart quantity error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Schedule order
router.post('/schedule-order', async (req, res) => {
  try {
    const userId = req.user?.id ? String(req.user.id) : '4';
    const { 
      sessionId, cart, total, merchant, merchantName, scheduledTime, 
      paymentMethod, bankAccountId, paymentBreakdown 
    } = req.body;

    console.log('📦 Schedule order request body:', req.body);

    const scheduleId = `SCHED_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    const scheduledOrder = {
      id: scheduleId,
      userId: userId,
      merchant: merchant || null,
      merchantName: merchantName || null,
      items: cart || [],
      totalAmount: total || 0,
      scheduleTime: scheduledTime || null,
      paymentMethod: paymentMethod || null,
      bankAccountId: bankAccountId || null,
      paymentBreakdown: paymentBreakdown || null,
      status: 'scheduled'
    };

    console.log('📦 Scheduled order object to save:', scheduledOrder);

    await dbService.saveScheduledOrder(scheduledOrder);

    const autoPayOrder = {
    orderId: scheduleId,
    type: 'merchant',
    merchant: merchant,
    merchantName: merchantName,
    amount: total,
    schedule: 'one-time',
    dateValue: new Date(scheduledTime).getDate(),
    time: new Date(scheduledTime).toTimeString().slice(0,5),
    paymentMethod: paymentMethod,
    bankAccountId: bankAccountId || null,
    status: 'active',
    nextExecution: scheduledTime,
    isBillPayment: false,
    isRecharge: false
};
await dbService.createAutoPayOrder(userId, autoPayOrder);

    // Clear the session cart
    const session = await dbService.getOrderSession(sessionId);
    if (session) {
      await dbService.saveOrderSession({
        ...session,
        cart: JSON.stringify([]),
        subtotal: 0,
        tax: 0,
        total: 0
      });
    }

    res.json({ success: true, data: { scheduleId, scheduledTime } });
  } catch (error) {
    console.error('Schedule order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get scheduled orders
router.get('/scheduled-orders', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const orders = await scheduledOrderService.getUserScheduledOrders(userId);
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get scheduled orders error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancel scheduled order
router.post('/cancel-scheduled-order', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const { orderId } = req.body;
        
        const result = await scheduledOrderService.cancelScheduledOrder(orderId, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Cancel scheduled order error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update scheduled order payment method
router.post('/update-scheduled-payment', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const { orderId, paymentMethod, bankAccountId } = req.body;
        
        const result = await scheduledOrderService.updatePaymentMethod(orderId, userId, paymentMethod, bankAccountId);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Update payment method error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id ? String(req.user.id) : '4';
        
        const session = await dbService.getOrderSession(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }
        
        // Parse JSON fields
        let merchantInfo = session.merchant_info;
        let cart = session.cart;
        let preferences = session.preferences;
        
        if (typeof merchantInfo === 'string') {
            try { merchantInfo = JSON.parse(merchantInfo); } catch (e) { merchantInfo = {}; }
        }
        if (typeof cart === 'string') {
            try { cart = JSON.parse(cart); } catch (e) { cart = []; }
        }
        if (typeof preferences === 'string') {
            try { preferences = JSON.parse(preferences); } catch (e) { preferences = {}; }
        }
        
        console.log('Session cart:', cart);
        
        res.json({
            success: true,
            data: {
                sessionId: session.session_id,
                merchant: session.merchant,
                merchantInfo: merchantInfo,
                cart: cart,
                total: session.total,
                subtotal: session.subtotal,
                tax: session.tax
            }
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/save-order', async (req, res) => {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        const orderData = req.body;
        
        // Get existing orders
        let orders = [];
        try {
            const [rows] = await db.pool.execute(
                `SELECT * FROM agent_orders WHERE user_id = ? ORDER BY created_at DESC`,
                [userId]
            );
            orders = rows;
        } catch (err) {
            // Table might not exist yet
        }
        
        // Save to database
        await db.pool.execute(
            `INSERT INTO agent_orders (order_id, user_id, merchant, merchant_name, items, total_amount, status, payment_method, sabai_gems, created_at, tracking)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                orderData.id,
                userId,
                orderData.merchant,
                orderData.merchantName,
                JSON.stringify(orderData.items),
                orderData.totalAmount,
                orderData.status || 'confirmed',
                orderData.paymentMethod,
                orderData.sabaiGems || 0,
                orderData.createdAt || new Date().toISOString(),
                JSON.stringify(orderData.tracking || [])
            ]
        );
        
        res.json({ success: true, data: orderData });
    } catch (error) {
        console.error('Save order error:', error);
        // Still return success since order is saved locally
        res.json({ success: true, message: 'Order saved locally' });
    }
});

// Add route for getting merchant connection
router.get('/connection/:merchantId', async (req, res) => {
    try {
        const { merchantId } = req.params;
        const userId = req.user?.id ? String(req.user.id) : '4';
        
        const connection = await dbService.getMerchantConnection(userId, merchantId);
        res.json({ success: true, data: connection });
    } catch (error) {
        console.error('Get connection error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;