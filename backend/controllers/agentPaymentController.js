// backend/controllers/agentPaymentController.js
// COMPLETE FIXED VERSION - Consistent response shapes

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 */

const dbService = require('../services/databaseService');
const recipientResolverService = require('../services/recipientResolverService');
const billerCatalogService = require('../services/billerCatalogService');
const rechargePlanService = require('../services/rechargePlanService');
const agentSecurityService = require('../services/agentSecurityService');

class AgentPaymentController {
    constructor() {
        console.log('✅ AgentPaymentController initialized');
    }

    // ============================================
    // SEND MONEY
    // ============================================
    async sendMoney(userId, recipientText, amount, note = '') {
        try {
            const resolution = await recipientResolverService.resolve(recipientText, userId);
            
            if (!resolution.resolved && resolution.ambiguity) {
                return {
                    requiresAction: 'resolve_recipient',
                    candidates: resolution.candidates,
                    message: resolution.message,
                    status: 'pending'
                };
            }

            if (!resolution.resolved) {
                return {
                    error: resolution.message,
                    status: 'failed'
                };
            }

            const recipient = resolution.recipient;
            const security = await agentSecurityService.decideSecurity(userId, {
                type: 'send_money',
                category: 'p2p',
                recipient: recipient.vpa || recipient.phone || recipient.accountNumber,
                recipientType: recipient.type,
                amount: amount
            });

            const bankAccounts = await dbService.getBankAccounts(userId);
            const primaryBank = bankAccounts.find(b => b.is_primary) || bankAccounts[0];

            if (!primaryBank) {
                return {
                    error: 'No bank account linked. Please add a bank account.',
                    status: 'failed'
                };
            }

            const paymentData = {
                recipient: recipient,
                amount: amount,
                note: note,
                bankAccount: primaryBank,
                security: security,
                requiresPin: security.requiresPin,
                method: security.method
            };

            return {
                status: 'ready',
                requiresAction: 'confirm_payment',
                paymentData: paymentData,
                message: this.buildSendMoneyMessage(recipient, amount, security),
                type: 'send_money_card'
            };

        } catch (error) {
            console.error('❌ sendMoney error:', error);
            return { error: error.message, status: 'failed' };
        }
    }

    buildSendMoneyMessage(recipient, amount, security) {
        let message = `💸 **Send Money**\n\n`;
        message += `**To:** ${recipient.displayName || recipient.vpa}\n`;
        message += `**Amount:** ₹${amount.toLocaleString()}\n`;
        if (recipient.bankName) message += `**Bank:** ${recipient.bankName}\n`;
        message += `\n`;

        if (security.requiresPin) {
            message += `🔒 **PIN Required**\n`;
            message += `This requires your UPI PIN for security.\n\n`;
            message += `Please enter your PIN to confirm.`;
        } else {
            message += `✅ **SabAI Pay Lite Available**\n`;
            message += `Payment will be made from your SabAI Pay Lite limit.\n`;
            message += `Remaining limit: ₹${security.limitRemaining.toLocaleString()}\n\n`;
            message += `Tap "Confirm" to complete payment.`;
        }

        return message;
    }

