const axios = require('axios');

const API_URL = 'http://localhost:8080/api/v1/health';
const TOTAL_REQUESTS = 110;

async function runStressTest() {
    console.log(`🚀 Starting stress test: ${TOTAL_REQUESTS} requests to ${API_URL}`);

    let successCount = 0;
    let rateLimitCount = 0;
    let errorCount = 0;

    const requests = [];

    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        requests.push(
            axios.get(API_URL)
                .then(() => {
                    process.stdout.write('.');
                    successCount++;
                })
                .catch((error) => {
                    if (error.response && error.response.status === 429) {
                        process.stdout.write('x');
                        rateLimitCount++;
                    } else {
                        process.stdout.write('E');
                        errorCount++;
                        console.error('\nError:', error.message);
                    }
                })
        );
    }

    await Promise.all(requests);

    console.log('\n\n📊 Results:');
    console.log(`✅ Success (200 OK): ${successCount}`);
    console.log(`⛔ Rate Limited (429): ${rateLimitCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    if (rateLimitCount > 0) {
        console.log('\n✅ Rate limiting is WORKING!');
    } else {
        console.log('\n❌ Rate limiting is NOT working (or limit not reached).');
    }
}

runStressTest();
