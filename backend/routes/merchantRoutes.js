// backend/routes/merchantRoutes.js
// COMPLETE FIXED VERSION - Corrected auth import

const express = require('express');
const router = express.Router();
const merchantConnectionService = require('../services/merchantConnectionService');
const merchantLocationService = require('../services/merchantLocationService');
const merchantService = require('../services/merchantService');
const AuthMiddleware = require('../middleware/auth');  // <-- CHANGE THIS
const dbService = require('../services/databaseService');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Validate location for a merchant - PUBLIC (no auth needed)
router.post('/validate-location', async (req, res) => {
  try {
    const { merchantId, address, city } = req.body;
    
    console.log('Validate location request:', { merchantId, address, city });
    
    if (!merchantId || !address) {
      return res.status(400).json({ 
        success: false, 
        error: 'Merchant ID and address are required' 
      });
    }
    
    const result = await merchantLocationService.validateLocation(merchantId, address, city);
    
    console.log('Location validation result:', result);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Location validation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get merchant info - PUBLIC
router.get('/:merchantId/info', async (req, res) => {
  try {
    const { merchantId } = req.params;
    
    const info = merchantService.getMerchantInfo(merchantId);
    const cities = merchantService.getMerchantCities(merchantId);
    
    res.json({
      success: true,
      data: {
        ...info,
        cities: cities,
        requiresLocation: info.type === 'food_delivery' || info.type === 'quick_commerce'
      }
    });
  } catch (error) {
    console.error('❌ Get merchant info error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all available cities for a merchant - PUBLIC
router.get('/:merchantId/cities', async (req, res) => {
  try {
    const { merchantId } = req.params;
    
    const cities = merchantService.getMerchantCities(merchantId);
    
    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('❌ Get cities error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Check if merchant operates in a city - PUBLIC (no auth needed)
router.get('/:merchantId/city/:city/check', async (req, res) => {
  try {
    const { merchantId, city } = req.params;
    
    const operates = merchantService.merchantOperatesInCity(merchantId, city);
    
    res.json({
      success: true,
      data: { operates, city, merchantId }
    });
  } catch (error) {
    console.error('❌ Check city error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// PROTECTED ROUTES (Require authentication)
// ============================================

// All routes below require authentication
router.use(AuthMiddleware.verifyToken);  // <-- CHANGE THIS (use AuthMiddleware, not verifyToken directly)

// Connect a merchant
router.post('/connect', async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { merchantId, connectionData, location } = req.body;
    
    console.log(`🔗 Connecting merchant ${merchantId} for user ${userId}`);
    
    const result = await merchantConnectionService.connectMerchant(userId, merchantId, connectionData);
    
    if (location && location.address && result.success) {
      if (!global.userLocations) global.userLocations = {};
      if (!global.userLocations[userId]) global.userLocations[userId] = {};
      global.userLocations[userId][merchantId] = {
        address: location.address,
        city: location.city,
        area: location.area,
        coordinates: location.coordinates,
        validatedAt: new Date().toISOString()
      };
      result.data.location = global.userLocations[userId][merchantId];
    }
    
    res.json(result);
  } catch (error) {
    console.error('❌ Connect merchant error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Disconnect a merchant
router.post('/disconnect', async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { merchantId } = req.body;
    
    console.log(`🔌 Disconnecting merchant ${merchantId} for user ${userId}`);
    
    const result = await merchantConnectionService.disconnectMerchant(userId, merchantId);
    
    if (result.success) {
      res.json({ success: true, message: 'Disconnected successfully' });
    } else {
      res.status(500).json({ success: false, error: result.error || 'Failed to disconnect' });
    }
  } catch (error) {
    console.error('❌ Disconnect merchant error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all connected merchants
router.get('/connections', async (req, res) => {
  try {
    const userId = String(req.user.id);
    
    console.log(`📋 Getting connected merchants for user ${userId}`);
    
    const merchants = await merchantConnectionService.getConnectedMerchants(userId);
    
    res.json({
      success: true,
      data: merchants
    });
  } catch (error) {
    console.error('❌ Get connections error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if merchant is connected
router.get('/check/:merchantId', async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { merchantId } = req.params;
    
    console.log(`🔍 Checking connection for user ${userId}, merchant ${merchantId}`);
    
    const isConnected = await merchantConnectionService.isConnected(userId, merchantId);
    
    res.json({
      success: true,
      data: {
        connected: isConnected,
        merchantId: merchantId
      }
    });
  } catch (error) {
    console.error('❌ Check connection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update last used timestamp
router.post('/update-last-used', async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { merchantId } = req.body;
    
    await merchantConnectionService.updateLastUsed(userId, merchantId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Update last used error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save location for a merchant (permanent)
router.post('/save-location', async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { merchantId, address, city, area, coordinates } = req.body;
    
    if (!merchantId || !address) {
      return res.status(400).json({ 
        success: false, 
        error: 'Merchant ID and address are required' 
      });
    }
    
    if (!global.userLocations) global.userLocations = {};
    if (!global.userLocations[userId]) global.userLocations[userId] = {};
    
    global.userLocations[userId][merchantId] = {
      address: address,
      city: city,
      area: area,
      coordinates: coordinates,
      savedAt: new Date().toISOString(),
      isTemporary: false
    };
    
    res.json({
      success: true,
      data: {
        message: `Location saved for merchant`,
        location: global.userLocations[userId][merchantId]
      }
    });
  } catch (error) {
    console.error('❌ Save location error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get location for a merchant
router.get('/location/:merchantId', async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { merchantId } = req.params;
    
    const location = global.userLocations?.[userId]?.[merchantId] || null;
    
    res.json({
      success: true,
      data: { location }
    });
  } catch (error) {
    console.error('❌ Get location error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete location for a merchant
router.delete('/location/:merchantId', async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { merchantId } = req.params;
    
    if (global.userLocations && global.userLocations[userId]) {
      delete global.userLocations[userId][merchantId];
    }
    
    res.json({
      success: true,
      data: { message: 'Location deleted successfully' }
    });
  } catch (error) {
    console.error('❌ Delete location error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get restaurants in a city (requires authentication)
router.get('/:merchantId/restaurants', async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { merchantId } = req.params;
    const { city, area } = req.query;
    
    if (!city) {
      return res.status(400).json({ 
        success: false, 
        error: 'City is required' 
      });
    }
    
    const isConnected = await merchantConnectionService.isConnected(userId, merchantId);
    if (!isConnected) {
      return res.status(403).json({ 
        success: false, 
        error: `Please connect ${merchantId} first` 
      });
    }
    
    const restaurants = await merchantLocationService.getRestaurantsByLocation(merchantId, city, area);
    
    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    console.error('❌ Get restaurants error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get restaurant menu (requires authentication)
router.get('/:merchantId/restaurant/:restaurantId/menu', async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { merchantId, restaurantId } = req.params;
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({ 
        success: false, 
        error: 'City is required' 
      });
    }
    
    const isConnected = await merchantConnectionService.isConnected(userId, merchantId);
    if (!isConnected) {
      return res.status(403).json({ 
        success: false, 
        error: `Please connect ${merchantId} first` 
      });
    }
    
    const menu = await merchantLocationService.getRestaurantMenu(merchantId, city, restaurantId);
    
    res.json({
      success: true,
      data: menu
    });
  } catch (error) {
    console.error('❌ Get menu error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Search items across restaurants (requires authentication)
router.get('/:merchantId/search', async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { merchantId } = req.params;
    const { city, area, q: searchTerm } = req.query;
    
    if (!city) {
      return res.status(400).json({ 
        success: false, 
        error: 'City is required' 
      });
    }
    
    if (!searchTerm) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search term is required' 
      });
    }
    
    const isConnected = await merchantConnectionService.isConnected(userId, merchantId);
    if (!isConnected) {
      return res.status(403).json({ 
        success: false, 
        error: `Please connect ${merchantId} first` 
      });
    }
    
    const results = await merchantLocationService.searchItems(merchantId, city, searchTerm, area);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get restaurant suggestions (requires authentication)
router.get('/:merchantId/suggestions', async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { merchantId } = req.params;
    const { city, area, limit = 5 } = req.query;
    
    if (!city) {
      return res.status(400).json({ 
        success: false, 
        error: 'City is required' 
      });
    }
    
    const isConnected = await merchantConnectionService.isConnected(userId, merchantId);
    if (!isConnected) {
      return res.status(403).json({ 
        success: false, 
        error: `Please connect ${merchantId} first` 
      });
    }
    
    const suggestions = await merchantLocationService.getRestaurantSuggestions(
      merchantId, city, area, parseInt(limit)
    );
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('❌ Get suggestions error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Debug endpoints
router.get('/debug/cities/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const fs = require('fs');
    const path = require('path');
    
    const merchantPath = path.join(__dirname, '../data/merchants', merchantId);
    const citiesFile = path.join(merchantPath, 'cities.json');
    
    let cities = [];
    let fileExists = false;
    let fileContent = null;
    
    try {
      fileExists = fs.existsSync(citiesFile);
      if (fileExists) {
        fileContent = fs.readFileSync(citiesFile, 'utf8');
        cities = JSON.parse(fileContent);
      }
    } catch (e) {
      console.error('Error reading cities:', e);
    }
    
    res.json({
      success: true,
      data: {
        merchantId,
        citiesFile: citiesFile,
        fileExists,
        citiesCount: cities.length,
        cities: cities,
        fileContent: fileContent ? JSON.parse(fileContent) : null
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/debug/paths', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const basePath = path.join(__dirname, '../data/merchants');
    const exists = fs.existsSync(basePath);
    
    let merchants = [];
    if (exists) {
      merchants = fs.readdirSync(basePath);
    }
    
    const merchantDetails = [];
    for (const merchant of merchants) {
      const merchantPath = path.join(basePath, merchant);
      const citiesFile = path.join(merchantPath, 'cities.json');
      const citiesExists = fs.existsSync(citiesFile);
      
      let cities = [];
      if (citiesExists) {
        try {
          const citiesData = fs.readFileSync(citiesFile, 'utf8');
          cities = JSON.parse(citiesData);
        } catch (e) {
          cities = [{ error: e.message }];
        }
      }
      
      merchantDetails.push({
        name: merchant,
        path: merchantPath,
        citiesFileExists: citiesExists,
        citiesCount: cities.length,
        cities: cities.map(c => ({ name: c.name, displayName: c.displayName }))
      });
    }
    
    res.json({
      success: true,
      data: {
        basePath,
        basePathExists: exists,
        merchants: merchantDetails
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update location for a merchant - FIXED (use AuthMiddleware.verifyToken)
router.post('/update-location', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { merchantId, location } = req.body;
        
        // Call the database service to update location
        await dbService.updateMerchantLocation(userId, merchantId, location);
        
        res.json({ success: true, message: 'Location updated successfully' });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;