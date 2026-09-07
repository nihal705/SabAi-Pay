const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const databaseService = require('../services/databaseService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const PHONE = /^[6-9]\d{9}$/;
const PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

function tokenFor(userId) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'sabai-pay', audience: 'sabai-pay-web' });
}

function publicUser(user) {
  return { id: user.id, phone_number: user.phone_number, name: user.name, email: user.email, upi_id: user.upi_id, profile_pic: user.profile_pic, date_of_birth: user.date_of_birth, gender: user.gender, is_verified: user.is_verified, created_at: user.created_at };
}

function validPhone(phone) { return typeof phone === 'string' && PHONE.test(phone); }

router.post('/check-phone', async (req, res, next) => {
  try {
    if (!validPhone(req.body.phone_number)) return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian phone number' });
    const user = await databaseService.getUserByPhone(req.body.phone_number);
    return res.json({ success: true, exists: Boolean(user), message: user ? 'Account exists. Please sign in.' : 'Account not found. Please register.', user: user ? { name: user.name, phone: user.phone_number } : undefined });
  } catch (error) { return next(error); }
});

router.post('/send-otp', async (req, res, next) => {
  try {
    const { phone_number: phone, purpose = 'register' } = req.body;
    if (!validPhone(phone) || !['register', 'login', 'reset'].includes(purpose)) return res.status(400).json({ success: false, message: 'Valid phone number and purpose are required' });
    const user = await databaseService.getUserByPhone(phone);
    if (purpose === 'register' && user) return res.status(409).json({ success: false, message: 'Phone number is already registered' });
    if (purpose !== 'register' && !user) return res.status(404).json({ success: false, message: 'Account not found' });

    const otp = String(crypto.randomInt(100000, 1000000));
    await databaseService.saveOTP(phone, await bcrypt.hash(otp, 12), purpose);
    if (process.env.OTP_PROVIDER !== 'twilio' && process.env.NODE_ENV === 'production') return res.status(503).json({ success: false, message: 'SMS verification is not configured' });
    const payload = { success: true, message: 'Verification code sent' };
    if (process.env.ENABLE_DEV_OTP === 'true' && process.env.NODE_ENV !== 'production') payload.dev_otp = otp;
    return res.status(202).json(payload);
  } catch (error) { return next(error); }
});

router.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone_number: phone, otp, purpose = 'register' } = req.body;
    if (!validPhone(phone) || !/^\d{6}$/.test(String(otp)) || !['register', 'login', 'reset'].includes(purpose)) return res.status(400).json({ success: false, message: 'Invalid verification request' });
    const record = await databaseService.getLatestOTP(phone, purpose);
    if (!record || record.attempts >= 5) return res.status(400).json({ success: false, message: 'Verification code is invalid or expired' });
    if (!(await bcrypt.compare(String(otp), record.otp_hash))) {
      await databaseService.markOTPAttempt(record.id, false);
      return res.status(400).json({ success: false, message: 'Verification code is invalid or expired' });
    }
    await databaseService.markOTPAttempt(record.id, true);
    return res.json({ success: true, message: 'Phone number verified' });
  } catch (error) { return next(error); }
});

router.post('/register', async (req, res, next) => {
  try {
    const { phone_number: phone, name, email = null, password } = req.body;

    if (!validPhone(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Enter a valid 10-digit Indian phone number' 
      });
    }
    
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name must be at least 2 characters' 
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    // Check if phone is verified
    if (!await databaseService.hasVerifiedOTP(phone, 'register')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Verify your phone number before registering' 
      });
    }
    
    // Check if user exists
    if (await databaseService.getUserByPhone(phone)) {
      return res.status(409).json({ 
        success: false, 
        message: 'Phone number is already registered' 
      });
    }
    
    // Create user - email is optional
    const user = await databaseService.createUser(
      phone, 
      name.trim(), 
      email?.trim()?.toLowerCase() || null, 
      await bcrypt.hash(password, 10)
    );
    
    return res.status(201).json({
      success: true,
      data: {
        token: tokenFor(user.id),
        user: publicUser(user)
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { phone_number: phone, password } = req.body;
    if (!validPhone(phone) || typeof password !== 'string') return res.status(400).json({ success: false, message: 'Phone number and password are required' });
    const user = await databaseService.getUserByPhone(phone);
    if (!user || !user.is_active || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ success: false, message: 'Invalid phone number or password' });
    await databaseService.updateLastLogin(user.id);
    return res.json({ success: true, data: { token: tokenFor(user.id), user: publicUser(user) } });
  } catch (error) { return next(error); }
});

router.post('/login-with-otp', async (req, res, next) => {
  try {
    const { phone_number: phone } = req.body;
    if (!validPhone(phone) || !await databaseService.hasVerifiedOTP(phone, 'login')) return res.status(403).json({ success: false, message: 'Verify your phone number first' });
    const user = await databaseService.getUserByPhone(phone);
    if (!user || !user.is_active) return res.status(401).json({ success: false, message: 'Account is unavailable' });
    await databaseService.updateLastLogin(user.id);
    return res.json({ success: true, data: { token: tokenFor(user.id), user: publicUser(user) } });
  } catch (error) { return next(error); }
});

router.get('/profile', verifyToken, async (req, res, next) => {
  try { return res.json({ success: true, data: publicUser(await databaseService.getUserById(req.user.id)) }); } catch (error) { return next(error); }
});

router.put('/profile', verifyToken, async (req, res, next) => {
  try { return res.json({ success: true, data: publicUser(await databaseService.updateUserProfile(req.user.id, req.body)) }); } catch (error) { return next(error); }
});

module.exports = router;
