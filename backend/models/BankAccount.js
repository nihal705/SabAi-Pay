// backend/models/BankAccount.js
// Bank Account model for database operations

const db = require('../config/database');

class BankAccount {
    
    // Add new bank account
    static async add(userId, accountData) {
        const {
            account_number, ifsc_code, bank_name,
            account_holder_name, account_type
        } = accountData;
        
        // Check if this is the first account (make it primary)
        const existingAccounts = await this.findByUserId(userId);
        const isPrimary = !existingAccounts.success || existingAccounts.data.length === 0;
        
        const query = `
            INSERT INTO bank_accounts (
                user_id, account_number, ifsc_code, bank_name,
                account_holder_name, account_type, is_primary, is_verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            userId,
            account_number,
            ifsc_code,
            bank_name,
            account_holder_name,
            account_type || 'savings',
            isPrimary,
            false
        ];
        
        const result = await db.executeQuery(query, params);
        
        if (result.success) {
            return {
                success: true,
                data: {
                    id: result.data.insertId,
                    ...accountData,
                    is_primary: isPrimary,
                    is_verified: false
                }
            };
        }
        
        return result;
    }
    
    // Find accounts by user ID
    static async findByUserId(userId) {
        const query = `
            SELECT * FROM bank_accounts 
            WHERE user_id = ? 
            ORDER BY is_primary DESC, created_at DESC
        `;
        return await db.executeQuery(query, [userId]);
    }
    
    // Find account by ID
    static async findById(id) {
        const query = 'SELECT * FROM bank_accounts WHERE id = ?';
        return await db.getOne(query, [id]);
    }
    
    // Verify bank account
    static async verify(id) {
        const query = `
            UPDATE bank_accounts 
            SET is_verified = true, verification_date = NOW() 
            WHERE id = ?
        `;
        const result = await db.executeQuery(query, [id]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'Bank account verified' };
        }
        
        return { success: false, error: 'Bank account not found' };
    }
    
    // Set as primary account
    static async setPrimary(userId, accountId) {
        // First, unset all primary accounts for this user
        await db.executeQuery(
            'UPDATE bank_accounts SET is_primary = false WHERE user_id = ?',
            [userId]
        );
        
        // Then set the selected account as primary
        const query = 'UPDATE bank_accounts SET is_primary = true WHERE id = ? AND user_id = ?';
        const result = await db.executeQuery(query, [accountId, userId]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'Primary account updated' };
        }
        
        return { success: false, error: 'Bank account not found' };
    }
    
    // Delete bank account
    static async delete(userId, accountId) {
        // Check if this is the only account
        const accounts = await this.findByUserId(userId);
        
        if (accounts.success && accounts.data.length === 1) {
            return { 
                success: false, 
                error: 'Cannot delete the only bank account. Add another account first.' 
            };
        }
        
        const query = 'DELETE FROM bank_accounts WHERE id = ? AND user_id = ?';
        const result = await db.executeQuery(query, [accountId, userId]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'Bank account deleted' };
        }
        
        return { success: false, error: 'Bank account not found' };
    }
    
    // Get primary account
    static async getPrimary(userId) {
        const query = 'SELECT * FROM bank_accounts WHERE user_id = ? AND is_primary = true';
        return await db.getOne(query, [userId]);
    }
    
    // Update VPA (UPI ID) for account
    static async updateVpa(accountId, vpa) {
        const query = 'UPDATE bank_accounts SET vpa = ? WHERE id = ?';
        const result = await db.executeQuery(query, [vpa, accountId]);
        
        if (result.success && result.data.affectedRows > 0) {
            return { success: true, message: 'UPI ID updated' };
        }
        
        return { success: false, error: 'Bank account not found' };
    }
    
    // Get verified accounts only
    static async getVerifiedAccounts(userId) {
        const query = `
            SELECT * FROM bank_accounts 
            WHERE user_id = ? AND is_verified = true
            ORDER BY is_primary DESC
        `;
        return await db.executeQuery(query, [userId]);
    }
}

module.exports = BankAccount;