
const axios = require('axios');

async function testSystemEndpoints() {
    const baseUrl = 'http://localhost:8080/api/v1/system';

    try {
        // 1. Get Status
        console.log('Checking system status...');
        const statusResponse = await axios.get(`${baseUrl}/status`);
        console.log('Status:', statusResponse.data);

        // 2. Enable Maintenance
        console.log('Enabling maintenance mode...');
        const enableResponse = await axios.post(`${baseUrl}/maintenance`, { enabled: true });
        console.log('Enable Response:', enableResponse.data);

        // 3. Verify Status
        console.log('Verifying status (should be maintenance)...');
        const statusResponse2 = await axios.get(`${baseUrl}/status`);
        console.log('Status:', statusResponse2.data);

        // 4. Disable Maintenance
        console.log('Disabling maintenance mode...');
        const disableResponse = await axios.post(`${baseUrl}/maintenance`, { enabled: false });
        console.log('Disable Response:', disableResponse.data);

        // 5. Verify Status
        console.log('Verifying status (should be normal)...');
        const statusResponse3 = await axios.get(`${baseUrl}/status`);
        console.log('Status:', statusResponse3.data);

    } catch (error) {
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received. Request details:', error.request);
        } else {
            console.error('Error Config:', error.config);
        }
    }
}

testSystemEndpoints();
