// backend/services/geminiChatService.js
// COMPLETE FIXED VERSION - One decision-maker with slot state

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const agentToolRegistry = require('./agentToolRegistry');
require('dotenv').config();

class GeminiChatService {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.chatSessions = new Map();
        this.initialized = false;
        this.availableModels = [];
        this.init();
    }

    async init() {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
            
            if (!apiKey) {
                console.error('❌ GEMINI_API_KEY not found');
                return;
            }

            this.genAI = new GoogleGenerativeAI(apiKey);
            
            // Check available models
            await this.checkAvailableModels();
            
            // Create model with tools
            const tools = agentToolRegistry.getToolDefinitions();
            
            this.model = this.genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
                tools: [{ functionDeclarations: tools }],
                toolConfig: {
                    functionCallingConfig: {
                        mode: 'auto',
                    },
                },
            });
            
            this.initialized = true;
            console.log(`✅ Gemini is ONLINE with model: ${modelName}`);
            console.log(`🔧 Tools available: ${tools.length}`);
            
        } catch (error) {
            console.error('❌ Gemini init failed:', error.message);
        }
    }

    async checkAvailableModels() {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
            );
            const data = await response.json();
            if (data.models) {
                this.availableModels = data.models
                    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                    .map(m => m.name.replace('models/', ''));
                console.log(`📋 Available models: ${this.availableModels.join(', ')}`);
                
                // Check if configured model is available
                const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
                if (!this.availableModels.includes(configuredModel)) {
                    console.warn(`⚠️ Model "${configuredModel}" not available. Available: ${this.availableModels.join(', ')}`);
                }
            }
        } catch (e) {
            // Silent fail - just continue
        }
    }

    async processMessage(userId, message, context = {}) {
        if (!this.initialized || !this.model) {
            throw new Error('Gemini not initialized');
        }

        try {
            const sessionKey = `func_${userId}`;
            const systemInstruction = this.buildSystemInstruction(userId, context);
            
            // Get or create chat session
            let chat;
            if (!this.chatSessions.has(sessionKey)) {
                chat = this.model.startChat({
                    history: [
                        {
                            role: "user",
                            parts: [{ text: systemInstruction }]
                        },
                        {
                            role: "model",
                            parts: [{ text: "I understand. I'm SabAI, your AI payment assistant. I have access to all SabAI Pay tools. How can I help you today?" }]
                        }
                    ],
                });
                this.chatSessions.set(sessionKey, chat);
            } else {
                chat = this.chatSessions.get(sessionKey);
            }
            
            console.log(`📤 Sending to Gemini: "${message.substring(0, 50)}..."`);

            const result = await chat.sendMessage(message);
            const response = await result.response;
            
            // FIX: functionCalls is a property, not a method
            const functionCalls = response.functionCalls || [];
            
            if (functionCalls && functionCalls.length > 0) {
                console.log(`🔧 Gemini called ${functionCalls.length} function(s)`);
                
                const functionResults = [];
                for (const call of functionCalls) {
                    const result = await this.handleFunctionCall(userId, call, context);
                    functionResults.push(result);
                }
                
                if (functionResults.length > 0) {
                    try {
                        const finalResult = await chat.sendMessage(
                            functionResults.map(r => ({
                                functionResponse: {
                                    name: r.name,
                                    response: r.response
                                }
                            }))
                        );
                        const finalResponse = await finalResult.response;
                        return {
                            success: true,
                            response: finalResponse.text(),
                            functionCalls: functionCalls.map(c => c.name),
                            functionResults: functionResults,
                            requiresAction: this.detectRequiresAction(functionResults)
                        };
                    } catch (finalError) {
                        console.error('Error sending function results:', finalError.message);
                        return {
                            success: true,
                            response: this.buildFallbackResponse(functionResults),
                            functionCalls: functionCalls.map(c => c.name),
                            functionResults: functionResults,
                            requiresAction: this.detectRequiresAction(functionResults)
                        };
                    }
                }
            }

            return {
                success: true,
                response: response.text(),
                functionCalls: [],
                requiresAction: false
            };

        } catch (error) {
            console.error('❌ Gemini error:', error.message);
            throw error;
        }
    }

    detectRequiresAction(functionResults) {
        for (const result of functionResults) {
            if (result.response && result.response.requiresAction) {
                return true;
            }
            if (result.response && result.response.status === 'ready') {
                return true;
            }
        }
        return false;
    }

    buildFallbackResponse(functionResults) {
        for (const result of functionResults) {
            if (result.response && result.response.message) {
                return result.response.message;
            }
            if (result.response && result.response.status === 'ready') {
                return 'Payment is ready for confirmation. Please review the details.';
            }
        }
        return 'I\'ve processed your request. Please check the details.';
    }

    async handleFunctionCall(userId, call, context) {
        const functionName = call.name;
        const args = call.args || {};
        
        console.log(`🔧 Executing: ${functionName}`, args);

        try {
            let result;

            // ORDERING FUNCTIONS
            if (functionName === 'check_merchant_connected') {
                result = await this.checkMerchantConnected(userId, args.merchant);
            } else if (functionName === 'list_supported_merchants') {
                result = await this.listSupportedMerchants(args.category);
            } else if (functionName === 'find_restaurants_nearby') {
                result = await this.findRestaurantsNearby(userId, args.merchant, args.location, args.cuisine);
            } else if (functionName === 'get_menu') {
                result = await this.getMenu(userId, args.merchant, args.restaurantId);
            } else if (functionName === 'search_items') {
                result = await this.searchItems(userId, args.merchant, args.query, args.location);
            } else if (functionName === 'cart_add_item') {
                result = await this.cartAddItem(userId, args.itemId, args.quantity);
            } else if (functionName === 'cart_remove_item') {
                result = await this.cartRemoveItem(userId, args.itemId);
            } else if (functionName === 'cart_update_quantity') {
                result = await this.cartUpdateQuantity(userId, args.itemId, args.quantity);
            } else if (functionName === 'cart_view') {
                result = await this.cartView(userId);
            } else if (functionName === 'check_reserve_pay_limit') {
                result = await this.checkReservePayLimit(userId, args.merchant, args.amount);
            } else if (functionName === 'initiate_payment') {
                result = await this.initiatePayment(userId, args.method, args.amount);
            } else if (functionName === 'get_order_status') {
                result = await this.getOrderStatus(userId, args.orderId);
            } else if (functionName === 'get_user_location') {
                result = await this.getUserLocation(userId);
            } else if (functionName === 'request_location') {
                result = await this.requestLocation(userId);

            // PAYMENT FUNCTIONS - LAZY LOAD to avoid circular dependency
            } else if (functionName === 'send_money') {
                const agentPaymentController = require('../controllers/agentPaymentController');
                result = await agentPaymentController.sendMoney(userId, args.recipient, args.amount, args.note);
                result = this.formatPaymentResult(result, 'send_money');
            } else if (functionName === 'request_money') {
                const agentPaymentController = require('../controllers/agentPaymentController');
                result = await agentPaymentController.requestMoney(userId, args.recipient, args.amount, args.note);
                result = this.formatPaymentResult(result, 'request_money');
            } else if (functionName === 'pay_bill') {
                const agentPaymentController = require('../controllers/agentPaymentController');
                result = await agentPaymentController.payBill(userId, args.billType, args.provider, args.customerId, args.amount);
                result = this.formatPaymentResult(result, 'pay_bill');
            } else if (functionName === 'recharge_mobile') {
                const agentPaymentController = require('../controllers/agentPaymentController');
                result = await agentPaymentController.rechargeMobile(userId, args.mobileNumber, args.amount, args.plan);
                result = this.formatPaymentResult(result, 'recharge_mobile');
            } else if (functionName === 'multi_payment') {
                const agentPaymentController = require('../controllers/agentPaymentController');
                result = await agentPaymentController.multiPayment(userId, args.payments);
                result = this.formatPaymentResult(result, 'multi_payment');
            } else if (functionName === 'get_contacts') {
                result = await this.getContacts(userId);
            } else if (functionName === 'get_billers') {
                result = await this.getBillers();
            } else if (functionName === 'detect_operator') {
                result = await this.detectOperator(args.mobileNumber);
            } else if (functionName === 'get_recharge_plans') {
                result = await this.getRechargePlans(args.operator);

            } else {
                result = { error: `Unknown function: ${functionName}` };
            }

            return {
                name: functionName,
                response: result
            };

        } catch (error) {
            console.error(`❌ Function ${functionName} error:`, error);
            return {
                name: functionName,
                response: { error: error.message }
            };
        }
    }

    formatPaymentResult(result, type) {
        if (result && result.status === 'ready') {
            const cardType = this.getCardType(type);
            return {
                type: cardType,
                status: 'ready',
                requiresAction: 'confirm_payment',
                paymentData: result.paymentData,
                message: result.message,
                ...result
            };
        }
        return result;
    }

    getCardType(type) {
        const map = {
            'send_money': 'send_money_card',
            'request_money': 'send_money_card',
            'pay_bill': 'bill_pay_card',
            'recharge_mobile': 'recharge_card',
            'multi_payment': 'multi_payment_card'
        };
        return map[type] || 'payment_card';
    }

    // ============================================
    // ORDERING FUNCTION IMPLEMENTATIONS
    // ============================================

    async checkMerchantConnected(userId, merchant) {
        const dbService = require('./databaseService');
        const connected = await dbService.isMerchantConnected(userId, merchant);
        return { connected, merchant };
    }

    async listSupportedMerchants(category) {
        const { availableMerchants } = require('./merchantConnectionService');
        let merchants = availableMerchants;
        if (category && category !== 'all') {
            merchants = merchants.filter(m => m.category === category);
        }
        return merchants.map(m => ({ id: m.id, name: m.name, category: m.category }));
    }

    async findRestaurantsNearby(userId, merchant, location, cuisine) {
        const merchantLocationService = require('./merchantLocationService');
        const restaurants = await merchantLocationService.getRestaurantsByLocation(merchant, location);
        let filtered = restaurants;
        if (cuisine) {
            filtered = restaurants.filter(r => r.cuisine?.toLowerCase().includes(cuisine.toLowerCase()));
        }
        return { restaurants: filtered.slice(0, 10), merchant, location };
    }

    async getMenu(userId, merchant, restaurantId) {
        const merchantLocationService = require('./merchantLocationService');
        const dbService = require('./databaseService');
        const connection = await dbService.getMerchantConnection(userId, merchant);
        const city = connection?.location_city || 'bangalore';
        const menu = await merchantLocationService.getRestaurantMenu(merchant, city, restaurantId);
        return { menu: menu.slice(0, 20), restaurantId, merchant };
    }

    async searchItems(userId, merchant, query, location) {
        const merchantLocationService = require('./merchantLocationService');
        const items = await merchantLocationService.searchItems(merchant, location || 'bangalore', query);
        return { items: items.slice(0, 20), query, merchant };
    }

    async cartAddItem(userId, itemId, quantity) {
        return { success: true, itemId, quantity };
    }

    async cartRemoveItem(userId, itemId) {
        return { success: true, itemId };
    }

    async cartUpdateQuantity(userId, itemId, quantity) {
        return { success: true, itemId, quantity };
    }

    async cartView(userId) {
        return { cart: [] };
    }

    async checkReservePayLimit(userId, merchant, amount) {
        const agentSecurityService = require('./agentSecurityService');
        const result = await agentSecurityService.isSabAIPayLiteAvailable(userId, amount);
        return { ...result, merchant, amount };
    }

    async initiatePayment(userId, method, amount) {
        return { method, amount, status: 'pending' };
    }

    async getOrderStatus(userId, orderId) {
        const orderService = require('./orderService');
        const order = await orderService.getOrder(orderId, userId);
        return order || { error: 'Order not found' };
    }

    async getUserLocation(userId) {
        const dbService = require('./databaseService');
        const connections = await dbService.getConnectedMerchants(userId);
        const locations = connections.map(c => ({
            merchant: c.merchant_id,
            city: c.location_city,
            area: c.location_area
        }));
        return { locations };
    }

    async requestLocation(userId) {
        return { message: 'Please share your location to continue.', requiresLocation: true };
    }

    // ============================================
    // PAYMENT HELPER FUNCTIONS
    // ============================================

    async getContacts(userId) {
        const dbService = require('./databaseService');
        const contacts = await dbService.getContacts(userId);
        return { contacts: contacts.slice(0, 20) };
    }

    async getBillers() {
        const billerCatalogService = require('./billerCatalogService');
        const billers = billerCatalogService.getAllBillers();
        return { billers: billers.map(b => ({ id: b.id, name: b.name, category: b.category })) };
    }

    async detectOperator(mobileNumber) {
        const rechargePlanService = require('./rechargePlanService');
        const operator = rechargePlanService.detectOperator(mobileNumber);
        return { operator: operator || null, mobileNumber };
    }

    async getRechargePlans(operator) {
        const rechargePlanService = require('./rechargePlanService');
        const plans = rechargePlanService.getPlans(operator);
        return { plans, operator };
    }

    // ============================================
    // SYSTEM INSTRUCTION - Uses pending intent state
    // ============================================
    buildSystemInstruction(userId, context) {
        return `You are SabAI, an AI payment assistant for SabAI Pay.

You have access to the following functions:
- recharge_mobile: Recharge a mobile number
- send_money: Send money to a recipient
- pay_bill: Pay utility bills
- multi_payment: Process multiple payments at once

IMPORTANT - PENDING INTENT STATE:
If a user is in the middle of a flow, use the context to know what's already provided.
Only ask for what's actually missing. Do not ask for information already provided.

User ID: ${userId}

Examples:
- If user said "send money to Ramesh" and you asked for amount, and they reply "500", call send_money({ recipient: "Ramesh", amount: 500 })
- If user said "recharge 299" and you asked for number, and they reply "9876543210", call recharge_mobile({ mobileNumber: "9876543210", amount: 299 })

Be conversational but efficient. Don't ask for information already provided.`;
    }

    isAvailable() {
        return this.initialized;
    }

    clearChat(userId) {
        this.chatSessions.delete(`func_${userId}`);
    }
}

const geminiService = new GeminiChatService();
module.exports = geminiService;