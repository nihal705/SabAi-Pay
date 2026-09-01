const databaseService = require('./databaseService');

class OrderService {
  async saveOrder(userId, order) { return databaseService.createAgentOrder(userId, order); }
  async getUserOrders(userId) { return databaseService.getAgentOrders(userId); }
  async getOrder(orderId, userId) { return databaseService.getAgentOrder(orderId, userId); }
  async updateOrderStatus(orderId, status, tracking) { return databaseService.updateAgentOrderStatus(orderId, status, tracking); }
  async deleteOrder() { throw new Error('Order deletion is not supported after placement'); }
  async getUserOrdersWithFilter(userId, filter = {}) {
    let orders = await this.getUserOrders(userId);
    if (filter.status) orders = orders.filter((order) => order.status === filter.status);
    return orders;
  }
  async getOrderCount(userId) { return (await this.getUserOrders(userId)).length; }
  async getTotalSpent(userId) { return (await this.getUserOrders(userId)).reduce((total, order) => total + Number(order.total_amount || order.totalAmount || 0), 0); }
}

module.exports = new OrderService();
