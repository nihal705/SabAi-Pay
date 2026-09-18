// backend/agents/rechargeAgent.js

const rechargePlanService = require("../services/rechargePlanService");
const agentPaymentController = require("../controllers/agentPaymentController");

class RechargeAgent {
  async detectOperator(mobileNumber) {
    return rechargePlanService.detectOperator(mobileNumber);
  }

  async getPlans(operatorId) {
    return rechargePlanService.getPlans(operatorId);
  }

  async recharge(userId, mobileNumber, amount, plan, operator) {
    return await agentPaymentController.rechargeMobile(userId, mobileNumber, amount, plan, operator);
  }
}

module.exports = new RechargeAgent();