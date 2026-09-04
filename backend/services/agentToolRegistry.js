// backend/services/agentToolRegistry.js
// Single source of truth for ALL tools - Ordering + Payments

class AgentToolRegistry {
  constructor() {
    this.tools = this.buildToolRegistry();
    this.toolMap = new Map();
    this.tools.forEach((tool) => this.toolMap.set(tool.name, tool));
  }

  buildToolRegistry() {
    return [
      // ============================================
      // ORDERING TOOLS (Existing)
      // ============================================
      {
        name: "check_merchant_connected",
        description: "Check if a merchant is connected for the user",
        parameters: {
          type: "object",
          properties: {
            merchant: {
              type: "string",
              enum: [
                "swiggy",
                "zomato",
                "zepto",
                "blinkit",
                "amazon",
                "flipkart",
                "netmeds",
                "pharmeasy",
              ],
              description: "The merchant to check connection for",
            },
          },
          required: ["merchant"],
        },
      },
      {
        name: "list_supported_merchants",
        description:
          "List all supported merchants, optionally filtered by category",
        parameters: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["food", "groceries", "shopping", "pharmacy", "all"],
              description: "Category to filter merchants by",
            },
          },
        },
      },
      {
        name: "find_restaurants_nearby",
        description: "Find restaurants near a location for a merchant",
        parameters: {
          type: "object",
          properties: {
            merchant: {
              type: "string",
              enum: ["swiggy", "zomato"],
              description: "The merchant to search on",
            },
            location: { type: "string", description: "City or area name" },
            cuisine: {
              type: "string",
              description: "Cuisine type to filter by (optional)",
            },
          },
          required: ["merchant", "location"],
        },
      },
      {
        name: "get_menu",
        description: "Get the menu for a specific restaurant",
        parameters: {
          type: "object",
          properties: {
            merchant: {
              type: "string",
              enum: ["swiggy", "zomato"],
              description: "The merchant",
            },
            restaurantId: { type: "string", description: "The restaurant ID" },
          },
          required: ["merchant", "restaurantId"],
        },
      },
      {
        name: "search_items",
        description: "Search for items across a merchant",
        parameters: {
          type: "object",
          properties: {
            merchant: {
              type: "string",
              description: "The merchant to search in",
            },
            query: { type: "string", description: "Search term" },
            location: {
              type: "string",
              description: "City or area for location-based results",
            },
          },
          required: ["merchant", "query"],
        },
      },
      {
        name: "cart_add_item",
        description: "Add an item to the cart",
        parameters: {
          type: "object",
          properties: {
            itemId: { type: "string", description: "The item ID" },
            quantity: {
              type: "integer",
              description: "Quantity to add",
              default: 1,
            },
          },
          required: ["itemId"],
        },
      },
      {
        name: "cart_remove_item",
        description: "Remove an item from the cart",
        parameters: {
          type: "object",
          properties: {
            itemId: { type: "string", description: "The item ID to remove" },
          },
          required: ["itemId"],
        },
      },
      {
        name: "cart_update_quantity",
        description: "Update the quantity of an item in the cart",
        parameters: {
          type: "object",
          properties: {
            itemId: { type: "string", description: "The item ID" },
            quantity: { type: "integer", description: "New quantity" },
          },
          required: ["itemId", "quantity"],
        },
      },
      {
        name: "cart_view",
        description: "View the current cart contents",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "check_reserve_pay_limit",
        description: "Check if a payment amount is within Reserve Pay limit",
        parameters: {
          type: "object",
          properties: {
            merchant: { type: "string", description: "The merchant/recipient" },
            amount: { type: "number", description: "The payment amount" },
          },
          required: ["merchant", "amount"],
        },
      },
      {
        name: "initiate_payment",
        description: "Initiate a payment (UPI, Reserve Pay, or Schedule)",
        parameters: {
          type: "object",
          properties: {
            method: {
              type: "string",
              enum: ["upi", "reserve_pay", "schedule"],
              description: "Payment method",
            },
            amount: { type: "number", description: "Payment amount" },
          },
          required: ["method", "amount"],
        },
      },
      {
        name: "get_order_status",
        description: "Get the status of an order",
        parameters: {
          type: "object",
          properties: {
            orderId: { type: "string", description: "The order ID" },
          },
          required: ["orderId"],
        },
      },
      {
        name: "get_user_location",
        description: "Get the user's saved location",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "request_location",
        description: "Request the user to provide their location",
        parameters: { type: "object", properties: {} },
      },

      // ============================================
      // PAYMENT TOOLS (NEW)
      // ============================================
      {
        name: "send_money",
        description: "Send money to a recipient (UPI, phone, bank account)",
        parameters: {
          type: "object",
          properties: {
            recipient: {
              type: "string",
              description:
                "Recipient identifier (UPI ID, phone number, or bank account)",
            },
            amount: { type: "number", description: "Amount to send in INR" },
            note: {
              type: "string",
              description: "Optional note for the transaction",
            },
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
            recipient: {
              type: "string",
              description: "Recipient identifier (UPI ID, phone number)",
            },
            amount: { type: "number", description: "Amount to request in INR" },
            note: {
              type: "string",
              description: "Optional note for the request",
            },
          },
          required: ["recipient", "amount"],
        },
      },
      {
        name: "pay_bill",
        description:
          "Pay a bill (electricity, mobile, broadband, gas, credit card, water)",
        parameters: {
          type: "object",
          properties: {
            billType: {
              type: "string",
              enum: [
                "electricity",
                "mobile",
                "broadband",
                "gas",
                "credit_card",
                "water",
              ],
              description: "Type of bill",
            },
            provider: { type: "string", description: "The bill provider name" },
            customerId: {
              type: "string",
              description: "Customer ID or account number",
            },
            amount: { type: "number", description: "Bill amount in INR" },
          },
          required: ["billType", "provider", "customerId", "amount"],
        },
      },
      {
        name: "recharge_mobile",
        description: "Recharge a mobile number",
        parameters: {
          type: "object",
          properties: {
            mobileNumber: {
              type: "string",
              description: "10-digit mobile number",
            },
            amount: { type: "number", description: "Recharge amount in INR" },
            plan: { type: "string", description: "Optional plan name or ID" },
          },
          required: ["mobileNumber", "amount"],
        },
      },
      {
        name: "multi_payment",
        description: "Process multiple payments in one action",
        parameters: {
          type: "object",
          properties: {
            payments: {
              type: "array",
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
              description: "Array of payment actions to process",
            },
          },
          required: ["payments"],
        },
      },
      {
        name: "get_contacts",
        description: "Get the user's saved contacts",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "get_billers",
        description: "Get the list of supported billers",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "detect_operator",
        description: "Detect mobile operator from phone number",
        parameters: {
          type: "object",
          properties: {
            mobileNumber: {
              type: "string",
              description: "10-digit mobile number",
            },
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
            operator: {
              type: "string",
              description: "Operator name (airtel, jio, vi, bsnl)",
            },
          },
          required: ["operator"],
        },
      },
    ];
  }

  getToolDefinitions() {
    return this.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  getTool(name) {
    return this.toolMap.get(name);
  }

  getAllToolNames() {
    return this.tools.map((t) => t.name);
  }

  getPaymentTools() {
    return this.tools.filter((t) =>
      [
        "send_money",
        "request_money",
        "pay_bill",
        "recharge_mobile",
        "multi_payment",
      ].includes(t.name),
    );
  }

  getOrderingTools() {
    return this.tools.filter((t) =>
      [
        "check_merchant_connected",
        "list_supported_merchants",
        "find_restaurants_nearby",
        "get_menu",
        "search_items",
        "cart_add_item",
        "cart_remove_item",
        "cart_update_quantity",
        "cart_view",
        "check_reserve_pay_limit",
        "initiate_payment",
        "get_order_status",
        "get_user_location",
        "request_location",
      ].includes(t.name),
    );
  }

  getToolNamesByCategory(category) {
    if (category === "payment") {
      return this.getPaymentTools().map((t) => t.name);
    }
    if (category === "ordering") {
      return this.getOrderingTools().map((t) => t.name);
    }
    return this.getAllToolNames();
  }
}

module.exports = new AgentToolRegistry();
