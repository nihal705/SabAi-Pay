// backend/controllers/agentOrderController.js
// COMPLETE WORKING VERSION - ML Integration with Real Merchant Data

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * For licensing inquiries: sabaipaycontact@gmail.com
 */

const merchantDataService = require('../services/merchantDataService');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const merchantConnectionService = require('../services/merchantConnectionService');
const geminiService = require('../services/geminiChatService');
const dbService = require('../services/databaseService');
const intentClassifier = require('../services/intentClassifier');
const orderPreferenceParser = require('../services/orderPreferenceParser');
const situationToOrderService = require('../services/situationToOrderService');
const scheduledOrderService = require('../services/scheduledOrderService');
const mlService = require('../services/mlService');

class AgentOrderController {
    
    constructor() {
        console.log('✅ AgentOrderController initialized with ML + Merchant Data');
    }

    // ============================================
    // SESSION MANAGEMENT
    // ============================================

    async getOrCreateSession(userId, sessionId = null) {
        try {
            if (sessionId) {
                const session = await dbService.getOrderSession(sessionId);
                if (session && session.user_id === userId) {
                    let merchantInfo = session.merchant_info;
                    let cart = session.cart;
                    let preferences = session.preferences;
                    
                    if (typeof merchantInfo === 'string') {
                        try { merchantInfo = JSON.parse(merchantInfo); } catch (e) { merchantInfo = {}; }
                    }
                    if (typeof cart === 'string') {
                        try { cart = JSON.parse(cart); } catch (e) { cart = []; }
                    }
                    if (typeof preferences === 'string') {
                        try { preferences = JSON.parse(preferences); } catch (e) { preferences = {}; }
                    }
                    
                    return {
                        id: session.session_id,
                        userId: session.user_id,
                        merchant: session.merchant,
                        merchantInfo: merchantInfo || null,
                        cart: Array.isArray(cart) ? cart : [],
                        subtotal: parseFloat(session.subtotal) || 0,
                        tax: parseFloat(session.tax) || 0,
                        total: parseFloat(session.total) || 0,
                        step: session.step || 'init',
                        preferences: preferences || {},
                        isScheduled: session.is_scheduled === 1,
                        scheduledTime: session.scheduled_time,
                        createdAt: session.created_at
                    };
                }
            }
            
            const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            return {
                id: newSessionId,
                userId: userId,
                merchant: null,
                merchantInfo: null,
                cart: [],
                subtotal: 0,
                tax: 0,
                total: 0,
                step: 'init',
                preferences: {},
                isScheduled: false,
                scheduledTime: null,
                createdAt: new Date().toISOString(),
                isNew: true
            };
        } catch (error) {
            console.error('Error getting/creating session:', error);
            const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            return {
                id: newSessionId,
                userId: userId,
                merchant: null,
                merchantInfo: null,
                cart: [],
                subtotal: 0,
                tax: 0,
                total: 0,
                step: 'init',
                preferences: {},
                isScheduled: false,
                scheduledTime: null,
                createdAt: new Date().toISOString(),
                isNew: true
            };
        }
    }

    async saveSession(session) {
        try {
            const cartStr = typeof session.cart === 'string' ? session.cart : JSON.stringify(session.cart || []);
            const merchantInfoStr = session.merchantInfo ? 
                (typeof session.merchantInfo === 'string' ? session.merchantInfo : JSON.stringify(session.merchantInfo)) : null;
            const preferencesStr = session.preferences ? JSON.stringify(session.preferences) : null;
            
            await dbService.saveOrderSession({
                session_id: session.id,
                user_id: session.userId,
                merchant: session.merchant,
                merchant_info: merchantInfoStr,
                cart: cartStr,
                subtotal: session.subtotal || 0,
                tax: session.tax || 0,
                total: session.total || 0,
                step: session.step || 'init',
                preferences: preferencesStr,
                is_scheduled: session.isScheduled ? 1 : 0,
                scheduled_time: session.scheduledTime
            });
            return true;
        } catch (error) {
            console.error('Error saving session:', error);
            return false;
        }
    }

    async deleteSession(sessionId) {
        try {
            await dbService.deleteOrderSession(sessionId);
            return true;
        } catch (error) {
            console.error('Error deleting session:', error);
            return false;
        }
    }

    // ============================================
    // GET USER LOCATION FOR MERCHANT
    // ============================================

    async getUserLocationForMerchant(userId, merchant) {
        try {
            // Get the merchant connection details from database
            const connection = await merchantConnectionService.getMerchantConnection(userId, merchant);
            
            if (connection && connection.location_city) {
                return {
                    city: connection.location_city,
                    area: connection.location_area,
                    address: connection.location_address
                };
            }
            
            // If no location found, return null (will ask user)
            return null;
        } catch (error) {
            console.error('Error getting user location:', error);
            return null;
        }
    }

    // ============================================
    // ML-POWERED ITEM MATCHING
    // ============================================

    calculateItemMatchScore(itemName, searchTerm) {
        const itemLower = itemName.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        if (itemLower === searchLower) return 100;
        if (itemLower.startsWith(searchLower)) return 80;
        if (itemLower.includes(searchLower)) return 60;
        
        const searchWords = searchLower.split(' ');
        const itemWords = itemLower.split(' ');
        for (const sw of searchWords) {
            if (sw.length > 2 && itemWords.some(iw => iw.includes(sw))) {
                return 40;
            }
        }
        
        return 0;
    }

