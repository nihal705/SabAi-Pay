// backend/services/situationToOrderService.js
// CONVERTS USER SITUATIONS TO ORDER SUGGESTIONS

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * For licensing inquiries: sabaipaycontact@gmail.com
 */

class SituationToOrderService {
    constructor() {
        this.situationPatterns = {
            'pg_hostel': {
                keywords: ['pg', 'hostel', 'staying', 'living', 'room', 'accommodation', 'rent', 'paying guest'],
                categories: ['Personal Care', 'Household', 'Snacks', 'Beverages', 'Stationery'],
                items: [
                    { name: 'Toothbrush', category: 'Personal Care', price: 50, quantity: 1, essential: true },
                    { name: 'Toothpaste', category: 'Personal Care', price: 80, quantity: 1, essential: true },
                    { name: 'Bath Soap', category: 'Personal Care', price: 40, quantity: 2, essential: true },
                    { name: 'Shampoo', category: 'Personal Care', price: 150, quantity: 1, essential: true },
                    { name: 'Towel', category: 'Household', price: 200, quantity: 2, essential: true },
                    { name: 'Slippers', category: 'Household', price: 150, quantity: 1, essential: true },
                    { name: 'Bedsheet', category: 'Household', price: 400, quantity: 1, essential: true },
                    { name: 'Pillow', category: 'Household', price: 300, quantity: 1, essential: true },
                    { name: 'Iron Box', category: 'Household', price: 800, quantity: 1, essential: false },
                    { name: 'Extension Board', category: 'Household', price: 250, quantity: 1, essential: false },
                    { name: 'Water Bottle', category: 'Household', price: 100, quantity: 1, essential: true },
                    { name: 'Mug', category: 'Household', price: 50, quantity: 1, essential: true },
                    { name: 'Plate & Bowl Set', category: 'Household', price: 200, quantity: 1, essential: true },
                    { name: 'Spoon & Fork Set', category: 'Household', price: 100, quantity: 1, essential: true },
                    { name: 'Instant Noodles', category: 'Snacks', price: 50, quantity: 5, essential: false },
                    { name: 'Biscuits', category: 'Snacks', price: 30, quantity: 2, essential: false },
                    { name: 'Tea/Coffee', category: 'Beverages', price: 200, quantity: 1, essential: false },
                    { name: 'Notebook', category: 'Stationery', price: 40, quantity: 2, essential: false },
                    { name: 'Pen Set', category: 'Stationery', price: 50, quantity: 1, essential: false }
                ]
            },
            'sick_flu': {
                keywords: ['sick', 'fever', 'cold', 'flu', 'cough', 'not feeling well', 'under weather', 'viral', 'infection'],
                categories: ['Medicine', 'Health Drinks', 'Personal Care', 'Food'],
                items: [
                    { name: 'Paracetamol 500mg', category: 'Medicine', price: 30, quantity: 1, requiresPrescription: false, essential: true },
                    { name: 'Dolo 650', category: 'Medicine', price: 35, quantity: 1, requiresPrescription: false, essential: true },
                    { name: 'Cough Syrup', category: 'Medicine', price: 80, quantity: 1, requiresPrescription: false, essential: true },
                    { name: 'Vitamin C Tablets', category: 'Medicine', price: 120, quantity: 1, requiresPrescription: false, essential: true },
                    { name: 'ORS Packets', category: 'Health Drinks', price: 25, quantity: 5, essential: true },
                    { name: 'Soup (Instant)', category: 'Health Drinks', price: 60, quantity: 2, essential: true },
                    { name: 'Honey', category: 'Food', price: 150, quantity: 1, essential: false },
                    { name: 'Tissues', category: 'Personal Care', price: 50, quantity: 2, essential: true },
                    { name: 'Thermometer', category: 'Personal Care', price: 100, quantity: 1, essential: true },
                    { name: 'Face Mask', category: 'Personal Care', price: 50, quantity: 5, essential: true },
                    { name: 'Hand Sanitizer', category: 'Personal Care', price: 80, quantity: 1, essential: true },
                    { name: 'Soup (Chicken/Cream)', category: 'Health Drinks', price: 80, quantity: 2, essential: false }
                ]
            },
            'hungry_quick': {
                keywords: ['hungry', 'starving', 'need food', 'empty stomach', 'want to eat', 'craving'],
                categories: ['Fast Food', 'Snacks', 'Beverages', 'Meals'],
                items: [
                    { name: 'Chicken Biryani', category: 'Meals', price: 200, quantity: 1, essential: true },
                    { name: 'Veg Biryani', category: 'Meals', price: 160, quantity: 1, essential: true },
                    { name: 'Burger', category: 'Fast Food', price: 120, quantity: 1, essential: true },
                    { name: 'Pizza', category: 'Fast Food', price: 250, quantity: 1, essential: false },
                    { name: 'Sandwich', category: 'Snacks', price: 80, quantity: 1, essential: false },
                    { name: 'French Fries', category: 'Snacks', price: 60, quantity: 1, essential: false },
                    { name: 'Soft Drink', category: 'Beverages', price: 50, quantity: 1, essential: false },
                    { name: 'Water Bottle', category: 'Beverages', price: 20, quantity: 1, essential: true }
                ]
            },
            'cooking_at_home': {
                keywords: ['cook', 'cooking', 'homemade', 'kitchen', 'ingredients', 'prepare food', 'make dinner', 'make lunch'],
                categories: ['Staples', 'Vegetables', 'Dairy', 'Spices', 'Oils'],
                items: [
                    { name: 'Basmati Rice (5kg)', category: 'Staples', price: 300, quantity: 1, essential: true },
                    { name: 'Wheat Flour (5kg)', category: 'Staples', price: 200, quantity: 1, essential: true },
                    { name: 'Toor Dal (1kg)', category: 'Staples', price: 120, quantity: 1, essential: true },
                    { name: 'Cooking Oil (1L)', category: 'Oils', price: 120, quantity: 1, essential: true },
                    { name: 'Ghee (500ml)', category: 'Oils', price: 250, quantity: 1, essential: false },
                    { name: 'Salt', category: 'Spices', price: 20, quantity: 1, essential: true },
                    { name: 'Sugar (1kg)', category: 'Staples', price: 45, quantity: 1, essential: true },
                    { name: 'Turmeric Powder', category: 'Spices', price: 30, quantity: 1, essential: true },
                    { name: 'Red Chilli Powder', category: 'Spices', price: 40, quantity: 1, essential: true },
                    { name: 'Coriander Powder', category: 'Spices', price: 35, quantity: 1, essential: true },
                    { name: 'Garam Masala', category: 'Spices', price: 50, quantity: 1, essential: false },
                    { name: 'Milk (1L)', category: 'Dairy', price: 60, quantity: 2, essential: true },
                    { name: 'Curd (500g)', category: 'Dairy', price: 40, quantity: 1, essential: true },
                    { name: 'Paneer (200g)', category: 'Dairy', price: 60, quantity: 1, essential: false },
                    { name: 'Eggs (6)', category: 'Dairy', price: 50, quantity: 1, essential: true },
                    { name: 'Onion (1kg)', category: 'Vegetables', price: 40, quantity: 1, essential: true },
                    { name: 'Tomato (1kg)', category: 'Vegetables', price: 30, quantity: 1, essential: true },
                    { name: 'Potato (1kg)', category: 'Vegetables', price: 30, quantity: 1, essential: true },
                    { name: 'Garlic', category: 'Vegetables', price: 50, quantity: 1, essential: true },
                    { name: 'Ginger', category: 'Vegetables', price: 40, quantity: 1, essential: true }
                ]
            },
            'party_hosting': {
                keywords: ['party', 'guests', 'friends coming', 'gathering', 'celebration', 'birthday', 'get together'],
                categories: ['Snacks', 'Beverages', 'Desserts', 'Main Course'],
                items: [
                    { name: 'Chicken Biryani (Family Pack)', category: 'Main Course', price: 600, quantity: 1, essential: true },
                    { name: 'Veg Biryani (Family Pack)', category: 'Main Course', price: 500, quantity: 1, essential: false },
                    { name: 'Chicken 65', category: 'Snacks', price: 250, quantity: 1, essential: true },
                    { name: 'Paneer Tikka', category: 'Snacks', price: 299, quantity: 1, essential: false },
                    { name: 'Samosa (12 pcs)', category: 'Snacks', price: 120, quantity: 1, essential: true },
                    { name: 'Soft Drink (2L)', category: 'Beverages', price: 80, quantity: 2, essential: true },
                    { name: 'Juice Pack (1L)', category: 'Beverages', price: 100, quantity: 2, essential: false },
                    { name: 'Gulab Jamun (12 pcs)', category: 'Desserts', price: 150, quantity: 1, essential: true },
                    { name: 'Ice Cream (1L)', category: 'Desserts', price: 200, quantity: 1, essential: false },
                    { name: 'Chips Variety Pack', category: 'Snacks', price: 150, quantity: 1, essential: false },
                    { name: 'Paper Plates & Cups', category: 'Party Supplies', price: 100, quantity: 1, essential: true }
                ]
            },
            'study_exam': {
                keywords: ['study', 'exam', 'assignment', 'project', 'deadline', 'college', 'university', 'student'],
                categories: ['Stationery', 'Snacks', 'Beverages', 'Study Supplies'],
                items: [
                    { name: 'Notebook (200 pages)', category: 'Stationery', price: 80, quantity: 3, essential: true },
                    { name: 'Pen Set (5 pens)', category: 'Stationery', price: 50, quantity: 1, essential: true },
                    { name: 'Highlighter Set', category: 'Stationery', price: 100, quantity: 1, essential: false },
                    { name: 'Sticky Notes', category: 'Stationery', price: 40, quantity: 1, essential: false },
                    { name: 'Coffee (Instant)', category: 'Beverages', price: 200, quantity: 1, essential: true },
                    { name: 'Tea Bags', category: 'Beverages', price: 100, quantity: 1, essential: false },
                    { name: 'Energy Drink', category: 'Beverages', price: 80, quantity: 2, essential: false },
                    { name: 'Biscuits', category: 'Snacks', price: 30, quantity: 2, essential: true },
                    { name: 'Namkeen', category: 'Snacks', price: 50, quantity: 1, essential: false },
                    { name: 'Printer Paper (500 sheets)', category: 'Stationery', price: 300, quantity: 1, essential: false }
                ]
            }
        };
    }

