// backend/services/orderService.js
// Persistent order management with file-based storage

const fs = require('fs').promises;
const path = require('path');

class OrderService {
    constructor() {
        this.storagePath = path.join(__dirname, '../data/orders.json');
        this.orders = new Map(); // userId -> [orders]
        this.orderById = new Map(); // orderId -> order
        this.loadFromStorage();
    }

    async loadFromStorage() {
        try {
            // Check if file exists
            try {
                await fs.access(this.storagePath);
            } catch {
                console.log('📁 No existing orders file found, creating new one...');
                await this.saveToStorage();
                return;
            }

            const data = await fs.readFile(this.storagePath, 'utf8');
            const stored = JSON.parse(data);
            
            // Restore orders Map
            if (stored.ordersData) {
                this.orders = new Map();
                Object.keys(stored.ordersData).forEach(userId => {
                    this.orders.set(userId, stored.ordersData[userId]);
                });
            }
            
            // Restore orderById Map
            if (stored.orderByIdData) {
                this.orderById = new Map();
                Object.keys(stored.orderByIdData).forEach(orderId => {
                    this.orderById.set(orderId, stored.orderByIdData[orderId]);
                });
            }
            
            console.log(`✅ Loaded ${this.orderById.size} orders from file`);
            console.log(`👤 Users with orders: ${this.orders.size}`);
        } catch (error) {
            console.error('❌ Error loading orders:', error.message);
            // Initialize empty storage
            this.orders = new Map();
            this.orderById = new Map();
            await this.saveToStorage();
        }
    }

    async saveToStorage() {
        try {
            const ordersData = {};
            this.orders.forEach((value, key) => {
                ordersData[key] = value;
            });
            
            const orderByIdData = {};
            this.orderById.forEach((value, key) => {
                orderByIdData[key] = value;
            });
            
            const storageData = { ordersData, orderByIdData };
            await fs.writeFile(this.storagePath, JSON.stringify(storageData, null, 2), 'utf8');
            console.log(`✅ Saved ${this.orderById.size} orders to file`);
        } catch (error) {
            console.error('❌ Error saving orders:', error.message);
        }
    }

    async saveOrder(userId, orderData) {
        try {
            const orderId = orderData.id;
            
            // Round all prices to 2 decimals
            const roundedItems = (orderData.items || []).map(item => ({
                ...item,
                price: Math.round(item.price * 100) / 100,
                total: Math.round(item.total * 100) / 100
            }));
            
            const order = {
                id: orderId,
                userId: String(userId),
                ...orderData,
                items: roundedItems,
                totalAmount: Math.round((orderData.totalAmount || 0) * 100) / 100,
                createdAt: orderData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Store by ID
            this.orderById.set(orderId, order);
            
            // Store in user's order list
            const userIdStr = String(userId);
            if (!this.orders.has(userIdStr)) {
                this.orders.set(userIdStr, []);
            }
            
            const userOrders = this.orders.get(userIdStr);
            const existingIndex = userOrders.findIndex(o => o.id === orderId);
            
            if (existingIndex >= 0) {
                userOrders[existingIndex] = order;
            } else {
                userOrders.unshift(order);
            }
            
            // Keep last 100 orders per user
            this.orders.set(userIdStr, userOrders.slice(0, 100));
            
            // Save to file
            await this.saveToStorage();
            
            console.log(`✅ Order saved: ${orderId} for user ${userIdStr}`);
            console.log(`📦 User now has ${userOrders.length} orders`);
            
            return order;
            
        } catch (error) {
            console.error('❌ Error saving order:', error);
            throw error;
        }
    }

    async getUserOrders(userId) {
        try {
            const userIdStr = String(userId);
            console.log(`🔍 OrderService: Getting orders for user "${userIdStr}"`);
            
            // Get from Map
            const userOrders = this.orders.get(userIdStr) || [];
            console.log(`📦 OrderService: Found ${userOrders.length} orders for user "${userIdStr}"`);
            
            // Sort by createdAt descending (newest first)
            userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            return userOrders;
        } catch (error) {
            console.error('❌ OrderService error getting user orders:', error);
            return [];
        }
    }

    async getOrder(orderId) {
        try {
            return this.orderById.get(orderId) || null;
        } catch (error) {
            console.error('❌ Error getting order:', error);
            return null;
        }
    }

    async updateOrderStatus(orderId, status, tracking = null) {
        try {
            const order = this.orderById.get(orderId);
            if (!order) return null;
            
            order.status = status;
            if (tracking) order.tracking = tracking;
            order.updatedAt = new Date().toISOString();
            
            this.orderById.set(orderId, order);
            
            // Update in user's order list
            const userId = order.userId;
            if (this.orders.has(userId)) {
                const userOrders = this.orders.get(userId);
                const index = userOrders.findIndex(o => o.id === orderId);
                if (index >= 0) {
                    userOrders[index] = order;
                    this.orders.set(userId, userOrders);
                }
            }
            
            await this.saveToStorage();
            return order;
            
        } catch (error) {
            console.error('❌ Error updating order:', error);
            return null;
        }
    }

    async deleteOrder(orderId) {
        try {
            const order = this.orderById.get(orderId);
            if (!order) return false;
            
            this.orderById.delete(orderId);
            
            const userId = order.userId;
            if (this.orders.has(userId)) {
                const userOrders = this.orders.get(userId).filter(o => o.id !== orderId);
                this.orders.set(userId, userOrders);
            }
            
            await this.saveToStorage();
            console.log(`✅ Order deleted: ${orderId}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting order:', error);
            return false;
        }
    }

    // Get all orders for a user with optional filtering
    async getUserOrdersWithFilter(userId, filter = {}) {
        try {
            let orders = await this.getUserOrders(userId);
            
            // Filter by status if provided
            if (filter.status) {
                orders = orders.filter(order => order.status === filter.status);
            }
            
            // Filter by date range if provided
            if (filter.startDate) {
                const start = new Date(filter.startDate);
                orders = orders.filter(order => new Date(order.createdAt) >= start);
            }
            
            if (filter.endDate) {
                const end = new Date(filter.endDate);
                orders = orders.filter(order => new Date(order.createdAt) <= end);
            }
            
            return orders;
        } catch (error) {
            console.error('❌ Error filtering orders:', error);
            return [];
        }
    }

    async saveOrder(userId, orderData) {
    try {
        const orders = await this.getUserOrders(userId);
        const existingIndex = orders.findIndex(o => o.id === orderData.id);
        
        if (existingIndex !== -1) {
            orders[existingIndex] = orderData;
        } else {
            orders.unshift(orderData);
        }
        
        // Save to localStorage as backup
        localStorage.setItem(`agentOrders_${userId}`, JSON.stringify(orders));
        
        // Try to save to database
        try {
            const dbService = require('./databaseService');
            await dbService.createAgentOrder(userId, orderData);
        } catch (dbError) {
            console.log('Database save failed, using localStorage');
        }
        
        return orderData;
    } catch (error) {
        console.error('Save order error:', error);
        return orderData;
    }
}

    // Get order count for a user
    async getOrderCount(userId) {
        try {
            const orders = await this.getUserOrders(userId);
            return orders.length;
        } catch (error) {
            console.error('❌ Error getting order count:', error);
            return 0;
        }
    }

    // Get total spent by user
    async getTotalSpent(userId) {
        try {
            const orders = await this.getUserOrders(userId);
            const total = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            return Math.round(total * 100) / 100;
        } catch (error) {
            console.error('❌ Error calculating total spent:', error);
            return 0;
        }
    }
}

module.exports = new OrderService();