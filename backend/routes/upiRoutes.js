// backend/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');

// Helper function to generate JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// Helper function to generate OTP
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    try {
        await db.executeQuery(
            `INSERT INTO otp_verifications (phone_number, otp_code, purpose, expires_at) 
             VALUES (?, ?, ?, ?)`,
            [phone_number, otpCode, purpose, expiresAt]
        );
        
        console.log(`📱 OTP for ${phone_number}: ${otpCode}`);
        
        res.json({ 
            success: true, 
            message: 'OTP sent successfully',
            dev_otp: otpCode 
        });
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
        const existingUser = await db.getOne(
            `SELECT id FROM users WHERE phone_number = ?`,
            [phone_number]
        );
        
        if (existingUser.success && existingUser.data) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        
        let passwordHash = null;
        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }
        
        const upiId = `${phone_number}@sabai`;
        
        const [result] = await db.pool.execute(
            `INSERT INTO users (phone_number, name, email, password_hash, upi_id, is_verified) 
             VALUES (?, ?, ?, ?, ?, TRUE)`,
            [phone_number, name, email || null, passwordHash, upiId]
        );
        
        const userId = result.insertId;
        
        await db.executeQuery(
            `INSERT INTO sabai_coins (user_id, balance) VALUES (?, 0)`,
            [userId]
        );
        
        const token = generateToken(userId);
        
        const user = await db.getOne(
            `SELECT id, phone_number, name, email, upi_id, profile_pic, is_verified, created_at 
             FROM users WHERE id = ?`,
            [userId]
        );
        
        res.json({
            success: true,
            data: { token, user: user.data }
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
        
        if (user.data.password_hash) {
            const isValid = await bcrypt.compare(password, user.data.password_hash);
            if (!isValid) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        }
        
        await db.executeQuery(
            `UPDATE users SET last_login = NOW() WHERE id = ?`,
            [user.data.id]
        );
        
        const token = generateToken(user.data.id);
        
        res.json({
            success: true,
            data: { token, user: user.data }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Get Profile
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

// Update Profile
router.put('/profile', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { name, email, profile_pic, date_of_birth, gender } = req.body;
        
        const updates = [];
        const values = [];
        
        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (email) {
            updates.push('email = ?');
            values.push(email);
        }
        if (profile_pic) {
            updates.push('profile_pic = ?');
            values.push(profile_pic);
        }
        if (date_of_birth) {
            updates.push('date_of_birth = ?');
            values.push(date_of_birth);
        }
        if (gender) {
            updates.push('gender = ?');
            values.push(gender);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No updates provided' });
        }
        
        values.push(decoded.id);
        
        await db.executeQuery(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        const user = await db.getOne(
            `SELECT id, phone_number, name, email, upi_id, profile_pic, date_of_birth, gender, is_verified, created_at 
             FROM users WHERE id = ?`,
            [decoded.id]
        );
        
        res.json({ success: true, data: user.data });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

module.exports = router;