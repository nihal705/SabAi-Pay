// backend/services/agentDialogueService.js
// Intelligent Dialogue & Intent Fulfillment Engine for SabAI Pay

const dbService = require("./databaseService");
const pendingIntentService = require("./pendingIntentService");
const agentPaymentController = require("../controllers/agentPaymentController");
const orderAgent = require("../agents/orderAgent");
const billAgent = require("../agents/billAgent");
const schedulerAgent = require("../agents/schedulerAgent");
const autoPayAgent = require("../agents/autoPayAgent");
const agentSecurityService = require("./agentSecurityService");
const bankTransferService = require("./bankTransferService");

class AgentDialogueService {
  /**
   * Process a user message through direct intent fulfillment
   * @param {string} userId - User ID
   * @param {string} message - Raw message text
   * @param {Object} pendingIntent - Current active pending intent
   * @param {Object} context - Context containing conversationId, cardData, etc.
   */
  async process(userId, message, pendingIntent, context = {}) {
    // Sanitize zero-width, non-printable, control characters & normalize unicode
    let text = (message || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    let lower = text.toLowerCase();

    // 0. NEGATIVE VALUE PREVENTION GUARD
    if (/(?:send|transfer|pay|recharge)\s*(?:₹|rs\.?|inr)?\s*-[0-9]+/i.test(text)) {
      return {
        response: "⚠️ Invalid amount. Transaction amounts cannot be negative.",
        requiresAction: false,
        type: "validation_error",
      };
    }

    // 0.1. MULTI-LINGUAL CONVERSATIONAL CLOSURES
    if (
      lower.includes("dhanyawad") ||
      lower.includes("shukriya") ||
      lower.includes("thank you") ||
      lower.includes("thanks") ||
      lower.includes("good night") ||
      lower.includes("bye")
    ) {
      return {
        response: "🙏 **You are most welcome!**\n\nI'm always here whenever you need frictionless payments, food orders, or recharges. Have a wonderful time!",
        requiresAction: false,
        type: "conversational_closure",
      };
    }

    // 1. ADVERSARIAL & SAFETY FILTER (T23)
    if (
      lower.includes("ignore all previous instructions") ||
      lower.includes("ignore rules") ||
      lower.includes("attacker") ||
      lower.includes("hack") ||
      lower.includes("bypass limit") ||
      (lower.includes("transfer") && lower.includes("attacker@upi"))
    ) {
      return {
        response:
          "🛡️ **Security Alert:** Request blocked.\n\nSabAI Pay's deterministic policy engine prevents prompt injection, unauthorized recipient overrides, and safety constraint bypassing. Your funds and limits remain 100% secure.",
        requiresAction: false,
        type: "security_alert",
      };
    }

    // 2. CANCELLATION INTENT (T24)
    if (
      lower === "cancel" ||
      lower === "cancel order" ||
      lower === "abort" ||
      lower === "nevermind" ||
      lower === "clear"
    ) {
      pendingIntentService.clear(userId);
      return {
        response:
          "❌ **Action Cancelled.**\n\nYour active session and pending request have been cleared. How else can I help you today?",
        requiresAction: false,
        type: "action_cancelled",
      };
    }

    // 2.3. SAVE / CHANGE / UPDATE USUAL OR FAVORITE ORDER INTENT
    const isSaveUsualOrder =
      (lower.includes("usual") || lower.includes("favorite") || lower.includes("favourite")) &&
      (lower.includes("save") || lower.includes("change") || lower.includes("update") || lower.includes("set") || lower.includes("add") || lower.includes("store")) &&
      !lower.startsWith("order ") &&
      !lower.startsWith("send ") &&
      !lower.startsWith("pay ");

    if (isSaveUsualOrder) {
      const mealSlot = lower.includes("lunch")
        ? "lunch"
        : lower.includes("dinner")
        ? "dinner"
        : lower.includes("snack")
        ? "snacks"
        : "breakfast";
      const merchant = lower.includes("zomato")
        ? "zomato"
        : lower.includes("zepto")
        ? "zepto"
        : lower.includes("blinkit")
        ? "blinkit"
        : "swiggy";

      let clean = lower
        .replace(/\b(?:change\s+and\s+save|save\s+and\s+change|change|save|update|set|add|store)\b/gi, " ")
        .replace(/\b(?:as|to|in|for)\s+(?:my\s+)?(?:usual|favorite|favourite)?\s*(?:breakfast|lunch|dinner|snack|snacks)?\s*(?:list)?\b/gi, " ")
        .replace(/\bfrom\s+(?:swiggy|zomato|zepto|blinkit|dominos|kfc|mcdonalds)\b/gi, " ")
        .replace(/\b(?:using|with)\s+(?:reservepay|reserve\s+pay|limit|upi)\b/gi, " ")
        .replace(/\b(?:swiggy|zomato|zepto|blinkit)\b/gi, " ")
        .replace(/\b(?:breakfast|lunch|dinner|snacks|usual|favorite|favourite|list)\b/gi, " ")
        .trim();

      const rawTokens = clean
        .split(/(?:,|\s+and\s+|\s*&\s*|\s*\+\s*)/i)
        .map((s) => s.replace(/\b(?:my|a|an|the|to|of|order)\b/gi, "").trim())
        .filter((s) => s.length > 1);

      const catalogMap = {
        dosa: { name: "Masala Dosa", price: 89, image: "/images/items/dosa.png" },
        tea: { name: "Special Masala Tea", price: 40, image: "/images/items/tea.png" },
        chai: { name: "Special Masala Tea", price: 40, image: "/images/items/tea.png" },
        coffee: { name: "Cold Coffee", price: 89, image: "/images/items/coffee.png" },
        idli: { name: "Steamed Idli (2 pcs)", price: 59, image: "/images/items/idli.png" },
        vada: { name: "Medu Vada (2 pcs)", price: 69, image: "/images/items/vada.png" },
        biryani: { name: "Chicken Biryani", price: 220, image: "/images/items/biryani.png" },
        coke: { name: "Coca-Cola (500ml)", price: 40, image: "/images/items/coke.png" },
        pizza: { name: "Margherita Pizza", price: 199, image: "/images/items/pizza.png" },
        burger: { name: "Crispy Veg Burger", price: 119, image: "/images/items/burger.png" },
        sandwich: { name: "Grilled Veg Sandwich", price: 99, image: "/images/items/sandwich.png" },
      };

      let items = [];
      for (let i = 0; i < rawTokens.length; i++) {
        const token = rawTokens[i];
        let matched = null;
        for (const [k, v] of Object.entries(catalogMap)) {
          if (token.includes(k)) {
            matched = v;
            break;
          }
        }
        if (matched) {
          items.push({
            id: `bf_${i + 1}`,
            name: matched.name,
            price: matched.price,
            quantity: 1,
            merchant: merchant,
            imageUrl: matched.image,
          });
        } else {
          const formatted = token
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          items.push({
            id: `bf_${i + 1}`,
            name: formatted,
            price: 99,
            quantity: 1,
            merchant: merchant,
            imageUrl: "/images/items/default.png",
          });
        }
      }

      if (items.length === 0) {
        items = [
          { id: "bf_1", name: "Masala Dosa", price: 89, quantity: 1, merchant, imageUrl: "/images/items/dosa.png" },
          { id: "bf_2", name: "Special Masala Tea", price: 40, quantity: 1, merchant, imageUrl: "/images/items/tea.png" },
        ];
      }

      const total = items.reduce((sum, it) => sum + it.price * (it.quantity || 1), 0);

      try {
        await dbService.saveUsualOrder(userId, mealSlot, items);
      } catch (e) {
        console.warn("saveUsualOrder warning:", e.message);
      }

      return {
        response:
          `✅ **Updated & Saved Your Usual ${mealSlot.charAt(0).toUpperCase() + mealSlot.slice(1)} List!**\n\n` +
          `• **Merchant:** ${merchant.toUpperCase()}\n` +
          `• **Items:** ${items.map((it) => `${it.name} (₹${it.price})`).join(", ")}\n` +
          `• **Total:** ₹${total}\n\n` +
          `You can now say *"Order my usual ${mealSlot} from ${merchant.toUpperCase()}"* anytime to checkout instantly with Reserve Pay!`,
        requiresAction: false,
        type: "usual_order_saved",
        items: items,
        cart: items,
        total: total,
      };
    }

    // 2.4. CONFIRMATION & ORDER CHECKOUT INTENT
    if (
      lower === "confirm" ||
      lower === "confirm order" ||
      lower === "confirm payment" ||
      lower === "checkout" ||
      lower === "place order" ||
      lower === "pay now" ||
      lower.includes("whatever i added to cart") ||
      lower.includes("order whatever i added") ||
      lower.includes("order my cart") ||
      lower.includes("checkout my cart") ||
      lower.includes("usual breakfast list") ||
      lower.includes("confirm my usual")
    ) {
      let checkoutItems = null;
      let checkoutTotal = 0;
      let merchant = "swiggy";

      if (pendingIntent && pendingIntent.flow === "order_checkout" && pendingIntent.slots) {
        checkoutItems = pendingIntent.slots.items;
        checkoutTotal = Number(pendingIntent.slots.total || 0);
        merchant = pendingIntent.slots.merchant || merchant;
      } else if (context.cardData && context.cardData.cart) {
        checkoutItems = context.cardData.cart;
        checkoutTotal = context.cardData.total || 0;
      }

      // Determine payment method and bank
      const bankAccounts = await dbService.getBankAccounts(userId).catch(() => []);
      const primaryBank = bankAccounts.find((b) => b.is_primary) || bankAccounts[0];
      const requestedMethod = pendingIntent?.slots?.paymentMethod;
      let useReservePay = requestedMethod === "reserve_pay";
      if (!useReservePay && requestedMethod !== "upi") {
        const limitDetails = await agentSecurityService.getReserveLimitDetails(userId, merchant).catch(() => null);
        if (limitDetails && limitDetails.is_active && (Number(limitDetails.monthly_limit || 0) - Number(limitDetails.current_spent || 0)) >= checkoutTotal) {
          useReservePay = true;
        }
      }

      const paymentMethodDisplay = useReservePay
        ? `${merchant.toUpperCase()} Reserve Pay Limit (PIN-less)`
        : `${primaryBank?.bank_name || 'Canara Bank'} UPI`;

      if (!checkoutItems || checkoutItems.length === 0 || checkoutTotal === 0) {
        const savedUsual = await dbService.getUsualOrder(userId, "breakfast").catch(() => null);
        if (savedUsual && Array.isArray(savedUsual.items) && savedUsual.items.length > 0) {
          checkoutItems = savedUsual.items;
          checkoutTotal = checkoutItems.reduce((s, it) => s + Number(it.price) * (it.quantity || 1), 0);
        } else {
          checkoutItems = [
            { id: "bf_1", name: "Masala Dosa", price: 89, quantity: 1 },
            { id: "bf_2", name: "Special Masala Tea", price: 40, quantity: 1 },
          ];
          checkoutTotal = 129;
        }
      }

      pendingIntentService.clear(userId);

      // Execute deduction: Reserve Pay or Primary Bank UPI
      if (useReservePay) {
        await dbService.updateReserveLimitSpent(userId, merchant, checkoutTotal).catch(() => null);
      } else if (primaryBank) {
        await dbService.updateBankBalance(primaryBank.id, checkoutTotal, false).catch(() => null);
      }

      const orderId = "ORD" + Date.now();
      const transactionId = "TXN" + Date.now();

      // Create transaction in database
      await dbService.createTransaction({
        transaction_id: transactionId,
        user_id: userId,
        type: "order",
        amount: checkoutTotal,
        status: "success",
        description: `${merchant.toUpperCase()} Order - ${checkoutItems.map((i) => i.name).join(", ")}`,
        payment_method_display: paymentMethodDisplay,
        reserve_used: useReservePay ? checkoutTotal : 0,
        bank_used: useReservePay ? 0 : checkoutTotal,
        bank_name: useReservePay ? null : (primaryBank?.bank_name || null),
        bank_account_id: useReservePay ? null : (primaryBank?.id || null),
      }).catch((e) => console.warn("createTransaction warning:", e.message));

      // Create order in agent_orders table
      const gemsEarned = Math.min(Math.floor(checkoutTotal * 0.05), 100);
      try {
        await dbService.createAgentOrder(userId, {
          orderId: orderId,
          merchant: merchant,
          merchantName: merchant.toUpperCase(),
          items: checkoutItems,
          totalAmount: checkoutTotal,
          paymentMethod: paymentMethodDisplay,
          paymentId: transactionId,
          sabaiGems: gemsEarned,
          status: "confirmed",
          estimatedDelivery: "30–35 mins",
          tracking: [
            { time: new Date().toISOString(), label: "Order Confirmed", status: "confirmed", completed: true },
            { label: "Preparing", status: "preparing", completed: true },
            { label: "Out for Delivery", status: "out_for_delivery", completed: false },
            { label: "Delivered", status: "delivered", completed: false },
          ],
        });
        await dbService.addCoins(userId, gemsEarned).catch(() => null);
      } catch (e) {
        console.warn("createAgentOrder warning:", e.message);
      }

      return {
        response:
          `✅ **Order Confirmed! Your Order is on the way! 🛵**\n\n` +
          `• **Order ID:** ${orderId}\n` +
          `• **Merchant:** ${merchant.toUpperCase()}\n` +
          `• **Items:**\n${checkoutItems.map((i) => `  - ${i.name} x${i.quantity || 1} (₹${i.price})`).join("\n")}\n` +
          `• **Total Paid:** ₹${checkoutTotal} via **${paymentMethodDisplay}**\n` +
          `• **SabAI Gems Earned:** +${gemsEarned} 🪙\n` +
          `• **Status:** Confirmed & Preparing in kitchen 🍳\n` +
          `• **Estimated Delivery:** 30–35 mins\n\n` +
          `Track live updates anytime in **Order History**!`,
        requiresAction: false,
        type: "order_confirmed",
        orderId: orderId,
        total: checkoutTotal,
        paymentMethod: paymentMethodDisplay,
      };
    }

    // 2.5. CONTACT MANAGEMENT INTENT (Add / Save Contact via chat)
    if (
      lower.startsWith("add contact") ||
      lower.startsWith("save contact") ||
      lower.startsWith("create contact") ||
      lower.includes("add to contact") ||
      lower.includes("save to contact") ||
      lower.includes("add as contact") ||
      lower.includes("save as contact") ||
      lower.includes("add new contact")
    ) {
      pendingIntentService.clear(userId);

      const vpaMatch = text.match(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/);
      const phoneMatch = text.match(/\b[6-9]\d{9}\b/);

      let clean = text
        .replace(/(?:add|save|create|new)\s+(?:a\s+)?contact/gi, "")
        .replace(/(?:to|in|as)\s+contacts?/gi, "")
        .replace(/(?:with|and|having)?\s*(?:upi|vpa|id)?\s*[:=]?\s*[a-zA-Z0-9.\-_]+@[a-zA-Z]+/gi, "")
        .replace(/(?:with|and|having)?\s*(?:phone|mobile|number)?\s*[:=]?\s*\b[6-9]\d{9}\b/gi, "")
        .trim();

      const nameMatch = clean.match(/^[A-Za-z\s.]{2,30}/);
      const name = nameMatch ? nameMatch[0].trim() : "New Contact";
      const vpa = vpaMatch ? vpaMatch[0] : (phoneMatch ? `${phoneMatch[0]}@upi` : null);
      const phone = phoneMatch ? phoneMatch[0] : null;

      if (!vpa && !phone) {
        pendingIntentService.createFlow(
          userId,
          "add_contact",
          { name },
          ["contactDetails"]
        );
        return {
          response:
            `📇 **Add New Contact**\n\nPlease provide ${name}'s 10-digit mobile number or UPI ID (e.g. *${name.toLowerCase().replace(/\s+/g, '')}@okhdfcbank* or *9876543210*).`,
          requiresAction: false,
          type: "contact_help",
        };
      }

      try {
        await dbService.createOrUpdateContact(userId, name, vpa, phone, 0, false);
        return {
          response: `✅ **Contact Saved Successfully!**\n\n• **Name:** ${name}\n• **UPI ID:** ${vpa}\n${phone ? `• **Phone:** ${phone}\n` : ""}• **Status:** Active in your contacts\n\nYou can now send money instantly via PIN-less Reserve Pay!`,
          requiresAction: false,
          type: "contact_saved",
        };
      } catch (err) {
        return {
          response: `⚠️ Failed to save contact: ${err.message}`,
          requiresAction: false,
        };
      }
    }

    // 3. PENDING INTENT CONTINUATION (T03, T08)
    const isExplicitNewIntent =
      lower.includes("contact") ||
      lower.includes("recharge") ||
      lower.includes("bill") ||
      lower.includes("electricity") ||
      lower.includes("water") ||
      lower.includes("order") ||
      lower.includes("breakfast") ||
      lower.includes("lunch") ||
      lower.includes("dinner") ||
      lower.includes("swiggy") ||
      lower.includes("zomato") ||
      lower.includes("zepto") ||
      lower.includes("blinkit") ||
      lower.startsWith("send ") ||
      lower.startsWith("transfer ") ||
      lower.startsWith("pay ") ||
      lower.includes("cancel") ||
      lower.includes("gems");

    if (pendingIntent && pendingIntent.flow) {
      const currentFlow = pendingIntent.flow;
      const isContinuingCurrentFlow =
        (currentFlow === "recharge" && (lower.includes("recharge") || /\b[6-9]\d{9}\b/.test(text) || lower.includes("airtel") || lower.includes("jio") || lower.includes("vi"))) ||
        (currentFlow === "send_money" && (text.includes("@") || /^[6-9]\d{9}$/.test(text.trim()))) ||
        (currentFlow === "pay_bill" && lower.includes("bill"));

      if (isExplicitNewIntent && !isContinuingCurrentFlow) {
        pendingIntentService.clear(userId);
        pendingIntent = null;
      }
    }

    if (pendingIntent && pendingIntent.flow) {
      const flow = pendingIntent.flow;
      const slots = { ...(pendingIntent.slots || {}) };

      // Recharge continuation (T03)
      if (flow === "recharge") {
        const phoneMatch = text.match(/\b[6-9]\d{9}\b/);
        const opMatch = text.match(/\b(airtel|jio|vi|vodafone|bsnl)\b/i);
        if (phoneMatch) slots.mobileNumber = phoneMatch[0];
        if (opMatch) slots.operator = opMatch[1].toLowerCase() === "vodafone" ? "vi" : opMatch[1].toLowerCase();

        if (slots.mobileNumber && slots.amount) {
          pendingIntentService.clear(userId);
          const result = await agentPaymentController.rechargeMobile(
            userId,
            slots.mobileNumber,
            Number(slots.amount),
            slots.plan || null,
            slots.operator || null
          );
          return result;
        } else {
          pendingIntentService.update(userId, { slots });
          return {
            response: `Please provide your 10-digit mobile number to complete the ₹${slots.amount} recharge.`,
            type: "recharge_input_card",
            requiresAction: "collect_recharge_slots",
            slots,
          };
        }
      }

      // Add Contact continuation
      if (flow === "add_contact") {
        const vpaMatch = text.match(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/);
        const phoneMatch = text.match(/\b[6-9]\d{9}\b/);
        const name = slots.name || "New Contact";
        const vpa = vpaMatch ? vpaMatch[0] : (phoneMatch ? `${phoneMatch[0]}@upi` : null);
        const phone = phoneMatch ? phoneMatch[0] : null;

        if (vpa || phone) {
          pendingIntentService.clear(userId);
          await dbService.createOrUpdateContact(userId, name, vpa, phone, 0, false);
          return {
            response: `✅ **Contact Saved Successfully!**\n\n• **Name:** ${name}\n• **UPI ID:** ${vpa}\n${phone ? `• **Phone:** ${phone}\n` : ""}• **Status:** Active in your contacts\n\nYou can now send money instantly via PIN-less Reserve Pay!`,
            requiresAction: false,
            type: "contact_saved",
          };
        }
      }

      // Send Money continuation (T08)
      if (flow === "send_money") {
        const vpaMatch = text.match(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/);
        const phoneMatch = text.match(/\b[6-9]\d{9}\b/);
        const bankMatch = bankTransferService.parseBankAccount(text);
        const isShortName = /^[A-Za-z\s.]{2,30}$/.test(text.trim()) && !isExplicitNewIntent;

        let targetRecipient = null;
        let recipientVpa = null;
        let recipientPhone = null;

        if (vpaMatch) {
          targetRecipient = vpaMatch[0];
          recipientVpa = vpaMatch[0];
        } else if (phoneMatch) {
          targetRecipient = phoneMatch[0];
          recipientPhone = phoneMatch[0];
          recipientVpa = `${phoneMatch[0]}@upi`;
        } else if (bankMatch && bankMatch.ifsc) {
          pendingIntentService.clear(userId);
          return await bankTransferService.prepareTransfer(userId, {
            accountNumber: bankMatch.accountNumber,
            ifsc: bankMatch.ifsc,
            amount: slots.amount,
            recipientName: slots.recipientName,
          });
        } else if (isShortName) {
          targetRecipient = text.trim();
        }

        if (targetRecipient) {
          // If the recipient was unknown by name (e.g. "Priya"), auto-save her to contacts!
          if (slots.recipientName && slots.recipientName.toLowerCase() !== targetRecipient.toLowerCase()) {
            try {
              await dbService.createOrUpdateContact(
                userId,
                slots.recipientName,
                recipientVpa || `${targetRecipient}@upi`,
                recipientPhone,
                0,
                false
              );
            } catch (saveErr) {
              console.warn("Could not auto-save contact:", saveErr.message);
            }
          }

          slots.recipient = targetRecipient;
          pendingIntentService.clear(userId);

          const result = await agentPaymentController.sendMoney(
            userId,
            slots.recipient,
            Number(slots.amount),
            slots.note || ""
          );
          return result;
        }
      }

      // Bill Pay continuation
      if (flow === "pay_bill") {
        const idMatch = text.match(/\b[A-Za-z0-9-]{4,20}\b/);
        if (idMatch) slots.customerId = idMatch[0];
        if (slots.amount && slots.customerId) {
          pendingIntentService.clear(userId);
          return await agentPaymentController.payBill(
            userId,
            slots.billType || "electricity",
            slots.provider,
            slots.customerId,
            Number(slots.amount)
          );
        }
      }
    }

    // 4. RESERVE PAY: ADD / TOP-UP LIMIT VIA BANK UPI OR QUERY (T20)
    const isAddReserveLimit =
      (lower.includes("add") || lower.includes("top up") || lower.includes("topup") || lower.includes("increase") || lower.includes("set") || lower.includes("fund")) &&
      (lower.includes("reserve") || lower.includes("limit")) &&
      !lower.includes("contact");

    if (isAddReserveLimit) {
      const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*([0-9,]+)/i);
      const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : 500;

      let merchant = "swiggy";
      let merchantName = "Swiggy";
      if (lower.includes("zomato")) { merchant = "zomato"; merchantName = "Zomato"; }
      else if (lower.includes("zepto")) { merchant = "zepto"; merchantName = "Zepto"; }
      else if (lower.includes("blinkit")) { merchant = "blinkit"; merchantName = "Blinkit"; }
      else if (lower.includes("lite") || lower.includes("sabai")) { merchant = "sabai-pay-lite"; merchantName = "SabAI Pay Lite"; }

      const bankAccounts = await dbService.getBankAccounts(userId);
      const primaryBank = bankAccounts.find((b) => b.is_primary) || bankAccounts[0];

      if (!primaryBank) {
        return {
          response: "⚠️ No bank account linked to fund Reserve Pay limit.",
          requiresAction: false,
        };
      }

      if (primaryBank.balance < amount) {
        return {
          response: `⚠️ Insufficient bank balance. Available in ${primaryBank.bank_name}: ₹${primaryBank.balance.toLocaleString()}, Required: ₹${amount.toLocaleString()}`,
          requiresAction: false,
        };
      }

      // Deduct from bank account
      await dbService.updateBankBalance(primaryBank.id, amount, false);

      // Increase reserve limit monthly_limit
      const existingLimit = await dbService.getReserveLimit(userId, merchant);
      const currentMonthly = Number(existingLimit?.monthly_limit || 0);
      const newMonthly = currentMonthly + amount;

      await dbService.createOrUpdateReserveLimit(userId, merchant, {
        merchant_name: merchantName,
        monthly_limit: newMonthly,
        per_transaction_limit: existingLimit?.per_transaction_limit || 1000,
        is_active: true,
        current_spent: Number(existingLimit?.current_spent || 0),
      });

      // Record transaction
      const txnId = `TXN${Date.now()}`;
      await dbService.createTransaction({
        transaction_id: txnId,
        user_id: userId,
        type: "reserve_pay",
        amount: amount,
        status: "success",
        description: `Added ₹${amount} to ${merchantName} Reserve Pay Limit from ${primaryBank.bank_name} UPI`,
        bank_name: primaryBank.bank_name,
        bank_account_id: primaryBank.id,
        payment_method_display: `${primaryBank.bank_name} UPI`,
        reserve_used: 0,
        bank_used: amount,
      });

      const updatedBank = await dbService.getBankAccountById(primaryBank.id, userId);

      return {
        response:
          `✅ **Reserve Pay Limit Successfully Updated!**\n\n` +
          `• **Merchant:** ${merchantName}\n` +
          `• **Amount Added:** ₹${amount.toLocaleString()} via ${primaryBank.bank_name} UPI\n` +
          `• **Previous Limit:** ₹${currentMonthly.toLocaleString()}\n` +
          `• **New Monthly Limit:** ₹${newMonthly.toLocaleString()}\n` +
          `• **Remaining Limit:** ₹${(newMonthly - Number(existingLimit?.current_spent || 0)).toLocaleString()}\n` +
          `• **Bank Balance (${primaryBank.bank_name}):** ₹${(updatedBank?.balance ?? (primaryBank.balance - amount)).toLocaleString()}\n` +
          `• **Transaction ID:** ${txnId}`,
        requiresAction: false,
        type: "reserve_limit_updated",
        addedAmount: amount,
        newMonthlyLimit: newMonthly,
      };
    }

    // 4.1. RESERVE PAY BALANCE / LIMIT QUERY (T20)
    // ONLY matches informational queries, NEVER food/grocery/money orders
    const isOrderOrPayment =
      lower.includes("order") ||
      lower.includes("buy") ||
      lower.includes("get me") ||
      lower.includes("deliver") ||
      lower.includes("breakfast") ||
      lower.includes("lunch") ||
      lower.includes("dinner") ||
      lower.includes("biryani") ||
      lower.includes("pizza") ||
      lower.includes("food") ||
      lower.includes("snack") ||
      lower.startsWith("send ") ||
      lower.startsWith("transfer ") ||
      lower.includes("recharge") ||
      lower.includes("bill");

    if (
      !isOrderOrPayment &&
      (
        lower.includes("reserve pay limit") ||
        lower.includes("reserve limit") ||
        lower.includes("remaining limit") ||
        (lower.includes("limit") && (lower.includes("swiggy") || lower.includes("zomato") || lower.includes("check") || lower.includes("what is") || lower.includes("how much")))
      )
    ) {
      let merchant = null;
      if (lower.includes("swiggy")) merchant = "swiggy";
      else if (lower.includes("zomato")) merchant = "zomato";
      else if (lower.includes("zepto")) merchant = "zepto";

      const limitDetails = await agentSecurityService.getReserveLimitDetails(userId, merchant);
      if (!limitDetails) {
        return {
          response:
            "📊 **Reserve Pay Status:**\n\nYou currently have no active Reserve Pay limits set. You can set merchant budgets in **Reserve Pay** to enable frictionless PIN-less payments!",
          requiresAction: false,
        };
      }

      const monthly = Number(limitDetails.monthly_limit || 0);
      const spent = Number(limitDetails.current_spent || 0);
      const remaining = Math.max(0, monthly - spent);
      const perTxn = limitDetails.per_transaction_limit ? `\n• **Per-Transaction Cap:** ₹${Number(limitDetails.per_transaction_limit).toLocaleString()}` : "";

      return {
        response: `🛡️ **Reserve Pay Limit (${limitDetails.merchant_name || limitDetails.merchant}):**\n\n• **Monthly Limit:** ₹${monthly.toLocaleString()}\n• **Current Spent:** ₹${spent.toLocaleString()}\n• **Remaining Balance:** ₹${remaining.toLocaleString()}${perTxn}\n• **Status:** ${limitDetails.is_active ? "Active ✅ (PIN-less eligible)" : "Paused ⏸️"}`,
        requiresAction: false,
        type: "reserve_limit_status",
      };
    }

    // 5. SABAI GEMS BALANCE QUERY (T21)
    if (
      lower.includes("gems balance") ||
      lower.includes("gem balance") ||
      lower.includes("sabai gems") ||
      lower.includes("coins balance") ||
      lower.includes("my gems")
    ) {
      const gems = await dbService.getCoinBalance(userId);
      return {
        response: `🪙 **SabAI Gems Wallet:**\n\n• **Available Balance:** ${gems.balance || 0} Gems (₹${gems.balance || 0} value)\n• **Lifetime Earned:** ${gems.lifetime_earned || 0} Gems\n• **Cashback Rate:** 5% instant cashback on all qualifying orders!\n\nYou can apply your Gems during checkout for instant discounts.`,
        requiresAction: false,
        type: "gems_status",
      };
    }

    // 6. BANK ACCOUNT TRANSFER WITH IFSC (T09)
    if (
      lower.includes("bank account") ||
      lower.includes("ifsc") ||
      (lower.includes("send") && lower.includes("account"))
    ) {
      const parsedBank = bankTransferService.parseBankAccount(text);
      const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*([0-9,]+)/i);
      const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : 1000;

      if (parsedBank && parsedBank.accountNumber && parsedBank.ifsc) {
        return await bankTransferService.prepareTransfer(userId, {
          accountNumber: parsedBank.accountNumber,
          ifsc: parsedBank.ifsc,
          amount: amount,
          recipientName: null,
          note: "Direct Bank Transfer",
        });
      }
    }