    async analyzeSituation(message) {
        const msg = message.toLowerCase();
        let matchedSituation = null;
        let maxMatches = 0;
        let matchedKeywords = [];
        
        for (const [situation, pattern] of Object.entries(this.situationPatterns)) {
            let matchCount = 0;
            let keywords = [];
            for (const keyword of pattern.keywords) {
                if (msg.includes(keyword)) {
                    matchCount++;
                    keywords.push(keyword);
                }
            }
            if (matchCount > maxMatches) {
                maxMatches = matchCount;
                matchedSituation = situation;
                matchedKeywords = keywords;
            }
        }
        
        if (!matchedSituation || maxMatches === 0) {
            return null;
        }
        
        const pattern = this.situationPatterns[matchedSituation];
        return {
            situation: matchedSituation,
            confidence: maxMatches / pattern.keywords.length,
            matchedKeywords: matchedKeywords,
            categories: pattern.categories,
            suggestedItems: pattern.items,
            explanation: this.getSituationExplanation(matchedSituation),
            essentialItems: pattern.items.filter(i => i.essential),
            nonEssentialItems: pattern.items.filter(i => !i.essential)
        };
    }

    getSituationExplanation(situation) {
        const explanations = {
            'pg_hostel': "🏠 Based on your PG/Hostel accommodation needs, here are essential items to make your stay comfortable. I've listed must-have items first.",
            'sick_flu': "🤒 I see you're not feeling well. Here are some medicines and essentials that might help. ⚠️ Please consult a doctor if symptoms persist.",
            'hungry_quick': "🍔 Sounds like you're hungry! Here are quick food options for instant satisfaction.",
            'cooking_at_home': "🍳 Planning to cook at home? Here are basic ingredients to get started with your kitchen.",
            'party_hosting': "🎉 Hosting a party? Here's everything you need for a successful gathering!",
            'study_exam': "📚 Getting ready for exams? Here are study essentials and snacks to keep you going!"
        };
        return explanations[situation] || "Based on your situation, here are suggested items:";
    }

