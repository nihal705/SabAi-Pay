// backend/controllers/authController.js
// Authentication controller for login, register, OTP verification

const User = require('../models/User');
const Helpers = require('../utils/helpers');
const AuthMiddleware = require('../middleware/auth');
const constants = require('../utils/constants');
const db = require('../config/database');

class AuthController {
    
    // Register new user
    static async register(req, res) {
        try {
            const { phone_number, name, email, password } = req.body;
            
            // Check if user already exists
            const existingUser = await User.findByPhone(phone_number);
            
            if (existingUser.success && existingUser.data) {
                return res.status(constants.HTTP_STATUS.CONFLICT).json({
                    success: false,
                    message: 'User already exists with this phone number'
                });
            }
            
            // Create new user
            const result = await User.create({
                phone_number,
                name,
                email,
                password
            });
            
            if (!result.success) {
                return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                    success: false,
                    message: 'Failed to create user',
                    error: result.error
                });
            }
            
            // Generate OTP (in production, send via SMS)
            const otp = Helpers.generateOTP();
            
            // Store OTP in session or temporary storage
            // For now, we'll just return it (in production, never return OTP!)
            
            return res.status(constants.HTTP_STATUS.CREATED).json({
                success: true,
                message: 'User registered successfully. Please verify OTP.',
                data: {
                    user_id: result.data.id,
                    phone_number,
                    name,
                    upi_id: result.data.upi_id,
                    // ⚠️ Remove this in production - only for testing
                    otp: otp 
                }
            });
            
        } catch (error) {
            console.error('Registration error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Registration failed',
                error: error.message
            });
        }
    }
    
    // Login with phone number
    static async login(req, res) {
        try {
            const { phone_number, password } = req.body;
            
            // Find user
            const user = await User.findByPhone(phone_number);
            
            if (!user.success || !user.data) {
                return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Check if user is active
            if (!user.data.is_active) {
                return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }
            
            // If password provided, verify it
            if (password && user.data.password_hash) {
                const isValid = await Helpers.comparePassword(password, user.data.password_hash);
                
                if (!isValid) {
                    return res.status(constants.HTTP_STATUS.UNAUTHORIZED).json({
                        success: false,
                        message: 'Invalid password'
                    });
                }
            }
            
            // Generate OTP for login
            const otp = Helpers.generateOTP();
            
            // Store OTP in session (in production, use Redis)
            // For now, we'll just return it (remove in production!)
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'OTP sent successfully',
                data: {
                    user_id: user.data.id,
                    phone_number: user.data.phone_number,
                    // ⚠️ Remove this in production - only for testing
                    otp: otp
                }
            });
            
        } catch (error) {
            console.error('Login error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Login failed',
                error: error.message
            });
        }
    }
    
    // Verify OTP
    static async verifyOtp(req, res) {
        try {
            const { phone_number, otp } = req.body;
            
            // In production, verify OTP from Redis/session
            // For now, accept any 6-digit OTP for testing
            
            if (otp.length !== 6 || isNaN(otp)) {
                return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid OTP format'
                });
            }
            
            // Find user
            const user = await User.findByPhone(phone_number);
            
            if (!user.success || !user.data) {
                return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Verify user if not already verified
            if (!user.data.is_verified) {
                await User.verifyUser(user.data.id);
            }
            
            // Generate JWT token
            const token = AuthMiddleware.generateToken(user.data.id);
            
            // Update last login
            await db.pool.execute(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [user.data.id]
            );
            
            // Create session
            const sessionToken = Helpers.generateRandomString(32);
            await db.pool.execute(
                `INSERT INTO sessions (user_id, session_token, expires_at) 
                 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
                [user.data.id, sessionToken]
            );
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    session_token: sessionToken,
                    user: {
                        id: user.data.id,
                        name: user.data.name,
                        phone_number: user.data.phone_number,
                        email: user.data.email,
                        upi_id: user.data.upi_id,
                        is_verified: true,
                        monthly_limit: user.data.monthly_limit,
                        current_spent: user.data.current_spent
                    }
                }
            });
            
        } catch (error) {
            console.error('OTP verification error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Verification failed',
                error: error.message
            });
        }
    }
    
    // Resend OTP
    static async resendOtp(req, res) {
        try {
            const { phone_number } = req.body;
            
            // Find user
            const user = await User.findByPhone(phone_number);
            
            if (!user.success || !user.data) {
                return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Generate new OTP
            const otp = Helpers.generateOTP();
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'OTP resent successfully',
                // ⚠️ Remove this in production
                data: { otp }
            });
            
        } catch (error) {
            console.error('Resend OTP error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to resend OTP',
                error: error.message
            });
        }
    }
    
    // Logout
    static async logout(req, res) {
        try {
            const sessionToken = req.headers.authorization?.split(' ')[1];
            
            if (sessionToken) {
                // Invalidate session
                await db.pool.execute(
                    'UPDATE sessions SET is_active = false WHERE session_token = ?',
                    [sessionToken]
                );
            }
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'Logged out successfully'
            });
            
        } catch (error) {
            console.error('Logout error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Logout failed',
                error: error.message
            });
        }
    }
    
    // Get current user profile
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;
            
            const user = await User.getUserDetails(userId);
            
            if (!user.success || !user.data) {
                return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Get unread notifications count
            const unreadCount = await User.getUnreadCount(userId);
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                data: {
                    ...user.data,
                    password_hash: undefined,
                    pin_hash: undefined,
                    unread_notifications: unreadCount.data || 0
                }
            });
            
        } catch (error) {
            console.error('Get profile error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to get profile',
                error: error.message
            });
        }
    }
    
    // Update profile
    static async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const updateData = req.body;
            
            const result = await User.update(userId, updateData);
            
            if (!result.success) {
                return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: result.error || 'Failed to update profile'
                });
            }
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'Profile updated successfully'
            });
            
        } catch (error) {
            console.error('Update profile error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message
            });
        }
    }
    
    // Set UPI PIN
    static async setUpiPin(req, res) {
        try {
            const userId = req.user.id;
            const { pin, confirm_pin } = req.body;
            
            if (pin !== confirm_pin) {
                return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'PINs do not match'
                });
            }
            
            if (pin.length !== 4 || isNaN(pin)) {
                return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'PIN must be 4 digits'
                });
            }
            
            const result = await User.updateUpiPin(userId, pin);
            
            if (!result.success) {
                return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                    success: false,
                    message: result.error || 'Failed to set PIN'
                });
            }
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'UPI PIN set successfully'
            });
            
        } catch (error) {
            console.error('Set UPI PIN error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to set UPI PIN',
                error: error.message
            });
        }
    }
    
    // Change password
    static async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { current_password, new_password, confirm_password } = req.body;
            
            if (new_password !== confirm_password) {
                return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'New passwords do not match'
                });
            }
            
            if (new_password.length < 6) {
                return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Password must be at least 6 characters'
                });
            }
            
            // Get user with password
            const user = await User.findById(userId);
            
            if (user.data.password_hash) {
                const isValid = await Helpers.comparePassword(
                    current_password, 
                    user.data.password_hash
                );
                
                if (!isValid) {
                    return res.status(constants.HTTP_STATUS.UNAUTHORIZED).json({
                        success: false,
                        message: 'Current password is incorrect'
                    });
                }
            }
            
            const result = await User.updatePassword(userId, new_password);
            
            if (!result.success) {
                return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                    success: false,
                    message: result.error || 'Failed to change password'
                });
            }
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'Password changed successfully'
            });
            
        } catch (error) {
            console.error('Change password error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to change password',
                error: error.message
            });
        }
    }
    
    // Update monthly limit
    static async updateMonthlyLimit(req, res) {
        try {
            const userId = req.user.id;
            const { monthly_limit } = req.body;
            
            if (monthly_limit < 1000 || monthly_limit > 1000000) {
                return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Monthly limit must be between ₹1,000 and ₹10,00,000'
                });
            }
            
            const result = await User.updateMonthlyLimit(userId, monthly_limit);
            
            if (!result.success) {
                return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                    success: false,
                    message: result.error || 'Failed to update limit'
                });
            }
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'Monthly limit updated successfully'
            });
            
        } catch (error) {
            console.error('Update monthly limit error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to update monthly limit',
                error: error.message
            });
        }
    }
    
    // Get user notifications
    static async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            
            const offset = (page - 1) * limit;
            
            const notifications = await User.getNotifications(userId, parseInt(limit), parseInt(offset));
            const unreadCount = await User.getUnreadCount(userId);
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                data: {
                    notifications: notifications.success ? notifications.data : [],
                    unread_count: unreadCount.data || 0,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: notifications.data?.length || 0
                }
            });
            
        } catch (error) {
            console.error('Get notifications error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to get notifications',
                error: error.message
            });
        }
    }
    
    // Mark notification as read
    static async markNotificationRead(req, res) {
        try {
            const userId = req.user.id;
            const { notification_id } = req.params;
            
            const result = await User.markNotificationRead(userId, notification_id);
            
            if (!result.success) {
                return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'Notification not found'
                });
            }
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'Notification marked as read'
            });
            
        } catch (error) {
            console.error('Mark notification read error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to mark notification as read',
                error: error.message
            });
        }
    }
    
    // Mark all notifications as read
    static async markAllNotificationsRead(req, res) {
        try {
            const userId = req.user.id;
            
            const result = await User.markAllNotificationsRead(userId);
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'All notifications marked as read',
                data: {
                    marked: result.data?.affectedRows || 0
                }
            });
            
        } catch (error) {
            console.error('Mark all notifications read error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to mark notifications as read',
                error: error.message
            });
        }
    }
    
    // Delete account (deactivate)
    static async deleteAccount(req, res) {
        try {
            const userId = req.user.id;
            
            const result = await User.delete(userId);
            
            if (!result.success) {
                return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                    success: false,
                    message: result.error || 'Failed to delete account'
                });
            }
            
            // Invalidate all sessions
            await db.pool.execute(
                'UPDATE sessions SET is_active = false WHERE user_id = ?',
                [userId]
            );
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                message: 'Account deactivated successfully'
            });
            
        } catch (error) {
            console.error('Delete account error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to delete account',
                error: error.message
            });
        }
    }
    
    // Refresh token
    static async refreshToken(req, res) {
        return AuthMiddleware.refreshToken(req, res);
    }
    
    // Get user stats
    static async getUserStats(req, res) {
        try {
            const userId = req.user.id;
            
            // Get transaction stats
            const [txnStats] = await db.pool.execute(`
                SELECT 
                    COUNT(*) as total_transactions,
                    SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_spent,
                    COUNT(DISTINCT DATE(created_at)) as active_days,
                    MAX(created_at) as last_transaction
                FROM transactions 
                WHERE user_id = ? AND status = 'success'
            `, [userId]);
            
            // Get coin stats
            const [coinStats] = await db.pool.execute(`
                SELECT 
                    SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END) as active_coins,
                    COUNT(CASE WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
                               AND expiry_date > CURDATE() 
                               AND status = 'active' THEN 1 END) as expiring_soon
                FROM coins 
                WHERE user_id = ?
            `, [userId]);
            
            // Get limit usage
            const [limitStats] = await db.pool.execute(`
                SELECT 
                    COUNT(*) as total_limits,
                    SUM(current_spent) as total_spent_limits,
                    SUM(monthly_limit) as total_budget
                FROM agent_limits 
                WHERE user_id = ? AND is_active = true
            `, [userId]);
            
            return res.status(constants.HTTP_STATUS.OK).json({
                success: true,
                data: {
                    transactions: txnStats[0] || {},
                    coins: coinStats[0] || {},
                    limits: limitStats[0] || {}
                }
            });
            
        } catch (error) {
            console.error('Get user stats error:', error);
            return res.status(constants.HTTP_STATUS.INTERNAL_SERVER).json({
                success: false,
                message: 'Failed to get user stats',
                error: error.message
            });
        }
    }
}

module.exports = AuthController;