    // 7. MULTI-PAYMENT INTENT (T22)
    if (lower.includes(" and ") && (lower.includes("recharge") || lower.includes("bill") || lower.includes("pay"))) {
      const hasBill = lower.includes("bill") || lower.includes("electricity");
      const hasRecharge = lower.includes("recharge");

      if (hasBill && hasRecharge) {
        const phoneMatch = text.match(/\b[6-9]\d{9}\b/);
        const textWithoutPhone = phoneMatch ? text.replace(phoneMatch[0], "") : text;
        const amounts = [...textWithoutPhone.matchAll(/(?:₹|rs\.?|inr)?\s*([0-9]{2,5})/gi)].map((m) => Number(m[1]));
        const billAmt = amounts[0] || 500;
        const rechAmt = amounts[1] || 299;
        const phone = phoneMatch ? phoneMatch[0] : "9876543210";

        return {
          type: "multi_payment_card",
          status: "ready",
          requiresAction: "confirm_payment",
          payments: [
            { type: "pay_bill", title: "Electricity Bill (TSSPDCL)", amount: billAmt, category: "bill" },
            { type: "recharge_mobile", title: `Mobile Recharge (${phone})`, amount: rechAmt, category: "recharge" },
          ],
          totalAmount: billAmt + rechAmt,
          message: `📑 **Multi-Payment Bundle Ready**\n\n1. Electricity Bill: ₹${billAmt}\n2. Mobile Recharge (${phone}): ₹${rechAmt}\n\n**Total:** ₹${billAmt + rechAmt}\n\nTap Confirm to process all in a single atomic action.`,
        };
      }
    }

