// backend/services/orderPreferenceParser.js
// PARSES USER PREFERENCES FROM ORDER MESSAGES

class OrderPreferenceParser {
    parsePreferences(message) {
        const msg = message.toLowerCase();
        const preferences = {
            speed: null,
            budget: null,
            maxBudget: null,
            minBudget: null,
            rating: null,
            cuisine: null,
            dietary: [],
            schedule: null,
            paymentMethod: null,
            itemType: null,
            isVeg: null,
            specificItem: null,
            restaurant: null,
            hasPreferences: false
        };
        
        // Speed priority
        if (msg.includes('fastest') || msg.includes('quick') || msg.includes('asap') || msg.includes('urgent')) {
            preferences.speed = 'fastest';
            preferences.hasPreferences = true;
        }
        
        if (msg.includes('cheapest') || msg.includes('lowest price')) {
            preferences.speed = 'cheapest';
            preferences.hasPreferences = true;
        }
        
        // Budget constraints
        const budgetPatterns = [
            /under\s*[₹]?\s*(\d+)/i,
            /less than\s*[₹]?\s*(\d+)/i,
            /max\s*[₹]?\s*(\d+)/i,
            /budget\s*[₹]?\s*(\d+)/i
        ];
        
        for (const pattern of budgetPatterns) {
            const match = msg.match(pattern);
            if (match) {
                preferences.maxBudget = parseInt(match[1]);
                preferences.budget = preferences.maxBudget;
                preferences.hasPreferences = true;
                break;
            }
        }
        
        // Rating priority
        if (msg.includes('highest rated') || msg.includes('best rated') || msg.includes('top rated')) {
            preferences.rating = 'highest';
            preferences.hasPreferences = true;
        }
        
        // Cuisine preferences
        const cuisines = ['north indian', 'south indian', 'chinese', 'italian', 'mexican', 'biryani'];
        for (const cuisine of cuisines) {
            if (msg.includes(cuisine)) {
                preferences.cuisine = cuisine;
                preferences.hasPreferences = true;
                break;
            }
        }
        
        // Dietary restrictions
        if (msg.includes('veg') || msg.includes('vegetarian')) {
            preferences.dietary.push('vegetarian');
            preferences.isVeg = true;
            preferences.hasPreferences = true;
        }
        
        if (msg.includes('vegan')) {
            preferences.dietary.push('vegan');
            preferences.hasPreferences = true;
        }
        
        if (msg.includes('jain')) {
            preferences.dietary.push('jain');
            preferences.hasPreferences = true;
        }
        
        // Schedule detection
        const timeMatch = msg.match(/(\d{1,2})\s*(?:am|pm)/i);
        if (timeMatch) {
            preferences.schedule = { type: 'specific_time', time: timeMatch[0] };
            preferences.hasPreferences = true;
        }
        
        if (msg.includes('tonight')) {
            preferences.schedule = { type: 'tonight' };
            preferences.hasPreferences = true;
        }
        
        if (msg.includes('tomorrow')) {
            preferences.schedule = { type: 'tomorrow' };
            preferences.hasPreferences = true;
        }
        
        // Payment method
        if (msg.includes('upi')) {
            preferences.paymentMethod = 'upi';
            preferences.hasPreferences = true;
        } else if (msg.includes('reserve pay') || msg.includes('sabai pay')) {
            preferences.paymentMethod = 'reserve_pay';
            preferences.hasPreferences = true;
        } else if (msg.includes('cod') || msg.includes('cash on delivery')) {
            preferences.paymentMethod = 'cod';
            preferences.hasPreferences = true;
        }
        
        // Item type
        if (msg.includes('biryani')) {
            preferences.itemType = 'biryani';
            preferences.hasPreferences = true;
        } else if (msg.includes('pizza')) {
            preferences.itemType = 'pizza';
            preferences.hasPreferences = true;
        } else if (msg.includes('burger')) {
            preferences.itemType = 'burger';
            preferences.hasPreferences = true;
        } else if (msg.includes('paneer')) {
            preferences.itemType = 'paneer';
            preferences.hasPreferences = true;
        } else if (msg.includes('chicken')) {
            preferences.itemType = 'chicken';
            preferences.hasPreferences = true;
        }
        
        return preferences;
    }

    applyPreferencesToResults(results, preferences, items = null) {
        let filtered = items ? [...items] : (results.items ? [...results.items] : [...results]);
        
        if (preferences.maxBudget) {
            filtered = filtered.filter(item => item.price <= preferences.maxBudget);
        }
        
        if (preferences.dietary.includes('vegetarian') || preferences.isVeg === true) {
            filtered = filtered.filter(item => item.isVeg === true);
        }
        
        if (preferences.speed === 'fastest') {
            filtered.sort((a, b) => (a.deliveryTime || 99) - (b.deliveryTime || 99));
        }
        
        if (preferences.rating === 'highest') {
            filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }
        
        if (preferences.speed === 'cheapest') {
            filtered.sort((a, b) => a.price - b.price);
        }
        
        return filtered;
    }

    generatePreferenceSummary(preferences) {
        const summary = [];
        
        if (preferences.speed === 'fastest') summary.push('⚡ Fastest delivery');
        if (preferences.speed === 'cheapest') summary.push('💰 Cheapest option');
        if (preferences.maxBudget) summary.push(`💵 Budget: ₹${preferences.maxBudget}`);
        if (preferences.rating === 'highest') summary.push('⭐ Highest rated');
        if (preferences.cuisine) summary.push(`🍽️ Cuisine: ${preferences.cuisine}`);
        if (preferences.dietary.length > 0) summary.push(`🥗 ${preferences.dietary.join(', ')}`);
        if (preferences.isVeg === true) summary.push('🌱 Vegetarian only');
        if (preferences.schedule) summary.push(`⏰ Scheduled: ${preferences.schedule.type}`);
        if (preferences.paymentMethod) summary.push(`💳 Payment: ${preferences.paymentMethod}`);
        
        return summary;
    }

    hasPreferences(preferences) {
        return preferences.speed !== null ||
               preferences.maxBudget !== null ||
               preferences.minBudget !== null ||
               preferences.rating !== null ||
               preferences.cuisine !== null ||
               preferences.dietary.length > 0 ||
               preferences.schedule !== null ||
               preferences.paymentMethod !== null ||
               preferences.itemType !== null ||
               preferences.isVeg !== null;
    }
}

module.exports = new OrderPreferenceParser();