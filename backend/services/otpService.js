// backend/services/otpService.js
// Real OTP service using Twilio

const twilio = require('twilio');
const db = require('../config/database');
const crypto = require('crypto');

class OTPService {
    constructor() {
        this.client = null;
        this.testMode = process.env.NODE_ENV !== 'production';
        this.init();
    }

    init() {
        try {
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            
            if (!accountSid || !authToken) {
                console.warn('⚠️ Twilio credentials not found - using test mode');
                console.log('💡 To enable real SMS, add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env');
                this.testMode = true;
                return;
            }
            
            this.client = twilio(accountSid, authToken);
            console.log('✅ Twilio OTP service initialized');
            
        } catch (error) {
            console.error('❌ Twilio init failed:', error.message);
            this.testMode = true;
        }
    }

    // Generate 6-digit OTP
    generateOTP() {
        return crypto.randomInt(100000, 999999).toString();
    }

    // Store OTP in database
    async storeOTP(phone, otp, purpose = 'login') {
        try {
            // Delete any existing OTPs for this phone
            await db.executeQuery(
                'DELETE FROM otp_verifications WHERE phone = ? AND is_verified = false',
                [phone]
            );

            // Set expiry to 10 minutes from now
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            const query = `
                INSERT INTO otp_verifications (phone, otp_code, purpose, expires_at)
                VALUES (?, ?, ?, ?)
            `;
            
            const result = await db.executeQuery(query, [phone, otp, purpose, expiresAt]);
            
            return result.success;
        } catch (error) {
            console.error('❌ Failed to store OTP:', error);
            return false;
        }
    }

    // Send OTP via SMS
    async sendOTP(phone, otp) {
        try {
            // Format phone number for India
            const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

            if (this.testMode || !this.client) {
                console.log(`📱 [TEST MODE] OTP for ${phone}: ${otp}`);
                return { success: true, message: 'OTP sent (test mode)' };
            }

            // Send actual SMS via Twilio
            const message = await this.client.messages.create({
                body: `Your SabAI Pay verification code is: ${otp}. Valid for 10 minutes.`,
                to: formattedPhone,
                from: process.env.TWILIO_PHONE_NUMBER
            });

            console.log(`✅ OTP sent to ${phone}: ${message.sid}`);
            return { success: true, messageId: message.sid };

        } catch (error) {
            console.error('❌ Failed to send OTP:', error);
            return { success: false, error: error.message };
        }
    }

    // Verify OTP
    async verifyOTP(phone, otp, purpose = 'login') {
        try {
            // Get the latest OTP for this phone
            const query = `
                SELECT * FROM otp_verifications 
                WHERE phone = ? AND otp_code = ? AND purpose = ? 
                AND is_verified = false AND expires_at > NOW()
                ORDER BY created_at DESC LIMIT 1
            `;
            
            const result = await db.getOne(query, [phone, otp, purpose]);

            if (!result.success || !result.data) {
                // Record failed attempt
                await db.executeQuery(
                    'UPDATE otp_verifications SET attempts = attempts + 1 WHERE phone = ? AND purpose = ?',
                    [phone, purpose]
                );
                return { success: false, message: 'Invalid or expired OTP' };
            }

            const otpRecord = result.data;

            // Check attempts
            if (otpRecord.attempts >= 3) {
                return { success: false, message: 'Too many failed attempts. Please request new OTP.' };
            }

            // Mark as verified
            await db.executeQuery(
                'UPDATE otp_verifications SET is_verified = true WHERE id = ?',
                [otpRecord.id]
            );

            return { 
                success: true, 
                message: 'OTP verified successfully',
                data: { verified: true }
            };

        } catch (error) {
            console.error('❌ OTP verification error:', error);
            return { success: false, message: 'Verification failed' };
        }
    }

    // Resend OTP
    async resendOTP(phone, purpose = 'login') {
        try {
            // Check rate limiting (max 3 OTPs per hour)
            const rateCheck = await db.getOne(`
                SELECT COUNT(*) as count FROM otp_verifications 
                WHERE phone = ? AND purpose = ? 
                AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `, [phone, purpose]);

            if (rateCheck.success && rateCheck.data.count >= 3) {
                return { 
                    success: false, 
                    message: 'Too many OTP requests. Please try after 1 hour.' 
                };
            }

            // Generate new OTP
            const otp = this.generateOTP();
            
            // Store in database
            await this.storeOTP(phone, otp, purpose);
            
            // Send via SMS
            const sent = await this.sendOTP(phone, otp);
            
            return sent;

        } catch (error) {
            console.error('❌ Failed to resend OTP:', error);
            return { success: false, message: 'Failed to resend OTP' };
        }
    }

    // Clean up expired OTPs (run via cron job)
    async cleanupExpiredOTPs() {
        try {
            const result = await db.executeQuery(
                'DELETE FROM otp_verifications WHERE expires_at < NOW()'
            );
            console.log(`🧹 Cleaned up ${result.data?.affectedRows || 0} expired OTPs`);
        } catch (error) {
            console.error('❌ Failed to cleanup OTPs:', error);
        }
    }

    // Get OTP status
    async getOTPStatus(phone) {
        try {
            const result = await db.getOne(`
                SELECT 
                    COUNT(*) as total_requests,
                    SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified,
                    MAX(created_at) as last_request
                FROM otp_verifications 
                WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `, [phone]);

            return {
                success: true,
                data: result.data || { total_requests: 0, verified: 0, last_request: null }
            };

        } catch (error) {
            console.error('❌ Failed to get OTP status:', error);
            return { success: false, data: null };
        }
    }
}

module.exports = new OTPService();