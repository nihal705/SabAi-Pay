// backend/routes/agentPaymentRoutes.js
// Routes for Agent Pay - P2P, Bills, Recharge

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
const agentPaymentController = require('../controllers/agentPaymentController');
const recipientResolverService = require('../services/recipientResolverService');
const billerCatalogService = require('../services/billerCatalogService');
const rechargePlanService = require('../services/rechargePlanService');
const agentSecurityService = require('../services/agentSecurityService');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// ============================================
// SEND MONEY
// ============================================

// Resolve recipient from text
router.post('/send-money/resolve-recipient', async (req, res) => {
    try {
        const userId = req.user.id;
        const { text } = req.body;
        
        const result = await recipientResolverService.resolve(text, userId);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Resolve recipient error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send money
router.post('/send-money', async (req, res) => {
    try {
        const userId = req.user.id;
        const { recipient, amount, note } = req.body;
        
        const result = await agentPaymentController.sendMoney(userId, recipient, amount, note);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Send money error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Confirm send money (with PIN)
router.post('/send-money/confirm', async (req, res) => {
    try {
        const userId = req.user.id;
        const { paymentData, pin } = req.body;
        
        const result = await agentPaymentController.confirmSendMoney(userId, paymentData, pin);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Confirm send money error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// REQUEST MONEY
// ============================================

router.post('/request-money', async (req, res) => {
    try {
        const userId = req.user.id;
        const { recipient, amount, note } = req.body;
        
        const result = await agentPaymentController.requestMoney(userId, recipient, amount, note);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Request money error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// BILL PAYMENTS
// ============================================

// List billers
router.get('/bills/list-billers', async (req, res) => {
    try {
        const { category } = req.query;
        let billers;
        if (category) {
            billers = billerCatalogService.getBillersByCategory(category);
        } else {
            billers = billerCatalogService.getAllBillers();
        }
        
        res.json({
            success: true,
            data: {
                billers: billers,
                categories: billerCatalogService.getCategories()
            }
        });
    } catch (error) {
        console.error('List billers error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fetch bill amount (if supported)
router.post('/bills/fetch-amount', async (req, res) => {
    try {
        const { billerId, customerId } = req.body;
        const biller = billerCatalogService.getBillerById(billerId);
        
        if (!biller) {
            return res.status(404).json({ success: false, error: 'Biller not found' });
        }
        
        // For demo purposes, simulate bill amount
        // In production, this would call an API
        const amount = Math.floor(Math.random() * 2000) + 500;
        
        res.json({
            success: true,
            data: {
                amount: amount,
                customerId: customerId,
                biller: biller
            }
        });
    } catch (error) {
        console.error('Fetch bill amount error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Pay bill
router.post('/bills/pay', async (req, res) => {
    try {
        const userId = req.user.id;
        const { billType, provider, customerId, amount } = req.body;
        
        const result = await agentPaymentController.payBill(userId, billType, provider, customerId, amount);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Pay bill error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Confirm bill payment
router.post('/bills/confirm', async (req, res) => {
    try {
        const userId = req.user.id;
        const { paymentData, pin } = req.body;
        
        const result = await agentPaymentController.confirmBillPayment(userId, paymentData, pin);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Confirm bill payment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// MOBILE RECHARGE
// ============================================

// Detect operator
router.post('/recharge/detect-operator', async (req, res) => {
    try {
        const { mobileNumber } = req.body;
        
        if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
            return res.status(400).json({ success: false, error: 'Invalid mobile number' });
        }
        
        const operator = rechargePlanService.detectOperator(mobileNumber);
        
        res.json({
            success: true,
            data: {
                mobileNumber: mobileNumber,
                operator: operator,
                detected: !!operator
            }
        });
    } catch (error) {
        console.error('Detect operator error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// List recharge plans
router.post('/recharge/list-plans', async (req, res) => {
    try {
        const { operatorId } = req.body;
        
        const plans = rechargePlanService.getPlans(operatorId);
        const operator = rechargePlanService.getOperatorById(operatorId);
        
        res.json({
            success: true,
            data: {
                operator: operator,
                plans: plans
            }
        });
    } catch (error) {
        console.error('List plans error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Recharge mobile
router.post('/recharge/pay', async (req, res) => {
    try {
        const userId = req.user.id;
        const { mobileNumber, amount, plan } = req.body;
        
        const result = await agentPaymentController.rechargeMobile(userId, mobileNumber, amount, plan);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Recharge error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Confirm recharge
router.post('/recharge/confirm', async (req, res) => {
    try {
        const userId = req.user.id;
        const { paymentData, pin } = req.body;
        
        const result = await agentPaymentController.confirmRecharge(userId, paymentData, pin);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Confirm recharge error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// MULTI PAYMENT
// ============================================

// Build multi-payment
router.post('/multi-payment/build', async (req, res) => {
    try {
        const userId = req.user.id;
        const { payments } = req.body;
        
        const result = await agentPaymentController.multiPayment(userId, payments);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Multi-payment build error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Confirm multi-payment
router.post('/multi-payment/confirm', async (req, res) => {
    try {
        const userId = req.user.id;
        const { payments, pin } = req.body;
        
        // For multi-payment, confirm each payment
        const results = [];
        for (const payment of payments) {
            let result;
            if (payment.type === 'send_money') {
                result = await agentPaymentController.confirmSendMoney(userId, payment.paymentData, pin);
            } else if (payment.type === 'pay_bill') {
                result = await agentPaymentController.confirmBillPayment(userId, payment.paymentData, pin);
            } else if (payment.type === 'recharge_mobile') {
                result = await agentPaymentController.confirmRecharge(userId, payment.paymentData, pin);
            }
            results.push(result);
        }
        
        const allSuccess = results.every(r => r.success);
        
        res.json({
            success: true,
            data: {
                results: results,
                allSuccess: allSuccess,
                message: allSuccess ? '✅ All payments completed successfully!' : '⚠️ Some payments failed.'
            }
        });
    } catch (error) {
        console.error('Multi-payment confirm error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// SECURITY
// ============================================

// Check if SabAI Pay Lite is available
router.post('/security/check-limit', async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount } = req.body;
        
        const result = await agentSecurityService.isSabAIPayLiteAvailable(userId, amount);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Check limit error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get SabAI Pay Lite limit
router.get('/security/sabai-pay-lite', async (req, res) => {
    try {
        const userId = req.user.id;
        
        const limit = await agentSecurityService.getSabAIPayLiteLimit(userId);
        
        res.json({
            success: true,
            data: limit
        });
    } catch (error) {
        console.error('Get SabAI Pay Lite error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;