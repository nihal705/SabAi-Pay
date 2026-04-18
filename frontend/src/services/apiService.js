// frontend/src/services/apiService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ============ AUTH API ============
export const authAPI = {
    sendOTP: (phoneNumber, purpose = 'register') => 
        api.post('/auth/send-otp', { phone_number: phoneNumber, purpose }),
    
    verifyOTP: (phoneNumber, otp, purpose = 'register') => 
        api.post('/auth/verify-otp', { phone_number: phoneNumber, otp, purpose }),
    
    register: (userData) => api.post('/auth/register', userData),
    
    login: (phoneNumber, password) => 
        api.post('/auth/login', { phone_number: phoneNumber, password }),
    
    getProfile: () => api.get('/auth/profile'),
    
    updateProfile: (data) => api.put('/auth/profile', data)
};

// ============ BANK API ============
export const bankAPI = {
    getAccounts: () => api.get('/bank/accounts'),
    addAccount: (accountData) => api.post('/bank/accounts', accountData),
    deleteAccount: (accountId) => api.delete(`/bank/accounts/${accountId}`),
    setPrimary: (accountId) => api.put(`/bank/accounts/${accountId}/primary`),
    getBalance: (accountId) => api.get(`/bank/balance/${accountId}`),
    setUpiPin: (accountId, pin) => api.post(`/bank/accounts/${accountId}/pin`, { pin }),
    verifyPin: (accountId, pin) => api.post('/bank/verify-pin', { accountId, pin }),
    deposit: (accountId, amount) => api.post('/bank/deposit', { accountId, amount }),
    withdraw: (accountId, amount) => api.post('/bank/withdraw', { accountId, amount })
};

// ============ TRANSACTION API ============
export const transactionAPI = {
    getAll: (params = {}) => api.get('/transactions', { params }),
    getOne: (transactionId) => api.get(`/transactions/${transactionId}`),
    create: (transactionData) => api.post('/transactions', transactionData)
};

// ============ RESERVE PAY API ============
export const reserveAPI = {
    getLimits: () => api.get('/reserve/limits'),
    createLimit: (limitData) => api.post('/reserve/limits', limitData),
    deleteLimit: (merchant) => api.delete(`/reserve/limits/${merchant}`),
    checkPayment: (merchant, amount) => api.post('/reserve/check-payment', { merchant, amount }),
    processPayment: (merchant, amount, transactionId, description) => 
        api.post('/reserve/process-payment', { merchant, amount, transactionId, description })
};

// ============ COIN API ============
export const coinAPI = {
    getBalance: () => api.get('/coins/balance'),
    getHistory: (limit = 50) => api.get(`/coins/history?limit=${limit}`),
    redeem: (coinAmount, type, target) => api.post('/coins/redeem', { coinAmount, type, target })
};

// ============ BILL API ============
export const billAPI = {
    getAll: () => api.get('/bills'),
    create: (billData) => api.post('/bills', billData),
    update: (billId, updates) => api.put(`/bills/${billId}`, updates),
    pay: (billId, paymentData) => api.post(`/bills/${billId}/pay`, paymentData),
    delete: (billId) => api.delete(`/bills/${billId}`)
};

// ============ RECHARGE API ============
export const rechargeAPI = {
    getRecent: () => api.get('/recharge/recent'),
    add: (rechargeData) => api.post('/recharge', rechargeData)
};

// ============ CONTACT API ============
export const contactAPI = {
    getAll: () => api.get('/contacts'),
    createOrUpdate: (name, vpa, phone, amount, isReceived) => 
        api.post('/contacts', { name, vpa, phone, amount, is_received: isReceived })
};

// ============ MONEY REQUEST API ============
export const moneyRequestAPI = {
    getAll: (status = null) => api.get(`/money-requests${status ? `?status=${status}` : ''}`),
    create: (requestData) => api.post('/money-requests', requestData),
    updateStatus: (requestId, status) => api.put(`/money-requests/${requestId}/status`, { status })
};

// ============ AGENT CHAT API ============
export const agentChatAPI = {
    sendMessage: (message, sessionId = null) => 
        api.post('/agent/chat', { message, sessionId }),
    
    getConversations: () => api.get('/agent/conversations'),
    
    getMessages: (conversationId) => api.get(`/agent/conversations/${conversationId}`),
    
    deleteConversation: (conversationId) => api.delete(`/agent/conversations/${conversationId}`),
    
    clearChat: () => api.post('/agent/clear')
};

