// backend/services/cronService.js
// Scheduled tasks using node-cron

const cron = require('node-cron');
const db = require('../config/database');
const Coin = require('../models/Coin');
const Notification = require('../models/Notification');
const AgentLimit = require('../models/AgentLimit');
const constants = require('../utils/constants');

class CronService {
    
    constructor() {
        this.jobs = [];
        this.initialized = false;
    }
    
    // Initialize all cron jobs
    init() {
        if (this.initialized) return;
        
        console.log('⏰ Initializing cron jobs...');
        
        // Run every day at 9:00 AM
        this.scheduleCoinExpiryCheck();
        
        // Run on 1st of every month at 12:00 AM
        this.scheduleMonthlyReset();
        
        // Run every hour
        this.scheduleBillReminders();
        
        // Run every 6 hours
        this.scheduleLimitAlerts();
        
        // Run every day at 8:00 PM
        this.scheduleDailySummary();
        
        // Run every Sunday at 10:00 PM
        this.scheduleWeeklyReport();
        
        this.initialized = true;
        console.log(`✅ Scheduled ${this.jobs.length} cron jobs`);
    }
    
    // Check for expiring coins daily at 9 AM
    scheduleCoinExpiryCheck() {
        const job = cron.schedule('0 9 * * *', async () => {
            console.log('🔍 Checking for expiring coins...');
            
            try {
                // Process expired coins
                const expired = await Coin.processExpiredCoins();
                
                // Find coins expiring in 3 days
                const [rows] = await db.pool.execute(`
                    SELECT user_id, SUM(amount) as total_coins, 
                           DATE_FORMAT(expiry_date, '%d %b %Y') as expiry_date
                    FROM coins 
                    WHERE expiry_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
                        AND status = 'active'
                    GROUP BY user_id, expiry_date
                `);
                
                // Create notifications for each user
                for (const row of rows) {
                    await Notification.createCoinExpiryNotification(
                        row.user_id,
                        row.total_coins,
                        row.expiry_date
                    );
                    
                    console.log(`✅ Expiry notification sent to user ${row.user_id}`);
                }
                
                console.log(`✅ Coin check complete. ${rows.length} notifications created.`);
                if (expired.success) {
                    console.log(`   ${expired.data.affected_rows} coins marked as expired`);
                }
                
            } catch (error) {
                console.error('❌ Error in coin expiry check:', error);
            }
        });
        
        this.jobs.push({ name: 'coin_expiry', job });
        console.log('📅 Coin expiry check scheduled for 9:00 AM daily');
    }
    
    // Reset monthly spending on 1st of month
    scheduleMonthlyReset() {
        const job = cron.schedule('0 0 1 * *', async () => {
            console.log('🔄 Resetting monthly spending limits...');
            
            try {
                // Reset user current_spent
                await db.pool.execute('UPDATE users SET current_spent = 0');
                
                // Reset agent limits current_spent
                await db.pool.execute('UPDATE agent_limits SET current_spent = 0');
                
                // Create notifications for all active users
                const [users] = await db.pool.execute(
                    'SELECT id FROM users WHERE is_active = true'
                );
                
                for (const user of users) {
                    await Notification.create(user.id, {
                        type: constants.NOTIFICATION_TYPES.REMINDER,
                        title: 'New Month, New Limits! 📅',
                        message: 'Your monthly spending limits have been reset. Time to plan your expenses!',
                        priority: constants.NOTIFICATION_PRIORITIES.MEDIUM
                    });
                }
                
                console.log(`✅ Monthly reset complete. ${users.length} users notified.`);
                
            } catch (error) {
                console.error('❌ Error in monthly reset:', error);
            }
        });
        
        this.jobs.push({ name: 'monthly_reset', job });
        console.log('📅 Monthly reset scheduled for 1st of each month at 12:00 AM');
    }
    
