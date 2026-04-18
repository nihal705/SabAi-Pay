// backend/models/BankBalance.js
// Bank balance tracking for each linked account

const db = require('../config/database');

class BankBalance {
    
    // Initialize balance for a new bank account
    static async initializeBalance(userId, bankAccountId, bankName) {
        const query = `
            INSERT INTO bank_balances (user_id, bank_account_id, bank_name, balance)
            VALUES (?, ?, ?, ?)
        `;
        return await db.executeQuery(query, [userId, bankAccountId, bankName, 0]);
    }
    
    // Get balance for a specific bank account
    static async getBalance(bankAccountId) {
        const query = 'SELECT balance FROM bank_balances WHERE bank_account_id = ?';
        return await db.getOne(query, [bankAccountId]);
    }
    
    // Get all bank balances for a user
    static async getUserBalances(userId) {
        const query = `
            SELECT bb.*, ba.bank_name, ba.account_number, ba.is_primary
            FROM bank_balances bb
            JOIN bank_accounts ba ON bb.bank_account_id = ba.id
            WHERE bb.user_id = ?
            ORDER BY ba.is_primary DESC, bb.updated_at DESC
        `;
        return await db.executeQuery(query, [userId]);
    }
    
    // Deposit money to bank account
    static async deposit(bankAccountId, amount, transactionId = null) {
        const query = `
            UPDATE bank_balances 
            SET balance = balance + ?, 
                updated_at = NOW()
            WHERE bank_account_id = ?
        `;
        const result = await db.executeQuery(query, [amount, bankAccountId]);
        
        if (result.success && result.data.affectedRows > 0) {
            // Record transaction
            if (transactionId) {
                await this.recordTransaction(bankAccountId, 'deposit', amount, transactionId);
            }
            return { success: true, message: `₹${amount} deposited successfully` };
        }
        return { success: false, error: 'Failed to deposit' };
    }
    
    // Withdraw money from bank account
    static async withdraw(bankAccountId, amount, transactionId = null) {
        // Check sufficient balance
        const balanceResult = await this.getBalance(bankAccountId);
        if (!balanceResult.success || balanceResult.data.balance < amount) {
            return { success: false, error: 'Insufficient balance' };
        }
        
        const query = `
            UPDATE bank_balances 
            SET balance = balance - ?, 
                updated_at = NOW()
            WHERE bank_account_id = ? AND balance >= ?
        `;
        const result = await db.executeQuery(query, [amount, bankAccountId, amount]);
        
        if (result.success && result.data.affectedRows > 0) {
            // Record transaction
            if (transactionId) {
                await this.recordTransaction(bankAccountId, 'withdrawal', amount, transactionId);
            }
            return { success: true, message: `₹${amount} withdrawn successfully` };
        }
        return { success: false, error: 'Insufficient balance' };
    }
    
    // Reserve Pay: Add money to limit (from bank account)
    static async addToReserveLimit(userId, bankAccountId, merchantId, amount, limitId, transactionId = null) {
        // First withdraw from bank account
        const withdrawResult = await this.withdraw(bankAccountId, amount, transactionId);
        if (!withdrawResult.success) {
            return withdrawResult;
        }
        
        // Then add to reserve limit
        const reserveLimitQuery = `
            UPDATE reserve_limits 
            SET monthly_limit = monthly_limit + ?, 
                last_updated = NOW()
            WHERE id = ? AND user_id = ?
        `;
        const limitResult = await db.executeQuery(reserveLimitQuery, [amount, limitId, userId]);
        
        if (limitResult.success) {
            // Record reserve transaction
            await this.recordReserveTransaction(userId, bankAccountId, merchantId, amount, 'add', transactionId);
            return { success: true, message: `₹${amount} added to ${merchantId} limit` };
        }
        
        // Rollback withdrawal if limit update fails
        await this.deposit(bankAccountId, amount, transactionId);
        return { success: false, error: 'Failed to add to reserve limit' };
    }
    
    // Reserve Pay: Withdraw from limit back to bank account
    static async withdrawFromReserveLimit(userId, bankAccountId, merchantId, amount, limitId, transactionId = null) {
        // Check if enough in limit
        const limitCheckQuery = `
            SELECT monthly_limit, current_spent 
            FROM reserve_limits 
            WHERE id = ? AND user_id = ?
        `;
        const limitCheck = await db.getOne(limitCheckQuery, [limitId, userId]);
        
        if (!limitCheck.success) {
            return { success: false, error: 'Limit not found' };
        }
        
        const availableInLimit = limitCheck.data.monthly_limit - limitCheck.data.current_spent;
        if (availableInLimit < amount) {
            return { success: false, error: 'Insufficient amount in limit' };
        }
        
        // Reduce the limit
        const reduceLimitQuery = `
            UPDATE reserve_limits 
            SET monthly_limit = monthly_limit - ?
            WHERE id = ? AND user_id = ?
        `;
        const reduceResult = await db.executeQuery(reduceLimitQuery, [amount, limitId, userId]);
        
        if (reduceResult.success) {
            // Deposit back to bank account
            const depositResult = await this.deposit(bankAccountId, amount, transactionId);
            if (depositResult.success) {
                await this.recordReserveTransaction(userId, bankAccountId, merchantId, amount, 'remove', transactionId);
                return { success: true, message: `₹${amount} returned to bank account` };
            }
        }
        
        return { success: false, error: 'Failed to withdraw from limit' };
    }
    
    // Record bank transaction
    static async recordTransaction(bankAccountId, type, amount, transactionId) {
        const query = `
            INSERT INTO bank_transactions (bank_account_id, type, amount, transaction_id, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
        return await db.executeQuery(query, [bankAccountId, type, amount, transactionId]);
    }
    
    // Record reserve limit transaction
    static async recordReserveTransaction(userId, bankAccountId, merchantId, amount, action, transactionId) {
        const query = `
            INSERT INTO reserve_limit_transactions (user_id, bank_account_id, merchant_id, amount, action, transaction_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        return await db.executeQuery(query, [userId, bankAccountId, merchantId, amount, action, transactionId]);
    }
    
    // Transfer between bank accounts
    static async transfer(fromAccountId, toAccountId, amount, transactionId = null) {
        // Withdraw from source
        const withdrawResult = await this.withdraw(fromAccountId, amount, transactionId);
        if (!withdrawResult.success) {
            return withdrawResult;
        }
        
        // Deposit to destination
        const depositResult = await this.deposit(toAccountId, amount, transactionId);
        if (!depositResult.success) {
            // Rollback withdrawal
            await this.deposit(fromAccountId, amount, transactionId);
            return depositResult;
        }
        
        return { success: true, message: `₹${amount} transferred successfully` };
    }
    
    // Send money via UPI (from bank account)
    static async sendMoney(userId, fromAccountId, receiverVpa, amount, transactionId = null) {
        const withdrawResult = await this.withdraw(fromAccountId, amount, transactionId);
        if (!withdrawResult.success) {
            return withdrawResult;
        }
        
        // Record send transaction
        const query = `
            INSERT INTO upi_transactions (user_id, from_account_id, receiver_vpa, amount, transaction_id, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'success', NOW())
        `;
        await db.executeQuery(query, [userId, fromAccountId, receiverVpa, amount, transactionId]);
        
        return { success: true, message: `₹${amount} sent to ${receiverVpa}` };
    }
}

module.exports = BankBalance;