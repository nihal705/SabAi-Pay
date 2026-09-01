// backend/routes/agentRoutes.js
// Handles ALL general chat - routes to Gemini

const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiChatService');
const dbService = require('../services/databaseService');
const { verifyToken } = require('../middleware/auth');

// Helper to get user ID
const getUserId = (req) => String(req.user.id);

// Generate conversation ID
const generateConversationId = () => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Send message to AI agent
router.post('/chat', verifyToken, async (req, res) => {
    try {
        const userId = getUserId(req);
        const { message, sessionId } = req.body;
        
        console.log(`💬 Chat request from user ${userId}: ${message}`);

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message required' });
        }

        let conversationId = sessionId;
        
        // Create new conversation if no session ID
        if (!conversationId) {
            conversationId = generateConversationId();
            await dbService.createConversation(userId, conversationId, message.slice(0, 50));
        }
        
        // Save user message
        await dbService.addMessage(conversationId, 'user', message);
        
        // Get AI response from Gemini
        const result = await geminiService.processMessage(userId, message);
        
        // Save agent response
        await dbService.addMessage(
            conversationId, 
            'agent', 
            result.response, 
            conversationId, 
            result.cart || null, 
            result.total || null, 
            result.requiresAction || false, 
            result.merchant || null
        );
        
        // Update conversation title if this is first message
        const messages = await dbService.getMessages(conversationId);
        if (messages.length <= 2) {
            const title = message.length > 30 ? message.slice(0, 30) + '...' : message;
            await dbService.updateConversation(conversationId, { title });
        }

        res.json({
            success: true,
            data: {
                response: result.response,
                sessionId: conversationId,
                timestamp: new Date().toISOString(),
                requiresAction: result.requiresAction || false,
                merchant: result.merchant || null,
                cart: result.cart || null,
                total: result.total || null
            }
        });

    } catch (error) {
        console.error('❌ Chat error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all conversations for user
router.get('/conversations', verifyToken, async (req, res) => {
    try {
        const userId = getUserId(req);
        const conversations = await dbService.getConversations(userId);
        
        // Add preview of last message
        const conversationsWithPreview = await Promise.all(conversations.map(async (conv) => {
            const messages = await dbService.getMessages(conv.conversation_id);
            const lastMessage = messages[messages.length - 1];
            return {
                ...conv,
                preview: lastMessage?.content?.slice(0, 100) || 'No messages',
                messageCount: messages.length
            };
        }));
        
        res.json({ success: true, data: conversationsWithPreview });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get conversation messages
router.get('/conversations/:conversationId', verifyToken, async (req, res) => {
    try {
        const userId = getUserId(req);
        const { conversationId } = req.params;
        
        // Verify conversation belongs to user
        const conversations = await dbService.getConversations(userId);
        const conversation = conversations.find(c => c.conversation_id === conversationId);
        
        if (!conversation) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }
        
        const messages = await dbService.getMessages(conversationId);
        
        res.json({ success: true, data: messages });
    } catch (error) {
        console.error('Get conversation messages error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete conversation
router.delete('/conversations/:conversationId', verifyToken, async (req, res) => {
    try {
        const userId = getUserId(req);
        const { conversationId } = req.params;
        
        await dbService.deleteConversation(conversationId, userId);
        
        res.json({ success: true, message: 'Conversation deleted' });
    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Clear current chat (start new conversation)
router.post('/clear', verifyToken, async (req, res) => {
    try {
        // Just return success - new conversation will be created on next message
        res.json({ success: true, message: 'Chat cleared. Start a new conversation!' });
    } catch (error) {
        console.error('Clear chat error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
