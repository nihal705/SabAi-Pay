// backend/routes/agentRoutes.js
// COMPLETE FIXED VERSION - With fallback for Gemini quota

const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiChatService');
const dbService = require('../services/databaseService');
const agentPaymentController = require('../controllers/agentPaymentController');
const { verifyToken } = require('../middleware/auth');

const getUserId = (req) => String(req.user.id);
const generateConversationId = () => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================
// FALLBACK: Detect payment intent from text
// ============================================
function detectPaymentIntent(message) {
    const msg = message.toLowerCase().trim();
    
    // Mobile Recharge
    const rechargePatterns = [
        /recharge\s+(?:my\s+)?(?:mobile|phone)?/i,
        /mobile\s+recharge/i,
        /phone\s+recharge/i,
        /top\s*up/i,
        /data\s+pack/i,
        /talktime/i
    ];
    
    for (const pattern of rechargePatterns) {
        if (pattern.test(msg)) {
            const numberMatch = msg.match(/\b[6-9]\d{9}\b/);
            const amountMatch = msg.match(/(?:rs\.?|rs|₹)\s*(\d+)/i) || msg.match(/\b(\d+)\s*(?:rs\.?|rs|₹)/i);
            const operatorMatch = msg.match(/\b(jio|airtel|vi|vodafone|bsnl)\b/i);
            
            return {
                type: 'recharge',
                mobileNumber: numberMatch ? numberMatch[0] : null,
                amount: amountMatch ? parseInt(amountMatch[1]) : null,
                operator: operatorMatch ? operatorMatch[1].toLowerCase() : null
            };
        }
    }
    
    // Send Money
    const sendPatterns = [
        /send\s+(?:money|payment)?/i,
        /send\s+to/i,
        /pay\s+to/i,
        /transfer\s+to/i
    ];
    
    for (const pattern of sendPatterns) {
        if (pattern.test(msg)) {
            const amountMatch = msg.match(/(?:rs\.?|rs|₹)\s*(\d+)/i) || msg.match(/\b(\d+)\s*(?:rs\.?|rs|₹)/i);
            let recipient = null;
            const toMatch = msg.match(/(?:send|pay|transfer)\s+(?:to\s+)?([a-zA-Z\s]{2,})/i);
            if (toMatch && toMatch[1]) {
                const potential = toMatch[1].trim();
                if (!['money', 'cash', 'payment', 'friend', 'him', 'her', 'them'].includes(potential.toLowerCase())) {
                    recipient = potential;
                }
            }
            return {
                type: 'send_money',
                recipient: recipient || null,
                amount: amountMatch ? parseInt(amountMatch[1]) : null
            };
        }
    }
    
    // Bill Payment
    const billPatterns = [
        /pay\s+(?:my\s+)?(electricity|water|gas|broadband|mobile|credit\s*card)\s+bill/i,
        /bill\s+payment/i,
        /pay\s+bill/i
    ];
    
    for (const pattern of billPatterns) {
        if (pattern.test(msg)) {
            return { type: 'pay_bill' };
        }
    }
    
    return null;
}

// ============================================
// FALLBACK: Process recharge directly
// ============================================
async function processRechargeFallback(userId, mobileNumber, amount) {
    try {
        if (!mobileNumber || !amount) {
            return {
                success: false,
                message: mobileNumber ? 'Please enter the recharge amount.' : 'Please provide your 10-digit mobile number.'
            };
        }
        
        const result = await agentPaymentController.rechargeMobile(userId, mobileNumber, amount);
        
        if (result && result.status === 'ready' && result.type === 'recharge_card') {
            return {
                success: true,
                response: result,
                requiresAction: true
            };
        }
        
        return {
            success: false,
            message: result?.error || 'Could not process recharge. Please try again.'
        };
    } catch (error) {
        console.error('Recharge fallback error:', error);
        return {
            success: false,
            message: 'Error processing recharge. Please try again.'
        };
    }
}

