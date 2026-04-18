// backend/services/merchantLocationService.js
// COMPLETE FIXED VERSION

const fs = require('fs').promises;
const path = require('path');

class MerchantLocationService {
    constructor() {
        this.cache = new Map();
        this.basePath = path.join(__dirname, '../data/merchants');
        console.log(`📁 MerchantLocationService initialized with basePath: ${this.basePath}`);
    }

    async loadMerchantData(merchant) {
        if (this.cache.has(merchant)) {
            return this.cache.get(merchant);
        }

        try {
            const merchantPath = path.join(this.basePath, merchant);
            console.log(`🔍 Loading merchant data from: ${merchantPath}`);
            
            // Check if merchant directory exists
            try {
                await fs.access(merchantPath);
            } catch (e) {
                console.log(`⚠️ Merchant directory not found: ${merchantPath}`);
                return null;
            }
            
            // Get all items in merchant folder
            const items = await fs.readdir(merchantPath);
            const cities = [];
            
            // Known city names to look for
            const knownCities = ['bangalore', 'mumbai', 'delhi', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'lucknow'];
            
            for (const item of items) {
                const itemPath = path.join(merchantPath, item);
                try {
                    const stat = await fs.stat(itemPath);
                    if (stat.isDirectory()) {
                        // Check if this folder name is a known city or if it contains city subfolders
                        if (knownCities.includes(item.toLowerCase())) {
                            // This is a city folder directly under merchant
                            cities.push({
                                name: item.toLowerCase(),
                                displayName: this.getCityDisplayName(item.toLowerCase()),
                                path: itemPath
                            });
                        } else {
                            // Check if this folder contains city subfolders
                            try {
                                const subItems = await fs.readdir(itemPath);
                                for (const subItem of subItems) {
                                    const subItemPath = path.join(itemPath, subItem);
                                    const subStat = await fs.stat(subItemPath);
                                    if (subStat.isDirectory() && knownCities.includes(subItem.toLowerCase())) {
                                        cities.push({
                                            name: subItem.toLowerCase(),
                                            displayName: this.getCityDisplayName(subItem.toLowerCase()),
                                            path: subItemPath
                                        });
                                    }
                                }
                            } catch (subErr) {
                                // Ignore subfolder errors
                            }
                        }
                    }
                } catch (err) {
                    console.log(`⚠️ Error reading ${item}:`, err.message);
                }
            }
            
            // If no cities found, use default cities for this merchant type
            if (cities.length === 0) {
                console.log(`⚠️ No city folders found for ${merchant}, using default cities`);
                const defaultCities = ['bangalore', 'mumbai', 'delhi', 'chennai', 'kolkata', 'hyderabad', 'pune'];
                for (const city of defaultCities) {
                    cities.push({
                        name: city,
                        displayName: this.getCityDisplayName(city),
                        path: path.join(merchantPath, city)
                    });
                }
            }
            
            console.log(`✅ Found ${cities.length} cities for ${merchant}: ${cities.map(c => c.name).join(', ')}`);

            const data = {
                merchant,
                cities,
                type: this.getMerchantType(merchant)
            };
            
            this.cache.set(merchant, data);
            return data;
        } catch (error) {
            console.error(`Error loading merchant data for ${merchant}:`, error);
            return null;
        }
    }

    getCityDisplayName(cityName) {
        const displayNames = {
            'bangalore': 'Bangalore',
            'bengaluru': 'Bangalore',
            'mumbai': 'Mumbai',
            'delhi': 'Delhi NCR',
            'chennai': 'Chennai',
            'kolkata': 'Kolkata',
            'hyderabad': 'Hyderabad',
            'pune': 'Pune',
            'ahmedabad': 'Ahmedabad',
            'jaipur': 'Jaipur',
            'lucknow': 'Lucknow'
        };
        return displayNames[cityName] || cityName.charAt(0).toUpperCase() + cityName.slice(1);
    }

    getMerchantType(merchant) {
        const types = {
            swiggy: 'food_delivery',
            zomato: 'food_delivery',
            zepto: 'quick_commerce',
            blinkit: 'quick_commerce',
            amazon: 'ecommerce',
            flipkart: 'ecommerce',
            netmeds: 'pharmacy',
            pharmeasy: 'pharmacy',
            bigbasket: 'grocery',
            dmart: 'grocery',
            myntra: 'fashion',
            ajio: 'fashion',
            dominos: 'food_chain',
            pizzahut: 'food_chain',
            burgerking: 'food_chain',
            kfc: 'food_chain',
            mcdonalds: 'food_chain',
            starbucks: 'cafe',
            ccd: 'cafe',
            haldiram: 'snacks',
            bikanerwala: 'snacks',
            croma: 'electronics',
            reliance_digital: 'electronics',
            nykaa: 'beauty',
            tatacliq: 'ecommerce'
        };
        return types[merchant] || 'general';
    }

