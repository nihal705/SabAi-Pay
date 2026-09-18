// scripts/seedCatalogsToSupabase.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// ROBUST FILENAME PARSER
// ============================================
function extractRestaurantName(filename, merchantId, city) {
    console.log(`   🔍 Parsing: ${filename}`);  // <-- SEE WHAT THE FILENAME IS

    // Remove .json
    let name = filename.replace(/\.json$/i, '');

    // Split by underscore
    let parts = name.split('_');

    // If first part is merchantId, remove it
    if (parts[0] === merchantId) {
        parts.shift();
    }

    // Remove the last part if it's a known city abbreviation or all digits
    const last = parts[parts.length - 1];
    const cityPatterns = ['blr', 'bangalore', 'mumbai', 'delhi', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'lucknow'];
    if (last && (cityPatterns.includes(last) || /^\d+$/.test(last))) {
        parts.pop();
    }

    // Join with spaces
    let nameStr = parts.join(' ');

    // Handle special cases (capitalise or fix common names)
    const specials = {
        'a2b': 'A2B',
        'ccd': 'CCD',
        'ctr': 'CTR',
        'kfc': 'KFC',
        'mcd': "McDonald's",
        'dominos': "Domino's",
        'burgerking': 'Burger King',
        'pizzahut': "Pizza Hut",
        'tacobell': 'Taco Bell',
        'behrouz': 'Behrouz Biryani',
        'bawarchi': 'Bawarchi',
        'meghana': 'Meghana Foods',
        'paradise': 'Paradise Biryani',
        'grand': 'Grand Biryani',
        'nawabs': 'Nawabs',
        'saffron': 'Saffron',
        'chungwah': 'Chung Wah',
        'fattybao': 'Fatty Bao',
        'pindballuchi': 'Pind Balluchi',
        'punjabirasoi': 'Punjabi Rasoi',
        'sagarratna': 'Sagar Ratna',
        'vidyarthi': 'Vidyarthi Bhavan',
        'brahmins': "Brahmins Coffee Bar",
        'murugan': 'Murugan Idli',
        'ratnacafe': 'Ratna Cafe',
        'anand': 'Anand Bhavan',
    };

    // If nameStr is empty, use merchant+city
    if (!nameStr || /^\d+$/.test(nameStr.replace(/\s/g, ''))) {
        nameStr = `${merchantId.charAt(0).toUpperCase() + merchantId.slice(1)} - ${city.charAt(0).toUpperCase() + city.slice(1)}`;
        console.log(`   ⚠️ Fallback to: ${nameStr}`);
        return nameStr;
    }

    // Capitalise and apply specials
    nameStr = nameStr.split(' ').map(word => {
        const lower = word.toLowerCase();
        if (specials[lower]) return specials[lower];
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');

    console.log(`   ✅ Parsed as: ${nameStr}`);
    return nameStr;
}

// ============================================
// INFER CUISINE
// ============================================
function inferCuisine(menuItems, restaurantName) {
    if (!menuItems || menuItems.length === 0) return 'Various';
    const categories = menuItems.map(item => item.category || '').filter(Boolean);
    if (categories.length > 0) {
        const mostCommon = categories.reduce((a, b) => categories.filter(v => v === a).length >= categories.filter(v => v === b).length ? a : b);
        return mostCommon;
    }
    const nameLower = restaurantName.toLowerCase();
    if (nameLower.includes('biryani')) return 'Biryani';
    if (nameLower.includes('pizza')) return 'Pizza';
    if (nameLower.includes('burger') || nameLower.includes('kfc') || nameLower.includes('mcd')) return 'Burgers';
    if (nameLower.includes('dosa') || nameLower.includes('idli') || nameLower.includes('thindi')) return 'South Indian';
    if (nameLower.includes('paneer') || nameLower.includes('tikka') || nameLower.includes('punjabi')) return 'North Indian';
    if (nameLower.includes('noodles') || nameLower.includes('chinese') || nameLower.includes('wok')) return 'Chinese';
    return 'Various';
}

// ============================================
// SEED RESTAURANTS AND MENUS
// ============================================
async function seedRestaurantsAndMenus() {
    console.log('🌱 Seeding restaurants and menus...');
    const merchantsPath = path.join(__dirname, '../backend/data/merchants');
    const merchantDirs = ['swiggy', 'zomato'];

    for (const merchantId of merchantDirs) {
        const merchantPath = path.join(merchantsPath, merchantId);
        const locationsPath = path.join(merchantPath, 'locations');
        if (!fs.existsSync(locationsPath)) {
            console.log(`⚠️ No locations folder for ${merchantId}, skipping...`);
            continue;
        }

        const cities = fs.readdirSync(locationsPath).filter(f => {
            const stat = fs.statSync(path.join(locationsPath, f));
            return stat.isDirectory();
        });

        for (const city of cities) {
            const menuPath = path.join(locationsPath, city, 'menu');
            if (!fs.existsSync(menuPath)) {
                console.log(`⚠️ No menu folder for ${merchantId}/${city}, skipping...`);
                continue;
            }

            const menuFiles = fs.readdirSync(menuPath).filter(f => f.endsWith('.json'));

            for (const file of menuFiles) {
                const filePath = path.join(menuPath, file);
                let data;
                try {
                    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                } catch (e) {
                    console.error(`❌ Error parsing ${filePath}:`, e.message);
                    continue;
                }

                let restaurantName = '';
                let menuItems = [];
                let cuisine = 'Various';
                let rating = 4.0;
                let deliveryTime = '30-45 min';
                let priceForTwo = 500;
                let imageUrl = '/images/restaurants/default.jpg';

                // Determine structure
                if (data.restaurant) {
                    restaurantName = data.restaurant.name || '';
                    cuisine = data.restaurant.cuisine || 'Various';
                    rating = data.restaurant.rating || 4.0;
                    deliveryTime = data.restaurant.delivery_time || '30-45 min';
                    priceForTwo = data.restaurant.price_for_two || 500;
                    imageUrl = data.restaurant.image_url || '/images/restaurants/default.jpg';
                    menuItems = data.menu || [];
                } else if (data.name && data.menu) {
                    restaurantName = data.name;
                    cuisine = data.cuisine || 'Various';
                    rating = data.rating || 4.0;
                    deliveryTime = data.delivery_time || '30-45 min';
                    priceForTwo = data.price_for_two || 500;
                    imageUrl = data.image_url || '/images/restaurants/default.jpg';
                    menuItems = data.menu || [];
                } else if (data.items) {
                    restaurantName = extractRestaurantName(file, merchantId, city);
                    menuItems = data.items || [];
                } else if (Array.isArray(data)) {
                    // Pure array of items
                    restaurantName = extractRestaurantName(file, merchantId, city);
                    menuItems = data;
                } else {
                    // Fallback
                    restaurantName = extractRestaurantName(file, merchantId, city);
                    menuItems = data.menu || data.items || [];
                }

                // If still empty, use fallback
                if (!restaurantName || restaurantName.trim() === '') {
                    restaurantName = `${merchantId.charAt(0).toUpperCase() + merchantId.slice(1)} - ${city.charAt(0).toUpperCase() + city.slice(1)}`;
                }

                // Infer cuisine if not set
                if (cuisine === 'Various' || !cuisine) {
                    cuisine = inferCuisine(menuItems, restaurantName);
                }

                console.log(`📝 ${restaurantName} (${menuItems.length} items, ${cuisine})`);

                // Insert restaurant
                const restaurant = {
                    merchant_id: merchantId,
                    name: restaurantName,
                    description: '',
                    rating: rating,
                    cuisine: cuisine,
                    delivery_time: deliveryTime,
                    price_for_two: priceForTwo,
                    location_city: city.toLowerCase(),
                    location_area: '',
                    image_url: imageUrl,
                    is_open: true,
                };

                const { data: insertedRest, error: restError } = await supabase
                    .from('restaurants')
                    .insert(restaurant)
                    .select();

                if (restError) {
                    console.error(`❌ Error inserting ${restaurantName}:`, restError);
                    continue;
                }

                const restaurantId = insertedRest[0].id;

                // Insert menu items
                if (menuItems && menuItems.length > 0) {
                    const menuRows = menuItems.map(item => ({
                        restaurant_id: restaurantId,
                        name: item.name || 'Unknown Item',
                        price: parseFloat(item.price) || 0,
                        category: item.category || 'Main',
                        description: item.description || '',
                        image_url: item.image_url || item.imageUrl || '/images/items/default.png',
                        is_veg: item.is_veg || false,
                        is_popular: item.is_popular || false,
                        unit: item.unit || 'piece',
                    }));

                    const { error: menuError } = await supabase
                        .from('menu_items')
                        .insert(menuRows);

                    if (menuError) {
                        console.error(`❌ Error inserting menu for ${restaurantName}:`, menuError);
                    } else {
                        console.log(`✅ ${menuRows.length} items for ${restaurantName}`);
                    }
                } else {
                    console.log(`⚠️ No menu items for ${restaurantName}`);
                }
            }
        }
    }
}

// ============================================
// GROCERY, MERCHANTS, RECHARGE, BILLERS
// ============================================
// ... (keep the same as before for these)
async function seedGroceryProducts() { /* ... */ }
async function seedMerchants() { /* ... */ }
async function seedRechargePlans() { /* ... */ }
async function seedBillers() { /* ... */ }

// ============================================
// RUN
// ============================================
async function run() {
    await seedMerchants();
    await seedRestaurantsAndMenus();
    await seedGroceryProducts();
    await seedRechargePlans();
    await seedBillers();
    console.log('✅ All catalog data seeded successfully!');
}

run().catch(console.error);