    // ============================================
    // CONFIRM SEND MONEY
    // ============================================
    async confirmSendMoney(userId, paymentData, pin = null) {
        try {
            if (paymentData.requiresPin) {
                if (!pin) return { error: 'PIN required', status: 'failed' };
                const isValid = await dbService.verifyUpiPin(paymentData.bankAccount.id, pin);
                if (!isValid) return { error: 'Invalid PIN', status: 'failed' };
            }

            const amount = paymentData.amount;
            const fromAccountId = paymentData.bankAccount.id;
            
            const account = await dbService.getBankAccountById(fromAccountId, userId);
            const currentBalance = account?.balance || 0;
            
            if (currentBalance < amount) {
                return { 
                    error: `Insufficient balance. Available: ₹${currentBalance.toLocaleString()}`,
                    status: 'failed'
                };
            }

            await dbService.updateBankBalance(fromAccountId, amount, false);

            if (paymentData.method === 'reserve_pay') {
                await dbService.updateReserveLimitSpent(userId, 'sabai-pay-lite', amount);
            }

            const transactionId = `TXN${Date.now()}`;
            await dbService.createTransaction({
                transaction_id: transactionId,
                user_id: userId,
                type: 'send',
                amount: amount,
                status: 'success',
                description: paymentData.note || `Payment to ${paymentData.recipient.displayName || paymentData.recipient.vpa}`,
                receiver_vpa: paymentData.recipient.vpa,
                receiver_name: paymentData.recipient.displayName || paymentData.recipient.name,
                bank_name: paymentData.bankAccount.bank_name,
                bank_account_id: fromAccountId,
                payment_method_display: paymentData.method === 'reserve_pay' ? 'SabAI Pay Lite' : 'Bank Transfer',
                reserve_used: paymentData.method === 'reserve_pay' ? amount : 0,
                bank_used: paymentData.method === 'reserve_pay' ? 0 : amount
            });

            await dbService.createOrUpdateContact(
                userId,
                paymentData.recipient.displayName || paymentData.recipient.name || paymentData.recipient.vpa,
                paymentData.recipient.vpa,
                paymentData.recipient.phone,
                amount,
                false
            );

            return {
                success: true,
                transactionId: transactionId,
                amount: amount,
                recipient: paymentData.recipient.displayName || paymentData.recipient.vpa,
                method: paymentData.method === 'reserve_pay' ? 'SabAI Pay Lite' : 'Bank Transfer',
                message: `✅ Payment of ₹${amount.toLocaleString()} sent successfully!`
            };

        } catch (error) {
            console.error('❌ confirmSendMoney error:', error);
            return { error: error.message, status: 'failed' };
        }
    }

    // ============================================
    // REQUEST MONEY
    // ============================================
    async requestMoney(userId, recipientText, amount, note = '') {
        try {
            const resolution = await recipientResolverService.resolve(recipientText, userId);
            
            if (!resolution.resolved && resolution.ambiguity) {
                return {
                    requiresAction: 'resolve_recipient',
                    candidates: resolution.candidates,
                    message: resolution.message,
                    status: 'pending'
                };
            }

            if (!resolution.resolved) {
                return { error: resolution.message, status: 'failed' };
            }

            const recipient = resolution.recipient;
            const requestId = `REQ${Date.now()}`;
            
            await dbService.createMoneyRequest(userId, {
                requestId: requestId,
                amount: amount,
                requester_vpa: recipient.vpa || recipient.phone,
                requester_name: recipient.displayName || recipient.name,
                recipient_vpa: userId,
                description: note || 'Money request'
            });

            return {
                success: true,
                requestId: requestId,
                amount: amount,
                recipient: recipient.displayName || recipient.vpa,
                message: `💰 Request of ₹${amount.toLocaleString()} sent to ${recipient.displayName || recipient.vpa}!`,
                type: 'send_money_card'
            };

        } catch (error) {
            console.error('❌ requestMoney error:', error);
            return { error: error.message, status: 'failed' };
        }
    }

    // ============================================
    // PAY BILL
    // ============================================
    async payBill(userId, billType, provider, customerId, amount) {
        try {
            const biller = billerCatalogService.getBillerByName(provider);
            if (!biller) {
                return { 
                    error: `Bill provider "${provider}" not supported. Supported providers: ${billerCatalogService.getAllBillers().map(b => b.name).join(', ')}`,
                    status: 'failed'
                };
            }

            const security = await agentSecurityService.decideSecurity(userId, {
                type: 'pay_bill',
                category: 'bill',
                provider: provider,
                billerId: biller.id,
                customerId: customerId,
                amount: amount
            });

            const bankAccounts = await dbService.getBankAccounts(userId);
            const primaryBank = bankAccounts.find(b => b.is_primary) || bankAccounts[0];

            if (!primaryBank) {
                return {
                    error: 'No bank account linked. Please add a bank account.',
                    status: 'failed'
                };
            }

            const paymentData = {
                biller: biller,
                customerId: customerId,
                amount: amount,
                bankAccount: primaryBank,
                security: security,
                requiresPin: security.requiresPin,
                method: security.method
            };

            return {
                status: 'ready',
                requiresAction: 'confirm_payment',
                paymentData: paymentData,
                message: this.buildBillPaymentMessage(biller, customerId, amount, security),
                type: 'bill_pay_card'
            };

        } catch (error) {
            console.error('❌ payBill error:', error);
            return { error: error.message, status: 'failed' };
        }
    }

