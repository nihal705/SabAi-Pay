// backend/services/fallbackService.js
// Comprehensive fallback when ML service is unavailable

class FallbackService {
    constructor() {
        this.fallbackResponses = {
            order: {
                templates: [
                    "What would you like to order? Please specify items with quantities.",
                    "I'd be happy to help you order. What items would you like to add to your cart?",
                    "Let's get your order started. Please tell me what you'd like to order and from which platform."
                ]
            },
            payment: {
                templates: [
                    "Please select a payment method: UPI, Reserve Pay, or SabAI Gems.",
                    "How would you like to pay? You can use UPI, Reserve Pay, or your SabAI Gems.",
                    "Let's complete your payment. Choose your preferred payment method."
                ]
            },
            tracking: {
                templates: [
                    "Your order is being processed. You'll receive updates shortly.",
                    "Let me check the status of your order. Please provide your order ID if you have it.",
                    "I can help track your order. Could you share your order ID or the merchant name?"
                ]
            },
            schedule: {
                templates: [
                    "When would you like to schedule this order? Please specify date and time.",
                    "I can help schedule your order. What date and time works for you?",
                    "Let's set up a scheduled order. Please tell me when you'd like it delivered."
                ]
            },
            general: {
                templates: [
                    "How can I help you today? You can order food, groceries, schedule payments, or track orders.",
                    "I'm here to assist with payments, orders, and more. What would you like to do?",
                    "Need help with ordering, payments, or tracking? Just let me know!"
                ]
            }
        };
    }
    
    getResponse(intent, context = {}) {
        let category = this.getCategoryFromIntent(intent);
        let templates = this.fallbackResponses[category]?.templates || this.fallbackResponses.general.templates;
        
        let response = templates[Math.floor(Math.random() * templates.length)];
        
        // Personalize based on context
        if (context.merchant && response.includes('platform')) {
            response = response.replace('platform', context.merchant);
        }
        
        if (context.cartLength > 0 && response.includes('cart')) {
            response = `Your cart has ${context.cartLength} item(s). ${response}`;
        }
        
        return response;
    }
    
    getCategoryFromIntent(intent) {
        if (intent.startsWith('order_')) return 'order';
        if (intent.startsWith('payment_')) return 'payment';
        if (intent.startsWith('tracking_')) return 'tracking';
        if (intent.startsWith('schedule_')) return 'schedule';
        return 'general';
    }
    
    extractItems(message) {
        const items = [];
        const pattern = /(\d+)\s*(?:x\s*)?([a-z\s]+?)(?=,|$|and|or|\.)/gi;
        let match;
        
        while ((match = pattern.exec(message.toLowerCase())) !== null) {
            const itemName = match[2].trim();
            if (itemName.length > 2 && !['and', 'or', 'the', 'from', 'with'].includes(itemName)) {
                items.push({
                    name: itemName,
                    quantity: parseInt(match[1]) || 1
                });
            }
        }
        
        return items;
    }
    
    extractMerchant(message) {
        const merchants = ['swiggy', 'zomato', 'zepto', 'blinkit', 'amazon', 'flipkart'];
        const msg = message.toLowerCase();
        
        for (const merchant of merchants) {
            if (msg.includes(merchant)) {
                return merchant;
            }
        }
        
        return null;
    }
    
    async processUserMessage(message, session) {
        const msg = message.toLowerCase();
        
        // Determine intent
        let intent = 'general_question';
        if (msg.includes('order') || msg.includes('buy') || msg.includes('get me')) {
            intent = 'order_new';
        } else if (msg.includes('track') || msg.includes('status')) {
            intent = 'tracking_status';
        } else if (msg.includes('schedule')) {
            intent = 'schedule_new';
        } else if (msg.includes('pay') || msg.includes('payment')) {
            intent = 'payment_immediate';
        } else if (msg.includes('hello') || msg.includes('hi')) {
            intent = 'general_greeting';
        }
        
        // Extract entities
        const items = this.extractItems(message);
        const merchant = this.extractMerchant(message);
        
        // Generate response
        const response = this.getResponse(intent, {
            merchant: merchant,
            cartLength: session.cart?.length || 0
        });
        
        return {
            intent: intent,
            confidence: 0.7,
            response: response,
            entities: { items, merchants: merchant ? [{ name: merchant }] : [] }
        };
    }
}

module.exports = new FallbackService();