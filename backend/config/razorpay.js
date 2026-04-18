// backend/config/razorpay.js
// Razorpay payment gateway configuration

const Razorpay = require('razorpay');

// Initialize Razorpay with test/live keys
let razorpay;

try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay keys not found in environment variables');
    }
    
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    
    console.log('✅ Razorpay configured successfully');
} catch (error) {
    console.error('❌ Razorpay configuration failed:', error.message);
}

// Verify Razorpay configuration
const verifyConfig = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.warn('⚠️  Razorpay keys not found in environment variables');
        console.warn('   Payment features will not work in test mode');
        return false;
    }
    
    // Check if using test keys
    if (process.env.RAZORPAY_KEY_ID.startsWith('rzp_test')) {
        console.log('   ℹ️  Using Razorpay TEST mode');
    } else {
        console.log('   ℹ️  Using Razorpay LIVE mode');
    }
    
    return true;
};

// Create order
const createOrder = async (amount, currency = 'INR', receipt = null) => {
    try {
        if (!razorpay) {
            throw new Error('Razorpay not initialized');
        }
        
        const options = {
            amount: amount * 100, // Convert to paise
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1
        };
        
        const order = await razorpay.orders.create(options);
        return { success: true, data: order };
    } catch (error) {
        console.error('Razorpay order creation failed:', error);
        return { success: false, error: error.message };
    }
};

// Verify payment signature
const verifyPayment = (paymentId, orderId, signature) => {
    const crypto = require('crypto');
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
    
    return expectedSignature === signature;
};

// Get payment details
const getPaymentDetails = async (paymentId) => {
    try {
        if (!razorpay) {
            throw new Error('Razorpay not initialized');
        }
        const payment = await razorpay.payments.fetch(paymentId);
        return { success: true, data: payment };
    } catch (error) {
        console.error('Failed to fetch payment details:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    razorpay,
    verifyConfig,
    createOrder,
    verifyPayment,
    getPaymentDetails
};