    // Check for upcoming bill reminders every hour
    scheduleBillReminders() {
        const job = cron.schedule('0 * * * *', async () => {
            console.log('🔍 Checking for upcoming bills...');
            
            try {
                // Find bills due in 2 days
                const [bills] = await db.pool.execute(`
                    SELECT rb.*, u.name, u.phone_number 
                    FROM recurring_bills rb
                    JOIN users u ON rb.user_id = u.id
                    WHERE rb.is_active = true 
                        AND rb.next_due_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY)
                `);
                
                for (const bill of bills) {
                    await Notification.create(bill.user_id, {
                        type: constants.NOTIFICATION_TYPES.REMINDER,
                        title: 'Bill Due Soon! ⏰',
                        message: `Your ${bill.bill_type} bill of ₹${bill.fixed_amount || 'variable'} is due in 2 days.`,
                        priority: constants.NOTIFICATION_PRIORITIES.MEDIUM,
                        data: {
                            bill_id: bill.id,
                            bill_type: bill.bill_type,
                            provider: bill.provider,
                            amount: bill.fixed_amount
                        }
                    });
                }
                
                if (bills.length > 0) {
                    console.log(`✅ Bill reminders sent for ${bills.length} bills`);
                }
                
            } catch (error) {
                console.error('❌ Error in bill reminders:', error);
            }
        });
        
        this.jobs.push({ name: 'bill_reminders', job });
    }
    
    // Check spending limits every 6 hours
    scheduleLimitAlerts() {
        const job = cron.schedule('0 */6 * * *', async () => {
            console.log('🔍 Checking spending limits...');
            
            try {
                // Find users nearing their limits (>80%)
                const [users] = await db.pool.execute(`
                    SELECT id, current_spent, monthly_limit 
                    FROM users 
                    WHERE is_active = true 
                        AND monthly_limit > 0
                        AND (current_spent / monthly_limit) >= 0.8
                `);
                
                for (const user of users) {
                    const percentage = Math.round((user.current_spent / user.monthly_limit) * 100);
                    
                    await Notification.create(user.id, {
                        type: constants.NOTIFICATION_TYPES.LIMIT_ALERT,
                        title: 'Monthly Limit Alert ⚠️',
                        message: `You've used ${percentage}% of your monthly limit.`,
                        priority: constants.NOTIFICATION_PRIORITIES.HIGH,
                        data: {
                            spent: user.current_spent,
                            limit: user.monthly_limit,
                            percentage
                        }
                    });
                }
                
                if (users.length > 0) {
                    console.log(`✅ Limit alerts sent to ${users.length} users`);
                }
                
                // Check merchant-specific limits
                const [merchants] = await db.pool.execute(`
                    SELECT user_id, merchant, current_spent, monthly_limit 
                    FROM agent_limits 
                    WHERE is_active = true 
                        AND monthly_limit > 0
                        AND (current_spent / monthly_limit) >= 0.8
                `);
                
                for (const merchant of merchants) {
                    const percentage = Math.round((merchant.current_spent / merchant.monthly_limit) * 100);
                    
                    await Notification.createLimitAlert(
                        merchant.user_id,
                        merchant.merchant,
                        percentage
                    );
                }
                
            } catch (error) {
                console.error('❌ Error in limit alerts:', error);
            }
        });
        
        this.jobs.push({ name: 'limit_alerts', job });
    }
    
    // Send daily spending summary at 8 PM
    scheduleDailySummary() {
        const job = cron.schedule('0 20 * * *', async () => {
            console.log('📊 Sending daily summaries...');
            
            try {
                // Get users with transactions today
                const [users] = await db.pool.execute(`
                    SELECT DISTINCT user_id 
                    FROM transactions 
                    WHERE DATE(created_at) = CURDATE()
                `);
                
                for (const user of users) {
                    // Calculate today's spending
                    const [spending] = await db.pool.execute(`
                        SELECT 
                            COUNT(*) as transaction_count,
                            SUM(amount) as total_spent,
                            SUM(CASE WHEN category = 'food' THEN amount ELSE 0 END) as food_spent,
                            SUM(CASE WHEN category = 'shopping' THEN amount ELSE 0 END) as shopping_spent
                        FROM transactions 
                        WHERE user_id = ? AND DATE(created_at) = CURDATE() AND status = 'success'
                    `, [user.user_id]);
                    
                    if (spending[0].total_spent > 0) {
                        await Notification.create(user.user_id, {
                            type: constants.NOTIFICATION_TYPES.REMINDER,
                            title: 'Daily Spending Summary 📊',
                            message: `Today's spending: ₹${spending[0].total_spent} in ${spending[0].transaction_count} transactions.`,
                            priority: constants.NOTIFICATION_PRIORITIES.LOW,
                            data: spending[0]
                        });
                    }
                }
                
                console.log(`✅ Daily summaries sent to ${users.length} users`);
                
            } catch (error) {
                console.error('❌ Error in daily summaries:', error);
            }
        });
        
        this.jobs.push({ name: 'daily_summary', job });
    }
    
