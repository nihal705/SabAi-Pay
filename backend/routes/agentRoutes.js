// backend/routes/agentRoutes.js
// COMPLETE FIXED VERSION - Single entry point with pending intent state

const express = require("express");
const router = express.Router();
const geminiService = require("../services/geminiChatService");
const dbService = require("../services/databaseService");
const pendingIntentService = require("../services/pendingIntentService");
const agentPaymentController = require("../controllers/agentPaymentController");
const { verifyToken } = require("../middleware/auth");

const getUserId = (req) => String(req.user.id);
const generateConversationId = () =>
  `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================
// SEND MESSAGE TO AI AGENT - SINGLE ENTRY POINT
// ============================================
router.post("/chat", verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { message, sessionId, cardData } = req.body;

    console.log(`💬 Chat request from user ${userId}: ${message}`);
    console.log(`📌 SessionId received: ${sessionId}`);
    console.log(`📦 Card data:`, cardData || "none");

    if (!message && !cardData) {
      return res
        .status(400)
        .json({ success: false, error: "Message or card data required" });
    }

    // ============================================
    // SESSION MANAGEMENT - ONE place
    // ============================================
    let conversationId = sessionId;

    if (!conversationId) {
      conversationId = generateConversationId();
      await dbService.createConversation(
        userId,
        conversationId,
        message?.slice(0, 50) || "New conversation",
      );
      console.log(`📝 Created NEW conversation: ${conversationId}`);
    } else {
      const conversations = await dbService.getConversations(userId);
      const exists = conversations.some(
        (c) => c.conversation_id === conversationId,
      );
      if (!exists) {
        conversationId = generateConversationId();
        await dbService.createConversation(
          userId,
          conversationId,
          message?.slice(0, 50) || "New conversation",
        );
        console.log(
          `📝 Created NEW conversation (old didn't exist): ${conversationId}`,
        );
      } else {
        console.log(`📌 Using EXISTING conversation: ${conversationId}`);
      }
    }

    // Save user message if it's text
    if (message) {
      await dbService.addMessage(conversationId, "user", message);
    }

    // ============================================
    // GET PENDING INTENT STATE
    // ============================================
    let pendingIntent = pendingIntentService.get(userId);
    console.log(`🧠 Current pending intent:`, pendingIntent || "none");

    // ============================================
    // CHECK FOR CARD DATA (UI input from frontend)
    // ============================================
    if (cardData) {
      // Update slots with card data
      pendingIntent = pendingIntentService.update(userId, {
        slots: {
          ...(pendingIntent?.slots || {}),
          ...cardData,
        },
        updatedAt: new Date().toISOString(),
      });
      console.log(`📦 Updated slots with card data:`, cardData);
    }

    // ============================================
    // HANDLE CANCELLATION
    // ============================================
    if (
      message &&
      message
        .toLowerCase()
        .match(/^(cancel|cancel this|nevermind|forget it|stop|abort)/i)
    ) {
      if (pendingIntent) {
        const flow = pendingIntent.flow;
        pendingIntentService.clear(userId);

        const cancelResponse = {
          success: true,
          data: {
            response: `✅ Cancelled the ${flow?.replace("_", " ") || "current"} flow. How can I help you now?`,
            sessionId: conversationId,
            timestamp: new Date().toISOString(),
            requiresAction: false,
            pendingIntent: null,
          },
        };

        await dbService.addMessage(
          conversationId,
          "agent",
          cancelResponse.data.response,
        );
        return res.json(cancelResponse);
      }
    }

    // ============================================
    // PROCESS WITH GEMINI
    // ============================================
    try {
      const result = await geminiService.processMessage(
        userId,
        message || "continue",
        {
          conversationId,
          pendingIntent: pendingIntent,
          cardData: cardData,
        },
      );

      let responseContent = result.response;
      let requiresAction = result.requiresAction || false;
      let cart = result.cart || null;
      let total = result.total || null;
      let merchant = result.merchant || null;

      // Check for function results (payment cards)
      if (result.functionResults && result.functionResults.length > 0) {
        for (const funcResult of result.functionResults) {
          const response = funcResult.response;
          if (response && typeof response === "object") {
            const cardTypes = [
              "send_money_card",
              "bill_pay_card",
              "recharge_card",
              "multi_payment_card",
            ];
            if (
              cardTypes.includes(response.type) ||
              response.status === "ready"
            ) {
              responseContent = response;
              requiresAction = true;
              // Clear pending intent when card is ready
              pendingIntentService.clear(userId);
              break;
            }
          }
        }
      }

      // Update pending intent if Gemini returned a new one
      if (result.pendingIntent) {
        pendingIntentService.set(userId, result.pendingIntent);
        console.log(
          `🔄 Updated pending intent from Gemini:`,
          result.pendingIntent,
        );
      }

      // Save agent response
      const contentToSave =
        typeof responseContent === "string"
          ? responseContent
          : JSON.stringify(responseContent);

      await dbService.addMessage(
        conversationId,
        "agent",
        contentToSave,
        conversationId,
        cart,
        total,
        requiresAction ? true : false,
        merchant,
      );

      // Update conversation title
      if (message) {
        const messages = await dbService.getMessages(conversationId);
        if (messages.length <= 2) {
          const title =
            message.length > 30 ? message.slice(0, 30) + "..." : message;
          await dbService.updateConversation(conversationId, { title });
        }
      }

      // Get updated pending intent for response
      const updatedPendingIntent = pendingIntentService.get(userId);

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
          functionCalls: result.functionCalls || [],
          pendingIntent: updatedPendingIntent,
          flow: updatedPendingIntent?.flow || null,
          slots: updatedPendingIntent?.slots || {},
          missingSlots: updatedPendingIntent
            ? pendingIntentService.getMissingSlots(userId)
            : [],
        },
      });
    } catch (geminiError) {
      console.error("⚠️ Gemini error:", geminiError.message);

      // ============================================
      // FALLBACK: Direct payment processing
      // ============================================
      if (pendingIntent && pendingIntent.flow) {
        const flow = pendingIntent.flow;
        const slots = pendingIntent.slots || {};

        // Try to process directly if we have all needed info
        if (flow === "recharge" && slots.mobileNumber && slots.amount) {
          try {
            const result = await agentPaymentController.rechargeMobile(
              userId,
              slots.mobileNumber,
              slots.amount,
              slots.plan,
            );

            if (result && result.status === "ready") {
              pendingIntentService.clear(userId);

              await dbService.addMessage(
                conversationId,
                "agent",
                JSON.stringify(result),
                conversationId,
                null,
                null,
                true,
                null,
              );

              return res.json({
                success: true,
                data: {
                  response: result,
                  sessionId: conversationId,
                  timestamp: new Date().toISOString(),
                  requiresAction: true,
                  paymentCard: result,
                  pendingIntent: null,
                },
              });
            }
          } catch (e) {
            console.error("Fallback recharge error:", e);
          }
        }

        if (flow === "send_money" && slots.recipient && slots.amount) {
          try {
            const result = await agentPaymentController.sendMoney(
              userId,
              slots.recipient,
              slots.amount,
              slots.note,
            );

            if (result && result.status === "ready") {
              pendingIntentService.clear(userId);

              await dbService.addMessage(
                conversationId,
                "agent",
                JSON.stringify(result),
                conversationId,
                null,
                null,
                true,
                null,
              );

              return res.json({
                success: true,
                data: {
                  response: result,
                  sessionId: conversationId,
                  timestamp: new Date().toISOString(),
                  requiresAction: true,
                  paymentCard: result,
                  pendingIntent: null,
                },
              });
            }
          } catch (e) {
            console.error("Fallback send money error:", e);
          }
        }
      }

      // Generic error fallback
      const errorResponse =
        "I'm having trouble connecting right now. Please try again or rephrase your request.";
      await dbService.addMessage(
        conversationId,
        "agent",
        errorResponse,
        conversationId,
        null,
        null,
        false,
        null,
      );

      return res.json({
        success: true,
        data: {
          response: errorResponse,
          sessionId: conversationId,
          timestamp: new Date().toISOString(),
          requiresAction: false,
          pendingIntent: pendingIntentService.get(userId),
        },
      });
    }
  } catch (error) {
    console.error("❌ Chat error:", error);
    console.error("❌ Stack:", error.stack);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// ============================================
// GET PENDING INTENT STATUS
// ============================================
router.get("/pending-intent", verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const pendingIntent = pendingIntentService.get(userId);

    res.json({
      success: true,
      data: {
        hasPendingIntent: !!pendingIntent,
        flow: pendingIntent?.flow || null,
        slots: pendingIntent?.slots || {},
        missingSlots: pendingIntent
          ? pendingIntentService.getMissingSlots(userId)
          : [],
        isComplete: pendingIntent
          ? pendingIntentService.isComplete(userId)
          : false,
      },
    });
  } catch (error) {
    console.error("❌ Get pending intent error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CLEAR PENDING INTENT
// ============================================
router.post("/clear-intent", verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    pendingIntentService.clear(userId);

    res.json({
      success: true,
      message: "Pending intent cleared successfully",
    });
  } catch (error) {
    console.error("❌ Clear pending intent error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET ALL CONVERSATIONS
// ============================================
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const conversations = await dbService.getConversations(userId);

    const conversationsWithPreview = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await dbService.getMessages(conv.conversation_id);
        const lastMessage = messages[messages.length - 1];
        let preview = "No messages";
        if (lastMessage?.content) {
          try {
            const parsed = JSON.parse(lastMessage.content);
            preview =
              parsed.message ||
              parsed.type ||
              lastMessage.content.slice(0, 100);
          } catch {
            preview = lastMessage.content.slice(0, 100);
          }
        }
        return {
          ...conv,
          preview: preview,
          messageCount: messages.length,
        };
      }),
    );

    res.json({ success: true, data: conversationsWithPreview });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET CONVERSATION MESSAGES
// ============================================
router.get("/conversations/:conversationId", verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { conversationId } = req.params;

    const conversations = await dbService.getConversations(userId);
    const conversation = conversations.find(
      (c) => c.conversation_id === conversationId,
    );

    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, error: "Conversation not found" });
    }

    const messages = await dbService.getMessages(conversationId);

    const parsedMessages = messages.map((msg) => {
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

// ============================================
// DELETE CONVERSATION
// ============================================
router.delete(
  "/conversations/:conversationId",
  verifyToken,
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const { conversationId } = req.params;
      await dbService.deleteConversation(conversationId, userId);
      res.json({ success: true, message: "Conversation deleted" });
    } catch (error) {
      console.error("Delete conversation error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

// ============================================
// CLEAR CURRENT CHAT
// ============================================
router.post("/clear", verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    pendingIntentService.clear(userId);
    res.json({
      success: true,
      message: "Chat cleared. Start a new conversation!",
    });
  } catch (error) {
    console.error("Clear chat error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// HEALTH CHECK
// ============================================
router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    gemini: geminiService.isAvailable() ? "online" : "offline",
    pendingIntentStats: pendingIntentService.getStats(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
