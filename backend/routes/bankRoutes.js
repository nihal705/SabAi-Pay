// backend/routes/bankRoutes.js
// COMPLETE WORKING VERSION

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const dbService = require('../services/databaseService');
const paymentService = require('../services/paymentService');
const { verifyToken } = require('../middleware/auth');

// Short-lived server-side records bind a Razorpay checkout order to the person
// who initiated it. They are deliberately not sent to the browser.
const bankVerificationOrders = new Map();

// ============ PIN MANAGEMENT ============

// Check if bank account has PIN
router.get('/accounts/:id/has-pin', verifyToken, async (req, res) => {
    try {
        const accountId = req.params.id;
        const userId = req.user.id;
        
        const account = await dbService.getBankAccountById(accountId, userId);
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        
        const hasPin = await dbService.hasUpiPin(accountId);
        res.json({ success: true, data: { hasPin } });
    } catch (error) {
        console.error('Check PIN error:', error);
        res.status(500).json({ success: false, message: 'Failed to check PIN' });
    }
});

router.post('/verify-pin', verifyToken, async (req, res) => {
    const { accountId, pin } = req.body;
    const userId = req.user.id;
    
    console.log('Verify PIN request:', { accountId, userId });
    
    if (!pin || pin.length !== 4) {
        return res.status(400).json({ success: false, message: 'PIN must be 4 digits' });
    }
    
    try {
        const account = await dbService.getBankAccountById(accountId, userId);
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        
        const isValid = await dbService.verifyUpiPin(accountId, pin);
        
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid PIN' });
        }
        
        res.json({ success: true, message: 'PIN set successfully', data: { success: true } });
    } catch (error) {
        console.error('Verify PIN error:', error);
        res.status(500).json({ success: false, message: 'Verification failed: ' + error.message });
    }
});

// Set UPI PIN
router.post('/accounts/:id/pin', verifyToken, async (req, res) => {
    const { pin } = req.body;
    const accountId = req.params.id;
    const userId = req.user.id;
    
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({ success: false, message: 'PIN must be 4 digits' });
    }
    
    try {
        const account = await dbService.getBankAccountById(accountId, userId);
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        
        const pinHash = await bcrypt.hash(pin, 10);
        await dbService.setUpiPin(accountId, pinHash);
        
        res.json({ success: true, message: 'PIN set successfully' });
    } catch (error) {
        console.error('Set PIN error:', error);
        res.status(500).json({ success: false, message: 'Failed to set PIN' });
    }
});

