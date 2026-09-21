// backend/services/billerCatalogService.js
// Supabase version – reads from billers table

const { getSupabase } = require("../config/supabase");

class BillerCatalogService {
    async getAllBillers() {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('billers')
            .select('*')
            .eq('is_active', true);

        if (error) {
            console.error('Get billers error:', error);
            return [];
        }
        return data || [];
    }

    async getBillersByCategory(category) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('billers')
            .select('*')
            .eq('category', category)
            .eq('is_active', true);

        if (error) {
            console.error('Get billers by category error:', error);
            return [];
        }
        return data || [];
    }

    async getBillerById(id) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('billers')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('Get biller by id error:', error);
            return null;
        }
        return data;
    }

    async getBillerByName(name) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('billers')
            .select('*')
            .ilike('name', `%${name}%`)
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Get biller by name error:', error);
            return null;
        }
        return data;
    }

    async getCategories() {
        const billers = await this.getAllBillers();
        const categories = {};
        billers.forEach(b => {
            if (!categories[b.category]) {
                categories[b.category] = {
                    id: b.category,
                    name: b.category_display || b.category,
                    billers: []
                };
            }
            categories[b.category].billers.push(b);
        });
        return Object.values(categories);
    }

    async getBillersForCategory(categoryId) {
        return this.getBillersByCategory(categoryId);
    }
}

module.exports = new BillerCatalogService();