    async generateInteractiveSuggestions(merchant, situationAnalysis, userLocation, merchantDataService) {
        const { suggestedItems, situation, explanation, essentialItems, nonEssentialItems } = situationAnalysis;
        
        // Enhance items with merchant-specific pricing and images
        const enhancedEssentialItems = await this.enhanceItemsWithMerchantData(
            essentialItems, merchant, userLocation, merchantDataService
        );
        
        const enhancedNonEssentialItems = await this.enhanceItemsWithMerchantData(
            nonEssentialItems, merchant, userLocation, merchantDataService
        );
        
        const allItems = [...enhancedEssentialItems, ...enhancedNonEssentialItems];
        
        return {
            type: 'situation_suggestions',
            situation: situation,
            explanation: explanation,
            essentialItems: enhancedEssentialItems,
            otherItems: enhancedNonEssentialItems,
            allItems: allItems,
            categories: [...new Set(allItems.map(i => i.category))],
            merchant: merchant,
            totalEstimatedCost: allItems.reduce((sum, i) => sum + (i.price * (i.suggestedQuantity || 1)), 0),
            canCustomize: true,
            actions: [
                { label: '🛒 Order Essentials', action: 'order_essentials', items: enhancedEssentialItems },
                { label: '📋 Select Items', action: 'select_items', items: allItems },
                { label: '✏️ Customize List', action: 'customize' }
            ]
        };
    }

