// backend/utils/validators.js
// Input validation functions

const { body, param, query, validationResult } = require('express-validator');
const Helpers = require('./helpers');

class Validators {
    
    // Validation middleware
    static validate(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }
        next();
    }
    
    // ============================================
    // Auth validations
    // ============================================
    
    static registerValidation() {
        return [
            body('phone_number')
                .notEmpty().withMessage('Phone number is required')
                .isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits')
                .custom(value => Helpers.isValidIndianPhone(value))
                .withMessage('Please enter a valid Indian phone number'),
            
            body('name')
                .notEmpty().withMessage('Name is required')
                .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
                .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
            
            body('email')
                .optional()
                .isEmail().withMessage('Please enter a valid email')
                .normalizeEmail(),
            
            body('password')
                .optional()
                .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        ];
    }
    
    static loginValidation() {
        return [
            body('phone_number')
                .notEmpty().withMessage('Phone number is required')
                .isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits'),
            
            body('password')
                .optional()
                .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        ];
    }
    
    static verifyOtpValidation() {
        return [
            body('phone_number')
                .notEmpty().withMessage('Phone number is required')
                .isLength({ min: 10, max: 10 }),
            
            body('otp')
                .notEmpty().withMessage('OTP is required')
                .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
                .isNumeric().withMessage('OTP must contain only numbers')
        ];
    }
    
    // ============================================
    // UPI validations
    // ============================================
    
    static sendMoneyValidation() {
        return [
            body('receiver_vpa')
                .notEmpty().withMessage('Receiver UPI ID is required')
                .custom(value => Helpers.isValidUpiId(value))
                .withMessage('Please enter a valid UPI ID'),
            
            body('amount')
                .notEmpty().withMessage('Amount is required')
                .isFloat({ min: 1 }).withMessage('Amount must be at least ₹1')
                .isFloat({ max: 100000 }).withMessage('Amount cannot exceed ₹1,00,000'),
            
            body('note')
                .optional()
                .isLength({ max: 100 }).withMessage('Note cannot exceed 100 characters')
        ];
    }
    
    static requestMoneyValidation() {
        return [
            body('requester_vpa')
                .notEmpty().withMessage('Requester UPI ID is required')
                .custom(value => Helpers.isValidUpiId(value)),
            
            body('amount')
                .notEmpty().withMessage('Amount is required')
                .isFloat({ min: 1 }),
            
            body('note').optional().isLength({ max: 100 })
        ];
    }
    
    // ============================================
    // Agent validations
    // ============================================
    
    static agentChatValidation() {
        return [
            body('message')
                .notEmpty().withMessage('Message is required')
                .isLength({ min: 1, max: 500 }).withMessage('Message too long')
        ];
    }
    
    static approveAgentTransactionValidation() {
        return [
            param('agent_txn_id')
                .notEmpty().withMessage('Agent transaction ID is required')
                .isNumeric().withMessage('Invalid transaction ID'),
            
            body('action')
                .notEmpty().withMessage('Action is required')
                .isIn(['approve', 'reject']).withMessage('Action must be approve or reject')
        ];
    }
    
    // ============================================
    // Reserve Pay validations
    // ============================================
    
    static setLimitValidation() {
        return [
            body('merchant')
                .notEmpty().withMessage('Merchant is required')
                .isIn(['swiggy', 'zomato', 'amazon', 'flipkart', 'zepto', 'bigbasket', 'blinkit'])
                .withMessage('Invalid merchant'),
            
            body('monthly_limit')
                .notEmpty().withMessage('Monthly limit is required')
                .isFloat({ min: 100, max: 100000 })
                .withMessage('Monthly limit must be between ₹100 and ₹1,00,000'),
            
            body('per_transaction_limit')
                .optional()
                .isFloat({ min: 1 })
                .withMessage('Per transaction limit must be at least ₹1')
        ];
    }
    
    // ============================================
    // Coin validations
    // ============================================
    
    static redeemCoinsValidation() {
        return [
            body('amount')
                .notEmpty().withMessage('Coin amount is required')
                .isInt({ min: 100 }).withMessage('Minimum 100 coins required for redemption'),
            
            body('redemption_type')
                .notEmpty().withMessage('Redemption type is required')
                .isIn(['bill', 'recharge', 'transfer', 'cashback'])
                .withMessage('Invalid redemption type'),
            
            body('target_account')
                .notEmpty().withMessage('Target account is required')
        ];
    }
    
    // ============================================
    // Bill payment validations
    // ============================================
    
    static payBillValidation() {
        return [
            body('bill_type')
                .notEmpty().withMessage('Bill type is required')
                .isIn(['electricity', 'water', 'mobile', 'broadband', 'gas', 'credit_card'])
                .withMessage('Invalid bill type'),
            
            body('provider')
                .notEmpty().withMessage('Provider is required'),
            
            body('customer_id')
                .notEmpty().withMessage('Customer ID/Account number is required'),
            
            body('amount')
                .notEmpty().withMessage('Amount is required')
                .isFloat({ min: 1 })
                .withMessage('Amount must be at least ₹1')
        ];
    }
    
    static mobileRechargeValidation() {
        return [
            body('mobile_number')
                .notEmpty().withMessage('Mobile number is required')
                .isLength({ min: 10, max: 10 })
                .withMessage('Mobile number must be 10 digits')
                .custom(value => Helpers.isValidIndianPhone(value))
                .withMessage('Invalid Indian mobile number'),
            
            body('operator')
                .notEmpty().withMessage('Operator is required'),
            
            body('amount')
                .notEmpty().withMessage('Amount is required')
                .isFloat({ min: 10, max: 10000 })
                .withMessage('Amount must be between ₹10 and ₹10,000')
        ];
    }
    
    // ============================================
    // Transaction validations
    // ============================================
    
    static transactionHistoryValidation() {
        return [
            query('page')
                .optional()
                .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
            
            query('limit')
                .optional()
                .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
            
            query('type')
                .optional()
                .isIn(['send', 'receive', 'bill', 'recharge', 'qr', 'request'])
                .withMessage('Invalid transaction type'),
            
            query('from_date')
                .optional()
                .isISO8601().withMessage('Invalid from date format'),
            
            query('to_date')
                .optional()
                .isISO8601().withMessage('Invalid to date format')
        ];
    }
    
    // ============================================
    // User profile validations
    // ============================================
    
    static updateProfileValidation() {
        return [
            body('name')
                .optional()
                .isLength({ min: 2, max: 50 })
                .matches(/^[a-zA-Z\s]+$/),
            
            body('email')
                .optional()
                .isEmail()
                .normalizeEmail(),
            
            body('date_of_birth')
                .optional()
                .isISO8601()
                .toDate(),
            
            body('gender')
                .optional()
                .isIn(['male', 'female', 'other'])
        ];
    }
    
    static updateMonthlyLimitValidation() {
        return [
            body('monthly_limit')
                .notEmpty().withMessage('Monthly limit is required')
                .isFloat({ min: 1000, max: 1000000 })
                .withMessage('Monthly limit must be between ₹1,000 and ₹10,00,000')
        ];
    }
    
    // ============================================
    // Bank account validations
    // ============================================
    
    static addBankAccountValidation() {
        return [
            body('account_number')
                .notEmpty().withMessage('Account number is required')
                .isLength({ min: 9, max: 18 })
                .withMessage('Invalid account number length'),
            
            body('ifsc_code')
                .notEmpty().withMessage('IFSC code is required')
                .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
                .withMessage('Invalid IFSC code format'),
            
            body('bank_name')
                .notEmpty().withMessage('Bank name is required'),
            
            body('account_holder_name')
                .notEmpty().withMessage('Account holder name is required'),
            
            body('account_type')
                .optional()
                .isIn(['savings', 'current'])
                .withMessage('Account type must be savings or current')
        ];
    }
}

module.exports = Validators;