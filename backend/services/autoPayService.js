// backend/services/autoPayService.js
// Auto-Pay Service for recurring orders

const fs = require('fs').promises;
const path = require('path');

class AutoPayService {
    constructor() {
        this.storagePath = path.join(__dirname, '../data/autoPayOrders.json');
        this.autoPayOrders = new Map(); // userId -> [orders]
        this.autoPayById = new Map(); // orderId -> order
        this.loadFromStorage();
        
        // Start scheduler
        this.startScheduler();
    }

    async loadFromStorage() {
        try {
            try {
                await fs.access(this.storagePath);
            } catch {
                console.log('📁 No existing Auto-Pay file found, creating new one...');
                await this.saveToStorage();
                return;
            }

            const data = await fs.readFile(this.storagePath, 'utf8');
            const stored = JSON.parse(data);
            
            if (stored.autoPayOrdersData) {
                this.autoPayOrders = new Map();
                Object.keys(stored.autoPayOrdersData).forEach(userId => {
                    this.autoPayOrders.set(userId, stored.autoPayOrdersData[userId]);
                });
            }
            
            if (stored.autoPayByIdData) {
                this.autoPayById = new Map();
                Object.keys(stored.autoPayByIdData).forEach(orderId => {
                    this.autoPayById.set(orderId, stored.autoPayByIdData[orderId]);
                });
            }
            
            console.log(`✅ Loaded ${this.autoPayById.size} Auto-Pay orders`);
        } catch (error) {
            console.error('❌ Error loading Auto-Pay orders:', error.message);
            this.autoPayOrders = new Map();
            this.autoPayById = new Map();
            await this.saveToStorage();
        }
    }

    async saveToStorage() {
        try {
            const autoPayOrdersData = {};
            this.autoPayOrders.forEach((value, key) => {
                autoPayOrdersData[key] = value;
            });
            
            const autoPayByIdData = {};
            this.autoPayById.forEach((value, key) => {
                autoPayByIdData[key] = value;
            });
            
            const storageData = { autoPayOrdersData, autoPayByIdData };
            await fs.writeFile(this.storagePath, JSON.stringify(storageData, null, 2), 'utf8');
            console.log(`✅ Saved ${this.autoPayById.size} Auto-Pay orders to file`);
        } catch (error) {
            console.error('❌ Error saving Auto-Pay orders:', error.message);
        }
    }

    async createAutoPayOrder(orderData) {
        try {
            const orderId = `AUTO_${Date.now()}`;
            const now = new Date().toISOString();
            
            const autoPayOrder = {
                id: orderId,
                ...orderData,
                createdAt: now,
                updatedAt: now,
                lastExecuted: null,
                nextExecution: this.calculateNextExecution(orderData.schedule, orderData.dayOfMonth),
                executionHistory: []
            };
            
            // Store by ID
            this.autoPayById.set(orderId, autoPayOrder);
            
            // Store in user's order list
            const userIdStr = String(orderData.userId);
            if (!this.autoPayOrders.has(userIdStr)) {
                this.autoPayOrders.set(userIdStr, []);
            }
            
            const userOrders = this.autoPayOrders.get(userIdStr);
            userOrders.push(autoPayOrder);
            this.autoPayOrders.set(userIdStr, userOrders);
            
            await this.saveToStorage();
            
            console.log(`✅ Auto-Pay order created: ${orderId} for user ${userIdStr}`);
            return autoPayOrder;
            
        } catch (error) {
            console.error('❌ Error creating Auto-Pay order:', error);
            throw error;
        }
    }

    calculateNextExecution(schedule, dayOfMonth) {
        const today = new Date();
        let nextDate;
        
        if (schedule === 'monthly') {
            nextDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
            if (nextDate < today) {
                nextDate = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
            }
        } else if (schedule === 'weekly') {
            // Weekly schedule logic
            nextDate = new Date(today);
            nextDate.setDate(today.getDate() + 7);
        } else {
            // Default to monthly
            nextDate = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
        }
        
        return nextDate.toISOString();
    }

