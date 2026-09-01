// backend/routes/moneyRequestRoutes.js (continued)
const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');
const { verifyToken } = require('../middleware/auth');

// Get money requests
router.get('/', verifyToken, async (req, res) => {
    const { status } = req.query;
    
    try {
        const requests = await dbService.getMoneyRequests(req.user.id, status);
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('Get money requests error:', error);
        res.status(500).json({ success: false, message: 'Failed to get requests' });
    }
});

// Create money request
router.post('/', verifyToken, async (req, res) => {
    const { amount, requester_vpa, requester_name, recipient_vpa, recipient_name, description } = req.body;
    
    try {
        const requestId = `REQ${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        await dbService.createMoneyRequest(req.user.id, {
            requestId,
            amount,
            requester_vpa,
            requester_name,
            recipient_vpa,
            recipient_name,
            description
        });
        
        res.json({ success: true, data: { requestId } });
    } catch (error) {
        console.error('Create money request error:', error);
        res.status(500).json({ success: false, message: 'Failed to create request' });
    }
});

// Update request status
router.put('/:requestId/status', verifyToken, async (req, res) => {
    const { status } = req.body;
    
    try {
        if (!['accepted', 'declined', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid request status' });
        }
        await dbService.updateMoneyRequestStatus(req.params.requestId, status, req.user.id);
        res.json({ success: true, message: 'Request updated' });
    } catch (error) {
        console.error('Update request error:', error);
        res.status(500).json({ success: false, message: 'Failed to update request' });
    }
});

module.exports = router;