// Verify UPI PIN
router.post('/verify-pin', verifyToken, async (req, res) => {
    const { accountId, pin } = req.body;
    const userId = req.user.id;
    
    if (!pin || pin.length !== 4) {
        return res.status(400).json({ success: false, message: 'PIN must be 4 digits' });
    }
    
    try {
        const account = await dbService.getBankAccountById(accountId, userId);
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        
        const isValid = await dbService.verifyUpiPin(accountId, pin);
        
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid PIN' });
        }
        
        res.json({ success: true, message: 'PIN verified' });
    } catch (error) {
        console.error('Verify PIN error:', error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
});

// ============ BANK ACCOUNTS CRUD ============

// Get all bank accounts
router.get('/accounts', verifyToken, async (req, res) => {
    try {
        const accounts = await dbService.getBankAccounts(req.user.id);
        res.json({ success: true, data: accounts });
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({ success: false, message: 'Failed to get accounts' });
    }
});

// Add bank account
router.post('/accounts', verifyToken, async (req, res) => {
    const { bank_name, account_number, ifsc_code, account_holder_name, upi_id, is_primary } = req.body;
    
    try {
        const account = await dbService.addBankAccount(req.user.id, {
            bank_name, account_number, ifsc_code, account_holder_name, upi_id, is_primary
        });
        res.json({ success: true, data: account });
    } catch (error) {
        console.error('Add account error:', error);
        res.status(500).json({ success: false, message: 'Failed to add account' });
    }
});

// Delete bank account
router.delete('/accounts/:id', verifyToken, async (req, res) => {
    try {
        await dbService.deleteBankAccount(req.params.id, req.user.id);
        res.json({ success: true, message: 'Account deleted' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete account' });
    }
});

// Set primary bank account
router.put('/accounts/:id/primary', verifyToken, async (req, res) => {
    try {
        await dbService.setPrimaryBankAccount(req.params.id, req.user.id);
        res.json({ success: true, message: 'Primary account updated' });
    } catch (error) {
        console.error('Set primary error:', error);
        res.status(500).json({ success: false, message: 'Failed to set primary' });
    }
});

// ============ BALANCE OPERATIONS ============

// Get balance
router.get('/balance/:accountId', verifyToken, async (req, res) => {
    try {
        const account = await dbService.getBankAccountById(req.params.accountId, req.user.id);
        res.json({ success: true, data: { balance: account?.balance || 0 } });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ success: false, message: 'Failed to get balance' });
    }
});

// Deposit money
router.post('/deposit', verifyToken, async (req, res) => {
    const { accountId, amount } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    try {
        const account = await dbService.getBankAccountById(accountId, req.user.id);
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        
        const newBalance = await dbService.updateBankBalance(accountId, amount, true);
        
        const transactionId = `DEP${Date.now()}`;
        await dbService.createTransaction({
            transaction_id: transactionId,
            user_id: req.user.id,
            type: 'self_transfer',
            amount: amount,
            status: 'success',
            bank_name: account.bank_name,
            bank_account_id: accountId,
            description: `Deposit of ₹${amount}`
        });
        
        res.json({ success: true, data: { balance: newBalance } });
    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({ success: false, message: error.message || 'Deposit failed' });
    }
});

// Withdraw money
router.post('/withdraw', verifyToken, async (req, res) => {
    const { accountId, amount } = req.body;
    
    console.log('Withdraw request:', { accountId, amount, userId: req.user.id });
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    try {
        const account = await dbService.getBankAccountById(accountId, req.user.id);
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        
        const currentBalance = account.balance || 0;
        if (amount > currentBalance) {
            return res.status(400).json({ success: false, message: 'Insufficient balance' });
        }
        
        const newBalance = await dbService.updateBankBalance(accountId, amount, false);
        
        const transactionId = `WTD${Date.now()}`;
        await dbService.createTransaction({
            transaction_id: transactionId,
            user_id: req.user.id,
            type: 'self_transfer',
            amount: amount,
            status: 'success',
            bank_name: account.bank_name,
            bank_account_id: accountId,
            description: `Withdrawal of ₹${amount} from ${account.bank_name}`,
            gems_used: 0,
            reserve_used: 0,
            bank_used: amount,
            cashback_earned: 0
        });
        
        res.json({ success: true, data: { balance: newBalance } });
    } catch (error) {
        console.error('Withdraw error DETAILS:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Test-mode bank-link verification. Razorpay credentials stay on the server;
// the browser receives only the public key and a provider-created order ID.
router.post('/verification-order', verifyToken, async (req, res) => {
    try {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || !paymentService.razorpay) {
            return res.status(503).json({ success: false, message: 'Razorpay test credentials are not configured on the backend' });
        }
        const result = await paymentService.createOrder(1, 'INR', `bank_link_${Date.now()}`, { user_id: req.user.id, purpose: 'bank_link_verification' });
        if (!result.success) return res.status(503).json({ success: false, message: result.error || 'Could not create Razorpay verification order' });
        bankVerificationOrders.set(result.order.id, { userId: req.user.id, expiresAt: Date.now() + (15 * 60 * 1000) });
        res.json({ success: true, data: { key: process.env.RAZORPAY_KEY_ID, orderId: result.order.id, amount: 100, currency: 'INR' } });
    } catch (error) {
        console.error('Create bank verification order error:', error);
        res.status(500).json({ success: false, message: 'Could not start bank verification' });
    }
});

router.post('/verified-accounts', verifyToken, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, account } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !account) return res.status(400).json({ success: false, message: 'Incomplete payment verification' });
    try {
        const verification = bankVerificationOrders.get(razorpay_order_id);
        if (!verification || verification.userId !== req.user.id || verification.expiresAt < Date.now()) {
            bankVerificationOrders.delete(razorpay_order_id);
            return res.status(400).json({ success: false, message: 'This bank verification session has expired. Please try again.' });
        }
        if (!paymentService.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)) return res.status(400).json({ success: false, message: 'Razorpay payment verification failed' });
        const paymentResult = await paymentService.getPaymentDetails(razorpay_payment_id);
        if (!paymentResult.success || paymentResult.payment.status !== 'captured' || Number(paymentResult.payment.amount) !== 100) {
            return res.status(400).json({ success: false, message: 'The ₹1 Razorpay verification payment was not completed' });
        }
        const saved = await dbService.addBankAccount(req.user.id, account);
        bankVerificationOrders.delete(razorpay_order_id);
        res.json({ success: true, data: saved });
    } catch (error) {
        console.error('Verify bank link error:', error);
        res.status(500).json({ success: false, message: 'Could not save verified bank account' });
    }
});

// The SQL function locks both account rows, updates both balances and records the
// transfer in one database transaction. Never move balances in the browser.
router.post('/transfer', verifyToken, async (req, res) => {
    const { fromAccountId, toAccountId, amount, pin } = req.body;
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Provide two different accounts and a valid amount' });
    }
    try {
        const pinIsValid = await dbService.verifyUpiPin(fromAccountId, pin);
        if (!pinIsValid) return res.status(400).json({ success: false, message: 'Incorrect or unavailable UPI PIN' });
        const data = await dbService.transferBetweenBankAccounts(req.user.id, fromAccountId, toAccountId, amount);
        res.json({ success: true, data });
    } catch (error) {
        const message = error.message || 'Transfer failed';
        res.status(/insufficient|not found|does not belong/i.test(message) ? 400 : 500).json({ success: false, message });
    }
});

// ============ COIN MANAGEMENT ============

// Get coin balance
router.get('/coins/balance', verifyToken, async (req, res) => {
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

// Update coin balance
router.post('/coins/update', verifyToken, async (req, res) => {
    const { amount, isEarning } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    try {
        const newBalance = await dbService.updateCoinBalance(req.user.id, amount, isEarning);
        
        await dbService.addCoinTransaction(
            req.user.id,
            amount,
            isEarning ? 'earned' : 'used',
            isEarning ? 'cashback' : 'redemption',
            `coin_update_${Date.now()}`,
            isEarning ? `Earned ${amount} SabAI Gems` : `Used ${amount} SabAI Gems`
        );
        
        res.json({ success: true, data: { newBalance: newBalance.balance } });
    } catch (error) {
        console.error('Update coin balance error:', error);
        res.status(500).json({ success: false, message: 'Failed to update coin balance' });
    }
});

module.exports = router;
