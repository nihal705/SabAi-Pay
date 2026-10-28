// backend/services/agentSecurityService.js
// Complete Fixed Version: Multi-Tier Reserve Pay Policy Engine

const dbService = require("./databaseService");

class AgentSecurityService {
  constructor() {
    this.SABAI_PAY_LITE = "sabai-pay-lite";
  }

  /**
   * Decide if a payment requires PIN or can use Reserve Pay
   * Checks merchant-specific limit first, then falls back to global SabAI Pay Lite.
   *
   * @param {string} userId - The user ID
   * @param {Object} transaction - Transaction details
   * @param {string} transaction.merchant - Merchant identifier (swiggy, zomato, zepto, etc.)
   * @param {string} transaction.recipient - Recipient identifier (UPI, phone, bank account)
   * @param {string} transaction.recipientType - 'upi', 'phone', 'bank', 'contact'
   * @param {number} transaction.amount - Amount in INR
   * @param {string} transaction.type - 'send_money', 'pay_bill', 'recharge_mobile', 'order'
   * @param {string} transaction.category - 'p2p', 'bill', 'recharge', 'food', 'grocery'
   * @returns {Object} { requiresPin: boolean, method: 'reserve_pay'|'bank', limitRemaining: number, message: string }
   */
  async decideSecurity(userId, transaction) {
    try {
      const amount = Number(transaction.amount) || 0;
      const merchantKey = (transaction.merchant || transaction.provider || "").toLowerCase();

      // 1. Try to find a merchant-specific Reserve limit first
      let applicableLimit = null;
      let limitKey = this.SABAI_PAY_LITE;

      if (merchantKey) {
        const merchantLimit = await dbService.getReserveLimit(userId, merchantKey);
        if (merchantLimit && merchantLimit.is_active) {
          applicableLimit = merchantLimit;
          limitKey = merchantKey;
        }
      }

      // 2. If no active merchant limit, check global SabAI Pay Lite limit
      if (!applicableLimit) {
        const globalLimit = await dbService.getReserveLimit(userId, this.SABAI_PAY_LITE);
        if (globalLimit && globalLimit.is_active) {
          applicableLimit = globalLimit;
          limitKey = this.SABAI_PAY_LITE;
        }
      }

      // If neither is set or active, PIN is required
      if (!applicableLimit || !applicableLimit.is_active) {
        return {
          requiresPin: true,
          method: "bank",
          limitRemaining: 0,
          limitKey: null,
          message: "No active Reserve Pay limit set for this transaction. UPI PIN required.",
        };
      }

      const monthlyLimit = Number(applicableLimit.monthly_limit) || 0;
      const currentSpent = Number(applicableLimit.current_spent) || 0;
      const perTxnLimit = applicableLimit.per_transaction_limit ? Number(applicableLimit.per_transaction_limit) : null;
      const limitRemaining = Math.max(0, monthlyLimit - currentSpent);

      // 3. Check Per-Transaction Limit
      if (perTxnLimit && amount > perTxnLimit) {
        return {
          requiresPin: true,
          method: "bank",
          limitRemaining: limitRemaining,
          limitKey: limitKey,
          message: `Amount ₹${amount.toLocaleString()} exceeds per-transaction limit of ₹${perTxnLimit.toLocaleString()}. UPI PIN required.`,
        };
      }

      // 4. Check Monthly Remaining Budget
      if (amount > limitRemaining) {
        return {
          requiresPin: true,
          method: "bank",
          limitRemaining: limitRemaining,
          limitKey: limitKey,
          message: `Amount ₹${amount.toLocaleString()} exceeds remaining Reserve Pay limit of ₹${limitRemaining.toLocaleString()}. UPI PIN required.`,
        };
      }

      // 5. Check if Recipient is New (for P2P send money)
      if (transaction.type === "send_money" || transaction.type === "request_money") {
        const isNew = await this.isNewRecipient(userId, transaction);
        if (isNew) {
          return {
            requiresPin: true,
            method: "reserve_pay",
            limitRemaining: limitRemaining,
            limitKey: limitKey,
            message: "First-time recipient requires UPI PIN verification for security.",
          };
        }
      }

      // 6. Check if explicit user approval is required on this limit
      if (applicableLimit.requires_approval) {
        return {
          requiresPin: true,
          method: "reserve_pay",
          limitRemaining: limitRemaining,
          limitKey: limitKey,
          message: "Merchant policy requires PIN verification for every order.",
        };
      }

      // 7. ALL CHECKS PASSED -> PIN-LESS RESERVE PAY
      return {
        requiresPin: false,
        method: "reserve_pay",
        limitRemaining: limitRemaining - amount,
        limitKey: limitKey,
        message: `✅ Payment of ₹${amount.toLocaleString()} authorized via Reserve Pay (${applicableLimit.merchant_name || limitKey}). Remaining: ₹${(limitRemaining - amount).toLocaleString()}`,
      };
    } catch (error) {
      console.error("❌ decideSecurity error:", error);
      return {
        requiresPin: true,
        method: "bank",
        limitRemaining: 0,
        message: "Security check failed. UPI PIN required.",
      };
    }
  }

  /**
   * Check if a recipient is new for the user
   */
  async isNewRecipient(userId, transaction) {
    try {
      const recipient = (transaction.recipient || "").trim().toLowerCase();
      if (!recipient) return true;

      // 1. Check in user's contacts table
      const contacts = await dbService.getContacts(userId);
      const matchedContact = (contacts || []).find((c) => {
        const cName = (c.name || "").toLowerCase();
        const cVpa = (c.vpa || "").toLowerCase();
        const cPhone = (c.phone || "").toLowerCase();
        return (
          recipient === cVpa ||
          recipient === cPhone ||
          recipient.includes(cName) ||
          cName.includes(recipient)
        );
      });

      if (matchedContact) {
        // Saved in contacts -> Known recipient!
        return false;
      }

      // 2. Check past transactions
      const transactions = await dbService.getTransactions(userId, 500, 0);
      const hasPriorTxn = (transactions || []).some((t) => {
        const rVpa = (t.receiver_vpa || "").toLowerCase();
        const rName = (t.receiver_name || "").toLowerCase();
        return rVpa === recipient || rName.includes(recipient);
      });

      return !hasPriorTxn;
    } catch (error) {
      console.error("❌ isNewRecipient error:", error);
      return false; // Fail open to avoid blocking legitimate users if DB error
    }
  }

  /**
   * Check if Reserve Pay is available for a given amount and merchant
   */
  async isReservePayAvailable(userId, amount, merchant = null) {
    const decision = await this.decideSecurity(userId, {
      amount,
      merchant: merchant || this.SABAI_PAY_LITE,
    });
    return {
      available: !decision.requiresPin,
      remaining: decision.limitRemaining,
      requiresPin: decision.requiresPin,
      message: decision.message,
    };
  }

  async getReserveLimitDetails(userId, merchant = null) {
    try {
      if (merchant) {
        const specific = await dbService.getReserveLimit(userId, merchant.toLowerCase());
        if (specific && specific.is_active) return specific;
      }
      return await dbService.getReserveLimit(userId, this.SABAI_PAY_LITE);
    } catch (error) {
      return null;
    }
  }
}

module.exports = new AgentSecurityService();
