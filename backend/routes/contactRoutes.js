// backend/routes/contactRoutes.js
// COMPLETE WORKING VERSION

const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');
const { verifyToken } = require('../middleware/auth');

// Get all contacts
router.get('/', verifyToken, async (req, res) => {
    try {
        const contacts = await dbService.getContacts(req.user.id);
        res.json({ success: true, data: contacts });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ success: false, message: 'Failed to get contacts' });
    }
});

// Create or update contact
// In backend/routes/contactRoutes.js, make sure the POST route works

router.post('/', verifyToken, async (req, res) => {
    const { name, vpa, phone, amount, is_received } = req.body;
    
    try {
        // Check if contact already exists
        const existingContacts = await dbService.getContacts(req.user.id);
        const existingContact = existingContacts.find(c => c.vpa === vpa);
        
        if (existingContact) {
            // Update existing contact
            if (is_received) {
                await dbService.createOrUpdateContact(
                    req.user.id, name, vpa, phone, amount, true
                );
            } else {
                await dbService.createOrUpdateContact(
                    req.user.id, name, vpa, phone, amount, false
                );
            }
        } else {
            // Create new contact
            await dbService.createOrUpdateContact(
                req.user.id, name, vpa, phone, amount, is_received || false
            );
        }
        
        res.json({ success: true, message: 'Contact saved' });
    } catch (error) {
        console.error('Save contact error:', error);
        res.status(500).json({ success: false, message: 'Failed to save contact' });
    }
});

module.exports = router;