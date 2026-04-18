// backend/scripts/generateMerchantData.js
// Complete data generator for all Indian merchants
// Run this once to populate all merchant JSON files

const fs = require('fs').promises;
const path = require('path');

class MerchantDataGenerator {
    constructor() {
        this.basePath = path.join(__dirname, '../data/merchants');
        this.ensureDirectoryExists();
    }

    async ensureDirectoryExists() {
        try {
            await fs.mkdir(this.basePath, { recursive: true });
        } catch (error) {
            console.error('Error creating directory:', error);
        }
    }

    async generateAllData() {
        console.log('🚀 Starting merchant data generation...\n');
        
        const merchants = [
            // Food Delivery
            'swiggy', 'zomato',
            
            // Quick Commerce
            'zepto', 'blinkit',
            
            // Grocery
            'bigbasket', 'dmart', 'reliance', 'tata', 'reliance_fresh', 'more',
            
            // Shopping
            'amazon', 'flipkart', 'myntra', 'ajio', 'tatacliq', 'snapdeal', 'shopclues',
            
            // Electronics
            'croma', 'vijay_sales', 'reliance_digital', 'poorvika', 'lot_mobile',
            
            // Food Chains
            'dominoz', 'pizzahut', 'burgerking', 'mcdonalds', 'kfc', 'subway', 
            'taco_bell', 'dunkin_donuts',
            
            // Cafes
            'starbucks', 'ccd', 'chaayos', 'barista',
            
            // Indian Restaurant Chains
            'biryani_by_kilo', 'behrouz', 'firangi_bake', 'faasos', 'lunchbox',
            'sweet_china', 'samosa_party', 'haldiram', 'bikanerwala', 'naturals_icecream',
            
            // Cloud Kitchens
            'eatfit', 'fit_food', 'salad_days', 'fresh_menu',
            
            // Kids & Toys
            'firstcry', 'hopscotch', 'hamleys', 'toysrus', 'kids_kemp',
            
            // Health & Pharma
            'netmeds', 'pharmeasy', '1mg', 'apollo_pharmacy', 'medlife',
            
            // Beauty
            'nykaa', 'purplle', 'health_glow',
            
            // Furniture
            'pepperfry', 'urban_ladder', 'ikea',
            
            // Books
            'amazon_books', 'flipkart_books', 'bookswagon',
            
            // Pets
            'heads_up_for_tails', 'doggy_world',
            
            // Alcohol
            'hipbar', 'living_liquids', 'wine_nation',
            
            // Local Stores
            'local_kirana', 'local_medical', 'local_restaurant'
        ];

        let totalProducts = 0;

        for (const merchant of merchants) {
            console.log(`📦 Generating data for ${merchant}...`);
            const productCount = await this.generateMerchantData(merchant);
            totalProducts += productCount;
            console.log(`   ✅ Generated ${productCount} products\n`);
        }

        console.log('🎉 ========================================');
        console.log(`✅ COMPLETE! Generated ${totalProducts} products across ${merchants.length} merchants`);
        console.log('========================================\n');
    }

    async generateMerchantData(merchant) {
        const merchantPath = path.join(this.basePath, merchant);
        await fs.mkdir(merchantPath, { recursive: true });

        let productCount = 0;

        switch(merchant) {
            // FOOD DELIVERY
            case 'swiggy':
            case 'zomato':
                productCount = await this.generateFoodDeliveryData(merchantPath, merchant);
                break;
            
            // QUICK COMMERCE
            case 'zepto':
            case 'blinkit':
                productCount = await this.generateQuickCommerceData(merchantPath, merchant);
                break;
            
            // GROCERY
            case 'bigbasket':
            case 'dmart':
            case 'reliance':
            case 'tata':
            case 'reliance_fresh':
            case 'more':
                productCount = await this.generateGroceryData(merchantPath, merchant);
                break;
            
            // SHOPPING
            case 'amazon':
            case 'flipkart':
            case 'snapdeal':
            case 'shopclues':
                productCount = await this.generateShoppingData(merchantPath, merchant);
                break;
            
            // FASHION
            case 'myntra':
            case 'ajio':
            case 'tatacliq':
                productCount = await this.generateFashionData(merchantPath, merchant);
                break;
            
            // ELECTRONICS
            case 'croma':
            case 'vijay_sales':
            case 'reliance_digital':
            case 'poorvika':
            case 'lot_mobile':
                productCount = await this.generateElectronicsData(merchantPath, merchant);
                break;
            
            // PIZZA CHAINS
            case 'dominoz':
            case 'pizzahut':
                productCount = await this.generatePizzaData(merchantPath, merchant);
                break;
            
            // BURGER CHAINS
            case 'burgerking':
            case 'mcdonalds':
                productCount = await this.generateBurgerData(merchantPath, merchant);
                break;
            
            // OTHER FOOD CHAINS
            case 'kfc':
                productCount = await this.generateKFCData(merchantPath, merchant);
                break;
            case 'subway':
                productCount = await this.generateSubwayData(merchantPath, merchant);
                break;
            case 'taco_bell':
                productCount = await this.generateTacoBellData(merchantPath, merchant);
                break;
            case 'dunkin_donuts':
                productCount = await this.generateDunkinData(merchantPath, merchant);
                break;
            
            // CAFES
            case 'starbucks':
            case 'ccd':
            case 'chaayos':
            case 'barista':
                productCount = await this.generateCafeData(merchantPath, merchant);
                break;
            
            // INDIAN CHAINS
            case 'biryani_by_kilo':
            case 'behrouz':
                productCount = await this.generateBiryaniData(merchantPath, merchant);
                break;
            case 'firangi_bake':
                productCount = await this.generateFirangiData(merchantPath, merchant);
                break;
            case 'faasos':
                productCount = await this.generateFaasosData(merchantPath, merchant);
                break;
            case 'lunchbox':
                productCount = await this.generateLunchboxData(merchantPath, merchant);
                break;
            case 'sweet_china':
                productCount = await this.generateSweetChinaData(merchantPath, merchant);
                break;
            case 'samosa_party':
                productCount = await this.generateSamosaData(merchantPath, merchant);
                break;
            case 'haldiram':
            case 'bikanerwala':
                productCount = await this.generateSnackData(merchantPath, merchant);
                break;
            case 'naturals_icecream':
                productCount = await this.generateIceCreamData(merchantPath, merchant);
                break;
            
            // CLOUD KITCHENS
            case 'eatfit':
            case 'fit_food':
            case 'salad_days':
            case 'fresh_menu':
                productCount = await this.generateHealthyFoodData(merchantPath, merchant);
                break;
            
            // KIDS & TOYS
            case 'firstcry':
            case 'hopscotch':
            case 'kids_kemp':
                productCount = await this.generateKidsData(merchantPath, merchant);
                break;
            case 'hamleys':
            case 'toysrus':
                productCount = await this.generateToysData(merchantPath, merchant);
                break;
            
            // HEALTH
            case 'netmeds':
            case 'pharmeasy':
            case '1mg':
            case 'apollo_pharmacy':
            case 'medlife':
                productCount = await this.generateHealthData(merchantPath, merchant);
                break;
            
            // BEAUTY
            case 'nykaa':
            case 'purplle':
            case 'health_glow':
                productCount = await this.generateBeautyData(merchantPath, merchant);
                break;
            
            // FURNITURE
            case 'pepperfry':
            case 'urban_ladder':
            case 'ikea':
                productCount = await this.generateFurnitureData(merchantPath, merchant);
                break;
            
            // BOOKS
            case 'amazon_books':
            case 'flipkart_books':
            case 'bookswagon':
                productCount = await this.generateBooksData(merchantPath, merchant);
                break;
            
            // PETS
            case 'heads_up_for_tails':
            case 'doggy_world':
                productCount = await this.generatePetData(merchantPath, merchant);
                break;
            
            // ALCOHOL
            case 'hipbar':
            case 'living_liquids':
            case 'wine_nation':
                productCount = await this.generateAlcoholData(merchantPath, merchant);
                break;
            
            // LOCAL STORES
            case 'local_kirana':
            case 'local_medical':
            case 'local_restaurant':
                productCount = await this.generateLocalData(merchantPath, merchant);
                break;
            
            default:
                productCount = await this.generateGenericData(merchantPath, merchant);
        }

        return productCount;
    }

