// backend/services/rechargePlanService.js
// Supabase version – reads from recharge_plans table

const { getSupabase } = require("../config/supabase");

class RechargePlanService {
    async detectOperator(mobileNumber) {
        // Simple prefix‑based detection (fallback if DB lookup fails)
        const prefix = mobileNumber.substring(0, 4);
        const map = {
            '98765': 'jio', '98675': 'jio', '98456': 'jio',
            '98185': 'airtel', '98189': 'airtel', '98180': 'airtel',
            '98197': 'vi', '98200': 'vi', '98201': 'vi',
            '98281': 'bsnl', '98311': 'bsnl',
        };
        const id = map[prefix] || null;
        if (!id) return null;

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('recharge_plans')
            .select('operator_name')
            .eq('operator_id', id)
            .limit(1)
            .maybeSingle();

        if (error || !data) return null;
        return { id, name: data.operator_name };
    }

    async getPlans(operatorId) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('recharge_plans')
            .select('*')
            .eq('operator_id', operatorId)
            .eq('is_active', true);

        if (error) {
            console.error('Get plans error:', error);
            return [];
        }
        return data || [];
    }

    // Helper to get recommended plan based on amount
    async getRecommendedPlan(operatorId, amount) {
        const plans = await this.getPlans(operatorId);
        if (!plans.length) return null;
        return plans.reduce((best, current) => {
            const bestDiff = Math.abs(best.amount - amount);
            const currentDiff = Math.abs(current.amount - amount);
            return currentDiff < bestDiff ? current : best;
        }, plans[0]);
    }

    // Get all operators (from distinct operator_id/name)
    async getAllOperators() {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('recharge_plans')
            .select('operator_id, operator_name')
            .eq('is_active', true);

        if (error || !data) return [];
        const ops = {};
        data.forEach(row => {
            if (!ops[row.operator_id]) {
                ops[row.operator_id] = { id: row.operator_id, name: row.operator_name };
            }
        });
        return Object.values(ops);
    }

    async getOperatorById(id) {
        const ops = await this.getAllOperators();
        return ops.find(op => op.id === id) || null;
    }
}

module.exports = new RechargePlanService();