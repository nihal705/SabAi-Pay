// backend/controllers/upiController.js
// UPI payment controller for send/receive money

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');
const razorpayService = require('../services/razorpayService');
const constants = require('../utils/constants');
const Helpers = require('../utils/helpers');
const db = require('../config/database');

class UpiController {
    
    // Send money to UPI ID
    static async sendMoney(req, res) {
        try {
            const userId = req.user.id;
            const { receiver_vpa, amount, note, pin } = req.body;
            
            // Verify UPI PIN
            const pinValid = await User.verifyUpiPin(userId, pin);
            
            if (!pinValid.success) {
                return res.status(constants.HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: 'Invalid UPI PIN'
                });
            }
            
            // Check if user has sufficient monthly limit
            const balance = await User.getBalanceInfo(userId);
            
            if (!balance.success) {
                return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                    success: false,
                    message: 'Could not fetch balance'
                });
            }
            
            if (balance.data.remaining < amount) {
                return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Insufficient monthly limit',
                    data: {
                        remaining: balance.data.remaining,
                        requested: amount
                    }
                });
            }
            
            // Create Razorpay order
            const order = await razorpayService.createOrder(
                amount,
                'INR',
                `send_${Date.now()}`,
                { user_id: userId, receiver_vpa, type: 'send' }
            );
            
            if (!order.success) {
                return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                    success: false,
                    message: 'Failed to create payment order',
                    error: order.error
                });
            }
            
            // Create transaction record
            const transaction = await Transaction.create({
                user_id: userId,
                amount: amount,
                type: constants.TRANSACTION_TYPES.SEND,
                payment_method: constants.PAYMENT_METHODS.UPI,
                receiver_vpa: receiver_vpa,
                description: note || null,
                razorpay_order_id: order.data.id
            });
            
            if (!transaction.success) {
                return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                    success: false,
                    message: 'Failed to create transaction record'
                });
            }
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'Payment order created',
                data: {
                    transaction_id: transaction.data.transaction_id,
                    order_id: order.data.id,
                    amount: amount,
                    receiver_vpa: receiver_vpa,
                    razorpay_key: process.env.RAZORPAY_KEY_ID
                }
            });
            
        } catch (error) {
            console.error('Send money error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to send money',
                error: error.message
            });
        }
    }
    
    // Verify and complete payment
    static async verifyPayment(req, res) {
        try {
            const userId = req.user.id;
            const { 
                razorpay_payment_id, 
                razorpay_order_id, 
                razorpay_signature,
                transaction_id 
            } = req.body;
            
            // Verify signature
            const isValid = razorpayService.verifyPayment(
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            );
            
            if (!isValid) {
                return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid payment signature'
                });
            }
            
            // Find transaction
            const transaction = await Transaction.findByTransactionId(transaction_id);
            
            if (!transaction.success || !transaction.data) {
                return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }
            
            // Update transaction status
            const updateResult = await Transaction.updateStatus(
                transaction.data.id,
                constants.TRANSACTION_STATUS.SUCCESS,
                razorpay_payment_id
            );
            
            if (!updateResult.success) {
                return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                    success: false,
                    message: 'Failed to update transaction'
                });
            }
            
            // Add to contacts if not exists
            if (transaction.data.receiver_vpa) {
                await User.addContact(
                    userId,
                    transaction.data.receiver_vpa,
                    null,
                    null
                );
            }
            
            // Get updated balance
            const balance = await User.getBalanceInfo(userId);
            
            // Get io instance for real-time notification
            const io = req.app.get('io');
            
            // Send real-time notification
            io.to(`user_${userId}`).emit('payment_success', {
                transaction_id: transaction_id,
                amount: transaction.data.amount,
                receiver: transaction.data.receiver_vpa,
                timestamp: new Date()
            });
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'Payment successful',
                data: {
                    transaction_id: transaction_id,
                    amount: transaction.data.amount,
                    receiver_vpa: transaction.data.receiver_vpa,
                    remaining_balance: balance.data?.remaining || 0
                }
            });
            
        } catch (error) {
            console.error('Verify payment error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to verify payment',
                error: error.message
            });
        }
    }
    
    // Request money from UPI ID
    static async requestMoney(req, res) {
        try {
            const userId = req.user.id;
            const { requester_vpa, amount, note } = req.body;
            
            // Get user's UPI ID
            const user = await User.findById(userId);
            
            if (!user.success || !user.data) {
                return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Create payment request transaction
            const transaction = await Transaction.create({
                user_id: userId,
                amount: amount,
                type: constants.TRANSACTION_TYPES.REQUEST,
                payment_method: constants.PAYMENT_METHODS.UPI,
                receiver_vpa: requester_vpa,
                description: note || null,
                status: constants.TRANSACTION_STATUS.PENDING
            });
            
            if (!transaction.success) {
                return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                    success: false,
                    message: 'Failed to create request'
                });
            }
            
            // In a real app, send notification to requester
            // via SMS/push notification
            
            return res.status(constants.HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Money request sent',
                data: {
                    request_id: transaction.data.transaction_id,
                    requester_vpa: requester_vpa,
                    amount: amount,
                    status: 'pending'
                }
            });
            
        } catch (error) {
            console.error('Request money error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to request money',
                error: error.message
            });
        }
    }
    
    // Get transaction history
    static async getTransactionHistory(req, res) {
        try {
            const userId = req.user.id;
            const { 
                page = 1, 
                limit = 20, 
                type, 
                from_date, 
                to_date,
                status 
            } = req.query;
            
            const offset = (page - 1) * limit;
            
            const filters = {
                type: type,
                status: status,
                from_date: from_date,
                to_date: to_date,
                limit: parseInt(limit),
                offset: parseInt(offset)
            };
            
            const transactions = await Transaction.findByUserId(userId, filters);
            
            // Get total count for pagination
            const [countResult] = await db.pool.execute(
                'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?',
                [userId]
            );
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                data: {
                    transactions: transactions.success ? transactions.data : [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: countResult[0].total,
                        total_pages: Math.ceil(countResult[0].total / limit)
                    }
                }
            });
            
        } catch (error) {
            console.error('Get transaction history error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to get transaction history',
                error: error.message
            });
        }
    }
    
    // Get transaction details
    static async getTransactionDetails(req, res) {
        try {
            const userId = req.user.id;
            const { transaction_id } = req.params;
            
            const transaction = await Transaction.findByTransactionId(transaction_id);
            
            if (!transaction.success || !transaction.data) {
                return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }
            
            // Check if user owns this transaction
            if (transaction.data.user_id !== userId) {
                return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                data: transaction.data
            });
            
        } catch (error) {
            console.error('Get transaction details error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to get transaction details',
                error: error.message
            });
        }
    }
    
    // Add bank account
    static async addBankAccount(req, res) {
        try {
            const userId = req.user.id;
            const accountData = req.body;
            
            const result = await BankAccount.add(userId, accountData);
            
            if (!result.success) {
                return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                    success: false,
                    message: 'Failed to add bank account',
                    error: result.error
                });
            }
            
            return res.status(constants.HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Bank account added successfully',
                data: result.data
            });
            
        } catch (error) {
            console.error('Add bank account error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to add bank account',
                error: error.message
            });
        }
    }
    
    // Get bank accounts
    static async getBankAccounts(req, res) {
        try {
            const userId = req.user.id;
            
            const accounts = await BankAccount.findByUserId(userId);
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                data: accounts.success ? accounts.data : []
            });
            
        } catch (error) {
            console.error('Get bank accounts error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to get bank accounts',
                error: error.message
            });
        }
    }
    
    // Set primary bank account
    static async setPrimaryAccount(req, res) {
        try {
            const userId = req.user.id;
            const { account_id } = req.params;
            
            const result = await BankAccount.setPrimary(userId, account_id);
            
            if (!result.success) {
                return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: result.error || 'Failed to set primary account'
                });
            }
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'Primary account updated'
            });
            
        } catch (error) {
            console.error('Set primary account error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to set primary account',
                error: error.message
            });
        }
    }
    
    // Delete bank account
    static async deleteBankAccount(req, res) {
        try {
            const userId = req.user.id;
            const { account_id } = req.params;
            
            const result = await BankAccount.delete(userId, account_id);
            
            if (!result.success) {
                return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: result.error || 'Failed to delete account'
                });
            }
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'Bank account deleted'
            });
            
        } catch (error) {
            console.error('Delete bank account error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to delete bank account',
                error: error.message
            });
        }
    }
    
    // Get balance
    static async getBalance(req, res) {
        try {
            const userId = req.user.id;
            
            const balance = await User.getBalanceInfo(userId);
            
            if (!balance.success) {
                return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                    success: false,
                    message: 'Failed to fetch balance'
                });
            }
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                data: {
                    monthly_limit: balance.data.monthly_limit,
                    current_spent: balance.data.current_spent,
                    remaining: balance.data.remaining,
                    used_percentage: Helpers.calculatePercentage(
                        balance.data.current_spent,
                        balance.data.monthly_limit
                    )
                }
            });
            
        } catch (error) {
            console.error('Get balance error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to get balance',
                error: error.message
            });
        }
    }
    
    // Get contacts
    static async getContacts(req, res) {
        try {
            const userId = req.user.id;
            
            const contacts = await User.getContacts(userId);
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                data: contacts.success ? contacts.data : []
            });
            
        } catch (error) {
            console.error('Get contacts error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to get contacts',
                error: error.message
            });
        }
    }
    
    // Toggle favorite contact
    static async toggleFavoriteContact(req, res) {
        try {
            const userId = req.user.id;
            const { contact_id } = req.params;
            
            const result = await User.toggleFavoriteContact(userId, contact_id);
            
            if (!result.success) {
                return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'Contact not found'
                });
            }
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'Contact favorite status updated'
            });
            
        } catch (error) {
            console.error('Toggle favorite contact error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to update contact',
                error: error.message
            });
        }
    }
    
    // Get pending requests
    static async getPendingRequests(req, res) {
        try {
            const userId = req.user.id;
            
            const requests = await Transaction.getPendingRequests(userId);
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                data: requests.success ? requests.data : []
            });
            
        } catch (error) {
            console.error('Get pending requests error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to get pending requests',
                error: error.message
            });
        }
    }
    
    // QR code payment
    static async qrPayment(req, res) {
        try {
            const userId = req.user.id;
            const { qr_data, amount, pin } = req.body;
            
            // Parse QR data (should contain UPI ID or payment link)
            // For now, assume it's a UPI ID
            const receiver_vpa = qr_data;
            
            // Verify PIN
            const pinValid = await User.verifyUpiPin(userId, pin);
            
            if (!pinValid.success) {
                return res.status(constants.HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: 'Invalid UPI PIN'
                });
            }
            
            // Reuse send money logic
            req.body.receiver_vpa = receiver_vpa;
            req.body.note = 'QR Payment';
            
            return await UpiController.sendMoney(req, res);
            
        } catch (error) {
            console.error('QR payment error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to process QR payment',
                error: error.message
            });
        }
    }
}

module.exports = UpiController;