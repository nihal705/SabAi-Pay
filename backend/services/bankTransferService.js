// backend/services/bankTransferService.js
// Handles "send money to a bank account number" flow.
//
// NOTE: This is a SIMULATED bank transfer for the prototype. It debits the
// user's linked SabAI bank_balances entry and writes a transaction row.
// No real money leaves any real bank.

const dbService = require("./databaseService");

class BankTransferService {
  /**
   * Parse a raw string that may contain an account number and/or IFSC.
   * Accepted formats:
   *   "1234567890/IFSC0001234"
   *   "1234567890 IFSC0001234"
   *   "1234567890"
   * Returns { accountNumber, ifsc, confidence } or null.
   */
  parseBankAccount(text) {
    if (!text || typeof text !== "string") return null;
    const cleaned = text.trim();

    // Format A: number/IFSC or number IFSC
    const withIfsc = cleaned.match(/(\d{6,18})\s*[\/\s]\s*([A-Z]{4}0[A-Z0-9]{6})/i);
    if (withIfsc) {
      return {
        accountNumber: withIfsc[1],
        ifsc: withIfsc[2].toUpperCase(),
        confidence: "high",
      };
    }

    // Format B: standalone account number (6-18 digits)
    const justNumber = cleaned.match(/^(\d{6,18})$/);
    if (justNumber) {
      return {
        accountNumber: justNumber[1],
        ifsc: null,
        confidence: "medium",
      };
    }

    return null;
  }

  /**
   * Validate an account number + IFSC.
   * IFSC format: 4 letters + '0' + 6 alphanumerics.
   * If ifsc is null, we require one from the user before proceeding.
   */
  validate(accountNumber, ifsc) {
    const errors = [];

    if (!accountNumber || !/^\d{6,18}$/.test(accountNumber)) {
      errors.push("Account number must be 6–18 digits.");
    }
    if (!ifsc) {
      errors.push("IFSC code is required to send to a bank account.");
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc)) {
      errors.push("IFSC code format is invalid (e.g., HDFC0001234).");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Prepare a payment request object — DOES NOT transfer money.
   * The caller (agentPaymentController) sends this to the frontend as a
   * confirmation card, exactly like the send_money flow.
   */
  async prepareTransfer(userId, { accountNumber, ifsc, amount, recipientName, note }) {
    const validation = this.validate(accountNumber, ifsc);
    if (!validation.valid) {
      return {
        status: "failed",
        error: validation.errors.join(" "),
      };
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return { status: "failed", error: "Amount must be a positive number." };
    }
    if (parsedAmount > 100000) {
      return {
        status: "failed",
        error: "Prototype limit: max ₹1,00,000 per bank transfer.",
      };
    }

    // Find a bank account to debit (user's primary SabAI bank)
    const bankAccounts = await dbService.getBankAccounts(userId);
    const primary = bankAccounts.find((b) => b.is_primary) || bankAccounts[0];
    if (!primary) {
      return {
        status: "failed",
        error: "No bank account linked. Please add one in Settings first.",
      };
    }

    // This bank transfer is treated like a new payee → PIN required.
    // (Mirrors the "new recipient requires PIN" rule in agentSecurityService.)
    const paymentData = {
      kind: "bank_transfer",
      recipient: {
        type: "bank_account",
        accountNumber,
        ifsc,
        displayName: recipientName || `A/C ****${accountNumber.slice(-4)}`,
      },
      amount: parsedAmount,
      note: note || "",
      bankAccount: primary,
      requiresPin: true,
      method: "bank",
    };

    return {
      status: "ready",
      requiresAction: "confirm_payment",
      type: "send_money_card", // reuse the same confirmation card UI
      paymentData,
      message:
        `🏦 **Bank Transfer**\n\n` +
        `**To:** ${paymentData.recipient.displayName}\n` +
        `**Account:** ****${accountNumber.slice(-4)}\n` +
        `**IFSC:** ${ifsc}\n` +
        `**Amount:** ₹${parsedAmount.toLocaleString()}\n` +
        `**From:** ${primary.bank_name} (****${primary.account_number?.slice(-4)})\n\n` +
        `🔒 **PIN Required** — bank transfers require your UPI PIN.`,
    };
  }

  /**
   * Execute the confirmed transfer. Called only after PIN verification
   * in agentPaymentController.confirmSendMoney (or its bank variant).
   */
  async executeTransfer(userId, paymentData) {
    const amount = paymentData.amount;
    const fromAccountId = paymentData.bankAccount.id;

    const account = await dbService.getBankAccountById(fromAccountId, userId);
    const currentBalance = Number(account?.balance || 0);
    if (currentBalance < amount) {
      return {
        status: "failed",
        error: `Insufficient balance. Available: ₹${currentBalance.toLocaleString()}`,
      };
    }

    await dbService.updateBankBalance(fromAccountId, amount, false);

    const transactionId = `TXN${Date.now()}`;
    await dbService.createTransaction({
      transaction_id: transactionId,
      user_id: userId,
      type: "send",
      amount,
      status: "success",
      description:
        paymentData.note ||
        `Bank transfer to ${paymentData.recipient.displayName}`,
      receiver_name: paymentData.recipient.displayName,
      bank_name: paymentData.bankAccount.bank_name,
      bank_account_id: fromAccountId,
      payment_method_display: "Bank Transfer",
      bank_used: amount,
    });

    return {
      success: true,
      transactionId,
      amount,
      recipient: paymentData.recipient.displayName,
      method: "Bank Transfer",
      message: `✅ Bank transfer of ₹${amount.toLocaleString()} completed (simulated).`,
    };
  }
}

module.exports = new BankTransferService();