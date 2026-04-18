// backend/middleware/auth.js
// COMPLETE FIXED VERSION

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const constants = require('../utils/constants');

class AuthMiddleware {
    
    static async verifyToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }
            
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            
            // Handle both possible token structures
            const userId = decoded.userId || decoded.id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token structure'
                });
            }
            
            const user = await User.findById(userId);
            
            if (!user.success || !user.data || !user.data.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found or inactive'
                });
            }
            
            req.user = {
                id: user.data.id,
                phone_number: user.data.phone_number,
                name: user.data.name,
                upi_id: user.data.upi_id,
                is_verified: user.data.is_verified
            };
            
            next();
            
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token',
                    code: 'INVALID_TOKEN'
                });
            }
            
            console.error('Token verification error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authentication error'
            });
        }
    }
    
    static async optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                const userId = decoded.userId || decoded.id;
                
                const user = await User.findById(userId);
                
                if (user.success && user.data && user.data.is_active) {
                    req.user = {
                        id: user.data.id,
                        phone_number: user.data.phone_number,
                        name: user.data.name,
                        upi_id: user.data.upi_id
                    };
                }
            }
            
            next();
            
        } catch (error) {
            // Ignore token errors for optional auth
            next();
        }
    }
    
    static requireVerification(req, res, next) {
        if (!req.user.is_verified) {
            return res.status(403).json({
                success: false,
                message: 'Account not verified. Please complete verification.'
            });
        }
        next();
    }
    
    static async requireUpiPin(req, res, next) {
        const user = await User.findById(req.user.id);
        
        if (!user.success || !user.data.pin_hash) {
            return res.status(403).json({
                success: false,
                message: 'UPI PIN not set. Please set your UPI PIN first.'
            });
        }
        
        next();
    }
    
    static userRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
        const requests = new Map();
        
        return (req, res, next) => {
            const userId = req.user?.id || req.ip;
            const now = Date.now();
            
            if (!requests.has(userId)) {
                requests.set(userId, []);
            }
            
            const userRequests = requests.get(userId);
            
            while (userRequests.length > 0 && userRequests[0] < now - windowMs) {
                userRequests.shift();
            }
            
            if (userRequests.length >= maxRequests) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests, please try again later'
                });
            }
            
            userRequests.push(now);
            next();
        };
    }
    
    static checkResourceOwnership(getResourceUserId) {
        return (req, res, next) => {
            const resourceUserId = getResourceUserId(req);
            
            if (resourceUserId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this resource'
                });
            }
            
            next();
        };
    }
    
    static requireAdmin(req, res, next) {
        next();
    }
    
    static generateToken(userId) {
        return jwt.sign(
            { id: userId },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRY || '7d' }
        );
    }
    
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token required'
                });
            }
            
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key');
            const userId = decoded.userId || decoded.id;
            
            const newToken = this.generateToken(userId);
            
            return res.status(200).json({
                success: true,
                data: {
                    token: newToken
                }
            });
            
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    }
}

module.exports = AuthMiddleware;