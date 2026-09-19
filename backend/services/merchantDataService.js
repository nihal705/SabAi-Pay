// backend/services/merchantDataService.js
// Supabase version – reads from merchants, restaurants, menu_items tables

const { getSupabase } = require("../config/supabase");

class MerchantDataService {
    async getMerchantData(merchant, city = null, area = null, searchTerm = null, filters = {}) {
        const supabase = getSupabase();

        // 1. Check if merchant exists
        const { data: merchantData, error: merchantError } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', merchant)
            .maybeSingle();

        if (merchantError || !merchantData) {
            return { type: 'error', message: 'Merchant not supported' };
        }

        // 2. If searchTerm is provided, search menu items
        if (searchTerm && searchTerm !== 'null' && searchTerm !== 'undefined') {
            let query = supabase
                .from('menu_items')
                .select(`
                    *,
                    restaurants (
                        id,
                        name,
                        rating,
                        delivery_time,
                        image_url,
                        location_city,
                        location_area
                    )
                `)
                .eq('restaurants.merchant_id', merchant)
                .ilike('name', `%${searchTerm}%`);

            if (city) {
                query = query.eq('restaurants.location_city', city);
            }
            if (area) {
                query = query.ilike('restaurants.location_area', `%${area}%`);
            }

            const { data: items, error } = await query.limit(50);

            if (error) {
                console.error('Search error:', error);
                return { type: 'no_results', items: [] };
            }

            return {
                type: 'search_results',
                merchant,
                query: searchTerm,
                items: items || [],
                total: items?.length || 0,
            };
        }

        // 3. If city is provided, return restaurants
        if (city) {
            let query = supabase
                .from('restaurants')
                .select('*')
                .eq('merchant_id', merchant)
                .eq('location_city', city.toLowerCase());

            if (area) {
                query = query.ilike('location_area', `%${area}%`);
            }

            const { data: restaurants, error } = await query.limit(50);

            if (error) {
                console.error('Restaurant fetch error:', error);
                return { type: 'no_results', restaurants: [] };
            }

            return {
                type: 'restaurants_list',
                merchant,
                city,
                area,
                restaurants: restaurants || [],
                total: restaurants?.length || 0,
                canSelect: true,
            };
        }

        // 4. No city – ask for location
        const { data: cities } = await supabase
            .from('restaurants')
            .select('location_city')
            .eq('merchant_id', merchant)
            .not('location_city', 'is', null);

        const uniqueCities = [...new Set(cities?.map(c => c.location_city) || [])];

        return {
            type: 'cities_list',
            merchant,
            cities: uniqueCities.map(c => ({ name: c, displayName: c.charAt(0).toUpperCase() + c.slice(1) })),
            message: `Please select your city to see restaurants on ${merchant}`,
            requiresLocation: true,
        };
    }

    async getRestaurantMenu(merchant, city, restaurantId) {
        const supabase = getSupabase();
        const { data: menu, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', restaurantId);

        if (error) {
            console.error('Menu fetch error:', error);
            return [];
        }
        return menu || [];
    }
}

module.exports = new MerchantDataService();