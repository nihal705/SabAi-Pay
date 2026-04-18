// backend/services/scheduledOrderService.js
// COMPLETE SCHEDULED ORDER SERVICE WITH AUTO-PAY

const dbService = require('./databaseService');
const paymentService = require('./paymentService');

class ScheduledOrderService {
    constructor() {
        this.scheduledOrders = new Map();
        this.startScheduler();
    }

    startScheduler() {
        if (this.schedulerInterval) clearInterval(this.schedulerInterval);
        
        // Check every minute for orders to execute
        this.schedulerInterval = setInterval(() => {
            this.checkAndExecuteOrders();
        }, 60000);
        
        console.log('⏰ Scheduled order service started');
    }

    async scheduleOrder(userId, orderData, scheduleTime, paymentMethod, bankAccountId = null) {
        const scheduleId = `SCHED_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        
        const scheduledOrder = {
            id: scheduleId,
            userId: userId,
            merchant: orderData.merchant,
            merchantName: orderData.merchantName,
            items: orderData.items,
            totalAmount: orderData.total,
            scheduleTime: scheduleTime,
            paymentMethod: paymentMethod,
            bankAccountId: bankAccountId,
            status: 'scheduled',
            createdAt: new Date().toISOString(),
            executionHistory: []
        };
        
        // Save to database
        await dbService.saveScheduledOrder(scheduledOrder);
        
        // Store in memory
        if (!this.scheduledOrders.has(userId)) {
            this.scheduledOrders.set(userId, []);
        }
        this.scheduledOrders.get(userId).push(scheduledOrder);
        
        console.log(`📅 Scheduled order ${scheduleId} for user ${userId} at ${scheduleTime}`);
        return scheduledOrder;
    }

    async checkAndExecuteOrders() {
        const now = new Date();
        const ordersToExecute = [];
        
        for (const [userId, orders] of this.scheduledOrders) {
            for (const order of orders) {
                if (order.status === 'scheduled' && new Date(order.scheduleTime) <= now) {
                    ordersToExecute.push({ userId, order });
                }
            }
        }
        
        for (const { userId, order } of ordersToExecute) {
            await this.executeScheduledOrder(userId, order);
        }
    }

    async executeScheduledOrder(userId, scheduledOrder) {
    console.log(`🔄 Executing scheduled order ${scheduledOrder.id}`);
    try {
        // Update status to processing
        scheduledOrder.status = 'processing';
        await dbService.updateScheduledOrder(scheduledOrder.id, { status: 'processing' });

        let paymentSuccess = false;
        let transactionId = null;
        const { paymentMethod, bankAccountId, paymentBreakdown } = scheduledOrder;
        const orderAmount = scheduledOrder.totalAmount;

        // Process payment based on method (implement these methods as needed)
        if (paymentMethod === 'reserve_pay') {
            paymentSuccess = await this.processReservePayPayment(userId, scheduledOrder);
        } else if (paymentMethod === 'merchant_reserve_pay') {
            paymentSuccess = await this.processMerchantReservePayPayment(userId, scheduledOrder);
        } else if (paymentMethod === 'bank' && bankAccountId) {
            paymentSuccess = await this.processBankPayment(userId, scheduledOrder);
        } else if (paymentMethod === 'gems') {
            paymentSuccess = await this.processGemsPayment(userId, scheduledOrder);
        } else if (paymentMethod === 'gems_and_bank') {
            paymentSuccess = await this.processCombinedPayment(userId, scheduledOrder);
        } else if (paymentMethod === 'gems_and_lite') {
            paymentSuccess = await this.processCombinedPayment(userId, scheduledOrder);
        } else if (paymentMethod === 'gems_and_merchant_reserve') {
            paymentSuccess = await this.processCombinedPayment(userId, scheduledOrder);
        } else {
            paymentSuccess = false;
        }

        if (paymentSuccess) {
            const now = new Date();
            const deliveryTime = new Date(now.getTime() + 45 * 60000);
            const tracking = [
                { status: 'confirmed', label: 'Order Confirmed', completed: true, time: now.toLocaleTimeString() },
                { status: 'preparing', label: 'Preparing', completed: false, estimatedTime: deliveryTime.toLocaleTimeString() },
                { status: 'out_for_delivery', label: 'Out for Delivery', completed: false },
                { status: 'delivered', label: 'Delivered', completed: false }
            ];

            const cashback = this.calculateCashback(orderAmount, 
                (paymentBreakdown?.gemsAmount > 0), (paymentBreakdown?.reserveAmount > 0));
            const paymentMethodDisplay = this.getPaymentMethodDisplay(paymentMethod);

            const updatedOrderData = {
                ...scheduledOrder.orderData,
                tracking: tracking,
                status: 'confirmed',
                paymentMethod: paymentMethodDisplay,
                sabaiGems: cashback,
                transactionId: transactionId,
                executedAt: now.toISOString()
            };

            await dbService.updateScheduledOrder(scheduledOrder.id, {
                status: 'confirmed',
                order_data: JSON.stringify(updatedOrderData),
                executed_at: now.toISOString(),
                result: JSON.stringify({ success: true, transactionId })
            });

            // Create transaction record
            await dbService.createTransaction({
                transaction_id: transactionId,
                user_id: userId,
                type: 'merchant_order',
                amount: orderAmount,
                status: 'success',
                description: `Order payment to ${scheduledOrder.merchantName}`,
                merchant: scheduledOrder.merchant,
                payment_method_display: paymentMethodDisplay,
                payment_breakdown: JSON.stringify(paymentBreakdown),
                cashback_earned: cashback
            });

            // Update auto-pay order status
            await dbService.updateAutoPayOrderStatus(scheduledOrder.id, 'completed');

            // Send notification
            await this.notifyUser(userId, {
                type: 'order_executed',
                orderId: scheduledOrder.id,
                message: `✅ Your scheduled order from ${scheduledOrder.merchantName} has been placed successfully!`
            });

            console.log(`✅ Scheduled order ${scheduledOrder.id} executed and updated`);
        } else {
            throw new Error('Payment failed');
        }
    } catch (error) {
        console.error(`Failed to execute scheduled order ${scheduledOrder.id}:`, error);
        await dbService.updateScheduledOrder(scheduledOrder.id, {
            status: 'failed',
            error: error.message
        });
        await this.notifyUser(userId, {
            type: 'order_failed',
            message: `❌ Your scheduled order from ${scheduledOrder.merchantName} failed. Reason: ${error.message}`
        });
    }
}

// Add these helper methods inside the class:

calculateCashback(amount, gemsUsed = false, reserveUsed = false) {
    if (gemsUsed || reserveUsed) return 0;
    const cashback = Math.floor(amount * 0.05);
    return Math.min(cashback, 100);
}

getPaymentMethodDisplay(paymentMethod) {
    switch(paymentMethod) {
        case 'reserve_pay': return 'SabAI Pay Lite';
        case 'merchant_reserve_pay': return 'Reserve Pay (Merchant)';
        case 'gems': return 'SabAI Gems';
        case 'bank': return 'Bank Account';
        case 'gems_and_bank': return 'Gems + Bank';
        case 'gems_and_lite': return 'Gems + SabAI Pay Lite';
        case 'gems_and_merchant_reserve': return 'Gems + Reserve Pay';
        default: return 'Bank Transfer';
    }
}

    async processReservePayPayment(userId, scheduledOrder) {
        try {
            // Check reserve limit
            const limit = await dbService.getReserveLimit(userId, scheduledOrder.merchant);
            if (!limit) throw new Error('No reserve limit set');
            
            const remaining = limit.monthly_limit - (limit.current_spent || 0);
            if (scheduledOrder.totalAmount > remaining) {
                throw new Error(`Insufficient reserve limit. Available: ₹${remaining}`);
            }
            
            // Update reserve limit
            await dbService.updateReserveLimitSpent(userId, scheduledOrder.merchant, scheduledOrder.totalAmount);
            
            // Create transaction record
            const transactionId = `TXN_${Date.now()}`;
            await dbService.createTransaction({
                transaction_id: transactionId,
                user_id: userId,
                type: 'auto_pay_reserve',
                amount: scheduledOrder.totalAmount,
                status: 'success',
                description: `Auto-pay order to ${scheduledOrder.merchantName}`,
                merchant: scheduledOrder.merchant,
                reserve_used: scheduledOrder.totalAmount
            });
            
            return true;
        } catch (error) {
            console.error('Reserve pay payment failed:', error);
            return false;
        }
    }

    async processBankPayment(userId, scheduledOrder) {
        try {
            const bankAccount = await dbService.getBankAccountById(scheduledOrder.bankAccountId, userId);
            if (!bankAccount) throw new Error('Bank account not found');
            
            const currentBalance = bankAccount.balance || 0;
            if (scheduledOrder.totalAmount > currentBalance) {
                throw new Error(`Insufficient balance. Available: ₹${currentBalance}`);
            }
            
            // Update bank balance
            await dbService.updateBankBalance(scheduledOrder.bankAccountId, scheduledOrder.totalAmount, false);
            
            // Create transaction record
            const transactionId = `TXN_${Date.now()}`;
            await dbService.createTransaction({
                transaction_id: transactionId,
                user_id: userId,
                type: 'auto_pay_bank',
                amount: scheduledOrder.totalAmount,
                status: 'success',
                description: `Auto-pay order to ${scheduledOrder.merchantName}`,
                merchant: scheduledOrder.merchant,
                bank_account_id: scheduledOrder.bankAccountId,
                bank_used: scheduledOrder.totalAmount
            });
            
            return true;
        } catch (error) {
            console.error('Bank payment failed:', error);
            return false;
        }
    }

    async processGemsPayment(userId, scheduledOrder) {
        try {
            const coinBalance = await dbService.getCoinBalance(userId);
            if (scheduledOrder.totalAmount > coinBalance.balance) {
                throw new Error(`Insufficient SabAI Gems. Available: ${coinBalance.balance}`);
            }
            
            // Update gems balance
            await dbService.updateCoinBalance(userId, scheduledOrder.totalAmount, false);
            
            // Create transaction record
            const transactionId = `TXN_${Date.now()}`;
            await dbService.createTransaction({
                transaction_id: transactionId,
                user_id: userId,
                type: 'auto_pay_gems',
                amount: scheduledOrder.totalAmount,
                status: 'success',
                description: `Auto-pay order to ${scheduledOrder.merchantName}`,
                merchant: scheduledOrder.merchant,
                gems_used: scheduledOrder.totalAmount
            });
            
            return true;
        } catch (error) {
            console.error('Gems payment failed:', error);
            return false;
        }
    }

    async createOrderFromScheduled(userId, scheduledOrder, transactionId) {
        const orderId = `ORD_${Date.now()}`;
        const now = new Date();
        const deliveryTime = new Date(now.getTime() + 45 * 60000);
        
        const order = {
            id: orderId,
            userId: userId,
            merchant: scheduledOrder.merchant,
            merchantName: scheduledOrder.merchantName,
            items: scheduledOrder.items,
            totalAmount: scheduledOrder.totalAmount,
            status: 'confirmed',
            paymentMethod: scheduledOrder.paymentMethod,
            transactionId: transactionId,
            sabaiGems: Math.min(Math.floor(scheduledOrder.totalAmount * 0.05), 100),
            estimatedDelivery: '45 minutes',
            estimatedDeliveryTime: deliveryTime.toLocaleTimeString(),
            createdAt: now.toISOString(),
            tracking: [
                { status: 'confirmed', label: 'Order Confirmed', completed: true, time: now.toLocaleTimeString() },
                { status: 'preparing', label: 'Preparing', completed: false, estimatedTime: deliveryTime.toLocaleTimeString() },
                { status: 'out_for_delivery', label: 'Out for Delivery', completed: false },
                { status: 'delivered', label: 'Delivered', completed: false }
            ]
        };
        
        await dbService.createOrder(userId, order);
        return orderId;
    }

    async cancelScheduledOrder(orderId, userId) {
        const userOrders = this.scheduledOrders.get(userId) || [];
        const orderIndex = userOrders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            throw new Error('Scheduled order not found');
        }
        
        const order = userOrders[orderIndex];
        if (order.status !== 'scheduled') {
            throw new Error(`Cannot cancel order with status: ${order.status}`);
        }
        
        order.status = 'cancelled';
        order.cancelledAt = new Date().toISOString();
        
        await dbService.updateScheduledOrder(orderId, {
            status: 'cancelled',
            cancelled_at: order.cancelledAt
        });
        
        userOrders.splice(orderIndex, 1);
        
        await this.notifyUser(userId, {
            type: 'order_cancelled',
            message: `🗑️ Your scheduled order from ${order.merchantName} has been cancelled.`
        });
        
        return order;
    }

    async getUserScheduledOrders(userId) {
        return this.scheduledOrders.get(userId) || [];
    }

    async updatePaymentMethod(orderId, userId, newPaymentMethod, bankAccountId = null) {
        const userOrders = this.scheduledOrders.get(userId) || [];
        const order = userOrders.find(o => o.id === orderId);
        
        if (!order) throw new Error('Scheduled order not found');
        if (order.status !== 'scheduled') throw new Error('Cannot update payment method for non-scheduled order');
        
        order.paymentMethod = newPaymentMethod;
        if (bankAccountId) order.bankAccountId = bankAccountId;
        
        await dbService.updateScheduledOrder(orderId, {
            payment_method: newPaymentMethod,
            bank_account_id: bankAccountId
        });
        
        return order;
    }

    async notifyUser(userId, notification) {
        try {
            await dbService.saveNotification(userId, notification);
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
}

module.exports = new ScheduledOrderService();