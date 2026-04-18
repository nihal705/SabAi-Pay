// frontend/src/services/storageService.js
// COMPLETE REWRITE - All data goes to backend database

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper to handle API responses
const handleResponse = async (apiCall) => {
    try {
        const response = await apiCall;
        if (response.data && response.data.success) {
            return response.data.data;
        }
        throw new Error(response?.data?.message || 'Request failed');
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// ============ USER ID MANAGEMENT ============
let currentUserId = null;

export const setCurrentUserId = (userId) => {
    currentUserId = userId;
    if (userId) {
        localStorage.setItem('currentUserId', userId);
    }
};

export const getCurrentUserId = () => {
    if (currentUserId) return currentUserId;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || null;
};

export const refreshCurrentUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
        currentUserId = user.id;
    }
    return currentUserId;
};

export const clearUserCache = () => {
    const cacheKeys = [
        'cached_bankAccounts', 'cached_bankBalances', 'cached_coinBalance',
        'cached_transactions', 'cached_bills', 'cached_reserveLimits',
        'cached_autoPayOrders', 'cached_contacts'
    ];
    cacheKeys.forEach(key => localStorage.removeItem(key));
    clearPinCache();
};

// ============ PIN CACHE MANAGEMENT ============
let pinStatusCache = new Map();
let pinCacheTimestamp = new Map();
const PIN_CACHE_TTL = 5000;

export const clearPinCache = (accountId) => {
    if (accountId) {
        pinStatusCache.delete(accountId);
        pinCacheTimestamp.delete(accountId);
    } else {
        pinStatusCache.clear();
        pinCacheTimestamp.clear();
    }
};

// ============ BANK ACCOUNTS ============

export const getBankAccounts = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/bank/accounts`, { headers: getAuthHeaders() });
        if (response.data.success) {
            localStorage.setItem('cached_bankAccounts', JSON.stringify(response.data.data));
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error('Failed to get bank accounts:', error);
        const cached = localStorage.getItem('cached_bankAccounts');
        return cached ? JSON.parse(cached) : [];
    }
};

export const addBankAccount = async (accountData) => {
    return handleResponse(() => 
        axios.post(`${API_BASE_URL}/bank/accounts`, accountData, { headers: getAuthHeaders() })
    );
};

export const deleteBankAccount = async (accountId) => {
    await axios.delete(`${API_BASE_URL}/bank/accounts/${accountId}`, { headers: getAuthHeaders() });
    localStorage.removeItem('cached_bankAccounts');
    clearPinCache(accountId);
    return true;
};

export const setPrimaryBankAccount = async (accountId) => {
    await axios.put(`${API_BASE_URL}/bank/accounts/${accountId}/primary`, {}, { headers: getAuthHeaders() });
    localStorage.removeItem('cached_bankAccounts');
    return true;
};

// ============ BANK BALANCES ============

export const getBankBalances = async () => {
    try {
        const accounts = await getBankAccounts();
        const balances = {};
        for (const account of accounts) {
            const response = await axios.get(`${API_BASE_URL}/bank/balance/${account.id}`, { headers: getAuthHeaders() });
            if (response.data.success) {
                balances[account.id] = response.data.data.balance;
            }
        }
        localStorage.setItem('cached_bankBalances', JSON.stringify(balances));
        return balances;
    } catch (error) {
        console.error('Failed to get bank balances:', error);
        const cached = localStorage.getItem('cached_bankBalances');
        return cached ? JSON.parse(cached) : {};
    }
};

export const updateBankBalance = async (accountId, amount, isDeposit = true) => {
    try {
        const endpoint = isDeposit ? `${API_BASE_URL}/bank/deposit` : `${API_BASE_URL}/bank/withdraw`;
        const response = await axios.post(endpoint, { accountId, amount }, { headers: getAuthHeaders() });
        if (response.data && response.data.success) {
            localStorage.removeItem('cached_bankBalances');
            return response.data.data.balance;
        }
        throw new Error(response.data?.message || 'Transaction failed');
    } catch (error) {
        console.error('Update bank balance error:', error);
        // Don't throw for PIN errors, just return current balance
        if (error.response?.status === 401) {
            return null;
        }
        throw error;
    }
};

// ============ BANK UPI PINS ============

export const setBankUpiPin = async (bankAccountId, pin) => {
    return handleResponse(() => 
        axios.post(`${API_BASE_URL}/bank/accounts/${bankAccountId}/pin`, { pin }, { headers: getAuthHeaders() })
    );
};

export const verifyBankPin = async (bankAccountId, pin) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/bank/verify-pin`, 
            { accountId: bankAccountId, pin }, 
            { headers: getAuthHeaders() }
        );
        return response.data.success;
    } catch (error) {
        console.error('PIN verification error:', error.response?.data || error.message);
        // Return false for any error (401, 500, etc.)
        return false;
    }
};
export const hasUpiPin = async (bankAccountId) => {
    const cached = pinStatusCache.get(bankAccountId);
    const timestamp = pinCacheTimestamp.get(bankAccountId);
    
    if (cached !== undefined && timestamp && (Date.now() - timestamp) < PIN_CACHE_TTL) {
        return cached;
    }
    
    try {
        const response = await axios.get(`${API_BASE_URL}/bank/accounts/${bankAccountId}/has-pin`, 
            { headers: getAuthHeaders() }
        );
        const hasPin = response.data.data?.hasPin || false;
        pinStatusCache.set(bankAccountId, hasPin);
        pinCacheTimestamp.set(bankAccountId, Date.now());
        return hasPin;
    } catch (error) {
        console.error('Failed to check PIN:', error);
        return false;
    }
};

