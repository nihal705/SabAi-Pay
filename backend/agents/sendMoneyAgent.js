// backend/agents/sendMoneyAgent.js

const recipientResolverService = require("../services/recipientResolverService");
const agentPaymentController = require("../controllers/agentPaymentController");

class SendMoneyAgent {
  async resolveRecipient(userId, text) {
    return await recipientResolverService.resolve(text, userId);
  }

  async sendMoney(userId, recipient, amount, note) {
    return await agentPaymentController.sendMoney(userId, recipient, amount, note);
  }

  async requestMoney(userId, recipient, amount, note) {
    return await agentPaymentController.requestMoney(userId, recipient, amount, note);
  }
}

module.exports = new SendMoneyAgent();