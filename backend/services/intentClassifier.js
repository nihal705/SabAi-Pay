// backend/services/intentClassifier.js
// COMPLETE INTENT CLASSIFIER - Runs on EVERY message

class IntentClassifier {
    constructor() {
        this.orderKeywords = [
            'order', 'buy', 'purchase', 'get me', 'i want', 'add to cart',
            'checkout', 'pay', 'deliver', 'schedule', 'book', 'reserve',
            'need', 'want', 'please order', 'could i get', 'can i have'
        ];
        
        this.generalKeywords = [
            'how', 'what', 'why', 'when', 'where', 'who', 'tell me',
            'explain', 'suggest', 'recommend', 'help', 'advice',
            'hello', 'hi', 'hey', 'thanks', 'thank you'
        ];
        
        this.situationKeywords = [
            'shifting', 'moving', 'staying', 'living', 'pg', 'hostel',
            'sick', 'fever', 'cold', 'hungry', 'tired', 'busy',
            'cooking', 'home', 'kitchen', 'room', 'house', 'apartment'
        ];
        
        this.platformKeywords = [
            'swiggy', 'zomato', 'zepto', 'blinkit', 'amazon', 'flipkart',
            'netmeds', 'pharmeasy', 'myntra', 'ajio', 'bigbasket', 'dmart'
        ];
        
        this.itemKeywords = [
            'biryani', 'pizza', 'burger', 'paneer', 'chicken', 'rice',
            'bread', 'milk', 'soap', 'shampoo', 'toothpaste', 'medicine'
        ];
    }

    // backend/services/intentClassifier.js
// Update the classify method

classify(message, sessionContext = {}) {
    const msg = message.toLowerCase().trim();
    
    // ============================================
    // FIRST: Check for GENERAL QUERIES (should NOT be order)
    // ============================================
    
    // Comparison keywords (definitely general, not order)
    const comparisonKeywords = [
        'compare', 'better', 'best price', 'which is better', 'which merchant',
        'difference between', 'vs', 'versus', 'compare prices', 'compare quality'
    ];
    if (comparisonKeywords.some(k => msg.includes(k))) {
        console.log('🎯 Intent detected: general (comparison query)');
        return { intent: 'general', confidence: 'high', subType: 'comparison_query' };
    }
    
    // Question words (likely general)
    const questionWords = ['how', 'what', 'why', 'when', 'where', 'who', 'which', 'can you', 'could you', 'would you'];
    if (questionWords.some(k => msg.startsWith(k) || msg.includes(` ${k} `))) {
        // But check if it's still order-related (e.g., "what items do you have")
        const orderRelatedQuestion = msg.includes('order') || msg.includes('menu') || msg.includes('items');
        if (!orderRelatedQuestion) {
            console.log('🎯 Intent detected: general (question)');
            return { intent: 'general', confidence: 'high', subType: 'general_question' };
        }
    }
    
    // Advice/recommendation keywords
    const adviceKeywords = ['suggest', 'recommend', 'advice', 'help me decide', 'what should i', 'which one'];
    if (adviceKeywords.some(k => msg.includes(k)) && !msg.includes('order')) {
        console.log('🎯 Intent detected: general (advice)');
        return { intent: 'general', confidence: 'high', subType: 'advice' };
    }
    
    // Situation description (long message, no clear order intent)
    if (msg.length > 50 && !msg.includes('order') && !msg.includes('buy') && !msg.includes('get me')) {
        console.log('🎯 Intent detected: general (situation description)');
        return { intent: 'general', confidence: 'medium', subType: 'situation' };
    }
    
    // ============================================
    // CHECK FOR ORDER INTENT
    // ============================================
    
    const hasPlatform = this.platformKeywords.some(p => msg.includes(p));
    const hasOrderSignal = this.orderKeywords.some(k => msg.includes(k)) || 
                           /\d+\s*(?:kg|piece|plate|bowl|biryani|pizza|burger)/i.test(msg);
    const hasSituationSignal = this.situationKeywords.some(k => msg.includes(k));
    const inOrderFlow = sessionContext.cart?.length > 0;
    
    // Check if message is just a platform request (no items, no restaurant)
    const platformOnlyPatterns = [
        /^order from (swiggy|zomato|zepto|blinkit|amazon|flipkart)$/i,
        /^i want to order from (swiggy|zomato|zepto|blinkit|amazon|flipkart)$/i,
        /^order (swiggy|zomato|zepto|blinkit|amazon|flipkart)$/i
    ];
    const isPlatformOnly = platformOnlyPatterns.some(p => p.test(msg));
    
    if (isPlatformOnly) {
        console.log('🎯 Intent detected: order (platform only)');
        return { intent: 'order', confidence: 'high', subType: 'platform_only', merchant: this.extractMerchant(msg) };
    }
    
    // Restaurant menu request
    const hasRestaurantName = this.hasRestaurantName(msg);
    const isMenuRequest = (msg.includes('show me menu') || msg.includes('menu from')) && hasRestaurantName;
    
    if (isMenuRequest) {
        console.log('🎯 Intent detected: order (restaurant menu)');
        return { intent: 'order', confidence: 'high', subType: 'restaurant_menu' };
    }
    
    // Order with items
    if (hasPlatform && (hasOrderSignal || msg.length < 100)) {
        console.log('🎯 Intent detected: order (new order)');
        return { intent: 'order', confidence: 'high', subType: 'new_order', merchant: this.extractMerchant(msg) };
    }
    
    // Situation to order (hybrid)
    if (hasSituationSignal && !hasOrderSignal && msg.length > 30) {
        console.log('🎯 Intent detected: hybrid (situation to order)');
        return { intent: 'hybrid', confidence: 'high', subType: 'situation_to_order' };
    }
    
    // Interrupt order (user in order flow but asked something else)
    if (inOrderFlow && !hasOrderSignal && !hasPlatform) {
        console.log('🎯 Intent detected: hybrid (interrupt order)');
        return { intent: 'hybrid', confidence: 'high', subType: 'interrupt_order' };
    }
    
    // Continue order
    if (inOrderFlow && (msg === 'continue' || msg === 'yes' || msg === 'ok' || msg === '1')) {
        console.log('🎯 Intent detected: order (continue)');
        return { intent: 'order_continue', confidence: 'high', subType: 'continue_order' };
    }
    
    // Need platform
    if (hasOrderSignal && !hasPlatform) {
        console.log('🎯 Intent detected: order (need platform)');
        return { intent: 'order_ask_platform', confidence: 'medium', subType: 'need_platform' };
    }
    
    // Default to general
    console.log('🎯 Intent detected: general (default)');
    return { intent: 'general', confidence: 'low', subType: 'unknown' };
}

// Add helper method to check for restaurant names
hasRestaurantName(msg) {
    const restaurantNames = [
        'paradise', 'kanti sweets', 'mcdonald', 'kfc', 'burger king', 
        'pizza hut', 'dominos', 'taco bell', 'starbucks', 'cafe coffee day',
        'paradise biryani', 'kanti', 'mcdonalds'
    ];
    return restaurantNames.some(name => msg.includes(name));
}

