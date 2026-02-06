
const https = require('https');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const key = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

console.log(`Querying: ${url.replace(key, 'HIDDEN_KEY')}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('--- Response Status:', res.statusCode, '---');
            if (json.models) {
                console.log('✅ Found Models:');
                json.models.forEach(m => console.log(` - ${m.name} [Methods: ${m.supportedGenerationMethods.join(', ')}]`));
            } else {
                console.log('❌ No models property in response:', JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.log('❌ Failed to parse response:', data);
        }
    });
}).on('error', (err) => {
    console.log('❌ Request Error:', err.message);
});