// ============ SABAI COINS ============

// Add this new function to get lifetime earned

export const getLifetimeEarned = async () => {
    try {
        const transactions = await getTransactions();
        // Only successful transactions
        const successfulTransactions = (transactions || []).filter(t => t.status === 'success');
        
        let totalEarned = 0;
        successfulTransactions.forEach(t => {
            // SEND transactions NEVER earn cashback
            if (t.type === 'send' || t.type === 'sent') return;
            if (t.type === 'self_transfer') return;
            if (t.type === 'receive' || t.type === 'received') return;
            
            // Check if this transaction earns cashback
            // Cashback is earned for: bill, recharge, merchant_order, auto_pay_execution, reserve_pay
            const isEarningType = t.type === 'bill_payment' || t.type === 'bill' ||
                                  t.type === 'recharge' || t.type === 'auto_pay_execution' ||
                                  t.type === 'reserve_pay' || t.type === 'spending' ||
                                  t.type === 'merchant_order' || t.type === 'challenge_reward';
            
            // Check if gems were used - if gems used, NO cashback
            const gemsUsed = (t.payment_breakdown && t.payment_breakdown.gemsAmount > 0) ||
                             (t.gems_used === true) || (t.gems_used > 0);
            
            // Challenge rewards are special
            if (t.type === 'challenge_reward') {
                totalEarned += (t.cashback_earned || t.amount || 0);
            } 
            // For earning type transactions, ONLY add cashback if NO gems were used
            else if (isEarningType && !gemsUsed) {
                let gemsEarned = t.cashback_earned || 0;
                // If no cashback_earned, calculate from amount (5% max 100)
                if (gemsEarned === 0 && t.amount) {
                    gemsEarned = Math.floor(parseFloat(t.amount) * 0.05);
                    gemsEarned = Math.min(gemsEarned, 100);
                }
                totalEarned += gemsEarned;
            }
        });
        
        // Cache for quick access
        localStorage.setItem('cached_lifetimeEarned', totalEarned.toString());
        
        return totalEarned;
    } catch (error) {
        console.error('Failed to get lifetime earned:', error);
        const cached = localStorage.getItem('cached_lifetimeEarned');
        return cached ? parseInt(cached) : 0;
    }
};

