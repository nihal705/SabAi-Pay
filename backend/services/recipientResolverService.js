// backend/services/recipientResolverService.js
// Resolve text to recipient (UPI, phone, bank account, contact)

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 */

const dbService = require('./databaseService');

class RecipientResolverService {
    constructor() {
        // UPI handles mapping to banks
        this.upiHandles = {
            '@sbi': 'State Bank of India',
            '@oksbi': 'State Bank of India',
            '@hdfc': 'HDFC Bank',
            '@okhdfcbank': 'HDFC Bank',
            '@icici': 'ICICI Bank',
            '@okicici': 'ICICI Bank',
            '@axis': 'Axis Bank',
            '@okaxis': 'Axis Bank',
            '@ybl': 'Yes Bank',
            '@okyes': 'Yes Bank',
            '@baroda': 'Bank of Baroda',
            '@okbob': 'Bank of Baroda',
            '@paytm': 'Paytm Payments Bank',
            '@kotak': 'Kotak Mahindra Bank',
            '@okkotak': 'Kotak Mahindra Bank',
            '@canara': 'Canara Bank',
            '@okcanara': 'Canara Bank',
            '@pnb': 'Punjab National Bank',
            '@okpnb': 'Punjab National Bank',
            '@union': 'Union Bank of India',
            '@okuboi': 'Union Bank of India',
            '@indus': 'IndusInd Bank',
            '@okindus': 'IndusInd Bank',
            '@idfc': 'IDFC First Bank',
            '@okidfc': 'IDFC First Bank',
            '@federal': 'Federal Bank',
            '@okfed': 'Federal Bank',
            '@sib': 'South Indian Bank',
            '@oksib': 'South Indian Bank',
            '@iob': 'Indian Overseas Bank',
            '@okiob': 'Indian Overseas Bank',
            '@indian': 'Indian Bank',
            '@okindian': 'Indian Bank',
            '@ktk': 'Karnataka Bank',
            '@karnataka': 'Karnataka Bank'
        };
    }

    /**
     * Resolve a text string to a canonical recipient object
     * 
     * @param {string} text - Raw text (UPI ID, phone, name, bank account)
     * @param {string} userId - User ID for contact lookup
     * @returns {Object} { resolved: boolean, recipient: Object, candidates: Array, ambiguity: boolean }
     */
    async resolve(text, userId) {
        const trimmed = text.trim();
        
        // 1. Check if it's a UPI ID (contains @)
        if (trimmed.includes('@')) {
            const upiResult = this.resolveUPI(trimmed);
            if (upiResult) {
                return { resolved: true, recipient: upiResult, candidates: [], ambiguity: false };
            }
        }

        // 2. Check if it's a phone number (10 digits, starts with 6-9)
        if (/^[6-9]\d{9}$/.test(trimmed)) {
            const phoneResult = await this.resolvePhone(trimmed, userId);
            if (phoneResult) {
                return { resolved: true, recipient: phoneResult, candidates: [], ambiguity: false };
            }
        }

        // 3. Check if it's a contact name (look up in user's contacts)
        const contactResult = await this.resolveContact(trimmed, userId);
        if (contactResult) {
            if (contactResult.length === 1) {
                return { resolved: true, recipient: contactResult[0], candidates: [], ambiguity: false };
            }
            if (contactResult.length > 1) {
                return { 
                    resolved: false, 
                    recipient: null, 
                    candidates: contactResult, 
                    ambiguity: true,
                    message: `Multiple contacts found with name "${trimmed}". Please specify.`
                };
            }
        }

        // 4. Check if it's a bank account number + IFSC (format: account/ifsc)
        if (trimmed.includes('/') || trimmed.includes('-')) {
            const bankResult = this.resolveBankAccount(trimmed);
            if (bankResult) {
                return { resolved: true, recipient: bankResult, candidates: [], ambiguity: false };
            }
        }

        // 5. Check if it's a saved contact by VPA match
        const vpaContactResult = await this.resolveContactByVPA(trimmed, userId);
        if (vpaContactResult) {
            return { resolved: true, recipient: vpaContactResult, candidates: [], ambiguity: false };
        }

        // 6. Not resolved - return candidates for disambiguation
        const nameMatches = await this.findByName(trimmed, userId);
        if (nameMatches.length > 0) {
            return {
                resolved: false,
                recipient: null,
                candidates: nameMatches,
                ambiguity: true,
                message: `Did you mean one of these contacts?`
            };
        }

        // No resolution
        return {
            resolved: false,
            recipient: null,
            candidates: [],
            ambiguity: false,
            message: `Could not resolve "${text}". Please provide a UPI ID, phone number, or contact name.`
        };
    }

