// backend/services/razorpayService.js
// Razorpay payment service

const Razorpay = require('razorpay');
const crypto = require('crypto');
const constants = require('../utils/constants');

class RazorpayService {
    
    constructor() {
        this.razorpay = null;
        this.initialized = false;
        this.init();
    }
    
    // Initialize Razorpay
    init() {
        try {
            if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
                console.warn('⚠️  Razorpay keys not found. Payment features will be in test mode.');
                return;
            }
            
            this.razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET
            });
            
            this.initialized = true;
            console.log('✅ Razorpay Service initialized');
        } catch (error) {
            console.error('❌ Razorpay Service initialization failed:', error.message);
        }
    }
    
    // Create order
    async createOrder(amount, currency = 'INR', receipt = null, notes = {}) {
        try {
            if (!this.initialized) {
                return this.getMockOrder(amount, currency);
            }
            
            const options = {
                amount: amount * 100, // Convert to paise
                currency: currency,
                receipt: receipt || `receipt_${Date.now()}`,
                notes: notes,
                payment_capture: 1
            };
            
            const order = await this.razorpay.orders.create(options);
            
            return {
                success: true,
                data: {
                    id: order.id,
                    amount: order.amount / 100,
                    currency: order.currency,
                    receipt: order.receipt,
                    status: order.status
                }
            };
            
        } catch (error) {
            console.error('Razorpay order creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Verify payment signature
    verifyPayment(orderId, paymentId, signature) {
        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');
        
        return expectedSignature === signature;
    }
    
    // Fetch payment details
    async getPaymentDetails(paymentId) {
        try {
            if (!this.initialized) {
                return this.getMockPayment(paymentId);
            }
            
            const payment = await this.razorpay.payments.fetch(paymentId);
            
            return {
                success: true,
                data: payment
            };
            
        } catch (error) {
            console.error('Failed to fetch payment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Capture payment
    async capturePayment(paymentId, amount) {
        try {
            if (!this.initialized) {
                return { success: true, data: { id: paymentId, captured: true } };
            }
            
            const payment = await this.razorpay.payments.capture(paymentId, amount * 100);
            
            return {
                success: true,
                data: payment
            };
            
        } catch (error) {
            console.error('Failed to capture payment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Refund payment
    async refundPayment(paymentId, amount = null) {
        try {
            if (!this.initialized) {
                return { success: true, data: { id: paymentId, refunded: true } };
            }
            
            const options = amount ? { amount: amount * 100 } : {};
            const refund = await this.razorpay.payments.refund(paymentId, options);
            
            return {
                success: true,
                data: refund
            };
            
        } catch (error) {
            console.error('Failed to refund payment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Get mock order for testing
    getMockOrder(amount, currency) {
        return {
            success: true,
            data: {
                id: `mock_order_${Date.now()}`,
                amount: amount,
                currency: currency,
                receipt: `receipt_${Date.now()}`,
                status: 'created'
            }
        };
    }
    
    // Get mock payment for testing
    getMockPayment(paymentId) {
        return {
            success: true,
            data: {
                id: paymentId,
                amount: 50000,
                currency: 'INR',
                status: 'captured',
                method: 'upi',
                vpa: 'test@okhdfcbank'
            }
        };
    }
    
    // Generate payment link
    async createPaymentLink(amount, description, customer = {}) {
        try {
            if (!this.initialized) {
                return {
                    success: true,
                    data: {
                        id: `link_${Date.now()}`,
                        short_url: 'https://rzp.io/i/mock',
                        amount: amount * 100
                    }
                };
            }
            
            const options = {
                amount: amount * 100,
                currency: 'INR',
                description: description,
                customer: {
                    name: customer.name || 'Customer',
                    email: customer.email || '',
                    contact: customer.phone || ''
                },
                notify: {
                    sms: true,
                    email: true
                },
                reminder_enable: true
            };
            
            const link = await this.razorpay.paymentLink.create(options);
            
            return {
                success: true,
                data: link
            };
            
        } catch (error) {
            console.error('Failed to create payment link:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Verify webhook signature
    verifyWebhookSignature(body, signature, secret) {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(body))
            .digest('hex');
        
        return expectedSignature === signature;
    }
    
    // Handle webhook events
    async handleWebhookEvent(event) {
        const { event: eventType, payload } = event;
        
        switch(eventType) {
            case 'payment.captured':
                return this.handlePaymentCaptured(payload.payment.entity);
                
            case 'payment.failed':
                return this.handlePaymentFailed(payload.payment.entity);
                
            case 'order.paid':
                return this.handleOrderPaid(payload.order.entity);
                
            default:
                return { handled: false };
        }
    }
    
    // Handle payment captured
    async handlePaymentCaptured(payment) {
        console.log('Payment captured:', payment.id);
        return {
            handled: true,
            action: 'update_transaction',
            data: {
                payment_id: payment.id,
                status: 'success',
                amount: payment.amount / 100
            }
        };
    }
    
    // Handle payment failed
    async handlePaymentFailed(payment) {
        console.log('Payment failed:', payment.id);
        return {
            handled: true,
            action: 'update_transaction',
            data: {
                payment_id: payment.id,
                status: 'failed',
                error: payment.error_description
            }
        };
    }
    
    // Handle order paid
    async handleOrderPaid(order) {
        console.log('Order paid:', order.id);
        return {
            handled: true,
            action: 'update_order',
            data: {
                order_id: order.id,
                status: 'paid'
            }
        };
    }
    
    // Check if service is available
    isAvailable() {
        return this.initialized;
    }
}

module.exports = new RazorpayService();