// Get coin balance (remaining = earned - used)
export const getCoinBalance = async () => {
    try {
        const totalEarned = await getLifetimeEarned();
        
        // Calculate total used from ALL successful transactions
        const transactions = await getTransactions();
        const successfulTransactions = (transactions || []).filter(t => t.status === 'success');
        
        let totalUsed = 0;
        successfulTransactions.forEach(t => {
            // Check payment_breakdown for gems used
            if (t.payment_breakdown && t.payment_breakdown.gemsAmount > 0) {
                totalUsed += t.payment_breakdown.gemsAmount;
            }
            // Check gems_used field
            else if (t.gems_used && t.gems_used > 0) {
                totalUsed += t.gems_used;
            }
        });
        
        const balance = totalEarned - totalUsed;
        localStorage.setItem('cached_coinBalance', balance.toString());
        
        return Math.max(0, balance);
    } catch (error) {
        console.error('Failed to get coin balance:', error);
        const cached = localStorage.getItem('cached_coinBalance');
        return cached ? parseInt(cached) : 0;
    }
};

// Update coin balance with proper logging
export const updateCoinBalance = async (amount, isEarning = true) => {
    try {
        console.log(`updateCoinBalance: amount=${amount}, isEarning=${isEarning}`);
        
        const response = await axios.post(`${API_BASE_URL}/bank/coins/update`, 
            { amount, isEarning }, 
            { headers: getAuthHeaders() }
        );
        
        if (response.data && response.data.success) {
            // Invalidate caches
            localStorage.removeItem('cached_coinBalance');
            localStorage.removeItem('cached_lifetimeEarned');
            console.log(`Coin balance updated successfully, new balance: ${response.data.data.newBalance}`);
            return response.data.data.newBalance;
        }
        throw new Error(response.data?.message || 'Failed to update coin balance');
    } catch (error) {
        console.error('Update coin balance error:', error);
        // Fallback: update cache manually
        const currentBalance = await getCoinBalance();
        const newBalance = isEarning ? currentBalance + amount : currentBalance - amount;
        localStorage.setItem('cached_coinBalance', Math.max(0, newBalance).toString());
        return Math.max(0, newBalance);
    }
};