// ============================================
// SEND MESSAGE TO AI AGENT
// ============================================
router.post('/chat', verifyToken, async (req, res) => {
    try {
        const userId = getUserId(req);
        const { message, sessionId } = req.body;
        
        console.log(`💬 Chat request from user ${userId}: ${message}`);
        console.log(`📌 SessionId received: ${sessionId}`);
        
        if (!message) {
            return res.status(400).json({ success: false, error: 'Message required' });
        }

        // ============================================
        // ONE place to decide session - reuse or create
        // ============================================
        let conversationId = sessionId;
        
        if (!conversationId) {
            conversationId = generateConversationId();
            await dbService.createConversation(userId, conversationId, message.slice(0, 50));
            console.log(`📝 Created NEW conversation: ${conversationId}`);
        } else {
            const conversations = await dbService.getConversations(userId);
            const exists = conversations.some(c => c.conversation_id === conversationId);
            if (!exists) {
                conversationId = generateConversationId();
                await dbService.createConversation(userId, conversationId, message.slice(0, 50));
                console.log(`📝 Created NEW conversation (old didn't exist): ${conversationId}`);
            } else {
                console.log(`📌 Using EXISTING conversation: ${conversationId}`);
            }
        }
        
        // Save user message
        await dbService.addMessage(conversationId, 'user', message);
        
        // ============================================
        // TRY GEMINI FIRST
        // ============================================
        try {
            const result = await geminiService.processMessage(userId, message, { conversationId });
            
            let responseContent = result.response;
            let requiresAction = result.requiresAction || false;
            let cart = result.cart || null;
            let total = result.total || null;
            let merchant = result.merchant || null;
            
            if (result.functionResults && result.functionResults.length > 0) {
                for (const funcResult of result.functionResults) {
                    const response = funcResult.response;
                    if (response && typeof response === 'object') {
                        if (response.type === 'send_money_card' || 
                            response.type === 'bill_pay_card' || 
                            response.type === 'recharge_card' || 
                            response.type === 'multi_payment_card') {
                            responseContent = response;
                            requiresAction = true;
                            break;
                        }
                        if (response.status === 'ready' && response.type) {
                            responseContent = response;
                            requiresAction = true;
                            break;
                        }
                    }
                }
            }
            
            const contentToSave = typeof responseContent === 'string' 
                ? responseContent 
                : JSON.stringify(responseContent);
            
            await dbService.addMessage(
                conversationId, 
                'agent', 
                contentToSave, 
                conversationId, 
                cart, 
                total, 
                requiresAction ? true : false, 
                merchant
            );
            
            // Update conversation title
            const messages = await dbService.getMessages(conversationId);
            if (messages.length <= 2) {
                const title = message.length > 30 ? message.slice(0, 30) + '...' : message;
                await dbService.updateConversation(conversationId, { title });
            }

            return res.json({
                success: true,
                data: {
                    response: responseContent,
                    sessionId: conversationId,
                    timestamp: new Date().toISOString(),
                    requiresAction: requiresAction,
                    merchant: merchant,
                    cart: cart,
                    total: total,
                    functionCalls: result.functionCalls || []
                }
            });

        } catch (geminiError) {
            console.error('⚠️ Gemini error:', geminiError.message);
            
            // ============================================
            // FALLBACK: Detect payment intent when Gemini fails
            // ============================================
            const isQuotaError = geminiError.message.includes('429') || geminiError.message.includes('quota');
            
            if (isQuotaError) {
                console.log('⚠️ Gemini quota exceeded, using fallback handler');
                
                // Check if this is a payment intent
                const paymentIntent = detectPaymentIntent(message);
                
                if (paymentIntent) {
                    console.log(`💰 Fallback: Payment intent detected: ${paymentIntent.type}`);
                    
                    if (paymentIntent.type === 'recharge') {
                        const { mobileNumber, amount } = paymentIntent;
                        
                        // If we have both number and amount, process directly
                        if (mobileNumber && amount) {
                            const result = await processRechargeFallback(userId, mobileNumber, amount);
                            
                            if (result.success) {
                                const contentToSave = JSON.stringify(result.response);
                                await dbService.addMessage(
                                    conversationId, 
                                    'agent', 
                                    contentToSave,
                                    conversationId, 
                                    null, 
                                    null, 
                                    true, 
                                    null
                                );
                                
                                return res.json({
                                    success: true,
                                    data: {
                                        response: result.response,
                                        sessionId: conversationId,
                                        timestamp: new Date().toISOString(),
                                        requiresAction: true,
                                        paymentCard: result.response
                                    }
                                });
                            }
                            
                            // If processing failed but we had both fields
                            const errorMsg = result.message || 'Could not process recharge. Please try again.';
                            await dbService.addMessage(conversationId, 'agent', errorMsg, conversationId, null, null, false, null);
                            
                            return res.json({
                                success: true,
                                data: {
                                    response: errorMsg,
                                    sessionId: conversationId,
                                    requiresAction: false
                                }
                            });
                        }
                        
                        // If missing number, ask for it
                        if (!mobileNumber) {
                            const response = "📱 **Mobile Recharge**\n\nPlease provide your 10-digit mobile number.\n\nExample: `9876543210`";
                            await dbService.addMessage(conversationId, 'agent', response, conversationId, null, null, false, null);
                            
                            return res.json({
                                success: true,
                                data: {
                                    response: response,
                                    sessionId: conversationId,
                                    requiresAction: false,
                                    context: { waitingFor: 'mobile_number' }
                                }
                            });
                        }
                        
                        // If missing amount, ask for it
                        if (!amount) {
                            const response = `📱 **Mobile Recharge**\n\nNumber: ${mobileNumber}\n\nPlease enter the recharge amount.\n\nExample: \`299\` or \`599\``;
                            await dbService.addMessage(conversationId, 'agent', response, conversationId, null, null, false, null);
                            
                            // Store the mobile number in session context
                            await dbService.addMessage(conversationId, 'system', JSON.stringify({ mobileNumber }), conversationId, null, null, false, null);
                            
                            return res.json({
                                success: true,
                                data: {
                                    response: response,
                                    sessionId: conversationId,
                                    requiresAction: false,
                                    context: { waitingFor: 'amount', mobileNumber: mobileNumber }
                                }
                            });
                        }
                    }
                    
                    if (paymentIntent.type === 'send_money') {
                        const { recipient, amount } = paymentIntent;
                        
                        if (recipient && amount) {
                            const result = await agentPaymentController.sendMoney(userId, recipient, amount);
                            
                            if (result && result.status === 'ready') {
                                const contentToSave = JSON.stringify(result);
                                await dbService.addMessage(conversationId, 'agent', contentToSave, conversationId, null, null, true, null);
                                
                                return res.json({
                                    success: true,
                                    data: {
                                        response: result,
                                        sessionId: conversationId,
                                        requiresAction: true,
                                        paymentCard: result
                                    }
                                });
                            }
                        }
                        
                        if (!recipient) {
                            const response = "💸 **Send Money**\n\nWho would you like to send money to?\n\nPlease provide a UPI ID, phone number, or contact name.";
                            await dbService.addMessage(conversationId, 'agent', response, conversationId, null, null, false, null);
                            
                            return res.json({
                                success: true,
                                data: {
                                    response: response,
                                    sessionId: conversationId,
                                    requiresAction: false
                                }
                            });
                        }
                        
                        if (!amount) {
                            const response = `💸 **Send Money**\n\nRecipient: ${recipient}\n\nPlease enter the amount to send.`;
                            await dbService.addMessage(conversationId, 'agent', response, conversationId, null, null, false, null);
                            
                            return res.json({
                                success: true,
                                data: {
                                    response: response,
                                    sessionId: conversationId,
                                    requiresAction: false,
                                    context: { recipient: recipient }
                                }
                            });
                        }
                    }
                    
                    if (paymentIntent.type === 'pay_bill') {
                        const response = "🧾 **Bill Payment**\n\nWhich bill would you like to pay?\n\n• Electricity\n• Water\n• Gas\n• Broadband\n• Mobile\n\nPlease specify: bill type, provider, customer ID, and amount.";
                        await dbService.addMessage(conversationId, 'agent', response, conversationId, null, null, false, null);
                        
                        return res.json({
                            success: true,
                            data: {
                                response: response,
                                sessionId: conversationId,
                                requiresAction: false
                            }
                        });
                    }
                }
            }
            
            // Generic error fallback
            const errorResponse = "I'm having trouble connecting right now. Please try again or rephrase your request.";
            await dbService.addMessage(conversationId, 'agent', errorResponse, conversationId, null, null, false, null);
            
            return res.json({
                success: true,
                data: {
                    response: errorResponse,
                    sessionId: conversationId,
                    timestamp: new Date().toISOString(),
                    requiresAction: false
                }
            });
        }

    } catch (error) {
        console.error('❌ Chat error:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error' 
        });
    }
});

