// backend/routes/splitRequestRoutes.js
const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');
const { verifyToken } = require('../middleware/auth');

// Get all split requests for user
router.get('/', verifyToken, async (req, res) => {
    try {
        const splitRequests = await dbService.getSplitRequests(req.user.id);
        res.json({ success: true, data: splitRequests });
    } catch (error) {
        console.error('Get split requests error:', error);
        res.status(500).json({ success: false, message: 'Failed to get split requests' });
    }
});

// Create split request
router.post('/', verifyToken, async (req, res) => {
    const { totalAmount, splitType, groupName, note, splits } = req.body;
    
    if (!totalAmount || !splits || splits.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid split request data' });
    }
    
    try {
        const splitId = `SPLIT${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        await dbService.createSplitRequest(req.user.id, {
            splitId,
            totalAmount,
            splitType: splitType || 'equal',
            groupName: groupName || null,
            note: note || null,
            splits
        });
        
        res.json({ success: true, data: { splitId } });
    } catch (error) {
        console.error('Create split request error:', error);
        res.status(500).json({ success: false, message: 'Failed to create split request' });
    }
});

// Get split request by ID
router.get('/:splitId', verifyToken, async (req, res) => {
    try {
        const splitRequests = await dbService.getSplitRequests(req.user.id);
        const splitRequest = splitRequests.find(s => s.split_id === req.params.splitId);
        
        if (!splitRequest) {
            return res.status(404).json({ success: false, message: 'Split request not found' });
        }
        
        res.json({ success: true, data: splitRequest });
    } catch (error) {
        console.error('Get split request error:', error);
        res.status(500).json({ success: false, message: 'Failed to get split request' });
    }
});

// Update split request status
router.put('/:splitId/status', verifyToken, async (req, res) => {
    const { status } = req.body;
    
    try {
        // Update logic would go here
        // await dbService.updateSplitRequestStatus(req.params.splitId, status);
        res.json({ success: true, message: 'Split request updated' });
    } catch (error) {
        console.error('Update split request error:', error);
        res.status(500).json({ success: false, message: 'Failed to update split request' });
    }
});

// Delete split request
router.delete('/:splitId', verifyToken, async (req, res) => {
    try {
        // Delete logic would go here
        res.json({ success: true, message: 'Split request deleted' });
    } catch (error) {
        console.error('Delete split request error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete split request' });
    }
});

module.exports = router;