    buildBillPaymentMessage(biller, customerId, amount, security) {
        let message = `🧾 **Bill Payment**\n\n`;
        message += `**Provider:** ${biller.name}\n`;
        message += `**Customer ID:** ${customerId}\n`;
        message += `**Amount:** ₹${amount.toLocaleString()}\n`;
        message += `**Category:** ${biller.categoryName}\n\n`;

        if (security.requiresPin) {
            message += `🔒 **PIN Required**\n`;
            message += `This requires your UPI PIN for security.\n\n`;
            message += `Please enter your PIN to confirm.`;
        } else {
            message += `✅ **SabAI Pay Lite Available**\n`;
            message += `Payment will be made from your SabAI Pay Lite limit.\n`;
            message += `Remaining limit: ₹${security.limitRemaining.toLocaleString()}\n\n`;
            message += `Tap "Confirm" to complete payment.`;
        }

        return message;
    }

    // ============================================
    // CONFIRM BILL PAYMENT
    // ============================================
    async confirmBillPayment(userId, paymentData, pin = null) {
        try {
            if (paymentData.requiresPin) {
                if (!pin) return { error: 'PIN required', status: 'failed' };
                const isValid = await dbService.verifyUpiPin(paymentData.bankAccount.id, pin);
                if (!isValid) return { error: 'Invalid PIN', status: 'failed' };
            }

            const amount = paymentData.amount;
            const fromAccountId = paymentData.bankAccount.id;
            
            const account = await dbService.getBankAccountById(fromAccountId, userId);
            if ((account?.balance || 0) < amount) {
                return { 
                    error: `Insufficient balance. Available: ₹${(account?.balance || 0).toLocaleString()}`,
                    status: 'failed'
                };
            }

            await dbService.updateBankBalance(fromAccountId, amount, false);

            if (paymentData.method === 'reserve_pay') {
                await dbService.updateReserveLimitSpent(userId, 'sabai-pay-lite', amount);
            }

            const billId = await dbService.createBill(userId, {
                bill_type: paymentData.biller.category,
                provider: paymentData.biller.name,
                customer_id: paymentData.customerId,
                amount: amount,
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                auto_pay: false,
                reserve_pay_enabled: paymentData.method === 'reserve_pay'
            });

            const transactionId = `TXN${Date.now()}`;
            await dbService.markBillAsPaid(billId, userId, {
                payment_method: paymentData.method === 'reserve_pay' ? 'reserve_pay' : 'bank',
                payment_breakdown: {
                    bankAmount: paymentData.method === 'reserve_pay' ? 0 : amount,
                    reserveAmount: paymentData.method === 'reserve_pay' ? amount : 0
                },
                cashback_earned: 0,
                transaction_id: transactionId
            });

            await dbService.createTransaction({
                transaction_id: transactionId,
                user_id: userId,
                type: 'bill',
                amount: amount,
                status: 'success',
                description: `Bill payment to ${paymentData.biller.name}`,
                bill_type: paymentData.biller.category,
                customer_id: paymentData.customerId,
                provider: paymentData.biller.name,
                bank_name: paymentData.bankAccount.bank_name,
                bank_account_id: fromAccountId,
                payment_method_display: paymentData.method === 'reserve_pay' ? 'SabAI Pay Lite' : 'Bank Transfer',
                reserve_used: paymentData.method === 'reserve_pay' ? amount : 0,
                bank_used: paymentData.method === 'reserve_pay' ? 0 : amount
            });

            return {
                success: true,
                transactionId: transactionId,
                billId: billId,
                amount: amount,
                provider: paymentData.biller.name,
                method: paymentData.method === 'reserve_pay' ? 'SabAI Pay Lite' : 'Bank Transfer',
                message: `✅ Bill of ₹${amount.toLocaleString()} paid to ${paymentData.biller.name}!`
            };

        } catch (error) {
            console.error('❌ confirmBillPayment error:', error);
            return { error: error.message, status: 'failed' };
        }
    }

