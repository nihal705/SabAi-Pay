// Application Constants

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER: 500
};

// Transaction Types
export const TRANSACTION_TYPES = {
  SEND: 'send',
  RECEIVE: 'receive',
  BILL: 'bill',
  RECHARGE: 'recharge',
  QR: 'qr',
  REQUEST: 'request'
};

// Transaction Status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Payment Methods
export const PAYMENT_METHODS = {
  UPI: 'upi',
  RESERVE_PAY: 'reserve_pay',
  COINS: 'coins',
  CARD: 'card'
};

// Merchant Categories
export const MERCHANT_CATEGORIES = {
  FOOD: {
    id: 'food',
    name: 'Food & Restaurants',
    icon: '🍔',
    color: '#f59e0b',
    merchants: ['swiggy', 'zomato', 'uber-eats', 'dominos', 'pizza-hut']
  },
  SHOPPING: {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    color: '#8b5cf6',
    merchants: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho']
  },
  GROCERIES: {
    id: 'groceries',
    name: 'Groceries',
    icon: '🛒',
    color: '#10b981',
    merchants: ['zepto', 'bigbasket', 'blinkit', 'grofers', 'dunzo']
  },
  ENTERTAINMENT: {
    id: 'entertainment',
    name: 'Entertainment',
    icon: '🎬',
    color: '#ec4899',
    merchants: ['netflix', 'prime-video', 'hotstar', 'spotify', 'bookmyshow']
  },
  TRAVEL: {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    color: '#3b82f6',
    merchants: ['uber', 'ola', 'makemytrip', 'goibibo', 'irctc']
  },
  FUEL: {
    id: 'fuel',
    name: 'Fuel',
    icon: '⛽',
    color: '#ef4444',
    merchants: ['indian-oil', 'bharat-petroleum', 'hp', 'shell']
  },
  HEALTHCARE: {
    id: 'healthcare',
    name: 'Healthcare',
    icon: '💊',
    color: '#14b8a6',
    merchants: ['practo', 'pharmeasy', 'netmeds', '1mg', 'apollo']
  },
  EDUCATION: {
    id: 'education',
    name: 'Education',
    icon: '📚',
    color: '#f97316',
    merchants: ['byjus', 'unacademy', 'coursera', 'udemy']
  },
  UTILITIES: {
    id: 'utilities',
    name: 'Utilities',
    icon: '⚡',
    color: '#6b7280',
    merchants: ['electricity', 'water', 'gas', 'broadband']
  }
};

// Bill Types
export const BILL_TYPES = {
  ELECTRICITY: {
    id: 'electricity',
    name: 'Electricity',
    icon: '⚡',
    providers: ['Tata Power', 'Adani Electricity', 'BSES', 'Torrent Power']
  },
  WATER: {
    id: 'water',
    name: 'Water',
    icon: '💧',
    providers: ['Municipal Corporation', 'BMC', 'DWSS']
  },
  MOBILE: {
    id: 'mobile',
    name: 'Mobile',
    icon: '📱',
    providers: ['Airtel', 'Jio', 'Vi', 'BSNL']
  },
  BROADBAND: {
    id: 'broadband',
    name: 'Broadband',
    icon: '🌐',
    providers: ['JioFiber', 'Airtel Xstream', 'ACT', 'Hathway']
  },
  GAS: {
    id: 'gas',
    name: 'Gas',
    icon: '🔥',
    providers: ['HP Gas', 'Indane', 'Bharat Gas']
  },
  CREDIT_CARD: {
    id: 'credit_card',
    name: 'Credit Card',
    icon: '💳',
    providers: ['HDFC', 'ICICI', 'SBI', 'Axis']
  }
};

// Notification Types
export const NOTIFICATION_TYPES = {
  TRANSACTION: {
    id: 'transaction',
    name: 'Transaction',
    icon: '💰',
    color: '#10b981'
  },
  COIN_EXPIRY: {
    id: 'coin_expiry',
    name: 'Coin Expiry',
    icon: '🪙',
    color: '#fbbf24'
  },
  LIMIT_ALERT: {
    id: 'limit_alert',
    name: 'Limit Alert',
    icon: '⚠️',
    color: '#ef4444'
  },
  SECURITY: {
    id: 'security',
    name: 'Security',
    icon: '🔒',
    color: '#8b5cf6'
  },
  REMINDER: {
    id: 'reminder',
    name: 'Reminder',
    icon: '⏰',
    color: '#3b82f6'
  },
  PROMO: {
    id: 'promo',
    name: 'Promotion',
    icon: '🎉',
    color: '#ec4899'
  }
};

// Notification Priorities
export const NOTIFICATION_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Coin Types
export const COIN_TYPES = {
  EARNED: {
    id: 'earned',
    name: 'Earned',
    icon: '💰',
    color: '#10b981'
  },
  BONUS: {
    id: 'bonus',
    name: 'Bonus',
    icon: '🎁',
    color: '#fbbf24'
  },
  CASHBACK: {
    id: 'cashback',
    name: 'Cashback',
    icon: '💸',
    color: '#8b5cf6'
  },
  REFERRAL: {
    id: 'referral',
    name: 'Referral',
    icon: '👥',
    color: '#ec4899'
  }
};