    async validateLocation(merchant, address, cityName = null) {
        const merchantData = await this.loadMerchantData(merchant);
        
        if (!merchantData) {
            return { valid: false, message: 'Merchant not supported' };
        }

        // For ecommerce/fashion, location doesn't matter
        if (merchantData.type === 'ecommerce' || merchantData.type === 'fashion' || merchantData.type === 'beauty') {
            return {
                valid: true,
                city: 'nationwide',
                area: null,
                address: address,
                message: 'Nationwide delivery available'
            };
        }

        // If no cities data, treat as nationwide
        if (!merchantData.cities || merchantData.cities.length === 0) {
            return {
                valid: true,
                city: 'nationwide',
                area: null,
                address: address,
                message: `${merchant.charAt(0).toUpperCase() + merchant.slice(1)} delivers nationwide`
            };
        }

        // Extract city from address if not provided
        let detectedCity = cityName;
        if (!detectedCity) {
            detectedCity = this.extractCityFromAddress(address);
        }
        
        // Normalize detected city
        if (detectedCity) {
            detectedCity = detectedCity.toLowerCase();
            if (detectedCity === 'bengaluru') detectedCity = 'bangalore';
        }

        console.log(`🔍 Validating location for ${merchant}: detectedCity=${detectedCity}, address=${address}`);
        console.log(`📋 Available cities:`, merchantData.cities.map(c => c.name));

        // Find matching city (case-insensitive)
        const city = merchantData.cities.find(c => 
            c.name === detectedCity || 
            c.name.toLowerCase() === detectedCity?.toLowerCase() ||
            c.displayName?.toLowerCase() === detectedCity?.toLowerCase()
        );

        if (!city) {
            const availableCities = merchantData.cities.map(c => c.displayName || c.name).join(', ');
            return {
                valid: false,
                message: `${merchant.charAt(0).toUpperCase() + merchant.slice(1)} does not deliver to "${detectedCity || 'this location'}". Available cities: ${availableCities}`,
                availableCities: merchantData.cities.map(c => c.displayName || c.name)
            };
        }

        return {
            valid: true,
            city: city.name,
            cityDisplayName: city.displayName || city.name,
            area: null,
            address: address,
            message: `${merchant.charAt(0).toUpperCase() + merchant.slice(1)} delivers to ${city.displayName || city.name}`
        };
    }

    extractCityFromAddress(address) {
        const lowerAddress = address.toLowerCase();
        
        const cityKeywords = [
            { name: 'bangalore', keywords: ['bangalore', 'bengaluru', 'blr'] },
            { name: 'mumbai', keywords: ['mumbai', 'bombay', 'mum'] },
            { name: 'delhi', keywords: ['delhi', 'new delhi', 'ncr', 'del'] },
            { name: 'hyderabad', keywords: ['hyderabad', 'secunderabad', 'hyd'] },
            { name: 'chennai', keywords: ['chennai', 'madras', 'chn'] },
            { name: 'kolkata', keywords: ['kolkata', 'calcutta', 'kol'] },
            { name: 'pune', keywords: ['pune', 'poonawalla'] },
            { name: 'ahmedabad', keywords: ['ahmedabad', 'amdavad', 'amd'] },
            { name: 'jaipur', keywords: ['jaipur', 'pink city'] },
            { name: 'lucknow', keywords: ['lucknow', 'lakhnau'] }
        ];

        for (const city of cityKeywords) {
            if (city.keywords.some(kw => lowerAddress.includes(kw))) {
                return city.name;
            }
        }

        return null;
    }

    async getRestaurantsByLocation(merchant, city, area = null) {
        const merchantData = await this.loadMerchantData(merchant);
        
        if (merchantData.type !== 'food_delivery' && merchantData.type !== 'food_chain' && merchantData.type !== 'cafe') {
            return [];
        }

        try {
            // Find city folder
            const cityFolder = merchantData.cities.find(c => c.name === city);
            if (!cityFolder) {
                return [];
            }
            
            // Try to load restaurants.json
            const restaurantsFile = path.join(cityFolder.path, 'restaurants.json');
            try {
                const data = await fs.readFile(restaurantsFile, 'utf8');
                let restaurants = JSON.parse(data);
                
                if (area) {
                    restaurants = restaurants.filter(r => 
                        r.location?.area === area || 
                        r.location?.area?.toLowerCase().includes(area.toLowerCase())
                    );
                }
                
                return restaurants;
            } catch (e) {
                // Try items.json instead
                const itemsFile = path.join(cityFolder.path, 'items.json');
                try {
                    const data = await fs.readFile(itemsFile, 'utf8');
                    let items = JSON.parse(data);
                    const restaurant = {
                        id: `${merchant}_rest_${city}_1`,
                        name: merchant.charAt(0).toUpperCase() + merchant.slice(1),
                        cuisine: 'Various',
                        rating: 4.0,
                        deliveryTime: '30-45 min',
                        priceForTwo: 500,
                        location: { area: area || 'City Center' }
                    };
                    return [restaurant];
                } catch (e2) {
                    return [];
                }
            }
        } catch (error) {
            console.error(`Error loading restaurants for ${merchant}/${city}:`, error);
            return [];
        }
    }

