// backend/agents/orderAgent.js

const merchantDataService = require("../services/merchantDataService");
const merchantConnectionService = require("../services/merchantConnectionService");
const dbService = require("../services/databaseService");

class OrderAgent {
  // ============================================
  // FIND RESTAURANTS – uses saved location from DB
  // ============================================
  async findRestaurants(userId, merchant, location, cuisine) {
    // 1. Check if merchant is connected
    const isConnected = await merchantConnectionService.isConnected(userId, merchant);
    if (!isConnected) {
      return {
        error: `Please connect your ${merchant} account first.`,
        status: "failed",
        requiresAction: "connect_merchant",
        merchant: merchant,
        message: `🔗 **${merchant} is not connected.**\n\nPlease go to **Dashboard → Connect Apps** and connect your ${merchant} account first. Then I can help you order!`
      };
    }

    // 2. ALWAYS get saved location from merchant connection (ignore user input)
    const connection = await dbService.getMerchantConnection(userId, merchant);
    const userLocation = connection?.location_city || location;

    if (!userLocation) {
      return {
        error: "No location found for this merchant.",
        status: "failed",
        requiresAction: "set_location",
        merchant: merchant,
        message: `📍 **Location not set for ${merchant}.**\n\nPlease go to **Dashboard → Connect Apps** and set your delivery address for ${merchant}.`
      };
    }

    // 3. Fetch restaurants using SAVED location
    const data = await merchantDataService.getMerchantData(merchant, userLocation, null, null, { cuisine });
    if (data.type === "restaurants_list" && data.restaurants && data.restaurants.length > 0) {
      return {
        type: "restaurants_list",
        merchant,
        restaurants: data.restaurants,
        location: userLocation,
        requiresAction: "select_restaurant",
        message: `Here are some restaurants near you on ${merchant}:`,
      };
    }

    return {
      error: "No restaurants found in your area.",
      status: "failed",
      message: `I couldn't find any restaurants on ${merchant} in ${userLocation}. Please try another city or check your location.`
    };
  }

  // ============================================
  // GET MENU
  // ============================================
  async getMenu(userId, merchant, restaurantId) {
    const isConnected = await merchantConnectionService.isConnected(userId, merchant);
    if (!isConnected) {
      return {
        error: `Please connect your ${merchant} account first.`,
        status: "failed",
        requiresAction: "connect_merchant",
        merchant: merchant,
        message: `🔗 **${merchant} is not connected.**\n\nPlease go to **Dashboard → Connect Apps** and connect your ${merchant} account first.`
      };
    }

    const menu = await merchantDataService.getRestaurantMenu(merchant, null, restaurantId);
    if (menu && menu.length) {
      return {
        type: "products_grid",
        merchant,
        products: menu,
        restaurantId,
        requiresAction: "select_items_grid",
        message: `Here's the menu for this restaurant:`,
      };
    }
    return {
      error: "Menu not found.",
      status: "failed",
      message: `I couldn't find the menu for that restaurant on ${merchant}.`
    };
  }