export const updateContactAfterTransaction = async (receiverVpa, receiverName, amount, isReceived = false) => {
    try {
        const contact = {
            name: receiverName || receiverVpa.split('@')[0],
            vpa: receiverVpa,
            amount: amount,
            is_received: isReceived
        };
        const response = await axios.post(`${API_BASE_URL}/contacts`, contact, { headers: getAuthHeaders() });
        if (response.data.success) {
            localStorage.removeItem('cached_contacts');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to update contact:', error);
        return false;
    }
};

// ============ TRANSACTIONS ============

export const getTransactions = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/transactions`, { headers: getAuthHeaders() });
        if (response.data.success) {
            const transactions = response.data.data.transactions || [];
            localStorage.setItem('cached_transactions', JSON.stringify(transactions));
            return transactions;
        }
        return [];
    } catch (error) {
        console.error('Failed to get transactions:', error);
        const cached = localStorage.getItem('cached_transactions');
        return cached ? JSON.parse(cached) : [];
    }
};

// In storageService.js, update the addTransaction function

// frontend/src/services/storageService.js
// Replace the addTransaction function with this fixed version:

export const addTransaction = async (transaction) => {
    try {
        console.log('addTransaction called with:', transaction);
        
        // Prepare transaction data - DON'T send created_at, let MySQL use DEFAULT
        const transactionData = {
            transaction_id: transaction.transactionId || transaction.transaction_id || `TXN${Date.now()}`,
            user_id: getCurrentUserId(),
            type: transaction.type || 'other',
            amount: parseFloat(transaction.amount) || 0,
            status: transaction.status || 'success',
            description: transaction.description || '',
            cashback_earned: transaction.cashback_earned || transaction.cashback || 0,
            gems_used: transaction.gems_used || 0,
            reserve_used: transaction.reserve_used || 0,
            bank_used: transaction.bank_used || 0,
            sender_vpa: transaction.sender_vpa || null,
            receiver_vpa: transaction.receiver_vpa || null,
            receiver_name: transaction.receiver_name || null,
            bank_name: transaction.bank_name || null,
            bank_account_id: transaction.bank_id || transaction.bank_account_id || null,
            bill_type: transaction.bill_type || null,
            customer_id: transaction.customer_id || null,
            provider: transaction.provider || null,
            mobile_number: transaction.mobileNumber || transaction.mobile_number || null,
            operator: transaction.operator || null,
            circle: transaction.circle || null,
            failure_reason: transaction.failure_reason || null,
            payment_method_display: transaction.payment_method_display || null
            // Remove created_at - let MySQL handle it with DEFAULT CURRENT_TIMESTAMP
        };
        
        // Remove any undefined values
        Object.keys(transactionData).forEach(key => {
            if (transactionData[key] === undefined) {
                delete transactionData[key];
            }
        });
        
        console.log('Sending transaction data to server:', transactionData);
        
        const response = await axios.post(`${API_BASE_URL}/transactions`, transactionData, { 
            headers: getAuthHeaders() 
        });
        
        if (response.data && response.data.success) {
            // Clear caches
            localStorage.removeItem('cached_transactions');
            localStorage.removeItem('cached_coinBalance');
            localStorage.removeItem('cached_lifetimeEarned');
            
            console.log('Transaction saved successfully:', response.data);
            
            return {
                ...transaction,
                id: response.data.data?.id || Date.now(),
                created_at: new Date().toISOString(),
                date: new Date().toISOString()
            };
        }
        throw new Error(response.data?.message || 'Failed to save transaction');
    } catch (error) {
        console.error('Failed to save transaction:', error);
        console.error('Error response:', error.response?.data);
        throw error;
    }
};

// ============ BILLS ============

export const getBills = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/bills`, { headers: getAuthHeaders() });
        if (response.data.success) {
            const bills = response.data.data.pending || [];
            localStorage.setItem('cached_bills', JSON.stringify(bills));
            return bills;
        }
        return [];
    } catch (error) {
        console.error('Failed to get bills:', error);
        const cached = localStorage.getItem('cached_bills');
        return cached ? JSON.parse(cached) : [];
    }
};

export const addBill = async (billData) => {
    try {
        console.log('Adding bill:', billData);
        
        const response = await axios.post(`${API_BASE_URL}/bills`, billData, { 
            headers: getAuthHeaders() 
        });
        
        console.log('Add bill response:', response.data);
        
        if (response.data && response.data.success) {
            localStorage.removeItem('cached_bills');
            return response.data.data;
        }
        throw new Error(response.data?.message || 'Failed to add bill');
    } catch (error) {
        console.error('Failed to add bill:', error);
        console.error('Error response:', error.response?.data);
        throw error;
    }
};

export const updateBill = async (billId, updates) => {
    await axios.put(`${API_BASE_URL}/bills/${billId}`, updates, { headers: getAuthHeaders() });
    localStorage.removeItem('cached_bills');
    return true;
};

export const deleteBill = async (billId) => {
    try {
        // First, delete any auto-pay orders associated with this bill
        const autoPayOrders = await getAutoPayOrders();
        const associatedOrders = autoPayOrders.filter(order => order.bill_id === billId);
        
        for (const order of associatedOrders) {
            try {
                await axios.delete(`${API_BASE_URL}/auto-pay/orders/${order.id}`, { 
                    headers: getAuthHeaders() 
                });
                console.log(`Deleted auto-pay order ${order.id} for bill ${billId}`);
            } catch (orderError) {
                console.error(`Failed to delete auto-pay order ${order.id}:`, orderError);
            }
        }
        
        // Then delete the bill
        await axios.delete(`${API_BASE_URL}/bills/${billId}`, { headers: getAuthHeaders() });
        
        // Clear caches
        localStorage.removeItem('cached_bills');
        localStorage.removeItem('cached_autoPayOrders');
        
        return true;
    } catch (error) {
        console.error('Failed to delete bill:', error);
        throw error;
    }
};