    async getRestaurantMenu(merchant, city, restaurantId) {
        try {
            const merchantData = await this.loadMerchantData(merchant);
            const cityFolder = merchantData?.cities.find(c => c.name === city);
            
            if (!cityFolder) return [];
            
            const menuFile = path.join(cityFolder.path, 'menu', `${restaurantId}.json`);
            try {
                const data = await fs.readFile(menuFile, 'utf8');
                return JSON.parse(data);
            } catch (e) {
                const itemsFile = path.join(cityFolder.path, 'items.json');
                try {
                    const data = await fs.readFile(itemsFile, 'utf8');
                    return JSON.parse(data);
                } catch (e2) {
                    return this.getFallbackMenu(merchant);
                }
            }
        } catch (error) {
            console.error(`Error loading menu for ${restaurantId}:`, error);
            return this.getFallbackMenu(merchant);
        }
    }

    getFallbackMenu(merchant) {
        const fallbackMenus = {
            dominos: [
                { name: 'Margherita Pizza', price: 299, category: 'Pizza', isVeg: true },
                { name: 'Pepperoni Pizza', price: 399, category: 'Pizza', isVeg: false },
                { name: 'Garlic Bread', price: 99, category: 'Sides', isVeg: true }
            ],
            starbucks: [
                { name: 'Caffè Latte', price: 199, category: 'Coffee', isVeg: true },
                { name: 'Cappuccino', price: 199, category: 'Coffee', isVeg: true },
                { name: 'Blueberry Muffin', price: 149, category: 'Pastry', isVeg: true }
            ],
            default: [
                { name: 'Item 1', price: 199, category: 'Main', isVeg: true },
                { name: 'Item 2', price: 299, category: 'Main', isVeg: false }
            ]
        };
        return fallbackMenus[merchant] || fallbackMenus.default;
    }

    async getRestaurantSuggestions(merchant, city, area = null, limit = 5) {
        const restaurants = await this.getRestaurantsByLocation(merchant, city, area);
        
        if (!restaurants || restaurants.length === 0) {
            return [{
                restaurant: {
                    id: `${merchant}_fallback`,
                    name: merchant.charAt(0).toUpperCase() + merchant.slice(1),
                    cuisine: 'Various',
                    rating: 4.0,
                    deliveryTime: '30-45 min',
                    priceForTwo: 500
                },
                items: this.getFallbackMenu(merchant).slice(0, 5)
            }];
        }
        
        const sorted = [...restaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        const topRestaurants = sorted.slice(0, limit);
        
        const suggestions = [];
        for (const restaurant of topRestaurants) {
            const menu = await this.getRestaurantMenu(merchant, city, restaurant.id);
            if (menu && menu.length > 0) {
                const popularItems = menu.slice(0, 6);
                suggestions.push({
                    restaurant: {
                        id: restaurant.id,
                        name: restaurant.name,
                        cuisine: restaurant.cuisine || 'Various',
                        rating: restaurant.rating || 4.0,
                        deliveryTime: restaurant.deliveryTime || '30-45 min',
                        priceForTwo: restaurant.priceForTwo || 500
                    },
                    items: popularItems
                });
            }
        }
        
        return suggestions;
    }

    async searchItems(merchant, city, searchTerm, area = null) {
        const restaurants = await this.getRestaurantsByLocation(merchant, city, area);
        
        if (!restaurants || restaurants.length === 0) {
            return [];
        }
        
        const results = [];
        const term = searchTerm.toLowerCase();
        
        for (const restaurant of restaurants.slice(0, 10)) {
            const menu = await this.getRestaurantMenu(merchant, city, restaurant.id);
            
            if (!menu) continue;
            
            const matchingItems = menu.filter(item => 
                item.name?.toLowerCase().includes(term) ||
                item.category?.toLowerCase().includes(term)
            ).map(item => ({
                ...item,
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    area: restaurant.location?.area
                }
            }));
            
            results.push(...matchingItems);
        }
        
        return results.slice(0, 20);
    }
}

module.exports = new MerchantLocationService();