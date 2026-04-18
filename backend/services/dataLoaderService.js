// backend/services/dataLoaderService.js
// Loads and manages large merchant databases

const fs = require('fs').promises;
const path = require('path');

class DataLoaderService {
    constructor() {
        this.dataCache = new Map();
        this.lastUpdated = new Map();
        this.basePath = path.join(__dirname, '../data/merchants');
    }

    async loadMerchantData(merchant, location = 'Bangalore') {
        const cacheKey = `${merchant}_${location}`;
        
        // Check cache
        if (this.dataCache.has(cacheKey)) {
            const cached = this.dataCache.get(cacheKey);
            // Return cached data if less than 1 hour old
            if (Date.now() - cached.timestamp < 3600000) {
                return cached.data;
            }
        }

        try {
            // Load all data files for this merchant
            const merchantPath = path.join(this.basePath, merchant);
            const files = await fs.readdir(merchantPath);
            
            let merchantData = {
                products: [],
                categories: [],
                offers: [],
                restaurants: [],
                menu: [],
                lastUpdated: new Date().toISOString(),
                location: location
            };

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(merchantPath, file);
                    const fileData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                    
                    // Merge based on file type
                    if (file.includes('products')) {
                        merchantData.products = [...merchantData.products, ...fileData];
                    } else if (file.includes('categories')) {
                        merchantData.categories = fileData;
                    } else if (file.includes('restaurants')) {
                        merchantData.restaurants = fileData;
                    } else if (file.includes('menu')) {
                        merchantData.menu = fileData;
                    } else if (file.includes('offers')) {
                        merchantData.offers = fileData;
                    }
                }
            }

            // Cache the data
            this.dataCache.set(cacheKey, {
                data: merchantData,
                timestamp: Date.now()
            });

            return merchantData;

        } catch (error) {
            console.error(`Error loading data for ${merchant}:`, error.message);
            return null;
        }
    }

    getMerchantData(merchant, location) {
        const cacheKey = `${merchant}_${location}`;
        const cached = this.dataCache.get(cacheKey);
        return cached ? cached.data : null;
    }

    async refreshAllData() {
        const merchants = await fs.readdir(this.basePath);
        for (const merchant of merchants) {
            await this.loadMerchantData(merchant, 'Bangalore');
            console.log(`✅ Refreshed data for ${merchant}`);
        }
    }
}

module.exports = new DataLoaderService();