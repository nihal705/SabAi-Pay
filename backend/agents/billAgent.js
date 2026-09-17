// backend/agents/billAgent.js

const billerCatalogService = require("../services/billerCatalogService");
const agentPaymentController = require("../controllers/agentPaymentController");

class BillAgent {
  async listBillers(category) {
    if (category) {
      return billerCatalogService.getBillersByCategory(category);
    }
    return billerCatalogService.getAllBillers();
  }

  async fetchBillAmount(billerId, customerId) {
    // In real implementation, call external API; for demo, return random amount
    return { amount: Math.floor(Math.random() * 2000) + 500, customerId };
  }

  async payBill(userId, billType, provider, customerId, amount) {
    return await agentPaymentController.payBill(userId, billType, provider, customerId, amount);
  }
}

module.exports = new BillAgent();