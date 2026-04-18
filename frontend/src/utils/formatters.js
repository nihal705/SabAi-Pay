// Currency Formatter
export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

// Compact Currency (e.g., ₹1.2K, ₹1.5M)
export const formatCompactCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  
  const formatter = new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    compactDisplay: 'short',
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });
  
  return formatter.format(amount);
};

// Format number with commas
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '0';
  
  return new Intl.NumberFormat('en-IN').format(number);
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  
  return `${value.toFixed(decimals)}%`;
};

// Format phone number (e.g., +91 98765 43210)
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{5})(\d{5})$/);
  
  if (match) {
    return `+91 ${match[1]} ${match[2]}`;
  }
  
  return phone;
};

// Mask phone number (e.g., *****43210)
export const maskPhoneNumber = (phone, visibleDigits = 5) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  const masked = '*'.repeat(cleaned.length - visibleDigits) + cleaned.slice(-visibleDigits);
  
  return masked;
};

// Format UPI ID (e.g., rahul@okhdfcbank)
export const formatUpiId = (vpa) => {
  if (!vpa) return '';
  
  return vpa.toLowerCase();
};

// Mask UPI ID (e.g., ra***@okhdfcbank)
export const maskUpiId = (vpa, visibleChars = 3) => {
  if (!vpa) return '';
  
  const [local, domain] = vpa.split('@');
  if (!domain) return vpa;
  
  const maskedLocal = local.slice(0, visibleChars) + '*'.repeat(local.length - visibleChars);
  return `${maskedLocal}@${domain}`;
};

// Format account number (e.g., ****1234)
export const formatAccountNumber = (accountNumber, visibleDigits = 4) => {
  if (!accountNumber) return '';
  
  const cleaned = accountNumber.replace(/\D/g, '');
  const masked = '*'.repeat(cleaned.length - visibleDigits) + cleaned.slice(-visibleDigits);
  
  return masked;
};

// Format IFSC code
export const formatIfsc = (ifsc) => {
  if (!ifsc) return '';
  
  return ifsc.toUpperCase();
};

// Format date
export const formatDate = (date, format = 'dd/MM/yyyy') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  
  const formats = {
    'dd/MM/yyyy': `${day}/${month}/${year}`,
    'yyyy-MM-dd': `${year}-${month}-${day}`,
    'dd MMM yyyy': d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    'dd MMM yyyy, hh:mm a': d.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    'full': d.toLocaleDateString('en-IN', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };
  
  return formats[format] || formats['dd/MM/yyyy'];
};

// Format relative time (e.g., 2 hours ago, yesterday)
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month ago`;
  
  return formatDate(date, 'dd/MM/yyyy');
};

// Format time
export const formatTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format month-year
export const formatMonthYear = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });
};

// Format transaction ID (e.g., TXN-2024-03-15-001)
export const formatTransactionId = (id) => {
  if (!id) return '';
  
  // If already formatted, return as is
  if (id.includes('-')) return id;
  
  // Format as TXN-YYYY-MM-DD-XXX
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const sequence = id.slice(-4).padStart(3, '0');
  
  return `TXN-${year}-${month}-${day}-${sequence}`;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format duration (seconds to HH:MM:SS)
export const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format card number (e.g., **** **** **** 1234)
export const formatCardNumber = (cardNumber) => {
  if (!cardNumber) return '';
  
  const cleaned = cardNumber.replace(/\D/g, '');
  const last4 = cleaned.slice(-4);
  
  return `**** **** **** ${last4}`;
};

// Format expiry date (MM/YY)
export const formatExpiryDate = (month, year) => {
  if (!month || !year) return '';
  
  const m = month.toString().padStart(2, '0');
  const y = year.toString().slice(-2);
  
  return `${m}/${y}`;
};

// Format coins (e.g., 1,234 🪙)
export const formatCoins = (coins, withIcon = true) => {
  if (coins === null || coins === undefined) return withIcon ? '0 🪙' : '0';
  
  const formatted = formatNumber(coins);
  return withIcon ? `${formatted} 🪙` : formatted;
};

// Format coin value (e.g., ₹12.34)
export const formatCoinValue = (coins) => {
  if (coins === null || coins === undefined) return '₹0';
  
  const value = coins / 100;
  return formatCurrency(value);
};

// Format limit usage
export const formatLimitUsage = (spent, limit) => {
  if (!limit) return '0%';
  
  const percentage = (spent / limit) * 100;
  return formatPercentage(percentage);
};

// Format address
export const formatAddress = (address) => {
  if (!address) return '';
  
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pincode
  ].filter(Boolean);
  
  return parts.join(', ');
};

// Format name (capitalize each word)
export const formatName = (name) => {
  if (!name) return '';
  
  return name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format message for display (handle line breaks, URLs, etc.)
export const formatMessage = (message) => {
  if (!message) return '';
  
  // Convert URLs to links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  message = message.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
  
  // Convert line breaks to <br>
  message = message.replace(/\n/g, '<br>');
  
  return message;
};

// Format search query (remove special characters, trim)
export const formatSearchQuery = (query) => {
  if (!query) return '';
  
  return query.trim().replace(/[^\w\s]/gi, '');
};

export default {
  formatCurrency,
  formatCompactCurrency,
  formatNumber,
  formatPercentage,
  formatPhoneNumber,
  maskPhoneNumber,
  formatUpiId,
  maskUpiId,
  formatAccountNumber,
  formatIfsc,
  formatDate,
  formatRelativeTime,
  formatTime,
  formatMonthYear,
  formatTransactionId,
  formatFileSize,
  formatDuration,
  formatCardNumber,
  formatExpiryDate,
  formatCoins,
  formatCoinValue,
  formatLimitUsage,
  formatAddress,
  formatName,
  formatMessage,
  formatSearchQuery
};