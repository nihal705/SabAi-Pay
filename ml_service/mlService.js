const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class MLService {
    constructor() {
        this.mlApiUrl = process.env.ML_API_URL || 'http://localhost:5001';
        // Use simple in-memory cache instead of Redis
        this.cache = new Map();
        this.cacheTTL = 3600 * 1000; // 1 hour in milliseconds
        this.isAvailable = false;
        this.learningDataPath = path.join(__dirname, '../data/learning');
        this.initLearningDataDir();
        this.checkAvailability();
        
        setInterval(() => this.checkAvailability(), 30000);
    }

    async initLearningDataDir() {
        try {
            await fs.mkdir(this.learningDataPath, { recursive: true });
            console.log('📁 Learning data directory ready');
        } catch (error) {
            // Directory already exists or cannot be created
        }
    }

    async checkAvailability() {
        try {
            const response = await axios.get(`${this.mlApiUrl}/health`, { timeout: 3000 });
            this.isAvailable = response.data.status === 'healthy';
            if (this.isAvailable) {
                console.log('🧠 ML Service is online');
            } else {
                console.log('⚠️ ML Service is offline');
            }
        } catch (error) {
            this.isAvailable = false;
            console.log('❌ ML Service unavailable, falling back to rule-based');
        }
    }

    async classifyIntent(message, context = {}) {
        const cacheKey = this.getCacheKey('intent', message, context);
        
        // Check in-memory cache
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            return cached.data;
        }
        
        if (!this.isAvailable) {
            return this.fallbackIntentClassifier(message, context);
        }
        
        try {
            const response = await axios.post(`${this.mlApiUrl}/classify`, {
                text: message,
                context: this.sanitizeContext(context)
            }, { timeout: 2000 });
            
            const result = response.data;
            
            // Store in cache
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
            
            // Learn from this interaction
            await this.learnFromInteraction(message, result.intent, context);
            
            return result;
        } catch (error) {
            console.error('ML classification failed:', error.message);
            return this.fallbackIntentClassifier(message, context);
        }
    }

    async extractEntities(message) {
        const cacheKey = this.getCacheKey('ner', message);
        
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            return cached.data;
        }
        
        if (!this.isAvailable) {
            return this.fallbackEntityExtractor(message);
        }
        
        try {
            const response = await axios.post(`${this.mlApiUrl}/extract-entities`, {
                text: message
            }, { timeout: 2000 });
            
            const result = response.data;
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
            
            return result;
        } catch (error) {
            console.error('Entity extraction failed:', error.message);
            return this.fallbackEntityExtractor(message);
        }
    }

    async generateResponse(intent, entities, context, merchantData) {
        if (!this.isAvailable) {
            return this.fallbackResponseGenerator(intent, entities, context, merchantData);
        }
        
        try {
            const response = await axios.post(`${this.mlApiUrl}/generate-response`, {
                intent: intent,
                entities: entities,
                context: this.sanitizeContext(context),
                merchant_data: merchantData
            }, { timeout: 3000 });
            
            return response.data.response;
        } catch (error) {
            console.error('Response generation failed:', error.message);
            return this.fallbackResponseGenerator(intent, entities, context, merchantData);
        }
    }

    async learnFromInteraction(message, predictedIntent, context, userFeedback = null) {
        try {
            const learningEntry = {
                timestamp: new Date().toISOString(),
                message: message,
                predicted_intent: predictedIntent,
                context: context,
                user_feedback: userFeedback,
                was_correct: userFeedback === true
            };
            
            const filePath = path.join(this.learningDataPath, 'interactions.jsonl');
            await fs.appendFile(filePath, JSON.stringify(learningEntry) + '\n');
        } catch (error) {
            // Silently fail - learning is optional
        }
    }

    // ============================================
    // FALLBACK METHODS (Rule-based)
    // ============================================
    
    fallbackIntentClassifier(message, context) {
        const msg = message.toLowerCase();
        
        // Check for platform-only request
        const platformOnlyPatterns = [
            /^order from (swiggy|zomato|zepto|blinkit|amazon|flipkart)$/i,
            /^i want to order from (swiggy|zomato|zepto|blinkit|amazon|flipkart)$/i,
            /^order (swiggy|zomato|zepto|blinkit|amazon|flipkart)$/i
        ];
        
        if (platformOnlyPatterns.some(p => p.test(message.trim()))) {
            return { intent: 'order_ask_items', confidence: 0.9 };
        }
        
        // Check for menu request
        if (msg.includes('show me menu') || (msg.includes('menu') && msg.includes('from'))) {
            return { intent: 'order_show_menu', confidence: 0.85 };
        }
        
        // Check for situation-based request
        const situationKeywords = ['moving to', 'new to', 'setting up', 'hosting', 'sick', 'fever', 'party', 'exam', 'study'];
        if (situationKeywords.some(kw => msg.includes(kw))) {
            return { intent: 'hybrid_situation_to_order', confidence: 0.8 };
        }
        
        // Check for comparison request
        if (msg.includes('compare') || msg.includes('vs') || msg.includes('which is better')) {
            return { intent: 'general_comparison', confidence: 0.85 };
        }
        
        // Check for schedule request
        if (msg.includes('schedule') || msg.includes('auto-pay') || msg.includes('recurring')) {
            return { intent: 'schedule_new', confidence: 0.85 };
        }
        
        // Check for tracking request
        if (msg.includes('track') || msg.includes('status') || msg.includes('where is')) {
            return { intent: 'tracking_status', confidence: 0.8 };
        }
        
        // Check for cancel request
        if (msg.includes('cancel')) {
            return { intent: 'cancel_order', confidence: 0.85 };
        }
        
        // Order intents
        if (msg.includes('add') || msg.includes('also')) {
            return { intent: 'order_add_items', confidence: 0.75 };
        }
        if (msg.includes('remove') || msg.includes('delete') || msg.includes('take out')) {
            return { intent: 'order_remove_items', confidence: 0.75 };
        }
        if (msg.includes('cart')) {
            if (msg.includes('show') || msg.includes('view') || msg.includes('what')) {
                return { intent: 'order_view_cart', confidence: 0.8 };
            }
        }
        if (msg.includes('checkout') || msg.includes('pay now') || msg.includes('confirm')) {
            return { intent: 'order_checkout', confidence: 0.8 };
        }
        if (msg.includes('order') || msg.includes('buy') || msg.includes('get me')) {
            return { intent: 'order_new', confidence: 0.85 };
        }
        
        // Payment intents
        if (msg.includes('reserve pay') || msg.includes('sabai pay lite')) {
            return { intent: 'payment_auto_pay', confidence: 0.9 };
        }
        if (msg.includes('upi') || msg.includes('gems')) {
            return { intent: 'payment_immediate', confidence: 0.85 };
        }
        
        // Greeting
        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            return { intent: 'general_greeting', confidence: 0.95 };
        }
        
        return { intent: 'general_question', confidence: 0.6 };
    }

    fallbackEntityExtractor(message) {
        const entities = {
            items: [],
            quantities: [],
            restaurants: [],
            merchants: [],
            prices: [],
            times: [],
            dates: [],
            locations: [],
            payment_methods: [],
            order_ids: []
        };
        
        const msg = message.toLowerCase();
        
        // Extract items with quantities
        const itemPattern = /(\d+)\s*(?:x\s*)?([a-z\s]+?)(?=,|$|and|or|\.)/gi;
        let match;
        while ((match = itemPattern.exec(msg)) !== null) {
            const itemName = match[2].trim();
            if (itemName.length > 2 && !['and', 'or', 'the', 'from'].includes(itemName)) {
                entities.items.push({ name: itemName });
                entities.quantities.push({ value: match[1] });
            }
        }
        
        // Extract merchants
        const merchants = ['swiggy', 'zomato', 'zepto', 'blinkit', 'amazon', 'flipkart', 'netmeds', 'pharmeasy'];
        for (const merchant of merchants) {
            if (msg.includes(merchant)) {
                entities.merchants.push({ name: merchant });
            }
        }
        
        // Extract restaurants
        const restaurants = ['paradise', 'meghana', 'kanti', 'empire', 'toit', 'mtr', 'dominos', 'pizza hut', 'kfc', 'mcdonalds'];
        for (const restaurant of restaurants) {
            if (msg.includes(restaurant)) {
                entities.restaurants.push({ name: restaurant });
            }
        }
        
        // Extract payment methods
        if (msg.includes('upi')) entities.payment_methods.push({ name: 'upi' });
        if (msg.includes('reserve pay')) entities.payment_methods.push({ name: 'reserve_pay' });
        if (msg.includes('gems')) entities.payment_methods.push({ name: 'gems' });
        
        // Extract times
        const timePattern = /(\d{1,2})\s*(?:am|pm)/i;
        const timeMatch = msg.match(timePattern);
        if (timeMatch) entities.times.push({ value: timeMatch[0] });
        if (msg.includes('tonight')) entities.times.push({ value: 'tonight' });
        if (msg.includes('tomorrow')) entities.times.push({ value: 'tomorrow' });
        
        return { entities };
    }

    fallbackResponseGenerator(intent, entities, context, merchantData) {
        const responses = {
            'order_new': '🛍️ What would you like to order? Please specify items with quantities.\n\nExample: "2 Chicken Biryani, 1 Paneer Tikka from Swiggy"',
            'order_ask_items': '🛍️ What would you like to order? Please specify items with quantities.\n\nExample: "2 Chicken Biryani, 1 Paneer Tikka"',
            'order_show_menu': '📋 Sure! Let me show you the menu. Please tell me which restaurant you\'d like to see the menu from.',
            'order_add_items': `✅ Items added to your cart! Your cart now has ${context.cart?.length || 0} item(s).`,
            'order_remove_items': `🗑️ Removed items from your cart. Your cart now has ${context.cart?.length || 0} item(s).`,
            'order_view_cart': this.formatCartResponse(context.cart, context.total),
            'order_checkout': `💳 Your cart total is ₹${context.total || 0}. Please select a payment method.`,
            'schedule_new': '📅 When would you like to schedule this order? Example: "tomorrow at 7 PM"',
            'tracking_status': '📍 Your order is being processed. You\'ll receive updates shortly.',
            'cancel_order': '⚠️ Please confirm you want to cancel this order by typing "CONFIRM CANCEL".',
            'general_comparison': '🔍 Which platforms would you like to compare? Example: "Compare Swiggy and Zomato"',
            'hybrid_situation_to_order': '🧠 I understand your situation. Would you like me to show you recommended items?',
            'payment_immediate': '💳 Please select a payment method: UPI, Reserve Pay, or SabAI Gems.',
            'payment_auto_pay': '🔄 To set up Auto-Pay, please specify amount and schedule.',
            'general_greeting': '👋 Hello! I\'m SabAI. How can I help you today?',
            'general_question': 'How can I help you? You can order food, track orders, or schedule payments.'
        };
        
        return responses[intent] || responses['general_question'];
    }

    formatCartResponse(cart, total) {
        if (!cart || cart.length === 0) {
            return "🛒 Your cart is empty. Add some items to get started!";
        }
        
        let response = "**Your Cart:**\n\n";
        cart.forEach(item => {
            response += `• ${item.quantity}x ${item.name} - ₹${(item.price * item.quantity).toLocaleString()}\n`;
        });
        response += `\n**Total: ₹${total?.toLocaleString() || 0}**\n\n`;
        response += `Would you like to proceed to checkout?`;
        
        return response;
    }

    getCacheKey(prefix, message, context = {}) {
        const hash = crypto.createHash('md5')
            .update(`${message}${JSON.stringify(context)}`)
            .digest('hex');
        return `${prefix}:${hash}`;
    }

    sanitizeContext(context) {
        const sanitized = { ...context };
        delete sanitized.merchantData;
        delete sanitized.fullConversation;
        delete sanitized.rawCart;
        return sanitized;
    }
}

module.exports = new MLService();
