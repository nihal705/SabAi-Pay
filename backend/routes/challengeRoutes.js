// backend/routes/challengeRoutes.js
const express = require('express');
const router = express.Router();
const dbService = require('../services/databaseService');
const { verifyToken } = require('../middleware/auth');

// Get claimed challenges for user
router.get('/claimed', verifyToken, async (req, res) => {
    try {
        const weeklyChallenges = await dbService.getWeeklyChallenges(req.user.id);
        const claimedIds = weeklyChallenges.filter(c => c.claimed === true).map(c => c.challenge_id);
        res.json({ success: true, data: claimedIds });
    } catch (error) {
        console.error('Get claimed challenges error:', error);
        res.status(500).json({ success: false, message: 'Failed to get claimed challenges' });
    }
});

// Claim challenge reward
router.post('/:challengeId/claim', verifyToken, async (req, res) => {
    const { challengeId } = req.params;
    
    try {
        // Check if challenge is completed
        const weeklyChallenges = await dbService.getWeeklyChallenges(req.user.id);
        const challenge = weeklyChallenges.find(c => c.challenge_id === parseInt(challengeId));
        
        if (!challenge || !challenge.completed || challenge.claimed) {
            return res.status(400).json({ success: false, message: 'Challenge cannot be claimed' });
        }
        
        // Get reward amount based on challenge
        let rewardAmount = 0;
        switch (parseInt(challengeId)) {
            case 1: rewardAmount = 10; break; // Early Bird
            case 2: rewardAmount = 10; break; // Night Owl
            case 3: rewardAmount = 30; break; // Food Lover
            case 4: rewardAmount = 20; break; // Bill Master
            case 5: rewardAmount = 50; break; // Shop Explorer
            case 6: rewardAmount = 50; break; // Big Spender
            default: rewardAmount = 10;
        }
        
        // Update coin balance
        await dbService.updateCoinBalance(req.user.id, rewardAmount, true);
        
        // Add coin transaction
        await dbService.addCoinTransaction(
            req.user.id,
            rewardAmount,
            'earned',
            'challenge',
            `challenge_${challengeId}`,
            `Completed challenge: ${getChallengeName(parseInt(challengeId))}`
        );
        
        // Mark as claimed
        await dbService.claimChallengeReward(req.user.id, parseInt(challengeId));
        
        res.json({ success: true, message: 'Challenge claimed successfully', data: { reward: rewardAmount } });
    } catch (error) {
        console.error('Claim challenge error:', error);
        res.status(500).json({ success: false, message: 'Failed to claim challenge' });
    }
});

// Helper function to get challenge name
function getChallengeName(challengeId) {
    const names = {
        1: 'Early Bird',
        2: 'Night Owl',
        3: 'Food Lover',
        4: 'Bill Master',
        5: 'Shop Explorer',
        6: 'Big Spender'
    };
    return names[challengeId] || 'Challenge';
}

module.exports = router;