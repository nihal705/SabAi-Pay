// backend/middleware/validation.js
// Request validation middleware

const { validationResult } = require('express-validator');
const constants = require('../utils/constants');

class ValidationMiddleware {
    
    // Validate request
    static validate(req, res, next) {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }
        
        next();
    }
    
    // Sanitize input
    static sanitizeInput(req, res, next) {
        // Remove any HTML tags from string inputs
        const sanitizeValue = (value) => {
            if (typeof value === 'string') {
                return value.replace(/<[^>]*>/g, '');
            }
            return value;
        };
        
        // Recursively sanitize object
        const sanitizeObject = (obj) => {
            if (Array.isArray(obj)) {
                return obj.map(item => sanitizeObject(item));
            }
            
            if (obj && typeof obj === 'object') {
                const sanitized = {};
                for (const [key, value] of Object.entries(obj)) {
                    sanitized[key] = sanitizeObject(value);
                }
                return sanitized;
            }
            
            return sanitizeValue(obj);
        };
        
        req.body = sanitizeObject(req.body);
        req.query = sanitizeObject(req.query);
        req.params = sanitizeObject(req.params);
        
        next();
    }
    
    // Validate UPI ID format
    static isValidUpiId(upiId) {
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
        return upiRegex.test(upiId);
    }
    
    // Validate Indian phone number
    static isValidIndianPhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone);
    }
    
    // Validate amount
    static isValidAmount(amount) {
        return amount > 0 && amount <= 1000000; // Max ₹10 lakhs
    }
    
    // Validate IFSC code
    static isValidIfsc(ifsc) {
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        return ifscRegex.test(ifsc);
    }
    
    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Check required fields
    static checkRequired(fields, body) {
        const missing = [];
        
        for (const field of fields) {
            if (!body[field] || body[field].toString().trim() === '') {
                missing.push(field);
            }
        }
        
        return missing;
    }
    
    // Validate date range
    static validateDateRange(startDate, endDate, maxDays = 90) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { valid: false, error: 'Invalid date format' };
        }
        
        if (start > end) {
            return { valid: false, error: 'Start date must be before end date' };
        }
        
        const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > maxDays) {
            return { valid: false, error: `Date range cannot exceed ${maxDays} days` };
        }
        
        return { valid: true };
    }
    
    // Validate pagination params
    static validatePagination(page, limit) {
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        
        if (page < 1) page = 1;
        if (limit < 1) limit = 1;
        if (limit > 100) limit = 100;
        
        return { page, limit };
    }
}

module.exports = ValidationMiddleware;