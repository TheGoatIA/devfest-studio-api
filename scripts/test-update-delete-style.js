
const axios = require('axios');

async function testUpdateDeleteStyle() {
    const baseUrl = 'http://localhost:8080/api/v1/styles';
    let styleId;

    try {
        // 1. Create a style first
        console.log('Creating a style...');
        const createResponse = await axios.post(baseUrl, {
            name: 'To Be Deleted',
            nameFr: 'A supprimer',
            nameEn: 'To Be Deleted',
            category: 'thematic',
            description: 'Temporary style',
            descriptionFr: 'Style temporaire',
            descriptionEn: 'Temporary style',
            images: {
                previewUrl: 'http://example.com/p.jpg',
                thumbnailUrl: 'http://example.com/t.jpg',
                mediumUrl: 'http://example.com/m.jpg',
                largeUrl: 'http://example.com/l.jpg'
            },
            technical: {
                modelVersion: 'v1',
                processingComplexity: 'low',
                estimatedProcessingTime: 1,
                requiredMemory: 128
            },
            geminiConfig: {
                prompt: 'temp',
                model: 'gemini-2.5-flash-image'
            }
        });
        styleId = createResponse.data.data.styleId;
        console.log('Style created:', styleId);

        // 2. Update the style
        console.log('Updating the style...');
        const updateResponse = await axios.put(`${baseUrl}/${styleId}`, {
            name: 'Updated Name',
            description: 'Updated description'
        });
        console.log('Update Status:', updateResponse.status);
        console.log('Updated Name:', updateResponse.data.data.name);

        // 3. Delete the style
        console.log('Deleting the style...');
        const deleteResponse = await axios.delete(`${baseUrl}/${styleId}`);
        console.log('Delete Status:', deleteResponse.status);

        // 4. Verify deletion (should fail or return 404 if we try to get it, but getStyleById might return it if not filtered out correctly or if we check db directly. The API usually filters out inactive styles)
        console.log('Verifying deletion...');
        try {
            await axios.get(`${baseUrl}/${styleId}`);
            console.log('Style still exists (unexpected if delete is soft-delete and get filters it)');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Style correctly not found (404)');
            } else {
                console.log('Error checking style:', error.message);
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testUpdateDeleteStyle();
