// backend/services/geminiChatService.js
// Pure Gemini for ALL general conversations

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class GeminiChatService {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.chatSessions = new Map();
        this.initialized = false;
        this.init();
    }

    init() {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
            
            if (!apiKey) {
                console.error('❌ GEMINI_API_KEY not found');
                return;
            }

            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 2048,
                }
            });
            
            this.initialized = true;
            console.log('✅ Gemini is ONLINE');
            
        } catch (error) {
            console.error('❌ Gemini init failed:', error.message);
        }
    }

    async processMessage(userId, message) {
        if (!this.initialized || !this.model) {
            throw new Error('Gemini not initialized');
        }

        try {
            if (!this.chatSessions.has(userId)) {
                const chat = this.model.startChat({
                    history: [
                        {
                            role: "user",
                            parts: [{ text: "You are SabAI, an AI assistant for SabAI Pay. You help with payments, orders, and general questions. Be helpful and conversational." }]
                        },
                        {
                            role: "model",
                            parts: [{ text: "I'm SabAI, ready to help!" }]
                        }
                    ]
                });
                this.chatSessions.set(userId, chat);
            }

            const chat = this.chatSessions.get(userId);
            
            console.log(`📤 Sending to Gemini: "${message.substring(0, 50)}..."`);
            
            const result = await chat.sendMessage(message);
            const response = await result.response;
            const text = response.text();
            
            return {
                success: true,
                response: text
            };

        } catch (error) {
            console.error('❌ Gemini error:', error.message);
            throw error;
        }
    }

    isAvailable() {
        return this.initialized;
    }

    clearChat(userId) {
        this.chatSessions.delete(userId);
    }
}

module.exports = new GeminiChatService();