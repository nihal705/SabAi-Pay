// backend/services/merchantDataService.js
// ENHANCED VERSION - Integrated with ML for intelligent search

const fs = require('fs').promises;
const path = require('path');

class MerchantDataService {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/merchants');
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
        console.log('✅ MerchantDataService initialized with file system');
    }

    async getMerchantData(merchant, city = null, area = null, searchTerm = null, filters = {}) {
        try {
            const cacheKey = `${merchant}_${city || 'all'}_${area || 'all'}_${searchTerm || 'none'}`;
            
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTTL) {
                    console.log(`📦 Cache hit for ${merchant}`);
                    return cached.data;
                }
            }
            
            console.log(`📂 Loading merchant data for: ${merchant}, city: ${city}, search: ${searchTerm}`);
            
            let data;
            
            if (['swiggy', 'zomato'].includes(merchant)) {
                data = await this.getFoodDeliveryData(merchant, city, area, searchTerm, filters);
            } else if (['zepto', 'blinkit', 'bigbasket', 'dmart'].includes(merchant)) {
                data = await this.getQuickCommerceData(merchant, city, area, searchTerm, filters);
            } else if (['amazon', 'flipkart', 'myntra', 'ajio'].includes(merchant)) {
                data = await this.getEcommerceData(merchant, searchTerm, filters);
            } else {
                data = await this.getDefaultMerchantData(merchant);
            }
            
            this.cache.set(cacheKey, { data, timestamp: Date.now() });
            return data;
            
        } catch (error) {
            console.error(`Error loading merchant data for ${merchant}:`, error);
            return this.getFallbackData(merchant);
        }
    }

    async getFoodDeliveryData(merchant, city, area, searchTerm, filters) {
    try {
        const merchantPath = path.join(this.dataPath, merchant);
        
        if (!city) {
            const citiesData = await this.readJSON(path.join(merchantPath, 'cities.json'));
            return {
                type: 'cities_list',
                merchant: merchant,
                cities: citiesData || [],
                message: `Please select your city to see restaurants on ${merchant}`,
                requiresLocation: true
            };
        }
        
        const cityPath = path.join(merchantPath, 'locations', city.toLowerCase());
        const restaurantsPath = path.join(cityPath, 'restaurants.json');
        
        console.log(`Looking for restaurants at: ${restaurantsPath}`);
        
        let restaurants = await this.readJSON(restaurantsPath);
        
        if (!restaurants || restaurants.length === 0) {
            return {
                type: 'no_results',
                merchant: merchant,
                message: `No restaurants found in ${city}. Please try another city.`,
                availableCities: await this.getAvailableCities(merchant)
            };
        }
        
        console.log(`Found ${restaurants.length} restaurants in ${city}`);
        
        // A restaurant name must be resolved before an item-name search. The old
        // implementation searched only menu items, so "Paradise" could never
        // find the existing "Paradise Biryani" restaurant.
        if (searchTerm && searchTerm !== 'null' && searchTerm !== 'undefined') {
            const normalizedQuery = String(searchTerm).toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
            const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
            const restaurantMatches = restaurants.filter((restaurant) => {
                const normalizedName = String(restaurant.name || '').toLowerCase().replace(/[^a-z0-9]/g, ' ');
                return normalizedName.includes(normalizedQuery) || queryWords.every((word) => normalizedName.includes(word));
            });
            if (restaurantMatches.length) {
                const restaurant = restaurantMatches[0];
                const menu = await this.getRestaurantMenu(merchant, city, restaurant.id);
                return {
                    type: 'restaurant_menu', merchant, restaurant,
                    menu: (menu || []).map((item) => ({ ...item, imageUrl: item.imageUrl || item.image || '/images/items/default.png', restaurantName: restaurant.name, restaurantId: restaurant.id, restaurantRating: restaurant.rating, deliveryTime: restaurant.deliveryTime })),
                    total: (menu || []).length
                };
            }
            const menuResults = await this.searchInMenus(merchant, city, restaurants, searchTerm);
            return {
                type: 'search_results',
                query: searchTerm,
                restaurants: restaurants.slice(0, 10),
                items: menuResults.items,
                total: menuResults.total
            };
        }
        
        // Return restaurants list
        return {
            type: 'restaurants_list',
            merchant: merchant,
            city: city,
            area: area,
            restaurants: restaurants.slice(0, 20),
            total: restaurants.length,
            canSelect: true
        };
        
    } catch (error) {
        console.error('Error in getFoodDeliveryData:', error);
        return this.getFallbackData(merchant);
    }
}

    // NEW: ML-powered fuzzy search in menus
    async searchInMenusWithML(merchant, city, restaurants, searchTerm) {
        const results = [];
        const searchLower = searchTerm.toLowerCase();
        
        // Split search term into keywords for better matching
        const keywords = searchLower.split(' ').filter(k => k.length > 2);
        
        for (const restaurant of restaurants.slice(0, 10)) {
            try {
                const menu = await this.getRestaurantMenu(merchant, city, restaurant.id);
                if (!menu) continue;
                
                const matchingItems = menu.filter(item => {
                    const itemName = item.name.toLowerCase();
                    // Check exact match
                    if (itemName === searchLower) return true;
                    // Check includes
                    if (itemName.includes(searchLower)) return true;
                    // Check keyword matching
                    if (keywords.length > 0) {
                        return keywords.some(kw => itemName.includes(kw));
                    }
                    return false;
                });
                
                // Score matches for better ranking
                const scoredMatches = matchingItems.map(item => ({
                    ...item,
                    matchScore: this.calculateMatchScore(item.name, searchTerm),
                    restaurantName: restaurant.name,
                    restaurantId: restaurant.id,
                    restaurantRating: restaurant.rating,
                    deliveryTime: restaurant.deliveryTime
                }));
                
                // Sort by match score
                scoredMatches.sort((a, b) => b.matchScore - a.matchScore);
                results.push(...scoredMatches);
            } catch (e) {
                // Skip if menu not found
            }
        }
        
        // Remove duplicates by name and restaurant
        const uniqueResults = [];
        const seen = new Set();
        for (const item of results) {
            const key = `${item.name}_${item.restaurantId}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueResults.push(item);
            }
        }
        
        return { items: uniqueResults.slice(0, 30), total: uniqueResults.length };
    }

    calculateMatchScore(itemName, searchTerm) {
        const itemLower = itemName.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        let score = 0;
        // Exact match gets highest score
        if (itemLower === searchLower) score += 100;
        // Starts with search term
        else if (itemLower.startsWith(searchLower)) score += 80;
        // Contains search term
        else if (itemLower.includes(searchLower)) score += 60;
        
        // Bonus for popular items
        if (itemLower.includes('popular') || itemLower.includes('best')) score += 10;
        
        return score;
    }

    async getQuickCommerceData(merchant, city, area, searchTerm, filters) {
        try {
            const merchantPath = path.join(this.dataPath, merchant);
            
            if (!city) {
                const citiesData = await this.readJSON(path.join(merchantPath, 'cities.json'));
                return {
                    type: 'cities_list',
                    merchant: merchant,
                    cities: citiesData || [],
                    message: `Please select your city to see products on ${merchant}`,
                    requiresLocation: true
                };
            }
            
            const cityPath = path.join(merchantPath, 'locations', city.toLowerCase());
            const productsPath = path.join(cityPath, 'products.json');
            
            let products = await this.readJSON(productsPath);
            
            if (!products || products.length === 0) {
                const mainProductsPath = path.join(merchantPath, 'products.json');
                products = await this.readJSON(mainProductsPath);
            }
            
            if (!products || products.length === 0) {
                return {
                    type: 'no_results',
                    merchant: merchant,
                    message: `No products found in ${city}. Please try another city.`,
                    availableCities: await this.getAvailableCities(merchant)
                };
            }
            
            // ML-powered product search
            if (searchTerm && searchTerm !== 'null' && searchTerm !== 'undefined') {
                const searchLower = searchTerm.toLowerCase();
                const keywords = searchLower.split(' ').filter(k => k.length > 2);
                
                let filteredProducts = products.filter(p => {
                    const productName = p.name.toLowerCase();
                    if (productName === searchLower) return true;
                    if (productName.includes(searchLower)) return true;
                    if (keywords.length > 0) {
                        return keywords.some(kw => productName.includes(kw));
                    }
                    return false;
                });
                
                // Score matches
                filteredProducts = filteredProducts.map(p => ({
                    ...p,
                    matchScore: this.calculateMatchScore(p.name, searchTerm)
                }));
                filteredProducts.sort((a, b) => b.matchScore - a.matchScore);
                products = filteredProducts;
            }
            
            if (filters.category) {
                products = products.filter(p => p.category === filters.category);
            }
            
            if (filters.maxPrice) {
                products = products.filter(p => p.price <= filters.maxPrice);
            }
            
            if (filters.isVeg === true) {
                products = products.filter(p => p.isVeg === true);
            }
            
            if (filters.sortBy === 'price_asc') {
                products.sort((a, b) => a.price - b.price);
            } else if (filters.sortBy === 'price_desc') {
                products.sort((a, b) => b.price - a.price);
            }
            
            const groupedByCategory = {};
            products.forEach(product => {
                const cat = product.category || 'Other';
                if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
                groupedByCategory[cat].push(product);
            });
            
            return {
                type: 'products_grid',
                merchant: merchant,
                city: city,
                products: products.slice(0, 100),
                categories: Object.keys(groupedByCategory),
                groupedProducts: groupedByCategory,
                total: products.length,
                canSelect: true
            };
            
        } catch (error) {
            console.error('Error in getQuickCommerceData:', error);
            return this.getFallbackData(merchant);
        }
    }

    async getRestaurantMenu(merchant, city, restaurantId) {
        try {
            const menuPath = path.join(this.dataPath, merchant, 'locations', city.toLowerCase(), 'menu', `${restaurantId}.json`);
            const menu = await this.readJSON(menuPath);
            return (menu || []).map((item) => {
                const sourceImage = item.imageUrl || item.image || '';
                // Catalog exports use .jpg while the bundled web assets are PNGs.
                const imageUrl = sourceImage ? sourceImage.replace(/\.jpe?g$/i, '.png') : '/images/items/default.png';
                return { ...item, imageUrl };
            });
        } catch (error) {
            console.error('Error loading menu:', error);
            return [];
        }
    }

    async searchInMenus(merchant, city, restaurants, searchTerm) {
    const results = [];
    const searchLower = searchTerm.toLowerCase();
    
    // Search through ALL restaurants, not just first few
    for (const restaurant of restaurants) {
        try {
            const menu = await this.getRestaurantMenu(merchant, city, restaurant.id);
            
            if (!menu) continue;
            
            const matchingItems = menu.filter(item => {
                const itemName = item.name.toLowerCase();
                return itemName.includes(searchLower);
            });
            
            matchingItems.forEach(item => {
                results.push({
                    ...item,
                    restaurantName: restaurant.name,
                    restaurantId: restaurant.id,
                    restaurantRating: restaurant.rating,
                    restaurantImage: restaurant.imageUrl,
                    deliveryTime: restaurant.deliveryTime,
                    priceForTwo: restaurant.priceForTwo
                });
            });
        } catch (e) {
            console.log(`Error fetching menu for ${restaurant.name}:`, e.message);
        }
    }
    
    // Sort by match score (exact matches first)
    results.sort((a, b) => {
        const aExact = a.name.toLowerCase() === searchLower;
        const bExact = b.name.toLowerCase() === searchLower;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
    });
    
    console.log(`Found ${results.length} items matching "${searchTerm}" across ${restaurants.length} restaurants`);
    
    return { items: results.slice(0, 50), total: results.length };
}

    async getAvailableCities(merchant) {
        try {
            const merchantPath = path.join(this.dataPath, merchant);
            const citiesData = await this.readJSON(path.join(merchantPath, 'cities.json'));
            return citiesData || [];
        } catch (error) {
            return [];
        }
    }

    async readJSON(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log(`File not found: ${filePath}`);
            return null;
        }
    }

    getFallbackData(merchant) {
        return {
            type: 'fallback',
            merchant: merchant,
            message: `I'm having trouble loading ${merchant} data. Please try again.`,
            products: [],
            canSelect: false
        };
    }

    async getDefaultMerchantData(merchant) {
        try {
            const merchantPath = path.join(this.dataPath, merchant);
            const products = await this.readJSON(path.join(merchantPath, 'products.json'));
            
            if (products && products.length > 0) {
                return {
                    type: 'products_grid',
                    merchant: merchant,
                    products: products.slice(0, 50),
                    categories: ['All Products'],
                    total: products.length,
                    canSelect: true
                };
            }
            
            return this.getFallbackData(merchant);
        } catch (error) {
            return this.getFallbackData(merchant);
        }
    }

    clearCache(merchant = null, city = null) {
        if (merchant && city) {
            const key = `${merchant}_${city}`;
            for (const [cacheKey] of this.cache) {
                if (cacheKey.startsWith(key)) {
                    this.cache.delete(cacheKey);
                }
            }
        } else if (merchant) {
            for (const [cacheKey] of this.cache) {
                if (cacheKey.startsWith(merchant)) {
                    this.cache.delete(cacheKey);
                }
            }
        } else {
            this.cache.clear();
        }
        console.log('🗑️ Cache cleared');
    }
}

module.exports = new MerchantDataService();
