// frontend/src/services/storageWrapper.js
// Wrapper to make async storage functions easier to use
// This mimics the old localStorage API but with promises

import storageService from './storageService';

// Cache for frequently accessed data
const cache = new Map();
const cacheTTL = 30000; // 30 seconds

const getCached = (key, fetcher) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
        return cached.data;
    }
    return null;
};

const setCached = (key, data) => {
    cache.set(key, { data, timestamp: Date.now() });
};

// Synchronous wrappers that return cached data or empty arrays
// These are for components that haven't been migrated to async yet
export const getBankAccountsSync = () => {
    const cached = getCached('bankAccounts', null);
    if (cached) return cached;
    return [];
};

export const getBankBalancesSync = () => {
    const cached = getCached('bankBalances', null);
    if (cached) return cached;
    return {};
};

export const getCoinBalanceSync = () => {
    const cached = getCached('coinBalance', null);
    if (cached) return cached;
    return 0;
};

export const getTransactionsSync = () => {
    const cached = getCached('transactions', null);
    if (cached) return cached;
    return [];
};

export const getBillsSync = () => {
    const cached = getCached('bills', null);
    if (cached) return cached;
    return [];
};

export const getReserveLimitsSync = () => {
    const cached = getCached('reserveLimits', null);
    if (cached) return cached;
    return [];
};

export const getAutoPayOrdersSync = () => {
    const cached = getCached('autoPayOrders', null);
    if (cached) return cached;
    return [];
};

export const getContactsSync = () => {
    const cached = getCached('contacts', null);
    if (cached) return cached;
    return [];
};

export const getMoneyRequestsSync = () => {
    const cached = getCached('moneyRequests', null);
    if (cached) return cached;
    return [];
};

export const getRecentRechargesSync = () => {
    const cached = getCached('recentRecharges', null);
    if (cached) return cached;
    return [];
};

export const getPaidBillsSync = () => {
    const cached = getCached('paidBills', null);
    if (cached) return cached;
    return [];
};

// Async functions that update cache
export const refreshBankAccounts = async () => {
    const data = await storageService.getBankAccounts();
    setCached('bankAccounts', data);
    return data;
};

export const refreshBankBalances = async () => {
    const data = await storageService.getBankBalances();
    setCached('bankBalances', data);
    return data;
};

export const refreshCoinBalance = async () => {
    const data = await storageService.getCoinBalance();
    setCached('coinBalance', data);
    return data;
};

export const refreshTransactions = async () => {
    const data = await storageService.getTransactions();
    setCached('transactions', data);
    return data;
};

export const refreshBills = async () => {
    const data = await storageService.getBills();
    setCached('bills', data);
    return data;
};

export const refreshReserveLimits = async () => {
    const data = await storageService.getReserveLimits();
    setCached('reserveLimits', data);
    return data;
};

export const refreshAutoPayOrders = async () => {
    const data = await storageService.getAutoPayOrders();
    setCached('autoPayOrders', data);
    return data;
};

export const refreshContacts = async () => {
    const data = await storageService.getContacts();
    setCached('contacts', data);
    return data;
};

export const refreshMoneyRequests = async () => {
    const data = await storageService.getMoneyRequests();
    setCached('moneyRequests', data);
    return data;
};

export const refreshRecentRecharges = async () => {
    const data = await storageService.getRecentRecharges();
    setCached('recentRecharges', data);
    return data;
};

export const refreshPaidBills = async () => {
    const data = await storageService.getPaidBills();
    setCached('paidBills', data);
    return data;
};

// Clear cache for logout
export const clearCache = () => {
    cache.clear();
};