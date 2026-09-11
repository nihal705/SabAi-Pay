// backend/routes/agentRoutes.js

const express = require("express");
const router = express.Router();
const orchestratorService = require("../services/orchestratorService");
const pendingIntentService = require("../services/pendingIntentService");
const dbService = require("../services/databaseService");
const { verifyToken } = require("../middleware/auth");

// POST /agent/chat – main entry point
router.post("/chat", verifyToken, async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { message, sessionId, cardData, voice } = req.body;

    if (!message && !cardData) {
      return res.status(400).json({ success: false, error: "Message or card data required" });
    }

    // Get or create conversation
    let conversationId = sessionId;
    if (!conversationId) {
      conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await dbService.createConversation(userId, conversationId, message?.slice(0, 50) || "New conversation");
    } else {
      const convs = await dbService.getConversations(userId);
      const exists = convs.some(c => c.conversation_id === conversationId);
      if (!exists) {
        conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await dbService.createConversation(userId, conversationId, message?.slice(0, 50) || "New conversation");
      }
    }

    // Save user message
    if (message) {
      await dbService.addMessage(conversationId, "user", message);
    }

    // Get pending intent
    let pendingIntent = pendingIntentService.get(userId);

    // If cardData is provided, update slots
    if (cardData) {
      pendingIntent = pendingIntentService.update(userId, {
        slots: { ...(pendingIntent?.slots || {}), ...cardData },
      });
    }

    // Process through orchestrator – ensures always returns an object
    const result = await orchestratorService.processMessage(
      userId,
      message || "continue",
      pendingIntent,
      { conversationId, voice: !!voice, cardData }
    );

    // Safety: if result is null/undefined, use fallback
    if (!result || typeof result !== 'object') {
      throw new Error('Orchestrator returned invalid result');
    }

    // Save agent response – always store as JSON string
    const contentToSave = JSON.stringify(result);

    await dbService.addMessage(
      conversationId,
      "agent",
      contentToSave,
      conversationId,
      result.cart || null,
      result.total || null,
      typeof result.requiresAction === 'boolean' ? result.requiresAction : false,
      result.merchant || null
    );

    // Build response for frontend – send the FULL result object as 'response'
    const responseData = {
      response: result,  // <-- SEND THE FULL OBJECT, NOT result.response
      sessionId: conversationId,
      timestamp: new Date().toISOString(),
      requiresAction: result.requiresAction || false,
      merchant: result.merchant || null,
      cart: result.cart || null,
      total: result.total || null,
      functionCalls: result.functionCalls || [],
      pendingIntent: pendingIntentService.get(userId),
      flow: pendingIntent?.flow || null,
      slots: pendingIntent?.slots || {},
      missingSlots: pendingIntent ? pendingIntentService.getMissingSlots(userId) : [],
    };

    return res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET conversations
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const userId = String(req.user.id);
    const conversations = await dbService.getConversations(userId);
    const conversationsWithPreview = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await dbService.getMessages(conv.conversation_id);
        const lastMessage = messages[messages.length - 1];
        let preview = "No messages";
        if (lastMessage?.content) {
          try {
            const parsed = JSON.parse(lastMessage.content);
            preview = parsed.response || parsed.message || parsed.type || lastMessage.content.slice(0, 100);
          } catch {
            preview = lastMessage.content.slice(0, 100);
          }
        }
        return { ...conv, preview, messageCount: messages.length };
      })
    );
    res.json({ success: true, data: conversationsWithPreview });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET conversation messages
router.get("/conversations/:conversationId", verifyToken, async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { conversationId } = req.params;
    const conversations = await dbService.getConversations(userId);
    const conversation = conversations.find(c => c.conversation_id === conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }
    const messages = await dbService.getMessages(conversationId);
    const parsedMessages = messages.map(msg => {
      if (msg.role === "agent" && msg.content) {
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
    console.error("Get conversation messages error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE conversation
router.delete("/conversations/:conversationId", verifyToken, async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { conversationId } = req.params;
    await dbService.deleteConversation(conversationId, userId);
    res.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear pending intent
router.post("/clear", verifyToken, async (req, res) => {
  try {
    const userId = String(req.user.id);
    pendingIntentService.clear(userId);
    res.json({ success: true, message: "Chat cleared. Start a new conversation!" });
  } catch (error) {
    console.error("Clear chat error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    gemini: require("../services/geminiChatService").isAvailable() ? "online" : "offline",
    pendingIntentStats: pendingIntentService.getStats(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;