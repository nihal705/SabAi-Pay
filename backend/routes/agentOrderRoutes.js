// backend/routes/agentOrderRoutes.js
const express = require("express");
const router = express.Router();
const agentOrderController = require("../controllers/agentOrderController");
const orchestratorService = require("../services/orchestratorService");
const orderAgent = require("../agents/orderAgent");
const dbService = require("../services/databaseService");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

// ============================================
// SELECT RESTAURANT
// ============================================
router.post("/select-restaurant", async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, restaurantId, restaurantName, merchant } = req.body;

    const result = await orchestratorService.handleFunctionCall(userId, 'get_menu', {
      merchant: merchant || 'swiggy',
      restaurantId: restaurantId
    });

    res.json({
      success: true,
      data: {
        response: result,
        sessionId: sessionId,
        requiresAction: result.requiresAction || false,
        merchant: merchant || 'swiggy'
      }
    });
  } catch (error) {
    console.error("Select restaurant error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SELECT ITEMS (ADD TO CART)
// ============================================
router.post("/select-items", async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.body.sessionId;
    const selectedItems = req.body.selectedItems || req.body.items;

    if (!sessionId || !selectedItems || !Array.isArray(selectedItems)) {
      return res.status(400).json({ success: false, error: "sessionId and selectedItems array required" });
    }

    const orchestratorService = require("../services/orchestratorService");
    const result = await orchestratorService.handleFunctionCall(userId, 'add_to_cart', {
      sessionId: sessionId,
      items: selectedItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        imageUrl: item.imageUrl,
        category: item.category,
        restaurantName: item.restaurantName,
        restaurantId: item.restaurantId,
        isVeg: item.isVeg || false
      }))
    });

    if (result && (result.success || result.status === "ready" || result.cart)) {
      res.json({
        success: true,
        data: {
          response: result.message || "Items added to cart",
          cart: result.cart || selectedItems,
          total: result.total || 0,
          subtotal: result.subtotal || result.total || 0,
          tax: result.tax || 0,
          sessionId: sessionId,
          requiresAction: true,
          merchant: result.merchant || null
        }
      });
    } else {
      res.status(500).json({ success: false, error: result?.error || "Failed to add items" });
    }
  } catch (error) {
    console.error("Select items error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// ============================================
// REMOVE FROM CART
// ============================================
router.post("/remove-from-cart", async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, itemId } = req.body;
    
    let session = sessionId ? await dbService.getOrderSession(sessionId).catch(() => null) : null;
    if (!session) {
      return res.json({
        success: true,
        data: { cart: [], total: 0, subtotal: 0, tax: 0 }
      });
    }

    let cart = [];
    if (session.cart) {
      try {
        cart = typeof session.cart === "string" ? JSON.parse(session.cart) : session.cart;
      } catch (e) {
        cart = [];
      }
    }
    cart = cart.filter(item => item.id !== itemId && item.name !== itemId);
    const subtotal = cart.reduce((sum, i) => sum + (Number(i.price || 0) * (i.quantity || 1)), 0);
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;

    await dbService.saveOrderSession({
      ...session,
      cart: JSON.stringify(cart),
      subtotal,
      tax,
      total
    }).catch(() => null);

    res.json({
      success: true,
      data: { cart, total, subtotal, tax }
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.json({ success: true, data: { cart: [], total: 0, subtotal: 0, tax: 0 } });
  }
});

// ============================================
// UPDATE CART QUANTITY
// ============================================
router.post("/update-cart-quantity", async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, itemId, quantity } = req.body;

    let session = sessionId ? await dbService.getOrderSession(sessionId).catch(() => null) : null;
    if (!session) {
      return res.json({
        success: true,
        data: { cart: [], total: 0, subtotal: 0, tax: 0 }
      });
    }

    let cart = [];
    if (session.cart) {
      try {
        cart = typeof session.cart === "string" ? JSON.parse(session.cart) : session.cart;
      } catch (e) {
        cart = [];
      }
    }

    const index = cart.findIndex(item => item.id === itemId || item.name === itemId);
    if (index !== -1) {
      if (quantity <= 0) {
        cart.splice(index, 1);
      } else {
        cart[index].quantity = quantity;
        cart[index].total = Number(cart[index].price || 0) * quantity;
      }
    }

    const subtotal = cart.reduce((sum, i) => sum + (Number(i.price || 0) * (i.quantity || 1)), 0);
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;

    await dbService.saveOrderSession({
      ...session,
      cart: JSON.stringify(cart),
      subtotal,
      tax,
      total
    }).catch(() => null);

    res.json({
      success: true,
      data: { cart, total, subtotal, tax }
    });
  } catch (error) {
    console.error("Update cart quantity error:", error);
    res.json({ success: true, data: { cart: [], total: 0, subtotal: 0, tax: 0 } });
  }
});

// ============================================
// PAYMENT EXECUTION
// ============================================
router.post("/process-reserve", agentOrderController.processReservePayment.bind(agentOrderController));
router.post("/confirm-upi", agentOrderController.confirmUPIPayment.bind(agentOrderController));

// ============================================
// AUTO-PAY
// ============================================
router.post("/auto-pay/setup", agentOrderController.confirmAutoPaySetup.bind(agentOrderController));

// ============================================
// ORDERS
// ============================================
router.get("/orders", agentOrderController.getUserOrders.bind(agentOrderController));
router.post("/scheduled-orders/:orderId/cancel", agentOrderController.cancelScheduledOrder.bind(agentOrderController));
router.post("/scheduled-orders/:orderId/checkout", agentOrderController.createScheduledOrderCheckout.bind(agentOrderController));
router.post("/scheduled-orders/:orderId/verify-payment", agentOrderController.verifyScheduledOrderPayment.bind(agentOrderController));
router.get("/order/:orderId", agentOrderController.getOrder.bind(agentOrderController));
router.get("/status/:orderId", agentOrderController.getOrderStatus.bind(agentOrderController));

// ============================================
// RESERVE LIMITS
// ============================================
router.get("/reserve-limits", agentOrderController.getReserveLimits.bind(agentOrderController));
router.post("/sync-reserve-limits", agentOrderController.syncReserveLimits.bind(agentOrderController));
router.post("/check-reserve", agentOrderController.checkReservePayLimit.bind(agentOrderController));

// ============================================
// MERCHANT CONNECTIONS
// ============================================
router.get("/connected-merchants", agentOrderController.getConnectedMerchants.bind(agentOrderController));
router.get("/check-connection/:merchantId", agentOrderController.checkMerchantConnection.bind(agentOrderController));

// ============================================
// RAZORPAY ORDER
// ============================================
router.post("/create-order", agentOrderController.createRazorpayOrder.bind(agentOrderController));

// ============================================
// SCHEDULE ORDER
// ============================================
router.post("/schedule-order", async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, scheduledTime } = req.body;
    // Update session with scheduled time
    const session = await dbService.getOrderSession(sessionId);
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });
    await dbService.saveOrderSession({
      ...session,
      is_scheduled: 1,
      scheduled_time: scheduledTime
    });
    res.json({ success: true, message: "Order scheduled" });
  } catch (error) {
    console.error("Schedule order error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET SESSION
// ============================================
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await dbService.getOrderSession(sessionId);
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });
    res.json({
      success: true,
      data: {
        sessionId: session.session_id,
        merchant: session.merchant,
        merchantInfo: session.merchant_info,
        cart: session.cart ? JSON.parse(session.cart) : [],
        total: session.total,
        subtotal: session.subtotal,
        tax: session.tax
      }
    });
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;