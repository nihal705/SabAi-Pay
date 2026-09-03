// backend/services/agentSecurityService.js
// Security decisions for Agent Pay - PIN vs Reserve Pay skip

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 */

const dbService = require('./databaseService');

class AgentSecurityService {
    constructor() {
        // SABAI_PAY_LITE is the global reserve limit merchant ID
        this.SABAI_PAY_LITE = 'sabai-pay-lite';
    }

    /**
     * Decide if a payment requires PIN or can use Reserve Pay (SabAI Pay Lite)
     * 
     * @param {string} userId - The user ID
     * @param {Object} transaction - Transaction details
     * @param {string} transaction.recipient - Recipient identifier (UPI, phone, bank account)
     * @param {string} transaction.recipientType - 'upi', 'phone', 'bank', 'contact'
     * @param {number} transaction.amount - Amount in INR
     * @param {string} transaction.type - 'send_money', 'pay_bill', 'recharge_mobile'
     * @param {string} transaction.category - 'p2p', 'bill', 'recharge'
     * @param {string} transaction.provider - For bills: provider name
     * @param {string} transaction.billerId - For bills: biller ID
     * @returns {Object} { requiresPin: boolean, method: 'reserve_pay'|'bank', limitRemaining: number, message: string }
     */
    async decideSecurity(userId, transaction) {
        try {
            // 1. Check if SabAI Pay Lite (global reserve limit) exists
            const sabaiPayLiteLimit = await dbService.getReserveLimit(userId, this.SABAI_PAY_LITE);
            
            // If no SabAI Pay Lite limit exists, PIN required
            if (!sabaiPayLiteLimit || !sabaiPayLiteLimit.is_active) {
                return {
                    requiresPin: true,
                    method: 'bank',
                    limitRemaining: 0,
                    message: 'No SabAI Pay Lite limit set. Please set a limit in Reserve Pay.'
                };
            }

            // Calculate remaining limit
            const limitRemaining = (sabaiPayLiteLimit.monthly_limit || 0) - (sabaiPayLiteLimit.current_spent || 0);
            
            // If amount exceeds remaining limit, PIN required (use bank)
            if (transaction.amount > limitRemaining) {
                return {
                    requiresPin: true,
                    method: 'bank',
                    limitRemaining: limitRemaining,
                    message: `Amount exceeds SabAI Pay Lite limit. Remaining: ₹${limitRemaining.toLocaleString()}`
                };
            }

            // 2. Check if this is a new recipient/biller
            const isNew = await this.isNewRecipient(userId, transaction);

            // 3. If new recipient → PIN required (even with SabAI Pay Lite)
            if (isNew) {
                return {
                    requiresPin: true,
                    method: 'reserve_pay',
                    limitRemaining: limitRemaining,
                    message: 'First-time recipient requires PIN verification for security.'
                };
            }

            // 4. Existing recipient + within SabAI Pay Lite limit → NO PIN
            return {
                requiresPin: false,
                method: 'reserve_pay',
                limitRemaining: limitRemaining - transaction.amount,
                message: `✅ Payment within SabAI Pay Lite limit. Remaining: ₹${(limitRemaining - transaction.amount).toLocaleString()}`
            };

        } catch (error) {
            console.error('❌ Security decision error:', error);
            // Default to PIN required on error
            return {
                requiresPin: true,
                method: 'bank',
                limitRemaining: 0,
                message: 'Security check failed. PIN required.'
            };
        }
    }

    /**
     * Check if a recipient/biller is new for the user
     */
    async isNewRecipient(userId, transaction) {
        try {
            if (transaction.type === 'send_money' || transaction.type === 'request_money') {
                // Check if user has ever paid to this recipient
                const contacts = await dbService.getContacts(userId);
                const recipientVpa = transaction.recipient;
                
                // Check if recipient exists in contacts
                const existingContact = contacts.find(c => 
                    c.vpa === recipientVpa || 
                    c.phone === recipientVpa ||
                    c.name?.toLowerCase() === transaction.recipient?.toLowerCase()
                );

                if (existingContact) {
                    // Check if there was a previous transaction with this contact
                    const transactions = await dbService.getTransactions(userId, 1000, 0);
                    const hasPreviousTxn = transactions.some(t => 
                        t.receiver_vpa === existingContact.vpa || 
                        t.receiver_vpa === existingContact.phone ||
                        t.sender_vpa === existingContact.vpa
                    );
                    return !hasPreviousTxn;
                }
                return true; // No contact found → new recipient

            } else if (transaction.type === 'pay_bill') {
                // Check if user has ever paid this biller
                const bills = await dbService.getBills(userId);
                const existingBill = bills.find(b => 
                    b.provider === transaction.provider && 
                    b.customer_id === transaction.customerId
                );
                
                if (existingBill) {
                    // Check if there was a previous payment to this biller
                    const paidBills = await dbService.getPaidBills(userId, 1000);
                    const hasPreviousPayment = paidBills.some(pb => 
                        pb.bill_id === existingBill.id
                    );
                    return !hasPreviousPayment;
                }
                return true; // No bill found → new biller

            } else if (transaction.type === 'recharge_mobile') {
                // Check if user has recharged this number before
                const recharges = await dbService.getRecentRecharges(userId, 100);
                const existingRecharge = recharges.find(r => 
                    r.mobile_number === transaction.mobileNumber
                );
                return !existingRecharge;

            } else if (transaction.type === 'multi_payment') {
                // For multi-payment, check each sub-transaction
                const payments = transaction.payments || [];
                for (const payment of payments) {
                    const isNew = await this.isNewRecipient(userId, payment);
                    if (isNew) return true;
                }
                return false;
            }

            return true; // Default: treat as new

        } catch (error) {
            console.error('❌ isNewRecipient error:', error);
            return true; // On error, treat as new (PIN required)
        }
    }

    /**
     * Check if SabAI Pay Lite is available for a transaction
     */
    async isSabAIPayLiteAvailable(userId, amount) {
        try {
            const sabaiPayLiteLimit = await dbService.getReserveLimit(userId, this.SABAI_PAY_LITE);
            if (!sabaiPayLiteLimit || !sabaiPayLiteLimit.is_active) {
                return { available: false, remaining: 0 };
            }
            const remaining = (sabaiPayLiteLimit.monthly_limit || 0) - (sabaiPayLiteLimit.current_spent || 0);
            return { 
                available: amount <= remaining, 
                remaining: remaining,
                limit: sabaiPayLiteLimit
            };
        } catch (error) {
            return { available: false, remaining: 0 };
        }
    }

    /**
     * Get SabAI Pay Lite limit details for a user
     */
    async getSabAIPayLiteLimit(userId) {
        try {
            return await dbService.getReserveLimit(userId, this.SABAI_PAY_LITE);
        } catch (error) {
            return null;
        }
    }
}

module.exports = new AgentSecurityService();