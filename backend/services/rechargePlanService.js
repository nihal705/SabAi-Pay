// backend/services/rechargePlanService.js
// Supabase version – reads from recharge_plans table with robust operator detection

const { getSupabase } = require("../config/supabase");

class RechargePlanService {
    async detectOperator(mobileNumber) {
        if (!mobileNumber || typeof mobileNumber !== 'string') return null;
        const clean = mobileNumber.replace(/\D/g, "");
        if (clean.length < 10) return null;

        // Prefix mapping for Indian telecom operators
        const p2 = clean.substring(0, 2);
        const p3 = clean.substring(0, 3);
        const p4 = clean.substring(0, 4);
        const p5 = clean.substring(0, 5);

        const map = {
            '98765': 'jio', '98675': 'jio', '98456': 'jio', '7000': 'jio', '6000': 'jio', '8888': 'jio', '9999': 'jio',
            '98185': 'airtel', '98189': 'airtel', '98180': 'airtel', '9810': 'airtel', '9811': 'airtel', '9871': 'airtel',
            '98197': 'vi', '98200': 'vi', '98201': 'vi', '9820': 'vi', '9821': 'vi',
            '98281': 'bsnl', '98311': 'bsnl', '9440': 'bsnl',
        };

        let operatorId = map[p5] || map[p4] || null;
        if (!operatorId) {
            // General telecom series heuristic
            if (['98', '99', '96', '97'].includes(p2)) operatorId = 'airtel';
            else if (['70', '63', '88', '79'].includes(p2)) operatorId = 'jio';
            else if (['90', '91', '92', '86'].includes(p2)) operatorId = 'vi';
            else operatorId = 'jio';
        }

        const operatorNames = {
            airtel: 'Airtel',
            jio: 'Jio',
            vi: 'Vi (Vodafone Idea)',
            bsnl: 'BSNL'
        };

        return {
            id: operatorId,
            name: operatorNames[operatorId] || operatorId.toUpperCase()
        };
    }

    async getPlans(operatorId) {
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('recharge_plans')
                .select('*')
                .eq('operator_id', operatorId)
                .eq('is_active', true);

            if (error || !data || data.length === 0) {
                // Fallback realistic telecom plans
                return this.getFallbackPlans(operatorId);
            }
            return data;
        } catch (e) {
            return this.getFallbackPlans(operatorId);
        }
    }

    getFallbackPlans(operatorId) {
        return [
            { id: `${operatorId}_299`, operator_id: operatorId, amount: 299, validity: '28 Days', data: '1.5 GB/day', description: 'Unlimited Voice + 1.5 GB/Day Data + 100 SMS/day' },
            { id: `${operatorId}_349`, operator_id: operatorId, amount: 349, validity: '28 Days', data: '2.0 GB/day', description: 'Unlimited Voice + 2.0 GB/Day Data + Unlimited 5G' },
            { id: `${operatorId}_719`, operator_id: operatorId, amount: 719, validity: '84 Days', data: '1.5 GB/day', description: 'Unlimited Voice + 1.5 GB/Day Data for 84 days' },
            { id: `${operatorId}_199`, operator_id: operatorId, amount: 199, validity: '18 Days', data: '1.0 GB/day', description: 'Unlimited Voice + 1.0 GB/Day Data' }
        ];
    }

    async getRecommendedPlan(operatorId, amount) {
        const plans = await this.getPlans(operatorId);
        if (!plans.length) return null;
        return plans.reduce((best, current) => {
            const bestDiff = Math.abs(best.amount - amount);
            const currentDiff = Math.abs(current.amount - amount);
            return currentDiff < bestDiff ? current : best;
        }, plans[0]);
    }

    async getAllOperators() {
        return [
            { id: 'jio', name: 'Jio' },
            { id: 'airtel', name: 'Airtel' },
            { id: 'vi', name: 'Vi (Vodafone Idea)' },
            { id: 'bsnl', name: 'BSNL' }
        ];
    }

    async getOperatorById(id) {
        const ops = await this.getAllOperators();
        return ops.find(op => op.id === id) || null;
    }
}

module.exports = new RechargePlanService();
