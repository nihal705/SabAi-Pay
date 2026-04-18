// backend/services/agentPayService.js
// Handles Agent Pay logic with Reserve Pay integration

const db = require('../config/database');

class AgentPayService {
    constructor() {
        this.paymentMethods = ['upi', 'reserve_pay', 'coins'];
    }

    // Check if order can be paid via Reserve Pay
    async checkReservePay(userId, merchant, amount) {
        try {
            // Get user's reserve pay limit for this merchant
            const [rows] = await db.pool.execute(
                `SELECT * FROM agent_limits 
                 WHERE user_id = ? AND merchant = ? AND is_active = true`,
                [userId, merchant]
            );

            if (rows.length === 0) {
                return {
                    eligible: false,
                    reason: 'No Reserve Pay limit set',
                    canSetup: true
                };
            }

            const limit = rows[0];
            const newTotal = limit.current_spent + amount;

            if (newTotal <= limit.monthly_limit) {
                return {
                    eligible: true,
                    method: 'reserve_pay',
                    remaining: limit.monthly_limit - newTotal,
                    limit: limit.monthly_limit,
                    spent: limit.current_spent,
                    message: `✅ Within limit! ₹${limit.monthly_limit - newTotal} remaining`
                };
            } else {
                return {
                    eligible: false,
                    method: 'upi',
                    reason: `Exceeds limit by ₹${newTotal - limit.monthly_limit}`,
                    limit: limit.monthly_limit,
                    spent: limit.current_spent
                };
            }

        } catch (error) {
            console.error('Reserve Pay check error:', error);
            return { eligible: false, method: 'upi', reason: 'Error checking limit' };
        }
    }

    // Process payment via Agent Pay
    async processPayment(userId, orderDetails, paymentMethod) {
        const { merchant, amount, orderId } = orderDetails;

        // Check Reserve Pay if selected
        if (paymentMethod === 'reserve_pay') {
            const reserveCheck = await this.checkReservePay(userId, merchant, amount);
            
            if (!reserveCheck.eligible) {
                return {
                    success: false,
                    error: reserveCheck.reason,
                    alternativeMethod: 'upi'
                };
            }

            // Update reserve pay spent amount
            await db.pool.execute(
                `UPDATE agent_limits 
                 SET current_spent = current_spent + ? 
                 WHERE user_id = ? AND merchant = ?`,
                [amount, userId, merchant]
            );

            // Process payment (in real app, this would call merchant API)
            const paymentResult = await this.processReservePayPayment(orderDetails);
            
            return {
                success: true,
                method: 'reserve_pay',
                message: 'Payment processed via Reserve Pay',
                ...paymentResult
            };
        }

        // Regular UPI payment via Razorpay
        if (paymentMethod === 'upi') {
            // Razorpay payment would be handled client-side
            // This is just order creation
            return {
                success: true,
                method: 'upi',
                requiresClientPayment: true,
                message: 'Please complete payment via UPI'
            };
        }

        // Coin payment
        if (paymentMethod === 'coins') {
            const coinCheck = await this.checkCoinBalance(userId, amount);
            if (coinCheck.eligible) {
                await this.deductCoins(userId, amount);
                return {
                    success: true,
                    method: 'coins',
                    message: `Paid with ${Math.floor(amount/100)} coins`
                };
            }
        }

        return { success: false, error: 'Invalid payment method' };
    }

    // Process Reserve Pay payment
    async processReservePayPayment(orderDetails) {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            paymentId: 'RP' + Date.now(),
            status: 'success',
            message: 'Payment authorized via Reserve Pay'
        };
    }

    // Check coin balance
    async checkCoinBalance(userId, amount) {
        const coinValue = Math.floor(amount / 100);
        
        const [rows] = await db.pool.execute(
            `SELECT SUM(amount) as total FROM coins 
             WHERE user_id = ? AND status = 'active' AND expiry_date > NOW()`,
            [userId]
        );

        const balance = rows[0].total || 0;
        
        return {
            eligible: balance >= coinValue,
            required: coinValue,
            balance: balance
        };
    }

    // Deduct coins
    async deductCoins(userId, amount) {
        const coinsNeeded = Math.floor(amount / 100);
        
        // Get oldest coins first (FIFO)
        await db.pool.execute(
            `UPDATE coins SET status = 'used', used_date = NOW() 
             WHERE user_id = ? AND status = 'active' 
             ORDER BY earned_date ASC 
             LIMIT ?`,
            [userId, coinsNeeded]
        );
    }
}

module.exports = new AgentPayService();