export const markBillAsPaid = async (billId, paymentData) => {
    await axios.post(`${API_BASE_URL}/bills/${billId}/pay`, paymentData, { headers: getAuthHeaders() });
    localStorage.removeItem('cached_bills');
    return true;
};

export const getPaidBills = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/bills?paid=true`, { headers: getAuthHeaders() });
        if (response.data.success) {
            return response.data.data.paid || [];
        }
        return [];
    } catch (error) {
        console.error('Failed to get paid bills:', error);
        return [];
    }
};

// ============ RESERVE LIMITS ============

export const getReserveLimits = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/reserve/limits`, { headers: getAuthHeaders() });
        if (response.data.success) {
            const limits = response.data.data || [];
            localStorage.setItem('cached_reserveLimits', JSON.stringify(limits));
            return limits;
        }
        return [];
    } catch (error) {
        console.error('Failed to get reserve limits:', error);
        const cached = localStorage.getItem('cached_reserveLimits');
        return cached ? JSON.parse(cached) : [];
    }
};

export const setReserveLimits = async (limits) => {
    try {
        console.log('Saving reserve limits with contributions:', limits.map(l => ({ 
            merchant: l.merchant, 
            monthly_limit: l.monthly_limit,
            contributionsCount: l.contributions?.length || 0
        })));
        
        // First, get existing limits to know what to delete
        const existingLimits = await getReserveLimits();
        const existingMerchants = existingLimits.map(l => l.merchant);
        const newMerchants = limits.map(l => l.merchant);
        
        // Delete limits that are no longer present
        const merchantsToDelete = existingMerchants.filter(m => !newMerchants.includes(m));
        
        for (const merchant of merchantsToDelete) {
            console.log('Deleting limit for merchant:', merchant);
            try {
                await axios.delete(`${API_BASE_URL}/reserve/limits/${merchant}`, { 
                    headers: getAuthHeaders() 
                });
            } catch (error) {
                console.error('Failed to delete limit:', merchant, error);
            }
        }
        
        // Save/update remaining limits
        for (const limit of limits) {
            const limitData = {
                merchant: limit.merchant,
                merchant_name: limit.merchant_name,
                merchant_category: limit.merchant_category,
                monthly_limit: Number(limit.monthly_limit),
                per_transaction_limit: limit.per_transaction_limit ? Number(limit.per_transaction_limit) : null,
                requires_approval: limit.requires_approval || false,
                is_active: limit.is_active !== false,
                contributions: limit.contributions || []
            };
            
            console.log('Saving limit:', limitData);
            
            await axios.post(`${API_BASE_URL}/reserve/limits`, limitData, { 
                headers: getAuthHeaders() 
            });
        }
        
        localStorage.removeItem('cached_reserveLimits');
        console.log('All limits saved successfully');
        return true;
    } catch (error) {
        console.error('Failed to set reserve limits:', error);
        throw error;
    }
};
export const addReserveLimit = async (limitData) => {
    await axios.post(`${API_BASE_URL}/reserve/limits`, limitData, { headers: getAuthHeaders() });
    localStorage.removeItem('cached_reserveLimits');
    return true;
};

export const deleteReserveLimit = async (merchant) => {
    await axios.delete(`${API_BASE_URL}/reserve/limits/${merchant}`, { headers: getAuthHeaders() });
    localStorage.removeItem('cached_reserveLimits');
    return true;
};

// ============ AUTO PAY ORDERS ============