    async getAutoPayOrders(userId) {
        try {
            const userIdStr = String(userId);
            return this.autoPayOrders.get(userIdStr) || [];
        } catch (error) {
            console.error('❌ Error getting Auto-Pay orders:', error);
            return [];
        }
    }

    async getAutoPayOrder(orderId) {
        try {
            return this.autoPayById.get(orderId) || null;
        } catch (error) {
            console.error('❌ Error getting Auto-Pay order:', error);
            return null;
        }
    }

    async pauseAutoPayOrder(orderId) {
        try {
            const order = this.autoPayById.get(orderId);
            if (!order) return null;
            
            order.isActive = false;
            order.updatedAt = new Date().toISOString();
            
            this.autoPayById.set(orderId, order);
            
            // Update in user's list
            const userId = order.userId;
            if (this.autoPayOrders.has(userId)) {
                const userOrders = this.autoPayOrders.get(userId);
                const index = userOrders.findIndex(o => o.id === orderId);
                if (index >= 0) {
                    userOrders[index] = order;
                    this.autoPayOrders.set(userId, userOrders);
                }
            }
            
            await this.saveToStorage();
            return order;
            
        } catch (error) {
            console.error('❌ Error pausing Auto-Pay order:', error);
            return null;
        }
    }

    async resumeAutoPayOrder(orderId) {
        try {
            const order = this.autoPayById.get(orderId);
            if (!order) return null;
            
            order.isActive = true;
            order.updatedAt = new Date().toISOString();
            
            this.autoPayById.set(orderId, order);
            
            // Update in user's list
            const userId = order.userId;
            if (this.autoPayOrders.has(userId)) {
                const userOrders = this.autoPayOrders.get(userId);
                const index = userOrders.findIndex(o => o.id === orderId);
                if (index >= 0) {
                    userOrders[index] = order;
                    this.autoPayOrders.set(userId, userOrders);
                }
            }
            
            await this.saveToStorage();
            return order;
            
        } catch (error) {
            console.error('❌ Error resuming Auto-Pay order:', error);
            return null;
        }
    }

