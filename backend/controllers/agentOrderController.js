// backend/controllers/agentOrderController.js

const dbService = require("../services/databaseService");
const paymentService = require("../services/paymentService");
const merchantDataService = require("../services/merchantDataService");
const merchantConnectionService = require("../services/merchantConnectionService");
const orderService = require("../services/orderService");
const scheduledOrderService = require("../services/scheduledOrderService");
const agentSecurityService = require("../services/agentSecurityService");

class AgentOrderController {
  constructor() {
    console.log("✅ AgentOrderController initialized (execution only)");
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================
  async getOrCreateSession(userId, sessionId = null) {
    try {
      if (sessionId) {
        const session = await dbService.getOrderSession(sessionId);
        if (session && session.user_id === userId) {
          let merchantInfo = session.merchant_info;
          let cart = session.cart;
          let preferences = session.preferences;

          if (typeof merchantInfo === "string") {
            try { merchantInfo = JSON.parse(merchantInfo); } catch (e) { merchantInfo = {}; }
          }
          if (typeof cart === "string") {
            try { cart = JSON.parse(cart); } catch (e) { cart = []; }
          }
          if (typeof preferences === "string") {
            try { preferences = JSON.parse(preferences); } catch (e) { preferences = {}; }
          }

          return {
            id: session.session_id,
            userId: session.user_id,
            merchant: session.merchant,
            merchantInfo: merchantInfo || null,
            cart: Array.isArray(cart) ? cart : [],
            subtotal: parseFloat(session.subtotal) || 0,
            tax: parseFloat(session.tax) || 0,
            total: parseFloat(session.total) || 0,
            step: session.step || "init",
            preferences: preferences || {},
            isScheduled: session.is_scheduled === 1,
            scheduledTime: session.scheduled_time,
            createdAt: session.created_at,
          };
        }
      }

      const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: newSessionId,
        userId: userId,
        merchant: null,
        merchantInfo: null,
        cart: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        step: "init",
        preferences: {},
        isScheduled: false,
        scheduledTime: null,
        createdAt: new Date().toISOString(),
        isNew: true,
      };
    } catch (error) {
      console.error("Error getting/creating session:", error);
      const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: newSessionId,
        userId: userId,
        merchant: null,
        merchantInfo: null,
        cart: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        step: "init",
        preferences: {},
        isScheduled: false,
        scheduledTime: null,
        createdAt: new Date().toISOString(),
        isNew: true,
      };
    }
  }

  async saveSession(session) {
    try {
      const cartStr = typeof session.cart === "string" ? session.cart : JSON.stringify(session.cart || []);
      const merchantInfoStr = session.merchantInfo
        ? typeof session.merchantInfo === "string" ? session.merchantInfo : JSON.stringify(session.merchantInfo)
        : null;
      const preferencesStr = session.preferences ? JSON.stringify(session.preferences) : null;

      await dbService.saveOrderSession({
        session_id: session.id,
        user_id: session.userId,
        merchant: session.merchant,
        merchant_info: merchantInfoStr,
        cart: cartStr,
        subtotal: session.subtotal || 0,
        tax: session.tax || 0,
        total: session.total || 0,
        step: session.step || "init",
        preferences: preferencesStr,
        is_scheduled: session.isScheduled ? 1 : 0,
        scheduled_time: session.scheduledTime,
      });
      return true;
    } catch (error) {
      console.error("Error saving session:", error);
      return false;
    }
  }

  async deleteSession(sessionId) {
    try {
      await dbService.deleteOrderSession(sessionId);
      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      return false;
    }
  }

  // ============================================
  // LOCATION HELPERS
  // ============================================
  async getUserLocationForMerchant(userId, merchant) {
    try {
      const connection = await merchantConnectionService.getMerchantConnection(userId, merchant);
      if (connection && connection.location_city) {
        return {
          city: connection.location_city,
          area: connection.location_area,
          address: connection.location_address,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting user location:", error);
      return null;
    }
  }

  // ============================================
  // ITEM SEARCH (used by order agent)
  // ============================================
  async searchItemsInMerchant(merchant, searchTerm, userLocation) {
    try {
      console.log(`🔍 Searching for "${searchTerm}" in ${merchant}`);
      const merchantData = await merchantDataService.getMerchantData(
        merchant,
        userLocation?.city,
        userLocation?.area,
        searchTerm,
        { showMenu: true }
      );

      let items = [];
      if (merchantData?.type === "search_results" && merchantData.items) {
        items = merchantData.items;
      } else if (merchantData?.type === "products_grid" && merchantData.products) {
        items = merchantData.products;
      } else if (merchantData?.type === "restaurant_menu" && merchantData.menu) {
        items = merchantData.menu;
      }

      if (items.length === 0) {
        console.log(`No items found for "${searchTerm}" in ${merchant}`);
        return [];
      }

      const scoredItems = items.map(item => ({
        name: item.name,
        price: item.price || 0,
        id: item.id || `${merchant}_${item.name.replace(/\s/g, "_")}`,
        imageUrl: item.imageUrl || item.image || "/images/items/default.png",
        category: item.category || "General",
        unit: item.unit || "piece",
        isVeg: item.isVeg || false,
        description: item.description || "",
        restaurantName: item.restaurantName || null,
        matchScore: this.calculateItemMatchScore(item.name, searchTerm),
      }));

      return scoredItems.filter(item => item.matchScore > 0).slice(0, 10);
    } catch (error) {
      console.error("Error searching items in merchant:", error);
      return [];
    }
  }

  calculateItemMatchScore(itemName, searchTerm) {
    const itemLower = itemName.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    if (itemLower === searchLower) return 100;
    if (itemLower.startsWith(searchLower)) return 80;
    if (itemLower.includes(searchLower)) return 60;
    const searchWords = searchLower.split(" ");
    const itemWords = itemLower.split(" ");
    for (const sw of searchWords) {
      if (sw.length > 2 && itemWords.some(iw => iw.includes(sw))) return 40;
    }
    return 0;
  }

  // ============================================
  // ORDER EXECUTION METHODS
  // ============================================
  async processItemAddition(req, res, session, merchant, items, preferences, userLocation) {
    // This method adds items to cart – used by order agent
    try {
      const userId = req.user?.id ? String(req.user.id) : "4";
      const merchantData = await merchantDataService.getMerchantData(
        merchant,
        userLocation?.city || "bangalore",
        userLocation?.area,
        null,
        {}
      );

      let availableProducts = [];
      if (merchantData?.type === "products_grid" && merchantData.products) {
        availableProducts = merchantData.products;
      } else if (merchantData?.type === "restaurants_list" && merchantData.restaurants) {
        for (const restaurant of merchantData.restaurants.slice(0, 10)) {
          const menu = await merchantDataService.getRestaurantMenu(
            merchant,
            userLocation?.city || "bangalore",
            restaurant.id
          );
          if (menu && menu.length > 0) {
            availableProducts.push(...menu.map(item => ({
              ...item,
              restaurantName: restaurant.name,
              restaurantId: restaurant.id,
              restaurantRating: restaurant.rating,
              deliveryTime: restaurant.deliveryTime,
            })));
          }
        }
      }

      const foundItems = [];
      const notFoundItems = [];

      for (const requestedItem of items) {
        let searchTerm = requestedItem.name.toLowerCase().trim();
        const removeWords = ["i want to order", "please order", "order", "from", "swiggy", "zomato"];
        for (const word of removeWords) {
          searchTerm = searchTerm.replace(word, "");
        }
        searchTerm = searchTerm.trim();

        let matchedItem = null;
        let bestScore = 0;
        for (const product of availableProducts) {
          const productName = product.name.toLowerCase();
          let score = 0;
          if (productName === searchTerm) score = 100;
          else if (productName.includes(searchTerm)) score = 80;
          else if (searchTerm.includes(productName)) score = 70;
          else {
            const searchWords = searchTerm.split(" ");
            const productWords = productName.split(" ");
            let matchCount = 0;
            for (const sw of searchWords) {
              if (sw.length > 2 && productWords.some(pw => pw.includes(sw))) matchCount++;
            }
            if (matchCount > 0) score = 40 + matchCount * 10;
          }
          if (product.isPopular) score += 10;
          if (score > bestScore && score > 30) {
            bestScore = score;
            matchedItem = product;
          }
        }

        if (matchedItem) {
          let quantity = requestedItem.quantity || 1;
          if (!requestedItem.quantity && requestedItem.name) {
            const qtyMatch = requestedItem.name.match(/^(\d+)/);
            if (qtyMatch) {
              quantity = parseInt(qtyMatch[1]);
              const cleanName = requestedItem.name.replace(/^\d+\s*/, "");
              if (cleanName !== requestedItem.name) requestedItem.name = cleanName;
            }
          }
          foundItems.push({
            id: matchedItem.id || `${merchant}_${matchedItem.name.replace(/\s/g, "_")}`,
            name: matchedItem.name,
            price: matchedItem.price || 0,
            quantity: quantity,
            total: (matchedItem.price || 0) * quantity,
            unit: matchedItem.unit || "piece",
            imageUrl: matchedItem.imageUrl || matchedItem.image || "/images/items/default.png",
            category: matchedItem.category || "General",
            isVeg: matchedItem.isVeg || false,
            restaurantName: matchedItem.restaurantName,
            restaurantId: matchedItem.restaurantId,
            restaurantRating: matchedItem.restaurantRating,
            deliveryTime: matchedItem.deliveryTime,
            merchant: merchant,
          });
        } else {
          notFoundItems.push(requestedItem);
        }
      }

      let updatedCart = [...session.cart];
      for (const item of foundItems) {
        const existingIndex = updatedCart.findIndex(i => i.name === item.name);
        if (existingIndex !== -1) {
          updatedCart[existingIndex].quantity += item.quantity;
          updatedCart[existingIndex].total = updatedCart[existingIndex].price * updatedCart[existingIndex].quantity;
        } else {
          updatedCart.push(item);
        }
      }

      let subtotal = updatedCart.reduce((sum, i) => sum + i.total, 0);
      const tax = Math.round(subtotal * 0.05);
      const grandTotal = subtotal + tax;

      session.cart = updatedCart;
      session.subtotal = subtotal;
      session.tax = tax;
      session.total = grandTotal;
      session.merchant = merchant;
      session.step = updatedCart.length > 0 ? "confirm_items" : "awaiting_items";
      await this.saveSession(session);

      const reserveCheck = await this.checkReservePayEligibility(userId, merchant, grandTotal);
      const sabaiGems = this.calculateSabaiGems(grandTotal);
      const orderSummary = this.formatOrderSummary(
        updatedCart,
        [],
        subtotal,
        tax,
        grandTotal,
        session.merchantInfo,
        reserveCheck,
        sabaiGems,
        merchant
      );

      return res.json({
        success: true,
        data: {
          response: orderSummary,
          sessionId: session.id,
          cart: updatedCart,
          total: grandTotal,
          requiresAction: "payment_selection",
        },
      });
    } catch (error) {
      console.error("Error processing items:", error);
      return res.json({
        success: true,
        data: {
          response: "I had trouble finding those items. Please try again with exact item names from the menu.",
          requiresAction: "retry",
        },
      });
    }
  }

  formatOrderSummary(cart, unavailableItems, subtotal, tax, total, merchantInfo, reserveCheck, sabaiGems, merchantName) {
    const merchant = merchantName || merchantInfo?.name || "Merchant";
    return {
      type: "order_summary",
      merchant: merchant,
      merchantName: merchant,
      merchantLogo: `/images/merchants/${merchant.toLowerCase()}.png`,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        image: item.imageUrl || this.getDefaultItemImage(item.name),
        unit: item.unit || "piece",
        restaurantName: item.restaurantName,
      })),
      unavailableItems: unavailableItems,
      subtotal: subtotal,
      tax: tax,
      total: total,
      sabaiGems: sabaiGems,
      reserveCheck: reserveCheck,
      paymentOptions: {
        upi: true,
        reservePay: reserveCheck?.eligible || false,
        schedulePay: true,
        autoPay: true,
      },
    };
  }

  getDefaultItemImage(itemName) {
    const lowerName = itemName.toLowerCase();
    if (lowerName.includes("biryani")) return "/images/items/chicken-biryani.png";
    if (lowerName.includes("paneer")) return "/images/items/paneer-butter-masala.png";
    if (lowerName.includes("chicken")) return "/images/items/butter-chicken.png";
    if (lowerName.includes("naan")) return "/images/items/garlic-naan.png";
    return "/images/items/default.png";
  }

  calculateSabaiGems(amount) {
    return Math.min(Math.floor(amount * 0.05), 100);
  }

  async checkReservePayEligibility(userId, merchant, amount) {
    try {
      if (!merchant) return { eligible: false, limit: 0, spent: 0, remaining: 0, message: "No merchant specified." };
      const merchantLimit = await dbService.getReserveLimit(userId, merchant);
      const limit = merchantLimit || await dbService.getReserveLimit(userId, "sabai-pay-lite");
      if (!limit) {
        return { eligible: false, limit: 0, spent: 0, remaining: 0, message: `No Reserve Pay limit set for ${merchant}.` };
      }
      const remaining = limit.monthly_limit - (limit.current_spent || 0);
      const eligible = amount <= remaining;
      return {
        eligible: eligible,
        merchant: limit.merchant,
        limit: limit.monthly_limit,
        spent: limit.current_spent || 0,
        remaining: remaining,
        message: eligible
          ? `✅ Within Reserve Pay limit! Remaining: ₹${remaining.toFixed(2)}`
          : `❌ Exceeds Reserve Pay limit by ₹${(amount - remaining).toFixed(2)}`,
      };
    } catch (error) {
      console.error("Reserve Pay check error:", error);
      return { eligible: false, limit: 0, spent: 0, remaining: 0, message: "Error checking Reserve Pay limit." };
    }
  }

  async updateUserReserveLimit(userId, merchant, amountSpent) {
    try {
      await dbService.updateReserveLimitSpent(userId, merchant, amountSpent);
      return true;
    } catch (error) {
      console.error("Error updating reserve limit:", error);
      return false;
    }
  }

  // ============================================
  // PAYMENT EXECUTION
  // ============================================
  async confirmUPIPayment(req, res) {
    try {
      const { sessionId, paymentId } = req.body;
      const userId = req.user?.id ? String(req.user.id) : "4";
      let session = await this.getOrCreateSession(userId, sessionId);
      if (!session || session.cart.length === 0) {
        return res.json({
          success: true,
          data: {
            response: "Your cart is empty. Please add items first.",
            requiresAction: "specify_items",
          },
        });
      }

      const roundedTotal = Math.round(session.total * 100) / 100;
      const sabaiGems = this.calculateSabaiGems(roundedTotal);
      const orderId = "ORD" + Date.now();
      const now = new Date();
      const deliveryTime = new Date(now.getTime() + 45 * 60000);

      if (session.isScheduled && session.scheduledTime) {
        const scheduledOrder = await scheduledOrderService.scheduleOrder(
          userId,
          {
            sessionId: session.id,
            cart: session.cart,
            merchant: session.merchant,
            total: roundedTotal,
            paymentMethod: "upi",
            paymentId: paymentId,
          },
          session.scheduledTime,
          "upi"
        );
        await this.deleteSession(session.id);
        const scheduledDate = new Date(session.scheduledTime);
        return res.json({
          success: true,
          data: {
            response: `📅 **Order Scheduled!**\n\nYour order has been scheduled for ${scheduledDate.toLocaleString()}.\n\n**Order ID:** ${scheduledOrder.id}\n**Items:** ${session.cart.length} item(s)\n**Total:** ₹${roundedTotal}`,
            requiresAction: "complete",
            isScheduled: true,
            scheduledTime: session.scheduledTime,
          },
        });
      }

      const tracking = [
        { status: "confirmed", label: "Order Confirmed", completed: true, time: now.toLocaleTimeString() },
        { status: "preparing", label: "Preparing", completed: false, estimatedTime: deliveryTime.toLocaleTimeString() },
        { status: "out_for_delivery", label: "Out for Delivery", completed: false },
        { status: "delivered", label: "Delivered", completed: false },
      ];

      const order = {
        id: orderId,
        userId: session.userId,
        merchant: session.merchant,
        merchantName: session.merchantInfo?.name || session.merchant,
        items: session.cart,
        totalAmount: roundedTotal,
        status: "confirmed",
        paymentMethod: "UPI",
        paymentId,
        sabaiGems: sabaiGems,
        estimatedDelivery: "45 minutes",
        estimatedDeliveryTime: deliveryTime.toLocaleTimeString(),
        createdAt: now.toISOString(),
        tracking,
      };

      await orderService.saveOrder(session.userId, order);
      await dbService.createTransaction({
        transaction_id: paymentId,
        user_id: session.userId,
        type: "merchant_order",
        amount: roundedTotal,
        status: "success",
        description: `Order payment to ${order.merchantName}`,
        merchant: session.merchant,
        bank_used: roundedTotal,
        cashback_earned: sabaiGems,
      });

      await this.deleteSession(session.id);

      let confirmation = `🎉 **ORDER CONFIRMED!** 🎉\n\n**Order ID:** ${orderId}\n\n**Items Ordered:**\n\n`;
      session.cart.forEach(item => {
        confirmation += `• ${item.quantity}x ${item.name}\n   ₹${item.price.toFixed(2)} each = ₹${item.total.toFixed(2)}\n\n`;
      });
      confirmation += `**Total Amount:** ₹${roundedTotal.toFixed(2)}\n\n**Payment Method:** UPI\n**Transaction ID:** ${paymentId}\n**SabAI Gems Earned:** +${sabaiGems} 🪙\n\n**Estimated Delivery:** 45 minutes\n\nYou can track this order in the My Orders section!`;

      return res.json({
        success: true,
        data: {
          response: confirmation,
          orderId,
          order,
          requiresAction: "complete",
        },
      });
    } catch (error) {
      console.error("❌ Confirm payment error:", error);
      return res.json({
        success: true,
        data: {
          response: "Payment was successful but order confirmation failed. Please check My Orders.",
          requiresAction: "retry",
        },
      });
    }
  }

  async processReservePayment(req, res) {
    try {
      const { sessionId } = req.body;
      const userId = req.user?.id ? String(req.user.id) : "4";
      let session = await this.getOrCreateSession(userId, sessionId);
      if (!session || session.cart.length === 0) {
        return res.json({
          success: true,
          data: {
            response: "Your cart is empty. Please add items first.",
            requiresAction: "specify_items",
          },
        });
      }

      const roundedTotal = Math.round(session.total * 100) / 100;
      const merchant = session.merchant;
      const reserveCheck = await this.checkReservePayEligibility(userId, merchant, roundedTotal);
      if (!reserveCheck.eligible) {
        return res.json({
          success: true,
          data: {
            response: `❌ **Reserve Pay Declined**\n\n${reserveCheck.message}\n\nPlease use UPI payment instead.`,
            requiresAction: "payment_selection",
          },
        });
      }

      const sabaiGems = this.calculateSabaiGems(roundedTotal);
      await this.updateUserReserveLimit(userId, reserveCheck.merchant || merchant, roundedTotal);
      const orderId = "ORD" + Date.now();
      const now = new Date();
      const deliveryTime = new Date(now.getTime() + 45 * 60000);

      if (session.isScheduled && session.scheduledTime) {
        const scheduledOrder = await scheduledOrderService.scheduleOrder(
          userId,
          {
            sessionId: session.id,
            cart: session.cart,
            merchant: merchant,
            total: roundedTotal,
            paymentMethod: "reserve_pay",
          },
          session.scheduledTime,
          "reserve_pay"
        );
        await this.deleteSession(session.id);
        const scheduledDate = new Date(session.scheduledTime);
        return res.json({
          success: true,
          data: {
            response: `📅 **Order Scheduled!**\n\nYour order has been scheduled for ${scheduledDate.toLocaleString()}.\n\n**Order ID:** ${scheduledOrder.id}\n**Items:** ${session.cart.length} item(s)\n**Total:** ₹${roundedTotal}`,
            requiresAction: "complete",
            isScheduled: true,
            scheduledTime: session.scheduledTime,
          },
        });
      }

      const tracking = [
        { status: "confirmed", label: "Order Confirmed", completed: true, time: now.toLocaleTimeString() },
        { status: "preparing", label: "Preparing", completed: false, estimatedTime: deliveryTime.toLocaleTimeString() },
        { status: "out_for_delivery", label: "Out for Delivery", completed: false },
        { status: "delivered", label: "Delivered", completed: false },
      ];

      const order = {
        id: orderId,
        userId: session.userId,
        merchant: session.merchant,
        merchantName: session.merchantInfo?.name || session.merchant,
        items: session.cart,
        totalAmount: roundedTotal,
        status: "confirmed",
        paymentMethod: "Reserve Pay",
        sabaiGems: sabaiGems,
        estimatedDelivery: "45 minutes",
        estimatedDeliveryTime: deliveryTime.toLocaleTimeString(),
        createdAt: now.toISOString(),
        tracking,
      };

      await orderService.saveOrder(session.userId, order);
      await dbService.createTransaction({
        transaction_id: `TXN_${orderId}`,
        user_id: userId,
        type: "reserve_pay",
        amount: roundedTotal,
        status: "success",
        description: `Order payment to ${order.merchantName}`,
        merchant: merchant,
        reserve_used: roundedTotal,
        cashback_earned: sabaiGems,
      });

      await this.deleteSession(session.id);

      let confirmation = `🎉 **ORDER CONFIRMED!** 🎉\n\n**Order ID:** ${orderId}\n\n**Items Ordered:**\n\n`;
      session.cart.forEach(item => {
        confirmation += `• ${item.quantity}x ${item.name}\n   ₹${item.price.toFixed(2)} each = ₹${item.total.toFixed(2)}\n\n`;
      });
      confirmation += `**Total Amount:** ₹${roundedTotal.toFixed(2)}\n\n**Payment Method:** Reserve Pay\n\n**SabAI Gems Earned:** +${sabaiGems} 🪙\n\n**Estimated Delivery:** 45 minutes\n\nYou can track this order in the My Orders section!`;

      return res.json({
        success: true,
        data: {
          response: confirmation,
          orderId,
          order,
          requiresAction: "complete",
        },
      });
    } catch (error) {
      console.error("❌ Reserve Pay error:", error);
      res.json({
        success: true,
        data: {
          response: "Reserve Pay failed. Please try UPI payment.",
          requiresAction: "payment_selection",
        },
      });
    }
  }

  // ============================================
  // AUTO-PAY SETUP
  // ============================================
  async confirmAutoPaySetup(req, res) {
    try {
      const { sessionId, schedule, dayOfMonth, bankAccountId, scheduledTime } = req.body;
      const userId = req.user?.id ? String(req.user.id) : "4";
      let session = await this.getOrCreateSession(userId, sessionId);
      if (!session || session.cart.length === 0) {
        return res.json({
          success: true,
          data: {
            response: "Your cart is empty. Please add items first.",
            requiresAction: "specify_items",
          },
        });
      }

      if (scheduledTime) {
        session.isScheduled = true;
        session.scheduledTime = scheduledTime;
        await this.saveSession(session);
        return await this.processReservePayment({ body: { sessionId }, user: { id: userId } }, res);
      }

      const bankAccounts = await dbService.getBankAccounts(userId);
      const selectedBank = bankAccounts.find(b => b.id === bankAccountId);
      if (!selectedBank) {
        return res.json({
          success: true,
          data: {
            response: "Selected bank account not found. Please add a bank account in Settings first.",
            requiresAction: "add_bank_account",
          },
        });
      }

      const nextExecution = this.calculateNextExecution(schedule || "monthly", dayOfMonth || new Date().getDate());
      const autoPayOrder = {
        orderId: `AP_${Date.now()}`,
        type: "merchant",
        merchant: session.merchant,
        merchantName: session.merchantInfo?.name || session.merchant,
        amount: session.total,
        schedule: schedule || "monthly",
        dateValue: dayOfMonth || new Date().getDate(),
        time: "09:00",
        paymentMethod: "bank",
        bankAccountId: bankAccountId,
        bankName: selectedBank.bank_name,
        bankAccountLast4: selectedBank.account_number?.slice(-4) || "****",
        status: "active",
        nextExecution: nextExecution,
        reminderDays: 3,
      };

      await dbService.createAutoPayOrder(userId, autoPayOrder);
      await this.deleteSession(session.id);

      const nextDate = new Date(nextExecution);
      return res.json({
        success: true,
        data: {
          response: {
            type: "auto_pay_confirmed",
            title: "Auto-Pay Order Confirmed! 🎉",
            message: `Your recurring order for ${session.cart.length} item(s) from ${session.merchantInfo?.name || session.merchant} has been set up.`,
            items: session.cart,
            total: session.total,
            schedule: `Every month on day ${dayOfMonth || new Date().getDate()}`,
            nextPayment: nextDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
            autoPayId: autoPayOrder.orderId,
          },
          requiresAction: "complete",
        },
      });
    } catch (error) {
      console.error("Auto-Pay setup error:", error);
      return res.json({
        success: true,
        data: {
          response: "Failed to set up Auto-Pay. Please try again.",
          requiresAction: "retry",
        },
      });
    }
  }

  calculateNextExecution(schedule, dayOfMonth) {
    const today = new Date();
    let nextDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    if (nextDate <= today) {
      nextDate = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
    }
    nextDate.setHours(9, 0, 0, 0);
    return nextDate.toISOString();
  }

  // ============================================
  // ORDER FETCHING
  // ============================================
  async getUserOrders(req, res) {
    try {
      const userId = String(req.user.id);
      let orders = (await orderService.getUserOrders(userId)) || [];
      let scheduled = (await dbService.getScheduledOrders(userId)) || [];
      const allOrders = [...orders, ...scheduled];
      allOrders.sort((a, b) => new Date(b.createdAt || b.scheduledTime) - new Date(a.createdAt || a.scheduledTime));
      return res.status(200).json({ success: true, data: allOrders });
    } catch (error) {
      console.error("❌ Get orders error:", error);
      return res.status(200).json({ success: true, data: [] });
    }
  }

  async getOrder(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;
      let order = await orderService.getOrder(orderId, userId);
      if (!order) {
        const scheduled = await dbService.getScheduledOrders(userId);
        order = scheduled.find(o => o.id === orderId);
      }
      if (!order) return res.status(404).json({ success: false, error: "Order not found" });
      const now = Date.now();
      const created = new Date(order.createdAt || order.scheduledTime).getTime();
      const elapsed = now - created;
      const deliveryMs = 45 * 60 * 1000;
      if (elapsed >= deliveryMs) order.status = "delivered";
      else if (elapsed >= deliveryMs * 0.66) order.status = "out_for_delivery";
      else if (elapsed >= deliveryMs * 0.33) order.status = "preparing";
      else order.status = "confirmed";
      res.json({ success: true, data: order });
    } catch (error) {
      console.error("❌ Get order error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;
      let order = await orderService.getOrder(orderId, userId);
      if (!order) return res.status(404).json({ success: false, error: "Order not found" });
      res.json({
        success: true,
        data: {
          status: order.status || "confirmed",
          tracking: order.tracking || [],
          estimatedDelivery: order.estimatedDelivery || "45 minutes",
        },
      });
    } catch (error) {
      console.error("❌ Status error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ============================================
  // RESERVE LIMITS
  // ============================================
  async checkReservePayLimit(req, res) {
    try {
      const { merchant, amount } = req.body;
      const userId = req.user?.id ? String(req.user.id) : "4";
      const result = await this.checkReservePayEligibility(userId, merchant, amount);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Reserve check error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getReserveLimits(req, res) {
    try {
      const userId = req.user?.id ? String(req.user.id) : "4";
      const limits = await dbService.getReserveLimits(userId);
      res.json({ success: true, data: limits });
    } catch (error) {
      console.error("Get limits error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async syncReserveLimits(req, res) {
    try {
      const userId = req.user?.id ? String(req.user.id) : "4";
      const { limits } = req.body;
      for (const limit of limits) {
        await dbService.createOrUpdateReserveLimit(userId, limit.merchant, {
          merchant_name: limit.merchant_name,
          merchant_category: limit.merchant_category,
          monthly_limit: limit.monthly_limit,
          per_transaction_limit: limit.per_transaction_limit,
          requires_approval: limit.requires_approval || false,
          is_active: limit.is_active !== false,
          contributions: limit.contributions || [],
        });
      }
      res.json({ success: true, message: "Limits synced successfully" });
    } catch (error) {
      console.error("Sync limits error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateReserveLimits(req, res) {
    try {
      const userId = req.user?.id ? String(req.user.id) : "4";
      const { merchant, updates } = req.body;
      await dbService.createOrUpdateReserveLimit(userId, merchant, updates);
      res.json({ success: true, message: "Limit updated successfully" });
    } catch (error) {
      console.error("Update limits error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ============================================
  // RAZORPAY ORDER
  // ============================================
  async createRazorpayOrder(req, res) {
    try {
      const { amount } = req.body;
      const razorpayOrder = await paymentService.createOrder(amount, "INR", `order_${Date.now()}`);
      if (!razorpayOrder.success) {
        return res.status(503).json({
          success: false,
          message: razorpayOrder.error || "Payment provider is unavailable",
        });
      }
      res.json({ success: true, data: { razorpayOrder: razorpayOrder.order } });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ============================================
  // MERCHANT CONNECTIONS
  // ============================================
  async checkMerchantConnection(req, res) {
    try {
      const userId = req.user?.id ? String(req.user.id) : "4";
      const { merchantId } = req.params;
      const isConnected = await merchantConnectionService.isConnected(userId, merchantId);
      return res.json({ success: true, data: { connected: isConnected, merchantId } });
    } catch (error) {
      console.error("❌ Connection check error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getConnectedMerchants(req, res) {
    try {
      const userId = req.user?.id ? String(req.user.id) : "4";
      const connections = await merchantConnectionService.getConnectedMerchants(userId);
      return res.json({ success: true, data: connections });
    } catch (error) {
      console.error("❌ Get connections error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AgentOrderController();