  // ============================================
  // ADD TO CART
  // ============================================
async addToCart(userId, sessionId, items) {
  if (!Array.isArray(items)) {
    items = [items];
  }

  const session = await dbService.getOrderSession(sessionId);
  if (!session) return { error: "Session not found", status: "failed" };

  let cart = session.cart ? JSON.parse(session.cart) : [];

  for (const item of items) {
    const existingIndex = cart.findIndex(i => i.id === item.id);
    if (existingIndex !== -1) {
      cart[existingIndex].quantity += item.quantity || 1;
      cart[existingIndex].total = cart[existingIndex].price * cart[existingIndex].quantity;
    } else {
      cart.push({
        id: item.id || `item_${Date.now()}_${Math.random()}`,
        name: item.name || 'Item',
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        total: (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1),
        imageUrl: item.imageUrl || '/images/items/default.png',
        category: item.category || 'General',
        restaurantName: item.restaurantName || '',
        restaurantId: item.restaurantId || '',
        isVeg: item.isVeg || false,
        merchant: session.merchant || ''
      });
    }
  }

  const subtotal = cart.reduce((sum, i) => sum + (i.total || 0), 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  await dbService.saveOrderSession({
    ...session,
    cart: JSON.stringify(cart),
    subtotal,
    tax,
    total,
    step: "payment_selection",
  });

  return {
    success: true,
    cart,
    subtotal,
    tax,
    total,
    merchant: session.merchant,
    message: `✅ Added ${items.length} item(s) to your cart!`,
  };
}

  // ============================================
  // CHECKOUT
  // ============================================
  async checkout(userId, sessionId, paymentMethod) {
  const session = await dbService.getOrderSession(sessionId);
  if (!session) return { error: "Session not found", status: "failed" };

  const cart = JSON.parse(session.cart);
  if (!cart || cart.length === 0) {
    return { error: "Cart is empty", status: "failed", message: "Your cart is empty." };
  }

  const total = session.total;
  const merchant = session.merchant;

  // If paymentMethod is 'reserve', check limit
  let reserveCheck = null;
  if (paymentMethod === "reserve") {
    reserveCheck = await this.checkReservePayEligibility(userId, merchant, total);
    if (!reserveCheck.eligible) {
      return {
        error: "Insufficient Reserve Pay limit",
        status: "failed",
        message: `❌ Reserve Pay limit insufficient. Remaining: ₹${reserveCheck.remaining}.`
      };
    }
  }

  // Generate order ID
  const orderId = `ORD${Date.now()}`;

  // Save order to database
  const order = {
    order_id: orderId,
    user_id: userId,
    merchant: merchant,
    merchant_name: merchant,
    items: cart,
    total_amount: total,
    payment_method: paymentMethod || "upi",
    sabai_gems: Math.min(Math.floor(total * 0.05), 100),
    status: "confirmed",
    estimated_delivery: "45 minutes",
    tracking: [
      { status: "confirmed", label: "Order Confirmed", completed: true, time: new Date().toISOString() },
      { status: "preparing", label: "Preparing", completed: false },
      { status: "out_for_delivery", label: "Out for Delivery", completed: false },
      { status: "delivered", label: "Delivered", completed: false }
    ]
  };
  await dbService.createAgentOrder(userId, order);

  // If Reserve Pay, deduct from limit
  if (paymentMethod === "reserve" && reserveCheck) {
    await dbService.updateReserveLimitSpent(userId, merchant, total);
  }

  // Create transaction record
  await dbService.createTransaction({
    transaction_id: `TXN${Date.now()}`,
    user_id: userId,
    type: "merchant_order",
    amount: total,
    status: "success",
    description: `Order payment to ${merchant}`,
    merchant: merchant,
    reserve_used: paymentMethod === "reserve" ? total : 0,
    bank_used: paymentMethod === "upi" ? total : 0,
    cashback_earned: order.sabai_gems
  });

  // Return order summary with details
  return {
    type: "order_confirmed",
    orderId: orderId,
    merchant: merchant,
    items: cart,
    total: total,
    payment_method: paymentMethod,
    sabai_gems: order.sabai_gems,
    estimated_delivery: "45 minutes",
    tracking: order.tracking,
    message: this.buildConfirmationMessage(order, paymentMethod)
  };
}

buildConfirmationMessage(order, paymentMethod) {
  const paymentDisplay = paymentMethod === "reserve" ? "Reserve Pay" : "UPI";
  let msg = `🎉 **ORDER CONFIRMED!** 🎉\n\n`;
  msg += `**Order ID:** ${order.order_id}\n\n`;
  msg += `**Items Ordered:**\n\n`;
  order.items.forEach(item => {
    msg += `• ${item.quantity}x ${item.name}\n`;
    msg += `   ₹${item.price.toFixed(2)} each = ₹${(item.price * item.quantity).toFixed(2)}\n\n`;
  });
  msg += `**Total Amount:** ₹${order.total_amount.toFixed(2)}\n`;
  msg += `**Payment Method:** ${paymentDisplay}\n`;
  msg += `**SabAI Gems Earned:** +${order.sabai_gems} 🪙\n\n`;
  msg += `**Estimated Delivery:** ${order.estimated_delivery || '45 minutes'}\n\n`;
  msg += `📱 You can track this order in the My Orders section!`;
  return msg;
}

  // ============================================
  // CHECK RESERVE PAY ELIGIBILITY
  // ============================================
  async checkReservePayEligibility(userId, merchant, amount) {
    const dbService = require("../services/databaseService");
    const limit = await dbService.getReserveLimit(userId, merchant);
    if (!limit) return { eligible: false, remaining: 0, message: "No Reserve Pay limit set." };
    const remaining = limit.monthly_limit - (limit.current_spent || 0);
    return { eligible: amount <= remaining, remaining };
  }
}

module.exports = new OrderAgent();