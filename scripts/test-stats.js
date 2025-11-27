const axios = require('axios');

const API_URL = 'http://localhost:8080/api/v1/system/stats';

async function testStats() {
    console.log(`🚀 Testing System Stats Endpoint: ${API_URL}`);

    try {
        const response = await axios.get(API_URL);

        if (response.status === 200 && response.data.success) {
            console.log('✅ Stats retrieved successfully!');
            console.log(JSON.stringify(response.data.data, null, 2));
        } else {
            console.error('❌ Failed to retrieve stats:', response.data);
        }
    } catch (error) {
        console.error('❌ Error calling stats endpoint:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testStats();
