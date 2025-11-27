const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const styleSchema = new mongoose.Schema({
    styleId: String,
    name: String,
    description: String,
    imageUrl: String,
    category: String,
    isActive: Boolean
});

const Style = mongoose.model('Style', styleSchema);

async function checkStyles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const count = await Style.countDocuments();
        console.log(`TOTAL_STYLES: ${count}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkStyles();
