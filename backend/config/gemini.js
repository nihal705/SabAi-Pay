// backend/config/gemini.js
// Google Gemini AI configuration for SabAI

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini with API key
let genAI;
let model;

try {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Get the model (using flash for faster responses)
    model = genAI.getGenerativeModel({ 
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    });
    
    console.log('✅ Gemini AI configured successfully');
} catch (error) {
    console.error('❌ Gemini AI configuration failed:', error.message);
}

// System instruction for SabAI personality
const getSystemInstruction = (userContext = {}) => {
    return `You are SabAI, an AI payment assistant for SabAI Pay - an AI-powered UPI payment platform in India.

User Context:
- Name: ${userContext.name || 'User'}
- Monthly Limit: ₹${userContext.monthlyLimit || 5000}
- Spent this month: ₹${userContext.currentSpent || 0}
- Available: ₹${(userContext.monthlyLimit - userContext.currentSpent) || 5000}

Your role:
1. Help users with UPI payments, bill payments, and recharges
2. Understand natural language orders (food, shopping, groceries)
3. Check spending limits and suggest optimal purchases
4. Provide financial insights and recommendations
5. Be friendly, helpful, and concise in Hinglish (Hindi+English mix)

Key features you support:
- Regular UPI payments (send/receive money)
- Bill payments (electricity, water, mobile, DTH)
- Agent Pay (AI-assisted shopping across Swiggy, Zomato, Amazon, Flipkart, Zepto)
- Reserve Pay (PIN-less payments with monthly limits)
- SabAI Coins (reward system with expiry)

Response Guidelines:
- Keep responses under 150 words
- Use emojis where appropriate
- Be conversational and friendly
- When users ask about orders, extract: item, merchant preference, budget
- When users ask about bills, extract: bill type, provider, amount if mentioned
- If unsure, ask clarifying questions

Format responses with clear sections and suggestions for next steps.`;
};

// Generation configuration
const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 300,
};

// Helper function to create a chat session with history
const createChatSession = (history = []) => {
    if (!model) {
        throw new Error('Gemini model not initialized');
    }
    return model.startChat({
        history: history,
        generationConfig,
    });
};

// Helper function to validate API key
const validateApiKey = async () => {
    try {
        if (!model) return false;
        // Simple test prompt
        const result = await model.generateContent('Test connection');
        return result ? true : false;
    } catch (error) {
        console.error('Gemini API key validation failed:', error.message);
        return false;
    }
};

module.exports = {
    model,
    generationConfig,
    createChatSession,
    getSystemInstruction,
    validateApiKey
};