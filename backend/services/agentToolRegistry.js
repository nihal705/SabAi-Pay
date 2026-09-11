// backend/services/agentToolRegistry.js
// Corrected – all array parameters have 'items' defined

class AgentToolRegistry {
  constructor() {
    this.tools = this.buildToolRegistry();
    this.toolMap = new Map();
    this.tools.forEach(tool => this.toolMap.set(tool.name, tool));
  }

  buildToolRegistry() {
    return [
      // ============================================
      // ORDERING TOOLS
      // ============================================
      {
        name: "search_restaurants",
        description: "Search for restaurants on a merchant platform",
        parameters: {
          type: "object",
          properties: {
            merchant: { type: "string", enum: ["swiggy", "zomato", "zepto", "blinkit"], description: "The merchant platform" },
            location: { type: "string", description: "City name (optional – will use saved location if not provided)" },
            cuisine: { type: "string", description: "Cuisine type (optional)" },
          },
          required: ["merchant"],
        },
      },
      {
        name: "get_menu",
        description: "Get menu items for a specific restaurant",
        parameters: {
          type: "object",
          properties: {
            merchant: { type: "string", description: "Merchant platform" },
            restaurantId: { type: "string", description: "Restaurant ID" },
          },
          required: ["merchant", "restaurantId"],
        },
      },
      {
        name: "add_to_cart",
        description: "Add an item to the order cart",
        parameters: {
          type: "object",
          properties: {
            sessionId: { type: "string", description: "Order session ID" },
            item: {
              type: "object",
              description: "Item object with name, price, quantity",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                price: { type: "number" },
                quantity: { type: "integer" },
              },
              required: ["id", "name", "price", "quantity"],
            },
          },
          required: ["sessionId", "item"],
        },
      },
      {
        name: "checkout",
        description: "Proceed to checkout for an order",
        parameters: {
          type: "object",
          properties: {
            sessionId: { type: "string", description: "Order session ID" },
            paymentMethod: { type: "string", enum: ["upi", "reserve"], description: "Payment method" },
          },
          required: ["sessionId"],
        },
      },
      // ============================================
      // SEND MONEY
      // ============================================
      {
        name: "send_money",
        description: "Send money to a recipient",
        parameters: {
          type: "object",
          properties: {
            recipient: { type: "string", description: "UPI ID, phone number, or contact name" },
            amount: { type: "number", description: "Amount in INR" },
            note: { type: "string", description: "Optional note" },
          },
          required: ["recipient", "amount"],
        },
      },
      {
        name: "request_money",
        description: "Request money from a contact",
        parameters: {
          type: "object",
          properties: {
            recipient: { type: "string", description: "UPI ID or phone number" },
            amount: { type: "number", description: "Amount in INR" },
            note: { type: "string", description: "Optional note" },
          },
          required: ["recipient", "amount"],
        },
      },
      {
        name: "resolve_recipient",
        description: "Resolve recipient from text (contact name, UPI, phone)",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "Text to resolve" },
          },
          required: ["text"],
        },
      },
      // ============================================
      // RECHARGE
      // ============================================
      {
        name: "recharge_mobile",
        description: "Recharge a mobile number",
        parameters: {
          type: "object",
          properties: {
            mobileNumber: { type: "string", description: "10-digit mobile number" },
            amount: { type: "number", description: "Recharge amount" },
            plan: { type: "string", description: "Optional plan name" },
            operator: { type: "string", description: "Operator name (airtel, jio, vi, bsnl)" },
          },
          required: ["mobileNumber", "amount"],
        },
      },
      {
        name: "detect_operator",
        description: "Detect mobile operator from number",
        parameters: {
          type: "object",
          properties: {
            mobileNumber: { type: "string", description: "10-digit mobile number" },
          },
          required: ["mobileNumber"],
        },
      },
      {
        name: "get_recharge_plans",
        description: "Get recharge plans for an operator",
        parameters: {
          type: "object",
          properties: {
            operatorId: { type: "string", description: "Operator ID" },
          },
          required: ["operatorId"],
        },
      },
      // ============================================
      // BILL PAYMENT
      // ============================================
      {
        name: "pay_bill",
        description: "Pay a utility bill",
        parameters: {
          type: "object",
          properties: {
            billType: { type: "string", enum: ["electricity", "mobile", "broadband", "gas", "credit_card", "water"], description: "Type of bill" },
            provider: { type: "string", description: "Provider name" },
            customerId: { type: "string", description: "Customer ID or account number" },
            amount: { type: "number", description: "Bill amount" },
          },
          required: ["billType", "provider", "customerId", "amount"],
        },
      },
      {
        name: "list_billers",
        description: "List all billers optionally filtered by category",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", description: "Category filter" },
          },
        },
      },
      {
        name: "fetch_bill_amount",
        description: "Fetch the due amount for a biller",
        parameters: {
          type: "object",
          properties: {
            billerId: { type: "string", description: "Biller ID" },
            customerId: { type: "string", description: "Customer ID" },
          },
          required: ["billerId", "customerId"],
        },
      },
      // ============================================
      // SCHEDULER
      // ============================================
      {
        name: "schedule_payment",
        description: "Schedule a one-time future payment",
        parameters: {
          type: "object",
          properties: {
            action: {
              type: "object",
              description: "Action to schedule (recharge, bill, send_money)",
              properties: {
                type: { type: "string", enum: ["recharge", "bill", "send_money"] },
                data: { type: "object" },
              },
              required: ["type", "data"],
            },
            datetime: { type: "string", description: "ISO datetime string" },
            paymentMethod: { type: "string", enum: ["upi", "reserve", "bank"], description: "Payment method" },
          },
          required: ["action", "datetime"],
        },
      },
      // ============================================
      // AUTO-PAY
      // ============================================
      {
        name: "setup_autopay",
        description: "Set up recurring automatic payments",
        parameters: {
          type: "object",
          properties: {
            action: {
              type: "object",
              description: "Action to repeat",
              properties: {
                type: { type: "string", enum: ["recharge", "bill", "send_money"] },
                data: { type: "object" },
              },
              required: ["type", "data"],
            },
            schedule: { type: "string", enum: ["monthly", "weekly", "daily"], description: "Recurrence schedule" },
            paymentMethod: { type: "string", enum: ["upi", "reserve", "bank"], description: "Payment method" },
          },
          required: ["action", "schedule"],
        },
      },
      {
        name: "cancel_autopay",
        description: "Cancel an existing auto-pay order",
        parameters: {
          type: "object",
          properties: {
            orderId: { type: "string", description: "Auto-pay order ID" },
          },
          required: ["orderId"],
        },
      },
      {
  name: "get_usual",
  description: "Get user's usual order and optionally place it",
  parameters: {
    type: "object",
    properties: {
      mealSlot: { type: "string", enum: ["breakfast", "lunch", "dinner", "snacks"], description: "Meal slot" },
      merchant: { type: "string", description: "Optional merchant to order from" },
      paymentMethod: { type: "string", enum: ["upi", "reserve", "gems"], description: "Payment method (if placing order)" },
      sessionId: { type: "string", description: "Existing order session ID (optional)" },
    },
    required: ["mealSlot"],
  },
},
      // ============================================
      // MULTI-PAYMENT (must define 'items' for array)
      // ============================================
      {
        name: "multi_payment",
        description: "Process multiple payments in one action",
        parameters: {
          type: "object",
          properties: {
            payments: {
              type: "array",
              description: "Array of payment actions to process",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["send_money", "pay_bill", "recharge_mobile"],
                    description: "Type of payment",
                  },
                  data: {
                    type: "object",
                    description: "Payment-specific data",
                  },
                },
                required: ["type", "data"],
              },
            },
          },
          required: ["payments"],
        },
      },
    ];
  }

  getToolDefinitions() {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  getTool(name) {
    return this.toolMap.get(name);
  }
}

module.exports = new AgentToolRegistry();