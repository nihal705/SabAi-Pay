const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const [notifications, unreadCount] = await Promise.all([
      dbService.getNotifications(req.user.id, limit),
      dbService.getUnreadNotificationCount(req.user.id)
    ]);
    res.json({ success: true, data: { notifications, unread_count: unreadCount } });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to load notifications' }); }
});

router.put('/read-all', async (req, res) => {
  try { await dbService.markAllNotificationsRead(req.user.id); res.json({ success: true }); }
  catch (error) { res.status(500).json({ success: false, message: 'Failed to update notifications' }); }
});

router.put('/:id/read', async (req, res) => {
  try { await dbService.markNotificationRead(req.params.id, req.user.id); res.json({ success: true }); }
  catch (error) { res.status(404).json({ success: false, message: 'Notification not found' }); }
});

module.exports = router;