    // ============================================
    // RECHARGE MOBILE
    // ============================================
    async rechargeMobile(userId, mobileNumber, amount, plan = null) {
        try {
            if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
                return { 
                    error: 'Invalid mobile number. Please enter a 10-digit Indian number.',
                    status: 'failed' 
                };
            }

            const operator = rechargePlanService.detectOperator(mobileNumber);
            if (!operator) {
                return { 
                    error: 'Could not detect operator for this mobile number. Please verify the number.',
                    status: 'failed' 
                };
            }

            const plans = rechargePlanService.getPlans(operator.id);
            let selectedPlan = null;
            if (plan) {
                selectedPlan = plans.find(p => p.name.toLowerCase().includes(plan.toLowerCase()) || p.id === plan);
            }
            if (!selectedPlan && amount) {
                selectedPlan = rechargePlanService.getRecommendedPlan(operator.id, amount);
            }

            const security = await agentSecurityService.decideSecurity(userId, {
                type: 'recharge_mobile',
                category: 'recharge',
                mobileNumber: mobileNumber,
                amount: amount
            });

            const bankAccounts = await dbService.getBankAccounts(userId);
            const primaryBank = bankAccounts.find(b => b.is_primary) || bankAccounts[0];

            if (!primaryBank) {
                return {
                    error: 'No bank account linked. Please add a bank account.',
                    status: 'failed'
                };
            }

            const paymentData = {
                mobileNumber: mobileNumber,
                operator: operator,
                amount: amount,
                plan: selectedPlan,
                bankAccount: primaryBank,
                security: security,
                requiresPin: security.requiresPin,
                method: security.method,
                plans: plans
            };

            return {
                status: 'ready',
                requiresAction: 'confirm_payment',
                paymentData: paymentData,
                message: this.buildRechargeMessage(mobileNumber, operator, amount, selectedPlan, security),
                type: 'recharge_card'
            };

        } catch (error) {
            console.error('❌ rechargeMobile error:', error);
            return { error: error.message, status: 'failed' };
        }
    }

    buildRechargeMessage(mobileNumber, operator, amount, plan, security) {
        let message = `📱 **Mobile Recharge**\n\n`;
        message += `**Number:** ${mobileNumber}\n`;
        message += `**Operator:** ${operator.name}\n`;
        message += `**Amount:** ₹${amount.toLocaleString()}\n`;
        if (plan) {
            message += `**Plan:** ${plan.name}\n`;
            if (plan.data) message += `**Data:** ${plan.data}\n`;
            if (plan.validity) message += `**Validity:** ${plan.validity}\n`;
            if (plan.talktime) message += `**Talktime:** ${plan.talktime}\n`;
        }
        message += `\n`;

        if (security.requiresPin) {
            message += `🔒 **PIN Required**\n`;
            message += `This requires your UPI PIN for security.\n\n`;
            message += `Please enter your PIN to confirm.`;
        } else {
            message += `✅ **SabAI Pay Lite Available**\n`;
            message += `Recharge will be made from your SabAI Pay Lite limit.\n`;
            message += `Remaining limit: ₹${security.limitRemaining.toLocaleString()}\n\n`;
            message += `Tap "Confirm" to complete recharge.`;
        }

        return message;
    }

    // ============================================
    // CONFIRM RECHARGE
    // ============================================
    async confirmRecharge(userId, paymentData, pin = null) {
        try {
            if (paymentData.requiresPin) {
                if (!pin) return { error: 'PIN required', status: 'failed' };
                const isValid = await dbService.verifyUpiPin(paymentData.bankAccount.id, pin);
                if (!isValid) return { error: 'Invalid PIN', status: 'failed' };
            }

            const amount = paymentData.amount;
            const fromAccountId = paymentData.bankAccount.id;
            
            const account = await dbService.getBankAccountById(fromAccountId, userId);
            if ((account?.balance || 0) < amount) {
                return { 
                    error: `Insufficient balance. Available: ₹${(account?.balance || 0).toLocaleString()}`,
                    status: 'failed'
                };
            }

            await dbService.updateBankBalance(fromAccountId, amount, false);

            if (paymentData.method === 'reserve_pay') {
                await dbService.updateReserveLimitSpent(userId, 'sabai-pay-lite', amount);
            }

            const cashbackEarned = paymentData.method === 'reserve_pay' ? Math.min(Math.floor(amount * 0.05), 100) : 0;

            if (cashbackEarned > 0) {
                await dbService.updateCoinBalance(userId, cashbackEarned, true);
            }

            const transactionId = `TXN${Date.now()}`;
            await dbService.addRecentRecharge(userId, {
                mobileNumber: paymentData.mobileNumber,
                operator: paymentData.operator.id,
                operatorId: paymentData.operator.id,
                amount: amount,
                circle: 'National',
                transactionId: transactionId,
                cashbackEarned: cashbackEarned,
                paymentMethod: paymentData.method === 'reserve_pay' ? 'reserve_pay' : 'bank'
            });

            await dbService.createTransaction({
                transaction_id: transactionId,
                user_id: userId,
                type: 'recharge',
                amount: amount,
                status: 'success',
                description: `Mobile recharge for ${paymentData.mobileNumber}`,
                mobile_number: paymentData.mobileNumber,
                operator: paymentData.operator.id,
                cashback_earned: cashbackEarned,
                bank_name: paymentData.bankAccount.bank_name,
                bank_account_id: fromAccountId,
                payment_method_display: paymentData.method === 'reserve_pay' ? 'SabAI Pay Lite' : 'Bank Transfer',
                reserve_used: paymentData.method === 'reserve_pay' ? amount : 0,
                bank_used: paymentData.method === 'reserve_pay' ? 0 : amount
            });

            return {
                success: true,
                transactionId: transactionId,
                amount: amount,
                mobileNumber: paymentData.mobileNumber,
                operator: paymentData.operator.name,
                cashbackEarned: cashbackEarned,
                method: paymentData.method === 'reserve_pay' ? 'SabAI Pay Lite' : 'Bank Transfer',
                message: `✅ Recharge of ₹${amount.toLocaleString()} completed for ${paymentData.mobileNumber}!${cashbackEarned > 0 ? ` +${cashbackEarned} 🪙 earned!` : ''}`
            };

        } catch (error) {
            console.error('❌ confirmRecharge error:', error);
            return { error: error.message, status: 'failed' };
        }
    }

    // ============================================
    // MULTI PAYMENT
    // ============================================
    async multiPayment(userId, payments) {
        try {
            const results = [];
            const failed = [];

            for (const payment of payments) {
                let result;
                if (payment.type === 'send_money') {
                    result = await this.sendMoney(userId, payment.data.recipient, payment.data.amount, payment.data.note);
                } else if (payment.type === 'pay_bill') {
                    result = await this.payBill(userId, payment.data.billType, payment.data.provider, payment.data.customerId, payment.data.amount);
                } else if (payment.type === 'recharge_mobile') {
                    result = await this.rechargeMobile(userId, payment.data.mobileNumber, payment.data.amount, payment.data.plan);
                } else {
                    result = { error: `Unknown payment type: ${payment.type}`, status: 'failed' };
                }

                if (result.status === 'ready' || result.success) {
                    results.push({ ...result, type: payment.type });
                } else {
                    failed.push({ ...result, type: payment.type });
                }
            }

            const allReady = results.every(r => r.status === 'ready');
            const anyFailed = failed.length > 0;

            if (anyFailed) {
                return {
                    status: 'partial',
                    message: `${failed.length} payment(s) failed.`,
                    results: results,
                    failed: failed
                };
            }

            if (allReady && results.length > 0) {
                return {
                    status: 'ready',
                    requiresAction: 'confirm_payment',
                    payments: results,
                    message: `📋 **Multi-Payment Summary**\n\n${results.map((r, i) => `${i+1}. ${r.type}: ₹${r.paymentData.amount.toLocaleString()}`).join('\n')}\n\nAll payments can be confirmed with one action!`,
                    type: 'multi_payment_card'
                };
            }

            return {
                status: 'completed',
                results: results,
                message: `✅ ${results.length} payment(s) completed successfully!`
            };

        } catch (error) {
            console.error('❌ multiPayment error:', error);
            return { error: error.message, status: 'failed' };
        }
    }
}

module.exports = new AgentPaymentController();