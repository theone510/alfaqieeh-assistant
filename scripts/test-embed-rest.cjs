
const https = require('https');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const key = process.env.GEMINI_API_KEY;
const model = 'models/text-embedding-004';
const url = `https://generativelanguage.googleapis.com/v1beta/${model}:embedContent?key=${key}`;

const data = JSON.stringify({
    content: {
        parts: [{ text: "Hello world" }]
    }
});

console.log(`Testing Embedding via REST: ${model}`);

const req = https.request(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => responseBody += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
            const json = JSON.parse(responseBody);
            if (json.embedding) {
                console.log('✅ Success! Embedding generated.');
                console.log('First 5 values:', json.embedding.values.slice(0, 5));
            } else {
                console.log('❌ Response OK but no embedding:', responseBody);
            }
        } else {
            console.log('❌ Failed:', responseBody);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Request Error: ${e.message}`);
});

req.write(data);
req.end();