    /**
     * Resolve UPI ID
     */
    resolveUPI(upiId) {
        const lower = upiId.toLowerCase();
        let bankName = null;
        let handle = null;

        // Find matching UPI handle
        for (const [key, value] of Object.entries(this.upiHandles)) {
            if (lower.includes(key)) {
                bankName = value;
                handle = key;
                break;
            }
        }

        // If no handle found, use default
        if (!bankName) {
            // Try to extract handle from UPI ID
            const atIndex = lower.indexOf('@');
            if (atIndex !== -1) {
                const extractedHandle = lower.substring(atIndex);
                // Check if it's a known handle
                for (const [key, value] of Object.entries(this.upiHandles)) {
                    if (extractedHandle === key) {
                        bankName = value;
                        handle = key;
                        break;
                    }
                }
            }
        }

        return {
            type: 'upi',
            vpa: upiId,
            bankName: bankName || 'Unknown Bank',
            upiHandle: handle || upiId.split('@')[1] || '',
            displayName: upiId.split('@')[0] || upiId,
            isVerified: true
        };
    }

    /**
     * Resolve phone number
     */
    async resolvePhone(phone, userId) {
        // Check if this phone is in contacts
        const contacts = await dbService.getContacts(userId);
        const contact = contacts.find(c => c.phone === phone);
        
        if (contact) {
            return {
                type: 'contact',
                id: contact.id,
                name: contact.name,
                phone: phone,
                vpa: contact.vpa,
                displayName: contact.name,
                isVerified: true
            };
        }

        // If not in contacts, return basic phone info
        return {
            type: 'phone',
            phone: phone,
            displayName: phone,
            isVerified: false,
            message: 'This phone number is not in your contacts. Please verify before sending.'
        };
    }

    /**
     * Resolve contact by name
     */
    async resolveContact(name, userId) {
        const contacts = await dbService.getContacts(userId);
        const matches = contacts.filter(c => 
            c.name?.toLowerCase().includes(name.toLowerCase()) ||
            c.name?.toLowerCase() === name.toLowerCase()
        );
        return matches.map(c => ({
            type: 'contact',
            id: c.id,
            name: c.name,
            phone: c.phone,
            vpa: c.vpa,
            displayName: c.name,
            isVerified: true
        }));
    }

    /**
     * Resolve contact by VPA
     */
    async resolveContactByVPA(vpa, userId) {
        const contacts = await dbService.getContacts(userId);
        const contact = contacts.find(c => c.vpa === vpa || c.vpa?.toLowerCase() === vpa.toLowerCase());
        
        if (contact) {
            return {
                type: 'contact',
                id: contact.id,
                name: contact.name,
                phone: contact.phone,
                vpa: contact.vpa,
                displayName: contact.name,
                isVerified: true
            };
        }
        return null;
    }

    /**
     * Resolve bank account (account/ifsc format)
     */
    resolveBankAccount(text) {
        // Try to parse account/ifsc format
        const parts = text.split(/[/-]/);
        if (parts.length === 2) {
            const accountNumber = parts[0].trim();
            const ifscCode = parts[1].trim().toUpperCase();
            
            if (accountNumber.length >= 9 && ifscCode.length === 11) {
                return {
                    type: 'bank_account',
                    accountNumber: accountNumber,
                    ifscCode: ifscCode,
                    displayName: `${accountNumber.slice(-4)} (${ifscCode})`,
                    isVerified: false,
                    message: 'Bank account verification required. Please confirm the account details.'
                };
            }
        }
        return null;
    }

    /**
     * Find contacts by name (fuzzy match)
     */
    async findByName(name, userId) {
        const contacts = await dbService.getContacts(userId);
        const lowerName = name.toLowerCase();
        return contacts.filter(c => 
            c.name?.toLowerCase().includes(lowerName) ||
            c.name?.toLowerCase() === lowerName
        ).map(c => ({
            type: 'contact',
            id: c.id,
            name: c.name,
            phone: c.phone,
            vpa: c.vpa,
            displayName: c.name,
            isVerified: true
        }));
    }

    /**
     * Get bank name from UPI handle
     */
    getBankFromHandle(handle) {
        return this.upiHandles[handle.toLowerCase()] || null;
    }

    /**
     * Format a resolved recipient for display
     */
    formatRecipient(recipient) {
        if (!recipient) return 'Unknown';
        
        if (recipient.type === 'upi') {
            return `${recipient.displayName} (${recipient.vpa})`;
        }
        if (recipient.type === 'contact') {
            return `${recipient.name} (${recipient.vpa || recipient.phone})`;
        }
        if (recipient.type === 'phone') {
            return `Phone: ${recipient.phone}`;
        }
        if (recipient.type === 'bank_account') {
            return `Account: ${recipient.displayName}`;
        }
        return recipient.displayName || 'Unknown';
    }
}

module.exports = new RecipientResolverService();