export const getAutoPayOrders = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/auto-pay/orders`, { headers: getAuthHeaders() });
        if (response.data.success) {
            const orders = response.data.data || [];
            // Map database field names to frontend field names
            const mappedOrders = orders.map(order => ({
                id: order.id,
                orderId: order.order_id,
                type: order.type,
                merchant: order.merchant,
                merchantName: order.merchant_name,
                merchantCategory: order.merchant_category,
                amount: order.amount,
                schedule: order.schedule,
                dateValue: order.date_value,
                monthValue: order.month_value,
                time: order.time_value,
                oneTimeDate: order.one_time_date,
                paymentMethod: order.payment_method,
                bankAccountId: order.bank_account_id,
                bankName: order.bank_name,
                bankAccountLast4: order.bank_account_last4,
                nextExecution: order.next_execution,
                reminderDays: order.reminder_days,
                status: order.status,
                isBillPayment: order.is_bill_payment === 1,
                isRecharge: order.is_recharge === 1,
                billId: order.bill_id,
                customerId: order.customer_id,
                billType: order.bill_type,
                provider: order.provider,
                mobileNumber: order.mobile_number,
                operator: order.operator,
                circle: order.circle,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                executionHistory: order.execution_history ? JSON.parse(order.execution_history) : []
            }));
            localStorage.setItem('cached_autoPayOrders', JSON.stringify(mappedOrders));
            return mappedOrders;
        }
        return [];
    } catch (error) {
        console.error('Failed to get auto-pay orders:', error);
        const cached = localStorage.getItem('cached_autoPayOrders');
        return cached ? JSON.parse(cached) : [];
    }
};

export const addAutoPayOrder = async (orderData) => {
    try {
        console.log('Adding auto-pay order:', orderData);
        
        const response = await axios.post(`${API_BASE_URL}/auto-pay/orders`, orderData, { 
            headers: getAuthHeaders() 
        });
        
        if (response.data && response.data.success) {
            localStorage.removeItem('cached_autoPayOrders');
            console.log('Auto-pay order added successfully');
            
            // Return the created order with ID
            const createdOrder = {
                ...orderData,
                id: response.data.data?.orderId || orderData.orderId
            };
            return createdOrder;
        }
        throw new Error(response.data?.message || 'Failed to add auto-pay order');
    } catch (error) {
        console.error('Failed to add auto-pay order:', error);
        throw error;
    }
};

export const deleteAutoPayOrder = async (orderId) => {
    try {
        console.log(`Deleting auto-pay order with ID: ${orderId}`);
        const response = await axios.delete(`${API_BASE_URL}/auto-pay/orders/${orderId}`, { 
            headers: getAuthHeaders() 
        });
        if (response.data.success) {
            localStorage.removeItem('cached_autoPayOrders');
            console.log(`Successfully deleted auto-pay order ${orderId}`);
            return true;
        }
        throw new Error(response.data?.message || 'Failed to delete auto-pay order');
    } catch (error) {
        console.error('Failed to delete auto-pay order:', error);
        throw error;
    }
};

// ============ CONTACTS ============

export const getContacts = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/contacts`, { 
            headers: getAuthHeaders() 
        });
        if (response.data.success) {
            const contacts = response.data.data || [];
            // Cache for sync access
            localStorage.setItem('cached_contacts', JSON.stringify(contacts));
            return contacts;
        }
        return [];
    } catch (error) {
        console.error('Failed to get contacts:', error);
        // Fallback to cached data
        const cached = localStorage.getItem('cached_contacts');
        return cached ? JSON.parse(cached) : [];
    }
};

export const addContact = async (contact) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/contacts`, {
            name: contact.name,
            vpa: contact.vpa,
            phone: contact.phone,
            amount: contact.amount || 0,
            is_received: contact.is_received || false
        }, { headers: getAuthHeaders() });
        
        if (response.data.success) {
            // Clear cache to force refresh
            localStorage.removeItem('cached_contacts');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to add contact:', error);
        return false;
    }
};

// ============ MONEY REQUESTS ============

// In storageService.js, add these functions if not present:

export const getMoneyRequests = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/money-requests`, { 
            headers: getAuthHeaders() 
        });
        if (response.data.success) {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('Failed to get money requests:', error);
        // Fallback to localStorage
        const cached = localStorage.getItem('moneyRequests');
        return cached ? JSON.parse(cached) : [];
    }
};

export const setMoneyRequests = async (requests) => {
    try {
        // For now, store in localStorage as fallback
        // This function should be replaced with actual API call when backend is ready
        localStorage.setItem('moneyRequests', JSON.stringify(requests));
        return true;
    } catch (error) {
        console.error('Failed to set money requests:', error);
        return false;
    }
};