// ============================================
// GET ALL CONVERSATIONS
// ============================================
router.get('/conversations', verifyToken, async (req, res) => {
    try {
        const userId = getUserId(req);
        const conversations = await dbService.getConversations(userId);
        
        const conversationsWithPreview = await Promise.all(conversations.map(async (conv) => {
            const messages = await dbService.getMessages(conv.conversation_id);
            const lastMessage = messages[messages.length - 1];
            let preview = 'No messages';
            if (lastMessage?.content) {
                try {
                    const parsed = JSON.parse(lastMessage.content);
                    preview = parsed.message || parsed.type || lastMessage.content.slice(0, 100);
                } catch {
                    preview = lastMessage.content.slice(0, 100);
                }
            }
            return {
                ...conv,
                preview: preview,
                messageCount: messages.length
            };
        }));
        
        res.json({ success: true, data: conversationsWithPreview });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET CONVERSATION MESSAGES
// ============================================
router.get('/conversations/:conversationId', verifyToken, async (req, res) => {
    try {
        const userId = getUserId(req);
        const { conversationId } = req.params;
        
        const conversations = await dbService.getConversations(userId);
        const conversation = conversations.find(c => c.conversation_id === conversationId);
        
        if (!conversation) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }
        
        const messages = await dbService.getMessages(conversationId);
        
        const parsedMessages = messages.map(msg => {
            if (msg.role === 'agent' && msg.content) {
                try {
                    const parsed = JSON.parse(msg.content);
                    return { ...msg, content: parsed };
                } catch {
                    return msg;
                }
            }
            return msg;
        });
        
        res.json({ success: true, data: parsedMessages });
    } catch (error) {
        console.error('Get conversation messages error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// DELETE CONVERSATION
// ============================================
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

// ============================================
// CLEAR CURRENT CHAT
// ============================================
router.post('/clear', verifyToken, async (req, res) => {
    try {
        res.json({ success: true, message: 'Chat cleared. Start a new conversation!' });
    } catch (error) {
        console.error('Clear chat error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// HEALTH CHECK
// ============================================
router.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        status: 'online',
        gemini: geminiService.isAvailable() ? 'online' : 'offline',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;