// Redemption Types
export const REDEMPTION_TYPES = {
  BILL: {
    id: 'bill',
    name: 'Bill Payment',
    icon: '⚡',
    minCoins: 100,
    color: '#ef4444'
  },
  RECHARGE: {
    id: 'recharge',
    name: 'Mobile Recharge',
    icon: '📱',
    minCoins: 100,
    color: '#8b5cf6'
  },
  SHOPPING: {
    id: 'shopping',
    name: 'Shopping Voucher',
    icon: '🛍️',
    minCoins: 200,
    color: '#10b981'
  },
  FOOD: {
    id: 'food',
    name: 'Food Order',
    icon: '🍔',
    minCoins: 150,
    color: '#f59e0b'
  },
  TRANSFER: {
    id: 'transfer',
    name: 'Bank Transfer',
    icon: '💰',
    minCoins: 500,
    color: '#667eea'
  }
};

// Time Periods
export const TIME_PERIODS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  CUSTOM: 'custom'
};

// Date Ranges
export const DATE_RANGES = {
  [TIME_PERIODS.TODAY]: {
    label: 'Today',
    days: 0
  },
  [TIME_PERIODS.WEEK]: {
    label: 'Last 7 days',
    days: 7
  },
  [TIME_PERIODS.MONTH]: {
    label: 'Last 30 days',
    days: 30
  },
  [TIME_PERIODS.QUARTER]: {
    label: 'Last 3 months',
    days: 90
  },
  [TIME_PERIODS.YEAR]: {
    label: 'Last 12 months',
    days: 365
  }
};

// Currency
export const CURRENCY = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee'
  }
};

// UPI Handles
export const UPI_HANDLES = [
  '@okhdfcbank',
  '@oksbi',
  '@okicici',
  '@okaxis',
  '@paytm',
  '@ybl',
  '@ibl',
  '@apl',
  '@pingpay',
  '@fam'
];

// App Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_OTP: '/verify-otp',
  DASHBOARD: '/dashboard',
  SEND_MONEY: '/send-money',
  REQUEST_MONEY: '/request-money',
  BILLS: '/bills',
  RECHARGE: '/recharge',
  AGENT: '/agent',
  RESERVE_PAY: '/reserve-pay',
  COINS: '/coins',
  TRANSACTIONS: '/transactions',
  QR_CODE: '/qr-code',
  SETTINGS: '/settings',
  HELP: '/help'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATION_SOUND: 'notificationSound',
  LOGIN_PHONE: 'login_phone',
  LOGIN_OTP: 'login_otp'
};

// Theme Modes
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Languages
export const LANGUAGES = {
  EN: { code: 'en', name: 'English' },
  HI: { code: 'hi', name: 'हिन्दी' },
  TA: { code: 'ta', name: 'தமிழ்' },
  TE: { code: 'te', name: 'తెలుగు' },
  KN: { code: 'kn', name: 'ಕನ್ನಡ' },
  ML: { code: 'ml', name: 'മലയാളം' },
  MR: { code: 'mr', name: 'मराठी' },
  GU: { code: 'gu', name: 'ગુજરાતી' },
  BN: { code: 'bn', name: 'বাংলা' }
};

// Default Values
export const DEFAULTS = {
  MONTHLY_LIMIT: 5000,
  PAGE_SIZE: 20,
  CURRENCY: 'INR',
  LANGUAGE: 'en',
  THEME: 'light',
  COIN_EXPIRY_DAYS: 30,
  COIN_CONVERSION_RATE: 100,
  OTP_EXPIRY_MINUTES: 10
};

// Validation Rules
export const VALIDATION = {
  PHONE_REGEX: /^[6-9]\d{9}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UPI_ID_REGEX: /^[\w.-]+@[\w.-]+$/,
  IFSC_REGEX: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  PIN_REGEX: /^\d{4}$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_REGEX: /^[a-zA-Z\s]+$/
};

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_PHONE: 'Enter a valid 10-digit Indian phone number',
  INVALID_EMAIL: 'Enter a valid email address',
  INVALID_UPI: 'Enter a valid UPI ID',
  INVALID_IFSC: 'Enter a valid IFSC code',
  INVALID_PIN: 'PIN must be 4 digits',
  PASSWORD_MISMATCH: 'Passwords do not match',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
  INVALID_AMOUNT: 'Enter a valid amount',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  INSUFFICIENT_COINS: 'Insufficient coins',
  MIN_COINS: (min) => `Minimum ${min} coins required`,
  MAX_AMOUNT: (max) => `Amount cannot exceed ₹${max.toLocaleString()}`,
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SESSION_EXPIRED: 'Session expired. Please login again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  REGISTER: 'Registration successful!',
  OTP_SENT: 'OTP sent successfully!',
  VERIFIED: 'Verification successful!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PAYMENT_SUCCESS: 'Payment successful!',
  REQUEST_SENT: 'Money request sent!',
  BILL_PAID: 'Bill paid successfully!',
  RECHARGE_SUCCESS: 'Recharge successful!',
  COINS_REDEEMED: (value) => `₹${value} redeemed successfully!`,
  LIMIT_SET: 'Limit set successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!'
};

// Chart Colors
export const CHART_COLORS = [
  '#667eea',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#3b82f6',
  '#14b8a6',
  '#f97316',
  '#a855f7'
];

// Animation Variants
export const ANIMATIONS = {
  FADE_IN: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  SLIDE_UP: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  SLIDE_DOWN: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  SLIDE_LEFT: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  SLIDE_RIGHT: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  SCALE: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  }
};

export default {
  HTTP_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  PAYMENT_METHODS,
  MERCHANT_CATEGORIES,
  BILL_TYPES,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  COIN_TYPES,
  REDEMPTION_TYPES,
  TIME_PERIODS,
  DATE_RANGES,
  CURRENCY,
  UPI_HANDLES,
  ROUTES,
  STORAGE_KEYS,
  THEME_MODES,
  LANGUAGES,
  DEFAULTS,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CHART_COLORS,
  ANIMATIONS
};