export const addMoneyRequest = async (requestData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/money-requests`, requestData, { 
            headers: getAuthHeaders() 
        });
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error(response.data.message);
    } catch (error) {
        console.error('Failed to add money request:', error);
        // Fallback: save to localStorage
        const existing = await getMoneyRequests();
        const requests = Array.isArray(existing) ? existing : [];
        requests.unshift(requestData);
        localStorage.setItem('moneyRequests', JSON.stringify(requests));
        return requestData;
    }
};

// ============ RECHARGES ============

export const getRecentRecharges = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/recharge/recent`, { headers: getAuthHeaders() });
        if (response.data.success) {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('Failed to get recent recharges:', error);
        return [];
    }
};

export const addRecentRecharge = async (rechargeData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/recharge`, {
            mobile_number: rechargeData.mobile_number,
            operator: rechargeData.operator,
            operator_id: rechargeData.operator_id,
            amount: rechargeData.amount,
            circle: rechargeData.circle,  // ← Make sure this line exists
            transaction_id: rechargeData.transaction_id,
            cashback_earned: rechargeData.cashback_earned || 0,
            payment_method: rechargeData.payment_method
        }, { headers: getAuthHeaders() });
        return response.data.success;
    } catch (error) {
        console.error('Failed to add recent recharge:', error);
        return false;
    }
};

// ============ AGENT CHAT ============

export const getAgentConversations = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/agent/conversations`, { headers: getAuthHeaders() });
        if (response.data.success) {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('Failed to get conversations:', error);
        return [];
    }
};

export const getAgentMessages = async (conversationId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/agent/conversations/${conversationId}`, { headers: getAuthHeaders() });
        if (response.data.success) {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('Failed to get messages:', error);
        return [];
    }
};

export const saveAgentMessage = async (conversationId, role, content, sessionId = null, cart = null, total = null, requiresAction = false, merchant = null) => {
    await axios.post(`${API_BASE_URL}/agent/messages`, 
        { conversationId, role, content, sessionId, cart, total, requiresAction, merchant }, 
        { headers: getAuthHeaders() }
    );
    return true;
};

export const deleteAgentConversation = async (conversationId) => {
    await axios.delete(`${API_BASE_URL}/agent/conversations/${conversationId}`, { headers: getAuthHeaders() });
    return true;
};

// ============ AGENT ORDERS ============

export const getAgentOrders = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/agent/order/orders`, { headers: getAuthHeaders() });
        if (response.data.success) {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('Failed to get agent orders:', error);
        return [];
    }
};

// ============ MERCHANT CONNECTIONS ============

export const getConnectedMerchants = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/merchant/connections`, { 
            headers: getAuthHeaders() 
        });
        if (response.data.success) {
            const merchants = response.data.data || [];
            console.log('Connected merchants from API:', merchants);
            
            // Normalize the data structure
            const normalizedMerchants = merchants.map(m => ({
                merchantId: m.merchantId || m.merchant_id,
                merchant_id: m.merchantId || m.merchant_id,
                name: m.name || m.merchant_name,
                merchant_name: m.name || m.merchant_name,
                logoUrl: m.logoUrl,
                color: m.color,
                connectedAt: m.connectedAt || m.connected_at || new Date().toISOString(),
                connected_at: m.connectedAt || m.connected_at
            }));
            
            localStorage.setItem('cached_connectedMerchants', JSON.stringify(normalizedMerchants));
            return normalizedMerchants;
        }
        return [];
    } catch (error) {
        console.error('Failed to get connected merchants:', error);
        const cached = localStorage.getItem('cached_connectedMerchants');
        return cached ? JSON.parse(cached) : [];
    }
};

export const connectMerchant = async (merchantId, connectionData, location = null) => {
    const response = await axios.post(`${API_BASE_URL}/merchant/connect`, 
        { merchantId, connectionData, location }, 
        { headers: getAuthHeaders() }
    );
    return response.data;
};

export const disconnectMerchant = async (merchantId) => {
    const response = await axios.post(`${API_BASE_URL}/merchant/disconnect`, 
        { merchantId }, 
        { headers: getAuthHeaders() }
    );
    return response.data;
};

// ============ WEEKLY CHALLENGES ============

export const getClaimedChallenges = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/challenges/claimed`, { headers: getAuthHeaders() });
        if (response.data.success) {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('Failed to get claimed challenges:', error);
        return [];
    }
};

