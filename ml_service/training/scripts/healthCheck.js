// backend/scripts/healthCheck.js
const axios = require('axios');

async function healthCheck() {
    const services = [
        { name: 'Backend', url: 'http://localhost:5000/health' },
        { name: 'ML Service', url: 'http://localhost:5001/health' },
        { name: 'MySQL', url: 'http://localhost:3306' },
        { name: 'Redis', url: 'http://localhost:6379' }
    ];
    
    for (const service of services) {
        try {
            const response = await axios.get(service.url, { timeout: 5000 });
            console.log(`✅ ${service.name}: ${response.status}`);
        } catch (error) {
            console.log(`❌ ${service.name}: DOWN`);
        }
    }
}

healthCheck();