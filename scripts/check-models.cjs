
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function list() {
    try {
        // Note: The Node SDK might not expose listModels directly on genAI instance in all versions
        // But let's try to use the model manager if available in the version installed.
        // If not, we might need to rely on documentation, but let's try a simple fetch to the API directly if SDK fails.

        // Actually, checking standard Gemini availability.
        // Let's try to 'countTokens' on a model to see if it responds, for a few candidates.

        const candidates = ["embedding-001", "text-embedding-004", "models/embedding-001", "models/text-embedding-004"];

        console.log("Checking model availability...");

        for (const m of candidates) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.embedContent("Hello world");
                console.log(`✅ Model '${m}' is WORKING!`);
                console.log(`   Dimensions: ${result.embedding.values.length}`);
                return; // Exit after finding a working one
            } catch (error) {
                console.log(`❌ Model '${m}' failed: ${error.message.split('\n')[0]}`);
            }
        }
    } catch (error) {
        console.error("Script error:", error);
    }
}

list();