// ============ AGENT ORDER API ============
export const agentOrderAPI = {
    processOrder: (message, sessionId, userLocation) => 
        api.post('/agent/order/process', { message, sessionId, userLocation }),
    
    selectItems: (sessionId, selectedItems, selection) => 
        api.post('/agent/order/select-items', { sessionId, selectedItems, selection }),
    
    processReservePayment: (sessionId, orderData) => 
        api.post('/agent/order/process-reserve', { sessionId, orderData }),
    
    checkReserveLimit: (merchant, amount) => 
        api.post('/agent/order/check-reserve', { merchant, amount }),
    
    getUserOrders: () => api.get('/agent/order/orders'),
    
    getOrder: (orderId) => api.get(`/agent/order/order/${orderId}`),
    
    getOrderStatus: (orderId) => api.get(`/agent/order/status/${orderId}`),
    
    getConnectedMerchants: () => api.get('/agent/order/connected-merchants'),
    
    checkMerchantConnection: (merchantId) => api.get(`/agent/order/check-connection/${merchantId}`),
    
    // Auto-Pay
    setupAutoPay: (sessionId, schedule, dayOfMonth, bankAccountId, orderData) => 
        api.post('/agent/order/auto-pay/setup', { sessionId, schedule, dayOfMonth, bankAccountId, orderData }),
    
    getAutoPayOrders: () => api.get('/agent/order/auto-pay/orders'),
    
    cancelAutoPay: (orderId) => api.post('/agent/order/auto-pay/cancel', { orderId }),
    
    deleteAutoPay: (orderId) => api.delete(`/agent/order/auto-pay/${orderId}`),
    
    updateAutoPayBank: (orderId, bankAccountId, bankName) => 
        api.post('/agent/order/auto-pay/update-bank', { orderId, bankAccountId, bankName }),
    
    getAutoPayHistory: () => api.get('/agent/order/auto-pay/history'),
    
    // Reserve Limits
    getReserveLimits: () => api.get('/agent/order/reserve-limits'),
    
    syncReserveLimits: (limits) => api.post('/agent/order/sync-reserve-limits', { limits }),
    
    updateReserveLimits: (merchant, updates) => 
        api.post('/agent/order/update-reserve-limits', { merchant, updates }),
    
    // Transactions
    saveTransaction: (transaction) => api.post('/agent/order/save-transaction', transaction),
    
    getTransactions: () => api.get('/agent/order/transactions')
};

// ============ MERCHANT API ============
export const merchantAPI = {
    validateLocation: (merchantId, address, city) => 
        api.post('/merchant/validate-location', { merchantId, address, city }),
    
    getMerchantInfo: (merchantId) => api.get(`/merchant/${merchantId}/info`),
    
    getMerchantCities: (merchantId) => api.get(`/merchant/${merchantId}/cities`),
    
    connectMerchant: (merchantId, connectionData, location) => 
        api.post('/merchant/connect', { merchantId, connectionData, location }),
    
    disconnectMerchant: (merchantId) => api.post('/merchant/disconnect', { merchantId }),
    
    getConnections: () => api.get('/merchant/connections'),
    
    checkConnection: (merchantId) => api.get(`/merchant/check/${merchantId}`),
    
    saveLocation: (merchantId, address, city, area, coordinates) => 
        api.post('/merchant/save-location', { merchantId, address, city, area, coordinates }),
    
    getLocation: (merchantId) => api.get(`/merchant/location/${merchantId}`),
    
    deleteLocation: (merchantId) => api.delete(`/merchant/location/${merchantId}`),
    
    getRestaurants: (merchantId, city, area) => 
        api.get(`/merchant/${merchantId}/restaurants?city=${city}&area=${area || ''}`),
    
    getRestaurantMenu: (merchantId, restaurantId, city) => 
        api.get(`/merchant/${merchantId}/restaurant/${restaurantId}/menu?city=${city}`),
    
    searchItems: (merchantId, city, searchTerm, area) => 
        api.get(`/merchant/${merchantId}/search?city=${city}&q=${searchTerm}&area=${area || ''}`),
    
    getSuggestions: (merchantId, city, area, limit = 5) => 
        api.get(`/merchant/${merchantId}/suggestions?city=${city}&area=${area || ''}&limit=${limit}`),
    
    checkCity: (merchantId, city) => api.get(`/merchant/${merchantId}/city/${city}/check`)
};

export default api;