    // ============================================
    // FOOD DELIVERY (Swiggy, Zomato)
    // ============================================
    async generateFoodDeliveryData(merchantPath, merchant) {
        const restaurants = [];
        const cuisines = [
            'North Indian', 'South Indian', 'Chinese', 'Italian', 'Continental',
            'Fast Food', 'Biryani', 'Pizza', 'Burgers', 'Street Food', 'Healthy',
            'Mughlai', 'Thai', 'Japanese', 'Mexican', 'Mediterranean'
        ];
        
        const areas = ['Indiranagar', 'Koramangala', 'Whitefield', 'MG Road', 'Jayanagar',
                      'JP Nagar', 'HSR Layout', 'Electronic City', 'Marathahalli', 'Bellandur'];

        // Generate 100 restaurants
        for (let i = 1; i <= 100; i++) {
            const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
            const secondaryCuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
            const area = areas[Math.floor(Math.random() * areas.length)];
            
            const restaurant = {
                id: `${merchant}_rest_${i}`,
                name: `${['The', 'Tasty', 'Royal', 'Spicy', 'Authentic'][Math.floor(Math.random()*5)]} ${cuisine} ${['Corner', 'House', 'Kitchen', 'Cafe', 'Restaurant'][Math.floor(Math.random()*5)]}`,
                cuisine: [cuisine, secondaryCuisine].filter((v, i, a) => a.indexOf(v) === i).join(', '),
                rating: (Math.random() * 2 + 3).toFixed(1),
                ratingCount: Math.floor(Math.random() * 5000) + 200,
                priceForTwo: Math.floor(Math.random() * 1500) + 300,
                location: {
                    area: area,
                    address: `Shop ${Math.floor(Math.random()*100)+1}, ${area} Main Road, Bangalore`,
                    lat: 12.9716 + (Math.random() * 0.1 - 0.05),
                    lng: 77.5946 + (Math.random() * 0.1 - 0.05)
                },
                deliveryTime: Math.floor(Math.random() * 30) + 25 + ' min',
                offers: Math.random() > 0.7 ? [
                    `${Math.floor(Math.random() * 30) + 10}% off up to ₹${Math.floor(Math.random() * 100) + 50}`,
                    `Free delivery on orders above ₹${Math.floor(Math.random() * 300) + 200}`
                ] : [],
                image: `https://picsum.photos/200/150?restaurant=${i}`,
                isOpen: Math.random() > 0.1,
                isPureVeg: Math.random() > 0.7,
                acceptCards: Math.random() > 0.3
            };

            // Generate menu items for this restaurant
            const menuItems = [];
            const categories = ['Starters', 'Main Course', 'Breads', 'Rice', 'Desserts', 'Beverages'];
            
            for (let j = 1; j <= 30; j++) {
                const category = categories[Math.floor(Math.random() * categories.length)];
                const price = Math.floor(Math.random() * 400) + 80;
                
                menuItems.push({
                    id: `${merchant}_item_${i}_${j}`,
                    name: this.generateFoodName(cuisine, category),
                    description: `Delicious ${category.toLowerCase()} prepared with authentic spices`,
                    price: price,
                    category: category,
                    isVeg: Math.random() > 0.4,
                    isPopular: Math.random() > 0.8,
                    image: `https://picsum.photos/100/100?food=${i}${j}`,
                    rating: Math.random() > 0.3 ? (Math.random() * 2 + 3).toFixed(1) : null
                });
            }

            restaurants.push(restaurant);
            
            // Save menu for this restaurant
            await fs.writeFile(
                path.join(merchantPath, `menu_${i}.json`),
                JSON.stringify(menuItems, null, 2)
            );
        }

        await fs.writeFile(
            path.join(merchantPath, 'restaurants.json'),
            JSON.stringify(restaurants, null, 2)
        );

        await fs.writeFile(
            path.join(merchantPath, 'offers.json'),
            JSON.stringify(this.generateOffers(50, merchant), null, 2)
        );

        return restaurants.length * 30; // 100 restaurants * 30 items = 3000 products
    }