    async enhanceItemsWithMerchantData(items, merchant, userLocation, merchantDataService) {
        const enhancedItems = [];
        
        for (const item of items) {
            try {
                // Search for the item in merchant's catalog
                const merchantData = await merchantDataService.getMerchantData(
                    merchant, userLocation?.city, userLocation?.area, item.name
                );
                
                let merchantItem = null;
                
                if (merchantData?.type === 'search_results' && merchantData.items?.length > 0) {
                    merchantItem = merchantData.items[0];
                } else if (merchantData?.type === 'products_grid' && merchantData.products?.length > 0) {
                    merchantItem = merchantData.products.find(p => 
                        p.name.toLowerCase().includes(item.name.toLowerCase())
                    ) || merchantData.products[0];
                }
                
                enhancedItems.push({
                    id: `sugg_${Date.now()}_${Math.random()}_${item.name.replace(/\s/g, '_')}`,
                    name: item.name,
                    price: merchantItem?.price || item.price,
                    originalPrice: item.price,
                    category: item.category,
                    imageUrl: merchantItem?.imageUrl || `/images/items/${item.category?.toLowerCase() || 'default'}.png`,
                    isVeg: !item.name.toLowerCase().includes('chicken') && !item.name.toLowerCase().includes('mutton'),
                    essential: item.essential || false,
                    suggestedQuantity: item.quantity || 1,
                    requiresPrescription: item.requiresPrescription || false,
                    inStock: merchantItem?.inStock !== false,
                    merchantItemId: merchantItem?.id
                });
            } catch (error) {
                // Fallback to original item data
                enhancedItems.push({
                    id: `sugg_fallback_${Date.now()}_${item.name.replace(/\s/g, '_')}`,
                    name: item.name,
                    price: item.price,
                    originalPrice: item.price,
                    category: item.category,
                    imageUrl: `/images/items/${item.category?.toLowerCase() || 'default'}.png`,
                    isVeg: !item.name.toLowerCase().includes('chicken') && !item.name.toLowerCase().includes('mutton'),
                    essential: item.essential || false,
                    suggestedQuantity: item.quantity || 1,
                    requiresPrescription: item.requiresPrescription || false,
                    inStock: true
                });
            }
        }
        
        return enhancedItems;
    }

    getSituationPrompt(situation) {
        const prompts = {
            'pg_hostel': "I'm setting up a new PG/hostel room and need essentials",
            'sick_flu': "I need medicines and supplies because I'm sick",
            'hungry_quick': "I'm hungry and want food quickly",
            'cooking_at_home': "I want to cook at home and need ingredients",
            'party_hosting': "I'm hosting a party and need supplies",
            'study_exam': "I'm preparing for exams and need study supplies"
        };
        return prompts[situation] || "I need some items";
    }
}

module.exports = new SituationToOrderService();