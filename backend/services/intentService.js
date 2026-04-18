// backend/services/intentService.js
// Intent detection service for SabAI

class IntentService {
    
    // Detect intent from user message
    detectIntent(message, conversationHistory = []) {
        const msg = message.toLowerCase();
        
        // Check if this is a follow-up to previous conversation
        const lastExchange = conversationHistory.length > 0 ? 
            conversationHistory[conversationHistory.length - 1] : null;
        
        // Order intents
        if (this.isOrderIntent(msg)) {
            return {
                type: 'order',
                subType: this.getOrderSubType(msg),
                confidence: 0.9,
                requiresAction: true
            };
        }
        
        // Payment intents
        if (this.isPaymentIntent(msg)) {
            return {
                type: 'payment',
                subType: this.getPaymentSubType(msg),
                confidence: 0.9,
                requiresAction: true
            };
        }
        
        // Bill payment intents
        if (this.isBillIntent(msg)) {
            return {
                type: 'bill',
                subType: this.getBillSubType(msg),
                confidence: 0.9,
                requiresAction: true
            };
        }
        
        // Reserve Pay intents
        if (this.isReservePayIntent(msg)) {
            return {
                type: 'reserve',
                subType: this.getReserveSubType(msg),
                confidence: 0.9,
                requiresAction: true
            };
        }
        
        // SabAI Gems intents
        if (this.isGemsIntent(msg)) {
            return {
                type: 'gems',
                subType: this.getGemsSubType(msg),
                confidence: 0.9,
                requiresAction: false
            };
        }
        
        // History/orders intents
        if (this.isHistoryIntent(msg)) {
            return {
                type: 'history',
                subType: this.getHistorySubType(msg),
                confidence: 0.9,
                requiresAction: false
            };
        }
        
        // General conversation
        return {
            type: 'chat',
            subType: 'general',
            confidence: 0.5,
            requiresAction: false
        };
    }

    isOrderIntent(msg) {
        const keywords = ['order', 'buy', 'purchase', 'get', 'want', 'deliver', 
                         'pizza', 'burger', 'biryani', 'food', 'grocery', 'shopping',
                         'clothes', 'shirt', 'phone', 'laptop'];
        return keywords.some(keyword => msg.includes(keyword));
    }

    getOrderSubType(msg) {
        if (msg.includes('pizza')) return 'pizza';
        if (msg.includes('burger')) return 'burger';
        if (msg.includes('biryani')) return 'biryani';
        if (msg.includes('grocery') || msg.includes('vegetable') || msg.includes('fruit')) return 'grocery';
        if (msg.includes('shirt') || msg.includes('clothes')) return 'clothing';
        if (msg.includes('phone') || msg.includes('mobile')) return 'electronics';
        if (msg.includes('laptop') || msg.includes('computer')) return 'electronics';
        return 'general';
    }

    isPaymentIntent(msg) {
        const keywords = ['pay', 'payment', 'send money', 'transfer', 'upi'];
        return keywords.some(keyword => msg.includes(keyword));
    }

    getPaymentSubType(msg) {
        if (msg.includes('send')) return 'send';
        if (msg.includes('request')) return 'request';
        return 'pay';
    }

    isBillIntent(msg) {
        const keywords = ['bill', 'electricity', 'water', 'gas', 'broadband', 'dth'];
        return keywords.some(keyword => msg.includes(keyword));
    }

    getBillSubType(msg) {
        if (msg.includes('electricity')) return 'electricity';
        if (msg.includes('water')) return 'water';
        if (msg.includes('gas')) return 'gas';
        if (msg.includes('broadband')) return 'broadband';
        if (msg.includes('dth')) return 'dth';
        return 'general';
    }

    isReservePayIntent(msg) {
        const keywords = ['limit', 'reserve', 'pin-less', 'pinless', 'auto-pay'];
        return keywords.some(keyword => msg.includes(keyword));
    }

    getReserveSubType(msg) {
        if (msg.includes('set') || msg.includes('create')) return 'set';
        if (msg.includes('check') || msg.includes('show')) return 'check';
        if (msg.includes('increase') || msg.includes('decrease')) return 'modify';
        return 'general';
    }

    isGemsIntent(msg) {
        const keywords = ['gem', 'coin', 'reward', 'point'];
        return keywords.some(keyword => msg.includes(keyword));
    }

    getGemsSubType(msg) {
        if (msg.includes('balance') || msg.includes('how many')) return 'balance';
        if (msg.includes('redeem') || msg.includes('use')) return 'redeem';
        if (msg.includes('earn') || msg.includes('get')) return 'earn';
        return 'general';
    }

    isHistoryIntent(msg) {
        const keywords = ['history', 'orders', 'previous', 'past', 'track', 'status'];
        return keywords.some(keyword => msg.includes(keyword));
    }

    getHistorySubType(msg) {
        if (msg.includes('track')) return 'track';
        if (msg.includes('status')) return 'status';
        if (msg.includes('order')) return 'orders';
        return 'history';
    }

    // Extract entities from message
    extractEntities(message) {
        const msg = message.toLowerCase();
        const entities = {};
        
        // Extract price/amount
        const priceMatch = message.match(/₹?(\d+)/);
        if (priceMatch) {
            entities.amount = parseInt(priceMatch[1]);
        }
        
        // Extract quantity
        const quantityMatch = msg.match(/(\d+)\s*(kg|g|liter|ml|piece|dozen)/);
        if (quantityMatch) {
            entities.quantity = parseInt(quantityMatch[1]);
            entities.unit = quantityMatch[2];
        }
        
        // Extract size
        const sizes = ['small', 'medium', 'large', 'xl', 'xxl'];
        for (const size of sizes) {
            if (msg.includes(size)) {
                entities.size = size;
                break;
            }
        }
        
        // Extract color
        const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'orange', 'brown'];
        for (const color of colors) {
            if (msg.includes(color)) {
                entities.color = color;
                break;
            }
        }
        
        return entities;
    }
}

module.exports = new IntentService();