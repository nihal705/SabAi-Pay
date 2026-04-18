// backend/controllers/reserveController.js
const dbStorage = require('../services/databaseStorageService');

// Helper to get user ID
const getUserId = (req) => {
    return req.user?.id ? String(req.user.id) : '4';
};

// Set monthly limit for merchant
const setLimit = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { merchant, merchantCategory, monthlyLimit, perTransactionLimit, requiresApproval } = req.body;
        
        if (!merchant || !monthlyLimit) {
            return res.status(400).json({ success: false, message: 'Merchant and monthly limit required' });
        }
        
        let limits = await dbStorage.getItem('reserveLimits', userId, []);
        
        const existingIndex = limits.findIndex(l => l.merchant === merchant);
        
        const newLimit = {
            id: existingIndex !== -1 ? limits[existingIndex].id : Date.now(),
            merchant: merchant,
            merchant_name: merchant.charAt(0).toUpperCase() + merchant.slice(1),
            merchant_category: merchantCategory || 'others',
            monthly_limit: parseFloat(monthlyLimit),
            current_spent: existingIndex !== -1 ? limits[existingIndex].current_spent : 0,
            per_transaction_limit: perTransactionLimit ? parseFloat(perTransactionLimit) : null,
            requires_approval: requiresApproval || false,
            is_active: true,
            contributions: existingIndex !== -1 ? limits[existingIndex].contributions : [],
            created_at: existingIndex !== -1 ? limits[existingIndex].created_at : new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        if (existingIndex !== -1) {
            limits[existingIndex] = newLimit;
        } else {
            limits.push(newLimit);
        }
        
        await dbStorage.setItem('reserveLimits', limits, userId);
        
        res.json({
            success: true,
            data: newLimit,
            message: `Limit set for ${merchant}`
        });
    } catch (error) {
        console.error('Set limit error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get all limits
const getLimits = async (req, res) => {
    try {
        const userId = getUserId(req);
        const limits = await dbStorage.getItem('reserveLimits', userId, []);
        res.json({ success: true, data: limits });
    } catch (error) {
        console.error('Get limits error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get limit for specific merchant
const getMerchantLimit = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { merchant } = req.params;
        
        const limits = await dbStorage.getItem('reserveLimits', userId, []);
        const limit = limits.find(l => l.merchant === merchant);
        
        if (!limit) {
            return res.status(404).json({ success: false, message: 'Limit not found' });
        }
        
        res.json({ success: true, data: limit });
    } catch (error) {
        console.error('Get merchant limit error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update limit
const updateLimit = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { merchant } = req.params;
        const { monthlyLimit, perTransactionLimit, requiresApproval, isActive } = req.body;
        
        let limits = await dbStorage.getItem('reserveLimits', userId, []);
        const index = limits.findIndex(l => l.merchant === merchant);
        
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Limit not found' });
        }
        
        if (monthlyLimit !== undefined) limits[index].monthly_limit = parseFloat(monthlyLimit);
        if (perTransactionLimit !== undefined) limits[index].per_transaction_limit = perTransactionLimit ? parseFloat(perTransactionLimit) : null;
        if (requiresApproval !== undefined) limits[index].requires_approval = requiresApproval;
        if (isActive !== undefined) limits[index].is_active = isActive;
        
        limits[index].updated_at = new Date().toISOString();
        
        await dbStorage.setItem('reserveLimits', limits, userId);
        
        res.json({
            success: true,
            data: limits[index],
            message: `Limit updated for ${merchant}`
        });
    } catch (error) {
        console.error('Update limit error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Delete limit
const deleteLimit = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { merchant } = req.params;
        
        let limits = await dbStorage.getItem('reserveLimits', userId, []);
        const filtered = limits.filter(l => l.merchant !== merchant);
        
        await dbStorage.setItem('reserveLimits', filtered, userId);
        
        res.json({ success: true, message: `Limit deleted for ${merchant}` });
    } catch (error) {
        console.error('Delete limit error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Toggle limit active status
const toggleLimit = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { merchant } = req.params;
        
        let limits = await dbStorage.getItem('reserveLimits', userId, []);
        const index = limits.findIndex(l => l.merchant === merchant);
        
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Limit not found' });
        }
        
        limits[index].is_active = !limits[index].is_active;
        limits[index].updated_at = new Date().toISOString();
        
        await dbStorage.setItem('reserveLimits', limits, userId);
        
        res.json({
            success: true,
            data: limits[index],
            message: `Limit ${limits[index].is_active ? 'activated' : 'deactivated'} for ${merchant}`
        });
    } catch (error) {
        console.error('Toggle limit error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Bulk set limits
const bulkSetLimits = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { limits: newLimits } = req.body;
        
        if (!Array.isArray(newLimits)) {
            return res.status(400).json({ success: false, message: 'Limits must be an array' });
        }
        
        let existingLimits = await dbStorage.getItem('reserveLimits', userId, []);
        
        for (const newLimit of newLimits) {
            const index = existingLimits.findIndex(l => l.merchant === newLimit.merchant);
            
            const limitData = {
                id: index !== -1 ? existingLimits[index].id : Date.now(),
                merchant: newLimit.merchant,
                merchant_name: newLimit.merchant_name || newLimit.merchant.charAt(0).toUpperCase() + newLimit.merchant.slice(1),
                merchant_category: newLimit.merchant_category || 'others',
                monthly_limit: parseFloat(newLimit.monthly_limit),
                current_spent: index !== -1 ? existingLimits[index].current_spent : 0,
                per_transaction_limit: newLimit.per_transaction_limit ? parseFloat(newLimit.per_transaction_limit) : null,
                requires_approval: newLimit.requires_approval || false,
                is_active: newLimit.is_active !== false,
                contributions: index !== -1 ? existingLimits[index].contributions : [],
                created_at: index !== -1 ? existingLimits[index].created_at : new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            if (index !== -1) {
                existingLimits[index] = limitData;
            } else {
                existingLimits.push(limitData);
            }
        }
        
        await dbStorage.setItem('reserveLimits', existingLimits, userId);
        
        res.json({
            success: true,
            data: existingLimits,
            message: `${newLimits.length} limits updated successfully`
        });
    } catch (error) {
        console.error('Bulk set limits error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Check if payment can be auto-approved
const checkPayment = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { merchant, amount } = req.body;
        
        const limits = await dbStorage.getItem('reserveLimits', userId, []);
        const limit = limits.find(l => l.merchant === merchant);
        
        if (!limit || !limit.is_active) {
            return res.json({
                success: true,
                data: {
                    eligible: false,
                    reason: 'No active limit found for this merchant',
                    remaining: 0
                }
            });
        }
        
        const remaining = limit.monthly_limit - limit.current_spent;
        const eligible = amount <= remaining;
        
        if (!eligible) {
            return res.json({
                success: true,
                data: {
                    eligible: false,
                    reason: `Insufficient limit. Remaining: ₹${remaining}`,
                    remaining: remaining
                }
            });
        }
        
        if (limit.per_transaction_limit && amount > limit.per_transaction_limit) {
            return res.json({
                success: true,
                data: {
                    eligible: false,
                    reason: `Amount exceeds per-transaction limit of ₹${limit.per_transaction_limit}`,
                    remaining: remaining
                }
            });
        }
        
        res.json({
            success: true,
            data: {
                eligible: true,
                remaining: remaining,
                limit: limit.monthly_limit,
                spent: limit.current_spent
            }
        });
    } catch (error) {
        console.error('Check payment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get spending summary
const getSummary = async (req, res) => {
    try {
        const userId = getUserId(req);
        const limits = await dbStorage.getItem('reserveLimits', userId, []);
        
        const totalLimit = limits.reduce((sum, l) => sum + l.monthly_limit, 0);
        const totalSpent = limits.reduce((sum, l) => sum + l.current_spent, 0);
        const totalRemaining = totalLimit - totalSpent;
        
        const activeLimits = limits.filter(l => l.is_active).length;
        const exhaustedLimits = limits.filter(l => l.current_spent >= l.monthly_limit).length;
        
        res.json({
            success: true,
            data: {
                totalLimit: totalLimit,
                totalSpent: totalSpent,
                totalRemaining: totalRemaining,
                activeLimits: activeLimits,
                exhaustedLimits: exhaustedLimits,
                totalMerchants: limits.length
            }
        });
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get spending by merchant
const getSpendingByMerchant = async (req, res) => {
    try {
        const userId = getUserId(req);
        const limits = await dbStorage.getItem('reserveLimits', userId, []);
        
        const spending = limits.map(l => ({
            merchant: l.merchant,
            merchant_name: l.merchant_name,
            category: l.merchant_category,
            spent: l.current_spent,
            limit: l.monthly_limit,
            percentage: (l.current_spent / l.monthly_limit) * 100
        }));
        
        spending.sort((a, b) => b.spent - a.spent);
        
        res.json({ success: true, data: spending });
    } catch (error) {
        console.error('Get spending by merchant error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get available merchants
const getAvailableMerchants = async (req, res) => {
    try {
        const merchants = [
            { id: 'swiggy', name: 'Swiggy', category: 'food', logo: '/images/merchants/swiggy.png' },
            { id: 'zomato', name: 'Zomato', category: 'food', logo: '/images/merchants/zomato.png' },
            { id: 'zepto', name: 'Zepto', category: 'groceries', logo: '/images/merchants/zepto.png' },
            { id: 'blinkit', name: 'Blinkit', category: 'groceries', logo: '/images/merchants/blinkit.png' },
            { id: 'amazon', name: 'Amazon', category: 'shopping', logo: '/images/merchants/amazon.png' },
            { id: 'flipkart', name: 'Flipkart', category: 'shopping', logo: '/images/merchants/flipkart.png' },
            { id: 'myntra', name: 'Myntra', category: 'fashion', logo: '/images/merchants/myntra.png' },
            { id: 'netmeds', name: 'NetMeds', category: 'healthcare', logo: '/images/merchants/netmeds.png' },
            { id: 'pharmeasy', name: 'PharmEasy', category: 'healthcare', logo: '/images/merchants/pharmeasy.png' }
        ];
        
        res.json({ success: true, data: merchants });
    } catch (error) {
        console.error('Get available merchants error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    setLimit,
    getLimits,
    getMerchantLimit,
    updateLimit,
    deleteLimit,
    toggleLimit,
    bulkSetLimits,
    checkPayment,
    getSummary,
    getSpendingByMerchant,
    getAvailableMerchants
};