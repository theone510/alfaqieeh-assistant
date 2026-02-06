
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const key = process.env.GEMINI_API_KEY;

async function testConfig(configName, apiVersion, modelName, method) {
    console.log(`\n--- Testing: ${configName} [Model: ${modelName}, API: ${apiVersion || 'default'}] ---`);
    try {
        const genAI = new GoogleGenerativeAI(key);
        // Note: SDK doesn't always expose apiVersion in constructor publicly in all versions, 
        // but let's try to infer if we can pass it or if we need to hack the url.
        // Actually, the SDK url construction relies on the model.

        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: apiVersion });

        if (method === 'generate') {
            const result = await model.generateContent('Hello');
            console.log(`✅ Success! Response: ${result.response.text().substring(0, 20)}...`);
            return true;
        } else {
            const result = await model.embedContent('Hello world');
            console.log(`✅ Success! Embedding dims: ${result.embedding.values.length}`);
            return true;
        }
    } catch (error) {
        console.log(`❌ Failed: ${error.message.split('\n')[0]}`);
        return false;
    }
}

async function main() {
    console.log("🔍 Starting Comprehensive Diagnostic...");

    // 1. Test Key Validity with Generation
    await testConfig("Generation Check", undefined, "gemini-1.5-flash", "generate");

    // 2. Test Embedding 001 Default
    await testConfig("Embedding 001 (Default)", undefined, "embedding-001", "embed");

    // 3. Test Embedding 001 v1
    await testConfig("Embedding 001 (v1)", "v1", "embedding-001", "embed");

    // 4. Test Text Embedding 004
    await testConfig("Text Embedding 004 (Default)", undefined, "text-embedding-004", "embed");

    // 5. Test Models Prefix
    await testConfig("Models Prefix (v1beta)", "v1beta", "models/embedding-001", "embed");
}

main();
