import { VALIDATION, DEFAULTS } from './constants';

// Generate random OTP (for testing)
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Generate transaction ID
export const generateTransactionId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN${timestamp}${random}`.toUpperCase();
};

// Generate UPI ID
export const generateUpiId = (phoneNumber, handle = 'sabai') => {
  return `${phoneNumber}@${handle}`;
};

// Calculate percentage
export const calculatePercentage = (value, total, decimals = 1) => {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(decimals));
};

// Calculate coin cashback
export const calculateCashback = (amount, rate = 0.01) => {
  return Math.floor(amount * rate);
};

// Calculate coin value
export const calculateCoinValue = (coins) => {
  return coins / DEFAULTS.COIN_CONVERSION_RATE;
};

// Calculate days until expiry
export const daysUntilExpiry = (expiryDate) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get expiry status
export const getExpiryStatus = (expiryDate) => {
  const daysLeft = daysUntilExpiry(expiryDate);
  
  if (daysLeft < 0) return 'expired';
  if (daysLeft === 0) return 'expires-today';
  if (daysLeft <= 3) return 'critical';
  if (daysLeft <= 7) return 'warning';
  if (daysLeft <= 15) return 'notice';
  return 'safe';
};

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    success: '#10b981',
    pending: '#f59e0b',
    failed: '#ef4444',
    refunded: '#8b5cf6',
    active: '#10b981',
    inactive: '#9ca3af',
    verified: '#10b981',
    unverified: '#f59e0b',
    expired: '#9ca3af',
    critical: '#ef4444',
    warning: '#f59e0b',
    notice: '#fbbf24',
    safe: '#10b981'
  };
  return colors[status] || '#6b7280';
};

// Get status icon
export const getStatusIcon = (status) => {
  const icons = {
    success: '✅',
    pending: '⏳',
    failed: '❌',
    refunded: '↩️',
    active: '✅',
    inactive: '⭕',
    verified: '✅',
    unverified: '⚠️',
    expired: '⌛',
    critical: '🔥',
    warning: '⚠️',
    notice: '📢',
    safe: '✅'
  };
  return icons[status] || '📌';
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Capitalize first letter
export const capitalizeFirst = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Capitalize each word
export const capitalizeWords = (string) => {
  if (!string) return '';
  return string.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

// Remove empty values from object
export const removeEmptyValues = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null && v !== '')
  );
};

// Group array by key
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

// Sort array by key
export const sortBy = (array, key, ascending = true) => {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return ascending ? -1 : 1;
    if (a[key] > b[key]) return ascending ? 1 : -1;
    return 0;
  });
};

// Filter array by search term
export const filterBySearch = (array, searchTerm, keys) => {
  if (!searchTerm) return array;
  
  const term = searchTerm.toLowerCase();
  return array.filter(item => 
    keys.some(key => 
      item[key]?.toString().toLowerCase().includes(term)
    )
  );
};

// Paginate array
export const paginate = (array, page = 1, limit = DEFAULTS.PAGE_SIZE) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: array.length,
      totalPages: Math.ceil(array.length / limit),
      hasNext: endIndex < array.length,
      hasPrev: page > 1
    }
  };
};

// Calculate reading time
export const calculateReadingTime = (text, wordsPerMinute = 200) => {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
};

// Generate random color
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Download data as file
export const downloadAsFile = (data, filename, type = 'text/plain') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

// Detect browser
export const detectBrowser = () => {
  const ua = navigator.userAgent;
  
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera')) return 'Opera';
  
  return 'Unknown';
};

// Check if online
export const isOnline = () => {
  return navigator.onLine;
};

// Get device type
export const getDeviceType = () => {
  const ua = navigator.userAgent;
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
};

// Get orientation
export const getOrientation = () => {
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
};

// Scroll to top
export const scrollToTop = (behavior = 'smooth') => {
  window.scrollTo({ top: 0, behavior });
};

// Scroll to element
export const scrollToElement = (elementId, offset = 0, behavior = 'smooth') => {
  const element = document.getElementById(elementId);
  if (element) {
    const y = element.getBoundingClientRect().top + window.pageYOffset + offset;
    window.scrollTo({ top: y, behavior });
  }
};

export default {
  generateOTP,
  generateTransactionId,
  generateUpiId,
  calculatePercentage,
  calculateCashback,
  calculateCoinValue,
  daysUntilExpiry,
  getExpiryStatus,
  getStatusColor,
  getStatusIcon,
  truncateText,
  capitalizeFirst,
  capitalizeWords,
  debounce,
  throttle,
  deepClone,
  isEmptyObject,
  removeEmptyValues,
  groupBy,
  sortBy,
  filterBySearch,
  paginate,
  calculateReadingTime,
  getRandomColor,
  getInitials,
  downloadAsFile,
  copyToClipboard,
  detectBrowser,
  isOnline,
  getDeviceType,
  getOrientation,
  scrollToTop,
  scrollToElement
};