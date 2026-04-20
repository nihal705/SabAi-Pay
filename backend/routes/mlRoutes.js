// backend/routes/mlRoutes.js

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * For licensing inquiries: support@sabai-pay.com
 */

const express = require('express');
const router = express.Router();
const mlWebhookController = require('../controllers/mlWebhookController');
const { verifyToken } = require('../middleware/auth');

// Webhook for ML model feedback (no auth required for internal calls)
router.post('/feedback', mlWebhookController.handleModelFeedback.bind(mlWebhookController));

// Get model metrics (protected)
router.get('/metrics', verifyToken, mlWebhookController.getModelMetrics.bind(mlWebhookController));

// Request model retraining (admin only)
router.post('/retrain', verifyToken, mlWebhookController.retrainModel.bind(mlWebhookController));

module.exports = router;