export const claimChallenge = async (challengeId) => {
    const response = await axios.post(`${API_BASE_URL}/challenges/${challengeId}/claim`, {}, { headers: getAuthHeaders() });
    return response.data.success;
};

// ============ COMPATIBILITY & SYNC FUNCTIONS ============

export const hasUpiPinHelper = hasUpiPin;
export const verifyBankPinHelper = verifyBankPin;
export const updateBankBalanceHelper = updateBankBalance;
export const updateCoinBalanceHelper = updateCoinBalance;

// These are kept for backward compatibility with older components
export const setBankAccounts = async () => true;
export const setBankBalances = async () => true;
export const setAutoPayOrders = async () => true;
// export const setMoneyRequests = async () => true;
export const getBankUpiPins = async () => ({});
export const addPaidBill = async () => true;

// Sync versions for components that haven't been updated yet
export const getBankAccountsSync = () => {
    const cached = localStorage.getItem('cached_bankAccounts');
    return cached ? JSON.parse(cached) : [];
};

export const getBankBalancesSync = () => {
    const cached = localStorage.getItem('cached_bankBalances');
    return cached ? JSON.parse(cached) : {};
};

export const getCoinBalanceSync = () => {
    const cached = localStorage.getItem('cached_coinBalance');
    return cached ? parseInt(cached) : 0;
};

export const getTransactionsSync = () => {
    const cached = localStorage.getItem('cached_transactions');
    return cached ? JSON.parse(cached) : [];
};

export const getBillsSync = () => {
    const cached = localStorage.getItem('cached_bills');
    return cached ? JSON.parse(cached) : [];
};

export const getReserveLimitsSync = () => {
    const cached = localStorage.getItem('cached_reserveLimits');
    return cached ? JSON.parse(cached) : [];
};

export const getAutoPayOrdersSync = () => {
    const cached = localStorage.getItem('cached_autoPayOrders');
    return cached ? JSON.parse(cached) : [];
};

export const getContactsSync = () => {
    const cached = localStorage.getItem('cached_contacts');
    return cached ? JSON.parse(cached) : [];
};

export const getMoneyRequestsSync = () => [];
export const getRecentRechargesSync = () => [];
export const getPaidBillsSync = () => [];

// ============ DEFAULT EXPORT ============

const storageService = {
    getCurrentUserId, setCurrentUserId, refreshCurrentUserId, clearUserCache, clearPinCache,
    getBankAccounts, addBankAccount, deleteBankAccount, setPrimaryBankAccount,
    getBankBalances, updateBankBalance,
    setBankUpiPin, verifyBankPin, hasUpiPin, hasUpiPinHelper, verifyBankPinHelper,
    updateBankBalanceHelper, updateCoinBalanceHelper,
    getTransactions, addTransaction,
    getCoinBalance, updateCoinBalance,
    getBills, addBill, updateBill, deleteBill, markBillAsPaid, getPaidBills,
    getReserveLimits, setReserveLimits, addReserveLimit, deleteReserveLimit,
    getAutoPayOrders, addAutoPayOrder, deleteAutoPayOrder,
    getContacts, addContact,
    getMoneyRequests, addMoneyRequest,
    getRecentRecharges, addRecentRecharge,
    getAgentConversations, getAgentMessages, saveAgentMessage, deleteAgentConversation, getAgentOrders,
    getConnectedMerchants, connectMerchant, disconnectMerchant,
    getClaimedChallenges, claimChallenge,
    // Legacy exports
    setBankAccounts, setBankBalances, setAutoPayOrders, setMoneyRequests, getBankUpiPins, addPaidBill
};

export default storageService;