// backend/services/geminiChatService.js
// COMPLETE FIXED - Forces function calling when slots are filled

const { GoogleGenerativeAI } = require("@google/generative-ai");
const agentToolRegistry = require("./agentToolRegistry");
const pendingIntentService = require("./pendingIntentService");
require("dotenv").config();

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
      const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

      if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found");
        return;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);

      await this.checkAvailableModels();

      const tools = agentToolRegistry.getToolDefinitions();

      this.model = this.genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.3, // Lower temperature for more deterministic responses
          maxOutputTokens: 1024,
        },
        tools: [{ functionDeclarations: tools }],
        toolConfig: {
          functionCallingConfig: {
            mode: "auto", // Let Gemini decide, but we'll force when slots are filled
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

  async checkAvailableModels() {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`,
      );
      const data = await response.json();
      if (data.models) {
        this.availableModels = data.models
          .filter((m) =>
            m.supportedGenerationMethods?.includes("generateContent"),
          )
          .map((m) => m.name.replace("models/", ""));
        console.log(`📋 Available models: ${this.availableModels.join(", ")}`);

        const configuredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        if (!this.availableModels.includes(configuredModel)) {
          console.warn(
            `⚠️ Model "${configuredModel}" not available. Available: ${this.availableModels.join(", ")}`,
          );
        }
      }
    } catch (e) {
      // Silent fail
    }
  }

  async processMessage(userId, message, context = {}) {
    try {
      const sessionKey = `func_${userId}`;
      let pendingIntent =
        context.pendingIntent || pendingIntentService.get(userId);
      const cardData = context.cardData || {};

      // Slot values come from the user's message, not from Gemini's reply.
      // This keeps short follow-ups such as "Ramesh" and "500" in context.
      const detectedFlow =
        pendingIntent?.flow ||
        this.detectFlow(message) ||
        this.detectCardFlow(cardData);
      if (!pendingIntent?.flow && detectedFlow) {
        pendingIntent = this.createPendingIntent(userId, detectedFlow);
      }
      if (pendingIntent?.flow) {
        const extractedSlots = {
          ...this.extractSlots(pendingIntent.flow, message),
          ...cardData,
        };
        if (Object.keys(extractedSlots).length > 0) {
          pendingIntent = pendingIntentService.update(userId, {
            slots: { ...(pendingIntent.slots || {}), ...extractedSlots },
          });
        }
      }

      // ============================================
      // CRITICAL FIX: Check if slots are filled and force function call
      // ============================================
      if (pendingIntent && pendingIntent.flow) {
        const missingSlots = pendingIntentService.getMissingSlots(userId);

        // If all slots are filled, force the function call
        if (missingSlots.length === 0) {
          console.log(
            `✅ All slots filled for ${pendingIntent.flow}, forcing function call`,
          );

          // Call the function directly without waiting for Gemini
          const functionResult = await this.forceFunctionCall(
            userId,
            pendingIntent,
          );

          if (functionResult?.status === "ready" || functionResult?.type) {
            pendingIntentService.clear(userId);

            return {
              success: true,
              response: functionResult,
              functionCalls: [this.getFunctionName(pendingIntent.flow)],
              functionResults: [
                {
                  name: this.getFunctionName(pendingIntent.flow),
                  response: functionResult,
                },
              ],
              requiresAction: true,
              pendingIntent: null,
            };
          }

          pendingIntentService.clear(userId);
          return {
            success: true,
            response:
              functionResult?.error ||
              functionResult?.message ||
              "I could not validate those payment details.",
            functionCalls: [this.getFunctionName(pendingIntent.flow)],
            functionResults: [
              {
                name: this.getFunctionName(pendingIntent.flow),
                response: functionResult,
              },
            ],
            requiresAction: false,
            pendingIntent: null,
          };
        }
      }

      // Slot collection must still work when Gemini is unavailable.
      if (!this.initialized || !this.model) {
        return {
          success: true,
          response: this.buildMissingSlotPrompt(pendingIntent),
          functionCalls: [],
          requiresAction: false,
          pendingIntent,
        };
      }

      // Build system instruction with pending intent
      const systemInstruction = this.buildSystemInstruction(
        userId,
        pendingIntent,
        context,
      );

      // Get or create chat session
      let chat;
      if (!this.chatSessions.has(sessionKey)) {
        chat = this.model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: systemInstruction }],
            },
            {
              role: "model",
              parts: [
                {
                  text: "I understand. I'm SabAI, your AI payment assistant. I have access to all SabAI Pay tools. How can I help you today?",
                },
              ],
            },
          ],
        });
        this.chatSessions.set(sessionKey, chat);
      } else {
        chat = this.chatSessions.get(sessionKey);
      }

      // Build the user message with context
      let userMessage = message;
      if (cardData && Object.keys(cardData).length > 0) {
        userMessage = `[Card Data: ${JSON.stringify(cardData)}] ${message || "Continue"}`;
      }

      if (pendingIntent && pendingIntent.flow) {
        const missingSlots = pendingIntentService.getMissingSlots(userId);
        if (missingSlots.length > 0) {
          userMessage = `[Pending Flow: ${pendingIntent.flow}, Missing: ${missingSlots.join(", ")}] ${userMessage}`;
        } else {
          userMessage = `[Pending Flow: ${pendingIntent.flow}, All slots filled - CALL FUNCTION NOW] ${userMessage}`;
        }
      }

      console.log(
        `📤 Sending to Gemini: "${userMessage.substring(0, 100)}..."`,
      );

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;

      // Extract functionCalls
      let functionCalls = [];

      if (response && typeof response === "object") {
        if (response.functionCalls && Array.isArray(response.functionCalls)) {
          functionCalls = response.functionCalls;
        } else if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate && candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.functionCall) {
                functionCalls.push(part.functionCall);
              }
            }
          }
        } else if (response.functionCall) {
          functionCalls = [response.functionCall];
        }
      }

      let updatedPendingIntent = pendingIntent;
      let requiresAction = false;
      let functionResults = [];

      if (functionCalls && functionCalls.length > 0) {
        console.log(`🔧 Gemini called ${functionCalls.length} function(s)`);

        for (const call of functionCalls) {
          const funcResult = await this.handleFunctionCall(
            userId,
            call,
            context,
          );
          functionResults.push(funcResult);
        }

        if (functionResults.length > 0) {
          try {
            const finalResult = await chat.sendMessage(
              functionResults.map((r) => ({
                functionResponse: {
                  name: r.name,
                  response: r.response,
                },
              })),
            );
            const finalResponse = await finalResult.response;
            const finalText = finalResponse.text
              ? finalResponse.text()
              : "Processing complete.";

            for (const funcResult of functionResults) {
              const resp = funcResult.response;
              if (resp && typeof resp === "object") {
                const cardTypes = [
                  "send_money_card",
                  "bill_pay_card",
                  "recharge_card",
                  "multi_payment_card",
                ];
                if (cardTypes.includes(resp.type) || resp.status === "ready") {
                  requiresAction = true;
                  pendingIntentService.clear(userId);
                  updatedPendingIntent = null;
                  break;
                }
              }
            }

            return {
              success: true,
              response: finalText,
              functionCalls: functionCalls.map(
                (c) => c.name || c.functionCall?.name || "unknown",
              ),
              functionResults: functionResults,
              requiresAction: requiresAction,
              pendingIntent: updatedPendingIntent,
            };
          } catch (finalError) {
            console.error(
              "Error sending function results:",
              finalError.message,
            );
            return {
              success: true,
              response: this.buildFallbackResponse(functionResults),
              functionCalls: functionCalls.map(
                (c) => c.name || c.functionCall?.name || "unknown",
              ),
              functionResults: functionResults,
              requiresAction: this.detectRequiresAction(functionResults),
              pendingIntent: updatedPendingIntent,
            };
          }
        }
      }

      // If no function calls, check if we need to update pending intent
      const responseText = response.text
        ? response.text()
        : "Processing your request...";

      const updatedIntent = this.extractPendingIntentFromResponse(
        responseText,
        userId,
        pendingIntent,
      );
      if (updatedIntent) {
        updatedPendingIntent = updatedIntent;
        pendingIntentService.set(userId, updatedIntent);
      }

      return {
        success: true,
        response: responseText,
        functionCalls: [],
        requiresAction: false,
        pendingIntent: updatedPendingIntent,
      };
    } catch (error) {
      console.error("❌ Gemini error:", error.message);
      console.error("❌ Stack:", error.stack);
      throw error;
    }
  }

  detectFlow(message = "") {
    const text = String(message).toLowerCase();
    if (/\b(recharge|top\s*up|talktime|data\s*pack)\b/.test(text))
      return "recharge";
    if (
      /\b(send|transfer)\b.*\b(money|₹|rs\.?|rupees?|to)\b|\bpay\b.*\b(friend|mom|dad|ramesh)\b/.test(
        text,
      ) ||
      /\b(account\s*(?:number|no)|ifsc)\b/i.test(text)
    ) {
      return "send_money";
    }
    if (
      /\b(pay|settle)\b.*\b(bill|electricity|water|gas|broadband|mobile)\b/.test(
        text,
      )
    ) {
      return "pay_bill";
    }
    return null;
  }

  detectCardFlow(cardData = {}) {
    if (cardData.mobileNumber) return "recharge";
    if (cardData.recipient) return "send_money";
    if (cardData.billType || cardData.customerId) return "pay_bill";
    return null;
  }

  createPendingIntent(userId, flow) {
    const requiredSlots =
      {
        recharge: ["mobileNumber", "amount"],
        send_money: ["recipient", "amount"],
        pay_bill: ["billType", "provider", "customerId", "amount"],
      }[flow] || [];
    return pendingIntentService.createFlow(userId, flow, {}, requiredSlots);
  }

  buildMissingSlotPrompt(pendingIntent) {
    if (!pendingIntent?.flow) {
      return "I am temporarily offline. Please try again shortly.";
    }
    const prompts = {
      mobileNumber: "What 10-digit mobile number should I recharge?",
      recipient: "Who would you like to send money to?",
      billType: "What type of bill would you like to pay?",
      provider: "Which bill provider should I use?",
      customerId: "What is your customer ID or account number?",
      amount: "What amount should I use?",
    };
    const missingSlot = (pendingIntent.requiredSlots || []).find(
      (slot) => !pendingIntent.slots?.[slot],
    );
    return (
      prompts[missingSlot] || "Please provide the remaining payment details."
    );
  }

  extractSlots(flow, message = "") {
    const text = String(message).trim();
    const slots = {};
    const numberMatch = text.match(/\b[6-9]\d{9}\b/);
    const amountMatch = text.match(
      /(?:₹|rs\.?|inr|rupees?)\s*([0-9,]+)|\b([0-9]{2,6})\b/i,
    );
    const amount =
      amountMatch &&
      Number((amountMatch[1] || amountMatch[2]).replace(/,/g, ""));

    if (flow === "recharge") {
      if (numberMatch) slots.mobileNumber = numberMatch[0];
      const operatorMatch = text.match(/\b(airtel|jio|vi|vodafone|bsnl)\b/i);
      if (operatorMatch) {
        slots.operator =
          operatorMatch[1].toLowerCase() === "vodafone"
            ? "vi"
            : operatorMatch[1].toLowerCase();
      }
      if (
        amount &&
        amount >= 10 &&
        amount <= 100000 &&
        (!numberMatch || amount !== Number(numberMatch[0]))
      ) {
        slots.amount = amount;
      }
      return slots;
    }

    if (flow === "send_money") {
      if (amount && amount >= 1) slots.amount = amount;
      const bankDetails = text.match(
        /\b(?:account\s*(?:number|no)\s*)?(\d{9,18})\b.*?\bifsc\s*[:#-]?\s*([a-z0-9]{11})\b/i,
      );
      if (bankDetails) {
        slots.recipient = `${bankDetails[1]}/${bankDetails[2].toUpperCase()}`;
        return slots;
      }
      const recipientMatch = text.match(
        /\b(?:to|for)\s+([a-z][a-z .'-]{1,40})/i,
      );
      if (recipientMatch) {
        const candidate = recipientMatch[1].trim().replace(/[.,!?]+$/, "");
        if (
          !/^(one of the|an?|the)?\s*(account|bank account|person|friend)$/i.test(
            candidate,
          )
        ) {
          slots.recipient = candidate;
        }
      } else if (
        !amount &&
        text &&
        !/^(yes|ok|okay|continue|proceed)$/i.test(text)
      ) {
        slots.recipient = text.replace(/[.,!?]+$/, "");
      }
      return slots;
    }

    if (flow === "pay_bill") {
      const billType = text.match(
        /\b(electricity|mobile|broadband|gas|credit\s*card|water)\b/i,
      );
      if (billType)
        slots.billType = billType[1].toLowerCase().replace(/\s+/g, "_");
      if (amount && amount >= 10) slots.amount = amount;
      const customerMatch = text.match(
        /\b(?:customer\s*id|account\s*(?:no|number)?|consumer\s*no)\s*[:#-]?\s*([a-z0-9-]{4,})\b/i,
      );
      if (customerMatch) slots.customerId = customerMatch[1];
      const providerMatch = text.match(
        /\b(?:provider|with|to)\s+([a-z][a-z .'-]{2,30})/i,
      );
      if (providerMatch)
        slots.provider = providerMatch[1].trim().replace(/[.,!?]+$/, "");
      if (!slots.provider && billType) {
        const naturalProvider = text.match(
          /\b(?:is|it's|its)\s+([a-z][a-z .'-]{2,30})/i,
        );
        if (naturalProvider)
          slots.provider = naturalProvider[1].trim().replace(/[.,!?]+$/, "");
      }
      return slots;
    }

    return slots;
  }

  getFunctionName(flow) {
    return (
      {
        recharge: "recharge_mobile",
        send_money: "send_money",
        pay_bill: "pay_bill",
      }[flow] || flow
    );
  }

  // ============================================
  // FORCE FUNCTION CALL WHEN SLOTS ARE FILLED
  // ============================================
  async forceFunctionCall(userId, pendingIntent) {
    const flow = pendingIntent.flow;
    const slots = pendingIntent.slots || {};

    console.log(`🚀 Force calling ${flow} with slots:`, slots);

    try {
      let result = null;

      if (flow === "recharge") {
        const agentPaymentController = require("../controllers/agentPaymentController");
        result = await agentPaymentController.rechargeMobile(
          userId,
          slots.mobileNumber,
          slots.amount,
          slots.plan || null,
          slots.operator || null,
        );
        result = this.formatPaymentResult(result, "recharge_mobile");
      } else if (flow === "send_money") {
        const agentPaymentController = require("../controllers/agentPaymentController");
        result = await agentPaymentController.sendMoney(
          userId,
          slots.recipient,
          slots.amount,
          slots.note || null,
        );
        result = this.formatPaymentResult(result, "send_money");
      } else if (flow === "pay_bill") {
        const agentPaymentController = require("../controllers/agentPaymentController");
        result = await agentPaymentController.payBill(
          userId,
          slots.billType,
          slots.provider,
          slots.customerId,
          slots.amount,
        );
        result = this.formatPaymentResult(result, "pay_bill");
      }

      return result;
    } catch (error) {
      console.error(`❌ Force function call error:`, error);
      return { error: error.message, status: "failed" };
    }
  }

  extractPendingIntentFromResponse(responseText, userId, currentPendingIntent) {
    if (!responseText) return null;

    const lowerText = responseText.toLowerCase();

    // Check if user is confirming
    const confirmWords = [
      "yes",
      "ok",
      "okay",
      "sure",
      "go ahead",
      "proceed",
      "confirm",
      "correct",
    ];
    if (
      confirmWords.some((w) => lowerText.includes(w)) &&
      currentPendingIntent
    ) {
      // If we have a pending intent and user confirms, keep the flow
      return currentPendingIntent;
    }

    // Check if user is canceling
    const cancelWords = [
      "no",
      "cancel",
      "stop",
      "abort",
      "nevermind",
      "forget it",
    ];
    if (cancelWords.some((w) => lowerText.includes(w))) {
      return null;
    }

    const flowPatterns = {
      recharge: [
        "mobile number",
        "recharge",
        "number",
        "operator",
        "plan",
        "amount",
      ],
      send_money: ["send money", "recipient", "who", "amount", "upi", "phone"],
      pay_bill: [
        "bill",
        "electricity",
        "water",
        "gas",
        "broadband",
        "provider",
      ],
    };

    for (const [flow, keywords] of Object.entries(flowPatterns)) {
      if (keywords.some((k) => lowerText.includes(k))) {
        if (currentPendingIntent && currentPendingIntent.flow === flow) {
          return currentPendingIntent;
        }

        return currentPendingIntent || null;
      }
    }

    return currentPendingIntent || null;
  }

  detectRequiresAction(functionResults) {
    for (const result of functionResults) {
      if (result.response && result.response.requiresAction) {
        return true;
      }
      if (result.response && result.response.status === "ready") {
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
      if (result.response && result.response.status === "ready") {
        return "Payment is ready for confirmation. Please review the details.";
      }
    }
    return "I've processed your request. Please check the details.";
  }

  async handleFunctionCall(userId, call, context) {
    const functionName = call.name || call.functionCall?.name || "unknown";
    const args = call.args || call.functionCall?.args || {};

    console.log(`🔧 Executing: ${functionName}`, args);

    try {
      let result = null;

      // ORDERING FUNCTIONS
      if (functionName === "check_merchant_connected") {
        result = await this.checkMerchantConnected(userId, args.merchant);
      } else if (functionName === "list_supported_merchants") {
        result = await this.listSupportedMerchants(args.category);
      } else if (functionName === "find_restaurants_nearby") {
        result = await this.findRestaurantsNearby(
          userId,
          args.merchant,
          args.location,
          args.cuisine,
        );
      } else if (functionName === "get_menu") {
        result = await this.getMenu(userId, args.merchant, args.restaurantId);
      } else if (functionName === "search_items") {
        result = await this.searchItems(
          userId,
          args.merchant,
          args.query,
          args.location,
        );
      } else if (functionName === "cart_add_item") {
        result = await this.cartAddItem(userId, args.itemId, args.quantity);
      } else if (functionName === "cart_remove_item") {
        result = await this.cartRemoveItem(userId, args.itemId);
      } else if (functionName === "cart_update_quantity") {
        result = await this.cartUpdateQuantity(
          userId,
          args.itemId,
          args.quantity,
        );
      } else if (functionName === "cart_view") {
        result = await this.cartView(userId);
      } else if (functionName === "check_reserve_pay_limit") {
        result = await this.checkReservePayLimit(
          userId,
          args.merchant,
          args.amount,
        );
      } else if (functionName === "initiate_payment") {
        result = await this.initiatePayment(userId, args.method, args.amount);
      } else if (functionName === "get_order_status") {
        result = await this.getOrderStatus(userId, args.orderId);
      } else if (functionName === "get_user_location") {
        result = await this.getUserLocation(userId);
      } else if (functionName === "request_location") {
        result = await this.requestLocation(userId);

        // PAYMENT FUNCTIONS
      } else if (functionName === "send_money") {
        const agentPaymentController = require("../controllers/agentPaymentController");
        result = await agentPaymentController.sendMoney(
          userId,
          args.recipient,
          args.amount,
          args.note,
        );
        result = this.formatPaymentResult(result, "send_money");
      } else if (functionName === "request_money") {
        const agentPaymentController = require("../controllers/agentPaymentController");
        result = await agentPaymentController.requestMoney(
          userId,
          args.recipient,
          args.amount,
          args.note,
        );
        result = this.formatPaymentResult(result, "request_money");
      } else if (functionName === "pay_bill") {
        const agentPaymentController = require("../controllers/agentPaymentController");
        result = await agentPaymentController.payBill(
          userId,
          args.billType,
          args.provider,
          args.customerId,
          args.amount,
        );
        result = this.formatPaymentResult(result, "pay_bill");
      } else if (functionName === "recharge_mobile") {
        const agentPaymentController = require("../controllers/agentPaymentController");
        result = await agentPaymentController.rechargeMobile(
          userId,
          args.mobileNumber,
          args.amount,
          args.plan,
        );
        result = this.formatPaymentResult(result, "recharge_mobile");
      } else if (functionName === "multi_payment") {
        const agentPaymentController = require("../controllers/agentPaymentController");
        result = await agentPaymentController.multiPayment(
          userId,
          args.payments,
        );
        result = this.formatPaymentResult(result, "multi_payment");
      } else if (functionName === "get_contacts") {
        result = await this.getContacts(userId);
      } else if (functionName === "get_billers") {
        result = await this.getBillers();
      } else if (functionName === "detect_operator") {
        result = await this.detectOperator(args.mobileNumber);
      } else if (functionName === "get_recharge_plans") {
        result = await this.getRechargePlans(args.operator);
      } else {
        result = { error: `Unknown function: ${functionName}` };
      }

      return {
        name: functionName,
        response: result || { error: "No result returned" },
      };
    } catch (error) {
      console.error(`❌ Function ${functionName} error:`, error);
      return {
        name: functionName,
        response: { error: error.message },
      };
    }
  }

  formatPaymentResult(result, type) {
    if (result && result.status === "ready") {
      const cardType = this.getCardType(type);
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

  getCardType(type) {
    const map = {
      send_money: "send_money_card",
      request_money: "send_money_card",
      pay_bill: "bill_pay_card",
      recharge_mobile: "recharge_card",
      multi_payment: "multi_payment_card",
    };
    return map[type] || "payment_card";
  }

  // ============================================
  // ORDERING FUNCTION IMPLEMENTATIONS
  // ============================================

  async checkMerchantConnected(userId, merchant) {
    const dbService = require("./databaseService");
    const connected = await dbService.isMerchantConnected(userId, merchant);
    return { connected, merchant };
  }

  async listSupportedMerchants(category) {
    const { availableMerchants } = require("./merchantConnectionService");
    let merchants = availableMerchants || [
      { id: "swiggy", name: "Swiggy", category: "food" },
      { id: "zomato", name: "Zomato", category: "food" },
      { id: "zepto", name: "Zepto", category: "groceries" },
      { id: "blinkit", name: "Blinkit", category: "groceries" },
      { id: "amazon", name: "Amazon", category: "shopping" },
      { id: "flipkart", name: "Flipkart", category: "shopping" },
    ];
    if (category && category !== "all") {
      merchants = merchants.filter((m) => m.category === category);
    }
    return merchants.map((m) => ({
      id: m.id,
      name: m.name,
      category: m.category,
    }));
  }

  async findRestaurantsNearby(userId, merchant, location, cuisine) {
    const merchantLocationService = require("./merchantLocationService");
    let restaurants = await merchantLocationService.getRestaurantsByLocation(
      merchant,
      location,
    );
    if (!restaurants || restaurants.length === 0) {
      restaurants = [
        {
          id: "r1",
          name: "Paradise Biryani",
          rating: 4.5,
          cuisine: "Biryani",
          deliveryTime: "30-40 min",
        },
        {
          id: "r2",
          name: "Kanti Sweets",
          rating: 4.3,
          cuisine: "Sweets & Snacks",
          deliveryTime: "25-35 min",
        },
        {
          id: "r3",
          name: "McDonald's",
          rating: 4.2,
          cuisine: "Burgers & Fries",
          deliveryTime: "20-30 min",
        },
      ];
    }
    let filtered = restaurants;
    if (cuisine) {
      filtered = restaurants.filter((r) =>
        r.cuisine?.toLowerCase().includes(cuisine.toLowerCase()),
      );
    }
    return { restaurants: filtered.slice(0, 10), merchant, location };
  }

  async getMenu(userId, merchant, restaurantId) {
    const merchantLocationService = require("./merchantLocationService");
    const dbService = require("./databaseService");
    const connection = await dbService.getMerchantConnection(userId, merchant);
    const city = connection?.location_city || "bangalore";
    let menu = await merchantLocationService.getRestaurantMenu(
      merchant,
      city,
      restaurantId,
    );
    if (!menu || menu.length === 0) {
      menu = [
        {
          id: "m1",
          name: "Chicken Biryani",
          price: 250,
          category: "Biryani",
          isPopular: true,
        },
        {
          id: "m2",
          name: "Paneer Butter Masala",
          price: 220,
          category: "Curry",
          isVeg: true,
        },
        {
          id: "m3",
          name: "Garlic Naan",
          price: 60,
          category: "Bread",
          isVeg: true,
        },
        {
          id: "m4",
          name: "Gulab Jamun",
          price: 80,
          category: "Dessert",
          isVeg: true,
        },
      ];
    }
    return { menu: menu.slice(0, 20), restaurantId, merchant };
  }

  async searchItems(userId, merchant, query, location) {
    const merchantLocationService = require("./merchantLocationService");
    let items = await merchantLocationService.searchItems(
      merchant,
      location || "bangalore",
      query,
    );
    if (!items || items.length === 0) {
      items = [
        { id: "s1", name: `${query} Item 1`, price: 100, category: "General" },
        { id: "s2", name: `${query} Item 2`, price: 150, category: "General" },
      ];
    }
    return { items: items.slice(0, 20), query, merchant };
  }

  async cartAddItem(userId, itemId, quantity) {
    const dbService = require("./databaseService");
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
    const agentSecurityService = require("./agentSecurityService");
    const result = await agentSecurityService.isSabAIPayLiteAvailable(
      userId,
      amount,
    );
    return { ...result, merchant, amount };
  }

  async initiatePayment(userId, method, amount) {
    return { method, amount, status: "pending" };
  }

  async getOrderStatus(userId, orderId) {
    const orderService = require("./orderService");
    const order = await orderService.getOrder(orderId, userId);
    return order || { error: "Order not found" };
  }

  async getUserLocation(userId) {
    const dbService = require("./databaseService");
    const connections = await dbService.getConnectedMerchants(userId);
    const locations = connections.map((c) => ({
      merchant: c.merchant_id,
      city: c.location_city,
      area: c.location_area,
    }));
    return { locations };
  }

  async requestLocation(userId) {
    return {
      message: "Please share your location to continue.",
      requiresLocation: true,
    };
  }

  // ============================================
  // PAYMENT HELPER FUNCTIONS
  // ============================================

  async getContacts(userId) {
    const dbService = require("./databaseService");
    const contacts = await dbService.getContacts(userId);
    return { contacts: contacts.slice(0, 20) };
  }

  async getBillers() {
    const billerCatalogService = require("./billerCatalogService");
    const billers = billerCatalogService.getAllBillers();
    return {
      billers: billers.map((b) => ({
        id: b.id,
        name: b.name,
        category: b.category,
      })),
    };
  }

  async detectOperator(mobileNumber) {
    const rechargePlanService = require("./rechargePlanService");
    const operator = rechargePlanService.detectOperator(mobileNumber);
    return { operator: operator || null, mobileNumber };
  }

  async getRechargePlans(operator) {
    const rechargePlanService = require("./rechargePlanService");
    const plans = rechargePlanService.getPlans(operator);
    return { plans, operator };
  }

  // ============================================
  // SYSTEM INSTRUCTION
  // ============================================
  buildSystemInstruction(userId, pendingIntent, context) {
    const flowContext = pendingIntent
      ? `
CURRENT PENDING INTENT:
- Flow: ${pendingIntent.flow || "none"}
- Slots filled: ${JSON.stringify(pendingIntent.slots || {})}
- Required slots: ${JSON.stringify(pendingIntent.requiredSlots || [])}
- Missing slots: ${JSON.stringify((pendingIntent.requiredSlots || []).filter((s) => !pendingIntent.slots?.[s]))}
`
      : "No pending intent.";

    return `You are SabAI, an AI payment assistant for SabAI Pay.

${flowContext}

You have access to the following payment functions:
- recharge_mobile(mobileNumber, amount, plan): Recharge a mobile number
- send_money(recipient, amount, note): Send money to a recipient
- pay_bill(billType, provider, customerId, amount): Pay utility bills
- multi_payment(payments): Process multiple payments at once

CRITICAL INSTRUCTION:
When a user says "yes" or "confirm" and ALL required slots are filled, you MUST call the appropriate function immediately. Do NOT ask for confirmation again.

IMPORTANT RULES:
1. If all required slots are filled, call the function immediately.
2. If a slot is missing, ask the user specifically for that information.
3. If the user says "yes" or "confirm" and all slots are filled, call the function.
4. Do NOT ask for information that has already been provided.

User ID: ${userId}

FLOW GUIDELINES:
- For recharge: Ask for mobile number first, then amount.
- For send money: Ask for recipient first, then amount.
- For pay bill: Ask for bill type, then provider, then customer ID, then amount.

Be conversational but efficient. Call functions when ready.`;
  }

  isAvailable() {
    return this.initialized;
  }

  clearChat(userId) {
    this.chatSessions.delete(`func_${userId}`);
    pendingIntentService.clear(userId);
  }
}

const geminiService = new GeminiChatService();
module.exports = geminiService;
