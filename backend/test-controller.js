// backend/test-controller.js
console.log('🔍 Testing controller loading...');

try {
    const controller = require('./controllers/agentOrderController');
    console.log('✅ Controller loaded successfully');
    console.log('📊 Controller methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(controller)));
    console.log('🔍 Has detectMerchantFromMessage:', typeof controller.detectMerchantFromMessage === 'function');
} catch (error) {
    console.error('❌ Error loading controller:', error);
}