    // Send weekly report on Sunday at 10 PM
    scheduleWeeklyReport() {
        const job = cron.schedule('0 22 * * 0', async () => {
            console.log('📊 Sending weekly reports...');
            
            try {
                const [users] = await db.pool.execute(
                    'SELECT id FROM users WHERE is_active = true'
                );
                
                for (const user of users) {
                    // Calculate weekly spending
                    const [stats] = await db.pool.execute(`
                        SELECT 
                            COUNT(*) as transaction_count,
                            SUM(amount) as total_spent,
                            AVG(amount) as avg_transaction,
                            COUNT(DISTINCT merchant) as unique_merchants
                        FROM transactions 
                        WHERE user_id = ? 
                            AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                            AND status = 'success'
                    `, [user.id]);
                    
                    // Calculate comparison with previous week
                    const [prevStats] = await db.pool.execute(`
                        SELECT SUM(amount) as total_spent
                        FROM transactions 
                        WHERE user_id = ? 
                            AND created_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY)
                            AND status = 'success'
                    `, [user.id]);
                    
                    const change = prevStats[0].total_spent 
                        ? ((stats[0].total_spent - prevStats[0].total_spent) / prevStats[0].total_spent * 100).toFixed(1)
                        : 0;
                    
                    const changeEmoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
                    
                    await Notification.create(user.id, {
                        type: constants.NOTIFICATION_TYPES.REMINDER,
                        title: 'Weekly Spending Report 📊',
                        message: `This week: ₹${stats[0].total_spent || 0} in ${stats[0].transaction_count || 0} transactions. ${changeEmoji} ${Math.abs(change)}% vs last week.`,
                        priority: constants.NOTIFICATION_PRIORITIES.MEDIUM,
                        data: {
                            current: stats[0],
                            previous: prevStats[0],
                            change: change
                        }
                    });
                }
                
                console.log(`✅ Weekly reports sent to ${users.length} users`);
                
            } catch (error) {
                console.error('❌ Error in weekly reports:', error);
            }
        });
        
        this.jobs.push({ name: 'weekly_report', job });
    }
    
    // Stop all cron jobs
    stopAll() {
        for (const job of this.jobs) {
            job.job.stop();
        }
        console.log('🛑 All cron jobs stopped');
        this.initialized = false;
    }
    
    // Start all cron jobs
    startAll() {
        for (const job of this.jobs) {
            job.job.start();
        }
        console.log('▶️ All cron jobs started');
    }
    
    // Manual trigger for coin expiry check
    async triggerCoinExpiryCheck() {
        console.log('🔍 Manually triggering coin expiry check...');
        
        const [rows] = await db.pool.execute(`
            SELECT user_id, SUM(amount) as total_coins, 
                   DATE_FORMAT(expiry_date, '%d %b %Y') as expiry_date
            FROM coins 
            WHERE expiry_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
                AND status = 'active'
            GROUP BY user_id, expiry_date
        `);
        
        for (const row of rows) {
            await Notification.createCoinExpiryNotification(
                row.user_id,
                row.total_coins,
                row.expiry_date
            );
        }
        
        console.log(`✅ Manual trigger complete. ${rows.length} notifications created.`);
        return rows;
    }
    
    // Manual trigger for monthly reset
    async triggerMonthlyReset() {
        console.log('🔄 Manually triggering monthly reset...');
        
        await db.pool.execute('UPDATE users SET current_spent = 0');
        await db.pool.execute('UPDATE agent_limits SET current_spent = 0');
        
        console.log('✅ Manual reset complete');
        return { success: true };
    }
}

module.exports = new CronService();