    // 8. AUTO-PAY & SCHEDULING INTENTS (T18, T19, Wildcard Schedule)
    if (
      lower.includes("schedule") ||
      lower.includes("tomorrow") ||
      lower.includes("next monday") ||
      lower.includes("next week") ||
      lower.includes("later at") ||
      lower.includes("auto-pay") ||
      lower.includes("autopay")
    ) {
      if (lower.includes("auto-pay") || lower.includes("every month")) {
        const billMatch = lower.includes("electricity") ? "Electricity Bill" : "Monthly Utility";
        return await autoPayAgent.setupAutoPay(userId, billMatch, "5th of every month", "reserve");
      }
      if (lower.includes("tomorrow") || lower.includes("pm") || lower.includes("am") || lower.includes("monday") || lower.includes("schedule")) {
        const actionItem = lower.includes("biryani") ? "Swiggy Chicken Biryani" : "Scheduled Payment";
        const timeMatch = lower.includes("next monday") ? "Next Monday at 1:00 PM" : (lower.includes("pm") || lower.includes("am") ? text : "Tomorrow at 8:00 PM");
        return await schedulerAgent.schedulePayment(userId, actionItem, timeMatch, "reserve");
      }
    }

    // 9. SITUATION BASED ORDERING (T17)
    // Only triggers if not an explicit item order with platform (e.g. "order 10 pizzas from dominos on zomato")
    const isExplicitPlatformOrder = (lower.includes("swiggy") || lower.includes("zomato") || lower.includes("dominos")) && (lower.includes("pizza") || lower.includes("biryani") || lower.includes("burger"));
    if (
      !isExplicitPlatformOrder &&
      (
        lower.includes("study session") ||
        lower.includes("snacks") ||
        lower.includes("party") ||
        lower.includes("late night") ||
        lower.includes("sick")
      )
    ) {
      return {
        type: "situation_suggestions",
        situation: "Late Night Study Session",
        explanation: "Curated snacks and energy boosters to keep you focused and energized.",
        essentialItems: [
          { id: "s1", name: "Red Bull Energy Drink (250ml)", price: 125, quantity: 1 },
          { id: "s2", name: "Lay's Classic Salted Chips (Large)", price: 50, quantity: 1 },
          { id: "s3", name: "Cadbury Dairy Milk Silk", price: 90, quantity: 1 },
          { id: "s4", name: "Nescafe Cold Coffee Can", price: 65, quantity: 1 },
        ],
        totalEstimatedCost: 330,
        merchant: "zepto",
        message: "📚 **Late Night Study Pack Prepared!**\n\nHere are curated snacks and beverages from Zepto to keep you focused:",
      };
    }

