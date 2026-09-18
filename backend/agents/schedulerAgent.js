// backend/agents/schedulerAgent.js

const dbService = require("../services/databaseService");

class SchedulerAgent {
  async schedulePayment(userId, action, datetime, paymentMethod) {
    const scheduleId = `SCHED_${Date.now()}`;
    const scheduledOrder = {
      id: scheduleId,
      userId,
      action,
      scheduledTime: datetime,
      paymentMethod,
      status: "scheduled",
    };
    await dbService.saveScheduledOrder(scheduledOrder);
    return {
      success: true,
      scheduleId,
      message: `Payment scheduled for ${new Date(datetime).toLocaleString()}`,
    };
  }
}

module.exports = new SchedulerAgent();