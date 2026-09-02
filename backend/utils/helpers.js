// backend/utils/helpers.js
// Helper utility functions

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class Helpers {
    
    // Generate random OTP
    static generateOTP(length = 6) {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
    }
    
    // Generate transaction ID
    static generateTransactionId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `TXN${timestamp}${random}`.toUpperCase();
    }
    
    // Generate UPI ID
    static generateUpiId(phoneNumber, handle = 'sabai') {
        return `${phoneNumber}@${handle}`;
    }
    
    // Hash password
    static async hashPassword(password) {
        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }
    
    // Compare password
    static async comparePassword(password, hash) {
        const bcrypt = require('bcrypt');
        return await bcrypt.compare(password, hash);
    }
    
    // Generate JWT token
    static generateToken(payload, expiresIn = '7d') {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
        return jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn }
        );
    }
    
    // Verify JWT token
    static verifyToken(token) {
        try {
            if (!process.env.JWT_SECRET) return null;
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }
    
    // Format currency
    static formatCurrency(amount, currency = 'INR') {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    }
    
    // Format date
    static formatDate(date, format = 'DD/MM/YYYY') {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        
        switch(format) {
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'DD MMM YYYY':
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${day} ${months[d.getMonth()]} ${year}`;
            default:
                return `${day}/${month}/${year}`;
        }
    }
    
    // Calculate expiry date
    static calculateExpiryDate(daysFromNow = 30) {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date;
    }
    
    // Mask sensitive data
    static maskString(str, visibleChars = 4, maskChar = '*') {
        if (!str) return '';
        if (str.length <= visibleChars) return str;
        const maskedPart = maskChar.repeat(str.length - visibleChars);
        const visiblePart = str.slice(-visibleChars);
        return maskedPart + visiblePart;
    }
    
    // Mask phone number
    static maskPhoneNumber(phone) {
        if (!phone) return '';
        return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
    }
    
    // Mask email
    static maskEmail(email) {
        if (!email) return '';
        const [local, domain] = email.split('@');
        if (!domain) return email;
        const maskedLocal = local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
        return `${maskedLocal}@${domain}`;
    }
    
    // Generate random string
    static generateRandomString(length = 10) {
        return crypto.randomBytes(length).toString('hex').slice(0, length);
    }
    
    // Calculate percentage
    static calculatePercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }
    
    // Group array by key
    static groupBy(array, key) {
        return array.reduce((result, item) => {
            const groupKey = item[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {});
    }
    
    // Paginate array
    static paginate(array, page = 1, limit = 10) {
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        return {
            data: array.slice(startIndex, endIndex),
            total: array.length,
            page,
            limit,
            totalPages: Math.ceil(array.length / limit)
        };
    }
    
    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Validate phone number (Indian)
    static isValidIndianPhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone);
    }
    
    // Validate UPI ID
    static isValidUpiId(upiId) {
        const upiRegex = /^[\w.-]+@[\w.-]+$/;
        return upiRegex.test(upiId);
    }
    
    // Convert amount to coins
    static amountToCoins(amount) {
        return Math.floor(amount / 100); // 1 coin per ₹100
    }
    
    // Convert coins to amount
    static coinsToAmount(coins) {
        return coins / 100; // 100 coins = ₹1
    }
    
    // Sleep function
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = Helpers;