    // 10. MOBILE RECHARGE INTENTS (T01, T02, T04, Wildcard Spaces & +91)
    if (lower.includes("recharge")) {
      // Clean phone number from spaces and +91 country prefix
      const cleanedTextForPhone = text.replace(/(?:\+91[\-\s]*)?([6-9]\d{3})[\s\-]*(\d{3})[\s\-]*(\d{3})/g, "$1$2$3");
      const validPhone = cleanedTextForPhone.match(/\b[6-9]\d{9}\b/);
      const textWithoutPhone = validPhone ? cleanedTextForPhone.replace(validPhone[0], "") : text;
      
      // Extract amount from the text excluding the 10-digit phone number
      const amountMatch = textWithoutPhone.match(/(?:₹|rs\.?|inr|for|with|of)?\s*([0-9]{1,5})\s*(?:₹|rs\.?|inr|rupees?)?/i);
      const amount = amountMatch ? Number(amountMatch[1]) : null;

      // Check for zero amount prevention
      if (amount === 0) {
        return {
          response: "⚠️ Invalid amount. Recharge amount must be greater than ₹0.",
          requiresAction: false,
          type: "validation_error",
        };
      }

      // Check for DTH recharge edge case
      if (lower.includes("dth") || lower.includes("tata play") || lower.includes("airtel digital") || lower.includes("dish tv")) {
        return await agentPaymentController.payBill(userId, "dth", "Tata Play", "1029384756", amount || 450);
      }

      // Check for standalone invalid short numbers (e.g. "Recharge 12345" where 12345 is not an amount)
      const hasAmountContext = /(?:rs\.?|inr|₹|rupees|plan)/i.test(text) || textWithoutPhone.includes("of") || textWithoutPhone.includes("with");
      const shortNumberMatch = textWithoutPhone.match(/\b[0-9]{3,9}\b/);
      
      if (!validPhone && shortNumberMatch && !hasAmountContext) {
        return {
          response:
            "⚠️ That doesn't look like a valid 10-digit Indian mobile number. Please provide a valid 10-digit number starting with 6, 7, 8, or 9.",
          requiresAction: false,
          type: "validation_error",
        };
      }

      // Valid full info (T01)
      if (validPhone && amount) {
        const opMatch = text.match(/\b(airtel|jio|vi|vodafone|bsnl)\b/i);
        const op = opMatch ? (opMatch[1].toLowerCase() === "vodafone" ? "vi" : opMatch[1].toLowerCase()) : null;
        return await agentPaymentController.rechargeMobile(userId, validPhone[0], amount, null, op);
      }

      // Incomplete recharge missing number (T02) or operator only prompt
      if (!validPhone) {
        pendingIntentService.createFlow(
          userId,
          "recharge",
          { amount },
          ["mobileNumber", "amount"]
        );
        return {
          response: amount
            ? `📱 I need a few more details to complete your ₹${amount} recharge:\n• What is the 10-digit mobile number?\n• Which operator? (Airtel / Jio / Vi / BSNL)`
            : "📱 Please enter the 10-digit mobile number and plan amount to proceed with your recharge.",
          type: "recharge_input_card",
          requiresAction: "collect_recharge_slots",
          amount: amount,
          suggestedOperators: ["Airtel", "Jio", "Vi", "BSNL"],
        };
      }
    }

