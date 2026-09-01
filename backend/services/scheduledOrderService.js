const databaseService = require('./databaseService');

// Scheduled orders are stored durably but are never charged by an in-process timer.
// Production recurring payments require a PSP/UPI mandate and verified webhook.
class ScheduledOrderService {
  async scheduleOrder(userId, orderData, scheduleTime, paymentMethod, bankAccountId = null) {
    if (Number.isNaN(new Date(scheduleTime).getTime()) || new Date(scheduleTime) <= new Date()) throw new Error('Choose a future schedule time');
    const row = await databaseService.saveScheduledOrder({ userId, orderData, scheduleTime, paymentMethod, bankAccountId, status: 'scheduled' });
    return this.format(row);
  }

  async getUserScheduledOrders(userId) { return (await databaseService.getScheduledOrders(userId)).map((row) => this.format(row)); }

  async cancelScheduledOrder(id, userId) {
    const order = (await databaseService.getScheduledOrders(userId)).find((item) => item.id === id);
    if (!order) throw new Error('Scheduled order not found');
    if (!['scheduled', 'awaiting_authorization'].includes(order.status)) throw new Error('This scheduled order can no longer be cancelled');
    return this.format(await databaseService.updateScheduledOrder(id, { status: 'cancelled', cancelled_at: new Date().toISOString() }, userId));
  }

  async updatePaymentMethod(id, userId, paymentMethod, bankAccountId = null) {
    const order = (await databaseService.getScheduledOrders(userId)).find((item) => item.id === id);
    if (!order) throw new Error('Scheduled order not found');
    if (!['scheduled', 'awaiting_authorization'].includes(order.status)) throw new Error('This scheduled order can no longer be changed');
    return this.format(await databaseService.updateScheduledOrder(id, { payment_method: paymentMethod, bank_account_id: bankAccountId }, userId));
  }

  format(row) { return { id: row.id, ...(row.order_data || {}), scheduleTime: row.scheduled_time, paymentMethod: row.payment_method, bankAccountId: row.bank_account_id, status: row.status, createdAt: row.created_at }; }
}

module.exports = new ScheduledOrderService();
