// scripts/seedGroceryOnly.js
// Dedicated script to seed Zepto, Blinkit, BigBasket (and any grocery merchant)

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
// CONFIG: List of grocery merchants to seed
// ============================================
const GROCERY_MERCHANTS = ['zepto', 'blinkit', 'bigbasket'];

// ============================================
// SEED GROCERY PRODUCTS
// ============================================
async function seedGroceryProducts() {
    console.log('🌱 Seeding grocery products (Zepto/Blinkit/BigBasket)...');
    const merchantsPath = path.join(__dirname, '../backend/data/merchants');

    for (const merchantId of GROCERY_MERCHANTS) {
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
            const productsPath = path.join(locationsPath, city, 'products.json');
            if (!fs.existsSync(productsPath)) {
                console.log(`⚠️ No products.json for ${merchantId}/${city}, skipping...`);
                continue;
            }

            let products;
            try {
                products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
            } catch (e) {
                console.error(`❌ Error parsing ${productsPath}:`, e.message);
                continue;
            }

            if (!Array.isArray(products) || products.length === 0) {
                console.log(`⚠️ No products found in ${productsPath}, skipping...`);
                continue;
            }

            // Create a single "store" per city
            const storeName = `${merchantId.charAt(0).toUpperCase() + merchantId.slice(1)} - ${city.charAt(0).toUpperCase() + city.slice(1)}`;
            const store = {
                merchant_id: merchantId,
                name: storeName,
                description: `Products from ${merchantId} in ${city}`,
                rating: 4.0,
                cuisine: 'Grocery',
                delivery_time: '10-30 min',
                price_for_two: 0,
                location_city: city.toLowerCase(),
                location_area: '',
                image_url: `/images/merchants/${merchantId}.png`,
                is_open: true,
            };

            const { data: insertedStore, error: storeError } = await supabase
                .from('restaurants')
                .insert(store)
                .select();

            if (storeError) {
                console.error(`❌ Error inserting store ${storeName}:`, storeError);
                continue;
            }

            const storeId = insertedStore[0].id;

            // Insert products as menu items
            const menuRows = products.map(item => ({
                restaurant_id: storeId,
                name: item.name || item.title || 'Unknown Product',
                price: parseFloat(item.price) || 0,
                category: item.category || item.type || 'Grocery',
                description: item.description || '',
                image_url: item.image_url || item.image || '/images/items/default.png',
                is_veg: item.is_veg || false,
                is_popular: item.is_popular || false,
                unit: item.unit || 'piece',
            }));

            const { error: menuError } = await supabase
                .from('menu_items')
                .insert(menuRows);

            if (menuError) {
                console.error(`❌ Error inserting products for ${storeName}:`, menuError);
            } else {
                console.log(`✅ Seeded ${menuRows.length} products for ${storeName}`);
            }
        }
    }
}

// ============================================
// ALSO ENSURE MERCHANTS EXIST
// ============================================
async function ensureMerchants() {
    console.log('🔍 Ensuring grocery merchants exist...');
    const merchants = GROCERY_MERCHANTS.map(id => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        category: 'quick_commerce',
        logo_url: `/images/merchants/${id}.png`,
        is_active: true,
    }));
    for (const m of merchants) {
        const { error } = await supabase.from('merchants').upsert(m, { onConflict: 'id' });
        if (error) console.error(`Error upserting merchant ${m.id}:`, error);
        else console.log(`✅ Merchant ${m.id} ensured`);
    }
}

// ============================================
// RUN
// ============================================
async function run() {
    await ensureMerchants();
    await seedGroceryProducts();
    console.log('✅ Grocery seeding completed!');
}

run().catch(console.error);