// backend/services/merchantService.js
// Service to load and access merchant data from backend/data/merchants/

const fs = require('fs').promises;
const path = require('path');

class MerchantService {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/merchants');
        this.merchantCache = new Map();
        this.initialized = false;
    }

    // Helper to round prices to 2 decimals
    roundPrice(price) {
        return Math.round(price * 100) / 100;
    }

    async initialize() {
        try {
            console.log('📂 Loading merchant data from:', this.dataPath);
            await this.loadAllMerchants();
            this.initialized = true;
            console.log(`✅ Merchant data loaded - ${this.merchantCache.size} merchants`);
            return true;
        } catch (error) {
            console.error('❌ Failed to load merchant data:', error.message);
            return false;
        }
    }

    async loadAllMerchants() {
        try {
            try {
                await fs.access(this.dataPath);
            } catch (error) {
                console.error(`❌ Data path not found: ${this.dataPath}`);
                return;
            }
            
            const merchants = await fs.readdir(this.dataPath);
            console.log(`📁 Found ${merchants.length} merchant folders`);
            
            let loadedCount = 0;
            for (const merchant of merchants) {
                const merchantPath = path.join(this.dataPath, merchant);
                try {
                    const stats = await fs.stat(merchantPath);
                    if (stats.isDirectory()) {
                        const success = await this.loadMerchant(merchant);
                        if (success) loadedCount++;
                    }
                } catch (err) {
                    console.log(`⚠️ Skipping ${merchant}: ${err.message}`);
                }
            }
            
            console.log(`✅ Successfully loaded ${loadedCount} merchants`);
            
        } catch (error) {
            console.error('Error loading merchants:', error.message);
        }
    }

    async loadMerchant(merchantName) {
        try {
            const merchantPath = path.join(this.dataPath, merchantName);
            
            try {
                await fs.access(merchantPath);
            } catch {
                return false;
            }
            
            const files = await fs.readdir(merchantPath);
            
            const merchantData = {
                name: merchantName,
                products: [],
                menu: [],
                categories: [],
                priceData: {}
            };
            
            let loadedAny = false;
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(merchantPath, file);
                        const fileContent = await fs.readFile(filePath, 'utf8');
                        
                        if (!fileContent || fileContent.trim() === '') continue;
                        
                        const data = JSON.parse(fileContent);
                        
                        if (!data) continue;
                        
                        if (file.includes('products') || file === 'products.json') {
                            if (Array.isArray(data)) {
                                // Round all prices when loading
                                const roundedProducts = data.map(p => ({
                                    ...p,
                                    price: this.roundPrice(p.price || 0)
                                }));
                                merchantData.products = [...merchantData.products, ...roundedProducts];
                                loadedAny = true;
                            }
                        } else if (file.includes('menu') || file.match(/menu_\d+\.json/)) {
                            if (Array.isArray(data)) {
                                // Round all prices when loading
                                const roundedMenu = data.map(item => ({
                                    ...item,
                                    price: this.roundPrice(item.price || 0)
                                }));
                                merchantData.menu = [...merchantData.menu, ...roundedMenu];
                                loadedAny = true;
                            }
                        } else if (file.includes('categories') || file === 'categories.json') {
                            if (Array.isArray(data)) {
                                merchantData.categories = data;
                                loadedAny = true;
                            }
                        } else if (file.includes('prices') || file === 'prices.json') {
                            if (typeof data === 'object') {
                                // Round all price values
                                const roundedPrices = {};
                                for (const [key, value] of Object.entries(data)) {
                                    roundedPrices[key] = this.roundPrice(value);
                                }
                                merchantData.priceData = { ...merchantData.priceData, ...roundedPrices };
                                loadedAny = true;
                            }
                        }
                    } catch (fileError) {
                        // Silent fail for individual files
                    }
                }
            }
            
            if (loadedAny || merchantData.products.length > 0 || merchantData.menu.length > 0) {
                this.merchantCache.set(merchantName, merchantData);
                const totalItems = merchantData.products.length + merchantData.menu.length;
                console.log(`✅ Loaded ${merchantName} - ${totalItems} items`);
                return true;
            } else {
                this.merchantCache.set(merchantName, merchantData);
                console.log(`⚠️ Loaded ${merchantName} - 0 items`);
                return true;
            }
            
        } catch (error) {
            console.error(`❌ Error loading merchant ${merchantName}:`, error.message);
            return false;
        }
    }

    // Search items in merchant data with rounded prices
    searchItems(merchant, searchTerm, quantity = 1) {
        const merchantData = this.merchantCache.get(merchant);
        
        if (!merchantData) {
            console.log(`⚠️ No data found for merchant: ${merchant}`);
            return null;
        }
        
        const term = searchTerm.toLowerCase().trim();
        const results = [];
        
        // Helper function to calculate match score
        const getMatchScore = (name) => {
            const nameLower = name.toLowerCase();
            if (nameLower === term) return 100;
            if (nameLower.includes(term)) return 80;
            
            const words = term.split(' ');
            let score = 0;
            for (const word of words) {
                if (word.length > 2 && nameLower.includes(word)) score += 20;
            }
            return score;
        };
        
        // Search in products
        if (merchantData.products && Array.isArray(merchantData.products)) {
            for (const product of merchantData.products) {
                const name = (product.name || '').toLowerCase();
                const score = getMatchScore(name);
                
                if (score > 0) {
                    const price = this.roundPrice(product.price || 0);
                    results.push({
                        id: product.id,
                        name: product.name,
                        originalName: product.name,
                        price: price,
                        unit: product.unit || 'piece',
                        quantity: quantity,
                        total: this.roundPrice(price * quantity),
                        description: product.description,
                        matchScore: score
                    });
                }
            }
        }
        
        // Search in menu
        if (merchantData.menu && Array.isArray(merchantData.menu)) {
            for (const item of merchantData.menu) {
                const name = (item.name || '').toLowerCase();
                const score = getMatchScore(name);
                
                if (score > 0) {
                    const price = this.roundPrice(item.price || 0);
                    results.push({
                        id: item.id,
                        name: item.name,
                        originalName: item.name,
                        price: price,
                        unit: 'piece',
                        quantity: quantity,
                        total: this.roundPrice(price * quantity),
                        description: item.description,
                        matchScore: score
                    });
                }
            }
        }
        
        // Sort by match score and return the best match
        if (results.length > 0) {
            results.sort((a, b) => b.matchScore - a.matchScore);
            return results[0];
        }
        
        return null;
    }

    // Get merchant info
    getMerchantInfo(merchant) {
        const merchantNames = {
            'swiggy': 'Swiggy',
            'zomato': 'Zomato',
            'zepto': 'Zepto',
            'blinkit': 'Blinkit',
            'amazon': 'Amazon',
            'flipkart': 'Flipkart',
            'netmeds': 'NetMeds',
            'pharmeasy': 'PharmEasy'
        };
        
        return {
            name: merchantNames[merchant] || merchant.charAt(0).toUpperCase() + merchant.slice(1),
            logo: '🛍️',
            color: '#4f46e5'
        };
    }

    // Get merchant data
    getMerchantData(merchant) {
        return this.merchantCache.get(merchant);
    }

    // Get all merchants
    getAllMerchants() {
        return Array.from(this.merchantCache.keys());
    }

    // Round a number to 2 decimal places
    round(value) {
        return Math.round(value * 100) / 100;
    }
}

module.exports = new MerchantService();