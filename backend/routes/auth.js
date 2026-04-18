// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const db = require('../config/database');

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// Generate OTP (6 digits)
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
router.post('/send-otp', async (req, res) => {
    const { phone_number, purpose = 'register' } = req.body;
    
    if (!phone_number || phone_number.length !== 10) {
        return res.status(400).json({ success: false, message: 'Valid phone number required' });
    }
    
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    try {
        // Store OTP in database
        await db.executeQuery(
            `INSERT INTO otp_verifications (phone_number, otp_code, purpose, expires_at) 
             VALUES (?, ?, ?, ?)`,
            [phone_number, otpCode, purpose, expiresAt]
        );
        
        // In development, log OTP instead of sending SMS
        console.log(`📱 OTP for ${phone_number}: ${otpCode}`);
        
        // For demo, always return success with OTP
        if (process.env.NODE_ENV === 'development') {
            return res.json({ 
                success: true, 
                message: 'OTP sent successfully',
                dev_otp: otpCode  // Only in development
            });
        }
        
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { phone_number, otp, purpose = 'register' } = req.body;
    
    try {
        const [rows] = await db.pool.execute(
            `SELECT * FROM otp_verifications 
             WHERE phone_number = ? AND otp_code = ? AND purpose = ? 
             AND is_verified = FALSE AND expires_at > NOW()
             ORDER BY id DESC LIMIT 1`,
            [phone_number, otp, purpose]
        );
        
        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
        
        // Mark OTP as verified
        await db.executeQuery(
            `UPDATE otp_verifications SET is_verified = TRUE WHERE id = ?`,
            [rows[0].id]
        );
        
        res.json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
});

// Register
router.post('/register', async (req, res) => {
    const { phone_number, name, email, password } = req.body;
    
    if (!phone_number || !name) {
        return res.status(400).json({ success: false, message: 'Phone number and name required' });
    }
    
    try {
        // Check if user exists
        const existingUser = await db.getOne(
            `SELECT id FROM users WHERE phone_number = ?`,
            [phone_number]
        );
        
        if (existingUser.success && existingUser.data) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        
        // Hash password if provided
        let passwordHash = null;
        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }
        
        // Create upi_id
        const upiId = `${phone_number}@sabai`;
        
        // Insert user
        const [result] = await db.pool.execute(
            `INSERT INTO users (phone_number, name, email, password_hash, upi_id, is_verified) 
             VALUES (?, ?, ?, ?, ?, TRUE)`,
            [phone_number, name, email || null, passwordHash, upiId]
        );
        
        const userId = result.insertId;
        
        // Initialize coin balance
        await db.executeQuery(
            `INSERT INTO sabai_coins (user_id, balance) VALUES (?, 0)`,
            [userId]
        );
        
        // Generate token
        const token = generateToken(userId);
        
        // Get user data
        const user = await db.getOne(
            `SELECT id, phone_number, name, email, upi_id, profile_pic, is_verified, created_at 
             FROM users WHERE id = ?`,
            [userId]
        );
        
        res.json({
            success: true,
            data: {
                token,
                user: user.data
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { phone_number, password } = req.body;
    
    try {
        const user = await db.getOne(
            `SELECT id, phone_number, name, email, password_hash, upi_id, profile_pic, is_verified 
             FROM users WHERE phone_number = ?`,
            [phone_number]
        );
        
        if (!user.success || !user.data) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        // Verify password if exists
        if (user.data.password_hash) {
            const isValid = await bcrypt.compare(password, user.data.password_hash);
            if (!isValid) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        }
        
        // Update last login
        await db.executeQuery(
            `UPDATE users SET last_login = NOW() WHERE id = ?`,
            [user.data.id]
        );
        
        const token = generateToken(user.data.id);
        
        res.json({
            success: true,
            data: {
                token,
                user: user.data
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Get profile
router.get('/profile', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await db.getOne(
            `SELECT id, phone_number, name, email, upi_id, profile_pic, date_of_birth, gender, is_verified, created_at 
             FROM users WHERE id = ?`,
            [decoded.id]
        );
        
        if (!user.success || !user.data) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, data: user.data });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

module.exports = router;