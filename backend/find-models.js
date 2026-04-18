// backend/find-models.js
// This will list all available models for your API key

async function findModels() {
    const API_KEY = 'AIzaSyBxj83yPwMz-0LpnKNE9Xv_FJ66gZB9Iag'; // Your key
    
    try {
        // Use the correct endpoint to list models
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        const data = await response.json();
        
        if (data.models) {
            console.log('✅ Available models:\n');
            data.models.forEach(model => {
                console.log(`📌 ${model.name}`);
                console.log(`   Display name: ${model.displayName}`);
                console.log(`   Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
                console.log('---');
            });
        } else {
            console.log('❌ No models found. Response:', data);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

findModels();