    async searchItemsInMerchant(merchant, searchTerm, userLocation) {
        try {
            console.log(`🔍 Searching for "${searchTerm}" in ${merchant}`);
            
            const merchantData = await merchantDataService.getMerchantData(
                merchant,
                userLocation?.city,
                userLocation?.area,
                searchTerm,
                { showMenu: true }
            );
            
            let items = [];
            
            if (merchantData?.type === 'search_results' && merchantData.items) {
                items = merchantData.items;
            } else if (merchantData?.type === 'products_grid' && merchantData.products) {
                items = merchantData.products;
            } else if (merchantData?.type === 'restaurant_menu' && merchantData.menu) {
                items = merchantData.menu;
            }
            
            if (items.length === 0) {
                console.log(`No items found for "${searchTerm}" in ${merchant}`);
                return [];
            }
            
            const scoredItems = items.map(item => ({
                name: item.name,
                price: item.price || 0,
                id: item.id || `${merchant}_${item.name.replace(/\s/g, '_')}`,
                imageUrl: item.imageUrl || item.image || '/images/items/default.png',
                category: item.category || 'General',
                unit: item.unit || 'piece',
                isVeg: item.isVeg || false,
                description: item.description || '',
                restaurantName: item.restaurantName || null,
                matchScore: this.calculateItemMatchScore(item.name, searchTerm)
            }));
            
            const matchedItems = scoredItems
                .filter(item => item.matchScore > 0)
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, 10);
            
            console.log(`Found ${matchedItems.length} matches for "${searchTerm}"`);
            return matchedItems;
            
        } catch (error) {
            console.error('Error searching items in merchant:', error);
            return [];
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    hasRestaurantName(message) {
        const msg = message.toLowerCase();
        const restaurantNames = [
            'paradise', 'kanti sweets', 'mcdonald', 'kfc', 'burger king', 
            'pizza hut', 'dominos', 'taco bell', 'starbucks', 'cafe coffee day',
            'paradise biryani', 'kanti', 'mcdonalds'
        ];
        return restaurantNames.some(name => msg.includes(name));
    }

    detectMerchant(msg) {
        const merchants = {
            'swiggy': ['swiggy', 'food delivery', 'order food', 'food from swiggy', 'order from swiggy'],
            'zomato': ['zomato', 'order from zomato', 'food from zomato'],
            'zepto': ['zepto', 'grocery', 'groceries', 'order from zepto'],
            'blinkit': ['blinkit', 'order from blinkit'],
            'amazon': ['amazon', 'amzn', 'shop', 'shopping', 'order from amazon'],
            'flipkart': ['flipkart', 'fk', 'order from flipkart'],
            'netmeds': ['netmeds', 'medicine', 'order from netmeds'],
            'pharmeasy': ['pharmeasy', 'pharmacy', 'order from pharmeasy']
        };
        
        const lowerMsg = msg.toLowerCase();
        
        for (const [merchant, keywords] of Object.entries(merchants)) {
            for (const keyword of keywords) {
                if (lowerMsg.includes(keyword)) {
                    return merchant;
                }
            }
        }
        return null;
    }

    detectRestaurant(message) {
        const msg = message.toLowerCase();
        
        const patterns = [
            /from\s+([a-z\s]+?)(?:\s+restaurant|\s+kitchen|\s+near me|$)/i,
            /menu\s+of\s+([a-z\s]+?)(?:\s+restaurant|\s+kitchen|$)/i,
            /items\s+from\s+([a-z\s]+?)(?:\s+restaurant|\s+kitchen|$)/i,
            /([a-z\s]+?)\s+restaurant/i,
            /order\s+from\s+([a-z\s]+?)(?:\s+near me|$)/i
        ];
        
        for (const pattern of patterns) {
            const match = msg.match(pattern);
            if (match && match[1]) {
                let restaurant = match[1].trim();
                restaurant = restaurant.replace(/\s+near me$/, '').trim();
                if (restaurant.length > 2 && restaurant.length < 50) {
                    restaurant = this.fixRestaurantTypos(restaurant);
                    console.log(`Detected restaurant: ${restaurant}`);
                    return restaurant;
                }
            }
        }
        
        return null;
    }

    fixRestaurantTypos(restaurantName) {
        const typoMap = {
            'paardise': 'Paradise',
            'paradisee': 'Paradise',
            'paridise': 'Paradise',
            'pradise': 'Paradise',
            'kanti sweet': 'Kanti Sweets',
            'kanti swets': 'Kanti Sweets',
            'kanty sweets': 'Kanti Sweets',
            'mcdonald': "McDonald's",
            'mcdonalds': "McDonald's",
            'mcd': "McDonald's",
            'burgerking': 'Burger King',
            'burger king': 'Burger King',
            'bk': 'Burger King',
            'k f c': 'KFC',
            'kentucky': 'KFC',
            'pizza hut': 'Pizza Hut',
            'pizzahut': 'Pizza Hut',
            'dominos': "Domino's",
            'domino': "Domino's",
            'taco bell': 'Taco Bell'
        };
        
        const lowerName = restaurantName.toLowerCase();
        for (const [typo, correct] of Object.entries(typoMap)) {
            if (lowerName.includes(typo)) {
                return correct;
            }
        }
        
        return restaurantName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    getMerchantInfo(merchant) {
        const merchants = {
            'swiggy': { name: 'Swiggy', logo: '/images/merchants/swiggy.png' },
            'zomato': { name: 'Zomato', logo: '/images/merchants/zomato.png' },
            'zepto': { name: 'Zepto', logo: '/images/merchants/zepto.png' },
            'blinkit': { name: 'Blinkit', logo: '/images/merchants/blinkit.png' },
            'amazon': { name: 'Amazon', logo: '/images/merchants/amazon.png' },
            'flipkart': { name: 'Flipkart', logo: '/images/merchants/flipkart.png' },
            'netmeds': { name: 'NetMeds', logo: '/images/merchants/netmeds.png' },
            'pharmeasy': { name: 'PharmEasy', logo: '/images/merchants/pharmeasy.png' }
        };
        return merchants[merchant] || { name: merchant, logo: null };
    }

    // ============================================
    // SHOW RESTAURANT MENU
    // ============================================

    async showRestaurantMenu(req, res, session, merchant, restaurantName, userLocation, preferences) {
        try {
            if (!userLocation?.city) {
                return res.json({
                    success: true,
                    data: {
                        response: "📍 To find restaurants near you, please share your location first.\n\nYou can set your location in Dashboard → Connect Apps.",
                        requiresAction: 'location_required'
                    }
                });
            }
            
            const merchantData = await merchantDataService.getMerchantData(
                merchant, 
                userLocation.city, 
                userLocation.area, 
                restaurantName,
                { ...preferences, showMenu: true }
            );
            
            if (merchantData?.type === 'restaurant_menu') {
                session.merchant = merchant;
                session.step = 'selecting_items';
                await this.saveSession(session);
                
                return res.json({
                    success: true,
                    data: {
                        response: {
                            type: 'products_grid',
                            merchant,
                            products: merchantData.menu,
                            restaurantName: merchantData.restaurant?.name,
                            restaurantRating: merchantData.restaurant?.rating,
                            deliveryTime: merchantData.restaurant?.deliveryTime,
                            message: `Menu for ${merchantData.restaurant?.name || restaurantName}`
                        },
                        requiresAction: 'select_items_grid',
                        sessionId: session.id,
                        merchant: merchant
                    }
                });
            }
            
            if (merchantData?.type === 'search_results' && merchantData.items?.length > 0) {
                const suggestionsResponse = {
                    type: 'products_grid',
                    merchant: merchant,
                    products: merchantData.items.slice(0, 20),
                    message: `Here are items from "${restaurantName}" on ${merchant}:`,
                    canSelect: true
                };
                
                session.merchant = merchant;
                session.step = 'selecting_items';
                await this.saveSession(session);
                
                return res.json({
                    success: true,
                    data: {
                        response: suggestionsResponse,
                        requiresAction: 'select_items_grid',
                        sessionId: session.id,
                        merchant: merchant
                    }
                });
            }
            
            if (merchantData?.type === 'restaurants_list' && merchantData.restaurants?.length > 0) {
    // Instead of just showing restaurants list, show each restaurant's popular items
    const restaurantsWithMenus = [];
    
    for (const restaurant of merchantData.restaurants.slice(0, 5)) {
        const menu = await merchantDataService.getRestaurantMenu(merchant, userLocation.city, restaurant.id);
        if (menu && menu.length > 0) {
            restaurantsWithMenus.push({
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    rating: restaurant.rating,
                    cuisine: restaurant.cuisine,
                    deliveryTime: restaurant.deliveryTime,
                    priceForTwo: restaurant.priceForTwo,
                    imageUrl: restaurant.imageUrl,
                    isOpen: restaurant.isOpen
                },
                popularItems: menu.filter(item => item.isPopular).slice(0, 6),
                allItems: menu.slice(0, 15)
            });
        }
    }
    
    if (restaurantsWithMenus.length > 0) {
        return res.json({
            success: true,
            data: {
                response: {
                    type: 'restaurants_with_menus',
                    merchant: merchant,
                    restaurants: restaurantsWithMenus,
                    message: `Here are restaurants near you on ${merchant} with their popular items:`
                },
                requiresAction: 'show_restaurants_with_menus',
                sessionId: session.id,
                merchant: merchant
            }
        });
    }
}
            
            return res.json({
                success: true,
                data: {
                    response: `I couldn't find a restaurant named "${restaurantName}" on ${merchant}. Please try another restaurant name.\n\nTip: Try "Paradise Biryani", "Meghana Foods", or "McDonald's"`,
                    requiresAction: 'retry'
                }
            });
            
        } catch (error) {
            console.error('Error showing menu:', error);
            return res.json({
                success: true,
                data: {
                    response: "I had trouble loading the menu. Please try again.",
                    requiresAction: 'retry'
                }
            });
        }
    }

    // ============================================
    // PROCESS ITEM ADDITION
    // ============================================

    async processItemAddition(req, res, session, merchant, items, preferences, userLocation) {
    try {
        const userId = req.user?.id ? String(req.user.id) : '4';
        
        console.log(`🔍 Searching for items in ${merchant}`);
        console.log(`📍 User location:`, userLocation);
        
        const merchantData = await merchantDataService.getMerchantData(
            merchant, 
            userLocation?.city || 'bangalore',
            userLocation?.area, 
            null, 
            {}
        );
        
        console.log(`📦 Merchant data type: ${merchantData?.type}`);
        
        let availableProducts = [];
        
        if (merchantData?.type === 'products_grid' && merchantData.products) {
            availableProducts = merchantData.products;
            console.log(`📦 Found ${availableProducts.length} products in products_grid`);
        } 
        else if (merchantData?.type === 'restaurants_list' && merchantData.restaurants) {
            console.log(`📦 Found ${merchantData.restaurants.length} restaurants, fetching menus...`);
            for (const restaurant of merchantData.restaurants.slice(0, 10)) {
                const menu = await merchantDataService.getRestaurantMenu(
                    merchant, 
                    userLocation?.city || 'bangalore', 
                    restaurant.id
                );
                if (menu && menu.length > 0) {
                    availableProducts.push(...menu.map(item => ({ 
                        ...item, 
                        restaurantName: restaurant.name,
                        restaurantId: restaurant.id,
                        restaurantRating: restaurant.rating,
                        deliveryTime: restaurant.deliveryTime
                    })));
                }
            }
            console.log(`📦 Collected ${availableProducts.length} menu items from restaurants`);
        }
        else if (merchantData?.type === 'cities_list') {
            return res.json({
                success: true,
                data: {
                    response: `📍 To order from ${merchant}, please share your city first.\n\nAvailable cities: ${merchantData.cities?.map(c => c.displayName).join(', ')}`,
                    requiresAction: 'location_required',
                    cities: merchantData.cities
                }
            });
        }
        
        const foundItems = [];
        const notFoundItems = [];
        
        for (const requestedItem of items) {
            let searchTerm = requestedItem.name.toLowerCase().trim();
            
            const removeWords = ['i want to order', 'please order', 'order', 'from', 'swiggy', 'zomato'];
            for (const word of removeWords) {
                searchTerm = searchTerm.replace(word, '');
            }
            searchTerm = searchTerm.trim();
            
            console.log(`🔍 Searching for: "${searchTerm}" among ${availableProducts.length} products`);
            
            let matchedItem = null;
            let bestScore = 0;
            
            for (const product of availableProducts) {
                const productName = product.name.toLowerCase();
                let score = 0;
                
                if (productName === searchTerm) {
                    score = 100;
                } else if (productName.includes(searchTerm)) {
                    score = 80;
                } else if (searchTerm.includes(productName)) {
                    score = 70;
                } else {
                    const searchWords = searchTerm.split(' ');
                    const productWords = productName.split(' ');
                    let matchCount = 0;
                    for (const sw of searchWords) {
                        if (sw.length > 2 && productWords.some(pw => pw.includes(sw))) {
                            matchCount++;
                        }
                    }
                    if (matchCount > 0) {
                        score = 40 + (matchCount * 10);
                    }
                }
                
                if (product.isPopular) score += 10;
                
                if (score > bestScore && score > 30) {
                    bestScore = score;
                    matchedItem = product;
                }
            }
            
            if (matchedItem) {
                console.log(`✅ Matched "${searchTerm}" to "${matchedItem.name}" with score ${bestScore}`);
                
                let quantity = requestedItem.quantity || 1;
                
                if (!requestedItem.quantity && requestedItem.name) {
                    const qtyMatch = requestedItem.name.match(/^(\d+)/);
                    if (qtyMatch) {
                        quantity = parseInt(qtyMatch[1]);
                        const cleanName = requestedItem.name.replace(/^\d+\s*/, '');
                        if (cleanName !== requestedItem.name) {
                            requestedItem.name = cleanName;
                        }
                    }
                }
                
                foundItems.push({
                    id: matchedItem.id || `${merchant}_${matchedItem.name.replace(/\s/g, '_')}`,
                    name: matchedItem.name,
                    price: matchedItem.price || 0,
                    quantity: quantity,
                    total: (matchedItem.price || 0) * quantity,
                    unit: matchedItem.unit || 'piece',
                imageUrl: matchedItem.imageUrl || matchedItem.image || '/images/items/default.png',
                    category: matchedItem.category || 'General',
                    isVeg: matchedItem.isVeg || false,
                    restaurantName: matchedItem.restaurantName,
                    restaurantId: matchedItem.restaurantId,
                    restaurantRating: matchedItem.restaurantRating,
                    deliveryTime: matchedItem.deliveryTime,
                    merchant: merchant
                });
            } else {
                console.log(`❌ No match found for: "${searchTerm}"`);
                notFoundItems.push(requestedItem);
            }
        }
        
        if (notFoundItems.length > 0 && availableProducts.length > 0) {
            console.log(`📋 Available products sample:`, availableProducts.slice(0, 5).map(p => p.name));
        }
        
        let updatedCart = [...session.cart];
        for (const item of foundItems) {
            const existingIndex = updatedCart.findIndex(i => i.name === item.name);
            if (existingIndex !== -1) {
                updatedCart[existingIndex].quantity += item.quantity;
                updatedCart[existingIndex].total = updatedCart[existingIndex].price * updatedCart[existingIndex].quantity;
            } else {
                updatedCart.push(item);
            }
        }
        
        let subtotal = updatedCart.reduce((sum, i) => sum + i.total, 0);
        const tax = Math.round(subtotal * 0.05);
        const grandTotal = subtotal + tax;
        
        session.cart = updatedCart;
        session.subtotal = subtotal;
        session.tax = tax;
        session.total = grandTotal;
        session.merchant = merchant;
        session.step = updatedCart.length > 0 ? 'confirm_items' : 'awaiting_items';
        await this.saveSession(session);
        
        let responseText = '';
        
        if (notFoundItems.length > 0) {
            responseText = `⚠️ **Some items were not found:**\n\n`;
            for (const item of notFoundItems) {
                responseText += `• "${item.name}"\n`;
            }
            
            if (availableProducts.length > 0) {
                responseText += `\n**Available items on ${merchant}:**\n`;
                const suggestions = availableProducts.slice(0, 5).map(p => `• ${p.name} - ₹${p.price}`).join('\n');
                responseText += suggestions;
                responseText += `\n\nTry typing the exact item name from the list above.`;
            }
            
            if (foundItems.length > 0) {
                responseText += `\n\n**Found and added to cart:**\n`;
                for (const item of foundItems) {
                    responseText += `• ${item.quantity}x ${item.name} - ₹${item.total}\n`;
                }
                responseText += `\n**Total: ₹${grandTotal}**\n\n`;
            } else {
                responseText += `\n**No items were added to cart.**\n\n`;
            }
            
            responseText += `Would you like to:\n1️⃣ Try again with exact item names\n2️⃣ See more suggestions\n3️⃣ Clear cart`;
            
            return res.json({
                success: true,
                data: {
                    response: responseText,
                    sessionId: session.id,
                    cart: updatedCart,
                    total: grandTotal,
                    notFoundItems: notFoundItems,
                    foundItems: foundItems,
                    availableProducts: availableProducts.slice(0, 10),
                    requiresAction: 'confirm_items'
                }
            });
        }
        
        const reserveCheck = await this.checkReservePayEligibility(userId, merchant, grandTotal);
        const sabaiGems = this.calculateSabaiGems(grandTotal);
        const orderSummary = this.formatOrderSummary(
            updatedCart, [], subtotal, tax, grandTotal,
            session.merchantInfo, reserveCheck, sabaiGems, merchant
        );
        
        return res.json({
            success: true,
            data: {
                response: orderSummary,
                sessionId: session.id,
                cart: updatedCart,
                total: grandTotal,
                requiresAction: 'payment_selection'
            }
        });
        
    } catch (error) {
        console.error('Error processing items:', error);
        return res.json({
            success: true,
            data: {
                response: "I had trouble finding those items. Please try again with exact item names from the menu.",
                requiresAction: 'retry'
            }
        });
    }
    }

    // ============================================
    // SHOW PRODUCT SUGGESTIONS
    // ============================================

    async showProductSuggestions(req, res, session, merchant, message, userLocation, preferences) {
        try {
            let searchTerm = message;
            const suggestMatch = message.match(/suggest\s+(.+?)(?:\s+from|\s+on|\s*$)/i);
            if (suggestMatch) {
                searchTerm = suggestMatch[1];
            }
            
            const merchantData = await merchantDataService.getMerchantData(
                merchant, userLocation?.city, userLocation?.area, searchTerm, preferences
            );
            
            if (merchantData?.type === 'products_grid' && merchantData.products?.length > 0) {
                const filteredProducts = orderPreferenceParser.applyPreferencesToResults(
                    merchantData, preferences, merchantData.products
                );
                
                const suggestionsResponse = {
                    type: 'products_grid',
                    merchant: merchant,
                    products: filteredProducts.slice(0, 20),
                    categories: merchantData.categories,
                    query: searchTerm,
                    canSelect: true
                };
                
                session.merchant = merchant;
                session.step = 'selecting_items';
                await this.saveSession(session);
                
                return res.json({
                    success: true,
                    data: {
                        response: suggestionsResponse,
                        requiresAction: 'select_items_grid',
                        sessionId: session.id,
                        merchant: merchant
                    }
                });
            }
            
            return res.json({
                success: true,
                data: {
                    response: `I couldn't find any "${searchTerm}" products on ${merchant}. Try searching for something else.`,
                    requiresAction: 'retry'
                }
            });
            
        } catch (error) {
            console.error('Error showing suggestions:', error);
            return res.json({
                success: true,
                data: {
                    response: "I had trouble finding suggestions. Please try again.",
                    requiresAction: 'retry'
                }
            });
        }
    }

    // ============================================
    // GET SUGGESTED ITEMS FROM NATURAL LANGUAGE
    // ============================================

    async getSuggestedItemsFromNaturalLanguage(message, merchant, userLocation = null) {
        try {
            const msg = message.toLowerCase();
            
            const merchantData = await merchantDataService.getMerchantData(
                merchant, userLocation?.city, userLocation?.area, null, {}
            );
            
            let allProducts = [];
            if (merchantData && merchantData.type === 'products_grid' && merchantData.products) {
                allProducts = merchantData.products;
            } else if (merchantData && merchantData.type === 'restaurants_list') {
                allProducts = await this.getAllMenuItems(merchant, userLocation);
            }
            
            if (!allProducts || allProducts.length === 0) {
                console.log('No products found for merchant:', merchant);
                return [];
            }
            
            const stopWords = ['i', 'want', 'to', 'order', 'cheapest', 'best', 'quality', 'of', 'any', 
                              'from', 'with', 'and', 'the', 'for', 'please', 'can', 'have', 'get', 'me'];
            
            const words = msg.split(/[\s,]+/);
            const keywords = [];
            for (const word of words) {
                const cleanWord = word.replace(/[^a-z]/g, '');
                if (cleanWord.length > 2 && !stopWords.includes(cleanWord)) {
                    keywords.push(cleanWord);
                }
            }
            
            const matchedProducts = [];
            for (const product of allProducts) {
                const productName = product.name.toLowerCase();
                for (const keyword of keywords) {
                    if (productName.includes(keyword)) {
                        matchedProducts.push(product);
                        break;
                    }
                }
            }
            
            const suggestedItems = [];
            for (const product of matchedProducts.slice(0, 10)) {
                suggestedItems.push({
                    name: product.name,
                    quantity: 1,
                    price: product.price,
                    id: product.id,
                    imageUrl: product.imageUrl,
                    category: product.category
                });
            }
            
            if (suggestedItems.length === 0 && allProducts.length > 0) {
                for (let i = 0; i < Math.min(5, allProducts.length); i++) {
                    suggestedItems.push({
                        name: allProducts[i].name,
                        quantity: 1,
                        price: allProducts[i].price,
                        id: allProducts[i].id,
                        imageUrl: allProducts[i].imageUrl,
                        category: allProducts[i].category
                    });
                }
            }
            
            console.log(`Found ${suggestedItems.length} suggested items`);
            return suggestedItems;
            
        } catch (error) {
            console.error('Error getting suggested items:', error);
            return [];
        }
    }

    async getAllMenuItems(merchant, userLocation) {
        try {
            const allItems = [];
            const merchantData = await merchantDataService.getMerchantData(
                merchant, userLocation?.city, userLocation?.area, null, { showMenu: false }
            );
            
            if (merchantData && merchantData.type === 'restaurants_list' && merchantData.restaurants) {
                for (const restaurant of merchantData.restaurants.slice(0, 5)) {
                    const menu = await merchantDataService.getRestaurantMenu(
                        merchant, userLocation?.city, restaurant.id
                    );
                    if (menu && menu.length > 0) {
                        allItems.push(...menu);
                    }
                }
            }
            
            return allItems;
        } catch (error) {
            console.error('Error getting menu items:', error);
            return [];
        }
    }

    // ============================================
    // FORMAT ORDER SUMMARY
    // ============================================

    formatOrderSummary(cart, unavailableItems, subtotal, tax, total, merchantInfo, reserveCheck = null, sabaiGems = 0, merchantName = null) {
    const merchant = merchantName || merchantInfo?.name || 'Merchant';
    
    // Group items by restaurant
    const itemsByRestaurant = {};
    cart.forEach(item => {
        const restaurant = item.restaurantName || 'Unknown Restaurant';
        if (!itemsByRestaurant[restaurant]) {
            itemsByRestaurant[restaurant] = [];
        }
        itemsByRestaurant[restaurant].push(item);
    });
    
    return {
        type: 'order_summary',
        merchant: merchant,
        merchantName: merchant,
        merchantLogo: `/images/merchants/${merchant.toLowerCase()}.png`,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            image: item.imageUrl || this.getDefaultItemImage(item.name),
            unit: item.unit || 'piece',
            restaurantName: item.restaurantName  // Add restaurant name to each item
        })),
        itemsByRestaurant: itemsByRestaurant,  // Group by restaurant
        unavailableItems: unavailableItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        sabaiGems: sabaiGems,
        reserveCheck: reserveCheck,
        paymentOptions: {
            upi: true,
            reservePay: reserveCheck?.eligible || false,
            schedulePay: true,
            autoPay: true
        }
    };
}

    getDefaultItemImage(itemName) {
        const lowerName = itemName.toLowerCase();
        if (lowerName.includes('biryani')) return '/images/items/chicken-biryani.png';
        if (lowerName.includes('paneer')) return '/images/items/paneer-butter-masala.png';
        if (lowerName.includes('chicken')) return '/images/items/butter-chicken.png';
        if (lowerName.includes('naan')) return '/images/items/garlic-naan.png';
        return '/images/items/default.png';
    }

    calculateSabaiGems(amount) {
        return Math.min(Math.floor(amount * 0.05), 100);
    }

    async checkReservePayEligibility(userId, merchant, amount) {
        try {
            if (!merchant) {
                return {
                    eligible: false,
                    limit: 0,
                    spent: 0,
                    remaining: 0,
                    message: "No merchant specified."
                };
            }
            
            const limit = await dbService.getReserveLimit(userId, merchant);
            
            if (!limit) {
                return {
                    eligible: false,
                    limit: 0,
                    spent: 0,
                    remaining: 0,
                    message: `No Reserve Pay limit set for ${merchant}.`
                };
            }
            
            const remaining = limit.monthly_limit - (limit.current_spent || 0);
            const eligible = amount <= remaining;
            
            return {
                eligible: eligible,
                limit: limit.monthly_limit,
                spent: limit.current_spent || 0,
                remaining: remaining,
                message: eligible 
                    ? `✅ Within Reserve Pay limit! Remaining: ₹${remaining.toFixed(2)}`
                    : `❌ Exceeds Reserve Pay limit by ₹${(amount - remaining).toFixed(2)}`
            };
        } catch (error) {
            console.error('Reserve Pay check error:', error);
            return {
                eligible: false,
                limit: 0,
                spent: 0,
                remaining: 0,
                message: "Error checking Reserve Pay limit."
            };
        }
    }

    async updateUserReserveLimit(userId, merchant, amountSpent) {
        try {
            await dbService.updateReserveLimitSpent(userId, merchant, amountSpent);
            return true;
        } catch (error) {
            console.error('Error updating reserve limit:', error);
            return false;
        }
    }

    // ============================================
    // MAIN PROCESS ORDER ENTRY POINT
    // ============================================
    
    async processOrder(req, res) {
        try {
            let userId = req.user?.id ? String(req.user.id) : '4';
            const { message, sessionId, userLocation: reqUserLocation } = req.body;
            
            console.log(`📦 Processing order for user: ${userId}`);
            console.log(`📝 Message: "${message}"`);
            
            let session = await this.getOrCreateSession(userId, sessionId);
            
            // ============================================
            // ML INTEGRATION - Classify intent and extract entities
            // ============================================
            
            try {
                const mlResult = await mlService.classifyIntent(message, {
                    cart: session.cart,
                    step: session.step,
                    merchant: session.merchant,
                    total: session.total,
                    sabaiGems: session.preferences?.sabaiGems
                });

                console.log(`🧠 ML Intent: ${mlResult.intent} (confidence: ${mlResult.confidence})`);

                const entitiesResult = await mlService.extractEntities(message);
                const mlEntities = entitiesResult.entities || {};

                console.log(`🧠 ML Entities:`, JSON.stringify(mlEntities, null, 2));
                
                session.mlIntent = mlResult.intent;
                session.mlConfidence = mlResult.confidence;
                session.mlEntities = mlEntities;
                
            } catch (mlError) {
                console.error('ML service error, falling back to rule-based:', mlError.message);
                session.mlIntent = null;
                session.mlConfidence = 0;
                session.mlEntities = {};
            }
            
            const intentResult = intentClassifier.classify(message, {
                cart: session.cart,
                step: session.step,
                merchant: session.merchant,
                isScheduled: session.isScheduled
            });
            
            const useML = session.mlConfidence > 0.6 && session.mlIntent;
            const finalIntent = useML ? session.mlIntent : intentResult.intent;
            const finalSubType = useML ? null : intentResult.subType;
            
            console.log(`🎯 Final Intent: ${finalIntent} (ML confidence: ${session.mlConfidence || 0}, using ML: ${useML})`);

            // ============================================
            // HANDLE GENERAL INTENT FIRST - Use Gemini
            // ============================================
            if (finalIntent === 'general' || finalIntent === 'general_question' || finalIntent === 'general_greeting') {
                try {
                    const geminiResponse = await geminiService.processMessage(userId, message);
                    return res.json({
                        success: true,
                        data: {
                            response: geminiResponse.response,
                            sessionId: session.id,
                            requiresAction: false
                        }
                    });
                } catch (geminiError) {
                    console.error('Gemini error:', geminiError);
                    return res.json({
                        success: true,
                        data: {
                            response: "I'm having trouble connecting to my AI. Please try again or rephrase your request.",
                            sessionId: session.id,
                            requiresAction: 'retry'
                        }
                    });
                }
            }

            // ============================================
            // HANDLE ORDER INTENT
            // ============================================
            if (finalIntent === 'order' || finalIntent === 'order_new' || finalIntent === 'order_ask_items') {
                let merchant = session.merchant || 
                              (session.mlEntities?.merchants?.[0]?.name) || 
                              intentResult.merchant || 
                              this.detectMerchant(message);
                
                const preferences = orderPreferenceParser.parsePreferences(message);
                session.preferences = { ...session.preferences, ...preferences };
                
                console.log('📊 User preferences:', preferences);
                console.log('📊 Merchant from ML:', session.mlEntities?.merchants?.[0]?.name);
                
                if (!merchant) {
                    return res.json({
                        success: true,
                        data: {
                            response: "Which platform would you like to order from? (Swiggy, Zomato, Zepto, Amazon, Flipkart, etc.)",
                            requiresAction: 'clarify_merchant'
                        }
                    });
                }
                
                const isConnected = await merchantConnectionService.isConnected(userId, merchant);
                if (!isConnected) {
                    const merchantInfo = this.getMerchantInfo(merchant);
                    return res.json({
                        success: true,
                        data: {
                            response: `❌ You need to connect your **${merchantInfo?.name || merchant}** account first.\n\nPlease go to Dashboard → Connect Apps to connect your ${merchantInfo?.name || merchant} account.`,
                            requiresAction: 'connect_merchant',
                            merchant: merchant
                        }
                    });
                }
                
                // Get user location
                let userLocation = reqUserLocation;
                
                if (!userLocation || !userLocation.city) {
                    const savedLocation = await this.getUserLocationForMerchant(userId, merchant);
                    if (savedLocation) {
                        userLocation = savedLocation;
                        console.log(`📍 Using saved location for ${merchant}: ${userLocation.city}`);
                    }
                }
                
                if (!userLocation || !userLocation.city) {
                    return res.json({
                        success: true,
                        data: {
                            response: `📍 To order from ${merchant}, please set your delivery address in Connect Apps → ${merchant} → Add Location.`,
                            requiresAction: 'location_required',
                            merchant: merchant
                        }
                    });
                }
                
                // ============================================
                // CHECK FOR RESTAURANT MENU REQUEST
                // ============================================
                const explicitMenuRequest = message.toLowerCase().includes('show me menu') || 
                                            message.toLowerCase().includes('menu from');
                const hasRestaurant = this.hasRestaurantName(message);
                const isShowMenuRequest = explicitMenuRequest || (hasRestaurant && message.toLowerCase().includes('from'));
                const platformOnlyPatterns = [
                    /^order from (swiggy|zomato|zepto|blinkit|amazon|flipkart)$/i,
                    /^i want to order from (swiggy|zomato|zepto|blinkit|amazon|flipkart)$/i,
                    /^order from (swiggy|zomato|zepto|blinkit|amazon|flipkart) near me$/i,
                    /^order (swiggy|zomato|zepto|blinkit|amazon|flipkart)$/i
                ];

                const isPlatformOnlyRequest = platformOnlyPatterns.some(pattern => pattern.test(message.trim()));

                if (isPlatformOnlyRequest) {
                    session.merchant = merchant;
                    session.merchantInfo = this.getMerchantInfo(merchant);
                    session.step = 'awaiting_items';
                    await this.saveSession(session);
                    
                    const merchantName = session.merchantInfo?.name || merchant;
                    return res.json({
                        success: true,
                        data: {
                            response: `What would you like to order from ${merchantName}? Please specify items with quantities.\n\nExample: "2 Chicken Biryani, 1 Paneer Tikka, 2 Soft Drinks"`,
                            requiresAction: 'specify_items',
                            sessionId: session.id,
                            merchant: merchant,
                            merchantInfo: session.merchantInfo
                        }
                    });
                }
                
                if (isShowMenuRequest) {
                    let restaurantName = this.detectRestaurant(message);
                    
                    if (!restaurantName) {
                        return res.json({
                            success: true,
                            data: {
                                response: "Which restaurant would you like to see the menu from? Please specify the restaurant name.",
                                requiresAction: 'clarify_restaurant',
                                sessionId: session.id
                            }
                        });
                    }
                    
                    if (message.toLowerCase().includes('near me') && !userLocation?.city) {
                        return res.json({
                            success: true,
                            data: {
                                response: "📍 To find restaurants near you, please share your location first.\n\nYou can set your location in Dashboard → Connect Apps → Select your delivery address.",
                                requiresAction: 'location_required'
                            }
                        });
                    }
                    
                    return await this.showRestaurantMenu(req, res, session, merchant, restaurantName, userLocation, preferences);
                }
                
                // ============================================
                // CHECK FOR ITEMS IN MESSAGE
                // ============================================
                
                let extractedItems = [];
                
                if (session.mlEntities?.items && session.mlEntities.items.length > 0) {
                    extractedItems = session.mlEntities.items.map(item => ({
                        name: item.name,
                        quantity: parseInt(session.mlEntities.quantities?.find(q => q.name === item.name)?.value) || 1
                    }));
                    console.log('📦 ML extracted items:', extractedItems);
                }
                
                if (extractedItems.length === 0) {
                    extractedItems = intentClassifier.extractItemsFromMessage(message);
                    console.log('📦 Rule-based extracted items:', extractedItems);
                }
                
                if (extractedItems && extractedItems.length > 0) {
                    console.log(`📦 Processing ${extractedItems.length} extracted items`);
                    return await this.processItemAddition(req, res, session, merchant, extractedItems, preferences, userLocation);
                }
                
                const isNaturalLanguageRequest = message.toLowerCase().includes('cheapest') || 
                                                  message.toLowerCase().includes('best quality') ||
                                                  message.toLowerCase().includes('suggest') ||
                                                  message.toLowerCase().includes('recommend');
                
                if (isNaturalLanguageRequest) {
                    const suggestedItems = await this.getSuggestedItemsFromNaturalLanguage(message, merchant, userLocation);
                    if (suggestedItems && suggestedItems.length > 0) {
                        return await this.processItemAddition(req, res, session, merchant, suggestedItems, preferences, userLocation);
                    }
                }
                
                session.merchant = merchant;
                session.merchantInfo = this.getMerchantInfo(merchant);
                session.step = 'awaiting_items';
                await this.saveSession(session);
                
                const merchantName = session.merchantInfo?.name || merchant;
                let responseText = `What would you like to order from ${merchantName}? Please specify items with quantities.\n\nExample: "2 Chicken Biryani, 1 Paneer Tikka, 2 Soft Drinks"`;
                
                if (preferences.hasPreferences) {
                    responseText += `\n\nI noticed you mentioned:\n${orderPreferenceParser.generatePreferenceSummary(preferences).join('\n')}`;
                }
                
                return res.json({
                    success: true,
                    data: {
                        response: responseText,
                        requiresAction: 'specify_items',
                        sessionId: session.id,
                        merchant: merchant,
                        merchantInfo: session.merchantInfo,
                        preferences: preferences
                    }
                });
            }
            
            // ============================================
            // HANDLE HYBRID INTENT
            // ============================================
            if (finalIntent === 'hybrid' || finalIntent === 'hybrid_situation_to_order') {
                if (finalSubType === 'interrupt_order') {
                    const generalResponse = await geminiService.processMessage(userId, message);
                    
                    return res.json({
                        success: true,
                        data: {
                            response: `${generalResponse.response}\n\n---\n\n🛒 **Your current order is still active.**\n\n**Current Cart:** ${session.cart.length} item(s), Total: ₹${session.total}\n\nWould you like to:\n1️⃣ Continue with your order\n2️⃣ Start a new order\n3️⃣ Clear cart and start fresh`,
                            requiresAction: 'hybrid_pause',
                            sessionId: session.id,
                            cart: session.cart,
                            total: session.total
                        }
                    });
                }
                
                if (finalSubType === 'situation_to_order' || finalIntent === 'hybrid_situation_to_order') {
                    const situationAnalysis = await situationToOrderService.analyzeSituation(message);
                    
                    if (situationAnalysis && situationAnalysis.confidence > 0.3) {
                        let merchant = session.merchant || 
                                      (session.mlEntities?.merchants?.[0]?.name) || 
                                      intentResult.merchant;
                        
                        if (!merchant) {
                            return res.json({
                                success: true,
                                data: {
                                    response: `🧠 **I understand your situation:**\n\n${situationAnalysis.explanation}\n\nWhich platform would you like to order these items from?\n\nAvailable: Swiggy, Zomato, Zepto, Blinkit, Amazon, Flipkart, NetMeds, PharmEasy`,
                                    requiresAction: 'suggest_merchant',
                                    situation: situationAnalysis.situation,
                                    suggestedCategories: situationAnalysis.categories
                                }
                            });
                        }
                        
                        const suggestions = await situationToOrderService.generateInteractiveSuggestions(
                            merchant, situationAnalysis, userLocation, merchantDataService
                        );
                        
                        session.merchant = merchant;
                        session.step = 'suggesting_items';
                        await this.saveSession(session);
                        
                        return res.json({
                            success: true,
                            data: {
                                response: suggestions,
                                requiresAction: 'situation_suggestions',
                                sessionId: session.id,
                                merchant: merchant
                            }
                        });
                    } else {
                        const geminiResponse = await geminiService.processMessage(userId, message);
                        return res.json({
                            success: true,
                            data: {
                                response: geminiResponse.response,
                                requiresAction: 'general_chat'
                            }
                        });
                    }
                }
            }
            
            // ============================================
            // HANDLE OTHER INTENTS (Continue, Ask Platform, Comparison, Schedule, Tracking, Cancel, Payment)
            // ============================================
            
            if (finalIntent === 'order_continue') {
                if (session.cart.length > 0) {
                    const reserveCheck = await this.checkReservePayEligibility(userId, session.merchant, session.total);
                    const sabaiGems = this.calculateSabaiGems(session.total);
                    const orderSummary = this.formatOrderSummary(
                        session.cart, [], session.subtotal, session.tax, session.total,
                        session.merchantInfo, reserveCheck, sabaiGems, session.merchant
                    );
                    
                    return res.json({
                        success: true,
                        data: {
                            response: orderSummary,
                            sessionId: session.id,
                            cart: session.cart,
                            requiresAction: 'payment_selection'
                        }
                    });
                }
            }
            
            if (finalIntent === 'order_ask_platform') {
                return res.json({
                    success: true,
                    data: {
                        response: "Which platform would you like to order from?\n\nAvailable: Swiggy, Zomato, Zepto, Blinkit, Amazon, Flipkart, NetMeds, PharmEasy",
                        requiresAction: 'clarify_merchant'
                    }
                });
            }
            
            if (finalIntent === 'general_comparison') {
                const merchants = session.mlEntities?.merchants || [];
                const items = session.mlEntities?.items || [];
                
                if (merchants.length === 0) {
                    return res.json({
                        success: true,
                        data: {
                            response: "Which platforms would you like to compare? (e.g., Swiggy vs Zomato)\n\nPlease specify both platforms and what you'd like to compare.",
                            requiresAction: 'clarify_comparison'
                        }
                    });
                }
                
                const comparisonResponse = `🔍 **Comparison: ${merchants.map(m => m.name).join(' vs ')}**\n\nI'll help you compare ${items.length > 0 ? items.map(i => i.name).join(', ') : 'prices and delivery times'} across these platforms.\n\nWhat would you like to compare?\n1️⃣ Price\n2️⃣ Delivery time\n3️⃣ Offers & discounts\n4️⃣ Restaurant availability`;
                
                return res.json({
                    success: true,
                    data: {
                        response: comparisonResponse,
                        requiresAction: 'comparison_options',
                        merchants: merchants,
                        items: items
                    }
                });
            }
            
            if (finalIntent === 'schedule_new') {
                if (session.cart.length === 0) {
                    return res.json({
                        success: true,
                        data: {
                            response: "Please add items to your cart first before scheduling.\n\nType what you'd like to order, e.g., 'Order 2 chicken biryani from Swiggy'",
                            requiresAction: 'specify_items'
                        }
                    });
                }
                
                return res.json({
                    success: true,
                    data: {
                        response: "📅 **Schedule Your Order**\n\nWhen would you like this order to be delivered?\n\nPlease specify date and time.\n\nExamples:\n• 'tomorrow at 7 PM'\n• 'Monday 9 AM'\n• 'June 15th at 12:30 PM'",
                        requiresAction: 'ask_schedule_time',
                        sessionId: session.id,
                        cart: session.cart,
                        total: session.total
                    }
                });
            }
            
            if (finalIntent === 'tracking_status') {
                let orderId = session.mlEntities?.order_ids?.[0]?.value || null;
                
                if (!orderId) {
                    const orderIdMatch = message.match(/ORD\d+/i);
                    if (orderIdMatch) orderId = orderIdMatch[0];
                }
                
                if (orderId) {
                    const order = await orderService.getOrder(orderId, req.user.id);
                    if (order) {
                        return res.json({
                            success: true,
                            data: {
                                response: this.formatOrderStatusResponse(order),
                                requiresAction: 'order_status',
                                order: order
                            }
                        });
                    } else {
                        return res.json({
                            success: true,
                            data: {
                                response: `Order ${orderId} not found. Please check your order ID and try again.`,
                                requiresAction: 'retry'
                            }
                        });
                    }
                }
                
                return res.json({
                    success: true,
                    data: {
                        response: "📍 **Track Your Order**\n\nTo track your order, please provide your order ID.\n\nYou can find your order ID in the confirmation message or in My Orders section.\n\nExample: 'Track order ORD123456'",
                        requiresAction: 'ask_order_id'
                    }
                });
            }
            
            if (finalIntent === 'cancel_order') {
                if (session.cart.length > 0) {
                    return res.json({
                        success: true,
                        data: {
                            response: "⚠️ **Cancel Current Order**\n\nYour cart has items. Do you want to:\n1️⃣ Cancel the entire order\n2️⃣ Remove specific items\n3️⃣ Continue with order\n\nPlease type your choice (1, 2, or 3).",
                            requiresAction: 'confirm_cancel',
                            cart: session.cart,
                            total: session.total
                        }
                    });
                }
                
                let orderId = session.mlEntities?.order_ids?.[0]?.value || null;
                if (!orderId) {
                    const orderIdMatch = message.match(/ORD\d+/i);
                    if (orderIdMatch) orderId = orderIdMatch[0];
                }
                
                if (orderId) {
                    return res.json({
                        success: true,
                        data: {
                            response: `⚠️ **Cancel Order ${orderId}**\n\nPlease confirm you want to cancel this order by typing "CONFIRM CANCEL".\n\nNote: Cancellation may not be possible if the order is already being prepared.`,
                            requiresAction: 'confirm_cancel_order',
                            orderId: orderId
                        }
                    });
                }
                
                return res.json({
                    success: true,
                    data: {
                        response: "⚠️ To cancel an order, please provide your order ID.\n\nExample: 'Cancel order ORD123456'\n\nYou can also type 'clear cart' to remove items from your current cart.",
                        requiresAction: 'ask_order_id'
                    }
                });
            }
            
            if (finalIntent === 'payment_immediate' || finalIntent === 'payment_auto_pay') {
                if (session.cart.length === 0) {
                    return res.json({
                        success: true,
                        data: {
                            response: "Your cart is empty. Please add items to your cart before proceeding to payment.\n\nType what you'd like to order, e.g., 'Order 2 chicken biryani from Swiggy'",
                            requiresAction: 'specify_items'
                        }
                    });
                }
                
                const reserveCheck = await this.checkReservePayEligibility(userId, session.merchant, session.total);
                const sabaiGems = this.calculateSabaiGems(session.total);
                const orderSummary = this.formatOrderSummary(
                    session.cart, [], session.subtotal, session.tax, session.total,
                    session.merchantInfo, reserveCheck, sabaiGems, session.merchant
                );
                
                return res.json({
                    success: true,
                    data: {
                        response: orderSummary,
                        sessionId: session.id,
                        cart: session.cart,
                        total: session.total,
                        requiresAction: 'payment_selection'
                    }
                });
            }
            
            return res.json({
                success: true,
                data: {
                    response: "How can I help you today? You can ask me to order food, groceries, medicines, or just chat with me!",
                    requiresAction: 'general_chat'
                }
            });
            
        } catch (error) {
            console.error('❌ Order processing error:', error);
            res.json({
                success: true,
                data: {
                    response: "I encountered an error. Please try again or rephrase your request.",
                    requiresAction: 'retry'
                }
            });
        }
    }

    formatOrderStatusResponse(order) {
        const statusMap = {
            'confirmed': '✅ Order Confirmed',
            'preparing': '🍳 Being Prepared',
            'out_for_delivery': '🚚 Out for Delivery',
            'delivered': '📦 Delivered',
            'cancelled': '❌ Cancelled'
        };
        
        const statusText = statusMap[order.status] || order.status;
        
        return `**Order Status: ${statusText}**\n\n**Order ID:** ${order.id}\n**Merchant:** ${order.merchantName || order.merchant}\n**Total:** ₹${order.totalAmount}\n\n${order.tracking?.map(t => `• ${t.label}: ${t.completed ? '✅' : '⏳'} ${t.time || t.estimatedTime || ''}`).join('\n')}`;
    }

    // ============================================
    // SELECT ITEMS (from grid)
    // ============================================

    async selectItems(req, res) {
        try {
            const userId = req.user?.id ? String(req.user.id) : '4';
            const { sessionId, selection, selectedItems } = req.body;
            
            let session = await this.getOrCreateSession(userId, sessionId);
            
            if (selectedItems && Array.isArray(selectedItems) && selectedItems.length > 0) {
                const itemsToAdd = selectedItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity || 1,
                    price: item.price,
                    id: item.id,
                    imageUrl: item.imageUrl,
                    category: item.category
                }));
                
                let updatedCart = [...session.cart];
                for (const item of itemsToAdd) {
                    const existingIndex = updatedCart.findIndex(i => i.id === item.id);
                    if (existingIndex !== -1) {
                        updatedCart[existingIndex].quantity += item.quantity;
                        updatedCart[existingIndex].total = updatedCart[existingIndex].price * updatedCart[existingIndex].quantity;
                    } else {
                        updatedCart.push({
                            ...item,
                            total: item.price * item.quantity
                        });
                    }
                }
                
                let subtotal = updatedCart.reduce((sum, i) => sum + i.total, 0);
                const tax = Math.round(subtotal * 0.05);
                const grandTotal = subtotal + tax;
                
                session.cart = updatedCart;
                session.subtotal = subtotal;
                session.tax = tax;
                session.total = grandTotal;
                session.step = updatedCart.length > 0 ? 'payment_selection' : 'awaiting_items';
                await this.saveSession(session);
                
                const reserveCheck = await this.checkReservePayEligibility(userId, session.merchant, grandTotal);
                const sabaiGems = this.calculateSabaiGems(grandTotal);
                const orderSummary = this.formatOrderSummary(
                    updatedCart, [], subtotal, tax, grandTotal,
                    session.merchantInfo, reserveCheck, sabaiGems, session.merchant
                );
                
                return res.json({
                    success: true,
                    data: {
                        response: orderSummary,
                        sessionId: session.id,
                        cart: updatedCart,
                        total: grandTotal,
                        requiresAction: 'payment_selection'
                    }
                });
            }
            
            const msg = selection?.toLowerCase().trim() || '';
            
            if (msg === '1' || msg === 'continue' || msg === 'proceed' || msg === 'yes' || msg === 'ok' || msg === 'okay') {
                if (session.cart.length > 0) {
                    const reserveCheck = await this.checkReservePayEligibility(userId, session.merchant, session.total);
                    const sabaiGems = this.calculateSabaiGems(session.total);
                    const orderSummary = this.formatOrderSummary(
                        session.cart, [], session.subtotal, session.tax, session.total,
                        session.merchantInfo, reserveCheck, sabaiGems, session.merchant
                    );
                    
                    return res.json({
                        success: true,
                        data: {
                            response: orderSummary,
                            sessionId: session.id,
                            cart: session.cart,
                            total: session.total,
                            requiresAction: 'payment_selection'
                        }
                    });
                } else {
                    return res.json({
                        success: true,
                        data: {
                            response: "Your cart is empty. Please add some items first.",
                            requiresAction: 'specify_items',
                            sessionId: session.id
                        }
                    });
                }
            }
            
            if (msg === '2') {
                return res.json({
                    success: true,
                    data: {
                        response: "Please type the correct names for the items you want to order. For example: '2 Chicken Biryani, 1 Butter Chicken'",
                        requiresAction: 'specify_items',
                        sessionId: session.id
                    }
                });
            }
            
            if (msg === '3') {
                const merchantData = await merchantDataService.getMerchantData(
                    session.merchant, null, null, null, {}
                );
                
                const suggestionsResponse = {
                    type: 'products_grid',
                    merchant: session.merchant,
                    products: merchantData.products?.slice(0, 12) || [],
                    message: "Here are some popular items you might like:",
                    canSelect: true
                };
                
                session.step = 'selecting_items';
                await this.saveSession(session);
                
                return res.json({
                    success: true,
                    data: {
                        response: suggestionsResponse,
                        requiresAction: 'select_items_grid',
                        sessionId: session.id,
                        merchant: session.merchant
                    }
                });
            }
            
            if (msg === 'clear cart' || msg === 'start over' || msg === 'reset') {
                session.cart = [];
                session.subtotal = 0;
                session.tax = 0;
                session.total = 0;
                session.step = 'awaiting_items';
                await this.saveSession(session);
                
                return res.json({
                    success: true,
                    data: {
                        response: "Cart cleared! What would you like to order?",
                        requiresAction: 'specify_items',
                        sessionId: session.id
                    }
                });
            }
            
            if (msg === 'show cart' || msg === 'view cart' || msg === 'my cart') {
                if (session.cart.length > 0) {
                    const reserveCheck = await this.checkReservePayEligibility(userId, session.merchant, session.total);
                    const sabaiGems = this.calculateSabaiGems(session.total);
                    const orderSummary = this.formatOrderSummary(
                        session.cart, [], session.subtotal, session.tax, session.total,
                        session.merchantInfo, reserveCheck, sabaiGems, session.merchant
                    );
                    
                    return res.json({
                        success: true,
                        data: {
                            response: orderSummary,
                            sessionId: session.id,
                            cart: session.cart,
                            total: session.total,
                            requiresAction: 'payment_selection'
                        }
                    });
                } else {
                    return res.json({
                        success: true,
                        data: {
                            response: "Your cart is empty. Add some items to get started!",
                            requiresAction: 'specify_items',
                            sessionId: session.id
                        }
                    });
                }
            }
            
            if (msg.length > 2 && !['1', '2', '3'].includes(msg)) {
                return this.processItemAddition(req, res, session, session.merchant, [{ name: msg, quantity: 1 }], {}, null);
            }
            
            if (session.cart.length > 0) {
                const reserveCheck = await this.checkReservePayEligibility(userId, session.merchant, session.total);
                const sabaiGems = this.calculateSabaiGems(session.total);
                const orderSummary = this.formatOrderSummary(
                    session.cart, [], session.subtotal, session.tax, session.total,
                    session.merchantInfo, reserveCheck, sabaiGems, session.merchant
                );
                
                return res.json({
                    success: true,
                    data: {
                        response: orderSummary,
                        sessionId: session.id,
                        cart: session.cart,
                        total: session.total,
                        requiresAction: 'payment_selection'
                    }
                });
            }
            
            return res.json({
                success: true,
                data: {
                    response: "What would you like to order? Please specify items with quantities.",
                    requiresAction: 'specify_items',
                    sessionId: session.id
                }
            });
            
        } catch (error) {
            console.error('❌ Selection error:', error);
            res.json({
                success: true,
                data: {
                    response: "I encountered an error. Please try again.",
                    requiresAction: 'retry'
                }
            });
        }
    }

    // ============================================
    // CONFIRM UPI PAYMENT
    // ============================================

    async confirmUPIPayment(req, res) {
        try {
            const { sessionId, paymentId } = req.body;
            const userId = req.user?.id ? String(req.user.id) : '4';
            
            let session = await this.getOrCreateSession(userId, sessionId);
            
            if (!session || session.cart.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        response: "Your cart is empty. Please add items first.",
                        requiresAction: 'specify_items'
                    }
                });
            }
            
            const roundedTotal = Math.round(session.total * 100) / 100;
            const sabaiGems = this.calculateSabaiGems(roundedTotal);
            
            const orderId = 'ORD' + Date.now();
            const now = new Date();
            const deliveryTime = new Date(now.getTime() + 45 * 60000);
            
            if (session.isScheduled && session.scheduledTime) {
                const scheduledOrder = await scheduledOrderService.scheduleOrder(
                    userId,
                    {
                        sessionId: session.id,
                        cart: session.cart,
                        merchant: session.merchant,
                        total: roundedTotal,
                        paymentMethod: 'upi',
                        paymentId: paymentId
                    },
                    session.scheduledTime,
                    'upi'
                );
                
                await this.deleteSession(session.id);
                
                const scheduledDate = new Date(session.scheduledTime);
                
                return res.json({
                    success: true,
                    data: {
                        response: `📅 **Order Scheduled!**\n\nYour order has been scheduled for ${scheduledDate.toLocaleString()}.\n\n**Order ID:** ${scheduledOrder.id}\n**Items:** ${session.cart.length} item(s)\n**Total:** ₹${roundedTotal}`,
                        requiresAction: 'complete',
                        isScheduled: true,
                        scheduledTime: session.scheduledTime
                    }
                });
            }
            
            const tracking = [
                { status: 'confirmed', label: 'Order Confirmed', completed: true, time: now.toLocaleTimeString() },
                { status: 'preparing', label: 'Preparing', completed: false, estimatedTime: deliveryTime.toLocaleTimeString() },
                { status: 'out_for_delivery', label: 'Out for Delivery', completed: false },
                { status: 'delivered', label: 'Delivered', completed: false }
            ];
            
            const order = {
                id: orderId,
                userId: session.userId,
                merchant: session.merchant,
                merchantName: session.merchantInfo?.name || session.merchant,
                items: session.cart,
                totalAmount: roundedTotal,
                status: 'confirmed',
                paymentMethod: 'UPI',
                paymentId,
                sabaiGems: sabaiGems,
                estimatedDelivery: '45 minutes',
                estimatedDeliveryTime: deliveryTime.toLocaleTimeString(),
                createdAt: now.toISOString(),
                tracking
            };
            
            await orderService.saveOrder(session.userId, order);
            
            await dbService.createTransaction({
                transaction_id: paymentId,
                user_id: session.userId,
                type: 'merchant_order',
                amount: roundedTotal,
                status: 'success',
                description: `Order payment to ${order.merchantName}`,
                merchant: session.merchant,
                bank_used: roundedTotal,
                cashback_earned: sabaiGems
            });
            
            await this.deleteSession(session.id);
            
            let confirmation = `🎉 **ORDER CONFIRMED!** 🎉\n\n`;
            confirmation += `**Order ID:** ${orderId}\n\n`;
            confirmation += `**Items Ordered:**\n\n`;
            session.cart.forEach(item => {
                confirmation += `• ${item.quantity}x ${item.name}\n`;
                confirmation += `   ₹${item.price.toFixed(2)} each = ₹${item.total.toFixed(2)}\n\n`;
            });
            confirmation += `**Total Amount:** ₹${roundedTotal.toFixed(2)}\n\n`;
            confirmation += `**Payment Method:** UPI\n`;
            confirmation += `**Transaction ID:** ${paymentId}\n`;
            confirmation += `**SabAI Gems Earned:** +${sabaiGems} 🪙\n\n`;
            confirmation += `**Estimated Delivery:** 45 minutes\n\n`;
            confirmation += `You can track this order in the My Orders section!`;
            
            return res.json({
                success: true,
                data: {
                    response: confirmation,
                    orderId,
                    order,
                    requiresAction: 'complete'
                }
            });
            
        } catch (error) {
            console.error('❌ Confirm payment error:', error);
            return res.json({
                success: true,
                data: {
                    response: "Payment was successful but order confirmation failed. Please check My Orders.",
                    requiresAction: 'retry'
                }
            });
        }
    }

    // ============================================
    // PROCESS RESERVE PAYMENT
    // ============================================

    async processReservePayment(req, res) {
        try {
            const { sessionId } = req.body;
            const userId = req.user?.id ? String(req.user.id) : '4';
            
            let session = await this.getOrCreateSession(userId, sessionId);
            
            if (!session || session.cart.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        response: "Your cart is empty. Please add items first.",
                        requiresAction: 'specify_items'
                    }
                });
            }
            
            const roundedTotal = Math.round(session.total * 100) / 100;
            const merchant = session.merchant;
            
            const reserveCheck = await this.checkReservePayEligibility(userId, merchant, roundedTotal);
            
            if (!reserveCheck.eligible) {
                return res.json({
                    success: true,
                    data: {
                        response: `❌ **Reserve Pay Declined**\n\n${reserveCheck.message}\n\nPlease use UPI payment instead.`,
                        requiresAction: 'payment_selection'
                    }
                });
            }
            
            const sabaiGems = this.calculateSabaiGems(roundedTotal);
            await this.updateUserReserveLimit(userId, merchant, roundedTotal);
            
            const orderId = 'ORD' + Date.now();
            const now = new Date();
            const deliveryTime = new Date(now.getTime() + 45 * 60000);
            
            if (session.isScheduled && session.scheduledTime) {
                const scheduledOrder = await scheduledOrderService.scheduleOrder(
                    userId,
                    {
                        sessionId: session.id,
                        cart: session.cart,
                        merchant: merchant,
                        total: roundedTotal,
                        paymentMethod: 'reserve_pay'
                    },
                    session.scheduledTime,
                    'reserve_pay'
                );
                
                await this.deleteSession(session.id);
                
                const scheduledDate = new Date(session.scheduledTime);
                
                return res.json({
                    success: true,
                    data: {
                        response: `📅 **Order Scheduled!**\n\nYour order has been scheduled for ${scheduledDate.toLocaleString()}.\n\n**Order ID:** ${scheduledOrder.id}\n**Items:** ${session.cart.length} item(s)\n**Total:** ₹${roundedTotal}`,
                        requiresAction: 'complete',
                        isScheduled: true,
                        scheduledTime: session.scheduledTime
                    }
                });
            }
            
            const tracking = [
                { status: 'confirmed', label: 'Order Confirmed', completed: true, time: now.toLocaleTimeString() },
                { status: 'preparing', label: 'Preparing', completed: false, estimatedTime: deliveryTime.toLocaleTimeString() },
                { status: 'out_for_delivery', label: 'Out for Delivery', completed: false },
                { status: 'delivered', label: 'Delivered', completed: false }
            ];
            
            const order = {
                id: orderId,
                userId: session.userId,
                merchant: session.merchant,
                merchantName: session.merchantInfo?.name || session.merchant,
                items: session.cart,
                totalAmount: roundedTotal,
                status: 'confirmed',
                paymentMethod: 'Reserve Pay',
                sabaiGems: sabaiGems,
                estimatedDelivery: '45 minutes',
                estimatedDeliveryTime: deliveryTime.toLocaleTimeString(),
                createdAt: now.toISOString(),
                tracking
            };
            
            await orderService.saveOrder(session.userId, order);
            
            await dbService.createTransaction({
                transaction_id: `TXN_${orderId}`,
                user_id: userId,
                type: 'reserve_pay',
                amount: roundedTotal,
                status: 'success',
                description: `Order payment to ${order.merchantName}`,
                merchant: merchant,
                reserve_used: roundedTotal,
                cashback_earned: sabaiGems
            });
            
            await this.deleteSession(session.id);
            
            let confirmation = `🎉 **ORDER CONFIRMED!** 🎉\n\n`;
            confirmation += `**Order ID:** ${orderId}\n\n`;
            confirmation += `**Items Ordered:**\n\n`;
            session.cart.forEach(item => {
                confirmation += `• ${item.quantity}x ${item.name}\n`;
                confirmation += `   ₹${item.price.toFixed(2)} each = ₹${item.total.toFixed(2)}\n\n`;
            });
            confirmation += `**Total Amount:** ₹${roundedTotal.toFixed(2)}\n\n`;
            confirmation += `**Payment Method:** Reserve Pay\n\n`;
            confirmation += `**SabAI Gems Earned:** +${sabaiGems} 🪙\n\n`;
            confirmation += `**Estimated Delivery:** 45 minutes\n\n`;
            confirmation += `You can track this order in the My Orders section!`;
            
            return res.json({
                success: true,
                data: {
                    response: confirmation,
                    orderId,
                    order,
                    requiresAction: 'complete'
                }
            });
            
        } catch (error) {
            console.error('❌ Reserve Pay error:', error);
            res.json({
                success: true,
                data: {
                    response: "Reserve Pay failed. Please try UPI payment.",
                    requiresAction: 'payment_selection'
                }
            });
        }
    }

    // ============================================
    // API ENDPOINTS
    // ============================================
    
    async getUserOrders(req, res) {
        try {
            const userId = String(req.user.id);
            let orders = await orderService.getUserOrders(userId) || [];
            let scheduled = await dbService.getScheduledOrders(userId) || [];
            const allOrders = [...orders, ...scheduled];
            allOrders.sort((a, b) => new Date(b.createdAt || b.scheduledTime) - new Date(a.createdAt || a.scheduledTime));
            return res.status(200).json({ success: true, data: allOrders });
        } catch (error) {
            console.error('❌ Get orders error:', error);
            return res.status(200).json({ success: true, data: [] });
        }
    }

    async getOrder(req, res) {
        try {
            const { orderId } = req.params;
            const userId = req.user.id;
            let order = await orderService.getOrder(orderId, userId);
            if (!order) {
                const scheduled = await dbService.getScheduledOrders(userId);
                order = scheduled.find(o => o.id === orderId);
            }
            if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
            
            const now = Date.now();
            const created = new Date(order.createdAt || order.scheduledTime).getTime();
            const elapsed = now - created;
            const deliveryMs = 45 * 60 * 1000;
            if (elapsed >= deliveryMs) {
                order.status = 'delivered';
            } else if (elapsed >= deliveryMs * 0.66) {
                order.status = 'out_for_delivery';
            } else if (elapsed >= deliveryMs * 0.33) {
                order.status = 'preparing';
            } else {
                order.status = 'confirmed';
            }
            res.json({ success: true, data: order });
        } catch (error) {
            console.error('❌ Get order error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getOrderStatus(req, res) {
        try {
            const { orderId } = req.params;
            const userId = req.user.id;
            let order = await orderService.getOrder(orderId, userId);
            if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
            res.json({ success: true, data: { status: order.status || 'confirmed', tracking: order.tracking || [], estimatedDelivery: order.estimatedDelivery || '45 minutes' } });
        } catch (error) {
            console.error('❌ Status error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async checkReservePayLimit(req, res) {
        try {
            const { merchant, amount } = req.body;
            const userId = req.user?.id ? String(req.user.id) : '4';
            const result = await this.checkReservePayEligibility(userId, merchant, amount);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('Reserve check error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getReserveLimits(req, res) {
        try {
            const userId = req.user?.id ? String(req.user.id) : '4';
            const limits = await dbService.getReserveLimits(userId);
            res.json({ success: true, data: limits });
        } catch (error) {
            console.error('Get limits error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async syncReserveLimits(req, res) {
        try {
            const userId = req.user?.id ? String(req.user.id) : '4';
            const { limits } = req.body;
            for (const limit of limits) {
                await dbService.createOrUpdateReserveLimit(userId, limit.merchant, {
                    merchant_name: limit.merchant_name,
                    merchant_category: limit.merchant_category,
                    monthly_limit: limit.monthly_limit,
                    per_transaction_limit: limit.per_transaction_limit,
                    requires_approval: limit.requires_approval || false,
                    is_active: limit.is_active !== false,
                    contributions: limit.contributions || []
                });
            }
            res.json({ success: true, message: "Limits synced successfully" });
        } catch (error) {
            console.error('Sync limits error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async updateReserveLimits(req, res) {
        try {
            const userId = req.user?.id ? String(req.user.id) : '4';
            const { merchant, updates } = req.body;
            await dbService.createOrUpdateReserveLimit(userId, merchant, updates);
            res.json({ success: true, message: "Limit updated successfully" });
        } catch (error) {
            console.error('Update limits error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async createRazorpayOrder(req, res) {
        try {
            const { amount } = req.body;
            const razorpayOrder = await paymentService.createOrder(amount, 'INR', `order_${Date.now()}`);
            if (!razorpayOrder.success) {
                return res.status(503).json({ success: false, message: razorpayOrder.error || 'Payment provider is unavailable' });
            }
            res.json({ success: true, data: { razorpayOrder: razorpayOrder.order } });
        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async checkMerchantConnection(req, res) {
        try {
            const userId = req.user?.id ? String(req.user.id) : '4';
            const { merchantId } = req.params;
            const isConnected = await merchantConnectionService.isConnected(userId, merchantId);
            return res.json({ success: true, data: { connected: isConnected, merchantId } });
        } catch (error) {
            console.error('❌ Connection check error:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    async getConnectedMerchants(req, res) {
        try {
            const userId = req.user?.id ? String(req.user.id) : '4';
            const connections = await merchantConnectionService.getConnectedMerchants(userId);
            return res.json({ success: true, data: connections });
        } catch (error) {
            console.error('❌ Get connections error:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    async confirmAutoPaySetup(req, res) {
        try {
            const { sessionId, schedule, dayOfMonth, bankAccountId, scheduledTime } = req.body;
            const userId = req.user?.id ? String(req.user.id) : '4';
            
            let session = await this.getOrCreateSession(userId, sessionId);
            
            if (!session || session.cart.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        response: "Your cart is empty. Please add items first.",
                        requiresAction: 'specify_items'
                    }
                });
            }
            
            if (scheduledTime) {
                session.isScheduled = true;
                session.scheduledTime = scheduledTime;
                await this.saveSession(session);
                return await this.processReservePayment({ body: { sessionId }, user: { id: userId } }, res);
            }
            
            const bankAccounts = await dbService.getBankAccounts(userId);
            const selectedBank = bankAccounts.find(b => b.id === bankAccountId);
            
            if (!selectedBank) {
                return res.json({
                    success: true,
                    data: {
                        response: "Selected bank account not found. Please add a bank account in Settings first.",
                        requiresAction: 'add_bank_account'
                    }
                });
            }
            
            const nextExecution = this.calculateNextExecution(schedule || 'monthly', dayOfMonth || new Date().getDate());
            
            const autoPayOrder = {
                orderId: `AP_${Date.now()}`,
                type: 'merchant',
                merchant: session.merchant,
                merchantName: session.merchantInfo?.name || session.merchant,
                amount: session.total,
                schedule: schedule || 'monthly',
                dateValue: dayOfMonth || new Date().getDate(),
                time: '09:00',
                paymentMethod: 'bank',
                bankAccountId: bankAccountId,
                bankName: selectedBank.bank_name,
                bankAccountLast4: selectedBank.account_number?.slice(-4) || '****',
                status: 'active',
                nextExecution: nextExecution,
                reminderDays: 3
            };
            
            await dbService.createAutoPayOrder(userId, autoPayOrder);
            await this.deleteSession(session.id);
            
            const nextDate = new Date(nextExecution);
            
            return res.json({
                success: true,
                data: {
                    response: {
                        type: 'auto_pay_confirmed',
                        title: 'Auto-Pay Order Confirmed! 🎉',
                        message: `Your recurring order for ${session.cart.length} item(s) from ${session.merchantInfo?.name || session.merchant} has been set up.`,
                        items: session.cart,
                        total: session.total,
                        schedule: `Every month on day ${dayOfMonth || new Date().getDate()}`,
                        nextPayment: nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                        autoPayId: autoPayOrder.orderId
                    },
                    requiresAction: 'complete'
                }
            });
            
        } catch (error) {
            console.error('Auto-Pay setup error:', error);
            return res.json({
                success: true,
                data: {
                    response: "Failed to set up Auto-Pay. Please try again.",
                    requiresAction: 'retry'
                }
            });
        }
    }

    calculateNextExecution(schedule, dayOfMonth) {
        const today = new Date();
        let nextDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
        if (nextDate <= today) {
            nextDate = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
        }
        nextDate.setHours(9, 0, 0, 0);
        return nextDate.toISOString();
    }
}

module.exports = new AgentOrderController();