    // ============================================
    // QUICK COMMERCE (Zepto, Blinkit)
    // ============================================
    async generateQuickCommerceData(merchantPath, merchant) {
        const categories = [
            { name: 'Fruits & Vegetables', itemCount: 150 },
            { name: 'Dairy & Bakery', itemCount: 80 },
            { name: 'Snacks & Beverages', itemCount: 200 },
            { name: 'Household Essentials', itemCount: 120 },
            { name: 'Personal Care', itemCount: 150 },
            { name: 'Baby Care', itemCount: 60 },
            { name: 'Pet Supplies', itemCount: 40 },
            { name: 'Home & Kitchen', itemCount: 100 },
            { name: 'Electronics', itemCount: 50 },
            { name: 'Stationery', itemCount: 50 }
        ];

        const products = [];
        const fruits = [
            { name: 'Apple', varieties: ['Shimla', 'Kashmiri', 'Washington'], unit: 'kg', price: [120, 180, 220] },
            { name: 'Banana', varieties: ['Yelakki', 'Robusta'], unit: 'dozen', price: [40, 60] },
            { name: 'Orange', varieties: ['Nagpur', 'Kinnow'], unit: 'kg', price: [80, 120] },
            { name: 'Mango', varieties: ['Alphonso', 'Totapuri', 'Badami'], unit: 'kg', price: [150, 250, 350] },
            { name: 'Grapes', varieties: ['Green', 'Black'], unit: 'kg', price: [90, 120] },
            { name: 'Pomegranate', varieties: ['Regular'], unit: 'kg', price: [140, 180] },
            { name: 'Papaya', varieties: ['Regular'], unit: 'kg', price: [40, 60] },
            { name: 'Watermelon', varieties: ['Regular'], unit: 'kg', price: [25, 35] },
            { name: 'Pineapple', varieties: ['Regular'], unit: 'piece', price: [50, 80] },
            { name: 'Strawberry', varieties: ['Regular'], unit: 'box', price: [80, 120] }
        ];

        const vegetables = [
            { name: 'Tomato', varieties: ['Local', 'Hybrid'], unit: 'kg', price: [30, 50] },
            { name: 'Onion', varieties: ['Red', 'White'], unit: 'kg', price: [25, 40] },
            { name: 'Potato', varieties: ['Local', 'Imported'], unit: 'kg', price: [20, 35] },
            { name: 'Carrot', varieties: ['Orange', 'Red'], unit: 'kg', price: [40, 60] },
            { name: 'Cabbage', varieties: ['Green'], unit: 'kg', price: [25, 35] },
            { name: 'Cauliflower', varieties: ['Local'], unit: 'piece', price: [40, 70] },
            { name: 'Spinach', varieties: ['Bunch'], unit: 'bunch', price: [15, 25] },
            { name: 'Cucumber', varieties: ['Regular', 'English'], unit: 'kg', price: [30, 50] },
            { name: 'Brinjal', varieties: ['Purple', 'Green'], unit: 'kg', price: [30, 45] },
            { name: 'Capsicum', varieties: ['Green', 'Red', 'Yellow'], unit: 'kg', price: [50, 80] }
        ];

        const dairyProducts = [
            { name: 'Milk', brands: ['Amul', 'Nandini', 'Mother Dairy'], unit: 'liter', price: [50, 60, 70] },
            { name: 'Curd', brands: ['Amul', 'Nandini', 'Epigamia'], unit: 'kg', price: [60, 80, 100] },
            { name: 'Paneer', brands: ['Amul', 'Mother Dairy'], unit: 'kg', price: [280, 320] },
            { name: 'Butter', brands: ['Amul', 'Mother Dairy'], unit: 'gram', price: [50, 60] },
            { name: 'Cheese', brands: ['Amul', 'Britannia', 'Kraft'], unit: 'gram', price: [80, 120, 150] },
            { name: 'Yogurt', brands: ['Epigamia', 'Yoplait'], unit: 'cup', price: [40, 60] }
        ];

        const snacks = [
            { name: 'Lays Chips', flavors: ['Classic', 'Magic Masala', 'American Style'], unit: 'pack', price: [10, 20, 50] },
            { name: 'Kurkure', flavors: ['Masala Munch', 'Chatpata'], unit: 'pack', price: [10, 20] },
            { name: 'Biscuits', brands: ['Parle', 'Britannia', 'Sunfeast'], unit: 'pack', price: [20, 40, 60] },
            { name: 'Namkeen', brands: ['Haldiram', 'Bikanerwala'], unit: 'gram', price: [50, 100, 150] },
            { name: 'Chocolate', brands: ['Dairy Milk', 'KitKat', 'Munch'], unit: 'piece', price: [10, 20, 50] }
        ];

        // Generate products for each category
        let productId = 1;

        // Fruits
        for (const fruit of fruits) {
            for (let i = 0; i < fruit.varieties.length; i++) {
                const variety = fruit.varieties[i];
                const price = fruit.price[i % fruit.price.length];
                products.push({
                    id: `${merchant}_prod_${productId++}`,
                    name: `${fruit.name} (${variety})`,
                    description: `Fresh ${variety} ${fruit.name.toLowerCase()} imported directly from farms`,
                    price: price + (Math.random() * 20 - 10),
                    unit: fruit.unit,
                    category: 'Fruits & Vegetables',
                    subCategory: 'Fruits',
                    brand: 'Farm Fresh',
                    inStock: Math.random() > 0.05,
                    rating: (Math.random() * 2 + 3).toFixed(1),
                    image: '🍎',
                    isOrganic: Math.random() > 0.7,
                    deliveryTime: '10 min'
                });
            }
        }

        // Vegetables
        for (const veg of vegetables) {
            for (let i = 0; i < veg.varieties.length; i++) {
                const variety = veg.varieties[i];
                const price = veg.price[i % veg.price.length];
                products.push({
                    id: `${merchant}_prod_${productId++}`,
                    name: `${veg.name} (${variety})`,
                    description: `Fresh ${variety} ${veg.name.toLowerCase()} from local farms`,
                    price: price + (Math.random() * 10 - 5),
                    unit: veg.unit,
                    category: 'Fruits & Vegetables',
                    subCategory: 'Vegetables',
                    brand: 'Farm Fresh',
                    inStock: Math.random() > 0.05,
                    rating: (Math.random() * 2 + 3).toFixed(1),
                    image: '🥕',
                    isOrganic: Math.random() > 0.8,
                    deliveryTime: '10 min'
                });
            }
        }

        // Dairy
        for (const dairy of dairyProducts) {
            for (let i = 0; i < dairy.brands.length; i++) {
                const brand = dairy.brands[i];
                const price = dairy.price[i % dairy.price.length];
                products.push({
                    id: `${merchant}_prod_${productId++}`,
                    name: `${brand} ${dairy.name}`,
                    description: `Fresh ${dairy.name.toLowerCase()} from ${brand}`,
                    price: price + (Math.random() * 10 - 5),
                    unit: dairy.unit,
                    category: 'Dairy & Bakery',
                    brand: brand,
                    inStock: Math.random() > 0.1,
                    rating: (Math.random() * 1.5 + 3.5).toFixed(1),
                    image: '🥛',
                    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    deliveryTime: '10 min'
                });
            }
        }

        // Snacks
        for (const snack of snacks) {
            if (snack.flavors) {
                for (const flavor of snack.flavors) {
                    products.push({
                        id: `${merchant}_prod_${productId++}`,
                        name: `${snack.name} (${flavor})`,
                        description: `Delicious ${flavor} flavor`,
                        price: snack.price[0] + (Math.random() * 10 - 5),
                        unit: snack.unit,
                        category: 'Snacks & Beverages',
                        brand: snack.name.split(' ')[0],
                        inStock: Math.random() > 0.1,
                        rating: (Math.random() * 2 + 3).toFixed(1),
                        image: '🍪',
                        deliveryTime: '10 min'
                    });
                }
            } else {
                for (let i = 0; i < snack.brands.length; i++) {
                    const brand = snack.brands[i];
                    const price = snack.price[i % snack.price.length];
                    products.push({
                        id: `${merchant}_prod_${productId++}`,
                        name: `${brand} ${snack.name}`,
                        description: `Delicious ${snack.name.toLowerCase()}`,
                        price: price + (Math.random() * 10 - 5),
                        unit: snack.unit,
                        category: 'Snacks & Beverages',
                        brand: brand,
                        inStock: Math.random() > 0.1,
                        rating: (Math.random() * 2 + 3).toFixed(1),
                        image: '🍪',
                        deliveryTime: '10 min'
                    });
                }
            }
        }

        // Add household items
        const householdItems = [
            { name: 'Detergent', brands: ['Surf Excel', 'Ariel', 'Tide'], unit: 'kg', price: [150, 200, 300] },
            { name: 'Dish Soap', brands: ['Vim', 'Pril'], unit: 'ml', price: [50, 80] },
            { name: 'Toilet Cleaner', brands: ['Harpic', 'Lizol'], unit: 'ml', price: [60, 100] },
            { name: 'Floor Cleaner', brands: ['Lizol', 'Colin'], unit: 'ml', price: [80, 120] }
        ];

        for (const item of householdItems) {
            for (let i = 0; i < item.brands.length; i++) {
                const brand = item.brands[i];
                const price = item.price[i % item.price.length];
                products.push({
                    id: `${merchant}_prod_${productId++}`,
                    name: `${brand} ${item.name}`,
                    description: `Effective ${item.name.toLowerCase()} for daily use`,
                    price: price + (Math.random() * 20 - 10),
                    unit: item.unit,
                    category: 'Household Essentials',
                    brand: brand,
                    inStock: Math.random() > 0.1,
                    rating: (Math.random() * 1.5 + 3.5).toFixed(1),
                    image: '🧹',
                    deliveryTime: '10 min'
                });
            }
        }

        // Write categories
        await fs.writeFile(
            path.join(merchantPath, 'categories.json'),
            JSON.stringify(categories, null, 2)
        );

        // Write products
        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        // Write offers
        await fs.writeFile(
            path.join(merchantPath, 'offers.json'),
            JSON.stringify(this.generateOffers(30, merchant), null, 2)
        );

        return products.length;
    }

