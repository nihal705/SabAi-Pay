// backend/services/billerCatalogService.js
// Normalizes the list of supported billers

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 */

class BillerCatalogService {
    constructor() {
        this.billers = this.buildCatalog();
        this.billerMap = new Map();
        this.billers.forEach(b => this.billerMap.set(b.id, b));
    }

    buildCatalog() {
        return [
            // ============================================
            // ELECTRICITY
            // ============================================
            {
                id: 'tata_power',
                name: 'Tata Power',
                category: 'electricity',
                categoryName: 'Electricity',
                icon: '⚡',
                supportsFetch: true,
                customerIdLabel: 'Consumer Number',
                customerIdPlaceholder: 'Enter 10-digit consumer number',
                providers: ['Tata Power Mumbai', 'Tata Power Delhi', 'Tata Power Bangalore']
            },
            {
                id: 'adani_electricity',
                name: 'Adani Electricity',
                category: 'electricity',
                categoryName: 'Electricity',
                icon: '⚡',
                supportsFetch: true,
                customerIdLabel: 'Consumer Number',
                customerIdPlaceholder: 'Enter 12-digit consumer number',
                providers: ['Adani Electricity Mumbai']
            },
            {
                id: 'bses',
                name: 'BSES',
                category: 'electricity',
                categoryName: 'Electricity',
                icon: '⚡',
                supportsFetch: true,
                customerIdLabel: 'Consumer Number',
                customerIdPlaceholder: 'Enter 10-digit consumer number',
                providers: ['BSES Rajdhani', 'BSES Yamuna']
            },
            {
                id: 'torrent_power',
                name: 'Torrent Power',
                category: 'electricity',
                categoryName: 'Electricity',
                icon: '⚡',
                supportsFetch: true,
                customerIdLabel: 'Consumer Number',
                customerIdPlaceholder: 'Enter 10-digit consumer number',
                providers: ['Torrent Power Ahmedabad', 'Torrent Power Surat']
            },

            // ============================================
            // MOBILE
            // ============================================
            {
                id: 'airtel',
                name: 'Airtel',
                category: 'mobile',
                categoryName: 'Mobile',
                icon: '📱',
                supportsFetch: false,
                customerIdLabel: 'Mobile Number',
                customerIdPlaceholder: 'Enter 10-digit mobile number',
                providers: ['Airtel']
            },
            {
                id: 'jio',
                name: 'Jio',
                category: 'mobile',
                categoryName: 'Mobile',
                icon: '📱',
                supportsFetch: false,
                customerIdLabel: 'Mobile Number',
                customerIdPlaceholder: 'Enter 10-digit mobile number',
                providers: ['Jio']
            },
            {
                id: 'vi',
                name: 'Vi (Vodafone Idea)',
                category: 'mobile',
                categoryName: 'Mobile',
                icon: '📱',
                supportsFetch: false,
                customerIdLabel: 'Mobile Number',
                customerIdPlaceholder: 'Enter 10-digit mobile number',
                providers: ['Vi']
            },
            {
                id: 'bsnl',
                name: 'BSNL',
                category: 'mobile',
                categoryName: 'Mobile',
                icon: '📱',
                supportsFetch: false,
                customerIdLabel: 'Mobile Number',
                customerIdPlaceholder: 'Enter 10-digit mobile number',
                providers: ['BSNL']
            },

            // ============================================
            // BROADBAND
            // ============================================
            {
                id: 'jio_fiber',
                name: 'JioFiber',
                category: 'broadband',
                categoryName: 'Broadband',
                icon: '🌐',
                supportsFetch: false,
                customerIdLabel: 'Customer ID',
                customerIdPlaceholder: 'Enter JioFiber customer ID',
                providers: ['JioFiber']
            },
            {
                id: 'airtel_xstream',
                name: 'Airtel Xstream',
                category: 'broadband',
                categoryName: 'Broadband',
                icon: '🌐',
                supportsFetch: false,
                customerIdLabel: 'Customer ID',
                customerIdPlaceholder: 'Enter Airtel customer ID',
                providers: ['Airtel Xstream']
            },
            {
                id: 'act',
                name: 'ACT Broadband',
                category: 'broadband',
                categoryName: 'Broadband',
                icon: '🌐',
                supportsFetch: false,
                customerIdLabel: 'Customer ID',
                customerIdPlaceholder: 'Enter ACT customer ID',
                providers: ['ACT Broadband']
            },
            {
                id: 'hathway',
                name: 'Hathway',
                category: 'broadband',
                categoryName: 'Broadband',
                icon: '🌐',
                supportsFetch: false,
                customerIdLabel: 'Customer ID',
                customerIdPlaceholder: 'Enter Hathway customer ID',
                providers: ['Hathway']
            },

            // ============================================
            // GAS
            // ============================================
            {
                id: 'hp_gas',
                name: 'HP Gas',
                category: 'gas',
                categoryName: 'Gas',
                icon: '🔥',
                supportsFetch: false,
                customerIdLabel: 'Consumer Number',
                customerIdPlaceholder: 'Enter HP Gas consumer number',
                providers: ['HP Gas']
            },
            {
                id: 'indane',
                name: 'Indane',
                category: 'gas',
                categoryName: 'Gas',
                icon: '🔥',
                supportsFetch: false,
                customerIdLabel: 'Consumer Number',
                customerIdPlaceholder: 'Enter Indane consumer number',
                providers: ['Indane']
            },
            {
                id: 'bharat_gas',
                name: 'Bharat Gas',
                category: 'gas',
                categoryName: 'Gas',
                icon: '🔥',
                supportsFetch: false,
                customerIdLabel: 'Consumer Number',
                customerIdPlaceholder: 'Enter Bharat Gas consumer number',
                providers: ['Bharat Gas']
            },

            // ============================================
            // CREDIT CARD
            // ============================================
            {
                id: 'hdfc_card',
                name: 'HDFC Credit Card',
                category: 'credit_card',
                categoryName: 'Credit Card',
                icon: '💳',
                supportsFetch: false,
                customerIdLabel: 'Card Number',
                customerIdPlaceholder: 'Enter last 4 digits of card',
                providers: ['HDFC']
            },
            {
                id: 'icici_card',
                name: 'ICICI Credit Card',
                category: 'credit_card',
                categoryName: 'Credit Card',
                icon: '💳',
                supportsFetch: false,
                customerIdLabel: 'Card Number',
                customerIdPlaceholder: 'Enter last 4 digits of card',
                providers: ['ICICI']
            },
            {
                id: 'sbi_card',
                name: 'SBI Credit Card',
                category: 'credit_card',
                categoryName: 'Credit Card',
                icon: '💳',
                supportsFetch: false,
                customerIdLabel: 'Card Number',
                customerIdPlaceholder: 'Enter last 4 digits of card',
                providers: ['SBI']
            },
            {
                id: 'axis_card',
                name: 'Axis Credit Card',
                category: 'credit_card',
                categoryName: 'Credit Card',
                icon: '💳',
                supportsFetch: false,
                customerIdLabel: 'Card Number',
                customerIdPlaceholder: 'Enter last 4 digits of card',
                providers: ['Axis']
            },

            // ============================================
            // WATER
            // ============================================
            {
                id: 'bmc_water',
                name: 'BMC Water',
                category: 'water',
                categoryName: 'Water',
                icon: '💧',
                supportsFetch: false,
                customerIdLabel: 'Consumer Number',
                customerIdPlaceholder: 'Enter BMC consumer number',
                providers: ['BMC']
            },
            {
                id: 'dwss_water',
                name: 'DWSS Water',
                category: 'water',
                categoryName: 'Water',
                icon: '💧',
                supportsFetch: false,
                customerIdLabel: 'Consumer Number',
                customerIdPlaceholder: 'Enter DWSS consumer number',
                providers: ['DWSS']
            }
        ];
    }

    getAllBillers() {
        return this.billers;
    }

    getBillersByCategory(category) {
        return this.billers.filter(b => b.category === category);
    }

    getBillerById(id) {
        return this.billerMap.get(id);
    }

    getBillerByName(name) {
        return this.billers.find(b => 
            b.name.toLowerCase() === name.toLowerCase() ||
            b.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    getCategories() {
        const categories = {};
        this.billers.forEach(b => {
            if (!categories[b.category]) {
                categories[b.category] = {
                    id: b.category,
                    name: b.categoryName,
                    billers: []
                };
            }
            categories[b.category].billers.push(b);
        });
        return Object.values(categories);
    }

    getBillersForCategory(categoryId) {
        return this.billers.filter(b => b.category === categoryId);
    }

    getBillerSuggestions(query) {
        const lowerQuery = query.toLowerCase();
        return this.billers.filter(b => 
            b.name.toLowerCase().includes(lowerQuery) ||
            b.categoryName.toLowerCase().includes(lowerQuery)
        ).slice(0, 10);
    }

    isBillerSupported(billerId) {
        return this.billerMap.has(billerId);
    }
}

module.exports = new BillerCatalogService();