// backend/agents/autoPayAgent.js

const dbService = require("../services/databaseService");
const cron = require("node-cron");

class AutoPayAgent {
  constructor() {
    this.startScheduler();
  }

  async setupAutoPay(userId, action, schedule, paymentMethod) {
    const orderId = `AUTO_${Date.now()}`;
    const nextExecution = this.calculateNextExecution(schedule);
    const autoPayOrder = {
      order_id: orderId,
      user_id: userId,
      action: JSON.stringify(action),
      schedule,
      payment_method: paymentMethod,
      next_execution: nextExecution,
      status: "active",
    };
    await dbService.createAutoPayOrder(userId, autoPayOrder);
    return {
      success: true,
      orderId,
      nextExecution,
      message: `Auto-Pay set up successfully. Next execution: ${new Date(nextExecution).toLocaleString()}`,
    };
  }

  async cancelAutoPay(orderId) {
    await dbService.updateAutoPayOrderStatus(orderId, "cancelled");
    return { success: true, message: "Auto-Pay cancelled" };
  }

  calculateNextExecution(schedule) {
    const now = new Date();
    let next = new Date(now);
    if (schedule === "monthly") {
      next.setMonth(now.getMonth() + 1);
    } else if (schedule === "weekly") {
      next.setDate(now.getDate() + 7);
    } else {
      next.setDate(now.getDate() + 1);
    }
    return next.toISOString();
  }

  startScheduler() {
    cron.schedule("0 * * * *", async () => {
      console.log("⏰ Running Auto-Pay scheduler...");
      const dueOrders = await dbService.getDueAutoPayOrders();
      for (const order of dueOrders) {
        await this.executeOrder(order);
      }
    });
  }

  async executeOrder(order) {
    console.log(`Executing Auto-Pay order ${order.order_id}`);
    // In real implementation, reconstruct action and call orchestrator
    await dbService.updateAutoPayOrderStatus(order.order_id, "executed");
  }
}

module.exports = new AutoPayAgent();