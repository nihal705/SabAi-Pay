const cron = require('node-cron');
const { getSupabase } = require('../config/supabase');

class CronService {
  constructor() { this.jobs = []; }

  async resetMonthlyLimits() {
    const db = getSupabase();
    const [users, limits] = await Promise.all([
      db.from('users').update({ current_spent: 0 }).gte('current_spent', 0),
      db.from('reserve_limits').update({ current_spent: 0 }).gte('current_spent', 0),
    ]);
    if (users.error) throw users.error;
    if (limits.error) throw limits.error;
  }

  async notifyDueScheduledOrders() {
    // Charging a saved payment method from a cron job is never safe by itself.
    // A production PSP webhook/mandate implementation must authorize it first.
    const db = getSupabase();
    const { data, error } = await db.from('scheduled_orders').select('id,user_id,scheduled_time')
      .eq('status', 'scheduled').lte('scheduled_time', new Date().toISOString()).limit(100);
    if (error) throw error;
    await Promise.all(data.map(async (order) => {
      await db.from('scheduled_orders').update({ status: 'awaiting_authorization' }).eq('id', order.id).eq('status', 'scheduled');
      await db.from('notifications').insert({ user_id: order.user_id, type: 'scheduled_order', title: 'Scheduled payment needs approval', message: 'Review and authorize your scheduled payment before it is processed.', priority: 'high' });
    }));
  }

  init() {
    if (this.jobs.length) return;
    this.jobs.push(cron.schedule('5 0 1 * *', () => this.resetMonthlyLimits().catch((error) => console.error('Monthly limit reset failed:', error.message)), { timezone: 'Asia/Kolkata' }));
    this.jobs.push(cron.schedule('*/10 * * * *', () => this.notifyDueScheduledOrders().catch((error) => console.error('Scheduled-order notification failed:', error.message)), { timezone: 'Asia/Kolkata' }));
  }

  stopAll() { this.jobs.splice(0).forEach((job) => job.stop()); }
}

module.exports = new CronService();
