// backend/test-real-gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    // Put your NEW API key here
    const API_KEY = 'AIzaSyC2YN6Adr0hM9yjM733VFNfFrkXpWklgWc';
    
    console.log('🔍 Testing with new API key...');
    
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const result = await model.generateContent("Say 'I am working!' in one sentence");
        const response = await result.response;
        console.log('✅ REAL GEMINI RESPONSE:', response.text());
        return true;
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        return false;
    }
}

testGemini();