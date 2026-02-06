
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Configuration ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
    console.error('❌ Missing environment variables. Please check .env.local');
    process.exit(1);
}

// Initialize Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

const DATA_DIR = path.resolve(__dirname, '../sistani');
const BATCH_SIZE = 5; // Process 5 items at a time to avoid rate limits

// --- Helper Functions ---

function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
}

async function generateEmbedding(text) {
    try {
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Error generating embedding:', error.message);
        return null;
    }
}

// Extract logical parts (Source, Section, Question Number)
function extractMetadata(item, filename) {
    const source = filename.replace('.json', '');
    const title = item.title || item.Title || '';
    const text = item.text || item.Text || item.Field2 || item.content || '';

    // Extract Question Number
    const questionMatch = text.match(/\(مسألة\s*(\d+)\)/);
    const questionNumber = questionMatch ? `مسألة ${questionMatch[1]}` : undefined;

    // Extract URL
    let sourceUrl = undefined;
    if (item.Title_URL && item.Title_URL.includes('sistani.org')) {
        sourceUrl = item.Title_URL;
    } else if (item.Field2 && typeof item.Field2 === 'string') {
        const urlMatch = item.Field2.match(/sistani\.org\/(\d+)/);
        if (urlMatch) sourceUrl = `https://www.sistani.org/${urlMatch[1]}`;
    }

    // Extract Section
    const section = item.Field1 || item.section || undefined;

    return {
        source,
        title,
        text,
        metadata: {
            source,
            title,
            section,
            questionNumber,
            sourceUrl
        }
    };
}

async function processFile(filename) {
    console.log(`\n📂 Processing: ${filename}`);
    const filePath = path.join(DATA_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let data;

    try {
        data = JSON.parse(fileContent);
    } catch (e) {
        console.error(`❌ Failed to parse JSON: ${filename}`);
        return;
    }

    if (!Array.isArray(data)) return;

    let recordsToInsert = [];

    for (const item of data) {
        const { text, metadata } = extractMetadata(item, filename);

        if (!text || text.length < 10) continue; // Skip empty/short items

        // Simple chunking if text is too long (approx > 8000 chars)
        const processedText = cleanText(text).substring(0, 8000);

        recordsToInsert.push({
            content: processedText,
            metadata: metadata,
            raw_text: processedText // Store text for generation context
        });
    }

    console.log(`   Found ${recordsToInsert.length} items. Uploading in batches...`);

    // Process in batches
    for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
        const batch = recordsToInsert.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (record) => {
            // Check if exists to avoid duplicates (optional, based on metadata/content)
            // For now, straight insert

            const embedding = await generateEmbedding(record.raw_text);

            if (embedding) {
                const { error } = await supabase.from('fatwas').insert({
                    content: record.raw_text,
                    metadata: record.metadata,
                    embedding: embedding
                });

                if (error) console.error('   ❌ Insert error:', error.message);
            }
            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
        }));

        process.stdout.write('.');
    }
    console.log(' ✅ Done.');
}

// --- Main Execution ---
async function main() {
    // Determine files to process
    if (!fs.existsSync(DATA_DIR)) {
        console.error(`❌ Data directory not found: ${DATA_DIR}`);
        return;
    }

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

    console.log(`🚀 Starting ingestion for ${files.length} files...`);

    for (const file of files) {
        await processFile(file);
    }

    console.log('\n🎉 All Data Ingestion Complete!');
}

main();