    async deleteAutoPayOrder(orderId) {
        try {
            const order = this.autoPayById.get(orderId);
            if (!order) return false;
            
            this.autoPayById.delete(orderId);
            
            const userId = order.userId;
            if (this.autoPayOrders.has(userId)) {
                const userOrders = this.autoPayOrders.get(userId).filter(o => o.id !== orderId);
                this.autoPayOrders.set(userId, userOrders);
            }
            
            await this.saveToStorage();
            console.log(`✅ Auto-Pay order deleted: ${orderId}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting Auto-Pay order:', error);
            return false;
        }
    }

    async updateBankAccount(orderId, bankAccountId) {
        try {
            const order = this.autoPayById.get(orderId);
            if (!order) return null;
            
            order.bankAccountId = bankAccountId;
            order.updatedAt = new Date().toISOString();
            
            this.autoPayById.set(orderId, order);
            
            // Update in user's list
            const userId = order.userId;
            if (this.autoPayOrders.has(userId)) {
                const userOrders = this.autoPayOrders.get(userId);
                const index = userOrders.findIndex(o => o.id === orderId);
                if (index >= 0) {
                    userOrders[index] = order;
                    this.autoPayOrders.set(userId, userOrders);
                }
            }
            
            await this.saveToStorage();
            return order;
            
        } catch (error) {
            console.error('❌ Error updating bank account:', error);
            return null;
        }
    }

    startScheduler() {
        // Check every hour for orders to process
        setInterval(() => {
            this.processDueOrders();
        }, 60 * 60 * 1000);
        
        console.log('🕐 Auto-Pay scheduler started');
    }

    async processDueOrders() {
        try {
            const now = new Date();
            const dueOrders = [];
            
            // Find all active orders that are due
            for (const [orderId, order] of this.autoPayById) {
                if (order.isActive && order.nextExecution) {
                    const nextDate = new Date(order.nextExecution);
                    if (nextDate <= now) {
                        dueOrders.push(order);
                    }
                }
            }
            
            console.log(`🔄 Processing ${dueOrders.length} due Auto-Pay orders`);
            
            for (const order of dueOrders) {
                await this.executeAutoPayOrder(order);
            }
            
        } catch (error) {
            console.error('❌ Error processing due orders:', error);
        }
    }

    async executeAutoPayOrder(order) {
        try {
            console.log(`💰 Executing Auto-Pay order: ${order.id}`);
            
            // Check if user has sufficient balance
            const hasSufficientBalance = await this.checkBankBalance(order.userId, order.bankAccountId, order.totalAmount);
            
            if (!hasSufficientBalance) {
                // Mark order as failed and deactivate
                order.isActive = false;
                order.lastError = 'Insufficient balance';
                order.executionHistory.push({
                    date: new Date().toISOString(),
                    status: 'failed',
                    error: 'Insufficient balance'
                });
                
                this.autoPayById.set(order.id, order);
                await this.saveToStorage();
                
                console.log(`⚠️ Auto-Pay order ${order.id} failed: Insufficient balance`);
                return;
            }
            
            // Deduct amount from bank account
            await this.deductAmount(order.userId, order.bankAccountId, order.totalAmount);
            
            // Create the actual order
            const orderService = require('./orderService');
            const newOrder = {
                id: `ORD_${Date.now()}`,
                userId: order.userId,
                merchant: order.merchant,
                merchantName: order.merchantName || order.merchant,
                items: order.items,
                totalAmount: order.totalAmount,
                status: 'confirmed',
                paymentMethod: 'Auto Pay',
                autoPayId: order.id,
                createdAt: new Date().toISOString()
            };
            
            await orderService.saveOrder(order.userId, newOrder);
            
            // Update Auto-Pay order
            order.lastExecuted = new Date().toISOString();
            order.nextExecution = this.calculateNextExecution(order.schedule, order.dayOfMonth);
            order.executionHistory.push({
                date: new Date().toISOString(),
                status: 'success',
                orderId: newOrder.id
            });
            
            this.autoPayById.set(order.id, order);
            await this.saveToStorage();
            
            console.log(`✅ Auto-Pay order ${order.id} executed successfully`);
            
        } catch (error) {
            console.error(`❌ Error executing Auto-Pay order ${order.id}:`, error);
            
            order.lastError = error.message;
            order.executionHistory.push({
                date: new Date().toISOString(),
                status: 'failed',
                error: error.message
            });
            
            this.autoPayById.set(order.id, order);
            await this.saveToStorage();
        }
    }

    async checkBankBalance(userId, bankAccountId, amount) {
        // This should integrate with your bank balance service
        try {
            const balances = JSON.parse(localStorage.getItem(`bankBalances_${userId}`) || '{}');
            const balance = balances[bankAccountId] || 0;
            return balance >= amount;
        } catch (error) {
            console.error('Error checking balance:', error);
            return false;
        }
    }

    async deductAmount(userId, bankAccountId, amount) {
        // This should integrate with your bank balance service
        try {
            const balances = JSON.parse(localStorage.getItem(`bankBalances_${userId}`) || '{}');
            const currentBalance = balances[bankAccountId] || 0;
            balances[bankAccountId] = currentBalance - amount;
            localStorage.setItem(`bankBalances_${userId}`, JSON.stringify(balances));
            return true;
        } catch (error) {
            console.error('Error deducting amount:', error);
            throw error;
        }
    }

    async getAutoPayHistory(orderId) {
        try {
            const order = this.autoPayById.get(orderId);
            if (!order) return [];
            return order.executionHistory || [];
        } catch (error) {
            console.error('Error getting Auto-Pay history:', error);
            return [];
        }
    }

    async getAllAutoPayOrders() {
        try {
            const allOrders = [];
            for (const [userId, orders] of this.autoPayOrders) {
                allOrders.push(...orders);
            }
            return allOrders;
        } catch (error) {
            console.error('Error getting all orders:', error);
            return [];
        }
    }
}

module.exports = new AutoPayService();