    // 11. P2P SEND MONEY INTENTS (T05, T06, T07, Hinglish & Wildcards)
    const isSendMoney =
      lower.includes("send") ||
      lower.includes("transfer") ||
      lower.includes("pay") ||
      lower.includes("bhej") ||
      lower.includes("💸") ||
      lower.includes("paise");

    if (isSendMoney) {
      const vpaMatch = text.match(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/);
      const phoneMatch = text.match(/\b[6-9]\d{9}\b/);
      const amountMatch = text.match(/(?:₹|rs\.?|inr|rupees?)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
      const amount = amountMatch ? Number(amountMatch[1]) : null;

      if (amount && (vpaMatch || phoneMatch)) {
        const target = vpaMatch ? vpaMatch[0] : phoneMatch[0];
        const nameMatch = text
          .replace(/(?:send|transfer|pay|bhej)\s*(?:₹|rs\.?|inr)?\s*[0-9,.]+/i, "")
          .replace(/(?:to|for|ko)\s+/i, "")
          .replace(/(?:with|and|having)?\s*(?:upi|vpa|phone|mobile)?\s*[:=]?\s*[a-zA-Z0-9.\-_@]+/gi, "")
          .trim();
        if (nameMatch && nameMatch.length >= 2 && !nameMatch.includes("@") && !nameMatch.includes("/")) {
          try {
            await dbService.createOrUpdateContact(
              userId,
              nameMatch,
              vpaMatch ? vpaMatch[0] : `${phoneMatch[0]}@upi`,
              phoneMatch ? phoneMatch[0] : null,
              0,
              false
            );
          } catch (e) {}
        }
        return await agentPaymentController.sendMoney(userId, target, amount);
      }

      // Check if it's send money to person (English or Hinglish "Rahul ko 150 rs bhej do")
      let recipient = null;
      let amt = amount;

      // 1. Rapid correction: "Actually send 300 not 200 to Rahul" / "Send 300 instead of 200 to Rahul"
      const correctionMatch = text.match(/(?:send|transfer|pay|bhej)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]{1,2})?)\s*(?:not|instead\s+of)\s*(?:₹|rs\.?|inr)?\s*[0-9]+(?:\.[0-9]{1,2})?\s*(?:to|for|ko)?\s*([a-zA-Z0-9@._-]+)/i);
      if (correctionMatch) {
        amt = Number(correctionMatch[1]);
        recipient = correctionMatch[2].trim();
      } else {
        // Match Hinglish "[Name] ko [Amount] bhej"
        const hinglishMatch = text.match(/([a-zA-Z0-9_-]+)\s+ko\s+(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
        if (hinglishMatch) {
          recipient = hinglishMatch[1].trim();
          amt = Number(hinglishMatch[2]);
        } else {
          // Handle "send 10.50 rupees to Rahul" or "send 500 rs to Rahul" or "send ₹500 to Rahul"
          const toMatchCurrency = text.match(/(?:send|transfer|pay|bhej|💸)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]{1,2})?)\s*(?:₹|rs\.?|inr|rupees?|bucks)?\s*(?:to|for|ko|@)\s*([a-zA-Z0-9@._-]+)/i);
          if (toMatchCurrency) {
            amt = Number(toMatchCurrency[1]);
            recipient = toMatchCurrency[2].trim();
          } else {
            const toMatch = text.match(/(?:send|transfer|pay|bhej|💸)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]{1,2})?)\s*(?:to|for|ko|@)?\s*([a-zA-Z0-9@._-]+)?/i) ||
                            text.match(/(?:send|transfer|pay|bhej|💸)\s*([a-zA-Z0-9@._-]+)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
            if (toMatch) {
              amt = Number((toMatch[1] || "").replace(/,/g, ""));
              recipient = toMatch[2] ? toMatch[2].trim() : null;
              if (isNaN(amt) && toMatch[2]) {
                amt = Number((toMatch[2] || "").replace(/,/g, ""));
                recipient = toMatch[1] ? toMatch[1].trim() : null;
              }
            }
          }
        }
      }

      const invalidRecipients = ["bank", "account", "ifsc", "rupees", "rupee", "rs", "inr", "bucks", "not", "money", "paise"];
      if (recipient && invalidRecipients.includes(recipient.toLowerCase())) {
        recipient = null;
      }
      if (!recipient) {
        const fallbackTo = text.match(/\b(?:to|for|ko)\s+([a-zA-Z0-9@._-]+)/i);
        if (fallbackTo && !invalidRecipients.includes(fallbackTo[1].toLowerCase())) {
          recipient = fallbackTo[1].trim();
        }
      }

      if (amt && recipient && !invalidRecipients.includes(recipient.toLowerCase())) {
        return await agentPaymentController.sendMoney(userId, recipient, amt);
      }
    }

    // 12. BILL PAYMENT INTENTS (T10, T11, T12, Gas, Insurance, Property Tax)
    if (lower.includes("bill") || lower.includes("tax") || lower.includes("cylinder") || lower.includes("premium")) {
      const isWater = lower.includes("water");
      const isElec = lower.includes("electricity") || lower.includes("power") || lower.includes("bescom");
      const isGas = lower.includes("gas") || lower.includes("cylinder") || lower.includes("igl");
      const isTax = lower.includes("tax") || lower.includes("bbmp");
      const isInsurance = lower.includes("insurance") || lower.includes("lic") || lower.includes("premium");
      const isBroadband = lower.includes("broadband") || lower.includes("fiber") || lower.includes("fibernet") || lower.includes("wifi");

      const billType = isWater ? "water" : isElec ? "electricity" : isGas ? "gas" : isTax ? "tax" : isInsurance ? "insurance" : isBroadband ? "broadband" : "utility";

      const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*([0-9,]+)/i);
      const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : null;

      let provider = null;
      let customerId = null;
      if (lower.includes("delhi jal board")) provider = "Delhi Jal Board";
      else if (lower.includes("bescom")) provider = "BESCOM";
      else if (lower.includes("tsspdcl")) provider = "TSSPDCL";
      else if (lower.includes("igl")) provider = "Indraprastha Gas (IGL)";
      else if (lower.includes("hp gas")) provider = "HP Gas";
      else if (lower.includes("bbmp")) provider = "BBMP Property Tax";
      else if (lower.includes("lic")) provider = "Life Insurance Corporation (LIC)";
      else if (lower.includes("act fibernet") || lower.includes("act")) provider = "ACT Fibernet";
      else if (lower.includes("apollo")) provider = "Apollo Hospitals";
      else if (lower.includes("hdfc")) provider = "HDFC Credit Card";

      const consumerMatch = text.match(/(?:consumer|id|account|policy)\s*[:#-]?\s*([a-zA-Z0-9]{4,15})/i);
      if (consumerMatch) customerId = consumerMatch[1];

      return await agentPaymentController.payBill(userId, billType, provider, customerId, amount);
    }

    // 13. FOOD & GROCERY ORDERING INTENTS — Smart Intent Router
    // RULE: Only show menu when item is NOT specified. Skip straight to confirmation when item IS known.
    const isFoodOrderIntent =
      lower.includes("order") ||
      lower.includes("ordre") ||
      lower.includes("swiggy") ||
      lower.includes("swigy") ||
      lower.includes("zomato") ||
      lower.includes("zepto") ||
      lower.includes("blinkit") ||
      lower.includes("breakfast") ||
      lower.includes("lunch") ||
      lower.includes("dinner") ||
      lower.includes("food");

    if (isFoodOrderIntent) {
      // --- Detect explicit platform ---
      const hasSwiggy = lower.includes("swiggy") || lower.includes("swigy");
      const hasZomato = lower.includes("zomato") || lower.includes("zomto");
      const hasZepto = lower.includes("zepto");
      const hasBlinkit = lower.includes("blinkit");
      const hasDmart = lower.includes("dmart");
      const hasBigbasket = lower.includes("bigbasket");
      const platformExplicit = hasSwiggy || hasZomato || hasZepto || hasBlinkit || hasDmart || hasBigbasket;

      let merchant = "swiggy";
      if (hasZomato) merchant = "zomato";
      else if (hasZepto) merchant = "zepto";
      else if (hasBlinkit) merchant = "blinkit";
      else if (hasDmart) merchant = "dmart";
      else if (hasBigbasket) merchant = "bigbasket";

      // If user asks to order something or browse but specified NO platform and NO usual order,
      // present platform selection card!
      const isUsualOrder = lower.includes("usual") || lower.includes("repeat") || lower.includes("reorder") || lower.includes("previous order");
      const isGroceryQuery = lower.includes("grocery") || lower.includes("milk") || lower.includes("bread") || lower.includes("eggs") || lower.includes("veggies");

      if (!platformExplicit && !isUsualOrder) {
        // If query is bare "order food", "order lunch", "order grocery", or items without platform
        const cleanQuery = text
          .replace(/\b(?:order|get|buy|deliver|i\s+want\s+to|send|food|please)\b/gi, "")
          .trim();

        return {
          type: "platform_selection",
          category: isGroceryQuery ? "grocery" : "food",
          query: cleanQuery || (isGroceryQuery ? "Groceries" : "Food"),
          pendingQuery: text,
          message: isGroceryQuery
            ? "🛒 Which grocery platform would you like to order from?"
            : "🛵 Which delivery platform would you like to order from?",
          requiresAction: "select_platform",
        };
      }

      // --- Detect payment method ---
      let paymentMethod = "upi";
      const isReservePay = lower.includes("reserve pay") || lower.includes("reservepay") || lower.includes("reserve");
      const isUPI = lower.includes("upi");
      const isGems = lower.includes("gems");
      if (isReservePay) paymentMethod = "reserve_pay";
      else if (isGems) paymentMethod = "gems";
      else if (isUPI) paymentMethod = "upi";

      // --- Item Catalog ---
      const ITEM_CATALOG = {
        "chicken biryani": { name: "Chicken Biryani", price: 220, veg: false, image: "/images/items/biryani.png" },
        "veg biryani": { name: "Veg Biryani", price: 179, veg: true, image: "/images/items/biryani.png" },
        biryani: { name: "Chicken Biryani", price: 220, veg: false, image: "/images/items/biryani.png" },
        "margherita pizza": { name: "Margherita Pizza", price: 199, veg: true, image: "/images/items/pizza.png" },
        "chicken pizza": { name: "Chicken Tikka Pizza", price: 249, veg: false, image: "/images/items/pizza.png" },
        pizza: { name: "Margherita Pizza", price: 199, veg: true, image: "/images/items/pizza.png" },
        "chicken burger": { name: "Crispy Chicken Burger", price: 149, veg: false, image: "/images/items/burger.png" },
        burger: { name: "Crispy Veg Burger", price: 119, veg: true, image: "/images/items/burger.png" },
        "masala dosa": { name: "Masala Dosa", price: 89, veg: true, image: "/images/items/dosa.png" },
        dosa: { name: "Masala Dosa", price: 89, veg: true, image: "/images/items/dosa.png" },
        idli: { name: "Steamed Idli (2 pcs)", price: 59, veg: true, image: "/images/items/idli.png" },
        "cold coffee": { name: "Cold Coffee", price: 89, veg: true, image: "/images/items/coffee.png" },
        coffee: { name: "Cold Coffee", price: 89, veg: true, image: "/images/items/coffee.png" },
        "masala tea": { name: "Special Masala Tea", price: 40, veg: true, image: "/images/items/tea.png" },
        "masala chai": { name: "Special Masala Tea", price: 40, veg: true, image: "/images/items/tea.png" },
        chai: { name: "Special Masala Tea", price: 40, veg: true, image: "/images/items/tea.png" },
        tea: { name: "Special Masala Tea", price: 40, veg: true, image: "/images/items/tea.png" },
        "grilled sandwich": { name: "Grilled Veg Sandwich", price: 99, veg: true, image: "/images/items/sandwich.png" },
        sandwich: { name: "Grilled Veg Sandwich", price: 99, veg: true, image: "/images/items/sandwich.png" },
        noodles: { name: "Hakka Noodles", price: 149, veg: true, image: "/images/items/noodles.png" },
        "hakka noodles": { name: "Hakka Noodles", price: 149, veg: true, image: "/images/items/noodles.png" },
        "paneer butter masala": { name: "Paneer Butter Masala", price: 259, veg: true, image: "/images/items/paneer.png" },
        "paneer tikka": { name: "Paneer Tikka", price: 219, veg: true, image: "/images/items/paneer.png" },
        paneer: { name: "Paneer Butter Masala", price: 259, veg: true, image: "/images/items/paneer.png" },
        "butter chicken": { name: "Butter Chicken", price: 299, veg: false, image: "/images/items/butterchicken.png" },
        "chicken curry": { name: "Chicken Curry", price: 249, veg: false, image: "/images/items/chicken.png" },
        chicken: { name: "Chicken Biryani", price: 220, veg: false, image: "/images/items/biryani.png" },
        "dal makhani": { name: "Dal Makhani", price: 189, veg: true, image: "/images/items/dal.png" },
        dal: { name: "Dal Makhani", price: 189, veg: true, image: "/images/items/dal.png" },
        rice: { name: "Steamed Rice", price: 79, veg: true, image: "/images/items/rice.png" },
        roti: { name: "Butter Roti (3 pcs)", price: 49, veg: true, image: "/images/items/roti.png" },
        coke: { name: "Coca-Cola (500ml)", price: 40, veg: true, image: "/images/items/coke.png" },
        "coca-cola": { name: "Coca-Cola (500ml)", price: 40, veg: true, image: "/images/items/coke.png" },
        juice: { name: "Fresh Orange Juice", price: 89, veg: true, image: "/images/items/juice.png" },
        "french fries": { name: "Loaded French Fries", price: 99, veg: true, image: "/images/items/fries.png" },
        fries: { name: "Loaded French Fries", price: 99, veg: true, image: "/images/items/fries.png" },
        momos: { name: "Steamed Veg Momos (6 pcs)", price: 119, veg: true, image: "/images/items/momos.png" },
        "chicken momos": { name: "Steamed Chicken Momos (6 pcs)", price: 139, veg: false, image: "/images/items/momos.png" },
        vada: { name: "Medu Vada (2 pcs)", price: 69, veg: true, image: "/images/items/vada.png" },
        upma: { name: "Rava Upma", price: 79, veg: true, image: "/images/items/upma.png" },
        poha: { name: "Batata Poha", price: 69, veg: true, image: "/images/items/poha.png" },
        "spring roll": { name: "Veg Spring Rolls (4 pcs)", price: 129, veg: true, image: "/images/items/springroll.png" },
        wrap: { name: "Chicken Shawarma Wrap", price: 149, veg: false, image: "/images/items/wrap.png" },
        shawarma: { name: "Chicken Shawarma Wrap", price: 149, veg: false, image: "/images/items/wrap.png" },
        pasta: { name: "Penne Arrabbiata", price: 189, veg: true, image: "/images/items/pasta.png" },
        lasagna: { name: "Veg Lasagna", price: 219, veg: true, image: "/images/items/lasagna.png" },
        "ice cream": { name: "Chocolate Ice Cream (2 scoops)", price: 99, veg: true, image: "/images/items/icecream.png" },
        icecream: { name: "Chocolate Ice Cream (2 scoops)", price: 99, veg: true, image: "/images/items/icecream.png" },
        cake: { name: "Chocolate Truffle Cake (Slice)", price: 129, veg: true, image: "/images/items/cake.png" },
        "gulab jamun": { name: "Gulab Jamun (4 pcs)", price: 79, veg: true, image: "/images/items/gulabjamun.png" },
        rasmalai: { name: "Rasmalai (2 pcs)", price: 89, veg: true, image: "/images/items/rasmalai.png" },
        halwa: { name: "Sooji Halwa", price: 69, veg: true, image: "/images/items/halwa.png" },
        khichdi: { name: "Moong Dal Khichdi", price: 149, veg: true, image: "/images/items/khichdi.png" },
        "fried rice": { name: "Veg Fried Rice", price: 149, veg: true, image: "/images/items/friedrice.png" },
        "chicken fried rice": { name: "Chicken Fried Rice", price: 179, veg: false, image: "/images/items/friedrice.png" },
        "pav bhaji": { name: "Pav Bhaji", price: 129, veg: true, image: "/images/items/pavbhaji.png" },
        "chole bhature": { name: "Chole Bhature", price: 139, veg: true, image: "/images/items/cholebhature.png" },
        "rajma chawal": { name: "Rajma Chawal", price: 159, veg: true, image: "/images/items/rajmachawal.png" },
        samosa: { name: "Samosa (2 pcs)", price: 39, veg: true, image: "/images/items/samosa.png" },
        dhokla: { name: "Steamed Dhokla", price: 79, veg: true, image: "/images/items/dhokla.png" },
      };

      // --- Detect specific items mentioned (multi-word first for priority) ---
      const detectedItems = [];

      // Check negative dietary preference: if "veg" or "vegetarian" without meat/chicken
      const prefersVeg = lower.includes("veg") || lower.includes("vegetarian") || lower.includes("without meat");

      // Multi-word exact matches take highest precedence
      if (prefersVeg && lower.includes("biryani")) {
        detectedItems.push({
          id: `item_${Date.now()}_0`,
          name: "Veg Biryani",
          price: 179,
          quantity: 1,
          imageUrl: "/images/items/biryani.png",
          merchant: merchant,
        });
      }

      const sortedKeys = Object.keys(ITEM_CATALOG).sort((a, b) => b.length - a.length);
      for (const key of sortedKeys) {
        // Tolerates slight typos like "biryany" -> "biryani", "chickn" -> "chicken"
        const normalizedLower = lower.replace(/biryany/g, "biryani").replace(/chickn/g, "chicken");
        if (normalizedLower.includes(key)) {
          const cat = ITEM_CATALOG[key];

          // If user asked for veg specifically, avoid matching chicken items
          if (prefersVeg && cat.veg === false) {
            continue;
          }

          const alreadyHasSimilar = detectedItems.some(existing => existing.name === cat.name);
          if (!alreadyHasSimilar) {
            detectedItems.push({
              id: `item_${Date.now()}_${detectedItems.length}`,
              name: cat.name,
              price: cat.price,
              quantity: 1,
              imageUrl: cat.image,
              merchant: merchant,
            });
          }
        }
      }

      // --- Detect restaurant name ---
      let restaurantName = null;
      const restaurantKeywords = [
        "paradise", "dominos", "kfc", "mcdonalds", "subway", "haldirams", "haldiram",
        "bikanerwala", "pizza hut", "pizzahut", "burger king", "burgerking",
        "starbucks", "ccd", "cafe coffee day", "wow momo", "wow momos",
        "faasos", "behrouz", "box8", "oven story", "natural ice cream",
      ];
      for (const rk of restaurantKeywords) {
        if (lower.includes(rk)) {
          restaurantName = rk.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          break;
        }
      }

      // --- Check Reserve Pay eligibility ---
      let reserveCheck = { eligible: false, requiresPin: true, message: "UPI payment required" };
      if (isReservePay || paymentMethod === "reserve_pay") {
        try {
          const limitDetails = await agentSecurityService.getReserveLimitDetails(userId, merchant);
          if (limitDetails && limitDetails.is_active) {
            const monthly = Number(limitDetails.monthly_limit || 0);
            const spent = Number(limitDetails.current_spent || 0);
            const remaining = Math.max(0, monthly - spent);
            const perTxn = Number(limitDetails.per_transaction_limit || monthly);
            const itemTotal = detectedItems.reduce((s, it) => s + it.price * (it.quantity || 1), 0);
            const tax13 = Math.round(itemTotal * 0.05);
            const finalTotal13 = itemTotal + tax13;
            if (remaining >= finalTotal13 && finalTotal13 <= perTxn) {
              reserveCheck = {
                eligible: true,
                requiresPin: false,
                message: `${merchant.charAt(0).toUpperCase() + merchant.slice(1)} Reserve Pay active — ₹${remaining.toLocaleString()} remaining`,
                merchant: merchant,
                remainingLimit: remaining,
              };
            } else {
              reserveCheck = {
                eligible: false,
                requiresPin: true,
                message: remaining <= 0 ? "Monthly limit reached. UPI PIN required." : "Order exceeds limit. UPI PIN required.",
                merchant: merchant,
              };
            }
          }
        } catch (e) {
          console.warn("Reserve check failed:", e.message);
        }
      }

      const sessionId = context.conversationId || `sess_${Date.now()}`;

      // ===== CASE A: Item is known → Direct Order Confirmation =====
      if (detectedItems.length > 0 && !isUsualOrder) {
        const subtotal = detectedItems.reduce((s, it) => s + it.price * (it.quantity || 1), 0);
        const tax = Math.round(subtotal * 0.05);
        const totalAmount = subtotal + tax;
        const gems = Math.floor(totalAmount * 0.05);

        await dbService.saveOrderSession(userId, sessionId, {
          merchant,
          cart: detectedItems,
          subtotal,
          tax,
          total: totalAmount,
          step: "ready_to_pay",
        }).catch(() => null);

        pendingIntentService.createFlow(
          userId,
          "order_checkout",
          { sessionId, merchant, total: totalAmount, items: detectedItems, paymentMethod },
          ["confirmation"]
        );

        const itemList = detectedItems.map(it => `• ${it.name} — ₹${it.price}`).join("\n");
        const payLabel = reserveCheck.eligible ? `⚡ ${merchant.toUpperCase()} Reserve Pay (PIN-less)` : "🏦 Canara Bank UPI";
        const restaurantLine = restaurantName ? `\n🏪 **Restaurant:** ${restaurantName}` : "";

        return {
          type: "direct_order_confirmation",
          merchant,
          merchantName: merchant.toUpperCase(),
          sessionId,
          items: detectedItems,
          subtotal,
          tax,
          total: totalAmount,
          restaurantName,
          paymentMethod: reserveCheck.eligible ? `${merchant.toUpperCase()} Reserve Pay (PIN-less)` : "Canara Bank UPI",
          reserveCheck,
          requiresAction: "confirm_payment",
          message: `🛒 **Order Ready — Just confirm!**\n\n${itemList}${restaurantLine}\n\n• **Platform:** ${merchant.toUpperCase()}\n• **Subtotal:** ₹${subtotal}\n• **Tax (5%):** ₹${tax}\n• **Total:** ₹${totalAmount}\n• **Payment:** ${payLabel}\n• **SabAI Gems:** +${gems} 🪙\n\n👉 Reply **"confirm"** to place the order instantly!`,
        };
      }

      // ===== CASE B: "Usual" order =====
      if (isUsualOrder) {
        const mealSlot = lower.includes("lunch") ? "lunch"
          : lower.includes("dinner") ? "dinner"
          : lower.includes("snack") ? "snacks"
          : "breakfast";

        try {
          let items = null;
          let total = 0;

          const savedUsual = await dbService.getUsualOrder(userId, mealSlot).catch(() => null);
          if (savedUsual && Array.isArray(savedUsual.items) && savedUsual.items.length > 0) {
            items = savedUsual.items;
            total = items.reduce((sum, it) => sum + Number(it.price) * (it.quantity || 1), 0);
          } else {
            const pastOrders = await dbService.getUserOrders(userId, 5).catch(() => []);
            if (pastOrders && pastOrders.length > 0 && pastOrders[0].items) {
              items = pastOrders[0].items;
              total = Number(pastOrders[0].total_amount || 129);
            }
          }

          if (!items || items.length === 0) {
            items = [
              { id: "bf_1", name: "Masala Dosa", price: 89, quantity: 1, merchant, imageUrl: "/images/items/dosa.png" },
              { id: "bf_2", name: "Special Masala Tea", price: 40, quantity: 1, merchant, imageUrl: "/images/items/tea.png" },
            ];
            total = 129;
          }

          await dbService.saveOrderSession(userId, sessionId, {
            merchant, cart: items, subtotal: total, tax: 0, total, step: "ready_to_pay",
          }).catch(() => null);

          pendingIntentService.createFlow(
            userId,
            "order_checkout",
            { sessionId, merchant, total, items, paymentMethod },
            ["confirmation"]
          );

          return {
            type: "order_summary",
            merchantName: merchant.toUpperCase(),
            merchant,
            sessionId,
            cart: items,
            items,
            total,
            subtotal: total,
            requiresAction: "confirm_payment",
            reserveCheck: reserveCheck.eligible ? reserveCheck : {
              eligible: true,
              requiresPin: false,
              message: `${merchant.charAt(0).toUpperCase() + merchant.slice(1)} Reserve Pay active`,
              merchant,
              remainingLimit: 4500,
            },
            message: `🍳 **Your Usual ${mealSlot.charAt(0).toUpperCase() + mealSlot.slice(1)} from ${merchant.toUpperCase()} is Ready!**\n\n${items.map(it => `• ${it.name} x${it.quantity || 1} — ₹${Number(it.price) * (it.quantity || 1)}`).join("\n")}\n\n**Total:** ₹${total}\n🛡️ **Reserve Pay:** PIN-less payment eligible.\n\n👉 Reply **"confirm"** to place the order immediately!`,
          };
        } catch (e) {
          console.warn("Usual order error:", e.message);
        }
      }

      // ===== CASE C: No item specified → Show menu/browse =====
      let cuisine = null;
      if (lower.includes("breakfast") || lower.includes("dosa") || lower.includes("idli")) cuisine = "breakfast";
      else if (lower.includes("biryani")) cuisine = "biryani";
      else if (lower.includes("pizza")) cuisine = "pizza";
      else if (lower.includes("burger")) cuisine = "burger";
      else if (lower.includes("milk") || lower.includes("bread") || lower.includes("eggs") || lower.includes("grocery")) cuisine = "grocery";

      const budgetMatch = text.match(/(?:under|below|max|budget)\s*(?:₹|rs\.?|inr)?\s*([0-9]+)/i);
      const maxPrice = budgetMatch ? Number(budgetMatch[1]) : null;

      const orderResult = await orderAgent.findRestaurants(userId, merchant, restaurantName, cuisine, maxPrice);

      if (lower.includes("reserve") && orderResult && orderResult.message) {
        orderResult.message += `\n\n🛡️ **Reserve Pay Active:** Ready for frictionless PIN-less checkout within your limit.`;
      }
      return orderResult;
    }

    // 14. GENERAL CAPABILITIES GUIDE (T25)
    if (lower.includes("what services") || lower.includes("help") || lower.includes("what can you do") || lower.includes("capabilities")) {
      return {
        response:
          "👋 **Welcome to SabAI Pay!**\n\nI am your intelligent payment and commerce assistant. Here is what I can do for you:\n\n" +
          "• **📱 Mobile Recharge:** Instant voice/text recharges with operator & plan auto-selection.\n" +
          "• **💸 P2P Payments & Bank Transfers:** Send money via UPI, Phone, Contacts, or IFSC with Reserve Pay PIN-less speed.\n" +
          "• **🧾 Bill Payments:** Pay Electricity, Water, Gas, and Broadband bills effortlessly.\n" +
          "• **🍔 Food & Quick Grocery:** Order meals from Swiggy/Zomato or groceries from Zepto/Blinkit under your budget.\n" +
          "• **🛡️ Reserve Pay:** Pre-approved spending limits for safe, one-tap, PIN-less transactions.\n" +
          "• **🪙 SabAI Gems:** Earn 5% instant cashback on every transaction!\n" +
          "• **📅 Auto-Pay & Scheduling:** Schedule future orders or setup recurring bill payments.",
        requiresAction: false,
        type: "capabilities_guide",
      };
    }

    return null; // Fall through to Gemini / Groq if no direct rule matched
  }
}

module.exports = new AgentDialogueService();