    extractMerchant(message) {
        const msg = message.toLowerCase();
        for (const merchant of this.platformKeywords) {
            if (msg.includes(merchant)) {
                return merchant;
            }
        }
        return null;
    }

    extractItemsFromMessage(message) {
    const items = [];
    const msg = message.toLowerCase();
    
    console.log('🔍 Extracting potential item names from:', msg);
    
    // Skip if message is a comparison or general query
    const comparisonKeywords = ['compare', 'better', 'best price', 'which is better', 'difference', 'vs', 'versus'];
    if (comparisonKeywords.some(k => msg.includes(k))) {
        console.log('Message is a comparison query, not extracting items');
        return [];
    }
    
    // Skip if message is a question
    const questionWords = ['how', 'what', 'why', 'when', 'where', 'who', 'which', 'can you', 'could you'];
    if (questionWords.some(k => msg.startsWith(k) || msg.includes(` ${k} `))) {
        // But allow if it's asking for menu
        if (!msg.includes('menu') && !msg.includes('items')) {
            console.log('Message is a question, not extracting items');
            return [];
        }
    }
    
    const platformKeywords = ['swiggy', 'zomato', 'zepto', 'blinkit', 'amazon', 'flipkart', 'netmeds', 'pharmeasy'];
    const trimmedMsg = msg.trim();
    
    // If message is exactly or starts with a platform name with common words
    if (platformKeywords.some(platform => {
        return trimmedMsg === platform || 
               trimmedMsg === `order from ${platform}` || 
               trimmedMsg === `i want to order from ${platform}` ||
               trimmedMsg === `order from ${platform} near me`;
    })) {
        console.log('Message is only a platform request, not extracting as item');
        return [];
    }
    
    // Pattern: number followed by words (could be item names)
    const quantityPattern = /(\d+)\s*(?:kg|packet|piece|plate|pc)?\s*([a-z\s]+?)(?=,|$|and|or|\.|for|\d+)/gi;
    let match;
    
    while ((match = quantityPattern.exec(msg)) !== null) {
        const quantity = parseInt(match[1]);
        let potentialItemName = match[2].trim();
        
        potentialItemName = potentialItemName.replace(/[,\s]+$/, '').trim();
        
        // Skip if potential item name is a platform keyword
        if (platformKeywords.includes(potentialItemName.toLowerCase())) {
            continue;
        }
        
        // Skip common non-item phrases
        const skipPhrases = [
            'i want', 'order', 'from', 'with', 'and', 'the', 'for', 'of', 'to',
            'cheapest', 'best', 'quality', 'please', 'can', 'have', 'get', 'me',
            'schedule', 'list', 'items', 'are', 'tonight', 'auto pay', 'sabai pay',
            'pm', 'am', 'delivery', 'time', 'minute', 'hour', 'near me',
            'food', 'either', 'compare', 'prices', 'which', 'merchant', 'also', 'suggest'
        ];
        
        let shouldSkip = false;
        for (const phrase of skipPhrases) {
            if (potentialItemName === phrase || 
                potentialItemName.startsWith(phrase + ' ') || 
                potentialItemName.endsWith(' ' + phrase)) {
                shouldSkip = true;
                break;
            }
        }
        
        if (!shouldSkip && potentialItemName.length > 2 && potentialItemName.length < 50 && quantity > 0 && quantity < 100) {
            items.push({ name: potentialItemName, quantity: quantity });
        }
    }
    
    // Remove duplicates
    const uniqueItems = [];
    const seen = new Set();
    for (const item of items) {
        const key = item.name;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueItems.push(item);
        }
    }
    
    console.log('📦 Potential items extracted:', uniqueItems);
    return uniqueItems;
}
}

module.exports = new IntentClassifier();