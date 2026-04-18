// backend/utils/constants.js
// Application constants

module.exports = {
    // HTTP Status Codes
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        INTERNAL_SERVER: 500
    },
    
    // Transaction types
    TRANSACTION_TYPES: {
        SEND: 'send',
        RECEIVE: 'receive',
        BILL: 'bill',
        RECHARGE: 'recharge',
        QR: 'qr',
        REQUEST: 'request'
    },
    
    // Transaction status
    TRANSACTION_STATUS: {
        PENDING: 'pending',
        SUCCESS: 'success',
        FAILED: 'failed',
        REFUNDED: 'refunded'
    },
    
    // Payment methods
    PAYMENT_METHODS: {
        UPI: 'upi',
        RESERVE_PAY: 'reserve_pay',
        COINS: 'coins',
        CARD: 'card'
    },
    
    // Merchant categories
    MERCHANT_CATEGORIES: {
        FOOD: 'food',
        SHOPPING: 'shopping',
        GROCERIES: 'groceries',
        TRAVEL: 'travel',
        ENTERTAINMENT: 'entertainment',
        BILLS: 'bills',
        OTHERS: 'others'
    },
    
    // Supported merchants
    SUPPORTED_MERCHANTS: {
        SWIGGY: 'swiggy',
        ZOMATO: 'zomato',
        AMAZON: 'amazon',
        FLIPKART: 'flipkart',
        ZEPTO: 'zepto',
        BIGBASKET: 'bigbasket',
        BLINKIT: 'blinkit'
    },
    
    // Bill types
    BILL_TYPES: {
        ELECTRICITY: 'electricity',
        WATER: 'water',
        MOBILE: 'mobile',
        BROADBAND: 'broadband',
        GAS: 'gas',
        CREDIT_CARD: 'credit_card'
    },
    
    // Notification types
    NOTIFICATION_TYPES: {
        TRANSACTION: 'transaction',
        COIN_EXPIRY: 'coin_expiry',
        LIMIT_ALERT: 'limit_alert',
        PROMO: 'promo',
        SECURITY: 'security',
        REMINDER: 'reminder'
    },
    
    // Notification priorities
    NOTIFICATION_PRIORITIES: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high'
    },
    
    // Coin types
    COIN_TYPES: {
        EARNED: 'earned',
        BONUS: 'bonus',
        CASHBACK: 'cashback',
        REFERRAL: 'referral'
    },
    
    // Coin expiry days
    COIN_EXPIRY_DAYS: 30,
    
    // Coin conversion rate (100 coins = ₹1)
    COIN_CONVERSION_RATE: 100,
    
    // Cashback rate (1 coin per ₹100 spent)
    CASHBACK_RATE: 0.01,
    
    // Default monthly limit
    DEFAULT_MONTHLY_LIMIT: 5000,
    
    // JWT expiration
    JWT_EXPIRY: '7d',
    
    // OTP expiry (in minutes)
    OTP_EXPIRY_MINUTES: 10,
    
    // Rate limiting
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100
    }
};