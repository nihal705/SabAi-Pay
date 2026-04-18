// backend/controllers/transactionController.js
const dbStorage = require('../services/databaseStorageService');

// Helper to get user ID
const getUserId = (req) => {
    return req.user?.id ? String(req.user.id) : '4';
};

// Get all transactions with filters
const getAll = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { type, status, startDate, endDate, limit = 50, offset = 0 } = req.query;
        
        let transactions = await dbStorage.getItem('transactions', userId, []);
        
        // Apply filters
        if (type && type !== 'all') {
            transactions = transactions.filter(t => t.type === type);
        }
        if (status && status !== 'all') {
            transactions = transactions.filter(t => t.status === status);
        }
        if (startDate) {
            const start = new Date(startDate);
            transactions = transactions.filter(t => new Date(t.date) >= start);
        }
        if (endDate) {
            const end = new Date(endDate);
            transactions = transactions.filter(t => new Date(t.date) <= end);
        }
        
        // Sort by date descending
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Apply pagination
        const paginated = transactions.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        res.json({
            success: true,
            data: {
                transactions: paginated,
                total: transactions.length,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Get all transactions error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Search transactions
const search = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { q, limit = 50 } = req.query;
        
        if (!q) {
            return res.status(400).json({ success: false, message: 'Search query required' });
        }
        
        let transactions = await dbStorage.getItem('transactions', userId, []);
        
        const searchTerm = q.toLowerCase();
        const filtered = transactions.filter(t => 
            t.description?.toLowerCase().includes(searchTerm) ||
            t.merchant?.toLowerCase().includes(searchTerm) ||
            t.receiver_name?.toLowerCase().includes(searchTerm) ||
            t.transactionId?.toLowerCase().includes(searchTerm)
        );
        
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json({
            success: true,
            data: filtered.slice(0, parseInt(limit))
        });
    } catch (error) {
        console.error('Search transactions error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get transaction statistics
const getStats = async (req, res) => {
    try {
        const userId = getUserId(req);
        const transactions = await dbStorage.getItem('transactions', userId, []);
        
        const successful = transactions.filter(t => t.status === 'success');
        
        const totalSent = successful
            .filter(t => t.type === 'send' || t.type === 'bill' || t.type === 'recharge')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalReceived = successful
            .filter(t => t.type === 'receive')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalCashback = successful.reduce((sum, t) => sum + (t.cashback || 0), 0);
        
        const byMonth = {};
        successful.forEach(t => {
            const month = new Date(t.date).toLocaleString('default', { month: 'short', year: 'numeric' });
            byMonth[month] = (byMonth[month] || 0) + t.amount;
        });
        
        res.json({
            success: true,
            data: {
                totalSent: totalSent,
                totalReceived: totalReceived,
                totalCashback: totalCashback,
                totalTransactions: transactions.length,
                successfulTransactions: successful.length,
                failedTransactions: transactions.filter(t => t.status === 'failed').length,
                pendingTransactions: transactions.filter(t => t.status === 'pending').length,
                spendingByMonth: Object.entries(byMonth).map(([month, amount]) => ({ month, amount }))
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get transaction summary
const getSummary = async (req, res) => {
    try {
        const userId = getUserId(req);
        const transactions = await dbStorage.getItem('transactions', userId, []);
        
        const successful = transactions.filter(t => t.status === 'success');
        const last30Days = successful.filter(t => {
            const daysDiff = (new Date() - new Date(t.date)) / (1000 * 60 * 60 * 24);
            return daysDiff <= 30;
        });
        
        const totalSpentLast30Days = last30Days.reduce((sum, t) => sum + t.amount, 0);
        const cashbackLast30Days = last30Days.reduce((sum, t) => sum + (t.cashback || 0), 0);
        
        // Top merchants
        const merchantMap = {};
        successful.forEach(t => {
            const merchant = t.merchant || t.provider || t.receiver_name;
            if (merchant) {
                merchantMap[merchant] = (merchantMap[merchant] || 0) + t.amount;
            }
        });
        const topMerchants = Object.entries(merchantMap)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
        
        res.json({
            success: true,
            data: {
                totalSpentLast30Days: totalSpentLast30Days,
                cashbackLast30Days: cashbackLast30Days,
                transactionCount: successful.length,
                topMerchants: topMerchants
            }
        });
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Download transaction report
const downloadReport = async (req, res) => {
    try {
        const userId = getUserId(req);
        const transactions = await dbStorage.getItem('transactions', userId, []);
        
        const report = {
            generatedAt: new Date().toISOString(),
            userId: userId,
            totalTransactions: transactions.length,
            transactions: transactions.map(t => ({
                id: t.transactionId,
                date: t.date,
                type: t.type,
                amount: t.amount,
                status: t.status,
                description: t.description,
                cashback: t.cashback || 0
            }))
        };
        
        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Download report error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get single transaction
const getOne = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { transaction_id } = req.params;
        
        const transactions = await dbStorage.getItem('transactions', userId, []);
        const transaction = transactions.find(t => t.transactionId === transaction_id);
        
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        res.json({ success: true, data: transaction });
    } catch (error) {
        console.error('Get one transaction error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get recurring bills
const getRecurringBills = async (req, res) => {
    try {
        const userId = getUserId(req);
        const recurringBills = await dbStorage.getItem('recurringBills', userId, []);
        res.json({ success: true, data: recurringBills });
    } catch (error) {
        console.error('Get recurring bills error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Add recurring bill
const addRecurringBill = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { billType, provider, customerId, amount, dueDate, autoPay } = req.body;
        
        if (!billType || !provider || !customerId || !amount) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        const recurringBills = await dbStorage.getItem('recurringBills', userId, []);
        
        const newBill = {
            id: Date.now(),
            bill_type: billType,
            provider: provider,
            customer_id: customerId,
            amount: parseFloat(amount),
            due_date: dueDate,
            auto_pay: autoPay || false,
            is_active: true,
            created_at: new Date().toISOString()
        };
        
        recurringBills.push(newBill);
        await dbStorage.setItem('recurringBills', recurringBills, userId);
        
        res.json({ success: true, data: newBill, message: 'Recurring bill added' });
    } catch (error) {
        console.error('Add recurring bill error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Delete recurring bill
const deleteRecurringBill = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { bill_id } = req.params;
        
        let recurringBills = await dbStorage.getItem('recurringBills', userId, []);
        recurringBills = recurringBills.filter(b => b.id !== parseInt(bill_id));
        await dbStorage.setItem('recurringBills', recurringBills, userId);
        
        res.json({ success: true, message: 'Recurring bill deleted' });
    } catch (error) {
        console.error('Delete recurring bill error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAll,
    search,
    getStats,
    getSummary,
    downloadReport,
    getOne,
    getRecurringBills,
    addRecurringBill,
    deleteRecurringBill
};