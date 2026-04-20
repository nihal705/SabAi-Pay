// backend/controllers/mlWebhookController.js
// Webhook for ML service to report model performance

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * For licensing inquiries: sabaipaycontact@gmail.com
 */

const mlService = require('../services/mlService');
const dbService = require('../services/databaseService');

class MLWebhookController {
    
    async handleModelFeedback(req, res) {
        try {
            const { message, predictedIntent, actualIntent, userFeedback, sessionId } = req.body;
            
            console.log(`📊 ML Feedback received: ${message.substring(0, 50)}...`);
            
            // Store feedback for model improvement
            await mlService.learnFromInteraction(message, predictedIntent, { sessionId }, userFeedback);
            
            // If prediction was wrong, log it for review
            if (predictedIntent !== actualIntent) {
                console.log(`⚠️ ML misclassification: ${predictedIntent} vs ${actualIntent}`);
                await this.logMisclassification(message, predictedIntent, actualIntent);
            }
            
            res.json({ success: true, message: 'Feedback recorded' });
        } catch (error) {
            console.error('Error handling model feedback:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async logMisclassification(message, predictedIntent, actualIntent) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                message: message,
                predicted_intent: predictedIntent,
                actual_intent: actualIntent
            };
            
            const fs = require('fs').promises;
            const path = require('path');
            const logPath = path.join(__dirname, '../data/misclassifications.jsonl');
            
            await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error('Failed to log misclassification:', error);
        }
    }
    
    async getModelMetrics(req, res) {
        try {
            const stats = await mlService.getLearningStats();
            
            res.json({
                success: true,
                data: {
                    totalInteractions: stats.totalInteractions,
                    newInteractionsLastWeek: stats.newInteractions,
                    mlServiceAvailable: mlService.isAvailable,
                    cacheStats: {
                        ttl: mlService.cacheTTL
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async retrainModel(req, res) {
        try {
            // This would trigger a background job to retrain the model
            console.log('🔄 Retraining requested...');
            
            // In production, you would:
            // 1. Collect new training data
            // 2. Run training scripts
            // 3. Validate new model
            // 4. Deploy if validation passes
            
            res.json({ 
                success: true, 
                message: 'Retraining job scheduled. This may take several minutes.' 
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new MLWebhookController();