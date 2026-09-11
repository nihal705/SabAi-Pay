// backend/services/orchestratorService.js

const geminiService = require("./geminiChatService");
const pendingIntentService = require("./pendingIntentService");
const orderAgent = require("../agents/orderAgent");
const sendMoneyAgent = require("../agents/sendMoneyAgent");
const rechargeAgent = require("../agents/rechargeAgent");
const billAgent = require("../agents/billAgent");
const schedulerAgent = require("../agents/schedulerAgent");
const autoPayAgent = require("../agents/autoPayAgent");
const preferencesAgent = require("../agents/preferencesAgent");

class OrchestratorService {
  async processMessage(userId, message, pendingIntent, context = {}) {
    try {
      // Step 1: If pending intent exists and is complete, force function call
      if (pendingIntent && pendingIntentService.isComplete(userId)) {
        const result = await geminiService.forceFunctionCall(userId, pendingIntent);
        return this.formatResult(result);
      }

      // Step 2: Call Gemini with current state
      const geminiResult = await geminiService.processMessage(userId, message, {
        pendingIntent,
        cardData: context.cardData,
        conversationId: context.conversationId,
      });

      // Step 3: If Gemini returned function results, process them
      if (geminiResult.functionResults && geminiResult.functionResults.length > 0) {
        const funcResult = geminiResult.functionResults[0];
        // If the agent returned an error with a message, pass it as text
        if (funcResult.response && funcResult.response.status === "failed") {
          if (funcResult.response.message) {
            return {
              response: funcResult.response.message,
              requiresAction: false,
              merchant: funcResult.response.merchant,
            };
          }
          return this.formatResult(funcResult.response);
        }
        // If it's a payment card (status: ready) or a list card, return it
        if (funcResult.response && (funcResult.response.status === "ready" || funcResult.response.type)) {
          return this.formatResult(funcResult.response);
        }
        // If we got a function result but it's not a card, treat as text
        if (funcResult.response && funcResult.response.message) {
          return { response: funcResult.response.message, requiresAction: false };
        }
        return this.formatResult(geminiResult);
      }

      // Step 4: If Gemini returned a text response, return it
      if (geminiResult.response) {
        return this.formatResult(geminiResult);
      }

      // Fallback – ensure we always return something
      return {
        response: "I'm not sure how to help with that. Could you please rephrase?",
        requiresAction: false,
      };
    } catch (error) {
      console.error("Orchestrator error:", error);
      return {
        response: "I'm having trouble processing your request. Please try again.",
        requiresAction: false,
      };
    }
  }

  // ============================================
  // HANDLE FUNCTION CALL – routes to the right agent
  // ============================================
  async handleFunctionCall(userId, functionName, args) {
    try {
      switch (functionName) {
        // Order Agent
        case "search_restaurants": {
          const result = await orderAgent.findRestaurants(
            userId,
            args.merchant,
            args.location,
            args.cuisine
          );
          return result;
        }
        case "get_menu": {
          const result = await orderAgent.getMenu(userId, args.merchant, args.restaurantId);
          return result;
        }
        case "add_to_cart": {
          const result = await orderAgent.addToCart(userId, args.sessionId, args.items);
          return result;
        }
        case "checkout": {
          const result = await orderAgent.checkout(userId, args.sessionId, args.paymentMethod);
          return result;
        }

        // Send Money Agent
        case "send_money": {
          return await sendMoneyAgent.sendMoney(userId, args.recipient, args.amount, args.note);
        }
        case "request_money": {
          return await sendMoneyAgent.requestMoney(userId, args.recipient, args.amount, args.note);
        }
        case "resolve_recipient": {
          return await sendMoneyAgent.resolveRecipient(userId, args.text);
        }

        // Recharge Agent
        case "recharge_mobile": {
          return await rechargeAgent.recharge(
            userId,
            args.mobileNumber,
            args.amount,
            args.plan,
            args.operator
          );
        }
        case "detect_operator": {
          return await rechargeAgent.detectOperator(args.mobileNumber);
        }
        case "get_recharge_plans": {
          return await rechargeAgent.getPlans(args.operatorId);
        }

        // Bill Agent
        case "pay_bill": {
          return await billAgent.payBill(
            userId,
            args.billType,
            args.provider,
            args.customerId,
            args.amount
          );
        }
        case "list_billers": {
          return await billAgent.listBillers(args.category);
        }
        case "fetch_bill_amount": {
          return await billAgent.fetchBillAmount(args.billerId, args.customerId);
        }

        // Scheduler Agent
        case "schedule_payment": {
          return await schedulerAgent.schedulePayment(
            userId,
            args.action,
            args.datetime,
            args.paymentMethod
          );
        }

        // Auto-Pay Agent
        case "setup_autopay": {
          return await autoPayAgent.setupAutoPay(
            userId,
            args.action,
            args.schedule,
            args.paymentMethod
          );
        }
        case "cancel_autopay": {
          return await autoPayAgent.cancelAutoPay(args.orderId);
        }

        // Preferences Agent
        case "get_usual": {
          const result = await preferencesAgent.getUsual(
            userId,
            args.mealSlot,
            args.merchant,
            args.paymentMethod,
            args.sessionId || null
          );
          return result;
        }
        case "save_usual": {
          const result = await preferencesAgent.saveUsual(
            userId,
            args.mealSlot,
            args.items,
            args.merchant || null
          );
          return result;
        } 

        default:
          return { error: `Unknown function: ${functionName}`, status: "failed" };
      }
    } catch (error) {
      console.error(`Function ${functionName} error:`, error);
      return { error: error.message, status: "failed" };
    }
  }

  // ============================================
  // FORMAT RESULT – ensures consistent shape with 'response' field
  // ============================================
  formatResult(result) {
    // Ensure we always return an object
    if (!result || typeof result !== 'object') {
      return {
        response: "I've processed your request but couldn't find a proper response.",
        requiresAction: false,
      };
    }

    // If result has a message field but no response, use it
    if (result.message && !result.response) {
      result.response = result.message;
    }

    // If result has a 'response' field, we're good.
    // If it has a type that's a card or summary, set requiresAction
    let requiresAction = false;
    if (result.type && (result.type.includes("_card") || result.type === "order_summary" || result.type === "restaurants_list" || result.type === "products_grid")) {
      requiresAction = true;
    }
    if (result.status === "ready") {
      requiresAction = true;
    }
    if (result.requiresAction === true) {
      requiresAction = true;
    }

    // If no response field, create a generic one
    if (!result.response) {
      if (result.type === "restaurants_list") {
        result.response = `I found ${result.restaurants?.length || 0} restaurants near you. Select one to see the menu.`;
      } else if (result.type === "products_grid") {
        result.response = `I found ${result.products?.length || 0} items. Select what you'd like to order.`;
      } else if (result.type === "order_summary") {
        result.response = `Your order total is ₹${result.total || 0}. Please confirm your payment method.`;
      } else {
        result.response = "I've prepared the details for you. Please review and confirm.";
      }
    }

    return { ...result, requiresAction };
  }
}

module.exports = new OrchestratorService();