// backend/services/geminiChatService.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
const agentToolRegistry = require("./agentToolRegistry");
const pendingIntentService = require("./pendingIntentService");
const orchestratorService = require("./orchestratorService");
require("dotenv").config();

class GeminiChatService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.chatSessions = new Map();
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found");
        return;
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
      const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
      const tools = agentToolRegistry.getToolDefinitions();

      this.model = this.genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
        tools: [{ functionDeclarations: tools }],
        toolConfig: {
          functionCallingConfig: {
            mode: "auto",
          },
        },
      });

      this.initialized = true;
      console.log(`✅ Gemini is ONLINE with model: ${modelName}`);
      console.log(`🔧 Tools available: ${tools.length}`);
    } catch (error) {
      console.error("❌ Gemini init failed:", error.message);
    }
  }

  async processMessage(userId, message, context = {}) {
    try {
      const sessionKey = `func_${userId}`;
      let pendingIntent = context.pendingIntent || pendingIntentService.get(userId);
      const cardData = context.cardData || {};

      // Extract slots from message if we have a pending intent
      if (pendingIntent?.flow) {
        const extractedSlots = this.extractSlots(pendingIntent.flow, message);
        if (Object.keys(extractedSlots).length > 0) {
          pendingIntent = pendingIntentService.update(userId, {
            slots: { ...pendingIntent.slots, ...extractedSlots },
          });
        }
        // If all slots are now complete, force the function call
        if (pendingIntentService.isComplete(userId)) {
          return await this.forceFunctionCall(userId, pendingIntent);
        }
      }

      // If Gemini is unavailable, return offline fallback
      if (!this.initialized || !this.model) {
        return {
          success: true,
          response: this.buildOfflineResponse(pendingIntent),
          requiresAction: false,
          pendingIntent,
        };
      }

      // Build system instruction
      const systemInstruction = this.buildSystemInstruction(userId, pendingIntent, context);

      // Get or create chat session
      let chat;
      if (!this.chatSessions.has(sessionKey)) {
        chat = this.model.startChat({
          history: [
            { role: "user", parts: [{ text: systemInstruction }] },
            {
              role: "model",
              parts: [{ text: "I understand. I'm SabAI, your AI payment assistant. I have access to all SabAI Pay tools. How can I help you today?" }],
            },
          ],
        });
        this.chatSessions.set(sessionKey, chat);
      } else {
        chat = this.chatSessions.get(sessionKey);
      }

      // Prepare user message with context
      let userMessage = message;
      if (pendingIntent?.flow) {
        const missingSlots = pendingIntentService.getMissingSlots(userId);
        if (missingSlots.length > 0) {
          userMessage = `[Pending Flow: ${pendingIntent.flow}, Missing: ${missingSlots.join(", ")}] ${userMessage}`;
        } else {
          userMessage = `[Pending Flow: ${pendingIntent.flow}, All slots filled - CALL FUNCTION NOW] ${userMessage}`;
        }
      }
      if (cardData && Object.keys(cardData).length > 0) {
        userMessage = `[Card Data: ${JSON.stringify(cardData)}] ${userMessage}`;
      }

      console.log(`📤 Sending to Gemini: "${userMessage.substring(0, 100)}..."`);

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;

      // Extract function calls correctly
      let functionCalls = [];
      if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate && candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
              for (const part of candidate.content.parts) {
                  if (part.functionCall) {
                      functionCalls.push(part.functionCall);
                  }
              }
          }
      }

      let requiresAction = false;
      let functionResults = [];
      let updatedPendingIntent = pendingIntent;

      if (functionCalls.length > 0) {
        console.log(`🔧 Gemini called ${functionCalls.length} function(s)`);
        for (const call of functionCalls) {
          const funcResult = await this.handleFunctionCall(userId, call, context);
          functionResults.push(funcResult);
          // If result is a payment card, set requiresAction and clear pending intent
          if (funcResult.response?.type?.includes("_card") || funcResult.response?.status === "ready") {
            requiresAction = true;
            pendingIntentService.clear(userId);
            updatedPendingIntent = null;
          }
        }
        // Return the function results (skip extra Gemini text response)
        return {
          success: true,
          response: functionResults[0]?.response?.message || "Processing...",
          functionCalls: functionCalls.map(c => c.name),
          functionResults,
          requiresAction,
          pendingIntent: updatedPendingIntent,
        };
      }

      // No function calls – get text response
      const responseText = response.text ? response.text() : "Processing your request...";

      // Update pending intent if needed
      const updatedIntent = this.extractPendingIntentFromResponse(responseText, userId, pendingIntent);
      if (updatedIntent) {
        pendingIntentService.set(userId, updatedIntent);
        updatedPendingIntent = updatedIntent;
      }

      return {
        success: true,
        response: responseText,
        requiresAction: false,
        pendingIntent: updatedPendingIntent,
      };
    } catch (error) {
      console.error("❌ Gemini error:", error.message);
      return {
        success: true,
        response: "I'm having trouble connecting right now. Please try again or rephrase your request.",
        requiresAction: false,
        pendingIntent: pendingIntentService.get(userId),
      };
    }
  }

  // ---- Helper Methods ----

  buildOfflineResponse(pendingIntent) {
    if (pendingIntent?.flow) {
      const missing = pendingIntentService.getMissingSlots(pendingIntent.userId);
      if (missing.length) {
        const prompts = {
          mobileNumber: "What 10-digit mobile number should I recharge?",
          recipient: "Who would you like to send money to?",
          billType: "What type of bill would you like to pay?",
          provider: "Which bill provider should I use?",
          customerId: "What is your customer ID or account number?",
          amount: "What amount should I use?",
        };
        return prompts[missing[0]] || "Please provide the remaining details.";
      }
      return "I'm ready to process your request, but I need confirmation. Please say 'confirm' or provide the details.";
    }
    return "I'm temporarily offline. Please try again shortly.";
  }

  extractSlots(flow, message) {
    const slots = {};
    const text = message.trim();
    const numberMatch = text.match(/\b[6-9]\d{9}\b/);
    const amountMatch = text.match(/(?:₹|rs\.?|inr|rupees?)\s*([0-9,]+)|\b([0-9]{2,6})\b/i);
    const amount = amountMatch && Number((amountMatch[1] || amountMatch[2]).replace(/,/g, ""));

    if (flow === "recharge") {
      if (numberMatch) slots.mobileNumber = numberMatch[0];
      const operatorMatch = text.match(/\b(airtel|jio|vi|vodafone|bsnl)\b/i);
      if (operatorMatch) slots.operator = operatorMatch[1].toLowerCase() === "vodafone" ? "vi" : operatorMatch[1].toLowerCase();
      if (amount && amount >= 10) slots.amount = amount;
    } else if (flow === "send_money") {
      if (amount && amount >= 1) slots.amount = amount;
      const recipientMatch = text.match(/\b(?:to|for)\s+([a-z][a-z .'-]{1,40})/i);
      if (recipientMatch) slots.recipient = recipientMatch[1].trim().replace(/[.,!?]+$/, "");
    } else if (flow === "pay_bill") {
      const billType = text.match(/\b(electricity|mobile|broadband|gas|credit\s*card|water)\b/i);
      if (billType) slots.billType = billType[1].toLowerCase().replace(/\s+/g, "_");
      if (amount && amount >= 10) slots.amount = amount;
      const customerMatch = text.match(/\b(?:customer\s*id|account\s*(?:no|number)?|consumer\s*no)\s*[:#-]?\s*([a-z0-9-]{4,})\b/i);
      if (customerMatch) slots.customerId = customerMatch[1];
      const providerMatch = text.match(/\b(?:provider|with|to)\s+([a-z][a-z .'-]{2,30})/i);
      if (providerMatch) slots.provider = providerMatch[1].trim().replace(/[.,!?]+$/, "");
    }
    return slots;
  }

  async forceFunctionCall(userId, pendingIntent) {
    const flow = pendingIntent.flow;
    const slots = pendingIntent.slots || {};
    console.log(`🚀 Force calling ${flow} with slots:`, slots);

    try {
      let result = null;
      const agentPaymentController = require("../controllers/agentPaymentController");
      if (flow === "recharge") {
        result = await agentPaymentController.rechargeMobile(
          userId,
          slots.mobileNumber,
          slots.amount,
          slots.plan || null,
          slots.operator || null
        );
        result = this.formatPaymentResult(result, "recharge_mobile");
      } else if (flow === "send_money") {
        result = await agentPaymentController.sendMoney(
          userId,
          slots.recipient,
          slots.amount,
          slots.note || null
        );
        result = this.formatPaymentResult(result, "send_money");
      } else if (flow === "pay_bill") {
        result = await agentPaymentController.payBill(
          userId,
          slots.billType,
          slots.provider,
          slots.customerId,
          slots.amount
        );
        result = this.formatPaymentResult(result, "pay_bill");
      } else {
        return { error: `Unknown flow: ${flow}`, status: "failed" };
      }
      pendingIntentService.clear(userId);
      return result;
    } catch (error) {
      console.error("Force call error:", error);
      return { error: error.message, status: "failed" };
    }
  }

  formatPaymentResult(result, type) {
    if (result && result.status === "ready") {
      const cardType = {
        send_money: "send_money_card",
        request_money: "send_money_card",
        pay_bill: "bill_pay_card",
        recharge_mobile: "recharge_card",
        multi_payment: "multi_payment_card",
      }[type] || "payment_card";
      return {
        type: cardType,
        status: "ready",
        requiresAction: "confirm_payment",
        paymentData: result.paymentData,
        message: result.message,
        ...result,
      };
    }
    return result;
  }

  async handleFunctionCall(userId, call, context) {
    const functionName = call.name;
    const args = call.args || {};
    console.log(`🔧 Executing: ${functionName}`, args);

    try {
      let result = null;
      const orchestrator = require("./orchestratorService");
      result = await orchestrator.handleFunctionCall(userId, functionName, args);
      return { name: functionName, response: result };
    } catch (error) {
      console.error(`Function ${functionName} error:`, error);
      return { name: functionName, response: { error: error.message } };
    }
  }

  buildSystemInstruction(userId, pendingIntent, context) {
    const flowContext = pendingIntent
      ? `
CURRENT PENDING INTENT:
- Flow: ${pendingIntent.flow || "none"}
- Slots filled: ${JSON.stringify(pendingIntent.slots || {})}
- Required slots: ${JSON.stringify(pendingIntent.requiredSlots || [])}
- Missing slots: ${JSON.stringify((pendingIntent.requiredSlots || []).filter(s => !pendingIntent.slots?.[s]))}
`
      : "No pending intent.";

    return `You are SabAI, an AI payment assistant for SabAI Pay.

${flowContext}

You have access to the following payment and ordering functions:
- recharge_mobile(mobileNumber, amount, plan, operator)
- send_money(recipient, amount, note)
- pay_bill(billType, provider, customerId, amount)
- search_restaurants(merchant, location, cuisine)
- get_menu(merchant, restaurantId)
- add_to_cart(sessionId, item)
- checkout(sessionId, paymentMethod)
- schedule_payment(action, datetime, paymentMethod)
- setup_autopay(action, schedule, paymentMethod)
- get_usual(mealSlot)
- save_usual(mealSlot, items)
- multi_payment(payments)

IMPORTANT: For search_restaurants, you do NOT need to ask for location. 
The system will automatically use the user's saved delivery address for the merchant.
Just call the function with the merchant name and the system will handle the rest.

CRITICAL INSTRUCTION:
When a user says "yes" or "confirm" and ALL required slots are filled, you MUST call the appropriate function immediately. Do NOT ask for confirmation again.

IMPORTANT RULES:
1. If all required slots are filled, call the function immediately.
2. If a slot is missing, ask the user specifically for that information.
3. If the user says "yes" or "confirm" and all slots are filled, call the function.
4. Do NOT ask for information that has already been provided.

User ID: ${userId}

Be conversational but efficient. Call functions when ready.`;
  }

  // This method was missing – now added
  extractPendingIntentFromResponse(responseText, userId, currentPendingIntent) {
    if (!responseText) return null;

    const lowerText = responseText.toLowerCase();

    // Check if user is confirming
    const confirmWords = ["yes", "ok", "okay", "sure", "go ahead", "proceed", "confirm", "correct"];
    if (confirmWords.some(w => lowerText.includes(w)) && currentPendingIntent) {
      return currentPendingIntent;
    }

    // Check if user is canceling
    const cancelWords = ["no", "cancel", "stop", "abort", "nevermind", "forget it"];
    if (cancelWords.some(w => lowerText.includes(w))) {
      return null;
    }

    const flowPatterns = {
      recharge: ["mobile number", "recharge", "number", "operator", "plan", "amount"],
      send_money: ["send money", "recipient", "who", "amount", "upi", "phone"],
      pay_bill: ["bill", "electricity", "water", "gas", "broadband", "provider"],
    };

    for (const [flow, keywords] of Object.entries(flowPatterns)) {
      if (keywords.some(k => lowerText.includes(k))) {
        if (currentPendingIntent && currentPendingIntent.flow === flow) {
          return currentPendingIntent;
        }
        return currentPendingIntent || null;
      }
    }

    return currentPendingIntent || null;
  }

  isAvailable() {
    return this.initialized;
  }

  clearChat(userId) {
    this.chatSessions.delete(`func_${userId}`);
    pendingIntentService.clear(userId);
  }
}

module.exports = new GeminiChatService();