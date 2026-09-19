// backend/services/merchantLocationService.js
// Supabase version

const { getSupabase } = require("../config/supabase");

class MerchantLocationService {
    async getRestaurantsByLocation(merchant, city, area = null) {
        const supabase = getSupabase();
        let query = supabase
            .from('restaurants')
            .select('*')
            .eq('merchant_id', merchant)
            .eq('location_city', city.toLowerCase());

        if (area) {
            query = query.ilike('location_area', `%${area}%`);
        }

        const { data, error } = await query.limit(30);
        if (error) {
            console.error('Get restaurants error:', error);
            return [];
        }
        return data || [];
    }

    async getRestaurantMenu(merchant, city, restaurantId) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', restaurantId);

        if (error) {
            console.error('Menu error:', error);
            return [];
        }
        return data || [];
    }

    async searchItems(merchant, city, searchTerm, area = null) {
        const supabase = getSupabase();
        let query = supabase
            .from('menu_items')
            .select(`
                *,
                restaurants (
                    name,
                    location_area,
                    rating,
                    delivery_time
                )
            `)
            .eq('restaurants.merchant_id', merchant)
            .eq('restaurants.location_city', city.toLowerCase())
            .ilike('name', `%${searchTerm}%`);

        if (area) {
            query = query.ilike('restaurants.location_area', `%${area}%`);
        }

        const { data, error } = await query.limit(30);
        if (error) {
            console.error('Search items error:', error);
            return [];
        }
        return data || [];
    }

    // For validation, we simply check if the city exists for the merchant
    async validateLocation(merchant, address, cityName = null) {
        const supabase = getSupabase();
        let query = supabase
            .from('restaurants')
            .select('location_city')
            .eq('merchant_id', merchant);

        if (cityName) {
            query = query.eq('location_city', cityName.toLowerCase());
        }

        const { data, error } = await query.limit(1);

        if (error || !data || data.length === 0) {
            // Check if merchant has any city
            const { data: allCities } = await supabase
                .from('restaurants')
                .select('location_city')
                .eq('merchant_id', merchant)
                .not('location_city', 'is', null)
                .limit(10);

            const availableCities = [...new Set(allCities?.map(c => c.location_city) || [])];

            return {
                valid: false,
                message: cityName
                    ? `${merchant} does not deliver to "${cityName}". Available cities: ${availableCities.join(', ')}`
                    : `Please provide a city for ${merchant}. Available cities: ${availableCities.join(', ')}`,
                availableCities,
            };
        }

        return {
            valid: true,
            city: cityName || data[0].location_city,
            message: `${merchant} delivers to ${cityName || data[0].location_city}`,
        };
    }
}

module.exports = new MerchantLocationService();