    // ============================================
    // GROCERY (BigBasket, DMart, etc.)
    // ============================================
    async generateGroceryData(merchantPath, merchant) {
        // Similar to quick commerce but with more products and different categories
        const products = [];
        let productId = 1;

        const categories = [
            'Fruits & Vegetables', 'Dairy & Bakery', 'Staples', 'Snacks & Beverages',
            'Household Items', 'Personal Care', 'Baby Care', 'Pet Care', 'Home & Kitchen',
            'Electronics', 'Books & Stationery', 'Sports & Fitness'
        ];

        // Generate 1500 products
        for (let i = 1; i <= 1500; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const price = Math.floor(Math.random() * 1000) + 20;
            
            products.push({
                id: `${merchant}_prod_${productId++}`,
                name: `${category} Item ${i}`,
                description: `High quality ${category.toLowerCase()} product`,
                price: price,
                mrp: price + Math.floor(Math.random() * 200),
                discount: Math.floor(Math.random() * 20),
                unit: ['kg', 'liter', 'pack', 'piece'][Math.floor(Math.random() * 4)],
                category: category,
                brand: ['Local', 'Imported', 'Premium', 'Organic'][Math.floor(Math.random() * 4)],
                inStock: Math.random() > 0.1,
                rating: (Math.random() * 2 + 3).toFixed(1),
                image: '🛒',
                deliveryTime: '2-4 hours'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        await fs.writeFile(
            path.join(merchantPath, 'categories.json'),
            JSON.stringify(categories, null, 2)
        );

        await fs.writeFile(
            path.join(merchantPath, 'offers.json'),
            JSON.stringify(this.generateOffers(40, merchant), null, 2)
        );

        return products.length;
    }

    // ============================================
    // SHOPPING (Amazon, Flipkart)
    // ============================================
    async generateShoppingData(merchantPath, merchant) {
        const categories = [
            'Electronics', 'Clothing', 'Footwear', 'Home & Kitchen', 'Books',
            'Toys', 'Sports', 'Automotive', 'Health', 'Beauty', 'Groceries'
        ];

        const products = [];
        let productId = 1;

        // Generate 2000 products
        for (let i = 1; i <= 2000; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const price = Math.floor(Math.random() * 50000) + 100;
            
            products.push({
                id: `${merchant}_prod_${productId++}`,
                name: `${category} Product ${i}`,
                description: `High quality ${category.toLowerCase()} product with warranty`,
                price: price,
                mrp: price + Math.floor(Math.random() * 10000),
                discount: Math.floor(Math.random() * 30),
                category: category,
                brand: ['Samsung', 'Apple', 'Sony', 'LG', 'Nike', 'Adidas', 'Puma'][Math.floor(Math.random() * 7)],
                rating: (Math.random() * 2 + 3).toFixed(1),
                ratingCount: Math.floor(Math.random() * 5000) + 10,
                inStock: Math.random() > 0.2,
                image: '📦',
                deliveryTime: 'Tomorrow',
                returnPolicy: '7 days return',
                warranty: Math.random() > 0.5 ? '1 year' : 'No warranty'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        await fs.writeFile(
            path.join(merchantPath, 'categories.json'),
            JSON.stringify(categories, null, 2)
        );

        return products.length;
    }

    // ============================================
    // FASHION (Myntra, Ajio)
    // ============================================
    async generateFashionData(merchantPath, merchant) {
        const categories = ['Men', 'Women', 'Kids'];
        const subCategories = {
            'Men': ['T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Suits', 'Activewear'],
            'Women': ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Ethnic Wear', 'Activewear'],
            'Kids': ['T-Shirts', 'Jeans', 'Dresses', 'Ethnic Wear']
        };

        const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
        const colors = ['Red', 'Blue', 'Black', 'White', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Brown'];
        const brands = ['Nike', 'Adidas', 'Puma', 'Levis', 'Wrangler', 'US Polo', 'Allen Solly', 'Peter England'];

        const products = [];
        let productId = 1;

        // Generate 1500 products
        for (let i = 1; i <= 1500; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const subCategory = subCategories[category][Math.floor(Math.random() * subCategories[category].length)];
            const price = Math.floor(Math.random() * 5000) + 500;
            
            const availableSizes = [];
            const availableColors = [];
            
            for (let j = 0; j < Math.floor(Math.random() * 4) + 2; j++) {
                availableSizes.push(sizes[Math.floor(Math.random() * sizes.length)]);
            }
            
            for (let j = 0; j < Math.floor(Math.random() * 3) + 1; j++) {
                availableColors.push(colors[Math.floor(Math.random() * colors.length)]);
            }

            products.push({
                id: `${merchant}_prod_${productId++}`,
                name: `${brands[Math.floor(Math.random() * brands.length)]} ${subCategory}`,
                description: `Stylish ${subCategory.toLowerCase()} for ${category.toLowerCase()}`,
                price: price,
                mrp: price + Math.floor(Math.random() * 2000),
                discount: Math.floor(Math.random() * 40),
                category: category,
                subCategory: subCategory,
                brand: brands[Math.floor(Math.random() * brands.length)],
                availableSizes: [...new Set(availableSizes)],
                availableColors: [...new Set(availableColors)],
                rating: (Math.random() * 2 + 3).toFixed(1),
                inStock: Math.random() > 0.2,
                image: '👕',
                deliveryTime: '2-3 days',
                material: ['Cotton', 'Polyester', 'Wool', 'Silk', 'Linen'][Math.floor(Math.random() * 5)]
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        return products.length;
    }

    // ============================================
    // ELECTRONICS (Croma, Vijay Sales, Reliance Digital, etc.)
    // ============================================
    async generateElectronicsData(merchantPath, merchant) {
        const products = [];
        const categories = [
            'Smartphones', 'Laptops', 'Tablets', 'Televisions', 'Headphones',
            'Speakers', 'Cameras', 'Smart Watches', 'Gaming Consoles', 'Accessories'
        ];
        
        const brands = {
            'Smartphones': ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Vivo', 'Oppo', 'Realme'],
            'Laptops': ['Apple', 'Dell', 'HP', 'Lenovo', 'Acer', 'Asus', 'MSI'],
            'Televisions': ['Samsung', 'LG', 'Sony', 'TCL', 'Mi', 'Panasonic'],
            'Headphones': ['Sony', 'Bose', 'JBL', 'Boat', 'Sennheiser', 'Apple'],
            'Speakers': ['JBL', 'Bose', 'Sony', 'Boat', 'Marshall', 'Harman Kardon'],
            'Cameras': ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'GoPro', 'Panasonic'],
            'Smart Watches': ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Noise', 'Boat'],
            'Gaming Consoles': ['Sony', 'Microsoft', 'Nintendo', 'Asus', 'MSI'],
            'Accessories': ['Logitech', 'Zebronics', 'Portronics', 'Amkette', 'HyperX']
        };

        let productId = 1;

        // Generate 1500 electronics products
        for (let i = 1; i <= 1500; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const brandList = brands[category] || ['Generic'];
            const brand = brandList[Math.floor(Math.random() * brandList.length)];
            
            const price = category === 'Smartphones' ? Math.floor(Math.random() * 80000) + 10000 :
                         category === 'Laptops' ? Math.floor(Math.random() * 150000) + 30000 :
                         category === 'Televisions' ? Math.floor(Math.random() * 200000) + 20000 :
                         category === 'Cameras' ? Math.floor(Math.random() * 100000) + 15000 :
                         Math.floor(Math.random() * 20000) + 1000;
            
            const mrp = price + Math.floor(Math.random() * price * 0.3);
            
            products.push({
                id: `${merchant}_prod_${productId++}`,
                name: `${brand} ${category} ${i}`,
                description: `High-quality ${category.toLowerCase()} with latest features`,
                price: price,
                mrp: mrp,
                discount: Math.floor(((mrp - price) / mrp) * 100),
                category: category,
                brand: brand,
                specifications: {
                    warranty: Math.random() > 0.3 ? `${Math.floor(Math.random() * 2) + 1} year` : 'No warranty',
                    color: ['Black', 'Silver', 'Gold', 'Blue', 'Red'][Math.floor(Math.random() * 5)],
                    inTheBox: ['Product', 'Charger', 'Cable', 'Manual', 'Warranty Card']
                },
                rating: (Math.random() * 2 + 3).toFixed(1),
                ratingCount: Math.floor(Math.random() * 5000) + 100,
                inStock: Math.random() > 0.15,
                image: category === 'Smartphones' ? '📱' : 
                        category === 'Laptops' ? '💻' :
                        category === 'Televisions' ? '📺' :
                        category === 'Headphones' ? '🎧' :
                        category === 'Cameras' ? '📷' : '📦',
                deliveryTime: '2-3 days',
                emiAvailable: Math.random() > 0.5,
                exchangeAvailable: Math.random() > 0.6
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        await fs.writeFile(
            path.join(merchantPath, 'categories.json'),
            JSON.stringify(categories, null, 2)
        );

        await fs.writeFile(
            path.join(merchantPath, 'offers.json'),
            JSON.stringify(this.generateOffers(30, merchant), null, 2)
        );

        return products.length;
    }

    // ============================================
    // PIZZA CHAINS
    // ============================================
    async generatePizzaData(merchantPath, merchant) {
        const pizzas = [];
        const sizes = ['Regular', 'Medium', 'Large'];
        const crusts = ['Hand Tossed', 'Cheese Burst', 'Thin Crust', 'Pan Crust', 'Wheat Thin Crust'];
        const toppings = [
            'Extra Cheese', 'Pepperoni', 'Mushrooms', 'Onions', 'Capsicum',
            'Olives', 'Jalapenos', 'Tomatoes', 'Corn', 'Paneer', 'Chicken Tikka'
        ];

        const pizzaNames = [
            'Margherita', 'Pepperoni', 'Farmhouse', 'Veg Extravaganza',
            'Non-Veg Supreme', 'Chicken Fiesta', 'Mushroom Delight',
            'Paneer Makhani', 'Tandoori Chicken', 'Mexican Green Wave'
        ];

        // Generate 30 pizzas
        for (let i = 0; i < 30; i++) {
            const basePrice = Math.floor(Math.random() * 300) + 199;
            const name = pizzaNames[i % pizzaNames.length];
            const isVeg = !name.includes('Chicken') && !name.includes('Non-Veg');
            
            const variants = sizes.map(size => ({
                size: size,
                price: basePrice + (size === 'Medium' ? 100 : size === 'Large' ? 200 : 0),
                crusts: crusts.map(crust => ({
                    name: crust,
                    price: crust === 'Cheese Burst' ? 99 : crust === 'Wheat Thin Crust' ? 49 : 0
                }))
            }));

            pizzas.push({
                id: `${merchant}_pizza_${i + 1}`,
                name: name,
                description: `Delicious ${name} pizza with fresh ingredients and secret sauce`,
                isVeg: isVeg,
                variants: variants,
                toppings: toppings.map(t => ({
                    name: t,
                    price: Math.floor(Math.random() * 60) + 30,
                    isVeg: !t.includes('Chicken') && !t.includes('Pepperoni')
                })),
                popular: Math.random() > 0.7,
                rating: (Math.random() * 2 + 3).toFixed(1),
                image: '🍕'
            });
        }

        // Generate sides
        const sides = [];
        for (let i = 1; i <= 20; i++) {
            sides.push({
                id: `${merchant}_side_${i}`,
                name: ['Garlic Bread', 'Bread Sticks', 'Potato Wedges', 'Chicken Wings', 'Pasta', 'Taco', 'Wrap'][Math.floor(Math.random() * 7)],
                description: 'Delicious side dish to complement your pizza',
                price: Math.floor(Math.random() * 200) + 99,
                isVeg: Math.random() > 0.5,
                image: '🍟'
            });
        }

        // Generate beverages
        const beverages = [];
        for (let i = 1; i <= 15; i++) {
            beverages.push({
                id: `${merchant}_bev_${i}`,
                name: ['Pepsi', 'Coke', '7Up', 'Miranda', 'Water', 'Mango Shake', 'Lassi'][Math.floor(Math.random() * 7)],
                size: ['500ml', '1L', '1.5L', 'Can'][Math.floor(Math.random() * 4)],
                price: Math.floor(Math.random() * 80) + 40,
                image: '🥤'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'pizzas.json'),
            JSON.stringify(pizzas, null, 2)
        );

        await fs.writeFile(
            path.join(merchantPath, 'sides.json'),
            JSON.stringify(sides, null, 2)
        );

        await fs.writeFile(
            path.join(merchantPath, 'beverages.json'),
            JSON.stringify(beverages, null, 2)
        );

        return pizzas.length + sides.length + beverages.length;
    }

    // ============================================
    // BURGER CHAINS
    // ============================================
    async generateBurgerData(merchantPath, merchant) {
        const burgers = [];
        const burgerNames = [
            'Whopper', 'Chicken Burger', 'Veg Burger', 'Crispy Chicken', 'Maha Burger',
            'Double Patty', 'Cheese Burger', 'Bacon Burger', 'Spicy Chicken', 'Aloo Tikki'
        ];

        // Generate 25 burgers
        for (let i = 1; i <= 25; i++) {
            const name = burgerNames[i % burgerNames.length];
            const isVeg = i % 3 === 0;
            
            burgers.push({
                id: `${merchant}_burger_${i}`,
                name: name,
                description: `Juicy ${name} with fresh lettuce, tomatoes and our special sauce`,
                price: Math.floor(Math.random() * 250) + 99,
                isVeg: isVeg,
                calories: Math.floor(Math.random() * 500) + 300,
                rating: (Math.random() * 2 + 3).toFixed(1),
                image: '🍔'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'burgers.json'),
            JSON.stringify(burgers, null, 2)
        );

        // Add meals, sides, beverages similar to pizza
        const sides = [];
        for (let i = 1; i <= 15; i++) {
            sides.push({
                id: `${merchant}_side_${i}`,
                name: ['French Fries', 'Onion Rings', 'Chicken Nuggets', 'Salad', 'Cheese Sticks'][Math.floor(Math.random() * 5)],
                price: Math.floor(Math.random() * 150) + 50,
                image: '🍟'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'sides.json'),
            JSON.stringify(sides, null, 2)
        );

        return burgers.length + sides.length;
    }

    // ============================================
    // KFC
    // ============================================
    async generateKFCData(merchantPath, merchant) {
        const items = [];
        
        const chickenItems = [
            { name: 'Chicken Bucket', pieces: [6, 12, 24], basePrice: 399 },
            { name: 'Hot Wings', pieces: [6, 12], basePrice: 199 },
            { name: 'Chicken Popcorn', sizes: ['Regular', 'Large'], basePrice: 129 },
            { name: 'Chicken Strips', pieces: [3, 5], basePrice: 179 },
            { name: 'Zinger Burger', variants: ['Classic', 'Spicy'], basePrice: 179 }
        ];

        for (let i = 1; i <= 30; i++) {
            const item = chickenItems[i % chickenItems.length];
            items.push({
                id: `${merchant}_item_${i}`,
                name: item.name,
                description: 'Signature KFC recipe with 11 herbs and spices',
                price: item.basePrice + Math.floor(Math.random() * 50),
                isVeg: false,
                image: '🍗',
                rating: (Math.random() * 2 + 3).toFixed(1)
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'items.json'),
            JSON.stringify(items, null, 2)
        );

        return items.length;
    }

    // ============================================
    // SUBWAY
    // ============================================
    async generateSubwayData(merchantPath, merchant) {
        const subs = [];
        const breads = ['Italian', 'Wheat', 'Honey Oat', 'Parmesan Oregano'];
        const fillings = ['Chicken Tikka', 'Paneer Tikka', 'Veg Patty', 'Meatball', 'Roast Chicken'];
        const sauces = ['Mayonnaise', 'Mustard', 'Sweet Onion', 'BBQ', 'Chipotle'];

        for (let i = 1; i <= 20; i++) {
            subs.push({
                id: `${merchant}_sub_${i}`,
                name: `${fillings[i % fillings.length]} Sub`,
                description: 'Freshly made sub with your choice of bread and toppings',
                price: Math.floor(Math.random() * 300) + 150,
                breads: breads,
                fillings: fillings,
                sauces: sauces,
                isVeg: i % 2 === 0,
                image: '🥪'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'subs.json'),
            JSON.stringify(subs, null, 2)
        );

        return subs.length;
    }

    // ============================================
    // TACO BELL
    // ============================================
    async generateTacoBellData(merchantPath, merchant) {
        const items = [];
        for (let i = 1; i <= 25; i++) {
            items.push({
                id: `${merchant}_item_${i}`,
                name: ['Taco', 'Burrito', 'Quesadilla', 'Nachos', 'Mexican Pizza'][i % 5],
                description: 'Authentic Mexican flavors',
                price: Math.floor(Math.random() * 200) + 99,
                isVeg: i % 3 !== 0,
                image: '🌮'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'items.json'),
            JSON.stringify(items, null, 2)
        );

        return items.length;
    }

    // ============================================
    // DUNKIN DONUTS
    // ============================================
    async generateDunkinData(merchantPath, merchant) {
        const donuts = [];
        const flavors = ['Glazed', 'Chocolate', 'Strawberry', 'Sprinkles', 'Boston Cream', 'Jelly'];

        for (let i = 1; i <= 30; i++) {
            donuts.push({
                id: `${merchant}_donut_${i}`,
                name: `${flavors[i % flavors.length]} Donut`,
                description: 'Freshly baked donuts',
                price: Math.floor(Math.random() * 60) + 40,
                flavor: flavors[i % flavors.length],
                image: '🍩'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'donuts.json'),
            JSON.stringify(donuts, null, 2)
        );

        return donuts.length;
    }

    // ============================================
    // CAFES (Starbucks, CCD, Chaayos, Barista)
    // ============================================
    async generateCafeData(merchantPath, merchant) {
        const beverages = [];
        const coffeeTypes = ['Latte', 'Cappuccino', 'Espresso', 'Americano', 'Mocha', 'Cold Coffee'];
        const teaTypes = ['Masala Chai', 'Green Tea', 'Lemon Tea', 'Ice Tea'];

        for (let i = 1; i <= 50; i++) {
            const isCoffee = i % 2 === 0;
            beverages.push({
                id: `${merchant}_bev_${i}`,
                name: isCoffee ? coffeeTypes[i % coffeeTypes.length] : teaTypes[i % teaTypes.length],
                description: isCoffee ? 'Premium coffee' : 'Freshly brewed tea',
                price: Math.floor(Math.random() * 200) + 80,
                sizes: ['Small', 'Regular', 'Large'],
                isHot: i % 3 !== 0,
                image: '☕',
                rating: (Math.random() * 2 + 3).toFixed(1)
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'beverages.json'),
            JSON.stringify(beverages, null, 2)
        );

        // Add snacks
        const snacks = [];
        for (let i = 1; i <= 25; i++) {
            snacks.push({
                id: `${merchant}_snack_${i}`,
                name: ['Sandwich', 'Croissant', 'Muffin', 'Cookie', 'Cake'][i % 5],
                price: Math.floor(Math.random() * 150) + 50,
                image: '🥐'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'snacks.json'),
            JSON.stringify(snacks, null, 2)
        );

        return beverages.length + snacks.length;
    }

    // ============================================
    // BIRYANI CHAINS
    // ============================================
    async generateBiryaniData(merchantPath, merchant) {
        const biryanis = [];
        const types = ['Chicken', 'Mutton', 'Veg', 'Prawn', 'Egg'];

        for (let i = 1; i <= 30; i++) {
            const type = types[i % types.length];
            biryanis.push({
                id: `${merchant}_biryani_${i}`,
                name: `${type} Biryani`,
                description: 'Authentic Hyderabadi dum biryani',
                price: Math.floor(Math.random() * 400) + 200,
                type: type,
                isVeg: type === 'Veg',
                rating: (Math.random() * 2 + 3).toFixed(1),
                image: '🍛',
                serves: Math.floor(Math.random() * 2) + 1
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'biryani.json'),
            JSON.stringify(biryanis, null, 2)
        );

        return biryanis.length;
    }

    // ============================================
    // FIRANGI BAKE
    // ============================================
    async generateFirangiData(merchantPath, merchant) {
        const items = [];
        const categories = ['Pastas', 'Lasagnas', 'Bakes', 'Garlic Breads', 'Desserts'];
        
        for (let i = 1; i <= 50; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            items.push({
                id: `${merchant}_item_${i}`,
                name: `${category} ${i}`,
                description: 'Authentic Italian baked dishes',
                price: Math.floor(Math.random() * 400) + 150,
                category: category,
                isVeg: Math.random() > 0.3,
                rating: (Math.random() * 2 + 3).toFixed(1),
                image: '🍝'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'items.json'),
            JSON.stringify(items, null, 2)
        );

        return items.length;
    }

    // ============================================
    // FAASOS (Wraps & Rolls)
    // ============================================
    async generateFaasosData(merchantPath, merchant) {
        const items = [];
        for (let i = 1; i <= 40; i++) {
            items.push({
                id: `${merchant}_item_${i}`,
                name: ['Chicken Wrap', 'Paneer Wrap', 'Veg Roll', 'Egg Roll', 'Falafel Wrap'][i % 5],
                description: 'Freshly made wraps and rolls',
                price: Math.floor(Math.random() * 200) + 99,
                isVeg: i % 3 === 0,
                image: '🌯'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'items.json'),
            JSON.stringify(items, null, 2)
        );

        return items.length;
    }

    // ============================================
    // LUNCHBOX
    // ============================================
    async generateLunchboxData(merchantPath, merchant) {
        const meals = [];
        const cuisines = ['North Indian', 'South Indian', 'Chinese', 'Continental'];
        
        for (let i = 1; i <= 60; i++) {
            const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
            meals.push({
                id: `${merchant}_meal_${i}`,
                name: `${cuisine} Meal Box ${i}`,
                description: 'Complete meal with roti, sabzi, rice, dal, and dessert',
                price: Math.floor(Math.random() * 300) + 150,
                cuisine: cuisine,
                isVeg: Math.random() > 0.2,
                calories: Math.floor(Math.random() * 400) + 500,
                rating: (Math.random() * 2 + 3).toFixed(1),
                image: '🍱'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'meals.json'),
            JSON.stringify(meals, null, 2)
        );

        return meals.length;
    }

    // ============================================
    // SWEET CHINA
    // ============================================
    async generateSweetChinaData(merchantPath, merchant) {
        const items = [];
        const categories = ['Noodles', 'Rice', 'Manchurian', 'Soups', 'Momos', 'Desserts'];
        
        for (let i = 1; i <= 70; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            items.push({
                id: `${merchant}_item_${i}`,
                name: `${category} ${i}`,
                description: 'Authentic Chinese dishes with Indian twist',
                price: Math.floor(Math.random() * 300) + 120,
                category: category,
                isVeg: Math.random() > 0.4,
                spiciness: ['Mild', 'Medium', 'Spicy'][Math.floor(Math.random() * 3)],
                rating: (Math.random() * 2 + 3).toFixed(1),
                image: '🥡'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'items.json'),
            JSON.stringify(items, null, 2)
        );

        return items.length;
    }

    // ============================================
    // SAMOSA PARTY
    // ============================================
    async generateSamosaData(merchantPath, merchant) {
        const items = [];
        const snacks = ['Samosa', 'Kachori', 'Pakora', 'Bhel Puri', 'Pani Puri', 'Dahi Puri', 'Chaat'];
        
        for (let i = 1; i <= 40; i++) {
            const snack = snacks[Math.floor(Math.random() * snacks.length)];
            items.push({
                id: `${merchant}_item_${i}`,
                name: `${snack} ${i}`,
                description: 'Fresh and crispy Indian snacks',
                price: Math.floor(Math.random() * 100) + 40,
                type: snack,
                isVeg: true,
                rating: (Math.random() * 2 + 3).toFixed(1),
                image: '🥟'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'items.json'),
            JSON.stringify(items, null, 2)
        );

        return items.length;
    }

    // ============================================
    // SNACKS (Haldiram, Bikanerwala)
    // ============================================
    async generateSnackData(merchantPath, merchant) {
        const products = [];
        const categories = ['Namkeen', 'Sweets', 'Snacks', 'Ready to Eat', 'Beverages'];
        
        for (let i = 1; i <= 300; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            products.push({
                id: `${merchant}_prod_${i}`,
                name: `${category} ${i}`,
                description: 'Traditional Indian snacks and sweets',
                price: Math.floor(Math.random() * 500) + 50,
                category: category,
                weight: ['200g', '500g', '1kg'][Math.floor(Math.random() * 3)],
                rating: (Math.random() * 2 + 3).toFixed(1),
                image: '🥨'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        return products.length;
    }

    // ============================================
    // ICE CREAM (Naturals Ice Cream)
    // ============================================
    async generateIceCreamData(merchantPath, merchant) {
        const flavors = [
            'Malai', 'Pista', 'Mango', 'Strawberry', 'Chocolate', 'Vanilla',
            'Butterscotch', 'Tender Coconut', 'Sitaphal', 'Jackfruit', 'Rose'
        ];
        
        const iceCreams = [];
        
        for (let i = 1; i <= 50; i++) {
            const flavor = flavors[Math.floor(Math.random() * flavors.length)];
            iceCreams.push({
                id: `${merchant}_icecream_${i}`,
                name: `${flavor} Ice Cream`,
                description: 'Natural and creamy ice cream',
                price: Math.floor(Math.random() * 200) + 80,
                flavor: flavor,
                sizes: ['Scoop', 'Regular', 'Family Pack'],
                isVeg: true,
                rating: (Math.random() * 2 + 3).toFixed(1),
                image: '🍦'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'icecreams.json'),
            JSON.stringify(iceCreams, null, 2)
        );

        return iceCreams.length;
    }

    // ============================================
    // HEALTHY FOOD (EatFit, Fit Food, Salad Days)
    // ============================================
    async generateHealthyFoodData(merchantPath, merchant) {
        const items = [];
        for (let i = 1; i <= 50; i++) {
            items.push({
                id: `${merchant}_item_${i}`,
                name: ['Grilled Chicken Salad', 'Quinoa Bowl', 'Fruit Salad', 'Protein Bowl', 'Green Salad'][i % 5],
                description: 'Healthy and nutritious meal',
                price: Math.floor(Math.random() * 300) + 150,
                calories: Math.floor(Math.random() * 300) + 200,
                protein: Math.floor(Math.random() * 20) + 10,
                isVeg: i % 2 === 0,
                image: '🥗'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'items.json'),
            JSON.stringify(items, null, 2)
        );

        return items.length;
    }

    // ============================================
    // KIDS & TOYS
    // ============================================
    async generateKidsData(merchantPath, merchant) {
        const products = [];
        const categories = ['Clothing', 'Footwear', 'Toys', 'Books', 'School Supplies'];

        for (let i = 1; i <= 500; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            products.push({
                id: `${merchant}_prod_${i}`,
                name: `${category} Item ${i}`,
                description: `High quality ${category.toLowerCase()} for kids`,
                price: Math.floor(Math.random() * 2000) + 100,
                category: category,
                ageGroup: ['0-2', '2-4', '4-6', '6-8', '8-12'][Math.floor(Math.random() * 5)],
                brand: ['FirstCry', 'Hopscotch', 'Gini & Jony', 'Lilliput'][Math.floor(Math.random() * 4)],
                image: '🧸'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        return products.length;
    }

    async generateToysData(merchantPath, merchant) {
        const toys = [];
        const toyTypes = ['Action Figures', 'Dolls', 'Board Games', 'Puzzles', 'Cars', 'Educational Toys'];

        for (let i = 1; i <= 400; i++) {
            toys.push({
                id: `${merchant}_toy_${i}`,
                name: `${toyTypes[i % toyTypes.length]} ${i}`,
                description: 'Fun and educational toy for kids',
                price: Math.floor(Math.random() * 3000) + 200,
                type: toyTypes[i % toyTypes.length],
                ageGroup: ['3-5', '5-7', '7-10', '10+'][Math.floor(Math.random() * 4)],
                brand: ['LEGO', 'Barbie', 'Hot Wheels', 'Fisher-Price'][Math.floor(Math.random() * 4)],
                image: '🎮'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'toys.json'),
            JSON.stringify(toys, null, 2)
        );

        return toys.length;
    }

    // ============================================
    // HEALTH & PHARMA
    // ============================================
    async generateHealthData(merchantPath, merchant) {
        const products = [];
        const categories = ['Medicine', 'Vitamins', 'Personal Care', 'Medical Devices', 'Ayurvedic'];

        for (let i = 1; i <= 1000; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            products.push({
                id: `${merchant}_prod_${i}`,
                name: `${category} Product ${i}`,
                description: `Pharmaceutical product`,
                price: Math.floor(Math.random() * 500) + 20,
                category: category,
                requiresPrescription: Math.random() > 0.7,
                manufacturer: ['Cipla', 'Sun Pharma', 'Dr Reddy\'s', 'Lupin'][Math.floor(Math.random() * 4)],
                image: '💊'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        return products.length;
    }

    // ============================================
    // BEAUTY
    // ============================================
    async generateBeautyData(merchantPath, merchant) {
        const products = [];
        const categories = ['Makeup', 'Skincare', 'Haircare', 'Fragrance', 'Tools'];

        for (let i = 1; i <= 800; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            products.push({
                id: `${merchant}_prod_${i}`,
                name: `${category} Product ${i}`,
                description: `Premium beauty product`,
                price: Math.floor(Math.random() * 3000) + 100,
                category: category,
                brand: ['L\'Oreal', 'Maybelline', 'MAC', 'Biotique', 'Lakme'][Math.floor(Math.random() * 5)],
                image: '💄'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        return products.length;
    }

    // ============================================
    // FURNITURE
    // ============================================
    async generateFurnitureData(merchantPath, merchant) {
        const products = [];
        const categories = ['Sofa', 'Bed', 'Table', 'Chair', 'Wardrobe', 'Decor'];

        for (let i = 1; i <= 300; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            products.push({
                id: `${merchant}_prod_${i}`,
                name: `${category} ${i}`,
                description: `Elegant furniture for your home`,
                price: Math.floor(Math.random() * 50000) + 2000,
                category: category,
                material: ['Wood', 'Metal', 'Plastic', 'Fabric'][Math.floor(Math.random() * 4)],
                color: ['Brown', 'Black', 'White', 'Beige'][Math.floor(Math.random() * 4)],
                image: '🪑'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        return products.length;
    }

    // ============================================
    // BOOKS
    // ============================================
    async generateBooksData(merchantPath, merchant) {
        const books = [];
        const genres = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Children'];

        for (let i = 1; i <= 500; i++) {
            books.push({
                id: `${merchant}_book_${i}`,
                title: `Book Title ${i}`,
                author: `Author ${i}`,
                description: `A fascinating book in ${genres[i % genres.length]} genre`,
                price: Math.floor(Math.random() * 800) + 100,
                genre: genres[i % genres.length],
                publisher: ['Penguin', 'HarperCollins', 'Hachette', 'Simon & Schuster'][Math.floor(Math.random() * 4)],
                image: '📚'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'books.json'),
            JSON.stringify(books, null, 2)
        );

        return books.length;
    }

    // ============================================
    // PET SUPPLIES
    // ============================================
    async generatePetData(merchantPath, merchant) {
        const products = [];
        const categories = ['Dog Food', 'Cat Food', 'Pet Toys', 'Pet Accessories', 'Grooming'];

        for (let i = 1; i <= 200; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            products.push({
                id: `${merchant}_prod_${i}`,
                name: `${category} Product ${i}`,
                description: `Quality supplies for your pet`,
                price: Math.floor(Math.random() * 1500) + 100,
                category: category,
                petType: ['Dog', 'Cat', 'Bird', 'Fish'][Math.floor(Math.random() * 4)],
                brand: ['Pedigree', 'Whiskas', 'Royal Canin', 'Hills'][Math.floor(Math.random() * 4)],
                image: '🐕'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        return products.length;
    }

    // ============================================
    // ALCOHOL
    // ============================================
    async generateAlcoholData(merchantPath, merchant) {
        const products = [];
        const categories = ['Whisky', 'Vodka', 'Rum', 'Beer', 'Wine'];

        for (let i = 1; i <= 150; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            products.push({
                id: `${merchant}_prod_${i}`,
                name: `${category} Brand ${i}`,
                description: `Premium quality ${category.toLowerCase()}`,
                price: Math.floor(Math.random() * 5000) + 500,
                category: category,
                alcoholContent: Math.floor(Math.random() * 30) + 30 + '%',
                volume: ['750ml', '1L', '500ml', '180ml'][Math.floor(Math.random() * 4)],
                image: '🍷'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        return products.length;
    }

    // ============================================
    // LOCAL STORES
    // ============================================
    async generateLocalData(merchantPath, merchant) {
        const products = [];
        const storeType = merchant.replace('local_', '');
        
        for (let i = 1; i <= 100; i++) {
            products.push({
                id: `${merchant}_prod_${i}`,
                name: `${storeType} Item ${i}`,
                description: `From your local ${storeType} store`,
                price: Math.floor(Math.random() * 500) + 20,
                category: storeType,
                deliveryTime: '30 min',
                image: '🏪'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        return products.length;
    }

    // ============================================
    // GENERIC FALLBACK
    // ============================================
    async generateGenericData(merchantPath, merchant) {
        const products = [];
        for (let i = 1; i <= 200; i++) {
            products.push({
                id: `${merchant}_prod_${i}`,
                name: `${merchant} Product ${i}`,
                description: `Quality product from ${merchant}`,
                price: Math.floor(Math.random() * 1000) + 100,
                category: 'General',
                image: '📦'
            });
        }

        await fs.writeFile(
            path.join(merchantPath, 'products.json'),
            JSON.stringify(products, null, 2)
        );

        return products.length;
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    generateFoodName(cuisine, category) {
        const names = {
            'North Indian': ['Butter Chicken', 'Dal Makhani', 'Paneer Butter Masala', 'Chole Bhature'],
            'South Indian': ['Dosa', 'Idli', 'Vada', 'Uttapam', 'Biryani'],
            'Chinese': ['Noodles', 'Fried Rice', 'Manchurian', 'Spring Roll'],
            'Italian': ['Pasta', 'Risotto', 'Lasagna', 'Gnocchi'],
            'Fast Food': ['Burger', 'Pizza', 'Fries', 'Sandwich']
        };
        
        const cuisineNames = names[cuisine] || names['North Indian'];
        return cuisineNames[Math.floor(Math.random() * cuisineNames.length)];
    }

    generateOffers(count, merchant) {
        const offers = [];
        for (let i = 1; i <= count; i++) {
            offers.push({
                id: `${merchant}_offer_${i}`,
                title: [`${Math.floor(Math.random() * 30) + 10}% Off`, 'Buy 1 Get 1', 'Free Delivery'][Math.floor(Math.random() * 3)],
                description: 'Limited time offer',
                code: `SAVE${Math.floor(Math.random() * 100)}`,
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                minOrder: Math.floor(Math.random() * 500) + 100,
                maxDiscount: Math.floor(Math.random() * 200) + 50
            });
        }
        return offers;
    }
}

// Run the generator
const generator = new MerchantDataGenerator();
generator.generateAllData().then(() => {
    console.log('\n✨ All merchant data generated successfully!');
    console.log('📁 Check the data/merchants folder for JSON files\n');
}).catch(error => {
    console.error('❌ Error generating data:', error);
});