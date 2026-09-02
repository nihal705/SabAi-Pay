// backend/routes/featureRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const dbService = require('../services/databaseService');
const crypto = require('crypto');

// ============================================
// BIOMETRIC AUTHENTICATION
// ============================================

// Register biometric device
router.post('/biometric/register', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { deviceName, credentialId, publicKey } = req.body;
        
        await dbService.saveBiometricCredential(userId, {
            deviceName,
            credentialId,
            publicKey,
            created_at: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'Biometric registered successfully' });
    } catch (error) {
        console.error('Biometric registration error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify biometric for payment
router.post('/biometric/verify', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { credentialId, signature } = req.body;
        
        const isValid = await dbService.verifyBiometric(userId, credentialId, signature);
        
        res.json({ 
            success: true, 
            data: { verified: isValid } 
        });
    } catch (error) {
        console.error('Biometric verification error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// SPLIT PAYMENTS
// ============================================

// Create split payment request
router.post('/split/create', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { totalAmount, participants, note, splitType } = req.body;
        
        const splitId = `SPLIT_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        // Calculate shares
        let shares = {};
        if (splitType === 'equal') {
            const equalShare = totalAmount / participants.length;
            participants.forEach(p => {
                shares[p.id] = equalShare;
            });
        } else {
            // Custom shares
            participants.forEach(p => {
                shares[p.id] = p.amount || 0;
            });
        }
        
        const splitData = {
            splitId,
            createdBy: userId,
            totalAmount,
            participants: participants.map(p => ({
                id: p.id,
                name: p.name,
                vpa: p.vpa,
                share: shares[p.id] || 0,
                status: 'pending'
            })),
            note,
            splitType,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        await dbService.saveSplitPayment(splitData);
        
        // Create notifications for participants
        for (const participant of splitData.participants) {
            await dbService.createNotification({
                userId: participant.id,
                type: 'split_request',
                title: `Split payment request`,
                message: `${req.user.name} requested ₹${participant.share} for split payment`,
                data: { splitId, amount: participant.share },
                createdAt: new Date().toISOString()
            });
        }
        
        res.json({ success: true, data: splitData });
    } catch (error) {
        console.error('Split creation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get split payments for user
router.get('/split/list', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const splits = await dbService.getSplitPayments(userId);
        res.json({ success: true, data: splits });
    } catch (error) {
        console.error('Get splits error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Pay split share
router.post('/split/pay', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { splitId, amount } = req.body;
        
        const result = await dbService.paySplitShare(splitId, userId, amount);
        
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Split payment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// TRANSACTION EXPORT
// ============================================

router.get('/transactions/export', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { format = 'csv', startDate, endDate } = req.query;
        
        const transactions = await dbService.getTransactions(userId, 10000, 0);
        
        let filtered = transactions;
        if (startDate && endDate) {
            filtered = transactions.filter(t => {
                const date = new Date(t.created_at || t.date);
                return date >= new Date(startDate) && date <= new Date(endDate);
            });
        }
        
        // Format for export
        const exportData = filtered.map(t => ({
            'Transaction ID': t.transaction_id || t.transactionId,
            'Date': t.created_at || t.date,
            'Type': t.type,
            'Amount': t.amount,
            'Description': t.description,
            'Status': t.status,
            'Payment Method': t.payment_method_display || t.payment_method
        }));
        
        if (format === 'csv') {
            const csv = await generateCSV(exportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=transactions_${Date.now()}.csv`);
            res.send(csv);
        } else if (format === 'pdf') {
            const pdf = await generatePDF(exportData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=transactions_${Date.now()}.pdf`);
            res.send(pdf);
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// FAVORITE CONTACTS
// ============================================

router.post('/contacts/favorite', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { contactId, favorite } = req.body;
        
        await dbService.updateContactFavorite(userId, contactId, favorite);
        
        res.json({ success: true, message: favorite ? 'Added to favorites' : 'Removed from favorites' });
    } catch (error) {
        console.error('Favorite update error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get favorite contacts
router.get('/contacts/favorites', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const favorites = await dbService.getFavoriteContacts(userId);
        res.json({ success: true, data: favorites });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PAYMENT REMINDERS
// ============================================

router.post('/reminders/create', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, dueDate, amount, contactId } = req.body;
        
        const reminder = {
            id: `REM_${Date.now()}`,
            userId,
            title,
            description,
            dueDate,
            amount,
            contactId,
            status: 'active',
            created_at: new Date().toISOString()
        };
        
        await dbService.saveReminder(reminder);
        
        res.json({ success: true, data: reminder });
    } catch (error) {
        console.error('Reminder creation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get reminders
router.get('/reminders/list', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const reminders = await dbService.getReminders(userId);
        res.json({ success: true, data: reminders });
    } catch (error) {
        console.error('Get reminders error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// VIRTUAL CARDS
// ============================================

router.post('/virtual-card/create', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardName, limit, expiryDate } = req.body;
        
        const card = {
            cardId: `VC_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            userId,
            cardName,
            limit,
            used: 0,
            expiryDate,
            status: 'active',
            upiId: `vc_${crypto.randomBytes(4).toString('hex')}@sabai`,
            created_at: new Date().toISOString()
        };
        
        await dbService.saveVirtualCard(card);
        
        res.json({ success: true, data: card });
    } catch (error) {
        console.error('Virtual card creation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get virtual cards
router.get('/virtual-card/list', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const cards = await dbService.getVirtualCards(userId);
        res.json({ success: true, data: cards });
    } catch (error) {
        console.error('Get virtual cards error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;